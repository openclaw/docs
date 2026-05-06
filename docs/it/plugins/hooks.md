---
read_when:
    - Stai creando un Plugin che richiede before_tool_call, before_agent_reply, hook dei messaggi o hook del ciclo di vita
    - Devi bloccare, riscrivere o richiedere l'approvazione per le chiamate agli strumenti da parte di un Plugin
    - Stai decidendo tra hook interni e hook dei plugin
summary: 'Hook dei Plugin: intercettare gli eventi del ciclo di vita di agenti, strumenti, messaggi, sessioni e Gateway'
title: Agganci dei Plugin
x-i18n:
    generated_at: "2026-05-06T09:01:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Gli hook dei plugin sono punti di estensione in-process per i plugin OpenClaw. Usali
quando un plugin deve ispezionare o modificare esecuzioni degli agenti, chiamate agli strumenti, flusso dei messaggi,
ciclo di vita delle sessioni, instradamento dei subagenti, installazioni o avvio del Gateway.

Usa invece gli [hook interni](/it/automation/hooks) quando vuoi un piccolo
script `HOOK.md` installato dall'operatore per eventi di comando e del Gateway come
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registra hook di plugin tipizzati con `api.on(...)` dall'entry del tuo plugin:

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

I gestori degli hook vengono eseguiti in sequenza in ordine decrescente di `priority`. Gli hook
con la stessa priorità mantengono l'ordine di registrazione.

`api.on(name, handler, opts?)` accetta:

- `priority` - ordinamento del gestore (i valori più alti vengono eseguiti prima).
- `timeoutMs` - budget opzionale per singolo hook. Quando è impostato, il runner degli hook interrompe quel
  gestore dopo la scadenza del budget e continua con il successivo, invece di
  lasciare che una configurazione lenta o un lavoro di richiamo consumino il timeout del modello
  configurato dal chiamante. Omettilo per usare il timeout predefinito di osservazione/decisione che il
  runner degli hook applica in modo generico.

Gli operatori possono anche impostare budget per gli hook senza modificare il codice del plugin:

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
per hook notoriamente lenti, così un plugin non ottiene ovunque un budget più lungo.

Ogni hook riceve `event.context.pluginConfig`, la configurazione risolta per il
plugin che ha registrato quel gestore. Usala per decisioni degli hook che richiedono
le opzioni correnti del plugin; OpenClaw la inietta per gestore senza mutare l'oggetto
evento condiviso visto da altri plugin.

## Catalogo degli hook

Gli hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano un
risultato decisionale (blocco, annullamento, override o richiesta di approvazione); tutti gli altri sono
solo di osservazione.

**Turno dell'agente**

- `before_model_resolve` - sovrascrive provider o modello prima del caricamento dei messaggi della sessione
- `agent_turn_prepare` - consuma le iniezioni di turno del plugin in coda e aggiunge contesto nello stesso turno prima degli hook del prompt
- `before_prompt_build` - aggiunge contesto dinamico o testo del prompt di sistema prima della chiamata al modello
- `before_agent_start` - fase combinata solo per compatibilità; preferisci i due hook sopra
- **`before_agent_reply`** - interrompe anticipatamente il turno del modello con una risposta sintetica o silenzio
- **`before_agent_finalize`** - ispeziona la risposta finale naturale e richiede un altro passaggio del modello
- `agent_end` - osserva messaggi finali, stato di successo e durata dell'esecuzione
- `heartbeat_prompt_contribution` - aggiunge contesto solo Heartbeat per plugin di monitoraggio in background e ciclo di vita

**Osservazione della conversazione**

- `model_call_started` / `model_call_ended` - osserva metadati sanitizzati della chiamata provider/modello, tempistiche, esito e hash limitati degli ID richiesta senza contenuto di prompt o risposta
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
- **`message_sending`** - riscrive il contenuto in uscita o annulla la consegna
- `message_sent` - osserva il successo o il fallimento della consegna in uscita
- **`before_dispatch`** - ispeziona o riscrive un dispatch in uscita prima del passaggio al canale
- **`reply_dispatch`** - partecipa alla pipeline finale di dispatch della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` - traccia i confini del ciclo di vita della sessione
- `before_compaction` / `after_compaction` - osserva o annota cicli di Compaction
- `before_reset` - osserva eventi di reimpostazione della sessione (`/reset`, reimpostazioni programmatiche)

**Subagenti**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordina l'instradamento dei subagenti e la consegna del completamento

**Ciclo di vita**

- `gateway_start` / `gateway_stop` - avvia o arresta servizi di proprietà del plugin con il Gateway
- `cron_changed` - osserva modifiche al ciclo di vita del Cron di proprietà del Gateway (aggiunto, aggiornato, rimosso, avviato, terminato, pianificato)
- **`before_install`** - ispeziona scansioni di installazione di skill o plugin e facoltativamente blocca

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
- `requireApproval` mette in pausa l'esecuzione dell'agente e chiede all'utente tramite le approvazioni
  dei plugin. Il comando `/approve` può approvare sia approvazioni exec sia approvazioni dei plugin.
- Un `block: true` con priorità inferiore può comunque bloccare dopo che un hook con priorità superiore
  ha richiesto l'approvazione.
- `onResolution` riceve la decisione di approvazione risolta - `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

