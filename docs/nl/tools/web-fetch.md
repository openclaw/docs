---
read_when:
    - Je wilt een URL ophalen en leesbare inhoud extraheren
    - Je moet web_fetch of de Firecrawl-terugvaloptie configureren
    - U wilt de limieten en caching van web_fetch begrijpen
sidebarTitle: Web Fetch
summary: web_fetch-tool -- HTTP-ophalen met extractie van leesbare inhoud
title: Web ophalen
x-i18n:
    generated_at: "2026-07-12T09:31:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` voert een gewone HTTP GET uit en extraheert leesbare inhoud (HTML naar
markdown of tekst). Het voert **geen** JavaScript uit. Gebruik voor sites die sterk
afhankelijk zijn van JavaScript of pagina's die met een aanmelding zijn beveiligd in plaats daarvan de [webbrowser](/nl/tools/browser).

## Snel aan de slag

Standaard ingeschakeld, geen configuratie nodig:

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
Kort de uitvoer af tot dit aantal tekens. Begrensd door `tools.web.fetch.maxCharsCap`.
</ParamField>

## Werking

<Steps>
  <Step title="Ophalen">
    Verzendt een HTTP GET met een Chrome-achtige User-Agent en een
    `Accept-Language`-header. Blokkeert privé-/interne hostnamen en controleert
    omleidingen opnieuw.
  </Step>
  <Step title="Extraheren">
    Voert Readability (extractie van hoofdinhoud) uit op het HTML-antwoord.
  </Step>
  <Step title="Terugvaloptie (optioneel)">
    Als Readability mislukt en er een ophaalprovider beschikbaar is, wordt het
    opnieuw geprobeerd via die provider (bijvoorbeeld de modus van Firecrawl
    voor het omzeilen van botdetectie).
  </Step>
  <Step title="Cache">
    Resultaten worden 15 minuten in de cache opgeslagen (configureerbaar) om
    herhaald ophalen van dezelfde URL te beperken.
  </Step>
</Steps>

## Voortgangsupdates

`web_fetch` toont alleen een openbare voortgangsregel als het ophalen na vijf
seconden nog niet is voltooid:

```text
Pagina-inhoud ophalen...
```

Snelle cachetreffers en snelle netwerkreacties zijn voltooid voordat de timer
afgaat en tonen daarom nooit een voortgangsregel. Bij het annuleren van de
aanroep wordt de timer gewist. De voortgangsregel is uitsluitend een status van
de kanaalinterface en bevat nooit opgehaalde pagina-inhoud.

## Configuratie

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // standaard: true
        provider: "firecrawl", // optioneel; weglaten voor automatische detectie
        maxChars: 20000, // standaardaantal uitvoertekens; begrensd door maxCharsCap
        maxCharsCap: 20000, // harde limiet voor de parameter maxChars
        maxResponseBytes: 750000, // maximale downloadgrootte vóór afkapping (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // laat een vertrouwde HTTP(S)-omgevingsproxy DNS omzetten
        readability: true, // Readability-extractie gebruiken
        userAgent: "Mozilla/5.0 ...", // User-Agent overschrijven
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // expliciete inschakeling voor vertrouwde nep-IP-proxy's die 198.18.0.0/15 gebruiken
          allowIpv6UniqueLocalRange: true, // expliciete inschakeling voor vertrouwde nep-IP-proxy's die fc00::/7 gebruiken
        },
      },
    },
  },
}
```

## Firecrawl-terugvaloptie

Als extractie met Readability mislukt, kan `web_fetch` terugvallen op
[Firecrawl](/nl/tools/firecrawl) voor het omzeilen van botdetectie en betere extractie:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optioneel; weglaten voor automatische detectie via beschikbare referenties
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // optioneel; weglaten voor sleutelloze starterstoegang
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // cacheduur (2 dagen)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` is optioneel en ondersteunt SecretRef-objecten.
Verouderde configuratie onder `tools.web.fetch.firecrawl.*` wordt via
`openclaw doctor --fix` automatisch gemigreerd naar
`plugins.entries.firecrawl.config.webFetch`.

<Note>
  Als u een SecretRef voor een Firecrawl-API-sleutel configureert en deze niet
  kan worden opgelost en er geen terugvaloptie via de omgevingsvariabele
  `FIRECRAWL_API_KEY` is, mislukt het starten van de Gateway onmiddellijk.
