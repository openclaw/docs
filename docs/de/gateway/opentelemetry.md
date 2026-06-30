---
read_when:
    - Sie möchten OpenClaw-Modellnutzung, Nachrichtenfluss- oder Sitzungsmetriken an einen OpenTelemetry-Collector senden
    - Sie verbinden Traces, Metriken oder Logs mit Grafana, Datadog, Honeycomb, New Relic, Tempo oder einem anderen OTLP-Backend
    - Sie benötigen die exakten Metriknamen, Span-Namen oder Attributstrukturen, um Dashboards oder Warnungen zu erstellen
summary: Exportieren Sie OpenClaw-Diagnosen über das diagnostics-otel-Plugin an OpenTelemetry-Collectors oder als stdout-JSONL.
title: OpenTelemetry-Export
x-i18n:
    generated_at: "2026-06-30T13:59:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exportiert Diagnosedaten über das offizielle `diagnostics-otel`-Plugin
mit **OTLP/HTTP (protobuf)**. Logs können auch als stdout-JSONL für
Container- und Sandbox-Log-Pipelines geschrieben werden. Jeder Collector oder jedes Backend, das
OTLP/HTTP akzeptiert, funktioniert ohne Codeänderungen. Informationen zu lokalen Datei-Logs und wie Sie diese lesen,
finden Sie unter [Logging](/de/logging).

## Wie alles zusammenpasst

- **Diagnoseereignisse** sind strukturierte, prozessinterne Datensätze, die vom
  Gateway und gebündelten Plugins für Modellläufe, Nachrichtenfluss, Sitzungen, Warteschlangen
  und exec ausgegeben werden.
- Das **`diagnostics-otel`-Plugin** abonniert diese Ereignisse und exportiert sie als
  OpenTelemetry-**Metriken**, **Traces** und **Logs** über OTLP/HTTP. Es kann
  Diagnose-Log-Datensätze auch als stdout-JSONL spiegeln.
- **Provider-Aufrufe** erhalten von OpenClaws vertrauenswürdigem
  Modellaufruf-Span-Kontext einen W3C-`traceparent`-Header, wenn der Provider-Transport benutzerdefinierte
  Header akzeptiert. Von Plugins ausgegebener Trace-Kontext wird nicht weitergegeben.
- Exporter werden nur angebunden, wenn sowohl die Diagnoseoberfläche als auch das Plugin
  aktiviert sind, sodass die prozessinternen Kosten standardmäßig nahezu null bleiben.

## Schnellstart

Installieren Sie bei paketierten Installationen zuerst das Plugin:

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

