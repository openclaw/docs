---
read_when:
    - Refatoração do comportamento de envio ou recebimento do canal
    - Alteração das APIs de mensagens do SDK de plugins, do recebimento do canal, do encaminhamento de respostas, da fila de saída ou do streaming de pré-visualização
    - Projetando um novo plugin de canal que precisa de envios duráveis, confirmações de recebimento, prévias, edições ou novas tentativas
summary: 'Status do ciclo de vida durável de recebimento/envio de mensagens: o que foi lançado, o que mudou em relação ao design original e o que permanece em aberto'
title: Refatoração do ciclo de vida das mensagens
x-i18n:
    generated_at: "2026-07-12T15:06:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Esta página surgiu como uma proposta de design voltada para o futuro. Desde então, o núcleo desse
design foi lançado em `src/channels/message/*` e nos subcaminhos públicos
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Para a
API atual, use [API de saída de canais](/pt-BR/plugins/sdk-channel-outbound) e
[API de entrada de canais](/pt-BR/plugins/sdk-channel-inbound). Esta página registra o que
foi lançado, onde a implementação divergiu do esboço original e o que
ainda está em aberto.
</Note>

## Por que essa refatoração aconteceu

A pilha de canais cresceu a partir de várias correções locais: auxiliares de entrada separados por
nível de maturidade (`runtime.channel.inbound.run` para adaptadores simples,
`runtime.channel.inbound.runPreparedReply` para os mais avançados), auxiliares legados de despacho de respostas
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
streaming de pré-visualização específico por canal e durabilidade da entrega final acoplada
aos caminhos existentes de payload de resposta. Esse formato gerou conceitos públicos demais e
lugares demais onde a semântica de entrega poderia divergir.

A lacuna de confiabilidade que forçou o redesign:

```text
Atualização de polling do Telegram confirmada
  -> o texto final do assistente existe
  -> o processo reinicia antes que sendMessage seja concluído com sucesso
  -> a resposta final é perdida
```

Invariante-alvo: assim que o núcleo decidir que uma mensagem de saída visível deve existir,
a intenção de envio deverá ser durável antes da tentativa de chamada à plataforma, e o
recibo da plataforma deverá ser registrado após o sucesso. Isso proporciona recuperação
pelo menos uma vez por padrão. O comportamento exatamente uma vez só existe quando um adaptador comprova
idempotência nativa ou reconcilia uma tentativa com resultado desconhecido após o envio com o
estado da plataforma antes da repetição.

## O que foi lançado

O domínio interno reside em `src/channels/message/*`:

| Arquivo                     | Responsabilidade                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                  | Contratos de tipos de adaptador, contexto de envio, recibo e intenção durável                                                           |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — o contexto de envio durável                                               |
| `receive.ts`                | `createMessageReceiveContext` — máquina de estados da política de confirmação de entrada                                                |
| `live.ts`                   | Estado da pré-visualização ao vivo e lógica para finalizar no local ou recorrer a uma alternativa                                      |
| `state.ts`                  | `classifyDurableSendRecoveryState` — classificação da recuperação após uma interrupção                                                  |
| `receipt.ts`                | Normaliza os resultados de envio da plataforma em `MessageReceipt`                                                                      |
| `capabilities.ts`           | Deriva de um payload os recursos necessários para a finalização durável                                                                 |
| `contracts.ts`              | Verificação da comprovação de contrato para os recursos declarados pelo adaptador                                                        |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                                           |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — encapsula as funções legadas `sendText`/`sendMedia`/`sendPayload`/`sendPoll`                 |
| `ingress-queue.ts`          | `createChannelIngressQueue` — fila durável de eventos de entrada                                                                         |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — diário de aceitação/pendência/conclusão/liberação para desduplicação de entradas                 |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` e wrappers com nomes legados                                                                               |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, auxiliares de prefixo de resposta e de callback de digitação                                               |

Superfície pública: `openclaw/plugin-sdk/channel-outbound` (auxiliares de envio/recibo/durabilidade/tempo real/pipeline de resposta)
e `openclaw/plugin-sdk/channel-inbound` (contexto de entrada, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Consulte essas páginas para ver exemplos de adaptadores, nomes de
tipos atuais e notas de migração — elas são a fonte da verdade sobre o formato da API,
não os esboços abaixo.

### Contexto de envio

`withDurableMessageSendContext` fornece ao código do canal as etapas `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` e `fail` em torno de uma mensagem de
saída. `sendDurableMessageBatch` é o wrapper para o caso comum: renderizar, enviar
e depois registrar em caso de `sent`/`suppressed` ou falhar em caso de erro.

`sendDurableMessageBatch` retorna um resultado discriminado:

| Status           | Significado                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `sent`           | Pelo menos uma mensagem visível da plataforma foi entregue                                                   |
| `suppressed`     | Nenhuma mensagem da plataforma deve ser tratada como ausente (cancelamento por hook, simulação etc.)         |
| `partial_failed` | Pelo menos uma mensagem foi entregue antes da falha de um payload ou efeito colateral posterior              |
| `failed`         | Nenhum recibo da plataforma foi produzido                                                                    |

A durabilidade pode ser `required`, `best_effort` ou `disabled`
(`MessageDurabilityPolicy` em `src/channels/message/types.ts`). `required`
falha de forma fechada quando não é possível gravar a intenção durável; `best_effort` prossegue
com um envio direto quando a persistência está indisponível; `disabled` mantém o
comportamento de envio direto anterior à refatoração. Por padrão, os auxiliares legados de compatibilidade usam
`disabled` e não inferem `required` apenas porque um canal tem um adaptador
genérico de saída.

O limite que continua perigoso ocorre após o sucesso da chamada à plataforma e antes
do registro do recibo. Se o processo for encerrado nesse ponto, o núcleo não poderá saber se a
mensagem existe na plataforma, a menos que o adaptador declare `reconcileUnknownSend`.
Esse hook classifica um envio interrompido como `sent`, `not_sent` ou
`unresolved`; somente `not_sent` permite a repetição. Canais sem reconciliação
recorrem ao estado `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) e podem optar pela repetição
pelo menos uma vez somente se mensagens visíveis duplicadas forem uma contrapartida aceitável
e documentada para esse canal.

