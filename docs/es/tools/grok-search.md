---
read_when:
    - Quieres usar Grok para `web_search`
    - Necesitas un `XAI_API_KEY` para búsqueda web
summary: Búsqueda web de Grok mediante respuestas con conexión web de xAI
title: Búsqueda de Grok
x-i18n:
    generated_at: "2026-04-24T05:54:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

OpenClaw admite Grok como proveedor de `web_search`, usando respuestas con conexión web de xAI
para producir respuestas sintetizadas por IA respaldadas por resultados de búsqueda en vivo
con citas.

La misma `XAI_API_KEY` también puede alimentar la herramienta integrada `x_search` para búsqueda de publicaciones en X
(antes Twitter). Si almacenas la clave en
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw ahora la reutiliza como
respaldo también para el proveedor de modelos xAI incluido.

Para métricas de publicaciones concretas en X como reposts, respuestas, favoritos o visualizaciones, prefiere
`x_search` con la URL exacta de la publicación o el ID de estado en lugar de una
consulta de búsqueda amplia.

## Incorporación y configuración

Si eliges **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw puede mostrar un paso adicional separado para habilitar `x_search` con la misma
`XAI_API_KEY`. Ese paso adicional:

- solo aparece después de que elijas Grok para `web_search`
- no es una opción separada de proveedor de búsqueda web de nivel superior
- opcionalmente puede establecer el modelo `x_search` durante el mismo flujo

Si lo omites, puedes habilitar o cambiar `x_search` más adelante en la configuración.

## Obtener una clave API

<Steps>
  <Step title="Crear una clave">
    Obtén una clave API en [xAI](https://console.x.ai/).
  </Step>
  <Step title="Almacenar la clave">
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
            apiKey: "xai-...", // opcional si XAI_API_KEY está establecido
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

**Alternativa mediante entorno:** establece `XAI_API_KEY` en el entorno del Gateway.
Para una instalación de gateway, colócalo en `~/.openclaw/.env`.

## Cómo funciona

Grok usa respuestas con conexión web de xAI para sintetizar respuestas con citas en línea,
de forma similar al enfoque de grounding de Google Search en Gemini.

## Parámetros compatibles

La búsqueda de Grok admite `query`.

Se acepta `count` por compatibilidad con `web_search` compartido, pero Grok sigue
devolviendo una única respuesta sintetizada con citas en lugar de una lista de N resultados.

Actualmente no se admiten filtros específicos del proveedor.

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y autodetección
- [x_search en Web Search](/es/tools/web#x_search) -- búsqueda de X de primera clase mediante xAI
- [Búsqueda de Gemini](/es/tools/gemini-search) -- respuestas sintetizadas por IA mediante grounding de Google
