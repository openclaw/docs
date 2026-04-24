---
read_when:
    - Você está criando um novo plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um plugin de canal de mensagens para o OpenClaw
title: Criar plugins de canal
x-i18n:
    generated_at: "2026-04-24T06:03:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Este guia mostra como criar um plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança
para DM, pareamento, encadeamento de respostas e envio de mensagens.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw, leia primeiro
  [Primeiros passos](/pt-BR/plugins/building-plugins) para a estrutura básica do pacote
  e a configuração do manifesto.
</Info>

## Como funcionam plugins de canal

Plugins de canal não precisam de suas próprias ferramentas de enviar/editar/reagir. O OpenClaw mantém uma
única ferramenta `message` compartilhada no core. Seu plugin controla:

- **Configuração** — resolução de conta e assistente de configuração
- **Segurança** — política de DM e allowlists
- **Pareamento** — fluxo de aprovação de DM
- **Gramática de sessão** — como ids de conversa específicos do provider são mapeados para chats base, ids de thread e fallbacks de pai
- **Saída** — envio de texto, mídia e polls para a plataforma
- **Encadeamento** — como respostas são encadeadas
- **Typing do Heartbeat** — sinais opcionais de digitando/ocupado para destinos de entrega do Heartbeat

O core controla a ferramenta `message` compartilhada, o wiring de prompt, o formato externo da chave de sessão,
a contabilidade genérica de `:thread:` e o despacho.

Se o seu canal oferecer suporte a indicadores de digitando fora de respostas recebidas,
exponha `heartbeat.sendTyping(...)` no plugin de canal. O core o chama com o
destino de entrega do Heartbeat resolvido antes de a execução do modelo de Heartbeat começar e
usa o ciclo de vida compartilhado de keepalive/cleanup de typing. Adicione `heartbeat.clearTyping(...)`
quando a plataforma precisar de um sinal explícito de parada.

Se o seu canal adicionar parâmetros da ferramenta de mensagem que carreguem fontes de mídia, exponha esses
nomes de parâmetro por meio de `describeMessageTool(...).mediaSourceParams`. O core usa
essa lista explícita para normalização de caminho de sandbox e política de acesso a mídia de saída,
de modo que plugins não precisem de casos especiais no core compartilhado para parâmetros
específicos de provider, como avatar, anexo ou imagem de capa.
Prefira retornar um mapa indexado por ação, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que ações não relacionadas não
herdem argumentos de mídia de outra ação. Um array plano ainda funciona para parâmetros
que são intencionalmente compartilhados entre todas as ações expostas.

Se a sua plataforma armazenar escopo extra dentro de ids de conversa, mantenha esse parse
no plugin com `messaging.resolveSessionConversation(...)`. Esse é o hook canônico para
mapear `rawId` para o id da conversa base, id opcional da thread,
`baseConversationId` explícito e quaisquer `parentConversationCandidates`.
Quando você retornar `parentConversationCandidates`, mantenha-os ordenados do
pai mais específico para a conversa base/mais ampla.

