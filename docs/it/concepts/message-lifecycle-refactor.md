---
read_when:
    - Refactoring del comportamento di invio o ricezione del canale
    - Modifica del turno del canale, dell'invio delle risposte, della coda in uscita, dello streaming di anteprima o delle API dei messaggi dell'SDK dei Plugin
    - Progettazione di un nuovo plugin di canale che richiede invii persistenti, ricevute, anteprime, modifiche o ritentativi
summary: Piano di progettazione per il ciclo di vita unificato e persistente di ricezione, invio, anteprima, modifica e streaming dei messaggi
title: Refactoring del ciclo di vita dei messaggi
x-i18n:
    generated_at: "2026-05-06T08:46:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Questa pagina è il progetto di riferimento per sostituire helper dispersi per turni di canale, dispatch delle risposte, streaming di anteprima e consegna in uscita con un unico ciclo di vita durevole dei messaggi.

La versione breve:

- Le primitive core dovrebbero essere **receive** e **send**, non **reply**.
- Una risposta è solo una relazione su un messaggio in uscita.
- Un turno è una comodità per l'elaborazione in ingresso, non il proprietario della consegna.
- L'invio deve essere basato sul contesto: `begin`, render, anteprima o stream, invio finale, commit, fail.
- Anche la ricezione deve essere basata sul contesto: normalizza, deduplica, instrada, registra, dispatch, ack della piattaforma, fail.
- L'SDK pubblico dei Plugin dovrebbe ridursi a una piccola superficie per i messaggi di canale.

## Problemi

Lo stack attuale dei canali è nato da diverse esigenze locali valide:

