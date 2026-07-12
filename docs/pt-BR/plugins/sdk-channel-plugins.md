---
read_when:
    - Você está criando um novo plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um plugin de canal de mensagens para o OpenClaw
title: Criando plugins de canal
x-i18n:
    generated_at: "2026-07-12T15:30:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fa573f956bc710b72433d3e19421ab4af4cab8fc854b93dec371e029ce268273
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Este guia cria um plugin de canal que conecta o OpenClaw a uma plataforma de
mensagens: segurança de mensagens diretas, pareamento, encadeamento de respostas e envio de mensagens.

<Info>
  É sua primeira vez com plugins do OpenClaw? Leia primeiro os
  [Primeiros passos](/pt-BR/plugins/building-plugins) para conhecer a estrutura do pacote e a configuração do manifesto.
</Info>

## O que seu plugin controla

Plugins de canal não implementam ferramentas de envio/edição/reação; o núcleo fornece uma
ferramenta `message` compartilhada. Seu plugin controla:

- **Configuração** - resolução de contas e assistente de configuração
- **Segurança** - política de mensagens diretas e listas de permissões
- **Pareamento** - fluxo de aprovação de mensagens diretas
- **Gramática de sessão** - como os ids de conversa específicos do provedor são mapeados para chats
  base, ids de thread e alternativas de conversas pai
- **Saída** - envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** - como as respostas são organizadas em threads
- **Indicador de digitação do Heartbeat** - sinais opcionais de digitação/ocupado para destinos
  de entrega do Heartbeat

O núcleo controla a ferramenta de mensagens compartilhada, a integração com o prompt, o formato externo da chave de sessão,
a gestão genérica de `:thread:` e o despacho.

## Adaptador de mensagens

Exponha um adaptador `message` com `defineChannelMessageAdapter` de
`openclaw/plugin-sdk/channel-outbound`. Declare apenas os recursos duráveis de envio final
que seu transporte nativo realmente oferece, respaldados por um teste de contrato
que comprove o efeito colateral nativo e o recibo retornado. Direcione os envios de texto/mídia
às mesmas funções de transporte usadas pelo adaptador `outbound` legado. Para
o contrato completo da API, a matriz de recursos, as regras de recibos, a finalização de prévias
ao vivo, a política de confirmação de recebimento, os testes e a tabela de migração, consulte
[API de saída de canais](/pt-BR/plugins/sdk-channel-outbound).

Se seu adaptador `outbound` existente já tiver os métodos de envio e
metadados de recursos corretos, derive o adaptador `message` com
`createChannelMessageAdapterFromOutbound(...)` em vez de escrever manualmente outra
ponte. Os envios do adaptador retornam valores `MessageReceipt`. Para ids legados, derive-os
com `listMessageReceiptPlatformIds(...)` ou
`resolveMessageReceiptPrimaryId(...)` em vez de manter campos `messageIds`
paralelos.

Declare com precisão os recursos ao vivo e do finalizador - o núcleo os usa para decidir
o que um canal pode fazer, e a divergência entre o comportamento declarado e o real é uma
falha de teste de contrato:

| Superfície                            | Valores                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Canais que finalizam uma prévia de rascunho no próprio local devem encaminhar a lógica de runtime
por `defineFinalizableLivePreviewAdapter(...)` em conjunto com
`deliverWithFinalizableLivePreviewAdapter(...)` e manter os recursos declarados
respaldados por testes `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
e `verifyChannelMessageLiveFinalizerProofs(...)`, para que o comportamento nativo de prévia,
progresso, edição, alternativa/retenção, limpeza e recibos não possa divergir
silenciosamente.

Receptores de entrada que adiam confirmações da plataforma devem declarar
`message.receive.defaultAckPolicy` e `supportedAckPolicies` em vez de ocultar
o momento da confirmação no estado local do monitor. Cubra cada política declarada com
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Auxiliares legados de resposta, como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` e `recordInboundSessionAndDispatchReply`,
continuam disponíveis para despachantes de compatibilidade. Não os use em novo
código de canal; em vez disso, comece com o adaptador `message`, os recibos e os auxiliares
do ciclo de vida de recebimento/envio em `openclaw/plugin-sdk/channel-outbound`.

### Entrada de mensagens (experimental)

