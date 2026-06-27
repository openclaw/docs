---
read_when:
    - Stai creando un plugin che necessita di before_tool_call, before_agent_reply, hook dei messaggi o hook del ciclo di vita
    - Devi bloccare, riscrivere o richiedere l'approvazione per le chiamate agli strumenti da un Plugin
    - Stai scegliendo tra hook interni e hook dei plugin
summary: 'Plugin hooks: intercettano gli eventi del ciclo di vita di agente, strumento, messaggio, sessione e Gateway'
title: Hook dei Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Gli hook dei plugin sono punti di estensione in-process per i plugin OpenClaw. Usali
quando un plugin deve ispezionare o modificare esecuzioni degli agenti, chiamate agli strumenti, flusso dei messaggi,
ciclo di vita delle sessioni, routing dei sottoagenti, installazioni o avvio del Gateway.

Usa invece gli [hook interni](/it/automation/hooks) quando vuoi un piccolo
script `HOOK.md` installato dall'operatore per eventi di comando e del Gateway come
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registra hook di plugin tipizzati con `api.on(...)` dall'entrypoint del tuo plugin:

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

- `priority` - ordinamento del gestore (i valori più alti vengono eseguiti per primi).
- `timeoutMs` - budget opzionale per singolo hook. Quando è impostato, il runner degli hook interrompe quel
  gestore dopo la scadenza del budget e continua con quello successivo, invece di
  lasciare che attività lente di setup o recall consumino il timeout del modello
  configurato dal chiamante. Omettilo per usare il timeout predefinito di osservazione/decisione che il
  runner degli hook applica genericamente.

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
valore `api.on(..., { timeoutMs })` definito dall'autore del plugin. Ogni valore configurato deve
essere un intero positivo non maggiore di 600000 millisecondi. Preferisci
override per singolo hook per hook notoriamente lenti, così un plugin non ottiene un budget più lungo
ovunque.

Ogni hook riceve `event.context.pluginConfig`, la configurazione risolta per il
plugin che ha registrato quel gestore. Usala per decisioni degli hook che richiedono
opzioni correnti del plugin; OpenClaw la inietta per ogni gestore senza mutare
l'oggetto evento condiviso visto dagli altri plugin.

## Catalogo degli hook

Gli hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano un
risultato decisionale (bloccare, annullare, sovrascrivere o richiedere approvazione); tutti gli altri sono
solo di osservazione.

**Turno dell'agente**

- `before_model_resolve` - sovrascrive provider o modello prima del caricamento dei messaggi della sessione
- `agent_turn_prepare` - consuma iniezioni di turno dei plugin in coda e aggiunge contesto nello stesso turno prima degli hook del prompt
- `before_prompt_build` - aggiunge contesto dinamico o testo del prompt di sistema prima della chiamata al modello
- `before_agent_start` - fase combinata solo per compatibilità; preferisci i due hook sopra
- **`before_agent_run`** - ispeziona il prompt finale e i messaggi della sessione prima dell'invio al modello e, facoltativamente, blocca l'esecuzione
- **`before_agent_reply`** - interrompe il turno del modello con una risposta sintetica o silenzio
- **`before_agent_finalize`** - ispeziona la risposta finale naturale e richiede un altro passaggio del modello
- `agent_end` - osserva messaggi finali, stato di successo e durata dell'esecuzione
- `heartbeat_prompt_contribution` - aggiunge contesto solo per heartbeat per monitor in background e plugin del ciclo di vita

**Osservazione della conversazione**

- `model_call_started` / `model_call_ended` - osserva metadati sanificati delle chiamate provider/modello, tempistiche, esito e hash limitati degli ID richiesta senza contenuto di prompt o risposta
- `llm_input` - osserva l'input del provider (prompt di sistema, prompt, cronologia)
- `llm_output` - osserva output del provider, utilizzo e il `contextTokenBudget` risolto quando disponibile

**Strumenti**

