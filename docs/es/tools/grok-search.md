---
read_when:
    - Quieres usar Grok para web_search
    - Quieres usar xAI OAuth o una XAI_API_KEY para la búsqueda web
summary: Búsqueda web de Grok mediante respuestas fundamentadas en la web de xAI
title: Búsqueda de Grok
x-i18n:
    generated_at: "2026-07-05T11:44:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw admite Grok como proveedor de `web_search`, usando respuestas de xAI basadas en la web para producir respuestas sintetizadas por IA respaldadas por resultados de búsqueda en vivo con citas.

La búsqueda web de Grok prefiere un inicio de sesión OAuth de xAI existente cuando hay uno disponible. Si no existe ningún perfil OAuth, la misma clave de API de xAI también alimenta la herramienta integrada `x_search` para buscar publicaciones de X (antes Twitter) y la herramienta `code_execution`. Almacenar la clave en `plugins.entries.xai.config.webSearch.apiKey` también permite que OpenClaw la reutilice como alternativa para el proveedor de modelos xAI incluido.

Para métricas de X a nivel de publicación (republicaciones, respuestas, marcadores, visualizaciones), usa [`x_search`](/es/tools/web#x_search) con la URL exacta de la publicación o el ID de estado en lugar de una consulta de búsqueda amplia.

## Incorporación y configuración

Elegir **Grok** durante `openclaw onboard` o `openclaw configure --section
web` permite que OpenClaw reutilice un perfil OAuth de xAI existente sin solicitar una clave de búsqueda web independiente. Sin OAuth, recurre a la configuración con clave de API de xAI.

Luego OpenClaw ofrece un paso de seguimiento para habilitar `x_search` con la misma credencial de xAI. Ese paso de seguimiento:

- solo aparece después de elegir Grok para `web_search`
- no es una opción independiente de proveedor de búsqueda web de nivel superior
- puede establecer opcionalmente el modelo de `x_search` en el mismo flujo

Omítelo para habilitar o cambiar `x_search` más adelante en la configuración.

## Iniciar sesión u obtener una clave de API

<Steps>
  <Step title="Use xAI OAuth">
    Si ya iniciaste sesión con xAI durante la incorporación o la autenticación de modelos, elige Grok como proveedor de `web_search`. No se requiere una clave de API independiente:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use an API key fallback">
    Obtén una clave de API de [xAI](https://console.x.ai/) cuando OAuth no esté disponible o quieras intencionalmente una configuración de búsqueda web respaldada por clave.
  </Step>
  <Step title="Store the key">
    Define `XAI_API_KEY` en el entorno del Gateway, o configura mediante:

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

**Alternativas de credenciales:** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` en el entorno del Gateway, o `plugins.entries.xai.config.webSearch.apiKey`. Para una instalación de gateway, coloca las variables de entorno en `~/.openclaw/.env`.

## Cómo funciona

Grok usa respuestas de xAI basadas en la web para sintetizar respuestas con citas en línea, de forma similar al enfoque de fundamentación con Google Search de Gemini.

## Parámetros admitidos

La búsqueda de Grok admite `query`. `count` se acepta por compatibilidad compartida con `web_search`, pero Grok siempre devuelve una respuesta sintetizada con citas en lugar de una lista de N resultados. No se admiten filtros específicos del proveedor.

Grok usa de forma predeterminada un tiempo de espera de 60 segundos porque las búsquedas basadas en la web de xAI Responses pueden tardar más que el valor predeterminado compartido de `web_search`. Sobrescríbelo con `tools.web.search.timeoutSeconds`.

## Anulaciones de URL base

Define `plugins.entries.xai.config.webSearch.baseUrl` para enrutar la búsqueda web de Grok a través de un proxy del operador o un endpoint Responses compatible con xAI. OpenClaw publica en `<baseUrl>/responses` después de recortar las barras finales. `x_search` recurre al mismo `webSearch.baseUrl` salvo que `plugins.entries.xai.config.xSearch.baseUrl` esté definido.

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y la detección automática
- [x_search en Web Search](/es/tools/web#x_search) -- búsqueda de X de primera clase mediante xAI
- [Gemini Search](/es/tools/gemini-search) -- respuestas sintetizadas por IA mediante fundamentación de Google
