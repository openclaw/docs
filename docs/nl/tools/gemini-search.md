---
read_when:
    - Je wilt Gemini gebruiken voor web_search
    - Je hebt een GEMINI_API_KEY of models.providers.google.apiKey nodig
    - Je wilt verankering met Google Search
summary: Gemini-webzoekfunctie met Google Search-verankering
title: Gemini zoeken
x-i18n:
    generated_at: "2026-05-02T11:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw ondersteunt Gemini-modellen met ingebouwde
[Google Search-grounding](https://ai.google.dev/gemini-api/docs/grounding),
die door AI gesynthetiseerde antwoorden retourneert, ondersteund door live Google Search-resultaten met
bronvermeldingen.

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Een sleutel maken">
    Ga naar [Google AI Studio](https://aistudio.google.com/apikey) en maak een
    API-sleutel.
  </Step>
  <Step title="De sleutel opslaan">
    Stel `GEMINI_API_KEY` in de Gateway-omgeving in, hergebruik
    `models.providers.google.apiKey`, of configureer een speciale webzoeksleutel via:

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
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

**Volgorde van referenties:** Gemini-webzoeken gebruikt eerst
`plugins.entries.google.config.webSearch.apiKey`, daarna `GEMINI_API_KEY`,
en daarna `models.providers.google.apiKey`. Voor basis-URL's krijgt de speciale
`plugins.entries.google.config.webSearch.baseUrl` voorrang op
`models.providers.google.baseUrl`.

Plaats omgevingssleutels voor een Gateway-installatie in `~/.openclaw/.env`.

## Hoe het werkt

In tegenstelling tot traditionele zoekproviders die een lijst met links en fragmenten retourneren,
gebruikt Gemini Google Search-grounding om door AI gesynthetiseerde antwoorden met
inline bronvermeldingen te produceren. De resultaten bevatten zowel het gesynthetiseerde antwoord als de bron-
URL's.

- Bronvermeldings-URL's uit Gemini-grounding worden automatisch omgezet van Google
  omleidings-URL's naar directe URL's.
- Omleidingsresolutie gebruikt het SSRF-bewakingspad (HEAD + omleidingscontroles +
  http/https-validatie) voordat de uiteindelijke bronvermeldings-URL wordt geretourneerd.
- Omleidingsresolutie gebruikt strikte SSRF-standaardwaarden, dus omleidingen naar
  private/interne doelen worden geblokkeerd.

## Ondersteunde parameters

Gemini-zoeken ondersteunt `query`, `freshness`, `date_after` en `date_before`.

`count` wordt geaccepteerd voor compatibiliteit met gedeelde `web_search`, maar Gemini-grounding
retourneert nog steeds één gesynthetiseerd antwoord met bronvermeldingen in plaats van een lijst met
N resultaten.

`freshness` accepteert `day`, `week`, `month`, `year` en de gedeelde snelkoppelingen
`pd`, `pw`, `pm` en `py`. OpenClaw zet deze waarden, of een expliciet
`date_after`/`date_before`-bereik, om naar Gemini Google Search-grounding's
`timeRangeFilter`. `country`, `language` en `domain_filter` worden niet ondersteund.

## Modelselectie

Het standaardmodel is `gemini-2.5-flash` (snel en kosteneffectief). Elk Gemini-
model dat grounding ondersteunt, kan worden gebruikt via
`plugins.entries.google.config.webSearch.model`.

## Basis-URL-overschrijvingen

Stel `plugins.entries.google.config.webSearch.baseUrl` in wanneer Gemini-webzoeken
via een operatorproxy of aangepast Gemini-compatibel eindpunt moet verlopen. Als
dat niet is ingesteld, hergebruikt Gemini-webzoeken `models.providers.google.baseUrl`. Een gewone
`https://generativelanguage.googleapis.com`-waarde wordt genormaliseerd naar
`https://generativelanguage.googleapis.com/v1beta`; aangepaste proxypaden blijven
zoals opgegeven nadat afsluitende schuine strepen zijn verwijderd.

## Gerelateerd

- [Web Search-overzicht](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met fragmenten
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten + inhoudsextractie
