import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const ProcesamientoSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    documentoId: { type: String, required: true, index: true },
    tipoProceso: {
      type: String,
      enum: ['analisis', 'clasificacion', 'validacion', 'preparacion_envio'],
      default: 'clasificacion',
    },
    estado: {
      type: String,
      enum: ['iniciado', 'completado', 'fallido'],
      default: 'iniciado',
    },
    iniciadoEn: { type: Date, default: Date.now },
    finalizadoEn: { type: Date, default: null },
    mensajeError: { type: String, default: '' },
    resultadoResumen: { type: String, default: '' },
  },
  { timestamps: false }
);

export const Procesamiento =
  mongoose.models.Procesamiento ||
  mongoose.model('Procesamiento', ProcesamientoSchema);
