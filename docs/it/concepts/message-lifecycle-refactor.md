---
read_when:
    - Refactoring del comportamento di invio o ricezione del canale
    - Modifica delle API dei messaggi del canale in ingresso, dell'invio delle risposte, della coda in uscita, dello streaming di anteprima o dell'SDK dei Plugin
    - Progettare un nuovo Plugin di canale che richiede invii durevoli, ricevute, anteprime, modifiche o tentativi automatici
summary: Piano di progettazione per il ciclo di vita unificato e persistente di ricezione, invio, anteprima, modifica e streaming dei messaggi
title: Refactoring del ciclo di vita dei messaggi
x-i18n:
    generated_at: "2026-06-27T17:25:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Questa pagina è il progetto di riferimento per sostituire gli helper sparsi per canali in ingresso, dispatch delle risposte, streaming delle anteprime e consegna in uscita con un unico ciclo di vita durevole dei messaggi.

La versione breve:

- Le primitive core dovrebbero essere **ricevere** e **inviare**, non **rispondere**.
- Una risposta è solo una relazione su un messaggio in uscita.
- Un turno è una convenienza di elaborazione in ingresso, non il proprietario della consegna.
- L'invio deve essere basato sul contesto: `begin`, rendering, anteprima o stream, invio finale,
  commit, fail.
- Anche la ricezione deve essere basata sul contesto: normalizzazione, deduplica, routing, registrazione,
  dispatch, ack della piattaforma, fail.
- L'SDK pubblico dei Plugin dovrebbe ridursi a una piccola superficie unica per l'uscita dei canali.

## Problemi

Lo stack attuale dei canali è cresciuto a partire da diverse esigenze locali valide:

