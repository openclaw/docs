---
read_when:
    - Quieres extracción web con tecnología de Firecrawl
    - Quieres usar `web_fetch` de Firecrawl sin clave
    - Necesitas una clave de API de Firecrawl para realizar búsquedas u obtener límites más altos.
    - Quieres usar Firecrawl como proveedor de web_search
    - Quieres extracción antibots para web_fetch
summary: Búsqueda y extracción con Firecrawl, y alternativa de web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-11T23:38:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw puede usar **Firecrawl** de tres maneras:

- como proveedor de `web_search`
- como herramientas explícitas del plugin: `firecrawl_search` y `firecrawl_scrape`
- como extractor de respaldo para `web_fetch`

Es un servicio alojado de extracción y búsqueda compatible con la elusión de bots y el almacenamiento en caché, lo que ayuda con sitios que dependen en gran medida de JS o páginas que bloquean las solicitudes HTTP simples.

## Instalar el plugin

Instala el plugin oficial y, a continuación, reinicia el Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch sin clave y claves de API

El respaldo alojado de Firecrawl para `web_fetch` seleccionado explícitamente admite acceso inicial sin una clave de API. Añade `FIRECRAWL_API_KEY` al entorno del Gateway o configúrala cuando necesites límites más altos. `web_search` y `firecrawl_scrape` de Firecrawl requieren una clave de API.

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

- Elegir Firecrawl durante la incorporación o en `openclaw configure --section web` habilita automáticamente el plugin de Firecrawl instalado.
- `web_search` con Firecrawl admite `query` y `count`.
- Para controles específicos de Firecrawl, como `sources`, `categories` o la extracción de resultados, usa `firecrawl_search`.
- El valor predeterminado de `baseUrl` es el servicio alojado de Firecrawl en `https://api.firecrawl.dev`. Solo se permiten valores personalizados autoalojados para puntos de conexión privados o internos; HTTP solo se admite para esos destinos privados.
- `FIRECRAWL_BASE_URL` es la variable de entorno de respaldo compartida para las URL base de búsqueda y extracción de Firecrawl.
- Las solicitudes de búsqueda de Firecrawl tienen un tiempo de espera predeterminado de 30 segundos; el parámetro `timeoutSeconds` de `firecrawl_search` lo sustituye en cada llamada.

## Configurar el respaldo de Firecrawl para web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // la selección explícita habilita el respaldo sin clave
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

- El respaldo de Firecrawl para `web_fetch` seleccionado explícitamente funciona sin una clave de API. Cuando está configurada, OpenClaw envía `plugins.entries.firecrawl.config.webFetch.apiKey` o `FIRECRAWL_API_KEY` para obtener límites más altos.
- Elegir Firecrawl durante la incorporación o en `openclaw configure --section web` habilita el plugin y selecciona Firecrawl para `web_fetch`, salvo que ya haya otro proveedor de obtención configurado.
- `firecrawl_scrape` requiere una clave de API.
- `maxAgeMs` controla la antigüedad máxima permitida de los resultados almacenados en caché (ms). El valor predeterminado es 172 800 000 ms (2 días).
- El valor predeterminado de `onlyMainContent` es `true`; el de `timeoutSeconds` es 60.
- La configuración heredada `tools.web.fetch.firecrawl.*` y `tools.web.search.firecrawl.*` se migra automáticamente mediante `openclaw doctor --fix`.
- Los valores personalizados de las URL de extracción y base de Firecrawl siguen la misma regla de alojamiento/privacidad que la búsqueda: el tráfico público alojado usa `https://api.firecrawl.dev`; los valores personalizados autoalojados deben resolverse en puntos de conexión privados o internos.
- `firecrawl_scrape` rechaza las URL de destino que sean claramente privadas, local loopback, de metadatos o que no sean HTTP(S) antes de reenviarlas a Firecrawl, de acuerdo con el contrato de seguridad de destinos de `web_fetch` para las llamadas explícitas de extracción de Firecrawl.

`firecrawl_scrape` reutiliza la misma configuración y las mismas variables de entorno de `plugins.entries.firecrawl.config.webFetch.*`, incluida su clave de API obligatoria.

### Firecrawl autoalojado

Configura `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` o `FIRECRAWL_BASE_URL` cuando ejecutes Firecrawl por tu cuenta. OpenClaw solo acepta `http://` para destinos local loopback, de redes privadas, `.local`, `.internal` o `.localhost`. Los hosts públicos personalizados se rechazan para evitar que las claves de API de Firecrawl se envíen accidentalmente a puntos de conexión arbitrarios.

## Herramientas del plugin de Firecrawl

### `firecrawl_search`

Úsala cuando quieras controles de búsqueda específicos de Firecrawl en lugar del `web_search` genérico.

Parámetros:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Úsala para páginas que dependen en gran medida de JS o están protegidas contra bots, para las que `web_fetch` simple resulta insuficiente.

Parámetros:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Modo sigiloso/elusión de bots

`firecrawl_scrape` y el respaldo de Firecrawl para `web_fetch` usan de manera predeterminada `proxy: "auto"` junto con `storeInCache: true`, salvo que quien realiza la llamada sustituya esos parámetros. `firecrawl_search` y el proveedor Firecrawl de `web_search` no tienen controles `proxy`/`storeInCache`; el modo de proxy sigiloso solo se aplica a las solicitudes de extracción y obtención.

El modo `proxy` de Firecrawl controla la elusión de bots (`basic`, `stealth` o `auto`). `auto` reintenta con proxies sigilosos si falla un intento básico, lo que puede consumir más créditos que una extracción limitada al modo básico.

## Cómo usa `web_fetch` Firecrawl

Orden de extracción de `web_fetch`:

1. Readability (local)
2. Proveedor de obtención configurado, como Firecrawl (cuando se selecciona o se detecta automáticamente a partir de las credenciales configuradas)
3. Limpieza básica de HTML (último recurso)

El control de selección es `tools.web.fetch.provider`. Si lo omites, OpenClaw detecta automáticamente el primer proveedor de obtención web disponible a partir de las credenciales existentes. El plugin oficial de Firecrawl proporciona ese respaldo.

## Temas relacionados

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Obtención web](/es/tools/web-fetch) -- herramienta `web_fetch` con respaldo de Firecrawl
- [Tavily](/es/tools/tavily) -- herramientas de búsqueda y extracción