Canais que estão migrando a autorização de entrada podem usar o subcaminho experimental
`openclaw/plugin-sdk/channel-ingress-runtime` nos caminhos de recebimento do runtime.
Ele aceita fatos da plataforma, listas de permissões brutas, descritores de rota, fatos de comando
e configuração de grupos de acesso, e então retorna projeções de remetente/rota/comando/ativação,
além do grafo de entrada ordenado, enquanto a consulta à plataforma e os efeitos
colaterais permanecem no plugin. Mantenha a normalização de identidade do plugin no
descritor que você passa ao resolvedor; não serialize valores de correspondência brutos
do estado ou da decisão resolvida. Consulte
[API de entrada de canais](/pt-BR/plugins/sdk-channel-ingress) para conhecer o design da API,
o limite de responsabilidade e as expectativas de testes. O subcaminho mais antigo
`openclaw/plugin-sdk/channel-ingress` continua exportado como uma fachada de compatibilidade
obsoleta para plugins de terceiros.

### Indicadores de digitação

Se seu canal oferecer indicadores de digitação fora das respostas de entrada, exponha
`heartbeat.sendTyping(...)` no plugin de canal. O núcleo o chama com o destino
resolvido de entrega do Heartbeat antes do início da execução do modelo do Heartbeat e
usa o ciclo de vida compartilhado de manutenção e limpeza do indicador de digitação. Adicione
`heartbeat.clearTyping(...)` quando a plataforma exigir um sinal explícito de interrupção.

### Parâmetros de origem de mídia

Se seu canal adicionar parâmetros à ferramenta de mensagens que contenham origens de mídia, exponha
os nomes desses parâmetros por `plugin.actions.describeMessageTool(...).mediaSourceParams`.
O núcleo usa essa lista explícita para normalizar caminhos do sandbox e aplicar a política
de acesso à mídia de saída, para que plugins não precisem de casos especiais no núcleo
compartilhado para parâmetros específicos do provedor relacionados a avatar, anexo ou imagem de capa.

