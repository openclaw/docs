---
read_when:
    - Робота з реакціями в будь-якому каналі
    - Розуміння того, як реакції емодзі відрізняються між платформами
summary: Семантика інструмента реакцій у всіх підтримуваних каналах
title: Реакції
x-i18n:
    generated_at: "2026-06-27T18:28:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

Агент може додавати й видаляти реакції emoji на повідомленнях за допомогою інструмента `message` з дією `react`. Поведінка реакцій залежить від каналу й транспорту.

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
- Установіть `remove: true`, щоб видалити конкретний emoji (потрібен непорожній `emoji`).
- У каналах, що підтримують статусні реакції, `trackToolCalls: true` у реакції дає runtime змогу використовувати це повідомлення з реакцією для подальших реакцій перебігу виконання інструментів протягом того самого ходу.

## Поведінка каналів

<AccordionGroup>
  <Accordion title="Discord і Slack">
    - Порожній `emoji` видаляє всі реакції бота на повідомленні.
    - `remove: true` видаляє лише вказаний emoji.

  </Accordion>

  <Accordion title="Google Chat">
    - Порожній `emoji` видаляє реакції застосунку на повідомленні.
    - `remove: true` видаляє лише вказаний emoji.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Лише додавання реакцій: `emoji` є обов’язковим і має бути непорожнім.
    - Видалення реакцій поки не підтримується; виклики з `remove: true` (або порожнім `emoji`) відхиляються зі зрозумілою помилкою, а не мовчки нічого не роблять.
    - Потрібно, щоб бот Talk був зареєстрований із функцією `reaction` (див. [документацію каналу Nextcloud Talk](/uk/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Порожній `emoji` видаляє реакції бота.
    - `remove: true` також видаляє реакції, але все одно потребує непорожнього `emoji` для валідації інструмента.

  </Accordion>

  <Accordion title="WhatsApp">
    - Порожній `emoji` видаляє реакцію бота.
    - `remove: true` внутрішньо зіставляється з порожнім emoji (однаково потребує `emoji` у виклику інструмента).
    - WhatsApp має один слот реакції бота на повідомлення; оновлення статусних реакцій замінюють цей слот, а не накопичують кілька emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Потребує непорожнього `emoji`.
    - `remove: true` видаляє цю конкретну реакцію emoji.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Використовуйте інструмент `feishu_reaction` з діями `add`, `remove` і `list`.
    - Додавання/видалення потребує `emoji_type`; видалення також потребує `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Сповіщення про вхідні реакції контролюються `channels.signal.reactionNotifications`: `"off"` вимикає їх, `"own"` (типово) створює події, коли користувачі реагують на повідомлення бота, а `"all"` створює події для всіх реакцій.

  </Accordion>

  <Accordion title="iMessage">
    - Вихідні реакції є tapback в iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` і `question`).
    - Сповіщення про вхідні tapback контролюються `channels.imessage.reactionNotifications`: `"off"` вимикає їх, `"own"` (типово) створює події, коли користувачі реагують на повідомлення, написані ботом, а `"all"` створює події для всіх tapback від авторизованих відправників.

  </Accordion>
</AccordionGroup>

## Рівень реакцій

Поканальна конфігурація `reactionLevel` контролює, наскільки широко агент використовує реакції. Значення зазвичай: `off`, `ack`, `minimal` або `extensive`.

- [Telegram reactionLevel](/uk/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/uk/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Установіть `reactionLevel` для окремих каналів, щоб налаштувати, наскільки активно агент реагує на повідомлення на кожній платформі.

## Пов’язане

- [Надсилання агентом](/uk/tools/agent-send) — інструмент `message`, що містить `react`
- [Канали](/uk/channels) — конфігурація для окремих каналів
