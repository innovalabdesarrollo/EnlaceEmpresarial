/**
 * Serverless Express en Vercel (mismo dominio que la web).
 * Rutas: /api/auth, /api/documentos, /api/contable, /api/health, …
 */
import { app } from '@enlace/api/app';

function withApiPrefix(req) {
  // Catch-all a veces entrega url sin /api
  const url = req.url || '/';
  if (url === '/api' || url.startsWith('/api/') || url.startsWith('/health')) {
    return;
  }
  req.url = '/api' + (url.startsWith('/') ? url : `/${url}`);
}

export default function handler(req, res) {
  withApiPrefix(req);
  return app(req, res);
}
