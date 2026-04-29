---
read_when:
    - U wilt Grok gebruiken voor web_search
    - Je hebt een XAI_API_KEY nodig om op het web te zoeken
summary: Grok-webzoekopdrachten via xAI-antwoorden met webonderbouwing
title: Grok zoeken
x-i18n:
    generated_at: "2026-04-29T23:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw ondersteunt Grok als `web_search`-provider, met door het web onderbouwde
xAI-antwoorden om door AI gesynthetiseerde antwoorden te produceren die worden
ondersteund door live zoekresultaten met bronvermeldingen.

Dezelfde `XAI_API_KEY` kan ook de ingebouwde `x_search`-tool voor het zoeken naar
X-posts (voorheen Twitter) aansturen. Als je de sleutel opslaat onder
`plugins.entries.xai.config.webSearch.apiKey`, hergebruikt OpenClaw deze nu ook als
fallback voor de gebundelde xAI-modelprovider.

Gebruik voor X-statistieken op postniveau, zoals reposts, antwoorden, bookmarks of
weergaven, bij voorkeur `x_search` met de exacte post-URL of status-ID in plaats
van een brede zoekquery.

## Onboarding en configureren

Als je **Grok** kiest tijdens:

- `openclaw onboard`
- `openclaw configure --section web`

kan OpenClaw een afzonderlijke vervolgstap tonen om `x_search` in te schakelen met dezelfde
`XAI_API_KEY`. Die vervolgstap:

- verschijnt alleen nadat je Grok kiest voor `web_search`
- is geen afzonderlijke web-searchproviderkeuze op topniveau
- kan optioneel het `x_search`-model instellen tijdens dezelfde flow

Als je deze overslaat, kun je `x_search` later inschakelen of wijzigen in de configuratie.

## Een API-sleutel ophalen

<Steps>
  <Step title="Een sleutel maken">
    Haal een API-sleutel op bij [xAI](https://console.x.ai/).
  </Step>
  <Step title="De sleutel opslaan">
    Stel `XAI_API_KEY` in de Gateway-omgeving in, of configureer via:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Omgevingsalternatief:** stel `XAI_API_KEY` in de Gateway-omgeving in.
Plaats deze voor een gatewayinstallatie in `~/.openclaw/.env`.

## Zo werkt het

Grok gebruikt door het web onderbouwde xAI-antwoorden om antwoorden met inline
bronvermeldingen te synthetiseren, vergelijkbaar met de Google Search grounding-aanpak van Gemini.

## Ondersteunde parameters

Grok-zoeken ondersteunt `query`.

`count` wordt geaccepteerd voor gedeelde `web_search`-compatibiliteit, maar Grok retourneert nog steeds
één gesynthetiseerd antwoord met bronvermeldingen in plaats van een lijst met N resultaten.

Providerspecifieke filters worden momenteel niet ondersteund.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [x_search in Web Search](/nl/tools/web#x_search) -- eersteklas X-zoekfunctie via xAI
- [Gemini Search](/nl/tools/gemini-search) -- door AI gesynthetiseerde antwoorden via Google grounding
