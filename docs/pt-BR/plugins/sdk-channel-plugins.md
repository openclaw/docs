---
read_when:
    - Você está criando um novo plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - É necessário entender a superfície do adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um plugin de canal de mensagens para o OpenClaw
title: Criando plugins de canal
x-i18n:
    generated_at: "2026-07-16T12:47:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Este guia cria um Plugin de canal que conecta o OpenClaw a uma plataforma de
mensagens: segurança de mensagens diretas, pareamento, encadeamento de respostas e envio de mensagens.

<Info>
  Nunca usou plugins do OpenClaw? Leia primeiro [Primeiros passos](/pt-BR/plugins/building-plugins)
  para conhecer a estrutura do pacote e a configuração do manifesto.
</Info>

## Responsabilidades do seu Plugin

Os plugins de canal não implementam ferramentas de envio/edição/reação; o núcleo fornece uma
ferramenta `message` compartilhada. Seu Plugin é responsável por:

- **Configuração** - resolução de contas e assistente de configuração
- **Segurança** - política de mensagens diretas e listas de permissões
- **Pareamento** - fluxo de aprovação de mensagens diretas
- **Gramática da sessão** - como os IDs de conversa específicos do provedor são mapeados para chats
  básicos, IDs de threads e alternativas de conversas pai
- **Saída** - envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** - como as respostas são encadeadas
- **Indicador de digitação do Heartbeat** - sinais opcionais de digitação/ocupado para destinos de entrega
  do Heartbeat

O núcleo é responsável pela ferramenta de mensagens compartilhada, integração de prompts, formato externo da chave de sessão,
controle genérico de `:thread:` e despacho.

## Adaptador de mensagens

Exponha um adaptador `message` com `defineChannelMessageAdapter` de
`openclaw/plugin-sdk/channel-outbound`. Declare somente os recursos duráveis de envio final
que seu transporte nativo realmente comporta, respaldados por um teste de contrato
que comprove o efeito colateral nativo e o recibo retornado. Direcione os envios de texto/mídia
às mesmas funções de transporte usadas pelo adaptador `outbound` legado. Para
conhecer o contrato completo da API, a matriz de recursos, as regras de recibos, a finalização
da pré-visualização ao vivo, a política de confirmação de recebimento, os testes e a tabela de migração, consulte
[API de saída do canal](/pt-BR/plugins/sdk-channel-outbound).

Se o adaptador `outbound` existente já tiver os métodos de envio e os
metadados de recursos corretos, derive o adaptador `message` com
`createChannelMessageAdapterFromOutbound(...)` em vez de escrever manualmente outra
ponte. Os envios do adaptador retornam valores `MessageReceipt`. Para IDs legados, derive-os
com `listMessageReceiptPlatformIds(...)` ou
`resolveMessageReceiptPrimaryId(...)` em vez de manter campos `messageIds`
paralelos.

Declare com precisão os recursos ao vivo e de finalização — o núcleo os utiliza para decidir
o que um canal pode fazer, e uma divergência entre o comportamento declarado e o real é uma
falha no teste de contrato:

