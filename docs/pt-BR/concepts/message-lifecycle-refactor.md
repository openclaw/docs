---
read_when:
    - Refatoração do comportamento de envio ou recebimento do canal
    - Alteração das APIs de mensagens de entrada dos canais, despacho de respostas, fila de saída, streaming de pré-visualização ou SDK de plugins
    - Projetando um novo plugin de canal que precisa de envios duráveis, confirmações de recebimento, prévias, edições ou novas tentativas
summary: 'Status do ciclo de vida durável de recebimento/envio de mensagens: o que foi lançado, o que mudou em relação ao projeto original e o que permanece em aberto'
title: Refatoração do ciclo de vida das mensagens
x-i18n:
    generated_at: "2026-07-11T23:54:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Esta página surgiu como uma proposta de design voltada para o futuro. Desde
então, o núcleo desse design foi lançado em `src/channels/message/*` e nos
subcaminhos públicos `openclaw/plugin-sdk/channel-outbound` /
`channel-inbound`. Para a API atual, use [API de saída de canais](/pt-BR/plugins/sdk-channel-outbound) e
[API de entrada de canais](/pt-BR/plugins/sdk-channel-inbound). Esta página registra o que
foi lançado, onde a implementação divergiu do esboço original e o que
ainda está em aberto.
</Note>

## Por que essa refatoração aconteceu

A pilha de canais cresceu a partir de várias correções locais: auxiliares de entrada separados por
nível de maturidade (`runtime.channel.inbound.run` para adaptadores simples,
`runtime.channel.inbound.runPreparedReply` para os mais avançados), auxiliares legados de despacho de respostas
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
streaming de prévias específico de cada canal e durabilidade da entrega final adicionada
aos caminhos existentes de payloads de resposta. Essa estrutura produziu conceitos públicos demais e
locais demais onde a semântica de entrega poderia divergir.

A lacuna de confiabilidade que forçou o redesenho:

```text
Atualização de polling do Telegram confirmada
  -> o texto final do assistente existe
  -> o processo reinicia antes de sendMessage ter êxito
  -> a resposta final é perdida
```

Invariante desejada: assim que o núcleo decidir que uma mensagem de saída visível deve existir,
a intenção de envio deve ser durável antes da tentativa de chamada à plataforma, e o
recibo da plataforma deve ser confirmado após o êxito. Isso fornece recuperação
de pelo menos uma vez por padrão. O comportamento de exatamente uma vez só existe quando um adaptador comprova
idempotência nativa ou reconcilia uma tentativa com resultado desconhecido após o envio com o
estado da plataforma antes de repeti-la.

## O que foi lançado

O domínio interno fica em `src/channels/message/*`:

| Arquivo                     | Responsabilidade                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Contratos de tipos de adaptador, contexto de envio, recibo e intenção durável                                      |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — o contexto de envio durável                          |
| `receive.ts`                | `createMessageReceiveContext` — máquina de estados da política de confirmação de entrada                           |
| `live.ts`                   | Estado da prévia ao vivo e lógica de finalizar no local ou recorrer a uma alternativa                              |
| `state.ts`                  | `classifyDurableSendRecoveryState` — classificação da recuperação após uma interrupção                             |
| `receipt.ts`                | Normaliza os resultados de envio da plataforma em `MessageReceipt`                                                 |
| `capabilities.ts`           | Deriva de um payload os recursos necessários para uma entrega final durável                                        |
| `contracts.ts`              | Verificação de comprovação de contrato para recursos declarados pelo adaptador                                     |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — encapsula funções legadas `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — fila durável de eventos de entrada                                                   |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — diário de aceitação/pendência/conclusão/liberação para desduplicação de entrada |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` e encapsuladores com nomes legados                                                   |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, auxiliares de prefixo de resposta e callback de digitação                            |

