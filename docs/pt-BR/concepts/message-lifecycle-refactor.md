---
read_when:
    - Refatorando o comportamento de envio ou recebimento do canal
    - Alteração de entrada de canal, despacho de respostas, fila de saída, streaming de pré-visualização ou APIs de mensagem do SDK de Plugin
    - Projetando um novo Plugin de canal que precisa de envios duráveis, recibos, prévias, edições ou novas tentativas
summary: Plano de design para o ciclo de vida unificado e durável de recebimento, envio, pré-visualização, edição e streaming de mensagens
title: Refatoração do ciclo de vida das mensagens
x-i18n:
    generated_at: "2026-06-27T17:25:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Esta página é o design-alvo para substituir auxiliares espalhados de entrada de canal, despacho de respostas, streaming de prévia e entrega de saída por um ciclo de vida de mensagens durável único.

A versão curta:

- As primitivas centrais devem ser **receber** e **enviar**, não **responder**.
- Uma resposta é apenas uma relação em uma mensagem de saída.
- Um turno é uma conveniência de processamento de entrada, não o proprietário da entrega.
- O envio deve ser baseado em contexto: `begin`, renderizar, prévia ou stream, envio final, commit, falha.
- O recebimento também deve ser baseado em contexto: normalizar, deduplicar, rotear, registrar, despachar, confirmação da plataforma, falha.
- O SDK público de Plugin deve ser reduzido a uma pequena superfície única de saída de canal.

## Problemas

A pilha atual de canais cresceu a partir de várias necessidades locais válidas:

