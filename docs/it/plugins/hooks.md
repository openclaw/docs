---
read_when:
    - Si sta creando un plugin che richiede `before_tool_call`, `before_agent_reply`, hook dei messaggi o hook del ciclo di vita
    - È necessario bloccare, riscrivere o richiedere l'approvazione per le chiamate agli strumenti provenienti da un plugin
    - Si sta decidendo tra hook interni e hook dei plugin
    - Si stanno proiettando i risvegli Cron di OpenClaw in uno scheduler host esterno
summary: 'Hook dei Plugin: intercettare gli eventi del ciclo di vita di agente, strumento, messaggio, sessione e Gateway'
title: Hook dei Plugin
x-i18n:
    generated_at: "2026-07-16T14:43:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Gli hook dei Plugin sono punti di estensione in-process per i plugin di OpenClaw: consentono di ispezionare o
modificare le esecuzioni degli agenti, le chiamate agli strumenti, il flusso dei messaggi, il ciclo di vita delle sessioni, l'instradamento dei subagenti,
le installazioni o l'avvio del Gateway.

Usare invece gli [hook interni](/it/automation/hooks) per un piccolo script `HOOK.md` installato dall'operatore
che reagisce agli eventi dei comandi e del Gateway, come `/new`,
`/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registrare gli hook tipizzati con `api.on(...)` dal punto di ingresso del plugin:

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
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

I gestori che possono restituire decisioni o modifiche vengono eseguiti in sequenza in
ordine decrescente di `priority`; i gestori con la stessa priorità mantengono l'ordine di registrazione.
I gestori di sola osservazione vengono eseguiti in parallelo e le relative esecuzioni
fire-and-forget possono sovrapporsi agli eventi successivi. Non usare la priorità per ordinare
gli effetti collaterali dell'osservazione.

`api.on(name, handler, opts?)` accetta:

| Opzione      | Effetto                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Ordine; i valori più alti vengono eseguiti per primi.                                                                                                                                                                      |
| `timeoutMs` | Tempo massimo di attesa per hook. Alla scadenza, OpenClaw smette di attendere il gestore e prosegue. Non annulla il gestore né i suoi effetti collaterali. Omettere per usare il timeout predefinito del runner per ciascun hook. |

Gli operatori possono impostare i tempi massimi degli hook senza modificare il codice del plugin:

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

`hooks.timeouts.<hookName>` sostituisce `hooks.timeoutMs`, che a sua volta sostituisce il
valore `api.on(..., { timeoutMs })` definito dal plugin. Ogni valore deve essere un
numero intero positivo non superiore a 600000 ms. Per gli hook notoriamente lenti, preferire sostituzioni specifiche
per hook, in modo da non assegnare ovunque un tempo maggiore a un plugin.

La promessa di un gestore scaduto continua a essere eseguita perché i callback degli hook non
ricevono un segnale di annullamento. Il dispatch dell'hook può liberare la propria ammissione al Gateway
mentre l'elaborazione del plugin è ancora in corso. I plugin responsabili di
operazioni di lunga durata devono implementare un proprio ciclo di vita di annullamento e arresto.

Gli hook di modifica in uscita `message_sending` e `reply_payload_sending` usano un
valore predefinito di 15 secondi per gestore. Se uno scade, OpenClaw registra l'errore del plugin
e prosegue con il payload più recente, consentendo alla corsia di consegna serializzata di
completarsi. Impostare un tempo massimo maggiore per hook per i plugin che eseguono intenzionalmente operazioni più lente
prima della consegna.

Analogamente, i plugin dei canali che usano `createReplyDispatcher` possono dichiarare un tempo massimo positivo maggiore
per fase con `beforeDeliverOptions: { timeoutMs }` oppure, quando
aggiungono operazioni, con `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
In assenza di un tempo massimo dichiarato dal proprietario, questi callback usano lo stesso valore predefinito di 15 secondi,
affinché un callback bloccato non possa trattenere la corsia di consegna serializzata.

Ogni hook riceve `event.context.pluginConfig`, la configurazione risolta per il
plugin che ha registrato il gestore. OpenClaw la inserisce separatamente per ciascun gestore senza
modificare l'oggetto evento condiviso visibile agli altri plugin.

## Catalogo degli hook

Gli hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano il risultato di una decisione
(blocco, annullamento, sostituzione o richiesta di approvazione); gli altri sono
di sola osservazione.

**Turno dell'agente**

