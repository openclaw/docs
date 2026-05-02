---
read_when:
    - Sie möchten OpenClaw-Modellnutzung, Nachrichtenfluss oder Sitzungsmetriken an einen OpenTelemetry-Collector senden
    - Sie binden Traces, Metriken oder Logs an Grafana, Datadog, Honeycomb, New Relic, Tempo oder ein anderes OTLP-Backend an
    - Sie benötigen die genauen Metriknamen, Span-Namen oder Attributstrukturen, um Dashboards oder Alerts zu erstellen
summary: Exportieren Sie OpenClaw-Diagnosedaten über das diagnostics-otel-Plugin (OTLP/HTTP) an einen beliebigen OpenTelemetry-Collector
title: OpenTelemetry-Export
x-i18n:
    generated_at: "2026-05-02T20:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3287540a32b9b8400f227ab9400073e8145af89e5246e6af06945a96b751826f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exportiert Diagnosedaten über das offizielle `diagnostics-otel`-Plugin
mit **OTLP/HTTP (protobuf)**. Jeder Collector oder jedes Backend, das OTLP/HTTP
akzeptiert, funktioniert ohne Codeänderungen. Informationen zu lokalen Datei-Logs und dazu, wie Sie diese lesen, finden Sie unter
[Logging](/de/logging).

## Zusammenspiel

- **Diagnoseereignisse** sind strukturierte, prozessinterne Datensätze, die vom
  Gateway und gebündelten Plugins für Modellläufe, Nachrichtenfluss, Sitzungen, Warteschlangen
  und Exec ausgegeben werden.
- Das **`diagnostics-otel`-Plugin** abonniert diese Ereignisse und exportiert sie als
  OpenTelemetry-**Metriken**, **Traces** und **Logs** über OTLP/HTTP.
- **Provider-Aufrufe** erhalten einen W3C-`traceparent`-Header aus dem
  vertrauenswürdigen Modellaufruf-Span-Kontext von OpenClaw, wenn der Provider-Transport benutzerdefinierte
  Header akzeptiert. Von Plugins ausgegebener Trace-Kontext wird nicht weitergegeben.
- Exporter werden nur angebunden, wenn sowohl die Diagnoseoberfläche als auch das Plugin
  aktiviert sind. Dadurch bleiben die prozessinternen Kosten standardmäßig nahe null.

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

| Signal       | Inhalt                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metriken** | Zähler und Histogramme für Token-Nutzung, Kosten, Laufdauer, Nachrichtenfluss, Warteschlangen-Lanes, Sitzungsstatus, Exec und Speicherdruck.           |
| **Traces**   | Spans für Modellnutzung, Modellaufrufe, Harness-Lifecycle, Tool-Ausführung, Exec, Webhook-/Nachrichtenverarbeitung, Kontextaufbau und Tool-Schleifen. |
| **Logs**     | Strukturierte `logging.file`-Datensätze, die über OTLP exportiert werden, wenn `diagnostics.otel.logs` aktiviert ist.                                  |

Schalten Sie `traces`, `metrics` und `logs` unabhängig voneinander um. Alle drei sind standardmäßig aktiviert,
wenn `diagnostics.otel.enabled` `true` ist.

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
      protocol: "http/protobuf", // grpc wird ignoriert
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // Root-Span-Sampler, 0.0..1.0
      flushIntervalMs: 60000, // Metrik-Exportintervall (min. 1000ms)
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

| Variable                                                                                                          | Zweck                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Überschreibt `diagnostics.otel.endpoint`. Wenn der Wert bereits `/v1/traces`, `/v1/metrics` oder `/v1/logs` enthält, wird er unverändert verwendet.                                                                                                        |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signalspezifische Endpoint-Überschreibungen, die verwendet werden, wenn der passende Konfigurationsschlüssel `diagnostics.otel.*Endpoint` nicht gesetzt ist. Signalspezifische Konfiguration hat Vorrang vor signalspezifischer Env, die Vorrang vor dem gemeinsamen Endpoint hat. |
| `OTEL_SERVICE_NAME`                                                                                               | Überschreibt `diagnostics.otel.serviceName`.                                                                                                                                                                                                               |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Überschreibt das Übertragungsprotokoll (derzeit wird nur `http/protobuf` berücksichtigt).                                                                                                                                                                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Auf `gen_ai_latest_experimental` setzen, um das neueste experimentelle GenAI-Span-Attribut (`gen_ai.provider.name`) statt des Legacy-Attributs `gen_ai.system` auszugeben. GenAI-Metriken verwenden unabhängig davon immer begrenzte semantische Attribute mit niedriger Kardinalität. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Auf `1` setzen, wenn ein anderer Preload oder Host-Prozess bereits das globale OpenTelemetry-SDK registriert hat. Das Plugin überspringt dann seinen eigenen NodeSDK-Lifecycle, verdrahtet aber weiterhin Diagnose-Listener und berücksichtigt `traces`/`metrics`/`logs`. |

