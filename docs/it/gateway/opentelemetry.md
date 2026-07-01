---
read_when:
    - Vuoi inviare l'uso dei modelli OpenClaw, il flusso dei messaggi o le metriche di sessione a un collector OpenTelemetry
    - Stai collegando tracce, metriche o log a Grafana, Datadog, Honeycomb, New Relic, Tempo o a un altro backend OTLP
    - Ti servono i nomi esatti delle metriche, i nomi degli span o le forme degli attributi per creare dashboard o avvisi
summary: Esporta la diagnostica di OpenClaw verso i collector OpenTelemetry o stdout JSONL tramite il plugin diagnostics-otel
title: Esportazione OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T05:47:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw esporta la diagnostica tramite il Plugin ufficiale `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. I log possono anche essere scritti come JSONL su stdout per
le pipeline di log di container e sandbox. Qualsiasi collector o backend che accetta
OTLP/HTTP funziona senza modifiche al codice. Per i log su file locali e come leggerli,
vedi [Logging](/it/logging).

## Come funziona l'insieme

- Gli **eventi diagnostici** sono record strutturati, in-process, emessi dal
  Gateway e dai plugin inclusi per esecuzioni dei modelli, flusso dei messaggi, sessioni, code
  ed exec.
- Il **Plugin `diagnostics-otel`** sottoscrive questi eventi e li esporta come
  **metriche**, **tracce** e **log** OpenTelemetry tramite OTLP/HTTP. Può
  anche duplicare i record di log diagnostici in JSONL su stdout.
- Le **chiamate ai provider** ricevono un header W3C `traceparent` dal contesto
  span attendibile della chiamata al modello di OpenClaw quando il trasporto del provider accetta header
  personalizzati. Il contesto di traccia emesso dai Plugin non viene propagato.
- Gli exporter vengono collegati solo quando sia la superficie diagnostica sia il Plugin sono
  abilitati, quindi il costo in-process resta vicino a zero per impostazione predefinita.

## Avvio rapido

Per le installazioni pacchettizzate, installa prima il Plugin:

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

Puoi anche abilitare il Plugin dalla CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` attualmente supporta solo `http/protobuf`. `grpc` viene ignorato.
</Note>

## Segnali esportati

| Segnale      | Cosa contiene                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metriche** | Contatori e istogrammi per uso dei token, costo, durata delle esecuzioni, failover, uso delle skill, flusso dei messaggi, eventi Talk, corsie di coda, stato/ripristino della sessione, esecuzione degli strumenti, payload sovradimensionati, exec e pressione sulla memoria. |
| **Tracce**  | Span per uso dei modelli, chiamate ai modelli, ciclo di vita dell'harness, uso delle skill, esecuzione degli strumenti, exec, elaborazione webhook/messaggi, assemblaggio del contesto e loop degli strumenti.                                                            |
| **Log**    | Record `logging.file` strutturati esportati tramite OTLP o JSONL su stdout quando `diagnostics.otel.logs` è abilitato; i corpi dei log vengono trattenuti salvo che la cattura del contenuto sia esplicitamente abilitata.                                |

Attiva o disattiva `traces`, `metrics` e `logs` in modo indipendente. Tracce e metriche
sono attive per impostazione predefinita quando `diagnostics.otel.enabled` è true. I log sono disattivati per impostazione predefinita e
vengono esportati solo quando `diagnostics.otel.logs` è esplicitamente `true`. L'esportazione dei log
usa OTLP per impostazione predefinita; imposta `diagnostics.otel.logsExporter` su `stdout` per JSONL su
stdout, oppure su `both` per inviare ogni record di log diagnostico a OTLP e stdout.

## Riferimento di configurazione

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

### Variabili d'ambiente

