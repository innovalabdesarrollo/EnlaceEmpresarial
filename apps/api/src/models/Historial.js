import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const HistorialSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    documentoId: { type: String, default: null, index: true },
    nombreArchivo: { type: String, required: true },
    tipoEvento: { type: String, required: true },
    estado: { type: String, required: true },
    fechaEvento: { type: Date, default: Date.now },
    destinatarioId: { type: String, default: null },
    detalle: { type: String, default: '' },
    actor: { type: String, default: 'sistema' },
  },
  { timestamps: false }
);

export const Historial =
  mongoose.models.Historial || mongoose.model('Historial', HistorialSchema);
