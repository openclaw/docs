---
read_when:
    - Je wilt een webzoekprovider waarvoor geen API-sleutel nodig is
    - Je wilt DuckDuckGo gebruiken voor web_search
    - Je hebt een zoekfallback zonder configuratie nodig
summary: DuckDuckGo-webzoekfunctie -- fallbackprovider zonder sleutel (experimenteel, op HTML gebaseerd)
title: DuckDuckGo-zoekopdracht
x-i18n:
    generated_at: "2026-05-06T09:35:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw ondersteunt DuckDuckGo als **sleutelloze** `web_search`-provider. Er is geen API-
sleutel of account vereist.

<Warning>
  DuckDuckGo is een **experimentele, onofficiële** integratie die resultaten ophaalt
  uit DuckDuckGo's zoekpagina's zonder JavaScript - geen officiële API. Houd rekening met
  incidentele uitval door bot-challengepagina's of HTML-wijzigingen.
</Warning>

## Installatie

Geen API-sleutel nodig - stel DuckDuckGo gewoon in als je provider:

<Steps>
  <Step title="Configureren">
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
Zoekquery.
</ParamField>

<ParamField path="count" type="number" default="5">
Te retourneren resultaten (1-10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo-regiocode (bijv. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch-niveau.
</ParamField>

Regio en SafeSearch kunnen ook worden ingesteld in de Plugin-configuratie (zie hierboven) - tool
parameters overschrijven configuratiewaarden per query.

## Opmerkingen

- **Geen API-sleutel** - werkt direct, zonder configuratie
- **Experimenteel** - verzamelt resultaten uit DuckDuckGo's HTML-zoekpagina's zonder JavaScript,
  niet uit een officiële API of SDK
- **Risico op bot-challenges** - DuckDuckGo kan CAPTCHA's tonen of verzoeken blokkeren
  bij intensief of geautomatiseerd gebruik
- **HTML-parsing** - resultaten hangen af van de paginstructuur, die zonder
  kennisgeving kan wijzigen
- **Volgorde voor automatische detectie** - DuckDuckGo is de eerste sleutelloze fallback
  (volgorde 100) bij automatische detectie. API-gebaseerde providers met geconfigureerde sleutels worden
  eerst uitgevoerd, daarna Ollama Web Search (volgorde 110), daarna SearXNG (volgorde 200)
- **SafeSearch staat standaard op moderate** wanneer dit niet is geconfigureerd

<Tip>
  Overweeg voor productiegebruik [Brave Search](/nl/tools/brave-search) (gratis laag
  beschikbaar) of een andere API-gebaseerde provider.
</Tip>

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met gratis laag
- [Exa Search](/nl/tools/exa-search) -- neurale zoekfunctie met contentextractie
