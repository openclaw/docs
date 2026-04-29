---
read_when:
    - Je wilt Brave Search gebruiken voor web_search
    - Je hebt een BRAVE_API_KEY of abonnementsgegevens nodig
summary: Brave Search API-configuratie voor web_search
title: Brave-zoekopdracht (verouderd pad)
x-i18n:
    generated_at: "2026-04-29T22:24:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw ondersteunt de Brave Search API als `web_search`-provider.

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

Brave-zoekinstellingen die providerspecifiek zijn, staan nu onder `plugins.entries.brave.config.webSearch.*`.
De verouderde `tools.web.search.apiKey` wordt nog steeds geladen via de compatibiliteitsshim, maar dit is niet langer het canonieke configuratiepad.

`webSearch.mode` bepaalt het Brave-transport:

- `web` (standaard): normale Brave-webzoekopdracht met titels, URL's en snippets
- `llm-context`: Brave LLM Context API met vooraf geëxtraheerde tekstfragmenten en bronnen voor onderbouwing

## Toolparameters

| Parameter     | Beschrijving                                                       |
| ------------- | ------------------------------------------------------------------ |
| `query`       | Zoekquery (vereist)                                                |
| `count`       | Aantal resultaten om terug te geven (1-10, standaard: 5)           |
| `country`     | 2-letterige ISO-landcode (bijv. "US", "DE")                        |
| `language`    | ISO 639-1-taalcode voor zoekresultaten (bijv. "en", "de", "fr")   |
| `search_lang` | Brave-zoektaalcode (bijv. `en`, `en-gb`, `zh-hans`)                |
| `ui_lang`     | ISO-taalcode voor UI-elementen                                     |
| `freshness`   | Tijdfilter: `day` (24u), `week`, `month` of `year`                 |
| `date_after`  | Alleen resultaten die na deze datum zijn gepubliceerd (YYYY-MM-DD) |
| `date_before` | Alleen resultaten die vóór deze datum zijn gepubliceerd (YYYY-MM-DD) |

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

- OpenClaw gebruikt het Brave **Search**-abonnement. Als je een verouderd abonnement hebt (bijv. het oorspronkelijke Free-abonnement met 2.000 query's/maand), blijft dit geldig, maar bevat het geen nieuwere functies zoals LLM Context of hogere snelheidslimieten.
- Elk Brave-abonnement bevat **\$5/maand aan gratis tegoed** (vernieuwend). Het Search-abonnement kost \$5 per 1.000 requests, dus het tegoed dekt 1.000 query's/maand. Stel je gebruikslimiet in het Brave-dashboard in om onverwachte kosten te voorkomen. Zie de [Brave API-portal](https://brave.com/search/api/) voor actuele abonnementen.
- Het Search-abonnement bevat het LLM Context-eindpunt en AI-inferentierechten. Resultaten opslaan om modellen te trainen of af te stemmen vereist een abonnement met expliciete opslagrechten. Zie de Brave [Servicevoorwaarden](https://api-dashboard.search.brave.com/terms-of-service).
- De `llm-context`-modus geeft onderbouwde bronvermeldingen terug in plaats van de normale snippetsvorm voor webzoekopdrachten.
- De `llm-context`-modus ondersteunt geen `ui_lang`, `freshness`, `date_after` of `date_before`.
- `ui_lang` moet een regiosubtag bevatten, zoals `en-US`.
- Resultaten worden standaard 15 minuten gecachet (configureerbaar via `cacheTtlMinutes`).

Zie [Webtools](/nl/tools/web) voor de volledige `web_search`-configuratie.

## Gerelateerd

- [Brave-zoekopdracht](/nl/tools/brave-search)