| Superfície                            | Valores                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Os canais que finalizam uma pré-visualização de rascunho no próprio local devem encaminhar a lógica de runtime
por `defineFinalizableLivePreviewAdapter(...)` mais
`deliverWithFinalizableLivePreviewAdapter(...)`, e manter os recursos declarados
respaldados pelos testes `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
e `verifyChannelMessageLiveFinalizerProofs(...)` para impedir divergências silenciosas
no comportamento nativo de pré-visualização, progresso, edição, alternativa/retenção, limpeza e recibos.

Os receptores de entrada que adiam as confirmações da plataforma devem declarar
`message.receive.defaultAckPolicy` e `supportedAckPolicies` em vez de ocultar
o momento da confirmação em um estado local do monitor. Cubra cada política declarada com
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Auxiliares legados de resposta, como `dispatchInboundReplyWithBase` e
`recordInboundSessionAndDispatchReply`, continuam disponíveis para despachantes
de compatibilidade. Não os utilize em novos códigos de canal; comece pelo adaptador `message`,
pelos recibos e pelos auxiliares do ciclo de vida de recebimento/envio em
`openclaw/plugin-sdk/channel-outbound`.

### Entrada de mensagens recebidas (experimental)

Os canais que estiverem migrando a autorização de entrada podem usar o subcaminho experimental
`openclaw/plugin-sdk/channel-ingress-runtime` nos caminhos de recebimento do runtime.
Ele aceita fatos da plataforma, listas de permissões brutas, descritores de rotas, fatos de comandos
e configuração de grupos de acesso, retornando projeções de remetente/rota/comando/ativação
e o grafo de entrada ordenado, enquanto a consulta à plataforma e os efeitos
colaterais permanecem no Plugin. Mantenha a normalização de identidade do Plugin no
descritor passado ao resolvedor; não serialize valores brutos de correspondência do
estado ou da decisão resolvida. Consulte
[API de entrada do canal](/pt-BR/plugins/sdk-channel-ingress) para conhecer o projeto da API,
o limite de responsabilidades e as expectativas de testes.

### Indicadores de digitação

Se o canal comportar indicadores de digitação fora das respostas a mensagens recebidas, exponha
`heartbeat.sendTyping(...)` no Plugin do canal. O núcleo o chama com o
destino de entrega resolvido do Heartbeat antes do início da execução do modelo do Heartbeat e
usa o ciclo de vida compartilhado de manutenção/limpeza do indicador de digitação. Adicione
`heartbeat.clearTyping(...)` quando a plataforma exigir um sinal explícito de interrupção.

### Parâmetros de origem de mídia

Se o canal adicionar parâmetros à ferramenta de mensagens que transportem origens de mídia, exponha
os nomes desses parâmetros por meio de `plugin.actions.describeMessageTool(...).mediaSourceParams`.
O núcleo usa essa lista explícita para normalizar caminhos da sandbox e aplicar a
política de acesso à mídia de saída, eliminando a necessidade de casos especiais no núcleo compartilhado
para parâmetros específicos do provedor de avatar, anexo ou imagem de capa.

Prefira um mapa indexado por ação, como `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
para que ações não relacionadas não herdem os argumentos de mídia de outra ação. Uma matriz simples
também funciona para parâmetros intencionalmente compartilhados entre todas as ações expostas.

Os canais que precisam expor uma URL pública temporária para a obtenção de mídia
pela plataforma podem usar `createHostedOutboundMediaStore(...)` de
`openclaw/plugin-sdk/outbound-media` com os armazenamentos de estado do Plugin. Mantenha a
análise de rotas da plataforma e a aplicação de tokens no Plugin do canal; o auxiliar compartilhado
é responsável apenas pelo carregamento de mídia, pelos metadados de expiração, pelas linhas de fragmentos e pela limpeza.

### Formatação de payloads nativos

Se o canal precisar de uma formatação específica do provedor para `message(action="send")`,
prefira `actions.prepareSendPayload(...)`. Coloque cartões nativos, blocos, incorporações ou
outros dados duráveis em `payload.channelData.<channel>` e permita que o núcleo faça o envio
pelo adaptador de saída/mensagens. Use `actions.handleAction(...)` no envio
somente como alternativa de compatibilidade para payloads que não possam ser serializados e
reenviados.

### Gramática de conversa da sessão

Se a plataforma armazenar escopo adicional nos IDs de conversa, mantenha essa análise
no Plugin com `messaging.resolveSessionConversation(...)`. Esse é o
gancho canônico para mapear `rawId` para o ID de conversa básico, o ID opcional
da thread, um `baseConversationId` explícito e quaisquer
`parentConversationCandidates`. Ao retornar `parentConversationCandidates`,
ordene-os da conversa pai mais específica para a conversa mais ampla/básica.

`messaging.resolveParentConversationCandidates(...)` é uma alternativa de compatibilidade
obsoleta para plugins que precisam apenas de alternativas de conversas pai além do
ID genérico/bruto. Se ambos os ganchos existirem, o núcleo usará
`resolveSessionConversation(...).parentConversationCandidates` primeiro e somente
recorrerá a `resolveParentConversationCandidates(...)` quando o gancho canônico
os omitir.

