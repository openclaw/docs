---
read_when:
    - Creación de clientes de API
    - Agregar endpoints o esquemas
summary: Descripción general y convenciones de la API REST pública (v1).
x-i18n:
    generated_at: "2026-07-04T03:34:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Reutilización del catálogo público

Puedes crear un catálogo, directorio o superficie de búsqueda de terceros sobre las API públicas de lectura de ClawHub. Los metadatos públicos de Skills y los archivos de Skills se publican bajo las reglas de licencia de Skills de ClawHub, mientras que la API en sí tiene límites de tasa y debe consumirse de forma responsable.

Directrices:

- Usa endpoints públicos de lectura como `GET /api/v1/skills`, `GET /api/v1/search` y `GET /api/v1/skills/{slug}` para listados de catálogo.
- Almacena en caché las respuestas y respeta `429`, `Retry-After` y los encabezados de límite de tasa en lugar de sondear agresivamente.
- Enlaza de vuelta a la URL canónica de Skills de ClawHub al mostrar listados para que los usuarios puedan inspeccionar el registro de origen.
- Usa URL de página canónicas con el formato `https://clawhub.ai/<owner>/skills/<slug>`.
- No des a entender que ClawHub respalda, verifica u opera el sitio de terceros.
- No repliques contenido oculto, privado o bloqueado por moderación eludiendo filtros de API pública o límites de autenticación.

## Auth

- Lectura pública: no se requiere token.
- Escritura + cuenta: `Authorization: Bearer clh_...`.

## Límites de tasa

Aplicación consciente de Auth:

- Solicitudes anónimas: por IP.
- Solicitudes autenticadas (token Bearer válido): por cubo de usuario.
- Un token faltante o no válido recurre a la aplicación por IP.

- Lectura: 3000/min por IP, 12000/min por clave
- Escritura: 300/min por IP, 3000/min por clave
- Descarga: 1200/min por IP, 6000/min por clave

Encabezados: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` y `Retry-After` se incluyen en `429`.

Semántica:

- `X-RateLimit-Reset`: segundos de época Unix (hora absoluta de restablecimiento)
- `RateLimit-Reset`: segundos de demora hasta el restablecimiento
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: presupuesto restante exacto cuando
  está presente; las solicitudes exitosas fragmentadas lo omiten en lugar de devolver un valor
  global aproximado
- `Retry-After`: segundos de demora que esperar en `429`

Ejemplo `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Manejo del cliente:

- Prefiere `Retry-After` cuando esté presente.
- De lo contrario, usa `RateLimit-Reset` o deriva la demora de `X-RateLimit-Reset`.
- Añade jitter a los reintentos.

## Errores

- Los errores v1 son texto sin formato (`text/plain; charset=utf-8`), incluidos `400`,
  `401`, `403`, `404`, `429` y respuestas de descarga bloqueada.
- Los parámetros de consulta desconocidos se ignoran por compatibilidad.
- Los parámetros de consulta conocidos con valores no válidos devuelven `400`.

## Endpoints

Lectura pública:

- `GET /api/v1/search?q=...`
  - Filtros opcionales: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias heredado: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (predeterminado), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), los alias heredados de instalación `installsCurrent`/`installs`/`installsAllTime` se asignan a `downloads`, `trending`
  - Los valores de `sort` no válidos devuelven `400`
  - `cursor` se aplica a ordenaciones que no sean `trending`
  - Filtro opcional: `nonSuspiciousOnly=true`
  - Alias heredado: `nonSuspicious=true`
  - Con `nonSuspiciousOnly=true`, las páginas basadas en cursor pueden contener menos de `limit` elementos; usa `nextCursor` para continuar.
  - `recommended` usa señales de interacción y actualidad.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Las Skills alojadas devuelven bytes ZIP deterministas.
  - Las Skills actuales respaldadas por GitHub con un escaneo `clean` o `suspicious` devuelven un
    descriptor de transferencia JSON `public-github` en lugar de bytes de ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Las Skills alojadas se exportan como archivos almacenados.
  - Las Skills actuales respaldadas por GitHub con un escaneo `clean` o `suspicious` se exportan
    como descriptores de transferencia `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (predeterminado), `recommended`, `downloads`, alias heredado `installs`
  - Los valores de `sort` no válidos devuelven `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (predeterminado), `downloads`, `updated`, alias heredado `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Auth requerida:

- `POST /api/v1/skills` (publicación, se prefiere multipart)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Solo administradores:

- `POST /api/v1/users/reserve` reserva slugs raíz y marcadores privados de paquetes sin lanzamiento para un identificador de propietario.

## Legacy

Legacy `/api/*` y `/api/cli/*` siguen disponibles. Consulta `DEPRECATIONS.md`.
