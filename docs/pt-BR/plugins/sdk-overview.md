---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro no OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-05-10T19:45:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

O SDK de plugins é o contrato tipado entre plugins e o núcleo. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Note>
  Esta página é para autores de plugins que usam `openclaw/plugin-sdk/*` dentro do
  OpenClaw. Para apps externos, scripts, painéis, tarefas de CI e extensões de IDE
  que querem executar agentes por meio do Gateway, use o
  [SDK de apps do OpenClaw](/pt-BR/concepts/openclaw-sdk) e o pacote `@openclaw/sdk`.
</Note>

<Tip>
Procurando um guia prático? Comece com [Criando plugins](/pt-BR/plugins/building-plugins), use [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para plugins de provedor, [Plugins de backend CLI](/pt-BR/plugins/cli-backend-plugins) para backends locais de CLI de IA e [Hooks de Plugin](/pt-BR/plugins/hooks) para plugins de ferramentas ou hooks de ciclo de vida.
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
a superfície mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

Para configuração de canal, publique o JSON Schema pertencente ao canal por meio de
`openclaw.plugin.json#channelConfigs`. O subcaminho `plugin-sdk/channel-config-schema`
é para primitivas de esquema compartilhadas e o construtor genérico. Os plugins
incluídos do OpenClaw usam `plugin-sdk/bundled-channel-config-schema` para esquemas
retidos de canais incluídos. Exportações de compatibilidade obsoletas permanecem em
`plugin-sdk/channel-config-schema-legacy`; nenhum dos subcaminhos de esquema incluído é um
padrão para novos plugins.

<Warning>
  Não importe pontos de integração de conveniência marcados por provedor ou canal (por exemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do núcleo devem usar esses barrels locais
  do plugin ou adicionar um contrato genérico estreito do SDK quando uma necessidade for
  realmente entre canais.

Um pequeno conjunto de pontos de integração auxiliares de plugins incluídos ainda aparece no mapa de
exportação gerado quando eles têm uso rastreado pelo proprietário. Eles existem apenas para a
manutenção de plugins incluídos e não são caminhos de importação recomendados para novos plugins
de terceiros.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` também são
mantidos como fachadas de compatibilidade obsoletas para uso rastreado pelo proprietário. Não
copie esses caminhos de importação para novos plugins; use helpers de runtime injetados e
subcaminhos genéricos do SDK de canal.
</Warning>

## Referência de subcaminhos

O SDK de plugins é exposto como um conjunto de subcaminhos estreitos agrupados por área (entrada de
plugin, canal, provedor, autenticação, runtime, capacidade, memória e helpers reservados de
plugins incluídos). Para o catálogo completo — agrupado e com links — consulte
[Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).

O inventário de entrypoints do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações do pacote são geradas a partir
do subconjunto público depois de subtrair os subcaminhos locais de teste/internos do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Execute
`pnpm plugin-sdk:surface` para auditar a contagem de exportações públicas. Subcaminhos públicos
obsoletos que são antigos o suficiente e não utilizados pelo código de produção de extensões incluídas são
rastreados em `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrels amplos
de reexportação obsoletos são rastreados em
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Método                                           | O que ele registra                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência por CLI   |
| `api.registerChannel(...)`                       | Canal de mensagens                    |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz em tempo real duplex   |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo         |
| `api.registerImageGenerationProvider(...)`       | Geração de imagens                    |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                     |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                      |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/coleta na web       |
| `api.registerWebSearchProvider(...)`             | Busca na web                          |

### Ferramentas e comandos

| Método                          | O que ele registra                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)          |

Comandos de plugin podem definir `agentPromptGuidance` quando o agente precisa de uma dica curta de
roteamento pertencente ao comando. Mantenha esse texto sobre o próprio comando; não adicione
política específica de provedor ou plugin aos construtores de prompt do núcleo.

### Infraestrutura

| Método                                         | O que ele registra                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway                |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                   |
| `api.registerGatewayDiscoveryService(service)` | Anunciador de descoberta do Gateway local |
| `api.registerCli(registrar, opts?)`            | Subcomando da CLI                       |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI de recurso de Node em `openclaw nodes` |
| `api.registerService(service)`                 | Serviço em segundo plano                |
| `api.registerInteractiveHandler(registration)` | Manipulador interativo                  |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de runtime para resultado de ferramenta |
| `api.registerMemoryPromptSupplement(builder)`  | Seção de prompt aditiva adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de busca/leitura de memória |

### Hooks de host para plugins de workflow

Hooks de host são os pontos de integração do SDK para plugins que precisam participar do ciclo de vida
do host, em vez de apenas adicionar um provedor, canal ou ferramenta. Eles são
contratos genéricos; o Modo Planejamento pode usá-los, mas workflows de aprovação,
barreiras de política de workspace, monitores em segundo plano, assistentes de configuração e plugins
companheiros de UI também podem.

| Método                                                                   | Contrato que ele possui                                                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Estado de sessão compatível com JSON, pertencente ao plugin, projetado por meio de sessões do Gateway                             |
| `api.enqueueNextTurnInjection(...)`                                      | Contexto durável exatamente uma vez injetado na próxima rodada do agente para uma sessão                                           |
| `api.registerTrustedToolPolicy(...)`                                     | Política de ferramenta pré-plugin incluída/confiável que pode bloquear ou reescrever parâmetros de ferramenta                      |
| `api.registerToolMetadata(...)`                                          | Metadados de exibição do catálogo de ferramentas sem alterar a implementação da ferramenta                                        |
| `api.registerCommand(...)`                                               | Comandos de plugin com escopo; resultados de comando podem definir `continueAgent: true`; comandos nativos do Discord dão suporte a `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descritores de contribuição de UI de controle para superfícies de sessão, ferramenta, execução ou configurações                   |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de limpeza para recursos de runtime pertencentes ao plugin em caminhos de reset/exclusão/recarregamento                 |
| `api.registerAgentEventSubscription(...)`                                | Assinaturas de eventos higienizadas para estado de workflow e monitores                                                           |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Estado temporário por execução do plugin limpo no ciclo de vida terminal da execução                                              |
| `api.registerSessionSchedulerJob(...)`                                   | Registros de tarefas do agendador de sessão pertencentes ao plugin com limpeza determinística                                     |

Os contratos dividem autoridade intencionalmente:

- Plugins externos podem possuir extensões de sessão, descritores de UI, comandos, metadados de ferramenta, injeções na próxima rodada e hooks normais.
- Políticas de ferramenta confiáveis são executadas antes de hooks `before_tool_call` comuns e são apenas incluídas porque participam da política de segurança do host.
- A propriedade de comandos reservados é apenas incluída. Plugins externos devem usar seus próprios nomes de comando ou aliases.
- `allowPromptInjection=false` desabilita hooks que modificam prompts, incluindo
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  campos de prompt do legado `before_agent_start` e
  `enqueueNextTurnInjection`.

Exemplos de consumidores que não são do Plan:

| Arquétipo de plugin          | Hooks usados                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow de aprovação        | Extensão de sessão, continuação de comando, injeção na próxima rodada, descritor de UI                                                 |
| Barreira de política de orçamento/workspace | Política de ferramenta confiável, metadados de ferramenta, projeção de sessão                                             |
| Monitor de ciclo de vida em segundo plano | Limpeza de ciclo de vida do runtime, assinatura de evento de agente, propriedade/limpeza do agendador de sessão, contribuição de prompt de Heartbeat, descritor de UI |
| Assistente de configuração ou onboarding | Extensão de sessão, comandos com escopo, descritor de UI de controle                                                        |

<Note>
  Namespaces reservados de administração do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo que um plugin tente atribuir um
  escopo de método de gateway mais estreito. Prefira prefixos específicos do plugin para
  métodos pertencentes ao plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  Plugins incluídos podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisam reescrever o resultado de uma ferramenta após a execução e antes que o runtime
  realimente esse resultado no modelo. Essa é a interface confiável e neutra em relação
  ao runtime para redutores de saída assíncronos como tokenjuice.

Plugins incluídos devem declarar `contracts.agentToolResultMiddleware` para cada
runtime alvo, por exemplo `["pi", "codex"]`. Plugins externos
não podem registrar esse middleware; mantenha os hooks normais de plugin do OpenClaw para trabalhos
que não precisam do timing de resultado de ferramenta antes do modelo. O caminho antigo de
registro da fábrica de extensão incorporada exclusiva do Pi foi removido.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um plugin anuncie o Gateway
ativo em um transporte de descoberta local, como mDNS/Bonjour. O OpenClaw chama o
serviço durante a inicialização do Gateway quando a descoberta local está ativada, passa as
portas atuais do Gateway e dados de dica TXT não secretos, e chama o manipulador
`stop` retornado durante o encerramento do Gateway.

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
autenticação. A descoberta é uma dica de roteamento; a autenticação do Gateway e a fixação
de TLS ainda são responsáveis pela confiança.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de comando:

- `commands`: nomes de comandos explícitos pertencentes ao registrador
- `descriptors`: descritores de comandos em tempo de análise usados para ajuda da CLI,
  roteamento e registro preguiçoso da CLI do plugin
- `parentPath`: caminho opcional do comando pai para grupos de comandos aninhados, como
  `["nodes"]`

Para recursos de nó pareado, prefira
`api.registerNodeCliFeature(registrar, opts?)`. Ele é um pequeno wrapper em torno de
`api.registerCli(..., { parentPath: ["nodes"] })` e torna comandos como
`openclaw nodes canvas` recursos de nó explicitamente pertencentes ao plugin.

Se você quiser que um comando de plugin permaneça carregado de forma preguiçosa no caminho
normal da CLI raiz, forneça `descriptors` que cubram todas as raízes de comando de nível
superior expostas por esse registrador.

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

Use apenas `commands` quando você não precisar de registro preguiçoso da CLI raiz.
Esse caminho de compatibilidade ansioso continua com suporte, mas não instala
placeholders respaldados por descritores para carregamento preguiçoso em tempo de análise.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um plugin seja proprietário da configuração padrão para um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `codex-cli/gpt-5`.
- O `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).
- Use `resolveExecutionArgs` para reescritas de argv no escopo da requisição que pertencem ao
  dialeto da CLI, como mapear níveis de raciocínio do OpenClaw para uma flag nativa de esforço.

