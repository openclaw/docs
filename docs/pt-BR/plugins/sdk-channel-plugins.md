---
read_when:
    - Você está criando um novo plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um Plugin de canal de mensagens para o OpenClaw
title: Criando plugins de canal
x-i18n:
    generated_at: "2026-05-10T19:44:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Este guia mostra como criar um plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança de DM,
pareamento, encadeamento de respostas e mensagens de saída.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para conhecer a estrutura
  básica do pacote e a configuração do manifesto.
</Info>

## Como plugins de canal funcionam

Plugins de canal não precisam de suas próprias ferramentas de envio/edição/reação. O OpenClaw mantém uma
ferramenta `message` compartilhada no núcleo. Seu plugin é responsável por:

- **Configuração** - resolução de conta e assistente de configuração
- **Segurança** - política de DM e listas de permissão
- **Pareamento** - fluxo de aprovação por DM
- **Gramática de sessão** - como ids de conversa específicos do provedor mapeiam para conversas base, ids de thread e fallbacks de pai
- **Saída** - envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** - como as respostas são encadeadas
- **Digitação de Heartbeat** - sinais opcionais de digitação/ocupado para destinos de entrega de Heartbeat

O núcleo é responsável pela ferramenta de mensagens compartilhada, pela ligação de prompts, pelo formato externo da chave de sessão,
pela escrituração genérica de `:thread:` e pelo despacho.

