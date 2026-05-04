---
read_when:
    - Stai sviluppando un Plugin che necessita di before_tool_call, before_agent_reply, hook di messaggio o hook del ciclo di vita
    - Devi bloccare, riscrivere o richiedere l'approvazione per le chiamate agli strumenti da un plugin
    - Stai scegliendo tra hook interni e hook del Plugin
summary: 'Hook dei Plugin: intercettano gli eventi del ciclo di vita dell''agente, dello strumento, del messaggio, della sessione e del Gateway'
title: Hook dei Plugin
x-i18n:
    generated_at: "2026-05-04T18:24:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

Gli hook dei Plugin sono punti di estensione in-process per i plugin OpenClaw. Usali
quando un plugin deve ispezionare o modificare esecuzioni degli agenti, chiamate agli strumenti, flusso dei messaggi,
ciclo di vita delle sessioni, instradamento dei subagenti, installazioni o avvio del Gateway.

Usa invece gli [hook interni](/it/automation/hooks) quando vuoi un piccolo
script `HOOK.md` installato dall'operatore per eventi di comandi e Gateway come
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

I gestori degli hook vengono eseguiti in sequenza in ordine decrescente di `priority`. Gli hook
con la stessa priorità mantengono l'ordine di registrazione.

`api.on(name, handler, opts?)` accetta:

- `priority` — ordinamento dei gestori (i valori più alti vengono eseguiti per primi).
- `timeoutMs` — budget facoltativo per singolo hook. Quando impostato, il runner degli hook interrompe quel
  gestore allo scadere del budget e continua con il successivo, invece di
  lasciare che un setup lento o un lavoro di richiamo consumi il timeout del modello configurato dal chiamante.
  Omettilo per usare il timeout predefinito di osservazione/decisione che il
  runner degli hook applica in modo generico.

Gli operatori possono anche impostare budget degli hook senza modificare il codice del plugin:

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
valore `api.on(..., { timeoutMs })` scritto dall'autore del plugin. Ogni valore configurato deve
essere un intero positivo non superiore a 600000 millisecondi. Preferisci override per singolo hook
per gli hook notoriamente lenti, così un plugin non ottiene un budget più lungo
ovunque.

Ogni hook riceve `event.context.pluginConfig`, la configurazione risolta per il
plugin che ha registrato quel gestore. Usala per decisioni degli hook che richiedono
le opzioni correnti del plugin; OpenClaw la inietta per gestore senza mutare
l'oggetto evento condiviso visto dagli altri plugin.

## Catalogo degli hook

Gli hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano un
risultato decisionale (blocco, annullamento, override o richiesta di approvazione); tutti gli altri sono
solo di osservazione.

**Turno dell'agente**

- `before_model_resolve` — sovrascrive provider o modello prima che i messaggi della sessione vengano caricati
- `agent_turn_prepare` — consuma le iniezioni di turno dei plugin in coda e aggiunge contesto nello stesso turno prima degli hook del prompt
- `before_prompt_build` — aggiunge contesto dinamico o testo del prompt di sistema prima della chiamata al modello
- `before_agent_start` — fase combinata solo per compatibilità; preferisci i due hook sopra
- **`before_agent_reply`** — interrompe il turno del modello con una risposta sintetica o con silenzio
- **`before_agent_finalize`** — ispeziona la risposta finale naturale e richiede un altro passaggio del modello
- `agent_end` — osserva messaggi finali, stato di successo e durata dell'esecuzione
- `heartbeat_prompt_contribution` — aggiunge contesto solo heartbeat per monitor in background e plugin del ciclo di vita

**Osservazione della conversazione**

- `model_call_started` / `model_call_ended` — osserva metadati sanificati della chiamata provider/modello, tempi, esito e hash limitati degli ID richiesta senza contenuto di prompt o risposta
- `llm_input` — osserva l'input del provider (prompt di sistema, prompt, cronologia)
- `llm_output` — osserva l'output del provider

**Strumenti**

