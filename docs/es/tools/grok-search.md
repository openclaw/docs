---
read_when:
    - Quieres usar Grok para `web_search`
    - Quieres usar OAuth de xAI o una XAI_API_KEY para búsquedas web
summary: Búsqueda web de Grok mediante respuestas de xAI fundamentadas en la web
title: Búsqueda con Grok
x-i18n:
    generated_at: "2026-07-11T23:38:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw admite Grok como proveedor de `web_search` y utiliza respuestas de xAI fundamentadas en la web para generar respuestas sintetizadas por IA, respaldadas por resultados de búsqueda en tiempo real con citas.

La búsqueda web de Grok prefiere un inicio de sesión OAuth de xAI existente cuando hay uno disponible. Si no existe ningún perfil OAuth, la misma clave de API de xAI también permite usar la herramienta integrada `x_search` para buscar publicaciones en X (antes Twitter) y la herramienta `code_execution`. Almacenar la clave en `plugins.entries.xai.config.webSearch.apiKey` también permite que OpenClaw la reutilice como alternativa para el proveedor de modelos xAI incluido.

Para obtener métricas de una publicación específica de X (republicaciones, respuestas, marcadores y visualizaciones), use [`x_search`](/es/tools/web#x_search) con la URL exacta de la publicación o el ID de estado, en lugar de una consulta de búsqueda amplia.

## Incorporación y configuración

Elegir **Grok** durante `openclaw onboard` o `openclaw configure --section
web` permite que OpenClaw reutilice un perfil OAuth de xAI existente sin solicitar una clave independiente para la búsqueda web. Sin OAuth, recurre a la configuración mediante una clave de API de xAI.

A continuación, OpenClaw ofrece un paso adicional para habilitar `x_search` con la misma credencial de xAI. Este paso adicional:

- solo aparece después de elegir Grok para `web_search`
- no es una opción independiente de proveedor de búsqueda web de nivel superior
- permite configurar opcionalmente el modelo de `x_search` en el mismo flujo

Omítalo para habilitar o cambiar `x_search` más adelante en la configuración.

## Iniciar sesión u obtener una clave de API

<Steps>
  <Step title="Usar OAuth de xAI">
    Si ya inició sesión en xAI durante la incorporación o la autenticación del modelo, elija Grok como proveedor de `web_search`. No se requiere una clave de API independiente:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Usar una clave de API como alternativa">
    Obtenga una clave de API de [xAI](https://console.x.ai/) cuando OAuth no esté disponible o si desea configurar intencionadamente la búsqueda web mediante una clave.
  </Step>
  <Step title="Almacenar la clave">
    Configure `XAI_API_KEY` en el entorno del Gateway o realice la configuración mediante:

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
            apiKey: "xai-...", // opcional si OAuth de xAI o XAI_API_KEY están disponibles
            baseUrl: "https://api.x.ai/v1", // sustitución opcional del proxy o la URL base de la API Responses
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
--method oauth`, `XAI_API_KEY` en el entorno del Gateway o `plugins.entries.xai.config.webSearch.apiKey`. Para una instalación del Gateway, coloque las variables de entorno en `~/.openclaw/.env`.

## Cómo funciona

Grok utiliza respuestas de xAI fundamentadas en la web para sintetizar respuestas con citas insertadas, de forma similar al enfoque de fundamentación con la Búsqueda de Google de Gemini.

## Parámetros compatibles

La búsqueda de Grok admite `query`. Se acepta `count` por compatibilidad con la interfaz compartida de `web_search`, pero Grok siempre devuelve una única respuesta sintetizada con citas, en lugar de una lista de N resultados. No se admiten filtros específicos del proveedor.

Grok utiliza de forma predeterminada un tiempo de espera de 60 segundos porque las búsquedas fundamentadas en la web mediante Responses de xAI pueden tardar más que el valor predeterminado compartido de `web_search`. Modifíquelo con `tools.web.search.timeoutSeconds`.

## Sustituciones de la URL base

Configure `plugins.entries.xai.config.webSearch.baseUrl` para dirigir la búsqueda web de Grok a través de un proxy del operador o un endpoint de Responses compatible con xAI. OpenClaw envía solicitudes a `<baseUrl>/responses` después de eliminar las barras diagonales finales. `x_search` recurre al mismo `webSearch.baseUrl`, salvo que se configure `plugins.entries.xai.config.xSearch.baseUrl`.

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [`x_search` en la búsqueda web](/es/tools/web#x_search) -- búsqueda nativa en X mediante xAI
- [Búsqueda de Gemini](/es/tools/gemini-search) -- respuestas sintetizadas por IA mediante la fundamentación de Google
