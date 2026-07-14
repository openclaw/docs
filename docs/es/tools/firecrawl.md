---
read_when:
    - Se desea la extracción web mediante Firecrawl
    - Se desea Firecrawl Search sin clave (gratuito) o web_fetch sin clave
    - Necesita una clave de API de Firecrawl para realizar búsquedas u obtener límites más altos
    - Se desea usar Firecrawl como proveedor de web_search
    - Quieres extracción antibot para `web_fetch`
summary: Búsqueda y extracción con Firecrawl, y alternativa a web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-14T14:02:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw puede usar **Firecrawl** de tres maneras:

- como proveedor de `web_search`
- como herramientas explícitas del plugin: `firecrawl_search` y `firecrawl_scrape`
- como extractor alternativo para `web_fetch`

Es un servicio alojado de extracción y búsqueda que admite la evasión de bots y el almacenamiento en caché, lo que resulta útil con sitios que dependen mucho de JS o páginas que bloquean las solicitudes HTTP simples.

## Instalar el plugin

Instale el plugin oficial y, después, reinicie Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Acceso sin clave y claves de API

Firecrawl registra dos proveedores de `web_search`:

- **Firecrawl Search** (`firecrawl`) — usa la API alojada `/v2/search` con su
  clave; se detecta automáticamente cuando hay una clave disponible.
- **Firecrawl Search (Free)** (`firecrawl-free`) — usa el nivel inicial alojado sin
  clave; no requiere ninguna clave de API. Es **solo de activación voluntaria** y nunca se selecciona automáticamente, ya que
  seleccionarlo envía sus consultas de búsqueda al nivel gratuito de Firecrawl.

La alternativa de `web_fetch` de Firecrawl seleccionada explícitamente tampoco requiere clave. Las
herramientas explícitas `firecrawl_search` y `firecrawl_scrape` requieren una clave de API. Añada
`FIRECRAWL_API_KEY` al entorno de Gateway o configúrela para obtener límites más altos.

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

- Elegir Firecrawl durante la incorporación o en `openclaw configure --section web` activa automáticamente el plugin de Firecrawl instalado.
- Seleccione **Firecrawl Search (Free)** durante la incorporación (o establezca `provider: "firecrawl-free"`) para ejecutarlo sin clave de API. El proveedor con clave **Firecrawl Search** envía `plugins.entries.firecrawl.config.webSearch.apiKey` o `FIRECRAWL_API_KEY`.
- `web_search` con Firecrawl admite `query` y `count`.
- Para controles específicos de Firecrawl, como `sources`, `categories` o la extracción de resultados, use `firecrawl_search`.
- `baseUrl` usa de forma predeterminada Firecrawl alojado en `https://api.firecrawl.dev`. Solo se permiten sustituciones autohospedadas para endpoints privados o internos; HTTP se acepta únicamente para esos destinos privados.
- `FIRECRAWL_BASE_URL` es la variable de entorno alternativa compartida para las URL base de búsqueda y extracción de Firecrawl.
- Las solicitudes de búsqueda de Firecrawl tienen de forma predeterminada un tiempo de espera de 30 segundos; el parámetro `timeoutSeconds` de `firecrawl_search` lo sustituye en cada llamada.

## Configurar la alternativa de Firecrawl para web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // la selección explícita activa la alternativa sin clave
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

- La alternativa de `web_fetch` de Firecrawl seleccionada explícitamente funciona sin una clave de API. Cuando está configurada, OpenClaw envía `plugins.entries.firecrawl.config.webFetch.apiKey` o `FIRECRAWL_API_KEY` para obtener límites más altos.
- Elegir Firecrawl durante la incorporación o en `openclaw configure --section web` activa el plugin y selecciona Firecrawl para `web_fetch`, salvo que ya haya configurado otro proveedor de obtención.
- `firecrawl_scrape` requiere una clave de API.
- `maxAgeMs` controla la antigüedad máxima de los resultados almacenados en caché (ms). El valor predeterminado es 172,800,000 ms (2 días).
- `onlyMainContent` usa de forma predeterminada `true`; `timeoutSeconds` usa de forma predeterminada 60.
- La configuración heredada `tools.web.fetch.firecrawl.*` y `tools.web.search.firecrawl.*` se migra automáticamente mediante `openclaw doctor --fix`.
- Las sustituciones de las URL de extracción y base de Firecrawl siguen la misma regla de alojamiento y privacidad que la búsqueda: el tráfico alojado público usa `https://api.firecrawl.dev`; las sustituciones autohospedadas deben resolverse a endpoints privados o internos.
- `firecrawl_scrape` rechaza las URL de destino que sean claramente privadas, de bucle invertido, de metadatos o que no usen HTTP(S) antes de reenviarlas a Firecrawl, de acuerdo con el contrato de seguridad de destinos de `web_fetch` para llamadas explícitas de extracción de Firecrawl.

`firecrawl_scrape` reutiliza la misma configuración de `plugins.entries.firecrawl.config.webFetch.*` y las mismas variables de entorno, incluida su clave de API obligatoria.

### Firecrawl autohospedado

Establezca `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` o `FIRECRAWL_BASE_URL` cuando ejecute Firecrawl por su cuenta. OpenClaw solo acepta `http://` para destinos de bucle invertido, redes privadas, `.local`, `.internal` o `.localhost`. Los hosts públicos personalizados se rechazan para evitar que las claves de API de Firecrawl se envíen accidentalmente a endpoints arbitrarios.

## Herramientas del plugin de Firecrawl

### `firecrawl_search`

Use esta herramienta cuando necesite controles de búsqueda específicos de Firecrawl en lugar de `web_search` genérico. Requiere una clave de API.

Parámetros:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (solo nombres de host; mutuamente excluyentes)
- `tbs` (filtro temporal, por ejemplo, `qdr:d`, `qdr:w`, `sbd:1`)
- `location` y `country` (segmentación geográfica)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Use esta herramienta para páginas que dependen mucho de JS o están protegidas contra bots, donde `web_fetch` simple ofrece resultados deficientes.

Parámetros:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Modo sigiloso y evasión de bots

`firecrawl_scrape` y la alternativa de Firecrawl para `web_fetch` usan de forma predeterminada `proxy: "auto"` junto con `storeInCache: true`, salvo que el autor de la llamada sustituya esos parámetros. `firecrawl_search` y el proveedor de Firecrawl para `web_search` no tienen controles `proxy`/`storeInCache`; el modo de proxy sigiloso solo se aplica a las solicitudes de extracción y obtención.

El modo `proxy` de Firecrawl controla la evasión de bots (`basic`, `stealth` o `auto`). `auto` vuelve a intentarlo con proxies sigilosos si falla un intento básico, lo que puede consumir más créditos que la extracción exclusivamente básica.

## Cómo usa Firecrawl `web_fetch`

Orden de extracción de `web_fetch`:

1. Readability (local)
2. Proveedor de obtención configurado, como Firecrawl (cuando está seleccionado o se detecta automáticamente a partir de las credenciales configuradas)
3. Limpieza básica de HTML (última alternativa)

El selector es `tools.web.fetch.provider`. Si se omite, OpenClaw detecta automáticamente el primer proveedor de obtención web disponible a partir de las credenciales disponibles. El plugin oficial de Firecrawl proporciona esa alternativa.

## Contenido relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y la detección automática
- [Web Fetch](/es/tools/web-fetch) -- herramienta web_fetch con Firecrawl como alternativa
- [Tavily](/es/tools/tavily) -- herramientas de búsqueda y extracción
