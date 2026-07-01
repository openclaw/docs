---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-07-01T18:09:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

O SDK de Plugin é o contrato tipado entre plugins e o núcleo. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Note>
  Esta página é para autores de plugins que usam `openclaw/plugin-sdk/*` dentro
  do OpenClaw. Para apps externos, scripts, dashboards, tarefas de CI e extensões de IDE
  que querem executar agentes por meio do Gateway, use
  [Integrações do Gateway para apps externos](/pt-BR/gateway/external-apps).
</Note>

<Tip>
Procurando um guia prático? Comece com [Criando plugins](/pt-BR/plugins/building-plugins), use [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para plugins de provedor, [Plugins de backend CLI](/pt-BR/plugins/cli-backend-plugins) para backends locais de CLI de IA e [Hooks de Plugin](/pt-BR/plugins/hooks) para plugins de ferramenta ou hook de ciclo de vida.
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para helpers de entrada/build específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; reserve `openclaw/plugin-sdk/core` para
a superfície mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

Para configuração de canal, publique o JSON Schema pertencente ao canal por meio de
`openclaw.plugin.json#channelConfigs`. O subcaminho `plugin-sdk/channel-config-schema`
é para primitivas de schema compartilhadas e o builder genérico. Os plugins
incluídos no OpenClaw usam `plugin-sdk/bundled-channel-config-schema` para schemas
retidos de canais incluídos. Exports de compatibilidade obsoletos permanecem em
`plugin-sdk/channel-config-schema-legacy`; nenhum subcaminho de schema incluído é um
padrão para novos plugins.

<Warning>
  Não importe seams de conveniência com marca de provedor ou canal (por exemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do núcleo devem usar esses barrels locais do plugin
  ou adicionar um contrato genérico estreito do SDK quando a necessidade for realmente
  entre canais.

Um pequeno conjunto de seams de helpers de plugins incluídos ainda aparece no mapa de exports
gerado quando há uso rastreado pelo proprietário. Eles existem apenas para manutenção de
plugins incluídos e não são caminhos de importação recomendados para novos plugins de terceiros.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` também são
mantidos como facades de compatibilidade obsoletas para uso rastreado pelo proprietário. Não
copie esses caminhos de importação para novos plugins; use helpers de runtime injetados e
subcaminhos genéricos do SDK de canal.
</Warning>

## Referência de subcaminhos

O SDK de Plugin é exposto como um conjunto de subcaminhos estreitos agrupados por área (entrada de
plugin, canal, provedor, autenticação, runtime, capability, memória e helpers reservados
de plugins incluídos). Para o catálogo completo — agrupado e com links — veja
[Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).

O inventário de pontos de entrada do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; os exports do pacote são gerados a partir
do subconjunto público depois de subtrair subcaminhos de teste/internos locais ao repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Execute
`pnpm plugin-sdk:surface` para auditar a contagem de exports públicos. Subcaminhos públicos
obsoletos antigos o suficiente e não usados por código de produção de extensões incluídas são
rastreados em `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrels amplos
de re-export obsoletos são rastreados em
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capability

| Método                                           | O que registra                          |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)               |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência CLI         |
| `api.registerChannel(...)`                       | Canal de mensagens                      |
| `api.registerEmbeddingProvider(...)`             | Provedor reutilizável de embedding vetorial |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz em tempo real duplex     |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo           |
| `api.registerImageGenerationProvider(...)`       | Geração de imagens                      |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                       |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                        |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/coleta na Web         |
| `api.registerWebSearchProvider(...)`             | Pesquisa na Web                         |

Provedores de embedding registrados com `api.registerEmbeddingProvider(...)` também devem
ser listados em `contracts.embeddingProviders` no manifesto do plugin. Esta
é a superfície genérica de embedding para geração vetorial reutilizável. A busca de memória
pode consumir esta superfície genérica de provedor. A seam mais antiga
`api.registerMemoryEmbeddingProvider(...)` e
`contracts.memoryEmbeddingProviders` é compatibilidade obsoleta enquanto
provedores existentes específicos de memória migram.

Provedores específicos de memória que ainda expõem um runtime `batchEmbed(...)` permanecem no
contrato existente de batching por arquivo, a menos que seu runtime defina explicitamente
`sourceWideBatchEmbed: true`. Essa adesão permite que o host de memória envie chunks de
vários arquivos de memória sujos e fontes habilitadas em uma chamada `batchEmbed(...)`
até os limites de lote do host. Adaptadores de lote que fazem upload de arquivos de requisição JSONL devem
dividir tarefas de provedor antes de atingir seu limite de tamanho de upload, bem como seu limite de
quantidade de requisições. O provedor deve retornar um embedding por chunk de entrada na mesma ordem de
`batch.chunks`; omita a flag quando o provedor espera lotes locais ao arquivo ou
não consegue preservar a ordenação de entrada em uma tarefa maior que abrange a fonte inteira.

### Ferramentas e comandos

Use [`defineToolPlugin`](/pt-BR/plugins/tool-plugins) para plugins simples somente de ferramenta
com nomes de ferramentas fixos. Use `api.registerTool(...)` diretamente para plugins mistos
ou registro de ferramentas totalmente dinâmico.

| Método                          | O que registra                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (contorna o LLM)        |

Comandos de plugin podem definir `agentPromptGuidance` quando o agente precisa de uma dica curta,
pertencente ao comando, para roteamento. Mantenha esse texto sobre o próprio comando; não adicione
política específica de provedor ou plugin aos builders de prompt do núcleo.

Entradas de orientação podem ser strings legadas, que se aplicam a toda superfície de prompt, ou
entradas estruturadas:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` estruturadas podem incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` ou `subagent`. `pi_main` permanece um alias obsoleto
para `openclaw_main`. Omita `surfaces` para orientação intencional em todas as superfícies. Não
passe um array `surfaces` vazio; ele é rejeitado para que perda acidental de escopo não
vire texto global de prompt.

As instruções de desenvolvedor nativas do app-server do Codex são mais rígidas que outras superfícies de
prompt: somente orientação explicitamente escopada para `codex_app_server` é promovida para
essa faixa de maior prioridade. Orientação legada em string e orientação estruturada sem escopo
permanecem disponíveis para superfícies de prompt que não são Codex por compatibilidade.

### Infraestrutura

| Método                                         | O que registra                         |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway               |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                  |
| `api.registerGatewayDiscoveryService(service)` | Anunciante local de descoberta do Gateway |
| `api.registerCli(registrar, opts?)`            | Subcomando CLI                         |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI de recurso Node em `openclaw nodes` |
| `api.registerService(service)`                 | Serviço em segundo plano               |
| `api.registerInteractiveHandler(registration)` | Handler interativo                     |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de resultado de ferramenta em runtime |
| `api.registerMemoryPromptSupplement(builder)`  | Seção aditiva de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de busca/leitura de memória |

### Hooks de host para plugins de workflow

Hooks de host são as seams do SDK para plugins que precisam participar do ciclo de vida
do host em vez de apenas adicionar um provedor, canal ou ferramenta. Eles são
contratos genéricos; o Modo de Planejamento pode usá-los, mas também podem workflows de aprovação,
gates de política de workspace, monitores em segundo plano, assistentes de configuração e plugins
companheiros de UI.

| Método                                                                               | Contrato que ele detém                                                                                                                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sessão pertencente ao Plugin, compatível com JSON, projetado por meio de sessões do Gateway                                                       |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto durável exatamente uma vez injetado no próximo turno do agente para uma sessão                                                                     |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de ferramenta confiável pré-plugin, bloqueada pelo manifesto, que pode bloquear ou reescrever parâmetros de ferramenta                             |
| `api.registerToolMetadata(...)`                                                      | Metadados de exibição do catálogo de ferramentas sem alterar a implementação da ferramenta                                                                  |
| `api.registerCommand(...)`                                                           | Comandos de plugin com escopo; resultados de comando podem definir `continueAgent: true` ou `suppressReply: true`; comandos nativos do Discord aceitam `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descritores de contribuição da UI de controle para superfícies de sessão, ferramenta, execução ou configurações                                             |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de limpeza para recursos de runtime pertencentes ao plugin em caminhos de redefinição/exclusão/recarregamento                                    |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Assinaturas de eventos sanitizadas para estado de workflow e monitores                                                                                      |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporário de plugin por execução, limpo no ciclo de vida terminal da execução                                                                       |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadados de limpeza para jobs de agendador pertencentes ao plugin; não agenda trabalho nem cria registros de tarefa                                        |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de anexo de arquivo mediada pelo host, apenas para plugins integrados, para a rota ativa de saída direta da sessão                                  |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sessão agendados com suporte de Cron, apenas para plugins integrados, mais limpeza baseada em tags                                                |
| `api.session.controls.registerSessionAction(...)`                                    | Ações de sessão tipadas que clientes podem despachar pelo Gateway                                                                                           |

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

Os métodos planos equivalentes continuam disponíveis como aliases de
compatibilidade obsoletos para plugins existentes. Não adicione novo código de
plugin que chame diretamente
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ou
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` é uma conveniência com escopo de sessão sobre o
agendador Cron do Gateway. Cron detém a temporização e cria o registro da
tarefa em segundo plano quando o turno é executado; o Plugin SDK apenas restringe
a sessão de destino, a nomenclatura pertencente ao plugin e a limpeza. Use
`api.runtime.tasks.managedFlows` dentro do turno agendado quando o trabalho em si
precisar de estado durável de Task Flow em várias etapas.

Os contratos separam autoridade intencionalmente:

- Plugins externos podem deter extensões de sessão, descritores de UI, comandos, metadados de ferramentas, injeções no próximo turno e hooks normais.
- Políticas de ferramentas confiáveis são executadas antes de hooks `before_tool_call` comuns e são confiadas pelo host. Políticas integradas são executadas primeiro; políticas de plugins instalados exigem habilitação explícita mais seus ids locais em `contracts.trustedToolPolicies`, e são executadas em seguida na ordem de carregamento dos plugins. IDs de política têm escopo no plugin que as registra.
- A propriedade de comandos reservados é apenas para plugins integrados. Plugins externos devem usar seus próprios nomes de comando ou aliases.
- `allowPromptInjection=false` desativa hooks que alteram prompts, incluindo `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, campos de prompt do legado `before_agent_start` e `enqueueNextTurnInjection`.

Exemplos de consumidores que não são do Plan:

| Arquétipo de Plugin            | Hooks usados                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow de aprovação          | Extensão de sessão, continuação de comando, injeção no próximo turno, descritor de UI                                                 |
| Guardião de política de orçamento/workspace | Política de ferramenta confiável, metadados de ferramenta, projeção de sessão                                             |
| Monitor de ciclo de vida em segundo plano | Limpeza de ciclo de vida do runtime, assinatura de evento de agente, propriedade/limpeza do agendador de sessão, contribuição de prompt de Heartbeat, descritor de UI |
| Assistente de configuração ou onboarding | Extensão de sessão, comandos com escopo, descritor da UI de controle                                                          |

<Note>
  Namespaces administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo que um plugin tente atribuir um
  escopo de método de gateway mais restrito. Prefira prefixos específicos do plugin para
  métodos pertencentes ao plugin.
</Note>

<Accordion title="Quando usar middleware de resultado de ferramenta">
  Plugins integrados e plugins instalados explicitamente habilitados com contratos de
  manifesto correspondentes podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisarem reescrever um resultado de ferramenta após a execução e antes que o runtime
  realimente esse resultado no modelo. Essa é a interface confiável e neutra em runtime
  para redutores de saída assíncronos, como tokenjuice.

Plugins devem declarar `contracts.agentToolResultMiddleware` para cada runtime
alvo, por exemplo `["openclaw", "codex"]`. Plugins instalados sem esse
contrato, ou sem habilitação explícita, não podem registrar esse middleware; mantenha
hooks normais de plugin do OpenClaw para trabalhos que não precisam de temporização de
resultado de ferramenta antes do modelo. O antigo caminho de registro da fábrica de
extensão apenas para o runner incorporado foi removido.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um plugin anuncie o Gateway
ativo em um transporte de descoberta local, como mDNS/Bonjour. O OpenClaw chama o
serviço durante a inicialização do Gateway quando a descoberta local está habilitada,
passa as portas atuais do Gateway e dados de dica TXT não secretos, e chama o handler
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

Plugins de descoberta do Gateway não devem tratar valores TXT anunciados como segredos
ou autenticação. A descoberta é uma dica de roteamento; a autenticação do Gateway e a
fixação de TLS ainda detêm a confiança.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de comando:

- `commands`: nomes explícitos de comandos pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de análise usados para ajuda da CLI,
  roteamento e registro lento da CLI do plugin
- `parentPath`: caminho opcional do comando pai para grupos de comandos aninhados, como
  `["nodes"]`

Para recursos de nós pareados, prefira
`api.registerNodeCliFeature(registrar, opts?)`. Ele é um pequeno wrapper em torno de
`api.registerCli(..., { parentPath: ["nodes"] })` e torna comandos como
`openclaw nodes canvas` recursos de nó explicitamente pertencentes ao plugin.

Se você quiser que um comando de plugin continue com carregamento lento no caminho raiz
normal da CLI, forneça `descriptors` que cubram cada raiz de comando de nível superior
exposta por esse registrador.

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

Use `commands` sozinho apenas quando não precisar de registro lento da CLI raiz.
Esse caminho de compatibilidade ansioso continua aceito, mas não instala placeholders
baseados em descritores para carregamento lento em tempo de análise.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um plugin detenha a configuração padrão para um
backend local de CLI de IA, como `claude-cli` ou `my-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `my-cli/gpt-5`.
- O `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).
- Use `resolveExecutionArgs` para reescritas de argv no escopo da solicitação que pertencem ao
  dialeto da CLI, como mapear níveis de raciocínio do OpenClaw para uma flag nativa de esforço.
  O hook recebe `ctx.executionMode`; use `"side-question"` para adicionar
  flags de isolamento nativas do backend para chamadas efêmeras de `/btw`. Se essas flags
  desativarem de forma confiável as ferramentas nativas de uma CLI que, de outro modo, ficaria sempre ativa, declare
  também `sideQuestionToolMode: "disabled"`.

Para um guia de autoria de ponta a ponta, consulte
[plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins).

### Slots exclusivos

| Método                                     | O que registra                                                                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Mecanismo de contexto (um ativo por vez). Callbacks de ciclo de vida recebem `runtimeSettings` quando o host pode fornecer diagnósticos de modelo/provedor/modo; mecanismos estritos mais antigos são tentados novamente sem essa chave. |
| `api.registerMemoryCapability(capability)` | Capacidade unificada de memória                                                                                                                                                                                    |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória                                                                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                                                                                    |

### Adaptadores de embedding de memória obsoletos

| Método                                         | O que registra                              |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para plugins de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins complementares consumam artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um
  plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas compatíveis com legado para plugins de memória.
- `MemoryFlushPlan.model` pode fixar o turno de flush a uma referência exata de `provider/model`,
  como `ollama/qwen3:8b`, sem herdar a cadeia de fallback ativa.
- `registerMemoryEmbeddingProvider` está obsoleto. Novos provedores de embedding
  devem usar `api.registerEmbeddingProvider(...)` e
  `contracts.embeddingProviders`.
- Provedores existentes específicos de memória continuam funcionando durante a janela de migração,
  mas a inspeção de plugins relata isso como dívida de compatibilidade para
  plugins não integrados.

### Eventos e ciclo de vida

| Método                                       | O que faz                         |
| -------------------------------------------- | --------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado      |
| `api.onConversationBindingResolved(handler)` | Callback de vinculação de conversa |

Consulte [Hooks de plugin](/pt-BR/plugins/hooks) para exemplos, nomes comuns de hooks e semântica de guardas.

### Semântica de decisão dos hooks

`before_install` é um hook de ciclo de vida do runtime de plugins, não a superfície de política de instalação
do operador. Use `security.installPolicy` quando uma decisão de permitir/bloquear precisar
cobrir caminhos de instalação ou atualização baseados em CLI e Gateway.

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que qualquer handler o define, handlers de prioridade menor são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como ausência de decisão (o mesmo que omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Assim que qualquer handler o define, handlers de prioridade menor são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como ausência de decisão (o mesmo que omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Assim que qualquer handler reivindica o despacho, handlers de prioridade menor e o caminho padrão de despacho do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que qualquer handler o define, handlers de prioridade menor são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como ausência de decisão (o mesmo que omitir `cancel`), não como uma substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos tipados de roteamento `replyToId` / `threadId` antes de recorrer a `metadata` específico do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para o estado de inicialização pertencente ao gateway, em vez de depender de hooks internos `gateway:startup`.
- `cron_changed`: observe mudanças no ciclo de vida do cron pertencente ao gateway. Use `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` ao sincronizar agendadores externos de despertar, e mantenha o OpenClaw como a fonte da verdade para verificações de vencimento e execução.

### Campos do objeto de API

| Campo                    | Tipo                      | Descrição                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID do plugin                                                                                 |
| `api.name`               | `string`                  | Nome de exibição                                                                             |
| `api.version`            | `string?`                 | Versão do plugin (opcional)                                                                  |
| `api.description`        | `string?`                 | Descrição do plugin (opcional)                                                              |
| `api.source`             | `string`                  | Caminho de origem do plugin                                                                  |
| `api.rootDir`            | `string?`                 | Diretório raiz do plugin (opcional)                                                          |
| `api.config`             | `OpenClawConfig`          | Snapshot da configuração atual (snapshot ativo do runtime em memória quando disponível)      |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do plugin de `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve o caminho relativo à raiz do plugin                                                  |

## Convenção de módulos internos

Dentro do seu plugin, use arquivos barrel locais para imports internos:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nunca importe seu próprio plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  no código de produção. Encaminhe imports internos por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de plugins integrados carregados por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) preferem o
snapshot ativo da configuração de runtime quando o OpenClaw já está em execução. Se ainda não houver
snapshot de runtime, elas recorrem ao arquivo de configuração resolvido no disco.
Fachadas de plugins integrados empacotados devem ser carregadas por meio dos carregadores de fachada de plugins
do OpenClaw; imports diretos de `dist/extensions/...` ignoram as verificações de manifesto
e de sidecar de runtime que instalações empacotadas usam para código pertencente a plugins.

Plugins de provedor podem expor um barrel de contrato estreito e local ao plugin quando um
helper é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico do SDK.
Exemplos integrados:

- **Anthropic**: ponto de integração público `api.ts` / `contract-api.ts` para helpers de streaming
  de beta-header do Claude e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta construtores de provedor,
  helpers de modelo padrão e construtores de provedor em tempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o construtor de provedor
  mais helpers de onboarding/configuração.

<Warning>
  Código de produção de extensões também deve evitar imports de `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o para um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capacidade, em vez de acoplar dois plugins.
</Warning>

## Relacionado

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
