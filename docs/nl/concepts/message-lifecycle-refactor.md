---
read_when:
    - Kanaalgedrag voor verzenden of ontvangen refactoren
    - Wijzigingen aan inkomend kanaalverkeer, antwoorddispatch, uitgaande wachtrij, previewstreaming of Plugin SDK-bericht-API's
    - Een nieuwe kanaal-Plugin ontwerpen die persistente verzendingen, ontvangstbevestigingen, voorvertoningen, bewerkingen of nieuwe pogingen nodig heeft
summary: Ontwerpplan voor de uniforme duurzame levenscyclus voor berichten ontvangen, verzenden, voorbeeldweergave, bewerken en streamen
title: Refactor van berichtlevenscyclus
x-i18n:
    generated_at: "2026-06-27T17:27:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Deze pagina is het doelontwerp voor het vervangen van verspreide helpers voor
inkomende kanaalberichten, antwoorddispatch, previewstreaming en uitgaande
bezorging door één duurzame berichtlevenscyclus.

De korte versie:

- De kernprimitieven moeten **ontvangen** en **verzenden** zijn, niet
  **antwoorden**.
- Een antwoord is alleen een relatie op een uitgaand bericht.
- Een beurt is een gemak voor inkomende verwerking, niet de eigenaar van
  bezorging.
- Verzenden moet contextgebaseerd zijn: `begin`, renderen, preview of stream,
  definitief verzenden, committen, falen.
- Ontvangen moet ook contextgebaseerd zijn: normaliseren, dedupliceren, routeren,
  vastleggen, dispatchen, platform-ack, falen.
- De publieke Plugin-SDK moet worden teruggebracht tot één klein oppervlak voor
  uitgaande kanaalberichten.

## Problemen

De huidige kanaalstack is ontstaan uit meerdere geldige lokale behoeften:

