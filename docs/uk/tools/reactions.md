---
read_when:
    - Робота з реакціями в будь-якому каналі
    - Розуміння того, як реакції емодзі відрізняються на різних платформах
summary: Семантика інструмента реакцій в усіх підтримуваних каналах
title: Реакції
x-i18n:
    generated_at: "2026-05-03T16:59:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

Агент може додавати й видаляти реакції-емодзі на повідомленнях за допомогою інструмента `message` з дією `react`. Поведінка реакцій залежить від каналу й транспорту.

## Як це працює

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` обов’язковий під час додавання реакції.
- Установіть `emoji` як порожній рядок (`""`), щоб видалити реакцію(ї) бота.
- Установіть `remove: true`, щоб видалити конкретний емодзі (потрібен непорожній `emoji`).
- На каналах, які підтримують статусні реакції, `trackToolCalls: true` у реакції дає змогу runtime використовувати це повідомлення з реакцією для подальших реакцій перебігу інструментів у межах того самого ходу.

## Поведінка каналів

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Порожній `emoji` видаляє всі реакції бота на повідомленні.
    - `remove: true` видаляє лише вказаний емодзі.

  </Accordion>

  <Accordion title="Google Chat">
    - Порожній `emoji` видаляє реакції застосунку на повідомленні.
    - `remove: true` видаляє лише вказаний емодзі.

  </Accordion>

  <Accordion title="Telegram">
    - Порожній `emoji` видаляє реакції бота.
    - `remove: true` також видаляє реакції, але все одно потребує непорожнього `emoji` для валідації інструмента.

  </Accordion>

  <Accordion title="WhatsApp">
    - Порожній `emoji` видаляє реакцію бота.
    - `remove: true` внутрішньо зіставляється з порожнім емодзі (але все одно потребує `emoji` у виклику інструмента).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Потрібен непорожній `emoji`.
    - `remove: true` видаляє реакцію саме з цим емодзі.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Використовуйте інструмент `feishu_reaction` з діями `add`, `remove` і `list`.
    - Для додавання/видалення потрібен `emoji_type`; для видалення також потрібен `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Сповіщення про вхідні реакції контролюються через `channels.signal.reactionNotifications`: `"off"` вимикає їх, `"own"` (типово) створює події, коли користувачі реагують на повідомлення бота, а `"all"` створює події для всіх реакцій.

  </Accordion>
</AccordionGroup>

## Рівень реакцій

Конфігурація `reactionLevel` для кожного каналу керує тим, наскільки широко агент використовує реакції. Значення зазвичай такі: `off`, `ack`, `minimal` або `extensive`.

- [Telegram reactionLevel](/uk/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/uk/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Установіть `reactionLevel` для окремих каналів, щоб налаштувати, наскільки активно агент реагує на повідомлення на кожній платформі.

## Пов’язане

- [Agent Send](/uk/tools/agent-send) — інструмент `message`, який включає `react`
- [Канали](/uk/channels) — конфігурація для окремих каналів
