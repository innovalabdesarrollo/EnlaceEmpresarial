import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const CuentaSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    clienteId: { type: String, default: null },
    nombreCompleto: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    rol: { type: String, enum: ['cliente', 'contable'], required: true },
    estado: { type: String, default: 'activa' },
    ultimoAcceso: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Cuenta =
  mongoose.models.Cuenta || mongoose.model('Cuenta', CuentaSchema);