- Gli adapter in ingresso semplici usano `runtime.channel.inbound.run`.
- Gli adapter ricchi usano `runtime.channel.inbound.runPreparedReply`.
- Gli helper legacy usano `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, helper per payload di risposta, suddivisione delle risposte in chunk,
  riferimenti di risposta e helper runtime in uscita.
- Lo streaming delle anteprime vive in dispatcher specifici del canale.
- La durevolezza della consegna finale viene aggiunta attorno ai percorsi esistenti dei payload di risposta.

Questa forma corregge bug locali, ma lascia OpenClaw con troppi concetti pubblici
e troppi punti in cui la semantica della consegna può divergere.

Il problema di affidabilità che lo ha esposto è:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

L'invariante di destinazione è più ampia di Telegram: una volta che il core decide che deve esistere un messaggio in uscita visibile, l'intento deve essere durevole prima di tentare l'invio sulla piattaforma, e la ricevuta della piattaforma deve essere committata dopo il successo.
Questo offre a OpenClaw un recupero at-least-once. Il comportamento exactly-once esiste solo per gli adapter che possono dimostrare idempotenza nativa o riconciliare un tentativo dallo stato sconosciuto dopo l'invio rispetto allo stato della piattaforma prima della riproduzione.

Questo è lo stato finale di questo refactor, non una descrizione di ogni percorso attuale. Durante la migrazione, gli helper in uscita esistenti possono ancora ripiegare su un invio diretto quando le scritture best-effort in coda falliscono. Il refactor è completo solo quando gli invii finali durevoli falliscono in modo chiuso o rinunciano esplicitamente con una policy non durevole documentata.

## Obiettivi

- Un unico ciclo di vita core per tutti i percorsi di ricezione e invio dei messaggi di canale.
- Invii finali durevoli per impostazione predefinita nel nuovo ciclo di vita dei messaggi dopo che un adapter dichiara un comportamento sicuro per la riproduzione.
- Semantiche condivise di anteprima, modifica, stream, finalizzazione, retry, recupero e ricevuta.
- Una piccola superficie SDK per Plugin che i Plugin di terze parti possano imparare e mantenere.
- Compatibilità per i chiamanti di compatibilità delle risposte in ingresso esistenti durante la migrazione.
- Punti di estensione chiari per nuove capacità di canale.
- Nessun ramo specifico della piattaforma nel core.
- Nessun messaggio di canale token-delta. Lo streaming dei canali resta consegna di anteprima, modifica, append o blocco completato del messaggio.
- Metadati strutturati di origine OpenClaw per output operativi/di sistema, in modo che i fallimenti visibili del Gateway non rientrino nelle stanze condivise abilitate ai bot come nuovi prompt.

## Non obiettivi

- Non forzare ogni canale esistente sulla consegna durevole dei messaggi nella prima fase.
- Non forzare ogni canale nello stesso comportamento di trasporto nativo.
- Non insegnare al core topic Telegram, stream nativi Slack, redazioni Matrix,
  card Feishu, voce QQ o attività Teams.
- Non pubblicare tutti gli helper interni di migrazione come API SDK stabile.
- Non fare in modo che i retry riproducano operazioni di piattaforma non idempotenti completate.

## Modello di riferimento

Vercel Chat ha un buon modello mentale pubblico:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- metodi adapter come `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` e recuperi della cronologia
- un adapter di stato per deduplica, lock, code e persistenza

OpenClaw dovrebbe prendere in prestito il vocabolario, non copiare la superficie.

Ciò di cui OpenClaw ha bisogno oltre quel modello:

- Intenti di invio in uscita durevoli prima delle chiamate dirette al trasporto.
- Contesti di invio espliciti con begin, commit e fail.
- Contesti di ricezione che conoscono la policy di ack della piattaforma.
- Ricevute che sopravvivono al riavvio e possono guidare modifiche, eliminazioni, recupero e soppressione dei duplicati.
- Un SDK pubblico più piccolo. I Plugin inclusi possono usare helper runtime interni, ma i Plugin di terze parti dovrebbero vedere una sola API coerente per i messaggi.
- Comportamento specifico degli agenti: sessioni, trascrizioni, streaming di blocchi, avanzamento degli strumenti, approvazioni, direttive multimediali, risposte silenziose e cronologia delle menzioni nei gruppi.

Le promesse in stile `thread.post()` non bastano per OpenClaw. Nascondono il confine transazionale che decide se un invio è recuperabile.

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

Questo consente allo stesso percorso di invio di gestire risposte normali, notifiche Cron, prompt di approvazione, completamenti di task, invii di message-tool, invii da CLI o Control UI, risultati di subagent e invii di automazione.

### Origine

L'origine descrive chi ha prodotto un messaggio e come OpenClaw dovrebbe trattare gli echi di quel messaggio. È separata dalla relazione: un messaggio può essere una risposta a un utente e continuare a essere output operativo originato da OpenClaw.

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

Il primo uso richiesto è l'output di fallimento del Gateway. Gli esseri umani dovrebbero comunque vedere messaggi come "Agente fallito prima della risposta" o "Chiave API mancante", ma l'output operativo OpenClaw taggato non deve essere accettato come input scritto da bot nelle stanze condivise quando `allowBots` è abilitato.

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

Una ricevuta può descrivere un messaggio di piattaforma o una consegna multipart. Testo suddiviso in chunk, contenuto multimediale più testo, voce più testo e fallback delle card devono preservare tutti gli id di piattaforma pur esponendo comunque un id primario per threading e modifiche successive.

## Contesto di ricezione

La ricezione non dovrebbe essere una semplice chiamata a helper. Il core ha bisogno di un contesto che conosca deduplica, routing, registrazione della sessione e policy di ack della piattaforma.

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

L'ack non è una sola cosa. Il contratto di ricezione deve mantenere separati questi segnali:

- **Ack di trasporto:** comunica al webhook o socket della piattaforma che OpenClaw ha accettato l'envelope dell'evento. Alcune piattaforme lo richiedono prima del dispatch.
- **Ack dell'offset di polling:** avanza un cursore in modo che lo stesso evento non venga recuperato di nuovo. Non deve avanzare oltre lavoro che non può essere recuperato.
- **Ack del record in ingresso:** conferma che OpenClaw ha persistito metadati in ingresso sufficienti per deduplicare e instradare una riconsegna.
- **Ricevuta visibile all'utente:** comportamento opzionale di lettura/stato/digitazione; mai un confine di durevolezza.

`ReceiveAckPolicy` controlla solo il riconoscimento di trasporto o polling. Non deve essere riutilizzata per ricevute di lettura o reazioni di stato.

Prima dell'autorizzazione dei bot, la ricezione deve applicare la policy condivisa degli echi OpenClaw quando il canale può decodificare i metadati di origine del messaggio:

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

Questo scarto è basato sui tag, non sul testo. Un messaggio di stanza scritto da bot con lo stesso testo visibile di fallimento del Gateway ma senza metadati di origine OpenClaw passa comunque attraverso la normale autorizzazione `allowBots`.

La policy di ack è esplicita:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Il polling Telegram ora usa la policy di ack del contesto di ricezione per il suo watermark di riavvio persistito. Il tracker osserva ancora gli aggiornamenti grammY mentre entrano nella catena middleware, ma OpenClaw persiste solo l'id dell'aggiornamento completato sicuro dopo un dispatch riuscito, lasciando gli aggiornamenti falliti o pendenti più bassi riproducibili dopo un riavvio. L'offset di recupero `getUpdates` upstream di Telegram è ancora controllato dalla libreria di polling, quindi il taglio più profondo restante è una sorgente di polling completamente durevole se abbiamo bisogno di riconsegna a livello piattaforma oltre il watermark di riavvio di OpenClaw. Le piattaforme webhook possono richiedere ack HTTP immediato, ma hanno comunque bisogno di deduplica in ingresso e intenti di invio in uscita durevoli perché i webhook possono riconsegnare.

## Contesto di invio

L'invio è anch'esso basato sul contesto:

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

Il confine pericoloso è dopo il successo sulla piattaforma e prima del commit della ricevuta. Se un
processo termina lì, OpenClaw non può sapere se il messaggio della piattaforma esiste
a meno che l'adapter non fornisca idempotenza nativa o un percorso di riconciliazione della ricevuta.
Quei tentativi devono riprendere in `unknown_after_send`, non essere riprodotti alla cieca. I canali
senza riconciliazione possono scegliere una riproduzione at-least-once solo se messaggi visibili
duplicati sono un compromesso accettabile e documentato per quel canale e quella relazione.
L'attuale ponte di riconciliazione dell'SDK richiede che l'adapter dichiari
`reconcileUnknownSend`, poi chiede a `durableFinal.reconcileUnknownSend` di
classificare una voce sconosciuta come `sent`, `not_sent` o `unresolved`; solo `not_sent`
consente la riproduzione, e le voci non risolte restano terminali o ritentano solo il
controllo di riconciliazione.

La policy di durabilità deve essere esplicita:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` significa che il core deve fallire in modo chiuso quando non può scrivere l'intento durevole.
`best_effort` può proseguire quando la persistenza non è disponibile. `disabled` mantiene
il vecchio comportamento di invio diretto. Durante la migrazione, i wrapper legacy e gli helper pubblici
di compatibilità usano `disabled` come predefinito; non devono inferire `required` dal
fatto che un canale abbia un adapter outbound generico.

