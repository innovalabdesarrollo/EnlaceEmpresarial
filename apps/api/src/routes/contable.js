import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { requireAuth, requireRol } from '../middleware/auth.js';
import { config } from '../config.js';
import {
  Cliente,
  Cuenta,
  Documento,
  Clasificacion,
  Historial,
  Incidencia,
  Envio,
  Notificacion,
  Observacion,
  ReglaClasificacion,
  Carpeta,
  Revision,
} from '../models/index.js';
import { registrarEvento } from '../services/historial.js';
import { clasificarDocumento } from '../services/clasificar.js';
import { resolverAsuntoEnvio } from '../services/asunto.js';
import { mailStatus, sendDocumentoEmail, smtpConfigured } from '../services/mail.js';
import { sharepointStatus, syncSharepointStub } from '../services/sharepoint.js';

const router = Router();
router.use(requireAuth, requireRol('contable'));

function emailOk(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}

router.get('/clientes', async (req, res) => {
  const filter = {};
  if (req.query.estado) filter.estado = String(req.query.estado);
  else if (req.query.incluirBaja !== '1') filter.estado = { $ne: 'baja' };
  const clientes = await Cliente.find(filter).sort({ razonSocial: 1 }).lean();
  res.json({ clientes });
});

/**
 * Alta de cliente. body opcional crearCuenta + password → cuenta rol cliente.
 */
router.post('/clientes', async (req, res) => {
  const {
    razonSocial,
    identificadorFiscal = '',
    emailNotificaciones,
    telefono = '',
    departamento = '',
    sharePointPath = '',
    crearCuenta = false,
    password = '',
    nombreCompleto = '',
  } = req.body || {};

  if (!String(razonSocial || '').trim()) {
    return res.status(400).json({ error: 'razonSocial requerida' });
  }
  if (!emailOk(emailNotificaciones)) {
    return res.status(400).json({ error: 'emailNotificaciones inválido' });
  }

  const emailNorm = String(emailNotificaciones).trim().toLowerCase();
  const rfc = String(identificadorFiscal || '').trim().toUpperCase();
  if (rfc) {
    const dup = await Cliente.findOne({ identificadorFiscal: rfc, estado: { $ne: 'baja' } });
    if (dup) return res.status(409).json({ error: 'Ya existe un cliente con ese RFC' });
  }

  if (crearCuenta) {
    const pass = String(password || '').trim();
    if (pass.length < 6) {
      return res.status(400).json({ error: 'password mínimo 6 caracteres para crear cuenta' });
    }
    const existe = await Cuenta.findOne({ email: emailNorm });
    if (existe) {
      return res.status(409).json({ error: 'Ese email ya tiene cuenta de acceso' });
    }
  }

  const cliente = await Cliente.create({
    razonSocial: String(razonSocial).trim(),
    identificadorFiscal: rfc,
    emailNotificaciones: emailNorm,
    telefono: String(telefono || '').trim(),
    departamento: String(departamento || '').trim(),
    sharePointPath: String(sharePointPath || '').trim(),
    estado: 'activo',
  });

  let cuenta = null;
  if (crearCuenta) {
    cuenta = await Cuenta.create({
      email: emailNorm,
      nombreCompleto: String(nombreCompleto || cliente.razonSocial).trim(),
      passwordHash: await bcrypt.hash(String(password).trim(), 10),
      rol: 'cliente',
      clienteId: cliente._id,
      estado: 'activa',
    });
  }

  res.status(201).json({ ok: true, cliente, cuenta: cuenta ? { id: cuenta._id, email: cuenta.email } : null });
});

router.patch('/clientes/:id', async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  const fields = [
    'razonSocial',
    'identificadorFiscal',
    'emailNotificaciones',
    'telefono',
    'departamento',
    'sharePointPath',
    'estado',
  ];
  for (const f of fields) {
    if (req.body?.[f] === undefined) continue;
    if (f === 'emailNotificaciones') {
      if (!emailOk(req.body.emailNotificaciones)) {
        return res.status(400).json({ error: 'emailNotificaciones inválido' });
      }
      cliente.emailNotificaciones = String(req.body.emailNotificaciones).trim().toLowerCase();
    } else if (f === 'identificadorFiscal') {
      cliente.identificadorFiscal = String(req.body.identificadorFiscal || '')
        .trim()
        .toUpperCase();
    } else if (f === 'estado') {
      if (!['activo', 'baja'].includes(req.body.estado)) {
        return res.status(400).json({ error: 'estado debe ser activo o baja' });
      }
      cliente.estado = req.body.estado;
    } else {
      cliente[f] = String(req.body[f] || '').trim();
    }
  }
  await cliente.save();
  res.json({ ok: true, cliente });
});

/** Baja lógica (no borra historial). */
router.delete('/clientes/:id', async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  cliente.estado = 'baja';
  await cliente.save();
  await Cuenta.updateMany({ clienteId: cliente._id }, { estado: 'inactiva' });
  res.json({ ok: true, cliente });
});

