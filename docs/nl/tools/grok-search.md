---
read_when:
    - Je wilt Grok gebruiken voor web_search
    - Je wilt xAI OAuth of een XAI_API_KEY gebruiken voor webzoekopdrachten
summary: Grok-webzoekfunctie via xAI-antwoorden op basis van webbronnen
title: Grok-zoekopdracht
x-i18n:
    generated_at: "2026-06-27T18:27:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw ondersteunt Grok als `web_search`-provider en gebruikt xAI-antwoorden met web-grounding om door AI gesynthetiseerde antwoorden te produceren die worden ondersteund door live zoekresultaten met citaties.

Grok-webzoekopdrachten geven de voorkeur aan je bestaande xAI OAuth-aanmelding wanneer die beschikbaar is. Als er geen OAuth-profiel bestaat, kan dezelfde xAI API-sleutel ook de ingebouwde `x_search`-tool voor zoeken naar X-posts (voorheen Twitter) en de `code_execution`-tool aansturen. Als je de sleutel opslaat onder `plugins.entries.xai.config.webSearch.apiKey`, hergebruikt OpenClaw deze ook als fallback voor de gebundelde xAI-modelprovider.

Voor X-metrics op postniveau, zoals reposts, antwoorden, bladwijzers of weergaven, gebruik je bij voorkeur `x_search` met de exacte post-URL of status-ID in plaats van een brede zoekquery.

## Onboarding en configuratie

Als je **Grok** kiest tijdens:

- `openclaw onboard`
- `openclaw configure --section web`

kan OpenClaw een bestaand xAI OAuth-profiel gebruiken zonder om een aparte webzoeksleutel te vragen. Als OAuth niet beschikbaar is, valt het terug op configuratie met een xAI API-sleutel. OpenClaw kan ook een aparte vervolgstap tonen om `x_search` met dezelfde xAI-referentie in te schakelen. Die vervolgstap:

- verschijnt alleen nadat je Grok voor `web_search` kiest
- is geen aparte webzoekproviderkeuze op het hoogste niveau
- kan optioneel het `x_search`-model tijdens dezelfde flow instellen

Als je deze stap overslaat, kun je `x_search` later in de configuratie inschakelen of wijzigen.

## Aanmelden of een API-sleutel verkrijgen

<Steps>
  <Step title="Use xAI OAuth">
    Als je je tijdens onboarding of modelauthenticatie al met xAI hebt aangemeld, kies je Grok als de `web_search`-provider. Er is geen aparte API-sleutel vereist:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use an API key fallback">
    Haal een API-sleutel op bij [xAI](https://console.x.ai/) wanneer OAuth niet beschikbaar is of wanneer je bewust webzoekconfiguratie met een sleutel wilt gebruiken.
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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**Alternatieven voor referenties:** meld je aan met `openclaw models auth login
--provider xai --method oauth`, stel `XAI_API_KEY` in de Gateway-omgeving in,
of sla `plugins.entries.xai.config.webSearch.apiKey` op. Voor een gateway-installatie
plaats je omgevingsvariabelen in `~/.openclaw/.env`.

## Hoe het werkt

Grok gebruikt xAI-antwoorden met web-grounding om antwoorden met inline citaties te synthetiseren, vergelijkbaar met Gemini's benadering voor Google Search-grounding.

## Ondersteunde parameters

Grok-zoekopdrachten ondersteunen `query`.

`count` wordt geaccepteerd voor gedeelde `web_search`-compatibiliteit, maar Grok retourneert nog steeds één gesynthetiseerd antwoord met citaties in plaats van een lijst met N resultaten.

Providerspecifieke filters worden momenteel niet ondersteund.

Grok gebruikt een providerspecifieke standaardtime-out van 60 seconden omdat xAI Responses-webzoekopdrachten met grounding langer kunnen duren dan de gedeelde `web_search`-standaard. Stel `tools.web.search.timeoutSeconds` in om deze te overschrijven.

## Overrides voor basis-URL's

Stel `plugins.entries.xai.config.webSearch.baseUrl` in wanneer Grok-webzoekopdrachten via een operatorproxy of xAI-compatibel Responses-eindpunt moeten lopen. OpenClaw post naar `<baseUrl>/responses` nadat afsluitende schuine strepen zijn verwijderd. `x_search` gebruikt dezelfde fallback voor `webSearch.baseUrl`, tenzij `plugins.entries.xai.config.xSearch.baseUrl` is ingesteld.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [x_search in Web Search](/nl/tools/web#x_search) -- eersteklas X-zoekfunctie via xAI
- [Gemini Search](/nl/tools/gemini-search) -- door AI gesynthetiseerde antwoorden via Google-grounding
