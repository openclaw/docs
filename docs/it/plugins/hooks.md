---
read_when:
    - Stai creando un Plugin che richiede `before_tool_call`, `before_agent_reply`, hook dei messaggi o hook del ciclo di vita
    - Devi bloccare, riscrivere o richiedere l'approvazione per le chiamate agli strumenti da un Plugin
    - Stai decidendo tra hook interni e hook dei Plugin
summary: 'Hook dei Plugin: intercettano gli eventi del ciclo di vita di agente, strumento, messaggio, sessione e Gateway'
title: Agganci dei Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

Gli hook dei Plugin sono punti di estensione in-process per i Plugin di OpenClaw. Usali
quando un Plugin deve ispezionare o modificare esecuzioni dell'agente, chiamate agli strumenti, flusso dei messaggi,
ciclo di vita della sessione, instradamento dei subagenti, installazioni o avvio del Gateway.

Usa invece gli [hook interni](/it/automation/hooks) quando vuoi un piccolo
script `HOOK.md` installato dall'operatore per eventi di comando e Gateway come
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registra hook di Plugin tipizzati con `api.on(...)` dall'entry del tuo Plugin:

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

- `priority` - ordinamento dei gestori (i valori più alti vengono eseguiti per primi).
- `timeoutMs` - budget opzionale per singolo hook. Quando impostato, il runner degli hook interrompe quel
  gestore dopo la scadenza del budget e continua con quello successivo, invece di
  lasciare che configurazioni lente o lavoro di recupero consumino il timeout del modello
  configurato dal chiamante. Omettilo per usare il timeout predefinito di osservazione/decisione che il
  runner degli hook applica genericamente.

Gli operatori possono anche impostare budget per gli hook senza modificare il codice del Plugin:

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
valore `api.on(..., { timeoutMs })` scritto dal Plugin. Ogni valore configurato deve
essere un intero positivo non superiore a 600000 millisecondi. Preferisci override per singolo hook
per hook notoriamente lenti, così un Plugin non ottiene un budget più lungo
ovunque.

Ogni hook riceve `event.context.pluginConfig`, la configurazione risolta per il
Plugin che ha registrato quel gestore. Usala per decisioni degli hook che richiedono
le opzioni correnti del Plugin; OpenClaw la inietta per gestore senza modificare
l'oggetto evento condiviso visto dagli altri Plugin.

## Catalogo degli hook

Gli hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano un
risultato decisionale (bloccare, annullare, sovrascrivere o richiedere approvazione); tutti gli altri sono
solo di osservazione.

**Turno dell'agente**

- `before_model_resolve` - sovrascrive provider o modello prima del caricamento dei messaggi di sessione
- `agent_turn_prepare` - consuma le iniezioni di turno del Plugin in coda e aggiunge contesto nello stesso turno prima degli hook del prompt
- `before_prompt_build` - aggiunge contesto dinamico o testo di prompt di sistema prima della chiamata al modello
- `before_agent_start` - fase combinata solo per compatibilità; preferisci i due hook sopra
- **`before_agent_run`** - ispeziona il prompt finale e i messaggi di sessione prima dell'invio al modello e, facoltativamente, blocca l'esecuzione
- **`before_agent_reply`** - interrompe anticipatamente il turno del modello con una risposta sintetica o silenzio
- **`before_agent_finalize`** - ispeziona la risposta finale naturale e richiede un ulteriore passaggio del modello
- `agent_end` - osserva messaggi finali, stato di successo e durata dell'esecuzione
- `heartbeat_prompt_contribution` - aggiunge contesto solo Heartbeat per monitor in background e Plugin del ciclo di vita

**Osservazione della conversazione**

- `model_call_started` / `model_call_ended` - osserva metadati sanitizzati della chiamata provider/modello, tempistiche, risultato e hash limitati degli ID richiesta senza contenuto di prompt o risposta
- `llm_input` - osserva l'input del provider (prompt di sistema, prompt, cronologia)
- `llm_output` - osserva l'output del provider

**Strumenti**

- **`before_tool_call`** - riscrive i parametri dello strumento, blocca l'esecuzione o richiede approvazione
- `after_tool_call` - osserva risultati dello strumento, errori e durata
- **`tool_result_persist`** - riscrive il messaggio dell'assistente prodotto da un risultato dello strumento
- **`before_message_write`** - ispeziona o blocca una scrittura di messaggio in corso (raro)

**Messaggi e recapito**

