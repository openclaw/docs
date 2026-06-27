---
read_when:
    - Sie erstellen oder refaktorieren den Sendepfad eines Messaging-Kanal-Plugins
    - Sie benötigen dauerhafte Zustellung der abschließenden Antwort, Empfangsbestätigungen, Finalisierung der Live-Vorschau oder eine Richtlinie für Empfangsbestätigungen
    - Sie migrieren von channel-message, channel-message-runtime oder veralteten Hilfsfunktionen für den Antwortversand
summary: 'API für den Lebenszyklus ausgehender Nachrichten für Kanal-Plugins: Adapter, Empfangsbestätigungen, persistente Sendevorgänge, Live-Vorschau und Hilfsfunktionen für die Antwort-Pipeline'
title: Channel-Ausgangs-API
x-i18n:
    generated_at: "2026-06-27T17:58:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Channel-Plugins sollten das Verhalten für ausgehende Nachrichten aus
`openclaw/plugin-sdk/channel-outbound` bereitstellen. Verwenden Sie
`openclaw/plugin-sdk/channel-inbound` für die Orchestrierung von Empfang/Kontext/Dispatch.

Core besitzt Queueing, Dauerhaftigkeit, generische Retry-Richtlinien, Hooks, Empfangsbestätigungen und das
gemeinsame `message`-Tool. Das Plugin besitzt native Send/Edit/Delete-Aufrufe, Zielnormalisierung, Plattform-Threading, ausgewählte Zitate, Benachrichtigungsflags, Kontostatus und plattformspezifische Seiteneffekte.

## Adapter

Die meisten Plugins definieren einen `message`-Adapter:

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

Deklarieren Sie nur Fähigkeiten, die der native Transport tatsächlich erhält. Decken Sie jede deklarierte Send-, Empfangsbestätigungs-, Live-Vorschau- und Receive-Ack-Fähigkeit mit den aus diesem Unterpfad exportierten Vertragshelfern ab.

## Vorhandene Outbound-Adapter

Wenn der Kanal bereits einen kompatiblen `outbound`-Adapter hat, leiten Sie den Message-Adapter ab, statt Sendecode zu duplizieren:

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

## Dauerhafte Sends

Runtime-Sendehelfer befinden sich ebenfalls in `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- Entwurfs-Streaming-/Fortschrittshelfer wie `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` gibt ein explizites Ergebnis zurück:

- `sent`: Mindestens eine sichtbare Plattformnachricht wurde zugestellt.
- `suppressed`: Keine Plattformnachricht sollte als fehlend behandelt werden.
- `partial_failed`: Mindestens eine Plattformnachricht wurde zugestellt, bevor eine spätere
  Payload oder ein Seiteneffekt fehlgeschlagen ist.
- `failed`: Es wurde keine Plattform-Empfangsbestätigung erzeugt.

Verwenden Sie `payloadOutcomes`, wenn ein Batch gesendete, unterdrückte und fehlgeschlagene Payloads mischt.
Leiten Sie Hook-Abbruch nicht aus einem leeren alten Direct-Delivery-Ergebnis ab.

## Kompatibilitäts-Dispatch

Inbound-Reply-Dispatch sollte über
`dispatchChannelInboundReply(...)` aus `channel-inbound` zusammengesetzt werden. Belassen Sie die Plattformzustellung im Delivery-Adapter; verwenden Sie `channel-outbound` für Message-Adapter, dauerhafte Sends, Empfangsbestätigungen, Live-Vorschau und Optionen für die Reply-Pipeline.
