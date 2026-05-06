---
read_when:
    - Je bouwt een kanaal-Plugin en wilt de gedeelde levenscyclus voor inkomende beurten
    - Je migreert een kanaalmonitor weg van zelfgeschreven registratie-/dispatch-lijmcode
    - Je moet de fasen voor toelating, inname, classificatie, voorcontrole, oplossing, vastlegging, verzending en afronding begrijpen
sidebarTitle: Channel turn
summary: runtime.channel.turn -- de gedeelde kernel voor inkomende turns die gebundelde en externe kanaalplugins gebruiken om agentturns vast te leggen, te dispatchen en af te ronden
title: Kanaalbeurtkernel
x-i18n:
    generated_at: "2026-05-06T09:25:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

De channel-turn-kernel is de gedeelde inkomende state machine die een genormaliseerde platformgebeurtenis omzet in een agent-turn. Kanaalplugins leveren de platformfeiten en de bezorgcallback. Core beheert de orkestratie: innemen, classificeren, preflight, oplossen, autoriseren, samenstellen, vastleggen, dispatchen en afronden.

Gebruik dit wanneer je plugin zich op het hot path voor inkomende berichten bevindt. Houd niet-berichtgebeurtenissen (slash-commando's, modals, knopinteracties, lifecycle-gebeurtenissen, reacties, spraakstatus) plugin-lokaal. De kernel beheert alleen gebeurtenissen die een tekst-turn van een agent kunnen worden.

<Info>
  De kernel wordt bereikt via de geïnjecteerde plugin-runtime als `runtime.channel.turn.*`. Het plugin-runtime-type wordt geëxporteerd vanuit `openclaw/plugin-sdk/core`, zodat native plugins van derden deze entrypoints op dezelfde manier kunnen gebruiken als gebundelde kanaalplugins.
</Info>

## Waarom een gedeelde kernel

Kanaalplugins herhalen dezelfde inkomende flow: normaliseren, routeren, afschermen, een context bouwen, sessiemetadata vastleggen, de agent-turn dispatchen en de bezorgstatus afronden. Zonder gedeelde kernel moet een wijziging in mention-gating, tool-only zichtbare antwoorden, sessiemetadata, pending geschiedenis of afronding van dispatch per kanaal worden toegepast.

De kernel houdt vier concepten bewust gescheiden:

- `ConversationFacts`: waar het bericht vandaan kwam
- `RouteFacts`: welke agent en sessie het moeten verwerken
- `ReplyPlanFacts`: waar zichtbare antwoorden naartoe moeten
- `MessageFacts`: welke body en aanvullende context de agent moet zien

Slack-DM's, Telegram-topics, Matrix-threads en Feishu-topicsessies onderscheiden deze in de praktijk allemaal. Ze als één identifier behandelen veroorzaakt na verloop van tijd drift.

## Stage-lifecycle

De kernel voert dezelfde vaste pipeline uit, ongeacht kanaal:

1. `ingest` -- adapter zet een raw platformgebeurtenis om naar `NormalizedTurnInput`
2. `classify` -- adapter declareert of deze gebeurtenis een agent-turn kan starten
3. `preflight` -- adapter doet dedupe, self-echo, hydration, debounce, decryptie, gedeeltelijke voorinvulling van feiten
4. `resolve` -- adapter retourneert een volledig samengestelde turn (route, reply plan, message, delivery)
5. `authorize` -- DM-, groeps-, mention- en commandobeleid toegepast op de samengestelde feiten
6. `assemble` -- `FinalizedMsgContext` opgebouwd uit de feiten via `buildContext`
7. `record` -- inkomende sessiemetadata en laatste route opgeslagen
8. `dispatch` -- agent-turn uitgevoerd via de buffered block dispatcher
9. `finalize` -- adapter `onFinalize` draait zelfs bij een dispatchfout

Elke stage emit een gestructureerde loggebeurtenis wanneer een `log`-callback wordt meegegeven. Zie [Observability](#observability).

## Admission-soorten

De kernel throwt niet wanneer een turn wordt tegengehouden. Hij retourneert een `ChannelTurnAdmission`:

| Soort         | Wanneer                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Turn wordt toegelaten. Agent-turn draait en het zichtbare antwoordpad wordt gebruikt.                                                          |
| `observeOnly` | Turn draait end-to-end maar de delivery-adapter verzendt niets zichtbaars. Gebruikt voor broadcast-observeragents en andere passieve multi-agentflows. |
| `handled`     | Een platformgebeurtenis is lokaal verwerkt (lifecycle, reactie, knop, modal). Kernel slaat dispatch over.                                      |
| `drop`        | Overslaan-pad. Optioneel houdt `recordHistory: true` het bericht in pending groepsgeschiedenis zodat een toekomstige mention context heeft.     |

Admission kan komen uit `classify` (gebeurtenisklasse zei dat deze geen turn kan starten), uit `preflight` (dedupe, self-echo, ontbrekende mention met geschiedenisregistratie), of uit `resolveTurn` zelf.

## Entrypoints

De runtime exposeert drie aanbevolen entrypoints zodat adapters kunnen instappen op het niveau dat bij het kanaal past.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Twee oudere runtime-helpers blijven beschikbaar voor compatibiliteit met de Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Gebruik dit wanneer je kanaal zijn inkomende flow kan uitdrukken als een `ChannelTurnAdapter<TRaw>`. De adapter heeft callbacks voor `ingest`, optioneel `classify`, optioneel `preflight`, verplicht `resolveTurn` en optioneel `onFinalize`.

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

`run` is de juiste vorm wanneer het kanaal kleine adapterlogica heeft en baat heeft bij lifecycle-beheer via hooks.

### runPrepared

Gebruik dit wanneer het kanaal een complexe lokale dispatcher heeft met previews, retries, edits of thread-bootstrap die kanaal-eigendom moet blijven. De kernel registreert nog steeds de inkomende sessie vóór dispatch en levert een uniforme `DispatchedChannelTurnResult`.

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

Rijke kanalen (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) gebruiken `runPrepared` omdat hun dispatcher platformspecifiek gedrag orkestreert waarover de kernel niets hoeft te weten.

### buildContext

Een pure functie die feitenbundels mapt naar `FinalizedMsgContext`. Gebruik dit wanneer je kanaal een deel van de pipeline met de hand opbouwt, maar een consistente contextvorm wil.

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

`buildContext` is ook nuttig binnen `resolveTurn`-callbacks bij het samenstellen van een turn voor `run`.

<Note>
  Verouderde SDK-helpers zoals `dispatchInboundReplyWithBase` bridgen nog steeds via een assembled-turn-helper. Nieuwe plugincode moet `run` of `runPrepared` gebruiken.
</Note>

## Feitentypen

De feiten die de kernel van je adapter consumeert zijn platformagnostisch. Vertaal platformobjecten naar deze vormen voordat je ze aan de kernel doorgeeft.

### NormalizedTurnInput

| Veld              | Doel                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Stabiele bericht-id gebruikt voor dedupe en logs                             |
| `timestamp`       | Optionele epoch ms                                                           |
| `rawText`         | Body zoals ontvangen van het platform                                        |
| `textForAgent`    | Optionele opgeschoonde body voor de agent (mention strip, typing trim)       |
| `textForCommands` | Optionele body gebruikt voor `/command`-parsing                              |
| `raw`             | Optionele pass-through-referentie voor adaptercallbacks die het origineel nodig hebben |

### ChannelEventClass

| Veld                   | Doel                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Als false retourneert de kernel `{ kind: "handled" }`                   |
| `requiresImmediateAck` | Hint voor adapters die vóór dispatch moeten ACK'en                      |

### SenderFacts

| Veld           | Doel                                                              |
| -------------- | ------------------------------------------------------------------ |
| `id`           | Stabiele platform-sender-id                                        |
| `name`         | Weergavenaam                                                       |
| `username`     | Handle als die verschilt van `name`                                |
| `tag`          | Discord-achtige discriminator of platformtag                       |
| `roles`        | Rol-id's, gebruikt voor matching van member-role-allowlists        |
| `isBot`        | True wanneer de afzender een bekende bot is (kernel gebruikt dit voor droppen) |
| `isSelf`       | True wanneer de afzender de geconfigureerde agent zelf is          |
| `displayLabel` | Vooraf gerenderd label voor enveloptekst                           |

### ConversationFacts

| Veld              | Doel                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| `kind`            | `direct`, `group` of `channel`                                        |
| `id`              | Gespreks-id gebruikt voor routering                                   |
| `label`           | Menselijk label voor de envelop                                       |
| `spaceId`         | Optionele buitenste space-identifier (Slack-workspace, Matrix-homeserver) |
| `parentId`        | Buitenste gespreks-id wanneer dit een thread is                       |
| `threadId`        | Thread-id wanneer dit bericht zich in een thread bevindt              |
| `nativeChannelId` | Platform-native kanaal-id wanneer die verschilt van de routing-id     |
| `routePeer`       | Peer gebruikt voor `resolveAgentRoute`-lookup                         |

### RouteFacts

| Veld                    | Doel                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `agentId`               | Agent die deze turn moet afhandelen                         |
| `accountId`             | Optionele override (multi-accountkanalen)                   |
| `routeSessionKey`       | Sessiesleutel gebruikt voor routering                       |
| `dispatchSessionKey`    | Sessiesleutel gebruikt bij dispatch wanneer die verschilt van de routesleutel |
| `persistedSessionKey`   | Sessiesleutel geschreven naar opgeslagen sessiemetadata     |
| `parentSessionKey`      | Parent voor vertakte/threaded sessies                       |
| `modelParentSessionKey` | Model-side parent voor vertakte sessies                     |
| `mainSessionKey`        | Hoofd-DM-ownerpin voor directe gesprekken                   |
| `createIfMissing`       | Sta de record-stap toe een ontbrekende sessierij aan te maken |

### ReplyPlanFacts

| Veld                      | Doel                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Logisch antwoorddoel dat naar context `To` wordt geschreven |
| `originatingTo`           | Oorspronkelijk contextdoel (`OriginatingTo`)            |
| `nativeChannelId`         | Platformeigen kanaal-id voor levering                   |
| `replyTarget`             | Uiteindelijke zichtbare antwoordbestemming als die afwijkt van `to` |
| `deliveryTarget`          | Lager-niveau overschrijving voor levering               |
| `replyToId`               | Geciteerd/verankerd bericht-id                          |
| `replyToIdFull`           | Volledige geciteerde id wanneer het platform beide heeft |
| `messageThreadId`         | Thread-id op het moment van levering                    |
| `threadParentId`          | Id van het bovenliggende bericht van de thread          |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` of `none`        |

### AccessFacts

`AccessFacts` bevat de booleans die de autorisatiefase nodig heeft. Identiteitsmatching blijft in het kanaal: de kernel gebruikt alleen het resultaat.

| Veld       | Doel                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM-toestaan/koppelen/weigeren-beslissing en `allowFrom`-lijst             |
| `group`    | Groepsbeleid, route toestaan, afzender toestaan, allowlist, vermeldingsvereiste |
| `commands` | Opdracht-autorisatie over geconfigureerde autoriseerders heen             |
| `mentions` | Of vermeldingsdetectie mogelijk is en of de agent is vermeld              |

### MessageFacts

| Veld             | Doel                                                        |
| ---------------- | ----------------------------------------------------------- |
| `body`           | Uiteindelijke envelop-body (geformatteerd)                  |
| `rawBody`        | Ruwe inkomende body                                         |
| `bodyForAgent`   | Body die de agent ziet                                      |
| `commandBody`    | Body die wordt gebruikt voor opdrachtparsing                |
| `envelopeFrom`   | Vooraf gerenderd afzenderlabel voor de envelop              |
| `senderLabel`    | Optionele overschrijving voor de gerenderde afzender        |
| `preview`        | Korte geredigeerde preview voor logs                        |
| `inboundHistory` | Recente inkomende historie-items wanneer het kanaal een buffer bijhoudt |

### SupplementalContextFacts

Aanvullende context dekt citaat-, doorgestuurde en thread-bootstrap-context. De kernel past het geconfigureerde `contextVisibility`-beleid toe. De kanaaladapter levert alleen feiten en `senderAllowed`-vlaggen zodat beleid tussen kanalen consistent blijft.

### InboundMediaFacts

Media heeft de vorm van feiten. Platformdownload, auth, SSRF-beleid, CDN-regels en ontsleuteling blijven kanaal-lokaal. De kernel zet feiten om naar `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` en `MediaTranscribedIndexes`.

## Adaptercontract

Voor volledige `run` heeft de adapter deze vorm:

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

`resolveTurn` retourneert een `ChannelTurnResolved`, wat een `AssembledChannelTurn` is met een optionele toelatingssoort. Het retourneren van `{ admission: { kind: "observeOnly" } }` voert de beurt uit zonder zichtbare uitvoer te produceren. De adapter blijft eigenaar van de delivery-callback; die wordt voor die beurt alleen een no-op.

`onFinalize` wordt uitgevoerd op elk resultaat, inclusief dispatchfouten. Gebruik dit om openstaande groepsgeschiedenis te wissen, ack-reacties te verwijderen, statusindicatoren te stoppen en lokale status weg te schrijven.

## Leveringsadapter

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

`deliver` wordt eenmaal per gebufferd antwoordfragment aangeroepen. Tijdens de migratie van de berichtlevenscyclus is samengestelde levering van kanaalbeurten standaard eigendom van het kanaal: een weggelaten `durable`-veld betekent dat de kernel `deliver` rechtstreeks moet aanroepen en niet via generieke uitgaande levering mag routeren. Stel `durable` pas in nadat het kanaal is geaudit om te bewijzen dat het generieke verzendpad het oude leveringsgedrag bewaart, inclusief antwoord-/threaddoelen, media-afhandeling, verzonden-bericht-/self-echo-caches, statusopschoning en geretourneerde bericht-id's. `durable: false` blijft een compatibele spelling voor "gebruik de callback die eigendom is van het kanaal", maar ongemigreerde kanalen zouden dit niet hoeven toe te voegen. Retourneer platformbericht-id's wanneer het kanaal die heeft, zodat de dispatcher threadankers kan behouden en latere fragmenten kan bewerken; nieuwere leveringspaden moeten ook `receipt` retourneren zodat herstel, afronding van previews en duplicaatonderdrukking van `messageIds` af kunnen. Retourneer voor observe-only beurten `{ visibleReplySent: false }` of gebruik `createNoopChannelTurnDeliveryAdapter()`.

Kanalen die `runPrepared` gebruiken met een dispatcher die volledig eigendom is van het kanaal, hebben geen `ChannelTurnDeliveryAdapter`. Die dispatchers zijn standaard niet durable. Ze moeten hun directe leveringspad behouden totdat ze expliciet kiezen voor de nieuwe verzendcontext met een compleet doel, replay-veilige adapter, ontvangstbewijscontract en kanaal-side-effect-hooks.

Publieke compatibiliteitshelpers zoals `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` en direct-DM-helpers moeten tijdens de migratie gedragbehoudend blijven. Ze mogen geen generieke durable levering aanroepen vóór `deliver`- of `reply`-callbacks die eigendom zijn van de aanroeper.

## Record-opties

De recordfase wikkelt `recordInboundSession`. De meeste kanalen kunnen de standaardwaarden gebruiken. Overschrijf via `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

De dispatcher wacht op de recordfase. Als record een fout gooit, voert de kernel `onPreDispatchFailure` uit (wanneer meegegeven aan `runPrepared`) en gooit opnieuw.

## Observeerbaarheid

Elke fase emit een gestructureerd event wanneer een `log`-callback wordt geleverd:

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

Geloggede fasen: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Vermijd het loggen van ruwe bodies; gebruik `MessageFacts.preview` voor korte geredigeerde previews.

## Wat kanaal-lokaal blijft

De kernel is eigenaar van de orkestratie. Het kanaal blijft eigenaar van:

- Platformtransports (Gateway, REST, websocket, polling, webhooks)
- Identiteitsresolutie en matching van weergavenamen
- Native opdrachten, slash commands, autocomplete, modals, knoppen, spraakstatus
- Rendering van kaarten, modals en adaptive cards
- Media-auth, CDN-regels, versleutelde media, transcriptie
- API's voor bewerken, reactie, redactie en aanwezigheid
- Backfill en ophalen van geschiedenis aan platformzijde
- Koppelingsflows die platformspecifieke verificatie vereisen

Als twee kanalen dezelfde helper voor een van deze nodig krijgen, extraheer dan een gedeelde SDK-helper in plaats van die naar de kernel te verplaatsen.

## Stabiliteit

`runtime.channel.turn.*` maakt deel uit van het publieke runtime-oppervlak voor Plugins. De feittypen (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) en toelatingsvormen (`ChannelTurnAdmission`, `ChannelEventClass`) zijn bereikbaar via `PluginRuntime` vanuit `openclaw/plugin-sdk/core`.

Regels voor achterwaartse compatibiliteit zijn van toepassing: nieuwe feitvelden zijn additief, toelatingssoorten worden niet hernoemd en de namen van entrypoints blijven stabiel. Nieuwe kanaalbehoeften die een niet-additieve wijziging vereisen, moeten via het migratieproces van de Plugin-SDK lopen.

## Gerelateerd

- [Refactor van berichtlevenscyclus](/nl/concepts/message-lifecycle-refactor) voor de geplande levenscyclus voor verzenden/ontvangen/live die deze kernel zal omwikkelen
- [Kanaal-Plugins bouwen](/nl/plugins/sdk-channel-plugins) voor het bredere contract voor kanaal-Plugins
- [Plugin-runtimehelpers](/nl/plugins/sdk-runtime) voor andere `runtime.*`-oppervlakken
- [Plugin-internals](/nl/plugins/architecture-internals) voor laadpipeline en registry-mechanica
