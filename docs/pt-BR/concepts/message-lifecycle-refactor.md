---
read_when:
    - Refatorando o comportamento de envio ou recebimento do canal
    - Alteração de turno de canal, despacho de resposta, fila de saída, streaming de pré-visualização ou APIs de mensagens do SDK de Plugin
    - Projetando um novo plugin de canal que precisa de envios duráveis, confirmações de recebimento, prévias, edições ou novas tentativas
summary: Plano de design para o ciclo de vida unificado e durável de recebimento, envio, pré-visualização, edição e streaming de mensagens
title: Refatoração do ciclo de vida da mensagem
x-i18n:
    generated_at: "2026-05-06T05:50:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Esta página é o design alvo para substituir helpers dispersos de turnos de canal, despacho de respostas, streaming de prévia e entrega de saída por um ciclo de vida de mensagem durável único.

A versão curta:

- As primitivas centrais devem ser **receber** e **enviar**, não **responder**.
- Uma resposta é apenas uma relação em uma mensagem de saída.
- Um turno é uma conveniência de processamento de entrada, não o dono da entrega.
- O envio deve ser baseado em contexto: `begin`, renderizar, prévia ou stream, envio final, commit, falha.
- O recebimento também deve ser baseado em contexto: normalizar, deduplicar, rotear, registrar, despachar, ack da plataforma, falha.
- O SDK público de Plugin deve se consolidar em uma pequena superfície única de mensagens de canal.

## Problemas

A stack de canais atual cresceu a partir de várias necessidades locais válidas:

- Adaptadores simples de entrada usam `runtime.channel.turn.run`.
- Adaptadores ricos usam `runtime.channel.turn.runPrepared`.
- Helpers legados usam `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, helpers de payload de resposta, divisão de respostas em chunks, referências de resposta e helpers de runtime de saída.
- O streaming de prévia vive em dispatchers específicos de canal.
- A durabilidade da entrega final está sendo adicionada ao redor dos caminhos existentes de payload de resposta.

Esse formato corrige bugs locais, mas deixa o OpenClaw com conceitos públicos demais e lugares demais onde a semântica de entrega pode divergir.

O problema de confiabilidade que expôs isso é:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

A invariante alvo é mais ampla que Telegram: quando o núcleo decide que uma mensagem de saída visível deve existir, a intenção deve ser durável antes de tentar o envio pela plataforma, e o recibo da plataforma deve ser confirmado depois do sucesso. Isso dá ao OpenClaw recuperação pelo menos uma vez. O comportamento exatamente uma vez existe apenas para adaptadores que conseguem provar idempotência nativa ou reconciliar uma tentativa desconhecida após envio contra o estado da plataforma antes da repetição.

Esse é o estado final desta refatoração, não uma descrição de todos os caminhos atuais. Durante a migração, helpers de saída existentes ainda podem cair para um envio direto quando gravações de fila em best-effort falharem. A refatoração só estará completa quando envios finais duráveis falharem de modo fechado ou optarem explicitamente por sair com uma política não durável documentada.

## Objetivos

- Um ciclo de vida central único para todos os caminhos de recebimento e envio de mensagens de canal.
- Envios finais duráveis por padrão no novo ciclo de vida de mensagens depois que um adaptador declara comportamento seguro para repetição.
- Semânticas compartilhadas de prévia, edição, stream, finalização, retentativa, recuperação e recibo.
- Uma superfície pequena de SDK de Plugin que plugins de terceiros consigam aprender e manter.
- Compatibilidade para chamadores existentes de `channel.turn` durante a migração.
- Pontos de extensão claros para novas capacidades de canal.
- Nenhum branch específico de plataforma no núcleo.
- Nenhuma mensagem de canal com delta de tokens. O streaming de canal continua sendo prévia de mensagem, edição, anexação ou entrega de bloco concluído.
- Metadados estruturados originados no OpenClaw para saída operacional/de sistema, para que falhas visíveis do Gateway não reentrem em salas compartilhadas com bots habilitados como prompts novos.

## Não objetivos

- Não remover `runtime.channel.turn.*` na primeira fase.
- Não forçar todos os canais ao mesmo comportamento de transporte nativo.
- Não ensinar ao núcleo tópicos do Telegram, streams nativos do Slack, redações do Matrix, cards do Feishu, voz do QQ ou atividades do Teams.
- Não publicar todos os helpers internos de migração como API estável do SDK.
- Não fazer retentativas repetirem operações de plataforma não idempotentes já concluídas.

## Modelo de referência

O Vercel Chat tem um bom modelo mental público:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- métodos de adaptador como `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` e buscas de histórico
- um adaptador de estado para dedupe, locks, filas e persistência

O OpenClaw deve emprestar o vocabulário, não copiar a superfície.

O que o OpenClaw precisa além desse modelo:

- Intenções duráveis de envio de saída antes de chamadas diretas de transporte.
- Contextos explícitos de envio com begin, commit e falha.
- Contextos de recebimento que conheçam a política de ack da plataforma.
- Recibos que sobrevivam a reinicializações e possam conduzir edições, exclusões, recuperação e supressão de duplicatas.
- Um SDK público menor. Plugins incluídos podem usar helpers internos de runtime, mas plugins de terceiros devem ver uma API de mensagens coerente.
- Comportamento específico de agente: sessões, transcrições, streaming de blocos, progresso de ferramentas, aprovações, diretivas de mídia, respostas silenciosas e histórico de menções em grupos.

Promessas no estilo `thread.post()` não bastam para o OpenClaw. Elas escondem o limite transacional que decide se um envio é recuperável.

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

`live` é dono de prévia, edição, progresso e estado de stream.

`state` é dono de armazenamento durável de intenções, recibos, idempotência, recuperação, locks e dedupe.

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

Isso permite que o mesmo caminho de envio lide com respostas normais, notificações de cron, prompts de aprovação, conclusões de tarefas, envios por ferramenta de mensagem, envios pela CLI ou pela Control UI, resultados de subagentes e envios de automação.

### Origem

A origem descreve quem produziu uma mensagem e como o OpenClaw deve tratar ecos dessa mensagem. Ela é separada da relação: uma mensagem pode ser uma resposta a um usuário e ainda assim ser saída operacional originada no OpenClaw.

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

O núcleo é dono do significado da saída originada no OpenClaw. Os canais são donos de como essa origem é codificada em seu transporte.

O primeiro uso obrigatório é a saída de falha do Gateway. Humanos ainda devem ver mensagens como "Agent failed before reply" ou "Missing API key", mas a saída operacional marcada do OpenClaw não deve ser aceita como entrada autorada por bot em salas compartilhadas quando `allowBots` estiver habilitado.

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

Recibos são a ponte entre a intenção durável e futuras edições, exclusões, finalização de prévia, supressão de duplicatas e recuperação.

Um recibo pode descrever uma mensagem de plataforma ou uma entrega em múltiplas partes. Texto dividido em chunks, mídia mais texto, voz mais texto e fallbacks de card devem preservar todos os ids da plataforma enquanto ainda expõem um id primário para threading e edições posteriores.

## Contexto de recebimento

O recebimento não deve ser uma chamada nua de helper. O núcleo precisa de um contexto que conheça dedupe, roteamento, registro de sessão e política de ack da plataforma.

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

- **Ack de transporte:** informa ao webhook ou socket da plataforma que o OpenClaw aceitou o envelope do evento. Algumas plataformas exigem isso antes do despacho.
- **Ack de offset de polling:** avança um cursor para que o mesmo evento não seja buscado novamente. Isso não deve avançar além de trabalho que não pode ser recuperado.
- **Ack de registro de entrada:** confirma que o OpenClaw persistiu metadados de entrada suficientes para deduplicar e rotear uma nova entrega.
- **Recibo visível ao usuário:** comportamento opcional de leitura/status/digitação; nunca é um limite de durabilidade.

`ReceiveAckPolicy` controla apenas o reconhecimento de transporte ou polling. Ele não deve ser reutilizado para recibos de leitura ou reações de status.

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

Essa queda é baseada em tag, não em texto. Uma mensagem de sala autorada por bot com o mesmo texto visível de falha do Gateway, mas sem metadados de origem do OpenClaw, ainda passa pela autorização normal de `allowBots`.

A política de ack é explícita:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

O polling do Telegram agora usa a política de ack do contexto de recebimento para sua marca d'água persistida de reinicialização. O rastreador ainda observa atualizações do grammY quando elas entram na cadeia de middleware, mas o OpenClaw persiste apenas o id de atualização concluído com segurança depois do despacho bem-sucedido, deixando atualizações com falha ou pendentes mais baixas repetíveis após uma reinicialização. O offset de busca `getUpdates` upstream do Telegram ainda é controlado pela biblioteca de polling, então o corte mais profundo restante é uma fonte de polling totalmente durável se precisarmos de nova entrega em nível de plataforma além da marca d'água de reinicialização do OpenClaw. Plataformas de webhook podem precisar de ack HTTP imediato, mas ainda precisam de dedupe de entrada e intenções duráveis de envio de saída porque webhooks podem reenviar.

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

A intenção deve existir antes de E/S de transporte. Uma reinicialização depois do início, mas antes do commit, é recuperável.

O limite perigoso fica depois do sucesso na plataforma e antes do commit do recibo. Se um processo morrer ali, o OpenClaw não consegue saber se a mensagem da plataforma existe, a menos que o adaptador forneça idempotência nativa ou um caminho de reconciliação de recibo. Essas tentativas devem ser retomadas em `unknown_after_send`, não reproduzidas cegamente. Canais sem reconciliação podem escolher reprodução pelo menos uma vez somente se mensagens visíveis duplicadas forem uma compensação aceitável e documentada para esse canal e essa relação. A ponte atual de reconciliação do SDK exige que o adaptador declare `reconcileUnknownSend` e então pede que `durableFinal.reconcileUnknownSend` classifique uma entrada desconhecida como `sent`, `not_sent` ou `unresolved`; somente `not_sent` permite reprodução, e entradas não resolvidas permanecem terminais ou repetem apenas a verificação de reconciliação.

A política de durabilidade deve ser explícita:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` significa que o core deve falhar de forma fechada quando não conseguir gravar a intenção durável. `best_effort` pode prosseguir quando a persistência está indisponível. `disabled` mantém o comportamento antigo de envio direto. Durante a migração, wrappers legados e auxiliares públicos de compatibilidade têm `disabled` como padrão; eles não devem inferir `required` do fato de um canal ter um adaptador genérico de saída.

