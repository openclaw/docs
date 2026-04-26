---
read_when:
    - Sie möchten OpenClaw-Modellnutzung, Nachrichtenfluss oder Sitzungsmetriken an einen OpenTelemetry-Collector senden.
    - Sie richten Traces, Metriken oder Logs in Grafana, Datadog, Honeycomb, New Relic, Tempo oder einem anderen OTLP-Backend ein.
    - Sie benötigen die genauen Namen von Metriken, Spans oder Attributformen, um Dashboards oder Warnungen zu erstellen.
summary: OpenClaw-Diagnosen über das Plugin diagnostics-otel an einen beliebigen OpenTelemetry-Collector exportieren (OTLP/HTTP)
title: OpenTelemetry-Export
x-i18n:
    generated_at: "2026-04-26T11:29:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw exportiert Diagnosen über das gebündelte Plugin `diagnostics-otel`
mit **OTLP/HTTP (protobuf)**. Jeder Collector oder jedes Backend, das OTLP/HTTP
akzeptiert, funktioniert ohne Codeänderungen. Zu lokalen Dateilogs und wie man sie liest, siehe
[Logging](/de/logging).

## Wie das zusammenpasst

- **Diagnoseereignisse** sind strukturierte In-Process-Datensätze, die vom
  Gateway und gebündelten Plugins für Modellläufe, Nachrichtenfluss, Sitzungen, Queues
  und Exec ausgegeben werden.
- Das Plugin **`diagnostics-otel`** abonniert diese Ereignisse und exportiert sie als
  OpenTelemetry-**Metriken**, **Traces** und **Logs** über OTLP/HTTP.
- **Provider-Aufrufe** erhalten einen W3C-`traceparent`-Header aus OpenClaws
  vertrauenswürdigem Span-Kontext des Modellaufrufs, wenn der Provider-Transport benutzerdefinierte
  Header akzeptiert. Von Plugins ausgegebener Trace-Kontext wird nicht propagiert.
- Exporter werden nur angehängt, wenn sowohl die Diagnoseoberfläche als auch das Plugin
  aktiviert sind, sodass die In-Process-Kosten standardmäßig nahezu null bleiben.

## Schnellstart

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

| Signal      | Was darin enthalten ist                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Metriken** | Zähler und Histogramme für Token-Nutzung, Kosten, Laufdauer, Nachrichtenfluss, Queue-Lanes, Sitzungszustand, Exec und Speicherdruck.     |
| **Traces**  | Spans für Modellnutzung, Modellaufrufe, Harness-Lebenszyklus, Tool-Ausführung, Exec, Webhook-/Nachrichtenverarbeitung, Kontextaufbau und Tool-Schleifen. |
| **Logs**    | Strukturierte `logging.file`-Datensätze, die über OTLP exportiert werden, wenn `diagnostics.otel.logs` aktiviert ist.                    |

Sie können `traces`, `metrics` und `logs` unabhängig voneinander umschalten. Alle drei sind standardmäßig aktiviert,
wenn `diagnostics.otel.enabled` auf true gesetzt ist.

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
      flushIntervalMs: 60000, // Metrik-Exportintervall (min. 1000 ms)
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

| Variable                                                                                                          | Zweck                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Überschreibt `diagnostics.otel.endpoint`. Wenn der Wert bereits `/v1/traces`, `/v1/metrics` oder `/v1/logs` enthält, wird er unverändert verwendet.                                                                                     |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signalspezifische Endpunkt-Überschreibungen, die verwendet werden, wenn der passende Konfigurationsschlüssel `diagnostics.otel.*Endpoint` nicht gesetzt ist. Signalspezifische Konfiguration gewinnt vor signalspezifischer env, die wiederum vor dem gemeinsamen Endpunkt gewinnt. |
| `OTEL_SERVICE_NAME`                                                                                               | Überschreibt `diagnostics.otel.serviceName`.                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Überschreibt das Wire-Protokoll (derzeit wird nur `http/protobuf` berücksichtigt).                                                                                                                                                       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Auf `gen_ai_latest_experimental` setzen, um statt des Legacy-Attributs `gen_ai.system` das neueste experimentelle GenAI-Span-Attribut (`gen_ai.provider.name`) auszugeben. GenAI-Metriken verwenden unabhängig davon immer begrenzte semantische Attribute mit niedriger Kardinalität. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Auf `1` setzen, wenn ein anderer Preload oder Host-Prozess das globale OpenTelemetry-SDK bereits registriert hat. Das Plugin überspringt dann seinen eigenen NodeSDK-Lebenszyklus, verdrahtet aber weiterhin Diagnose-Listener und berücksichtigt `traces`/`metrics`/`logs`. |

