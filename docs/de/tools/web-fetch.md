---
read_when:
    - Sie möchten eine URL abrufen und lesbaren Inhalt extrahieren
    - Sie müssen web_fetch oder den Firecrawl-Fallback dafür konfigurieren
    - Sie möchten die Grenzen und das Caching von web_fetch verstehen
sidebarTitle: Web Fetch
summary: web_fetch-Tool -- HTTP-Abruf mit Extraktion lesbarer Inhalte
title: Webabruf
x-i18n:
    generated_at: "2026-06-27T18:23:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

Das Tool `web_fetch` führt ein einfaches HTTP GET aus und extrahiert lesbaren Inhalt
(HTML zu Markdown oder Text). Es führt **kein** JavaScript aus.

Verwenden Sie für JS-lastige Websites oder login-geschützte Seiten stattdessen den
[Webbrowser](/de/tools/browser).

## Schnellstart

`web_fetch` ist **standardmäßig aktiviert** -- keine Konfiguration erforderlich. Der Agent kann
es sofort aufrufen:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Tool-Parameter

<ParamField path="url" type="string" required>
Abzurufende URL. Nur `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Ausgabeformat nach der Extraktion des Hauptinhalts.
</ParamField>

<ParamField path="maxChars" type="number">
Ausgabe auf diese Anzahl von Zeichen kürzen.
</ParamField>

## Funktionsweise

<Steps>
  <Step title="Fetch">
    Sendet ein HTTP GET mit einem Chrome-ähnlichen User-Agent und
    `Accept-Language`-Header. Blockiert private/interne Hostnamen und prüft Weiterleitungen erneut.
  </Step>
  <Step title="Extract">
    Führt Readability (Extraktion des Hauptinhalts) auf der HTML-Antwort aus.
  </Step>
  <Step title="Fallback (optional)">
    Wenn Readability fehlschlägt und Firecrawl ausgewählt ist, wird der Versuch über die
    Firecrawl-API mit Bot-Umgehungsmodus wiederholt.
  </Step>
  <Step title="Cache">
    Ergebnisse werden 15 Minuten lang zwischengespeichert (konfigurierbar), um wiederholte
    Abrufe derselben URL zu reduzieren.
  </Step>
</Steps>

## Fortschrittsmeldungen

`web_fetch` gibt nur dann eine öffentliche Fortschrittszeile aus, wenn der Abruf nach
fünf Sekunden noch aussteht:

```text
Fetching page content...
```

Schnelle Cache-Treffer und schnelle Netzwerkantworten sind abgeschlossen, bevor der Timer auslöst,
sodass sie keine Fortschrittszeile anzeigen. Wenn der Aufruf abgebrochen wird, wird der Timer gelöscht.
Wenn der Abruf schließlich abgeschlossen ist, erhält der Agent das normale Tool-Ergebnis;
die Fortschrittszeile ist nur Channel-UI-Status und enthält niemals abgerufene Seiteninhalte.

## Konfiguration

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

## Firecrawl-Fallback

Wenn die Readability-Extraktion fehlschlägt, kann `web_fetch` für Bot-Umgehung und bessere Extraktion auf
[Firecrawl](/de/tools/firecrawl) zurückfallen:

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

`plugins.entries.firecrawl.config.webFetch.apiKey` ist optional und unterstützt SecretRef-Objekte.
Die Legacy-Konfiguration `tools.web.fetch.firecrawl.*` wird von `openclaw doctor --fix` automatisch migriert.

<Note>
  Wenn Sie einen Firecrawl-API-key-SecretRef konfigurieren und dieser ohne
  `FIRECRAWL_API_KEY`-Env-Fallback nicht aufgelöst wird, schlägt der Gateway-Start früh fehl.
</Note>

<Note>
  Firecrawl-`baseUrl`-Überschreibungen sind eingeschränkt: Gehosteter Traffic verwendet
  `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private oder
  interne Endpunkte zielen, und `http://` wird nur für diese privaten Ziele akzeptiert.
</Note>

Aktuelles Laufzeitverhalten:

- `tools.web.fetch.provider` wählt den Fallback-Provider für den Abruf explizit aus.
- Wenn `provider` ausgelassen wird, erkennt OpenClaw automatisch den ersten bereiten Web-Fetch-Provider
  aus den konfigurierten Zugangsdaten. Nicht-sandboxed `web_fetch` kann
  installierte Plugins verwenden, die `contracts.webFetchProviders` deklarieren und zur Laufzeit einen
  passenden Provider registrieren. Das offizielle Firecrawl-Plugin stellt diesen
  Fallback bereit.
- Sandboxed-`web_fetch`-Aufrufe erlauben gebündelte Provider sowie installierte Provider,
  deren offizielle npm- oder ClawHub-Herkunft verifiziert ist. Derzeit erlaubt dies das
  offizielle Firecrawl-Plugin; externe Abruf-Plugins von Drittanbietern bleiben ausgeschlossen.
- Wenn Readability deaktiviert ist, springt `web_fetch` direkt zum ausgewählten
  Provider-Fallback. Wenn kein Provider verfügbar ist, schlägt es geschlossen fehl.

## Vertrauenswürdiger Env-Proxy

Wenn Ihre Bereitstellung erfordert, dass `web_fetch` über einen vertrauenswürdigen ausgehenden
HTTP(S)-Proxy läuft, setzen Sie `tools.web.fetch.useTrustedEnvProxy: true`.

In diesem Modus wendet OpenClaw weiterhin hostnamenbasierte SSRF-Prüfungen an, bevor
die Anfrage gesendet wird, lässt aber den Proxy DNS auflösen, statt lokales DNS-Pinning
durchzuführen. Aktivieren Sie dies nur, wenn der Proxy vom Betreiber kontrolliert wird und
nach der DNS-Auflösung ausgehende Richtlinien erzwingt.

<Note>
  Wenn keine HTTP(S)-Proxy-Env-Variable konfiguriert ist oder der Zielhost durch
  `NO_PROXY` ausgeschlossen ist, fällt `web_fetch` auf den normalen strikten Pfad mit lokalem DNS-Pinning
  zurück.
</Note>

## Limits und Sicherheit

- `maxChars` wird auf `tools.web.fetch.maxCharsCap` begrenzt
- Der Antwortkörper wird vor dem Parsen auf `maxResponseBytes` begrenzt; übergroße
  Antworten werden mit einer Warnung gekürzt
- Private/interne Hostnamen werden blockiert
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` und
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sind enge Opt-ins
  für vertrauenswürdige Fake-IP-Proxy-Stacks; lassen Sie sie ungesetzt, sofern Ihr Proxy
  diese synthetischen Bereiche nicht besitzt und seine eigene Zielrichtlinie erzwingt
- Weiterleitungen werden geprüft und durch `maxRedirects` begrenzt
- `useTrustedEnvProxy` ist ein explizites Opt-in und sollte nur für
  betreiberkontrollierte Proxys aktiviert werden, die auch nach der DNS-Auflösung ausgehende Richtlinien
  erzwingen
- `web_fetch` arbeitet nach Best-Effort -- einige Websites benötigen den [Webbrowser](/de/tools/browser)

## Tool-Profile

Wenn Sie Tool-Profile oder Allowlists verwenden, fügen Sie `web_fetch` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Verwandt

- [Websuche](/de/tools/web) -- das Web mit mehreren Providern durchsuchen
- [Webbrowser](/de/tools/browser) -- vollständige Browser-Automatisierung für JS-lastige Websites
- [Firecrawl](/de/tools/firecrawl) -- Firecrawl-Such- und Scrape-Tools
