import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const ObservacionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    documentId: { type: String, required: true, index: true },
    tipo: {
      type: String,
      enum: ['revision', 'correccion', 'incidencia', 'envio'],
      default: 'revision',
    },
    comentario: { type: String, required: true },
    autor: { type: String, required: true },
    creadoEn: { type: Date, default: Date.now },
    actualizadoEn: { type: Date, default: null },
    resuelta: { type: Boolean, default: false },
  },
  { timestamps: false }
);

export const Observacion =
  mongoose.models.Observacion || mongoose.model('Observacion', ObservacionSchema);
