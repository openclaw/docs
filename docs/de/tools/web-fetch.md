---
read_when:
    - Sie möchten eine URL abrufen und lesbare Inhalte extrahieren
    - Sie müssen web_fetch oder dessen Firecrawl-Fallback konfigurieren.
    - Sie möchten die Limits und das Caching von web_fetch verstehen
sidebarTitle: Web Fetch
summary: web_fetch-Tool – HTTP-Abruf mit Extraktion lesbarer Inhalte
title: Webabruf
x-i18n:
    generated_at: "2026-07-24T04:12:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ddf312245064672dcf489e8714740fa3e034827e16b33be8fb6a87db04f19ef8
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` führt einen einfachen HTTP-GET aus und extrahiert lesbare Inhalte (HTML in
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
Ausgabe auf diese Zeichenanzahl kürzen. Wird auf `tools.web.fetch.maxCharsCap` begrenzt.
</ParamField>

## Ergebnis

`web_fetch` gibt ein abgeschlossenes strukturiertes Ergebnis mit diesen Feldern zurück:

- Anfragemetadaten: `url`, `finalUrl`, `status`, `extractMode` und `extractor`
- Optionale Antwortmetadaten: `contentType`, `title` und `warning` (werden bei Nichtvorhandensein weggelassen)
- Metadaten des umschlossenen Inhalts: `externalContent`, `truncated`, `length`, `rawLength`,
  `fetchedAt`, `tookMs` und `text`
- Optional `cached: true` bei einem Cache-Treffer
- Optional `spill: { path, chars, truncated? }`, wenn gekürzte Inhalte in eine private temporäre Datei geschrieben wurden;
  `truncated` ist nur vorhanden, wenn diese Datei
  unvollständige Quellinhalte enthält

`length` ist die Länge des umschlossenen `text`. `rawLength` ist die Länge des extrahierten Inhalts
vor der Umschließung externer Inhalte.

## Funktionsweise

<Steps>
  <Step title="Abrufen">
    Sendet einen HTTP-GET mit einem Chrome-ähnlichen User-Agent und dem Header `Accept-Language`.
    Private/interne Hostnamen werden blockiert und Weiterleitungen erneut geprüft.
  </Step>
  <Step title="Extrahieren">
    Führt Readability (Extraktion des Hauptinhalts) für die HTML-Antwort aus.
  </Step>
  <Step title="Fallback (optional)">
    Wenn Readability fehlschlägt und ein Abruf-Provider verfügbar ist, wird der Abruf über
    diesen Provider wiederholt (zum Beispiel mit dem Bot-Umgehungsmodus von Firecrawl).
  </Step>
  <Step title="Cache">
    Ergebnisse werden 15 Minuten lang zwischengespeichert (konfigurierbar), um wiederholte
    Abrufe derselben URL zu reduzieren.
  </Step>
</Steps>

## Fortschrittsmeldungen

`web_fetch` gibt nur dann eine öffentliche Fortschrittszeile aus, wenn der Abruf
nach fünf Sekunden noch aussteht:

```text
Seiteninhalt wird abgerufen...
```

Schnelle Cache-Treffer und zügige Netzwerkantworten werden abgeschlossen, bevor der Timer auslöst, und
zeigen daher nie eine Fortschrittszeile an. Beim Abbrechen des Aufrufs wird der Timer gelöscht. Die
Fortschrittszeile ist ausschließlich ein Zustand der Kanal-Benutzeroberfläche und enthält niemals abgerufene Seiteninhalte.

## Konfiguration

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // Standard: true
        provider: "firecrawl", // optional; für automatische Erkennung weglassen
        maxChars: 20000, // standardmäßige Anzahl der Ausgabezeichen; durch maxCharsCap begrenzt
        maxCharsCap: 20000, // feste Obergrenze für den Parameter maxChars
        maxResponseBytes: 750000, // maximale Downloadgröße vor der Kürzung (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // DNS durch einen vertrauenswürdigen HTTP(S)-Umgebungsproxy auflösen lassen
        readability: true, // Readability-Extraktion verwenden
        userAgent: "Mozilla/5.0 ...", // User-Agent überschreiben
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // explizite Aktivierung für vertrauenswürdige Fake-IP-Proxys mit 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // explizite Aktivierung für vertrauenswürdige Fake-IP-Proxys mit fc00::/7
        },
      },
    },
  },
}
```

## Firecrawl-Fallback

