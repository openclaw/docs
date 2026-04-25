---
read_when:
    - Você quer criar um novo Plugin do OpenClaw
    - Você precisa de um início rápido para desenvolvimento de Plugin
    - Você está adicionando um novo canal, provedor, ferramenta ou outro recurso ao OpenClaw
sidebarTitle: Getting Started
summary: Crie seu primeiro Plugin do OpenClaw em minutos
title: Criando Plugins
x-i18n:
    generated_at: "2026-04-25T13:50:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração
de imagem, geração de vídeo, busca web, pesquisa web, ferramentas do agente ou
qualquer combinação disso.

Você não precisa adicionar seu Plugin ao repositório OpenClaw. Publique no
[ClawHub](/pt-BR/tools/clawhub) ou no npm, e os usuários instalam com
`openclaw plugins install <package-name>`. O OpenClaw tenta primeiro o ClawHub e
recorre ao npm automaticamente.

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
  <Card title="Plugin de ferramenta / hook" icon="wrench" href="/pt-BR/plugins/hooks">
    Registre ferramentas do agente, hooks de eventos ou serviços — continue abaixo
  </Card>
</CardGroup>

Para um Plugin de canal que não tem instalação garantida quando a integração inicial/configuração
é executada, use `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Ele produz um par adaptador + assistente de configuração
que anuncia o requisito de instalação e falha de forma fail-closed em gravações reais de configuração
até que o Plugin seja instalado.

## Início rápido: Plugin de ferramenta

Este passo a passo cria um Plugin mínimo que registra uma ferramenta do agente. Plugins de canal
e de provedor têm guias dedicados com links acima.

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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Todo Plugin precisa de um manifesto, mesmo sem configuração. Consulte
    [Manifesto](/pt-BR/plugins/manifest) para o schema completo. Os snippets canônicos de
    publicação no ClawHub ficam em `docs/snippets/plugin-publish/`.

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
    `defineChannelPluginEntry` — consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).
    Para as opções completas do ponto de entrada, consulte [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Teste e publique">

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

Um único Plugin pode registrar qualquer quantidade de recursos por meio do objeto `api`:

| Recurso                | Método de registro                              | Guia detalhado                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Inferência de texto (LLM) | `api.registerProvider(...)`                   | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins)                           |
| Backend de inferência para CLI | `api.registerCliBackend(...)`           | [Backends da CLI](/pt-BR/gateway/cli-backends)                                       |
| Canal / mensagens      | `api.registerChannel(...)`                       | [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)                               |
| Fala (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compreensão de mídia   | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`       | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de música      | `api.registerMusicGenerationProvider(...)`       | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Busca web              | `api.registerWebFetchProvider(...)`              | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pesquisa web           | `api.registerWebSearchProvider(...)`             | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de resultado de ferramenta | `api.registerAgentToolResultMiddleware(...)` | [Visão geral do SDK](/pt-BR/plugins/sdk-overview#registration-api)                  |
| Ferramentas do agente  | `api.registerTool(...)`                          | Abaixo                                                                         |
| Comandos personalizados | `api.registerCommand(...)`                      | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                  |
| Hooks de Plugin        | `api.on(...)`                                    | [Hooks de Plugin](/pt-BR/plugins/hooks)                                              |
| Hooks de evento internos | `api.registerHook(...)`                        | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                  |
| Rotas HTTP             | `api.registerHttpRoute(...)`                     | [Internals](/pt-BR/plugins/architecture-internals#gateway-http-routes)               |
| Subcomandos de CLI     | `api.registerCli(...)`                           | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                  |

Para a API completa de registro, consulte [Visão geral do SDK](/pt-BR/plugins/sdk-overview#registration-api).

Plugins incluídos podem usar `api.registerAgentToolResultMiddleware(...)` quando
precisam reescrever assincronamente o resultado da ferramenta antes que o modelo veja a saída. Declare os
runtimes de destino em `contracts.agentToolResultMiddleware`, por exemplo
`["pi", "codex"]`. Esta é uma superfície confiável de Plugin incluído; Plugins
externos devem preferir hooks normais de Plugin do OpenClaw, a menos que o OpenClaw passe a oferecer
uma política explícita de confiança para esse recurso.

Se o seu Plugin registrar métodos RPC personalizados do Gateway, mantenha-os em um
prefixo específico do Plugin. Namespaces administrativos centrais (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre são resolvidos para
`operator.admin`, mesmo que um Plugin solicite um escopo mais restrito.

Semântica de guarda de hooks a ter em mente:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de menor prioridade.
- `before_tool_call`: `{ block: false }` é tratado como nenhuma decisão.
- `before_tool_call`: `{ requireApproval: true }` pausa a execução do agente e solicita aprovação do usuário por meio da sobreposição de aprovação de exec, botões do Telegram, interações do Discord ou o comando `/approve` em qualquer canal.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de menor prioridade.
- `before_install`: `{ block: false }` é tratado como nenhuma decisão.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de menor prioridade.
- `message_sending`: `{ cancel: false }` é tratado como nenhuma decisão.
- `message_received`: prefira o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos de canal.
- `message_sending`: prefira os campos tipados de roteamento `replyToId` / `threadId` em vez de chaves de metadata específicas de canal.

O comando `/approve` trata aprovações de exec e de Plugin com fallback limitado: quando um id de aprovação de exec não é encontrado, o OpenClaw tenta novamente o mesmo id em aprovações de Plugin. O encaminhamento de aprovações de Plugin pode ser configurado independentemente via `approvals.plugin` na configuração.

Se a lógica de aprovação personalizada precisar detectar esse mesmo caso de fallback limitado,
prefira `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
em vez de fazer correspondência manual com strings de expiração de aprovação.

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para exemplos e a referência de hooks.

## Registrando ferramentas do agente

Ferramentas são funções tipadas que o LLM pode chamar. Elas podem ser obrigatórias (sempre
disponíveis) ou opcionais (opt-in do usuário):

```typescript
register(api) {
  // Ferramenta obrigatória — sempre disponível
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Ferramenta opcional — o usuário precisa adicionar à allowlist
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

Os usuários habilitam ferramentas opcionais na configuração:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nomes de ferramentas não devem conflitar com ferramentas centrais (conflitos são ignorados)
- Use `optional: true` para ferramentas com efeitos colaterais ou requisitos binários extras
- Usuários podem habilitar todas as ferramentas de um Plugin adicionando o id do Plugin a `tools.allow`

## Convenções de importação

Sempre importe de caminhos focados `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Errado: raiz monolítica (obsoleta, será removida)
import { ... } from "openclaw/plugin-sdk";
```

Para a referência completa de subcaminhos, consulte [Visão geral do SDK](/pt-BR/plugins/sdk-overview).

Dentro do seu Plugin, use arquivos barrel locais (`api.ts`, `runtime-api.ts`) para
importações internas — nunca importe o seu próprio Plugin por meio do caminho do SDK.

Para Plugins de provedor, mantenha helpers específicos do provedor nesses
barrels da raiz do pacote, a menos que a superfície seja realmente genérica. Exemplos incluídos atuais:

- Anthropic: wrappers de stream do Claude e helpers de `service_tier` / beta
- OpenAI: builders de provedor, helpers de modelo padrão, provedores de realtime
- OpenRouter: builder de provedor mais helpers de onboarding/configuração

Se um helper for útil apenas dentro de um pacote de provedor incluído, mantenha-o nessa
superfície da raiz do pacote em vez de promovê-lo para `openclaw/plugin-sdk/*`.

Algumas superfícies auxiliares geradas em `openclaw/plugin-sdk/<bundled-id>` ainda existem para
manutenção e compatibilidade de Plugins incluídos, por exemplo
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Trate essas superfícies como
reservadas, não como o padrão para novos Plugins de terceiros.

## Checklist antes do envio

<Check>**package.json** tem os metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos focados `plugin-sdk/<subpath>`</Check>
<Check>Importações internas usam módulos locais, não autoimportações via SDK</Check>
<Check>Os testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugins no repositório)</Check>

## Teste de release beta

1. Acompanhe tags de release do GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e assine em `Watch` > `Releases`. Tags beta têm aparência como `v2026.3.N-beta.1`. Você também pode ativar notificações para a conta oficial do OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de release.
2. Teste seu Plugin com a tag beta assim que ela aparecer. A janela antes da stable normalmente é de apenas algumas horas.
3. Publique na thread do seu Plugin no canal `plugin-forum` do Discord após testar, com `all good` ou informando o que quebrou. Se você ainda não tiver uma thread, crie uma.
4. Se algo quebrar, abra ou atualize uma issue com o título `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue na sua thread.
5. Abra um PR para `main` com o título `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto na sua thread do Discord. Colaboradores não podem rotular PRs, então o título é o sinal do lado do PR para mantenedores e automação. Blockers com PR são mesclados; blockers sem PR talvez sejam lançados mesmo assim. Os mantenedores acompanham essas threads durante o teste beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entra no próximo ciclo.

## Próximos passos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um Plugin de canal de mensagens
  </Card>
  <Card title="Plugins de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um Plugin de provedor de modelo
  </Card>
  <Card title="Visão geral do SDK" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Mapa de importação e referência da API de registro
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, pesquisa, subagente via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Manifesto do Plugin" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do schema do manifesto
  </Card>
</CardGroup>

## Relacionado

- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
- [Manifesto](/pt-BR/plugins/manifest) — formato do manifesto do plugin
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criação de Plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — criação de Plugins de provedor
