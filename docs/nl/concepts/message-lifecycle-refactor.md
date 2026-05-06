---
read_when:
    - Verzend- of ontvangstgedrag van kanalen refactoren
    - Het wijzigen van kanaalbeurt, antwoordverzending, uitgaande wachtrij, voorvertoningsstreaming of bericht-API's van de Plugin SDK
    - Een nieuwe kanaal-Plugin ontwerpen die duurzame verzendingen, ontvangstbevestigingen, voorvertoningen, bewerkingen of herhalingspogingen nodig heeft
summary: Ontwerpplan voor de uniforme duurzame levenscyclus voor het ontvangen, verzenden, voorvertonen, bewerken en streamen van berichten
title: Refactor van de berichtlevenscyclus
x-i18n:
    generated_at: "2026-05-06T09:08:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Deze pagina is het doelontwerp voor het vervangen van verspreide helpers voor kanaalbeurten, antwoorddispatch, preview-streaming en uitgaande levering door één duurzame berichtlevenscyclus.

De korte versie:

- De kernprimitieven moeten **ontvangen** en **verzenden** zijn, niet **antwoorden**.
- Een antwoord is alleen een relatie op een uitgaand bericht.
- Een beurt is een hulpmiddel voor inkomende verwerking, niet de eigenaar van levering.
- Verzenden moet contextgebaseerd zijn: `begin`, renderen, preview of streamen, definitief verzenden, committen, mislukken.
- Ontvangen moet ook contextgebaseerd zijn: normaliseren, dedupliceren, routeren, registreren, dispatchen, platform-ack, mislukken.
- De publieke plugin-SDK moet worden teruggebracht tot één klein oppervlak voor kanaalberichten.

## Problemen

De huidige kanaalstack is ontstaan uit meerdere geldige lokale behoeften:

