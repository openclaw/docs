---
read_when:
    - Quieres búsqueda web respaldada por Tavily
    - Necesitas una clave de API de Tavily
    - Quieres Tavily como proveedor de web_search
    - Quieres extracción de contenido desde URL
summary: Herramientas de búsqueda y extracción de Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-05T11:46:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) es una API de búsqueda diseñada para aplicaciones de IA. OpenClaw la expone de dos formas:

- como el proveedor `web_search` para la herramienta de búsqueda genérica
- como herramientas explícitas del Plugin: `tavily_search` y `tavily_extract`

Tavily devuelve resultados estructurados optimizados para el consumo de LLM, con profundidad de búsqueda configurable, filtrado por tema, filtros de dominio, resúmenes de respuesta generados por IA y extracción de contenido desde URL (incluidas páginas renderizadas con JavaScript).

| Propiedad  | Valor                                                                                         |
| --------- | --------------------------------------------------------------------------------------------- |
| Id. del Plugin | `tavily`                                                                                      |
| Paquete   | `@openclaw/tavily-plugin`                                                                     |
| Autenticación      | variable de entorno `TAVILY_API_KEY` o configuración `apiKey`                                                   |
| URL base  | `https://api.tavily.com` (predeterminada); variable de entorno `TAVILY_BASE_URL` o configuración `baseUrl` para sobrescribirla |
| Tiempos de espera  | búsqueda de 30 s, extracción de 60 s (predeterminado)                                                             |
| Herramientas     | `tavily_search`, `tavily_extract`                                                             |

## Primeros pasos

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Obtener una clave de API">
    Crea una cuenta de Tavily en [tavily.com](https://tavily.com) y luego genera una clave de API en el panel.
  </Step>
  <Step title="Configurar el Plugin y el proveedor">
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
  </Step>
  <Step title="Verificar que la búsqueda se ejecute">
    Activa un `web_search` desde cualquier agente, o llama a `tavily_search` directamente.
  </Step>
</Steps>

<Tip>
Elegir Tavily durante la incorporación o con `openclaw configure --section web` instala y habilita el Plugin oficial de Tavily cuando sea necesario.
</Tip>

## Referencia de herramientas

### `tavily_search`

Úsala cuando quieras controles de búsqueda específicos de Tavily en lugar del `web_search` genérico.

| Parámetro         | Tipo         | Restricciones / valor predeterminado                  | Descripción                                   |
| ----------------- | ------------ | -------------------------------------- | --------------------------------------------- |
| `query`           | string       | obligatorio                               | Cadena de consulta de búsqueda.                          |
| `search_depth`    | enum         | `basic` (predeterminado), `advanced`          | `advanced` es más lento, pero tiene mayor relevancia.    |
| `topic`           | enum         | `general` (predeterminado), `news`, `finance` | Filtra por familia de temas.                       |
| `max_results`     | integer      | 1-20, predeterminado `5`                      | Número de resultados.                            |
| `include_answer`  | boolean      | predeterminado `false`                        | Incluye un resumen de respuesta generado por la IA de Tavily. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Filtra los resultados por actualidad.                    |
| `include_domains` | string array | (ninguno)                                 | Incluye solo resultados de estos dominios.      |
| `exclude_domains` | string array | (ninguno)                                 | Excluye resultados de estos dominios.           |

Compensación de profundidad de búsqueda:

| Profundidad      | Velocidad  | Relevancia | Ideal para                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | Más rápida | Alta      | Consultas de propósito general (predeterminado).   |
| `advanced` | Más lenta | Máxima   | Investigación precisa y verificación de hechos. |

### `tavily_extract`

Úsala para extraer contenido limpio de una o más URL. Gestiona páginas renderizadas con JavaScript y admite fragmentación enfocada por consulta para extracción dirigida.

| Parámetro           | Tipo         | Restricciones / valor predeterminado         | Descripción                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | obligatorio, 1-20                | URL de las que extraer contenido.                               |
| `query`             | string       | (opcional)                    | Reordena los fragmentos extraídos por relevancia respecto a esta consulta.         |
| `extract_depth`     | enum         | `basic` (predeterminado), `advanced` | Usa `advanced` para páginas con mucho JS, SPA o tablas dinámicas. |
| `chunks_per_source` | integer      | 1-5; **requiere `query`**     | Fragmentos devueltos por URL. Produce un error si se establece sin `query`.     |
| `include_images`    | boolean      | predeterminado `false`               | Incluye URL de imágenes en los resultados.                              |

Compensación de profundidad de extracción:

| Profundidad      | Cuándo usarla                                |
| ---------- | ------------------------------------------ |
| `basic`    | Páginas simples. Prueba esto primero.              |
| `advanced` | SPA renderizadas con JS, contenido dinámico, tablas. |

<Tip>
Divide listas de URL más grandes en varias llamadas a `tavily_extract` (máximo 20 por solicitud). Usa `query` junto con `chunks_per_source` para obtener solo contenido relevante en lugar de páginas completas.
</Tip>

## Elegir la herramienta adecuada

| Necesidad                                 | Herramienta             |
| ------------------------------------ | ---------------- |
| Búsqueda web rápida, sin opciones especiales | `web_search`     |
| Búsqueda con profundidad, tema y respuestas de IA | `tavily_search`  |
| Extraer contenido de URL específicas   | `tavily_extract` |

<Note>
La herramienta genérica `web_search` con Tavily como proveedor admite `query` y `count` (hasta 20 resultados). Para controles específicos de Tavily (`search_depth`, `topic`, `include_answer`, filtros de dominio, intervalo de tiempo), usa `tavily_search` en su lugar.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Orden de resolución de la clave de API">
    El cliente de Tavily busca su clave de API en este orden:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (resuelto mediante SecretRefs).
    2. `TAVILY_API_KEY` desde el entorno del Gateway.

    Tanto `tavily_search` como `tavily_extract` generan un error de configuración si ninguna está presente.

  </Accordion>

  <Accordion title="URL base personalizada">
    Sobrescribe `plugins.entries.tavily.config.webSearch.baseUrl`, o establece `TAVILY_BASE_URL`, si expones Tavily mediante un proxy. La configuración tiene prioridad sobre la variable de entorno. El valor predeterminado es `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requiere `query`">
    `tavily_extract` rechaza las llamadas que pasan `chunks_per_source` sin una `query`. Tavily clasifica los fragmentos por relevancia de consulta, por lo que el parámetro no tiene sentido sin una.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Resumen de Web Search" href="/es/tools/web" icon="magnifying-glass">
    Todos los proveedores y las reglas de detección automática.
  </Card>
  <Card title="Firecrawl" href="/es/tools/firecrawl" icon="fire">
    Búsqueda más scraping con extracción de contenido.
  </Card>
  <Card title="Exa Search" href="/es/tools/exa-search" icon="binoculars">
    Búsqueda neuronal con extracción de contenido.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Esquema de configuración completo para entradas de Plugin y enrutamiento de herramientas.
  </Card>
</CardGroup>