- Adaptadores de entrada simples usam `runtime.channel.inbound.run`.
- Adaptadores ricos usam `runtime.channel.inbound.runPreparedReply`.
- Auxiliares legados usam `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, auxiliares de payload de resposta, fragmentação de respostas, referências de resposta e auxiliares de runtime de saída.
- O streaming de prévia vive em despachadores específicos de canal.
- A durabilidade da entrega final está sendo adicionada em torno dos caminhos existentes de payload de resposta.

Esse formato corrige bugs locais, mas deixa o OpenClaw com conceitos públicos demais e lugares demais onde a semântica de entrega pode divergir.

O problema de confiabilidade que expôs isso é:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

A invariante-alvo é mais ampla que Telegram: uma vez que o núcleo decide que uma mensagem de saída visível deve existir, a intenção deve ser durável antes que o envio pela plataforma seja tentado, e o recibo da plataforma deve receber commit após o sucesso. Isso dá ao OpenClaw recuperação pelo menos uma vez. O comportamento exatamente uma vez existe apenas para adaptadores que conseguem provar idempotência nativa ou reconciliar uma tentativa com resultado desconhecido após envio contra o estado da plataforma antes de reproduzir.

Esse é o estado final desta refatoração, não uma descrição de todos os caminhos atuais. Durante a migração, os auxiliares de saída existentes ainda podem cair para um envio direto quando gravações de fila de melhor esforço falham. A refatoração só estará concluída quando os envios finais duráveis falharem fechados ou optarem explicitamente por sair com uma política não durável documentada.

## Objetivos

- Um ciclo de vida central para todos os caminhos de recebimento e envio de mensagens de canal.
- Envios finais duráveis por padrão no novo ciclo de vida de mensagens depois que um adaptador declarar comportamento seguro para reprodução.
- Semânticas compartilhadas de prévia, edição, stream, finalização, nova tentativa, recuperação e recibo.
- Uma pequena superfície de SDK de Plugin que plugins de terceiros possam aprender e manter.
- Compatibilidade para chamadores existentes de compatibilidade de resposta de entrada durante a migração.
- Pontos de extensão claros para novos recursos de canal.
- Nenhum desvio específico de plataforma no núcleo.
- Nenhuma mensagem de canal por delta de token. O streaming de canal continua sendo entrega de prévia de mensagem, edição, acréscimo ou bloco concluído.
- Metadados estruturados de origem OpenClaw para saída operacional/de sistema, para que falhas visíveis do Gateway não entrem novamente em salas compartilhadas habilitadas para bot como novos prompts.

## Não objetivos

- Não forçar todos os canais existentes a usar entrega durável de mensagens na primeira fase.
- Não forçar todos os canais ao mesmo comportamento de transporte nativo.
- Não ensinar ao núcleo tópicos do Telegram, streams nativos do Slack, redações do Matrix, cartões do Feishu, voz do QQ ou atividades do Teams.
- Não publicar todos os auxiliares internos de migração como API estável do SDK.
- Não fazer novas tentativas reproduzirem operações de plataforma não idempotentes concluídas.

## Modelo de referência

O Vercel Chat tem um bom modelo mental público:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- métodos de adaptador como `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` e buscas de histórico
- um adaptador de estado para deduplicação, bloqueios, filas e persistência

O OpenClaw deve tomar emprestado o vocabulário, não copiar a superfície.

O que o OpenClaw precisa além desse modelo:

- Intenções duráveis de envio de saída antes de chamadas diretas de transporte.
- Contextos explícitos de envio com início, commit e falha.
- Contextos de recebimento que conhecem a política de confirmação da plataforma.
- Recibos que sobrevivem a reinicializações e podem conduzir edições, exclusões, recuperação e supressão de duplicatas.
- Um SDK público menor. Plugins empacotados podem usar auxiliares internos de runtime, mas plugins de terceiros devem ver uma API de mensagens coerente.
- Comportamento específico de agente: sessões, transcrições, streaming de blocos, progresso de ferramentas, aprovações, diretivas de mídia, respostas silenciosas e histórico de menções em grupo.

Promessas no estilo `thread.post()` não são suficientes para o OpenClaw. Elas ocultam o limite transacional que decide se um envio é recuperável.

## Modelo central

O novo domínio deve viver sob um namespace central interno como `src/channels/message/*`.

Ele tem quatro conceitos:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` é proprietário do ciclo de vida de entrada.

`send` é proprietário do ciclo de vida de saída.

`live` é proprietário do estado de prévia, edição, progresso e stream.

`state` é proprietário de armazenamento durável de intenção, recibos, idempotência, recuperação, bloqueios e deduplicação.

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

### Destino

O destino descreve onde a mensagem vive:

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

Isso permite que o mesmo caminho de envio lide com respostas normais, notificações de Cron, prompts de aprovação, conclusões de tarefa, envios por ferramenta de mensagens, envios por CLI ou Control UI, resultados de subagente e envios de automação.

### Origem

Origem descreve quem produziu uma mensagem e como o OpenClaw deve tratar ecos dessa mensagem. Ela é separada da relação: uma mensagem pode ser uma resposta a um usuário e ainda ser uma saída operacional originada pelo OpenClaw.

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

O núcleo é proprietário do significado da saída originada pelo OpenClaw. Os canais são proprietários de como essa origem é codificada em seu transporte.

O primeiro uso obrigatório é a saída de falha do Gateway. Humanos ainda devem ver mensagens como "Agent failed before reply" ou "Missing API key", mas a saída operacional marcada do OpenClaw não deve ser aceita como entrada de autoria de bot em salas compartilhadas quando `allowBots` está habilitado.

### Recibo

Recibos são de primeira classe:

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

Recibos são a ponte entre a intenção durável e edição futura, exclusão, finalização de prévia, supressão de duplicatas e recuperação.

Um recibo pode descrever uma mensagem de plataforma ou uma entrega em várias partes. Texto fragmentado, mídia mais texto, voz mais texto e fallbacks de cartão devem preservar todos os ids de plataforma enquanto ainda expõem um id primário para encadeamento e edições posteriores.

## Contexto de recebimento

Receber não deve ser uma chamada auxiliar simples. O núcleo precisa de um contexto que conheça deduplicação, roteamento, registro de sessão e política de confirmação da plataforma.

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

Confirmação não é uma coisa só. O contrato de recebimento deve manter estes sinais separados:

- **Confirmação de transporte:** informa ao Webhook ou socket da plataforma que o OpenClaw aceitou o envelope do evento. Algumas plataformas exigem isso antes do despacho.
- **Confirmação de deslocamento de polling:** avança um cursor para que o mesmo evento não seja buscado novamente. Isso não deve avançar além de trabalho que não pode ser recuperado.
- **Confirmação de registro de entrada:** confirma que o OpenClaw persistiu metadados de entrada suficientes para deduplicar e rotear uma nova entrega.
- **Recibo visível ao usuário:** comportamento opcional de leitura/status/digitação; nunca é um limite de durabilidade.

`ReceiveAckPolicy` controla apenas a confirmação de transporte ou polling. Ela não deve ser reutilizada para recibos de leitura ou reações de status.

Antes da autorização de bot, o recebimento deve aplicar a política compartilhada de eco do OpenClaw quando o canal consegue decodificar metadados de origem da mensagem:

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

Essa remoção é baseada em tag, não em texto. Uma mensagem de sala de autoria de bot com o mesmo texto visível de falha do Gateway, mas sem metadados de origem OpenClaw, ainda passa pela autorização normal de `allowBots`.

A política de confirmação é explícita:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

O polling do Telegram agora usa a política de confirmação do contexto de recebimento para sua marca d'água de reinicialização persistida. O rastreador ainda observa atualizações do grammY à medida que elas entram na cadeia de middleware, mas o OpenClaw persiste apenas o id seguro de atualização concluída após despacho bem-sucedido, deixando atualizações com falha ou pendentes inferiores reproduzíveis após uma reinicialização. O offset de busca `getUpdates` upstream do Telegram ainda é controlado pela biblioteca de polling, então o recorte mais profundo restante é uma fonte de polling totalmente durável se precisarmos de nova entrega em nível de plataforma além da marca d'água de reinicialização do OpenClaw. Plataformas de Webhook podem precisar de confirmação HTTP imediata, mas ainda precisam de deduplicação de entrada e intenções duráveis de envio de saída, porque Webhooks podem entregar novamente.

## Contexto de envio

O envio também é baseado em contexto:

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

Orquestração preferida:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

O auxiliar se expande para:

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

A intenção precisa existir antes de E/S de transporte. Uma reinicialização após o início, mas antes do commit, é recuperável.

O limite perigoso fica depois do sucesso da plataforma e antes do commit do comprovante. Se um processo morrer ali, o OpenClaw não consegue saber se a mensagem da plataforma existe, a menos que o adaptador forneça idempotência nativa ou um caminho de reconciliação de comprovantes. Essas tentativas precisam ser retomadas em `unknown_after_send`, não repetidas às cegas. Canais sem reconciliação podem escolher repetição pelo menos uma vez somente se mensagens visíveis duplicadas forem uma troca aceitável e documentada para esse canal e relação. A ponte de reconciliação do SDK atual exige que o adaptador declare `reconcileUnknownSend`, depois pede que `durableFinal.reconcileUnknownSend` classifique uma entrada desconhecida como `sent`, `not_sent` ou `unresolved`; somente `not_sent` permite repetição, e entradas não resolvidas permanecem terminais ou repetem apenas a verificação de reconciliação.

A política de durabilidade precisa ser explícita:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` significa que o core precisa falhar de forma fechada quando não consegue gravar a intenção durável. `best_effort` pode prosseguir quando a persistência está indisponível. `disabled` mantém o comportamento antigo de envio direto. Durante a migração, wrappers legados e auxiliares públicos de compatibilidade usam `disabled` como padrão; eles não devem inferir `required` pelo fato de um canal ter um adaptador genérico de saída.

Contextos de envio também são responsáveis por efeitos pós-envio locais do canal. Uma migração não é segura se a entrega durável contornar comportamento local que antes estava anexado ao caminho de envio direto do canal. Exemplos incluem caches de supressão de eco próprio, marcadores de participação em thread, âncoras de edição nativas, renderização de assinatura do modelo e guardas de duplicação específicos da plataforma. Esses efeitos precisam ser movidos para o adaptador de envio, o adaptador de renderização ou um hook nomeado de contexto de envio antes que esse canal possa habilitar entrega final genérica durável.

Auxiliares de envio precisam retornar comprovantes até o chamador. Wrappers duráveis não podem engolir ids de mensagens nem substituir um resultado de entrega do canal por `undefined`; despachantes com buffer usam esses ids para âncoras de thread, edições posteriores, finalização de prévia e supressão de duplicatas.

Envios de fallback operam em lotes, não em payloads únicos. Reescritas de resposta silenciosa, fallback de mídia, fallback de cartões e projeção de fragmentos podem produzir mais de uma mensagem entregável, então um contexto de envio precisa entregar o lote projetado inteiro ou documentar explicitamente por que apenas um payload é válido.

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

Quando esse tipo de fallback é durável, o lote projetado inteiro precisa ser representado por uma única intenção de envio durável ou por outro plano de lote atômico. Registrar cada payload um por um não é suficiente: uma falha entre payloads pode deixar um fallback visível parcial sem registro durável para os payloads restantes. A recuperação precisa saber quais unidades já têm comprovantes e repetir apenas as unidades ausentes ou marcar o lote como `unknown_after_send` até que o adaptador o reconcilie.

## Contexto ao vivo

Comportamentos de prévia, edição, progresso e stream devem ser um único ciclo de vida opt-in.

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

O estado ao vivo é durável o bastante para recuperar ou suprimir duplicatas:

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

- Envio do Telegram mais prévia de edição, com final nova após a idade da prévia obsoleta.
- Envio do Discord mais prévia de edição, cancelamento em mídia/erro/resposta explícita.
- Stream nativo do Slack ou prévia de rascunho dependendo do formato da thread.
- Finalização de post de rascunho do Mattermost.
- Finalização de evento de rascunho do Matrix ou redação em caso de incompatibilidade.
- Stream de progresso nativo do Teams.
- Stream do QQ Bot ou fallback acumulado.

## Superfície do adaptador

O alvo público do SDK deve ser um único subcaminho:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

Formato alvo:

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

Antes da autorização de preflight, o core precisa executar o predicado compartilhado de eco do OpenClaw sempre que `origin.decode` retornar metadados de origem OpenClaw. O adaptador de recebimento fornece fatos da plataforma, como autor bot e formato da sala; o core é responsável pela decisão de descarte e pela ordenação para que os canais não reimplementem filtros de texto.

Adaptador de origem:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

O core define `MessageOrigin`. Os canais apenas o traduzem de e para metadados de transporte nativos. O Slack mapeia isso para `chat.postMessage({ metadata })` e `message.metadata` de entrada; o Matrix pode mapear para conteúdo extra de evento; canais sem metadados nativos podem usar um registro de comprovantes/saída quando essa for a melhor aproximação disponível.

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
- auxiliares ad hoc de ciclo de vida de stream de rascunho

Subcaminhos de compatibilidade podem permanecer como wrappers, mas novos plugins de terceiros não devem precisar deles.

Plugins empacotados podem manter importações de auxiliares internos por subcaminhos reservados de runtime durante a migração. A documentação pública deve direcionar autores de plugins para `plugin-sdk/channel-outbound` assim que ele existir.

## Relação com entrada de canal

`runtime.channel.inbound.*` é a ponte de runtime durante a migração.

Ela deve se tornar um adaptador de compatibilidade:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` também deve permanecer inicialmente:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

A superfície antiga de runtime `channel.turn` foi removida. Chamadores de runtime usam `channel.inbound.*`; a documentação de canais e os subcaminhos do SDK usam substantivos de entrada/mensagem.

## Guardrails de compatibilidade

Durante a migração, a entrega genérica durável é opt-in para qualquer canal cujo callback de entrega existente tenha efeitos colaterais além de "enviar este payload".

Pontos de entrada legados não são duráveis por padrão:

- `channel.inbound.run` e `dispatchChannelInboundReply` usam o callback de entrega do canal, a menos que esse canal forneça explicitamente um objeto auditado de política/opções duráveis.
- `channel.inbound.runPreparedReply` continua sob responsabilidade do canal até que o despachante preparado chame explicitamente o contexto de envio.
- Auxiliares públicos de compatibilidade, como `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` e auxiliares de DM direta, nunca injetam entrega genérica durável antes do callback `deliver` ou `reply` fornecido pelo chamador.

Para tipos de ponte de migração, `durable: undefined` significa "não durável". O caminho durável é habilitado somente por um valor explícito de política/opções. `durable:
false` pode permanecer como uma grafia de compatibilidade, mas a implementação não deve exigir que todo canal não migrado o adicione.

O código atual da ponte precisa manter a decisão de durabilidade explícita:

- A entrega final durável retorna um status discriminado. `handled_visible` e
  `handled_no_send` são terminais; `unsupported` e `not_applicable` podem
  recorrer à entrega pertencente ao canal; `failed` propaga a falha de envio.
- A entrega final durável genérica é controlada por capacidades do adaptador,
  como entrega silenciosa, preservação do destino de resposta, preservação de
  citação nativa e hooks de envio de mensagens. A falta de paridade deve escolher
  a entrega pertencente ao canal, não um envio genérico que altera o comportamento
  visível ao usuário.
- Envios duráveis com suporte de fila expõem uma referência de intenção de
  entrega. Os campos de sessão `pendingFinalDelivery*` existentes podem carregar
  o id da intenção durante a transição; o estado final é um armazenamento
  `MessageSendIntent` em vez de texto de resposta congelado mais campos de
  contexto ad hoc.

Não habilite o caminho durável genérico para um canal até que tudo isto seja
verdadeiro:

- O adaptador de envio genérico executa o mesmo comportamento de renderização e transporte que
  o antigo caminho direto.
- Efeitos colaterais locais pós-envio são preservados por meio do contexto de envio.
- O adaptador retorna recibos ou resultados de entrega com todos os ids de mensagem
  da plataforma.
- Caminhos de dispatcher preparados chamam o novo contexto de envio ou permanecem documentados
  como fora da garantia durável.
- A entrega de fallback processa todo payload projetado, não apenas o primeiro.
- A entrega de fallback durável registra todo o array de payload projetado como uma
  intenção reproduzível ou plano de lote.

Riscos concretos de migração a preservar:

- A entrega do monitor do iMessage registra mensagens enviadas em um cache de eco após um
  envio bem-sucedido. Envios finais duráveis ainda devem preencher esse cache; caso contrário,
  OpenClaw pode reinserir suas próprias respostas finais como mensagens de usuário recebidas.
- Tlon acrescenta uma assinatura opcional do modelo e registra threads participantes
  após respostas em grupo. A entrega durável genérica não deve contornar esses efeitos;
  mova-os para adaptadores de renderização/envio/finalização do Tlon ou mantenha o Tlon no
  caminho pertencente ao canal.
- Discord e outros dispatchers preparados já possuem comportamento de entrega direta e
  pré-visualização. Eles não são cobertos por uma garantia durável de turno montado até que
  seus dispatchers preparados encaminhem explicitamente finais pelo contexto de envio.
- A entrega de fallback silenciosa do Telegram deve entregar o array completo de payloads
  projetados. Um atalho de payload único pode descartar payloads de fallback adicionais após
  a projeção.
- LINE, Zalo, Nostr e outros caminhos montados/auxiliares existentes podem
  ter processamento de token de resposta, proxy de mídia, caches de mensagens enviadas, limpeza de carregamento/status
  ou destinos somente de callback. Eles permanecem na entrega pertencente ao canal até que
  essas semânticas sejam representadas pelo adaptador de envio e verificadas por testes.
- Auxiliares de DM direta podem ter um callback de resposta que é o único destino de transporte
  correto. A saída genérica não deve adivinhar a partir de `OriginatingTo` ou `To` e ignorar
  esse callback.
- A saída de falha do Gateway do OpenClaw deve permanecer visível para humanos, mas ecos de sala
  marcados como criados por bot devem ser descartados antes da autorização `allowBots`.
  Canais não devem implementar isso com filtros de prefixo de texto visível, exceto como uma
  medida emergencial curta; o contrato durável é metadados estruturados de origem.

## Armazenamento interno

A fila durável deve armazenar intenções de envio de mensagens, não payloads de resposta.

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
thread, destino, política de formatação e regras de mídia após a reinicialização.

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

Política do núcleo:

- Tentar novamente `transient` e `rate_limit`.
- Não tentar novamente `invalid_payload`, a menos que exista um fallback de renderização.
- Não tentar novamente `auth` ou `permission` até que a configuração mude.
- Para `not_found`, permita que a finalização ao vivo faça fallback de edição para envio novo quando
  o canal declarar que isso é seguro.
- Para `conflict`, use regras de recibo/idempotência para decidir se a mensagem
  já existe.
- Qualquer erro após o adaptador possivelmente ter concluído E/S da plataforma, mas antes do commit
  do recibo, torna-se `unknown_after_send`, a menos que o adaptador possa provar que a operação
  da plataforma não aconteceu.

## Mapeamento de canais

| Canal           | Migração alvo                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Receber política de confirmação mais envios finais duráveis. O adaptador live controla o envio mais a edição da prévia, envio final de prévia obsoleta, tópicos, salto de prévia de resposta com citação, fallback de mídia e tratamento de retry-after.                                                                                                      |
| Discord         | O adaptador de envio encapsula a entrega existente de payload durável. O adaptador live controla edição de rascunho, rascunho de progresso, cancelamento de prévia de mídia/erro, preservação do destino da resposta e recibos de id de mensagem. Auditar ecos de falha de Gateway criados por bot em salas compartilhadas; usar um registro de saída ou outro equivalente nativo se o Discord não puder carregar metadados de origem em mensagens normais. |
| Slack           | O adaptador de envio lida com publicações normais no chat. O adaptador live escolhe stream nativo quando o formato da thread permite; caso contrário, usa prévia em rascunho. Recibos preservam timestamps da thread. O adaptador de origem mapeia falhas do Gateway da OpenClaw para `chat.postMessage.metadata` do Slack e descarta ecos de salas de bot marcados antes da autorização `allowBots`. |
| WhatsApp        | O adaptador de envio controla envio de texto/mídia com intenções finais duráveis. O adaptador de recebimento lida com menção em grupo e identidade do remetente. Live pode permanecer ausente até que o WhatsApp tenha um transporte editável.                                                                                                                 |
| Matrix          | O adaptador live controla edições de eventos de rascunho, finalização, redação, restrições de mídia criptografada e fallback para divergência de destino de resposta. O adaptador de recebimento controla hidratação e deduplicação de eventos criptografados. O adaptador de origem deve codificar a origem de falha do Gateway da OpenClaw no conteúdo do evento do Matrix e descartar ecos de sala do bot configurado antes do tratamento de `allowBots`. |
| Mattermost      | O adaptador live controla uma publicação de rascunho, dobra de progresso/ferramenta, finalização no lugar e fallback de envio novo.                                                                                                                                                                                                                            |
| Microsoft Teams | O adaptador live controla progresso nativo e comportamento de stream em blocos. O adaptador de envio controla atividades e recibos de anexos/cartões.                                                                                                                                                                                                          |
| Feishu          | O adaptador de renderização controla renderização de texto/cartão/bruta. O adaptador live controla cartões em streaming e supressão de final duplicado. O adaptador de envio controla comentários, sessões de tópico, mídia e supressão de voz.                                                                                                                |
| QQ Bot          | O adaptador live controla streaming C2C, timeout do acumulador e envio final de fallback. O adaptador de renderização controla tags de mídia e texto como voz.                                                                                                                                                                                                 |
| Signal          | Adaptador simples de recebimento mais envio. Sem adaptador live, a menos que signal-cli adicione suporte confiável a edição.                                                                                                                                                                                                                                   |
| iMessage        | Adaptador simples de recebimento mais envio. O envio do iMessage deve preservar o preenchimento do cache de ecos do monitor antes que finais duráveis possam ignorar a entrega pelo monitor.                                                                                                                                                                  |
| Google Chat     | Adaptador simples de recebimento mais envio, com relação de thread mapeada para spaces e ids de thread. Auditar comportamento de sala com `allowBots=true` para ecos marcados de falha do Gateway da OpenClaw.                                                                                                                                                  |
| LINE            | Adaptador simples de recebimento mais envio, com restrições de reply-token modeladas como capacidade de destino/relação.                                                                                                                                                                                                                                       |
| Nextcloud Talk  | Ponte de recebimento do SDK mais adaptador de envio.                                                                                                                                                                                                                                                                                                           |
| IRC             | Adaptador simples de recebimento mais envio, sem recibos duráveis de edição.                                                                                                                                                                                                                                                                                   |
| Nostr           | Adaptador de recebimento mais envio para DMs criptografadas; recibos são ids de evento.                                                                                                                                                                                                                                                                        |
| QA Channel      | Adaptador de teste de contrato para comportamento de recebimento, envio, live, repetição e recuperação.                                                                                                                                                                                                                                                        |
| Synology Chat   | Adaptador simples de recebimento mais envio.                                                                                                                                                                                                                                                                                                                   |
| Tlon            | O adaptador de envio deve preservar a renderização de assinatura do modelo e o rastreamento de threads participadas antes que a entrega final durável genérica seja habilitada.                                                                                                                                                                               |
| Twitch          | Adaptador simples de recebimento mais envio, com classificação de limite de taxa.                                                                                                                                                                                                                                                                              |
| Zalo            | Adaptador simples de recebimento mais envio.                                                                                                                                                                                                                                                                                                                   |
| Zalo Personal   | Adaptador simples de recebimento mais envio.                                                                                                                                                                                                                                                                                                                   |

## Plano de migração

### Fase 1: Domínio interno de mensagens

- Adicionar tipos `src/channels/message/*` para mensagens, destinos, relações,
  origens, recibos, capacidades, intenções duráveis, contexto de recebimento, contexto de envio,
  contexto live e classes de falha.
- Adicionar `origin?: MessageOrigin` ao tipo de payload da ponte de migração usado pela
  entrega de resposta atual; depois mover esse campo para `ChannelMessage` e tipos de
  mensagem renderizada conforme a refatoração substitui payloads de resposta.
- Manter isso interno até que adaptadores e testes comprovem o formato.
- Adicionar testes unitários puros para transições de estado e serialização.

### Fase 2: Núcleo de envio durável

- Mover a fila de saída existente da durabilidade de payload de resposta para intenções
  de envio de mensagem durável.
- Permitir que uma intenção de envio durável carregue um array de payloads projetado ou plano
  de lote, não apenas um payload de resposta.
- Preservar o comportamento atual de recuperação da fila por meio de conversão de compatibilidade.
- Fazer `deliverOutboundPayloads` chamar `messages.send`.
- Tornar a durabilidade de envio final o padrão e falhar fechado quando a intenção durável
  não puder ser escrita no novo ciclo de vida de mensagens, depois que o adaptador declarar
  segurança de replay. Os caminhos existentes do executor de entrada e de compatibilidade do SDK permanecem
  como envio direto por padrão durante esta fase.
- Registrar recibos de forma consistente.
- Retornar recibos e resultados de entrega ao chamador original do dispatcher, em vez de
  tratar o envio durável como um efeito colateral terminal.
- Persistir a origem da mensagem por meio de intenções de envio durável para que recuperação, replay e
  envios em partes preservem a proveniência operacional da OpenClaw.

### Fase 3: Ponte de entrada de canais

- Reimplementar `channel.inbound.run` e `dispatchChannelInboundReply` sobre
  `messages.receive` e `messages.send`.
- Manter estáveis os tipos de fatos atuais.
- Manter o comportamento legado por padrão. Um canal de turno montado torna-se durável
  somente quando seu adaptador adere explicitamente com uma política de durabilidade segura para replay.
- Manter `durable: false` como uma saída de compatibilidade para caminhos que finalizam
  edições nativas e ainda não podem fazer replay com segurança, mas não depender de marcadores `false`
  para proteger canais não migrados.
- Padronizar durabilidade de turno montado somente no novo ciclo de vida de mensagens, depois
  que o mapeamento de canal comprovar que o caminho de envio genérico preserva a semântica antiga
  de entrega do canal.

### Fase 4: Ponte de dispatcher preparado

- Substitua `deliverDurableInboundReplyPayload` por uma ponte de contexto de envio.
- Mantenha o helper antigo como um wrapper.
- Migre Telegram, WhatsApp, Slack, Signal, iMessage e Discord primeiro porque
  eles já têm trabalho de finais duráveis ou caminhos de envio mais simples.
- Trate todo despachante preparado como sem cobertura até que ele opte
  explicitamente pelo contexto de envio. A documentação e as entradas do
  changelog devem dizer "turnos de canal montados" ou nomear os caminhos de
  canal migrados, em vez de afirmar todas as respostas finais automáticas.
- Mantenha `recordInboundSessionAndDispatchReply`, helpers de DM direta e
  helpers públicos de compatibilidade semelhantes preservando o comportamento.
  Eles podem expor uma adesão explícita ao contexto de envio posteriormente, mas
  não devem tentar automaticamente a entrega durável genérica antes do callback
  de entrega pertencente ao chamador.

### Fase 5: Ciclo de Vida Live Unificado

- Crie `messages.live` com dois adaptadores de prova:
  - Telegram para envio mais edição mais envio final obsoleto.
  - Matrix para finalização de rascunho mais fallback de redação.
- Em seguida, migre Discord, Slack, Mattermost, Teams, QQ Bot e Feishu.
- Exclua o código duplicado de finalização de prévia somente depois que cada
  canal tiver testes de paridade.

### Fase 6: SDK Público

- Adicione `openclaw/plugin-sdk/channel-outbound`.
- Documente-o como a API preferida de Plugin de canal.
- Atualize exports do pacote, inventário de entrypoints, baselines de API
  gerados e documentação do SDK de Plugin.
- Inclua `MessageOrigin`, hooks de codificação/decodificação de origem e o
  predicado compartilhado `shouldDropOpenClawEcho` na superfície do SDK
  channel-outbound.
- Mantenha wrappers de compatibilidade para subcaminhos antigos.
- Marque helpers do SDK nomeados como resposta como obsoletos na documentação
  depois que os plugins empacotados forem migrados.

### Fase 7: Todos os Remetentes

Mova todos os produtores de saída que não são respostas para `messages.send`:

- notificações de Cron e Heartbeat
- conclusões de tarefas
- resultados de hooks
- prompts de aprovação e resultados de aprovação
- envios da ferramenta de mensagens
- anúncios de conclusão de subagente
- envios explícitos da CLI ou da Control UI
- caminhos de automação/transmissão

É aqui que o modelo deixa de ser "respostas do agente" e passa a ser "OpenClaw
envia mensagens".

### Fase 8: Remover Compatibilidade Nomeada por Turno

- Mantenha wrappers nomeados como entrada/mensagem como a janela de
  compatibilidade.
- Publique notas de migração.
- Execute testes de compatibilidade do SDK de Plugin contra imports antigos.
- Remova ou oculte helpers internos antigos somente depois que nenhum Plugin
  empacotado precisar deles e os contratos de terceiros tiverem um substituto
  estável.

## Plano de testes

Testes de unidade:

- Serialização e recuperação de intenção de envio durável.
- Reutilização de chave de idempotência e supressão de duplicatas.
- Confirmação de recibo e salto de repetição.
- Recuperação de `unknown_after_send` que reconcilia antes da repetição quando
  um adaptador oferece suporte a reconciliação.
- Política de classificação de falhas.
- Sequenciamento da política de confirmação de recebimento.
- Mapeamento de relações para envios de resposta, acompanhamento, sistema e
  transmissão.
- Fábrica de origem de falha de Gateway e predicado `shouldDropOpenClawEcho`.
- Preservação de origem por normalização de payload, chunking, serialização de
  fila durável e recuperação.

Testes de integração:

- O adaptador simples de `channel.inbound.run` ainda registra e envia.
- A entrega legada de evento montado não se torna durável, a menos que o canal
  opte explicitamente por isso.
- A ponte `channel.inbound.runPreparedReply` ainda registra e finaliza.
- Helpers públicos de compatibilidade chamam callbacks de entrega pertencentes
  ao chamador por padrão e não fazem envio genérico antes desses callbacks.
- A entrega de fallback durável repete todo o array de payload projetado após
  reinicialização e não pode deixar os payloads posteriores sem registro após
  uma falha antecipada.
- A entrega durável de evento montado retorna ids de mensagem da plataforma para
  o despachante com buffer.
- Hooks de entrega personalizados ainda retornam ids de mensagem da plataforma
  quando a entrega durável está desabilitada ou indisponível.
- A resposta final sobrevive à reinicialização entre a conclusão do assistente e
  o envio para a plataforma.
- O rascunho de prévia é finalizado no lugar quando permitido.
- O rascunho de prévia é cancelado ou redigido quando mídia/erro/incompatibilidade
  de alvo de resposta exige entrega normal.
- Streaming de bloco e streaming de prévia não entregam ambos o mesmo texto.
- Mídia transmitida antecipadamente não é duplicada na entrega final.

Testes de canal:

- Resposta de tópico no Telegram com confirmação de polling atrasada até a marca
  d'água concluída segura do contexto de recebimento.
- Recuperação de polling do Telegram para atualizações aceitas, mas não
  entregues, coberta pelo modelo de offset concluído seguro persistido.
- Prévia obsoleta do Telegram envia final novo e limpa a prévia.
- Fallback silencioso do Telegram envia todo payload de fallback projetado.
- Durabilidade do fallback silencioso do Telegram registra o array completo de
  fallback projetado atomicamente, não uma única intenção durável de payload
  único por iteração do loop.
- Cancelamento de prévia do Discord em mídia/erro/resposta explícita.
- Finais de despachante preparado do Discord passam pelo contexto de envio antes
  que a documentação ou o changelog afirmem durabilidade de resposta final do
  Discord.
- Envios finais duráveis do iMessage populam o cache de eco de mensagem enviada
  do monitor.
- Caminhos legados de entrega de LINE, Zalo e Nostr não são contornados por
  envio durável genérico até que existam testes de paridade de seus adaptadores.
- A entrega por callback de DM direta/Nostr continua autoritativa, a menos que
  seja explicitamente migrada para um alvo de mensagem completo e um adaptador
  de envio seguro para repetição.
- Mensagens de falha do Gateway do OpenClaw marcadas no Slack permanecem
  visíveis na saída, ecos de sala de bot marcados são descartados antes de
  `allowBots`, e mensagens de bot não marcadas com o mesmo texto visível ainda
  seguem a autorização normal de bot.
- Fallback de stream nativo do Slack para prévia de rascunho em DMs de nível
  superior.
- Finalização de prévia e fallback de redação do Matrix.
- Ecos de sala de falha de Gateway do OpenClaw marcados no Matrix a partir de
  contas de bot configuradas são descartados antes do tratamento de `allowBots`.
- Auditorias de cascata de falha de Gateway em sala compartilhada do Discord e
  Google Chat cobrem modos `allowBots` antes de afirmar proteção genérica ali.
- Finalização de rascunho e fallback de envio novo no Mattermost.
- Finalização de progresso nativo no Teams.
- Supressão de final duplicado no Feishu.
- Fallback de timeout do acumulador do QQ Bot.
- Envios finais duráveis do Tlon preservam a renderização de assinatura do
  modelo e o rastreamento de threads participadas.
- Envios finais duráveis simples de WhatsApp, Signal, iMessage, Google Chat,
  LINE, IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo e Zalo
  Personal.

Validação:

- Arquivos Vitest direcionados durante o desenvolvimento.
- `pnpm check:changed` no Testbox para toda a superfície alterada.
- `pnpm check` mais amplo no Testbox antes de concluir o refactor completo ou
  após mudanças públicas de SDK/export.
- Smoke live ou qa-channel para pelo menos um canal com capacidade de edição e
  um canal simples somente de envio antes de remover wrappers de compatibilidade.

## Perguntas em aberto

- Se o Telegram deve eventualmente substituir a origem do runner grammY por uma
  origem de polling totalmente durável que possa controlar a reentrega em nível
  de plataforma, não apenas a marca d'água de reinicialização persistida do
  OpenClaw.
- Se o estado durável de prévia live deve ser armazenado no mesmo registro de
  fila que a intenção de envio final ou em um armazenamento irmão de estado
  live.
- Por quanto tempo os wrappers de compatibilidade permanecem documentados depois
  que `plugin-sdk/channel-outbound` for lançado.
- Se plugins de terceiros devem implementar adaptadores de recebimento
  diretamente ou apenas fornecer hooks de normalização/envio/live por meio de
  `defineChannelMessageAdapter`.
- Quais campos de recibo são seguros para expor no SDK público versus estado
  interno de runtime.
- Se efeitos colaterais, como caches de autoeco e marcadores de threads
  participadas, devem ser modelados como hooks de contexto de envio, etapas de
  finalização pertencentes ao adaptador ou assinantes de recibo.
- Quais canais têm metadados de origem nativos, quais precisam de registros de
  saída persistidos e quais não conseguem oferecer supressão confiável de eco
  entre bots.

## Critérios de aceitação

- Todo canal de mensagens empacotado envia a saída final visível por
  `messages.send`.
- Todo canal de mensagem de entrada entra por `messages.receive` ou por um
  wrapper de compatibilidade documentado.
- Todo canal de prévia/edição/stream usa `messages.live` para estado de rascunho
  e finalização.
- `channel.inbound` é apenas um wrapper.
- Helpers do SDK nomeados como resposta são exports de compatibilidade, não o
  caminho recomendado.
- A recuperação durável consegue repetir envios finais pendentes após
  reinicialização sem perder a resposta final nem duplicar envios já confirmados;
  envios cujo resultado na plataforma é desconhecido são reconciliados antes da
  repetição ou documentados como pelo menos uma vez para esse adaptador.
- Envios finais duráveis falham de forma fechada quando a intenção durável não
  pode ser gravada, a menos que um chamador tenha selecionado explicitamente um
  modo não durável documentado.
- Helpers legados de compatibilidade do SDK usam por padrão entrega direta
  pertencente ao canal; envio durável genérico é apenas adesão explícita.
- Recibos preservam todos os ids de mensagem da plataforma para entregas em
  várias partes e um id primário para conveniência de threading/edição.
- Wrappers duráveis preservam efeitos colaterais locais do canal antes de
  substituir callbacks de entrega direta.
- Despachantes preparados não são contados como duráveis até que seu caminho de
  entrega final use explicitamente o contexto de envio.
- A entrega de fallback processa todo payload projetado.
- A entrega de fallback durável registra todo payload projetado em uma intenção
  ou plano de lote repetível.
- Saída de falha de Gateway originada pelo OpenClaw é visível para humanos, mas
  ecos de sala escritos por bot e marcados são descartados antes da autorização
  de bot em canais que declaram suporte ao contrato de origem.
- A documentação explica envio, recebimento, live, estado, recibos, relações,
  política de falhas, migração e cobertura de testes.

## Relacionado

- [Mensagens](/pt-BR/concepts/messages)
- [Streaming e chunking](/pt-BR/concepts/streaming)
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts)
- [Política de retry](/pt-BR/concepts/retry)
- [API de entrada de canal](/pt-BR/plugins/sdk-channel-inbound)
