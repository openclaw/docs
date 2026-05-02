---
read_when:
    - Stai sviluppando un Plugin che richiede before_tool_call, before_agent_reply, hook dei messaggi o hook del ciclo di vita
    - Devi bloccare, riscrivere o richiedere l'approvazione per le chiamate agli strumenti da un Plugin
    - Stai scegliendo tra hook interni e hook di Plugin
summary: 'Hook dei Plugin: intercettano gli eventi del ciclo di vita di agente, strumento, messaggio, sessione e Gateway'
title: Hook dei Plugin
x-i18n:
    generated_at: "2026-05-02T08:30:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Gli hook dei Plugin sono punti di estensione in-process per i Plugin di OpenClaw. Usali
quando un Plugin deve ispezionare o modificare esecuzioni dell'agente, chiamate a strumenti, flusso dei messaggi,
ciclo di vita della sessione, routing dei subagenti, installazioni o avvio del Gateway.

Usa invece gli [hook interni](/it/automation/hooks) quando vuoi un piccolo
script `HOOK.md` installato dall'operatore per eventi di comando e del Gateway come
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registra hook di Plugin tipizzati con `api.on(...)` dall'entry del Plugin:

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
- `timeoutMs` — budget opzionale per hook. Quando è impostato, il runner degli hook interrompe quel
  gestore allo scadere del budget e continua con quello successivo, invece di
  lasciare che configurazione lenta o lavoro di richiamo consumino il timeout del modello configurato dal chiamante.
  Omettilo per usare il timeout predefinito di osservazione/decisione che il
  runner degli hook applica genericamente.

Ogni hook riceve `event.context.pluginConfig`, la configurazione risolta per il
Plugin che ha registrato quel gestore. Usala per le decisioni degli hook che richiedono
le opzioni correnti del Plugin; OpenClaw la inietta per ciascun gestore senza modificare
l'oggetto evento condiviso visto dagli altri Plugin.

## Catalogo degli hook

Gli hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano un
risultato decisionale (bloccare, annullare, sostituire o richiedere approvazione); tutti gli altri sono
solo di osservazione.

**Turno dell'agente**

- `before_model_resolve` — sostituisce provider o modello prima del caricamento dei messaggi della sessione
- `agent_turn_prepare` — consuma le iniezioni di turno del Plugin accodate e aggiunge contesto nello stesso turno prima degli hook del prompt
- `before_prompt_build` — aggiunge contesto dinamico o testo del prompt di sistema prima della chiamata al modello
- `before_agent_start` — fase combinata solo per compatibilità; preferisci i due hook precedenti
- **`before_agent_reply`** — interrompe il turno del modello con una risposta sintetica o silenzio
- **`before_agent_finalize`** — ispeziona la risposta finale naturale e richiede un ulteriore passaggio del modello
- `agent_end` — osserva messaggi finali, stato di successo e durata dell'esecuzione
- `heartbeat_prompt_contribution` — aggiunge contesto solo Heartbeat per monitor in background e Plugin del ciclo di vita

**Osservazione della conversazione**

- `model_call_started` / `model_call_ended` — osserva metadati sanitizzati di chiamata provider/modello, tempi, esito e hash limitati degli ID richiesta senza contenuto di prompt o risposta
- `llm_input` — osserva l'input del provider (prompt di sistema, prompt, cronologia)
- `llm_output` — osserva l'output del provider

**Strumenti**

- **`before_tool_call`** — riscrive parametri dello strumento, blocca l'esecuzione o richiede approvazione
- `after_tool_call` — osserva risultati dello strumento, errori e durata
- **`tool_result_persist`** — riscrive il messaggio dell'assistente prodotto da un risultato dello strumento
- **`before_message_write`** — ispeziona o blocca la scrittura di un messaggio in corso (raro)

**Messaggi e consegna**

- **`inbound_claim`** — rivendica un messaggio in ingresso prima del routing dell'agente (risposte sintetiche)
- `message_received` — osserva contenuto in ingresso, mittente, thread e metadati
- **`message_sending`** — riscrive il contenuto in uscita o annulla la consegna
- `message_sent` — osserva successo o errore della consegna in uscita
- **`before_dispatch`** — ispeziona o riscrive un invio in uscita prima del passaggio al canale
- **`reply_dispatch`** — partecipa alla pipeline finale di invio della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` — traccia i confini del ciclo di vita della sessione
- `before_compaction` / `after_compaction` — osserva o annota cicli di Compaction
- `before_reset` — osserva eventi di reset della sessione (`/reset`, reset programmatici)

**Subagenti**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordina routing dei subagenti e consegna del completamento

**Ciclo di vita**

- `gateway_start` / `gateway_stop` — avvia o arresta servizi di proprietà del Plugin con il Gateway
- `cron_changed` — osserva modifiche del ciclo di vita del Cron gestito dal Gateway (aggiunto, aggiornato, rimosso, avviato, completato, pianificato)
- **`before_install`** — ispeziona scansioni di installazione di Skill o Plugin e facoltativamente le blocca

## Policy delle chiamate agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- `event.runId` opzionale
- `event.toolCallId` opzionale
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (impostato nelle esecuzioni guidate da Cron) e `ctx.trace` diagnostico

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
- `requireApproval` mette in pausa l'esecuzione dell'agente e chiede all'utente tramite le approvazioni dei Plugin.
  Il comando `/approve` può approvare sia approvazioni exec sia approvazioni dei Plugin.
- Un `block: true` con priorità inferiore può comunque bloccare dopo che un hook con priorità superiore
  ha richiesto l'approvazione.
- `onResolution` riceve la decisione di approvazione risolta: `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

