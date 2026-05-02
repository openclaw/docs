---
read_when:
    - Você quer criar um novo Plugin do OpenClaw
    - Você precisa de um guia de início rápido para desenvolvimento de Plugin
    - Você está adicionando um novo canal, provedor, ferramenta ou outra capacidade ao OpenClaw
sidebarTitle: Getting Started
summary: Crie seu primeiro Plugin do OpenClaw em minutos
title: Criando plugins
x-i18n:
    generated_at: "2026-05-02T05:51:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins ampliam o OpenClaw com novas capacidades: canais, provedores de modelo,
fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração
de imagens, geração de vídeo, busca de página web, pesquisa na web, ferramentas de
agente ou qualquer combinação.

Você não precisa adicionar seu Plugin ao repositório do OpenClaw. Publique no
[ClawHub](/pt-BR/tools/clawhub) e os usuários instalam com
`openclaw plugins install <package-name>`. O OpenClaw tenta o ClawHub primeiro e
recorre automaticamente ao npm para pacotes que ainda usam distribuição por npm.

## Pré-requisitos

- Node >= 22 e um gerenciador de pacotes (npm ou pnpm)
- Familiaridade com TypeScript (ESM)
- Para Plugins no repositório: repositório clonado e `pnpm install` concluído. O
  desenvolvimento de Plugins a partir do checkout do código-fonte é exclusivo do pnpm porque o OpenClaw carrega
  Plugins incluídos nos pacotes de workspace `extensions/*`.

## Que tipo de Plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens (Discord, IRC etc.)
  </Card>
  <Card title="Plugin de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um provedor de modelo (LLM, proxy ou endpoint personalizado)
  </Card>
  <Card title="Plugin de ferramenta / gancho" icon="wrench" href="/pt-BR/plugins/hooks">
    Registre ferramentas de agente, ganchos de evento ou serviços — continue abaixo
  </Card>
</CardGroup>

