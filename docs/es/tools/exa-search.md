---
read_when:
    - Quieres usar Exa para web_search
    - Necesitas una EXA_API_KEY
    - Quieres búsqueda neuronal o extracción de contenido
summary: 'Búsqueda de Exa AI: búsqueda neuronal y por palabras clave con extracción de contenido'
title: Búsqueda de Exa
x-i18n:
    generated_at: "2026-07-05T11:46:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) es un proveedor de `web_search` con modos de búsqueda neural, por palabra clave e
híbrida, además de extracción de contenido integrada (resaltados, texto,
resúmenes).

## Instalar Plugin

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
    Define `EXA_API_KEY` en el entorno del Gateway, o configúralo mediante:

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

**Alternativa de entorno:** define `EXA_API_KEY` en el entorno del Gateway. Para
una instalación de gateway, colócalo en `~/.openclaw/.env`. Consulta
[variables de entorno](/es/help/faq#env-vars-and-env-loading).

## Sobrescritura de URL base

Define `plugins.entries.exa.config.webSearch.baseUrl` para enrutar las solicitudes
de búsqueda de Exa a través de un proxy compatible o un endpoint alternativo. OpenClaw
normaliza hosts sin esquema anteponiendo `https://` y añade `/search` a menos que
la ruta ya termine ahí. El endpoint resuelto forma parte de la clave de caché de
búsqueda, por lo que los resultados de endpoints distintos nunca se comparten.

## Parámetros de herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Resultados que devolver (1-100, sujeto a los límites de tipo de búsqueda de Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Modo de búsqueda.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporal. No puede combinarse con `date_after`/`date_before`.
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
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Opción de contents | Tipo                                                                  | Descripción                         |
| ------------------ | --------------------------------------------------------------------- | ----------------------------------- |
| `text`             | `boolean \| { maxCharacters }`                                        | Extraer texto completo de la página |
| `highlights`       | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extraer frases clave                |
| `summary`          | `boolean \| { query }`                                                | Resumen generado por IA             |

Si se omite `contents`, Exa usa de forma predeterminada `{ highlights: true }`, por lo que los resultados
incluyen extractos de frases clave. Las descripciones de los resultados se resuelven a partir de los resaltados
primero, luego del resumen y luego del texto completo, lo que esté disponible primero. Los resultados
también preservan los campos `highlightScores` y `summary` sin procesar de la respuesta de la API de Exa
cuando están disponibles.

### Modos de búsqueda

| Modo             | Descripción                            |
| ---------------- | -------------------------------------- |
| `auto`           | Exa elige el mejor modo (predeterminado) |
| `neural`         | Búsqueda semántica/basada en significado |
| `fast`           | Búsqueda rápida por palabra clave        |
| `deep`           | Búsqueda profunda exhaustiva             |
| `deep-reasoning` | Búsqueda profunda con razonamiento       |
| `instant`        | Resultados más rápidos                   |

## Notas

- `count` acepta hasta 100, sujeto a los límites de tipo de búsqueda de Exa.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada. Configura los ajustes compartidos
  `tools.web.search.cacheTtlMinutes` (minutos) y
  `tools.web.search.timeoutSeconds` (predeterminado 30 s) para cambiar el almacenamiento en caché y el
  tiempo de espera de solicitud para todos los proveedores de `web_search`, incluido Exa.

## Relacionado

- [Resumen de búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con filtros de país/idioma
- [Perplexity Search](/es/tools/perplexity-search) -- resultados estructurados con filtrado de dominios
