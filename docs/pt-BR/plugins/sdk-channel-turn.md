---
read_when:
    - Você está criando um Plugin de canal e quer o ciclo de vida compartilhado do turno de entrada
    - Você está migrando um monitor de canal para deixar de usar uma integração manual de registro/despacho
    - Você precisa entender os estágios de admissão, ingestão, classificação, pré-verificação, resolução, registro, despacho e finalização
sidebarTitle: Channel turn
summary: runtime.channel.turn -- o kernel compartilhado de turnos de entrada que plugins de canal integrados e de terceiros usam para registrar, despachar e finalizar turnos de agentes
title: Núcleo de turno do canal
x-i18n:
    generated_at: "2026-05-06T09:07:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

O kernel de turnos de canal é a máquina de estados de entrada compartilhada que transforma um evento de plataforma normalizado em um turno do agente. Plugins de canal fornecem os fatos da plataforma e o callback de entrega. O core é dono da orquestração: ingerir, classificar, pré-verificar, resolver, autorizar, montar, registrar, despachar e finalizar.

Use isto quando seu Plugin estiver no caminho crítico de mensagens de entrada. Para eventos que não são mensagens (comandos slash, modais, interações de botão, eventos de ciclo de vida, reações, estado de voz), mantenha-os locais ao Plugin. O kernel só é dono de eventos que podem se tornar um turno de texto do agente.

<Info>
  O kernel é acessado pelo runtime de Plugin injetado como `runtime.channel.turn.*`. O tipo do runtime de Plugin é exportado de `openclaw/plugin-sdk/core`, então Plugins nativos de terceiros podem usar estes pontos de entrada da mesma forma que Plugins de canal incluídos fazem.
</Info>

## Por que um kernel compartilhado

Plugins de canal repetem o mesmo fluxo de entrada: normalizar, rotear, bloquear, construir um contexto, registrar metadados de sessão, despachar o turno do agente, finalizar o estado de entrega. Sem um kernel compartilhado, uma mudança em bloqueio por menção, respostas visíveis apenas de ferramenta, metadados de sessão, histórico pendente ou finalização de despacho precisa ser aplicada por canal.

O kernel mantém quatro conceitos deliberadamente separados:

- `ConversationFacts`: de onde a mensagem veio
- `RouteFacts`: qual agente e sessão devem processá-la
- `ReplyPlanFacts`: para onde as respostas visíveis devem ir
- `MessageFacts`: qual corpo e contexto suplementar o agente deve ver

DMs do Slack, tópicos do Telegram, threads do Matrix e sessões de tópico do Feishu distinguem todos estes na prática. Tratá-los como um único identificador causa desvio com o tempo.

## Ciclo de vida dos estágios

O kernel executa o mesmo pipeline fixo independentemente do canal:

1. `ingest` -- adaptador converte um evento bruto da plataforma em `NormalizedTurnInput`
2. `classify` -- adaptador declara se este evento pode iniciar um turno do agente
3. `preflight` -- adaptador faz deduplicação, autoeco, hidratação, debounce, descriptografia, preenchimento parcial de fatos
4. `resolve` -- adaptador retorna um turno totalmente montado (rota, plano de resposta, mensagem, entrega)
5. `authorize` -- política de DM, grupo, menção e comando aplicada aos fatos montados
6. `assemble` -- `FinalizedMsgContext` criado a partir dos fatos via `buildContext`
7. `record` -- metadados de sessão de entrada e última rota persistidos
8. `dispatch` -- turno do agente executado pelo dispatcher de blocos em buffer
9. `finalize` -- `onFinalize` do adaptador executa mesmo em erro de despacho

