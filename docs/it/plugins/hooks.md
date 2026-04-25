---
read_when:
    - Stai creando un Plugin che richiede `before_tool_call`, `before_agent_reply`, hook dei messaggi o hook del ciclo di vita
    - Devi bloccare, riscrivere o richiedere approvazione per le chiamate agli strumenti da un Plugin
    - Stai decidendo tra hook interni e hook dei Plugin
summary: 'Hook dei Plugin: intercettano eventi del ciclo di vita dell''agente, degli strumenti, dei messaggi, delle sessioni e del Gateway'
title: Hook dei Plugin
x-i18n:
    generated_at: "2026-04-25T18:21:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fa7554227cbb5d283e74c16d7e12ef524c494b8bb117a7ff4b37b49daa18af
    source_path: plugins/hooks.md
    workflow: 15
---

Gli hook dei Plugin sono punti di estensione in-process per i Plugin OpenClaw. Usali
quando un Plugin deve ispezionare o modificare esecuzioni dell'agente, chiamate
agli strumenti, flusso dei messaggi, ciclo di vita della sessione, instradamento
dei sottoagenti, installazioni o avvio del Gateway.

Usa invece gli [hook interni](/it/automation/hooks) quando vuoi un piccolo script
`HOOK.md` installato dall'operatore per eventi di comandi e Gateway come
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registra hook di Plugin tipizzati con `api.on(...)` dal punto di ingresso del tuo Plugin:

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

Gli handler degli hook vengono eseguiti in sequenza in ordine decrescente di
`priority`. Gli hook con la stessa priorità mantengono l'ordine di registrazione.

## Catalogo degli hook

Gli hook sono raggruppati per superficie che estendono. I nomi in **grassetto** accettano un
risultato decisionale (blocco, annullamento, override o richiesta di approvazione); tutti gli altri sono solo di osservazione.

**Turno dell'agente**

- `before_model_resolve` — sovrascrive provider o modello prima che vengano caricati i messaggi della sessione
- `before_prompt_build` — aggiunge contesto dinamico o testo del system prompt prima della chiamata al modello
- `before_agent_start` — fase combinata solo per compatibilità; preferisci i due hook sopra
- **`before_agent_reply`** — interrompe il turno del modello con una risposta sintetica o silenzio
- `agent_end` — osserva i messaggi finali, lo stato di successo e la durata dell'esecuzione

**Osservazione della conversazione**

- `model_call_started` / `model_call_ended` — osservano metadati sanitizzati di chiamata provider/modello, tempistiche, esito e hash request-id delimitati senza contenuto di prompt o risposta
- `llm_input` — osserva l'input del provider (system prompt, prompt, cronologia)
- `llm_output` — osserva l'output del provider

**Strumenti**

- **`before_tool_call`** — riscrive i parametri dello strumento, blocca l'esecuzione o richiede approvazione
- `after_tool_call` — osserva risultati dello strumento, errori e durata
- **`tool_result_persist`** — riscrive il messaggio dell'assistente prodotto dal risultato di uno strumento
- **`before_message_write`** — ispeziona o blocca una scrittura di messaggio in corso (raro)

**Messaggi e consegna**

- **`inbound_claim`** — prende possesso di un messaggio in ingresso prima dell'instradamento all'agente (risposte sintetiche)
- `message_received` — osserva contenuto in ingresso, mittente, thread e metadati
- **`message_sending`** — riscrive il contenuto in uscita o annulla la consegna
- `message_sent` — osserva il successo o il fallimento della consegna in uscita
- **`before_dispatch`** — ispeziona o riscrive una dispatch in uscita prima del passaggio al canale
- **`reply_dispatch`** — partecipa alla pipeline finale di dispatch della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` — tracciano i confini del ciclo di vita della sessione
- `before_compaction` / `after_compaction` — osservano o annotano i cicli di Compaction
- `before_reset` — osserva gli eventi di reset della sessione (`/reset`, reset programmatici)

**Sottoagenti**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordinano l'instradamento e la consegna al completamento dei sottoagenti

**Ciclo di vita**

- `gateway_start` / `gateway_stop` — avviano o arrestano servizi di proprietà del Plugin insieme al Gateway
- **`before_install`** — ispeziona le scansioni di installazione di Skills o Plugin e può facoltativamente bloccarle

## Policy delle chiamate agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- facoltativamente `event.runId`
- facoltativamente `event.toolCallId`
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` e
  diagnostica `ctx.trace`

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

