---
read_when:
    - Je wilt OpenClaw-modelgebruik, berichtenstroom of sessiemetrieken naar een OpenTelemetry-collector sturen
    - Je koppelt traceringen, metrische gegevens of logboeken aan Grafana, Datadog, Honeycomb, New Relic, Tempo of een andere OTLP-backend
    - Je hebt de exacte metrieknamen, spannamen of attribuutstructuren nodig om dashboards of waarschuwingen te bouwen
summary: Exporteer OpenClaw-diagnostiek naar elke OpenTelemetry collector via de diagnostics-otel Plugin (OTLP/HTTP)
title: OpenTelemetry-export
x-i18n:
    generated_at: "2026-05-05T06:17:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5030b8b16624f114e31838d3a055c24e8a23a6c77d63495a445cb9f2e227b6a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporteert diagnostics via de officiële `diagnostics-otel` plugin
met **OTLP/HTTP (protobuf)**. Elke collector of backend die OTLP/HTTP
accepteert, werkt zonder codewijzigingen. Zie voor lokale bestandslogs en hoe je
ze leest [Logging](/nl/logging).

## Hoe het samenhangt

- **Diagnostic-events** zijn gestructureerde records binnen het proces die worden uitgezonden door de
  Gateway en gebundelde plugins voor modelruns, berichtstroom, sessies, wachtrijen
  en exec.
- De **`diagnostics-otel` plugin** abonneert zich op die events en exporteert ze als
  OpenTelemetry **metrics**, **traces** en **logs** via OTLP/HTTP.
- **Provider-calls** ontvangen een W3C `traceparent` header uit OpenClaw's
  vertrouwde span-context voor model-calls wanneer het providertransport aangepaste
  headers accepteert. Door plugins uitgezonden trace-context wordt niet doorgegeven.
- Exporters worden alleen gekoppeld wanneer zowel het diagnostics-oppervlak als de plugin
  zijn ingeschakeld, waardoor de kosten binnen het proces standaard vrijwel nul blijven.

## Snelstart

Installeer bij packaged installaties eerst de plugin:

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