- **`before_tool_call`** - riscrive i parametri dello strumento, blocca l'esecuzione o richiede approvazione
- `after_tool_call` - osserva risultati, errori e durata dello strumento
- `resolve_exec_env` - contribuisce variabili d'ambiente di proprietà del plugin a `exec`
- **`tool_result_persist`** - riscrive il messaggio dell'assistente prodotto da un risultato dello strumento
- **`before_message_write`** - ispeziona o blocca una scrittura di messaggio in corso (raro)

**Messaggi e consegna**

- **`inbound_claim`** - rivendica un messaggio in ingresso prima del routing dell'agente (risposte sintetiche)
- `message_received` — osserva contenuto in ingresso, mittente, thread e metadati
- **`message_sending`** — riscrive il contenuto in uscita o annulla la consegna
- **`reply_payload_sending`** — muta o annulla payload di risposta normalizzati prima della consegna
- `message_sent` — osserva successo o errore della consegna in uscita
- **`before_dispatch`** - ispeziona o riscrive un dispatch in uscita prima del passaggio al canale
- **`reply_dispatch`** - partecipa alla pipeline finale di dispatch della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` - traccia i confini del ciclo di vita della sessione. Il `reason` dell'evento è uno tra `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` o `unknown`. I valori `shutdown` e `restart` vengono emessi dal finalizzatore di arresto del Gateway quando il processo viene fermato o riavviato mentre le sessioni sono ancora attive, così i plugin a valle (come archivi di memoria o trascrizioni) possono finalizzare righe fantasma che altrimenti resterebbero in stato aperto tra i riavvii. Il finalizzatore è limitato, quindi un plugin lento non può bloccare SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - osserva o annota cicli di Compaction
- `before_reset` - osserva eventi di reset della sessione (`/reset`, reset programmatici)

**Sottoagenti**

- `subagent_spawned` / `subagent_ended` - osserva avvio e completamento del sottoagente.
- `subagent_delivery_target` - hook di compatibilità per la consegna del completamento quando nessun binding di sessione core può proiettare una route.
- `subagent_spawning` - hook di compatibilità deprecato. Il core ora prepara binding dei sottoagenti `thread: true` tramite adattatori di binding delle sessioni di canale prima che `subagent_spawned` venga emesso.
- `subagent_spawned` include `resolvedModel` e `resolvedProvider` quando OpenClaw ha risolto il modello nativo della sessione figlia prima dell'avvio.
- `subagent_ended` trasporta `targetSessionKey` (identità — corrisponde a `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` o `"acp"`), `reason`, `outcome` opzionale (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` o `"deleted"`), `error` opzionale, `runId`, `endedAt`, `accountId` e `sendFarewell`. **Non** include `agentId` o `childSessionKey`; usa `targetSessionKey` per correlare l'evento `subagent_spawned` corrispondente.

**Ciclo di vita**

- `gateway_start` / `gateway_stop` - avvia o arresta servizi di proprietà del plugin con il Gateway
- `deactivate` - alias di compatibilità deprecato per `gateway_stop`; usa `gateway_stop` nei nuovi plugin
- `cron_changed` - osserva modifiche del ciclo di vita cron di proprietà del gateway (aggiunto, aggiornato, rimosso, avviato, completato, pianificato)
- **`before_install`** - ispeziona materiale di installazione di skill o plugin in staging da un runtime
  di plugin caricato

## Debug degli hook di runtime

Usa `before_model_resolve` quando un plugin deve cambiare provider o modello
per un turno dell'agente. Viene eseguito prima della risoluzione del modello; `llm_output` viene eseguito solo dopo
che un tentativo del modello produce output dell'assistente.

Per provare il modello effettivo della sessione, ispeziona le registrazioni di runtime, quindi
usa `openclaw sessions` o le superfici sessione/stato del Gateway. Quando esegui il debug
dei payload del provider, avvia il Gateway con `--raw-stream` e
`--raw-stream-path <path>`; questi flag scrivono gli eventi raw dello stream del modello in un file jsonl.

