---
read_when:
    - Sie benötigen einen einsteigerfreundlichen Überblick über die Protokollierung in OpenClaw
    - Sie möchten Protokollierungsstufen, Formate oder Schwärzungen konfigurieren
    - Sie führen eine Fehlerbehebung durch und müssen schnell Protokolle finden.
summary: Dateiprotokolle, Konsolenausgabe, Protokollverfolgung über die CLI und die Registerkarte „Protokolle“ in der Control UI
title: Protokollierung
x-i18n:
    generated_at: "2026-07-12T01:49:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw verfügt über zwei zentrale Protokolloberflächen:

- **Dateiprotokolle** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe** im Terminal, in dem das Gateway ausgeführt wird.

Die Registerkarte **Protokolle** der Steuerungsoberfläche verfolgt das Gateway-Dateiprotokoll fortlaufend. Auf dieser Seite wird erläutert, wo sich
Protokolle befinden, wie Sie sie lesen und wie Sie Protokollierungsstufen und -formate konfigurieren.

## Speicherort der Protokolle

Standardmäßig schreibt das Gateway pro Tag eine fortlaufende Protokolldatei:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts. Wenn `/tmp/openclaw` unsicher
oder nicht verfügbar ist (und immer unter Windows), verwendet OpenClaw stattdessen ein benutzerbezogenes
Verzeichnis `openclaw-<uid>` im temporären Verzeichnis des Betriebssystems. Datierte Protokolldateien werden
nach 24 Stunden bereinigt.

Jede Datei wird rotiert, wenn der nächste Schreibvorgang `logging.maxFileBytes`
überschreiten würde (Standard: 100 MB). OpenClaw bewahrt bis zu fünf nummerierte Archive neben der
aktiven Datei auf, beispielsweise `openclaw-YYYY-MM-DD.1.log`, und schreibt in ein neues
aktives Protokoll weiter, statt Diagnoseinformationen zu unterdrücken.

Sie können den Pfad in `~/.openclaw/openclaw.json` überschreiben:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Protokolle lesen

### CLI: fortlaufende Live-Anzeige (empfohlen)

Verfolgen Sie die Gateway-Protokolldatei über RPC:

```bash
openclaw logs --follow
```

Optionen:

| Flag                | Standard | Verhalten                                                                                                  |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `--follow`          | aus      | Verfolgt das Protokoll weiter; stellt die Verbindung nach einem Abbruch mit ansteigender Wartezeit wieder her |
| `--limit <n>`       | `200`    | Maximale Zeilenanzahl pro Abruf                                                                            |
| `--max-bytes <n>`   | `250000` | Maximale Anzahl zu lesender Bytes pro Abruf                                                                |
| `--interval <ms>`   | `1000`   | Abfrageintervall während der fortlaufenden Anzeige                                                         |
| `--json`            | aus      | Zeilengetrenntes JSON (ein Ereignis pro Zeile)                                                             |
| `--plain`           | aus      | Erzwingt Klartext in TTY-Sitzungen                                                                         |
| `--no-color`        | —        | Deaktiviert ANSI-Farben                                                                                    |
| `--utc`             | aus      | Stellt Zeitstempel in UTC dar (standardmäßig wird die lokale Zeit verwendet)                               |
| `--local-time`      | aus      | Akzeptierte Kompatibilitätsschreibweise für die Standardeinstellung „lokale Zeit“; darüber hinaus ohne Wirkung |
| `--url` / `--token` | —        | Standardmäßige Gateway-RPC-Flags                                                                           |
| `--timeout <ms>`    | `30000`  | Zeitüberschreitung für Gateway-RPC                                                                         |
| `--expect-final`    | aus      | Warte-Flag für die endgültige Antwort eines agentengestützten RPC (wird hier über die gemeinsame Clientebene akzeptiert) |

Ausgabemodi:

- **TTY-Sitzungen**: übersichtliche, farbige und strukturierte Protokollzeilen.
- **Nicht-TTY-Sitzungen**: Klartext.

