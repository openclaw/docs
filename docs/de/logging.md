---
read_when:
    - Sie benötigen einen anfängerfreundlichen Überblick über die Protokollierung in OpenClaw.
    - Sie möchten Protokollierungsstufen, Formate oder Schwärzung konfigurieren
    - Sie führen eine Fehlerbehebung durch und müssen schnell Protokolle finden
summary: Dateiprotokolle, Konsolenausgabe, CLI-Liveanzeige und die Registerkarte „Logs“ der Control UI
title: Protokollierung
x-i18n:
    generated_at: "2026-07-12T15:35:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw verfügt über zwei zentrale Protokolloberflächen:

- **Dateiprotokolle** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe** im Terminal, in dem das Gateway ausgeführt wird.

Der Tab **Protokolle** der Control UI verfolgt das Gateway-Dateiprotokoll fortlaufend. Auf dieser Seite wird erläutert, wo
sich Protokolle befinden, wie Sie sie lesen und wie Sie Protokollstufen und -formate konfigurieren.

## Speicherort der Protokolle

Standardmäßig schreibt das Gateway pro Tag eine rollierende Protokolldatei:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts. Wenn `/tmp/openclaw` unsicher
oder nicht verfügbar ist (und unter Windows immer), verwendet OpenClaw stattdessen ein benutzerbezogenes
Verzeichnis `openclaw-<uid>` im temporären Verzeichnis des Betriebssystems. Datierte Protokolldateien werden
nach 24 Stunden bereinigt.

Jede Datei wird rotiert, wenn der nächste Schreibvorgang `logging.maxFileBytes`
überschreiten würde (Standard: 100 MB). OpenClaw bewahrt neben der aktiven Datei bis zu fünf
nummerierte Archive auf, beispielsweise `openclaw-YYYY-MM-DD.1.log`, und schreibt in eine neue
aktive Protokolldatei weiter, anstatt Diagnoseinformationen zu unterdrücken.

Sie können den Pfad in `~/.openclaw/openclaw.json` überschreiben:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Protokolle lesen

### CLI: Live-Verfolgung (empfohlen)

Verfolgen Sie die Gateway-Protokolldatei über RPC:

```bash
openclaw logs --follow
```

Optionen:

| Flag                | Standard | Verhalten                                                                                              |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `--follow`          | aus      | Verfolgung fortsetzen; bei einer Trennung wird mit Backoff erneut verbunden                            |
| `--limit <n>`       | `200`    | Maximale Anzahl von Zeilen pro Abruf                                                                   |
| `--max-bytes <n>`   | `250000` | Maximale Anzahl zu lesender Bytes pro Abruf                                                            |
| `--interval <ms>`   | `1000`   | Abfrageintervall während der Verfolgung                                                                |
| `--json`            | aus      | Zeilenbegrenztes JSON (ein Ereignis pro Zeile)                                                         |
| `--plain`           | aus      | In TTY-Sitzungen Klartext erzwingen                                                                    |
| `--no-color`        | —        | ANSI-Farben deaktivieren                                                                               |
| `--utc`             | aus      | Zeitstempel in UTC darstellen (Standard ist die lokale Zeit)                                           |
| `--local-time`      | aus      | Akzeptierte Kompatibilitätsschreibweise für den Standard „lokale Zeit“; darüber hinaus keine Wirkung   |
| `--url` / `--token` | —        | Standardmäßige Gateway-RPC-Flags                                                                       |
| `--timeout <ms>`    | `30000`  | Gateway-RPC-Zeitüberschreitung                                                                         |
| `--expect-final`    | aus      | Warte-Flag für die endgültige Antwort bei agentengestütztem RPC (hier über die gemeinsame Clientschicht akzeptiert) |

Ausgabemodi:

- **TTY-Sitzungen**: übersichtliche, farbige, strukturierte Protokollzeilen.
- **Nicht-TTY-Sitzungen**: Klartext.

Wenn Sie eine explizite `--url` übergeben, wendet die CLI Konfigurations- oder
Umgebungsanmeldedaten nicht automatisch an. Geben Sie selbst `--token` an, andernfalls schlägt
der Aufruf mit `gateway url override requires explicit credentials` fehl.

Im JSON-Modus gibt die CLI mit `type` gekennzeichnete Objekte aus:

- `meta`: Stream-Metadaten (Datei, Quelle, Quellart, Dienst, Cursor, Größe)
- `log`: analysierter Protokolleintrag
- `notice`: Hinweise zu Kürzung/Rotation
- `raw`: nicht analysierte Protokollzeile
- `error`: Gateway-Verbindungsfehler (werden in stderr geschrieben)

