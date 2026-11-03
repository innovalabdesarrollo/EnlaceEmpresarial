import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const CarpetaSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    nombre: { type: String, required: true },
    ruta: { type: String, required: true },
    tipoClasificacion: { type: String, default: 'general' },
    clienteId: { type: String, default: null, index: true },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CarpetaSchema.index({ nombre: 1, clienteId: 1 }, { unique: true });

export const Carpeta =
  mongoose.models.Carpeta || mongoose.model('Carpeta', CarpetaSchema);
