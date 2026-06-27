---
read_when:
    - Você está criando ou refatorando um caminho de envio de Plugin de canal de mensagens
    - Você precisa de entrega durável da resposta final, confirmações de recebimento, finalização da pré-visualização ao vivo ou política de confirmação de recebimento
    - Você está migrando de channel-message, channel-message-runtime ou auxiliares legados de despacho de respostas
summary: 'API do ciclo de vida de mensagens de saída para plugins de canal: adaptadores, recibos, envios duráveis, prévia ao vivo e auxiliares do pipeline de respostas'
title: API de saída do canal
x-i18n:
    generated_at: "2026-06-27T17:58:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Plugins de canal devem expor o comportamento de mensagens de saída a partir de
`openclaw/plugin-sdk/channel-outbound`. Use
`openclaw/plugin-sdk/channel-inbound` para orquestração de recebimento/contexto/despacho.

O core é responsável por enfileiramento, durabilidade, política genérica de repetição, hooks, recibos e a
ferramenta `message` compartilhada. O Plugin é responsável por chamadas nativas de enviar/editar/excluir, normalização de destino, encadeamento da plataforma, citações selecionadas, sinalizadores de notificação, estado da conta e efeitos colaterais específicos da plataforma.

## Adaptador

A maioria dos Plugins define um adaptador `message`:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Declare apenas capacidades que o transporte nativo realmente preserva. Cubra cada
capacidade declarada de envio, recibo, pré-visualização ao vivo e confirmação de recebimento com os
helpers de contrato exportados deste subcaminho.

## Adaptadores de saída existentes

Se o canal já tiver um adaptador `outbound` compatível, derive o adaptador de mensagem em vez de duplicar o código de envio:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Envios duráveis

Helpers de envio em tempo de execução também ficam em `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helpers de streaming/progresso de rascunho, como `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` retorna um resultado explícito:

- `sent`: pelo menos uma mensagem visível da plataforma foi entregue.
- `suppressed`: nenhuma mensagem da plataforma deve ser tratada como ausente.
- `partial_failed`: pelo menos uma mensagem da plataforma foi entregue antes que um payload ou efeito colateral posterior falhasse.
- `failed`: nenhum recibo da plataforma foi produzido.

Use `payloadOutcomes` quando um lote mistura payloads enviados, suprimidos e com falha.
Não infira cancelamento de hook a partir de um resultado vazio de entrega direta legada.

## Despacho de compatibilidade

O despacho de resposta de entrada deve ser montado por meio de
`dispatchChannelInboundReply(...)` de `channel-inbound`. Mantenha a entrega da plataforma no adaptador de entrega; use `channel-outbound` para adaptadores de mensagem, envios duráveis, recibos, pré-visualização ao vivo e opções do pipeline de resposta.
