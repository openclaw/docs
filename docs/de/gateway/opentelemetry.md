---
read_when:
    - Sie möchten OpenClaw-Modellnutzung, Nachrichtenfluss oder Sitzungsmetriken an einen OpenTelemetry-Collector senden
    - Sie binden Traces, Metriken oder Logs in Grafana, Datadog, Honeycomb, New Relic, Tempo oder ein anderes OTLP-Backend ein
    - Sie benötigen die genauen Metriknamen, Span-Namen oder Attributstrukturen, um Dashboards oder Warnmeldungen zu erstellen
summary: OpenClaw-Diagnosedaten über das diagnostics-otel-Plugin (OTLP/HTTP) an einen beliebigen OpenTelemetry Collector exportieren
title: OpenTelemetry-Export
x-i18n:
    generated_at: "2026-05-05T06:17:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5030b8b16624f114e31838d3a055c24e8a23a6c77d63495a445cb9f2e227b6a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exportiert Diagnosedaten über das offizielle `diagnostics-otel`-Plugin
mithilfe von **OTLP/HTTP (protobuf)**. Jeder Collector und jedes Backend, das OTLP/HTTP akzeptiert,
funktioniert ohne Codeänderungen. Informationen zu lokalen Dateilogs und dazu, wie Sie diese lesen, finden Sie unter
[Protokollierung](/de/logging).

## Zusammenspiel

- **Diagnoseereignisse** sind strukturierte, prozessinterne Datensätze, die vom
  Gateway und von gebündelten Plugins für Modellläufe, Nachrichtenfluss, Sitzungen, Warteschlangen
  und Exec ausgegeben werden.
- Das **`diagnostics-otel`-Plugin** abonniert diese Ereignisse und exportiert sie als
  OpenTelemetry-**Metriken**, **Traces** und **Logs** über OTLP/HTTP.
- **Provider-Aufrufe** erhalten einen W3C-`traceparent`-Header aus dem vertrauenswürdigen
  Modellaufruf-Span-Kontext von OpenClaw, wenn der Provider-Transport benutzerdefinierte
  Header akzeptiert. Von Plugins ausgegebener Trace-Kontext wird nicht weitergegeben.
- Exporter werden nur eingebunden, wenn sowohl die Diagnoseschnittstelle als auch das Plugin
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

| Signal      | Was darin enthalten ist                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metriken** | Zähler und Histogramme für Token-Nutzung, Kosten, Laufdauer, Nachrichtenfluss, Warteschlangen-Lanes, Sitzungsstatus, Exec und Speicherdruck.          |
| **Traces**  | Spans für Modellnutzung, Modellaufrufe, Harness-Lebenszyklus, Tool-Ausführung, Exec, Webhook-/Nachrichtenverarbeitung, Kontextzusammenstellung und Tool-Schleifen. |
| **Logs**    | Strukturierte `logging.file`-Datensätze, die über OTLP exportiert werden, wenn `diagnostics.otel.logs` aktiviert ist.                                              |

Schalten Sie `traces`, `metrics` und `logs` unabhängig voneinander um. Alle drei sind standardmäßig aktiviert,
wenn `diagnostics.otel.enabled` auf `true` gesetzt ist.

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

