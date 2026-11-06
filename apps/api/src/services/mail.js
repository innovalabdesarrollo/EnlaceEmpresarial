import nodemailer from 'nodemailer';
import { config } from '../config.js';

export function smtpConfigured() {
  const { host, user, pass, from } = config.smtp;
  return Boolean(host && user && pass && from);
}

export function mailStatus() {
  return {
    configured: smtpConfigured(),
    host: config.smtp.host || null,
    from: config.smtp.from || null,
    mode: smtpConfigured() ? 'smtp' : 'simulado',
  };
}

function transporter() {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

/**
 * Envía correo de documento con botón Confirmar recepción.
 * Si SMTP no está configurado, no envía (caller marca simulado).
 */
export async function sendDocumentoEmail({
  to,
  asunto,
  nombreArchivo,
  carpeta,
  confirmUrl,
  clienteNombre,
}) {
  if (!smtpConfigured()) {
    return { ok: false, simulated: true, error: 'SMTP no configurado' };
  }

  const html = `
  <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
    <p>Hola${clienteNombre ? ` ${clienteNombre}` : ''},</p>
    <p>Te compartimos el documento <strong>${escapeHtml(nombreArchivo)}</strong>
    ${carpeta ? ` (carpeta: <em>${escapeHtml(carpeta)}</em>)` : ''}.</p>
    <p style="margin:24px 0">
      <a href="${confirmUrl}"
         style="background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
        Confirmar recepción
      </a>
    </p>
    <p style="font-size:13px;color:#64748b">Si el botón no funciona, abre: ${confirmUrl}</p>
  </div>`;

  const info = await transporter().sendMail({
    from: config.smtp.from,
    to,
    subject: asunto,
    text: `Documento: ${nombreArchivo}\nConfirmar recepción: ${confirmUrl}`,
    html,
  });

  return { ok: true, simulated: false, messageId: info.messageId };
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
