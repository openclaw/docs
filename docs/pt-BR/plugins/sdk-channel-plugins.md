---
read_when:
    - Você está criando um novo plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície de adaptador do ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um plugin de canal de mensagens para o OpenClaw
title: Criando plugins de canal
x-i18n:
    generated_at: "2026-04-06T03:09:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66b52c10945a8243d803af3bf7e1ea0051869ee92eda2af5718d9bb24fbb8552
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Criando plugins de canal

Este guia mostra como criar um plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança de DM,
pairing, encadeamento de respostas e mensagens de saída.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw, leia primeiro
  [Getting Started](/pt-BR/plugins/building-plugins) para ver a estrutura básica do
  pacote e a configuração do manifesto.
</Info>

## Como os plugins de canal funcionam

Plugins de canal não precisam das próprias ferramentas de enviar/editar/reagir. O OpenClaw mantém uma
ferramenta `message` compartilhada no core. Seu plugin controla:

- **Configuração** — resolução de conta e assistente de configuração
- **Segurança** — política de DM e allowlists
- **Pairing** — fluxo de aprovação de DM
- **Gramática de sessão** — como IDs de conversa específicos do provedor são mapeados para chats base, IDs de thread e fallbacks pai
- **Saída** — envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** — como as respostas são encadeadas

O core controla a ferramenta de mensagem compartilhada, a ligação do prompt, o formato externo da chave de sessão,
o bookkeeping genérico de `:thread:` e o dispatch.

Se sua plataforma armazena escopo extra dentro dos IDs de conversa, mantenha esse parsing
no plugin com `messaging.resolveSessionConversation(...)`. Esse é o hook canônico para mapear
`rawId` para o ID da conversa base, ID de thread opcional,
`baseConversationId` explícito e quaisquer `parentConversationCandidates`.
Ao retornar `parentConversationCandidates`, mantenha-os ordenados do pai
mais específico para a conversa pai/base mais ampla.

Plugins empacotados que precisam do mesmo parsing antes de o registro de canais iniciar
também podem expor um arquivo `session-key-api.ts` de nível superior com uma exportação correspondente
`resolveSessionConversation(...)`. O core usa essa superfície segura para bootstrap
apenas quando o registro de plugins em runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` continua disponível como
fallback legado de compatibilidade quando um plugin só precisa de fallbacks pai
sobre o id genérico/raw. Se ambos os hooks existirem, o core usa primeiro
`resolveSessionConversation(...).parentConversationCandidates` e só
recorre a `resolveParentConversationCandidates(...)` quando o hook canônico
os omite.

## Aprovações e capacidades do canal

A maioria dos plugins de canal não precisa de código específico de aprovação.

- O core controla `/approve` no mesmo chat, payloads compartilhados de botão de aprovação e entrega genérica de fallback.
- Prefira um único objeto `approvalCapability` no plugin de canal quando o canal precisar de comportamento específico de aprovação.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são a interface canônica de autenticação de aprovação.
- Se seu canal expõe aprovações nativas de exec, implemente `approvalCapability.getActionAvailabilityState` mesmo quando o transporte nativo existir inteiramente em `approvalCapability.native`. O core usa esse hook de disponibilidade para distinguir `enabled` de `disabled`, decidir se o canal iniciador oferece suporte a aprovações nativas e incluir o canal na orientação de fallback de cliente nativo.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento específico do canal no ciclo de vida do payload, como ocultar prompts locais duplicados de aprovação ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.delivery` apenas para roteamento nativo de aprovação ou supressão de fallback.
- Use `approvalCapability.render` apenas quando um canal realmente precisar de payloads de aprovação personalizados em vez do renderizador compartilhado.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que a resposta no caminho desativado explique os knobs exatos de configuração necessários para ativar aprovações nativas de exec. O hook recebe `{ channel, channelLabel, accountId }`; canais com conta nomeada devem renderizar caminhos com escopo de conta, como `channels.<channel>.accounts.<id>.execApprovals.*`, em vez de padrões de nível superior.
- Se um canal puder inferir identidades estáveis semelhantes a proprietários em DM a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica de core específica de aprovação.
- Se um canal precisar de entrega nativa de aprovação, mantenha o código do canal focado em normalização de destino e hooks de transporte. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` e `createChannelNativeApprovalRuntime` de `openclaw/plugin-sdk/approval-runtime` para que o core controle filtragem de requisição, roteamento, deduplicação, expiração e assinatura do gateway.
- Canais com aprovação nativa devem rotear `accountId` e `approvalKind` por esses helpers. `accountId` mantém a política de aprovação multicuenta no escopo da conta correta do bot, e `approvalKind` mantém o comportamento de aprovação de exec versus plugin disponível ao canal sem ramificações codificadas diretamente no core.
- Preserve de ponta a ponta o tipo de ID de aprovação entregue. Clientes nativos não devem adivinhar
  nem reescrever o roteamento de aprovação de exec versus plugin a partir do estado local do canal.
- Diferentes tipos de aprovação podem expor propositalmente diferentes superfícies nativas.
  Exemplos empacotados atuais:
  - O Slack mantém o roteamento nativo de aprovação disponível tanto para IDs de exec quanto de plugin.
  - O Matrix mantém o roteamento nativo de DM/canal apenas para aprovações de exec e deixa
    aprovações de plugin no caminho compartilhado `/approve` no mesmo chat.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas o código novo deve preferir o construtor de capacidade e expor `approvalCapability` no plugin.

Para entrypoints quentes de canal, prefira os subcaminhos de runtime mais restritos quando precisar
apenas de uma parte dessa família:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Da mesma forma, prefira `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando você não precisar da
superfície guarda-chuva mais ampla.

