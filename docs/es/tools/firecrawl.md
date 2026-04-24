---
read_when:
    - Quieres extracción web respaldada por Firecrawl
    - Necesitas una clave de API de Firecrawl
    - Quieres Firecrawl como proveedor de `web_search`
    - Quieres extracción anti-bot para `web_fetch`
summary: Búsqueda y extracción con Firecrawl, y fallback `web_fetch`
title: Firecrawl
x-i18n:
    generated_at: "2026-04-24T05:55:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

OpenClaw puede usar **Firecrawl** de tres maneras:

- como proveedor de `web_search`
- como herramientas explícitas de Plugin: `firecrawl_search` y `firecrawl_scrape`
- como extractor de fallback para `web_fetch`

Es un servicio alojado de extracción/búsqueda que admite evasión de bots y caché,
lo que ayuda con sitios cargados de JS o páginas que bloquean las solicitudes HTTP simples.

## Obtener una clave de API

1. Crea una cuenta de Firecrawl y genera una clave de API.
2. Guárdala en la configuración o establece `FIRECRAWL_API_KEY` en el entorno del gateway.

## Configurar la búsqueda con Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Notas:

- Elegir Firecrawl durante la incorporación o con `openclaw configure --section web` habilita automáticamente el Plugin Firecrawl incluido.
- `web_search` con Firecrawl admite `query` y `count`.
- Para controles específicos de Firecrawl como `sources`, `categories` o extracción de resultados, usa `firecrawl_search`.
- Las sobrescrituras de `baseUrl` deben permanecer en `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` es el fallback compartido del entorno para las URL base de búsqueda y extracción de Firecrawl.

## Configurar extracción con Firecrawl + fallback de `web_fetch`

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Notas:

- Los intentos de fallback de Firecrawl solo se ejecutan cuando hay una clave de API disponible (`plugins.entries.firecrawl.config.webFetch.apiKey` o `FIRECRAWL_API_KEY`).
- `maxAgeMs` controla la antigüedad máxima permitida de los resultados en caché (ms). El valor predeterminado es 2 días.
- La configuración heredada `tools.web.fetch.firecrawl.*` se migra automáticamente con `openclaw doctor --fix`.
- Las sobrescrituras de la URL base de extracción/base de Firecrawl están restringidas a `https://api.firecrawl.dev`.

`firecrawl_scrape` reutiliza la misma configuración y variables de entorno de `plugins.entries.firecrawl.config.webFetch.*`.

## Herramientas del Plugin Firecrawl

### `firecrawl_search`

Úsala cuando quieras controles de búsqueda específicos de Firecrawl en lugar de `web_search` genérico.

Parámetros principales:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Úsala para páginas cargadas de JS o protegidas contra bots donde `web_fetch` simple sea débil.

Parámetros principales:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / evasión de bots

Firecrawl expone un parámetro de **modo proxy** para la evasión de bots (`basic`, `stealth` o `auto`).
OpenClaw siempre usa `proxy: "auto"` junto con `storeInCache: true` para las solicitudes Firecrawl.
Si se omite `proxy`, Firecrawl usa `auto` de forma predeterminada. `auto` reintenta con proxies stealth si falla un intento básico, lo que puede consumir más créditos
que una extracción solo con modo básico.

## Cómo usa `web_fetch` Firecrawl

Orden de extracción de `web_fetch`:

1. Readability (local)
2. Firecrawl (si está seleccionado o se detecta automáticamente como el fallback activo de web-fetch)
3. Limpieza básica de HTML (último fallback)

La opción de selección es `tools.web.fetch.provider`. Si la omites, OpenClaw
detecta automáticamente el primer proveedor de web-fetch listo a partir de las credenciales disponibles.
Hoy, el proveedor incluido es Firecrawl.

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y la detección automática
- [Web Fetch](/es/tools/web-fetch) -- herramienta `web_fetch` con fallback de Firecrawl
- [Tavily](/es/tools/tavily) -- herramientas de búsqueda + extracción
