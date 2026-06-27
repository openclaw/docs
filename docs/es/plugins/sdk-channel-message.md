---
summary: Redirigir a /plugins/sdk-channel-outbound
title: API de mensajes de canal
x-i18n:
    generated_at: "2026-06-27T12:26:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Esta página se movió a [API de salida de canales](/es/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` y
`openclaw/plugin-sdk/channel-message-runtime` siguen siendo subrutas de compatibilidad obsoletas para plugins antiguos. Los plugins de canal nuevos deben usar `openclaw/plugin-sdk/channel-outbound` para el ciclo de vida de mensajes, recibos, envío durable y helpers de vista previa en vivo. Las subrutas obsoletas son alias ligeros sobre el núcleo compartido de mensajes de canal y las superficies enfocadas del SDK de entrada/salida; no agregues helpers nuevos allí.

Plan de eliminación: mantén estos alias durante la ventana de migración de plugins externos y luego elimínalos en la siguiente limpieza mayor del SDK después de que los llamadores se hayan movido a `channel-outbound`.
