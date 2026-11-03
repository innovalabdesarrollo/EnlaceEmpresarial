/**
 * Ronda estratégica: flujo crítico del MVP contra API + Atlas.
 * Requiere API en marcha (pnpm dev:api) y seed demo.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
const API = process.env.PUBLIC_API_URL || 'http://127.0.0.1:4710';

async function json(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (opts.token) headers.set('Authorization', `Bearer ${opts.token}`);
  if (opts.body && !(opts.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

describe('Enlace Empresarial — humo estratégico', () => {
  let clienteToken = '';
  let contableToken = '';
  let documentoId = '';
  let envioId = '';

  before(async () => {
    const health = await fetch(`${API}/health`).catch(() => null);
    assert.ok(health?.ok, `API no responde en ${API}. Arranca con: pnpm dev:api`);
  });

  it('health + Mongo Atlas conectado', async () => {
    const { res, data } = await json('/health');
    assert.equal(res.status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.mongo?.state, 'connected');
    assert.equal(data.mongo?.db, 'EnlaceEmpresarial');
  });

  it('login inválido rechaza', async () => {
    const { res, data } = await json('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'cliente@demo.local', password: 'mala' }),
    });
    assert.equal(res.status, 401);
    assert.ok(data.error);
  });

  it('login cliente y contable demo', async () => {
    const c = await json('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'cliente@demo.local', password: 'cliente123' }),
    });
    assert.equal(c.res.status, 200);
    assert.ok(c.data.token);
    assert.equal(c.data.user.rol, 'cliente');
    clienteToken = c.data.token;

    const t = await json('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'contable@demo.local', password: 'contable123' }),
    });
    assert.equal(t.res.status, 200);
    assert.ok(t.data.token);
    assert.equal(t.data.user.rol, 'contable');
    contableToken = t.data.token;
  });

  it('ruta protegida sin token → 401', async () => {
    const { res } = await json('/api/documentos');
    assert.equal(res.status, 401);
  });

  it('cliente sube documento y se clasifica', async () => {
    const form = new FormData();
    form.append(
      'files',
      new Blob(['prueba enlace empresarial\n'], { type: 'text/plain' }),
      'factura_AAA010101AAA_test.txt'
    );

    const { res, data } = await json('/api/documentos/upload', {
      method: 'POST',
      token: clienteToken,
      body: form,
    });

    assert.ok([200, 201].includes(res.status), data.error || JSON.stringify(data));
    const doc = data.documentos?.[0] || data.results?.[0];
    assert.ok(doc, 'sin documento en respuesta');
    documentoId = doc.id || doc._id;
    assert.ok(documentoId);
    assert.ok(
      ['clasificado', 'en_revision', 'recibido', 'error'].includes(doc.estado),
      `estado inesperado: ${doc.estado}`
    );
  });

  it('contable ve clasificados, carpetas y reglas', async () => {
    const clas = await json('/api/contable/clasificados', { token: contableToken });
    assert.equal(clas.res.status, 200);
    assert.ok(Array.isArray(clas.data.documentos));
    assert.ok(clas.data.documentos.some((d) => d._id === documentoId));

    const carps = await json('/api/contable/carpetas', { token: contableToken });
    assert.equal(carps.res.status, 200);
    assert.ok(carps.data.carpetas?.length >= 1);

    const reglas = await json('/api/contable/reglas', { token: contableToken });
    assert.equal(reglas.res.status, 200);
    assert.ok(reglas.data.reglas?.length >= 1);
  });

  it('listo-envio → cola → marcar enviado (simulado)', async () => {
    const listo = await json('/api/contable/listo-envio', {
      method: 'POST',
      token: contableToken,
      body: JSON.stringify({ documentoIds: [documentoId] }),
    });
    assert.equal(listo.res.status, 200, listo.data.error);
    const envio = listo.data.resultados?.[0]?.envio;
    assert.ok(envio?._id);
    envioId = envio._id;
    assert.ok(['preparado', 'bloqueado'].includes(envio.estado), envio.estado);

    if (envio.estado === 'bloqueado') {
      const rev = await json(`/api/contable/cola-envio/${envioId}/revalidar`, {
        method: 'POST',
        token: contableToken,
        body: JSON.stringify({ destinatarioEmail: 'cliente@demo.local' }),
      });
      assert.equal(rev.res.status, 200);
      assert.equal(rev.data.envio?.estado, 'preparado');
    }

    const enviado = await json(`/api/contable/cola-envio/${envioId}/marcar-enviado`, {
      method: 'POST',
      token: contableToken,
    });
    assert.equal(enviado.res.status, 200, enviado.data.error);
    assert.equal(enviado.data.envio?.estado, 'enviado');
    assert.ok(enviado.data.envio?.fechaEnvio);
  });

  it('cliente ve envío en historial', async () => {
    const { res, data } = await json('/api/notificaciones/envios-cliente', {
      token: clienteToken,
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(data.envios));
    assert.ok(data.envios.some((e) => e._id === envioId && e.estado === 'enviado'));
  });
});
