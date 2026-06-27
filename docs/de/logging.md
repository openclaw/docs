---
read_when:
    - Sie benötigen einen einsteigerfreundlichen Überblick über die Protokollierung in OpenClaw
    - Sie möchten Protokollstufen, Formate oder Schwärzung konfigurieren
    - Sie führen eine Fehlerbehebung durch und müssen schnell Logs finden
summary: Dateiprotokolle, Konsolenausgabe, CLI-Tailing und der Logs-Tab der Control UI
title: Protokollierung
x-i18n:
    generated_at: "2026-06-27T17:39:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw hat zwei zentrale Log-Oberflächen:

- **Datei-Logs** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe**, die in Terminals und in der Gateway Debug UI angezeigt wird.

Der Tab **Logs** der Control UI verfolgt das Gateway-Datei-Log live. Diese Seite erklärt, wo
Logs gespeichert werden, wie Sie sie lesen und wie Sie Log-Level und Formate konfigurieren.

## Wo Logs gespeichert werden

Standardmäßig schreibt das Gateway eine rotierende Log-Datei unter:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.

Jede Datei rotiert, wenn sie `logging.maxFileBytes` erreicht (Standard: 100 MB).
OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei, zum Beispiel
`openclaw-YYYY-MM-DD.1.log`, und schreibt weiter in ein neues aktives Log, statt
Diagnosedaten zu unterdrücken.

Sie können dies in `~/.openclaw/openclaw.json` überschreiben:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Logs lesen

### CLI: Live-Tail (empfohlen)

Verwenden Sie die CLI, um die Gateway-Log-Datei über RPC live zu verfolgen:

```bash
openclaw logs --follow
```

Nützliche aktuelle Optionen:

- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone ausgeben
- `--url <url>` / `--token <token>` / `--timeout <ms>`: Standard-Gateway-RPC-Flags
- `--expect-final`: Warte-Flag für agentengestützte finale RPC-Antwort (hier über die gemeinsame Client-Schicht akzeptiert)

Ausgabemodi:

- **TTY-Sitzungen**: ansprechende, farbige, strukturierte Log-Zeilen.
- **Nicht-TTY-Sitzungen**: Klartext.
- `--json`: zeilenbegrenztes JSON (ein Log-Ereignis pro Zeile).
- `--plain`: Klartext in TTY-Sitzungen erzwingen.
- `--no-color`: ANSI-Farben deaktivieren.

Wenn Sie eine explizite `--url` übergeben, wendet die CLI keine Konfigurations- oder
Umgebungs-Anmeldedaten automatisch an; geben Sie `--token` selbst an, wenn das Ziel-Gateway
Authentifizierung erfordert.

Im JSON-Modus gibt die CLI Objekte mit `type`-Tag aus:

- `meta`: Stream-Metadaten (Datei, Cursor, Größe)
- `log`: geparster Log-Eintrag
- `notice`: Hinweise zu Kürzung / Rotation
- `raw`: ungeparste Log-Zeile

Wenn das implizite local loopback-Gateway Pairing anfordert, während der Verbindung schließt
oder vor einer Antwort von `logs.tail` eine Zeitüberschreitung erreicht, fällt `openclaw logs` automatisch auf das
konfigurierte Gateway-Datei-Log zurück. Explizite `--url`-Ziele verwenden diesen
Fallback nicht. `openclaw logs --follow` ist strenger: Unter Linux verwendet es das aktive
User-systemd-Gateway-Journal nach PID, wenn verfügbar, und versucht andernfalls weiter,
das Live-Gateway zu erreichen, statt einer potenziell veralteten Nebendatei zu folgen.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Logs** der Control UI verfolgt dieselbe Datei mit `logs.tail`.
Siehe [Control UI](/de/web/control-ui), um zu erfahren, wie Sie sie öffnen.

### Nur-Kanal-Logs

Um Kanalaktivität zu filtern (WhatsApp/Telegram/usw.), verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

## Log-Formate

### Datei-Logs (JSONL)

