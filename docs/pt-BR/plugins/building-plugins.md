---
read_when:
    - Você quer criar um novo Plugin do OpenClaw
    - Você precisa de um guia de início rápido para desenvolvimento de Plugin
    - Você está adicionando um novo canal, provedor, ferramenta ou outro recurso ao OpenClaw
sidebarTitle: Getting Started
summary: Crie seu primeiro Plugin do OpenClaw em minutos
title: Criando plugins
x-i18n:
    generated_at: "2026-04-30T09:58:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração
de imagens, geração de vídeo, busca web, pesquisa web, ferramentas de agente ou
qualquer combinação.

Você não precisa adicionar seu plugin ao repositório do OpenClaw. Publique no
[ClawHub](/pt-BR/tools/clawhub) e os usuários instalam com
`openclaw plugins install <package-name>`. O OpenClaw tenta o ClawHub primeiro e
recorre automaticamente ao npm para pacotes que ainda usam distribuição por npm.

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
    Adicione um provedor de modelo (LLM, proxy ou endpoint personalizado)
  </Card>
  <Card title="Plugin de ferramenta / hook" icon="wrench" href="/pt-BR/plugins/hooks">
    Registre ferramentas de agente, hooks de evento ou serviços — continue abaixo
  </Card>
</CardGroup>

Para um plugin de canal cuja instalação não é garantida quando onboarding/setup
é executado, use `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Ele produz um par de adaptador de setup +
assistente que anuncia o requisito de instalação e falha de forma fechada em
gravações reais de configuração até que o plugin esteja instalado.

## Início rápido: plugin de ferramenta

Este passo a passo cria um plugin mínimo que registra uma ferramenta de agente.
Plugins de canal e de provedor têm guias dedicados vinculados acima.

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

    Todo plugin precisa de um manifesto, mesmo sem configuração, e todo plugin deve
    declarar `activation.onStartup` intencionalmente. Ferramentas registradas em
    runtime precisam de importação na inicialização, então este exemplo define como
    `true`. Consulte [Manifesto](/pt-BR/plugins/manifest) para o schema completo. Os
    snippets canônicos de publicação do ClawHub ficam em `docs/snippets/plugin-publish/`.

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
    `defineChannelPluginEntry` — veja [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).
    Para todas as opções de ponto de entrada, veja [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Teste e publique">

    **Plugins externos:** valide e publique com ClawHub, depois instale:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    O OpenClaw também verifica o ClawHub antes do npm para especificações de pacote
    simples como `@myorg/openclaw-my-plugin`; o npm continua sendo um fallback para
    pacotes que ainda não migraram para o ClawHub.

    **Plugins no repositório:** coloque sob a árvore do workspace de plugins empacotados — descoberto automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Recursos de plugin

Um único plugin pode registrar qualquer número de recursos por meio do objeto `api`:

| Recurso                | Método de registro                              | Guia detalhado                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferência de texto (LLM) | `api.registerProvider(...)`                      | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins)                               |
| Backend de inferência da CLI | `api.registerCliBackend(...)`                    | [Backends da CLI](/pt-BR/gateway/cli-backends)                                           |
| Canal / mensagens      | `api.registerChannel(...)`                       | [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)                                 |
| Fala (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compreensão de mídia   | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de imagens     | `api.registerImageGenerationProvider(...)`       | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de música      | `api.registerMusicGenerationProvider(...)`       | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Busca web              | `api.registerWebFetchProvider(...)`              | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pesquisa web           | `api.registerWebSearchProvider(...)`             | [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de resultado de ferramenta | `api.registerAgentToolResultMiddleware(...)`     | [Visão geral do SDK](/pt-BR/plugins/sdk-overview#registration-api)                          |
| Ferramentas de agente  | `api.registerTool(...)`                          | Abaixo                                                                          |
| Comandos personalizados | `api.registerCommand(...)`                       | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                        |
| Hooks de plugin        | `api.on(...)`                                    | [Hooks de plugin](/pt-BR/plugins/hooks)                                                  |
| Hooks de evento internos | `api.registerHook(...)`                          | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                        |
| Rotas HTTP             | `api.registerHttpRoute(...)`                     | [Internos](/pt-BR/plugins/architecture-internals#gateway-http-routes)                |
| Subcomandos da CLI     | `api.registerCli(...)`                           | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                        |

Para a API de registro completa, veja [Visão geral do SDK](/pt-BR/plugins/sdk-overview#registration-api).

Plugins empacotados podem usar `api.registerAgentToolResultMiddleware(...)` quando
precisam reescrever resultados de ferramentas de forma assíncrona antes que o
modelo veja a saída. Declare os runtimes visados em
`contracts.agentToolResultMiddleware`, por exemplo `["pi", "codex"]`. Esta é uma
interface confiável para plugins empacotados; plugins externos devem preferir os
hooks regulares de plugin do OpenClaw, a menos que o OpenClaw desenvolva uma
política de confiança explícita para esse recurso.

Se seu plugin registrar métodos RPC personalizados do Gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
resolvem para `operator.admin`, mesmo se um plugin solicitar um escopo mais
restrito.

Semântica de guarda de hooks a considerar:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_tool_call`: `{ block: false }` é tratado como nenhuma decisão.
- `before_tool_call`: `{ requireApproval: true }` pausa a execução do agente e solicita aprovação do usuário via overlay de aprovação de exec, botões do Telegram, interações do Discord ou o comando `/approve` em qualquer canal.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_install`: `{ block: false }` é tratado como nenhuma decisão.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `message_sending`: `{ cancel: false }` é tratado como nenhuma decisão.
- `message_received`: prefira o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: prefira os campos de roteamento tipados `replyToId` / `threadId` em vez de chaves de metadados específicas do canal.

O comando `/approve` lida tanto com aprovações de exec quanto de plugin com
fallback limitado: quando um id de aprovação de exec não é encontrado, o
OpenClaw tenta novamente o mesmo id por meio das aprovações de plugin. O
encaminhamento de aprovação de plugin pode ser configurado independentemente via
`approvals.plugin` na configuração.

Se encanamento personalizado de aprovação precisar detectar esse mesmo caso de
fallback limitado, prefira `isApprovalNotFoundError` de
`openclaw/plugin-sdk/error-runtime` em vez de corresponder manualmente a strings
de expiração de aprovação.

Veja [Hooks de plugin](/pt-BR/plugins/hooks) para exemplos e a referência de hooks.

## Registrando ferramentas de agente

Ferramentas são funções tipadas que o LLM pode chamar. Elas podem ser obrigatórias
(sempre disponíveis) ou opcionais (opt-in do usuário):

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

Usuários habilitam ferramentas opcionais na configuração:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nomes de ferramentas não devem conflitar com ferramentas do core (conflitos são ignorados)
- Ferramentas com objetos de registro malformados, incluindo `parameters` ausente, são ignoradas e reportadas em diagnósticos de plugin em vez de interromper execuções de agentes
- Use `optional: true` para ferramentas com efeitos colaterais ou requisitos extras de binário
- Usuários podem habilitar todas as ferramentas de um plugin adicionando o id do plugin a `tools.allow`

## Convenções de importação

Sempre importe de caminhos focados `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Para a referência completa de subcaminhos, consulte [Visão geral do SDK](/pt-BR/plugins/sdk-overview).