- **`inbound_claim`** - rivendica un messaggio in ingresso prima dell'instradamento all'agente (risposte sintetiche)
- `message_received` - osserva contenuto in ingresso, mittente, thread e metadati
- **`message_sending`** - riscrive contenuto in uscita o annulla il recapito
- `message_sent` - osserva successo o errore del recapito in uscita
- **`before_dispatch`** - ispeziona o riscrive un dispatch in uscita prima del passaggio al canale
- **`reply_dispatch`** - partecipa alla pipeline finale di dispatch della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` - traccia i confini del ciclo di vita della sessione
- `before_compaction` / `after_compaction` - osserva o annota cicli di Compaction
- `before_reset` - osserva eventi di reset della sessione (`/reset`, reset programmatici)

**Subagenti**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordina instradamento dei subagenti e recapito del completamento

**Ciclo di vita**

- `gateway_start` / `gateway_stop` - avvia o arresta servizi di proprietà del Plugin con il Gateway
- `cron_changed` - osserva modifiche al ciclo di vita del Cron di proprietà del gateway (aggiunto, aggiornato, rimosso, avviato, terminato, pianificato)
- **`before_install`** - ispeziona scansioni di installazione di Skills o Plugin e, facoltativamente, blocca

## Criterio per le chiamate agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- `event.derivedPaths` opzionale, contenente suggerimenti best-effort sui percorsi di destinazione derivati dall'host
  per envelope di strumenti noti come `apply_patch`; quando presenti,
  questi percorsi possono essere incompleti o sovrastimare ciò che lo strumento
  toccherà effettivamente (ad esempio, con input malformati o parziali)
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
- `requireApproval` mette in pausa l'esecuzione dell'agente e chiede all'utente tramite le
  approvazioni dei Plugin. Il comando `/approve` può approvare sia approvazioni exec sia approvazioni di Plugin.
- Un `block: true` con priorità inferiore può comunque bloccare dopo che un hook con priorità superiore
  ha richiesto l'approvazione.
- `onResolution` riceve la decisione di approvazione risolta - `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

I Plugin inclusi che richiedono criteri a livello host possono registrare criteri per strumenti attendibili
con `api.registerTrustedToolPolicy(...)`. Questi vengono eseguiti prima degli hook
`before_tool_call` ordinari e prima delle decisioni dei Plugin esterni. Usali solo
per gate considerati attendibili dall'host, come criterio dell'area di lavoro, applicazione del budget o
sicurezza dei workflow riservati. I Plugin esterni dovrebbero usare i normali hook `before_tool_call`.

### Persistenza dei risultati degli strumenti

I risultati degli strumenti possono includere `details` strutturati per rendering UI, diagnostica,
instradamento media o metadati di proprietà del Plugin. Tratta `details` come metadati di runtime,
non come contenuto del prompt:

- OpenClaw rimuove `toolResult.details` prima del replay del provider e dell'input di Compaction,
  così i metadati non diventano contesto del modello.
