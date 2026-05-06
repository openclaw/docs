---
read_when:
    - Stai creando un Plugin che richiede before_tool_call, before_agent_reply, hook per i messaggi o hook del ciclo di vita
    - Devi bloccare, riscrivere o richiedere l'approvazione per le chiamate agli strumenti da un Plugin
    - Stai decidendo tra hook interni e hook dei Plugin
summary: 'Hook dei Plugin: intercettano gli eventi del ciclo di vita di agenti, strumenti, messaggi, sessioni e Gateway'
title: Hook dei Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Gli hook dei plugin sono punti di estensione in-process per i plugin OpenClaw. Usali
quando un plugin deve ispezionare o modificare esecuzioni degli agenti, chiamate agli strumenti, flusso dei messaggi,
ciclo di vita delle sessioni, instradamento dei subagent, installazioni o avvio del Gateway.

Usa invece gli [hook interni](/it/automation/hooks) quando vuoi un piccolo
script `HOOK.md` installato dall'operatore per eventi di comando e Gateway come
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registra hook tipizzati dei plugin con `api.on(...)` dal punto di ingresso del tuo plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

I gestori degli hook vengono eseguiti in sequenza con `priority` decrescente. Gli hook con la stessa priorità
mantengono l'ordine di registrazione.

`api.on(name, handler, opts?)` accetta:

- `priority` - ordinamento dei gestori (i valori più alti vengono eseguiti per primi).
- `timeoutMs` - budget opzionale per singolo hook. Quando impostato, il runner degli hook interrompe quel
  gestore allo scadere del budget e continua con il successivo, invece di
  lasciare che configurazioni lente o lavoro di recupero consumino il timeout del modello
  configurato dal chiamante. Omettilo per usare il timeout predefinito di osservazione/decisione che il
  runner degli hook applica in modo generico.

Gli operatori possono anche impostare i budget degli hook senza modificare il codice del plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` sovrascrive `hooks.timeoutMs`, che sovrascrive il
valore `api.on(..., { timeoutMs })` definito dal plugin. Ogni valore configurato deve
essere un intero positivo non superiore a 600000 millisecondi. Preferisci override per singolo hook
per hook notoriamente lenti, così un plugin non riceve un budget più lungo
ovunque.

Ogni hook riceve `event.context.pluginConfig`, la configurazione risolta per il
plugin che ha registrato quel gestore. Usala per decisioni degli hook che richiedono
le opzioni correnti del plugin; OpenClaw la inietta per ogni gestore senza mutare
l'oggetto evento condiviso visto dagli altri plugin.

## Catalogo degli hook

Gli hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano un
risultato decisionale (bloccare, annullare, sovrascrivere o richiedere approvazione); tutti gli altri sono
solo di osservazione.

**Turno dell'agente**

- `before_model_resolve` - sovrascrive provider o modello prima del caricamento dei messaggi di sessione
- `agent_turn_prepare` - consuma le iniezioni di turno dei plugin in coda e aggiunge contesto nello stesso turno prima degli hook del prompt
- `before_prompt_build` - aggiunge contesto dinamico o testo del prompt di sistema prima della chiamata al modello
- `before_agent_start` - fase combinata solo per compatibilità; preferisci i due hook precedenti
- **`before_agent_run`** - ispeziona il prompt finale e i messaggi di sessione prima dell'invio al modello e può facoltativamente bloccare l'esecuzione
- **`before_agent_reply`** - interrompe il turno del modello con una risposta sintetica o silenzio
- **`before_agent_finalize`** - ispeziona la risposta finale naturale e richiede un ulteriore passaggio del modello
- `agent_end` - osserva messaggi finali, stato di successo e durata dell'esecuzione
- `heartbeat_prompt_contribution` - aggiunge contesto solo Heartbeat per monitor in background e plugin del ciclo di vita

**Osservazione della conversazione**

- `model_call_started` / `model_call_ended` - osservano metadati sanitizzati della chiamata provider/modello, tempistiche, esito e hash limitati degli ID richiesta senza contenuto di prompt o risposta
- `llm_input` - osserva l'input del provider (prompt di sistema, prompt, cronologia)
- `llm_output` - osserva l'output del provider

**Strumenti**

- **`before_tool_call`** - riscrive i parametri dello strumento, blocca l'esecuzione o richiede approvazione
- `after_tool_call` - osserva risultati dello strumento, errori e durata
- **`tool_result_persist`** - riscrive il messaggio dell'assistente prodotto da un risultato dello strumento
- **`before_message_write`** - ispeziona o blocca una scrittura di messaggio in corso (raro)

**Messaggi e consegna**

- **`inbound_claim`** - rivendica un messaggio in ingresso prima dell'instradamento all'agente (risposte sintetiche)
- `message_received` - osserva contenuto in ingresso, mittente, thread e metadati
- **`message_sending`** - riscrive contenuto in uscita o annulla la consegna
- `message_sent` - osserva successo o errore della consegna in uscita
- **`before_dispatch`** - ispeziona o riscrive una dispatch in uscita prima del passaggio al canale
- **`reply_dispatch`** - partecipa alla pipeline finale di dispatch della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` - tracciano i confini del ciclo di vita della sessione
- `before_compaction` / `after_compaction` - osservano o annotano cicli di Compaction
- `before_reset` - osserva eventi di reset della sessione (`/reset`, reset programmatici)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordinano l'instradamento dei subagent e la consegna del completamento

