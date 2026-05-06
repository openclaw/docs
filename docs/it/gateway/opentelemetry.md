---
read_when:
    - Vuoi inviare a un collector OpenTelemetry l’utilizzo dei modelli OpenClaw, il flusso dei messaggi o le metriche di sessione
    - Stai collegando tracce, metriche o registri a Grafana, Datadog, Honeycomb, New Relic, Tempo o un'altra destinazione OTLP
    - Ti servono i nomi esatti delle metriche, i nomi degli span o le strutture degli attributi per creare pannelli di controllo o avvisi
summary: Esporta la diagnostica di OpenClaw verso qualsiasi collector OpenTelemetry tramite il plugin diagnostics-otel (OTLP/HTTP)
title: Esportazione OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T17:56:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw esporta diagnostica tramite il Plugin ufficiale `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Qualsiasi collector o backend che accetti OTLP/HTTP
funziona senza modifiche al codice. Per i log su file locali e come leggerli, consulta
[Logging](/it/logging).

## Come funziona l'insieme

- Gli **eventi di diagnostica** sono record strutturati in-process emessi dal
  Gateway e dai plugin inclusi per esecuzioni del modello, flusso dei messaggi, sessioni, code
  ed exec.
- Il **Plugin `diagnostics-otel`** sottoscrive questi eventi e li esporta come
  **metriche**, **tracce** e **log** OpenTelemetry tramite OTLP/HTTP.
- Le **chiamate ai provider** ricevono un'intestazione W3C `traceparent` dal contesto
  dello span affidabile della chiamata al modello di OpenClaw quando il trasporto del provider accetta intestazioni
  personalizzate. Il contesto di traccia emesso dai plugin non viene propagato.
- Gli exporter vengono collegati solo quando sia la superficie di diagnostica sia il Plugin sono
  abilitati, quindi il costo in-process resta quasi nullo per impostazione predefinita.

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

Puoi abilitare il Plugin anche dalla CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` attualmente supporta solo `http/protobuf`. `grpc` viene ignorato.
</Note>

## Segnali esportati

| Segnale     | Cosa contiene                                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metriche** | Counter e istogrammi per uso dei token, costo, durata delle esecuzioni, flusso dei messaggi, eventi Talk, corsie delle code, stato/ripristino delle sessioni, exec e pressione sulla memoria. |
| **Tracce**  | Span per uso del modello, chiamate al modello, ciclo di vita dell'harness, esecuzione degli strumenti, exec, elaborazione di webhook/messaggi, assemblaggio del contesto e cicli degli strumenti. |
| **Log**     | Record strutturati `logging.file` esportati tramite OTLP quando `diagnostics.otel.logs` è abilitato.                                                       |

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sostituisce `diagnostics.otel.endpoint`. Se il valore contiene già `/v1/traces`, `/v1/metrics` o `/v1/logs`, viene usato così com'è.                                                                                                      |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Override degli endpoint specifici per segnale usati quando la chiave di configurazione `diagnostics.otel.*Endpoint` corrispondente non è impostata. La configurazione specifica per segnale prevale sull'env specifico per segnale, che prevale sull'endpoint condiviso. |
| `OTEL_SERVICE_NAME`                                                                                               | Sostituisce `diagnostics.otel.serviceName`.                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sostituisce il protocollo di trasmissione (oggi viene rispettato solo `http/protobuf`).                                                                                                                                                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Imposta a `gen_ai_latest_experimental` per emettere l'attributo span GenAI sperimentale più recente (`gen_ai.provider.name`) invece del legacy `gen_ai.system`. Le metriche GenAI usano sempre attributi semantici limitati e a bassa cardinalità. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Imposta a `1` quando un altro preload o processo host ha già registrato l'SDK OpenTelemetry globale. Il Plugin quindi salta il proprio ciclo di vita NodeSDK ma collega comunque i listener diagnostici e rispetta `traces`/`metrics`/`logs`. |

## Privacy e acquisizione dei contenuti

Il contenuto raw di modelli/strumenti **non** viene esportato per impostazione predefinita. Gli span contengono identificatori
limitati (canale, provider, modello, categoria di errore, ID richiesta solo come hash)
e non includono mai testo del prompt, testo della risposta, input degli strumenti, output degli strumenti o
chiavi di sessione.
Le metriche Talk esportano solo metadati evento limitati come modalità, trasporto,
provider e tipo di evento. Non includono trascrizioni, payload audio,
ID sessione, ID turno, ID chiamata, ID stanza o token di handoff.

Le richieste in uscita ai modelli possono includere un'intestazione W3C `traceparent`. Tale intestazione viene
generata solo dal contesto di traccia diagnostica di proprietà di OpenClaw per la chiamata al modello
attiva. Le intestazioni `traceparent` fornite dal chiamante esistenti vengono sostituite, quindi plugin o
opzioni provider personalizzate non possono falsificare l'ascendenza di traccia cross-service.

