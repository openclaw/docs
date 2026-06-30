---
read_when:
    - Je wilt OpenClaw-modelgebruik, berichtstromen of sessiemetrieken naar een OpenTelemetry-collector sturen
    - Je koppelt traces, metriekgegevens of logs aan Grafana, Datadog, Honeycomb, New Relic, Tempo of een andere OTLP-backend
    - Je hebt de exacte metriek-namen, span-namen of attribuutvormen nodig om dashboards of waarschuwingen te bouwen
summary: Exporteer OpenClaw-diagnostiek naar OpenTelemetry-collectors of stdout JSONL via de diagnostics-otel-plugin
title: OpenTelemetry-export
x-i18n:
    generated_at: "2026-06-30T14:14:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporteert diagnostiek via de officiële `diagnostics-otel` Plugin
met **OTLP/HTTP (protobuf)**. Logs kunnen ook als stdout JSONL worden geschreven voor
container- en sandbox-logpijplijnen. Elke collector of backend die
OTLP/HTTP accepteert, werkt zonder codewijzigingen. Voor lokale bestandslogs en hoe je ze leest,
zie [Logging](/nl/logging).

## Hoe het samenwerkt

- **Diagnostische gebeurtenissen** zijn gestructureerde, in-process records die worden uitgezonden door de
  Gateway en gebundelde plugins voor modelruns, berichtstroom, sessies, wachtrijen
  en exec.
- **`diagnostics-otel` Plugin** abonneert zich op die gebeurtenissen en exporteert ze als
  OpenTelemetry **metrics**, **traces** en **logs** via OTLP/HTTP. De Plugin kan
  diagnostische logrecords ook spiegelen naar stdout JSONL.
- **Provideraanroepen** ontvangen een W3C `traceparent`-header van OpenClaw's
  vertrouwde spancontext voor modelaanroepen wanneer het providertransport aangepaste
  headers accepteert. Door plugins uitgezonden tracecontext wordt niet doorgegeven.
- Exporters worden alleen gekoppeld wanneer zowel het diagnostische oppervlak als de Plugin zijn
  ingeschakeld, zodat de in-process kosten standaard vrijwel nul blijven.

## Snel starten

Installeer voor pakketinstallaties eerst de Plugin:

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

Je kunt de Plugin ook inschakelen vanuit de CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` ondersteunt momenteel alleen `http/protobuf`. `grpc` wordt genegeerd.
</Note>

## Geëxporteerde signalen

| Signaal     | Wat erin gaat                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Tellers en histogrammen voor tokengebruik, kosten, runduur, failover, skillgebruik, berichtstroom, Talk-gebeurtenissen, wachtrijbanen, sessiestatus/-herstel, tooluitvoering, te grote payloads, exec en geheugendruk. |
| **Traces**  | Spans voor modelgebruik, modelaanroepen, harness-levenscyclus, skillgebruik, tooluitvoering, exec, webhook-/berichtverwerking, contextopbouw en toollussen.                                                   |
| **Logs**    | Gestructureerde `logging.file`-records die via OTLP of stdout JSONL worden geëxporteerd wanneer `diagnostics.otel.logs` is ingeschakeld; logbodies worden achtergehouden tenzij contentvastlegging expliciet is ingeschakeld. |

Schakel `traces`, `metrics` en `logs` onafhankelijk in of uit. Traces en metrics
staan standaard aan wanneer `diagnostics.otel.enabled` true is. Logs staan standaard uit en
worden alleen geëxporteerd wanneer `diagnostics.otel.logs` expliciet `true` is. Logexport
staat standaard op OTLP; stel `diagnostics.otel.logsExporter` in op `stdout` voor JSONL op
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

| Variabele                                                                                                         | Doel                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Overschrijf `diagnostics.otel.endpoint`. Als de waarde al `/v1/traces`, `/v1/metrics` of `/v1/logs` bevat, wordt deze ongewijzigd gebruikt.                                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signaalspecifieke endpoint-overschrijvingen die worden gebruikt wanneer de overeenkomende configuratiesleutel `diagnostics.otel.*Endpoint` niet is ingesteld. Signaalspecifieke configuratie wint van signaalspecifieke env, en die wint van het gedeelde endpoint.                                                                                          |
| `OTEL_SERVICE_NAME`                                                                                               | Overschrijf `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Overschrijf het wireprotocol (alleen `http/protobuf` wordt vandaag gehonoreerd).                                                                                                                                                                                                                                                                             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Stel in op `gen_ai_latest_experimental` om de nieuwste experimentele GenAI-inference-spanshape uit te zenden, inclusief spannamen `{gen_ai.operation.name} {gen_ai.request.model}`, spansoort `CLIENT` en `gen_ai.provider.name` in plaats van de legacy `gen_ai.system`. GenAI-metrics gebruiken altijd begrensde semantische attributen met lage cardinaliteit. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Stel in op `1` wanneer een andere preload of hostproces de globale OpenTelemetry-SDK al heeft geregistreerd. De Plugin slaat dan zijn eigen NodeSDK-levenscyclus over, maar koppelt nog steeds diagnostische listeners en respecteert `traces`/`metrics`/`logs`.                                                                                             |