Wenn das implizite lokale Loopback-Gateway eine Kopplung anfordert, während des Verbindungsaufbaus
geschlossen wird oder eine Zeitüberschreitung auftritt, bevor `logs.tail` antwortet, greift `openclaw logs`
automatisch auf das konfigurierte Gateway-Dateiprotokoll zurück. Explizite `--url`-Ziele verwenden
diesen Fallback nicht. `openclaw logs --follow` ist strenger: Unter Linux verwendet es nach Möglichkeit
das aktive benutzerspezifische systemd-Gateway-Journal anhand der PID und versucht andernfalls mit
Backoff erneut, das aktive Gateway zu erreichen, statt eine möglicherweise veraltete, parallel liegende
Datei zu verfolgen.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus, Folgendes auszuführen:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Protokolle** der Control UI verfolgt dieselbe Datei mithilfe von `logs.tail`.
Unter [Control UI](/de/web/control-ui) erfahren Sie, wie Sie ihn öffnen.

### Nur Kanalprotokolle

Verwenden Sie Folgendes, um Kanalaktivitäten (WhatsApp/Telegram/usw.) zu filtern:

```bash
openclaw channels logs --channel whatsapp
```

`--channel` verwendet standardmäßig `all`; `--lines <n>` (Standard: 200) und `--json` sind ebenfalls
verfügbar.

## Protokollformate

### Dateiprotokolle (JSONL)

Jede Zeile in der Protokolldatei ist ein JSON-Objekt. Die CLI und die Control UI analysieren diese
Einträge, um eine strukturierte Ausgabe darzustellen (Zeit, Stufe, Subsystem, Nachricht).

JSONL-Datensätze in Dateiprotokollen enthalten, sofern verfügbar, außerdem maschinell filterbare Felder
auf oberster Ebene:

- `hostname`: Hostname des Gateways.
- `message`: abgeflachter Protokollnachrichtentext für die Volltextsuche.
- `agent_id`: ID des aktiven Agenten, wenn der Protokollaufruf einen Agentenkontext enthält.
- `session_id`: ID/Schlüssel der aktiven Sitzung, wenn der Protokollaufruf einen Sitzungskontext enthält.
- `channel`: aktiver Kanal, wenn der Protokollaufruf einen Kanalkontext enthält.

OpenClaw bewahrt die ursprünglichen strukturierten Protokollargumente neben diesen Feldern auf,
damit bestehende Parser, die nummerierte tslog-Argumentschlüssel lesen, weiterhin funktionieren.

Aktivitäten von Talk, Echtzeitsprachübertragung und verwalteten Räumen erzeugen begrenzte
Lebenszyklus-Protokolldatensätze über dieselbe Dateiprotoll-Pipeline. Diese Datensätze enthalten,
sofern verfügbar, Ereignistyp, Modus, Transport, Provider sowie Größen- und Zeitmessungen, lassen jedoch
Transkripttext, Audionutzdaten, Turn-IDs, Anruf-IDs und Provider-Element-IDs aus.

### Konsolenausgabe

Konsolenprotokolle sind **TTY-bewusst** und auf Lesbarkeit formatiert:

- Subsystempräfixe (z. B. `gateway/channels/whatsapp`)
- Farbliche Kennzeichnung der Stufen (Info/Warnung/Fehler)
- Optionaler kompakter oder JSON-Modus

