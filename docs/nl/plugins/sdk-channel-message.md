---
read_when:
    - Je bouwt of refactort een Plugin voor berichtenkanalen
    - Je hebt duurzame aflevering van definitieve reacties, ontvangstbevestigingen, afronding van livevoorbeelden of beleid voor ontvangstbevestiging nodig
    - Je migreert vanaf de verouderde antwoordpijplijn of helpers voor het dispatchen van inkomende antwoorden
summary: API voor de berichtlevenscyclus voor kanaalplugins, inclusief duurzame verzendingen, ontvangstbevestigingen, livevoorbeeld, beleid voor ontvangstbevestigingen en legacy-migratie
title: API voor kanaalberichten
x-i18n:
    generated_at: "2026-05-06T09:25:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Kanaalplugins moeten één `message`-adapter beschikbaar stellen vanuit
`openclaw/plugin-sdk/channel-message`. De adapter beschrijft de native berichtlevenscyclus
die het platform ondersteunt:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

De kern beheert wachtrijen, duurzaamheid, generiek herhaalbeleid, hooks, ontvangstbewijzen en de
gedeelde `message`-tool. De plugin beheert native send/edit/delete-aanroepen, normalisatie van doelen,
platformthreading, geselecteerde citaten, notificatievlaggen, accountstatus en platformspecifieke neveneffecten.

Gebruik deze pagina samen met [Kanaalplugins bouwen](/nl/plugins/sdk-channel-plugins).

Het subpad `channel-message` is bewust licht genoeg voor hot plugin
bootstrapbestanden zoals `channel.ts`: het stelt adaptercontracten, capabilitybewijzen,
ontvangstbewijzen en compatibiliteitsfacades beschikbaar zonder uitgaande bezorging te laden.
Runtime-bezorghulpen zijn beschikbaar vanuit
`openclaw/plugin-sdk/channel-message-runtime` voor monitor/send-codepaden die
al asynchrone bericht-I/O uitvoeren.

## Minimale adapter

De meeste nieuwe kanaalplugins kunnen beginnen met een kleine adapter:

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

## Uitgaande brug

Als het kanaal al een compatibele `outbound`-adapter heeft, geef dan de voorkeur aan het afleiden van de
message-adapter in plaats van send-code te dupliceren:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

De brug zet oude uitgaande send-resultaten om naar `MessageReceipt`-waarden. Nieuwe
code moet ontvangstbewijzen end-to-end doorgeven en legacy-id's alleen afleiden aan compatibiliteitsranden
met `listMessageReceiptPlatformIds(...)` of
`resolveMessageReceiptPrimaryId(...)`.
Als er geen ontvangstbeleid wordt meegegeven, gebruikt `createChannelMessageAdapterFromOutbound(...)`
het `manual`-beleid voor ontvangstbevestiging. Dat maakt door de plugin beheerde platformbevestiging
expliciet zonder kanalen te veranderen die webhooks, sockets of polling-offsets buiten generieke
ontvangstcontext bevestigen.

## Message-tool-sends

Het gedeelde `message(action="send")`-pad moet dezelfde kernbeorglevenscyclus gebruiken
als definitieve antwoorden. Als een kanaal provider-specifieke vormgeving nodig heeft voor de
tool-send, implementeer dan `actions.prepareSendPayload(...)` in plaats van te senden vanuit
`actions.handleAction(...)`.

`prepareSendPayload(...)` ontvangt de genormaliseerde kern-`ReplyPayload` plus de
volledige actiecontext. Retourneer een payload met kanaalspecifieke data in
`payload.channelData.<channel>` en laat de kern `sendMessage(...)`,
`deliverOutboundPayloads(...)`, de write-ahead-wachtrij, message-sending-hooks,
herhalen, herstel en ack-opschoning aanroepen.

Retourneer alleen `null` wanneer de send niet als duurzame payload kan worden weergegeven, bijvoorbeeld
omdat deze een niet-serialiseerbare component factory bevat. De kern behoudt de legacy
plugin-actiefallback voor compatibiliteit, maar nieuwe kanaal-sendfuncties moeten als duurzame
payloaddata uitdrukbaar zijn.

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

De uitgaande adapter leest daarna `payload.channelData.demo` binnen `sendPayload`.
Dit houdt platformspecifieke rendering in de plugin, terwijl de kern nog steeds
persist, retry, recover, hooks en ack beheert.