Os plugins incluídos que precisam da mesma análise antes da inicialização do registro de canais
podem expor um arquivo `session-key-api.ts` de nível superior com uma exportação
`resolveSessionConversation(...)` correspondente (consulte os plugins do Feishu e Telegram).
O núcleo usa essa superfície segura para inicialização somente quando o registro de plugins
do runtime ainda não está disponível.

Use `openclaw/plugin-sdk/channel-route` quando o código do Plugin precisar normalizar
campos semelhantes a rotas, comparar uma thread filha com sua rota pai ou criar uma
chave estável de desduplicação a partir de `{ channel, to, accountId, threadId }`. O auxiliar
normaliza IDs numéricos de threads da mesma forma que o núcleo; portanto, prefira-o a comparações
`String(threadId)` improvisadas. Plugins com gramática de destino específica do provedor
devem expor `messaging.resolveOutboundSessionRoute(...)` para que o núcleo obtenha
a identidade de sessão e thread nativa do provedor sem adaptadores de análise.

### Compatibilidade com vinculação de conversas por conta

Defina `conversationBindings.supportsCurrentConversationBinding` quando o canal
oferecer vinculações genéricas para a conversa atual. `createChatChannelPlugin(...)`
define esse recurso estático como `true` por padrão.

Se a compatibilidade variar conforme a conta configurada, implemente também
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
O núcleo avalia esse gancho síncrono somente depois que o recurso estático
é habilitado. Retornar `false` torna indisponíveis para essa conta as operações genéricas
de recurso, vinculação, consulta, listagem, atualização de acesso e desvinculação da conversa atual.
A omissão do gancho aplica o recurso estático a todas as contas.

Determine a resposta usando a configuração da conta ou o estado do runtime já carregados. Esse
gancho controla somente as vinculações genéricas da conversa atual; ele não substitui
regras de vinculação configuradas nem o roteamento de sessões pertencente ao Plugin. Os testes de contrato
devem abranger pelo menos uma conta compatível e uma incompatível por meio do
contrato `ChannelPlugin["conversationBindings"]` exportado por
`openclaw/plugin-sdk/channel-core`.

## Aprovações e recursos do canal

A maioria dos plugins de canal não precisa de código específico para aprovações. O núcleo é responsável por
`/approve` no mesmo chat, payloads compartilhados dos botões de aprovação e entrega alternativa genérica.
`ChannelPlugin.approvals` foi removido; coloque os fatos de entrega/renderização/autorização
nativos de aprovação em um único objeto `approvalCapability`. `plugin.auth` serve apenas
para login/logout — o núcleo não lê mais ganchos de autorização de aprovação desse objeto.

Use `approvalCapability.delivery` somente para roteamento nativo de aprovações ou supressão
de alternativas, e `approvalCapability.render` somente quando um canal realmente precisar de
payloads de aprovação personalizados em vez do renderizador compartilhado.

### Autorização de aprovação

- `approvalCapability.authorizeActorAction` e
  `approvalCapability.getActionAvailabilityState` são a interface canônica
  de autorização de aprovação.
- Use `getActionAvailabilityState` para verificar a disponibilidade da autorização de aprovação no mesmo chat.
  Mantenha os aprovadores configurados disponíveis para `/approve` mesmo quando a entrega
  nativa estiver desabilitada; use o estado nativo da superfície iniciadora para orientação sobre entrega/configuração.
- Se o canal expuser aprovações nativas de execução, use
  `approvalCapability.getExecInitiatingSurfaceState` para o estado da
  superfície iniciadora/cliente nativo quando ele for diferente da autorização de aprovação
  no mesmo chat. O núcleo usa esse gancho específico de execução para distinguir `enabled` de
  `disabled`, decidir se o canal iniciador comporta aprovações nativas de execução
  e incluir o canal na orientação de alternativa do cliente nativo.
  `createApproverRestrictedNativeApprovalCapability(...)` preenche isso para
  o caso comum.
- Se um canal puder inferir identidades estáveis, semelhantes às de proprietário, em mensagens diretas a partir da configuração existente,
  use `createResolvedApproverActionAuthAdapter` de
  `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat
  sem adicionar lógica específica de aprovação ao núcleo.
- Se a autorização personalizada de aprovação permitir intencionalmente apenas a alternativa no mesmo chat, retorne
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` de
  `openclaw/plugin-sdk/approval-auth-runtime`; caso contrário, o núcleo tratará o
  resultado como autorização explícita do aprovador.
