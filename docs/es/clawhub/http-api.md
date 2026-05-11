---
read_when:
    - Añadir/cambiar puntos de conexión
    - Depuración de solicitudes CLI ↔ registro
summary: Referencia de la API HTTP (puntos de conexión públicos + puntos de conexión de CLI + autenticación).
x-i18n:
    generated_at: "2026-05-11T20:24:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL base: `https://clawhub.ai` (predeterminada).

Todas las rutas v1 están bajo `/api/v1/...`.
Las rutas heredadas `/api/...` y `/api/cli/...` se mantienen por compatibilidad (consulta `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Reutilización del catálogo público

Los directorios de terceros pueden usar los endpoints públicos de lectura para listar o buscar Skills de ClawHub. Almacena los resultados en caché, respeta `429`/`Retry-After`, enlaza a los usuarios de vuelta al listado canónico de ClawHub (`https://clawhub.ai/<owner>/<slug>`) y evita insinuar que ClawHub respalda el sitio de terceros. No intentes replicar contenido oculto, privado o bloqueado por moderación fuera de la superficie de la API pública.

Los accesos directos de slug web se resuelven entre familias de registro, pero los clientes de API deben usar
las URL canónicas devueltas por los endpoints de lectura en lugar de reconstruir la precedencia
de rutas.

## Límites de tasa

Modelo de aplicación:

- Solicitudes anónimas: se aplican por IP.
- Solicitudes autenticadas (token Bearer válido): se aplican por bucket de usuario.
- Si el token falta o no es válido, el comportamiento recurre a la aplicación por IP.
- Los endpoints de escritura autenticados no deben devolver un simple `Unauthorized` cuando
  el servidor conoce el motivo. Los tokens ausentes, tokens no válidos o revocados, y
  las cuentas eliminadas, bloqueadas o deshabilitadas deben recibir texto accionable para que los clientes
  CLI puedan indicar a los usuarios qué los bloqueó.

- Lectura: 600/min por IP, 2400/min por clave
- Escritura: 45/min por IP, 180/min por clave
- Descarga: 30/min por IP, 180/min por clave (`/api/v1/download`)

Encabezados:

- Compatibilidad heredada: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Estandarizados: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- En `429`: `Retry-After`

Semántica de encabezados:

- `X-RateLimit-Reset`: segundos absolutos de época Unix
- `RateLimit-Reset`: segundos hasta el restablecimiento (demora)
- `Retry-After`: segundos que se deben esperar antes de reintentar (demora) en `429`

Ejemplo de respuesta `429`:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

Guía para clientes:

- Si existe `Retry-After`, espera esa cantidad de segundos antes de reintentar.
- Usa backoff con jitter para evitar reintentos sincronizados.
- Si falta `Retry-After`, recurre a `RateLimit-Reset` (o calcula a partir de `X-RateLimit-Reset`).

Origen de IP:

- Usa `cf-connecting-ip` (Cloudflare) para la IP del cliente de forma predeterminada.
- ClawHub usa encabezados de reenvío confiables para identificar las IP de cliente en el borde.
- Si no hay una IP de cliente confiable disponible, las solicitudes de descarga anónimas usan un bucket de reserva con alcance de endpoint en lugar de un único bucket global `ip:unknown`. Las solicitudes anónimas de lectura/escritura siguen usando el bucket desconocido compartido para que el enrutamiento sin IP siga siendo visible y conservador.

## Endpoints públicos (sin autenticación)

### `GET /api/v1/search`

Parámetros de consulta:

- `q` (obligatorio): cadena de consulta
- `limit` (opcional): entero
- `highlightedOnly` (opcional): `true` para filtrar a Skills destacados
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills sospechosos (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias heredado para `nonSuspiciousOnly`

Respuesta:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

Notas:

- Los resultados se devuelven por orden de relevancia (similitud de embeddings + aumentos por coincidencia exacta de tokens de slug/nombre + prioridad de popularidad según descargas).
- La relevancia pesa más que la popularidad. Una coincidencia precisa con un token de slug o nombre visible puede superar a una coincidencia más laxa con muchas más descargas.
- El texto ASCII se tokeniza en límites de palabras y puntuación. Por ejemplo, `personal-map` contiene un token independiente `map`, mientras que `amap-jsapi-skill` contiene `amap`, `jsapi` y `skill`; por lo tanto, buscar `map` le da a `personal-map` una coincidencia léxica más fuerte que a `amap-jsapi-skill`.
- Las descargas se usan como una pequeña prioridad escalada logarítmicamente y como criterio de desempate, no como la señal principal de clasificación. Los Skills con muchas descargas pueden clasificarse más abajo cuando el texto de la consulta tiene una coincidencia más débil.
- El estado de moderación sospechoso u oculto puede quitar un Skill de la búsqueda pública según los filtros del llamador y el estado de moderación actual.

Guía de descubribilidad para publicadores:

- Incluye los términos que los usuarios buscarán literalmente en el nombre visible, el resumen y las etiquetas. Usa un token de slug independiente solo cuando también sea una identidad estable que quieras conservar.
- No cambies el nombre de un slug solo para perseguir una consulta, a menos que el nuevo slug sea un mejor nombre canónico a largo plazo. Los slugs antiguos se convierten en alias de redirección, pero la URL canónica, el slug mostrado y los futuros resúmenes de búsqueda usan el nuevo slug.
- Los alias de cambio de nombre preservan la resolución para URL antiguas e instalaciones que se resuelven a través del registro, pero la clasificación de búsqueda se basa en los metadatos canónicos del Skill después de que el cambio de nombre se haya indexado. Las estadísticas existentes permanecen con el Skill.
- Si un Skill está inesperadamente invisible, revisa primero el estado de moderación con `clawhub inspect <slug>` mientras tienes sesión iniciada antes de cambiar metadatos relacionados con la clasificación.

### `GET /api/v1/skills`

Parámetros de consulta:

- `limit` (opcional): entero (1–200)
- `cursor` (opcional): cursor de paginación para cualquier orden que no sea `trending`
- `sort` (opcional): `updated` (predeterminado), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills sospechosos (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias heredado para `nonSuspiciousOnly`

Notas:

- `trending` clasifica por instalaciones en los últimos 7 días (basado en telemetría).
- `createdAt` es estable para rastreos de Skills nuevos; `updated` cambia cuando los Skills existentes se vuelven a publicar.
- Cuando `nonSuspiciousOnly=true`, los ordenamientos basados en cursor pueden devolver menos de `limit` elementos en una página porque los Skills sospechosos se filtran después de recuperar la página.
- Usa `nextCursor` para continuar la paginación cuando esté presente. Una página corta no significa por sí sola que se hayan terminado los resultados.

Respuesta:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

Respuesta:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

Notas:

- Los slugs antiguos creados por flujos de cambio de nombre/fusión de propietario se resuelven al Skill canónico.
- `metadata.os`: restricciones de SO declaradas en el frontmatter del Skill (por ejemplo, `["macos"]`, `["linux"]`). `null` si no se declararon.
- `metadata.systems`: objetivos de sistema Nix (por ejemplo, `["aarch64-darwin", "x86_64-linux"]`). `null` si no se declararon.
- `metadata` es `null` si el Skill no tiene metadatos de plataforma.
- `moderation` se incluye solo cuando el Skill está marcado o el propietario lo está viendo.

### `GET /api/v1/skills/{slug}/moderation`

Devuelve el estado de moderación estructurado.

Respuesta:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

Notas:

- Los propietarios y moderadores pueden acceder a los detalles de moderación de Skills ocultos.
- Los llamadores públicos solo reciben `200` para Skills visibles ya marcados.
- La evidencia se redacta para los llamadores públicos y solo incluye fragmentos sin procesar para propietarios/moderadores.

### `POST /api/v1/skills/{slug}/report`

Reporta un Skill para revisión de moderadores. Los reportes son a nivel de Skill, opcionalmente vinculados
a una versión, y alimentan la cola de reportes de Skills.

Autenticación:

- Requiere un token de API.

Solicitud:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Respuesta:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `POST /api/v1/skills/{slug}/appeal`

Endpoint para propietario/publicador del Skill para apelar la moderación de un Skill.

Autenticación:

- Requiere un token de API para el propietario del Skill o un miembro publicador.

Solicitud:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

Se aceptan apelaciones para resultados de Skills ocultos, eliminados, sospechosos, maliciosos o
marcados por el escáner. ClawHub mantiene una apelación abierta por Skill.

Respuesta:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

Solicita un nuevo escaneo de seguridad para la última versión publicada del Skill.

Autenticación:

- Requiere un token de API para el propietario del Skill, el administrador del publicador, el
  moderador de la plataforma o el administrador de la plataforma.
- Los propietarios y administradores de publicador están sujetos al límite de recuperación de propietario
  por versión. Los moderadores y administradores de plataforma no lo están, pero ClawHub sigue permitiendo solo
  un nuevo escaneo activo por versión.

Respuesta:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

Endpoint de moderador/administrador para la recepción de reportes de Skills.

Parámetros de consulta:

- `status` (opcional): `open` (predeterminado), `confirmed`, `dismissed` o `all`
- `limit` (opcional): entero (1-200)
- `cursor` (opcional): cursor de paginación

Respuesta:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Endpoint de moderador/administrador para resolver o reabrir reportes de Skills.

Solicitud:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` es obligatorio para `confirmed` y `dismissed`; puede omitirse al
volver a establecer `status` en `open`. Pasa `finalAction: "hide"` con un reporte
clasificado para ocultar el Skill en el mismo flujo auditable.

### `GET /api/v1/skills/-/appeals`

Endpoint de moderador/administrador para la recepción de apelaciones de Skills.

Parámetros de consulta:

- `status` (opcional): `open` (predeterminado), `accepted`, `rejected` o `all`
- `limit` (opcional): entero (1-200)
- `cursor` (opcional): cursor de paginación

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

Endpoint de moderador/administrador para aceptar, rechazar o reabrir una apelación de Skill.
`note` es obligatorio para `accepted` y `rejected`; puede omitirse al volver a establecer
`status` en `open`. Pasa `finalAction: "restore"` con una apelación aceptada
para que el Skill vuelva a estar disponible.

### `GET /api/v1/skills/{slug}/versions`

Parámetros de consulta:

- `limit` (opcional): entero
- `cursor` (opcional): cursor de paginación

### `GET /api/v1/skills/{slug}/versions/{version}`

Devuelve metadatos de la versión + lista de archivos.

- `version.security` incluye el estado normalizado de verificación del escaneo y detalles del escáner
  (VirusTotal + LLM), cuando están disponibles.

### `GET /api/v1/skills/{slug}/scan`

Devuelve detalles de verificación del escaneo de seguridad para una versión de skill.

Parámetros de consulta:

- `version` (opcional): cadena de versión específica.
- `tag` (opcional): resuelve una versión etiquetada (por ejemplo `latest`).

Notas:

- Si no se proporciona ni `version` ni `tag`, usa la versión más reciente.
- Incluye el estado normalizado de verificación más detalles específicos del escáner.
- `security.capabilityTags` incluye etiquetas deterministas de capacidad/riesgo como
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` y `posts-externally` cuando se detectan.
- `security.hasScanResult` es `true` solo cuando un escáner produjo un veredicto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` es una instantánea actual de moderación a nivel de skill derivada de la versión más reciente.
- Al consultar una versión histórica, comprueba `moderation.matchesRequestedVersion` y `moderation.sourceVersion` antes de tratar `moderation` y `security` como el mismo contexto de versión.

### `GET /api/v1/skills/{slug}/file`

Devuelve contenido de texto sin procesar.

Parámetros de consulta:

- `path` (obligatorio)
- `version` (opcional)
- `tag` (opcional)

Notas:

- Usa por defecto la versión más reciente.
- Límite de tamaño de archivo: 200 KB.

### `GET /api/v1/packages`

Endpoint de catálogo unificado para:

- skills
- plugins de código
- plugins de paquete

Parámetros de consulta:

- `limit` (opcional): entero (1–100)
- `cursor` (opcional): cursor de paginación
- `family` (opcional): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opcional): `official`, `community` o `private`
- `isOfficial` (opcional): `true` o `false`
- `executesCode` (opcional): `true` o `false`
- `capabilityTag` (opcional): filtro de capacidad para paquetes de plugin
- `target` / `hostTarget` (opcional): forma abreviada de `host:<target>`
- `os`, `arch`, `libc` (opcional): forma abreviada para filtros de capacidad de host
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opcional): forma abreviada `true`/`1` para etiquetas de requisito de entorno
- `externalService`, `binary`, `osPermission` (opcional): forma abreviada para etiquetas de requisitos de entorno con nombre
- `artifactKind` (opcional): `legacy-zip` o `npm-pack`
- `npmMirror` (opcional): `true`/`1` para mostrar versiones de paquetes respaldadas por ClawPack
  disponibles a través del espejo de npm

Notas:

- `GET /api/v1/code-plugins` y `GET /api/v1/bundle-plugins` siguen siendo alias de familia fija.
- Las entradas de skill siguen respaldadas por el registro de skills y aún solo pueden publicarse mediante `POST /api/v1/skills`.
- `POST /api/v1/packages` sigue siendo solo para versiones de code-plugin y bundle-plugin.
- Los llamadores anónimos solo ven canales de paquetes públicos.
- Los llamadores autenticados pueden ver paquetes privados de los publicadores a los que pertenecen en resultados de lista/búsqueda.
- `channel=private` solo devuelve paquetes que el llamador autenticado puede leer.

### `GET /api/v1/packages/search`

Búsqueda de catálogo unificado en skills + paquetes de plugin.

Parámetros de consulta:

- `q` (obligatorio): cadena de consulta
- `limit` (opcional): entero (1–100)
- `family` (opcional): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opcional): `official`, `community` o `private`
- `isOfficial` (opcional): `true` o `false`
- `executesCode` (opcional): `true` o `false`
- `capabilityTag` (opcional): filtro de capacidad para paquetes de plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` y
  `osPermission` se aceptan como formas abreviadas para etiquetas de capacidad comunes
- `artifactKind` (opcional): `legacy-zip` o `npm-pack`
- `npmMirror` (opcional): `true`/`1` para buscar versiones de paquetes respaldadas por ClawPack
  disponibles a través del espejo de npm

Notas:

- Los llamadores anónimos solo ven canales de paquetes públicos.
- Los llamadores autenticados pueden buscar paquetes privados de los publicadores a los que pertenecen.
- `channel=private` solo devuelve paquetes que el llamador autenticado puede leer.
- Los filtros de artefactos están respaldados por etiquetas de capacidad indexadas:
  `artifact:legacy-zip`, `artifact:npm-pack` y `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Devuelve metadatos detallados del paquete.

Notas:

- Las skills también pueden resolverse mediante esta ruta en el catálogo unificado.
- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.

### `DELETE /api/v1/packages/{name}`

Elimina de forma lógica un paquete y todas sus versiones.

Notas:

- Requiere un token de API para el propietario del paquete, un propietario/administrador de publicador de organización,
  moderador de plataforma o administrador de plataforma.

### `GET /api/v1/packages/{name}/versions`

Devuelve el historial de versiones.

Parámetros de consulta:

- `limit` (opcional): entero (1–100)
- `cursor` (opcional): cursor de paginación

Notas:

- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/versions/{version}`

Devuelve una versión de paquete, incluidos metadatos de archivos, compatibilidad,
capacidades, verificación, metadatos de artefactos y datos de escaneo.

Notas:

- `version.artifact.kind` es `legacy-zip` para archivos de paquete del mundo antiguo o
  `npm-pack` para versiones respaldadas por ClawPack.
- Las versiones de ClawPack incluyen campos compatibles con npm `npmIntegrity`, `npmShasum` y
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` y `version.staticScan` se incluyen cuando existen datos de escaneo.
- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Devuelve los metadatos explícitos del resolvedor de artefactos para una versión de paquete.

Notas:

- Las versiones de paquetes heredadas devuelven un artefacto `legacy-zip` y una URL ZIP heredada
  `downloadUrl`.
- Las versiones de ClawPack devuelven un artefacto `npm-pack`, campos de integridad de npm, una
  `tarballUrl` y la URL de compatibilidad ZIP heredada.
- Esta es la superficie del resolvedor de OpenClaw; evita inferir el formato de archivo a partir de
  una URL compartida.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Descarga el artefacto de la versión mediante la ruta explícita del resolvedor.

Notas:

- Las versiones de ClawPack transmiten exactamente los bytes `.tgz` npm-pack subidos.
- Las versiones ZIP heredadas redirigen a `/api/v1/packages/{name}/download?version=`.
- Usa el grupo de límites de tasa de descarga.

### `GET /api/v1/packages/{name}/readiness`

Devuelve la preparación calculada para consumo futuro de OpenClaw.

Las comprobaciones de preparación cubren:

- estado del canal oficial
- disponibilidad de la versión más reciente
- disponibilidad del artefacto ClawPack npm-pack
- resumen criptográfico del artefacto
- repositorio fuente y procedencia del commit
- metadatos de compatibilidad con OpenClaw
- destinos de host
- estado de escaneo

Respuesta:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Endpoint de moderador para listar filas de migración de plugins oficiales de OpenClaw.

Autenticación:

- Requiere un token de API para un usuario moderador o administrador.

Parámetros de consulta:

- `phase` (opcional): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` o
  `all` (predeterminado).
- `limit` (opcional): entero (1-100)
- `cursor` (opcional): cursor de paginación

Respuesta:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

Endpoint de administrador para crear o actualizar una fila de migración de plugin oficial.

Autenticación:

- Requiere un token de API para un usuario administrador.

Cuerpo de la solicitud:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Notas:

- `bundledPluginId` se normaliza a minúsculas y es la clave estable de upsert.
- `packageName` se normaliza como nombre npm; el paquete puede faltar para migraciones
  planificadas.
- Esto solo rastrea la preparación de migración. No muta OpenClaw ni genera
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint de moderador/administrador para colas de revisión de versiones de paquetes.

Autenticación:

- Requiere un token de API para un usuario moderador o administrador.

Parámetros de consulta:

- `status` (opcional): `open` (predeterminado), `blocked`, `manual` o `all`
- `limit` (opcional): entero (1-100)
- `cursor` (opcional): cursor de paginación

Significados de estado:

- `open`: versiones sospechosas, maliciosas, pendientes, en cuarentena, revocadas o reportadas.
- `blocked`: versiones en cuarentena, revocadas o maliciosas.
- `manual`: cualquier versión con una anulación manual de moderación.
- `all`: cualquier versión con una anulación manual, estado de escaneo no limpio o reporte de paquete.

Respuesta:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

Reporta un paquete para revisión por moderadores. Los reportes son a nivel de paquete, opcionalmente
vinculados a una versión. Alimentan la cola de moderación, pero no ocultan automáticamente ni
bloquean descargas por sí solos; los moderadores deben usar la moderación de versiones para
aprobar, poner en cuarentena o revocar artefactos.

Autenticación:

- Requiere un token de API.

Solicitud:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Respuesta:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `POST /api/v1/packages/{name}/appeal`

Endpoint de propietario/publicador del paquete para apelar la moderación de una versión.

Autenticación:

- Requiere un token de API para el propietario del paquete o un miembro del publicador.

Solicitud:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

Las apelaciones se aceptan solo para versiones que están en cuarentena, revocadas,
son sospechosas o maliciosas. ClawHub mantiene una apelación abierta por versión.

Respuesta:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

Solicita un nuevo análisis de seguridad para la última versión publicada del paquete.

Autenticación:

- Requiere un token de API para el propietario del paquete, administrador del publicador, moderador
  de la plataforma o administrador de la plataforma.
- Los propietarios y administradores de publicadores están sujetos al límite de recuperación de
  propietario por versión. Los moderadores y administradores de la plataforma no lo están, pero ClawHub
  sigue permitiendo solo un nuevo análisis activo por versión.

Respuesta:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

Endpoint de moderador/administrador para la recepción de apelaciones de paquetes.

Autenticación:

- Requiere un token de API para un usuario moderador o administrador.

Parámetros de consulta:

- `status` (opcional): `open` (predeterminado), `accepted`, `rejected` o `all`
- `limit` (opcional): entero (1-100)
- `cursor` (opcional): cursor de paginación

Respuesta:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

Endpoint de moderador/administrador para aceptar, rechazar o reabrir una apelación.

Solicitud:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` es obligatorio para `accepted` y `rejected`; puede omitirse al volver a establecer
`status` en `open`. Pasa `finalAction: "approve"` con una apelación aceptada para aprobar
la versión afectada en el mismo flujo de trabajo auditable.

Respuesta:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

Endpoint de moderador/administrador para la recepción de informes de paquetes.

Autenticación:

- Requiere un token de API para un usuario moderador o administrador.

Parámetros de consulta:

- `status` (opcional): `open` (predeterminado), `confirmed`, `dismissed` o `all`
- `limit` (opcional): entero (1-100)
- `cursor` (opcional): cursor de paginación

Respuesta:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

Endpoint de propietario/moderador para visibilidad de moderación de paquetes.

Autenticación:

- Requiere un token de API para el propietario del paquete, miembro del publicador, moderador o
  usuario administrador.

Respuesta:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Endpoint de moderador/administrador para resolver o reabrir informes de paquetes.

Solicitud:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` es obligatorio para `confirmed` y `dismissed`; puede omitirse al volver a establecer
`status` en `open`. Pasa `finalAction: "quarantine"` o
`finalAction: "revoke"` con un informe confirmado para aplicar la moderación de la versión en el
mismo flujo de trabajo auditable.

Respuesta:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

Endpoint de moderador/administrador para revisión de versiones de paquetes.

Solicitud:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Estados admitidos:

- `approved`: revisado manualmente y permitido.
- `quarantined`: bloqueado en espera de seguimiento.
- `revoked`: bloqueado después de que una versión fuera considerada confiable anteriormente.

Las versiones en cuarentena y revocadas devuelven `403` desde las rutas de descarga de artefactos.
Cada cambio escribe una entrada en el registro de auditoría.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint de mantenimiento exclusivo para administradores para etiquetar versiones antiguas de paquetes con
metadatos explícitos de tipo de artefacto.

Cuerpo de la solicitud:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Respuesta:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Notas:

- De forma predeterminada, se ejecuta como simulación.
- Las versiones sin almacenamiento de ClawPack se etiquetan como `legacy-zip`.
- Las filas existentes respaldadas por ClawPack a las que les falta `artifactKind` se reparan como
  `npm-pack`.
- Esto no genera ClawPacks ni modifica bytes de artefactos.

### `GET /api/v1/packages/{name}/file`

Devuelve contenido de texto sin procesar de un archivo de paquete.

Parámetros de consulta:

- `path` (obligatorio)
- `version` (opcional)
- `tag` (opcional)

Notas:

- De forma predeterminada, usa la última versión.
- Usa el bucket de tasa de lectura, no el bucket de descarga.
- Los archivos binarios devuelven `415`.
- Límite de tamaño de archivo: 200 KB.
- Los análisis pendientes de VirusTotal no bloquean las lecturas; las versiones maliciosas aún pueden retenerse en otros lugares.
- Los paquetes privados devuelven `404` a menos que quien llama pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/download`

Descarga el archivo ZIP determinista heredado para una versión de paquete.

Parámetros de consulta:

- `version` (opcional)
- `tag` (opcional)

Notas:

- De forma predeterminada, usa la última versión.
- Skills redirige a `GET /api/v1/download`.
- Los archivos de Plugin/paquete son archivos zip con una raíz `package/` para que los clientes antiguos de OpenClaw
  sigan funcionando.
- Esta ruta sigue siendo solo ZIP. No transmite archivos `.tgz` de ClawPack.
- Las respuestas incluyen los encabezados `ETag`, `Digest`, `X-ClawHub-Artifact-Type` y
  `X-ClawHub-Artifact-Sha256` para comprobaciones de integridad del resolutor.
- Los metadatos solo del registro no se inyectan en el archivo descargado.
- Los análisis pendientes de VirusTotal no bloquean las descargas; las versiones maliciosas devuelven `403`.
- Los paquetes privados devuelven `404` a menos que quien llama sea el propietario.

### `GET /api/npm/{package}`

Devuelve un packument compatible con npm para versiones de paquete respaldadas por ClawPack.

Notas:

- Solo se listan las versiones con tarballs npm-pack de ClawPack subidos.
- Las versiones heredadas solo ZIP se omiten intencionadamente.
- `dist.tarball`, `dist.integrity` y `dist.shasum` usan campos compatibles con npm
  para que los usuarios puedan apuntar npm al espejo si lo eligen.
- Los packuments de paquetes con ámbito admiten tanto `/api/npm/@scope/name` como la ruta de solicitud
  codificada de npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Transmite los bytes exactos del tarball de ClawPack subido para clientes de espejo npm.

Notas:

- Usa el bucket de tasa de descarga.
- Los encabezados de descarga incluyen SHA-256 de ClawHub más metadatos de integridad/shasum de npm.
- Las comprobaciones de acceso de moderación y de paquetes privados siguen aplicándose.

### `GET /api/v1/resolve`

Usado por la CLI para asignar una huella digital local a una versión conocida.

Parámetros de consulta:

- `slug` (obligatorio)
- `hash` (obligatorio): sha256 hexadecimal de 64 caracteres de la huella digital del paquete

Respuesta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Descarga un zip de una versión de Skill.

Parámetros de consulta:

- `slug` (obligatorio)
- `version` (opcional): cadena semver
- `tag` (opcional): nombre de etiqueta (por ejemplo, `latest`)

Notas:

- Si no se proporciona ni `version` ni `tag`, se usa la versión más reciente.
- Las versiones eliminadas de forma reversible devuelven `410`.
- Las estadísticas de descarga se cuentan como identidades únicas por hora (`userId` cuando el token de API es válido; de lo contrario, IP).

## Endpoints de autenticación (token Bearer)

Todos los endpoints requieren:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valida el token y devuelve el identificador del usuario.

### `POST /api/v1/skills`

Publica una nueva versión.

- Preferido: `multipart/form-data` con JSON `payload` + blobs `files[]`.
- También se acepta un cuerpo JSON con `files` (basado en storageId).
- Campo opcional de payload: `ownerHandle`. Cuando está presente, la API resuelve ese
  publicador del lado del servidor y requiere que el actor tenga acceso de publicador.
- Campo opcional de payload: `migrateOwner`. Cuando es `true` con `ownerHandle`, una
  Skill existente puede moverse a ese propietario si el actor es administrador/propietario tanto en
  los publicadores actual como de destino. Sin esta aceptación explícita, los cambios de propietario son
  rechazados.

### `POST /api/v1/packages`

Publica una versión de code-plugin o bundle-plugin.

- Requiere autenticación con token Bearer.
- Preferido: `multipart/form-data` con JSON `payload` + blobs `files[]`.
- También se acepta un cuerpo JSON con `files` (basado en storageId).
- Campo opcional de payload: `ownerHandle`. Cuando está presente, solo los administradores pueden publicar en nombre de ese propietario.

Puntos destacados de validación:

- `family` debe ser `code-plugin` o `bundle-plugin`.
- Los paquetes de Plugin requieren `openclaw.plugin.json`. Las subidas `.tgz` de ClawPack deben
  contenerlo en `package/openclaw.plugin.json`.
- Los plugins de código requieren `package.json`, metadatos del repositorio fuente, metadatos del commit
  fuente, metadatos del esquema de configuración, `openclaw.compat.pluginApi` y
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` y `openclaw.environment` son metadatos opcionales.
- Solo los publicadores de confianza pueden publicar en el canal `official`.
- Las publicaciones en nombre de otro aún validan la elegibilidad del canal oficial contra la cuenta del propietario de destino.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina de forma reversible / restaura una Skill (propietario, moderador o administrador).

Cuerpo JSON opcional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Cuando está presente, `reason` se almacena como nota de moderación de la Skill y se copia en el registro de auditoría.
Las eliminaciones reversibles iniciadas por el propietario reservan el slug durante 30 días; después, el slug puede ser reclamado por
otro publicador. La respuesta de eliminación incluye `slugReservedUntil` cuando se aplica esta caducidad.
Las ocultaciones de moderador/administrador y las eliminaciones de seguridad no caducan de esta forma.

Respuesta de eliminación:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Códigos de estado:

- `200`: correcto
- `401`: no autorizado
- `403`: prohibido
- `404`: Skill/usuario no encontrado
- `500`: error interno del servidor

### `POST /api/v1/users/publisher`

Solo administradores. Garantiza que exista un publicador de organización para un identificador. Si el identificador aún apunta a un
publicador personal/de usuario compartido heredado, el endpoint lo migra primero a un publicador de organización.

- Cuerpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Respuesta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Solo administradores. Reserva slugs raíz y nombres de paquetes para un propietario legítimo sin publicar una
versión. Los nombres de paquetes se convierten en paquetes marcadores privados sin filas de versiones, de modo que el mismo
propietario pueda publicar más adelante la versión real del code-plugin o bundle-plugin con ese nombre.

- Cuerpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respuesta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoints de gestión de slugs del propietario

- `POST /api/v1/skills/{slug}/rename`
  - Cuerpo: `{ "newSlug": "new-canonical-slug" }`
  - Respuesta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Cuerpo: `{ "targetSlug": "canonical-target-slug" }`
  - Respuesta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notas:

- Ambos endpoints requieren autenticación con token de API y solo funcionan para el propietario de la skill.
- `rename` conserva el slug anterior como un alias de redirección.
- `merge` oculta el listado de origen y redirige el slug de origen al listado de destino.

### Endpoints de transferencia de propiedad

- `POST /api/v1/skills/{slug}/transfer`
  - Cuerpo: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Respuesta: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Respuesta (aceptar/rechazar/cancelar): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Forma de la respuesta: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Prohíbe a un usuario y elimina de forma permanente las skills que posee (solo moderador/administrador).

Cuerpo:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

o

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Respuesta:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Quita la prohibición a un usuario y restaura las skills elegibles (solo administrador).

Cuerpo:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

o

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Respuesta:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

Cambia el rol de un usuario (solo administrador).

Cuerpo:

```json
{ "handle": "user_handle", "role": "moderator" }
```

o

```json
{ "userId": "users_...", "role": "admin" }
```

Respuesta:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Enumera o busca usuarios (solo administrador).

Parámetros de consulta:

- `q` (opcional): consulta de búsqueda
- `query` (opcional): alias de `q`
- `limit` (opcional): resultados máximos (predeterminado 20, máximo 200)

Respuesta:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Añade/elimina una estrella (destacados). Ambos endpoints son idempotentes.

Respuestas:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoints de la CLI heredada (obsoletos)

Aún se admiten para versiones anteriores de la CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulta `DEPRECATIONS.md` para ver el plan de eliminación.

## Descubrimiento del registro (`/.well-known/clawhub.json`)

La CLI puede descubrir la configuración de registro/autenticación desde el sitio:

- `/.well-known/clawhub.json` (JSON, preferido)
- `/.well-known/clawdhub.json` (heredado)

Esquema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Si haces self-hosting, sirve este archivo (o define `CLAWHUB_REGISTRY` explícitamente; `CLAWDHUB_REGISTRY` heredado).