| Hook                            | Scopo                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Sostituire il provider o il modello prima del caricamento dei messaggi della sessione                                  |
| `agent_turn_prepare`            | Utilizzare le iniezioni di turno accodate del plugin e aggiungere contesto allo stesso turno prima degli hook del prompt      |
| `before_prompt_build`           | Aggiungere contesto dinamico o testo del prompt di sistema prima della chiamata al modello                          |
| `before_agent_start`            | Fase combinata destinata esclusivamente alla compatibilità; preferire i due hook precedenti                            |
| **`before_agent_run`**          | Ispezionare il prompt finale e i messaggi della sessione prima dell'invio al modello; può bloccare l'esecuzione |
| **`before_agent_reply`**        | Interrompere anticipatamente il turno del modello con una risposta sintetica o con il silenzio                           |
| **`before_agent_finalize`**     | Ispezionare la risposta finale naturale e richiedere un'ulteriore elaborazione del modello                         |
| `agent_end`                     | Osservare i messaggi finali, lo stato di riuscita e la durata dell'esecuzione                                  |
| `heartbeat_prompt_contribution` | Aggiungere contesto riservato all'Heartbeat per i plugin di monitoraggio in background e del ciclo di vita                  |

**Osservazione della conversazione**

| Hook                                      | Scopo                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Metadati sanitizzati delle chiamate al provider/modello: tempistiche, esito e hash limitati degli ID richiesta. Nessun contenuto del prompt o della risposta. |
| `llm_input`                               | Input del provider: prompt di sistema, prompt, cronologia                                                                     |
| `llm_output`                              | Output del provider, utilizzo e `contextTokenBudget` risolto, quando disponibile                                       |

**Strumenti**

| Hook                       | Scopo                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Riscrivere i parametri dello strumento, bloccarne l'esecuzione o richiedere l'approvazione |
| `after_tool_call`          | Osservare risultati, errori e durata dello strumento                |
| `resolve_exec_env`         | Fornire a `exec` variabili di ambiente di proprietà del plugin   |
| **`tool_result_persist`**  | Riscrivere il messaggio dell'assistente prodotto dal risultato di uno strumento |
| **`before_message_write`** | Ispezionare o bloccare la scrittura di un messaggio in corso (raro)      |

**Messaggi e consegna**

| Hook                            | Scopo                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Acquisire un messaggio in entrata prima dell'instradamento all'agente (risposte sintetiche) |
| **`channel_pairing_requested`** | Osservare le nuove richieste di associazione dei messaggi diretti                         |
| `message_received`              | Osservare contenuto in entrata, mittente, thread e metadati             |
| **`message_sending`**           | Riscrivere il contenuto in uscita o annullarne la consegna                       |
| **`reply_payload_sending`**     | Modificare o annullare i payload di risposta normalizzati prima della consegna        |
| `message_sent`                  | Osservare la riuscita o il fallimento della consegna in uscita                      |
| **`before_dispatch`**           | Ispezionare o riscrivere un dispatch in uscita prima del passaggio al canale    |
| **`reply_dispatch`**            | Partecipare alla pipeline finale di dispatch delle risposte                  |

**Sessioni e Compaction**

| Hook                                     | Scopo                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Tenere traccia dei confini del ciclo di vita della sessione. `reason` è uno tra `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` o `unknown`. `shutdown`/`restart` vengono attivati dal finalizzatore di arresto del Gateway quando il processo si arresta o si riavvia con sessioni attive, consentendo ai plugin (memoria, archivi delle trascrizioni) di finalizzare le righe fantasma anziché lasciarle aperte tra i riavvii. Il finalizzatore ha una durata limitata, affinché un plugin lento non possa bloccare SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Osservare o annotare i cicli di Compaction                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Osservare gli eventi di reimpostazione della sessione (`/reset`, reimpostazioni programmatiche)                                                                                                                                                                                                                                                                                                                                                                                                     |

**Subagenti**

