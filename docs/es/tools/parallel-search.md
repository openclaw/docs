---
read_when:
    - Quieres realizar búsquedas web sin una clave de API
    - Quieres la API de búsqueda de pago de Parallel
    - Quieres extractos densos clasificados por su eficiencia como contexto para LLM
summary: Búsqueda en paralelo -- extractos densos de fuentes web optimizados para LLM
title: Búsqueda paralela
x-i18n:
    generated_at: "2026-07-11T23:39:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

El Plugin Parallel proporciona dos proveedores de `web_search` de [Parallel](https://parallel.ai/), ambos con fragmentos clasificados y optimizados para LLM procedentes de un índice web creado para agentes de IA:

| Proveedor                  | id              | Autenticación                                                                                     |
| -------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| Parallel Search (gratuito) | `parallel-free` | Ninguna -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuito de Parallel |
| Parallel Search            | `parallel`      | `PARALLEL_API_KEY` -- API de búsqueda de pago, límites de frecuencia superiores y ajuste de objetivos |

Establece `tools.web.search.provider` en `parallel-free` o `parallel` para seleccionar uno explícitamente; ninguno se detecta automáticamente.

<Note>
  Los modelos directos de OpenAI Responses (`api: "openai-responses"`, proveedor
  `openai`, URL base oficial de la API) utilizan automáticamente la búsqueda
  web nativa alojada de OpenAI cuando `tools.web.search.provider` no está
  definido, está vacío o es `"auto"` o `"openai"`; por lo tanto, omiten
  Parallel de forma predeterminada. Establece `tools.web.search.provider` en
  `parallel-free` o `parallel` para dirigirlos a través de Parallel. Consulta
  la [descripción general de la búsqueda web](/es/tools/web).
</Note>

## Instalar el Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Clave de API (proveedor de pago)

`parallel-free` no necesita ninguna clave, pero aun así debe seleccionarse explícitamente. El proveedor de pago `parallel` necesita una clave de API:

<Steps>
  <Step title="Crear una cuenta">
    Regístrate en [platform.parallel.ai](https://platform.parallel.ai) y
    genera una clave de API desde tu panel.
  </Step>
  <Step title="Guardar la clave">
    Establece `PARALLEL_API_KEY` en el entorno del Gateway o configúrala mediante:

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
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // opcional si PARALLEL_API_KEY está definida
            baseUrl: "https://api.parallel.ai", // opcional; OpenClaw añade /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" para el Search MCP gratuito, o "parallel" para el
        // proveedor de pago respaldado por API que se muestra aquí.
        provider: "parallel",
      },
    },
  },
}
```

**Alternativa mediante el entorno:** establece `PARALLEL_API_KEY` en el entorno del Gateway. Para una instalación del Gateway, inclúyela en `~/.openclaw/.env`.

## Sustitución de la URL base

Se aplica únicamente al proveedor de pago `parallel`; `parallel-free` siempre utiliza `https://search.parallel.ai/mcp` e ignora esta opción.

Establece `plugins.entries.parallel.config.webSearch.baseUrl` para dirigir las solicitudes de pago a través de un proxy compatible o un endpoint alternativo (por ejemplo, Cloudflare AI Gateway). OpenClaw normaliza los hosts sin esquema anteponiendo `https://` y añade `/v1/search`, a menos que la ruta ya termine así. El endpoint resuelto forma parte de la clave de caché de búsqueda, por lo que los resultados de distintos endpoints nunca se comparten.

## Parámetros de la herramienta

Ambos proveedores exponen la estructura de búsqueda nativa de Parallel para que el modelo introduzca un objetivo en lenguaje natural junto con unas pocas consultas breves por palabras clave, la combinación que Parallel [recomienda](https://docs.parallel.ai/search/best-practices) para obtener los mejores resultados.

<ParamField path="objective" type="string" required>
Descripción en lenguaje natural de la pregunta o el objetivo subyacente (máximo de 5000 caracteres). Debe ser autosuficiente.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Consultas de búsqueda concisas por palabras clave, de 3 a 6 palabras cada una (de 1 a 5 entradas, con un máximo de 200 caracteres cada una). Proporciona de 2 a 3 consultas diversas para obtener los mejores resultados.
</ParamField>

<ParamField path="count" type="number">
Número de resultados que se devolverán (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Identificador opcional de sesión de Parallel procedente del `sessionId` de un resultado anterior. Transmítelo en las búsquedas posteriores de la misma tarea para que Parallel agrupe las llamadas relacionadas y mejore los resultados posteriores. Máximo de 1000 caracteres en `parallel`; el Search MCP gratuito `parallel-free` lo limita a 100. Los identificadores que superan el límite se descartan (de pago) o se genera uno nuevo (gratuito).
</ParamField>

<ParamField path="client_model" type="string">
Identificador opcional del modelo que realiza la llamada (por ejemplo, `claude-opus-4-7` o `gpt-5.6-sol`), con un máximo de 100 caracteres. Permite que Parallel adapte la configuración predeterminada a las capacidades de tu modelo. Transmite el identificador exacto del modelo activo; no lo acortes a un alias de familia.
</ParamField>

## Notas

- Parallel clasifica y comprime los resultados para facilitar el razonamiento de los LLM, no para que las personas hagan clic en ellos; se esperan fragmentos densos por resultado en lugar del contenido completo de la página.
- Los fragmentos de resultados se devuelven como el array `excerpts` y también se combinan en `description` para mantener la compatibilidad con el contrato genérico de `web_search`.
- Ambos proveedores devuelven un `session_id`; OpenClaw lo expone como `sessionId` en la carga útil de la herramienta para que los llamadores puedan agrupar las búsquedas posteriores. Un identificador de sesión generado por Parallel (uno que el llamador no proporcionó) se excluye de la entrada de caché, ya que las tareas no relacionadas con consultas idénticas no deben heredarlo.
- `searchId`, `warnings` y `usage` de Parallel se transmiten cuando están presentes.
- OpenClaw siempre envía a Parallel un número de resultados resuelto como `advanced_settings.max_results` (`parallel`) o aplica `count` en el cliente después de la respuesta de tamaño fijo de Parallel (`parallel-free`). El argumento `count` del llamador tiene prioridad, seguido de `tools.web.search.maxResults`; de lo contrario, se utiliza el valor predeterminado genérico de `web_search` de OpenClaw (5). El valor predeterminado de la propia API de Parallel es 10.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (`cacheTtlMinutes`).
- `parallel-free` genera un `session_id` nuevo para cada llamada mediante su negociación MCP cuando el llamador no proporciona uno; `parallel` lo deja sin definir en ese caso.

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Búsqueda con Exa](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
- [Búsqueda con Perplexity](/es/tools/perplexity-search) -- resultados estructurados con filtrado por dominio
