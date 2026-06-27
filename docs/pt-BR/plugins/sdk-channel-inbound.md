---
read_when:
    - Você está criando ou refatorando um caminho de recebimento de Plugin de canal de mensagens
    - Você precisa de construção de contexto de entrada compartilhado, gravação de sessão ou despacho de resposta preparada
    - Você está migrando ajudantes antigos de turnos de canal para APIs de entrada/mensagem
summary: 'Auxiliares de eventos de entrada para plugins de canal: criação de contexto, orquestração de executor compartilhado, registro de sessão e envio de resposta preparada'
title: API de entrada de canais
x-i18n:
    generated_at: "2026-06-27T17:57:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Plugins de canal devem modelar caminhos de recebimento com substantivos inbound e message:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Use `openclaw/plugin-sdk/channel-inbound` para normalização de eventos inbound,
formatação, roots e orquestração. Use
`openclaw/plugin-sdk/channel-outbound` para comportamento de envio nativo,
recibo, entrega durável e pré-visualização ao vivo.

## Auxiliares principais

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: projeta fatos normalizados do canal no
  contexto de prompt/sessão. Use `channelContext` para repassar metadados de
  remetente/chat pertencentes ao canal para o hook de Plugin `ctx.channelContext`; amplie
  `PluginHookChannelSenderContext` ou `PluginHookChannelChatContext` deste
  subcaminho para campos específicos do canal.
- `runChannelInboundEvent(...)`: executa ingestão, classificação, preflight,
  resolução, registro, despacho e finalização para um evento inbound da plataforma.
- `dispatchChannelInboundReply(...)`: registra e despacha uma resposta inbound já
  montada com um adaptador de entrega.

O runtime de Plugin injetado expõe os mesmos auxiliares de alto nível em
`runtime.channel.inbound.*` para canais integrados/nativos que já recebem o
objeto de runtime.

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

Dispatchers de compatibilidade devem montar as entradas de `dispatchChannelInboundReply(...)`
e manter a entrega da plataforma no adaptador de entrega. Novos caminhos de envio devem
preferir adaptadores de mensagem e auxiliares de mensagem durável.

## Migração

Os aliases antigos de runtime `runtime.channel.turn.*` foram removidos. Use:

- `runtime.channel.inbound.run(...)` para eventos inbound brutos.
- `runtime.channel.inbound.dispatchReply(...)` para contextos de resposta montados.
- `runtime.channel.inbound.buildContext(...)` para payloads de contexto inbound.
- `runtime.channel.inbound.runPreparedReply(...)` apenas para caminhos de despacho
  preparado pertencentes ao canal que já montam seu próprio closure de despacho.

Novo código de Plugin não deve introduzir APIs de canal nomeadas com `turn`. Mantenha o vocabulário
de turn de modelo ou agente dentro do código de agente/provedor; Plugins de canal usam termos
inbound, message, delivery e reply.