Contextos de envio também são donos de efeitos pós-envio locais ao canal. Uma migração não é segura se a entrega durável contorna comportamento local que antes estava anexado ao caminho de envio direto do canal. Exemplos incluem caches de supressão de autoeco, marcadores de participação em thread, âncoras nativas de edição, renderização de assinatura de modelo e proteções contra duplicidade específicas da plataforma. Esses efeitos devem ser movidos para o adaptador de envio, o adaptador de renderização ou um hook nomeado de contexto de envio antes que esse canal possa habilitar entrega final genérica durável.

Auxiliares de envio devem retornar recibos até o chamador. Wrappers duráveis não podem engolir IDs de mensagem nem substituir um resultado de entrega de canal por `undefined`; despachadores com buffer usam esses IDs para âncoras de thread, edições posteriores, finalização de pré-visualização e supressão de duplicados.

Envios de fallback operam em lotes, não em payloads individuais. Reescritas de resposta silenciosa, fallback de mídia, fallback de cartão e projeção de blocos podem produzir mais de uma mensagem entregável, então um contexto de envio deve entregar todo o lote projetado ou documentar explicitamente por que somente um payload é válido.

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

Quando esse tipo de fallback é durável, todo o lote projetado deve ser representado por uma intenção de envio durável ou por outro plano de lote atômico. Registrar cada payload um a um não é suficiente: uma falha entre payloads pode deixar um fallback visível parcial sem registro durável para os payloads restantes. A recuperação deve saber quais unidades já têm recibos e reproduzir apenas as unidades ausentes ou marcar o lote como `unknown_after_send` até que o adaptador o reconcilie.

## Contexto ao vivo

Comportamento de pré-visualização, edição, progresso e stream deve ser um ciclo de vida opt-in único.

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

O estado ao vivo é durável o bastante para recuperar ou suprimir duplicados:

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

- Envio do Telegram mais pré-visualização por edição, com final novo após a idade obsoleta da pré-visualização.
- Envio do Discord mais pré-visualização por edição, cancelamento em mídia/erro/resposta explícita.
- Stream nativo do Slack ou pré-visualização de rascunho dependendo do formato da thread.
- Finalização de post de rascunho do Mattermost.
- Finalização de evento de rascunho do Matrix ou redação em caso de incompatibilidade.
- Stream de progresso nativo do Teams.
- Stream do QQ Bot ou fallback acumulado.

## Superfície do adaptador

O alvo público do SDK deve ser um subcaminho:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
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

Antes da autorização de preflight, o core deve executar o predicado compartilhado de eco do OpenClaw sempre que `origin.decode` retornar metadados de origem OpenClaw. O adaptador de recebimento fornece fatos da plataforma, como autor do bot e formato da sala; o core é dono da decisão de descarte e da ordenação para que canais não reimplementem filtros de texto.

Adaptador de origem:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

O core define `MessageOrigin`. Canais apenas o traduzem de e para metadados nativos de transporte. O Slack mapeia isso para `chat.postMessage({ metadata })` e `message.metadata` de entrada; o Matrix pode mapear isso para conteúdo extra de evento; canais sem metadados nativos podem usar um registro de recibos/saída quando essa for a melhor aproximação disponível.

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

A nova superfície pública deve absorver ou preterir estas áreas conceituais:

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

Plugins incluídos podem manter imports de auxiliares internos por subcaminhos reservados de runtime durante a migração. A documentação pública deve orientar autores de plugin para `plugin-sdk/channel-message` assim que ele existir.

## Relação com turno de canal

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

Depois que todos os plugins incluídos e caminhos de compatibilidade de terceiros conhecidos estiverem em ponte, `channel.turn` pode ser preterido. Ele não deve ser removido até que haja um caminho publicado de migração do SDK e testes de contrato provando que plugins antigos ainda funcionam ou falham com um erro claro de versão.

## Proteções de compatibilidade

Durante a migração, a entrega genérica durável é opt-in para qualquer canal cujo callback de entrega existente tenha efeitos colaterais além de "enviar este payload".

