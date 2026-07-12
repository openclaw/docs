---
read_when:
    - Je wilt Gemini gebruiken voor web_search
    - Je hebt een GEMINI_API_KEY of models.providers.google.apiKey nodig
    - U wilt onderbouwing met Google Search
summary: Gemini-webzoekopdracht met Google Search-onderbouwing
title: Gemini-zoekopdracht
x-i18n:
    generated_at: "2026-07-12T09:23:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw ondersteunt Gemini-modellen met ingebouwde
[Google Search-grounding](https://ai.google.dev/gemini-api/docs/grounding),
die door AI samengestelde antwoorden retourneert die worden onderbouwd door actuele Google Search-resultaten met
bronvermeldingen.

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Een sleutel maken">
    Ga naar [Google AI Studio](https://aistudio.google.com/apikey) en maak een
    API-sleutel.
  </Step>
  <Step title="De sleutel opslaan">
    Stel `GEMINI_API_KEY` in de Gateway-omgeving in, hergebruik
    `models.providers.google.apiKey` of configureer als volgt een afzonderlijke sleutel voor zoeken op internet:

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

**Volgorde van aanmeldgegevens:** Zoeken op internet met Gemini gebruikt eerst
`plugins.entries.google.config.webSearch.apiKey`, vervolgens `GEMINI_API_KEY`
en daarna `models.providers.google.apiKey`. Voor basis-URL's heeft de afzonderlijke
`plugins.entries.google.config.webSearch.baseUrl` voorrang op
`models.providers.google.baseUrl`.

Plaats bij een Gateway-installatie omgevingssleutels in `~/.openclaw/.env`.

## Werking

In tegenstelling tot traditionele zoekproviders die een lijst met koppelingen en fragmenten retourneren,
gebruikt Gemini Google Search-grounding om door AI samengestelde antwoorden met
inline bronvermeldingen te produceren. De resultaten bevatten zowel het samengestelde antwoord als de URL's van de
bronnen.

- URL's van bronvermeldingen uit Gemini-grounding worden automatisch omgezet van Google-
  omleidings-URL's naar directe URL's via een HEAD-verzoek door het tegen SSRF beveiligde
  ophaalpad van OpenClaw (omleidingen volgen, http/https-validatie).
- Voor het oplossen van omleidingen gelden strikte standaardinstellingen tegen SSRF, waardoor omleidingen naar
  privé- of interne doelen worden geblokkeerd.

## Ondersteunde parameters

Zoeken met Gemini ondersteunt `query`, `freshness`, `date_after` en `date_before`.

`count` wordt geaccepteerd voor compatibiliteit met de gedeelde `web_search`, maar Gemini-grounding
retourneert nog steeds één samengesteld antwoord met bronvermeldingen in plaats van een lijst met
N resultaten.

`freshness` accepteert `day`, `week`, `month`, `year` en de gedeelde snelkoppelingen
`pd`, `pw`, `pm` en `py`. `day`/`pd` voegt een recentheidsinstructie toe aan de Gemini-
zoekopdracht in plaats van een strikt bereik van 24 uur. `week`, `month`, `year` en expliciete
bereiken met `date_after`/`date_before` stellen de
`timeRangeFilter` van Gemini Google Search-grounding in. `country`, `language` en `domain_filter` worden niet ondersteund.

## Modelselectie

Het standaardmodel is `gemini-2.5-flash` (snel en kosteneffectief). Elk Gemini-
model dat grounding ondersteunt, kan worden gebruikt via
`plugins.entries.google.config.webSearch.model`.

## Basis-URL's overschrijven

Stel `plugins.entries.google.config.webSearch.baseUrl` in wanneer zoeken op internet met Gemini
via een proxy van de beheerder of een aangepast Gemini-compatibel eindpunt moet worden geleid. Als
dit niet is ingesteld, hergebruikt zoeken op internet met Gemini `models.providers.google.baseUrl`. Een gewone
waarde `https://generativelanguage.googleapis.com` wordt genormaliseerd naar
`https://generativelanguage.googleapis.com/v1beta`; aangepaste proxypaden blijven
ongewijzigd nadat afsluitende schuine strepen zijn verwijderd.

## Gerelateerd

- [Overzicht van zoeken op internet](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met fragmenten
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten + inhoudsextractie
