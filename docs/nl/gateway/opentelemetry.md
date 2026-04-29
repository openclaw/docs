---
read_when:
    - Je wilt OpenClaw-modelgebruik, de berichtenstroom of sessiemetrieken naar een OpenTelemetry-collector sturen
    - Je sluit traces, metrieken of logs aan op Grafana, Datadog, Honeycomb, New Relic, Tempo of een andere OTLP-backend
    - Je hebt de exacte metricnamen, spannamen of attribuutstructuren nodig om dashboards of waarschuwingen te bouwen
summary: Exporteer OpenClaw-diagnostiek naar elke OpenTelemetry-collector via de diagnostics-otel Plugin (OTLP/HTTP)
title: OpenTelemetry-export
x-i18n:
    generated_at: "2026-04-29T22:46:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporteert diagnostiek via de gebundelde `diagnostics-otel` Plugin
met **OTLP/HTTP (protobuf)**. Elke collector of backend die OTLP/HTTP
accepteert, werkt zonder codewijzigingen. Zie
[Logging](/nl/logging) voor lokale bestandslogs en hoe je die leest.

## Hoe het samenwerkt

- **Diagnostische gebeurtenissen** zijn gestructureerde, in-process records die worden uitgezonden door de
  Gateway en gebundelde plugins voor modelruns, berichtstroom, sessies, wachtrijen,
  en exec.
- **`diagnostics-otel` Plugin** abonneert zich op die gebeurtenissen en exporteert ze als
  OpenTelemetry **metrics**, **traces** en **logs** via OTLP/HTTP.
- **Provider-aanroepen** ontvangen een W3C `traceparent`-header van OpenClaw's
  vertrouwde spancontext voor modelaanroepen wanneer het providertransport aangepaste
  headers accepteert. Door plugins uitgezonden tracecontext wordt niet doorgegeven.
- Exporters worden alleen gekoppeld wanneer zowel het diagnostische oppervlak als de Plugin
  zijn ingeschakeld, zodat de in-process kosten standaard bijna nul blijven.

## Snel starten

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

