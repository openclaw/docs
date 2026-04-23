---
read_when:
    - Робота з реакціями в будь-якому каналі
    - Розуміння того, як emoji-реакції відрізняються між платформами
summary: Семантика інструмента reaction у всіх підтримуваних каналах
title: Реакції
x-i18n:
    generated_at: "2026-04-23T21:16:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

Агент може додавати й видаляти emoji-реакції на повідомлення за допомогою інструмента `message`
з дією `react`. Поведінка реакцій відрізняється залежно від каналу.

## Як це працює

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` є обов’язковим при додаванні реакції.
- Задайте `emoji` як порожній рядок (`""`), щоб видалити реакцію(ї) бота.
- Задайте `remove: true`, щоб видалити конкретне emoji (потребує непорожнього `emoji`).

## Поведінка в каналах

<AccordionGroup>
  <Accordion title="Discord і Slack">
    - Порожній `emoji` видаляє всі реакції бота на повідомлення.
    - `remove: true` видаляє лише вказане emoji.
  </Accordion>

  <Accordion title="Google Chat">
    - Порожній `emoji` видаляє реакції застосунку на повідомлення.
    - `remove: true` видаляє лише вказане emoji.
  </Accordion>

  <Accordion title="Telegram">
    - Порожній `emoji` видаляє реакції бота.
    - `remove: true` також видаляє реакції, але все одно потребує непорожнього `emoji` для валідації інструмента.
  </Accordion>

  <Accordion title="WhatsApp">
    - Порожній `emoji` видаляє реакцію бота.
    - `remove: true` внутрішньо мапиться на порожнє emoji (але все одно потребує `emoji` у виклику інструмента).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Потребує непорожнього `emoji`.
    - `remove: true` видаляє реакцію саме з цим emoji.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Використовуйте інструмент `feishu_reaction` з діями `add`, `remove` і `list`.
    - Add/remove потребує `emoji_type`; remove також потребує `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Вхідні сповіщення про реакції контролюються через `channels.signal.reactionNotifications`: `"off"` вимикає їх, `"own"` (типово) генерує події, коли користувачі реагують на повідомлення бота, а `"all"` генерує події для всіх реакцій.
  </Accordion>
</AccordionGroup>

## Рівень реакцій

Конфігурація `reactionLevel` для кожного каналу визначає, наскільки широко агент використовує реакції. Типові значення: `off`, `ack`, `minimal` або `extensive`.

- [Telegram reactionLevel](/uk/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/uk/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Задавайте `reactionLevel` для окремих каналів, щоб налаштувати, наскільки активно агент реагує на повідомлення на кожній платформі.

## Пов’язане

- [Agent Send](/uk/tools/agent-send) — інструмент `message`, який включає `react`
- [Channels](/uk/channels) — конфігурація, специфічна для каналів
