---
read_when:
    - Sie benötigen einen anfängerfreundlichen Überblick über das Logging in OpenClaw.
    - Sie möchten Log-Level, Formate oder Redaktion konfigurieren.
    - Sie führen eine Fehlerbehebung durch und müssen Logs schnell finden.
summary: Dateilogs, Konsolenausgabe, CLI-Tailing und der Tab „Logs“ in der Control UI
title: Logging
x-i18n:
    generated_at: "2026-04-26T11:33:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw hat zwei Hauptoberflächen für Logs:

- **Dateilogs** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe**, die in Terminals und in der Gateway-Debug-UI angezeigt wird.

Der Tab **Logs** in der Control UI verfolgt das Dateilog des Gateways. Diese Seite erklärt, wo
sich Logs befinden, wie Sie sie lesen und wie Sie Log-Level und -Formate konfigurieren.

## Wo sich Logs befinden

Standardmäßig schreibt das Gateway eine rotierende Logdatei unter:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.

Jede Datei rotiert, wenn sie `logging.maxFileBytes` erreicht (Standard: 100 MB).
OpenClaw behält bis zu fünf nummerierte Archive neben dem aktiven Log, zum Beispiel
`openclaw-YYYY-MM-DD.1.log`, und schreibt weiter in ein neues aktives Log, statt
Diagnosen zu unterdrücken.

Sie können dies in `~/.openclaw/openclaw.json` überschreiben:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Wie Logs gelesen werden

### CLI: Live-Tailing (empfohlen)

Verwenden Sie die CLI, um die Gateway-Logdatei per RPC zu tailen:

```bash
openclaw logs --follow
```

Nützliche aktuelle Optionen:

- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen
- `--url <url>` / `--token <token>` / `--timeout <ms>`: Standard-Gateway-RPC-Flags
- `--expect-final`: Warte-Flag für die endgültige Antwort von agentgestütztem RPC (wird hier über die gemeinsame Client-Schicht akzeptiert)

Ausgabemodi:

- **TTY-Sitzungen**: schön formatiert, farbig, strukturierte Logzeilen.
- **Nicht-TTY-Sitzungen**: Klartext.
- `--json`: JSON mit Zeilentrennung (ein Logereignis pro Zeile).
- `--plain`: Klartext in TTY-Sitzungen erzwingen.
- `--no-color`: ANSI-Farben deaktivieren.

Wenn Sie ein explizites `--url` übergeben, wendet die CLI Konfiguration oder
Umgebungszugangsdaten nicht automatisch an; geben Sie `--token` selbst an, wenn das Ziel-Gateway
Authentifizierung erfordert.

Im JSON-Modus gibt die CLI Objekte mit `type`-Tag aus:

- `meta`: Stream-Metadaten (Datei, Cursor, Größe)
- `log`: geparster Logeintrag
- `notice`: Hinweise zu Abschneidung / Rotation
- `raw`: ungeparste Logzeile

Wenn das lokale loopback-Gateway Kopplung verlangt, greift `openclaw logs`
automatisch auf die konfigurierte lokale Logdatei zurück. Explizite Ziele mit `--url` verwenden
diesen Fallback nicht.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus, Folgendes auszuführen:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Logs** der Control UI tailt dieselbe Datei mit `logs.tail`.
Siehe [/web/control-ui](/de/web/control-ui), um sie zu öffnen.

### Nur kanalbezogene Logs

Um Kanalaktivität (WhatsApp/Telegram/etc.) zu filtern, verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

## Logformate

### Dateilogs (JSONL)

Jede Zeile in der Logdatei ist ein JSON-Objekt. Die CLI und die Control UI parsen diese
Einträge, um strukturierte Ausgabe darzustellen (Zeit, Level, Subsystem, Nachricht).

### Konsolenausgabe

Konsolen-Logs sind **TTY-fähig** und auf Lesbarkeit formatiert:

- Präfixe für Subsysteme (z. B. `gateway/channels/whatsapp`)
- farbliche Hervorhebung nach Level (info/warn/error)
- optional kompakter oder JSON-Modus