- **`before_tool_call`** — riscrive i parametri dello strumento, blocca l'esecuzione o richiede approvazione
- `after_tool_call` — osserva risultati dello strumento, errori e durata
- **`tool_result_persist`** — riscrive il messaggio dell'assistente prodotto da un risultato dello strumento
- **`before_message_write`** — ispeziona o blocca una scrittura di messaggio in corso (raro)

**Messaggi e consegna**

- **`inbound_claim`** — rivendica un messaggio in ingresso prima dell'instradamento dell'agente (risposte sintetiche)
- `message_received` — osserva contenuto in ingresso, mittente, thread e metadati
- **`message_sending`** — riscrive il contenuto in uscita o annulla la consegna
- `message_sent` — osserva successo o fallimento della consegna in uscita
- **`before_dispatch`** — ispeziona o riscrive un invio in uscita prima del passaggio al canale
- **`reply_dispatch`** — partecipa alla pipeline finale di invio della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` — traccia i confini del ciclo di vita della sessione
- `before_compaction` / `after_compaction` — osserva o annota i cicli di Compaction
- `before_reset` — osserva eventi di reset della sessione (`/reset`, reset programmatici)

**Subagenti**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordina instradamento dei subagenti e consegna del completamento

**Ciclo di vita**

- `gateway_start` / `gateway_stop` — avvia o arresta servizi di proprietà del plugin con il Gateway
- `cron_changed` — osserva modifiche del ciclo di vita dei Cron di proprietà del gateway (aggiunto, aggiornato, rimosso, avviato, terminato, pianificato)
- **`before_install`** — ispeziona scansioni di installazione di skill o plugin e, facoltativamente, blocca

## Criterio per le chiamate agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- `event.runId` facoltativo
- `event.toolCallId` facoltativo
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

- `block: true` è terminale e salta i gestori con priorità più bassa.
- `block: false` viene trattato come nessuna decisione.
- `params` riscrive i parametri dello strumento per l'esecuzione.
- `requireApproval` mette in pausa l'esecuzione dell'agente e chiede all'utente tramite le approvazioni dei plugin. Il comando `/approve` può approvare sia approvazioni exec sia approvazioni di plugin.
- Un `block: true` con priorità più bassa può comunque bloccare dopo che un hook con priorità più alta
  ha richiesto l'approvazione.
- `onResolution` riceve la decisione di approvazione risolta — `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

I plugin inclusi che necessitano di criteri a livello host possono registrare criteri attendibili per gli strumenti
con `api.registerTrustedToolPolicy(...)`. Questi vengono eseguiti prima dei normali
hook `before_tool_call` e prima delle decisioni dei plugin esterni. Usali solo
per gate attendibili dall'host, come criteri dell'area di lavoro, applicazione del budget o
sicurezza dei workflow riservati. I plugin esterni dovrebbero usare i normali hook `before_tool_call`.

### Persistenza dei risultati degli strumenti

I risultati degli strumenti possono includere `details` strutturati per rendering UI, diagnostica,
instradamento dei media o metadati di proprietà del plugin. Tratta `details` come metadati runtime,
non come contenuto del prompt:

- OpenClaw rimuove `toolResult.details` prima del replay verso il provider e dell'input di Compaction
  così i metadati non diventano contesto del modello.