Plugins empacotados que precisam do mesmo parse antes de o registro de canais ser inicializado
também podem expor um arquivo `session-key-api.ts` de nível superior com um
export correspondente `resolveSessionConversation(...)`. O core usa essa superfície
segura para bootstrap apenas quando o registro de plugins em runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` continua disponível como fallback
legado de compatibilidade quando um plugin precisa apenas de fallbacks de pai sobre
o id genérico/bruto. Se ambos os hooks existirem, o core usa
`resolveSessionConversation(...).parentConversationCandidates` primeiro e só
usa fallback para `resolveParentConversationCandidates(...)` quando o hook canônico
os omite.

## Aprovações e recursos de canal

A maioria dos plugins de canal não precisa de código específico de aprovação.

- O core controla `/approve` no mesmo chat, payloads compartilhados de botão de aprovação e entrega genérica de fallback.
- Prefira um único objeto `approvalCapability` no plugin de canal quando o canal precisar de comportamento específico de aprovação.
- `ChannelPlugin.approvals` foi removido. Coloque fatos de entrega/renderização/autenticação/nativo em `approvalCapability`.
- `plugin.auth` é apenas para login/logout; o core não lê mais hooks de autenticação de aprovação desse objeto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são a seam canônica de autenticação de aprovação.
- Use `approvalCapability.getActionAvailabilityState` para disponibilidade de autenticação de aprovação no mesmo chat.
- Se o seu canal expuser aprovações nativas de exec, use `approvalCapability.getExecInitiatingSurfaceState` para o estado da superfície iniciadora/cliente nativo quando ele diferir da autenticação de aprovação no mesmo chat. O core usa esse hook específico de exec para distinguir `enabled` de `disabled`, decidir se o canal iniciador oferece suporte a aprovações nativas de exec e incluir o canal em orientações de fallback de cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` preenche isso para o caso comum.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento de ciclo de vida de payload específico do canal, como ocultar prompts locais duplicados de aprovação ou enviar indicadores de digitando antes da entrega.
- Use `approvalCapability.delivery` apenas para roteamento nativo de aprovação ou supressão de fallback.
- Use `approvalCapability.nativeRuntime` para fatos nativos de aprovação controlados pelo canal. Mantenha-o lazy em pontos de entrada quentes do canal com `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que pode importar seu módulo de runtime sob demanda enquanto ainda permite ao core montar o ciclo de vida de aprovação.
- Use `approvalCapability.render` apenas quando um canal realmente precisar de payloads de aprovação personalizados em vez do renderizador compartilhado.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que a resposta do caminho desativado explique os knobs exatos de configuração necessários para ativar aprovações nativas de exec. O hook recebe `{ channel, channelLabel, accountId }`; canais com contas nomeadas devem renderizar caminhos com escopo de conta, como `channels.<channel>.accounts.<id>.execApprovals.*`, em vez de padrões de nível superior.
- Se um canal puder inferir identidades estáveis do tipo proprietário em DM a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica específica de aprovação ao core.
- Se um canal precisar de entrega nativa de aprovação, mantenha o código do canal focado em normalização de destino e fatos de transporte/apresentação. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal atrás de `approvalCapability.nativeRuntime`, idealmente via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o core possa montar o handler e controlar filtragem de requisições, roteamento, dedupe, expiração, assinatura do gateway e avisos de roteado-para-outro-lugar. `nativeRuntime` é dividido em algumas seams menores:
- `availability` — se a conta está configurada e se uma requisição deve ser tratada
- `presentation` — mapeia o modelo de visão de aprovação compartilhada para payloads nativos pendente/resolvido/expirado ou ações finais
- `transport` — prepara destinos e envia/atualiza/exclui mensagens nativas de aprovação
- `interactions` — hooks opcionais de bind/unbind/clear-action para botões ou reações nativos
- `observe` — hooks opcionais de diagnóstico de entrega
- Se o canal precisar de objetos controlados pelo runtime, como cliente, token, app Bolt ou receptor de Webhook, registre-os por meio de `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto de runtime permite que o core inicialize handlers orientados a recursos a partir do estado de inicialização do canal sem adicionar glue de wrapper específico de aprovação.
- Recorra ao `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de nível mais baixo apenas quando a seam orientada a recursos ainda não for suficientemente expressiva.
- Canais de aprovação nativa devem rotear `accountId` e `approvalKind` por esses helpers. `accountId` mantém a política de aprovação com múltiplas contas restrita à conta correta do bot, e `approvalKind` mantém disponível ao canal o comportamento de aprovação exec vs plugin sem ramificações codificadas no core.
- O core agora também controla avisos de redirecionamento de aprovação. Plugins de canal não devem enviar suas próprias mensagens de acompanhamento do tipo "a aprovação foi para DMs / outro canal" a partir de `createChannelNativeApprovalRuntime`; em vez disso, exponha roteamento preciso de origem + DM do aprovador por meio dos helpers compartilhados de recurso de aprovação e deixe o core agregar as entregas reais antes de publicar qualquer aviso de volta no chat iniciador.
- Preserve o tipo de id de aprovação entregue de ponta a ponta. Clientes nativos não devem adivinhar
  nem reescrever o roteamento de aprovação exec vs plugin com base em estado local do canal.
- Tipos diferentes de aprovação podem intencionalmente expor superfícies nativas diferentes.
  Exemplos empacotados atuais:
  - Slack mantém o roteamento nativo de aprovação disponível tanto para ids de exec quanto de plugin.
  - Matrix mantém o mesmo roteamento nativo de DM/canal e UX de reação para aprovações exec
    e de plugin, ainda permitindo que a autenticação difira por tipo de aprovação.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas código novo deve preferir o construtor de recursos e expor `approvalCapability` no plugin.

Para pontos de entrada quentes do canal, prefira os subcaminhos de runtime mais estreitos quando você
precisar apenas de uma parte dessa família:

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
mais ampla de umbrella.

Para setup especificamente:

- `openclaw/plugin-sdk/setup-runtime` cobre os helpers de setup seguros para runtime:
  adaptadores de patch de setup seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de nota de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os builders
  delegados de setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` é a seam estreita de adaptador
  com reconhecimento de env para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os builders opcionais de setup de instalação
  mais alguns primitivos seguros de setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se o seu canal oferecer suporte a setup ou autenticação orientados por env e fluxos genéricos de inicialização/configuração
