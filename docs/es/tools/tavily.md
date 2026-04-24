---
read_when:
    - Quieres búsqueda web respaldada por Tavily
    - Necesitas una clave de API de Tavily
    - Quieres Tavily como proveedor de `web_search`
    - Quieres extracción de contenido desde URL
summary: Herramientas de búsqueda y extracción de Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-24T05:56:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 15
---

OpenClaw puede usar **Tavily** de dos formas:

- como proveedor de `web_search`
- como herramientas explícitas del plugin: `tavily_search` y `tavily_extract`

Tavily es una API de búsqueda diseñada para aplicaciones de IA que devuelve resultados estructurados
optimizados para el consumo por parte de LLM. Admite profundidad de búsqueda configurable, filtrado
por tema, filtros de dominio, resúmenes de respuestas generados por IA y extracción de contenido
desde URL (incluidas páginas renderizadas con JavaScript).

## Obtener una clave de API

1. Crea una cuenta de Tavily en [tavily.com](https://tavily.com/).
2. Genera una clave de API en el panel.
3. Guárdala en la configuración o establece `TAVILY_API_KEY` en el entorno del gateway.

## Configurar la búsqueda con Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Notas:

- Elegir Tavily durante la incorporación o con `openclaw configure --section web` habilita
  automáticamente el plugin integrado de Tavily.
- Guarda la configuración de Tavily en `plugins.entries.tavily.config.webSearch.*`.
- `web_search` con Tavily admite `query` y `count` (hasta 20 resultados).
- Para controles específicos de Tavily como `search_depth`, `topic`, `include_answer`
  o filtros de dominio, usa `tavily_search`.

## Herramientas del plugin de Tavily

### `tavily_search`

Usa esto cuando quieras controles de búsqueda específicos de Tavily en lugar de
`web_search` genérico.

| Parámetro         | Descripción                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `query`           | Cadena de consulta de búsqueda (mantenla por debajo de 400 caracteres) |
| `search_depth`    | `basic` (predeterminado, equilibrado) o `advanced` (máxima relevancia, más lento) |
| `topic`           | `general` (predeterminado), `news` (actualizaciones en tiempo real) o `finance` |
| `max_results`     | Número de resultados, 1-20 (predeterminado: 5)                       |
| `include_answer`  | Incluir un resumen de respuesta generado por IA (predeterminado: false) |
| `time_range`      | Filtrar por antigüedad: `day`, `week`, `month` o `year`              |
| `include_domains` | Array de dominios a los que restringir los resultados                |
| `exclude_domains` | Array de dominios a excluir de los resultados                        |

**Profundidad de búsqueda:**

| Profundidad | Velocidad | Relevancia | Ideal para                            |
| ----------- | --------- | ---------- | ------------------------------------- |
| `basic`     | Más rápida | Alta      | Consultas de uso general (predeterminado) |
| `advanced`  | Más lenta | Máxima     | Precisión, hechos específicos, investigación |

### `tavily_extract`

Usa esto para extraer contenido limpio de una o varias URL. Gestiona
páginas renderizadas con JavaScript y admite división en fragmentos orientada a consultas para
una extracción dirigida.

| Parámetro           | Descripción                                                |
| ------------------- | ---------------------------------------------------------- |
| `urls`              | Array de URL que se van a extraer (1-20 por solicitud)     |
| `query`             | Reordena los fragmentos extraídos por relevancia para esta consulta |
| `extract_depth`     | `basic` (predeterminado, rápido) o `advanced` (para páginas con mucho JS) |
| `chunks_per_source` | Fragmentos por URL, 1-5 (requiere `query`)                 |
| `include_images`    | Incluir URL de imágenes en los resultados (predeterminado: false) |

**Profundidad de extracción:**

| Profundidad | Cuándo usarla                                  |
| ----------- | ---------------------------------------------- |
| `basic`     | Páginas simples: pruébala primero              |
| `advanced`  | SPA renderizadas con JS, contenido dinámico, tablas |

Consejos:

- Máximo 20 URL por solicitud. Divide listas más grandes en varias llamadas.
- Usa `query` + `chunks_per_source` para obtener solo el contenido relevante en lugar de páginas completas.
- Prueba primero `basic`; recurre a `advanced` si el contenido falta o está incompleto.

## Elegir la herramienta adecuada

| Necesidad                               | Herramienta       |
| --------------------------------------- | ----------------- |
| Búsqueda web rápida, sin opciones especiales | `web_search`  |
| Búsqueda con profundidad, tema, respuestas de IA | `tavily_search` |
| Extraer contenido de URL específicas    | `tavily_extract` |

## Relacionado

- [Resumen de búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [Firecrawl](/es/tools/firecrawl) -- búsqueda + scraping con extracción de contenido
- [Exa Search](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