Novos plugins de canal também devem expor um adaptador `message` com
`defineChannelMessageAdapter` de `openclaw/plugin-sdk/channel-message`. O
adaptador declara quais capacidades duráveis de envio final o transporte nativo
realmente suporta e direciona envios de texto/mídia para as mesmas funções de transporte que
o adaptador `outbound` legado. Declare uma capacidade somente quando um teste de contrato
comprovar o efeito colateral nativo e o recibo retornado.
Para o contrato completo da API, exemplos, matriz de capacidades, regras de recibo, finalização de
prévia ao vivo, política de confirmação de recebimento, testes e tabela de migração, consulte
[API de mensagens de canal](/pt-BR/plugins/sdk-channel-message).
Se o adaptador `outbound` existente já tiver os métodos de envio e
metadados de capacidade corretos, use `createChannelMessageAdapterFromOutbound(...)` para
derivar o adaptador `message` em vez de escrever manualmente outra ponte.
Envios do adaptador devem retornar valores `MessageReceipt`. Quando o código de compatibilidade
ainda precisar de ids legados, derive-os com `listMessageReceiptPlatformIds(...)`
ou `resolveMessageReceiptPrimaryId(...)` em vez de manter campos
`messageIds` paralelos em novo código de ciclo de vida.
Canais com suporte a prévia também devem declarar `message.live.capabilities` com
o ciclo de vida ao vivo exato que controlam, como `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` ou
`quietFinalization`. Canais que finalizam uma prévia de rascunho no mesmo lugar também devem
declarar `message.live.finalizer.capabilities`, como `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` e
`retainOnAmbiguousFailure`, e rotear a lógica de runtime por meio de
`defineFinalizableLivePreviewAdapter(...)` mais
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantenha essas capacidades respaldadas
por testes `verifyChannelMessageLiveCapabilityAdapterProofs(...)` e
`verifyChannelMessageLiveFinalizerProofs(...)` para que o comportamento nativo de prévia,
progresso, edição, fallback/retenção, limpeza e recibo não desvie silenciosamente.
Receptores de entrada que adiam confirmações da plataforma devem declarar
`message.receive.defaultAckPolicy` e `supportedAckPolicies` em vez de ocultar
o momento da confirmação em estado local do monitor. Cubra cada política declarada com
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Auxiliares legados de resposta/turno, como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` e `recordInboundSessionAndDispatchReply`,
continuam disponíveis para despachantes de compatibilidade. Não use esses nomes para novo
código de canal; novos plugins devem começar pelo adaptador `message`, recibos e
auxiliares de ciclo de vida de recebimento/envio em `openclaw/plugin-sdk/channel-message`.

Canais que estejam migrando autorização de entrada podem usar o subcaminho experimental
`openclaw/plugin-sdk/channel-ingress-runtime` a partir de caminhos de recebimento em runtime.
O subcaminho mantém a busca da plataforma e os efeitos colaterais no plugin, enquanto
compartilha a resolução de estado da lista de permissão, decisões de rota/remetente/comando/evento/ativação,
diagnósticos redigidos e mapeamento de admissão de turno. Mantenha a normalização da identidade
do plugin no descritor que você passa ao resolvedor; não serialize valores brutos de correspondência
do estado ou da decisão resolvida. Consulte
[API de entrada de canal](/pt-BR/plugins/sdk-channel-ingress) para o design da API,
o limite de responsabilidade e as expectativas de teste.

Se o seu canal oferece suporte a indicadores de digitação fora de respostas de entrada, exponha
`heartbeat.sendTyping(...)` no plugin de canal. O núcleo a chama com o
destino de entrega de Heartbeat resolvido antes que a execução do modelo de Heartbeat comece e
usa o ciclo de vida compartilhado de keepalive/limpeza de digitação. Adicione `heartbeat.clearTyping(...)`
quando a plataforma precisar de um sinal explícito de parada.

Se o seu canal adiciona parâmetros de ferramenta de mensagens que carregam fontes de mídia, exponha esses
nomes de parâmetros por meio de `describeMessageTool(...).mediaSourceParams`. O núcleo usa
essa lista explícita para normalização de caminhos de sandbox e política de acesso a mídia de saída,
para que plugins não precisem de casos especiais no núcleo compartilhado para parâmetros específicos de provedor
de avatar, anexo ou imagem de capa.
Prefira retornar um mapa indexado por ação, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que ações não relacionadas não
herdem argumentos de mídia de outra ação. Um array plano ainda funciona para parâmetros que
são intencionalmente compartilhados entre todas as ações expostas.

Se o seu canal precisa de formatação específica do provedor para `message(action="send")`,
prefira `actions.prepareSendPayload(...)`. Coloque cartões nativos, blocos, embeds ou
outros dados duráveis em `payload.channelData.<channel>` e deixe o núcleo realizar
o envio real por meio do adaptador outbound/message. Use
`actions.handleAction(...)` para envio apenas como fallback de compatibilidade para
payloads que não podem ser serializados e tentados novamente.

Se a sua plataforma armazena escopo extra dentro de ids de conversa, mantenha essa análise
no plugin com `messaging.resolveSessionConversation(...)`. Esse é o
gancho canônico para mapear `rawId` para o id de conversa base, id de thread
opcional, `baseConversationId` explícito e quaisquer `parentConversationCandidates`.
Ao retornar `parentConversationCandidates`, mantenha-os ordenados do pai
mais restrito para a conversa mais ampla/base.

Use `openclaw/plugin-sdk/channel-route` quando o código do plugin precisar normalizar
campos semelhantes a rotas, comparar uma thread filha com sua rota pai ou criar uma
chave de deduplicação estável a partir de `{ channel, to, accountId, threadId }`. O auxiliar
normaliza ids numéricos de thread da mesma forma que o núcleo, portanto plugins devem preferi-lo
em vez de comparações ad hoc com `String(threadId)`.
Plugins com gramática de destino específica do provedor podem injetar seu analisador em
`resolveChannelRouteTargetWithParser(...)` e ainda obter o mesmo formato de destino de rota
e a mesma semântica de fallback de thread que o núcleo usa.

Plugins empacotados que precisam da mesma análise antes que o registro de canais inicialize
também podem expor um arquivo `session-key-api.ts` de nível superior com uma exportação
`resolveSessionConversation(...)` correspondente. O núcleo usa essa superfície segura para bootstrap
somente quando o registro de plugins em runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` continua disponível como
fallback de compatibilidade legado quando um plugin precisa apenas de fallbacks de pai além
do id genérico/bruto. Se ambos os ganchos existirem, o núcleo usa
`resolveSessionConversation(...).parentConversationCandidates` primeiro e só
recorre a `resolveParentConversationCandidates(...)` quando o gancho canônico
os omite.

