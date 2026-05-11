---
read_when:
    - Je bouwt of herstructureert een Plugin voor een berichtenkanaal
    - Je hebt duurzame levering van definitieve antwoorden, ontvangstbewijzen, finalisatie van live previews of beleid voor ontvangstbevestiging nodig
    - Je migreert vanaf de verouderde antwoordpipeline of helpers voor het routeren van inkomende antwoorden
summary: API voor de berichtlevenscyclus voor kanaalplugins, inclusief persistente verzendingen, ontvangstbewijzen, live voorbeeldweergave, beleid voor ontvangstbevestigingen en legacy-migratie
title: API voor kanaalberichten
x-i18n:
    generated_at: "2026-05-11T20:42:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Kanaalplugins moeten één `message`-adapter uit
`openclaw/plugin-sdk/channel-message` beschikbaar maken. De adapter beschrijft de native berichtlevenscyclus
die het platform ondersteunt:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Core is eigenaar van wachtrijen, duurzaamheid, generiek retry-beleid, hooks, ontvangsten en de
gedeelde `message`-tool. De plugin is eigenaar van native send/edit/delete-calls, normalisatie van doelen,
platformthreading, geselecteerde citaten, notificatievlaggen, accountstatus en platformspecifieke neveneffecten.

Gebruik deze pagina samen met [Kanaalplugins bouwen](/nl/plugins/sdk-channel-plugins).

Het subpad `channel-message` is bewust licht genoeg voor hot plugin-bootstrapbestanden
zoals `channel.ts`: het biedt adaptercontracten, capability-bewijzen, ontvangsten en compatibiliteitsfacades zonder outbound delivery te laden.
Runtime-deliveryhelpers zijn beschikbaar vanuit
`openclaw/plugin-sdk/channel-message-runtime` voor monitor-/send-codepaden die
al asynchrone bericht-I/O uitvoeren.

Nieuwe channel- en plugin-sendcode moet de berichtlevenscyclushelpers uit
`openclaw/plugin-sdk/channel-message-runtime` gebruiken: `sendDurableMessageBatch`,
`withDurableMessageSendContext` of `deliverInboundReplyWithMessageSendContext`.
De oudere
`deliverOutboundPayloads(...)`-helper in `openclaw/plugin-sdk/outbound-runtime`
is verouderd compatibiliteits-/runtime-substraat voor outbound-internals, herstel
en legacy adapters. Gebruik deze niet voor nieuwe channel- of plugin-sendpaden.

`sendDurableMessageBatch(...)` retourneert een expliciete levenscyclusuitkomst:

- `sent` - ten minste één zichtbaar platformbericht is afgeleverd.
- `suppressed` - geen platformbericht moet als ontbrekend worden beschouwd. Stabiele
  redenen zijn onder andere `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity` en legacy `no_visible_result`.
- `partial_failed` - ten minste één platformbericht is afgeleverd voordat een latere
  payload of een neveneffect mislukte. Het resultaat bevat de afgeleverde ontvangstprefix
  plus de fout.
- `failed` - er is geen platformontvangst geproduceerd.

Gebruik `payloadOutcomes` wanneer een batch verzonden, onderdrukte en mislukte payloads combineert.
Leid hook-annulering niet af door te controleren of de oude direct-delivery-array
leeg is.

Compatibiliteitsdispatchers die nog steeds de gebufferde reply-dispatcher nodig hebben, moeten
reply-prefixopties bouwen met `createChannelMessageReplyPipeline(...)` uit
`openclaw/plugin-sdk/channel-message` en daarna de runtime
`channel.turn.runPrepared(...)` aanroepen. Zo blijven sessieregistratie en dispatchvolgorde
op de gedeelde turn-levenscyclus zonder nog een publieke turn-wrapper toe te voegen.

## Minimale adapter

De meeste nieuwe kanaalplugins kunnen starten met een kleine adapter:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Koppel deze daarna aan de kanaalplugin:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Declareer alleen capabilities die de adapter echt behoudt. Elke gedeclareerde
capability moet een contracttest hebben.

