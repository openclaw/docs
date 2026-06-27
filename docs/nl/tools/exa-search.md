---
read_when:
    - Je wilt Exa gebruiken voor web_search
    - Je hebt een EXA_API_KEY nodig
    - Je wilt neurale zoekfunctionaliteit of contentextractie
summary: Exa AI-zoekfunctie -- neurale zoekfunctie en trefwoordzoekfunctie met contentextractie
title: Exa-zoekfunctie
x-i18n:
    generated_at: "2026-06-27T18:25:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw ondersteunt [Exa AI](https://exa.ai/) als `web_search`-provider. Exa
biedt neurale, trefwoord- en hybride zoekmodi met ingebouwde inhoudsextractie
(highlights, tekst, samenvattingen).

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Maak een account aan">
    Registreer je op [exa.ai](https://exa.ai/) en genereer een API-sleutel vanuit je
    dashboard.
  </Step>
  <Step title="Sla de sleutel op">
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
Plaats dit voor een Gateway-installatie in `~/.openclaw/.env`.

## Base-URL overschrijven

Stel `plugins.entries.exa.config.webSearch.baseUrl` in wanneer Exa-zoekverzoeken
via een compatibele proxy of alternatief Exa-eindpunt moeten lopen. OpenClaw
normaliseert kale hosts door `https://` ervoor te plaatsen en voegt `/search`
toe, tenzij het pad daar al op eindigt. Het opgeloste eindpunt wordt opgenomen
in de zoekcache-sleutel, zodat resultaten van verschillende Exa-eindpunten niet
worden gedeeld.

## Toolparameters

<ParamField path="query" type="string" required>
Zoekquery.
</ParamField>

<ParamField path="count" type="number">
Terug te geven resultaten (1-100).
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

Exa kan geëxtraheerde inhoud naast zoekresultaten teruggeven. Geef een
`contents`-object door om dit in te schakelen:

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

| Inhoudsoptie    | Type                                                                  | Beschrijving                         |
| --------------- | --------------------------------------------------------------------- | ------------------------------------ |
| `text`          | `boolean \| { maxCharacters }`                                        | Extraheer volledige paginatekst      |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extraheer kernzinnen                 |
| `summary`       | `boolean \| { query }`                                                | Door AI gegenereerde samenvatting    |

### Zoekmodi

| Modus            | Beschrijving                                      |
| ---------------- | ------------------------------------------------- |
| `auto`           | Exa kiest de beste modus (standaard)              |
| `neural`         | Semantische/op betekenis gebaseerde zoekopdracht  |
| `fast`           | Snelle trefwoordzoekopdracht                      |
| `deep`           | Grondige deep search                              |
| `deep-reasoning` | Deep search met reasoning                         |
| `instant`        | Snelste resultaten                                |

## Opmerkingen

- Als er geen `contents`-optie wordt opgegeven, gebruikt Exa standaard `{ highlights: true }`,
  zodat resultaten fragmenten van kernzinnen bevatten
- Resultaten behouden de velden `highlightScores` en `summary` uit de Exa API-
  response wanneer beschikbaar
- Resultaatbeschrijvingen worden eerst uit highlights opgelost, daarna uit de samenvatting en daarna
  uit volledige tekst — afhankelijk van wat beschikbaar is
- `freshness` en `date_after`/`date_before` kunnen niet worden gecombineerd — gebruik één
  tijdfiltermodus
- Per query kunnen maximaal 100 resultaten worden teruggegeven (afhankelijk van de
  limieten van het Exa-zoektype)
- Resultaten worden standaard 15 minuten gecachet (configureerbaar via
  `cacheTtlMinutes`)
- Exa is een officiële API-integratie met gestructureerde JSON-responses

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met land-/taalfilters
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten met domeinfiltering
