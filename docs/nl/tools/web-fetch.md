---
read_when:
    - Je wilt een URL ophalen en leesbare inhoud extraheren
    - Je moet web_fetch of de bijbehorende Firecrawl-terugvaloptie configureren
    - Je wilt de limieten en caching van web_fetch begrijpen
sidebarTitle: Web Fetch
summary: web_fetch-tool -- HTTP-fetch met extractie van leesbare inhoud
title: Web ophalen
x-i18n:
    generated_at: "2026-06-27T18:31:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

De tool `web_fetch` voert een gewone HTTP GET uit en extraheert leesbare inhoud
(HTML naar markdown of tekst). JavaScript wordt **niet** uitgevoerd.

Gebruik voor JS-zware sites of pagina's achter een login in plaats daarvan de
[Webbrowser](/nl/tools/browser).

## Snel aan de slag

`web_fetch` is **standaard ingeschakeld** -- geen configuratie nodig. De agent kan
de tool meteen aanroepen:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Toolparameters

<ParamField path="url" type="string" required>
URL om op te halen. Alleen `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Uitvoerindeling na extractie van hoofdinhoud.
</ParamField>

<ParamField path="maxChars" type="number">
Kort de uitvoer in tot dit aantal tekens.
</ParamField>

## Hoe het werkt

<Steps>
  <Step title="Ophalen">
    Verstuurt een HTTP GET met een Chrome-achtige User-Agent en `Accept-Language`-
    header. Blokkeert privé/interne hostnamen en controleert redirects opnieuw.
  </Step>
  <Step title="Extraheren">
    Voert Readability (extractie van hoofdinhoud) uit op de HTML-respons.
  </Step>
  <Step title="Fallback (optioneel)">
    Als Readability faalt en Firecrawl is geselecteerd, wordt opnieuw geprobeerd via de
    Firecrawl API met bot-omzeilingsmodus.
  </Step>
  <Step title="Cache">
    Resultaten worden 15 minuten gecachet (configureerbaar) om herhaalde
    ophaalacties van dezelfde URL te beperken.
  </Step>
</Steps>

## Voortgangsupdates

`web_fetch` geeft alleen een openbare voortgangsregel weer wanneer het ophalen na
vijf seconden nog steeds loopt:

```text
Fetching page content...
```

Snelle cachehits en snelle netwerkresponsen zijn klaar voordat de timer afgaat,
dus ze tonen geen voortgangsregel. Als de aanroep wordt geannuleerd, wordt de
timer gewist. Wanneer het ophalen uiteindelijk is voltooid, ontvangt de agent het
normale toolresultaat; de voortgangsregel is alleen UI-status van het kanaal en
bevat nooit opgehaalde pagina-inhoud.

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

Als Readability-extractie faalt, kan `web_fetch` terugvallen op
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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` is optioneel en ondersteunt SecretRef-objecten.
Verouderde configuratie onder `tools.web.fetch.firecrawl.*` wordt automatisch gemigreerd door `openclaw doctor --fix`.

<Note>
  Als je een Firecrawl API-key SecretRef configureert en deze niet kan worden
  opgelost zonder `FIRECRAWL_API_KEY`-env-fallback, faalt het opstarten van de Gateway direct.
</Note>

<Note>
  Firecrawl-overschrijvingen voor `baseUrl` zijn vergrendeld: gehost verkeer gebruikt
  `https://api.firecrawl.dev`; zelfgehoste overschrijvingen moeten gericht zijn op privé-
  of interne endpoints, en `http://` wordt alleen geaccepteerd voor die privétargets.
</Note>

Huidig runtimegedrag:

- `tools.web.fetch.provider` selecteert expliciet de fallbackprovider voor ophalen.
- Als `provider` is weggelaten, detecteert OpenClaw automatisch de eerste gereedstaande web-fetch-
  provider uit geconfigureerde credentials. Niet-gesandboxte `web_fetch` kan
  geïnstalleerde plugins gebruiken die `contracts.webFetchProviders` declareren en tijdens runtime een
  overeenkomende provider registreren. De officiële Firecrawl-plugin levert deze
  fallback.
- Gesandboxte `web_fetch`-aanroepen staan gebundelde providers toe plus geïnstalleerde providers
  waarvan de officiële npm- of ClawHub-herkomst is geverifieerd. Vandaag staat dat de
  officiële Firecrawl-plugin toe; externe fetch-plugins van derden blijven uitgesloten.
- Als Readability is uitgeschakeld, slaat `web_fetch` direct over naar de geselecteerde
  providerfallback. Als er geen provider beschikbaar is, faalt de tool gesloten.

## Vertrouwde env-proxy

Als je deployment vereist dat `web_fetch` via een vertrouwde uitgaande
HTTP(S)-proxy loopt, stel dan `tools.web.fetch.useTrustedEnvProxy: true` in.

In deze modus past OpenClaw nog steeds hostnaamgebaseerde SSRF-controles toe voordat
de request wordt verstuurd, maar laat het de proxy DNS oplossen in plaats van lokale DNS-
pinning te doen. Schakel dit alleen in wanneer de proxy door de operator wordt beheerd en
uitgaand beleid afdwingt na DNS-resolutie.

<Note>
  Als er geen HTTP(S)-proxy-env-var is geconfigureerd, of als de doelhost is uitgesloten door
  `NO_PROXY`, valt `web_fetch` terug op het normale strikte pad met lokale DNS-
  pinning.
</Note>

## Limieten en veiligheid

- `maxChars` wordt begrensd op `tools.web.fetch.maxCharsCap`
- De responsebody wordt vóór het parsen begrensd op `maxResponseBytes`; te grote
  responses worden met een waarschuwing ingekort
- Privé/interne hostnamen worden geblokkeerd
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` en
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` zijn smalle opt-ins
  voor vertrouwde fake-IP-proxystacks; laat ze oningesteld tenzij je proxy eigenaar is van
  die synthetische bereiken en zijn eigen bestemmingsbeleid afdwingt
- Redirects worden gecontroleerd en beperkt door `maxRedirects`
- `useTrustedEnvProxy` is een expliciete opt-in en mag alleen worden ingeschakeld voor
  door operators beheerde proxy's die nog steeds uitgaand beleid afdwingen na DNS-
  resolutie
- `web_fetch` is best-effort -- sommige sites hebben de [Webbrowser](/nl/tools/browser) nodig

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

- [Webzoekfunctie](/nl/tools/web) -- doorzoek het web met meerdere providers
- [Webbrowser](/nl/tools/browser) -- volledige browserautomatisering voor JS-zware sites
- [Firecrawl](/nl/tools/firecrawl) -- Firecrawl-tools voor zoeken en scrapen
