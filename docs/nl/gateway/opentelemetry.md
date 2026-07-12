---
read_when:
    - U wilt statistieken over OpenClaw-modelgebruik, berichtenstromen of sessies naar een OpenTelemetry-collector verzenden
    - Je koppelt traceringen, metrische gegevens of logboeken aan Grafana, Datadog, Honeycomb, New Relic, Tempo of een andere OTLP-backend
    - U hebt de exacte namen van metrische gegevens, spannamen of attribuutstructuren nodig om dashboards of waarschuwingen te maken
summary: Exporteer OpenClaw-diagnostiek naar OpenTelemetry-collectors of JSONL op stdout via de diagnostics-otel-plugin
title: OpenTelemetry-export
x-i18n:
    generated_at: "2026-07-12T08:51:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporteert diagnostische gegevens via de officiële Plugin `diagnostics-otel`
met **OTLP/HTTP (protobuf)**. Logboeken kunnen ook als JSONL naar stdout worden
geschreven voor logpijplijnen van containers en sandboxes. Elke collector of backend
die OTLP/HTTP accepteert, werkt zonder codewijzigingen. Zie
[Logboekregistratie](/nl/logging) voor lokale logbestanden.

- **Diagnostische gebeurtenissen** zijn gestructureerde records binnen het proces die
  door de Gateway en meegeleverde plugins worden uitgezonden voor modeluitvoeringen,
  berichtstromen, sessies, wachtrijen en exec.
- **`diagnostics-otel`** abonneert zich op deze gebeurtenissen en exporteert ze als
  OpenTelemetry-**metrieken**, **traces** en **logboeken** via OTLP/HTTP, en kan
  logboekrecords spiegelen naar stdout als JSONL.
- **Provideraanroepen** ontvangen een W3C-`traceparent`-header uit de context van de
  vertrouwde modelaanroepspan van OpenClaw wanneer het providertransport aangepaste
  headers accepteert. Door plugins uitgezonden tracecontext wordt niet doorgegeven.
- Exporters worden alleen gekoppeld wanneer zowel de diagnostische interface als de
  Plugin zijn ingeschakeld, waardoor de kosten binnen het proces standaard vrijwel nul
  blijven.

## Snel aan de slag

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

