---
read_when:
    - Añadir/cambiar endpoints
    - Depuración de solicitudes CLI ↔ registro
summary: Referencia de la API HTTP (pública + endpoints de CLI + autenticación).
x-i18n:
    generated_at: "2026-07-05T01:53:49Z"
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
Las rutas heredadas `/api/...` y `/api/cli/...` se mantienen por compatibilidad (consulta `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Reutilización del catálogo público

Los directorios de terceros pueden usar los endpoints públicos de lectura para listar o buscar Skills de ClawHub. Almacena los resultados en caché, respeta `429`/`Retry-After`, enlaza a los usuarios de vuelta al listado canónico de ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) y evita insinuar que ClawHub respalda el sitio de terceros. No intentes reflejar contenido oculto, privado o bloqueado por moderación fuera de la superficie de la API pública.

Los atajos de slug web se resuelven entre familias de registro, pero los clientes de API deben usar
las URL canónicas devueltas por los endpoints de lectura en lugar de reconstruir la precedencia
de rutas.

## Límites de tasa

Modelo de aplicación:

- Solicitudes anónimas: se aplican por IP.
- Solicitudes autenticadas (token Bearer válido): se aplican por bucket de usuario.
- Si falta el token o no es válido, el comportamiento vuelve a la aplicación por IP.
- Los endpoints de escritura autenticados no deberían devolver un simple `Unauthorized` cuando
  el servidor conoce el motivo. Los tokens ausentes, los tokens inválidos/revocados y
  las cuentas eliminadas/baneadas/deshabilitadas deberían recibir texto accionable para que los clientes
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
  Las solicitudes distribuidas en shards que tienen éxito omiten este encabezado en lugar de devolver un valor global aproximado.
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
- Usa backoff con jitter para evitar reintentos sincronizados.
- Si falta `Retry-After`, recurre a `RateLimit-Reset` (o calcula a partir de `X-RateLimit-Reset`).

Fuente de IP:

- Usa encabezados de IP de cliente confiables, incluido `cf-connecting-ip`, solo cuando el
  despliegue habilita explícitamente los encabezados reenviados confiables.
- ClawHub usa encabezados de reenvío confiables para identificar las IP de cliente en el borde.
- Si no hay una IP de cliente confiable disponible, las solicitudes anónimas usan buckets de respaldo
  delimitados solo por tipo de límite de tasa. Estos buckets de respaldo no incluyen
  rutas, slugs, nombres de paquete, versiones, cadenas de consulta u otros
  parámetros de artefacto suministrados por el llamador.

## Respuestas de error

Las respuestas de error públicas v1 son texto sin formato con `content-type: text/plain; charset=utf-8`.
Esto incluye fallos de validación (`400`), recursos públicos ausentes (`404`), fallos de autenticación y
permisos (`401`/`403`), límites de tasa (`429`) y descargas bloqueadas. Los clientes
deberían leer el cuerpo de la respuesta como una cadena legible por humanos. Los parámetros de consulta desconocidos se
ignoran por compatibilidad, pero los parámetros de consulta reconocidos con valores no válidos devuelven
`400`.

## Endpoints públicos (sin autenticación)

### `GET /api/v1/search`

Parámetros de consulta:

- `q` (obligatorio): cadena de consulta
- `limit` (opcional): entero
- `highlightedOnly` (opcional): `true` para filtrar a Skills destacadas
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

- Los resultados se devuelven en orden de relevancia (similitud de embeddings + boosts por coincidencia exacta de tokens de slug/nombre + un pequeño prior de popularidad).
- La relevancia pesa más que la popularidad. Una coincidencia precisa de slug o de token de nombre visible puede superar a una coincidencia más laxa con mucha más interacción.
- El texto ASCII se tokeniza en límites de palabras y puntuación. Por ejemplo, `personal-map` contiene un token independiente `map`, mientras que `amap-jsapi-skill` contiene `amap`, `jsapi` y `skill`; por lo tanto, buscar `map` da a `personal-map` una coincidencia léxica más fuerte que a `amap-jsapi-skill`.
- La popularidad se escala logarítmicamente y se limita. Las Skills con mucha interacción pueden clasificarse por debajo cuando el texto de consulta tiene una coincidencia más débil.
- El estado de moderación sospechoso u oculto puede quitar una Skill de la búsqueda pública según los filtros del llamador y el estado de moderación actual.

Guía de detectabilidad para publicadores:

- Pon los términos que los usuarios buscarán literalmente en el nombre visible, el resumen y las etiquetas. Usa un token de slug independiente solo cuando también sea una identidad estable que quieras conservar.
- No cambies el nombre de un slug solo para perseguir una consulta, a menos que el nuevo slug sea un mejor nombre canónico a largo plazo. Los slugs antiguos se convierten en alias de redirección, pero la URL canónica, el slug mostrado y los futuros resúmenes de búsqueda usan el nuevo slug.
- Los alias de cambio de nombre preservan la resolución para URL antiguas e instalaciones que se resuelven mediante el registro, pero la clasificación de búsqueda se basa en los metadatos canónicos de la Skill después de que se haya indexado el cambio de nombre. Las estadísticas existentes permanecen con la Skill.
- Si una Skill es inesperadamente invisible, revisa primero el estado de moderación con `clawhub inspect @owner/slug` mientras tienes sesión iniciada antes de cambiar metadatos relacionados con la clasificación.

### `GET /api/v1/skills`

Parámetros de consulta:

- `limit` (opcional): entero (1–200)
- `cursor` (opcional): cursor de paginación para cualquier orden que no sea `trending`
- `sort` (opcional): `updated` (predeterminado), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), los alias de instalación heredados `installsCurrent`/`installs`/`installsAllTime` se asignan a `downloads`, `trending`
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills sospechosas (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias heredado de `nonSuspiciousOnly`

Los valores `sort` no válidos devuelven `400`.

Notas:

- `recommended` usa señales de interacción y actualidad.
- `trending` clasifica por instalaciones en los últimos 7 días (basado en telemetría).
- `createdAt` es estable para rastreos de Skills nuevas; `updated` cambia cuando se republican Skills existentes.
- Cuando `nonSuspiciousOnly=true`, las ordenaciones basadas en cursor pueden devolver menos de `limit` elementos en una página porque las Skills sospechosas se filtran después de recuperar la página.
- Usa `nextCursor` para continuar la paginación cuando esté presente. Una página corta no significa por sí sola fin de resultados.

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

- Los slugs antiguos creados por flujos de cambio de nombre/fusión de propietarios se resuelven a la Skill canónica.
- `metadata.os`: restricciones de SO declaradas en el frontmatter de la Skill (por ejemplo, `["macos"]`, `["linux"]`). `null` si no se declara.
- `metadata.systems`: destinos de sistema Nix (por ejemplo, `["aarch64-darwin", "x86_64-linux"]`). `null` si no se declara.
- `metadata` es `null` si la Skill no tiene metadatos de plataforma.
- `moderation` se incluye solo cuando la Skill está marcada o el propietario la está viendo.

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

- Los propietarios y moderadores pueden acceder a detalles de moderación para Skills ocultas.
- Los llamadores públicos solo reciben `200` para Skills visibles ya marcadas.
- La evidencia se redacta para los llamadores públicos y solo incluye fragmentos sin procesar para propietarios/moderadores.

### `POST /api/v1/skills/{slug}/report`

Reporta una Skill para revisión de moderadores. Los reportes son a nivel de Skill, opcionalmente vinculados
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
cambiar `status` de nuevo a `open`. Pasa `finalAction: "hide"` con un reporte evaluado
para ocultar la Skill en el mismo flujo auditable.

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

- Si no se proporciona `version` ni `tag`, usa la versión más reciente.
- Incluye el estado de verificación normalizado más detalles específicos del escáner.
- `security.hasScanResult` es `true` solo cuando un escáner produjo un veredicto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` es una instantánea actual de moderación a nivel de skill derivada de la versión más reciente.
- Al consultar una versión histórica, revisa `moderation.matchesRequestedVersion` y `moderation.sourceVersion` antes de tratar `moderation` y `security` como el mismo contexto de versión.

### `POST /api/v1/skills/-/scan`

Punto de conexión autenticado de envío para nuevos trabajos de ClawScan.

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

- Las cargas de solicitud de análisis y los informes descargables expiran del almacén de solicitudes de análisis después del periodo de retención.
- Los análisis publicados requieren acceso de administración de propietario/editor, o autoridad de moderador/administrador de la plataforma.
- Los análisis publicados escriben de vuelta solo cuando `update: true` y el análisis se completa correctamente.
- La respuesta es `202` con `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Los trabajos de análisis son asincrónicos. Las solicitudes de análisis manuales se priorizan por delante del trabajo normal de publicación/rellenado, pero la finalización sigue dependiendo de la disponibilidad de los workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Punto de conexión autenticado de sondeo para un análisis enviado.

- Devuelve el estado en cola/en ejecución/correcto/fallido.
- Devuelve `queue.queuedAhead` y `queue.position` mientras está en cola para que los clientes puedan mostrar cuántos análisis manuales priorizados hay por delante de la solicitud. Las colas muy grandes se acotan y se informan con `queuedAheadIsEstimate: true`.
- Cuando está disponible, `report` contiene secciones `clawscan`, `skillspector`, `staticAnalysis` y `virustotal`.
- Los trabajos de análisis fallidos devuelven `status: "failed"` con `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Punto de conexión autenticado de archivo de informe.

- Requiere un análisis correcto; los análisis no terminales devuelven `409`.
- Devuelve un ZIP con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` y `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Punto de conexión autenticado de archivo de informe almacenado para versiones enviadas.

- Requiere acceso de administración de propietario/editor al skill o Plugin, o autoridad de moderador/administrador de la plataforma.
- Devuelve los resultados de análisis almacenados para la versión exacta enviada, incluidas las versiones bloqueadas u ocultas.
- `kind` usa `skill` de forma predeterminada; usa `kind=plugin` para análisis de plugins/paquetes.
- Devuelve la misma forma de ZIP que las descargas de solicitudes de análisis.

### `POST /api/v1/skills/-/scan/batch`

Ruta canónica solo para administradores de nuevo análisis por lotes. Acepta la misma forma de carga que la ruta heredada `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Ruta canónica solo para administradores de estado de lote. Acepta `{ "jobIds": ["..."] }` y devuelve los mismos contadores agregados que la ruta heredada `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Devuelve el sobre de verificación de Skill Card que usa `clawhub skill verify`.

Parámetros de consulta:

- `version` (opcional): cadena de versión específica.
- `tag` (opcional): resuelve una versión etiquetada (por ejemplo, `latest`).

Notas:

- `ok` es `true` solo cuando la versión seleccionada tiene una Skill Card generada, no está bloqueada como malware por moderación y la verificación de ClawScan está limpia.
- La identidad del skill, la identidad del editor y los metadatos de la versión seleccionada son campos de sobre de nivel superior (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) para que la automatización de shell pueda leerlos sin desempaquetar envoltorios anidados.
- `security` es el veredicto de ClawScan/seguridad de nivel superior. La automatización debe basarse en `ok`, `decision`, `reasons` y `security.status`.
- `security.signals` contiene evidencia de escáner de apoyo, como `staticScan`, `virusTotal` y `skillSpector`.
- `security.signals.dependencyRegistry` se conserva por compatibilidad de respuesta v1, pero el escáner de existencia del registro de dependencias está retirado y esta clave siempre es `null`.
- `provenance` es `server-resolved-github-import` solo cuando ClawHub resolvió y almacenó un repositorio/ref/commit/ruta de GitHub durante la publicación o importación; de lo contrario, es `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Devuelve veredictos de seguridad compactos actuales para versiones exactas de skills. Este
punto de conexión de colección está pensado para clientes que ya saben qué versiones
de skills de ClawHub instaladas necesitan mostrar, como OpenClaw Control UI.

Solicitud:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Notas:

- `items` debe contener entre 1 y 100 pares únicos `{ slug, version }`.
- Los resultados son por elemento; un skill o una versión faltante no hace fallar toda la respuesta.
- La respuesta es solo de seguridad. No incluye datos de Skill Card, estado de tarjeta generada, listas de archivos de artefactos ni cargas detalladas de escáneres.
- `security.signals` contiene solo evidencia de apoyo a nivel de estado; usa `/scan` o la página de auditoría de seguridad de ClawHub para obtener detalles completos del escáner.
- `security.signals.dependencyRegistry` se conserva por compatibilidad de respuesta v1, pero el escáner de existencia del registro de dependencias está retirado y esta clave siempre es `null`.
- La ausencia de Skill Card no afecta el `ok`, `decision` ni `reasons` de este punto de conexión; los clientes deben leer el `skill-card.md` instalado localmente cuando necesiten el contenido de la tarjeta.
- Usa `/verify` cuando necesites el sobre de verificación de Skill Card de un solo skill, `/card` cuando necesites Markdown de tarjeta generada y `/scan` cuando necesites datos detallados del escáner.

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
- Límite de tamaño de archivo: 200KB.

### `GET /api/v1/packages`

Endpoint de catálogo unificado para:

- skills
- code plugins
- bundle plugins

Parámetros de consulta:

- `limit` (opcional): entero (1–100)
- `cursor` (opcional): cursor de paginación
- `family` (opcional): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opcional): `official`, `community` o `private`
- `isOfficial` (opcional): `true` o `false`
- `sort` (opcional): `updated` (predeterminado), `recommended`, `trending`, `downloads`, alias heredado `installs`
- `category` (opcional): filtro de categoría de plugin. Solo se admite cuando la
  solicitud está acotada a paquetes de plugins (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` o endpoints de paquetes con
  `family=code-plugin`/`family=bundle-plugin`). Las categorías controladas y
  los aliases heredados de filtros de v1 se documentan en `GET /api/v1/plugins`.

