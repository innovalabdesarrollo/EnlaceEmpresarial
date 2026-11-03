import { config, findFreePort } from './config.js';
import { connectDb } from './db.js';
import { app } from './app.js';

async function start() {
  await connectDb();

  const free = await findFreePort(config.port, config.host);
  if (free !== config.port) {
    console.error(
      `[api] Puerto ${config.port} ocupado. No se mata ningún proceso.`
    );
    console.error(
      `[api] Cambia PORT en .env (libre cercano: ${free}) y PUBLIC_API_URL en web.`
    );
    process.exit(1);
  }

  app.listen(config.port, config.host, () => {
    console.log(
      `[api] Enlace Empresarial → http://${config.host}:${config.port}`
    );
  });
}

start().catch((err) => {
  console.error('[api] No arrancó:', err.message);
  process.exit(1);
});
