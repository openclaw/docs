---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

O SDK de plugins é o contrato tipado entre plugins e o núcleo. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Note>
  Esta página é para autores de plugins que usam `openclaw/plugin-sdk/*` dentro do
  OpenClaw. Para apps externos, scripts, dashboards, trabalhos de CI e extensões
  de IDE que querem executar agentes por meio do Gateway, use o
  [OpenClaw App SDK](/pt-BR/concepts/openclaw-sdk) e o pacote `@openclaw/sdk`
  em vez disso.
</Note>

<Tip>
Procurando um guia prático? Comece com [Criação de plugins](/pt-BR/plugins/building-plugins), use [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para plugins de provedor, [Plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins) para backends locais de CLI de IA, e [Hooks de plugin](/pt-BR/plugins/hooks) para plugins de hook de ferramenta ou ciclo de vida.
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
a superfície guarda-chuva mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

Para configuração de canal, publique o JSON Schema pertencente ao canal por meio de
`openclaw.plugin.json#channelConfigs`. O subcaminho `plugin-sdk/channel-config-schema`
é para primitivas de schema compartilhadas e o builder genérico. Os plugins incluídos do OpenClaw
usam `plugin-sdk/bundled-channel-config-schema` para schemas mantidos de canais incluídos.
Exportações de compatibilidade obsoletas permanecem em
`plugin-sdk/channel-config-schema-legacy`; nenhum dos subcaminhos de schema incluído é um
padrão para novos plugins.

<Warning>
  Não importe seams de conveniência com marca de provedor ou canal (por exemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do núcleo devem usar esses barrels locais do plugin
  ou adicionar um contrato genérico estreito do SDK quando a necessidade for realmente
  entre canais.

Um pequeno conjunto de seams auxiliares de plugins incluídos ainda aparece no mapa de exportação
gerado quando há uso rastreado pelo proprietário. Eles existem apenas para manutenção de plugins
incluídos e não são caminhos de importação recomendados para novos plugins de terceiros.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` também são
mantidos como facades de compatibilidade obsoletas para uso rastreado pelo proprietário. Não
copie esses caminhos de importação para novos plugins; use helpers de runtime injetados e
subcaminhos genéricos do SDK de canal em vez disso.
</Warning>

## Referência de subcaminhos

O SDK de plugins é exposto como um conjunto de subcaminhos estreitos agrupados por área (entrada de plugin,
canal, provedor, autenticação, runtime, capability, memória e helpers reservados de
plugins incluídos). Para o catálogo completo — agrupado e vinculado — consulte
[Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).

O inventário de pontos de entrada do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações de pacote são geradas a partir
do subconjunto público após subtrair os subcaminhos de teste/internos locais do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Execute
`pnpm plugin-sdk:surface` para auditar a contagem de exportações públicas. Subcaminhos públicos
obsoletos que são antigos o suficiente e não usados por código de produção de extensões incluídas são
rastreados em `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrels amplos
obsoletos de reexportação são rastreados em
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capability

| Método                                           | O que ele registra                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)                  |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência de CLI           |
| `api.registerChannel(...)`                       | Canal de mensagens                     |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming      |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz duplex em tempo real        |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo            |
| `api.registerImageGenerationProvider(...)`       | Geração de imagens                      |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                      |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                      |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/coleta na web           |
| `api.registerWebSearchProvider(...)`             | Pesquisa na web                            |

### Ferramentas e comandos

| Método                          | O que ele registra                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)             |

Comandos de plugin podem definir `agentPromptGuidance` quando o agente precisa de uma dica curta
de roteamento pertencente ao comando. Mantenha esse texto sobre o próprio comando; não adicione
política específica de provedor ou plugin aos builders de prompts do núcleo.

### Infraestrutura

| Método                                         | O que ele registra                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                              |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descoberta do Gateway local      |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI de recurso Node em `openclaw nodes` |
| `api.registerService(service)`                 | Serviço em segundo plano                      |
| `api.registerInteractiveHandler(registration)` | Handler interativo                     |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de resultado de ferramenta em runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | Seção de prompt aditiva adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de pesquisa/leitura de memória      |

### Hooks de host para plugins de workflow

Hooks de host são as seams do SDK para plugins que precisam participar do ciclo de vida
do host em vez de apenas adicionar um provedor, canal ou ferramenta. Eles são
contratos genéricos; o Plan Mode pode usá-los, mas fluxos de aprovação,
gates de política de workspace, monitores em segundo plano, assistentes de configuração e plugins
companheiros de UI também podem.

