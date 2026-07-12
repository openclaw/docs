---
read_when:
    - Quieres usar Exa para web_search
    - Necesitas una `EXA_API_KEY`
    - Quieres búsqueda neuronal o extracción de contenido
summary: 'Búsqueda de Exa AI: búsqueda neuronal y por palabras clave con extracción de contenido'
title: Búsqueda de Exa
x-i18n:
    generated_at: "2026-07-11T23:33:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) es un proveedor de `web_search` con modos de búsqueda neuronal, por palabras clave e
híbrida, además de extracción de contenido integrada (fragmentos destacados, texto y
resúmenes).

## Instalar el Plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Obtener una clave de API

<Steps>
  <Step title="Crear una cuenta">
    Regístrate en [exa.ai](https://exa.ai/) y genera una clave de API desde tu
    panel de control.
  </Step>
  <Step title="Guardar la clave">
    Define `EXA_API_KEY` en el entorno del Gateway o configúrala mediante:

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // opcional si EXA_API_KEY está definida
            baseUrl: "https://api.exa.ai", // opcional; OpenClaw añade /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternativa mediante el entorno:** define `EXA_API_KEY` en el entorno del Gateway. Para
una instalación del Gateway, colócala en `~/.openclaw/.env`. Consulta
[Variables de entorno](/es/help/faq#env-vars-and-env-loading).

## Sobrescribir la URL base

Define `plugins.entries.exa.config.webSearch.baseUrl` para enrutar las solicitudes
de búsqueda de Exa mediante un proxy compatible o un punto de conexión alternativo. OpenClaw
normaliza los hosts sin protocolo anteponiendo `https://` y añade `/search`, salvo que
la ruta ya termine así. El punto de conexión resuelto forma parte de la clave de caché
de búsqueda, por lo que los resultados de distintos puntos de conexión nunca se comparten.

## Parámetros de la herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Resultados que se devolverán (1-100, sujetos a los límites del tipo de búsqueda de Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Modo de búsqueda.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporal. No se puede combinar con `date_after`/`date_before`.
</ParamField>

<ParamField path="date_after" type="string">
Resultados posteriores a esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Resultados anteriores a esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opciones de extracción de contenido (consulta más abajo).
</ParamField>

### Extracción de contenido

Pasa un objeto `contents` para controlar el contenido extraído en los resultados:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // texto completo de la página
    highlights: { numSentences: 3 }, // frases clave
    summary: true, // resumen generado por IA
  },
});
```

| Opción de contenido | Tipo                                                                  | Descripción                         |
| ------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `text`              | `boolean \| { maxCharacters }`                                        | Extrae el texto completo de la página |
| `highlights`        | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extrae las frases clave             |
| `summary`           | `boolean \| { query }`                                                | Resumen generado por IA             |

Si se omite `contents`, Exa utiliza de forma predeterminada `{ highlights: true }`, por lo que los resultados
incluyen fragmentos de frases clave. Las descripciones de los resultados se obtienen primero de los fragmentos
destacados, después del resumen y, por último, del texto completo, según cuál esté disponible primero. Los resultados
también conservan los campos sin procesar `highlightScores` y `summary` de la respuesta de la API de Exa
cuando están disponibles.

### Modos de búsqueda

| Modo             | Descripción                                      |
| ---------------- | ------------------------------------------------ |
| `auto`           | Exa elige el mejor modo (predeterminado)         |
| `neural`         | Búsqueda semántica o basada en el significado    |
| `fast`           | Búsqueda rápida por palabras clave               |
| `deep`           | Búsqueda profunda y exhaustiva                   |
| `deep-reasoning` | Búsqueda profunda con razonamiento               |
| `instant`        | Resultados más rápidos                            |

## Notas

- `count` acepta hasta 100, sujeto a los límites del tipo de búsqueda de Exa.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada. Configura los valores compartidos
  `tools.web.search.cacheTtlMinutes` (minutos) y
  `tools.web.search.timeoutSeconds` (30 s de forma predeterminada) para cambiar el almacenamiento en caché y
  el tiempo de espera de las solicitudes de todos los proveedores de `web_search`, incluido Exa.

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con filtros por país e idioma
- [Perplexity Search](/es/tools/perplexity-search) -- resultados estructurados con filtrado por dominio