Pontos de entrada legados são não duráveis por padrão:

- `channel.turn.run` e `dispatchAssembledChannelTurn` usam o callback de entrega do canal, a menos que esse canal forneça explicitamente um objeto auditado de política/opções duráveis.
- `channel.turn.runPrepared` permanece de propriedade do canal até que o despachador preparado chame explicitamente o contexto de envio.
- Auxiliares públicos de compatibilidade como `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` e auxiliares de DM direta nunca injetam entrega genérica durável antes do callback `deliver` ou `reply` fornecido pelo chamador.

Para tipos de ponte de migração, `durable: undefined` significa "não durável". O caminho durável é habilitado somente por um valor explícito de política/opções. `durable:
false` pode permanecer como grafia de compatibilidade, mas a implementação não deve exigir que todo canal não migrado o adicione.

O código de ponte atual deve manter a decisão de durabilidade explícita:

- A entrega final durável retorna um status discriminado. `handled_visible` e
  `handled_no_send` são terminais; `unsupported` e `not_applicable` podem fazer
  fallback para a entrega controlada pelo canal; `failed` propaga a falha de envio.
- A entrega final durável genérica é controlada por capacidades do adaptador, como
  entrega silenciosa, preservação do alvo de resposta, preservação de citação
  nativa e hooks de envio de mensagens. A falta de paridade deve escolher a
  entrega controlada pelo canal, não um envio genérico que altere o comportamento
  visível ao usuário.
- Envios duráveis baseados em fila expõem uma referência de intenção de entrega.
  Os campos de sessão `pendingFinalDelivery*` existentes podem carregar o id da
  intenção durante a transição; o estado final é um armazenamento de
  `MessageSendIntent` em vez de texto de resposta congelado mais campos de
  contexto ad hoc.

Não habilite o caminho durável genérico para um canal até que todos estes itens
sejam verdadeiros:

- O adaptador de envio genérico executa o mesmo comportamento de renderização e
  transporte que o caminho direto antigo.
- Os efeitos colaterais locais pós-envio são preservados por meio do contexto de
  envio.
- O adaptador retorna recibos ou resultados de entrega com todos os ids de
  mensagens da plataforma.
- Os caminhos de despachante preparado chamam o novo contexto de envio ou
  permanecem documentados como fora da garantia durável.
- A entrega de fallback lida com todo payload projetado, não apenas o primeiro.
- A entrega de fallback durável registra todo o array de payloads projetados como
  uma intenção reproduzível ou plano de lote.

Riscos concretos de migração a preservar:

- A entrega do monitor do iMessage registra mensagens enviadas em um cache de eco
  após um envio bem-sucedido. Envios finais duráveis ainda precisam popular esse
  cache; caso contrário, o OpenClaw pode reingerir suas próprias respostas finais
  como mensagens de usuário recebidas.
- O Tlon anexa uma assinatura opcional do modelo e registra threads participantes
  após respostas em grupo. A entrega durável genérica não deve contornar esses
  efeitos; mova-os para adaptadores de renderização/envio/finalização do Tlon ou
  mantenha o Tlon no caminho controlado pelo canal.
- O Discord e outros despachantes preparados já controlam a entrega direta e o
  comportamento de pré-visualização. Eles não são cobertos por uma garantia
  durável de turno montado até que seus despachantes preparados encaminhem
  explicitamente os finais pelo contexto de envio.
- A entrega de fallback silenciosa do Telegram deve entregar todo o array de
  payloads projetados. Um atalho de payload único pode descartar payloads de
  fallback adicionais após a projeção.
- LINE, BlueBubbles, Zalo, Nostr e outros caminhos montados/auxiliares existentes
  podem ter tratamento de token de resposta, proxy de mídia, caches de mensagens
  enviadas, limpeza de carregamento/status ou alvos apenas de callback. Eles
  permanecem na entrega controlada pelo canal até que essas semânticas sejam
  representadas pelo adaptador de envio e verificadas por testes.
- Auxiliares de DM direta podem ter um callback de resposta que é o único alvo de
  transporte correto. A saída genérica não deve inferir a partir de
  `OriginatingTo` ou `To` e ignorar esse callback.
- A saída de falha do Gateway do OpenClaw deve permanecer visível para humanos,
  mas ecos de sala criados por bot e marcados devem ser descartados antes da
  autorização `allowBots`. Canais não devem implementar isso com filtros de
  prefixo de texto visível, exceto como uma medida emergencial curta; o contrato
  durável é metadado de origem estruturado.

## Armazenamento interno

A fila durável deve armazenar intenções de envio de mensagem, não payloads de resposta.

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

Política do core:

- Tente novamente `transient` e `rate_limit`.
- Não tente novamente `invalid_payload`, a menos que exista um fallback de renderização.
- Não tente novamente `auth` ou `permission` até que a configuração mude.
- Para `not_found`, permita que a finalização ao vivo faça fallback de edição
  para envio novo quando o canal declarar que isso é seguro.
