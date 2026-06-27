---
read_when:
    - Vuoi inviare l'utilizzo dei modelli OpenClaw, il flusso dei messaggi o le metriche di sessione a un collector OpenTelemetry
    - Stai collegando trace, metriche o log a Grafana, Datadog, Honeycomb, New Relic, Tempo o a un altro backend OTLP
    - Hai bisogno dei nomi esatti delle metriche, dei nomi degli span o delle forme degli attributi per creare dashboard o avvisi.
summary: Esporta la diagnostica di OpenClaw verso collector OpenTelemetry o stdout JSONL tramite il plugin diagnostics-otel
title: Esportazione OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T17:33:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw esporta la diagnostica tramite il Plugin ufficiale `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. I log possono anche essere scritti come stdout JSONL per
le pipeline di log di container e sandbox. Qualsiasi collector o backend che accetta
OTLP/HTTP funziona senza modifiche al codice. Per i log su file locali e come leggerli,
vedi [Logging](/it/logging).

## Come funziona insieme

- Gli **eventi di diagnostica** sono record strutturati, in-process, emessi dal
  Gateway e dai Plugin integrati per esecuzioni del modello, flusso dei messaggi, sessioni, code,
  ed exec.
- Il **Plugin `diagnostics-otel`** si sottoscrive a quegli eventi e li esporta come
  **metriche**, **tracce** e **log** OpenTelemetry su OTLP/HTTP. Può
  anche replicare i record di log diagnostici su stdout JSONL.
- Le **chiamate ai provider** ricevono un header W3C `traceparent` dal contesto dello span
  attendibile di chiamata al modello di OpenClaw quando il trasporto del provider accetta header
  personalizzati. Il contesto di traccia emesso dai Plugin non viene propagato.
- Gli exporter si collegano solo quando sia la superficie di diagnostica sia il Plugin sono
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

| Segnale     | Cosa contiene                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metriche** | Contatori e istogrammi per utilizzo dei token, costo, durata dell'esecuzione, failover, utilizzo delle Skills, flusso dei messaggi, eventi Talk, corsie di coda, stato/ripristino delle sessioni, esecuzione degli strumenti, payload sovradimensionati, exec e pressione sulla memoria. |
| **Tracce**  | Span per utilizzo del modello, chiamate al modello, ciclo di vita dell'harness, utilizzo delle Skills, esecuzione degli strumenti, exec, elaborazione di webhook/messaggi, assemblaggio del contesto e cicli degli strumenti. |
| **Log**     | Record strutturati `logging.file` esportati su OTLP o stdout JSONL quando `diagnostics.otel.logs` è abilitato; i corpi dei log vengono trattenuti a meno che l'acquisizione del contenuto non sia esplicitamente abilitata. |

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

| Variabile                                                                                                         | Scopo                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sovrascrive `diagnostics.otel.endpoint`. Se il valore contiene già `/v1/traces`, `/v1/metrics` o `/v1/logs`, viene usato così com'è.                                                                                                                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Override degli endpoint specifici del segnale usati quando la chiave di configurazione `diagnostics.otel.*Endpoint` corrispondente non è impostata. La configurazione specifica del segnale prevale sull'env specifico del segnale, che prevale sull'endpoint condiviso.                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Sovrascrive `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sovrascrive il protocollo wire (oggi viene rispettato solo `http/protobuf`).                                                                                                                                                                                                                                                                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Imposta su `gen_ai_latest_experimental` per emettere la forma span sperimentale più recente per l'inferenza GenAI, inclusi nomi span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo di span `CLIENT` e `gen_ai.provider.name` invece del legacy `gen_ai.system`. Le metriche GenAI usano sempre attributi semantici limitati e a bassa cardinalità. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Imposta su `1` quando un altro preload o processo host ha già registrato l'SDK OpenTelemetry globale. Il Plugin quindi salta il proprio ciclo di vita NodeSDK ma collega comunque i listener diagnostici e rispetta `traces`/`metrics`/`logs`.                                                                                              |

## Privacy e acquisizione dei contenuti

