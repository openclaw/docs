---
read_when:
    - Je wilt OpenClaw-modelgebruik, berichtenstroom of sessiestatistieken naar een OpenTelemetry-collector sturen
    - Je koppelt traceringen, metriekgegevens of logboeken aan Grafana, Datadog, Honeycomb, New Relic, Tempo of een andere OTLP-backend
    - Je hebt de exacte namen van metrieken, span-namen of attribuutstructuren nodig om dashboards of waarschuwingen te bouwen
summary: Exporteer OpenClaw-diagnostiek naar elke OpenTelemetry-collector via de diagnostics-otel Plugin (OTLP/HTTP)
title: OpenTelemetry-export
x-i18n:
    generated_at: "2026-05-06T09:15:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d52e5072fcdb097a3dce36a13d9470cea8c169d2af49998cd727814013c411e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporteert diagnostiek via de officiële `diagnostics-otel`-plugin
met **OTLP/HTTP (protobuf)**. Elke collector of backend die OTLP/HTTP accepteert
werkt zonder codewijzigingen. Zie [Logboekregistratie](/nl/logging) voor lokale bestandslogs en hoe je ze leest.

## Hoe het samenwerkt

- **Diagnostische gebeurtenissen** zijn gestructureerde, procesinterne records die worden uitgezonden door de
  Gateway en gebundelde plugins voor modelruns, berichtstromen, sessies, wachtrijen,
  en exec.
- De **`diagnostics-otel`-plugin** abonneert zich op die gebeurtenissen en exporteert ze als
  OpenTelemetry-**metrics**, **traces** en **logs** via OTLP/HTTP.
- **Provider-aanroepen** ontvangen een W3C `traceparent`-header van OpenClaw's
  vertrouwde spancontext voor modelaanroepen wanneer het providertransport aangepaste
  headers accepteert. Door plugins uitgezonden tracecontext wordt niet doorgegeven.
- Exporters worden alleen gekoppeld wanneer zowel het diagnostiekoppervlak als de plugin zijn
  ingeschakeld, zodat de procesinterne kosten standaard vrijwel nul blijven.

## Snelstart

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

