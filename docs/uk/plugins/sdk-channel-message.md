---
summary: Переспрямування до /plugins/sdk-channel-outbound
title: API повідомлень каналів
x-i18n:
    generated_at: "2026-06-27T18:03:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Цю сторінку переміщено до [API вихідних повідомлень каналу](/uk/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` і
`openclaw/plugin-sdk/channel-message-runtime` залишаються застарілими підшляхами
сумісності для старіших плагінів. Нові плагіни каналів мають використовувати
`openclaw/plugin-sdk/channel-outbound` для життєвого циклу повідомлень, квитанцій,
надійного надсилання та допоміжних засобів попереднього перегляду наживо. Застарілі підшляхи є тонкими псевдонімами над
спільним ядром повідомлень каналів і сфокусованими вхідними/вихідними поверхнями SDK;
не додавайте туди нові допоміжні засоби.

План видалення: зберігати ці псевдоніми протягом періоду міграції зовнішніх плагінів,
а потім видалити їх під час наступного великого очищення SDK після того, як виклики буде перенесено на
`channel-outbound`.
