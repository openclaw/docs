---
read_when:
    - Sie möchten eine URL abrufen und lesbare Inhalte extrahieren
    - Sie müssen `web_fetch` oder dessen Firecrawl-Fallback konfigurieren.
    - Sie möchten die Beschränkungen und das Caching von web_fetch verstehen
sidebarTitle: Web Fetch
summary: web_fetch-Tool -- HTTP-Abruf mit Extraktion lesbarer Inhalte
title: Web-Abruf
x-i18n:
    generated_at: "2026-07-12T02:18:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` führt einen einfachen HTTP-GET aus und extrahiert lesbare Inhalte (HTML in
Markdown oder Text). JavaScript wird dabei **nicht** ausgeführt. Verwenden Sie für stark
JS-basierte Websites oder durch Anmeldung geschützte Seiten stattdessen den
[Webbrowser](/de/tools/browser).

## Schnellstart

Standardmäßig aktiviert, keine Konfiguration erforderlich:

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
Kürzt die Ausgabe auf diese Zeichenanzahl. Wird auf `tools.web.fetch.maxCharsCap` begrenzt.
</ParamField>

## Funktionsweise

<Steps>
  <Step title="Abrufen">
    Sendet einen HTTP-GET mit einem Chrome-ähnlichen User-Agent und dem Header
    `Accept-Language`. Blockiert private/interne Hostnamen und überprüft Weiterleitungen erneut.
  </Step>
  <Step title="Extrahieren">
    Führt Readability (Extraktion des Hauptinhalts) für die HTML-Antwort aus.
  </Step>
  <Step title="Fallback (optional)">
    Wenn Readability fehlschlägt und ein Abruf-Provider verfügbar ist, erfolgt ein
    erneuter Versuch über diesen Provider (beispielsweise mit dem Modus von Firecrawl zur Bot-Umgehung).
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
Seiteninhalt wird abgerufen...
```

Schnelle Cache-Treffer und zügige Netzwerkantworten werden abgeschlossen, bevor der Timer
ausgelöst wird, sodass sie nie eine Fortschrittszeile anzeigen. Beim Abbrechen des Aufrufs wird
der Timer gelöscht. Die Fortschrittszeile ist ausschließlich ein Zustand der Kanaloberfläche und
enthält niemals Inhalte der abgerufenen Seite.

## Konfiguration

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // Standard: true
        provider: "firecrawl", // optional; zur automatischen Erkennung weglassen
        maxChars: 20000, // standardmäßige Anzahl der Ausgabezeichen; durch maxCharsCap begrenzt
        maxCharsCap: 20000, // feste Obergrenze für den Parameter maxChars
        maxResponseBytes: 750000, // maximale Downloadgröße vor der Kürzung (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // einem vertrauenswürdigen HTTP(S)-Umgebungsproxy die DNS-Auflösung überlassen
        readability: true, // Readability-Extraktion verwenden
        userAgent: "Mozilla/5.0 ...", // User-Agent überschreiben
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // explizite Freigabe für vertrauenswürdige Fake-IP-Proxys mit 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // explizite Freigabe für vertrauenswürdige Fake-IP-Proxys mit fc00::/7
        },
      },
    },
  },
}
```

## Firecrawl-Fallback

Wenn die Readability-Extraktion fehlschlägt, kann `web_fetch` für die Bot-Umgehung und eine
bessere Extraktion auf [Firecrawl](/de/tools/firecrawl) zurückgreifen:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; zur automatischen Erkennung anhand verfügbarer Anmeldedaten weglassen
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // optional; für schlüssellosen Starterzugriff weglassen
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // Cache-Dauer (2 Tage)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` ist optional und unterstützt SecretRef-Objekte.
Die ältere Konfiguration `tools.web.fetch.firecrawl.*` wird über `openclaw doctor --fix`
automatisch zu `plugins.entries.firecrawl.config.webFetch` migriert.

<Note>
  Wenn Sie eine SecretRef für den Firecrawl-API-Schlüssel konfigurieren, die nicht aufgelöst
  werden kann und für die kein Fallback über die Umgebungsvariable `FIRECRAWL_API_KEY`
  vorhanden ist, schlägt der Start des Gateways sofort fehl.
</Note>

