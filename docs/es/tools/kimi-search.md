---
read_when:
    - Quieres usar Kimi para web_search
    - Necesitas una KIMI_API_KEY o una MOONSHOT_API_KEY
summary: Búsqueda web de Kimi mediante la búsqueda web de Moonshot
title: Búsqueda de Kimi
x-i18n:
    generated_at: "2026-07-11T23:38:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi es un proveedor de `web_search` respaldado por la búsqueda web nativa de Moonshot. Moonshot
sintetiza una única respuesta con citas en línea, de forma similar a los proveedores
de respuestas fundamentadas de Gemini y Grok, en lugar de devolver una lista de resultados clasificados.

## Configuración inicial

<Steps>
  <Step title="Crear una clave">
    Obtén una clave de API de [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Guardar la clave">
    Establece `KIMI_API_KEY` o `MOONSHOT_API_KEY` en el entorno del Gateway (para una
    instalación del Gateway, añádela a `~/.openclaw/.env`) o configúrala mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Al elegir **Kimi** durante `openclaw onboard` o `openclaw configure --section web`,
también se solicitan:

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
establécelo explícitamente como `kimi` si hay varias credenciales de búsqueda configuradas.

También funciona la forma equivalente con ámbito en `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`);
ambas estructuras se combinan en la misma configuración resuelta.

Valores predeterminados: `baseUrl` usa `https://api.moonshot.ai/v1` cuando se omite y `model`
usa `kimi-k2.6`.

Si el tráfico de chat utiliza el host de China (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), `web_search` de Kimi reutiliza automáticamente ese host
cuando su propio `baseUrl` no está definido, para que las claves `.cn` no accedan accidentalmente al
endpoint internacional (que devuelve HTTP 401 para esas claves). Establece un
`baseUrl` explícito para Kimi a fin de anular esta herencia.

## Requisito de fundamentación

OpenClaw solo devuelve un resultado de `web_search` de Kimi después de que la respuesta de Moonshot
incluya pruebas de fundamentación de la búsqueda web nativa, como una reproducción de una llamada a la herramienta
`$web_search`, `search_results` o URL de citas. Si Kimi responde directamente sin
fundamentación (por ejemplo, «No puedo navegar por Internet»), OpenClaw devuelve un
error `kimi_web_search_ungrounded` en lugar de tratar ese texto como un resultado de búsqueda.
Vuelve a intentar la consulta, cambia a un proveedor estructurado como Brave o utiliza
`web_fetch` o la herramienta de navegador cuando ya tengas una URL de destino.

## Parámetros de la herramienta

| Parámetro                                                       | Compatibilidad                                                                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | Sí                                                                                                                                     |
| `count`                                                         | Se acepta por compatibilidad entre proveedores, pero se ignora: Kimi siempre devuelve una respuesta sintetizada, no una lista de N resultados |
| `country`, `language`, `freshness`, `date_after`, `date_before` | No                                                                                                                                     |

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) - todos los proveedores y la detección automática
- [Moonshot AI](/es/providers/moonshot) - documentación del modelo de Moonshot y del proveedor Kimi Coding
- [Búsqueda de Gemini](/es/tools/gemini-search) - respuestas sintetizadas por IA mediante la fundamentación de Google
- [Búsqueda de Grok](/es/tools/grok-search) - respuestas sintetizadas por IA mediante la fundamentación de xAI
