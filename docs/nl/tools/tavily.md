---
read_when:
    - Je wilt door Tavily ondersteund zoeken op het web
    - Je hebt een Tavily API-sleutel nodig
    - Je wilt Tavily als web_search-aanbieder
    - Je wilt inhoud uit URL's extraheren
summary: Tavily-zoek- en extractietools
title: Tavily
x-i18n:
    generated_at: "2026-04-29T23:26:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 16
---

OpenClaw kan **Tavily** op twee manieren gebruiken:

- als de `web_search`-provider
- als expliciete Plugin-tools: `tavily_search` en `tavily_extract`

Tavily is een zoek-API ontworpen voor AI-toepassingen, die gestructureerde resultaten teruggeeft
die zijn geoptimaliseerd voor LLM-consumptie. Het ondersteunt configureerbare zoekdiepte, onderwerpfiltering, domeinfilters, door AI gegenereerde antwoordsamenvattingen en contentextractie
uit URL's (inclusief door JavaScript gerenderde pagina's).

## Een API-sleutel verkrijgen

1. Maak een Tavily-account aan op [tavily.com](https://tavily.com/).
2. Genereer een API-sleutel in het dashboard.
3. Sla deze op in de configuratie of stel `TAVILY_API_KEY` in de Gateway-omgeving in.

## Tavily-zoekfunctie configureren

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Opmerkingen:

- Tavily kiezen tijdens onboarding of `openclaw configure --section web` schakelt
  de meegeleverde Tavily-Plugin automatisch in.
- Sla Tavily-configuratie op onder `plugins.entries.tavily.config.webSearch.*`.
- `web_search` met Tavily ondersteunt `query` en `count` (tot 20 resultaten).
- Gebruik `tavily_search` voor Tavily-specifieke besturing zoals `search_depth`, `topic`, `include_answer`,
  of domeinfilters.

## Tavily-Plugin-tools

### `tavily_search`

Gebruik dit wanneer je Tavily-specifieke zoekbesturing wilt in plaats van de generieke
`web_search`.

| Parameter         | Beschrijving                                                         |
| ----------------- | -------------------------------------------------------------------- |
| `query`           | Zoekquerytekenreeks (houd onder 400 tekens)                          |
| `search_depth`    | `basic` (standaard, gebalanceerd) of `advanced` (hoogste relevantie, trager) |
| `topic`           | `general` (standaard), `news` (realtime-updates), of `finance`       |
| `max_results`     | Aantal resultaten, 1-20 (standaard: 5)                               |
| `include_answer`  | Neem een door AI gegenereerde antwoordsamenvatting op (standaard: false) |
| `time_range`      | Filter op recentheid: `day`, `week`, `month`, of `year`              |
| `include_domains` | Array met domeinen om resultaten tot te beperken                     |
| `exclude_domains` | Array met domeinen om uit resultaten uit te sluiten                  |

**Zoekdiepte:**

| Diepte     | Snelheid | Relevantie | Beste voor                         |
| ---------- | -------- | ---------- | ---------------------------------- |
| `basic`    | Sneller  | Hoog       | Algemene queries (standaard)       |
| `advanced` | Trager   | Hoogst     | Precisie, specifieke feiten, onderzoek |

### `tavily_extract`

Gebruik dit om schone content uit een of meer URL's te extraheren. Verwerkt
door JavaScript gerenderde pagina's en ondersteunt querygerichte chunking voor gerichte
extractie.

| Parameter           | Beschrijving                                             |
| ------------------- | -------------------------------------------------------- |
| `urls`              | Array met URL's om te extraheren (1-20 per aanvraag)     |
| `query`             | Rangschik geëxtraheerde chunks opnieuw op relevantie voor deze query |
| `extract_depth`     | `basic` (standaard, snel) of `advanced` (voor JS-zware pagina's) |
| `chunks_per_source` | Chunks per URL, 1-5 (vereist `query`)                    |
| `include_images`    | Neem afbeeldings-URL's op in resultaten (standaard: false) |

**Extractiediepte:**

| Diepte     | Wanneer te gebruiken                     |
| ---------- | ---------------------------------------- |
| `basic`    | Eenvoudige pagina's - probeer dit eerst  |
| `advanced` | Door JS gerenderde SPA's, dynamische content, tabellen |

Tips:

- Maximaal 20 URL's per aanvraag. Verdeel grotere lijsten over meerdere aanroepen.
- Gebruik `query` + `chunks_per_source` om alleen relevante content te krijgen in plaats van volledige pagina's.
- Probeer eerst `basic`; val terug op `advanced` als content ontbreekt of onvolledig is.

## Het juiste hulpmiddel kiezen

| Behoefte                              | Tool             |
| ------------------------------------- | ---------------- |
| Snelle webzoekopdracht, geen speciale opties | `web_search`     |
| Zoeken met diepte, onderwerp, AI-antwoorden | `tavily_search`  |
| Content uit specifieke URL's extraheren | `tavily_extract` |

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Firecrawl](/nl/tools/firecrawl) -- zoeken + scrapen met contentextractie
- [Exa Search](/nl/tools/exa-search) -- neurale zoekfunctie met contentextractie
