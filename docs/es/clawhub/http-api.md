---
read_when:
    - Agregar/cambiar endpoints
    - Depuración de solicitudes CLI ↔ registro
summary: Referencia de la API HTTP (públicos + endpoints de CLI + autenticación).
x-i18n:
    generated_at: "2026-07-05T20:17:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL base: `https://clawhub.ai` (predeterminada).

Todas las rutas v1 están bajo `/api/v1/...`.
Las rutas heredadas `/api/...` y `/api/cli/...` permanecen por compatibilidad (consulta `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Reutilización del catálogo público

Los directorios de terceros pueden usar los endpoints públicos de lectura para listar o buscar Skills de ClawHub. Almacena los resultados en caché, respeta `429`/`Retry-After`, enlaza a los usuarios de vuelta al listado canónico de ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) y evita insinuar respaldo de ClawHub al sitio de terceros. No intentes duplicar contenido oculto, privado o bloqueado por moderación fuera de la superficie pública de la API.

Los accesos directos de slugs web se resuelven entre familias del registro, pero los clientes de API deben usar
las URL canónicas devueltas por los endpoints de lectura en lugar de reconstruir la precedencia
de rutas.

## Límites de tasa

Modelo de aplicación:

- Solicitudes anónimas: se aplican por IP.
- Solicitudes autenticadas (token Bearer válido): se aplican por bucket de usuario.
- Si falta el token o no es válido, el comportamiento recurre a la aplicación por IP.
- Los endpoints de escritura autenticados no deben devolver un simple `Unauthorized` cuando
  el servidor conoce el motivo. Los tokens ausentes, tokens no válidos o revocados, y
  cuentas eliminadas, bloqueadas o deshabilitadas deben recibir texto accionable para que los clientes
  CLI puedan indicar a los usuarios qué los bloqueó.

- Lectura: 3000/min por IP, 12000/min por clave
- Escritura: 300/min por IP, 3000/min por clave
- Descarga: 1200/min por IP, 6000/min por clave (endpoints de descarga)

Encabezados:

- Compatibilidad heredada: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Estandarizados: `RateLimit-Limit`, `RateLimit-Reset`
- En `429`: `X-RateLimit-Remaining: 0` y `RateLimit-Remaining: 0`
- En `429`: `Retry-After`

Semántica de encabezados:

- `X-RateLimit-Reset`: segundos absolutos de época Unix
- `RateLimit-Reset`: segundos hasta el reinicio (demora)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: presupuesto restante exacto cuando está presente.
  Las solicitudes correctas fragmentadas omiten este encabezado en lugar de devolver un valor global aproximado.
- `Retry-After`: segundos que esperar antes de reintentar (demora) en `429`

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
- Si falta `Retry-After`, recurre a `RateLimit-Reset` (o calcúlalo desde `X-RateLimit-Reset`).

Origen de IP:

- Usa encabezados de IP de cliente de confianza, incluido `cf-connecting-ip`, solo cuando el
  despliegue habilita explícitamente los encabezados reenviados de confianza.
- ClawHub usa encabezados de reenvío de confianza para identificar las IP de los clientes en el borde.
- Si no hay una IP de cliente de confianza disponible, las solicitudes anónimas usan buckets de reserva
  acotados solo por el tipo de límite de tasa. Estos buckets de reserva no incluyen
  rutas, slugs, nombres de paquetes, versiones, cadenas de consulta ni otros
  parámetros de artefacto suministrados por el llamador.

## Respuestas de error

Las respuestas de error públicas v1 son texto plano con `content-type: text/plain; charset=utf-8`.
Esto incluye fallos de validación (`400`), recursos públicos ausentes (`404`), fallos de autenticación y
permisos (`401`/`403`), límites de tasa (`429`) y descargas bloqueadas. Los clientes
deben leer el cuerpo de la respuesta como una cadena legible por humanos. Los parámetros de consulta desconocidos se
ignoran por compatibilidad, pero los parámetros de consulta reconocidos con valores no válidos devuelven
`400`.

## Endpoints públicos (sin autenticación)

### `GET /api/v1/search`

Parámetros de consulta:

- `q` (obligatorio): cadena de consulta
- `limit` (opcional): entero
- `highlightedOnly` (opcional): `true` para filtrar solo Skills destacadas
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills sospechosas (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias heredado de `nonSuspiciousOnly`

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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Notas:

- Los resultados se devuelven en orden de relevancia (similitud de embeddings + refuerzos por tokens exactos de slug/nombre + una pequeña prioridad de popularidad).
- La relevancia pesa más que la popularidad. Una coincidencia precisa de slug o token de nombre visible puede superar a una coincidencia menos estricta con mucha más interacción.
- El texto ASCII se tokeniza en límites de palabra y puntuación. Por ejemplo, `personal-map` contiene un token independiente `map`, mientras que `amap-jsapi-skill` contiene `amap`, `jsapi` y `skill`; por lo tanto, buscar `map` da a `personal-map` una coincidencia léxica más fuerte que a `amap-jsapi-skill`.
- La popularidad se escala logarítmicamente y tiene un límite. Las Skills con mucha interacción pueden posicionarse más abajo cuando el texto de la consulta tiene una coincidencia más débil.
- Un estado de moderación sospechoso u oculto puede quitar una Skill de la búsqueda pública según los filtros del llamador y el estado de moderación actual.

Guía de visibilidad para publicadores:

- Pon los términos que los usuarios buscarán literalmente en el nombre visible, el resumen y las etiquetas. Usa un token de slug independiente solo cuando también sea una identidad estable que quieras conservar.
- No cambies el nombre de un slug solo para perseguir una consulta, salvo que el nuevo slug sea un mejor nombre canónico a largo plazo. Los slugs antiguos se convierten en alias de redirección, pero la URL canónica, el slug mostrado y los resúmenes de búsqueda futuros usan el nuevo slug.
- Los alias de cambio de nombre preservan la resolución para URL antiguas e instalaciones que se resuelven a través del registro, pero la clasificación de búsqueda se basa en los metadatos canónicos de la Skill después de que el cambio de nombre se haya indexado. Las estadísticas existentes permanecen con la Skill.
- Si una Skill es inesperadamente invisible, revisa primero el estado de moderación con `clawhub inspect @owner/slug` con la sesión iniciada antes de cambiar metadatos relacionados con la clasificación.

### `GET /api/v1/skills`

Parámetros de consulta:

- `limit` (opcional): entero (1-200)
- `cursor` (opcional): cursor de paginación para cualquier ordenación que no sea `trending`
- `sort` (opcional): `updated` (predeterminado), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), los alias de instalación heredados `installsCurrent`/`installs`/`installsAllTime` se asignan a `downloads`, `trending`
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills sospechosas (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias heredado de `nonSuspiciousOnly`

Los valores no válidos de `sort` devuelven `400`.

Notas:

- `recommended` usa señales de interacción y actualidad.
- `trending` ordena por instalaciones en los últimos 7 días (basado en telemetría).
- `createdAt` es estable para rastreos de Skills nuevas; `updated` cambia cuando se vuelven a publicar Skills existentes.
- Cuando `nonSuspiciousOnly=true`, las ordenaciones basadas en cursor pueden devolver menos de `limit` elementos en una página porque las Skills sospechosas se filtran después de recuperar la página.
- Usa `nextCursor` para continuar la paginación cuando esté presente. Una página corta no significa por sí sola el final de los resultados.

Respuesta:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- Los slugs antiguos creados por flujos de cambio de nombre o fusión de propietarios se resuelven a la Skill canónica.
- `metadata.os`: restricciones de SO declaradas en el frontmatter de la Skill (por ejemplo, `["macos"]`, `["linux"]`). `null` si no se declara.
- `metadata.systems`: destinos de sistema Nix (por ejemplo, `["aarch64-darwin", "x86_64-linux"]`). `null` si no se declara.
- `metadata` es `null` si la Skill no tiene metadatos de plataforma.
- `moderation` se incluye solo cuando la Skill está marcada o cuando el propietario la está viendo.

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

- Los propietarios y moderadores pueden acceder a los detalles de moderación de Skills ocultas.
- Los llamadores públicos solo reciben `200` para Skills visibles ya marcadas.
- La evidencia se redacta para llamadores públicos y solo incluye fragmentos sin procesar para propietarios/moderadores.

### `POST /api/v1/skills/{slug}/report`

Reporta una Skill para revisión de moderadores. Los reportes son de nivel Skill, opcionalmente vinculados
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

### `GET /api/v1/skills/-/reports`

Endpoint de moderador/administrador para recepción de reportes de Skills.

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
clasificado para ocultar la Skill en el mismo flujo de trabajo auditable.

### `GET /api/v1/skills/{slug}/versions`

Parámetros de consulta:

- `limit` (opcional): entero
- `cursor` (opcional): cursor de paginación

### `GET /api/v1/skills/{slug}/versions/{version}`

Devuelve metadatos de versión + lista de archivos.

- `version.security` incluye el estado normalizado de verificación de escaneo y detalles del escáner
  (VirusTotal + LLM), cuando están disponibles.

### `GET /api/v1/skills/{slug}/scan`

Devuelve detalles de verificación de escaneo de seguridad para una versión de Skill.

Parámetros de consulta:

- `version` (opcional): cadena de versión específica.
- `tag` (opcional): resuelve una versión etiquetada (por ejemplo `latest`).

Notas:

- Si no se proporciona ni `version` ni `tag`, usa la versión más reciente.
- Incluye el estado de verificación normalizado, además de detalles específicos del escáner.
- `security.hasScanResult` es `true` solo cuando un escáner produjo un veredicto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` es una instantánea actual de moderación a nivel de skill derivada de la versión más reciente.
- Al consultar una versión histórica, revisa `moderation.matchesRequestedVersion` y `moderation.sourceVersion` antes de tratar `moderation` y `security` como el mismo contexto de versión.

### `POST /api/v1/skills/-/scan`

Endpoint autenticado de envío para nuevos trabajos de ClawScan.

Los análisis de cargas locales ya no son compatibles. Las solicitudes que usan
`multipart/form-data` o `{ "source": { "kind": "upload" } }` devuelven `410`.

Los análisis publicados usan JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Notas:

- Las cargas útiles de solicitudes de análisis y los informes descargables expiran del almacén de solicitudes de análisis después del periodo de retención.
- Los análisis publicados requieren acceso de gestión de propietario/publicador, o autoridad de moderador/administrador de la plataforma.
- Los análisis publicados solo escriben de vuelta cuando `update: true` y el análisis se completa correctamente.
- La respuesta es `202` con `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Los trabajos de análisis son asíncronos. Las solicitudes de análisis manual tienen prioridad sobre el trabajo normal de publicación/relleno, pero la finalización sigue dependiendo de la disponibilidad de workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint autenticado de sondeo para un análisis enviado.

- Devuelve el estado en cola/en ejecución/correcto/fallido.
- Devuelve `queue.queuedAhead` y `queue.position` mientras está en cola para que los clientes puedan mostrar cuántos análisis manuales priorizados están por delante de la solicitud. Las colas muy grandes se acotan y se informan con `queuedAheadIsEstimate: true`.
- Cuando está disponible, `report` contiene secciones `clawscan`, `skillspector`, `staticAnalysis` y `virustotal`.
- Los trabajos de análisis fallidos devuelven `status: "failed"` con `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint autenticado de archivo de informes.

- Requiere un análisis completado correctamente; los análisis no terminales devuelven `409`.
- Devuelve un ZIP con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` y `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint autenticado de archivo de informes almacenados para versiones enviadas.

- Requiere acceso de gestión de propietario/publicador al skill o Plugin, o autoridad de moderador/administrador de la plataforma.
- Devuelve resultados de análisis almacenados para la versión enviada exacta, incluidas versiones bloqueadas u ocultas.
- `kind` usa `skill` de forma predeterminada; usa `kind=plugin` para análisis de plugins/paquetes.
- Devuelve la misma forma de ZIP que las descargas de solicitudes de análisis.

### `POST /api/v1/skills/-/scan/batch`

Ruta canónica solo para administradores de reanálisis por lotes. Acepta la misma forma de carga útil que el `POST /api/v1/skills/-/rescan-batch` heredado.

### `POST /api/v1/skills/-/scan/batch/status`

Ruta canónica solo para administradores de estado por lotes. Acepta `{ "jobIds": ["..."] }` y devuelve los mismos contadores agregados que el `POST /api/v1/skills/-/rescan-batch/status` heredado.

### `GET /api/v1/skills/{slug}/verify`

Devuelve el envoltorio de verificación de Skill Card usado por `clawhub skill verify`.

Parámetros de consulta:

- `version` (opcional): cadena de versión específica.
- `tag` (opcional): resuelve una versión etiquetada (por ejemplo, `latest`).

Notas:

- `ok` es `true` solo cuando la versión seleccionada tiene una Skill Card generada, no está bloqueada por malware por la moderación, y la verificación de ClawScan está limpia.
- La identidad del skill, la identidad del publicador y los metadatos de la versión seleccionada son campos de envoltorio de nivel superior (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) para que la automatización de shell pueda leerlos sin desempaquetar wrappers anidados.
- `security` es el veredicto de ClawScan/seguridad de nivel superior. La automatización debe basarse en `ok`, `decision`, `reasons` y `security.status`.
- `security.signals` contiene evidencias de escáner de apoyo como `staticScan`, `virusTotal` y `skillSpector`.
- `security.signals.dependencyRegistry` se conserva por compatibilidad de respuesta v1, pero el escáner de existencia de registro de dependencias está retirado y esta clave siempre es `null`.
- `provenance` es `server-resolved-github-import` solo cuando ClawHub resolvió y almacenó un repositorio/ref/commit/ruta de GitHub durante la publicación o importación; de lo contrario, es `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Devuelve veredictos de seguridad compactos actuales para versiones exactas de skills. Este
endpoint de colección está pensado para clientes que ya saben qué versiones de skills de
ClawHub instaladas necesitan mostrar, como OpenClaw Control UI.

Solicitud:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Notas:

- `items` debe contener de 1 a 100 pares `{ slug, version }` únicos.
- Los resultados son por elemento; un skill o una versión faltante no hace fallar toda la respuesta.
- La respuesta es solo de seguridad. No incluye datos de Skill Card, estado de tarjeta generada, listas de archivos de artefactos ni cargas útiles detalladas de escáneres.
- `security.signals` contiene solo evidencias de apoyo a nivel de estado; usa `/scan` o la página de auditoría de seguridad de ClawHub para obtener detalles completos de los escáneres.
- `security.signals.dependencyRegistry` se conserva por compatibilidad de respuesta v1, pero el escáner de existencia de registro de dependencias está retirado y esta clave siempre es `null`.
- La ausencia de Skill Card no afecta el `ok`, `decision` ni `reasons` de este endpoint; los clientes deben leer el `skill-card.md` instalado localmente cuando necesiten contenido de la tarjeta.
- Usa `/verify` cuando necesites el envoltorio de verificación de Skill Card de un solo skill, `/card` cuando necesites markdown de tarjeta generada y `/scan` cuando necesites datos detallados de escáneres.

Respuesta:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Devuelve contenido de texto sin procesar.

Parámetros de consulta:

- `path` (obligatorio)
- `version` (opcional)
- `tag` (opcional)

Notas:

- Usa de forma predeterminada la versión más reciente.
- Límite de tamaño de archivo: 200 KB.

### `GET /api/v1/packages`

Endpoint de catálogo unificado para:

- Skills
- plugins de código
- plugins de paquete

Parámetros de consulta:

- `limit` (opcional): entero (1–100)
- `cursor` (opcional): cursor de paginación
- `family` (opcional): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opcional): `official`, `community` o `private`
- `isOfficial` (opcional): `true` o `false`
- `sort` (opcional): `updated` (predeterminado), `recommended`, `trending`, `downloads`, alias heredado `installs`
- `category` (opcional): filtro de categoría de plugin. Solo se admite cuando la
  solicitud está limitada a paquetes de plugins (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` o endpoints de paquetes con
  `family=code-plugin`/`family=bundle-plugin`). Las categorías controladas y
  los alias de filtro heredados de v1 están documentados en `GET /api/v1/plugins`.

