import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const ClienteSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    razonSocial: { type: String, required: true },
    identificadorFiscal: { type: String, default: '' },
    emailNotificaciones: { type: String, required: true },
    telefono: { type: String, default: '' },
    estado: { type: String, default: 'activo' },
  },
  { timestamps: true }
);

export const Cliente =
  mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
