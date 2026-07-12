---
read_when:
    - Vuoi inviare a un collector OpenTelemetry le metriche di utilizzo dei modelli, del flusso dei messaggi o delle sessioni di OpenClaw
    - Stai collegando tracce, metriche o log a Grafana, Datadog, Honeycomb, New Relic, Tempo o a un altro backend OTLP
    - Ti servono i nomi esatti delle metriche, i nomi degli span o le strutture degli attributi per creare dashboard o avvisi
summary: Esporta la diagnostica di OpenClaw nei collector OpenTelemetry o come JSONL su stdout tramite il plugin diagnostics-otel
title: Esportazione OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T07:04:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw esporta la diagnostica tramite il Plugin ufficiale `diagnostics-otel`
utilizzando **OTLP/HTTP (protobuf)**. I log possono inoltre essere scritti come JSONL su stdout per
le pipeline di log di container e sandbox. Qualsiasi collector o backend che accetti
OTLP/HTTP funziona senza modifiche al codice. Per i log su file locali, consulta
[Registrazione](/it/logging).

- Gli **eventi diagnostici** sono record strutturati interni al processo, emessi dal
  Gateway e dai Plugin inclusi per le esecuzioni del modello, il flusso dei messaggi, le sessioni, le code
  e l'esecuzione dei comandi.
- **`diagnostics-otel`** si sottoscrive a questi eventi e li esporta come
  **metriche**, **tracce** e **log** OpenTelemetry tramite OTLP/HTTP; può inoltre
  replicare i record di log come JSONL su stdout.
- Le **chiamate ai provider** ricevono un'intestazione W3C `traceparent` dal
  contesto dello span attendibile della chiamata al modello di OpenClaw quando il trasporto del provider accetta intestazioni
  personalizzate. Il contesto di traccia emesso dai Plugin non viene propagato.
- Gli esportatori vengono collegati solo quando sia l'interfaccia diagnostica sia il Plugin sono
  abilitati, quindi per impostazione predefinita il costo interno al processo rimane prossimo allo zero.

## Avvio rapido

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

In alternativa, abilita il Plugin dalla CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` supporta solo `http/protobuf`. Poiché `traces` e `metrics` sono abilitati per impostazione predefinita, qualsiasi altro valore (incluso `grpc`) interrompe l'intera sottoscrizione diagnostics-otel con un avviso `unsupported protocol`; ciò interrompe anche l'esportazione dei log su stdout. Imposta esplicitamente `traces: false` e `metrics: false` se desideri solo `logsExporter: "stdout"` con un valore di protocollo non OTLP.
</Note>

## Segnali esportati

| Segnale      | Contenuto                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metriche** | Contatori/istogrammi per l'utilizzo dei token, i costi, la durata delle esecuzioni, il failover, l'utilizzo delle Skills, il flusso dei messaggi, gli eventi Talk, le corsie delle code, lo stato/recupero delle sessioni, l'esecuzione degli strumenti, l'esecuzione dei comandi, la memoria, la vitalità e lo stato degli esportatori. |
| **Tracce**  | Span per l'utilizzo e le chiamate dei modelli, il ciclo di vita dell'harness, l'utilizzo delle Skills, l'esecuzione degli strumenti, l'esecuzione dei comandi, l'elaborazione di Webhook/messaggi, la composizione del contesto e i cicli degli strumenti.                                                      |
| **Log**    | Record strutturati `logging.file` esportati tramite OTLP o come JSONL su stdout quando `diagnostics.otel.logs` è abilitato; i corpi dei log vengono omessi, a meno che l'acquisizione dei contenuti non sia abilitata esplicitamente.                          |

Attiva o disattiva `traces`, `metrics` e `logs` in modo indipendente. Le tracce e le metriche
sono abilitate per impostazione predefinita quando `diagnostics.otel.enabled` è `true`; i log sono disabilitati per impostazione predefinita
e vengono esportati solo quando `diagnostics.otel.logs` è esplicitamente `true`. Per impostazione predefinita, i log vengono esportati
tramite OTLP; imposta `diagnostics.otel.logsExporter` su `stdout` per ottenere JSONL su
stdout oppure su `both` per entrambi.

## Riferimento alla configurazione

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
      protocol: "http/protobuf", // grpc disabilita l'esportazione OTLP
      serviceName: "openclaw-gateway", // se non impostato, usa OTEL_SERVICE_NAME, quindi "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // campionatore degli span radice, 0.0..1.0
      flushIntervalMs: 60000, // intervallo di esportazione delle metriche (min 1000 ms)
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

| Variabile                                                                                                          | Scopo                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Valore alternativo per `diagnostics.otel.endpoint` quando la chiave di configurazione non è impostata.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Endpoint alternativi specifici per segnale utilizzati quando la chiave di configurazione `diagnostics.otel.*Endpoint` corrispondente non è impostata. La configurazione specifica per segnale ha la precedenza sulla variabile d'ambiente specifica per segnale, che a sua volta ha la precedenza sull'endpoint condiviso.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Valore alternativo per `diagnostics.otel.serviceName` quando la chiave di configurazione non è impostata. Il nome predefinito del servizio è `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Valore alternativo per il protocollo di trasmissione quando `diagnostics.otel.protocol` non è impostato. Solo `http/protobuf` abilita l'esportazione.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Imposta su `gen_ai_latest_experimental` per emettere la struttura più recente degli span di inferenza GenAI: nomi degli span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo di span `CLIENT` e `gen_ai.provider.name` al posto del precedente `gen_ai.system`. Le metriche GenAI utilizzano sempre attributi limitati e a bassa cardinalità. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Imposta su `1` quando un altro precaricamento o processo host ha già registrato l'SDK OpenTelemetry globale. Il Plugin omette quindi il proprio ciclo di vita NodeSDK, ma configura comunque i listener diagnostici e rispetta `traces`/`metrics`/`logs`.                                                                                    |