router.get('/mail-status', (_req, res) => {
  res.json(mailStatus());
});

router.get('/sharepoint/status', (_req, res) => {
  res.json(sharepointStatus());
});

router.post('/sharepoint/sync', async (_req, res) => {
  const result = await syncSharepointStub();
  res.json(result);
});

/** Catálogo de carpetas documentales. */
router.get('/carpetas', async (_req, res) => {
  const carpetas = await Carpeta.find({ activa: true }).sort({ nombre: 1 }).lean();
  res.json({ carpetas });
});

/** Documentos clasificados / en flujo (no solo “error” puro sin cliente). */
router.get('/clasificados', async (req, res) => {
  const filter = {
    estado: { $in: ['clasificado', 'procesado', 'listo_envio', 'enviado', 'en_revision'] },
  };
  if (req.query.clienteId) filter.clienteId = String(req.query.clienteId);
  if (req.query.estado) filter.estado = String(req.query.estado);
  if (req.query.desde || req.query.hasta) {
    filter.creadoEn = {};
    if (req.query.desde) filter.creadoEn.$gte = new Date(String(req.query.desde));
    if (req.query.hasta) {
      const hasta = new Date(String(req.query.hasta));
      hasta.setHours(23, 59, 59, 999);
      filter.creadoEn.$lte = hasta;
    }
  }

  const docs = await Documento.find(filter).sort({ creadoEn: -1 }).lean();
  const clasifs = await Clasificacion.find({
    documentoId: { $in: docs.map((d) => d._id) },
  })
    .sort({ clasificadoEn: -1 })
    .lean();

  const clMap = {};
  for (const c of clasifs) {
    if (!clMap[c.documentoId]) clMap[c.documentoId] = c;
  }

  const clientes = await Cliente.find().lean();
  const cMap = Object.fromEntries(clientes.map((c) => [c._id, c]));

  res.json({
    documentos: docs.map((d) => ({
      ...d,
      clasificacion: clMap[d._id] || null,
      cliente: cMap[d.clienteId] || null,
    })),
  });
});

/** Bandeja: solo documentos que requieren revisión manual. */
router.get('/revisiones', async (_req, res) => {
  const docs = await Documento.find({ requiereRevision: true })
    .sort({ creadoEn: -1 })
    .lean();
  const ids = docs.map((d) => d._id);
  const [clasifs, clientes] = await Promise.all([
    Clasificacion.find({ documentoId: { $in: ids } }).sort({ clasificadoEn: -1 }).lean(),
    Cliente.find().sort({ razonSocial: 1 }).lean(),
  ]);

  const clMap = {};
  for (const c of clasifs) {
    if (!clMap[c.documentoId]) clMap[c.documentoId] = c;
  }
  const cMap = Object.fromEntries(clientes.map((c) => [c._id, c]));

  res.json({
    items: docs.map((d) => ({
      documento: d,
      clasificacion: clMap[d._id] || null,
      clienteSugerido: cMap[d.clienteId] || null,
    })),
    clientes,
  });
});

/**
 * Confirmar sugerencia o corregir cliente/carpeta.
 * body: { confirmar: true } | { confirmar: false, clienteId, carpetaDestino?, observaciones? }
 */
