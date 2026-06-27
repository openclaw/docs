---
read_when:
    - Quieres usar la búsqueda web sin una clave de API
    - Quieres la API de búsqueda de pago de Parallel
    - Quieres extractos densos clasificados para la eficiencia del contexto del LLM
summary: Búsqueda paralela -- fragmentos densos optimizados para LLM de fuentes web
title: Búsqueda paralela
x-i18n:
    generated_at: "2026-06-27T13:07:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

El Plugin Parallel proporciona dos proveedores `web_search` de [Parallel](https://parallel.ai/):

- **Búsqueda de Parallel (gratis)** (`parallel-free`) -- el
  [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuito de Parallel. No requiere
  cuenta ni clave de API. Selecciónalo explícitamente cuando quieras la ruta de
  búsqueda alojada de Parallel sin clave.
- **Búsqueda de Parallel** (`parallel`) -- la API Search de pago de Parallel. Requiere una
  `PARALLEL_API_KEY` y ofrece límites de tasa más altos y ajuste de objetivos.

Ambos devuelven extractos clasificados y optimizados para LLM desde un índice web creado para agentes de IA.
Define `tools.web.search.provider` como `parallel-free` o `parallel` para elegir uno
explícitamente.

<Note>
  Los modelos OpenAI Responses usan la búsqueda web nativa de OpenAI cuando
  `tools.web.search.provider` no está definido, por lo que omiten los proveedores Parallel.
  Define `tools.web.search.provider` como `parallel-free` o `parallel` para enrutarlos
  a través de Parallel.
</Note>

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Clave de API (proveedor de pago)

`parallel-free` no requiere clave de API, pero aun así debe seleccionarse como
proveedor administrado. El proveedor de pago `parallel` necesita una clave de API:

<Steps>
  <Step title="Create an account">
    Regístrate en [platform.parallel.ai](https://platform.parallel.ai) y
    genera una clave de API desde tu panel.
  </Step>
  <Step title="Store the key">
    Define `PARALLEL_API_KEY` en el entorno de Gateway, o configúrala mediante:

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
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Alternativa de entorno:** define `PARALLEL_API_KEY` en el entorno de Gateway.
Para una instalación de gateway, colócala en `~/.openclaw/.env`.

## Anulación de URL base

La anulación de URL base se aplica solo al proveedor de pago `parallel`. El proveedor gratuito
`parallel-free` siempre usa `https://search.parallel.ai/mcp`.

Define `plugins.entries.parallel.config.webSearch.baseUrl` cuando las solicitudes de Parallel
deban pasar por un proxy compatible o un endpoint alternativo de Parallel (por
ejemplo, Cloudflare AI Gateway). OpenClaw normaliza hosts simples anteponiendo
`https://` y agrega `/v1/search` salvo que la ruta ya termine ahí. El endpoint resuelto se incluye en la clave de caché de búsqueda, por lo que los resultados
de distintos endpoints de Parallel no se comparten.

## Parámetros de la herramienta

OpenClaw expone la forma de búsqueda nativa de Parallel para que el modelo pueda completar tanto
el objetivo en lenguaje natural como algunas consultas breves de palabras clave — la combinación que
Parallel [recomienda](https://docs.parallel.ai/search/best-practices) para
obtener mejores resultados.

<ParamField path="objective" type="string" required>
Descripción en lenguaje natural de la pregunta u objetivo subyacente (máx. 5000
caracteres). Debe ser autónoma.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Consultas de búsqueda concisas con palabras clave, de 3 a 6 palabras cada una (1 a 5 entradas, máx. 200 caracteres
cada una). Proporciona 2 o 3 consultas diversas para obtener mejores resultados.
</ParamField>

<ParamField path="count" type="number">
Resultados que se devolverán (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Id. de sesión opcional de Parallel (máx. 1000 caracteres en `parallel`; el Search MCP gratuito
`parallel-free` lo limita a 100). Pasa el `sessionId` de un resultado anterior de
Parallel en búsquedas de seguimiento que formen parte de la misma tarea para que Parallel
pueda agrupar llamadas relacionadas y mejorar los resultados posteriores. Un id. que supere el límite se
descarta y se genera uno nuevo.
</ParamField>

<ParamField path="client_model" type="string">
Identificador opcional del modelo que realiza la llamada (p. ej., `claude-opus-4-7`,
`gpt-5.5`). Permite que Parallel ajuste la configuración predeterminada según las
capacidades de tu modelo. Pasa el slug exacto del modelo activo; no lo acortes a un
alias de familia.
</ParamField>

## Notas

- Parallel clasifica y comprime los resultados según su utilidad para el razonamiento de LLM, no
  según clics humanos; espera extractos densos en cada resultado en lugar de
  contenido de página completa
- Los extractos de resultados vuelven como el arreglo `excerpts` y también se unen en
  el campo `description` por compatibilidad con el contrato genérico `web_search`
- Parallel devuelve un `session_id` en cada respuesta; OpenClaw lo expone como
  `sessionId` en la carga útil de la herramienta para que los llamadores puedan agrupar búsquedas de seguimiento
- `searchId`, `warnings` y `usage` de Parallel se pasan tal cual cuando
  están presentes
- OpenClaw siempre reenvía a Parallel un conteo de resultados resuelto como
  `advanced_settings.max_results`. El argumento `count` del llamador tiene prioridad, luego la
  configuración de nivel superior `tools.web.search.maxResults`; de lo contrario, se usa el valor predeterminado
  genérico de OpenClaw para `web_search` (5). Esto mantiene constante el volumen de resultados
  al cambiar entre proveedores; Parallel por sí solo usa 10 de forma predeterminada
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (configurable mediante
  `cacheTtlMinutes`)
- El proveedor gratuito `parallel-free` acepta los mismos parámetros. Aplica
  `count` del lado del cliente y genera un `session_id` por llamada cuando no se
  proporciona uno.

## Relacionado

- [Descripción general de búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [Búsqueda Exa](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
- [Búsqueda Perplexity](/es/tools/perplexity-search) -- resultados estructurados con filtrado de dominios