Wenn Sie ausdrücklich `--url` angeben, wendet die CLI weder Zugangsdaten aus der Konfiguration noch aus
der Umgebung automatisch an. Geben Sie `--token` selbst an, andernfalls schlägt der Aufruf mit
`gateway url override requires explicit credentials` fehl.

Im JSON-Modus gibt die CLI mit `type` gekennzeichnete Objekte aus:

- `meta`: Stream-Metadaten (Datei, Quelle, Quellenart, Dienst, Cursor, Größe)
- `log`: analysierter Protokolleintrag
- `notice`: Hinweise auf Kürzung oder Rotation
- `raw`: nicht analysierte Protokollzeile
- `error`: Gateway-Verbindungsfehler (werden nach stderr geschrieben)

Wenn das implizite local loopback Gateway eine Kopplung verlangt, während des Verbindungsaufbaus geschlossen wird
oder eine Zeitüberschreitung auftritt, bevor `logs.tail` antwortet, greift `openclaw logs` automatisch auf das
konfigurierte Gateway-Dateiprotokoll zurück. Ausdrückliche `--url`-Ziele verwenden
diesen Rückgriff nicht. `openclaw logs --follow` ist strenger: Unter Linux verwendet es, sofern verfügbar,
das aktive benutzerbezogene systemd-Journal des Gateway anhand der PID und versucht andernfalls mit
ansteigender Wartezeit erneut, eine Verbindung zum aktiven Gateway herzustellen, statt eine möglicherweise veraltete,
parallel gespeicherte Datei zu verfolgen.

Wenn das Gateway nicht erreichbar ist, zeigt die CLI einen kurzen Hinweis an, folgenden Befehl auszuführen:

```bash
openclaw doctor
```

### Steuerungsoberfläche (Web)

Die Registerkarte **Protokolle** der Steuerungsoberfläche verfolgt dieselbe Datei mithilfe von `logs.tail`.
Unter [Steuerungsoberfläche](/de/web/control-ui) erfahren Sie, wie Sie sie öffnen.

### Kanalspezifische Protokolle

Um Kanalaktivitäten (WhatsApp/Telegram usw.) zu filtern, verwenden Sie:

```bash
openclaw channels logs --channel whatsapp
```

`--channel` verwendet standardmäßig `all`; `--lines <n>` (Standard: 200) und `--json` sind ebenfalls
verfügbar.

## Protokollformate

### Dateiprotokolle (JSONL)

Jede Zeile in der Protokolldatei ist ein JSON-Objekt. Die CLI und die Steuerungsoberfläche analysieren diese
Einträge, um eine strukturierte Ausgabe darzustellen (Zeit, Stufe, Subsystem, Meldung).

JSONL-Datensätze im Dateiprotokoll enthalten außerdem, sofern verfügbar, maschinenfilterbare Felder auf oberster Ebene:

- `hostname`: Hostname des Gateway.
- `message`: zusammengefasster Text der Protokollmeldung für die Volltextsuche.
- `agent_id`: ID des aktiven Agenten, wenn der Protokollaufruf einen Agentenkontext enthält.
- `session_id`: ID/Schlüssel der aktiven Sitzung, wenn der Protokollaufruf einen Sitzungskontext enthält.
- `channel`: aktiver Kanal, wenn der Protokollaufruf einen Kanalkontext enthält.

OpenClaw bewahrt die ursprünglichen strukturierten Protokollargumente zusammen mit diesen Feldern auf,
damit vorhandene Parser, die nummerierte tslog-Argumentschlüssel lesen, weiterhin funktionieren.

Aktivitäten von Talk, Echtzeit-Sprachkommunikation und verwalteten Räumen erzeugen begrenzte Lebenszyklus-Protokolldatensätze
über dieselbe Dateiprotoll-Pipeline. Diese Datensätze enthalten Ereignistyp,
Modus, Transport, Provider sowie Größen- und Zeitmessungen, sofern verfügbar, lassen jedoch
Transkripttext, Audionutzdaten, Turn-IDs, Anruf-IDs und Provider-Element-IDs aus.