router.post('/revisiones/:documentoId', async (req, res) => {
  const { confirmar, clienteId, carpetaDestino, observaciones } = req.body || {};
  const doc = await Documento.findById(req.params.documentoId);
  if (!doc) return res.status(404).json({ error: 'No encontrado' });
  if (!doc.requiereRevision) {
    return res.status(400).json({ error: 'El documento no está pendiente de revisión' });
  }

  let clasif = await Clasificacion.findOne({ documentoId: doc._id }).sort({
    clasificadoEn: -1,
  });
  if (!clasif) {
    clasif = new Clasificacion({
      documentoId: doc._id,
      carpetaDestino: 'General',
      nivelConfianza: 0,
    });
  }

  let finalClienteId = clasif.clienteId || doc.clienteId;
  let finalCarpeta = clasif.carpetaDestino || doc.carpetaDestino || 'General';
  let estadoRev = 'confirmada';

  if (confirmar) {
    if (!finalClienteId) {
      return res.status(400).json({
        error: 'No hay cliente sugerido; corrige asignando un cliente',
      });
    }
  } else {
    if (!clienteId) return res.status(400).json({ error: 'clienteId requerido' });
    finalClienteId = clienteId;
    finalCarpeta = carpetaDestino || finalCarpeta || 'General';
    estadoRev = 'corregida';
  }

  const cliente = await Cliente.findById(finalClienteId);
  if (!cliente) return res.status(400).json({ error: 'Cliente inválido' });

  const propuesta = `${clasif.clienteId || 'sin cliente'} / ${clasif.carpetaDestino || 'General'}`;
  const confianzaPrev = clasif.nivelConfianza ?? null;

  clasif.clienteId = finalClienteId;
  clasif.carpetaDestino = finalCarpeta;
  clasif.estadoRevision = estadoRev;
  if (observaciones) clasif.observaciones = observaciones;
  clasif.clasificadoEn = new Date();
  await clasif.save();

  doc.clienteId = finalClienteId;
  doc.carpetaDestino = finalCarpeta;
  doc.estado = 'clasificado';
  doc.requiereRevision = false;
  await doc.save();

  if (observaciones && String(observaciones).trim()) {
    await Observacion.create({
      documentId: doc._id,
      tipo: estadoRev === 'corregida' ? 'correccion' : 'revision',
      comentario: String(observaciones).trim(),
      autor: req.user.email,
    });
  }

  await Revision.findOneAndUpdate(
    { documentoId: doc._id, estado: 'pendiente' },
    {
      documentoId: doc._id,
      revisorId: req.user.id,
      revisorEmail: req.user.email,
      estado: estadoRev,
      clasificacionPropuesta: propuesta,
      clasificacionConfirmada: `${cliente.razonSocial} / ${finalCarpeta}`,
      nivelConfianza: confianzaPrev,
      observaciones: observaciones || '',
      fechaRevision: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await registrarEvento({
    documentoId: doc._id,
    nombreArchivo: doc.nombreArchivo,
    tipoEvento: 'revision',
    estado: 'clasificado',
    detalle: `${estadoRev}: ${cliente.razonSocial} / ${finalCarpeta}`,
    actor: req.user.email,
    destinatarioId: finalClienteId,
  });

  res.json({ ok: true, documento: doc, clasificacion: clasif });
});

/**
 * Marca documentos como listos para envío e incorpora a cola.
 * body: { documentoIds: string[] }
 */
router.post('/listo-envio', async (req, res) => {
  const { documentoIds = [] } = req.body || {};
  if (!Array.isArray(documentoIds) || !documentoIds.length) {
    return res.status(400).json({ error: 'documentoIds requerido' });
  }

  const resultados = [];
  for (const id of documentoIds) {
    const doc = await Documento.findById(id);
    if (!doc) {
      resultados.push({ id, error: 'No encontrado' });
      continue;
    }

    const cliente = doc.clienteId ? await Cliente.findById(doc.clienteId) : null;
    const email = cliente?.emailNotificaciones || '';
    const filePath = path.resolve(
      config.uploadDir,
      path.basename(doc.rutaAlmacenamiento || '')
    );
    const fileOk = Boolean(doc.rutaAlmacenamiento) && fs.existsSync(filePath);
    const resolved = await resolverAsuntoEnvio({
      nombreArchivo: doc.nombreArchivo,
      cliente,
      carpetaDoc: doc.carpetaDestino,
    });

    let estado = 'preparado';
    let detalleError = '';
    if (!cliente || cliente.estado === 'baja') {
      estado = 'bloqueado';
      detalleError = 'Sin cliente destinatario activo';
    } else if (!emailOk(email)) {
      estado = 'bloqueado';
      detalleError = 'Correo inválido o faltante';
    } else if (!fileOk) {
      estado = 'bloqueado';
      detalleError = 'Archivo faltante';
    }

    doc.estado = estado === 'bloqueado' ? 'procesado' : 'listo_envio';
    await doc.save();

    const envio = await Envio.create({
      documentoId: doc._id,
      destinatarioEmail: email,
      asunto: resolved.asunto,
      carpetaDepositada: resolved.carpeta,
      tokenConfirmacion: uuid(),
      estado,
      fechaProgramada: new Date(),
      detalleError,
    });

    await registrarEvento({
      documentoId: doc._id,
      nombreArchivo: doc.nombreArchivo,
      tipoEvento: 'preparacion_envio',
      estado,
      detalle: detalleError || `Preparado para ${email}`,
      actor: req.user.email,
      destinatarioId: doc.clienteId,
    });

    resultados.push({ id, envio, documentoEstado: doc.estado });
  }

  res.json({ ok: true, resultados });
});

function validarDatosEnvio(doc, cliente, emailOverride) {
  const email = (emailOverride ?? cliente?.emailNotificaciones ?? '').trim();
  const filePath = path.resolve(
    config.uploadDir,
    path.basename(doc.rutaAlmacenamiento || '')
  );
  const fileOk = Boolean(doc.rutaAlmacenamiento) && fs.existsSync(filePath);

  let estado = 'preparado';
  let detalleError = '';
  if (!cliente || cliente.estado === 'baja') {
    estado = 'bloqueado';
    detalleError = 'Sin cliente destinatario activo';
  } else if (!emailOk(email)) {
    estado = 'bloqueado';
    detalleError = 'Correo inválido o faltante';
  } else if (!fileOk) {
    estado = 'bloqueado';
    detalleError = 'Archivo faltante';
  }
  return { estado, detalleError, email, fileOk };
}

/** Cola / estado de envíos (sin SMTP). ?estado=… o todos los estados del enum. */
router.get('/cola-envio', async (req, res) => {
  const filter = {};
  if (req.query.estado) {
    filter.estado = String(req.query.estado);
  } else if (req.query.soloCola === '1') {
    filter.estado = { $in: ['preparado', 'bloqueado', 'pendiente'] };
  }
  // sin filtro: todos (preparado, pendiente, enviado, fallido, bloqueado)

  const envios = await Envio.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  const docIds = [...new Set(envios.map((e) => e.documentoId))];
  const docs = await Documento.find({ _id: { $in: docIds } }).lean();
  const dMap = Object.fromEntries(docs.map((d) => [d._id, d]));
  const clientes = await Cliente.find().lean();
  const cMap = Object.fromEntries(clientes.map((c) => [c._id, c]));

  res.json({
    cola: envios.map((e) => {
      const doc = dMap[e.documentoId] || null;
      const cliente = doc?.clienteId ? cMap[doc.clienteId] || null : null;
      return {
        envio: e,
        documento: doc,
        cliente,
        adjuntoOk: Boolean(
          doc?.rutaAlmacenamiento &&
            fs.existsSync(
              path.resolve(config.uploadDir, path.basename(doc.rutaAlmacenamiento))
            )
        ),
      };
    }),
  });
});

/**
 * Corrige destinatario/asunto y revalida (bloquea si falta correo/archivo/cliente).
 * body: { destinatarioEmail?, asunto?, clienteId? }
 */
router.post('/cola-envio/:envioId/revalidar', async (req, res) => {
  const { destinatarioEmail, asunto, clienteId } = req.body || {};
  const envio = await Envio.findById(req.params.envioId);
  if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });
  if (!['preparado', 'bloqueado', 'pendiente'].includes(envio.estado)) {
    return res.status(400).json({ error: 'El envío ya no está en cola de validación' });
  }

  const doc = await Documento.findById(envio.documentoId);
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

  if (clienteId) {
    const c = await Cliente.findById(clienteId);
    if (!c) return res.status(400).json({ error: 'Cliente inválido' });
    doc.clienteId = clienteId;
    await doc.save();
  }

  const cliente = doc.clienteId ? await Cliente.findById(doc.clienteId) : null;
  const emailInput =
    typeof destinatarioEmail === 'string' ? destinatarioEmail : envio.destinatarioEmail;
  const { estado, detalleError, email } = validarDatosEnvio(doc, cliente, emailInput);

  envio.destinatarioEmail = email;
  if (typeof asunto === 'string' && asunto.trim()) envio.asunto = asunto.trim();
  envio.estado = estado;
  envio.detalleError = detalleError;
  envio.fechaProgramada = envio.fechaProgramada || new Date();
  await envio.save();

  doc.estado = estado === 'bloqueado' ? 'procesado' : 'listo_envio';
  await doc.save();

  await registrarEvento({
    documentoId: doc._id,
    nombreArchivo: doc.nombreArchivo,
    tipoEvento: 'validacion_envio',
    estado,
    detalle: detalleError || `Validado para ${email}`,
    actor: req.user.email,
    destinatarioId: doc.clienteId,
  });

  res.json({ ok: true, envio, documento: doc });
});