I plugin inclusi che richiedono policy a livello host possono registrare policy degli strumenti attendibili
con `api.registerTrustedToolPolicy(...)`. Queste vengono eseguite prima dei normali hook
`before_tool_call` e prima delle decisioni dei plugin esterni. Usale solo
per gate attendibili dall'host, come policy dello spazio di lavoro, applicazione del budget o
sicurezza dei workflow riservati. I plugin esterni dovrebbero usare i normali hook `before_tool_call`.

### Persistenza dei risultati degli strumenti

I risultati degli strumenti possono includere `details` strutturati per rendering UI, diagnostica,
instradamento dei media o metadati di proprietà del plugin. Tratta `details` come metadati di runtime,
non come contenuto del prompt:

- OpenClaw rimuove `toolResult.details` prima della riproduzione verso il provider e dell'input di Compaction,
  così i metadati non diventano contesto del modello.
- Le voci di sessione persistite mantengono solo `details` limitati. I dettagli sovradimensionati vengono
  sostituiti con un riepilogo compatto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` vengono eseguiti prima del limite finale di
  persistenza. Gli hook dovrebbero comunque mantenere piccoli i `details` restituiti ed evitare
  di inserire testo rilevante per il prompt solo in `details`; inserisci l'output dello strumento visibile al modello
  in `content`.

## Hook di prompt e modello

Usa gli hook specifici per fase per i nuovi plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati degli allegati.
  Restituisci `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: riceve il prompt corrente, i messaggi di sessione preparati
  e tutte le iniezioni in coda exactly-once scaricate per questa sessione. Restituisci
  `prependContext` o `appendContext`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi di sessione.
  Restituisci `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: viene eseguito solo per turni Heartbeat e restituisce
  `prependContext` o `appendContext`. È pensato per monitor in background
  che devono riepilogare lo stato corrente senza modificare turni avviati dall'utente.

`before_agent_start` rimane per compatibilità. Preferisci gli hook espliciti sopra
così il tuo plugin non dipende da una fase combinata legacy.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva. Lo stesso valore è disponibile anche su `ctx.runId`.
Le esecuzioni guidate da Cron espongono anche `ctx.jobId` (l'ID del job Cron originario), così
gli hook dei plugin possono limitare metriche, effetti collaterali o stato a un job pianificato
specifico.

Per le esecuzioni originate da canali, `ctx.messageProvider` è la superficie del provider come
`discord` o `telegram`, mentre `ctx.channelId` è l'identificatore della destinazione di conversazione
quando OpenClaw riesce a derivarne uno dalla chiave di sessione o dai metadati di consegna.

`agent_end` è un hook di osservazione e viene eseguito in modalità fire-and-forget dopo il turno. Il
runner degli hook applica un timeout di 30 secondi, così un plugin bloccato o un endpoint
di embedding non può lasciare la promise dell'hook in sospeso per sempre. Un timeout viene registrato e
OpenClaw continua; non annulla il lavoro di rete di proprietà del plugin a meno che anche il
plugin usi il proprio segnale di interruzione.

Usa `model_call_started` e `model_call_ended` per telemetria delle chiamate al provider
che non dovrebbe ricevere prompt grezzi, cronologia, risposte, header, corpi di richiesta
o ID richiesta del provider. Questi hook includono metadati stabili come
`runId`, `callId`, `provider`, `model`, `api`/`transport` opzionali, `durationMs`/`outcome`
terminali e `upstreamRequestIdHash` quando OpenClaw può derivare un hash limitato dell'ID
richiesta del provider.

`before_agent_finalize` viene eseguito solo quando un harness sta per accettare una
risposta finale naturale dell'assistente. Non è il percorso di annullamento `/stop` e non
viene eseguito quando l'utente interrompe un turno. Restituisci `{ action: "revise", reason }` per chiedere
all'harness un altro passaggio del modello prima della finalizzazione, `{ action:
"finalize", reason? }` per forzare la finalizzazione oppure ometti il risultato per continuare.
Gli hook nativi Codex `Stop` vengono inoltrati in questo hook come decisioni OpenClaw
`before_agent_finalize`.

Quando restituiscono `action: "revise"`, i plugin possono includere metadati `retry` per rendere
il passaggio extra del modello limitato e sicuro da riprodurre:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` viene aggiunta al motivo di revisione inviato all'harness.
`idempotencyKey` consente all'host di contare i retry per la stessa richiesta del plugin tra
decisioni di finalizzazione equivalenti, e `maxAttempts` limita quanti passaggi extra l'
host consentirà prima di continuare con la risposta finale naturale.

I plugin non inclusi che richiedono `llm_input`, `llm_output`,
`before_agent_finalize` o `agent_end` devono impostare:

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

