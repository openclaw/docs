---
read_when:
    - Refatoração do comportamento de envio ou recebimento do canal
    - Alterar turno de canal, despacho de respostas, fila de saída, streaming de pré-visualização ou APIs de mensagens do SDK de Plugin
    - Projetando um novo Plugin de canal que precisa de envios duráveis, confirmações de recebimento, prévias, edições ou novas tentativas
summary: Plano de design para o ciclo de vida unificado e persistente de recebimento, envio, pré-visualização, edição e streaming de mensagens
title: Refatoração do ciclo de vida das mensagens
x-i18n:
    generated_at: "2026-05-10T19:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Esta página é o design-alvo para substituir auxiliares dispersos de turno de canal, despacho de resposta, streaming de pré-visualização e entrega de saída por um ciclo de vida de mensagem durável.

A versão curta:

- As primitivas centrais devem ser **receber** e **enviar**, não **responder**.
- Uma resposta é apenas uma relação em uma mensagem de saída.
- Um turno é uma conveniência de processamento de entrada, não o dono da entrega.
- O envio deve ser baseado em contexto: `begin`, renderizar, pré-visualizar ou transmitir por stream, envio final, confirmar, falhar.
- O recebimento também deve ser baseado em contexto: normalizar, desduplicar, rotear, registrar, despachar, ack da plataforma, falhar.
- O SDK público de Plugin deve se consolidar em uma superfície pequena de mensagens de canal.

## Problemas

A pilha atual de canais cresceu a partir de várias necessidades locais válidas:

- Adaptadores simples de entrada usam `runtime.channel.turn.run`.
- Adaptadores ricos usam `runtime.channel.turn.runPrepared`.
- Auxiliares legados usam `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, auxiliares de payload de resposta, fragmentação de resposta, referências de resposta e auxiliares de runtime de saída.
- O streaming de pré-visualização vive em despachantes específicos de canal.
- A durabilidade da entrega final está sendo adicionada em torno dos caminhos existentes de payload de resposta.

Esse formato corrige bugs locais, mas deixa o OpenClaw com conceitos públicos demais e lugares demais onde a semântica de entrega pode divergir.

O problema de confiabilidade que expôs isso é:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

A invariante-alvo é mais ampla que Telegram: quando o núcleo decide que uma mensagem de saída visível deve existir, a intenção deve ser durável antes da tentativa de envio pela plataforma, e o recibo da plataforma deve ser confirmado após o sucesso. Isso dá ao OpenClaw recuperação pelo menos uma vez. O comportamento exatamente uma vez existe apenas para adaptadores que conseguem provar idempotência nativa ou reconciliar uma tentativa desconhecida após envio contra o estado da plataforma antes de reproduzir.

Esse é o estado final desta refatoração, não uma descrição de todos os caminhos atuais. Durante a migração, os auxiliares de saída existentes ainda podem cair para um envio direto quando gravações de fila em melhor esforço falharem. A refatoração só estará completa quando envios finais duráveis falharem de forma fechada ou optarem explicitamente por não participar com uma política não durável documentada.

## Objetivos

- Um ciclo de vida central para todos os caminhos de recebimento e envio de mensagens de canal.
- Envios finais duráveis por padrão no novo ciclo de vida de mensagens depois que um adaptador declarar comportamento seguro para reprodução.
- Semânticas compartilhadas de pré-visualização, edição, stream, finalização, nova tentativa, recuperação e recibo.
- Uma superfície pequena de SDK de Plugin que Plugins de terceiros possam aprender e manter.
- Compatibilidade para chamadores existentes de `channel.turn` durante a migração.
- Pontos de extensão claros para novas capacidades de canal.
- Nenhum desvio específico de plataforma no núcleo.
- Nenhuma mensagem de canal com delta de tokens. O streaming de canal continua sendo entrega de pré-visualização, edição, acréscimo ou bloco concluído de mensagem.
- Metadados estruturados de origem OpenClaw para saída operacional/de sistema, para que falhas visíveis do Gateway não reentrem em salas compartilhadas habilitadas para bots como prompts novos.

## Não objetivos

- Não remover `runtime.channel.turn.*` na primeira fase.
- Não forçar todos os canais ao mesmo comportamento de transporte nativo.
- Não ensinar ao núcleo tópicos do Telegram, streams nativos do Slack, redações do Matrix, cartões do Feishu, voz do QQ ou atividades do Teams.
- Não publicar todos os auxiliares internos de migração como API estável de SDK.
- Não fazer novas tentativas reproduzirem operações de plataforma não idempotentes já concluídas.

## Modelo de referência

O Vercel Chat tem um bom modelo mental público:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- métodos de adaptador como `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` e buscas de histórico
- um adaptador de estado para desduplicação, travas, filas e persistência

O OpenClaw deve tomar emprestado o vocabulário, não copiar a superfície.

O que o OpenClaw precisa além desse modelo:

- Intenções duráveis de envio de saída antes de chamadas diretas de transporte.
- Contextos de envio explícitos com início, confirmação e falha.
- Contextos de recebimento que conhecem a política de ack da plataforma.
- Recibos que sobrevivem a reinicializações e podem orientar edições, exclusões, recuperação e supressão de duplicatas.
- Um SDK público menor. Plugins incluídos podem usar auxiliares internos de runtime, mas Plugins de terceiros devem ver uma API coerente de mensagens.
- Comportamento específico de agente: sessões, transcrições, streaming de blocos, progresso de ferramentas, aprovações, diretivas de mídia, respostas silenciosas e histórico de menções em grupo.

Promessas no estilo `thread.post()` não são suficientes para o OpenClaw. Elas escondem o limite transacional que decide se um envio é recuperável.

## Modelo central

O novo domínio deve viver sob um namespace central interno, como `src/channels/message/*`.

Ele tem quatro conceitos:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` é dono do ciclo de vida de entrada.

`send` é dono do ciclo de vida de saída.

`live` é dono da pré-visualização, edição, progresso e estado de stream.

`state` é dono do armazenamento durável de intenções, recibos, idempotência, recuperação, travas e desduplicação.

## Termos de mensagem

### Mensagem

Uma mensagem normalizada é neutra em relação à plataforma:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### Alvo

O alvo descreve onde a mensagem vive:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### Relação

Resposta é uma relação, não uma raiz de API:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

Isso permite que o mesmo caminho de envio trate respostas normais, notificações Cron, prompts de aprovação, conclusões de tarefa, envios por ferramenta de mensagens, envios por CLI ou Control UI, resultados de subagente e envios de automação.

### Origem

Origem descreve quem produziu uma mensagem e como o OpenClaw deve tratar ecos dessa mensagem. Ela é separada da relação: uma mensagem pode ser uma resposta a um usuário e ainda assim ser uma saída operacional originada pelo OpenClaw.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

O núcleo é dono do significado da saída originada pelo OpenClaw. Os canais são donos de como essa origem é codificada em seu transporte.

O primeiro uso obrigatório é a saída de falha do Gateway. Humanos ainda devem ver mensagens como "Agente falhou antes de responder" ou "Chave de API ausente", mas a saída operacional marcada do OpenClaw não deve ser aceita como entrada autorada por bot em salas compartilhadas quando `allowBots` estiver habilitado.

### Recibo

Recibos são entidades de primeira classe:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

Recibos são a ponte entre intenção durável e futura edição, exclusão, finalização de pré-visualização, supressão de duplicatas e recuperação.

Um recibo pode descrever uma mensagem de plataforma ou uma entrega em várias partes. Texto fragmentado, mídia mais texto, voz mais texto e fallbacks de cartão devem preservar todos os ids da plataforma, enquanto ainda expõem um id primário para encadeamento e edições posteriores.

## Contexto de recebimento

Receber não deve ser uma chamada nua de auxiliar. O núcleo precisa de um contexto que conheça desduplicação, roteamento, registro de sessão e política de ack da plataforma.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Fluxo de recebimento:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

Ack não é uma coisa só. O contrato de recebimento deve manter estes sinais separados:

- **Ack de transporte:** informa ao Webhook ou socket da plataforma que o OpenClaw aceitou o envelope do evento. Algumas plataformas exigem isso antes do despacho.
- **Ack de offset de polling:** avança um cursor para que o mesmo evento não seja buscado novamente. Isso não deve avançar para além de trabalho que não possa ser recuperado.
- **Ack de registro de entrada:** confirma que o OpenClaw persistiu metadados de entrada suficientes para desduplicar e rotear uma reentrega.
- **Recibo visível ao usuário:** comportamento opcional de leitura/status/digitação; nunca é um limite de durabilidade.

`ReceiveAckPolicy` controla apenas a confirmação de transporte ou polling. Ela não deve ser reutilizada para recibos de leitura ou reações de status.

Antes da autorização de bot, o recebimento deve aplicar a política compartilhada de eco do OpenClaw quando o canal puder decodificar metadados de origem da mensagem:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

Essa queda é baseada em marca, não em texto. Uma mensagem de sala autorada por bot com o mesmo texto visível de falha do Gateway, mas sem metadados de origem do OpenClaw, ainda passa pela autorização normal de `allowBots`.

A política de ack é explícita:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

O polling do Telegram agora usa a política de ack do contexto de recebimento para seu watermark persistido de reinicialização. O rastreador ainda observa atualizações do grammY à medida que entram na cadeia de middleware, mas o OpenClaw persiste apenas o id de atualização concluída segura após despacho bem-sucedido, deixando atualizações com falha ou pendentes inferiores reproduzíveis após uma reinicialização. O offset de busca `getUpdates` upstream do Telegram ainda é controlado pela biblioteca de polling, então o corte mais profundo restante é uma fonte de polling totalmente durável caso precisemos de reentrega no nível da plataforma além do watermark de reinicialização do OpenClaw. Plataformas de Webhook podem precisar de ack HTTP imediato, mas ainda precisam de desduplicação de entrada e intenções duráveis de envio de saída, porque Webhooks podem reentregar.

## Contexto de envio

Enviar também é baseado em contexto:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Orquestração preferencial:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

O helper se expande para:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

A intenção deve existir antes da E/S de transporte. Uma reinicialização depois de começar, mas antes do
commit, é recuperável.

O limite perigoso fica depois do sucesso da plataforma e antes do commit do recibo. Se um
processo morrer ali, o OpenClaw não consegue saber se a mensagem da plataforma existe
a menos que o adaptador ofereça idempotência nativa ou um caminho de reconciliação de recibo.
Essas tentativas devem ser retomadas em `unknown_after_send`, não repetidas às cegas. Canais
sem reconciliação podem escolher repetição pelo menos uma vez somente se mensagens visíveis
duplicadas forem uma contrapartida aceitável e documentada para esse canal e relação.
A ponte de reconciliação atual do SDK exige que o adaptador declare
`reconcileUnknownSend` e então pede que `durableFinal.reconcileUnknownSend`
classifique uma entrada desconhecida como `sent`, `not_sent` ou `unresolved`; somente `not_sent`
permite repetição, e entradas não resolvidas permanecem terminais ou repetem somente a
verificação de reconciliação.

A política de durabilidade deve ser explícita:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` significa que o núcleo deve falhar de forma fechada quando não puder gravar a intenção durável.
`best_effort` pode prosseguir quando a persistência está indisponível. `disabled` mantém
o comportamento antigo de envio direto. Durante a migração, wrappers legados e helpers públicos
de compatibilidade usam `disabled` por padrão; eles não devem inferir `required` do
fato de um canal ter um adaptador genérico de saída.

Contextos de envio também são donos de efeitos pós-envio locais ao canal. Uma migração não é segura
se a entrega durável contornar comportamento local que antes estava associado ao
caminho de envio direto do canal. Exemplos incluem caches de supressão de eco próprio,
marcadores de participação em thread, âncoras de edição nativas, renderização de assinatura do modelo
e guardas contra duplicação específicos da plataforma. Esses efeitos devem se mover para o
adaptador de envio, o adaptador de renderização ou um hook nomeado de contexto de envio antes que
esse canal possa habilitar entrega final genérica durável.

Helpers de envio devem retornar recibos até o chamador. Wrappers duráveis
não podem engolir ids de mensagem nem substituir um resultado de entrega do canal por
`undefined`; despachantes em buffer usam esses ids para âncoras de thread, edições posteriores,
finalização de pré-visualização e supressão de duplicação.

Envios de fallback operam sobre lotes, não payloads únicos. Reescritas de resposta silenciosa,
fallback de mídia, fallback de cartão e projeção de fragmentos podem produzir mais de
uma mensagem entregável, portanto um contexto de envio deve entregar o lote projetado inteiro
ou documentar explicitamente por que apenas um payload é válido.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

Quando esse fallback é durável, o lote projetado inteiro deve ser representado por
uma intenção de envio durável ou outro plano de lote atômico. Registrar cada payload
um a um não basta: uma falha entre payloads pode deixar um fallback visível parcial
sem registro durável para os payloads restantes. A recuperação deve saber
quais unidades já têm recibos e repetir somente unidades ausentes ou marcar
o lote como `unknown_after_send` até que o adaptador o reconcilie.

## Contexto em tempo real

Comportamento de pré-visualização, edição, progresso e stream deve ser um ciclo de vida opt-in.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

O estado em tempo real é durável o suficiente para recuperar ou suprimir duplicatas:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

Isso deve cobrir o comportamento atual:

- Envio do Telegram mais pré-visualização por edição, com final novo após a idade da pré-visualização expirada.
- Envio do Discord mais pré-visualização por edição, cancelamento em mídia/erro/resposta explícita.
- Stream nativo do Slack ou pré-visualização em rascunho dependendo do formato da thread.
- Finalização de postagem em rascunho do Mattermost.
- Finalização de evento em rascunho do Matrix ou redação em caso de incompatibilidade.
- Stream de progresso nativo do Teams.
- Stream do QQ Bot ou fallback acumulado.

## Superfície do adaptador

O alvo do SDK público deve ser um subcaminho:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

Formato do alvo:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

Adaptador de envio:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

Adaptador de recebimento:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Antes da autorização de preflight, o núcleo deve executar o predicado compartilhado de eco do OpenClaw
sempre que `origin.decode` retornar metadados de origem do OpenClaw. O adaptador de recebimento
fornece fatos da plataforma, como autor bot e formato da sala; o núcleo é dono da decisão de descarte
e da ordenação para que os canais não reimplementem filtros de texto.

Adaptador de origem:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

O núcleo define `MessageOrigin`. Os canais apenas o traduzem para e a partir dos
metadados de transporte nativos. O Slack mapeia isso para `chat.postMessage({ metadata })` e
`message.metadata` de entrada; o Matrix pode mapeá-lo para conteúdo extra de evento; canais
sem metadados nativos podem usar um registro de recibos/saída quando essa for a
melhor aproximação disponível.

Capacidades:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## Redução do SDK público

A nova superfície pública deve absorver ou descontinuar estas áreas conceituais:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- a maioria dos usos públicos de `outbound-runtime`
- helpers ad hoc de ciclo de vida de stream em rascunho

Subcaminhos de compatibilidade podem permanecer como wrappers, mas novos plugins de terceiros
não devem precisar deles.

Plugins empacotados podem manter imports de helpers internos por subcaminhos reservados de runtime
durante a migração. A documentação pública deve orientar autores de plugins para
`plugin-sdk/channel-message` quando ele existir.

## Relação com o turno do canal

`runtime.channel.turn.*` deve permanecer durante a migração.

Ele deve se tornar um adaptador de compatibilidade:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` também deve permanecer inicialmente:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Depois que todos os plugins empacotados e caminhos conhecidos de compatibilidade de terceiros forem conectados,
`channel.turn` poderá ser descontinuado. Ele não deve ser removido até que haja um
caminho de migração do SDK publicado e testes de contrato provando que plugins antigos ainda funcionam
ou falham com um erro de versão claro.

## Proteções de compatibilidade

Durante a migração, a entrega genérica durável é opt-in para qualquer canal cujo
callback de entrega existente tenha efeitos colaterais além de "enviar este payload".

Pontos de entrada legados não são duráveis por padrão:

- `channel.turn.run` e `dispatchAssembledChannelTurn` usam o callback de
  entrega do canal, a menos que esse canal forneça explicitamente um objeto de
  política/opções durável auditado.
- `channel.turn.runPrepared` permanece de propriedade do canal até que o despachante preparado
  chame explicitamente o contexto de envio.
- Helpers públicos de compatibilidade como `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` e helpers de DM direta nunca injetam entrega
  genérica durável antes do callback `deliver` ou `reply` fornecido pelo chamador.

Para tipos de ponte de migração, `durable: undefined` significa "não durável". O
caminho durável é habilitado somente por um valor explícito de política/opções. `durable:
false` pode permanecer como grafia de compatibilidade, mas a implementação não deve
exigir que todo canal não migrado o adicione.

O código de ponte atual deve manter explícita a decisão de durabilidade:

- A entrega final durável retorna um status discriminado. `handled_visible` e
  `handled_no_send` são terminais; `unsupported` e `not_applicable` podem
  voltar para a entrega de responsabilidade do canal; `failed` propaga a falha
  de envio.
- A entrega final durável genérica é controlada por capacidades do adaptador,
  como entrega silenciosa, preservação do alvo de resposta, preservação de citação
  nativa e ganchos de envio de mensagens. A falta de paridade deve escolher a
  entrega de responsabilidade do canal, não um envio genérico que altera o
  comportamento visível ao usuário.
- Envios duráveis apoiados por fila expõem uma referência de intenção de entrega.
  Os campos de sessão `pendingFinalDelivery*` existentes podem carregar o id da
  intenção durante a transição; o estado final é um armazenamento
  `MessageSendIntent` em vez de texto de resposta congelado mais campos de
  contexto ad hoc.

Não habilite o caminho durável genérico para um canal até que tudo isto seja
verdadeiro:

- O adaptador de envio genérico executa o mesmo comportamento de renderização e
  transporte que o caminho direto antigo.
- Efeitos colaterais locais pós-envio são preservados por meio do contexto de
  envio.
- O adaptador retorna recibos ou resultados de entrega com todos os ids de
  mensagem da plataforma.
- Caminhos de despachante preparados chamam o novo contexto de envio ou permanecem
  documentados como fora da garantia durável.
- A entrega alternativa lida com todos os payloads projetados, não apenas o
  primeiro.
- A entrega alternativa durável registra todo o array de payloads projetados como
  uma intenção ou plano de lote reproduzível.

Riscos concretos de migração a preservar:

- A entrega do monitor do iMessage registra mensagens enviadas em um cache de eco
  depois de um envio bem-sucedido. Envios finais duráveis ainda devem preencher
  esse cache; caso contrário, o OpenClaw pode reingerir suas próprias respostas
  finais como mensagens de usuário recebidas.
- O Tlon acrescenta uma assinatura de modelo opcional e registra threads
  participadas após respostas em grupo. A entrega durável genérica não deve
  ignorar esses efeitos; mova-os para adaptadores de renderização/envio/finalização
  do Tlon ou mantenha o Tlon no caminho de responsabilidade do canal.
- O Discord e outros despachantes preparados já são responsáveis pela entrega
  direta e pelo comportamento de prévia. Eles não são cobertos por uma garantia
  durável de turno montado até que seus despachantes preparados encaminhem
  finais explicitamente pelo contexto de envio.
- A entrega alternativa silenciosa do Telegram deve entregar todo o array de
  payloads projetados. Um atalho de payload único pode descartar payloads
  alternativos adicionais após a projeção.
- LINE, Zalo, Nostr e outros caminhos montados/de auxiliares existentes podem
  ter tratamento de tokens de resposta, proxy de mídia, caches de mensagens
  enviadas, limpeza de carregamento/status ou alvos apenas de callback. Eles
  permanecem na entrega de responsabilidade do canal até que essas semânticas
  sejam representadas pelo adaptador de envio e verificadas por testes.
- Auxiliares de DM direta podem ter um callback de resposta que é o único alvo de
  transporte correto. A saída genérica não deve inferir a partir de
  `OriginatingTo` ou `To` e pular esse callback.
- A saída de falha do Gateway do OpenClaw deve permanecer visível para humanos,
  mas ecos de sala criados por bot e marcados devem ser descartados antes da
  autorização `allowBots`. Canais não devem implementar isso com filtros de
  prefixo de texto visível, exceto como uma medida emergencial curta; o contrato
  durável é metadado estruturado de origem.

## Armazenamento interno

A fila durável deve armazenar intenções de envio de mensagem, não payloads de
resposta.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

Loop de recuperação:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

A fila deve manter identidade suficiente para reproduzir pelo mesmo account,
thread, alvo, política de formatação e regras de mídia após a reinicialização.

## Classes de falha

Adaptadores de canal classificam falhas de transporte em categorias fechadas:

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

Política central:

- Tente novamente `transient` e `rate_limit`.
- Não tente novamente `invalid_payload`, a menos que exista uma alternativa de
  renderização.
- Não tente novamente `auth` ou `permission` até que a configuração mude.
- Para `not_found`, permita que a finalização ao vivo passe de edição para um
  novo envio quando o canal declarar que isso é seguro.
- Para `conflict`, use regras de recibo/idempotência para decidir se a mensagem
  já existe.
- Qualquer erro depois de o adaptador possivelmente ter concluído E/S da
  plataforma, mas antes do commit do recibo, torna-se `unknown_after_send`, a
  menos que o adaptador possa provar que a operação da plataforma não aconteceu.

## Mapeamento de canais

| Canal           | Migração alvo                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Receber política de confirmação mais envios finais duráveis. O adaptador live é responsável pelo envio e pela edição de pré-visualização, envio final de pré-visualização obsoleta, tópicos, salto de pré-visualização de resposta com citação, fallback de mídia e tratamento de retry-after.                                                               |
| Discord         | O adaptador de envio encapsula a entrega durável de payload existente. O adaptador live é responsável por edição de rascunho, rascunho de progresso, cancelamento de pré-visualização de mídia/erro, preservação do alvo de resposta e recibos de id de mensagem. Auditar ecos de falha de Gateway escritos por bot em salas compartilhadas; usar um registro de saída ou outro equivalente nativo se Discord não puder carregar metadados de origem em mensagens normais. |
| Slack           | O adaptador de envio trata publicações normais de chat. O adaptador live escolhe stream nativo quando o formato da thread oferece suporte; caso contrário, pré-visualização de rascunho. Os recibos preservam timestamps de thread. O adaptador de origem mapeia falhas do Gateway OpenClaw para `chat.postMessage.metadata` do Slack e descarta ecos marcados em salas de bot antes da autorização `allowBots`. |
| WhatsApp        | O adaptador de envio é responsável por envio de texto/mídia com intenções finais duráveis. O adaptador de recebimento trata menção em grupo e identidade do remetente. O live pode permanecer ausente até que WhatsApp tenha um transporte editável.                                                                                                           |
| Matrix          | O adaptador live é responsável por edições de eventos de rascunho, finalização, redação, restrições de mídia criptografada e fallback para incompatibilidade de alvo de resposta. O adaptador de recebimento é responsável por hidratação e deduplicação de eventos criptografados. O adaptador de origem deve codificar a origem de falha do Gateway OpenClaw no conteúdo do evento Matrix e descartar ecos de sala de bot configurado antes do tratamento de `allowBots`. |
| Mattermost      | O adaptador live é responsável por uma publicação de rascunho, agrupamento de progresso/ferramenta, finalização no local e fallback de envio novo.                                                                                                                                                                                                              |
| Microsoft Teams | O adaptador live é responsável por progresso nativo e comportamento de stream de blocos. O adaptador de envio é responsável por atividades e recibos de anexos/cartões.                                                                                                                                                                                        |
| Feishu          | O adaptador de renderização é responsável por renderização de texto/cartão/bruta. O adaptador live é responsável por cartões de streaming e supressão de final duplicado. O adaptador de envio é responsável por comentários, sessões de tópico, mídia e supressão de voz.                                                                                     |
| QQ Bot          | O adaptador live é responsável por streaming C2C, timeout do acumulador e envio final de fallback. O adaptador de renderização é responsável por tags de mídia e texto como voz.                                                                                                                                                                              |
| Signal          | Adaptador simples de recebimento e envio. Sem adaptador live, a menos que signal-cli adicione suporte confiável a edição.                                                                                                                                                                                                                                      |
| iMessage        | Adaptador simples de recebimento e envio. O envio do iMessage deve preservar a população do cache de eco do monitor antes que finais duráveis possam ignorar a entrega pelo monitor.                                                                                                                                                                         |
| Google Chat     | Adaptador simples de recebimento e envio com relação de thread mapeada para espaços e ids de thread. Auditar o comportamento de sala com `allowBots=true` para ecos marcados de falha do Gateway OpenClaw.                                                                                                                                                    |
| LINE            | Adaptador simples de recebimento e envio com restrições de token de resposta modeladas como capacidade de alvo/relação.                                                                                                                                                                                                                                        |
| Nextcloud Talk  | Ponte de recebimento SDK mais adaptador de envio.                                                                                                                                                                                                                                                                                                             |
| IRC             | Adaptador simples de recebimento e envio, sem recibos duráveis de edição.                                                                                                                                                                                                                                                                                     |
| Nostr           | Adaptador de recebimento e envio para DMs criptografadas; recibos são ids de evento.                                                                                                                                                                                                                                                                          |
| QA Channel      | Adaptador de teste de contrato para comportamento de recebimento, envio, live, repetição e recuperação.                                                                                                                                                                                                                                                       |
| Synology Chat   | Adaptador simples de recebimento e envio.                                                                                                                                                                                                                                                                                                                     |
| Tlon            | O adaptador de envio deve preservar a renderização de assinatura do modelo e o rastreamento de threads participantes antes que a entrega final durável genérica seja habilitada.                                                                                                                                                                             |
| Twitch          | Adaptador simples de recebimento e envio com classificação de limite de taxa.                                                                                                                                                                                                                                                                                 |
| Zalo            | Adaptador simples de recebimento e envio.                                                                                                                                                                                                                                                                                                                     |
| Zalo Personal   | Adaptador simples de recebimento e envio.                                                                                                                                                                                                                                                                                                                     |

## Plano de migração

### Fase 1: Domínio interno de mensagens

- Adicionar tipos `src/channels/message/*` para mensagens, alvos, relações,
  origens, recibos, capacidades, intenções duráveis, contexto de recebimento, contexto de envio,
  contexto live e classes de falha.
- Adicionar `origin?: MessageOrigin` ao tipo de payload da ponte de migração usado pela
  entrega de resposta atual; depois mover esse campo para `ChannelMessage` e tipos de
  mensagens renderizadas conforme a refatoração substitui payloads de resposta.
- Manter isso interno até que adaptadores e testes comprovem o formato.
- Adicionar testes unitários puros para transições de estado e serialização.

### Fase 2: Núcleo de envio durável

- Mover a fila de saída existente da durabilidade de payload de resposta para intenções duráveis
  de envio de mensagens.
- Permitir que uma intenção durável de envio carregue um array de payloads projetados ou plano de lote, não
  apenas um payload de resposta.
- Preservar o comportamento atual de recuperação da fila por meio de conversão de compatibilidade.
- Fazer `deliverOutboundPayloads` chamar `messages.send`.
- Tornar a durabilidade de envio final o padrão e falhar de forma fechada quando a intenção durável
  não puder ser escrita no novo ciclo de vida de mensagens, depois que o adaptador declarar
  segurança de repetição. Caminhos existentes de turno de canal e compatibilidade SDK permanecem
  como envio direto por padrão durante esta fase.
- Registrar recibos de forma consistente.
- Retornar recibos e resultados de entrega ao chamador original do dispatcher em vez
  de tratar o envio durável como efeito colateral terminal.
- Persistir a origem da mensagem por meio de intenções duráveis de envio para que recuperação, repetição e
  envios fragmentados preservem a proveniência operacional do OpenClaw.

### Fase 3: Ponte de turno de canal

- Reimplementar `channel.turn.run` e `dispatchAssembledChannelTurn` sobre
  `messages.receive` e `messages.send`.
- Manter estáveis os tipos de fatos atuais.
- Manter o comportamento legado por padrão. Um canal de turno montado se torna durável
  somente quando seu adaptador opta explicitamente por isso com uma política de durabilidade segura para repetição.
- Manter `durable: false` como uma saída de compatibilidade para caminhos que finalizam
  edições nativas e ainda não podem repetir com segurança, mas não depender de marcadores `false`
  para proteger canais não migrados.
- Tornar a durabilidade de turno montado padrão somente no novo ciclo de vida de mensagens, depois
  que o mapeamento de canal comprovar que o caminho genérico de envio preserva a semântica antiga
  de entrega do canal.

### Fase 4: Ponte de dispatcher preparado

- Substitua `deliverDurableInboundReplyPayload` por uma ponte de contexto de envio.
- Mantenha o helper antigo como um wrapper.
- Migre Telegram, WhatsApp, Slack, Signal, iMessage e Discord primeiro, porque
  eles já têm trabalho de final durável ou caminhos de envio mais simples.
- Trate todo dispatcher preparado como descoberto até que ele opte explicitamente
  pelo contexto de envio. A documentação e as entradas do changelog devem dizer
  "turnos de canal montados" ou nomear os caminhos de canal migrados, em vez de
  afirmar todas as respostas finais automáticas.
- Mantenha `recordInboundSessionAndDispatchReply`, helpers de DM direto e helpers
  públicos de compatibilidade semelhantes preservando o comportamento. Eles podem
  expor uma adesão explícita ao contexto de envio mais tarde, mas não devem tentar
  automaticamente a entrega durável genérica antes do callback de entrega de
  propriedade do chamador.

### Fase 5: Ciclo de Vida Live Unificado

- Crie `messages.live` com dois adaptadores de prova:
  - Telegram para envio mais edição mais envio final obsoleto.
  - Matrix para finalização de rascunho mais fallback de redação.
- Depois migre Discord, Slack, Mattermost, Teams, QQ Bot e Feishu.
- Exclua o código duplicado de finalização de prévia somente depois que cada
  canal tiver testes de paridade.

### Fase 6: SDK Público

- Adicione `openclaw/plugin-sdk/channel-message`.
- Documente-o como a API preferida de plugin de canal.
- Atualize exports do pacote, inventário de entrypoints, baselines de API
  geradas e documentação do SDK de plugin.
- Inclua `MessageOrigin`, hooks de codificação/decodificação de origem e o
  predicado compartilhado `shouldDropOpenClawEcho` na superfície do SDK
  channel-message.
- Mantenha wrappers de compatibilidade para subpaths antigos.
- Marque helpers do SDK nomeados por resposta como obsoletos na documentação
  depois que os plugins incluídos forem migrados.

### Fase 7: Todos os Remetentes

Mova todos os produtores de saída que não sejam respostas para `messages.send`:

- notificações de cron e heartbeat
- conclusões de tarefas
- resultados de hooks
- prompts de aprovação e resultados de aprovação
- envios da ferramenta de mensagens
- anúncios de conclusão de subagentes
- envios explícitos da CLI ou da UI de Controle
- caminhos de automação/broadcast

É aqui que o modelo deixa de ser "respostas do agente" e passa a ser "OpenClaw
envia mensagens".

### Fase 8: Depreciar Turn

- Mantenha `channel.turn` como um wrapper por pelo menos uma janela de
  compatibilidade.
- Publique notas de migração.
- Execute testes de compatibilidade do SDK de plugin contra imports antigos.
- Remova ou oculte helpers internos antigos somente depois que nenhum plugin
  incluído precisar deles e os contratos de terceiros tiverem uma substituição
  estável.

## Plano de testes

Testes unitários:

- Serialização e recuperação de intenção de envio durável.
- Reutilização de chave de idempotência e supressão de duplicatas.
- Commit de recibo e salto de replay.
- Recuperação de `unknown_after_send` que reconcilia antes do replay quando um
  adaptador oferece suporte à reconciliação.
- Política de classificação de falhas.
- Sequenciamento da política de ack de recebimento.
- Mapeamento de relações para envios de resposta, followup, sistema e broadcast.
- Fábrica de origem de falha de Gateway e predicado `shouldDropOpenClawEcho`.
- Preservação da origem por normalização de payload, chunking, serialização de
  fila durável e recuperação.

Testes de integração:

- Adaptador simples de `channel.turn.run` ainda registra e envia.
- Entrega legada de turno montado não se torna durável, a menos que o canal
  opte explicitamente por isso.
- Ponte de `channel.turn.runPrepared` ainda registra e finaliza.
- Helpers públicos de compatibilidade chamam callbacks de entrega de propriedade
  do chamador por padrão e não fazem envio genérico antes desses callbacks.
- Entrega durável de fallback reproduz todo o array de payloads projetados após
  reinício e não pode deixar os payloads posteriores sem registro após uma falha
  inicial.
- Entrega durável de turno montado retorna ids de mensagem da plataforma ao
  dispatcher em buffer.
- Hooks de entrega personalizados ainda retornam ids de mensagem da plataforma
  quando a entrega durável está desativada ou indisponível.
- Resposta final sobrevive a reinício entre a conclusão do assistente e o envio
  para a plataforma.
- Rascunho de prévia finaliza no lugar quando permitido.
- Rascunho de prévia é cancelado ou redigido quando incompatibilidade de
  mídia/erro/alvo de resposta exige entrega normal.
- Streaming de blocos e streaming de prévia não entregam ambos o mesmo texto.
- Mídia transmitida antecipadamente não é duplicada na entrega final.

Testes de canal:

- Resposta a tópico do Telegram com ack de polling atrasado até a marca d'água
  concluída segura do contexto de recebimento.
- Recuperação de polling do Telegram para atualizações aceitas mas não entregues
  coberta pelo modelo persistido de offset concluído seguro.
- Prévia obsoleta do Telegram envia final nova e limpa a prévia.
- Fallback silencioso do Telegram envia todo payload de fallback projetado.
- Durabilidade do fallback silencioso do Telegram registra atomically todo o
  array de fallback projetado, não uma intenção durável de payload único por
  iteração do loop.
- Cancelamento de prévia do Discord em mídia/erro/resposta explícita.
- Finais de dispatcher preparado do Discord passam pelo contexto de envio antes
  que documentação ou changelog afirmem durabilidade de resposta final do
  Discord.
- Envios finais duráveis do iMessage populam o cache de eco de mensagem enviada
  do monitor.
- Caminhos legados de entrega de LINE, Zalo e Nostr não são contornados por envio
  durável genérico até que existam testes de paridade dos adaptadores.
- Entrega por callback de Direct-DM/Nostr continua autoritativa, a menos que seja
  explicitamente migrada para um alvo de mensagem completo e um adaptador de
  envio seguro para replay.
- Mensagens marcadas de falha de gateway do OpenClaw no Slack permanecem visíveis
  na saída, ecos marcados da sala do bot caem antes de `allowBots`, e mensagens
  não marcadas de bots com o mesmo texto visível ainda seguem a autorização
  normal de bot.
- Fallback de stream nativo do Slack para prévia de rascunho em DMs de nível
  superior.
- Finalização de prévia do Matrix e fallback de redação.
- Ecos de sala de falha de gateway do OpenClaw marcados no Matrix vindos de
  contas de bot configuradas caem antes do tratamento de `allowBots`.
- Auditorias em cascata de falha de gateway em sala compartilhada de Discord e
  Google Chat cobrem modos `allowBots` antes de afirmar proteção genérica ali.
- Finalização de rascunho do Mattermost e fallback de envio novo.
- Finalização de progresso nativo do Teams.
- Supressão de final duplicado do Feishu.
- Fallback de timeout do acumulador do QQ Bot.
- Envios finais duráveis do Tlon preservam renderização de assinatura do modelo
  e rastreamento de thread participada.
- Envios finais duráveis simples de WhatsApp, Signal, iMessage, Google Chat,
  LINE, IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo e Zalo
  Personal.

Validação:

- Arquivos Vitest direcionados durante o desenvolvimento.
- `pnpm check:changed` no Testbox para toda a superfície alterada.
- `pnpm check` mais amplo no Testbox antes de integrar a refatoração completa ou
  após mudanças de SDK/export públicos.
- Smoke live ou qa-channel para pelo menos um canal capaz de edição e um canal
  simples somente de envio antes de remover wrappers de compatibilidade.

## Questões em aberto

- Se o Telegram deve eventualmente substituir a origem do runner grammY por uma
  origem de polling totalmente durável que possa controlar a reentrega no nível
  da plataforma, não apenas a marca d'água de reinício persistida do OpenClaw.
- Se o estado durável de prévia live deve ser armazenado no mesmo registro de
  fila da intenção de envio final ou em um armazenamento irmão de estado live.
- Por quanto tempo wrappers de compatibilidade permanecem documentados após
  `plugin-sdk/channel-message` ser lançado.
- Se plugins de terceiros devem implementar adaptadores de recebimento
  diretamente ou apenas fornecer hooks de normalização/envio/live por meio de
  `defineChannelMessageAdapter`.
- Quais campos de recibo são seguros para expor no SDK público versus estado de
  runtime interno.
- Se efeitos colaterais como caches de autoeco e marcadores de thread participada
  devem ser modelados como hooks de contexto de envio, etapas de finalização de
  propriedade do adaptador ou assinantes de recibo.
- Quais canais têm metadados de origem nativos, quais precisam de registries de
  saída persistidos e quais não conseguem oferecer supressão confiável de eco
  entre bots.

## Critérios de aceitação

- Todo canal de mensagens incluído envia saída final visível por meio de
  `messages.send`.
- Todo canal de mensagens de entrada entra por `messages.receive` ou por um
  wrapper de compatibilidade documentado.
- Todo canal de prévia/edição/stream usa `messages.live` para estado de rascunho
  e finalização.
- `channel.turn` é apenas um wrapper.
- Helpers do SDK nomeados por resposta são exports de compatibilidade, não o
  caminho recomendado.
- A recuperação durável consegue reproduzir envios finais pendentes após reinício
  sem perder a resposta final ou duplicar envios já com commit; envios cujo
  resultado na plataforma é desconhecido são reconciliados antes do replay ou
  documentados como pelo menos uma vez para esse adaptador.
- Envios finais duráveis falham fechados quando a intenção durável não pode ser
  gravada, a menos que um chamador tenha selecionado explicitamente um modo não
  durável documentado.
- Helpers legados de channel-turn e compatibilidade do SDK usam entrega direta de
  propriedade do canal por padrão; envio durável genérico é somente adesão
  explícita.
- Recibos preservam todos os ids de mensagem da plataforma para entregas em
  várias partes e um id primário para conveniência de threading/edição.
- Wrappers duráveis preservam efeitos colaterais locais do canal antes de
  substituir callbacks de entrega direta.
- Dispatchers preparados não são contados como duráveis até que seu caminho de
  entrega final use explicitamente o contexto de envio.
- Entrega de fallback lida com todo payload projetado.
- Entrega durável de fallback registra todo payload projetado em uma intenção ou
  plano de lote reproduzível.
- Saída de falha de gateway originada pelo OpenClaw é visível para humanos, mas
  ecos de sala marcados e criados por bot são descartados antes da autorização de
  bot em canais que declaram suporte ao contrato de origem.
- A documentação explica envio, recebimento, live, estado, recibos, relações,
  política de falhas, migração e cobertura de testes.

## Relacionados

- [Mensagens](/pt-BR/concepts/messages)
- [Streaming e chunking](/pt-BR/concepts/streaming)
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts)
- [Política de retry](/pt-BR/concepts/retry)
- [Kernel de turno de canal](/pt-BR/plugins/sdk-channel-turn)