/** Retira de la cola para corrección (vuelve a procesado). */
router.post('/cola-envio/:envioId/retirar', async (req, res) => {
  const envio = await Envio.findById(req.params.envioId);
  if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });
  if (!['preparado', 'bloqueado', 'pendiente'].includes(envio.estado)) {
    return res.status(400).json({ error: 'El envío ya no está en cola de validación' });
  }

  const doc = await Documento.findById(envio.documentoId);
  envio.estado = 'bloqueado';
  envio.detalleError = 'Retirado para corrección';
  await envio.save();

  if (doc) {
    doc.estado = 'procesado';
    await doc.save();
    await registrarEvento({
      documentoId: doc._id,
      nombreArchivo: doc.nombreArchivo,
      tipoEvento: 'retiro_envio',
      estado: 'bloqueado',
      detalle: 'Retirado de cola para corrección',
      actor: req.user.email,
      destinatarioId: doc.clienteId,
    });
  }

  res.json({ ok: true, envio, documento: doc });
});

/**
 * Envía correo real (SMTP) o marca simulado si no hay SMTP.
 * Solo desde preparado o pendiente; revalida datos antes.
 */
router.post('/cola-envio/:envioId/marcar-enviado', async (req, res) => {
  const envio = await Envio.findById(req.params.envioId);
  if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });
  if (!['preparado', 'pendiente'].includes(envio.estado)) {
    return res.status(400).json({
      error: 'Solo se puede marcar enviado desde preparado o pendiente',
    });
  }

  const doc = await Documento.findById(envio.documentoId);
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

  const cliente = doc.clienteId ? await Cliente.findById(doc.clienteId) : null;
  const { estado, detalleError, email } = validarDatosEnvio(
    doc,
    cliente,
    envio.destinatarioEmail
  );

  if (estado === 'bloqueado') {
    envio.estado = 'fallido';
    envio.detalleError = detalleError || 'Datos incompletos al enviar';
    await envio.save();
    await registrarEvento({
      documentoId: doc._id,
      nombreArchivo: doc.nombreArchivo,
      tipoEvento: 'envio',
      estado: 'fallido',
      detalle: envio.detalleError,
      actor: req.user.email,
      destinatarioId: doc.clienteId,
    });
    return res.json({ ok: false, envio, documento: doc });
  }

  if (!envio.tokenConfirmacion) envio.tokenConfirmacion = uuid();
  if (!envio.carpetaDepositada) {
    const resolved = await resolverAsuntoEnvio({
      nombreArchivo: doc.nombreArchivo,
      cliente,
      carpetaDoc: doc.carpetaDestino,
    });
    envio.carpetaDepositada = resolved.carpeta;
    if (!envio.asunto) envio.asunto = resolved.asunto;
  }

  const confirmUrl = `${config.appUrl}/confirmar/${envio.tokenConfirmacion}`;
  let modo = 'simulado';
  let mailDetail = 'Envío simulado (SMTP no configurado)';

  if (smtpConfigured()) {
    try {
      const sent = await sendDocumentoEmail({
        to: email || envio.destinatarioEmail,
        asunto: envio.asunto,
        nombreArchivo: doc.nombreArchivo,
        carpeta: envio.carpetaDepositada || doc.carpetaDestino,
        confirmUrl,
        clienteNombre: cliente?.razonSocial,
      });
      if (sent.ok) {
        modo = 'smtp';
        mailDetail = `Correo SMTP enviado (${sent.messageId || 'ok'})`;
      } else {
        envio.estado = 'fallido';
        envio.detalleError = sent.error || 'No se pudo enviar correo';
        await envio.save();
        return res.json({ ok: false, envio, documento: doc });
      }
    } catch (err) {
      envio.estado = 'fallido';
      envio.detalleError = err.message || 'Error SMTP';
      await envio.save();
      await registrarEvento({
        documentoId: doc._id,
        nombreArchivo: doc.nombreArchivo,
        tipoEvento: 'envio',
        estado: 'fallido',
        detalle: envio.detalleError,
        actor: req.user.email,
        destinatarioId: doc.clienteId,
      });
      return res.json({ ok: false, envio, documento: doc });
    }
  }

  envio.estado = 'enviado';
  envio.modoEnvio = modo;
  envio.destinatarioEmail = email || envio.destinatarioEmail;
  envio.fechaEnvio = new Date();
  envio.detalleError = '';
  await envio.save();

  doc.estado = 'enviado';
  await doc.save();

  const destinatarios = new Set();
  if (envio.destinatarioEmail) destinatarios.add(envio.destinatarioEmail);
  if (cliente?.emailNotificaciones) destinatarios.add(cliente.emailNotificaciones);
  if (doc.clienteId) {
    const cuenta = await Cuenta.findOne({ clienteId: doc.clienteId, rol: 'cliente' }).lean();
    if (cuenta?.email) destinatarios.add(cuenta.email);
  }

  for (const recipientEmail of destinatarios) {
    await Notificacion.create({
      documentId: doc._id,
      notificationType: 'envio',
      title: 'Documento enviado',
      message: `${doc.nombreArchivo} enviado a ${envio.destinatarioEmail} (${modo}). Confirmar: ${confirmUrl}`,
      recipientEmail,
      isRead: false,
      status: 'entregada',
    });
  }

  await registrarEvento({
    documentoId: doc._id,
    nombreArchivo: doc.nombreArchivo,
    tipoEvento: 'envio',
    estado: 'enviado',
    detalle: `${mailDetail} → ${envio.destinatarioEmail}`,
    actor: req.user.email,
    destinatarioId: doc.clienteId,
  });

  res.json({ ok: true, envio, documento: doc, modo, confirmUrl });
});

