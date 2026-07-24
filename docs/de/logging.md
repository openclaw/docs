---
read_when:
    - Sie benötigen einen einsteigerfreundlichen Überblick über die Protokollierung in OpenClaw
    - Sie möchten Protokollierungsstufen, Formate oder Schwärzung konfigurieren
    - Sie führen eine Fehlerbehebung durch und müssen schnell Protokolle finden
summary: Dateiprotokolle, Konsolenausgabe, CLI-Live-Anzeige und die Registerkarte „Protokolle“ der Control UI
title: Protokollierung
x-i18n:
    generated_at: "2026-07-24T04:29:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c9303c4bc9c0797ca9c5775a281dce95229661b61d710425b2f7bec182b2e75
    source_path: logging.md
    workflow: 16
---

OpenClaw verfügt über zwei zentrale Protokollierungsoberflächen:

- **Dateiprotokolle** (JSON-Zeilen), die vom Gateway geschrieben werden.
- **Konsolenausgabe** im Terminal, in dem das Gateway ausgeführt wird.

Der Tab **Protokolle** der Control UI verfolgt das Gateway-Dateiprotokoll fortlaufend. Auf dieser Seite wird erläutert, wo sich
Protokolle befinden, wie sie gelesen werden und wie Protokollstufen und -formate konfiguriert werden.

## Speicherort der Protokolle

Standardmäßig schreibt das Gateway pro Tag eine fortlaufende Protokolldatei. Das Standardprofil
behält den bisherigen Pfad bei:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Benannte Profile verwenden im selben Verzeichnis einen durch das Profil qualifizierten Dateinamen:

`/tmp/openclaw/openclaw-<profile>-YYYY-MM-DD.log`

Das Profilsegment des Dateinamens besteht aus Kleinbuchstaben und ist auf Buchstaben, Zahlen und
Bindestriche beschränkt. Einfache kleingeschriebene Namen bleiben lesbar, sodass die Kurzform `--dev`
in `openclaw-dev-YYYY-MM-DD.log` schreibt. Groß-/Kleinschreibung, Unterstriche und literale Bindestriche verwenden eine
umkehrbare Bindestrich-Escapesequenz, damit unterschiedliche Profilnamen niemals dieselbe Protokolldatei verwenden.
Übergroße Werte, die direkt über die Umgebung festgelegt werden, erhalten ein begrenztes Hash-Suffix,
um die Dateinamensbeschränkungen des Dateisystems einzuhalten. Eine explizite Angabe von `logging.file` überschreibt
diese Standardwerte.

Das Datum verwendet die lokale Zeitzone des Gateway-Hosts. Wenn `/tmp/openclaw` unsicher
oder nicht verfügbar ist (und unter Windows grundsätzlich), verwendet OpenClaw stattdessen ein benutzerspezifisches
Verzeichnis `openclaw-<uid>` unter dem temporären Verzeichnis des Betriebssystems. Datierte Protokolldateien werden
nach 24 Stunden bereinigt.