| Variable                                                                                                          | Zweck                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Überschreibt `diagnostics.otel.endpoint`. Wenn der Wert bereits `/v1/traces`, `/v1/metrics` oder `/v1/logs` enthält, wird er unverändert verwendet.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signalspezifische Endpoint-Überschreibungen, die verwendet werden, wenn der passende Konfigurationsschlüssel `diagnostics.otel.*Endpoint` nicht gesetzt ist. Signalspezifische Konfiguration hat Vorrang vor signalspezifischer Umgebung, die wiederum Vorrang vor dem gemeinsamen Endpoint hat.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Überschreibt `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Überschreibt das Übertragungsprotokoll (heute wird nur `http/protobuf` berücksichtigt).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Setzen Sie dies auf `gen_ai_latest_experimental`, um das neueste experimentelle GenAI-Span-Attribut (`gen_ai.provider.name`) anstelle des alten `gen_ai.system` auszugeben. GenAI-Metriken verwenden unabhängig davon immer begrenzte semantische Attribute mit niedriger Kardinalität. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Setzen Sie dies auf `1`, wenn ein anderer Preload oder Host-Prozess das globale OpenTelemetry-SDK bereits registriert hat. Das Plugin überspringt dann seinen eigenen NodeSDK-Lebenszyklus, verdrahtet aber weiterhin Diagnose-Listener und berücksichtigt `traces`/`metrics`/`logs`.                |

## Datenschutz und Inhaltserfassung

Rohe Modell-/Tool-Inhalte werden standardmäßig **nicht** exportiert. Spans tragen begrenzte
Bezeichner (Kanal, Provider, Modell, Fehlerkategorie, nur als Hash gespeicherte Anfrage-IDs)
und enthalten niemals Prompt-Text, Antworttext, Tool-Eingaben, Tool-Ausgaben oder
Sitzungsschlüssel.

Ausgehende Modellanfragen können einen W3C-`traceparent`-Header enthalten. Dieser Header wird
nur aus OpenClaw-eigenem Diagnose-Trace-Kontext für den aktiven Modellaufruf
generiert. Vorhandene vom Aufrufer bereitgestellte `traceparent`-Header werden ersetzt, sodass Plugins oder
benutzerdefinierte Provider-Optionen die dienstübergreifende Trace-Abstammung nicht fälschen können.

Setzen Sie `diagnostics.otel.captureContent.*` nur dann auf `true`, wenn Ihr Collector und
Ihre Aufbewahrungsrichtlinie für Prompt-, Antwort-, Tool- oder System-Prompt-
Text freigegeben sind. Jeder Unterschlüssel ist unabhängig opt-in:

- `inputMessages` — Inhalt von Benutzer-Prompts.
- `outputMessages` — Inhalt von Modellantworten.
- `toolInputs` — Payloads von Tool-Argumenten.
- `toolOutputs` — Payloads von Tool-Ergebnissen.
- `systemPrompt` — zusammengestellter System-/Entwickler-Prompt.

Wenn ein Unterschlüssel aktiviert ist, erhalten Modell- und Tool-Spans nur für diese Klasse begrenzte, redigierte
`openclaw.content.*`-Attribute.

## Sampling und Flushen

- **Traces:** `diagnostics.otel.sampleRate` (nur Root-Span, `0.0` verwirft alle,
  `1.0` behält alle).
- **Metriken:** `diagnostics.otel.flushIntervalMs` (Minimum `1000`).
- **Logs:** OTLP-Logs berücksichtigen `logging.level` (Dateilog-Level). Sie verwenden den
  Redaktionspfad für Diagnose-Log-Datensätze, nicht die Konsolenformatierung. Installationen mit hohem Volumen
  sollten OTLP-Collector-Sampling/-Filterung gegenüber lokalem Sampling bevorzugen.
- **Dateilog-Korrelation:** JSONL-Dateilogs enthalten `traceId`,
  `spanId`, `parentSpanId` und `traceFlags` auf oberster Ebene, wenn der Log-Aufruf einen gültigen
  Diagnose-Trace-Kontext trägt. Dadurch können Log-Prozessoren lokale Log-Zeilen mit
  exportierten Spans verknüpfen.
- **Anfragekorrelation:** Gateway-HTTP-Anfragen und WebSocket-Frames erstellen einen
  internen Anfrage-Trace-Scope. Logs und Diagnoseereignisse innerhalb dieses Scopes
  erben standardmäßig den Anfrage-Trace, während Agentenlauf- und Modellaufruf-Spans als
  untergeordnete Elemente erstellt werden, sodass Provider-`traceparent`-Header im selben Trace bleiben.

## Exportierte Metriken

### Modellnutzung

- `openclaw.tokens` (Zähler, Attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (Zähler, Attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (Histogramm, Attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (Histogramm, Attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (Histogramm, GenAI-Metrik gemäß semantischen Konventionen, Attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (Histogramm, Sekunden, GenAI-Metrik gemäß semantischen Konventionen, Attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (Histogramm, Attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport` sowie `openclaw.errorCategory` und `openclaw.failureKind` bei klassifizierten Fehlern)
- `openclaw.model_call.request_bytes` (Histogramm, UTF-8-Bytegröße der finalen Modellanfrage-Payload; kein roher Payload-Inhalt)
- `openclaw.model_call.response_bytes` (Histogramm, UTF-8-Bytegröße gestreamter Modellantwort-Ereignisse; kein roher Antwortinhalt)
- `openclaw.model_call.time_to_first_byte_ms` (Histogramm, verstrichene Zeit bis zum ersten gestreamten Antwortereignis)

