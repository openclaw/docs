---
summary: Redirecionar para /plugins/sdk-channel-outbound
title: API de mensagens de canal
x-i18n:
    generated_at: "2026-06-27T17:57:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Esta página foi movida para [API de saída de canais](/pt-BR/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` e
`openclaw/plugin-sdk/channel-message-runtime` permanecem como subcaminhos de compatibilidade obsoletos para plugins mais antigos. Novos plugins de canal devem usar
`openclaw/plugin-sdk/channel-outbound` para ciclo de vida de mensagens, recibo, envio durável e auxiliares de pré-visualização ao vivo. Os subcaminhos obsoletos são aliases finos sobre o núcleo compartilhado de mensagens de canal e as superfícies focadas do SDK de entrada/saída; não adicione novos auxiliares ali.

Plano de remoção: manter esses aliases durante a janela de migração de plugins externos e depois removê-los na próxima limpeza principal do SDK, após os chamadores terem migrado para
`channel-outbound`.
