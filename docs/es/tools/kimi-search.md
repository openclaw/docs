---
read_when:
    - Quieres usar Kimi para `web_search`
    - Necesitas una `KIMI_API_KEY` o `MOONSHOT_API_KEY`
summary: Búsqueda web de Kimi mediante Moonshot web search
title: Búsqueda de Kimi
x-i18n:
    generated_at: "2026-04-24T05:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw admite Kimi como proveedor de `web_search`, usando Moonshot web search
para producir respuestas sintetizadas por IA con citas.

## Obtener una clave API

<Steps>
  <Step title="Crear una clave">
    Obtén una clave API de [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Guardar la clave">
    Establece `KIMI_API_KEY` o `MOONSHOT_API_KEY` en el entorno del Gateway, o
    configúralo mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Cuando eliges **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw también puede pedirte:

- la región de la API de Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- el modelo predeterminado de búsqueda web de Kimi (por defecto `kimi-k2.6`)

## Configuración

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opcional si KIMI_API_KEY o MOONSHOT_API_KEY está configurada
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

Si usas el host de la API de China para chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw reutiliza ese mismo host para Kimi
`web_search` cuando se omite `tools.web.search.kimi.baseUrl`, para que las claves de
[platform.moonshot.cn](https://platform.moonshot.cn/) no lleguen al
endpoint internacional por error (que a menudo devuelve HTTP 401). Sobrescríbelo
con `tools.web.search.kimi.baseUrl` cuando necesites una URL base de búsqueda distinta.

**Alternativa de entorno:** establece `KIMI_API_KEY` o `MOONSHOT_API_KEY` en el
entorno del Gateway. Para una instalación de gateway, colócala en `~/.openclaw/.env`.

Si omites `baseUrl`, OpenClaw usa por defecto `https://api.moonshot.ai/v1`.
Si omites `model`, OpenClaw usa por defecto `kimi-k2.6`.

## Cómo funciona

Kimi usa Moonshot web search para sintetizar respuestas con citas en línea,
similar al enfoque de respuestas fundamentadas de Gemini y Grok.

## Parámetros admitidos

La búsqueda de Kimi admite `query`.

Se acepta `count` para compatibilidad compartida con `web_search`, pero Kimi sigue
devolviendo una respuesta sintetizada con citas en lugar de una lista de N resultados.

Actualmente no se admiten filtros específicos del proveedor.

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [Moonshot AI](/es/providers/moonshot) -- documentación del proveedor de modelos Moonshot + Kimi Coding
- [Gemini Search](/es/tools/gemini-search) -- respuestas sintetizadas por IA mediante grounding de Google
- [Grok Search](/es/tools/grok-search) -- respuestas sintetizadas por IA mediante grounding de xAI
