---
read_when:
    - Quieres un proveedor de búsqueda web que no requiera una clave de API
    - Quieres usar DuckDuckGo para web_search
    - Quieres un proveedor de búsqueda sin clave seleccionado explícitamente
summary: Búsqueda web de DuckDuckGo -- proveedor sin clave (experimental, basado en HTML)
title: Búsqueda de DuckDuckGo
x-i18n:
    generated_at: "2026-07-11T23:38:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw admite DuckDuckGo como proveedor de `web_search` **sin clave**. No se requiere una clave de API ni una cuenta.

<Warning>
  DuckDuckGo es una integración **experimental y no oficial** que extrae datos de las páginas de búsqueda HTML sin JavaScript de DuckDuckGo; no es una API oficial. Pueden producirse fallos ocasionales debido a páginas de comprobación contra bots o cambios en el HTML.
</Warning>

## Configuración

DuckDuckGo nunca se selecciona automáticamente, ya que la detección automática solo tiene en cuenta proveedores con credenciales utilizables. Selecciónelo explícitamente:

<Steps>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    # Seleccione "duckduckgo" como proveedor
    ```
  </Step>
</Steps>

## Configuración

Establezca el proveedor directamente en la configuración:

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

Configuración opcional a nivel de Plugin para la región y SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // Código de región de DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" u "off"
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
Número de resultados que se devolverán (1-10).
</ParamField>

<ParamField path="region" type="string">
Código de región de DuckDuckGo (p. ej., `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Nivel de SafeSearch.
</ParamField>

Los parámetros de herramienta `region` y `safeSearch` reemplazan los valores de configuración del Plugin indicados anteriormente para cada consulta.

## Notas

- **Sin clave de API**: funciona una vez que se selecciona DuckDuckGo como proveedor de `web_search`.
- **Experimental**: extrae datos de las páginas de búsqueda HTML sin JavaScript de DuckDuckGo; no es una API ni un SDK oficial. Los resultados dependen de la estructura de la página, que puede cambiar sin previo aviso.
- **Riesgo de comprobación contra bots**: DuckDuckGo puede mostrar CAPTCHA o bloquear solicitudes en caso de uso intensivo o automatizado.
- **Solo selección explícita**: la detección automática de OpenClaw solo tiene en cuenta proveedores con credenciales utilizables, por lo que un proveedor sin clave como DuckDuckGo nunca se elige automáticamente; debe establecer `provider: "duckduckgo"`.
- **El valor predeterminado de SafeSearch es `moderate`** cuando no se configura.

<Tip>
  Para uso en producción, considere [Brave Search](/es/tools/brave-search) (dispone de un nivel gratuito) u otro proveedor respaldado por una API.
</Tip>

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web): todos los proveedores y la detección automática
- [Brave Search](/es/tools/brave-search): resultados estructurados con un nivel gratuito
- [Exa Search](/es/tools/exa-search): búsqueda neuronal con extracción de contenido