- Se um callback nativo pertencente ao canal resolver aprovações diretamente, use
  `isImplicitSameChatApprovalAuthorization(...)` antes da resolução para que a alternativa
  implícita ainda passe pela autorização normal de atores do canal.

### Ciclo de vida do payload e orientação de configuração

- Use `outbound.shouldSuppressLocalPayloadPrompt` ou
  `outbound.beforeDeliverPayload` para comportamentos do ciclo de vida do payload
  específicos do canal, como ocultar solicitações locais duplicadas de aprovação ou enviar indicadores
  de digitação antes da entrega.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser
  que a resposta do caminho desabilitado explique exatamente quais opções de configuração são necessárias para habilitar
  aprovações nativas de execução. O gancho recebe `{ channel, channelLabel, accountId }`;
  canais com contas nomeadas devem renderizar caminhos com escopo de conta, como
  `channels.<channel>.accounts.<id>.execApprovals.*`, em vez de padrões
  de nível superior.
- Use `approvalCapability.describePluginApprovalSetup` quando a orientação de falha
  de aprovação do Plugin puder ser exibida com segurança em falhas de aprovação do Plugin por ausência de rota ou tempo limite.
  `createApproverRestrictedNativeApprovalCapability(...)` não
  infere isso de `describeExecApprovalSetup`; passe explicitamente o mesmo auxiliar
  somente quando as aprovações do Plugin e de execução realmente usarem a mesma configuração nativa.

### Entrega nativa de aprovações

Se um canal precisar de entrega nativa de aprovações, mantenha o código do canal concentrado na
normalização do destino e nos fatos de transporte/apresentação. Use
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` e
`createApproverRestrictedNativeApprovalCapability` de
`openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal atrás de
`approvalCapability.nativeRuntime`, idealmente por meio de
`createChannelApprovalNativeRuntimeAdapter(...)` ou
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o núcleo possa montar o
manipulador e assumir a responsabilidade pela filtragem de solicitações, roteamento, desduplicação, expiração, assinatura do Gateway
e avisos de roteamento para outro local.

`nativeRuntime` é dividido em algumas interfaces menores:

- `availability` - se a conta está configurada e se uma solicitação
  deve ser processada
- `presentation` - mapear o modelo de visualização compartilhado de aprovação para
  payloads nativos pendentes/resolvidos/expirados ou ações finais
- `transport` - preparar destinos e enviar/atualizar/excluir mensagens
  nativas de aprovação
- `interactions` - hooks opcionais de vinculação/desvinculação/limpeza de ação para botões
  ou reações nativas, além de um hook `cancelDelivered` opcional. Implemente
  `cancelDelivered` quando `deliverPending` registrar um estado no processo
  ou persistente (como um armazenamento de destinos de reação), para que esse estado possa ser liberado se a
  interrupção de um manipulador cancelar a entrega antes da execução de `bindPending`, ou quando
  `bindPending` não retornar nenhum identificador
- `observe` - hooks opcionais de diagnóstico de entrega

Outros auxiliares de aprovação:

- Use `createNativeApprovalChannelRouteGates` de
  `openclaw/plugin-sdk/approval-native-runtime` quando um canal oferecer suporte tanto à
  entrega nativa na origem da sessão quanto a destinos explícitos de encaminhamento de aprovação. O
  auxiliar centraliza a seleção da configuração de aprovação, o tratamento de `mode`, os filtros
  de agente/sessão, a vinculação de conta, a correspondência do destino da sessão e a correspondência
  da lista de destinos, enquanto os chamadores continuam responsáveis pelo ID do canal, pelo modo
  padrão de encaminhamento, pela busca da conta, pela verificação de transporte habilitado, pela
  normalização do destino e pela resolução do destino da origem do turno. Não o use para criar
  padrões de política de canal pertencentes ao núcleo; passe explicitamente o modo padrão
  documentado do canal.