Je kunt de plugin ook inschakelen vanuit de CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` ondersteunt momenteel alleen `http/protobuf`. `grpc` wordt genegeerd.
</Note>

## Geëxporteerde signalen

| Signaal     | Wat erin terechtkomt                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | Counters en histogrammen voor tokengebruik, kosten, runduur, berichtstroom, wachtrijlanes, sessiestatus, exec en geheugendruk.             |
| **Traces**  | Spans voor modelgebruik, modelaanroepen, harness-levenscyclus, tooluitvoering, exec, webhook-/berichtverwerking, contextopbouw en toollussen. |
| **Logs**    | Gestructureerde `logging.file`-records die via OTLP worden geëxporteerd wanneer `diagnostics.otel.logs` is ingeschakeld.                   |

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
      protocol: "http/protobuf", // grpc wordt genegeerd
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric-exportinterval (min 1000ms)
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

| Variabele                                                                                                         | Doel                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Overschrijft `diagnostics.otel.endpoint`. Als de waarde al `/v1/traces`, `/v1/metrics` of `/v1/logs` bevat, wordt die ongewijzigd gebruikt.                                                                                               |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signaalspecifieke endpoint-overschrijvingen die worden gebruikt wanneer de overeenkomende configuratiesleutel `diagnostics.otel.*Endpoint` niet is ingesteld. Signaalspecifieke configuratie wint van signaalspecifieke env, die wint van het gedeelde endpoint. |
| `OTEL_SERVICE_NAME`                                                                                               | Overschrijft `diagnostics.otel.serviceName`.                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Overschrijft het wireprotocol; alleen `http/protobuf` wordt vandaag gehonoreerd.                                                                                                                                                          |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Stel in op `gen_ai_latest_experimental` om het nieuwste experimentele GenAI-spanattribuut (`gen_ai.provider.name`) uit te zenden in plaats van het verouderde `gen_ai.system`. GenAI-metrics gebruiken altijd begrensde semantische attributen met lage cardinaliteit. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Stel in op `1` wanneer een andere preload of hostproces de globale OpenTelemetry SDK al heeft geregistreerd. De plugin slaat dan zijn eigen NodeSDK-levenscyclus over, maar koppelt nog steeds diagnostische listeners en respecteert `traces`/`metrics`/`logs`. |

## Privacy en inhoud vastleggen

Ruwe model-/toolinhoud wordt standaard **niet** geëxporteerd. Spans bevatten begrensde
identifiers (kanaal, provider, model, foutcategorie, request-id's met alleen hash)
en bevatten nooit prompttekst, antwoordtekst, toolinvoer, tooluitvoer of
sessiesleutels.

Uitgaande modelrequests kunnen een W3C `traceparent`-header bevatten. Die header wordt
alleen gegenereerd vanuit OpenClaw-eigen diagnostische tracecontext voor de actieve modelaanroep.
Bestaande door de aanroeper geleverde `traceparent`-headers worden vervangen, zodat plugins of
aangepaste provideropties geen cross-service trace-afstamming kunnen vervalsen.

Stel `diagnostics.otel.captureContent.*` alleen in op `true` wanneer je collector en
retentiebeleid zijn goedgekeurd voor prompt-, antwoord-, tool- of systeemprompttekst.
Elke subsleutel is afzonderlijk opt-in:

- `inputMessages` - inhoud van gebruikersprompts.
- `outputMessages` - inhoud van modelantwoorden.
- `toolInputs` - payloads van toolargumenten.
- `toolOutputs` - payloads van toolresultaten.
- `systemPrompt` - samengestelde systeem-/developerprompt.

Wanneer een subsleutel is ingeschakeld, krijgen model- en toolspans alleen voor die klasse begrensde, geredigeerde
`openclaw.content.*`-attributen.

## Sampling en flushen

- **Traces:** `diagnostics.otel.sampleRate` (alleen root-span, `0.0` laat alles vallen,
  `1.0` bewaart alles).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** OTLP-logs respecteren `logging.level` (bestandslogniveau). Ze gebruiken het
  redactietraject voor diagnostische logrecords, niet console-opmaak. Installaties met hoog volume
  moeten de voorkeur geven aan sampling/filtering in de OTLP-collector boven lokale sampling.
- **Bestandslogcorrelatie:** JSONL-bestandslogs bevatten top-level `traceId`,
  `spanId`, `parentSpanId` en `traceFlags` wanneer de logaanroep een geldige
  diagnostische tracecontext bevat, waardoor logprocessors lokale logregels kunnen koppelen aan
  geëxporteerde spans.
- **Requestcorrelatie:** Gateway-HTTP-requests en WebSocket-frames maken een
  intern request-tracebereik. Logs en diagnostische gebeurtenissen binnen dat bereik
  erven standaard de request-trace, terwijl agentrun- en modelaanroepspans worden
  gemaakt als children zodat provider-`traceparent`-headers op dezelfde trace blijven.

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
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; alleen uitgezonden voor verouderde sessieboekhouding zonder actief werk)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; alleen uitgezonden voor verouderde sessieboekhouding zonder actief werk)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetrie voor sessieliveness

`diagnostics.stuckSessionWarnMs` is de leeftijdsdrempel zonder voortgang voor diagnostiek van
sessieliveness. Een `processing`-sessie veroudert niet richting deze drempel
zolang OpenClaw reply-, tool-, status-, block- of ACP-runtimevoortgang observeert.
Typing-keepalives worden niet als voortgang geteld, zodat een stil model of harness
nog steeds kan worden gedetecteerd.

OpenClaw classificeert sessies op basis van het werk dat het nog kan observeren:

- `session.long_running`: actief ingesloten werk, modelaanroepen of toolaanroepen
  maken nog steeds voortgang.
- `session.stalled`: er is actief werk, maar de actieve run heeft geen recente
  voortgang gemeld. Vastgelopen ingesloten runs blijven eerst alleen-observeren
  en gaan daarna naar abort-drain na `diagnostics.stuckSessionAbortMs` zonder
  voortgang, zodat wachtrijbeurten achter de lane kunnen worden hervat. Wanneer
  niet ingesteld, valt de afbreekdrempel terug op het veiligere verlengde venster
  van minimaal 10 minuten en 5x `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: verouderde sessieboekhouding zonder actief werk. Dit geeft de
  getroffen sessielane onmiddellijk vrij.