Prefira um mapa indexado por ação, como `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
para que ações não relacionadas não herdem os argumentos de mídia de outra ação. Um array simples
ainda funciona para parâmetros compartilhados intencionalmente entre todas as ações expostas.

Canais que precisam expor uma URL pública temporária para uma busca de mídia
realizada pela plataforma podem usar `createHostedOutboundMediaStore(...)` de
`openclaw/plugin-sdk/outbound-media` com os armazenamentos de estado do plugin. Mantenha a
análise de rotas da plataforma e a aplicação de tokens no plugin de canal; o auxiliar compartilhado
controla apenas o carregamento de mídia, os metadados de expiração, as linhas de blocos e a limpeza.

### Formatação de payload nativo

Se seu canal precisar de formatação específica do provedor para `message(action="send")`,
prefira `actions.prepareSendPayload(...)`. Coloque cartões nativos, blocos, incorporações ou
outros dados duráveis em `payload.channelData.<channel>` e deixe o núcleo enviá-los
pelo adaptador de saída/mensagens. Use `actions.handleAction(...)` para envio
apenas como alternativa de compatibilidade para payloads que não possam ser serializados e
tentados novamente.

### Gramática de conversas da sessão

Se sua plataforma armazenar escopo adicional nos ids de conversa, mantenha essa análise
no plugin com `messaging.resolveSessionConversation(...)`. Esse é o
gancho canônico para mapear `rawId` para o id da conversa base, um
id de thread opcional, um `baseConversationId` explícito e quaisquer
`parentConversationCandidates`. Ao retornar `parentConversationCandidates`,
ordene-os da conversa pai mais específica para a conversa mais ampla/base.

`messaging.resolveParentConversationCandidates(...)` é uma alternativa de compatibilidade
obsoleta para plugins que precisam apenas de alternativas de conversas pai além do
id genérico/bruto. Se ambos os ganchos existirem, o núcleo usa primeiro
`resolveSessionConversation(...).parentConversationCandidates` e só
recorre a `resolveParentConversationCandidates(...)` quando o gancho canônico
os omite.

Plugins incluídos que precisam da mesma análise antes da inicialização do registro de canais
podem expor um arquivo `session-key-api.ts` de nível superior com uma exportação
`resolveSessionConversation(...)` correspondente (consulte os plugins Feishu e Telegram).
O núcleo usa essa superfície segura para inicialização apenas quando o registro de plugins
do runtime ainda não está disponível.

Use `openclaw/plugin-sdk/channel-route` quando o código do plugin precisar normalizar
campos semelhantes a rotas, comparar uma thread filha com sua rota pai ou criar uma
chave estável de eliminação de duplicidade a partir de `{ channel, to, accountId, threadId }`. O auxiliar
normaliza ids numéricos de thread da mesma forma que o núcleo, portanto prefira-o a comparações
ad hoc com `String(threadId)`. Plugins com uma gramática de destino específica do provedor
devem expor `messaging.resolveOutboundSessionRoute(...)` para que o núcleo obtenha
a identidade nativa do provedor para sessão e thread sem adaptações no analisador.

### Suporte a vinculação de conversas com escopo de conta

Defina `conversationBindings.supportsCurrentConversationBinding` quando o canal
oferecer suporte a vinculações genéricas da conversa atual. `createChatChannelPlugin(...)`
define esse recurso estático como `true` por padrão.

Se o suporte variar de acordo com a conta configurada, implemente também
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
O núcleo avalia esse gancho síncrono somente depois que o recurso estático é
habilitado. Retornar `false` torna indisponíveis, para essa conta, o recurso genérico
da conversa atual e as operações de vincular, consultar, listar, atualizar e desvincular.
Omitir o gancho aplica o recurso estático a todas as contas.

Resolva a resposta usando a configuração da conta ou o estado do runtime já carregado. Esse
gancho controla apenas as vinculações genéricas da conversa atual; ele não substitui
as regras de vinculação configuradas nem o roteamento de sessões controlado pelo plugin. Os testes
de contrato devem cobrir pelo menos uma conta compatível e uma incompatível por meio do
contrato `ChannelPlugin["conversationBindings"]` exportado por
`openclaw/plugin-sdk/channel-core`.

## Aprovações e recursos do canal

A maioria dos plugins de canal não precisa de código específico para aprovações. O núcleo controla
`/approve` no mesmo chat, os payloads compartilhados dos botões de aprovação e a entrega
alternativa genérica. `ChannelPlugin.approvals` foi removido; em vez disso, coloque os fatos
de entrega/nativo/renderização/autorização de aprovação em um único objeto `approvalCapability`.
`plugin.auth` serve apenas para login/logout - o núcleo não lê mais ganchos de autorização
de aprovação desse objeto.

Use `approvalCapability.delivery` somente para roteamento nativo de aprovação ou supressão
de alternativas, e `approvalCapability.render` somente quando um canal realmente precisar
de payloads de aprovação personalizados em vez do renderizador compartilhado.

### Autorização de aprovação

- `approvalCapability.authorizeActorAction` e
  `approvalCapability.getActionAvailabilityState` são a interface canônica
  de autorização de aprovação.
- Use `getActionAvailabilityState` para determinar a disponibilidade da autorização de aprovação no mesmo chat.
  Mantenha os aprovadores configurados disponíveis para `/approve` mesmo quando a entrega nativa
  estiver desabilitada; em vez disso, use o estado nativo da superfície de iniciação para orientação
  sobre entrega/configuração.
- Se seu canal expuser aprovações de execução nativas, use
  `approvalCapability.getExecInitiatingSurfaceState` para o estado
  da superfície de iniciação/cliente nativo quando ele for diferente da autorização de aprovação
  no mesmo chat. O núcleo usa esse gancho específico de execução para distinguir `enabled` de
  `disabled`, decidir se o canal de iniciação oferece suporte a aprovações de execução nativas
  e incluir o canal na orientação de alternativa do cliente nativo.
  `createApproverRestrictedNativeApprovalCapability(...)` preenche isso no
  caso comum.
- Se um canal puder inferir identidades estáveis de mensagens diretas semelhantes às de um proprietário com base na configuração existente,
  use `createResolvedApproverActionAuthAdapter` de
  `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat
  sem adicionar lógica específica de aprovação ao núcleo.
