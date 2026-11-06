# Publicar Enlace Empresarial en Vercel (Services)

Un proyecto Vercel con **dos servicios** en el mismo dominio:

| Servicio | Root | Público |
| --- | --- | --- |
| `api` | `apps/api` (Express) | sí → `/api/*` |
| `web` | `apps/web` (SvelteKit) | sí → resto de rutas |

Configuración: `vercel.json` en la **raíz** del monorepo (modo `services`).

## 1. GitHub

```bash
git add .
git commit -m "Configure Vercel services (web + api)"
git remote add origin git@github.com:TU_ORG/EnlaceEmpresarial.git   # si falta
git push -u origin main
```

## 2. Importar en Vercel

1. **Add New Project** → repo de GitHub.
2. **Root Directory:** dejar la **raíz del repo** (donde está `vercel.json` con `services`).
3. No uses Root Directory = `apps/web` con este modelo.

## 3. Variables de entorno (Production + Preview)

Aplican al proyecto (compartidas entre servicios):

| Variable | Valor |
| --- | --- |
| `MONGODB_URI` | URI Atlas · DB `EnlaceEmpresarial` |
| `JWT_SECRET` | secreto fuerte |
| `CONFIDENCE_THRESHOLD` | `0.7` (opcional) |
| `PUBLIC_API_URL` | **vacío** (el navegador usa `/api` del mismo dominio) |

No definas bindings env (`API_URL`, etc.): el cliente habla por rewrite público.

## 4. Atlas

Network Access → `0.0.0.0/0` (o IPs de Vercel).

## 5. Seed (una vez)

```bash
pnpm seed
```

## 6. Local

| | Comando |
| --- | --- |
| Todo con Vercel | `vercel dev` (inyecta servicios) |
| Clásico | `pnpm dev:api` + `pnpm dev:web` · `PUBLIC_API_URL=http://127.0.0.1:4710` |

## Notas

- Uploads en Vercel → `/tmp` (efímeros).
- No hay **service bindings**: el browser llama `/api/*` por rewrite público; no hay llamadas server-to-server web→api hoy.
- Sin SMTP / Google (fuera del MVP).