Cada estágio emite um evento de log estruturado quando um callback `log` é fornecido. Veja [Observabilidade](#observability).

## Tipos de admissão

O kernel não lança erro quando um turno é bloqueado. Ele retorna um `ChannelTurnAdmission`:

| Tipo          | Quando                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | O turno é admitido. O turno do agente executa e o caminho de resposta visível é exercitado.                                                                   |
| `observeOnly` | O turno executa de ponta a ponta, mas o adaptador de entrega não envia nada visível. Usado para agentes observadores de broadcast e outros fluxos multiagente passivos. |
| `handled`     | Um evento de plataforma foi consumido localmente (ciclo de vida, reação, botão, modal). O kernel ignora o despacho.                                           |
| `drop`        | Caminho de ignorar. Opcionalmente, `recordHistory: true` mantém a mensagem no histórico de grupo pendente para que uma menção futura tenha contexto.                      |

A admissão pode vir de `classify` (a classe de evento disse que ele não pode iniciar um turno), de `preflight` (deduplicação, autoeco, menção ausente com registro de histórico) ou do próprio `resolveTurn`.

## Pontos de entrada

O runtime expõe três pontos de entrada preferenciais para que adaptadores possam aderir no nível que corresponde ao canal.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Dois helpers de runtime mais antigos permanecem disponíveis para compatibilidade com o Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
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

`run` tem o formato correto quando o canal tem lógica de adaptador pequena e se beneficia de possuir o ciclo de vida por meio de hooks.

### runPrepared

Use quando o canal tiver um dispatcher local complexo com prévias, novas tentativas, edições ou bootstrap de thread que precisa permanecer sob posse do canal. O kernel ainda registra a sessão de entrada antes do despacho e expõe um `DispatchedChannelTurnResult` uniforme.

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

Canais ricos (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) usam `runPrepared` porque seu dispatcher orquestra comportamento específico da plataforma que o kernel não deve aprender.

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
  Helpers de SDK obsoletos como `dispatchInboundReplyWithBase` ainda fazem ponte por meio de um helper de turno montado. Novo código de Plugin deve usar `run` ou `runPrepared`.
</Note>

## Tipos de fatos

Os fatos que o kernel consome do seu adaptador são agnósticos à plataforma. Traduza objetos da plataforma para estes formatos antes de entregá-los ao kernel.

### NormalizedTurnInput

| Campo             | Finalidade                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | ID de mensagem estável usado para deduplicação e logs                                   |
| `timestamp`       | Epoch ms opcional                                                            |
| `rawText`         | Corpo conforme recebido da plataforma                                           |
| `textForAgent`    | Corpo limpo opcional para o agente (remoção de menção, corte de digitação)             |
| `textForCommands` | Corpo opcional usado para análise de `/command`                                    |
| `raw`             | Referência pass-through opcional para callbacks do adaptador que precisam do original |

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
| `username`     | Identificador se distinto de `name`                                 |
| `tag`          | Discriminador no estilo Discord ou tag da plataforma                    |
| `roles`        | IDs de papéis, usados para correspondência de allowlist de papéis de membro              |
| `isBot`        | Verdadeiro quando o remetente é um bot conhecido (o kernel usa para descartar) |
| `isSelf`       | Verdadeiro quando o remetente é o próprio agente configurado            |
| `displayLabel` | Rótulo pré-renderizado para texto de envelope                           |

### ConversationFacts

| Campo             | Finalidade                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` ou `channel`                                      |
| `id`              | ID da conversa usado para roteamento                                     |
| `label`           | Rótulo legível para humanos no envelope                                         |
| `spaceId`         | Identificador de espaço externo opcional (workspace do Slack, homeserver do Matrix) |
| `parentId`        | ID da conversa externa quando isto é uma thread                          |
| `threadId`        | ID da thread quando esta mensagem está dentro de uma thread                       |
| `nativeChannelId` | ID de canal nativo da plataforma quando diferente do ID de roteamento        |
| `routePeer`       | Peer usado para busca `resolveAgentRoute`                             |

### RouteFacts

| Campo                   | Finalidade                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Agente que deve lidar com este turno                         |
| `accountId`             | Substituição opcional (canais com múltiplas contas)                 |
| `routeSessionKey`       | Chave de sessão usada para roteamento                               |
| `dispatchSessionKey`    | Chave de sessão usada no despacho quando diferente da chave de rota |
| `persistedSessionKey`   | Chave de sessão gravada nos metadados de sessão persistidos          |
| `parentSessionKey`      | Pai para sessões ramificadas/com threads                      |
| `modelParentSessionKey` | Pai no lado do modelo para sessões ramificadas                    |
| `mainSessionKey`        | Pin do proprietário da DM principal para conversas diretas                 |
| `createIfMissing`       | Permite que a etapa de registro crie uma linha de sessão ausente          |

### ReplyPlanFacts

| Campo                     | Finalidade                                                 |
| ------------------------- | ---------------------------------------------------------- |
| `to`                      | Destino lógico da resposta gravado no contexto `To`        |
| `originatingTo`           | Destino de contexto de origem (`OriginatingTo`)            |
| `nativeChannelId`         | ID de canal nativo da plataforma para entrega              |
| `replyTarget`             | Destino final da resposta visível se diferir de `to`       |
| `deliveryTarget`          | Substituição de entrega de nível inferior                  |
| `replyToId`               | ID da mensagem citada/ancorada                             |
| `replyToIdFull`           | ID citado em formato completo quando a plataforma tem ambos |
| `messageThreadId`         | ID da thread no momento da entrega                         |
| `threadParentId`          | ID da mensagem pai da thread                               |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` ou `none`           |

### AccessFacts

`AccessFacts` carrega os booleanos de que o estágio de autorização precisa. A correspondência de identidade permanece no canal: o kernel consome apenas o resultado.

| Campo      | Finalidade                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| `dm`       | Decisão de permitir/parear/negar DM e lista `allowFrom`                    |
| `group`    | Política de grupo, permissão de rota, permissão de remetente, lista de permissões, requisito de menção |
| `commands` | Autorização de comandos entre os autorizadores configurados                |
| `mentions` | Se a detecção de menção é possível e se o agente foi mencionado            |

### MessageFacts

| Campo            | Finalidade                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `body`           | Corpo final do envelope (formatado)                               |
| `rawBody`        | Corpo bruto recebido                                              |
| `bodyForAgent`   | Corpo que o agente vê                                             |
| `commandBody`    | Corpo usado para análise de comandos                              |
| `envelopeFrom`   | Rótulo do remetente pré-renderizado para o envelope               |
| `senderLabel`    | Substituição opcional para o remetente renderizado                |
| `preview`        | Prévia curta e redigida para logs                                 |
| `inboundHistory` | Entradas recentes do histórico de entrada quando o canal mantém um buffer |

### SupplementalContextFacts

O contexto suplementar cobre contexto de citação, encaminhamento e inicialização de thread. O kernel aplica a política `contextVisibility` configurada. O adaptador de canal fornece apenas fatos e flags `senderAllowed` para que a política entre canais permaneça consistente.

### InboundMediaFacts

A mídia é moldada como fatos. Download da plataforma, autenticação, política de SSRF, regras de CDN e descriptografia permanecem locais ao canal. O kernel mapeia fatos para `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` e `MediaTranscribedIndexes`.

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

`resolveTurn` retorna um `ChannelTurnResolved`, que é um `AssembledChannelTurn` com um tipo de admissão opcional. Retornar `{ admission: { kind: "observeOnly" } }` executa o turno sem produzir saída visível. O adaptador ainda é dono do callback de entrega; ele apenas se torna um no-op para esse turno.

`onFinalize` é executado em todo resultado, incluindo erros de despacho. Use-o para limpar histórico de grupo pendente, remover reações de confirmação, parar indicadores de status e descarregar estado local.

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

`deliver` é chamado uma vez por fragmento de resposta em buffer. Durante a migração do ciclo de vida de mensagens, a entrega de turnos de canal montados pertence ao canal por padrão: um campo `durable` omitido significa que o kernel deve chamar `deliver` diretamente e não deve rotear pela entrega de saída genérica. Defina `durable` somente depois que o canal tiver sido auditado para provar que o caminho genérico de envio preserva o comportamento de entrega antigo, incluindo destinos de resposta/thread, tratamento de mídia, caches de mensagens enviadas/eco próprio, limpeza de status e IDs de mensagens retornados. `durable: false` continua sendo uma grafia de compatibilidade para "usar o callback pertencente ao canal", mas canais não migrados não devem precisar adicioná-la. Retorne IDs de mensagens da plataforma quando o canal os tiver para que o despachante possa preservar âncoras de thread e editar fragmentos posteriores; caminhos de entrega mais novos também devem retornar `receipt` para que recuperação, finalização de prévia e supressão de duplicatas possam deixar de depender de `messageIds`. Para turnos somente de observação, retorne `{ visibleReplySent: false }` ou use `createNoopChannelTurnDeliveryAdapter()`.

Canais que usam `runPrepared` com um despachante totalmente pertencente ao canal não têm um `ChannelTurnDeliveryAdapter`. Esses despachantes não são duráveis por padrão. Eles devem manter seu caminho de entrega direta até que optem explicitamente pelo novo contexto de envio com um destino completo, adaptador seguro para repetição, contrato de recibo e hooks de efeitos colaterais do canal.

Helpers públicos de compatibilidade, como `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` e helpers de DM direta, devem preservar comportamento durante a migração. Eles não devem chamar a entrega durável genérica antes de callbacks `deliver` ou `reply` pertencentes ao chamador.

## Opções de registro

O estágio de registro encapsula `recordInboundSession`. A maioria dos canais pode usar os padrões. Substitua via `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

O despachante aguarda o estágio de registro. Se o registro lançar uma exceção, o kernel executa `onPreDispatchFailure` (quando fornecido a `runPrepared`) e relança.

## Observabilidade

Cada estágio emite um evento estruturado quando um callback `log` é fornecido:

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

Estágios registrados em log: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Evite registrar corpos brutos; use `MessageFacts.preview` para prévias curtas e redigidas.

## O que permanece local ao canal

O kernel é dono da orquestração. O canal ainda é dono de:

- Transportes da plataforma (gateway, REST, websocket, polling, webhooks)
- Resolução de identidade e correspondência de nome de exibição
- Comandos nativos, comandos slash, preenchimento automático, modais, botões, estado de voz
- Renderização de cartão, modal e cartão adaptativo
- Autenticação de mídia, regras de CDN, mídia criptografada, transcrição
- APIs de edição, reação, redação e presença
- Backfill e busca de histórico no lado da plataforma
- Fluxos de pareamento que exigem verificação específica da plataforma

Se dois canais começarem a precisar do mesmo helper para um desses itens, extraia um helper compartilhado do SDK em vez de empurrá-lo para o kernel.

## Estabilidade

`runtime.channel.turn.*` faz parte da superfície pública de runtime de Plugin. Os tipos de fato (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) e formatos de admissão (`ChannelTurnAdmission`, `ChannelEventClass`) são acessíveis por meio de `PluginRuntime` a partir de `openclaw/plugin-sdk/core`.

As regras de compatibilidade retroativa se aplicam: novos campos de fato são aditivos, tipos de admissão não são renomeados e os nomes dos pontos de entrada permanecem estáveis. Novas necessidades de canal que exigem uma mudança não aditiva devem passar pelo processo de migração do SDK de Plugin.

## Relacionado

- [Refatoração do ciclo de vida de mensagens](/pt-BR/concepts/message-lifecycle-refactor) para o ciclo de vida planejado de envio/recebimento/ao vivo que encapsulará este kernel
- [Construção de plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para o contrato mais amplo de Plugin de canal
- [Helpers de runtime de Plugin](/pt-BR/plugins/sdk-runtime) para outras superfícies `runtime.*`
- [Elementos internos de Plugin](/pt-BR/plugins/architecture-internals) para pipeline de carregamento e mecânica de registro