### Konsolenausgabe

Konsolenprotokolle berücksichtigen **TTY** und sind zur besseren Lesbarkeit formatiert:

- Subsystempräfixe (z. B. `gateway/channels/whatsapp`)
- Farbliche Kennzeichnung der Stufen (Information/Warnung/Fehler)
- Optionaler kompakter oder JSON-Modus

Die Konsolenformatierung wird über `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Protokolle

`openclaw gateway` bietet außerdem eine WebSocket-Protokollierung des RPC-Datenverkehrs:

- normaler Modus: nur relevante Ergebnisse (Fehler, Analysefehler, langsame Aufrufe)
- `--verbose`: gesamter Anfrage-/Antwortdatenverkehr
- `--ws-log auto|compact|full`: Darstellungsstil für die ausführliche Ausgabe auswählen
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

### Protokollierungsstufen

Stufen: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: Stufe der **Dateiprotokolle** (JSONL; Standard: `info`).
- `logging.consoleLevel`: Ausführlichkeitsstufe der **Konsole**.

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Lauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können außerdem die globale CLI-Option **`--log-level <level>`** übergeben (beispielsweise `openclaw --log-level debug gateway run`), die für diesen Befehl die Umgebungsvariable überschreibt.

`--verbose` wirkt sich nur auf die Konsolenausgabe und die Ausführlichkeit des WS-Protokolls aus; die
Stufen der Dateiprotokolle werden dadurch nicht geändert.

### Gezielte Diagnose des Modelltransports

Verwenden Sie beim Debuggen von Provider-Aufrufen gezielte Umgebungs-Flags, statt
alle Protokolle auf `debug` zu setzen:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Verfügbare Flags:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: protokolliert den Anfragestart, die Fetch-Antwort, SDK-
  Header, das erste Streaming-Ereignis, den Stream-Abschluss und Transportfehler auf der
  Stufe `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: fügt den Protokollen für Modellanfragen eine begrenzte Zusammenfassung
  der Anfragenutzdaten hinzu.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: nimmt alle für das Modell sichtbaren Werkzeugnamen in
  die Nutzdatenzusammenfassung auf.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: fügt eine redigierte, größenbegrenzte Momentaufnahme der JSON-
  Nutzdaten hinzu. Verwenden Sie dies nur während der Fehlersuche; Geheimnisse werden redigiert, Eingabeaufforderungen
  und Nachrichtentext können jedoch weiterhin enthalten sein.
- `OPENCLAW_DEBUG_SSE=events`: protokolliert die Zeitmessung des ersten Ereignisses und des Stream-Abschlusses.
- `OPENCLAW_DEBUG_SSE=peek`: protokolliert zusätzlich die ersten fünf redigierten SSE-Ereignis-
  nutzdaten, jeweils größenbegrenzt.
- `OPENCLAW_DEBUG_CODE_MODE=1`: protokolliert Diagnoseinformationen zur Modelloberfläche im Code-Modus,
  einschließlich der Fälle, in denen native Provider-Werkzeuge ausgeblendet werden, weil der Code-Modus die
  Werkzeugoberfläche verwaltet.

Diese Flags protokollieren über die normale OpenClaw-Protokollierung, sodass `openclaw logs --follow`
und die Registerkarte „Protokolle“ der Steuerungsoberfläche sie anzeigen. Ohne die Flags sind dieselben Diagnoseinformationen
weiterhin auf der Stufe `debug` verfügbar.

Start- und Antwortmetadaten von `[model-fetch]` (Provider, API, Modell, Status,
Latenz sowie Anfragefelder wie Methode, URL, Zeitüberschreitung, Proxy und Richtlinie)
werden unabhängig von `OPENCLAW_DEBUG_MODEL_TRANSPORT` stets auf der Stufe `info`
protokolliert, sodass grundlegende Informationen zum Modelltransport
ohne Debug-Flags sichtbar sind.

