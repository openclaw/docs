---
read_when:
    - Stai creando un Plugin che necessita di before_tool_call, before_agent_reply, hook dei messaggi o hook del ciclo di vita
    - Devi bloccare, riscrivere o richiedere l'approvazione per le chiamate agli strumenti da un Plugin
    - Stai decidendo tra hook interni e hook del Plugin
summary: 'Hook dei Plugin: intercettano gli eventi del ciclo di vita di agenti, strumenti, messaggi, sessioni e Gateway'
title: Agganci dei Plugin
x-i18n:
    generated_at: "2026-04-30T09:03:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Gli hook dei plugin sono punti di estensione in-process per i plugin OpenClaw. Usali
quando un plugin deve ispezionare o modificare esecuzioni degli agenti, chiamate agli strumenti, flusso dei messaggi,
ciclo di vita della sessione, routing dei subagenti, installazioni o avvio del Gateway.

Usa invece gli [hook interni](/it/automation/hooks) quando vuoi un piccolo
script `HOOK.md` installato dall'operatore per eventi di comando e Gateway come
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registra hook di plugin tipizzati con `api.on(...)` dal punto di ingresso del tuo plugin:

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

I gestori degli hook vengono eseguiti in sequenza in ordine decrescente di `priority`. Gli hook con la stessa priorità
mantengono l'ordine di registrazione.

`api.on(name, handler, opts?)` accetta:

- `priority` — ordinamento dei gestori (i valori più alti vengono eseguiti per primi).
- `timeoutMs` — budget opzionale per singolo hook. Quando impostato, l'esecutore degli hook interrompe
  quel gestore dopo la scadenza del budget e continua con il successivo, invece di
  lasciare che setup lenti o lavoro di richiamo consumino il timeout del modello
  configurato dal chiamante. Omettilo per usare il timeout predefinito di osservazione/decisione che
  l'esecutore degli hook applica in modo generico.

Ogni hook riceve `event.context.pluginConfig`, la configurazione risolta per il
plugin che ha registrato quel gestore. Usala per decisioni degli hook che richiedono
le opzioni correnti del plugin; OpenClaw la inietta per gestore senza mutare
l'oggetto evento condiviso visto dagli altri plugin.

## Catalogo degli hook

Gli hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano un
risultato di decisione (blocco, annullamento, override o richiesta di approvazione); tutti gli altri sono
solo di osservazione.

**Turno dell'agente**

- `before_model_resolve` — sovrascrive provider o modello prima del caricamento dei messaggi della sessione
- `agent_turn_prepare` — consuma le iniezioni di turno del plugin in coda e aggiunge contesto nello stesso turno prima degli hook del prompt
- `before_prompt_build` — aggiunge contesto dinamico o testo del prompt di sistema prima della chiamata al modello
- `before_agent_start` — fase combinata solo per compatibilità; preferisci i due hook sopra
- **`before_agent_reply`** — interrompe il turno del modello con una risposta sintetica o silenzio
- **`before_agent_finalize`** — ispeziona la risposta finale naturale e richiede un ulteriore passaggio del modello
- `agent_end` — osserva messaggi finali, stato di successo e durata dell'esecuzione
- `heartbeat_prompt_contribution` — aggiunge contesto solo per Heartbeat per monitor in background e plugin del ciclo di vita

**Osservazione della conversazione**

- `model_call_started` / `model_call_ended` — osserva metadati sanificati della chiamata provider/modello, tempistiche, esito e hash limitati dell'ID richiesta senza contenuto di prompt o risposta
- `llm_input` — osserva l'input del provider (prompt di sistema, prompt, cronologia)
- `llm_output` — osserva l'output del provider

**Strumenti**

- **`before_tool_call`** — riscrive i parametri dello strumento, blocca l'esecuzione o richiede approvazione
- `after_tool_call` — osserva risultati dello strumento, errori e durata
- **`tool_result_persist`** — riscrive il messaggio dell'assistente prodotto da un risultato dello strumento
- **`before_message_write`** — ispeziona o blocca una scrittura di messaggio in corso (raro)