Notas:

- Los valores no válidos para `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` o `sort` devuelven `400`. Los parámetros de consulta desconocidos se ignoran.
- `GET /api/v1/code-plugins` y `GET /api/v1/bundle-plugins` siguen siendo aliases de familia fija.
- Las entradas de Skills siguen respaldadas por el registro de skills y todavía solo se pueden publicar mediante `POST /api/v1/skills`.
- `POST /api/v1/packages` sigue siendo solo para versiones de code-plugin y bundle-plugin.
- Los llamadores anónimos solo ven canales de paquetes públicos.
- Los llamadores autenticados pueden ver paquetes privados de los publicadores a los que pertenecen en los resultados de lista/búsqueda.
- `channel=private` solo devuelve paquetes que el llamador autenticado puede leer.

### `GET /api/v1/packages/search`

Búsqueda de catálogo unificado en skills + paquetes de plugins.

Parámetros de consulta:

- `q` (obligatorio): cadena de consulta
- `limit` (opcional): entero (1–100)
- `family` (opcional): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opcional): `official`, `community` o `private`
- `isOfficial` (opcional): `true` o `false`
- `category` (opcional): filtro de categoría de plugin. Solo se admite cuando la
  solicitud está acotada a paquetes de plugins. Las categorías controladas y los
  aliases heredados de filtros de v1 se documentan en `GET /api/v1/plugins`.

