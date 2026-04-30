---
read_when:
    - Você está criando um novo Plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um Plugin de canal de mensagens para o OpenClaw
title: Criando plugins de canal
x-i18n:
    generated_at: "2026-04-30T10:01:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Este guia mostra como criar um Plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança
de DM, pareamento, encadeamento de respostas e mensagens de saída.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para conhecer a estrutura
  básica do pacote e a configuração do manifesto.
</Info>

## Como Plugins de canal funcionam

Plugins de canal não precisam de suas próprias ferramentas de enviar/editar/reagir. O OpenClaw mantém uma
ferramenta `message` compartilhada no núcleo. Seu Plugin é responsável por:

- **Configuração** — resolução de conta e assistente de configuração
- **Segurança** — política de DM e listas de permissão
- **Pareamento** — fluxo de aprovação por DM
- **Gramática de sessão** — como ids de conversa específicos do provedor são mapeados para chats base, ids de thread e fallbacks de pai
- **Saída** — envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** — como respostas são encadeadas
- **Heartbeat de digitação** — sinais opcionais de digitação/ocupado para alvos de entrega de Heartbeat

O núcleo é responsável pela ferramenta de mensagem compartilhada, ligação com prompts, o formato externo da chave de sessão,
bookkeeping genérico de `:thread:` e despacho.

Se o seu canal oferece suporte a indicadores de digitação fora de respostas recebidas, exponha
`heartbeat.sendTyping(...)` no Plugin de canal. O núcleo o chama com o
alvo de entrega de Heartbeat resolvido antes que a execução do modelo de Heartbeat comece e
usa o ciclo de vida compartilhado de keepalive/limpeza de digitação. Adicione `heartbeat.clearTyping(...)`
quando a plataforma precisar de um sinal explícito de parada.

Se o seu canal adiciona parâmetros da ferramenta de mensagem que carregam fontes de mídia, exponha esses
nomes de parâmetros por meio de `describeMessageTool(...).mediaSourceParams`. O núcleo usa
essa lista explícita para normalização de caminho de sandbox e política de acesso à mídia
de saída, para que Plugins não precisem de casos especiais de núcleo compartilhado para parâmetros
específicos do provedor de avatar, anexo ou imagem de capa.
Prefira retornar um mapa indexado por chave de ação, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que ações não relacionadas não
herdem argumentos de mídia de outra ação. Um array plano ainda funciona para parâmetros que
são intencionalmente compartilhados entre todas as ações expostas.

Se sua plataforma armazena escopo extra dentro de ids de conversa, mantenha esse parsing
no Plugin com `messaging.resolveSessionConversation(...)`. Esse é o hook
canônico para mapear `rawId` para o id de conversa base, id de thread opcional,
`baseConversationId` explícito e quaisquer `parentConversationCandidates`.
Ao retornar `parentConversationCandidates`, mantenha-os ordenados do pai mais
restrito para a conversa mais ampla/base.

Use `openclaw/plugin-sdk/channel-route` quando o código do Plugin precisar normalizar
campos semelhantes a rotas, comparar uma thread filha com sua rota pai ou criar uma
chave de deduplicação estável a partir de `{ channel, to, accountId, threadId }`. O helper
normaliza ids de thread numéricos da mesma forma que o núcleo, então Plugins devem preferi-lo
em vez de comparações ad hoc com `String(threadId)`.
Plugins com gramática de alvo específica do provedor podem injetar seu parser em
`resolveChannelRouteTargetWithParser(...)` e ainda obter o mesmo formato de alvo de rota
e a mesma semântica de fallback de thread que o núcleo usa.

