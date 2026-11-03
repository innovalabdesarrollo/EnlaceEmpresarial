import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { config } from '../config.js';
import { requireAuth, requireRol } from '../middleware/auth.js';
import { Documento, Confirmacion, Notificacion, Historial } from '../models/index.js';
import { registrarEvento } from '../services/historial.js';
import { clasificarDocumento } from '../services/clasificar.js';


const router = Router();

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-()\sáéíóúñÁÉÍÓÚÑ]/gi, '_');
    cb(null, `${Date.now()}-${uuid().slice(0, 8)}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
  // fileFilter síncrono (evitar CVE multer con filter async)
  fileFilter: (_req, file, cb) => {
    const okMime = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/xml',
      'text/xml',
    ].includes(file.mimetype);
    const okExt = /\.(pdf|xml|jpg|jpeg|png|webp|xlsx|docx|txt)$/i.test(
      file.originalname
    );
    if (okMime || okExt) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'));
  },
});

/** Lista documentos del usuario (cliente: solo los suyos). */
router.get('/', requireAuth, async (req, res) => {
  const filter = {};
  if (req.user.rol === 'cliente') {
    if (!req.user.clienteId) {
      return res.json({ documentos: [] });
    }
    filter.clienteId = req.user.clienteId;
  } else if (req.query.clienteId) {
    filter.clienteId = String(req.query.clienteId);
  }
  if (req.query.estado) filter.estado = String(req.query.estado);

  const documentos = await Documento.find(filter).sort({ creadoEn: -1 }).lean();
  res.json({ documentos });
});

/** Historial de eventos (cliente: solo docs propios). */
router.get('/historial', requireAuth, async (req, res) => {
  const filter = {};
  if (req.user.rol === 'cliente') {
    if (!req.user.clienteId) return res.json({ historial: [] });
    const docs = await Documento.find({ clienteId: req.user.clienteId })
      .select('_id')
      .lean();
    filter.documentoId = { $in: docs.map((d) => d._id) };
  }
  if (req.query.q) {
    filter.$or = [
      { nombreArchivo: { $regex: String(req.query.q), $options: 'i' } },
      { detalle: { $regex: String(req.query.q), $options: 'i' } },
    ];
  }
  const historial = await Historial.find(filter)
    .sort({ fechaEvento: -1 })
    .limit(200)
    .lean();
  res.json({ historial });
});

router.post(
  '/upload',
  requireAuth,
  requireRol('cliente', 'contable'),
  (req, res) => {
    upload.array('files', 10)(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.files?.length) {
        return res.status(400).json({ error: 'Sin archivos' });
      }

      const results = [];
      for (const file of req.files) {
        const doc = await Documento.create({
          clienteId: req.user.clienteId || null,
          nombreArchivo: file.originalname,
          tipoMime: file.mimetype,
          tamanoBytes: file.size,
          rutaAlmacenamiento: file.filename,
          estado: 'recibido',
        });

        const referenceCode = `EE-${doc._id.slice(0, 8).toUpperCase()}`;
        await Confirmacion.create({
          documentoId: doc._id,
          documentName: file.originalname,
          confirmationStatus: 'generada',
          recipientEmail: req.user.email,
          referenceCode,
          message: `Documento recibido: ${file.originalname}`,
        });

        await Notificacion.create({
          documentId: doc._id,
          notificationType: 'recepcion',
          title: 'Documento recibido',
          message: `${file.originalname} recibido correctamente. Ref: ${referenceCode}`,
          recipientEmail: req.user.email,
          isRead: false,
          status: 'entregada',
        });

        await registrarEvento({
          documentoId: doc._id,
          nombreArchivo: file.originalname,
          tipoEvento: 'recepcion',
          estado: 'recibido',
          detalle: `Ref ${referenceCode}`,
          actor: req.user.email,
          destinatarioId: req.user.clienteId,
        });

        await clasificarDocumento(doc, req.user);
        const updated = await Documento.findById(doc._id).lean();

        results.push({
          id: updated._id,
          nombreArchivo: updated.nombreArchivo,
          estado: updated.estado,
          requiereRevision: updated.requiereRevision,
          tamanoBytes: updated.tamanoBytes,
          referenceCode,
          creadoEn: updated.creadoEn,
        });
      }

      res.status(201).json({
        ok: true,
        message: `${results.length} documento(s) recibido(s)`,
        documentos: results,
      });
    });
  }
);

/** Descarga: cliente solo los suyos; contable puede cualquiera. */
router.get('/:id/download', requireAuth, async (req, res) => {
  const doc = await Documento.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'No encontrado' });

  if (req.user.rol === 'cliente') {
    if (!req.user.clienteId || doc.clienteId !== req.user.clienteId) {
      return res.status(403).json({ error: 'Sin acceso a este documento' });
    }
  }

  const base = path.resolve(config.uploadDir);
  const full = path.resolve(base, path.basename(doc.rutaAlmacenamiento));
  if (!full.startsWith(base + path.sep) && full !== base) {
    return res.status(400).json({ error: 'Ruta inválida' });
  }
  if (!fs.existsSync(full)) {
    return res.status(404).json({ error: 'Archivo no disponible' });
  }

  await registrarEvento({
    documentoId: doc._id,
    nombreArchivo: doc.nombreArchivo,
    tipoEvento: 'descarga',
    estado: doc.estado,
    actor: req.user.email,
    destinatarioId: doc.clienteId,
  });

  res.download(full, doc.nombreArchivo);
});

export default router;