<Note>
  Überschreibungen von Firecrawl-`baseUrl` sind eingeschränkt: Gehosteter Datenverkehr verwendet
  `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private oder
  interne Endpunkte verweisen, und `http://` wird nur für solche privaten Ziele akzeptiert.
</Note>

Aktuelles Laufzeitverhalten:

- `tools.web.fetch.provider` wählt den Fallback-Provider für den Abruf explizit aus.
- Wenn `provider` weggelassen wird, erkennt OpenClaw automatisch den ersten einsatzbereiten
  Web-Abruf-Provider anhand der konfigurierten Anmeldedaten. `web_fetch` ohne Sandbox kann
  installierte Plugins verwenden, die `contracts.webFetchProviders` deklarieren und zur
  Laufzeit einen passenden Provider registrieren. Das offizielle Firecrawl-Plugin stellt
  derzeit diesen Fallback bereit.
- `web_fetch`-Aufrufe in der Sandbox erlauben gebündelte Provider sowie installierte Provider,
  deren offizielle Herkunft von npm oder ClawHub verifiziert ist. Derzeit ist dadurch das
  offizielle Firecrawl-Plugin zulässig; externe Abruf-Plugins von Drittanbietern bleiben ausgeschlossen.
- Wenn Readability deaktiviert ist, wechselt `web_fetch` direkt zum ausgewählten
  Provider-Fallback. Wenn kein Provider verfügbar ist, schlägt der Aufruf sicher geschlossen fehl.

## Vertrauenswürdiger Umgebungsproxy

Wenn Ihre Bereitstellung erfordert, dass `web_fetch` einen vertrauenswürdigen ausgehenden
HTTP(S)-Proxy verwendet, setzen Sie `tools.web.fetch.useTrustedEnvProxy: true`.

In diesem Modus wendet OpenClaw vor dem Senden der Anfrage weiterhin hostnamebasierte
SSRF-Prüfungen an, überlässt jedoch dem Proxy die DNS-Auflösung, anstatt lokales DNS-Pinning
durchzuführen. Aktivieren Sie dies nur, wenn der Proxy vom Betreiber kontrolliert wird und
nach der DNS-Auflösung Richtlinien für ausgehenden Datenverkehr durchsetzt.

<Note>
  Wenn keine Umgebungsvariable für einen HTTP(S)-Proxy konfiguriert ist oder der Zielhost durch
  `NO_PROXY` ausgeschlossen wird, greift `web_fetch` auf den normalen strikten Pfad mit lokalem
  DNS-Pinning zurück.
</Note>

## Beschränkungen und Sicherheit

- `maxChars` wird auf `tools.web.fetch.maxCharsCap` begrenzt (Standard: `20000`)
- Der Antworttext wird vor der Analyse auf `maxResponseBytes` begrenzt (Standard: `750000`,
  begrenzt auf 32000-10000000); übergroße Antworten werden mit einer Warnung gekürzt
- Private/interne Hostnamen werden blockiert
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` und
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sind eng begrenzte explizite Freigaben
  für vertrauenswürdige Fake-IP-Proxy-Stacks; lassen Sie sie ungesetzt, sofern Ihr Proxy nicht
  Eigentümer dieser synthetischen Bereiche ist und eigene Zielrichtlinien durchsetzt
- Weiterleitungen werden überprüft und durch `maxRedirects` begrenzt (Standard: `3`)
- `useTrustedEnvProxy` muss explizit aktiviert werden und sollte nur für vom Betreiber
  kontrollierte Proxys verwendet werden, die auch nach der DNS-Auflösung Richtlinien für
  ausgehenden Datenverkehr durchsetzen
- `web_fetch` arbeitet nach bestem Bemühen – einige Websites benötigen den [Webbrowser](/de/tools/browser)

## Tool-Profile

Wenn Sie Tool-Profile oder Zulassungslisten verwenden, fügen Sie `web_fetch` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // oder: allow: ["group:web"]  (umfasst web_fetch, web_search und x_search)
  },
}
```

## Verwandte Themen

- [Websuche](/de/tools/web) – das Web mit mehreren Providern durchsuchen
- [Webbrowser](/de/tools/browser) – vollständige Browserautomatisierung für stark JS-basierte Websites
- [Firecrawl](/de/tools/firecrawl) – Firecrawl-Tools für Suche und Scraping
