---
read_when:
    - Sie benötigen einen einsteigerfreundlichen Überblick über Logging
    - Sie möchten Log-Level oder Formate konfigurieren
    - Sie beheben gerade Fehler und müssen Logs schnell finden
summary: 'Logging-Übersicht: Dateilogs, Konsolenausgabe, CLI-Tailing und die Control UI'
title: Logging-Übersicht
x-i18n:
    generated_at: "2026-04-25T13:49:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw hat zwei Hauptoberflächen für Logs:

- **Dateilogs** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe**, die in Terminals und in der Gateway Debug UI angezeigt wird.

Der Tab **Logs** in der Control UI folgt dem Gateway-Dateilog. Diese Seite erklärt,
wo Logs gespeichert werden, wie Sie sie lesen und wie Sie Log-Level und Formate konfigurieren.

## Wo Logs gespeichert werden

Standardmäßig schreibt das Gateway eine rotierende Logdatei unter:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.

Sie können dies in `~/.openclaw/openclaw.json` überschreiben:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Wie Logs gelesen werden

### CLI: Live-Tail (empfohlen)

Verwenden Sie die CLI, um die Gateway-Logdatei per RPC zu tailen:

```bash
openclaw logs --follow
```

Nützliche aktuelle Optionen:

- `--local-time`: Timestamps in Ihrer lokalen Zeitzone darstellen
- `--url <url>` / `--token <token>` / `--timeout <ms>`: Standard-Gateway-RPC-Flags
- `--expect-final`: Warte-Flag für die endgültige Antwort bei agentengestütztem RPC (hier über die gemeinsame Client-Schicht akzeptiert)

Ausgabemodi:

- **TTY-Sitzungen**: hübsche, farbige, strukturierte Logzeilen.
- **Nicht-TTY-Sitzungen**: Klartext.
- `--json`: zeilengetrenntes JSON (ein Log-Ereignis pro Zeile).
- `--plain`: Klartext in TTY-Sitzungen erzwingen.
- `--no-color`: ANSI-Farben deaktivieren.

Wenn Sie ein explizites `--url` übergeben, wendet die CLI keine Konfigurations- oder
Umgebungszugangsdaten automatisch an; fügen Sie `--token` selbst hinzu, wenn das Ziel-Gateway
Authentifizierung erfordert.

Im JSON-Modus gibt die CLI mit `type` markierte Objekte aus:

- `meta`: Stream-Metadaten (Datei, Cursor, Größe)
- `log`: geparster Logeintrag
- `notice`: Hinweise zu Abschneidung / Rotation
- `raw`: nicht geparste Logzeile

Wenn das lokale loopback-Gateway eine Kopplung verlangt, greift `openclaw logs`
automatisch auf die konfigurierte lokale Logdatei zurück. Explizite `--url`-Ziele verwenden diesen Fallback nicht.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus, Folgendes auszuführen:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Logs** der Control UI tailt dieselbe Datei mit `logs.tail`.
Siehe [/web/control-ui](/de/web/control-ui), um zu erfahren, wie Sie sie öffnen.

### Nur Kanal-Logs

Um Kanalaktivität (WhatsApp/Telegram/etc) zu filtern, verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

## Log-Formate

### Dateilogs (JSONL)

Jede Zeile in der Logdatei ist ein JSON-Objekt. Die CLI und die Control UI parsen diese
Einträge, um strukturierte Ausgabe darzustellen (Zeit, Level, Subsystem, Nachricht).

### Konsolenausgabe

Konsolenlogs sind **TTY-bewusst** und zur besseren Lesbarkeit formatiert:

- Subsystem-Präfixe (z. B. `gateway/channels/whatsapp`)
- Farbgebung nach Level (info/warn/error)
- Optional kompakter oder JSON-Modus