</Note>

<Note>
  Overschrijvingen van de Firecrawl-`baseUrl` zijn beperkt: gehost verkeer
  gebruikt `https://api.firecrawl.dev`; zelfgehoste overschrijvingen moeten
  naar privé- of interne eindpunten verwijzen en `http://` wordt alleen voor
  die privémachines geaccepteerd.
</Note>

Huidig runtimegedrag:

- `tools.web.fetch.provider` selecteert expliciet de terugvalprovider voor ophalen.
- Als `provider` wordt weggelaten, detecteert OpenClaw automatisch de eerste
  gebruiksklare provider voor ophalen via het web aan de hand van de
  geconfigureerde referenties. `web_fetch` buiten een sandbox kan
  geïnstalleerde plugins gebruiken die `contracts.webFetchProviders` declareren
  en tijdens runtime een overeenkomende provider registreren. De officiële
  Firecrawl-plugin biedt momenteel deze terugvaloptie.
- `web_fetch`-aanroepen in een sandbox staan gebundelde providers toe, plus
  geïnstalleerde providers waarvan de officiële herkomst via npm of ClawHub is
  geverifieerd. Momenteel is daardoor de officiële Firecrawl-plugin toegestaan;
  externe ophaalplugins van derden blijven uitgesloten.
- Als Readability is uitgeschakeld, gaat `web_fetch` direct door naar de
  geselecteerde terugvalprovider. Als er geen provider beschikbaar is, wordt de
  aanroep uit veiligheidsoverwegingen geweigerd.

## Vertrouwde omgevingsproxy

Als uw implementatie vereist dat `web_fetch` via een vertrouwde uitgaande
HTTP(S)-proxy verloopt, stelt u `tools.web.fetch.useTrustedEnvProxy: true` in.

In deze modus voert OpenClaw nog steeds SSRF-controles op basis van de hostnaam
uit voordat het verzoek wordt verzonden, maar laat het de proxy DNS omzetten in
plaats van lokale DNS-vastzetting toe te passen. Schakel dit alleen in wanneer
de proxy door de beheerder wordt beheerd en na DNS-omzetting beleid voor
uitgaand verkeer afdwingt.

<Note>
  Als er geen omgevingsvariabele voor een HTTP(S)-proxy is geconfigureerd of de
  doelhost door `NO_PROXY` wordt uitgesloten, valt `web_fetch` terug op het
  normale strikte pad met lokale DNS-vastzetting.
</Note>

## Limieten en veiligheid

- `maxChars` wordt begrensd door `tools.web.fetch.maxCharsCap` (standaard `20000`)
- De antwoordtekst wordt vóór het parseren begrensd op `maxResponseBytes`
  (standaard `750000`, begrensd op 32000-10000000); te grote antwoorden worden
  met een waarschuwing afgekapt
- Privé-/interne hostnamen worden geblokkeerd
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` en
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` zijn gerichte,
  expliciete inschakelingen voor vertrouwde proxystacks met nep-IP-adressen;
  laat ze oningesteld tenzij uw proxy eigenaar is van die synthetische bereiken
  en een eigen bestemmingsbeleid afdwingt
- Omleidingen worden gecontroleerd en beperkt door `maxRedirects` (standaard `3`)
- `useTrustedEnvProxy` moet expliciet worden ingeschakeld en mag alleen worden
  geactiveerd voor door de beheerder beheerde proxy's die na DNS-omzetting nog
  steeds beleid voor uitgaand verkeer afdwingen
- `web_fetch` werkt naar beste vermogen; sommige sites vereisen de
  [webbrowser](/nl/tools/browser)

## Toolprofielen

Als u toolprofielen of toelatingslijsten gebruikt, voegt u `web_fetch` of
`group:web` toe:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // of: allow: ["group:web"]  (omvat web_fetch, web_search en x_search)
  },
}
```

## Gerelateerd

- [Zoeken op het web](/nl/tools/web) -- doorzoek het web met meerdere providers
- [Webbrowser](/nl/tools/browser) -- volledige browserautomatisering voor sites die sterk afhankelijk zijn van JavaScript
- [Firecrawl](/nl/tools/firecrawl) -- Firecrawl-tools voor zoeken en scrapen
