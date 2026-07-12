---
summary: Redirecionar para /plugins/sdk-channel-outbound
title: API de mensagens do canal
x-i18n:
    generated_at: "2026-07-12T15:33:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Esta página foi movida para [API de saída de canais](/pt-BR/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` e
`openclaw/plugin-sdk/channel-message-runtime` permanecem como subcaminhos de
compatibilidade obsoletos para plugins mais antigos; ambos são aliases simples
do núcleo compartilhado de mensagens de canais. Novos plugins de canal devem
usar `openclaw/plugin-sdk/channel-outbound` para auxiliares de ciclo de vida de
mensagens, confirmação de recebimento, envio durável e pré-visualização ao vivo,
em vez de adicionar novos auxiliares aos subcaminhos obsoletos.

Plano de remoção: manter esses aliases durante a janela de migração de plugins
externos e removê-los na próxima grande limpeza do SDK, depois que os chamadores
tiverem migrado para `channel-outbound`.
