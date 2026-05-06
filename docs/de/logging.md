---
read_when:
    - Sie benötigen einen einsteigerfreundlichen Überblick über das Logging von OpenClaw
    - Sie möchten Log-Level, Formate oder Schwärzung konfigurieren
    - Sie führen eine Fehlerbehebung durch und müssen schnell Protokolle finden
summary: Dateiprotokolle, Konsolenausgabe, Protokollverfolgung per CLI und der Tab „Protokolle“ der Steuerungs-UI
title: Protokollierung
x-i18n:
    generated_at: "2026-05-06T17:58:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw hat zwei zentrale Protokolloberflächen:

- **Dateiprotokolle** (JSON Lines), die vom Gateway geschrieben werden.
- **Konsolenausgabe**, die in Terminals und in der Gateway-Debug-UI angezeigt wird.

Der Tab **Protokolle** der Control UI verfolgt das Gateway-Dateiprotokoll live. Diese Seite erklärt, wo
Protokolle liegen, wie Sie sie lesen und wie Sie Protokollstufen und -formate konfigurieren.

## Speicherort der Protokolle

Standardmäßig schreibt das Gateway eine rotierende Protokolldatei unter:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.

Jede Datei rotiert, wenn sie `logging.maxFileBytes` erreicht (Standard: 100 MB).
OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei, zum Beispiel
`openclaw-YYYY-MM-DD.1.log`, und schreibt in ein frisches aktives Protokoll weiter, statt
Diagnosen zu unterdrücken.

Sie können dies in `~/.openclaw/openclaw.json` überschreiben:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Protokolle lesen

### CLI: Live-Tail (empfohlen)

Verwenden Sie die CLI, um die Gateway-Protokolldatei per RPC live zu verfolgen:

```bash
openclaw logs --follow
```

Nützliche aktuelle Optionen:

- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone darstellen
- `--url <url>` / `--token <token>` / `--timeout <ms>`: Standard-Gateway-RPC-Flags
- `--expect-final`: Warte-Flag für agentengestützte RPC-Endantworten (hier über die gemeinsame Client-Schicht akzeptiert)

Ausgabemodi:

- **TTY-Sitzungen**: übersichtliche, farbige, strukturierte Protokollzeilen.
- **Nicht-TTY-Sitzungen**: Klartext.
- `--json`: zeilenbegrenztes JSON (ein Protokollereignis pro Zeile).
- `--plain`: Klartext in TTY-Sitzungen erzwingen.
- `--no-color`: ANSI-Farben deaktivieren.

Wenn Sie eine explizite `--url` übergeben, wendet die CLI Konfigurations- oder
Umgebungsanmeldedaten nicht automatisch an; geben Sie `--token` selbst an, wenn das Ziel-Gateway
Authentifizierung erfordert.

Im JSON-Modus gibt die CLI Objekte mit `type`-Tag aus:

- `meta`: Stream-Metadaten (Datei, Cursor, Größe)
- `log`: analysierter Protokolleintrag
- `notice`: Hinweise zu Kürzung/Rotation
- `raw`: nicht analysierte Protokollzeile

Wenn das implizite local loopback-Gateway Pairing anfordert, während des Verbindens schließt
oder vor einer Antwort von `logs.tail` ein Timeout auftritt, fällt `openclaw logs` automatisch auf das
konfigurierte Gateway-Dateiprotokoll zurück. Explizite `--url`-Ziele verwenden diesen
Fallback nicht.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus, Folgendes auszuführen:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Protokolle** der Control UI verfolgt dieselbe Datei mit `logs.tail` live.
Unter [Control UI](/de/web/control-ui) erfahren Sie, wie Sie sie öffnen.

### Nur-Channel-Protokolle

Um Channel-Aktivität (WhatsApp/Telegram/usw.) zu filtern, verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

## Protokollformate

### Dateiprotokolle (JSONL)

Jede Zeile in der Protokolldatei ist ein JSON-Objekt. Die CLI und die Control UI analysieren diese
Einträge, um strukturierte Ausgabe darzustellen (Zeit, Stufe, Subsystem, Nachricht).

JSONL-Datensätze von Dateiprotokollen enthalten außerdem maschinenfilterbare Felder auf oberster Ebene, wenn
verfügbar:

