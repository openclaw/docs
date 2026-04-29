---
read_when:
    - Je wilt Exa gebruiken voor web_search
    - Je hebt een EXA_API_KEY nodig
    - Je wilt neurale zoekfunctie of contentextractie
summary: Exa AI-zoekfunctie -- neurale zoekfunctie en zoeken op trefwoorden met contentextractie
title: Exa zoeken
x-i18n:
    generated_at: "2026-04-29T23:22:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw ondersteunt [Exa AI](https://exa.ai/) als `web_search`-provider. Exa
biedt neurale, trefwoord- en hybride zoekmodi met ingebouwde inhoudsextractie
(highlights, tekst, samenvattingen).

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Een account aanmaken">
    Meld je aan op [exa.ai](https://exa.ai/) en genereer een API-sleutel vanuit je
    dashboard.
  </Step>
  <Step title="De sleutel opslaan">
    Stel `EXA_API_KEY` in de Gateway-omgeving in, of configureer via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuratie

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternatief via omgeving:** stel `EXA_API_KEY` in de Gateway-omgeving in.
Voor een gateway-installatie plaats je dit in `~/.openclaw/.env`.

## Toolparameters

<ParamField path="query" type="string" required>
Zoekquery.
</ParamField>

<ParamField path="count" type="number">
Te retourneren resultaten (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Zoekmodus.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Tijdfilter.
</ParamField>

<ParamField path="date_after" type="string">
Resultaten na deze datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Resultaten vóór deze datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opties voor inhoudsextractie (zie hieronder).
</ParamField>

### Inhoudsextractie

Exa kan geëxtraheerde inhoud naast zoekresultaten retourneren. Geef een `contents`-
object door om dit in te schakelen:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Inhoudsoptie   | Type                                                                  | Beschrijving                      |
| -------------- | --------------------------------------------------------------------- | --------------------------------- |
| `text`         | `boolean \| { maxCharacters }`                                        | Volledige paginatekst extraheren |
| `highlights`   | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Kernzinnen extraheren             |
| `summary`      | `boolean \| { query }`                                                | Door AI gegenereerde samenvatting |

### Zoekmodi

| Modus            | Beschrijving                                  |
| ---------------- | -------------------------------------------- |
| `auto`           | Exa kiest de beste modus (standaard)         |
| `neural`         | Semantische/betekenisgebaseerde zoekopdracht |
| `fast`           | Snelle trefwoordzoekopdracht                 |
| `deep`           | Grondige diepgaande zoekopdracht             |
| `deep-reasoning` | Diepgaande zoekopdracht met redenering       |
| `instant`        | Snelste resultaten                           |

## Opmerkingen

- Als er geen `contents`-optie wordt opgegeven, gebruikt Exa standaard `{ highlights: true }`,
  zodat resultaten fragmenten van kernzinnen bevatten
- Resultaten behouden de velden `highlightScores` en `summary` uit de Exa API-
  respons wanneer beschikbaar
- Resultaatbeschrijvingen worden eerst uit highlights afgeleid, daarna uit de samenvatting en daarna uit
  volledige tekst — wat er ook beschikbaar is
- `freshness` en `date_after`/`date_before` kunnen niet worden gecombineerd — gebruik één
  tijdfiltermodus
- Er kunnen maximaal 100 resultaten per query worden geretourneerd (afhankelijk van de limieten voor
  het Exa-zoektype)
- Resultaten worden standaard 15 minuten gecachet (configureerbaar via
  `cacheTtlMinutes`)
- Exa is een officiële API-integratie met gestructureerde JSON-responsen

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met land-/taalfilters
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten met domeinfiltering
