---
read_when:
    - Você está criando ou refatorando o fluxo de recebimento de um plugin de canal de mensagens
    - Você precisa de construção compartilhada de contexto de entrada, registro de sessão ou envio preparado de respostas
    - Você está migrando auxiliares antigos de turnos de canal para APIs de entrada/mensagens
summary: 'Helpers de eventos recebidos para plugins de canal: criação de contexto, orquestração do executor compartilhado, registro de sessão e envio de resposta preparada'
title: API de entrada do canal
x-i18n:
    generated_at: "2026-07-12T15:27:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Os caminhos de recebimento de canais seguem um único fluxo:

```text
evento da plataforma -> fatos/contexto de entrada -> resposta do agente -> entrega da mensagem
```

Use `openclaw/plugin-sdk/channel-inbound` para normalização de eventos de entrada,
formatação, raízes e orquestração. Use
`openclaw/plugin-sdk/channel-outbound` para envio nativo, confirmação, entrega
durável e comportamento de visualização ao vivo.

## Helpers principais

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: projeta fatos normalizados do canal
  no contexto do prompt/da sessão. Passe os metadados de remetente/chat pertencentes
  ao canal por meio de `channelContext`, que os hooks do plugin recebem como `ctx.channelContext`.
  Amplie `PluginHookChannelSenderContext` ou `PluginHookChannelChatContext`
  a partir deste subcaminho para campos específicos do canal.
- `runChannelInboundEvent(...)`: executa ingestão, classificação, pré-verificação, resolução,
  registro, despacho e finalização para um evento de entrada da plataforma.
- `dispatchChannelInboundReply(...)`: registra e despacha uma resposta de entrada já
  montada com um adaptador de entrega.

Canais nativos/incluídos que já recebem o objeto de runtime do plugin injetado
podem chamar os mesmos helpers em `runtime.channel.inbound.*`, em vez de
importar este subcaminho diretamente:

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

Monte as entradas de `dispatchChannelInboundReply(...)` para despachantes de
compatibilidade que mantêm a entrega da plataforma no adaptador de entrega. Novos caminhos
de envio devem usar adaptadores de mensagem e helpers de mensagens duráveis de
`channel-outbound`.

## Migração

Os aliases de runtime `runtime.channel.turn.*` foram removidos. Use:

- `runtime.channel.inbound.run(...)` para eventos brutos de entrada.
- `runtime.channel.inbound.dispatchReply(...)` para contextos de resposta montados.
- `runtime.channel.inbound.buildContext(...)` para payloads de contexto de entrada.
- `runtime.channel.inbound.runPreparedReply(...)`, obsoleto, somente para
  caminhos de despacho preparado pertencentes ao canal que já montam seu próprio
  closure de despacho.

O novo código de plugin não deve introduzir APIs de canal nomeadas com `turn`. Mantenha o
vocabulário de turno do modelo ou do agente dentro do código do agente/provedor; plugins
de canal usam termos de entrada, mensagem, entrega e resposta.