/** Reporte CSV (Excel) de correos enviados. */
router.get('/reporte-envios.csv', async (req, res) => {
  const filter = { estado: 'enviado' };
  if (req.query.desde || req.query.hasta) {
    filter.fechaEnvio = {};
    if (req.query.desde) filter.fechaEnvio.$gte = new Date(String(req.query.desde));
    if (req.query.hasta) filter.fechaEnvio.$lte = new Date(String(req.query.hasta));
  }

  const envios = await Envio.find(filter).sort({ fechaEnvio: -1 }).limit(2000).lean();
  const docIds = [...new Set(envios.map((e) => e.documentoId))];
  const docs = await Documento.find({ _id: { $in: docIds } }).lean();
  const dMap = Object.fromEntries(docs.map((d) => [d._id, d]));
  const clientes = await Cliente.find().lean();
  const cMap = Object.fromEntries(clientes.map((c) => [c._id, c]));

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    [
      'Fecha',
      'Hora',
      'Cliente',
      'RFC',
      'Archivo',
      'Carpeta',
      'Destinatario',
      'Asunto',
      'Modo',
      'Confirmó recepción',
      'Fecha confirmación',
    ].join(','),
  ];

  for (const e of envios) {
    const doc = dMap[e.documentoId];
    const cli = doc?.clienteId ? cMap[doc.clienteId] : null;
    const fe = e.fechaEnvio ? new Date(e.fechaEnvio) : null;
    const fecha = fe
      ? fe.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })
      : '';
    const hora = fe
      ? fe.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City' })
      : '';
    const fc = e.fechaConfirmacion
      ? new Date(e.fechaConfirmacion).toLocaleString('es-MX', {
          timeZone: 'America/Mexico_City',
        })
      : '';
    rows.push(
      [
        esc(fecha),
        esc(hora),
        esc(cli?.razonSocial || ''),
        esc(cli?.identificadorFiscal || ''),
        esc(doc?.nombreArchivo || ''),
        esc(e.carpetaDepositada || doc?.carpetaDestino || ''),
        esc(e.destinatarioEmail),
        esc(e.asunto),
        esc(e.modoEnvio || 'simulado'),
        esc(e.confirmadoRecepcion ? 'Sí' : 'No'),
        esc(fc),
      ].join(',')
    );
  }

  const bom = '\uFEFF';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="reporte-envios-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  res.send(bom + rows.join('\n'));
});