Wenn die Readability-Extraktion fehlschlägt, kann `web_fetch` für die Bot-Umgehung
und eine bessere Extraktion auf [Firecrawl](/de/tools/firecrawl) zurückgreifen:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; für automatische Erkennung anhand verfügbarer Anmeldedaten weglassen
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
  Wenn Sie eine SecretRef für einen Firecrawl-API-Schlüssel konfigurieren, die nicht aufgelöst werden kann und für die
  kein Umgebungs-Fallback `FIRECRAWL_API_KEY` vorhanden ist, schlägt der Start des Gateways sofort fehl.
</Note>

<Note>
  Überschreibungen von Firecrawl `baseUrl` sind streng eingeschränkt: Gehosteter Datenverkehr verwendet
  `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private oder
  interne Endpunkte zielen, und `http://` wird nur für diese privaten Ziele akzeptiert.
</Note>

Aktuelles Laufzeitverhalten:

- `tools.web.fetch.provider` wählt den Fallback-Provider für den Abruf explizit aus.
- Wenn `provider` weggelassen wird, erkennt OpenClaw automatisch den ersten einsatzbereiten Webabruf-
  Provider anhand der konfigurierten Anmeldedaten. Nicht in einer Sandbox ausgeführte `web_fetch` können
  installierte Plugins verwenden, die `contracts.webFetchProviders` deklarieren und zur Laufzeit einen
  passenden Provider registrieren. Das offizielle Firecrawl-Plugin stellt derzeit
  diesen Fallback bereit.
- In einer Sandbox ausgeführte `web_fetch`-Aufrufe erlauben gebündelte Provider sowie installierte Provider,
  deren offizielle npm- oder ClawHub-Herkunft verifiziert wurde. Derzeit ist dadurch das
  offizielle Firecrawl-Plugin zulässig; externe Abruf-Plugins von Drittanbietern bleiben ausgeschlossen.
- Wenn Readability deaktiviert ist, wechselt `web_fetch` direkt zum ausgewählten
  Provider-Fallback. Ist kein Provider verfügbar, schlägt der Vorgang sicher geschlossen fehl.

## Vertrauenswürdiger Umgebungsproxy

Wenn Ihre Bereitstellung erfordert, dass `web_fetch` über einen vertrauenswürdigen ausgehenden
HTTP(S)-Proxy geleitet wird, legen Sie `tools.web.fetch.useTrustedEnvProxy: true` fest.

In diesem Modus wendet OpenClaw vor dem Senden der Anfrage weiterhin hostnamenbasierte SSRF-Prüfungen an,
überlässt jedoch dem Proxy die DNS-Auflösung, anstatt eine lokale DNS-Bindung vorzunehmen.
Aktivieren Sie dies nur, wenn der Proxy vom Betreiber kontrolliert wird und
nach der DNS-Auflösung ausgehende Richtlinien durchsetzt.

<Note>
  Wenn keine HTTP(S)-Proxy-Umgebungsvariable konfiguriert ist oder der Zielhost durch
  `NO_PROXY` ausgeschlossen wird, greift `web_fetch` auf den normalen strikten Pfad mit lokaler
  DNS-Bindung zurück.
</Note>

## Beschränkungen und Sicherheit

- `maxChars` wird auf `tools.web.fetch.maxCharsCap` begrenzt (Standardwert `20000`)
- Der Antworttext wird vor der Verarbeitung auf `maxResponseBytes` begrenzt (Standardwert `750000`, begrenzt auf
  32000-10000000); übergroße Antworten werden mit einer Warnung gekürzt
- Private/interne Hostnamen werden blockiert
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` und
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sind eng begrenzte explizite Aktivierungen
  für vertrauenswürdige Fake-IP-Proxy-Stacks; lassen Sie sie ungesetzt, sofern Ihr Proxy nicht
  Eigentümer dieser synthetischen Bereiche ist und eine eigene Zielrichtlinie durchsetzt
- Weiterleitungen werden geprüft und durch `maxRedirects` begrenzt (Standardwert `3`)
- `useTrustedEnvProxy` muss ausdrücklich aktiviert werden und sollte nur für
  vom Betreiber kontrollierte Proxys aktiviert werden, die auch nach der DNS-
  Auflösung ausgehende Richtlinien durchsetzen
- `web_fetch` arbeitet nach bestem Bemühen – einige Websites benötigen den [Webbrowser](/de/tools/browser)

## Tool-Profile

Wenn Sie Tool-Profile oder Positivlisten verwenden, fügen Sie `web_fetch` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // oder: allow: ["group:web"]  (enthält web_fetch, web_search und x_search)
  },
}
```

## Verwandte Themen

- [Websuche](/de/tools/web) – das Web mit mehreren Providern durchsuchen
- [Webbrowser](/de/tools/browser) – vollständige Browserautomatisierung für JS-lastige Websites
- [Firecrawl](/de/tools/firecrawl) – Such- und Scraping-Tools von Firecrawl
