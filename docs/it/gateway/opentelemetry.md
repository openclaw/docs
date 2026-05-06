---
read_when:
    - Vuoi inviare l'utilizzo del modello, il flusso dei messaggi o le metriche di sessione di OpenClaw a un collector OpenTelemetry
    - Stai collegando tracce, metriche o log a Grafana, Datadog, Honeycomb, New Relic, Tempo o a un altro backend OTLP
    - Ti servono i nomi esatti delle metriche, degli span o le strutture degli attributi per creare dashboard o avvisi
summary: Esporta la diagnostica di OpenClaw in qualsiasi collettore OpenTelemetry tramite il Plugin diagnostics-otel (OTLP/HTTP)
title: Esportazione OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T08:52:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d52e5072fcdb097a3dce36a13d9470cea8c169d2af49998cd727814013c411e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw esporta la diagnostica tramite il plugin ufficiale `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Qualsiasi collector o backend che accetti OTLP/HTTP
funziona senza modifiche al codice. Per i log su file locali e per sapere come leggerli, consulta
[Logging](/it/logging).

## Come si integra il tutto

- Gli **eventi di diagnostica** sono record strutturati, interni al processo, emessi dal
  Gateway e dai plugin inclusi per esecuzioni dei modelli, flusso dei messaggi, sessioni, code
  ed exec.
- Il **plugin `diagnostics-otel`** si sottoscrive a quegli eventi e li esporta come
  **metriche**, **tracce** e **log** OpenTelemetry tramite OTLP/HTTP.
- Le **chiamate ai provider** ricevono un header W3C `traceparent` dal contesto
  dello span di chiamata al modello attendibile di OpenClaw quando il trasporto del provider accetta header
  personalizzati. Il contesto di traccia emesso dai plugin non viene propagato.
- Gli exporter vengono collegati solo quando sia la superficie di diagnostica sia il plugin sono
  abilitati, quindi il costo interno al processo resta vicino a zero per impostazione predefinita.

## Avvio rapido

Per le installazioni pacchettizzate, installa prima il plugin:

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

Puoi anche abilitare il plugin dalla CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` al momento supporta solo `http/protobuf`. `grpc` viene ignorato.
</Note>

## Segnali esportati

| Segnale     | Cosa contiene                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metriche** | Contatori e istogrammi per uso dei token, costo, durata dell'esecuzione, flusso dei messaggi, corsie di coda, stato della sessione, exec e pressione sulla memoria. |
| **Tracce**  | Span per uso del modello, chiamate al modello, ciclo di vita dell'harness, esecuzione degli strumenti, exec, elaborazione di webhook/messaggi, assemblaggio del contesto e loop degli strumenti. |
| **Log**     | Record strutturati `logging.file` esportati tramite OTLP quando `diagnostics.otel.logs` è abilitato.                                                |

Attiva o disattiva `traces`, `metrics` e `logs` in modo indipendente. Tutti e tre sono attivi per impostazione predefinita
quando `diagnostics.otel.enabled` è true.

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

### Variabili d'ambiente

| Variabile                                                                                                         | Scopo                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sovrascrive `diagnostics.otel.endpoint`. Se il valore contiene già `/v1/traces`, `/v1/metrics` o `/v1/logs`, viene usato così com'è.                                                                                                      |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Sovrascritture degli endpoint specifiche per segnale usate quando la chiave di configurazione `diagnostics.otel.*Endpoint` corrispondente non è impostata. La configurazione specifica per segnale prevale sull'env specifico per segnale, che prevale sull'endpoint condiviso. |
| `OTEL_SERVICE_NAME`                                                                                               | Sovrascrive `diagnostics.otel.serviceName`.                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sovrascrive il protocollo sul cavo (oggi viene rispettato solo `http/protobuf`).                                                                                                                                                           |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Impostalo a `gen_ai_latest_experimental` per emettere l'ultimo attributo sperimentale degli span GenAI (`gen_ai.provider.name`) invece del precedente `gen_ai.system`. Le metriche GenAI usano sempre attributi semantici limitati e a bassa cardinalità. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Impostalo a `1` quando un altro preload o processo host ha già registrato l'SDK OpenTelemetry globale. Il plugin salta quindi il proprio ciclo di vita NodeSDK ma collega comunque i listener di diagnostica e rispetta `traces`/`metrics`/`logs`. |

## Privacy e acquisizione dei contenuti

Il contenuto grezzo di modelli/strumenti **non** viene esportato per impostazione predefinita. Gli span portano identificatori
limitati (canale, provider, modello, categoria di errore, ID richiesta solo hash)
e non includono mai testo del prompt, testo della risposta, input degli strumenti, output degli strumenti o
chiavi di sessione.

