---
read_when:
    - Je wilt OpenClaw-modelgebruik, berichtstromen of sessiemetrics naar een OpenTelemetry-collector sturen
    - Je verbindt traces, metrics of logs met Grafana, Datadog, Honeycomb, New Relic, Tempo of een andere OTLP-backend
    - Je hebt de exacte metriek-namen, span-namen of attribuutvormen nodig om dashboards of waarschuwingen te bouwen
summary: Exporteer OpenClaw-diagnostiek naar OpenTelemetry-collectors of stdout JSONL via de diagnostics-otel-plugin
title: OpenTelemetry-export
x-i18n:
    generated_at: "2026-06-27T17:35:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporteert diagnostiek via de officiële `diagnostics-otel`-Plugin
met **OTLP/HTTP (protobuf)**. Logs kunnen ook als stdout JSONL worden
geschreven voor logpijplijnen van containers en sandboxen. Elke collector of
backend die OTLP/HTTP accepteert, werkt zonder codewijzigingen. Zie
[Logging](/nl/logging) voor lokale bestandslogs en hoe je ze leest.

## Hoe het samenhangt

- **Diagnostische events** zijn gestructureerde, in-process records die worden
  uitgezonden door de Gateway en gebundelde plugins voor modelruns, berichtstroom,
  sessies, wachtrijen en exec.
- De **`diagnostics-otel`-plugin** abonneert zich op die events en exporteert ze
  als OpenTelemetry-**metrics**, **traces** en **logs** via OTLP/HTTP. De plugin
  kan diagnostische logrecords ook spiegelen naar stdout JSONL.
- **Provideraanroepen** ontvangen een W3C-`traceparent`-header van OpenClaw's
  vertrouwde spancontext voor modelaanroepen wanneer het providertransport
  aangepaste headers accepteert. Door plugins uitgezonden tracecontext wordt
  niet doorgegeven.
- Exporters worden alleen gekoppeld wanneer zowel het diagnostiekoppervlak als
  de plugin zijn ingeschakeld, zodat de in-process kosten standaard vrijwel nul
  blijven.

## Snel starten

Installeer voor verpakte installaties eerst de plugin:

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

| Signaal     | Wat erin komt                                                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Tellers en histogrammen voor tokengebruik, kosten, run-duur, failover, skillgebruik, berichtstroom, Talk-events, wachtrijbanen, sessiestatus/-herstel, tooluitvoering, te grote payloads, exec en geheugendruk.                    |
| **Traces**  | Spans voor modelgebruik, modelaanroepen, harness-levenscyclus, skillgebruik, tooluitvoering, exec, webhook-/berichtverwerking, contextopbouw en toollussen.                                                                        |
| **Logs**    | Gestructureerde `logging.file`-records die via OTLP of stdout JSONL worden geëxporteerd wanneer `diagnostics.otel.logs` is ingeschakeld; logbodies worden achtergehouden tenzij contentopname expliciet is ingeschakeld.             |

Schakel `traces`, `metrics` en `logs` onafhankelijk in of uit. Traces en metrics
staan standaard aan wanneer `diagnostics.otel.enabled` true is. Logs staan
standaard uit en worden alleen geëxporteerd wanneer `diagnostics.otel.logs`
expliciet `true` is. Logexport gebruikt standaard OTLP; stel
`diagnostics.otel.logsExporter` in op `stdout` voor JSONL op stdout, of op
`both` om elk diagnostisch logrecord naar OTLP en stdout te sturen.

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