Voorbereide `message(action="send")`-payloads en generieke definitieve-antwoordbezorging gebruiken
standaard kernbezorging met best-effort-wachtrijen. Vereiste duurzame wachtrijen zijn
alleen geldig nadat de kern verifieert dat het kanaal een send kan reconciliëren waarvan de uitkomst
na een crash onbekend is. Als de adapter `reconcileUnknownSend` niet kan implementeren,
houd het voorbereide send-pad dan best-effort; de kern probeert nog steeds de write-ahead-
wachtrij, maar wachtrijpersistentie of onzeker crashherstel maakt geen deel uit van het
vereiste bezorgcontract.

## Capabilities voor duurzame definitieve bezorging

Duurzame definitieve bezorging is opt-in per neveneffect. De kern gebruikt alleen generieke
duurzame bezorging wanneer de adapter elke capability declareert die nodig is voor de
payload en bezorgopties.

| Capability             | Declareer wanneer                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | De adapter tekst kan verzenden en een ontvangstbewijs kan retourneren.                |
| `media`                | Media-sends ontvangstbewijzen retourneren voor elk zichtbaar platformbericht.         |
| `payload`              | De adapter rijke antwoordpayloadsemantiek behoudt, niet alleen tekst en één media-URL. |
| `replyTo`              | Native antwoorddoelen het platform bereiken.                                         |
| `thread`               | Native thread-, topic- of kanaalthreaddoelen het platform bereiken.                   |
| `silent`               | Notificatieonderdrukking het platform bereikt.                                       |
| `nativeQuote`          | Metadata van geselecteerde citaten het platform bereikt.                             |
| `messageSendingHooks`  | Kern-message-sending-hooks content kunnen annuleren of herschrijven vóór platform-I/O. |
| `batch`                | Meerdelige gerenderde batches als één duurzaam plan opnieuw afspeelbaar zijn.         |
| `reconcileUnknownSend` | De adapter `unknown_after_send`-herstel kan oplossen zonder blind opnieuw afspelen.   |
| `afterSendSuccess`     | Kanaallokale after-send-neveneffecten één keer worden uitgevoerd.                    |
| `afterCommit`          | Kanaallokale after-commit-neveneffecten één keer worden uitgevoerd.                  |

Best-effort definitieve bezorging vereist geen `reconcileUnknownSend`; deze gebruikt de
gedeelde levenscyclus wanneer de adapter de zichtbare semantiek van de payload behoudt, en
valt terug op directe platform-I/O als wachtrijpersistentie niet beschikbaar is. Vereiste
duurzame definitieve bezorging moet expliciet `reconcileUnknownSend` vereisen. Als de
adapter niet kan bepalen of een gestarte/onbekende send het platform heeft bereikt,
declareer die capability dan niet; de kern weigert vereiste duurzame bezorging
vóór het in de wachtrij plaatsen.

Wanneer een caller duurzame bezorging nodig heeft, leid requirements dan af in plaats van
maps met de hand te bouwen:

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
alleen in voor een pad dat bewust geen globale message-sending-hooks kan uitvoeren.

## Duurzaam send-contract

Een duurzame definitieve send heeft strengere semantiek dan legacy kanaalbeheerde bezorging:

- Maak de duurzame intentie vóór platform-I/O.
- Als duurzame bezorging een afgehandeld resultaat retourneert, val dan niet terug op legacy send.
- Behandel hook-annulering en no-send-resultaten als terminaal.
- Behandel `unsupported` alleen als een pre-intent-resultaat.
- Voor vereiste duurzaamheid: faal vóór platform-I/O als de wachtrij niet kan vastleggen
  dat platform-send is gestart.
- Voor vereiste definitieve bezorging en vereiste voorbereide message-tool-sends:
  voer een preflight uit op `reconcileUnknownSend`; herstel moet een al verzonden bericht kunnen ack'en
  of alleen opnieuw afspelen nadat de adapter bewijst dat de oorspronkelijke send
  niet is gebeurd.
- Voor `best_effort` mogen schrijffouten in de wachtrij terugvallen op directe platform-I/O.
- Geef abortsignalen door aan media laden en platform-sends.
- Voer after-commit-hooks uit na wachtrij-ack; directe best-effortfallback voert ze uit
  na succesvolle platform-I/O omdat er geen duurzame wachtrijcommit is.
- Retourneer ontvangstbewijzen voor elke zichtbare platformbericht-id.
- Gebruik `reconcileUnknownSend` wanneer een platform kan controleren of een onzekere send
  de gebruiker al heeft bereikt.

