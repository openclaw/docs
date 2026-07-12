---
summary: Переспрямування на /plugins/sdk-channel-outbound
title: API повідомлень каналу
x-i18n:
    generated_at: "2026-07-12T13:38:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Цю сторінку переміщено до [API вихідних повідомлень каналів](/uk/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` і
`openclaw/plugin-sdk/channel-message-runtime` залишаються застарілими підшляхами
сумісності для старіших плагінів; обидва є тонкими псевдонімами спільного ядра
повідомлень каналів. Нові плагіни каналів мають використовувати
`openclaw/plugin-sdk/channel-outbound` для керування життєвим циклом повідомлень,
підтвердженнями отримання, надійним надсиланням і попереднім переглядом наживо
замість додавання нових допоміжних функцій до застарілих підшляхів.

План вилучення: зберігати ці псевдоніми протягом періоду міграції зовнішніх
плагінів, а потім вилучити їх під час наступного великого очищення SDK після
переходу викликачів на `channel-outbound`.