/** Registra fallo de envío (sin SMTP) para trazabilidad / reintento. */
router.post('/cola-envio/:envioId/marcar-fallido', async (req, res) => {
  const { motivo = 'Fallo de envío simulado' } = req.body || {};
  const envio = await Envio.findById(req.params.envioId);
  if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });
  if (!['preparado', 'pendiente'].includes(envio.estado)) {
    return res.status(400).json({
      error: 'Solo se puede marcar fallido desde preparado o pendiente',
    });
  }

  const doc = await Documento.findById(envio.documentoId);
  envio.estado = 'fallido';
  envio.detalleError = String(motivo).trim() || 'Fallo de envío simulado';
  await envio.save();

  if (doc) {
    await registrarEvento({
      documentoId: doc._id,
      nombreArchivo: doc.nombreArchivo,
      tipoEvento: 'envio',
      estado: 'fallido',
      detalle: envio.detalleError,
      actor: req.user.email,
      destinatarioId: doc.clienteId,
    });
  }

  res.json({ ok: true, envio, documento: doc });
});

/**
 * Reintenta un envío fallido o bloqueado: revalida → preparado o sigue fallido/bloqueado.
 */
router.post('/cola-envio/:envioId/reintentar', async (req, res) => {
  const envio = await Envio.findById(req.params.envioId);
  if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });
  if (!['fallido', 'bloqueado'].includes(envio.estado)) {
    return res.status(400).json({ error: 'Solo se reintenta fallido o bloqueado' });
  }

  const doc = await Documento.findById(envio.documentoId);
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

  const cliente = doc.clienteId ? await Cliente.findById(doc.clienteId) : null;
  const { estado, detalleError, email } = validarDatosEnvio(
    doc,
    cliente,
    envio.destinatarioEmail
  );

  if (estado === 'bloqueado') {
    envio.estado = envio.estado === 'fallido' ? 'fallido' : 'bloqueado';
    envio.detalleError = detalleError;
    envio.destinatarioEmail = email || envio.destinatarioEmail;
    await envio.save();
    await registrarEvento({
      documentoId: doc._id,
      nombreArchivo: doc.nombreArchivo,
      tipoEvento: 'reintento_envio',
      estado: envio.estado,
      detalle: detalleError || 'Reintento sin éxito',
      actor: req.user.email,
      destinatarioId: doc.clienteId,
    });
    return res.json({ ok: false, envio, documento: doc });
  }

  envio.estado = 'preparado';
  envio.destinatarioEmail = email;
  envio.detalleError = '';
  envio.fechaProgramada = new Date();
  await envio.save();

  doc.estado = 'listo_envio';
  await doc.save();

  await registrarEvento({
    documentoId: doc._id,
    nombreArchivo: doc.nombreArchivo,
    tipoEvento: 'reintento_envio',
    estado: 'preparado',
    detalle: `Reintento OK → preparado para ${email}`,
    actor: req.user.email,
    destinatarioId: doc.clienteId,
  });

  res.json({ ok: true, envio, documento: doc });
});

/** Historial de procesamiento (todos los eventos; búsqueda y filtro por tipo). */
router.get('/historial', async (req, res) => {
  const filter = {};
  if (req.query.tipoEvento) filter.tipoEvento = String(req.query.tipoEvento);
  if (req.query.q) {
    filter.$or = [
      { nombreArchivo: { $regex: String(req.query.q), $options: 'i' } },
      { detalle: { $regex: String(req.query.q), $options: 'i' } },
      { actor: { $regex: String(req.query.q), $options: 'i' } },
    ];
  }
  const historial = await Historial.find(filter)
    .sort({ fechaEvento: -1 })
    .limit(300)
    .lean();
  res.json({ historial });
});