Dit contract voorkomt dubbele sends na crashes en voorkomt het omzeilen van
annuleringshooks voor message-sending.

## Ontvangstbewijzen

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

Gebruik `createMessageReceiptFromOutboundResults(...)` wanneer je een bestaand
send-resultaat aanpast. Gebruik `createPreviewMessageReceipt(...)` wanneer een live preview-bericht
het definitieve ontvangstbewijs wordt. Vermijd het toevoegen van nieuwe eigenaar-lokale `messageIds`-velden.
Legacy `ChannelDeliveryResult.messageIds` wordt nog steeds geproduceerd aan compatibiliteitsranden.

## Live preview

Kanalen die conceptpreviews of voortgangsupdates streamen, moeten live
capabilities declareren:

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
`deliverWithFinalizableLivePreviewAdapter(...)` voor runtimefinalisatie. De
finalizer beslist of het definitieve antwoord de preview ter plekke bewerkt, een
normale fallback verzendt, hangende previewstatus weggooit, een ambigu mislukte bewerking behoudt
zonder het bericht te dupliceren, en het definitieve ontvangstbewijs retourneert.

## Receive-ack-beleid

Inkomende receivers die de timing van platformbevestiging beheren, moeten
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

Gebruik de standaardwaarde wanneer het platform geen acknowledgement heeft om uit te stellen, al acknowledget vóór asynchrone verwerking, of protocolspecifieke responssemantiek nodig heeft. Declareer een van de gefaseerde beleidsregels alleen wanneer de ontvanger daadwerkelijk ontvangcontext gebruikt om platform-acknowledgement naar later te verplaatsen.

Beleidsregels:

| Beleid                 | Gebruik wanneer                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `after_receive_record` | Het platform kan worden geacknowledged nadat de inkomende gebeurtenis is geparsed en vastgelegd. |
| `after_agent_dispatch` | Het platform moet wachten totdat de agent-dispatch is geaccepteerd.                              |
| `after_durable_send`   | Het platform moet wachten totdat de uiteindelijke levering een duurzame beslissing heeft.         |
| `manual`               | De Plugin is eigenaar van acknowledgement omdat platformsemantiek niet overeenkomt met een generieke fase. |

Gebruik `createMessageReceiveContext(...)` in ontvangers die ack-status uitstellen, en `shouldAckMessageAfterStage(...)` wanneer de ontvanger moet testen of een fase aan het geconfigureerde beleid heeft voldaan.

## Contracttests

Capability-declaraties maken deel uit van het Plugin-contract. Onderbouw ze met tests:

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

Voeg live- en ontvangstbewijs-suites toe wanneer de adapter die functies declareert. Een ontbrekend bewijs moet de test laten falen in plaats van het duurzame oppervlak stilzwijgend te verbreden.

## Verouderde compatibiliteits-API's

Deze API's blijven importeerbaar voor compatibiliteit met derden. Gebruik ze niet voor nieuwe kanaalcode.

| Verouderde API                               | Vervanging                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` voor compatibiliteitsdispatchers, of een `message`-adapter voor nieuwe kanaalcode |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` uit `openclaw/plugin-sdk/channel-message-runtime`                  |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` alleen voor compatibiliteitsdispatchers                                  |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` alleen voor compatibiliteitsdispatchers                                    |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

Compatibiliteitsdispatchers kunnen nog steeds `createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)` en `createTypingCallbacks(...)` gebruiken via de message-facade. Nieuwe lifecycle-code moet het oude subpad `channel-reply-pipeline` vermijden.

## Migratiechecklist

1. Voeg `message: defineChannelMessageAdapter(...)` of `message: createChannelMessageAdapterFromOutbound(...)` toe aan de kanaal-Plugin.
2. Retourneer `MessageReceipt` vanuit tekst-, media- en payload-verzendingen.
3. Declareer alleen capabilities die worden ondersteund door native gedrag en tests.
4. Vervang handgeschreven duurzame requirement-maps door `deriveDurableFinalDeliveryRequirements(...)`.
5. Verplaats preview-finalisatie via de live-previewhelpers wanneer het kanaal conceptberichten ter plekke bewerkt.
6. Declareer receive-ack-beleid alleen wanneer de ontvanger platform-acknowledgement echt kan uitstellen.
7. Houd legacy reply-dispatchhelpers alleen aan compatibiliteitsranden.
