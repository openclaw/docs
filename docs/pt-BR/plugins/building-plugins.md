---
read_when:
    - Você quer criar um novo plugin do OpenClaw
    - Você precisa de um início rápido para desenvolvimento de plugins
    - Você está adicionando um novo canal, provedor, tool ou outra capability ao OpenClaw
sidebarTitle: Getting Started
summary: Crie seu primeiro plugin do OpenClaw em minutos
title: Criando Plugins
x-i18n:
    generated_at: "2026-04-06T03:08:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9be344cb300ecbcba08e593a95bcc93ab16c14b28a0ff0c29b26b79d8249146c
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Criando Plugins

Plugins estendem o OpenClaw com novas capabilities: canais, provedores de model,
fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração
de imagens, geração de vídeo, web fetch, web search, tools de agente, ou qualquer
combinação.

Você não precisa adicionar seu plugin ao repositório do OpenClaw. Publique no
[ClawHub](/pt-BR/tools/clawhub) ou no npm, e os usuários instalam com
`openclaw plugins install <package-name>`. O OpenClaw tenta primeiro o ClawHub e
recorre ao npm automaticamente.

## Pré-requisitos

- Node >= 22 e um gerenciador de pacotes (npm ou pnpm)
- Familiaridade com TypeScript (ESM)
- Para plugins no repositório: repositório clonado e `pnpm install` concluído

## Que tipo de plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens (Discord, IRC etc.)
  </Card>
  <Card title="Plugin de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um provedor de model (LLM, proxy ou endpoint personalizado)
  </Card>
  <Card title="Plugin de tool / hook" icon="wrench">
    Registre tools de agente, hooks de eventos ou serviços — continue abaixo
  </Card>
</CardGroup>

Se um plugin de canal for opcional e puder não estar instalado quando o onboarding/setup
for executado, use `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Isso produz um par de adaptador de setup + assistente
que anuncia o requisito de instalação e falha de forma fechada em gravações reais de config
até que o plugin seja instalado.

## Início rápido: plugin de tool

Este passo a passo cria um plugin mínimo que registra uma tool de agente. Plugins de canal
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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Todo plugin precisa de um manifesto, mesmo sem config. Consulte
    [Manifest](/pt-BR/plugins/manifest) para ver o schema completo. Os snippets canônicos de publicação no ClawHub
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
    `defineChannelPluginEntry` — consulte [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins).
    Para ver todas as opções do ponto de entrada, consulte [Entry Points](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Teste e publique">

    **Plugins externos:** valide e publique com ClawHub, depois instale:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    O OpenClaw também verifica o ClawHub antes do npm para especificações de pacote simples como
    `@myorg/openclaw-my-plugin`.

    **Plugins no repositório:** coloque-os na árvore de workspace de plugins incluídos — descoberta automática.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capabilities de plugin

Um único plugin pode registrar qualquer número de capabilities por meio do objeto `api`:

| Capability             | Método de registro                              | Guia detalhado                                                                  |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Inferência de texto (LLM)   | `api.registerProvider(...)`                | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins)                               |
| Canal / mensagens      | `api.registerChannel(...)`                      | [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins)                                 |
| Fala (TTS/STT)         | `api.registerSpeechProvider(...)`               | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compreensão de mídia   | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de imagens     | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de música      | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tools de agente        | `api.registerTool(...)`                         | Abaixo                                                                          |
| Comandos personalizados | `api.registerCommand(...)`                     | [Entry Points](/pt-BR/plugins/sdk-entrypoints)                                        |
| Hooks de eventos       | `api.registerHook(...)`                         | [Entry Points](/pt-BR/plugins/sdk-entrypoints)                                        |
| Rotas HTTP             | `api.registerHttpRoute(...)`                    | [Internals](/pt-BR/plugins/architecture#gateway-http-routes)                          |
| Subcomandos da CLI     | `api.registerCli(...)`                          | [Entry Points](/pt-BR/plugins/sdk-entrypoints)                                        |

Para ver a API completa de registro, consulte [SDK Overview](/pt-BR/plugins/sdk-overview#registration-api).

Se o seu plugin registrar métodos RPC personalizados do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem para
`operator.admin`, mesmo que um plugin solicite um escopo mais restrito.

Semânticas de guarda de hook para manter em mente:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_tool_call`: `{ block: false }` é tratado como nenhuma decisão.
- `before_tool_call`: `{ requireApproval: true }` pausa a execução do agente e solicita aprovação do usuário por meio da sobreposição de aprovação de exec, botões do Telegram, interações do Discord ou do comando `/approve` em qualquer canal.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_install`: `{ block: false }` é tratado como nenhuma decisão.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade inferior.
- `message_sending`: `{ cancel: false }` é tratado como nenhuma decisão.

O comando `/approve` lida tanto com aprovações de exec quanto de plugins com fallback limitado: quando um id de aprovação de exec não é encontrado, o OpenClaw tenta novamente o mesmo id por meio das aprovações do plugin. O encaminhamento de aprovação de plugin pode ser configurado independentemente via `approvals.plugin` na config.

Se uma infraestrutura personalizada de aprovação precisar detectar esse mesmo caso de fallback limitado,
prefira `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
em vez de comparar manualmente strings de expiração de aprovação.

