---
read_when:
    - Je wilt OpenClaw-modelgebruik, berichtstromen of sessiemetrieken naar een OpenTelemetry-collector sturen
    - Je koppelt traces, metrieken of logs aan Grafana, Datadog, Honeycomb, New Relic, Tempo of een andere OTLP-backend
    - Je hebt de exacte namen van metrieken, namen van spans of attribuutstructuren nodig om dashboards of waarschuwingen te bouwen
summary: Exporteer OpenClaw-diagnostiek naar elke OpenTelemetry-collector via de diagnostics-otel-Plugin (OTLP/HTTP)
title: OpenTelemetry-export
x-i18n:
    generated_at: "2026-05-06T11:28:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporteert diagnostiek via de officiële `diagnostics-otel` plugin
met **OTLP/HTTP (protobuf)**. Elke collector of backend die OTLP/HTTP
accepteert, werkt zonder codewijzigingen. Zie
[Logging](/nl/logging) voor lokale bestandslogs en hoe je ze leest.

## Hoe het samenhangt

- **Diagnostiek-events** zijn gestructureerde records binnen het proces die worden uitgezonden door de
  Gateway en gebundelde plugins voor modelruns, berichtstroom, sessies, wachtrijen
  en exec.
- De **`diagnostics-otel` plugin** abonneert zich op die events en exporteert ze als
  OpenTelemetry **metrics**, **traces** en **logs** via OTLP/HTTP.
- **Providercalls** ontvangen een W3C `traceparent`-header van OpenClaw's
  vertrouwde spancontext voor modelcalls wanneer het providertransport aangepaste
  headers accepteert. Door plugins uitgezonden tracecontext wordt niet doorgegeven.
- Exporters worden alleen gekoppeld wanneer zowel het diagnostiekoppervlak als de plugin
  zijn ingeschakeld, zodat de kosten binnen het proces standaard bijna nul blijven.

## Snel starten

Installeer bij pakketinstallaties eerst de plugin:

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

| Signaal     | Wat erin terechtkomt                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Counters en histogrammen voor tokengebruik, kosten, run-duur, berichtstroom, Talk-events, wachtrijlanes, sessiestatus/-herstel, exec en geheugendruk.            |
| **Traces**  | Spans voor modelgebruik, modelcalls, harness-lifecycle, tooluitvoering, exec, webhook-/berichtverwerking, contextopbouw en toollussen.                           |
| **Logs**    | Gestructureerde `logging.file`-records die via OTLP worden geëxporteerd wanneer `diagnostics.otel.logs` is ingeschakeld.                                         |

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

| Variabele                                                                                                         | Doel                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Overschrijft `diagnostics.otel.endpoint`. Als de waarde al `/v1/traces`, `/v1/metrics` of `/v1/logs` bevat, wordt deze ongewijzigd gebruikt.                                                                                                      |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signaalspecifieke endpoint-overschrijvingen die worden gebruikt wanneer de bijbehorende configuratiesleutel `diagnostics.otel.*Endpoint` niet is ingesteld. Signaalspecifieke configuratie wint van signaalspecifieke env, die wint van het gedeelde endpoint. |
| `OTEL_SERVICE_NAME`                                                                                               | Overschrijft `diagnostics.otel.serviceName`.                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Overschrijft het wire-protocol (vandaag wordt alleen `http/protobuf` gehonoreerd).                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Stel in op `gen_ai_latest_experimental` om het nieuwste experimentele GenAI-spanattribuut (`gen_ai.provider.name`) uit te zenden in plaats van de verouderde `gen_ai.system`. GenAI-metrics gebruiken altijd begrensde semantische attributen met lage cardinaliteit. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Stel in op `1` wanneer een andere preload of hostproces de globale OpenTelemetry SDK al heeft geregistreerd. De plugin slaat dan zijn eigen NodeSDK-lifecycle over, maar koppelt nog steeds diagnostieklisteners en respecteert `traces`/`metrics`/`logs`. |

## Privacy en contentopname