Die Konsolenformatierung wird durch `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Protokolle

`openclaw gateway` bietet außerdem WebSocket-Protokollierung für RPC-Datenverkehr:

- Normaler Modus: nur relevante Ergebnisse (Fehler, Analysefehler, langsame Aufrufe)
- `--verbose`: gesamter Anfrage-/Antwortdatenverkehr
- `--ws-log auto|compact|full`: ausführlichen Darstellungsstil auswählen
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

Stufen: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: Stufe der **Dateiprotokolle** (JSONL) (Standard: `info`).
- `logging.consoleLevel`: Ausführlichkeitsstufe der **Konsole**.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für eine einzelne Ausführung erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können außerdem die globale CLI-Option **`--log-level <level>`** übergeben (beispielsweise `openclaw --log-level debug gateway run`), die für diesen Befehl die Umgebungsvariable überschreibt.

`--verbose` wirkt sich nur auf die Konsolenausgabe und die Ausführlichkeit der WS-Protokolle aus; die
Stufen der Dateiprotokolle werden dadurch nicht geändert.

### Gezielte Modelltransportdiagnose

Verwenden Sie beim Debuggen von Provider-Aufrufen gezielte Umgebungs-Flags, statt
alle Protokolle auf `debug` zu setzen:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Verfügbare Flags:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: Gibt Anfragestart, Fetch-Antwort, SDK-
  Header, erstes Streaming-Ereignis, Stream-Abschluss und Transportfehler auf der
  Stufe `info` aus.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: Nimmt eine begrenzte Zusammenfassung der
  Anfragenutzdaten in Modellanfrageprotokolle auf.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: Nimmt alle modellseitigen Toolnamen in
  die Nutzdatenzusammenfassung auf.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: Nimmt einen redigierten, größenbegrenzten JSON-
  Schnappschuss der Nutzdaten auf. Verwenden Sie dies nur während des Debuggens; Geheimnisse werden redigiert,
  Prompts und Nachrichtentext können jedoch weiterhin enthalten sein.
- `OPENCLAW_DEBUG_SSE=events`: Gibt die Zeitmessung des ersten Ereignisses und des Stream-Abschlusses aus.
- `OPENCLAW_DEBUG_SSE=peek`: Gibt zusätzlich die ersten fünf redigierten SSE-Ereignis-
  Nutzdaten aus, jeweils größenbegrenzt.
- `OPENCLAW_DEBUG_CODE_MODE=1`: Gibt Diagnoseinformationen zur Modelloberfläche des Code-Modus aus,
  einschließlich der Fälle, in denen native Provider-Tools ausgeblendet werden, weil der Code-Modus die
  Tooloberfläche besitzt.

Diese Flags protokollieren über die normale OpenClaw-Protokollierung, sodass `openclaw logs --follow`
und der Tab „Protokolle“ der Control UI sie anzeigen. Ohne die Flags sind dieselben Diagnoseinformationen
weiterhin auf der Stufe `debug` verfügbar.

`[model-fetch]`-Start- und Antwortmetadaten (Provider, API, Modell, Status,
Latenz und Anfragefelder wie Methode, URL, Zeitüberschreitung, Proxy und Richtlinie)
werden unabhängig von `OPENCLAW_DEBUG_MODEL_TRANSPORT` immer auf der Stufe `info`
ausgegeben, sodass grundlegende Modelltransport-Hygiene ohne Debug-Flags sichtbar ist.

### Ablaufverfolgungskorrelation

Dateiprotokolle sind JSONL. Wenn ein Protokollaufruf einen gültigen diagnostischen Ablaufverfolgungskontext enthält,
schreibt OpenClaw die Ablaufverfolgungsfelder als JSON-Schlüssel auf oberster Ebene (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), damit externe Protokollprozessoren die Zeile
mit OTEL-Spans und der Weitergabe von `traceparent` an Provider korrelieren können.

Gateway-HTTP-Anfragen und Gateway-WebSocket-Frames richten einen internen
Ablaufverfolgungsbereich für Anfragen ein. Protokolle und Diagnoseereignisse, die innerhalb dieses asynchronen Bereichs
ausgegeben werden, erben die Anfrage-Ablaufverfolgung, wenn sie keinen expliziten Ablaufverfolgungskontext übergeben. Ablaufverfolgungen von Agentenausführungen und
Modellaufrufen werden zu untergeordneten Elementen der aktiven Anfrage-Ablaufverfolgung, sodass lokale Protokolle,
Diagnoseschnappschüsse, OTEL-Spans und vertrauenswürdige `traceparent`-Header von Providern
über `traceId` verknüpft werden können, ohne rohe Anfrage- oder Modellinhalte zu protokollieren.

Talk-Lebenszyklus-Protokolldatensätze fließen außerdem in den diagnostics-otel-Protokollexport, wenn
der OpenTelemetry-Protokollexport aktiviert ist, und verwenden dieselben begrenzten Attribute wie Dateiprotokolle.
Konfigurieren Sie `diagnostics.otel.logsExporter`, um OTLP, stdout-JSONL oder
beide Ziele auszuwählen.

### Größe und Zeitmessung von Modellaufrufen

Diagnoseinformationen zu Modellaufrufen erfassen begrenzte Anfrage-/Antwortmessungen, ohne
rohe Prompt- oder Antwortinhalte aufzuzeichnen:

- `requestPayloadBytes`: UTF-8-Bytegröße der endgültigen Modellanfragenutzdaten
- `responseStreamBytes`: UTF-8-Bytegröße gestreamter Nutzdatenblöcke der Modellantwort.
  Hochfrequente Text-, Denk- und Toolaufruf-Delta-Ereignisse zählen nur
  die inkrementellen `delta`-Bytes statt vollständiger `partial`-Schnappschüsse.
- `timeToFirstByteMs`: verstrichene Zeit bis zum ersten gestreamten Antwortereignis
- `durationMs`: Gesamtdauer des Modellaufrufs

Diese Felder stehen Diagnoseschnappschüssen, Plugin-Hooks für Modellaufrufe sowie
OTEL-Spans/-Metriken für Modellaufrufe zur Verfügung, wenn der Diagnoseexport aktiviert ist.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: benutzerfreundlich, farbig und mit Zeitstempeln.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Protokollprozessoren).

### Redigierung

OpenClaw kann sensible Token redigieren, bevor sie in die Konsolenausgabe, Dateiprotokolle,
OTLP-Protokolldatensätze, dauerhaft gespeicherten Sitzungstranskripttext oder Ereignisnutzdaten von
Control-UI-Tools gelangen (Argumente beim Toolstart, Nutzdaten von Teil-/Endergebnissen, abgeleitete
exec-Ausgabe und Patch-Zusammenfassungen):

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Zeichenfolgen, die den Standardsatz für die Protokoll-/Transkriptausgabe ersetzt. Für Tool-Nutzdaten der Control UI werden benutzerdefinierte Muster zusätzlich zu den integrierten Standardmustern angewendet, sodass das Hinzufügen eines Musters niemals die Redigierung von Werten abschwächt, die bereits von den Standardmustern erfasst werden.

Dateiprotokolle und Sitzungstranskripte bleiben JSONL, übereinstimmende geheime Werte werden jedoch
maskiert, bevor die Zeile oder Nachricht auf den Datenträger geschrieben wird. Die Redigierung erfolgt nach bestem Bemühen:
Sie wird auf texttragende Nachrichteninhalte und Protokollzeichenfolgen angewendet, nicht auf jedes
Bezeichner- oder Binärnutzdatenfeld.

Die integrierten Standardwerte decken gängige API-Zugangsdaten und Feldnamen für Zahlungszugangsdaten ab, beispielsweise Kartennummer, CVC/CVV, gemeinsam verwendetes Zahlungstoken und Zahlungszugangsdaten, wenn sie als JSON-Felder, URL-Parameter, CLI-Flags oder Zuweisungen vorkommen.

`logging.redactSensitive: "off"` deaktiviert nur diese allgemeine Richtlinie für Protokolle und Transkripte. OpenClaw schwärzt weiterhin Nutzdaten an Sicherheitsgrenzen, die UI-Clients, Support-Paketen, Diagnosebeobachtern, Genehmigungsaufforderungen oder Agent-Tools angezeigt werden können. Beispiele hierfür sind Tool-Aufrufereignisse der Control UI, die Ausgabe von `sessions_history`, Diagnose-Supportexporte, Beobachtungen von Provider-Fehlern, die Anzeige von Befehlen zur Ausführungsgenehmigung und Gateway-WebSocket-Protokolle. Benutzerdefinierte `logging.redactPatterns` können auf diesen Oberflächen weiterhin projektspezifische Muster hinzufügen.

## Diagnose und OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modellausführungen und die Telemetrie des Nachrichtenflusses (Webhooks, Warteschlangenverarbeitung, Sitzungsstatus). Sie ersetzen **keine** Protokolle, sondern liefern Daten für Metriken, Traces und Exporter. Ereignisse werden standardmäßig prozessintern ausgegeben (setzen Sie `diagnostics.enabled: false`, um sie zu deaktivieren); ihr Export wird separat konfiguriert.

Zwei benachbarte Bereiche:

- **OpenTelemetry-Export** — sendet Metriken, Traces und Protokolle über OTLP/HTTP an einen beliebigen OpenTelemetry-kompatiblen Collector oder ein entsprechendes Backend (Datadog, Grafana, Honeycomb, New Relic, Tempo usw.). Die vollständige Konfiguration, der Signalkatalog, die Namen von Metriken und Spans, Umgebungsvariablen und das Datenschutzmodell befinden sich auf einer eigenen Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnose-Flags** — gezielte Flags für Debug-Protokolle, die zusätzliche Protokolle an `logging.file` weiterleiten, ohne `logging.level` zu erhöhen. Bei Flags wird nicht zwischen Groß- und Kleinschreibung unterschieden, und Platzhalter werden unterstützt (`telegram.*`, `*`). Konfigurieren Sie sie unter `diagnostics.flags` oder über die Umgebungsvariablen-Überschreibung `OPENCLAW_DIAGNOSTICS=...`. Vollständige Anleitung:
  [Diagnose-Flags](/de/diagnostics/flags).

Informationen zum OTLP-Export an einen Collector finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).

## Tipps zur Fehlerbehebung

- **Gateway nicht erreichbar?** Führen Sie zuerst `openclaw doctor` aus.
- **Protokolle leer?** Prüfen Sie, ob der Gateway ausgeführt wird und in den unter `logging.file` angegebenen Dateipfad schreibt.
- **Benötigen Sie weitere Details?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandte Themen

- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP/HTTP-Export, Metrik-/Span-Katalog, Datenschutzmodell
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Flags für Debug-Protokolle
- [Interna der Gateway-Protokollierung](/de/gateway/logging) — WS-Protokollstile, Subsystempräfixe und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige Referenz der `diagnostics.*`-Felder
