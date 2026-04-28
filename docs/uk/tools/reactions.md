---
read_when:
    - Робота з реакціями в будь-якому каналі
    - Розуміння того, як реакції емодзі відрізняються на різних платформах
summary: Семантика інструмента реакцій у всіх підтримуваних каналах
title: Реакції
x-i18n:
    generated_at: "2026-04-28T11:28:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

Агент може додавати й видаляти емодзі-реакції на повідомлення за допомогою інструмента `message` з дією `react`. Поведінка реакцій залежить від каналу й транспорту.

## Як це працює

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` обов’язковий під час додавання реакції.
- Задайте для `emoji` порожній рядок (`""`), щоб видалити реакцію(ї) бота.
- Задайте `remove: true`, щоб видалити конкретний емодзі (потрібен непорожній `emoji`).

## Поведінка каналу

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
    - `remove: true` внутрішньо зіставляється з порожнім емодзі (усе одно потребує `emoji` у виклику інструмента).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Потрібен непорожній `emoji`.
    - `remove: true` видаляє саме цю емодзі-реакцію.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Використовуйте інструмент `feishu_reaction` з діями `add`, `remove` і `list`.
    - Додавання/видалення потребує `emoji_type`; видалення також потребує `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Сповіщення про вхідні реакції контролюються через `channels.signal.reactionNotifications`: `"off"` вимикає їх, `"own"` (за замовчуванням) створює події, коли користувачі реагують на повідомлення бота, а `"all"` створює події для всіх реакцій.

  </Accordion>
</AccordionGroup>

## Рівень реакцій

Конфігурація `reactionLevel` для кожного каналу керує тим, наскільки широко агент використовує реакції. Значення зазвичай: `off`, `ack`, `minimal` або `extensive`.

- [Telegram reactionLevel](/uk/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/uk/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Задайте `reactionLevel` для окремих каналів, щоб налаштувати, наскільки активно агент реагує на повідомлення на кожній платформі.

## Пов’язане

- [Надсилання агентом](/uk/tools/agent-send) — інструмент `message`, який містить `react`
- [Канали](/uk/channels) — конфігурація для окремих каналів
