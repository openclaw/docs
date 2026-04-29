---
read_when:
    - Je wilt Gemini gebruiken voor web_search
    - Je hebt een GEMINI_API_KEY nodig
    - Je wilt Google Search-onderbouwing
summary: Gemini-webzoekfunctie met onderbouwing via Google Search
title: Gemini zoeken
x-i18n:
    generated_at: "2026-04-29T23:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw ondersteunt Gemini-modellen met ingebouwde
[Google Search-grounding](https://ai.google.dev/gemini-api/docs/grounding),
die door AI gesynthetiseerde antwoorden retourneert die worden ondersteund door live resultaten van Google Search met
citaten.

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Een sleutel maken">
    Ga naar [Google AI Studio](https://aistudio.google.com/apikey) en maak een
    API-sleutel.
  </Step>
  <Step title="De sleutel opslaan">
    Stel `GEMINI_API_KEY` in de Gateway-omgeving in, of configureer via:

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Alternatief via omgeving:** stel `GEMINI_API_KEY` in de Gateway-omgeving in.
Voor een Gateway-installatie zet je dit in `~/.openclaw/.env`.

## Hoe het werkt

In tegenstelling tot traditionele zoekproviders die een lijst met links en fragmenten retourneren,
gebruikt Gemini Google Search-grounding om door AI gesynthetiseerde antwoorden met
inline citaten te produceren. De resultaten bevatten zowel het gesynthetiseerde antwoord als de bron-
URL's.

- Citaat-URL's uit Gemini-grounding worden automatisch omgezet van Google-
  omleidings-URL's naar directe URL's.
- Omleidingsresolutie gebruikt het SSRF-bewakingspad (HEAD + omleidingscontroles +
  http/https-validatie) voordat de uiteindelijke citaat-URL wordt geretourneerd.
- Omleidingsresolutie gebruikt strikte SSRF-standaardinstellingen, waardoor omleidingen naar
  private/interne doelen worden geblokkeerd.

## Ondersteunde parameters

Gemini-zoeken ondersteunt `query`.

`count` wordt geaccepteerd voor gedeelde `web_search`-compatibiliteit, maar Gemini-grounding
retourneert nog steeds één gesynthetiseerd antwoord met citaten in plaats van een lijst met
N resultaten.

Providerspecifieke filters zoals `country`, `language`, `freshness` en
`domain_filter` worden niet ondersteund.

## Modelselectie

Het standaardmodel is `gemini-2.5-flash` (snel en kosteneffectief). Elk Gemini-
model dat grounding ondersteunt, kan worden gebruikt via
`plugins.entries.google.config.webSearch.model`.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met fragmenten
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten + inhoudsextractie
