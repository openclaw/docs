---
read_when:
    - Você deseja criar um novo Plugin do OpenClaw
    - Você precisa de um guia de início rápido para desenvolvimento de Plugin
    - Você está adicionando um novo canal, provedor, ferramenta ou outra capacidade ao OpenClaw
sidebarTitle: Getting Started
summary: Crie seu primeiro Plugin do OpenClaw em minutos
title: Criando plugins
x-i18n:
    generated_at: "2026-05-07T13:21:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração
de imagem, geração de vídeo, busca de conteúdo web, pesquisa web, ferramentas de agente ou qualquer
combinação.

Você não precisa adicionar seu plugin ao repositório do OpenClaw. Publique no
[ClawHub](/pt-BR/tools/clawhub) e os usuários instalam com
`openclaw plugins install clawhub:<package-name>`. Especificações simples de pacote ainda
instalam a partir do npm durante a transição de lançamento.

## Pré-requisitos

- Node >= 22 e um gerenciador de pacotes (npm ou pnpm)
- Familiaridade com TypeScript (ESM)
- Para plugins no repositório: repositório clonado e `pnpm install` executado. O desenvolvimento de plugins
  em checkout de código-fonte é exclusivo de pnpm porque o OpenClaw carrega plugins
  empacotados a partir dos pacotes de workspace `extensions/*`.

## Que tipo de plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens (Discord, IRC etc.)
  </Card>
  <Card title="Plugin de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um provedor de modelo (LLM, proxy ou endpoint personalizado)
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Mapeie uma CLI de IA local para o executor de fallback de texto do OpenClaw
  </Card>
  <Card title="Plugin de ferramenta / gancho" icon="wrench" href="/pt-BR/plugins/hooks">
    Registre ferramentas de agente, ganchos de evento ou serviços - continue abaixo
  </Card>
</CardGroup>

