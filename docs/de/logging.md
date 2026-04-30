---
read_when:
    - Sie benötigen einen einsteigerfreundlichen Überblick über die OpenClaw-Protokollierung
    - Sie möchten Log-Level, Formate oder Schwärzung konfigurieren
    - Sie führen eine Fehlerbehebung durch und müssen schnell Logs finden
summary: Datei-Logs, Konsolenausgabe, CLI-Tailing und der Protokolle-Tab der Control UI
title: Protokollierung
x-i18n:
    generated_at: "2026-04-30T07:02:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
    source_path: logging.md
    workflow: 16
---

OpenClaw hat zwei zentrale Log-Oberflächen:

- **Datei-Logs** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe**, die in Terminals und in der Gateway-Debug-UI angezeigt wird.

Der Tab **Logs** in der Control UI folgt dem Gateway-Datei-Log. Diese Seite erklärt, wo
Logs liegen, wie Sie sie lesen und wie Sie Log-Level und -Formate konfigurieren.

## Wo Logs liegen

Standardmäßig schreibt das Gateway eine rotierende Log-Datei unter:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.

Jede Datei rotiert, wenn sie `logging.maxFileBytes` erreicht (Standard: 100 MB).
OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei, zum Beispiel
`openclaw-YYYY-MM-DD.1.log`, und schreibt weiter in ein frisches aktives Log, statt
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

Verwenden Sie die CLI, um der Gateway-Log-Datei per RPC zu folgen:

```bash
openclaw logs --follow
```

Nützliche aktuelle Optionen:

- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen
- `--url <url>` / `--token <token>` / `--timeout <ms>`: Standard-Gateway-RPC-Flags
- `--expect-final`: Warte-Flag für agentengestützte finale RPC-Antwort (hier über die gemeinsame Client-Schicht akzeptiert)

Ausgabemodi:

- **TTY-Sitzungen**: gut lesbare, farbige, strukturierte Log-Zeilen.
- **Nicht-TTY-Sitzungen**: Klartext.
- `--json`: zeilenbegrenztes JSON (ein Log-Ereignis pro Zeile).
- `--plain`: Klartext in TTY-Sitzungen erzwingen.
- `--no-color`: ANSI-Farben deaktivieren.

Wenn Sie ein explizites `--url` übergeben, wendet die CLI Konfigurations- oder
Umgebungs-Credentials nicht automatisch an; fügen Sie `--token` selbst hinzu, wenn das Ziel-Gateway
Authentifizierung verlangt.

Im JSON-Modus gibt die CLI Objekte mit `type`-Tag aus:

- `meta`: Stream-Metadaten (Datei, Cursor, Größe)
- `log`: geparster Log-Eintrag
- `notice`: Hinweise zu Kürzung / Rotation
- `raw`: ungeparste Log-Zeile

Wenn das implizite local loopback Gateway eine Kopplung anfordert, während der Verbindung schließt
oder eine Zeitüberschreitung auftritt, bevor `logs.tail` antwortet, fällt `openclaw logs`
automatisch auf die konfigurierte Gateway-Datei-Log-Datei zurück. Explizite `--url`-Ziele verwenden
diesen Fallback nicht.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus, Folgendes auszuführen:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Logs** der Control UI folgt derselben Datei über `logs.tail`.
Siehe [/web/control-ui](/de/web/control-ui), um zu erfahren, wie Sie sie öffnen.

### Nur Channel-Logs

Um Channel-Aktivität (WhatsApp/Telegram/usw.) zu filtern, verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

## Log-Formate

### Datei-Logs (JSONL)

Jede Zeile in der Log-Datei ist ein JSON-Objekt. Die CLI und die Control UI parsen diese
Einträge, um strukturierte Ausgabe darzustellen (Zeit, Level, Subsystem, Nachricht).

Datei-Log-JSONL-Datensätze enthalten außerdem maschinenfilterbare Felder auf oberster Ebene, wenn
verfügbar:

- `hostname`: Hostname des Gateways.
- `message`: abgeflachter Log-Nachrichtentext für Volltextsuche.
- `agent_id`: aktive Agent-ID, wenn der Log-Aufruf Agent-Kontext mitführt.
- `session_id`: aktive Sitzungs-ID bzw. aktiver Sitzungsschlüssel, wenn der Log-Aufruf Sitzungskontext mitführt.
- `channel`: aktiver Channel, wenn der Log-Aufruf Channel-Kontext mitführt.

OpenClaw bewahrt die ursprünglichen strukturierten Log-Argumente neben diesen Feldern auf,
sodass bestehende Parser, die nummerierte tslog-Argument-Schlüssel lesen, weiterhin funktionieren.

### Konsolenausgabe

Konsolen-Logs sind **TTY-bewusst** und auf Lesbarkeit formatiert:

- Subsystem-Präfixe (z. B. `gateway/channels/whatsapp`)
- Level-Farbgebung (info/warn/error)
- Optionaler Kompakt- oder JSON-Modus

Die Konsolenformatierung wird durch `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Logs

`openclaw gateway` verfügt außerdem über WebSocket-Protokollierung für RPC-Datenverkehr:

- Normaler Modus: nur relevante Ergebnisse (Fehler, Parse-Fehler, langsame Aufrufe)
- `--verbose`: gesamter Anfrage-/Antwortdatenverkehr
- `--ws-log auto|compact|full`: ausführlichen Darstellungsstil auswählen
- `--compact`: Alias für `--ws-log compact`

Beispiele:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Logging konfigurieren

Die gesamte Logging-Konfiguration liegt unter `logging` in `~/.openclaw/openclaw.json`.

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
- `logging.consoleLevel`: Ausführlichkeits-Level der **Konsole**.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können auch die globale CLI-Option **`--log-level <level>`** übergeben (zum Beispiel `openclaw --log-level debug gateway run`), die die Umgebungsvariable für diesen Befehl überschreibt.

`--verbose` wirkt sich nur auf die Konsolenausgabe und die Ausführlichkeit von WS-Logs aus; es ändert
keine Datei-Log-Level.

### Trace-Korrelation

Datei-Logs sind JSONL. Wenn ein Log-Aufruf einen gültigen Diagnose-Trace-Kontext mitführt,
schreibt OpenClaw die Trace-Felder als JSON-Schlüssel auf oberster Ebene (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), damit externe Log-Verarbeiter die Zeile mit OTEL-Spans und
Provider-`traceparent`-Weitergabe korrelieren können.

Gateway-HTTP-Anfragen und Gateway-WebSocket-Frames richten einen internen Request-Trace-Scope ein.
Logs und Diagnoseereignisse, die innerhalb dieses asynchronen Scopes ausgegeben werden, erben
den Request-Trace, wenn sie keinen expliziten Trace-Kontext übergeben. Agent-Lauf- und
Modellaufruf-Traces werden zu Kindern des aktiven Request-Traces, sodass lokale Logs,
Diagnose-Snapshots, OTEL-Spans und vertrauenswürdige Provider-`traceparent`-Header
über `traceId` verknüpft werden können, ohne rohe Anfrage- oder Modellinhalte zu protokollieren.

### Größe und Timing von Modellaufrufen

Diagnosen für Modellaufrufe erfassen begrenzte Anfrage-/Antwortmesswerte, ohne
rohe Prompt- oder Antwortinhalte zu erfassen:

- `requestPayloadBytes`: UTF-8-Byte-Größe der finalen Modellanfrage-Nutzlast
- `responseStreamBytes`: UTF-8-Byte-Größe der gestreamten Modellantwort-Ereignisse
- `timeToFirstByteMs`: verstrichene Zeit bis zum ersten gestreamten Antwortereignis
- `durationMs`: Gesamtdauer des Modellaufrufs

Diese Felder stehen Diagnose-Snapshots, Modellaufruf-Plugin-Hooks und
OTEL-Modellaufruf-Spans/-Metriken zur Verfügung, wenn der Diagnoseexport aktiviert ist.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: menschenfreundlich, farbig, mit Zeitstempeln.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Log-Verarbeiter).

### Schwärzung

OpenClaw kann sensible Tokens schwärzen, bevor sie in Konsolenausgabe, Datei-Logs,
OTLP-Log-Datensätze, persistierten Sitzungstranskripttext oder Tool-Ereignis-Nutzlasten
der Control UI gelangen (Tool-Startargumente, partielle/finale Ergebnis-Nutzlasten, abgeleitete
Exec-Ausgabe und Patch-Zusammenfassungen):

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Strings zum Überschreiben des Standardsatzes. Benutzerdefinierte Muster werden zusätzlich zu den eingebauten Standards für Tool-Nutzlasten der Control UI angewendet, sodass das Hinzufügen eines Musters die Schwärzung von Werten, die bereits von den Standards erfasst werden, nie abschwächt.

Datei-Logs und Sitzungstranskripte bleiben JSONL, aber passende geheime Werte werden
maskiert, bevor die Zeile oder Nachricht auf die Festplatte geschrieben wird. Schwärzung erfolgt nach bestem Aufwand:
Sie gilt für texttragende Nachrichteninhalte und Log-Strings, nicht für jedes
Identifier- oder Binärnutzlastfeld.

`logging.redactSensitive: "off"` deaktiviert nur diese allgemeine Log-/Transkript-Richtlinie.
OpenClaw schwärzt weiterhin Nutzlasten an Sicherheitsgrenzen, die UI-Clients,
Support-Bundles, Diagnosebeobachtern, Genehmigungsaufforderungen oder Agent-Tools angezeigt werden können.
Beispiele sind Tool-Aufruf-Ereignisse der Control UI, `sessions_history`-Ausgabe,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, Exec-Genehmigungsbefehlsanzeige
und Gateway-WebSocket-Protokoll-Logs. Benutzerdefinierte `logging.redactPatterns`
können auf diesen Oberflächen weiterhin projektspezifische Muster hinzufügen.

## Diagnose und OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modellläufe und
Nachrichtenfluss-Telemetrie (Webhooks, Warteschlangen, Sitzungsstatus). Sie ersetzen Logs **nicht**,
sondern speisen Metriken, Traces und Exporter. Ereignisse werden innerhalb des Prozesses ausgegeben,
unabhängig davon, ob Sie sie exportieren.

Zwei angrenzende Oberflächen:

- **OpenTelemetry-Export** — Metriken, Traces und Logs über OTLP/HTTP an
  einen beliebigen OpenTelemetry-kompatiblen Collector oder ein Backend senden (Grafana, Datadog,
  Honeycomb, New Relic, Tempo usw.). Vollständige Konfiguration, Signal-Katalog,
  Metrik-/Span-Namen, Umgebungsvariablen und Datenschutzmodell befinden sich auf einer dedizierten Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnose-Flags** — gezielte Debug-Log-Flags, die zusätzliche Logs an
  `logging.file` weiterleiten, ohne `logging.level` zu erhöhen. Flags unterscheiden nicht zwischen Groß- und Kleinschreibung
  und unterstützen Platzhalter (`telegram.*`, `*`). Konfigurieren Sie sie unter `diagnostics.flags`
  oder über die Env-Überschreibung `OPENCLAW_DIAGNOSTICS=...`. Vollständige Anleitung:
  [Diagnose-Flags](/de/diagnostics/flags).

Um Diagnoseereignisse für Plugins oder benutzerdefinierte Sinks ohne OTLP-Export zu aktivieren:

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
- **Mehr Details nötig?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandte Themen

- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP/HTTP-Export, Metrik-/Span-Katalog, Datenschutzmodell
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Log-Flags
- [Interna des Gateway-Loggings](/de/gateway/logging) — WS-Log-Stile, Subsystem-Präfixe und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige Feldreferenz zu `diagnostics.*`
