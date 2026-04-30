---
read_when:
    - Je bouwt een kanaal-Plugin en wilt de gedeelde levenscyclus voor inkomende beurten
    - Je migreert een kanaalmonitor weg van handgeschreven record-/dispatch-koppelcode
    - Je moet de fasen toelating, inname, classificatie, voorcontrole, oplossing, vastlegging, verzending en afronding begrijpen
sidebarTitle: Channel turn
summary: runtime.channel.turn -- de gedeelde kernel voor inkomende beurten die meegeleverde kanaalplugins en kanaalplugins van derden gebruiken om agentbeurten vast te leggen, te routeren en af te ronden
title: Kernel voor kanaalbeurten
x-i18n:
    generated_at: "2026-04-30T09:39:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

De channel turn-kernel is de gedeelde inkomende toestandsmachine die een genormaliseerde platformgebeurtenis omzet in een agent-turn. Kanaalplugins leveren de platformfeiten en de bezorgcallback. Core beheert de orkestratie: innemen, classificeren, preflight, oplossen, autoriseren, samenstellen, vastleggen, dispatchen en afronden.

Gebruik dit wanneer je plugin zich op het hot path voor inkomende berichten bevindt. Houd niet-berichtgebeurtenissen (slash-commands, modals, knopinteracties, lifecycle-gebeurtenissen, reacties, voice state) plugin-lokaal. De kernel beheert alleen gebeurtenissen die een tekst-turn van de agent kunnen worden.

<Info>
  De kernel wordt bereikt via de geïnjecteerde pluginruntime als `runtime.channel.turn.*`. Het pluginruntimetype wordt geëxporteerd vanuit `openclaw/plugin-sdk/core`, zodat externe native plugins deze entrypoints op dezelfde manier kunnen gebruiken als gebundelde kanaalplugins.
</Info>

## Waarom een gedeelde kernel

Kanaalplugins herhalen dezelfde inkomende flow: normaliseren, routeren, afschermen, een context bouwen, sessiemetadata vastleggen, de agent-turn dispatchen, bezorgstatus afronden. Zonder gedeelde kernel moet een wijziging in mention-gating, alleen-voor-tools zichtbare antwoorden, sessiemetadata, pending history of dispatch-afronding per kanaal worden toegepast.

De kernel houdt vier concepten bewust gescheiden:

- `ConversationFacts`: waar het bericht vandaan kwam
- `RouteFacts`: welke agent en sessie het moeten verwerken
- `ReplyPlanFacts`: waar zichtbare antwoorden naartoe moeten
- `MessageFacts`: welke inhoud en aanvullende context de agent moet zien

Slack-DM's, Telegram-onderwerpen, Matrix-threads en Feishu-onderwerpsessies onderscheiden deze in de praktijk allemaal. Ze als één identifier behandelen veroorzaakt na verloop van tijd drift.

## Faselevenscyclus

De kernel voert dezelfde vaste pipeline uit, ongeacht het kanaal:

1. `ingest` -- adapter zet een ruwe platformgebeurtenis om naar `NormalizedTurnInput`
2. `classify` -- adapter verklaart of deze gebeurtenis een agent-turn kan starten
3. `preflight` -- adapter doet deduplicatie, self-echo, hydration, debounce, decryptie en gedeeltelijke voorafinvulling van feiten
4. `resolve` -- adapter retourneert een volledig samengestelde turn (route, antwoordplan, bericht, bezorging)
5. `authorize` -- DM-, groeps-, mention- en commandobeleid toegepast op de samengestelde feiten
6. `assemble` -- `FinalizedMsgContext` gebouwd vanuit de feiten via `buildContext`
7. `record` -- inkomende sessiemetadata en laatste route persistent opgeslagen
8. `dispatch` -- agent-turn uitgevoerd via de gebufferde block-dispatcher
9. `finalize` -- adapter `onFinalize` draait zelfs bij een dispatchfout