- `createChannelNativeOriginTargetResolver` usa por padrão o comparador compartilhado
  de rotas de canal para destinos `{ to, accountId, threadId }`. Passe
  `targetsMatch` somente quando um canal tiver regras de equivalência específicas do provedor,
  como a correspondência por prefixo de carimbo de data/hora do Slack. Passe `normalizeTargetForMatch` quando
  o canal precisar tornar canônicos os IDs do provedor antes da execução do comparador
  de rotas padrão ou de um retorno de chamada `targetsMatch` personalizado, preservando
  o destino original para entrega. Use `normalizeTarget` somente quando o próprio destino
  de entrega resolvido precisar ser tornado canônico.
- Se o canal precisar de objetos pertencentes ao runtime, como um cliente, token, aplicativo
  Bolt ou receptor de Webhook, registre-os por meio de
  `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto
  do runtime permite que o núcleo inicialize manipuladores orientados por recursos a partir do estado
  de inicialização do canal sem adicionar código intermediário específico de aprovação.
- Use os auxiliares de nível inferior `createChannelApprovalHandler` ou
  `createChannelNativeApprovalRuntime` somente quando a interface orientada por recursos
  ainda não for expressiva o suficiente.
- Canais de aprovação nativa devem encaminhar tanto `accountId` quanto `approvalKind`
  por esses auxiliares. `accountId` mantém a política de aprovação para várias contas
  restrita à conta de bot correta, e `approvalKind` mantém o comportamento de aprovação
  de execução em comparação com Plugin disponível ao canal sem ramificações fixas no
  núcleo.
- O núcleo também é responsável pelos avisos de redirecionamento de aprovação. Plugins de canal não devem
  enviar suas próprias mensagens de acompanhamento do tipo "a aprovação foi para as DMs/outro canal" a partir de
  `createChannelNativeApprovalRuntime`; em vez disso, exponha o roteamento preciso da origem +
  DM do aprovador por meio dos auxiliares compartilhados de recursos de aprovação e deixe o
  núcleo agregar as entregas reais antes de publicar qualquer aviso de volta no
  chat de origem.
- Preserve de ponta a ponta o tipo do ID de aprovação entregue. Clientes nativos não devem
  tentar adivinhar nem reescrever o roteamento de aprovação de execução em comparação com Plugin com base no
  estado local do canal.
- Passe esse `approvalKind` explícito para `resolveApprovalOverGateway`. Isso usa
  o serviço canônico `approval.resolve` e retorna o vencedor registrado quando
  outra superfície responde primeiro. A entrada explícita `resolveMethod` mais antiga
  permanece para controles baseados em comandos; novas ações nativas não devem usá-la nem
  inferir o tipo a partir de um ID.
- Diferentes tipos de aprovação podem expor intencionalmente diferentes
  superfícies nativas. Exemplos incluídos atualmente: Matrix mantém o mesmo roteamento nativo
  de DM/canal e a mesma experiência de reações para aprovações de execução e de Plugin, enquanto ainda permite
  que a autenticação varie conforme o tipo de aprovação; Slack mantém o roteamento de aprovação nativa disponível
  tanto para IDs de execução quanto de Plugin.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como um
  wrapper de compatibilidade, mas o código novo deve preferir o construtor de recursos
  e expor `approvalCapability` no Plugin.

### Subcaminhos mais específicos do runtime de aprovação

Para pontos de entrada de canal de alta frequência, prefira estes subcaminhos mais específicos em vez do barrel
mais amplo `approval-runtime` quando precisar apenas de uma parte dessa família:

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
`openclaw/plugin-sdk/reply-chunking` em vez de superfícies abrangentes mais amplas quando não
precisar de todas elas.

### Subcaminhos de configuração

- `openclaw/plugin-sdk/setup-runtime` abrange os auxiliares de configuração seguros para o runtime:
  `createSetupTranslator`, adaptadores de patch de configuração seguros para importação
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de notas de busca,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os construtores
  delegados de proxy de configuração.
- `openclaw/plugin-sdk/channel-setup` abrange os construtores de configuração
  para instalação opcional e alguns componentes básicos seguros para configuração: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` e `splitSetupEntries`.
