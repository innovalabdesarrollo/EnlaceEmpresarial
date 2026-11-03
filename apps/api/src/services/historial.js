import { Historial } from '../models/index.js';

export async function registrarEvento({
  documentoId,
  nombreArchivo,
  tipoEvento,
  estado,
  detalle = '',
  actor = 'sistema',
  destinatarioId = null,
}) {
  return Historial.create({
    documentoId,
    nombreArchivo,
    tipoEvento,
    estado,
    detalle,
    actor,
    destinatarioId,
  });
}