**Messaggi e consegna**

- **`inbound_claim`** — rivendica un messaggio in ingresso prima del routing dell'agente (risposte sintetiche)
- `message_received` — osserva contenuto in ingresso, mittente, thread e metadati
- **`message_sending`** — riscrive contenuto in uscita o annulla la consegna
- `message_sent` — osserva successo o errore della consegna in uscita
- **`before_dispatch`** — ispeziona o riscrive una dispatch in uscita prima del passaggio al canale
- **`reply_dispatch`** — partecipa alla pipeline finale di dispatch della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` — traccia i confini del ciclo di vita della sessione
- `before_compaction` / `after_compaction` — osserva o annota i cicli di Compaction
- `before_reset` — osserva eventi di reimpostazione della sessione (`/reset`, reimpostazioni programmatiche)

**Subagenti**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordina routing dei subagenti e consegna del completamento

**Ciclo di vita**

- `gateway_start` / `gateway_stop` — avvia o arresta servizi di proprietà del plugin con il Gateway
- `cron_changed` — osserva cambiamenti del ciclo di vita del Cron di proprietà del gateway (aggiunto, aggiornato, rimosso, avviato, terminato, pianificato)
- **`before_install`** — ispeziona scansioni di installazione di skill o plugin e facoltativamente blocca

## Criterio per le chiamate agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- `event.runId` opzionale
- `event.toolCallId` opzionale
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (impostato nelle esecuzioni guidate da cron) e `ctx.trace` diagnostico

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
- `block: false` viene trattato come assenza di decisione.
- `params` riscrive i parametri dello strumento per l'esecuzione.
- `requireApproval` mette in pausa l'esecuzione dell'agente e chiede all'utente tramite le
  approvazioni del plugin. Il comando `/approve` può approvare sia approvazioni exec sia approvazioni plugin.
- Un `block: true` con priorità inferiore può comunque bloccare dopo che un hook con priorità superiore
  ha richiesto approvazione.
- `onResolution` riceve la decisione di approvazione risolta — `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

I plugin inclusi che necessitano di criteri a livello host possono registrare criteri di strumenti attendibili
con `api.registerTrustedToolPolicy(...)`. Questi vengono eseguiti prima dei normali hook
`before_tool_call` e prima delle decisioni dei plugin esterni. Usali solo
per gate considerati attendibili dall'host come criteri dell'area di lavoro, applicazione del budget o
sicurezza dei workflow riservati. I plugin esterni devono usare i normali hook `before_tool_call`.

### Persistenza dei risultati degli strumenti

I risultati degli strumenti possono includere `details` strutturati per rendering dell'interfaccia utente, diagnostica,
routing dei media o metadati di proprietà del plugin. Tratta `details` come metadati runtime,
non come contenuto del prompt:

- OpenClaw rimuove `toolResult.details` prima della riproduzione verso il provider e dall'input di Compaction
  così che i metadati non diventino contesto del modello.
