---
read_when:
    - Quieres obtener una URL y extraer contenido legible
    - Necesitas configurar `web_fetch` o su reserva con Firecrawl
    - Quieres entender los límites y el almacenamiento en caché de `web_fetch`
sidebarTitle: Web Fetch
summary: herramienta `web_fetch` -- obtención HTTP con extracción de contenido legible
title: Obtención web
x-i18n:
    generated_at: "2026-04-24T05:56:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

La herramienta `web_fetch` hace un GET HTTP simple y extrae contenido legible
(HTML a markdown o texto). **No** ejecuta JavaScript.

Para sitios con mucho JS o páginas protegidas por inicio de sesión, usa el
[Navegador web](/es/tools/browser) en su lugar.

## Inicio rápido

`web_fetch` está **habilitado por defecto**; no requiere configuración. El agente puede
llamarla inmediatamente:

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
Trunca la salida a este número de caracteres.
</ParamField>

## Cómo funciona

<Steps>
  <Step title="Obtener">
    Envía un GET HTTP con un User-Agent similar a Chrome y una cabecera `Accept-Language`.
    Bloquea nombres de host privados/internos y vuelve a comprobar redirecciones.
  </Step>
  <Step title="Extraer">
    Ejecuta Readability (extracción de contenido principal) sobre la respuesta HTML.
  </Step>
  <Step title="Reserva (opcional)">
    Si Readability falla y Firecrawl está configurado, reintenta a través de la
    API de Firecrawl con modo de evasión de bots.
  </Step>
  <Step title="Caché">
    Los resultados se almacenan en caché durante 15 minutos (configurable) para reducir
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
      },
    },
  },
}
```

## Reserva con Firecrawl

Si falla la extracción con Readability, `web_fetch` puede recurrir a
[Firecrawl](/es/tools/firecrawl) para evasión de bots y una mejor extracción:

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
  Si Firecrawl está habilitado y su SecretRef no se resuelve sin
  alternativa de entorno `FIRECRAWL_API_KEY`, el inicio del gateway falla rápidamente.
</Note>

<Note>
  Las anulaciones de `baseUrl` de Firecrawl están restringidas: deben usar `https://` y
  el host oficial de Firecrawl (`api.firecrawl.dev`).
</Note>

Comportamiento actual en tiempo de ejecución:

- `tools.web.fetch.provider` selecciona explícitamente el proveedor de reserva de obtención.
- Si se omite `provider`, OpenClaw detecta automáticamente el primer proveedor de `web_fetch`
  listo a partir de las credenciales disponibles. Hoy el proveedor incluido es Firecrawl.
- Si Readability está deshabilitado, `web_fetch` pasa directamente a la reserva del proveedor seleccionado. Si no hay ningún proveedor disponible, falla en modo cerrado.

## Límites y seguridad

- `maxChars` se ajusta a `tools.web.fetch.maxCharsCap`
- El cuerpo de respuesta está limitado por `maxResponseBytes` antes del análisis; las
  respuestas sobredimensionadas se truncan con una advertencia
- Los nombres de host privados/internos están bloqueados
- Las redirecciones se comprueban y se limitan mediante `maxRedirects`
- `web_fetch` es de mejor esfuerzo; algunos sitios necesitan el [Navegador web](/es/tools/browser)

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

- [Web Search](/es/tools/web) -- buscar en la web con varios proveedores
- [Navegador web](/es/tools/browser) -- automatización completa de navegador para sitios con mucho JS
- [Firecrawl](/es/tools/firecrawl) -- herramientas de búsqueda y scraping de Firecrawl
