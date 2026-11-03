import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const ClasificacionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    documentoId: { type: String, required: true, index: true },
    clienteId: { type: String, default: null },
    carpetaDestino: { type: String, default: 'General' },
    nivelConfianza: { type: Number, default: 0 },
    estadoRevision: {
      type: String,
      enum: ['automatica', 'pendiente_revision', 'confirmada', 'corregida'],
      default: 'automatica',
    },
    observaciones: { type: String, default: '' },
    clasificadoEn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Clasificacion =
  mongoose.models.Clasificacion ||
  mongoose.model('Clasificacion', ClasificacionSchema);
