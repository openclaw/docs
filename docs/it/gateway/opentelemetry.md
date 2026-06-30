---
read_when:
    - Vuoi inviare l'utilizzo dei modelli OpenClaw, il flusso dei messaggi o le metriche di sessione a un collector OpenTelemetry
    - Stai collegando tracce, metriche o log a Grafana, Datadog, Honeycomb, New Relic, Tempo o a un altro backend OTLP
    - Ti servono i nomi esatti delle metriche, i nomi degli span o le forme degli attributi per creare dashboard o avvisi
summary: Esporta la diagnostica di OpenClaw verso collector OpenTelemetry o JSONL su stdout tramite il plugin diagnostics-otel
title: Esportazione OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:09:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw esporta diagnostica tramite il Plugin ufficiale `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. I log possono anche essere scritti come JSONL su stdout per
pipeline di log di container e sandbox. Qualsiasi collector o backend che accetta
OTLP/HTTP funziona senza modifiche al codice. Per i log su file locali e come leggerli,
vedi [Logging](/it/logging).

## Come funziona l’integrazione

- Gli **eventi di diagnostica** sono record strutturati, interni al processo, emessi dal
  Gateway e dai plugin in bundle per esecuzioni di modelli, flusso dei messaggi, sessioni, code
  ed exec.
- Il **Plugin `diagnostics-otel`** sottoscrive questi eventi e li esporta come
  **metriche**, **tracce** e **log** OpenTelemetry tramite OTLP/HTTP. Può
  anche replicare i record di log diagnostici in JSONL su stdout.
- Le **chiamate ai provider** ricevono un header W3C `traceparent` dal contesto di span
  attendibile della chiamata al modello di OpenClaw quando il trasporto del provider accetta header
  personalizzati. Il contesto di traccia emesso dai plugin non viene propagato.
- Gli exporter vengono collegati solo quando sia la superficie di diagnostica sia il plugin sono
  abilitati, quindi il costo interno al processo resta quasi nullo per impostazione predefinita.

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
`protocol` attualmente supporta solo `http/protobuf`. `grpc` viene ignorato.
</Note>

## Segnali esportati

| Segnale     | Cosa contiene                                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metriche** | Contatori e istogrammi per uso dei token, costo, durata dell’esecuzione, failover, uso delle Skills, flusso dei messaggi, eventi Talk, corsie di coda, stato/ripristino delle sessioni, esecuzione degli strumenti, payload sovradimensionati, exec e pressione di memoria. |
| **Tracce**  | Span per uso del modello, chiamate al modello, ciclo di vita dell’harness, uso delle Skills, esecuzione degli strumenti, exec, elaborazione di webhook/messaggi, assemblaggio del contesto e cicli degli strumenti. |
| **Log**     | Record strutturati `logging.file` esportati tramite OTLP o JSONL su stdout quando `diagnostics.otel.logs` è abilitato; i corpi dei log vengono omessi salvo che la cattura del contenuto sia abilitata esplicitamente. |

Attiva o disattiva `traces`, `metrics` e `logs` in modo indipendente. Tracce e metriche
sono attive per impostazione predefinita quando `diagnostics.otel.enabled` è true. I log sono disattivati per impostazione predefinita e
vengono esportati solo quando `diagnostics.otel.logs` è esplicitamente `true`. L’esportazione dei log
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

### Variabili d’ambiente

| Variabile                                                                                                         | Scopo                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sovrascrive `diagnostics.otel.endpoint`. Se il valore contiene già `/v1/traces`, `/v1/metrics` o `/v1/logs`, viene usato così com’è.                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Sovrascritture degli endpoint specifiche del segnale, usate quando la chiave di configurazione `diagnostics.otel.*Endpoint` corrispondente non è impostata. La configurazione specifica del segnale prevale sull’env specifico del segnale, che prevale sull’endpoint condiviso.                                                              |
| `OTEL_SERVICE_NAME`                                                                                               | Sovrascrive `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sovrascrive il protocollo wire; oggi viene rispettato solo `http/protobuf`.                                                                                                                                                                                                                                                                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Imposta su `gen_ai_latest_experimental` per emettere la forma più recente e sperimentale degli span di inferenza GenAI, inclusi nomi degli span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo di span `CLIENT` e `gen_ai.provider.name` invece del legacy `gen_ai.system`. Le metriche GenAI usano sempre attributi semantici limitati e a bassa cardinalità. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Imposta su `1` quando un altro preload o processo host ha già registrato l’SDK OpenTelemetry globale. Il plugin quindi salta il proprio ciclo di vita NodeSDK ma collega comunque i listener diagnostici e rispetta `traces`/`metrics`/`logs`.                                                                                               |

## Privacy e cattura del contenuto

Il contenuto grezzo di modelli/strumenti **non** viene esportato per impostazione predefinita. Gli span trasportano
identificatori limitati (canale, provider, modello, categoria di errore, ID richiesta solo hash,
origine dello strumento, proprietario dello strumento e nome/origine della Skill) e non includono mai testo del prompt,
testo della risposta, input degli strumenti, output degli strumenti, percorsi dei file delle Skill o chiavi di sessione.
I record di log OTLP mantengono severità, logger, posizione nel codice, contesto di traccia attendibile
e attributi sanificati per impostazione predefinita, ma il corpo grezzo del messaggio di log viene esportato
solo quando `diagnostics.otel.captureContent` è impostato sul booleano `true`. Le sottochiavi granulari
`captureContent.*` non abilitano i corpi dei log. Le etichette che sembrano
chiavi di sessione agent con scope vengono sostituite con `unknown`.
Le metriche Talk esportano solo metadati degli eventi limitati, come modalità, trasporto,
provider e tipo di evento. Non includono trascrizioni, payload audio,
ID sessione, ID turno, ID chiamata, ID stanza o token di handoff.

