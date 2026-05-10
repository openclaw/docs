---
read_when:
    - Você está criando ou refatorando um Plugin de canal de mensagens
    - Você precisa de entrega durável da resposta final, confirmações de recebimento, finalização de pré-visualização ao vivo ou política de confirmação de recebimento
    - Você está migrando do pipeline legado de respostas ou dos auxiliares de despacho de respostas recebidas
summary: API de ciclo de vida de mensagens para plugins de canal, incluindo envios duráveis, recibos, pré-visualização ao vivo, política de confirmação de recebimento e migração legada
title: API de mensagens de canal
x-i18n:
    generated_at: "2026-05-10T19:44:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Os plugins de canal devem expor um adaptador `message` de
`openclaw/plugin-sdk/channel-message`. O adaptador descreve o ciclo de vida de mensagem nativo
compatível com a plataforma:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

O core é responsável por enfileiramento, durabilidade, política genérica de repetição, hooks, recibos e a
ferramenta `message` compartilhada. O plugin é responsável por chamadas nativas de envio/edição/exclusão, normalização de destino, encadeamento da plataforma, citações selecionadas, sinalizadores de notificação, estado da conta e efeitos colaterais específicos da plataforma.

Use esta página junto com [Como criar plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

O subcaminho `channel-message` é intencionalmente leve o suficiente para arquivos de inicialização de plugin em caminhos críticos, como `channel.ts`: ele expõe contratos de adaptador, provas de capacidade, recibos e fachadas de compatibilidade sem carregar entrega de saída.
Auxiliares de entrega em runtime estão disponíveis em
`openclaw/plugin-sdk/channel-message-runtime` para caminhos de código de monitoramento/envio que
já fazem E/S assíncrona de mensagens.

Novo código de envio de canais e plugins deve usar os auxiliares de ciclo de vida de mensagens de
`openclaw/plugin-sdk/channel-message-runtime`: `sendDurableMessageBatch`,
`withDurableMessageSendContext` ou `deliverInboundReplyWithMessageSendContext`.
O auxiliar mais antigo
`deliverOutboundPayloads(...)` em `openclaw/plugin-sdk/outbound-runtime`
é um substrato de compatibilidade/runtime obsoleto para componentes internos de saída, recuperação
e adaptadores legados. Não o use para novos caminhos de envio de canais ou plugins.

`sendDurableMessageBatch(...)` retorna um resultado explícito de ciclo de vida:

- `sent` - pelo menos uma mensagem visível da plataforma foi entregue.
- `suppressed` - nenhuma mensagem da plataforma deve ser tratada como ausente. Motivos estáveis
  incluem `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity` e o legado `no_visible_result`.
- `partial_failed` - pelo menos uma mensagem da plataforma foi entregue antes de uma carga útil
  ou efeito colateral posterior falhar. O resultado inclui o prefixo de recibos entregues
  mais a falha.
- `failed` - nenhum recibo da plataforma foi produzido.

Use `payloadOutcomes` quando um lote misturar cargas úteis enviadas, suprimidas e com falha.
Não infira cancelamento por hook verificando se o array antigo de entrega direta
está vazio.

Despachadores de compatibilidade que ainda precisam do despachador de resposta em buffer devem
criar opções de prefixo de resposta com `createChannelMessageReplyPipeline(...)` de
`openclaw/plugin-sdk/channel-message` e então chamar
`channel.turn.runPrepared(...)` do runtime. Isso mantém a gravação de sessão e a ordem de despacho
no ciclo de vida compartilhado do turno, sem adicionar outro wrapper público de turno.

## Adaptador mínimo

A maioria dos novos plugins de canal pode começar com um adaptador pequeno:

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

Em seguida, anexe-o ao plugin de canal:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Declare apenas as capacidades que o adaptador realmente preserva. Toda capacidade declarada
deve ter um teste de contrato.

## Ponte de saída

Se o canal já tiver um adaptador `outbound` compatível, prefira derivar o
adaptador de mensagem em vez de duplicar código de envio:

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
usa a política de confirmação de recebimento `manual`. Isso torna explícita a confirmação da plataforma de propriedade do plugin
sem alterar canais que confirmam webhooks,
sockets ou offsets de polling fora do contexto genérico de recebimento.

## Envios da ferramenta de mensagem

O caminho compartilhado `message(action="send")` deve usar o mesmo ciclo de vida de entrega do core
que as respostas finais. Se um canal precisar de formatação específica de provedor para o
envio da ferramenta, implemente `actions.prepareSendPayload(...)` em vez de enviar de
`actions.handleAction(...)`.

`prepareSendPayload(...)` recebe o `ReplyPayload` normalizado do core mais o
contexto completo da ação. Retorne uma carga útil com dados específicos do canal em
`payload.channelData.<channel>` e deixe o core chamar `sendMessage(...)`,
o runtime do ciclo de vida de mensagens, a fila de write-ahead, hooks de envio de mensagens,
repetição, recuperação e limpeza de ack. O runtime do ciclo de vida pode chamar
`deliverOutboundPayloads(...)` internamente como substrato de compatibilidade, mas plugins de canal
não devem chamá-lo diretamente para novo comportamento de envio.

Retorne `null` somente quando o envio não puder ser representado como uma carga útil durável, por
exemplo porque contém uma fábrica de componentes não serializável. O core manterá
o fallback de ação de plugin legado por compatibilidade, mas novos recursos de envio de canal
devem ser expressáveis como dados de carga útil duráveis.

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

O adaptador de saída então lê `payload.channelData.demo` dentro de `sendPayload`.
Isso mantém a renderização específica da plataforma no plugin enquanto o core ainda é responsável por
persistir, repetir, recuperar, hooks e ack.

Cargas úteis preparadas de `message(action="send")` e entrega genérica de resposta final usam
entrega do core com enfileiramento de melhor esforço por padrão. Enfileiramento durável obrigatório
só é válido depois que o core verifica que o canal pode reconciliar um envio cujo resultado é
desconhecido após uma falha. Se o adaptador não puder implementar `reconcileUnknownSend`,
mantenha o caminho de envio preparado como melhor esforço; o core ainda tentará a fila de write-ahead,
mas persistência de fila ou recuperação incerta após falha não faz parte do
contrato de entrega obrigatório.

## Capacidades finais duráveis

Entrega final durável é opt-in por efeito colateral. O core só usará entrega
durável genérica quando o adaptador declarar todas as capacidades necessárias pela
carga útil e pelas opções de entrega.

| Capacidade             | Declare quando                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | O adaptador pode enviar texto e retornar um recibo.                                  |
| `media`                | Envios de mídia retornam recibos para cada mensagem visível da plataforma.           |
| `payload`              | O adaptador preserva semânticas de carga útil de resposta rica, não apenas texto e uma URL de mídia. |
| `replyTo`              | Destinos de resposta nativos chegam à plataforma.                                    |
| `thread`               | Destinos nativos de thread, tópico ou thread de canal chegam à plataforma.           |
| `silent`               | Supressão de notificação chega à plataforma.                                         |
| `nativeQuote`          | Metadados de citação selecionada chegam à plataforma.                                |
| `messageSendingHooks`  | Hooks de envio de mensagens do core podem cancelar ou reescrever conteúdo antes da E/S da plataforma. |
| `batch`                | Lotes renderizados de várias partes podem ser reproduzidos como um plano durável.    |
| `reconcileUnknownSend` | O adaptador pode resolver recuperação `unknown_after_send` sem reprodução cega.      |
| `afterSendSuccess`     | Efeitos colaterais locais do canal após envio executam uma vez.                      |
| `afterCommit`          | Efeitos colaterais locais do canal após commit executam uma vez.                     |

Entrega final de melhor esforço não exige `reconcileUnknownSend`; ela usa o
ciclo de vida compartilhado quando o adaptador preserva as semânticas visíveis da carga útil, e
recorre a E/S direta da plataforma se a persistência da fila não estiver disponível. Entrega
final durável obrigatória deve exigir explicitamente `reconcileUnknownSend`. Se o
adaptador não puder determinar se um envio iniciado/desconhecido chegou à plataforma,
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
somente para um caminho que intencionalmente não possa executar hooks globais de envio de mensagens.

## Contrato de envio durável

Um envio final durável tem semânticas mais rigorosas que a entrega legada de propriedade do canal:

- Crie a intenção durável antes da E/S da plataforma.
- Se a entrega durável retornar um resultado tratado, não recorra ao envio legado.
- Trate cancelamento por hook e resultados sem envio como terminais.
- Trate `unsupported` como um resultado apenas pré-intenção.
- Para durabilidade obrigatória, falhe antes da E/S da plataforma se a fila não puder registrar
  que o envio à plataforma foi iniciado.
- Para entrega final obrigatória e envios preparados obrigatórios da ferramenta de mensagem,
  faça preflight de `reconcileUnknownSend`; a recuperação deve ser capaz de confirmar por ack uma
  mensagem já enviada ou reproduzir somente depois que o adaptador provar que o envio original
  não aconteceu.
- Para `best_effort`, falhas de escrita na fila podem recorrer a E/S direta da plataforma.
- Encaminhe sinais de abortamento para carregamento de mídia e envios da plataforma.
- Execute hooks após commit depois do ack da fila; o fallback direto de melhor esforço os executa
  após E/S da plataforma bem-sucedida porque não há commit de fila durável.
- Retorne recibos para cada id de mensagem visível da plataforma.
- Use `reconcileUnknownSend` quando uma plataforma puder verificar se um envio incerto
  já chegou ao usuário.

Este contrato evita envios duplicados após falhas e evita contornar
hooks de cancelamento de envio de mensagens.

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

Use `createMessageReceiptFromOutboundResults(...)` ao adaptar um resultado de
envio existente. Use `createPreviewMessageReceipt(...)` quando uma mensagem de
visualização ao vivo se tornar o recibo final. Evite adicionar novos campos
`messageIds` locais do proprietário. O `ChannelDeliveryResult.messageIds`
legado ainda é produzido nas fronteiras de compatibilidade.

## Visualização ao vivo

Canais que transmitem pré-visualizações de rascunho ou atualizações de progresso
devem declarar capacidades ao vivo:

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
`deliverWithFinalizableLivePreviewAdapter(...)` para finalização em tempo de
execução. O finalizador decide se a resposta final edita a visualização no
lugar, envia uma alternativa normal, descarta o estado de visualização pendente,
mantém uma edição com falha ambígua sem duplicar a mensagem e retorna o recibo
final.

## Política de confirmação de recebimento

Receivers de entrada que controlam o momento da confirmação da plataforma devem
declarar a política de recebimento:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Adaptadores que não declaram política de recebimento usam por padrão:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Use o padrão quando a plataforma não tem confirmação a adiar, já confirma antes
do processamento assíncrono ou precisa de semântica de resposta específica do
protocolo. Declare uma das políticas em etapas somente quando o receiver
realmente usar o contexto de recebimento para mover a confirmação da plataforma
para mais tarde.

Políticas:

| Política               | Use quando                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | A plataforma pode ser confirmada depois que o evento de entrada é analisado e registrado. |
| `after_agent_dispatch` | A plataforma deve esperar até que o despacho do agente tenha sido aceito.                 |
| `after_durable_send`   | A plataforma deve esperar até que a entrega final tenha uma decisão durável.              |
| `manual`               | O Plugin controla a confirmação porque a semântica da plataforma não corresponde a uma etapa genérica. |

Use `createMessageReceiveContext(...)` em receivers que adiam o estado de
confirmação, e `shouldAckMessageAfterStage(...)` quando o receiver precisar
testar se uma etapa satisfez a política configurada.

## Testes de contrato

Declarações de capacidade fazem parte do contrato do Plugin. Dê suporte a elas
com testes:

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

Adicione suítes de prova ao vivo e de recebimento quando o adaptador declarar
esses recursos. Uma prova ausente deve fazer o teste falhar, em vez de ampliar
silenciosamente a superfície durável.

## APIs de compatibilidade obsoletas

Estas APIs continuam importáveis para compatibilidade com terceiros. Não as use
para novo código de canal.

| API obsoleta                                 | Substituição                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` para dispatchers de compatibilidade, ou um adaptador `message` para novo código de canal |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` mais `channel.turn.runPrepared(...)`, ou um adaptador `message` para novo código de canal |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` mais `channel.turn.runPrepared(...)`, ou um adaptador `message` para novo código de canal |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` mais `channel.turn.runPrepared(...)`, ou um adaptador `message` para novo código de canal |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` ou `deliverInboundReplyWithMessageSendContext(...)` de `channel-message-runtime`             |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` de `openclaw/plugin-sdk/channel-message-runtime`                          |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` mais `channel.turn.runPrepared(...)`, ou um adaptador `message` para novo código de canal |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` mais `channel.turn.runPrepared(...)`, ou um adaptador `message` para novo código de canal |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` mais `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

Dispatchers de compatibilidade ainda podem usar `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` e `createTypingCallbacks(...)` por meio da
fachada de mensagens. Novo código de ciclo de vida deve evitar o subcaminho
antigo `channel-reply-pipeline`.

## Lista de verificação de migração

1. Adicione `message: defineChannelMessageAdapter(...)` ou
   `message: createChannelMessageAdapterFromOutbound(...)` ao Plugin de canal.
2. Retorne `MessageReceipt` de envios de texto, mídia e payload.
3. Declare somente capacidades apoiadas por comportamento nativo e testes.
4. Substitua mapas de requisitos duráveis escritos manualmente por
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Mova a finalização da visualização pelos helpers de visualização ao vivo
   quando o canal editar mensagens de rascunho no lugar.
6. Declare a política de confirmação de recebimento somente quando o receiver
   realmente puder adiar a confirmação da plataforma.
7. Mantenha os helpers legados de despacho de resposta somente nas fronteiras de
   compatibilidade.
