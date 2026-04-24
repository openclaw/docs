---
read_when:
    - Quieres usar Exa para `web_search`
    - Necesitas una `EXA_API_KEY`
    - Quieres búsqueda neural o extracción de contenido
summary: 'Búsqueda de Exa AI: búsqueda neural y por palabras clave con extracción de contenido'
title: Búsqueda Exa
x-i18n:
    generated_at: "2026-04-24T05:53:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw admite [Exa AI](https://exa.ai/) como proveedor de `web_search`. Exa
ofrece modos de búsqueda neural, por palabras clave e híbrida con extracción de contenido
integrada (resaltados, texto, resúmenes).

## Obtener una clave API

<Steps>
  <Step title="Crear una cuenta">
    Regístrate en [exa.ai](https://exa.ai/) y genera una clave API desde tu
    panel.
  </Step>
  <Step title="Guardar la clave">
    Establece `EXA_API_KEY` en el entorno del Gateway, o configúralo mediante:

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
            apiKey: "exa-...", // opcional si EXA_API_KEY está configurada
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

**Alternativa de entorno:** establece `EXA_API_KEY` en el entorno del Gateway.
Para una instalación de gateway, colócala en `~/.openclaw/.env`.

## Parámetros de la herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number">
Resultados que se devolverán (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Modo de búsqueda.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporal.
</ParamField>

<ParamField path="date_after" type="string">
Resultados posteriores a esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Resultados anteriores a esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opciones de extracción de contenido (ver abajo).
</ParamField>

### Extracción de contenido

Exa puede devolver contenido extraído junto con los resultados de búsqueda. Pasa un objeto
`contents` para habilitarlo:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // texto completo de la página
    highlights: { numSentences: 3 }, // frases clave
    summary: true, // resumen con IA
  },
});
```

| Contents option | Type                                                                  | Description            |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Extract full page text |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extract key sentences  |
| `summary`       | `boolean \| { query }`                                                | AI-generated summary   |

### Modos de búsqueda

| Mode             | Description                            |
| ---------------- | -------------------------------------- |
| `auto`           | Exa elige el mejor modo (predeterminado) |
| `neural`         | Búsqueda semántica/basada en significado |
| `fast`           | Búsqueda rápida por palabras clave     |
| `deep`           | Búsqueda profunda exhaustiva           |
| `deep-reasoning` | Búsqueda profunda con razonamiento     |
| `instant`        | Resultados más rápidos                 |

## Notas

- Si no se proporciona ninguna opción `contents`, Exa usa por defecto `{ highlights: true }`
  para que los resultados incluyan extractos de frases clave
- Los resultados conservan los campos `highlightScores` y `summary` de la respuesta de la API de Exa
  cuando están disponibles
- Las descripciones de resultados se resuelven primero a partir de los resaltados, luego del resumen y después del
  texto completo, según lo que esté disponible
- `freshness` y `date_after`/`date_before` no se pueden combinar; usa un solo
  modo de filtro temporal
- Se pueden devolver hasta 100 resultados por consulta (sujeto a los límites
  del tipo de búsqueda de Exa)
- Los resultados se almacenan en caché durante 15 minutos por defecto (configurable mediante
  `cacheTtlMinutes`)
- Exa es una integración oficial de API con respuestas JSON estructuradas

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con filtros de país/idioma
- [Perplexity Search](/es/tools/perplexity-search) -- resultados estructurados con filtrado de dominios