- Gli adapter semplici in ingresso usano `runtime.channel.turn.run`.
- Gli adapter ricchi usano `runtime.channel.turn.runPrepared`.
- Gli helper legacy usano `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, helper per payload di risposta, suddivisione in chunk delle risposte, riferimenti di risposta e helper runtime in uscita.
- Lo streaming di anteprima vive in dispatcher specifici del canale.
- La durabilità della consegna finale viene aggiunta intorno ai percorsi esistenti dei payload di risposta.

Questa forma risolve bug locali, ma lascia OpenClaw con troppi concetti pubblici e troppi punti in cui le semantiche di consegna possono divergere.

Il problema di affidabilità che lo ha esposto è:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

L'invariante target è più ampio di Telegram: una volta che il core decide che dovrebbe esistere un messaggio in uscita visibile, l'intento deve essere durevole prima che venga tentato l'invio alla piattaforma, e la ricevuta della piattaforma deve essere committata dopo il successo. Questo dà a OpenClaw un recupero at-least-once. Il comportamento exactly-once esiste solo per gli adapter che possono dimostrare idempotenza nativa o riconciliare un tentativo unknown-after-send rispetto allo stato della piattaforma prima del replay.

Questo è lo stato finale di questo refactor, non una descrizione di ogni percorso attuale. Durante la migrazione, gli helper in uscita esistenti possono ancora ricadere su un invio diretto quando le scritture best-effort in coda falliscono. Il refactor è completo solo quando gli invii finali durevoli falliscono in modo chiuso o effettuano esplicitamente opt-out con una policy non durevole documentata.

## Obiettivi

- Un unico ciclo di vita core per tutti i percorsi di ricezione e invio dei messaggi di canale.
- Invii finali durevoli per impostazione predefinita nel nuovo ciclo di vita dei messaggi dopo che un adapter dichiara un comportamento sicuro per il replay.
- Semantiche condivise di anteprima, modifica, stream, finalizzazione, retry, recupero e ricevuta.
- Una piccola superficie SDK dei Plugin che i plugin di terze parti possano imparare e mantenere.
- Compatibilità per i chiamanti `channel.turn` esistenti durante la migrazione.
- Punti di estensione chiari per nuove capability di canale.
- Nessun ramo specifico della piattaforma nel core.
- Nessun messaggio di canale token-delta. Lo streaming di canale rimane consegna di anteprima, modifica, append o blocco completato.
- Metadati strutturati di origine OpenClaw per output operativi/di sistema, così i fallimenti visibili del Gateway non rientrano nelle stanze condivise abilitate ai bot come prompt nuovi.

## Non obiettivi

- Non rimuovere `runtime.channel.turn.*` nella prima fase.
- Non forzare ogni canale nello stesso comportamento di trasporto nativo.
- Non insegnare al core i topic di Telegram, gli stream nativi di Slack, le redazioni Matrix, le card Feishu, la voce QQ o le attività Teams.
- Non pubblicare tutti gli helper interni di migrazione come API SDK stabile.
- Non fare in modo che i retry riproducano operazioni di piattaforma non idempotenti completate.

## Modello di riferimento

Vercel Chat ha un buon modello mentale pubblico:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- metodi adapter come `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` e fetch della cronologia
- un adapter di stato per deduplica, lock, code e persistenza

OpenClaw dovrebbe prendere in prestito il vocabolario, non copiare la superficie.

Ciò di cui OpenClaw ha bisogno oltre quel modello:

- Intenti di invio in uscita durevoli prima delle chiamate dirette al trasporto.
- Contesti di invio espliciti con begin, commit e fail.
- Contesti di ricezione che conoscono la policy di ack della piattaforma.
- Ricevute che sopravvivono al riavvio e possono guidare modifiche, eliminazioni, recupero e soppressione dei duplicati.
- Un SDK pubblico più piccolo. I plugin in bundle possono usare helper runtime interni, ma i plugin di terze parti dovrebbero vedere una sola API coerente per i messaggi.
- Comportamento specifico degli agenti: sessioni, trascrizioni, streaming a blocchi, avanzamento degli strumenti, approvazioni, direttive media, risposte silenziose e cronologia delle menzioni nei gruppi.

Le promesse in stile `thread.post()` non bastano per OpenClaw. Nascondono il confine transazionale che decide se un invio è recuperabile.

## Modello core

Il nuovo dominio dovrebbe vivere sotto un namespace core interno come `src/channels/message/*`.

Ha quattro concetti:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` possiede il ciclo di vita in ingresso.

`send` possiede il ciclo di vita in uscita.

`live` possiede anteprima, modifica, avanzamento e stato dello stream.

`state` possiede archiviazione durevole degli intenti, ricevute, idempotenza, recupero, lock e deduplica.

## Termini dei messaggi

### Messaggio

Un messaggio normalizzato è neutrale rispetto alla piattaforma:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### Target

Il target descrive dove vive il messaggio:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### Relazione

Reply è una relazione, non una radice API:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

Questo permette allo stesso percorso di invio di gestire risposte normali, notifiche Cron, prompt di approvazione, completamenti di task, invii da message-tool, invii da CLI o Control UI, risultati di subagent e invii di automazione.

### Origine

L'origine descrive chi ha prodotto un messaggio e come OpenClaw dovrebbe trattare gli echo di quel messaggio. È separata dalla relazione: un messaggio può essere una risposta a un utente e rimanere output operativo originato da OpenClaw.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

Il core possiede il significato dell'output originato da OpenClaw. I canali possiedono il modo in cui quell'origine viene codificata nel loro trasporto.

Il primo uso richiesto è l'output di fallimento del Gateway. Gli esseri umani dovrebbero comunque vedere messaggi come "Agent failed before reply" o "Missing API key", ma l'output operativo OpenClaw taggato non deve essere accettato come input scritto da bot in stanze condivise quando `allowBots` è abilitato.

### Ricevuta

Le ricevute sono di prima classe:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

Le ricevute sono il ponte dall'intento durevole alla futura modifica, eliminazione, finalizzazione dell'anteprima, soppressione dei duplicati e recupero.

Una ricevuta può descrivere un messaggio di piattaforma o una consegna multi-parte. Testo suddiviso in chunk, media più testo, voce più testo e fallback di card devono preservare tutti gli id di piattaforma pur esponendo un id primario per threading e modifiche successive.

## Contesto di ricezione

La ricezione non dovrebbe essere una semplice chiamata a un helper. Il core ha bisogno di un contesto che conosca deduplica, routing, registrazione della sessione e policy di ack della piattaforma.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Flusso di ricezione:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

Ack non è una sola cosa. Il contratto di ricezione deve tenere separati questi segnali:

- **Ack di trasporto:** comunica al Webhook o al socket della piattaforma che OpenClaw ha accettato l'envelope dell'evento. Alcune piattaforme lo richiedono prima del dispatch.
- **Ack dell'offset di polling:** avanza un cursore così lo stesso evento non viene recuperato di nuovo. Questo non deve avanzare oltre lavoro che non può essere recuperato.
- **Ack del record in ingresso:** conferma che OpenClaw ha persistito metadati in ingresso sufficienti per deduplicare e instradare una redelivery.
- **Ricevuta visibile all'utente:** comportamento facoltativo di lettura/stato/typing; mai un confine di durabilità.

`ReceiveAckPolicy` controlla solo il riconoscimento di trasporto o polling. Non deve essere riutilizzata per ricevute di lettura o reazioni di stato.

Prima dell'autorizzazione del bot, la ricezione deve applicare la policy condivisa degli echo OpenClaw quando il canale può decodificare i metadati di origine del messaggio:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

Questo drop è basato sui tag, non sul testo. Un messaggio di stanza scritto da bot con lo stesso testo visibile di fallimento del Gateway ma senza metadati di origine OpenClaw passa comunque attraverso la normale autorizzazione `allowBots`.

La policy di ack è esplicita:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Il polling di Telegram ora usa la policy di ack del contesto di ricezione per il suo watermark di riavvio persistito. Il tracker osserva ancora gli aggiornamenti grammY mentre entrano nella catena middleware, ma OpenClaw persiste solo l'id aggiornamento completato sicuro dopo un dispatch riuscito, lasciando gli aggiornamenti falliti o pendenti inferiori riproducibili dopo un riavvio. L'offset di fetch `getUpdates` upstream di Telegram è ancora controllato dalla libreria di polling, quindi il restante intervento più profondo è una sorgente di polling completamente durevole se abbiamo bisogno di redelivery a livello piattaforma oltre il watermark di riavvio di OpenClaw. Le piattaforme Webhook possono richiedere ack HTTP immediato, ma hanno comunque bisogno di deduplica in ingresso e intenti di invio in uscita durevoli perché i Webhook possono effettuare redelivery.

## Contesto di invio

Anche l'invio è basato sul contesto:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Orchestrazione preferita:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

L'helper si espande in:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

L'intento deve esistere prima dell'I/O di trasporto. Un riavvio dopo l'inizio ma prima del
commit è recuperabile.

Il confine pericoloso è dopo il successo della piattaforma e prima del commit della ricevuta. Se un
processo termina lì, OpenClaw non può sapere se il messaggio della piattaforma esiste
a meno che l'adattatore non fornisca idempotenza nativa o un percorso di riconciliazione della ricevuta.
Quei tentativi devono riprendere in `unknown_after_send`, non essere rieseguiti alla cieca. I canali
senza riconciliazione possono scegliere una riesecuzione at-least-once solo se i messaggi visibili
duplicati sono un compromesso accettabile e documentato per quel canale e quella relazione.
L'attuale bridge di riconciliazione dell'SDK richiede all'adattatore di dichiarare
`reconcileUnknownSend`, quindi chiede a `durableFinal.reconcileUnknownSend` di
classificare una voce sconosciuta come `sent`, `not_sent` o `unresolved`; solo `not_sent`
consente la riesecuzione, e le voci non risolte restano terminali o riprovano solo il
controllo di riconciliazione.

La policy di durabilità deve essere esplicita:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` significa che il core deve fallire in modo chiuso quando non può scrivere l'intento durevole.
`best_effort` può proseguire quando la persistenza non è disponibile. `disabled` mantiene
il vecchio comportamento di invio diretto. Durante la migrazione, i wrapper legacy e gli helper pubblici
di compatibilità usano come valore predefinito `disabled`; non devono dedurre `required` dal
fatto che un canale abbia un adattatore in uscita generico.

I contesti di invio possiedono anche gli effetti post-invio locali al canale. Una migrazione non è sicura
se la consegna durevole aggira un comportamento locale che in precedenza era collegato al
percorso di invio diretto del canale. Gli esempi includono cache di soppressione del self-echo,
marcatori di partecipazione ai thread, ancore di modifica native, rendering della firma del modello
e protezioni contro i duplicati specifiche della piattaforma. Questi effetti devono essere spostati
nell'adattatore di invio, nell'adattatore di rendering o in un hook di contesto di invio denominato prima che
quel canale possa abilitare la consegna finale generica durevole.

Gli helper di invio devono restituire le ricevute fino al chiamante. I wrapper durevoli
non possono inghiottire gli ID dei messaggi o sostituire un risultato di consegna del canale con
`undefined`; i dispatcher bufferizzati usano quegli ID per ancore di thread, modifiche successive,
finalizzazione dell'anteprima e soppressione dei duplicati.

Gli invii di fallback operano su batch, non su payload singoli. Le riscritture di risposta silenziosa,
il fallback dei media, il fallback delle card e la proiezione dei chunk possono tutti produrre più di
un messaggio consegnabile, quindi un contesto di invio deve consegnare l'intero
batch proiettato oppure documentare esplicitamente perché è valido un solo payload.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

Quando un fallback di questo tipo è durevole, l'intero batch proiettato deve essere rappresentato da
un solo intento di invio durevole o da un altro piano di batch atomico. Registrare ogni payload
uno per uno non basta: un crash tra i payload può lasciare un fallback visibile parziale
senza alcun record durevole per i payload rimanenti. Il recupero deve sapere
quali unità hanno già ricevute e rieseguire solo le unità mancanti oppure contrassegnare
il batch come `unknown_after_send` finché l'adattatore non lo riconcilia.

## Contesto live

Il comportamento di anteprima, modifica, avanzamento e streaming dovrebbe essere un unico ciclo di vita opt-in.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

Lo stato live è abbastanza durevole da recuperare o sopprimere i duplicati:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

Questo dovrebbe coprire il comportamento attuale:

- Invio Telegram più anteprima modificabile, con finale fresco dopo che l'età dell'anteprima diventa obsoleta.
- Invio Discord più anteprima modificabile, annullamento su media/errore/risposta esplicita.
- Stream nativo Slack o anteprima bozza in base alla forma del thread.
- Finalizzazione del post bozza Mattermost.
- Finalizzazione dell'evento bozza Matrix o redazione in caso di mancata corrispondenza.
- Stream di avanzamento nativo Teams.
- Stream QQ Bot o fallback accumulato.

## Superficie dell'adattatore

Il target SDK pubblico dovrebbe essere un unico sottopercorso:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

Forma target:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

Adattatore di invio:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

Adattatore di ricezione:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Prima dell'autorizzazione preflight, il core deve eseguire il predicato echo condiviso di OpenClaw
ogni volta che `origin.decode` restituisce metadati di origine OpenClaw. L'adattatore di ricezione
fornisce fatti della piattaforma come l'autore bot e la forma della stanza; il core possiede la decisione
di scarto e l'ordinamento, così i canali non reimplementano filtri testuali.

Adattatore di origine:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Il core imposta `MessageOrigin`. I canali lo traducono solo da e verso i metadati
di trasporto nativi. Slack lo mappa a `chat.postMessage({ metadata })` e
`message.metadata` in ingresso; Matrix può mapparlo a contenuto evento extra; i canali
senza metadati nativi possono usare un registro di ricevute/in uscita quando questa è la
migliore approssimazione disponibile.

Capacità:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## Riduzione dell'SDK pubblico

La nuova superficie pubblica dovrebbe assorbire o deprecare queste aree concettuali:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- la maggior parte degli usi pubblici di `outbound-runtime`
- helper ad hoc per il ciclo di vita dello stream bozza

I sottopercorsi di compatibilità possono rimanere come wrapper, ma i nuovi plugin di terze parti
non dovrebbero averne bisogno.

I plugin inclusi possono mantenere import di helper interni tramite sottopercorsi runtime
riservati durante la migrazione. La documentazione pubblica dovrebbe indirizzare gli autori di plugin a
`plugin-sdk/channel-message` quando esisterà.

## Relazione con il turno del canale

`runtime.channel.turn.*` dovrebbe restare durante la migrazione.

Dovrebbe diventare un adattatore di compatibilità:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

Anche `channel.turn.runPrepared` dovrebbe restare inizialmente:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Dopo che tutti i plugin inclusi e i percorsi di compatibilità di terze parti noti saranno collegati,
`channel.turn` potrà essere deprecato. Non dovrebbe essere rimosso finché non esisterà un
percorso di migrazione SDK pubblicato e test di contratto che provino che i vecchi plugin funzionano ancora
o falliscono con un chiaro errore di versione.

## Guardrail di compatibilità

Durante la migrazione, la consegna generica durevole è opt-in per qualsiasi canale il cui
callback di consegna esistente abbia effetti collaterali oltre a "invia questo payload".

I punti di ingresso legacy non sono durevoli per impostazione predefinita:

- `channel.turn.run` e `dispatchAssembledChannelTurn` usano il callback di
  consegna del canale a meno che quel canale non fornisca esplicitamente un oggetto
  policy/opzioni durevole revisionato.
- `channel.turn.runPrepared` resta di proprietà del canale finché il dispatcher preparato
  non chiama esplicitamente il contesto di invio.
- Gli helper pubblici di compatibilità come `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` e gli helper direct-DM non iniettano mai una consegna
  generica durevole prima del callback `deliver` o `reply` fornito dal chiamante.

Per i tipi di bridge di migrazione, `durable: undefined` significa "non durevole". Il
percorso durevole è abilitato solo da un valore policy/opzioni esplicito. `durable:
false` può rimanere come forma di compatibilità, ma l'implementazione non dovrebbe
richiedere a ogni canale non migrato di aggiungerlo.

Il codice bridge attuale deve mantenere esplicita la decisione di durabilità:

- La consegna finale persistente restituisce uno stato discriminato. `handled_visible` e
  `handled_no_send` sono terminali; `unsupported` e `not_applicable` possono
  ripiegare sulla consegna gestita dal canale; `failed` propaga l'errore di invio.
- La consegna finale persistente generica è vincolata dalle capacità dell'adattatore,
  come consegna silenziosa, conservazione del target di risposta, conservazione
  delle citazioni native e hook di invio dei messaggi. La parità mancante dovrebbe
  scegliere la consegna gestita dal canale, non un invio generico che modifica il
  comportamento visibile all'utente.
- Gli invii persistenti basati su coda espongono un riferimento all'intento di consegna. I campi di sessione
  `pendingFinalDelivery*` esistenti possono trasportare l'id dell'intento durante la
  transizione; lo stato finale è uno store `MessageSendIntent` invece di testo di
  risposta congelato più campi di contesto ad hoc.

Non abilitare il percorso persistente generico per un canale finché tutte queste
condizioni non sono vere:

- L'adattatore di invio generico esegue lo stesso comportamento di rendering e trasporto del
  vecchio percorso diretto.
- Gli effetti collaterali locali successivi all'invio sono preservati tramite il contesto di invio.
- L'adattatore restituisce ricevute o risultati di consegna con tutti gli id dei messaggi
  della piattaforma.
- I percorsi del dispatcher preparato chiamano il nuovo contesto di invio oppure restano documentati
  come esterni alla garanzia persistente.
- La consegna di fallback gestisce ogni payload proiettato, non solo il primo.
- La consegna di fallback persistente registra l'intero array di payload proiettati come un unico
  intento riproducibile o piano batch.

Rischi concreti di migrazione da preservare:

- La consegna del monitor iMessage registra i messaggi inviati in una cache echo dopo un
  invio riuscito. Gli invii finali persistenti devono comunque popolare quella cache, altrimenti
  OpenClaw può reingerire le proprie risposte finali come messaggi utente in ingresso.
- Tlon aggiunge una firma opzionale del modello e registra i thread partecipati
  dopo le risposte di gruppo. La consegna persistente generica non deve aggirare questi effetti;
  spostali negli adattatori di rendering/invio/finalizzazione di Tlon oppure mantieni Tlon sul
  percorso gestito dal canale.
- Discord e altri dispatcher preparati possiedono già il comportamento di consegna diretta e anteprima.
  Non sono coperti da una garanzia persistente del turno assemblato finché
  i loro dispatcher preparati non instradano esplicitamente le finali tramite il contesto di invio.
- La consegna di fallback silenziosa di Telegram deve consegnare l'intero array di payload
  proiettati. Una scorciatoia a payload singolo può eliminare payload di fallback aggiuntivi dopo
  la proiezione.
- LINE, BlueBubbles, Zalo, Nostr e altri percorsi assemblati/helper esistenti possono
  avere gestione dei token di risposta, proxy dei media, cache dei messaggi inviati, pulizia di
  caricamento/stato o target solo callback. Restano sulla consegna gestita dal canale finché
  queste semantiche non sono rappresentate dall'adattatore di invio e verificate dai test.
- Gli helper per DM diretti possono avere una callback di risposta che è l'unico target di trasporto
  corretto. L'outbound generico non deve dedurre da `OriginatingTo` o `To` e saltare
  quella callback.
- L'output di errore del Gateway OpenClaw deve restare visibile agli esseri umani, ma gli echo
  di stanze taggati e generati da bot devono essere scartati prima dell'autorizzazione `allowBots`.
  I canali non devono implementarlo con filtri su prefissi di testo visibile, se non come
  breve misura di emergenza; il contratto persistente è metadati strutturati sull'origine.

## Archiviazione interna

La coda persistente dovrebbe archiviare intenti di invio dei messaggi, non payload di risposta.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

Ciclo di recupero:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

La coda dovrebbe conservare abbastanza identità da riprodurre tramite lo stesso account,
thread, target, criterio di formattazione e regole dei media dopo il riavvio.

## Classi di errore

Gli adattatori di canale classificano gli errori di trasporto in categorie chiuse:

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

Criteri del core:

- Ritentare `transient` e `rate_limit`.
- Non ritentare `invalid_payload` a meno che esista un fallback di rendering.
- Non ritentare `auth` o `permission` finché la configurazione non cambia.
- Per `not_found`, consentire alla finalizzazione live di ripiegare dalla modifica a un nuovo invio quando
  il canale dichiara che è sicuro.
- Per `conflict`, usare le regole di ricevuta/idempotenza per decidere se il messaggio
  esiste già.
- Qualsiasi errore dopo che l'adattatore potrebbe aver completato l'I/O della piattaforma ma prima del commit
  della ricevuta diventa `unknown_after_send`, a meno che l'adattatore non possa dimostrare che l'operazione
  della piattaforma non è avvenuta.

## Mappatura dei canali

| Canale                   | Migrazione di destinazione                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Riceve la policy di ack più invii finali durevoli. L'adattatore live possiede invio più modifica dell'anteprima, invio finale dell'anteprima obsoleta, topic, salto dell'anteprima per quote-reply, fallback dei media e gestione di retry-after.                                                                                                                                                                   |
| Discord                  | L'adattatore di invio incapsula la consegna durevole esistente dei payload. L'adattatore live possiede modifica della bozza, bozza di avanzamento, annullamento dell'anteprima media/errore, conservazione del target di risposta e ricevute degli ID messaggio. Verificare gli echi di gateway-failure creati da bot in stanze condivise; usare un registro in uscita o altro equivalente nativo se Discord non può trasportare metadati di origine sui messaggi normali. |
| Slack                    | L'adattatore di invio gestisce i normali post di chat. L'adattatore live sceglie lo stream nativo quando la forma del thread lo supporta, altrimenti l'anteprima bozza. Le ricevute preservano i timestamp del thread. L'adattatore di origine mappa gli errori del Gateway OpenClaw su `chat.postMessage.metadata` di Slack ed elimina gli echi bot-room taggati prima dell'autorizzazione `allowBots`.                                  |
| WhatsApp                 | L'adattatore di invio possiede l'invio di testo/media con intent finali durevoli. L'adattatore di ricezione gestisce la menzione del gruppo e l'identità del mittente. Live può restare assente finché WhatsApp non dispone di un trasporto modificabile.                                                                                                                                                                        |
| Matrix                   | L'adattatore live possiede modifiche degli eventi bozza, finalizzazione, redazione, vincoli dei media cifrati e fallback per mancata corrispondenza del target di risposta. L'adattatore di ricezione possiede idratazione e deduplicazione degli eventi cifrati. L'adattatore di origine dovrebbe codificare l'origine gateway-failure di OpenClaw nel contenuto dell'evento Matrix ed eliminare gli echi di stanza del bot configurato prima della gestione `allowBots`.              |
| Mattermost               | L'adattatore live possiede un singolo post bozza, folding di avanzamento/strumenti, finalizzazione sul posto e fallback con nuovo invio.                                                                                                                                                                                                                                                       |
| Microsoft Teams          | L'adattatore live possiede l'avanzamento nativo e il comportamento dello stream a blocchi. L'adattatore di invio possiede attività e ricevute di allegati/schede.                                                                                                                                                                                                                                        |
| Feishu                   | L'adattatore di rendering possiede rendering testo/scheda/raw. L'adattatore live possiede schede in streaming e soppressione dei finali duplicati. L'adattatore di invio possiede commenti, sessioni topic, media e soppressione vocale.                                                                                                                                                                      |
| QQ Bot                   | L'adattatore live possiede streaming C2C, timeout dell'accumulatore e invio finale di fallback. L'adattatore di rendering possiede tag media e testo-come-voce.                                                                                                                                                                                                                               |
| Signal                   | Adattatore semplice di ricezione più invio. Nessun adattatore live a meno che signal-cli non aggiunga supporto affidabile per le modifiche.                                                                                                                                                                                                                                                                |
| iMessage and BlueBubbles | Adattatore semplice di ricezione più invio. L'invio iMessage deve preservare il popolamento della cache degli echi del monitor prima che i finali durevoli possano bypassare la consegna del monitor. Digitazione, reazioni e allegati specifici di BlueBubbles restano capacità dell'adattatore.                                                                                                                            |
| Google Chat              | Adattatore semplice di ricezione più invio con relazione del thread mappata a spazi e ID thread. Verificare il comportamento della stanza `allowBots=true` per echi gateway-failure OpenClaw taggati.                                                                                                                                                                                        |
| LINE                     | Adattatore semplice di ricezione più invio con vincoli del token di risposta modellati come capacità target/relazione.                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | Bridge di ricezione SDK più adattatore di invio.                                                                                                                                                                                                                                                                                                                          |
| IRC                      | Adattatore semplice di ricezione più invio, senza ricevute di modifica durevoli.                                                                                                                                                                                                                                                                                                    |
| Nostr                    | Adattatore di ricezione più invio per DM cifrati; le ricevute sono ID evento.                                                                                                                                                                                                                                                                                           |
| QA Channel               | Adattatore di contract-test per comportamento di ricezione, invio, live, retry e ripristino.                                                                                                                                                                                                                                                                                   |
| Synology Chat            | Adattatore semplice di ricezione più invio.                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | L'adattatore di invio deve preservare rendering della firma del modello e tracciamento dei thread partecipati prima che venga abilitata la consegna finale durevole generica.                                                                                                                                                                                                                        |
| Twitch                   | Adattatore semplice di ricezione più invio con classificazione del rate-limit.                                                                                                                                                                                                                                                                                               |
| Zalo                     | Adattatore semplice di ricezione più invio.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | Adattatore semplice di ricezione più invio.                                                                                                                                                                                                                                                                                                                              |

## Piano di migrazione

### Fase 1: Dominio messaggi interno

- Aggiungere tipi `src/channels/message/*` per messaggi, target, relazioni,
  origini, ricevute, capacità, intent durevoli, contesto di ricezione, contesto
  di invio, contesto live e classi di errore.
- Aggiungere `origin?: MessageOrigin` al tipo di payload del bridge di migrazione usato dalla
  consegna delle risposte corrente, poi spostare quel campo in `ChannelMessage` e nei tipi di
  messaggio renderizzati man mano che il refactor sostituisce i payload di risposta.
- Mantenerlo interno finché adattatori e test non confermano la forma.
- Aggiungere unit test puri per transizioni di stato e serializzazione.

### Fase 2: Core di invio durevole

- Spostare la coda in uscita esistente dalla durabilità dei payload di risposta agli intent di
  invio messaggi durevoli.
- Consentire a un intent di invio durevole di trasportare un array di payload proiettato o un piano batch, non
  soltanto un payload di risposta.
- Preservare il comportamento attuale di ripristino della coda tramite conversione di compatibilità.
- Fare in modo che `deliverOutboundPayloads` chiami `messages.send`.
- Rendere la durabilità dell'invio finale il default e fallire in modo chiuso quando l'intent durevole
  non può essere scritto nel nuovo ciclo di vita del messaggio, dopo che l'adattatore dichiara
  la sicurezza di replay. I percorsi esistenti di compatibilità channel-turn e SDK restano
  direct-send per default durante questa fase.
- Registrare le ricevute in modo coerente.
- Restituire ricevute e risultati di consegna al chiamante originale del dispatcher invece
  di trattare l'invio durevole come un effetto collaterale terminale.
- Persistire l'origine del messaggio attraverso gli intent di invio durevoli affinché ripristino, replay e
  invii a chunk preservino la provenienza operativa di OpenClaw.

### Fase 3: Bridge di Channel Turn

- Reimplementare `channel.turn.run` e `dispatchAssembledChannelTurn` sopra
  `messages.receive` e `messages.send`.
- Mantenere stabili i tipi di fact correnti.
- Mantenere per default il comportamento legacy. Un canale assembled-turn diventa durevole
  solo quando il suo adattatore vi aderisce esplicitamente con una policy di durabilità replay-safe.
- Mantenere `durable: false` come via di fuga di compatibilità per percorsi che finalizzano
  modifiche native e non possono ancora effettuare replay in sicurezza, ma non fare affidamento sui marker `false`
  per proteggere i canali non migrati.
- Impostare per default la durabilità assembled-turn solo nel nuovo ciclo di vita dei messaggi, dopo
  che la mappatura del canale dimostra che il percorso di invio generico preserva la vecchia
  semantica di consegna del canale.

### Fase 4: Bridge del Dispatcher preparato

- Sostituire `deliverDurableInboundReplyPayload` con un bridge di contesto di invio.
- Mantenere il vecchio helper come wrapper.
- Effettuare prima il porting di Telegram, WhatsApp, Slack, Signal, iMessage e Discord perché
  hanno già lavoro su final durable o percorsi di invio più semplici.
- Considerare ogni dispatcher preparato come non coperto finché non opta esplicitamente per
  il contesto di invio. La documentazione e le voci del changelog devono dire "assembled
  channel turns" o nominare i percorsi dei canali migrati invece di dichiarare tutte le
  risposte finali automatiche.
- Mantenere `recordInboundSessionAndDispatchReply`, gli helper direct-DM e helper pubblici
  di compatibilità simili preservandone il comportamento. Potranno esporre in seguito un opt-in
  esplicito al contesto di invio, ma non devono tentare automaticamente una delivery durable
  generica prima della callback di delivery posseduta dal chiamante.

### Fase 5: ciclo di vita live unificato

- Creare `messages.live` con due adapter di prova:
  - Telegram per invio più modifica più invio finale obsoleto.
  - Matrix per finalizzazione della bozza più fallback di redazione.
- Quindi migrare Discord, Slack, Mattermost, Teams, QQ Bot e Feishu.
- Eliminare il codice duplicato di finalizzazione della preview solo dopo che ogni canale ha
  test di parità.

### Fase 6: SDK pubblico

- Aggiungere `openclaw/plugin-sdk/channel-message`.
- Documentarlo come API preferita per i Plugin di canale.
- Aggiornare export del pacchetto, inventario degli entrypoint, baseline API generate e
  documentazione dell'SDK dei Plugin.
- Includere `MessageOrigin`, hook di codifica/decodifica dell'origine e il predicato condiviso
  `shouldDropOpenClawEcho` nella superficie SDK channel-message.
- Mantenere wrapper di compatibilità per i vecchi sottopercorsi.
- Contrassegnare gli helper SDK con nome reply come deprecati nella documentazione dopo la
  migrazione dei plugin inclusi.

### Fase 7: tutti i mittenti

Spostare tutti i produttori outbound non-reply su `messages.send`:

- notifiche Cron e Heartbeat
- completamenti dei task
- risultati degli hook
- prompt di approvazione e risultati di approvazione
- invii dello strumento messaggi
- annunci di completamento dei subagent
- invii espliciti da CLI o Control UI
- percorsi di automazione/broadcast

Qui il modello smette di essere "risposte dell'agente" e diventa "OpenClaw invia
messaggi".

### Fase 8: deprecare Turn

- Mantenere `channel.turn` come wrapper per almeno una finestra di compatibilità.
- Pubblicare note di migrazione.
- Eseguire i test di compatibilità dell'SDK dei Plugin contro i vecchi import.
- Rimuovere o nascondere i vecchi helper interni solo dopo che nessun plugin incluso ne ha più
  bisogno e i contratti di terze parti hanno un sostituto stabile.

## Piano di test

Test unitari:

- Serializzazione e recovery dell'intent di invio durable.
- Riutilizzo della chiave di idempotenza e soppressione dei duplicati.
- Commit della ricevuta e salto del replay.
- Recovery `unknown_after_send` che riconcilia prima del replay quando un adapter
  supporta la riconciliazione.
- Criterio di classificazione degli errori.
- Sequenziamento del criterio di ack in ricezione.
- Mappatura delle relazioni per invii reply, followup, system e broadcast.
- Factory di origine per errore del Gateway e predicato `shouldDropOpenClawEcho`.
- Conservazione dell'origine attraverso normalizzazione del payload, chunking, serializzazione
  della coda durable e recovery.

Test di integrazione:

- L'adapter semplice `channel.turn.run` registra e invia ancora.
- La delivery legacy assembled-turn non diventa durable a meno che il canale non opti
  esplicitamente per farlo.
- Il bridge `channel.turn.runPrepared` registra e finalizza ancora.
- Gli helper pubblici di compatibilità chiamano per impostazione predefinita le callback di
  delivery possedute dal chiamante e non eseguono un invio generico prima di tali callback.
- La delivery fallback durable riproduce l'intero array di payload proiettati dopo il riavvio e
  non può lasciare i payload successivi non registrati dopo un crash iniziale.
- La delivery durable assembled-turn restituisce gli id dei messaggi della piattaforma al
  dispatcher bufferizzato.
- Gli hook di delivery personalizzati restituiscono ancora gli id dei messaggi della piattaforma
  quando la delivery durable è disabilitata o non disponibile.
- La risposta finale sopravvive a un riavvio tra il completamento dell'assistente e l'invio alla
  piattaforma.
- La bozza di preview viene finalizzata in place quando consentito.
- La bozza di preview viene annullata o redatta quando una mancata corrispondenza di media/errore/
  target della reply richiede una delivery normale.
- Lo streaming a blocchi e lo streaming preview non consegnano entrambi lo stesso testo.
- I media trasmessi in streaming in anticipo non vengono duplicati nella delivery finale.

Test dei canali:

- Reply in topic Telegram con ack di polling ritardato fino al watermark completed sicuro del
  contesto di ricezione.
- Recovery del polling Telegram per aggiornamenti accettati ma non consegnati coperta dal modello
  persistito dell'offset safe-completed.
- La preview obsoleta di Telegram invia un finale nuovo e pulisce la preview.
- Il fallback silenzioso di Telegram invia ogni payload fallback proiettato.
- La durabilità del fallback silenzioso di Telegram registra atomicamente l'intero array fallback
  proiettato, non un singolo intent durable a payload singolo per ogni iterazione del ciclo.
- Annullamento preview Discord su media/errore/reply esplicita.
- I finali del dispatcher preparato di Discord passano attraverso il contesto di invio prima che
  documentazione o changelog dichiarino la durabilità delle final-reply di Discord.
- Gli invii final durable di iMessage popolano la cache echo dei messaggi inviati del monitor.
- I percorsi di delivery legacy LINE, BlueBubbles, Zalo e Nostr non vengono bypassati da un invio
  durable generico finché non esistono i relativi test di parità adapter.
- La delivery callback Direct-DM/Nostr resta autorevole a meno che non venga migrata esplicitamente
  a un target messaggio completo e a un adapter di invio replay-safe.
- I messaggi Slack di errore del gateway OpenClaw taggati restano visibili in outbound, gli echo
  bot-room taggati vengono eliminati prima di `allowBots` e i messaggi bot non taggati con lo
  stesso testo visibile seguono ancora la normale autorizzazione bot.
- Fallback dello stream nativo Slack a preview di bozza nei DM di primo livello.
- Finalizzazione preview Matrix e fallback di redazione.
- Gli echo stanza da account bot configurati per errori gateway OpenClaw taggati in Matrix vengono
  eliminati prima della gestione di `allowBots`.
- Gli audit della cascata di errori gateway in stanze condivise Discord e Google Chat coprono le
  modalità `allowBots` prima di dichiarare protezione generica lì.
- Finalizzazione bozza Mattermost e fallback con nuovo invio.
- Finalizzazione del progresso nativo Teams.
- Soppressione del finale duplicato Feishu.
- Fallback su timeout dell'accumulatore QQ Bot.
- Gli invii final durable Tlon preservano il rendering model-signature e il tracciamento dei thread
  partecipati.
- Invii finali durable semplici per WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr,
  Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal.

Validazione:

- File Vitest mirati durante lo sviluppo.
- `pnpm check:changed` in Testbox per l'intera superficie modificata.
- `pnpm check` più ampio in Testbox prima di effettuare il landing del refactor completo o dopo
  modifiche a SDK/export pubblici.
- Smoke live o qa-channel per almeno un canale con capacità di modifica e un canale semplice
  solo-invio prima di rimuovere i wrapper di compatibilità.

## Questioni aperte

- Se Telegram debba eventualmente sostituire la sorgente runner grammY con una sorgente di polling
  completamente durable che possa controllare la redelivery a livello piattaforma, non solo il
  watermark di riavvio persistito di OpenClaw.
- Se lo stato durable della preview live debba essere archiviato nello stesso record di coda
  dell'intent di invio finale o in uno store live-state fratello.
- Per quanto tempo i wrapper di compatibilità restano documentati dopo la pubblicazione di
  `plugin-sdk/channel-message`.
- Se i plugin di terze parti debbano implementare direttamente gli adapter di ricezione o fornire
  solo hook normalize/send/live tramite `defineChannelMessageAdapter`.
- Quali campi delle ricevute siano sicuri da esporre nell'SDK pubblico rispetto allo stato runtime
  interno.
- Se effetti collaterali come cache self-echo e marker di thread partecipati debbano essere
  modellati come hook di contesto di invio, step finalize posseduti dall'adapter o subscriber alle
  ricevute.
- Quali canali abbiano metadati di origine nativi, quali necessitino di registry outbound
  persistiti e quali non possano offrire soppressione affidabile degli echo cross-bot.

## Criteri di accettazione

- Ogni canale messaggi incluso invia l'output finale visibile tramite
  `messages.send`.
- Ogni canale messaggi inbound entra tramite `messages.receive` o un wrapper di compatibilità
  documentato.
- Ogni canale preview/edit/stream usa `messages.live` per stato bozza e finalizzazione.
- `channel.turn` è solo un wrapper.
- Gli helper SDK con nome reply sono export di compatibilità, non il percorso raccomandato.
- La recovery durable può riprodurre gli invii finali pendenti dopo un riavvio senza perdere la
  risposta finale o duplicare invii già committati; gli invii il cui esito sulla piattaforma è
  sconosciuto vengono riconciliati prima del replay o documentati come at-least-once per
  quell'adapter.
- Gli invii final durable falliscono chiusi quando l'intent durable non può essere scritto,
  a meno che un chiamante non abbia selezionato esplicitamente una modalità non durable documentata.
- Gli helper di compatibilità legacy channel-turn e SDK usano per impostazione predefinita la
  delivery diretta posseduta dal canale; l'invio durable generico è solo opt-in esplicito.
- Le ricevute preservano tutti gli id dei messaggi della piattaforma per delivery multi-parte e un
  id primario per praticità di threading/modifica.
- I wrapper durable preservano gli effetti collaterali locali al canale prima di sostituire le
  callback di delivery diretta.
- I dispatcher preparati non vengono conteggiati come durable finché il loro percorso di delivery
  finale non usa esplicitamente il contesto di invio.
- La delivery fallback gestisce ogni payload proiettato.
- La delivery fallback durable registra ogni payload proiettato in un unico intent o batch plan
  riproducibile.
- L'output di errore gateway originato da OpenClaw è visibile agli esseri umani, ma gli echo stanza
  scritti da bot taggati vengono eliminati prima dell'autorizzazione bot sui canali che dichiarano
  supporto per il contratto di origine.
- La documentazione spiega invio, ricezione, live, stato, ricevute, relazioni, criterio di errore,
  migrazione e copertura dei test.

## Correlati

- [Messaggi](/it/concepts/messages)
- [Streaming e chunking](/it/concepts/streaming)
- [Bozze di progresso](/it/concepts/progress-drafts)
- [Criterio di retry](/it/concepts/retry)
- [Kernel di channel turn](/it/plugins/sdk-channel-turn)
