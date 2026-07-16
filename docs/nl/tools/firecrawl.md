---
read_when:
    - Je wilt webextractie met Firecrawl als backend
    - Je wilt Firecrawl Search zonder sleutel (gratis) of `web_fetch` zonder sleutel
    - Je hebt een Firecrawl-API-sleutel nodig voor zoeken of hogere limieten
    - Je wilt Firecrawl als web_search-provider gebruiken
    - Je wilt anti-botextractie voor web_fetch
summary: Firecrawl-zoekfunctie, scraping en terugvaloptie voor web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T16:38:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw kan **Firecrawl** op drie manieren gebruiken:

- als de `web_search`-provider
- als expliciete plugintools: `firecrawl_search` en `firecrawl_scrape`
- als fallback-extractor voor `web_fetch`

Het is een gehoste extractie- en zoekservice die botomzeiling en caching ondersteunt, wat helpt bij sites die sterk afhankelijk zijn van JS of pagina's die gewone HTTP-ophaalverzoeken blokkeren.

## Plugin installeren

Installeer de officiële plugin en start daarna de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Sleutelloze toegang en API-sleutels

Firecrawl registreert twee `web_search`-providers:

- **Firecrawl Search** (`firecrawl`) — gebruikt de gehoste `/v2/search`-API met jouw
  sleutel; wordt automatisch gedetecteerd wanneer er een sleutel aanwezig is.
- **Firecrawl Search (Free)** (`firecrawl-free`) — gebruikt het gehoste sleutelloze
  starterspakket; er is geen API-sleutel vereist. Dit is **alleen op expliciete basis** en wordt nooit automatisch geselecteerd, omdat
  selectie ervan jouw zoekopdrachten naar het gratis pakket van Firecrawl stuurt.

De expliciet geselecteerde Firecrawl-fallback voor `web_fetch` is eveneens sleutelloos. Voor de
expliciete tools `firecrawl_search` en `firecrawl_scrape` is een API-sleutel vereist. Voeg
`FIRECRAWL_API_KEY` toe aan de Gateway-omgeving of configureer deze voor hogere limieten.

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

- Als je Firecrawl kiest tijdens de onboarding of in `openclaw configure --section web`, wordt de geïnstalleerde Firecrawl-plugin automatisch ingeschakeld.
- Kies **Firecrawl Search (Free)** tijdens de onboarding (of stel `provider: "firecrawl-free"` in) om sleutelloos en zonder API-sleutel te werken. De provider **Firecrawl Search** met sleutel verzendt `plugins.entries.firecrawl.config.webSearch.apiKey` of `FIRECRAWL_API_KEY`.
- `web_search` met Firecrawl ondersteunt `query` en `count`.
- Gebruik `firecrawl_search` voor Firecrawl-specifieke opties zoals `sources`, `categories` of het scrapen van resultaten.
- `baseUrl` gebruikt standaard de gehoste Firecrawl op `https://api.firecrawl.dev`. Zelfgehoste overschrijvingen zijn alleen toegestaan voor privé- of interne eindpunten; HTTP wordt alleen voor die privétargets geaccepteerd.
- `FIRECRAWL_BASE_URL` is de gedeelde omgevingsfallback voor de basis-URL's van Firecrawl-zoeken en -scrapen.
- Firecrawl-zoekverzoeken hebben standaard een time-out van 30 seconden; de parameter `timeoutSeconds` van `firecrawl_search` overschrijft deze per aanroep.

## Firecrawl-fallback voor web_fetch configureren

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // expliciete selectie schakelt de sleutelloze fallback in
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