Notas:

- Los valores no válidos de `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` o `sort` devuelven `400`. Los parámetros de consulta desconocidos se ignoran.
- `GET /api/v1/code-plugins` y `GET /api/v1/bundle-plugins` siguen siendo alias de familia fija.
- Las entradas de Skills siguen respaldadas por el registro de Skills y todavía solo se pueden publicar mediante `POST /api/v1/skills`.
- `POST /api/v1/packages` sigue siendo solo para versiones de code-plugin y bundle-plugin.
- Los llamadores anónimos solo ven canales públicos de paquetes.
- Los llamadores autenticados pueden ver paquetes privados de los publicadores a los que pertenecen en los resultados de listado/búsqueda.
- `channel=private` solo devuelve paquetes que el llamador autenticado puede leer.

### `GET /api/v1/packages/search`

Búsqueda de catálogo unificado en Skills + paquetes de plugins.

Parámetros de consulta:

- `q` (obligatorio): cadena de consulta
- `limit` (opcional): entero (1–100)
- `family` (opcional): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opcional): `official`, `community` o `private`
- `isOfficial` (opcional): `true` o `false`
- `category` (opcional): filtro de categoría de plugin. Solo se admite cuando la
  solicitud está limitada a paquetes de plugins. Las categorías controladas y
  los alias de filtro heredados de v1 están documentados en `GET /api/v1/plugins`.

