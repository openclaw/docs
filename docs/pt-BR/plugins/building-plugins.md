---
read_when:
    - Você quer criar um novo plugin do OpenClaw
    - Você precisa de um início rápido para desenvolvimento de plugins
    - Você está adicionando um novo canal, provedor, ferramenta ou outra capacidade ao OpenClaw
sidebarTitle: Getting Started
summary: Crie seu primeiro plugin do OpenClaw em minutos
title: Criando Plugins
x-i18n:
    generated_at: "2026-04-07T05:29:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 509c1f5abe1a0a74966054ed79b71a1a7ee637a43b1214c424acfe62ddf48eef
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Criando Plugins

Plugins estendem o OpenClaw com novas capacidades: canais, provedores de modelo,
fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração
de imagem, geração de vídeo, web fetch, web search, ferramentas de agente, ou qualquer
combinação.

Você não precisa adicionar seu plugin ao repositório do OpenClaw. Publique no
[ClawHub](/pt-BR/tools/clawhub) ou no npm, e os usuários instalam com
`openclaw plugins install <package-name>`. O OpenClaw tenta o ClawHub primeiro e
recorre ao npm automaticamente.

## Pré-requisitos

- Node >= 22 e um gerenciador de pacotes (npm ou pnpm)
- Familiaridade com TypeScript (ESM)
- Para plugins no repositório: repositório clonado e `pnpm install` executado

## Que tipo de plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens (Discord, IRC etc.)
  </Card>
  <Card title="Plugin de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um provedor de modelo (LLM, proxy ou endpoint personalizado)
  </Card>
  <Card title="Plugin de ferramenta / hook" icon="wrench">
    Registre ferramentas de agente, hooks de eventos ou serviços — continue abaixo
  </Card>
</CardGroup>

