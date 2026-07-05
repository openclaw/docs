---
read_when:
    - Quieres usar Perplexity Search para la búsqueda web
    - Necesitas configurar PERPLEXITY_API_KEY u OPENROUTER_API_KEY
summary: API de búsqueda de Perplexity y compatibilidad de Sonar/OpenRouter con web_search
title: Búsqueda de Perplexity
x-i18n:
    generated_at: "2026-07-05T11:45:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw admite la API de Perplexity Search como proveedor de `web_search`. Devuelve resultados estructurados con los campos `title`, `url` y `snippet`.

Por compatibilidad, OpenClaw también admite configuraciones heredadas de Perplexity Sonar/OpenRouter. Si usas `OPENROUTER_API_KEY`, una clave `sk-or-...` en `plugins.entries.perplexity.config.webSearch.apiKey`, o defines `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, el proveedor cambia a la ruta de chat-completions y devuelve respuestas sintetizadas por IA con citas en lugar de resultados estructurados de la API de Search.

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Obtener una clave de API de Perplexity

1. Crea una cuenta de Perplexity en [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Genera una clave de API en el panel.
3. Guarda la clave en la configuración o define `PERPLEXITY_API_KEY` en el entorno de Gateway.

## Compatibilidad con OpenRouter

Si ya usabas OpenRouter para Perplexity Sonar, conserva `provider: "perplexity"` y define `OPENROUTER_API_KEY` en el entorno de Gateway, o guarda una clave `sk-or-...` en `plugins.entries.perplexity.config.webSearch.apiKey`.

Controles opcionales de compatibilidad:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Ejemplos de configuración

### API nativa de Perplexity Search

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

**Mediante configuración:** ejecuta `openclaw configure --section web`. Guarda la clave en `~/.openclaw/openclaw.json` bajo `plugins.entries.perplexity.config.webSearch.apiKey`. Ese campo también acepta objetos SecretRef.

**Mediante entorno:** define `PERPLEXITY_API_KEY` u `OPENROUTER_API_KEY` en el entorno del proceso de Gateway. Para una instalación de gateway, ponla en `~/.openclaw/.env` (o en el entorno de tu servicio). Consulta [Variables de entorno](/es/help/faq#env-vars-and-env-loading).

Si `provider: "perplexity"` está configurado y el SecretRef de la clave de Perplexity no se resuelve sin respaldo de entorno, el inicio/la recarga falla rápido.

## Parámetros de herramienta

Estos parámetros se aplican a la ruta nativa de la API de Perplexity Search.

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
Filtro de tiempo: `day` son 24 horas.
</ParamField>

<ParamField path="date_after" type="string">
Solo resultados publicados después de esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Solo resultados publicados antes de esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Array de dominios permitidos/denegados (máx. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Presupuesto total de contenido (máx. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Límite de tokens por página.
</ParamField>

Para la ruta heredada de compatibilidad con Sonar/OpenRouter:

- Se aceptan `query`, `count` y `freshness`.
- `count` allí es solo de compatibilidad; la respuesta sigue siendo una única respuesta sintetizada con citas en lugar de una lista de N resultados.
- Los filtros exclusivos de la API de Search (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) devuelven errores explícitos.

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

### Reglas del filtro de dominios

- Máximo 20 dominios por filtro.
- No se pueden mezclar entradas de lista de permitidos y lista de denegados en la misma solicitud.
- Usa un prefijo `-` para las entradas de lista de denegados (por ejemplo, `["-reddit.com"]`).

## Notas

- La API de Perplexity Search devuelve resultados estructurados de búsqueda web (`title`, `url`, `snippet`).
- OpenRouter, o un `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` explícito, cambia Perplexity de nuevo a chat completions de Sonar por compatibilidad.
- La compatibilidad con Sonar/OpenRouter devuelve una única respuesta sintetizada con citas, no filas de resultados estructurados.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (configurable mediante `cacheTtlMinutes`).

## Relacionado

<CardGroup cols={2}>
  <Card title="Resumen de búsqueda web" href="/es/tools/web" icon="globe">
    Todos los proveedores y reglas de detección automática.
  </Card>
  <Card title="Búsqueda de Brave" href="/es/tools/brave-search" icon="shield">
    Resultados estructurados con filtros de país e idioma.
  </Card>
  <Card title="Búsqueda de Exa" href="/es/tools/exa-search" icon="magnifying-glass">
    Búsqueda neuronal con extracción de contenido.
  </Card>
  <Card title="Documentación de la API de Perplexity Search" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Inicio rápido y referencia oficiales de la API de Perplexity Search.
  </Card>
</CardGroup>
