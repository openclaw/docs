---
read_when:
    - Je wilt Exa gebruiken voor web_search
    - Je hebt een EXA_API_KEY nodig
    - Je wilt neuraal zoeken of inhoudsextractie
summary: Exa AI-zoeken -- neuraal zoeken en zoeken op trefwoorden met inhoudsextractie
title: Exa-zoekopdracht
x-i18n:
    generated_at: "2026-07-12T09:28:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) is een `web_search`-provider met neurale, trefwoord- en
hybride zoekmodi plus ingebouwde inhoudsextractie (markeringen, tekst,
samenvattingen).

## Plugin installeren

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Een account aanmaken">
    Meld u aan bij [exa.ai](https://exa.ai/) en genereer een API-sleutel via uw
    dashboard.
  </Step>
  <Step title="De sleutel opslaan">
    Stel `EXA_API_KEY` in de Gateway-omgeving in of configureer deze via:

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
            apiKey: "exa-...", // optioneel als EXA_API_KEY is ingesteld
            baseUrl: "https://api.exa.ai", // optioneel; OpenClaw voegt /search toe
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

**Alternatief via de omgeving:** stel `EXA_API_KEY` in de Gateway-omgeving in. Plaats
deze voor een Gateway-installatie in `~/.openclaw/.env`. Zie
[Omgevingsvariabelen](/nl/help/faq#env-vars-and-env-loading).

## Basis-URL overschrijven

Stel `plugins.entries.exa.config.webSearch.baseUrl` in om Exa-zoekopdrachten
via een compatibele proxy of een alternatief eindpunt te leiden. OpenClaw
normaliseert kale hosts door `https://` voor te voegen en voegt `/search` toe,
tenzij het pad daar al op eindigt. Het opgeloste eindpunt maakt deel uit van
de sleutel voor de zoekcache, zodat resultaten van verschillende eindpunten
nooit worden gedeeld.

## Toolparameters

<ParamField path="query" type="string" required>
Zoekopdracht.
</ParamField>

<ParamField path="count" type="number" default="5">
Aantal te retourneren resultaten (1-100, afhankelijk van de limieten van het Exa-zoektype).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Zoekmodus.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Tijdfilter. Kan niet worden gecombineerd met `date_after`/`date_before`.
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

Geef een `contents`-object door om de geëxtraheerde inhoud in resultaten te bepalen:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // volledige paginatekst
    highlights: { numSentences: 3 }, // kernzinnen
    summary: true, // AI-samenvatting
  },
});
```

| Inhoudsoptie    | Type                                                                  | Beschrijving                     |
| --------------- | --------------------------------------------------------------------- | -------------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Volledige paginatekst extraheren |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Kernzinnen extraheren             |
| `summary`       | `boolean \| { query }`                                                | Door AI gegenereerde samenvatting |

Als `contents` wordt weggelaten, gebruikt Exa standaard `{ highlights: true }`,
zodat resultaten fragmenten met kernzinnen bevatten. Resultaatbeschrijvingen
worden eerst afgeleid uit markeringen, vervolgens uit de samenvatting en daarna
uit de volledige tekst, afhankelijk van wat het eerst beschikbaar is. Resultaten
behouden ook de onbewerkte velden `highlightScores` en `summary` uit het antwoord
van de Exa-API, indien beschikbaar.

### Zoekmodi

| Modus            | Beschrijving                                 |
| ---------------- | -------------------------------------------- |
| `auto`           | Exa kiest de beste modus (standaard)         |
| `neural`         | Semantisch/op betekenis gebaseerd zoeken     |
| `fast`           | Snel zoeken op trefwoorden                   |
| `deep`           | Grondig diepgaand zoeken                     |
| `deep-reasoning` | Diepgaand zoeken met redenering              |
| `instant`        | Snelste resultaten                           |

## Opmerkingen

- `count` accepteert maximaal 100, afhankelijk van de limieten van het Exa-zoektype.
- Resultaten worden standaard 15 minuten in de cache opgeslagen. Configureer de gedeelde
  `tools.web.search.cacheTtlMinutes` (minuten) en
  `tools.web.search.timeoutSeconds` (standaard 30 s) om de cacheduur en
  time-out van aanvragen voor alle `web_search`-providers, waaronder Exa, te wijzigen.

## Gerelateerd

- [Overzicht van zoeken op het web](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met land-/taalfilters
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten met domeinfiltering