## Privacy e acquisizione dei contenuti

Per impostazione predefinita, i contenuti grezzi del modello e degli strumenti **non** vengono esportati. Gli span contengono identificatori
limitati (canale, provider, modello, categoria di errore, ID delle richieste solo come hash,
origine dello strumento, proprietario dello strumento, nome/origine della Skill) e non includono mai il testo del prompt,
il testo della risposta, gli input degli strumenti, gli output degli strumenti, i percorsi dei file delle Skill o le chiavi di sessione.
I valori che sembrano chiavi di sessione con ambito agente (ad esempio quelli che iniziano con
`agent:`) vengono sostituiti con `unknown` negli attributi a bassa cardinalità. Per impostazione predefinita, i record di log
OTLP mantengono gravità, logger, posizione nel codice, contesto di traccia attendibile e
attributi sanificati; il corpo grezzo del messaggio di log viene esportato solo
quando `diagnostics.otel.captureContent` è il valore booleano `true`. Le sottochiavi granulari
`captureContent.*` non abilitano mai i corpi dei log. Le metriche Talk esportano solo
metadati degli eventi limitati (modalità, trasporto, provider, tipo di evento), senza
trascrizioni, payload audio, ID di sessione, ID di turno, ID di chiamata, ID di stanza o
token di trasferimento.

Le richieste in uscita ai modelli possono includere un'intestazione W3C `traceparent` generata esclusivamente
dal contesto di traccia diagnostica di proprietà di OpenClaw per la chiamata al modello attiva.
Le intestazioni `traceparent` esistenti fornite dal chiamante vengono sostituite, quindi i Plugin o
le opzioni personalizzate del provider non possono falsificare l'ascendenza della traccia tra servizi.

Imposta `diagnostics.otel.captureContent.*` su `true` solo quando il collector
e i criteri di conservazione sono approvati per il testo di prompt, risposte, strumenti o
prompt di sistema. Ogni sottochiave è indipendente:

