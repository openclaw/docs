---
read_when:
    - Quieres obtener una URL y extraer contenido legible
    - Debe configurar web_fetch o su mecanismo de reserva de Firecrawl
    - Quieres comprender los límites y el almacenamiento en caché de web_fetch
sidebarTitle: Web Fetch
summary: herramienta web_fetch -- obtención HTTP con extracción de contenido legible
title: Obtención web
x-i18n:
    generated_at: "2026-04-30T06:07:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

La herramienta `web_fetch` hace una solicitud HTTP GET simple y extrae contenido legible
(HTML a markdown o texto). **No** ejecuta JavaScript.

Para sitios con mucho JS o páginas protegidas por inicio de sesión, usa el
[Navegador web](/es/tools/browser) en su lugar.

## Inicio rápido

`web_fetch` está **habilitada por defecto** -- no se necesita configuración. El agente puede
llamarla inmediatamente:

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
  <Step title="Fetch">
    Envía una solicitud HTTP GET con un User-Agent similar a Chrome y un encabezado
    `Accept-Language`. Bloquea nombres de host privados/internos y vuelve a comprobar las redirecciones.
  </Step>
  <Step title="Extract">
    Ejecuta Readability (extracción del contenido principal) en la respuesta HTML.
  </Step>
  <Step title="Fallback (optional)">
    Si Readability falla y Firecrawl está configurado, reintenta mediante la
    API de Firecrawl con modo de elusión de bots.
  </Step>
  <Step title="Cache">
    Los resultados se almacenan en caché durante 15 minutos (configurable) para reducir las solicitudes
    repetidas a la misma URL.
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
[Firecrawl](/es/tools/firecrawl) para la elusión de bots y una mejor extracción:

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
La configuración heredada `tools.web.fetch.firecrawl.*` se migra automáticamente mediante `openclaw doctor --fix`.

<Note>
  Si Firecrawl está habilitado y su SecretRef no se resuelve sin respaldo de entorno
  `FIRECRAWL_API_KEY`, el inicio del Gateway falla rápido.
</Note>

<Note>
  Las sobrescrituras de `baseUrl` de Firecrawl están bloqueadas: deben usar `https://` y
  el host oficial de Firecrawl (`api.firecrawl.dev`).
</Note>

Comportamiento actual en tiempo de ejecución:

- `tools.web.fetch.provider` selecciona explícitamente el proveedor de fallback de obtención.
- Si se omite `provider`, OpenClaw detecta automáticamente el primer proveedor de web-fetch
  listo a partir de las credenciales disponibles. Actualmente, el proveedor incluido es Firecrawl.
- Si Readability está deshabilitado, `web_fetch` salta directamente al fallback del proveedor
  seleccionado. Si no hay ningún proveedor disponible, falla de forma cerrada.

## Límites y seguridad

- `maxChars` se limita a `tools.web.fetch.maxCharsCap`
- El cuerpo de la respuesta se limita a `maxResponseBytes` antes del análisis; las respuestas
  demasiado grandes se truncan con una advertencia
- Se bloquean los nombres de host privados/internos
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` son opt-ins restringidos
  para pilas de proxies de IP falsas de confianza; déjalos sin configurar a menos que tu proxy posea
  esos rangos sintéticos y aplique su propia política de destino
- Las redirecciones se comprueban y se limitan mediante `maxRedirects`
- `web_fetch` es de mejor esfuerzo -- algunos sitios necesitan el [Navegador web](/es/tools/browser)

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

- [Búsqueda web](/es/tools/web) -- busca en la web con varios proveedores
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios con mucho JS
- [Firecrawl](/es/tools/firecrawl) -- herramientas de búsqueda y extracción de Firecrawl