Notas:

- Los valores no válidos para `family`, `channel`, `isOfficial`, `featured` o
  `highlightedOnly` devuelven `400`. Los parámetros de consulta desconocidos se ignoran.
- Los llamadores anónimos solo ven canales de paquetes públicos.
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

Los aliases heredados de filtros de v1 siguen aceptándose en endpoints de lectura:

- `mcp-tooling`, `data` y `automation` se resuelven como `tools`.
- `observability` y `deployment` se resuelven como `gateway`.
- `dev-tools` se resuelve como `runtime`.

`trending` es una clasificación de instalaciones/descargas de siete días y no usa totales históricos.
En el endpoint unificado `/api/v1/packages` es solo para plugins; usa
`/api/v1/skills?sort=trending` para el catálogo de skills.

Los aliases heredados no se aceptan como valores de categoría almacenados o declarados por el autor.

### `GET /api/v1/skills/export`

Exportación masiva de las skills públicas más recientes para análisis sin conexión.

Autenticación:

- Se requiere token de API.

Parámetros de consulta:

- `startDate` (obligatorio): límite inferior en milisegundos Unix para `updatedAt` de la skill.
- `endDate` (obligatorio): límite superior en milisegundos Unix para `updatedAt` de la skill.
- `limit` (opcional): entero (1-250), predeterminado `250`.
- `cursor` (opcional): cursor de paginación de la respuesta anterior.

