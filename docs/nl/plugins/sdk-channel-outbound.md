---
read_when:
    - Je bouwt of refactort een verzendpad voor een messagingkanaal-Plugin
    - Je hebt duurzame levering van definitieve antwoorden, ontvangstbewijzen, afronding van livevoorbeelden of beleid voor ontvangstbevestiging nodig
    - Je migreert van channel-message, channel-message-runtime of verouderde helpers voor antwoorddispatch
summary: 'API voor de levenscyclus van uitgaande berichten voor kanaalplugins: adapters, ontvangstbewijzen, duurzame verzendingen, livevoorbeeld en helpers voor antwoordpijplijnen'
title: Uitgaande kanaal-API
x-i18n:
    generated_at: "2026-06-27T18:05:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Kanaalplugins moeten uitgaand berichtgedrag uit
`openclaw/plugin-sdk/channel-outbound` aanbieden. Gebruik
`openclaw/plugin-sdk/channel-inbound` voor orkestratie van ontvangen/context/dispatch.

De kern is eigenaar van wachtrijen, duurzaamheid, generiek retrybeleid, hooks, ontvangstbewijzen en de
gedeelde `message`-tool. De plugin is eigenaar van native aanroepen voor verzenden/bewerken/verwijderen, doelnormalisatie, platformthreading, geselecteerde citaten, notificatievlaggen, accountstatus en platformspecifieke neveneffecten.

## Adapter

De meeste plugins definiëren één `message`-adapter:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

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

Declareer alleen capabilities die het native transport daadwerkelijk behoudt. Dek elke
gedeclareerde capability voor verzenden, ontvangstbewijs, livevoorbeeld en ontvangstbevestiging af met de
contracthelpers die vanuit dit subpad worden geëxporteerd.

## Bestaande uitgaande adapters

Als het kanaal al een compatibele `outbound`-adapter heeft, leid dan de berichtadapter af
in plaats van verzendcode te dupliceren:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Duurzame verzendingen

Runtime-verzendhelpers staan ook op `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helpers voor conceptstreaming/voortgang, zoals `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` retourneert één expliciete uitkomst:

- `sent`: er is ten minste één zichtbaar platformbericht afgeleverd.
- `suppressed`: geen platformbericht moet als ontbrekend worden behandeld.
- `partial_failed`: er is ten minste één platformbericht afgeleverd voordat een latere
  payload of een later neveneffect mislukte.
- `failed`: er is geen platformontvangstbewijs geproduceerd.

Gebruik `payloadOutcomes` wanneer een batch verzonden, onderdrukte en mislukte payloads combineert.
Leid hookannulering niet af uit een leeg legacy direct-delivery-resultaat.

## Compatibiliteitsdispatch

Dispatch van inkomende antwoorden moet worden samengesteld via
`dispatchChannelInboundReply(...)` uit `channel-inbound`. Houd platformaflevering
in de afleveradapter; gebruik `channel-outbound` voor berichtadapters,
duurzame verzendingen, ontvangstbewijzen, live preview en opties voor de antwoordpipeline.
