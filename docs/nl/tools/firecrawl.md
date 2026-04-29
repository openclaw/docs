---
read_when:
    - Je wilt webextractie op basis van Firecrawl
    - Je hebt een Firecrawl API-sleutel nodig
    - Je wilt Firecrawl als web_search-aanbieder
    - Je wilt anti-bot-extractie voor web_fetch
summary: Firecrawl-zoeken, scrapen en web_fetch-terugval
title: Firecrawl
x-i18n:
    generated_at: "2026-04-29T23:23:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw kan **Firecrawl** op drie manieren gebruiken:

- als de `web_search`-provider
- als expliciete Plugin-tools: `firecrawl_search` en `firecrawl_scrape`
- als fallback-extractor voor `web_fetch`

Het is een gehoste extractie-/zoekservice die bot-omzeiling en caching ondersteunt,
wat helpt bij JS-zware sites of pagina's die gewone HTTP-fetches blokkeren.

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

- Als je Firecrawl kiest tijdens onboarding of met `openclaw configure --section web`, wordt de gebundelde Firecrawl-Plugin automatisch ingeschakeld.
- `web_search` met Firecrawl ondersteunt `query` en `count`.
- Gebruik `firecrawl_search` voor Firecrawl-specifieke bediening zoals `sources`, `categories` of het scrapen van resultaten.
- `baseUrl`-overschrijvingen moeten op `https://api.firecrawl.dev` blijven.
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

- Firecrawl-fallbackpogingen worden alleen uitgevoerd wanneer er een API-sleutel beschikbaar is (`plugins.entries.firecrawl.config.webFetch.apiKey` of `FIRECRAWL_API_KEY`).
- `maxAgeMs` bepaalt hoe oud gecachte resultaten mogen zijn (ms). De standaardwaarde is 2 dagen.
- Verouderde `tools.web.fetch.firecrawl.*`-configuratie wordt automatisch gemigreerd door `openclaw doctor --fix`.
- Firecrawl-scrape-/basis-URL-overschrijvingen zijn beperkt tot `https://api.firecrawl.dev`.

`firecrawl_scrape` hergebruikt dezelfde instellingen en env-vars uit `plugins.entries.firecrawl.config.webFetch.*`.

## Firecrawl-Plugin-tools

### `firecrawl_search`

Gebruik dit wanneer je Firecrawl-specifieke zoekbediening wilt in plaats van generieke `web_search`.

Kernparameters:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gebruik dit voor JS-zware of bot-beveiligde pagina's waar gewone `web_fetch` zwak is.

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

Firecrawl stelt een parameter voor **proxy-modus** beschikbaar voor bot-omzeiling (`basic`, `stealth` of `auto`).
OpenClaw gebruikt altijd `proxy: "auto"` plus `storeInCache: true` voor Firecrawl-verzoeken.
Als proxy wordt weggelaten, gebruikt Firecrawl standaard `auto`. `auto` probeert opnieuw met stealth-proxy's als een basispoging mislukt, wat meer credits kan gebruiken
dan scrapen met alleen basic.

## Hoe `web_fetch` Firecrawl gebruikt

Extractievolgorde van `web_fetch`:

1. Readability (lokaal)
2. Firecrawl (indien geselecteerd of automatisch gedetecteerd als de actieve web-fetch-fallback)
3. Basale HTML-opschoning (laatste fallback)

De selectieknop is `tools.web.fetch.provider`. Als je deze weglaat, detecteert OpenClaw
automatisch de eerste beschikbare web-fetch-provider op basis van beschikbare referenties.
Vandaag is de gebundelde provider Firecrawl.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Web Fetch](/nl/tools/web-fetch) -- web_fetch-tool met Firecrawl-fallback
- [Tavily](/nl/tools/tavily) -- zoek- en extractietools
