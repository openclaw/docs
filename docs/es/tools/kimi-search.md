---
read_when:
    - Quieres usar Kimi para web_search
    - Necesitas una KIMI_API_KEY o MOONSHOT_API_KEY
summary: Búsqueda web de Kimi mediante búsqueda web de Moonshot
title: Búsqueda de Kimi
x-i18n:
    generated_at: "2026-07-05T11:44:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi es un proveedor de `web_search` respaldado por la búsqueda web nativa de Moonshot. Moonshot
sintetiza una respuesta con citas en línea, de forma similar a los proveedores de
respuestas fundamentadas de Gemini y Grok, en lugar de devolver una lista clasificada de resultados.

## Configuración

<Steps>
  <Step title="Crear una clave">
    Obtén una clave de API de [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Guardar la clave">
    Define `KIMI_API_KEY` o `MOONSHOT_API_KEY` en el entorno del Gateway (para una
    instalación de gateway, agrégala a `~/.openclaw/.env`), o configúrala mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Elegir **Kimi** durante `openclaw onboard` o `openclaw configure --section web`
también solicita:

- la región de API de Moonshot: `https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`
- el modelo de búsqueda web (predeterminado: `kimi-k2.6`)

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

`tools.web.search.provider` se detecta automáticamente a partir de las claves de API disponibles cuando se omite;
defínelo explícitamente como `kimi` si hay varias credenciales de búsqueda configuradas.

La forma equivalente con ámbito bajo `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`)
también funciona; ambas estructuras se combinan en la misma configuración resuelta.

Valores predeterminados: `baseUrl` usa `https://api.moonshot.ai/v1` de forma predeterminada cuando se omite, y `model`
usa `kimi-k2.6` de forma predeterminada.

Si el tráfico de chat usa el host de China (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), Kimi `web_search` reutiliza ese host automáticamente
cuando su propio `baseUrl` no está definido, de modo que las claves `.cn` no llegan accidentalmente al
endpoint internacional (que devuelve HTTP 401 para esas claves). Define un
`baseUrl` explícito de Kimi para anular esta herencia.

## Requisito de fundamentación

OpenClaw solo devuelve un resultado de Kimi `web_search` después de que la respuesta de Moonshot
incluya evidencia de fundamentación de búsqueda web nativa, como una repetición de llamada a herramienta
`$web_search`, `search_results` o URLs de citas. Si Kimi responde directamente sin
fundamentación (por ejemplo, "No puedo navegar por internet"), OpenClaw devuelve un error
`kimi_web_search_ungrounded` en lugar de tratar ese texto como un resultado de búsqueda.
Vuelve a intentar la consulta, cambia a un proveedor estructurado como Brave o usa
`web_fetch` / la herramienta de navegador cuando ya tengas una URL de destino.

## Parámetros de la herramienta

| Parámetro                                                       | Compatible                                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | Sí                                                                                                                       |
| `count`                                                         | Se acepta por compatibilidad entre proveedores, pero se ignora: Kimi siempre devuelve una respuesta sintetizada, no una lista de N resultados |
| `country`, `language`, `freshness`, `date_after`, `date_before` | No                                                                                                                       |

## Relacionado

- [Resumen de Web Search](/es/tools/web) - todos los proveedores y detección automática
- [Moonshot AI](/es/providers/moonshot) - documentación del proveedor de modelos Moonshot + Kimi Coding
- [Búsqueda de Gemini](/es/tools/gemini-search) - respuestas sintetizadas por IA mediante fundamentación de Google
- [Búsqueda de Grok](/es/tools/grok-search) - respuestas sintetizadas por IA mediante fundamentación de xAI
