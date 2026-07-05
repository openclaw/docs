---
read_when:
    - Quieres obtener una URL y extraer contenido legible
    - Debes configurar web_fetch o su alternativa de respaldo Firecrawl
    - Quieres comprender los límites y el almacenamiento en caché de web_fetch
sidebarTitle: Web Fetch
summary: herramienta web_fetch -- obtención HTTP con extracción de contenido legible
title: Obtención web
x-i18n:
    generated_at: "2026-07-05T11:53:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` realiza un GET HTTP simple y extrae contenido legible (HTML a
markdown o texto). **No** ejecuta JavaScript. Para sitios con mucho JS o
páginas protegidas por inicio de sesión, usa el [Navegador web](/es/tools/browser).

## Inicio rápido

Habilitado de forma predeterminada, no se necesita configuración:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parámetros de la herramienta

<ParamField path="url" type="string" required>
URL que se va a recuperar. Solo `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato de salida después de la extracción del contenido principal.
</ParamField>

<ParamField path="maxChars" type="number">
Trunca la salida a esta cantidad de caracteres. Se limita a `tools.web.fetch.maxCharsCap`.
</ParamField>

## Cómo funciona

<Steps>
  <Step title="Fetch">
    Envía un GET HTTP con un User-Agent similar a Chrome y el encabezado
    `Accept-Language`. Bloquea nombres de host privados/internos y vuelve a
    comprobar las redirecciones.
  </Step>
  <Step title="Extract">
    Ejecuta Readability (extracción de contenido principal) en la respuesta HTML.
  </Step>
  <Step title="Fallback (optional)">
    Si Readability falla y hay un proveedor de recuperación disponible, reintenta a través
    de ese proveedor (por ejemplo, el modo de elusión de bots de Firecrawl).
  </Step>
  <Step title="Cache">
    Los resultados se almacenan en caché durante 15 minutos (configurable) para reducir
    recuperaciones repetidas de la misma URL.
  </Step>
</Steps>

## Actualizaciones de progreso

`web_fetch` emite una línea de progreso pública solo cuando la recuperación sigue pendiente
después de cinco segundos:

```text
Fetching page content...
```

Los aciertos rápidos de caché y las respuestas rápidas de red terminan antes de que se active
el temporizador, por lo que nunca muestran una línea de progreso. Cancelar la llamada borra el
temporizador. La línea de progreso es solo estado de la interfaz de usuario del canal y nunca
contiene contenido recuperado de la página.

## Configuración

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000, // default output chars; capped by maxCharsCap
        maxCharsCap: 20000, // hard cap for maxChars param
        maxResponseBytes: 750000, // max download size before truncation (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Fallback de Firecrawl

Si la extracción de Readability falla, `web_fetch` puede recurrir a
[Firecrawl](/es/tools/firecrawl) para eludir bots y obtener una mejor extracción:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // optional; omit for keyless starter access
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // cache duration (2 days)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` es opcional y admite objetos SecretRef.
La configuración heredada `tools.web.fetch.firecrawl.*` se migra automáticamente a
`plugins.entries.firecrawl.config.webFetch` mediante `openclaw doctor --fix`.

<Note>
  Si configuras un SecretRef de clave de API de Firecrawl y no se puede resolver sin una
  alternativa de entorno `FIRECRAWL_API_KEY`, el inicio del Gateway falla rápidamente.
</Note>

<Note>
  Las sobrescrituras de `baseUrl` de Firecrawl están restringidas: el tráfico alojado usa
  `https://api.firecrawl.dev`; las sobrescrituras autoalojadas deben apuntar a endpoints
  privados o internos, y `http://` se acepta solo para esos destinos privados.
</Note>

Comportamiento actual en tiempo de ejecución:

- `tools.web.fetch.provider` selecciona explícitamente el proveedor alternativo de recuperación.
- Si se omite `provider`, OpenClaw detecta automáticamente el primer proveedor de web-fetch
  listo a partir de las credenciales configuradas. `web_fetch` sin sandbox puede usar
  Plugins instalados que declaran `contracts.webFetchProviders` y registran un
  proveedor coincidente en tiempo de ejecución. El Plugin oficial de Firecrawl proporciona esta
  alternativa actualmente.
- Las llamadas `web_fetch` con sandbox permiten proveedores incluidos más proveedores instalados
  cuya procedencia oficial de npm o ClawHub está verificada. Actualmente eso permite el
  Plugin oficial de Firecrawl; los Plugins externos de recuperación de terceros permanecen excluidos.
- Si Readability está deshabilitado, `web_fetch` salta directamente a la alternativa del
  proveedor seleccionado. Si no hay ningún proveedor disponible, falla en modo cerrado.

## Proxy de entorno de confianza

Si tu despliegue requiere que `web_fetch` pase por un proxy HTTP(S) saliente
de confianza, establece `tools.web.fetch.useTrustedEnvProxy: true`.

En este modo, OpenClaw sigue aplicando comprobaciones SSRF basadas en nombres de host antes de enviar
la solicitud, pero permite que el proxy resuelva DNS en lugar de hacer anclaje de DNS
local. Habilita esto solo cuando el proxy esté controlado por el operador y aplique
la política saliente después de la resolución DNS.

<Note>
  Si no hay configurada ninguna variable de entorno de proxy HTTP(S), o el host de destino está excluido por
  `NO_PROXY`, `web_fetch` vuelve a la ruta estricta normal con anclaje de DNS
  local.
</Note>

## Límites y seguridad

- `maxChars` se limita a `tools.web.fetch.maxCharsCap` (predeterminado `20000`)
- El cuerpo de la respuesta se limita a `maxResponseBytes` (predeterminado `750000`, limitado a
  32000-10000000) antes del análisis; las respuestas sobredimensionadas se truncan con una advertencia
- Los nombres de host privados/internos se bloquean
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` son activaciones explícitas limitadas
  para pilas de proxy de IP falsas de confianza; déjalas sin definir salvo que tu proxy controle
  esos rangos sintéticos y aplique su propia política de destino
- Las redirecciones se comprueban y se limitan mediante `maxRedirects` (predeterminado `3`)
- `useTrustedEnvProxy` es una activación explícita y solo debe habilitarse para
  proxies controlados por el operador que sigan aplicando la política saliente después de la
  resolución DNS
- `web_fetch` es de mejor esfuerzo; algunos sitios necesitan el [Navegador web](/es/tools/browser)

## Perfiles de herramientas

Si usas perfiles de herramientas o listas de permitidos, agrega `web_fetch` o `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Relacionado

- [Búsqueda web](/es/tools/web) -- busca en la web con varios proveedores
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios con mucho JS
- [Firecrawl](/es/tools/firecrawl) -- herramientas de búsqueda y extracción de Firecrawl