Jede Zeile in der Log-Datei ist ein JSON-Objekt. Die CLI und Control UI parsen diese
Einträge, um strukturierte Ausgabe darzustellen (Zeit, Level, Subsystem, Nachricht).

Datei-Log-JSONL-Datensätze enthalten außerdem maschinenfilterbare Top-Level-Felder, wenn
verfügbar:

- `hostname`: Hostname des Gateways.
- `message`: abgeflachter Log-Nachrichtentext für Volltextsuche.
- `agent_id`: aktive Agenten-ID, wenn der Log-Aufruf Agentenkontext enthält.
- `session_id`: aktive Sitzungs-ID/Schlüssel, wenn der Log-Aufruf Sitzungskontext enthält.
- `channel`: aktiver Kanal, wenn der Log-Aufruf Kanalkontext enthält.

OpenClaw bewahrt die ursprünglichen strukturierten Log-Argumente neben diesen Feldern auf,
sodass bestehende Parser, die nummerierte tslog-Argumentschlüssel lesen, weiter funktionieren.

Aktivitäten für Talk, Echtzeit-Sprache und verwaltete Räume geben begrenzte Lifecycle-Log-
Datensätze über dieselbe Datei-Log-Pipeline aus. Diese Datensätze enthalten Ereignistyp,
Modus, Transport, Provider und Größen-/Timing-Messwerte, wenn verfügbar, lassen aber
Transkripttext, Audio-Payloads, Turn-IDs, Call-IDs und Provider-Item-IDs aus.

### Konsolenausgabe

Konsolen-Logs sind **TTY-bewusst** und für Lesbarkeit formatiert:

- Subsystem-Präfixe (z. B. `gateway/channels/whatsapp`)
- Level-Färbung (info/warn/error)
- Optionaler Kompakt- oder JSON-Modus

Die Konsolenformatierung wird durch `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Logs

`openclaw gateway` verfügt außerdem über WebSocket-Protokoll-Logging für RPC-Verkehr:

- normaler Modus: nur interessante Ergebnisse (Fehler, Parse-Fehler, langsame Aufrufe)
- `--verbose`: sämtlicher Request-/Response-Verkehr
- `--ws-log auto|compact|full`: ausführlichen Darstellungsstil auswählen
- `--compact`: Alias für `--ws-log compact`

Beispiele:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Logging konfigurieren

Die gesamte Logging-Konfiguration befindet sich unter `logging` in `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Log-Level

- `logging.level`: Level für **Datei-Logs** (JSONL).
- `logging.consoleLevel`: Ausführlichkeitslevel für die **Konsole**.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können außerdem die globale CLI-Option **`--log-level <level>`** übergeben (zum Beispiel `openclaw --log-level debug gateway run`), die die Umgebungsvariable für diesen Befehl überschreibt.

`--verbose` wirkt sich nur auf Konsolenausgabe und WS-Log-Ausführlichkeit aus; es ändert
die Datei-Log-Level nicht.

### Gezielte Modelltransport-Diagnose

Verwenden Sie beim Debuggen von Provider-Aufrufen gezielte Umgebungs-Flags, statt
alle Logs auf `debug` zu erhöhen:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Verfügbare Flags:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: Request-Start, Fetch-Response, SDK-
  Header, erstes Streaming-Ereignis, Stream-Abschluss und Transportfehler auf
  `info`-Level ausgeben.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: eine begrenzte Zusammenfassung des Request-Payloads
  in Modell-Request-Logs aufnehmen.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: alle modellseitigen Tool-Namen in
  die Payload-Zusammenfassung aufnehmen.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: einen redigierten, begrenzten JSON-
  Payload-Snapshot aufnehmen. Nur beim Debuggen verwenden; Geheimnisse werden redigiert, aber Prompts
  und Nachrichtentext können weiterhin vorhanden sein.
- `OPENCLAW_DEBUG_SSE=events`: Timing für erstes Ereignis und Stream-Abschluss ausgeben.
- `OPENCLAW_DEBUG_SSE=peek`: außerdem die ersten fünf redigierten SSE-Ereignis-
  Payloads ausgeben, pro Ereignis begrenzt.