## Outbound-bridge

Als het kanaal al een compatibele `outbound`-adapter heeft, geef dan de voorkeur aan het afleiden van de
message-adapter in plaats van sendcode te dupliceren:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

De bridge zet oude outbound-sendresultaten om naar `MessageReceipt`-waarden. Nieuwe
code moet ontvangsten end-to-end doorgeven en legacy ids alleen afleiden aan compatibiliteitsranden
met `listMessageReceiptPlatformIds(...)` of
`resolveMessageReceiptPrimaryId(...)`.
Als er geen ontvangstbeleid wordt opgegeven, gebruikt `createChannelMessageAdapterFromOutbound(...)`
het `manual`-ontvangstbevestigingsbeleid. Dat maakt plugin-eigen platformbevestiging
expliciet zonder kanalen te wijzigen die webhooks,
sockets of polling-offsets buiten de generieke ontvangstcontext bevestigen.

## Verzendingen via de message-tool

Het gedeelde pad `message(action="send")` moet dezelfde core-deliverylevenscyclus
gebruiken als definitieve replies. Als een kanaal providerspecifieke vormgeving nodig heeft voor de
tool-send, implementeer dan `actions.prepareSendPayload(...)` in plaats van te verzenden vanuit
`actions.handleAction(...)`.

`prepareSendPayload(...)` ontvangt de genormaliseerde core `ReplyPayload` plus de
volledige actiecontext. Retourneer een payload met kanaalspecifieke data in
`payload.channelData.<channel>` en laat core `sendMessage(...)`,
de message lifecycle runtime, de write-ahead queue, message-sending hooks,
retry, recovery en ack cleanup aanroepen. De lifecycle-runtime kan
`deliverOutboundPayloads(...)` intern aanroepen als compatibiliteitssubstraat, maar kanaalplugins
mogen dit niet rechtstreeks aanroepen voor nieuw sendgedrag.

Retourneer alleen `null` wanneer de send niet als duurzame payload kan worden weergegeven, bijvoorbeeld
omdat deze een niet-serialiseerbare component factory bevat. Core behoudt
de legacy plugin-action fallback voor compatibiliteit, maar nieuwe channel-send
features moeten als duurzame payloaddata uitdrukbaar zijn.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

De outbound-adapter leest vervolgens `payload.channelData.demo` binnen `sendPayload`.
Dit houdt platformspecifieke rendering in de plugin terwijl core nog steeds eigenaar is van
persist, retry, recover, hooks en ack.

Voorbereide `message(action="send")`-payloads en generieke final-reply delivery gebruiken
standaard core-delivery met best-effort queueing. Vereiste duurzame wachtrijplaatsing is
alleen geldig nadat core heeft geverifieerd dat het kanaal een send kan reconciliëren waarvan de uitkomst
na een crash onbekend is. Als de adapter `reconcileUnknownSend` niet kan implementeren,
houd dan het voorbereide sendpad best-effort; core zal de write-ahead
queue nog steeds proberen, maar queue-persistentie of onzeker crashherstel maakt geen deel uit van het
vereiste deliverycontract.

## Duurzame final-capabilities

Duurzame final delivery is opt-in per neveneffect. Core gebruikt generieke
duurzame delivery alleen wanneer de adapter elke capability declareert die nodig is voor de
payload en deliveryopties.

