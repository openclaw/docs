---
read_when:
    - Je wilt Perplexity Search gebruiken voor zoeken op het web
    - Je moet PERPLEXITY_API_KEY of OPENROUTER_API_KEY hebben ingesteld.
summary: Perplexity Search API en Sonar/OpenRouter-compatibiliteit voor web_search
title: Perplexity-zoekopdracht (verouderd pad)
x-i18n:
    generated_at: "2026-04-29T22:57:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 16
---

# Perplexity Search API

OpenClaw ondersteunt Perplexity Search API als `web_search`-provider.
Deze retourneert gestructureerde resultaten met de velden `title`, `url` en `snippet`.

Voor compatibiliteit ondersteunt OpenClaw ook verouderde Perplexity Sonar-/OpenRouter-configuraties.
Als je `OPENROUTER_API_KEY` gebruikt, een `sk-or-...`-sleutel in `plugins.entries.perplexity.config.webSearch.apiKey` gebruikt, of `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` instelt, schakelt de provider over naar het chat-completions-pad en retourneert deze door AI samengestelde antwoorden met citaties in plaats van gestructureerde Search API-resultaten.

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
in de procesomgeving van de Gateway. Plaats dit voor een Gateway-installatie in
`~/.openclaw/.env` (of in je serviceomgeving). Zie [Omgevingsvariabelen](/nl/help/faq#env-vars-and-env-loading).

Als `provider: "perplexity"` is geconfigureerd en de Perplexity-sleutel-SecretRef niet kan worden opgelost zonder omgevingsfallback, mislukt starten/herladen direct.

## Toolparameters

Deze parameters zijn van toepassing op het native Perplexity Search API-pad.

| Parameter             | Beschrijving                                               |
| --------------------- | ---------------------------------------------------------- |
| `query`               | Zoekopdracht (vereist)                                     |
| `count`               | Aantal resultaten dat moet worden geretourneerd (1-10, standaard: 5) |
| `country`             | 2-letterige ISO-landcode (bijv. "US", "DE")                |
| `language`            | ISO 639-1-taalcode (bijv. "en", "de", "fr")               |
| `freshness`           | Tijdfilter: `day` (24 uur), `week`, `month` of `year`      |
| `date_after`          | Alleen resultaten die na deze datum zijn gepubliceerd (YYYY-MM-DD) |
| `date_before`         | Alleen resultaten die vóór deze datum zijn gepubliceerd (YYYY-MM-DD) |
| `domain_filter`       | Array met domeinen voor allowlist/denylist (max. 20)       |
| `max_tokens`          | Totaal inhoudsbudget (standaard: 25000, max.: 1000000)     |
| `max_tokens_per_page` | Tokenlimiet per pagina (standaard: 2048)                   |

Voor het verouderde Sonar-/OpenRouter-compatibiliteitspad:

- `query`, `count` en `freshness` worden geaccepteerd
- `count` is daar alleen voor compatibiliteit; de respons is nog steeds één samengesteld
  antwoord met citaties in plaats van een lijst met N resultaten
- Filters die alleen voor Search API gelden, zoals `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` en `max_tokens_per_page`,
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

### Domeinfilterregels

- Maximaal 20 domeinen per filter
- Allowlist en denylist kunnen niet in dezelfde aanvraag worden gemengd
- Gebruik het voorvoegsel `-` voor denylist-items (bijv. `["-reddit.com"]`)

## Opmerkingen

- Perplexity Search API retourneert gestructureerde webzoekresultaten (`title`, `url`, `snippet`)
- OpenRouter of expliciete `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` schakelt Perplexity voor compatibiliteit terug naar Sonar chat completions
- Sonar-/OpenRouter-compatibiliteit retourneert één samengesteld antwoord met citaties, geen gestructureerde resultaatrijen
- Resultaten worden standaard 15 minuten gecachet (configureerbaar via `cacheTtlMinutes`)

Zie [Webtools](/nl/tools/web) voor de volledige `web_search`-configuratie.
Zie de [Perplexity Search API-documentatie](https://docs.perplexity.ai/docs/search/quickstart) voor meer details.

## Gerelateerd

- [Perplexity zoeken](/nl/tools/perplexity-search)
- [Web zoeken](/nl/tools/web)
