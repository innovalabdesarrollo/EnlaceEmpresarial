import { config } from '../config.js';

/** Permisos Microsoft Graph necesarios para sync + envíos desde SharePoint. */
export const SHAREPOINT_PERMISOS = [
  {
    permiso: 'Sites.Selected',
    tipo: 'Application',
    para: 'Acceso limitado al sitio SharePoint autorizado (recomendado en producción).',
  },
  {
    permiso: 'Files.Read.All',
    tipo: 'Application',
    para: 'Leer archivos/carpetas del drive (alternativa más amplia a Sites.Selected).',
  },
  {
    permiso: 'Files.ReadWrite.All',
    tipo: 'Application',
    para: 'Si el sistema debe mover o etiquetar archivos tras el envío.',
  },
  {
    permiso: 'User.Read.All',
    tipo: 'Application',
    para: 'Opcional: resolver dueños/metadatos de carpetas de cliente.',
  },
];

export function sharepointConfigured() {
  const s = config.sharepoint;
  return Boolean(s.tenantId && s.clientId && s.clientSecret && s.siteId);
}

export function sharepointStatus() {
  const s = config.sharepoint;
  return {
    configured: sharepointConfigured(),
    ready: false,
    message: sharepointConfigured()
      ? 'Credenciales presentes. Sync Graph aún no conectado (stub listo para fase 2).'
      : 'SharePoint no configurado. Define variables SHAREPOINT_* (ver SHAREPOINT.md).',
    siteId: s.siteId || null,
    driveId: s.driveId || null,
    rootFolder: s.rootFolder || null,
    permisosRequeridos: SHAREPOINT_PERMISOS,
    pasos: [
      'Registrar app en Entra ID (Azure AD) del tenant del cliente.',
      'Otorgar permisos Application listados y consentimiento de admin.',
      'Crear Sites.Selected grant al sitio del despacho (si usan ese modelo).',
      'Compartir Site ID / Drive ID y carpeta raíz (p. ej. PERSONAS FISICAS).',
      'Cargar SHAREPOINT_TENANT_ID, CLIENT_ID, CLIENT_SECRET, SITE_ID en Vercel.',
    ],
  };
}

/** Stub: no descarga ni sincroniza aún. */
export async function syncSharepointStub() {
  const status = sharepointStatus();
  return {
    ok: false,
    synced: 0,
    ...status,
    detail:
      'Sincronización diferida: el foco actual es automatización de correos. ' +
      'Cuando el cliente entregue accesos, se conecta Microsoft Graph aquí.',
  };
}