- `OPENCLAW_DEBUG_CODE_MODE=1`: Modelloberflächen-Diagnose für Code-Modus ausgeben,
  einschließlich Fällen, in denen native Provider-Tools ausgeblendet werden, weil der Code-Modus die
  Tool-Oberfläche besitzt.

Diese Flags loggen über das normale OpenClaw-Logging, sodass `openclaw logs --follow`
und der Control-UI-Tab Logs sie anzeigen. Ohne die Flags bleiben dieselben Diagnosen
auf `debug`-Level verfügbar.

`[model-fetch]`-Start- und Response-Metadaten (Provider, API, Modell, Status,
Latenz und Request-Felder wie Methode, URL, Timeout, Proxy und Policy)
werden unabhängig von
`OPENCLAW_DEBUG_MODEL_TRANSPORT` immer auf `info`-Level ausgegeben, sodass grundlegende Modelltransport-Hygiene
ohne Debug-Flags sichtbar ist.

### Trace-Korrelation

Datei-Logs sind JSONL. Wenn ein Log-Aufruf einen gültigen Diagnose-Trace-Kontext enthält,
schreibt OpenClaw die Trace-Felder als Top-Level-JSON-Schlüssel (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), sodass externe Log-Prozessoren die Zeile
mit OTEL-Spans und Provider-`traceparent`-Weitergabe korrelieren können.

Gateway-HTTP-Requests und Gateway-WebSocket-Frames richten einen internen Request-
Trace-Scope ein. Logs und Diagnoseereignisse, die innerhalb dieses asynchronen Scopes ausgegeben werden, übernehmen
den Request-Trace, wenn sie keinen expliziten Trace-Kontext übergeben. Agentenlauf- und
Modellaufruf-Traces werden zu Kindern des aktiven Request-Traces, sodass lokale Logs,
Diagnose-Snapshots, OTEL-Spans und vertrauenswürdige Provider-`traceparent`-Header über
`traceId` zusammengeführt werden können, ohne rohe Request- oder Modellinhalte zu loggen.

Talk-Lifecycle-Log-Datensätze fließen außerdem in den diagnostics-otel-Log-Export, wenn
OpenTelemetry-Log-Export aktiviert ist, mit denselben begrenzten Attributen wie Datei-
Logs. Konfigurieren Sie `diagnostics.otel.logsExporter`, um OTLP, stdout JSONL oder
beide Senken auszuwählen.

### Größe und Timing von Modellaufrufen

Modellaufruf-Diagnosen zeichnen begrenzte Request-/Response-Messwerte auf, ohne
rohe Prompt- oder Response-Inhalte zu erfassen:

- `requestPayloadBytes`: UTF-8-Byte-Größe des finalen Modell-Request-Payloads
- `responseStreamBytes`: UTF-8-Byte-Größe gestreamter Modell-Response-Chunk-
  Payloads. Hochfrequente Text-, Thinking- und Tool-Call-Delta-Ereignisse zählen
  nur die inkrementellen `delta`-Bytes statt vollständiger `partial`-Snapshots.
- `timeToFirstByteMs`: verstrichene Zeit bis zum ersten gestreamten Response-Ereignis
- `durationMs`: Gesamtdauer des Modellaufrufs

Diese Felder stehen Diagnose-Snapshots, Modellaufruf-Plugin-Hooks und
OTEL-Modellaufruf-Spans/-Metriken zur Verfügung, wenn Diagnoseexport aktiviert ist.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: menschenfreundlich, farbig, mit Zeitstempeln.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Log-Prozessoren).

### Redigierung

OpenClaw kann sensible Tokens redigieren, bevor sie in Konsolenausgabe, Datei-Logs,
OTLP-Log-Datensätze, persistierten Sitzungstranskripttext oder Control-UI-Tool-
Ereignis-Payloads gelangen (Tool-Start-Argumente, partielle/finale Ergebnis-Payloads, abgeleitete
Exec-Ausgabe und Patch-Zusammenfassungen):

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Strings zum Überschreiben des Standardsatzes. Benutzerdefinierte Muster werden zusätzlich zu den eingebauten Standards für Control-UI-Tool-Payloads angewendet, sodass das Hinzufügen eines Musters die Redigierung von Werten, die bereits von den Standards erfasst werden, nie abschwächt.