| Variabile                                                                                                          | Scopo                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sovrascrive `diagnostics.otel.endpoint`. Se il valore contiene già `/v1/traces`, `/v1/metrics` o `/v1/logs`, viene usato così com'è.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Override degli endpoint specifici per segnale usati quando la chiave di configurazione `diagnostics.otel.*Endpoint` corrispondente non è impostata. La configurazione specifica per segnale ha precedenza sull'env specifico per segnale, che ha precedenza sull'endpoint condiviso.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Sovrascrive `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sovrascrive il protocollo di trasmissione (oggi viene rispettato solo `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Imposta su `gen_ai_latest_experimental` per emettere la forma span sperimentale più recente dell'inferenza GenAI, inclusi i nomi span `{gen_ai.operation.name} {gen_ai.request.model}`, il tipo di span `CLIENT` e `gen_ai.provider.name` invece del legacy `gen_ai.system`. Le metriche GenAI usano sempre attributi semantici limitati e a bassa cardinalità. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Imposta su `1` quando un altro preload o processo host ha già registrato l'SDK OpenTelemetry globale. Il Plugin quindi salta il proprio ciclo di vita NodeSDK, ma collega comunque i listener diagnostici e rispetta `traces`/`metrics`/`logs`.                                                                                                                    |

## Privacy e cattura del contenuto

Il contenuto grezzo di modello/strumento **non** viene esportato per impostazione predefinita. Gli span trasportano
identificatori limitati (canale, provider, modello, categoria di errore, id richiesta solo hash,
origine dello strumento, proprietario dello strumento e nome/origine della skill) e non includono mai testo del prompt,
testo della risposta, input degli strumenti, output degli strumenti, percorsi dei file delle skill o chiavi di sessione.
I record di log OTLP mantengono severità, logger, posizione del codice, contesto di traccia attendibile
e attributi sanificati per impostazione predefinita, ma il corpo grezzo del messaggio di log viene esportato
solo quando `diagnostics.otel.captureContent` è impostato al booleano `true`. Le sottochiavi granulari
`captureContent.*` non abilitano i corpi dei log. Le etichette che assomigliano a
chiavi di sessione agente con ambito vengono sostituite con `unknown`.
Le metriche Talk esportano solo metadati evento limitati come modalità, trasporto,
provider e tipo di evento. Non includono trascrizioni, payload audio,
id sessione, id turno, id chiamata, id stanza o token di handoff.

Le richieste in uscita verso i modelli possono includere un header W3C `traceparent`. Quell'header viene
generato solo dal contesto di traccia diagnostico di proprietà di OpenClaw per la chiamata al modello
attiva. Gli header `traceparent` esistenti forniti dal chiamante vengono sostituiti, quindi Plugin o
opzioni provider personalizzate non possono falsificare l'ascendenza di traccia tra servizi.

Imposta `diagnostics.otel.captureContent.*` su `true` solo quando il tuo collector e
la policy di conservazione sono approvati per testo di prompt, risposta, strumento o system prompt.
Ogni sottochiave è opt-in in modo indipendente:

- `inputMessages` - contenuto del prompt utente.
- `outputMessages` - contenuto della risposta del modello.
- `toolInputs` - payload degli argomenti degli strumenti.
- `toolOutputs` - payload dei risultati degli strumenti.
- `systemPrompt` - prompt di sistema/sviluppatore assemblato.
- `toolDefinitions` - nomi, descrizioni e schemi degli strumenti del modello.

Quando una sottochiave è abilitata, gli span di modello e strumento ricevono attributi
`openclaw.content.*` limitati e redatti solo per quella classe. Usa il booleano
`captureContent: true` solo per catture diagnostiche ampie in cui anche i corpi dei messaggi di log OTLP
sono approvati per l'esportazione.

Il contenuto `toolInputs`/`toolOutputs` viene catturato per le esecuzioni degli strumenti del runtime agente
integrato (`openclaw.content.tool_input` su span completati/con errore,
`openclaw.content.tool_output` su span completati). Le chiamate agli strumenti degli harness esterni
(Codex, Claude CLI) emettono span `tool.execution.*` senza payload di contenuto.
Il contenuto catturato viaggia su un canale attendibile, solo per listener, e non viene mai inserito
nel bus pubblico degli eventi diagnostici.

## Campionamento e flush

