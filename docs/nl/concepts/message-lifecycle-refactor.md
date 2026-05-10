---
read_when:
    - Het verzend- of ontvangstgedrag van kanalen refactoren
    - Kanaalbeurt, antwoordverzending, uitgaande wachtrij, voorbeeldstreaming of Plugin SDK-bericht-API's wijzigen
    - Een nieuwe kanaalplugin ontwerpen die persistente verzendingen, ontvangstbevestigingen, voorvertoningen, bewerkingen of nieuwe pogingen nodig heeft
summary: Ontwerpplan voor de uniforme, persistente levenscyclus voor het ontvangen, verzenden, vooraf bekijken, bewerken en streamen van berichten
title: Refactor van de berichtlevenscyclus
x-i18n:
    generated_at: "2026-05-10T19:32:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Deze pagina is het doelontwerp voor het vervangen van verspreide helpers voor kanaalbeurten, antwoorddispatch,
previewstreaming en uitgaande levering door één duurzame
berichtlevenscyclus.

De korte versie:

- De kernprimitieven moeten **ontvangen** en **verzenden** zijn, niet **antwoorden**.
- Een antwoord is alleen een relatie op een uitgaand bericht.
- Een beurt is een gemak voor inkomende verwerking, niet de eigenaar van levering.
- Verzenden moet contextgebaseerd zijn: `begin`, renderen, previewen of streamen, definitief verzenden,
  vastleggen, mislukken.
- Ontvangen moet ook contextgebaseerd zijn: normaliseren, dedupliceren, routeren, registreren,
  dispatchen, platformbevestiging, mislukken.
- De publieke Plugin-SDK moet samenvallen tot één klein kanaalberichtoppervlak.

## Problemen

De huidige kanaalstack is gegroeid vanuit meerdere geldige lokale behoeften:

