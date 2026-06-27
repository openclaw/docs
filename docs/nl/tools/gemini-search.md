---
read_when:
    - Je wilt Gemini gebruiken voor web_search
    - Je hebt een GEMINI_API_KEY of models.providers.google.apiKey nodig
    - U wilt Google Search-grounding
summary: Gemini-webzoekfunctie met grounding via Google Search
title: Gemini-zoekopdracht
x-i18n:
    generated_at: "2026-06-27T18:26:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw ondersteunt Gemini-modellen met ingebouwde
[Google Search-grounding](https://ai.google.dev/gemini-api/docs/grounding),
die door AI gesynthetiseerde antwoorden retourneert die worden onderbouwd door live Google Search-resultaten met
bronvermeldingen.

## Een API-sleutel ophalen

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

**Voorrang van inloggegevens:** Gemini-webzoekfunctie gebruikt
`plugins.entries.google.config.webSearch.apiKey` eerst, daarna `GEMINI_API_KEY`,
en daarna `models.providers.google.apiKey`. Voor basis-URL's krijgt de speciale
`plugins.entries.google.config.webSearch.baseUrl` voorrang op
`models.providers.google.baseUrl`.

Voor een Gateway-installatie plaats je omgevingssleutels in `~/.openclaw/.env`.

## Hoe het werkt

In tegenstelling tot traditionele zoekproviders die een lijst met links en snippets retourneren,
gebruikt Gemini Google Search-grounding om door AI gesynthetiseerde antwoorden met
inline bronvermeldingen te produceren. De resultaten bevatten zowel het gesynthetiseerde antwoord als de bron-
URL's.

- Bronvermeldings-URL's uit Gemini-grounding worden automatisch omgezet van Google-
  omleidings-URL's naar directe URL's.
- Omleidingsresolutie gebruikt het SSRF-beveiligingspad (HEAD + omleidingscontroles +
  http/https-validatie) voordat de uiteindelijke bronvermeldings-URL wordt geretourneerd.
- Omleidingsresolutie gebruikt strikte SSRF-standaardinstellingen, zodat omleidingen naar
  privé/interne doelen worden geblokkeerd.

## Ondersteunde parameters

Gemini-zoeken ondersteunt `query`, `freshness`, `date_after` en `date_before`.

`count` wordt geaccepteerd voor gedeelde `web_search`-compatibiliteit, maar Gemini-grounding
retourneert nog steeds één gesynthetiseerd antwoord met bronvermeldingen in plaats van een lijst met N
resultaten.

`freshness` accepteert `day`, `week`, `month`, `year` en de gedeelde snelkoppelingen
`pd`, `pw`, `pm` en `py`. `day`/`pd` voegt een recentheidsinstructie toe aan de Gemini-
query in plaats van een harde periode van 24 uur. `week`, `month`, `year` en expliciete
`date_after`/`date_before`-bereiken stellen Gemini Google Search-grounding's
`timeRangeFilter` in. `country`, `language` en `domain_filter` worden niet ondersteund.

## Modelselectie

Het standaardmodel is `gemini-2.5-flash` (snel en kosteneffectief). Elk Gemini-
model dat grounding ondersteunt, kan worden gebruikt via
`plugins.entries.google.config.webSearch.model`.

## Overschrijvingen van basis-URL's

Stel `plugins.entries.google.config.webSearch.baseUrl` in wanneer Gemini-webzoekfunctie
via een operatorproxy of aangepast Gemini-compatibel eindpunt moet lopen. Als
dat niet is ingesteld, hergebruikt Gemini-webzoekfunctie `models.providers.google.baseUrl`. Een gewone
`https://generativelanguage.googleapis.com`-waarde wordt genormaliseerd naar
`https://generativelanguage.googleapis.com/v1beta`; aangepaste proxypaden blijven
zoals opgegeven nadat afsluitende slashes zijn verwijderd.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met snippets
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten + inhoudsextractie
