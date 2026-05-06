---
read_when:
    - Você está criando um novo Plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um Plugin de canal de mensagens para o OpenClaw
title: Criando plugins de canal
x-i18n:
    generated_at: "2026-05-06T09:07:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Este guia percorre a criação de um plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança de DM,
emparelhamento, encadeamento de respostas e mensagens de saída.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw, leia
  [Introdução](/pt-BR/plugins/building-plugins) primeiro para conhecer a estrutura básica do pacote
  e a configuração do manifesto.
</Info>

## Como os plugins de canal funcionam

Plugins de canal não precisam de suas próprias ferramentas de enviar/editar/reagir. O OpenClaw mantém uma
ferramenta `message` compartilhada no core. Seu plugin é responsável por:

- **Configuração** - resolução de conta e assistente de configuração
- **Segurança** - política de DM e listas de permissões
- **Emparelhamento** - fluxo de aprovação por DM
- **Gramática de sessão** - como ids de conversa específicos do provedor mapeiam para chats base, ids de thread e fallbacks de pai
- **Saída** - envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** - como as respostas são encadeadas
- **Digitação de Heartbeat** - sinais opcionais de digitação/ocupado para alvos de entrega de Heartbeat

O core é responsável pela ferramenta de mensagem compartilhada, pela ligação de prompts, pelo formato externo da chave de sessão,
pela escrituração genérica de `:thread:` e pelo despacho.

Novos plugins de canal também devem expor um adaptador `message` com
`defineChannelMessageAdapter` de `openclaw/plugin-sdk/channel-message`. O
adaptador declara quais recursos duráveis de envio final o transporte nativo
realmente oferece e aponta envios de texto/mídia para as mesmas funções de transporte que
o adaptador legado `outbound`. Declare um recurso apenas quando um teste de contrato
comprovar o efeito colateral nativo e o recibo retornado.
Para o contrato completo da API, exemplos, matriz de recursos, regras de recibo,
finalização de pré-visualização ao vivo, política de ack de recebimento, testes e tabela de migração, consulte
[API de mensagens de canal](/pt-BR/plugins/sdk-channel-message).
Se o adaptador `outbound` existente já tiver os métodos de envio e os metadados
de recurso corretos, use `createChannelMessageAdapterFromOutbound(...)` para
derivar o adaptador `message` em vez de escrever outra ponte manualmente.
Envios do adaptador devem retornar valores `MessageReceipt`. Quando código de compatibilidade
ainda precisar de ids legados, derive-os com `listMessageReceiptPlatformIds(...)`
ou `resolveMessageReceiptPrimaryId(...)` em vez de manter campos
`messageIds` paralelos em novo código de ciclo de vida.
Canais com suporte a pré-visualização também devem declarar `message.live.capabilities` com
o ciclo de vida ao vivo exato que controlam, como `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` ou
`quietFinalization`. Canais que finalizam uma pré-visualização de rascunho no lugar também devem
declarar `message.live.finalizer.capabilities`, como `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` e
`retainOnAmbiguousFailure`, e rotear a lógica de runtime por
`defineFinalizableLivePreviewAdapter(...)` mais
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantenha esses recursos respaldados
por testes `verifyChannelMessageLiveCapabilityAdapterProofs(...)` e
`verifyChannelMessageLiveFinalizerProofs(...)` para que o comportamento nativo de pré-visualização,
progresso, edição, fallback/retenção, limpeza e recibo não se desvie silenciosamente.
Receptores de entrada que adiam confirmações da plataforma devem declarar
`message.receive.defaultAckPolicy` e `supportedAckPolicies` em vez de ocultar
o tempo de ack em estado local do monitor. Cubra toda política declarada com
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Helpers legados de resposta/turno, como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` e `recordInboundSessionAndDispatchReply`,
continuam disponíveis para dispatchers de compatibilidade. Não use esses nomes para novo
código de canal; novos plugins devem começar com o adaptador `message`, recibos e
helpers de ciclo de vida de recebimento/envio em `openclaw/plugin-sdk/channel-message`.

Se seu canal oferecer suporte a indicadores de digitação fora de respostas de entrada, exponha
`heartbeat.sendTyping(...)` no plugin de canal. O core o chama com o
alvo resolvido de entrega de Heartbeat antes do início da execução do modelo de Heartbeat e
usa o ciclo de vida compartilhado de keepalive/limpeza de digitação. Adicione `heartbeat.clearTyping(...)`
quando a plataforma precisar de um sinal explícito de parada.

Se seu canal adicionar parâmetros da ferramenta de mensagem que carregam fontes de mídia, exponha esses
nomes de parâmetros por `describeMessageTool(...).mediaSourceParams`. O core usa
essa lista explícita para normalização de caminhos de sandbox e política de acesso a mídia de saída,
então os plugins não precisam de casos especiais no core compartilhado para parâmetros específicos do provedor
de avatar, anexo ou imagem de capa.
Prefira retornar um mapa indexado por ação, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que ações não relacionadas não
herdem argumentos de mídia de outra ação. Um array plano ainda funciona para parâmetros que
são compartilhados intencionalmente entre todas as ações expostas.

Se seu canal precisar de modelagem específica do provedor para `message(action="send")`,
prefira `actions.prepareSendPayload(...)`. Coloque cards nativos, blocos, embeds ou
outros dados duráveis em `payload.channelData.<channel>` e deixe o core executar
o envio real pelo adaptador outbound/message. Use
`actions.handleAction(...)` para envio apenas como fallback de compatibilidade para
payloads que não podem ser serializados e repetidos.

Se sua plataforma armazena escopo extra dentro de ids de conversa, mantenha essa análise
no plugin com `messaging.resolveSessionConversation(...)`. Esse é o
hook canônico para mapear `rawId` para o id de conversa base, id de thread
opcional, `baseConversationId` explícito e quaisquer `parentConversationCandidates`.
Ao retornar `parentConversationCandidates`, mantenha-os ordenados do pai
mais específico para a conversa mais ampla/base.

Use `openclaw/plugin-sdk/channel-route` quando o código do plugin precisar normalizar
campos semelhantes a rotas, comparar uma thread filha com sua rota pai ou criar uma
chave estável de deduplicação a partir de `{ channel, to, accountId, threadId }`. O helper
normaliza ids numéricos de thread da mesma forma que o core, então os plugins devem preferi-lo
a comparações ad hoc com `String(threadId)`.
Plugins com gramática de destino específica do provedor podem injetar seu parser em
`resolveChannelRouteTargetWithParser(...)` e ainda obter o mesmo formato de destino de rota
e as semânticas de fallback de thread que o core usa.

Plugins integrados que precisam da mesma análise antes de o registro de canais inicializar
também podem expor um arquivo `session-key-api.ts` de nível superior com uma exportação
`resolveSessionConversation(...)` correspondente. O core usa essa superfície segura para bootstrap
apenas quando o registro de plugins em runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` continua disponível como
fallback legado de compatibilidade quando um plugin precisa apenas de fallbacks de pai sobre
o id genérico/bruto. Se ambos os hooks existirem, o core usa
`resolveSessionConversation(...).parentConversationCandidates` primeiro e só
recorre a `resolveParentConversationCandidates(...)` quando o hook canônico
os omite.