I contesti di invio possiedono anche gli effetti post-invio locali del canale. Una migrazione non è sicura
se la consegna durevole aggira il comportamento locale che in precedenza era collegato al
percorso di invio diretto del canale. Gli esempi includono cache di soppressione del self-echo,
marcatori di partecipazione ai thread, ancore di modifica native, rendering della firma del modello
e protezioni anti-duplicazione specifiche della piattaforma. Tali effetti devono spostarsi
nell'adapter di invio, nell'adapter di rendering o in un hook di contesto di invio nominato prima che
quel canale possa abilitare la consegna finale generica durevole.

Gli helper di invio devono restituire le ricevute fino al loro chiamante. I wrapper durevoli
non possono inghiottire gli ID dei messaggi o sostituire un risultato di consegna del canale con
`undefined`; i dispatcher bufferizzati usano quegli ID per ancore di thread, modifiche successive,
finalizzazione delle anteprime e soppressione dei duplicati.

Gli invii di fallback operano su batch, non su singoli payload. Riscritture di risposte silenziose,
fallback dei media, fallback delle schede e proiezione dei chunk possono tutti produrre più di
un messaggio consegnabile, quindi un contesto di invio deve consegnare l'intero
batch proiettato o documentare esplicitamente perché è valido un solo payload.

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
un unico intento di invio durevole o da un altro piano di batch atomico. Registrare ogni payload
uno per uno non basta: un crash tra i payload può lasciare un fallback visibile parziale
senza un record durevole per i payload rimanenti. Il ripristino deve sapere
quali unità hanno già ricevute e riprodurre solo le unità mancanti oppure marcare
il batch come `unknown_after_send` finché l'adapter non lo riconcilia.

## Contesto live

Il comportamento di anteprima, modifica, avanzamento e stream dovrebbe essere un unico ciclo di vita opt-in.

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

- Invio Telegram più anteprima modificabile, con finale nuovo dopo che l'anteprima diventa obsoleta.
- Invio Discord più anteprima modificabile, annullamento su media/errore/risposta esplicita.
- Stream nativo Slack o anteprima bozza a seconda della forma del thread.
- Finalizzazione del post bozza Mattermost.
- Finalizzazione dell'evento bozza Matrix o redazione in caso di mancata corrispondenza.
- Stream di avanzamento nativo Teams.
- Stream QQ Bot o fallback accumulato.

## Superficie dell'adapter

La destinazione pubblica dell'SDK dovrebbe essere un unico sottopercorso:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

Forma di destinazione:

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

Il core imposta `MessageOrigin`. I canali lo traducono soltanto da e verso i metadati
del trasporto nativo. Slack lo mappa su `chat.postMessage({ metadata })` e su
`message.metadata` in ingresso; Matrix può mapparlo su contenuto evento aggiuntivo; i canali
senza metadati nativi possono usare un registro ricevute/outbound quando questa è la
migliore approssimazione disponibile.

Funzionalità:

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
- helper ad hoc per il ciclo di vita degli stream bozza

I sottopercorsi di compatibilità possono restare come wrapper, ma i nuovi plugin
di terze parti non dovrebbero averne bisogno.

I plugin in bundle possono mantenere import di helper interni tramite sottopercorsi runtime
riservati durante la migrazione. La documentazione pubblica dovrebbe indirizzare gli autori di plugin a
`plugin-sdk/channel-outbound` una volta che esiste.

## Relazione con l'inbound del canale

`runtime.channel.inbound.*` è il ponte runtime durante la migrazione.

Dovrebbe diventare un adapter di compatibilità:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

Anche `channel.inbound.runPreparedReply` dovrebbe rimanere inizialmente:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

La vecchia superficie runtime `channel.turn` è stata rimossa. I chiamanti runtime usano
`channel.inbound.*`; la documentazione dei canali e i sottopercorsi dell'SDK usano nomi inbound/message.

## Guardrail di compatibilità

Durante la migrazione, la consegna generica durevole è opt-in per qualsiasi canale il cui
callback di consegna esistente abbia effetti collaterali oltre a "invia questo payload".

I punti di ingresso legacy sono non durevoli per impostazione predefinita:

- `channel.inbound.run` e `dispatchChannelInboundReply` usano il callback di
  consegna del canale a meno che quel canale non fornisca esplicitamente un oggetto
  policy/opzioni durevole sottoposto ad audit.
- `channel.inbound.runPreparedReply` resta di proprietà del canale finché il dispatcher preparato
  non chiama esplicitamente il contesto di invio.
- Gli helper pubblici di compatibilità come `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` e gli helper direct-DM non iniettano mai consegna
  generica durevole prima del callback `deliver` o `reply` fornito dal chiamante.

Per i tipi del ponte di migrazione, `durable: undefined` significa "non durevole". Il
percorso durevole è abilitato solo da un valore policy/opzioni esplicito. `durable:
false` può restare come grafia di compatibilità, ma l'implementazione non dovrebbe
richiedere a ogni canale non migrato di aggiungerlo.

Il codice del ponte attuale deve mantenere esplicita la decisione di durabilità:

- La consegna finale durevole restituisce uno stato discriminato. `handled_visible` e
  `handled_no_send` sono terminali; `unsupported` e `not_applicable` possono
  ripiegare sulla consegna di proprietà del canale; `failed` propaga l'errore di invio.
- La consegna finale durevole generica è controllata dalle capacità dell'adapter, come
  consegna silenziosa, conservazione del target di risposta, conservazione della
  citazione nativa e hook di invio dei messaggi. La parità mancante dovrebbe scegliere
  la consegna di proprietà del canale, non un invio generico che modifica il comportamento
  visibile all'utente.
- Gli invii durevoli basati su coda espongono un riferimento all'intento di consegna. I
  campi di sessione `pendingFinalDelivery*` esistenti possono trasportare l'id dell'intento
  durante la transizione; lo stato finale è uno store `MessageSendIntent` invece di testo
  di risposta congelato più campi di contesto ad hoc.

Non abilitare il percorso durevole generico per un canale finché tutte queste condizioni
non sono vere:

- L'adapter di invio generico esegue lo stesso comportamento di rendering e trasporto del
  vecchio percorso diretto.
- Gli effetti collaterali locali successivi all'invio sono preservati tramite il contesto di invio.
- L'adapter restituisce ricevute o risultati di consegna con tutti gli id dei messaggi della piattaforma.
- I percorsi del dispatcher preparato chiamano il nuovo contesto di invio oppure restano documentati
  come esterni alla garanzia durevole.
- La consegna di fallback gestisce ogni payload proiettato, non solo il primo.
- La consegna durevole di fallback registra l'intero array di payload proiettati come un unico
  intento riproducibile o piano batch.

Rischi concreti di migrazione da preservare:

- La consegna del monitor iMessage registra i messaggi inviati in una cache eco dopo un
  invio riuscito. Gli invii finali durevoli devono comunque popolare quella cache, altrimenti
  OpenClaw può reingerire le proprie risposte finali come messaggi utente in ingresso.
- Tlon aggiunge una firma opzionale del modello e registra i thread partecipati dopo le
  risposte di gruppo. La consegna durevole generica non deve aggirare questi effetti;
  spostarli negli adapter di rendering/invio/finalizzazione di Tlon oppure mantenere Tlon sul
  percorso di proprietà del canale.
- Discord e altri dispatcher preparati possiedono già il comportamento di consegna diretta e
  anteprima. Non sono coperti da una garanzia durevole del turno assemblato finché i loro
  dispatcher preparati non instradano esplicitamente i finali attraverso il contesto di invio.
- La consegna di fallback silenziosa di Telegram deve consegnare l'intero array di payload
  proiettati. Una scorciatoia a payload singolo può eliminare payload di fallback aggiuntivi
  dopo la proiezione.
- LINE, Zalo, Nostr e altri percorsi assemblati/helper esistenti possono avere gestione dei
  token di risposta, proxy dei media, cache dei messaggi inviati, pulizia di caricamento/stato
  o target solo callback. Restano sulla consegna di proprietà del canale finché tali semantiche
  non sono rappresentate dall'adapter di invio e verificate dai test.
- Gli helper Direct-DM possono avere una callback di risposta che è l'unico target di trasporto
  corretto. L'outbound generico non deve dedurre da `OriginatingTo` o `To` e saltare quella callback.
- L'output di errore del Gateway OpenClaw deve restare visibile agli esseri umani, ma gli echi
  della stanza scritti dal bot e contrassegnati devono essere eliminati prima dell'autorizzazione
  `allowBots`. I canali non devono implementarlo con filtri di prefisso sul testo visibile, salvo
  come breve misura di emergenza; il contratto durevole è costituito da metadati di origine strutturati.

## Archiviazione interna

La coda durevole dovrebbe archiviare intenti di invio messaggio, non payload di risposta.

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

La coda dovrebbe mantenere identità sufficiente per riprodurre attraverso lo stesso account,
thread, target, criterio di formattazione e regole media dopo il riavvio.

## Classi di errore

Gli adapter dei canali classificano gli errori di trasporto in categorie chiuse:

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

Policy del core:

