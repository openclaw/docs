---
read_when:
    - Você está criando ou refatorando um Plugin de canal de mensagens
    - Você precisa de entrega durável da resposta final, recibos, finalização da prévia ao vivo ou política de confirmação de recebimento
    - Você está migrando do pipeline de respostas legado ou dos auxiliares de despacho de respostas de entrada
summary: API de ciclo de vida de mensagens para Plugins de canais, incluindo envios duráveis, recibos, pré-visualização ao vivo, política de confirmação de recebimento e migração legada
title: API de mensagens de canal
x-i18n:
    generated_at: "2026-05-06T09:07:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Plugins de canal devem expor um adapter `message` de
`openclaw/plugin-sdk/channel-message`. O adapter descreve o ciclo de vida da mensagem nativa
compatível com a plataforma:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

O core é responsável por enfileiramento, durabilidade, política genérica de nova tentativa, hooks, recibos e pela
ferramenta `message` compartilhada. O plugin é responsável por chamadas nativas de send/edit/delete, normalização de destino, encadeamento da plataforma, citações selecionadas, flags de notificação, estado da conta e efeitos colaterais específicos da plataforma.

Use esta página junto com [Criando plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

O subcaminho `channel-message` é intencionalmente leve o bastante para arquivos de bootstrap de plugin ativos, como `channel.ts`: ele expõe contratos de adapter, provas de capacidade, recibos e fachadas de compatibilidade sem carregar entrega de saída.
Helpers de entrega em runtime estão disponíveis em
`openclaw/plugin-sdk/channel-message-runtime` para caminhos de código de monitor/send que
já fazem I/O assíncrono de mensagens.

## Adapter mínimo

A maioria dos novos plugins de canal pode começar com um adapter pequeno:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

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

Depois, anexe-o ao plugin de canal:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Declare somente capacidades que o adapter realmente preserva. Toda capacidade declarada
deve ter um teste de contrato.

## Ponte de saída

Se o canal já tiver um adapter `outbound` compatível, prefira derivar o
adapter de mensagem em vez de duplicar o código de envio:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

A ponte converte resultados de envio de saída antigos em valores `MessageReceipt`. Código novo
deve passar recibos de ponta a ponta e só derivar ids legados nas bordas de compatibilidade
com `listMessageReceiptPlatformIds(...)` ou
`resolveMessageReceiptPrimaryId(...)`.
Se nenhuma política de recebimento for fornecida, `createChannelMessageAdapterFromOutbound(...)`
usa a política de confirmação de recebimento `manual`. Isso torna a confirmação de plataforma
pertencente ao plugin explícita sem alterar canais que confirmam webhooks,
sockets ou offsets de polling fora do contexto genérico de recebimento.

## Envios da ferramenta message

O caminho `message(action="send")` compartilhado deve usar o mesmo ciclo de vida de entrega do core que as respostas finais. Se um canal precisar de formatação específica de provedor para o envio da ferramenta, implemente `actions.prepareSendPayload(...)` em vez de enviar a partir de
`actions.handleAction(...)`.

`prepareSendPayload(...)` recebe o `ReplyPayload` normalizado pelo core mais o
contexto completo da ação. Retorne um payload com dados específicos do canal em
`payload.channelData.<channel>` e deixe o core chamar `sendMessage(...)`,
`deliverOutboundPayloads(...)`, a fila write-ahead, hooks de envio de mensagem,
nova tentativa, recuperação e limpeza de ack.

Retorne `null` somente quando o envio não puder ser representado como um payload durável, por
exemplo porque contém uma factory de componente não serializável. O core manterá
o fallback de ação de plugin legado para compatibilidade, mas novos recursos de envio de canal
devem ser expressáveis como dados de payload duráveis.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

O adapter de saída então lê `payload.channelData.demo` dentro de `sendPayload`.
Isso mantém a renderização específica da plataforma no plugin enquanto o core continua responsável por
persistência, nova tentativa, recuperação, hooks e ack.

Payloads preparados de `message(action="send")` e entrega genérica de resposta final usam
entrega do core com enfileiramento de melhor esforço por padrão. Enfileiramento durável obrigatório
só é válido depois que o core verifica que o canal consegue reconciliar um envio cujo resultado é
desconhecido após uma falha. Se o adapter não puder implementar `reconcileUnknownSend`,
mantenha o caminho de envio preparado como melhor esforço; o core ainda tentará a fila write-ahead,
mas persistência de fila ou recuperação incerta de falha não fazem parte do
contrato de entrega obrigatório.

## Capacidades finais duráveis

A entrega final durável é opt-in por efeito colateral. O core só usará entrega
durável genérica quando o adapter declarar todas as capacidades necessárias pelo
payload e pelas opções de entrega.

| Capacidade             | Declare quando                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | O adapter consegue enviar texto e retornar um recibo.                                      |
| `media`                | Envios de mídia retornam recibos para cada mensagem visível da plataforma.                      |
| `payload`              | O adapter preserva a semântica de payload de resposta rica, não apenas texto e uma URL de mídia. |
| `replyTo`              | Destinos de resposta nativos chegam à plataforma.                                             |
| `thread`               | Destinos nativos de thread, tópico ou thread de canal chegam à plataforma.                  |
| `silent`               | Supressão de notificação chega à plataforma.                                       |
| `nativeQuote`          | Metadados de citação selecionada chegam à plataforma.                                        |
| `messageSendingHooks`  | Hooks de envio de mensagem do core podem cancelar ou reescrever conteúdo antes do I/O da plataforma.        |
| `batch`                | Lotes renderizados em múltiplas partes podem ser reproduzidos como um único plano durável.                      |
| `reconcileUnknownSend` | O adapter consegue resolver a recuperação `unknown_after_send` sem repetição cega.          |
| `afterSendSuccess`     | Efeitos colaterais locais do canal após envio executam uma vez.                                      |
| `afterCommit`          | Efeitos colaterais locais do canal após commit executam uma vez.                                    |

Entrega final de melhor esforço não exige `reconcileUnknownSend`; ela usa o
ciclo de vida compartilhado quando o adapter preserva a semântica visível do payload e
recorre ao I/O direto da plataforma se a persistência de fila não estiver disponível. Entrega
final durável obrigatória deve exigir explicitamente `reconcileUnknownSend`. Se o
adapter não puder determinar se um envio iniciado/desconhecido chegou à plataforma,
não declare essa capacidade; o core rejeitará a entrega durável obrigatória
antes do enfileiramento.

Quando um chamador precisar de entrega durável, derive os requisitos em vez de criar
mapas manualmente:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` é obrigatório por padrão. Defina `messageSendingHooks: false`
somente para um caminho que intencionalmente não pode executar hooks globais de envio de mensagem.

## Contrato de envio durável

Um envio final durável tem semântica mais rígida do que a entrega legada pertencente ao canal:

- Crie a intenção durável antes do I/O da plataforma.
- Se a entrega durável retornar um resultado tratado, não recorra ao envio legado.
- Trate cancelamento por hook e resultados sem envio como terminais.
- Trate `unsupported` como resultado pré-intenção somente.
- Para durabilidade obrigatória, falhe antes do I/O da plataforma se a fila não puder registrar
  que o envio da plataforma começou.
- Para entrega final obrigatória e envios preparados obrigatórios da ferramenta de mensagem,
  faça preflight de `reconcileUnknownSend`; a recuperação deve conseguir confirmar com ack uma
  mensagem já enviada ou repetir apenas depois que o adapter provar que o envio original
  não aconteceu.
- Para `best_effort`, falhas de escrita na fila podem recorrer a I/O direto da plataforma.
- Encaminhe sinais de abort para carregamento de mídia e envios da plataforma.
- Execute hooks após commit depois do ack da fila; o fallback direto de melhor esforço os executa
  após I/O de plataforma bem-sucedido porque não há commit de fila durável.
- Retorne recibos para cada id de mensagem visível da plataforma.
- Use `reconcileUnknownSend` quando uma plataforma puder verificar se um envio incerto
  já chegou ao usuário.

Esse contrato evita envios duplicados após falhas e evita burlar
hooks de cancelamento de envio de mensagem.

## Recibos

`MessageReceipt` é o novo registro interno do que a plataforma aceitou:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Use `createMessageReceiptFromOutboundResults(...)` ao adaptar um resultado de envio existente. Use `createPreviewMessageReceipt(...)` quando uma mensagem de pré-visualização em tempo real
se tornar o recibo final. Evite adicionar novos campos `messageIds` locais do proprietário.
`ChannelDeliveryResult.messageIds` legado ainda é produzido nas bordas de compatibilidade.

## Pré-visualização em tempo real

Canais que transmitem pré-visualizações de rascunho ou atualizações de progresso devem declarar capacidades
em tempo real:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Use `defineFinalizableLivePreviewAdapter(...)` e
`deliverWithFinalizableLivePreviewAdapter(...)` para finalização em runtime. O
finalizador decide se a resposta final edita a pré-visualização no lugar, envia um
fallback normal, descarta o estado pendente da pré-visualização, mantém uma edição ambígua com falha
sem duplicar a mensagem e retorna o recibo final.

## Política de ack de recebimento

Receptores de entrada que controlam o timing de confirmação da plataforma devem declarar
política de recebimento:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Adapters que não declaram política de recebimento usam por padrão:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Use o padrão quando a plataforma não tiver nenhum reconhecimento a adiar, já
reconhecer antes do processamento assíncrono ou precisar de semântica de resposta
específica do protocolo. Declare uma das políticas em estágios somente quando o receptor realmente
usar o contexto de recebimento para mover o reconhecimento da plataforma para depois.

Políticas:

| Política               | Use quando                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `after_receive_record` | A plataforma pode ser reconhecida depois que o evento de entrada é analisado e registrado. |
| `after_agent_dispatch` | A plataforma deve aguardar até que o despacho do agente tenha sido aceito.               |
| `after_durable_send`   | A plataforma deve aguardar até que a entrega final tenha uma decisão durável.            |
| `manual`               | O plugin controla o reconhecimento porque a semântica da plataforma não corresponde a um estágio genérico. |

Use `createMessageReceiveContext(...)` em receptores que adiam o estado de ack, e
`shouldAckMessageAfterStage(...)` quando o receptor precisar testar se um
estágio satisfez a política configurada.

## Testes de contrato

Declarações de capacidade fazem parte do contrato do plugin. Dê suporte a elas com testes:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Adicione conjuntos de provas live e de recebimento quando o adaptador declarar esses recursos. Uma
prova ausente deve fazer o teste falhar, em vez de ampliar silenciosamente a
superfície durável.

## APIs de compatibilidade obsoletas

Estas APIs continuam importáveis para compatibilidade com terceiros. Não as use em
código novo de canal.

| API obsoleta                                 | Substituição                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` para despachantes de compatibilidade, ou um adaptador `message` para código novo de canal |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` de `openclaw/plugin-sdk/channel-message-runtime`                   |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` somente para despachantes de compatibilidade                             |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` somente para despachantes de compatibilidade                               |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` mais `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

Despachantes de compatibilidade ainda podem usar `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` e `createTypingCallbacks(...)` por meio da
fachada de mensagens. Código novo de ciclo de vida deve evitar o subcaminho antigo
`channel-reply-pipeline`.

## Checklist de migração

1. Adicione `message: defineChannelMessageAdapter(...)` ou
   `message: createChannelMessageAdapterFromOutbound(...)` ao plugin de canal.
2. Retorne `MessageReceipt` de envios de texto, mídia e payload.
3. Declare somente capacidades respaldadas por comportamento nativo e testes.
4. Substitua mapas de requisitos duráveis escritos manualmente por
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Mova a finalização de pré-visualização pelos auxiliares de pré-visualização live quando o canal
   editar mensagens de rascunho no lugar.
6. Declare a política de ack de recebimento somente quando o receptor puder realmente adiar o
   reconhecimento da plataforma.
7. Mantenha auxiliares legados de despacho de resposta somente nas bordas de compatibilidade.
