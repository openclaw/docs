---
read_when:
    - Quieres obtener una URL y extraer contenido legible
    - Debe configurar web_fetch o su alternativa de respaldo de Firecrawl
    - Quieres comprender los límites y el almacenamiento en caché de web_fetch
sidebarTitle: Web Fetch
summary: herramienta web_fetch -- obtención HTTP con extracción de contenido legible
title: Obtención web
x-i18n:
    generated_at: "2026-05-04T02:26:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

La herramienta `web_fetch` hace un GET HTTP simple y extrae contenido legible
(HTML a markdown o texto). **No** ejecuta JavaScript.

Para sitios con mucho JS o páginas protegidas por inicio de sesión, usa el
[Navegador web](/es/tools/browser) en su lugar.

## Inicio rápido

`web_fetch` está **habilitada de forma predeterminada** -- no se necesita configuración. El agente puede
llamarla de inmediato:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parámetros de la herramienta

<ParamField path="url" type="string" required>
URL que se va a obtener. Solo `http(s)`.
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
    Envía un GET HTTP con un User-Agent similar a Chrome y el encabezado
    `Accept-Language`. Bloquea nombres de host privados/internos y vuelve a comprobar las redirecciones.
  </Step>
  <Step title="Extraer">
    Ejecuta Readability (extracción del contenido principal) sobre la respuesta HTML.
  </Step>
  <Step title="Alternativa (opcional)">
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
  Si Firecrawl está habilitado y su SecretRef no se resuelve sin alternativa de entorno
  `FIRECRAWL_API_KEY`, el inicio del Gateway falla rápidamente.
</Note>

<Note>
  Las sobrescrituras de `baseUrl` de Firecrawl están restringidas: el tráfico alojado usa
  `https://api.firecrawl.dev`; las sobrescrituras autoalojadas deben apuntar a endpoints privados o
  internos, y `http://` se acepta solo para esos destinos privados.
</Note>

Comportamiento actual en tiempo de ejecución:

- `tools.web.fetch.provider` selecciona explícitamente el proveedor alternativo de obtención.
- Si se omite `provider`, OpenClaw detecta automáticamente el primer proveedor listo para web-fetch
  a partir de las credenciales disponibles. `web_fetch` sin sandbox puede usar
  plugins instalados que declaren `contracts.webFetchProviders` y registren un
  proveedor coincidente en tiempo de ejecución. Actualmente, el proveedor incluido es Firecrawl.
- Las llamadas `web_fetch` con sandbox siguen limitadas a los proveedores incluidos.
- Si Readability está deshabilitado, `web_fetch` pasa directamente a la alternativa del
  proveedor seleccionado. Si no hay ningún proveedor disponible, falla de forma cerrada.

## Proxy de entorno de confianza

Si tu despliegue requiere que `web_fetch` pase por un proxy HTTP(S)
saliente de confianza, define `tools.web.fetch.useTrustedEnvProxy: true`.

En este modo, OpenClaw sigue aplicando comprobaciones SSRF basadas en nombres de host antes de enviar
la solicitud, pero permite que el proxy resuelva DNS en lugar de hacer fijación DNS
local. Habilítalo solo cuando el proxy esté controlado por el operador y aplique
la política saliente después de la resolución DNS.

<Note>
  Si no hay ninguna variable de entorno de proxy HTTP(S) configurada, o el host de destino está excluido por
  `NO_PROXY`, `web_fetch` vuelve a la ruta estricta normal con fijación DNS
  local.
</Note>

## Límites y seguridad

- `maxChars` se limita a `tools.web.fetch.maxCharsCap`
- El cuerpo de la respuesta se limita a `maxResponseBytes` antes del análisis; las respuestas
  demasiado grandes se truncan con una advertencia
- Se bloquean los nombres de host privados/internos
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` son habilitaciones específicas
  para pilas de proxy de IP falsa de confianza; déjalas sin definir a menos que tu proxy sea dueño de
  esos rangos sintéticos y aplique su propia política de destino
- Las redirecciones se comprueban y se limitan mediante `maxRedirects`
- `useTrustedEnvProxy` es una habilitación explícita y solo debería activarse para
  proxies controlados por el operador que sigan aplicando la política saliente después de la resolución
  DNS
- `web_fetch` es de esfuerzo razonable -- algunos sitios necesitan el [Navegador web](/es/tools/browser)

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

- [Búsqueda web](/es/tools/web) -- busca en la web con múltiples proveedores
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios con mucho JS
- [Firecrawl](/es/tools/firecrawl) -- herramientas de búsqueda y extracción de Firecrawl