- Para `conflict`, use regras de recibo/idempotência para decidir se a mensagem
  já existe.
- Qualquer erro depois que o adaptador pode ter concluído E/S da plataforma, mas
  antes do commit do recibo, torna-se `unknown_after_send`, a menos que o adaptador
  possa provar que a operação da plataforma não aconteceu.

## Mapeamento de canais

| Canal                    | Migração-alvo                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Recebe política de confirmação mais envios finais duráveis. O adaptador ao vivo controla envio mais edição de prévia, envio final de prévia obsoleta, tópicos, salto de prévia de resposta com citação, fallback de mídia e tratamento de retry-after.                                                                                                          |
| Discord                  | O adaptador de envio encapsula a entrega durável de payload existente. O adaptador ao vivo controla edição de rascunho, rascunho de progresso, cancelamento de prévia de mídia/erro, preservação do alvo de resposta e recibos de id de mensagem. Audite ecos de falha de Gateway criados por bot em salas compartilhadas; use um registro de saída ou outro equivalente nativo se o Discord não puder carregar metadados de origem em mensagens normais. |
| Slack                    | O adaptador de envio trata publicações normais no chat. O adaptador ao vivo escolhe stream nativo quando o formato da thread permite; caso contrário, usa prévia de rascunho. Recibos preservam timestamps de thread. O adaptador de origem mapeia falhas de Gateway do OpenClaw para `chat.postMessage.metadata` do Slack e descarta ecos de sala de bot marcados antes da autorização `allowBots`.                                  |
| WhatsApp                 | O adaptador de envio controla envio de texto/mídia com intents finais duráveis. O adaptador de recebimento trata menção em grupo e identidade do remetente. O adaptador ao vivo pode continuar ausente até que o WhatsApp tenha um transporte editável.                                                                                                                                                                        |
| Matrix                   | O adaptador ao vivo controla edições de evento de rascunho, finalização, redação, restrições de mídia criptografada e fallback de incompatibilidade de alvo de resposta. O adaptador de recebimento controla hidratação e deduplicação de eventos criptografados. O adaptador de origem deve codificar a origem de falha de Gateway do OpenClaw no conteúdo do evento Matrix e descartar ecos de sala de bot configurado antes do tratamento de `allowBots`.              |
| Mattermost               | O adaptador ao vivo controla uma publicação de rascunho, dobramento de progresso/ferramenta, finalização no local e fallback de novo envio.                                                                                                                                                                                                                     |
| Microsoft Teams          | O adaptador ao vivo controla o comportamento de progresso nativo e stream de blocos. O adaptador de envio controla atividades e recibos de anexo/cartão.                                                                                                                                                                                                       |
| Feishu                   | O adaptador de renderização controla renderização de texto/cartão/bruta. O adaptador ao vivo controla cartões em streaming e supressão de final duplicado. O adaptador de envio controla comentários, sessões de tópico, mídia e supressão de voz.                                                                                                                                                                      |
| QQ Bot                   | O adaptador ao vivo controla streaming C2C, timeout do acumulador e envio final de fallback. O adaptador de renderização controla tags de mídia e texto como voz.                                                                                                                                                                                               |
| Signal                   | Adaptador simples de recebimento mais envio. Sem adaptador ao vivo, a menos que signal-cli adicione suporte confiável a edição.                                                                                                                                                                                                                                  |
| iMessage e BlueBubbles   | Adaptador simples de recebimento mais envio. O envio do iMessage deve preservar o preenchimento do cache de eco do monitor antes que finais duráveis possam ignorar a entrega do monitor. Digitação, reações e anexos específicos do BlueBubbles continuam sendo capacidades do adaptador.                                                                                                                            |
| Google Chat              | Adaptador simples de recebimento mais envio com relação de thread mapeada para espaços e ids de thread. Audite o comportamento de sala com `allowBots=true` para ecos de falha de Gateway do OpenClaw marcados.                                                                                                                                                                                        |
| LINE                     | Adaptador simples de recebimento mais envio com restrições de token de resposta modeladas como capacidade de alvo/relação.                                                                                                                                                                                                                                      |
| Nextcloud Talk           | Ponte de recebimento do SDK mais adaptador de envio.                                                                                                                                                                                                                                                                                                           |
| IRC                      | Adaptador simples de recebimento mais envio, sem recibos de edição duráveis.                                                                                                                                                                                                                                                                                    |
| Nostr                    | Adaptador de recebimento mais envio para DMs criptografadas; recibos são ids de evento.                                                                                                                                                                                                                                                                         |
| Canal QA                 | Adaptador de teste de contrato para comportamentos de recebimento, envio, ao vivo, retry e recuperação.                                                                                                                                                                                                                                                        |
| Synology Chat            | Adaptador simples de recebimento mais envio.                                                                                                                                                                                                                                                                                                                   |
| Tlon                     | O adaptador de envio deve preservar a renderização de assinatura do modelo e o rastreamento de thread participante antes que a entrega final durável genérica seja habilitada.                                                                                                                                                                                  |
| Twitch                   | Adaptador simples de recebimento mais envio com classificação de limite de taxa.                                                                                                                                                                                                                                                                                |
| Zalo                     | Adaptador simples de recebimento mais envio.                                                                                                                                                                                                                                                                                                                   |
| Zalo Personal            | Adaptador simples de recebimento mais envio.                                                                                                                                                                                                                                                                                                                   |