- Ritentare `transient` e `rate_limit`.
- Non ritentare `invalid_payload` a meno che esista un fallback di rendering.
- Non ritentare `auth` o `permission` finché la configurazione non cambia.
- Per `not_found`, consentire alla finalizzazione live di ripiegare dalla modifica a un nuovo invio quando
  il canale dichiara che è sicuro.
- Per `conflict`, usare le regole di ricevuta/idempotenza per decidere se il messaggio
  esiste già.
- Qualsiasi errore dopo che l'adapter potrebbe aver completato l'I/O della piattaforma ma prima del commit
  della ricevuta diventa `unknown_after_send`, a meno che l'adapter possa dimostrare che l'operazione sulla
  piattaforma non è avvenuta.

## Mappatura dei canali

| Canale          | Migrazione di destinazione                                                                                                                                                                                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Riceve criteri di ack più invii finali durevoli. L'adattatore live gestisce invio più modifica dell'anteprima, invio finale dell'anteprima obsoleta, argomenti, salto dell'anteprima quote-reply, fallback dei media e gestione di retry-after.                                                                                                           |
| Discord         | L'adattatore di invio avvolge la consegna esistente dei payload durevoli. L'adattatore live gestisce modifica della bozza, bozza di avanzamento, annullamento dell'anteprima media/errore, conservazione della destinazione di risposta e ricevute degli ID messaggio. Verifica gli eco gateway-failure creati dal bot nelle stanze condivise; usa un registro in uscita o altro equivalente nativo se Discord non può trasportare metadati di origine sui messaggi normali. |
| Slack           | L'adattatore di invio gestisce i normali post di chat. L'adattatore live sceglie lo stream nativo quando la forma del thread lo supporta, altrimenti l'anteprima bozza. Le ricevute conservano i timestamp del thread. L'adattatore di origine mappa i fallimenti del Gateway OpenClaw su `chat.postMessage.metadata` di Slack e scarta gli eco bot-room contrassegnati prima dell'autorizzazione `allowBots`. |
| WhatsApp        | L'adattatore di invio gestisce invio di testo/media con intenti finali durevoli. L'adattatore di ricezione gestisce menzione del gruppo e identità del mittente. Live può restare assente finché WhatsApp non dispone di un trasporto modificabile.                                                                                                        |
| Matrix          | L'adattatore live gestisce modifiche degli eventi bozza, finalizzazione, redazione, vincoli dei media cifrati e fallback per mancata corrispondenza della destinazione di risposta. L'adattatore di ricezione gestisce idratazione e deduplicazione degli eventi cifrati. L'adattatore di origine dovrebbe codificare l'origine gateway-failure di OpenClaw nel contenuto evento Matrix e scartare gli eco delle stanze dei bot configurati prima della gestione `allowBots`. |
| Mattermost      | L'adattatore live gestisce un post bozza, folding di avanzamento/strumenti, finalizzazione sul posto e fallback con nuovo invio.                                                                                                                                                                                                                            |
| Microsoft Teams | L'adattatore live gestisce avanzamento nativo e comportamento dello stream a blocchi. L'adattatore di invio gestisce attività e ricevute di allegati/schede.                                                                                                                                                                                                |
| Feishu          | L'adattatore di rendering gestisce rendering di testo/scheda/raw. L'adattatore live gestisce schede in streaming e soppressione dei finali duplicati. L'adattatore di invio gestisce commenti, sessioni di argomento, media e soppressione della voce.                                                                                                      |
| QQ Bot          | L'adattatore live gestisce streaming C2C, timeout dell'accumulatore e invio finale di fallback. L'adattatore di rendering gestisce tag media e testo come voce.                                                                                                                                                                                            |
| Signal          | Adattatore semplice di ricezione più invio. Nessun adattatore live a meno che signal-cli non aggiunga supporto affidabile per le modifiche.                                                                                                                                                                                                                 |
| iMessage        | Adattatore semplice di ricezione più invio. L'invio iMessage deve conservare la popolazione dell'echo-cache del monitor prima che i finali durevoli possano aggirare la consegna del monitor.                                                                                                                                                               |
| Google Chat     | Adattatore semplice di ricezione più invio con relazione del thread mappata a spazi e ID thread. Verifica il comportamento delle stanze con `allowBots=true` per eco gateway-failure di OpenClaw contrassegnati.                                                                                                                                             |
| LINE            | Adattatore semplice di ricezione più invio con vincoli reply-token modellati come capacità destinazione/relazione.                                                                                                                                                                                                                                          |
| Nextcloud Talk  | Bridge di ricezione SDK più adattatore di invio.                                                                                                                                                                                                                                                                                                           |
| IRC             | Adattatore semplice di ricezione più invio, senza ricevute di modifica durevoli.                                                                                                                                                                                                                                                                            |
| Nostr           | Adattatore di ricezione più invio per DM cifrati; le ricevute sono ID evento.                                                                                                                                                                                                                                                                               |
| QA Channel      | Adattatore di contract test per comportamento di ricezione, invio, live, retry e recupero.                                                                                                                                                                                                                                                                  |
| Synology Chat   | Adattatore semplice di ricezione più invio.                                                                                                                                                                                                                                                                                                                |
| Tlon            | L'adattatore di invio deve preservare il rendering model-signature e il tracciamento participated-thread prima che venga abilitata la consegna finale durevole generica.                                                                                                                                                                                    |
| Twitch          | Adattatore semplice di ricezione più invio con classificazione dei limiti di frequenza.                                                                                                                                                                                                                                                                     |
| Zalo            | Adattatore semplice di ricezione più invio.                                                                                                                                                                                                                                                                                                                |
| Zalo Personal   | Adattatore semplice di ricezione più invio.                                                                                                                                                                                                                                                                                                                |

