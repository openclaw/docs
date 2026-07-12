---
read_when:
    - Você está criando ou refatorando o fluxo de envio de um Plugin de canal de mensagens
    - Você precisa de entrega durável da resposta final, confirmações de recebimento, finalização da prévia em tempo real ou política de confirmação de recebimento
    - Você está migrando dos auxiliares channel-message, channel-message-runtime ou dos auxiliares legados de despacho de respostas
summary: 'API do ciclo de vida de mensagens de saída para plugins de canal: adaptadores, confirmações de recebimento, envios duráveis, pré-visualização em tempo real e auxiliares do pipeline de respostas'
title: API de saída do canal
x-i18n:
    generated_at: "2026-07-12T00:13:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Plugins de canal expõem o comportamento de mensagens de saída por meio de
`openclaw/plugin-sdk/channel-outbound`. Use
`openclaw/plugin-sdk/channel-inbound` para a orquestração de
recebimento/contexto/encaminhamento.

O núcleo é responsável pelo enfileiramento, durabilidade, política genérica de
novas tentativas, hooks, confirmações e pela ferramenta `message` compartilhada.
O plugin é responsável pelas chamadas nativas de envio/edição/exclusão, pela
normalização do destino, pelas threads da plataforma, pelas citações selecionadas,
pelos sinalizadores de notificação, pelo estado da conta e pelos efeitos colaterais
específicos da plataforma.

## Adaptador

A maioria dos plugins define um adaptador `message`:

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

Declare apenas os recursos que o transporte nativo realmente preserva. Cubra
cada recurso declarado de envio, confirmação, pré-visualização em tempo real e
confirmação de recebimento com os auxiliares de contrato exportados deste
subcaminho.

## Sanitização de texto simples

Use `sanitizeForPlainText(...)` quando um adaptador de saída precisar converter
as tags de formatação HTML compatíveis em marcação de texto leve. O padrão mantém
os marcadores existentes de negrito e tachado no estilo de chat. Passe
`{ style: "markdown" }` somente quando o canal reanalisar o resultado como Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

O estilo Markdown usa `**bold**` e `~~strikethrough~~`; itálico e código embutido
mantêm os marcadores `_italic_` e de crase em ambos os estilos. Selecione o estilo
no limite do canal em vez de reescrever o texto dos marcadores após a sanitização.

## Evidências de entrega

Um `MessageReceipt` registra o resultado retornado por um adaptador de canal.
Identificadores concretos de mensagens da plataforma mostram que o caminho de
envio da plataforma aceitou a mensagem; eles não comprovam que o dispositivo de
um destinatário a exibiu ou leu. Confirmações sem identificadores de mensagens da
plataforma são apenas metadados locais de confirmação. Canais com confirmações de
leitura ou estado de entrega ao dispositivo devem acompanhar esses fatos por um
caminho separado e específico do canal.

Se um adaptador de canal puder comprovar que repetir uma falha não pode duplicar
um envio visível ao destinatário e que nenhuma chamada capaz de finalizar foi
iniciada, lance
`new PlatformMessageNotDispatchedError("...", { cause: error })` de
`openclaw/plugin-sdk/error-runtime`. Assim, o núcleo pode limpar evidências
obsoletas da tentativa de envio e repetir com segurança a intenção enfileirada.
Somente o adaptador responsável pelo limite de encaminhamento final pode fazer
essa afirmação. Nunca use o marcador depois que uma chamada de finalização/envio
for iniciada ou retornar um resultado ambíguo; uma marcação incorreta pode
duplicar mensagens.

## Adaptadores de saída existentes

Se o canal já tiver um adaptador `outbound` compatível, derive dele o adaptador
de mensagens em vez de duplicar o código de envio:

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

Os auxiliares de envio do runtime também ficam em `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- auxiliares de streaming/progresso de rascunho, como `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` retorna um resultado explícito:

| Resultado        | Significado                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `sent`           | pelo menos uma mensagem visível da plataforma foi aceita pelo caminho de envio da plataforma          |
| `suppressed`     | nenhuma mensagem da plataforma deve ser tratada como ausente                                          |
| `partial_failed` | pelo menos uma mensagem da plataforma foi aceita antes de uma falha posterior de payload ou efeito colateral |
| `failed`         | nenhuma confirmação da plataforma foi produzida                                                       |

Use `payloadOutcomes` quando um lote combinar payloads enviados, suprimidos e com
falha. Não deduza o cancelamento de hooks a partir de um resultado vazio de
entrega direta legada.

## Admissão de entrega adiada

Use `message.durableFinal.admitDeferredDelivery(...)` quando uma conta resolvida
não puder aceitar com segurança uma entrega de saída ou adiada gerenciada pelo
núcleo. O núcleo chama esse hook de forma síncrona antes do trabalho de saída em
tempo real, incluindo caminhos que ignoram a persistência na fila, e novamente
antes de repetir uma intenção recuperada. O contexto inclui `cfg`, `channel`,
`to`, `accountId` e uma `phase` igual a `live` ou `recovery`.

Retorne `{ status: "allowed" }` para continuar. Retorne
`{ status: "permanent_rejection", reason }` quando a entrega não puder ser
persistida, enviada diretamente nem repetida. Uma rejeição em tempo real falha
antes da criação da fila, dos hooks de mensagem ou do trabalho na plataforma.
Uma rejeição durante a recuperação marca o registro enfileirado como falho e
ignora a reconciliação e a repetição. Omitir o hook significa que a entrega é
permitida.

O hook é uma decisão síncrona de admissão, não um caminho de envio. Leia apenas
a configuração ou o estado de runtime já carregados; não execute operações
assíncronas de rede, sistema de arquivos ou outras formas de E/S. Os testes de
contrato devem exercitar ambas as fases e as duas variantes de resultado por
meio de `ChannelMessageDurableFinalAdapter` de
`openclaw/plugin-sdk/channel-outbound`.

## Encaminhamento de compatibilidade

Monte o encaminhamento de respostas recebidas por meio de
`dispatchChannelInboundReply(...)` de `channel-inbound`. Mantenha a entrega da
plataforma no adaptador de entrega; use `channel-outbound` para adaptadores de
mensagens, envios duráveis, confirmações, pré-visualização em tempo real e opções
do pipeline de respostas.
