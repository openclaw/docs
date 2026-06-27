---
read_when:
    - Je wilt een webzoekprovider die geen API-sleutel vereist
    - Je wilt DuckDuckGo gebruiken voor web_search
    - Je wilt een expliciet geselecteerde zoekprovider zonder sleutel
summary: DuckDuckGo-webzoekopdracht -- provider zonder sleutel (experimenteel, HTML-gebaseerd)
title: DuckDuckGo-zoekopdracht
x-i18n:
    generated_at: "2026-06-27T18:25:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw ondersteunt DuckDuckGo als **sleutelvrije** `web_search`-provider. Er is geen API-sleutel of account vereist.

<Warning>
  DuckDuckGo is een **experimentele, onofficiële** integratie die resultaten
  ophaalt uit de niet-JavaScript-zoekpagina's van DuckDuckGo - geen officiële API. Houd
  rekening met incidentele defecten door bot-challengepagina's of HTML-wijzigingen.
</Warning>

## Installatie

Geen API-sleutel nodig - stel DuckDuckGo gewoon in als je provider:

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Configuratie

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Optionele instellingen op Plugin-niveau voor regio en SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Toolparameters

<ParamField path="query" type="string" required>
Zoekopdracht.
</ParamField>

<ParamField path="count" type="number" default="5">
Aantal resultaten om terug te geven (1-10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo-regiocode (bijv. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch-niveau.
</ParamField>

Regio en SafeSearch kunnen ook worden ingesteld in de Plugin-configuratie (zie hierboven) - toolparameters overschrijven configuratiewaarden per zoekopdracht.

## Opmerkingen

- **Geen API-sleutel** - werkt nadat je DuckDuckGo als je `web_search`-provider hebt geselecteerd
- **Experimenteel** - verzamelt resultaten uit de niet-JavaScript-HTML-zoekpagina's van DuckDuckGo, niet uit een officiële API of SDK
- **Risico op bot-challenges** - DuckDuckGo kan CAPTCHA's tonen of verzoeken blokkeren bij intensief of geautomatiseerd gebruik
- **HTML-parsing** - resultaten zijn afhankelijk van de paginastructuur, die zonder kennisgeving kan wijzigen
- **Expliciete selectie** - OpenClaw kiest DuckDuckGo niet automatisch wanneer er geen API-ondersteunde provider is geconfigureerd
- **SafeSearch is standaard moderate** wanneer dit niet is geconfigureerd

<Tip>
  Overweeg voor productiegebruik [Brave Search](/nl/tools/brave-search) (gratis niveau beschikbaar) of een andere API-ondersteunde provider.
</Tip>

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met gratis niveau
- [Exa Search](/nl/tools/exa-search) -- neurale zoekfunctie met inhoudsextractie