- `hostname`: Gateway-Hostname.
- `message`: abgeflachter Protokollnachrichtentext für Volltextsuche.
- `agent_id`: aktive Agenten-ID, wenn der Protokollaufruf Agentenkontext trägt.
- `session_id`: aktive Sitzungs-ID bzw. aktiver Sitzungsschlüssel, wenn der Protokollaufruf Sitzungskontext trägt.
- `channel`: aktiver Channel, wenn der Protokollaufruf Channel-Kontext trägt.

OpenClaw bewahrt die ursprünglichen strukturierten Protokollargumente neben diesen Feldern auf,
sodass bestehende Parser, die nummerierte tslog-Argument-Schlüssel lesen, weiter funktionieren.

Talk-, Echtzeit-Sprach- und verwaltete Raumaktivität gibt begrenzte Lifecycle-Protokolldatensätze
über dieselbe Dateiprotokoll-Pipeline aus. Diese Datensätze enthalten Ereignistyp,
Modus, Transport, Provider sowie Größen- und Zeitmessungen, wenn verfügbar, lassen jedoch
Transkripttext, Audio-Payloads, Turn-IDs, Call-IDs und Provider-Item-IDs aus.

### Konsolenausgabe

Konsolenprotokolle sind **TTY-aware** und für Lesbarkeit formatiert:

- Subsystem-Präfixe (z. B. `gateway/channels/whatsapp`)
- Farbliche Hervorhebung der Stufen (info/warn/error)
- Optionaler Kompakt- oder JSON-Modus

