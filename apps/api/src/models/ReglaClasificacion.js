import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const ReglaClasificacionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    nombre: { type: String, required: true },
    descripcion: { type: String, default: '' },
    /** Patrón (regex o texto) aplicado al nombre de archivo. */
    criterio: { type: String, required: true },
    carpetaDestino: { type: String, required: true },
    /** Plantilla de asunto: usa [RFC] o {RFC}. */
    asuntoPlantilla: { type: String, default: '' },
    departamento: { type: String, default: '' },
    periodicidad: { type: String, default: '' },
    clienteId: { type: String, default: null, index: true },
    peso: { type: Number, default: 0.1 },
    prioridad: { type: Number, default: 100 },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ReglaClasificacion =
  mongoose.models.ReglaClasificacion ||
  mongoose.model('ReglaClasificacion', ReglaClasificacionSchema);
