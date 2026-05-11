---
read_when:
    - Je wilt Grok gebruiken voor web_search
    - Je hebt een XAI_API_KEY nodig om op het web te zoeken
summary: Grok-webzoekfunctie via door webbronnen onderbouwde xAI-antwoorden
title: Grok zoeken
x-i18n:
    generated_at: "2026-05-11T20:52:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw ondersteunt Grok als `web_search`-provider en gebruikt xAI-webgegronde
antwoorden om door AI gesynthetiseerde antwoorden te produceren, ondersteund door live zoekresultaten
met citaties.

Dezelfde xAI-API-sleutel kan ook de ingebouwde `x_search`-tool voor X
(voorheen Twitter) berichtzoekopdrachten en de `code_execution`-tool aandrijven. Als je de
sleutel opslaat onder `plugins.entries.xai.config.webSearch.apiKey`, gebruikt OpenClaw deze nu ook
als fallback voor de gebundelde xAI-modelprovider.

Voor X-metrics op berichtniveau, zoals reposts, antwoorden, bladwijzers of weergaven, geef je de voorkeur aan
`x_search` met de exacte bericht-URL of status-ID in plaats van een brede zoekopdracht.

## Onboarding en configureren

Als je **Grok** kiest tijdens:

- `openclaw onboard`
- `openclaw configure --section web`

kan OpenClaw een afzonderlijke vervolgstap tonen om `x_search` met dezelfde
`XAI_API_KEY` in te schakelen. Die vervolgstap:

- verschijnt alleen nadat je Grok voor `web_search` kiest
- is geen afzonderlijke webzoekproviderkeuze op het hoogste niveau
- kan optioneel het `x_search`-model tijdens dezelfde flow instellen

Als je deze overslaat, kun je `x_search` later in de configuratie inschakelen of wijzigen.

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Create a key">
    Haal een API-sleutel op bij [xAI](https://console.x.ai/).
  </Step>
  <Step title="Store the key">
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
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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
Voor een gateway-installatie zet je deze in `~/.openclaw/.env`.

## Hoe het werkt

Grok gebruikt xAI-webgegronde antwoorden om antwoorden met inline
citaties te synthetiseren, vergelijkbaar met de Google Search-groundingaanpak van Gemini.

## Ondersteunde parameters

Grok-zoekopdrachten ondersteunen `query`.

`count` wordt geaccepteerd voor gedeelde `web_search`-compatibiliteit, maar Grok
retourneert nog steeds één gesynthetiseerd antwoord met citaties in plaats van een lijst met N resultaten.

Providerspecifieke filters worden momenteel niet ondersteund.

Grok gebruikt een providerspecifieke standaardtime-out van 60 seconden, omdat xAI Responses
webgegronde zoekopdrachten langer kunnen duren dan de gedeelde `web_search`-standaard. Stel
`tools.web.search.timeoutSeconds` in om deze te overschrijven.

## Base-URL-overschrijvingen

Stel `plugins.entries.xai.config.webSearch.baseUrl` in wanneer Grok-webzoekopdrachten via een operatorproxy of xAI-compatibel Responses-eindpunt moeten
lopen. OpenClaw
post naar `<baseUrl>/responses` na het verwijderen van afsluitende slashes. `x_search`
gebruikt dezelfde `webSearch.baseUrl`-fallback, tenzij
`plugins.entries.xai.config.xSearch.baseUrl` is ingesteld.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [x_search in Web Search](/nl/tools/web#x_search) -- eersteklas X-zoekfunctie via xAI
- [Gemini Search](/nl/tools/gemini-search) -- door AI gesynthetiseerde antwoorden via Google-grounding