Imposta `diagnostics.otel.captureContent.*` su `true` solo quando il tuo collector e
la policy di retention sono approvati per testo di prompt, risposta, strumento o system-prompt.
Ogni sottochiave è opt-in in modo indipendente:

- `inputMessages` - contenuto del prompt utente.
- `outputMessages` - contenuto della risposta del modello.
- `toolInputs` - payload degli argomenti degli strumenti.
- `toolOutputs` - payload dei risultati degli strumenti.
- `systemPrompt` - prompt system/developer assemblato.

Quando una sottochiave è abilitata, gli span di modello e strumento ricevono attributi
`openclaw.content.*` limitati e redatti solo per quella classe.

## Campionamento e flush

- **Tracce:** `diagnostics.otel.sampleRate` (solo root-span, `0.0` scarta tutto,
  `1.0` conserva tutto).
- **Metriche:** `diagnostics.otel.flushIntervalMs` (minimo `1000`).
- **Log:** i log OTLP rispettano `logging.level` (livello dei log su file). Usano il
  percorso di redazione dei record di log diagnostici, non la formattazione console. Le installazioni ad alto volume
  dovrebbero preferire campionamento/filtro del collector OTLP rispetto al campionamento locale.
- **Correlazione dei log su file:** i log file JSONL includono `traceId`,
  `spanId`, `parentSpanId` e `traceFlags` al livello superiore quando la chiamata di log contiene un contesto
  di traccia diagnostica valido, permettendo ai processori di log di unire righe di log locali con
  span esportati.
- **Correlazione delle richieste:** le richieste HTTP del Gateway e i frame WebSocket creano uno
  scope di traccia richiesta interno. Log ed eventi diagnostici dentro tale scope
  ereditano per impostazione predefinita la traccia richiesta, mentre gli span di esecuzione agente e chiamata al modello vengono
  creati come figli, così le intestazioni `traceparent` del provider restano sulla stessa traccia.

## Metriche esportate

### Uso del modello

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrica delle convenzioni semantiche GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, secondi, metrica delle convenzioni semantiche GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opzionale)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, più `openclaw.errorCategory` e `openclaw.failureKind` sugli errori classificati)
- `openclaw.model_call.request_bytes` (histogram, dimensione in byte UTF-8 del payload finale della richiesta al modello; nessun contenuto raw del payload)
- `openclaw.model_call.response_bytes` (histogram, dimensione in byte UTF-8 degli eventi di risposta del modello in streaming; nessun contenuto raw della risposta)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, tempo trascorso prima del primo evento di risposta in streaming)

### Flusso dei messaggi

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
- `openclaw.talk.event.duration_ms` (histogram, attrs: uguali a `openclaw.talk.event`; emessa quando un evento Talk riporta una durata)
- `openclaw.talk.audio.bytes` (histogram, attrs: uguali a `openclaw.talk.event`; emessa per eventi frame audio Talk che riportano la lunghezza in byte)

### Code e sessioni

