---
read_when:
    - Je wilt een URL ophalen en leesbare inhoud extraheren
    - Je moet web_fetch of de Firecrawl-terugvaloptie configureren
    - Je wilt de limieten en cachewerking van web_fetch begrijpen
sidebarTitle: Web Fetch
summary: web_fetch-hulpmiddel -- HTTP-ophaalactie met extractie van leesbare inhoud
title: Web ophalen
x-i18n:
    generated_at: "2026-05-02T11:31:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

De tool `web_fetch` voert een gewone HTTP GET uit en extraheert leesbare inhoud
(HTML naar markdown of tekst). Hij voert **geen** JavaScript uit.

Gebruik voor JS-zware sites of pagina's achter een login in plaats daarvan de
[Webbrowser](/nl/tools/browser). 

## Snel starten

`web_fetch` is **standaard ingeschakeld** -- geen configuratie nodig. De agent kan
hem direct aanroepen:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Toolparameters

<ParamField path="url" type="string" required>
URL om op te halen. Alleen `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Uitvoerformaat na extractie van de hoofdinhoud.
</ParamField>

<ParamField path="maxChars" type="number">
Kap uitvoer af tot dit aantal tekens.
</ParamField>

## Hoe het werkt

<Steps>
  <Step title="Ophalen">
    Verstuurt een HTTP GET met een Chrome-achtige User-Agent en
    `Accept-Language`-header. Blokkeert private/interne hostnamen en controleert omleidingen opnieuw.
  </Step>
  <Step title="Extraheren">
    Voert Readability (extractie van hoofdinhoud) uit op de HTML-respons.
  </Step>
  <Step title="Fallback (optioneel)">
    Als Readability mislukt en Firecrawl is geconfigureerd, probeert het opnieuw via de
    Firecrawl-API met modus voor bot-omzeiling.
  </Step>
  <Step title="Cache">
    Resultaten worden 15 minuten gecachet (configureerbaar) om herhaald
    ophalen van dezelfde URL te verminderen.
  </Step>
</Steps>

## Configuratie

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Firecrawl-fallback

Als Readability-extractie mislukt, kan `web_fetch` terugvallen op
[Firecrawl](/nl/tools/firecrawl) voor bot-omzeiling en betere extractie:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` ondersteunt SecretRef-objecten.
Verouderde `tools.web.fetch.firecrawl.*`-configuratie wordt automatisch gemigreerd door `openclaw doctor --fix`.

<Note>
  Als Firecrawl is ingeschakeld en de SecretRef ervan niet kan worden opgelost zonder
  `FIRECRAWL_API_KEY`-env-fallback, faalt het opstarten van de Gateway snel.
</Note>

<Note>
  Firecrawl-overschrijvingen van `baseUrl` zijn afgeschermd: gehost verkeer gebruikt
  `https://api.firecrawl.dev`; zelfgehoste overschrijvingen moeten private of
  interne endpoints als doel hebben, en `http://` wordt alleen voor die private doelen geaccepteerd.
</Note>

Huidig runtimegedrag:

- `tools.web.fetch.provider` selecteert expliciet de fallbackprovider voor ophalen.
- Als `provider` is weggelaten, detecteert OpenClaw automatisch de eerste gereedstaande web-fetch-
  provider uit beschikbare credentials. Niet-gesandboxte `web_fetch` kan
  geinstalleerde plugins gebruiken die `contracts.webFetchProviders` declareren en tijdens runtime een
  overeenkomende provider registreren. Vandaag is de gebundelde provider Firecrawl.
- Gesandboxte `web_fetch`-aanroepen blijven beperkt tot gebundelde providers.
- Als Readability is uitgeschakeld, slaat `web_fetch` direct door naar de geselecteerde
  providerfallback. Als er geen provider beschikbaar is, faalt het gesloten.

## Limieten en veiligheid

- `maxChars` wordt begrensd op `tools.web.fetch.maxCharsCap`
- De responsbody wordt voor het parsen begrensd op `maxResponseBytes`; te grote
  responses worden afgekapt met een waarschuwing
- Private/interne hostnamen worden geblokkeerd
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` en
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` zijn nauwe opt-ins
  voor vertrouwde fake-IP-proxystacks; laat ze unset tenzij je proxy
  die synthetische bereiken bezit en zijn eigen bestemmingsbeleid afdwingt
- Omleidingen worden gecontroleerd en beperkt door `maxRedirects`
- `web_fetch` werkt op basis van best effort -- sommige sites hebben de [Webbrowser](/nl/tools/browser) nodig

## Toolprofielen

Als je toolprofielen of allowlists gebruikt, voeg dan `web_fetch` of `group:web` toe:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Gerelateerd

- [Webzoekopdracht](/nl/tools/web) -- doorzoek het web met meerdere providers
- [Webbrowser](/nl/tools/browser) -- volledige browserautomatisering voor JS-zware sites
- [Firecrawl](/nl/tools/firecrawl) -- Firecrawl-tools voor zoeken en scrapen
