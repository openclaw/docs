---
read_when:
    - Sie benötigen einen anfängerfreundlichen Überblick über das OpenClaw-Logging
    - Sie möchten Log-Level, Formate oder Schwärzung konfigurieren
    - Sie führen eine Fehlerbehebung durch und müssen schnell Logs finden
summary: Logdateien, Konsolenausgabe, CLI-Tailing und der Tab „Protokolle“ in der Control UI
title: Protokollierung
x-i18n:
    generated_at: "2026-05-11T20:33:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw hat zwei Hauptoberflächen für Protokolle:

- **Dateiprotokolle** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe**, die in Terminals und der Gateway-Debug-UI angezeigt wird.

Der Tab **Protokolle** der Control UI verfolgt das Gateway-Dateiprotokoll. Diese Seite erklärt, wo
Protokolle gespeichert werden, wie Sie sie lesen und wie Sie Protokollebenen und -formate konfigurieren.

## Wo Protokolle gespeichert werden

Standardmäßig schreibt das Gateway eine rotierende Protokolldatei unter:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.

Jede Datei rotiert, wenn sie `logging.maxFileBytes` erreicht (Standard: 100 MB).
OpenClaw behält bis zu fünf nummerierte Archive neben der aktiven Datei, zum Beispiel
`openclaw-YYYY-MM-DD.1.log`, und schreibt in ein frisches aktives Protokoll weiter, statt
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

Verwenden Sie die CLI, um das Gateway-Protokoll per RPC live zu verfolgen:

```bash
openclaw logs --follow
```

Nützliche aktuelle Optionen:

- `--local-time`: Zeitstempel in Ihrer lokalen Zeitzone ausgeben
- `--url <url>` / `--token <token>` / `--timeout <ms>`: Standard-Gateway-RPC-Flags
- `--expect-final`: Warte-Flag für agentengestützte RPC-Endantworten (hier über die gemeinsame Client-Schicht akzeptiert)

Ausgabemodi:

- **TTY-Sitzungen**: ansprechende, farbige, strukturierte Protokollzeilen.
- **Nicht-TTY-Sitzungen**: Klartext.
- `--json`: zeilenbegrenztes JSON (ein Protokollereignis pro Zeile).
- `--plain`: Klartext in TTY-Sitzungen erzwingen.
- `--no-color`: ANSI-Farben deaktivieren.

Wenn Sie eine explizite `--url` übergeben, wendet die CLI Konfigurations- oder
Umgebungsanmeldedaten nicht automatisch an; geben Sie `--token` selbst an, wenn das Ziel-Gateway
Authentifizierung erfordert.

Im JSON-Modus gibt die CLI Objekte mit `type`-Tags aus:

- `meta`: Stream-Metadaten (Datei, Cursor, Größe)
- `log`: geparster Protokolleintrag
- `notice`: Hinweise zu Kürzung / Rotation
- `raw`: ungeparste Protokollzeile

Wenn das implizite local loopback Gateway eine Kopplung anfordert, während des Verbindens schließt
oder eine Zeitüberschreitung auftritt, bevor `logs.tail` antwortet, fällt `openclaw logs` automatisch auf das
konfigurierte Gateway-Dateiprotokoll zurück. Explizite `--url`-Ziele verwenden diesen Fallback nicht.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus, Folgendes auszuführen:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Protokolle** der Control UI verfolgt dieselbe Datei mit `logs.tail`.
Siehe [Control UI](/de/web/control-ui), um zu erfahren, wie Sie sie öffnen.

### Nur-Kanal-Protokolle

Um Kanalaktivität (WhatsApp/Telegram/usw.) zu filtern, verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

## Protokollformate

### Dateiprotokolle (JSONL)

Jede Zeile in der Protokolldatei ist ein JSON-Objekt. Die CLI und die Control UI parsen diese
Einträge, um strukturierte Ausgabe (Zeit, Ebene, Subsystem, Nachricht) darzustellen.

JSONL-Datensätze der Dateiprotokolle enthalten außerdem maschinenfilterbare Felder auf oberster Ebene, wenn
verfügbar:

- `hostname`: Hostname des Gateways.
- `message`: abgeflachter Protokollnachrichtentext für Volltextsuche.
- `agent_id`: aktive Agenten-ID, wenn der Protokollaufruf Agentenkontext enthält.
- `session_id`: aktive Sitzungs-ID bzw. aktiver Sitzungsschlüssel, wenn der Protokollaufruf Sitzungskontext enthält.
- `channel`: aktiver Kanal, wenn der Protokollaufruf Kanalkontext enthält.

OpenClaw bewahrt die ursprünglichen strukturierten Protokollargumente neben diesen Feldern auf,
sodass bestehende Parser, die nummerierte tslog-Argumentschlüssel lesen, weiterhin funktionieren.

