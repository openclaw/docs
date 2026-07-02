---
read_when:
    - Você está criando um novo plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um Plugin de canal de mensagens para o OpenClaw
title: Criando plugins de canal
x-i18n:
    generated_at: "2026-07-02T22:25:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Este guia percorre a criação de um Plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança de DM,
pareamento, encadeamento de respostas e mensagens de saída.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para entender a estrutura
  básica do pacote e a configuração do manifesto.
</Info>

## Como os Plugins de canal funcionam

Plugins de canal não precisam de suas próprias ferramentas para enviar/editar/reagir. O OpenClaw mantém uma
ferramenta `message` compartilhada no core. Seu Plugin é responsável por:

- **Configuração** - resolução de conta e assistente de configuração
- **Segurança** - política de DM e listas de permissão
- **Pareamento** - fluxo de aprovação por DM
- **Gramática de sessão** - como ids de conversa específicos do provedor são mapeados para chats base, ids de thread e fallbacks de pai
- **Saída** - envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** - como as respostas são encadeadas
- **Digitação de Heartbeat** - sinais opcionais de digitação/ocupado para destinos de entrega de Heartbeat

O core é responsável pela ferramenta de mensagem compartilhada, pela ligação de prompts, pelo formato externo da chave de sessão,
pela escrituração genérica de `:thread:` e pelo despacho.