Sie können das Plugin auch über die CLI aktivieren:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` unterstützt derzeit nur `http/protobuf`. `grpc` wird ignoriert.
</Note>

## Exportierte Signale

| Signal       | Was hineingehört                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metriken** | Zähler und Histogramme für Token-Nutzung, Kosten, Laufdauer, Failover, Skill-Nutzung, Nachrichtenfluss, Talk-Ereignisse, Warteschlangen-Lanes, Sitzungsstatus/-wiederherstellung, Tool-Ausführung, übergroße Payloads, exec und Speicherdruck. |
| **Traces**   | Spans für Modellnutzung, Modellaufrufe, Harness-Lebenszyklus, Skill-Nutzung, Tool-Ausführung, exec, Webhook-/Nachrichtenverarbeitung, Kontextzusammenstellung und Tool-Schleifen.                                                   |
| **Logs**     | Strukturierte `logging.file`-Datensätze, die über OTLP oder stdout-JSONL exportiert werden, wenn `diagnostics.otel.logs` aktiviert ist; Log-Bodies werden zurückgehalten, sofern Inhaltserfassung nicht ausdrücklich aktiviert ist.   |

Schalten Sie `traces`, `metrics` und `logs` unabhängig voneinander um. Traces und Metriken
sind standardmäßig aktiviert, wenn `diagnostics.otel.enabled` true ist. Logs sind standardmäßig deaktiviert und
werden nur exportiert, wenn `diagnostics.otel.logs` ausdrücklich `true` ist. Der Log-Export
verwendet standardmäßig OTLP; setzen Sie `diagnostics.otel.logsExporter` auf `stdout` für JSONL auf
stdout oder auf `both`, um jeden Diagnose-Log-Datensatz an OTLP und stdout zu senden.

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
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
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

| Variable                                                                                                          | Zweck                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Überschreibt `diagnostics.otel.endpoint`. Wenn der Wert bereits `/v1/traces`, `/v1/metrics` oder `/v1/logs` enthält, wird er unverändert verwendet.                                                                                                                                                                                                           |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signalspezifische Endpoint-Overrides, die verwendet werden, wenn der passende Konfigurationsschlüssel `diagnostics.otel.*Endpoint` nicht gesetzt ist. Signalspezifische Konfiguration hat Vorrang vor signalspezifischer Umgebungsvariable, diese wiederum vor dem gemeinsamen Endpoint.                                                                        |
| `OTEL_SERVICE_NAME`                                                                                               | Überschreibt `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Überschreibt das Wire-Protokoll (heute wird nur `http/protobuf` berücksichtigt).                                                                                                                                                                                                                                                                              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Auf `gen_ai_latest_experimental` setzen, um die neueste experimentelle GenAI-Inferenz-Span-Form auszugeben, einschließlich Span-Namen in der Form `{gen_ai.operation.name} {gen_ai.request.model}`, Span-Art `CLIENT` und `gen_ai.provider.name` statt des Legacy-`gen_ai.system`. GenAI-Metriken verwenden unabhängig davon immer begrenzte semantische Attribute mit niedriger Kardinalität. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Auf `1` setzen, wenn ein anderer Preload oder Host-Prozess das globale OpenTelemetry-SDK bereits registriert hat. Das Plugin überspringt dann seinen eigenen NodeSDK-Lebenszyklus, verdrahtet aber weiterhin Diagnose-Listener und berücksichtigt `traces`/`metrics`/`logs`.                                                                                   |

## Datenschutz und Inhaltserfassung

Rohe Modell-/Tool-Inhalte werden standardmäßig **nicht** exportiert. Spans enthalten begrenzte
Bezeichner (Kanal, Provider, Modell, Fehlerkategorie, ausschließlich gehashte Anfrage-IDs,
Tool-Quelle, Tool-Eigentümer und Skill-Name/-Quelle) und enthalten niemals Prompt-Text,
Antworttext, Tool-Eingaben, Tool-Ausgaben, Skill-Dateipfade oder Sitzungsschlüssel.
OTLP-Log-Datensätze behalten standardmäßig Schweregrad, Logger, Codeposition, vertrauenswürdigen Trace-Kontext
und bereinigte Attribute bei, aber der rohe Log-Nachrichtenbody wird nur exportiert,
wenn `diagnostics.otel.captureContent` auf den booleschen Wert `true` gesetzt ist. Granulare
`captureContent.*`-Unterschlüssel aktivieren Log-Bodies nicht. Labels, die wie
bereichsbezogene Agent-Sitzungsschlüssel aussehen, werden durch `unknown` ersetzt.
Talk-Metriken exportieren nur begrenzte Ereignismetadaten wie Modus, Transport,
Provider und Ereignistyp. Sie enthalten keine Transkripte, Audio-Payloads,
Sitzungs-IDs, Turn-IDs, Call-IDs, Raum-IDs oder Handoff-Tokens.

Ausgehende Modellanfragen können einen W3C-`traceparent`-Header enthalten. Dieser Header wird
nur aus OpenClaw-eigenem Diagnose-Trace-Kontext für den aktiven Modellaufruf
generiert. Vorhandene vom Aufrufer bereitgestellte `traceparent`-Header werden ersetzt, sodass Plugins oder
benutzerdefinierte Provider-Optionen keine dienstübergreifende Trace-Abstammung vortäuschen können.

