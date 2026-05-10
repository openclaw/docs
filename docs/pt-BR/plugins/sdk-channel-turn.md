---
read_when:
    - Você está criando um Plugin de canal e quer o ciclo de vida compartilhado do turno de entrada
    - Você está migrando um monitor de canal para deixar de usar código de integração manual de registro/despacho
    - Você precisa entender os estágios de admissão, ingestão, classificação, pré-verificação, resolução, registro, despacho e finalização
sidebarTitle: Channel turn
summary: runtime.channel.turn -- o núcleo compartilhado de turnos de entrada que plugins de canal incluídos e de terceiros usam para registrar, despachar e finalizar turnos de agente
title: Núcleo de turnos do canal
x-i18n:
    generated_at: "2026-05-10T19:44:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

O kernel de turnos de canal é a máquina de estados de entrada compartilhada que transforma um evento de plataforma normalizado em um turno do agente. Os plugins de canal fornecem os fatos da plataforma e o callback de entrega. O núcleo é responsável pela orquestração: ingestão, classificação, pré-verificação, resolução, autorização, montagem, registro, despacho e finalização.

Use isto quando seu plugin estiver no caminho crítico de mensagens recebidas. Para eventos que não são mensagens (comandos slash, modais, interações de botões, eventos de ciclo de vida, reações, estado de voz), mantenha-os locais ao plugin. O kernel só é responsável por eventos que podem se tornar um turno de texto do agente.

<Info>
  O kernel é acessado por meio do runtime de plugin injetado como `runtime.channel.turn.*`. O tipo de runtime de plugin é exportado de `openclaw/plugin-sdk/core`, então plugins nativos de terceiros podem usar esses pontos de entrada da mesma forma que os plugins de canal empacotados.
</Info>

## Por que um kernel compartilhado

Plugins de canal repetem o mesmo fluxo de entrada: normalizar, rotear, bloquear, criar um contexto, registrar metadados de sessão, despachar o turno do agente, finalizar o estado de entrega. Sem um kernel compartilhado, uma alteração em bloqueio por menção, respostas visíveis apenas para ferramentas, metadados de sessão, histórico pendente ou finalização de despacho precisa ser aplicada por canal.

O kernel mantém quatro conceitos deliberadamente separados:

- `ConversationFacts`: de onde veio a mensagem
- `RouteFacts`: qual agente e sessão devem processá-la
- `ReplyPlanFacts`: para onde as respostas visíveis devem ir
- `MessageFacts`: qual corpo e contexto suplementar o agente deve ver

DMs do Slack, tópicos do Telegram, threads do Matrix e sessões de tópicos do Feishu distinguem todos estes na prática. Tratá-los como um único identificador causa divergência ao longo do tempo.

## Ciclo de vida dos estágios

O kernel executa o mesmo pipeline fixo independentemente do canal:

1. `ingest` -- o adaptador converte um evento bruto da plataforma em `NormalizedTurnInput`
2. `classify` -- o adaptador declara se este evento pode iniciar um turno do agente
3. `preflight` -- o adaptador faz deduplicação, autoeco, hidratação, debounce, descriptografia, preenchimento parcial de fatos
4. `resolve` -- o adaptador retorna um turno totalmente montado (rota, plano de resposta, mensagem, entrega)
5. `authorize` -- políticas de DM, grupo, menção e comando aplicadas aos fatos montados
6. `assemble` -- `FinalizedMsgContext` criado a partir dos fatos via `buildContext`
7. `record` -- metadados de sessão de entrada e última rota persistidos
8. `dispatch` -- turno do agente executado por meio do despachante de blocos em buffer
9. `finalize` -- `onFinalize` do adaptador é executado mesmo em erro de despacho

