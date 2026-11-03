import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const IncidenciaSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    documentoId: { type: String, required: true, index: true },
    tipo: { type: String, required: true },
    descripcion: { type: String, required: true },
    estado: {
      type: String,
      enum: ['abierta', 'en_gestion', 'resuelta'],
      default: 'abierta',
    },
    severidad: {
      type: String,
      enum: ['baja', 'media', 'alta'],
      default: 'media',
    },
    fechaDeteccion: { type: Date, default: Date.now },
    fechaResolucion: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Incidencia =
  mongoose.models.Incidencia || mongoose.model('Incidencia', IncidenciaSchema);
