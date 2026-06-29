---
summary: Перенаправление на /plugins/sdk-channel-outbound
title: API сообщений канала
x-i18n:
    generated_at: "2026-06-28T23:30:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Эта страница перемещена в [API исходящих сообщений канала](/ru/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` и
`openclaw/plugin-sdk/channel-message-runtime` остаются устаревшими подпутями
совместимости для старых плагинов. Новые плагины каналов должны использовать
`openclaw/plugin-sdk/channel-outbound` для жизненного цикла сообщений,
получения подтверждений, надежной отправки и вспомогательных функций
предпросмотра в реальном времени. Устаревшие подпути являются тонкими
алиасами над общим ядром сообщений канала и специализированными поверхностями
SDK для входящих и исходящих сообщений; не добавляйте туда новые
вспомогательные функции.

План удаления: сохранить эти алиасы на время окна миграции внешних плагинов,
а затем удалить их во время следующей крупной очистки SDK после того, как
вызывающий код перейдет на `channel-outbound`.