- Eenvoudige inkomende adapters gebruiken `runtime.channel.turn.run`.
- Rijke adapters gebruiken `runtime.channel.turn.runPrepared`.
- Legacy-helpers gebruiken `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, helpers voor antwoordpayloads, antwoordchunking,
  antwoordreferenties en helpers voor uitgaande runtime.
- Previewstreaming leeft in kanaalspecifieke dispatchers.
- Duurzaamheid van definitieve levering wordt toegevoegd rond bestaande antwoordpayloadpaden.

Die vorm lost lokale bugs op, maar laat OpenClaw achter met te veel publieke
concepten en te veel plekken waar leveringssemantiek kan afwijken.

Het betrouwbaarheidsprobleem dat dit blootlegde is:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

De doelinvariant is breder dan Telegram: zodra core beslist dat een zichtbaar
uitgaand bericht moet bestaan, moet de intentie duurzaam zijn voordat de platformverzending
wordt geprobeerd, en moet het platformbewijs na succes worden vastgelegd.
Dat geeft OpenClaw herstel met minstens-één-keer-semantiek. Exact-één-keer-gedrag bestaat alleen
voor adapters die native idempotentie kunnen bewijzen of een
onbekend-na-verzending-poging kunnen reconciliëren met de platformstatus vóór replay.

Dat is de eindtoestand voor deze refactor, niet een beschrijving van elk huidig
pad. Tijdens migratie kunnen bestaande uitgaande helpers nog steeds terugvallen op een
directe verzending wanneer best-effort wachtrijschrijfacties mislukken. De refactor is pas voltooid
wanneer duurzame definitieve verzendingen gesloten falen of expliciet afzien met een gedocumenteerd
niet-duurzaam beleid.

## Doelen

- Eén core-levenscyclus voor alle ontvang- en verzendpaden van kanaalberichten.
- Duurzame definitieve verzendingen standaard in de nieuwe berichtlevenscyclus nadat een adapter
  replay-veilig gedrag declareert.
- Gedeelde semantiek voor preview, bewerken, streamen, finalisatie, opnieuw proberen, herstel en ontvangstbewijzen.
- Een klein Plugin-SDK-oppervlak dat externe plugins kunnen leren en onderhouden.
- Compatibiliteit voor bestaande `channel.turn`-aanroepers tijdens migratie.
- Duidelijke uitbreidingspunten voor nieuwe kanaalmogelijkheden.
- Geen platformspecifieke branches in core.
- Geen token-delta-kanaalberichten. Kanaalstreaming blijft berichtpreview,
  bewerken, toevoegen of levering van voltooide blokken.
- Gestructureerde metadata van OpenClaw-oorsprong voor operationele/systeemuitvoer, zodat zichtbare
  gatewayfouten niet opnieuw binnenkomen in gedeelde bot-ingeschakelde ruimtes als nieuwe prompts.

## Niet-doelen

- Verwijder `runtime.channel.turn.*` niet in de eerste fase.
- Dwing niet elk kanaal tot hetzelfde native transportgedrag.
- Leer core geen Telegram-topics, native Slack-streams, Matrix-redacties,
  Feishu-kaarten, QQ-spraak of Teams-activiteiten.
- Publiceer niet alle interne migratiehelpers als stabiele SDK-API.
- Laat retries voltooide niet-idempotente platformoperaties niet opnieuw afspelen.

## Referentiemodel

Vercel Chat heeft een goed publiek mentaal model:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- adaptermethoden zoals `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` en history-fetches
- een statusadapter voor deduplicatie, locks, wachtrijen en persistentie

OpenClaw moet de woordenschat lenen, niet het oppervlak kopiëren.

Wat OpenClaw bovenop dat model nodig heeft:

- Duurzame uitgaande verzendintenties vóór directe transportaanroepen.
- Expliciete verzendcontexten met begin, commit en fail.
- Ontvangstcontexten die het platformbevestigingsbeleid kennen.
- Ontvangstbewijzen die een herstart overleven en bewerkingen, verwijderingen, herstel en
  onderdrukking van duplicaten kunnen aansturen.
- Een kleinere publieke SDK. Gebundelde plugins kunnen interne runtimehelpers gebruiken, maar
  externe plugins moeten één coherente bericht-API zien.
- Agent-specifiek gedrag: sessies, transcripten, blokstreaming, toolvoortgang,
  goedkeuringen, mediarichtlijnen, stille antwoorden en geschiedenis van groepsvermeldingen.

Beloften in `thread.post()`-stijl zijn niet genoeg voor OpenClaw. Ze verbergen de
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

`receive` bezit de inkomende levenscyclus.

`send` bezit de uitgaande levenscyclus.

`live` bezit preview, bewerken, voortgang en streamstatus.

`state` bezit duurzame intentieopslag, ontvangstbewijzen, idempotentie, herstel, locks en
deduplicatie.

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

Hierdoor kan hetzelfde verzendpad normale antwoorden, cronmeldingen, goedkeuringsprompts,
taakvoltooiingen, verzendingen via berichttools, CLI- of Control UI-verzendingen, subagentresultaten
en automatiseringsverzendingen afhandelen.

### Oorsprong

Oorsprong beschrijft wie een bericht heeft geproduceerd en hoe OpenClaw echo's van
dat bericht moet behandelen. Het staat los van relatie: een bericht kan een antwoord op een gebruiker zijn
en toch operationele uitvoer van OpenClaw-oorsprong zijn.

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

Core bezit de betekenis van uitvoer met OpenClaw-oorsprong. Kanalen bezitten hoe die
oorsprong in hun transport wordt gecodeerd.

Het eerste vereiste gebruik is gatewayfoutuitvoer. Mensen moeten nog steeds
berichten zien zoals "Agent failed before reply" of "Missing API key", maar getagde
operationele OpenClaw-uitvoer mag niet worden geaccepteerd als door bots geschreven invoer in gedeelde
ruimtes wanneer `allowBots` is ingeschakeld.

### Ontvangstbewijs

Ontvangstbewijzen zijn eersteklas:

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

Ontvangstbewijzen zijn de brug van duurzame intentie naar toekomstige bewerking, verwijdering, previewfinalisatie,
onderdrukking van duplicaten en herstel.

Een ontvangstbewijs kan één platformbericht of een levering in meerdere delen beschrijven. Gechunkte
tekst, media plus tekst, spraak plus tekst en kaartfallbacks moeten alle
platform-id's behouden en toch een primaire id voor threading en latere bewerkingen tonen.

## Ontvangstcontext

Ontvangen mag geen kale helperaanroep zijn. Core heeft een context nodig die
deduplicatie, routering, sessieregistratie en platformbevestigingsbeleid kent.

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

Bevestiging is niet één ding. Het ontvangstcontract moet deze signalen gescheiden houden:

- **Transportbevestiging:** vertelt de platformwebhook of socket dat OpenClaw de gebeurtenisenvelop heeft geaccepteerd.
  Sommige platforms vereisen dit vóór dispatch.
- **Polling-offsetbevestiging:** schuift een cursor op zodat dezelfde gebeurtenis niet opnieuw wordt opgehaald.
  Dit mag niet verder gaan dan werk dat niet kan worden hersteld.
- **Inkomend-recordbevestiging:** bevestigt dat OpenClaw genoeg inkomende metadata heeft gepersisteerd om
  een herlevering te dedupliceren en routeren.
- **Zichtbaar ontvangstbewijs voor gebruiker:** optioneel lees-/status-/typgedrag; nooit een
  duurzaamheidsgrens.

`ReceiveAckPolicy` beheert alleen transport- of pollingbevestiging. Het mag
niet worden hergebruikt voor leesbewijzen of statusreacties.

Vóór botautorisatie moet ontvangen het gedeelde OpenClaw-echobeleid toepassen
wanneer het kanaal metadata over berichtherkomst kan decoderen:

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

Deze drop is taggebaseerd, niet tekstgebaseerd. Een door een bot geschreven roombericht met dezelfde
zichtbare gatewayfouttekst maar zonder metadata over OpenClaw-oorsprong gaat nog steeds
door normale `allowBots`-autorisatie.

Bevestigingsbeleid is expliciet:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram-polling gebruikt nu het bevestigingsbeleid van de ontvangstcontext voor zijn gepersisteerde
herstartwatermerk. De tracker observeert grammY-updates nog steeds wanneer ze de
middlewareketen binnenkomen, maar OpenClaw persisteert alleen de veilige voltooide update-id na
succesvolle dispatch, waardoor mislukte of lagere openstaande updates na een herstart opnieuw afspeelbaar blijven.
De upstream `getUpdates`-fetchoffset van Telegram wordt nog steeds beheerd door
de pollingbibliotheek, dus de resterende diepere ingreep is een volledig duurzame pollingbron
als we redelivery op platformniveau nodig hebben voorbij het herstartwatermerk van OpenClaw.
Webhookplatforms kunnen directe HTTP-bevestiging nodig hebben, maar ze hebben nog steeds
inkomende deduplicatie en duurzame uitgaande verzendintenties nodig omdat webhooks opnieuw kunnen leveren.

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

De helper wordt uitgebreid tot:

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

De intentie moet bestaan vóór transport-I/O. Een herstart na het beginnen maar vóór
het committen is herstelbaar.

De gevaarlijke grens ligt na platformsucces en vóór het committen van het ontvangstbewijs. Als een
proces daar stopt, kan OpenClaw niet weten of het platformbericht bestaat,
tenzij de adapter native idempotentie of een pad voor ontvangstbewijsafstemming biedt.
Die pogingen moeten hervatten in `unknown_after_send`, niet blind opnieuw afspelen. Kanalen
zonder afstemming mogen alleen kiezen voor at-least-once opnieuw afspelen als dubbele zichtbare
berichten een acceptabele, gedocumenteerde afweging zijn voor dat kanaal en die relatie.
De huidige SDK-afstemmingsbrug vereist dat de adapter
`reconcileUnknownSend` declareert, en vraagt vervolgens `durableFinal.reconcileUnknownSend` om
een onbekende invoer te classificeren als `sent`, `not_sent` of `unresolved`; alleen `not_sent`
staat opnieuw afspelen toe, en onopgeloste invoeren blijven terminaal of proberen alleen de
afstemmingscontrole opnieuw.

Duurzaamheidsbeleid moet expliciet zijn:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` betekent dat core gesloten moet falen wanneer het de duurzame intentie niet kan schrijven.
`best_effort` kan doorvallen wanneer persistentie niet beschikbaar is. `disabled` behoudt
het oude directe verzendgedrag. Tijdens migratie staan legacy-wrappers en openbare
compatibiliteitshelpers standaard op `disabled`; ze mogen `required` niet afleiden uit
het feit dat een kanaal een generieke uitgaande adapter heeft.