- Eenvoudige inkomende adapters gebruiken `runtime.channel.inbound.run`.
- Rijke adapters gebruiken `runtime.channel.inbound.runPreparedReply`.
- Legacy-helpers gebruiken `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, helpers voor antwoordpayloads,
  antwoordchunking, antwoordreferenties en runtimehelpers voor uitgaand verkeer.
- Previewstreaming leeft in kanaalspecifieke dispatchers.
- Duurzaamheid van definitieve bezorging wordt toegevoegd rond bestaande paden
  voor antwoordpayloads.

Die vorm lost lokale bugs op, maar laat OpenClaw achter met te veel publieke
concepten en te veel plekken waar bezorgsemantiek kan afwijken.

Het betrouwbaarheidsprobleem dat dit blootlegde is:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

De doelinvariant is breder dan Telegram: zodra core beslist dat er een zichtbaar
uitgaand bericht moet bestaan, moet de intentie duurzaam zijn voordat de
platformverzending wordt geprobeerd, en moet het platformontvangstbewijs na
succes worden gecommit. Dat geeft OpenClaw herstel met at-least-once-semantiek.
Exactly-once-gedrag bestaat alleen voor adapters die native idempotentie kunnen
bewijzen of een poging met onbekende status na verzenden met de platformstatus
kunnen reconciliëren voordat ze opnieuw afspelen.

Dat is de eindtoestand voor deze refactor, geen beschrijving van elk huidig pad.
Tijdens de migratie kunnen bestaande uitgaande helpers nog steeds terugvallen op
een directe verzending wanneer best-effort queue-writes falen. De refactor is pas
compleet wanneer duurzame definitieve verzendingen fail-closed zijn of expliciet
opt-outen met een gedocumenteerd niet-duurzaam beleid.

## Doelen

- Eén core-levenscyclus voor alle paden voor het ontvangen en verzenden van
  kanaalberichten.
- Duurzame definitieve verzendingen standaard in de nieuwe berichtlevenscyclus
  nadat een adapter replay-veilig gedrag declareert.
- Gedeelde semantiek voor preview, bewerken, streamen, finalisatie, retry,
  herstel en ontvangstbewijzen.
- Een klein Plugin-SDK-oppervlak dat externe Plugins kunnen leren en
  onderhouden.
- Compatibiliteit voor bestaande inkomende antwoordcompatibiliteitscallers
  tijdens migratie.
- Duidelijke uitbreidingspunten voor nieuwe kanaalmogelijkheden.
- Geen platformspecifieke branches in core.
- Geen token-delta-kanaalberichten. Kanaalstreaming blijft berichtpreview,
  bewerken, toevoegen of bezorging van voltooide blokken.
- Gestructureerde metadata met OpenClaw-oorsprong voor operationele/systeemoutput
  zodat zichtbare Gateway-fouten niet opnieuw als nieuwe prompts in gedeelde
  bot-enabled rooms terechtkomen.

## Niet-doelen

- Dwing niet elk bestaand kanaal in de eerste fase naar duurzame
  berichtbezorging.
- Dwing niet elk kanaal in hetzelfde native transportgedrag.
- Leer core geen Telegram-topics, native Slack-streams, Matrix-redacties,
  Feishu-kaarten, QQ-spraak of Teams-activiteiten.
- Publiceer niet alle interne migratiehelpers als stabiele SDK-API.
- Laat retries geen voltooide niet-idempotente platformbewerkingen opnieuw
  afspelen.

## Referentiemodel

Vercel Chat heeft een goed publiek mentaal model:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- adaptermethoden zoals `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` en het ophalen van geschiedenis
- een state-adapter voor deduplicatie, locks, queues en persistentie

OpenClaw moet de woordenschat lenen, niet het oppervlak kopiëren.

Wat OpenClaw bovenop dat model nodig heeft:

- Duurzame intenties voor uitgaande verzending vóór directe transportcalls.
- Expliciete verzendcontexten met begin, commit en fail.
- Ontvangstcontexten die het platform-ackbeleid kennen.
- Ontvangstbewijzen die een herstart overleven en bewerkingen, verwijderingen,
  herstel en duplicate suppression kunnen aansturen.
- Een kleinere publieke SDK. Gebundelde Plugins kunnen interne runtimehelpers
  gebruiken, maar externe Plugins moeten één coherente bericht-API zien.
- Agentspecifiek gedrag: sessies, transcripts, blokstreaming, toolvoortgang,
  approvals, mediadirectieven, stille antwoorden en geschiedenis van
  groepsmentions.

`thread.post()`-achtige promises zijn niet genoeg voor OpenClaw. Ze verbergen de
transactiegrens die bepaalt of een verzending herstelbaar is.

## Core-model

Het nieuwe domein moet onder een interne core-namespace leven, zoals
`src/channels/message/*`.

Het heeft vier concepten:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` beheert de inkomende levenscyclus.

`send` beheert de uitgaande levenscyclus.

`live` beheert preview-, bewerk-, voortgangs- en streamstatus.

`state` beheert duurzame intentieopslag, ontvangstbewijzen, idempotentie,
herstel, locks en deduplicatie.

## Berichttermen

### Bericht

Een genormaliseerd bericht is platformneutraal:

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

### Doel

Het doel beschrijft waar het bericht leeft:

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

### Relatie

Antwoord is een relatie, geen API-root:

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

Hierdoor kan hetzelfde verzendpad normale antwoorden, Cron-meldingen,
approval-prompts, taakvoltooiingen, message-tool-verzendingen, CLI- of Control
UI-verzendingen, subagentresultaten en automatiseringsverzendingen afhandelen.

### Oorsprong

Oorsprong beschrijft wie een bericht heeft geproduceerd en hoe OpenClaw echo's
van dat bericht moet behandelen. Het staat los van relatie: een bericht kan een
antwoord aan een gebruiker zijn en nog steeds operationele output met
OpenClaw-oorsprong zijn.

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

Core beheert de betekenis van output met OpenClaw-oorsprong. Kanalen beheren hoe
die oorsprong in hun transport wordt gecodeerd.

Het eerste vereiste gebruik is Gateway-foutoutput. Mensen moeten nog steeds
berichten zien zoals "Agent failed before reply" of "Missing API key", maar
getagde operationele OpenClaw-output mag niet worden geaccepteerd als
botgeschreven input in gedeelde rooms wanneer `allowBots` is ingeschakeld.

### Ontvangstbewijs

Ontvangstbewijzen zijn first-class:

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

Ontvangstbewijzen zijn de brug van duurzame intentie naar toekomstige
bewerkingen, verwijderingen, previewfinalisatie, duplicate suppression en herstel.

Een ontvangstbewijs kan één platformbericht of een bezorging in meerdere delen
beschrijven. Gechunkte tekst, media plus tekst, spraak plus tekst en
kaartfallbacks moeten alle platform-id's behouden, terwijl ze nog steeds een
primaire id voor threading en latere bewerkingen blootstellen.

## Ontvangstcontext

Ontvangen moet geen kale helpercall zijn. Core heeft een context nodig die
deduplicatie, routering, sessieregistratie en platform-ackbeleid kent.

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

Ontvangstflow:

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

Ack is niet één ding. Het ontvangstcontract moet deze signalen gescheiden houden:

- **Transport-ack:** vertelt de platformwebhook of socket dat OpenClaw de
  event-envelope heeft geaccepteerd. Sommige platforms vereisen dit vóór
  dispatch.
- **Polling-offset-ack:** verplaatst een cursor zodat hetzelfde event niet
  opnieuw wordt opgehaald. Dit mag niet voorbij werk gaan dat niet kan worden
  hersteld.
- **Inkomende-record-ack:** bevestigt dat OpenClaw genoeg inkomende metadata
  heeft gepersisteerd om een herbezorging te dedupliceren en routeren.
- **Gebruikerszichtbaar ontvangstbewijs:** optioneel lees-/status-/typinggedrag;
  nooit een duurzaamheidsgrens.

`ReceiveAckPolicy` beheert alleen transport- of pollingbevestiging. Het mag niet
worden hergebruikt voor leesbevestigingen of statusreacties.

Vóór botautorisatie moet ontvangst het gedeelde OpenClaw-echobeleid toepassen
wanneer het kanaal metadata over berichtoorsprong kan decoderen:

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

Deze drop is taggebaseerd, niet tekstgebaseerd. Een door een bot geschreven
roombericht met dezelfde zichtbare Gateway-fouttekst maar zonder
OpenClaw-oorsprongmetadata gaat nog steeds door normale `allowBots`-autorisatie.

Ackbeleid is expliciet:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram-polling gebruikt nu het ackbeleid van de ontvangstcontext voor zijn
gepersistenceerde herstart-watermark. De tracker observeert nog steeds
grammY-updates wanneer ze de middlewareketen binnenkomen, maar OpenClaw
persisteert alleen de veilige voltooide update-id na succesvolle dispatch,
waardoor mislukte of lagere pending updates na een herstart opnieuw afspeelbaar
blijven. Telegrams upstream `getUpdates`-fetchoffset wordt nog steeds beheerd
door de pollingbibliotheek, dus de resterende diepere ingreep is een volledig
duurzame pollingbron als we redelivery op platformniveau nodig hebben voorbij de
herstart-watermark van OpenClaw. Webhookplatforms hebben mogelijk onmiddellijke
HTTP-ack nodig, maar ze hebben nog steeds inkomende deduplicatie en duurzame
intenties voor uitgaande verzending nodig omdat webhooks kunnen herbezorgen.

## Verzendcontext

Verzenden is ook contextgebaseerd:

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

Voorkeursorkestratie:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

De helper breidt uit naar:

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

De intent moet bestaan voordat transport-I/O plaatsvindt. Een herstart na begin maar vóór
commit is herstelbaar.

De gevaarlijke grens ligt na platformsucces en vóór receipt-commit. Als een
proces daar uitvalt, kan OpenClaw niet weten of het platformbericht bestaat,
tenzij de adapter native idempotentie of een pad voor receipt-reconciliatie biedt.
Die pogingen moeten hervatten in `unknown_after_send`, niet blind opnieuw worden afgespeeld. Kanalen
zonder reconciliatie mogen alleen kiezen voor at-least-once opnieuw afspelen als dubbele zichtbare
berichten een acceptabele, gedocumenteerde afweging zijn voor dat kanaal en die relatie.
De huidige SDK-reconciliatiebridge vereist dat de adapter
`reconcileUnknownSend` declareert, en vraagt vervolgens `durableFinal.reconcileUnknownSend` om
een onbekende entry te classificeren als `sent`, `not_sent` of `unresolved`; alleen `not_sent`
staat opnieuw afspelen toe, en onopgeloste entries blijven terminaal of proberen alleen de
reconciliatiecontrole opnieuw.

Duurzaamheidsbeleid moet expliciet zijn:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` betekent dat core fail-closed moet zijn wanneer het de duurzame intent niet kan schrijven.
`best_effort` kan doorvallen wanneer persistentie niet beschikbaar is. `disabled` behoudt
het oude directe verzendgedrag. Tijdens migratie gebruiken legacy wrappers en publieke
compatibiliteitshelpers standaard `disabled`; ze mogen niet `required` afleiden uit
het feit dat een kanaal een generieke outbound-adapter heeft.

Verzendcontexten beheren ook kanaallokale effecten na verzending. Een migratie is niet veilig
als duurzame levering lokaal gedrag omzeilt dat eerder was gekoppeld aan het
directe verzendpad van het kanaal. Voorbeelden zijn caches voor het onderdrukken van self-echo's,
markers voor deelname aan threads, native edit-ankers, rendering van modelhandtekeningen
en platformspecifieke bescherming tegen duplicaten. Die effecten moeten ofwel naar de
send-adapter, de render-adapter, of een benoemde send-context-hook verhuizen voordat dat
kanaal duurzame generieke eindlevering kan inschakelen.

Verzendhelpers moeten receipts helemaal teruggeven aan hun aanroeper. Duurzame
wrappers mogen message-id's niet inslikken of een kanaalleveringsresultaat vervangen door
`undefined`; gebufferde dispatchers gebruiken die id's voor thread-ankers, latere edits,
previewfinalisatie en duplicaatonderdrukking.

Fallback-verzendingen werken op batches, niet op losse payloads. Silent-reply-herschrijvingen,
mediafallback, cardfallback en chunkprojectie kunnen allemaal meer dan
één leverbaar bericht produceren, dus een verzendcontext moet ofwel de hele
geprojecteerde batch leveren, of expliciet documenteren waarom slechts één payload geldig is.

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

Wanneer zo'n fallback duurzaam is, moet de hele geprojecteerde batch worden weergegeven door
één duurzame send intent of een ander atomair batchplan. Elke payload
één voor één registreren is niet genoeg: een crash tussen payloads kan een gedeeltelijk zichtbare
fallback achterlaten zonder duurzaam record voor de resterende payloads. Herstel moet weten
welke units al receipts hebben en ofwel alleen ontbrekende units opnieuw afspelen of
de batch markeren als `unknown_after_send` totdat de adapter deze reconcilieert.

## Live context

Preview-, edit-, voortgangs- en streamgedrag moeten één opt-in lifecycle zijn.

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

Live state is duurzaam genoeg om duplicaten te herstellen of te onderdrukken:

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

Dit moet huidig gedrag dekken:

- Telegram-verzending plus edit-preview, met een verse finale na verouderde previewleeftijd.
- Discord-verzending plus edit-preview, annuleren bij media/fout/expliciet antwoord.
- Slack native stream of concept-preview afhankelijk van threadvorm.
- Mattermost-finalisatie van conceptpost.
- Matrix-finalisatie van concept-event of redactie bij mismatch.
- Teams native voortgangsstream.
- QQ Bot-stream of geaccumuleerde fallback.

## Adapteroppervlak

Het publieke SDK-doel moet één subpad zijn:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

Doelvorm:

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

Send-adapter:

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

Receive-adapter:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Vóór preflight-autorisatie moet core de gedeelde OpenClaw-echo-predicate uitvoeren
telkens wanneer `origin.decode` OpenClaw-origin-metadata retourneert. De receive-adapter
levert platformfeiten zoals bot-auteur en roomvorm; core beheert de drop-
beslissing en ordening, zodat kanalen tekstfilters niet opnieuw implementeren.

Origin-adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core stelt `MessageOrigin` in. Kanalen vertalen dit alleen naar en van native
transportmetadata. Slack mapt dit naar `chat.postMessage({ metadata })` en
inkomende `message.metadata`; Matrix kan het mappen naar extra eventcontent; kanalen
zonder native metadata kunnen een receipt/outbound-register gebruiken wanneer dat de
best beschikbare benadering is.

Capabilities:

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

## Publieke SDK-reductie

Het nieuwe publieke oppervlak moet deze conceptuele gebieden absorberen of afkeuren:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- de meeste publieke gebruiken van `outbound-runtime`
- ad-hoc helpers voor de concept-stream-lifecycle

Compatibiliteitssubpaden kunnen als wrappers blijven bestaan, maar nieuwe externe plugins
zouden ze niet nodig moeten hebben.

Gebundelde plugins mogen tijdens migratie interne helperimports via gereserveerde runtime-
subpaden blijven gebruiken. Publieke docs moeten pluginauteurs naar
`plugin-sdk/channel-outbound` sturen zodra dit bestaat.

## Relatie tot channel inbound

`runtime.channel.inbound.*` is de runtimebridge tijdens migratie.

Het moet een compatibiliteitsadapter worden:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` moet in eerste instantie ook blijven bestaan:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Het oude `channel.turn`-runtimeoppervlak is verwijderd. Runtime-aanroepers gebruiken
`channel.inbound.*`; kanaaldocs en SDK-subpaden gebruiken inbound/message-naamwoorden.

## Compatibiliteitsrails

Tijdens migratie is generieke duurzame levering opt-in voor elk kanaal waarvan de
bestaande delivery-callback bijwerkingen heeft buiten "verzend deze payload".

Legacy entrypoints zijn standaard niet-duurzaam:

- `channel.inbound.run` en `dispatchChannelInboundReply` gebruiken de delivery-callback van het kanaal
  tenzij dat kanaal expliciet een gecontroleerd duurzaam beleid/options-object levert.
- `channel.inbound.runPreparedReply` blijft kanaal-eigendom totdat de prepared dispatcher
  expliciet de send-context aanroept.
- Publieke compatibiliteitshelpers zoals `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` en direct-DM-helpers injecteren nooit generieke
  duurzame levering vóór de door de aanroeper geleverde `deliver`- of `reply`-callback.

Voor migratiebridgetypes betekent `durable: undefined` "niet duurzaam". Het
duurzame pad wordt alleen ingeschakeld door een expliciete policy/options-waarde. `durable:
false` kan als compatibiliteitsspelling blijven bestaan, maar de implementatie mag niet
vereisen dat elk ongemigreerd kanaal dit toevoegt.

Huidige bridgecode moet de duurzaamheidsbeslissing expliciet houden:

- Duurzame eindlevering retourneert een gediscrimineerde status. `handled_visible` en
  `handled_no_send` zijn terminal; `unsupported` en `not_applicable` kunnen
  terugvallen op kanaalbeheerde levering; `failed` propageert de verzendfout.
- Generieke duurzame eindlevering wordt afgeschermd door adaptermogelijkheden zoals
  stille levering, behoud van antwoorddoel, behoud van native citaten en
  hooks voor berichtverzending. Ontbrekende pariteit moet kanaalbeheerde levering kiezen,
  geen generieke verzending die zichtbaar gedrag voor gebruikers wijzigt.
- Wachtrijgedragen duurzame verzendingen geven een referentie naar de leveringsintentie vrij. Bestaande
  `pendingFinalDelivery*`-sessievelden kunnen de intentie-id tijdens de
  overgang dragen; de eindtoestand is een `MessageSendIntent`-opslag in plaats van bevroren
  antwoordtekst plus ad-hoc contextvelden.

Schakel het generieke duurzame pad niet in voor een kanaal totdat al het volgende
waar is:

- De generieke verzendadapter voert hetzelfde render- en transportgedrag uit als
  het oude directe pad.
- Lokale neveneffecten na verzending blijven behouden via de verzendcontext.
- De adapter retourneert ontvangstbewijzen of leveringsresultaten met alle platformbericht-
  id's.
- Voorbereide dispatcher-paden roepen de nieuwe verzendcontext aan of blijven gedocumenteerd
  als buiten de duurzame garantie.
- Fallback-levering verwerkt elke geprojecteerde payload, niet alleen de eerste.
- Duurzame fallback-levering registreert de volledige geprojecteerde payload-array als één
  herspeelbare intentie of batchplan.

Concrete migratierisico's om te behouden:

- iMessage-monitorlevering registreert verzonden berichten in een echo-cache na een
  geslaagde verzending. Duurzame eindverzendingen moeten die cache nog steeds vullen, anders
  kan OpenClaw zijn eigen eindantwoorden opnieuw opnemen als inkomende gebruikersberichten.
- Tlon voegt een optionele modelhandtekening toe en registreert deelnemende threads
  na groepsantwoorden. Generieke duurzame levering mag die effecten niet omzeilen;
  verplaats ze naar Tlon-render-/verzend-/finalize-adapters of houd Tlon op het
  kanaalbeheerde pad.
- Discord en andere voorbereide dispatchers beheren al directe levering en preview-
  gedrag. Ze vallen niet onder een duurzame garantie voor een samengestelde beurt totdat
  hun voorbereide dispatchers eindberichten expliciet via de verzendcontext routeren.
- Stille Telegram-fallback-levering moet de volledige geprojecteerde payload-
  array leveren. Een snelkoppeling voor één payload kan extra fallback-payloads na
  projectie laten vallen.
- LINE, Zalo, Nostr en andere bestaande samengestelde/helper-paden kunnen
  reply-tokenverwerking, mediaproxying, caches voor verzonden berichten, opschoning van laad-/status-
  informatie of doelen met alleen callback hebben. Ze blijven op kanaalbeheerde levering totdat
  die semantiek door de verzendadapter wordt weergegeven en door tests is geverifieerd.
- Direct-DM-helpers kunnen een antwoordcallback hebben die het enige juiste transport-
  doel is. Generieke uitgaande verzending mag niet raden op basis van `OriginatingTo` of `To` en
  die callback overslaan.
- OpenClaw Gateway-foutuitvoer moet zichtbaar blijven voor mensen, maar getagde
  door bots geschreven kamer-echo's moeten worden verwijderd vóór `allowBots`-autorisatie.
  Kanalen mogen dit niet implementeren met prefixfilters op zichtbare tekst, behalve als een
  korte noodstop; het duurzame contract is gestructureerde oorsprongsmetadata.

## Interne opslag

De duurzame wachtrij moet berichtverzendintenties opslaan, geen antwoordpayloads.

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

Herstellus:

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

De wachtrij moet voldoende identiteit bewaren om na een herstart opnieuw af te spelen via hetzelfde account,
dezelfde thread, hetzelfde doel, hetzelfde formatteringsbeleid en dezelfde mediaregels.

## Foutklassen

Kanaaladapters classificeren transportfouten in gesloten categorieën:

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

Kernbeleid:

- Probeer `transient` en `rate_limit` opnieuw.
- Probeer `invalid_payload` niet opnieuw, tenzij er een renderfallback bestaat.
- Probeer `auth` of `permission` niet opnieuw totdat de configuratie wijzigt.
- Laat live-finalisatie bij `not_found` terugvallen van bewerken naar een nieuwe verzending wanneer
  het kanaal verklaart dat dit veilig is.
- Gebruik bij `conflict` ontvangstbewijs-/idempotentieregels om te bepalen of het bericht
  al bestaat.
- Elke fout nadat de adapter mogelijk platform-I/O heeft voltooid maar vóór het vastleggen van het ontvangstbewijs
  wordt `unknown_after_send`, tenzij de adapter kan bewijzen dat de platform-
  operatie niet heeft plaatsgevonden.

## Kanaaltoewijzing

| Kanaal          | Doelmigratie                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Ontvangstbevestigingsbeleid plus duurzame definitieve verzendingen. Live-adapter beheert verzending plus bewerking van voorbeeld, definitieve verzending bij verouderd voorbeeld, onderwerpen, overslaan van quote-antwoordvoorbeeld, mediafallback en retry-after-afhandeling.                                                                               |
| Discord         | Verzendadapter verpakt bestaande duurzame payloadbezorging. Live-adapter beheert conceptbewerking, voortgangsconcept, annulering van media-/foutvoorbeeld, behoud van antwoorddoel en ontvangstbewijzen voor bericht-id's. Audit door bot geschreven echo's van Gateway-fouten in gedeelde ruimtes; gebruik een uitgaand register of ander native equivalent als Discord geen oorsprongsmetadata op normale berichten kan dragen. |
| Slack           | Verzendadapter verwerkt normale chatberichten. Live-adapter kiest native stream wanneer de threadvorm dit ondersteunt, anders conceptvoorbeeld. Ontvangstbewijzen behouden thread-tijdstempels. Oorsprongadapter koppelt OpenClaw Gateway-fouten aan Slack `chat.postMessage.metadata` en verwijdert getagde bot-ruimte-echo's vóór `allowBots`-autorisatie. |
| WhatsApp        | Verzendadapter beheert tekst-/mediaverzending met duurzame definitieve intents. Ontvangstadapter verwerkt groepsvermelding en afzenderidentiteit. Live kan afwezig blijven totdat WhatsApp een bewerkbaar transport heeft.                                                                                                                                     |
| Matrix          | Live-adapter beheert bewerkingen van conceptgebeurtenissen, finalisatie, redactie, beperkingen voor versleutelde media en fallback bij niet-overeenkomend antwoorddoel. Ontvangstadapter beheert hydratatie en deduplicatie van versleutelde gebeurtenissen. Oorsprongadapter moet de oorsprong van OpenClaw Gateway-fouten coderen in Matrix-gebeurtenisinhoud en geconfigureerde bot-ruimte-echo's verwijderen vóór `allowBots`-afhandeling. |
| Mattermost      | Live-adapter beheert één conceptbericht, samenvoegen van voortgang/tools, finalisatie op dezelfde plek en fallback naar verse verzending.                                                                                                                                                                                                                     |
| Microsoft Teams | Live-adapter beheert native voortgang en blokstreamgedrag. Verzendadapter beheert activiteiten en ontvangstbewijzen voor bijlagen/kaarten.                                                                                                                                                                                                                     |
| Feishu          | Renderadapter beheert tekst-/kaart-/raw-rendering. Live-adapter beheert streamingkaarten en onderdrukking van dubbele definitieve berichten. Verzendadapter beheert opmerkingen, onderwerpsessies, media en stemonderdrukking.                                                                                                                               |
| QQ Bot          | Live-adapter beheert C2C-streaming, accumulatortime-out en definitieve fallbackverzending. Renderadapter beheert mediatags en tekst-als-spraak.                                                                                                                                                                                                                |
| Signal          | Eenvoudige ontvangstadapter plus verzendadapter. Geen live-adapter tenzij signal-cli betrouwbare bewerkingsondersteuning toevoegt.                                                                                                                                                                                                                             |
| iMessage        | Eenvoudige ontvangstadapter plus verzendadapter. iMessage-verzending moet populatie van de monitor-echo-cache behouden voordat duurzame definitieve berichten monitorbezorging kunnen omzeilen.                                                                                                                                                               |
| Google Chat     | Eenvoudige ontvangstadapter plus verzendadapter met threadrelatie gekoppeld aan ruimtes en thread-id's. Audit ruimtegedrag met `allowBots=true` voor getagde echo's van OpenClaw Gateway-fouten.                                                                                                                                                              |
| LINE            | Eenvoudige ontvangstadapter plus verzendadapter met reply-tokenbeperkingen gemodelleerd als doel-/relatiecapaciteit.                                                                                                                                                                                                                                          |
| Nextcloud Talk  | SDK-ontvangstbridge plus verzendadapter.                                                                                                                                                                                                                                                                                                                       |
| IRC             | Eenvoudige ontvangstadapter plus verzendadapter, geen duurzame ontvangstbewijzen voor bewerkingen.                                                                                                                                                                                                                                                             |
| Nostr           | Ontvangstadapter plus verzendadapter voor versleutelde DM's; ontvangstbewijzen zijn gebeurtenis-id's.                                                                                                                                                                                                                                                          |
| QA-kanaal       | Contracttestadapter voor ontvangst-, verzend-, live-, retry- en herstelgedrag.                                                                                                                                                                                                                                                                                 |
| Synology Chat   | Eenvoudige ontvangstadapter plus verzendadapter.                                                                                                                                                                                                                                                                                                               |
| Tlon            | Verzendadapter moet modelhandtekening-rendering en tracking van deelgenomen threads behouden voordat generieke duurzame definitieve bezorging wordt ingeschakeld.                                                                                                                                                                                             |
| Twitch          | Eenvoudige ontvangstadapter plus verzendadapter met rate-limitclassificatie.                                                                                                                                                                                                                                                                                   |
| Zalo            | Eenvoudige ontvangstadapter plus verzendadapter.                                                                                                                                                                                                                                                                                                               |
| Zalo Personal   | Eenvoudige ontvangstadapter plus verzendadapter.                                                                                                                                                                                                                                                                                                               |

## Migratieplan

### Fase 1: Intern berichtdomein

- Voeg `src/channels/message/*`-typen toe voor berichten, doelen, relaties,
  oorsprongen, ontvangstbewijzen, capaciteiten, duurzame intents, ontvangstcontext, verzendcontext,
  live-context en foutklassen.
- Voeg `origin?: MessageOrigin` toe aan het migratiebridge-payloadtype dat wordt gebruikt door
  huidige antwoordbezorging, en verplaats dat veld daarna naar `ChannelMessage` en gerenderde
  berichttypen terwijl de refactor antwoordpayloads vervangt.
- Houd dit intern totdat adapters en tests de vorm bewijzen.
- Voeg pure unit-tests toe voor statusovergangen en serialisatie.

### Fase 2: Kern voor duurzame verzending

- Verplaats de bestaande uitgaande wachtrij van duurzaamheid voor antwoordpayloads naar duurzame
  intents voor berichtverzending.
- Laat een duurzame verzend-intent een geprojecteerde payload-array of batchplan dragen, niet
  slechts één antwoordpayload.
- Behoud het huidige wachtrijherstelgedrag via compatibiliteitsconversie.
- Laat `deliverOutboundPayloads` `messages.send` aanroepen.
- Maak duurzaamheid van definitieve verzending de standaard en faal gesloten wanneer de duurzame intent
  niet kan worden geschreven in de nieuwe berichtlevenscyclus, nadat de adapter
  replay-veiligheid verklaart. Bestaande inbound runner- en SDK-compatibiliteitspaden blijven
  tijdens deze fase standaard directe verzending gebruiken.
- Registreer ontvangstbewijzen consistent.
- Retourneer ontvangstbewijzen en bezorgresultaten aan de oorspronkelijke dispatcher-aanroeper in plaats
  van duurzame verzending als een terminaal neveneffect te behandelen.
- Bewaar berichtoorsprong via duurzame verzend-intents zodat herstel, replay en
  verzending in chunks de operationele herkomst van OpenClaw behouden.

### Fase 3: Channel Inbound Bridge

- Implementeer `channel.inbound.run` en `dispatchChannelInboundReply` opnieuw boven op
  `messages.receive` en `messages.send`.
- Houd huidige fact-typen stabiel.
- Behoud standaard legacy-gedrag. Een assembled-turn-kanaal wordt alleen duurzaam
  wanneer de adapter expliciet opt-in doet met een replay-veilig duurzaamheidsbeleid.
- Houd `durable: false` als compatibiliteitsuitweg voor paden die native bewerkingen finaliseren
  en nog niet veilig kunnen replayen, maar vertrouw niet op `false`-markeringen
  om niet-gemigreerde kanalen te beschermen.
- Stel assembled-turn-duurzaamheid alleen standaard in binnen de nieuwe berichtlevenscyclus, nadat
  de kanaalkoppeling bewijst dat het generieke verzendpad de oude kanaalbezorgingssemantiek behoudt.

### Fase 4: Prepared Dispatcher Bridge

- Vervang `deliverDurableInboundReplyPayload` door een send-context-bridge.
- Behoud de oude helper als wrapper.
- Porteer eerst Telegram, WhatsApp, Slack, Signal, iMessage en Discord, omdat
  ze al durable-final-werk of eenvoudigere verzendpaden hebben.
- Behandel elke voorbereide dispatcher als niet gedekt totdat deze expliciet
  kiest voor de send context. Documentatie en changelog-vermeldingen moeten
  "samengestelde channel turns" zeggen of de gemigreerde kanaalpaden noemen in
  plaats van alle automatische eindantwoorden te claimen.
- Houd `recordInboundSessionAndDispatchReply`, direct-DM-helpers en vergelijkbare
  publieke compatibiliteitshelpers gedragsbehoudend. Ze mogen later een expliciete
  send-context-opt-in blootstellen, maar mogen niet automatisch proberen generieke
  duurzame levering uit te voeren vóór de door de caller beheerde delivery callback.

### Fase 5: Uniforme live-levenscyclus

- Bouw `messages.live` met twee proof-adapters:
  - Telegram voor verzenden plus bewerken plus verouderde eindverzending.
  - Matrix voor conceptfinalisatie plus redactie-fallback.
- Migreer daarna Discord, Slack, Mattermost, Teams, QQ Bot en Feishu.
- Verwijder gedupliceerde code voor preview-finalisatie pas nadat elk kanaal
  pariteitstests heeft.

### Fase 6: Publieke SDK

- Voeg `openclaw/plugin-sdk/channel-outbound` toe.
- Documenteer dit als de voorkeurs-API voor channel-Plugins.
- Werk package-exports, entrypoint-inventaris, gegenereerde API-baselines en
  Plugin-SDK-documentatie bij.
- Neem `MessageOrigin`, origin-encode/decode-hooks en het gedeelde
  `shouldDropOpenClawEcho`-predicaat op in het channel-outbound-SDK-oppervlak.
- Behoud compatibiliteitswrappers voor oude subpaden.
- Markeer reply-genoemde SDK-helpers als verouderd in de documentatie nadat gebundelde Plugins zijn
  gemigreerd.

### Fase 7: Alle afzenders

Verplaats alle niet-reply outbound producers naar `messages.send`:

- cron- en Heartbeat-meldingen
- taakvoltooiingen
- hook-resultaten
- goedkeuringsprompts en goedkeuringsresultaten
- verzendingen van message tools
- aankondigingen van voltooiing door subagents
- expliciete CLI- of Control UI-verzendingen
- automatiserings-/broadcastpaden

Dit is waar het model stopt met "agentantwoorden" en "OpenClaw verzendt
berichten" wordt.

### Fase 8: Turn-genoemde compatibiliteit verwijderen

- Behoud inbound/message-genoemde wrappers als compatibiliteitsvenster.
- Publiceer migratienotities.
- Voer Plugin-SDK-compatibiliteitstests uit tegen oude imports.
- Verwijder of verberg oude interne helpers pas nadat geen gebundelde Plugin ze
  nog nodig heeft en contracten van derden een stabiele vervanging hebben.

## Testplan

Unittests:

- Serialisatie en herstel van duurzame verzendintenties.
- Hergebruik van idempotentiesleutels en onderdrukking van duplicaten.
- Receipt-commit en replay-skip.
- `unknown_after_send`-herstel dat reconcile uitvoert vóór replay wanneer een adapter
  reconciliation ondersteunt.
- Beleid voor foutclassificatie.
- Volgordebepaling van receive-ack-beleid.
- Relatiemapping voor reply-, followup-, system- en broadcast-verzendingen.
- Origin-factory voor Gateway-fouten en `shouldDropOpenClawEcho`-predicaat.
- Behoud van origin via payloadnormalisatie, chunking, serialisatie van durable queue
  en herstel.

Integratietests:

- `channel.inbound.run` eenvoudige adapter registreert en verzendt nog steeds.
- Verouderde assembled-event-levering wordt niet duurzaam tenzij het kanaal
  expliciet opt-in doet.
- `channel.inbound.runPreparedReply`-bridge registreert en finaliseert nog steeds.
- Publieke compatibiliteitshelpers roepen standaard door de caller beheerde delivery callbacks aan
  en generic-senden niet vóór die callbacks.
- Duurzame fallback-levering speelt de volledige geprojecteerde payload-array opnieuw af na
  herstart en kan de latere payloads niet ongeregistreerd laten na een vroege crash.
- Duurzame assembled-event-levering retourneert platformbericht-id's aan de gebufferde
  dispatcher.
- Aangepaste delivery hooks retourneren nog steeds platformbericht-id's wanneer duurzame levering
  is uitgeschakeld of niet beschikbaar is.
- Eindantwoord overleeft herstart tussen assistant-voltooiing en platformverzending.
- Preview-concept finaliseert op zijn plaats wanneer toegestaan.
- Preview-concept wordt geannuleerd of geredacteerd wanneer media-/fout-/reply-target-mismatch
  normale levering vereist.
- Block-streaming en preview-streaming leveren niet allebei dezelfde tekst.
- Vroeg gestreamde media worden niet gedupliceerd in de uiteindelijke levering.

Kanaaltests:

- Telegram-topicantwoord met polling-ack uitgesteld tot de safe
  completed-watermark van de receive context.
- Telegram-pollingherstel voor geaccepteerde maar niet-geleverde updates gedekt door
  het persistente safe-completed-offsetmodel.
- Telegram verouderde preview verzendt verse finale en ruimt preview op.
- Telegram silent fallback verzendt elke geprojecteerde fallback-payload.
- Telegram silent fallback-duurzaamheid registreert de volledige geprojecteerde fallback-array
  atomisch, niet één duurzame single-payload-intentie per lusiteratie.
- Discord-preview-annulering bij media/fout/expliciete reply.
- Discord voorbereide dispatcher-finales routeren via de send context voordat docs
  of changelog Discord-final-reply-duurzaamheid claimen.
- iMessage duurzame eindverzendingen vullen de echo-cache voor verzonden berichten van de monitor.
- LINE, Zalo en Nostr legacy-delivery-paden worden niet omzeild door
  generic durable send totdat hun adapterpariteitstests bestaan.
- Direct-DM-/Nostr-callbacklevering blijft gezaghebbend tenzij expliciet
  gemigreerd naar een compleet message target en replay-veilige send-adapter.
- Slack getagde OpenClaw-Gateway-foutberichten blijven zichtbaar outbound, getagde
  bot-room-echo's worden gedropt vóór `allowBots`, en ongetagde botberichten met
  dezelfde zichtbare tekst volgen nog steeds normale botautorisatie.
- Slack native stream-fallback naar conceptpreview in top-level-DM's.
- Matrix-previewfinalisatie en redactie-fallback.
- Matrix getagde OpenClaw-Gateway-fout-room-echo's van geconfigureerde bot
  accounts worden gedropt vóór `allowBots`-afhandeling.
- Discord en Google Chat shared-room-Gateway-failure-cascade-audits dekken
  `allowBots`-modi voordat daar generieke bescherming wordt geclaimd.
- Mattermost-conceptfinalisatie en fresh-send-fallback.
- Teams native voortgangsfinalisatie.
- Feishu-onderdrukking van dubbele finale.
- QQ Bot accumulator-timeout-fallback.
- Tlon duurzame eindverzendingen behouden model-signature-rendering en participated
  thread-tracking.
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo en Zalo Personal eenvoudige duurzame
  eindverzendingen.

Validatie:

- Gerichte Vitest-bestanden tijdens ontwikkeling.
- `pnpm check:changed` in Testbox voor het volledige gewijzigde oppervlak.
- Bredere `pnpm check` in Testbox vóór het landen van de volledige refactor of na
  publieke SDK-/exportwijzigingen.
- Live of qa-channel-smoke voor ten minste één kanaal dat bewerken ondersteunt en één
  eenvoudig send-only-kanaal voordat compatibiliteitswrappers worden verwijderd.

## Open vragen

- Of Telegram uiteindelijk de grammY-runnerbron moet vervangen door een
  volledig duurzame pollingbron die platformniveau-herlevering kan sturen, niet
  alleen OpenClaw's persistente herstart-watermark.
- Of duurzame live-previewstatus moet worden opgeslagen in hetzelfde queue-record
  als de uiteindelijke verzendintentie of in een sibling live-state-store.
- Hoe lang compatibiliteitswrappers gedocumenteerd blijven nadat
  `plugin-sdk/channel-outbound` wordt verzonden.
- Of Plugins van derden receive-adapters rechtstreeks moeten implementeren of alleen
  normalize/send/live-hooks moeten leveren via `defineChannelMessageAdapter`.
- Welke receipt-velden veilig zijn om bloot te stellen in de publieke SDK versus interne runtime
  state.
- Of side-effects zoals self-echo-caches en participated-thread-markers moeten
  worden gemodelleerd als send-context-hooks, finalize-stappen beheerd door adapters, of
  receipt-subscribers.
- Welke kanalen native origin-metadata hebben, welke persistente outbound
  registries nodig hebben en welke geen betrouwbare cross-bot-echo-onderdrukking kunnen bieden.

## Acceptatiecriteria

- Elk gebundeld berichtenkanaal verzendt uiteindelijke zichtbare uitvoer via
  `messages.send`.
- Elk inbound berichtenkanaal komt binnen via `messages.receive` of een
  gedocumenteerde compatibiliteitswrapper.
- Elk preview-/edit-/stream-kanaal gebruikt `messages.live` voor conceptstatus en
  finalisatie.
- `channel.inbound` is alleen een wrapper.
- Reply-genoemde SDK-helpers zijn compatibiliteitsexports, niet het aanbevolen pad.
- Duurzaam herstel kan pending eindverzendingen na herstart opnieuw afspelen zonder
  het eindantwoord te verliezen of reeds gecommitte verzendingen te dupliceren; verzendingen waarvan
  de platformuitkomst onbekend is, worden vóór replay gereconciled of gedocumenteerd als
  at-least-once voor die adapter.
- Duurzame eindverzendingen fail closed wanneer de durable intent niet kan worden geschreven,
  tenzij een caller expliciet een gedocumenteerde niet-duurzame modus heeft geselecteerd.
- Legacy SDK-compatibiliteitshelpers gebruiken standaard directe
  door het kanaal beheerde levering; generic durable send is alleen expliciete opt-in.
- Receipts behouden alle platformbericht-id's voor leveringen met meerdere delen en een
  primaire id voor threading-/edit-gemak.
- Duurzame wrappers behouden kanaallokale side-effects voordat directe
  delivery callbacks worden vervangen.
- Voorbereide dispatchers worden niet als duurzaam meegeteld totdat hun uiteindelijke delivery
  path expliciet de send context gebruikt.
- Fallback-levering verwerkt elke geprojecteerde payload.
- Duurzame fallback-levering registreert elke geprojecteerde payload in één replaybare
  intentie of batchplan.
- Door OpenClaw afkomstige Gateway-foutoutput is zichtbaar voor mensen, maar getagde
  door bots gemaakte room-echo's worden gedropt vóór botautorisatie op kanalen die
  ondersteuning voor het origin-contract declareren.
- De docs leggen send, receive, live, state, receipts, relations, failure
  policy, migration en test coverage uit.

## Gerelateerd

- [Berichten](/nl/concepts/messages)
- [Streaming en chunking](/nl/concepts/streaming)
- [Voortgangsconcepten](/nl/concepts/progress-drafts)
- [Retrybeleid](/nl/concepts/retry)
- [Channel inbound API](/nl/plugins/sdk-channel-inbound)
