import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const ConfirmacionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    documentoId: { type: String, required: true, index: true },
    documentName: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now },
    confirmationStatus: {
      type: String,
      enum: ['generada', 'enviada', 'fallida'],
      default: 'generada',
    },
    recipientEmail: { type: String, required: true },
    referenceCode: { type: String, required: true },
    message: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Confirmacion =
  mongoose.models.Confirmacion ||
  mongoose.model('Confirmacion', ConfirmacionSchema);
