---
read_when:
    - Sie benötigen einen einsteigerfreundlichen Überblick über das Logging in OpenClaw
    - Sie möchten Log-Level, Formate oder Schwärzung konfigurieren
    - Sie beheben ein Problem und müssen schnell Protokolle finden
summary: Dateiprotokolle, Konsolenausgabe, CLI-Protokollverfolgung und die Registerkarte „Protokolle“ der Control UI
title: Protokollierung
x-i18n:
    generated_at: "2026-05-06T06:54:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw hat zwei zentrale Log-Oberflächen:

- **Datei-Logs** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe**, die in Terminals und in der Gateway Debug UI angezeigt wird.

Der Tab **Protokolle** der Control UI verfolgt das Gateway-Datei-Log live. Diese Seite erklärt, wo
Logs gespeichert werden, wie Sie sie lesen und wie Sie Log-Level und Formate konfigurieren.

## Speicherort der Logs

Standardmäßig schreibt das Gateway eine rotierende Log-Datei unter:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.

Jede Datei rotiert, wenn sie `logging.maxFileBytes` erreicht (Standard: 100 MB).
OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei, zum Beispiel
`openclaw-YYYY-MM-DD.1.log`, und schreibt weiter in ein neues aktives Log, anstatt
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

Verwenden Sie die CLI, um das Gateway-Log per RPC live zu verfolgen:

```bash
openclaw logs --follow
```

Nützliche aktuelle Optionen:

- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen
- `--url <url>` / `--token <token>` / `--timeout <ms>`: Standard-Gateway-RPC-Flags
- `--expect-final`: Warte-Flag für die agentengestützte finale RPC-Antwort (hier über die gemeinsame Client-Schicht akzeptiert)

Ausgabemodi:

- **TTY-Sitzungen**: ansprechende, farbige, strukturierte Log-Zeilen.
- **Nicht-TTY-Sitzungen**: Klartext.
- `--json`: zeilenbegrenztes JSON (ein Log-Ereignis pro Zeile).
- `--plain`: Klartext in TTY-Sitzungen erzwingen.
- `--no-color`: ANSI-Farben deaktivieren.

Wenn Sie eine explizite `--url` übergeben, wendet die CLI Konfigurations- oder
Umgebungsanmeldedaten nicht automatisch an; geben Sie `--token` selbst an, wenn das Ziel-Gateway
Authentifizierung erfordert.

Im JSON-Modus gibt die CLI Objekte mit `type`-Tag aus:

- `meta`: Stream-Metadaten (Datei, Cursor, Größe)
- `log`: geparster Log-Eintrag
- `notice`: Hinweise zu Kürzung/Rotation
- `raw`: ungeparste Log-Zeile

Wenn das implizite lokale local loopback Gateway Pairing anfordert, während des Verbindens schließt
oder vor der Antwort von `logs.tail` ein Timeout erreicht, fällt `openclaw logs` automatisch auf das
konfigurierte Gateway-Datei-Log zurück. Explizite `--url`-Ziele verwenden diesen Fallback nicht.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Protokolle** der Control UI verfolgt dieselbe Datei mit `logs.tail`.
Siehe [Control UI](/de/web/control-ui), um zu erfahren, wie Sie sie öffnen.

### Nur Kanal-Logs

Um Kanalaktivität (WhatsApp/Telegram/usw.) zu filtern, verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

## Log-Formate

### Datei-Logs (JSONL)

Jede Zeile in der Log-Datei ist ein JSON-Objekt. Die CLI und die Control UI parsen diese
Einträge, um strukturierte Ausgabe darzustellen (Zeit, Level, Subsystem, Nachricht).

JSONL-Datensätze von Datei-Logs enthalten außerdem maschinenfilterbare Felder auf oberster Ebene, sofern
verfügbar:

- `hostname`: Hostname des Gateway.
- `message`: abgeflachter Log-Nachrichtentext für Volltextsuche.
- `agent_id`: aktive Agent-ID, wenn der Log-Aufruf Agent-Kontext enthält.
- `session_id`: aktive Sitzungs-ID bzw. aktiver Sitzungsschlüssel, wenn der Log-Aufruf Sitzungskontext enthält.
- `channel`: aktiver Kanal, wenn der Log-Aufruf Kanalkontext enthält.

