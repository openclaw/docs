---
read_when:
    - Je wilt Exa gebruiken voor web_search
    - Je hebt een EXA_API_KEY nodig
    - Je wilt neuraal zoeken of contentextractie
summary: Exa AI-zoekfunctie -- neurale zoekfunctie en zoeken op trefwoorden met inhoudsextractie
title: Exa-zoekfunctie
x-i18n:
    generated_at: "2026-05-02T11:29:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2ddf83c5130208eadc78eccb10aebf67af11b05690d75a817d6999f79be5fc3
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw ondersteunt [Exa AI](https://exa.ai/) als `web_search`-provider. Exa
biedt neurale, trefwoord- en hybride zoekmodi met ingebouwde contentextractie
(highlights, tekst, samenvattingen).

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Een account maken">
    Registreer je op [exa.ai](https://exa.ai/) en genereer een API-sleutel via je
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
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**Omgevingsalternatief:** stel `EXA_API_KEY` in de Gateway-omgeving in.
Voor een gateway-installatie plaats je dit in `~/.openclaw/.env`.

## Base-URL overschrijven

Stel `plugins.entries.exa.config.webSearch.baseUrl` in wanneer Exa-zoekverzoeken
via een compatibele proxy of alternatief Exa-eindpunt moeten lopen. OpenClaw
normaliseert kale hosts door `https://` ervoor te zetten en voegt `/search` toe, tenzij het
pad daar al op eindigt. Het opgeloste eindpunt wordt opgenomen in de zoekcache-
sleutel, zodat resultaten van verschillende Exa-eindpunten niet worden gedeeld.

## Toolparameters

<ParamField path="query" type="string" required>
Zoekquery.
</ParamField>

<ParamField path="count" type="number">
Aantal te retourneren resultaten (1-100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Zoekmodus.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Tijdsfilter.
</ParamField>

<ParamField path="date_after" type="string">
Resultaten na deze datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Resultaten vóór deze datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opties voor contentextractie (zie hieronder).
</ParamField>

### Contentextractie

Exa kan geëxtraheerde content naast zoekresultaten retourneren. Geef een `contents`-
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

| Contents-optie | Type                                                                  | Beschrijving                         |
| --------------- | --------------------------------------------------------------------- | ------------------------------------ |
| `text`          | `boolean \| { maxCharacters }`                                        | Volledige paginatekst extraheren     |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Kernzinnen extraheren                |
| `summary`       | `boolean \| { query }`                                                | Door AI gegenereerde samenvatting    |

### Zoekmodi

| Modus            | Beschrijving                                  |
| ---------------- | --------------------------------------------- |
| `auto`           | Exa kiest de beste modus (standaard)          |
| `neural`         | Semantisch/betekenisgebaseerd zoeken          |
| `fast`           | Snel zoeken op trefwoorden                    |
| `deep`           | Grondig diep zoeken                           |
| `deep-reasoning` | Diep zoeken met redeneren                     |
| `instant`        | Snelste resultaten                            |

## Opmerkingen

- Als er geen `contents`-optie is opgegeven, gebruikt Exa standaard `{ highlights: true }`
  zodat resultaten fragmenten van kernzinnen bevatten
- Resultaten behouden `highlightScores`- en `summary`-velden uit de Exa API-
  respons wanneer beschikbaar
- Resultaatbeschrijvingen worden eerst uit highlights bepaald, daarna uit de samenvatting en daarna
  uit de volledige tekst, afhankelijk van wat beschikbaar is
- `freshness` en `date_after`/`date_before` kunnen niet worden gecombineerd; gebruik één
  tijdsfiltermodus
- Er kunnen maximaal 100 resultaten per query worden geretourneerd (afhankelijk van Exa-zoektype-
  limieten)
- Resultaten worden standaard 15 minuten gecachet (configureerbaar via
  `cacheTtlMinutes`)
- Exa is een officiële API-integratie met gestructureerde JSON-responsen

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met filters voor land/taal
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten met domeinfiltering