Notas:

- Los valores no válidos de `family`, `channel`, `isOfficial`, `featured` o
  `highlightedOnly` devuelven `400`. Los parámetros de consulta desconocidos se ignoran.
- Los llamadores anónimos solo ven canales públicos de paquetes.
- Los llamadores autenticados pueden buscar paquetes privados de los publicadores a los que pertenecen.
- `channel=private` solo devuelve paquetes que el llamador autenticado puede leer.

### `GET /api/v1/plugins`

Exploración de catálogo solo de plugins en paquetes code-plugin y bundle-plugin.

Parámetros de consulta:

- `limit` (opcional): entero (1-100)
- `cursor` (opcional): cursor de paginación
- `isOfficial` (opcional): `true` o `false`
- `sort` (opcional): `recommended` (predeterminado), `trending`, `downloads`, `updated`, alias heredado `installs`
- `category` (opcional): filtro de categoría de plugin. Valores actuales:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Los alias de filtro heredados de v1 siguen aceptándose en endpoints de lectura:

- `mcp-tooling`, `data` y `automation` se resuelven como `tools`.
- `observability` y `deployment` se resuelven como `gateway`.
- `dev-tools` se resuelve como `runtime`.

`trending` es una clasificación de instalaciones/descargas de siete días y no usa totales históricos.
En el endpoint unificado `/api/v1/packages` es solo para plugins; usa
`/api/v1/skills?sort=trending` para el catálogo de Skills.

