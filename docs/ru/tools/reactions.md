---
read_when:
    - Работа с реакциями в любом канале
    - Как реакции с эмодзи различаются на разных платформах
summary: Семантика инструмента реакций во всех поддерживаемых каналах
title: Реакции
x-i18n:
    generated_at: "2026-07-13T20:22:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

Агент добавляет и удаляет реакции с эмодзи с помощью действия `react`
инструмента `message`. Поведение зависит от канала.

## Как это работает

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` обязателен при добавлении реакции.
- Задайте для `emoji` пустую строку (`""`), чтобы удалить реакции бота в
  каналах, которые поддерживают эту возможность.
- Задайте `remove: true`, чтобы удалить один конкретный эмодзи (требуется непустой
  `emoji`).
- В каналах с реакциями состояния параметр `trackToolCalls: true` у реакции позволяет
  среде выполнения повторно использовать сообщение с этой реакцией для последующих реакций,
  отображающих ход выполнения инструмента в рамках того же хода.

## Поведение каналов

<AccordionGroup>
  <Accordion title="Discord и Slack">
    - Пустой `emoji` удаляет все реакции бота с сообщения.
    - `remove: true` удаляет только указанный эмодзи.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Поддерживается только добавление реакций: `emoji` обязателен и не должен быть пустым.
    - Удаление реакций пока не связано с вызовом удаления; вместо бездействия без уведомления `remove: true` отклоняется с явной ошибкой.
    - Требуется бот Talk, зарегистрированный с функцией `reaction` (см. [документацию канала Nextcloud Talk](/ru/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Пустой `emoji` удаляет реакции бота.
    - `remove: true` также удаляет реакции, но для проверки вызова инструмента по-прежнему требуется непустой `emoji`.

  </Accordion>

  <Accordion title="WhatsApp">
    - Пустой `emoji` удаляет реакцию бота.
    - `remove: true` внутренне преобразуется в пустой эмодзи (при этом в вызове инструмента по-прежнему требуется `emoji`).
    - В WhatsApp для каждого сообщения предусмотрено одно место для реакции бота; новая реакция заменяет предыдущую, а не добавляет ещё один эмодзи.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Для добавления и удаления требуется непустой `emoji`.
    - `remove: true` удаляет указанную реакцию с эмодзи.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Использует то же действие `react`, что и другие каналы (добавление, удаление и получение списка по идентификаторам реакций на сообщение), а не отдельный инструмент.
    - Для добавления требуется непустой `emoji` (преобразуется в `emoji_type` Feishu, например `SMILE`, `THUMBSUP`, `HEART`).
    - Для `remove: true` требуется непустой `emoji`; удаляется собственная реакция бота, соответствующая этому типу эмодзи.
    - Пустой `emoji` вместе с `clearAll: true` удаляет все реакции бота с сообщения.

  </Accordion>

  <Accordion title="Signal">
    - Уведомления о входящих реакциях управляются параметром `channels.signal.reactionNotifications`: `"off"` отключает их, `"own"` (по умолчанию) создаёт события, когда пользователи реагируют на сообщения бота, `"all"` создаёт события для всех реакций, а `"allowlist"` — только для отправителей из `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - Исходящие реакции представляют собой быстрые реакции iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` и `question`); для добавления реакции `emoji` должен соответствовать одному из этих видов.
    - `remove: true` без распознанного вида быстрой реакции удаляет все их виды, а с распознанным видом — только его.

  </Accordion>
</AccordionGroup>

## Уровень реакций

Параметр `reactionLevel` для каждого канала ограничивает частоту отправки агентом собственных
реакций. Значения: `off`, `ack`, `minimal` или `extensive`.

- [Уведомления о реакциях в Telegram](/ru/channels/telegram#feature-reference) — `channels.telegram.reactionLevel` (по умолчанию `minimal`)
- [Уровень реакций в WhatsApp](/ru/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel` (по умолчанию `minimal`)
- [Реакции в Signal](/ru/channels/signal#reactions-message-tool) — `channels.signal.reactionLevel` (по умолчанию `minimal`)

## Связанные материалы

- [Отправка агентом](/ru/tools/agent-send) — инструмент `message`, включающий `react`
- [Каналы](/ru/channels) — конфигурация для отдельных каналов
