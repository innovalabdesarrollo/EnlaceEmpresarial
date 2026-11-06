import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const ClienteSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    razonSocial: { type: String, required: true },
    /** RFC u otro identificador fiscal (usado en asuntos y carpetas SharePoint). */
    identificadorFiscal: { type: String, default: '', index: true },
    emailNotificaciones: { type: String, required: true },
    telefono: { type: String, default: '' },
    /** Ej. PERSONAS FISICAS / ACT EMPRESARIAL */
    departamento: { type: String, default: '' },
    /** Ruta relativa en SharePoint, ej. PERSONAS FISICAS/ACT EMPRESARIAL/RFC_NOMBRE */
    sharePointPath: { type: String, default: '' },
    estado: {
      type: String,
      enum: ['activo', 'baja'],
      default: 'activo',
      index: true,
    },
  },
  { timestamps: true }
);

export const Cliente =
  mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