## Aprovações e capacidades de canal

A maioria dos plugins de canal não precisa de código específico para aprovações.

- O núcleo é responsável por `/approve` no mesmo chat, payloads compartilhados de botões de aprovação e entrega genérica de fallback.
- Prefira um único objeto `approvalCapability` no Plugin de canal quando o canal precisar de comportamento específico de aprovação.
- `ChannelPlugin.approvals` foi removido. Coloque fatos de entrega/nativo/renderização/autenticação de aprovação em `approvalCapability`.
- `plugin.auth` é apenas login/logout; o núcleo não lê mais ganchos de autenticação de aprovação desse objeto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são o ponto de integração canônico de autenticação de aprovação.
- Use `approvalCapability.getActionAvailabilityState` para disponibilidade de autenticação de aprovação no mesmo chat.
- Se o seu canal expõe aprovações nativas de execução, use `approvalCapability.getExecInitiatingSurfaceState` para o estado da superfície iniciadora/cliente nativo quando ele diferir da autenticação de aprovação no mesmo chat. O núcleo usa esse gancho específico de execução para distinguir `enabled` de `disabled`, decidir se o canal iniciador oferece suporte a aprovações nativas de execução e incluir o canal na orientação de fallback para cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` preenche isso para o caso comum.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento de ciclo de vida de payload específico do canal, como ocultar prompts locais de aprovação duplicados ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.delivery` apenas para roteamento de aprovação nativa ou supressão de fallback.
- Use `approvalCapability.nativeRuntime` para fatos de aprovação nativa pertencentes ao canal. Mantenha-o preguiçoso em pontos de entrada de canal críticos com `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que pode importar seu módulo de runtime sob demanda e ainda permitir que o núcleo monte o ciclo de vida de aprovação.
- Use `approvalCapability.render` apenas quando um canal realmente precisar de payloads de aprovação personalizados em vez do renderizador compartilhado.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que a resposta do caminho desabilitado explique os controles exatos de configuração necessários para habilitar aprovações nativas de execução. O gancho recebe `{ channel, channelLabel, accountId }`; canais com contas nomeadas devem renderizar caminhos com escopo de conta, como `channels.<channel>.accounts.<id>.execApprovals.*`, em vez de padrões de nível superior.
- Se um canal consegue inferir identidades de DM estáveis semelhantes a proprietários a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica específica de aprovação ao núcleo.
- Se um canal precisa de entrega de aprovação nativa, mantenha o código do canal focado em normalização de destino e fatos de transporte/apresentação. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal atrás de `approvalCapability.nativeRuntime`, idealmente por meio de `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o núcleo possa montar o handler e ser responsável por filtragem de solicitações, roteamento, desduplicação, expiração, assinatura do Gateway e avisos de roteado para outro lugar. `nativeRuntime` é dividido em alguns pontos de integração menores:
- `createChannelNativeOriginTargetResolver` usa por padrão o comparador de rotas de canal compartilhado para destinos `{ to, accountId, threadId }`. Passe `targetsMatch` apenas quando um canal tiver regras de equivalência específicas do provedor, como correspondência por prefixo de timestamp do Slack.
- Passe `normalizeTargetForMatch` para `createChannelNativeOriginTargetResolver` quando o canal precisar canonicalizar ids de provedor antes que o comparador de rotas padrão ou um callback `targetsMatch` personalizado seja executado, preservando o destino original para entrega. Use `normalizeTarget` apenas quando o próprio destino de entrega resolvido deve ser canonicalizado.
- `availability` - se a conta está configurada e se uma solicitação deve ser tratada
- `presentation` - mapeia o modelo de visualização de aprovação compartilhado para payloads nativos pendentes/resolvidos/expirados ou ações finais
- `transport` - prepara destinos e envia/atualiza/exclui mensagens nativas de aprovação
- `interactions` - ganchos opcionais de vincular/desvincular/limpar ação para botões ou reações nativas
- `observe` - ganchos opcionais de diagnóstico de entrega
- Se o canal precisa de objetos pertencentes ao runtime, como um cliente, token, app Bolt ou receptor de webhook, registre-os por meio de `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto de runtime permite que o núcleo inicialize handlers orientados por capacidade a partir do estado de inicialização do canal sem adicionar cola de wrapper específica de aprovação.
- Recorra ao `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de nível mais baixo apenas quando o ponto de integração orientado por capacidade ainda não for expressivo o suficiente.
- Canais de aprovação nativa devem rotear tanto `accountId` quanto `approvalKind` por meio desses helpers. `accountId` mantém a política de aprovação multi-conta restrita à conta de bot correta, e `approvalKind` mantém o comportamento de aprovação de execução vs Plugin disponível para o canal sem ramificações codificadas no núcleo.
- O núcleo agora também é responsável por avisos de redirecionamento de aprovação. Plugins de canal não devem enviar suas próprias mensagens de acompanhamento "aprovação foi para DMs / outro canal" a partir de `createChannelNativeApprovalRuntime`; em vez disso, exponha roteamento preciso de origem + DM do aprovador por meio dos helpers de capacidade de aprovação compartilhada e deixe o núcleo agregar entregas reais antes de postar qualquer aviso de volta no chat iniciador.
- Preserve de ponta a ponta o tipo de id de aprovação entregue. Clientes nativos não devem
  adivinhar ou reescrever roteamento de aprovação de execução vs Plugin a partir de estado local do canal.
