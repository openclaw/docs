---
read_when:
    - Je wilt een URL ophalen en leesbare inhoud extraheren
    - Je moet web_fetch of de Firecrawl-fallback ervan configureren
    - Je wilt inzicht krijgen in web_fetch-limieten en caching
sidebarTitle: Web Fetch
summary: web_fetch-tool -- HTTP-ophalen met extractie van leesbare inhoud
title: Web ophalen
x-i18n:
    generated_at: "2026-04-29T23:28:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

Het hulpmiddel `web_fetch` voert een gewone HTTP GET uit en extraheert leesbare inhoud
(HTML naar markdown of tekst). Het voert **geen** JavaScript uit.

Voor JS-intensieve sites of pagina's achter een login gebruikt u in plaats daarvan de
[Webbrowser](/nl/tools/browser).

## Snel aan de slag

`web_fetch` is **standaard ingeschakeld** -- geen configuratie nodig. De agent kan
het direct aanroepen:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Hulpmiddelparameters

<ParamField path="url" type="string" required>
URL om op te halen. Alleen `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Uitvoerformaat na extractie van de hoofdinhoud.
</ParamField>

<ParamField path="maxChars" type="number">
Kap de uitvoer af tot dit aantal tekens.
</ParamField>

## Hoe het werkt

<Steps>
  <Step title="Fetch">
    Stuurt een HTTP GET met een Chrome-achtige User-Agent en `Accept-Language`-
    header. Blokkeert private/interne hostnamen en controleert redirects opnieuw.
  </Step>
  <Step title="Extract">
    Voert Readability (extractie van hoofdinhoud) uit op de HTML-respons.
  </Step>
  <Step title="Fallback (optional)">
    Als Readability mislukt en Firecrawl is geconfigureerd, probeert het opnieuw via de
    Firecrawl-API met bot-omzeilingsmodus.
  </Step>
  <Step title="Cache">
    Resultaten worden 15 minuten gecachet (configureerbaar) om herhaald ophalen
    van dezelfde URL te verminderen.
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
Verouderde configuratie `tools.web.fetch.firecrawl.*` wordt automatisch gemigreerd door `openclaw doctor --fix`.

<Note>
  Als Firecrawl is ingeschakeld en de SecretRef ervan niet kan worden opgelost zonder
  `FIRECRAWL_API_KEY` als env-fallback, faalt het opstarten van de Gateway snel.
</Note>

<Note>
  Firecrawl `baseUrl`-overschrijvingen zijn vergrendeld: ze moeten `https://` gebruiken en
  de officiële Firecrawl-host (`api.firecrawl.dev`).
</Note>

Huidig runtimegedrag:

- `tools.web.fetch.provider` selecteert expliciet de fallbackprovider voor ophalen.
- Als `provider` is weggelaten, detecteert OpenClaw automatisch de eerste beschikbare web-fetch-
  provider op basis van beschikbare referenties. Momenteel is de gebundelde provider Firecrawl.
- Als Readability is uitgeschakeld, slaat `web_fetch` direct over naar de geselecteerde
  providerfallback. Als er geen provider beschikbaar is, faalt het gesloten.

## Limieten en veiligheid

- `maxChars` wordt begrensd tot `tools.web.fetch.maxCharsCap`
- De responsbody wordt vóór het parsen begrensd op `maxResponseBytes`; te grote
  responsen worden afgekapt met een waarschuwing
- Private/interne hostnamen worden geblokkeerd
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` en
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` zijn beperkte opt-ins
  voor vertrouwde fake-IP-proxystacks; laat ze oningesteld tenzij uw proxy eigenaar is van
  die synthetische bereiken en zijn eigen bestemmingsbeleid afdwingt
- Redirects worden gecontroleerd en beperkt door `maxRedirects`
- `web_fetch` werkt op basis van best effort -- sommige sites hebben de [Webbrowser](/nl/tools/browser) nodig

## Hulpmiddelprofielen

Als u hulpmiddelprofielen of allowlists gebruikt, voeg dan `web_fetch` of `group:web` toe:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Gerelateerd

- [Webzoekopdracht](/nl/tools/web) -- zoek op het web met meerdere providers
- [Webbrowser](/nl/tools/browser) -- volledige browserautomatisering voor JS-intensieve sites
- [Firecrawl](/nl/tools/firecrawl) -- Firecrawl-zoek- en scrapehulpmiddelen