- Use a interface mais ampla `openclaw/plugin-sdk/setup` somente quando também precisar
  dos auxiliares compartilhados mais pesados de configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Se o canal quiser apenas anunciar "instale este Plugin primeiro" nas superfícies
de configuração, prefira `createOptionalChannelSetupSurface(...)`. O adaptador/assistente
gerado interrompe com segurança as gravações de configuração e a finalização, além de reutilizar
a mesma mensagem de instalação obrigatória na validação, finalização e cópia
do link da documentação.

Se o canal oferecer suporte à configuração ou autenticação orientada por variáveis de ambiente, e os fluxos genéricos
de inicialização/configuração precisarem conhecer os nomes dessas variáveis antes que o runtime seja carregado, declare-os no
manifesto do Plugin com `channelEnvVars`. Mantenha `envVars` do runtime do canal ou
constantes locais apenas para textos voltados ao operador.

Se o canal puder aparecer em `status`, `channels list`, `channels status` ou
verificações de SecretRef antes que o runtime do Plugin seja iniciado, adicione `openclaw.setupEntry` em
`package.json`. Esse ponto de entrada deve poder ser importado com segurança em caminhos de comando
somente leitura e deve retornar os metadados do canal, o adaptador de configuração seguro,
o adaptador de status e os metadados de destino de segredos do canal necessários para esses
resumos. Não inicie clientes, ouvintes ou runtimes de transporte a partir da entrada
de configuração.

Mantenha também restrito o caminho de importação da entrada principal do canal. A descoberta pode avaliar
a entrada e o módulo do Plugin de canal para registrar recursos sem
ativar o canal. Arquivos como `channel-plugin-api.ts` devem exportar
o objeto do Plugin de canal sem importar assistentes de configuração, clientes
de transporte, ouvintes de socket, inicializadores de subprocessos ou módulos de inicialização de serviços.
Coloque esses componentes de runtime em módulos carregados a partir de `registerFull(...)`, definidores
de runtime ou adaptadores de recursos com carregamento adiado.

### Outros subcaminhos específicos de canal

Para outros caminhos de canal de alta frequência, prefira os auxiliares específicos em vez de superfícies
legadas mais amplas:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração de várias contas e
  fallback para a conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/channel-inbound` para rota/envelope de entrada e
  integração de registro e despacho
- `openclaw/plugin-sdk/channel-targets` para auxiliares de análise de destino
- `openclaw/plugin-sdk/outbound-media` para carregamento de mídia e
  `openclaw/plugin-sdk/channel-outbound` para delegados de identidade/envio de saída
  e planejamento de payload
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` quando uma rota de saída deve preservar
  um `replyToId`/`threadId` explícito ou recuperar a sessão `:thread:`
  atual depois que a chave de sessão base ainda corresponder. Plugins de provedor podem
  substituir a precedência, o comportamento do sufixo e a normalização do ID da thread quando
  sua plataforma tiver semântica nativa de entrega em threads.
- `openclaw/plugin-sdk/thread-bindings-runtime` para o ciclo de vida da vinculação de threads
  e o registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` somente quando o layout legado dos campos
  de payload de agente/mídia ainda for necessário
- `openclaw/plugin-sdk/telegram-command-config` (obsoleto: nenhum Plugin incluído
  o utiliza em produção) para normalização de comandos personalizados do Telegram,
  validação de duplicatas/conflitos e um contrato de configuração de comandos
  estável em caso de fallback; para código novo de Plugin, prefira o tratamento local da configuração de comandos no Plugin

Canais apenas de autenticação normalmente podem se limitar ao caminho padrão: o núcleo processa
as aprovações, e o Plugin apenas expõe recursos de saída/autenticação. Canais
de aprovação nativa, como Matrix, Slack, Telegram e transportes de chat personalizados,
devem usar os auxiliares nativos compartilhados em vez de implementar seu próprio ciclo de vida
de aprovação.

## Política de menções de entrada

Mantenha o tratamento de menções de entrada dividido em duas camadas:

- coleta de evidências pertencente ao Plugin
- avaliação de política compartilhada

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões de política de menções.
Use `openclaw/plugin-sdk/channel-inbound` somente quando precisar do barrel
mais amplo de auxiliares de entrada.

Adequado para lógica local do Plugin:

- detecção de resposta ao bot
- detecção de citação do bot
- verificações de participação na thread
- exclusões de mensagens de serviço/sistema
- caches nativos da plataforma necessários para comprovar a participação do bot

Adequado para o auxiliar compartilhado:

- `requireMention`
- resultado de menção explícita
- lista de permissões de menções implícitas
- desvio para comandos
- decisão final de ignorar

Fluxo preferencial:

1. Calcule os fatos locais sobre menções.
2. Passe esses fatos para `resolveInboundMentionDecision({ facts, policy })`.
3. Use `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e
   `decision.shouldSkip` no bloqueio de entrada.

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
`isExplicitlyMentioned` e `canResolveExplicit` vêm dos próprios
metadados nativos de menção do canal (entidades de mensagem, indicadores de resposta ao bot e semelhantes);
forneça valores `false`/`undefined` quando a plataforma não puder detectá-los.