## Piano di migrazione

### Fase 1: dominio interno dei messaggi

- Aggiungi tipi `src/channels/message/*` per messaggi, destinazioni, relazioni,
  origini, ricevute, capacità, intenti durevoli, contesto di ricezione, contesto
  di invio, contesto live e classi di errore.
- Aggiungi `origin?: MessageOrigin` al tipo di payload del bridge di migrazione usato dalla
  consegna delle risposte corrente, poi sposta quel campo in `ChannelMessage` e nei tipi di
  messaggio renderizzato man mano che il refactor sostituisce i payload di risposta.
- Mantieni tutto interno finché adattatori e test non provano la forma.
- Aggiungi unit test puri per transizioni di stato e serializzazione.

### Fase 2: core di invio durevole

- Sposta la coda in uscita esistente dalla durabilità dei payload di risposta agli intenti
  durevoli di invio messaggio.
- Consenti a un intento di invio durevole di trasportare un array di payload proiettato o un piano
  batch, non solo un payload di risposta.
- Conserva il comportamento di recupero della coda corrente tramite conversione di compatibilità.
- Fai chiamare `messages.send` da `deliverOutboundPayloads`.
- Rendi la durabilità dell'invio finale il comportamento predefinito e fallisci in modo chiuso quando l'intento durevole
  non può essere scritto nel nuovo ciclo di vita dei messaggi, dopo che l'adattatore dichiara
  la sicurezza di replay. Durante questa fase, i percorsi esistenti di runner inbound e compatibilità SDK restano
  direct-send per impostazione predefinita.
- Registra le ricevute in modo coerente.
- Restituisci ricevute e risultati di consegna al chiamante dispatcher originale invece di
  trattare l'invio durevole come effetto collaterale terminale.
- Persiste l'origine del messaggio attraverso gli intenti di invio durevoli, così recupero, replay e
  invii a blocchi conservano la provenienza operativa OpenClaw.

### Fase 3: bridge inbound del canale

- Reimplementa `channel.inbound.run` e `dispatchChannelInboundReply` sopra
  `messages.receive` e `messages.send`.
- Mantieni stabili i tipi di fatto correnti.
- Mantieni il comportamento legacy per impostazione predefinita. Un canale assembled-turn diventa durevole
  solo quando il suo adattatore aderisce esplicitamente con una policy di durabilità sicura per replay.
- Mantieni `durable: false` come via di fuga di compatibilità per i percorsi che finalizzano
  modifiche native e non possono ancora eseguire replay in modo sicuro, ma non affidarti ai marcatori `false`
  per proteggere canali non migrati.
- Rendi predefinita la durabilità assembled-turn solo nel nuovo ciclo di vita dei messaggi, dopo
  che la mappatura del canale prova che il percorso di invio generico conserva la vecchia
  semantica di consegna del canale.

### Fase 4: bridge del dispatcher preparato

- Sostituisci `deliverDurableInboundReplyPayload` con un bridge del contesto di invio.
- Mantieni il vecchio helper come wrapper.
- Esegui prima il porting di Telegram, WhatsApp, Slack, Signal, iMessage e Discord perché
  hanno già lavoro sui finali durevoli o percorsi di invio più semplici.
- Considera ogni dispatcher preparato come non coperto finché non opta esplicitamente per
  il contesto di invio. La documentazione e le voci del changelog devono dire "turni di
  canale assemblati" o nominare i percorsi di canale migrati invece di affermare che tutte
  le risposte finali automatiche sono coperte.
- Mantieni il comportamento di `recordInboundSessionAndDispatchReply`, degli helper per DM diretti
  e di helper pubblici di compatibilità simili. Potranno esporre in seguito un opt-in esplicito
  al contesto di invio, ma non devono tentare automaticamente una consegna durevole generica
  prima del callback di consegna di proprietà del chiamante.

### Fase 5: ciclo di vita live unificato

- Costruisci `messages.live` con due adattatori di prova:
  - Telegram per invio, modifica e invio finale obsoleto.
  - Matrix per finalizzazione della bozza e fallback di redazione.
- Poi migra Discord, Slack, Mattermost, Teams, QQ Bot e Feishu.
- Elimina il codice duplicato di finalizzazione dell'anteprima solo dopo che ogni canale ha
  test di parità.

### Fase 6: SDK pubblico

- Aggiungi `openclaw/plugin-sdk/channel-outbound`.
- Documentalo come API preferita per i Plugin di canale.
- Aggiorna export del pacchetto, inventario degli entrypoint, baseline API generate e
  documentazione dell'SDK dei Plugin.
