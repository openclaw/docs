---
read_when:
    - Você está criando ou refatorando o caminho de recebimento de um Plugin de canal de mensagens
    - Você precisa de construção de contexto de entrada compartilhado, registro de sessão ou envio de resposta preparada
    - Você está migrando auxiliares antigos de turnos de canal para APIs de entrada/mensagem
summary: 'Auxiliares de eventos de entrada para plugins de canal: criação de contexto, orquestração do executor compartilhado, registro de sessão e envio de respostas preparadas'
title: API de entrada do canal
x-i18n:
    generated_at: "2026-07-12T00:13:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Os caminhos de recebimento dos canais seguem um único fluxo:

```text
evento da plataforma -> fatos/contexto de entrada -> resposta do agente -> entrega da mensagem
```

Use `openclaw/plugin-sdk/channel-inbound` para normalização de eventos de entrada,
formatação, raízes e orquestração. Use
`openclaw/plugin-sdk/channel-outbound` para envio nativo, comprovante, entrega
durável e comportamento de visualização ao vivo.

## Auxiliares principais

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: projeta os fatos normalizados do canal
  no contexto do prompt/da sessão. Passe os metadados do remetente/chat pertencentes
  ao canal por meio de `channelContext`, que os hooks do plugin recebem como
  `ctx.channelContext`. Amplie `PluginHookChannelSenderContext` ou
  `PluginHookChannelChatContext` a partir deste subcaminho para campos específicos
  do canal.
- `runChannelInboundEvent(...)`: executa ingestão, classificação, pré-verificação,
  resolução, registro, encaminhamento e finalização para um evento de entrada da
  plataforma.
- `dispatchChannelInboundReply(...)`: registra e encaminha uma resposta de entrada
  já montada com um adaptador de entrega.

Os canais integrados/nativos que já recebem o objeto de runtime do plugin injetado
podem chamar os mesmos auxiliares em `runtime.channel.inbound.*`, em vez de
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

Monte as entradas de `dispatchChannelInboundReply(...)` para encaminhadores de
compatibilidade que mantêm a entrega da plataforma no adaptador de entrega. Novos
caminhos de envio devem usar adaptadores de mensagem e auxiliares de mensagens
duráveis de `channel-outbound`.

## Migração

Os aliases de runtime `runtime.channel.turn.*` foram removidos. Use:

- `runtime.channel.inbound.run(...)` para eventos de entrada brutos.
- `runtime.channel.inbound.dispatchReply(...)` para contextos de resposta montados.
- `runtime.channel.inbound.buildContext(...)` para cargas de contexto de entrada.
- `runtime.channel.inbound.runPreparedReply(...)`, descontinuado, somente para
  caminhos de encaminhamento preparado pertencentes ao canal que já montam seu
  próprio closure de encaminhamento.

O novo código de plugin não deve introduzir APIs de canal nomeadas com `turn`.
Mantenha o vocabulário de turno do modelo ou do agente no código do
agente/provedor; os plugins de canal usam os termos entrada, mensagem, entrega e
resposta.
