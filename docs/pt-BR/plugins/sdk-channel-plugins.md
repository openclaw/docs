---
read_when:
    - Você está criando um novo Plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um Plugin de canal de mensagens para o OpenClaw
title: Criando Plugins de canal
x-i18n:
    generated_at: "2026-04-25T13:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Este guia mostra como criar um Plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança de DM,
emparelhamento, encadeamento de respostas e mensagens de saída.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw antes, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para entender a estrutura
  básica do pacote e a configuração do manifesto.
</Info>

## Como os Plugins de canal funcionam

Plugins de canal não precisam de suas próprias ferramentas de enviar/editar/reagir. O OpenClaw mantém uma única
ferramenta `message` compartilhada no núcleo. Seu Plugin é responsável por:

- **Configuração** — resolução de conta e assistente de configuração
- **Segurança** — política de DM e allowlists
- **Emparelhamento** — fluxo de aprovação de DM
- **Gramática de sessão** — como ids de conversa específicos do provedor são mapeados para chats base, ids de thread e fallbacks de pai
- **Saída** — envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** — como as respostas são encadeadas
- **Digitação de Heartbeat** — sinais opcionais de digitação/ocupado para destinos de entrega de Heartbeat

O núcleo é responsável pela ferramenta de mensagem compartilhada, pela conexão do prompt, pelo formato externo da chave de sessão,
pela contabilidade genérica de `:thread:` e pelo despacho.

Se o seu canal oferece suporte a indicadores de digitação fora de respostas recebidas,
exponha `heartbeat.sendTyping(...)` no Plugin de canal. O núcleo o chama com o
destino de entrega de Heartbeat resolvido antes do início da execução do modelo de Heartbeat e
usa o ciclo de vida compartilhado de keepalive/limpeza de digitação. Adicione `heartbeat.clearTyping(...)`
quando a plataforma exigir um sinal explícito de parada.

Se o seu canal adiciona parâmetros da ferramenta de mensagem que carregam fontes de mídia, exponha esses
nomes de parâmetro por meio de `describeMessageTool(...).mediaSourceParams`. O núcleo usa
essa lista explícita para normalização de caminho em sandbox e política de acesso a mídia de saída,
para que os Plugins não precisem de casos especiais no núcleo compartilhado para parâmetros específicos do provedor, como
avatar, anexo ou imagem de capa.
Prefira retornar um mapa por chave de ação, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que ações não relacionadas não
herdem os argumentos de mídia de outra ação. Um array plano ainda funciona para parâmetros
compartilhados intencionalmente entre todas as ações expostas.

Se sua plataforma armazena escopo extra dentro de ids de conversa, mantenha essa análise
no Plugin com `messaging.resolveSessionConversation(...)`. Esse é o hook canônico
para mapear `rawId` para o id base da conversa, `threadId` opcional,
`baseConversationId` explícito e quaisquer `parentConversationCandidates`.
Quando você retornar `parentConversationCandidates`, mantenha-os ordenados do
pai mais específico para o mais amplo/base da conversa.

