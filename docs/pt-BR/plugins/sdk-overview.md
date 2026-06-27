---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: Plugin SDK overview
summary: Referência de mapa de importação, API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-06-27T17:57:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

O SDK de Plugin é o contrato tipado entre Plugins e o núcleo. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Note>
  Esta página é para autores de Plugin que usam `openclaw/plugin-sdk/*` dentro do
  OpenClaw. Para apps externos, scripts, painéis, jobs de CI e extensões de IDE
  que querem executar agentes por meio do Gateway, use
  [Integrações do Gateway para apps externos](/pt-BR/gateway/external-apps).
</Note>

<Tip>
Procurando um guia prático? Comece com [Criar Plugins](/pt-BR/plugins/building-plugins), use [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para Plugins de canal, [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para Plugins de provedor, [Plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins) para backends locais de CLI de IA e [Hooks de Plugin](/pt-BR/plugins/hooks) para Plugins de ferramenta ou hook de ciclo de vida.
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização
rápida e evita problemas de dependência circular. Para helpers de entrada/build
específicos de canal, prefira `openclaw/plugin-sdk/channel-core`; mantenha
`openclaw/plugin-sdk/core` para a superfície guarda-chuva mais ampla e helpers
compartilhados, como `buildChannelConfigSchema`.

Para configuração de canal, publique o JSON Schema pertencente ao canal por meio
de `openclaw.plugin.json#channelConfigs`. O subcaminho
`plugin-sdk/channel-config-schema` é para primitivas de schema compartilhadas e
o construtor genérico. Os Plugins incluídos no OpenClaw usam
`plugin-sdk/bundled-channel-config-schema` para schemas retidos de canais
incluídos. Exportações de compatibilidade obsoletas permanecem em
`plugin-sdk/channel-config-schema-legacy`; nenhum dos subcaminhos de schema
incluído é um padrão para novos Plugins.

<Warning>
  Não importe pontos de integração de conveniência com marca de provedor ou canal
  (por exemplo, `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`,
  `.../whatsapp`). Plugins incluídos compõem subcaminhos genéricos do SDK dentro
  de seus próprios barrels `api.ts` / `runtime-api.ts`; consumidores do núcleo
  devem usar esses barrels locais do Plugin ou adicionar um contrato genérico
  estreito do SDK quando a necessidade for realmente entre canais.

Um pequeno conjunto de pontos de integração auxiliares de Plugins incluídos ainda
aparece no mapa de exportação gerado quando eles têm uso de proprietário
rastreado. Eles existem apenas para manutenção de Plugins incluídos e não são
caminhos de importação recomendados para novos Plugins de terceiros.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` também
são mantidos como facades de compatibilidade obsoletas para uso de proprietário
rastreado. Não copie esses caminhos de importação para novos Plugins; use helpers
de runtime injetados e subcaminhos genéricos do SDK de canal.
</Warning>

## Referência de subcaminhos

O SDK de Plugin é exposto como um conjunto de subcaminhos estreitos agrupados por
área (entrada de Plugin, canal, provedor, autenticação, runtime, capability,
memória e helpers reservados de Plugins incluídos). Para o catálogo completo —
agrupado e com links — veja [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).

O inventário de pontos de entrada do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações de pacote são geradas
a partir do subconjunto público depois de subtrair os subcaminhos de teste/interno
locais do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Execute
`pnpm plugin-sdk:surface` para auditar a contagem de exportações públicas.
Subcaminhos públicos obsoletos que são antigos o suficiente e não usados por
código de produção de extensões incluídas são rastreados em
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrels amplos de
reexportação obsoletos são rastreados em
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capability

| Método                                           | O que ele registra                         |
| ------------------------------------------------ | ------------------------------------------ |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)                  |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência por CLI        |
| `api.registerChannel(...)`                       | Canal de mensagens                         |
| `api.registerEmbeddingProvider(...)`             | Provedor reutilizável de embedding vetorial |
| `api.registerSpeechProvider(...)`                | Texto para fala / síntese STT              |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming    |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões duplex de voz em tempo real        |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo              |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem                          |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                          |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                           |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/coleta na Web            |
| `api.registerWebSearchProvider(...)`             | Pesquisa na Web                            |

Provedores de embedding registrados com `api.registerEmbeddingProvider(...)`
também devem ser listados em `contracts.embeddingProviders` no manifesto do
Plugin. Esta é a superfície genérica de embedding para geração vetorial
reutilizável. A pesquisa de memória pode consumir essa superfície genérica de
provedor. O ponto de integração mais antigo
`api.registerMemoryEmbeddingProvider(...)` e
`contracts.memoryEmbeddingProviders` é compatibilidade obsoleta enquanto
provedores existentes específicos de memória migram.

Provedores específicos de memória que ainda expõem um runtime `batchEmbed(...)`
permanecem no contrato existente de batching por arquivo, a menos que o runtime
defina explicitamente `sourceWideBatchEmbed: true`. Essa adesão permite que o
host de memória envie chunks de vários arquivos de memória sujos e fontes
habilitadas em uma chamada `batchEmbed(...)` até os limites de lote do host.
Adaptadores de lote que enviam arquivos de requisição JSONL também devem dividir
jobs do provedor antes do limite de tamanho de upload, bem como do limite de
contagem de requisições. O provedor deve retornar um embedding por chunk de
entrada na mesma ordem de `batch.chunks`; omita a flag quando o provedor espera
lotes locais ao arquivo ou não consegue preservar a ordenação de entrada em um
job maior, abrangendo toda a fonte.

### Ferramentas e comandos

Use [`defineToolPlugin`](/pt-BR/plugins/tool-plugins) para Plugins simples somente de
ferramentas com nomes de ferramentas fixos. Use `api.registerTool(...)`
diretamente para Plugins mistos ou registro de ferramentas totalmente dinâmico.

| Método                          | O que ele registra                             |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (contorna o LLM)         |

Comandos de Plugin podem definir `agentPromptGuidance` quando o agente precisa
de uma dica curta de roteamento pertencente ao comando. Mantenha esse texto
sobre o próprio comando; não adicione política específica de provedor ou Plugin
aos construtores de prompt do núcleo.

Entradas de orientação podem ser strings legadas, que se aplicam a toda
superfície de prompt, ou entradas estruturadas:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` estruturadas podem incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` ou `subagent`. `pi_main` permanece como um alias
obsoleto para `openclaw_main`. Omita `surfaces` para orientação intencional em
todas as superfícies. Não passe um array `surfaces` vazio; ele é rejeitado para
que perda acidental de escopo não se torne texto global de prompt.

Instruções de desenvolvedor nativas do servidor de app Codex são mais estritas
do que outras superfícies de prompt: somente orientações explicitamente
escopadas para `codex_app_server` são promovidas para essa via de prioridade
mais alta. Orientação de string legada e orientação estruturada sem escopo
permanecem disponíveis para superfícies de prompt não Codex por compatibilidade.

### Infraestrutura

| Método                                         | O que ele registra                         |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                             |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descoberta local do Gateway  |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI de recurso de Node em `openclaw nodes` |
| `api.registerService(service)`                 | Serviço em segundo plano                   |
| `api.registerInteractiveHandler(registration)` | Handler interativo                         |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de resultado de ferramenta em runtime |
| `api.registerMemoryPromptSupplement(builder)`  | Seção aditiva de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de pesquisa/leitura de memória |

### Hooks de host para Plugins de workflow

Hooks de host são os pontos de integração do SDK para Plugins que precisam
participar do ciclo de vida do host em vez de apenas adicionar um provedor, canal
ou ferramenta. Eles são contratos genéricos; o Plan Mode pode usá-los, mas
workflows de aprovação, gates de política de workspace, monitores em segundo
plano, assistentes de configuração e Plugins complementares de UI também podem.

| Método                                                                               | Contrato que ele possui                                                                                                           |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sessão de propriedade do plugin, compatível com JSON, projetado por meio de sessões do Gateway                         |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto durável com semântica exatamente uma vez injetado no próximo turno do agente para uma sessão                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Política confiável de ferramenta pré-plugin, controlada pelo manifesto, que pode bloquear ou reescrever parâmetros de ferramenta  |
| `api.registerToolMetadata(...)`                                                      | Metadados de exibição do catálogo de ferramentas sem alterar a implementação da ferramenta                                        |
| `api.registerCommand(...)`                                                           | Comandos de plugin com escopo; resultados de comando podem definir `continueAgent: true`; comandos nativos do Discord aceitam `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descritores de contribuição da UI de controle para superfícies de sessão, ferramenta, execução ou configurações                   |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de limpeza para recursos de runtime de propriedade do plugin em caminhos de redefinição/exclusão/recarregamento         |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Assinaturas de eventos sanitizadas para estado de workflow e monitores                                                            |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporário por execução do plugin limpo no ciclo de vida terminal da execução                                              |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadados de limpeza para jobs do agendador de propriedade do plugin; não agenda trabalho nem cria registros de tarefa            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de anexos de arquivo mediada pelo host, apenas para plugins incluídos, para a rota ativa de sessão de saída direta        |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sessão agendados com base em Cron, apenas para plugins incluídos, além de limpeza baseada em tags                       |
| `api.session.controls.registerSessionAction(...)`                                    | Ações de sessão tipadas que clientes podem despachar pelo Gateway                                                                 |

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

Os métodos planos equivalentes permanecem disponíveis como aliases de
compatibilidade obsoletos para plugins existentes. Não adicione novo código de
plugin que chame `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ou
`api.unscheduleSessionTurnsByTag` diretamente.

`scheduleSessionTurn(...)` é uma conveniência com escopo de sessão sobre o
agendador Cron do Gateway. O Cron possui o timing e cria o registro da tarefa
em segundo plano quando o turno é executado; o Plugin SDK apenas restringe a
sessão de destino, a nomenclatura de propriedade do plugin e a limpeza. Use
`api.runtime.tasks.managedFlows` dentro do turno agendado quando o próprio
trabalho precisar de estado durável de várias etapas de Task Flow.

Os contratos dividem autoridade intencionalmente:

- Plugins externos podem possuir extensões de sessão, descritores de UI,
  comandos, metadados de ferramentas, injeções de próximo turno e hooks normais.
- Políticas confiáveis de ferramentas são executadas antes de hooks
  `before_tool_call` comuns e são confiadas pelo host. Políticas incluídas são
  executadas primeiro; políticas de plugins instalados exigem habilitação
  explícita mais seus ids locais em `contracts.trustedToolPolicies`, e são
  executadas depois, na ordem de carregamento dos plugins. Ids de política têm
  escopo no plugin que os registra.
- A propriedade de comandos reservados é apenas para plugins incluídos. Plugins
  externos devem usar seus próprios nomes de comando ou aliases.
- `allowPromptInjection=false` desativa hooks que alteram o prompt, incluindo
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  campos de prompt do `before_agent_start` legado e
  `enqueueNextTurnInjection`.

Exemplos de consumidores que não são do Plan:

| Arquétipo de plugin          | Hooks usados                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Workflow de aprovação        | Extensão de sessão, continuação de comando, injeção de próximo turno, descritor de UI                                               |
| Portão de política de orçamento/workspace | Política confiável de ferramenta, metadados de ferramenta, projeção de sessão                                            |
| Monitor de ciclo de vida em segundo plano | Limpeza de ciclo de vida do runtime, assinatura de evento do agente, propriedade/limpeza do agendador de sessão, contribuição de prompt de Heartbeat, descritor de UI |
| Assistente de configuração ou onboarding | Extensão de sessão, comandos com escopo, descritor da UI de controle                                                     |

<Note>
  Namespaces reservados de administração do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo que um plugin tente atribuir um
  escopo de método de gateway mais restrito. Prefira prefixos específicos do plugin para
  métodos de propriedade do plugin.
</Note>

<Accordion title="Quando usar middleware de resultado de ferramenta">
  Plugins incluídos e plugins instalados explicitamente habilitados com contratos de
  manifesto correspondentes podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisam reescrever um resultado de ferramenta após a execução e antes que o runtime
  alimente esse resultado de volta ao modelo. Esta é a integração confiável e neutra em
  relação ao runtime para redutores de saída assíncronos, como tokenjuice.

Plugins devem declarar `contracts.agentToolResultMiddleware` para cada runtime
alvo, por exemplo `["openclaw", "codex"]`. Plugins instalados sem esse
contrato, ou sem habilitação explícita, não podem registrar esse middleware; mantenha
os hooks normais de plugin do OpenClaw para trabalhos que não precisam de
timing de resultado de ferramenta antes do modelo. O antigo caminho de registro da
fábrica de extensão exclusivo do runner incorporado foi removido.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um plugin anuncie o
Gateway ativo em um transporte de descoberta local, como mDNS/Bonjour. O OpenClaw chama o
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
possuem a confiança.

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

Se quiser que um comando de plugin permaneça carregado preguiçosamente no caminho normal da CLI raiz,
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

Use `commands` por si só apenas quando não precisar de registro preguiçoso da CLI raiz.
Esse caminho de compatibilidade antecipado permanece compatível, mas não instala
placeholders baseados em descritores para carregamento preguiçoso em tempo de análise.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um plugin possua a configuração padrão de um backend
local de CLI de IA, como `claude-cli` ou `my-cli`.

- O `id` do backend se torna o prefixo do provedor em refs de modelo como `my-cli/gpt-5`.
- A `config` do backend usa o mesmo formato que `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda vence. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).
- Use `resolveExecutionArgs` para reescritas de argv com escopo de solicitação que pertencem ao
  dialeto da CLI, como mapear níveis de raciocínio do OpenClaw para uma flag nativa de esforço.
  O hook recebe `ctx.executionMode`; use `"side-question"` para adicionar
  flags de isolamento nativas do backend para chamadas efêmeras de `/btw`. Se essas flags
  desativarem ferramentas nativas de forma confiável para uma CLI que, de outra forma, fica sempre ativa, declare
  também `sideQuestionToolMode: "disabled"`.

Para um guia de autoria de ponta a ponta, consulte
[plugins de backend da CLI](/pt-BR/plugins/cli-backend-plugins).

### Slots exclusivos

| Método                                     | O que registra                                                                                                                                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mecanismo de contexto (um ativo por vez). Callbacks de ciclo de vida recebem `runtimeSettings` quando o host pode fornecer diagnósticos de modelo/provedor/modo; mecanismos estritos mais antigos são tentados novamente sem essa chave. |
| `api.registerMemoryCapability(capability)` | Capacidade de memória unificada                                                                                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de descarga de memória                                                                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                                                                                        |

### Adaptadores de embeddings de memória obsoletos

| Método                                         | O que registra                              |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryCapability` é a API exclusiva de plugin de memória preferida.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins complementares possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um
  plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas de plugin de memória compatíveis com legado.
- `MemoryFlushPlan.model` pode fixar a vez de descarga em uma referência exata de `provider/model`,
  como `ollama/qwen3:8b`, sem herdar a cadeia de fallback ativa.
- `registerMemoryEmbeddingProvider` está obsoleto. Novos provedores de embedding
  devem usar `api.registerEmbeddingProvider(...)` e
  `contracts.embeddingProviders`.
- Provedores existentes específicos de memória continuam funcionando durante a janela de migração,
  mas a inspeção de plugins relata isso como dívida de compatibilidade para
  plugins não agrupados.

### Eventos e ciclo de vida

| Método                                       | O que faz                         |
| -------------------------------------------- | --------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado      |
| `api.onConversationBindingResolved(handler)` | Callback de vinculação de conversa |

Veja [Hooks de Plugin](/pt-BR/plugins/hooks) para exemplos, nomes comuns de hooks e semântica de guardas.

### Semântica de decisão de hooks

`before_install` é um hook de ciclo de vida do runtime de plugin, não a superfície de
política de instalação do operador. Use `security.installPolicy` quando uma decisão de permitir/bloquear precisar
cobrir caminhos de instalação ou atualização pela CLI e com suporte do Gateway.

- `before_tool_call`: retornar `{ block: true }` é terminal. Depois que qualquer handler define isso, handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (o mesmo que omitir `block`), não como uma sobrescrita.
- `before_install`: retornar `{ block: true }` é terminal. Depois que qualquer handler define isso, handlers de prioridade mais baixa são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (o mesmo que omitir `block`), não como uma sobrescrita.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Depois que qualquer handler reivindica o dispatch, handlers de prioridade mais baixa e o caminho padrão de dispatch do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Depois que qualquer handler define isso, handlers de prioridade mais baixa são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (o mesmo que omitir `cancel`), não como uma sobrescrita.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos de roteamento tipados `replyToId` / `threadId` antes de recorrer a `metadata` específico do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para o estado de inicialização pertencente ao gateway, em vez de depender de hooks internos `gateway:startup`.
- `cron_changed`: observe mudanças de ciclo de vida do cron pertencentes ao gateway. Use `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` ao sincronizar agendadores de despertar externos, e mantenha o OpenClaw como a fonte da verdade para verificações de vencimento e execução.

### Campos do objeto de API

| Campo                    | Tipo                      | Descrição                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID do Plugin                                                                                |
| `api.name`               | `string`                  | Nome de exibição                                                                            |
| `api.version`            | `string?`                 | Versão do Plugin (opcional)                                                                 |
| `api.description`        | `string?`                 | Descrição do Plugin (opcional)                                                             |
| `api.source`             | `string`                  | Caminho de origem do Plugin                                                                 |
| `api.rootDir`            | `string?`                 | Diretório raiz do Plugin (opcional)                                                        |
| `api.config`             | `OpenClawConfig`          | Snapshot de configuração atual (snapshot de runtime em memória ativo quando disponível)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do Plugin de `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve o caminho relativo à raiz do Plugin                                                 |

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

Superfícies públicas de Plugin agrupado carregadas por facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) preferem o
snapshot de configuração de runtime ativo quando o OpenClaw já está em execução. Se ainda não existir
snapshot de runtime, elas recorrem ao arquivo de configuração resolvido em disco.
Facades de Plugin agrupado empacotado devem ser carregadas pelos carregadores de facade de Plugin
do OpenClaw; imports diretos de `dist/extensions/...` ignoram o manifesto
e as verificações de sidecar de runtime que instalações empacotadas usam para código pertencente ao Plugin.