## Datenschutz und Inhaltserfassung

Rohinhalte von Modellen/Tools werden standardmäßig **nicht** exportiert. Spans enthalten begrenzte
Kennungen (Kanal, Provider, Modell, Fehlerkategorie, reine Hash-Anforderungs-IDs)
und enthalten niemals Prompt-Text, Antworttext, Tool-Eingaben, Tool-Ausgaben oder
Sitzungsschlüssel.

Ausgehende Modellanforderungen können einen W3C-`traceparent`-Header enthalten. Dieser Header wird
nur aus dem OpenClaw-eigenen Diagnose-Trace-Kontext für den aktiven Modellaufruf
generiert. Vorhandene vom Aufrufer bereitgestellte `traceparent`-Header werden ersetzt, sodass Plugins oder
benutzerdefinierte Provider-Optionen keine dienstübergreifende Trace-Abstammung vortäuschen können.

Setzen Sie `diagnostics.otel.captureContent.*` nur dann auf `true`, wenn Ihr Collector und
Ihre Aufbewahrungsrichtlinie für Prompt-, Antwort-, Tool- oder System-Prompt-
Text genehmigt sind. Jeder Unterschlüssel ist separat opt-in:

- `inputMessages` — Benutzer-Prompt-Inhalt.
- `outputMessages` — Modellantwort-Inhalt.
- `toolInputs` — Tool-Argument-Payloads.
- `toolOutputs` — Tool-Ergebnis-Payloads.
- `systemPrompt` — zusammengesetzter System-/Developer-Prompt.

Wenn ein Unterschlüssel aktiviert ist, erhalten Modell- und Tool-Spans nur für diese Klasse begrenzte, redigierte
`openclaw.content.*`-Attribute.

## Sampling und Flushing

- **Traces:** `diagnostics.otel.sampleRate` (nur Root-Span, `0.0` verwirft alle,
  `1.0` behält alle).
- **Metriken:** `diagnostics.otel.flushIntervalMs` (Minimum `1000`).
- **Logs:** OTLP-Logs berücksichtigen `logging.level` (Datei-Log-Level). Sie verwenden den
  Redaktionspfad für Diagnose-Logdatensätze, nicht die Konsolenformatierung. Installationen mit hohem Volumen
  sollten OTLP-Collector-Sampling/-Filterung gegenüber lokalem Sampling bevorzugen.
- **Datei-Log-Korrelation:** JSONL-Datei-Logs enthalten auf oberster Ebene `traceId`,
  `spanId`, `parentSpanId` und `traceFlags`, wenn der Log-Aufruf einen gültigen
  Diagnose-Trace-Kontext enthält. Dadurch können Log-Prozessoren lokale Log-Zeilen mit
  exportierten Spans verknüpfen.
- **Anforderungskorrelation:** Gateway-HTTP-Anforderungen und WebSocket-Frames erstellen einen
  internen Anforderungs-Trace-Scope. Logs und Diagnoseereignisse innerhalb dieses Scopes
  erben standardmäßig den Anforderungs-Trace, während Agentenlauf- und Modellaufruf-Spans als
  untergeordnete Elemente erstellt werden, damit Provider-`traceparent`-Header im selben Trace bleiben.

## Exportierte Metriken

### Modellnutzung

