---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-05-07T13:22:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

O SDK de plugin é o contrato tipado entre plugins e o core. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Note>
  Esta página é para autores de plugins que usam `openclaw/plugin-sdk/*` dentro
  do OpenClaw. Para apps externos, scripts, dashboards, trabalhos de CI e extensões de IDE
  que querem executar agentes pelo Gateway, use o
  [SDK de App do OpenClaw](/pt-BR/concepts/openclaw-sdk) e o pacote `@openclaw/sdk`
  em vez disso.
</Note>

<Tip>
Procurando um guia prático? Comece com [Criando plugins](/pt-BR/plugins/building-plugins), use [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para plugins de provedor, [Plugins de backend CLI](/pt-BR/plugins/cli-backend-plugins) para backends de CLI de IA locais e [Hooks de plugin](/pt-BR/plugins/hooks) para plugins de hook de ferramenta ou ciclo de vida.
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para helpers de entrada/build específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície guarda-chuva mais ampla e helpers compartilhados como
`buildChannelConfigSchema`.

Para configuração de canal, publique o JSON Schema pertencente ao canal por meio de
`openclaw.plugin.json#channelConfigs`. O subcaminho `plugin-sdk/channel-config-schema`
é para primitivas de esquema compartilhadas e o builder genérico. Os plugins
incluídos do OpenClaw usam `plugin-sdk/bundled-channel-config-schema` para esquemas
de canais incluídos preservados. Exportações de compatibilidade obsoletas permanecem em
`plugin-sdk/channel-config-schema-legacy`; nenhum subcaminho de esquema incluído é um
padrão para novos plugins.

<Warning>
  Não importe interfaces de conveniência com marca de provedor ou canal (por exemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do core devem usar esses barrels locais do plugin
  ou adicionar um contrato de SDK genérico e estreito quando uma necessidade for realmente
  entre canais.

Um pequeno conjunto de interfaces auxiliares de plugins incluídos ainda aparece no mapa de exportação
gerado quando elas têm uso de dono rastreado. Elas existem apenas para manutenção de plugins incluídos
e não são caminhos de importação recomendados para novos plugins de terceiros.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` também são
mantidos como fachadas de compatibilidade obsoletas para uso de dono rastreado. Não
copie esses caminhos de importação para novos plugins; use helpers de runtime injetados e
subcaminhos genéricos do SDK de canal em vez disso.
</Warning>

## Referência de subcaminhos

O SDK de plugin é exposto como um conjunto de subcaminhos estreitos agrupados por área (entrada de plugin,
canal, provedor, auth, runtime, capability, memória e helpers reservados de plugins incluídos). Para o catálogo completo — agrupado e com links — consulte
[Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).

A lista gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capability

| Método                                           | O que ele registra                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)                  |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend de inferência de CLI local           |
| `api.registerChannel(...)`                       | Canal de mensagens                     |
| `api.registerSpeechProvider(...)`                | Texto para fala / síntese STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming      |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz duplex em tempo real        |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo            |
| `api.registerImageGenerationProvider(...)`       | Geração de imagens                      |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                      |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                      |
| `api.registerWebFetchProvider(...)`              | Provedor de busca / scrape na web           |
| `api.registerWebSearchProvider(...)`             | Pesquisa na web                            |

### Ferramentas e comandos

| Método                          | O que ele registra                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)             |

Comandos de plugin podem definir `agentPromptGuidance` quando o agente precisa de uma dica curta de roteamento pertencente ao comando. Mantenha esse texto sobre o próprio comando; não adicione
política específica de provedor ou plugin aos builders de prompt do core.

### Infraestrutura

| Método                                         | O que ele registra                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                              |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descoberta do Gateway local      |
| `api.registerCli(registrar, opts?)`            | Subcomando da CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI de recurso Node em `openclaw nodes` |
| `api.registerService(service)`                 | Serviço em segundo plano                      |
| `api.registerInteractiveHandler(registration)` | Handler interativo                     |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de resultado de ferramenta em runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | Seção aditiva de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de pesquisa/leitura de memória      |

### Hooks do host para plugins de fluxo de trabalho

Hooks do host são as interfaces do SDK para plugins que precisam participar do ciclo de vida do host
em vez de apenas adicionar um provedor, canal ou ferramenta. Eles são
contratos genéricos; o Modo Plano pode usá-los, mas fluxos de trabalho de aprovação,
barreiras de política de workspace, monitores em segundo plano, assistentes de configuração e plugins complementares de UI
também podem.

| Método                                                                   | Contrato que ele possui                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Estado de sessão pertencente ao plugin, compatível com JSON, projetado por meio das sessões do Gateway                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | Contexto durável exatamente uma vez injetado no próximo turno do agente para uma sessão                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | Política de ferramenta de pré-plugin incluída/confiável que pode bloquear ou reescrever parâmetros de ferramenta                                                      |
| `api.registerToolMetadata(...)`                                          | Metadados de exibição do catálogo de ferramentas sem alterar a implementação da ferramenta                                                            |
| `api.registerCommand(...)`                                               | Comandos de plugin com escopo; resultados de comando podem definir `continueAgent: true`; comandos nativos do Discord aceitam `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descritores de contribuição da UI de Controle para superfícies de sessão, ferramenta, execução ou configurações                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de limpeza para recursos de runtime pertencentes ao plugin em caminhos de reset/delete/reload                                                 |
| `api.registerAgentEventSubscription(...)`                                | Assinaturas de eventos sanitizados para estado de fluxo de trabalho e monitores                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Estado temporário por execução do plugin limpo no ciclo de vida terminal da execução                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | Registros de trabalho do agendador de sessão pertencentes ao plugin com limpeza determinística                                                             |

Os contratos dividem autoridade intencionalmente:

- Plugins externos podem possuir extensões de sessão, descritores de UI, comandos, metadados de ferramenta, injeções no próximo turno e hooks normais.
- Políticas de ferramenta confiáveis executam antes de hooks `before_tool_call` comuns e são apenas para plugins incluídos porque participam da política de segurança do host.
- A propriedade de comandos reservados é apenas para plugins incluídos. Plugins externos devem usar seus próprios nomes de comando ou aliases.
- `allowPromptInjection=false` desabilita hooks que alteram prompt, incluindo
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  campos de prompt do `before_agent_start` legado e
  `enqueueNextTurnInjection`.

Exemplos de consumidores que não são Plano:

| Arquétipo de plugin             | Hooks usados                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Fluxo de trabalho de aprovação            | Extensão de sessão, continuação de comando, injeção no próximo turno, descritor de UI                                                            |
| Barreira de política de orçamento/workspace | Política de ferramenta confiável, metadados de ferramenta, projeção de sessão                                                                                 |
| Monitor de ciclo de vida em segundo plano | Limpeza de ciclo de vida de runtime, assinatura de eventos do agente, propriedade/limpeza do agendador de sessão, contribuição de prompt de Heartbeat, descritor de UI |
| Assistente de configuração ou onboarding   | Extensão de sessão, comandos com escopo, descritor da UI de Controle                                                                              |

<Note>
  Namespaces reservados de administração do core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo se um plugin tentar atribuir um
  escopo de método do gateway mais estreito. Prefira prefixos específicos do plugin para
  métodos pertencentes ao plugin.
</Note>

<Accordion title="Quando usar middleware de resultado de ferramenta">
  Plugins incluídos podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisam reescrever o resultado de uma ferramenta após a execução e antes que o runtime
  forneça esse resultado de volta ao modelo. Esta é a interface confiável e neutra em relação ao runtime
  para redutores de saída assíncronos, como tokenjuice.

Plugins integrados devem declarar `contracts.agentToolResultMiddleware` para cada
runtime alvo, por exemplo `["pi", "codex"]`. Plugins externos
não podem registrar esse middleware; mantenha os hooks normais de Plugin do OpenClaw para trabalhos
que não precisam de temporização de resultado de ferramenta antes do modelo. O caminho antigo de
registro de fábrica de extensão incorporada somente do Pi foi removido.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um Plugin anuncie o Gateway
ativo em um transporte de descoberta local, como mDNS/Bonjour. O OpenClaw chama o
serviço durante a inicialização do Gateway quando a descoberta local está habilitada, passa as
portas atuais do Gateway e dados de dica TXT não secretos, e chama o manipulador
`stop` retornado durante o desligamento do Gateway.

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
autenticação. A descoberta é uma dica de roteamento; a autenticação do Gateway e a fixação de TLS ainda
controlam a confiança.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de comando:

- `commands`: nomes de comando explícitos pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de análise usados para ajuda da CLI,
  roteamento e registro preguiçoso da CLI do Plugin
- `parentPath`: caminho opcional do comando pai para grupos de comandos aninhados, como
  `["nodes"]`

Para recursos de nós pareados, prefira
`api.registerNodeCliFeature(registrar, opts?)`. Ele é um pequeno wrapper em torno de
`api.registerCli(..., { parentPath: ["nodes"] })` e torna comandos como
`openclaw nodes canvas` recursos de nó explicitamente pertencentes ao Plugin.

Se você quiser que um comando de Plugin continue sendo carregado preguiçosamente no caminho normal da CLI raiz,
forneça `descriptors` que cubram todas as raízes de comando de nível superior expostas por esse
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

Comandos aninhados recebem o comando pai resolvido como `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho somente quando você não precisar de registro preguiçoso da CLI raiz.
Esse caminho de compatibilidade ansioso continua sendo compatível, mas ele não instala
placeholders baseados em descritores para carregamento preguiçoso em tempo de análise.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um Plugin controle a configuração padrão de um
backend de CLI de IA local, como `codex-cli`.

- O `id` do backend se torna o prefixo de provedor em refs de modelo como `codex-cli/gpt-5`.
- A `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre a
  configuração padrão do Plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).
- Use `resolveExecutionArgs` para reescritas de argv com escopo de solicitação que pertencem ao
  dialeto da CLI, como mapear níveis de pensamento do OpenClaw para uma flag de esforço
  nativa.

Para um guia de autoria de ponta a ponta, consulte
[Plugins de backend da CLI](/pt-BR/plugins/cli-backend-plugins).

### Slots exclusivos

| Método                                     | O que ele registra                                                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mecanismo de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o mecanismo possa adaptar adições ao prompt. |
| `api.registerMemoryCapability(capability)` | Recurso de memória unificado                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                                  |

### Adaptadores de embedding de memória

| Método                                         | O que ele registra                               |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o Plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para Plugin de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que Plugins complementares consumam artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core`, em vez de acessar o layout privado de um
  Plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas de Plugin de memória compatíveis com legado.
- `MemoryFlushPlan.model` pode fixar o turno de flush a uma referência exata de `provider/model`,
  como `ollama/qwen3:8b`, sem herdar a cadeia de fallback ativa.
- `registerMemoryEmbeddingProvider` permite que o Plugin de memória ativo registre um
  ou mais ids de adaptador de embedding (por exemplo, `openai`, `gemini` ou um id personalizado
  definido pelo Plugin).
- Configurações do usuário como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` são resolvidas em relação a esses ids de
  adaptador registrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz                 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado  |
| `api.onConversationBindingResolved(handler)` | Callback de vinculação de conversa |

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para exemplos, nomes comuns de hooks e semântica
de guardas.

### Semântica de decisão de hooks

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que qualquer manipulador o define, manipuladores de prioridade mais baixa são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como ausência de decisão (o mesmo que omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Assim que qualquer manipulador o define, manipuladores de prioridade mais baixa são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como ausência de decisão (o mesmo que omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Assim que qualquer manipulador reivindica o envio, manipuladores de prioridade mais baixa e o caminho padrão de envio do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que qualquer manipulador o define, manipuladores de prioridade mais baixa são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como ausência de decisão (o mesmo que omitir `cancel`), não como uma substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos de roteamento tipados `replyToId` / `threadId` antes de recorrer a `metadata` específico do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para estado de inicialização pertencente ao Gateway, em vez de depender de hooks internos `gateway:startup`.
- `cron_changed`: observe mudanças no ciclo de vida do Cron pertencentes ao Gateway. Use `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` ao sincronizar agendadores externos de despertar, e mantenha o OpenClaw como a fonte da verdade para verificações de vencimento e execução.

### Campos do objeto da API

| Campo                    | Tipo                      | Descrição                                                                                     |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id do Plugin                                                                                  |
| `api.name`               | `string`                  | Nome de exibição                                                                              |
| `api.version`            | `string?`                 | Versão do Plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descrição do Plugin (opcional)                                                               |
| `api.source`             | `string`                  | Caminho de origem do Plugin                                                                   |
| `api.rootDir`            | `string?`                 | Diretório raiz do Plugin (opcional)                                                          |
| `api.config`             | `OpenClawConfig`          | Snapshot de configuração atual (snapshot de runtime ativo em memória quando disponível)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do Plugin de `plugins.entries.<id>.config`                            |
| `api.runtime`            | `PluginRuntime`           | [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve caminho relativo à raiz do Plugin                                                     |

## Convenção de módulo interno

Dentro do seu Plugin, use arquivos barrel locais para imports internos:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nunca importe seu próprio Plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  a partir de código de produção. Encaminhe imports internos por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de Plugin integrado carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) preferem o
snapshot de configuração de runtime ativo quando o OpenClaw já está em execução. Se ainda não houver
snapshot de runtime, elas recorrem ao arquivo de configuração resolvido no disco.
Fachadas de Plugins integrados empacotados devem ser carregadas por meio dos carregadores de fachada
de Plugin do OpenClaw; imports diretos de `dist/extensions/...` ignoram as verificações de manifesto
e sidecar de runtime que instalações empacotadas usam para código pertencente ao Plugin.

Plugins de provedor podem expor um barrel de contrato estreito local ao Plugin quando um
auxiliar é intencionalmente específico do provedor e ainda não pertence a um subcaminho
genérico do SDK. Exemplos incluídos:

- **Anthropic**: seam pública `api.ts` / `contract-api.ts` para auxiliares de
  fluxo do Claude beta-header e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta builders de provedor,
  auxiliares de modelo padrão e builders de provedor em tempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o builder de provedor
  mais auxiliares de onboarding/configuração.

<Warning>
  O código de produção da extensão também deve evitar importações de
  `openclaw/plugin-sdk/<other-plugin>`. Se um auxiliar for realmente compartilhado,
  promova-o para um subcaminho neutro do SDK, como `openclaw/plugin-sdk/speech`,
  `.../provider-model-shared` ou outra superfície orientada a capacidades, em vez de
  acoplar dois Plugins.
</Warning>

## Relacionados

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/pt-BR/plugins/sdk-entrypoints">
    Opções de `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/pt-BR/plugins/sdk-runtime">
    Referência completa do namespace `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/pt-BR/plugins/sdk-setup">
    Empacotamento, manifestos e esquemas de configuração.
  </Card>
  <Card title="Testing" icon="vial" href="/pt-BR/plugins/sdk-testing">
    Utilitários de teste e regras de lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/pt-BR/plugins/sdk-migration">
    Migração a partir de superfícies obsoletas.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura profunda e modelo de capacidades.
  </Card>
</CardGroup>
