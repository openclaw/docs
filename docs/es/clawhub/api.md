---
read_when:
    - Creación de clientes de API
    - Agregar puntos de conexión o esquemas
summary: Descripción general y convenciones de la API REST pública (v1).
x-i18n:
    generated_at: "2026-05-13T04:17:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Reutilización del catálogo público

Puedes crear un catálogo, directorio o superficie de búsqueda de terceros sobre las API públicas de lectura de ClawHub. Los metadatos públicos de habilidades y los archivos de habilidades se publican según las reglas de licencia de habilidades de ClawHub, mientras que la API en sí tiene límite de tasa y debe consumirse de forma responsable.

Directrices:

- Usa endpoints públicos de lectura como `GET /api/v1/skills`, `GET /api/v1/search` y `GET /api/v1/skills/{slug}` para listados de catálogo.
- Almacena respuestas en caché y respeta `429`, `Retry-After` y los encabezados de límite de tasa en lugar de sondear agresivamente.
- Enlaza a la URL canónica de la habilidad de ClawHub al mostrar listados para que los usuarios puedan inspeccionar el registro de origen del registro.
- Usa URL de páginas canónicas con la forma `https://clawhub.ai/<owner>/<slug>`.
- No des a entender que ClawHub respalda, verifica u opera el sitio de terceros.
- No repliques contenido oculto, privado o bloqueado por moderación eludiendo filtros de API públicas o límites de autenticación.

## Autenticación

- Lectura pública: no se requiere token.
- Escritura + cuenta: `Authorization: Bearer clh_...`.

## Límites de tasa

Aplicación consciente de la autenticación:

- Solicitudes anónimas: por IP.
- Solicitudes autenticadas (token Bearer válido): por segmento de usuario.
- Un token ausente/no válido recurre a la aplicación por IP.

- Lectura: 600/min por IP, 2400/min por clave
- Escritura: 45/min por IP, 180/min por clave

Encabezados: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (en `429`).

Semántica:

- `X-RateLimit-Reset`: segundos de época Unix (hora absoluta de restablecimiento)
- `RateLimit-Reset`: segundos de demora hasta el restablecimiento
- `Retry-After`: segundos de demora para esperar en `429`

Ejemplo de `429`:

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

## Endpoints

Lectura pública:

- `GET /api/v1/search?q=...`
  - Filtros opcionales: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias heredado: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (predeterminado), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` se aplica a ordenaciones que no sean `trending`
  - Filtro opcional: `nonSuspiciousOnly=true`
  - Alias heredado: `nonSuspicious=true`
  - Con `nonSuspiciousOnly=true`, las páginas basadas en cursor pueden contener menos de `limit` elementos; usa `nextCursor` para continuar.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Autenticación requerida:

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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Solo administradores:

- `POST /api/v1/users/reserve` reserva slugs raíz y marcadores de posición de paquetes privados sin lanzamientos para un identificador de propietario.

## Heredado

Los `/api/*` y `/api/cli/*` heredados siguen disponibles. Consulta `DEPRECATIONS.md`.
