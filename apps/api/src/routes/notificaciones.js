import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Confirmacion, Notificacion, Documento, Envio } from '../models/index.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const notificaciones = await Notificacion.find({
    recipientEmail: req.user.email,
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ notificaciones });
});

router.get('/confirmaciones', requireAuth, async (req, res) => {
  const confirmaciones = await Confirmacion.find({
    recipientEmail: req.user.email,
  })
    .sort({ receivedAt: -1 })
    .limit(100)
    .lean();
  res.json({ confirmaciones });
});

/** Envíos del cliente (vacío hasta que contable prepare envíos). */
router.get('/envios-cliente', requireAuth, async (req, res) => {
  if (req.user.rol !== 'cliente') {
    return res.status(403).json({ error: 'Solo clientes' });
  }
  if (!req.user.clienteId) return res.json({ envios: [] });

  const docs = await Documento.find({ clienteId: req.user.clienteId })
    .select('_id nombreArchivo')
    .lean();
  const ids = docs.map((d) => d._id);
  const envios = await Envio.find({ documentoId: { $in: ids } })
    .sort({ createdAt: -1 })
    .lean();
  const dMap = Object.fromEntries(docs.map((d) => [d._id, d]));
  res.json({
    envios: envios.map((e) => ({
      ...e,
      documento: dMap[e.documentoId] || null,
    })),
  });
});

router.post('/:id/leer', requireAuth, async (req, res) => {
  const n = await Notificacion.findOneAndUpdate(
    { _id: req.params.id, recipientEmail: req.user.email },
    { isRead: true },
    { new: true }
  );
  if (!n) return res.status(404).json({ error: 'No encontrada' });
  res.json({ notificacion: n });
});

export default router;