### Ablaufverfolgungskorrelation

Dateiprotokolle verwenden JSONL. Wenn ein Protokollaufruf einen gültigen Diagnose-Ablaufverfolgungskontext enthält,
schreibt OpenClaw die Ablaufverfolgungsfelder als JSON-Schlüssel auf oberster Ebene (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), damit externe Protokollverarbeiter die Zeile
mit OTEL-Spans und der Weitergabe von Provider-`traceparent` korrelieren können.

Gateway-HTTP-Anfragen und Gateway-WebSocket-Frames erstellen einen internen
Ablaufverfolgungsbereich für die Anfrage. Protokolle und Diagnoseereignisse, die innerhalb dieses asynchronen Bereichs ausgegeben werden, übernehmen
die Anfrageablaufverfolgung, wenn sie keinen ausdrücklichen Ablaufverfolgungskontext übergeben. Ablaufverfolgungen von Agentenläufen und
Modellaufrufen werden zu untergeordneten Elementen der aktiven Anfrageablaufverfolgung, sodass lokale Protokolle,
Diagnosemomentaufnahmen, OTEL-Spans und vertrauenswürdige Provider-`traceparent`-Header
über `traceId` verknüpft werden können, ohne rohe Anfrage- oder Modellinhalte zu protokollieren.

Lebenszyklus-Protokolldatensätze von Talk werden ebenfalls in den diagnostics-otel-Protokollexport übernommen, wenn
der OpenTelemetry-Protokollexport aktiviert ist, und verwenden dieselben begrenzten Attribute wie Dateiprotokolle.
Konfigurieren Sie `diagnostics.otel.logsExporter`, um OTLP, stdout-JSONL oder
beide Ziele auszuwählen.

### Größe und Zeitmessung von Modellaufrufen

Diagnoseinformationen zu Modellaufrufen erfassen begrenzte Anfrage-/Antwortmesswerte, ohne
rohe Inhalte von Eingabeaufforderungen oder Antworten zu erfassen:

- `requestPayloadBytes`: UTF-8-Bytegröße der endgültigen Nutzdaten der Modellanfrage
- `responseStreamBytes`: UTF-8-Bytegröße der gestreamten Nutzdatenblöcke der Modellantwort.
  Häufige Text-, Denk- und Werkzeugaufruf-Delta-Ereignisse zählen
  nur die inkrementellen `delta`-Bytes statt vollständiger `partial`-Momentaufnahmen.
- `timeToFirstByteMs`: verstrichene Zeit bis zum ersten gestreamten Antwortereignis
- `durationMs`: Gesamtdauer des Modellaufrufs

Diese Felder stehen Diagnosemomentaufnahmen, Plugin-Hooks für Modellaufrufe sowie
OTEL-Spans/-Metriken für Modellaufrufe zur Verfügung, wenn der Diagnoseexport aktiviert ist.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: benutzerfreundlich, farbig und mit Zeitstempeln.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Protokollverarbeiter).

### Redigierung

OpenClaw kann sensible Token redigieren, bevor sie in der Konsolenausgabe, in Dateiprotokollen,
OTLP-Protokolldatensätzen, im gespeicherten Text von Sitzungstranskripten oder in Werkzeug-
Ereignisnutzdaten der Steuerungsoberfläche erscheinen (Werkzeugstartargumente, partielle/endgültige Ergebnisnutzdaten, abgeleitete
exec-Ausgabe und Patch-Zusammenfassungen):

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Liste von Regex-Zeichenfolgen, die den Standardsatz für die Protokoll-/Transkriptausgabe ersetzt. Für Werkzeugnutzdaten der Steuerungsoberfläche werden benutzerdefinierte Muster zusätzlich zu den integrierten Standardmustern angewendet, sodass das Hinzufügen eines Musters die Redigierung von Werten, die bereits von den Standardmustern erfasst werden, niemals abschwächt.