Novos Plugins de canal também devem expor um adaptador `message` com
`defineChannelMessageAdapter` de `openclaw/plugin-sdk/channel-outbound`. O
adaptador declara quais capacidades duráveis de envio final o transporte nativo
realmente oferece e aponta envios de texto/mídia para as mesmas funções de transporte que
o adaptador `outbound` legado. Declare uma capacidade somente quando um teste de contrato
comprovar o efeito colateral nativo e o recibo retornado.
Para o contrato completo da API, exemplos, matriz de capacidades, regras de recibo, finalização de prévia ao vivo,
política de ack de recebimento, testes e tabela de migração, consulte
[API de saída de canal](/pt-BR/plugins/sdk-channel-outbound).
Se o adaptador `outbound` existente já tiver os métodos de envio corretos e
metadados de capacidade, use `createChannelMessageAdapterFromOutbound(...)` para
derivar o adaptador `message` em vez de escrever manualmente outra ponte.
Os envios do adaptador devem retornar valores `MessageReceipt`. Quando código de compatibilidade
ainda precisar de ids legados, derive-os com `listMessageReceiptPlatformIds(...)`
ou `resolveMessageReceiptPrimaryId(...)` em vez de manter campos
`messageIds` paralelos em novo código de ciclo de vida.
Canais com suporte a prévia também devem declarar `message.live.capabilities` com
o ciclo de vida ao vivo exato que controlam, como `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` ou
`quietFinalization`. Canais que finalizam uma prévia de rascunho no lugar também devem
declarar `message.live.finalizer.capabilities`, como `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` e
`retainOnAmbiguousFailure`, e rotear a lógica de runtime por meio de
`defineFinalizableLivePreviewAdapter(...)` e
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantenha essas capacidades respaldadas
por testes `verifyChannelMessageLiveCapabilityAdapterProofs(...)` e
`verifyChannelMessageLiveFinalizerProofs(...)` para que comportamento de prévia
nativa, progresso, edição, fallback/retenção, limpeza e recibo não se desvie
silenciosamente.
Receptores de entrada que adiam confirmações da plataforma devem declarar
`message.receive.defaultAckPolicy` e `supportedAckPolicies` em vez de ocultar
o tempo de ack no estado local do monitor. Cubra cada política declarada com
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Helpers legados de resposta, como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` e `recordInboundSessionAndDispatchReply`,
continuam disponíveis para despachantes de compatibilidade. Não use esses nomes para novo
código de canal; novos Plugins devem começar com o adaptador `message`, recibos e
helpers de ciclo de vida de recebimento/envio em `openclaw/plugin-sdk/channel-outbound`.

Canais que estejam migrando autorização de entrada podem usar o subcaminho experimental
`openclaw/plugin-sdk/channel-ingress-runtime` a partir de caminhos de recebimento de runtime.
O subcaminho mantém a busca da plataforma e efeitos colaterais no Plugin, enquanto
compartilha resolução de estado de lista de permissão, decisões de rota/remetente/comando/evento/ativação,
diagnósticos redigidos e mapeamento de admissão de turno. Mantenha a normalização
da identidade do Plugin no descritor que você passa ao resolvedor; não
serialize valores brutos de correspondência do estado ou da decisão resolvidos. Consulte
[API de entrada de canal](/pt-BR/plugins/sdk-channel-ingress) para o design da API,
limite de responsabilidade e expectativas de teste.

Se o seu canal oferece suporte a indicadores de digitação fora de respostas de entrada, exponha
`heartbeat.sendTyping(...)` no Plugin de canal. O core o chama com o
destino resolvido de entrega de Heartbeat antes do início da execução do modelo de Heartbeat e
usa o ciclo de vida compartilhado de keepalive/limpeza de digitação. Adicione `heartbeat.clearTyping(...)`
quando a plataforma precisar de um sinal explícito de parada.

Se o seu canal adiciona parâmetros de ferramenta de mensagem que carregam fontes de mídia, exponha esses
nomes de parâmetros por meio de `describeMessageTool(...).mediaSourceParams`. O core usa
essa lista explícita para normalização de caminhos do sandbox e política de acesso a mídia de saída,
de modo que Plugins não precisem de casos especiais no core compartilhado para parâmetros específicos de provedor
de avatar, anexo ou imagem de capa.
Prefira retornar um mapa indexado por ação, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que ações não relacionadas não
herdem argumentos de mídia de outra ação. Um array plano ainda funciona para parâmetros que
são intencionalmente compartilhados por todas as ações expostas.
Canais que precisam expor uma URL pública temporária para uma busca de mídia no lado da plataforma
podem usar `createHostedOutboundMediaStore(...)` de
`openclaw/plugin-sdk/outbound-media` com armazenamentos de estado do Plugin. Mantenha o parsing
de rota da plataforma e a imposição de token no Plugin de canal; o helper compartilhado
é responsável apenas por carregamento de mídia, metadados de expiração, linhas de chunks e limpeza.

Se o seu canal precisa de modelagem específica do provedor para `message(action="send")`,
prefira `actions.prepareSendPayload(...)`. Coloque cards, blocos, embeds nativos ou
outros dados duráveis em `payload.channelData.<channel>` e deixe o core executar
o envio real por meio do adaptador outbound/message. Use
`actions.handleAction(...)` para envio apenas como fallback de compatibilidade para
payloads que não podem ser serializados e tentados novamente.

Se a sua plataforma armazena escopo extra dentro de ids de conversa, mantenha esse parsing
no Plugin com `messaging.resolveSessionConversation(...)`. Esse é o
hook canônico para mapear `rawId` para o id de conversa base, id de thread opcional,
`baseConversationId` explícito e quaisquer `parentConversationCandidates`.
Ao retornar `parentConversationCandidates`, mantenha-os ordenados do pai
mais restrito para a conversa mais ampla/base.

Use `openclaw/plugin-sdk/channel-route` quando o código do Plugin precisar normalizar
campos semelhantes a rotas, comparar uma thread filha com sua rota pai ou criar uma
chave de desduplicação estável a partir de `{ channel, to, accountId, threadId }`. O helper
normaliza ids numéricos de thread da mesma forma que o core, então Plugins devem preferi-lo
a comparações ad hoc com `String(threadId)`.
Plugins com gramática de destino específica do provedor devem expor
`messaging.resolveOutboundSessionRoute(...)` para que o core receba identidade
de sessão e thread nativa do provedor sem usar shims de parser.

Plugins empacotados que precisam do mesmo parsing antes da inicialização do registro de canais
também podem expor um arquivo `session-key-api.ts` no nível superior com uma exportação
`resolveSessionConversation(...)` correspondente. O core usa essa superfície segura para bootstrap
somente quando o registro de Plugins de runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` continua disponível como
fallback de compatibilidade legado quando um Plugin só precisa de fallbacks de pai além
do id genérico/bruto. Se os dois hooks existirem, o core usa
`resolveSessionConversation(...).parentConversationCandidates` primeiro e só
recorre a `resolveParentConversationCandidates(...)` quando o hook canônico
os omite.