Superfície pública: `openclaw/plugin-sdk/channel-outbound` (auxiliares de envio/recibo/durabilidade/prévia ao vivo/pipeline de respostas)
e `openclaw/plugin-sdk/channel-inbound` (contexto de entrada, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Consulte essas páginas para ver exemplos de adaptadores, nomes de
tipos atuais e notas de migração — elas são a fonte da verdade sobre a estrutura da API,
não os esboços abaixo.

### Contexto de envio

`withDurableMessageSendContext` fornece ao código do canal as etapas `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` e `fail` em torno de uma mensagem de
saída. `sendDurableMessageBatch` é o encapsulador para o caso comum: renderizar, enviar
e então confirmar em `sent`/`suppressed` ou falhar em caso de erro.

`sendDurableMessageBatch` retorna um resultado discriminado:

| Status           | Significado                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | Pelo menos uma mensagem visível foi entregue na plataforma                       |
| `suppressed`     | Nenhuma mensagem da plataforma deve ser considerada ausente (cancelada por hook, execução simulada etc.) |
| `partial_failed` | Pelo menos uma mensagem foi entregue antes de um payload ou efeito colateral posterior falhar |
| `failed`         | Nenhum recibo da plataforma foi produzido                                        |

A durabilidade é `required`, `best_effort` ou `disabled`
(`MessageDurabilityPolicy` em `src/channels/message/types.ts`). `required`
interrompe com falha quando não é possível gravar a intenção durável; `best_effort` prossegue
com um envio direto quando a persistência está indisponível; `disabled` mantém o
comportamento de envio direto anterior à refatoração. Os auxiliares de compatibilidade legados usam
`disabled` por padrão e não inferem `required` apenas porque um canal tem um
adaptador genérico de saída.

O limite que continua perigoso: depois que a chamada à plataforma tem êxito e antes
que o recibo seja confirmado. Se o processo encerrar nesse ponto, o núcleo não poderá saber se a
mensagem da plataforma existe, a menos que o adaptador declare `reconcileUnknownSend`.
Esse hook classifica um envio interrompido como `sent`, `not_sent` ou
`unresolved`; somente `not_sent` permite uma nova tentativa. Canais sem reconciliação
recorrem ao estado `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) e podem optar por repetição
de pelo menos uma vez somente se mensagens visíveis duplicadas forem uma contrapartida aceitável e
documentada para esse canal.

### Contexto de recebimento

`createMessageReceiveContext` acompanha o estado de confirmação/rejeição de cada evento de entrada com um
`ack()` idempotente e `nack(error)` explícito. A política de confirmação
(`ChannelMessageReceiveAckPolicy`) é uma destas:

| Política               | Confirma quando                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | O núcleo persistiu metadados de entrada suficientes para desduplicar/rotear uma nova entrega   |
| `after_agent_dispatch` | A execução do agente foi despachada                                                            |
| `after_durable_send`   | O envio de saída durável desta interação foi confirmado                                        |
| `manual`               | O chamador controla explicitamente o momento da confirmação (o padrão para adaptadores que não declaram uma política) |

O polling do Telegram usa isso para persistir uma marca d'água segura de atualizações concluídas
(`safeCompletedUpdateId` em `extensions/telegram/src/bot-update-tracker.ts`):
o grammY ainda observa cada atualização quando ela entra na cadeia de middleware, mas
o OpenClaw só avança a marca d'água persistida de reinicialização para além das atualizações que
concluíram o despacho, portanto atualizações com falha ou ainda pendentes são repetidas após uma reinicialização.
O deslocamento `getUpdates` do Telegram ainda pertence ao grammY; uma fonte de
polling totalmente durável que controle novas entregas no nível da plataforma para além dessa
marca d'água ainda não foi criada (consulte Questões em aberto).

### Prévia ao vivo

`src/channels/message/live.ts` modela prévia/edição/finalização como um único ciclo de vida:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` e
`deliverFinalizableLivePreviewAdapter` (cria uma edição final a partir de um rascunho, aplica
essa edição e recorre a um envio normal quando a edição não é possível ou falha).
`LiveMessageState.phase` é `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` controla se uma prévia pode se tornar a mensagem
final por meio de edição, em vez de um novo envio.

### Recibos duráveis

`MessageReceipt` (`src/channels/message/types.ts`) normaliza um ou mais
identificadores de mensagem da plataforma de um único envio lógico em `platformMessageIds`, além de
`parts` por parte (tipo, índice, identificador de thread, identificador da mensagem respondida). Um identificador principal é mantido
para encadeamento e edições posteriores. É isso que permite que entregas com várias partes (texto
mais mídia, texto dividido em blocos, alternativa para cartão) possam ser repetidas e desduplicadas após
uma reinicialização.

### Redução da SDK pública

A refatoração incorporou ou descontinuou: auxiliares `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking` e `reply-payload` expostos como API
pública, `inbound-reply-dispatch`, `channel-reply-pipeline` e a maioria dos usos
públicos de `outbound-runtime`. `src/plugin-sdk/channel-message.ts` agora é um
arquivo agregador de reexportação `@deprecated` que aponta para `channel-outbound` /
`channel-inbound`; os aliases de tempo de execução `channel.turn` foram removidos e a antiga
página de documentação `/plugins/sdk-channel-turn` redireciona para a
[API de entrada de canais](/pt-BR/plugins/sdk-channel-inbound). Novos códigos de Plugin devem
usar diretamente `channel-outbound` e `channel-inbound`.

## Onde a implementação divergiu do design original

O esboço de design abaixo nunca foi lançado literalmente como descrito. Ele é mantido para
precisão histórica; não trate esses nomes de tipos como a API atual.

- **Não há `MessageOrigin` / `shouldDropOpenClawEcho`.** O plano original previa
  uma tag de origem `source: "openclaw"` em mensagens de falha do Gateway, além de um
  predicado compartilhado que descartaria ecos marcados e gerados pelo bot em salas compartilhadas
  antes da autorização `allowBots`. Esse tipo e esse predicado não existem na
  base de código. O próprio `allowBots` é uma chave real de configuração por canal (Slack,
  Discord, Google Chat e outros), mas o mecanismo de marcação de origem que deveria
  protegê-lo nunca foi criado. A supressão de ecos de falhas do Gateway em
  salas com bots habilitados continua sendo uma lacuna em aberto, não uma garantia lançada.
- **Não há um namespace unificado `core.messages.receive/send/live/state`.** As
  funções lançadas ficam diretamente em `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`), em vez de
  atrás de uma fachada `core.messages.*`.
