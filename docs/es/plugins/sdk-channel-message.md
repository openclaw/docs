---
summary: Redirigir a /plugins/sdk-channel-outbound
title: API de mensajes de canal
x-i18n:
    generated_at: "2026-07-05T11:31:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Esta página se movió a [API saliente de canal](/es/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` y
`openclaw/plugin-sdk/channel-message-runtime` siguen siendo subrutas de compatibilidad obsoletas
para plugins antiguos; ambas son alias ligeros sobre el núcleo compartido de
mensajes de canal. Los plugins de canal nuevos deben usar
`openclaw/plugin-sdk/channel-outbound` para el ciclo de vida de mensajes, recibos,
envío duradero y ayudantes de vista previa en vivo en lugar de agregar ayudantes nuevos a las
subrutas obsoletas.

Plan de eliminación: mantener estos alias durante la ventana de migración de plugins
externos y luego eliminarlos en la siguiente limpieza mayor del SDK después de que los llamadores se hayan
movido a `channel-outbound`.