Plugins incluídos que precisam do mesmo parsing antes que o registro de canais inicialize
também podem expor um arquivo `session-key-api.ts` de nível superior com uma exportação
`resolveSessionConversation(...)` correspondente. O núcleo usa essa superfície segura para bootstrap
somente quando o registro de Plugins em runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` permanece disponível como
fallback de compatibilidade legado quando um Plugin só precisa de fallbacks de pai sobre
o id genérico/bruto. Se ambos os hooks existirem, o núcleo usa
`resolveSessionConversation(...).parentConversationCandidates` primeiro e só
recorre a `resolveParentConversationCandidates(...)` quando o hook canônico
os omite.

## Aprovações e capacidades de canal

A maioria dos Plugins de canal não precisa de código específico de aprovação.

- O núcleo é responsável por `/approve` no mesmo chat, payloads compartilhados de botões de aprovação e entrega genérica de fallback.
- Prefira um único objeto `approvalCapability` no Plugin de canal quando o canal precisar de comportamento específico de aprovação.
- `ChannelPlugin.approvals` foi removido. Coloque fatos de entrega/renderização/autenticação nativa em `approvalCapability`.
- `plugin.auth` serve apenas para login/logout; o núcleo não lê mais hooks de autenticação de aprovação desse objeto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são a seam canônica de autenticação de aprovação.
- Use `approvalCapability.getActionAvailabilityState` para disponibilidade de autenticação de aprovação no mesmo chat.
- Se seu canal expõe aprovações nativas de exec, use `approvalCapability.getExecInitiatingSurfaceState` para o estado da superfície iniciadora/cliente nativo quando ele diferir da autenticação de aprovação no mesmo chat. O núcleo usa esse hook específico de exec para distinguir `enabled` de `disabled`, decidir se o canal iniciador oferece suporte a aprovações nativas de exec e incluir o canal na orientação de fallback de cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` preenche isso no caso comum.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento do ciclo de vida de payload específico do canal, como ocultar prompts locais de aprovação duplicados ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.delivery` apenas para roteamento de aprovação nativa ou supressão de fallback.
- Use `approvalCapability.nativeRuntime` para fatos de aprovação nativa pertencentes ao canal. Mantenha-o preguiçoso em entrypoints quentes de canal com `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que pode importar seu módulo de runtime sob demanda e ainda permitir que o núcleo monte o ciclo de vida de aprovação.
- Use `approvalCapability.render` apenas quando um canal realmente precisar de payloads de aprovação personalizados em vez do renderizador compartilhado.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que a resposta do caminho desabilitado explique os knobs de configuração exatos necessários para habilitar aprovações nativas de exec. O hook recebe `{ channel, channelLabel, accountId }`; canais com contas nomeadas devem renderizar caminhos com escopo de conta, como `channels.<channel>.accounts.<id>.execApprovals.*`, em vez de padrões de nível superior.
- Se um canal puder inferir identidades estáveis de DM semelhantes a proprietários a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica específica de aprovação ao núcleo.
- Se um canal precisar de entrega de aprovação nativa, mantenha o código do canal focado em normalização de alvos e fatos de transporte/apresentação. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal atrás de `approvalCapability.nativeRuntime`, idealmente via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o núcleo possa montar o handler e assumir filtragem de solicitações, roteamento, deduplicação, expiração, assinatura do Gateway e avisos de roteamento para outro lugar. `nativeRuntime` é dividido em algumas seams menores:
- `createChannelNativeOriginTargetResolver` usa o matcher de rota de canal compartilhado por padrão para alvos `{ to, accountId, threadId }`. Passe `targetsMatch` apenas quando um canal tiver regras de equivalência específicas do provedor, como correspondência por prefixo de timestamp do Slack.
- Passe `normalizeTargetForMatch` para `createChannelNativeOriginTargetResolver` quando o canal precisar canonizar ids do provedor antes que o matcher de rota padrão ou um callback `targetsMatch` personalizado seja executado, preservando o alvo original para entrega. Use `normalizeTarget` apenas quando o próprio alvo de entrega resolvido deva ser canonizado.
- `availability` — se a conta está configurada e se uma solicitação deve ser tratada
- `presentation` — mapeia o modelo de visualização de aprovação compartilhado para payloads nativos pendentes/resolvidos/expirados ou ações finais
- `transport` — prepara alvos e envia/atualiza/exclui mensagens de aprovação nativas
- `interactions` — hooks opcionais de vincular/desvincular/limpar ação para botões ou reações nativas
- `observe` — hooks opcionais de diagnóstico de entrega
- Se o canal precisar de objetos pertencentes ao runtime, como cliente, token, app Bolt ou receptor de Webhook, registre-os por meio de `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto de runtime permite que o núcleo inicialize handlers orientados por capacidades a partir do estado de inicialização do canal sem adicionar cola de wrapper específica de aprovação.
- Use o `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de nível mais baixo apenas quando a seam orientada por capacidade ainda não for expressiva o suficiente.
- Canais de aprovação nativa devem rotear tanto `accountId` quanto `approvalKind` por esses helpers. `accountId` mantém a política de aprovação de múltiplas contas no escopo da conta de bot correta, e `approvalKind` mantém o comportamento de aprovação de exec vs Plugin disponível para o canal sem ramificações hardcoded no núcleo.
- O núcleo agora também é responsável por avisos de reroteamento de aprovação. Plugins de canal não devem enviar suas próprias mensagens de acompanhamento "approval went to DMs / another channel" a partir de `createChannelNativeApprovalRuntime`; em vez disso, exponha roteamento preciso de origem + DM do aprovador por meio dos helpers de capacidade de aprovação compartilhada e deixe o núcleo agregar entregas reais antes de postar qualquer aviso de volta no chat iniciador.
- Preserve o tipo do id de aprovação entregue de ponta a ponta. Clientes nativos não devem
  adivinhar nem reescrever roteamento de aprovação de exec vs Plugin a partir do estado local do canal.