## Aprovações e recursos de canal

A maioria dos plugins de canal não precisa de código específico de aprovação.

- O núcleo é dono do `/approve` no mesmo chat, dos payloads compartilhados de botões de aprovação e da entrega genérica de fallback.
- Prefira um objeto `approvalCapability` no Plugin de canal quando o canal precisar de comportamento específico de aprovação.
- `ChannelPlugin.approvals` foi removido. Coloque fatos de entrega/nativo/renderização/autenticação de aprovação em `approvalCapability`.
- `plugin.auth` é somente login/logout; o núcleo não lê mais hooks de autenticação de aprovação a partir desse objeto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são a seam canônica de autenticação de aprovação.
- Use `approvalCapability.getActionAvailabilityState` para disponibilidade de autenticação de aprovação no mesmo chat.
- Se o seu canal expõe aprovações nativas de exec, use `approvalCapability.getExecInitiatingSurfaceState` para o estado da superfície iniciadora/cliente nativo quando ele diferir da autenticação de aprovação no mesmo chat. O núcleo usa esse hook específico de exec para distinguir `enabled` de `disabled`, decidir se o canal iniciador oferece suporte a aprovações nativas de exec e incluir o canal na orientação de fallback do cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` preenche isso para o caso comum.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento de ciclo de vida de payload específico do canal, como ocultar prompts locais duplicados de aprovação ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.delivery` somente para roteamento de aprovação nativa ou supressão de fallback.
- Use `approvalCapability.nativeRuntime` para fatos de aprovação nativa pertencentes ao canal. Mantenha-o lazy em entrypoints quentes de canal com `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que pode importar seu módulo de runtime sob demanda enquanto ainda permite que o núcleo monte o ciclo de vida da aprovação.
- Use `approvalCapability.render` somente quando um canal realmente precisar de payloads de aprovação customizados em vez do renderizador compartilhado.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que a resposta do caminho desativado explique os knobs exatos de configuração necessários para habilitar aprovações nativas de exec. O hook recebe `{ channel, channelLabel, accountId }`; canais com contas nomeadas devem renderizar caminhos com escopo de conta, como `channels.<channel>.accounts.<id>.execApprovals.*`, em vez de padrões de nível superior.
- Se um canal consegue inferir identidades estáveis de DM semelhantes a owner a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica específica de aprovação no núcleo.
- Se um canal precisa de entrega de aprovação nativa, mantenha o código do canal focado na normalização do alvo mais fatos de transporte/apresentação. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal por trás de `approvalCapability.nativeRuntime`, idealmente via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o núcleo possa montar o handler e ser dono de filtragem de solicitações, roteamento, deduplicação, expiração, assinatura do Gateway e avisos de roteado-para-outro-lugar. `nativeRuntime` é dividido em algumas seams menores:
- `createChannelNativeOriginTargetResolver` usa o matcher compartilhado de rotas de canal por padrão para alvos `{ to, accountId, threadId }`. Passe `targetsMatch` somente quando um canal tiver regras de equivalência específicas do provedor, como correspondência de prefixo de timestamp do Slack.
- Passe `normalizeTargetForMatch` para `createChannelNativeOriginTargetResolver` quando o canal precisar canonicalizar ids de provedor antes que o matcher de rotas padrão ou um callback `targetsMatch` customizado rode, preservando o alvo original para entrega. Use `normalizeTarget` somente quando o próprio alvo de entrega resolvido deve ser canonicalizado.
- `availability` - se a conta está configurada e se uma solicitação deve ser tratada
- `presentation` - mapear o modelo de visualização de aprovação compartilhado para payloads nativos pendentes/resolvidos/expirados ou ações finais
- `transport` - preparar alvos e enviar/atualizar/excluir mensagens nativas de aprovação
- `interactions` - hooks opcionais de vincular/desvincular/limpar-ação para botões ou reações nativas
- `observe` - hooks opcionais de diagnóstico de entrega
- Se o canal precisar de objetos pertencentes ao runtime, como um cliente, token, app Bolt ou receptor de webhook, registre-os por meio de `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto de runtime permite que o núcleo inicialize handlers orientados por capability a partir do estado de inicialização do canal sem adicionar glue wrapper específico de aprovação.
- Recorra ao `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de nível mais baixo somente quando a seam orientada por capability ainda não for expressiva o suficiente.
- Canais de aprovação nativa devem rotear tanto `accountId` quanto `approvalKind` por esses helpers. `accountId` mantém a política de aprovação de várias contas escopada à conta de bot correta, e `approvalKind` mantém o comportamento de aprovação exec vs plugin disponível para o canal sem branches hardcoded no núcleo.
- O núcleo agora também é dono dos avisos de redirecionamento de aprovação. Plugins de canal não devem enviar suas próprias mensagens de acompanhamento "a aprovação foi para DMs / outro canal" a partir de `createChannelNativeApprovalRuntime`; em vez disso, exponha roteamento preciso de origem + DM do aprovador pelos helpers compartilhados de capability de aprovação e deixe o núcleo agregar as entregas reais antes de postar qualquer aviso de volta ao chat iniciador.
- Preserve o tipo de id de aprovação entregue de ponta a ponta. Clientes nativos não devem
  adivinhar ou reescrever roteamento de aprovação exec vs plugin a partir do estado local do canal.
- Tipos diferentes de aprovação podem expor intencionalmente superfícies nativas diferentes.
  Exemplos agrupados atuais:
  - Slack mantém roteamento de aprovação nativa disponível para ids de exec e plugin.
  - Matrix mantém o mesmo roteamento nativo de DM/canal e UX de reação para aprovações exec
    e plugin, enquanto ainda permite que a autenticação difira por tipo de aprovação.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas código novo deve preferir o builder de capability e expor `approvalCapability` no plugin.

Para entrypoints quentes de canal, prefira os subpaths de runtime mais estreitos quando você só
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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando você não precisar da superfície guarda-chuva
mais ampla.

Para setup especificamente:

- `openclaw/plugin-sdk/setup-runtime` cobre os helpers de setup seguros para runtime:
  adaptadores de patch de setup seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de nota de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os builders delegados
  de proxy de setup
- `openclaw/plugin-sdk/setup-adapter-runtime` é a seam estreita de adaptador ciente de env
  para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os builders de setup de instalação opcional
  mais alguns primitivos seguros para setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se o seu canal oferece suporte a setup ou autenticação orientados por env e fluxos genéricos
de inicialização/configuração devem conhecer esses nomes de env antes do carregamento do runtime, declare-os no
manifesto do plugin com `channelEnvVars`. Mantenha `envVars` de runtime de canal ou constantes locais
somente para texto voltado a operadores.

Se o seu canal pode aparecer em `status`, `channels list`, `channels status` ou
varreduras de SecretRef antes do runtime do plugin iniciar, adicione `openclaw.setupEntry` em
`package.json`. Esse entrypoint deve ser seguro para importação em caminhos de comando somente leitura
e deve retornar os metadados do canal, o adaptador de configuração seguro para setup, o adaptador de status
e os metadados de alvo secreto do canal necessários para esses resumos. Não
inicie clientes, listeners ou runtimes de transporte a partir da entrada de setup.

Mantenha o caminho de importação da entrada principal do canal estreito também. A descoberta pode avaliar a
entrada e o módulo do plugin de canal para registrar capabilities sem ativar
o canal. Arquivos como `channel-plugin-api.ts` devem exportar o objeto de plugin de canal
sem importar assistentes de setup, clientes de transporte, listeners de socket,
lançadores de subprocessos ou módulos de inicialização de serviço. Coloque essas peças de runtime
em módulos carregados a partir de `registerFull(...)`, setters de runtime ou adaptadores
lazy de capability.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- use a seam mais ampla `openclaw/plugin-sdk/setup` somente quando você também precisar dos
  helpers compartilhados mais pesados de setup/configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal só quer anunciar "instale este plugin primeiro" em superfícies de setup,
prefira `createOptionalChannelSetupSurface(...)`. O adaptador/assistente gerado
falha fechado em escritas de configuração e finalização, e reutiliza
a mesma mensagem de instalação obrigatória em validação, finalização e texto de link
de docs.

Para outros caminhos quentes de canal, prefira os helpers estreitos em vez das superfícies legadas
mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração de várias contas e
  fallback de conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` para rota/envelope inbound e
  wiring de registrar-e-despachar
