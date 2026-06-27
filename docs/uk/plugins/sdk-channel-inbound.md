---
read_when:
    - Ви створюєте або рефакторите шлях отримання Plugin каналу обміну повідомленнями
    - Вам потрібна спільна побудова вхідного контексту, запис сеансу або надсилання підготовленої відповіді
    - Ви мігруєте старі допоміжні засоби ходів каналу на API inbound/message
summary: 'Допоміжні засоби вхідних подій для канальних plugins: побудова контексту, оркестрація спільного runner, запис сесії та надсилання підготовленої відповіді'
title: API вхідних каналів
x-i18n:
    generated_at: "2026-06-27T18:03:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Канальні plugins мають моделювати шляхи отримання за допомогою іменників для вхідних даних і повідомлень:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Використовуйте `openclaw/plugin-sdk/channel-inbound` для нормалізації вхідних подій,
форматування, коренів і оркестрації. Використовуйте
`openclaw/plugin-sdk/channel-outbound` для нативного
надсилання, квитанцій, надійної доставки та поведінки оперативного попереднього перегляду.

## Основні допоміжні засоби

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: проєктує нормалізовані факти каналу в
  контекст підказки/сеансу. Використовуйте `channelContext`, щоб передавати
  метадані відправника/чату, якими володіє канал, до хука plugin `ctx.channelContext`; доповнюйте
  `PluginHookChannelSenderContext` або `PluginHookChannelChatContext` із цього
  підшляху полями, специфічними для каналу.
- `runChannelInboundEvent(...)`: виконує приймання, класифікацію, попередню перевірку, розв’язання,
  запис, диспетчеризацію та завершення для однієї вхідної події платформи.
- `dispatchChannelInboundReply(...)`: записує та диспетчеризує вже зібрану
  вхідну відповідь за допомогою адаптера доставки.

Інжектований runtime plugin надає ті самі високорівневі допоміжні засоби в
`runtime.channel.inbound.*` для вбудованих/нативних каналів, які вже отримують
об’єкт runtime.

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

Диспетчери сумісності мають збирати вхідні дані для `dispatchChannelInboundReply(...)`
і тримати доставку платформою в адаптері доставки. Нові шляхи надсилання мають
віддавати перевагу адаптерам повідомлень і допоміжним засобам надійних повідомлень.

## Міграція

Старі runtime-псевдоніми `runtime.channel.turn.*` видалено. Використовуйте:

- `runtime.channel.inbound.run(...)` для сирих вхідних подій.
- `runtime.channel.inbound.dispatchReply(...)` для зібраних контекстів відповіді.
- `runtime.channel.inbound.buildContext(...)` для корисних навантажень вхідного контексту.
- `runtime.channel.inbound.runPreparedReply(...)` лише для підготовлених
  шляхів диспетчеризації, якими володіє канал і які вже збирають власне замикання диспетчеризації.

Новий код plugin не має вводити канальні API з назвою `turn`. Зберігайте лексику
поворотів моделі або агента всередині коду агента/провайдера; канальні plugins використовують терміни
вхідних даних, повідомлень, доставки та відповіді.