| Capability             | Declareer wanneer                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | De adapter tekst kan verzenden en een ontvangst kan retourneren.                     |
| `media`                | Media-sends ontvangsten retourneren voor elk zichtbaar platformbericht.              |
| `payload`              | De adapter rijke reply-payloadsemantiek behoudt, niet alleen tekst en één media-URL. |
| `replyTo`              | Native reply-doelen het platform bereiken.                                           |
| `thread`               | Native thread-, onderwerp- of kanaalthreaddoelen het platform bereiken.              |
| `silent`               | Notificatieonderdrukking het platform bereikt.                                       |
| `nativeQuote`          | Metadata van geselecteerde citaten het platform bereikt.                             |
| `messageSendingHooks`  | Core message-sending hooks inhoud kunnen annuleren of herschrijven vóór platform-I/O. |
| `batch`                | Meerdelige gerenderde batches als één duurzaam plan opnieuw afspeelbaar zijn.        |
| `reconcileUnknownSend` | De adapter `unknown_after_send`-herstel kan oplossen zonder blinde replay.           |
| `afterSendSuccess`     | Kanaallokale after-send-neveneffecten één keer worden uitgevoerd.                    |
| `afterCommit`          | Kanaallokale after-commit-neveneffecten één keer worden uitgevoerd.                  |

Best-effort final delivery vereist geen `reconcileUnknownSend`; het gebruikt de
gedeelde levenscyclus wanneer de adapter de zichtbare semantiek van de payload behoudt, en
valt terug op directe platform-I/O als queue-persistentie niet beschikbaar is. Vereiste
duurzame final delivery moet `reconcileUnknownSend` expliciet vereisen. Als de
adapter niet kan bepalen of een gestarte/onbekende send het platform heeft bereikt,
declareer die capability dan niet; core zal vereiste duurzame delivery
weigeren vóór queueing.