Jede Datei wird rotiert, wenn der nächste Schreibvorgang `logging.maxFileBytes`
überschreiten würde (Standard: 100 MB). OpenClaw behält neben der
aktiven Datei bis zu fünf nummerierte Archive bei, etwa `openclaw-YYYY-MM-DD.1.log` oder
`openclaw-dev-YYYY-MM-DD.1.log`, und schreibt in eine neue aktive Protokolldatei weiter,
anstatt Diagnoseinformationen zu unterdrücken.

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
openclaw --dev logs --follow
openclaw --profile work logs --follow
```

Die Profilauswahl auf Stammebene löst dieselbe profilspezifische Datei auf, die vom
Gateway verwendet wird, einschließlich CLI-Fallback-Lesevorgängen, wenn lokales RPC nicht verfügbar ist.

Optionen:

| Flag                | Standard | Verhalten                                                                             |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | aus      | Verfolgung fortsetzen; stellt bei Trennung mit Backoff erneut eine Verbindung her     |
| `--limit <n>`       | `200`    | Maximale Zeilenanzahl pro Abruf                                                       |
| `--max-bytes <n>`   | `250000` | Maximale Anzahl zu lesender Bytes pro Abruf                                           |
| `--interval <ms>`   | `1000`   | Abfrageintervall während der Verfolgung                                               |
| `--json`            | aus      | Zeilenbegrenztes JSON (ein Ereignis pro Zeile)                                        |
| `--plain`           | aus      | Erzwingt Klartext in TTY-Sitzungen                                                    |
| `--no-color`        | —        | Deaktiviert ANSI-Farben                                                              |
| `--utc`             | aus      | Stellt Zeitstempel in UTC dar (Standard ist die lokale Zeit)                          |
| `--local-time`      | aus      | Akzeptierte Kompatibilitätsschreibweise für die lokale Zeit als Standard; keine darüber hinausgehende Wirkung |
| `--url` / `--token` | —        | Standardmäßige Gateway-RPC-Flags                                                      |
| `--timeout <ms>`    | `30000`  | Gateway-RPC-Zeitüberschreitung                                                        |
| `--expect-final`    | aus      | Flag zum Warten auf die endgültige Antwort bei agentengestütztem RPC (wird hier über die gemeinsame Client-Schicht akzeptiert) |

Ausgabemodi:

- **TTY-Sitzungen**: übersichtliche, farbige, strukturierte Protokollzeilen.
- **Nicht-TTY-Sitzungen**: Klartext.

Wenn Sie eine explizite Angabe für `--url` übergeben, wendet die CLI Konfigurations- oder
Umgebungszugangsdaten nicht automatisch an. Geben Sie `--token` selbst an, andernfalls schlägt der Aufruf mit
`gateway url override requires explicit credentials` fehl.

Im JSON-Modus gibt die CLI mit `type` gekennzeichnete Objekte aus:

- `meta`: Stream-Metadaten (Datei, Quelle, Quellenart, Dienst, Cursor, Größe)
- `log`: analysierter Protokolleintrag
- `notice`: Hinweise auf Abschneiden/Rotation
- `raw`: nicht analysierte Protokollzeile
- `error`: Gateway-Verbindungsfehler (werden nach stderr geschrieben)

Wenn das implizite lokale Loopback-Gateway eine Kopplung anfordert, während des Verbindungsaufbaus
geschlossen wird oder eine Zeitüberschreitung auftritt, bevor `logs.tail` antwortet, greift `openclaw logs`
automatisch auf das konfigurierte Gateway-Dateiprotokoll zurück. Explizite Ziele für `--url` verwenden
dieses Fallback nicht. `openclaw logs --follow` ist strenger: Unter Linux verwendet es, sofern verfügbar, das aktive
user-systemd-Gateway-Journal anhand der PID und versucht andernfalls mit Backoff erneut, eine Verbindung zum
aktiven Gateway herzustellen, anstatt einer möglicherweise veralteten parallel vorhandenen
Datei zu folgen.

Wenn das Gateway nicht erreichbar ist, gibt die CLI einen kurzen Hinweis aus, folgenden Befehl auszuführen:

```bash
openclaw doctor
```

### Control UI (Web)

Der Tab **Protokolle** der Control UI verfolgt dieselbe Datei mithilfe von `logs.tail`.
Unter [Control UI](/de/web/control-ui) erfahren Sie, wie sie geöffnet wird.

### Nur kanalbezogene Protokolle

Verwenden Sie Folgendes, um Kanalaktivitäten (WhatsApp/Telegram/usw.) zu filtern:

```bash
openclaw channels logs --channel whatsapp
```

`--channel` verwendet standardmäßig `all`; `--lines <n>` (Standard: 200) und `--json` sind ebenfalls
verfügbar.

## Protokollformate

### Dateiprotokolle (JSONL)

Jede Zeile der Protokolldatei ist ein JSON-Objekt. Die CLI und Control UI analysieren diese
Einträge, um eine strukturierte Ausgabe darzustellen (Zeit, Stufe, Subsystem, Nachricht).

JSONL-Datensätze des Dateiprotokolls enthalten, sofern verfügbar, auch maschinell filterbare
Felder auf oberster Ebene:

- `hostname`: Hostname des Gateways.
- `message`: vereinfachter Protokollnachrichtentext für die Volltextsuche.
- `agent_id`: aktive Agent-ID, wenn der Protokollaufruf einen Agentenkontext enthält.
- `session_id`: aktive Sitzungs-ID bzw. aktiver Sitzungsschlüssel, wenn der Protokollaufruf einen Sitzungskontext enthält.
- `channel`: aktiver Kanal, wenn der Protokollaufruf einen Kanalkontext enthält.

OpenClaw behält die ursprünglichen strukturierten Protokollargumente neben diesen Feldern bei,
damit bestehende Parser, die nummerierte tslog-Argumentschlüssel lesen, weiterhin funktionieren.

Talk-, Echtzeitsprach- und verwaltete Raumaktivitäten geben begrenzte Lebenszyklus-Protokolldatensätze
über dieselbe Dateiprotokoll-Pipeline aus. Diese Datensätze enthalten, sofern verfügbar, Ereignistyp,
Modus, Transport, Provider sowie Größen- und Zeitmessungen, lassen jedoch
Transkripttext, Audionutzdaten, Turn-IDs, Anruf-IDs und Provider-Element-IDs aus.

### Konsolenausgabe

Konsolenprotokolle sind **TTY-bewusst** und für eine gute Lesbarkeit formatiert:

- Subsystempräfixe (z. B. `gateway/channels/whatsapp`)
- Farbliche Kennzeichnung der Stufen (Info/Warnung/Fehler)
- Optionaler kompakter oder JSON-Modus

Die Konsolenformatierung wird durch `logging.consoleStyle` gesteuert.

### Gateway-WebSocket-Protokolle

`openclaw gateway` bietet außerdem eine WebSocket-Protokollierung für RPC-Datenverkehr:

- Normalmodus: nur relevante Ergebnisse (Fehler, Analysefehler, langsame Aufrufe)
- `--verbose`: gesamter Anfrage-/Antwortdatenverkehr
- `--ws-log auto|compact|full`: Auswahl des ausführlichen Darstellungsstils
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
    "file": "/path/to/openclaw.log",
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

Sie können beide über die Umgebungsvariable **`OPENCLAW_LOG_LEVEL`** überschreiben (z. B. `OPENCLAW_LOG_LEVEL=debug`). Die Umgebungsvariable hat Vorrang vor der Konfigurationsdatei, sodass Sie die Ausführlichkeit für einen einzelnen Durchlauf erhöhen können, ohne `openclaw.json` zu bearbeiten. Sie können auch die globale CLI-Option **`--log-level <level>`** übergeben (beispielsweise `openclaw --log-level debug gateway run`), die für diesen Befehl die Umgebungsvariable überschreibt.

`--verbose` wirkt sich nur auf die Konsolenausgabe und die Ausführlichkeit des WS-Protokolls aus; die
Stufen der Dateiprotokolle werden dadurch nicht geändert.

### Gezielte Diagnose des Modelltransports

Verwenden Sie beim Debuggen von Provider-Aufrufen gezielte Umgebungs-Flags, anstatt
alle Protokolle auf `debug` zu setzen:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Verfügbare Flags:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: gibt Anfragestart, Fetch-Antwort, SDK-
  Header, erstes Streaming-Ereignis, Stream-Abschluss und Transportfehler auf der
  Stufe `info` aus.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: nimmt eine begrenzte Zusammenfassung der Anfragenutzdaten
  in Modellanfrageprotokolle auf.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: nimmt alle modellseitigen Tool-Namen in
  die Nutzdatenzusammenfassung auf.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: nimmt einen redigierten, größenbegrenzten JSON-
  Schnappschuss der Nutzdaten auf. Verwenden Sie dies nur während des Debuggens; Geheimnisse werden redigiert,
  Prompts und Nachrichtentext können jedoch weiterhin enthalten sein.
- `OPENCLAW_DEBUG_SSE=events`: gibt Zeitmessungen für das erste Ereignis und den Stream-Abschluss aus.
- `OPENCLAW_DEBUG_SSE=peek`: gibt außerdem die ersten fünf redigierten SSE-Ereignis-
  Nutzdaten aus, jeweils größenbegrenzt.
- `OPENCLAW_DEBUG_CODE_MODE=1`: gibt Diagnoseinformationen zur Modelloberfläche im Code-Modus aus,
  einschließlich der Fälle, in denen native Provider-Tools ausgeblendet werden, weil der Code-Modus die
  Tool-Oberfläche besitzt.

Diese Flags protokollieren über die normale OpenClaw-Protokollierung, sodass `openclaw logs --follow`
und der Tab „Protokolle“ der Control UI sie anzeigen. Ohne die Flags bleiben dieselben Diagnoseinformationen
auf der Stufe `debug` verfügbar.

`[model-fetch]`-Start- und Antwortmetadaten (Provider, API, Modell, Status,
Latenz und Anfragefelder wie Methode, URL, Zeitüberschreitung, Proxy und Richtlinie)
werden unabhängig von `OPENCLAW_DEBUG_MODEL_TRANSPORT` immer auf der Stufe `info` ausgegeben,
sodass eine grundlegende Überprüfung des Modelltransports
ohne Debug-Flags möglich ist.

### Trace-Korrelation

Dateiprotokolle sind im JSONL-Format. Wenn ein Protokollaufruf einen gültigen Diagnose-Trace-Kontext enthält,
schreibt OpenClaw die Trace-Felder als JSON-Schlüssel auf oberster Ebene (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), damit externe Protokollprozessoren die Zeile
mit OTEL-Spans und der Provider-Weitergabe von `traceparent` korrelieren können.

Gateway-HTTP-Anfragen und Gateway-WebSocket-Frames richten einen internen Anfrage-
Trace-Bereich ein. Protokolle und Diagnoseereignisse, die innerhalb dieses asynchronen Bereichs ausgegeben werden, übernehmen
den Anfrage-Trace, wenn sie keinen expliziten Trace-Kontext übergeben. Traces von Agentenausführungen und
Modellaufrufen werden untergeordnete Elemente des aktiven Anfrage-Traces, sodass lokale Protokolle,
Diagnoseschnappschüsse, OTEL-Spans und vertrauenswürdige Provider-Header für `traceparent` über
`traceId` verknüpft werden können, ohne unverarbeitete Anfrage- oder Modellinhalte zu protokollieren.

Talk-Lebenszyklus-Protokolldatensätze werden auch in den diagnostics-otel-Protokollexport aufgenommen, wenn
der OpenTelemetry-Protokollexport aktiviert ist. Dabei werden dieselben begrenzten Attribute wie in Dateiprotokollen
verwendet. Konfigurieren Sie `diagnostics.otel.logsExporter`, um OTLP, stdout-JSONL oder
beide Senken auszuwählen.

### Größe und Zeitmessung von Modellaufrufen

Diagnoseinformationen zu Modellaufrufen erfassen begrenzte Anfrage-/Antwortmessungen, ohne
unverarbeitete Prompt- oder Antwortinhalte zu erfassen:

- `requestPayloadBytes`: UTF-8-Bytegröße der endgültigen Modellanfrage-Nutzlast
- `responseStreamBytes`: UTF-8-Bytegröße des gestreamten Modellantwort-Fragments
  Nutzlasten. Hochfrequente Text-, Denk- und Tool-Aufruf-Delta-Ereignisse zählen
  nur die inkrementellen `delta`-Bytes anstelle vollständiger `partial`-Momentaufnahmen.
- `timeToFirstByteMs`: verstrichene Zeit bis zum ersten gestreamten Antwortereignis
- `durationMs`: Gesamtdauer des Modellaufrufs

Diese Felder stehen Diagnose-Momentaufnahmen, Plugin-Hooks für Modellaufrufe und
OTEL-Spans/-Metriken für Modellaufrufe zur Verfügung, wenn der Diagnoseexport aktiviert ist.

### Konsolenstile

`logging.consoleStyle`:

- `pretty`: benutzerfreundlich, farbig und mit Zeitstempeln.
- `compact`: kompaktere Ausgabe (am besten für lange Sitzungen).
- `json`: JSON pro Zeile (für Log-Prozessoren).

### Schwärzung

OpenClaw kann sensible Token schwärzen, bevor sie in der Konsolenausgabe, in Dateiprotokollen,
in OTLP-Protokolldatensätzen, im Text persistierter Sitzungstranskripte oder in Tool-
Ereignisnutzlasten der Control UI erscheinen (Tool-Startargumente, partielle/endgültige Ergebnisnutzlasten, abgeleitete
Ausführungsausgaben und Patch-Zusammenfassungen):

- Die Schwärzung sensibler Werte ist immer aktiviert.
- `logging.redactPatterns`: Liste regulärer Ausdrücke als Zeichenfolgen, die den Standardsatz für die Log-/Transkriptausgabe ersetzt. Bei Tool-Nutzlasten der Control UI werden benutzerdefinierte Muster zusätzlich zu den integrierten Standardmustern angewendet, sodass das Hinzufügen eines Musters niemals die Schwärzung von Werten abschwächt, die bereits von den Standardmustern erfasst werden.

Dateiprotokolle und Sitzungstranskripte bleiben im JSONL-Format, übereinstimmende geheime Werte werden jedoch
maskiert, bevor die Zeile oder Nachricht auf den Datenträger geschrieben wird. Die Schwärzung erfolgt nach bestem Bemühen:
Sie gilt für texttragende Nachrichteninhalte und Log-Zeichenfolgen, nicht für jedes
Bezeichner- oder Binärnutzlastfeld.

Die integrierten Standardmuster decken gängige API-Anmeldedaten und Feldnamen für Zahlungsdaten
wie Kartennummer, CVC/CVV, gemeinsam verwendetes Zahlungs-Token und Zahlungsanmeldedaten ab,
wenn sie als JSON-Felder, URL-Parameter, CLI-Flags oder Zuweisungen erscheinen.

OpenClaw schwärzt außerdem Nutzlasten an Sicherheitsgrenzen, die UI-Clients, Support-
Paketen, Diagnosebeobachtern, Genehmigungsaufforderungen oder Agenten-Tools angezeigt werden. Benutzerdefinierte
`logging.redactPatterns` können diesen Oberflächen projektspezifische Muster hinzufügen.

## Diagnose und OpenTelemetry

Diagnosen sind strukturierte, maschinenlesbare Ereignisse für Modellläufe und
Nachrichtenfluss-Telemetrie (Webhooks, Warteschlangenbildung, Sitzungsstatus). Sie ersetzen **keine**
Protokolle, sondern speisen Metriken, Traces und Exporter. Ereignisse werden
standardmäßig prozessintern ausgegeben (setzen Sie `diagnostics.enabled: false`, um sie zu deaktivieren);
ihr Export wird separat konfiguriert.

Zwei benachbarte Oberflächen:

- **OpenTelemetry-Export** — Metriken, Traces und Protokolle per OTLP/HTTP an
  jeden OpenTelemetry-kompatiblen Collector oder jedes entsprechende Backend senden (Datadog, Grafana,
  Honeycomb, New Relic, Tempo usw.). Die vollständige Konfiguration, der Signalkatalog,
  Metrik-/Span-Namen, Umgebungsvariablen und das Datenschutzmodell befinden sich auf einer eigenen Seite:
  [OpenTelemetry-Export](/de/gateway/opentelemetry).
- **Diagnose-Flags** — gezielte Debug-Protokoll-Flags, die zusätzliche Protokolle an
  `logging.file` weiterleiten, ohne `logging.level` zu erhöhen. Bei Flags wird nicht zwischen Groß- und Kleinschreibung unterschieden;
  zudem unterstützen sie Platzhalter (`telegram.*`, `*`). Konfigurieren Sie sie unter `diagnostics.flags`
  oder über die Umgebungsüberschreibung `OPENCLAW_DIAGNOSTICS=...`. Vollständige Anleitung:
  [Diagnose-Flags](/de/diagnostics/flags).

Informationen zum OTLP-Export an einen Collector finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).

## Tipps zur Fehlerbehebung

- **Gateway nicht erreichbar?** Führen Sie zuerst `openclaw doctor` aus.
- **Protokolle leer?** Prüfen Sie, ob das Gateway ausgeführt wird und in den Dateipfad
  unter `logging.file` schreibt.
- **Benötigen Sie weitere Details?** Setzen Sie `logging.level` auf `debug` oder `trace` und versuchen Sie es erneut.

## Verwandte Themen

- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP/HTTP-Export, Metrik-/Span-Katalog, Datenschutzmodell
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Protokoll-Flags
- [Interna der Gateway-Protokollierung](/de/gateway/logging) — WS-Protokollstile, Subsystempräfixe und Konsolenerfassung
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige Referenz der `diagnostics.*`-Felder