- **Tracce:** `diagnostics.otel.sampleRate` (solo span radice, `0.0` scarta tutto,
  `1.0` mantiene tutto).

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando si aderisce alle convenzioni semantiche GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando si aderisce alle convenzioni semantiche GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` e `openclaw.failureKind` facoltativo sugli errori
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (solo dimensioni sicure dei componenti, nessun testo del prompt)
  - `openclaw.model_call.usage.*` e `gen_ai.usage.*` quando il risultato della chiamata al modello contiene l'utilizzo del provider per quella singola chiamata
  - `openclaw.provider.request_id_hash` (hash limitato basato su SHA dell'id richiesta del provider upstream; gli id grezzi non vengono esportati)
  - Con `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, gli span delle chiamate al modello usano il nome span di inferenza GenAI più recente `{gen_ai.operation.name} {gen_ai.request.model}` e il tipo span `CLIENT` invece di `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al completamento: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - In caso di errore: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` facoltativo
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (nessun contenuto di prompt, cronologia, risposta o chiave di sessione)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (nessun messaggio di loop, parametro o output dello strumento)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando l'acquisizione del contenuto è abilitata esplicitamente, gli span di modello e strumento possono anche
includere attributi `openclaw.content.*` limitati e redatti per le classi di
contenuto specifiche a cui hai aderito.

## Catalogo degli eventi diagnostici

Gli eventi seguenti supportano le metriche e gli span indicati sopra. I Plugin possono anche iscriversi
direttamente a essi senza esportazione OTLP.

**Utilizzo del modello**

- `model.usage` - token, costo, durata, contesto, provider/modello/canale,
  id sessione. `usage` è la contabilità provider/turno per costo e telemetria;
  `context.used` è lo snapshot corrente di prompt/contesto e può essere inferiore a
  `usage.total` del provider quando sono coinvolti input memorizzati in cache o chiamate tool-loop.

**Flusso dei messaggi**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Coda e sessione**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (contatori aggregati: webhook/coda/sessione)

**Ciclo di vita dell'harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  ciclo di vita per esecuzione dell'harness dell'agente. Include `harnessId`, `pluginId`
  facoltativo, provider/modello/canale e id esecuzione. Il completamento aggiunge
  `durationMs`, `outcome`, `resultClassification` facoltativo, `yieldDetected`
  e conteggi `itemLifecycle`. Gli errori aggiungono `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` facoltativo.

**Exec**

- `exec.process.completed` - esito terminale, durata, target, modalità, codice di uscita
  e tipo di errore. Il testo del comando e le directory di lavoro non sono
  inclusi.
- `exec.approval.followup_suppressed` - follow-up di approvazione obsoleto eliminato dopo
  un rebound della sessione. Include `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` o `gateway_preflight`) e il timestamp del dispatcher.
  Chiavi di sessione, route e testo del comando non sono inclusi.

## Senza un esportatore

Puoi mantenere gli eventi diagnostici disponibili per Plugin o sink personalizzati senza
eseguire `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Per output di debug mirato senza aumentare `logging.level`, usa i flag diagnostici.
I flag non distinguono tra maiuscole e minuscole e supportano caratteri jolly (ad es. `telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Oppure come override env una tantum:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

L'output dei flag va al file di log standard (`logging.file`) ed è comunque
redatto da `logging.redactSensitive`. Guida completa:
[Flag diagnostici](/it/diagnostics/flags).

## Disabilitare

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Puoi anche lasciare `diagnostics-otel` fuori da `plugins.allow`, oppure eseguire
`openclaw plugins disable diagnostics-otel`.

## Correlati

- [Logging](/it/logging) - log su file, output console, tailing CLI e la scheda Log della Control UI
- [Interni del logging del Gateway](/it/gateway/logging) - stili dei log WS, prefissi dei sottosistemi e acquisizione della console
- [Flag diagnostici](/it/diagnostics/flags) - flag mirati per log di debug
- [Esportazione diagnostica](/it/gateway/diagnostics) - strumento support-bundle per operatori (separato dall'esportazione OTEL)
- [Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics) - riferimento completo dei campi `diagnostics.*`