- Eenvoudige inkomende adapters gebruiken `runtime.channel.turn.run`.
- Rijke adapters gebruiken `runtime.channel.turn.runPrepared`.
- Legacy-helpers gebruiken `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, helpers voor antwoordpayloads, antwoordchunking, antwoordreferenties en helpers voor uitgaande runtime.
- Preview-streaming leeft in kanaalspecifieke dispatchers.
- Duurzaamheid van definitieve levering wordt toegevoegd rond bestaande paden voor antwoordpayloads.

Die vorm lost lokale bugs op, maar laat OpenClaw achter met te veel publieke concepten en te veel plaatsen waar leveringssemantiek kan afwijken.

Het betrouwbaarheidsprobleem dat dit blootlegde is:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

De doelinvariant is breder dan Telegram: zodra de core beslist dat er een zichtbaar uitgaand bericht moet bestaan, moet de intentie duurzaam zijn voordat de platformverzending wordt geprobeerd, en moet het platformontvangstbewijs na succes worden gecommit. Dat geeft OpenClaw herstel met ten minste één keer leveren. Exact-één-keer-gedrag bestaat alleen voor adapters die native idempotentie kunnen bewijzen of een poging waarvan de status na verzending onbekend is kunnen reconciliëren met de platformstatus voordat opnieuw wordt afgespeeld.

Dat is de eindtoestand voor deze refactor, geen beschrijving van elk huidig pad. Tijdens de migratie kunnen bestaande uitgaande helpers nog steeds terugvallen op een directe verzending wanneer best-effort wachtrijwrites mislukken. De refactor is pas compleet wanneer duurzame definitieve verzendingen gesloten falen of expliciet afmelden met een gedocumenteerd niet-duurzaam beleid.

## Doelen

- Eén core-levenscyclus voor alle ontvang- en verzendpaden van kanaalberichten.
- Duurzame definitieve verzendingen standaard in de nieuwe berichtlevenscyclus nadat een adapter replay-veilig gedrag declareert.
- Gedeelde semantiek voor preview, bewerken, streamen, finalisatie, opnieuw proberen, herstel en ontvangstbewijzen.
- Een klein plugin-SDK-oppervlak dat externe plugins kunnen leren en onderhouden.
- Compatibiliteit voor bestaande `channel.turn`-aanroepers tijdens de migratie.
- Duidelijke uitbreidingspunten voor nieuwe kanaalmogelijkheden.
- Geen platformspecifieke branches in core.
- Geen token-delta-kanaalberichten. Kanaalstreaming blijft berichtpreview, bewerken, toevoegen of levering van voltooide blokken.
- Gestructureerde metadata van OpenClaw-oorsprong voor operationele/systeemuitvoer, zodat zichtbare gatewayfouten niet opnieuw gedeelde bot-ingeschakelde ruimtes binnenkomen als nieuwe prompts.

## Niet-doelen

- Verwijder `runtime.channel.turn.*` niet in de eerste fase.
- Dwing niet elk kanaal in hetzelfde native transportgedrag.
- Leer core geen Telegram-onderwerpen, Slack-native streams, Matrix-redacties, Feishu-kaarten, QQ-spraak of Teams-activiteiten.
- Publiceer niet alle interne migratiehelpers als stabiele SDK-API.
- Laat retries geen voltooide niet-idempotente platformbewerkingen opnieuw afspelen.

## Referentiemodel

Vercel Chat heeft een goed publiek mentaal model:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- adaptermethoden zoals `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` en geschiedenisfetches
- een statusadapter voor deduplicatie, locks, wachtrijen en persistentie

OpenClaw moet de woordenschat lenen, niet het oppervlak kopiëren.

Wat OpenClaw bovenop dat model nodig heeft:

- Duurzame intenties voor uitgaande verzending vóór directe transportaanroepen.
- Expliciete verzendcontexten met begin, commit en fail.
- Ontvangcontexten die het beleid voor platform-ack kennen.
- Ontvangstbewijzen die een herstart overleven en bewerkingen, verwijderingen, herstel en duplicate suppression kunnen aansturen.
- Een kleinere publieke SDK. Gebundelde plugins kunnen interne runtimehelpers gebruiken, maar externe plugins moeten één samenhangende bericht-API zien.
- Agentspecifiek gedrag: sessies, transcripts, block streaming, toolvoortgang, goedkeuringen, mediarichtlijnen, stille antwoorden en geschiedenis van groepsvermeldingen.

Beloften in `thread.post()`-stijl zijn niet genoeg voor OpenClaw. Ze verbergen de transactiegrens die bepaalt of een verzending herstelbaar is.

## Core-model

Het nieuwe domein moet onder een interne core-namespace leven, zoals `src/channels/message/*`.

Het heeft vier concepten:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` bezit de inkomende levenscyclus.

`send` bezit de uitgaande levenscyclus.

`live` bezit preview, bewerken, voortgang en streamstatus.

`state` bezit duurzame intentieopslag, ontvangstbewijzen, idempotentie, herstel, locks en deduplicatie.

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

Hiermee kan hetzelfde verzendpad normale antwoorden, cron-meldingen, goedkeuringsprompts, taakvoltooiingen, verzendingen via de message-tool, verzendingen via CLI of Control UI, subagentresultaten en automatiseringsverzendingen verwerken.

### Oorsprong

Oorsprong beschrijft wie een bericht heeft geproduceerd en hoe OpenClaw echo’s van dat bericht moet behandelen. Het staat los van relatie: een bericht kan een antwoord aan een gebruiker zijn en nog steeds operationele uitvoer zijn die van OpenClaw afkomstig is.

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

Core bezit de betekenis van uitvoer die van OpenClaw afkomstig is. Kanalen bezitten hoe die oorsprong in hun transport wordt gecodeerd.

Het eerste vereiste gebruik is Gateway-foutuitvoer. Mensen moeten nog steeds berichten zien zoals "Agent failed before reply" of "Missing API key", maar getagde operationele uitvoer van OpenClaw mag niet worden geaccepteerd als door een bot geschreven invoer in gedeelde ruimtes wanneer `allowBots` is ingeschakeld.

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

Ontvangstbewijzen vormen de brug van duurzame intentie naar toekomstige bewerkingen, verwijderingen, preview-finalisatie, duplicate suppression en herstel.

Een ontvangstbewijs kan één platformbericht of een levering in meerdere delen beschrijven. Gechunkte tekst, media plus tekst, spraak plus tekst en kaartfallbacks moeten alle platform-id’s bewaren en tegelijk nog steeds een primaire id tonen voor threading en latere bewerkingen.

## Ontvangcontext

Ontvangen moet geen kale helperaanroep zijn. De core heeft een context nodig die deduplicatie, routering, sessieregistratie en platform-ack-beleid kent.

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

- **Transport-ack:** vertelt de platformwebhook of socket dat OpenClaw de event-envelope heeft geaccepteerd. Sommige platforms vereisen dit vóór dispatch.
- **Polling-offset-ack:** schuift een cursor op zodat hetzelfde event niet opnieuw wordt opgehaald. Dit mag niet voorbij werk opschuiven dat niet kan worden hersteld.
- **Inkomende-record-ack:** bevestigt dat OpenClaw genoeg inkomende metadata heeft gepersisteerd om een herlevering te dedupliceren en routeren.
- **Zichtbaar ontvangstbewijs voor gebruiker:** optioneel lees-/status-/typgedrag; nooit een duurzaamheidsgrens.

`ReceiveAckPolicy` regelt alleen transport- of pollingbevestiging. Het mag niet worden hergebruikt voor leesbevestigingen of statusreacties.

Vóór botautorisatie moet ontvangen het gedeelde OpenClaw-echobeleid toepassen wanneer het kanaal metadata over berichtoorsprong kan decoderen:

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

Deze drop is taggebaseerd, niet tekstgebaseerd. Een door een bot geschreven ruimtebericht met dezelfde zichtbare gateway-fouttekst maar zonder oorsprongsmetadata van OpenClaw gaat nog steeds door de normale `allowBots`-autorisatie.

Ack-beleid is expliciet:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram-polling gebruikt nu het ack-beleid van de ontvangstcontext voor zijn gepersisteerde herstartwatermerk. De tracker observeert nog steeds grammY-updates wanneer ze de middlewareketen binnenkomen, maar OpenClaw persisteert alleen de veilige voltooide update-id na succesvolle dispatch, waardoor mislukte of lagere wachtende updates na een herstart opnieuw afspeelbaar blijven. De upstream `getUpdates`-fetch-offset van Telegram wordt nog steeds beheerd door de pollingbibliotheek, dus de resterende diepere ingreep is een volledig duurzame pollingbron als we platformniveau-herlevering buiten OpenClaw’s herstartwatermerk nodig hebben. Webhookplatforms kunnen onmiddellijke HTTP-ack nodig hebben, maar hebben nog steeds inkomende deduplicatie en duurzame uitgaande verzendintenties nodig omdat webhooks opnieuw kunnen leveren.

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

Voorkeursorchestratie:

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

De intentie moet bestaan vóór transport-I/O. Een herstart na begin maar vóór
commit is herstelbaar.

De gevaarlijke grens ligt na platformsucces en vóór receipt-commit. Als een
proces daar uitvalt, kan OpenClaw niet weten of het platformbericht bestaat,
tenzij de adapter native idempotentie of een pad voor receipt-reconciliatie biedt.
Die pogingen moeten worden hervat in `unknown_after_send`, niet blind opnieuw worden afgespeeld. Kanalen
zonder reconciliatie mogen at-least-once replay alleen kiezen als dubbele zichtbare
berichten een aanvaardbare, gedocumenteerde afweging zijn voor dat kanaal en die relatie.
De huidige SDK-reconciliatiebrug vereist dat de adapter
`reconcileUnknownSend` declareert, en vraagt daarna `durableFinal.reconcileUnknownSend` om
een onbekende entry te classificeren als `sent`, `not_sent` of `unresolved`; alleen `not_sent`
staat replay toe, en onopgeloste entries blijven terminaal of proberen alleen de
reconciliatiecontrole opnieuw.

Duurzaamheidsbeleid moet expliciet zijn:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` betekent dat core gesloten moet falen wanneer de duurzame intentie niet kan worden geschreven.
`best_effort` kan doorgaan wanneer persistentie niet beschikbaar is. `disabled` behoudt
het oude directe verzendgedrag. Tijdens migratie gebruiken legacy-wrappers en publieke
compatibiliteitshelpers standaard `disabled`; ze mogen `required` niet afleiden uit
het feit dat een kanaal een generieke uitgaande adapter heeft.

Verzendcontexten bezitten ook kanaallokale effecten na verzending. Een migratie is niet veilig
als duurzame levering lokaal gedrag omzeilt dat eerder was gekoppeld aan het
directe verzendpad van het kanaal. Voorbeelden zijn caches voor onderdrukking van zelf-echo's,
markeringen voor threaddeelname, native bewerkingsankers, rendering van modelhandtekeningen
en platformspecifieke dubbele guards. Die effecten moeten worden verplaatst naar de
verzendadapter, de renderadapter of een benoemde verzendcontexthaak voordat dat
kanaal duurzame generieke eindlevering kan inschakelen.

Verzendhelpers moeten receipts helemaal teruggeven aan hun aanroeper. Duurzame
wrappers mogen bericht-id's niet inslikken of een kanaalleveringsresultaat vervangen door
`undefined`; gebufferde dispatchers gebruiken die id's voor threadankers, latere bewerkingen,
preview-finalisatie en onderdrukking van duplicaten.

Fallback-verzendingen werken op batches, niet op afzonderlijke payloads. Stil-antwoord-herschrijvingen,
mediafallback, cardfallback en chunk-projectie kunnen allemaal meer dan
één leverbaar bericht produceren, dus een verzendcontext moet ofwel de volledige
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

Wanneer zo'n fallback duurzaam is, moet de volledige geprojecteerde batch worden vertegenwoordigd door
één duurzame verzendintentie of een ander atomair batchplan. Elke payload
één voor één vastleggen is niet genoeg: een crash tussen payloads kan een gedeeltelijk zichtbare
fallback achterlaten zonder duurzaam record voor de resterende payloads. Herstel moet weten
welke units al receipts hebben en ofwel alleen ontbrekende units opnieuw afspelen, of
de batch markeren als `unknown_after_send` totdat de adapter deze reconcilieert.

## Live-context

Preview-, bewerkings-, voortgangs- en streamgedrag moeten één opt-in levenscyclus zijn.

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

Live-status is duurzaam genoeg om te herstellen of duplicaten te onderdrukken:

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

Dit moet het huidige gedrag afdekken:

- Telegram-verzending plus bewerkingspreview, met nieuwe finale na verouderde previewleeftijd.
- Discord-verzending plus bewerkingspreview, annuleren bij media/fout/expliciet antwoord.
- Slack-native stream of conceptpreview, afhankelijk van de threadvorm.
- Mattermost-finalisatie van conceptpost.
- Matrix-finalisatie van conceptevent of redactie bij mismatch.
- Teams-native voortgangsstream.
- QQ Bot-stream of geaccumuleerde fallback.

## Adapteroppervlak

Het publieke SDK-doel moet één subpad zijn:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
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

Verzendadapter:

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

Ontvangstadapter:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Vóór preflight-autorisatie moet core de gedeelde OpenClaw-echo-predicate uitvoeren
wanneer `origin.decode` OpenClaw-oorsprongsmetadata retourneert. De ontvangstadapter
levert platformfeiten zoals botauteur en ruimtevorm; core bezit de drop-
beslissing en volgorde, zodat kanalen geen tekstfilters opnieuw implementeren.

Origin-adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core stelt `MessageOrigin` in. Kanalen vertalen dit alleen naar en van native
transportmetadata. Slack mapt dit naar `chat.postMessage({ metadata })` en
inkomende `message.metadata`; Matrix kan dit mappen naar extra eventcontent; kanalen
zonder native metadata kunnen een receipt-/uitgaand register gebruiken wanneer dat de
beste beschikbare benadering is.

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

## Reductie van de publieke SDK

Het nieuwe publieke oppervlak moet deze conceptuele gebieden absorberen of afschaffen:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- de meeste publieke gebruiken van `outbound-runtime`
- ad-hochulpmiddelen voor de levenscyclus van conceptstreams

Compatibiliteitssubpaden kunnen als wrappers blijven bestaan, maar nieuwe plugins van derden
zouden ze niet nodig moeten hebben.

Gebundelde plugins mogen interne helperimports via gereserveerde runtime-
subpaden behouden tijdens de migratie. Publieke documentatie moet pluginauteurs naar
`plugin-sdk/channel-message` sturen zodra dit bestaat.

## Relatie tot channel turn

`runtime.channel.turn.*` moet tijdens de migratie blijven bestaan.

Het moet een compatibiliteitsadapter worden:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` moet in eerste instantie ook blijven bestaan:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Nadat alle gebundelde plugins en bekende compatibiliteitspaden van derden zijn overbrugd,
kan `channel.turn` worden afgeschaft. Het mag pas worden verwijderd wanneer er een
gepubliceerd SDK-migratiepad is en contracttests bewijzen dat oude plugins nog werken
of falen met een duidelijke versiefout.

## Compatibiliteitsrails

Tijdens de migratie is generieke duurzame levering opt-in voor elk kanaal waarvan
de bestaande leveringscallback neveneffecten heeft naast "deze payload verzenden".

Legacy-entrypoints zijn standaard niet-duurzaam:

- `channel.turn.run` en `dispatchAssembledChannelTurn` gebruiken de
  leveringscallback van het kanaal, tenzij dat kanaal expliciet een geaudit duurzaam
  beleid-/optiesobject levert.
- `channel.turn.runPrepared` blijft kanaaleigendom totdat de voorbereide dispatcher
  expliciet de verzendcontext aanroept.
- Publieke compatibiliteitshelpers zoals `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` en direct-DM-helpers injecteren nooit generieke
  duurzame levering vóór de door de aanroeper geleverde `deliver`- of `reply`-callback.

Voor migratiebrugtypen betekent `durable: undefined` "niet duurzaam". Het
duurzame pad wordt alleen ingeschakeld door een expliciete beleid-/optiewaarde. `durable:
false` kan als compatibiliteitsspelling blijven bestaan, maar de implementatie moet niet
vereisen dat elk ongemigreerd kanaal dit toevoegt.

Huidige brugcode moet de duurzaamheidsbeslissing expliciet houden:

- Duurzame uiteindelijke levering retourneert een gediscrimineerde status. `handled_visible` en
  `handled_no_send` zijn terminaal; `unsupported` en `not_applicable` kunnen
  terugvallen op kanaaleigen levering; `failed` propageert de verzendfout.
- Generieke duurzame uiteindelijke levering wordt afgeschermd door adaptermogelijkheden zoals
  stille levering, behoud van antwoorddoel, behoud van native citaten en
  hooks voor berichtverzending. Ontbrekende gelijkwaardigheid moet kanaaleigen levering kiezen,
  niet een generieke verzending die zichtbaar gebruikersgedrag wijzigt.
- Wachtrijgebaseerde duurzame verzendingen stellen een leveringsintentie-referentie beschikbaar. Bestaande
  `pendingFinalDelivery*`-sessievelden kunnen tijdens de overgang de intentie-id
  bevatten; de eindtoestand is een `MessageSendIntent`-opslag in plaats van bevroren
  antwoordtekst plus ad-hoc contextvelden.

Schakel het generieke duurzame pad voor een kanaal pas in wanneer al het volgende
waar is:

- De generieke verzendadapter voert hetzelfde rendering- en transportgedrag uit als
  het oude directe pad.
- Lokale neveneffecten na verzending blijven behouden via de verzendcontext.
- De adapter retourneert ontvangstbewijzen of leveringsresultaten met alle platformbericht-
  id's.
- Voorbereide dispatcher-paden roepen ofwel de nieuwe verzendcontext aan, of blijven gedocumenteerd
  als buiten de duurzame garantie.
- Terugvallevering verwerkt elke geprojecteerde payload, niet alleen de eerste.
- Duurzame terugvallevering registreert de volledige geprojecteerde payload-array als één
  herhaalbare intentie of batchplan.

Concrete migratiegevaren die behouden moeten blijven:

- iMessage-monitorlevering registreert verzonden berichten in een echo-cache na een
  succesvolle verzending. Duurzame uiteindelijke verzendingen moeten die cache nog steeds vullen, anders
  kan OpenClaw zijn eigen uiteindelijke antwoorden opnieuw opnemen als inkomende gebruikersberichten.
- Tlon voegt een optionele modelhandtekening toe en registreert deelgenomen threads
  na groepsantwoorden. Generieke duurzame levering mag die effecten niet omzeilen;
  verplaats ze ofwel naar Tlon-render-/verzend-/finalisatieadapters, of houd Tlon op het
  kanaaleigen pad.
- Discord en andere voorbereide dispatchers bezitten al directe levering en voorbeeld-
  gedrag. Ze vallen niet onder een duurzame garantie voor samengestelde beurten totdat
  hun voorbereide dispatchers uiteindelijke antwoorden expliciet via de verzendcontext routeren.
- Stille terugvallevering van Telegram moet de volledige geprojecteerde payload-
  array leveren. Een snelpad voor één payload kan extra terugvalpayloads na
  projectie laten vallen.
- LINE, BlueBubbles, Zalo, Nostr en andere bestaande samengestelde/helperpaden kunnen
  afhandeling van antwoordtokens, mediaproxying, caches voor verzonden berichten, opschoning van laad-/status-
  gegevens of doelen met alleen callbacks hebben. Ze blijven op kanaaleigen levering totdat
  die semantiek door de verzendadapter wordt vertegenwoordigd en door tests is geverifieerd.
- Direct-DM-helpers kunnen een antwoordcallback hebben die het enige correcte transport-
  doel is. Generieke uitgaande verzending mag niet gokken op basis van `OriginatingTo` of `To` en
  die callback overslaan.
- Foutuitvoer van de OpenClaw Gateway moet zichtbaar blijven voor mensen, maar getagde
  door bots geschreven kamerecho's moeten worden verwijderd vóór `allowBots`-autorisatie.
  Kanalen mogen dit niet implementeren met prefixfilters op zichtbare tekst, behalve als
  korte noodoplossing; het duurzame contract is gestructureerde oorsprongsmetadata.

## Interne opslag

De duurzame wachtrij moet verzendintenties voor berichten opslaan, geen antwoordpayloads.

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

De wachtrij moet genoeg identiteit bewaren om na herstart opnieuw af te spelen via hetzelfde account,
dezelfde thread, hetzelfde doel, hetzelfde opmaakbeleid en dezelfde mediaregels.

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
- Probeer `invalid_payload` niet opnieuw, tenzij er een renderingterugval bestaat.
- Probeer `auth` of `permission` niet opnieuw totdat de configuratie wijzigt.
- Laat live finalisatie voor `not_found` terugvallen van bewerken naar een nieuwe verzending wanneer
  het kanaal verklaart dat dit veilig is.
- Gebruik voor `conflict` ontvangstbewijs-/idempotentieregels om te bepalen of het bericht
  al bestaat.
- Elke fout nadat de adapter platform-I/O mogelijk heeft voltooid maar voordat het ontvangstbewijs is
  vastgelegd, wordt `unknown_after_send`, tenzij de adapter kan bewijzen dat de platform-
  bewerking niet heeft plaatsgevonden.

## Kanaaltoewijzing

| Kanaal                   | Doelmigratie                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Ontvangstbeleid voor bevestigingen plus duurzame finale verzendingen. Live-adapter beheert verzenden plus bewerken van previews, finale verzending van verouderde previews, onderwerpen, overslaan van previews voor geciteerde antwoorden, mediafallback en retry-after-afhandeling.                                                                                  |
| Discord                  | Verzendadapter verpakt bestaande duurzame payloadbezorging. Live-adapter beheert conceptbewerking, voortgangsconcept, annulering van media-/foutpreview, behoud van antwoorddoel en ontvangstbewijzen voor bericht-id's. Audit echo's van door bots gemaakte Gateway-fouten in gedeelde kamers; gebruik een uitgaand register of een ander native equivalent als Discord geen oorsprongsmetadata op normale berichten kan dragen. |
| Slack                    | Verzendadapter verwerkt normale chatberichten. Live-adapter kiest een native stream wanneer de threadvorm dat ondersteunt, anders een conceptpreview. Ontvangstbewijzen behouden thread-timestamps. Oorsprongadapter koppelt OpenClaw Gateway-fouten aan Slack `chat.postMessage.metadata` en verwijdert getagde echo's in botkamers voor `allowBots`-autorisatie.        |
| WhatsApp                 | Verzendadapter beheert tekst-/mediaverzending met duurzame finale intenties. Ontvangstadapter verwerkt groepsvermelding en afzenderidentiteit. Live kan afwezig blijven totdat WhatsApp een bewerkbaar transport heeft.                                                                                                                                              |
| Matrix                   | Live-adapter beheert bewerkingen van conceptevents, finalisatie, redactie, beperkingen voor versleutelde media en fallback bij mismatch van antwoorddoel. Ontvangstadapter beheert hydratie en deduplicatie van versleutelde events. Oorsprongadapter moet de oorsprong van OpenClaw Gateway-fouten coderen in Matrix-eventinhoud en echo's van geconfigureerde botkamers verwijderen vóór `allowBots`-afhandeling. |
| Mattermost               | Live-adapter beheert één conceptbericht, inklappen van voortgang/tools, finalisatie ter plekke en fallback voor nieuwe verzending.                                                                                                                                                                                                                                     |
| Microsoft Teams          | Live-adapter beheert native voortgang en blokstreamgedrag. Verzendadapter beheert activiteiten en ontvangstbewijzen voor bijlagen/kaarten.                                                                                                                                                                                                                            |
| Feishu                   | Renderadapter beheert rendering van tekst/kaarten/raw. Live-adapter beheert streamingkaarten en onderdrukking van dubbele finales. Verzendadapter beheert opmerkingen, onderwerpsessies, media en spraakonderdrukking.                                                                                                                                               |
| QQ Bot                   | Live-adapter beheert C2C-streaming, accumulatortime-out en fallback voor finale verzending. Renderadapter beheert mediatags en tekst-als-spraak.                                                                                                                                                                                                                       |
| Signal                   | Eenvoudige ontvangst plus verzendadapter. Geen live-adapter tenzij signal-cli betrouwbare bewerkingsondersteuning toevoegt.                                                                                                                                                                                                                                           |
| iMessage and BlueBubbles | Eenvoudige ontvangst plus verzendadapter. iMessage-verzending moet de populatie van de echo-cache van de monitor behouden voordat duurzame finales monitorbezorging kunnen omzeilen. BlueBubbles-specifiek typen, reacties en bijlagen blijven adaptercapaciteiten.                                                                                                    |
| Google Chat              | Eenvoudige ontvangst plus verzendadapter met threadrelatie gekoppeld aan ruimten en thread-id's. Audit kamergedrag met `allowBots=true` voor getagde echo's van OpenClaw Gateway-fouten.                                                                                                                                                                             |
| LINE                     | Eenvoudige ontvangst plus verzendadapter met beperkingen voor antwoordtokens gemodelleerd als doel-/relatiecapaciteit.                                                                                                                                                                                                                                                |
| Nextcloud Talk           | SDK-ontvangstbrug plus verzendadapter.                                                                                                                                                                                                                                                                                                                               |
| IRC                      | Eenvoudige ontvangst plus verzendadapter, geen duurzame ontvangstbewijzen voor bewerkingen.                                                                                                                                                                                                                                                                            |
| Nostr                    | Ontvangst plus verzendadapter voor versleutelde DM's; ontvangstbewijzen zijn event-id's.                                                                                                                                                                                                                                                                              |
| QA Channel               | Contracttestadapter voor ontvangst-, verzend-, live-, retry- en herstelgedrag.                                                                                                                                                                                                                                                                                        |
| Synology Chat            | Eenvoudige ontvangst plus verzendadapter.                                                                                                                                                                                                                                                                                                                            |
| Tlon                     | Verzendadapter moet modelhandtekening-rendering en tracking van threads waaraan is deelgenomen behouden voordat generieke duurzame finale bezorging wordt ingeschakeld.                                                                                                                                                                                               |
| Twitch                   | Eenvoudige ontvangst plus verzendadapter met classificatie van rate limits.                                                                                                                                                                                                                                                                                           |
| Zalo                     | Eenvoudige ontvangst plus verzendadapter.                                                                                                                                                                                                                                                                                                                            |
| Zalo Personal            | Eenvoudige ontvangst plus verzendadapter.                                                                                                                                                                                                                                                                                                                            |

## Migratieplan

### Fase 1: Intern berichtdomein

- Voeg `src/channels/message/*`-typen toe voor berichten, doelen, relaties,
  oorsprongen, ontvangstbewijzen, capaciteiten, duurzame intenties, ontvangstcontext, verzendcontext,
  live-context en foutklassen.
- Voeg `origin?: MessageOrigin` toe aan het migratiebrug-payloadtype dat wordt gebruikt door
  de huidige antwoordbezorging, en verplaats dat veld daarna naar `ChannelMessage` en gerenderde
  berichttypen terwijl de refactor antwoordpayloads vervangt.
- Houd dit intern totdat adapters en tests de vorm bewijzen.
- Voeg pure unittests toe voor statusovergangen en serialisatie.

### Fase 2: Kern voor duurzaam verzenden

- Verplaats de bestaande uitgaande wachtrij van duurzaamheid voor antwoordpayloads naar duurzame
  intenties voor berichtverzending.
- Laat een duurzame verzendintentie een geprojecteerde payloadarray of batchplan dragen, niet
  slechts één antwoordpayload.
- Behoud het huidige wachtrijherstelgedrag via compatibiliteitsconversie.
- Laat `deliverOutboundPayloads` `messages.send` aanroepen.
- Maak duurzaamheid van finale verzending de standaard en faal gesloten wanneer de duurzame intentie
  niet kan worden geschreven in de nieuwe berichtlevenscyclus, nadat de adapter
  replay-veiligheid verklaart. Bestaande channel-turn- en SDK-compatibiliteitspaden blijven
  tijdens deze fase standaard directe verzending.
- Registreer ontvangstbewijzen consistent.
- Geef ontvangstbewijzen en bezorgresultaten terug aan de oorspronkelijke dispatcher-aanroeper in plaats
  van duurzaam verzenden als een terminaal neveneffect te behandelen.
- Persisteer berichtoorsprong via duurzame verzendintenties zodat herstel, replay en
  verzending in chunks de operationele herkomst van OpenClaw behouden.

### Fase 3: Brug voor kanaalturns

- Herimplementeer `channel.turn.run` en `dispatchAssembledChannelTurn` boven op
  `messages.receive` en `messages.send`.
- Houd huidige feittypen stabiel.
- Behoud standaard legacygedrag. Een kanaal met samengestelde turns wordt alleen duurzaam
  wanneer de adapter daar expliciet voor kiest met een replay-veilig duurzaamheidsbeleid.
- Houd `durable: false` als compatibiliteitsuitweg voor paden die native bewerkingen finaliseren
  en nog niet veilig kunnen replayen, maar vertrouw niet op `false`-markeringen
  om ongemigreerde kanalen te beschermen.
- Schakel standaardduurzaamheid voor samengestelde turns alleen in de nieuwe berichtlevenscyclus in, nadat
  de kanaalkoppeling bewijst dat het generieke verzendpad de oude kanaalbezorgingssemantiek behoudt.

### Fase 4: Brug voor voorbereide dispatcher

- Vervang `deliverDurableInboundReplyPayload` door een send-context bridge.
- Behoud de oude helper als wrapper.
- Porteer eerst Telegram, WhatsApp, Slack, Signal, iMessage en Discord, omdat
  ze al durable-final werk of eenvoudigere send-paden hebben.
- Behandel elke voorbereide dispatcher als ongedekt totdat deze expliciet kiest
  voor de send-context. Documentatie en changelog-vermeldingen moeten
  "samengestelde kanaalbeurten" zeggen of de gemigreerde kanaalpaden noemen, in
  plaats van alle automatische final replies te claimen.
- Houd het gedrag van `recordInboundSessionAndDispatchReply`, direct-DM helpers
  en vergelijkbare openbare compatibiliteitshelpers behoudend. Ze mogen later
  een expliciete send-context opt-in aanbieden, maar mogen niet automatisch
  proberen generieke durable delivery uit te voeren vóór de delivery callback
  die eigendom is van de aanroeper.

### Fase 5: Unified Live Lifecycle

- Bouw `messages.live` met twee bewijsadapters:
  - Telegram voor send plus edit plus stale final send.
  - Matrix voor draft-finalisatie plus redaction fallback.
- Migreer daarna Discord, Slack, Mattermost, Teams, QQ Bot en Feishu.
- Verwijder gedupliceerde preview-finalisatiecode pas nadat elk kanaal
  pariteitstests heeft.

### Fase 6: Openbare SDK

- Voeg `openclaw/plugin-sdk/channel-message` toe.
- Documenteer dit als de voorkeurs-API voor kanaalplugins.
- Werk package-exports, entrypoint-inventaris, gegenereerde API-baselines en
  Plugin SDK-documentatie bij.
- Neem `MessageOrigin`, origin encode/decode hooks en de gedeelde
  `shouldDropOpenClawEcho` predicate op in het channel-message SDK-oppervlak.
- Behoud compatibiliteitswrappers voor oude subpaden.
- Markeer reply-genoemde SDK-helpers als verouderd in de documentatie nadat
  gebundelde plugins zijn gemigreerd.

### Fase 7: Alle Senders

Verplaats alle niet-reply outbound producers naar `messages.send`:

- cron- en heartbeatmeldingen
- taakvoltooiingen
- hook-resultaten
- goedkeuringsprompts en goedkeuringsresultaten
- sends van de message tool
- aankondigingen van subagent-voltooiing
- expliciete CLI- of Control UI-sends
- automation/broadcast-paden

Dit is waar het model stopt met "agent replies" en "OpenClaw sends
messages" wordt.

### Fase 8: Turn verouderd maken

- Behoud `channel.turn` ten minste één compatibiliteitsvenster als wrapper.
- Publiceer migratienotities.
- Voer Plugin SDK-compatibiliteitstests uit tegen oude imports.
- Verwijder of verberg oude interne helpers pas nadat geen gebundelde plugin ze
  meer nodig heeft en externe contracten een stabiele vervanging hebben.

## Testplan

Unittests:

- Durable send intent-serialisatie en herstel.
- Hergebruik van idempotency keys en duplicate suppression.
- Receipt-commit en replay-skip.
- `unknown_after_send`-herstel dat vóór replay reconcilieert wanneer een adapter
  reconciliatie ondersteunt.
- Beleid voor failure classification.
- Sequentiebepaling voor receive ack-beleid.
- Relation mapping voor reply-, followup-, system- en broadcast-sends.
- Gateway-failure origin factory en `shouldDropOpenClawEcho` predicate.
- Behoud van origin via payload-normalisatie, chunking, durable queue-
  serialisatie en herstel.

Integratietests:

- `channel.turn.run` simple adapter registreert en verzendt nog steeds.
- Legacy assembled-turn delivery wordt niet durable tenzij het kanaal expliciet
  opt-in doet.
- `channel.turn.runPrepared` bridge registreert en finaliseert nog steeds.
- Openbare compatibiliteitshelpers roepen standaard caller-owned delivery
  callbacks aan en doen geen generic-send vóór die callbacks.
- Durable fallback delivery speelt de volledige geprojecteerde payload-array
  opnieuw af na herstart en kan de latere payloads niet ongeregistreerd laten na
  een vroege crash.
- Durable assembled-turn delivery retourneert platform message ids aan de
  gebufferde dispatcher.
- Custom delivery hooks retourneren nog steeds platform message ids wanneer
  durable delivery uitgeschakeld of niet beschikbaar is.
- Final reply overleeft een herstart tussen assistant-voltooiing en platform
  send.
- Preview draft finaliseert in-place wanneer toegestaan.
- Preview draft wordt geannuleerd of geredigeerd wanneer media/error/reply-target
  mismatch normale delivery vereist.
- Block streaming en preview streaming leveren niet beide dezelfde tekst.
- Vroeg gestreamde media wordt niet gedupliceerd in final delivery.

Kanaaltests:

- Telegram topic reply met polling ack vertraagd tot het veilige voltooide
  watermark van de receive context.
- Telegram polling recovery voor geaccepteerde maar niet-geleverde updates,
  gedekt door het persisted safe-completed offset model.
- Telegram stale preview verzendt een verse final en ruimt preview op.
- Telegram silent fallback verzendt elke geprojecteerde fallback-payload.
- Telegram silent fallback durability registreert de volledige geprojecteerde
  fallback-array atomisch, niet één single-payload durable intent per
  lusiteratie.
- Discord preview cancel bij media/error/expliciete reply.
- Discord prepared dispatcher finals lopen via de send context voordat docs of
  changelog Discord final-reply durability claimen.
- iMessage durable final sends vullen de monitor sent-message echo cache.
- LINE, BlueBubbles, Zalo en Nostr legacy delivery-paden worden niet omzeild
  door generic durable send totdat hun adapterpariteitstests bestaan.
- Direct-DM/Nostr callback delivery blijft gezaghebbend tenzij expliciet
  gemigreerd naar een volledig message target en replay-safe send adapter.
- Slack getagde OpenClaw Gateway failure messages blijven zichtbaar outbound,
  getagde bot-room echoes vallen weg vóór `allowBots`, en ongetagde
  botberichten met dezelfde zichtbare tekst volgen nog steeds normale
  botautorisatie.
- Slack native stream fallback naar draft preview in top-level DMs.
- Matrix preview-finalisatie en redaction fallback.
- Matrix getagde OpenClaw Gateway-failure room echoes van geconfigureerde
  botaccounts vallen weg vóór `allowBots`-afhandeling.
- Discord en Google Chat shared-room gateway-failure cascade audits dekken
  `allowBots`-modi voordat daar generieke bescherming wordt geclaimd.
- Mattermost draft-finalisatie en fresh-send fallback.
- Teams native progress-finalisatie.
- Feishu duplicate final suppression.
- QQ Bot accumulator timeout fallback.
- Tlon durable final sends behouden model-signature rendering en participated
  thread tracking.
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo en Zalo Personal simple durable final
  sends.

Validatie:

- Gerichte Vitest-bestanden tijdens ontwikkeling.
- `pnpm check:changed` in Testbox voor het volledige gewijzigde oppervlak.
- Bredere `pnpm check` in Testbox vóór het landen van de volledige refactor of
  na openbare SDK/export-wijzigingen.
- Live of qa-channel smoke voor ten minste één edit-capable kanaal en één
  eenvoudig send-only kanaal voordat compatibiliteitswrappers worden verwijderd.

## Open vragen

- Of Telegram uiteindelijk de grammY runner source moet vervangen door een
  volledig durable polling source die platform-level redelivery kan aansturen,
  niet alleen OpenClaw's persisted restart watermark.
- Of durable live preview state in hetzelfde queue record als de final send
  intent moet worden opgeslagen of in een sibling live-state store.
- Hoe lang compatibiliteitswrappers gedocumenteerd blijven nadat
  `plugin-sdk/channel-message` is verzonden.
- Of externe plugins receive adapters rechtstreeks moeten implementeren of
  alleen normalize/send/live hooks moeten bieden via
  `defineChannelMessageAdapter`.
- Welke receipt-velden veilig zijn om in de openbare SDK bloot te stellen versus
  interne runtime state.
- Of bijwerkingen zoals self-echo caches en participated-thread markers moeten
  worden gemodelleerd als send-context hooks, adapter-owned finalize steps of
  receipt subscribers.
- Welke kanalen native origin metadata hebben, welke persisted outbound
  registries nodig hebben en welke geen betrouwbare cross-bot echo suppression
  kunnen bieden.

## Acceptatiecriteria

- Elk gebundeld message channel verzendt final visible output via
  `messages.send`.
- Elk inbound message channel komt binnen via `messages.receive` of een
  gedocumenteerde compatibiliteitswrapper.
- Elk preview/edit/stream channel gebruikt `messages.live` voor draft state en
  finalization.
- `channel.turn` is alleen een wrapper.
- Reply-genoemde SDK-helpers zijn compatibiliteitsexports, niet het aanbevolen
  pad.
- Durable recovery kan pending final sends na herstart opnieuw afspelen zonder
  de final response te verliezen of reeds gecommitte sends te dupliceren; sends
  waarvan de platformuitkomst onbekend is, worden vóór replay gereconcilieerd of
  gedocumenteerd als at-least-once voor die adapter.
- Durable final sends fail closed wanneer de durable intent niet kan worden
  geschreven, tenzij een aanroeper expliciet een gedocumenteerde non-durable
  mode heeft geselecteerd.
- Legacy channel-turn en SDK-compatibiliteitshelpers gebruiken standaard directe
  channel-owned delivery; generic durable send is alleen expliciete opt-in.
- Receipts behouden alle platform message ids voor meerdelige deliveries en een
  primaire id voor threading/edit convenience.
- Durable wrappers behouden channel-local side effects voordat direct delivery
  callbacks worden vervangen.
- Prepared dispatchers tellen niet als durable totdat hun final delivery path
  expliciet de send context gebruikt.
- Fallback delivery verwerkt elke geprojecteerde payload.
- Durable fallback delivery registreert elke geprojecteerde payload in één
  replayable intent of batch plan.
- OpenClaw-originated Gateway failure output is zichtbaar voor mensen, maar
  getagde bot-authored room echoes worden vóór botautorisatie verwijderd op
  kanalen die ondersteuning voor het origin contract declareren.
- De documentatie legt send, receive, live, state, receipts, relations, failure
  policy, migration en test coverage uit.

## Gerelateerd

- [Messages](/nl/concepts/messages)
- [Streaming en chunking](/nl/concepts/streaming)
- [Progress drafts](/nl/concepts/progress-drafts)
- [Retry policy](/nl/concepts/retry)
- [Channel turn kernel](/nl/plugins/sdk-channel-turn)