Le richieste in uscita verso i modelli possono includere un header W3C `traceparent`. Tale header viene
generato solo dal contesto di traccia diagnostico di proprietà di OpenClaw per la chiamata al modello
attiva. Gli header `traceparent` esistenti forniti dal chiamante vengono sostituiti, quindi i plugin o
le opzioni provider personalizzate non possono falsificare l'ascendenza di traccia tra servizi.

Imposta `diagnostics.otel.captureContent.*` a `true` solo quando il collector e
la policy di conservazione sono approvati per testo di prompt, risposta, strumento o prompt di sistema.
Ogni sottochiave è opt-in in modo indipendente:

- `inputMessages` - contenuto del prompt utente.
- `outputMessages` - contenuto della risposta del modello.
- `toolInputs` - payload degli argomenti dello strumento.
- `toolOutputs` - payload dei risultati dello strumento.
- `systemPrompt` - prompt di sistema/sviluppatore assemblato.

Quando una sottochiave è abilitata, gli span di modelli e strumenti ricevono attributi
`openclaw.content.*` limitati e redatti solo per quella classe.

## Campionamento e flush

- **Tracce:** `diagnostics.otel.sampleRate` (solo root-span, `0.0` scarta tutto,
  `1.0` conserva tutto).
- **Metriche:** `diagnostics.otel.flushIntervalMs` (minimo `1000`).
- **Log:** i log OTLP rispettano `logging.level` (livello di log su file). Usano il
  percorso di redazione dei record di log diagnostici, non la formattazione della console. Le installazioni
  ad alto volume dovrebbero preferire il campionamento/filtro del collector OTLP al campionamento locale.
- **Correlazione dei log su file:** i log file JSONL includono `traceId`,
  `spanId`, `parentSpanId` e `traceFlags` al livello superiore quando la chiamata di log porta un
  contesto di traccia diagnostico valido, permettendo ai processori di log di unire le righe di log locali agli
  span esportati.
- **Correlazione delle richieste:** le richieste HTTP del Gateway e i frame WebSocket creano uno
  scope di traccia richiesta interno. I log e gli eventi diagnostici dentro quello scope
  ereditano la traccia richiesta per impostazione predefinita, mentre gli span di esecuzione dell'agente e di chiamata al modello vengono
  creati come figli, così gli header `traceparent` del provider restano sulla stessa traccia.

## Metriche esportate

### Uso del modello