- Le voci di sessione persistite mantengono solo `details` limitati. I dettagli troppo grandi vengono
  sostituiti con un riepilogo compatto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` vengono eseguiti prima del limite finale di
  persistenza. Gli hook dovrebbero comunque mantenere piccoli i `details` restituiti ed evitare
  di inserire testo rilevante per il prompt solo in `details`; inserisci l'output dello strumento visibile al modello
  in `content`.

## Hook per prompt e modello

Usa gli hook specifici di fase per i nuovi plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati degli allegati.
  Restituisce `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: riceve il prompt corrente, i messaggi di sessione preparati
  e tutte le iniezioni in coda exactly-once scaricate per questa sessione. Restituisce
  `prependContext` o `appendContext`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi di sessione.
  Restituisce `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: viene eseguito solo per i turni heartbeat e restituisce
  `prependContext` o `appendContext`. È pensato per monitor in background
  che devono riassumere lo stato corrente senza modificare turni avviati dall'utente.

`before_agent_start` rimane per compatibilità. Preferisci gli hook espliciti sopra
così il tuo plugin non dipende da una fase combinata legacy.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva. Lo stesso valore è disponibile anche in `ctx.runId`.
Le esecuzioni guidate da Cron espongono anche `ctx.jobId` (l'ID del job Cron originario) così
gli hook dei plugin possono limitare metriche, effetti collaterali o stato a uno specifico job
pianificato.

Per le esecuzioni originate da canale, `ctx.messageProvider` è la superficie del provider come
`discord` o `telegram`, mentre `ctx.channelId` è l'identificatore della destinazione della conversazione
quando OpenClaw può ricavarne uno dalla chiave di sessione o dai metadati di consegna.

`agent_end` è un hook di osservazione e viene eseguito fire-and-forget dopo il turno. Il
runner degli hook applica un timeout di 30 secondi così un plugin bloccato o un endpoint
di embedding non può lasciare la promise dell'hook in sospeso per sempre. Un timeout viene registrato nei log e
OpenClaw continua; non annulla il lavoro di rete di proprietà del plugin a meno che
il plugin non usi anche un proprio segnale di abort.

Usa `model_call_started` e `model_call_ended` per telemetria delle chiamate al provider
che non dovrebbe ricevere prompt grezzi, cronologia, risposte, header, corpi delle richieste
o ID richiesta del provider. Questi hook includono metadati stabili come
`runId`, `callId`, `provider`, `model`, `api`/`transport` facoltativi, `durationMs`/`outcome` terminali
e `upstreamRequestIdHash` quando OpenClaw può derivare un hash limitato dell'ID richiesta
del provider.

`before_agent_finalize` viene eseguito solo quando un harness sta per accettare una risposta finale naturale
dell'assistente. Non è il percorso di annullamento `/stop` e non viene eseguito
quando l'utente interrompe un turno. Restituisci `{ action: "revise", reason }` per chiedere
all'harness un altro passaggio del modello prima della finalizzazione, `{ action:
"finalize", reason? }` per forzare la finalizzazione, oppure ometti un risultato per continuare.
Gli hook `Stop` nativi di Codex vengono inoltrati in questo hook come decisioni
`before_agent_finalize` di OpenClaw.

Quando restituiscono `action: "revise"`, i plugin possono includere metadati `retry` per rendere
il passaggio extra del modello limitato e sicuro per il replay:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` viene aggiunta al motivo di revisione inviato all'harness.
`idempotencyKey` consente all'host di contare i retry per la stessa richiesta del plugin tra
decisioni di finalizzazione equivalenti, e `maxAttempts` limita quanti passaggi extra
l'host permetterà prima di continuare con la risposta finale naturale.

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

### Estensioni di sessione e iniezioni per il turno successivo

I plugin di workflow possono rendere persistente un piccolo stato di sessione compatibile con JSON con
`api.registerSessionExtension(...)` e aggiornarlo tramite il metodo
`sessions.pluginPatch` del Gateway. Le righe di sessione proiettano lo stato dell'estensione registrata
tramite `pluginExtensions`, consentendo alla Control UI e ad altri client di visualizzare
lo stato di proprietà del plugin senza conoscere gli interni del plugin.

Usa `api.enqueueNextTurnInjection(...)` quando un plugin ha bisogno che un contesto durevole
raggiunga esattamente una volta il turno successivo del modello. OpenClaw svuota le injection in coda prima
degli hook del prompt, elimina le injection scadute e deduplica per `idempotencyKey`
per plugin. Questo è il seam corretto per riprese di approvazioni, riepiloghi di policy,
delta di monitor in background e continuazioni di comandi che devono essere visibili al
modello nel turno successivo ma non devono diventare testo permanente del prompt di sistema.

Le semantiche di pulizia fanno parte del contratto. La pulizia delle estensioni di sessione e
le callback di pulizia del ciclo di vita del runtime ricevono `reset`, `delete`, `disable` o
`restart`. L'host rimuove lo stato persistente dell'estensione di sessione del plugin proprietario
e le injection del turno successivo in sospeso per reset/delete/disable; restart mantiene
lo stato durevole della sessione mentre le callback di pulizia consentono ai plugin di rilasciare job dello scheduler,
contesto di esecuzione e altre risorse out-of-band per la vecchia generazione del runtime.

