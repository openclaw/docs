---
read_when:
    - Je wilt Perplexity Search gebruiken om op het web te zoeken
    - Je moet PERPLEXITY_API_KEY of OPENROUTER_API_KEY instellen
summary: Perplexity Search API en Sonar/OpenRouter-compatibiliteit voor web_search
title: Perplexity-zoekopdracht
x-i18n:
    generated_at: "2026-07-12T09:30:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw ondersteunt de Perplexity Search API als `web_search`-provider. Deze retourneert gestructureerde resultaten met de velden `title`, `url` en `snippet`.

Voor compatibiliteit ondersteunt OpenClaw ook verouderde configuraties voor Perplexity Sonar/OpenRouter. Als u `OPENROUTER_API_KEY` gebruikt, een `sk-or-...`-sleutel in `plugins.entries.perplexity.config.webSearch.apiKey` opgeeft of `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` instelt, schakelt de provider over naar het pad voor chatvoltooiingen en retourneert deze door AI samengestelde antwoorden met bronverwijzingen in plaats van gestructureerde resultaten van de Search API.

## Plugin installeren

Installeer de officiële Plugin en start daarna de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Een Perplexity API-sleutel verkrijgen

1. Maak een Perplexity-account aan op [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Genereer een API-sleutel in het dashboard.
3. Sla de sleutel op in de configuratie of stel `PERPLEXITY_API_KEY` in de Gateway-omgeving in.

## OpenRouter-compatibiliteit

Als u OpenRouter al gebruikte voor Perplexity Sonar, behoudt u `provider: "perplexity"` en stelt u `OPENROUTER_API_KEY` in de Gateway-omgeving in, of slaat u een `sk-or-...`-sleutel op in `plugins.entries.perplexity.config.webSearch.apiKey`.

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

### OpenRouter-/Sonar-compatibiliteit

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

## Waar u de sleutel instelt

**Via de configuratie:** voer `openclaw configure --section web` uit. Hiermee wordt de sleutel in `~/.openclaw/openclaw.json` opgeslagen onder `plugins.entries.perplexity.config.webSearch.apiKey`. Dit veld accepteert ook SecretRef-objecten.

**Via de omgeving:** stel `PERPLEXITY_API_KEY` of `OPENROUTER_API_KEY` in de procesomgeving van de Gateway in. Plaats deze bij een Gateway-installatie in `~/.openclaw/.env` (of in uw serviceomgeving). Zie [Omgevingsvariabelen](/nl/help/faq#env-vars-and-env-loading).

Als `provider: "perplexity"` is geconfigureerd en de SecretRef voor de Perplexity-sleutel niet kan worden omgezet en er geen terugvaloptie via een omgevingsvariabele is, mislukt het opstarten of opnieuw laden onmiddellijk.

## Hulpprogrammaparameters

Deze parameters zijn van toepassing op het native Perplexity Search API-pad.

<ParamField path="query" type="string" required>
Zoekopdracht.
</ParamField>

<ParamField path="count" type="number" default="5">
Aantal te retourneren resultaten (1-10).
</ParamField>

<ParamField path="country" type="string">
ISO-landcode van twee letters (bijvoorbeeld `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1-taalcode (bijvoorbeeld `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Tijdfilter: `day` is 24 uur.
</ParamField>

<ParamField path="date_after" type="string">
Alleen resultaten die na deze datum zijn gepubliceerd (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Alleen resultaten die vóór deze datum zijn gepubliceerd (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Array met toegestane of geblokkeerde domeinen (maximaal 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Totaal inhoudsbudget (maximaal 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Tokenlimiet per pagina.
</ParamField>

Voor het verouderde compatibiliteitspad voor Sonar/OpenRouter:

- `query`, `count` en `freshness` worden geaccepteerd.
- `count` is daar uitsluitend bedoeld voor compatibiliteit; het antwoord bestaat nog steeds uit één samengesteld antwoord met bronverwijzingen in plaats van een lijst met N resultaten.
- Filters die alleen voor de Search API beschikbaar zijn (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) retourneren expliciete fouten.

**Voorbeelden:**

```javascript
// Zoekopdracht voor een specifiek land en een specifieke taal
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recente resultaten (afgelopen week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Zoeken binnen een datumbereik
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domeinen filteren (toegestane lijst)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domeinen filteren (blokkeerlijst: gebruik het voorvoegsel -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Meer inhoud extraheren
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regels voor domeinfilters

- Maximaal 20 domeinen per filter.
- Vermeldingen uit een toegestane lijst en een blokkeerlijst kunnen niet in dezelfde aanvraag worden gecombineerd.
- Gebruik het voorvoegsel `-` voor vermeldingen in de blokkeerlijst (bijvoorbeeld `["-reddit.com"]`).

## Opmerkingen

- De Perplexity Search API retourneert gestructureerde webzoekresultaten (`title`, `url`, `snippet`).
- OpenRouter, of een expliciete `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, schakelt Perplexity voor compatibiliteit terug naar Sonar-chatvoltooiingen.
- De compatibiliteitsmodus voor Sonar/OpenRouter retourneert één samengesteld antwoord met bronverwijzingen, geen gestructureerde resultaatrijen.
- Resultaten worden standaard 15 minuten in de cache bewaard (configureerbaar via `cacheTtlMinutes`).

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Overzicht van zoeken op het web" href="/nl/tools/web" icon="globe">
    Alle providers en regels voor automatische detectie.
  </Card>
  <Card title="Zoeken met Brave" href="/nl/tools/brave-search" icon="shield">
    Gestructureerde resultaten met land- en taalfilters.
  </Card>
  <Card title="Zoeken met Exa" href="/nl/tools/exa-search" icon="magnifying-glass">
    Neuraal zoeken met inhoudsextractie.
  </Card>
  <Card title="Documentatie voor de Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Officiële snelstart en naslaginformatie voor de Perplexity Search API.
  </Card>
</CardGroup>