- `inputMessages` - contenuto del prompt dell'utente.
- `outputMessages` - contenuto della risposta del modello.
- `toolInputs` - payload degli argomenti degli strumenti.
- `toolOutputs` - payload dei risultati degli strumenti.
- `systemPrompt` - prompt di sistema/sviluppatore composto.
- `toolDefinitions` - nomi, descrizioni e schemi degli strumenti del modello.

Quando una qualsiasi sottochiave è abilitata, gli span del modello e degli strumenti ricevono attributi
`openclaw.content.*` limitati e oscurati solo per quella classe.

<Note>
Il valore booleano `captureContent: true` abilita insieme `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` e i corpi dei log OTLP, ma **non** `systemPrompt`: imposta esplicitamente `captureContent.systemPrompt: true` se ti serve anche il prompt di sistema composto.
</Note>

Il contenuto di `toolInputs`/`toolOutputs` viene acquisito per le esecuzioni degli strumenti
del runtime dell'agente integrato (`openclaw.content.tool_input` e
`gen_ai.tool.call.arguments` negli span completati/con errore;
`openclaw.content.tool_output` e `gen_ai.tool.call.result` negli span completati).
I nomi `openclaw.content.*` rimangono i nomi stabili degli attributi di OpenClaw;
le copie `gen_ai.tool.call.*` li replicano per i visualizzatori nativi semconv.
Le chiamate agli strumenti di harness esterni (Codex, Claude CLI) emettono
span `tool.execution.*` senza payload di contenuto. Il contenuto acquisito viene trasmesso su un
canale attendibile riservato ai listener e non viene mai inserito nel bus pubblico degli eventi
diagnostici.

## Campionamento e invio periodico

- **Tracce:** `diagnostics.otel.sampleRate` imposta un `TraceIdRatioBasedSampler`
  solo sullo span radice (`0.0` elimina tutto, `1.0` conserva tutto). Se non impostato, usa il
  valore predefinito dell'SDK OpenTelemetry (sempre attivo).
- **Metriche:** `diagnostics.otel.flushIntervalMs` (limitato a un minimo di
  `1000`); se non impostato, usa il valore predefinito dell'esportazione periodica dell'SDK.
- **Log:** i log OTLP rispettano `logging.level` (livello dei log su file) e usano il
  percorso di oscuramento dei record di log diagnostici, non la formattazione della console. Le installazioni
  ad alto volume dovrebbero preferire il campionamento o il filtraggio del collector OTLP rispetto al
  campionamento locale. Imposta `diagnostics.otel.logsExporter: "stdout"` quando la piattaforma
  invia già stdout/stderr a un elaboratore di log e non è disponibile alcun collector
  di log OTLP. I record stdout sono costituiti da un oggetto JSON per riga con `ts`, `signal`,
  `service.name`, gravità, corpo, attributi oscurati e campi di traccia
  attendibili, quando disponibili.
- **Correlazione dei log su file:** i log dei file JSONL includono al livello principale `traceId`,
  `spanId`, `parentSpanId` e `traceFlags` quando la chiamata di log contiene un contesto
  di traccia diagnostica valido, consentendo agli elaboratori di log di associare le righe dei log locali agli
  span esportati.
- **Correlazione delle richieste:** le richieste HTTP del Gateway e i frame WebSocket creano
  un ambito interno di traccia della richiesta. I log e gli eventi diagnostici all'interno di tale
  ambito ereditano per impostazione predefinita la traccia della richiesta, mentre gli span delle esecuzioni dell'agente e delle chiamate
  al modello vengono creati come figli, affinché le intestazioni `traceparent` del provider rimangano nella
  stessa traccia.
- **Correlazione delle chiamate al modello:** gli span `openclaw.model.call` includono per impostazione predefinita le dimensioni
  sicure dei componenti del prompt e gli attributi dei token per chiamata quando il risultato del provider
  espone i dati di utilizzo. `openclaw.model.usage` rimane lo span di contabilizzazione
  a livello di esecuzione per il costo aggregato e per i pannelli di controllo di contesto e canale, e
  resta sulla stessa traccia diagnostica quando il runtime che lo emette dispone di un contesto
  di traccia attendibile.