Gli hook che mutano il prompt e le iniezioni durevoli per il turno successivo possono essere disabilitati per plugin
con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Estensioni di sessione e iniezioni per il turno successivo

I Plugin di workflow possono persistere un piccolo stato di sessione compatibile con JSON con
`api.registerSessionExtension(...)` e aggiornarlo tramite il metodo
`sessions.pluginPatch` del Gateway. Le righe di sessione proiettano lo stato delle estensioni registrate
tramite `pluginExtensions`, permettendo alla Control UI e ad altri client di renderizzare
lo stato di proprietà del Plugin senza conoscere gli interni del Plugin.

Usa `api.enqueueNextTurnInjection(...)` quando un Plugin ha bisogno che un contesto durevole
raggiunga il turno successivo del modello esattamente una volta. OpenClaw svuota le iniezioni in coda prima
degli hook dei prompt, scarta le iniezioni scadute e deduplica in base a `idempotencyKey`
per Plugin. Questo è il punto di integrazione corretto per riprese di approvazione, riepiloghi di policy,
delta dei monitor in background e continuazioni di comandi che devono essere visibili al
modello nel turno successivo ma non devono diventare testo permanente del prompt di sistema.

Le semantiche di cleanup fanno parte del contratto. Il cleanup delle estensioni di sessione e
le callback di cleanup del ciclo di vita del runtime ricevono `reset`, `delete`, `disable` o
`restart`. L'host rimuove lo stato persistente dell'estensione di sessione
del Plugin proprietario e le iniezioni di turno successivo in sospeso per reset/delete/disable; restart mantiene
lo stato di sessione durevole mentre le callback di cleanup permettono ai Plugin di rilasciare job dello scheduler,
contesto di esecuzione e altre risorse fuori banda per la vecchia generazione del runtime.

## Hook dei messaggi

Usa gli hook dei messaggi per routing a livello di canale e policy di consegna:

- `message_received`: osserva contenuto in ingresso, mittente, `threadId`, `messageId`,
  `senderId`, correlazione opzionale di esecuzione/sessione e metadati.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `message_sent`: osserva successo o errore finale.

Per risposte TTS solo audio, `content` può contenere la trascrizione parlata nascosta
anche quando il payload del canale non ha testo/didascalia visibile. Riscrivere quel
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
- `message_sending` con `cancel: false` è trattato come nessuna decisione.
- Il `content` riscritto continua verso gli hook a priorità inferiore, a meno che un hook successivo
  non annulli la consegna.

## Hook di installazione

`before_install` viene eseguito dopo la scansione integrata per installazioni di skill e Plugin.
Restituisci risultati aggiuntivi o `{ block: true, blockReason }` per interrompere
l'installazione.

`block: true` è terminale. `block: false` è trattato come nessuna decisione.

## Ciclo di vita del Gateway

Usa `gateway_start` per servizi Plugin che richiedono stato di proprietà del Gateway. Il
contesto espone `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per
ispezione e aggiornamenti cron. Usa `gateway_stop` per ripulire risorse
a lunga esecuzione.

Non fare affidamento sull'hook interno `gateway:startup` per servizi runtime
di proprietà del Plugin.

`cron_changed` viene attivato per eventi del ciclo di vita cron di proprietà del gateway con un payload
evento tipizzato che copre i motivi `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. L'evento trasporta uno snapshot `PluginHookGatewayCronJob`
(inclusi `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presenti) più un `PluginHookGatewayCronDeliveryStatus`
di `not-requested` | `delivered` | `not-delivered` | `unknown`. Gli eventi rimossi
trasportano comunque lo snapshot del job eliminato, così gli scheduler esterni possono
riconciliare lo stato. Usa `ctx.getCron?.()` e `ctx.config` dal contesto runtime
quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come
fonte di verità per controlli di scadenza ed esecuzione.

## Deprecazioni imminenti

Alcune superfici adiacenti agli hook sono deprecate ma ancora supportate. Migra
prima della prossima major release:

- **Envelope di canale in testo semplice** nei gestori `inbound_claim` e `message_received`.
  Leggi `BodyForAgent` e i blocchi strutturati di contesto utente
  invece di analizzare testo envelope piatto. Vedi
  [Envelope di canale in testo semplice → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** rimane per compatibilità. I nuovi Plugin dovrebbero usare
  `before_model_resolve` e `before_prompt_build` invece della fase
  combinata.
- **`onResolution` in `before_tool_call`** ora usa la union tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) invece di una `string` libera.

Per l'elenco completo - registrazione delle capability di memoria, profilo di thinking
del provider, provider di autenticazione esterni, tipi di discovery dei provider, accessor del runtime
dei task e la rinomina `command-auth` → `command-status` - vedi
[Migrazione del Plugin SDK → Deprecazioni attive](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Migrazione del Plugin SDK](/it/plugins/sdk-migration) - deprecazioni attive e tempistica di rimozione
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
- [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Interni dell'architettura dei Plugin](/it/plugins/architecture-internals)
