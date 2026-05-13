---
read_when:
    - Añadir/cambiar puntos de conexión
    - Depuración de solicitudes entre CLI ↔ registro
summary: Referencia de la API HTTP (endpoints públicos + endpoints de CLI + autenticación).
x-i18n:
    generated_at: "2026-05-13T04:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL base: `https://clawhub.ai` (predeterminada).

Todas las rutas v1 están bajo `/api/v1/...`.
Las rutas heredadas `/api/...` y `/api/cli/...` se mantienen por compatibilidad (consulta `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Reutilización del catálogo público

Los directorios de terceros pueden usar los endpoints públicos de lectura para listar o buscar Skills de ClawHub. Almacena los resultados en caché, respeta `429`/`Retry-After`, enlaza a los usuarios de vuelta a la ficha canónica de ClawHub (`https://clawhub.ai/<owner>/<slug>`) y evita insinuar el respaldo de ClawHub al sitio de terceros. No intentes reflejar contenido oculto, privado o bloqueado por moderación fuera de la superficie pública de la API.

Los accesos directos de slug web se resuelven entre familias de registro, pero los clientes de API deben usar
las URL canónicas devueltas por los endpoints de lectura en lugar de reconstruir la precedencia
de rutas.

## Límites de tasa

Modelo de aplicación:

- Solicitudes anónimas: se aplican por IP.
- Solicitudes autenticadas (token Bearer válido): se aplican por depósito de usuario.
- Si el token falta o no es válido, el comportamiento recae en la aplicación por IP.
- Los endpoints de escritura autenticados no deben devolver un simple `Unauthorized` cuando
  el servidor conoce la razón. Los tokens ausentes, los tokens no válidos o revocados, y
  las cuentas eliminadas, vetadas o deshabilitadas deben recibir texto accionable para que los clientes
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
- `RateLimit-Reset`: segundos hasta el restablecimiento (retraso)
- `Retry-After`: segundos que esperar antes de reintentar (retraso) en `429`

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
- Usa retroceso con jitter para evitar reintentos sincronizados.
- Si falta `Retry-After`, recurre a `RateLimit-Reset` (o calcula a partir de `X-RateLimit-Reset`).

Origen de IP:

- Usa `cf-connecting-ip` (Cloudflare) como IP de cliente de forma predeterminada.
- ClawHub usa encabezados de reenvío confiables para identificar las IP de cliente en el borde.
- Si no hay una IP de cliente confiable disponible, las solicitudes de descarga anónimas usan un depósito de respaldo con alcance de endpoint en lugar de un único depósito global `ip:unknown`. Las solicitudes anónimas de lectura/escritura siguen usando el depósito desconocido compartido para que el enrutamiento sin IP siga siendo visible y conservador.

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

- Los resultados se devuelven en orden de relevancia (similitud de embeddings + boosts por tokens exactos de slug/nombre + prior de popularidad de descargas).
- La relevancia pesa más que la popularidad. Una coincidencia precisa de slug o de token de nombre visible puede superar a una coincidencia más imprecisa con muchas más descargas.
- El texto ASCII se tokeniza en límites de palabra y puntuación. Por ejemplo, `personal-map` contiene un token independiente `map`, mientras que `amap-jsapi-skill` contiene `amap`, `jsapi` y `skill`; por tanto, buscar `map` da a `personal-map` una coincidencia léxica más fuerte que a `amap-jsapi-skill`.
- Las descargas se usan como un prior pequeño escalado logarítmicamente y como desempate, no como la señal principal de clasificación. Los Skills con muchas descargas pueden clasificarse más abajo cuando el texto de consulta coincide peor.
- El estado de moderación sospechoso u oculto puede quitar un Skill de la búsqueda pública según los filtros del llamador y el estado de moderación actual.

Guía de descubribilidad para publicadores:

- Coloca los términos que los usuarios buscarán literalmente en el nombre visible, el resumen y las etiquetas. Usa un token de slug independiente solo cuando también sea una identidad estable que quieras mantener.
- No cambies el nombre de un slug solo para perseguir una consulta, salvo que el nuevo slug sea un mejor nombre canónico a largo plazo. Los slugs antiguos se convierten en alias de redirección, pero la URL canónica, el slug mostrado y los futuros resúmenes de búsqueda usan el nuevo slug.
- Los alias de cambio de nombre conservan la resolución para URL antiguas e instalaciones que se resuelven mediante el registro, pero la clasificación de búsqueda se basa en los metadatos canónicos del Skill después de que se haya indexado el cambio de nombre. Las estadísticas existentes permanecen con el Skill.
- Si un Skill está inesperadamente invisible, comprueba primero el estado de moderación con `clawhub inspect <slug>` mientras tienes sesión iniciada antes de cambiar metadatos relacionados con la clasificación.

### `GET /api/v1/skills`

Parámetros de consulta:

- `limit` (opcional): entero (1-200)
- `cursor` (opcional): cursor de paginación para cualquier orden distinto de `trending`
- `sort` (opcional): `updated` (predeterminado), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills sospechosos (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias heredado para `nonSuspiciousOnly`

Notas:

- `trending` clasifica por instalaciones en los últimos 7 días (basado en telemetría).
- `createdAt` es estable para rastreos de Skills nuevos; `updated` cambia cuando se vuelven a publicar Skills existentes.
- Cuando `nonSuspiciousOnly=true`, los ordenamientos basados en cursor pueden devolver menos de `limit` elementos en una página porque los Skills sospechosos se filtran después de recuperar la página.
- Usa `nextCursor` para continuar la paginación cuando esté presente. Una página corta no significa por sí sola el fin de los resultados.

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
- `metadata.os`: restricciones de SO declaradas en el frontmatter del Skill (por ejemplo `["macos"]`, `["linux"]`). `null` si no se declara.
- `metadata.systems`: destinos de sistema Nix (por ejemplo `["aarch64-darwin", "x86_64-linux"]`). `null` si no se declara.
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

Informa un Skill para revisión de moderadores. Los informes son de nivel de Skill, opcionalmente vinculados
a una versión, y alimentan la cola de informes de Skills.

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

### `GET /api/v1/skills/-/reports`

Endpoint de moderador/administrador para la recepción de informes de Skills.

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

Endpoint de moderador/administrador para resolver o reabrir informes de Skills.

Solicitud:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` es obligatorio para `confirmed` y `dismissed`; puede omitirse al
volver a establecer `status` en `open`. Pasa `finalAction: "hide"` con un informe evaluado
para ocultar el Skill en el mismo flujo de trabajo auditable.

### `GET /api/v1/skills/{slug}/versions`

Parámetros de consulta:

- `limit` (opcional): entero
- `cursor` (opcional): cursor de paginación

### `GET /api/v1/skills/{slug}/versions/{version}`

Devuelve metadatos de versión + lista de archivos.

- `version.security` incluye el estado de verificación de escaneo normalizado y detalles del escáner
  (VirusTotal + LLM), cuando estén disponibles.

### `GET /api/v1/skills/{slug}/scan`

Devuelve detalles de verificación de escaneo de seguridad para una versión de Skill.

Parámetros de consulta:

- `version` (opcional): cadena de versión específica.
- `tag` (opcional): resuelve una versión etiquetada (por ejemplo `latest`).

Notas:

- Si no se proporciona ni `version` ni `tag`, usa la versión más reciente.
- Incluye el estado de verificación normalizado más detalles específicos del escáner.
- `security.capabilityTags` incluye etiquetas deterministas de capacidad/riesgo como
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` y `posts-externally` cuando se detectan.
- `security.hasScanResult` es `true` solo cuando un escáner produjo un veredicto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` es una instantánea actual de moderación a nivel de Skill derivada de la versión más reciente.
- Al consultar una versión histórica, comprueba `moderation.matchesRequestedVersion` y `moderation.sourceVersion` antes de tratar `moderation` y `security` como el mismo contexto de versión.

### `GET /api/v1/skills/{slug}/file`

Devuelve contenido de texto sin procesar.

Parámetros de consulta:

- `path` (obligatorio)
- `version` (opcional)
- `tag` (opcional)

Notas:

- De forma predeterminada usa la versión más reciente.
- Límite de tamaño de archivo: 200KB.

### `GET /api/v1/packages`

Endpoint de catálogo unificado para:

- Skills
- Plugins de código
- Plugins de paquete

Parámetros de consulta:

- `limit` (opcional): entero (1–100)
- `cursor` (opcional): cursor de paginación
- `family` (opcional): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opcional): `official`, `community` o `private`
- `isOfficial` (opcional): `true` o `false`
- `executesCode` (opcional): `true` o `false`
- `capabilityTag` (opcional): filtro de capacidad para paquetes de plugin
- `target` / `hostTarget` (opcional): abreviatura de `host:<target>`
- `os`, `arch`, `libc` (opcional): abreviatura de filtros de capacidad de host
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opcional): abreviatura `true`/`1` para etiquetas de requisitos de entorno
- `externalService`, `binary`, `osPermission` (opcional): abreviatura de etiquetas
  de requisitos de entorno con nombre
- `artifactKind` (opcional): `legacy-zip` o `npm-pack`
- `npmMirror` (opcional): `true`/`1` para mostrar versiones de paquetes respaldadas
  por ClawPack disponibles mediante el espejo de npm

Notas:

- `GET /api/v1/code-plugins` y `GET /api/v1/bundle-plugins` siguen siendo alias de familia fija.
- Las entradas de Skill siguen respaldadas por el registro de skills y todavía solo se pueden publicar mediante `POST /api/v1/skills`.
- `POST /api/v1/packages` sigue siendo solo para lanzamientos de code-plugin y bundle-plugin.
- Los llamadores anónimos solo ven canales de paquetes públicos.
- Los llamadores autenticados pueden ver paquetes privados de publicadores a los que pertenecen en los resultados de lista/búsqueda.
- `channel=private` solo devuelve paquetes que el llamador autenticado puede leer.

### `GET /api/v1/packages/search`

Búsqueda unificada de catálogo en Skills + paquetes de plugin.

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
  `osPermission` se aceptan como abreviaturas de etiquetas de capacidad comunes
- `artifactKind` (opcional): `legacy-zip` o `npm-pack`
- `npmMirror` (opcional): `true`/`1` para buscar versiones de paquetes respaldadas
  por ClawPack disponibles mediante el espejo de npm

Notas:

- Los llamadores anónimos solo ven canales de paquetes públicos.
- Los llamadores autenticados pueden buscar paquetes privados de publicadores a los que pertenecen.
- `channel=private` solo devuelve paquetes que el llamador autenticado puede leer.
- Los filtros de artefactos están respaldados por etiquetas de capacidad indexadas:
  `artifact:legacy-zip`, `artifact:npm-pack` y `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Devuelve metadatos detallados del paquete.

Notas:

- Skills también puede resolverse mediante esta ruta en el catálogo unificado.
- Los paquetes privados devuelven `404` salvo que el llamador pueda leer el publicador propietario.

### `DELETE /api/v1/packages/{name}`

Elimina de forma lógica un paquete y todos sus lanzamientos.

Notas:

- Requiere un token de API para el propietario del paquete, un propietario/administrador de publicador de organización,
  un moderador de la plataforma o un administrador de la plataforma.

### `GET /api/v1/packages/{name}/versions`

Devuelve el historial de versiones.

Parámetros de consulta:

- `limit` (opcional): entero (1–100)
- `cursor` (opcional): cursor de paginación

Notas:

- Los paquetes privados devuelven `404` salvo que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/versions/{version}`

Devuelve una versión de paquete, incluidos metadatos de archivos, compatibilidad,
capacidades, verificación, metadatos de artefacto y datos de escaneo.

Notas:

- `version.artifact.kind` es `legacy-zip` para archivos de paquete antiguos o
  `npm-pack` para lanzamientos respaldados por ClawPack.
- Los lanzamientos de ClawPack incluyen los campos compatibles con npm `npmIntegrity`, `npmShasum` y
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` y `version.staticScan` se incluyen cuando existen datos de escaneo.
- Los paquetes privados devuelven `404` salvo que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Devuelve el resumen exacto de seguridad y confianza del lanzamiento del paquete para clientes de
instalación. Esta es la superficie pública de consumo de OpenClaw para decidir si un
lanzamiento resuelto puede instalarse.

Autenticación:

- Endpoint público de lectura. No se requiere token de propietario, publicador, moderador ni administrador.

Respuesta:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

Campos de respuesta:

- `package.name`, `package.displayName` y `package.family` identifican el
  paquete de registro resuelto.
- `release.releaseId`, `release.version` y `release.createdAt` identifican el
  lanzamiento exacto que se evaluó.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` y `release.npmTarballName` están presentes cuando se conocen para
  el artefacto del lanzamiento.
- `trust.scanStatus` es el estado de confianza efectivo derivado de entradas del escáner
  y la moderación manual del lanzamiento.
- `trust.moderationState` admite valores nulos. Es `null` cuando no existe moderación manual
  del lanzamiento.
- `trust.blockedFromDownload` es la señal de bloqueo de instalación. OpenClaw y otros
  clientes de instalación deben bloquear la instalación cuando este valor sea `true` en lugar de
  volver a derivar las reglas de bloqueo a partir de campos de escáner o moderación.
- `trust.reasons` es la lista de explicación orientada al usuario y de auditoría. Los códigos de motivo
  son cadenas estables y compactas como `manual:quarantined`, `scan:malicious`,
  `static:malicious`, `vt:suspicious` y `package:malicious`.
- `trust.pending` significa que una o más entradas de confianza todavía están pendientes de finalización.
- `trust.stale` significa que el resumen de confianza se calculó a partir de entradas desactualizadas y
  debe tratarse como que requiere actualización antes de una decisión de autorización de alta confianza.

Notas:

- Este endpoint es exacto por versión. Los clientes deben llamarlo después de resolver la
  versión del paquete que pretenden instalar, no solo después de leer los metadatos
  más recientes del paquete.
- Los paquetes privados devuelven `404` salvo que el llamador pueda leer el publicador propietario.
- Este endpoint es intencionalmente más estrecho que los endpoints de moderación de propietario/moderador.
  Expone la decisión de instalación y la explicación pública, no
  identidades de reporteros, cuerpos de reportes, evidencia privada ni cronologías internas de revisión.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Devuelve los metadatos explícitos del resolvedor de artefactos para una versión de paquete.

Notas:

- Las versiones de paquete heredadas devuelven un artefacto `legacy-zip` y una
  `downloadUrl` de ZIP heredado.
- Las versiones de ClawPack devuelven un artefacto `npm-pack`, campos de integridad de npm, una
  `tarballUrl` y la URL de compatibilidad de ZIP heredado.
- Esta es la superficie de resolvedor de OpenClaw; evita adivinar el formato de archivo a partir de
  una URL compartida.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Descarga el artefacto de versión mediante la ruta de resolvedor explícita.

Notas:

- Las versiones de ClawPack transmiten los bytes exactos del `.tgz` npm-pack subido.
- Las versiones ZIP heredadas redirigen a `/api/v1/packages/{name}/download?version=`.
- Usa el depósito de límite de tasa de descarga.

### `GET /api/v1/packages/{name}/readiness`

Devuelve la preparación calculada para consumo futuro de OpenClaw.

Las comprobaciones de preparación cubren:

- estado de canal oficial
- disponibilidad de la versión más reciente
- disponibilidad del artefacto npm-pack de ClawPack
- resumen del artefacto
- procedencia del repositorio fuente y del commit
- metadatos de compatibilidad con OpenClaw
- objetivos de host
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

- `bundledPluginId` se normaliza a minúsculas y es la clave de upsert estable.
- `packageName` se normaliza como nombre npm; el paquete puede faltar en migraciones
  planificadas.
- Esto solo rastrea la preparación de la migración. No muta OpenClaw ni genera
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint de moderador/administrador para colas de revisión de lanzamientos de paquetes.

Autenticación:

- Requiere un token de API para un usuario moderador o administrador.

Parámetros de consulta:

- `status` (opcional): `open` (predeterminado), `blocked`, `manual` o `all`
- `limit` (opcional): entero (1-100)
- `cursor` (opcional): cursor de paginación

Significados de estado:

- `open`: lanzamientos sospechosos, maliciosos, pendientes, en cuarentena, revocados o reportados.
- `blocked`: lanzamientos en cuarentena, revocados o maliciosos.
- `manual`: cualquier lanzamiento con una anulación manual de moderación.
- `all`: cualquier lanzamiento con una anulación manual, estado de escaneo no limpio o reporte de paquete.

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

Denuncia un paquete para revisión de moderadores. Las denuncias son a nivel de paquete, opcionalmente
vinculadas a una versión. Alimentan la cola de moderación, pero no ocultan automáticamente ni
bloquean las descargas por sí solas; los moderadores deben usar la moderación de lanzamientos para
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

### `GET /api/v1/packages/reports`

Endpoint de moderador/administrador para la recepción de denuncias de paquetes.

Autenticación:

- Requiere un token de API de un usuario moderador o administrador.

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

Endpoint de propietario/moderador para la visibilidad de la moderación de paquetes.

Autenticación:

- Requiere un token de API del propietario del paquete, un miembro editor, un moderador o un
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

Endpoint de moderador/administrador para resolver o reabrir denuncias de paquetes.

Solicitud:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` es obligatorio para `confirmed` y `dismissed`; puede omitirse al
volver a establecer `status` en `open`. Pasa `finalAction: "quarantine"` o
`finalAction: "revoke"` con una denuncia confirmada para aplicar moderación de lanzamientos en el
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

Endpoint de moderador/administrador para revisión de lanzamientos de paquetes.

Solicitud:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Estados admitidos:

- `approved`: revisado manualmente y permitido.
- `quarantined`: bloqueado pendiente de seguimiento.
- `revoked`: bloqueado después de que un lanzamiento se hubiera considerado confiable anteriormente.

Los lanzamientos en cuarentena y revocados devuelven `403` desde las rutas de descarga de artefactos.
Cada cambio escribe una entrada en el registro de auditoría.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint de mantenimiento solo para administradores para etiquetar lanzamientos de paquetes antiguos con
metadatos explícitos del tipo de artefacto.

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

- De forma predeterminada es una simulación.
- Los lanzamientos sin almacenamiento ClawPack se etiquetan como `legacy-zip`.
- Las filas existentes respaldadas por ClawPack que no tienen `artifactKind` se reparan como
  `npm-pack`.
- Esto no genera ClawPacks ni modifica bytes de artefactos.

### `GET /api/v1/packages/{name}/file`

Devuelve el contenido de texto sin procesar de un archivo de paquete.

Parámetros de consulta:

- `path` (obligatorio)
- `version` (opcional)
- `tag` (opcional)

Notas:

- De forma predeterminada usa el lanzamiento más reciente.
- Usa el bucket de tasa de lectura, no el bucket de descargas.
- Los archivos binarios devuelven `415`.
- Límite de tamaño de archivo: 200 KB.
- Los análisis pendientes de VirusTotal no bloquean las lecturas; los lanzamientos maliciosos aún pueden retenerse en otro lugar.
- Los paquetes privados devuelven `404` salvo que el llamador pueda leer el editor propietario.

### `GET /api/v1/packages/{name}/download`

Descarga el archivo ZIP determinista heredado de un lanzamiento de paquete.

Parámetros de consulta:

- `version` (opcional)
- `tag` (opcional)

Notas:

- De forma predeterminada usa el lanzamiento más reciente.
- Skills redirige a `GET /api/v1/download`.
- Los archivos de Plugin/paquete son archivos zip con una raíz `package/` para que los clientes antiguos de OpenClaw
  sigan funcionando.
- Esta ruta permanece solo para ZIP. No transmite archivos ClawPack `.tgz`.
- Las respuestas incluyen encabezados `ETag`, `Digest`, `X-ClawHub-Artifact-Type` y
  `X-ClawHub-Artifact-Sha256` para comprobaciones de integridad del resolvedor.
- Los metadatos solo del registro no se inyectan en el archivo descargado.
- Los análisis pendientes de VirusTotal no bloquean las descargas; los lanzamientos maliciosos devuelven `403`.
- Los paquetes privados devuelven `404` salvo que el llamador sea el propietario.

### `GET /api/npm/{package}`

Devuelve un packument compatible con npm para versiones de paquetes respaldadas por ClawPack.

Notas:

- Solo se listan las versiones con tarballs npm-pack de ClawPack cargados.
- Las versiones heredadas solo ZIP se omiten intencionalmente.
- `dist.tarball`, `dist.integrity` y `dist.shasum` usan campos compatibles con npm
  para que los usuarios puedan apuntar npm al espejo si lo desean.
- Los packuments de paquetes con ámbito admiten tanto `/api/npm/@scope/name` como la ruta de solicitud
  codificada de npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Transmite los bytes exactos del tarball ClawPack cargado para clientes espejo de npm.

Notas:

- Usa el bucket de tasa de descarga.
- Los encabezados de descarga incluyen SHA-256 de ClawHub además de metadatos de integridad/shasum de npm.
- La moderación y las comprobaciones de acceso a paquetes privados siguen aplicándose.

### `GET /api/v1/resolve`

Lo usa la CLI para asignar una huella local a una versión conocida.

Parámetros de consulta:

- `slug` (obligatorio)
- `hash` (obligatorio): sha256 hexadecimal de 64 caracteres de la huella del paquete

Respuesta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Descarga un zip de una versión de skill.

Parámetros de consulta:

- `slug` (obligatorio)
- `version` (opcional): cadena semver
- `tag` (opcional): nombre de etiqueta (p. ej., `latest`)

Notas:

- Si no se proporciona ni `version` ni `tag`, se usa la versión más reciente.
- Las versiones con eliminación lógica devuelven `410`.
- Las estadísticas de descarga se cuentan como identidades únicas por hora (`userId` cuando el token de API es válido; de lo contrario, IP).

## Endpoints de autenticación (token Bearer)

Todos los endpoints requieren:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valida el token y devuelve el handle del usuario.

### `POST /api/v1/skills`

Publica una nueva versión.

- Preferido: `multipart/form-data` con JSON `payload` + blobs `files[]`.
- También se acepta cuerpo JSON con `files` (basado en storageId).
- Campo opcional de carga útil: `ownerHandle`. Cuando está presente, la API resuelve ese
  editor en el servidor y exige que el actor tenga acceso al editor.
- Campo opcional de carga útil: `migrateOwner`. Cuando es `true` con `ownerHandle`, una
  skill existente puede moverse a ese propietario si el actor es administrador/propietario tanto en
  los editores actuales como de destino. Sin esta aceptación explícita, los cambios de propietario se
  rechazan.

### `POST /api/v1/packages`

Publica un lanzamiento code-plugin o bundle-plugin.

- Requiere autenticación con token Bearer.
- Preferido: `multipart/form-data` con JSON `payload` + blobs `files[]`.
- También se acepta cuerpo JSON con `files` (basado en storageId).
- Campo opcional de carga útil: `ownerHandle`. Cuando está presente, solo los administradores pueden publicar en nombre de ese propietario.

Aspectos destacados de validación:

- `family` debe ser `code-plugin` o `bundle-plugin`.
- Los paquetes de Plugin requieren `openclaw.plugin.json`. Las cargas ClawPack `.tgz` deben
  contenerlo en `package/openclaw.plugin.json`.
- Los plugins de código requieren `package.json`, metadatos del repositorio de código fuente, metadatos del commit de código fuente,
  metadatos del esquema de configuración, `openclaw.compat.pluginApi` y
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` y `openclaw.environment` son metadatos opcionales.
- Solo los editores de confianza pueden publicar en el canal `official`.
- Las publicaciones en nombre de otro usuario siguen validando la elegibilidad para el canal oficial contra la cuenta del propietario de destino.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina lógicamente / restaura una skill (propietario, moderador o administrador).

Cuerpo JSON opcional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Cuando está presente, `reason` se almacena como la nota de moderación de la skill y se copia en el registro de auditoría.
Las eliminaciones lógicas iniciadas por el propietario reservan el slug durante 30 días; luego otro
editor puede reclamarlo. La respuesta de eliminación incluye `slugReservedUntil` cuando se aplica esta expiración.
Las ocultaciones de moderador/administrador y las eliminaciones de seguridad no expiran de esta manera.

Respuesta de eliminación:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Códigos de estado:

- `200`: correcto
- `401`: no autorizado
- `403`: prohibido
- `404`: skill/usuario no encontrado
- `500`: error interno del servidor

### `POST /api/v1/users/publisher`

Solo para administradores. Garantiza que exista un editor de organización para un handle. Si el handle todavía apunta a un
editor heredado compartido de usuario/personal, el endpoint primero lo migra a un editor de organización.

- Cuerpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Respuesta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Solo para administradores. Reserva slugs raíz y nombres de paquetes para un propietario legítimo sin publicar un
lanzamiento. Los nombres de paquete se convierten en paquetes marcadores privados sin filas de lanzamiento, para que el mismo
propietario pueda publicar más adelante el lanzamiento code-plugin o bundle-plugin real con ese nombre.

- Cuerpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respuesta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoints de gestión de slugs de propietarios

- `POST /api/v1/skills/{slug}/rename`
  - Cuerpo: `{ "newSlug": "new-canonical-slug" }`
  - Respuesta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Cuerpo: `{ "targetSlug": "canonical-target-slug" }`
  - Respuesta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notas:

- Ambos endpoints requieren autenticación con token de API y solo funcionan para el propietario de la skill.
- `rename` conserva el slug anterior como alias de redirección.
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

Bloquea a un usuario y elimina permanentemente las Skills de su propiedad (solo moderadores/administradores).

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

Desbloquea a un usuario y restaura las Skills elegibles (solo administradores).

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

Cambia el rol de un usuario (solo administradores).

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

Lista o busca usuarios (solo administradores).

Parámetros de consulta:

- `q` (opcional): consulta de búsqueda
- `query` (opcional): alias de `q`
- `limit` (opcional): resultados máximos (valor predeterminado 20, máximo 200)

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

Añade/elimina una estrella (destacados). Ambos puntos de conexión son idempotentes.

Respuestas:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Puntos de conexión de CLI heredados (obsoletos)

Siguen siendo compatibles con versiones antiguas de la CLI:

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

Si lo alojas por tu cuenta, sirve este archivo (o define `CLAWHUB_REGISTRY` explícitamente; `CLAWDHUB_REGISTRY` heredado).
