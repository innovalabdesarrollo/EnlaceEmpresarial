import { ReglaClasificacion } from '../models/index.js';

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

export function aplicarPlantillaAsunto(plantilla, rfc, nombreArchivo) {
  const base = String(plantilla || '').trim();
  const rfcVal = String(rfc || '').trim() || 'SIN_RFC';
  if (!base) return `Documento procesado: ${nombreArchivo}`;
  return base.replace(/\[RFC\]/gi, rfcVal).replace(/\{RFC\}/gi, rfcVal);
}

/**
 * Resuelve asunto y carpeta según reglas (prioridad) + RFC del cliente.
 */
export async function resolverAsuntoEnvio({ nombreArchivo, cliente, carpetaDoc }) {
  const reglas = await ReglaClasificacion.find({ activa: true })
    .sort({ prioridad: 1, createdAt: 1 })
    .lean();

  const rfc = cliente?.identificadorFiscal || '';
  for (const r of reglas) {
    if (r.clienteId && cliente?._id && r.clienteId !== cliente._id) continue;
    if (!matchCriterio(nombreArchivo, r.criterio)) continue;
    const asunto = aplicarPlantillaAsunto(
      r.asuntoPlantilla || `[RFC]_${r.nombre}`,
      rfc,
      nombreArchivo
    );
    return {
      asunto,
      carpeta: r.carpetaDestino || carpetaDoc || 'General',
      reglaId: r._id,
      reglaNombre: r.nombre,
    };
  }

  return {
    asunto: aplicarPlantillaAsunto(
      rfc ? '[RFC]_DOCUMENTO' : `Documento procesado: ${nombreArchivo}`,
      rfc,
      nombreArchivo
    ),
    carpeta: carpetaDoc || 'General',
    reglaId: null,
    reglaNombre: null,
  };
}