| Variabele                                                                                                         | Doel                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Overschrijft `diagnostics.otel.endpoint`. Als de waarde al `/v1/traces`, `/v1/metrics` of `/v1/logs` bevat, wordt die ongewijzigd gebruikt.                                                                                                                                                                                                                               |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signaalspecifieke endpoint-overschrijvingen die worden gebruikt wanneer de overeenkomende configuratiesleutel `diagnostics.otel.*Endpoint` niet is ingesteld. Signaalspecifieke configuratie wint van signaalspecifieke env, en die wint van het gedeelde endpoint.                                                                                                      |
| `OTEL_SERVICE_NAME`                                                                                               | Overschrijft `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Overschrijft het wire-protocol (vandaag wordt alleen `http/protobuf` gehonoreerd).                                                                                                                                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Stel in op `gen_ai_latest_experimental` om de nieuwste experimentele GenAI-inference-spanshape uit te zenden, inclusief spannamen `{gen_ai.operation.name} {gen_ai.request.model}`, `CLIENT`-spansoort en `gen_ai.provider.name` in plaats van de legacy `gen_ai.system`. GenAI-metrics gebruiken altijd begrensde semantische attributen met lage cardinaliteit. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Stel in op `1` wanneer een andere preload of hostproces de globale OpenTelemetry SDK al heeft geregistreerd. De plugin slaat dan zijn eigen NodeSDK-levenscyclus over, maar koppelt nog steeds diagnostische listeners en respecteert `traces`/`metrics`/`logs`.                                                                                                          |

## Privacy en contentopname

Ruwe model-/toolcontent wordt standaard **niet** geëxporteerd. Spans dragen
begrensde identificatoren (kanaal, provider, model, foutcategorie,
request-id's met alleen hash, toolbron, tooleigenaar en skillnaam/-bron) en
bevatten nooit prompttekst, antwoordtekst, toolinputs, tooloutputs,
skillbestandspaden of sessiesleutels. OTLP-logrecords behouden standaard
ernstniveau, logger, codelocatie, vertrouwde tracecontext en opgeschoonde
attributen, maar de ruwe logberichtbody wordt alleen geëxporteerd wanneer
`diagnostics.otel.captureContent` is ingesteld op boolean `true`. Granulaire
subsleutels `captureContent.*` schakelen logbodies niet in. Labels die lijken
op scoped agentsessiesleutels worden vervangen door `unknown`.
Talk-metrics exporteren alleen begrensde eventmetadata zoals modus, transport,
provider en eventtype. Ze bevatten geen transcripten, audiopayloads,
sessie-id's, turn-id's, call-id's, room-id's of handofftokens.

Uitgaande modelrequests kunnen een W3C-`traceparent`-header bevatten. Die header
wordt alleen gegenereerd uit OpenClaw-eigen diagnostische tracecontext voor de
actieve modelaanroep. Bestaande door de aanroeper geleverde
`traceparent`-headers worden vervangen, zodat plugins of aangepaste
provideropties cross-service trace-afkomst niet kunnen spoofen.

Stel `diagnostics.otel.captureContent.*` alleen in op `true` wanneer je
collector en retentiebeleid zijn goedgekeurd voor prompt-, antwoord-, tool- of
systeemprompttekst. Elke subsleutel is afzonderlijk opt-in:

- `inputMessages` - inhoud van gebruikersprompts.
- `outputMessages` - inhoud van modelantwoorden.
- `toolInputs` - payloads van toolargumenten.
- `toolOutputs` - payloads van toolresultaten.
- `systemPrompt` - samengestelde systeem-/developerprompt.
- `toolDefinitions` - modeltoolnamen, beschrijvingen en schema's.

Wanneer een subsleutel is ingeschakeld, krijgen model- en toolspans alleen voor
die klasse begrensde, geredigeerde `openclaw.content.*`-attributen. Gebruik
boolean `captureContent: true` alleen voor brede diagnostiekopnames waarbij ook
OTLP-logberichtbodies zijn goedgekeurd voor export.

Content van `toolInputs`/`toolOutputs` wordt vastgelegd voor de tooluitvoeringen
van de ingebouwde agentruntime (`openclaw.content.tool_input` op voltooide/fout-
spans, `openclaw.content.tool_output` op voltooide spans). Toolaanroepen van
externe harnesses (Codex, Claude CLI) zenden `tool.execution.*`-spans uit zonder
contentpayloads. Vastgelegde content reist via een vertrouwd kanaal dat alleen
voor listeners is en wordt nooit op de publieke diagnostische eventbus geplaatst.

## Sampling en flushing

- **Traces:** `diagnostics.otel.sampleRate` (alleen root-span, `0.0` laat alles
  vallen, `1.0` behoudt alles).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logs:** OTLP-logs respecteren `logging.level` (bestandslogniveau). Ze
  gebruiken het redactiepad voor diagnostische logrecords, niet consoleopmaak.
  Installaties met hoog volume moeten de voorkeur geven aan sampling/filtering
  in de OTLP-collector boven lokale sampling. Stel
  `diagnostics.otel.logsExporter: "stdout"` in wanneer je platform stdout/stderr
  al naar een logprocessor verzendt en je geen OTLP-logcollector hebt.
  Stdout-records zijn één JSON-object per regel met `ts`, `signal`,
  `service.name`, ernstniveau, body, geredigeerde attributen en vertrouwde
  tracevelden wanneer beschikbaar.
- **Correlatie van bestandslogs:** JSONL-bestandslogs bevatten `traceId`,
  `spanId`, `parentSpanId` en `traceFlags` op topniveau wanneer de logaanroep
  een geldige diagnostische tracecontext draagt, waardoor logprocessors lokale
  logregels kunnen koppelen aan geëxporteerde spans.
- **Requestcorrelatie:** Gateway-HTTP-requests en WebSocket-frames maken een
  interne request-tracescope. Logs en diagnostische events binnen die scope
  erven standaard de requesttrace, terwijl agentrun- en model-call-spans als
  children worden gemaakt, zodat provider-`traceparent`-headers op dezelfde
  trace blijven.

## Geëxporteerde metrics

### Modelgebruik

- `openclaw.tokens` (teller, kenmerken: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)

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
  - `openclaw.provider.request_id_hash` (begrensde SHA-gebaseerde hash van de request-id van de upstream-provider; ruwe ids worden niet geexporteerd)
  - Met `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` gebruiken model-call-spans de nieuwste GenAI-inferentiespannaam `{gen_ai.operation.name} {gen_ai.request.model}` en `CLIENT`-spansoort in plaats van `openclaw.model.call`.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (geen prompt-, geschiedenis-, response- of session-key-inhoud)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (geen loopberichten, params of tooluitvoer)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Wanneer inhoudsvastlegging expliciet is ingeschakeld, kunnen model- en toolspans ook
begrensde, geredigeerde `openclaw.content.*`-attributen bevatten voor de specifieke
inhoudsklassen waarvoor je hebt gekozen.

## Catalogus met diagnostische events

De onderstaande events ondersteunen de metrics en spans hierboven. Plugins kunnen zich er ook rechtstreeks op abonneren
zonder OTLP-export.

**Modelgebruik**

- `model.usage` - tokens, kosten, duur, context, provider/model/channel,
  session-id's. `usage` is provider-/turn-boekhouding voor kosten en telemetrie;
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
  `pluginId`, provider/model/channel en run-id. Voltooiing voegt
  `durationMs`, `outcome`, optioneel `resultClassification`, `yieldDetected`,
  en `itemLifecycle`-aantallen toe. Fouten voegen `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` en
  optioneel `cleanupFailed` toe.

**Exec**

- `exec.process.completed` - terminale uitkomst, duur, doel, modus, exitcode
  en failure kind. Commandotekst en werkmappen worden niet
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
Flags zijn niet hoofdlettergevoelig en ondersteunen wildcards (bijv. `telegram.*` of
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

Flaguitvoer gaat naar het standaardlogbestand (`logging.file`) en wordt nog steeds
geredigeerd door `logging.redactSensitive`. Volledige gids:
[Diagnostics-flags](/nl/diagnostics/flags).

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
- [Interne Gateway-logging](/nl/gateway/logging) - WS-logstijlen, subsystem-prefixes en consolevastlegging
- [Diagnostics-flags](/nl/diagnostics/flags) - gerichte debug-logflags
- [Diagnostics-export](/nl/gateway/diagnostics) - support-bundle-tool voor operators (los van OTEL-export)
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) - volledige `diagnostics.*`-veldreferentie
