---
read_when:
    - Je wilt OpenClaw-modelgebruik, berichtenstroom of sessiestatistieken naar een OpenTelemetry-collector sturen
    - Je koppelt traces, metrieken of logs aan Grafana, Datadog, Honeycomb, New Relic, Tempo of een andere OTLP-backend
    - Je hebt de exacte metrieknamen, spannamen of attribuutstructuren nodig om dashboards of waarschuwingen te bouwen
summary: Exporteer OpenClaw-diagnostiek naar elke OpenTelemetry-collector via de diagnostics-otel Plugin (OTLP/HTTP)
title: OpenTelemetry-export
x-i18n:
    generated_at: "2026-05-03T21:32:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8091aa633a3e10593681f94913a858587a5dc69d9947e0c0d4132f6e897b00b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporteert diagnostiek via de officiële `diagnostics-otel`-Plugin
met **OTLP/HTTP (protobuf)**. Elke collector of backend die OTLP/HTTP accepteert,
werkt zonder codewijzigingen. Zie [Logboekregistratie](/nl/logging) voor lokale bestandslogs en hoe je ze leest.

## Hoe het samenhangt

- **Diagnostische events** zijn gestructureerde records binnen het proces die worden uitgezonden door de
  Gateway en meegeleverde Plugins voor modeluitvoeringen, berichtenstroom, sessies, wachtrijen
  en exec.
- De **`diagnostics-otel`-Plugin** abonneert zich op die events en exporteert ze als
  OpenTelemetry-**metrics**, **traces** en **logs** via OTLP/HTTP.
- **Provider-aanroepen** ontvangen een W3C `traceparent`-header vanuit OpenClaw's
  vertrouwde spancontext voor modelaanroepen wanneer het providertransport aangepaste
  headers accepteert. Door Plugins uitgezonden tracecontext wordt niet doorgegeven.
- Exporters worden alleen gekoppeld wanneer zowel het diagnostiekoppervlak als de Plugin zijn
  ingeschakeld, zodat de kosten binnen het proces standaard vrijwel nul blijven.

## Snel aan de slag

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

| Signaal     | Wat erin gaat                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Tellers en histogrammen voor tokengebruik, kosten, uitvoeringsduur, berichtenstroom, wachtrijlanes, sessiestatus, exec en geheugendruk.       |
| **Traces**  | Spans voor modelgebruik, modelaanroepen, harness-levenscyclus, tooluitvoering, exec, webhook-/berichtverwerking, contextopbouw en toollussen. |
| **Logs**    | Gestructureerde `logging.file`-records die via OTLP worden geëxporteerd wanneer `diagnostics.otel.logs` is ingeschakeld.                      |

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

| Variabele                                                                                                         | Doel                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Overschrijft `diagnostics.otel.endpoint`. Als de waarde al `/v1/traces`, `/v1/metrics` of `/v1/logs` bevat, wordt die ongewijzigd gebruikt.                                                                                                  |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signaalspecifieke endpoint-overschrijvingen die worden gebruikt wanneer de overeenkomende configuratiesleutel `diagnostics.otel.*Endpoint` niet is ingesteld. Signaalspecifieke configuratie wint van signaalspecifieke env, die wint van het gedeelde endpoint. |
| `OTEL_SERVICE_NAME`                                                                                               | Overschrijft `diagnostics.otel.serviceName`.                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Overschrijft het wireprotocol (alleen `http/protobuf` wordt vandaag ondersteund).                                                                                                                                                           |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Stel in op `gen_ai_latest_experimental` om het nieuwste experimentele GenAI-spanattribuut (`gen_ai.provider.name`) uit te zenden in plaats van het legacy `gen_ai.system`. GenAI-metrics gebruiken altijd begrensde semantische attributen met lage cardinaliteit. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Stel in op `1` wanneer een andere preload of hostproces de globale OpenTelemetry SDK al heeft geregistreerd. De Plugin slaat dan zijn eigen NodeSDK-levenscyclus over, maar verbindt nog steeds diagnostische listeners en respecteert `traces`/`metrics`/`logs`. |

## Privacy en inhoud vastleggen