- Le voci di sessione persistite mantengono solo `details` limitati. I dettagli troppo grandi vengono
  sostituiti con un riepilogo compatto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` vengono eseguiti prima del limite finale
  di persistenza. Gli hook dovrebbero comunque mantenere piccoli i `details` restituiti ed evitare
  di inserire testo rilevante per il prompt solo in `details`; inserisci l'output dello strumento visibile al modello
  in `content`.

## Hook per prompt e modello

Usa gli hook specifici di fase per i nuovi Plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati degli allegati.
  Restituisce `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: riceve il prompt corrente, i messaggi di sessione preparati
  e qualsiasi iniezione in coda exactly-once drenata per questa sessione. Restituisce
  `prependContext` o `appendContext`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi di sessione.
  Restituisce `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: viene eseguito solo per turni Heartbeat e restituisce
  `prependContext` o `appendContext`. È pensato per monitor in background
  che devono riassumere lo stato corrente senza modificare i turni avviati dall'utente.

`before_agent_start` resta disponibile per compatibilità. Preferisci gli hook espliciti sopra
così il tuo Plugin non dipende da una fase combinata legacy.

`before_agent_run` viene eseguito dopo la costruzione del prompt e prima di qualsiasi input del modello,
inclusi caricamento di immagini locali al prompt e osservazione `llm_input`. Riceve
l'input utente corrente come `prompt`, più la cronologia di sessione caricata in `messages`
e il prompt di sistema attivo. Restituisci `{ outcome: "block", reason, message? }`
per fermare l'esecuzione prima che il modello possa leggere il prompt. `reason` è interno;
`message` è la sostituzione visibile all'utente. Gli unici risultati supportati sono
`pass` e `block`; forme di decisione non supportate falliscono in modo chiuso.

Quando un'esecuzione viene bloccata, OpenClaw archivia solo il testo sostitutivo in
`message.content` più metadati di blocco non sensibili, come l'id del Plugin
bloccante e il timestamp. Il testo utente originale non viene conservato nella trascrizione o nel contesto futuro.
Le ragioni di blocco interne sono trattate come sensibili ed escluse da
payload di trascrizione, cronologia, broadcast, log e diagnostica. L'osservabilità
dovrebbe usare campi sanitizzati come id del bloccante, risultato, timestamp o una categoria
sicura.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva. Lo stesso valore è disponibile anche in `ctx.runId`.
Le esecuzioni guidate da Cron espongono anche `ctx.jobId` (l'id del job cron originario) così
gli hook dei Plugin possono limitare metriche, effetti collaterali o stato a uno specifico job
pianificato.

Per esecuzioni originate da canale, `ctx.messageProvider` è la superficie del provider come
`discord` o `telegram`, mentre `ctx.channelId` è l'identificatore di destinazione della conversazione
quando OpenClaw può derivarne uno dalla chiave di sessione o dai metadati di recapito.

`agent_end` è un hook di osservazione e viene eseguito fire-and-forget dopo il turno. Il
runner degli hook applica un timeout di 30 secondi, così un Plugin o endpoint
di embedding bloccato non può lasciare la promise dell'hook pendente per sempre. Un timeout viene registrato e
OpenClaw continua; non annulla il lavoro di rete di proprietà del Plugin a meno che anche il
Plugin usi il proprio segnale di interruzione.

Usa `model_call_started` e `model_call_ended` per telemetria delle chiamate al provider
che non dovrebbe ricevere prompt grezzi, cronologia, risposte, header, corpi di richiesta
o ID richiesta del provider. Questi hook includono metadati stabili come
`runId`, `callId`, `provider`, `model`, `api`/`transport` opzionali,
`durationMs`/`outcome` terminali e `upstreamRequestIdHash` quando OpenClaw può derivare un
hash limitato dell'ID richiesta del provider.

`before_agent_finalize` viene eseguito solo quando un harness sta per accettare una
risposta finale naturale dell'assistente. Non è il percorso di annullamento
`/stop` e non viene eseguito quando l'utente interrompe un turno. Restituisci
`{ action: "revise", reason }` per chiedere all'harness un altro passaggio del
modello prima della finalizzazione, `{ action:
"finalize", reason? }` per forzare la finalizzazione, oppure ometti un risultato
per continuare. Gli hook nativi `Stop` di Codex vengono inoltrati in questo hook
come decisioni OpenClaw `before_agent_finalize`.

Quando restituiscono `action: "revise"`, i plugin possono includere metadati
`retry` per rendere il passaggio extra del modello limitato e sicuro da
rieseguire:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` viene aggiunto al motivo di revisione inviato all'harness.
`idempotencyKey` consente all'host di contare i tentativi per la stessa richiesta
del plugin tra decisioni di finalizzazione equivalenti, e `maxAttempts` limita il
numero di passaggi extra che l'host consentirà prima di continuare con la risposta
finale naturale.

I plugin non inclusi nel bundle che necessitano di hook grezzi della conversazione
(`before_model_resolve`, `before_agent_reply`, `llm_input`, `llm_output`,
`before_agent_finalize`, `agent_end` o `before_agent_run`) devono impostare:

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

Gli hook che modificano il prompt e le iniezioni durevoli al turno successivo
possono essere disabilitati per plugin con
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Estensioni di sessione e iniezioni al turno successivo

I plugin di workflow possono rendere persistente un piccolo stato di sessione
compatibile con JSON usando `api.registerSessionExtension(...)` e aggiornarlo
tramite il metodo Gateway `sessions.pluginPatch`. Le righe di sessione proiettano
lo stato dell'estensione registrata tramite `pluginExtensions`, consentendo alla
Control UI e ad altri client di visualizzare lo stato di proprietà del plugin
senza conoscere gli interni del plugin.

Usa `api.enqueueNextTurnInjection(...)` quando un plugin necessita che un contesto
durevole raggiunga il prossimo turno del modello esattamente una volta. OpenClaw
svuota le iniezioni in coda prima degli hook del prompt, elimina le iniezioni
scadute e deduplica per `idempotencyKey` per plugin. Questa è l'interfaccia giusta
per riprese di approvazione, riepiloghi di policy, delta dei monitor in
background e continuazioni di comandi che dovrebbero essere visibili al modello
nel turno successivo ma non dovrebbero diventare testo permanente del prompt di
sistema.

Le semantiche di pulizia fanno parte del contratto. Le callback di pulizia delle
estensioni di sessione e del ciclo di vita del runtime ricevono `reset`, `delete`,
`disable` o `restart`. L'host rimuove lo stato persistente dell'estensione di
sessione del plugin proprietario e le iniezioni pendenti al turno successivo per
reset/delete/disable; restart mantiene lo stato durevole della sessione mentre le
callback di pulizia consentono ai plugin di rilasciare job dello scheduler,
contesto di esecuzione e altre risorse fuori banda della vecchia generazione del
runtime.

