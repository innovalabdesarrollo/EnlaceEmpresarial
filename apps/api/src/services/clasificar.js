import { config } from '../config.js';
import {
  Cliente,
  Documento,
  Clasificacion,
  Notificacion,
  Incidencia,
  ReglaClasificacion,
  Procesamiento,
  Revision,
} from '../models/index.js';
import { registrarEvento } from './historial.js';

async function cerrarProceso(proc, { estado, resumen = '', error = '' }) {
  if (!proc) return;
  proc.estado = estado;
  proc.finalizadoEn = new Date();
  proc.resultadoResumen = resumen;
  proc.mensajeError = error;
  await proc.save();
}

function matchCriterio(fileName, criterio) {
  const name = fileName || '';
  const raw = String(criterio || '').trim();
  if (!raw) return false;
  try {
    return new RegExp(raw, 'i').test(name);
  } catch {
    return name.toLowerCase().includes(raw.toLowerCase());
  }
}

async function aplicarReglas(fileName, clienteIdHint) {
  const reglas = await ReglaClasificacion.find({ activa: true })
    .sort({ prioridad: 1, createdAt: 1 })
    .lean();

  let carpeta = 'General';
  let boost = 0;
  const reasons = [];
  let matchedClienteId = null;

  for (const r of reglas) {
    if (!matchCriterio(fileName, r.criterio)) continue;
    // Reglas ligadas a cliente solo aplican si coincide el hint o aún no hay hint
    if (r.clienteId && clienteIdHint && r.clienteId !== clienteIdHint) continue;

    carpeta = r.carpetaDestino || carpeta;
    boost += Number(r.peso) || 0;
    reasons.push(`regla:${r.nombre}`);
    if (r.clienteId) matchedClienteId = r.clienteId;
    break; // primera por prioridad
  }

  return {
    carpeta,
    boost: Math.min(0.35, boost),
    ruleReasons: reasons.join('; '),
    matchedClienteId,
  };
}

function scoreMatch(fileName, cliente) {
  const name = (fileName || '').toLowerCase();
  let score = 0;
  const reasons = [];

  if (cliente.identificadorFiscal) {
    const rfc = cliente.identificadorFiscal.toLowerCase();
    if (rfc && name.includes(rfc)) {
      score += 0.55;
      reasons.push(`RFC ${cliente.identificadorFiscal}`);
    }
  }

  const tokens = (cliente.razonSocial || '')
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 3);
  let hits = 0;
  for (const t of tokens) {
    if (name.includes(t)) hits += 1;
  }
  if (tokens.length) {
    score += (hits / tokens.length) * 0.4;
    if (hits) reasons.push(`razón social ${hits}/${tokens.length}`);
  }

  return {
    score: Math.min(1, Number(score.toFixed(2))),
    reasons: reasons.join('; ') || 'sin coincidencias claras',
  };
}

/**
 * Clasificación mínima por nombre/RFC + reglas persistidas.
 * Emite notificaciones in-app de revisión o error (sin SMTP).
 */