Of schakel de Plugin in via de CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` ondersteunt alleen `http/protobuf`. Omdat `traces` en `metrics` standaard zijn ingeschakeld, breekt elke andere waarde (waaronder `grpc`) het volledige diagnostics-otel-abonnement af met de waarschuwing `unsupported protocol` — hierdoor stopt ook de export van logboeken naar stdout. Stel `traces: false` en `metrics: false` expliciet in als u alleen `logsExporter: "stdout"` met een niet-OTLP-protocolwaarde wilt gebruiken.
</Note>

## Geëxporteerde signalen

| Signaal      | Inhoud                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrieken** | Tellers/histogrammen voor tokengebruik, kosten, uitvoeringsduur, failover, gebruik van Skills, berichtstroom, Talk-gebeurtenissen, wachtrijbanen, sessiestatus/-herstel, tooluitvoering, exec, geheugen, beschikbaarheid en status van de exporter. |
| **Traces**  | Spans voor modelgebruik, modelaanroepen, levenscyclus van de harness, gebruik van Skills, tooluitvoering, exec, verwerking van Webhooks/berichten, contextopbouw en toollussen.                                                      |
| **Logboeken**    | Gestructureerde `logging.file`-records die via OTLP of als JSONL naar stdout worden geëxporteerd wanneer `diagnostics.otel.logs` is ingeschakeld; logboekinhoud wordt weggelaten tenzij inhoudsregistratie expliciet is ingeschakeld.                          |

Schakel `traces`, `metrics` en `logs` onafhankelijk van elkaar in of uit. Traces en
metrieken zijn standaard ingeschakeld wanneer `diagnostics.otel.enabled` waar is;
logboeken zijn standaard uitgeschakeld en worden alleen geëxporteerd wanneer
`diagnostics.otel.logs` expliciet `true` is. Logboekexport gebruikt standaard OTLP;
stel `diagnostics.otel.logsExporter` in op `stdout` voor JSONL op stdout, of op
`both` voor beide.

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
      protocol: "http/protobuf", // grpc schakelt OTLP-export uit
      serviceName: "openclaw-gateway", // indien niet ingesteld, wordt teruggevallen op OTEL_SERVICE_NAME en daarna op "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // sampler voor hoofdspans, 0.0..1.0
      flushIntervalMs: 60000, // interval voor metriekexport (minimaal 1000 ms)
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

| Variabele                                                                                                          | Doel                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Terugvalwaarde voor `diagnostics.otel.endpoint` wanneer de configuratiesleutel niet is ingesteld.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signaalspecifieke terugval-eindpunten die worden gebruikt wanneer de bijbehorende configuratiesleutel `diagnostics.otel.*Endpoint` niet is ingesteld. Signaalspecifieke configuratie heeft voorrang op signaalspecifieke omgevingsvariabelen, die op hun beurt voorrang hebben op het gedeelde eindpunt.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Terugvalwaarde voor `diagnostics.otel.serviceName` wanneer de configuratiesleutel niet is ingesteld. De standaardservicenaam is `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Terugvalwaarde voor het overdrachtsprotocol wanneer `diagnostics.otel.protocol` niet is ingesteld. Alleen `http/protobuf` schakelt export in.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Stel in op `gen_ai_latest_experimental` om de nieuwste vorm van GenAI-inferentiespans uit te zenden: spannamen `{gen_ai.operation.name} {gen_ai.request.model}`, spantype `CLIENT` en `gen_ai.provider.name` in plaats van het verouderde `gen_ai.system`. GenAI-metrieken gebruiken altijd begrensde attributen met een lage cardinaliteit. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Stel in op `1` wanneer een andere preload of een ander hostproces de globale OpenTelemetry-SDK al heeft geregistreerd. De Plugin slaat dan zijn eigen NodeSDK-levenscyclus over, maar koppelt nog steeds diagnostische listeners en respecteert `traces`/`metrics`/`logs`.                                                                                    |

## Privacy en inhoudsregistratie

