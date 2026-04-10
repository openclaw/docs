---
read_when:
    - Робота з реакціями в будь-якому каналі
    - Розуміння того, як реакції з емодзі відрізняються на різних платформах
summary: Семантика інструмента реакцій у всіх підтримуваних каналах
title: Реакції
x-i18n:
    generated_at: "2026-04-10T20:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfac31b7f0effc89cc696e3cf34cd89503ccdbb28996723945025e4b6e159986
    source_path: tools/reactions.md
    workflow: 15
---

# Реакції

Агент може додавати й видаляти реакції з емодзі на повідомленнях за допомогою інструмента `message` з дією `react`. Поведінка реакцій залежить від каналу.

## Як це працює

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` є обов’язковим під час додавання реакції.
- Установіть `emoji` як порожній рядок (`""`), щоб видалити реакцію(ї) бота.
- Установіть `remove: true`, щоб видалити певне емодзі (потрібне непорожнє `emoji`).

## Поведінка в каналах

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Порожнє `emoji` видаляє всі реакції бота на повідомленні.
    - `remove: true` видаляє лише вказане емодзі.
  </Accordion>

  <Accordion title="Google Chat">
    - Порожнє `emoji` видаляє реакції застосунку на повідомленні.
    - `remove: true` видаляє лише вказане емодзі.
  </Accordion>

  <Accordion title="Telegram">
    - Порожнє `emoji` видаляє реакції бота.
    - `remove: true` також видаляє реакції, але для валідації інструмента все одно потрібне непорожнє `emoji`.
  </Accordion>

  <Accordion title="WhatsApp">
    - Порожнє `emoji` видаляє реакцію бота.
    - `remove: true` внутрішньо перетворюється на порожнє emoji (у виклику інструмента `emoji` усе одно потрібне).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Потрібне непорожнє `emoji`.
    - `remove: true` видаляє реакцію з цим конкретним емодзі.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Використовуйте інструмент `feishu_reaction` з діями `add`, `remove` і `list`.
    - Для додавання/видалення потрібен `emoji_type`; для видалення також потрібен `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Вхідні сповіщення про реакції керуються параметром `channels.signal.reactionNotifications`: `"off"` вимикає їх, `"own"` (типово) генерує події, коли користувачі реагують на повідомлення бота, а `"all"` генерує події для всіх реакцій.
  </Accordion>
</AccordionGroup>

## Рівень реакцій

Параметр `reactionLevel` для кожного каналу визначає, наскільки широко агент використовує реакції. Зазвичай доступні значення `off`, `ack`, `minimal` або `extensive`.

- [Telegram reactionLevel](/uk/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/uk/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Налаштуйте `reactionLevel` для окремих каналів, щоб визначити, наскільки активно агент реагує на повідомлення на кожній платформі.

## Пов’язане

- [Agent Send](/uk/tools/agent-send) — інструмент `message`, який містить `react`
- [Channels](/uk/channels) — конфігурація для конкретних каналів
