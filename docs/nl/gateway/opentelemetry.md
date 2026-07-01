---
read_when:
    - Je wilt OpenClaw-modelgebruik, berichtstroom- of sessiestatistieken naar een OpenTelemetry-collector verzenden
    - Je koppelt traces, metriekgegevens of logboeken aan Grafana, Datadog, Honeycomb, New Relic, Tempo of een andere OTLP-backend
    - Je hebt de exacte metrieknamen, spannamen of attribuutvormen nodig om dashboards of waarschuwingen te bouwen
summary: Exporteer OpenClaw-diagnostiek naar OpenTelemetry-collectors of stdout JSONL via de diagnostics-otel-plugin
title: OpenTelemetry-export
x-i18n:
    generated_at: "2026-07-01T08:16:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporteert diagnostiek via de officiële `diagnostics-otel`-plugin
met **OTLP/HTTP (protobuf)**. Logs kunnen ook als stdout JSONL worden geschreven voor
container- en sandbox-logpijplijnen. Elke collector of backend die
OTLP/HTTP accepteert, werkt zonder codewijzigingen. Zie [Logboekregistratie](/nl/logging)
voor lokale bestandslogs en hoe je ze leest.

## Hoe het samenhangt

- **Diagnostische gebeurtenissen** zijn gestructureerde, in-process records die worden uitgezonden door de
  Gateway en gebundelde plugins voor modelruns, berichtenstroom, sessies, wachtrijen
  en exec.
- **`diagnostics-otel`-plugin** abonneert zich op die gebeurtenissen en exporteert ze als
  OpenTelemetry **metrics**, **traces** en **logs** via OTLP/HTTP. De plugin kan
  diagnostische logrecords ook spiegelen naar stdout JSONL.
- **Provider-aanroepen** ontvangen een W3C `traceparent`-header vanuit OpenClaw's
  vertrouwde spancontext voor modelaanroepen wanneer het providertransport aangepaste
  headers accepteert. Door plugins uitgezonden tracecontext wordt niet doorgegeven.
- Exporters worden alleen gekoppeld wanneer zowel het diagnostiekoppervlak als de plugin zijn
  ingeschakeld, zodat de in-process kosten standaard bijna nul blijven.

## Snelle start

Installeer voor pakketinstallaties eerst de plugin:

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

| Signaal     | Wat erin terechtkomt                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Counters en histogrammen voor tokengebruik, kosten, runduur, failover, skillgebruik, berichtenstroom, Talk-gebeurtenissen, wachtrijlanes, sessiestatus/herstel, tooluitvoering, te grote payloads, exec en geheugendruk. |
| **Traces**  | Spans voor modelgebruik, modelaanroepen, harness-levenscyclus, skillgebruik, tooluitvoering, exec, webhook-/berichtverwerking, contextopbouw en toolloops.                                                            |
| **Logs**    | Gestructureerde `logging.file`-records die via OTLP of stdout JSONL worden geëxporteerd wanneer `diagnostics.otel.logs` is ingeschakeld; logbody's worden achtergehouden tenzij contentvastlegging expliciet is ingeschakeld. |

Schakel `traces`, `metrics` en `logs` onafhankelijk van elkaar in of uit. Traces en metrics
staan standaard aan wanneer `diagnostics.otel.enabled` true is. Logs staan standaard uit en
worden alleen geëxporteerd wanneer `diagnostics.otel.logs` expliciet `true` is. Logexport
gebruikt standaard OTLP; stel `diagnostics.otel.logsExporter` in op `stdout` voor JSONL op
stdout, of op `both` om elk diagnostisch logrecord naar OTLP en stdout te sturen.

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

### Omgevingsvariabelen

