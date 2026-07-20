---
summary: Redirigir a /plugins/sdk-channel-outbound
title: API de mensajes de canal
x-i18n:
    generated_at: "2026-07-20T00:52:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bf0d607bd3287233cbb1fe47c15958bf57a81267ae1e37e45a1881f56e1370cb
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Esta página se trasladó a [API de salida de canales](/es/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` sigue siendo una subruta de compatibilidad obsoleta
para plugins antiguos. Los nuevos plugins de canal deben usar
`openclaw/plugin-sdk/channel-outbound` para el ciclo de vida de los mensajes, la confirmación de recepción,
el envío duradero y las utilidades de vista previa en tiempo real, en lugar de añadir nuevas utilidades a la
subruta obsoleta.

Plan de eliminación: mantener estos alias durante el período de migración de plugins
externos y, después, eliminarlos en la próxima limpieza principal del SDK, una vez que los consumidores se hayan
trasladado a `channel-outbound`.