- Includi `MessageOrigin`, gli hook di codifica/decodifica dell'origine e il predicato condiviso
  `shouldDropOpenClawEcho` nella superficie SDK channel-outbound.
- Mantieni wrapper di compatibilità per i vecchi sottopercorsi.
- Contrassegna gli helper SDK con nome reply come deprecati nella documentazione dopo la migrazione
  dei Plugin inclusi.

### Fase 7: tutti i mittenti

Sposta tutti i produttori outbound non di risposta su `messages.send`:

- notifiche di Cron e Heartbeat
- completamenti di task
- risultati degli hook
- prompt di approvazione e risultati di approvazione
- invii dello strumento messaggi
- annunci di completamento dei subagent
- invii espliciti da CLI o Control UI
- percorsi di automazione/broadcast

Qui il modello smette di essere "risposte dell'agente" e diventa "OpenClaw invia
messaggi".

### Fase 8: rimuovere la compatibilità con nomi basati sui turni

- Mantieni i wrapper con nomi inbound/message come finestra di compatibilità.
- Pubblica note di migrazione.
- Esegui i test di compatibilità dell'SDK dei Plugin contro i vecchi import.
- Rimuovi o nascondi i vecchi helper interni solo dopo che nessun Plugin incluso ne ha più bisogno
  e i contratti di terze parti hanno un sostituto stabile.

## Piano di test

Test unitari:

- Serializzazione e recupero degli intenti di invio durevoli.
- Riutilizzo della chiave di idempotenza e soppressione dei duplicati.
- Commit delle ricevute e salto del replay.
- Recupero di `unknown_after_send` che riconcilia prima del replay quando un adattatore
  supporta la riconciliazione.
- Criterio di classificazione degli errori.
- Sequenziamento della policy di ack in ricezione.
- Mappatura delle relazioni per invii di risposta, followup, sistema e broadcast.
- Factory dell'origine per errori del Gateway e predicato `shouldDropOpenClawEcho`.
- Preservazione dell'origine attraverso normalizzazione del payload, suddivisione in chunk,
  serializzazione della coda durevole e recupero.

Test di integrazione:

- L'adattatore semplice `channel.inbound.run` continua a registrare e inviare.
- La consegna legacy degli eventi assemblati non diventa durevole a meno che il canale
  non opti esplicitamente.
- Il bridge `channel.inbound.runPreparedReply` continua a registrare e finalizzare.
- Gli helper pubblici di compatibilità chiamano per impostazione predefinita i callback
  di consegna di proprietà del chiamante e non eseguono invii generici prima di tali callback.
- La consegna durevole di fallback riproduce l'intero array di payload proiettato dopo
  il riavvio e non può lasciare non registrati i payload successivi dopo un crash anticipato.
- La consegna durevole degli eventi assemblati restituisce gli ID dei messaggi della piattaforma
  al dispatcher bufferizzato.
- Gli hook di consegna personalizzati continuano a restituire gli ID dei messaggi della piattaforma
  quando la consegna durevole è disabilitata o non disponibile.
- La risposta finale sopravvive al riavvio tra il completamento dell'assistente e l'invio alla piattaforma.
- La bozza di anteprima viene finalizzata in loco quando consentito.
- La bozza di anteprima viene annullata o redatta quando media/errore/destinazione della risposta
  non corrispondente richiedono la consegna normale.
- Lo streaming a blocchi e lo streaming di anteprima non consegnano entrambi lo stesso testo.
- I media trasmessi in streaming in anticipo non vengono duplicati nella consegna finale.

Test dei canali:

- Risposta a topic Telegram con ack del polling ritardato fino al watermark completato sicuro
  del contesto di ricezione.
- Recupero del polling Telegram per aggiornamenti accettati ma non consegnati coperto dal
  modello persistito di offset safe-completed.
- L'anteprima obsoleta di Telegram invia un finale nuovo e pulisce l'anteprima.
- Il fallback silenzioso di Telegram invia ogni payload di fallback proiettato.
- La persistenza del fallback silenzioso di Telegram registra atomicamente l'intero array
  di fallback proiettato, non un singolo intento durevole con un solo payload per iterazione del ciclo.
- Annullamento dell'anteprima Discord su media/errore/risposta esplicita.
- I finali dei dispatcher preparati di Discord passano attraverso il contesto di invio prima che
  documentazione o changelog affermino la durabilità della risposta finale di Discord.
- Gli invii finali durevoli di iMessage popolano la cache degli echo dei messaggi inviati del monitor.
- I percorsi di consegna legacy di LINE, Zalo e Nostr non vengono bypassati dall'invio durevole
  generico finché non esistono test di parità dei loro adattatori.
- La consegna tramite callback Direct-DM/Nostr rimane autorevole salvo migrazione esplicita
  a una destinazione messaggio completa e a un adattatore di invio sicuro per il replay.
- I messaggi di errore del Gateway OpenClaw taggati in Slack restano visibili in outbound, gli echo
  taggati delle bot-room vengono scartati prima di `allowBots`, e i messaggi bot non taggati con lo
  stesso testo visibile seguono comunque la normale autorizzazione dei bot.
