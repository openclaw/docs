---
read_when:
    - Je wilt Brave Search gebruiken voor web_search
    - Je hebt een BRAVE_API_KEY of abonnementsgegevens nodig
summary: Brave Search API-configuratie voor web_search
title: Brave-zoekopdracht
x-i18n:
    generated_at: "2026-07-12T09:27:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

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
            mode: "web", // of "llm-context"
            baseUrl: "https://api.search.brave.com", // optionele overschrijving van proxy-/basis-URL
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

Providerspecifieke Brave-zoekinstellingen staan onder `plugins.entries.brave.config.webSearch.*`; dit is het canonieke configuratiepad. Een gedeelde `tools.web.search.apiKey` op het hoogste niveau en een bereikgebonden `tools.web.search.brave.*` worden nog steeds geladen via een compatibiliteitssamenvoeging, maar nieuwe configuraties moeten het bovenstaande Plugin-pad gebruiken.

`webSearch.mode` bepaalt het Brave-transport:

- `web` (standaard): normale Brave-webzoekopdracht met titels, URL's en fragmenten
- `llm-context`: Brave LLM Context API met vooraf geëxtraheerde tekstfragmenten en bronnen voor onderbouwing

`webSearch.baseUrl` kan Brave-aanvragen doorsturen naar een vertrouwde Brave-compatibele proxy
of gateway. OpenClaw voegt `/res/v1/web/search` of `/res/v1/llm/context` toe aan
de geconfigureerde basis-URL en neemt de basis-URL op in de cachesleutel. Openbare
eindpunten moeten `https://` gebruiken; `http://` wordt alleen geaccepteerd voor vertrouwde local loopback-
of proxyd hosts in een privénetwerk.

## Toolparameters

<ParamField path="query" type="string" required>
Zoekopdracht.
</ParamField>

<ParamField path="count" type="number" default="5">
Aantal te retourneren resultaten (1–10).
</ParamField>

<ParamField path="country" type="string">
ISO-landcode van 2 letters (bijvoorbeeld `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1-taalcode voor zoekresultaten (bijvoorbeeld `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Brave-code voor de zoektaal (bijvoorbeeld `en`, `en-gb`, `zh-hans`).
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
// Land- en taalspecifieke zoekopdracht
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
```

## Opmerkingen

- OpenClaw gebruikt het Brave-abonnement **Search**. Als u een ouder abonnement hebt (bijvoorbeeld het oorspronkelijke Free-abonnement met 2.000 zoekopdrachten per maand), blijft dit geldig, maar bevat het geen nieuwere functies zoals LLM Context of hogere snelheidslimieten.
- Elk Brave-abonnement bevat **\$5 per maand aan gratis tegoed** (dat wordt vernieuwd). Het Search-abonnement kost \$5 per 1.000 aanvragen, dus het tegoed dekt 1.000 zoekopdrachten per maand. Stel uw gebruikslimiet in het Brave-dashboard in om onverwachte kosten te voorkomen. Raadpleeg het [Brave API-portaal](https://brave.com/search/api/) voor de huidige abonnementen.
- Het Search-abonnement bevat het LLM Context-eindpunt en rechten voor AI-inferentie. Voor het opslaan van resultaten om modellen te trainen of af te stemmen, is een abonnement met expliciete opslagrechten vereist. Raadpleeg de [servicevoorwaarden](https://api-dashboard.search.brave.com/terms-of-service) van Brave.
- De modus `llm-context` retourneert onderbouwde bronvermeldingen in plaats van de normale fragmentstructuur voor webzoekopdrachten.
- De modus `llm-context` ondersteunt `freshness` en begrensde bereiken met `date_after` + `date_before`. `ui_lang` wordt niet ondersteund; `date_before` zonder `date_after` wordt geweigerd, omdat Brave vereist dat aangepaste actualiteitsbereiken zowel een begin- als een einddatum bevatten.
- `ui_lang` moet een regio-subtag bevatten, zoals `en-US`.
- Resultaten worden standaard 15 minuten in de cache opgeslagen (configureerbaar via `cacheTtlMinutes`).
- Aangepaste waarden voor `webSearch.baseUrl` worden opgenomen in de Brave-cache-identiteit, zodat
  proxyspecifieke antwoorden niet met elkaar conflicteren.
- Schakel de diagnostische vlag `brave.http` in om tijdens probleemoplossing Brave-aanvraag-URL's/queryparameters, antwoordstatus/timing en gebeurtenissen voor treffers, missers en schrijfacties in de zoekcache te loggen. De vlag logt nooit de API-sleutel of antwoordinhoud, maar zoekopdrachten kunnen gevoelig zijn.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten met domeinfiltering
- [Exa Search](/nl/tools/exa-search) -- neuraal zoeken met inhoudsextractie