Para um guia de autoria de ponta a ponta, consulte
[plugins de backend da CLI](/pt-BR/plugins/cli-backend-plugins).

### Slots exclusivos

| Método                                     | O que ele registra                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o motor possa adaptar adições ao prompt. |
| `api.registerMemoryCapability(capability)` | Capacidade de memória unificada                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                                    |

### Adaptadores de embedding de memória

| Método                                         | O que ele registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para plugin de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins complementares possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um
  plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas de plugin de memória compatíveis com legado.
- `MemoryFlushPlan.model` pode fixar o turno de flush em uma referência exata de
  `provider/model`, como `ollama/qwen3:8b`, sem herdar a cadeia de fallback
  ativa.
- `registerMemoryEmbeddingProvider` permite que o plugin de memória ativo registre um
  ou mais ids de adaptadores de embedding (por exemplo, `openai`, `gemini` ou um id personalizado
  definido pelo plugin).
- Configuração do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, é resolvida em relação a esses ids de adaptadores
  registrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado          |
| `api.onConversationBindingResolved(handler)` | Callback de vinculação de conversa |

Consulte [hooks de Plugin](/pt-BR/plugins/hooks) para exemplos, nomes comuns de hooks e semântica
de guardas.

### Semântica de decisão dos hooks