Consulte [SDK Overview hook decision semantics](/pt-BR/plugins/sdk-overview#hook-decision-semantics) para detalhes.

## Registrando tools de agente

Tools são funções tipadas que o LLM pode chamar. Elas podem ser obrigatórias (sempre
disponíveis) ou opcionais (opt-in do usuário):

```typescript
register(api) {
  // Tool obrigatória — sempre disponível
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Tool opcional — o usuário precisa adicionar à allowlist
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

Os usuários ativam tools opcionais na config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nomes de tools não devem conflitar com tools do core (conflitos são ignorados)
- Use `optional: true` para tools com efeitos colaterais ou requisitos extras de binários
- Os usuários podem ativar todas as tools de um plugin adicionando o id do plugin a `tools.allow`

## Convenções de importação

Sempre importe de caminhos focados `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Errado: raiz monolítica (obsoleta, será removida)
import { ... } from "openclaw/plugin-sdk";
```

Para ver a referência completa de subpaths, consulte [SDK Overview](/pt-BR/plugins/sdk-overview).

Dentro do seu plugin, use arquivos barrel locais (`api.ts`, `runtime-api.ts`) para
importações internas — nunca importe seu próprio plugin pelo caminho do SDK.

Para plugins de provedor, mantenha helpers específicos do provedor nesses barrels
da raiz do pacote, a menos que a separação seja realmente genérica. Exemplos incluídos atuais:

- Anthropic: wrappers de stream do Claude e helpers de `service_tier` / beta
- OpenAI: builders de provedor, helpers de model padrão, provedores em tempo real
- OpenRouter: builder de provedor e helpers de onboarding/config

Se um helper só for útil dentro de um pacote de provedor incluído, mantenha-o nessa
separação da raiz do pacote em vez de promovê-lo para `openclaw/plugin-sdk/*`.

Algumas separações de helper geradas `openclaw/plugin-sdk/<bundled-id>` ainda existem para
manutenção e compatibilidade de plugins incluídos, por exemplo
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Trate essas superfícies como reservadas,
não como o padrão para novos plugins de terceiros.

## Checklist pré-envio

<Check>**package.json** tem os metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos focados `plugin-sdk/<subpath>`</Check>
<Check>Importações internas usam módulos locais, não autoimportações do SDK</Check>
<Check>Os testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugins no repositório)</Check>

## Teste de beta release

1. Fique atento às tags de release do GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e assine via `Watch` > `Releases`. Tags beta têm o formato `v2026.3.N-beta.1`. Você também pode ativar notificações da conta oficial do OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de release.
2. Teste seu plugin com a tag beta assim que ela aparecer. A janela antes da versão estável normalmente é de apenas algumas horas.
3. Publique na thread do seu plugin no canal `plugin-forum` do Discord após o teste, com `all good` ou com o que falhou. Se você ainda não tiver uma thread, crie uma.
4. Se algo falhar, abra ou atualize uma issue com o título `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue na sua thread.
5. Abra uma PR para `main` com o título `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto na PR quanto na sua thread do Discord. Contribuidores não podem rotular PRs, então o título é o sinal do lado da PR para mantenedores e automação. Blockers com uma PR são mesclados; blockers sem uma podem ser lançados mesmo assim. Os mantenedores acompanham essas threads durante o teste beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entrará no próximo ciclo.

## Próximos passos

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de model
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importação e da API de registro
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

## Relacionados

- [Plugin Architecture](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura interna
- [SDK Overview](/pt-BR/plugins/sdk-overview) — referência do Plugin SDK
- [Manifest](/pt-BR/plugins/manifest) — formato do manifesto do plugin
- [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins) — criação de plugins de canal
- [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) — criação de plugins de provedor