- Diferentes tipos de aprovação podem intencionalmente expor diferentes superfícies nativas.
  Exemplos agrupados atuais:
  - O Slack mantém o roteamento de aprovação nativa disponível para ids de execução e de Plugin.
  - O Matrix mantém o mesmo roteamento nativo por DM/canal e UX de reação para aprovações de execução
    e de Plugin, enquanto ainda permite que a autenticação difira por tipo de aprovação.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas código novo deve preferir o builder de capacidade e expor `approvalCapability` no Plugin.

Para pontos de entrada de canal críticos, prefira os subcaminhos de runtime mais restritos quando você só
precisar de uma parte dessa família:

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
`openclaw/plugin-sdk/reply-chunking` quando você não precisar da superfície
guarda-chuva mais ampla.

Especificamente para configuração:

- `openclaw/plugin-sdk/setup-runtime` cobre os helpers de configuração seguros para runtime:
  adaptadores de patch de configuração seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de nota de busca,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os builders delegados
  de proxy de configuração
- `openclaw/plugin-sdk/setup-runtime` inclui o ponto de integração de adaptador ciente de env para
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os builders de configuração de instalação opcional
  mais alguns primitivos seguros para configuração:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se o seu canal oferece suporte a configuração ou autenticação orientada por env e fluxos genéricos
de inicialização/configuração devem conhecer esses nomes de env antes que o runtime carregue, declare-os no
manifesto do Plugin com `channelEnvVars`. Mantenha `envVars` do runtime do canal ou constantes locais
apenas para texto voltado a operadores.

Se o seu canal pode aparecer em `status`, `channels list`, `channels status` ou
varreduras SecretRef antes que o runtime do Plugin inicie, adicione `openclaw.setupEntry` em
`package.json`. Esse ponto de entrada deve ser seguro para importar em caminhos de comando somente leitura
e deve retornar os metadados do canal, adaptador de configuração seguro para setup, adaptador de status
e metadados de destino de segredo do canal necessários para esses resumos. Não
inicie clientes, listeners ou runtimes de transporte a partir da entrada de configuração.

Mantenha o caminho de importação da entrada principal do canal restrito também. A descoberta pode avaliar a
entrada e o módulo do Plugin de canal para registrar capacidades sem ativar
o canal. Arquivos como `channel-plugin-api.ts` devem exportar o objeto de Plugin de canal
sem importar assistentes de configuração, clientes de transporte, listeners de socket,
lançadores de subprocessos ou módulos de inicialização de serviço. Coloque essas partes de runtime
em módulos carregados de `registerFull(...)`, setters de runtime ou adaptadores de
capacidade preguiçosos.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- use o ponto de integração mais amplo `openclaw/plugin-sdk/setup` apenas quando você também precisar dos
  helpers compartilhados mais pesados de configuração/config, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal só quer anunciar "instale este Plugin primeiro" em superfícies de configuração,
