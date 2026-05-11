---
read_when:
    - Je bouwt een kanaalplugin en wilt de gedeelde levenscyclus voor inkomende beurten
    - Je migreert een kanaalmonitor weg van zelfgeschreven record-/dispatch-lijmcode
    - Je moet de fasen toelating, inname, classificatie, voorafcontrole, oplossing, registratie, verzending en afronding begrijpen
sidebarTitle: Channel turn
summary: runtime.channel.turn -- de gedeelde kernel voor inkomende beurten die gebundelde en externe kanaalplugins gebruiken om agentbeurten vast te leggen, te dispatchen en af te ronden
title: Kanaalbeurtkernel
x-i18n:
    generated_at: "2026-05-11T20:42:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

De kanaal-turn-kernel is de gedeelde inkomende toestandsmachine die een genormaliseerde platformgebeurtenis omzet in een agent-turn. Kanaalplugins leveren de platformfeiten en de bezorgcallback. Core beheert de orkestratie: opnemen, classificeren, preflighten, oplossen, autoriseren, samenstellen, vastleggen, dispatchen en afronden.

Gebruik dit wanneer je plugin zich op het hot path voor inkomende berichten bevindt. Houd niet-berichtgebeurtenissen (slash-commando's, modals, knopinteracties, lifecycle-gebeurtenissen, reacties, spraakstatus) plugin-lokaal. De kernel beheert alleen gebeurtenissen die een tekst-turn van een agent kunnen worden.

<Info>
  De kernel wordt bereikt via de geïnjecteerde pluginruntime als `runtime.channel.turn.*`. Het pluginruntime-type wordt geëxporteerd vanuit `openclaw/plugin-sdk/core`, zodat native plugins van derden deze entrypoints op dezelfde manier kunnen gebruiken als gebundelde kanaalplugins.
</Info>

## Waarom een gedeelde kernel

Kanaalplugins herhalen dezelfde inkomende flow: normaliseren, routeren, gaten, een context bouwen, sessiemetadata vastleggen, de agent-turn dispatchen, bezorgstatus afronden. Zonder gedeelde kernel moet een wijziging in mention-gating, tool-only zichtbare antwoorden, sessiemetadata, pending history of dispatch-finalisatie per kanaal worden toegepast.

De kernel houdt vier concepten bewust gescheiden:

- `ConversationFacts`: waar het bericht vandaan kwam
- `RouteFacts`: welke agent en sessie het moeten verwerken
- `ReplyPlanFacts`: waar zichtbare antwoorden heen moeten
- `MessageFacts`: welke body en aanvullende context de agent moet zien

Slack-DM's, Telegram-onderwerpen, Matrix-threads en Feishu-onderwerpsessies maken hier in de praktijk allemaal onderscheid tussen. Ze als één identifier behandelen veroorzaakt na verloop van tijd drift.

## Stage-lifecycle

De kernel voert dezelfde vaste pipeline uit, ongeacht het kanaal:

1. `ingest` -- adapter zet een ruwe platformgebeurtenis om in `NormalizedTurnInput`
2. `classify` -- adapter declareert of deze gebeurtenis een agent-turn kan starten
3. `preflight` -- adapter doet deduplicatie, self-echo, hydratie, debounce, decryptie, gedeeltelijke fact-prefill
4. `resolve` -- adapter retourneert een volledig samengestelde turn (route, antwoordplan, bericht, bezorging)
5. `authorize` -- DM-, groep-, mention- en commandobeleid toegepast op de samengestelde feiten
6. `assemble` -- `FinalizedMsgContext` gebouwd uit de feiten via `buildContext`
7. `record` -- inkomende sessiemetadata en laatste route gepersisteerd
8. `dispatch` -- agent-turn uitgevoerd via de gebufferde block-dispatcher
9. `finalize` -- adapter `onFinalize` draait ook bij een dispatch-fout

Elke stage emit een gestructureerde loggebeurtenis wanneer een `log`-callback is meegegeven. Zie [Observability](#observability).

## Toelatingssoorten

De kernel gooit geen exception wanneer een turn wordt tegengehouden. Hij retourneert een `ChannelTurnAdmission`:

| Soort         | Wanneer                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Turn wordt toegelaten. Agent-turn draait en het zichtbare antwoordpad wordt gebruikt.                                                        |
| `observeOnly` | Turn draait end-to-end, maar de bezorgadapter verzendt niets zichtbaars. Gebruikt voor broadcast-observeragents en andere passieve multi-agentflows. |
| `handled`     | Een platformgebeurtenis werd lokaal afgehandeld (lifecycle, reactie, knop, modal). Kernel slaat dispatch over.                               |
| `drop`        | Oversla-pad. Optioneel houdt `recordHistory: true` het bericht in pending groepsgeschiedenis, zodat een toekomstige mention context heeft.    |

Toelating kan komen uit `classify` (gebeurtenisklasse zei dat deze geen turn kan starten), uit `preflight` (deduplicatie, self-echo, ontbrekende mention met geschiedenisvastlegging), of uit `resolveTurn` zelf.

## Entry points

De runtime stelt drie voorkeurs-entrypoints beschikbaar, zodat adapters kunnen instappen op het niveau dat bij het kanaal past.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Twee oudere runtimehelpers blijven beschikbaar voor Plugin SDK-compatibiliteit:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

Gebruik wanneer je kanaal zijn inkomende flow kan uitdrukken als een `ChannelTurnAdapter<TRaw>`. De adapter heeft callbacks voor `ingest`, optioneel `classify`, optioneel `preflight`, verplicht `resolveTurn` en optioneel `onFinalize`.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` is de juiste vorm wanneer het kanaal kleine adapterlogica heeft en baat heeft bij eigenaarschap over de lifecycle via hooks.

### runAssembled

Gebruik wanneer het kanaal de routering al heeft opgelost, een `FinalizedMsgContext`
heeft gebouwd, en alleen de gedeelde record-, antwoordpipeline-, dispatch- en finalize-
volgorde nodig heeft. Dit is de voorkeursvorm voor eenvoudige gebundelde inkomende paden die
anders `createChannelMessageReplyPipeline(...)`- en
`runPrepared(...)`-boilerplate zouden herhalen.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

Kies `runAssembled` boven `runPrepared` wanneer het enige kanaal-eigen dispatch-
gedrag bestaat uit uiteindelijke payloadbezorging plus optioneel typen, antwoordopties, duurzame
bezorging of foutlogging.

### runPrepared

Gebruik wanneer het kanaal een complexe lokale dispatcher heeft met previews, retries, edits of thread-bootstrap die kanaal-eigen moet blijven. De kernel legt de inkomende sessie nog steeds vast vóór dispatch en geeft een uniforme `DispatchedChannelTurnResult` door.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

Rijke kanalen (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) gebruiken `runPrepared` omdat hun dispatcher platformspecifiek gedrag orkestreert waar de kernel niets over mag hoeven weten.

### buildContext

Een pure functie die factbundels mapt naar `FinalizedMsgContext`. Gebruik deze wanneer je kanaal een deel van de pipeline handmatig bouwt maar een consistente contextvorm wil.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` is ook nuttig binnen `resolveTurn`-callbacks wanneer je een turn voor `run` samenstelt.

<Note>
  Verouderde SDK-helpers zoals `dispatchInboundReplyWithBase` bridgen nog steeds via een assembled-turn-helper. Nieuwe plugincode moet `run` of `runPrepared` gebruiken.
</Note>

## Fact-typen

De feiten die de kernel van je adapter consumeert zijn platformagnostisch. Vertaal platformobjecten naar deze vormen voordat je ze aan de kernel doorgeeft.

### NormalizedTurnInput

| Veld              | Doel                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Stabiele bericht-id gebruikt voor deduplicatie en logs                       |
| `timestamp`       | Optionele epoch ms                                                           |
| `rawText`         | Body zoals ontvangen van het platform                                        |
| `textForAgent`    | Optionele opgeschoonde body voor de agent (mention-strip, type-trim)         |
| `textForCommands` | Optionele body gebruikt voor `/command`-parsing                              |
| `raw`             | Optionele pass-through-referentie voor adaptercallbacks die het origineel nodig hebben |

### ChannelEventClass

| Veld                   | Doel                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Als false retourneert de kernel `{ kind: "handled" }`                   |
| `requiresImmediateAck` | Hint voor adapters die vóór dispatch een ACK moeten sturen              |

### SenderFacts

| Veld           | Doel                                                            |
| -------------- | --------------------------------------------------------------- |
| `id`           | Stabiele platform-sender-id                                     |
| `name`         | Weergavenaam                                                    |
| `username`     | Handle indien verschillend van `name`                           |
| `tag`          | Discord-achtige discriminator of platformtag                    |
| `roles`        | Rol-id's, gebruikt voor allowlist-matching op memberrollen      |
| `isBot`        | True wanneer de sender een bekende bot is (kernel gebruikt dit voor droppen) |
| `isSelf`       | True wanneer de sender de geconfigureerde agent zelf is         |
| `displayLabel` | Vooraf gerenderd label voor enveloptekst                        |

### ConversationFacts

| Veld              | Doel                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| `kind`            | `direct`, `group` of `channel`                                          |
| `id`              | Gespreks-id gebruikt voor routering                                     |
| `label`           | Menselijk label voor de envelop                                         |
| `spaceId`         | Optionele outer space-identifier (Slack-workspace, Matrix-homeserver)   |
| `parentId`        | Outer conversation-id wanneer dit een thread is                         |
| `threadId`        | Thread-id wanneer dit bericht zich in een thread bevindt                |
| `nativeChannelId` | Platform-native kanaal-id wanneer die verschilt van de routerings-id    |
| `routePeer`       | Peer gebruikt voor `resolveAgentRoute`-lookup                           |

### RouteFacts

| Veld                    | Doel                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Agent die deze beurt moet afhandelen                       |
| `accountId`             | Optionele overschrijving (kanalen met meerdere accounts)   |
| `routeSessionKey`       | Sessiesleutel gebruikt voor routering                      |
| `dispatchSessionKey`    | Sessiesleutel gebruikt bij dispatch wanneer die verschilt van de routeersleutel |
| `persistedSessionKey`   | Sessiesleutel geschreven naar persistente sessiemetadata   |
| `parentSessionKey`      | Bovenliggende sessie voor vertakte/threaded sessies        |
| `modelParentSessionKey` | Modelzijde-bovenliggende sessie voor vertakte sessies      |
| `mainSessionKey`        | Hoofd-DM-eigenaarspin voor directe gesprekken              |
| `createIfMissing`       | Sta de recordstap toe een ontbrekende sessierij te maken   |

### ReplyPlanFacts

| Veld                      | Doel                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Logisch antwoorddoel geschreven naar context `To`       |
| `originatingTo`           | Oorspronkelijk contextdoel (`OriginatingTo`)            |
| `nativeChannelId`         | Platform-native kanaal-id voor aflevering               |
| `replyTarget`             | Uiteindelijke zichtbare antwoordbestemming als die verschilt van `to` |
| `deliveryTarget`          | Lagere-niveau afleveringsoverschrijving                 |
| `replyToId`               | Geciteerd/verankerd bericht-id                          |
| `replyToIdFull`           | Volledige geciteerde id wanneer het platform beide heeft |
| `messageThreadId`         | Thread-id op aflevermoment                              |
| `threadParentId`          | Bovenliggende bericht-id van de thread                  |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` of `none`        |

### AccessFacts

`AccessFacts` bevat de booleans die de autorisatiestap nodig heeft. Identiteitsmatching blijft in het kanaal: de kernel verbruikt alleen het resultaat.

| Veld       | Doel                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM-toestaan/koppelen/weigeren-besluit en `allowFrom`-lijst                |
| `group`    | Groepsbeleid, route toestaan, afzender toestaan, allowlist, mentionvereiste |
| `commands` | Commandoautorisatie over geconfigureerde authorizers                      |
| `mentions` | Of mentiondetectie mogelijk is en of de agent werd genoemd                |

### MessageFacts

| Veld             | Doel                                                       |
| ---------------- | ---------------------------------------------------------- |
| `body`           | Definitieve envelope-body (geformatteerd)                  |
| `rawBody`        | Ruwe inkomende body                                        |
| `bodyForAgent`   | Body die de agent ziet                                     |
| `commandBody`    | Body gebruikt voor commandoparsing                         |
| `envelopeFrom`   | Vooraf gerenderd afzenderlabel voor de envelope            |
| `senderLabel`    | Optionele overschrijving voor de gerenderde afzender       |
| `preview`        | Korte geredigeerde preview voor logs                       |
| `inboundHistory` | Recente inkomende geschiedenisitems wanneer het kanaal een buffer bewaart |

### SupplementalContextFacts

Aanvullende context omvat quote-, forwarded- en thread-bootstrapcontext. De kernel past het geconfigureerde `contextVisibility`-beleid toe. De kanaaladapter levert alleen feiten en `senderAllowed`-vlaggen, zodat beleid tussen kanalen consistent blijft.

### InboundMediaFacts

Media is feitvormig. Platformdownload, auth, SSRF-beleid, CDN-regels en decryptie blijven kanaallokaal. De kernel zet feiten om naar `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` en `MediaTranscribedIndexes`.

## Adaptercontract

Voor volledige `run` is de adaptervorm:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` retourneert een `ChannelTurnResolved`, wat een `AssembledChannelTurn` is met een optionele toelatingssoort. Het retourneren van `{ admission: { kind: "observeOnly" } }` voert de beurt uit zonder zichtbare output te produceren. De adapter blijft eigenaar van de aflevercallback; die wordt voor die beurt alleen een no-op.

`onFinalize` draait op elk resultaat, inclusief dispatchfouten. Gebruik dit om wachtende groepsgeschiedenis te wissen, ack-reacties te verwijderen, statusindicatoren te stoppen en lokale state te flushen.

## Afleveradapter

De kernel roept het platform niet rechtstreeks aan. Het kanaal geeft de kernel een `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` wordt eenmaal aangeroepen per gebufferde antwoordchunk. Tijdens de message-lifecycle-migratie is samengestelde channel-turn-aflevering standaard kanaaleigendom: een weggelaten `durable`-veld betekent dat de kernel `deliver` rechtstreeks moet aanroepen en niet via generieke uitgaande aflevering mag routeren. Stel `durable` pas in nadat het kanaal is geaudit om te bewijzen dat het generieke verzendpad het oude aflevergedrag behoudt, inclusief antwoord-/threaddoelen, mediaverwerking, verzonden-bericht-/self-echo-caches, statusopschoning en geretourneerde bericht-id's. `durable: false` blijft een compatibiliteitsspelling voor "gebruik de callback in kanaaleigendom", maar ongemigreerde kanalen zouden dit niet hoeven toe te voegen. Retourneer platformbericht-id's wanneer het kanaal die heeft, zodat de dispatcher threadankers kan behouden en latere chunks kan bewerken; nieuwere afleverpaden zouden ook `receipt` moeten retourneren zodat herstel, previewfinalisatie en duplicaatonderdrukking van `messageIds` af kunnen bewegen. Retourneer voor observe-only-beurten `{ visibleReplySent: false }` of gebruik `createNoopChannelTurnDeliveryAdapter()`.

Kanalen die `runPrepared` gebruiken met een volledig kanaaleigen dispatcher hebben geen `ChannelTurnDeliveryAdapter`. Die dispatchers zijn standaard niet durable. Ze moeten hun directe afleverpad behouden totdat ze expliciet opt-innen op de nieuwe verzendcontext met een compleet doel, replay-veilige adapter, ontvangstbewijscontract en kanaal-side-effect-hooks.

Publieke compatibiliteitshelpers zoals `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` en direct-DM-helpers moeten tijdens de migratie gedragbehoudend blijven. Ze mogen generieke durable aflevering niet aanroepen vóór caller-owned `deliver`- of `reply`-callbacks.

## Recordopties

De recordstap wrapt `recordInboundSession`. De meeste kanalen kunnen de defaults gebruiken. Overschrijf via `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

De dispatcher wacht op de recordstap. Als record een fout gooit, voert de kernel `onPreDispatchFailure` uit (wanneer meegegeven aan `runPrepared`) en gooit opnieuw.

## Observeerbaarheid

Elke stap emit een gestructureerde gebeurtenis wanneer een `log`-callback wordt meegegeven:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

Geloggede stappen: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Vermijd het loggen van ruwe bodies; gebruik `MessageFacts.preview` voor korte geredigeerde previews.

## Wat kanaallokaal blijft

De kernel is eigenaar van de orkestratie. Het kanaal blijft eigenaar van:

- Platformtransports (Gateway, REST, websocket, polling, Webhooks)
- Identiteitsresolutie en display-name-matching
- Native commando's, slashcommando's, autocomplete, modals, knoppen, voice-state
- Rendering van kaarten, modals en adaptive cards
- Media-auth, CDN-regels, versleutelde media, transcriptie
- Bewerk-, reactie-, redactie- en presence-API's
- Backfill en ophalen van platformzijdige geschiedenis
- Koppelingsflows die platformspecifieke verificatie vereisen

Als twee kanalen dezelfde helper nodig gaan hebben voor een van deze zaken, extraheer dan een gedeelde SDK-helper in plaats van die in de kernel te duwen.

## Stabiliteit

`runtime.channel.turn.*` maakt deel uit van het publieke Plugin-runtimeoppervlak. De feittypen (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) en toelatingsvormen (`ChannelTurnAdmission`, `ChannelEventClass`) zijn bereikbaar via `PluginRuntime` vanuit `openclaw/plugin-sdk/core`.

Regels voor achterwaartse compatibiliteit zijn van toepassing: nieuwe feitvelden zijn additief, toelatingssoorten worden niet hernoemd en de entrypointnamen blijven stabiel. Nieuwe kanaalbehoeften die een niet-additieve wijziging vereisen, moeten via het Plugin SDK-migratieproces lopen.

## Gerelateerd

- [Message-lifecycle-refactor](/nl/concepts/message-lifecycle-refactor) voor de geplande verzend-/ontvangst-/live-lifecycle die deze kernel zal wrappen
- [Kanaalplugins bouwen](/nl/plugins/sdk-channel-plugins) voor het bredere kanaalplugincontract
- [Plugin-runtimehelpers](/nl/plugins/sdk-runtime) voor andere `runtime.*`-oppervlakken
- [Plugin-internals](/nl/plugins/architecture-internals) voor laadpipeline- en registry-mechanica