Datei-Logs und Sitzungstranskripte bleiben JSONL, aber passende Geheimwerte werden
maskiert, bevor die Zeile oder Nachricht auf die Festplatte geschrieben wird. Redigierung ist Best-Effort:
Sie gilt für texttragende Nachrichteninhalte und Log-Strings, nicht für jedes
Identifier- oder Binär-Payload-Feld.

Die eingebauten Standards decken gängige API-Anmeldedaten und Feldnamen für Zahlungsdaten ab,
wie Kartennummer, CVC/CVV, gemeinsames Zahlungstoken und Zahlungsanmeldedaten,
wenn sie als JSON-Felder, URL-Parameter, CLI-Flags oder Zuweisungen erscheinen.

`logging.redactSensitive: "off"` deaktiviert nur diese allgemeine Log-/Transkript-
Policy. OpenClaw redigiert weiterhin Safety-Boundary-Payloads, die UI-
Clients, Support-Bundles, Diagnosebeobachtern, Genehmigungs-Prompts oder Agenten-
Tools angezeigt werden können. Beispiele sind Control-UI-Tool-Call-Ereignisse, `sessions_history`-Ausgabe,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, Anzeige von Exec-Genehmigungsbefehlen
und Gateway-WebSocket-Protokoll-Logs. Benutzerdefinierte `logging.redactPatterns`
können auf diesen Oberflächen weiterhin projektspezifische Muster hinzufügen.

## Diagnose und OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modellläufe und
Message-Flow-Telemetrie (Webhooks, Warteschlangen, Sitzungszustand). Sie ersetzen Logs **nicht** —
sie speisen Metriken, Traces und Exporter. Ereignisse werden im Prozess ausgegeben,
unabhängig davon, ob Sie sie exportieren.

Zwei angrenzende Oberflächen:

- **OpenTelemetry-Export** — Metriken, Traces und Logs über OTLP/HTTP an
  einen beliebigen OpenTelemetry-kompatiblen Collector oder ein Backend senden (Grafana, Datadog,
  Honeycomb, New Relic, Tempo usw.). Vollständige Konfiguration, Signalkatalog,
  Metrik-/Span-Namen, Umgebungsvariablen und Datenschutzmodell befinden sich auf einer eigenen Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnose-Flags** — gezielte Debug-Log-Flags, die zusätzliche Logs an
  `logging.file` weiterleiten, ohne `logging.level` zu erhöhen. Flags sind nicht groß-/kleinschreibungssensitiv
  und unterstützen Wildcards (`telegram.*`, `*`). Konfigurieren Sie sie unter `diagnostics.flags`
  oder über das Env-Override `OPENCLAW_DIAGNOSTICS=...`. Vollständige Anleitung:
  [Diagnose-Flags](/de/diagnostics/flags).

Um Diagnoseereignisse für Plugins oder benutzerdefinierte Senken ohne OTLP-Export zu aktivieren:

```json5
{
  diagnostics: { enabled: true },
}
```

Für den OTLP-Export an einen Collector siehe [OpenTelemetry-Export](/de/gateway/opentelemetry).

## Tipps zur Fehlerbehebung

- **Gateway nicht erreichbar?** Führen Sie zuerst `openclaw doctor` aus.
- **Logs leer?** Prüfen Sie, ob der Gateway läuft und in den Dateipfad
  in `logging.file` schreibt.
- **Mehr Details erforderlich?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandte Themen

- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP/HTTP-Export, Metrik-/Span-Katalog, Datenschutzmodell
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Log-Flags
- [Interne Gateway-Protokollierung](/de/gateway/logging) — WS-Log-Stile, Subsystem-Präfixe und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige Feldreferenz für `diagnostics.*`
