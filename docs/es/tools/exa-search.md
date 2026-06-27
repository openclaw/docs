---
read_when:
    - Quieres usar Exa para web_search
    - Necesitas una EXA_API_KEY
    - Quieres búsqueda neuronal o extracción de contenido
summary: Búsqueda de Exa AI -- búsqueda neuronal y por palabras clave con extracción de contenido
title: Búsqueda de Exa
x-i18n:
    generated_at: "2026-06-27T13:03:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw admite [Exa AI](https://exa.ai/) como proveedor de `web_search`. Exa
ofrece modos de búsqueda neuronal, por palabras clave e híbrida con extracción
de contenido integrada (resaltados, texto, resúmenes).

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Obtener una clave de API

<Steps>
  <Step title="Crear una cuenta">
    Regístrate en [exa.ai](https://exa.ai/) y genera una clave de API desde tu
    panel.
  </Step>
  <Step title="Guardar la clave">
    Define `EXA_API_KEY` en el entorno de Gateway, o configúrala mediante:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**Alternativa de entorno:** define `EXA_API_KEY` en el entorno de Gateway.
Para una instalación de Gateway, ponlo en `~/.openclaw/.env`.

## Anulación de URL base

Define `plugins.entries.exa.config.webSearch.baseUrl` cuando las solicitudes de
búsqueda de Exa deban pasar por un proxy compatible o un endpoint alternativo de
Exa. OpenClaw normaliza los hosts sin esquema anteponiendo `https://` y agrega
`/search` salvo que la ruta ya termine allí. El endpoint resuelto se incluye en
la clave de caché de búsqueda, por lo que los resultados de distintos endpoints
de Exa no se comparten.

## Parámetros de la herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number">
Resultados que se devolverán (1-100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Modo de búsqueda.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro de tiempo.
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

Exa puede devolver contenido extraído junto con los resultados de búsqueda. Pasa
un objeto `contents` para habilitarlo:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Opción de contenido | Tipo                                                                  | Descripción                          |
| ------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| `text`              | `boolean \| { maxCharacters }`                                        | Extrae el texto completo de la página |
| `highlights`        | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extrae frases clave                  |
| `summary`           | `boolean \| { query }`                                                | Resumen generado por IA              |

### Modos de búsqueda

| Modo             | Descripción                              |
| ---------------- | ---------------------------------------- |
| `auto`           | Exa elige el mejor modo (predeterminado) |
| `neural`         | Búsqueda semántica/basada en significado |
| `fast`           | Búsqueda rápida por palabras clave       |
| `deep`           | Búsqueda profunda exhaustiva             |
| `deep-reasoning` | Búsqueda profunda con razonamiento       |
| `instant`        | Resultados más rápidos                   |

## Notas

- Si no se proporciona ninguna opción `contents`, Exa usa de forma predeterminada `{ highlights: true }`
  para que los resultados incluyan extractos de frases clave
- Los resultados conservan los campos `highlightScores` y `summary` de la
  respuesta de la API de Exa cuando están disponibles
- Las descripciones de los resultados se resuelven primero desde los resaltados, luego desde el resumen y luego
  desde el texto completo, según lo que esté disponible
- `freshness` y `date_after`/`date_before` no se pueden combinar; usa un solo
  modo de filtro de tiempo
- Se pueden devolver hasta 100 resultados por consulta (sujeto a los límites del
  tipo de búsqueda de Exa)
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (configurable mediante
  `cacheTtlMinutes`)
- Exa es una integración oficial de API con respuestas JSON estructuradas

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con filtros de país/idioma
- [Perplexity Search](/es/tools/perplexity-search) -- resultados estructurados con filtrado por dominio
