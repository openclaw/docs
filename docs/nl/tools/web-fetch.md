---
read_when:
    - Je wilt een URL ophalen en leesbare inhoud extraheren
    - U moet web_fetch of de bijbehorende Firecrawl-terugvaloptie configureren
    - Je wilt de limieten en caching van web_fetch begrijpen
sidebarTitle: Web Fetch
summary: web_fetch-hulpmiddel -- HTTP-ophalen met extractie van leesbare inhoud
title: Web ophalen
x-i18n:
    generated_at: "2026-05-04T07:10:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

De tool `web_fetch` voert een eenvoudige HTTP GET uit en extraheert leesbare inhoud
(HTML naar markdown of tekst). De tool voert **geen** JavaScript uit.

Gebruik voor JS-zware sites of pagina's die door inloggen zijn beschermd in plaats daarvan de
[Webbrowser](/nl/tools/browser).

## Snel aan de slag

`web_fetch` is **standaard ingeschakeld** -- geen configuratie nodig. De agent kan
de tool direct aanroepen:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Toolparameters

<ParamField path="url" type="string" required>
Op te halen URL. Alleen `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Uitvoerindeling na extractie van de hoofdinhoud.
</ParamField>

<ParamField path="maxChars" type="number">
Kap de uitvoer af tot dit aantal tekens.
</ParamField>

## Hoe het werkt

<Steps>
  <Step title="Ophalen">
    Verzendt een HTTP GET met een Chrome-achtige User-Agent en `Accept-Language`-
    header. Blokkeert privé/interne hostnamen en controleert redirects opnieuw.
  </Step>
  <Step title="Extraheren">
    Voert Readability (extractie van hoofdinhoud) uit op de HTML-respons.
  </Step>
  <Step title="Fallback (optioneel)">
    Als Readability mislukt en Firecrawl is geconfigureerd, wordt opnieuw geprobeerd via de
    Firecrawl-API met bot-omzeilingsmodus.
  </Step>
  <Step title="Cache">
    Resultaten worden 15 minuten gecachet (configureerbaar) om herhaaldelijk
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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
  Als Firecrawl is ingeschakeld en de SecretRef niet kan worden opgelost zonder
  `FIRECRAWL_API_KEY`-env-fallback, mislukt het starten van de Gateway snel.
</Note>

<Note>
  Firecrawl-overschrijvingen voor `baseUrl` zijn strikt beperkt: gehost verkeer gebruikt
  `https://api.firecrawl.dev`; zelf gehoste overschrijvingen moeten gericht zijn op privé- of
  interne eindpunten, en `http://` wordt alleen geaccepteerd voor die privétargets.
</Note>

Huidig runtimegedrag:

- `tools.web.fetch.provider` selecteert de fallbackprovider voor ophalen expliciet.
- Als `provider` is weggelaten, detecteert OpenClaw automatisch de eerste gereedstaande web-fetch-
  provider op basis van beschikbare inloggegevens. Niet-gesandboxte `web_fetch` kan
  geïnstalleerde plugins gebruiken die `contracts.webFetchProviders` declareren en tijdens runtime een
  overeenkomende provider registreren. Momenteel is de meegeleverde provider Firecrawl.
- Gesandboxte `web_fetch`-aanroepen blijven beperkt tot meegeleverde providers.
- Als Readability is uitgeschakeld, slaat `web_fetch` direct over naar de geselecteerde
  providerfallback. Als er geen provider beschikbaar is, faalt de tool gesloten.

## Vertrouwde Env Proxy

Als je deployment vereist dat `web_fetch` via een vertrouwde uitgaande
HTTP(S)-proxy loopt, stel dan `tools.web.fetch.useTrustedEnvProxy: true` in.

In deze modus past OpenClaw nog steeds hostnaamgebaseerde SSRF-controles toe voordat
de aanvraag wordt verzonden, maar laat het de proxy DNS oplossen in plaats van lokale DNS-
pinning te doen. Schakel dit alleen in wanneer de proxy door de operator wordt beheerd en
uitgaand beleid afdwingt na DNS-resolutie.

<Note>
  Als er geen HTTP(S)-proxy-env-var is geconfigureerd, of als de doelhost is uitgesloten door
  `NO_PROXY`, valt `web_fetch` terug op het normale strikte pad met lokale DNS-
  pinning.
</Note>

## Limieten en veiligheid

- `maxChars` wordt begrensd op `tools.web.fetch.maxCharsCap`
- De responsebody wordt begrensd op `maxResponseBytes` vóór parsing; te grote
  responses worden afgekapt met een waarschuwing
- Privé/interne hostnamen worden geblokkeerd
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` en
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` zijn beperkte opt-ins
  voor vertrouwde fake-IP-proxystacks; laat ze unset tenzij je proxy eigenaar is van
  die synthetische bereiken en een eigen bestemmingsbeleid afdwingt
- Redirects worden gecontroleerd en beperkt door `maxRedirects`
- `useTrustedEnvProxy` is een expliciete opt-in en mag alleen worden ingeschakeld voor
  door operators beheerde proxy's die na DNS-resolutie nog steeds uitgaand beleid afdwingen
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

- [Zoeken op het web](/nl/tools/web) -- doorzoek het web met meerdere providers
- [Webbrowser](/nl/tools/browser) -- volledige browserautomatisering voor JS-zware sites
- [Firecrawl](/nl/tools/firecrawl) -- zoek- en scrapetools van Firecrawl
