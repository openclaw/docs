---
read_when:
    - Je wilt Brave Search gebruiken voor web_search
    - Je hebt een BRAVE_API_KEY of abonnementsgegevens nodig
summary: Brave Search API-configuratie voor web_search
title: Brave-zoekfunctie
x-i18n:
    generated_at: "2026-05-02T11:28:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ecb9e3e5475bb26f4058311429b558f49cdd1df907a622f93f297ac6569d65
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw ondersteunt Brave Search API als `web_search`-aanbieder.

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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

Brave-zoekinstellingen die specifiek zijn voor de aanbieder staan nu onder `plugins.entries.brave.config.webSearch.*`.
De verouderde `tools.web.search.apiKey` wordt nog steeds geladen via de compatibiliteitsshim, maar is niet langer het canonieke configuratiepad.

`webSearch.mode` regelt het Brave-transport:

- `web` (standaard): normale Brave-webzoekopdracht met titels, URL's en fragmenten
- `llm-context`: Brave LLM Context API met vooraf geëxtraheerde tekstblokken en bronnen voor onderbouwing

`webSearch.baseUrl` kan Brave-verzoeken naar een vertrouwde Brave-compatibele proxy
of Gateway sturen. OpenClaw voegt `/res/v1/web/search` of `/res/v1/llm/context` toe aan
de geconfigureerde basis-URL en behoudt de basis-URL in de cachesleutel. Openbare
eindpunten moeten `https://` gebruiken; `http://` wordt alleen geaccepteerd voor vertrouwde loopback-
of privénetwerkproxyhosts.

## Toolparameters

<ParamField path="query" type="string" required>
Zoekopdracht.
</ParamField>

<ParamField path="count" type="number" default="5">
Aantal resultaten om terug te geven (1-10).
</ParamField>

<ParamField path="country" type="string">
ISO-landcode van 2 letters (bijv. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1-taalcode voor zoekresultaten (bijv. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Brave-code voor zoektaal (bijv. `en`, `en-gb`, `zh-hans`).
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
Alleen resultaten die vóór deze datum zijn gepubliceerd (`YYYY-MM-DD`).
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

- OpenClaw gebruikt het Brave **Search**-abonnement. Als je een verouderd abonnement hebt (bijv. het oorspronkelijke Free-abonnement met 2.000 query's/maand), blijft dit geldig, maar het bevat geen nieuwere functies zoals LLM Context of hogere snelheidslimieten.
- Elk Brave-abonnement bevat **\$5/maand aan gratis tegoed** (verlengend). Het Search-abonnement kost \$5 per 1.000 verzoeken, dus het tegoed dekt 1.000 query's/maand. Stel je gebruikslimiet in het Brave-dashboard in om onverwachte kosten te voorkomen. Zie de [Brave API-portal](https://brave.com/search/api/) voor actuele abonnementen.
- Het Search-abonnement bevat het LLM Context-eindpunt en rechten voor AI-inferentie. Voor het opslaan van resultaten om modellen te trainen of af te stemmen is een abonnement met expliciete opslagrechten vereist. Zie de Brave [Servicevoorwaarden](https://api-dashboard.search.brave.com/terms-of-service).
- De `llm-context`-modus geeft onderbouwde bronvermeldingen terug in plaats van de normale fragmentstructuur voor webzoekopdrachten.
- De `llm-context`-modus ondersteunt `freshness` en begrensde bereiken met `date_after` + `date_before`. Deze modus ondersteunt geen `ui_lang`; `date_before` zonder `date_after` wordt geweigerd omdat Brave vereist dat aangepaste versheidsbereiken zowel een begin- als einddatum bevatten.
- `ui_lang` moet een regio-subtag bevatten, zoals `en-US`.
- Resultaten worden standaard 15 minuten gecachet (configureerbaar via `cacheTtlMinutes`).
- Aangepaste `webSearch.baseUrl`-waarden worden opgenomen in de Brave-cache-identiteit, zodat
  proxy-specifieke antwoorden niet botsen.
- Schakel de diagnosevlag `brave.http` in om Brave-verzoek-URL's/queryparameters, antwoordstatus/timing en hit/miss/schrijfgebeurtenissen van de zoekcache te loggen tijdens probleemoplossing. De vlag logt nooit de API-sleutel of antwoordbody's, maar zoekopdrachten kunnen gevoelig zijn.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle aanbieders en automatische detectie
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten met domeinfiltering
- [Exa Search](/nl/tools/exa-search) -- neurale zoekfunctie met inhoudsextractie