`api.runtime.channel.mentions` expõe os mesmos auxiliares compartilhados de menção para
Plugins de canal incluídos que já dependem da injeção de runtime:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Se precisar apenas de `implicitMentionKindWhen` e `resolveInboundMentionDecision`,
importe de `openclaw/plugin-sdk/channel-mention-gating` para evitar o carregamento
de auxiliares de runtime de entrada não relacionados.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do plugin. O campo `channels` em
    `openclaw.plugin.json` (não um campo `kind`) é o que marca um manifesto como
    proprietário de um canal. Para conhecer toda a superfície de metadados do pacote, consulte
    [Configuração do Plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

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
      "description": "Plugin de canal do Acme Chat",
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
    configurações pertencentes ao plugin que não façam parte da configuração da conta do canal.
    `channelConfigs.acme-chat.schema` valida `channels.acme-chat` e é a
    fonte do caminho frio usada pelas superfícies de esquema de configuração, configuração inicial e UI antes que o
    runtime do plugin seja carregado. Consulte [Manifesto do plugin](/pt-BR/plugins/manifest) para ver a referência
    completa dos campos de nível superior.

  </Step>

  <Step title="Crie o objeto do plugin de canal">
    A interface `ChannelPlugin` tem muitas superfícies opcionais de adaptadores. Comece com
    o mínimo — `id`, `config` e `setup` — e adicione adaptadores conforme
    necessário.

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
        // `setup` abrange gravações de integração (applyAccountConfig, validateInput).
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

      // Pareamento: fluxo de aprovação para novos contatos de MD
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

    Para canais que aceitam tanto chaves canônicas de MD no nível superior quanto chaves aninhadas legadas, use os auxiliares de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantêm os valores locais da conta à frente dos valores herdados da raiz. Combine o mesmo resolvedor com o reparo do doctor por meio de `normalizeLegacyDmAliases`, para que o runtime e a migração leiam o mesmo contrato.

    <Accordion title="O que createChatChannelPlugin faz por você">
      Em vez de implementar manualmente interfaces de adaptadores de baixo nível, você fornece
      opções declarativas e o construtor as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de MD com escopo definido por campos de configuração |
      | `pairing.text` | Fluxo de pareamento de MD baseado em texto com troca de código |
      | `threading` | Resolvedor do modo de resposta (fixo, com escopo de conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados do resultado (IDs de mensagens); requer um id irmão `channel` para que o núcleo possa registrar o resultado de entrega retornado |

      Também é possível fornecer objetos de adaptadores brutos em vez das opções declarativas
      se você precisar de controle total.

      Adaptadores de saída brutos podem definir uma função `chunker(text, limit, ctx)`.
      O `ctx.formatting` opcional contém decisões de formatação feitas no momento da entrega,
      como `maxLinesPerMessage`; aplique-o antes do envio para que o encadeamento de respostas
      e os limites dos blocos sejam resolvidos uma única vez pela entrega de saída compartilhada.
      Os contextos de envio também incluem `replyToIdSource` (`implicit` ou `explicit`)
      quando um destino de resposta nativo tiver sido resolvido, para que os auxiliares de payload possam preservar
      tags de resposta explícitas sem consumir um slot de resposta implícito de uso único.
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
      description: "Plugin de canal do Acme Chat",
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

    Coloque os descritores da CLI pertencentes ao canal em `registerCliMetadata(...)` para que o OpenClaw
    possa exibi-los na ajuda raiz sem ativar o runtime completo do canal,
    enquanto os carregamentos completos normais ainda recebem os mesmos descritores para o registro efetivo dos
    comandos. Mantenha `registerFull(...)` para trabalhos exclusivos do runtime.
    `defineChannelPluginEntry` processa automaticamente a divisão dos modos de registro.
    Se `registerFull(...)` registrar métodos RPC do Gateway, use um
    prefixo específico do plugin. Os namespaces administrativos do núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    são resolvidos para `operator.admin`. Consulte
    [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas as
    opções.

  </Step>

  <Step title="Adicione uma entrada de configuração inicial">
    Crie `setup-entry.ts` para carregamento leve durante a integração:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega essa entrada em vez da entrada completa quando o canal está desabilitado
    ou não configurado. Isso evita carregar código pesado do runtime durante os fluxos de configuração inicial.
    Consulte [Configuração inicial](/pt-BR/plugins/sdk-setup#setup-entry) para obter detalhes.

    Canais agrupados do workspace que separam exportações seguras para configuração inicial em módulos
    auxiliares podem usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisarem de um
    setter explícito do runtime durante a configuração inicial.

  </Step>

  <Step title="Processe mensagens recebidas">
    Seu plugin precisa receber mensagens da plataforma e encaminhá-las ao
    OpenClaw. O padrão típico é um Webhook que verifica a solicitação e
    a despacha por meio do manipulador de entrada do seu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticação gerenciada pelo plugin (verifique você mesmo as assinaturas)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Seu manipulador de entrada despacha a mensagem para o OpenClaw.
          // A conexão exata depende do SDK da sua plataforma —
          // consulte um exemplo real no pacote do plugin agrupado do Microsoft Teams ou Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      O processamento de mensagens recebidas é específico de cada canal. Cada plugin de canal é proprietário
      do próprio pipeline de entrada. Consulte os plugins de canal agrupados
      (por exemplo, o pacote do plugin do Microsoft Teams ou Google Chat) para ver padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Teste">
Escreva testes colocados junto ao código em `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
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
├── package.json              # Metadados de openclaw.channel
├── openclaw.plugin.json      # Manifesto com esquema de configuração
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exportações públicas (opcional)
├── runtime-api.ts            # Exportações internas de runtime (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin por meio de createChatChannelPlugin
    ├── channel.test.ts       # Testes
    ├── client.ts             # Cliente da API da plataforma
    └── runtime.ts            # Armazenamento de runtime (se necessário)
```

## Tópicos avançados

<CardGroup cols={2}>
  <Card title="Opções de encadeamento" icon="git-branch" href="/pt-BR/plugins/sdk-entrypoints#registration-mode">
    Modos de resposta fixo, com escopo de conta ou personalizado
  </Card>
  <Card title="Integração com a ferramenta de mensagens" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Resolução de destino" icon="crosshair" href="/pt-BR/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Auxiliares de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia e subagente por meio de api.runtime
  </Card>
  <Card title="API de entrada do canal" icon="bolt" href="/pt-BR/plugins/sdk-channel-inbound">
    Ciclo de vida compartilhado de eventos de entrada: ingestão, resolução, registro, encaminhamento e finalização
  </Card>
</CardGroup>

<Note>
Alguns pontos de integração auxiliares incluídos ainda existem para manutenção e
compatibilidade de plugins incluídos. Eles não são o padrão recomendado para novos plugins de canal;
prefira os subcaminhos genéricos de canal/configuração/resposta/runtime da superfície comum do SDK,
a menos que esteja fazendo a manutenção direta dessa família de plugins incluídos.
</Note>

## Próximas etapas

- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - se o seu plugin também fornecer modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de importação de subcaminhos
- [Testes do SDK](/pt-BR/plugins/sdk-testing) - utilitários de teste e testes de contrato
- [Manifesto do Plugin](/pt-BR/plugins/manifest) - esquema completo do manifesto

## Relacionados

- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Plugins do harness de agente](/pt-BR/plugins/sdk-agent-harness)
