---
read_when:
    - Je wilt Brave Search gebruiken voor web_search
    - Je hebt een BRAVE_API_KEY of plangegevens nodig
summary: Brave Search-API instellen voor web_search
title: Brave-zoekfunctie
x-i18n:
    generated_at: "2026-04-29T23:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw ondersteunt Brave Search API als een `web_search`-provider.

## Een API-sleutel verkrijgen

1. Maak een Brave Search API-account aan op [https://brave.com/search/api/](https://brave.com/search/api/)
2. Kies in het dashboard het **Search**-abonnement en genereer een API-sleutel.
3. Sla de sleutel op in de configuratie of stel `BRAVE_API_KEY` in de Gateway-omgeving in.

## Configuratievoorbeeld

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Providerspecifieke Brave-zoekinstellingen staan nu onder `plugins.entries.brave.config.webSearch.*`.
De verouderde `tools.web.search.apiKey` wordt nog steeds geladen via de compatibiliteitslaag, maar is niet langer het canonieke configuratiepad.

`webSearch.mode` regelt het Brave-transport:

- `web` (standaard): normale Brave-webzoekopdracht met titels, URL's en fragmenten
- `llm-context`: Brave LLM Context API met vooraf geextraheerde tekstblokken en bronnen voor onderbouwing

## Toolparameters

<ParamField path="query" type="string" required>
Zoekquery.
</ParamField>

<ParamField path="count" type="number" default="5">
Aantal resultaten dat moet worden teruggegeven (1-10).
</ParamField>

<ParamField path="country" type="string">
2-letterige ISO-landcode (bijv. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1-taalcode voor zoekresultaten (bijv. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Brave-zoektaalcode (bijv. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
ISO-taalcode voor UI-elementen.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Tijdfilter — `day` is 24 uur.
</ParamField>

<ParamField path="date_after" type="string">
Alleen resultaten die na deze datum zijn gepubliceerd (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Alleen resultaten die voor deze datum zijn gepubliceerd (`YYYY-MM-DD`).
</ParamField>

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
```

## Opmerkingen

- OpenClaw gebruikt het Brave **Search**-abonnement. Als u een verouderd abonnement hebt (bijv. het oorspronkelijke Free-abonnement met 2.000 query's/maand), blijft dit geldig, maar bevat het geen nieuwere functies zoals LLM Context of hogere snelheidslimieten.
- Elk Brave-abonnement bevat **\$5/maand aan gratis tegoed** (vernieuwend). Het Search-abonnement kost \$5 per 1.000 aanvragen, dus het tegoed dekt 1.000 query's/maand. Stel uw gebruikslimiet in het Brave-dashboard in om onverwachte kosten te voorkomen. Zie het [Brave API-portaal](https://brave.com/search/api/) voor actuele abonnementen.
- Het Search-abonnement bevat het LLM Context-eindpunt en AI-inferentierechten. Voor het opslaan van resultaten om modellen te trainen of af te stemmen is een abonnement met expliciete opslagrechten vereist. Zie de Brave [Servicevoorwaarden](https://api-dashboard.search.brave.com/terms-of-service).
- De modus `llm-context` geeft onderbouwde bronvermeldingen terug in plaats van de normale fragmentvorm van webzoekopdrachten.
- De modus `llm-context` ondersteunt `ui_lang`, `freshness`, `date_after` of `date_before` niet.
- `ui_lang` moet een regio-subtag bevatten, zoals `en-US`.
- Resultaten worden standaard 15 minuten in de cache opgeslagen (configureerbaar via `cacheTtlMinutes`).

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten met domeinfiltering
- [Exa Search](/nl/tools/exa-search) -- neurale zoekopdracht met inhoudsextractie
