---
read_when:
    - Quieres extracción web respaldada por Firecrawl
    - Quieres `web_fetch` de Firecrawl sin clave
    - Necesitas una clave de API de Firecrawl para búsqueda o límites más altos
    - Quieres Firecrawl como proveedor de web_search
    - Quieres extracción anti-bot para web_fetch
summary: Búsqueda, extracción y respaldo web_fetch de Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T13:04:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw puede usar **Firecrawl** de tres maneras:

- como proveedor de `web_search`
- como herramientas explícitas de plugin: `firecrawl_search` y `firecrawl_scrape`
- como extractor de reserva para `web_fetch`

Es un servicio alojado de extracción/búsqueda que admite elusión de bots y almacenamiento en caché,
lo que ayuda con sitios con mucho JS o páginas que bloquean solicitudes HTTP simples.

## Instalar plugin

Instala el plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch sin clave y claves de API

La reserva alojada de Firecrawl para `web_fetch`, seleccionada explícitamente, admite acceso inicial
sin una clave de API. Agrega `FIRECRAWL_API_KEY` en el entorno del gateway
o configúralo cuando necesites límites más altos. `web_search` de Firecrawl y
`firecrawl_scrape` requieren una clave de API.

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

- Elegir Firecrawl en la incorporación o `openclaw configure --section web` habilita automáticamente el plugin de Firecrawl instalado.
- `web_search` con Firecrawl admite `query` y `count`.
- Para controles específicos de Firecrawl como `sources`, `categories` o extracción de resultados, usa `firecrawl_search`.
- `baseUrl` usa de forma predeterminada Firecrawl alojado en `https://api.firecrawl.dev`. Las sustituciones autoalojadas solo se permiten para endpoints privados/internos; HTTP solo se acepta para esos destinos privados.
- `FIRECRAWL_BASE_URL` es la reserva de entorno compartida para las URL base de búsqueda y extracción de Firecrawl.

## Configurar la reserva de Firecrawl para web_fetch

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

- La reserva de Firecrawl para `web_fetch`, seleccionada explícitamente, funciona sin una clave de API. Cuando está configurado, OpenClaw envía `plugins.entries.firecrawl.config.webFetch.apiKey` o `FIRECRAWL_API_KEY` para límites más altos.
- Elegir Firecrawl durante la incorporación o `openclaw configure --section web` habilita el plugin y selecciona Firecrawl para `web_fetch`, salvo que ya haya otro proveedor de obtención configurado.
- `firecrawl_scrape` requiere una clave de API.
- `maxAgeMs` controla la antigüedad permitida de los resultados almacenados en caché (ms). El valor predeterminado es 2 días.
- La configuración heredada `tools.web.fetch.firecrawl.*` se migra automáticamente mediante `openclaw doctor --fix`.
- Las sustituciones de URL base/extracción de Firecrawl siguen la misma regla alojada/privada que la búsqueda: el tráfico público alojado usa `https://api.firecrawl.dev`; las sustituciones autoalojadas deben resolverse a endpoints privados/internos.
- `firecrawl_scrape` rechaza URL de destino obviamente privadas, de loopback, de metadatos y que no sean HTTP(S) antes de reenviarlas a Firecrawl, de acuerdo con el contrato de seguridad de destino de `web_fetch` para llamadas explícitas de extracción con Firecrawl.

`firecrawl_scrape` reutiliza la misma configuración y variables de entorno `plugins.entries.firecrawl.config.webFetch.*`, incluida su clave de API obligatoria.

### Firecrawl autoalojado

Configura `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` o `FIRECRAWL_BASE_URL`
cuando ejecutes Firecrawl por tu cuenta. OpenClaw acepta `http://` solo para destinos de loopback,
red privada, `.local`, `.internal` o `.localhost`. Los hosts personalizados públicos
se rechazan para que las claves de API de Firecrawl no se envíen por accidente a endpoints arbitrarios.

## Herramientas del plugin de Firecrawl

### `firecrawl_search`

Usa esto cuando quieras controles de búsqueda específicos de Firecrawl en lugar de `web_search` genérico.

Parámetros principales:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Usa esto para páginas con mucho JS o protegidas contra bots donde `web_fetch` simple es débil.

Parámetros principales:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Sigilo / elusión de bots

Firecrawl expone un parámetro de **modo proxy** para la elusión de bots (`basic`, `stealth` o `auto`).
OpenClaw siempre usa `proxy: "auto"` junto con `storeInCache: true` para las solicitudes de Firecrawl.
Si se omite proxy, Firecrawl usa `auto` de forma predeterminada. `auto` reintenta con proxies sigilosos si falla un intento básico, lo que puede usar más créditos
que la extracción solo básica.

## Cómo `web_fetch` usa Firecrawl

Orden de extracción de `web_fetch`:

1. Readability (local)
2. Firecrawl (cuando se selecciona, o se detecta automáticamente a partir de credenciales configuradas)
3. Limpieza básica de HTML (última reserva)

El selector es `tools.web.fetch.provider`. Si lo omites, OpenClaw
detecta automáticamente el primer proveedor listo de obtención web a partir de las credenciales disponibles.
El plugin oficial de Firecrawl proporciona esa reserva.

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y la detección automática
- [Web Fetch](/es/tools/web-fetch) -- herramienta `web_fetch` con reserva de Firecrawl
- [Tavily](/es/tools/tavily) -- herramientas de búsqueda + extracción