OpenClaw bewahrt die ursprünglichen strukturierten Log-Argumente neben diesen Feldern auf,
sodass vorhandene Parser, die nummerierte tslog-Argumentschlüssel lesen, weiterhin funktionieren.

### Konsolenausgabe

Konsolen-Logs sind **TTY-bewusst** und für Lesbarkeit formatiert:

- Subsystem-Präfixe (z. B. `gateway/channels/whatsapp`)
- Level-Farbgebung (info/warn/error)
- Optionaler kompakter oder JSON-Modus

Die Konsolenformatierung wird durch `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Logs

`openclaw gateway` verfügt außerdem über WebSocket-Protokoll-Logging für RPC-Verkehr:

- normaler Modus: nur relevante Ergebnisse (Fehler, Parse-Fehler, langsame Aufrufe)
- `--verbose`: gesamter Anfrage-/Antwortverkehr
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
- `logging.consoleLevel`: Ausführlichkeitslevel der **Konsole**.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können auch die globale CLI-Option **`--log-level <level>`** übergeben (zum Beispiel `openclaw --log-level debug gateway run`), die die Umgebungsvariable für diesen Befehl überschreibt.

`--verbose` beeinflusst nur die Konsolenausgabe und die WS-Log-Ausführlichkeit; es ändert keine
Datei-Log-Level.

### Trace-Korrelation

Datei-Logs sind JSONL. Wenn ein Log-Aufruf einen gültigen diagnostischen Trace-Kontext enthält,
schreibt OpenClaw die Trace-Felder als JSON-Schlüssel auf oberster Ebene (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), sodass externe Log-Prozessoren die Zeile
mit OTEL-Spans und Provider-`traceparent`-Weitergabe korrelieren können.

Gateway-HTTP-Anfragen und Gateway-WebSocket-Frames richten einen internen Anfrage-Trace-Scope ein.
Logs und Diagnoseereignisse, die innerhalb dieses asynchronen Scopes ausgegeben werden, erben
den Anfrage-Trace, wenn sie keinen expliziten Trace-Kontext übergeben. Agent-Ausführungen und
Modellaufruf-Traces werden zu untergeordneten Elementen des aktiven Anfrage-Traces, sodass lokale Logs,
Diagnose-Snapshots, OTEL-Spans und vertrauenswürdige Provider-`traceparent`-Header
über `traceId` verknüpft werden können, ohne rohe Anfrage- oder Modellinhalte zu loggen.

### Größe und Timing von Modellaufrufen

Diagnosen für Modellaufrufe erfassen begrenzte Anfrage-/Antwortmessungen, ohne
rohe Prompt- oder Antwortinhalte zu erfassen:

- `requestPayloadBytes`: UTF-8-Byte-Größe der finalen Modellanfrage-Payload
- `responseStreamBytes`: UTF-8-Byte-Größe gestreamter Modellantwortereignisse
- `timeToFirstByteMs`: verstrichene Zeit bis zum ersten gestreamten Antwortereignis
- `durationMs`: Gesamtdauer des Modellaufrufs

Diese Felder stehen Diagnose-Snapshots, Plugin-Hooks für Modellaufrufe und
OTEL-Spans/-Metriken für Modellaufrufe zur Verfügung, wenn der Diagnoseexport aktiviert ist.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: menschenfreundlich, farbig, mit Zeitstempeln.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Log-Prozessoren).

### Schwärzung

OpenClaw kann sensible Tokens schwärzen, bevor sie Konsolenausgabe, Datei-Logs,
OTLP-Log-Datensätze, persistierten Sitzungstranskripttext oder Tool-Ereignis-Payloads der Control UI
erreichen (Tool-Startargumente, partielle/finale Ergebnis-Payloads, abgeleitete
Exec-Ausgabe und Patch-Zusammenfassungen):

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Strings zum Überschreiben der Standardmenge. Benutzerdefinierte Muster werden zusätzlich zu den integrierten Standards für Tool-Payloads der Control UI angewendet, sodass das Hinzufügen eines Musters die Schwärzung von Werten, die bereits von den Standards erfasst werden, nie abschwächt.

Datei-Logs und Sitzungstranskripte bleiben JSONL, aber passende geheime Werte werden
maskiert, bevor die Zeile oder Nachricht auf die Festplatte geschrieben wird. Schwärzung erfolgt nach bestem Aufwand:
Sie gilt für texttragende Nachrichteninhalte und Log-Strings, nicht für jedes
Bezeichner- oder Binär-Payload-Feld.

Die integrierten Standards decken gängige API-Anmeldedaten und Feldnamen für Zahlungsanmeldedaten ab,
etwa Kartennummer, CVC/CVV, gemeinsam verwendetes Zahlungstoken und Zahlungsanmeldedaten,
wenn sie als JSON-Felder, URL-Parameter, CLI-Flags oder Zuweisungen erscheinen.

`logging.redactSensitive: "off"` deaktiviert nur diese allgemeine Log-/Transkript-
Richtlinie. OpenClaw schwärzt weiterhin Payloads an Sicherheitsgrenzen, die UI-
Clients, Support-Bundles, Diagnosebeobachtern, Genehmigungs-Prompts oder Agent-
Tools angezeigt werden können. Beispiele sind Tool-Aufrufereignisse der Control UI, `sessions_history`-Ausgabe,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, Anzeige von Exec-Genehmigungsbefehlen
und Gateway-WebSocket-Protokoll-Logs. Benutzerdefinierte `logging.redactPatterns`
können auf diesen Oberflächen weiterhin projektspezifische Muster hinzufügen.

## Diagnosen und OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modellausführungen und
Nachrichtenfluss-Telemetrie (Webhooks, Warteschlangen, Sitzungsstatus). Sie ersetzen Logs **nicht**,
sondern speisen Metriken, Traces und Exporter. Ereignisse werden prozessintern ausgegeben,
unabhängig davon, ob Sie sie exportieren.

Zwei benachbarte Oberflächen:

- **OpenTelemetry-Export** — Metriken, Traces und Logs per OTLP/HTTP an
  jeden OpenTelemetry-kompatiblen Collector oder jedes Backend senden (Grafana, Datadog,
  Honeycomb, New Relic, Tempo usw.). Vollständige Konfiguration, Signalkatalog,
  Metrik-/Span-Namen, Umgebungsvariablen und Datenschutzmodell befinden sich auf einer eigenen Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnose-Flags** — gezielte Debug-Log-Flags, die zusätzliche Logs an
  `logging.file` weiterleiten, ohne `logging.level` zu erhöhen. Flags unterscheiden nicht zwischen Groß- und Kleinschreibung
  und unterstützen Platzhalter (`telegram.*`, `*`). Konfigurieren Sie sie unter `diagnostics.flags`
  oder über die Umgebungsüberschreibung `OPENCLAW_DIAGNOSTICS=...`. Vollständiger Leitfaden:
  [Diagnose-Flags](/de/diagnostics/flags).

Um Diagnoseereignisse für Plugins oder benutzerdefinierte Senken ohne OTLP-Export zu aktivieren:

```json5
{
  diagnostics: { enabled: true },
}
```

Für OTLP-Export an einen Collector siehe [OpenTelemetry-Export](/de/gateway/opentelemetry).

## Tipps zur Fehlerbehebung

- **Gateway nicht erreichbar?** Führen Sie zuerst `openclaw doctor` aus.
- **Logs leer?** Prüfen Sie, ob das Gateway läuft und in den Dateipfad
  in `logging.file` schreibt.
- **Mehr Details erforderlich?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandte Themen

- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP/HTTP-Export, Metrik-/Span-Katalog, Datenschutzmodell
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Log-Flags
- [Gateway-Logging-Interna](/de/gateway/logging) — WS-Log-Stile, Subsystem-Präfixe und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige `diagnostics.*`-Feldreferenz
