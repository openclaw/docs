---
read_when:
    - Quieres recuperar una URL y extraer contenido legible
    - Debe configurar web_fetch o su alternativa de respaldo Firecrawl
    - Quieres comprender los límites y el almacenamiento en caché de web_fetch
sidebarTitle: Web Fetch
summary: herramienta web_fetch -- recuperación HTTP con extracción de contenido legible
title: Obtención web
x-i18n:
    generated_at: "2026-05-02T21:07:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

La herramienta `web_fetch` realiza un HTTP GET simple y extrae contenido legible
(HTML a markdown o texto). **No** ejecuta JavaScript.

Para sitios con mucho JS o páginas protegidas por inicio de sesión, usa el
[Web Browser](/es/tools/browser) en su lugar.

## Inicio rápido

`web_fetch` está **habilitado de forma predeterminada**; no se necesita configuración. El agente puede
llamarla de inmediato:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parámetros de la herramienta

<ParamField path="url" type="string" required>
URL que se obtendrá. Solo `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato de salida después de la extracción del contenido principal.
</ParamField>

<ParamField path="maxChars" type="number">
Trunca la salida a esta cantidad de caracteres.
</ParamField>

## Cómo funciona

<Steps>
  <Step title="Obtener">
    Envía un HTTP GET con un User-Agent similar a Chrome y el encabezado
    `Accept-Language`. Bloquea nombres de host privados/internos y vuelve a comprobar las redirecciones.
  </Step>
  <Step title="Extraer">
    Ejecuta Readability (extracción de contenido principal) sobre la respuesta HTML.
  </Step>
  <Step title="Fallback (opcional)">
    Si Readability falla y Firecrawl está configurado, reintenta mediante la
    API de Firecrawl con modo de evasión de bots.
  </Step>
  <Step title="Caché">
    Los resultados se almacenan en caché durante 15 minutos (configurable) para reducir las
    obtenciones repetidas de la misma URL.
  </Step>
</Steps>

## Configuración

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
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
[Firecrawl](/es/tools/firecrawl) para la evasión de bots y una mejor extracción:

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
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` admite objetos SecretRef.
La configuración heredada `tools.web.fetch.firecrawl.*` se migra automáticamente con `openclaw doctor --fix`.

<Note>
  Si Firecrawl está habilitado y su SecretRef no se resuelve sin un fallback de entorno
  `FIRECRAWL_API_KEY`, el inicio del Gateway falla rápidamente.
</Note>

<Note>
  Las sobrescrituras de `baseUrl` de Firecrawl están restringidas: el tráfico alojado usa
  `https://api.firecrawl.dev`; las sobrescrituras autoalojadas deben apuntar a endpoints privados o
  internos, y `http://` se acepta solo para esos destinos privados.
</Note>

Comportamiento actual en tiempo de ejecución:

- `tools.web.fetch.provider` selecciona explícitamente el proveedor de fallback de obtención.
- Si se omite `provider`, OpenClaw detecta automáticamente el primer proveedor de web-fetch
  listo a partir de las credenciales disponibles. `web_fetch` sin sandbox puede usar
  plugins instalados que declaren `contracts.webFetchProviders` y registren un
  proveedor coincidente en tiempo de ejecución. Actualmente, el proveedor incluido es Firecrawl.
- Las llamadas a `web_fetch` en sandbox permanecen limitadas a los proveedores incluidos.
- Si Readability está deshabilitado, `web_fetch` pasa directamente al fallback del
  proveedor seleccionado. Si no hay ningún proveedor disponible, falla de forma cerrada.

## Límites y seguridad

- `maxChars` se limita a `tools.web.fetch.maxCharsCap`
- El cuerpo de la respuesta se limita a `maxResponseBytes` antes del análisis; las respuestas
  demasiado grandes se truncan con una advertencia
- Los nombres de host privados/internos se bloquean
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` son opt-ins restringidos
  para pilas de proxy de IP falsa de confianza; déjalos sin configurar salvo que tu proxy controle
  esos rangos sintéticos y aplique su propia política de destino
- Las redirecciones se comprueban y se limitan mediante `maxRedirects`
- `web_fetch` es de máximo esfuerzo; algunos sitios necesitan el [Web Browser](/es/tools/browser)

## Perfiles de herramientas

Si usas perfiles de herramientas o allowlists, añade `web_fetch` o `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Relacionado

- [Web Search](/es/tools/web): busca en la web con varios proveedores
- [Web Browser](/es/tools/browser): automatización completa del navegador para sitios con mucho JS
- [Firecrawl](/es/tools/firecrawl): herramientas de búsqueda y scraping de Firecrawl