/** Errores de procesamiento abiertos. */
router.get('/errores', async (_req, res) => {
  const docs = await Documento.find({ estado: 'error' }).sort({ creadoEn: -1 }).lean();
  const ids = docs.map((d) => d._id);
  const [incidencias, clasifs, clientes] = await Promise.all([
    Incidencia.find({
      documentoId: { $in: ids },
      estado: { $in: ['abierta', 'en_gestion'] },
    })
      .sort({ fechaDeteccion: -1 })
      .lean(),
    Clasificacion.find({ documentoId: { $in: ids } }).sort({ clasificadoEn: -1 }).lean(),
    Cliente.find().sort({ razonSocial: 1 }).lean(),
  ]);

  const iMap = {};
  for (const i of incidencias) {
    if (!iMap[i.documentoId]) iMap[i.documentoId] = i;
  }
  const clMap = {};
  for (const c of clasifs) {
    if (!clMap[c.documentoId]) clMap[c.documentoId] = c;
  }

  res.json({
    errores: docs.map((d) => ({
      documento: d,
      incidencia: iMap[d._id] || null,
      clasificacion: clMap[d._id] || null,
      causa:
        iMap[d._id]?.descripcion ||
        clMap[d._id]?.observaciones ||
        'Error de procesamiento',
    })),
    clientes,
  });
});

router.post('/errores/:documentoId/reintentar', async (req, res) => {
  const doc = await Documento.findById(req.params.documentoId);
  if (!doc) return res.status(404).json({ error: 'No encontrado' });

  doc.estado = 'recibido';
  doc.requiereRevision = false;
  await doc.save();

  await clasificarDocumento(doc, req.user);
  const updated = await Documento.findById(doc._id).lean();

  if (updated.estado !== 'error') {
    await Incidencia.updateMany(
      { documentoId: doc._id, estado: { $ne: 'resuelta' } },
      { estado: 'resuelta', fechaResolucion: new Date() }
    );
  }

  await registrarEvento({
    documentoId: doc._id,
    nombreArchivo: doc.nombreArchivo,
    tipoEvento: 'reintento',
    estado: updated.estado,
    detalle: 'Reproceso solicitado por contable',
    actor: req.user.email,
  });

  res.json({ ok: true, documento: updated });
});