## Plano de migração

### Fase 1: Domínio interno de mensagens

- Adicione tipos `src/channels/message/*` para mensagens, alvos, relações,
  origens, recibos, capacidades, intents duráveis, contexto de recebimento, contexto de envio,
  contexto ao vivo e classes de falha.
- Adicione `origin?: MessageOrigin` ao tipo de payload da ponte de migração usado pela
  entrega de respostas atual; em seguida, mova esse campo para `ChannelMessage` e tipos de
  mensagem renderizada conforme a refatoração substitui payloads de resposta.
- Mantenha isso interno até que adaptadores e testes comprovem o formato.
- Adicione testes unitários puros para transições de estado e serialização.

### Fase 2: Núcleo de envio durável

- Mova a fila de saída existente da durabilidade de payload de resposta para intents duráveis
  de envio de mensagem.
- Permita que um intent de envio durável carregue uma matriz de payloads projetada ou plano de lote,
  não apenas um payload de resposta.
- Preserve o comportamento atual de recuperação da fila por meio de conversão de compatibilidade.
- Faça `deliverOutboundPayloads` chamar `messages.send`.
- Torne a durabilidade do envio final o padrão e falhe fechado quando o intent durável
  não puder ser gravado no novo ciclo de vida de mensagens, depois que o adaptador declarar
  segurança de replay. Os caminhos existentes de turno de canal e compatibilidade do SDK permanecem
  como envio direto por padrão durante esta fase.
- Registre recibos consistentemente.
- Retorne recibos e resultados de entrega ao chamador original do dispatcher em vez
  de tratar o envio durável como um efeito colateral terminal.
- Persista a origem da mensagem por meio de intents de envio durável para que recuperação, replay e
  envios em partes preservem a proveniência operacional do OpenClaw.

### Fase 3: Ponte de turno de canal

- Reimplemente `channel.turn.run` e `dispatchAssembledChannelTurn` sobre
  `messages.receive` e `messages.send`.
- Mantenha os tipos de fatos atuais estáveis.
- Mantenha o comportamento legado por padrão. Um canal de turno montado só se torna durável
  quando seu adaptador opta explicitamente por isso com uma política de durabilidade segura para replay.
- Mantenha `durable: false` como uma saída de compatibilidade para caminhos que finalizam
  edições nativas e ainda não podem reproduzir com segurança, mas não dependa de marcadores `false`
  para proteger canais não migrados.
- Padronize a durabilidade de turno montado somente no novo ciclo de vida de mensagens, depois
  que o mapeamento do canal comprovar que o caminho de envio genérico preserva a semântica antiga de
  entrega do canal.

### Fase 4: Ponte do dispatcher preparado

- Substitua `deliverDurableInboundReplyPayload` por uma ponte de contexto de envio.
- Mantenha o helper antigo como um wrapper.
- Porte Telegram, WhatsApp, Slack, Signal, iMessage e Discord primeiro, porque
  eles já têm trabalho de final durável ou caminhos de envio mais simples.
- Trate todo dispatcher preparado como não coberto até que ele opte
  explicitamente pelo contexto de envio. A documentação e as entradas de
  changelog devem dizer "turnos de canal montados" ou nomear os caminhos de
  canal migrados, em vez de afirmar todas as respostas finais automáticas.
- Mantenha `recordInboundSessionAndDispatchReply`, helpers de DM direta e
  helpers públicos de compatibilidade semelhantes preservando o comportamento.
  Eles podem expor uma adesão explícita ao contexto de envio depois, mas não
  devem tentar automaticamente uma entrega durável genérica antes do callback de
  entrega pertencente ao chamador.

### Fase 5: ciclo de vida ao vivo unificado

- Crie `messages.live` com dois adaptadores de prova:
  - Telegram para envio mais edição mais envio final obsoleto.
  - Matrix para finalização de rascunho mais fallback de redação.
- Depois, migre Discord, Slack, Mattermost, Teams, QQ Bot e Feishu.
- Exclua o código duplicado de finalização de prévia somente depois que cada
  canal tiver testes de paridade.

### Fase 6: SDK público

