import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const DocumentoSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    clienteId: { type: String, default: null, index: true },
    nombreArchivo: { type: String, required: true },
    tipoMime: { type: String, required: true },
    tamanoBytes: { type: Number, required: true },
    rutaAlmacenamiento: { type: String, required: true },
    estado: {
      type: String,
      enum: [
        'recibido',
        'en_revision',
        'clasificado',
        'procesado',
        'listo_envio',
        'enviado',
        'error',
      ],
      default: 'recibido',
    },
    requiereRevision: { type: Boolean, default: false },
    carpetaDestino: { type: String, default: '' },
    creadoEn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Documento =
  mongoose.models.Documento || mongoose.model('Documento', DocumentoSchema);