router.post('/errores/:documentoId/asignar', async (req, res) => {
  const { clienteId, carpetaDestino = 'General', observaciones = '' } = req.body || {};
  const doc = await Documento.findById(req.params.documentoId);
  if (!doc) return res.status(404).json({ error: 'No encontrado' });
  const cliente = await Cliente.findById(clienteId);
  if (!cliente) return res.status(400).json({ error: 'Cliente inválido' });

  doc.clienteId = clienteId;
  doc.carpetaDestino = carpetaDestino;
  doc.estado = 'clasificado';
  doc.requiereRevision = false;
  await doc.save();

  await Clasificacion.findOneAndUpdate(
    { documentoId: doc._id },
    {
      clienteId,
      carpetaDestino,
      nivelConfianza: 1,
      estadoRevision: 'corregida',
      observaciones: observaciones || 'Asignación manual desde errores',
      clasificadoEn: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Incidencia.updateMany(
    { documentoId: doc._id, estado: { $ne: 'resuelta' } },
    { estado: 'resuelta', fechaResolucion: new Date() }
  );

  await registrarEvento({
    documentoId: doc._id,
    nombreArchivo: doc.nombreArchivo,
    tipoEvento: 'correccion',
    estado: 'clasificado',
    detalle: `Asignación manual a ${cliente.razonSocial}`,
    actor: req.user.email,
    destinatarioId: clienteId,
  });

  res.json({ ok: true, documento: doc });
});

/** Reglas de clasificación persistidas. */
router.get('/reglas', async (_req, res) => {
  const reglas = await ReglaClasificacion.find().sort({ prioridad: 1, nombre: 1 }).lean();
  res.json({ reglas });
});

/**
 * body: { nombre, criterio, carpetaDestino, asuntoPlantilla?, departamento?, periodicidad?, … }
 */
router.post('/reglas', async (req, res) => {
  const {
    nombre,
    criterio,
    carpetaDestino,
    descripcion = '',
    asuntoPlantilla = '',
    departamento = '',
    periodicidad = '',
    peso = 0.1,
    prioridad = 100,
    activa = true,
    clienteId = null,
  } = req.body || {};

  if (!nombre?.trim() || !criterio?.trim() || !carpetaDestino?.trim()) {
    return res.status(400).json({ error: 'nombre, criterio y carpetaDestino requeridos' });
  }

  if (clienteId) {
    const c = await Cliente.findById(clienteId);
    if (!c) return res.status(400).json({ error: 'Cliente inválido' });
  }

  try {
    RegExp(String(criterio));
  } catch {
    return res.status(400).json({ error: 'criterio no es un patrón válido' });
  }

  const regla = await ReglaClasificacion.create({
    nombre: nombre.trim(),
    criterio: criterio.trim(),
    carpetaDestino: carpetaDestino.trim(),
    asuntoPlantilla: String(asuntoPlantilla || '').trim(),
    departamento: String(departamento || '').trim(),
    periodicidad: String(periodicidad || '').trim(),
    descripcion: String(descripcion || ''),
    peso: Number(peso) || 0.1,
    prioridad: Number(prioridad) || 100,
    activa: Boolean(activa),
    clienteId: clienteId || null,
  });

  res.json({ ok: true, regla });
});

router.patch('/reglas/:id', async (req, res) => {
  const regla = await ReglaClasificacion.findById(req.params.id);
  if (!regla) return res.status(404).json({ error: 'Regla no encontrada' });

  const fields = [
    'nombre',
    'descripcion',
    'criterio',
    'carpetaDestino',
    'asuntoPlantilla',
    'departamento',
    'periodicidad',
    'peso',
    'prioridad',
    'activa',
    'clienteId',
  ];
  for (const f of fields) {
    if (req.body?.[f] === undefined) continue;
    if (f === 'criterio') {
      try {
        RegExp(String(req.body.criterio));
      } catch {
        return res.status(400).json({ error: 'criterio no es un patrón válido' });
      }
    }
    if (f === 'clienteId' && req.body.clienteId) {
      const c = await Cliente.findById(req.body.clienteId);
      if (!c) return res.status(400).json({ error: 'Cliente inválido' });
    }
    if (f === 'activa') regla.activa = Boolean(req.body.activa);
    else if (f === 'peso' || f === 'prioridad') regla[f] = Number(req.body[f]);
    else if (f === 'clienteId') regla.clienteId = req.body.clienteId || null;
    else regla[f] = String(req.body[f]).trim();
  }
  await regla.save();
  res.json({ ok: true, regla });
});

router.delete('/reglas/:id', async (req, res) => {
  const regla = await ReglaClasificacion.findByIdAndDelete(req.params.id);
  if (!regla) return res.status(404).json({ error: 'Regla no encontrada' });
  res.json({ ok: true });
});

/** Observaciones de revisión (fecha + autor). */
router.get('/observaciones', async (req, res) => {
  const filter = {};
  if (req.query.documentoId) filter.documentId = String(req.query.documentoId);
  if (req.query.tipo) filter.tipo = String(req.query.tipo);

  const observaciones = await Observacion.find(filter)
    .sort({ creadoEn: -1 })
    .limit(200)
    .lean();

  const docIds = [...new Set(observaciones.map((o) => o.documentId))];
  const docs = await Documento.find({ _id: { $in: docIds } })
    .select('_id nombreArchivo estado')
    .lean();
  const dMap = Object.fromEntries(docs.map((d) => [d._id, d]));

  res.json({
    observaciones: observaciones.map((o) => ({
      ...o,
      documento: dMap[o.documentId] || null,
    })),
  });
});

/**
 * body: { documentoId, comentario, tipo? }
 */
router.post('/observaciones', async (req, res) => {
  const { documentoId, comentario, tipo = 'revision' } = req.body || {};
  if (!documentoId) return res.status(400).json({ error: 'documentoId requerido' });
  const texto = String(comentario || '').trim();
  if (!texto) return res.status(400).json({ error: 'comentario requerido' });

  const doc = await Documento.findById(documentoId);
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

  const tiposOk = ['revision', 'correccion', 'incidencia', 'envio'];
  const tipoFinal = tiposOk.includes(tipo) ? tipo : 'revision';

  const observacion = await Observacion.create({
    documentId: doc._id,
    tipo: tipoFinal,
    comentario: texto,
    autor: req.user.email,
  });

  await registrarEvento({
    documentoId: doc._id,
    nombreArchivo: doc.nombreArchivo,
    tipoEvento: 'observacion',
    estado: doc.estado,
    detalle: `[${tipoFinal}] ${texto.slice(0, 120)}`,
    actor: req.user.email,
    destinatarioId: doc.clienteId,
  });

  res.json({ ok: true, observacion });
});

/**
 * Editar observación. body: { comentario?, tipo?, resuelta? }
 */
router.patch('/observaciones/:id', async (req, res) => {
  const { comentario, tipo, resuelta } = req.body || {};
  const obs = await Observacion.findById(req.params.id);
  if (!obs) return res.status(404).json({ error: 'Observación no encontrada' });

  if (typeof comentario === 'string') {
    const texto = comentario.trim();
    if (!texto) return res.status(400).json({ error: 'comentario vacío' });
    obs.comentario = texto;
  }
  if (tipo && ['revision', 'correccion', 'incidencia', 'envio'].includes(tipo)) {
    obs.tipo = tipo;
  }
  if (typeof resuelta === 'boolean') obs.resuelta = resuelta;
  obs.actualizadoEn = new Date();
  await obs.save();

  res.json({ ok: true, observacion: obs });
});

export default router;



