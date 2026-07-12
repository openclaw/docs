---
read_when:
    - Je wilt webextractie die door Firecrawl wordt ondersteund
    - Je wilt Firecrawl `web_fetch` zonder sleutel
    - Je hebt een Firecrawl-API-sleutel nodig voor zoeken of hogere limieten
    - Je wilt Firecrawl als web_search-provider gebruiken
    - Je wilt anti-botextractie voor web_fetch
summary: Firecrawl-zoekfunctie, scraping en terugvaloptie voor web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T09:29:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw kan **Firecrawl** op drie manieren gebruiken:

- als de `web_search`-provider
- als expliciete Plugin-tools: `firecrawl_search` en `firecrawl_scrape`
- als fallback-extractor voor `web_fetch`

Het is een gehoste extractie- en zoekservice die botomzeiling en caching ondersteunt, wat helpt bij sites die sterk afhankelijk zijn van JS of pagina's die gewone HTTP-ophaalacties blokkeren.

## Plugin installeren

Installeer de officiële Plugin en start daarna de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## `web_fetch` zonder sleutel en API-sleutels

De expliciet geselecteerde gehoste Firecrawl-fallback voor `web_fetch` ondersteunt basistoegang zonder API-sleutel. Voeg `FIRECRAWL_API_KEY` toe aan de Gateway-omgeving of configureer deze wanneer u hogere limieten nodig hebt. Firecrawl `web_search` en `firecrawl_scrape` vereisen een API-sleutel.

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

- Als u Firecrawl kiest tijdens de onboarding of via `openclaw configure --section web`, wordt de geïnstalleerde Firecrawl-Plugin automatisch ingeschakeld.
- `web_search` met Firecrawl ondersteunt `query` en `count`.
- Gebruik `firecrawl_search` voor Firecrawl-specifieke opties zoals `sources`, `categories` of het scrapen van resultaten.
- `baseUrl` gebruikt standaard de gehoste Firecrawl-service op `https://api.firecrawl.dev`. Zelfgehoste alternatieven zijn alleen toegestaan voor privé- of interne eindpunten; HTTP wordt uitsluitend geaccepteerd voor dergelijke privélocaties.
- `FIRECRAWL_BASE_URL` is de gedeelde omgevingsfallback voor de basis-URL's van Firecrawl-zoek- en scrapeverzoeken.
- Firecrawl-zoekverzoeken hebben standaard een time-out van 30 seconden; de parameter `timeoutSeconds` van `firecrawl_search` overschrijft deze per aanroep.

## Firecrawl-fallback voor `web_fetch` configureren

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // expliciete selectie schakelt de fallback zonder sleutel in
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

- De expliciet geselecteerde Firecrawl-fallback voor `web_fetch` werkt zonder API-sleutel. Wanneer deze is geconfigureerd, stuurt OpenClaw `plugins.entries.firecrawl.config.webFetch.apiKey` of `FIRECRAWL_API_KEY` mee voor hogere limieten.
- Als u Firecrawl kiest tijdens de onboarding of via `openclaw configure --section web`, wordt de Plugin ingeschakeld en wordt Firecrawl geselecteerd voor `web_fetch`, tenzij al een andere ophaalprovider is geconfigureerd.
- `firecrawl_scrape` vereist een API-sleutel.
- `maxAgeMs` bepaalt hoe oud gecachete resultaten mogen zijn (ms). De standaardwaarde is 172.800.000 ms (2 dagen).
- `onlyMainContent` is standaard `true`; `timeoutSeconds` is standaard 60.
- Verouderde configuratie onder `tools.web.fetch.firecrawl.*` en `tools.web.search.firecrawl.*` wordt automatisch gemigreerd door `openclaw doctor --fix`.
- Alternatieve URL's voor Firecrawl-scraping en de basis-URL volgen dezelfde regel voor gehoste en privéomgevingen als de zoekfunctie: openbaar gehost verkeer gebruikt `https://api.firecrawl.dev`; zelfgehoste alternatieven moeten verwijzen naar privé- of interne eindpunten.
- `firecrawl_scrape` weigert duidelijk privé-, local-loopback-, metadata- en niet-HTTP(S)-doel-URL's voordat deze naar Firecrawl worden doorgestuurd, overeenkomstig het doelbeveiligingscontract van `web_fetch` voor expliciete Firecrawl-scrapeaanroepen.

`firecrawl_scrape` hergebruikt dezelfde instellingen en omgevingsvariabelen onder `plugins.entries.firecrawl.config.webFetch.*`, inclusief de vereiste API-sleutel.

### Zelfgehoste Firecrawl

Stel `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` of `FIRECRAWL_BASE_URL` in wanneer u Firecrawl zelf uitvoert. OpenClaw accepteert `http://` alleen voor local loopback-, privénetwerk-, `.local`-, `.internal`- of `.localhost`-doelen. Aangepaste openbare hosts worden geweigerd, zodat Firecrawl-API-sleutels niet per ongeluk naar willekeurige eindpunten worden verzonden.

## Firecrawl-Plugin-tools

### `firecrawl_search`

Gebruik dit wanneer u Firecrawl-specifieke zoekopties wilt in plaats van de algemene `web_search`.

Parameters:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gebruik dit voor pagina's die sterk afhankelijk zijn van JS of tegen bots zijn beveiligd en waarvoor gewone `web_fetch` tekortschiet.

Parameters:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealthmodus/botomzeiling

`firecrawl_scrape` en de Firecrawl-fallback voor `web_fetch` gebruiken standaard `proxy: "auto"` en `storeInCache: true`, tenzij de aanroeper deze parameters overschrijft. `firecrawl_search` en de Firecrawl-provider voor `web_search` hebben geen opties voor `proxy`/`storeInCache`; de stealth-proxymodus is alleen van toepassing op scrape- en ophaalverzoeken.

De `proxy`-modus van Firecrawl regelt de botomzeiling (`basic`, `stealth` of `auto`). `auto` probeert het opnieuw met stealth-proxy's als een eenvoudige poging mislukt, wat meer tegoed kan kosten dan scraping met uitsluitend de basismodus.

## Hoe `web_fetch` Firecrawl gebruikt

Extractievolgorde van `web_fetch`:

1. Readability (lokaal)
2. Geconfigureerde ophaalprovider, zoals Firecrawl (wanneer deze is geselecteerd of automatisch is gedetecteerd op basis van geconfigureerde aanmeldgegevens)
3. Eenvoudige HTML-opschoning (laatste fallback)

De selectieoptie is `tools.web.fetch.provider`. Als u deze weglaat, detecteert OpenClaw automatisch de eerste beschikbare provider voor het ophalen van webinhoud op basis van de beschikbare aanmeldgegevens. De officiële Firecrawl-Plugin biedt die fallback.

## Gerelateerd

- [Overzicht van zoeken op het web](/nl/tools/web) -- alle providers en automatische detectie
- [Webinhoud ophalen](/nl/tools/web-fetch) -- de tool `web_fetch` met Firecrawl-fallback
- [Tavily](/nl/tools/tavily) -- tools voor zoeken en extraheren