- `openclaw/plugin-sdk/messaging-targets` para parsing/correspondência de alvos
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` para carregamento de mídia mais delegados de identidade/envio outbound e planejamento de payload
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` quando uma rota outbound deve preservar um
  `replyToId`/`threadId` explícito ou recuperar a sessão `:thread:` atual
  depois que a chave base de sessão ainda corresponde. Plugins de provedor podem substituir
  precedência, comportamento de sufixo e normalização de id de thread quando a plataforma deles
  tiver semântica nativa de entrega em threads.
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de vinculação de threads
  e registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` somente quando um layout legado de campo
  de payload de agente/mídia ainda for necessário
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comandos customizados do Telegram,
  validação de duplicatas/conflitos e um contrato de configuração de comando
  estável para fallback

Canais somente de autenticação geralmente podem parar no caminho padrão: o núcleo lida com aprovações e o plugin apenas expõe capabilities outbound/autenticação. Canais de aprovação nativa como Matrix, Slack, Telegram e transportes de chat customizados devem usar os helpers nativos compartilhados em vez de criar seu próprio ciclo de vida de aprovação.

## Política de menção inbound

Mantenha o tratamento de menção inbound dividido em duas camadas:

- coleta de evidências pertencente ao plugin
- avaliação de política compartilhada

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões de política de menção.
Use `openclaw/plugin-sdk/channel-inbound` somente quando precisar do barrel inbound
mais amplo.

Bom encaixe para lógica local do plugin:

- detecção de resposta ao bot
- detecção de bot citado
- verificações de participação em thread
- exclusões de mensagens de serviço/sistema
- caches nativos da plataforma necessários para provar participação do bot

Bom encaixe para o helper compartilhado:

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

`api.runtime.channel.mentions` expõe os mesmos helpers compartilhados de menção para
Plugins de canal incluídos que já dependem de injeção de runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se você precisa apenas de `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importe de
`openclaw/plugin-sdk/channel-mention-gating` para evitar carregar helpers de
runtime de entrada não relacionados.

