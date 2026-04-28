---
read_when:
    - Sie möchten eine URL abrufen und lesbare Inhalte extrahieren
    - Sie müssen `web_fetch` oder dessen Firecrawl-Fallback konfigurieren
    - Sie möchten die Limits und das Caching von `web_fetch` verstehen
sidebarTitle: Web Fetch
summary: Tool `web_fetch` -- HTTP-Fetch mit Extraktion lesbarer Inhalte
title: Web-Fetch
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:06:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

Das Tool `web_fetch` führt ein einfaches HTTP-GET aus und extrahiert lesbare Inhalte
(HTML zu Markdown oder Text). Es führt **kein** JavaScript aus.

Für JS-lastige Websites oder login-geschützte Seiten verwenden Sie stattdessen den
[Web Browser](/de/tools/browser).

## Schnellstart

`web_fetch` ist **standardmäßig aktiviert** -- es ist keine Konfiguration erforderlich. Der Agent kann
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

## Wie es funktioniert

<Steps>
  <Step title="Abrufen">
    Sendet ein HTTP-GET mit einem Chrome-ähnlichen User-Agent und einem `Accept-Language`-
    Header. Blockiert private/interne Hostnamen und prüft Redirects erneut.
  </Step>
  <Step title="Extrahieren">
    Führt Readability (Extraktion des Hauptinhalts) auf der HTML-Antwort aus.
  </Step>
  <Step title="Fallback (optional)">
    Wenn Readability fehlschlägt und Firecrawl konfiguriert ist, wird über die
    Firecrawl-API mit Bot-Umgehungsmodus erneut versucht.
  </Step>
  <Step title="Cache">
    Ergebnisse werden 15 Minuten lang gecacht (konfigurierbar), um wiederholte
    Fetches derselben URL zu reduzieren.
  </Step>
</Steps>

## Konfiguration

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // Standard: true
        provider: "firecrawl", // optional; für Auto-Erkennung weglassen
        maxChars: 50000, // maximale Ausgabezeichen
        maxCharsCap: 50000, // harte Obergrenze für den Parameter maxChars
        maxResponseBytes: 2000000, // maximale Download-Größe vor Kürzung
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // Readability-Extraktion verwenden
        userAgent: "Mozilla/5.0 ...", // User-Agent überschreiben
      },
    },
  },
}
```

## Firecrawl-Fallback

Wenn die Readability-Extraktion fehlschlägt, kann `web_fetch` auf
[Firecrawl](/de/tools/firecrawl) als Fallback zurückgreifen für Bot-Umgehung und bessere Extraktion:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; für Auto-Erkennung anhand verfügbarer Credentials weglassen
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional, wenn FIRECRAWL_API_KEY gesetzt ist
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // Cache-Dauer (1 Tag)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` unterstützt SecretRef-Objekte.
Die veraltete Konfiguration `tools.web.fetch.firecrawl.*` wird automatisch von `openclaw doctor --fix` migriert.

<Note>
  Wenn Firecrawl aktiviert ist und sein SecretRef nicht aufgelöst werden kann und es keinen
  Env-Fallback `FIRECRAWL_API_KEY` gibt, schlägt der Gateway-Start sofort fehl.
</Note>

<Note>
  Overrides für Firecrawl-`baseUrl` sind eingeschränkt: Sie müssen `https://` verwenden und
  den offiziellen Firecrawl-Host (`api.firecrawl.dev`).
</Note>

Aktuelles Laufzeitverhalten:

- `tools.web.fetch.provider` wählt den Fetch-Fallback-Provider explizit aus.
- Wenn `provider` weggelassen wird, erkennt OpenClaw automatisch den ersten einsatzbereiten `web_fetch`-
  Provider anhand verfügbarer Credentials. Heute ist Firecrawl der gebündelte Provider.
- Wenn Readability deaktiviert ist, springt `web_fetch` direkt zum ausgewählten
  Provider-Fallback. Wenn kein Provider verfügbar ist, schlägt es fail-closed fehl.

## Limits und Sicherheit

- `maxChars` wird auf `tools.web.fetch.maxCharsCap` begrenzt
- Der Response-Body wird vor dem Parsen auf `maxResponseBytes` begrenzt; zu große
  Antworten werden mit einer Warnung gekürzt
- Private/interne Hostnamen werden blockiert
- Redirects werden geprüft und durch `maxRedirects` begrenzt
- `web_fetch` ist Best Effort -- manche Websites benötigen den [Web Browser](/de/tools/browser)

## Tool-Profile

Wenn Sie Tool-Profile oder Allowlists verwenden, fügen Sie `web_fetch` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // oder: allow: ["group:web"]  (enthält web_fetch, web_search und x_search)
  },
}
```

## Verwandt

- [Web Search](/de/tools/web) -- das Web mit mehreren Providern durchsuchen
- [Web Browser](/de/tools/browser) -- vollständige Browser-Automatisierung für JS-lastige Websites
- [Firecrawl](/de/tools/firecrawl) -- Search- und Scrape-Tools von Firecrawl