Se um plugin de canal for opcional e puder não estar instalado quando o onboarding/configuração
for executado, use `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Ele produz um par de adaptador de configuração + wizard
que anuncia o requisito de instalação e falha de forma segura em gravações reais de configuração
até que o plugin seja instalado.

## Início rápido: plugin de ferramenta

Este guia cria um plugin mínimo que registra uma ferramenta de agente. Plugins de canal
e de provedor têm guias dedicados vinculados acima.

<Steps>
  <Step title="Criar o pacote e o manifesto">
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

    Todo plugin precisa de um manifesto, mesmo sem configuração. Veja
    [Manifesto](/pt-BR/plugins/manifest) para o schema completo. Os snippets canônicos de publicação no ClawHub
    ficam em `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Escrever o ponto de entrada">

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
    `defineChannelPluginEntry` — veja [Plugins de Canal](/pt-BR/plugins/sdk-channel-plugins).
    Para as opções completas de ponto de entrada, veja [Pontos de Entrada](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testar e publicar">

    **Plugins externos:** valide e publique com ClawHub, depois instale:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    O OpenClaw também verifica o ClawHub antes do npm para
    especificações simples de pacote como `@myorg/openclaw-my-plugin`.

    **Plugins no repositório:** coloque-os na árvore de workspace de plugins integrados — eles serão descobertos automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades de plugins

Um único plugin pode registrar qualquer número de capacidades por meio do objeto `api`:

| Capacidade             | Método de registro                              | Guia detalhado                                                                  |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Inferência de texto (LLM)   | `api.registerProvider(...)`                      | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins)                               |
| Backend de inferência da CLI  | `api.registerCliBackend(...)`                    | [Backends da CLI](/pt-BR/gateway/cli-backends)                                           |
| Canal / mensagens    | `api.registerChannel(...)`                       | [Plugins de Canal](/pt-BR/plugins/sdk-channel-plugins)                                 |
| Fala (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz em tempo real         | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Entendimento de mídia    | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de imagem       | `api.registerImageGenerationProvider(...)`       | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de música       | `api.registerMusicGenerationProvider(...)`       | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Ferramentas de agente            | `api.registerTool(...)`                          | Abaixo                                                                           |
| Comandos personalizados        | `api.registerCommand(...)`                       | [Pontos de Entrada](/pt-BR/plugins/sdk-entrypoints)                                        |
| Hooks de evento            | `api.registerHook(...)`                          | [Pontos de Entrada](/pt-BR/plugins/sdk-entrypoints)                                        |
| Rotas HTTP            | `api.registerHttpRoute(...)`                     | [Internos](/pt-BR/plugins/architecture#gateway-http-routes)                          |
| Subcomandos da CLI        | `api.registerCli(...)`                           | [Pontos de Entrada](/pt-BR/plugins/sdk-entrypoints)                                        |

Para a API completa de registro, veja [Visão geral do SDK](/pt-BR/plugins/sdk-overview#registration-api).

Se seu plugin registrar métodos RPC personalizados do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre são resolvidos para
`operator.admin`, mesmo que um plugin solicite um escopo mais restrito.

Semântica de guard de hooks para ter em mente:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_tool_call`: `{ block: false }` é tratado como nenhuma decisão.
- `before_tool_call`: `{ requireApproval: true }` pausa a execução do agente e solicita aprovação do usuário por meio da sobreposição de aprovação de exec, botões do Telegram, interações do Discord ou o comando `/approve` em qualquer canal.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_install`: `{ block: false }` é tratado como nenhuma decisão.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade inferior.
- `message_sending`: `{ cancel: false }` é tratado como nenhuma decisão.

O comando `/approve` lida tanto com aprovações de exec quanto de plugin com fallback limitado: quando um id de aprovação de exec não é encontrado, o OpenClaw tenta novamente o mesmo id por meio das aprovações de plugin. O encaminhamento de aprovação de plugin pode ser configurado independentemente via `approvals.plugin` na configuração.

Se uma infraestrutura personalizada de aprovação precisar detectar esse mesmo caso de fallback limitado,
prefira `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
em vez de corresponder manualmente strings de expiração de aprovação.

Veja [Semântica de decisão de hooks na visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics) para detalhes.

## Registrando ferramentas de agente

Ferramentas são funções tipadas que o LLM pode chamar. Elas podem ser obrigatórias (sempre
disponíveis) ou opcionais (adesão do usuário):

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

  // Ferramenta opcional — o usuário deve adicionar à allowlist
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

- Os nomes das ferramentas não devem entrar em conflito com ferramentas do core (conflitos são ignorados)
- Use `optional: true` para ferramentas com efeitos colaterais ou requisitos extras de binário
- Os usuários podem ativar todas as ferramentas de um plugin adicionando o id do plugin a `tools.allow`

## Convenções de importação

Sempre importe de caminhos focados `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Errado: raiz monolítica (obsoleta, será removida)
import { ... } from "openclaw/plugin-sdk";
```

Para a referência completa de subpaths, veja [Visão geral do SDK](/pt-BR/plugins/sdk-overview).

Dentro do seu plugin, use arquivos barrel locais (`api.ts`, `runtime-api.ts`) para
importações internas — nunca importe seu próprio plugin pelo caminho do SDK.

Para plugins de provedor, mantenha helpers específicos do provedor nesses barrels
na raiz do pacote, a menos que a interface seja realmente genérica. Exemplos integrados atuais:

- Anthropic: wrappers de stream do Claude e helpers `service_tier` / beta
- OpenAI: builders de provedor, helpers de modelo padrão, provedores em tempo real
- OpenRouter: builder de provedor mais helpers de onboarding/configuração

Se um helper só for útil dentro de um pacote integrado de provedor, mantenha-o nessa
interface na raiz do pacote em vez de promovê-lo para `openclaw/plugin-sdk/*`.

Algumas interfaces auxiliares geradas `openclaw/plugin-sdk/<bundled-id>` ainda existem para
manutenção e compatibilidade de plugins integrados, por exemplo
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Trate essas interfaces como
superfícies reservadas, não como o padrão para novos plugins de terceiros.

## Checklist antes do envio

<Check>**package.json** tem os metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos focados `plugin-sdk/<subpath>`</Check>
<Check>Importações internas usam módulos locais, não autoimportações do SDK</Check>
<Check>Os testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugins no repositório)</Check>

## Teste de versões Beta

1. Acompanhe tags de release do GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e inscreva-se via `Watch` > `Releases`. Tags beta têm formato como `v2026.3.N-beta.1`. Você também pode ativar notificações para a conta oficial do OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de release.
2. Teste seu plugin com a tag beta assim que ela aparecer. A janela antes da versão estável normalmente é de apenas algumas horas.
3. Publique na thread do seu plugin no canal `plugin-forum` do Discord após testar, com `all good` ou o que quebrou. Se você ainda não tiver uma thread, crie uma.
4. Se algo quebrar, abra ou atualize uma issue intitulada `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue na sua thread.
5. Abra um PR para `main` intitulado `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto na sua thread do Discord. Contribuidores não podem rotular PRs, então o título é o sinal do lado do PR para mantenedores e automação. Bloqueadores com PR são mesclados; bloqueadores sem PR podem ser enviados mesmo assim. Mantenedores acompanham essas threads durante os testes beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entrará no próximo ciclo.

## Próximos passos

<CardGroup cols={2}>
  <Card title="Plugins de Canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens
  </Card>
  <Card title="Plugins de Provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de modelo
  </Card>
  <Card title="Visão geral do SDK" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importação e da API de registro
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, search, subagente via api.runtime
  </Card>
  <Card title="Testes" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Manifesto de plugin" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do schema do manifesto
  </Card>
</CardGroup>

## Relacionados

- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — visão aprofundada da arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do Plugin SDK
- [Manifesto](/pt-BR/plugins/manifest) — formato do manifesto de plugin
- [Plugins de Canal](/pt-BR/plugins/sdk-channel-plugins) — criando plugins de canal
- [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins) — criando plugins de provedor
