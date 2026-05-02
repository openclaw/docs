---
read_when:
    - Quieres usar Kimi para web_search
    - Necesitas una KIMI_API_KEY o una MOONSHOT_API_KEY
summary: Búsqueda web de Kimi mediante búsqueda web de Moonshot
title: Búsqueda de Kimi
x-i18n:
    generated_at: "2026-05-02T21:06:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw admite Kimi como proveedor de `web_search`, usando la búsqueda web de Moonshot
para producir respuestas sintetizadas por IA con citas.

## Obtener una clave de API

<Steps>
  <Step title="Crear una clave">
    Obtén una clave de API de [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Almacenar la clave">
    Define `KIMI_API_KEY` o `MOONSHOT_API_KEY` en el entorno del Gateway, o
    configúrala mediante:

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
- el modelo predeterminado de búsqueda web de Kimi (el valor predeterminado es `kimi-k2.6`)

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

Si usas el host de la API de China para chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw reutiliza ese mismo host para Kimi
`web_search` cuando se omite `tools.web.search.kimi.baseUrl`, de modo que las claves de
[platform.moonshot.cn](https://platform.moonshot.cn/) no lleguen al endpoint
internacional por error (que a menudo devuelve HTTP 401). Sobrescríbelo
con `tools.web.search.kimi.baseUrl` cuando necesites una URL base de búsqueda diferente.

**Alternativa de entorno:** define `KIMI_API_KEY` o `MOONSHOT_API_KEY` en el
entorno del Gateway. Para una instalación de gateway, ponla en `~/.openclaw/.env`.

Si omites `baseUrl`, OpenClaw usa de forma predeterminada `https://api.moonshot.ai/v1`.
Si omites `model`, OpenClaw usa de forma predeterminada `kimi-k2.6`.

## Cómo funciona

Kimi usa la búsqueda web de Moonshot para sintetizar respuestas con citas en línea,
de forma similar al enfoque de respuestas fundamentadas de Gemini y Grok.

OpenClaw considera que `web_search` de Kimi se ha realizado correctamente solo después de que Moonshot devuelva
evidencia nativa de fundamentación de búsqueda web, como una carga útil reproducible de la herramienta `$web_search`,
`search_results` o URL de citas. Si Kimi se detiene inmediatamente con una
respuesta de chat sin formato como "No puedo navegar por internet" y sin evidencia de fundamentación,
OpenClaw devuelve un error estructurado `kimi_web_search_ungrounded` en lugar de
envolver ese texto como resultado de búsqueda. Reintenta la consulta, cambia a un proveedor estructurado
como Brave, o usa `web_fetch` / la herramienta de navegador cuando ya
tengas una URL de destino.

## Parámetros admitidos

La búsqueda de Kimi admite `query`.

Se acepta `count` por compatibilidad con `web_search` compartido, pero Kimi aun así
devuelve una sola respuesta sintetizada con citas en lugar de una lista de N resultados.

Actualmente no se admiten filtros específicos del proveedor.

## Relacionado

- [Resumen de búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Moonshot AI](/es/providers/moonshot) -- documentación del modelo de Moonshot y del proveedor Kimi Coding
- [Búsqueda de Gemini](/es/tools/gemini-search) -- respuestas sintetizadas por IA mediante fundamentación de Google
- [Búsqueda de Grok](/es/tools/grok-search) -- respuestas sintetizadas por IA mediante fundamentación de xAI