Respuesta:

- Cuerpo: archivo ZIP.
- Cada skill exportada tiene como raíz `{publisher}/{slug}/`.
- Las skills alojadas incluyen los archivos de la versión almacenada más reciente y se enumeran en
  `_manifest.json` con `sourceRef: "public-clawhub"`.
- Las skills actuales respaldadas por GitHub con un escaneo `clean` o `suspicious` incluyen
  `_source_handoff.json` con `sourceRef: "public-github"`, repositorio, commit, ruta,
  hash de contenido y URL de archivo. No incluyen archivos fuente alojados en ClawHub.
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

Exportación masiva de los lanzamientos públicos más recientes de plugins para análisis sin conexión.

Autenticación:

- Se requiere token de API.

Parámetros de consulta:

- `startDate` (obligatorio): límite inferior en milisegundos Unix para `updatedAt` del plugin.
- `endDate` (obligatorio): límite superior en milisegundos Unix para `updatedAt` del plugin.
- `limit` (opcional): entero (1-250), valor predeterminado `250`.
- `cursor` (opcional): cursor de paginación de la respuesta anterior.
- `family` (opcional): `code-plugin` o `bundle-plugin`. Si se omite, incluye ambas
  familias de plugins.

Respuesta:

- Cuerpo: archivo ZIP.
- Cada plugin exportado tiene como raíz `{family}/{packageName}/`.
- Cada plugin exportado incluye los archivos almacenados del lanzamiento más reciente.
- Los metadatos de exportación por plugin se almacenan en
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` siempre se incluye en la raíz del ZIP.
- `_errors.json` se incluye cuando plugins o archivos individuales no pudieron
  exportarse.

Encabezados:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Búsqueda solo de plugins en paquetes code-plugin y bundle-plugin.

Parámetros de consulta:

- `q` (obligatorio): cadena de consulta
- `limit` (opcional): entero (1-100)
- `isOfficial` (opcional): `true` o `false`
- `category` (opcional): filtro de categoría de plugin. Valores actuales:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Notas:

- También se aceptan los alias de filtros heredados de v1 documentados en
  `GET /api/v1/plugins`.
- El filtrado por categoría es un filtro real de API respaldado por filas de
  resumen de categorías de plugins, no una reescritura de la consulta de búsqueda.
- Los resultados se devuelven en orden de relevancia y actualmente no se paginan.
- Los controles de ordenación de la interfaz del navegador para la búsqueda de plugins reordenan los resultados de relevancia cargados,
  coincidiendo con el comportamiento actual de exploración de `/skills`.

### `GET /api/v1/packages/{name}`

Devuelve metadatos detallados del paquete.

Notas:

- Skills también pueden resolverse mediante esta ruta en el catálogo unificado.
- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.

### `DELETE /api/v1/packages/{name}`

Elimina lógicamente un paquete y todos sus lanzamientos.

Notas:

- Requiere un token de API para el propietario del paquete, un propietario/administrador del publicador de la organización,
  moderador de la plataforma o administrador de la plataforma.

### `GET /api/v1/packages/{name}/versions`

Devuelve el historial de versiones.

Parámetros de consulta:

- `limit` (opcional): entero (1–100)
- `cursor` (opcional): cursor de paginación

Notas:

- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/versions/{version}`

