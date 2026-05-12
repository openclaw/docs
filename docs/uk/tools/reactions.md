---
read_when:
    - Робота з реакціями в будь-якому каналі
    - Розуміння того, як емодзі-реакції відрізняються на різних платформах
summary: Семантика інструмента реакцій у всіх підтримуваних каналах
title: Реакції
x-i18n:
    generated_at: "2026-05-12T01:01:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

Агент може додавати й видаляти реакції емодзі на повідомленнях за допомогою інструмента `message`
з дією `react`. Поведінка реакцій залежить від каналу й транспорту.

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
- Установіть `remove: true`, щоб видалити певний емодзі (потрібен непорожній `emoji`).
- У каналах, які підтримують статусні реакції, `trackToolCalls: true` на
  реакції дає середовищу виконання змогу використовувати це повідомлення з реакцією для подальших реакцій
  прогресу інструментів протягом того самого ходу.

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
    - `remove: true` також видаляє реакції, але все одно потребує непорожнього `emoji` для перевірки інструмента.

  </Accordion>

  <Accordion title="WhatsApp">
    - Порожній `emoji` видаляє реакцію бота.
    - `remove: true` внутрішньо зіставляється з порожнім емодзі (але все одно потребує `emoji` у виклику інструмента).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Потребує непорожнього `emoji`.
    - `remove: true` видаляє реакцію з цим конкретним емодзі.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Використовуйте інструмент `feishu_reaction` з діями `add`, `remove` і `list`.
    - Для додавання/видалення потрібен `emoji_type`; для видалення також потрібен `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Сповіщення про вхідні реакції контролюються параметром `channels.signal.reactionNotifications`: `"off"` вимикає їх, `"own"` (за замовчуванням) генерує події, коли користувачі реагують на повідомлення бота, а `"all"` генерує події для всіх реакцій.

  </Accordion>

  <Accordion title="iMessage">
    - Вихідні реакції є tapback-реакціями iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` і `question`).
    - Сповіщення про вхідні tapback-реакції контролюються параметром `channels.imessage.reactionNotifications`: `"off"` вимикає їх, `"own"` (за замовчуванням) генерує події, коли користувачі реагують на повідомлення, створені ботом, а `"all"` генерує події для всіх tapback-реакцій від авторизованих відправників.

  </Accordion>
</AccordionGroup>

## Рівень реакцій

Конфігурація `reactionLevel` для кожного каналу контролює, наскільки широко агент використовує реакції. Значення зазвичай такі: `off`, `ack`, `minimal` або `extensive`.

- [Telegram reactionLevel](/uk/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/uk/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Установіть `reactionLevel` для окремих каналів, щоб налаштувати, наскільки активно агент реагує на повідомлення на кожній платформі.

## Пов’язане

- [Agent Send](/uk/tools/agent-send) — інструмент `message`, який містить `react`
- [Канали](/uk/channels) — конфігурація для окремих каналів