Ruwe model-/toolinhoud wordt standaard **niet** geëxporteerd. Spans bevatten begrensde
identificatoren (kanaal, provider, model, foutcategorie, alleen gehashte aanvraag-id's)
en bevatten nooit prompttekst, antwoordtekst, toolinvoer, tooluitvoer of
sessiesleutels.

Uitgaande modelaanvragen kunnen een W3C `traceparent`-header bevatten. Die header wordt
alleen gegenereerd vanuit diagnostische tracecontext die eigendom is van OpenClaw voor de actieve modelaanroep.
Bestaande door de aanroeper geleverde `traceparent`-headers worden vervangen, zodat Plugins of
aangepaste provideropties geen trace-afkomst tussen services kunnen vervalsen.

Zet `diagnostics.otel.captureContent.*` alleen op `true` wanneer je collector en
retentiebeleid zijn goedgekeurd voor prompt-, antwoord-, tool- of systeemprompttekst.
Elke subsleutel is afzonderlijk opt-in:

- `inputMessages` — inhoud van gebruikersprompts.
- `outputMessages` — inhoud van modelantwoorden.
- `toolInputs` — payloads met toolargumenten.
- `toolOutputs` — payloads met toolresultaten.
- `systemPrompt` — samengestelde systeem-/ontwikkelaarsprompt.

Wanneer een subsleutel is ingeschakeld, krijgen model- en toolspans alleen voor die klasse begrensde, geredigeerde
`openclaw.content.*`-attributen.

## Sampling en flushen

- **Traces:** `diagnostics.otel.sampleRate` (alleen root-span, `0.0` laat alles vallen,
  `1.0` behoudt alles).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** OTLP-logs respecteren `logging.level` (bestandslogniveau). Ze gebruiken het
  redactiepad voor diagnostische logrecords, niet consoleopmaak. Installaties met hoog volume
  moeten de voorkeur geven aan sampling/filtering in de OTLP-collector boven lokale sampling.
- **Bestandslogcorrelatie:** JSONL-bestandslogs bevatten `traceId`,
  `spanId`, `parentSpanId` en `traceFlags` op het hoogste niveau wanneer de logaanroep een geldige
  diagnostische tracecontext bevat, waardoor logprocessors lokale logregels kunnen koppelen aan
  geëxporteerde spans.
- **Aanvraagcorrelatie:** Gateway-HTTP-aanvragen en WebSocket-frames maken een
  interne aanvraag-tracescope. Logs en diagnostische events binnen die scope
  erven standaard de aanvraagtrace, terwijl agentuitvoerings- en modelaanroeppans als
  kinderen worden gemaakt zodat provider-`traceparent`-headers op dezelfde trace blijven.

## Geëxporteerde metrics

### Modelgebruik

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconden, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optioneel `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` en `openclaw.failureKind` bij geclassificeerde fouten)
- `openclaw.model_call.request_bytes` (histogram, UTF-8-bytegrootte van de uiteindelijke payload voor de modelaanvraag; geen ruwe payloadinhoud)
- `openclaw.model_call.response_bytes` (histogram, UTF-8-bytegrootte van gestreamde modelantwoordevents; geen ruwe antwoordinhoud)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, verstreken tijd vóór het eerste gestreamde antwoordevent)

### Berichtenstroom

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

### Telemetrie voor sessie-levendigheid

`diagnostics.stuckSessionWarnMs` is de leeftijdsdrempel zonder voortgang voor diagnostiek van
sessie-levendigheid. Een `processing`-sessie veroudert niet richting deze drempel
terwijl OpenClaw voortgang in antwoord, tool, status, blok of ACP-runtime waarneemt.
Typing-keepalives tellen niet als voortgang, zodat een stil model of harness nog steeds
kan worden gedetecteerd.

OpenClaw classificeert sessies op basis van het werk dat het nog kan waarnemen:

- `session.long_running`: actief ingebed werk, modelaanroepen of toolaanroepen maken
  nog steeds voortgang.
- `session.stalled`: er bestaat actief werk, maar de actieve run heeft geen
  recente voortgang gemeld. Vastgelopen ingebedde runs blijven eerst alleen-observeren en
  gaan daarna abort-drain na minstens 10 minuten en 5x `diagnostics.stuckSessionWarnMs`
  zonder voortgang, zodat wachtrijbeurten achter de lane kunnen worden hervat.