Devuelve una versión de paquete, incluidos metadatos de archivos, compatibilidad,
verificación, metadatos de artefactos y datos de análisis.

Notas:

- `version.artifact.kind` es `legacy-zip` para archivos de paquetes del mundo antiguo o
  `npm-pack` para lanzamientos respaldados por ClawPack.
- Los lanzamientos de ClawPack incluyen campos compatibles con npm `npmIntegrity`, `npmShasum` y
  `npmTarballName`.
- `version.sha256hash` son metadatos de compatibilidad obsoletos para clientes antiguos. Genera un hash de los bytes ZIP exactos devueltos por `/api/v1/packages/{name}/download`.
  Los clientes modernos deben usar `version.artifact.sha256`, que identifica el
  artefacto de lanzamiento canónico.
- `version.vtAnalysis`, `version.llmAnalysis` y `version.staticScan` se incluyen
  cuando existen datos de análisis.
- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Devuelve el resumen exacto de seguridad y confianza del lanzamiento del paquete para clientes de instalación. Esta es la superficie pública de consumo de OpenClaw para decidir si se puede instalar un lanzamiento resuelto.

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
  el artefacto de lanzamiento.
- `trust.scanStatus` es el estado de confianza efectivo derivado de las entradas del escáner
  y la moderación manual del lanzamiento.
- `trust.moderationState` admite nulos. Es `null` cuando no existe moderación manual del lanzamiento.
- `trust.blockedFromDownload` es la señal de bloqueo de instalación. OpenClaw y otros
  clientes de instalación deben bloquear la instalación cuando este valor sea `true` en lugar de
  volver a derivar reglas de bloqueo a partir de campos del escáner o de moderación.
- `trust.reasons` es la lista de explicaciones para el usuario y de auditoría. Los códigos de motivo
  son cadenas estables y compactas como `manual:quarantined`, `scan:malicious`
  y `package:malicious`.
- `trust.pending` significa que una o más entradas de confianza aún esperan completarse.
- `trust.stale` significa que el resumen de confianza se calculó a partir de entradas obsoletas y
  debe tratarse como que requiere actualización antes de una decisión de autorización de alta confianza.

Notas:

- Este endpoint es exacto por versión. Los clientes deben llamarlo después de resolver la
  versión del paquete que pretenden instalar, no solo después de leer los metadatos
  más recientes del paquete.