- `openclaw.queue.lane.enqueue` (contatore, attr: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contatore, attr: `openclaw.lane`)
- `openclaw.queue.depth` (istogramma, attr: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (istogramma, attr: `openclaw.lane`)
- `openclaw.session.state` (contatore, attr: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contatore, attr: `openclaw.state`; emesso solo per la contabilità di sessioni obsolete senza lavoro attivo)
- `openclaw.session.stuck_age_ms` (istogramma, attr: `openclaw.state`; emesso solo per la contabilità di sessioni obsolete senza lavoro attivo)
- `openclaw.session.recovery.requested` (contatore, attr: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contatore, attr: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (istogramma, attr: gli stessi del contatore di ripristino corrispondente)
- `openclaw.run.attempt` (contatore, attr: `openclaw.attempt`)

### Telemetria di vitalità della sessione

`diagnostics.stuckSessionWarnMs` è la soglia di età senza avanzamento per la diagnostica di vitalità della sessione. Una sessione `processing` non invecchia verso questa soglia mentre OpenClaw osserva avanzamento a runtime di risposta, strumento, stato, blocco o ACP. I keepalive di digitazione non sono conteggiati come avanzamento, quindi un modello o un harness silenzioso può comunque essere rilevato.

OpenClaw classifica le sessioni in base al lavoro che può ancora osservare:

- `session.long_running`: lavoro incorporato attivo, chiamate al modello o chiamate agli strumenti stanno ancora avanzando.
- `session.stalled`: esiste lavoro attivo, ma l'esecuzione attiva non ha segnalato avanzamenti recenti. Le esecuzioni incorporate bloccate restano inizialmente in sola osservazione, poi passano ad abort-drain dopo `diagnostics.stuckSessionAbortMs` senza avanzamento, così i turni in coda dietro la lane possono riprendere. Se non impostata, la soglia di interruzione usa come valore predefinito la finestra estesa più sicura di almeno 10 minuti e 5 volte `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: contabilità di sessione obsoleta senza lavoro attivo. Questo rilascia immediatamente la lane della sessione interessata.

Il ripristino emette eventi strutturati `session.recovery.requested` e `session.recovery.completed`. Lo stato diagnostico della sessione viene marcato come inattivo solo dopo un esito di ripristino mutante (`aborted` o `released`) e solo se la stessa generazione di elaborazione è ancora corrente.

Solo `session.stuck` emette il contatore `openclaw.session.stuck`, l'istogramma `openclaw.session.stuck_age_ms` e lo span `openclaw.session.stuck`. Le diagnostiche `session.stuck` ripetute applicano un backoff mentre la sessione resta invariata, quindi le dashboard dovrebbero avvisare su aumenti sostenuti anziché su ogni tick di Heartbeat. Per la manopola di configurazione e i valori predefiniti, vedere il [Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics).

### Ciclo di vita dell'harness

- `openclaw.harness.duration_ms` (istogramma, attr: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` sugli errori)

### Exec

- `openclaw.exec.duration_ms` (istogramma, attr: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Interni di diagnostica (memoria e loop degli strumenti)

- `openclaw.memory.heap_used_bytes` (istogramma, attr: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (istogramma)
- `openclaw.memory.pressure` (contatore, attr: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contatore, attr: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (istogramma, attr: `openclaw.toolName`, `openclaw.outcome`)

## Span esportati

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando vengono abilitate le convenzioni semantiche GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando vengono abilitate le convenzioni semantiche GenAI più recenti
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (nessun messaggio di loop, parametro o output dello strumento)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando la cattura dei contenuti è esplicitamente abilitata, gli span di modello e strumenti possono includere anche attributi `openclaw.content.*` limitati e redatti per le specifiche classi di contenuto a cui hai aderito.

## Catalogo degli eventi diagnostici

Gli eventi seguenti alimentano le metriche e gli span sopra. I Plugin possono anche sottoscriverli direttamente senza esportazione OTLP.

**Utilizzo del modello**

- `model.usage` - token, costo, durata, contesto, provider/modello/canale, id di sessione. `usage` è la contabilità provider/turno per costo e telemetria; `context.used` è lo snapshot corrente di prompt/contesto e può essere inferiore a `usage.total` del provider quando sono coinvolti input memorizzati nella cache o chiamate del loop degli strumenti.

**Flusso dei messaggi**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Coda e sessione**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (contatori aggregati: Webhook/coda/sessione)

**Ciclo di vita dell'harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - ciclo di vita per esecuzione dell'harness dell'agente. Include `harnessId`, `pluginId` opzionale, provider/modello/canale e id esecuzione. Il completamento aggiunge `durationMs`, `outcome`, `resultClassification` opzionale, `yieldDetected` e conteggi `itemLifecycle`. Gli errori aggiungono `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e `cleanupFailed` opzionale.

**Exec**

- `exec.process.completed` - esito del terminale, durata, target, modalità, codice di uscita e tipo di errore. Il testo del comando e le directory di lavoro non sono inclusi.

## Senza un exporter

Puoi mantenere gli eventi diagnostici disponibili per Plugin o sink personalizzati senza eseguire `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Per output di debug mirato senza aumentare `logging.level`, usa i flag di diagnostica. I flag non distinguono tra maiuscole e minuscole e supportano i caratteri jolly (ad esempio `telegram.*` o `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Oppure come override env una tantum:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

L'output dei flag va al file di log standard (`logging.file`) ed è comunque redatto da `logging.redactSensitive`. Guida completa:
[Flag di diagnostica](/it/diagnostics/flags).

## Disabilitare

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Puoi anche lasciare `diagnostics-otel` fuori da `plugins.allow`, oppure eseguire `openclaw plugins disable diagnostics-otel`.

## Correlati

- [Logging](/it/logging) - log su file, output console, tailing della CLI e scheda Log della Control UI
- [Interni di logging del Gateway](/it/gateway/logging) - stili dei log WS, prefissi dei sottosistemi e cattura della console
- [Flag di diagnostica](/it/diagnostics/flags) - flag mirati per log di debug
- [Esportazione diagnostica](/it/gateway/diagnostics) - strumento per bundle di supporto operatore (separato dall'esportazione OTEL)
- [Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics) - riferimento completo dei campi `diagnostics.*`