| Variabele                                                                                                         | Doel                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Overschrijft `diagnostics.otel.endpoint`. Als de waarde al `/v1/traces`, `/v1/metrics` of `/v1/logs` bevat, wordt deze ongewijzigd gebruikt.                                                                                                                                                                                                             |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signaalspecifieke endpoint-overschrijvingen die worden gebruikt wanneer de bijbehorende configuratiesleutel `diagnostics.otel.*Endpoint` niet is ingesteld. Signaalspecifieke configuratie wint van signaalspecifieke env, die weer wint van het gedeelde endpoint.                                                                                       |
| `OTEL_SERVICE_NAME`                                                                                               | Overschrijft `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                             |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Overschrijft het wire-protocol (vandaag wordt alleen `http/protobuf` gehonoreerd).                                                                                                                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Stel in op `gen_ai_latest_experimental` om de nieuwste experimentele GenAI-inference-spanshape uit te zenden, inclusief spannamen met `{gen_ai.operation.name} {gen_ai.request.model}`, spansoort `CLIENT` en `gen_ai.provider.name` in plaats van het legacy `gen_ai.system`. GenAI-metrics gebruiken altijd begrensde semantische attributen met lage cardinaliteit. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Stel in op `1` wanneer een andere preload of hostproces de globale OpenTelemetry SDK al heeft geregistreerd. De plugin slaat dan zijn eigen NodeSDK-levenscyclus over, maar koppelt nog steeds diagnostische listeners en respecteert `traces`/`metrics`/`logs`.                                                                                           |

## Privacy en contentvastlegging

Ruwe model-/toolcontent wordt standaard **niet** geëxporteerd. Spans dragen begrensde
identifiers (kanaal, provider, model, foutcategorie, alleen-hash request-id's,
toolbron, tooleigenaar en skillnaam/-bron) en bevatten nooit prompttekst,
antwoordtekst, toolinputs, tooloutputs, skillbestandspaden of sessiesleutels.
OTLP-logrecords behouden standaard severity, logger, codelocatie, vertrouwde tracecontext
en opgeschoonde attributen, maar de ruwe body van het logbericht wordt alleen geëxporteerd
wanneer `diagnostics.otel.captureContent` is ingesteld op de boolean `true`. Granulaire
subsleutels `captureContent.*` schakelen logbody's niet in. Labels die lijken op
gescopete agentsessiesleutels worden vervangen door `unknown`.
Talk-metrics exporteren alleen begrensde gebeurtenismetadata zoals modus, transport,
provider en gebeurtenistype. Ze bevatten geen transcripties, audiopayloads,
sessie-id's, turn-id's, call-id's, room-id's of overdrachtstokens.

Uitgaande modelrequests kunnen een W3C `traceparent`-header bevatten. Die header wordt
alleen gegenereerd vanuit OpenClaw-eigen diagnostische tracecontext voor de actieve modelaanroep.
Bestaande door de aanroeper aangeleverde `traceparent`-headers worden vervangen, zodat plugins of
aangepaste provideropties geen cross-service trace-afkomst kunnen vervalsen.

Stel `diagnostics.otel.captureContent.*` alleen in op `true` wanneer je collector en
retentiebeleid zijn goedgekeurd voor prompt-, antwoord-, tool- of system-prompttekst.
Elke subsleutel is onafhankelijk opt-in:

- `inputMessages` - inhoud van gebruikersprompts.
- `outputMessages` - inhoud van modelantwoorden.
- `toolInputs` - payloads met toolargumenten.
- `toolOutputs` - payloads met toolresultaten.
- `systemPrompt` - samengestelde system-/developerprompt.
- `toolDefinitions` - namen, beschrijvingen en schema's van modeltools.

Wanneer een subsleutel is ingeschakeld, krijgen model- en toolspans alleen voor die klasse
begrensde, geredigeerde `openclaw.content.*`-attributen. Gebruik boolean
`captureContent: true` alleen voor brede diagnostische vastleggingen waarbij OTLP-logberichtbody's
ook zijn goedgekeurd voor export.

Content van `toolInputs`/`toolOutputs` wordt vastgelegd voor tooluitvoeringen van de ingebouwde
agentruntime (`openclaw.content.tool_input` op voltooide/foutspans,
`openclaw.content.tool_output` op voltooide spans). Externe harness-toolaanroepen
(Codex, Claude CLI) zenden `tool.execution.*`-spans uit zonder contentpayloads.
Vastgelegde content reist via een vertrouwd, alleen-voor-listeners kanaal en wordt nooit geplaatst
op de publieke diagnostische eventbus.

## Sampling en flushen

- **Traces:** `diagnostics.otel.sampleRate` (alleen root-span, `0.0` laat alles vallen,
  `1.0` behoudt alles).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** OTLP-logs respecteren `logging.level` (logniveau voor bestanden). Ze gebruiken het
  redactiepad voor diagnostische logrecords, niet de console-opmaak. Installaties met hoog volume
  moeten de voorkeur geven aan sampling/filtering via de OTLP-collector boven lokale sampling.
  Stel `diagnostics.otel.logsExporter: "stdout"` in wanneer je platform stdout/stderr al
  naar een logprocessor verzendt en je geen OTLP-logscollector hebt. Stdout-records zijn één
  JSON-object per regel met `ts`, `signal`,
  `service.name`, ernst, body, geredigeerde attributen en vertrouwde tracevelden
  wanneer beschikbaar.
- **Bestandslogcorrelatie:** JSONL-bestandslogs bevatten top-level `traceId`,
  `spanId`, `parentSpanId` en `traceFlags` wanneer de logaanroep een geldige
  diagnostische tracecontext bevat, waardoor logprocessors lokale logregels kunnen koppelen aan
  geëxporteerde spans.
- **Aanvraagcorrelatie:** Gateway HTTP-aanvragen en WebSocket-frames maken een
  interne request-tracescope aan. Logs en diagnostische events binnen die scope
  erven standaard de request-trace, terwijl spans voor agentruns en modelaanroepen
  als kinderen worden aangemaakt zodat provider-`traceparent`-headers op dezelfde trace blijven.
- **Modelaanroepcorrelatie:** `openclaw.model.call`-spans bevatten standaard veilige groottes van
  promptcomponenten en bevatten tokenattributen per aanroep wanneer het
  providerresultaat gebruiksinformatie beschikbaar stelt. `openclaw.model.usage` blijft de span voor
  accounting op runniveau voor totale kosten, context en channeldashboards; deze blijft
  op dezelfde diagnostische trace wanneer de emitterende runtime een vertrouwde tracecontext heeft.

## Geëxporteerde metrics

### Modelgebruik

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metric volgens GenAI semantic conventions, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconden, metric volgens GenAI semantic conventions, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optioneel `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` en `openclaw.failureKind` bij geclassificeerde fouten)
- `openclaw.model_call.request_bytes` (histogram, UTF-8-bytegrootte van de uiteindelijke modelrequestpayload; geen ruwe payloadinhoud)
- `openclaw.model_call.response_bytes` (histogram, UTF-8-bytegrootte van payloads van gestreamde responschunks; tekst met hoge frequentie, thinking en toolaanroep-delta's tellen alleen incrementele `delta`-bytes; geen ruwe responsinhoud)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, verstreken tijd vóór het eerste gestreamde responsevent)
- `openclaw.model.failover` (counter, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (counter, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, optioneel `openclaw.agent`, optioneel `openclaw.toolName`)

### Berichtstroom

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (counter, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: hetzelfde als `openclaw.talk.event`; uitgezonden wanneer een Talk-event duur rapporteert)
- `openclaw.talk.audio.bytes` (histogram, attrs: hetzelfde als `openclaw.talk.event`; uitgezonden voor Talk-audioframe-events die bytelengte rapporteren)

### Wachtrijen en sessies

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` of `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; uitgezonden voor herstelbare verouderde sessieboekhouding)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; uitgezonden voor herstelbare verouderde sessieboekhouding)
- `openclaw.session.turn.created` (counter, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, attrs: hetzelfde als de bijbehorende recoverycounter)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetrie voor sessielevendigheid

`diagnostics.stuckSessionWarnMs` is de leeftijdsdrempel zonder voortgang voor diagnostiek van
sessielevendigheid. Een `processing`-sessie telt niet mee richting deze drempel
zolang OpenClaw voortgang observeert in antwoorden, tools, status, blokken of ACP-runtime.
Typing-keepalives tellen niet als voortgang, waardoor een stil model of harness
nog steeds kan worden gedetecteerd.

OpenClaw classificeert sessies op basis van het werk dat het nog kan observeren:

- `session.long_running`: actief embedded werk, modelaanroepen of toolaanroepen maken
  nog steeds voortgang. Eigen modelaanroepen die stil blijven na
  `diagnostics.stuckSessionWarnMs` worden ook als long-running gerapporteerd vóór
  `diagnostics.stuckSessionAbortMs`, zodat trage of niet-streamende modelproviders er
  niet uitzien als vastgelopen gatewaysessies zolang ze observeerbaar afbreekbaar blijven.
- `session.stalled`: er bestaat actief werk, maar de actieve run heeft geen
  recente voortgang gerapporteerd. Eigen modelaanroepen schakelen van `session.long_running` naar
  `session.stalled` op of na `diagnostics.stuckSessionAbortMs`; eigenaarloze
  verouderde model-/toolactiviteit wordt niet behandeld als onschadelijk long-running werk.
  Vastgelopen embedded runs blijven aanvankelijk alleen observeerbaar en worden daarna afgebroken en leeggemaakt na
  `diagnostics.stuckSessionAbortMs` zonder voortgang, zodat wachtrijbeurten achter de
  lane kunnen hervatten. Wanneer niet ingesteld, valt de afbreekdrempel terug op het veiligere
  uitgebreide venster van minstens 5 minuten en 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: verouderde sessieboekhouding zonder actief werk, of een idle
  wachtrijsessie met verouderde eigenaarloze model-/toolactiviteit. Dit geeft de
  getroffen sessielane onmiddellijk vrij nadat recoverygates slagen.

Recovery zendt gestructureerde `session.recovery.requested`- en
`session.recovery.completed`-events uit. De diagnostische sessiestatus wordt pas als idle gemarkeerd
na een muterende recovery-uitkomst (`aborted` of `released`) en alleen als dezelfde
processinggeneratie nog actueel is.

Alleen `session.stuck` zendt de `openclaw.session.stuck`-counter, het
`openclaw.session.stuck_age_ms`-histogram en de `openclaw.session.stuck`-span uit.
Herhaalde `session.stuck`-diagnostiek bouwt back-off op zolang de sessie
ongewijzigd blijft, dus dashboards moeten waarschuwen op aanhoudende toenames in plaats van op elke
Heartbeat-tick. Zie voor de configuratieknop en standaardwaarden
[Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics).

Levendigheidswaarschuwingen zenden ook uit:

- `openclaw.liveness.warning` (counter, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, attrs: `openclaw.liveness.reason`)

### Harnesslevenscyclus

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bij fouten)

### Tooluitvoering

- `openclaw.tool.execution.duration_ms` (histogram, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, plus `openclaw.errorCategory` bij fouten)
- `openclaw.tool.execution.blocked` (counter, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnostische internals (geheugen en toollus)

- `openclaw.payload.large` (counter, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, attrs: hetzelfde als `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (alleen veilige componentgroottes, geen prompttekst)
  - `openclaw.model_call.usage.*` en `gen_ai.usage.*` wanneer het resultaat van de modelaanroep providergebruik voor die afzonderlijke aanroep bevat
  - `openclaw.provider.request_id_hash` (begrensde SHA-gebaseerde hash van de aanvraag-id van de upstreamprovider; ruwe id's worden niet geëxporteerd)
  - Met `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` gebruiken spans voor modelaanroepen de nieuwste GenAI-inferentiespannaam `{gen_ai.operation.name} {gen_ai.request.model}` en het spantype `CLIENT` in plaats van `openclaw.model.call`.
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (geen loopberichten, parameters of tooluitvoer)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wanneer inhoudsvastlegging expliciet is ingeschakeld, kunnen model- en toolspans ook
begrensde, geredigeerde `openclaw.content.*`-attributen bevatten voor de specifieke
inhoudsklassen waarvoor je hebt gekozen.

## Catalogus met diagnostische gebeurtenissen

De onderstaande gebeurtenissen ondersteunen de bovenstaande metrics en spans. Plugins kunnen zich er ook rechtstreeks op abonneren
zonder OTLP-export.

**Modelgebruik**

- `model.usage` - tokens, kosten, duur, context, provider/model/kanaal,
  sessie-id's. `usage` is provider-/beurtboekhouding voor kosten en telemetrie;
  `context.used` is de huidige prompt-/contextsnapshot en kan lager zijn dan
  provider `usage.total` wanneer gecachte invoer of tool-loop-aanroepen betrokken zijn.

**Berichtenstroom**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Wachtrij en sessie**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (geaggregeerde tellers: webhooks/wachtrij/sessie)

**Harness-levenscyclus**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  levenscyclus per run voor de agent-harness. Bevat `harnessId`, optioneel
  `pluginId`, provider/model/kanaal en run-id. Voltooiing voegt
  `durationMs`, `outcome`, optioneel `resultClassification`, `yieldDetected`,
  en `itemLifecycle`-aantallen toe. Fouten voegen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, en
  optioneel `cleanupFailed` toe.

**Exec**

- `exec.process.completed` - terminale uitkomst, duur, doel, modus, exitcode
  en soort storing. Commandotekst en werkmappen worden niet
  opgenomen.
- `exec.approval.followup_suppressed` - verouderde goedkeuringsopvolging verwijderd na
  een sessieherstel. Bevat `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` of `gateway_preflight`), en de dispatcher-
  tijdstempel. Sessiesleutels, routes en commandotekst worden niet opgenomen.

## Zonder exporter

Je kunt diagnostische gebeurtenissen beschikbaar houden voor Plugins of aangepaste sinks zonder
`diagnostics-otel` uit te voeren:

```json5
{
  diagnostics: { enabled: true },
}
```

Gebruik diagnostische vlaggen voor gerichte debuguitvoer zonder `logging.level` te verhogen.
Vlaggen zijn niet hoofdlettergevoelig en ondersteunen wildcards (bijv. `telegram.*` of
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Of als een eenmalige env-override:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Vlaguitvoer gaat naar het standaard logbestand (`logging.file`) en wordt nog steeds
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

- [Logging](/nl/logging) - bestandslogs, console-uitvoer, CLI-tailing en het tabblad Logs in de Control UI
- [Gateway-logboekinternals](/nl/gateway/logging) - WS-logstijlen, subsysteemprefixen en consolevastlegging
- [Diagnostische vlaggen](/nl/diagnostics/flags) - gerichte debuglogvlaggen
- [Diagnostische export](/nl/gateway/diagnostics) - supportbundeltool voor operators (los van OTEL-export)
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) - volledige veldreferentie voor `diagnostics.*`
