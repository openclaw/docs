---
read_when:
    - Quieres un proveedor de búsqueda web que no requiera clave API
    - Quieres usar DuckDuckGo para `web_search`
    - Necesitas un respaldo de búsqueda sin configuración
summary: Búsqueda web de DuckDuckGo -- proveedor de respaldo sin clave (experimental, basado en HTML)
title: Búsqueda de DuckDuckGo
x-i18n:
    generated_at: "2026-04-24T05:53:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw admite DuckDuckGo como proveedor de `web_search` **sin clave**. No se
requiere clave API ni cuenta.

<Warning>
  DuckDuckGo es una integración **experimental y no oficial** que obtiene resultados
  de las páginas de búsqueda sin JavaScript de DuckDuckGo, no de una API oficial. Espera
  fallos ocasionales por páginas de desafío anti-bot o cambios en el HTML.
</Warning>

## Configuración

No se necesita clave API: solo establece DuckDuckGo como tu proveedor:

<Steps>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    # Selecciona "duckduckgo" como proveedor
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
            region: "us-en", // código de región de DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" o "off"
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
Resultados que se devolverán (1–10).
</ParamField>

<ParamField path="region" type="string">
Código de región de DuckDuckGo (por ejemplo `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Nivel de SafeSearch.
</ParamField>

La región y SafeSearch también pueden configurarse en la configuración del Plugin (ver arriba): los
parámetros de la herramienta sobrescriben los valores de configuración en cada consulta.

## Notas

- **Sin clave API** — funciona de inmediato, sin configuración
- **Experimental** — recopila resultados de las páginas HTML de búsqueda
  sin JavaScript de DuckDuckGo, no de una API o SDK oficial
- **Riesgo de desafío anti-bot** — DuckDuckGo puede servir CAPTCHAs o bloquear solicitudes
  bajo uso intensivo o automatizado
- **Análisis de HTML** — los resultados dependen de la estructura de la página, que puede cambiar sin
  previo aviso
- **Orden de detección automática** — DuckDuckGo es el primer respaldo sin clave
  (orden 100) en la detección automática. Los proveedores respaldados por API con claves configuradas se ejecutan
  primero, luego Ollama Web Search (orden 110) y después SearXNG (orden 200)
- **SafeSearch usa por defecto moderate** cuando no está configurado

<Tip>
  Para uso en producción, considera [Brave Search](/es/tools/brave-search) (con nivel gratuito
  disponible) u otro proveedor respaldado por API.
</Tip>

## Relacionado

- [Resumen de búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [Búsqueda de Brave](/es/tools/brave-search) -- resultados estructurados con nivel gratuito
- [Búsqueda Exa](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