Plugins incluídos que precisem da mesma análise antes de o registro de canais iniciar
também podem expor um arquivo `session-key-api.ts` de nível superior com uma exportação
correspondente `resolveSessionConversation(...)`. O núcleo usa essa superfície segura para bootstrap
somente quando o registro de Plugins em runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` continua disponível como um
fallback legado de compatibilidade quando um Plugin só precisa de fallbacks de pai sobre
o id genérico/bruto. Se ambos os hooks existirem, o núcleo usa primeiro
`resolveSessionConversation(...).parentConversationCandidates` e só
recorre a `resolveParentConversationCandidates(...)` quando o hook canônico
os omite.

## Aprovações e recursos do canal

A maioria dos Plugins de canal não precisa de código específico para aprovações.

- O núcleo é responsável por `/approve` no mesmo chat, payloads compartilhados de botão de aprovação e entrega genérica de fallback.
- Prefira um único objeto `approvalCapability` no Plugin de canal quando o canal precisar de comportamento específico de aprovação.
- `ChannelPlugin.approvals` foi removido. Coloque fatos de entrega/native/render/autenticação em `approvalCapability`.
- `plugin.auth` é apenas para login/logout; o núcleo não lê mais hooks de autenticação de aprovação nesse objeto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são a superfície canônica de autenticação de aprovação.
- Use `approvalCapability.getActionAvailabilityState` para disponibilidade de autenticação de aprovação no mesmo chat.
- Se seu canal expõe aprovações nativas de exec, use `approvalCapability.getExecInitiatingSurfaceState` para o estado da superfície iniciadora/cliente nativo quando ele diferir da autenticação de aprovação no mesmo chat. O núcleo usa esse hook específico de exec para distinguir `enabled` de `disabled`, decidir se o canal iniciador oferece suporte a aprovações nativas de exec e incluir o canal em orientações de fallback de cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` preenche isso para o caso comum.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento específico do canal no ciclo de vida do payload, como ocultar prompts locais de aprovação duplicados ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.delivery` apenas para roteamento de aprovação nativa ou supressão de fallback.
- Use `approvalCapability.nativeRuntime` para fatos de aprovação nativa controlados pelo canal. Mantenha-o lazy em pontos de entrada quentes do canal com `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que pode importar seu módulo de runtime sob demanda enquanto ainda permite que o núcleo monte o ciclo de vida de aprovação.
- Use `approvalCapability.render` apenas quando um canal realmente precisar de payloads de aprovação personalizados em vez do renderizador compartilhado.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que a resposta do caminho desabilitado explique exatamente quais controles de configuração são necessários para habilitar aprovações nativas de exec. O hook recebe `{ channel, channelLabel, accountId }`; canais com contas nomeadas devem renderizar caminhos com escopo por conta, como `channels.<channel>.accounts.<id>.execApprovals.*`, em vez de padrões de nível superior.
- Se um canal consegue inferir identidades estáveis semelhantes a proprietário em DMs a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica central específica de aprovação.
- Se um canal precisar de entrega nativa de aprovação, mantenha o código do canal focado em normalização de destino mais fatos de transporte/apresentação. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal atrás de `approvalCapability.nativeRuntime`, idealmente por meio de `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o núcleo possa montar o handler e controlar filtragem de requisição, roteamento, deduplicação, expiração, assinatura do Gateway e avisos de roteado para outro lugar. `nativeRuntime` foi dividido em algumas superfícies menores:
- `availability` — se a conta está configurada e se uma solicitação deve ser tratada
- `presentation` — mapeia o view model compartilhado de aprovação para payloads nativos pendentes/resolvidos/expirados ou ações finais
- `transport` — prepara destinos mais enviar/atualizar/excluir mensagens nativas de aprovação
- `interactions` — hooks opcionais de bind/unbind/clear-action para botões nativos ou reações
- `observe` — hooks opcionais de diagnóstico de entrega
- Se o canal precisar de objetos controlados pelo runtime, como um cliente, token, app Bolt ou receptor de Webhook, registre-os por meio de `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto de runtime permite que o núcleo inicialize handlers guiados por recursos a partir do estado de inicialização do canal sem adicionar cola de wrapper específica de aprovação.
- Recorra a `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de nível mais baixo apenas quando a superfície orientada por recursos ainda não for expressiva o suficiente.
- Canais de aprovação nativa devem rotear `accountId` e `approvalKind` por meio desses helpers. `accountId` mantém a política de aprovação em múltiplas contas delimitada para a conta correta do bot, e `approvalKind` mantém o comportamento de aprovação de exec versus Plugin disponível para o canal sem ramificações codificadas no núcleo.
- O núcleo agora também é responsável por avisos de redirecionamento de aprovação. Plugins de canal não devem enviar suas próprias mensagens de acompanhamento do tipo "a aprovação foi para DMs / outro canal" a partir de `createChannelNativeApprovalRuntime`; em vez disso, exponha roteamento preciso de origem + DM do aprovador por meio dos helpers compartilhados de recurso de aprovação e deixe o núcleo agregar as entregas reais antes de publicar qualquer aviso de volta ao chat iniciador.
- Preserve o tipo de id da aprovação entregue de ponta a ponta. Clientes nativos não devem
  adivinhar nem reescrever o roteamento de aprovação de exec versus Plugin a partir de estado local do canal.
- Tipos diferentes de aprovação podem expor intencionalmente superfícies nativas diferentes.
  Exemplos incluídos atuais:
  - O Slack mantém o roteamento nativo de aprovação disponível tanto para ids de exec quanto de Plugin.
  - O Matrix mantém o mesmo roteamento nativo para DM/canal e a mesma UX de reação para aprovações de exec
    e de Plugin, enquanto ainda permite que a autenticação difira por tipo de aprovação.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas novos códigos devem preferir o construtor de recurso e expor `approvalCapability` no Plugin.

Para pontos de entrada quentes de canal, prefira os subcaminhos de runtime mais restritos quando precisar apenas
de uma parte dessa família:

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
`openclaw/plugin-sdk/reply-chunking` quando você não precisar da superfície guarda-chuva mais ampla.

Para configuração especificamente:

- `openclaw/plugin-sdk/setup-runtime` cobre os helpers de configuração seguros para runtime:
  adaptadores de patch de configuração seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de observação de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os builders
  delegados de proxy de configuração
- `openclaw/plugin-sdk/setup-adapter-runtime` é a superfície estreita de adaptador com reconhecimento de env
  para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os builders de configuração para instalação opcional
  mais algumas primitivas seguras para configuração:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se o seu canal oferecer suporte a configuração ou autenticação guiada por env e os fluxos genéricos de inicialização/configuração
precisarem conhecer esses nomes de variáveis de ambiente antes do carregamento em runtime, declare-os no
manifesto do Plugin com `channelEnvVars`. Mantenha `envVars` do runtime do canal ou constantes locais
apenas para texto voltado ao operador.

Se o seu canal puder aparecer em `status`, `channels list`, `channels status` ou em varreduras de SecretRef antes de o runtime do Plugin iniciar, adicione `openclaw.setupEntry` em
`package.json`. Esse ponto de entrada deve ser seguro para importação em caminhos de comando somente leitura e deve retornar os metadados do canal, adaptador de configuração seguro, adaptador de status e metadados do alvo de segredos do canal necessários para esses resumos. Não inicie clientes, listeners ou runtimes de transporte a partir da entrada de configuração.

Mantenha estreito também o caminho de importação da entrada principal do canal. A descoberta pode avaliar a
entrada e o módulo do Plugin de canal para registrar recursos sem ativar o canal. Arquivos como `channel-plugin-api.ts` devem exportar o objeto do Plugin de canal sem importar assistentes de configuração, clientes de transporte, listeners de socket, inicializadores de subprocesso ou módulos de inicialização de serviço. Coloque essas peças de runtime em módulos carregados a partir de `registerFull(...)`, setters de runtime ou adaptadores lazy de recursos.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- use a superfície mais ampla `openclaw/plugin-sdk/setup` somente quando também precisar dos
  helpers mais pesados e compartilhados de configuração/setup, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal quiser apenas anunciar "instale este Plugin primeiro" em superfícies de configuração,
prefira `createOptionalChannelSetupSurface(...)`. O
adaptador/assistente gerado falha de forma fail-closed em gravações de configuração e finalização, e reutiliza
a mesma mensagem de instalação obrigatória em validação, finalização e texto de link para documentação.

Para outros caminhos quentes de canal, prefira os helpers mais restritos em vez das superfícies legadas mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração com múltiplas contas e
  fallback de conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` para envelope/rota de entrada e
  conexão de registrar e despachar