## Datenschutz und Inhaltserfassung

Rohe Modell-/Tool-Inhalte werden standardmäßig **nicht** exportiert. Spans tragen begrenzte
Kennungen (Channel, Provider, Modell, Fehlerkategorie, nur Hashes von Request-IDs)
und enthalten niemals Prompt-Text, Antworttext, Tool-Eingaben, Tool-Ausgaben oder
Sitzungsschlüssel.

Ausgehende Modellanfragen können einen W3C-`traceparent`-Header enthalten. Dieser Header wird
nur aus OpenClaw-eigenem diagnostischem Trace-Kontext für den aktiven Modellaufruf erzeugt.
Bereits vom Aufrufer bereitgestellte `traceparent`-Header werden ersetzt, sodass Plugins oder
benutzerdefinierte Provider-Optionen dienstübergreifende Trace-Abstammung nicht vortäuschen können.

Setzen Sie `diagnostics.otel.captureContent.*` nur dann auf `true`, wenn Ihr Collector und
Ihre Aufbewahrungsrichtlinie für Prompt-, Antwort-, Tool- oder System-Prompt-Text
freigegeben sind. Jeder Unterschlüssel ist unabhängig opt-in:

- `inputMessages` — Inhalt von Benutzer-Prompts.
- `outputMessages` — Inhalt von Modellantworten.
- `toolInputs` — Payloads von Tool-Argumenten.
- `toolOutputs` — Payloads von Tool-Ergebnissen.
- `systemPrompt` — zusammengebauter System-/Developer-Prompt.

Wenn ein beliebiger Unterschlüssel aktiviert ist, erhalten Modell- und Tool-Spans begrenzte, redigierte
Attribute `openclaw.content.*` nur für diese Klasse.

## Sampling und Flush

- **Traces:** `diagnostics.otel.sampleRate` (nur Root-Span, `0.0` verwirft alle,
  `1.0` behält alle).
- **Metriken:** `diagnostics.otel.flushIntervalMs` (mindestens `1000`).
- **Logs:** OTLP-Logs berücksichtigen `logging.level` (Dateilog-Level). Konsolen-
  Redaktion gilt **nicht** für OTLP-Logs. Installationen mit hohem Volumen sollten
  OTLP-Collector-Sampling/-Filterung gegenüber lokalem Sampling bevorzugen.

## Exportierte Metriken

### Modellnutzung