Elke fase emitteert een gestructureerde loggebeurtenis wanneer een `log`-callback is opgegeven. Zie [Observability](#observability).

## Toelatingssoorten

De kernel throwt niet wanneer een turn wordt tegengehouden. Hij retourneert een `ChannelTurnAdmission`:

| Soort         | Wanneer                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Turn wordt toegelaten. Agent-turn draait en het zichtbare antwoordpad wordt gebruikt.                                                         |
| `observeOnly` | Turn draait end-to-end, maar de bezorgadapter stuurt niets zichtbaars. Gebruikt voor broadcast-observeragents en andere passieve multi-agentflows. |
| `handled`     | Een platformgebeurtenis is lokaal verwerkt (lifecycle, reactie, knop, modal). Kernel slaat dispatch over.                                    |
| `drop`        | Overslaan-pad. Optioneel houdt `recordHistory: true` het bericht in pending groepsgeschiedenis zodat een toekomstige mention context heeft.   |

Toelating kan komen van `classify` (gebeurtenisklasse zei dat deze geen turn kan starten), van `preflight` (deduplicatie, self-echo, ontbrekende mention met history-record), of van `resolveTurn` zelf.

## Entrypoints

De runtime stelt drie voorkeurs-entrypoints beschikbaar, zodat adapters kunnen instappen op het niveau dat bij het kanaal past.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Twee oudere runtimehelpers blijven beschikbaar voor Plugin SDK-compatibiliteit:

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

`run` heeft de juiste vorm wanneer het kanaal kleine adapterlogica heeft en profiteert van beheer van de levenscyclus via hooks.

### runPrepared

Gebruik dit wanneer het kanaal een complexe lokale dispatcher heeft met previews, retries, bewerkingen of thread-bootstrap die kanaalbeheerd moet blijven. De kernel legt nog steeds de inkomende sessie vast vóór dispatch en exposeert een uniforme `DispatchedChannelTurnResult`.

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

Rijke kanalen (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) gebruiken `runPrepared` omdat hun dispatcher platformspecifiek gedrag orkestreert dat de kernel niet hoeft te kennen.

### buildContext

Een pure functie die feitenbundels mapt naar `FinalizedMsgContext`. Gebruik dit wanneer je kanaal een deel van de pipeline handmatig uitvoert, maar een consistente contextvorm wil.

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

De feiten die de kernel van je adapter consumeert, zijn platformagnostisch. Vertaal platformobjecten naar deze vormen voordat je ze aan de kernel geeft.

### NormalizedTurnInput

| Veld              | Doel                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Stabiel bericht-id gebruikt voor deduplicatie en logs                         |
| `timestamp`       | Optionele epoch-ms                                                            |
| `rawText`         | Body zoals ontvangen van het platform                                         |
| `textForAgent`    | Optionele opgeschoonde body voor de agent (mention strippen, typen trimmen)   |
| `textForCommands` | Optionele body gebruikt voor `/command`-parsing                               |
| `raw`             | Optionele pass-throughreferentie voor adaptercallbacks die het origineel nodig hebben |

### ChannelEventClass

| Veld                   | Doel                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Als false retourneert de kernel `{ kind: "handled" }`                   |
| `requiresImmediateAck` | Hint voor adapters die vóór dispatch moeten ACK'en                      |

### SenderFacts

| Veld           | Doel                                                                |
| -------------- | ------------------------------------------------------------------- |
| `id`           | Stabiel platformafzender-id                                         |
| `name`         | Weergavenaam                                                        |
| `username`     | Handle als die verschilt van `name`                                 |
| `tag`          | Discord-achtige discriminator of platformtag                        |
| `roles`        | Rol-id's, gebruikt voor matching met allowlist voor member-roles    |
| `isBot`        | True wanneer de afzender een bekende bot is (kernel gebruikt dit voor droppen) |
| `isSelf`       | True wanneer de afzender de geconfigureerde agent zelf is           |
| `displayLabel` | Vooraf gerenderd label voor enveloptekst                            |

### ConversationFacts

| Veld              | Doel                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` of `channel`                                       |
| `id`              | Gespreks-id gebruikt voor routering                                  |
| `label`           | Menselijk label voor de envelop                                      |
| `spaceId`         | Optionele identifier van de buitenste ruimte (Slack-workspace, Matrix-homeserver) |
| `parentId`        | Buitenste gespreks-id wanneer dit een thread is                      |
| `threadId`        | Thread-id wanneer dit bericht zich in een thread bevindt             |
| `nativeChannelId` | Platform-native kanaal-id wanneer verschillend van de routerings-id  |
| `routePeer`       | Peer gebruikt voor `resolveAgentRoute`-lookup                        |

### RouteFacts

| Veld                    | Doel                                                         |
| ----------------------- | ------------------------------------------------------------ |
| `agentId`               | Agent die deze turn moet afhandelen                          |
| `accountId`             | Optionele override (multi-accountkanalen)                    |
| `routeSessionKey`       | Sessiesleutel gebruikt voor routering                        |
| `dispatchSessionKey`    | Sessiesleutel gebruikt bij dispatch wanneer verschillend van routesleutel |
| `persistedSessionKey`   | Sessiesleutel geschreven naar persistente sessiemetadata     |
| `parentSessionKey`      | Parent voor vertakte/threaded sessies                        |
| `modelParentSessionKey` | Model-side parent voor vertakte sessies                      |
| `mainSessionKey`        | Main-DM-ownerpin voor directe gesprekken                     |
| `createIfMissing`       | Sta de recordstap toe om een ontbrekende sessierij te maken  |

### ReplyPlanFacts

| Veld                      | Doel                                                            |
| ------------------------- | --------------------------------------------------------------- |
| `to`                      | Logisch antwoorddoel dat naar context `To` wordt geschreven     |
| `originatingTo`           | Oorspronkelijk contextdoel (`OriginatingTo`)                    |
| `nativeChannelId`         | Platformnative kanaal-id voor levering                          |
| `replyTarget`             | Uiteindelijke zichtbare antwoordbestemming als die afwijkt van `to` |
| `deliveryTarget`          | Lager-niveau leveringsoverschrijving                           |
| `replyToId`               | Geciteerd/verankerd bericht-id                                  |
| `replyToIdFull`           | Volledige geciteerde id wanneer het platform beide heeft        |
| `messageThreadId`         | Thread-id op het moment van levering                            |
| `threadParentId`          | Bovenliggend bericht-id van de thread                           |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct`, of `none`               |

### AccessFacts

`AccessFacts` bevat de booleans die de autorisatiefase nodig heeft. Identiteitsmatching blijft in het kanaal: de kernel gebruikt alleen het resultaat.

| Veld       | Doel                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM-toestaan/koppelen/weigeren-beslissing en `allowFrom`-lijst             |
| `group`    | Groepsbeleid, routetoestemming, afzendertoestemming, allowlist, vermeldingsvereiste |
| `commands` | Command-autorisatie over geconfigureerde authorizers                      |
| `mentions` | Of vermeldingsdetectie mogelijk is en of de agent is vermeld              |

### MessageFacts

| Veld             | Doel                                                           |
| ---------------- | -------------------------------------------------------------- |
| `body`           | Uiteindelijke envelope-body (geformatteerd)                    |
| `rawBody`        | Ruwe inkomende body                                            |
| `bodyForAgent`   | Body die de agent ziet                                         |
| `commandBody`    | Body gebruikt voor command-parsing                             |
| `envelopeFrom`   | Vooraf gerenderd afzenderlabel voor de envelope                |
| `senderLabel`    | Optionele overschrijving voor de gerenderde afzender           |
| `preview`        | Korte geredigeerde preview voor logs                           |
| `inboundHistory` | Recente inkomende geschiedenisitems wanneer het kanaal een buffer bijhoudt |

### SupplementalContextFacts

Aanvullende context omvat quote-, doorgestuurde en thread-bootstrapcontext. De kernel past het geconfigureerde `contextVisibility`-beleid toe. De kanaaladapter levert alleen facts en `senderAllowed`-vlaggen zodat cross-channel beleid consistent blijft.

### InboundMediaFacts

Media heeft de vorm van facts. Platformdownload, auth, SSRF-beleid, CDN-regels en decryptie blijven kanaallokaal. De kernel mapt facts naar `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes`, en `MediaTranscribedIndexes`.

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

`resolveTurn` retourneert een `ChannelTurnResolved`, wat een `AssembledChannelTurn` is met een optionele admission-soort. Het retourneren van `{ admission: { kind: "observeOnly" } }` voert de beurt uit zonder zichtbare output te produceren. De adapter blijft eigenaar van de delivery-callback; die wordt voor die beurt alleen een no-op.

`onFinalize` draait voor elk resultaat, inclusief dispatch-fouten. Gebruik dit om wachtende groepsgeschiedenis te wissen, ack-reacties te verwijderen, statusindicatoren te stoppen en lokale staat te flushen.

## Delivery-adapter

De kernel roept het platform niet rechtstreeks aan. Het kanaal geeft de kernel een `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` wordt eenmaal per gebufferde antwoordchunk aangeroepen. Retourneer platformbericht-id's wanneer het kanaal ze heeft, zodat de dispatcher thread-ankers kan behouden en latere chunks kan bewerken. Retourneer voor observe-only beurten `{ visibleReplySent: false }` of gebruik `createNoopChannelTurnDeliveryAdapter()`.

## Record-opties

De recordfase wikkelt `recordInboundSession`. De meeste kanalen kunnen de defaults gebruiken. Overschrijf via `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

De dispatcher wacht op de recordfase. Als record een fout gooit, voert de kernel `onPreDispatchFailure` uit (wanneer meegegeven aan `runPrepared`) en gooit de fout opnieuw.

## Observeerbaarheid

Elke fase emit een gestructureerde gebeurtenis wanneer een `log`-callback is meegegeven:

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

Geloggede fases: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Vermijd het loggen van ruwe bodies; gebruik `MessageFacts.preview` voor korte geredigeerde previews.

## Wat kanaallokaal blijft

De kernel is eigenaar van de orkestratie. Het kanaal blijft eigenaar van:

- Platformtransports (Gateway, REST, websocket, polling, webhooks)
- Identiteitsresolutie en matching van weergavenamen
- Native commands, slash commands, autocomplete, modals, buttons, voice state
- Rendering van cards, modals en adaptive cards
- Media-auth, CDN-regels, versleutelde media, transcriptie
- API's voor bewerken, reacties, redactie en aanwezigheid
- Backfill en platformzijdige geschiedenis-fetch
- Koppelingsflows die platformspecifieke verificatie vereisen

Als twee kanalen dezelfde helper voor een van deze zaken nodig krijgen, extraheer dan een gedeelde SDK-helper in plaats van die naar de kernel te verplaatsen.

## Stabiliteit

`runtime.channel.turn.*` maakt deel uit van het publieke plugin-runtime-oppervlak. De fact-typen (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) en admission-vormen (`ChannelTurnAdmission`, `ChannelEventClass`) zijn bereikbaar via `PluginRuntime` vanuit `openclaw/plugin-sdk/core`.

Regels voor achterwaartse compatibiliteit zijn van toepassing: nieuwe fact-velden zijn additief, admission-soorten worden niet hernoemd en de namen van entrypoints blijven stabiel. Nieuwe kanaalbehoeften die een niet-additieve wijziging vereisen, moeten via het migratieproces van de plugin-SDK lopen.

## Gerelateerd

- [Kanaalplugins bouwen](/nl/plugins/sdk-channel-plugins) voor het bredere contract voor kanaalplugins
- [Plugin-runtimehelpers](/nl/plugins/sdk-runtime) voor andere `runtime.*`-oppervlakken
- [Plugin-internals](/nl/plugins/architecture-internals) voor load-pipeline en registry-mechanica
