---
summary: Redirigir a /plugins/sdk-channel-outbound
title: API de mensajes de canal
x-i18n:
    generated_at: "2026-07-11T23:26:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Esta página se trasladó a [API de salida de canales](/es/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` y
`openclaw/plugin-sdk/channel-message-runtime` siguen siendo subrutas de
compatibilidad obsoletas para plugins antiguos; ambas son alias ligeros del
núcleo compartido de mensajes de canales. Los nuevos plugins de canales deben
usar `openclaw/plugin-sdk/channel-outbound` para el ciclo de vida de los
mensajes, los acuses de recibo, el envío duradero y los auxiliares de vista
previa en vivo, en lugar de añadir nuevos auxiliares a las subrutas obsoletas.

Plan de eliminación: conservar estos alias durante el periodo de migración de
los plugins externos y eliminarlos después, en la siguiente limpieza mayor del
SDK, una vez que los consumidores hayan migrado a `channel-outbound`.