## Policy delle chiamate agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- `event.toolKind` e `event.toolInputKind` opzionali, discriminatori
  autorevoli dell'host per strumenti che condividono intenzionalmente nomi; per esempio, le chiamate `exec`
  esterne in code-mode usano `toolKind: "code_mode_exec"` e
  includono `toolInputKind: "javascript" | "typescript"` quando il linguaggio di input
  è noto
- `event.derivedPaths` opzionale, contenente suggerimenti best-effort di percorsi target derivati dall'host
  per envelope di strumenti ben noti come `apply_patch`; quando presenti,
  questi percorsi possono essere incompleti o sovrastimare ciò che lo strumento
  toccherà effettivamente (per esempio con input malformati o parziali)
- `event.runId` opzionale
- `event.toolCallId` opzionale
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (impostato sulle esecuzioni guidate da cron), `ctx.toolKind`,
  `ctx.toolInputKind` e `ctx.trace` diagnostico

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Comportamento delle guardie degli hook per hook del ciclo di vita tipizzati:

- `block: true` è terminale e salta i gestori a priorità inferiore.
- `block: false` viene trattato come nessuna decisione.
- `params` riscrive i parametri dello strumento per l'esecuzione.
- `requireApproval` mette in pausa l'esecuzione dell'agente e chiede all'utente tramite approvazioni
  del plugin. Il comando `/approve` può approvare sia approvazioni exec sia approvazioni dei plugin.
  Nei relay nativi `PreToolUse` in modalità report dell'app-server Codex, questo viene differito
  alla richiesta di approvazione app-server corrispondente; vedi [runtime dell'harness Codex](/it/plugins/codex-harness-runtime#hook-boundaries).
- Un `block: true` a priorità inferiore può comunque bloccare dopo che un hook a priorità superiore
  ha richiesto approvazione.
- `onResolution` riceve la decisione di approvazione risolta - `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

Vedi [richieste di permessi dei plugin](/it/plugins/plugin-permission-requests) per
routing delle approvazioni, comportamento delle decisioni e quando usare `requireApproval` invece
di strumenti opzionali o approvazioni exec.

I plugin che necessitano di policy a livello host possono registrare policy degli strumenti attendibili con
`api.registerTrustedToolPolicy(...)`. Queste vengono eseguite prima dei normali hook
`before_tool_call` e prima delle normali decisioni degli hook. Le policy attendibili in bundle
vengono eseguite per prime; le policy attendibili dei plugin installati vengono eseguite dopo, nell'ordine di caricamento dei plugin;
i normali hook `before_tool_call` vengono eseguiti dopo di esse. I plugin in bundle mantengono
il percorso di trusted-policy esistente. I plugin installati devono essere abilitati esplicitamente
e dichiarare ogni ID di policy in `contracts.trustedToolPolicies`; gli ID non dichiarati
vengono rifiutati prima della registrazione. Gli ID di policy hanno scope sul plugin
che li registra, quindi plugin diversi possono riusare lo stesso ID locale. Usa questo livello solo
per gate considerati attendibili dall'host, come policy dell'area di lavoro, applicazione dei budget o
sicurezza di workflow riservati.

### Hook dell'ambiente exec

`resolve_exec_env` consente ai plugin di contribuire variabili d'ambiente alle invocazioni dello strumento
`exec` dopo che l'ambiente exec di base è stato costruito e prima che il
comando venga eseguito. Riceve:

- `event.sessionKey`
- `event.toolName`, attualmente sempre `"exec"`
- `event.host`, uno tra `"gateway"`, `"sandbox"` o `"node"`
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` e `ctx.channelId`

Restituisci un `Record<string, string>` da unire nell'ambiente exec. I gestori
vengono eseguiti in ordine di priorità, e i risultati degli hook successivi sovrascrivono quelli precedenti per
la stessa chiave.

L'output degli hook viene filtrato attraverso la policy delle chiavi dell'ambiente exec dell'host prima di essere unito. Le chiavi non valide, `PATH` e le chiavi pericolose di override dell'host come `LD_*`, `DYLD_*`, `NODE_OPTIONS`, le variabili proxy e le variabili di override TLS vengono scartate. L'env del plugin filtrato viene incluso nei metadati di approvazione/audit del Gateway e inoltrato alle richieste di esecuzione node-host.

### Persistenza dei risultati degli strumenti

I risultati degli strumenti possono includere `details` strutturati per il rendering dell'UI, la diagnostica, il routing dei media o metadati di proprietà del plugin. Tratta `details` come metadati di runtime, non come contenuto del prompt:

- OpenClaw rimuove `toolResult.details` prima della riproduzione del provider e dell'input di Compaction, in modo che i metadati non diventino contesto del modello.
- Le voci di sessione persistite conservano solo `details` limitati. I dettagli troppo grandi vengono sostituiti con un riepilogo compatto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` vengono eseguiti prima del limite finale di persistenza. Gli hook dovrebbero comunque mantenere piccoli i `details` restituiti ed evitare di inserire testo rilevante per il prompt solo in `details`; metti l'output dello strumento visibile al modello in `content`.

## Hook di prompt e modello

Usa gli hook specifici della fase per i nuovi plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati degli allegati. Restituisce `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: riceve il prompt corrente, i messaggi di sessione preparati e qualsiasi injection accodata exactly-once scaricata per questa sessione. Restituisce `prependContext` o `appendContext`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi di sessione. Restituisce `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: viene eseguito solo per i turni Heartbeat e restituisce `prependContext` o `appendContext`. È pensato per monitor in background che devono riepilogare lo stato corrente senza modificare i turni avviati dall'utente.

`before_agent_start` rimane per compatibilità. Preferisci gli hook espliciti sopra, così il tuo plugin non dipende da una fase combinata legacy.

`before_agent_run` viene eseguito dopo la costruzione del prompt e prima di qualsiasi input del modello, incluso il caricamento di immagini locali al prompt e l'osservazione `llm_input`. Riceve l'input utente corrente come `prompt`, più la cronologia di sessione caricata in `messages` e il prompt di sistema attivo. Restituisci `{ outcome: "block", reason, message? }` per interrompere l'esecuzione prima che il modello possa leggere il prompt. `reason` è interno; `message` è la sostituzione visibile all'utente. Gli unici esiti supportati sono `pass` e `block`; forme di decisione non supportate falliscono in modo chiuso.

Quando un'esecuzione viene bloccata, OpenClaw archivia solo il testo sostitutivo in `message.content` più metadati di blocco non sensibili, come l'id del plugin bloccante e il timestamp. Il testo utente originale non viene conservato nella trascrizione o nel contesto futuro. Le ragioni interne del blocco sono trattate come sensibili ed escluse da trascrizione, cronologia, broadcast, log e payload diagnostici. L'osservabilità dovrebbe usare campi sanificati come id del bloccatore, esito, timestamp o una categoria sicura.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può identificare l'esecuzione attiva. Lo stesso valore è disponibile anche su `ctx.runId`. Le esecuzioni guidate da Cron espongono anche `ctx.jobId` (l'id del job Cron di origine), così gli hook del plugin possono limitare metriche, effetti collaterali o stato a uno specifico job pianificato.

Per le esecuzioni originate da un canale, `ctx.channel` e `ctx.messageProvider` identificano la superficie del provider, come `discord` o `telegram`, mentre `ctx.channelId` è l'identificatore della destinazione della conversazione quando OpenClaw può derivarne uno dalla chiave di sessione o dai metadati di consegna.

Quando l'identità del mittente è disponibile, i contesti degli hook dell'agente includono anche:

- `ctx.senderId` — ID mittente con ambito canale (ad es. Feishu `open_id`, ID utente Discord). Popolato quando l'esecuzione origina da un messaggio utente con metadati mittente noti.
- `ctx.chatId` — identificatore di conversazione nativo del trasporto (ad es. Feishu `chat_id`, Telegram `chat_id`). Popolato quando il canale di origine fornisce un ID conversazione nativo.
- `ctx.channelContext.sender.id` — lo stesso ID mittente di `ctx.senderId`, sotto un oggetto di proprietà del canale che i plugin possono estendere con campi specifici del canale.
- `ctx.channelContext.chat.id` — lo stesso ID conversazione di `ctx.chatId`, sotto un oggetto di proprietà del canale che i plugin possono estendere con campi specifici del canale.

Core definisce solo i campi `id` annidati. I plugin di canale che passano metadati mittente o chat più ricchi tramite l'helper inbound possono estendere `PluginHookChannelSenderContext` o `PluginHookChannelChatContext` da `openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

I plugin di canale passano questi campi tramite l'helper SDK inbound:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Questi campi sono opzionali e assenti per le esecuzioni originate dal sistema (Heartbeat, Cron, exec-event).

`ctx.senderExternalId` rimane come campo deprecato di compatibilità sorgente per plugin più vecchi. Core non lo popola; le nuove identità mittente specifiche del canale dovrebbero vivere sotto `ctx.channelContext.sender` tramite augmentazione del modulo.

`agent_end` è un hook di osservazione. I percorsi Gateway e harness persistenti lo eseguono fire-and-forget dopo il turno, mentre i percorsi CLI one-shot di breve durata attendono la promise dell'hook prima della pulizia del processo, così i plugin attendibili possono svuotare l'osservabilità terminale o catturare lo stato. Il runner degli hook applica un timeout di 30 secondi, così un plugin bloccato o un endpoint incorporato non può lasciare la promise dell'hook in sospeso per sempre. Un timeout viene registrato e OpenClaw continua; non annulla il lavoro di rete di proprietà del plugin a meno che anche il plugin usi il proprio segnale di abort.

Usa `model_call_started` e `model_call_ended` per la telemetria delle chiamate al provider che non dovrebbe ricevere prompt raw, cronologia, risposte, header, corpi delle richieste o ID richiesta del provider. Questi hook includono metadati stabili come `runId`, `callId`, `provider`, `model`, `api`/`transport` opzionali, `durationMs`/`outcome` terminali e `upstreamRequestIdHash` quando OpenClaw può derivare un hash limitato dell'ID richiesta del provider. Quando il runtime ha risolto i metadati della finestra di contesto, anche l'evento e il contesto dell'hook includono `contextTokenBudget`, il budget effettivo di token dopo i limiti di modello/config/agente, più `contextWindowSource` e `contextWindowReferenceTokens` quando è stato applicato un limite inferiore.

`before_agent_finalize` viene eseguito solo quando un harness sta per accettare una risposta finale naturale dell'assistente. Non è il percorso di annullamento `/stop` e non viene eseguito quando l'utente interrompe un turno. Restituisci `{ action: "revise", reason }` per chiedere all'harness un ulteriore passaggio del modello prima della finalizzazione, `{ action: "finalize", reason? }` per forzare la finalizzazione, oppure ometti un risultato per continuare. Gli hook nativi Codex `Stop` vengono inoltrati in questo hook come decisioni OpenClaw `before_agent_finalize`.

Quando restituiscono `action: "revise"`, i plugin possono includere metadati `retry` per rendere il passaggio extra del modello limitato e sicuro da riprodurre:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` viene aggiunta alla ragione di revisione inviata all'harness. `idempotencyKey` consente all'host di contare i retry per la stessa richiesta del plugin tra decisioni di finalizzazione equivalenti, e `maxAttempts` limita quanti passaggi extra l'host permetterà prima di continuare con la risposta finale naturale.

I plugin non bundled che necessitano di hook di conversazione raw (`before_model_resolve`, `before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`, `agent_end` o `before_agent_run`) devono impostare:

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

Gli hook che modificano il prompt e le injection durevoli per il turno successivo possono essere disabilitati per plugin con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Estensioni di sessione e injection per il turno successivo

I plugin di workflow possono persistere un piccolo stato di sessione compatibile con JSON con `api.registerSessionExtension(...)` e aggiornarlo tramite il metodo Gateway `sessions.pluginPatch`. Le righe di sessione proiettano lo stato dell'estensione registrata tramite `pluginExtensions`, consentendo a Control UI e ad altri client di renderizzare lo stato di proprietà del plugin senza conoscere gli internals del plugin.

Usa `api.enqueueNextTurnInjection(...)` quando un plugin ha bisogno che un contesto durevole raggiunga il prossimo turno del modello exactly once. OpenClaw scarica le injection accodate prima degli hook del prompt, scarta le injection scadute e deduplica per `idempotencyKey` per plugin. Questo è il punto di integrazione corretto per riprese di approvazione, riepiloghi di policy, delta dei monitor in background e continuazioni dei comandi che dovrebbero essere visibili al modello nel turno successivo ma non dovrebbero diventare testo permanente del prompt di sistema.

Le semantiche di pulizia fanno parte del contratto. La pulizia delle estensioni di sessione e le callback di pulizia del ciclo di vita del runtime ricevono `reset`, `delete`, `disable` o `restart`. L'host rimuove lo stato persistente dell'estensione di sessione del plugin proprietario e le injection in sospeso per il turno successivo in caso di reset/delete/disable; restart mantiene lo stato di sessione durevole mentre le callback di pulizia permettono ai plugin di rilasciare job dello scheduler, contesto di esecuzione e altre risorse out-of-band per la vecchia generazione del runtime.

## Hook dei messaggi

Usa gli hook dei messaggi per routing a livello di canale e policy di consegna:

- `message_received`: osserva contenuto inbound, mittente, `threadId`, `messageId`, `senderId`, correlazione opzionale run/session e metadati.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `reply_payload_sending`: riscrive oggetti `ReplyPayload` normalizzati (inclusi `presentation`, `delivery`, riferimenti media e testo) o restituisce `{ cancel: true }`.
- `message_sent`: osserva il successo o il fallimento finale.

Per risposte TTS solo audio, `content` può contenere la trascrizione parlata nascosta anche quando il payload del canale non ha testo/didascalia visibile. Riscrivere quel `content` aggiorna solo la trascrizione visibile all'hook; non viene renderizzata come didascalia media.

Gli eventi `reply_payload_sending` possono includere `usageState`, uno snapshot live best-effort per turno di modello/uso/contesto. La consegna durevole, la riproduzione recuperata e le risposte senza correlazione esatta con l'esecuzione lo omettono.

I contesti degli hook dei messaggi espongono campi di correlazione stabili quando disponibili: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. I contesti inbound e `before_dispatch` espongono anche metadati di risposta quando il canale ha dati del messaggio citato filtrati per visibilità: `replyToId`, `replyToIdFull`, `replyToBody`, `replyToSender` e `replyToIsQuote`. Preferisci questi campi first-class prima di leggere metadati legacy.

Preferisci i campi tipizzati `threadId` e `replyToId` prima di usare metadati specifici del canale.

Regole decisionali:

- `message_sending` con `cancel: true` è terminale.
- `message_sending` con `cancel: false` viene trattato come nessuna decisione.
- Il `content` riscritto continua verso gli hook a priorità inferiore, a meno che un hook successivo
  annulli la consegna.
- `reply_payload_sending` viene eseguito dopo la normalizzazione del payload e prima della consegna
  al canale, incluse le risposte reindirizzate al canale di origine. Gli handler
  vengono eseguiti in sequenza e ogni handler vede il payload più recente prodotto dagli
  handler a priorità più alta.
- I payload di `reply_payload_sending` non espongono marker di attendibilità del runtime come
  `trustedLocalMedia`; i plugin possono modificare la forma del payload ma non possono concedere
  attendibilità ai media locali.
- `message_sending` può restituire `cancelReason` e `metadata` limitati con un
  annullamento. Le nuove API del ciclo di vita dei messaggi espongono questo come esito di consegna soppressa
  con motivo `cancelled_by_message_sending_hook`; la consegna diretta legacy
  continua a restituire un array di risultati vuoto per compatibilità.
- `message_sent` è solo di osservazione. Gli errori degli handler vengono registrati nei log e non
  modificano il risultato della consegna.

## Hook di installazione

Usa `security.installPolicy` per le decisioni allow/block di proprietà dell'operatore. Quella
policy viene eseguita dalla configurazione di OpenClaw, copre i percorsi di installazione e aggiornamento
della CLI e va in fail-closed quando è abilitata ma non disponibile.

`before_install` è un hook del ciclo di vita del runtime dei plugin. Viene eseguito dopo
`security.installPolicy` solo nel processo OpenClaw in cui gli hook dei plugin sono
già stati caricati, come nei flussi di installazione supportati dal Gateway. È utile per
osservazioni, avvisi e controlli di compatibilità di proprietà dei plugin, ma non è il
confine principale di sicurezza enterprise o host per le installazioni. Il campo `builtinScan`
rimane nel payload dell'evento per compatibilità, ma OpenClaw non esegue più
il blocco integrato del codice pericoloso in fase di installazione, quindi è un risultato `ok`
vuoto. Restituisci findings aggiuntivi o `{ block: true, blockReason }` per interrompere
l'installazione in quel processo.

`block: true` è terminale. `block: false` viene trattato come nessuna decisione.
Gli errori degli handler bloccano l'installazione in fail-closed.

## Ciclo di vita del Gateway

Usa `gateway_start` per i servizi dei plugin che richiedono stato di proprietà del Gateway. Il
contesto espone `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per
ispezione e aggiornamenti dei cron. Usa `gateway_stop` per ripulire risorse
a esecuzione prolungata.

Non fare affidamento sull'hook interno `gateway:startup` per i servizi runtime
di proprietà dei plugin.

`cron_changed` si attiva per gli eventi del ciclo di vita dei cron di proprietà del gateway con un
payload evento tipizzato che copre i motivi `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. L'evento contiene uno snapshot `PluginHookGatewayCronJob`
(inclusi `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presenti) più un `PluginHookGatewayCronDeliveryStatus`
di `not-requested` | `delivered` | `not-delivered` | `unknown`. Gli eventi rimossi
contengono comunque lo snapshot del job eliminato, così gli scheduler esterni possono
riconciliare lo stato. Usa `ctx.getCron?.()` e `ctx.config` dal contesto runtime
quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come
fonte di verità per controlli di scadenza ed esecuzione.