## Aprovações e capacidades de canal

A maioria dos Plugins de canal não precisa de código específico de aprovação.

- O núcleo é responsável por `/approve` no mesmo chat, payloads de botão de aprovação compartilhados e entrega genérica de contingência.
- Prefira um único objeto `approvalCapability` no plugin de canal quando o canal precisar de comportamento específico de aprovação.
- `ChannelPlugin.approvals` foi removido. Coloque fatos de entrega/nativo/renderização/autenticação de aprovação em `approvalCapability`.
- `plugin.auth` é apenas login/logout; o núcleo não lê mais hooks de autenticação de aprovação desse objeto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são a interface canônica de autenticação de aprovação.
- Use `approvalCapability.getActionAvailabilityState` para disponibilidade de autenticação de aprovação no mesmo chat. Mantenha aprovadores configurados disponíveis para `/approve` mesmo quando a entrega nativa estiver desabilitada; use o estado da superfície iniciadora nativa para orientação de entrega/configuração.
- Se o seu canal expõe aprovações exec nativas, use `approvalCapability.getExecInitiatingSurfaceState` para o estado da superfície iniciadora/cliente nativo quando ele diferir da autenticação de aprovação no mesmo chat. O núcleo usa esse hook específico de exec para distinguir `enabled` de `disabled`, decidir se o canal iniciador oferece suporte a aprovações exec nativas e incluir o canal na orientação de contingência de cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` preenche isso para o caso comum.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento de ciclo de vida de payload específico do canal, como ocultar prompts de aprovação locais duplicados ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.delivery` apenas para roteamento de aprovação nativa ou supressão de contingência.
- Use `approvalCapability.nativeRuntime` para fatos de aprovação nativa pertencentes ao canal. Mantenha-o preguiçoso em pontos de entrada críticos do canal com `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que pode importar seu módulo de runtime sob demanda enquanto ainda permite que o núcleo monte o ciclo de vida da aprovação.
- Use `approvalCapability.render` apenas quando um canal realmente precisar de payloads de aprovação personalizados em vez do renderizador compartilhado.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que a resposta do caminho desabilitado explique os ajustes exatos de configuração necessários para habilitar aprovações exec nativas. O hook recebe `{ channel, channelLabel, accountId }`; canais com contas nomeadas devem renderizar caminhos com escopo de conta, como `channels.<channel>.accounts.<id>.execApprovals.*`, em vez de padrões de nível superior.
- Use `approvalCapability.describePluginApprovalSetup` quando a orientação de falha de aprovação de plugin for segura para exibir em falhas de aprovação de plugin sem rota e por tempo limite. `createApproverRestrictedNativeApprovalCapability(...)` não infere isso de `describeExecApprovalSetup`; passe o mesmo helper explicitamente apenas quando aprovações de plugin e exec realmente usarem a mesma configuração nativa.
- Se um canal puder inferir identidades de DM estáveis semelhantes a proprietários a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica de núcleo específica de aprovação.
- Se a autenticação de aprovação personalizada intencionalmente permitir apenas a contingência no mesmo chat, retorne `markImplicitSameChatApprovalAuthorization({ authorized: true })` de `openclaw/plugin-sdk/approval-auth-runtime`; caso contrário, o núcleo trata o resultado como autorização explícita de aprovador.
- Se um callback nativo pertencente ao canal resolver aprovações diretamente, use `isImplicitSameChatApprovalAuthorization(...)` antes de resolver para que a contingência implícita ainda passe pela autorização normal de ator do canal.
- Se um canal precisar de entrega de aprovação nativa, mantenha o código do canal focado na normalização do destino e em fatos de transporte/apresentação. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal por trás de `approvalCapability.nativeRuntime`, idealmente via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o núcleo possa montar o handler e assumir filtragem de solicitações, roteamento, desduplicação, expiração, assinatura do Gateway e avisos de roteado para outro lugar. `nativeRuntime` é dividido em algumas interfaces menores:
- Use `createNativeApprovalChannelRouteGates` de `openclaw/plugin-sdk/approval-native-runtime` quando um canal oferecer suporte tanto à entrega nativa originada da sessão quanto a destinos explícitos de encaminhamento de aprovação. O helper centraliza seleção de configuração de aprovação, tratamento de `mode`, filtros de agente/sessão, vinculação de conta, correspondência de destino de sessão e correspondência de lista de destinos, enquanto os chamadores ainda controlam o id do canal, o modo padrão de encaminhamento, a consulta de conta, a verificação de transporte habilitado, a normalização de destino e a resolução de destino da origem do turno. Não o use para criar padrões de política de canal pertencentes ao núcleo; passe explicitamente o modo padrão documentado do canal.
- `createChannelNativeOriginTargetResolver` usa o matcher compartilhado de rota de canal por padrão para destinos `{ to, accountId, threadId }`. Passe `targetsMatch` apenas quando um canal tiver regras de equivalência específicas do provedor, como correspondência por prefixo de timestamp no Slack.
- Passe `normalizeTargetForMatch` para `createChannelNativeOriginTargetResolver` quando o canal precisar canonicalizar ids de provedor antes que o matcher de rota padrão ou um callback `targetsMatch` personalizado seja executado, preservando o destino original para entrega. Use `normalizeTarget` apenas quando o próprio destino de entrega resolvido deve ser canonicalizado.
- `availability` - se a conta está configurada e se uma solicitação deve ser tratada
- `presentation` - mapear o modelo de visualização de aprovação compartilhado para payloads nativos pendentes/resolvidos/expirados ou ações finais
- `transport` - preparar destinos e enviar/atualizar/excluir mensagens de aprovação nativas
- `interactions` - hooks opcionais de vincular/desvincular/limpar ação para botões ou reações nativas, além de um hook opcional `cancelDelivered`. Implemente `cancelDelivered` quando `deliverPending` registrar estado em processo ou persistente (como um armazenamento de destino de reação) para que esse estado possa ser liberado se uma parada de handler cancelar a entrega antes de `bindPending` executar ou quando `bindPending` não retornar nenhum handle
- `observe` - hooks opcionais de diagnóstico de entrega
- Se o canal precisar de objetos pertencentes ao runtime, como um cliente, token, app Bolt ou receptor de webhook, registre-os por meio de `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto de runtime permite que o núcleo inicialize handlers orientados por capacidade a partir do estado de inicialização do canal sem adicionar cola de wrapper específica de aprovação.
- Recorra ao `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de nível mais baixo apenas quando a interface orientada por capacidade ainda não for expressiva o suficiente.
- Canais de aprovação nativa devem rotear tanto `accountId` quanto `approvalKind` por esses helpers. `accountId` mantém a política de aprovação de várias contas restrita à conta de bot correta, e `approvalKind` mantém o comportamento de aprovação exec vs plugin disponível para o canal sem ramificações hardcoded no núcleo.
- Agora o núcleo também é responsável pelos avisos de rerroteamento de aprovação. Plugins de canal não devem enviar suas próprias mensagens de acompanhamento "a aprovação foi para DMs / outro canal" a partir de `createChannelNativeApprovalRuntime`; em vez disso, exponha roteamento preciso de origem + DM de aprovador por meio dos helpers compartilhados de capacidade de aprovação e deixe o núcleo agregar as entregas reais antes de publicar qualquer aviso de volta no chat iniciador.
- Preserve o tipo de id da aprovação entregue de ponta a ponta. Clientes nativos não devem
  adivinhar ou reescrever roteamento de aprovação exec vs plugin a partir de estado local do canal.
- Tipos de aprovação diferentes podem expor superfícies nativas diferentes intencionalmente.
  Exemplos agrupados atuais:
  - Slack mantém o roteamento de aprovação nativa disponível tanto para ids exec quanto de plugin.
  - Matrix mantém o mesmo roteamento nativo de DM/canal e UX de reação para aprovações exec
    e de plugin, enquanto ainda permite que a autenticação varie por tipo de aprovação.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas código novo deve preferir o construtor de capacidade e expor `approvalCapability` no plugin.

Para pontos de entrada críticos do canal, prefira os subcaminhos de runtime mais estreitos quando você precisar de apenas
uma parte dessa família:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Da mesma forma, prefira `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando você não precisar da superfície guarda-chuva
mais ampla.