Los alias heredados no se aceptan como valores de categoría almacenados o declarados por el autor.

### `GET /api/v1/skills/export`

Exportación masiva de las Skills públicas más recientes para análisis sin conexión.

Autenticación:

- Se requiere token de API.

Parámetros de consulta:

- `startDate` (obligatorio): límite inferior en milisegundos Unix para `updatedAt` de la skill.
- `endDate` (obligatorio): límite superior en milisegundos Unix para `updatedAt` de la skill.
- `limit` (opcional): entero (1-250), valor predeterminado `250`.
- `cursor` (opcional): cursor de paginación de la respuesta anterior.

Respuesta:

- Cuerpo: archivo ZIP.
- Cada skill exportada tiene su raíz en `{publisher}/{slug}/`.
- Las Skills alojadas incluyen los archivos de la versión almacenada más reciente y se listan en
  `_manifest.json` con `sourceRef: "public-clawhub"`.
- Las Skills actuales respaldadas por GitHub con un escaneo `clean` o `suspicious` incluyen
  `_source_handoff.json` con `sourceRef: "public-github"`, repositorio, commit, ruta,
  hash de contenido y URL del archivo. No incluyen archivos fuente alojados en ClawHub.
- Cada skill incluye `_export_skill_meta.json`.
- `_manifest.json` siempre se incluye en la raíz del ZIP.
- `_errors.json` se incluye cuando no se pudieron exportar skills o archivos
  individuales.

Encabezados:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Exportación masiva de los lanzamientos públicos más recientes de Plugin para análisis sin conexión.

