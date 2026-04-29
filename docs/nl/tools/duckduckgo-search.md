---
read_when:
    - Je wilt een webzoekprovider waarvoor geen API-sleutel vereist is
    - Je wilt DuckDuckGo gebruiken voor web_search
    - Je hebt een zoekfallback zonder configuratie nodig
summary: DuckDuckGo-webzoekfunctie -- fallbackprovider zonder sleutel (experimenteel, gebaseerd op HTML)
title: DuckDuckGo-zoekopdracht
x-i18n:
    generated_at: "2026-04-29T23:22:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw ondersteunt DuckDuckGo als **sleutelvrije** `web_search`-provider. Er is geen API-sleutel of account vereist.

<Warning>
  DuckDuckGo is een **experimentele, onofficiële** integratie die resultaten ophaalt
  uit de niet-JavaScript-zoekpagina's van DuckDuckGo — geen officiële API. Verwacht
  incidentele storingen door botchallengepagina's of HTML-wijzigingen.
</Warning>

## Instellen

Geen API-sleutel nodig — stel DuckDuckGo gewoon in als je provider:

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
Zoekopdracht.
</ParamField>

<ParamField path="count" type="number" default="5">
Te retourneren resultaten (1–10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo-regiocode (bijv. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch-niveau.
</ParamField>

Regio en SafeSearch kunnen ook worden ingesteld in de Plugin-configuratie (zie hierboven) — toolparameters overschrijven configuratiewaarden per query.

## Opmerkingen

- **Geen API-sleutel** — werkt direct, zonder configuratie
- **Experimenteel** — verzamelt resultaten van de niet-JavaScript-HTML-zoekpagina's
  van DuckDuckGo, niet van een officiële API of SDK
- **Risico op botchallenges** — DuckDuckGo kan CAPTCHA's tonen of verzoeken blokkeren
  bij intensief of geautomatiseerd gebruik
- **HTML-parsering** — resultaten zijn afhankelijk van de paginastructuur, die zonder
  kennisgeving kan veranderen
- **Volgorde van automatische detectie** — DuckDuckGo is de eerste sleutelvrije fallback
  (volgorde 100) in automatische detectie. API-ondersteunde providers met geconfigureerde sleutels worden
  eerst uitgevoerd, daarna Ollama Web Search (volgorde 110), daarna SearXNG (volgorde 200)
- **SafeSearch staat standaard op moderate** wanneer niet geconfigureerd

<Tip>
  Overweeg voor productiegebruik [Brave Search](/nl/tools/brave-search) (gratis laag
  beschikbaar) of een andere API-ondersteunde provider.
</Tip>

## Gerelateerd

- [Overzicht Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met gratis laag
- [Exa Search](/nl/tools/exa-search) -- neurale zoekfunctie met inhoudsextractie
