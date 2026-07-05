---
read_when:
    - Quiere un proveedor de búsqueda web que no requiera clave de API
    - Quieres usar DuckDuckGo para web_search
    - Quieres un proveedor de búsqueda sin clave seleccionado explícitamente
summary: 'Búsqueda web de DuckDuckGo: proveedor sin clave (experimental, basado en HTML)'
title: Búsqueda de DuckDuckGo
x-i18n:
    generated_at: "2026-07-05T11:43:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw admite DuckDuckGo como proveedor `web_search` **sin clave**. No se requiere clave de API ni cuenta.

<Warning>
  DuckDuckGo es una integración **experimental y no oficial** que extrae datos de las páginas de búsqueda HTML sin JavaScript de DuckDuckGo, no de una API oficial. Puede romperse ocasionalmente por páginas de desafío antibot o cambios en el HTML.
</Warning>

## Configuración

DuckDuckGo nunca se selecciona automáticamente, ya que la detección automática solo considera proveedores con credenciales utilizables. Configúralo explícitamente:

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Configuración

Define el proveedor directamente en la configuración:

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

Configuraciones opcionales a nivel de Plugin para la región y SafeSearch:

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

## Parámetros de la herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Resultados que se devolverán (1-10).
</ParamField>

<ParamField path="region" type="string">
Código de región de DuckDuckGo (por ejemplo, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Nivel de SafeSearch.
</ParamField>

Los parámetros de herramienta `region` y `safeSearch` anulan los valores de configuración del Plugin anteriores por cada consulta.

## Notas

- **Sin clave de API** -- funciona una vez que DuckDuckGo se selecciona como proveedor `web_search`.
- **Experimental** -- extrae datos de las páginas de búsqueda HTML sin JavaScript de DuckDuckGo, no de una API ni SDK oficiales. Los resultados dependen de la estructura de la página, que puede cambiar sin aviso.
- **Riesgo de desafío antibot** -- DuckDuckGo puede mostrar CAPTCHA o bloquear solicitudes con un uso intensivo o automatizado.
- **Solo selección explícita** -- la detección automática de OpenClaw solo considera proveedores con credenciales utilizables, por lo que un proveedor sin clave como DuckDuckGo nunca se elige automáticamente; debes definir `provider: "duckduckgo"`.
- **SafeSearch usa `moderate` de forma predeterminada** cuando no se configura.

<Tip>
  Para uso en producción, considera [Brave Search](/es/tools/brave-search) (con nivel gratuito disponible) u otro proveedor respaldado por API.
</Tip>

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con nivel gratuito
- [Exa Search](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
