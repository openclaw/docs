---
read_when:
    - Sie möchten OpenClaw-Modellnutzung, Nachrichtenfluss oder Sitzungsmetriken an einen OpenTelemetry Collector senden
    - Sie binden Traces, Metriken oder Logs in Grafana, Datadog, Honeycomb, New Relic, Tempo oder ein anderes OTLP-Backend ein
    - Sie benötigen die exakten Metriknamen, Span-Namen oder Attributstrukturen, um Dashboards oder Warnmeldungen zu erstellen
summary: OpenClaw-Diagnosedaten über das diagnostics-otel-Plugin (OTLP/HTTP) an einen beliebigen OpenTelemetry Collector exportieren
title: OpenTelemetry-Export
x-i18n:
    generated_at: "2026-05-06T17:56:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exportiert Diagnosedaten über das offizielle `diagnostics-otel` Plugin
mit **OTLP/HTTP (protobuf)**. Jeder Collector und jedes Backend, das OTLP/HTTP
akzeptiert, funktioniert ohne Codeänderungen. Informationen zu lokalen Dateilogs
und dazu, wie Sie sie lesen, finden Sie unter
[Logging](/de/logging).

## Wie es zusammenspielt

- **Diagnoseereignisse** sind strukturierte prozessinterne Datensätze, die vom
  Gateway und von gebündelten Plugins für Modellläufe, Nachrichtenfluss,
  Sitzungen, Queues und Ausführung ausgegeben werden.
- Das **`diagnostics-otel` Plugin** abonniert diese Ereignisse und exportiert sie
  als OpenTelemetry-**Metriken**, **Traces** und **Logs** über OTLP/HTTP.
- **Provider-Aufrufe** erhalten einen W3C-`traceparent`-Header aus dem
  vertrauenswürdigen Modellaufruf-Span-Kontext von OpenClaw, wenn der
  Provider-Transport benutzerdefinierte Header akzeptiert. Von Plugins
  ausgegebener Trace-Kontext wird nicht weitergegeben.
- Exporter werden nur angebunden, wenn sowohl die Diagnoseoberfläche als auch
  das Plugin aktiviert sind. Dadurch bleiben die prozessinternen Kosten
  standardmäßig nahe null.

## Schnellstart

Installieren Sie bei Paketinstallationen zuerst das Plugin:

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

| Signal      | Was darin enthalten ist                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metriken** | Zähler und Histogramme für Token-Nutzung, Kosten, Laufdauer, Nachrichtenfluss, Talk-Ereignisse, Queue-Lanes, Sitzungsstatus/-wiederherstellung, Ausführung und Speicherdruck. |
| **Traces**  | Spans für Modellnutzung, Modellaufrufe, Harness-Lebenszyklus, Tool-Ausführung, Ausführung, Webhook-/Nachrichtenverarbeitung, Kontextzusammenstellung und Tool-Schleifen. |
| **Logs**    | Strukturierte `logging.file`-Datensätze, die über OTLP exportiert werden, wenn `diagnostics.otel.logs` aktiviert ist.                                               |

Schalten Sie `traces`, `metrics` und `logs` unabhängig voneinander um. Alle drei
sind standardmäßig aktiviert, wenn `diagnostics.otel.enabled` auf true gesetzt ist.

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
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Umgebungsvariablen

| Variable                                                                                                          | Zweck                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Überschreibt `diagnostics.otel.endpoint`. Wenn der Wert bereits `/v1/traces`, `/v1/metrics` oder `/v1/logs` enthält, wird er unverändert verwendet.                                                                                       |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signalspezifische Endpoint-Überschreibungen, die verwendet werden, wenn der passende Konfigurationsschlüssel `diagnostics.otel.*Endpoint` nicht gesetzt ist. Signalspezifische Konfiguration hat Vorrang vor signalspezifischer Umgebung, die wiederum Vorrang vor dem gemeinsamen Endpoint hat. |
| `OTEL_SERVICE_NAME`                                                                                               | Überschreibt `diagnostics.otel.serviceName`.                                                                                                                                                                                               |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Überschreibt das Übertragungsprotokoll (derzeit wird nur `http/protobuf` berücksichtigt).                                                                                                                                                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Setzen Sie diesen Wert auf `gen_ai_latest_experimental`, um das neueste experimentelle GenAI-Span-Attribut (`gen_ai.provider.name`) anstelle des Legacy-Attributs `gen_ai.system` auszugeben. GenAI-Metriken verwenden unabhängig davon immer begrenzte semantische Attribute mit niedriger Kardinalität. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Setzen Sie diesen Wert auf `1`, wenn ein anderer Preload oder Hostprozess bereits das globale OpenTelemetry-SDK registriert hat. Das Plugin überspringt dann den eigenen NodeSDK-Lebenszyklus, verbindet aber weiterhin Diagnose-Listener und berücksichtigt `traces`/`metrics`/`logs`. |