- Diferentes tipos de aprovação podem expor intencionalmente superfícies nativas diferentes.
  Exemplos incluídos atualmente:
  - O Slack mantém roteamento de aprovação nativa disponível para ids de exec e Plugin.
  - O Matrix mantém o mesmo roteamento nativo de DM/canal e a UX de reações para aprovações
    de exec e Plugin, enquanto ainda permite que a autenticação varie por tipo de aprovação.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas código novo deve preferir o builder de capacidade e expor `approvalCapability` no Plugin.

Para entrypoints quentes de canal, prefira os subcaminhos de runtime mais restritos quando você só
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
`openclaw/plugin-sdk/reply-chunking` quando você não precisar da superfície
guarda-chuva mais ampla.

Especificamente para configuração:

- `openclaw/plugin-sdk/setup-runtime` cobre os helpers de configuração seguros para runtime:
  adaptadores de patch de configuração seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de nota de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os builders delegados
  de proxy de configuração
- `openclaw/plugin-sdk/setup-adapter-runtime` é a seam restrita de adaptador
  ciente de env para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os builders de configuração de instalação opcional
  mais alguns primitivos seguros para configuração:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se o seu canal oferece suporte a configuração ou autenticação orientada por env e fluxos genéricos
de inicialização/configuração devem conhecer esses nomes de env antes que o runtime carregue, declare-os no
manifesto do Plugin com `channelEnvVars`. Mantenha `envVars` de runtime do canal ou constantes locais
apenas para texto voltado ao operador.

Se o seu canal puder aparecer em `status`, `channels list`, `channels status` ou
verificações de SecretRef antes que o runtime do plugin inicie, adicione
`openclaw.setupEntry` em `package.json`. Esse ponto de entrada deve ser seguro
para importação em caminhos de comando somente leitura e deve retornar os
metadados do canal, o adaptador de configuração seguro para setup, o adaptador
de status e os metadados de destino de segredos do canal necessários para esses
resumos. Não inicie clientes, listeners ou runtimes de transporte a partir da
entrada de setup.

Mantenha também estreito o caminho de importação da entrada principal do canal. A
descoberta pode avaliar a entrada e o módulo do plugin de canal para registrar
capacidades sem ativar o canal. Arquivos como `channel-plugin-api.ts` devem
exportar o objeto do plugin de canal sem importar assistentes de setup, clientes
de transporte, listeners de socket, lançadores de subprocessos ou módulos de
inicialização de serviço. Coloque essas partes de runtime em módulos carregados
a partir de `registerFull(...)`, setters de runtime ou adaptadores de capacidade
preguiçosos.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- use a seam mais ampla `openclaw/plugin-sdk/setup` somente quando você também
  precisar dos helpers compartilhados mais pesados de setup/configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal só quiser anunciar "instale este plugin primeiro" nas superfícies