| Método                                                                               | Contrato que ele possui                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sessão pertencente ao plugin e compatível com JSON, projetado por meio de sessões do Gateway                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto durável exatamente uma vez injetado na próxima rodada do agente para uma sessão                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de ferramenta pré-plugin incluída/confiável que pode bloquear ou reescrever parâmetros de ferramenta                                                      |
| `api.registerToolMetadata(...)`                                                      | Metadados de exibição do catálogo de ferramentas sem alterar a implementação da ferramenta                                                            |
| `api.registerCommand(...)`                                                           | Comandos de plugin com escopo; resultados de comando podem definir `continueAgent: true`; comandos nativos do Discord aceitam `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descritores de contribuição de UI de controle para superfícies de sessão, ferramenta, execução ou configurações                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de limpeza para recursos de runtime pertencentes ao plugin em caminhos de reset/delete/reload                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Assinaturas de eventos sanitizadas para estado de workflow e monitores                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporário por execução do plugin limpo no ciclo de vida terminal da execução                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadados de limpeza para trabalhos de scheduler pertencentes ao plugin; não agenda trabalho nem cria registros de tarefa                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de anexo de arquivo mediada pelo host e apenas para incluídos para a rota direta de saída ativa da sessão                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Rodadas de sessão agendadas com base em Cron e apenas para incluídos, mais limpeza baseada em tags                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | Ações de sessão tipadas que clientes podem despachar por meio do Gateway                                                                    |

Use os namespaces agrupados para novo código de plugin:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Os métodos planos equivalentes permanecem disponíveis como aliases de compatibilidade
obsoletos para plugins existentes. Não adicione novo código de plugin que chame
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ou
`api.unscheduleSessionTurnsByTag` diretamente.

`scheduleSessionTurn(...)` é uma conveniência com escopo de sessão sobre o agendador Cron do Gateway. Cron é responsável pelo tempo e cria o registro da tarefa em segundo plano quando o turno é executado; o SDK de Plugin apenas restringe a sessão de destino, a nomenclatura pertencente ao plugin e a limpeza. Use `api.runtime.tasks.managedFlows` dentro do turno agendado quando o trabalho em si precisar de estado durável de Task Flow em várias etapas.

Os contratos dividem a autoridade intencionalmente:

- Plugins externos podem possuir extensões de sessão, descritores de UI, comandos, metadados de ferramentas, injeções no próximo turno e hooks normais.
- Políticas de ferramentas confiáveis são executadas antes dos hooks `before_tool_call` comuns e são apenas para plugins incluídos no pacote porque participam da política de segurança do host.
- A propriedade de comandos reservados é apenas para plugins incluídos no pacote. Plugins externos devem usar seus próprios nomes de comando ou aliases.
- `allowPromptInjection=false` desabilita hooks que modificam prompts, incluindo `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, campos de prompt do `before_agent_start` legado e `enqueueNextTurnInjection`.

Exemplos de consumidores que não são Plan:

| Arquétipo de plugin          | Hooks usados                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Fluxo de aprovação           | Extensão de sessão, continuação de comando, injeção no próximo turno, descritor de UI                                                  |
| Gate de política de orçamento/workspace | Política de ferramenta confiável, metadados de ferramenta, projeção de sessão                                             |
| Monitor de ciclo de vida em segundo plano | Limpeza de ciclo de vida em runtime, assinatura de evento do agente, propriedade/limpeza do agendador de sessão, contribuição de prompt de heartbeat, descritor de UI |
| Assistente de configuração ou onboarding | Extensão de sessão, comandos com escopo, descritor de UI de controle                                                        |

<Note>
  Namespaces administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem como `operator.admin`, mesmo que um plugin tente atribuir um
  escopo de método de gateway mais restrito. Prefira prefixos específicos do plugin para
  métodos pertencentes ao plugin.
</Note>

<Accordion title="Quando usar middleware de resultado de ferramenta">
  Plugins incluídos no pacote podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisam reescrever um resultado de ferramenta após a execução e antes que o runtime
  alimente esse resultado de volta ao modelo. Esta é a integração confiável e neutra em relação ao runtime
  para redutores de saída assíncronos como tokenjuice.

Plugins incluídos no pacote devem declarar `contracts.agentToolResultMiddleware` para cada
runtime de destino, por exemplo `["pi", "codex"]`. Plugins externos
não podem registrar este middleware; mantenha os hooks normais de plugin do OpenClaw para trabalhos
que não precisam do tempo de resultado de ferramenta antes do modelo. O antigo caminho de registro
da fábrica de extensão embutida somente para Pi foi removido.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um plugin anuncie o Gateway ativo
em um transporte de descoberta local, como mDNS/Bonjour. O OpenClaw chama o
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
são responsáveis pela confiança.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de comando:

- `commands`: nomes de comando explícitos pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de análise usados para ajuda da CLI,
  roteamento e registro preguiçoso da CLI de plugin
- `parentPath`: caminho opcional do comando pai para grupos de comandos aninhados, como
  `["nodes"]`

Para recursos de nó pareado, prefira
`api.registerNodeCliFeature(registrar, opts?)`. Ele é um pequeno wrapper em torno de
`api.registerCli(..., { parentPath: ["nodes"] })` e torna comandos como
`openclaw nodes canvas` recursos de nó explicitamente pertencentes ao plugin.

Se você quiser que um comando de plugin permaneça carregado de forma preguiçosa no caminho normal da CLI raiz,
forneça `descriptors` que cubram cada raiz de comando de nível superior exposta por esse
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