- `block: true` è terminale e salta gli handler con priorità inferiore.
- `block: false` viene trattato come nessuna decisione.
- `params` riscrive i parametri dello strumento per l'esecuzione.
- `requireApproval` mette in pausa l'esecuzione dell'agente e chiede all'utente tramite
  le approvazioni del Plugin. Il comando `/approve` può approvare sia approvazioni exec sia del Plugin.
- Un `block: true` a priorità inferiore può comunque bloccare dopo che un hook a priorità superiore
  ha richiesto approvazione.
- `onResolution` riceve la decisione di approvazione risolta — `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

## Hook di prompt e modello

Usa gli hook specifici per fase per i nuovi Plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati
  degli allegati. Restituisci `providerOverride` o `modelOverride`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi della sessione.
  Restituisci `prependContext`, `systemPrompt`, `prependSystemContext` o
  `appendSystemContext`.

`before_agent_start` rimane per compatibilità. Preferisci gli hook espliciti sopra
così il tuo Plugin non dipende da una fase combinata legacy.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva. Lo stesso valore è disponibile anche in `ctx.runId`.

Usa `model_call_started` e `model_call_ended` per telemetria delle chiamate provider
che non deve ricevere prompt grezzi, cronologia, risposte, header, body
della richiesta o request ID del provider. Questi hook includono metadati stabili come
`runId`, `callId`, `provider`, `model`, `api`/`transport` opzionali,
`durationMs`/`outcome` terminali e `upstreamRequestIdHash` quando OpenClaw può derivare un
hash delimitato del request-id del provider.

I Plugin non integrati che richiedono `llm_input`, `llm_output` o `agent_end` devono impostare:

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

Gli hook che modificano il prompt possono essere disabilitati per Plugin con
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hook dei messaggi

Usa gli hook dei messaggi per instradamento a livello di canale e policy di consegna:

- `message_received`: osserva contenuto in ingresso, mittente, `threadId`, `messageId`,
  `senderId`, correlazione facoltativa con esecuzione/sessione e metadati.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `message_sent`: osserva il successo o il fallimento finali.

Per le risposte TTS solo audio, `content` può contenere la trascrizione parlata nascosta
anche quando il payload del canale non ha testo/didascalia visibile. Riscrivere quel
`content` aggiorna solo la trascrizione visibile all'hook; non viene renderizzata come
didascalia del media.

I contesti degli hook dei messaggi espongono campi di correlazione stabili quando disponibili:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Preferisci
questi campi di prima classe prima di leggere metadati legacy.

Preferisci i campi tipizzati `threadId` e `replyToId` prima di usare
metadati specifici del canale.

Regole decisionali:

- `message_sending` con `cancel: true` è terminale.
- `message_sending` con `cancel: false` viene trattato come nessuna decisione.
- Il `content` riscritto continua verso gli hook con priorità inferiore a meno che un hook successivo
  annulli la consegna.

## Hook di installazione

`before_install` viene eseguito dopo la scansione integrata per installazioni di Skills e Plugin.
Restituisci risultati aggiuntivi o `{ block: true, blockReason }` per fermare
l'installazione.

`block: true` è terminale. `block: false` viene trattato come nessuna decisione.

## Ciclo di vita del Gateway

Usa `gateway_start` per servizi del Plugin che richiedono stato di proprietà del Gateway. Il
contesto espone `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per
ispezione e aggiornamenti di Cron. Usa `gateway_stop` per pulire risorse di lunga durata.

Non fare affidamento sull'hook interno `gateway:startup` per servizi runtime
di proprietà del Plugin.

## Deprecazioni imminenti

Alcune superfici adiacenti agli hook sono deprecate ma ancora supportate. Esegui la migrazione
prima della prossima major release:

- **Envelope di canale plaintext** negli handler `inbound_claim` e `message_received`.
  Leggi `BodyForAgent` e i blocchi strutturati di contesto utente
  invece di analizzare testo envelope piatto. Vedi
  [Envelope di canale plaintext → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** resta per compatibilità. I nuovi Plugin dovrebbero usare
  `before_model_resolve` e `before_prompt_build` invece della fase combinata.
- **`onResolution` in `before_tool_call`** ora usa la union tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) invece di una `string` libera.

Per l'elenco completo — registrazione delle capacità di memoria, profilo di thinking del provider, provider di autenticazione esterni, tipi di individuazione del provider, accessor del runtime dei task e la rinomina `command-auth` → `command-status` — vedi
[Plugin SDK migration → Deprecazioni attive](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Plugin SDK migration](/it/plugins/sdk-migration) — deprecazioni attive e timeline di rimozione
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Panoramica dell'SDK del Plugin](/it/plugins/sdk-overview)
- [Punti di ingresso del Plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Dettagli interni dell'architettura dei Plugin](/it/plugins/architecture-internals)
