---
read_when:
    - U wilt Perplexity Search gebruiken voor zoekopdrachten op het web
    - Je moet PERPLEXITY_API_KEY of OPENROUTER_API_KEY hebben ingesteld
summary: Perplexity Search API en Sonar/OpenRouter-compatibiliteit voor web_search
title: Perplexity-zoekfunctie
x-i18n:
    generated_at: "2026-05-06T09:37:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 113abafae66acd8aaa0302b687ba13347eb44a81a4217b61bb68f07d8a119cb0
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw ondersteunt de Perplexity Search API als een `web_search`-provider.
Deze retourneert gestructureerde resultaten met de velden `title`, `url` en `snippet`.

Voor compatibiliteit ondersteunt OpenClaw ook verouderde Perplexity Sonar/OpenRouter-configuraties.
Als je `OPENROUTER_API_KEY` gebruikt, een `sk-or-...`-sleutel in `plugins.entries.perplexity.config.webSearch.apiKey`, of `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` instelt, schakelt de provider over naar het chat-completions-pad en retourneert AI-gegenereerde antwoorden met bronvermeldingen in plaats van gestructureerde Search API-resultaten.

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

### OpenRouter- / Sonar-compatibiliteit

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

## Waar je de sleutel instelt

**Via configuratie:** voer `openclaw configure --section web` uit. Dit slaat de sleutel op in
`~/.openclaw/openclaw.json` onder `plugins.entries.perplexity.config.webSearch.apiKey`.
Dat veld accepteert ook SecretRef-objecten.

**Via omgeving:** stel `PERPLEXITY_API_KEY` of `OPENROUTER_API_KEY` in
in de procesomgeving van de Gateway. Plaats dit voor een gateway-installatie in
`~/.openclaw/.env` (of in je serviceomgeving). Zie [Omgevingsvariabelen](/nl/help/faq#env-vars-and-env-loading).

Als `provider: "perplexity"` is geconfigureerd en de SecretRef voor de Perplexity-sleutel niet kan worden opgelost zonder env-fallback, mislukt starten/herladen direct.

## Toolparameters

Deze parameters zijn van toepassing op het native Perplexity Search API-pad.

<ParamField path="query" type="string" required>
Zoekopdracht.
</ParamField>

<ParamField path="count" type="number" default="5">
Aantal resultaten om te retourneren (1-10).
</ParamField>

<ParamField path="country" type="string">
2-letterige ISO-landcode (bijv. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1-taalcode (bijv. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Tijdfilter - `day` is 24 uur.
</ParamField>

<ParamField path="date_after" type="string">
Alleen resultaten die na deze datum zijn gepubliceerd (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Alleen resultaten die vóór deze datum zijn gepubliceerd (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Domein-allowlist/denylist-array (max. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Totaal inhoudsbudget (max. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Tokenlimiet per pagina.
</ParamField>

Voor het compatibiliteitspad voor legacy Sonar/OpenRouter:

- `query`, `count` en `freshness` worden geaccepteerd
- `count` is daar alleen voor compatibiliteit; het antwoord is nog steeds één gesynthetiseerd
  antwoord met citaties in plaats van een lijst met N resultaten
- Filters die alleen voor de Search API gelden, zoals `country`, `language`, `date_after`,
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
- Kan geen allowlist en denylist combineren in dezelfde aanvraag
- Gebruik het voorvoegsel `-` voor denylist-vermeldingen (bijv. `["-reddit.com"]`)

## Opmerkingen

- Perplexity Search API retourneert gestructureerde webzoekresultaten (`title`, `url`, `snippet`)
- OpenRouter of expliciete `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` schakelt Perplexity voor compatibiliteit terug naar Sonar-chatvoltooiingen
- Sonar/OpenRouter-compatibiliteit retourneert één gesynthetiseerd antwoord met citaties, geen gestructureerde resultaatrijen
- Resultaten worden standaard 15 minuten gecachet (configureerbaar via `cacheTtlMinutes`)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Web search overview" href="/nl/tools/web" icon="globe">
    Alle providers en regels voor automatische detectie.
  </Card>
  <Card title="Brave search" href="/nl/tools/brave-search" icon="shield">
    Gestructureerde resultaten met land- en taalfilters.
  </Card>
  <Card title="Exa search" href="/nl/tools/exa-search" icon="magnifying-glass">
    Neuraal zoeken met inhoudsextractie.
  </Card>
  <Card title="Perplexity Search API docs" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Officiële quickstart en referentie voor de Perplexity Search API.
  </Card>
</CardGroup>