- Los paquetes privados devuelven `404` a menos que el llamador pueda leer el publicador propietario.
- Este endpoint es intencionalmente más limitado que los endpoints de moderación de propietarios/moderadores.
  Expone la decisión de instalación y la explicación pública, no
  identidades de reportantes, cuerpos de reportes, evidencia privada ni cronologías internas de revisión.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Devuelve los metadatos explícitos del resolvedor de artefactos para una versión de paquete.

Notas:

- Las versiones de paquetes heredadas devuelven un artefacto `legacy-zip` y una URL de descarga ZIP heredada
  `downloadUrl`.
- Las versiones de ClawPack devuelven un artefacto `npm-pack`, campos de integridad de npm, una
  `tarballUrl` y la URL heredada de compatibilidad ZIP.
- Esta es la superficie de resolución de OpenClaw; evita inferir el formato de archivo a partir de
  una URL compartida.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Descarga el artefacto de la versión mediante la ruta explícita del resolvedor.

Notas:

- Las versiones de ClawPack transmiten los bytes exactos `.tgz` de npm-pack cargados.
- Las versiones ZIP heredadas redirigen a `/api/v1/packages/{name}/download?version=`.
- Usa el bucket de límite de tasa de descargas.

### `GET /api/v1/packages/{name}/readiness`

Devuelve la preparación calculada para consumo futuro de OpenClaw.

Las comprobaciones de preparación cubren:

- estado de canal oficial
- disponibilidad de la versión más reciente
- disponibilidad del artefacto npm-pack de ClawPack
- resumen del artefacto
- procedencia del repositorio fuente y del commit
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
- Esto solo rastrea la preparación de la migración. No modifica OpenClaw ni genera
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

Reporta un paquete para revisión de moderadores. Los reportes son a nivel de paquete, opcionalmente
vinculados a una versión. Alimentan la cola de moderación, pero no ocultan automáticamente ni
bloquean descargas por sí solos; los moderadores deben usar la moderación de lanzamientos para
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

Punto de conexión de moderador/administrador para la recepción de informes de paquetes.

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

Punto de conexión de propietario/moderador para la visibilidad de moderación de paquetes.

Autenticación:

- Requiere un token de API del propietario del paquete, un miembro publicador, un moderador o
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

Punto de conexión de moderador/administrador para resolver o reabrir informes de paquetes.

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

Punto de conexión de moderador/administrador para la revisión de versiones de paquetes.

Solicitud:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Estados admitidos:

- `approved`: revisado manualmente y permitido.
- `quarantined`: bloqueado pendiente de seguimiento.
- `revoked`: bloqueado después de que una versión se hubiera considerado confiable previamente.

Las versiones en cuarentena y revocadas devuelven `403` desde las rutas de descarga de artefactos.
Cada cambio escribe una entrada en el registro de auditoría.

### `GET /api/v1/packages/{name}/file`

Devuelve contenido de texto sin procesar de un archivo de paquete.

Parámetros de consulta:

- `path` (obligatorio)
- `version` (opcional)
- `tag` (opcional)

Notas:

- Usa la versión más reciente de forma predeterminada.
- Usa el bucket de tasa de lectura, no el bucket de descarga.
- Los archivos binarios devuelven `415`.
- Límite de tamaño de archivo: 200 KB.
- Los análisis pendientes de VirusTotal no bloquean las lecturas; las versiones maliciosas aún pueden retenerse en otro lugar.
- Los paquetes privados devuelven `404` salvo que el llamador pueda leer el publicador propietario.

### `GET /api/v1/packages/{name}/download`

Descarga el archivo ZIP determinista heredado de una versión de paquete.

Parámetros de consulta:

- `version` (opcional)
- `tag` (opcional)

Notas:

- Usa la versión más reciente de forma predeterminada.
- Skills redirige a `GET /api/v1/download`.
- Los archivos de Plugin/paquete son archivos zip con una raíz `package/` para que los clientes antiguos de OpenClaw
  sigan funcionando.
- Esta ruta sigue siendo solo ZIP. No transmite archivos ClawPack `.tgz`.
- Las respuestas incluyen encabezados `ETag`, `Digest`, `X-ClawHub-Artifact-Type` y
  `X-ClawHub-Artifact-Sha256` para comprobaciones de integridad del resolvedor.
- Los metadatos solo del registro no se inyectan en el archivo descargado.
- Los análisis pendientes de VirusTotal no bloquean las descargas; las versiones maliciosas devuelven `403`.
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

