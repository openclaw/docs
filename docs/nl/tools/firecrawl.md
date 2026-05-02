---
read_when:
    - Je wilt webextractie op basis van Firecrawl
    - Je hebt een Firecrawl API-sleutel nodig
    - Je wilt Firecrawl als web_search-aanbieder
    - Je wilt anti-bot-extractie voor web_fetch
summary: Firecrawl zoeken, scrapen en web_fetch-terugval
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T11:29:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw kan **Firecrawl** op drie manieren gebruiken:

- als de `web_search`-provider
- als expliciete Plugin-tools: `firecrawl_search` en `firecrawl_scrape`
- als fallback-extractor voor `web_fetch`

Het is een gehoste extractie-/zoekdienst die bot-omzeiling en caching ondersteunt,
wat helpt bij sites met veel JS of pagina's die gewone HTTP-fetches blokkeren.

## Een API-sleutel ophalen

1. Maak een Firecrawl-account aan en genereer een API-sleutel.
2. Sla deze op in de configuratie of stel `FIRECRAWL_API_KEY` in de Gateway-omgeving in.

## Firecrawl-zoekfunctie configureren

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Opmerkingen:

- Firecrawl kiezen tijdens onboarding of met `openclaw configure --section web` schakelt de gebundelde Firecrawl-Plugin automatisch in.
- `web_search` met Firecrawl ondersteunt `query` en `count`.
- Gebruik `firecrawl_search` voor Firecrawl-specifieke besturing zoals `sources`, `categories` of het scrapen van resultaten.
- `baseUrl` gebruikt standaard de gehoste Firecrawl op `https://api.firecrawl.dev`. Zelfgehoste overrides zijn alleen toegestaan voor private/interne endpoints; HTTP wordt alleen geaccepteerd voor die private doelen.
- `FIRECRAWL_BASE_URL` is de gedeelde env-fallback voor basis-URL's voor Firecrawl-zoeken en -scrapen.

## Firecrawl-scrape + web_fetch-fallback configureren

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Opmerkingen:

- Firecrawl-fallbackpogingen worden alleen uitgevoerd wanneer een API-sleutel beschikbaar is (`plugins.entries.firecrawl.config.webFetch.apiKey` of `FIRECRAWL_API_KEY`).
- `maxAgeMs` bepaalt hoe oud gecachte resultaten mogen zijn (ms). De standaardwaarde is 2 dagen.
- Verouderde `tools.web.fetch.firecrawl.*`-configuratie wordt automatisch gemigreerd door `openclaw doctor --fix`.
- Overrides voor Firecrawl-scrape-/basis-URL's volgen dezelfde regel voor gehost/privaat als zoeken: publiek gehost verkeer gebruikt `https://api.firecrawl.dev`; zelfgehoste overrides moeten verwijzen naar private/interne endpoints.
- `firecrawl_scrape` weigert duidelijke private, loopback-, metadata- en niet-HTTP(S)-doel-URL's voordat ze naar Firecrawl worden doorgestuurd, conform het doelveiligheidscontract van `web_fetch` voor expliciete Firecrawl-scrape-aanroepen.

`firecrawl_scrape` hergebruikt dezelfde `plugins.entries.firecrawl.config.webFetch.*`-instellingen en env-vars.

### Zelfgehoste Firecrawl

Stel `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` of `FIRECRAWL_BASE_URL` in
wanneer je Firecrawl zelf draait. OpenClaw accepteert `http://` alleen voor loopback-,
privénetwerk-, `.local`-, `.internal`- of `.localhost`-doelen. Publieke aangepaste
hosts worden geweigerd zodat Firecrawl-API-sleutels niet per ongeluk naar willekeurige
endpoints worden verzonden.

## Firecrawl-Plugin-tools

### `firecrawl_search`

Gebruik dit wanneer je Firecrawl-specifieke zoekbesturing wilt in plaats van generieke `web_search`.

Kernparameters:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gebruik dit voor pagina's met veel JS of botbescherming waarvoor gewone `web_fetch` zwak is.

Kernparameters:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / bot-omzeiling

Firecrawl biedt een parameter voor **proxy-modus** voor bot-omzeiling (`basic`, `stealth` of `auto`).
OpenClaw gebruikt altijd `proxy: "auto"` plus `storeInCache: true` voor Firecrawl-verzoeken.
Als proxy wordt weggelaten, gebruikt Firecrawl standaard `auto`. `auto` probeert opnieuw met stealth-proxy's als een basispoging mislukt, wat meer credits kan gebruiken
dan scrapen met alleen basic.

## Hoe `web_fetch` Firecrawl gebruikt

Extractievolgorde van `web_fetch`:

1. Readability (lokaal)
2. Firecrawl (indien geselecteerd of automatisch gedetecteerd als de actieve web-fetch-fallback)
3. Basis-HTML-opschoning (laatste fallback)

De selectieknop is `tools.web.fetch.provider`. Als je deze weglaat, detecteert OpenClaw
automatisch de eerste beschikbare web-fetch-provider op basis van beschikbare referenties.
Vandaag is de gebundelde provider Firecrawl.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Web Fetch](/nl/tools/web-fetch) -- web_fetch-tool met Firecrawl-fallback
- [Tavily](/nl/tools/tavily) -- zoek- en extractietools