Setzen Sie `diagnostics.otel.captureContent.*` nur dann auf `true`, wenn Ihr Collector und
Ihre Aufbewahrungsrichtlinie für Prompt-, Antwort-, Tool- oder System-Prompt-
Text freigegeben sind. Jeder Unterschlüssel ist unabhängig opt-in:

- `inputMessages` - Inhalt von Benutzer-Prompts.
- `outputMessages` - Inhalt von Modellantworten.
- `toolInputs` - Tool-Argument-Payloads.
- `toolOutputs` - Tool-Ergebnis-Payloads.
- `systemPrompt` - zusammengesetzter System-/Developer-Prompt.
- `toolDefinitions` - Modell-Tool-Namen, Beschreibungen und Schemas.

Wenn ein Unterschlüssel aktiviert ist, erhalten Modell- und Tool-Spans nur für diese Klasse begrenzte, redigierte
`openclaw.content.*`-Attribute. Verwenden Sie den booleschen Wert
`captureContent: true` nur für umfassende Diagnoseerfassungen, bei denen auch OTLP-Log-
Nachrichtenbodies für den Export freigegeben sind.

`toolInputs`-/`toolOutputs`-Inhalte werden für Tool-Ausführungen der integrierten Agent-Runtime
erfasst (`openclaw.content.tool_input` auf abgeschlossenen/Fehler-Spans,
`openclaw.content.tool_output` auf abgeschlossenen Spans). Externe Harness-Tool-Aufrufe
(Codex, Claude CLI) geben `tool.execution.*`-Spans ohne Inhalts-Payloads aus.
Erfasste Inhalte laufen über einen vertrauenswürdigen, nur für Listener bestimmten Kanal und werden niemals
auf dem öffentlichen Diagnoseereignisbus platziert.

## Sampling und Flushen

- **Traces:** `diagnostics.otel.sampleRate` (nur Root-Span, `0.0` verwirft alles,
  `1.0` behält alles).
- **Metriken:** `diagnostics.otel.flushIntervalMs` (Minimum `1000`).
- **Logs:** OTLP-Logs berücksichtigen `logging.level` (Datei-Log-Level). Sie verwenden den
  Redaction-Pfad für Diagnose-Log-Datensätze, nicht die Konsolenformatierung. Installationen mit hohem Volumen
  sollten OTLP-Collector-Sampling/-Filterung gegenüber lokalem Sampling bevorzugen.
  Setzen Sie `diagnostics.otel.logsExporter: "stdout"`, wenn Ihre Plattform bereits
  stdout/stderr an einen Logprozessor weiterleitet und Sie keinen OTLP-Logs-
  Collector haben. Stdout-Datensätze sind ein JSON-Objekt pro Zeile mit `ts`, `signal`,
  `service.name`, Schweregrad, Body, redigierten Attributen und vertrauenswürdigen Trace-Feldern,
  sofern verfügbar.
- **Datei-Log-Korrelation:** JSONL-Datei-Logs enthalten `traceId`,
  `spanId`, `parentSpanId` und `traceFlags` auf oberster Ebene, wenn der Log-Aufruf einen gültigen
  Diagnose-Trace-Kontext enthält. Dadurch können Logprozessoren lokale Logzeilen mit
  exportierten Spans verknüpfen.
- **Request-Korrelation:** Gateway-HTTP-Requests und WebSocket-Frames erstellen einen
  internen Request-Trace-Scope. Logs und Diagnoseereignisse in diesem Scope
  übernehmen standardmäßig den Request-Trace, während Agent-Run- und Modellaufruf-Spans
  als untergeordnete Spans erstellt werden, sodass Provider-`traceparent`-Header im selben Trace bleiben.
