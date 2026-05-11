---
read_when:
    - Quieres usar Grok para web_search
    - Necesitas una XAI_API_KEY para la búsqueda web
summary: Búsqueda web de Grok mediante respuestas de xAI fundamentadas en la web
title: Búsqueda de Grok
x-i18n:
    generated_at: "2026-05-11T20:56:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw admite Grok como proveedor de `web_search`, usando respuestas de xAI con fundamentación web para producir respuestas sintetizadas por IA respaldadas por resultados de búsqueda en directo con citas.

La misma clave de API de xAI también puede impulsar la herramienta integrada `x_search` para la búsqueda de publicaciones en X (antes Twitter) y la herramienta `code_execution`. Si almacenas la clave en `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw ahora también la reutiliza como respaldo para el proveedor de modelos xAI incluido.

Para métricas de X a nivel de publicación, como republicaciones, respuestas, marcadores o visualizaciones, prefiere `x_search` con la URL exacta de la publicación o el ID de estado en lugar de una consulta de búsqueda amplia.

## Incorporación y configuración

Si eliges **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw puede mostrar un paso de seguimiento independiente para habilitar `x_search` con la misma `XAI_API_KEY`. Ese seguimiento:

- solo aparece después de elegir Grok para `web_search`
- no es una opción independiente de proveedor de búsqueda web de nivel superior
- opcionalmente puede establecer el modelo de `x_search` durante el mismo flujo

Si lo omites, puedes habilitar o cambiar `x_search` más tarde en la configuración.

## Obtener una clave de API

<Steps>
  <Step title="Crear una clave">
    Obtén una clave de API de [xAI](https://console.x.ai/).
  </Step>
  <Step title="Guardar la clave">
    Establece `XAI_API_KEY` en el entorno del Gateway, o configúrala mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuración

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternativa de entorno:** establece `XAI_API_KEY` en el entorno del Gateway.
Para una instalación de gateway, colócala en `~/.openclaw/.env`.

## Cómo funciona

Grok usa respuestas de xAI con fundamentación web para sintetizar respuestas con citas en línea, de forma similar al enfoque de fundamentación con Google Search de Gemini.

## Parámetros admitidos

La búsqueda de Grok admite `query`.

`count` se acepta por compatibilidad compartida con `web_search`, pero Grok sigue devolviendo una respuesta sintetizada con citas en lugar de una lista de N resultados.

Actualmente no se admiten filtros específicos del proveedor.

Grok usa un tiempo de espera predeterminado específico del proveedor de 60 segundos porque las búsquedas con fundamentación web de xAI Responses pueden tardar más que el valor predeterminado compartido de `web_search`. Establece `tools.web.search.timeoutSeconds` para sobrescribirlo.

## Sobrescrituras de URL base

Establece `plugins.entries.xai.config.webSearch.baseUrl` cuando la búsqueda web de Grok deba enrutarse a través de un proxy de operador o un endpoint de Responses compatible con xAI. OpenClaw envía solicitudes POST a `<baseUrl>/responses` después de recortar las barras diagonales finales. `x_search` usa el mismo respaldo de `webSearch.baseUrl` salvo que se establezca `plugins.entries.xai.config.xSearch.baseUrl`.

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [x_search en Web Search](/es/tools/web#x_search) -- búsqueda de X de primera clase mediante xAI
- [Búsqueda de Gemini](/es/tools/gemini-search) -- respuestas sintetizadas por IA mediante fundamentación de Google
