---
summary: Перенаправление на /plugins/sdk-channel-outbound
title: API сообщений канала
x-i18n:
    generated_at: "2026-07-12T11:44:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Эта страница перемещена в раздел [API исходящих сообщений каналов](/ru/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` и
`openclaw/plugin-sdk/channel-message-runtime` остаются устаревшими подмаршрутами
совместимости для старых плагинов; оба являются тонкими псевдонимами общего
ядра сообщений каналов. Новым плагинам каналов следует использовать
`openclaw/plugin-sdk/channel-outbound` для управления жизненным циклом сообщений,
подтверждениями получения, гарантированной отправкой и динамическим предпросмотром,
а не добавлять новые вспомогательные функции в устаревшие подмаршруты.

План удаления: сохранить эти псевдонимы на период миграции внешних плагинов,
а затем удалить их при следующей крупной очистке SDK после перехода вызывающего
кода на `channel-outbound`.
