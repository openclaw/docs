---
read_when:
    - Вы создаете или рефакторите путь приема Plugin канала сообщений
    - Вам нужно общее формирование входящего контекста, запись сеанса или подготовленная отправка ответа
    - Вы переносите старые вспомогательные функции ходов каналов на API входящих данных и сообщений
summary: 'Вспомогательные средства входящих событий для плагинов каналов: построение контекста, оркестрация общего runner, запись сеанса и подготовленная отправка ответа'
title: API входящих сообщений канала
x-i18n:
    generated_at: "2026-06-28T23:30:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Plugin каналов должны моделировать пути получения через существительные inbound и message:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Используйте `openclaw/plugin-sdk/channel-inbound` для нормализации входящих событий, форматирования, корней и оркестрации. Используйте
`openclaw/plugin-sdk/channel-outbound` для нативной
отправки, подтверждений получения, надежной доставки и поведения живого предпросмотра.

## Основные вспомогательные функции

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: проецирует нормализованные факты канала в
  контекст промпта/сессии. Используйте `channelContext`, чтобы передавать
  принадлежащие каналу метаданные отправителя/чата в хук Plugin `ctx.channelContext`; расширяйте
  `PluginHookChannelSenderContext` или `PluginHookChannelChatContext` из этого
  подпути для полей, специфичных для канала.
- `runChannelInboundEvent(...)`: выполняет прием, классификацию, предварительную проверку, разрешение,
  запись, dispatch и финализацию для одного входящего события платформы.
- `dispatchChannelInboundReply(...)`: записывает и отправляет уже собранный
  входящий ответ через адаптер доставки.

Внедренный рантайм Plugin предоставляет те же высокоуровневые вспомогательные функции в
`runtime.channel.inbound.*` для встроенных/нативных каналов, которые уже получают
объект рантайма.

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

Диспетчеры совместимости должны собирать входные данные `dispatchChannelInboundReply(...)`
и держать доставку платформы в адаптере доставки. Новые пути отправки должны
предпочитать адаптеры сообщений и вспомогательные функции надежных сообщений.

## Миграция

Старые псевдонимы рантайма `runtime.channel.turn.*` были удалены. Используйте:

- `runtime.channel.inbound.run(...)` для сырых входящих событий.
- `runtime.channel.inbound.dispatchReply(...)` для собранных контекстов ответа.
- `runtime.channel.inbound.buildContext(...)` для полезных нагрузок входящего контекста.
- `runtime.channel.inbound.runPreparedReply(...)` только для принадлежащих каналу подготовленных
  путей dispatch, которые уже собирают собственное замыкание dispatch.

Новый код Plugin не должен вводить API каналов с именем `turn`. Держите лексику model или
agent turn внутри кода агентов/провайдеров; Plugin каналов используют термины inbound,
message, delivery и reply.
