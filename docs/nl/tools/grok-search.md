---
read_when:
    - Je wilt Grok gebruiken voor web_search
    - Je hebt een XAI_API_KEY nodig voor zoeken op het web
summary: Grok-webzoekfunctie via op het web gebaseerde antwoorden van xAI
title: Grok zoeken
x-i18n:
    generated_at: "2026-05-02T11:29:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw ondersteunt Grok als `web_search`-provider, met webgegronde
antwoorden van xAI om door AI gesynthetiseerde antwoorden te produceren die worden ondersteund door live zoekresultaten
met citaties.

Dezelfde `XAI_API_KEY` kan ook de ingebouwde `x_search`-tool aandrijven voor het zoeken naar X
(voorheen Twitter)-berichten. Als je de sleutel opslaat onder
`plugins.entries.xai.config.webSearch.apiKey`, gebruikt OpenClaw die nu ook opnieuw als
fallback voor de gebundelde xAI-modelprovider.

Voor X-metrics op berichtniveau, zoals reposts, reacties, bookmarks of views, gebruik bij voorkeur
`x_search` met de exacte bericht-URL of status-ID in plaats van een brede
zoekquery.

## Onboarding en configureren

Als je **Grok** kiest tijdens:

- `openclaw onboard`
- `openclaw configure --section web`

kan OpenClaw een aparte vervolgstap tonen om `x_search` in te schakelen met dezelfde
`XAI_API_KEY`. Die vervolgstap:

- verschijnt alleen nadat je Grok kiest voor `web_search`
- is geen aparte webzoekproviderkeuze op het hoogste niveau
- kan optioneel het `x_search`-model instellen tijdens dezelfde flow

Als je die overslaat, kun je `x_search` later in de configuratie inschakelen of wijzigen.

## Een API-sleutel verkrijgen

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

**Alternatief via omgeving:** stel `XAI_API_KEY` in de Gateway-omgeving in.
Voor een gatewayinstallatie plaats je die in `~/.openclaw/.env`.

## Hoe het werkt

Grok gebruikt webgegronde antwoorden van xAI om antwoorden te synthetiseren met inline
citaties, vergelijkbaar met Gemini's benadering voor Google Search-grounding.

## Ondersteunde parameters

Grok Search ondersteunt `query`.

`count` wordt geaccepteerd voor gedeelde `web_search`-compatibiliteit, maar Grok retourneert nog steeds
één gesynthetiseerd antwoord met citaties in plaats van een lijst met N resultaten.

Providerspecifieke filters worden momenteel niet ondersteund.

Grok gebruikt een providerspecifieke standaardtime-out van 60 seconden, omdat xAI Responses
webgegronde zoekopdrachten langer kunnen duren dan de gedeelde standaardwaarde van `web_search`. Stel
`tools.web.search.timeoutSeconds` in om dit te overschrijven.

## Basis-URL overschrijven

Stel `plugins.entries.xai.config.webSearch.baseUrl` in wanneer Grok-webzoekopdrachten moeten
worden gerouteerd via een operatorproxy of een xAI-compatibel Responses-eindpunt. OpenClaw
post naar `<baseUrl>/responses` nadat afsluitende slashes zijn verwijderd. `x_search`
gebruikt dezelfde fallback via `webSearch.baseUrl`, tenzij
`plugins.entries.xai.config.xSearch.baseUrl` is ingesteld.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [x_search in Web Search](/nl/tools/web#x_search) -- eersteklas X-zoekfunctie via xAI
- [Gemini Search](/nl/tools/gemini-search) -- door AI gesynthetiseerde antwoorden via Google-grounding
