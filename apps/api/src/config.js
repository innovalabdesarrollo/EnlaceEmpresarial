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

export const config = {
  port: Number(process.env.PORT || 4710),
  host: process.env.HOST || '127.0.0.1',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-enlace-secret-local',
  uploadDir: resolveUploadDir(),
  confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || 0.7),
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
