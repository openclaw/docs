---
read_when:
    - Desea recuperar una URL y extraer contenido legible
    - Debes configurar web_fetch o su alternativa de Firecrawl
    - Quieres comprender los límites y el almacenamiento en caché de web_fetch
sidebarTitle: Web Fetch
summary: herramienta web_fetch -- recuperación HTTP con extracción de contenido legible
title: Obtención de la web
x-i18n:
    generated_at: "2026-05-02T05:38:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7826858c24ab090b348a43ed071e8fd904a5ccb929192e736ff7a3f082ed03b
    source_path: tools/web-fetch.md
    workflow: 16
---

La herramienta `web_fetch` realiza un HTTP GET simple y extrae contenido legible
(HTML a markdown o texto). **No** ejecuta JavaScript.

Para sitios con mucho JS o páginas protegidas por inicio de sesión, usa el
[Web Browser](/es/tools/browser) en su lugar.

## Inicio rápido

`web_fetch` está **activado de forma predeterminada**: no se necesita configuración. El agente puede
llamarlo de inmediato:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parámetros de la herramienta

<ParamField path="url" type="string" required>
URL que se va a obtener. Solo `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato de salida después de extraer el contenido principal.
</ParamField>

<ParamField path="maxChars" type="number">
Trunca la salida a esta cantidad de caracteres.
</ParamField>

## Cómo funciona

<Steps>
  <Step title="Obtener">
    Envía un HTTP GET con un User-Agent similar al de Chrome y un encabezado
    `Accept-Language`. Bloquea nombres de host privados/internos y vuelve a comprobar las redirecciones.
  </Step>
  <Step title="Extraer">
    Ejecuta Readability (extracción de contenido principal) en la respuesta HTML.
  </Step>
  <Step title="Alternativa (opcional)">
    Si Readability falla y Firecrawl está configurado, lo reintenta mediante la
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

## Alternativa de Firecrawl

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
  Si Firecrawl está activado y su SecretRef no se resuelve sin una alternativa de entorno
  `FIRECRAWL_API_KEY`, el inicio del Gateway falla rápidamente.
</Note>

<Note>
  Las sobrescrituras de `baseUrl` de Firecrawl están restringidas: deben usar `https://` y
  el host oficial de Firecrawl (`api.firecrawl.dev`).
</Note>

Comportamiento actual en tiempo de ejecución:

- `tools.web.fetch.provider` selecciona explícitamente el proveedor alternativo de obtención.
- Si se omite `provider`, OpenClaw detecta automáticamente el primer proveedor de web-fetch
  listo a partir de las credenciales disponibles. `web_fetch` no aislado puede usar
  plugins instalados que declaren `contracts.webFetchProviders` y registren un
  proveedor coincidente en tiempo de ejecución. Hoy, el proveedor incluido es Firecrawl.
- Las llamadas de `web_fetch` aisladas permanecen limitadas a los proveedores incluidos.
- Si Readability está desactivado, `web_fetch` pasa directamente a la alternativa del
  proveedor seleccionado. Si no hay ningún proveedor disponible, falla de forma cerrada.

## Límites y seguridad

- `maxChars` se limita a `tools.web.fetch.maxCharsCap`
- El cuerpo de la respuesta se limita a `maxResponseBytes` antes del análisis; las respuestas
  demasiado grandes se truncan con una advertencia
- Se bloquean los nombres de host privados/internos
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` son inclusiones opcionales limitadas
  para pilas de proxy de IP falsas de confianza; déjalas sin definir a menos que tu proxy sea propietario
  de esos rangos sintéticos y aplique su propia política de destino
- Las redirecciones se comprueban y se limitan mediante `maxRedirects`
- `web_fetch` funciona con el mejor esfuerzo: algunos sitios necesitan el [Web Browser](/es/tools/browser)

## Perfiles de herramientas

Si usas perfiles de herramientas o listas de permitidos, añade `web_fetch` o `group:web`:

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
