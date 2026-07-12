---
read_when:
    - Sie möchten Metriken zur OpenClaw-Modellnutzung, zum Nachrichtenfluss oder zu Sitzungen an einen OpenTelemetry-Collector senden
    - Sie binden Traces, Metriken oder Protokolle an Grafana, Datadog, Honeycomb, New Relic, Tempo oder ein anderes OTLP-Backend an
    - Sie benötigen die genauen Metriknamen, Span-Namen oder Attributstrukturen, um Dashboards oder Warnmeldungen zu erstellen.
summary: OpenClaw-Diagnosedaten über das diagnostics-otel-Plugin an OpenTelemetry-Collectors oder als JSONL auf stdout exportieren
title: OpenTelemetry-Export
x-i18n:
    generated_at: "2026-07-12T15:21:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exportiert Diagnosedaten über das offizielle Plugin `diagnostics-otel`
mittels **OTLP/HTTP (protobuf)**. Protokolle können außerdem als JSONL über stdout für
Protokoll-Pipelines von Containern und Sandboxes ausgegeben werden. Jeder Collector oder jedes Backend, der bzw. das
OTLP/HTTP akzeptiert, funktioniert ohne Codeänderungen. Informationen zu lokalen Dateiprotokollen finden Sie unter
[Protokollierung](/de/logging).

- **Diagnoseereignisse** sind strukturierte, prozessinterne Datensätze, die vom
  Gateway und den mitgelieferten Plugins für Modellausführungen, Nachrichtenflüsse, Sitzungen, Warteschlangen
  und Befehlsausführungen ausgegeben werden.
- **`diagnostics-otel`** abonniert diese Ereignisse und exportiert sie als
  OpenTelemetry-**Metriken**, **Traces** und **Protokolle** über OTLP/HTTP und kann
  Protokolldatensätze als JSONL an stdout spiegeln.
- **Provider-Aufrufe** erhalten einen W3C-`traceparent`-Header aus dem Kontext
  des vertrauenswürdigen Modellaufruf-Spans von OpenClaw, wenn der Provider-Transport benutzerdefinierte
  Header akzeptiert. Von Plugins ausgegebener Trace-Kontext wird nicht weitergegeben.
- Exporter werden nur eingebunden, wenn sowohl die Diagnoseoberfläche als auch das Plugin
  aktiviert sind, sodass die prozessinternen Kosten standardmäßig nahezu null bleiben.