Transmite los bytes exactos del tarball ClawPack cargado para clientes de espejo npm.

Notas:

- Usa el bucket de tasa de descarga.
- Los encabezados de descarga incluyen el SHA-256 de ClawHub más metadatos de integridad/shasum de npm.
- La moderación y las comprobaciones de acceso a paquetes privados siguen aplicándose.

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

Descarga un ZIP de una versión de skill alojada o devuelve una transferencia a código fuente de GitHub para una
skill actual respaldada por GitHub con un análisis `clean` o `suspicious` y sin versión
alojada.

Parámetros de consulta:

- `slug` (obligatorio)
- `version` (opcional): cadena semver
- `tag` (opcional): nombre de etiqueta (p. ej., `latest`)

Notas:

- Si no se proporciona ni `version` ni `tag`, se usa la versión más reciente.
- Las versiones eliminadas de forma reversible devuelven `410`.
- Las transferencias de skills respaldadas por GitHub no hacen proxy ni espejo de bytes. La respuesta JSON
  incluye `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  y `archiveUrl`; el estado de análisis/actual es una puerta y no se incluye como metadatos
  de carga útil de éxito.
- Las estadísticas de descarga se cuentan como identidades únicas por día UTC (`userId` cuando el token de API es válido; de lo contrario, IP).

## Puntos de conexión de autenticación (token Bearer)

Todos los puntos de conexión requieren:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valida el token y devuelve el identificador del usuario.

### `POST /api/v1/skills`

Publica una nueva versión.

- Preferido: `multipart/form-data` con JSON `payload` + blobs `files[]`.
- También se acepta cuerpo JSON con `files` (basados en storageId).
- Campo de carga útil opcional: `ownerHandle`. Cuando está presente, la API resuelve ese
  publicador del lado del servidor y exige que el actor tenga acceso de publicador.
- Campo de carga útil opcional: `migrateOwner`. Cuando es `true` con `ownerHandle`, una
  skill existente puede moverse a ese propietario si el actor es administrador/propietario tanto en
  el publicador actual como en el de destino. Sin esta aceptación explícita, los cambios de propietario se
  rechazan.

### `POST /api/v1/packages`

Publica una versión code-plugin o bundle-plugin.

- Requiere autenticación con token Bearer.
- Requiere `multipart/form-data`.
- Los campos de formulario permitidos son `payload`, blobs `files` repetidos o una referencia de tarball
  `clawpack`. `clawpack` puede ser un blob `.tgz` o un id de almacenamiento devuelto por
  el flujo de upload-url. Las publicaciones preparadas con storage-id también deben incluir el
  `clawpackUploadTicket` devuelto con esa URL de carga.
- Usa `files` o `clawpack`, nunca ambos en la misma solicitud.
- Los cuerpos JSON y los metadatos `payload.files` / `payload.artifact`
  proporcionados por el llamador se rechazan.
- Las solicitudes de publicación multipart directa tienen un límite de 18 MB. Los tarballs ClawPack pueden
  usar el flujo de upload-url hasta el límite de tarball de 120 MB.
- Campo de carga útil opcional: `ownerHandle`. Cuando está presente, solo los administradores pueden publicar en nombre de ese propietario.

Aspectos destacados de validación:

- `family` debe ser `code-plugin` o `bundle-plugin`.
- Los paquetes de Plugin requieren `openclaw.plugin.json`. Las cargas `.tgz` de ClawPack deben
  contenerlo en `package/openclaw.plugin.json`.
- Los plugins de código requieren `package.json`, metadatos del repositorio de código fuente, metadatos del commit
  de código fuente, metadatos del esquema de configuración, `openclaw.compat.pluginApi` y
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` y `openclaw.environment` son metadatos opcionales.
- Solo el publicador de la organización `openclaw` y los publicadores personales de los miembros actuales de la organización `openclaw`
  pueden publicar en el canal `official`.
- Las publicaciones en nombre de otro usuario siguen validando la elegibilidad del canal oficial contra la cuenta propietaria de destino.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina de forma reversible / restaura una skill (propietario, moderador o administrador).

Cuerpo JSON opcional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Cuando está presente, `reason` se almacena como nota de moderación de la skill y se copia en el registro de auditoría.
Las eliminaciones reversibles iniciadas por el propietario reservan el slug durante 30 días; después, otro
publicador puede reclamarlo. La respuesta de eliminación incluye `slugReservedUntil` cuando aplica este vencimiento.
Las ocultaciones de moderador/administrador y las eliminaciones de seguridad no vencen de esta manera.

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