Os helpers antigos `resolveMentionGating*` continuam em
`openclaw/plugin-sdk/channel-inbound` apenas como exportações de compatibilidade. Código novo
deve usar `resolveInboundMentionDecision({ facts, policy })`.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do Plugin. O campo `channel` em `package.json` é
    o que torna isto um Plugin de canal. Para a superfície completa de metadados do pacote,
    consulte [Configuração do Plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

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
    configurações pertencentes ao Plugin que não são a configuração da conta do canal. `channelConfigs`
    valida `channels.acme-chat` e é a fonte de caminho frio usada pela configuração de
    esquema, setup e superfícies de UI antes que o runtime do Plugin seja carregado.

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

    Para canais que aceitam tanto chaves canônicas de DM em nível superior quanto chaves aninhadas legadas, use os helpers de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantêm valores locais da conta à frente de valores raiz herdados. Combine o mesmo resolvedor com reparo do doctor por meio de `normalizeLegacyDmAliases` para que o runtime e a migração leiam o mesmo contrato.

    <Accordion title="O que createChatChannelPlugin faz por você">
      Em vez de implementar interfaces de adaptador de baixo nível manualmente, você passa
      opções declarativas e o builder as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de DM com escopo a partir de campos de configuração |
      | `pairing.text` | Fluxo de pareamento de DM baseado em texto com troca de código |
      | `threading` | Resolvedor do modo de resposta (fixo, com escopo de conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados de resultado (IDs de mensagem) |

      Você também pode passar objetos de adaptador brutos em vez das opções declarativas
      se precisar de controle total.

      Adaptadores brutos de saída podem definir uma função `chunker(text, limit, ctx)`.
      O `ctx.formatting` opcional carrega decisões de formatação no momento da entrega,
      como `maxLinesPerMessage`; aplique-o antes de enviar para que o encadeamento de respostas
      e os limites de chunks sejam resolvidos uma vez pela entrega de saída compartilhada.
      Contextos de envio também incluem `replyToIdSource` (`implicit` ou `explicit`)
      quando um destino de resposta nativo foi resolvido, para que helpers de payload possam preservar
      tags de resposta explícitas sem consumir um slot implícito de resposta de uso único.
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
    enquanto carregamentos completos normais ainda capturam os mesmos descritores para o registro real de comandos.
    Mantenha `registerFull(...)` para trabalho apenas de runtime.
    Se `registerFull(...)` registrar métodos RPC do Gateway, use um
    prefixo específico do Plugin. Namespaces administrativos do core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    resolvem para `operator.admin`.
    `defineChannelPluginEntry` lida automaticamente com a divisão do modo de registro. Consulte
    [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para todas
    as opções.

  </Step>

  <Step title="Adicione uma entrada de setup">
    Crie `setup-entry.ts` para carregamento leve durante o onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega isto em vez da entrada completa quando o canal está desativado
    ou não configurado. Isso evita puxar código pesado de runtime durante fluxos de setup.
    Consulte [Setup e configuração](/pt-BR/plugins/sdk-setup#setup-entry) para detalhes.

    Canais incluídos no workspace que dividem exportações seguras para setup em módulos
    sidecar podem usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisam de um
    setter explícito de runtime em tempo de setup.

  </Step>

  <Step title="Trate mensagens de entrada">
    Seu Plugin precisa receber mensagens da plataforma e encaminhá-las para
    o OpenClaw. O padrão típico é um Webhook que verifica a solicitação e
    a despacha pelo handler de entrada do seu canal:

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
      O tratamento de mensagens de entrada é específico de cada canal. Cada Plugin de canal controla
      seu próprio pipeline de entrada. Consulte os Plugins de canal incluídos
      (por exemplo, o pacote do Plugin do Microsoft Teams ou do Google Chat) para ver padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testar">
Escreva testes colocados no mesmo diretório em `src/channel.test.ts`:

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
  <Card title="Opções de encadeamento" icon="git-branch" href="/pt-BR/plugins/sdk-entrypoints#registration-mode">
    Modos de resposta fixos, com escopo de conta ou personalizados
  </Card>
  <Card title="Integração com ferramenta de mensagens" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Resolução de destino" icon="crosshair" href="/pt-BR/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia, subagente via api.runtime
  </Card>
  <Card title="Kernel de turno de canal" icon="bolt" href="/pt-BR/plugins/sdk-channel-turn">
    Ciclo de vida compartilhado de turno de entrada: ingerir, resolver, registrar, despachar, finalizar
  </Card>
</CardGroup>

<Note>
Algumas interfaces auxiliares incluídas ainda existem para manutenção e
compatibilidade de Plugins incluídos. Elas não são o padrão recomendado para novos Plugins de canal;
prefira os subcaminhos genéricos de canal/configuração/resposta/runtime da superfície comum do SDK,
a menos que você esteja mantendo diretamente essa família de Plugins incluídos.
</Note>

## Próximos passos

- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - se o seu Plugin também fornece modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de importação de subcaminhos
- [Testes do SDK](/pt-BR/plugins/sdk-testing) - utilitários de teste e testes de contrato
- [Manifesto do Plugin](/pt-BR/plugins/manifest) - esquema completo do manifesto

## Relacionado

- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criação de Plugins](/pt-BR/plugins/building-plugins)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