## Metriche esportate

### Utilizzo del modello

- `openclaw.tokens` (contatore, attributi: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contatore, attributi: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (istogramma, attributi: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (istogramma, attributi: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (istogramma, metrica delle convenzioni semantiche GenAI, attributi: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (istogramma, secondi, metrica delle convenzioni semantiche GenAI, attributi: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` facoltativo)
- `openclaw.model_call.duration_ms` (istogramma, attributi: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, oltre a `openclaw.errorCategory` e `openclaw.failureKind` per gli errori classificati)
- `openclaw.model_call.request_bytes` (istogramma, dimensione in byte UTF-8 del payload finale della richiesta al modello; nessun contenuto del payload non elaborato)
- `openclaw.model_call.response_bytes` (istogramma, dimensione in byte UTF-8 dei payload dei frammenti di risposta trasmessi in streaming; per testo, ragionamento e delta delle chiamate agli strumenti ad alta frequenza vengono conteggiati solo i byte incrementali di `delta`; nessun contenuto della risposta non elaborata)
- `openclaw.model_call.time_to_first_byte_ms` (istogramma, tempo trascorso prima del primo evento di risposta trasmesso in streaming)
- `openclaw.model.failover` (contatore, attributi: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (contatore, attributi: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` facoltativo, `openclaw.toolName` facoltativo)

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
- `openclaw.talk.event.duration_ms` (istogramma, attributi: gli stessi di `openclaw.talk.event`; emesso quando un evento di conversazione indica una durata)
- `openclaw.talk.audio.bytes` (istogramma, attributi: gli stessi di `openclaw.talk.event`; emesso per gli eventi di frame audio della conversazione che indicano la lunghezza in byte)

### Code e sessioni

- `openclaw.queue.lane.enqueue` (contatore, attributi: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contatore, attributi: `openclaw.lane`)
- `openclaw.queue.depth` (istogramma, attributi: `openclaw.lane` oppure `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (istogramma, attributi: `openclaw.lane`)
- `openclaw.session.state` (contatore, attributi: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contatore, attributi: `openclaw.state`; emesso per dati contabili obsoleti e recuperabili della sessione)
- `openclaw.session.stuck_age_ms` (istogramma, attributi: `openclaw.state`; emesso per dati contabili obsoleti e recuperabili della sessione)
- `openclaw.session.turn.created` (contatore, attributi: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contatore, attributi: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contatore, attributi: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (istogramma, attributi: gli stessi del contatore di recupero corrispondente)
- `openclaw.run.attempt` (contatore, attributi: `openclaw.attempt`)

### Telemetria dell'operatività delle sessioni

`diagnostics.stuckSessionWarnMs` è la soglia di tempo senza avanzamenti per la diagnostica
dell'operatività delle sessioni. Una sessione `processing` non invecchia verso questa
soglia mentre OpenClaw osserva avanzamenti nelle risposte, negli strumenti, nello stato, nei blocchi o nel runtime
ACP. I segnali periodici di digitazione non sono considerati avanzamenti, quindi è comunque possibile
rilevare un modello o un'infrastruttura di esecuzione silenziosi.

OpenClaw classifica le sessioni in base al lavoro che può ancora osservare:

- `session.long_running`: il lavoro incorporato attivo, le chiamate al modello o le chiamate agli strumenti
  continuano ad avanzare. Anche le chiamate al modello con un proprietario che rimangono silenziose oltre
  `diagnostics.stuckSessionWarnMs` vengono segnalate come di lunga durata prima di
  `diagnostics.stuckSessionAbortMs`, in modo che i provider di modelli lenti o senza streaming
  non sembrino sessioni del Gateway bloccate finché l'interruzione può essere osservata.
- `session.stalled`: esiste del lavoro attivo, ma l'esecuzione attiva non ha segnalato
  avanzamenti recenti. Le chiamate al modello con un proprietario passano da `session.long_running` a
  `session.stalled` al raggiungimento o superamento di `diagnostics.stuckSessionAbortMs`; l'attività
  obsoleta di modelli o strumenti senza proprietario non viene considerata innocuo lavoro di lunga durata.
  Le esecuzioni incorporate bloccate rimangono inizialmente in sola osservazione, quindi vengono interrotte
  e svuotate dopo `diagnostics.stuckSessionAbortMs` senza avanzamenti, affinché i turni in coda
  dietro la corsia possano riprendere. Se non impostata, la soglia di interruzione usa per impostazione predefinita la finestra
  estesa più sicura di almeno 5 minuti e 3 volte
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: dati contabili obsoleti della sessione senza lavoro attivo oppure una sessione inattiva
  in coda con attività obsoleta di modelli o strumenti senza proprietario. Ciò libera
  immediatamente la corsia della sessione interessata dopo il superamento dei controlli di recupero.

Il recupero emette gli eventi strutturati `session.recovery.requested` e
`session.recovery.completed`. Lo stato diagnostico della sessione viene contrassegnato come inattivo
solo dopo un esito di recupero che apporta modifiche (`aborted` o `released`) e solo se
la stessa generazione di elaborazione è ancora quella corrente.

Solo `session.stuck` emette il contatore `openclaw.session.stuck`, l'istogramma
`openclaw.session.stuck_age_ms` e lo span `openclaw.session.stuck`.
Le diagnostiche `session.stuck` ripetute applicano un'attesa progressiva finché la sessione rimane
invariata, quindi i pannelli di controllo dovrebbero generare avvisi sugli aumenti persistenti anziché
a ogni ciclo di Heartbeat. Per l'opzione di configurazione e i valori predefiniti, consulta il
[Riferimento della configurazione](/it/gateway/configuration-reference#diagnostics).

Gli avvisi sull'operatività emettono inoltre:

- `openclaw.liveness.warning` (contatore, attributi: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (istogramma, attributi: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (istogramma, attributi: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (istogramma, attributi: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (istogramma, attributi: `openclaw.liveness.reason`)

### Ciclo di vita dell'infrastruttura di esecuzione

- `openclaw.harness.duration_ms` (istogramma, attributi: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` in caso di errori)

### Esecuzione degli strumenti e rilevamento dei cicli

- `openclaw.tool.execution.duration_ms` (istogramma, attributi: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, oltre a `openclaw.errorCategory` in caso di errori)
- `openclaw.tool.execution.blocked` (contatore, attributi: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (contatore, attributi: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` facoltativo; emesso quando viene rilevato un ciclo ripetitivo di chiamate agli strumenti)

### Esecuzione

- `openclaw.exec.duration_ms` (istogramma, attributi: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Componenti interni della diagnostica (memoria, payload, stato degli esportatori)

- `openclaw.payload.large` (contatore, attributi: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (istogramma, attributi: gli stessi di `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (istogrammi, nessun attributo; campioni della memoria del processo)
- `openclaw.memory.pressure` (contatore, attributi: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (contatore, attributi: `openclaw.diagnostic.async_queue.drop_class`; elementi eliminati a causa della contropressione della coda diagnostica interna)
- `openclaw.telemetry.exporter.events` (contatore, attributi: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` facoltativo, `openclaw.errorCategory` facoltativo; autotelemetria del ciclo di vita e degli errori degli esportatori)

## Span esportati

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando si attivano le convenzioni semantiche GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando si attivano le convenzioni semantiche GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` e, facoltativamente, `openclaw.failureKind` in caso di errori
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (solo dimensioni sicure dei componenti, nessun testo del prompt)
  - `openclaw.model_call.usage.*` e `gen_ai.usage.*` quando il risultato della chiamata al modello include i dati di utilizzo del provider per quella singola chiamata
  - Evento dello span `openclaw.provider.request` con l'attributo `openclaw.upstreamRequestIdHash` (limitato, basato su hash) quando il risultato del provider a monte espone un ID richiesta; gli ID non elaborati non vengono mai esportati
  - Con `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, gli span delle chiamate al modello usano il nome dello span di inferenza GenAI più recente `{gen_ai.operation.name} {gen_ai.request.model}` e il tipo di span `CLIENT` anziché `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al completamento: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - In caso di errore: `openclaw.harness.phase`, `openclaw.errorCategory`, facoltativamente `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, facoltativamente `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Facoltativamente `openclaw.errorCategory`/`openclaw.errorCode` in caso di errori, `openclaw.deniedReason` e `openclaw.outcome=blocked` quando l'operazione viene negata dai criteri o dalla sandbox
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (nessun contenuto di prompt, cronologia, risposta o chiave di sessione)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, facoltativamente `openclaw.loop.paired_tool` (nessun messaggio del ciclo, parametro o output dello strumento)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, facoltativamente `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

Quando l'acquisizione dei contenuti è abilitata esplicitamente, gli span del modello e degli strumenti possono includere anche attributi `openclaw.content.*` limitati e oscurati per le specifiche classi di contenuto attivate.

## Catalogo degli eventi diagnostici

Gli eventi riportati di seguito alimentano le metriche e gli span indicati sopra. I Plugin possono anche sottoscriverli direttamente senza esportazione OTLP.

**Utilizzo del modello**

- `model.usage` - token, costo, durata, contesto, provider/modello/canale,
  ID di sessione. `usage` rappresenta la contabilizzazione del provider/turno per costi e telemetria;
  `context.used` è l'istantanea corrente del prompt/contesto e può essere inferiore a
  `usage.total` del provider quando sono coinvolti input memorizzati nella cache o chiamate del ciclo degli strumenti.

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
  ciclo di vita di ogni esecuzione per l'harness dell'agente. Include `harnessId`, il valore facoltativo
  `pluginId`, provider/modello/canale e l'ID esecuzione. Il completamento aggiunge
  `durationMs`, `outcome`, il valore facoltativo `resultClassification`, `yieldDetected`
  e i conteggi `itemLifecycle`. Gli errori aggiungono `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e,
  facoltativamente, `cleanupFailed`.

**Esecuzione**

- `exec.process.completed` - esito finale, durata, destinazione, modalità, codice
  di uscita e tipo di errore. Il testo del comando e le directory di lavoro non sono
  inclusi.
- `exec.approval.followup_suppressed` - follow-up di approvazione obsoleto eliminato
  dopo la riassociazione di una sessione. Include `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` o `gateway_preflight`)
  e il timestamp del dispatcher. Le chiavi di sessione, gli instradamenti e il testo del comando non sono
  inclusi.

## Senza un esportatore

Mantieni gli eventi diagnostici disponibili per i Plugin o le destinazioni personalizzate senza eseguire
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Per un output di debug mirato senza aumentare `logging.level`, usa i flag diagnostici. I flag non distinguono tra maiuscole e minuscole e supportano i caratteri jolly (`telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Oppure come override temporaneo tramite variabile di ambiente:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

L'output dei flag viene scritto nel file di log standard (`logging.file`) e rimane
oscurato da `logging.redactSensitive`. Guida completa:
[Flag diagnostici](/it/diagnostics/flags).

## Disabilitazione

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

In alternativa, ometti `diagnostics-otel` da `plugins.allow` oppure esegui
`openclaw plugins disable diagnostics-otel`.

## Contenuti correlati

- [Registrazione](/it/logging) - log su file, output della console, monitoraggio tramite CLI e scheda Log dell'interfaccia di controllo
- [Dettagli interni della registrazione del Gateway](/it/gateway/logging) - stili dei log WS, prefissi dei sottosistemi e acquisizione della console
- [Flag diagnostici](/it/diagnostics/flags) - flag mirati per i log di debug
- [Esportazione della diagnostica](/it/gateway/diagnostics) - strumento per il pacchetto di supporto dell'operatore (separato dall'esportazione OTEL)
- [Riferimento della configurazione](/it/gateway/configuration-reference#diagnostics) - riferimento completo dei campi `diagnostics.*`