Autenticación:

- Se requiere token de API.

Parámetros de consulta:

- `startDate` (obligatorio): límite inferior en milisegundos Unix para `updatedAt` de Plugin.
- `endDate` (obligatorio): límite superior en milisegundos Unix para `updatedAt` de Plugin.
- `limit` (opcional): entero (1-250), valor predeterminado `250`.
- `cursor` (opcional): cursor de paginación de la respuesta anterior.
- `family` (opcional): `code-plugin` o `bundle-plugin`. Si se omite, incluye ambas
  familias de Plugin.

Respuesta:

- Cuerpo: archivo ZIP.
- Cada Plugin exportado tiene como raíz `{family}/{packageName}/`.
- Cada Plugin exportado incluye los archivos almacenados del lanzamiento más reciente.
- Los metadatos de exportación por Plugin se almacenan en
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` siempre se incluye en la raíz del ZIP.
- `_errors.json` se incluye cuando no se pudieron exportar Plugins o archivos
  individuales.

Encabezados:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Búsqueda solo de Plugin en paquetes code-plugin y bundle-plugin.

Parámetros de consulta:

- `q` (obligatorio): cadena de consulta
- `limit` (opcional): entero (1-100)
- `isOfficial` (opcional): `true` o `false`
- `category` (opcional): filtro de categoría de Plugin. Valores actuales:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Notas:

- También se aceptan los alias de filtro heredados de v1 documentados en `GET /api/v1/plugins`.
- El filtrado por categoría es un filtro de API real respaldado por filas de resumen
  de categoría de Plugin, no una reescritura de consulta de búsqueda.
- Los resultados se devuelven por orden de relevancia y actualmente no se paginan.
- Los controles de ordenación de la interfaz del navegador para búsqueda de Plugin reordenan los resultados de relevancia cargados,
  coincidiendo con el comportamiento actual de exploración de `/skills`.

### `GET /api/v1/packages/{name}`

Devuelve metadatos detallados del paquete.

Notas:

- Skills también puede resolverse mediante esta ruta en el catálogo unificado.
- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.

### `DELETE /api/v1/packages/{name}`

Elimina lógicamente un paquete y todos sus lanzamientos.

Notas:

- Requiere un token de API del propietario del paquete, un propietario/administrador de publicador de organización,
  moderador de plataforma o administrador de plataforma.

### `GET /api/v1/packages/{name}/versions`

Devuelve el historial de versiones.

Parámetros de consulta:

- `limit` (opcional): entero (1–100)
- `cursor` (opcional): cursor de paginación

Notas:

- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/versions/{version}`

Devuelve una versión de paquete, incluidos metadatos de archivo, compatibilidad,
verificación, metadatos de artefacto y datos de análisis.

Notas:

- `version.artifact.kind` es `legacy-zip` para archivos de paquete del entorno anterior o
  `npm-pack` para lanzamientos respaldados por ClawPack.
- Los lanzamientos de ClawPack incluyen campos compatibles con npm `npmIntegrity`, `npmShasum` y
  `npmTarballName`.
- `version.sha256hash` son metadatos de compatibilidad obsoletos para clientes antiguos. Genera el
  hash de los bytes ZIP exactos devueltos por `/api/v1/packages/{name}/download`.
  Los clientes modernos deben usar `version.artifact.sha256`, que identifica el
  artefacto de lanzamiento canónico.
- `version.vtAnalysis`, `version.llmAnalysis` y `version.staticScan` se
  incluyen cuando existen datos de análisis.
- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Devuelve el resumen exacto de seguridad y confianza del lanzamiento del paquete para clientes de instalación.
Esta es la superficie pública de consumo de OpenClaw para decidir si se puede instalar un
lanzamiento resuelto.

Autenticación:

- Endpoint de lectura pública. No se requiere token de propietario, publicador, moderador ni administrador.

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
  el artefacto de lanzamiento.
- `trust.scanStatus` es el estado de confianza efectivo derivado de las entradas de analizadores
  y la moderación manual del lanzamiento.
- `trust.moderationState` admite nulo. Es `null` cuando no existe moderación manual
  del lanzamiento.
- `trust.blockedFromDownload` es la señal de bloqueo de instalación. OpenClaw y otros
  clientes de instalación deben bloquear la instalación cuando este valor es `true` en lugar de
  volver a derivar reglas de bloqueo desde campos de analizador o moderación.
- `trust.reasons` es la lista de explicación para usuarios y auditoría. Los códigos de motivo
  son cadenas estables y compactas como `manual:quarantined`, `scan:malicious`
  y `package:malicious`.
- `trust.pending` significa que una o más entradas de confianza aún esperan completarse.
- `trust.stale` significa que el resumen de confianza se calculó a partir de entradas obsoletas y
  debe tratarse como pendiente de actualización antes de una decisión de autorización de alta confianza.

Notas:

- Este endpoint es exacto por versión. Los clientes deben llamarlo después de resolver la
  versión del paquete que pretenden instalar, no solo después de leer los metadatos más recientes
  del paquete.
- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.
- Este endpoint es intencionalmente más acotado que los endpoints de moderación de propietario/moderador.
  Expone la decisión de instalación y la explicación pública, no
  identidades de reportantes, cuerpos de reporte, evidencia privada ni cronologías internas de revisión.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Devuelve los metadatos explícitos del resolvedor de artefactos para una versión de paquete.

Notas:

- Las versiones de paquete heredadas devuelven un artefacto `legacy-zip` y una
  `downloadUrl` ZIP heredada.
- Las versiones de ClawPack devuelven un artefacto `npm-pack`, campos de integridad npm, una
  `tarballUrl` y la URL de compatibilidad ZIP heredada.
- Esta es la superficie de resolución de OpenClaw; evita adivinar el formato de archivo a partir
  de una URL compartida.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Descarga el artefacto de versión mediante la ruta explícita del resolvedor.

Notas:

- Las versiones de ClawPack transmiten los bytes `.tgz` exactos de npm-pack subidos.
- Las versiones ZIP heredadas redirigen a `/api/v1/packages/{name}/download?version=`.
- Usa el depósito de tasa de descarga.

### `GET /api/v1/packages/{name}/readiness`

Devuelve la preparación calculada para el consumo futuro de OpenClaw.

Las comprobaciones de preparación cubren:

- estado de canal oficial
- disponibilidad de la versión más reciente
- disponibilidad de artefacto npm-pack de ClawPack
- resumen del artefacto
- procedencia del repositorio de origen y commit
- metadatos de compatibilidad de OpenClaw
- destinos de host
- estado de análisis

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

Endpoint de moderador para listar filas de migración de Plugin oficiales de OpenClaw.

Autenticación:

- Requiere un token de API de un usuario moderador o administrador.

Parámetros de consulta:

- `phase` (opcional): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` o
  `all` (valor predeterminado).
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

Endpoint de administrador para crear o actualizar una fila de migración de Plugin oficial.

Autenticación:

- Requiere un token de API de un usuario administrador.

Cuerpo de solicitud:

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
- Esto solo registra la preparación de migración. No modifica OpenClaw ni genera
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint de moderador/administrador para colas de revisión de lanzamientos de paquetes.

Autenticación:

- Requiere un token de API de un usuario moderador o administrador.

Parámetros de consulta:

- `status` (opcional): `open` (valor predeterminado), `blocked`, `manual` o `all`
- `limit` (opcional): entero (1-100)
- `cursor` (opcional): cursor de paginación

Significados de estado:

- `open`: lanzamientos sospechosos, maliciosos, pendientes, en cuarentena, revocados o reportados.
- `blocked`: lanzamientos en cuarentena, revocados o maliciosos.
- `manual`: cualquier lanzamiento con una anulación de moderación manual.
- `all`: cualquier lanzamiento con una anulación manual, estado de análisis no limpio o reporte de paquete.

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

Reporta un paquete para revisión por moderadores. Los reportes son de nivel de paquete, opcionalmente
vinculados a una versión. Alimentan la cola de moderación, pero por sí solos no ocultan ni
bloquean descargas automáticamente; los moderadores deben usar la moderación de lanzamientos para
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

- Requiere un token de API para el propietario del paquete, un miembro del publicador, un moderador o
  un usuario administrador.

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

`note` es obligatorio para `confirmed` y `dismissed`; puede omitirse al
volver a establecer `status` en `open`. Pasa `finalAction: "quarantine"` o
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

Endpoint de moderador/administrador para la revisión de versiones de paquetes.

Solicitud:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Estados admitidos:

- `approved`: revisada manualmente y permitida.
- `quarantined`: bloqueada a la espera de seguimiento.
- `revoked`: bloqueada después de que una versión se hubiera considerado confiable anteriormente.

Las versiones en cuarentena y revocadas devuelven `403` desde las rutas de descarga de artefactos.
Cada cambio escribe una entrada en el registro de auditoría.

### `GET /api/v1/packages/{name}/file`

Devuelve el contenido de texto sin procesar de un archivo de paquete.

Parámetros de consulta:

- `path` (obligatorio)
- `version` (opcional)
- `tag` (opcional)

Notas:

- Usa de forma predeterminada la versión más reciente.
- Usa el depósito de tasa de lectura, no el depósito de descarga.
- Los archivos binarios devuelven `415`.
- Límite de tamaño de archivo: 200KB.
- Los escaneos pendientes de VirusTotal no bloquean las lecturas; las versiones maliciosas aún pueden retenerse en otros lugares.
- Los paquetes privados devuelven `404` salvo que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/download`

Descarga el archivo ZIP determinista heredado para una versión de paquete.

Parámetros de consulta:

- `version` (opcional)
- `tag` (opcional)

Notas:

- Usa de forma predeterminada la versión más reciente.
- Skills redirige a `GET /api/v1/download`.
- Los archivos de Plugin/paquete son archivos zip con una raíz `package/` para que los clientes antiguos de OpenClaw
  sigan funcionando.
- Esta ruta sigue siendo solo ZIP. No transmite archivos ClawPack `.tgz`.
- Las respuestas incluyen los encabezados `ETag`, `Digest`, `X-ClawHub-Artifact-Type` y
  `X-ClawHub-Artifact-Sha256` para comprobaciones de integridad del resolver.
