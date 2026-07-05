---
read_when:
    - Quieres búsqueda web sin una clave de API
    - Quieres la API de búsqueda paga de Parallel
    - Quieres extractos densos clasificados por eficiencia de contexto para LLM
summary: 'Búsqueda paralela: extractos densos optimizados para LLM de fuentes web'
title: Búsqueda paralela
x-i18n:
    generated_at: "2026-07-05T11:45:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3abb2b64499966ef1d1d8c905f17ae4845f09de62cfb23eeac535ecaeafde3b9
    source_path: tools/parallel-search.md
    workflow: 16
---

El Plugin Parallel proporciona dos proveedores `web_search` de [Parallel](https://parallel.ai/),
ambos devuelven extractos clasificados y optimizados para LLM desde un índice web
creado para agentes de IA:

| Proveedor              | id              | Autenticación                                                                                 |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| Parallel Search (Gratis) | `parallel-free` | Ninguna -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuito de Parallel |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- API de búsqueda de pago, límites de tasa más altos y ajuste de objetivos |

Establece `tools.web.search.provider` en `parallel-free` o `parallel` para
seleccionar uno explícitamente; ninguno se detecta automáticamente.

<Note>
  Los modelos directos de OpenAI Responses (`api: "openai-responses"`, proveedor
  `openai`, URL base oficial de la API) usan automáticamente la búsqueda web
  nativa alojada de OpenAI cuando `tools.web.search.provider` no está definido,
  está vacío, es `"auto"` o es `"openai"` -- por lo que omiten Parallel de forma
  predeterminada. Establece `tools.web.search.provider` en `parallel-free` o
  `parallel` para enrutarlos a través de Parallel en su lugar. Consulta la
  [descripción general de Web Search](/es/tools/web).
</Note>

## Instalar Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Clave de API (proveedor de pago)

`parallel-free` no necesita clave, pero aun así debe seleccionarse explícitamente.
El proveedor de pago `parallel` necesita una clave de API:

<Steps>
  <Step title="Crear una cuenta">
    Regístrate en [platform.parallel.ai](https://platform.parallel.ai) y
    genera una clave de API desde tu panel.
  </Step>
  <Step title="Almacenar la clave">
    Establece `PARALLEL_API_KEY` en el entorno del Gateway, o configúrala mediante:

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
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" for the free Search MCP, or "parallel" for the
        // paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Alternativa de entorno:** establece `PARALLEL_API_KEY` en el entorno del
Gateway. Para una instalación de gateway, colócala en `~/.openclaw/.env`.

## Anulación de URL base

Se aplica solo al proveedor de pago `parallel`; `parallel-free` siempre usa
`https://search.parallel.ai/mcp` e ignora esta configuración.

Establece `plugins.entries.parallel.config.webSearch.baseUrl` para enrutar las
solicitudes de pago a través de un proxy compatible o un endpoint alternativo
(por ejemplo, Cloudflare AI Gateway). OpenClaw normaliza los hosts sin esquema
anteponiendo `https://` y agrega `/v1/search` salvo que la ruta ya termine ahí.
El endpoint resuelto forma parte de la clave de caché de búsqueda, por lo que
los resultados de distintos endpoints nunca se comparten.

## Parámetros de herramienta

Ambos proveedores exponen la forma de búsqueda nativa de Parallel para que el
modelo complete un objetivo en lenguaje natural y algunas consultas cortas de
palabras clave -- la combinación que Parallel
[recomienda](https://docs.parallel.ai/search/best-practices) para obtener los
mejores resultados.

<ParamField path="objective" type="string" required>
Descripción en lenguaje natural de la pregunta u objetivo subyacente (máx. 5000
caracteres). Debe ser autocontenida.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Consultas de búsqueda concisas con palabras clave, de 3 a 6 palabras cada una
(de 1 a 5 entradas, máx. 200 caracteres cada una). Proporciona 2 o 3 consultas
diversas para obtener mejores resultados.
</ParamField>

<ParamField path="count" type="number">
Resultados que se devolverán (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Id. de sesión opcional de Parallel desde el `sessionId` de un resultado anterior.
Pásalo en búsquedas de seguimiento dentro de la misma tarea para que Parallel
agrupe las llamadas relacionadas y mejore los resultados posteriores. Máx. 1000
caracteres en `parallel`; el Search MCP gratuito `parallel-free` lo limita a
100. Un id. que supera el límite se descarta (pago) o se crea uno nuevo (gratis).
</ParamField>

<ParamField path="client_model" type="string">
Identificador opcional del modelo que realiza la llamada (p. ej.,
`claude-opus-4-7`, `gpt-5.5`), máx. 100 caracteres. Permite que Parallel ajuste
la configuración predeterminada a las capacidades de tu modelo. Pasa el slug
exacto del modelo activo; no lo acortes a un alias de familia.
</ParamField>

## Notas

- Parallel clasifica y comprime los resultados por su utilidad para el
  razonamiento de LLM, no para clics humanos; espera extractos densos por
  resultado en lugar de contenido de página completa.
- Los extractos de resultados vuelven como el arreglo `excerpts` y también se
  unen en `description` para compatibilidad con el contrato genérico
  `web_search`.
- Ambos proveedores devuelven un `session_id`; OpenClaw lo expone como
  `sessionId` en la carga útil de la herramienta para que los llamadores puedan
  agrupar búsquedas de seguimiento. Un id. de sesión generado por Parallel (uno
  que el llamador no proporcionó) se excluye de la entrada de caché, ya que las
  tareas no relacionadas con consultas idénticas no deberían heredarlo.
- `searchId`, `warnings` y `usage` de Parallel se transfieren cuando están
  presentes.
- OpenClaw siempre reenvía un recuento de resultados resuelto a Parallel como
  `advanced_settings.max_results` (`parallel`) o aplica `count` del lado del
  cliente después de la respuesta de tamaño fijo de Parallel (`parallel-free`).
  El argumento `count` del llamador tiene prioridad, luego
  `tools.web.search.maxResults`; de lo contrario, se usa el valor predeterminado
  genérico de `web_search` de OpenClaw (5) -- los valores predeterminados de la
  propia API de Parallel son 10.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada
  (`cacheTtlMinutes`).
- `parallel-free` crea un `session_id` nuevo por llamada mediante su negociación
  MCP cuando el llamador no proporciona uno; `parallel` lo deja sin definir en
  ese caso.

## Relacionado

- [descripción general de Web Search](/es/tools/web) -- todos los proveedores y la
  detección automática
- [búsqueda Exa](/es/tools/exa-search) -- búsqueda neuronal con extracción de
  contenido
- [Perplexity Search](/es/tools/perplexity-search) -- resultados estructurados con
  filtrado por dominio