Onbewerkte model-/toolinhoud wordt standaard **niet** geëxporteerd. Spans bevatten
begrensde identificatoren (kanaal, provider, model, foutcategorie, uitsluitend gehashte
aanvraag-id's, toolbron, tooleigenaar, naam/bron van Skills) en bevatten nooit
prompttekst, antwoordtekst, toolinvoer, tooluitvoer, bestandspaden van Skills of
sessiesleutels. Waarden die eruitzien als sessiesleutels met een agentbereik
(bijvoorbeeld beginnend met `agent:`) worden in attributen met lage cardinaliteit
vervangen door `unknown`. OTLP-logboekrecords behouden standaard de ernst, logger,
codelocatie, vertrouwde tracecontext en opgeschoonde attributen; de onbewerkte inhoud
van het logboekbericht wordt alleen geëxporteerd wanneer
`diagnostics.otel.captureContent` de Booleaanse waarde `true` heeft. Gedetailleerde
subsleutels onder `captureContent.*` schakelen logboekinhoud nooit in. Talk-metrieken
exporteren alleen begrensde gebeurtenismetadata (modus, transport, provider,
gebeurtenistype) — geen transcripties, audiopayloads, sessie-id's, beurt-id's,
oproep-id's, ruimte-id's of overdrachtstokens.

Uitgaande modelaanvragen kunnen een W3C-`traceparent`-header bevatten die uitsluitend
wordt gegenereerd vanuit tracecontext voor diagnostiek die eigendom is van OpenClaw
voor de actieve modelaanroep. Bestaande door de aanroeper opgegeven
`traceparent`-headers worden vervangen, zodat plugins of aangepaste provideropties
geen traceafstamming tussen services kunnen vervalsen.

Stel `diagnostics.otel.captureContent.*` alleen in op `true` wanneer uw collector
en bewaarbeleid zijn goedgekeurd voor tekst uit prompts, antwoorden, tools of
systeemprompts. Elke subsleutel werkt onafhankelijk:

- `inputMessages` — inhoud van gebruikersprompts.
- `outputMessages` — inhoud van modelantwoorden.
- `toolInputs` — payloads met toolargumenten.
- `toolOutputs` — payloads met toolresultaten.
- `systemPrompt` — samengestelde systeem-/ontwikkelaarsprompt.
- `toolDefinitions` — namen, beschrijvingen en schema's van modeltools.

Wanneer een subsleutel is ingeschakeld, krijgen model- en toolspans alleen voor die
klasse begrensde, geredigeerde `openclaw.content.*`-attributen.

<Note>
De Booleaanse waarde `captureContent: true` schakelt `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` en de inhoud van OTLP-logboeken gezamenlijk in, maar **niet** `systemPrompt` — stel `captureContent.systemPrompt: true` expliciet in als u ook de samengestelde systeemprompt nodig hebt.
</Note>

Inhoud van `toolInputs`/`toolOutputs` wordt vastgelegd voor tooluitvoeringen van de
ingebouwde agentruntime (`openclaw.content.tool_input` en
`gen_ai.tool.call.arguments` bij voltooide spans/foutspans;
`openclaw.content.tool_output` en `gen_ai.tool.call.result` bij voltooide
spans). De namen `openclaw.content.*` blijven de stabiele OpenClaw-attribuutnamen;
de kopieën van `gen_ai.tool.call.*` spiegelen deze voor viewers die semconv
rechtstreeks ondersteunen. Toolaanroepen van externe harnesses (Codex, Claude CLI)
zenden `tool.execution.*`-spans uit zonder inhoudspayloads. Vastgelegde inhoud wordt
via een vertrouwd kanaal uitsluitend voor listeners verzonden en wordt nooit op de
openbare bus voor diagnostische gebeurtenissen geplaatst.

## Sampling en flushen

- **Traces:** `diagnostics.otel.sampleRate` stelt alleen voor de root-span een `TraceIdRatioBasedSampler`
  in (`0.0` laat alles vallen, `1.0` behoudt alles). Indien niet ingesteld, wordt de
  standaardwaarde van de OpenTelemetry SDK gebruikt (altijd ingeschakeld).
- **Metrieken:** `diagnostics.otel.flushIntervalMs` (begrensd op een minimum van
  `1000`); indien niet ingesteld, wordt de standaardwaarde van de SDK voor periodieke export gebruikt.
- **Logboeken:** OTLP-logboeken respecteren `logging.level` (logniveau van het bestand) en gebruiken het
  redactiepad voor diagnostische logrecords, niet de consoleopmaak. Installaties met grote volumes
  kunnen beter sampling/filtering van de OTLP-collector gebruiken dan lokale
  sampling. Stel `diagnostics.otel.logsExporter: "stdout"` in wanneer uw platform
  stdout/stderr al naar een logverwerker verzendt en u geen OTLP-logcollector
  hebt. Stdout-records bestaan uit één JSON-object per regel met `ts`, `signal`,
  `service.name`, ernstniveau, inhoud, geredigeerde attributen en vertrouwde tracevelden
  indien beschikbaar.
- **Correlatie van bestandslogboeken:** JSONL-bestandslogboeken bevatten `traceId`,
  `spanId`, `parentSpanId` en `traceFlags` op het hoogste niveau wanneer de logaanroep een geldige
  diagnostische tracecontext bevat, zodat logverwerkers lokale logregels aan
  geëxporteerde spans kunnen koppelen.
- **Aanvraagcorrelatie:** HTTP-aanvragen en WebSocket-frames van de Gateway maken
  een intern tracebereik voor de aanvraag. Logboeken en diagnostische gebeurtenissen binnen dat
  bereik nemen standaard de aanvraagtrace over, terwijl spans voor agentruns en modelaanroepen
  als onderliggende spans worden gemaakt, zodat `traceparent`-headers van providers binnen dezelfde
  trace blijven.
- **Correlatie van modelaanroepen:** `openclaw.model.call`-spans bevatten standaard veilige groottes van
  promptcomponenten en tokenattributen per aanroep wanneer het providerresultaat
  gebruiksgegevens beschikbaar stelt. `openclaw.model.usage` blijft de span voor boekhouding
  op runniveau voor geaggregeerde kosten-, context- en kanaaldashboards en
  blijft binnen dezelfde diagnostische trace wanneer de emitterende runtime over een vertrouwde
  tracecontext beschikt.

## Geëxporteerde metrieken

### Modelgebruik

- `openclaw.tokens` (teller, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (teller, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metriek volgens de semantische GenAI-conventies, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconden, metriek volgens de semantische GenAI-conventies, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optioneel `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` en `openclaw.failureKind` bij geclassificeerde fouten)
- `openclaw.model_call.request_bytes` (histogram, UTF-8-bytegrootte van de uiteindelijke payload van de modelaanvraag; geen onbewerkte payloadinhoud)
- `openclaw.model_call.response_bytes` (histogram, UTF-8-bytegrootte van payloads van gestreamde responsfragmenten; frequente tekst-, redeneer- en toolaanroepdelta's tellen alleen incrementele `delta`-bytes; geen onbewerkte responsinhoud)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, verstreken tijd vóór de eerste gestreamde responsgebeurtenis)
- `openclaw.model.failover` (teller, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (teller, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, optioneel `openclaw.agent`, optioneel `openclaw.toolName`)

### Berichtenstroom

- `openclaw.webhook.received` (teller, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (teller, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (teller, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (teller, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (teller, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (teller, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (teller, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (teller, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Spraak

- `openclaw.talk.event` (teller, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: hetzelfde als `openclaw.talk.event`; uitgezonden wanneer een spraakgebeurtenis een duur rapporteert)
- `openclaw.talk.audio.bytes` (histogram, attrs: hetzelfde als `openclaw.talk.event`; uitgezonden voor gebeurtenissen van spraakaudioframes die een bytelengte rapporteren)

### Wachtrijen en sessies

- `openclaw.queue.lane.enqueue` (teller, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (teller, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` of `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (teller, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (teller, attrs: `openclaw.state`; uitgezonden voor herstelbare verouderde sessieboekhouding)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; uitgezonden voor herstelbare verouderde sessieboekhouding)
- `openclaw.session.turn.created` (teller, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (teller, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (teller, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, attrs: hetzelfde als de bijbehorende herstelteller)
- `openclaw.run.attempt` (teller, attrs: `openclaw.attempt`)

### Telemetrie voor sessieactiviteit

`diagnostics.stuckSessionWarnMs` is de leeftijdsdrempel zonder voortgang voor diagnostiek van
sessieactiviteit. Een `processing`-sessie nadert deze
drempel niet zolang OpenClaw voortgang waarneemt van antwoorden, tools, status, blokkades of de ACP-runtime.
Keepalives voor typen tellen niet als voortgang, zodat een stil model of
harnas nog steeds kan worden gedetecteerd.

OpenClaw classificeert sessies op basis van het werk dat nog kan worden waargenomen:

- `session.long_running`: actief ingebed werk, modelaanroepen of toolaanroepen
  boeken nog steeds voortgang. Modelaanroepen met een eigenaar die langer stil blijven dan
  `diagnostics.stuckSessionWarnMs`, worden vóór
  `diagnostics.stuckSessionAbortMs` ook als langdurig gerapporteerd, zodat trage of niet-streamende modelproviders
  niet op vastgelopen Gateway-sessies lijken zolang afbreken waarneembaar is.
- `session.stalled`: er is actief werk, maar de actieve run heeft geen
  recente voortgang gerapporteerd. Modelaanroepen met een eigenaar schakelen op of na
  `diagnostics.stuckSessionAbortMs` over van `session.long_running` naar
  `session.stalled`; verouderde model-/toolactiviteit zonder eigenaar wordt niet als onschadelijk langdurig werk behandeld.
  Vastgelopen ingebedde runs worden aanvankelijk alleen geobserveerd en gaan vervolgens na
  `diagnostics.stuckSessionAbortMs` zonder voortgang over op afbreken en leegmaken, zodat achterliggende
  beurten in de wachtrij van de lane kunnen worden hervat. Indien niet ingesteld, gebruikt de afbreekdrempel standaard het veiligere
  verlengde venster van minstens 5 minuten en 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: verouderde sessieboekhouding zonder actief werk, of een inactieve
  sessie in de wachtrij met verouderde model-/toolactiviteit zonder eigenaar. Hierdoor wordt de
  getroffen sessielane onmiddellijk vrijgegeven nadat de herstelcontroles zijn geslaagd.

Herstel zendt gestructureerde gebeurtenissen `session.recovery.requested` en
`session.recovery.completed` uit. De diagnostische sessiestatus wordt pas als inactief gemarkeerd
na een muterend herstelresultaat (`aborted` of `released`) en alleen als
dezelfde verwerkingsgeneratie nog actueel is.

Alleen `session.stuck` zendt de teller `openclaw.session.stuck`, het
histogram `openclaw.session.stuck_age_ms` en de span `openclaw.session.stuck`
uit. Herhaalde diagnostiek voor `session.stuck` past een toenemende vertraging toe zolang de sessie
ongewijzigd blijft, zodat dashboards moeten waarschuwen bij aanhoudende stijgingen in plaats van bij
elke Heartbeat-tik. Zie voor de configuratieoptie en standaardwaarden
[Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics).

Waarschuwingen voor activiteit zenden ook het volgende uit:

- `openclaw.liveness.warning` (teller, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, attrs: `openclaw.liveness.reason`)

### Levenscyclus van het harnas

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bij fouten)

### Tooluitvoering en lusdetectie

- `openclaw.tool.execution.duration_ms` (histogram, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, plus `openclaw.errorCategory` bij fouten)
- `openclaw.tool.execution.blocked` (teller, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (teller, attrs: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, optioneel `openclaw.loop.paired_tool`; uitgezonden wanneer een herhaalde lus van toolaanroepen wordt gedetecteerd)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Interne diagnostiek (geheugen, payloads, exportstatus)

- `openclaw.payload.large` (teller, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, attrs: hetzelfde als `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogrammen, geen attrs; metingen van procesgeheugen)
- `openclaw.memory.pressure` (teller, attrs: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (teller, attrs: `openclaw.diagnostic.async_queue.drop_class`; verlies door tegendruk in de interne diagnostische wachtrij)
- `openclaw.telemetry.exporter.events` (teller, attrs: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, optioneel `openclaw.reason`, optioneel `openclaw.errorCategory`; zelftelemetrie voor de levenscyclus en fouten van de exporter)

## Geëxporteerde spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - standaard `gen_ai.system`, of `gen_ai.provider.name` wanneer voor de nieuwste semantische GenAI-conventies is gekozen
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - standaard `gen_ai.system`, of `gen_ai.provider.name` wanneer voor de nieuwste semantische GenAI-conventies is gekozen
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` en optioneel `openclaw.failureKind` bij fouten
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (alleen veilige componentgroottes, geen prompttekst)
  - `openclaw.model_call.usage.*` en `gen_ai.usage.*` wanneer het resultaat van de modelaanroep gebruiksgegevens van de provider voor die afzonderlijke aanroep bevat
  - Span-gebeurtenis `openclaw.provider.request` met attribuut `openclaw.upstreamRequestIdHash` (begrensd, op hashes gebaseerd) wanneer het resultaat van de bovenliggende provider een aanvraag-ID bevat; onbewerkte ID's worden nooit geëxporteerd
  - Met `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` gebruiken spans van modelaanroepen de nieuwste GenAI-naam voor inferentiespans `{gen_ai.operation.name} {gen_ai.request.model}` en het spantype `CLIENT` in plaats van `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Bij voltooiing: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Bij een fout: `openclaw.harness.phase`, `openclaw.errorCategory`, optioneel `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, optioneel `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Optioneel `openclaw.errorCategory`/`openclaw.errorCode` bij fouten, `openclaw.deniedReason` en `openclaw.outcome=blocked` bij weigering door beleid of sandbox
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (geen inhoud van prompts, geschiedenis, antwoorden of sessiesleutels)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, optioneel `openclaw.loop.paired_tool` (geen lusberichten, parameters of uitvoer van hulpmiddelen)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, optioneel `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

Wanneer inhoudsregistratie expliciet is ingeschakeld, kunnen model- en hulpmiddelspans ook
begrensde, geredigeerde `openclaw.content.*`-attributen bevatten voor de specifieke
inhoudsklassen waarvoor u hebt gekozen.

## Catalogus met diagnostische gebeurtenissen

De onderstaande gebeurtenissen vormen de basis voor de bovenstaande metrische gegevens en spans. Plugins kunnen zich er ook
rechtstreeks op abonneren zonder OTLP-export.

**Modelgebruik**

- `model.usage` - tokens, kosten, duur, context, provider/model/kanaal en
  sessie-ID's. `usage` is de gebruiksregistratie van de provider/beurt voor kosten en telemetrie;
  `context.used` is de huidige momentopname van de prompt/context en kan lager zijn dan
  `usage.total` van de provider wanneer invoer uit de cache of aanroepen in hulpmiddellussen een rol spelen.

**Berichtenstroom**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Wachtrij en sessie**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (geaggregeerde tellers: webhooks/wachtrij/sessie)

**Levenscyclus van de harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  levenscyclus per uitvoering voor de agent-harness. Bevat `harnessId`, optioneel
  `pluginId`, provider/model/kanaal en uitvoerings-ID. Bij voltooiing worden
  `durationMs`, `outcome`, optioneel `resultClassification`, `yieldDetected`
  en aantallen voor `itemLifecycle` toegevoegd. Bij fouten worden `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` en
  optioneel `cleanupFailed` toegevoegd.

**Uitvoering**

- `exec.process.completed` - eindstatus van de terminal, duur, doel, modus, afsluitcode
  en fouttype. Opdrachttekst en werkmappen worden niet
  opgenomen.
- `exec.approval.followup_suppressed` - verouderde opvolging van een goedkeuring verwijderd
  nadat een sessie opnieuw is gekoppeld. Bevat `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` of `gateway_preflight`)
  en het tijdstempel van de dispatcher. Sessiesleutels, routes en opdrachttekst worden
  niet opgenomen.

## Zonder een exportmodule

Houd diagnostische gebeurtenissen beschikbaar voor Plugins of aangepaste uitvoerbestemmingen zonder
`diagnostics-otel` uit te voeren:

```json5
{
  diagnostics: { enabled: true },
}
```

Gebruik diagnostische vlaggen voor gerichte foutopsporingsuitvoer zonder `logging.level`
te verhogen. Vlaggen zijn niet hoofdlettergevoelig en ondersteunen jokertekens (`telegram.*` of
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Of als een eenmalige overschrijving via een omgevingsvariabele:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Uitvoer van vlaggen gaat naar het standaardlogbestand (`logging.file`) en wordt nog steeds
geredigeerd door `logging.redactSensitive`. Volledige handleiding:
[Diagnostische vlaggen](/nl/diagnostics/flags).

## Uitschakelen

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Of laat `diagnostics-otel` weg uit `plugins.allow`, of voer
`openclaw plugins disable diagnostics-otel` uit.

## Gerelateerd

- [Logboekregistratie](/nl/logging) - bestandslogboeken, console-uitvoer, volgen via de CLI en het tabblad Logboeken in de Control UI
- [Interne Gateway-logboekregistratie](/nl/gateway/logging) - WS-logboekstijlen, voorvoegsels van subsystemen en vastlegging van console-uitvoer
- [Diagnostische vlaggen](/nl/diagnostics/flags) - gerichte vlaggen voor foutopsporingslogboeken
- [Diagnostische export](/nl/gateway/diagnostics) - hulpmiddel voor ondersteuningsbundels voor beheerders (los van OTEL-export)
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) - volledige referentie voor `diagnostics.*`-velden
