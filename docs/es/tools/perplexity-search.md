---
read_when:
    - Quieres usar Perplexity Search para búsqueda web
    - Necesitas configurar `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`
summary: API de búsqueda de Perplexity y compatibilidad Sonar/OpenRouter para `web_search`
title: Búsqueda de Perplexity
x-i18n:
    generated_at: "2026-04-24T05:55:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# API de búsqueda de Perplexity

OpenClaw admite la API de búsqueda de Perplexity como proveedor de `web_search`.
Devuelve resultados estructurados con los campos `title`, `url` y `snippet`.

Por compatibilidad, OpenClaw también admite configuraciones heredadas de Perplexity Sonar/OpenRouter.
Si usas `OPENROUTER_API_KEY`, una clave `sk-or-...` en `plugins.entries.perplexity.config.webSearch.apiKey`, o configuras `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, el proveedor cambia a la ruta de chat completions y devuelve respuestas sintetizadas por IA con citas en lugar de resultados estructurados de la Search API.

## Obtener una API key de Perplexity

1. Crea una cuenta de Perplexity en [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Genera una API key en el panel
3. Almacena la clave en la configuración o configura `PERPLEXITY_API_KEY` en el entorno del Gateway.

## Compatibilidad con OpenRouter

Si ya estabas usando OpenRouter para Perplexity Sonar, mantén `provider: "perplexity"` y configura `OPENROUTER_API_KEY` en el entorno del Gateway, o almacena una clave `sk-or-...` en `plugins.entries.perplexity.config.webSearch.apiKey`.

Controles opcionales de compatibilidad:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Ejemplos de configuración

### API nativa de búsqueda de Perplexity

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

## Dónde configurar la clave

**Mediante configuración:** ejecuta `openclaw configure --section web`. Almacena la clave en
`~/.openclaw/openclaw.json` bajo `plugins.entries.perplexity.config.webSearch.apiKey`.
Ese campo también acepta objetos SecretRef.

**Mediante entorno:** configura `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`
en el entorno del proceso del Gateway. Para una instalación del gateway, colócalo en
`~/.openclaw/.env` (o en el entorno de tu servicio). Consulta [Variables de entorno](/es/help/faq#env-vars-and-env-loading).

Si `provider: "perplexity"` está configurado y la SecretRef de la clave de Perplexity no se resuelve sin respaldo en env, el arranque o la recarga fallan inmediatamente.

## Parámetros de la herramienta

Estos parámetros se aplican a la ruta nativa de la API de búsqueda de Perplexity.

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados a devolver (1–10).
</ParamField>

<ParamField path="country" type="string">
Código de país ISO de 2 letras (por ejemplo `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Código de idioma ISO 639-1 (por ejemplo `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro de tiempo — `day` son 24 horas.
</ParamField>

<ParamField path="date_after" type="string">
Solo resultados publicados después de esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Solo resultados publicados antes de esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Arreglo de allowlist/denylist de dominios (máx. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Presupuesto total de contenido (máx. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Límite de tokens por página.
</ParamField>

Para la ruta heredada de compatibilidad Sonar/OpenRouter:

- se aceptan `query`, `count` y `freshness`
- `count` es solo de compatibilidad ahí; la respuesta sigue siendo una única
  respuesta sintetizada con citas en lugar de una lista de N resultados
- los filtros exclusivos de la Search API como `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` y `max_tokens_per_page`
  devuelven errores explícitos

**Ejemplos:**

```javascript
// Búsqueda específica por país e idioma
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Resultados recientes (última semana)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Búsqueda por rango de fechas
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrado de dominios (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtrado de dominios (denylist - prefijo con -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Mayor extracción de contenido
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Reglas de domain filter

- Máximo 20 dominios por filtro
- No se puede mezclar allowlist y denylist en la misma solicitud
- Usa el prefijo `-` para entradas de denylist (por ejemplo `["-reddit.com"]`)

## Notas

- La API de búsqueda de Perplexity devuelve resultados estructurados de búsqueda web (`title`, `url`, `snippet`)
- OpenRouter o un `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` explícito vuelven a cambiar Perplexity a Sonar chat completions por compatibilidad
- La compatibilidad Sonar/OpenRouter devuelve una única respuesta sintetizada con citas, no filas de resultados estructurados
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (configurable mediante `cacheTtlMinutes`)

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y autodetección
- [Documentación de Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) -- documentación oficial de Perplexity
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con filtros de país/idioma
- [Exa Search](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