precisarem conhecer esses nomes de env antes de o runtime carregar, declare-os no
manifesto do plugin com `channelEnvVars`. Mantenha `envVars` de runtime do canal ou constantes
locais apenas para texto voltado ao operador.

Se o seu canal puder aparecer em `status`, `channels list`, `channels status` ou varreduras de SecretRef antes de o runtime do plugin iniciar, adicione `openclaw.setupEntry` em
`package.json`. Esse ponto de entrada deve ser seguro para importação em caminhos de comando somente leitura e deve retornar os metadados do canal, adaptador de configuração seguro para setup, adaptador de status e metadados de destinos secretos do canal necessários para esses resumos. Não inicie clientes, listeners ou runtimes de transporte a partir da entrada de setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- use a seam mais ampla `openclaw/plugin-sdk/setup` apenas quando você também precisar dos
  helpers compartilhados mais pesados de setup/configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal só quiser anunciar “instale primeiro este Plugin” em superfícies de setup,
prefira `createOptionalChannelSetupSurface(...)`. O adaptador/assistente gerado
falha de forma fechada em gravações de configuração e finalização, e reutiliza
a mesma mensagem de instalação obrigatória em validação, finalização e texto de link de documentação.

Para outros caminhos quentes de canal, prefira os helpers estreitos em vez de superfícies legadas mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração de múltiplas contas e
  fallback de conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` para wiring de rota/envelope de entrada e
  gravar-e-despachar
- `openclaw/plugin-sdk/messaging-targets` para parse/correspondência de destino
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` para carregamento de mídia mais
  delegados de identidade/envio de saída e planejamento de payload
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` quando uma rota de saída deve preservar um
  `replyToId`/`threadId` explícito ou recuperar a sessão atual `:thread:`
  depois que a chave de sessão base ainda corresponder. Plugins de provider podem substituir
  precedência, comportamento de sufixo e normalização de id de thread quando sua plataforma
  tiver semântica nativa de entrega por thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de thread-binding
  e registro de adaptador
- `openclaw/plugin-sdk/agent-media-payload` apenas quando um layout legado de campo de payload de agente/mídia ainda for necessário
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comando personalizado do Telegram, validação de duplicata/conflito e um contrato de configuração de comando estável para fallback

Canais somente com autenticação geralmente podem parar no caminho padrão: o core trata aprovações e o plugin apenas expõe recursos de saída/autenticação. Canais de aprovação nativa como Matrix, Slack, Telegram e transportes de chat personalizados devem usar os helpers nativos compartilhados em vez de criar seu próprio ciclo de vida de aprovação.

## Política de menção de entrada

Mantenha o tratamento de menção de entrada dividido em duas camadas:

- coleta de evidências controlada pelo plugin
- avaliação compartilhada da política

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões de política de menção.
Use `openclaw/plugin-sdk/channel-inbound` apenas quando precisar do barrel mais amplo
de helper de entrada.

Bom encaixe para lógica local do plugin:

- detecção de resposta ao bot
- detecção de citação do bot
- verificações de participação em thread
- exclusões de mensagem de serviço/sistema
- caches nativos da plataforma necessários para comprovar participação do bot

Bom encaixe para o helper compartilhado:

- `requireMention`
- resultado explícito de menção
- allowlist implícita de menção
- bypass de comando
- decisão final de ignorar

Fluxo preferido:

1. Compute fatos locais de menção.
2. Passe esses fatos para `resolveInboundMentionDecision({ facts, policy })`.
3. Use `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` no seu bloqueio de entrada.

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
plugins de canal empacotados que já dependem de injeção em runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se você só precisar de `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importe de
`openclaw/plugin-sdk/channel-mention-gating` para evitar carregar helpers
de runtime de entrada não relacionados.