Wanneer een caller duurzame delivery nodig heeft, leid requirements dan af in plaats van
maps handmatig te bouwen:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` is standaard vereist. Stel `messageSendingHooks: false`
alleen in voor een pad dat bewust geen globale message-sending hooks kan uitvoeren.

## Duurzaam sendcontract

Een duurzame final send heeft strengere semantiek dan legacy kanaal-eigen delivery:

- Maak de duurzame intent aan vóór platform-I/O.
- Als duurzame delivery een afgehandeld resultaat retourneert, val dan niet terug op legacy send.
- Behandel hook-annulering en no-send-resultaten als terminaal.
- Behandel `unsupported` alleen als pre-intent-resultaat.
- Laat vereiste duurzaamheid mislukken vóór platform-I/O als de queue niet kan vastleggen
  dat de platform-send is gestart.
- Voor vereiste final delivery en vereiste voorbereide message-tool sends:
  preflight `reconcileUnknownSend`; recovery moet een
  al verzonden bericht kunnen ack-en of alleen replayen nadat de adapter bewijst dat de oorspronkelijke send
  niet is gebeurd.
- Voor `best_effort` mogen queue-schrijffouten terugvallen op directe platform-I/O.
- Geef abortsignalen door aan het laden van media en platform-sends.
- Voer after-commit hooks uit na queue-ack; directe best-effort fallback voert ze
  uit na succesvolle platform-I/O omdat er geen duurzame queue-commit is.
- Retourneer ontvangsten voor elke zichtbare platformbericht-id.
- Gebruik `reconcileUnknownSend` wanneer een platform kan controleren of een onzekere send
  de gebruiker al heeft bereikt.

Dit contract voorkomt dubbele sends na crashes en voorkomt het omzeilen van
message-sending cancellation hooks.

## Ontvangsten

`MessageReceipt` is de nieuwe interne registratie van wat het platform heeft geaccepteerd:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Gebruik `createMessageReceiptFromOutboundResults(...)` bij het aanpassen van een bestaand
verzendresultaat. Gebruik `createPreviewMessageReceipt(...)` wanneer een live preview-bericht
de definitieve ontvangstbevestiging wordt. Voeg geen nieuwe eigenaar-lokale `messageIds`-velden toe.
De verouderde `ChannelDeliveryResult.messageIds` wordt nog steeds geproduceerd aan compatibiliteitsranden.

## Live preview

Kanalen die conceptvoorbeelden of voortgangsupdates streamen, moeten live
mogelijkheden declareren:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Gebruik `defineFinalizableLivePreviewAdapter(...)` en
`deliverWithFinalizableLivePreviewAdapter(...)` voor runtime-finalisatie. De
finalizer beslist of het definitieve antwoord de preview ter plekke bewerkt, een
normale fallback verzendt, wachtende preview-status verwijdert, een ambigu mislukte bewerking behoudt
zonder het bericht te dupliceren, en de definitieve ontvangstbevestiging retourneert.

## Beleid voor ontvangstbevestiging

Inkomende receivers die de timing van platformbevestigingen beheren, moeten
ontvangstbeleid declareren:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Adapters die geen ontvangstbeleid declareren, gebruiken standaard:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Gebruik de standaard wanneer het platform geen bevestiging heeft om uit te stellen, al
bevestigt vóór asynchrone verwerking, of protocolspecifieke response-semantiek
nodig heeft. Declareer een van de gefaseerde beleidsregels alleen wanneer de receiver daadwerkelijk
ontvangstcontext gebruikt om platformbevestiging later te laten plaatsvinden.

Beleidsregels:

| Beleid                 | Gebruiken wanneer                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | Het platform kan worden bevestigd nadat de inkomende gebeurtenis is geparseerd en vastgelegd. |
| `after_agent_dispatch` | Het platform moet wachten totdat de agent-dispatch is geaccepteerd.                      |
| `after_durable_send`   | Het platform moet wachten totdat definitieve aflevering een duurzame beslissing heeft.    |
| `manual`               | De plugin beheert bevestiging omdat platformsemantiek niet overeenkomt met een generieke fase. |

Gebruik `createMessageReceiveContext(...)` in receivers die ack-status uitstellen, en
`shouldAckMessageAfterStage(...)` wanneer de receiver moet testen of een
fase aan het geconfigureerde beleid heeft voldaan.

## Contracttests

Mogelijkheidsdeclaraties maken deel uit van het plugincontract. Onderbouw ze met tests:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Voeg live- en ontvangst-proofsuites toe wanneer de adapter die functies declareert. Een
ontbrekende proof moet de test laten falen in plaats van het duurzame
oppervlak stilzwijgend te verbreden.

## Verouderde compatibiliteits-API's

Deze API's blijven importeerbaar voor compatibiliteit met derden. Gebruik ze niet voor
nieuwe kanaalcode.

| Verouderde API                               | Vervanging                                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` voor compatibiliteitsdispatchers, of een `message`-adapter voor nieuwe kanaalcode |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, of een `message`-adapter voor nieuwe kanaalcode |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, of een `message`-adapter voor nieuwe kanaalcode |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, of een `message`-adapter voor nieuwe kanaalcode |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` of `deliverInboundReplyWithMessageSendContext(...)` uit `channel-message-runtime`           |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` uit `openclaw/plugin-sdk/channel-message-runtime`                         |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, of een `message`-adapter voor nieuwe kanaalcode |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, of een `message`-adapter voor nieuwe kanaalcode |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

Compatibiliteitsdispatchers kunnen nog steeds `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` en `createTypingCallbacks(...)` gebruiken via de
message-facade. Nieuwe lifecycle-code moet het oude
`channel-reply-pipeline`-subpad vermijden.

## Migratiechecklist

1. Voeg `message: defineChannelMessageAdapter(...)` of
   `message: createChannelMessageAdapterFromOutbound(...)` toe aan de kanaalplugin.
2. Retourneer `MessageReceipt` vanuit tekst-, media- en payload-verzendingen.
3. Declareer alleen mogelijkheden die worden onderbouwd door native gedrag en tests.
4. Vervang handgeschreven duurzame vereistenmaps door
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Verplaats preview-finalisatie via de live preview-helpers wanneer het kanaal
   conceptberichten ter plekke bewerkt.
6. Declareer ontvangst-ackbeleid alleen wanneer de receiver platformbevestiging echt
   kan uitstellen.
7. Behoud verouderde antwoorddispatch-helpers alleen aan compatibiliteitsranden.