**Ciclo di vita**

- `gateway_start` / `gateway_stop` - avviano o arrestano servizi di proprietà del plugin con il Gateway
- `cron_changed` - osserva cambiamenti del ciclo di vita del cron di proprietà del gateway (aggiunto, aggiornato, rimosso, avviato, terminato, pianificato)
- **`before_install`** - ispeziona scansioni di installazione di skill o plugin e può facoltativamente bloccarle

## Policy delle chiamate agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- `event.runId` opzionale
- `event.toolCallId` opzionale
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (impostato sulle esecuzioni guidate da Cron) e `ctx.trace` diagnostico

Può restituire:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Regole:

- `block: true` è terminale e salta i gestori con priorità inferiore.
- `block: false` viene trattato come nessuna decisione.
- `params` riscrive i parametri dello strumento per l'esecuzione.
- `requireApproval` sospende l'esecuzione dell'agente e chiede all'utente tramite le approvazioni
  dei plugin. Il comando `/approve` può approvare sia exec sia approvazioni dei plugin.
- Un `block: true` con priorità inferiore può comunque bloccare dopo che un hook con priorità superiore
  ha richiesto approvazione.
- `onResolution` riceve la decisione di approvazione risolta - `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

I plugin inclusi che richiedono policy a livello host possono registrare policy degli strumenti attendibili
con `api.registerTrustedToolPolicy(...)`. Queste vengono eseguite prima dei normali
hook `before_tool_call` e prima delle decisioni dei plugin esterni. Usale solo
per gate considerati attendibili dall'host, come policy dello workspace, applicazione dei budget o
sicurezza dei workflow riservati. I plugin esterni devono usare i normali hook `before_tool_call`.

### Persistenza dei risultati degli strumenti

I risultati degli strumenti possono includere `details` strutturati per rendering UI, diagnostica,
instradamento dei media o metadati di proprietà del plugin. Tratta `details` come metadati di runtime,
non come contenuto del prompt:

- OpenClaw rimuove `toolResult.details` prima della riproduzione verso il provider e dell'input di Compaction,
  così i metadati non diventano contesto del modello.
- Le voci di sessione persistite conservano solo `details` limitati. I dettagli troppo grandi vengono
  sostituiti con un riepilogo compatto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` vengono eseguiti prima del limite finale
  di persistenza. Gli hook devono comunque mantenere piccoli i `details` restituiti ed evitare
  di inserire testo rilevante per il prompt solo in `details`; inserisci l'output dello strumento visibile al modello
  in `content`.

## Hook di prompt e modello

Usa gli hook specifici di fase per i nuovi plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati degli allegati.
  Restituisci `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: riceve il prompt corrente, i messaggi di sessione preparati
  e le iniezioni in coda exactly-once scaricate per questa sessione. Restituisci
  `prependContext` o `appendContext`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi di sessione.
  Restituisci `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: viene eseguito solo per turni Heartbeat e restituisce
  `prependContext` o `appendContext`. È pensato per monitor in background
  che devono riepilogare lo stato corrente senza modificare i turni avviati dall'utente.

`before_agent_start` resta disponibile per compatibilità. Preferisci gli hook espliciti qui sopra
così il tuo plugin non dipende da una fase combinata legacy.

`before_agent_run` viene eseguito dopo la costruzione del prompt e prima di qualunque input del modello,
inclusi il caricamento di immagini locali al prompt e l'osservazione `llm_input`. Riceve
l'input utente corrente come `prompt`, più la cronologia di sessione caricata in `messages`
e il prompt di sistema attivo. Restituisci `{ outcome: "block", reason, message? }`
per fermare l'esecuzione prima che il modello possa leggere il prompt. `reason` è interno;
`message` è la sostituzione visibile all'utente. Gli unici esiti supportati sono
`pass` e `block`; forme di decisione non supportate falliscono in modo chiuso.

