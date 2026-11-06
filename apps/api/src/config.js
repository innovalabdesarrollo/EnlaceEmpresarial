import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/** En Vercel el FS es de solo lectura salvo /tmp. */
function resolveUploadDir() {
  if (process.env.UPLOAD_DIR) {
    return path.isAbsolute(process.env.UPLOAD_DIR)
      ? process.env.UPLOAD_DIR
      : path.resolve(__dirname, '..', process.env.UPLOAD_DIR);
  }
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'enlace-uploads');
  }
  return path.resolve(__dirname, '..', 'uploads');
}

function resolveAppUrl() {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://127.0.0.1:5710';
}

export const config = {
  port: Number(process.env.PORT || 4710),
  host: process.env.HOST || '127.0.0.1',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-enlace-secret-local',
  uploadDir: resolveUploadDir(),
  confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || 0.7),
  appUrl: resolveAppUrl(),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  },
  sharepoint: {
    tenantId: process.env.SHAREPOINT_TENANT_ID || '',
    clientId: process.env.SHAREPOINT_CLIENT_ID || '',
    clientSecret: process.env.SHAREPOINT_CLIENT_SECRET || '',
    siteId: process.env.SHAREPOINT_SITE_ID || '',
    driveId: process.env.SHAREPOINT_DRIVE_ID || '',
    rootFolder: process.env.SHAREPOINT_ROOT_FOLDER || '',
  },
};

/** Busca un puerto libre sin matar procesos existentes. */
export function findFreePort(preferred, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const tryPort = (port, attemptsLeft) => {
      const server = net.createServer();
      server.unref();
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
          tryPort(port + 1, attemptsLeft - 1);
        } else {
          reject(err);
        }
      });
      server.listen(port, host, () => {
        const { port: p } = server.address();
        server.close(() => resolve(p));
      });
    };
    tryPort(preferred, 40);
  });
}
