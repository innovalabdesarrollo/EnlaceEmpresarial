import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { config } from './config.js';
import { connectDb, mongoStatus } from './db.js';
import authRoutes from './routes/auth.js';
import documentosRoutes from './routes/documentos.js';
import notificacionesRoutes from './routes/notificaciones.js';
import contableRoutes from './routes/contable.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

/** Conexión lazy (cold start en Vercel). */
let dbReady = null;
export function ensureDb() {
  if (!dbReady) dbReady = connectDb();
  return dbReady;
}

app.use(async (_req, _res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/health', (_req, res) => {
  const mongo = mongoStatus();
  res.json({
    ok: mongo.state === 'connected',
    service: 'enlace-empresarial-api',
    mongo,
  });
});

app.get('/api/health', (_req, res) => {
  const mongo = mongoStatus();
  res.json({
    ok: mongo.state === 'connected',
    service: 'enlace-empresarial-api',
    mongo,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/contable', contableRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno' });
});

export { app };
