---
read_when:
    - Você quer criar um novo Plugin do OpenClaw
    - Você precisa de um início rápido para desenvolvimento de Plugin
    - Você está adicionando um novo canal, provedor, ferramenta ou outro recurso ao OpenClaw
sidebarTitle: Getting Started
summary: Crie seu primeiro Plugin do OpenClaw em minutos
title: Criando Plugins
x-i18n:
    generated_at: "2026-04-24T06:02:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagem,
geração de vídeo, web fetch, web search, ferramentas de agente ou qualquer
combinação.

Você não precisa adicionar seu Plugin ao repositório do OpenClaw. Publique em
[ClawHub](/pt-BR/tools/clawhub) ou npm, e os usuários instalam com
`openclaw plugins install <package-name>`. O OpenClaw tenta primeiro o ClawHub e
recorre automaticamente ao npm.

## Pré-requisitos

- Node >= 22 e um gerenciador de pacotes (npm ou pnpm)
- Familiaridade com TypeScript (ESM)
- Para Plugins no repositório: repositório clonado e `pnpm install` executado

## Que tipo de Plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens (Discord, IRC etc.)
  </Card>
  <Card title="Plugin de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um provedor de modelo (LLM, proxy ou endpoint personalizado)
  </Card>
  <Card title="Plugin de ferramenta / hook" icon="wrench">
    Registre ferramentas de agente, hooks de evento ou serviços — continue abaixo
  </Card>
</CardGroup>