Il contenuto grezzo di modello/strumento **non** viene esportato per impostazione predefinita. Gli span trasportano
identificatori limitati (canale, provider, modello, categoria di errore, id richiesta solo hash,
origine dello strumento, proprietario dello strumento e nome/origine della Skill) e non includono mai testo del prompt,
testo della risposta, input degli strumenti, output degli strumenti, percorsi dei file delle Skill o chiavi di sessione.
I record di log OTLP mantengono severità, logger, posizione nel codice, contesto di traccia attendibile
e attributi sanificati per impostazione predefinita, ma il corpo grezzo del messaggio di log viene esportato
solo quando `diagnostics.otel.captureContent` è impostato al booleano `true`. Le sottochiavi granulari
`captureContent.*` non abilitano i corpi dei log. Le etichette che sembrano
chiavi di sessione agente con scope vengono sostituite con `unknown`.
Le metriche Talk esportano solo metadati evento limitati come modalità, trasporto,
provider e tipo di evento. Non includono trascrizioni, payload audio,
id sessione, id turno, id chiamata, id stanza o token di handoff.

Le richieste in uscita verso i modelli possono includere un header W3C `traceparent`. Quell'header viene
generato solo dal contesto di traccia diagnostico di proprietà di OpenClaw per la chiamata al modello attiva.
Gli header `traceparent` esistenti forniti dal chiamante vengono sostituiti, quindi Plugin o
opzioni provider personalizzate non possono falsificare l'ascendenza di traccia tra servizi.

Imposta `diagnostics.otel.captureContent.*` su `true` solo quando il tuo collector e
la policy di conservazione sono approvati per testo di prompt, risposta, strumento o system-prompt.
Ogni sottochiave è opt-in in modo indipendente:

- `inputMessages` - contenuto del prompt utente.
- `outputMessages` - contenuto della risposta del modello.
- `toolInputs` - payload degli argomenti dello strumento.
- `toolOutputs` - payload dei risultati dello strumento.
- `systemPrompt` - prompt di sistema/sviluppatore assemblato.
- `toolDefinitions` - nomi, descrizioni e schemi degli strumenti del modello.

Quando una qualsiasi sottochiave è abilitata, gli span di modello e strumento ricevono attributi
`openclaw.content.*` limitati e redatti solo per quella classe. Usa il booleano
`captureContent: true` solo per acquisizioni diagnostiche ampie in cui anche i corpi dei messaggi di log OTLP
sono approvati per l'esportazione.

Il contenuto `toolInputs`/`toolOutputs` viene acquisito per le esecuzioni degli strumenti del runtime agente
integrato (`openclaw.content.tool_input` su span completati/con errore,
`openclaw.content.tool_output` su span completati). Le chiamate agli strumenti da harness esterni
(Codex, Claude CLI) emettono span `tool.execution.*` senza payload di contenuto.
Il contenuto acquisito viaggia su un canale attendibile solo listener e non viene mai inserito
nel bus pubblico degli eventi diagnostici.

## Campionamento e flush

- **Tracce:** `diagnostics.otel.sampleRate` (solo root-span, `0.0` scarta tutto,
  `1.0` conserva tutto).
- **Metriche:** `diagnostics.otel.flushIntervalMs` (minimo `1000`).
- **Log:** i log OTLP rispettano `logging.level` (livello dei log su file). Usano il
  percorso di redazione dei record di log diagnostici, non la formattazione console. Le installazioni
  ad alto volume dovrebbero preferire campionamento/filtro del collector OTLP rispetto al campionamento locale.
  Imposta `diagnostics.otel.logsExporter: "stdout"` quando la tua piattaforma invia già
  stdout/stderr a un processore di log e non hai un collector di log OTLP.
  I record stdout sono un oggetto JSON per riga con `ts`, `signal`,
  `service.name`, severità, corpo, attributi redatti e campi di traccia attendibili
  quando disponibili.
- **Correlazione dei log su file:** i log file JSONL includono `traceId`,
  `spanId`, `parentSpanId` e `traceFlags` al livello superiore quando la chiamata di log trasporta un contesto
  di traccia diagnostico valido, consentendo ai processori di log di unire righe di log locali con
  span esportati.
- **Correlazione delle richieste:** le richieste HTTP Gateway e i frame WebSocket creano uno
  scope di traccia richiesta interno. I log e gli eventi diagnostici dentro quello scope
  ereditano la traccia della richiesta per impostazione predefinita, mentre gli span di esecuzione agente e chiamata al modello
  vengono creati come figli, così gli header `traceparent` dei provider restano sulla stessa traccia.

## Metriche esportate

### Utilizzo del modello

