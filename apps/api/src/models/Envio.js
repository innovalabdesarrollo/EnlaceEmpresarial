import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const EnvioSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    documentoId: { type: String, required: true, index: true },
    destinatarioEmail: { type: String, default: '' },
    asunto: { type: String, default: '' },
    carpetaDepositada: { type: String, default: '' },
    estado: {
      type: String,
      enum: ['preparado', 'pendiente', 'enviado', 'fallido', 'bloqueado'],
      default: 'preparado',
    },
    modoEnvio: {
      type: String,
      enum: ['simulado', 'smtp'],
      default: 'simulado',
    },
    tokenConfirmacion: { type: String, default: '', index: true },
    confirmadoRecepcion: { type: Boolean, default: false },
    fechaConfirmacion: { type: Date, default: null },
    fechaProgramada: { type: Date, default: null },
    fechaEnvio: { type: Date, default: null },
    detalleError: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Envio =
  mongoose.models.Envio || mongoose.model('Envio', EnvioSchema);