prefira `createOptionalChannelSetupSurface(...)`. O adaptador/assistente gerado
falha fechado em gravações de config e finalização, e reutiliza
a mesma mensagem de instalação obrigatória em validação, finalização e texto de
link de documentação.

Para outros caminhos críticos de canal, prefira os helpers restritos em vez de superfícies
legadas mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração multi-conta e
  fallback para conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` para rota/envelope de entrada e
  cabeamento de registrar e despachar
- `openclaw/plugin-sdk/messaging-targets` para parsing/correspondência de destinos
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` para carregamento de mídia mais delegados de
  identidade/envio de saída e planejamento de payload
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` quando uma rota de saída deve preservar um
  `replyToId`/`threadId` explícito ou recuperar a sessão `:thread:` atual
  depois que a chave de sessão base ainda corresponde. Plugins de provedor podem sobrescrever
  precedência, comportamento de sufixo e normalização de id de thread quando sua plataforma
  tiver semântica nativa de entrega em thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de vinculação de thread
  e registro de adaptador
- `openclaw/plugin-sdk/agent-media-payload` apenas quando um layout legado de campo de
  payload de agente/mídia ainda for necessário
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comandos personalizados do Telegram,
  validação de duplicata/conflito e um contrato de config de comandos estável para fallback

Canais somente de autenticação geralmente podem parar no caminho padrão: o núcleo lida com aprovações e o Plugin apenas expõe capacidades de saída/autenticação. Canais de aprovação nativa como Matrix, Slack, Telegram e transportes de chat personalizados devem usar os helpers nativos compartilhados em vez de criar seu próprio ciclo de vida de aprovação.

## Política de menção de entrada

Mantenha o tratamento de menções de entrada dividido em duas camadas:

- coleta de evidências pertencente ao Plugin
- avaliação de política compartilhada

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões de política de menção.
Use `openclaw/plugin-sdk/channel-inbound` apenas quando você precisar do barril mais amplo de
helpers de entrada.

Bom encaixe para lógica local do Plugin:

- detecção de resposta ao bot
- detecção de bot citado
- verificações de participação em thread
- exclusões de mensagens de serviço/sistema
- caches nativos da plataforma necessários para provar participação do bot

Bom encaixe para o helper compartilhado:

- `requireMention`
- resultado de menção explícita
- lista de permissões de menções implícitas
- desvio por comando
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
plugins de canal integrados que já dependem de injeção de tempo de execução:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se você precisar apenas de `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importe de
`openclaw/plugin-sdk/channel-mention-gating` para evitar carregar auxiliares de
tempo de execução de entrada não relacionados.