- Adicione `openclaw/plugin-sdk/channel-message`.
- Documente-o como a API preferida de Plugin de canal.
- Atualize exports de pacote, inventário de entrypoints, baselines de API geradas e
  documentação do SDK de Plugin.
- Inclua `MessageOrigin`, hooks de codificação/decodificação de origem e o
  predicado compartilhado `shouldDropOpenClawEcho` na superfície do SDK
  channel-message.
- Mantenha wrappers de compatibilidade para subcaminhos antigos.
- Marque helpers do SDK nomeados como resposta como obsoletos na documentação
  depois que os plugins empacotados forem migrados.

### Fase 7: todos os remetentes

Mova todos os produtores de saída que não são resposta para `messages.send`:

- notificações de Cron e Heartbeat
- conclusões de tarefas
- resultados de hooks
- prompts de aprovação e resultados de aprovação
- envios da ferramenta de mensagens
- anúncios de conclusão de subagente
- envios explícitos da CLI ou da Control UI
- caminhos de automação/broadcast

É aqui que o modelo deixa de ser "respostas de agente" e passa a ser "OpenClaw
envia mensagens".

### Fase 8: descontinuar Turn

- Mantenha `channel.turn` como um wrapper por pelo menos uma janela de compatibilidade.
- Publique notas de migração.
- Execute testes de compatibilidade do SDK de Plugin contra imports antigos.
- Remova ou oculte helpers internos antigos somente depois que nenhum Plugin
  empacotado precisar deles e os contratos de terceiros tiverem uma substituição estável.

## Plano de testes

Testes unitários:

- Serialização e recuperação de intenção de envio durável.
- Reutilização de chave de idempotência e supressão de duplicatas.
- Commit de recibo e salto de repetição.
- Recuperação de `unknown_after_send` que reconcilia antes de repetir quando um adaptador
  oferece suporte a reconciliação.
- Política de classificação de falhas.
- Sequenciamento da política de ack de recebimento.
- Mapeamento de relações para envios de resposta, acompanhamento, sistema e broadcast.
- Fábrica de origem de falha de Gateway e predicado `shouldDropOpenClawEcho`.
- Preservação de origem por normalização de payload, divisão em chunks, serialização de fila
  durável e recuperação.

Testes de integração:

- Adaptador simples de `channel.turn.run` ainda registra e envia.
- Entrega legada de turno montado não se torna durável a menos que o canal
  opte explicitamente por isso.
- Ponte de `channel.turn.runPrepared` ainda registra e finaliza.
- Helpers públicos de compatibilidade chamam callbacks de entrega pertencentes ao chamador por padrão
  e não fazem envio genérico antes desses callbacks.
- Entrega de fallback durável repete todo o array de payloads projetado após
  reinicialização e não pode deixar payloads posteriores sem registro depois de uma falha inicial.
- Entrega durável de turno montado retorna ids de mensagem da plataforma para o dispatcher
  em buffer.
- Hooks de entrega personalizados ainda retornam ids de mensagem da plataforma quando a entrega durável
  está desativada ou indisponível.
- Resposta final sobrevive à reinicialização entre a conclusão do assistente e o envio para a plataforma.
- Rascunho de prévia finaliza no lugar quando permitido.
- Rascunho de prévia é cancelado ou redigido quando incompatibilidade de mídia/erro/alvo de resposta
  exige entrega normal.
- Streaming em blocos e streaming de prévia não entregam ambos o mesmo texto.
- Mídia transmitida cedo não é duplicada na entrega final.

Testes de canal:

- Resposta em tópico do Telegram com ack de polling atrasado até a marca-d'água segura
  concluída do contexto de recebimento.
- Recuperação de polling do Telegram para atualizações aceitas mas não entregues coberta pelo
  modelo de offset seguro concluído persistido.
- Prévia obsoleta do Telegram envia final nova e limpa a prévia.
- Fallback silencioso do Telegram envia todos os payloads de fallback projetados.
- Durabilidade de fallback silencioso do Telegram registra todo o array de fallback projetado
  atomicamente, não uma intenção durável de payload único por iteração do loop.
- Cancelamento de prévia do Discord em mídia/erro/resposta explícita.
- Finais de dispatchers preparados do Discord roteiam pelo contexto de envio antes que a documentação
  ou o changelog aleguem durabilidade de resposta final do Discord.
- Envios finais duráveis do iMessage populam o cache de eco de mensagem enviada do monitor.
- Caminhos de entrega legados de LINE, BlueBubbles, Zalo e Nostr não são contornados por
  envio durável genérico até que existam testes de paridade dos seus adaptadores.
- Entrega por callback de DM direta/Nostr permanece autoritativa a menos que seja explicitamente
  migrada para um alvo completo de mensagem e um adaptador de envio seguro para repetição.
- Mensagens de falha do Gateway OpenClaw marcadas no Slack permanecem visíveis na saída, ecos de
  sala de bot marcados caem antes de `allowBots`, e mensagens de bot sem marcação com o
  mesmo texto visível ainda seguem a autorização normal de bot.
