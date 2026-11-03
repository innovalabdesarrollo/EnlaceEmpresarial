import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const RevisionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    documentoId: { type: String, required: true, index: true },
    revisorId: { type: String, default: null },
    revisorEmail: { type: String, default: '' },
    estado: {
      type: String,
      enum: ['pendiente', 'confirmada', 'corregida'],
      default: 'pendiente',
    },
    clasificacionPropuesta: { type: String, default: '' },
    clasificacionConfirmada: { type: String, default: '' },
    nivelConfianza: { type: Number, default: null },
    observaciones: { type: String, default: '' },
    fechaRevision: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Revision =
  mongoose.models.Revision || mongoose.model('Revision', RevisionSchema);
