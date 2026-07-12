---
read_when:
    - Quieres realizar búsquedas web con Tavily como motor.
    - Necesitas una clave de API de Tavily
    - Quieres usar Tavily como proveedor de web_search
    - Quieres extraer contenido de URL
summary: Herramientas de búsqueda y extracción de Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-11T23:36:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) es una API de búsqueda diseñada para aplicaciones de IA. OpenClaw la ofrece de dos maneras:

- como proveedor `web_search` para la herramienta de búsqueda genérica
- como herramientas explícitas del Plugin: `tavily_search` y `tavily_extract`

Tavily devuelve resultados estructurados optimizados para el consumo por parte de LLM, con profundidad de búsqueda configurable, filtrado por tema, filtros de dominios, resúmenes de respuestas generados por IA y extracción de contenido de URL (incluidas páginas renderizadas con JavaScript).

| Propiedad     | Valor                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Id. del Plugin | `tavily`                                                                                                         |
| Paquete       | `@openclaw/tavily-plugin`                                                                                        |
| Autenticación | Variable de entorno `TAVILY_API_KEY` o configuración `apiKey`                                                    |
| URL base      | `https://api.tavily.com` (predeterminada); variable de entorno `TAVILY_BASE_URL` o configuración `baseUrl` para reemplazarla |
| Tiempos de espera | 30 s para búsquedas, 60 s para extracciones (predeterminados)                                                |
| Herramientas  | `tavily_search`, `tavily_extract`                                                                                |

## Primeros pasos

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Obtener una clave de API">
    Crea una cuenta de Tavily en [tavily.com](https://tavily.com) y, a continuación, genera una clave de API en el panel.
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
  <Step title="Verificar que se ejecuten las búsquedas">
    Activa una llamada a `web_search` desde cualquier agente o llama directamente a `tavily_search`.
  </Step>
</Steps>

<Tip>
Al elegir Tavily durante la incorporación o en `openclaw configure --section web`, se instala y habilita el Plugin oficial de Tavily cuando es necesario.
</Tip>

## Referencia de herramientas

### `tavily_search`

Utiliza esta herramienta cuando quieras controles de búsqueda específicos de Tavily en lugar de la herramienta genérica `web_search`.

| Parámetro         | Tipo              | Restricciones / valor predeterminado   | Descripción                                                  |
| ----------------- | ----------------- | -------------------------------------- | ------------------------------------------------------------ |
| `query`           | cadena            | obligatorio                            | Cadena de consulta de búsqueda.                              |
| `search_depth`    | enumeración       | `basic` (predeterminado), `advanced`   | `advanced` es más lento, pero ofrece mayor relevancia.       |
| `topic`           | enumeración       | `general` (predeterminado), `news`, `finance` | Filtra por familia temática.                          |
| `max_results`     | entero            | 1-20, valor predeterminado `5`         | Número de resultados.                                        |
| `include_answer`  | booleano          | valor predeterminado `false`           | Incluye un resumen de respuesta generado por la IA de Tavily. |
| `time_range`      | enumeración       | `day`, `week`, `month`, `year`         | Filtra los resultados por actualidad.                        |
| `include_domains` | matriz de cadenas | (ninguno)                              | Incluye únicamente resultados de estos dominios.             |
| `exclude_domains` | matriz de cadenas | (ninguno)                              | Excluye los resultados de estos dominios.                    |

Equilibrio de la profundidad de búsqueda:

| Profundidad | Velocidad  | Relevancia | Opción recomendada para                         |
| ----------- | ---------- | ---------- | ----------------------------------------------- |
| `basic`     | Más rápida | Alta       | Consultas de propósito general (predeterminado). |
| `advanced`  | Más lenta  | Máxima     | Investigación precisa y verificación de datos. |

### `tavily_extract`

Utiliza esta herramienta para extraer contenido limpio de una o varias URL. Gestiona páginas renderizadas con JavaScript y admite la división en fragmentos centrada en una consulta para realizar extracciones específicas.

| Parámetro           | Tipo              | Restricciones / valor predeterminado | Descripción                                                                |
| ------------------- | ----------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `urls`              | matriz de cadenas | obligatorio, 1-20                    | URL de las que se extraerá contenido.                                      |
| `query`             | cadena            | (opcional)                           | Reordena los fragmentos extraídos según su relevancia para esta consulta.  |
| `extract_depth`     | enumeración       | `basic` (predeterminado), `advanced` | Utiliza `advanced` para páginas con mucho JS, SPA o tablas dinámicas.       |
| `chunks_per_source` | entero            | 1-5; **requiere `query`**            | Fragmentos devueltos por URL. Produce un error si se establece sin `query`. |
| `include_images`    | booleano          | valor predeterminado `false`         | Incluye URL de imágenes en los resultados.                                 |

Equilibrio de la profundidad de extracción:

| Profundidad | Cuándo utilizarla                                   |
| ----------- | --------------------------------------------------- |
| `basic`     | Páginas sencillas. Prueba primero esta opción.       |
| `advanced`  | SPA renderizadas con JS, contenido dinámico, tablas. |

<Tip>
Divide las listas grandes de URL en varias llamadas a `tavily_extract` (máximo de 20 por solicitud). Utiliza `query` junto con `chunks_per_source` para obtener únicamente el contenido relevante en lugar de páginas completas.
</Tip>

## Elegir la herramienta adecuada

| Necesidad                                       | Herramienta       |
| ----------------------------------------------- | ----------------- |
| Búsqueda web rápida, sin opciones especiales    | `web_search`      |
| Búsqueda con profundidad, tema y respuestas de IA | `tavily_search` |
| Extraer contenido de URL específicas            | `tavily_extract`  |

<Note>
La herramienta genérica `web_search` con Tavily como proveedor admite `query` y `count` (hasta 20 resultados). Para usar controles específicos de Tavily (`search_depth`, `topic`, `include_answer`, filtros de dominios e intervalo temporal), utiliza `tavily_search` en su lugar.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Orden de resolución de la clave de API">
    El cliente de Tavily busca su clave de API en este orden:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (resuelta mediante SecretRefs).
    2. `TAVILY_API_KEY` del entorno del Gateway.

    Tanto `tavily_search` como `tavily_extract` generan un error de configuración si ninguna de las dos está presente.

  </Accordion>

  <Accordion title="URL base personalizada">
    Reemplaza `plugins.entries.tavily.config.webSearch.baseUrl` o establece `TAVILY_BASE_URL` si accedes a Tavily mediante un proxy. La configuración tiene prioridad sobre la variable de entorno. El valor predeterminado es `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requiere `query`">
    `tavily_extract` rechaza las llamadas que pasan `chunks_per_source` sin una `query`. Tavily clasifica los fragmentos según su relevancia para la consulta, por lo que el parámetro carece de sentido sin ella.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Descripción general de la búsqueda web" href="/es/tools/web" icon="magnifying-glass">
    Todos los proveedores y las reglas de detección automática.
  </Card>
  <Card title="Firecrawl" href="/es/tools/firecrawl" icon="fire">
    Búsqueda y extracción web con extracción de contenido.
  </Card>
  <Card title="Búsqueda con Exa" href="/es/tools/exa-search" icon="binoculars">
    Búsqueda neuronal con extracción de contenido.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Esquema de configuración completo para las entradas de Plugins y el enrutamiento de herramientas.
  </Card>
</CardGroup>