Dentro do seu Plugin, use arquivos barrel locais (`api.ts`, `runtime-api.ts`) para
importações internas — nunca importe seu próprio Plugin pelo caminho do SDK dele.

Para Plugins de provedor, mantenha helpers específicos do provedor nos barrels
da raiz desse pacote, a menos que a interface seja realmente genérica. Exemplos empacotados atuais:

- Anthropic: wrappers de stream do Claude e helpers de `service_tier` / beta
- OpenAI: builders de provedor, helpers de modelo padrão, provedores realtime
- OpenRouter: builder de provedor mais helpers de onboarding/configuração

Se um helper só for útil dentro de um pacote de provedor empacotado, mantenha-o nessa
interface da raiz do pacote em vez de promovê-lo para `openclaw/plugin-sdk/*`.

Algumas interfaces auxiliares geradas de `openclaw/plugin-sdk/<bundled-id>` ainda existem para
manutenção de Plugins empacotados quando têm uso rastreado pelo proprietário. Trate-as como
superfícies reservadas, não como o padrão predefinido para novos Plugins de terceiros.

## Checklist de pré-envio

<Check>**package.json** tem os metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos focados de `plugin-sdk/<subpath>`</Check>
<Check>Importações internas usam módulos locais, não autoimportações pelo SDK</Check>
<Check>Os testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugins no repositório)</Check>

## Testes de versão beta

1. Acompanhe tags de lançamento do GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e assine via `Watch` > `Releases`. Tags beta se parecem com `v2026.3.N-beta.1`. Você também pode ativar notificações para a conta oficial da OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de lançamento.
2. Teste seu Plugin com a tag beta assim que ela aparecer. A janela antes da estável normalmente é de apenas algumas horas.
3. Publique na thread do seu Plugin no canal `plugin-forum` do Discord após testar, com `all good` ou o que quebrou. Se ainda não tiver uma thread, crie uma.
4. Se algo quebrar, abra ou atualize uma issue intitulada `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue na sua thread.
5. Abra um PR para `main` intitulado `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto na sua thread do Discord. Colaboradores não podem rotular PRs, então o título é o sinal do lado do PR para mantenedores e automação. Bloqueadores com PR são mesclados; bloqueadores sem um podem ser lançados mesmo assim. Mantenedores acompanham essas threads durante os testes beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entrará no próximo ciclo.

## Próximos passos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um Plugin de canal de mensagens
  </Card>
  <Card title="Plugins de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um Plugin de provedor de modelo
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
  <Card title="Manifesto do Plugin" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do esquema do manifesto
  </Card>
</CardGroup>

## Relacionado

- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
- [Manifesto](/pt-BR/plugins/manifest) — formato do manifesto de Plugin
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criação de Plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — criação de Plugins de provedor
