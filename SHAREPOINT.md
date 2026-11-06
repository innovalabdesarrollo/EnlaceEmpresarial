# SharePoint — accesos para sync / envíos automáticos

La sincronización completa con Microsoft Graph **aún no está conectada**. El panel ya expone estado, botón de prueba y esta lista de permisos para pedir al cliente.

## Qué pedir al despacho

1. **Tenant** Microsoft 365 / Entra ID (ID de directorio).
2. **App registration** (o crear una): Client ID + Client Secret.
3. **Site** de SharePoint del despacho (URL) y, si se puede, **Site ID** / **Drive ID**.
4. Carpeta raíz documental, p. ej. `PERSONAS FISICAS` (y subárbol ACT EMPRESARIAL / …).
5. Consentimiento de administrador a los permisos Application.

## Permisos Graph recomendados

| Permiso | Tipo | Uso |
| --- | --- | --- |
| `Sites.Selected` | Application | Acceso solo al sitio autorizado (preferido en prod). |
| `Files.Read.All` | Application | Alternativa amplia para lectura de archivos. |
| `Files.ReadWrite.All` | Application | Si hay que mover/etiquetar tras el envío. |
| `User.Read.All` | Application | Opcional (metadatos de dueños). |

Con `Sites.Selected` hace falta además grant explícito del sitio a la app (Graph / PowerShell).

## Variables de entorno

```bash
SHAREPOINT_TENANT_ID=
SHAREPOINT_CLIENT_ID=
SHAREPOINT_CLIENT_SECRET=
SHAREPOINT_SITE_ID=
SHAREPOINT_DRIVE_ID=
SHAREPOINT_ROOT_FOLDER=PERSONAS FISICAS
```

Mientras no estén, el foco operativo sigue siendo **automatización de correos** (reglas + SMTP + confirmar recepción).