## Datenschutz und Inhaltserfassung

Rohinhalte von Modellen und Tools werden standardmäßig **nicht** exportiert.
Spans enthalten begrenzte Kennungen (Kanal, Provider, Modell, Fehlerkategorie,
Request-IDs nur als Hash) und enthalten niemals Prompt-Text, Antworttext,
Tool-Eingaben, Tool-Ausgaben oder Sitzungsschlüssel.
Talk-Metriken exportieren nur begrenzte Ereignismetadaten wie Modus, Transport,
Provider und Ereignistyp. Sie enthalten keine Transkripte, Audio-Payloads,
Sitzungs-IDs, Turn-IDs, Aufruf-IDs, Raum-IDs oder Handoff-Tokens.

Ausgehende Modell-Requests können einen W3C-`traceparent`-Header enthalten.
Dieser Header wird nur aus OpenClaw-eigenem Diagnose-Trace-Kontext für den
aktiven Modellaufruf erzeugt. Vorhandene vom Aufrufer bereitgestellte
`traceparent`-Header werden ersetzt, sodass Plugins oder benutzerdefinierte
Provider-Optionen keine dienstübergreifende Trace-Abstammung vortäuschen können.

Setzen Sie `diagnostics.otel.captureContent.*` nur dann auf `true`, wenn Ihr
Collector und Ihre Aufbewahrungsrichtlinie für Prompt-, Antwort-, Tool- oder
System-Prompt-Text freigegeben sind. Jeder Unterschlüssel wird unabhängig
per Opt-in aktiviert:

- `inputMessages` - Inhalt von Benutzer-Prompts.
- `outputMessages` - Inhalt von Modellantworten.
- `toolInputs` - Payloads von Tool-Argumenten.
- `toolOutputs` - Payloads von Tool-Ergebnissen.
- `systemPrompt` - zusammengestellter System-/Entwickler-Prompt.

Wenn ein Unterschlüssel aktiviert ist, erhalten Modell- und Tool-Spans nur für
diese Klasse begrenzte, redigierte `openclaw.content.*`-Attribute.

## Sampling und Flush

- **Traces:** `diagnostics.otel.sampleRate` (nur Root-Span, `0.0` verwirft alle,
  `1.0` behält alle).
- **Metriken:** `diagnostics.otel.flushIntervalMs` (Minimum `1000`).
- **Logs:** OTLP-Logs berücksichtigen `logging.level` (Dateilog-Level). Sie
  verwenden den Redaktionspfad für Diagnose-Logdatensätze, nicht die
  Konsolenformatierung. Installationen mit hohem Volumen sollten Sampling und
  Filterung im OTLP-Collector gegenüber lokalem Sampling bevorzugen.
- **Korrelation von Dateilogs:** JSONL-Dateilogs enthalten `traceId`,
  `spanId`, `parentSpanId` und `traceFlags` auf oberster Ebene, wenn der
  Logaufruf einen gültigen Diagnose-Trace-Kontext trägt. Dadurch können
  Logprozessoren lokale Logzeilen mit exportierten Spans verknüpfen.
- **Request-Korrelation:** Gateway-HTTP-Requests und WebSocket-Frames erstellen
  einen internen Request-Trace-Scope. Logs und Diagnoseereignisse innerhalb
  dieses Scopes erben standardmäßig den Request-Trace, während Agentenlauf- und
  Modellaufruf-Spans als untergeordnete Spans erstellt werden, damit
  Provider-`traceparent`-Header im selben Trace bleiben.

## Exportierte Metriken

### Modellnutzung

