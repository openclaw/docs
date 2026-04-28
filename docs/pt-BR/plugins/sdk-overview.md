---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

O SDK de Plugin é o contrato tipado entre plugins e o core. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Tip>
  Procurando um guia prático?

- Primeiro Plugin? Comece com [Criando plugins](/pt-BR/plugins/building-plugins).
- Plugin de canal? Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).
- Plugin de provedor? Consulte [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins).
- Plugin de ferramenta ou hook de ciclo de vida? Consulte [Hooks de Plugin](/pt-BR/plugins/hooks).
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para helpers específicos de entry/build de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície guarda-chuva mais ampla e helpers compartilhados como
`buildChannelConfigSchema`.

Para configuração de canal, publique o JSON Schema controlado pelo canal por meio de
`openclaw.plugin.json#channelConfigs`. O subcaminho `plugin-sdk/channel-config-schema`
é para primitivos de schema compartilhados e o builder genérico. Quaisquer exportações de schema
nomeadas por canal incluído nesse subcaminho são exportações legadas de compatibilidade, não um padrão para novos plugins.

<Warning>
  Não importe seções convenientes com marca de provedor ou canal (por exemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do core devem usar esses barrels locais do plugin
  ou adicionar um contrato SDK genérico e restrito quando a necessidade for realmente
  entre canais.

Um pequeno conjunto de helpers de plugins incluídos (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` e semelhantes) ainda aparece no mapa de exportação gerado.
Eles existem apenas para manutenção de plugins incluídos e não são caminhos de importação recomendados para novos plugins de terceiros.
</Warning>

## Referência de subcaminhos

O SDK de Plugin é exposto como um conjunto de subcaminhos restritos agrupados por área (entry
de plugin, canal, provedor, autenticação, runtime, capacidade, memória e helpers
reservados de plugins incluídos). Para o catálogo completo — agrupado e com links — consulte
[Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).

A lista gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Método                                           | O que registra                        |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência por CLI   |
| `api.registerChannel(...)`                       | Canal de mensagens                    |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões duplex de voz em tempo real   |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo         |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem                     |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                     |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                      |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/scrape web          |
| `api.registerWebSearchProvider(...)`             | Busca na web                          |

### Ferramentas e comandos

| Método                          | O que registra                                |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)          |

### Infraestrutura

| Método                                         | O que registra                          |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway                |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                   |
| `api.registerGatewayDiscoveryService(service)` | Anunciante local de descoberta do Gateway |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                       |
| `api.registerService(service)`                 | Serviço em segundo plano                |
| `api.registerInteractiveHandler(registration)` | Handler interativo                      |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de resultado de ferramenta em runtime |
| `api.registerMemoryPromptSupplement(builder)`  | Seção aditiva de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de busca/leitura de memória |

<Note>
  Namespaces administrativos reservados do core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo que um plugin tente atribuir um
  escopo mais restrito para método do gateway. Prefira prefixos específicos do plugin para
  métodos pertencentes ao plugin.
</Note>

<Accordion title="Quando usar middleware de resultado de ferramenta">
  Plugins incluídos podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisam reescrever um resultado de ferramenta após a execução e antes que o runtime
  devolva esse resultado ao modelo. Essa é a seção confiável e neutra de runtime para
  redutores assíncronos de saída, como tokenjuice.

Plugins incluídos devem declarar `contracts.agentToolResultMiddleware` para cada
runtime alvo, por exemplo `["pi", "codex"]`. Plugins externos
não podem registrar esse middleware; mantenha hooks normais de Plugin do OpenClaw para trabalhos
que não precisam do timing de resultado de ferramenta antes do modelo. O antigo caminho de registro
de factory de extensão incorporada exclusivo de Pi foi removido.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um plugin anuncie o Gateway ativo
em um transporte local de descoberta, como mDNS/Bonjour. O OpenClaw chama o
serviço durante a inicialização do Gateway quando a descoberta local está habilitada, passa as
portas atuais do Gateway e dados não secretos de dica TXT e chama o handler `stop`
retornado durante o desligamento do Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Plugins de descoberta do Gateway não devem tratar valores TXT anunciados como segredos ou
autenticação. Descoberta é uma dica de roteamento; a confiança continua sendo controlada pela autenticação do Gateway e pinagem TLS.

### Metadados de registro de CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes de comando explícitas controladas pelo registrador
- `descriptors`: descritores de comando em tempo de parsing usados para help da CLI raiz,
  roteamento e registro lazy de CLI do plugin

Se você quiser que um comando de plugin permaneça com carregamento lazy no caminho normal da CLI raiz,
forneça `descriptors` que cubram toda raiz de comando de nível superior exposta por aquele
registrador.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Gerenciar contas Matrix, verificação, dispositivos e estado de perfil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando não precisar de registro lazy na CLI raiz. Esse caminho de compatibilidade eager continua compatível, mas não instala placeholders apoiados por descritores para carregamento lazy em tempo de parsing.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que um plugin controle a configuração padrão de um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em model refs como `codex-cli/gpt-5`.
- O `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário continua tendo precedência. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).

### Slots exclusivos

| Método                                     | O que registra                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o engine possa ajustar adições de prompt. |
| `api.registerMemoryCapability(capability)` | Capacidade unificada de memória                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder de seção de prompt de memória                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver de plano de flush de memória                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                 |

### Adaptadores de embedding de memória

| Método                                         | O que registra                                 |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryCapability` é a API preferida de plugin exclusivo de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins complementares consumam artefatos exportados de memória por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um plugin específico de memória.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs legadas compatíveis de plugin exclusivo de memória.
- `registerMemoryEmbeddingProvider` permite que o plugin ativo de memória registre um
  ou mais ids de adaptador de embedding (por exemplo `openai`, `gemini` ou um id
  personalizado definido pelo plugin).
- Configurações do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, são resolvidas em relação a esses ids de adaptador registrados.

### Eventos e ciclo de vida

| Método                                       | O que faz                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida |
| `api.onConversationBindingResolved(handler)` | Callback de vinculação de conversa |

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para exemplos, nomes comuns de hooks e semântica
de guard.

### Semântica de decisão de hook

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade mais baixa serão ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade mais baixa serão ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Assim que qualquer handler assumir o dispatch, handlers de prioridade mais baixa e o caminho padrão de dispatch do modelo serão ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade mais baixa serão ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (igual a omitir `cancel`), não como uma substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos tipados de roteamento `replyToId` / `threadId` antes de recorrer a `metadata` específica do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para estado de inicialização controlado pelo gateway em vez de depender de hooks internos `gateway:startup`.

### Campos do objeto API

| Campo                    | Tipo                      | Descrição                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id do Plugin                                                                               |
| `api.name`               | `string`                  | nome de exibição                                                                           |
| `api.version`            | `string?`                 | versão do Plugin (opcional)                                                                |
| `api.description`        | `string?`                 | descrição do Plugin (opcional)                                                             |
| `api.source`             | `string`                  | caminho de origem do Plugin                                                                |
| `api.rootDir`            | `string?`                 | diretório raiz do Plugin (opcional)                                                        |
| `api.config`             | `OpenClawConfig`          | snapshot atual da configuração (snapshot ativo em memória do runtime quando disponível)    |
| `api.pluginConfig`       | `Record<string, unknown>` | configuração específica do Plugin de `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | logger com escopo (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | modo atual de carregamento; `"setup-runtime"` é a janela leve de inicialização/setup antes da entry completa |
| `api.resolvePath(input)` | `(string) => string`      | resolve caminho relativo à raiz do Plugin                                                  |

## Convenção de módulos internos

Dentro do seu Plugin, use arquivos barrel locais para imports internos:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações internas apenas de runtime
  index.ts          # Ponto de entrada do Plugin
  setup-entry.ts    # Entry leve apenas para setup (opcional)
```

<Warning>
  Nunca importe seu próprio Plugin via `openclaw/plugin-sdk/<your-plugin>`
  a partir de código de produção. Encaminhe imports internos por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de plugins incluídos carregadas por facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) preferem o
snapshot de configuração ativo do runtime quando o OpenClaw já está em execução. Se ainda não existir
um snapshot de runtime, elas recorrem ao arquivo de configuração resolvido no disco.

Plugins de provedor podem expor um barrel de contrato local e restrito do plugin quando um
helper for intencionalmente específico do provedor e ainda não pertencer a um subcaminho genérico do SDK.
Exemplos incluídos:

- **Anthropic**: seção pública `api.ts` / `contract-api.ts` para helpers de
  beta-header do Claude e stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta builders de provedor,
  helpers de modelo padrão e builders de provedor em tempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o builder do provedor
  além de helpers de onboarding/configuração.

<Warning>
  Código de produção de extensões também deve evitar imports de `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o para um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada por capacidade em vez de acoplar dois plugins.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pontos de entrada" icon="door-open" href="/pt-BR/plugins/sdk-entrypoints">
    Opções de `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpers de runtime" icon="gears" href="/pt-BR/plugins/sdk-runtime">
    Referência completa do namespace `api.runtime`.
  </Card>
  <Card title="Setup e configuração" icon="sliders" href="/pt-BR/plugins/sdk-setup">
    Empacotamento, manifests e schemas de configuração.
  </Card>
  <Card title="Testes" icon="vial" href="/pt-BR/plugins/sdk-testing">
    Utilitários de teste e regras de lint.
  </Card>
  <Card title="Migração do SDK" icon="arrows-turn-right" href="/pt-BR/plugins/sdk-migration">
    Migração a partir de superfícies descontinuadas.
  </Card>
  <Card title="Internos do Plugin" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura profunda e modelo de capacidades.
  </Card>
</CardGroup>