Plugins de provedor podem expor um barrel de contrato local e estreito do Plugin quando um
auxiliar é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico do SDK.
Exemplos agrupados:

- **Anthropic**: camada pública `api.ts` / `contract-api.ts` para auxiliares de stream de
  beta-header do Claude e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta construtores de provedor,
  auxiliares de modelo padrão e construtores de provedor em tempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o construtor de provedor
  mais auxiliares de integração/configuração.

<Warning>
  O código de produção de extensões também deve evitar imports de `openclaw/plugin-sdk/<other-plugin>`.
  Se um auxiliar for realmente compartilhado, promova-o para um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capacidade, em vez de acoplar dois plugins.
</Warning>

## Relacionados

<CardGroup cols={2}>
  <Card title="Pontos de entrada" icon="door-open" href="/pt-BR/plugins/sdk-entrypoints">
    Opções de `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Auxiliares de runtime" icon="gears" href="/pt-BR/plugins/sdk-runtime">
    Referência completa do namespace `api.runtime`.
  </Card>
  <Card title="Configuração inicial e config" icon="sliders" href="/pt-BR/plugins/sdk-setup">
    Empacotamento, manifestos e schemas de config.
  </Card>
  <Card title="Testes" icon="vial" href="/pt-BR/plugins/sdk-testing">
    Utilitários de teste e regras de lint.
  </Card>
  <Card title="Migração do SDK" icon="arrows-turn-right" href="/pt-BR/plugins/sdk-migration">
    Migrando de superfícies obsoletas.
  </Card>
  <Card title="Internos de Plugin" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura profunda e modelo de capacidades.
  </Card>
</CardGroup>
