# Publicar Enlace Empresarial en Vercel (monorepo → un solo proyecto)

Un dominio sirve **web (SvelteKit)** + **API (Express serverless)** en `/api/*`.

## 1. GitHub

```bash
# Desde la raíz del monorepo (si aún no hay remoto)
git init   # solo si hace falta
git add .
git commit -m "Prepare deploy Vercel monorepo"
gh repo create EnlaceEmpresarial --private --source=. --remote=origin --push
# o: git remote add origin git@github.com:TU_ORG/EnlaceEmpresarial.git && git push -u origin main
```

## 2. Importar en Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → importa el repo de GitHub.
2. **Root Directory:** `apps/web`  
   (Framework: SvelteKit; el `installCommand` del `apps/web/vercel.json` instala el monorepo desde la raíz.)
3. **Framework Preset:** SvelteKit.

## 3. Variables de entorno (Production + Preview)

| Variable | Valor |
| --- | --- |
| `MONGODB_URI` | URI Atlas con DB `EnlaceEmpresarial` |
| `JWT_SECRET` | secreto fuerte (no el de desarrollo) |
| `CONFIDENCE_THRESHOLD` | `0.7` (opcional) |
| `PUBLIC_API_URL` | **dejar vacío** (mismo origen `/api`) |

No hace falta `PORT` ni `HOST` en Vercel.

## 4. Atlas Network Access

En MongoDB Atlas → Network Access → permite `0.0.0.0/0` (o las IPs de Vercel) para que las funciones serverless conecten.

## 5. Seed (una vez)

Con la misma `MONGODB_URI` en local:

```bash
pnpm seed
```

## 6. Local vs producción

| | Local | Vercel |
| --- | --- | --- |
| Web | `pnpm dev:web` → `:5710` | dominio `*.vercel.app` |
| API | `pnpm dev:api` → `:4710` | `/api/*` en el mismo dominio |
| `PUBLIC_API_URL` | `http://127.0.0.1:4710` | vacío |

## Notas

- Uploads en Vercel van a `/tmp` (efímeros). Para producción real después: S3 u otro storage.
- Sin SMTP / Google (fuera del MVP).