Je kunt de plugin ook inschakelen via de CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` ondersteunt momenteel alleen `http/protobuf`. `grpc` wordt genegeerd.
</Note>

## Geëxporteerde signalen

| Signaal     | Wat erin gaat                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | Counters en histogrammen voor tokengebruik, kosten, run-duur, berichtstroom, wachtrijlanes, sessiestatus, exec en geheugendruk.           |
| **Traces**  | Spans voor modelgebruik, model-calls, harness-levenscyclus, tooluitvoering, exec, Webhook-/berichtverwerking, contextopbouw en toollussen. |
| **Logs**    | Gestructureerde `logging.file` records die via OTLP worden geëxporteerd wanneer `diagnostics.otel.logs` is ingeschakeld.                   |

Schakel `traces`, `metrics` en `logs` onafhankelijk van elkaar in of uit. Alle drie staan standaard aan
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

| Variabele                                                                                                         | Doel                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Overschrijft `diagnostics.otel.endpoint`. Als de waarde al `/v1/traces`, `/v1/metrics` of `/v1/logs` bevat, wordt die ongewijzigd gebruikt.                                                                                                |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signaalspecifieke endpoint-overschrijvingen die worden gebruikt wanneer de bijbehorende `diagnostics.otel.*Endpoint` configuratiesleutel niet is ingesteld. Signaalspecifieke configuratie wint van signaalspecifieke env, die wint van het gedeelde endpoint. |
| `OTEL_SERVICE_NAME`                                                                                               | Overschrijft `diagnostics.otel.serviceName`.                                                                                                                                                                                               |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Overschrijft het wire-protocol (alleen `http/protobuf` wordt vandaag gerespecteerd).                                                                                                                                                       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Stel in op `gen_ai_latest_experimental` om het nieuwste experimentele GenAI span-attribuut (`gen_ai.provider.name`) uit te zenden in plaats van het legacy `gen_ai.system`. GenAI metrics gebruiken altijd begrensde semantische attributen met lage cardinaliteit. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Stel in op `1` wanneer een andere preload of hostproces de globale OpenTelemetry SDK al heeft geregistreerd. De plugin slaat dan zijn eigen NodeSDK-levenscyclus over, maar koppelt nog steeds diagnostic-listeners en respecteert `traces`/`metrics`/`logs`. |

## Privacy en contentvastlegging

Ruwe model-/toolcontent wordt standaard **niet** geëxporteerd. Spans bevatten begrensde
identifiers (kanaal, provider, model, foutcategorie, request-id's met alleen hashes)
en bevatten nooit prompttekst, responstekst, toolinputs, tooloutputs of
sessiesleutels.

Uitgaande modelrequests kunnen een W3C `traceparent` header bevatten. Die header wordt
alleen gegenereerd vanuit OpenClaw-eigen diagnostic trace-context voor de actieve model-call.
Bestaande door de caller aangeleverde `traceparent` headers worden vervangen, zodat plugins of
aangepaste provideropties cross-service trace-afstamming niet kunnen spoofen.

Stel `diagnostics.otel.captureContent.*` alleen in op `true` wanneer je collector en
retentiebeleid zijn goedgekeurd voor prompt-, response-, tool- of system-prompt-
tekst. Elke subsleutel is afzonderlijk opt-in:

- `inputMessages` — inhoud van gebruikersprompt.
- `outputMessages` — inhoud van modelresponse.
- `toolInputs` — payloads van toolargumenten.
- `toolOutputs` — payloads van toolresultaten.
- `systemPrompt` — samengestelde system-/developer-prompt.

Wanneer een subsleutel is ingeschakeld, krijgen model- en toolspans alleen voor die klasse begrensde, geredigeerde
`openclaw.content.*` attributen.

## Sampling en flushing

- **Traces:** `diagnostics.otel.sampleRate` (alleen root-span, `0.0` laat alles vallen,
  `1.0` behoudt alles).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** OTLP-logs respecteren `logging.level` (bestandslogniveau). Ze gebruiken het
  redactietraject voor diagnostic log-records, niet consoleformattering. Installaties met hoge volumes
  moeten de voorkeur geven aan sampling/filtering in de OTLP collector boven lokale sampling.
- **Bestandslogcorrelatie:** JSONL-bestandslogs bevatten top-level `traceId`,
  `spanId`, `parentSpanId` en `traceFlags` wanneer de log-call een geldige
  diagnostic trace-context bevat, waardoor logprocessors lokale logregels kunnen koppelen aan
  geëxporteerde spans.
- **Requestcorrelatie:** Gateway HTTP-requests en WebSocket-frames maken een
  intern request-tracebereik. Logs en diagnostic-events binnen dat bereik
  erven standaard de request-trace, terwijl agent-run- en model-call-spans als
  children worden gemaakt zodat provider-`traceparent` headers op dezelfde trace blijven.

## Geëxporteerde metrics

### Modelgebruik

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconden, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optioneel `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` en `openclaw.failureKind` bij geclassificeerde fouten)
- `openclaw.model_call.request_bytes` (histogram, UTF-8-bytegrootte van de uiteindelijke payload van de modelrequest; geen ruwe payloadcontent)
- `openclaw.model_call.response_bytes` (histogram, UTF-8-bytegrootte van gestreamde modelresponse-events; geen ruwe responsecontent)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, verstreken tijd vóór het eerste gestreamde response-event)

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
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; alleen uitgezonden voor stale sessieboekhouding zonder actief werk)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; alleen uitgezonden voor stale sessieboekhouding zonder actief werk)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetrie voor sessie-liveness

`diagnostics.stuckSessionWarnMs` is de leeftijdsdrempel zonder voortgang voor session
liveness-diagnostics. Een `processing` sessie loopt niet op richting deze drempel
terwijl OpenClaw reply-, tool-, status-, block- of ACP-runtimevoortgang observeert.
Typing-keepalives tellen niet als voortgang, dus een stil model of harness kan
nog steeds worden gedetecteerd.

OpenClaw classificeert sessies op basis van het werk dat het nog kan observeren:

- `session.long_running`: actief ingebed werk, modelaanroepen of toolaanroepen
  boeken nog steeds voortgang.
- `session.stalled`: actief werk bestaat, maar de actieve run heeft geen
  recente voortgang gemeld. Vastgelopen ingebedde runs blijven eerst alleen observeren en gaan daarna
  na `diagnostics.stuckSessionAbortMs` zonder voortgang naar abort-drain, zodat in de wachtrij geplaatste
  turns achter de lane kunnen worden hervat. Als dit niet is ingesteld, gebruikt de afbreekdrempel standaard
  het veiligere verlengde venster van ten minste 10 minuten en 5x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: verouderde sessieboekhouding zonder actief werk. Dit geeft
  de betrokken sessielane onmiddellijk vrij.

Herstel zendt gestructureerde events `session.recovery.requested` en
`session.recovery.completed` uit. De diagnostische sessiestatus wordt alleen als idle gemarkeerd
na een muterend herstelresultaat (`aborted` of `released`) en alleen als dezelfde
verwerkingsgeneratie nog steeds actueel is.

Alleen `session.stuck` zendt de teller `openclaw.session.stuck`, het
histogram `openclaw.session.stuck_age_ms` en de span `openclaw.session.stuck`
uit. Herhaalde `session.stuck`-diagnostiek verlaagt de frequentie zolang de sessie
ongewijzigd blijft, dus dashboards zouden moeten waarschuwen bij aanhoudende stijgingen in plaats van bij elke
Heartbeat-tick. Zie voor de configuratieknop en standaardwaarden de
[Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics).

### Harness-levenscyclus

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bij fouten)

### Uitvoering

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnostische internals (geheugen en tool-loop)

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (teller, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (teller, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Geëxporteerde spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` standaard, of `gen_ai.provider.name` wanneer de nieuwste semantische GenAI-conventies zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` standaard, of `gen_ai.provider.name` wanneer de nieuwste semantische GenAI-conventies zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` en optioneel `openclaw.failureKind` bij fouten
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (begrensde SHA-gebaseerde hash van de request-id van de upstreamprovider; ruwe id's worden niet geëxporteerd)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Bij voltooiing: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Bij fout: `openclaw.harness.phase`, `openclaw.errorCategory`, optioneel `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (geen prompt-, geschiedenis-, respons- of session-key-inhoud)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (geen loopberichten, params of tooluitvoer)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wanneer contentvastlegging expliciet is ingeschakeld, kunnen model- en toolspans ook
begrensde, geredigeerde `openclaw.content.*`-attributen bevatten voor de specifieke
contentklassen waarvoor je hebt gekozen.

## Catalogus met diagnostische events

De onderstaande events ondersteunen de metrics en spans hierboven. Plugins kunnen zich er ook
rechtstreeks op abonneren zonder OTLP-export.

**Modelgebruik**

- `model.usage` — tokens, kosten, duur, context, provider/model/channel,
  sessie-id's. `usage` is provider-/turnboekhouding voor kosten en telemetrie;
  `context.used` is de huidige prompt-/contextsnapshot en kan lager zijn dan
  provider `usage.total` wanneer gecachte input of tool-loop-aanroepen betrokken zijn.

**Berichtenstroom**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Wachtrij en sessie**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (geaggregeerde tellers: Webhooks/wachtrij/sessie)

**Harness-levenscyclus**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  levenscyclus per run voor de agent-harness. Bevat `harnessId`, optioneel
  `pluginId`, provider/model/channel en run-id. Voltooiing voegt
  `durationMs`, `outcome`, optioneel `resultClassification`, `yieldDetected`,
  en `itemLifecycle`-aantallen toe. Fouten voegen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` en
  optioneel `cleanupFailed` toe.

**Uitvoering**

- `exec.process.completed` — terminaal resultaat, duur, doel, modus, exitcode
  en foutsoort. Commandotekst en werkmappen worden niet
  opgenomen.

## Zonder exporter

Je kunt diagnostische events beschikbaar houden voor Plugins of aangepaste sinks zonder
`diagnostics-otel` uit te voeren:

```json5
{
  diagnostics: { enabled: true },
}
```

Gebruik diagnostische vlaggen voor gerichte debuguitvoer zonder `logging.level` te verhogen.
Vlaggen zijn hoofdletterongevoelig en ondersteunen wildcards (bijv. `telegram.*` of
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Of als eenmalige env-override:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Vlaguitvoer gaat naar het standaard logbestand (`logging.file`) en wordt nog steeds
geredigeerd door `logging.redactSensitive`. Volledige gids:
[Diagnostische vlaggen](/nl/diagnostics/flags).

## Uitschakelen

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Je kunt `diagnostics-otel` ook weglaten uit `plugins.allow`, of
`openclaw plugins disable diagnostics-otel` uitvoeren.

## Gerelateerd

- [Logboekregistratie](/nl/logging) — bestandslogs, console-uitvoer, CLI-tailing en het tabblad Control UI Logs
- [Interne Gateway-logboekregistratie](/nl/gateway/logging) — WS-logstijlen, subsysteemprefixen en consolevastlegging
- [Diagnostische vlaggen](/nl/diagnostics/flags) — gerichte debug-logvlaggen
- [Diagnostische export](/nl/gateway/diagnostics) — operator-supportbundeltool (los van OTEL-export)
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige `diagnostics.*`-veldreferentie
