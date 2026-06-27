---
read_when:
    - Quiere un proveedor de búsqueda web que no requiera una clave de API
    - Quieres usar DuckDuckGo para web_search
    - Quieres un proveedor de búsqueda sin clave seleccionado explícitamente
summary: Búsqueda web de DuckDuckGo -- proveedor sin clave (experimental, basado en HTML)
title: Búsqueda de DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T13:03:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw admite DuckDuckGo como proveedor `web_search` **sin clave**. No se requiere
clave de API ni cuenta.

<Warning>
  DuckDuckGo es una integración **experimental y no oficial** que extrae resultados
  de las páginas de búsqueda sin JavaScript de DuckDuckGo, no de una API oficial. Puede haber
  fallos ocasionales por páginas de desafío antibot o cambios en el HTML.
</Warning>

## Configuración

No se necesita clave de API; solo configura DuckDuckGo como tu proveedor:

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Configuración

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Ajustes opcionales a nivel de Plugin para región y SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Parámetros de herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Resultados que devolver (1-10).
</ParamField>

<ParamField path="region" type="string">
Código de región de DuckDuckGo (por ejemplo, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Nivel de SafeSearch.
</ParamField>

La región y SafeSearch también se pueden establecer en la configuración del Plugin (ver arriba); los
parámetros de la herramienta anulan los valores de configuración por consulta.

## Notas

- **Sin clave de API**: funciona después de seleccionar DuckDuckGo como tu proveedor
  `web_search`
- **Experimental**: recopila resultados de las páginas de búsqueda HTML sin JavaScript
  de DuckDuckGo, no de una API o SDK oficial
- **Riesgo de desafío antibot**: DuckDuckGo puede mostrar CAPTCHA o bloquear solicitudes
  con uso intensivo o automatizado
- **Análisis de HTML**: los resultados dependen de la estructura de la página, que puede cambiar sin
  previo aviso
- **Selección explícita**: OpenClaw no elige DuckDuckGo automáticamente
  cuando no hay configurado un proveedor respaldado por API
- **SafeSearch usa moderate de forma predeterminada** cuando no está configurado

<Tip>
  Para uso en producción, considera [Brave Search](/es/tools/brave-search) (nivel gratuito
  disponible) u otro proveedor respaldado por API.
</Tip>

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con nivel gratuito
- [Exa Search](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
