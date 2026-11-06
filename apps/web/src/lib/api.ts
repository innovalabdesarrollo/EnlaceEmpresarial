import { browser, dev } from '$app/environment';

/** Vacío = mismo origen (Vercel). Local default: API en 4710. */
const API =
  import.meta.env.PUBLIC_API_URL ?? (dev ? 'http://127.0.0.1:4710' : '');

export type User = {
  id: string;
  email: string;
  rol: 'cliente' | 'contable';
  clienteId: string | null;
  nombre: string;
};

function token(): string | null {
  if (!browser) return null;
  return localStorage.getItem('ee_token');
}

export function saveSession(t: string, user: User) {
  localStorage.setItem('ee_token', t);
  localStorage.setItem('ee_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('ee_token');
  localStorage.removeItem('ee_user');
}

export function getStoredUser(): User | null {
  if (!browser) return null;
  const raw = localStorage.getItem('ee_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit & { form?: FormData } = {}
): Promise<T> {
  const headers = new Headers(opts.headers || {});
  const t = token();
  if (t) headers.set('Authorization', `Bearer ${t}`);

  let body = opts.body;
  if (opts.form) {
    body = opts.form;
  } else if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API}${path}`, { ...opts, headers, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
  return data as T;
}

export function estadoBadge(estado: string) {
  if (['clasificado', 'procesado', 'enviado'].includes(estado)) return 'badge-ok';
  if (['en_revision', 'listo_envio', 'recibido', 'preparado', 'pendiente'].includes(estado))
    return 'badge-warn';
  if (['error', 'fallido', 'bloqueado'].includes(estado)) return 'badge-danger';
  return 'badge-info';
}

export function labelEstado(estado: string) {
  return estado.replaceAll('_', ' ');
}

export async function downloadFile(docId: string, name: string) {
  const t = token();
  const res = await fetch(`${API}/api/documentos/${docId}/download`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Descarga CSV/Excel autenticada (p. ej. reporte de envíos). */
export async function downloadAuthed(path: string, name: string) {
  const t = token();
  const res = await fetch(`${API}${path}`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}