- `openclaw.tokens` (Zähler, Attribute: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (Zähler, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (Histogramm, Attribute: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (Histogramm, GenAI-Metrik nach semantischen Konventionen, Attribute: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (Histogramm, Sekunden, GenAI-Metrik nach semantischen Konventionen, Attribute: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (Histogramm, Attribute: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` und `openclaw.failureKind` bei klassifizierten Fehlern)
- `openclaw.model_call.request_bytes` (Histogramm, UTF-8-Bytegröße des finalen Modell-Request-Payloads; kein roher Payload-Inhalt)
- `openclaw.model_call.response_bytes` (Histogramm, UTF-8-Bytegröße gestreamter Modellantwort-Ereignisse; kein roher Antwortinhalt)
- `openclaw.model_call.time_to_first_byte_ms` (Histogramm, verstrichene Zeit vor dem ersten gestreamten Antwortereignis)

### Nachrichtenfluss

- `openclaw.webhook.received` (Zähler, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (Zähler, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (Zähler, Attribute: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (Zähler, Attribute: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (Zähler, Attribute: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (Zähler, Attribute: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (Histogramm, Attribute: wie bei `openclaw.talk.event`; wird ausgegeben, wenn ein Talk-Ereignis eine Dauer meldet)
- `openclaw.talk.audio.bytes` (Histogramm, Attribute: wie bei `openclaw.talk.event`; wird für Talk-Audio-Frame-Ereignisse ausgegeben, die eine Bytelänge melden)

### Queues und Sitzungen

- `openclaw.queue.lane.enqueue` (Zähler, Attr.: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (Zähler, Attr.: `openclaw.lane`)
- `openclaw.queue.depth` (Histogramm, Attr.: `openclaw.lane` oder `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (Histogramm, Attr.: `openclaw.lane`)
- `openclaw.session.state` (Zähler, Attr.: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (Zähler, Attr.: `openclaw.state`; wird nur für veraltete Sitzungsbuchhaltung ohne aktive Arbeit ausgegeben)
- `openclaw.session.stuck_age_ms` (Histogramm, Attr.: `openclaw.state`; wird nur für veraltete Sitzungsbuchhaltung ohne aktive Arbeit ausgegeben)
- `openclaw.session.recovery.requested` (Zähler, Attr.: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (Zähler, Attr.: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (Histogramm, Attr.: wie der passende Wiederherstellungszähler)
- `openclaw.run.attempt` (Zähler, Attr.: `openclaw.attempt`)

### Telemetrie zur Sitzungslebendigkeit

`diagnostics.stuckSessionWarnMs` ist der Altersgrenzwert ohne Fortschritt für Diagnosen zur Sitzungslebendigkeit. Eine `processing`-Sitzung altert nicht in Richtung dieses Grenzwerts, solange OpenClaw Antwort-, Tool-, Status-, Block- oder ACP-Laufzeitfortschritt beobachtet. Tipp-Keepalives zählen nicht als Fortschritt, sodass ein stilles Modell oder Harness weiterhin erkannt werden kann.

OpenClaw klassifiziert Sitzungen anhand der Arbeit, die noch beobachtet werden kann:

- `session.long_running`: Aktive eingebettete Arbeit, Modellaufrufe oder Tool-Aufrufe machen weiterhin Fortschritt.
- `session.stalled`: Aktive Arbeit ist vorhanden, aber der aktive Lauf hat kürzlich keinen Fortschritt gemeldet. Angehaltene eingebettete Läufe bleiben zunächst nur beobachtend und wechseln dann nach `diagnostics.stuckSessionAbortMs` ohne Fortschritt zu Abort-Drain, damit wartende Turns hinter der Lane fortgesetzt werden können. Wenn nicht gesetzt, verwendet der Abbruchgrenzwert standardmäßig das sicherere erweiterte Fenster von mindestens 10 Minuten und 5x `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: Veraltete Sitzungsbuchhaltung ohne aktive Arbeit. Dadurch wird die betroffene Sitzungs-Lane sofort freigegeben.

Die Wiederherstellung gibt strukturierte Ereignisse `session.recovery.requested` und `session.recovery.completed` aus. Der Diagnose-Sitzungszustand wird erst nach einem verändernden Wiederherstellungsergebnis (`aborted` oder `released`) und nur dann als idle markiert, wenn dieselbe Verarbeitungsgeneration noch aktuell ist.

Nur `session.stuck` gibt den Zähler `openclaw.session.stuck`, das Histogramm `openclaw.session.stuck_age_ms` und den Span `openclaw.session.stuck` aus. Wiederholte `session.stuck`-Diagnosen verwenden Backoff, solange die Sitzung unverändert bleibt. Dashboards sollten daher auf anhaltende Zunahmen statt auf jeden Heartbeat-Tick alarmieren. Den Konfigurationsschalter und die Standardwerte finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics).

### Harness-Lebenszyklus

- `openclaw.harness.duration_ms` (Histogramm, Attr.: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bei Fehlern)

### Exec

- `openclaw.exec.duration_ms` (Histogramm, Attr.: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnose-Interna (Speicher und Tool-Loop)

- `openclaw.memory.heap_used_bytes` (Histogramm, Attr.: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (Histogramm)
- `openclaw.memory.pressure` (Zähler, Attr.: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (Zähler, Attr.: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (Histogramm, Attr.: `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.provider.request_id_hash` (begrenzter SHA-basierter Hash der Upstream-Provider-Anfrage-ID; Roh-IDs werden nicht exportiert)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Bei Abschluss: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Bei Fehlern: `openclaw.harness.phase`, `openclaw.errorCategory`, optional `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (keine Prompt-, Verlaufs-, Antwort- oder Sitzungsschlüssel-Inhalte)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (keine Loop-Nachrichten, Parameter oder Tool-Ausgabe)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wenn die Inhaltserfassung ausdrücklich aktiviert ist, können Modell- und Tool-Spans außerdem begrenzte, redigierte `openclaw.content.*`-Attribute für die spezifischen Inhaltsklassen enthalten, für die Sie sich entschieden haben.

## Diagnoseereigniskatalog

Die folgenden Ereignisse unterstützen die oben genannten Metriken und Spans. Plugins können sie auch direkt abonnieren, ohne OTLP-Export.

**Modellnutzung**

- `model.usage` - Tokens, Kosten, Dauer, Kontext, Provider/Modell/Kanal, Sitzungs-IDs. `usage` ist die Provider-/Turn-Abrechnung für Kosten und Telemetrie; `context.used` ist der aktuelle Prompt-/Kontext-Snapshot und kann niedriger sein als `usage.total` des Providers, wenn zwischengespeicherte Eingaben oder Tool-Loop-Aufrufe beteiligt sind.

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - Lebenszyklus pro Lauf für das Agent-Harness. Enthält `harnessId`, optional `pluginId`, Provider/Modell/Kanal und Lauf-ID. Der Abschluss ergänzt `durationMs`, `outcome`, optional `resultClassification`, `yieldDetected` und `itemLifecycle`-Zähler. Fehler ergänzen `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` und optional `cleanupFailed`.

**Exec**

- `exec.process.completed` - Terminal-Ergebnis, Dauer, Ziel, Modus, Exit-Code und Fehlerart. Befehlstext und Arbeitsverzeichnisse sind nicht enthalten.

## Ohne Exporter

Sie können Diagnoseereignisse für Plugins oder benutzerdefinierte Sinks verfügbar halten, ohne `diagnostics-otel` auszuführen:

```json5
{
  diagnostics: { enabled: true },
}
```

Für gezielte Debug-Ausgabe ohne Erhöhung von `logging.level` verwenden Sie Diagnose-Flags. Flags unterscheiden nicht zwischen Groß- und Kleinschreibung und unterstützen Platzhalter (z. B. `telegram.*` oder `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Oder als einmalige Env-Überschreibung:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Flag-Ausgaben gehen in die Standard-Logdatei (`logging.file`) und werden weiterhin durch `logging.redactSensitive` redigiert. Vollständige Anleitung: [Diagnose-Flags](/de/diagnostics/flags).

## Deaktivieren

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Sie können `diagnostics-otel` auch aus `plugins.allow` weglassen oder `openclaw plugins disable diagnostics-otel` ausführen.

## Verwandt

- [Logging](/de/logging) - Datei-Logs, Konsolenausgabe, CLI-Tailing und der Logs-Tab der Control UI
- [Gateway-Logging-Interna](/de/gateway/logging) - WS-Logstile, Subsystem-Präfixe und Konsolenerfassung
- [Diagnose-Flags](/de/diagnostics/flags) - gezielte Debug-Log-Flags
- [Diagnoseexport](/de/gateway/diagnostics) - Support-Bundle-Tool für Betreiber (separat vom OTEL-Export)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) - vollständige Referenz der `diagnostics.*`-Felder