## Schnellstart

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Oder aktivieren Sie das Plugin über die CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` unterstützt nur `http/protobuf`. Da `traces` und `metrics` standardmäßig aktiviert sind, bricht jeder andere Wert (einschließlich `grpc`) das gesamte diagnostics-otel-Abonnement mit einer Warnung vom Typ `unsupported protocol` ab – dadurch wird auch der Export von Protokollen nach stdout beendet. Legen Sie `traces: false` und `metrics: false` explizit fest, wenn Sie nur `logsExporter: "stdout"` mit einem Nicht-OTLP-Protokollwert verwenden möchten.
</Note>

## Exportierte Signale

| Signal      | Enthaltene Daten                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metriken** | Zähler/Histogramme für Token-Nutzung, Kosten, Ausführungsdauer, Failover, Skills-Nutzung, Nachrichtenfluss, Talk-Ereignisse, Warteschlangenspuren, Sitzungsstatus/-wiederherstellung, Werkzeugausführung, exec, Speicher, Verfügbarkeit und Exporter-Zustand. |
| **Traces**  | Spans für Modellnutzung, Modellaufrufe, Harness-Lebenszyklus, Skills-Nutzung, Werkzeugausführung, exec, Webhook-/Nachrichtenverarbeitung, Kontextzusammenstellung und Werkzeugschleifen.                                                      |
| **Protokolle**    | Strukturierte `logging.file`-Datensätze, die über OTLP oder als stdout-JSONL exportiert werden, wenn `diagnostics.otel.logs` aktiviert ist; Protokollinhalte werden nicht ausgegeben, sofern die Inhaltserfassung nicht explizit aktiviert wurde.                          |

Schalten Sie `traces`, `metrics` und `logs` unabhängig voneinander um. Traces und Metriken
sind standardmäßig aktiviert, wenn `diagnostics.otel.enabled` auf true gesetzt ist; Protokolle sind standardmäßig deaktiviert
und werden nur exportiert, wenn `diagnostics.otel.logs` explizit auf `true` gesetzt ist. Der Protokollexport
verwendet standardmäßig OTLP; setzen Sie `diagnostics.otel.logsExporter` auf `stdout`, um JSONL über
stdout auszugeben, oder auf `both`, um beides zu verwenden.

## Konfigurationsreferenz

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc deaktiviert den OTLP-Export
      serviceName: "openclaw-gateway", // wenn nicht festgelegt, wird zunächst OTEL_SERVICE_NAME, dann "openclaw" verwendet
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // Sampler für Root-Spans, 0.0..1.0
      flushIntervalMs: 60000, // Intervall für den Metrikexport (mindestens 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### Umgebungsvariablen

| Variable                                                                                                          | Zweck                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Fallback für `diagnostics.otel.endpoint`, wenn der Konfigurationsschlüssel nicht festgelegt ist.                                                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signalspezifische Endpunkt-Fallbacks, die verwendet werden, wenn der entsprechende Konfigurationsschlüssel `diagnostics.otel.*Endpoint` nicht festgelegt ist. Die signalspezifische Konfiguration hat Vorrang vor der signalspezifischen Umgebungsvariable, die wiederum Vorrang vor dem gemeinsamen Endpunkt hat.                                                            |
| `OTEL_SERVICE_NAME`                                                                                               | Fallback für `diagnostics.otel.serviceName`, wenn der Konfigurationsschlüssel nicht festgelegt ist. Der standardmäßige Dienstname ist `openclaw`.                                                                                                                                                                                                                        |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Fallback für das Übertragungsprotokoll, wenn `diagnostics.otel.protocol` nicht festgelegt ist. Nur `http/protobuf` aktiviert den Export.                                                                                                                                                                                                                                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Auf `gen_ai_latest_experimental` setzen, um die neueste Form von GenAI-Inferenz-Spans auszugeben: Span-Namen `{gen_ai.operation.name} {gen_ai.request.model}`, Span-Art `CLIENT` und `gen_ai.provider.name` anstelle des veralteten `gen_ai.system`. GenAI-Metriken verwenden unabhängig davon stets begrenzte Attribute mit niedriger Kardinalität.                              |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Auf `1` setzen, wenn ein anderer Preload- oder Hostprozess bereits das globale OpenTelemetry SDK registriert hat. Das Plugin überspringt dann seinen eigenen NodeSDK-Lebenszyklus, bindet jedoch weiterhin Diagnose-Listener ein und berücksichtigt `traces`/`metrics`/`logs`.                                                                                                  |

## Datenschutz und Inhaltserfassung

Unverarbeitete Modell-/Tool-Inhalte werden standardmäßig **nicht** exportiert. Spans enthalten begrenzte
Bezeichner (Kanal, Provider, Modell, Fehlerkategorie, ausschließlich gehashte Anfrage-IDs,
Tool-Quelle, Tool-Eigentümer, Skill-Name/-Quelle) und niemals Prompt-Text,
Antworttext, Tool-Eingaben, Tool-Ausgaben, Skill-Dateipfade oder Sitzungsschlüssel.
Werte, die wie bereichsgebundene Agent-Sitzungsschlüssel aussehen (beispielsweise mit
`agent:` beginnen), werden bei Attributen mit niedriger Kardinalität durch `unknown` ersetzt. OTLP-Log-
Datensätze behalten standardmäßig Schweregrad, Logger, Codeposition, vertrauenswürdigen Trace-Kontext und
bereinigte Attribute bei; der unverarbeitete Nachrichtentext des Logs wird nur exportiert,
wenn `diagnostics.otel.captureContent` den booleschen Wert `true` hat. Granulare
`captureContent.*`-Unterschlüssel aktivieren niemals Log-Nachrichtentexte. Talk-Metriken exportieren nur
begrenzte Ereignismetadaten (Modus, Transport, Provider, Ereignistyp) – keine
Transkripte, Audio-Nutzdaten, Sitzungs-IDs, Turn-IDs, Anruf-IDs, Raum-IDs oder
Übergabe-Token.

Ausgehende Modellanfragen können einen W3C-Header `traceparent` enthalten, der ausschließlich
aus dem OpenClaw-eigenen Diagnose-Trace-Kontext für den aktiven Modellaufruf erzeugt wird.
Bereits vorhandene, vom Aufrufer bereitgestellte `traceparent`-Header werden ersetzt, sodass Plugins oder
benutzerdefinierte Provider-Optionen keine dienstübergreifende Trace-Abstammung vortäuschen können.

Setzen Sie `diagnostics.otel.captureContent.*` nur dann auf `true`, wenn Ihr Collector
und Ihre Aufbewahrungsrichtlinie für Prompt-, Antwort-, Tool- oder
System-Prompt-Text genehmigt sind. Jeder Unterschlüssel ist unabhängig:

- `inputMessages` – Inhalt des Benutzer-Prompts.
- `outputMessages` – Inhalt der Modellantwort.
- `toolInputs` – Nutzdaten der Tool-Argumente.
- `toolOutputs` – Nutzdaten der Tool-Ergebnisse.
- `systemPrompt` – zusammengesetzter System-/Entwickler-Prompt.
- `toolDefinitions` – Namen, Beschreibungen und Schemas der Modell-Tools.

Wenn ein Unterschlüssel aktiviert ist, erhalten Modell- und Tool-Spans ausschließlich für diese Klasse begrenzte, redigierte
`openclaw.content.*`-Attribute.

<Note>
Der boolesche Wert `captureContent: true` aktiviert `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` und OTLP-Log-Nachrichtentexte gemeinsam, jedoch **nicht** `systemPrompt` – setzen Sie `captureContent.systemPrompt: true` ausdrücklich, wenn Sie zusätzlich den zusammengesetzten System-Prompt benötigen.
</Note>

Der Inhalt von `toolInputs`/`toolOutputs` wird für Tool-Ausführungen der integrierten Agent-
Runtime erfasst (`openclaw.content.tool_input` und
`gen_ai.tool.call.arguments` bei abgeschlossenen/fehlerhaften Spans;
`openclaw.content.tool_output` und `gen_ai.tool.call.result` bei abgeschlossenen
Spans). Die Namen `openclaw.content.*` bleiben die stabilen OpenClaw-Attributnamen;
die Kopien `gen_ai.tool.call.*` spiegeln sie für Semconv-native Anzeigeprogramme.
Tool-Aufrufe externer Harnesses (Codex, Claude CLI) geben
`tool.execution.*`-Spans ohne Inhaltsnutzdaten aus. Erfasste Inhalte werden über einen
vertrauenswürdigen, ausschließlich für Listener bestimmten Kanal übertragen und niemals auf dem öffentlichen Diagnoseereignis-
Bus veröffentlicht.

## Sampling und Flush-Vorgänge

- **Traces:** `diagnostics.otel.sampleRate` legt einen `TraceIdRatioBasedSampler`
  nur für den Root-Span fest (`0.0` verwirft alle, `1.0` behält alle). Ist die
  Option nicht gesetzt, wird der Standard des OpenTelemetry SDK verwendet
  (immer aktiviert).
- **Metriken:** `diagnostics.otel.flushIntervalMs` (auf mindestens
  `1000` begrenzt); ist die Option nicht gesetzt, wird der Standard des SDK
  für den periodischen Export verwendet.
- **Protokolle:** OTLP-Protokolle berücksichtigen `logging.level`
  (Dateiprotokollstufe) und verwenden den diagnostischen Pfad zur Schwärzung
  von Protokolldatensätzen, nicht die Konsolenformatierung. Installationen mit
  hohem Datenaufkommen sollten Sampling/Filterung im OTLP-Collector gegenüber
  lokalem Sampling bevorzugen. Legen Sie
  `diagnostics.otel.logsExporter: "stdout"` fest, wenn Ihre Plattform
  stdout/stderr bereits an einen Protokollprozessor weiterleitet und Sie
  keinen OTLP-Protokoll-Collector verwenden. stdout-Datensätze bestehen aus
  einem JSON-Objekt pro Zeile mit `ts`, `signal`, `service.name`,
  Schweregrad, Inhalt, geschwärzten Attributen und, sofern verfügbar,
  vertrauenswürdigen Trace-Feldern.
- **Dateiprotollkorrelation:** JSONL-Dateiprotokolle enthalten auf oberster
  Ebene `traceId`, `spanId`, `parentSpanId` und `traceFlags`, wenn der
  Protokollaufruf einen gültigen diagnostischen Trace-Kontext enthält. Dadurch
  können Protokollprozessoren lokale Protokollzeilen mit exportierten Spans
  verknüpfen.
- **Anforderungskorrelation:** Gateway-HTTP-Anforderungen und
  WebSocket-Frames erzeugen einen internen Anforderungs-Trace-Bereich.
  Protokolle und Diagnoseereignisse innerhalb dieses Bereichs übernehmen
  standardmäßig den Anforderungs-Trace, während Spans für Agent-Ausführungen
  und Modellaufrufe als untergeordnete Spans erzeugt werden, sodass
  `traceparent`-Header des Providers im selben Trace verbleiben.
- **Modellaufrufkorrelation:** `openclaw.model.call`-Spans enthalten
  standardmäßig sichere Größenangaben für Prompt-Komponenten sowie
  Token-Attribute je Aufruf, wenn das Provider-Ergebnis Nutzungsdaten
  bereitstellt. `openclaw.model.usage` bleibt der Span für die
  ausführungsbezogene Abrechnung aggregierter Kosten sowie für Kontext- und
  Kanal-Dashboards und verbleibt im selben diagnostischen Trace, wenn die
  ausgebende Runtime über einen vertrauenswürdigen Trace-Kontext verfügt.

## Exportierte Metriken

### Modellnutzung

- `openclaw.tokens` (Zähler, Attribute: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (Zähler, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (Histogramm, Attribute: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (Histogramm, Metrik gemäß den semantischen GenAI-Konventionen, Attribute: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (Histogramm, Sekunden, Metrik gemäß den semantischen GenAI-Konventionen, Attribute: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (Histogramm, Attribute: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, bei klassifizierten Fehlern zusätzlich `openclaw.errorCategory` und `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (Histogramm, UTF-8-Bytegröße der endgültigen Nutzlast der Modellanforderung; keine unbereinigten Nutzlastinhalte)
- `openclaw.model_call.response_bytes` (Histogramm, UTF-8-Bytegröße der Nutzlasten gestreamter Antwortblöcke; hochfrequente Text-, Denk- und Tool-Aufruf-Deltas zählen nur inkrementelle `delta`-Bytes; keine unbereinigten Antwortinhalte)
- `openclaw.model_call.time_to_first_byte_ms` (Histogramm, verstrichene Zeit bis zum ersten gestreamten Antwortereignis)
- `openclaw.model.failover` (Zähler, Attribute: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (Zähler, Attribute: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, optional `openclaw.agent`, optional `openclaw.toolName`)

### Nachrichtenfluss

- `openclaw.webhook.received` (Zähler, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (Zähler, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (Zähler, Attribute: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (Zähler, Attribute: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (Zähler, Attribute: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (Zähler, Attribute: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (Zähler, Attribute: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (Zähler, Attribute: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (Zähler, Attribute: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (Histogramm, dieselben Attribute wie `openclaw.talk.event`; wird ausgegeben, wenn ein Talk-Ereignis eine Dauer meldet)
- `openclaw.talk.audio.bytes` (Histogramm, dieselben Attribute wie `openclaw.talk.event`; wird für Talk-Audioframe-Ereignisse ausgegeben, die eine Bytelänge melden)

### Warteschlangen und Sitzungen

- `openclaw.queue.lane.enqueue` (Zähler, Attribute: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (Zähler, Attribute: `openclaw.lane`)
- `openclaw.queue.depth` (Histogramm, Attribute: `openclaw.lane` oder `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (Histogramm, Attribute: `openclaw.lane`)
- `openclaw.session.state` (Zähler, Attribute: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (Zähler, Attribute: `openclaw.state`; wird für wiederherstellbare veraltete Sitzungsverwaltungsdaten ausgegeben)
- `openclaw.session.stuck_age_ms` (Histogramm, Attribute: `openclaw.state`; wird für wiederherstellbare veraltete Sitzungsverwaltungsdaten ausgegeben)
- `openclaw.session.turn.created` (Zähler, Attribute: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (Zähler, Attribute: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (Zähler, Attribute: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (Histogramm, dieselben Attribute wie der entsprechende Wiederherstellungszähler)
- `openclaw.run.attempt` (Zähler, Attribute: `openclaw.attempt`)

### Telemetrie zur Sitzungsaktivität

`diagnostics.stuckSessionWarnMs` ist der Schwellenwert für das Alter ohne
Fortschritt bei der Diagnose der Sitzungsaktivität. Eine `processing`-Sitzung
altert nicht in Richtung dieses Schwellenwerts, solange OpenClaw Fortschritt
bei Antworten, Tools, Status, Blockierung oder der ACP-Runtime erkennt.
Keepalives für die Tippanzeige zählen nicht als Fortschritt, sodass ein
stilles Modell oder Harness weiterhin erkannt werden kann.

OpenClaw klassifiziert Sitzungen anhand der Arbeit, die es weiterhin
beobachten kann:

- `session.long_running`: Aktive eingebettete Arbeit, Modellaufrufe oder Tool-Aufrufe
  machen weiterhin Fortschritte. Zugeordnete Modellaufrufe, die über
  `diagnostics.stuckSessionWarnMs` hinaus keine Ausgabe liefern, werden vor
  `diagnostics.stuckSessionAbortMs` ebenfalls als lang laufend gemeldet, damit
  langsame oder nicht streamende Modell-Provider nicht wie festgefahrene
  Gateway-Sitzungen erscheinen, solange ein Abbruch beobachtbar ist.
- `session.stalled`: Aktive Arbeit ist vorhanden, aber der aktive Lauf hat
  in letzter Zeit keinen Fortschritt gemeldet. Zugeordnete Modellaufrufe
  wechseln bei oder nach `diagnostics.stuckSessionAbortMs` von
  `session.long_running` zu `session.stalled`; veraltete Modell-/Tool-Aktivität
  ohne Besitzer wird nicht als harmlose lang laufende Arbeit behandelt.
  Festgefahrene eingebettete Läufe werden zunächst nur beobachtet und gehen
  dann nach `diagnostics.stuckSessionAbortMs` ohne Fortschritt in die
  Abbruch-Abarbeitung über, damit dahinter in der Lane eingereihte Turns
  fortgesetzt werden können. Wenn nicht festgelegt, verwendet der
  Abbruchschwellenwert standardmäßig das sicherere erweiterte Zeitfenster von
  mindestens 5 Minuten und dem Dreifachen von
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: Veraltete Sitzungsverwaltung ohne aktive Arbeit oder eine
  inaktive eingereihte Sitzung mit veralteter Modell-/Tool-Aktivität ohne
  Besitzer. Dadurch wird die betroffene Sitzungs-Lane unmittelbar freigegeben,
  nachdem die Wiederherstellungsprüfungen bestanden wurden.

Die Wiederherstellung gibt strukturierte Ereignisse vom Typ
`session.recovery.requested` und `session.recovery.completed` aus. Der
diagnostische Sitzungsstatus wird erst nach einem verändernden
Wiederherstellungsergebnis (`aborted` oder `released`) und nur dann als inaktiv
markiert, wenn dieselbe Verarbeitungsgeneration noch aktuell ist.

Nur `session.stuck` gibt den Zähler `openclaw.session.stuck`, das Histogramm
`openclaw.session.stuck_age_ms` und den Span `openclaw.session.stuck` aus.
Wiederholte `session.stuck`-Diagnosen werden mit zunehmenden Abständen
ausgegeben, solange die Sitzung unverändert bleibt. Daher sollten Dashboards
bei anhaltenden Anstiegen und nicht bei jedem Heartbeat-Tick alarmieren.
Informationen zur Konfigurationsoption und zu den Standardwerten finden Sie in
der [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics).

Liveness-Warnungen geben außerdem Folgendes aus:

- `openclaw.liveness.warning` (Zähler, Attribute: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (Histogramm, Attribute: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (Histogramm, Attribute: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (Histogramm, Attribute: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (Histogramm, Attribute: `openclaw.liveness.reason`)

### Harness-Lebenszyklus

- `openclaw.harness.duration_ms` (Histogramm, Attribute: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, bei Fehlern `openclaw.harness.phase`)

### Tool-Ausführung und Schleifenerkennung

- `openclaw.tool.execution.duration_ms` (Histogramm, Attribute: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, bei Fehlern zusätzlich `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked` (Zähler, Attribute: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (Zähler, Attribute: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, optional `openclaw.loop.paired_tool`; wird ausgegeben, wenn eine sich wiederholende Tool-Aufrufschleife erkannt wird)

### Exec

- `openclaw.exec.duration_ms` (Histogramm, Attribute: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnoseinternas (Arbeitsspeicher, Payloads, Exporter-Zustand)

- `openclaw.payload.large` (Zähler, Attribute: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (Histogramm, Attribute: wie bei `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (Histogramme, keine Attribute; Stichproben des Prozessarbeitsspeichers)
- `openclaw.memory.pressure` (Zähler, Attribute: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (Zähler, Attribute: `openclaw.diagnostic.async_queue.drop_class`; durch Gegendruck verursachte verworfene Einträge in der internen Diagnosewarteschlange)
- `openclaw.telemetry.exporter.events` (Zähler, Attribute: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, optional `openclaw.reason`, optional `openclaw.errorCategory`; Selbsttelemetrie zu Lebenszyklus und Fehlern des Exporters)

## Exportierte Spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - standardmäßig `gen_ai.system` oder `gen_ai.provider.name`, wenn die neuesten semantischen GenAI-Konventionen aktiviert sind
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - standardmäßig `gen_ai.system` oder `gen_ai.provider.name`, wenn die neuesten semantischen GenAI-Konventionen aktiviert sind
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` und bei Fehlern optional `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (nur unbedenkliche Komponentengrößen, kein Prompt-Text)
  - `openclaw.model_call.usage.*` und `gen_ai.usage.*`, wenn das Ergebnis des Modellaufrufs Nutzungsdaten des Providers für diesen einzelnen Aufruf enthält
  - Span-Ereignis `openclaw.provider.request` mit dem Attribut `openclaw.upstreamRequestIdHash` (begrenzt, hashbasiert), wenn das Ergebnis des vorgelagerten Providers eine Anfrage-ID bereitstellt; unverarbeitete IDs werden niemals exportiert
  - Mit `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` verwenden Modellaufruf-Spans den neuesten GenAI-Inferenz-Span-Namen `{gen_ai.operation.name} {gen_ai.request.model}` und den Span-Typ `CLIENT` anstelle von `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Bei Abschluss: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Bei einem Fehler: `openclaw.harness.phase`, `openclaw.errorCategory`, optional `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, optional `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Bei Fehlern optional `openclaw.errorCategory`/`openclaw.errorCode`; `openclaw.deniedReason` und `openclaw.outcome=blocked`, wenn die Ausführung durch Richtlinien oder die Sandbox verweigert wird
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (keine Inhalte von Prompt, Verlauf, Antwort oder Sitzungsschlüssel)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, optional `openclaw.loop.paired_tool` (keine Schleifennachrichten, Parameter oder Tool-Ausgaben)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, optional `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

Wenn die Inhaltserfassung ausdrücklich aktiviert ist, können Modell- und Tool-Spans außerdem begrenzte, redigierte `openclaw.content.*`-Attribute für die spezifischen Inhaltsklassen enthalten, die Sie aktiviert haben.

## Katalog der Diagnoseereignisse

Die folgenden Ereignisse bilden die Grundlage für die oben genannten Metriken und Spans. Plugins können diese auch direkt abonnieren, ohne sie per OTLP zu exportieren.

**Modellnutzung**

- `model.usage` – Token, Kosten, Dauer, Kontext, Provider/Modell/Kanal und Sitzungs-IDs. `usage` ist die Abrechnung des Providers bzw. Durchlaufs für Kosten und Telemetrie; `context.used` ist die aktuelle Momentaufnahme von Prompt und Kontext und kann niedriger als `usage.total` des Providers sein, wenn zwischengespeicherte Eingaben oder Aufrufe innerhalb von Tool-Schleifen beteiligt sind.

**Nachrichtenfluss**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Warteschlange und Sitzung**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (aggregierte Zähler: Webhooks/Warteschlange/Sitzung)

**Harness-Lebenszyklus**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` – Lebenszyklus jedes einzelnen Durchlaufs des Agent-Harness. Enthält `harnessId`, optional `pluginId`, Provider/Modell/Kanal und die Durchlauf-ID. Bei Abschluss werden `durationMs`, `outcome`, optional `resultClassification`, `yieldDetected` und Zähler für `itemLifecycle` hinzugefügt. Bei Fehlern werden `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` und optional `cleanupFailed` hinzugefügt.

**Exec**

- `exec.process.completed` – Terminalergebnis, Dauer, Ziel, Modus, Exit-Code und Fehlerart. Befehlstext und Arbeitsverzeichnisse sind nicht enthalten.
- `exec.approval.followup_suppressed` – Eine veraltete Genehmigungsnachverfolgung, die nach der erneuten Bindung einer Sitzung verworfen wurde. Enthält `approvalId`, `reason` (`session_rebound`), `phase` (`direct_delivery` oder `gateway_preflight`) und den Zeitstempel des Dispatchers. Sitzungsschlüssel, Routen und Befehlstext sind nicht enthalten.

## Ohne Exporter

Halten Sie Diagnoseereignisse für Plugins oder benutzerdefinierte Senken verfügbar, ohne `diagnostics-otel` auszuführen:

```json5
{
  diagnostics: { enabled: true },
}
```

Verwenden Sie für gezielte Debug-Ausgaben Diagnose-Flags, ohne `logging.level` zu erhöhen. Bei Flags wird nicht zwischen Groß- und Kleinschreibung unterschieden und Platzhalter werden unterstützt (`telegram.*` oder `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Alternativ als einmalige Umgebungsüberschreibung:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Die Flag-Ausgabe wird in die Standardprotokolldatei (`logging.file`) geschrieben und weiterhin durch `logging.redactSensitive` redigiert. Vollständige Anleitung:
[Diagnose-Flags](/de/diagnostics/flags).

## Deaktivieren

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Alternativ können Sie `diagnostics-otel` aus `plugins.allow` weglassen oder `openclaw plugins disable diagnostics-otel` ausführen.

## Verwandte Themen

- [Protokollierung](/de/logging) – Dateiprotokolle, Konsolenausgabe, CLI-Liveanzeige und die Registerkarte „Logs“ der Control UI
- [Interna der Gateway-Protokollierung](/de/gateway/logging) – WS-Protokollstile, Subsystempräfixe und Konsolenerfassung
- [Diagnose-Flags](/de/diagnostics/flags) – gezielte Flags für Debug-Protokolle
- [Diagnoseexport](/de/gateway/diagnostics) – Tool für Support-Pakete für Betreiber (getrennt vom OTEL-Export)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) – vollständige Referenz der `diagnostics.*`-Felder