Especificamente para configuração:

- `openclaw/plugin-sdk/setup-runtime` cobre os helpers de configuração seguros para runtime:
  `createSetupTranslator`, adaptadores de patch de configuração seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de nota de consulta,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os construtores delegados de
  proxy de configuração
- `openclaw/plugin-sdk/setup-runtime` inclui a interface de adaptador ciente de env para
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os construtores de configuração de instalação opcional
  mais alguns primitivos seguros para configuração:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se o seu canal oferece suporte a configuração ou autenticação orientada por env e fluxos genéricos de inicialização/configuração
devem conhecer esses nomes de env antes que o runtime carregue, declare-os no
manifesto do plugin com `channelEnvVars`. Mantenha `envVars` do runtime do canal ou constantes locais
apenas para texto voltado ao operador.

Se o seu canal puder aparecer em `status`, `channels list`, `channels status` ou
varreduras SecretRef antes que o runtime do plugin inicie, adicione `openclaw.setupEntry` em
`package.json`. Esse ponto de entrada deve ser seguro para importar em caminhos de comando somente leitura
e deve retornar os metadados do canal, o adaptador de configuração seguro para setup, o adaptador de status
e os metadados de destino secreto do canal necessários para esses resumos. Não
inicie clientes, listeners ou runtimes de transporte a partir da entrada de setup.

