---
read_when:
    - Desea usar Perplexity Search para la búsqueda web
    - Necesitas configurar PERPLEXITY_API_KEY u OPENROUTER_API_KEY
summary: Compatibilidad de la API de búsqueda de Perplexity y Sonar/OpenRouter para web_search
title: Búsqueda de Perplexity
x-i18n:
    generated_at: "2026-06-27T13:07:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef003238bc38dd3d92b98654598cba05fb1c324d8ca766a683cf1defe5bd435
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw admite Perplexity Search API como proveedor de `web_search`.
Devuelve resultados estructurados con los campos `title`, `url` y `snippet`.

Por compatibilidad, OpenClaw también admite configuraciones heredadas de Perplexity Sonar/OpenRouter.
Si usas `OPENROUTER_API_KEY`, una clave `sk-or-...` en `plugins.entries.perplexity.config.webSearch.apiKey`, o defines `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, el proveedor cambia a la ruta de chat-completions y devuelve respuestas sintetizadas por IA con citas en lugar de resultados estructurados de Search API.

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Obtener una clave de API de Perplexity

1. Crea una cuenta de Perplexity en [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Genera una clave de API en el panel
3. Guarda la clave en la configuración o define `PERPLEXITY_API_KEY` en el entorno de Gateway.

## Compatibilidad con OpenRouter

Si ya usabas OpenRouter para Perplexity Sonar, conserva `provider: "perplexity"` y define `OPENROUTER_API_KEY` en el entorno de Gateway, o guarda una clave `sk-or-...` en `plugins.entries.perplexity.config.webSearch.apiKey`.

Controles de compatibilidad opcionales:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Ejemplos de configuración

### Perplexity Search API nativa

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Compatibilidad con OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Dónde definir la clave

**Mediante configuración:** ejecuta `openclaw configure --section web`. Guarda la clave en
`~/.openclaw/openclaw.json`, dentro de `plugins.entries.perplexity.config.webSearch.apiKey`.
Ese campo también acepta objetos SecretRef.

**Mediante entorno:** define `PERPLEXITY_API_KEY` u `OPENROUTER_API_KEY`
en el entorno del proceso de Gateway. Para una instalación de gateway, colócala en
`~/.openclaw/.env` (o en el entorno de tu servicio). Consulta [Variables de entorno](/es/help/faq#env-vars-and-env-loading).

Si `provider: "perplexity"` está configurado y la SecretRef de la clave de Perplexity no se puede resolver sin alternativa de entorno, el inicio o la recarga fallan rápidamente.

## Parámetros de la herramienta

Estos parámetros se aplican a la ruta nativa de Perplexity Search API.

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados que devolver (1-10).
</ParamField>

<ParamField path="country" type="string">
Código de país ISO de 2 letras (por ejemplo, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Código de idioma ISO 639-1 (por ejemplo, `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro de tiempo: `day` equivale a 24 horas.
</ParamField>

<ParamField path="date_after" type="string">
Solo resultados publicados después de esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Solo resultados publicados antes de esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Arreglo de lista de dominios permitidos/bloqueados (máx. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Presupuesto total de contenido (máx. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Límite de tokens por página.
</ParamField>

Para la ruta heredada de compatibilidad con Sonar/OpenRouter:

- Se aceptan `query`, `count` y `freshness`
- Allí `count` es solo de compatibilidad; la respuesta sigue siendo una sola
  respuesta sintetizada con citas, no una lista de N resultados
- Los filtros exclusivos de Search API, como `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` y `max_tokens_per_page`,
  devuelven errores explícitos

**Ejemplos:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Reglas de filtro de dominios

- Máximo 20 dominios por filtro
- No se puede mezclar la lista de permitidos y la lista de bloqueados en la misma solicitud
- Usa el prefijo `-` para las entradas de la lista de bloqueados (por ejemplo, `["-reddit.com"]`)

## Notas

- Perplexity Search API devuelve resultados estructurados de búsqueda web (`title`, `url`, `snippet`)
- OpenRouter o `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` explícitos hacen que Perplexity vuelva a usar chat completions de Sonar por compatibilidad
- La compatibilidad con Sonar/OpenRouter devuelve una sola respuesta sintetizada con citas, no filas de resultados estructuradas
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (configurable mediante `cacheTtlMinutes`)

## Relacionado

<CardGroup cols={2}>
  <Card title="Web search overview" href="/es/tools/web" icon="globe">
    Todos los proveedores y reglas de detección automática.
  </Card>
  <Card title="Brave search" href="/es/tools/brave-search" icon="shield">
    Resultados estructurados con filtros de país e idioma.
  </Card>
  <Card title="Exa search" href="/es/tools/exa-search" icon="magnifying-glass">
    Búsqueda neuronal con extracción de contenido.
  </Card>
  <Card title="Perplexity Search API docs" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Inicio rápido y referencia oficiales de Perplexity Search API.
  </Card>
</CardGroup>