### Contexto de recebimento

`createMessageReceiveContext` acompanha o estado de confirmação/negação por evento de entrada com uma
função `ack()` idempotente e uma função `nack(error)` explícita. A política de confirmação
(`ChannelMessageReceiveAckPolicy`) pode ser:

| Política               | Confirma quando                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `after_receive_record` | O núcleo persistiu metadados de entrada suficientes para desduplicar/rotear uma nova entrega              |
| `after_agent_dispatch` | A execução do agente foi despachada                                                                        |
| `after_durable_send`   | O envio de saída durável desta interação foi registrado                                                    |
| `manual`               | O chamador controla explicitamente o momento da confirmação (o padrão para adaptadores que não declaram uma política) |

O polling do Telegram usa isso para persistir uma marca d'água de atualizações concluídas com segurança
(`safeCompletedUpdateId` em `extensions/telegram/src/bot-update-tracker.ts`):
o grammY ainda observa cada atualização ao entrar na cadeia de middleware, mas o
OpenClaw só avança a marca d'água persistida para reinicialização além das atualizações que
concluíram o despacho; assim, atualizações com falha ou ainda pendentes são repetidas após uma reinicialização.
O offset `getUpdates` upstream do Telegram continua sob responsabilidade do grammY; uma fonte de
polling totalmente durável que controle uma nova entrega no nível da plataforma além dessa
marca d'água ainda não foi criada (consulte Questões em aberto).

### Pré-visualização ao vivo

`src/channels/message/live.ts` modela pré-visualização/edição/finalização como um único ciclo de vida:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` e
`deliverFinalizableLivePreviewAdapter` (cria uma edição final a partir de um rascunho, aplica-a
e recorre a um envio normal quando a edição não é possível ou falha).
`LiveMessageState.phase` é `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` determina se uma pré-visualização pode se tornar a mensagem
final por meio de edição, em vez de um novo envio.

### Recibos duráveis

`MessageReceipt` (`src/channels/message/types.ts`) normaliza um ou mais
ids de mensagens da plataforma de um único envio lógico em `platformMessageIds`, além
de `parts` por parte (tipo, índice, id do tópico, id da mensagem respondida). Um id primário é mantido
para tópicos e edições posteriores. É isso que torna as entregas em várias partes (texto
mais mídia, texto fragmentado, alternativa para cartão) reproduzíveis e desduplicáveis após
uma reinicialização.

### Redução do SDK público

A refatoração incorporou ou descontinuou: auxiliares `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking` e `reply-payload` expostos como API
pública, `inbound-reply-dispatch`, `channel-reply-pipeline` e a maioria dos usos públicos
de `outbound-runtime`. Agora, `src/plugin-sdk/channel-message.ts` é um
barrel de reexportação `@deprecated` que aponta para `channel-outbound` /
`channel-inbound`; os aliases de runtime `channel.turn` foram removidos, e a antiga
página de documentação `/plugins/sdk-channel-turn` redireciona para a
[API de entrada de canais](/pt-BR/plugins/sdk-channel-inbound). Novos códigos de plugins devem
usar diretamente `channel-outbound` e `channel-inbound`.

## Onde a implementação divergiu do design original

O esboço de design abaixo nunca foi lançado exatamente como descrito. Ele foi mantido para
fins de precisão histórica; não trate esses nomes de tipos como a API atual.

- **Não há `MessageOrigin` / `shouldDropOpenClawEcho`.** O plano original previa
  uma tag de origem `source: "openclaw"` em mensagens de falha do Gateway, além de um
  predicado compartilhado que descarta ecos marcados e gerados por bots em salas compartilhadas
  antes da autorização `allowBots`. Esse tipo e esse predicado não existem na
  base de código. O próprio `allowBots` é uma chave de configuração real por canal (Slack,
  Discord, Google Chat e outros), mas o mecanismo de marcação de origem que deveria
  protegê-la nunca foi criado. A supressão de ecos de falha do Gateway em
  salas com bots habilitados continua sendo uma lacuna em aberto, e não uma garantia implementada.
- **Não há um namespace unificado `core.messages.receive/send/live/state`.** As
  funções implementadas residem diretamente em `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`), em vez de
  ficarem atrás de uma fachada `core.messages.*`.
- **Não há um tipo de mensagem normalizado e genérico `ChannelMessage` /
  `MessageTarget` / `MessageRelation`.** O núcleo ainda passa payloads concretos de resposta
  (`ReplyPayload`) e contextos específicos do canal pelos adaptadores de envio,
  em vez de um único formato de mensagem independente de plataforma com uma relação `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Os nomes das políticas de confirmação diferem do esboço.** Implementados:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  O esboço original usava `immediate | after-record | after-durable-send |
manual` com um campo de motivo para timeout de Webhook; esse formato não foi criado.
- **As chaves de recursos `DurableFinalDeliveryRequirementMap` substituíram o objeto
  `MessageCapabilities` do esboço.** Os recursos são sinalizadores booleanos simples (`text`,
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
  cache, ou o OpenClaw pode reingerir suas próprias respostas como mensagens recebidas do usuário.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): adiciona uma assinatura opcional do modelo
  e registra as conversas com participação após respostas em grupo. A entrega
  durável não deve ignorar esses efeitos.