## Privacy en contentvastlegging

Ruwe model-/toolcontent wordt standaard **niet** geëxporteerd. Spans dragen begrensde
identificatoren (kanaal, provider, model, foutcategorie, alleen-hash aanvraag-id's,
toolbron, tooleigenaar en skillnaam/-bron) en bevatten nooit prompttekst,
antwoordtekst, toolinputs, tooloutputs, skillbestandspaden of sessiesleutels.
OTLP-logrecords behouden standaard ernst, logger, codelocatie, vertrouwde tracecontext
en opgeschoonde attributen, maar de ruwe logberichtbody wordt alleen geëxporteerd
wanneer `diagnostics.otel.captureContent` is ingesteld op boolean `true`. Granulaire
subsleutels `captureContent.*` schakelen logbodies niet in. Labels die eruitzien als
gescopete agentsessiesleutels worden vervangen door `unknown`.
Talk-metrics exporteren alleen begrensde gebeurtenismetadata zoals modus, transport,
provider en gebeurtenistype. Ze bevatten geen transcripties, audiopayloads,
sessie-id's, turn-id's, call-id's, room-id's of overdrachtstokens.

Uitgaande modelaanvragen kunnen een W3C `traceparent`-header bevatten. Die header wordt
alleen gegenereerd vanuit OpenClaw-eigen diagnostische tracecontext voor de actieve modelaanroep.
Bestaande door de caller geleverde `traceparent`-headers worden vervangen, zodat plugins of
aangepaste provideropties cross-service trace-afkomst niet kunnen spoofen.

Stel `diagnostics.otel.captureContent.*` alleen in op `true` wanneer je collector en
bewaarbeleid zijn goedgekeurd voor prompt-, antwoord-, tool- of system-prompttekst.
Elke subsleutel is onafhankelijk opt-in:

- `inputMessages` - inhoud van gebruikersprompt.
- `outputMessages` - inhoud van modelantwoord.
- `toolInputs` - payloads met toolargumenten.
- `toolOutputs` - payloads met toolresultaten.
- `systemPrompt` - samengestelde system-/developerprompt.
- `toolDefinitions` - modeltoolnamen, beschrijvingen en schema's.

Wanneer een subsleutel is ingeschakeld, krijgen model- en toolspans alleen voor die klasse begrensde, geredigeerde
`openclaw.content.*`-attributen. Gebruik boolean
`captureContent: true` alleen voor brede diagnostische vastleggingen waarbij OTLP-logberichtbodies
ook zijn goedgekeurd voor export.

Content van `toolInputs`/`toolOutputs` wordt vastgelegd voor tooluitvoeringen van de ingebouwde agentruntime
(`openclaw.content.tool_input` op voltooide/foutspans,
`openclaw.content.tool_output` op voltooide spans). Externe harness-toolaangeroepen
(Codex, Claude CLI) zenden `tool.execution.*`-spans uit zonder contentpayloads.
Vastgelegde content reist via een vertrouwd, alleen-listenerkanaal en wordt nooit geplaatst
op de openbare diagnostische gebeurtenisbus.

## Sampling en flushen

- **Traces:** `diagnostics.otel.sampleRate` (alleen root-span, `0.0` laat alles vallen,
  `1.0` behoudt alles).
- **Metrieken:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** OTLP-logs respecteren `logging.level` (logniveau van bestand). Ze gebruiken het
  redactiepad voor diagnostische logrecords, niet console-opmaak. Installaties met hoog volume
  moeten voorkeur geven aan sampling/filtering in de OTLP collector boven lokale sampling.
  Stel `diagnostics.otel.logsExporter: "stdout"` in wanneer je platform stdout/stderr al
  naar een logprocessor verzendt en je geen OTLP-logs
  collector hebt. Stdout-records zijn één JSON-object per regel met `ts`, `signal`,
  `service.name`, ernst, body, geredigeerde attributen en vertrouwde trace-velden
  wanneer beschikbaar.
