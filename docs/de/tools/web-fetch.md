---
read_when:
    - Sie möchten eine URL abrufen und lesbare Inhalte extrahieren
    - Sie müssen `web_fetch` oder dessen Firecrawl-Fallback konfigurieren.
    - Sie möchten die Limits und das Caching von web_fetch verstehen
sidebarTitle: Web Fetch
summary: web_fetch-Tool -- HTTP-Abruf mit Extraktion lesbarer Inhalte
title: Webabruf
x-i18n:
    generated_at: "2026-07-12T16:07:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` führt einen einfachen HTTP-GET aus und extrahiert lesbare Inhalte (HTML zu
Markdown oder Text). JavaScript wird **nicht** ausgeführt. Verwenden Sie für JS-lastige Websites oder
anmeldegeschützte Seiten stattdessen den [Webbrowser](/de/tools/browser).

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
Kürzt die Ausgabe auf diese Zeichenanzahl. Begrenzt auf `tools.web.fetch.maxCharsCap`.
</ParamField>

## Funktionsweise

<Steps>
  <Step title="Abrufen">
    Sendet einen HTTP-GET mit einem Chrome-ähnlichen User-Agent- und `Accept-Language`-
    Header. Blockiert private/interne Hostnamen und prüft Weiterleitungen erneut.
  </Step>
  <Step title="Extrahieren">
    Führt Readability (Extraktion des Hauptinhalts) für die HTML-Antwort aus.
  </Step>
  <Step title="Fallback (optional)">
    Falls Readability fehlschlägt und ein Abruf-Provider verfügbar ist, wird der Abruf über
    diesen Provider wiederholt (zum Beispiel mit dem Bot-Umgehungsmodus von Firecrawl).
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
ausgelöst wird, sodass sie nie eine Fortschrittszeile anzeigen. Beim Abbrechen des Aufrufs wird der Timer
gelöscht. Die Fortschrittszeile ist ausschließlich ein UI-Status des Kanals und enthält niemals abgerufene Seiteninhalte.

## Konfiguration

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // Standard: true
        provider: "firecrawl", // optional; zur automatischen Erkennung weglassen
        maxChars: 20000, // Standardanzahl der Ausgabezeichen; durch maxCharsCap begrenzt
        maxCharsCap: 20000, // feste Obergrenze für den Parameter maxChars
        maxResponseBytes: 750000, // maximale Downloadgröße vor der Kürzung (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // einem vertrauenswürdigen HTTP(S)-Umgebungsproxy die DNS-Auflösung überlassen
        readability: true, // Readability-Extraktion verwenden
        userAgent: "Mozilla/5.0 ...", // User-Agent überschreiben
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // Opt-in für vertrauenswürdige Fake-IP-Proxys, die 198.18.0.0/15 verwenden
          allowIpv6UniqueLocalRange: true, // Opt-in für vertrauenswürdige Fake-IP-Proxys, die fc00::/7 verwenden
        },
      },
    },
  },
}
```

## Firecrawl-Fallback

Falls die Readability-Extraktion fehlschlägt, kann `web_fetch` für die Bot-Umgehung und eine
bessere Extraktion auf [Firecrawl](/de/tools/firecrawl) zurückgreifen:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; zur automatischen Erkennung anhand verfügbarer Zugangsdaten weglassen
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
Die alte Konfiguration `tools.web.fetch.firecrawl.*` wird über `openclaw doctor --fix`
automatisch zu `plugins.entries.firecrawl.config.webFetch` migriert.

<Note>
  Wenn Sie eine SecretRef für den Firecrawl-API-Schlüssel konfigurieren, diese nicht aufgelöst werden kann und kein
  `FIRECRAWL_API_KEY`-Umgebungs-Fallback vorhanden ist, schlägt der Start des Gateways sofort fehl.
</Note>

<Note>
  Überschreibungen von Firecrawl `baseUrl` sind eingeschränkt: Gehosteter Datenverkehr verwendet
  `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private oder
  interne Endpunkte verweisen, und `http://` wird nur für solche privaten Ziele akzeptiert.
</Note>

Aktuelles Laufzeitverhalten:

- `tools.web.fetch.provider` wählt den Fallback-Provider für den Abruf explizit aus.
- Wenn `provider` weggelassen wird, erkennt OpenClaw automatisch den ersten einsatzbereiten Webabruf-
  Provider anhand der konfigurierten Zugangsdaten. `web_fetch` außerhalb einer Sandbox kann
  installierte Plugins verwenden, die `contracts.webFetchProviders` deklarieren und zur Laufzeit einen
  passenden Provider registrieren. Das offizielle Firecrawl-Plugin stellt derzeit diesen
  Fallback bereit.
- `web_fetch`-Aufrufe in einer Sandbox erlauben gebündelte Provider sowie installierte Provider,
  deren offizielle npm- oder ClawHub-Herkunft verifiziert ist. Derzeit ist dadurch das
  offizielle Firecrawl-Plugin zulässig; externe Abruf-Plugins von Drittanbietern bleiben ausgeschlossen.
- Wenn Readability deaktiviert ist, wechselt `web_fetch` direkt zum ausgewählten
  Provider-Fallback. Wenn kein Provider verfügbar ist, schlägt der Vorgang sicher geschlossen fehl.

## Vertrauenswürdiger Umgebungsproxy

Wenn Ihre Bereitstellung erfordert, dass `web_fetch` einen vertrauenswürdigen ausgehenden
HTTP(S)-Proxy verwendet, legen Sie `tools.web.fetch.useTrustedEnvProxy: true` fest.

In diesem Modus wendet OpenClaw weiterhin hostnamenbasierte SSRF-Prüfungen an, bevor die
Anfrage gesendet wird, überlässt jedoch dem Proxy die DNS-Auflösung, statt lokales DNS-
Pinning durchzuführen. Aktivieren Sie dies nur, wenn der Proxy vom Betreiber kontrolliert wird und
die Richtlinie für ausgehenden Datenverkehr nach der DNS-Auflösung durchsetzt.

<Note>
  Wenn keine Umgebungsvariable für einen HTTP(S)-Proxy konfiguriert ist oder der Zielhost durch
  `NO_PROXY` ausgeschlossen wird, greift `web_fetch` auf den normalen strikten Pfad mit lokalem DNS-
  Pinning zurück.
</Note>

## Grenzen und Sicherheit

- `maxChars` wird auf `tools.web.fetch.maxCharsCap` begrenzt (Standard: `20000`)
- Der Antworttext wird vor der Verarbeitung auf `maxResponseBytes` begrenzt (Standard: `750000`, begrenzt auf
  32000-10000000); übergroße Antworten werden mit einer Warnung gekürzt
- Private/interne Hostnamen werden blockiert
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` und
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sind eng begrenzte Opt-ins
  für vertrauenswürdige Fake-IP-Proxy-Stacks; lassen Sie sie nicht gesetzt, sofern Ihr Proxy nicht
  Eigentümer dieser synthetischen Bereiche ist und eine eigene Zielrichtlinie durchsetzt
- Weiterleitungen werden geprüft und durch `maxRedirects` begrenzt (Standard: `3`)
- `useTrustedEnvProxy` ist ein explizites Opt-in und sollte nur für
  betreiberkontrollierte Proxys aktiviert werden, die auch nach der DNS-
  Auflösung eine Richtlinie für ausgehenden Datenverkehr durchsetzen
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
- [Webbrowser](/de/tools/browser) – vollständige Browserautomatisierung für JS-lastige Websites
- [Firecrawl](/de/tools/firecrawl) – Firecrawl-Tools zum Suchen und Scrapen