Use `commands` sozinho apenas quando você não precisar de registro preguiçoso da CLI raiz.
Esse caminho de compatibilidade ansioso continua compatível, mas não instala
placeholders baseados em descritores para carregamento preguiçoso em tempo de análise.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um plugin possua a configuração padrão para um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provider em referências de modelo como `codex-cli/gpt-5`.
- A `config` do backend usa o mesmo formato que `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).
- Use `resolveExecutionArgs` para reescritas de argv com escopo de solicitação que pertencem ao
  dialeto da CLI, como mapear níveis de raciocínio do OpenClaw para uma flag de esforço nativa.

Para um guia de autoria completo, consulte
[plugins de backend da CLI](/pt-BR/plugins/cli-backend-plugins).

### Slots exclusivos

| Método                                     | O que registra                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o motor possa ajustar adições ao prompt. |
| `api.registerMemoryCapability(capability)` | Capacidade de memória unificada                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                          |

### Adaptadores de embedding de memória

| Método                                         | O que registra                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para plugins de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins complementares possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um plugin
  de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas de plugin de memória compatíveis com legado.
- `MemoryFlushPlan.model` pode fixar o turno de flush em uma referência exata de `provider/model`,
  como `ollama/qwen3:8b`, sem herdar a cadeia de fallback ativa.
- `registerMemoryEmbeddingProvider` permite que o plugin de memória ativo registre um
  ou mais ids de adaptador de embedding (por exemplo, `openai`, `gemini` ou um id personalizado
  definido pelo plugin).
- Configurações do usuário como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` são resolvidas contra esses ids de adaptador
  registrados.

### Eventos e ciclo de vida

| Método                                       | O que faz                      |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida  |
| `api.onConversationBindingResolved(handler)` | Callback de vínculo de conversa |

Consulte [Hooks de plugin](/pt-BR/plugins/hooks) para exemplos, nomes comuns de hooks e
semântica de guardas.

### Semântica de decisão de hooks

- `before_tool_call`: retornar `{ block: true }` é terminal. Depois que qualquer manipulador o define, manipuladores de prioridade mais baixa são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Depois que qualquer manipulador o define, manipuladores de prioridade mais baixa são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Depois que qualquer manipulador reivindica o despacho, manipuladores de prioridade mais baixa e o caminho padrão de despacho do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Depois que qualquer manipulador o define, manipuladores de prioridade mais baixa são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (igual a omitir `cancel`), não como uma substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de tópico/thread de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use campos de roteamento tipados `replyToId` / `threadId` antes de recorrer a `metadata` específico do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para estado de inicialização pertencente ao gateway em vez de depender de hooks internos `gateway:startup`.
- `cron_changed`: observe mudanças no ciclo de vida do cron pertencente ao gateway. Use `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` ao sincronizar agendadores externos de ativação, e mantenha o OpenClaw como a fonte da verdade para verificações de vencimento e execução.

### Campos do objeto de API

| Campo                    | Tipo                      | Descrição                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID do Plugin                                                                                |
| `api.name`               | `string`                  | Nome de exibição                                                                            |
| `api.version`            | `string?`                 | Versão do Plugin (opcional)                                                                 |
| `api.description`        | `string?`                 | Descrição do Plugin (opcional)                                                              |
| `api.source`             | `string`                  | Caminho de origem do Plugin                                                                 |
| `api.rootDir`            | `string?`                 | Diretório raiz do Plugin (opcional)                                                         |
| `api.config`             | `OpenClawConfig`          | Snapshot da configuração atual (snapshot de runtime em memória ativo quando disponível)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do Plugin de `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/setup antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve o caminho relativo à raiz do Plugin                                                 |

## Convenção de módulo interno

Dentro do seu Plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações de runtime apenas internas
  index.ts          # Ponto de entrada do Plugin
  setup-entry.ts    # Entrada leve apenas de setup (opcional)
```

<Warning>
  Nunca importe seu próprio Plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  a partir do código de produção. Direcione importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de plugins empacotados carregados por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) preferem o
snapshot da configuração de runtime ativa quando o OpenClaw já está em execução. Se ainda não existir
um snapshot de runtime, elas usam como fallback o arquivo de configuração resolvido no disco.
Fachadas de plugins empacotados devem ser carregadas pelos carregadores de fachada de Plugin
do OpenClaw; importações diretas de `dist/extensions/...` contornam o manifesto
e as verificações de sidecar de runtime que instalações empacotadas usam para código pertencente ao Plugin.

Plugins de provedor podem expor um barrel de contrato estreito e local ao Plugin quando um
helper é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico
do SDK. Exemplos empacotados:

- **Anthropic**: seam pública `api.ts` / `contract-api.ts` para helpers de stream
  de beta-header do Claude e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta builders de provedor,
  helpers de modelo padrão e builders de provedor em tempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o builder de provedor
  mais helpers de onboarding/configuração.

<Warning>
  O código de produção de extensão também deve evitar importações de `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o para um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capacidade, em vez de acoplar dois plugins.
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
    Migração de superfícies obsoletas.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura profunda e modelo de capacidades.
  </Card>
</CardGroup>
