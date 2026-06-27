---
read_when:
    - Quieres usar Grok para web_search
    - Quieres usar OAuth de xAI o una XAI_API_KEY para la búsqueda web
summary: Búsqueda web de Grok mediante respuestas de xAI fundamentadas en la web
title: Búsqueda de Grok
x-i18n:
    generated_at: "2026-06-27T13:05:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw admite Grok como proveedor de `web_search`, usando respuestas de xAI fundamentadas en la web para producir respuestas sintetizadas por IA respaldadas por resultados de búsqueda en vivo con citas.

La búsqueda web de Grok prefiere tu inicio de sesión OAuth de xAI existente cuando hay uno disponible. Si no existe ningún perfil OAuth, la misma clave de API de xAI también puede alimentar la herramienta integrada `x_search` para buscar publicaciones de X (anteriormente Twitter) y la herramienta `code_execution`. Si almacenas la clave en `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw también la reutiliza como respaldo para el proveedor de modelos xAI incluido.

Para métricas de X a nivel de publicación, como republicaciones, respuestas, marcadores o visualizaciones, prefiere `x_search` con la URL exacta de la publicación o el ID de estado en lugar de una consulta de búsqueda amplia.

## Incorporación y configuración

Si eliges **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw puede usar un perfil OAuth de xAI existente sin pedir una clave separada para búsqueda web. Si OAuth no está disponible, recurre a la configuración con clave de API de xAI. OpenClaw también puede mostrar un paso de seguimiento separado para habilitar `x_search` con la misma credencial de xAI. Ese seguimiento:

- solo aparece después de elegir Grok para `web_search`
- no es una opción separada de proveedor de búsqueda web de nivel superior
- opcionalmente puede establecer el modelo de `x_search` durante el mismo flujo

Si lo omites, puedes habilitar o cambiar `x_search` más adelante en la configuración.

## Iniciar sesión u obtener una clave de API

<Steps>
  <Step title="Usar OAuth de xAI">
    Si ya iniciaste sesión con xAI durante la incorporación o la autenticación de modelos, elige Grok como proveedor de `web_search`. No se requiere una clave de API separada:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Usar un respaldo con clave de API">
    Obtén una clave de API de [xAI](https://console.x.ai/) cuando OAuth no esté disponible o cuando quieras intencionalmente una configuración de búsqueda web respaldada por clave.
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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**Alternativas de credenciales:** inicia sesión con `openclaw models auth login
--provider xai --method oauth`, establece `XAI_API_KEY` en el entorno del Gateway, o almacena `plugins.entries.xai.config.webSearch.apiKey`. Para una instalación de gateway, coloca las variables de entorno en `~/.openclaw/.env`.

## Cómo funciona

Grok usa respuestas de xAI fundamentadas en la web para sintetizar respuestas con citas en línea, de forma similar al enfoque de fundamentación con Google Search de Gemini.

## Parámetros admitidos

La búsqueda de Grok admite `query`.

`count` se acepta por compatibilidad compartida de `web_search`, pero Grok aún devuelve una respuesta sintetizada con citas en lugar de una lista de N resultados.

Actualmente no se admiten filtros específicos del proveedor.

Grok usa un tiempo de espera predeterminado específico del proveedor de 60 segundos porque las búsquedas fundamentadas en la web de xAI Responses pueden tardar más que el valor predeterminado compartido de `web_search`. Establece `tools.web.search.timeoutSeconds` para anularlo.

## Sobrescrituras de URL base

Establece `plugins.entries.xai.config.webSearch.baseUrl` cuando la búsqueda web de Grok deba enrutarse a través de un proxy del operador o un endpoint de Responses compatible con xAI. OpenClaw publica en `<baseUrl>/responses` después de recortar las barras finales. `x_search` usa el mismo respaldo de `webSearch.baseUrl` a menos que se establezca `plugins.entries.xai.config.xSearch.baseUrl`.

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [x_search en Web Search](/es/tools/web#x_search) -- búsqueda de X de primera clase mediante xAI
- [Gemini Search](/es/tools/gemini-search) -- respuestas sintetizadas por IA mediante fundamentación de Google