- `before_tool_call`: retornar `{ block: true }` é terminal. Depois que qualquer handler define isso, handlers de prioridade menor são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Depois que qualquer handler define isso, handlers de prioridade menor são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Depois que qualquer handler reivindica o despacho, handlers de prioridade menor e o caminho padrão de despacho do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Depois que qualquer handler define isso, handlers de prioridade menor são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como ausência de decisão (igual a omitir `cancel`), não como uma substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos tipados de roteamento `replyToId` / `threadId` antes de recorrer a `metadata` específico do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para o estado de inicialização pertencente ao Gateway em vez de depender de hooks internos `gateway:startup`.
- `cron_changed`: observe mudanças de ciclo de vida do cron pertencentes ao Gateway. Use `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` ao sincronizar agendadores externos de despertar, e mantenha o OpenClaw como a fonte da verdade para verificações de vencimento e execução.

### Campos do objeto da API

| Campo                    | Tipo                      | Descrição                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id do plugin                                                                                   |
| `api.name`               | `string`                  | Nome de exibição                                                                                |
| `api.version`            | `string?`                 | Versão do plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descrição do plugin (opcional)                                                               |
| `api.source`             | `string`                  | Caminho de origem do plugin                                                                          |
| `api.rootDir`            | `string?`                 | Diretório raiz do plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot da configuração atual (snapshot ativo em memória do runtime quando disponível)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do plugin de `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve caminho relativo à raiz do plugin                                                        |

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
  a partir de código de produção. Encaminhe imports internos por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de plugins incluídos carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos públicos de entrada semelhantes) preferem o
snapshot ativo da configuração de runtime quando o OpenClaw já está em execução. Se ainda não houver
snapshot de runtime, elas recorrem ao arquivo de configuração resolvido em disco.
Fachadas de plugins incluídos empacotados devem ser carregadas pelos carregadores de fachada de
plugins do OpenClaw; imports diretos de `dist/extensions/...` ignoram as verificações de manifesto
e sidecar de runtime que instalações empacotadas usam para código pertencente ao plugin.

Plugins de provedor podem expor um barrel de contrato estreito e local ao plugin quando um
helper é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico do SDK.
Exemplos incluídos:

- **Anthropic**: seam pública `api.ts` / `contract-api.ts` para helpers de
  beta-header do Claude e stream de `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta builders de provedor,
  helpers de modelo padrão e builders de provedor em tempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o builder de provedor
  mais helpers de onboarding/configuração.

<Warning>
  Código de produção de extensões também deve evitar imports de `openclaw/plugin-sdk/<other-plugin>`.
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