- `openclaw/plugin-sdk/messaging-targets` para análise/correspondência de destino
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` para carregamento de mídia mais
  delegados de identidade/envio de saída e planejamento de payload
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` quando uma rota de saída deve preservar um
  `replyToId`/`threadId` explícito ou recuperar a sessão atual `:thread:`
  depois que a chave base da sessão ainda corresponder. Plugins de provedor podem substituir
  precedência, comportamento de sufixo e normalização de id de thread quando sua plataforma
  tiver semântica nativa de entrega em thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de vinculação de thread
  e registro de adaptador
- `openclaw/plugin-sdk/agent-media-payload` somente quando um layout legado de campo de payload de agente/mídia ainda for necessário
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comando personalizado do Telegram,
  validação de duplicatas/conflitos e um contrato de configuração de comando estável para fallback

Canais apenas de autenticação normalmente podem parar no caminho padrão: o núcleo trata aprovações e o Plugin apenas expõe recursos de saída/autenticação. Canais de aprovação nativa, como Matrix, Slack, Telegram e transportes de chat personalizados, devem usar os helpers nativos compartilhados em vez de criar seu próprio ciclo de vida de aprovação.

## Política de menção de entrada

Mantenha o tratamento de menção de entrada dividido em duas camadas:

- coleta de evidências de responsabilidade do Plugin
- avaliação compartilhada da política

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões de política de menção.
Use `openclaw/plugin-sdk/channel-inbound` somente quando precisar do barrel
mais amplo de helpers de entrada.