export async function clasificarDocumento(documento, uploader) {
  const proc = await Procesamiento.create({
    documentoId: documento._id,
    tipoProceso: 'clasificacion',
    estado: 'iniciado',
  });

  const clientes = await Cliente.find({ estado: 'activo' }).lean();
  let best = null;

  for (const c of clientes) {
    const result = scoreMatch(documento.nombreArchivo, c);
    if (!best || result.score > best.score) {
      best = { ...result, cliente: c };
    }
  }

  if (uploader?.rol === 'cliente' && uploader.clienteId) {
    const propio = clientes.find((c) => c._id === uploader.clienteId);
    if (propio) {
      const result = scoreMatch(documento.nombreArchivo, propio);
      const boosted = Math.min(1, result.score + 0.25);
      if (!best || boosted >= (best.score || 0)) {
        best = { ...result, score: boosted, cliente: propio };
      }
    }
  }

  const reglas = await aplicarReglas(
    documento.nombreArchivo,
    best?.cliente?._id || uploader?.clienteId || null
  );

  if (reglas.matchedClienteId) {
    const porRegla = clientes.find((c) => c._id === reglas.matchedClienteId);
    if (porRegla) {
      const result = scoreMatch(documento.nombreArchivo, porRegla);
      const score = Math.min(1, Math.max(result.score, 0.2) + reglas.boost);
      if (!best || score >= (best.score || 0)) {
        best = {
          score: Number(score.toFixed(2)),
          reasons: [result.reasons, reglas.ruleReasons].filter(Boolean).join('; '),
          cliente: porRegla,
        };
      }
    }
  } else if (best) {
    best.score = Math.min(1, Number((best.score + reglas.boost).toFixed(2)));
    if (reglas.ruleReasons) {
      best.reasons = [best.reasons, reglas.ruleReasons].filter(Boolean).join('; ');
    }
  }

  const carpeta = reglas.carpeta || 'General';
  const email = uploader?.email;
  const instruccion =
    'Revisa el aviso en Avisos. El personal contable atenderá la bandeja de revisión.';

  if (!best || best.score < 0.15) {
    await Documento.findByIdAndUpdate(documento._id, {
      estado: 'error',
      requiereRevision: true,
    });
    await Clasificacion.create({
      documentoId: documento._id,
      clienteId: null,
      carpetaDestino: 'Sin clasificar',
      nivelConfianza: best?.score || 0,
      estadoRevision: 'pendiente_revision',
      observaciones: best?.reasons || 'sin coincidencias',
    });
    await Incidencia.create({
      documentoId: documento._id,
      tipo: 'error_clasificacion',
      descripcion: 'No se identificó cliente con suficiente evidencia',
      severidad: 'alta',
      estado: 'abierta',
    });
    if (email) {
      await Notificacion.create({
        documentId: documento._id,
        notificationType: 'error',
        title: 'No se pudo clasificar el documento',
        message: `${documento.nombreArchivo}: no se identificó el cliente. ${instruccion}`,
        recipientEmail: email,
        isRead: false,
        status: 'entregada',
      });
    }
    await registrarEvento({
      documentoId: documento._id,
      nombreArchivo: documento.nombreArchivo,
      tipoEvento: 'clasificacion',
      estado: 'error',
      detalle: 'Fallo de clasificación automática',
      actor: 'sistema',
    });
    await cerrarProceso(proc, {
      estado: 'fallido',
      error: 'No se identificó cliente con suficiente evidencia',
      resumen: best?.reasons || '',
    });
    return { ok: false, pendiente: true };
  }

  const pendiente = best.score < config.confidenceThreshold;
  await Clasificacion.create({
    documentoId: documento._id,
    clienteId: best.cliente._id,
    carpetaDestino: carpeta,
    nivelConfianza: best.score,
    estadoRevision: pendiente ? 'pendiente_revision' : 'automatica',
    observaciones: best.reasons,
  });

  await Documento.findByIdAndUpdate(documento._id, {
    clienteId: best.cliente._id,
    estado: pendiente ? 'en_revision' : 'clasificado',
    requiereRevision: pendiente,
    carpetaDestino: carpeta,
  });

  if (pendiente) {
    await Revision.create({
      documentoId: documento._id,
      estado: 'pendiente',
      clasificacionPropuesta: `${best.cliente.razonSocial} / ${carpeta}`,
      nivelConfianza: best.score,
      observaciones: best.reasons,
    });
  }

  if (pendiente && email) {
    await Notificacion.create({
      documentId: documento._id,
      notificationType: 'revision',
      title: 'Documento en revisión manual',
      message: `${documento.nombreArchivo}: confianza ${(best.score * 100).toFixed(0)}% (umbral ${(config.confidenceThreshold * 100).toFixed(0)}%). ${instruccion}`,
      recipientEmail: email,
      isRead: false,
      status: 'entregada',
    });
  }

  await registrarEvento({
    documentoId: documento._id,
    nombreArchivo: documento.nombreArchivo,
    tipoEvento: 'clasificacion',
    estado: pendiente ? 'en_revision' : 'clasificado',
    detalle: `Confianza ${best.score}; carpeta ${carpeta}; ${best.reasons}`,
    actor: 'sistema',
    destinatarioId: best.cliente._id,
  });

  await cerrarProceso(proc, {
    estado: 'completado',
    resumen: `score=${best.score}; carpeta=${carpeta}; pendiente=${pendiente}`,
  });

  return { ok: true, pendiente, score: best.score, carpeta };
}