Die Konsolenformatierung wird über `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Logs

`openclaw gateway` hat außerdem WebSocket-Protokoll-Logging für RPC-Verkehr:

- Normalmodus: nur interessante Ergebnisse (Fehler, Parse-Fehler, langsame Aufrufe)
- `--verbose`: gesamter Request-/Response-Verkehr
- `--ws-log auto|compact|full`: Stil für die ausführliche Darstellung auswählen
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

- `logging.level`: Log-Level für **Dateilogs** (JSONL).
- `logging.consoleLevel`: Level für die **Konsolen**-Ausführlichkeit.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können auch die globale CLI-Option **`--log-level <level>`** übergeben (zum Beispiel `openclaw --log-level debug gateway run`), die die Umgebungsvariable für diesen Befehl überschreibt.

`--verbose` wirkt sich nur auf die Konsolenausgabe und die WS-Log-Ausführlichkeit aus; es ändert
nicht die Dateilog-Level.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: menschenfreundlich, farbig, mit Timestamps.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Log-Prozessoren).

### Schwärzung

Tool-Zusammenfassungen können sensible Tokens schwärzen, bevor sie auf der Konsole erscheinen:

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Strings, um die Standardmenge zu überschreiben

Die Schwärzung betrifft **nur die Konsolenausgabe** und verändert keine Dateilogs.

## Diagnostik + OpenTelemetry

Diagnostik sind strukturierte, maschinenlesbare Ereignisse für Modellläufe **und**
Message-Flow-Telemetrie (Webhooks, Queueing, Sitzungsstatus). Sie **ersetzen**
keine Logs; sie dienen dazu, Metriken, Traces und andere Exporter zu speisen.

Diagnostik-Ereignisse werden im Prozess ausgegeben, aber Exporter werden nur angehängt, wenn
Diagnostik + das Exporter-Plugin aktiviert sind.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: das Datenmodell + SDKs für Traces, Metriken und Logs.
- **OTLP**: das Wire-Protokoll, das verwendet wird, um OTel-Daten an einen Collector/ein Backend zu exportieren.
- OpenClaw exportiert heute über **OTLP/HTTP (protobuf)**.

### Exportierte Signale

- **Metriken**: Counter + Histogramme (Token-Nutzung, Message Flow, Queueing).
- **Traces**: Spans für Modellnutzung + Webhook-/Nachrichtenverarbeitung.
- **Logs**: werden über OTLP exportiert, wenn `diagnostics.otel.logs` aktiviert ist. Das Log-
  Volumen kann hoch sein; behalten Sie `logging.level` und Exporter-Filter im Blick.

### Diagnostik-Ereigniskatalog

Modellnutzung:

- `model.usage`: Tokens, Kosten, Dauer, Kontext, Provider/Modell/Kanal, Sitzungs-IDs.

Message Flow:

- `webhook.received`: Webhook-Eingang pro Kanal.
- `webhook.processed`: Webhook verarbeitet + Dauer.
- `webhook.error`: Fehler im Webhook-Handler.
- `message.queued`: Nachricht zur Verarbeitung in die Queue gestellt.
- `message.processed`: Ergebnis + Dauer + optionaler Fehler.
- `message.delivery.started`: ausgehender Zustellversuch gestartet.
- `message.delivery.completed`: ausgehender Zustellversuch abgeschlossen + Dauer/Anzahl der Ergebnisse.
- `message.delivery.error`: ausgehender Zustellversuch fehlgeschlagen + Dauer/begrenzte Fehlerkategorie.

Queue + Sitzung:

- `queue.lane.enqueue`: Einreihung in eine Lane der Befehlswarteschlange + Tiefe.
- `queue.lane.dequeue`: Entnahme aus einer Lane der Befehlswarteschlange + Wartezeit.
- `session.state`: Zustandsübergang der Sitzung + Grund.
- `session.stuck`: Warnung für blockierte Sitzung + Alter.
- `run.attempt`: Metadaten zu Wiederholungsversuch/Laufversuch.
- `diagnostic.heartbeat`: aggregierte Zähler (Webhooks/Queue/Sitzung).

Exec:

- `exec.process.completed`: Ergebnis des terminalen Exec-Prozesses, Dauer, Ziel, Modus,
  Exit-Code und Fehlertyp. Befehlstext und Arbeitsverzeichnisse sind nicht
  enthalten.

### Diagnostik aktivieren (ohne Exporter)

Verwenden Sie dies, wenn Sie Diagnostik-Ereignisse für Plugins oder benutzerdefinierte Senken verfügbar machen möchten:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Diagnostik-Flags (gezielte Logs)

Verwenden Sie Flags, um zusätzliche, gezielte Debug-Logs zu aktivieren, ohne `logging.level` zu erhöhen.
Flags sind nicht case-sensitiv und unterstützen Wildcards (z. B. `telegram.*` oder `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Umgebungsvariablen-Override (einmalig):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Hinweise:

- Flag-Logs gehen in die Standard-Logdatei (dieselbe wie `logging.file`).
- Die Ausgabe wird weiterhin entsprechend `logging.redactSensitive` geschwärzt.
- Vollständige Anleitung: [/diagnostics/flags](/de/diagnostics/flags).

### Nach OpenTelemetry exportieren

Diagnostik kann über das Plugin `diagnostics-otel` exportiert werden (OTLP/HTTP). Dies
funktioniert mit jedem OpenTelemetry-Collector/-Backend, das OTLP/HTTP akzeptiert.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Hinweise:

- Sie können das Plugin auch mit `openclaw plugins enable diagnostics-otel` aktivieren.
- `protocol` unterstützt derzeit nur `http/protobuf`. `grpc` wird ignoriert.
- Metriken umfassen Token-Nutzung, Kosten, Kontextgröße, Laufdauer und Message-Flow-
  Counter/Histogramme (Webhooks, Queueing, Sitzungsstatus, Queue-Tiefe/Wartezeit).