- `openclaw.tokens` (Zähler, Attribute: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (Zähler, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (Histogramm, Attribute: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (Histogramm, GenAI-Semantic-Conventions-Metrik, Attribute: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (Histogramm, Sekunden, GenAI-Semantic-Conventions-Metrik, Attribute: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)

### Nachrichtenfluss

- `openclaw.webhook.received` (Zähler, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (Zähler, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (Zähler, Attribute: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (Zähler, Attribute: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (Zähler, Attribute: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (Histogramm, Attribute: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Queues und Sitzungen

- `openclaw.queue.lane.enqueue` (Zähler, Attribute: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (Zähler, Attribute: `openclaw.lane`)
- `openclaw.queue.depth` (Histogramm, Attribute: `openclaw.lane` oder `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (Histogramm, Attribute: `openclaw.lane`)
- `openclaw.session.state` (Zähler, Attribute: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (Zähler, Attribute: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (Histogramm, Attribute: `openclaw.state`)
- `openclaw.run.attempt` (Zähler, Attribute: `openclaw.attempt`)

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
  - `openclaw.tokens.*` (`input`/`output`/`cache_read`/`cache_write`/`total`)
  - standardmäßig `gen_ai.system` oder `gen_ai.provider.name`, wenn die neuesten GenAI Semantic Conventions aktiviert sind
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - standardmäßig `gen_ai.system` oder `gen_ai.provider.name`, wenn die neuesten GenAI Semantic Conventions aktiviert sind
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (begrenzter SHA-basierter Hash der Upstream-Provider-Request-ID; rohe IDs werden nicht exportiert)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Bei Abschluss: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Bei Fehlern: `openclaw.harness.phase`, `openclaw.errorCategory`, optional `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (kein Prompt-, Verlaufs-, Antwort- oder Sitzungsschlüssel-Inhalt)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (keine Schleifennachrichten, Parameter oder Tool-Ausgabe)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wenn Inhaltserfassung ausdrücklich aktiviert ist, können Modell- und Tool-Spans zusätzlich
begrenzte, redigierte `openclaw.content.*`-Attribute für die konkreten
Inhaltsklassen enthalten, für die Sie sich entschieden haben.

## Katalog diagnostischer Ereignisse

Die folgenden Ereignisse bilden die Grundlage für die oben genannten Metriken und Spans. Plugins können sie auch direkt abonnieren, ohne OTLP-Export.

**Modellnutzung**

- `model.usage` — Tokens, Kosten, Dauer, Kontext, Provider/Modell/Channel,
  Sitzungs-IDs. `usage` ist die Provider-/Turn-Abrechnung für Kosten und Telemetrie;
  `context.used` ist der aktuelle Prompt-/Kontext-Snapshot und kann niedriger sein als
  `usage.total` des Providers, wenn gecachte Eingaben oder Tool-Loop-Aufrufe beteiligt sind.

**Nachrichtenfluss**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Queue und Sitzung**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (aggregierte Zähler: Webhooks/Queue/Sitzung)

**Harness-Lebenszyklus**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  Lebenszyklus pro Lauf für das Agent-Harness. Enthält `harnessId`, optional
  `pluginId`, Provider/Modell/Channel und Lauf-ID. Abschluss ergänzt
  `durationMs`, `outcome`, optional `resultClassification`, `yieldDetected`
  und `itemLifecycle`-Zählwerte. Fehler ergänzen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` und
  optional `cleanupFailed`.

**Exec**

- `exec.process.completed` — endgültiges Ergebnis, Dauer, Ziel, Modus, Exit-
  Code und Fehlerart. Befehlstext und Arbeitsverzeichnisse sind nicht
  enthalten.

## Ohne Exporter

Sie können Diagnoseereignisse für Plugins oder benutzerdefinierte Senken verfügbar halten, ohne
`diagnostics-otel` auszuführen:

```json5
{
  diagnostics: { enabled: true },
}
```

Für gezielte Debug-Ausgabe, ohne `logging.level` anzuheben, verwenden Sie Diagnose-
Flags. Flags sind nicht case-sensitive und unterstützen Wildcards (z. B. `telegram.*` oder
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Oder als einmalige env-Überschreibung:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Die Ausgabe von Flags geht in die Standard-Logdatei (`logging.file`) und wird weiterhin
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

- [Logging](/de/logging) — Dateilogs, Konsolenausgabe, CLI-Tailing und der Logs-Tab der Control UI
- [Gateway-Logging-Interna](/de/gateway/logging) — WS-Log-Stile, Subsystem-Präfixe und Konsolenerfassung
- [Diagnose-Flags](/de/diagnostics/flags) — gezielte Debug-Log-Flags
- [Diagnostics Export](/de/gateway/diagnostics) — Support-Bundle-Tool für Operatoren (getrennt vom OTEL-Export)
- [Configuration reference](/de/gateway/configuration-reference#diagnostics) — vollständige Feldreferenz für `diagnostics.*`
