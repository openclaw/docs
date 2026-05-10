---
read_when:
    - Refactoring del comportamento di invio o ricezione del canale
    - Modifica del turno del canale, dell'invio delle risposte, della coda in uscita, dello streaming di anteprima o delle API dei messaggi dell'SDK Plugin
    - Progettazione di un nuovo Plugin di canale che richiede invii durevoli, ricevute, anteprime, modifiche o tentativi повторati
summary: Piano di progettazione per il ciclo di vita unificato e persistente di ricezione, invio, anteprima, modifica e streaming dei messaggi
title: Refactoring del ciclo di vita dei messaggi
x-i18n:
    generated_at: "2026-05-10T19:31:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Questa pagina è il design di riferimento per sostituire gli helper sparsi per turni di canale, invio delle risposte, streaming di anteprima e consegna in uscita con un unico ciclo di vita del messaggio durevole.

La versione breve:

- Le primitive del core dovrebbero essere **receive** e **send**, non **reply**.
- Una risposta è solo una relazione su un messaggio in uscita.
- Un turno è una comodità per l'elaborazione in ingresso, non il proprietario della consegna.
- L'invio deve essere basato sul contesto: `begin`, rendering, anteprima o streaming, invio finale,
  commit, fail.
- Anche la ricezione deve essere basata sul contesto: normalizzazione, deduplicazione, instradamento, registrazione,
  dispatch, ack della piattaforma, fail.
- L'SDK pubblico dei plugin dovrebbe ridursi a una piccola superficie per i messaggi di canale.

## Problemi

Lo stack di canale attuale è cresciuto a partire da diverse esigenze locali valide:

- Gli adapter in ingresso semplici usano `runtime.channel.turn.run`.
- Gli adapter avanzati usano `runtime.channel.turn.runPrepared`.
- Gli helper legacy usano `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, helper per payload di risposta, suddivisione in parti delle risposte,
  riferimenti di risposta e helper runtime in uscita.
- Lo streaming di anteprima vive nei dispatcher specifici del canale.
- La durabilità della consegna finale viene aggiunta attorno ai percorsi esistenti dei payload di risposta.

Questa forma risolve bug locali, ma lascia OpenClaw con troppi concetti pubblici
e troppi punti in cui la semantica di consegna può divergere.

Il problema di affidabilità che lo ha evidenziato è:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

L'invariante obiettivo è più ampia di Telegram: una volta che il core decide che un messaggio in uscita visibile deve esistere, l'intento deve essere durevole prima che venga tentato l'invio alla piattaforma, e la ricevuta della piattaforma deve essere registrata dopo il successo. Questo dà a OpenClaw un recupero at-least-once. Il comportamento exactly-once esiste solo per gli adapter che possono dimostrare idempotenza nativa o riconciliare un tentativo con esito sconosciuto dopo l'invio rispetto allo stato della piattaforma prima del replay.

Questo è lo stato finale di questo refactor, non una descrizione di ogni percorso attuale. Durante la migrazione, gli helper in uscita esistenti possono ancora ricadere su un invio diretto quando le scritture best-effort in coda falliscono. Il refactor è completo solo quando gli invii finali durevoli falliscono in modo chiuso o scelgono esplicitamente di uscire con una policy non durevole documentata.

## Obiettivi

- Un unico ciclo di vita core per tutti i percorsi di ricezione e invio dei messaggi di canale.
- Invii finali durevoli per impostazione predefinita nel nuovo ciclo di vita dei messaggi dopo che un adapter
  dichiara un comportamento sicuro per il replay.
- Semantiche condivise per anteprima, modifica, streaming, finalizzazione, retry, recupero e ricevute.
- Una piccola superficie SDK dei plugin che i plugin di terze parti possano imparare e mantenere.
- Compatibilità per i chiamanti `channel.turn` esistenti durante la migrazione.
- Punti di estensione chiari per nuove capacità di canale.
- Nessun ramo specifico della piattaforma nel core.
- Nessun messaggio di canale token-delta. Lo streaming di canale rimane consegna tramite anteprima del messaggio,
  modifica, append o blocco completato.
- Metadati strutturati di origine OpenClaw per output operativi/di sistema, così che gli errori visibili del Gateway
  non rientrino nelle stanze condivise abilitate ai bot come nuovi prompt.

## Non obiettivi

- Non rimuovere `runtime.channel.turn.*` nella prima fase.
- Non forzare ogni canale nello stesso comportamento di trasporto nativo.
- Non insegnare al core topic Telegram, stream nativi Slack, redazioni Matrix,
  schede Feishu, voce QQ o attività Teams.
- Non pubblicare tutti gli helper interni di migrazione come API SDK stabile.
- Non fare in modo che i retry riproducano operazioni di piattaforma non idempotenti già completate.

## Modello di riferimento

Vercel Chat ha un buon modello mentale pubblico:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- metodi adapter come `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` e recuperi della cronologia
- un adapter di stato per deduplicazione, lock, code e persistenza

OpenClaw dovrebbe prendere in prestito il vocabolario, non copiare la superficie.

Ciò di cui OpenClaw ha bisogno oltre quel modello:

- Intenti di invio in uscita durevoli prima delle chiamate dirette al trasporto.
- Contesti di invio espliciti con begin, commit e fail.
- Contesti di ricezione che conoscono la policy di ack della piattaforma.
- Ricevute che sopravvivono al riavvio e possono guidare modifiche, eliminazioni, recupero e
  soppressione dei duplicati.
- Un SDK pubblico più piccolo. I plugin inclusi possono usare helper runtime interni, ma
  i plugin di terze parti dovrebbero vedere un'unica API coerente per i messaggi.
- Comportamento specifico dell'agente: sessioni, trascrizioni, streaming a blocchi, avanzamento degli strumenti, approvazioni, direttive media, risposte silenziose e cronologia delle menzioni nei gruppi.

Le promesse in stile `thread.post()` non sono sufficienti per OpenClaw. Nascondono il confine transazionale che decide se un invio è recuperabile.

## Modello core

Il nuovo dominio dovrebbe vivere sotto un namespace core interno come
`src/channels/message/*`.

Ha quattro concetti:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` possiede il ciclo di vita in ingresso.

`send` possiede il ciclo di vita in uscita.

`live` possiede anteprima, modifica, avanzamento e stato di streaming.

`state` possiede archiviazione durevole degli intenti, ricevute, idempotenza, recupero, lock e
deduplicazione.

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

### Destinazione

La destinazione descrive dove vive il messaggio:

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

La risposta è una relazione, non una radice API:

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

Questo consente allo stesso percorso di invio di gestire risposte normali, notifiche Cron, prompt di approvazione, completamenti di attività, invii tramite strumento messaggi, invii da CLI o Control UI, risultati di subagent e invii di automazione.

### Origine

L'origine descrive chi ha prodotto un messaggio e come OpenClaw dovrebbe trattare gli echo di quel messaggio. È separata dalla relazione: un messaggio può essere una risposta a un utente ed essere comunque output operativo originato da OpenClaw.

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

Il primo uso richiesto è l'output di errore del Gateway. Gli esseri umani dovrebbero comunque vedere messaggi come "Agente non riuscito prima della risposta" o "Chiave API mancante", ma l'output operativo OpenClaw taggato non deve essere accettato come input scritto da bot nelle stanze condivise quando `allowBots` è abilitato.

### Ricevuta

Le ricevute sono entità di prima classe:

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

Le ricevute sono il ponte dall'intento durevole a future modifiche, eliminazioni, finalizzazione dell'anteprima, soppressione dei duplicati e recupero.

Una ricevuta può descrivere un messaggio di piattaforma o una consegna in più parti. Testo suddiviso in parti, media più testo, voce più testo e fallback di schede devono preservare tutti gli ID di piattaforma pur esponendo un ID primario per threading e modifiche successive.

## Contesto di ricezione

La ricezione non dovrebbe essere una semplice chiamata helper. Il core ha bisogno di un contesto che conosca deduplicazione, instradamento, registrazione della sessione e policy di ack della piattaforma.

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

Ack non è una cosa sola. Il contratto di ricezione deve mantenere separati questi segnali:

- **Ack di trasporto:** comunica al Webhook o al socket della piattaforma che OpenClaw ha accettato
  l'envelope dell'evento. Alcune piattaforme lo richiedono prima del dispatch.
- **Ack dell'offset di polling:** avanza un cursore così che lo stesso evento non venga recuperato
  di nuovo. Non deve avanzare oltre lavoro che non può essere recuperato.
- **Ack del record in ingresso:** conferma che OpenClaw ha persistito abbastanza metadati in ingresso da
  deduplicare e instradare una riconsegna.
- **Ricevuta visibile all'utente:** comportamento opzionale di lettura/stato/digitazione; mai un
  confine di durabilità.

`ReceiveAckPolicy` controlla solo l'acknowledgement di trasporto o polling. Non deve essere riutilizzata per ricevute di lettura o reazioni di stato.

Prima dell'autorizzazione del bot, la ricezione deve applicare la policy condivisa di echo OpenClaw quando il canale può decodificare i metadati di origine del messaggio:

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

Questa esclusione è basata sui tag, non sul testo. Un messaggio di stanza scritto da bot con lo stesso testo visibile di errore del Gateway ma senza metadati di origine OpenClaw passa comunque attraverso la normale autorizzazione `allowBots`.

La policy di ack è esplicita:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Il polling Telegram ora usa la policy di ack del contesto di ricezione per il suo watermark di riavvio persistito. Il tracker osserva ancora gli aggiornamenti grammY mentre entrano nella catena middleware, ma OpenClaw persiste solo l'ID aggiornamento completato sicuro dopo un dispatch riuscito, lasciando gli aggiornamenti falliti o pendenti inferiori riproducibili dopo un riavvio. L'offset di fetch `getUpdates` upstream di Telegram è ancora controllato dalla libreria di polling, quindi l'intervento più profondo rimanente è una sorgente di polling completamente durevole se abbiamo bisogno di riconsegna a livello piattaforma oltre il watermark di riavvio di OpenClaw. Le piattaforme Webhook possono richiedere un ack HTTP immediato, ma hanno comunque bisogno di deduplicazione in ingresso e intenti di invio in uscita durevoli perché i Webhook possono riconsegnare.

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
a meno che l'adapter non fornisca idempotenza nativa o un percorso di riconciliazione della ricevuta.
Quei tentativi devono riprendere in `unknown_after_send`, non essere rieseguiti alla cieca. I canali
senza riconciliazione possono scegliere una riesecuzione at-least-once solo se i messaggi duplicati
visibili sono un compromesso accettabile e documentato per quel canale e quella relazione.
L'attuale bridge di riconciliazione SDK richiede che l'adapter dichiari
`reconcileUnknownSend`, poi chiede a `durableFinal.reconcileUnknownSend` di
classificare una voce sconosciuta come `sent`, `not_sent` o `unresolved`; solo `not_sent`
consente la riesecuzione, e le voci non risolte restano terminali o riprovano solo il
controllo di riconciliazione.

La policy di durabilità deve essere esplicita:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` significa che il core deve fallire in modo chiuso quando non può scrivere l'intento durevole.
`best_effort` può proseguire quando la persistenza non è disponibile. `disabled` mantiene
il vecchio comportamento di invio diretto. Durante la migrazione, i wrapper legacy e gli helper
pubblici di compatibilità hanno come default `disabled`; non devono dedurre `required` dal
fatto che un canale abbia un adapter di uscita generico.

I contesti di invio possiedono anche gli effetti post-invio locali del canale. Una migrazione non è sicura
se la consegna durevole aggira il comportamento locale che in precedenza era collegato al
percorso di invio diretto del canale. Gli esempi includono cache di soppressione del self-echo,
marcatori di partecipazione ai thread, ancore native di modifica, rendering della firma del modello
e protezioni anti-duplicato specifiche della piattaforma. Questi effetti devono spostarsi
nell'adapter di invio, nell'adapter di rendering o in un hook di contesto di invio nominato prima che
quel canale possa abilitare la consegna finale generica durevole.

Gli helper di invio devono restituire le ricevute fino al chiamante. I wrapper durevoli
non possono assorbire gli id dei messaggi o sostituire un risultato di consegna del canale con
`undefined`; i dispatcher con buffer usano quegli id per le ancore dei thread, le modifiche successive,
la finalizzazione dell'anteprima e la soppressione dei duplicati.

Gli invii di fallback operano su batch, non su singoli payload. Riscritture di risposta silenziosa,
fallback dei media, fallback delle card e proiezione dei chunk possono tutti produrre più di
un messaggio consegnabile, quindi un contesto di invio deve consegnare l'intero
batch proiettato o documentare esplicitamente perché sia valido un solo payload.

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

Quando un tale fallback è durevole, l'intero batch proiettato deve essere rappresentato da
un unico intento di invio durevole o da un altro piano di batch atomico. Registrare ciascun payload
uno alla volta non basta: un crash tra i payload può lasciare un fallback visibile parziale
senza alcun record durevole per i payload rimanenti. Il ripristino deve sapere
quali unità hanno già ricevute e rieseguire solo le unità mancanti oppure contrassegnare
il batch `unknown_after_send` finché l'adapter non lo riconcilia.

## Contesto live

I comportamenti di anteprima, modifica, avanzamento e stream dovrebbero essere un unico ciclo di vita opt-in.

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

- Invio Telegram più anteprima modificabile, con finale nuovo dopo l'invecchiamento dell'anteprima obsoleta.
- Invio Discord più anteprima modificabile, annullamento su media/errore/risposta esplicita.
- Stream nativo Slack o anteprima bozza in base alla forma del thread.
- Finalizzazione del post bozza Mattermost.
- Finalizzazione dell'evento bozza Matrix o redazione in caso di mancata corrispondenza.
- Stream di avanzamento nativo Teams.
- Stream QQ Bot o fallback accumulato.

## Superficie dell'adapter

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

Adapter di invio:

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

Adapter di ricezione:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Prima dell'autorizzazione preflight, il core deve eseguire il predicato echo condiviso di OpenClaw
ogni volta che `origin.decode` restituisce metadati di origine OpenClaw. L'adapter di ricezione
fornisce fatti della piattaforma come autore bot e forma della stanza; il core possiede la decisione
di scarto e l'ordinamento, così i canali non reimplementano filtri di testo.

Adapter di origine:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Il core imposta `MessageOrigin`. I canali lo traducono solo da e verso i metadati di
trasporto nativi. Slack lo mappa su `chat.postMessage({ metadata })` e
`message.metadata` in ingresso; Matrix può mapparlo su contenuto evento extra; i canali
senza metadati nativi possono usare un registro ricevute/uscite quando è la
migliore approssimazione disponibile.

Capability:

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

I plugin in bundle possono mantenere import di helper interni tramite sottopercorsi runtime
riservati durante la migrazione. La documentazione pubblica dovrebbe indirizzare gli autori di plugin a
`plugin-sdk/channel-message` una volta che esiste.

## Relazione con il turn del canale

`runtime.channel.turn.*` dovrebbe restare durante la migrazione.

Dovrebbe diventare un adapter di compatibilità:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` dovrebbe restare anch'esso inizialmente:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Dopo che tutti i plugin in bundle e i percorsi noti di compatibilità di terze parti saranno collegati,
`channel.turn` potrà essere deprecato. Non dovrebbe essere rimosso finché non esistono un
percorso di migrazione SDK pubblicato e test di contratto che dimostrino che i vecchi plugin funzionano ancora
o falliscono con un chiaro errore di versione.

## Guardrail di compatibilità

Durante la migrazione, la consegna generica durevole è opt-in per qualsiasi canale il cui
callback di consegna esistente abbia effetti collaterali oltre a "invia questo payload".

Gli entry point legacy sono non durevoli per impostazione predefinita:

- `channel.turn.run` e `dispatchAssembledChannelTurn` usano il callback di
  consegna del canale a meno che quel canale non fornisca esplicitamente un oggetto
  policy/opzioni durevoli verificato.
- `channel.turn.runPrepared` resta di proprietà del canale finché il dispatcher preparato
  non chiama esplicitamente il contesto di invio.
- Gli helper pubblici di compatibilità come `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` e gli helper direct-DM non iniettano mai una
  consegna generica durevole prima del callback `deliver` o `reply` fornito dal chiamante.

Per i tipi di bridge di migrazione, `durable: undefined` significa "non durevole". Il
percorso durevole è abilitato solo da un valore esplicito di policy/opzioni. `durable:
false` può rimanere come forma compatibile, ma l'implementazione non dovrebbe
richiedere a ogni canale non migrato di aggiungerla.

Il codice bridge attuale deve mantenere esplicita la decisione di durabilità:

- La consegna finale durevole restituisce uno stato discriminato. `handled_visible` e
  `handled_no_send` sono terminali; `unsupported` e `not_applicable` possono
  ricadere sulla consegna gestita dal canale; `failed` propaga l'errore di invio.
- La consegna finale durevole generica è vincolata dalle capacità dell'adattatore, come
  consegna silenziosa, preservazione del destinatario della risposta, preservazione
  della citazione nativa e hook di invio dei messaggi. In caso di parità mancante,
  scegliere la consegna gestita dal canale, non un invio generico che modifica il
  comportamento visibile all'utente.
- Gli invii durevoli supportati da coda espongono un riferimento di intento di consegna. I campi di sessione
  `pendingFinalDelivery*` esistenti possono trasportare l'id dell'intento durante la
  transizione; lo stato finale è uno store `MessageSendIntent` invece di testo di
  risposta congelato più campi di contesto ad hoc.

Non abilitare il percorso durevole generico per un canale finché tutte queste condizioni non sono
vere:

- L'adattatore di invio generico esegue lo stesso comportamento di rendering e trasporto del
  vecchio percorso diretto.
- Gli effetti collaterali locali successivi all'invio sono preservati tramite il contesto di invio.
- L'adattatore restituisce ricevute o risultati di consegna con tutti gli id dei messaggi della
  piattaforma.
- I percorsi del dispatcher preparato chiamano il nuovo contesto di invio oppure restano documentati
  come esterni alla garanzia durevole.
- La consegna di fallback gestisce ogni payload proiettato, non solo il primo.
- La consegna di fallback durevole registra l'intero array di payload proiettati come un unico
  intento riproducibile o piano batch.

Rischi concreti di migrazione da preservare:

- La consegna del monitor iMessage registra i messaggi inviati in una cache echo dopo un
  invio riuscito. Gli invii finali durevoli devono ancora popolare quella cache, altrimenti
  OpenClaw può reimportare le proprie risposte finali come messaggi utente in ingresso.
- Tlon aggiunge una firma opzionale del modello e registra i thread partecipati
  dopo le risposte di gruppo. La consegna durevole generica non deve aggirare questi effetti;
  spostarli negli adattatori di rendering/invio/finalizzazione di Tlon oppure mantenere Tlon sul
  percorso gestito dal canale.
- Discord e altri dispatcher preparati possiedono già il comportamento di consegna diretta e
  anteprima. Non sono coperti da una garanzia durevole del turno assemblato finché
  i loro dispatcher preparati non instradano esplicitamente i finali tramite il contesto di invio.
- La consegna di fallback silenziosa di Telegram deve consegnare l'intero array di payload
  proiettati. Una scorciatoia a payload singolo può eliminare payload di fallback aggiuntivi dopo
  la proiezione.
- LINE, Zalo, Nostr e altri percorsi assemblati/helper esistenti possono
  avere gestione dei token di risposta, proxying dei media, cache dei messaggi inviati, pulizia di
  caricamento/stato o destinazioni solo callback. Restano sulla consegna gestita dal canale finché
  tali semantiche non sono rappresentate dall'adattatore di invio e verificate dai test.
- Gli helper Direct-DM possono avere un callback di risposta che è l'unica destinazione di trasporto
  corretta. L'uscita generica non deve dedurre da `OriginatingTo` o `To` e saltare
  quel callback.
- L'output di errore del Gateway OpenClaw deve restare visibile agli umani, ma gli echo della stanza
  creati da bot e taggati devono essere scartati prima dell'autorizzazione `allowBots`.
  I canali non devono implementarlo con filtri su prefissi di testo visibile se non come
  breve misura di emergenza; il contratto durevole è costituito da metadati di origine strutturati.

## Archiviazione interna

La coda durevole dovrebbe archiviare intenti di invio dei messaggi, non payload di risposta.

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

Ciclo di ripristino:

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

La coda dovrebbe mantenere identità sufficiente per riprodurre tramite lo stesso account,
thread, target, criterio di formattazione e regole media dopo il riavvio.

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

Criterio core:

- Ritentare `transient` e `rate_limit`.
- Non ritentare `invalid_payload` a meno che esista un fallback di rendering.
- Non ritentare `auth` o `permission` finché la configurazione non cambia.
- Per `not_found`, consentire alla finalizzazione live di ricadere dalla modifica a un nuovo invio quando
  il canale dichiara che è sicuro.
- Per `conflict`, usare le regole di ricevuta/idempotenza per decidere se il messaggio
  esiste già.
- Qualsiasi errore dopo che l'adattatore potrebbe aver completato I/O della piattaforma ma prima del commit
  della ricevuta diventa `unknown_after_send` a meno che l'adattatore non possa provare che l'operazione
  della piattaforma non è avvenuta.

## Mappatura dei canali

| Canale         | Obiettivo della migrazione                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Policy di ack in ricezione più invii finali durevoli. L'adattatore live gestisce invio più anteprima di modifica, invio finale dell'anteprima obsoleta, argomenti, salto dell'anteprima di risposta con citazione, fallback dei media e gestione di retry-after.                                                                                                                                                                   |
| Discord         | L'adattatore di invio racchiude la distribuzione del payload durevole esistente. L'adattatore live gestisce modifica bozza, bozza di avanzamento, annullamento dell'anteprima per media/errori, conservazione del destinatario della risposta e ricevute degli ID messaggio. Verifica gli echi di errori Gateway creati da bot nelle stanze condivise; usa un registro in uscita o un altro equivalente nativo se Discord non può trasportare metadati di origine sui messaggi normali. |
| Slack           | L'adattatore di invio gestisce i normali post in chat. L'adattatore live sceglie lo stream nativo quando la forma del thread lo supporta, altrimenti l'anteprima bozza. Le ricevute conservano i timestamp del thread. L'adattatore di origine mappa gli errori Gateway di OpenClaw su `chat.postMessage.metadata` di Slack e scarta gli echi della stanza del bot contrassegnati prima dell'autorizzazione `allowBots`.                                  |
| WhatsApp        | L'adattatore di invio gestisce l'invio di testo/media con intenti finali durevoli. L'adattatore di ricezione gestisce la menzione di gruppo e l'identità del mittente. Live può restare assente finché WhatsApp non dispone di un trasporto modificabile.                                                                                                                                                                        |
| Matrix          | L'adattatore live gestisce modifiche agli eventi bozza, finalizzazione, redazione, vincoli dei media cifrati e fallback in caso di mancata corrispondenza del destinatario della risposta. L'adattatore di ricezione gestisce l'idratazione e la deduplicazione degli eventi cifrati. L'adattatore di origine dovrebbe codificare l'origine degli errori Gateway di OpenClaw nel contenuto degli eventi Matrix e scartare gli echi della stanza del bot configurato prima della gestione di `allowBots`.              |
| Mattermost      | L'adattatore live gestisce un post bozza, compressione di avanzamento/strumenti, finalizzazione sul posto e fallback con nuovo invio.                                                                                                                                                                                                                                                       |
| Microsoft Teams | L'adattatore live gestisce l'avanzamento nativo e il comportamento dello stream a blocchi. L'adattatore di invio gestisce attività e ricevute di allegati/schede.                                                                                                                                                                                                                                        |
| Feishu          | L'adattatore di rendering gestisce il rendering di testo/schede/raw. L'adattatore live gestisce schede in streaming e soppressione dei finali duplicati. L'adattatore di invio gestisce commenti, sessioni di argomento, media e soppressione della voce.                                                                                                                                                                      |
| QQ Bot          | L'adattatore live gestisce streaming C2C, timeout dell'accumulatore e invio finale di fallback. L'adattatore di rendering gestisce tag media e testo come voce.                                                                                                                                                                                                                               |
| Signal          | Semplice ricezione più adattatore di invio. Nessun adattatore live a meno che signal-cli non aggiunga un supporto di modifica affidabile.                                                                                                                                                                                                                                                                |
| iMessage        | Semplice ricezione più adattatore di invio. L'invio iMessage deve preservare il popolamento della cache degli echi del monitor prima che i finali durevoli possano bypassare la consegna tramite monitor.                                                                                                                                                                                                                 |
| Google Chat     | Semplice ricezione più adattatore di invio con relazione del thread mappata a spazi e ID thread. Verifica il comportamento della stanza con `allowBots=true` per gli echi di errori Gateway di OpenClaw contrassegnati.                                                                                                                                                                                        |
| LINE            | Semplice ricezione più adattatore di invio con vincoli del token di risposta modellati come capacità di target/relazione.                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | Bridge SDK di ricezione più adattatore di invio.                                                                                                                                                                                                                                                                                                                          |
| IRC             | Semplice ricezione più adattatore di invio, senza ricevute di modifica durevoli.                                                                                                                                                                                                                                                                                                    |
| Nostr           | Ricezione più adattatore di invio per DM cifrati; le ricevute sono ID evento.                                                                                                                                                                                                                                                                                           |
| QA Channel      | Adattatore di test del contratto per comportamento di ricezione, invio, live, nuovo tentativo e ripristino.                                                                                                                                                                                                                                                                                   |
| Synology Chat   | Semplice ricezione più adattatore di invio.                                                                                                                                                                                                                                                                                                                              |
| Tlon            | L'adattatore di invio deve preservare il rendering della firma del modello e il tracciamento dei thread partecipati prima che la consegna finale durevole generica venga abilitata.                                                                                                                                                                                                                        |
| Twitch          | Semplice ricezione più adattatore di invio con classificazione dei limiti di frequenza.                                                                                                                                                                                                                                                                                               |
| Zalo            | Semplice ricezione più adattatore di invio.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | Semplice ricezione più adattatore di invio.                                                                                                                                                                                                                                                                                                                              |

## Piano di migrazione

### Fase 1: Dominio messaggi interno

- Aggiungi i tipi `src/channels/message/*` per messaggi, target, relazioni,
  origini, ricevute, capacità, intenti durevoli, contesto di ricezione, contesto
  di invio, contesto live e classi di errore.
- Aggiungi `origin?: MessageOrigin` al tipo di payload del bridge di migrazione usato dalla
  consegna delle risposte corrente, poi sposta quel campo in `ChannelMessage` e nei tipi di
  messaggio renderizzati mentre il refactor sostituisce i payload di risposta.
- Mantienilo interno finché adattatori e test non dimostrano la forma.
- Aggiungi unit test puri per transizioni di stato e serializzazione.

### Fase 2: Core di invio durevole

- Sposta la coda in uscita esistente dalla durabilità dei payload di risposta agli intenti di
  invio messaggio durevoli.
- Consenti a un intento di invio durevole di trasportare un array di payload proiettato o un piano batch, non
  solo un payload di risposta.
- Preserva il comportamento corrente di ripristino della coda tramite conversione di compatibilità.
- Fai in modo che `deliverOutboundPayloads` chiami `messages.send`.
- Rendi la durabilità dell'invio finale l'impostazione predefinita e fallisci in modo chiuso quando l'intento durevole
  non può essere scritto nel nuovo ciclo di vita dei messaggi, dopo che l'adattatore dichiara
  la sicurezza del replay. I percorsi di compatibilità channel-turn e SDK esistenti restano
  direct-send per impostazione predefinita durante questa fase.
- Registra le ricevute in modo coerente.
- Restituisci ricevute e risultati di consegna al chiamante dispatcher originale invece
  di trattare l'invio durevole come un effetto collaterale terminale.
- Persiste l'origine del messaggio attraverso gli intenti di invio durevoli in modo che ripristino, replay e
  invii a blocchi preservino la provenienza operativa di OpenClaw.

### Fase 3: Bridge del turno canale

- Reimplementa `channel.turn.run` e `dispatchAssembledChannelTurn` sopra
  `messages.receive` e `messages.send`.
- Mantieni stabili i tipi di fatto correnti.
- Mantieni il comportamento legacy per impostazione predefinita. Un canale assembled-turn diventa durevole
  solo quando il suo adattatore effettua esplicitamente l'opt-in con una policy di durabilità sicura per il replay.
- Mantieni `durable: false` come via di fuga di compatibilità per i percorsi che finalizzano
  modifiche native e non possono ancora eseguire replay in modo sicuro, ma non affidarti ai marcatori `false`
  per proteggere i canali non migrati.
- Imposta per impostazione predefinita la durabilità assembled-turn solo nel nuovo ciclo di vita dei messaggi, dopo
  che la mappatura del canale dimostra che il percorso di invio generico preserva la vecchia
  semantica di consegna del canale.

### Fase 4: Bridge del dispatcher preparato

- Sostituisci `deliverDurableInboundReplyPayload` con un bridge del contesto di invio.
- Mantieni il vecchio helper come wrapper.
- Porta prima Telegram, WhatsApp, Slack, Signal, iMessage e Discord perché
  hanno già lavoro durable-final o percorsi di invio più semplici.
- Tratta ogni dispatcher preparato come non coperto finché non aderisce
  esplicitamente al contesto di invio. La documentazione e le voci del changelog
  devono dire "turni di canale assemblati" o nominare i percorsi dei canali
  migrati, invece di rivendicare tutte le risposte finali automatiche.
- Mantieni `recordInboundSessionAndDispatchReply`, gli helper direct-DM e helper
  di compatibilità pubblici simili preservandone il comportamento. Potranno
  esporre in seguito un'adesione esplicita al contesto di invio, ma non devono
  tentare automaticamente una consegna durevole generica prima della callback di
  consegna posseduta dal chiamante.

### Fase 5: ciclo di vita live unificato

- Costruisci `messages.live` con due adattatori di prova:
  - Telegram per invio più modifica più invio finale obsoleto.
  - Matrix per finalizzazione della bozza più fallback di redazione.
- Poi migra Discord, Slack, Mattermost, Teams, QQ Bot e Feishu.
- Elimina il codice duplicato di finalizzazione dell'anteprima solo dopo che ogni
  canale ha test di parità.

### Fase 6: SDK pubblico

- Aggiungi `openclaw/plugin-sdk/channel-message`.
- Documentalo come l'API preferita per i Plugin di canale.
- Aggiorna gli export dei pacchetti, l'inventario degli entrypoint, le baseline
  API generate e la documentazione dell'SDK dei Plugin.
- Includi `MessageOrigin`, gli hook di codifica/decodifica dell'origine e il
  predicato condiviso `shouldDropOpenClawEcho` nella superficie SDK
  channel-message.
- Mantieni wrapper di compatibilità per i vecchi sottopercorsi.
- Contrassegna nella documentazione gli helper SDK con nomi di risposta come
  deprecati dopo la migrazione dei Plugin in bundle.

### Fase 7: tutti i mittenti

Sposta tutti i produttori outbound non di risposta su `messages.send`:

- notifiche Cron e Heartbeat
- completamenti di attività
- risultati degli hook
- prompt di approvazione e risultati di approvazione
- invii tramite strumento messaggi
- annunci di completamento dei subagent
- invii espliciti da CLI o Control UI
- percorsi di automazione/broadcast

È qui che il modello smette di essere "risposte dell'agente" e diventa "OpenClaw
invia messaggi".

### Fase 8: deprecare Turn

- Mantieni `channel.turn` come wrapper per almeno una finestra di compatibilità.
- Pubblica note di migrazione.
- Esegui i test di compatibilità dell'SDK dei Plugin contro i vecchi import.
- Rimuovi o nascondi i vecchi helper interni solo dopo che nessun Plugin in
  bundle ne ha più bisogno e i contratti di terze parti hanno un sostituto
  stabile.

## Piano di test

Test unitari:

- Serializzazione e recupero degli intenti di invio durevoli.
- Riutilizzo della chiave di idempotenza e soppressione dei duplicati.
- Commit della ricevuta e salto del replay.
- Recupero `unknown_after_send` che riconcilia prima del replay quando un
  adattatore supporta la riconciliazione.
- Policy di classificazione degli errori.
- Sequenziamento della policy di ack di ricezione.
- Mappatura delle relazioni per invii di risposta, followup, sistema e broadcast.
- Factory di origine per errori del Gateway e predicato `shouldDropOpenClawEcho`.
- Preservazione dell'origine attraverso normalizzazione del payload, chunking,
  serializzazione della coda durevole e recupero.

Test di integrazione:

- L'adattatore semplice `channel.turn.run` registra e invia ancora.
- La consegna legacy di turni assemblati non diventa durevole a meno che il
  canale non aderisca esplicitamente.
- Il bridge `channel.turn.runPrepared` registra e finalizza ancora.
- Gli helper pubblici di compatibilità chiamano per impostazione predefinita le
  callback di consegna possedute dal chiamante e non eseguono un invio generico
  prima di quelle callback.
- La consegna fallback durevole riesegue l'intero array di payload proiettati
  dopo il riavvio e non può lasciare i payload successivi non registrati dopo un
  crash anticipato.
- La consegna durevole di turni assemblati restituisce gli ID dei messaggi della
  piattaforma al dispatcher bufferizzato.
- Gli hook di consegna personalizzati restituiscono ancora gli ID dei messaggi
  della piattaforma quando la consegna durevole è disabilitata o non disponibile.
- La risposta finale sopravvive al riavvio tra completamento dell'assistente e
  invio alla piattaforma.
- La bozza di anteprima viene finalizzata sul posto quando consentito.
- La bozza di anteprima viene annullata o redatta quando una mancata
  corrispondenza di media/errore/target di risposta richiede la consegna normale.
- Lo streaming a blocchi e lo streaming di anteprima non consegnano entrambi lo
  stesso testo.
- I media trasmessi in streaming in anticipo non vengono duplicati nella consegna
  finale.

Test dei canali:

- Risposta a topic Telegram con ack di polling ritardato fino al watermark
  completato sicuro del contesto di ricezione.
- Recupero del polling Telegram per aggiornamenti accettati ma non consegnati
  coperto dal modello persistito di offset safe-completed.
- L'anteprima obsoleta Telegram invia un finale fresco e pulisce l'anteprima.
- Il fallback silenzioso Telegram invia ogni payload fallback proiettato.
- La durabilità del fallback silenzioso Telegram registra atomicamente l'intero
  array fallback proiettato, non un singolo intento durevole a payload singolo
  per iterazione del ciclo.
- Annullamento dell'anteprima Discord su media/errore/risposta esplicita.
- I finali dei dispatcher preparati Discord passano attraverso il contesto di
  invio prima che la documentazione o il changelog rivendichino la durabilità
  delle risposte finali Discord.
- Gli invii finali durevoli iMessage popolano la cache echo dei messaggi inviati
  del monitor.
- I percorsi di consegna legacy LINE, Zalo e Nostr non vengono bypassati
  dall'invio durevole generico finché non esistono i relativi test di parità
  dell'adattatore.
- La consegna tramite callback Direct-DM/Nostr resta autorevole a meno che non
  venga migrata esplicitamente a un target messaggio completo e a un adattatore
  di invio sicuro per il replay.
- I messaggi Slack tagged di errore del Gateway OpenClaw restano visibili in
  uscita, gli echo bot-room tagged vengono scartati prima di `allowBots` e i
  messaggi bot senza tag con lo stesso testo visibile seguono ancora la normale
  autorizzazione dei bot.
- Fallback dello stream nativo Slack ad anteprima bozza nei DM di primo livello.
- Finalizzazione dell'anteprima Matrix e fallback di redazione.
- Gli echo tagged OpenClaw di errore del Gateway nelle stanze Matrix da account
  bot configurati vengono scartati prima della gestione di `allowBots`.
- Gli audit a cascata degli errori del Gateway in stanze condivise Discord e
  Google Chat coprono le modalità `allowBots` prima di rivendicare protezione
  generica lì.
- Finalizzazione della bozza Mattermost e fallback con invio fresco.
- Finalizzazione del progresso nativo Teams.
- Soppressione del finale duplicato Feishu.
- Fallback per timeout dell'accumulatore QQ Bot.
- Gli invii finali durevoli Tlon preservano il rendering della model-signature e
  il tracciamento dei thread partecipati.
- Invii finali durevoli semplici per WhatsApp, Signal, iMessage, Google Chat,
  LINE, IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo e Zalo
  Personal.

Validazione:

- File Vitest mirati durante lo sviluppo.
- `pnpm check:changed` in Testbox per l'intera superficie modificata.
- `pnpm check` più ampio in Testbox prima di atterrare il refactor completo o
  dopo modifiche all'SDK pubblico/export.
- Smoke live o qa-channel per almeno un canale capace di modifica e un canale
  semplice solo invio prima di rimuovere i wrapper di compatibilità.

## Domande aperte

- Se Telegram debba alla fine sostituire la sorgente runner grammY con una
  sorgente di polling completamente durevole che possa controllare la
  riconsegna a livello di piattaforma, non solo il watermark di riavvio
  persistito di OpenClaw.
- Se lo stato durevole dell'anteprima live debba essere archiviato nello stesso
  record di coda dell'intento di invio finale o in uno store live-state
  affiancato.
- Per quanto tempo i wrapper di compatibilità restano documentati dopo il rilascio
  di `plugin-sdk/channel-message`.
- Se i Plugin di terze parti debbano implementare direttamente adattatori di
  ricezione o fornire solo hook normalize/send/live tramite
  `defineChannelMessageAdapter`.
- Quali campi della ricevuta siano sicuri da esporre nell'SDK pubblico rispetto
  allo stato runtime interno.
- Se effetti collaterali come cache self-echo e marker di thread partecipati
  debbano essere modellati come hook del contesto di invio, passaggi di
  finalizzazione posseduti dall'adattatore o subscriber delle ricevute.
- Quali canali abbiano metadati di origine nativi, quali richiedano registri
  outbound persistiti e quali non possano offrire una soppressione echo
  cross-bot affidabile.

## Criteri di accettazione

- Ogni canale messaggi in bundle invia l'output finale visibile tramite
  `messages.send`.
- Ogni canale messaggi inbound entra tramite `messages.receive` o un wrapper di
  compatibilità documentato.
- Ogni canale di anteprima/modifica/stream usa `messages.live` per lo stato bozza
  e la finalizzazione.
- `channel.turn` è solo un wrapper.
- Gli helper SDK con nomi di risposta sono export di compatibilità, non il
  percorso consigliato.
- Il recupero durevole può rieseguire gli invii finali pendenti dopo il riavvio
  senza perdere la risposta finale o duplicare invii già sottoposti a commit; gli
  invii il cui esito sulla piattaforma è sconosciuto vengono riconciliati prima
  del replay o documentati come at-least-once per quell'adattatore.
- Gli invii finali durevoli falliscono chiusi quando l'intento durevole non può
  essere scritto, a meno che un chiamante non abbia selezionato esplicitamente
  una modalità non durevole documentata.
- Gli helper di compatibilità legacy channel-turn e SDK usano per impostazione
  predefinita la consegna diretta posseduta dal canale; l'invio durevole generico
  è solo ad adesione esplicita.
- Le ricevute preservano tutti gli ID dei messaggi della piattaforma per le
  consegne multi-parte e un ID primario per comodità di threading/modifica.
- I wrapper durevoli preservano gli effetti collaterali locali del canale prima
  di sostituire le callback di consegna diretta.
- I dispatcher preparati non vengono conteggiati come durevoli finché il loro
  percorso di consegna finale non usa esplicitamente il contesto di invio.
- La consegna fallback gestisce ogni payload proiettato.
- La consegna fallback durevole registra ogni payload proiettato in un unico
  intento rieseguibile o piano batch.
- L'output di errore del Gateway originato da OpenClaw è visibile agli esseri
  umani, ma gli echo di stanza authored-by-bot tagged vengono scartati prima
  dell'autorizzazione dei bot sui canali che dichiarano il supporto per il
  contratto di origine.
- La documentazione spiega invio, ricezione, live, stato, ricevute, relazioni,
  policy di errore, migrazione e copertura dei test.

## Correlati

- [Messaggi](/it/concepts/messages)
- [Streaming e chunking](/it/concepts/streaming)
- [Bozze di progresso](/it/concepts/progress-drafts)
- [Policy di retry](/it/concepts/retry)
- [Kernel turn di canale](/it/plugins/sdk-channel-turn)