Je kunt de Plugin ook inschakelen vanuit de CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` ondersteunt momenteel alleen `http/protobuf`. `grpc` wordt genegeerd.
</Note>

## Geëxporteerde signalen

| Signaal     | Wat erin gaat                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Tellers en histogrammen voor tokengebruik, kosten, runduur, berichtstroom, wachtrijlanes, sessiestatus, exec en geheugendruk.                |
| **Traces**  | Spans voor modelgebruik, modelaanroepen, harness-levenscyclus, tooluitvoering, exec, Webhook-/berichtverwerking, contextopbouw en toollussen. |
| **Logs**    | Gestructureerde `logging.file`-records die via OTLP worden geëxporteerd wanneer `diagnostics.otel.logs` is ingeschakeld.                     |

Schakel `traces`, `metrics` en `logs` onafhankelijk in of uit. Alle drie staan standaard aan
wanneer `diagnostics.otel.enabled` true is.

## Configuratiereferentie

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

### Omgevingsvariabelen

| Variabele                                                                                                         | Doel                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Overschrijft `diagnostics.otel.endpoint`. Als de waarde al `/v1/traces`, `/v1/metrics` of `/v1/logs` bevat, wordt die ongewijzigd gebruikt.                                                                                                    |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signaalspecifieke endpoint-overschrijvingen die worden gebruikt wanneer de bijpassende configuratiesleutel `diagnostics.otel.*Endpoint` niet is ingesteld. Signaalspecifieke configuratie wint van signaalspecifieke env, die wint van het gedeelde endpoint. |
| `OTEL_SERVICE_NAME`                                                                                               | Overschrijft `diagnostics.otel.serviceName`.                                                                                                                                                                                                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Overschrijft het wire-protocol (alleen `http/protobuf` wordt vandaag gehonoreerd).                                                                                                                                                              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Stel in op `gen_ai_latest_experimental` om het nieuwste experimentele GenAI-spanattribuut (`gen_ai.provider.name`) uit te zenden in plaats van de legacy `gen_ai.system`. GenAI-metrics gebruiken altijd begrensde semantische attributen met lage cardinaliteit. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Stel in op `1` wanneer een andere preload of hostproces de globale OpenTelemetry SDK al heeft geregistreerd. De Plugin slaat dan zijn eigen NodeSDK-levenscyclus over, maar koppelt nog steeds diagnostische listeners en respecteert `traces`/`metrics`/`logs`. |

## Privacy en inhoudsvastlegging

Ruwe model-/toolinhoud wordt standaard **niet** geëxporteerd. Spans dragen begrensde
identifiers (kanaal, provider, model, foutcategorie, request-id's alleen als hash)
en bevatten nooit prompttekst, antwoordtekst, toolinvoer, tooluitvoer of
sessiesleutels.

Uitgaande modelrequests kunnen een W3C `traceparent`-header bevatten. Die header wordt
alleen gegenereerd vanuit OpenClaw-eigen diagnostische tracecontext voor de actieve modelaanroep.
Bestaande door de caller aangeleverde `traceparent`-headers worden vervangen, zodat plugins of
aangepaste provideropties cross-service trace-afkomst niet kunnen spoofen.

Stel `diagnostics.otel.captureContent.*` alleen in op `true` wanneer je collector en
retentiebeleid zijn goedgekeurd voor prompt-, antwoord-, tool- of systeemprompttekst.
Elke subsleutel is onafhankelijk opt-in:

- `inputMessages` — inhoud van gebruikersprompt.
- `outputMessages` — inhoud van modelantwoord.
- `toolInputs` — payloads van toolargumenten.
- `toolOutputs` — payloads van toolresultaten.
- `systemPrompt` — samengestelde systeem-/developerprompt.

Wanneer een subsleutel is ingeschakeld, krijgen model- en toolspans begrensde, geredigeerde
`openclaw.content.*`-attributen alleen voor die klasse.

## Sampling en flushen

- **Traces:** `diagnostics.otel.sampleRate` (alleen root-span, `0.0` dropt alles,
  `1.0` behoudt alles).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** OTLP-logs respecteren `logging.level` (bestandslogniveau). Ze gebruiken het
  redactiepad voor diagnostische logrecords, niet console-opmaak. Installaties met hoog volume
  moeten liever OTLP collector-sampling/-filtering gebruiken dan lokale sampling.
- **Bestandslogcorrelatie:** JSONL-bestandslogs bevatten op topniveau `traceId`,
  `spanId`, `parentSpanId` en `traceFlags` wanneer de logaanroep een geldige
  diagnostische tracecontext draagt, waardoor logprocessors lokale logregels kunnen koppelen aan
  geëxporteerde spans.
- **Requestcorrelatie:** Gateway-HTTP-requests en WebSocket-frames maken een
  interne request-tracescope. Logs en diagnostische gebeurtenissen binnen die scope
  erven standaard de requesttrace, terwijl agentrun- en modelaanroep-spans als kinderen worden
  gemaakt, zodat provider-`traceparent`-headers op dezelfde trace blijven.

## Geëxporteerde metrics

### Modelgebruik

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconden, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optioneel `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` en `openclaw.failureKind` bij geclassificeerde fouten)
- `openclaw.model_call.request_bytes` (histogram, UTF-8-bytegrootte van de uiteindelijke modelrequestpayload; geen ruwe payloadinhoud)
- `openclaw.model_call.response_bytes` (histogram, UTF-8-bytegrootte van gestreamde modelantwoordgebeurtenissen; geen ruwe antwoordinhoud)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, verstreken tijd vóór de eerste gestreamde antwoordgebeurtenis)

### Berichtstroom

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Wachtrijen en sessies

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` of `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Harness-levenscyclus

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bij fouten)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnostiek-internals (geheugen en toollus)

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Geëxporteerde spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (invoer/uitvoer/cache_read/cache_write/totaal)
  - standaard `gen_ai.system`, of `gen_ai.provider.name` wanneer de nieuwste semantische conventies van GenAI zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - standaard `gen_ai.system`, of `gen_ai.provider.name` wanneer de nieuwste semantische conventies van GenAI zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` en optioneel `openclaw.failureKind` bij fouten
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (begrensde SHA-gebaseerde hash van de request-id van de upstream-provider; ruwe id's worden niet geëxporteerd)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Bij voltooiing: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Bij fout: `openclaw.harness.phase`, `openclaw.errorCategory`, optioneel `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (geen prompt-, geschiedenis-, reactie- of sessiesleutelinhoud)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (geen loopberichten, parameters of tooluitvoer)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wanneer inhoudsvastlegging expliciet is ingeschakeld, kunnen model- en toolspans ook
begrensde, geredigeerde `openclaw.content.*`-attributen bevatten voor de specifieke
inhoudsklassen waarvoor je hebt gekozen.

## Catalogus met diagnostische gebeurtenissen

De onderstaande gebeurtenissen ondersteunen de bovenstaande metrieken en spans. Plugins kunnen zich er ook
direct op abonneren zonder OTLP-export.

**Modelgebruik**

- `model.usage` — tokens, kosten, duur, context, provider/model/kanaal,
  sessie-id's. `usage` is provider-/turnboekhouding voor kosten en telemetrie;
  `context.used` is de huidige prompt-/contextsnapshot en kan lager zijn dan
  provider `usage.total` wanneer gecachte invoer of tool-loop-aanroepen betrokken zijn.

**Berichtenstroom**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Wachtrij en sessie**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (geaggregeerde tellers: webhooks/wachtrij/sessie)

**Harness-levenscyclus**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  levenscyclus per run voor de agent-harness. Bevat `harnessId`, optioneel
  `pluginId`, provider/model/kanaal en run-id. Voltooiing voegt
  `durationMs`, `outcome`, optioneel `resultClassification`, `yieldDetected`,
  en `itemLifecycle`-aantallen toe. Fouten voegen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` en
  optioneel `cleanupFailed` toe.

**Exec**

- `exec.process.completed` — terminale uitkomst, duur, doel, modus, exitcode
  en soort storing. Commandotekst en werkmappen worden niet
  opgenomen.

## Zonder exporteur

Je kunt diagnostische gebeurtenissen beschikbaar houden voor plugins of aangepaste sinks zonder
`diagnostics-otel` uit te voeren:

```json5
{
  diagnostics: { enabled: true },
}
```

Gebruik diagnostische vlaggen voor gerichte debuguitvoer zonder `logging.level` te verhogen.
Vlaggen zijn hoofdletterongevoelig en ondersteunen jokertekens (bijv. `telegram.*` of
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Of als een eenmalige env-overschrijving:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Vlaguitvoer gaat naar het standaardlogbestand (`logging.file`) en wordt nog steeds
geredigeerd door `logging.redactSensitive`. Volledige handleiding:
[Diagnostische vlaggen](/nl/diagnostics/flags).

## Uitschakelen

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Je kunt `diagnostics-otel` ook buiten `plugins.allow` laten, of
`openclaw plugins disable diagnostics-otel` uitvoeren.

## Gerelateerd

- [Logregistratie](/nl/logging) — bestandslogs, console-uitvoer, CLI-tailing en het tabblad Logs in de Control UI
- [Interne logregistratie van Gateway](/nl/gateway/logging) — WS-logstijlen, subsysteemprefixen en consolevastlegging
- [Diagnostische vlaggen](/nl/diagnostics/flags) — gerichte debuglogvlaggen
- [Diagnostische export](/nl/gateway/diagnostics) — supportbundeltool voor operators (los van OTEL-export)
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige veldreferentie voor `diagnostics.*`