- Se a autorização de aprovação personalizada permitir intencionalmente apenas a alternativa no mesmo chat, retorne
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` de
  `openclaw/plugin-sdk/approval-auth-runtime`; caso contrário, o núcleo tratará o
  resultado como autorização explícita do aprovador.
- Se um callback nativo controlado pelo canal resolver aprovações diretamente, use
  `isImplicitSameChatApprovalAuthorization(...)` antes de resolver, para que a alternativa
  implícita ainda passe pela autorização normal de ator do canal.

### Ciclo de vida do payload e orientação de configuração

- Use `outbound.shouldSuppressLocalPayloadPrompt` ou
  `outbound.beforeDeliverPayload` para comportamentos do ciclo de vida da carga
  específicos do canal, como ocultar solicitações locais de aprovação duplicadas
  ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que
  a resposta do caminho desabilitado explique os controles exatos de configuração
  necessários para habilitar aprovações nativas de execução. O hook recebe
  `{ channel, channelLabel, accountId }`; canais com contas nomeadas devem renderizar
  caminhos com escopo de conta, como
  `channels.<channel>.accounts.<id>.execApprovals.*`, em vez dos valores padrão
  de nível superior.
- Use `approvalCapability.describePluginApprovalSetup` quando for seguro exibir
  orientações sobre falhas de aprovação de Plugin para falhas sem rota e por
  tempo limite. `createApproverRestrictedNativeApprovalCapability(...)` não
  infere isso de `describeExecApprovalSetup`; passe explicitamente o mesmo helper
  somente quando as aprovações de Plugin e de execução realmente usarem a mesma
  configuração nativa.

### Entrega de aprovação nativa

Se um canal precisar de entrega de aprovação nativa, mantenha o código do canal
focado na normalização do destino e nos fatos de transporte/apresentação. Use
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` e
`createApproverRestrictedNativeApprovalCapability` de
`openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal
por trás de `approvalCapability.nativeRuntime`, preferencialmente por meio de
`createChannelApprovalNativeRuntimeAdapter(...)` ou
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o núcleo possa
montar o manipulador e controlar a filtragem de solicitações, o roteamento, a
desduplicação, a expiração, a assinatura do Gateway e os avisos de roteamento
para outro local.

`nativeRuntime` é dividido em algumas interfaces menores:

- `availability` - se a conta está configurada e se uma solicitação deve ser
  processada
- `presentation` - mapeia o modelo de visualização compartilhado da aprovação
  para cargas nativas pendentes/resolvidas/expiradas ou ações finais
- `transport` - prepara destinos e envia/atualiza/exclui mensagens nativas de
  aprovação
- `interactions` - hooks opcionais para vincular/desvincular/limpar ações de
  botões ou reações nativas, além de um hook opcional `cancelDelivered`.
  Implemente `cancelDelivered` quando `deliverPending` registrar estado persistente
  ou no processo (como um armazenamento de destinos de reação), para que esse
  estado possa ser liberado se a interrupção de um manipulador cancelar a entrega
  antes da execução de `bindPending`, ou quando `bindPending` não retornar nenhum
  identificador
- `observe` - hooks opcionais de diagnóstico da entrega

Outros helpers de aprovação:

- Use `createNativeApprovalChannelRouteGates` de
  `openclaw/plugin-sdk/approval-native-runtime` quando um canal oferecer tanto
  entrega nativa na origem da sessão quanto destinos explícitos de encaminhamento
  de aprovação. O helper centraliza a seleção da configuração de aprovação, o
  tratamento de `mode`, os filtros de agente/sessão, a vinculação de conta, a
  correspondência do destino da sessão e a correspondência da lista de destinos,
  enquanto os chamadores continuam responsáveis pelo ID do canal, modo padrão
  de encaminhamento, consulta da conta, verificação de transporte habilitado,
  normalização do destino e resolução do destino de origem do turno. Não o use
  para criar valores padrão de política de canal controlados pelo núcleo; passe
  explicitamente o modo padrão documentado do canal.
- `createChannelNativeOriginTargetResolver` usa por padrão o comparador
  compartilhado de rotas de canal para destinos `{ to, accountId, threadId }`.
  Passe `targetsMatch` somente quando um canal tiver regras de equivalência
  específicas do provedor, como a correspondência de prefixos de carimbo de data
  e hora do Slack. Passe `normalizeTargetForMatch` quando o canal precisar
  canonicalizar IDs do provedor antes da execução do comparador de rotas padrão
  ou de um callback `targetsMatch` personalizado, preservando o destino original
  para a entrega. Use `normalizeTarget` somente quando o próprio destino de entrega
  resolvido precisar ser canonicalizado.
- Se o canal precisar de objetos controlados pelo runtime, como um cliente, token,
  aplicativo Bolt ou receptor de Webhook, registre-os por meio de
  `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto
  de runtime permite que o núcleo inicialize manipuladores orientados por
  capacidades a partir do estado de inicialização do canal sem adicionar código
  intermediário específico de aprovação.