- De expliciet geselecteerde Firecrawl-fallback voor `web_fetch` werkt zonder API-sleutel. Wanneer deze is geconfigureerd, verzendt OpenClaw `plugins.entries.firecrawl.config.webFetch.apiKey` of `FIRECRAWL_API_KEY` voor hogere limieten.
- Als je Firecrawl kiest tijdens de onboarding of in `openclaw configure --section web`, wordt de plugin ingeschakeld en Firecrawl geselecteerd voor `web_fetch`, tenzij er al een andere ophaalprovider is geconfigureerd.
- Voor `firecrawl_scrape` is een API-sleutel vereist.
- `maxAgeMs` bepaalt hoe oud gecachte resultaten mogen zijn (ms). De standaardwaarde is 172.800.000 ms (2 dagen).
- `onlyMainContent` is standaard `true`; `timeoutSeconds` is standaard 60.
- Verouderde configuratie voor `tools.web.fetch.firecrawl.*` en `tools.web.search.firecrawl.*` wordt automatisch gemigreerd door `openclaw doctor --fix`.
- Overschrijvingen van de scrape- en basis-URL van Firecrawl volgen dezelfde gehost/privé-regel als zoeken: openbaar gehost verkeer gebruikt `https://api.firecrawl.dev`; zelfgehoste overschrijvingen moeten naar privé- of interne eindpunten worden omgezet.
- `firecrawl_scrape` weigert duidelijke privé-, loopback- en metadata-URL's en doel-URL's die geen HTTP(S) gebruiken voordat deze naar Firecrawl worden doorgestuurd, overeenkomstig het veiligheidscontract voor targets van `web_fetch` voor expliciete Firecrawl-scrapeaanroepen.

`firecrawl_scrape` hergebruikt dezelfde `plugins.entries.firecrawl.config.webFetch.*`-instellingen en omgevingsvariabelen, inclusief de vereiste API-sleutel.

### Zelfgehoste Firecrawl

Stel `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` of `FIRECRAWL_BASE_URL` in wanneer je Firecrawl zelf uitvoert. OpenClaw accepteert `http://` alleen voor loopback-, privénetwerk-, `.local`-, `.internal`- of `.localhost`-targets. Aangepaste openbare hosts worden geweigerd, zodat Firecrawl-API-sleutels niet per ongeluk naar willekeurige eindpunten worden verzonden.

## Tools van de Firecrawl-plugin

### `firecrawl_search`

Gebruik dit wanneer je Firecrawl-specifieke zoekopties wilt in plaats van de algemene `web_search`. Hiervoor is een API-sleutel vereist.

Parameters:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (alleen hostnamen; sluiten elkaar uit)
- `tbs` (tijdfilter, bijvoorbeeld `qdr:d`, `qdr:w`, `sbd:1`)
- `location` en `country` (geografische targeting)
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

## Stealth / botomzeiling

`firecrawl_scrape` en de Firecrawl-fallback voor `web_fetch` gebruiken standaard `proxy: "auto"` plus `storeInCache: true`, tenzij de aanroeper die parameters overschrijft. `firecrawl_search` en de Firecrawl-provider voor `web_search` hebben geen opties voor `proxy`/`storeInCache`; de stealth-proxymodus is alleen van toepassing op scrape- en ophaalverzoeken.

De `proxy`-modus van Firecrawl regelt botomzeiling (`basic`, `stealth` of `auto`). `auto` probeert het opnieuw met stealth-proxy's als een basispoging mislukt, wat meer credits kan verbruiken dan scrapen met alleen de basismodus.

## Hoe `web_fetch` Firecrawl gebruikt

Extractievolgorde van `web_fetch`:

1. Readability (lokaal)
2. Geconfigureerde ophaalprovider, zoals Firecrawl (wanneer geselecteerd of automatisch gedetecteerd op basis van geconfigureerde referenties)
3. Eenvoudige HTML-opschoning (laatste fallback)

De selectie-instelling is `tools.web.fetch.provider`. Als je deze weglaat, detecteert OpenClaw automatisch de eerste beschikbare web-ophaalprovider op basis van de beschikbare referenties. De officiële Firecrawl-plugin biedt die fallback.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Web Fetch](/nl/tools/web-fetch) -- web_fetch-tool met Firecrawl-fallback
- [Tavily](/nl/tools/tavily) -- tools voor zoeken en extraheren