- `openclaw.tokens` (Zähler, Attribute: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (Zähler, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (Histogramm, Attribute: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (Histogramm, Metrik nach GenAI-Semantic-Conventions, Attribute: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (Histogramm, Sekunden, Metrik nach GenAI-Semantic-Conventions, Attribute: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (Histogramm, Attribute: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, zusätzlich `openclaw.errorCategory` und `openclaw.failureKind` bei klassifizierten Fehlern)
- `openclaw.model_call.request_bytes` (Histogramm, UTF-8-Byte-Größe des finalen Modellanforderungs-Payloads; kein Roh-Payload-Inhalt)
- `openclaw.model_call.response_bytes` (Histogramm, UTF-8-Byte-Größe gestreamter Modellantwortereignisse; kein Rohantwortinhalt)
- `openclaw.model_call.time_to_first_byte_ms` (Histogramm, verstrichene Zeit bis zum ersten gestreamten Antwortereignis)

### Nachrichtenfluss

- `openclaw.webhook.received` (Zähler, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (Zähler, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (Zähler, Attribute: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (Zähler, Attribute: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (Zähler, Attribute: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Warteschlangen und Sitzungen

- `openclaw.queue.lane.enqueue` (Zähler, Attribute: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (Zähler, Attribute: `openclaw.lane`)
- `openclaw.queue.depth` (Histogramm, Attribute: `openclaw.lane` oder `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (Histogramm, Attribute: `openclaw.lane`)
- `openclaw.session.state` (Zähler, Attribute: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (Zähler, Attribute: `openclaw.state`; nur für veraltete Sitzungsbuchhaltung ohne aktive Arbeit ausgegeben)
- `openclaw.session.stuck_age_ms` (Histogramm, Attribute: `openclaw.state`; nur für veraltete Sitzungsbuchhaltung ohne aktive Arbeit ausgegeben)
- `openclaw.run.attempt` (Zähler, Attribute: `openclaw.attempt`)

### Telemetrie zur Sitzungslebendigkeit

`diagnostics.stuckSessionWarnMs` ist der Altersgrenzwert ohne Fortschritt für Diagnosen zur
Sitzungslebendigkeit. Eine `processing`-Sitzung altert nicht in Richtung dieses Grenzwerts,
während OpenClaw Antwort-, Tool-, Status-, Block- oder ACP-Laufzeitfortschritt beobachtet.
Typing-Keepalives werden nicht als Fortschritt gezählt, sodass ein stilles Modell oder Harness
weiterhin erkannt werden kann.

OpenClaw klassifiziert Sitzungen nach der Arbeit, die es noch beobachten kann:

- `session.long_running`: aktive eingebettete Arbeit, Modellaufrufe oder Tool-Aufrufe
  machen weiterhin Fortschritt.
- `session.stalled`: aktive Arbeit ist vorhanden, aber der aktive Lauf hat
  in letzter Zeit keinen Fortschritt gemeldet.
- `session.stuck`: veraltete Sitzungsbuchhaltung ohne aktive Arbeit. Dies ist die
  einzige Liveness-Klassifizierung, die die betroffene Sitzungsspur freigibt.

Nur `session.stuck` gibt den Zähler `openclaw.session.stuck`, das
Histogramm `openclaw.session.stuck_age_ms` und den Span
`openclaw.session.stuck` aus. Wiederholte `session.stuck`-Diagnosen verwenden
Backoff, solange die Sitzung unverändert bleibt. Dashboards sollten daher auf
anhaltende Anstiege statt auf jeden Heartbeat-Tick alarmieren. Den
Konfigurationsregler und die Standardwerte finden Sie in der
[Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics).

### Harness-Lebenszyklus

- `openclaw.harness.duration_ms` (Histogramm, Attribute: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bei Fehlern)

### Exec

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
  - Bei Fehler: `openclaw.harness.phase`, `openclaw.errorCategory`, optional `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
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

Wenn die Inhaltserfassung ausdrücklich aktiviert ist, können Modell- und
Tool-Spans außerdem begrenzte, redigierte `openclaw.content.*`-Attribute für die
konkreten Inhaltsklassen enthalten, für die Sie sich entschieden haben.

## Katalog der Diagnoseereignisse

Die folgenden Ereignisse stützen die oben genannten Metriken und Spans. Plugins
können sie auch direkt ohne OTLP-Export abonnieren.

**Modellnutzung**

- `model.usage` — Token, Kosten, Dauer, Kontext, Provider/Modell/Kanal,
  Sitzungs-IDs. `usage` ist die Provider-/Turn-Abrechnung für Kosten und Telemetrie;
  `context.used` ist der aktuelle Prompt-/Kontext-Snapshot und kann niedriger sein als
  Provider-`usage.total`, wenn zwischengespeicherte Eingaben oder Tool-Schleifenaufrufe beteiligt sind.

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  Lebenszyklus pro Lauf für den Agent-Harness. Enthält `harnessId`, optional
  `pluginId`, Provider/Modell/Kanal und Lauf-ID. Der Abschluss ergänzt
  `durationMs`, `outcome`, optional `resultClassification`, `yieldDetected`
  und `itemLifecycle`-Zählungen. Fehler ergänzen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` und
  optional `cleanupFailed`.

**Exec**

- `exec.process.completed` — Terminal-Ergebnis, Dauer, Ziel, Modus, Exit-Code
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

Für gezielte Debug-Ausgaben ohne Erhöhung von `logging.level` verwenden Sie Diagnose-
Flags. Flags unterscheiden nicht zwischen Groß- und Kleinschreibung und unterstützen Wildcards (z. B. `telegram.*` oder
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

Flag-Ausgaben gehen in die Standard-Protokolldatei (`logging.file`) und werden weiterhin
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

## Verwandt

- [Logging](/de/logging) — Datei-Logs, Konsolenausgabe, CLI-Tailing und der Control-UI-Protokoll-Tab
- [Gateway-Logging-Interna](/de/gateway/logging) — WS-Log-Stile, Subsystem-Präfixe und Konsolenerfassung
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Log-Flags
- [Diagnoseexport](/de/gateway/diagnostics) — Support-Bundle-Tool für Betreiber (getrennt vom OTEL-Export)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#diagnostics) — vollständige `diagnostics.*`-Feldreferenz