Quando un'esecuzione viene bloccata, OpenClaw archivia solo il testo sostitutivo in
`message.content` più metadati di blocco non sensibili, come l'id del plugin bloccante
e il timestamp. Il testo utente originale non viene conservato nella trascrizione o nel contesto
futuro. Le ragioni interne del blocco sono trattate come sensibili ed escluse da
trascrizione, cronologia, broadcast, log e payload diagnostici. L'osservabilità
deve usare campi sanitizzati come id del bloccante, esito, timestamp o una categoria
sicura.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva. Lo stesso valore è disponibile anche in `ctx.runId`.
Le esecuzioni guidate da Cron espongono anche `ctx.jobId` (l'id del job Cron originario), così
gli hook dei plugin possono circoscrivere metriche, effetti collaterali o stato a uno specifico job
pianificato.

Per esecuzioni originate da canali, `ctx.messageProvider` è la superficie del provider, come
`discord` o `telegram`, mentre `ctx.channelId` è l'identificatore del target di conversazione
quando OpenClaw può derivarne uno dalla chiave di sessione o dai metadati di consegna.

`agent_end` è un hook di osservazione e viene eseguito fire-and-forget dopo il turno. Il
runner degli hook applica un timeout di 30 secondi, così un plugin bloccato o un endpoint
di embedding non può lasciare la promise dell'hook in sospeso per sempre. Un timeout viene registrato e
OpenClaw continua; non annulla il lavoro di rete di proprietà del plugin a meno che anche il
plugin usi il proprio segnale di interruzione.

Usa `model_call_started` e `model_call_ended` per telemetria delle chiamate al provider
che non deve ricevere prompt grezzi, cronologia, risposte, header, corpi delle richieste
o ID richiesta del provider. Questi hook includono metadati stabili come
`runId`, `callId`, `provider`, `model`, `api`/`transport` opzionali, `durationMs`/`outcome`
terminali e `upstreamRequestIdHash` quando OpenClaw può derivare un
hash limitato dell'ID richiesta del provider.

`before_agent_finalize` viene eseguito solo quando un harness sta per accettare una
risposta finale naturale dell'assistente. Non è il percorso di annullamento `/stop` e non
viene eseguito quando l'utente interrompe un turno. Restituisci `{ action: "revise", reason }` per chiedere
all'harness un ulteriore passaggio del modello prima della finalizzazione, `{ action:
"finalize", reason? }` per forzare la finalizzazione, oppure ometti un risultato per continuare.
Gli hook nativi Codex `Stop` vengono inoltrati in questo hook come decisioni
`before_agent_finalize` di OpenClaw.

Quando restituiscono `action: "revise"`, i plugin possono includere metadati `retry` per rendere
l'ulteriore passaggio del modello limitato e sicuro da riprodurre:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` viene aggiunto al motivo di revisione inviato all'harness.
`idempotencyKey` consente all'host di contare i tentativi per la stessa richiesta del plugin tra
decisioni di finalizzazione equivalenti, e `maxAttempts` limita il numero di passaggi aggiuntivi che
l'host consentirà prima di proseguire con la risposta finale naturale.