Verzendcontexten zijn ook eigenaar van kanaallokale effecten na het verzenden. Een migratie is niet veilig
als duurzame levering lokaal gedrag omzeilt dat eerder aan het directe verzendpad
van het kanaal was gekoppeld. Voorbeelden zijn caches voor onderdrukking van self-echo,
markers voor threaddeelname, native bewerkingsankers, rendering van modelhandtekeningen
en platformspecifieke dubbele-beschermingen. Die effecten moeten naar de
verzendadapter, de renderadapter of een benoemde verzendcontext-hook worden verplaatst voordat dat
kanaal duurzame generieke eindlevering kan inschakelen.

Verzendhelpers moeten ontvangstbewijzen helemaal teruggeven aan hun aanroeper. Duurzame
wrappers mogen bericht-id's niet inslikken of een kanaalleveringsresultaat vervangen door
`undefined`; gebufferde dispatchers gebruiken die id's voor threadankers, latere bewerkingen,
preview-finalisatie en onderdrukking van duplicaten.

Fallback-verzendingen werken op batches, niet op losse payloads. Silent-reply-herschrijvingen,
mediafallback, kaartfallback en chunkprojectie kunnen allemaal meer dan
één afleverbaar bericht produceren, dus een verzendcontext moet ofwel de hele
geprojecteerde batch afleveren of expliciet documenteren waarom slechts één payload geldig is.

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

Wanneer zo'n fallback duurzaam is, moet de hele geprojecteerde batch worden vertegenwoordigd door
één duurzame verzendintentie of een ander atomair batchplan. Elke payload
één voor één vastleggen is niet genoeg: een crash tussen payloads kan een gedeeltelijk zichtbare
fallback achterlaten zonder duurzame registratie voor de resterende payloads. Herstel moet weten
welke units al ontvangstbewijzen hebben en ofwel alleen ontbrekende units opnieuw afspelen of
de batch markeren als `unknown_after_send` totdat de adapter deze afstemt.

## Live-context

Preview-, bewerkings-, voortgangs- en streamgedrag zouden één opt-in levenscyclus moeten zijn.

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

Dit zou huidig gedrag moeten dekken:

- Telegram verzenden plus bewerkingspreview, met verse finale na verouderde previewleeftijd.
- Discord verzenden plus bewerkingspreview, annuleren bij media/fout/expliciet antwoord.
- Slack native stream of conceptpreview afhankelijk van threadvorm.
- Mattermost-finalisatie van conceptbericht.
- Matrix-finalisatie van conceptgebeurtenis of redactie bij mismatch.
- Teams native voortgangsstream.
- QQ Bot-stream of verzamelde fallback.

## Adapteroppervlak

Het openbare SDK-doel moet één subpad zijn:

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

Vóór preflight-autorisatie moet core het gedeelde OpenClaw-echo-predicaat uitvoeren
wanneer `origin.decode` OpenClaw-originmetadata retourneert. De ontvangstadapter
levert platformfeiten zoals botauteur en roomvorm; core is eigenaar van de dropbeslissing
en volgorde, zodat kanalen tekstfilters niet opnieuw implementeren.

Origin-adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core stelt `MessageOrigin` in. Kanalen vertalen het alleen naar en van native
transportmetadata. Slack koppelt dit aan `chat.postMessage({ metadata })` en
inkomende `message.metadata`; Matrix kan het koppelen aan extra gebeurtenisinhoud; kanalen
zonder native metadata kunnen een ontvangstbewijs-/uitgaand register gebruiken wanneer dat de
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

## Reductie van openbare SDK

Het nieuwe openbare oppervlak moet deze conceptuele gebieden opnemen of afwaarderen:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- de meeste openbare gebruiken van `outbound-runtime`
- ad-hoc helpers voor de conceptstreamlevenscyclus

Compatibiliteitssubpaden kunnen als wrappers blijven bestaan, maar nieuwe externe plugins
zouden ze niet nodig moeten hebben.

