---
read_when:
    - Quieres usar Kimi para `web_search`
    - Necesitas un `KIMI_API_KEY` o `MOONSHOT_API_KEY`
summary: Búsqueda web de Kimi a través de la búsqueda web de Moonshot
title: Búsqueda de Kimi
x-i18n:
    generated_at: "2026-04-21T05:19:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Búsqueda de Kimi

OpenClaw admite Kimi como proveedor `web_search`, usando la búsqueda web de Moonshot
para producir respuestas sintetizadas por IA con citas.

## Obtén una clave de API

<Steps>
  <Step title="Crea una clave">
    Obtén una clave de API de [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Guarda la clave">
    Configura `KIMI_API_KEY` o `MOONSHOT_API_KEY` en el entorno del Gateway, o
    configúralo mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Cuando eliges **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw también puede preguntarte por:

- la región de API de Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- el modelo predeterminado de búsqueda web de Kimi (predeterminado: `kimi-k2.6`)

## Configuración

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Si usas el host de API de China para chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw reutiliza ese mismo host para Kimi
`web_search` cuando se omite `tools.web.search.kimi.baseUrl`, para que las claves de
[platform.moonshot.cn](https://platform.moonshot.cn/) no lleguen al
endpoint internacional por error (lo que a menudo devuelve HTTP 401). Sobrescríbelo
con `tools.web.search.kimi.baseUrl` cuando necesites una URL base de búsqueda diferente.

**Alternativa con variables de entorno:** configura `KIMI_API_KEY` o `MOONSHOT_API_KEY` en el
entorno del Gateway. Para una instalación de gateway, colócalo en `~/.openclaw/.env`.

Si omites `baseUrl`, OpenClaw usa por defecto `https://api.moonshot.ai/v1`.
Si omites `model`, OpenClaw usa por defecto `kimi-k2.6`.

## Cómo funciona

Kimi usa la búsqueda web de Moonshot para sintetizar respuestas con citas en línea,
de forma similar al enfoque de respuestas fundamentadas de Gemini y Grok.

## Parámetros compatibles

La búsqueda de Kimi admite `query`.

Se acepta `count` por compatibilidad compartida con `web_search`, pero Kimi sigue
devolviendo una única respuesta sintetizada con citas en lugar de una lista de N resultados.

Actualmente no se admiten filtros específicos del proveedor.

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [Moonshot AI](/es/providers/moonshot) -- documentación del proveedor de modelos Moonshot + Kimi Coding
- [Gemini Search](/es/tools/gemini-search) -- respuestas sintetizadas por IA mediante grounding de Google
- [Grok Search](/es/tools/grok-search) -- respuestas sintetizadas por IA mediante grounding de xAI
