---
read_when:
    - Quieres extracción web respaldada por Firecrawl
    - Quieres Firecrawl web_fetch sin clave
    - Necesitas una clave de API de Firecrawl para la búsqueda o límites más altos
    - Quieres Firecrawl como proveedor de web_search
    - Quieres extracción antibot para web_fetch
summary: Búsqueda, extracción y respaldo web_fetch de Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-07-05T11:44:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw puede usar **Firecrawl** de tres formas:

- como proveedor de `web_search`
- como herramientas explícitas del Plugin: `firecrawl_search` y `firecrawl_scrape`
- como extractor de reserva para `web_fetch`

Es un servicio alojado de extracción/búsqueda que admite evasión de bots y almacenamiento en caché, lo que ayuda con sitios con mucho JS o páginas que bloquean las recuperaciones HTTP simples.

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch sin clave y claves de API

La reserva `web_fetch` alojada de Firecrawl seleccionada explícitamente admite acceso inicial sin una clave de API. Añade `FIRECRAWL_API_KEY` en el entorno del gateway o configúrala cuando necesites límites más altos. `web_search` de Firecrawl y `firecrawl_scrape` requieren una clave de API.

## Configurar la búsqueda de Firecrawl

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

- Elegir Firecrawl en la incorporación o `openclaw configure --section web` activa automáticamente el Plugin de Firecrawl instalado.
- `web_search` con Firecrawl admite `query` y `count`.
- Para controles específicos de Firecrawl como `sources`, `categories` o extracción de resultados, usa `firecrawl_search`.
- `baseUrl` usa de forma predeterminada Firecrawl alojado en `https://api.firecrawl.dev`. Las sobrescrituras autoalojadas solo se permiten para puntos de conexión privados/internos; HTTP solo se acepta para esos destinos privados.
- `FIRECRAWL_BASE_URL` es la reserva de entorno compartida para las URL base de búsqueda y extracción de Firecrawl.
- Las solicitudes de búsqueda de Firecrawl tienen un tiempo de espera predeterminado de 30 segundos; el parámetro `timeoutSeconds` de `firecrawl_search` lo sobrescribe por llamada.

## Configurar la reserva web_fetch de Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- La reserva `web_fetch` de Firecrawl seleccionada explícitamente funciona sin una clave de API. Cuando está configurada, OpenClaw envía `plugins.entries.firecrawl.config.webFetch.apiKey` o `FIRECRAWL_API_KEY` para límites más altos.
- Elegir Firecrawl durante la incorporación o `openclaw configure --section web` activa el Plugin y selecciona Firecrawl para `web_fetch`, salvo que ya haya otro proveedor de recuperación configurado.
- `firecrawl_scrape` requiere una clave de API.
- `maxAgeMs` controla la antigüedad permitida de los resultados en caché (ms). El valor predeterminado es 172,800,000 ms (2 días).
- `onlyMainContent` tiene como valor predeterminado `true`; `timeoutSeconds` tiene como valor predeterminado 60.
- La configuración heredada `tools.web.fetch.firecrawl.*` y `tools.web.search.firecrawl.*` se migra automáticamente mediante `openclaw doctor --fix`.
- Las sobrescrituras de URL base/extracción de Firecrawl siguen la misma regla alojado/privado que la búsqueda: el tráfico público alojado usa `https://api.firecrawl.dev`; las sobrescrituras autoalojadas deben resolverse a puntos de conexión privados/internos.
- `firecrawl_scrape` rechaza URL de destino obviamente privadas, loopback, de metadatos y que no sean HTTP(S) antes de reenviarlas a Firecrawl, en consonancia con el contrato de seguridad de destino de `web_fetch` para llamadas explícitas de extracción de Firecrawl.

`firecrawl_scrape` reutiliza la misma configuración y variables de entorno `plugins.entries.firecrawl.config.webFetch.*`, incluida su clave de API obligatoria.

### Firecrawl autoalojado

Configura `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` o `FIRECRAWL_BASE_URL` cuando ejecutes Firecrawl por tu cuenta. OpenClaw acepta `http://` solo para destinos loopback, de red privada, `.local`, `.internal` o `.localhost`. Los hosts personalizados públicos se rechazan para que las claves de API de Firecrawl no se envíen por accidente a puntos de conexión arbitrarios.

## Herramientas del Plugin de Firecrawl

### `firecrawl_search`

Usa esto cuando quieras controles de búsqueda específicos de Firecrawl en lugar de `web_search` genérico.

Parámetros:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Usa esto para páginas con mucho JS o protegidas contra bots donde `web_fetch` simple es débil.

Parámetros:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Sigilo / evasión de bots

`firecrawl_scrape` y la reserva de Firecrawl de `web_fetch` usan de forma predeterminada `proxy: "auto"` más `storeInCache: true`, salvo que el llamador sobrescriba esos parámetros. `firecrawl_search` y el proveedor de Firecrawl de `web_search` no tienen controles `proxy`/`storeInCache`; el modo de proxy sigiloso solo se aplica a solicitudes de extracción/recuperación.

El modo `proxy` de Firecrawl controla la evasión de bots (`basic`, `stealth` o `auto`). `auto` reintenta con proxies sigilosos si falla un intento básico, lo que puede usar más créditos que una extracción solo básica.

## Cómo `web_fetch` usa Firecrawl

Orden de extracción de `web_fetch`:

1. Readability (local)
2. Proveedor de recuperación configurado, como Firecrawl (cuando se selecciona o se detecta automáticamente a partir de credenciales configuradas)
3. Limpieza HTML básica (última reserva)

El control de selección es `tools.web.fetch.provider`. Si lo omites, OpenClaw detecta automáticamente el primer proveedor de web-fetch listo a partir de las credenciales disponibles. El Plugin oficial de Firecrawl proporciona esa reserva.

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y la detección automática
- [Web Fetch](/es/tools/web-fetch) -- herramienta web_fetch con reserva de Firecrawl
- [Tavily](/es/tools/tavily) -- herramientas de búsqueda + extracción
