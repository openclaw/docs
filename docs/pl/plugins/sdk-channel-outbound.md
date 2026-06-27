---
read_when:
    - Budujesz lub refaktoryzujesz ścieżkę wysyłania Pluginu kanału komunikacyjnego
    - Potrzebujesz trwałego dostarczania odpowiedzi końcowych, potwierdzeń, finalizacji podglądu na żywo lub zasad potwierdzania odbioru
    - Migrujesz z channel-message, channel-message-runtime lub starszych pomocniczych funkcji wysyłania odpowiedzi
summary: 'API cyklu życia wiadomości wychodzących dla pluginów kanałów: adaptery, potwierdzenia, trwałe wysyłki, podgląd na żywo i pomocnicze funkcje potoku odpowiedzi'
title: API wychodzące kanału
x-i18n:
    generated_at: "2026-06-27T18:05:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Pluginy kanałów powinny udostępniać zachowanie wiadomości wychodzących z
`openclaw/plugin-sdk/channel-outbound`. Użyj
`openclaw/plugin-sdk/channel-inbound` do orkiestracji odbierania, kontekstu i przekazywania.

Core odpowiada za kolejkowanie, trwałość, ogólną politykę ponawiania, hooki, potwierdzenia odbioru oraz
wspólne narzędzie `message`. Plugin odpowiada za natywne wywołania send/edit/delete, normalizację celu,
wątki platformy, wybrane cytaty, flagi powiadomień, stan konta oraz skutki uboczne specyficzne dla platformy.

## Adapter

Większość Pluginów definiuje jeden adapter `message`:

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

Deklaruj tylko możliwości, które natywny transport faktycznie zachowuje. Obejmij każdą
zadeklarowaną możliwość wysyłania, potwierdzeń odbioru, podglądu na żywo i potwierdzeń odebrania
pomocnikami kontraktu eksportowanymi z tej podścieżki.

## Istniejące adaptery wychodzące

Jeśli kanał ma już zgodny adapter `outbound`, wyprowadź z niego adapter wiadomości
zamiast duplikować kod wysyłania:

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

## Trwałe wysyłanie

Pomocniki wysyłania runtime również znajdują się w `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- pomocniki strumieniowania/postępu wersji roboczej, takie jak `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` zwraca jeden jawny wynik:

- `sent`: dostarczono co najmniej jedną widoczną wiadomość platformy.
- `suppressed`: żadna wiadomość platformy nie powinna być traktowana jako brakująca.
- `partial_failed`: dostarczono co najmniej jedną wiadomość platformy, zanim późniejszy
  payload lub skutek uboczny zakończył się niepowodzeniem.
- `failed`: nie utworzono żadnego potwierdzenia odbioru platformy.

Użyj `payloadOutcomes`, gdy partia miesza payloady wysłane, pominięte i nieudane.
Nie wnioskuj anulowania hooka z pustego wyniku starszego bezpośredniego dostarczania.

## Przekazywanie zgodnościowe

Przekazywanie odpowiedzi przychodzących powinno być składane przez
`dispatchChannelInboundReply(...)` z `channel-inbound`. Zachowaj dostarczanie platformowe
w adapterze dostarczania; używaj `channel-outbound` do adapterów wiadomości,
trwałego wysyłania, potwierdzeń odbioru, podglądu na żywo i opcji potoku odpowiedzi.