Mantenha também estreito o caminho principal de importação da entrada do canal. A descoberta pode avaliar a
entrada e o módulo do plugin de canal para registrar capacidades sem ativar
o canal. Arquivos como `channel-plugin-api.ts` devem exportar o objeto de plugin de canal
sem importar assistentes de setup, clientes de transporte, listeners de socket,
lançadores de subprocesso ou módulos de inicialização de serviço. Coloque essas partes de runtime
em módulos carregados a partir de `registerFull(...)`, setters de runtime ou adaptadores
de capacidade preguiçosos.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- use a interface mais ampla `openclaw/plugin-sdk/setup` apenas quando você também precisar dos
  helpers compartilhados mais pesados de setup/configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal só quiser anunciar "instale este plugin primeiro" em superfícies de setup,
prefira `createOptionalChannelSetupSurface(...)`. O adaptador/assistente gerado
falha fechado em gravações de configuração e finalização, e reutiliza
a mesma mensagem de instalação obrigatória em validação, finalização e texto de link
de docs.

Para outros caminhos críticos de canal, prefira os helpers estreitos às superfícies legadas
mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração de várias contas e
  fallback de conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/channel-inbound` para rota/envelope de entrada e
  cabeamento de registrar e despachar
- `openclaw/plugin-sdk/channel-targets` para auxiliares de análise de destino
- `openclaw/plugin-sdk/outbound-media` para carregamento de mídia e
  `openclaw/plugin-sdk/channel-outbound` para identidade de saída/delegados de envio
  e planejamento de payload
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` quando uma rota de saída deve preservar um
  `replyToId`/`threadId` explícito ou recuperar a sessão `:thread:` atual
  depois que a chave de sessão base ainda corresponder. Plugins de provider podem sobrescrever
  precedência, comportamento de sufixo e normalização de ID de thread quando sua plataforma
  tem semântica nativa de entrega em threads.
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de vinculação de threads
  e registro de adaptador