Dateiprotokolle und Sitzungstranskripte bleiben im JSONL-Format, übereinstimmende geheime Werte werden jedoch
maskiert, bevor die Zeile oder Meldung auf den Datenträger geschrieben wird. Die Redigierung erfolgt nach bestem Bemühen:
Sie wird auf textbasierte Nachrichteninhalte und Protokollzeichenfolgen angewendet, nicht auf jedes
Bezeichner- oder Binärnutzdatenfeld.

Die integrierten Standardwerte decken gängige API-Anmeldedaten und Feldnamen für Zahlungsanmeldedaten ab, beispielsweise Kartennummer, CVC/CVV, gemeinsam verwendetes Zahlungstoken und Zahlungsanmeldedaten, wenn sie als JSON-Felder, URL-Parameter, CLI-Flags oder Zuweisungen vorkommen.

`logging.redactSensitive: "off"` deaktiviert nur diese allgemeine Richtlinie für Protokolle und Transkripte. OpenClaw schwärzt weiterhin Nutzdaten an Sicherheitsgrenzen, die UI-Clients, Support-Paketen, Diagnosebeobachtern, Genehmigungsaufforderungen oder Agentenwerkzeugen angezeigt werden können. Beispiele hierfür sind Werkzeugaufrufereignisse der Control UI, die Ausgabe von `sessions_history`, Diagnose-Support-Exporte, Beobachtungen von Provider-Fehlern, die Anzeige von Befehlen zur Ausführungsgenehmigung und Gateway-WebSocket-Protokolle. Benutzerdefinierte `logging.redactPatterns` können auf diesen Oberflächen weiterhin projektspezifische Muster hinzufügen.

## Diagnose und OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modellausführungen und die Telemetrie des Nachrichtenflusses (Webhooks, Warteschlangenbildung, Sitzungsstatus). Sie ersetzen **keine** Protokolle, sondern speisen Metriken, Ablaufverfolgungen und Exporteure. Ereignisse werden standardmäßig prozessintern ausgegeben (setzen Sie `diagnostics.enabled: false`, um sie zu deaktivieren); ihr Export wird separat konfiguriert.

Zwei benachbarte Bereiche:

- **OpenTelemetry-Export** — sendet Metriken, Ablaufverfolgungen und Protokolle über OTLP/HTTP an beliebige OpenTelemetry-kompatible Kollektoren oder Backends (Datadog, Grafana, Honeycomb, New Relic, Tempo usw.). Die vollständige Konfiguration, der Signalkatalog, die Namen von Metriken und Spans, Umgebungsvariablen und das Datenschutzmodell befinden sich auf einer eigenen Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnose-Flags** — gezielte Debug-Protokoll-Flags, die zusätzliche Protokolle an `logging.file` weiterleiten, ohne `logging.level` zu erhöhen. Bei den Flags wird nicht zwischen Groß- und Kleinschreibung unterschieden und sie unterstützen Platzhalter (`telegram.*`, `*`). Konfigurieren Sie sie unter `diagnostics.flags` oder über die Umgebungsvariablen-Überschreibung `OPENCLAW_DIAGNOSTICS=...`. Vollständige Anleitung:
  [Diagnose-Flags](/de/diagnostics/flags).

Informationen zum OTLP-Export an einen Kollektor finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).

## Tipps zur Fehlerbehebung

- **Gateway nicht erreichbar?** Führen Sie zuerst `openclaw doctor` aus.
- **Protokolle leer?** Prüfen Sie, ob der Gateway ausgeführt wird und in den unter `logging.file` angegebenen Dateipfad schreibt.
- **Benötigen Sie weitere Details?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandte Themen

- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP/HTTP-Export, Katalog der Metriken und Spans, Datenschutzmodell
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Protokoll-Flags
- [Interna der Gateway-Protokollierung](/de/gateway/logging) — WS-Protokollstile, Subsystempräfixe und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige Referenz der `diagnostics.*`-Felder