Herstel verstuurt gestructureerde gebeurtenissen `session.recovery.requested` en
`session.recovery.completed`. Diagnostische sessiestatus wordt pas als inactief
gemarkeerd na een muterende hersteluitkomst (`aborted` of `released`) en alleen
als dezelfde verwerkingsgeneratie nog steeds actueel is.

Alleen `session.stuck` verstuurt de teller `openclaw.session.stuck`, het
histogram `openclaw.session.stuck_age_ms` en de span `openclaw.session.stuck`.
Herhaalde `session.stuck`-diagnostiek gebruikt back-off zolang de sessie
ongewijzigd blijft, dus dashboards moeten waarschuwen bij aanhoudende toenames
in plaats van bij elke Heartbeat-tick. Zie voor de configuratieknop en
standaardwaarden de
[Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics).

### Harness-levenscyclus

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bij fouten)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Interne diagnostiek (geheugen en tool-loop)

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (teller, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (teller, attrs: `openclaw.toolName`, `openclaw.outcome`)
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
  - `openclaw.provider.request_id_hash` (begrensde SHA-gebaseerde hash van de aanvraag-id van de upstream provider; ruwe id's worden niet geëxporteerd)
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (geen loop-berichten, params of tooluitvoer)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wanneer inhoudsvastlegging expliciet is ingeschakeld, kunnen model- en
tool-spans ook begrensde, geredigeerde `openclaw.content.*`-attributen bevatten
voor de specifieke inhoudsklassen waarvoor je hebt gekozen.

## Catalogus met diagnostische gebeurtenissen

De onderstaande gebeurtenissen ondersteunen de metrics en spans hierboven.
Plugins kunnen zich er ook direct op abonneren zonder OTLP-export.

**Modelgebruik**

- `model.usage` - tokens, kosten, duur, context, provider/model/channel,
  sessie-id's. `usage` is provider-/beurtboekhouding voor kosten en telemetrie;
  `context.used` is de huidige prompt-/contextsnapshot en kan lager zijn dan
  provider `usage.total` wanneer gecachte input of tool-loop-aanroepen betrokken
  zijn.

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
  `pluginId`, provider/model/channel en run-id. Voltooiing voegt
  `durationMs`, `outcome`, optioneel `resultClassification`, `yieldDetected`
  en `itemLifecycle`-aantallen toe. Fouten voegen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` en
  optioneel `cleanupFailed` toe.

**Exec**

- `exec.process.completed` - terminale uitkomst, duur, doel, modus, afsluitcode
  en soort fout. Opdrachttekst en werkmappen worden niet opgenomen.

## Zonder exporter

Je kunt diagnostische gebeurtenissen beschikbaar houden voor Plugins of
aangepaste sinks zonder `diagnostics-otel` uit te voeren:

```json5
{
  diagnostics: { enabled: true },
}
```

Gebruik diagnostische vlaggen voor gerichte debuguitvoer zonder
`logging.level` te verhogen. Vlaggen zijn hoofdletterongevoelig en ondersteunen
wildcards (bijv. `telegram.*` of `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Of als een eenmalige env-override:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Vlaguitvoer gaat naar het standaardlogbestand (`logging.file`) en wordt nog
steeds geredigeerd door `logging.redactSensitive`. Volledige gids:
[Diagnostische vlaggen](/nl/diagnostics/flags).

## Uitschakelen

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Je kunt `diagnostics-otel` ook uit `plugins.allow` laten, of
`openclaw plugins disable diagnostics-otel` uitvoeren.

## Gerelateerd

- [Logging](/nl/logging) - bestandslogs, console-uitvoer, CLI-tailing en het tabblad Logs in de Control UI
- [Interne Gateway-logging](/nl/gateway/logging) - WS-logstijlen, subsystem-prefixen en consolevastlegging
- [Diagnostische vlaggen](/nl/diagnostics/flags) - gerichte debuglogvlaggen
- [Diagnostische export](/nl/gateway/diagnostics) - supportbundeltool voor operators (los van OTEL-export)
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) - volledige referentie voor `diagnostics.*`-velden