- Los metadatos solo del registro no se inyectan en el archivo descargado.
- Los escaneos pendientes de VirusTotal no bloquean las descargas; las versiones maliciosas devuelven `403`.
- Los paquetes privados devuelven `404` salvo que el llamador sea el propietario.

### `GET /api/npm/{package}`

Devuelve un packument compatible con npm para versiones de paquete respaldadas por ClawPack.

Notas:

- Solo se listan las versiones con tarballs npm-pack de ClawPack subidos.
- Las versiones heredadas solo ZIP se omiten intencionalmente.
- `dist.tarball`, `dist.integrity` y `dist.shasum` usan campos compatibles con npm
  para que los usuarios puedan apuntar npm al mirror si lo eligen.
- Los packuments de paquetes con ámbito admiten tanto `/api/npm/@scope/name` como la ruta de solicitud
  codificada de npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Transmite los bytes exactos del tarball ClawPack subido para clientes de mirror npm.

Notas:

- Usa el depósito de tasa de descarga.
- Los encabezados de descarga incluyen el SHA-256 de ClawHub más metadatos de integridad/shasum de npm.
- La moderación y las comprobaciones de acceso a paquetes privados siguen aplicándose.

### `GET /api/v1/resolve`

Lo usa la CLI para asignar una huella digital local a una versión conocida.

Parámetros de consulta:

- `slug` (obligatorio)
- `hash` (obligatorio): sha256 hexadecimal de 64 caracteres de la huella digital del bundle

Respuesta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Descarga un ZIP de versión de habilidad alojada, o devuelve una transferencia de origen de GitHub para una
habilidad actual respaldada por GitHub con un escaneo `clean` o `suspicious` y sin versión
alojada.

Parámetros de consulta:

- `slug` (obligatorio)
- `version` (opcional): cadena semver
- `tag` (opcional): nombre de etiqueta (por ejemplo, `latest`)

Notas:

- Si no se proporciona ni `version` ni `tag`, se usa la versión más reciente.
- Las versiones eliminadas de forma reversible devuelven `410`.
- Las transferencias de habilidades respaldadas por GitHub no hacen proxy ni mirror de bytes. La respuesta JSON
  incluye `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  y `archiveUrl`; el estado de escaneo/actual es una puerta y no se incluye como metadatos de carga útil
  de éxito.
- Las estadísticas de descarga se cuentan como identidades únicas por día UTC (`userId` cuando el token de API es válido; de lo contrario, IP).

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
- También se acepta un cuerpo JSON con `files` (basado en storageId).
- Campo opcional de carga útil: `ownerHandle`. Cuando está presente, la API resuelve ese
  publicador del lado del servidor y requiere que el actor tenga acceso al publicador.
- Campo opcional de carga útil: `migrateOwner`. Cuando es `true` con `ownerHandle`, una
  habilidad existente puede moverse a ese propietario si el actor es administrador/propietario tanto en el
  publicador actual como en el destino. Sin esta aceptación explícita, los cambios de propietario se
  rechazan.

### `POST /api/v1/packages`

Publica una versión de code-plugin o bundle-plugin.

- Requiere autenticación con token Bearer.
- Requiere `multipart/form-data`.
- Los campos de formulario permitidos son `payload`, blobs `files` repetidos o una referencia de tarball
  `clawpack`. `clawpack` puede ser un blob `.tgz` o un id de almacenamiento devuelto por
  el flujo upload-url. Las publicaciones preparadas con storage-id también deben incluir el
  `clawpackUploadTicket` devuelto con esa URL de carga.
- Usa `files` o `clawpack`, nunca ambos en la misma solicitud.
- Los cuerpos JSON y los metadatos `payload.files` / `payload.artifact`
  proporcionados por el llamador se rechazan.
- Las solicitudes de publicación multipart directas tienen un límite de 18MB. Los tarballs ClawPack pueden
  usar el flujo upload-url hasta el límite de tarball de 120MB.
- Campo opcional de carga útil: `ownerHandle`. Cuando está presente, solo los administradores pueden publicar en nombre de ese propietario.

Aspectos destacados de validación:

- `family` debe ser `code-plugin` o `bundle-plugin`.
- Los paquetes Plugin requieren `openclaw.plugin.json`. Las cargas `.tgz` de ClawPack deben
  contenerlo en `package/openclaw.plugin.json`.
- Los plugins de código requieren `package.json`, metadatos del repositorio de origen, metadatos del commit de origen,
  metadatos del esquema de configuración, `openclaw.compat.pluginApi` y
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` y `openclaw.environment` son metadatos opcionales.
- Solo el publicador de la organización `openclaw` y los publicadores personales de miembros actuales de la organización `openclaw`
  pueden publicar en el canal `official`.
- Las publicaciones en nombre de otro usuario siguen validando la elegibilidad del canal oficial contra la cuenta del propietario de destino.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina de forma reversible / restaura una habilidad (propietario, moderador o administrador).

Cuerpo JSON opcional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Cuando está presente, `reason` se almacena como la nota de moderación de la habilidad y se copia en el registro de auditoría.
Las eliminaciones reversibles iniciadas por el propietario reservan el slug durante 30 días; luego otro
publicador puede reclamar el slug. La respuesta de eliminación incluye `slugReservedUntil` cuando se aplica esta caducidad.
Las ocultaciones de moderador/administrador y las eliminaciones de seguridad no caducan de esta forma.