Ruwe model-/toolcontent wordt standaard **niet** geëxporteerd. Spans bevatten begrensde
identifiers (kanaal, provider, model, foutcategorie, request-id's met alleen hash)
en bevatten nooit prompttekst, antwoordtekst, toolinputs, tooloutputs of
sessiesleutels.
Talk-metrics exporteren alleen begrensde eventmetadata zoals modus, transport,
provider en eventtype. Ze bevatten geen transcripties, audiopayloads,
sessie-id's, turn-id's, call-id's, room-id's of handoff-tokens.

Uitgaande modelrequests kunnen een W3C `traceparent`-header bevatten. Die header wordt
alleen gegenereerd uit door OpenClaw beheerde diagnostische tracecontext voor de actieve modelcall.
Bestaande door de caller aangeleverde `traceparent`-headers worden vervangen, zodat plugins of
aangepaste provideropties geen cross-service trace-afkomst kunnen spoofen.

Stel `diagnostics.otel.captureContent.*` alleen in op `true` wanneer je collector en
retentiebeleid zijn goedgekeurd voor prompt-, antwoord-, tool- of system-prompttekst.
Elke subsleutel is afzonderlijk opt-in:

- `inputMessages` - inhoud van gebruikersprompt.
- `outputMessages` - inhoud van modelantwoord.
- `toolInputs` - payloads met toolargumenten.
- `toolOutputs` - payloads met toolresultaten.
- `systemPrompt` - samengestelde system-/developerprompt.

Wanneer een subsleutel is ingeschakeld, krijgen model- en toolspans alleen voor die klasse begrensde, geredigeerde
`openclaw.content.*`-attributen.

## Sampling en flushen

- **Traces:** `diagnostics.otel.sampleRate` (alleen root-span, `0.0` laat alles vallen,
  `1.0` behoudt alles).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** OTLP-logs respecteren `logging.level` (bestandslogniveau). Ze gebruiken het
  redactiepad voor diagnostische logrecords, niet consoleformattering. Installaties met hoog volume
  moeten OTLP-collector-sampling/filtering verkiezen boven lokale sampling.
- **Correlatie met bestandslogs:** JSONL-bestandslogs bevatten top-level `traceId`,
  `spanId`, `parentSpanId` en `traceFlags` wanneer de logcall een geldige
  diagnostische tracecontext bevat, waardoor logprocessors lokale logregels kunnen koppelen aan
  geëxporteerde spans.
- **Requestcorrelatie:** Gateway-HTTP-requests en WebSocket-frames maken een
  interne request-tracescope aan. Logs en diagnostiek-events binnen die scope
  erven standaard de requesttrace, terwijl agent-run- en modelcall-spans worden
  aangemaakt als children zodat provider-`traceparent`-headers op dezelfde trace blijven.

## Geëxporteerde metrics

### Modelgebruik

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI-semantic-conventions-metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconden, GenAI-semantic-conventions-metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optioneel `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` en `openclaw.failureKind` bij geclassificeerde fouten)
- `openclaw.model_call.request_bytes` (histogram, UTF-8-bytegrootte van de uiteindelijke payload voor het modelrequest; geen ruwe payloadcontent)
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

### Talk

- `openclaw.talk.event` (counter, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: hetzelfde als `openclaw.talk.event`; uitgezonden wanneer een Talk-event duur rapporteert)
- `openclaw.talk.audio.bytes` (histogram, attrs: hetzelfde als `openclaw.talk.event`; uitgezonden voor Talk-audioframe-events die bytelengte rapporteren)

### Wachtrijen en sessies