- Traces/Metriken können mit `traces` / `metrics` ein- oder ausgeschaltet werden (Standard: an). Traces
  enthalten Spans für Modellnutzung sowie Webhook-/Nachrichtenverarbeitung, wenn aktiviert.
- Rohe Modell-/Tool-Inhalte werden standardmäßig nicht exportiert. Verwenden Sie
  `diagnostics.otel.captureContent` nur dann, wenn Ihr Collector und Ihre Aufbewahrungsrichtlinie
  für Prompt-, Antwort-, Tool- oder Systemprompt-Text freigegeben sind.
- Setzen Sie `headers`, wenn Ihr Collector Authentifizierung erfordert.
- Unterstützte Umgebungsvariablen: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Setzen Sie `OPENCLAW_OTEL_PRELOADED=1`, wenn ein anderer Preload oder Host-Prozess bereits
  das globale OpenTelemetry SDK registriert hat. In diesem Modus startet
  oder beendet das Plugin sein eigenes SDK nicht, verdrahtet aber weiterhin OpenClaw-Diagnostik-Listener und
  respektiert `diagnostics.otel.traces`, `metrics` und `logs`.

### Exportierte Metriken (Namen + Typen)

Modellnutzung:

- `openclaw.tokens` (Counter, Attribute: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (Counter, Attribute: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (Histogramm, Attribute: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (Histogramm, Attribute: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Message Flow:

- `openclaw.webhook.received` (Counter, Attribute: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (Counter, Attribute: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (Histogramm, Attribute: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (Counter, Attribute: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (Counter, Attribute: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (Histogramm, Attribute: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (Counter, Attribute: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (Histogramm, Attribute:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Queues + Sitzungen:

- `openclaw.queue.lane.enqueue` (Counter, Attribute: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (Counter, Attribute: `openclaw.lane`)
- `openclaw.queue.depth` (Histogramm, Attribute: `openclaw.lane` oder
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (Histogramm, Attribute: `openclaw.lane`)
- `openclaw.session.state` (Counter, Attribute: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (Counter, Attribute: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (Histogramm, Attribute: `openclaw.state`)
- `openclaw.run.attempt` (Counter, Attribute: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (Histogramm, Attribute: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Exportierte Spans (Namen + zentrale Attribute)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (`input`/`output`/`cache_read`/`cache_write`/`total`)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

Wenn die Erfassung von Inhalten explizit aktiviert ist, können Modell-/Tool-Spans außerdem
begrenzte, geschwärzte Attribute `openclaw.content.*` für die spezifischen Inhaltsklassen enthalten,
für die Sie sich entschieden haben.

### Sampling + Flush

- Trace-Sampling: `diagnostics.otel.sampleRate` (0.0–1.0, nur Root-Spans).
- Exportintervall für Metriken: `diagnostics.otel.flushIntervalMs` (mindestens 1000 ms).

### Protokollhinweise

- OTLP/HTTP-Endpunkte können über `diagnostics.otel.endpoint` oder
  `OTEL_EXPORTER_OTLP_ENDPOINT` gesetzt werden.
- Wenn der Endpunkt bereits `/v1/traces` oder `/v1/metrics` enthält, wird er unverändert verwendet.
- Wenn der Endpunkt bereits `/v1/logs` enthält, wird er für Logs unverändert verwendet.
- `OPENCLAW_OTEL_PRELOADED=1` verwendet für Traces/Metriken ein extern registriertes OpenTelemetry SDK wieder,
  anstatt ein pluginverwaltetes NodeSDK zu starten.
- `diagnostics.otel.logs` aktiviert den OTLP-Log-Export für die Ausgabe des Haupt-Loggers.

### Verhalten des Log-Exports

- OTLP-Logs verwenden dieselben strukturierten Datensätze, die in `logging.file` geschrieben werden.
- `logging.level` wird berücksichtigt (Dateilog-Level). Die Schwärzung der Konsole gilt **nicht**
  für OTLP-Logs.
- Installationen mit hohem Volumen sollten Sampling/Filterung im OTLP-Collector bevorzugen.

## Tipps zur Fehlerbehebung

- **Gateway nicht erreichbar?** Führen Sie zuerst `openclaw doctor` aus.
- **Logs leer?** Prüfen Sie, ob das Gateway läuft und in den Dateipfad aus
  `logging.file` schreibt.
- **Mehr Details benötigt?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandt

- [Gateway Logging Internals](/de/gateway/logging) — WS-Log-Stile, Subsystem-Präfixe und Erfassung der Konsole
- [Diagnostics](/de/gateway/configuration-reference#diagnostics) — OpenTelemetry-Export und Cache-Trace-Konfiguration