- `openclaw.tokens` (contatore, attributi: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contatore, attributi: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (istogramma, attributi: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (istogramma, attributi: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (istogramma, metrica delle convenzioni semantiche GenAI, attributi: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (istogramma, secondi, metrica delle convenzioni semantiche GenAI, attributi: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, facoltativo `error.type`)
- `openclaw.model_call.duration_ms` (istogramma, attributi: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, più `openclaw.errorCategory` e `openclaw.failureKind` sugli errori classificati)
- `openclaw.model_call.request_bytes` (istogramma, dimensione in byte UTF-8 del payload finale della richiesta al modello; nessun contenuto grezzo del payload)
- `openclaw.model_call.response_bytes` (istogramma, dimensione in byte UTF-8 dei payload dei frammenti di risposta trasmessi in streaming; testo ad alta frequenza, thinking e delta di chiamate agli strumenti contano solo i byte incrementali di `delta`; nessun contenuto grezzo della risposta)
- `openclaw.model_call.time_to_first_byte_ms` (istogramma, tempo trascorso prima del primo evento di risposta in streaming)
- `openclaw.model.failover` (contatore, attributi: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (contatore, attributi: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, facoltativo `openclaw.agent`, facoltativo `openclaw.toolName`)

### Flusso dei messaggi

- `openclaw.webhook.received` (contatore, attributi: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (contatore, attributi: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (istogramma, attributi: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (contatore, attributi: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (contatore, attributi: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (contatore, attributi: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (contatore, attributi: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (istogramma, attributi: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (contatore, attributi: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (istogramma, attributi: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (contatore, attributi: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (istogramma, attributi: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Conversazione

- `openclaw.talk.event` (contatore, attributi: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (istogramma, attributi: uguali a `openclaw.talk.event`; emesso quando un evento di conversazione riporta una durata)
- `openclaw.talk.audio.bytes` (istogramma, attributi: uguali a `openclaw.talk.event`; emesso per eventi di frame audio della conversazione che riportano la lunghezza in byte)

### Code e sessioni

- `openclaw.queue.lane.enqueue` (contatore, attributi: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contatore, attributi: `openclaw.lane`)
- `openclaw.queue.depth` (istogramma, attributi: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (istogramma, attributi: `openclaw.lane`)
- `openclaw.session.state` (contatore, attributi: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contatore, attributi: `openclaw.state`; emesso per contabilità di sessioni obsolete recuperabili)
- `openclaw.session.stuck_age_ms` (istogramma, attributi: `openclaw.state`; emesso per contabilità di sessioni obsolete recuperabili)
- `openclaw.session.turn.created` (contatore, attributi: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contatore, attributi: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contatore, attributi: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (istogramma, attributi: uguali al contatore di ripristino corrispondente)
- `openclaw.run.attempt` (contatore, attributi: `openclaw.attempt`)

### Telemetria di vitalità delle sessioni

`diagnostics.stuckSessionWarnMs` è la soglia di età senza avanzamento per la diagnostica della vitalità delle sessioni. Una sessione `processing` non avanza verso questa soglia mentre OpenClaw osserva progressi di risposta, strumenti, stato, blocchi o runtime ACP. I keepalive di digitazione non sono conteggiati come progresso, quindi un modello o harness silenzioso può comunque essere rilevato.

OpenClaw classifica le sessioni in base al lavoro che può ancora osservare:

- `session.long_running`: lavoro incorporato attivo, chiamate al modello o chiamate agli strumenti stanno ancora facendo progressi. Anche le chiamate al modello possedute che restano silenziose oltre `diagnostics.stuckSessionWarnMs` vengono segnalate come a lunga esecuzione prima di `diagnostics.stuckSessionAbortMs`, così i provider di modelli lenti o non in streaming non sembrano sessioni Gateway bloccate finché restano osservabili per l'interruzione.
- `session.stalled`: esiste lavoro attivo, ma l'esecuzione attiva non ha segnalato progressi recenti. Le chiamate al modello possedute passano da `session.long_running` a `session.stalled` a partire da `diagnostics.stuckSessionAbortMs`; l'attività obsoleta di modelli/strumenti senza proprietario non viene trattata come lavoro a lunga esecuzione innocuo. Le esecuzioni incorporate bloccate restano inizialmente solo osservate, poi vengono interrotte e drenate dopo `diagnostics.stuckSessionAbortMs` senza progressi, così i turni in coda dietro la lane possono riprendere. Quando non impostata, la soglia di interruzione usa come predefinita la finestra estesa più sicura di almeno 5 minuti e 3x `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: contabilità di sessione obsoleta senza lavoro attivo, oppure una sessione in coda inattiva con attività obsoleta di modelli/strumenti senza proprietario. Questo rilascia immediatamente la lane della sessione interessata dopo il superamento dei gate di ripristino.

Il ripristino emette eventi strutturati `session.recovery.requested` e `session.recovery.completed`. Lo stato diagnostico della sessione viene contrassegnato come inattivo solo dopo un esito di ripristino mutante (`aborted` o `released`) e solo se la stessa generazione di elaborazione è ancora corrente.

Solo `session.stuck` emette il contatore `openclaw.session.stuck`, l'istogramma `openclaw.session.stuck_age_ms` e lo span `openclaw.session.stuck`. Le diagnostiche `session.stuck` ripetute applicano un backoff mentre la sessione resta invariata, quindi le dashboard dovrebbero generare avvisi su aumenti sostenuti invece che su ogni tick di Heartbeat. Per la manopola di configurazione e i valori predefiniti, vedere il [Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics).

Gli avvisi di vitalità emettono anche:

- `openclaw.liveness.warning` (contatore, attributi: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (istogramma, attributi: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (istogramma, attributi: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (istogramma, attributi: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (istogramma, attributi: `openclaw.liveness.reason`)

### Ciclo di vita dell'harness

- `openclaw.harness.duration_ms` (istogramma, attributi: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` sugli errori)

### Esecuzione degli strumenti

- `openclaw.tool.execution.duration_ms` (istogramma, attributi: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, più `openclaw.errorCategory` sugli errori)
- `openclaw.tool.execution.blocked` (contatore, attributi: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Esecuzione

- `openclaw.exec.duration_ms` (istogramma, attributi: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Interni della diagnostica (memoria e ciclo degli strumenti)

- `openclaw.payload.large` (contatore, attributi: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (istogramma, attributi: uguali a `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (istogramma, attributi: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (istogramma)
- `openclaw.memory.pressure` (contatore, attributi: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contatore, attributi: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (istogramma, attributi: `openclaw.toolName`, `openclaw.outcome`)

## Span esportati

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
  - `openclaw.provider.request_id_hash` (hash limitato basato su SHA dell'ID richiesta del provider upstream; gli ID grezzi non vengono esportati)
  - Con `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, gli span delle chiamate al modello usano il nome span di inferenza GenAI più recente `{gen_ai.operation.name} {gen_ai.request.model}` e il tipo di span `CLIENT` invece di `openclaw.model.call`.
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (nessun messaggio di ciclo, parametro o output dello strumento)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando l'acquisizione dei contenuti è abilitata esplicitamente, gli span di modello e strumento possono includere anche attributi `openclaw.content.*` limitati e redatti per le classi di contenuto specifiche a cui hai aderito.

## Catalogo degli eventi diagnostici

Gli eventi seguenti supportano le metriche e gli span sopra indicati. I Plugin possono anche iscriversi direttamente a questi eventi senza esportazione OTLP.

**Utilizzo del modello**

- `model.usage` - token, costo, durata, contesto, provider/modello/canale,
  ID sessione. `usage` è la contabilità provider/turno per costo e telemetria;
  `context.used` è lo snapshot corrente di prompt/contesto e può essere inferiore a
  `usage.total` del provider quando sono coinvolti input memorizzati nella cache o chiamate tool-loop.

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
  ciclo di vita per esecuzione dell'harness agente. Include `harnessId`, `pluginId`
  facoltativo, provider/modello/canale e ID esecuzione. Il completamento aggiunge
  `durationMs`, `outcome`, `resultClassification` facoltativo, `yieldDetected`
  e conteggi `itemLifecycle`. Gli errori aggiungono `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` facoltativo.

**Exec**

- `exec.process.completed` - risultato terminale, durata, destinazione, modalità, codice di uscita
  e tipo di errore. Il testo del comando e le directory di lavoro non sono inclusi.

## Senza un esportatore

Puoi mantenere gli eventi diagnostici disponibili per Plugin o destinazioni personalizzate senza
eseguire `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Per output di debug mirato senza aumentare `logging.level`, usa i flag diagnostici. I flag non distinguono tra maiuscole e minuscole e supportano i caratteri jolly (ad es. `telegram.*` o
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

- [Log](/it/logging) - log su file, output console, tailing CLI e scheda Log della Control UI
- [Interni dei log del Gateway](/it/gateway/logging) - stili dei log WS, prefissi dei sottosistemi e acquisizione della console
- [Flag diagnostici](/it/diagnostics/flags) - flag mirati per log di debug
- [Esportazione diagnostica](/it/gateway/diagnostics) - strumento per bundle di supporto dell'operatore (separato dall'esportazione OTEL)
- [Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics) - riferimento completo dei campi `diagnostics.*`