Talk-, Echtzeit-Sprach- und verwaltete Raumaktivität geben begrenzte Lebenszyklus-Protokolldatensätze
über dieselbe Dateiprotokoll-Pipeline aus. Diese Datensätze enthalten Ereignistyp,
Modus, Transport, Provider sowie Größen- und Zeitmessungen, wenn verfügbar, lassen jedoch
Transkripttext, Audio-Payloads, Turn-IDs, Call-IDs und Provider-Item-IDs aus.

### Konsolenausgabe

Konsolenprotokolle sind **TTY-bewusst** und für Lesbarkeit formatiert:

- Subsystem-Präfixe (z. B. `gateway/channels/whatsapp`)
- Farbliche Ebenendarstellung (info/warn/error)
- Optionaler Kompakt- oder JSON-Modus

Die Konsolenformatierung wird durch `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Protokolle

`openclaw gateway` verfügt außerdem über WebSocket-Protokollierung für RPC-Datenverkehr:

- normaler Modus: nur interessante Ergebnisse (Fehler, Parse-Fehler, langsame Aufrufe)
- `--verbose`: sämtlicher Anfrage-/Antwort-Datenverkehr
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

### Protokollebenen

- `logging.level`: Ebene für **Dateiprotokolle** (JSONL).
- `logging.consoleLevel`: Ausführlichkeitsgrad der **Konsole**.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können auch die globale CLI-Option **`--log-level <level>`** übergeben (zum Beispiel `openclaw --log-level debug gateway run`), die die Umgebungsvariable für diesen Befehl überschreibt.

`--verbose` wirkt sich nur auf die Konsolenausgabe und die Ausführlichkeit der WS-Protokolle aus; es ändert nicht
die Ebenen der Dateiprotokolle.

### Gezielte Modelltransport-Diagnosen

Beim Debuggen von Provider-Aufrufen verwenden Sie gezielte Umgebungs-Flags, statt
alle Protokolle auf `debug` anzuheben:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Verfügbare Flags:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: Anfragebeginn, Fetch-Antwort, SDK-
  Header, erstes Streaming-Ereignis, Streamabschluss und Transportfehler auf
  `info`-Ebene ausgeben.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: eine begrenzte Zusammenfassung der Anfrage-Payload
  in Modellanfrageprotokolle aufnehmen.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: alle modellseitigen Tool-Namen in
  die Payload-Zusammenfassung aufnehmen.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: eine redigierte, begrenzte JSON-
  Payload-Momentaufnahme aufnehmen. Nur während des Debuggens verwenden; Geheimnisse werden redigiert, aber Prompts
  und Nachrichtentext können weiterhin vorhanden sein.
- `OPENCLAW_DEBUG_SSE=events`: Timing für erstes Ereignis und Streamabschluss ausgeben.
- `OPENCLAW_DEBUG_SSE=peek`: zusätzlich die ersten fünf redigierten SSE-Ereignis-
  Payloads ausgeben, pro Ereignis begrenzt.
- `OPENCLAW_DEBUG_CODE_MODE=1`: Diagnosen zur Modelloberfläche im Code-Modus ausgeben,
  einschließlich Fällen, in denen native Provider-Tools ausgeblendet werden, weil der Code-Modus die
  Tool-Oberfläche besitzt.

Diese Flags protokollieren über die normale OpenClaw-Protokollierung, daher zeigen `openclaw logs --follow`
und der Protokolle-Tab der Control UI sie an. Ohne die Flags bleiben dieselben Diagnosen
auf `debug`-Ebene verfügbar.

### Trace-Korrelation

Dateiprotokolle sind JSONL. Wenn ein Protokollaufruf einen gültigen Diagnose-Trace-Kontext enthält,
schreibt OpenClaw die Trace-Felder als JSON-Schlüssel auf oberster Ebene (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), damit externe Protokollprozessoren die Zeile
mit OTEL-Spans und Provider-`traceparent`-Weitergabe korrelieren können.

Gateway-HTTP-Anfragen und Gateway-WebSocket-Frames stellen einen internen Anfrage-
Trace-Scope her. Protokolle und Diagnoseereignisse, die innerhalb dieses asynchronen Scopes ausgegeben werden, erben
den Anfrage-Trace, wenn sie keinen expliziten Trace-Kontext übergeben. Agentenlauf- und
Modellaufruf-Traces werden zu untergeordneten Traces des aktiven Anfrage-Traces, sodass lokale Protokolle,
Diagnose-Momentaufnahmen, OTEL-Spans und vertrauenswürdige Provider-`traceparent`-Header
über `traceId` verbunden werden können, ohne rohe Anfrage- oder Modellinhalte zu protokollieren.

Talk-Lebenszyklus-Protokolldatensätze fließen außerdem in OTLP-Protokolle, wenn der OpenTelemetry-Protokollexport
aktiviert ist, und verwenden dieselben begrenzten Attribute wie Dateiprotokolle.

### Größe und Timing von Modellaufrufen

Modellaufruf-Diagnosen erfassen begrenzte Anfrage-/Antwortmessungen, ohne
rohe Prompt- oder Antwortinhalte zu erfassen:

- `requestPayloadBytes`: UTF-8-Byte-Größe der finalen Modellanfrage-Payload
- `responseStreamBytes`: UTF-8-Byte-Größe gestreamter Modellantwortereignisse
- `timeToFirstByteMs`: verstrichene Zeit bis zum ersten gestreamten Antwortereignis
- `durationMs`: Gesamtdauer des Modellaufrufs

Diese Felder stehen Diagnose-Momentaufnahmen, Modellaufruf-Plugin-Hooks und
OTEL-Modellaufruf-Spans/-Metriken zur Verfügung, wenn der Diagnoseexport aktiviert ist.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: menschenfreundlich, farbig, mit Zeitstempeln.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Protokollprozessoren).

### Redigierung

OpenClaw kann sensible Tokens redigieren, bevor sie in Konsolenausgabe, Dateiprotokolle,
OTLP-Protokolldatensätze, persistierten Sitzungstranskripttext oder Tool-
Ereignis-Payloads der Control UI gelangen (Tool-Startargumente, partielle/finale Ergebnis-Payloads, abgeleitete
Exec-Ausgabe und Patch-Zusammenfassungen):

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Strings zum Überschreiben des Standardsatzes. Benutzerdefinierte Muster werden zusätzlich zu den integrierten Standards für Tool-Payloads der Control UI angewendet, sodass das Hinzufügen eines Musters die Redigierung von Werten, die bereits von den Standards erfasst werden, nie abschwächt.

Dateiprotokolle und Sitzungstranskripte bleiben JSONL, aber passende geheime Werte werden
maskiert, bevor die Zeile oder Nachricht auf die Festplatte geschrieben wird. Redigierung erfolgt nach bestem Aufwand:
Sie gilt für texttragende Nachrichteninhalte und Protokollstrings, nicht für jedes
Kennungs- oder Binär-Payload-Feld.

Die integrierten Standards decken gängige API-Anmeldedaten und Feldnamen für Zahlungsanmeldedaten ab,
wie Kartennummer, CVC/CVV, gemeinsames Zahlungstoken und Zahlungsanmeldedaten,
wenn sie als JSON-Felder, URL-Parameter, CLI-Flags oder Zuweisungen erscheinen.

`logging.redactSensitive: "off"` deaktiviert nur diese allgemeine Protokoll-/Transkript-
Richtlinie. OpenClaw redigiert weiterhin Payloads an Sicherheitsgrenzen, die UI-
Clients, Support-Bundles, Diagnosebeobachtern, Genehmigungs-Prompts oder Agenten-
Tools angezeigt werden können. Beispiele sind Tool-Aufruf-Ereignisse der Control UI, `sessions_history`-Ausgabe,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, Anzeige von Exec-Genehmigungsbefehlen
und Gateway-WebSocket-Protokolle. Benutzerdefinierte `logging.redactPatterns`
können auf diesen Oberflächen weiterhin projektspezifische Muster hinzufügen.

## Diagnosen und OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modellläufe und
Nachrichtenfluss-Telemetrie (Webhooks, Warteschlangen, Sitzungsstatus). Sie
ersetzen Protokolle **nicht** - sie speisen Metriken, Traces und Exporter. Ereignisse werden
prozessintern ausgegeben, unabhängig davon, ob Sie sie exportieren.

Zwei angrenzende Oberflächen:

- **OpenTelemetry-Export** - Metriken, Traces und Protokolle über OTLP/HTTP an
  jeden OpenTelemetry-kompatiblen Collector oder jedes Backend senden (Grafana, Datadog,
  Honeycomb, New Relic, Tempo usw.). Vollständige Konfiguration, Signalkatalog,
  Metrik-/Span-Namen, Umgebungsvariablen und Datenschutzmodell befinden sich auf einer eigenen Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnose-Flags** - gezielte Debug-Protokoll-Flags, die zusätzliche Protokolle an
  `logging.file` weiterleiten, ohne `logging.level` anzuheben. Flags sind nicht groß-/kleinschreibungssensitiv
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
- **Protokolle leer?** Prüfen Sie, ob das Gateway läuft und in den Dateipfad
  in `logging.file` schreibt.
- **Benötigen Sie mehr Details?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandte Themen

- [OpenTelemetry-Export](/de/gateway/opentelemetry) - OTLP/HTTP-Export, Metrik-/Span-Katalog, Datenschutzmodell
- [Diagnose-Flags](/de/diagnostics/flags) - gezielte Debug-Protokoll-Flags
- [Interna der Gateway-Protokollierung](/de/gateway/logging) - WS-Protokollstile, Subsystem-Präfixe und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) - vollständige `diagnostics.*`-Feldreferenz