- Recorra a `createChannelApprovalHandler` ou
  `createChannelNativeApprovalRuntime`, de nível mais baixo, somente quando a
  interface orientada por capacidades ainda não for expressiva o suficiente.
- Canais de aprovação nativa devem rotear tanto `accountId` quanto `approvalKind`
  por meio desses helpers. `accountId` mantém a política de aprovação de várias
  contas restrita à conta de bot correta, e `approvalKind` mantém o comportamento
  de aprovação de execução versus Plugin disponível para o canal sem ramificações
  codificadas diretamente no núcleo.
- O núcleo também controla os avisos de redirecionamento de aprovação. Plugins de
  canal não devem enviar suas próprias mensagens de acompanhamento "a aprovação
  foi enviada para mensagens diretas/outro canal" por meio de
  `createChannelNativeApprovalRuntime`; em vez disso, exponha um roteamento preciso
  da origem e da mensagem direta do aprovador por meio dos helpers compartilhados
  da capacidade de aprovação e permita que o núcleo agregue as entregas efetivas
  antes de publicar qualquer aviso no chat de origem.
- Preserve de ponta a ponta o tipo de ID da aprovação entregue. Clientes nativos
  não devem presumir nem reescrever o roteamento de aprovação de execução versus
  Plugin com base em estado local do canal.
- Passe esse `approvalKind` explícito para `resolveApprovalOverGateway`. Isso usa
  o serviço canônico `approval.resolve` e retorna o vencedor registrado quando
  outra superfície responde primeiro. A entrada explícita mais antiga
  `resolveMethod` continua disponível para controles baseados em comandos; novas
  ações nativas não devem usá-la nem inferir o tipo a partir de um ID.
- Diferentes tipos de aprovação podem expor intencionalmente diferentes
  superfícies nativas. Exemplos integrados atuais: Matrix mantém o mesmo
  roteamento nativo de mensagem direta/canal e a experiência de reação para
  aprovações de execução e de Plugin, mas ainda permite que a autenticação varie
  conforme o tipo de aprovação; Slack mantém o roteamento de aprovação nativa
  disponível para IDs de execução e de Plugin.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como um wrapper de
  compatibilidade, mas código novo deve preferir o construtor de capacidade e
  expor `approvalCapability` no Plugin.

### Subcaminhos mais específicos do runtime de aprovação

Para pontos de entrada de canal críticos, prefira estes subcaminhos mais
específicos ao barrel mais amplo `approval-runtime` quando precisar apenas de
uma parte dessa família:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Da mesma forma, prefira `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` a superfícies agregadoras mais amplas quando
não precisar de todas elas.

### Subcaminhos de configuração

