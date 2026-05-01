---
read_when:
    - Sie benötigen einen einsteigerfreundlichen Überblick über die Protokollierung in OpenClaw
    - Sie möchten Log-Level, Formate oder Schwärzung konfigurieren
    - Sie führen eine Fehlerbehebung durch und müssen Protokolle schnell finden
summary: Logdateien, Konsolenausgabe, CLI-Tailing und die Registerkarte „Protokolle“ der Control UI
title: Protokollierung
x-i18n:
    generated_at: "2026-05-01T06:43:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw hat zwei zentrale Protokolloberflächen:

- **Dateiprotokolle** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe**, die in Terminals und in der Gateway-Debug-UI angezeigt wird.

Der Tab **Protokolle** der Control UI verfolgt das Gateway-Dateiprotokoll live. Diese Seite erklärt, wo
Protokolle gespeichert werden, wie Sie sie lesen und wie Sie Protokollstufen und -formate konfigurieren.

## Speicherort der Protokolle

Standardmäßig schreibt das Gateway eine rotierende Protokolldatei unter:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.

Jede Datei rotiert, wenn sie `logging.maxFileBytes` erreicht (Standard: 100 MB).
OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei, zum Beispiel
`openclaw-YYYY-MM-DD.1.log`, und schreibt weiter in ein neues aktives Protokoll, statt
Diagnosedaten zu unterdrücken.

Sie können dies in `~/.openclaw/openclaw.json` überschreiben:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Protokolle lesen

### CLI: Live-Verfolgung (empfohlen)

Verwenden Sie die CLI, um die Gateway-Protokolldatei per RPC live zu verfolgen:

```bash
openclaw logs --follow
```

Nützliche aktuelle Optionen:

- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen
- `--url <url>` / `--token <token>` / `--timeout <ms>`: Standard-Gateway-RPC-Flags
- `--expect-final`: Warte-Flag für agentengestützte RPC-Endantworten (hier über die gemeinsam genutzte Client-Schicht akzeptiert)

Ausgabemodi:

- **TTY-Sitzungen**: ansprechende, farbige, strukturierte Protokollzeilen.
- **Nicht-TTY-Sitzungen**: Klartext.
- `--json`: zeilengetrenntes JSON (ein Protokollereignis pro Zeile).
- `--plain`: Klartext in TTY-Sitzungen erzwingen.
- `--no-color`: ANSI-Farben deaktivieren.

Wenn Sie ein explizites `--url` übergeben, wendet die CLI Konfigurations- oder
Umgebungszugangsdaten nicht automatisch an; geben Sie `--token` selbst an, wenn das Ziel-Gateway
Authentifizierung erfordert.

Im JSON-Modus gibt die CLI Objekte mit `type`-Kennzeichnung aus:

- `meta`: Stream-Metadaten (Datei, Cursor, Größe)
- `log`: geparster Protokolleintrag
- `notice`: Hinweise zu Kürzung / Rotation
- `raw`: ungeparste Protokollzeile

Wenn das implizite local loopback-Gateway eine Kopplung anfordert, während der Verbindung schließt
oder eine Zeitüberschreitung auftritt, bevor `logs.tail` antwortet, fällt `openclaw logs`
automatisch auf das konfigurierte Gateway-Dateiprotokoll zurück. Explizite `--url`-Ziele verwenden
diesen Rückfall nicht.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus, Folgendes auszuführen:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Protokolle** der Control UI verfolgt dieselbe Datei mit `logs.tail`.
Siehe [/web/control-ui](/de/web/control-ui), um zu erfahren, wie Sie sie öffnen.

### Nur-Kanal-Protokolle

Um Kanalaktivität (WhatsApp/Telegram/usw.) zu filtern, verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

## Protokollformate

### Dateiprotokolle (JSONL)

Jede Zeile in der Protokolldatei ist ein JSON-Objekt. Die CLI und die Control UI parsen diese
Einträge, um strukturierte Ausgabe darzustellen (Zeit, Stufe, Subsystem, Nachricht).

JSONL-Datensätze des Dateiprotokolls enthalten außerdem maschinenfilterbare Felder auf oberster Ebene, sofern
verfügbar:

- `hostname`: Hostname des Gateways.
- `message`: abgeflachter Protokollnachrichtentext für Volltextsuche.
- `agent_id`: aktive Agent-ID, wenn der Protokollaufruf Agent-Kontext mitführt.
- `session_id`: aktive Sitzungs-ID bzw. aktiver Sitzungsschlüssel, wenn der Protokollaufruf Sitzungskontext mitführt.
- `channel`: aktiver Kanal, wenn der Protokollaufruf Kanalkontext mitführt.

OpenClaw bewahrt die ursprünglichen strukturierten Protokollargumente neben diesen Feldern auf,
sodass vorhandene Parser, die nummerierte tslog-Argumentschlüssel lesen, weiter funktionieren.

### Konsolenausgabe

Konsolenprotokolle sind **TTY-bewusst** und für Lesbarkeit formatiert:

- Subsystem-Präfixe (z. B. `gateway/channels/whatsapp`)
- Farbliche Hervorhebung nach Stufe (info/warn/error)
- Optionaler Kompakt- oder JSON-Modus

Die Konsolenformatierung wird durch `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Protokolle

`openclaw gateway` verfügt außerdem über WebSocket-Protokollierung für RPC-Datenverkehr:

- normaler Modus: nur interessante Ergebnisse (Fehler, Parse-Fehler, langsame Aufrufe)
- `--verbose`: gesamter Anfrage-/Antwortdatenverkehr
- `--ws-log auto|compact|full`: den ausführlichen Darstellungsstil auswählen
- `--compact`: Alias für `--ws-log compact`

Beispiele:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Protokollierung konfigurieren

Die gesamte Protokollierungskonfiguration befindet sich unter `logging` in `~/.openclaw/openclaw.json`.

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

### Protokollstufen

- `logging.level`: Stufe für **Dateiprotokolle** (JSONL).
- `logging.consoleLevel`: Ausführlichkeitsstufe der **Konsole**.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können außerdem die globale CLI-Option **`--log-level <level>`** übergeben (zum Beispiel `openclaw --log-level debug gateway run`), die die Umgebungsvariable für diesen Befehl überschreibt.

`--verbose` wirkt sich nur auf Konsolenausgabe und Ausführlichkeit der WS-Protokolle aus; es ändert
keine Dateiprotokollstufen.

### Trace-Korrelation

Dateiprotokolle sind JSONL. Wenn ein Protokollaufruf einen gültigen Diagnose-Trace-Kontext mitführt,
schreibt OpenClaw die Trace-Felder als JSON-Schlüssel auf oberster Ebene (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), damit externe Protokollprozessoren die Zeile
mit OTEL-Spans und der Provider-`traceparent`-Weitergabe korrelieren können.

Gateway-HTTP-Anfragen und Gateway-WebSocket-Frames erstellen einen internen Anfrage-Trace-Scope.
Protokolle und Diagnoseereignisse, die innerhalb dieses asynchronen Scopes ausgegeben werden, erben
den Anfrage-Trace, wenn sie keinen expliziten Trace-Kontext übergeben. Agent-Lauf- und
Modellaufruf-Traces werden zu Kindern des aktiven Anfrage-Traces, sodass lokale Protokolle,
Diagnose-Snapshots, OTEL-Spans und vertrauenswürdige Provider-`traceparent`-Header
über `traceId` verknüpft werden können, ohne rohe Anfrage- oder Modellinhalte zu protokollieren.

### Größe und Zeitverhalten von Modellaufrufen

Modellaufruf-Diagnosen zeichnen begrenzte Anfrage-/Antwortmessungen auf, ohne
rohe Prompt- oder Antwortinhalte zu erfassen:

- `requestPayloadBytes`: UTF-8-Bytegröße der endgültigen Modellanfrage-Nutzlast
- `responseStreamBytes`: UTF-8-Bytegröße gestreamter Modellantwortereignisse
- `timeToFirstByteMs`: verstrichene Zeit bis zum ersten gestreamten Antwortereignis
- `durationMs`: Gesamtdauer des Modellaufrufs

Diese Felder stehen Diagnose-Snapshots, Modellaufruf-Plugin-Hooks und
OTEL-Modellaufruf-Spans/-Metriken zur Verfügung, wenn der Diagnoseexport aktiviert ist.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: benutzerfreundlich, farbig, mit Zeitstempeln.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Protokollprozessoren).

### Schwärzung

OpenClaw kann sensible Tokens schwärzen, bevor sie in Konsolenausgabe, Dateiprotokolle,
OTLP-Protokolldatensätze, dauerhaft gespeicherten Sitzungstranskripttext oder Tool-
Ereignisnutzlasten der Control UI gelangen (Tool-Startargumente, partielle/endgültige Ergebnisnutzlasten, abgeleitete
Exec-Ausgabe und Patch-Zusammenfassungen):

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Zeichenfolgen zum Überschreiben des Standardsatzes. Benutzerdefinierte Muster werden zusätzlich zu den eingebauten Standards für Tool-Nutzlasten der Control UI angewendet, sodass das Hinzufügen eines Musters die Schwärzung von Werten, die bereits von den Standards erfasst werden, nie abschwächt.

Dateiprotokolle und Sitzungstranskripte bleiben JSONL, aber passende geheime Werte werden
maskiert, bevor die Zeile oder Nachricht auf die Festplatte geschrieben wird. Schwärzung erfolgt nach bestem Bemühen:
Sie wird auf texttragende Nachrichteninhalte und Protokollzeichenfolgen angewendet, nicht auf jedes
Bezeichner- oder Binärnutzlastfeld.

Die eingebauten Standards decken gängige API-Zugangsdaten und Feldnamen für Zahlungszugangsdaten ab,
zum Beispiel Kartennummer, CVC/CVV, gemeinsam genutztes Zahlungstoken und Zahlungszugangsdaten,
wenn sie als JSON-Felder, URL-Parameter, CLI-Flags oder Zuweisungen erscheinen.

`logging.redactSensitive: "off"` deaktiviert nur diese allgemeine Protokoll-/Transkript-
Richtlinie. OpenClaw schwärzt weiterhin Nutzlasten an Sicherheitsgrenzen, die UI-
Clients, Support-Bundles, Diagnosebeobachtern, Genehmigungsaufforderungen oder Agent-
Tools angezeigt werden können. Beispiele sind Tool-Aufrufereignisse der Control UI, `sessions_history`-Ausgabe,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, Exec-Genehmigungsbefehls-
anzeige und Gateway-WebSocket-Protokolle. Benutzerdefinierte `logging.redactPatterns`
können auf diesen Oberflächen weiterhin projektspezifische Muster hinzufügen.

## Diagnose und OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modellläufe und
Nachrichtenfluss-Telemetrie (Webhooks, Warteschlangen, Sitzungsstatus). Sie ersetzen Protokolle **nicht**,
sondern speisen Metriken, Traces und Exporter. Ereignisse werden prozessintern ausgegeben,
unabhängig davon, ob Sie sie exportieren.

Zwei angrenzende Oberflächen:

- **OpenTelemetry-Export** — Metriken, Traces und Protokolle per OTLP/HTTP an
  beliebige OpenTelemetry-kompatible Collector oder Backends senden (Grafana, Datadog,
  Honeycomb, New Relic, Tempo usw.). Vollständige Konfiguration, Signalkatalog,
  Metrik-/Span-Namen, Umgebungsvariablen und Datenschutzmodell befinden sich auf einer eigenen Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnose-Flags** — gezielte Debug-Protokoll-Flags, die zusätzliche Protokolle an
  `logging.file` weiterleiten, ohne `logging.level` zu erhöhen. Flags sind nicht groß-/kleinschreibungssensitiv
  und unterstützen Platzhalter (`telegram.*`, `*`). Konfigurieren Sie sie unter `diagnostics.flags`
  oder über die Umgebungsüberschreibung `OPENCLAW_DIAGNOSTICS=...`. Vollständiger Leitfaden:
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
- **Protokolle leer?** Prüfen Sie, ob das Gateway ausgeführt wird und in den Dateipfad
  in `logging.file` schreibt.
- **Mehr Details nötig?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandt

- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP/HTTP-Export, Metrik-/Span-Katalog, Datenschutzmodell
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Protokoll-Flags
- [Interne Gateway-Protokollierung](/de/gateway/logging) — WS-Protokollstile, Subsystem-Präfixe und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige `diagnostics.*`-Feldreferenz