Solo administrador. Garantiza que exista un publicador de organización para un identificador. Si el identificador todavía apunta a un
publicador compartido heredado de usuario/personal, el punto de conexión lo migra primero a un publicador de organización.
Para una organización recién creada, proporciona `memberHandle`; el administrador actuante no se agrega como miembro.
`memberRole` tiene `owner` como valor predeterminado.

- Cuerpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Respuesta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Creación autenticada de publicador de organización de autoservicio. Crea un nuevo publicador de organización y agrega al
llamador como propietario. Este punto de conexión no migra identificadores existentes de usuario/personales y
no marca al publicador como confiable/oficial.

- Cuerpo: `{ "handle": "opik", "displayName": "Opik" }`
- Respuesta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Devuelve `409` cuando el identificador ya está usado por un publicador, usuario o publicador personal.

### `POST /api/v1/users/reserve`

Solo administrador. Reserva slugs raíz y nombres de paquete para un propietario legítimo sin publicar una
versión. Los nombres de paquete se convierten en paquetes marcadores de posición privados sin filas de versión, por lo que el mismo
propietario puede publicar después la versión code-plugin o bundle-plugin real en ese nombre.

- Cuerpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respuesta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Solo administrador. Recupera un publicador personal para un principal de GitHub OAuth de reemplazo verificado
sin editar filas de cuentas de Convex Auth. La solicitud debe nombrar ambos ids de cuenta inmutables del proveedor
GitHub; los identificadores mutables solo se usan como protección orientada al operador.

El endpoint usa dry-run de forma predeterminada. Aplicar la recuperación requiere `dryRun: false` y
`confirmIdentityVerified: true` después de que el personal verifique de forma independiente la continuidad entre ambos
principales de GitHub. La recuperación falla de forma cerrada cuando el publicador personal actual del usuario de destino
tiene Skills, paquetes o fuentes de Skills de GitHub.
La recuperación también migra los campos heredados `ownerUserId` para las Skills del publicador recuperado,
los alias de slug de Skill, los paquetes, las advertencias del inspector de paquetes y las filas derivadas de resumen de búsqueda para que
las rutas de propietario directo coincidan con la nueva autoridad del publicador. Una reserva activa de identificador protegido
para el identificador recuperado también se reasigna al usuario de reemplazo para que una sincronización posterior del perfil
no pueda restaurar la autoridad competidora del usuario anterior. Cada tabla primaria está limitada a
100 filas por transacción de aplicación; las recuperaciones más grandes deben usar primero una migración de propietario reanudable.
Las fuentes de Skills de GitHub tienen ámbito de publicador y se informan como comprobadas en lugar de reescribirse.

- Cuerpo: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Respuesta: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoints de gestión de slugs de propietario

- `POST /api/v1/skills/{slug}/rename`
  - Cuerpo: `{ "newSlug": "new-canonical-slug" }`
  - Respuesta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Cuerpo: `{ "targetSlug": "canonical-target-slug" }`
  - Respuesta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notas:

- Ambos endpoints requieren autenticación con token de API y solo funcionan para el propietario de la Skill.
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
  - Forma de respuesta: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bloquea a un usuario y elimina definitivamente sus Skills en propiedad (solo moderador/administrador).

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

Desbloquea a un usuario y restaura las Skills elegibles (solo administrador).

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
contenido (solo administrador). Usa dry-run de forma predeterminada salvo que `dryRun` sea `false`.

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

Lista o busca usuarios (solo administrador).

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

Agrega/elimina una estrella (destacados). Ambos endpoints son idempotentes.

Respuestas:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoints heredados de CLI (obsoletos)

Aún se admiten para versiones anteriores de la CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulta `DEPRECATIONS.md` para el plan de eliminación.

`POST /api/cli/upload-url` devuelve `uploadUrl` y `uploadTicket`. Las publicaciones de paquetes
que preparan un tarball ClawPack deben enviar el id de almacenamiento resultante como
`clawpack` y el ticket devuelto como `clawpackUploadTicket`.

## Descubrimiento del registro (`/.well-known/clawhub.json`)

La CLI puede descubrir la configuración de registro/autenticación desde el sitio:

- `/.well-known/clawhub.json` (JSON, preferido)
- `/.well-known/clawdhub.json` (heredado)

Esquema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Si lo alojas tú mismo, sirve este archivo (o configura `CLAWHUB_REGISTRY` explícitamente; heredado `CLAWDHUB_REGISTRY`).