- `openclaw/plugin-sdk/setup-runtime` abrange os helpers de configuração seguros
  para o runtime: `createSetupTranslator`, adaptadores de patch de configuração
  seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`),
  saída de observações de consulta, `promptResolvedAllowFrom`,
  `splitSetupEntries` e os construtores delegados de proxy de configuração.
- `openclaw/plugin-sdk/channel-setup` abrange os construtores de configuração de
  instalação opcional e alguns elementos primitivos seguros para configuração:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
  `splitSetupEntries`.
- Use a interface mais ampla `openclaw/plugin-sdk/setup` somente quando também
  precisar dos helpers compartilhados mais pesados de configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Se o canal quiser apenas anunciar "instale primeiro este Plugin" nas superfícies
de configuração, prefira `createOptionalChannelSetupSurface(...)`. O
adaptador/assistente gerado adota falha segura nas gravações e na finalização da
configuração, e reutiliza a mesma mensagem de instalação obrigatória na
validação, na finalização e no texto do link da documentação.

Se o canal aceitar configuração ou autenticação orientada por variáveis de
ambiente, e os fluxos genéricos de inicialização/configuração precisarem conhecer
esses nomes de variáveis antes que o runtime seja carregado, declare-os no
manifesto do Plugin com `channelEnvVars`. Mantenha `envVars` do runtime do canal
ou constantes locais somente para textos voltados aos operadores.

Se o canal puder aparecer em `status`, `channels list`, `channels status` ou
verificações de SecretRef antes da inicialização do runtime do Plugin, adicione
`openclaw.setupEntry` em `package.json`. Esse ponto de entrada deve poder ser
importado com segurança em caminhos de comandos somente leitura e deve retornar
os metadados do canal, o adaptador de configuração seguro, o adaptador de status
e os metadados dos destinos secretos do canal necessários para esses resumos.
Não inicialize clientes, listeners ou runtimes de transporte a partir do ponto
de entrada de configuração.

Mantenha também específico o caminho de importação da entrada principal do canal.
A descoberta pode avaliar a entrada e o módulo do Plugin de canal para registrar
capacidades sem ativar o canal. Arquivos como `channel-plugin-api.ts` devem
exportar o objeto do Plugin de canal sem importar assistentes de configuração,
clientes de transporte, listeners de socket, inicializadores de subprocessos ou
módulos de inicialização de serviço. Coloque essas partes do runtime em módulos
carregados a partir de `registerFull(...)`, setters de runtime ou adaptadores
preguiçosos de capacidade.

### Outros subcaminhos específicos de canal

Para outros caminhos críticos de canal, prefira os helpers específicos às
superfícies legadas mais amplas:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração de várias contas e
  fallback para a conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/channel-inbound` para rota/envelope de entrada e integração
  de registro e despacho
- `openclaw/plugin-sdk/channel-targets` para helpers de análise de destinos
- `openclaw/plugin-sdk/outbound-media` para carregamento de mídia e
  `openclaw/plugin-sdk/channel-outbound` para delegados de identidade/envio de
  saída e planejamento de cargas
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` quando uma rota de saída precisar preservar
  um `replyToId`/`threadId` explícito ou recuperar a sessão `:thread:` atual
  depois que a chave da sessão base ainda corresponder. Plugins de provedor podem
  substituir a precedência, o comportamento do sufixo e a normalização do ID da
  thread quando a plataforma tiver semântica nativa de entrega em threads.
- `openclaw/plugin-sdk/thread-bindings-runtime` para o ciclo de vida da vinculação
  de threads e o registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` somente quando ainda for necessário
  um layout legado de campos de carga de agente/mídia
- `openclaw/plugin-sdk/telegram-command-config` (obsoleto: nenhum Plugin integrado
  o usa em produção) para normalização de comandos personalizados do Telegram,
  validação de duplicidades/conflitos e um contrato de configuração de comandos
  estável em fallback; para código novo de Plugin, prefira o tratamento local da
  configuração de comandos

Canais somente de autenticação geralmente podem parar no caminho padrão: o núcleo
processa as aprovações, e o Plugin apenas expõe capacidades de saída/autenticação.
Canais de aprovação nativa, como Matrix, Slack, Telegram e transportes de chat
personalizados, devem usar os helpers nativos compartilhados em vez de implementar
o próprio ciclo de vida de aprovação.

## Política de menções de entrada

Mantenha o processamento de menções de entrada dividido em duas camadas:

- coleta de evidências controlada pelo Plugin
- avaliação compartilhada de política

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões da política de
menções. Use `openclaw/plugin-sdk/channel-inbound` somente quando precisar do
barrel mais amplo de helpers de entrada.

Adequado para lógica local do Plugin:

- detecção de resposta ao bot
- detecção de bot citado
- verificações de participação na thread
- exclusões de mensagens de serviço/sistema
- caches nativos da plataforma necessários para comprovar a participação do bot

Adequado para o helper compartilhado:

- `requireMention`
- resultado de menção explícita
- lista de permissões de menções implícitas
- desvio para comandos
- decisão final de ignorar

Fluxo preferencial:

1. Calcule os fatos locais de menção.
2. Passe esses fatos para `resolveInboundMentionDecision({ facts, policy })`.
3. Use `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e
   `decision.shouldSkip` no seu controle de entrada.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` retorna um booleano. `hasAnyMention`,