- `openclaw/plugin-sdk/agent-media-payload` somente quando um layout legado de campo de payload
  de agente/mídia ainda for necessário
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comandos personalizados do Telegram,
  validação de duplicatas/conflitos e um contrato de configuração de comandos
  estável em fallback

Canais somente de autenticação geralmente podem parar no caminho padrão: o core lida com aprovações e o Plugin apenas expõe capacidades de saída/autenticação. Canais de aprovação nativos, como Matrix, Slack, Telegram e transportes de chat personalizados, devem usar os auxiliares nativos compartilhados em vez de implementar seu próprio ciclo de vida de aprovação.

## Política de menções de entrada

Mantenha o tratamento de menções de entrada dividido em duas camadas:

- coleta de evidências pertencente ao Plugin
- avaliação de política compartilhada

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões de política de menção.
Use `openclaw/plugin-sdk/channel-inbound` somente quando precisar do barrel auxiliar de entrada
mais amplo.

Bom ajuste para lógica local do Plugin:

- detecção de resposta ao bot
- detecção de bot citado
- verificações de participação em thread
- exclusões de mensagens de serviço/sistema
- caches nativos da plataforma necessários para provar participação do bot

Bom ajuste para o auxiliar compartilhado:

- `requireMention`
- resultado de menção explícita
- lista de permissões de menção implícita
- bypass de comando
- decisão final de ignorar

Fluxo preferido:

1. Calcule os fatos locais de menção.
2. Passe esses fatos para `resolveInboundMentionDecision({ facts, policy })`.
3. Use `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` no seu gate de entrada.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` expõe os mesmos auxiliares compartilhados de menção para
Plugins de canal empacotados que já dependem de injeção de runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se você só precisa de `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importe de
`openclaw/plugin-sdk/channel-mention-gating` para evitar carregar auxiliares de runtime
de entrada não relacionados.