- Le voci di sessione persistite mantengono solo `details` limitati. I dettagli troppo grandi vengono
  sostituiti con un riepilogo compatto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` vengono eseguiti prima del limite finale
  di persistenza. Gli hook devono comunque mantenere piccoli i `details` restituiti ed evitare
  di inserire testo rilevante per il prompt solo in `details`; inserisci l'output dello strumento visibile al modello
  in `content`.

## Hook di prompt e modello

Usa gli hook specifici di fase per i nuovi plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati degli allegati.
  Restituisce `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: riceve il prompt corrente, i messaggi di sessione preparati
  e qualsiasi iniezione in coda esattamente una volta svuotata per questa sessione. Restituisce
  `prependContext` o `appendContext`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi di sessione.
  Restituisce `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: viene eseguito solo per i turni Heartbeat e restituisce
  `prependContext` o `appendContext`. È pensato per monitor in background
  che devono riepilogare lo stato corrente senza modificare i turni avviati dall'utente.

`before_agent_start` resta disponibile per compatibilità. Preferisci gli hook espliciti sopra
così il tuo plugin non dipende da una fase combinata legacy.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva. Lo stesso valore è disponibile anche su `ctx.runId`.
Le esecuzioni guidate da Cron espongono anche `ctx.jobId` (l'id del job cron di origine) così
gli hook dei plugin possono circoscrivere metriche, effetti collaterali o stato a uno specifico job
pianificato.

`agent_end` è un hook di osservazione e viene eseguito fire-and-forget dopo il turno. L'esecutore degli
hook applica un timeout di 30 secondi così un plugin o un endpoint di embedding bloccato
non può lasciare la promessa dell'hook in sospeso per sempre. Un timeout viene registrato nei log e
OpenClaw continua; non annulla il lavoro di rete di proprietà del plugin a meno che il
plugin usi anche il proprio segnale di interruzione.

Usa `model_call_started` e `model_call_ended` per la telemetria delle chiamate al provider
che non deve ricevere prompt grezzi, cronologia, risposte, header, corpi delle richieste
o ID richiesta del provider. Questi hook includono metadati stabili come
`runId`, `callId`, `provider`, `model`, `api`/`transport` opzionali,
`durationMs`/`outcome` terminali e `upstreamRequestIdHash` quando OpenClaw può derivare un
hash limitato dell'ID richiesta del provider.

`before_agent_finalize` viene eseguito solo quando un harness sta per accettare una risposta finale
naturale dell'assistente. Non è il percorso di annullamento `/stop` e non viene
eseguito quando l'utente interrompe un turno. Restituisci `{ action: "revise", reason }` per chiedere
all'harness un ulteriore passaggio del modello prima della finalizzazione, `{ action:
"finalize", reason? }` per forzare la finalizzazione, oppure ometti un risultato per continuare.
Gli hook nativi `Stop` di Codex vengono inoltrati in questo hook come decisioni
`before_agent_finalize` di OpenClaw.

I plugin non inclusi che necessitano di `llm_input`, `llm_output`,
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

### Estensioni di sessione e iniezioni al turno successivo

I plugin di workflow possono persistere un piccolo stato di sessione compatibile con JSON con
`api.registerSessionExtension(...)` e aggiornarlo tramite il metodo Gateway
`sessions.pluginPatch`. Le righe di sessione proiettano lo stato dell'estensione registrata
tramite `pluginExtensions`, consentendo alla Control UI e ad altri client di renderizzare
lo stato di proprietà del plugin senza conoscere i dettagli interni del plugin.

Usa `api.enqueueNextTurnInjection(...)` quando un plugin ha bisogno che un contesto durevole
raggiunga il turno successivo del modello esattamente una volta. OpenClaw svuota le iniezioni in coda prima
degli hook del prompt, elimina le iniezioni scadute e deduplica per `idempotencyKey`
per plugin. Questa è la giusta superficie per riprese dopo approvazione, riepiloghi dei criteri,
delta dei monitor in background e continuazioni di comando che devono essere visibili al
modello nel turno successivo ma non devono diventare testo permanente del prompt di sistema.

Le semantiche di pulizia fanno parte del contratto. La pulizia delle estensioni di sessione e
le callback di pulizia del ciclo di vita runtime ricevono `reset`, `delete`, `disable` o
`restart`. L'host rimuove lo stato persistente dell'estensione di sessione del plugin proprietario
e le iniezioni in sospeso per il turno successivo in caso di reset/delete/disable; restart mantiene
lo stato durevole della sessione mentre le callback di pulizia consentono ai plugin di rilasciare job dello scheduler,
contesto di esecuzione e altre risorse fuori banda della vecchia generazione runtime.

## Hook dei messaggi

Usa gli hook dei messaggi per routing a livello di canale e criteri di consegna:

- `message_received`: osserva contenuto in ingresso, mittente, `threadId`, `messageId`,
  `senderId`, correlazione opzionale di esecuzione/sessione e metadati.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `message_sent`: osserva successo o errore finale.

Per le risposte TTS solo audio, `content` può contenere la trascrizione parlata nascosta anche quando il payload del canale non ha testo/didascalia visibile. Riscrivere quel `content` aggiorna solo la trascrizione visibile all'hook; non viene renderizzata come didascalia multimediale.

I contesti degli hook dei messaggi espongono campi di correlazione stabili quando disponibili: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Preferisci questi campi di prima classe prima di leggere i metadati legacy.

Preferisci i campi tipizzati `threadId` e `replyToId` prima di usare metadati specifici del canale.

Regole decisionali:

- `message_sending` con `cancel: true` è terminale.
- `message_sending` con `cancel: false` viene trattato come nessuna decisione.
- Il `content` riscritto continua verso gli hook a priorità inferiore, a meno che un hook successivo annulli la consegna.

## Installare gli hook

`before_install` viene eseguito dopo la scansione integrata per le installazioni di skill e plugin. Restituisci risultati aggiuntivi o `{ block: true, blockReason }` per interrompere l'installazione.

`block: true` è terminale. `block: false` viene trattato come nessuna decisione.

## Ciclo di vita del Gateway

Usa `gateway_start` per i servizi plugin che richiedono stato di proprietà del Gateway. Il contesto espone `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per l'ispezione e gli aggiornamenti di cron. Usa `gateway_stop` per ripulire le risorse di lunga durata.