Especificamente para setup:

- `openclaw/plugin-sdk/setup-runtime` cobre os helpers de setup seguros para runtime:
  adaptadores de patch de setup seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de nota de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os builders
  delegados de proxy de setup
- `openclaw/plugin-sdk/setup-adapter-runtime` é a interface estreita de adaptador
  com reconhecimento de env para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os builders de setup com instalação opcional
  mais alguns primitivos seguros para setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
  `splitSetupEntries`
- use a interface mais ampla `openclaw/plugin-sdk/setup` apenas quando também precisar dos
  helpers compartilhados mais pesados de setup/configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal só quiser anunciar "instale este plugin primeiro" em superfícies de setup,
prefira `createOptionalChannelSetupSurface(...)`. O adaptador/assistente gerado falha de forma fechada em gravações de configuração e finalização, e reutiliza a mesma mensagem de instalação obrigatória em validação, finalize e cópia de link de documentação.

Para outros caminhos quentes de canal, prefira os helpers estreitos em vez das superfícies legadas mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração multicuenta e
  fallback de conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` para ligação de rota/envelope de entrada e
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` para parsing/correspondência de destino
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` para carregamento de mídia mais delegados de identidade/envio
  de saída
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de vínculos de thread
  e registro de adaptador
- `openclaw/plugin-sdk/agent-media-payload` apenas quando ainda for necessário um layout legado
  de campo de payload de agente/mídia
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comando custom do Telegram, validação de duplicatas/conflitos e um contrato de configuração de comando com fallback estável

Canais somente de autenticação normalmente podem ficar no caminho padrão: o core lida com aprovações e o plugin apenas expõe capacidades de saída/autenticação. Canais com aprovação nativa, como Matrix, Slack, Telegram e transportes de chat custom, devem usar os helpers nativos compartilhados em vez de criar o próprio ciclo de vida de aprovação.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do plugin. O campo `channel` em `package.json` é
    o que torna este um plugin de canal. Para a superfície completa de metadados
    do pacote, consulte [Plugin Setup and Config](/pt-BR/plugins/sdk-setup#openclawchannel):

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
    o mínimo — `id` e `setup` — e adicione adaptadores conforme necessário.

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

    <Accordion title="O que `createChatChannelPlugin` faz por você">
      Em vez de implementar manualmente interfaces de adaptador de baixo nível, você passa
      opções declarativas e o builder as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de DM com escopo a partir de campos de configuração |
      | `pairing.text` | Fluxo de pairing de DM baseado em texto com troca de código |
      | `threading` | Resolvedor de modo reply-to (fixo, com escopo de conta ou custom) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados de resultado (IDs de mensagem) |

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
    enquanto carregamentos completos normais ainda capturam os mesmos descritores para o registro real
    de comandos. Mantenha `registerFull(...)` para trabalho exclusivo de runtime.
    Se `registerFull(...)` registrar métodos RPC do gateway, use um
    prefixo específico do plugin. Namespaces administrativos do core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    são resolvidos para `operator.admin`.
    `defineChannelPluginEntry` lida automaticamente com a divisão de modo de registro. Consulte
    [Entry Points](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para todas as
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
    Consulte [Setup and Config](/pt-BR/plugins/sdk-setup#setup-entry) para detalhes.

  </Step>

  <Step title="Trate mensagens de entrada">
    Seu plugin precisa receber mensagens da plataforma e encaminhá-las para o
    OpenClaw. O padrão típico é um webhook que verifica a requisição e
    a despacha por meio do handler de entrada do seu canal:

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
      O tratamento de mensagens de entrada é específico do canal. Cada plugin de canal controla
      o próprio pipeline de entrada. Veja plugins de canal empacotados
      (por exemplo, o pacote de plugin Microsoft Teams ou Google Chat) para padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Teste">
Escreva testes colocados ao lado em `src/channel.test.ts`:

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
    Modos de resposta fixos, com escopo de conta ou custom
  </Card>
  <Card title="Integração da ferramenta de mensagem" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Resolução de destino" icon="crosshair" href="/pt-BR/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia, subagent via api.runtime
  </Card>
</CardGroup>

<Note>
Algumas interfaces auxiliares empacotadas ainda existem para manutenção de plugin empacotado e
compatibilidade. Elas não são o padrão recomendado para novos plugins de canal;
prefira os subcaminhos genéricos de channel/setup/reply/runtime da superfície comum do SDK,
a menos que você esteja mantendo diretamente essa família de plugins empacotados.
</Note>

## Próximos passos

- [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) — se seu plugin também fornecer modelos
- [SDK Overview](/pt-BR/plugins/sdk-overview) — referência completa de importação de subcaminhos
- [SDK Testing](/pt-BR/plugins/sdk-testing) — utilitários de teste e testes de contrato
- [Plugin Manifest](/pt-BR/plugins/manifest) — schema completo do manifesto