Os helpers mais antigos `resolveMentionGating*` permanecem em
`openclaw/plugin-sdk/channel-inbound` apenas como exports de compatibilidade. Código novo
deve usar `resolveInboundMentionDecision({ facts, policy })`.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do plugin. O campo `channel` em `package.json` é
    o que torna este um plugin de canal. Para a superfície completa de metadados de pacote,
    consulte [Configuração e setup de Plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

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
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin de canal Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Crie o objeto do plugin de canal">
    A interface `ChannelPlugin` tem muitas superfícies opcionais de adaptador. Comece com
    o mínimo — `id` e `setup` — e adicione adaptadores conforme precisar.

    Crie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // seu cliente de API da plataforma

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

      // Segurança de DM: quem pode enviar mensagem ao bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pareamento: fluxo de aprovação para novos contatos em DM
      pairing: {
        text: {
          idLabel: "nome de usuário do Acme Chat",
          message: "Envie este código para verificar sua identidade:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Encadeamento: como respostas são entregues
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
      | `security.dm` | resolvedor de segurança de DM com escopo a partir de campos de configuração |
      | `pairing.text` | fluxo de pareamento de DM baseado em texto com troca de código |
      | `threading` | resolvedor de modo de resposta (fixo, com escopo de conta ou personalizado) |
      | `outbound.attachedResults` | funções de envio que retornam metadados de resultado (IDs de mensagem) |

      Você também pode passar objetos brutos de adaptador em vez das opções declarativas
      se precisar de controle total.
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
      description: "Plugin de canal Acme Chat",
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

    Coloque descritores de CLI controlados pelo canal em `registerCliMetadata(...)` para que o OpenClaw
    possa mostrá-los na ajuda raiz sem ativar o runtime completo do canal,
    enquanto carregamentos completos normais ainda incorporam os mesmos descritores para registro real de comando. Mantenha `registerFull(...)` para trabalho apenas de runtime.
    Se `registerFull(...)` registrar métodos RPC do gateway, use um
    prefixo específico do plugin. Namespaces administrativos do core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    resolvem para `operator.admin`.
    `defineChannelPluginEntry` trata automaticamente a divisão de modos de registro. Consulte
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

    O OpenClaw carrega isso em vez da entrada completa quando o canal está desativado
    ou não configurado. Isso evita puxar código pesado de runtime durante fluxos de setup.
    Consulte [Setup e configuração](/pt-BR/plugins/sdk-setup#setup-entry) para detalhes.

    Canais empacotados de workspace que dividem exports seguros para setup em módulos auxiliares
    podem usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisarem de um
    setter explícito de runtime em tempo de setup.

  </Step>

  <Step title="Trate mensagens recebidas">
    Seu plugin precisa receber mensagens da plataforma e encaminhá-las ao
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
          // veja um exemplo real no pacote de Plugin empacotado do Microsoft Teams ou Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      O tratamento de mensagens recebidas é específico do canal. Cada plugin de canal controla
      seu próprio pipeline de entrada. Veja plugins de canal empacotados
      (por exemplo o pacote de Plugin do Microsoft Teams ou Google Chat) para padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testar">
Escreva testes colocados junto em `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("resolve account from config", () => {
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
├── openclaw.plugin.json      # Manifesto com schema de configuração
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exports públicos (opcional)
├── runtime-api.ts            # Exports internos de runtime (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Testes
    ├── client.ts             # Cliente de API da plataforma
    └── runtime.ts            # Armazenamento de runtime (se necessário)
```

## Tópicos avançados

<CardGroup cols={2}>
  <Card title="Opções de encadeamento" icon="git-branch" href="/pt-BR/plugins/sdk-entrypoints#registration-mode">
    Modos de resposta fixos, com escopo de conta ou personalizados
  </Card>
  <Card title="Integração da ferramenta de mensagem" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
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
Algumas seams auxiliares empacotadas ainda existem para manutenção e
compatibilidade de plugins empacotados. Elas não são o padrão recomendado para novos plugins de canal;
prefira os subcaminhos genéricos de channel/setup/reply/runtime da superfície
comum do SDK, a menos que você esteja mantendo diretamente essa família de plugins empacotados.
</Note>

## Próximos passos

- [Plugins de Provider](/pt-BR/plugins/sdk-provider-plugins) — se seu plugin também fornece modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subcaminho
- [Testes do SDK](/pt-BR/plugins/sdk-testing) — utilitários de teste e testes de contrato
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — schema completo do manifesto

## Relacionado

- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criar plugins](/pt-BR/plugins/building-plugins)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