- **Não há um tipo de mensagem normalizado e genérico `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  O núcleo ainda passa payloads concretos de resposta
  (`ReplyPayload`) e contextos específicos de canal pelos adaptadores de envio,
  em vez de uma única estrutura de mensagem neutra em relação à plataforma com uma relação `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Os nomes das políticas de confirmação diferem do esboço.** Lançados:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  O esboço original usava `immediate | after-record | after-durable-send |
manual` com um campo de motivo de tempo limite do Webhook; essa estrutura não foi criada.
- **As chaves de recursos de `DurableFinalDeliveryRequirementMap` substituíram o objeto
  `MessageCapabilities` esboçado.** Os recursos são sinalizadores booleanos simples (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) verificados por meio de `verifyDurableFinalCapabilityProofs`, em vez
  de uma estrutura aninhada no estilo `text.chunking` / `attachments.voice`.

## Riscos concretos de migração (ainda relevantes)

Esses efeitos colaterais específicos de cada canal são anteriores à refatoração e devem continuar
funcionando por meio dos novos caminhos de envio. Eles não são hipotéticos: cada um está
implementado e é essencial atualmente.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): o monitor registra as mensagens enviadas em um cache de eco
  após um envio bem-sucedido. Os envios finais duráveis ainda devem preencher esse
  cache, ou o OpenClaw poderá reingerir as próprias respostas como mensagens recebidas de usuários.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): acrescenta uma assinatura opcional do modelo
  e registra os tópicos com participação após respostas em grupo. A entrega
  durável não deve ignorar esses efeitos.
- **Discord e outros despachantes preparados** já controlam a entrega direta e o
  comportamento de pré-visualização. Um canal não é durável de ponta a ponta até que seu despachante
  preparado encaminhe explicitamente os envios finais pelo contexto de envio; não presuma
  que apenas o adaptador genérico forneça essa cobertura.
- **A entrega de contingência silenciosa do Telegram** deve entregar todo o array de cargas úteis
  projetadas, não apenas a primeira carga útil, após a divisão em partes/projeção de
  contingência.
- **LINE, Zalo, Nostr** e caminhos auxiliares semelhantes podem ter tratamento de tokens
  de resposta, proxy de mídia, caches de mensagens enviadas ou destinos exclusivos de callback.
  Eles permanecem sob a entrega controlada pelo canal até que essas semânticas sejam representadas pelo
  adaptador de envio e cobertas por testes.
- **Auxiliares de mensagens diretas** podem ter um callback de resposta que seja o único
  destino correto do transporte. O envio genérico não deve inferir um destino a partir de campos
  brutos da plataforma e ignorar esse callback.

## Classificação de falhas

Os adaptadores classificam as falhas de transporte em categorias fechadas no estilo
`DeliveryFailureKind` (transitória, limite de taxa, autenticação, permissão, não encontrado, carga útil
inválida, conflito, cancelada, desconhecida). Política do núcleo:

- Tentar novamente em caso de falhas transitórias e de limite de taxa.
- Não tentar novamente em caso de falhas de carga útil inválida, a menos que exista uma alternativa de renderização.
- Não tentar novamente em caso de falhas de autenticação ou permissão até que a configuração seja alterada.
- Em caso de não encontrado, permitir que a finalização ao vivo use como contingência um novo envio em vez da edição quando
  o canal declarar que isso é seguro.
- Em caso de conflito, usar o estado de recibo/idempotência para decidir se a mensagem
  já existe.
- Qualquer erro ocorrido depois que a chamada à plataforma possa ter sido bem-sucedida, mas antes da confirmação
  do recibo, torna-se `unknown_after_send`, a menos que o adaptador prove que a operação
  na plataforma não ocorreu.

## Questões em aberto

- Se o Telegram deverá futuramente substituir o executor de polling do grammY (`1.43.0`)
  por uma fonte de polling totalmente durável que controle a reentrega no nível da
  plataforma, e não apenas a marca d'água persistida de reinicialização do OpenClaw
  (`safeCompletedUpdateId`).
- Se o estado da pré-visualização ao vivo deverá residir no mesmo registro que a intenção de envio
  final ou em um armazenamento irmão de estado ao vivo.
- Se a supressão de eco em caso de falha do Gateway em salas compartilhadas com bots habilitados precisa
  do mecanismo de marcação de origem planejado originalmente, de um contrato por canal
  mais simples ou se está fora do escopo.
- Quais canais têm suporte nativo a origem/metadados para supressão de eco
  entre bots e quais precisam de um registro persistido de envios.

## Relacionado

- [Mensagens](/pt-BR/concepts/messages)
- [Transmissão e divisão em partes](/pt-BR/concepts/streaming)
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts)
- [Política de novas tentativas](/pt-BR/concepts/retry)
- [API de saída de canais](/pt-BR/plugins/sdk-channel-outbound)
- [API de entrada de canais](/pt-BR/plugins/sdk-channel-inbound)
