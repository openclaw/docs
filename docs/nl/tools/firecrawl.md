---
read_when:
    - Je wilt webextractie op basis van Firecrawl
    - Je wilt Firecrawl `web_fetch` zonder sleutel
    - Je hebt een Firecrawl API-sleutel nodig voor zoeken of hogere limieten
    - Je wilt Firecrawl als web_search-provider
    - Je wilt anti-botextractie voor web_fetch
summary: Firecrawl-zoeken, scrapen en `web_fetch`-fallback
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:26:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw kan **Firecrawl** op drie manieren gebruiken:

- als de `web_search`-provider
- als expliciete Plugin-tools: `firecrawl_search` en `firecrawl_scrape`
- als fallback-extractor voor `web_fetch`

Het is een gehoste extractie-/zoekservice die bot-omzeiling en caching ondersteunt,
wat helpt bij JS-zware sites of pagina's die gewone HTTP-fetches blokkeren.

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch zonder sleutel en API-sleutels

De expliciet geselecteerde gehoste Firecrawl-`web_fetch`-fallback ondersteunt starterstoegang
zonder API-sleutel. Voeg `FIRECRAWL_API_KEY` toe in de gateway-omgeving
of configureer deze wanneer je hogere limieten nodig hebt. Firecrawl `web_search` en
`firecrawl_scrape` vereisen een API-sleutel.

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

- Firecrawl kiezen tijdens onboarding of `openclaw configure --section web` schakelt de geïnstalleerde Firecrawl-Plugin automatisch in.
- `web_search` met Firecrawl ondersteunt `query` en `count`.
- Gebruik `firecrawl_search` voor Firecrawl-specifieke instellingen zoals `sources`, `categories` of resultaatscraping.
- `baseUrl` gebruikt standaard gehoste Firecrawl op `https://api.firecrawl.dev`. Zelfgehoste overrides zijn alleen toegestaan voor private/interne endpoints; HTTP wordt alleen geaccepteerd voor die private doelen.
- `FIRECRAWL_BASE_URL` is de gedeelde env-fallback voor basis-URL's van Firecrawl-zoek- en scrape-acties.

## Firecrawl web_fetch-fallback configureren

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- De expliciet geselecteerde Firecrawl-`web_fetch`-fallback werkt zonder API-sleutel. Wanneer deze is geconfigureerd, stuurt OpenClaw `plugins.entries.firecrawl.config.webFetch.apiKey` of `FIRECRAWL_API_KEY` voor hogere limieten.
- Firecrawl kiezen tijdens onboarding of `openclaw configure --section web` schakelt de Plugin in en selecteert Firecrawl voor `web_fetch`, tenzij er al een andere fetch-provider is geconfigureerd.
- `firecrawl_scrape` vereist een API-sleutel.
- `maxAgeMs` bepaalt hoe oud gecachte resultaten mogen zijn (ms). De standaardwaarde is 2 dagen.
- Legacy-configuratie `tools.web.fetch.firecrawl.*` wordt automatisch gemigreerd door `openclaw doctor --fix`.
- Firecrawl scrape-/basis-URL-overrides volgen dezelfde hosted/private-regel als zoeken: publiek gehost verkeer gebruikt `https://api.firecrawl.dev`; zelfgehoste overrides moeten naar private/interne endpoints resolven.
- `firecrawl_scrape` weigert duidelijke private, loopback-, metadata- en niet-HTTP(S)-doel-URL's voordat ze naar Firecrawl worden doorgestuurd, in lijn met het doelveiligheidscontract van `web_fetch` voor expliciete Firecrawl-scrape-aanroepen.

`firecrawl_scrape` hergebruikt dezelfde `plugins.entries.firecrawl.config.webFetch.*`-instellingen en env-vars, inclusief de vereiste API-sleutel.

### Zelfgehoste Firecrawl

Stel `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` of `FIRECRAWL_BASE_URL` in
wanneer je Firecrawl zelf draait. OpenClaw accepteert `http://` alleen voor loopback-,
privénetwerk-, `.local`-, `.internal`- of `.localhost`-doelen. Publieke aangepaste
hosts worden geweigerd zodat Firecrawl-API-sleutels niet per ongeluk naar willekeurige endpoints worden gestuurd.

## Firecrawl Plugin-tools

### `firecrawl_search`

Gebruik dit wanneer je Firecrawl-specifieke zoekinstellingen wilt in plaats van generieke `web_search`.

Kernparameters:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gebruik dit voor JS-zware of door bots beschermde pagina's waar gewone `web_fetch` zwak is.

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
OpenClaw gebruikt altijd `proxy: "auto"` plus `storeInCache: true` voor Firecrawl-aanvragen.
Als proxy wordt weggelaten, gebruikt Firecrawl standaard `auto`. `auto` probeert het opnieuw met stealth-proxy's als een basispoging mislukt, wat meer credits kan gebruiken
dan scraping met alleen basic.

## Hoe `web_fetch` Firecrawl gebruikt

Extractievolgorde van `web_fetch`:

1. Readability (lokaal)
2. Firecrawl (wanneer geselecteerd, of automatisch gedetecteerd op basis van geconfigureerde referenties)
3. Basale HTML-opschoning (laatste fallback)

De selectieknop is `tools.web.fetch.provider`. Als je deze weglaat, detecteert OpenClaw
automatisch de eerste gereedstaande web-fetch-provider op basis van beschikbare referenties.
De officiële Firecrawl-Plugin biedt die fallback.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Web Fetch](/nl/tools/web-fetch) -- web_fetch-tool met Firecrawl-fallback
- [Tavily](/nl/tools/tavily) -- zoek- en extractietools