Os auxiliares antigos `resolveMentionGating*` permanecem em
`openclaw/plugin-sdk/channel-inbound` apenas como exports de compatibilidade. Código novo
deve usar `resolveInboundMentionDecision({ facts, policy })`.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do Plugin. O campo `channel` em `package.json` é
    o que torna isto um Plugin de canal. Para a superfície completa de metadados do pacote,
    consulte [Configuração e ajustes de Plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

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
    configurações pertencentes ao Plugin que não sejam a configuração de conta do canal. `channelConfigs`
    valida `channels.acme-chat` e é a fonte de caminho frio usada pelo esquema de configuração,
    pela configuração inicial e pelas superfícies de UI antes que o runtime do Plugin seja carregado.

  </Step>

  <Step title="Crie o objeto de Plugin de canal">
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

    Para canais que aceitam tanto chaves de DM canônicas de nível superior quanto chaves aninhadas legadas, use os auxiliares de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantêm valores locais da conta à frente de valores raiz herdados. Combine o mesmo resolvedor com o reparo do doctor por meio de `normalizeLegacyDmAliases` para que o runtime e a migração leiam o mesmo contrato.

    <Accordion title="O que createChatChannelPlugin faz por você">
      Em vez de implementar interfaces de adaptador de baixo nível manualmente, você passa
      opções declarativas e o construtor as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de DM com escopo a partir de campos de configuração |
      | `pairing.text` | Fluxo de pareamento de DM baseado em texto com troca de código |
      | `threading` | Resolvedor de modo de resposta (fixo, com escopo de conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados de resultado (IDs de mensagem) |

      Você também pode passar objetos brutos de adaptador em vez das opções declarativas
      se precisar de controle total.

      Adaptadores brutos de saída podem definir uma função `chunker(text, limit, ctx)`.
      O `ctx.formatting` opcional carrega decisões de formatação no momento da entrega,
      como `maxLinesPerMessage`; aplique-o antes de enviar para que o encadeamento de respostas
      e os limites de partes sejam resolvidos uma vez pela entrega de saída compartilhada.
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

    Coloque descritores de CLI pertencentes ao canal em `registerCliMetadata(...)` para que o OpenClaw
    possa mostrá-los na ajuda raiz sem ativar o runtime completo do canal,
    enquanto carregamentos completos normais ainda coletam os mesmos descritores para o registro real de comandos.
    Mantenha `registerFull(...)` para trabalho apenas de runtime.
    Se `registerFull(...)` registrar métodos RPC de Gateway, use um
    prefixo específico do Plugin. Namespaces administrativos do core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    resolvem para `operator.admin`.
    `defineChannelPluginEntry` lida automaticamente com a divisão de modo de registro. Consulte
    [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para todas
    as opções.

  </Step>

  <Step title="Adicione uma entrada de configuração inicial">
    Crie `setup-entry.ts` para carregamento leve durante a integração inicial:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega isto em vez da entrada completa quando o canal está desativado
    ou não configurado. Isso evita carregar código pesado de runtime durante fluxos de configuração inicial.
    Consulte [Configuração inicial e configuração](/pt-BR/plugins/sdk-setup#setup-entry) para detalhes.

    Canais do workspace integrado que separam exports seguros para configuração inicial em módulos auxiliares
    podem usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisam de um
    setter explícito de runtime no momento da configuração inicial.

  </Step>

  <Step title="Trate mensagens de entrada">
    Seu Plugin precisa receber mensagens da plataforma e encaminhá-las para
    o OpenClaw. O padrão típico é um Webhook que verifica a solicitação e
    a despacha por meio do handler de entrada do seu canal:

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
      O tratamento de mensagens recebidas é específico de cada canal. Cada Plugin de canal é responsável
      pelo seu próprio pipeline de entrada. Consulte os Plugins de canal incluídos
      (por exemplo, o pacote do Plugin do Microsoft Teams ou do Google Chat) para ver padrões reais.
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
├── package.json              # metadados openclaw.channel
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
    Modos de resposta fixos, com escopo por conta ou personalizados
  </Card>
  <Card title="Integração da ferramenta de mensagens" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Resolução de destino" icon="crosshair" href="/pt-BR/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia, subagente via api.runtime
  </Card>
  <Card title="Kernel de turnos de canal" icon="bolt" href="/pt-BR/plugins/sdk-channel-turn">
    Ciclo de vida compartilhado de turno recebido: ingestão, resolução, registro, despacho, finalização
  </Card>
</CardGroup>

<Note>
Algumas interfaces auxiliares incluídas ainda existem para manutenção e
compatibilidade de Plugins incluídos. Elas não são o padrão recomendado para novos Plugins de canal;
prefira os subcaminhos genéricos de canal/configuração/resposta/runtime da superfície
comum do SDK, a menos que você esteja mantendo diretamente essa família de Plugins incluídos.
</Note>

## Próximas etapas

- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - se o seu Plugin também fornece modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de importação por subcaminho
- [Testes do SDK](/pt-BR/plugins/sdk-testing) - utilitários de teste e testes de contrato
- [Manifesto do Plugin](/pt-BR/plugins/manifest) - esquema completo do manifesto

## Relacionados

- [Configuração do SDK do Plugin](/pt-BR/plugins/sdk-setup)
- [Como criar Plugins](/pt-BR/plugins/building-plugins)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