I Plugin inclusi che richiedono policy a livello host possono registrare policy degli strumenti attendibili
con `api.registerTrustedToolPolicy(...)`. Queste vengono eseguite prima dei normali
hook `before_tool_call` e prima delle decisioni dei Plugin esterni. Usale solo
per controlli considerati attendibili dall'host, come policy dell'area di lavoro, applicazione del budget o
sicurezza di workflow riservati. I Plugin esterni devono usare i normali hook `before_tool_call`.

### Persistenza dei risultati degli strumenti

I risultati degli strumenti possono includere `details` strutturati per rendering dell'interfaccia utente, diagnostica,
routing dei media o metadati di proprietà del Plugin. Tratta `details` come metadati di runtime,
non come contenuto del prompt:

- OpenClaw rimuove `toolResult.details` prima del replay del provider e dell'input di Compaction,
  così i metadati non diventano contesto del modello.
- Le voci di sessione persistite conservano solo `details` limitati. I details sovradimensionati vengono
  sostituiti con un riepilogo compatto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` vengono eseguiti prima del limite finale
  di persistenza. Gli hook dovrebbero comunque mantenere piccoli i `details` restituiti ed evitare
  di inserire testo rilevante per il prompt solo in `details`; inserisci l'output dello strumento visibile al modello
  in `content`.

## Hook di prompt e modello

Usa gli hook specifici di fase per i nuovi Plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati degli allegati.
  Restituisci `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: riceve il prompt corrente, i messaggi di sessione preparati
  e tutte le iniezioni accodate esattamente una volta svuotate per questa sessione. Restituisci
  `prependContext` o `appendContext`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi di sessione.
  Restituisci `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: viene eseguito solo per i turni Heartbeat e restituisce
  `prependContext` o `appendContext`. È pensato per monitor in background
  che devono riepilogare lo stato corrente senza modificare i turni avviati dall'utente.

`before_agent_start` resta disponibile per compatibilità. Preferisci gli hook espliciti sopra
così il tuo Plugin non dipende da una fase combinata legacy.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva. Lo stesso valore è disponibile anche in `ctx.runId`.
Le esecuzioni guidate da Cron espongono anche `ctx.jobId` (l'ID del job Cron di origine) così
gli hook dei Plugin possono circoscrivere metriche, effetti collaterali o stato a uno specifico job
pianificato.

Per esecuzioni originate da canali, `ctx.messageProvider` è la superficie del provider come
`discord` o `telegram`, mentre `ctx.channelId` è l'identificatore della destinazione di conversazione
quando OpenClaw può derivarne uno dalla chiave di sessione o dai metadati di consegna.

`agent_end` è un hook di osservazione e viene eseguito fire-and-forget dopo il turno. Il
runner degli hook applica un timeout di 30 secondi così un Plugin bloccato o un endpoint
di embedding non può lasciare la promise dell'hook in sospeso per sempre. Un timeout viene registrato e
OpenClaw continua; non annulla il lavoro di rete di proprietà del Plugin a meno che
anche il Plugin usi un proprio segnale di abort.

Usa `model_call_started` e `model_call_ended` per la telemetria delle chiamate al provider
che non deve ricevere prompt grezzi, cronologia, risposte, header, corpi delle richieste
o ID richiesta del provider. Questi hook includono metadati stabili come
`runId`, `callId`, `provider`, `model`, `api`/`transport` opzionali,
`durationMs`/`outcome` terminali e `upstreamRequestIdHash` quando OpenClaw può derivare un
hash limitato dell'ID richiesta del provider.

`before_agent_finalize` viene eseguito solo quando un harness sta per accettare una risposta finale
naturale dell'assistente. Non è il percorso di annullamento `/stop` e non viene eseguito
quando l'utente interrompe un turno. Restituisci `{ action: "revise", reason }` per chiedere
all'harness un ulteriore passaggio del modello prima della finalizzazione, `{ action:
"finalize", reason? }` per forzare la finalizzazione, oppure ometti un risultato per continuare.
Gli hook `Stop` nativi di Codex vengono inoltrati in questo hook come decisioni
`before_agent_finalize` di OpenClaw.

I Plugin non inclusi che richiedono `llm_input`, `llm_output`,
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

Gli hook che modificano il prompt e le iniezioni durevoli del turno successivo possono essere disabilitati per Plugin
con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Estensioni di sessione e iniezioni del turno successivo

I Plugin di workflow possono persistere piccoli stati di sessione compatibili con JSON con
`api.registerSessionExtension(...)` e aggiornarli tramite il metodo Gateway
`sessions.pluginPatch`. Le righe di sessione proiettano lo stato delle estensioni registrate
tramite `pluginExtensions`, consentendo a Control UI e altri client di renderizzare
lo stato di proprietà del Plugin senza conoscere gli interni del Plugin.

Usa `api.enqueueNextTurnInjection(...)` quando un Plugin richiede contesto durevole da
fornire al turno successivo del modello esattamente una volta. OpenClaw svuota le iniezioni accodate prima
degli hook del prompt, scarta le iniezioni scadute e deduplica in base a `idempotencyKey`
per Plugin. Questa è la superficie corretta per riprese di approvazioni, riepiloghi di policy,
delta di monitor in background e continuazioni di comandi che devono essere visibili al
modello nel turno successivo ma non devono diventare testo permanente del prompt di sistema.

Le semantiche di cleanup fanno parte del contratto. Il cleanup delle estensioni di sessione e
i callback di cleanup del ciclo di vita del runtime ricevono `reset`, `delete`, `disable` o
`restart`. L'host rimuove lo stato persistente dell'estensione di sessione del Plugin proprietario
e le iniezioni del turno successivo in sospeso per reset/delete/disable; restart conserva
lo stato durevole della sessione mentre i callback di cleanup consentono ai Plugin di rilasciare job dello scheduler,
contesto di esecuzione e altre risorse out-of-band per la vecchia generazione del runtime.

## Hook dei messaggi

Usa gli hook dei messaggi per routing a livello di canale e policy di consegna:

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
- Il `content` riscritto continua verso gli hook a priorità inferiore, a meno che un hook successivo
  annulli la consegna.

## Hook di installazione

`before_install` viene eseguito dopo la scansione integrata per installazioni di skill e plugin.
Restituisci risultati aggiuntivi o `{ block: true, blockReason }` per interrompere
l'installazione.

`block: true` è terminale. `block: false` viene trattato come nessuna decisione.

## Ciclo di vita del Gateway

Usa `gateway_start` per i servizi plugin che richiedono stato di proprietà del Gateway. Il
contesto espone `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per
ispezione e aggiornamenti cron. Usa `gateway_stop` per pulire risorse
a lunga esecuzione.

