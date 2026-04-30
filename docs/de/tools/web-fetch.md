---
read_when:
    - Sie möchten eine URL abrufen und lesbare Inhalte extrahieren
    - Sie müssen web_fetch oder den zugehörigen Firecrawl-Fallback konfigurieren
    - Sie möchten die Limits und das Caching von web_fetch verstehen
sidebarTitle: Web Fetch
summary: web_fetch-Tool -- HTTP-Abruf mit Extraktion lesbarer Inhalte
title: Web-Abruf
x-i18n:
    generated_at: "2026-04-30T07:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

Das Tool `web_fetch` führt ein einfaches HTTP GET aus und extrahiert lesbare Inhalte
(HTML zu Markdown oder Text). Es führt **kein** JavaScript aus.

Für JS-lastige Websites oder login-geschützte Seiten verwenden Sie stattdessen den
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
    Sendet ein HTTP GET mit einem Chrome-ähnlichen User-Agent und einem
    `Accept-Language`-Header. Blockiert private/interne Hostnamen und prüft Weiterleitungen erneut.
  </Step>
  <Step title="Extract">
    Führt Readability (Extraktion des Hauptinhalts) für die HTML-Antwort aus.
  </Step>
  <Step title="Fallback (optional)">
    Wenn Readability fehlschlägt und Firecrawl konfiguriert ist, wird über die
    Firecrawl-API mit Bot-Umgehungsmodus erneut versucht.
  </Step>
  <Step title="Cache">
    Ergebnisse werden 15 Minuten lang zwischengespeichert (konfigurierbar), um wiederholte
    Abrufe derselben URL zu reduzieren.
  </Step>
</Steps>

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

Wenn die Readability-Extraktion fehlschlägt, kann `web_fetch` auf
[Firecrawl](/de/tools/firecrawl) zurückfallen, um Bots zu umgehen und eine bessere Extraktion zu erzielen:

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

`plugins.entries.firecrawl.config.webFetch.apiKey` unterstützt SecretRef-Objekte.
Die veraltete Konfiguration `tools.web.fetch.firecrawl.*` wird von `openclaw doctor --fix` automatisch migriert.

<Note>
  Wenn Firecrawl aktiviert ist und seine SecretRef nicht aufgelöst werden kann und es keinen
  `FIRECRAWL_API_KEY`-Env-Fallback gibt, schlägt der Gateway-Start schnell fehl.
</Note>

<Note>
  Firecrawl-`baseUrl`-Überschreibungen sind eingeschränkt: Sie müssen `https://` und
  den offiziellen Firecrawl-Host (`api.firecrawl.dev`) verwenden.
</Note>

Aktuelles Laufzeitverhalten:

- `tools.web.fetch.provider` wählt den Fetch-Fallback-Provider explizit aus.
- Wenn `provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Web-Fetch-
  Provider anhand verfügbarer Anmeldedaten. Derzeit ist der gebündelte Provider Firecrawl.
- Wenn Readability deaktiviert ist, springt `web_fetch` direkt zum ausgewählten
  Provider-Fallback. Wenn kein Provider verfügbar ist, schlägt es geschlossen fehl.

## Limits und Sicherheit

- `maxChars` wird auf `tools.web.fetch.maxCharsCap` begrenzt
- Der Antworttext wird vor dem Parsen auf `maxResponseBytes` begrenzt; übergroße
  Antworten werden mit einer Warnung gekürzt
- Private/interne Hostnamen werden blockiert
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` und
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sind enge Opt-ins
  für vertrauenswürdige Fake-IP-Proxy-Stacks; lassen Sie sie nicht gesetzt, es sei denn, Ihr Proxy besitzt
  diese synthetischen Bereiche und erzwingt seine eigene Zielrichtlinie
- Weiterleitungen werden geprüft und durch `maxRedirects` begrenzt
- `web_fetch` funktioniert nach bestem Bemühen -- einige Websites benötigen den [Webbrowser](/de/tools/browser)

## Tool-Profile

Wenn Sie Tool-Profile oder Allowlisten verwenden, fügen Sie `web_fetch` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Verwandte Themen

- [Websuche](/de/tools/web) -- das Web mit mehreren Providern durchsuchen
- [Webbrowser](/de/tools/browser) -- vollständige Browserautomatisierung für JS-lastige Websites
- [Firecrawl](/de/tools/firecrawl) -- Firecrawl-Such- und Scrape-Tools
