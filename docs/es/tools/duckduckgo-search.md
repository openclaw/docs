---
read_when:
    - Quieres un proveedor de búsqueda web que no requiera clave de API
    - Quieres usar DuckDuckGo para web_search
    - Necesitas una alternativa de búsqueda sin configuración
summary: Búsqueda web de DuckDuckGo -- proveedor de respaldo sin clave (experimental, basado en HTML)
title: Búsqueda de DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T05:50:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw admite DuckDuckGo como proveedor `web_search` **sin clave**. No se requiere
clave de API ni cuenta.

<Warning>
  DuckDuckGo es una integración **experimental y no oficial** que obtiene resultados
  de las páginas de búsqueda sin JavaScript de DuckDuckGo, no de una API oficial. Espera
  fallos ocasionales por páginas de verificación de bots o cambios en el HTML.
</Warning>

## Configuración

No se necesita clave de API: solo configura DuckDuckGo como tu proveedor:

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

## Parámetros de la herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Resultados que se devolverán (1-10).
</ParamField>

<ParamField path="region" type="string">
Código de región de DuckDuckGo (p. ej., `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Nivel de SafeSearch.
</ParamField>

La región y SafeSearch también se pueden establecer en la configuración del Plugin (ver arriba); los
parámetros de la herramienta anulan los valores de configuración por consulta.

## Notas

- **Sin clave de API**: funciona de inmediato, sin configuración
- **Experimental**: recopila resultados de las páginas de búsqueda HTML sin JavaScript
  de DuckDuckGo, no de una API ni un SDK oficiales
- **Riesgo de verificación de bots**: DuckDuckGo puede mostrar CAPTCHA o bloquear solicitudes
  durante un uso intensivo o automatizado
- **Análisis de HTML**: los resultados dependen de la estructura de la página, que puede cambiar sin
  previo aviso
- **Orden de detección automática**: DuckDuckGo es la primera alternativa sin clave
  (orden 100) en la detección automática. Los proveedores respaldados por API con claves configuradas se ejecutan
  primero, luego Ollama Web Search (orden 110) y después SearXNG (orden 200)
- **SafeSearch usa moderate de forma predeterminada** cuando no está configurado

<Tip>
  Para uso en producción, considera [Brave Search](/es/tools/brave-search) (nivel gratuito
  disponible) u otro proveedor respaldado por API.
</Tip>

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con nivel gratuito
- [Exa Search](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