- `session.stuck`: verouderde sessieboekhouding zonder actief werk. Dit geeft
  de betrokken sessie-lane onmiddellijk vrij.

Alleen `session.stuck` emitteert de teller `openclaw.session.stuck`, het
histogram `openclaw.session.stuck_age_ms` en de span `openclaw.session.stuck`.
Herhaalde `session.stuck`-diagnostics bouwen vertraging op zolang de sessie
ongewijzigd blijft, dus dashboards moeten waarschuwen bij aanhoudende stijgingen in plaats van bij elke
heartbeat-tick. Zie voor de configuratieknop en standaardwaarden de
[Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics).

### Harness-levenscyclus

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` bij fouten)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Interne diagnostics (geheugen en tool-loop)

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (teller, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (teller, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Geëxporteerde spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` standaard, of `gen_ai.provider.name` wanneer de nieuwste GenAI semantische conventies zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` standaard, of `gen_ai.provider.name` wanneer de nieuwste GenAI semantische conventies zijn ingeschakeld
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` en optioneel `openclaw.failureKind` bij fouten
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (begrensde SHA-gebaseerde hash van de upstream provider-request-id; ruwe id's worden niet geëxporteerd)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (geen prompt-, geschiedenis-, reactie- of session-key-inhoud)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (geen loop-berichten, params of tooluitvoer)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wanneer inhoudsvastlegging expliciet is ingeschakeld, kunnen model- en tool-spans ook
begrensde, geredigeerde `openclaw.content.*`-attributen bevatten voor de specifieke
inhoudsklassen waarvoor je hebt gekozen.

## Catalogus met diagnostic-events

De onderstaande events ondersteunen de metrics en spans hierboven. Plugins kunnen zich er ook
rechtstreeks op abonneren zonder OTLP-export.

**Modelgebruik**

- `model.usage` — tokens, kosten, duur, context, provider/model/kanaal,
  sessie-id's. `usage` is provider-/beurtboekhouding voor kosten en telemetrie;
  `context.used` is de huidige prompt-/context-snapshot en kan lager zijn dan
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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  levenscyclus per run voor de agent-harness. Bevat `harnessId`, optioneel
  `pluginId`, provider/model/kanaal en run-id. Voltooiing voegt
  `durationMs`, `outcome`, optioneel `resultClassification`, `yieldDetected`,
  en `itemLifecycle`-aantallen toe. Fouten voegen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` en
  optioneel `cleanupFailed` toe.

**Exec**

- `exec.process.completed` — terminale uitkomst, duur, doel, modus, exitcode
  en foutsoort. Commandotekst en werkmappen worden niet
  opgenomen.

## Zonder exporter

Je kunt diagnostics-events beschikbaar houden voor plugins of aangepaste sinks zonder
`diagnostics-otel` uit te voeren:

```json5
{
  diagnostics: { enabled: true },
}
```

Gebruik diagnostics-flags voor gerichte debuguitvoer zonder `logging.level` te verhogen.
Flags zijn hoofdletterongevoelig en ondersteunen wildcards (bijv. `telegram.*` of
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

Flag-uitvoer gaat naar het standaard logbestand (`logging.file`) en wordt nog steeds
geredigeerd door `logging.redactSensitive`. Volledige handleiding:
[Diagnostics-flags](/nl/diagnostics/flags).

## Uitschakelen

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Je kunt `diagnostics-otel` ook uit `plugins.allow` laten, of
`openclaw plugins disable diagnostics-otel` uitvoeren.

## Gerelateerd

- [Logging](/nl/logging) — bestandslogs, console-uitvoer, CLI-tailing en het tabblad Logs in de Control UI
- [Interne Gateway-logging](/nl/gateway/logging) — WS-logstijlen, subsysteemprefixen en consolevastlegging
- [Diagnostics-flags](/nl/diagnostics/flags) — gerichte debug-logflags
- [Diagnostics-export](/nl/gateway/diagnostics) — supportbundeltool voor operators (los van OTEL-export)
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige referentie voor `diagnostics.*`-velden