de setup, prefira `createOptionalChannelSetupSurface(...)`. O
adaptador/assistente gerado falha fechado em gravações de configuração e
finalização, e reutiliza a mesma mensagem de instalação obrigatória em validação,
finalização e cópia de link de documentação.

Para outros caminhos quentes de canal, prefira os helpers estreitos em vez das
superfícies legadas mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração de várias contas e
  fallback de conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` para rota/envelope de entrada e
  ligação de registrar e despachar
- `openclaw/plugin-sdk/messaging-targets` para análise/correspondência de destino
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` para carregamento de mídia mais
  delegados de identidade/envio de saída e planejamento de payload
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` quando uma rota de saída deve preservar um
  `replyToId`/`threadId` explícito ou recuperar a sessão `:thread:` atual
  depois que a chave de sessão base ainda corresponder. Plugins de provedor
  podem substituir precedência, comportamento de sufixo e normalização de ID de
  thread quando a plataforma deles tiver semântica nativa de entrega em thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de vínculos
  de thread e registro de adaptador
- `openclaw/plugin-sdk/agent-media-payload` somente quando um layout legado de
  campo de payload de agente/mídia ainda for necessário
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comandos
  personalizados do Telegram, validação de duplicatas/conflitos e um contrato de
  configuração de comandos estável em fallback

Canais somente de autenticação geralmente podem parar no caminho padrão: o core lida com aprovações e o plugin apenas expõe capacidades de saída/autenticação. Canais de aprovação nativa, como Matrix, Slack, Telegram e transportes de chat personalizados, devem usar os helpers nativos compartilhados em vez de implementar seu próprio ciclo de vida de aprovação.

## Política de menção de entrada

Mantenha o tratamento de menções de entrada dividido em duas camadas:

- coleta de evidências de propriedade do plugin
- avaliação de política compartilhada

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões de política de
menção. Use `openclaw/plugin-sdk/channel-inbound` somente quando precisar do
barrel de helpers de entrada mais amplo.

Bom encaixe para lógica local do plugin:

- detecção de resposta ao bot
- detecção de bot citado
- verificações de participação em thread
- exclusões de mensagens de serviço/sistema
- caches nativos da plataforma necessários para comprovar a participação do bot

Bom encaixe para o helper compartilhado:

- `requireMention`
- resultado de menção explícita
- lista de permissões de menção implícita
- bypass de comando
- decisão final de pular

Fluxo preferencial:

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

`api.runtime.channel.mentions` expõe os mesmos helpers compartilhados de menção
para plugins de canal incluídos que já dependem de injeção de runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se você precisar apenas de `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importe de
`openclaw/plugin-sdk/channel-mention-gating` para evitar carregar helpers de
runtime de entrada não relacionados.