Para um Plugin de canal cuja instalação não é garantida quando onboarding/setup
é executado, use `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Ele produz um adaptador de setup + par de assistente
que anuncia o requisito de instalação e falha de forma fechada em gravações reais de configuração
até que o Plugin seja instalado.

## Início rápido: Plugin de ferramenta

Este passo a passo cria um Plugin mínimo que registra uma ferramenta de agente. Plugins de canal
e provedor têm guias dedicados nos links acima.

<Steps>
  <Step title="Create the package and manifest">
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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Todo Plugin precisa de um manifesto, mesmo sem configuração. Consulte
    [Manifest](/pt-BR/plugins/manifest) para ver o schema completo. Os snippets canônicos
    de publicação no ClawHub ficam em `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Write the entry point">

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
    `defineChannelPluginEntry` — consulte [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins).
    Para ver todas as opções de entry point, consulte [Entry Points](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Plugins externos:** valide e publique com ClawHub, depois instale:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    O OpenClaw também verifica o ClawHub antes do npm para especificações simples de pacote como
    `@myorg/openclaw-my-plugin`.

    **Plugins no repositório:** coloque sob a árvore de workspace de Plugins incluídos — descoberta automática.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Recursos do Plugin

Um único Plugin pode registrar qualquer quantidade de recursos via o objeto `api`:

| Recurso               | Método de registro                               | Guia detalhado                                                                  |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferência de texto (LLM) | `api.registerProvider(...)`                  | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins)                               |
| Backend de inferência CLI | `api.registerCliBackend(...)`                | [CLI Backends](/pt-BR/gateway/cli-backends)                                           |
| Canal / mensagens     | `api.registerChannel(...)`                      | [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins)                                 |
| Fala (TTS/STT)        | `api.registerSpeechProvider(...)`               | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz em tempo real     | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Entendimento de mídia | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de imagem     | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de música     | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de vídeo      | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch             | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search            | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Extensão Pi embutida  | `api.registerEmbeddedExtensionFactory(...)`     | [SDK Overview](/pt-BR/plugins/sdk-overview#registration-api)                          |
| Ferramentas de agente | `api.registerTool(...)`                         | Abaixo                                                                          |
| Comandos personalizados | `api.registerCommand(...)`                    | [Entry Points](/pt-BR/plugins/sdk-entrypoints)                                        |
| Hooks de evento       | `api.registerHook(...)`                         | [Entry Points](/pt-BR/plugins/sdk-entrypoints)                                        |
| Rotas HTTP            | `api.registerHttpRoute(...)`                    | [Internals](/pt-BR/plugins/architecture-internals#gateway-http-routes)                |
| Subcomandos de CLI    | `api.registerCli(...)`                          | [Entry Points](/pt-BR/plugins/sdk-entrypoints)                                        |

Para ver a API de registro completa, consulte [SDK Overview](/pt-BR/plugins/sdk-overview#registration-api).

Use `api.registerEmbeddedExtensionFactory(...)` quando um Plugin precisar de
hooks nativos do Pi no embedded-runner, como reescrita assíncrona de `tool_result`
antes de a mensagem final de resultado da ferramenta ser emitida. Prefira hooks comuns de Plugin do OpenClaw quando o
trabalho não exigir o timing de extensão do Pi.

Se seu Plugin registra métodos RPC personalizados do gateway, mantenha-os em um
prefixo específico do Plugin. Namespaces centrais de administração (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre são resolvidos para
`operator.admin`, mesmo que um Plugin solicite um escopo mais restrito.

Semântica de proteção de hook a ter em mente:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_tool_call`: `{ block: false }` é tratado como nenhuma decisão.
- `before_tool_call`: `{ requireApproval: true }` pausa a execução do agente e solicita aprovação do usuário pela sobreposição de aprovação de exec, botões do Telegram, interações do Discord ou o comando `/approve` em qualquer canal.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_install`: `{ block: false }` é tratado como nenhuma decisão.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade inferior.
- `message_sending`: `{ cancel: false }` é tratado como nenhuma decisão.
- `message_received`: prefira o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos de canal.
- `message_sending`: prefira os campos tipados de roteamento `replyToId` / `threadId` em vez de chaves específicas de canal em metadata.

O comando `/approve` trata aprovações de exec e de Plugin com fallback limitado: quando um ID de aprovação de exec não é encontrado, o OpenClaw tenta novamente o mesmo ID nas aprovações de Plugin. O encaminhamento de aprovação de Plugin pode ser configurado independentemente por `approvals.plugin` na configuração.

Se um fluxo personalizado de aprovação precisar detectar esse mesmo caso de fallback limitado,
prefira `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
em vez de fazer correspondência manual de strings de expiração de aprovação.

Consulte [SDK Overview hook decision semantics](/pt-BR/plugins/sdk-overview#hook-decision-semantics) para detalhes.

## Registrando ferramentas de agente

Ferramentas são funções tipadas que a LLM pode chamar. Elas podem ser obrigatórias (sempre
disponíveis) ou opcionais (opt-in do usuário):

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

Os usuários ativam ferramentas opcionais na configuração:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Os nomes das ferramentas não podem conflitar com ferramentas centrais (conflitos são ignorados)
- Use `optional: true` para ferramentas com efeitos colaterais ou requisitos extras de binário
- Os usuários podem ativar todas as ferramentas de um Plugin adicionando o ID do Plugin a `tools.allow`

## Convenções de importação

Sempre importe de caminhos focados `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Para ver a referência completa de subpaths, consulte [SDK Overview](/pt-BR/plugins/sdk-overview).

Dentro do seu Plugin, use arquivos barrel locais (`api.ts`, `runtime-api.ts`) para
imports internos — nunca importe seu próprio Plugin pelo caminho do SDK.

Para Plugins de provedor, mantenha helpers específicos de provedor nesses barrels
na raiz do pacote, a menos que a interface seja realmente genérica. Exemplos integrados atuais:

- Anthropic: wrappers de stream do Claude e helpers de `service_tier` / beta
- OpenAI: builders de provedor, helpers de modelo padrão, provedores em tempo real
- OpenRouter: builder de provedor mais helpers de onboarding/configuração

Se um helper for útil apenas dentro de um pacote integrado de provedor, mantenha-o nessa
interface na raiz do pacote em vez de promovê-lo para `openclaw/plugin-sdk/*`.

Algumas interfaces auxiliares geradas `openclaw/plugin-sdk/<bundled-id>` ainda existem para
manutenção e compatibilidade de Plugins incluídos, por exemplo
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Trate essas superfícies como
reservadas, não como o padrão para novos Plugins de terceiros.

## Checklist antes do envio

<Check>**package.json** tem metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e válido</Check>
<Check>O entry point usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todos os imports usam caminhos focados `plugin-sdk/<subpath>`</Check>
<Check>Imports internos usam módulos locais, não auto-imports do SDK</Check>
<Check>Os testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugins no repositório)</Check>

## Teste de release beta

1. Acompanhe tags de release no GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e assine via `Watch` > `Releases`. Tags beta têm aparência de `v2026.3.N-beta.1`. Você também pode ativar notificações para a conta oficial do OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de release.
2. Teste seu Plugin contra a tag beta assim que ela aparecer. A janela antes da estável normalmente é de apenas algumas horas.
3. Publique na thread do seu Plugin no canal `plugin-forum` do Discord após o teste com `all good` ou com o que quebrou. Se você ainda não tiver uma thread, crie uma.
4. Se algo quebrar, abra ou atualize uma issue intitulada `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue na sua thread.
5. Abra um PR para `main` intitulado `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto na sua thread do Discord. Contribuidores não podem rotular PRs, então o título é o sinal do lado do PR para mantenedores e automação. Blockers com PR são mergeados; blockers sem PR podem ser lançados mesmo assim. Mantenedores observam essas threads durante o teste beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entra no próximo ciclo.

## Próximos passos

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um Plugin de canal de mensagens
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um Plugin de provedor de modelo
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Mapa de imports e referência da API de registro
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, search, subagent via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do schema do manifesto
  </Card>
</CardGroup>

## Relacionado

- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura interna
- [SDK Overview](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
- [Manifest](/pt-BR/plugins/manifest) — formato de manifesto de Plugin
- [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins) — criação de Plugins de canal
- [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) — criação de Plugins de provedor