- **Correlatie van bestandslogs:** JSONL-bestandslogs bevatten op topniveau `traceId`,
  `spanId`, `parentSpanId` en `traceFlags` wanneer de logaanroep een geldige
  diagnostische trace-context bevat, waardoor logprocessors lokale logregels kunnen koppelen aan
  geëxporteerde spans.
- **Aanvraagcorrelatie:** Gateway HTTP-aanvragen en WebSocket-frames maken een
  interne trace-scope voor de aanvraag aan. Logs en diagnostische events binnen die scope
  erven standaard de aanvraagtrace, terwijl agent-run- en model-call-spans als
  children worden gemaakt zodat provider-`traceparent`-headers op dezelfde trace blijven.
- **Model-call-correlatie:** `openclaw.model.call`-spans bevatten standaard veilige groottes van promptcomponenten
  en bevatten tokenattributen per call wanneer het providerresultaat usage blootlegt.
  `openclaw.model.usage` blijft de run-level
  accounting-span voor geaggregeerde kosten, context en channeldashboards; deze blijft
  op dezelfde diagnostische trace wanneer de emitterende runtime vertrouwde trace-
  context heeft.

## Geëxporteerde metrieken

### Modelgebruik

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions-metriek, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconden, GenAI semantic-conventions-metriek, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optioneel `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` en `openclaw.failureKind` bij geclassificeerde fouten)
- `openclaw.model_call.request_bytes` (histogram, UTF-8-bytegrootte van de uiteindelijke payload van de modelaanvraag; geen ruwe payloadinhoud)
- `openclaw.model_call.response_bytes` (histogram, UTF-8-bytegrootte van payloads van gestreamde responsechunks; hoogfrequente tekst-, thinking- en tool-call-delta's tellen alleen incrementele `delta`-bytes; geen ruwe response-inhoud)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, verstreken tijd vóór het eerste gestreamde response-event)
- `openclaw.model.failover` (counter, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (counter, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, optioneel `openclaw.agent`, optioneel `openclaw.toolName`)

### Berichtenstroom

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
- `openclaw.talk.event.duration_ms` (histogram, attrs: hetzelfde als `openclaw.talk.event`; geëmitteerd wanneer een Talk-event duur rapporteert)
- `openclaw.talk.audio.bytes` (histogram, attrs: hetzelfde als `openclaw.talk.event`; geëmitteerd voor Talk-audioframe-events die bytelengte rapporteren)

### Wachtrijen en sessies

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` of `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; geëmitteerd voor herstelbare verouderde sessieboekhouding)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; geëmitteerd voor herstelbare verouderde sessieboekhouding)
- `openclaw.session.turn.created` (counter, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, attrs: hetzelfde als de bijbehorende recovery-counter)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetrie voor sessieliveness

`diagnostics.stuckSessionWarnMs` is de leeftijdsdrempel zonder voortgang voor diagnostiek van
sessieliveness. Een `processing`-sessie veroudert niet richting deze drempel
terwijl OpenClaw voortgang van reply, tool, status, block of ACP-runtime waarneemt.
Typing keepalives tellen niet als voortgang, dus een stil model of harnas kan
nog steeds worden gedetecteerd.

OpenClaw classificeert sessies op basis van het werk dat het nog kan waarnemen:

- `session.long_running`: actief embedded werk, modelcalls of toolcalls maken
  nog steeds voortgang. Eigen modelcalls die langer stil blijven dan
  `diagnostics.stuckSessionWarnMs` rapporteren ook als langlopend vóór
  `diagnostics.stuckSessionAbortMs`, zodat trage of niet-streamende modelproviders er
  niet uitzien als vastgelopen gatewaysessies zolang ze abort-observeerbaar blijven.
- `session.stalled`: er is actief werk, maar de actieve run heeft geen
  recente voortgang gerapporteerd. Eigen modelcalls schakelen van `session.long_running` naar
  `session.stalled` op of na `diagnostics.stuckSessionAbortMs`; ownerless
  verouderde model-/toolactiviteit wordt niet behandeld als onschadelijk langlopend werk.
  Vastgelopen embedded runs blijven eerst alleen observeerbaar en worden daarna abort-drained na
  `diagnostics.stuckSessionAbortMs` zonder voortgang, zodat in de lane wachtrijstaande turns erachter kunnen hervatten.
  Wanneer niet ingesteld, valt de abortdrempel terug op het veiligere
  verlengde venster van ten minste 5 minuten en 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: verouderde sessieboekhouding zonder actief werk, of een idle
  wachtrijsessie met verouderde ownerless model-/toolactiviteit. Dit geeft de
  getroffen sessielane onmiddellijk vrij nadat recovery-gates slagen.