Use `resolveInboundMentionDecision({ facts, policy })` para gating de menção.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do Plugin. O campo `channel` em `package.json` é
    o que torna isso um Plugin de canal. Para a superfície completa de metadados de pacote,
    consulte [Configuração e Config do Plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valida `plugins.entries.acme-chat.config`. Use-o para
    configurações pertencentes ao Plugin que não sejam a configuração da conta de canal. `channelConfigs`
    valida `channels.acme-chat` e é a fonte de caminho frio usada pela configuração
    de esquema, setup e superfícies de UI antes que o runtime do Plugin carregue.

  </Step>

  <Step title="Crie o objeto do Plugin de canal">
    A interface `ChannelPlugin` tem muitas superfícies opcionais de adaptador. Comece com
    o mínimo - `id` e `setup` - e adicione adaptadores conforme precisar deles.

    Crie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    Para canais que aceitam tanto chaves canônicas de DM de nível superior quanto chaves aninhadas legadas, use os auxiliares de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantêm valores locais da conta à frente de valores herdados da raiz. Emparelhe o mesmo resolvedor com reparo de doctor por meio de `normalizeLegacyDmAliases` para que runtime e migração leiam o mesmo contrato.

    <Accordion title="O que createChatChannelPlugin faz por você">
      Em vez de implementar interfaces de adaptador de baixo nível manualmente, você passa
      opções declarativas e o builder as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de DM com escopo a partir de campos de configuração |
      | `pairing.text` | Fluxo de pareamento de DM baseado em texto com troca de código |
      | `threading` | Resolvedor de modo de resposta (fixo, com escopo de conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados de resultado (IDs de mensagem) |

      Você também pode passar objetos adaptadores brutos em vez das opções declarativas
      se precisar de controle total.

      Adaptadores brutos de saída podem definir uma função `chunker(text, limit, ctx)`.
      O `ctx.formatting` opcional carrega decisões de formatação no momento da entrega,
      como `maxLinesPerMessage`; aplique-o antes de enviar para que o threading de resposta
      e os limites de chunks sejam resolvidos uma vez pela entrega de saída compartilhada.
      Contextos de envio também incluem `replyToIdSource` (`implicit` ou `explicit`)
      quando um destino de resposta nativo foi resolvido, para que auxiliares de payload possam preservar
      tags de resposta explícitas sem consumir um slot de resposta implícita de uso único.
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
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    Coloque os descritores de CLI pertencentes ao canal em `registerCliMetadata(...)` para que o OpenClaw
    possa mostrá-los na ajuda raiz sem ativar o runtime completo do canal,
    enquanto os carregamentos completos normais ainda capturam os mesmos descritores para o registro
    real de comandos. Mantenha `registerFull(...)` para trabalho exclusivo de runtime.
    Se `registerFull(...)` registrar métodos de RPC do gateway, use um
    prefixo específico do Plugin. Os namespaces administrativos do core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    resolvem para `operator.admin`.
    `defineChannelPluginEntry` lida automaticamente com a divisão do modo de registro. Consulte
    [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas as
    opções.

  </Step>

  <Step title="Add a setup entry">
    Crie `setup-entry.ts` para carregamento leve durante a integração inicial:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega isso em vez da entrada completa quando o canal está desativado
    ou não configurado. Isso evita carregar código pesado de runtime durante fluxos de configuração.
    Consulte [Configuração e Config](/pt-BR/plugins/sdk-setup#setup-entry) para detalhes.

    Canais de workspace empacotados que separam exports seguros para configuração em módulos
    auxiliares podem usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisam de um
    setter explícito de runtime em tempo de configuração.

  </Step>

  <Step title="Handle inbound messages">
    Seu Plugin precisa receber mensagens da plataforma e encaminhá-las para o
    OpenClaw. O padrão típico é um Webhook que verifica a solicitação e
    a despacha pelo manipulador de entrada do seu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      O tratamento de mensagens de entrada é específico do canal. Cada Plugin de canal possui
      seu próprio pipeline de entrada. Veja os Plugins de canal empacotados
      (por exemplo, o pacote de Plugin Microsoft Teams ou Google Chat) para padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Para helpers de teste compartilhados, consulte [Testes](/pt-BR/plugins/sdk-testing).

</Step>
</Steps>

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Tópicos avançados

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/pt-BR/plugins/sdk-entrypoints#registration-mode">
    Modos de resposta fixos, com escopo por conta ou personalizados
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/pt-BR/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia, subagente via api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/pt-BR/plugins/sdk-channel-inbound">
    Ciclo de vida compartilhado de eventos de entrada: ingerir, resolver, registrar, despachar, finalizar
  </Card>
</CardGroup>

<Note>
Alguns pontos de extensão auxiliares empacotados ainda existem para manutenção e
compatibilidade de Plugins empacotados. Eles não são o padrão recomendado para novos Plugins de canal;
prefira os subcaminhos genéricos de canal/configuração/resposta/runtime da superfície comum do SDK,
a menos que você esteja mantendo diretamente essa família de Plugins empacotados.
</Note>

## Próximas etapas

- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - se o seu Plugin também fornece modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de imports por subcaminho
- [Testes do SDK](/pt-BR/plugins/sdk-testing) - utilitários de teste e testes de contrato
- [Manifesto do Plugin](/pt-BR/plugins/manifest) - schema completo do manifesto

## Relacionado

- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Como criar Plugins](/pt-BR/plugins/building-plugins)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