## Deprecazioni imminenti

Alcune superfici adiacenti agli hook sono deprecate ma ancora supportate. Migra
prima della prossima major release:

- **Envelope di canale in testo semplice** negli handler `inbound_claim` e `message_received`.
  Leggi `BodyForAgent` e i blocchi strutturati del contesto utente
  invece di analizzare il testo piatto dell'envelope. Vedi
  [Envelope di canale in testo semplice → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** rimane per compatibilità. I nuovi plugin dovrebbero usare
  `before_model_resolve` e `before_prompt_build` invece della fase
  combinata.
- **`subagent_spawning`** rimane per compatibilità con i plugin più vecchi, ma
  i nuovi plugin non dovrebbero restituire routing dei thread da esso. Il core prepara
  i binding dei subagent `thread: true` tramite adattatori di binding della sessione del canale
  prima dell'attivazione di `subagent_spawned`.
- **`deactivate`** rimane come alias di compatibilità deprecato per la pulizia fino
  a dopo il 2026-08-16. I nuovi plugin dovrebbero usare `gateway_stop`.
- **`onResolution` in `before_tool_call`** ora usa l'union tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) invece di una `string` libera.

Per l'elenco completo - registrazione delle capability di memoria, profilo thinking del provider,
provider di autenticazione esterni, tipi di discovery del provider, accessor del runtime delle task
e la rinomina `command-auth` → `command-status` - vedi
[Migrazione Plugin SDK → Deprecazioni attive](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Migrazione Plugin SDK](/it/plugins/sdk-migration) - deprecazioni attive e tempistica di rimozione
- [Creazione di plugin](/it/plugins/building-plugins)
- [Panoramica Plugin SDK](/it/plugins/sdk-overview)
- [Entry point dei plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Interni dell'architettura dei plugin](/it/plugins/architecture-internals)