## Hook dei messaggi

Usa gli hook dei messaggi per il routing a livello di canale e la policy di
consegna:

- `message_received`: osserva contenuto in ingresso, mittente, `threadId`,
  `messageId`, `senderId`, correlazione opzionale di esecuzione/sessione e
  metadati.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `message_sent`: osserva il successo o il fallimento finale.

Per le risposte TTS solo audio, `content` può contenere la trascrizione parlata
nascosta anche quando il payload del canale non ha testo/didascalia visibile.
Riscrivere quel `content` aggiorna solo la trascrizione visibile all'hook; non
viene renderizzata come didascalia multimediale.

I contesti degli hook dei messaggi espongono campi di correlazione stabili quando
disponibili: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`,
`ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`.
Preferisci questi campi di prima classe prima di leggere i metadati legacy.

Preferisci i campi tipizzati `threadId` e `replyToId` prima di usare metadati
specifici del canale.

Regole decisionali:

- `message_sending` con `cancel: true` è terminale.
- `message_sending` con `cancel: false` viene trattato come assenza di decisione.
- Il `content` riscritto continua verso gli hook a priorità inferiore a meno che
  un hook successivo annulli la consegna.
- `message_sending` può restituire `cancelReason` e `metadata` limitati con un
  annullamento. Le nuove API del ciclo di vita dei messaggi espongono questo come
  esito di consegna soppressa con motivo `cancelled_by_message_sending_hook`; la
  consegna diretta legacy continua a restituire un array di risultati vuoto per
  compatibilità.
- `message_sent` è solo di osservazione. I fallimenti degli handler vengono
  registrati nei log e non modificano il risultato della consegna.

## Hook di installazione

`before_install` viene eseguito dopo la scansione integrata per installazioni di
Skill e plugin. Restituisci risultati aggiuntivi oppure
`{ block: true, blockReason }` per interrompere l'installazione.

`block: true` è terminale. `block: false` viene trattato come assenza di
decisione.

## Ciclo di vita del Gateway

Usa `gateway_start` per i servizi di plugin che necessitano di stato di proprietà
del Gateway. Il contesto espone `ctx.config`, `ctx.workspaceDir` e
`ctx.getCron?.()` per l'ispezione e gli aggiornamenti di Cron. Usa
`gateway_stop` per pulire risorse a lunga esecuzione.

Non fare affidamento sull'hook interno `gateway:startup` per servizi runtime di
proprietà del plugin.

`cron_changed` si attiva per eventi del ciclo di vita di Cron di proprietà del
gateway con un payload evento tipizzato che copre i motivi `added`, `updated`,
`removed`, `started`, `finished` e `scheduled`. L'evento trasporta uno snapshot
`PluginHookGatewayCronJob` (inclusi `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presenti) più un `PluginHookGatewayCronDeliveryStatus`
di `not-requested` | `delivered` | `not-delivered` | `unknown`. Gli eventi
rimossi trasportano comunque lo snapshot del job eliminato affinché gli scheduler
esterni possano riconciliare lo stato. Usa `ctx.getCron?.()` e `ctx.config` dal
contesto runtime quando sincronizzi scheduler di risveglio esterni, e mantieni
OpenClaw come fonte di verità per i controlli di scadenza e l'esecuzione.

## Deprecazioni imminenti

Alcune superfici adiacenti agli hook sono deprecate ma ancora supportate. Esegui
la migrazione prima della prossima major release:

- **Envelope di canale in testo semplice** negli handler `inbound_claim` e
  `message_received`. Leggi `BodyForAgent` e i blocchi strutturati di contesto
  utente invece di analizzare testo di envelope piatto. Vedi
  [Envelope di canale in testo semplice → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** rimane per compatibilità. I nuovi plugin dovrebbero
  usare `before_model_resolve` e `before_prompt_build` invece della fase
  combinata.
- **`onResolution` in `before_tool_call`** ora usa l'unione tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) invece di una `string` libera.

Per l'elenco completo - registrazione delle capability di memoria, profilo di
thinking del provider, provider di autenticazione esterni, tipi di discovery dei
provider, accessor del runtime dei task e rinomina `command-auth` →
`command-status` - vedi
[Migrazione del Plugin SDK → Deprecazioni attive](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Migrazione del Plugin SDK](/it/plugins/sdk-migration) - deprecazioni attive e calendario di rimozione
- [Creazione di plugin](/it/plugins/building-plugins)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
- [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Interni dell'architettura dei plugin](/it/plugins/architecture-internals)