`isExplicitlyMentioned` e `canResolveExplicit` vêm dos próprios metadados
nativos de menção do canal (entidades da mensagem, sinalizadores de resposta
ao bot e semelhantes); forneça valores `false`/`undefined` quando sua
plataforma não puder detectá-los.

`api.runtime.channel.mentions` expõe os mesmos auxiliares compartilhados de
menção para plugins de canal incluídos que já dependem de injeção de runtime:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Se você precisar apenas de `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importe de
`openclaw/plugin-sdk/channel-mention-gating` para evitar carregar auxiliares de
runtime de entrada não relacionados.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do plugin. O campo `channels` em
    `openclaw.plugin.json` (não um campo `kind`) é o que marca um manifesto como
    proprietário de um canal. Para ver toda a superfície de metadados do
    pacote, consulte
    [Configuração do plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Conecte o OpenClaw ao Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin do canal Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Token do bot",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valida `plugins.entries.acme-chat.config`. Use-o para
    configurações pertencentes ao plugin que não façam parte da configuração
    da conta do canal. `channelConfigs.acme-chat.schema` valida
    `channels.acme-chat` e é a fonte do caminho frio usada pelo esquema de
    configuração, pela configuração inicial e pelas superfícies da interface
    antes que o runtime do plugin seja carregado. Consulte
    [Manifesto do plugin](/pt-BR/plugins/manifest) para ver a referência completa dos
    campos de nível superior.

  </Step>

  <Step title="Crie o objeto do plugin de canal">
    A interface `ChannelPlugin` tem muitas superfícies opcionais de adaptador.
    Comece com o mínimo — `id`, `config` e `setup` — e adicione adaptadores
    conforme necessário.

    Crie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // cliente da API da sua plataforma

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: o token é obrigatório");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // A resolução/inspeção da conta pertence a `config`, não a `setup`.
        // `setup` abrange gravações da configuração inicial (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // Segurança de MD: quem pode enviar mensagens ao bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pareamento: fluxo de aprovação para novos contatos por MD
      pairing: {
        text: {
          idLabel: "Nome de usuário do Acme Chat",
          message: "Envie este código para verificar sua identidade:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Código de pareamento: ${code}`);
          },
        },
      },

      // Encadeamento: como as respostas são entregues
      threading: { topLevelReplyToMode: "reply" },

      // Saída: envia mensagens para a plataforma
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Para canais que aceitam tanto chaves canônicas de MD no nível superior
    quanto chaves aninhadas legadas, use os auxiliares de
    `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`,
    `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e
    `normalizeChannelDmPolicy` mantêm os valores locais da conta à frente dos
    valores herdados da raiz. Combine o mesmo resolvedor com o reparo do doctor
    por meio de `normalizeLegacyDmAliases`, para que o runtime e a migração
    leiam o mesmo contrato.

    <Accordion title="O que createChatChannelPlugin faz por você">
      Em vez de implementar manualmente interfaces de adaptador de baixo nível,
      você passa opções declarativas e o construtor as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de MD com escopo baseado nos campos de configuração |
      | `pairing.text` | Fluxo de pareamento de MD baseado em texto com troca de código |
      | `threading` | Resolvedor do modo de resposta (fixo, com escopo de conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados do resultado (IDs de mensagem); requer um id `channel` irmão para que o núcleo possa marcar o resultado de entrega retornado |

      Você também pode passar objetos de adaptador brutos em vez das opções
      declarativas se precisar de controle total.

      Adaptadores de saída brutos podem definir uma função
      `chunker(text, limit, ctx)`. O `ctx.formatting` opcional contém decisões
      de formatação feitas no momento da entrega, como
      `maxLinesPerMessage`; aplique-as antes do envio para que o encadeamento
      de respostas e os limites dos fragmentos sejam resolvidos uma única vez
      pela entrega de saída compartilhada. Os contextos de envio também incluem
      `replyToIdSource` (`implicit` ou `explicit`) quando um destino de resposta
      nativo é resolvido, permitindo que os auxiliares de payload preservem
      tags explícitas de resposta sem consumir um espaço de resposta implícita
      de uso único.
    </Accordion>

  </Step>

  <Step title="Conecte o ponto de entrada">
    Crie `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin do canal Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Gerenciamento do Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gerenciamento do Acme Chat",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Coloque os descritores da CLI pertencentes ao canal em
    `registerCliMetadata(...)` para que o OpenClaw possa exibi-los na ajuda da
    raiz sem ativar todo o runtime do canal, enquanto os carregamentos completos
    normais ainda obtêm os mesmos descritores para o registro efetivo de
    comandos. Mantenha `registerFull(...)` para tarefas exclusivas do runtime.
    `defineChannelPluginEntry` trata automaticamente a divisão entre os modos
    de registro. Se `registerFull(...)` registrar métodos RPC do Gateway, use
    um prefixo específico do plugin. Os namespaces administrativos do núcleo
    (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecem
    reservados e sempre são resolvidos como `operator.admin`. Consulte
    [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para
    ver todas as opções.

  </Step>

  <Step title="Adicione uma entrada de configuração inicial">
    Crie `setup-entry.ts` para o carregamento leve durante a integração inicial:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega essa entrada em vez da entrada completa quando o canal
    está desativado ou não configurado. Isso evita carregar código pesado de
    runtime durante os fluxos de configuração inicial. Consulte
    [Configuração inicial](/pt-BR/plugins/sdk-setup#setup-entry) para obter detalhes.

    Canais incluídos no workspace que separam exportações seguras para a
    configuração inicial em módulos auxiliares podem usar
    `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisarem de um
    setter explícito de runtime durante a configuração inicial.

  </Step>

  <Step title="Processe mensagens de entrada">
    Seu plugin precisa receber mensagens da plataforma e encaminhá-las ao
    OpenClaw. O padrão típico é um Webhook que verifica a solicitação e a
    despacha por meio do manipulador de entrada do seu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticação gerenciada pelo plugin (verifique as assinaturas por conta própria)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Seu manipulador de entrada encaminha a mensagem para o OpenClaw.
          // A integração exata depende do SDK da sua plataforma —
          // veja um exemplo real no pacote do plugin integrado do Microsoft Teams ou Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      O tratamento de mensagens de entrada é específico de cada canal. Cada plugin de canal gerencia
      seu próprio pipeline de entrada. Consulte os plugins de canal integrados
      (por exemplo, o pacote do plugin do Microsoft Teams ou Google Chat) para ver padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Teste">
Escreva testes colocados junto ao código em `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("resolve a conta a partir da configuração", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspeciona a conta sem materializar segredos", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("informa a ausência de configuração", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Para auxiliares de teste compartilhados, consulte [Testes](/pt-BR/plugins/sdk-testing).

</Step>
</Steps>

## Estrutura de arquivos

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # metadados de openclaw.channel
├── openclaw.plugin.json      # Manifesto com esquema de configuração
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exportações públicas (opcional)
├── runtime-api.ts            # Exportações internas de runtime (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Testes
    ├── client.ts             # Cliente da API da plataforma
    └── runtime.ts            # Armazenamento de runtime (se necessário)
```

## Tópicos avançados

<CardGroup cols={2}>
  <Card title="Opções de encadeamento" icon="git-branch" href="/pt-BR/plugins/sdk-entrypoints#registration-mode">
    Modos de resposta fixo, por conta ou personalizado
  </Card>
  <Card title="Integração com a ferramenta de mensagens" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Resolução de destino" icon="crosshair" href="/pt-BR/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Auxiliares de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia e subagente via api.runtime
  </Card>
  <Card title="API de entrada do canal" icon="bolt" href="/pt-BR/plugins/sdk-channel-inbound">
    Ciclo de vida compartilhado dos eventos de entrada: ingestão, resolução, registro, encaminhamento e finalização
  </Card>
</CardGroup>

<Note>
Algumas interfaces auxiliares integradas ainda existem para manutenção e
compatibilidade de plugins integrados. Elas não são o padrão recomendado para novos plugins de canal;
prefira os subcaminhos genéricos de canal/configuração/resposta/runtime da interface comum do SDK,
a menos que você esteja mantendo diretamente essa família de plugins integrados.
</Note>

## Próximas etapas

- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - se o seu plugin também fornece modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de importações por subcaminho
- [Testes do SDK](/pt-BR/plugins/sdk-testing) - utilitários de teste e testes de contrato
- [Manifesto do plugin](/pt-BR/plugins/manifest) - esquema completo do manifesto

## Relacionado

- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Plugins do ambiente de execução de agentes](/pt-BR/plugins/sdk-agent-harness)
