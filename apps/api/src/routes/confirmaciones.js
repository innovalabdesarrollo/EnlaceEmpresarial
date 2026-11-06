import { Router } from 'express';
import { Envio, Documento, Notificacion, Cliente } from '../models/index.js';
import { registrarEvento } from '../services/historial.js';

const router = Router();

/** Público: el cliente confirma recepción desde el botón del correo. */
router.get('/:token', async (req, res) => {
  const token = String(req.params.token || '').trim();
  if (!token) return res.status(400).json({ error: 'Token requerido' });

  const envio = await Envio.findOne({ tokenConfirmacion: token });
  if (!envio) return res.status(404).json({ error: 'Enlace inválido o expirado' });

  if (!envio.confirmadoRecepcion) {
    envio.confirmadoRecepcion = true;
    envio.fechaConfirmacion = new Date();
    await envio.save();

    const doc = await Documento.findById(envio.documentoId);
    if (doc) {
      await registrarEvento({
        documentoId: doc._id,
        nombreArchivo: doc.nombreArchivo,
        tipoEvento: 'confirmacion_recepcion',
        estado: 'enviado',
        detalle: `Cliente confirmó recepción (${envio.destinatarioEmail})`,
        actor: envio.destinatarioEmail || 'cliente',
        destinatarioId: doc.clienteId,
      });

      const cliente = doc.clienteId ? await Cliente.findById(doc.clienteId).lean() : null;
      if (cliente?.emailNotificaciones) {
        await Notificacion.create({
          documentId: doc._id,
          notificationType: 'confirmacion',
          title: 'Recepción confirmada',
          message: `${doc.nombreArchivo}: el destinatario confirmó recepción.`,
          recipientEmail: cliente.emailNotificaciones,
          isRead: false,
          status: 'entregada',
        });
      }
    }
  }

  res.json({
    ok: true,
    confirmado: true,
    envioId: envio._id,
    fechaConfirmacion: envio.fechaConfirmacion,
    asunto: envio.asunto,
  });
});

export default router;