I plugin non inclusi nel bundle che richiedono hook di conversazione grezzi (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` o `before_agent_run`) devono impostare:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Gli hook che modificano il prompt e le iniezioni persistenti al turno successivo possono essere disabilitati per plugin
con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Estensioni di sessione e iniezioni al turno successivo

I plugin di workflow possono mantenere un piccolo stato di sessione compatibile con JSON tramite
`api.registerSessionExtension(...)` e aggiornarlo tramite il metodo Gateway
`sessions.pluginPatch`. Le righe di sessione proiettano lo stato dell'estensione registrata
tramite `pluginExtensions`, consentendo a Control UI e ad altri client di renderizzare
lo stato di proprietà del plugin senza conoscerne gli interni.

Usa `api.enqueueNextTurnInjection(...)` quando un plugin ha bisogno che un contesto persistente
raggiunga esattamente una volta il turno successivo del modello. OpenClaw svuota le iniezioni in coda prima
degli hook del prompt, elimina le iniezioni scadute e deduplica per `idempotencyKey`
per plugin. Questo è il punto di integrazione corretto per le riprese dopo approvazione, i riepiloghi delle policy,
i delta dei monitor in background e le continuazioni di comando che devono essere visibili al
modello al turno successivo ma non devono diventare testo permanente del prompt di sistema.

Le semantiche di pulizia fanno parte del contratto. Le callback di pulizia delle estensioni di sessione e
del ciclo di vita del runtime ricevono `reset`, `delete`, `disable` o
`restart`. L'host rimuove lo stato persistente dell'estensione di sessione del plugin proprietario
e le iniezioni al turno successivo in sospeso per reset/delete/disable; restart mantiene
lo stato di sessione persistente mentre le callback di pulizia consentono ai plugin di rilasciare job
dello scheduler, contesto di esecuzione e altre risorse fuori banda per la vecchia generazione
del runtime.

## Hook dei messaggi

Usa gli hook dei messaggi per il routing a livello di canale e la policy di consegna:

- `message_received`: osserva contenuto in ingresso, mittente, `threadId`, `messageId`,
  `senderId`, correlazione opzionale di esecuzione/sessione e metadati.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `message_sent`: osserva il successo o l'errore finale.

Per le risposte TTS solo audio, `content` può contenere la trascrizione parlata nascosta
anche quando il payload del canale non ha testo/didascalia visibile. La riscrittura di quel
`content` aggiorna solo la trascrizione visibile all'hook; non viene renderizzata come
didascalia multimediale.

I contesti degli hook dei messaggi espongono campi di correlazione stabili quando disponibili:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Preferisci
questi campi di prima classe prima di leggere i metadati legacy.

Preferisci i campi tipizzati `threadId` e `replyToId` prima di usare metadati
specifici del canale.

Regole decisionali:

- `message_sending` con `cancel: true` è terminale.
- `message_sending` con `cancel: false` viene trattato come nessuna decisione.
- Il `content` riscritto continua verso gli hook a priorità inferiore a meno che un hook successivo
  annulli la consegna.

## Hook di installazione

`before_install` viene eseguito dopo la scansione integrata per le installazioni di skill e plugin.
Restituisci risultati aggiuntivi o `{ block: true, blockReason }` per interrompere
l'installazione.

`block: true` è terminale. `block: false` viene trattato come nessuna decisione.

## Ciclo di vita del Gateway

Usa `gateway_start` per i servizi plugin che richiedono stato di proprietà del Gateway. Il
contesto espone `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per
ispezione e aggiornamenti di cron. Usa `gateway_stop` per ripulire risorse
a lunga esecuzione.

Non fare affidamento sull'hook interno `gateway:startup` per servizi runtime
di proprietà del plugin.

`cron_changed` viene emesso per eventi del ciclo di vita di cron di proprietà del gateway con un payload
evento tipizzato che copre i motivi `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. L'evento trasporta uno snapshot `PluginHookGatewayCronJob`
(inclusi `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presenti) più uno `PluginHookGatewayCronDeliveryStatus`
di `not-requested` | `delivered` | `not-delivered` | `unknown`. Gli eventi rimossi
trasportano comunque lo snapshot del job eliminato, così gli scheduler esterni possono
riconciliare lo stato. Usa `ctx.getCron?.()` e `ctx.config` dal contesto runtime
quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come
fonte autorevole per i controlli di scadenza e l'esecuzione.

## Deprecazioni imminenti

Alcune superfici adiacenti agli hook sono deprecate ma ancora supportate. Migra
prima della prossima major release:

- **Envelope dei canali in testo normale** nei gestori `inbound_claim` e `message_received`.
  Leggi `BodyForAgent` e i blocchi strutturati di contesto utente
  invece di analizzare il testo piatto dell'envelope. Vedi
  [Envelope dei canali in testo normale → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** rimane per compatibilità. I nuovi plugin devono usare
  `before_model_resolve` e `before_prompt_build` invece della fase combinata.
- **`onResolution` in `before_tool_call`** ora usa l'unione tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) invece di una `string` a formato libero.

Per l'elenco completo - registrazione delle capability di memoria, profilo di thinking del provider,
provider di autenticazione esterni, tipi di discovery dei provider, accessori del runtime dei task
e la ridenominazione `command-auth` → `command-status` - vedi
[Migrazione Plugin SDK → Deprecazioni attive](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Migrazione Plugin SDK](/it/plugins/sdk-migration) - deprecazioni attive e tempistica di rimozione
- [Creazione di plugin](/it/plugins/building-plugins)
- [Panoramica Plugin SDK](/it/plugins/sdk-overview)
- [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Interni dell'architettura dei plugin](/it/plugins/architecture-internals)
