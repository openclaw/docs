---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência de todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T06:04:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7090e13508382a68988f3d345bf12d6f3822c499e01a3affb1fa7a277b22f276
    source_path: plugins/sdk-overview.md
    workflow: 15
---

O SDK de Plugin é o contrato tipado entre Plugins e o núcleo. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Tip>
  Está procurando um guia prático em vez disso?

- Primeiro Plugin? Comece com [Criando Plugins](/pt-BR/plugins/building-plugins).
- Plugin de canal? Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).
- Plugin de provedor? Consulte [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins).
  </Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para helpers de entry/build específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

<Warning>
  Não importe seams de conveniência com marca de provedor ou canal (por exemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do núcleo devem usar esses barrels locais do Plugin
  ou adicionar um contrato genérico e restrito do SDK quando a necessidade for realmente
  entre canais.

Um pequeno conjunto de seams auxiliares de Plugins incluídos (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` e semelhantes) ainda aparece no
mapa de exportação gerado. Eles existem apenas para manutenção de Plugins incluídos e
não são caminhos de importação recomendados para novos Plugins de terceiros.
</Warning>

## Referência de subcaminhos

O SDK de Plugin é exposto como um conjunto de subcaminhos restritos agrupados por área (entry
de Plugin, canal, provedor, autenticação, runtime, capacidade, memória e helpers
reservados para Plugins incluídos). Para o catálogo completo — agrupado e com links — consulte
[Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).

A lista gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Method                                           | O que registra                         |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)              |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência por CLI    |
| `api.registerChannel(...)`                       | Canal de mensagens                     |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT       |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição realtime em streaming      |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz realtime duplex         |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo          |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem                      |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                      |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                       |
| `api.registerWebFetchProvider(...)`              | Provedor de web fetch / scraping       |
| `api.registerWebSearchProvider(...)`             | Pesquisa na web                        |

### Ferramentas e comandos

| Method                          | O que registra                                |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (contorna o LLM)        |

### Infraestrutura

| Method                                          | O que registra                          |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                          |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP do Gateway                |
| `api.registerGatewayMethod(name, handler)`      | Método RPC do Gateway                   |
| `api.registerCli(registrar, opts?)`             | Subcomando CLI                          |
| `api.registerService(service)`                  | Serviço em segundo plano                |
| `api.registerInteractiveHandler(registration)`  | Handler interativo                      |
| `api.registerEmbeddedExtensionFactory(factory)` | Factory de extensão do runner Pi incorporado |
| `api.registerMemoryPromptSupplement(builder)`   | Seção aditiva de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de busca/leitura em memória |

<Note>
  Namespaces administrativos reservados do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo que um Plugin tente atribuir um
  escopo mais restrito a um método de gateway. Prefira prefixos específicos do Plugin para
  métodos que pertencem ao Plugin.
</Note>

<Accordion title="Quando usar registerEmbeddedExtensionFactory">
  Use `api.registerEmbeddedExtensionFactory(...)` quando um Plugin precisar de sincronização
  de eventos nativa de Pi durante execuções incorporadas do OpenClaw — por exemplo, reescritas assíncronas de
  `tool_result` que precisam ocorrer antes de a mensagem final de resultado da ferramenta ser emitida.

Hoje isso é um seam de Plugin incluído: apenas Plugins incluídos podem registrar um,
e eles devem declarar `contracts.embeddedExtensionFactories: ["pi"]` em
`openclaw.plugin.json`. Mantenha hooks normais de Plugin do OpenClaw para tudo que
não exige esse seam de nível mais baixo.
</Accordion>

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes explícitas de comando pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de parsing usados para ajuda da CLI raiz,
  roteamento e registro lazy da CLI do Plugin

Se você quiser que um comando de Plugin permaneça lazy-loaded no caminho normal da CLI raiz,
forneça `descriptors` que cubram toda raiz de comando de nível superior exposta por esse
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando não precisar de registro lazy da CLI raiz.
Esse caminho compatível e eager continua suportado, mas não instala
placeholders respaldados por descriptor para lazy loading em tempo de parsing.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que um Plugin controle a configuração padrão de um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em refs de modelo como `codex-cli/gpt-5`.
- A `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do Plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após o merge
  (por exemplo, normalizando formatos antigos de flags).

### Slots exclusivos

| Method                                     | O que registra                                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o motor possa ajustar adições ao prompt. |
| `api.registerMemoryCapability(capability)` | Capacidade unificada de memória                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Builder de seção de prompt de memória                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                             |

### Adaptadores de embedding de memória

| Method                                         | O que registra                                 |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o Plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida de Plugin de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que Plugins complementares consumam artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um Plugin
  de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas legadas e compatíveis para Plugins de memória.
- `registerMemoryEmbeddingProvider` permite que o Plugin de memória ativo registre um
  ou mais IDs de adaptador de embedding (por exemplo `openai`, `gemini` ou um ID personalizado definido pelo Plugin).
- Configuração do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, é resolvida em relação a esses IDs de adaptador registrados.

### Eventos e ciclo de vida

| Method                                       | O que faz                   |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida |
| `api.onConversationBindingResolved(handler)` | Callback de binding de conversa |

### Semântica de decisão de hook

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade inferior são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como substituição.
- `before_install`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade inferior são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Assim que qualquer handler assumir o despacho, handlers de prioridade inferior e o caminho padrão de despacho do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade inferior são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (igual a omitir `cancel`), não como substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de entrada por thread/tópico. Mantenha `metadata` para extras específicos de canal.
- `message_sending`: use os campos tipados de roteamento `replyToId` / `threadId` antes de recorrer a `metadata` específica de canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para estado de inicialização pertencente ao gateway em vez de depender de hooks internos `gateway:startup`.

### Campos do objeto API

| Field                    | Type                      | Descrição                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID do Plugin                                                                               |
| `api.name`               | `string`                  | Nome de exibição                                                                           |
| `api.version`            | `string?`                 | Versão do Plugin (opcional)                                                                |
| `api.description`        | `string?`                 | Descrição do Plugin (opcional)                                                             |
| `api.source`             | `string`                  | Caminho de origem do Plugin                                                                |
| `api.rootDir`            | `string?`                 | Diretório raiz do Plugin (opcional)                                                        |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da configuração (snapshot ativo de runtime na memória quando disponível)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do Plugin em `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve caminho relativo à raiz do Plugin                                                  |

## Convenção de módulo interno

Dentro do seu Plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações internas apenas para runtime
  index.ts          # Ponto de entrada do Plugin
  setup-entry.ts    # Entry leve apenas para configuração (opcional)
```

<Warning>
  Nunca importe seu próprio Plugin por `openclaw/plugin-sdk/<your-plugin>`
  em código de produção. Encaminhe importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de Plugins incluídos carregadas por facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos públicos semelhantes) preferem o
snapshot ativo da configuração de runtime quando o OpenClaw já está em execução. Se ainda não existir um snapshot
de runtime, elas recorrem à configuração resolvida em disco.

Plugins de provedor podem expor um barrel de contrato local e restrito do Plugin quando um
helper é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico do SDK. Exemplos incluídos:

- **Anthropic**: seam público `api.ts` / `contract-api.ts` para
  cabeçalho beta do Claude e helpers de stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta builders de provedor,
  helpers de modelo padrão e builders de provedor realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o builder de provedor
  mais helpers de onboarding/configuração.

<Warning>
  O código de produção de extensões também deve evitar importações `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o para um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada por capacidade, em vez de acoplar dois Plugins entre si.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pontos de entrada" icon="door-open" href="/pt-BR/plugins/sdk-entrypoints">
    Opções de `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpers de runtime" icon="gears" href="/pt-BR/plugins/sdk-runtime">
    Referência completa do namespace `api.runtime`.
  </Card>
  <Card title="Configuração inicial e config" icon="sliders" href="/pt-BR/plugins/sdk-setup">
    Empacotamento, manifestos e schemas de configuração.
  </Card>
  <Card title="Testes" icon="vial" href="/pt-BR/plugins/sdk-testing">
    Utilitários de teste e regras de lint.
  </Card>
  <Card title="Migração do SDK" icon="arrows-turn-right" href="/pt-BR/plugins/sdk-migration">
    Migração de superfícies obsoletas.
  </Card>
  <Card title="Internals de Plugin" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura profunda e modelo de capacidades.
  </Card>
</CardGroup>
