---
read_when:
    - Quieres usar Kimi para `web_search`
    - Necesitas una KIMI_API_KEY o MOONSHOT_API_KEY
summary: Búsqueda web de Kimi mediante la búsqueda web de Moonshot
title: Búsqueda de Kimi
x-i18n:
    generated_at: "2026-07-20T00:55:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 65e5f8c9f3b607dbcc3256c51a6a083864e31f65ed2a751d2d500abeb35ba844
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi es un proveedor de `web_search` respaldado por la búsqueda web nativa de Moonshot. Moonshot
sintetiza una única respuesta con citas integradas, de forma similar a los proveedores
de respuestas fundamentadas de Gemini y Grok, en lugar de devolver una lista ordenada de resultados.

## Configuración

<Steps>
  <Step title="Crear una clave">
    Obtenga una clave de API de [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Almacenar la clave">
    Establezca `KIMI_API_KEY` o `MOONSHOT_API_KEY` en el entorno del Gateway (para una
    instalación del Gateway, añádala a `~/.openclaw/.env`) o realice la configuración mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Al elegir **Kimi** durante `openclaw onboard` o `openclaw configure --section web`,
también se solicita:

- la región de la API de Moonshot: `https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`
- el modelo de búsqueda web (el valor predeterminado es `kimi-k2.6`)

## Configuración

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opcional si se establece KIMI_API_KEY o MOONSHOT_API_KEY
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
establézcalo explícitamente en `kimi` si hay varias credenciales de búsqueda configuradas.

Configure los valores específicos de Kimi `apiKey`, `baseUrl` y `model` en
`plugins.entries.moonshot.config.webSearch`.

Valores predeterminados: `baseUrl` usa `https://api.moonshot.ai/v1` cuando se omite; `model`
usa `kimi-k2.6`.

Si el tráfico de chat utiliza el host de China (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), la `web_search` de Kimi reutiliza automáticamente ese host
cuando su propio `baseUrl` no está establecido, para que las claves `.cn` no accedan por error al
endpoint internacional (que devuelve HTTP 401 para esas claves). Establezca un
`baseUrl` explícito de Kimi para anular esta herencia.

## Requisito de fundamentación

OpenClaw solo devuelve un resultado de `web_search` de Kimi después de que la respuesta de Moonshot
incluya evidencia nativa de fundamentación de búsqueda web, como una repetición de llamada a la herramienta
`$web_search`, `search_results` o URL de citas. Si Kimi responde directamente sin
fundamentación (por ejemplo, «No puedo navegar por Internet»), OpenClaw devuelve un
error `kimi_web_search_ungrounded` en lugar de tratar ese texto como un resultado de
búsqueda. Vuelva a intentar la consulta, cambie a un proveedor estructurado como Brave o utilice
`web_fetch` / la herramienta del navegador cuando ya disponga de una URL de destino.

## Parámetros de la herramienta

| Parámetro                                                       | Compatible                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | Sí                                                                                                                      |
| `count`                                                         | Se acepta por compatibilidad entre proveedores, pero se ignora: Kimi siempre devuelve una respuesta sintetizada, no una lista de N resultados |
| `country`, `language`, `freshness`, `date_after`, `date_before` | No                                                                                                                       |

## Relacionado

- [Descripción general de la búsqueda web](/es/tools/web) - todos los proveedores y la detección automática
- [Moonshot AI](/es/providers/moonshot) - documentación del modelo de Moonshot y del proveedor Kimi Coding
- [Búsqueda de Gemini](/es/tools/gemini-search) - respuestas sintetizadas por IA mediante la fundamentación de Google
- [Búsqueda de Grok](/es/tools/grok-search) - respuestas sintetizadas por IA mediante la fundamentación de xAI
