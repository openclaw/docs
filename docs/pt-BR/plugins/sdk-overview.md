---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro do OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-04-30T10:01:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

O SDK de plugin é o contrato tipado entre plugins e core. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Note>
  Esta página é para autores de plugins que usam `openclaw/plugin-sdk/*` dentro
  do OpenClaw. Para aplicativos externos, scripts, dashboards, tarefas de CI e
  extensões de IDE que querem executar agentes pelo Gateway, use o
  [SDK de Aplicativo OpenClaw](/pt-BR/concepts/openclaw-sdk) e o pacote `@openclaw/sdk`
  em vez disso.
</Note>

<Tip>
Procurando um guia prático? Comece com [Criando plugins](/pt-BR/plugins/building-plugins), use [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para plugins de provedor e [Hooks de plugin](/pt-BR/plugins/hooks) para plugins de ferramenta ou hook de ciclo de vida.
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
é para primitivas de schema compartilhadas e o builder genérico. Os plugins
incluídos do OpenClaw usam `plugin-sdk/bundled-channel-config-schema` para schemas
retidos de canais incluídos. Exportações de compatibilidade obsoletas permanecem em
`plugin-sdk/channel-config-schema-legacy`; nenhum dos subcaminhos de schema incluído é um
padrão para novos plugins.

<Warning>
  Não importe seams de conveniência com marca de provedor ou canal (por exemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do core devem usar esses barrels locais do plugin
  ou adicionar um contrato genérico estreito do SDK quando a necessidade for realmente
  transversal a canais.

Um pequeno conjunto de seams auxiliares de plugins incluídos ainda aparece no mapa de exportação
gerado quando eles têm uso rastreado pelo proprietário. Eles existem apenas para manutenção de
plugins incluídos e não são caminhos de importação recomendados para novos plugins de terceiros.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` também são
mantidos como facades de compatibilidade obsoletas para uso rastreado pelo proprietário. Não
copie esses caminhos de importação para novos plugins; use helpers de runtime injetados e
subcaminhos genéricos do SDK de canal em vez disso.
</Warning>

## Referência de subcaminhos

O SDK de plugin é exposto como um conjunto de subcaminhos estreitos agrupados por área (entrada de plugin,
canal, provedor, autenticação, runtime, capacidade, memória e helpers reservados
de plugins incluídos). Para o catálogo completo — agrupado e com links — veja
[Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).

A lista gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Método                                           | O que registra                         |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)              |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência por CLI    |
| `api.registerChannel(...)`                       | Canal de mensagens                     |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT       |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz em tempo real duplex    |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo          |
| `api.registerImageGenerationProvider(...)`       | Geração de imagens                     |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                      |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                       |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/coleta na Web        |
| `api.registerWebSearchProvider(...)`             | Pesquisa na Web                        |

### Ferramentas e comandos

| Método                         | O que registra                                  |
| ------------------------------ | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (contorna o LLM)          |

Comandos de plugin podem definir `agentPromptGuidance` quando o agente precisa de uma dica curta
de roteamento pertencente ao comando. Mantenha esse texto sobre o próprio comando; não adicione
política específica de provedor ou plugin aos builders de prompt do core.

### Infraestrutura

| Método                                         | O que registra                         |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway               |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                  |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descoberta local do Gateway |
| `api.registerCli(registrar, opts?)`            | Subcomando da CLI                      |
| `api.registerService(service)`                 | Serviço em segundo plano               |
| `api.registerInteractiveHandler(registration)` | Handler interativo                     |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de resultado de ferramenta em runtime |
| `api.registerMemoryPromptSupplement(builder)`  | Seção aditiva de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de busca/leitura de memória |

### Hooks de host para plugins de workflow

Hooks de host são as seams do SDK para plugins que precisam participar do ciclo de vida do host
em vez de apenas adicionar um provedor, canal ou ferramenta. Eles são
contratos genéricos; o Modo Plano pode usá-los, mas workflows de aprovação,
gates de política de workspace, monitores em segundo plano, assistentes de configuração e plugins
companheiros de UI também podem.

| Método                                                                   | Contrato que possui                                                              |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Estado de sessão pertencente ao plugin, compatível com JSON, projetado por sessões do Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Contexto durável exatamente uma vez injetado no próximo turno do agente para uma sessão |
| `api.registerTrustedToolPolicy(...)`                                     | Política de ferramenta pré-plugin incluída/confiável que pode bloquear ou reescrever parâmetros de ferramenta |
| `api.registerToolMetadata(...)`                                          | Metadados de exibição do catálogo de ferramentas sem alterar a implementação da ferramenta |
| `api.registerCommand(...)`                                               | Comandos de plugin com escopo; resultados de comando podem definir `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Descritores de contribuição para a UI de Controle em superfícies de sessão, ferramenta, execução ou configurações |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de limpeza para recursos de runtime pertencentes ao plugin em caminhos de reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Assinaturas de eventos sanitizadas para estado de workflow e monitores           |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Estado temporário de plugin por execução limpo no ciclo de vida terminal da execução |
| `api.registerSessionSchedulerJob(...)`                                   | Registros de tarefas do agendador de sessão pertencentes ao plugin com limpeza determinística |

Os contratos dividem autoridade intencionalmente:

- Plugins externos podem possuir extensões de sessão, descritores de UI, comandos, metadados de ferramenta, injeções no próximo turno e hooks normais.
- Políticas de ferramenta confiáveis são executadas antes de hooks `before_tool_call` comuns e são apenas para incluídos porque participam da política de segurança do host.
- A propriedade de comandos reservados é apenas para incluídos. Plugins externos devem usar seus próprios nomes de comando ou aliases.
- `allowPromptInjection=false` desabilita hooks que mutam prompt, incluindo
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  campos de prompt do `before_agent_start` legado e
  `enqueueNextTurnInjection`.

Exemplos de consumidores que não são do Plano:

| Arquétipo de plugin          | Hooks usados                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow de aprovação        | Extensão de sessão, continuação de comando, injeção no próximo turno, descritor de UI                                                  |
| Gate de política de orçamento/workspace | Política de ferramenta confiável, metadados de ferramenta, projeção de sessão                                             |
| Monitor de ciclo de vida em segundo plano | Limpeza de ciclo de vida de runtime, assinatura de eventos de agente, propriedade/limpeza do agendador de sessão, contribuição de prompt de heartbeat, descritor de UI |
| Assistente de configuração ou onboarding | Extensão de sessão, comandos com escopo, descritor de UI de Controle                                                      |

<Note>
  Namespaces reservados de administração do core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo que um plugin tente atribuir um
  escopo de método do Gateway mais estreito. Prefira prefixos específicos do plugin para
  métodos pertencentes ao plugin.
</Note>

<Accordion title="Quando usar middleware de resultado de ferramenta">
  Plugins incluídos podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisam reescrever um resultado de ferramenta após a execução e antes que o runtime
  devolva esse resultado ao modelo. Esta é a seam confiável e neutra de runtime
  para redutores de saída assíncrona, como tokenjuice.

Plugins incluídos devem declarar `contracts.agentToolResultMiddleware` para cada
runtime alvo, por exemplo `["pi", "codex"]`. Plugins externos
não podem registrar este middleware; mantenha hooks normais de plugin do OpenClaw para trabalho
que não precisa de temporização de resultado de ferramenta antes do modelo. O antigo caminho de registro
da fábrica de extensão embarcada apenas para Pi foi removido.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um plugin anuncie o Gateway ativo
em um transporte de descoberta local, como mDNS/Bonjour. O OpenClaw chama o
serviço durante a inicialização do Gateway quando a descoberta local está habilitada, passa as
portas atuais do Gateway e dados de dica TXT não secretos, e chama o handler
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

Plugins de descoberta de Gateway não devem tratar valores TXT anunciados como segredos ou
autenticação. A descoberta é uma dica de roteamento; a autenticação do Gateway e a fixação de TLS ainda
controlam a confiança.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes de comando explícitas pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de análise usados para a ajuda da CLI raiz,
  roteamento e registro preguiçoso da CLI de plugins

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
        description: "Gerencie contas Matrix, verificação, dispositivos e estado do perfil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando não precisar do registro preguiçoso da CLI raiz.
Esse caminho de compatibilidade ansioso continua compatível, mas não instala
placeholders respaldados por descritores para carregamento preguiçoso em tempo de análise.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um plugin controle a configuração padrão de um backend local
de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `codex-cli/gpt-5`.
- A `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda vence. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de regravações de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).

### Slots exclusivos

| Método                                     | O que registra                                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o motor possa adaptar adições ao prompt.      |
| `api.registerMemoryCapability(capability)` | Capacidade de memória unificada                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de descarga de memória                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                                 |

### Adaptadores de embedding de memória

| Método                                         | O que registra                                  |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para plugin de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins acompanhantes consumam artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um
  plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas legadas compatíveis para plugin de memória.
- `MemoryFlushPlan.model` pode fixar o turno de descarga em uma referência exata de
  `provider/model`, como `ollama/qwen3:8b`, sem herdar a cadeia de fallback ativa.
- `registerMemoryEmbeddingProvider` permite que o plugin de memória ativo registre um
  ou mais ids de adaptador de embedding (por exemplo `openai`, `gemini` ou um id
  personalizado definido pelo plugin).
- Configurações do usuário como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` são resolvidas contra esses ids de adaptador
  registrados.

### Eventos e ciclo de vida

| Método                                       | O que faz                     |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado  |
| `api.onConversationBindingResolved(handler)` | Callback de vinculação de conversa |

Consulte [Hooks de plugin](/pt-BR/plugins/hooks) para ver exemplos, nomes comuns de hooks e semântica
de guardas.

### Semântica de decisão de hooks

- `before_tool_call`: retornar `{ block: true }` é terminal. Depois que qualquer handler define isso, handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Depois que qualquer handler define isso, handlers de prioridade mais baixa são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Depois que qualquer handler reivindica o envio, handlers de prioridade mais baixa e o caminho padrão de envio do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Depois que qualquer handler define isso, handlers de prioridade mais baixa são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como ausência de decisão (igual a omitir `cancel`), não como uma substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos de roteamento tipados `replyToId` / `threadId` antes de recorrer a `metadata` específico do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para estado de inicialização pertencente ao gateway em vez de depender de hooks internos `gateway:startup`.
- `cron_changed`: observe mudanças no ciclo de vida do cron pertencente ao gateway. Use `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` ao sincronizar agendadores externos de despertar, e mantenha o OpenClaw como a fonte da verdade para verificações de vencimento e execução.

### Campos do objeto da API

| Campo                    | Tipo                      | Descrição                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id do plugin                                                                                |
| `api.name`               | `string`                  | Nome de exibição                                                                            |
| `api.version`            | `string?`                 | Versão do plugin (opcional)                                                                 |
| `api.description`        | `string?`                 | Descrição do plugin (opcional)                                                              |
| `api.source`             | `string`                  | Caminho de origem do plugin                                                                 |
| `api.rootDir`            | `string?`                 | Diretório raiz do plugin (opcional)                                                         |
| `api.config`             | `OpenClawConfig`          | Snapshot de configuração atual (snapshot de runtime em memória ativo quando disponível)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do plugin de `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve caminho relativo à raiz do plugin                                                   |

## Convenção de módulo interno

Dentro do seu plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações de runtime somente internas
  index.ts          # Ponto de entrada do plugin
  setup-entry.ts    # Entrada leve somente de configuração (opcional)
```

<Warning>
  Nunca importe seu próprio plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  em código de produção. Encaminhe importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de plugins empacotados carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) preferem o
snapshot de configuração de runtime ativo quando o OpenClaw já está em execução. Se ainda não houver
snapshot de runtime, elas recorrem ao arquivo de configuração resolvido em disco.
Fachadas de plugins empacotados devem ser carregadas por meio dos carregadores de fachada de plugin
do OpenClaw; importações diretas de `dist/extensions/...` contornam espelhos de dependências de runtime
em etapas que instalações empacotadas usam para dependências pertencentes ao plugin.

Plugins de provedor podem expor um barrel de contrato estreito e local ao plugin quando um
auxiliar é intencionalmente específico do provedor e ainda não pertence a um subcaminho
genérico do SDK. Exemplos empacotados:

- **Anthropic**: interface pública `api.ts` / `contract-api.ts` para auxiliares de stream de
  beta-header do Claude e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta construtores de provedor,
  auxiliares de modelo padrão e construtores de provedor em tempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o construtor de provedor
  mais auxiliares de onboarding/configuração.

<Warning>
  Código de produção de extensão também deve evitar importações de `openclaw/plugin-sdk/<other-plugin>`.
  Se um auxiliar for realmente compartilhado, promova-o para um subcaminho neutro do SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capacidade em vez de acoplar dois plugins.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pontos de entrada" icon="door-open" href="/pt-BR/plugins/sdk-entrypoints">
    Opções de `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Auxiliares de runtime" icon="gears" href="/pt-BR/plugins/sdk-runtime">
    Referência completa do namespace `api.runtime`.
  </Card>
  <Card title="Configuração e config" icon="sliders" href="/pt-BR/plugins/sdk-setup">
    Empacotamento, manifestos e esquemas de configuração.
  </Card>
  <Card title="Testes" icon="vial" href="/pt-BR/plugins/sdk-testing">
    Utilitários de teste e regras de lint.
  </Card>
  <Card title="Migração do SDK" icon="arrows-turn-right" href="/pt-BR/plugins/sdk-migration">
    Migrando de superfícies descontinuadas.
  </Card>
  <Card title="Componentes internos do plugin" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura profunda e modelo de capacidades.
  </Card>
</CardGroup>