Recovery emitteert gestructureerde `session.recovery.requested`- en
`session.recovery.completed`-events. Diagnostische sessiestatus wordt alleen idle gemarkeerd
na een muterende recovery-uitkomst (`aborted` of `released`) en alleen als dezelfde
processing-generatie nog steeds actueel is.

Alleen `session.stuck` emitteert de `openclaw.session.stuck`-counter, het
`openclaw.session.stuck_age_ms`-histogram en de `openclaw.session.stuck`
span. Herhaalde `session.stuck`-diagnostiek backt off terwijl de sessie
ongewijzigd blijft, dus dashboards moeten alarmeren op aanhoudende toenames in plaats van op elke
heartbeat-tick. Zie voor de configuratieknop en defaults de
[Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics).

Liveness-waarschuwingen emitteren ook:

- `openclaw.liveness.warning` (counter, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, attrs: `openclaw.liveness.reason`)

### Levenscyclus van harnas

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bij fouten)

### Tooluitvoering

- `openclaw.tool.execution.duration_ms` (histogram, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, plus `openclaw.errorCategory` bij fouten)
- `openclaw.tool.execution.blocked` (counter, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Interne diagnostiek (geheugen en tool-loop)

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
  - standaard `gen_ai.system`, of `gen_ai.provider.name` wanneer de nieuwste semantische conventies van GenAI zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - standaard `gen_ai.system`, of `gen_ai.provider.name` wanneer de nieuwste semantische conventies van GenAI zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` en optioneel `openclaw.failureKind` bij fouten
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (alleen veilige componentgroottes, geen prompttekst)
  - `openclaw.model_call.usage.*` en `gen_ai.usage.*` wanneer het resultaat van de modelaanroep providergebruik voor die afzonderlijke aanroep bevat
  - `openclaw.provider.request_id_hash` (begrensde SHA-gebaseerde hash van de aanvraag-id van de upstreamprovider; onbewerkte id's worden niet geëxporteerd)
  - Met `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` gebruiken modelaanroep-spans de nieuwste GenAI-inferentie-spannaam `{gen_ai.operation.name} {gen_ai.request.model}` en spansoort `CLIENT` in plaats van `openclaw.model.call`.
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

Wanneer inhoudsvastlegging expliciet is ingeschakeld, kunnen model- en tool-spans ook
begrensde, geredigeerde `openclaw.content.*`-attributen bevatten voor de specifieke
inhoudsklassen waarvoor je je hebt aangemeld.

## Catalogus met diagnostische events

De onderstaande events ondersteunen de bovenstaande metrics en spans. Plugins kunnen zich er ook rechtstreeks op abonneren
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
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` en
  optioneel `cleanupFailed` toe.

**Exec**

- `exec.process.completed` - terminale uitkomst, duur, doel, modus, afsluitcode
  en foutsoort. Opdrachttekst en werkmappen worden niet
  opgenomen.

## Zonder exporter

Je kunt diagnostische events beschikbaar houden voor Plugins of aangepaste sinks zonder
`diagnostics-otel` uit te voeren:

```json5
{
  diagnostics: { enabled: true },
}
```

Gebruik diagnostische flags voor gerichte debuguitvoer zonder `logging.level` te verhogen.
Flags zijn niet hoofdlettergevoelig en ondersteunen jokertekens (bijv. `telegram.*` of
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Of als eenmalige env-overschrijving:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Flaguitvoer gaat naar het standaardlogbestand (`logging.file`) en wordt nog steeds
geredigeerd door `logging.redactSensitive`. Volledige gids:
[Diagnostische flags](/nl/diagnostics/flags).

## Uitschakelen

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Je kunt `diagnostics-otel` ook weglaten uit `plugins.allow`, of
`openclaw plugins disable diagnostics-otel` uitvoeren.

## Gerelateerd

- [Logging](/nl/logging) - bestandslogs, console-uitvoer, CLI-tailing en het tabblad Logs in de Control UI
- [Interne werking van Gateway-logging](/nl/gateway/logging) - WS-logstijlen, subsysteemprefixen en consolevastlegging
- [Diagnostische flags](/nl/diagnostics/flags) - gerichte debuglog-flags
- [Diagnostische export](/nl/gateway/diagnostics) - operator-tool voor supportbundels (los van OTEL-export)
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) - volledige veldreferentie voor `diagnostics.*`