- Fallback de stream nativo do Slack para prévia de rascunho em DMs de nível superior.
- Finalização de prévia e fallback de redação do Matrix.
- Ecos de sala de falha de Gateway OpenClaw marcados no Matrix vindos de contas de bot
  configuradas caem antes do tratamento de `allowBots`.
- Auditorias de cascata de falha de Gateway em sala compartilhada do Discord e Google Chat cobrem
  modos de `allowBots` antes de alegar proteção genérica ali.
- Finalização de rascunho e fallback de envio novo do Mattermost.
- Finalização de progresso nativo do Teams.
- Supressão de final duplicado do Feishu.
- Fallback de timeout de acumulador do QQ Bot.
- Envios finais duráveis do Tlon preservam renderização de assinatura do modelo e rastreamento de
  thread participante.
- Envios finais duráveis simples do WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo e Zalo Personal.

Validação:

- Arquivos Vitest direcionados durante o desenvolvimento.
- `pnpm check:changed` no Testbox para toda a superfície alterada.
- `pnpm check` mais amplo no Testbox antes de integrar a refatoração completa ou após
  mudanças de SDK/export público.
- Smoke ao vivo ou qa-channel para pelo menos um canal com capacidade de edição e um
  canal simples apenas de envio antes de remover wrappers de compatibilidade.

## Perguntas em aberto

- Se o Telegram deve eventualmente substituir a origem do runner grammY por uma
  origem de polling totalmente durável que possa controlar a reentrega em nível de plataforma, não
  apenas a marca-d'água de reinicialização persistida do OpenClaw.
- Se o estado de prévia ao vivo durável deve ser armazenado no mesmo registro de fila
  da intenção de envio final ou em um armazenamento irmão de estado ao vivo.
- Por quanto tempo wrappers de compatibilidade permanecem documentados depois que
  `plugin-sdk/channel-message` for lançado.
- Se plugins de terceiros devem implementar adaptadores de recebimento diretamente ou apenas
  fornecer hooks de normalização/envio/ao vivo por meio de `defineChannelMessageAdapter`.
- Quais campos de recibo são seguros para expor no SDK público versus estado de runtime
  interno.
- Se efeitos colaterais como caches de autoeco e marcadores de thread participante
  devem ser modelados como hooks de contexto de envio, etapas de finalização pertencentes ao adaptador ou
  assinantes de recibo.
- Quais canais têm metadados nativos de origem, quais precisam de registros de saída
  persistidos e quais não podem oferecer supressão confiável de eco entre bots.

## Critérios de aceitação

- Todo canal de mensagem empacotado envia a saída final visível por meio de
  `messages.send`.
- Todo canal de mensagem de entrada entra por `messages.receive` ou por um
  wrapper de compatibilidade documentado.
- Todo canal de prévia/edição/stream usa `messages.live` para estado de rascunho e
  finalização.
- `channel.turn` é apenas um wrapper.
- Helpers do SDK nomeados como resposta são exports de compatibilidade, não o caminho recomendado.
- A recuperação durável consegue repetir envios finais pendentes após reinicialização sem perder
  a resposta final nem duplicar envios já com commit; envios cujo
  resultado na plataforma é desconhecido são reconciliados antes da repetição ou documentados como
  pelo menos uma vez para esse adaptador.
- Envios finais duráveis falham de modo fechado quando a intenção durável não pode ser escrita,
  a menos que um chamador tenha selecionado explicitamente um modo não durável documentado.
- Helpers de compatibilidade legados de channel-turn e SDK usam por padrão entrega direta
  pertencente ao canal; envio durável genérico é apenas adesão explícita.
- Recibos preservam todos os ids de mensagem da plataforma para entregas em múltiplas partes e um
  id primário para conveniência de threading/edição.
- Wrappers duráveis preservam efeitos colaterais locais do canal antes de substituir callbacks de
  entrega direta.
- Dispatchers preparados não são contados como duráveis até que seu caminho de entrega final
  use explicitamente o contexto de envio.
- A entrega de fallback lida com todos os payloads projetados.
- A entrega de fallback durável registra todos os payloads projetados em uma intenção ou plano de lote
  reproduzível.
- Saída de falha de Gateway originada pelo OpenClaw é visível para humanos, mas ecos de sala
  escritos por bots marcados são descartados antes da autorização de bot em canais que
  declaram suporte ao contrato de origem.
- A documentação explica envio, recebimento, ao vivo, estado, recibos, relações, política de
  falhas, migração e cobertura de testes.

## Relacionado

- [Mensagens](/pt-BR/concepts/messages)
- [Streaming e divisão em chunks](/pt-BR/concepts/streaming)
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts)
- [Política de repetição](/pt-BR/concepts/retry)
- [Kernel de turno de canal](/pt-BR/plugins/sdk-channel-turn)