- Fallback dello stream nativo Slack alla bozza di anteprima nei DM di primo livello.
- Finalizzazione dell'anteprima Matrix e fallback di redazione.
- Gli echo di stanza di errori del Gateway OpenClaw taggati in Matrix provenienti da account bot
  configurati vengono scartati prima della gestione di `allowBots`.
- Gli audit della cascata di errori del Gateway in stanze condivise per Discord e Google Chat coprono
  le modalità `allowBots` prima di dichiarare protezione generica in quei canali.
- Finalizzazione della bozza Mattermost e fallback con nuovo invio.
- Finalizzazione del progresso nativo Teams.
- Soppressione dei finali duplicati Feishu.
- Fallback per timeout dell'accumulatore QQ Bot.
- Gli invii finali durevoli Tlon preservano il rendering della firma del modello e il tracciamento
  dei thread partecipati.
- Invii finali durevoli semplici per WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr,
  Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal.

Validazione:

- File Vitest mirati durante lo sviluppo.
- `pnpm check:changed` in Testbox per l'intera superficie modificata.
- `pnpm check` più ampio in Testbox prima di atterrare il refactor completo o dopo modifiche
  a SDK/export pubblici.
- Smoke live o qa-channel per almeno un canale capace di modifica e un canale semplice solo invio
  prima di rimuovere i wrapper di compatibilità.

## Domande aperte

- Se Telegram debba eventualmente sostituire la sorgente del runner grammY con una sorgente
  di polling completamente durevole che possa controllare la riconsegna a livello piattaforma,
  non solo il watermark di riavvio persistito di OpenClaw.
- Se lo stato di anteprima live durevole debba essere archiviato nello stesso record di coda
  dell'intento di invio finale o in uno store live-state fratello.
- Per quanto tempo i wrapper di compatibilità restino documentati dopo la pubblicazione di
  `plugin-sdk/channel-outbound`.
- Se i Plugin di terze parti debbano implementare direttamente adattatori di ricezione o fornire
  solo hook normalize/send/live tramite `defineChannelMessageAdapter`.
- Quali campi delle ricevute siano sicuri da esporre nell'SDK pubblico rispetto allo stato interno
  del runtime.
- Se effetti collaterali come cache degli echo propri e marker dei thread partecipati debbano essere
  modellati come hook del contesto di invio, passaggi di finalizzazione di proprietà dell'adattatore
  o sottoscrittori di ricevute.
- Quali canali abbiano metadati di origine nativi, quali richiedano registri outbound persistiti
  e quali non possano offrire una soppressione affidabile degli echo cross-bot.

## Criteri di accettazione

- Ogni canale messaggi incluso invia l'output finale visibile tramite
  `messages.send`.
- Ogni canale messaggi inbound entra tramite `messages.receive` o un
  wrapper di compatibilità documentato.
- Ogni canale di anteprima/modifica/stream usa `messages.live` per stato bozza e
  finalizzazione.
- `channel.inbound` è solo un wrapper.
- Gli helper SDK con nome reply sono export di compatibilità, non il percorso consigliato.
- Il recupero durevole può riprodurre invii finali pendenti dopo il riavvio senza perdere
  la risposta finale o duplicare invii già committati; gli invii il cui esito sulla piattaforma
  è sconosciuto vengono riconciliati prima del replay o documentati come at-least-once per
  quell'adattatore.
- Gli invii finali durevoli falliscono in modo chiuso quando l'intento durevole non può essere scritto,
  a meno che un chiamante non abbia selezionato esplicitamente una modalità non durevole documentata.
- Gli helper di compatibilità legacy dell'SDK usano per impostazione predefinita la consegna diretta
  di proprietà del canale; l'invio durevole generico è solo opt-in esplicito.
- Le ricevute preservano tutti gli ID dei messaggi della piattaforma per consegne multi-parte e un
  ID primario per comodità di threading/modifica.
- I wrapper durevoli preservano gli effetti collaterali locali del canale prima di sostituire i callback
  di consegna diretta.
- I dispatcher preparati non sono conteggiati come durevoli finché il loro percorso di consegna finale
  non usa esplicitamente il contesto di invio.
- La consegna di fallback gestisce ogni payload proiettato.
- La consegna durevole di fallback registra ogni payload proiettato in un unico intento riproducibile
  o piano batch.
- L'output di errore del Gateway originato da OpenClaw è visibile agli umani, ma gli echo di stanza
  taggati e scritti da bot vengono scartati prima dell'autorizzazione dei bot sui canali che dichiarano
  supporto per il contratto di origine.
- La documentazione spiega invio, ricezione, live, stato, ricevute, relazioni, policy di errore,
  migrazione e copertura dei test.

## Correlati

- [Messaggi](/it/concepts/messages)
- [Streaming e chunking](/it/concepts/streaming)
- [Bozze di progresso](/it/concepts/progress-drafts)
- [Policy di retry](/it/concepts/retry)
- [API inbound dei canali](/it/plugins/sdk-channel-inbound)
