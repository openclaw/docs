---
read_when:
    - Quieres realizar búsquedas web sin una clave de API
    - Quieres la API de búsqueda de pago de Parallel
    - Quieres fragmentos densos clasificados según su eficiencia como contexto para LLMs
summary: Búsqueda paralela -- extractos densos optimizados para LLM provenientes de fuentes web
title: Búsqueda en paralelo
x-i18n:
    generated_at: "2026-07-12T14:53:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

El Plugin Parallel proporciona dos proveedores de `web_search` de [Parallel](https://parallel.ai/),
ambos devuelven extractos clasificados y optimizados para LLM de un índice web
creado para agentes de IA:

| Proveedor                  | id              | Autenticación                                                                                         |
| -------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| Parallel Search (gratuito) | `parallel-free` | Ninguna -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuito de Parallel    |
| Parallel Search            | `parallel`      | `PARALLEL_API_KEY` -- API de búsqueda de pago, mayores límites de solicitudes y ajuste de objetivos |

Establezca `tools.web.search.provider` en `parallel-free` o `parallel` para seleccionar
uno explícitamente; ninguno se detecta automáticamente.

<Note>
  Los modelos directos de OpenAI Responses (`api: "openai-responses"`, proveedor
  `openai`, URL base de la API oficial) usan automáticamente la búsqueda web nativa
  alojada de OpenAI cuando `tools.web.search.provider` no está definido, está vacío, es `"auto"`
  o `"openai"`; por lo tanto, omiten Parallel de forma predeterminada. Establezca
  `tools.web.search.provider` en `parallel-free` o `parallel` para dirigirlos
  mediante Parallel. Consulte la [descripción general de la búsqueda web](/es/tools/web).
</Note>

## Instalar el Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Clave de API (proveedor de pago)

`parallel-free` no necesita ninguna clave, pero aun así debe seleccionarse explícitamente. El proveedor
de pago `parallel` necesita una clave de API:

<Steps>
  <Step title="Crear una cuenta">
    Regístrese en [platform.parallel.ai](https://platform.parallel.ai) y
    genere una clave de API desde el panel.
  </Step>
  <Step title="Almacenar la clave">
    Establezca `PARALLEL_API_KEY` en el entorno del Gateway o configúrela mediante:

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
        // "parallel-free" para Search MCP gratuito, o "parallel" para el
        // proveedor respaldado por la API de pago que se muestra aquí.
        provider: "parallel",
      },
    },
  },
}
```

**Alternativa mediante variable de entorno:** establezca `PARALLEL_API_KEY` en el entorno
del Gateway. Para una instalación del Gateway, inclúyala en `~/.openclaw/.env`.

## Sustitución de la URL base

Se aplica únicamente al proveedor de pago `parallel`; `parallel-free` siempre usa
`https://search.parallel.ai/mcp` e ignora esta opción.

Establezca `plugins.entries.parallel.config.webSearch.baseUrl` para dirigir las solicitudes
de pago mediante un proxy compatible o un endpoint alternativo (por ejemplo, Cloudflare
AI Gateway). OpenClaw normaliza los hosts sin esquema anteponiendo
`https://` y añade `/v1/search`, salvo que la ruta ya termine así. El endpoint
resuelto forma parte de la clave de caché de búsqueda, por lo que nunca se comparten
resultados de endpoints diferentes.

## Parámetros de la herramienta

Ambos proveedores exponen la estructura de búsqueda nativa de Parallel para que el modelo introduzca
un objetivo en lenguaje natural junto con unas pocas consultas breves por palabras clave: la combinación
que Parallel [recomienda](https://docs.parallel.ai/search/best-practices) para
obtener los mejores resultados.

<ParamField path="objective" type="string" required>
Descripción en lenguaje natural de la pregunta o el objetivo subyacente (máximo de 5000
caracteres). Debe ser autosuficiente.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Consultas de búsqueda concisas por palabras clave, de 3-6 palabras cada una (1-5 entradas, máximo de 200
caracteres cada una). Proporcione 2-3 consultas variadas para obtener los mejores resultados.
</ParamField>

<ParamField path="count" type="number">
Resultados que se devolverán (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Id. de sesión opcional de Parallel procedente del `sessionId` de un resultado anterior. Transmítalo en
las búsquedas posteriores de la misma tarea para que Parallel agrupe las llamadas relacionadas y
mejore los resultados posteriores. Máximo de 1000 caracteres en `parallel`; el Search MCP
gratuito `parallel-free` lo limita a 100. Los id. que superen el límite se descartan
(de pago) o se genera uno nuevo (gratuito).
</ParamField>

<ParamField path="client_model" type="string">
Identificador opcional del modelo que realiza la llamada (p. ej., `claude-opus-4-7`,
`gpt-5.6-sol`), con un máximo de 100 caracteres. Permite que Parallel adapte la configuración predeterminada
a las capacidades del modelo. Transmita el slug exacto del modelo activo; no lo abrevie a un
alias de familia.
</ParamField>

## Notas

- Parallel clasifica y comprime los resultados para que sean útiles en el razonamiento de los LLM, no para
  que los humanos hagan clic en ellos; cabe esperar extractos densos por resultado en lugar del contenido
  de páginas completas.
- Los extractos de los resultados se devuelven como el array `excerpts` y también se concatenan en
  `description` para mantener la compatibilidad con el contrato genérico `web_search`.
- Ambos proveedores devuelven un `session_id`; OpenClaw lo expone como `sessionId` en
  la carga útil de la herramienta para que los invocadores puedan agrupar las búsquedas posteriores. Un id. de sesión
  generado por Parallel (uno que el invocador no proporcionó) se excluye de la entrada
  de caché, ya que las tareas no relacionadas con consultas idénticas no deberían
  heredarlo.
- Los valores `searchId`, `warnings` y `usage` de Parallel se transmiten cuando
  están presentes.
- OpenClaw siempre reenvía a Parallel un número de resultados resuelto como
  `advanced_settings.max_results` (`parallel`) o aplica `count`
  en el cliente después de la respuesta de tamaño fijo de Parallel (`parallel-free`). El argumento
  `count` del invocador tiene prioridad, seguido de `tools.web.search.maxResults`; de lo contrario,
  se usa el valor predeterminado genérico de `web_search` de OpenClaw (5), mientras que la API de Parallel
  tiene un valor predeterminado propio de 10.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (`cacheTtlMinutes`).
- `parallel-free` genera un `session_id` nuevo por llamada mediante su negociación de MCP
  cuando el invocador no proporciona uno; `parallel` lo deja sin definir en ese
  caso.

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Búsqueda con Exa](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
- [Búsqueda con Perplexity](/es/tools/perplexity-search) -- resultados estructurados con filtrado por dominio
