---
read_when:
    - Ви створюєте або рефакторите шлях надсилання Plugin каналу обміну повідомленнями
    - Вам потрібні надійна доставка фінальної відповіді, підтвердження, фіналізація живого попереднього перегляду або політика підтвердження отримання
    - Ви мігруєте з channel-message, channel-message-runtime або застарілих допоміжних засобів диспетчеризації відповідей
summary: 'API життєвого циклу вихідних повідомлень для канальних Plugin: адаптери, підтвердження отримання, надійні надсилання, попередній перегляд наживо та допоміжні засоби конвеєра відповідей'
title: Вихідний API каналу
x-i18n:
    generated_at: "2026-06-27T18:04:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Plugin-и каналів мають надавати поведінку вихідних повідомлень із
`openclaw/plugin-sdk/channel-outbound`. Використовуйте
`openclaw/plugin-sdk/channel-inbound` для оркестрації отримання/контексту/диспетчеризації.

Ядро відповідає за черги, стійкість, загальну політику повторних спроб, хуки, квитанції та
спільний інструмент `message`. Plugin відповідає за нативні виклики send/edit/delete, нормалізацію цілей, потоки платформи, вибрані цитати, прапорці сповіщень, стан облікового запису та побічні ефекти, специфічні для платформи.

## Адаптер

Більшість Plugin-ів визначають один адаптер `message`:

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

Оголошуйте лише ті можливості, які нативний транспорт справді зберігає. Покривайте кожну
оголошену можливість надсилання, квитанції, попереднього перегляду наживо та підтвердження отримання
контрактними допоміжними функціями, експортованими з цього підшляху.

## Наявні вихідні адаптери

Якщо канал уже має сумісний адаптер `outbound`, виведіть адаптер повідомлень
замість дублювання коду надсилання:

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

## Стійкі надсилання

Допоміжні функції надсилання runtime також містяться в `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- допоміжні функції потокового передавання чернеток/прогресу, як-от `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` повертає один явний результат:

- `sent`: доставлено принаймні одне видиме повідомлення платформи.
- `suppressed`: жодне повідомлення платформи не слід вважати відсутнім.
- `partial_failed`: принаймні одне повідомлення платформи було доставлено до того, як пізніше
  корисне навантаження або побічний ефект завершилися помилкою.
- `failed`: квитанцію платформи не створено.

Використовуйте `payloadOutcomes`, коли пакет змішує надіслані, приглушені та невдалі корисні навантаження.
Не виводьте скасування хука з порожнього застарілого результату прямої доставки.

## Диспетчеризація сумісності

Диспетчеризацію вхідних відповідей слід складати через
`dispatchChannelInboundReply(...)` із `channel-inbound`. Тримайте доставку платформи
в адаптері доставки; використовуйте `channel-outbound` для адаптерів повідомлень,
стійких надсилань, квитанцій, попереднього перегляду наживо та параметрів конвеєра відповідей.