## Hook dei messaggi

Usa gli hook dei messaggi per routing a livello di canale e policy di consegna:

- `message_received`: osserva contenuto in ingresso, mittente, `threadId`, `messageId`,
  `senderId`, correlazione opzionale di run/sessione e metadati.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `message_sent`: osserva successo o errore finale.

Per risposte TTS solo audio, `content` può contenere la trascrizione parlata nascosta
anche quando il payload del canale non ha testo/caption visibile. Riscrivere quel
`content` aggiorna solo la trascrizione visibile all'hook; non viene renderizzata come
caption multimediale.

I contesti degli hook dei messaggi espongono campi di correlazione stabili quando disponibili:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Preferisci
questi campi first-class prima di leggere i metadati legacy.

Preferisci i campi tipizzati `threadId` e `replyToId` prima di usare metadati specifici del canale.

Regole decisionali:

- `message_sending` con `cancel: true` è terminale.
- `message_sending` con `cancel: false` viene trattato come nessuna decisione.
- Il `content` riscritto continua verso gli hook con priorità inferiore, a meno che un hook successivo
  annulli la consegna.

## Hook di installazione

`before_install` viene eseguito dopo la scansione integrata per le installazioni di skill e plugin.
Restituisci risultati aggiuntivi o `{ block: true, blockReason }` per interrompere
l'installazione.

`block: true` è terminale. `block: false` viene trattato come nessuna decisione.

## Ciclo di vita del Gateway

Usa `gateway_start` per i servizi dei plugin che hanno bisogno di stato di proprietà del Gateway. Il
contesto espone `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per
ispezione e aggiornamenti del cron. Usa `gateway_stop` per pulire le risorse a lunga esecuzione.

Non fare affidamento sull'hook interno `gateway:startup` per i servizi runtime di proprietà del plugin.

`cron_changed` scatta per eventi del ciclo di vita del cron di proprietà del Gateway con un payload
di evento tipizzato che copre i motivi `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. L'evento trasporta uno snapshot `PluginHookGatewayCronJob`
(inclusi `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presenti) più un `PluginHookGatewayCronDeliveryStatus`
di `not-requested` | `delivered` | `not-delivered` | `unknown`. Gli eventi rimossi
trasportano comunque lo snapshot del job eliminato, così gli scheduler esterni possono
riconciliare lo stato. Usa `ctx.getCron?.()` e `ctx.config` dal contesto del runtime
quando sincronizzi scheduler di risveglio esterni, e mantieni OpenClaw come
fonte di verità per controlli di scadenza ed esecuzione.

## Deprecazioni imminenti

Alcune superfici adiacenti agli hook sono deprecate ma ancora supportate. Migra
prima della prossima major release:

- **Envelope di canale in testo semplice** negli handler `inbound_claim` e `message_received`.
  Leggi `BodyForAgent` e i blocchi strutturati del contesto utente
  invece di analizzare testo envelope piatto. Vedi
  [Envelope di canale in testo semplice → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** rimane per compatibilità. I nuovi plugin dovrebbero usare
  `before_model_resolve` e `before_prompt_build` invece della fase combinata.
- **`onResolution` in `before_tool_call`** ora usa l'unione tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) invece di una `string` libera.

Per l'elenco completo — registrazione della capability di memoria, profilo di thinking del provider,
provider di autenticazione esterni, tipi di discovery dei provider, accessor del runtime dei task
e la rinomina da `command-auth` a `command-status` — vedi
[Migrazione Plugin SDK → Deprecazioni attive](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Migrazione Plugin SDK](/it/plugins/sdk-migration) — deprecazioni attive e timeline di rimozione
- [Creare plugin](/it/plugins/building-plugins)
- [Panoramica Plugin SDK](/it/plugins/sdk-overview)
- [Entry point dei plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Interni dell'architettura dei plugin](/it/plugins/architecture-internals)