Non fare affidamento sull'hook interno `gateway:startup` per i servizi runtime
di proprietà del plugin.

`cron_changed` viene emesso per eventi del ciclo di vita cron di proprietà del gateway con un payload
evento tipizzato che copre i motivi `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. L'evento trasporta uno snapshot `PluginHookGatewayCronJob`
(inclusi `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presenti) più un `PluginHookGatewayCronDeliveryStatus`
di `not-requested` | `delivered` | `not-delivered` | `unknown`. Gli eventi rimossi
trasportano comunque lo snapshot del job eliminato, così gli scheduler esterni possono
riconciliare lo stato. Usa `ctx.getCron?.()` e `ctx.config` dal contesto
runtime quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come
fonte di verità per controlli di scadenza ed esecuzione.

## Deprecazioni future

Alcune superfici adiacenti agli hook sono deprecate ma ancora supportate. Esegui la migrazione
prima della prossima release principale:

- **Envelope di canale in testo normale** negli handler `inbound_claim` e `message_received`.
  Leggi `BodyForAgent` e i blocchi strutturati di contesto utente
  invece di analizzare testo envelope piatto. Vedi
  [Envelope di canale in testo normale → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** rimane per compatibilità. I nuovi plugin dovrebbero usare
  `before_model_resolve` e `before_prompt_build` invece della fase
  combinata.
- **`onResolution` in `before_tool_call`** ora usa l'unione tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) invece di una `string` in formato libero.

Per l'elenco completo — registrazione delle capability di memoria, profilo thinking del provider,
provider di autenticazione esterni, tipi di discovery del provider, accessor runtime
dei task e la rinomina `command-auth` → `command-status` — vedi
[Migrazione Plugin SDK → Deprecazioni attive](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Migrazione Plugin SDK](/it/plugins/sdk-migration) — deprecazioni attive e timeline di rimozione
- [Creazione di plugin](/it/plugins/building-plugins)
- [Panoramica di Plugin SDK](/it/plugins/sdk-overview)
- [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Interni dell'architettura Plugin](/it/plugins/architecture-internals)