Gebundelde plugins mogen interne helperimports via gereserveerde runtimesubpaden
behouden tijdens de migratie. Openbare documentatie moet pluginauteurs naar
`plugin-sdk/channel-message` sturen zodra het bestaat.

## Relatie tot kanaalturn

`runtime.channel.turn.*` moet tijdens de migratie blijven bestaan.

Het moet een compatibiliteitsadapter worden:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` moet aanvankelijk ook blijven bestaan:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Nadat alle gebundelde plugins en bekende externe compatibiliteitspaden zijn overbrugd,
kan `channel.turn` worden afgewaardeerd. Het mag niet worden verwijderd totdat er een
gepubliceerd SDK-migratiepad en contracttests zijn die bewijzen dat oude plugins nog werken
of falen met een duidelijke versiefout.

## Compatibiliteitsvangrails

Tijdens migratie is generieke duurzame levering opt-in voor elk kanaal waarvan
de bestaande leveringscallback neveneffecten heeft naast "deze payload verzenden".

Legacy-toegangspunten zijn standaard niet-duurzaam:

- `channel.turn.run` en `dispatchAssembledChannelTurn` gebruiken de
  leveringscallback van het kanaal, tenzij dat kanaal expliciet een geaudit duurzaam
  beleid-/optiesobject levert.
- `channel.turn.runPrepared` blijft kanaaleigendom totdat de voorbereide dispatcher
  expliciet de verzendcontext aanroept.
- Openbare compatibiliteitshelpers zoals `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` en direct-DM-helpers injecteren nooit generieke
  duurzame levering vóór de door de aanroeper geleverde `deliver`- of `reply`-callback.

Voor migratiebrugtypen betekent `durable: undefined` "niet duurzaam". Het
duurzame pad wordt alleen ingeschakeld door een expliciete beleid-/optiewaarde. `durable:
false` kan als compatibiliteitsspelling blijven bestaan, maar de implementatie zou niet
moeten vereisen dat elk ongemigreerd kanaal dit toevoegt.

Huidige brugcode moet de duurzaamheidsbeslissing expliciet houden:

- Persistente eindaflevering retourneert een gediscrimineerde status. `handled_visible` en
  `handled_no_send` zijn terminaal; `unsupported` en `not_applicable` kunnen
  terugvallen op door het kanaal beheerde aflevering; `failed` geeft de verzendfout door.
- Generieke persistente eindaflevering wordt afgeschermd door adaptercapaciteiten zoals
  stille aflevering, behoud van antwoorddoel, behoud van native citaten en
  hooks voor het verzenden van berichten. Ontbrekende pariteit moet kiezen voor door het kanaal beheerde aflevering,
  niet voor een generieke verzending die voor de gebruiker zichtbaar gedrag wijzigt.
- Persistente verzendingen met wachtrijbackend stellen een referentie naar de afleveringsintentie beschikbaar. Bestaande
  `pendingFinalDelivery*`-sessievelden kunnen de intent-id tijdens de
  overgang dragen; de eindtoestand is een `MessageSendIntent`-opslag in plaats van bevroren
  antwoordtekst plus ad-hoc contextvelden.

Schakel het generieke persistente pad voor een kanaal niet in totdat al deze punten
waar zijn:

- De generieke verzendadapter voert hetzelfde rendering- en transportgedrag uit als
  het oude directe pad.
- Lokale neveneffecten na verzending blijven behouden via de verzendcontext.
- De adapter retourneert ontvangstbewijzen of afleveringsresultaten met alle platformbericht-
  ids.
- Voorbereide dispatcherpaden roepen ofwel de nieuwe verzendcontext aan, of blijven gedocumenteerd
  als buiten de persistente garantie.
- Fallback-aflevering verwerkt elke geprojecteerde payload, niet alleen de eerste.
- Persistente fallback-aflevering registreert de hele geprojecteerde payloadarray als één
  herspeelbare intentie of batchplan.

Concrete migratierisico's die behouden moeten blijven:

- iMessage-monitoraflevering registreert verzonden berichten in een echo-cache na een
  succesvolle verzending. Persistente eindverzendingen moeten die cache nog steeds vullen, anders
  kan OpenClaw zijn eigen eindantwoorden opnieuw opnemen als inkomende gebruikersberichten.
- Tlon voegt een optionele modelhandtekening toe en registreert deelgenomen threads
  na groepsantwoorden. Generieke persistente aflevering mag die effecten niet omzeilen;
  verplaats ze naar Tlon-render-/verzend-/finalize-adapters of houd Tlon op het
  door het kanaal beheerde pad.
- Discord en andere voorbereide dispatchers beheren al directe aflevering en preview-
  gedrag. Ze vallen niet onder een persistente garantie voor een samengestelde beurt totdat
  hun voorbereide dispatchers eindantwoorden expliciet via de verzendcontext routeren.
- Telegram stille fallback-aflevering moet de volledige geprojecteerde payload-
  array afleveren. Een shortcut met één payload kan aanvullende fallback-payloads na
  projectie laten vallen.
- LINE, Zalo, Nostr en andere bestaande samengestelde/helperpaden kunnen
  reply-token-afhandeling, mediaproxying, caches voor verzonden berichten, opschoning van laad-/statusmeldingen
  of alleen-callbackdoelen hebben. Ze blijven op door het kanaal beheerde aflevering totdat
  die semantiek door de verzendadapter wordt vertegenwoordigd en door tests is geverifieerd.
- Direct-DM-helpers kunnen een antwoordcallback hebben die het enige correcte transport-
  doel is. Generieke uitgaande verzending mag niet raden op basis van `OriginatingTo` of `To` en
  die callback overslaan.
- OpenClaw Gateway-foutuitvoer moet zichtbaar blijven voor mensen, maar getagde
  door bots geschreven roomecho's moeten vóór `allowBots`-autorisatie worden verwijderd.
  Kanalen mogen dit niet implementeren met prefixfilters op zichtbare tekst, behalve als een
  korte noodoplossing; het persistente contract is gestructureerde origin-metadata.

## Interne opslag

De persistente wachtrij moet berichtverzendintenties opslaan, geen antwoordpayloads.

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

Herstelloop:

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

De wachtrij moet genoeg identiteit bewaren om na een herstart opnieuw af te spelen via hetzelfde account,
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
- Probeer `invalid_payload` niet opnieuw, tenzij er een renderingfallback bestaat.
- Probeer `auth` of `permission` niet opnieuw totdat de configuratie wijzigt.
- Laat voor `not_found` live-finalisatie terugvallen van bewerken naar een nieuwe verzending wanneer
  het kanaal verklaart dat dit veilig is.
- Gebruik voor `conflict` ontvangstbewijs-/idempotentieregels om te bepalen of het bericht
  al bestaat.
- Elke fout nadat de adapter mogelijk platform-I/O heeft voltooid maar vóór ontvangstbewijs-
  commit wordt `unknown_after_send`, tenzij de adapter kan bewijzen dat de platform-
  operatie niet heeft plaatsgevonden.

## Kanaaltoewijzing

| Kanaal          | Doelmigratie                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Ontvang ack-beleid plus duurzame definitieve verzendingen. Live-adapter beheert verzending plus voorbeeldbewerking, definitieve verzending van verouderde voorbeelden, onderwerpen, overslaan van citaat-antwoordvoorbeelden, mediafallback en retry-after-afhandeling.                                                                                              |
| Discord         | Verzendadapter wikkelt bestaande duurzame payloadlevering in. Live-adapter beheert conceptbewerking, voortgangsconcept, annulering van media-/foutvoorbeeld, behoud van antwoorddoel en ontvangstbewijzen voor bericht-id's. Controleer door bot geschreven gateway-fout-echo's in gedeelde ruimtes; gebruik een uitgaand register of een ander native equivalent als Discord geen oorsprongsmetadata op normale berichten kan dragen. |
| Slack           | Verzendadapter handelt normale chatberichten af. Live-adapter kiest native stream wanneer de threadvorm dit ondersteunt, anders conceptvoorbeeld. Ontvangstbewijzen behouden threadtijdstempels. Oorsprongsadapter koppelt OpenClaw-gatewayfouten aan Slack `chat.postMessage.metadata` en verwijdert getagde botruimte-echo's vóór `allowBots`-autorisatie.                                  |
| WhatsApp        | Verzendadapter beheert tekst-/mediaverzending met duurzame definitieve intents. Ontvangstadapter handelt groepsvermelding en afzenderidentiteit af. Live kan afwezig blijven totdat WhatsApp een bewerkbaar transport heeft.                                                                                                                                          |
| Matrix          | Live-adapter beheert concepteventbewerkingen, finalisatie, redactie, beperkingen voor versleutelde media en fallback bij niet-overeenkomend antwoorddoel. Ontvangstadapter beheert hydratatie en deduplicatie van versleutelde events. Oorsprongsadapter moet de oorsprong van OpenClaw-gatewayfouten coderen in Matrix-eventinhoud en geconfigureerde botruimte-echo's verwijderen vóór `allowBots`-afhandeling.              |
| Mattermost      | Live-adapter beheert één conceptbericht, voortgangs-/toolvouwing, finalisatie op dezelfde plek en fallback naar nieuwe verzending.                                                                                                                                                                                                                                    |
| Microsoft Teams | Live-adapter beheert native voortgang en blokstreamgedrag. Verzendadapter beheert activiteiten en ontvangstbewijzen voor bijlagen/kaarten.                                                                                                                                                                                                                           |
| Feishu          | Renderadapter beheert tekst-/kaart-/raw-rendering. Live-adapter beheert streamingkaarten en onderdrukking van dubbele definitieve berichten. Verzendadapter beheert reacties, onderwerpsessies, media en spraakonderdrukking.                                                                                                                                         |
| QQ Bot          | Live-adapter beheert C2C-streaming, accumulatortime-out en fallback naar definitieve verzending. Renderadapter beheert mediatags en tekst-als-spraak.                                                                                                                                                                                                                 |
| Signal          | Eenvoudige ontvangst plus verzendadapter. Geen live-adapter tenzij signal-cli betrouwbare bewerkingsondersteuning toevoegt.                                                                                                                                                                                                                                          |
| iMessage        | Eenvoudige ontvangst plus verzendadapter. iMessage-verzending moet de populatie van de monitor-echo-cache behouden voordat duurzame definitieve berichten monitorlevering kunnen omzeilen.                                                                                                                                                                         |
| Google Chat     | Eenvoudige ontvangst plus verzendadapter met threadrelatie gekoppeld aan spaces en thread-id's. Controleer `allowBots=true`-ruimtegedrag voor getagde OpenClaw-gatewayfout-echo's.                                                                                                                                                                                 |
| LINE            | Eenvoudige ontvangst plus verzendadapter met reply-tokenbeperkingen gemodelleerd als doel-/relatiecapability.                                                                                                                                                                                                                                                       |
| Nextcloud Talk  | SDK-ontvangstbridge plus verzendadapter.                                                                                                                                                                                                                                                                                                                            |
| IRC             | Eenvoudige ontvangst plus verzendadapter, geen duurzame bewerkingsontvangstbewijzen.                                                                                                                                                                                                                                                                                 |
| Nostr           | Ontvangst plus verzendadapter voor versleutelde DM's; ontvangstbewijzen zijn event-id's.                                                                                                                                                                                                                                                                             |
| QA Channel      | Contracttestadapter voor ontvangst-, verzend-, live-, retry- en herstelgedrag.                                                                                                                                                                                                                                                                                      |
| Synology Chat   | Eenvoudige ontvangst plus verzendadapter.                                                                                                                                                                                                                                                                                                                           |
| Tlon            | Verzendadapter moet model-signature-rendering en tracking van deelgenomen threads behouden voordat generieke duurzame definitieve levering wordt ingeschakeld.                                                                                                                                                                                                       |
| Twitch          | Eenvoudige ontvangst plus verzendadapter met rate-limit-classificatie.                                                                                                                                                                                                                                                                                               |
| Zalo            | Eenvoudige ontvangst plus verzendadapter.                                                                                                                                                                                                                                                                                                                           |
| Zalo Personal   | Eenvoudige ontvangst plus verzendadapter.                                                                                                                                                                                                                                                                                                                           |

## Migratieplan

### Fase 1: Intern berichtdomein

- Voeg `src/channels/message/*`-typen toe voor berichten, doelen, relaties,
  oorsprongen, ontvangstbewijzen, capabilities, duurzame intents, ontvangstcontext,
  verzendcontext, live-context en foutklassen.
- Voeg `origin?: MessageOrigin` toe aan het payloadtype van de migratiebridge dat
  door huidige antwoordlevering wordt gebruikt, en verplaats dat veld daarna naar
  `ChannelMessage` en gerenderde berichttypen naarmate de refactor antwoordpayloads
  vervangt.
- Houd dit intern totdat adapters en tests de vorm bewijzen.
- Voeg zuivere unittests toe voor statustransities en serialisatie.

### Fase 2: Kern voor duurzaam verzenden

- Verplaats de bestaande uitgaande wachtrij van antwoordpayloaddurabiliteit naar duurzame
  berichtverzendintents.
- Laat een duurzame verzendintent een geprojecteerde payloadarray of batchplan dragen, niet
  slechts één antwoordpayload.
- Behoud het huidige wachtrijherstelgedrag via compatibiliteitsconversie.
- Laat `deliverOutboundPayloads` `messages.send` aanroepen.
- Maak definitieve-verzenddurabiliteit de standaard en faal gesloten wanneer de duurzame intent
  niet kan worden geschreven in de nieuwe berichtlevenscyclus, nadat de adapter
  replay-veiligheid verklaart. Bestaande kanaalturn- en SDK-compatibiliteitspaden blijven
  in deze fase standaard direct-send.
- Registreer ontvangstbewijzen consistent.
- Retourneer ontvangstbewijzen en leveringsresultaten aan de oorspronkelijke dispatcher-aanroeper in plaats
  van duurzaam verzenden als een terminaal neveneffect te behandelen.
- Persisteer berichtoorsprong via duurzame verzendintents, zodat herstel, replay en
  opgesplitste verzendingen de operationele herkomst van OpenClaw behouden.

### Fase 3: Kanaalturnbridge

- Implementeer `channel.turn.run` en `dispatchAssembledChannelTurn` opnieuw bovenop
  `messages.receive` en `messages.send`.
- Houd huidige facttypen stabiel.
- Behoud legacygedrag standaard. Een assembled-turn-kanaal wordt alleen duurzaam
  wanneer de adapter expliciet opt-in doet met een replay-veilig durabiliteitsbeleid.
- Houd `durable: false` als compatibiliteitsuitweg voor paden die native bewerkingen finaliseren
  en nog niet veilig kunnen replayen, maar vertrouw niet op `false`-markeringen
  om ongemigreerde kanalen te beschermen.
- Stel assembled-turn-durabiliteit alleen standaard in binnen de nieuwe berichtlevenscyclus, nadat
  de kanaalmapping bewijst dat het generieke verzendpad de oude kanaal-
  leveringssemantiek behoudt.

### Fase 4: Prepared Dispatcher Bridge

- Vervang `deliverDurableInboundReplyPayload` door een verzendcontextbrug.
- Behoud de oude helper als wrapper.
- Porteer eerst Telegram, WhatsApp, Slack, Signal, iMessage en Discord, omdat
  ze al duurzaam definitief werk of eenvoudigere verzendpaden hebben.
- Beschouw elke voorbereide dispatcher als niet gedekt totdat die expliciet
  kiest voor de verzendcontext. Documentatie en changelog-items moeten
  "samengestelde kanaalbeurten" zeggen of de gemigreerde kanaalpaden noemen, in
  plaats van te claimen dat alle automatische definitieve antwoorden zijn gedekt.
- Houd `recordInboundSessionAndDispatchReply`, direct-DM-helpers en vergelijkbare
  openbare compatibiliteitshelpers gedragsbehoudend. Ze mogen later een
  expliciete opt-in voor verzendcontext aanbieden, maar mogen niet automatisch
  proberen generieke duurzame levering uit te voeren vóór de door de aanroeper
  beheerde leveringscallback.

### Fase 5: Geünificeerde live-levenscyclus

- Bouw `messages.live` met twee proof-adapters:
  - Telegram voor verzenden plus bewerken plus verouderde definitieve verzending.
  - Matrix voor conceptfinalisatie plus redactie-fallback.
- Migreer daarna Discord, Slack, Mattermost, Teams, QQ Bot en Feishu.
- Verwijder gedupliceerde preview-finalisatiecode pas nadat elk kanaal
  pariteitstests heeft.

### Fase 6: Openbare SDK

- Voeg `openclaw/plugin-sdk/channel-message` toe.
- Documenteer dit als de voorkeurs-API voor kanaalplugins.
- Werk package-exports, entrypoint-inventaris, gegenereerde API-baselines en
  plugin-SDK-documentatie bij.
- Neem `MessageOrigin`, origin encode/decode-hooks en de gedeelde
  `shouldDropOpenClawEcho`-predicate op in het channel-message-SDK-oppervlak.
- Behoud compatibiliteitswrappers voor oude subpaden.
- Markeer reply-genoemde SDK-helpers als verouderd in de documentatie nadat
  gebundelde plugins zijn gemigreerd.

### Fase 7: Alle verzenders

Verplaats alle niet-reply-uitgaande producenten naar `messages.send`:

- cron- en heartbeat-meldingen
- taakvoltooiingen
- hook-resultaten
- goedkeuringsprompts en goedkeuringsresultaten
- verzendingen via de message-tool
- aankondigingen van subagent-voltooiing
- expliciete verzendingen vanuit CLI of Control UI
- automatiserings-/broadcastpaden

Dit is waar het model ophoudt "agent replies" te zijn en "OpenClaw sends
messages" wordt.

### Fase 8: Turn afschaffen

- Behoud `channel.turn` ten minste één compatibiliteitsvenster als wrapper.
- Publiceer migratienotities.
- Voer plugin-SDK-compatibiliteitstests uit tegen oude imports.
- Verwijder of verberg oude interne helpers pas nadat geen gebundelde plugin ze
  nog nodig heeft en externe contracten een stabiele vervanging hebben.

## Testplan

Unittests:

- Serialisatie en herstel van duurzame verzendintentie.
- Hergebruik van idempotentiesleutels en onderdrukking van duplicaten.
- Receipt-commit en replay overslaan.
- `unknown_after_send`-herstel dat reconcilieert vóór replay wanneer een adapter
  reconciliatie ondersteunt.
- Beleid voor foutclassificatie.
- Sequencing van receive-ack-beleid.
- Relatiemapping voor reply-, followup-, system- en broadcast-verzendingen.
- Origin-factory voor Gateway-fouten en `shouldDropOpenClawEcho`-predicate.
- Behoud van origin via payloadnormalisatie, chunking, serialisatie van duurzame
  wachtrij en herstel.

Integratietests:

- Eenvoudige `channel.turn.run`-adapter registreert en verzendt nog steeds.
- Legacy levering van samengestelde turns wordt niet duurzaam tenzij het kanaal
  expliciet opt-in doet.
- `channel.turn.runPrepared`-brug registreert en finaliseert nog steeds.
- Openbare compatibiliteitshelpers roepen standaard door de aanroeper beheerde
  leveringscallbacks aan en voeren geen generieke send uit vóór die callbacks.
- Duurzame fallback-levering speelt de volledige geprojecteerde payload-array na
  herstart opnieuw af en kan de latere payloads niet ongeregistreerd laten na
  een vroege crash.
- Duurzame levering van samengestelde turns retourneert platformbericht-id's aan
  de gebufferde dispatcher.
- Aangepaste leveringshooks retourneren nog steeds platformbericht-id's wanneer
  duurzame levering is uitgeschakeld of niet beschikbaar is.
- Definitieve reply overleeft een herstart tussen assistant-voltooiing en
  platformverzending.
- Previewconcept wordt ter plekke gefinaliseerd wanneer dat is toegestaan.
- Previewconcept wordt geannuleerd of geredigeerd wanneer media/fout/
  reply-target-mismatch normale levering vereist.
- Blokstreaming en previewstreaming leveren niet allebei dezelfde tekst.
- Vroeg gestreamde media worden niet gedupliceerd in definitieve levering.

Kanaaltests:

- Telegram topic-reply met polling-ack vertraagd tot de veilige voltooide
  watermark van de receive-context.
- Telegram polling-herstel voor geaccepteerde-maar-niet-geleverde updates gedekt
  door het gepersisteerde safe-completed offset-model.
- Telegram verouderde preview verzendt een nieuwe definitieve versie en ruimt de
  preview op.
- Telegram silent fallback verzendt elke geprojecteerde fallback-payload.
- Telegram silent fallback-duurzaamheid registreert de volledige geprojecteerde
  fallback-array atomisch, niet één duurzame intentie met één payload per
  loop-iteratie.
- Discord preview annuleren bij media/fout/expliciete reply.
- Discord voorbereide dispatcher-finals lopen via de verzendcontext voordat docs
  of changelog claimen dat Discord final-reply-duurzaamheid heeft.
- Duurzame definitieve iMessage-verzendingen vullen de echo-cache voor verzonden
  berichten van de monitor.
- Legacy leveringspaden van LINE, Zalo en Nostr worden niet omzeild door
  generieke duurzame verzending totdat hun adapterpariteitstests bestaan.
- Direct-DM-/Nostr-callbacklevering blijft gezaghebbend tenzij expliciet
  gemigreerd naar een volledig berichtdoel en replay-veilige verzendadapter.
- Slack getagde OpenClaw Gateway-foutberichten blijven uitgaand zichtbaar,
  getagde botroom-echo's vallen vóór `allowBots` weg, en ongetagde botberichten
  met dezelfde zichtbare tekst volgen nog steeds normale botautorisatie.
- Slack native stream fallback naar conceptpreview in top-level DM's.
- Matrix previewfinalisatie en redactie-fallback.
- Matrix getagde OpenClaw Gateway-foutroom-echo's van geconfigureerde
  botaccounts vallen weg vóór `allowBots`-afhandeling.
- Discord en Google Chat shared-room Gateway-failure cascade-audits dekken
  `allowBots`-modi voordat daar generieke bescherming wordt geclaimd.
- Mattermost conceptfinalisatie en fresh-send fallback.
- Teams native voortgangsfinalisatie.
- Feishu onderdrukking van dubbele final.
- QQ Bot accumulator-timeoutfallback.
- Tlon duurzame definitieve verzendingen behouden model-signature-rendering en
  participated-thread-tracking.
- Eenvoudige duurzame definitieve verzendingen voor WhatsApp, Signal, iMessage,
  Google Chat, LINE, IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch,
  Zalo en Zalo Personal.

Validatie:

- Gerichte Vitest-bestanden tijdens ontwikkeling.
- `pnpm check:changed` in Testbox voor het volledige gewijzigde oppervlak.
- Bredere `pnpm check` in Testbox vóór het landen van de complete refactor of
  na openbare SDK-/exportwijzigingen.
- Live of qa-channel smoke voor ten minste één kanaal dat bewerken ondersteunt en
  één eenvoudig send-only-kanaal voordat compatibiliteitswrappers worden
  verwijderd.

## Open vragen

- Of Telegram uiteindelijk de grammY runner-bron moet vervangen door een
  volledig duurzame pollingbron die platformniveau-herlevering kan beheren, niet
  alleen OpenClaw's gepersisteerde herstartwatermark.
- Of duurzame live preview-state moet worden opgeslagen in hetzelfde
  wachtrijrecord als de definitieve verzendintentie of in een sibling
  live-state-store.
- Hoe lang compatibiliteitswrappers gedocumenteerd blijven nadat
  `plugin-sdk/channel-message` wordt geleverd.
- Of externe plugins receive-adapters rechtstreeks moeten implementeren of
  alleen normalize/send/live-hooks moeten leveren via
  `defineChannelMessageAdapter`.
- Welke receipt-velden veilig in de openbare SDK kunnen worden blootgesteld
  versus interne runtimestate.
- Of side effects zoals self-echo-caches en participated-thread-markers moeten
  worden gemodelleerd als verzendcontext-hooks, adapterbeheerde finalisatiestappen
  of receipt-subscribers.
- Welke kanalen native origin-metadata hebben, welke gepersisteerde uitgaande
  registers nodig hebben en welke geen betrouwbare cross-bot echo-onderdrukking
  kunnen bieden.

## Acceptatiecriteria

- Elk gebundeld berichtkanaal verzendt definitieve zichtbare output via
  `messages.send`.
- Elk inbound berichtkanaal komt binnen via `messages.receive` of een
  gedocumenteerde compatibiliteitswrapper.
- Elk preview-/edit-/stream-kanaal gebruikt `messages.live` voor conceptstate en
  finalisatie.
- `channel.turn` is alleen een wrapper.
- Reply-genoemde SDK-helpers zijn compatibiliteitsexports, niet het aanbevolen
  pad.
- Duurzaam herstel kan in behandeling zijnde definitieve verzendingen na een
  herstart opnieuw afspelen zonder de definitieve respons te verliezen of al
  gecommitte verzendingen te dupliceren; verzendingen waarvan de platformuitkomst
  onbekend is, worden vóór replay gereconcilieerd of gedocumenteerd als
  at-least-once voor die adapter.
- Duurzame definitieve verzendingen falen gesloten wanneer de duurzame intentie
  niet kan worden geschreven, tenzij een aanroeper expliciet een gedocumenteerde
  niet-duurzame modus heeft geselecteerd.
- Legacy channel-turn- en SDK-compatibiliteitshelpers gebruiken standaard
  directe kanaalbeheerde levering; generieke duurzame verzending is alleen een
  expliciete opt-in.
- Receipts behouden alle platformbericht-id's voor meerdelige leveringen en een
  primaire id voor thread-/edit-gemak.
- Duurzame wrappers behouden kanaallokale side effects voordat directe
  leveringscallbacks worden vervangen.
- Voorbereide dispatchers tellen niet als duurzaam totdat hun definitieve
  leveringspad expliciet de verzendcontext gebruikt.
- Fallback-levering verwerkt elke geprojecteerde payload.
- Duurzame fallback-levering registreert elke geprojecteerde payload in één
  replaybare intentie of batchplan.
- Door OpenClaw ontstane Gateway-foutoutput is zichtbaar voor mensen, maar
  getagde, door bots geschreven room-echo's worden vóór botautorisatie
  weggegooid op kanalen die ondersteuning voor het origin-contract declareren.
- De docs leggen send, receive, live, state, receipts, relations, failure policy,
  migration en test coverage uit.

## Gerelateerd

- [Berichten](/nl/concepts/messages)
- [Streaming en chunking](/nl/concepts/streaming)
- [Voortgangsconcepten](/nl/concepts/progress-drafts)
- [Retrybeleid](/nl/concepts/retry)
- [Channel turn kernel](/nl/plugins/sdk-channel-turn)