Le richieste in uscita ai modelli possono includere un header W3C `traceparent`. Tale header viene
generato solo dal contesto di traccia diagnostica di proprietà di OpenClaw per la chiamata al modello
attiva. Gli header `traceparent` esistenti forniti dal chiamante vengono sostituiti, quindi plugin o
opzioni personalizzate del provider non possono falsificare l’ascendenza di traccia tra servizi.

Imposta `diagnostics.otel.captureContent.*` su `true` solo quando il tuo collector e
la policy di conservazione sono approvati per testo di prompt, risposta, strumento o prompt di sistema.
Ogni sottochiave è opt-in in modo indipendente:

- `inputMessages` - contenuto del prompt dell’utente.
- `outputMessages` - contenuto della risposta del modello.
- `toolInputs` - payload degli argomenti dello strumento.
- `toolOutputs` - payload dei risultati dello strumento.
- `systemPrompt` - prompt di sistema/sviluppatore assemblato.
- `toolDefinitions` - nomi, descrizioni e schemi degli strumenti del modello.

Quando una sottochiave è abilitata, gli span di modello e strumento ricevono attributi
`openclaw.content.*` limitati e redatti solo per quella classe. Usa il booleano
`captureContent: true` solo per catture diagnostiche ampie in cui anche i corpi dei messaggi di log OTLP
sono approvati per l’esportazione.

Il contenuto di `toolInputs`/`toolOutputs` viene catturato per le esecuzioni degli strumenti
del runtime agent integrato (`openclaw.content.tool_input` su span completati/con errore,
`openclaw.content.tool_output` su span completati). Le chiamate agli strumenti di harness esterni
(Codex, Claude CLI) emettono span `tool.execution.*` senza payload di contenuto.
Il contenuto catturato viaggia su un canale attendibile, solo per listener, e non viene mai inserito
nel bus pubblico degli eventi diagnostici.

## Campionamento e flush

- **Tracce:** `diagnostics.otel.sampleRate` (solo root-span, `0.0` scarta tutto,
  `1.0` mantiene tutto).

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando vengono adottate le convenzioni semantiche GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando vengono adottate le convenzioni semantiche GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` e `openclaw.failureKind` facoltativo in caso di errori
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (solo dimensioni sicure dei componenti, nessun testo del prompt)
  - `openclaw.model_call.usage.*` e `gen_ai.usage.*` quando il risultato della chiamata al modello contiene l’utilizzo del provider per quella singola chiamata
  - `openclaw.provider.request_id_hash` (hash limitato basato su SHA dell’id richiesta del provider upstream; gli id grezzi non vengono esportati)
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (nessun messaggio di loop, parametro o output dello strumento)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando l’acquisizione dei contenuti è abilitata esplicitamente, gli span di modello e strumento possono anche
includere attributi `openclaw.content.*` limitati e redatti per le specifiche
classi di contenuto che hai scelto.

## Catalogo degli eventi diagnostici

Gli eventi seguenti supportano le metriche e gli span sopra. I Plugin possono anche sottoscriverli
direttamente senza esportazione OTLP.

**Utilizzo del modello**

- `model.usage` - token, costo, durata, contesto, provider/modello/canale,
  id sessione. `usage` è la contabilizzazione provider/turno per costi e telemetria;
  `context.used` è lo snapshot corrente di prompt/contesto e può essere inferiore a
  `usage.total` del provider quando sono coinvolti input memorizzato nella cache o chiamate tool-loop.

**Flusso dei messaggi**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Coda e sessione**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (contatori aggregati: webhook/coda/sessione)

**Ciclo di vita dell’harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  ciclo di vita per esecuzione dell’harness dell’agente. Include `harnessId`, `pluginId`
  facoltativo, provider/modello/canale e id esecuzione. Il completamento aggiunge
  `durationMs`, `outcome`, `resultClassification` facoltativo, `yieldDetected`
  e conteggi `itemLifecycle`. Gli errori aggiungono `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` facoltativo.

**Exec**

- `exec.process.completed` - esito terminale, durata, destinazione, modalità, codice di uscita
  e tipo di errore. Il testo del comando e le directory di lavoro non sono
  inclusi.

## Senza un exporter

Puoi mantenere gli eventi diagnostici disponibili per Plugin o sink personalizzati senza
eseguire `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Per un output di debug mirato senza aumentare `logging.level`, usa i flag diagnostici.
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

L’output dei flag va nel file di log standard (`logging.file`) ed è comunque
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

- [Logging](/it/logging) - log su file, output console, tailing CLI e scheda Log della Control UI
- [Interni del logging Gateway](/it/gateway/logging) - stili log WS, prefissi sottosistema e acquisizione console
- [Flag diagnostici](/it/diagnostics/flags) - flag di log di debug mirati
- [Esportazione diagnostica](/it/gateway/diagnostics) - strumento support-bundle per operatori (separato dall’esportazione OTEL)
- [Riferimento configurazione](/it/gateway/configuration-reference#diagnostics) - riferimento completo dei campi `diagnostics.*`
