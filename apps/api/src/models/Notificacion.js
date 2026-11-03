import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const NotificacionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    documentId: { type: String, default: null, index: true },
    notificationType: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipientEmail: { type: String, required: true, index: true },
    isRead: { type: Boolean, default: false },
    status: { type: String, default: 'entregada' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Notificacion =
  mongoose.models.Notificacion ||
  mongoose.model('Notificacion', NotificacionSchema);