### Nachrichtenfluss

- `openclaw.webhook.received` (Zähler, Attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (Zähler, Attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (Histogramm, Attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (Zähler, Attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (Zähler, Attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (Histogramm, Attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (Zähler, Attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (Histogramm, Attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Warteschlangen und Sitzungen

- `openclaw.queue.lane.enqueue` (Zähler, Attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (Zähler, Attrs: `openclaw.lane`)
- `openclaw.queue.depth` (Histogramm, Attrs: `openclaw.lane` oder `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (Histogramm, Attrs: `openclaw.lane`)
- `openclaw.session.state` (Zähler, Attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (Zähler, Attrs: `openclaw.state`; wird nur für veraltete Sitzungsbuchhaltung ohne aktive Arbeit ausgegeben)
- `openclaw.session.stuck_age_ms` (Histogramm, Attrs: `openclaw.state`; wird nur für veraltete Sitzungsbuchhaltung ohne aktive Arbeit ausgegeben)
- `openclaw.run.attempt` (Zähler, Attrs: `openclaw.attempt`)

### Telemetrie zur Sitzungslebendigkeit

`diagnostics.stuckSessionWarnMs` ist der Altersschwellenwert ohne Fortschritt für Diagnose der
Sitzungslebendigkeit. Eine `processing`-Sitzung altert nicht in Richtung dieses Schwellenwerts,
während OpenClaw Antwort-, Tool-, Status-, Block- oder ACP-Laufzeitfortschritt beobachtet.
Typing-Keepalives zählen nicht als Fortschritt, sodass ein stummes Modell oder Harness
weiterhin erkannt werden kann.

OpenClaw klassifiziert Sitzungen nach der Arbeit, die es noch beobachten kann:

- `session.long_running`: aktive eingebettete Arbeit, Modellaufrufe oder Tool-Aufrufe
  machen noch Fortschritt.
- `session.stalled`: aktive Arbeit ist vorhanden, aber der aktive Lauf hat in
  letzter Zeit keinen Fortschritt gemeldet. Angehaltene eingebettete Läufe bleiben
  zunächst nur beobachtbar und gehen dann nach `diagnostics.stuckSessionAbortMs`
  ohne Fortschritt in Abort-Drain über, damit wartende Turns hinter der Lane
  fortgesetzt werden können. Wenn nicht gesetzt, fällt der Abbruchschwellenwert
  auf das sicherere erweiterte Fenster von mindestens 10 Minuten und 5x
  `diagnostics.stuckSessionWarnMs` zurück.
- `session.stuck`: veraltete Sitzungsbuchhaltung ohne aktive Arbeit. Dies gibt
  die betroffene Sitzungslane sofort frei.

Die Wiederherstellung gibt strukturierte Ereignisse `session.recovery.requested` und
`session.recovery.completed` aus. Der Diagnose-Sitzungszustand wird erst nach
einem mutierenden Wiederherstellungsergebnis (`aborted` oder `released`) als idle
markiert, und nur wenn dieselbe Verarbeitungsgeneration noch aktuell ist.

Nur `session.stuck` gibt den Zähler `openclaw.session.stuck`, das Histogramm
`openclaw.session.stuck_age_ms` und den Span `openclaw.session.stuck` aus.
Wiederholte `session.stuck`-Diagnosen verwenden Backoff, solange die Sitzung
unverändert bleibt. Dashboards sollten daher auf anhaltende Anstiege statt auf
jeden Heartbeat-Tick alarmieren. Den Konfigurationsknopf und die Standardwerte
finden Sie in der
[Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics).

### Harness-Lebenszyklus

- `openclaw.harness.duration_ms` (Histogramm, Attribute: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bei Fehlern)

### Ausführung

- `openclaw.exec.duration_ms` (Histogramm, Attribute: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnose-Interna (Speicher und Tool-Schleife)

- `openclaw.memory.heap_used_bytes` (Histogramm, Attribute: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (Histogramm)
- `openclaw.memory.pressure` (Zähler, Attribute: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (Zähler, Attribute: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (Histogramm, Attribute: `openclaw.toolName`, `openclaw.outcome`)

## Exportierte Spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` standardmäßig oder `gen_ai.provider.name`, wenn die neuesten semantischen GenAI-Konventionen aktiviert sind
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` standardmäßig oder `gen_ai.provider.name`, wenn die neuesten semantischen GenAI-Konventionen aktiviert sind
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` und optional `openclaw.failureKind` bei Fehlern
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (begrenzter SHA-basierter Hash der Upstream-Provider-Anfrage-ID; rohe IDs werden nicht exportiert)
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (keine Schleifennachrichten, Parameter oder Tool-Ausgaben)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wenn Inhaltserfassung ausdrücklich aktiviert ist, können Modell- und Tool-Spans außerdem
begrenzte, redigierte `openclaw.content.*`-Attribute für die konkreten
Inhaltsklassen enthalten, für die Sie sich entschieden haben.

## Katalog der Diagnoseereignisse

Die folgenden Ereignisse stützen die obigen Metriken und Spans. Plugins können
sie auch direkt abonnieren, ohne OTLP-Export.

**Modellnutzung**

- `model.usage` — Tokens, Kosten, Dauer, Kontext, Provider/Modell/Kanal,
  Sitzungs-IDs. `usage` ist Provider-/Turn-Abrechnung für Kosten und Telemetrie;
  `context.used` ist der aktuelle Prompt-/Kontext-Snapshot und kann niedriger sein als
  Provider-`usage.total`, wenn gecachte Eingaben oder Tool-Schleifenaufrufe beteiligt sind.

**Nachrichtenfluss**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Warteschlange und Sitzung**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (Aggregatzähler: Webhooks/Warteschlange/Sitzung)

**Harness-Lebenszyklus**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  Lebenszyklus pro Lauf für den Agent-Harness. Enthält `harnessId`, optional
  `pluginId`, Provider/Modell/Kanal und Lauf-ID. Der Abschluss ergänzt
  `durationMs`, `outcome`, optional `resultClassification`, `yieldDetected`
  und `itemLifecycle`-Zählwerte. Fehler ergänzen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` und
  optional `cleanupFailed`.

**Ausführung**

- `exec.process.completed` — Terminalergebnis, Dauer, Ziel, Modus, Exit-Code
  und Fehlerart. Befehlstext und Arbeitsverzeichnisse sind nicht enthalten.

## Ohne Exporter

Sie können Diagnoseereignisse für Plugins oder benutzerdefinierte Senken verfügbar halten,
ohne `diagnostics-otel` auszuführen:

```json5
{
  diagnostics: { enabled: true },
}
```

Für gezielte Debug-Ausgabe ohne Erhöhen von `logging.level` verwenden Sie Diagnose-Flags.
Flags unterscheiden nicht zwischen Groß- und Kleinschreibung und unterstützen Platzhalter (z. B. `telegram.*` oder
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Oder als einmalige Env-Überschreibung:

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

Sie können `diagnostics-otel` auch aus `plugins.allow` herauslassen oder
`openclaw plugins disable diagnostics-otel` ausführen.

## Verwandte Themen

- [Protokollierung](/de/logging) — Dateilogs, Konsolenausgabe, CLI-Tailing und der Control-UI-Logs-Tab
- [Gateway-Protokollierung intern](/de/gateway/logging) — WS-Logstile, Subsystem-Präfixe und Konsolenerfassung
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Log-Flags
- [Diagnoseexport](/de/gateway/diagnostics) — Support-Bundle-Tool für Betreiber (getrennt vom OTEL-Export)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige Referenz der `diagnostics.*`-Felder