- `subagent_spawned` / `subagent_ended` - osserva l'avvio e il completamento del sottoagente.
- `subagent_delivery_target` - hook di compatibilità per la consegna del completamento quando nessun'associazione di sessione principale può proiettare una route.
- `subagent_spawning` - hook di compatibilità deprecato. Il nucleo ora prepara le associazioni del sottoagente `thread: true` tramite gli adattatori di associazione delle sessioni dei canali prima che `subagent_spawned` venga attivato.
- `subagent_spawned` include `resolvedModel` e `resolvedProvider` quando OpenClaw ha risolto il modello nativo della sessione figlia prima dell'avvio.
- `subagent_ended` contiene `targetSessionKey` (identità - corrisponde a `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` o `"acp"`), `reason`, `outcome` facoltativo (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` o `"deleted"`), `error` facoltativo, `runId`, `endedAt`, `accountId` e `sendFarewell`. **Non** include `agentId` o `childSessionKey`; utilizzare `targetSessionKey` per stabilire la correlazione con l'evento `subagent_spawned` corrispondente.

**Ciclo di vita**

| Hook                             | Scopo                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Avviare o arrestare con il Gateway i servizi di proprietà del plugin                                                 |
| `deactivate`                     | Alias di compatibilità deprecato per `gateway_stop`; utilizzare `gateway_stop` nei nuovi plugin                 |
| `cron_reconciled`                | Eseguire la riconciliazione rispetto allo stato Cron completo del Gateway dopo l'avvio o il ricaricamento                            |
| `cron_changed`                   | Osservare le modifiche del ciclo di vita Cron gestito dal Gateway (aggiunto, aggiornato, rimosso, avviato, terminato, pianificato) |
| **`before_install`**             | Esaminare il materiale di installazione preparato di una skill o di un plugin da un runtime del plugin caricato                         |

### Richieste di associazione dei canali

Utilizzare `channel_pairing_requested` quando un plugin deve notificare un operatore o
scrivere un record di audit dopo che il mittente di un messaggio diretto non associato crea una richiesta di
associazione in sospeso. L'hook viene eseguito quando la richiesta viene creata; la consegna tramite il canale
della risposta di associazione non viene ritardata da gestori dell'hook lenti o non riusciti.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Nuova richiesta di associazione ${event.channel} da ${event.senderId}: ${event.code}`,
  });
});
```

L'hook è destinato alla sola osservazione. Non approva, rifiuta, sopprime né riscrive
la risposta di associazione. Il payload include il canale, `accountId` facoltativo,
`senderId` con ambito limitato al canale, `code` di associazione e i metadati del canale. Considerare il
codice di associazione come una credenziale di approvazione attiva e monouso e consegnarlo solo a una
destinazione affidabile per l'operatore. Considerare `metadata` come testo di identità non affidabile
fornito dal mittente. L'hook non include il corpo o i contenuti multimediali del messaggio in entrata.

## Hook di debug del runtime

Utilizzare `before_model_resolve` per cambiare provider o modello per un turno dell'agente: viene
eseguito prima della risoluzione del modello. `llm_output` viene eseguito solo dopo che un tentativo del modello
ha prodotto un output dell'assistente.

Per verificare il modello effettivo della sessione, esaminare le registrazioni del runtime, quindi
utilizzare `openclaw sessions` o le superfici di sessione/stato del Gateway. Per eseguire il debug
dei payload del provider, avviare il Gateway con `--raw-stream` e
`--raw-stream-path <path>` per scrivere gli eventi non elaborati del flusso del modello in un file jsonl.

## Criteri per le chiamate agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- `event.toolKind` e `event.toolInputKind` facoltativi, discriminatori autorevoli dell'host
  per gli strumenti che condividono intenzionalmente i nomi; ad esempio, le chiamate `exec`
  della modalità codice esterna utilizzano `toolKind: "code_mode_exec"` e includono
  `toolInputKind: "javascript" | "typescript"` quando il linguaggio di input è
  noto
- `event.derivedPaths` facoltativo, suggerimenti del percorso di destinazione derivati dall'host secondo il principio del massimo impegno
  per envelope di strumenti noti come `apply_patch`; questi percorsi possono essere
  incompleti o sovrastimare ciò su cui lo strumento interverrà effettivamente (ad
  esempio, con input non validi o parziali)
- `event.runId` facoltativo
- `event.toolCallId` facoltativo
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` e `ctx.trace` diagnostico

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
    /** @deprecated Le approvazioni non risolte comportano sempre un rifiuto. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Comportamento di protezione per gli hook del ciclo di vita tipizzati:

- `block: true` è terminale e ignora i gestori con priorità inferiore.
- `block: false` viene considerato come assenza di decisione.
- `params` riscrive i parametri dello strumento per l'esecuzione.
- `requireApproval` sospende l'esecuzione dell'agente e richiede una decisione all'utente tramite le
  approvazioni del plugin. `/approve` può approvare sia le approvazioni di esecuzione sia quelle del plugin. Nei relay
  `PreToolUse` nativi in modalità report del server applicativo Codex, l'operazione viene delegata alla
  richiesta di approvazione corrispondente del server applicativo; consultare
  [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime#hook-boundaries).
- Un `block: true` con priorità inferiore può comunque bloccare dopo che un hook con priorità superiore
  ha richiesto l'approvazione.
- `onResolution` riceve la decisione risolta: `allow-once`, `allow-always`,
  `deny`, `timeout` o `cancelled`.

Consultare [Richieste di autorizzazione dei plugin](/it/plugins/plugin-permission-requests) per
l'instradamento delle approvazioni, il comportamento delle decisioni e i casi in cui utilizzare `requireApproval` al posto
di strumenti facoltativi o approvazioni di esecuzione.

I plugin che richiedono criteri a livello di host possono registrare criteri affidabili per gli strumenti con
`api.registerTrustedToolPolicy(...)`. Questi vengono eseguiti prima dei normali
hook `before_tool_call` e prima delle normali decisioni degli hook. I criteri affidabili
inclusi vengono eseguiti per primi; seguono i criteri affidabili dei plugin installati, nell'ordine di caricamento
dei plugin; i normali hook `before_tool_call` vengono eseguiti successivamente. I plugin inclusi mantengono
il percorso esistente dei criteri affidabili. I plugin installati devono essere abilitati esplicitamente
e dichiarare ogni ID dei criteri in `contracts.trustedToolPolicies`; gli ID non dichiarati
vengono rifiutati prima della registrazione. Gli ID dei criteri hanno come ambito il plugin che li registra,
quindi plugin diversi possono riutilizzare lo stesso ID locale. Utilizzare questo livello solo
per controlli considerati affidabili dall'host, come i criteri dell'area di lavoro, l'applicazione dei limiti di budget o
la sicurezza dei flussi di lavoro riservati.

### Hook dell'ambiente di esecuzione

`resolve_exec_env` consente ai plugin di fornire variabili d'ambiente alle invocazioni dello strumento `exec`
prima dell'esecuzione del comando. Riceve:

- `event.sessionKey`
- `event.toolName`, attualmente sempre `"exec"`
- `event.host`, uno tra `"gateway"`, `"sandbox"` o `"node"`
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` e `ctx.channelId`

Restituire un `Record<string, string>` da unire all'ambiente di esecuzione. I gestori
vengono eseguiti in ordine di priorità; per la stessa chiave, i risultati successivi sostituiscono quelli precedenti.

L'output dell'hook viene filtrato in base ai criteri dell'host per le chiavi dell'ambiente di esecuzione prima
dell'unione. `PATH` viene sempre eliminato (la risoluzione dei comandi e i controlli dei binari sicuri
dipendono da esso). Vengono eliminate le chiavi non valide e quelle pericolose che sostituiscono impostazioni dell'host, come `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, le variabili proxy (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) e le variabili che sostituiscono le impostazioni TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` e simili). L'ambiente filtrato del plugin viene incluso
nei metadati di approvazione/audit del Gateway e inoltrato alle richieste di esecuzione
dell'host Node.

### Persistenza dei risultati degli strumenti

I risultati degli strumenti possono includere `details` strutturati per il rendering dell'interfaccia utente, la diagnostica,
l'instradamento dei contenuti multimediali o i metadati di proprietà del plugin. Considerare `details` come metadati del runtime,
non come contenuto del prompt:

- OpenClaw rimuove `toolResult.details` prima della riproduzione per il provider e dell'input della Compaction
  affinché i metadati non diventino parte del contesto del modello.
- Le voci di sessione persistenti conservano solo `details` con dimensioni limitate. I dettagli sovradimensionati vengono
  sostituiti con un riepilogo compatto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` vengono eseguiti prima del limite finale
  di persistenza. Mantenere ridotto il valore `details` restituito ed evitare di inserire
  testo rilevante per il prompt solo in `details`; inserire l'output dello strumento visibile al modello in
  `content`.

## Hook del prompt e del modello

Utilizzare gli hook specifici per fase per i nuovi plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati degli allegati.
  Restituire `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: riceve il prompt corrente, i messaggi di sessione
  preparati e tutte le iniezioni in coda esattamente una volta prelevate per questa sessione.
  Restituire `prependContext` o `appendContext`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi della sessione.
  Restituire `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: viene eseguito solo per i turni Heartbeat e restituisce
  `prependContext` o `appendContext`. È destinato ai monitor in background che
  devono riepilogare lo stato corrente senza modificare i turni avviati dall'utente.

`before_agent_start` viene mantenuto per compatibilità. Preferire gli hook espliciti
precedenti, affinché il plugin non dipenda da una fase combinata legacy.

`before_agent_run` viene eseguito dopo la costruzione del prompt e prima di qualsiasi input del modello,
inclusi il caricamento delle immagini locali al prompt e l'osservazione `llm_input`. Riceve
l'input corrente dell'utente come `prompt`, oltre alla cronologia della sessione caricata in `messages`
e al prompt di sistema attivo. Restituire `{ outcome: "block", reason, message? }`
per arrestare l'esecuzione prima che il modello legga il prompt. `reason` è interno;
`message` è l'alternativa visibile all'utente. Sono supportati solo gli esiti `pass` e `block`;
le forme di decisione non supportate comportano un rifiuto per impostazione predefinita.

Quando un'esecuzione viene bloccata, OpenClaw memorizza solo il testo sostitutivo in
`message.content`, insieme a metadati di blocco non sensibili, come l'ID del
plugin che ha causato il blocco e il timestamp. Il testo originale dell'utente non viene conservato nella trascrizione
né nel contesto futuro. I motivi interni del blocco vengono considerati sensibili ed
esclusi dai payload di trascrizione, cronologia, trasmissione, registro e diagnostica.
Per l'osservabilità, utilizzare campi sanitizzati come l'ID del responsabile del blocco, l'esito,
il timestamp o una categoria sicura.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva; lo stesso valore è presente anche in `ctx.runId`. Le esecuzioni avviate
da Cron espongono inoltre `ctx.jobId` (l'ID del processo Cron di origine) nel contesto
del turno dell'agente, affinché gli hook possano limitare metriche, effetti collaterali o stato a uno specifico
processo pianificato. `ctx.jobId` non fa parte del contesto dello strumento `before_tool_call`.

Per le esecuzioni originate dai canali, `ctx.channel` e `ctx.messageProvider` identificano
la superficie del provider, ad esempio `discord` o `telegram`, mentre `ctx.channelId` è
l'identificatore della destinazione della conversazione quando OpenClaw può ricavarne uno dalla
chiave di sessione o dai metadati di consegna.

Quando l'identità del mittente è disponibile, i contesti degli hook dell'agente includono anche:

- `ctx.senderId` - ID del mittente nell'ambito del canale (ad es. `open_id` di Feishu, ID
  utente di Discord). Viene valorizzato quando l'esecuzione ha origine da un messaggio utente con
  metadati del mittente noti.
- `ctx.chatId` - identificatore nativo del trasporto per la conversazione (ad es.
  `chat_id` di Feishu, `chat_id` di Telegram). Viene valorizzato quando il canale di origine
  fornisce un ID conversazione nativo.
- `ctx.channelContext.sender.id` - lo stesso ID mittente di `ctx.senderId`, all'interno
  di un oggetto di proprietà del canale che i plugin possono estendere con campi specifici del canale.
- `ctx.channelContext.chat.id` - lo stesso ID conversazione di `ctx.chatId`,
  all'interno di un oggetto di proprietà del canale che i plugin possono estendere con campi
  specifici del canale.

Il core definisce solo i campi `id` annidati. I plugin di canale che trasmettono
metadati più dettagliati sul mittente o sulla chat tramite l'helper in ingresso possono ampliare
`PluginHookChannelSenderContext` o `PluginHookChannelChatContext` da
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

I plugin di canale trasmettono questi campi tramite l'helper SDK in ingresso:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Questi campi sono facoltativi e assenti per le esecuzioni originate dal sistema (heartbeat,
cron, exec-event).

`ctx.senderExternalId` rimane come campo deprecato per la compatibilità a livello di sorgente con
i plugin meno recenti. Il core non lo valorizza; le nuove identità del mittente
specifiche del canale devono risiedere sotto `ctx.channelContext.sender` tramite
l'estensione del modulo.

`agent_end` è un hook di osservazione. I percorsi del Gateway e dell'harness persistente lo eseguono
senza attenderne il completamento dopo il turno, mentre i percorsi CLI monouso di breve durata attendono
la promessa dell'hook prima della pulizia del processo, affinché i plugin attendibili possano scaricare
i dati di osservabilità del terminale o acquisire lo stato. L'esecutore degli hook applica un timeout di 30 secondi,
in modo che un plugin bloccato o un endpoint di embedding non possa lasciare la promessa dell'hook
in sospeso per sempre. Il timeout viene registrato e OpenClaw prosegue; non
annulla le operazioni di rete di proprietà del plugin, a meno che il plugin non utilizzi anche un proprio segnale
di interruzione.

Usare `model_call_started` e `model_call_ended` per la telemetria delle chiamate al provider
che non deve ricevere prompt non elaborati, cronologia, risposte, intestazioni, corpi
delle richieste o ID delle richieste del provider. Questi hook includono metadati stabili quali
`runId`, `callId`, `provider`, `model`, i valori facoltativi `api`/`transport`, i valori terminali
`durationMs`/`outcome` e `upstreamRequestIdHash` quando OpenClaw può ricavare un
hash limitato dell'ID richiesta del provider. Quando il runtime ha risolto
i metadati della finestra di contesto, l'evento e il contesto dell'hook includono anche
`contextTokenBudget`, il budget effettivo di token dopo i limiti di modello/configurazione/agente,
oltre a `contextWindowSource` e `contextWindowReferenceTokens` quando è stato
applicato un limite inferiore.

`before_agent_finalize` viene eseguito solo quando un harness sta per accettare una risposta finale
naturale dell'assistente. Non è il percorso di annullamento `/stop` e non viene
eseguito quando l'utente interrompe un turno. Restituire `{ action: "revise", reason }` per chiedere
all'harness un ulteriore passaggio del modello prima della finalizzazione, `{ action:
"finalize", reason? }` per forzare la finalizzazione oppure omettere un risultato per proseguire.
Gli handler dispongono di un budget predefinito di 15s; in caso di timeout, OpenClaw registra l'errore e
prosegue con la risposta finale originale.
Gli hook nativi `Stop` di Codex vengono inoltrati a questo hook come decisioni
`before_agent_finalize` di OpenClaw.

Quando restituiscono `action: "revise"`, i plugin possono includere i metadati `retry` per
rendere il passaggio aggiuntivo del modello limitato e sicuro per la riesecuzione:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` viene aggiunto al motivo della revisione inviato all'harness.
`idempotencyKey` consente all'host di contare i nuovi tentativi per la stessa richiesta del plugin
tra decisioni di finalizzazione equivalenti, mentre `maxAttempts` limita il numero di passaggi
aggiuntivi consentiti dall'host prima di proseguire con la risposta finale naturale.

I plugin non inclusi nel bundle che necessitano di hook per la conversazione non elaborata (`before_model_resolve`,
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

Gli hook che modificano il prompt e le iniezioni persistenti per il turno successivo possono essere disabilitati per
ciascun plugin con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Estensioni della sessione e iniezioni nel turno successivo

I plugin di workflow possono rendere persistente un piccolo stato di sessione compatibile con JSON mediante
`api.session.state.registerSessionExtension(...)` e aggiornarlo tramite il metodo
`sessions.pluginPatch` del Gateway. Le righe della sessione proiettano lo stato
delle estensioni registrate tramite `pluginExtensions`, consentendo alla Control UI e agli altri
client di visualizzare lo stato di proprietà del plugin senza conoscerne i dettagli interni.
`api.registerSessionExtension(...)` continua a funzionare, ma è deprecato a favore
dello spazio dei nomi `api.session.state`.

Usare `api.session.workflow.enqueueNextTurnInjection(...)` quando un plugin necessita
di un contesto persistente che raggiunga esattamente una volta il turno successivo del modello (il valore di primo livello
`api.enqueueNextTurnInjection(...)` è un alias deprecato con lo stesso
comportamento). OpenClaw preleva le iniezioni in coda prima degli hook del prompt, elimina
quelle scadute e rimuove i duplicati in base a `idempotencyKey` per ciascun plugin. Questo è
il punto di integrazione appropriato per la ripresa delle approvazioni, i riepiloghi delle policy, le variazioni dei monitor
in background e le continuazioni dei comandi che devono essere visibili al modello nel
turno successivo, ma non devono diventare testo permanente del prompt di sistema.

La semantica della pulizia fa parte del contratto. I callback di pulizia delle estensioni della sessione e
del ciclo di vita del runtime ricevono `reset`, `delete`, `disable` o
`restart`. L'host rimuove lo stato persistente delle estensioni della sessione
e le iniezioni in sospeso per il turno successivo appartenenti al plugin in caso di reimpostazione/eliminazione/disabilitazione; il riavvio
mantiene lo stato persistente della sessione, mentre i callback di pulizia consentono ai plugin di rilasciare
i processi dello scheduler, il contesto di esecuzione e altre risorse fuori banda della precedente
generazione del runtime.

## Hook dei messaggi

Usare gli hook dei messaggi per l'instradamento a livello di canale e le policy di consegna:

- `message_received`: osserva contenuto in ingresso, mittente, `threadId`,
  `messageId`, `senderId`, correlazione facoltativa tra esecuzione e sessione e metadati.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `reply_payload_sending`: riscrive gli oggetti `ReplyPayload` normalizzati
  (inclusi `presentation`, `delivery`, riferimenti ai contenuti multimediali e testo) o restituisce
  `{ cancel: true }`.
- `message_sent`: osserva il successo o l'errore finale.

Per le risposte TTS contenenti solo audio, `content` può contenere la trascrizione vocale
nascosta anche quando il payload del canale non presenta testo o didascalia visibile.
La riscrittura di tale `content` aggiorna solo la trascrizione visibile all'hook; non viene
visualizzata come didascalia del contenuto multimediale.

Gli eventi `reply_payload_sending` possono includere `usageState`, un'istantanea live
best effort del modello, dell'utilizzo e del contesto per ciascun turno. La consegna persistente, la riproduzione recuperata e
le risposte prive di una correlazione esatta con l'esecuzione la omettono.

I contesti degli hook dei messaggi espongono campi di correlazione stabili quando disponibili:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. I contesti in ingresso
e `before_dispatch` espongono inoltre i metadati della risposta quando il canale
dispone di dati del messaggio citato filtrati in base alla visibilità: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` e `replyToIsQuote`. Preferire questi
campi di prima classe prima di leggere i metadati legacy.

Preferire i campi tipizzati `threadId` e `replyToId` prima di utilizzare metadati specifici
del canale.

Regole decisionali:

- `message_sending` con `cancel: true` è terminale.
- `message_sending` con `cancel: false` viene considerato come nessuna decisione.
- Il valore `content` riscritto prosegue verso gli hook con priorità inferiore, a meno che un hook successivo
  non annulli la consegna.
- `reply_payload_sending` viene eseguito dopo la normalizzazione del payload e prima della consegna
  al canale, incluse le risposte instradate nuovamente al canale di origine.
  Gli handler vengono eseguiti in sequenza e ciascun handler vede il payload più recente prodotto
  dagli handler con priorità superiore.
- I payload `reply_payload_sending` non espongono indicatori di attendibilità del runtime quali
  `trustedLocalMedia`; i plugin possono modificare la struttura del payload, ma non possono concedere
  l'attendibilità locale ai contenuti multimediali.
- `message_sending` può restituire `cancelReason` e un valore `metadata` limitato insieme a un
  annullamento. Le nuove API del ciclo di vita dei messaggi espongono questo caso come esito di consegna
  soppressa con motivo `cancelled_by_message_sending_hook`; la consegna diretta
  legacy continua a restituire un array di risultati vuoto per compatibilità.
- `message_sent` è di sola osservazione. Gli errori degli handler vengono registrati e non
  modificano il risultato della consegna.

## Hook di installazione

Usare `security.installPolicy` per le decisioni di autorizzazione/blocco di competenza dell'operatore. Tale
policy viene eseguita dalla configurazione di OpenClaw, copre i percorsi CLI di installazione e aggiornamento e,
quando è abilitata ma non disponibile, blocca per impostazione predefinita.

`before_install` è un hook del ciclo di vita del runtime del plugin. Viene eseguito dopo
`security.installPolicy` solo nel processo OpenClaw in cui gli hook del plugin sono
già stati caricati, ad esempio nei flussi di installazione supportati dal Gateway. È utile per
osservazioni, avvisi e verifiche di compatibilità di competenza del plugin, ma non costituisce
il principale confine di sicurezza aziendale o dell'host per le installazioni. Il campo
`builtinScan` rimane nel payload dell'evento per compatibilità, ma
OpenClaw non esegue più il blocco integrato del codice pericoloso durante l'installazione, pertanto
si tratta di un risultato `ok` vuoto. Restituire ulteriori rilevamenti o
`{ block: true, blockReason }` per interrompere l'installazione in tale processo.

`block: true` è terminale. `block: false` viene considerato come nessuna decisione. Gli errori degli handler
bloccano l'installazione per impostazione predefinita.

## Ciclo di vita del Gateway

Usare `gateway_start` per avviare i servizi generali dei plugin e `gateway_stop` per
ripulire le risorse a lunga esecuzione. Lo scheduler Cron può essere ancora in fase di caricamento quando
viene eseguito `gateway_start`, quindi non utilizzarlo come segnale di riferimento iniziale per una proiezione
Cron esterna.

Non fare affidamento sull'hook interno `gateway:startup` per i servizi runtime di proprietà
dei plugin.

`cron_reconciled` viene attivato dopo che lo scheduler Cron del Gateway e i relativi
watcher all'uscita hanno riconciliato il proprio stato persistente. Viene attivato sia durante l'avvio
iniziale sia durante la sostituzione dello scheduler al ricaricamento della configurazione. L'evento segnala
`reason` (`startup` o `reload`) e lo stato effettivo `enabled`. Anche Cron
disabilitato genera un evento con `enabled: false`, consentendo a una proiezione esterna di
eliminare i risvegli obsoleti. Usare `ctx.getCron?.()` per l'istanza esatta dello scheduler che
ha completato la riconciliazione; un ricaricamento successivo non reindirizza tale callback.
`ctx.abortSignal` è associato alla stessa istantanea dello scheduler. Il Gateway lo interrompe non appena
viene attivato uno scheduler più recente o inizia l'arresto. Trasmetterlo a ogni
effetto collaterale persistente e non accettare l'istantanea dopo la sua interruzione.
Questo è un segnale del ciclo di vita dello scheduler, non un segnale di attivazione del plugin:
un hot reload limitato ai plugin non lo riattiva. Un consumer appena abilitato riceve
il primo riferimento iniziale alla successiva sostituzione dello scheduler o al successivo avvio del Gateway.

Come per gli altri hook di osservazione, i callback `gateway_start` e `cron_reconciled`
possono sovrapporsi. Se entrambi gli handler condividono l'inizializzazione del plugin, coordinarli
con una promessa di disponibilità locale al plugin anziché dipendere dall'ordine dei callback.

`cron_changed` viene attivato per gli eventi del ciclo di vita Cron gestiti dal Gateway con un payload
di evento tipizzato che comprende i motivi `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. L'evento contiene uno snapshot `PluginHookGatewayCronJob`
(inclusi `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError`, quando presenti) più un `PluginHookGatewayCronDeliveryStatus`
di `not-requested` | `delivered` | `not-delivered` | `unknown`. Gli eventi di rimozione
sono successivi al commit: vengono attivati solo dopo il completamento della cancellazione persistente e contengono comunque
lo snapshot del processo eliminato, affinché gli scheduler esterni possano riconciliare lo stato.

Un evento `scheduled` è successivo al commit: viene attivato solo dopo che una scrittura persistente
completata correttamente modifica il valore effettivo `nextRunAtMs` di un processo esistente, escludendo l'evento esplicito del ciclo
di vita `added`, `updated` o `removed` di tale processo. Il valore `event.nextRunAtMs`
di primo livello è il prossimo risveglio registrato; quando è assente, il processo
non ha alcun risveglio successivo. Questi eventi vanno considerati suggerimenti di riconciliazione, non un log
ordinato delle differenze. Vanno usati come suggerimenti aggregabili per rileggere lo scheduler acquisito per ultimo da
`cron_reconciled`; non adottare lo scheduler da un contesto `cron_changed`.
Mantenere OpenClaw come fonte autorevole per i controlli delle scadenze e l'esecuzione.

### Proiezione sicura di Cron esterno

Proiettare uno snapshot completo dei risvegli anziché inoltrare le differenze degli eventi Cron. L'operazione
`replaceAll` dell'adattatore esterno deve essere atomica e idempotente e deve
risolversi solo dopo che l'host ha accettato lo snapshot in modo persistente. Deve
inoltre rispettare il segnale di interruzione fornito: se il segnale viene interrotto prima dell'accettazione
persistente, l'adattatore non deve accettare tale snapshot.

Questo modello mantiene in esecuzione un solo worker per lo stato più recente. Solo `cron_reconciled`
adotta un'istanza dello scheduler; `cron_changed` chiede semplicemente a tale worker di rileggere
l'istanza autorevole, affinché un suggerimento tardivo non possa ripristinare uno scheduler precedente.
Una revisione più recente interrompe il tentativo attivo dell'host prima che possa accettare uno
snapshot obsoleto.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Quando `cron_reconciled` segnala `enabled: false`, lo stesso percorso chiama
`replaceAll([])` e cancella i risvegli esterni obsoleti. In questo esempio, i nuovi tentativi con attesa progressiva
sono locali al processo e considerano temporanei gli errori dell'adattatore di runtime; convalidare
la configurazione che non consente nuovi tentativi prima della registrazione. OpenClaw non fornisce una
coda di uscita per gli effetti degli hook dei Plugin. Se il processo termina prima dell'accettazione persistente,
il successivo avvio del Gateway emette un nuovo snapshot autorevole `cron_reconciled`.
`gateway_stop` interrompe il lavoro dell'host in corso, attende la conclusione del worker, quindi
chiude l'adattatore.

## Funzionalità che saranno deprecate

Alcune superfici adiacenti agli hook sono deprecate, ma ancora supportate. Eseguire la migrazione
prima della prossima versione principale:

- **Envelope dei canali in testo non crittografato** nei gestori `inbound_claim` e `message_received`.
  Leggere `BodyForAgent` e i blocchi strutturati del contesto utente
  anziché analizzare il testo piatto dell'envelope. Consultare
  [Envelope dei canali in testo non crittografato → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** rimane disponibile per compatibilità. I nuovi Plugin devono usare
  `before_model_resolve` e `before_prompt_build` anziché la fase
  combinata.
- **`subagent_spawning`** rimane disponibile per la compatibilità con i Plugin precedenti, ma
  i nuovi Plugin non devono restituire da esso l'instradamento dei thread. Il core prepara
  le associazioni dei subagenti `thread: true` tramite gli adattatori di associazione delle sessioni dei canali
  prima dell'attivazione di `subagent_spawned`.
- **`deactivate`** rimane come alias di compatibilità deprecato per la pulizia fino
  a dopo il 2026-08-16. I nuovi Plugin devono usare `gateway_stop`.
- **`onResolution` in `before_tool_call`** ora usa l'unione tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) anziché un valore `string` in formato libero.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** rimangono
  come alias di compatibilità di primo livello. I nuovi Plugin devono usare
  `api.session.state.registerSessionExtension(...)` e
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Per l'elenco completo — registrazione delle capacità di memoria, profilo di ragionamento
del provider, provider di autenticazione esterni, tipi di rilevamento dei provider, funzioni di accesso al runtime
delle attività e ridenominazione da `command-auth` a `command-status` — consultare
[Migrazione dell'SDK dei Plugin → Funzionalità deprecate attive](/it/plugins/sdk-migration#active-deprecations).

## Contenuti correlati

- [Migrazione dell'SDK dei Plugin](/it/plugins/sdk-migration) - funzionalità deprecate attive e tempistica della rimozione
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview)
- [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Elementi interni dell'architettura dei Plugin](/it/plugins/architecture-internals)