Die Konsolenformatierung wird durch `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Logs

`openclaw gateway` hat außerdem WebSocket-Protokoll-Logging für RPC-Datenverkehr:

- normaler Modus: nur interessante Ergebnisse (Fehler, Parse-Fehler, langsame Aufrufe)
- `--verbose`: gesamter Request-/Response-Datenverkehr
- `--ws-log auto|compact|full`: Stil der ausführlichen Darstellung auswählen
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

- `logging.level`: Level für **Dateilogs** (JSONL).
- `logging.consoleLevel`: Ausführlichkeitsstufe der **Konsole**.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können auch die globale CLI-Option **`--log-level <level>`** übergeben (zum Beispiel `openclaw --log-level debug gateway run`), die die Umgebungsvariable für diesen Befehl überschreibt.

`--verbose` betrifft nur die Konsolenausgabe und die Ausführlichkeit der WS-Logs; es ändert
nicht die Level der Dateilogs.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: menschenfreundlich, farbig, mit Zeitstempeln.
- `compact`: dichtere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Log-Prozessoren).

### Redaktion

Tool-Zusammenfassungen können sensible Tokens redigieren, bevor sie die Konsole erreichen:

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Zeichenfolgen zur Überschreibung der Standardmenge

Die Redaktion wird an den Logging-Sinks für **Konsolenausgabe**, **an stderr
weitergeleitete Konsolendiagnostik** und **Dateilogs** angewendet. Dateilogs bleiben JSONL, aber
passende Secret-Werte werden maskiert, bevor die Zeile auf Datenträger geschrieben wird.

## Diagnostik und OpenTelemetry

Diagnostik ist eine strukturierte, maschinenlesbare Ereignisform für Modelläufe und
Telemetrie des Nachrichtenflusses (Webhooks, Warteschlangenbildung, Sitzungszustand). Sie ersetzt
keine Logs — sie speist Metriken, Traces und Exporter. Ereignisse werden im Prozess ausgegeben,
unabhängig davon, ob Sie sie exportieren.

Zwei benachbarte Oberflächen:

- **OpenTelemetry-Export** — sendet Metriken, Traces und Logs über OTLP/HTTP an
  jeden OpenTelemetry-kompatiblen Collector oder jedes Backend (Grafana, Datadog,
  Honeycomb, New Relic, Tempo usw.). Vollständige Konfiguration, Signalkatalog,
  Metrik-/Span-Namen, Umgebungsvariablen und Datenschutzmodell befinden sich auf einer eigenen Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnostik-Flags** — gezielte Debug-Log-Flags, die zusätzliche Logs nach
  `logging.file` leiten, ohne `logging.level` zu erhöhen. Flags sind nicht case-sensitiv
  und unterstützen Wildcards (`telegram.*`, `*`). Konfiguration unter `diagnostics.flags`
  oder per Umgebungsüberschreibung `OPENCLAW_DIAGNOSTICS=...`. Vollständige Anleitung:
  [Diagnostik-Flags](/de/diagnostics/flags).

Um Diagnostikereignisse für Plugins oder benutzerdefinierte Sinks ohne OTLP-Export zu aktivieren:

```json5
{
  diagnostics: { enabled: true },
}
```

Für OTLP-Export an einen Collector siehe [OpenTelemetry-Export](/de/gateway/opentelemetry).

## Tipps zur Fehlerbehebung

- **Gateway nicht erreichbar?** Führen Sie zuerst `openclaw doctor` aus.
- **Logs leer?** Prüfen Sie, ob das Gateway läuft und auf den Dateipfad in
  `logging.file` schreibt.
- **Mehr Details nötig?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandt

- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP/HTTP-Export, Metrik-/Span-Katalog, Datenschutzmodell
- [Diagnostik-Flags](/de/diagnostics/flags) — gezielte Debug-Log-Flags
- [Interne Details zum Gateway-Logging](/de/gateway/logging) — WS-Logstile, Präfixe für Subsysteme und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige Feldreferenz für `diagnostics.*`