Os helpers `resolveMentionGating*` mais antigos permanecem em
`openclaw/plugin-sdk/channel-inbound` apenas como exports de compatibilidade.
Código novo deve usar `resolveInboundMentionDecision({ facts, policy })`.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Crie os arquivos padrão do plugin. O campo `channel` em `package.json` é
    o que torna isto um plugin de canal. Para a superfície completa de metadados
    do pacote, consulte [Setup e Configuração de Plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

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
    configurações de propriedade do plugin que não são a configuração de conta do
    canal. `channelConfigs` valida `channels.acme-chat` e é a fonte de caminho
    frio usada por schema de configuração, setup e superfícies de UI antes que o
    runtime do plugin carregue.

  </Step>

  <Step title="Build the channel plugin object">
    A interface `ChannelPlugin` tem muitas superfícies opcionais de adaptador.
    Comece com o mínimo — `id` e `setup` — e adicione adaptadores conforme
    precisar deles.

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

    Para canais que aceitam tanto chaves canônicas de DM de nível superior quanto chaves legadas aninhadas, use os helpers de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantêm valores locais da conta à frente de valores raiz herdados. Combine o mesmo resolvedor com reparo de doctor por meio de `normalizeLegacyDmAliases` para que runtime e migração leiam o mesmo contrato.

    <Accordion title="What createChatChannelPlugin does for you">
      Em vez de implementar interfaces de adaptador de baixo nível manualmente,
      você passa opções declarativas e o builder as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de DM com escopo a partir de campos de configuração |
      | `pairing.text` | Fluxo de pareamento de DM baseado em texto com troca de código |
      | `threading` | Resolvedor de modo de resposta (fixo, com escopo por conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados de resultado (IDs de mensagem) |

      Você também pode passar objetos de adaptador brutos em vez das opções
      declarativas se precisar de controle total.

      Adaptadores brutos de saída podem definir uma função `chunker(text, limit, ctx)`.
      O `ctx.formatting` opcional carrega decisões de formatação no momento da entrega,
      como `maxLinesPerMessage`; aplique-o antes do envio para que o encadeamento de respostas
      e os limites de fragmentos sejam resolvidos uma única vez pela entrega de saída compartilhada.
      Contextos de envio também incluem `replyToIdSource` (`implicit` ou `explicit`)
      quando um destino de resposta nativo foi resolvido, para que auxiliares de payload possam preservar
      marcações de resposta explícitas sem consumir um slot de resposta implícita de uso único.
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
    Mantenha `registerFull(...)` para trabalho exclusivo de runtime.
    Se `registerFull(...)` registrar métodos RPC do Gateway, use um
    prefixo específico do plugin. Namespaces administrativos do core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    resolvem para `operator.admin`.
    `defineChannelPluginEntry` lida automaticamente com a divisão do modo de registro. Consulte
    [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para todas
    as opções.

  </Step>

  <Step title="Adicione uma entrada de configuração">
    Crie `setup-entry.ts` para carregamento leve durante a integração:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega isso em vez da entrada completa quando o canal está desativado
    ou não configurado. Isso evita carregar código pesado de runtime durante fluxos de configuração.
    Consulte [Configuração](/pt-BR/plugins/sdk-setup#setup-entry) para obter detalhes.

    Canais empacotados do workspace que dividem exports seguros para configuração em módulos
    auxiliares podem usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisarem de um
    setter explícito de runtime no momento da configuração.

  </Step>

  <Step title="Manipule mensagens de entrada">
    Seu plugin precisa receber mensagens da plataforma e encaminhá-las para o
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
          // The exact wiring depends on your platform SDK —
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
      A manipulação de mensagens de entrada é específica do canal. Cada plugin de canal é dono
      do próprio pipeline de entrada. Veja plugins de canal empacotados
      (por exemplo, o pacote de plugin do Microsoft Teams ou do Google Chat) para padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Teste">
Escreva testes colocalizados em `src/channel.test.ts`:

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

    Para auxiliares de teste compartilhados, consulte [Testes](/pt-BR/plugins/sdk-testing).

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
  <Card title="Integração de ferramenta de mensagem" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Resolução de destino" icon="crosshair" href="/pt-BR/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Auxiliares de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia, subagente via api.runtime
  </Card>
  <Card title="Kernel de turno de canal" icon="bolt" href="/pt-BR/plugins/sdk-channel-turn">
    Ciclo de vida compartilhado de turno de entrada: ingerir, resolver, registrar, despachar, finalizar
  </Card>
</CardGroup>

<Note>
Alguns pontos de extensão auxiliares empacotados ainda existem para manutenção de plugins empacotados e
compatibilidade. Eles não são o padrão recomendado para novos plugins de canal;
prefira os subcaminhos genéricos de canal/configuração/resposta/runtime da superfície comum do SDK,
a menos que você esteja mantendo diretamente essa família de plugins empacotados.
</Note>

## Próximos passos

- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — se seu plugin também fornece modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports de subcaminhos
- [Testes do SDK](/pt-BR/plugins/sdk-testing) — utilitários de teste e testes de contrato
- [Manifest do plugin](/pt-BR/plugins/manifest) — esquema completo do manifest

## Relacionado

- [Configuração do SDK do plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