Respuesta de eliminación:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Códigos de estado:

- `200`: correcto
- `401`: no autorizado
- `403`: prohibido
- `404`: habilidad/usuario no encontrado
- `500`: error interno del servidor

### `POST /api/v1/users/publisher`

Solo administradores. Garantiza que exista un publicador de organización para un handle. Si el handle aún apunta a un
usuario compartido heredado/publicador personal, el endpoint lo migra primero a un publicador de organización.
Para una organización recién creada, proporciona `memberHandle`; el administrador actor no se añade como miembro.
`memberRole` usa `owner` de forma predeterminada.

- Cuerpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Respuesta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Creación autenticada de publicador de organización por autoservicio. Crea un nuevo publicador de organización y añade al
llamador como propietario. Este endpoint no migra handles de usuario/personales existentes y no
marca al publicador como confiable/oficial.

- Cuerpo: `{ "handle": "opik", "displayName": "Opik" }`
- Respuesta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Devuelve `409` cuando el handle ya lo usa un publicador, usuario o publicador personal.

### `POST /api/v1/users/reserve`

Solo administradores. Reserva slugs raíz y nombres de paquetes para un propietario legítimo sin publicar una
versión. Los nombres de paquete se convierten en paquetes marcadores privados sin filas de versión, para que el mismo
propietario pueda publicar más tarde la versión real de code-plugin o bundle-plugin en ese nombre.

- Cuerpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respuesta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Solo administradores. Recupera un publicador personal para un principal de GitHub OAuth de reemplazo verificado
sin editar filas de cuentas de Convex Auth. La solicitud debe nombrar ambos ids inmutables de cuenta de
proveedor de GitHub; los handles mutables solo se usan como una protección orientada al operador.

El endpoint usa dry-run de forma predeterminada. Aplicar la recuperación requiere `dryRun: false` y
`confirmIdentityVerified: true` después de que el personal verifique de forma independiente la continuidad entre ambos
principales de GitHub. La recuperación falla de forma cerrada cuando el publicador personal actual del usuario de destino
tiene Skills, paquetes o fuentes de Skills de GitHub.
La recuperación también migra los campos heredados `ownerUserId` de los Skills del publicador recuperado,
los alias de slug de Skills, los paquetes, las advertencias del inspector de paquetes y las filas derivadas del resumen de búsqueda para que
las rutas de propietario directo coincidan con la nueva autoridad del publicador. Una reserva activa de identificador protegido
para el identificador recuperado también se reasigna al usuario de reemplazo para que la sincronización posterior del perfil
no pueda restaurar la autoridad competidora del usuario anterior. Cada tabla primaria está limitada a
100 filas por transacción de aplicación; las recuperaciones más grandes deben usar primero una migración de propietario reanudable.
Las fuentes de Skills de GitHub tienen alcance de publicador y se informan como comprobadas en lugar de reescribirse.

- Cuerpo: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Respuesta: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoints de gestión de slug de propietario

- `POST /api/v1/skills/{slug}/rename`
  - Cuerpo: `{ "newSlug": "new-canonical-slug" }`
  - Respuesta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Cuerpo: `{ "targetSlug": "canonical-target-slug" }`
  - Respuesta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notas:

- Ambos endpoints requieren autenticación con token de API y solo funcionan para el propietario del Skill.
- `rename` conserva el slug anterior como alias de redirección.
- `merge` oculta la lista de origen y redirige el slug de origen a la lista de destino.

### Endpoints de transferencia de propiedad

- `POST /api/v1/skills/{slug}/transfer`
  - Cuerpo: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Respuesta: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Respuesta (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Forma de la respuesta: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bloquea a un usuario y elimina permanentemente sus Skills propios (solo moderador/admin).

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

Desbloquea a un usuario y restaura los Skills elegibles (solo admin).

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

### `POST /api/v1/users/reclassify-ban`

Cambia el motivo almacenado de un bloqueo existente sin desbloquear ni restaurar
contenido (solo admin). De forma predeterminada usa dry-run salvo que `dryRun` sea `false`.

Cuerpo:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

o

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Respuesta:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

Cambia el rol de un usuario (solo admin).

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

Lista o busca usuarios (solo admin).

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

## Endpoints heredados de la CLI (obsoletos)

Siguen siendo compatibles para versiones anteriores de la CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulta `DEPRECATIONS.md` para ver el plan de eliminación.

`POST /api/cli/upload-url` devuelve `uploadUrl` y `uploadTicket`. Las publicaciones de paquetes
que preparan un tarball de ClawPack deben enviar el id de almacenamiento resultante como
`clawpack` y el ticket devuelto como `clawpackUploadTicket`.

## Descubrimiento del registro (`/.well-known/clawhub.json`)

La CLI puede descubrir la configuración de registro/autenticación desde el sitio:

- `/.well-known/clawhub.json` (JSON, preferido)
- `/.well-known/clawdhub.json` (heredado)

Esquema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Si usas alojamiento propio, sirve este archivo (o establece `CLAWHUB_REGISTRY` explícitamente; `CLAWDHUB_REGISTRY` heredado).