Die Konsolenformatierung wird durch `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Protokolle

`openclaw gateway` verfügt außerdem über WebSocket-Protokollierung für RPC-Verkehr:

- normaler Modus: nur interessante Ergebnisse (Fehler, Parse-Fehler, langsame Aufrufe)
- `--verbose`: sämtlicher Request/Response-Verkehr
- `--ws-log auto|compact|full`: Darstellungsstil für ausführliche Ausgabe auswählen
- `--compact`: Alias für `--ws-log compact`

Beispiele:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Protokollierung konfigurieren

Die gesamte Protokollierungskonfiguration liegt unter `logging` in `~/.openclaw/openclaw.json`.

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

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können auch die globale CLI-Option **`--log-level <level>`** übergeben (zum Beispiel `openclaw --log-level debug gateway run`), die die Umgebungsvariable für diesen Befehl überschreibt.

`--verbose` wirkt sich nur auf Konsolenausgabe und WS-Protokollausführlichkeit aus; es ändert
keine Dateiprotollstufen.

### Trace-Korrelation

Dateiprotokolle sind JSONL. Wenn ein Protokollaufruf einen gültigen diagnostischen Trace-Kontext trägt,
schreibt OpenClaw die Trace-Felder als JSON-Schlüssel auf oberster Ebene (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), sodass externe Protokollprozessoren die Zeile
mit OTEL-Spans und Provider-`traceparent`-Weitergabe korrelieren können.

Gateway-HTTP-Anfragen und Gateway-WebSocket-Frames etablieren einen internen Request-
Trace-Scope. Protokolle und Diagnoseereignisse, die innerhalb dieses asynchronen Scopes ausgegeben werden, erben
den Request-Trace, wenn sie keinen expliziten Trace-Kontext übergeben. Agentenlauf- und
Modellaufruf-Traces werden zu Kindern des aktiven Request-Traces, sodass lokale Protokolle,
Diagnose-Snapshots, OTEL-Spans und vertrauenswürdige Provider-`traceparent`-Header
über `traceId` verbunden werden können, ohne rohe Request- oder Modellinhalte zu protokollieren.

Talk-Lifecycle-Protokolldatensätze fließen außerdem in OTLP-Protokolle, wenn OpenTelemetry-Protokollexport
aktiviert ist, und verwenden dieselben begrenzten Attribute wie Dateiprotokolle.

### Größe und Timing von Modellaufrufen

Modellaufrufdiagnosen zeichnen begrenzte Request/Response-Messungen auf, ohne
rohe Prompt- oder Antwortinhalte zu erfassen:

- `requestPayloadBytes`: UTF-8-Bytegröße des endgültigen Modell-Request-Payloads
- `responseStreamBytes`: UTF-8-Bytegröße gestreamter Modellantwortereignisse
- `timeToFirstByteMs`: verstrichene Zeit bis zum ersten gestreamten Antwortereignis
- `durationMs`: Gesamtdauer des Modellaufrufs

Diese Felder stehen Diagnose-Snapshots, Modellaufruf-Plugin-Hooks und
OTEL-Modellaufruf-Spans/Metriken zur Verfügung, wenn Diagnoseexport aktiviert ist.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: benutzerfreundlich, farbig, mit Zeitstempeln.
- `compact`: knappere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Protokollprozessoren).

### Schwärzung

OpenClaw kann sensible Tokens schwärzen, bevor sie in Konsolenausgabe, Dateiprotokollen,
OTLP-Protokolldatensätzen, persistiertem Sitzungstranskripttext oder Tool-
Ereignis-Payloads der Control UI landen (Tool-Startargumente, Teil-/Endergebnis-Payloads, abgeleitete
Exec-Ausgabe und Patch-Zusammenfassungen):

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Strings, um den Standardsatz zu überschreiben. Benutzerdefinierte Muster werden zusätzlich zu den integrierten Standards für Tool-Payloads der Control UI angewendet, sodass das Hinzufügen eines Musters die Schwärzung von Werten, die bereits von den Standards erfasst werden, niemals abschwächt.

Dateiprotokolle und Sitzungstranskripte bleiben JSONL, aber passende geheime Werte werden
maskiert, bevor die Zeile oder Nachricht auf die Festplatte geschrieben wird. Schwärzung erfolgt nach bestem Bemühen:
Sie gilt für texttragende Nachrichteninhalte und Protokollstrings, nicht für jedes
Kennzeichner- oder Binär-Payload-Feld.

Die integrierten Standards decken gängige API-Anmeldedaten und Feldnamen für Zahlungsanmeldedaten ab,
wie Kartennummer, CVC/CVV, gemeinsames Zahlungstoken und Zahlungsanmeldedaten,
wenn sie als JSON-Felder, URL-Parameter, CLI-Flags oder Zuweisungen erscheinen.

`logging.redactSensitive: "off"` deaktiviert nur diese allgemeine Protokoll-/Transkript-
Richtlinie. OpenClaw schwärzt weiterhin Payloads an Sicherheitsgrenzen, die UI-
Clients, Support-Bundles, Diagnosebeobachtern, Genehmigungs-Prompts oder Agenten-
Tools angezeigt werden können. Beispiele sind Tool-Aufrufereignisse der Control UI, `sessions_history`-Ausgabe,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, Exec-Genehmigungsbefehls-
anzeige und Gateway-WebSocket-Protokolle. Benutzerdefinierte `logging.redactPatterns`
können auf diesen Oberflächen weiterhin projektspezifische Muster hinzufügen.

## Diagnose und OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modellläufe und
Nachrichtenfluss-Telemetrie (Webhooks, Warteschlangen, Sitzungszustand). Sie ersetzen Protokolle
**nicht** — sie speisen Metriken, Traces und Exporter. Ereignisse werden
prozessintern ausgegeben, unabhängig davon, ob Sie sie exportieren.

Zwei benachbarte Oberflächen:

- **OpenTelemetry-Export** — Metriken, Traces und Protokolle per OTLP/HTTP an
  einen beliebigen OpenTelemetry-kompatiblen Collector oder ein Backend senden (Grafana, Datadog,
  Honeycomb, New Relic, Tempo usw.). Vollständige Konfiguration, Signalkatalog,
  Metrik-/Span-Namen, Umgebungsvariablen und Datenschutzmodell stehen auf einer dedizierten Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnose-Flags** — gezielte Debug-Protokoll-Flags, die zusätzliche Protokolle an
  `logging.file` weiterleiten, ohne `logging.level` zu erhöhen. Flags ignorieren Groß-/Kleinschreibung
  und unterstützen Wildcards (`telegram.*`, `*`). Konfiguration unter `diagnostics.flags`
  oder über den Env-Override `OPENCLAW_DIAGNOSTICS=...`. Vollständige Anleitung:
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
- **Protokolle leer?** Prüfen Sie, ob das Gateway läuft und in den Dateipfad
  in `logging.file` schreibt.
- **Mehr Details nötig?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandt

- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP/HTTP-Export, Metrik-/Span-Katalog, Datenschutzmodell
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Protokoll-Flags
- [Gateway-Protokollierungsinterna](/de/gateway/logging) — WS-Protokollstile, Subsystem-Präfixe und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige Feldreferenz zu `diagnostics.*`