Adequado para lógica local do Plugin:

- detecção de resposta ao bot
- detecção de citação do bot
- verificações de participação em thread
- exclusões de mensagens de serviço/sistema
- caches nativos da plataforma necessários para provar participação do bot

Adequado para o helper compartilhado:

- `requireMention`
- resultado explícito de menção
- allowlist implícita de menção
- bypass de comando
- decisão final de ignorar

Fluxo preferido:

1. Calcule fatos locais de menção.
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
Plugins de canal incluídos que já dependem de injeção em runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se você precisar apenas de `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importe de
`openclaw/plugin-sdk/channel-mention-gating` para evitar carregar helpers de runtime
de entrada não relacionados.

Os helpers antigos `resolveMentionGating*` permanecem em
`openclaw/plugin-sdk/channel-inbound` apenas como exportações de compatibilidade. Código novo
deve usar `resolveInboundMentionDecision({ facts, policy })`.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do Plugin. O campo `channel` em `package.json` é
    o que torna este um Plugin de canal. Para a superfície completa de metadados do pacote,
    consulte [Setup e configuração de Plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

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
    configurações controladas pelo Plugin que não sejam a configuração da conta do canal. `channelConfigs`
    valida `channels.acme-chat` e é a fonte do caminho frio usada por schema de configuração,
    setup e superfícies de UI antes que o runtime do Plugin seja carregado.

  </Step>

  <Step title="Crie o objeto do Plugin de canal">
    A interface `ChannelPlugin` tem muitas superfícies opcionais de adaptador. Comece com
    o mínimo — `id` e `setup` — e adicione adaptadores conforme precisar.

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

      // Segurança de DM: quem pode mandar mensagem ao bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Emparelhamento: fluxo de aprovação para novos contatos por DM
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Encadeamento: como as respostas são entregues
      threading: { topLevelReplyToMode: "reply" },

      // Saída: enviar mensagens para a plataforma
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

    <Accordion title="O que createChatChannelPlugin faz por você">
      Em vez de implementar interfaces de adaptador de baixo nível manualmente, você passa
      opções declarativas e o builder as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de DM com escopo a partir de campos de configuração |
      | `pairing.text` | Fluxo de emparelhamento por DM baseado em texto com troca de código |
      | `threading` | Resolvedor de modo de resposta (fixo, com escopo por conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados de resultado (IDs de mensagem) |

      Você também pode passar objetos brutos de adaptador em vez das opções declarativas
      se precisar de controle total.

      Adaptadores brutos de saída podem definir uma função `chunker(text, limit, ctx)`.
      O `ctx.formatting` opcional carrega decisões de formatação em tempo de entrega
      como `maxLinesPerMessage`; aplique-o antes do envio para que o encadeamento de resposta
      e os limites de blocos sejam resolvidos uma única vez pela entrega compartilhada de saída.
      Contextos de envio também incluem `replyToIdSource` (`implicit` ou `explicit`)
      quando um destino nativo de resposta foi resolvido, para que helpers de payload possam preservar
      tags explícitas de resposta sem consumir um slot implícito de uso único de resposta.
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

    Coloque descritores de CLI controlados pelo canal em `registerCliMetadata(...)` para que o OpenClaw
    possa mostrá-los na ajuda raiz sem ativar o runtime completo do canal,
    enquanto carregamentos completos normais ainda capturam os mesmos descritores para o registro real de comandos.
    Mantenha `registerFull(...)` para trabalho exclusivo de runtime.
    Se `registerFull(...)` registrar métodos RPC do Gateway, use um
    prefixo específico do Plugin. Namespaces administrativos centrais (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    são resolvidos para `operator.admin`.
    `defineChannelPluginEntry` trata automaticamente a divisão de modo de registro. Consulte
    [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para todas as
    opções.

  </Step>

  <Step title="Adicione uma entrada de setup">
    Crie `setup-entry.ts` para carregamento leve durante o onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega isso em vez da entrada completa quando o canal está desabilitado
    ou não configurado. Isso evita puxar código pesado de runtime durante fluxos de setup.
    Consulte [Setup e configuração](/pt-BR/plugins/sdk-setup#setup-entry) para detalhes.

    Canais incluídos do workspace que dividem exportações seguras para setup em módulos
    sidecar podem usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisarem de um
    setter explícito de runtime em tempo de setup.

  </Step>

  <Step title="Trate mensagens de entrada">
    Seu Plugin precisa receber mensagens da plataforma e encaminhá-las para o
    OpenClaw. O padrão típico é um Webhook que verifica a requisição e a
    despacha pelo handler de entrada do seu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticação gerenciada pelo plugin (verifique as assinaturas você mesmo)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Seu handler de entrada despacha a mensagem para o OpenClaw.
          // A conexão exata depende do SDK da sua plataforma —
          // veja um exemplo real no pacote de plugin incluído do Microsoft Teams ou do Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      O tratamento de mensagens de entrada é específico de cada canal. Cada Plugin de canal
      é responsável por seu próprio pipeline de entrada. Observe Plugins de canal incluídos
      (por exemplo o pacote de plugin do Microsoft Teams ou do Google Chat) para padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Teste">
Escreva testes colocados junto em `src/channel.test.ts`:

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

    Para helpers de teste compartilhados, consulte [Testing](/pt-BR/plugins/sdk-testing).

  </Step>
</Steps>

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadados openclaw.channel
├── openclaw.plugin.json      # Manifesto com schema de configuração
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
  <Card title="Integração com a ferramenta de mensagem" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ação
  </Card>
  <Card title="Resolução de destino" icon="crosshair" href="/pt-BR/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia, subagente via api.runtime
  </Card>
</CardGroup>

<Note>
Algumas superfícies auxiliares incluídas ainda existem para manutenção e
compatibilidade de Plugins incluídos. Elas não são o padrão recomendado para novos Plugins de canal;
prefira os subcaminhos genéricos de channel/setup/reply/runtime da
superfície comum do SDK, a menos que você esteja mantendo diretamente essa família de Plugins incluídos.
</Note>

## Próximos passos

- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — se o seu Plugin também fornecer modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subcaminho
- [SDK Testing](/pt-BR/plugins/sdk-testing) — utilitários de teste e testes de contrato
- [Manifesto do Plugin](/pt-BR/plugins/manifest) — schema completo do manifesto

## Relacionado

- [Setup do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