- **Discord e outros despachantes preparados** já são responsáveis pela entrega direta e pelo
  comportamento de pré-visualização. Um canal não é durável de ponta a ponta até que seu despachante
  preparado encaminhe explicitamente os envios finais pelo contexto de envio; não presuma
  cobertura apenas pelo adaptador genérico.
- **A entrega silenciosa de fallback do Telegram** deve entregar todo o array de cargas úteis
  projetadas, não apenas a primeira carga útil, após a divisão em partes/projeção
  de fallback.
- **LINE, Zalo, Nostr** e caminhos auxiliares semelhantes podem ter tratamento de tokens
  de resposta, proxy de mídia, caches de mensagens enviadas ou destinos exclusivos de callback.
  Eles permanecem na entrega controlada pelo canal até que essas semânticas sejam representadas pelo
  adaptador de envio e cobertas por testes.
- **Auxiliares de mensagens diretas** podem ter um callback de resposta que seja o único destino
  de transporte correto. O envio genérico não deve deduzir um destino com base em campos brutos
  da plataforma e ignorar esse callback.

## Classificação de falhas

Os adaptadores classificam falhas de transporte em categorias fechadas no estilo
`DeliveryFailureKind` (transitória, limite de taxa, autenticação, permissão, não encontrado, carga útil
inválida, conflito, cancelada, desconhecida). Política do núcleo:

- Tentar novamente em falhas transitórias e de limite de taxa.
- Não tentar novamente em falhas de carga útil inválida, a menos que exista um fallback de renderização.
- Não tentar novamente em falhas de autenticação ou permissão até que a configuração seja alterada.
- Em caso de não encontrado, permitir que a finalização em tempo real use como fallback um novo envio em vez da edição quando
  o canal declarar que isso é seguro.
- Em caso de conflito, usar o estado de recibo/idempotência para decidir se a mensagem
  já existe.
- Qualquer erro após a chamada à plataforma possivelmente ter sido concluída, mas antes da confirmação
  do recibo, torna-se `unknown_after_send`, a menos que o adaptador prove que a operação
  na plataforma não ocorreu.

## Questões em aberto

- Se o Telegram deverá futuramente substituir o executor de polling do grammY (`1.43.0`)
  por uma origem de polling totalmente durável que controle a reentrega no nível
  da plataforma, e não apenas a marca d'água de reinicialização persistida do OpenClaw
  (`safeCompletedUpdateId`).
- Se o estado da pré-visualização em tempo real deverá residir no mesmo registro que a intenção de envio
  final ou em um armazenamento relacionado de estado em tempo real.
- Se a supressão de eco em caso de falha do Gateway em salas compartilhadas com bots habilitados precisa
  do mecanismo de marcação de origem planejado originalmente, de um contrato mais simples
  por canal ou se está fora do escopo.
- Quais canais têm suporte nativo a origem/metadados para supressão de eco
  entre bots e quais precisam de um registro persistido de envios.

## Relacionados

- [Mensagens](/pt-BR/concepts/messages)
- [Streaming e divisão em partes](/pt-BR/concepts/streaming)
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts)
- [Política de novas tentativas](/pt-BR/concepts/retry)
- [API de saída de canais](/pt-BR/plugins/sdk-channel-outbound)
- [API de entrada de canais](/pt-BR/plugins/sdk-channel-inbound)