- **Modellaufruf-Korrelation:** `openclaw.model.call`-Spans enthalten standardmäßig sichere Größen für
  Prompt-Komponenten und enthalten Token-Attribute pro Aufruf, wenn das
  Provider-Ergebnis Nutzungsdaten bereitstellt. `openclaw.model.usage` bleibt der Run-Level-
  Abrechnungs-Span für aggregierte Kosten, Kontext und Kanal-Dashboards; er bleibt
  im selben Diagnose-Trace, wenn die ausgebende Runtime über vertrauenswürdigen Trace-
  Kontext verfügt.

## Exportierte Metriken

### Modellnutzung

- `openclaw.tokens` (Zähler, Attribute: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (Zähler, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (Histogramm, Attribute: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (Histogramm, GenAI-Metrik für semantische Konventionen, Attribute: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (Histogramm, Sekunden, GenAI-Metrik für semantische Konventionen, Attribute: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (Histogramm, Attribute: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` und `openclaw.failureKind` bei klassifizierten Fehlern)
- `openclaw.model_call.request_bytes` (Histogramm, UTF-8-Bytegröße der finalen Modell-Request-Payload; keine Roh-Payload-Inhalte)
- `openclaw.model_call.response_bytes` (Histogramm, UTF-8-Bytegröße gestreamter Response-Chunk-Payloads; hochfrequente Text-, Thinking- und Tool-Call-Deltas zählen nur inkrementelle `delta`-Bytes; keine rohen Response-Inhalte)
- `openclaw.model_call.time_to_first_byte_ms` (Histogramm, verstrichene Zeit bis zum ersten gestreamten Response-Ereignis)
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
- `openclaw.talk.event.duration_ms` (Histogramm, Attribute: dieselben wie bei `openclaw.talk.event`; wird ausgegeben, wenn ein Talk-Ereignis eine Dauer meldet)
- `openclaw.talk.audio.bytes` (Histogramm, Attribute: dieselben wie bei `openclaw.talk.event`; wird für Talk-Audio-Frame-Ereignisse ausgegeben, die eine Bytelänge melden)

### Warteschlangen und Sitzungen

- `openclaw.queue.lane.enqueue` (Zähler, Attribute: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (Zähler, Attribute: `openclaw.lane`)
- `openclaw.queue.depth` (Histogramm, Attribute: `openclaw.lane` oder `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (Histogramm, Attribute: `openclaw.lane`)
- `openclaw.session.state` (Zähler, Attribute: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (Zähler, Attribute: `openclaw.state`; wird für wiederherstellbare veraltete Sitzungsbuchhaltung ausgegeben)
- `openclaw.session.stuck_age_ms` (Histogramm, Attribute: `openclaw.state`; wird für wiederherstellbare veraltete Sitzungsbuchhaltung ausgegeben)
- `openclaw.session.turn.created` (Zähler, Attribute: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (Zähler, Attribute: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (Zähler, Attribute: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (Histogramm, Attribute: dieselben wie beim passenden Recovery-Zähler)
- `openclaw.run.attempt` (Zähler, Attribute: `openclaw.attempt`)

### Telemetrie zur Sitzungslebendigkeit

`diagnostics.stuckSessionWarnMs` ist der Schwellenwert für das Alter ohne Fortschritt bei
Diagnosen zur Sitzungslebendigkeit. Eine `processing`-Sitzung altert nicht in Richtung dieses Schwellenwerts,
während OpenClaw Antwort-, Tool-, Status-, Block- oder ACP-Runtime-Fortschritt beobachtet.
Typing-Keepalives werden nicht als Fortschritt gezählt, sodass ein stilles Modell oder Harness
weiterhin erkannt werden kann.

OpenClaw klassifiziert Sitzungen nach der Arbeit, die es noch beobachten kann:

- `session.long_running`: Aktive eingebettete Arbeit, Modellaufrufe oder Tool-Aufrufe machen
  weiterhin Fortschritt. Eigene Modellaufrufe, die länger als
  `diagnostics.stuckSessionWarnMs` still bleiben, werden vor
  `diagnostics.stuckSessionAbortMs` ebenfalls als lang laufend gemeldet, damit langsame oder nicht streamende Modell-Provider
  nicht wie blockierte Gateway-Sitzungen wirken, solange sie weiterhin abbrechbar beobachtet werden können.
- `session.stalled`: Aktive Arbeit ist vorhanden, aber der aktive Run hat keinen
  jüngsten Fortschritt gemeldet. Eigene Modellaufrufe wechseln bei oder nach
  `diagnostics.stuckSessionAbortMs` von `session.long_running` zu
  `session.stalled`; veraltete Modell-/Tool-Aktivität ohne Owner wird nicht als harmlose lang laufende Arbeit behandelt.
  Blockierte eingebettete Runs bleiben zunächst nur beobachtend und wechseln dann nach
  `diagnostics.stuckSessionAbortMs` ohne Fortschritt zu Abort-Drain, damit wartende Turns hinter der
  Lane fortgesetzt werden können. Wenn nicht gesetzt, verwendet der Abbruchschwellenwert standardmäßig das sicherere
  erweiterte Fenster von mindestens 5 Minuten und dem 3-Fachen von
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: Veraltete Sitzungsbuchhaltung ohne aktive Arbeit oder eine inaktive
  wartende Sitzung mit veralteter Modell-/Tool-Aktivität ohne Owner. Dadurch wird die
  betroffene Sitzungs-Lane unmittelbar freigegeben, nachdem die Recovery-Gates bestanden wurden.

Recovery gibt strukturierte Ereignisse `session.recovery.requested` und
`session.recovery.completed` aus. Der Diagnose-Sitzungsstatus wird erst nach einem mutierenden
Recovery-Ergebnis (`aborted` oder `released`) als inaktiv markiert und nur, wenn dieselbe
Processing-Generation noch aktuell ist.

Nur `session.stuck` gibt den Zähler `openclaw.session.stuck`, das
Histogramm `openclaw.session.stuck_age_ms` und den Span `openclaw.session.stuck`
aus. Wiederholte `session.stuck`-Diagnosen verwenden Backoff, solange die Sitzung
unverändert bleibt. Dashboards sollten daher auf anhaltende Anstiege statt auf jeden
Heartbeat-Tick alarmieren. Den Konfigurationsschalter und die Standardwerte finden Sie in der
[Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics).

Liveness-Warnungen geben außerdem Folgendes aus:

- `openclaw.liveness.warning` (Zähler, Attribute: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (Histogramm, Attribute: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (Histogramm, Attribute: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (Histogramm, Attribute: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (Histogramm, Attribute: `openclaw.liveness.reason`)

### Harness-Lebenszyklus

- `openclaw.harness.duration_ms` (Histogramm, Attribute: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bei Fehlern)

### Tool-Ausführung

- `openclaw.tool.execution.duration_ms` (Histogramm, Attribute: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, plus `openclaw.errorCategory` bei Fehlern)
- `openclaw.tool.execution.blocked` (Zähler, Attribute: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (Histogramm, Attribute: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnose-Interna (Speicher und Tool-Schleife)

- `openclaw.payload.large` (Zähler, Attribute: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (Histogramm, Attribute: dieselben wie bei `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (Histogramm, Attribute: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (Histogramm)
- `openclaw.memory.pressure` (Zähler, Attribute: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (Zähler, Attribute: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (Histogramm, Attribute: `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.errorCategory` und optional `openclaw.failureKind` bei Fehlern
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (nur sichere Komponentengrößen, kein Prompt-Text)
  - `openclaw.model_call.usage.*` und `gen_ai.usage.*`, wenn das Ergebnis des Modellaufrufs Provider-Nutzung für diesen einzelnen Aufruf enthält
  - `openclaw.provider.request_id_hash` (begrenzter SHA-basierter Hash der Request-ID des Upstream-Providers; Roh-IDs werden nicht exportiert)
  - Mit `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` verwenden Modellaufruf-Spans den neuesten GenAI-Inferenz-Span-Namen `{gen_ai.operation.name} {gen_ai.request.model}` und die Span-Art `CLIENT` statt `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Bei Abschluss: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Bei Fehler: `openclaw.harness.phase`, `openclaw.errorCategory`, optional `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (keine Loop-Nachrichten, Parameter oder Tool-Ausgabe)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wenn die Inhaltserfassung explizit aktiviert ist, können Modell- und Tool-Spans auch
begrenzte, redigierte `openclaw.content.*`-Attribute für die spezifischen
Inhaltsklassen enthalten, die Sie aktiviert haben.

## Katalog der Diagnoseereignisse

Die folgenden Ereignisse unterstützen die oben genannten Metriken und Spans. Plugins können sie auch direkt abonnieren,
ohne OTLP-Export.

**Modellnutzung**

- `model.usage` - Tokens, Kosten, Dauer, Kontext, Provider/Modell/Kanal,
  Sitzungs-IDs. `usage` ist die Provider-/Turn-Abrechnung für Kosten und Telemetrie;
  `context.used` ist der aktuelle Prompt-/Kontext-Snapshot und kann niedriger sein als
  Provider-`usage.total`, wenn zwischengespeicherte Eingaben oder Tool-Loop-Aufrufe beteiligt sind.

**Nachrichtenfluss**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Warteschlange und Sitzung**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (aggregierte Zähler: Webhooks/Warteschlange/Sitzung)

**Harness-Lifecycle**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  Lifecycle pro Lauf für das Agent-Harness. Enthält `harnessId`, optional
  `pluginId`, Provider/Modell/Kanal und Lauf-ID. Abschluss fügt
  `durationMs`, `outcome`, optional `resultClassification`, `yieldDetected`
  und `itemLifecycle`-Zähler hinzu. Fehler fügen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` und
  optional `cleanupFailed` hinzu.

**Exec**

- `exec.process.completed` - terminales Ergebnis, Dauer, Ziel, Modus, Exit-Code
  und Fehlerart. Befehlstext und Arbeitsverzeichnisse sind nicht
  enthalten.

## Ohne Exporter

Sie können Diagnoseereignisse für Plugins oder benutzerdefinierte Sinks verfügbar halten, ohne
`diagnostics-otel` auszuführen:

```json5
{
  diagnostics: { enabled: true },
}
```

Für gezielte Debug-Ausgabe ohne Erhöhung von `logging.level` verwenden Sie Diagnose-
Flags. Flags unterscheiden nicht zwischen Groß- und Kleinschreibung und unterstützen Wildcards (z. B. `telegram.*` oder
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Oder als einmaliges Env-Override:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Flag-Ausgabe geht in die Standard-Logdatei (`logging.file`) und wird weiterhin
durch `logging.redactSensitive` redigiert. Vollständige Anleitung:
[Diagnose-Flags](/de/diagnostics/flags).

## Deaktivieren

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Sie können `diagnostics-otel` auch aus `plugins.allow` weglassen oder
`openclaw plugins disable diagnostics-otel` ausführen.

## Verwandte Themen

- [Logging](/de/logging) - Datei-Logs, Konsolenausgabe, CLI-Tailing und der Control-UI-Tab „Logs“
- [Gateway-Logging-Interna](/de/gateway/logging) - WS-Logstile, Subsystem-Präfixe und Konsolenerfassung
- [Diagnose-Flags](/de/diagnostics/flags) - gezielte Debug-Log-Flags
- [Diagnoseexport](/de/gateway/diagnostics) - Support-Bundle-Tool für Operatoren (getrennt vom OTEL-Export)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) - vollständige Feldreferenz zu `diagnostics.*`