- `openclaw.queue.lane.enqueue` (teller, attributen: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (teller, attributen: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attributen: `openclaw.lane` of `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attributen: `openclaw.lane`)
- `openclaw.session.state` (teller, attributen: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (teller, attributen: `openclaw.state`; alleen uitgezonden voor verouderde sessieboekhouding zonder actief werk)
- `openclaw.session.stuck_age_ms` (histogram, attributen: `openclaw.state`; alleen uitgezonden voor verouderde sessieboekhouding zonder actief werk)
- `openclaw.session.recovery.requested` (teller, attributen: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (teller, attributen: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, attributen: hetzelfde als de bijbehorende herstelteller)
- `openclaw.run.attempt` (teller, attributen: `openclaw.attempt`)

### Telemetrie voor sessie-levendheid

`diagnostics.stuckSessionWarnMs` is de leeftijdsdrempel zonder voortgang voor sessie-levendheidsdiagnostiek. Een `processing`-sessie veroudert niet richting deze drempel zolang OpenClaw voortgang observeert in antwoorden, tools, status, blokken of de ACP-runtime. Typing-keepalives tellen niet als voortgang, zodat een stil model of harnas nog steeds kan worden gedetecteerd.

OpenClaw classificeert sessies op basis van het werk dat het nog kan observeren:

- `session.long_running`: actief ingebed werk, modelaanroepen of toolaanroepen maken nog steeds voortgang.
- `session.stalled`: actief werk bestaat, maar de actieve run heeft geen recente voortgang gerapporteerd. Vastgelopen ingebedde runs blijven eerst alleen-observeren en gaan daarna na `diagnostics.stuckSessionAbortMs` zonder voortgang naar abort-drain, zodat wachtrijbeurten achter de lane kunnen worden hervat. Wanneer niet ingesteld, gebruikt de afbreekdrempel standaard het veiligere uitgebreide venster van minstens 10 minuten en 5x `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: verouderde sessieboekhouding zonder actief werk. Dit geeft de betrokken sessie-lane onmiddellijk vrij.

Herstel zendt gestructureerde `session.recovery.requested`- en `session.recovery.completed`-gebeurtenissen uit. De diagnostische sessiestatus wordt pas als inactief gemarkeerd na een muterende hersteluitkomst (`aborted` of `released`) en alleen als dezelfde verwerkingsgeneratie nog steeds actueel is.

Alleen `session.stuck` zendt de teller `openclaw.session.stuck`, het histogram `openclaw.session.stuck_age_ms` en de span `openclaw.session.stuck` uit. Herhaalde `session.stuck`-diagnostiek gebruikt back-off zolang de sessie ongewijzigd blijft, dus dashboards moeten waarschuwen op aanhoudende stijgingen in plaats van op elke heartbeat-tick. Zie voor de configuratieknop en standaardwaarden de [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics).

### Levenscyclus van het harnas

- `openclaw.harness.duration_ms` (histogram, attributen: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bij fouten)

### Exec

- `openclaw.exec.duration_ms` (histogram, attributen: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Interne diagnostiek (geheugen en tool-lus)

- `openclaw.memory.heap_used_bytes` (histogram, attributen: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (teller, attributen: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (teller, attributen: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attributen: `openclaw.toolName`, `openclaw.outcome`)

## Geëxporteerde spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - standaard `gen_ai.system`, of `gen_ai.provider.name` wanneer de nieuwste semantische GenAI-conventies zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - standaard `gen_ai.system`, of `gen_ai.provider.name` wanneer de nieuwste semantische GenAI-conventies zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` en optioneel `openclaw.failureKind` bij fouten
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (begrensde op SHA gebaseerde hash van de request-id van de upstream-provider; ruwe id's worden niet geëxporteerd)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (geen prompt-, geschiedenis-, antwoord- of sessiesleutelinhoud)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (geen lusberichten, params of tooluitvoer)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wanneer inhoudsvastlegging expliciet is ingeschakeld, kunnen model- en tool-spans ook begrensde, geredigeerde `openclaw.content.*`-attributen bevatten voor de specifieke inhoudsklassen waarvoor je hebt gekozen.

## Catalogus van diagnostische gebeurtenissen

De onderstaande gebeurtenissen ondersteunen de metrics en spans hierboven. Plugins kunnen zich er ook rechtstreeks op abonneren zonder OTLP-export.

**Modelgebruik**

- `model.usage` - tokens, kosten, duur, context, provider/model/kanaal, sessie-id's. `usage` is provider-/turn-boekhouding voor kosten en telemetrie; `context.used` is de huidige prompt-/contextsnapshot en kan lager zijn dan provider `usage.total` wanneer gecachte input of tool-lusaanroepen betrokken zijn.

**Berichtenstroom**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Wachtrij en sessie**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (geaggregeerde tellers: webhooks/wachtrij/sessie)

**Levenscyclus van het harnas**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - levenscyclus per run voor het agentharnas. Bevat `harnessId`, optioneel `pluginId`, provider/model/kanaal en run-id. Voltooiing voegt `durationMs`, `outcome`, optioneel `resultClassification`, `yieldDetected` en `itemLifecycle`-aantallen toe. Fouten voegen `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` en optioneel `cleanupFailed` toe.

**Exec**

- `exec.process.completed` - terminale uitkomst, duur, doel, modus, exitcode en foutsoort. Commandotekst en werkmappen worden niet opgenomen.

## Zonder exporter

Je kunt diagnostische gebeurtenissen beschikbaar houden voor Plugins of aangepaste sinks zonder `diagnostics-otel` uit te voeren:

```json5
{
  diagnostics: { enabled: true },
}
```

Gebruik diagnostische flags voor gerichte debuguitvoer zonder `logging.level` te verhogen. Flags zijn hoofdletterongevoelig en ondersteunen jokertekens (bijv. `telegram.*` of `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Of als een eenmalige env-override:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Flaguitvoer gaat naar het standaardlogbestand (`logging.file`) en wordt nog steeds geredigeerd door `logging.redactSensitive`. Volledige handleiding: [Diagnostische flags](/nl/diagnostics/flags).

## Uitschakelen

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Je kunt `diagnostics-otel` ook buiten `plugins.allow` laten, of `openclaw plugins disable diagnostics-otel` uitvoeren.

## Gerelateerd

- [Logging](/nl/logging) - bestandslogs, console-uitvoer, CLI-tailing en het tabblad Logs in de Control UI
- [Interne Gateway-logging](/nl/gateway/logging) - WS-logstijlen, subsysteemprefixen en consolevastlegging
- [Diagnostische flags](/nl/diagnostics/flags) - gerichte debuglogflags
- [Diagnostische export](/nl/gateway/diagnostics) - operator-tool voor ondersteuningsbundels (los van OTEL-export)
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) - volledige veldreferentie voor `diagnostics.*`