Para um plugin de canal que não tem garantia de estar instalado quando a integração/configuração
executa, use `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Ele produz um par de adaptador de configuração + assistente
que anuncia o requisito de instalação e falha de forma fechada em gravações de configuração reais
até que o plugin esteja instalado.

## Início rápido: plugin de ferramenta

Este passo a passo cria um plugin mínimo que registra uma ferramenta de agente. Plugins de canal
e provedor têm guias dedicados vinculados acima.

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

    Todo plugin precisa de um manifesto, mesmo sem configuração. Ferramentas registradas em runtime
    devem ser listadas em `contracts.tools` para que o OpenClaw possa descobrir o
    plugin proprietário sem carregar o runtime de todos os plugins. Plugins também devem declarar
    `activation.onStartup` de forma intencional. Este exemplo o define como `true`. Consulte
    [Manifesto](/pt-BR/plugins/manifest) para o schema completo. Os snippets canônicos de publicação no ClawHub
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

    `definePluginEntry` é para plugins que não são de canal. Para canais, use
    `defineChannelPluginEntry` - consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).
    Para opções completas de ponto de entrada, consulte [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Teste e publique">

    **Plugins externos:** valide e publique com o ClawHub, depois instale:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Especificações simples de pacote como `@myorg/openclaw-my-plugin` instalam a partir do npm durante
    a transição de lançamento. Use `clawhub:` quando quiser resolução pelo ClawHub.

    **Plugins no repositório:** coloque sob a árvore de workspace de plugins empacotados - descoberto automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Recursos de plugin

Um único plugin pode registrar qualquer número de recursos por meio do objeto `api`:

| Recurso                | Método de registro                              | Guia detalhado                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferência de texto (LLM) | `api.registerProvider(...)`                      | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins)                            |
| Backend de inferência de CLI | `api.registerCliBackend(...)`                    | [Plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins)                       |
| Canal / mensagens      | `api.registerChannel(...)`                       | [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)                                |
| Fala (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compreensão de mídia   | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`       | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de música      | `api.registerMusicGenerationProvider(...)`       | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Busca de conteúdo web  | `api.registerWebFetchProvider(...)`              | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pesquisa web           | `api.registerWebSearchProvider(...)`             | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de resultado de ferramenta | `api.registerAgentToolResultMiddleware(...)`     | [Visão geral do SDK](/pt-BR/plugins/sdk-overview#registration-api)                    |
| Ferramentas de agente  | `api.registerTool(...)`                          | Abaixo                                                                          |
| Comandos personalizados | `api.registerCommand(...)`                       | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                   |
| Ganchos de plugin      | `api.on(...)`                                    | [Ganchos de plugin](/pt-BR/plugins/hooks)                                             |
| Ganchos de eventos internos | `api.registerHook(...)`                          | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                   |
| Rotas HTTP             | `api.registerHttpRoute(...)`                     | [Internos](/pt-BR/plugins/architecture-internals#gateway-http-routes)                 |
| Subcomandos de CLI     | `api.registerCli(...)`                           | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                   |

Para a API de registro completa, consulte [Visão geral do SDK](/pt-BR/plugins/sdk-overview#registration-api).

Plugins empacotados podem usar `api.registerAgentToolResultMiddleware(...)` quando
precisam reescrever resultados de ferramentas de forma assíncrona antes que o modelo veja a saída. Declare os
runtimes alvo em `contracts.agentToolResultMiddleware`, por exemplo
`["pi", "codex"]`. Este é um ponto de integração confiável de plugin empacotado; plugins
externos devem preferir ganchos regulares de plugin do OpenClaw, a menos que o OpenClaw adicione uma
política de confiança explícita para esse recurso.

Se seu plugin registra métodos RPC personalizados do Gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos centrais (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem para
`operator.admin`, mesmo se um plugin solicitar um escopo mais restrito.

Semântica de guarda de ganchos a ter em mente:

- `before_tool_call`: `{ block: true }` é terminal e interrompe manipuladores de prioridade mais baixa.
- `before_tool_call`: `{ block: false }` é tratado como nenhuma decisão.
- `before_tool_call`: `{ requireApproval: true }` pausa a execução do agente e solicita aprovação ao usuário por meio da sobreposição de aprovação de exec, botões do Telegram, interações do Discord ou o comando `/approve` em qualquer canal.
- `before_install`: `{ block: true }` é terminal e interrompe manipuladores de prioridade mais baixa.
- `before_install`: `{ block: false }` é tratado como nenhuma decisão.
- `message_sending`: `{ cancel: true }` é terminal e interrompe manipuladores de prioridade mais baixa.
- `message_sending`: `{ cancel: false }` é tratado como nenhuma decisão.
- `message_received`: prefira o campo tipado `threadId` quando precisar de roteamento de tópico/thread de entrada. Mantenha `metadata` para extras específicos de canal.
- `message_sending`: prefira os campos tipados de roteamento `replyToId` / `threadId` em vez de chaves de metadados específicas de canal.

O comando `/approve` trata aprovações de exec e de plugin com fallback limitado: quando um id de aprovação de exec não é encontrado, o OpenClaw tenta novamente o mesmo id por meio das aprovações de plugin. O encaminhamento de aprovação de plugin pode ser configurado de forma independente por meio de `approvals.plugin` na configuração.

Se um encanamento personalizado de aprovação precisar detectar esse mesmo caso de fallback limitado,
prefira `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
em vez de comparar strings de expiração de aprovação manualmente.

Consulte [Ganchos de plugin](/pt-BR/plugins/hooks) para exemplos e a referência de ganchos.

## Registrando ferramentas de agente

Ferramentas são funções tipadas que o LLM pode chamar. Elas podem ser obrigatórias (sempre
disponíveis) ou opcionais (adesão do usuário):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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
manifesto do plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw captura e armazena em cache o descritor validado da ferramenta registrada,
para que plugins não dupliquem `description` ou dados de esquema no manifesto. O
contrato do manifesto declara apenas propriedade e descoberta; a execução ainda chama
a implementação da ferramenta registrada em tempo real.
Defina `toolMetadata.<tool>.optional: true` para ferramentas registradas com
`api.registerTool(..., { optional: true })`, para que o OpenClaw possa evitar carregar esse
runtime do plugin até que a ferramenta seja explicitamente adicionada à lista de permissões.

Usuários habilitam ferramentas opcionais na configuração:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nomes de ferramentas não devem colidir com ferramentas centrais (conflitos são ignorados)
- Ferramentas com objetos de registro malformados, incluindo ausência de `parameters`, são ignoradas e relatadas nos diagnósticos do plugin em vez de interromper execuções de agentes
- Use `optional: true` para ferramentas com efeitos colaterais ou requisitos binários extras
- Usuários podem habilitar todas as ferramentas de um plugin adicionando o id do plugin a `tools.allow`

## Registrando comandos da CLI

Plugins podem adicionar grupos de comandos raiz `openclaw` com `api.registerCli`. Forneça
`descriptors` para cada raiz de comando de nível superior, para que o OpenClaw possa mostrar e rotear
o comando sem carregar ansiosamente todo runtime de plugin.

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

Após a instalação, verifique o registro em runtime e execute o comando:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Convenções de importação

Sempre importe de caminhos focados `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Para a referência completa de subcaminhos, consulte [Visão geral do SDK](/pt-BR/plugins/sdk-overview).

Dentro do seu plugin, use arquivos barrel locais (`api.ts`, `runtime-api.ts`) para
importações internas - nunca importe seu próprio plugin por meio do caminho de SDK dele.

Para plugins de provedor, mantenha helpers específicos do provedor nesses barrels na raiz do pacote,
a menos que a interface seja realmente genérica. Exemplos empacotados atuais:

- Anthropic: wrappers de stream do Claude e helpers de `service_tier` / beta
- OpenAI: builders de provedor, helpers de modelo padrão, provedores em tempo real
- OpenRouter: builder de provedor mais helpers de onboarding/configuração

Se um helper só for útil dentro de um pacote de provedor empacotado, mantenha-o nessa
interface na raiz do pacote em vez de promovê-lo para `openclaw/plugin-sdk/*`.

Algumas interfaces auxiliares geradas `openclaw/plugin-sdk/<bundled-id>` ainda existem para
manutenção de plugins empacotados quando têm uso rastreado pelo proprietário. Trate-as como
superfícies reservadas, não como o padrão padrão para novos plugins de terceiros.

## Checklist de pré-envio

<Check>**package.json** tem metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos focados `plugin-sdk/<subpath>`</Check>
<Check>Importações internas usam módulos locais, não autoimportações do SDK</Check>
<Check>Testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugins dentro do repositório)</Check>

## Teste de versão beta

1. Acompanhe tags de lançamento no GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e assine via `Watch` > `Releases`. Tags beta se parecem com `v2026.3.N-beta.1`. Você também pode ativar notificações para a conta oficial do OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de lançamento.
2. Teste seu plugin contra a tag beta assim que ela aparecer. A janela antes da versão estável geralmente é de apenas algumas horas.
3. Publique na thread do seu plugin no canal `plugin-forum` do Discord após o teste, com `all good` ou o que quebrou. Se você ainda não tiver uma thread, crie uma.
4. Se algo quebrar, abra ou atualize uma issue intitulada `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue na sua thread.
5. Abra um PR para `main` intitulado `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto na sua thread do Discord. Colaboradores não podem rotular PRs, então o título é o sinal do lado do PR para mantenedores e automação. Bloqueadores com PR são mesclados; bloqueadores sem PR podem ser lançados mesmo assim. Mantenedores acompanham essas threads durante o teste beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entra no próximo ciclo.

## Próximos passos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens
  </Card>
  <Card title="Plugins de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de modelo
  </Card>
  <Card title="Plugins de backend da CLI" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Registre um backend local de CLI de IA
  </Card>
  <Card title="Visão geral do SDK" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importação e da API de registro
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, busca, subagente via api.runtime
  </Card>
  <Card title="Testes" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Manifesto de Plugin" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do esquema do manifesto
  </Card>
</CardGroup>

## Relacionados

- [Arquitetura de Plugin](/pt-BR/plugins/architecture) - aprofundamento da arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência do SDK de Plugin
- [Manifesto](/pt-BR/plugins/manifest) - formato do manifesto de plugin
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - criando plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - criando plugins de provedor