Cada estágio emite um evento de log estruturado quando um callback `log` é fornecido. Consulte [Observabilidade](#observability).

## Tipos de admissão

O kernel não lança erro quando um turno é bloqueado. Ele retorna um `ChannelTurnAdmission`:

| Tipo          | Quando                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | O turno é admitido. O turno do agente é executado e o caminho de resposta visível é exercitado.                                                                   |
| `observeOnly` | O turno é executado de ponta a ponta, mas o adaptador de entrega não envia nada visível. Usado para agentes observadores de broadcast e outros fluxos multiagente passivos. |
| `handled`     | Um evento da plataforma foi consumido localmente (ciclo de vida, reação, botão, modal). O kernel ignora o despacho.                                           |
| `drop`        | Caminho de descarte. Opcionalmente, `recordHistory: true` mantém a mensagem no histórico de grupo pendente para que uma menção futura tenha contexto.                      |

A admissão pode vir de `classify` (a classe do evento disse que ele não pode iniciar um turno), de `preflight` (deduplicação, autoeco, menção ausente com registro de histórico) ou do próprio `resolveTurn`.

## Pontos de entrada

O runtime expõe três pontos de entrada preferenciais para que adaptadores possam aderir no nível que corresponde ao canal.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Dois helpers de runtime mais antigos continuam disponíveis para compatibilidade com o Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

Use quando seu canal puder expressar seu fluxo de entrada como um `ChannelTurnAdapter<TRaw>`. O adaptador tem callbacks para `ingest`, `classify` opcional, `preflight` opcional, `resolveTurn` obrigatório e `onFinalize` opcional.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` é o formato certo quando o canal tem uma pequena lógica de adaptador e se beneficia de ser responsável pelo ciclo de vida por meio de hooks.

### runAssembled

Use quando o canal já tiver resolvido o roteamento, criado um `FinalizedMsgContext`,
e só precisar do registro compartilhado, pipeline de resposta, despacho e ordem de
finalização. Este é o formato preferido para caminhos de entrada empacotados simples que,
caso contrário, repetiriam boilerplate de `createChannelMessageReplyPipeline(...)` e
`runPrepared(...)`.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

Escolha `runAssembled` em vez de `runPrepared` quando o único comportamento de despacho
próprio do canal for a entrega final do payload, mais digitação opcional, opções de
resposta, entrega durável ou registro de erros.

### runPrepared

Use quando o canal tiver um despachante local complexo com pré-visualizações, novas tentativas, edições ou bootstrap de thread que deve continuar sob responsabilidade do canal. O kernel ainda registra a sessão de entrada antes do despacho e expõe um `DispatchedChannelTurnResult` uniforme.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

Canais ricos (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) usam `runPrepared` porque seu despachante orquestra comportamento específico da plataforma que o kernel não deve conhecer.

### buildContext

Uma função pura que mapeia pacotes de fatos para `FinalizedMsgContext`. Use-a quando seu canal implementar manualmente parte do pipeline, mas quiser um formato de contexto consistente.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` também é útil dentro de callbacks `resolveTurn` ao montar um turno para `run`.

<Note>
  Helpers obsoletos do SDK, como `dispatchInboundReplyWithBase`, ainda fazem ponte por meio de um helper de turno montado. Novo código de plugin deve usar `run` ou `runPrepared`.
</Note>

## Tipos de fatos

Os fatos que o kernel consome do seu adaptador são independentes de plataforma. Traduza objetos da plataforma para estes formatos antes de entregá-los ao kernel.

### NormalizedTurnInput

| Campo             | Finalidade                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | ID estável da mensagem usado para deduplicação e logs                                   |
| `timestamp`       | Epoch opcional em ms                                                            |
| `rawText`         | Corpo conforme recebido da plataforma                                           |
| `textForAgent`    | Corpo limpo opcional para o agente (remoção de menção, ajuste de digitação)             |
| `textForCommands` | Corpo opcional usado para análise de `/command`                                    |
| `raw`             | Referência pass-through opcional para callbacks de adaptador que precisam do original |

### ChannelEventClass

| Campo                  | Finalidade                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Se falso, o kernel retorna `{ kind: "handled" }`                       |
| `requiresImmediateAck` | Dica para adaptadores que precisam enviar ACK antes do despacho                      |

### SenderFacts

| Campo          | Finalidade                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | ID estável do remetente na plataforma                                      |
| `name`         | Nome de exibição                                                   |
| `username`     | Handle, se diferente de `name`                                 |
| `tag`          | Discriminador no estilo Discord ou tag da plataforma                    |
| `roles`        | IDs de função, usados para correspondência com allowlist de funções de membro              |
| `isBot`        | Verdadeiro quando o remetente é um bot conhecido (o kernel usa para descartar) |
| `isSelf`       | Verdadeiro quando o remetente é o próprio agente configurado            |
| `displayLabel` | Rótulo pré-renderizado para texto de envelope                           |

### ConversationFacts

| Campo             | Finalidade                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` ou `channel`                                      |
| `id`              | ID da conversa usado para roteamento                                     |
| `label`           | Rótulo humano para o envelope                                         |
| `spaceId`         | Identificador opcional do espaço externo (workspace do Slack, homeserver do Matrix) |
| `parentId`        | ID da conversa externa quando isto é uma thread                          |
| `threadId`        | ID da thread quando esta mensagem está dentro de uma thread                       |
| `nativeChannelId` | ID de canal nativo da plataforma quando diferente do ID de roteamento        |
| `routePeer`       | Par usado para busca `resolveAgentRoute`                             |

### RouteFacts

| Campo                   | Finalidade                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Agente que deve lidar com este turno                         |
| `accountId`             | Substituição opcional (canais com várias contas)                 |
| `routeSessionKey`       | Chave de sessão usada para roteamento                               |
| `dispatchSessionKey`    | Chave de sessão usada no despacho quando diferente da chave de rota |
| `persistedSessionKey`   | Chave de sessão gravada nos metadados da sessão persistida          |
| `parentSessionKey`      | Pai para sessões ramificadas/encadeadas                      |
| `modelParentSessionKey` | Pai no lado do modelo para sessões ramificadas                    |
| `mainSessionKey`        | Fixação do proprietário da DM principal para conversas diretas                 |
| `createIfMissing`       | Permite que a etapa de registro crie uma linha de sessão ausente          |

### ReplyPlanFacts

| Campo                     | Finalidade                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Destino lógico da resposta gravado no contexto `To`          |
| `originatingTo`           | Destino de contexto de origem (`OriginatingTo`)            |
| `nativeChannelId`         | ID de canal nativo da plataforma para entrega                 |
| `replyTarget`             | Destino final da resposta visível se diferir de `to` |
| `deliveryTarget`          | Substituição de entrega de nível mais baixo                           |
| `replyToId`               | ID da mensagem citada/ancorada                              |
| `replyToIdFull`           | ID citado em formato completo quando a plataforma tem ambos          |
| `messageThreadId`         | ID da thread no momento da entrega                              |
| `threadParentId`          | ID da mensagem pai da thread                         |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` ou `none`       |

### AccessFacts

`AccessFacts` carrega os booleanos de que a etapa de autorização precisa. A correspondência de identidade fica no canal: o kernel consome apenas o resultado.

| Campo      | Finalidade                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Decisão de permitir/parear/negar DM e lista `allowFrom`                       |
| `group`    | Política de grupo, permissão de rota, permissão do remetente, lista de permissões, requisito de menção   |
| `commands` | Autorização de comandos entre os autorizadores configurados                       |
| `mentions` | Se a detecção de menção é possível e se o agente foi mencionado |

### MessageFacts

| Campo            | Finalidade                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | Corpo final do envelope (formatado)                                |
| `rawBody`        | Corpo bruto de entrada                                               |
| `bodyForAgent`   | Corpo que o agente vê                                            |
| `commandBody`    | Corpo usado para análise de comandos                                  |
| `envelopeFrom`   | Rótulo de remetente pré-renderizado para o envelope                     |
| `senderLabel`    | Substituição opcional para o remetente renderizado                      |
| `preview`        | Prévia curta redigida para logs                                |
| `inboundHistory` | Entradas recentes do histórico de entrada quando o canal mantém um buffer |

### SupplementalContextFacts

O contexto suplementar cobre contexto de citação, encaminhamento e inicialização de thread. O kernel aplica a política `contextVisibility` configurada. O adaptador de canal fornece apenas fatos e sinalizadores `senderAllowed` para que a política entre canais permaneça consistente.

### InboundMediaFacts

Mídia é estruturada como fatos. Download da plataforma, autenticação, política de SSRF, regras de CDN e descriptografia permanecem locais ao canal. O kernel mapeia fatos para `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` e `MediaTranscribedIndexes`.

## Contrato do adaptador

Para `run` completo, o formato do adaptador é:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` retorna um `ChannelTurnResolved`, que é um `AssembledChannelTurn` com um tipo de admissão opcional. Retornar `{ admission: { kind: "observeOnly" } }` executa o turno sem produzir saída visível. O adaptador ainda é responsável pelo callback de entrega; ele apenas se torna um no-op para esse turno.

`onFinalize` é executado em todos os resultados, incluindo erros de despacho. Use-o para limpar o histórico de grupo pendente, remover reações de confirmação, interromper indicadores de status e descarregar o estado local.

## Adaptador de entrega

O kernel não chama a plataforma diretamente. O canal entrega ao kernel um `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` é chamado uma vez por fragmento de resposta em buffer. Durante a migração do ciclo de vida de mensagens, a entrega de turnos de canal montados pertence ao canal por padrão: um campo `durable` omitido significa que o kernel deve chamar `deliver` diretamente e não deve rotear pela entrega de saída genérica. Defina `durable` somente depois que o canal tiver sido auditado para comprovar que o caminho de envio genérico preserva o comportamento de entrega antigo, incluindo destinos de resposta/thread, manipulação de mídia, caches de mensagens enviadas/eco próprio, limpeza de status e IDs de mensagem retornados. `durable: false` continua sendo uma grafia de compatibilidade para "usar o callback pertencente ao canal", mas canais não migrados não devem precisar adicioná-la. Retorne IDs de mensagem da plataforma quando o canal os tiver para que o dispatcher possa preservar âncoras de thread e editar fragmentos posteriores; caminhos de entrega mais novos também devem retornar `receipt` para que recuperação, finalização de prévia e supressão de duplicatas possam deixar de depender de `messageIds`. Para turnos somente de observação, retorne `{ visibleReplySent: false }` ou use `createNoopChannelTurnDeliveryAdapter()`.

Canais que usam `runPrepared` com um dispatcher totalmente pertencente ao canal não têm um `ChannelTurnDeliveryAdapter`. Esses dispatchers não são duráveis por padrão. Eles devem manter o caminho de entrega direto até optarem explicitamente pelo novo contexto de envio com um destino completo, adaptador seguro para repetição, contrato de recibo e hooks de efeitos colaterais do canal.

Helpers públicos de compatibilidade como `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` e helpers de DM direta devem preservar comportamento durante a migração. Eles não devem chamar entrega durável genérica antes de callbacks `deliver` ou `reply` pertencentes ao chamador.

## Opções de registro

A etapa de registro envolve `recordInboundSession`. A maioria dos canais pode usar os padrões. Substitua via `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

O dispatcher aguarda a etapa de registro. Se o registro lançar erro, o kernel executa `onPreDispatchFailure` (quando fornecido a `runPrepared`) e relança.

## Observabilidade

Cada etapa emite um evento estruturado quando um callback `log` é fornecido:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

Etapas registradas: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Evite registrar corpos brutos; use `MessageFacts.preview` para prévias curtas redigidas.

## O que permanece local ao canal

O kernel é responsável pela orquestração. O canal ainda é responsável por:

- Transportes da plataforma (Gateway, REST, websocket, polling, Webhooks)
- Resolução de identidade e correspondência de nome de exibição
- Comandos nativos, comandos de barra, preenchimento automático, modais, botões, estado de voz
- Renderização de cartões, modais e cartões adaptativos
- Autenticação de mídia, regras de CDN, mídia criptografada, transcrição
- APIs de edição, reação, redação e presença
- Preenchimento retroativo e busca de histórico no lado da plataforma
- Fluxos de pareamento que exigem verificação específica da plataforma

Se dois canais começarem a precisar do mesmo helper para um desses itens, extraia um helper compartilhado do SDK em vez de colocá-lo no kernel.

## Estabilidade

`runtime.channel.turn.*` faz parte da superfície pública de runtime de Plugin. Os tipos de fatos (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) e formatos de admissão (`ChannelTurnAdmission`, `ChannelEventClass`) são acessíveis por `PluginRuntime` a partir de `openclaw/plugin-sdk/core`.

Regras de compatibilidade retroativa se aplicam: novos campos de fatos são aditivos, tipos de admissão não são renomeados e os nomes dos pontos de entrada permanecem estáveis. Novas necessidades de canal que exigem uma alteração não aditiva devem passar pelo processo de migração do SDK de Plugin.

## Relacionados

- [Refatoração do ciclo de vida de mensagens](/pt-BR/concepts/message-lifecycle-refactor) para o ciclo de vida planejado de envio/recebimento/ao vivo que envolverá este kernel
- [Criando plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para o contrato mais amplo de Plugin de canal
- [Helpers de runtime de Plugin](/pt-BR/plugins/sdk-runtime) para outras superfícies `runtime.*`
- [Internos de Plugin](/pt-BR/plugins/architecture-internals) para pipeline de carregamento e mecânica do registro