Non fare affidamento sull'hook interno `gateway:startup` per i servizi runtime di proprietà del plugin.

`cron_changed` si attiva per gli eventi del ciclo di vita cron di proprietà del gateway con un payload evento tipizzato che copre i motivi `added`, `updated`, `removed`, `started`, `finished` e `scheduled`. L'evento trasporta uno snapshot `PluginHookGatewayCronJob` (inclusi `state.nextRunAtMs`, `state.lastRunStatus` e `state.lastError` quando presenti) più un `PluginHookGatewayCronDeliveryStatus` di `not-requested` | `delivered` | `not-delivered` | `unknown`. Gli eventi rimossi trasportano comunque lo snapshot del job eliminato, così gli scheduler esterni possono riconciliare lo stato. Usa `ctx.getCron?.()` e `ctx.config` dal contesto runtime quando sincronizzi scheduler di risveglio esterni e mantieni OpenClaw come fonte di verità per i controlli di scadenza e l'esecuzione.

## Deprecazioni imminenti

Alcune superfici adiacenti agli hook sono deprecate ma ancora supportate. Migra prima della prossima major release:

- **Envelope di canale in testo normale** nei gestori `inbound_claim` e `message_received`. Leggi `BodyForAgent` e i blocchi strutturati di contesto utente invece di analizzare testo envelope piatto. Vedi [Envelope di canale in testo normale → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** rimane per compatibilità. I nuovi plugin dovrebbero usare `before_model_resolve` e `before_prompt_build` invece della fase combinata.
- **`onResolution` in `before_tool_call`** ora usa l'unione tipizzata `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`) invece di una `string` in formato libero.

Per l'elenco completo — registrazione delle capacità di memoria, profilo di pensiero del provider, provider di autenticazione esterni, tipi di discovery dei provider, accessor runtime dei task e la rinomina `command-auth` → `command-status` — vedi [Migrazione del Plugin SDK → Deprecazioni attive](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Migrazione del Plugin SDK](/it/plugins/sdk-migration) — deprecazioni attive e tempistica di rimozione
- [Creare plugin](/it/plugins/building-plugins)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
- [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Interni dell'architettura dei plugin](/it/plugins/architecture-internals)