- `openclaw.tokens` (contatore, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contatore, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (istogramma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (istogramma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (istogramma, metrica delle convenzioni semantiche GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (istogramma, secondi, metrica delle convenzioni semantiche GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opzionale)
- `openclaw.model_call.duration_ms` (istogramma, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, più `openclaw.errorCategory` e `openclaw.failureKind` sugli errori classificati)
- `openclaw.model_call.request_bytes` (istogramma, dimensione in byte UTF-8 del payload finale della richiesta al modello; nessun contenuto grezzo del payload)
- `openclaw.model_call.response_bytes` (istogramma, dimensione in byte UTF-8 degli eventi di risposta del modello in streaming; nessun contenuto grezzo della risposta)
- `openclaw.model_call.time_to_first_byte_ms` (istogramma, tempo trascorso prima del primo evento di risposta in streaming)

### Flusso dei messaggi

- `openclaw.webhook.received` (contatore, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (contatore, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (istogramma, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (contatore, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (contatore, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (istogramma, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (contatore, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (istogramma, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Code e sessioni

- `openclaw.queue.lane.enqueue` (contatore, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contatore, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (istogramma, attrs: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (istogramma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contatore, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contatore, attrs: `openclaw.state`; emesso solo per la registrazione contabile di sessioni obsolete senza lavoro attivo)
- `openclaw.session.stuck_age_ms` (istogramma, attrs: `openclaw.state`; emesso solo per la registrazione contabile di sessioni obsolete senza lavoro attivo)
- `openclaw.run.attempt` (contatore, attrs: `openclaw.attempt`)

### Telemetria di vitalità della sessione

`diagnostics.stuckSessionWarnMs` è la soglia di età senza avanzamento per la diagnostica di
vitalità della sessione. Una sessione `processing` non avanza verso questa soglia
mentre OpenClaw osserva avanzamenti runtime di risposta, strumento, stato, blocco o ACP.
I keepalive di digitazione non vengono conteggiati come avanzamento, quindi un modello o un harness silenzioso può
comunque essere rilevato.

OpenClaw classifica le sessioni in base al lavoro che può ancora osservare:

- `session.long_running`: lavoro incorporato attivo, chiamate al modello o chiamate agli strumenti stanno
  ancora avanzando.
- `session.stalled`: esiste lavoro attivo, ma l'esecuzione attiva non ha segnalato
  progressi recenti. Le esecuzioni incorporate in stallo restano inizialmente in sola osservazione, poi
  passano ad abort-drain dopo `diagnostics.stuckSessionAbortMs` senza progressi, così i turni in coda
  dietro la lane possono riprendere. Quando non è impostato, la soglia di interruzione usa per impostazione predefinita
  la finestra estesa più sicura di almeno 10 minuti e 5x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: contabilità della sessione obsoleta senza lavoro attivo. Questo libera
  immediatamente la lane della sessione interessata.

Il ripristino emette eventi strutturati `session.recovery.requested` e
`session.recovery.completed`. Lo stato diagnostico della sessione viene marcato come inattivo
solo dopo un esito di ripristino mutante (`aborted` o `released`) e solo se la
stessa generazione di elaborazione è ancora quella corrente.

Solo `session.stuck` emette il contatore `openclaw.session.stuck`,
l'istogramma `openclaw.session.stuck_age_ms` e lo span `openclaw.session.stuck`.
Le diagnostiche `session.stuck` ripetute applicano un backoff mentre la sessione resta
invariata, quindi le dashboard dovrebbero generare avvisi su aumenti persistenti anziché a ogni
tick di heartbeat. Per l'opzione di configurazione e i valori predefiniti, consulta
[Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics).

### Ciclo di vita dell'harness

- `openclaw.harness.duration_ms` (istogramma, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` sugli errori)

### Esecuzione

- `openclaw.exec.duration_ms` (istogramma, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Interni di diagnostica (memoria e ciclo degli strumenti)

- `openclaw.memory.heap_used_bytes` (istogramma, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (istogramma)
- `openclaw.memory.pressure` (contatore, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contatore, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (istogramma, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Span esportati

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` per impostazione predefinita, o `gen_ai.provider.name` quando si aderisce alle convenzioni semantiche GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` per impostazione predefinita, o `gen_ai.provider.name` quando si aderisce alle convenzioni semantiche GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` e `openclaw.failureKind` opzionale sugli errori
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash limitato basato su SHA dell'id richiesta del provider upstream; gli id grezzi non vengono esportati)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al completamento: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - In caso di errore: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opzionale
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (nessun messaggio del ciclo, parametro o output dello strumento)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando l'acquisizione dei contenuti è abilitata esplicitamente, gli span del modello e degli strumenti possono anche
includere attributi `openclaw.content.*` limitati e redatti per le specifiche
classi di contenuto a cui hai aderito.

## Catalogo degli eventi diagnostici

Gli eventi seguenti alimentano le metriche e gli span sopra indicati. I plugin possono anche iscriversi
direttamente senza esportazione OTLP.

**Utilizzo del modello**

- `model.usage` - token, costo, durata, contesto, provider/modello/canale,
  id di sessione. `usage` è la contabilità provider/turno per costi e telemetria;
  `context.used` è lo snapshot corrente di prompt/contesto e può essere inferiore a
  `usage.total` del provider quando sono coinvolti input memorizzato nella cache o chiamate del ciclo degli strumenti.

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
  opzionale, provider/modello/canale e id esecuzione. Il completamento aggiunge
  `durationMs`, `outcome`, `resultClassification` opzionale, `yieldDetected`
  e i conteggi `itemLifecycle`. Gli errori aggiungono `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` opzionale.

**Esecuzione**

- `exec.process.completed` - esito del terminale, durata, destinazione, modalità, codice di uscita
  e tipo di errore. Il testo del comando e le directory di lavoro non sono
  inclusi.

## Senza un esportatore

Puoi mantenere disponibili gli eventi di diagnostica per i plugin o i sink personalizzati senza
eseguire `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Per output di debug mirato senza aumentare `logging.level`, usa i flag di diagnostica.
I flag non distinguono tra maiuscole e minuscole e supportano i caratteri jolly (ad esempio `telegram.*` o
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
[Flag di diagnostica](/it/diagnostics/flags).

## Disabilitazione

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Puoi anche lasciare `diagnostics-otel` fuori da `plugins.allow`, oppure eseguire
`openclaw plugins disable diagnostics-otel`.

## Correlati

- [Logging](/it/logging) - log su file, output della console, tailing CLI e scheda Log della Control UI
- [Interni del logging del Gateway](/it/gateway/logging) - stili dei log WS, prefissi dei sottosistemi e acquisizione della console
- [Flag di diagnostica](/it/diagnostics/flags) - flag mirati per log di debug
- [Esportazione della diagnostica](/it/gateway/diagnostics) - strumento per support bundle dell'operatore (separato dall'esportazione OTEL)
- [Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics) - riferimento completo dei campi `diagnostics.*`