Para um Plugin de canal cuja instalação não é garantida quando o onboarding/configuração
é executado, use `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Ele produz um par adaptador de configuração + assistente
que informa o requisito de instalação e falha de modo fechado em gravações reais de configuração
até que o Plugin esteja instalado.

## Início rápido: Plugin de ferramenta

Este passo a passo cria um Plugin mínimo que registra uma ferramenta de agente. Plugins de canal
e de provedor têm guias dedicados vinculados acima.

<Steps>
  <Step title="Crie o pacote e o manifesto">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Todo Plugin precisa de um manifesto, mesmo sem configuração. Ferramentas registradas em runtime
    devem ser listadas em `contracts.tools` para que o OpenClaw possa descobrir o
    Plugin proprietário sem carregar o runtime de todos os Plugins. Plugins também devem declarar
    `activation.onStartup` intencionalmente. Este exemplo define como `true`. Consulte
    [Manifesto](/pt-BR/plugins/manifest) para ver o esquema completo. Os snippets canônicos de publicação no ClawHub
    ficam em `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Escreva o ponto de entrada">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` é para Plugins que não são de canal. Para canais, use
    `defineChannelPluginEntry` — consulte [Plugins de Canal](/pt-BR/plugins/sdk-channel-plugins).
    Para opções completas de ponto de entrada, consulte [Pontos de Entrada](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Teste e publique">

    **Plugins externos:** valide e publique com ClawHub, depois instale:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    O OpenClaw também verifica o ClawHub antes do npm para especificações de pacote simples como
    `@myorg/openclaw-my-plugin`; o npm continua sendo fallback para pacotes que
    ainda não migraram para o ClawHub.

    **Plugins no repositório:** coloque na árvore de workspace de Plugins incluídos — descoberta automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades do Plugin

Um único Plugin pode registrar qualquer número de capacidades por meio do objeto `api`:

| Capacidade             | Método de registro                              | Guia detalhado                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferência de texto (LLM)   | `api.registerProvider(...)`                      | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins)                               |
| Backend de inferência da CLI  | `api.registerCliBackend(...)`                    | [Backends da CLI](/pt-BR/gateway/cli-backends)                                           |
| Canal / mensagens    | `api.registerChannel(...)`                       | [Plugins de Canal](/pt-BR/plugins/sdk-channel-plugins)                                 |
| Fala (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz em tempo real         | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compreensão de mídia    | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de imagens       | `api.registerImageGenerationProvider(...)`       | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de música       | `api.registerMusicGenerationProvider(...)`       | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Busca de página web              | `api.registerWebFetchProvider(...)`              | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pesquisa na web             | `api.registerWebSearchProvider(...)`             | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de resultado de ferramenta | `api.registerAgentToolResultMiddleware(...)`     | [Visão Geral do SDK](/pt-BR/plugins/sdk-overview#registration-api)                          |
| Ferramentas de agente            | `api.registerTool(...)`                          | Abaixo                                                                           |
| Comandos personalizados        | `api.registerCommand(...)`                       | [Pontos de Entrada](/pt-BR/plugins/sdk-entrypoints)                                        |
| Ganchos de Plugin           | `api.on(...)`                                    | [Ganchos de Plugin](/pt-BR/plugins/hooks)                                                  |
| Ganchos internos de evento   | `api.registerHook(...)`                          | [Pontos de Entrada](/pt-BR/plugins/sdk-entrypoints)                                        |
| Rotas HTTP            | `api.registerHttpRoute(...)`                     | [Internos](/pt-BR/plugins/architecture-internals#gateway-http-routes)                |
| Subcomandos da CLI        | `api.registerCli(...)`                           | [Pontos de Entrada](/pt-BR/plugins/sdk-entrypoints)                                        |

Para a API de registro completa, consulte [Visão Geral do SDK](/pt-BR/plugins/sdk-overview#registration-api).

Plugins incluídos podem usar `api.registerAgentToolResultMiddleware(...)` quando
precisam reescrever resultados de ferramentas de forma assíncrona antes que o modelo veja a saída. Declare os
runtimes direcionados em `contracts.agentToolResultMiddleware`, por exemplo
`["pi", "codex"]`. Esta é uma interface confiável para Plugins incluídos; Plugins externos
devem preferir os ganchos regulares de Plugin do OpenClaw, a menos que o OpenClaw adicione uma
política de confiança explícita para essa capacidade.

Se seu Plugin registrar métodos RPC personalizados do Gateway, mantenha-os em um
prefixo específico do Plugin. Namespaces administrativos centrais (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem para
`operator.admin`, mesmo que um Plugin peça um escopo mais estreito.

Semântica de proteção de ganchos a considerar:

- `before_tool_call`: `{ block: true }` é terminal e interrompe manipuladores de menor prioridade.
- `before_tool_call`: `{ block: false }` é tratado como nenhuma decisão.
- `before_tool_call`: `{ requireApproval: true }` pausa a execução do agente e solicita aprovação do usuário por meio da sobreposição de aprovação de execução, botões do Telegram, interações do Discord ou o comando `/approve` em qualquer canal.
- `before_install`: `{ block: true }` é terminal e interrompe manipuladores de menor prioridade.
- `before_install`: `{ block: false }` é tratado como nenhuma decisão.
- `message_sending`: `{ cancel: true }` é terminal e interrompe manipuladores de menor prioridade.
- `message_sending`: `{ cancel: false }` é tratado como nenhuma decisão.
- `message_received`: prefira o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: prefira os campos tipados de roteamento `replyToId` / `threadId` em vez de chaves de metadados específicas do canal.

O comando `/approve` lida com aprovações de execução e de Plugin com fallback limitado: quando um id de aprovação de execução não é encontrado, o OpenClaw tenta novamente o mesmo id em aprovações de Plugin. O encaminhamento de aprovação de Plugin pode ser configurado de forma independente por meio de `approvals.plugin` na configuração.

Se um encanamento de aprovação personalizado precisar detectar esse mesmo caso de fallback limitado,
prefira `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
em vez de comparar strings de expiração de aprovação manualmente.

Consulte [Ganchos de Plugin](/pt-BR/plugins/hooks) para exemplos e a referência de ganchos.

## Registrando ferramentas de agente

Ferramentas são funções tipadas que o LLM pode chamar. Elas podem ser obrigatórias (sempre
disponíveis) ou opcionais (adesão do usuário):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Toda ferramenta registrada com `api.registerTool(...)` também deve ser declarada no
manifesto do Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Os usuários habilitam ferramentas opcionais na configuração:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Os nomes das ferramentas não devem entrar em conflito com ferramentas centrais (conflitos são ignorados)
- Ferramentas com objetos de registro malformados, incluindo `parameters` ausente, são ignoradas e relatadas nos diagnósticos do plugin em vez de interromper execuções do agente
- Use `optional: true` para ferramentas com efeitos colaterais ou requisitos binários extras
- Os usuários podem habilitar todas as ferramentas de um plugin adicionando o id do plugin a `tools.allow`

## Registrando comandos da CLI

Plugins podem adicionar grupos de comandos raiz `openclaw` com `api.registerCli`. Forneça
`descriptors` para cada raiz de comando de nível superior, para que o OpenClaw possa mostrar e rotear
o comando sem carregar antecipadamente todo runtime de plugin.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Após a instalação, verifique o registro de runtime e execute o comando:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Convenções de importação

Sempre importe de caminhos `openclaw/plugin-sdk/<subpath>` focados:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Para a referência completa de subcaminhos, consulte [Visão geral do SDK](/pt-BR/plugins/sdk-overview).

Dentro do seu plugin, use arquivos barrel locais (`api.ts`, `runtime-api.ts`) para
importações internas — nunca importe seu próprio plugin pelo caminho do SDK dele.

Para plugins de provider, mantenha auxiliares específicos do provider nesses barrels
da raiz do pacote, a menos que o seam seja realmente genérico. Exemplos integrados atuais:

- Anthropic: wrappers de stream do Claude e auxiliares de `service_tier` / beta
- OpenAI: builders de provider, auxiliares de modelo padrão, providers em tempo real
- OpenRouter: builder de provider mais auxiliares de onboarding/configuração

Se um auxiliar só for útil dentro de um pacote de provider integrado, mantenha-o nesse
seam da raiz do pacote em vez de promovê-lo para `openclaw/plugin-sdk/*`.

Alguns seams auxiliares gerados `openclaw/plugin-sdk/<bundled-id>` ainda existem para
manutenção de plugins integrados quando têm uso de proprietário rastreado. Trate-os como
superfícies reservadas, não como o padrão padrão para novos plugins de terceiros.

## Checklist de pré-envio

<Check>**package.json** tem metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos `plugin-sdk/<subpath>` focados</Check>
<Check>Importações internas usam módulos locais, não autoimportações do SDK</Check>
<Check>Testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugins no repositório)</Check>

## Testes de versão beta

1. Acompanhe tags de release do GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e assine via `Watch` > `Releases`. Tags beta se parecem com `v2026.3.N-beta.1`. Você também pode ativar notificações da conta oficial do OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de release.
2. Teste seu plugin contra a tag beta assim que ela aparecer. A janela antes da stable normalmente é de apenas algumas horas.
3. Publique no thread do seu plugin no canal `plugin-forum` do Discord após testar, com `all good` ou o que quebrou. Se você ainda não tiver um thread, crie um.
4. Se algo quebrar, abra ou atualize uma issue intitulada `Beta blocker: <plugin-name> - <summary>` e aplique o label `beta-blocker`. Coloque o link da issue no seu thread.
5. Abra um PR para `main` intitulado `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto no seu thread do Discord. Colaboradores não podem rotular PRs, então o título é o sinal do lado do PR para mantenedores e automação. Bloqueadores com um PR são mesclados; bloqueadores sem um podem ser lançados mesmo assim. Mantenedores acompanham esses threads durante os testes beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entra no próximo ciclo.

## Próximos passos

<CardGroup cols={2}>
  <Card title="Plugins de Canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens
  </Card>
  <Card title="Plugins de Provider" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provider de modelo
  </Card>
  <Card title="Visão Geral do SDK" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Mapa de importação e referência da API de registro
  </Card>
  <Card title="Auxiliares de Runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, pesquisa, subagente via api.runtime
  </Card>
  <Card title="Testes" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Manifesto do Plugin" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do esquema do manifesto
  </Card>
</CardGroup>

## Relacionados

- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — aprofundamento da arquitetura interna
- [Visão Geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
- [Manifesto](/pt-BR/plugins/manifest) — formato do manifesto do plugin
- [Plugins de Canal](/pt-BR/plugins/sdk-channel-plugins) — criação de plugins de canal
- [Plugins de Provider](/pt-BR/plugins/sdk-provider-plugins) — criação de plugins de provider
