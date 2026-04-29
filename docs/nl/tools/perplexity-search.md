---
read_when:
    - Je wilt Perplexity Search gebruiken om op het web te zoeken
    - Je moet PERPLEXITY_API_KEY of OPENROUTER_API_KEY hebben ingesteld
summary: Perplexity Search API en Sonar/OpenRouter-compatibiliteit voor web_search
title: Perplexity-zoekopdracht
x-i18n:
    generated_at: "2026-04-29T23:25:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 16
---

# Perplexity Search API

OpenClaw ondersteunt Perplexity Search API als `web_search`-provider.
Deze retourneert gestructureerde resultaten met de velden `title`, `url` en `snippet`.

Voor compatibiliteit ondersteunt OpenClaw ook verouderde Perplexity Sonar/OpenRouter-configuraties.
Als je `OPENROUTER_API_KEY`, een `sk-or-...`-sleutel in `plugins.entries.perplexity.config.webSearch.apiKey` gebruikt, of `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` instelt, schakelt de provider over naar het chat-completions-pad en retourneert deze door AI gesynthetiseerde antwoorden met citaten in plaats van gestructureerde Search API-resultaten.

## Een Perplexity API-sleutel verkrijgen

1. Maak een Perplexity-account aan op [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Genereer een API-sleutel in het dashboard
3. Sla de sleutel op in de configuratie of stel `PERPLEXITY_API_KEY` in de Gateway-omgeving in.

## OpenRouter-compatibiliteit

Als je OpenRouter al gebruikte voor Perplexity Sonar, behoud dan `provider: "perplexity"` en stel `OPENROUTER_API_KEY` in de Gateway-omgeving in, of sla een `sk-or-...`-sleutel op in `plugins.entries.perplexity.config.webSearch.apiKey`.

Optionele compatibiliteitsinstellingen:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Configuratievoorbeelden

### Native Perplexity Search API

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

### OpenRouter / Sonar-compatibiliteit

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

## Waar de sleutel instellen

**Via configuratie:** voer `openclaw configure --section web` uit. Hiermee wordt de sleutel opgeslagen in
`~/.openclaw/openclaw.json` onder `plugins.entries.perplexity.config.webSearch.apiKey`.
Dat veld accepteert ook SecretRef-objecten.

**Via omgeving:** stel `PERPLEXITY_API_KEY` of `OPENROUTER_API_KEY` in
in de procesomgeving van de Gateway. Plaats deze voor een gateway-installatie in
`~/.openclaw/.env` (of je serviceomgeving). Zie [Omgevingsvariabelen](/nl/help/faq#env-vars-and-env-loading).

Als `provider: "perplexity"` is geconfigureerd en de Perplexity-sleutel SecretRef niet kan worden opgelost zonder env-terugval, mislukt starten/herladen direct.

## Toolparameters

Deze parameters zijn van toepassing op het native Perplexity Search API-pad.

<ParamField path="query" type="string" required>
Zoekopdracht.
</ParamField>

<ParamField path="count" type="number" default="5">
Aantal te retourneren resultaten (1–10).
</ParamField>

<ParamField path="country" type="string">
2-letterige ISO-landcode (bijv. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1-taalcode (bijv. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Tijdfilter — `day` is 24 uur.
</ParamField>

<ParamField path="date_after" type="string">
Alleen resultaten gepubliceerd na deze datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Alleen resultaten gepubliceerd vóór deze datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Array met toegestane/geblokkeerde domeinen (max. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Totaal inhoudsbudget (max. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Tokenlimiet per pagina.
</ParamField>

Voor het verouderde Sonar/OpenRouter-compatibiliteitspad:

- `query`, `count` en `freshness` worden geaccepteerd
- `count` is daar alleen voor compatibiliteit; de respons is nog steeds één gesynthetiseerd
  antwoord met citaten in plaats van een lijst met N resultaten
- Filters die alleen voor Search API gelden, zoals `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` en `max_tokens_per_page`
  retourneren expliciete fouten

**Voorbeelden:**

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

### Regels voor domeinfilters

- Maximaal 20 domeinen per filter
- Toegestane en geblokkeerde domeinen kunnen niet in hetzelfde verzoek worden gecombineerd
- Gebruik het voorvoegsel `-` voor vermeldingen in de blokkeerlijst (bijv. `["-reddit.com"]`)

## Opmerkingen

- Perplexity Search API retourneert gestructureerde webzoekresultaten (`title`, `url`, `snippet`)
- OpenRouter of expliciete `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` schakelt Perplexity voor compatibiliteit terug naar Sonar-chatcompletions
- Sonar/OpenRouter-compatibiliteit retourneert één gesynthetiseerd antwoord met citaten, geen gestructureerde resultaatrijen
- Resultaten worden standaard 15 minuten gecachet (configureerbaar via `cacheTtlMinutes`)

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Documentatie van Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) -- officiële Perplexity-documentatie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met land-/taalfilters
- [Exa Search](/nl/tools/exa-search) -- neurale zoekfunctie met inhoudsextractie
