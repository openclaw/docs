---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-05-04T18:24:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

O SDK de plugins é o contrato tipado entre plugins e o núcleo. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Note>
  Esta página é para autores de plugins que usam `openclaw/plugin-sdk/*` dentro do
  OpenClaw. Para apps externos, scripts, dashboards, jobs de CI e extensões de IDE
  que querem executar agentes por meio do Gateway, use o
  [SDK de apps do OpenClaw](/pt-BR/concepts/openclaw-sdk) e o pacote `@openclaw/sdk`
  em vez disso.
</Note>

<Tip>
Procurando um guia prático? Comece com [Criando plugins](/pt-BR/plugins/building-plugins), use [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para plugins de provedor e [hooks de Plugin](/pt-BR/plugins/hooks) para plugins de ferramenta ou hook de ciclo de vida.
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autossuficiente. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para auxiliares de entrada/build específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície abrangente mais ampla e auxiliares compartilhados, como
`buildChannelConfigSchema`.

Para configuração de canal, publique o JSON Schema pertencente ao canal por meio de
`openclaw.plugin.json#channelConfigs`. O subcaminho `plugin-sdk/channel-config-schema`
é para primitivas de esquema compartilhadas e o builder genérico. Os plugins
incluídos do OpenClaw usam `plugin-sdk/bundled-channel-config-schema` para esquemas
de canais incluídos preservados. Exportações de compatibilidade obsoletas permanecem em
`plugin-sdk/channel-config-schema-legacy`; nenhum dos subcaminhos de esquema incluído é um
padrão para novos plugins.

<Warning>
  Não importe costuras de conveniência com marca de provedor ou canal (por exemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do núcleo devem usar esses barrels locais do plugin
  ou adicionar um contrato genérico estreito do SDK quando uma necessidade for realmente
  entre canais.

Um pequeno conjunto de costuras auxiliares de plugins incluídos ainda aparece no mapa de exportação
gerado quando há uso de proprietário rastreado. Elas existem apenas para manutenção de plugins incluídos
e não são caminhos de importação recomendados para novos plugins de terceiros.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` também são
mantidos como fachadas de compatibilidade obsoletas para uso de proprietário rastreado. Não
copie esses caminhos de importação para novos plugins; use auxiliares de runtime injetados e
subcaminhos genéricos do SDK de canal em vez disso.
</Warning>

## Referência de subcaminhos

O SDK de plugins é exposto como um conjunto de subcaminhos estreitos agrupados por área (entrada de plugin,
canal, provedor, autenticação, runtime, capacidade, memória e auxiliares reservados de
plugins incluídos). Para o catálogo completo, agrupado e com links, consulte
[Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).

A lista gerada com mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Método                                           | O que ele registra                    |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência da CLI    |
| `api.registerChannel(...)`                       | Canal de mensagens                    |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz em tempo real duplex   |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo         |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem                     |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                     |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                      |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/coleta da Web       |
| `api.registerWebSearchProvider(...)`             | Busca na Web                          |

### Ferramentas e comandos

| Método                          | O que ele registra                             |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)           |

Comandos de plugin podem definir `agentPromptGuidance` quando o agente precisa de uma dica curta,
pertencente ao comando, para roteamento. Mantenha esse texto sobre o próprio comando; não adicione
política específica de provedor ou plugin aos builders de prompts do núcleo.

### Infraestrutura

| Método                                         | O que ele registra                       |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | Anunciante de descoberta local do Gateway |
| `api.registerCli(registrar, opts?)`            | Subcomando da CLI                        |
| `api.registerService(service)`                 | Serviço em segundo plano                 |
| `api.registerInteractiveHandler(registration)` | Manipulador interativo                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de runtime de resultado de ferramenta |
| `api.registerMemoryPromptSupplement(builder)`  | Seção de prompt aditiva adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de busca/leitura de memória |

### Hooks de host para plugins de workflow

Hooks de host são as costuras do SDK para plugins que precisam participar do ciclo de vida do host
em vez de apenas adicionar um provedor, canal ou ferramenta. Eles são contratos
genéricos; o Modo de Planejamento pode usá-los, mas workflows de aprovação,
gates de política de workspace, monitores em segundo plano, assistentes de configuração e plugins
companheiros de UI também podem.

| Método                                                                   | Contrato que ele possui                                                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Estado de sessão pertencente ao plugin, compatível com JSON, projetado por meio de sessões do Gateway                            |
| `api.enqueueNextTurnInjection(...)`                                      | Contexto durável exatamente uma vez injetado no próximo turno do agente para uma sessão                                           |
| `api.registerTrustedToolPolicy(...)`                                     | Política de ferramenta pré-plugin, incluída/confiável, que pode bloquear ou reescrever parâmetros de ferramenta                  |
| `api.registerToolMetadata(...)`                                          | Metadados de exibição do catálogo de ferramentas sem alterar a implementação da ferramenta                                       |
| `api.registerCommand(...)`                                               | Comandos de plugin com escopo; resultados de comandos podem definir `continueAgent: true`; comandos nativos do Discord aceitam `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descritores de contribuição da UI de controle para superfícies de sessão, ferramenta, execução ou configurações                  |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de limpeza para recursos de runtime pertencentes ao plugin em caminhos de redefinição/exclusão/recarregamento         |
| `api.registerAgentEventSubscription(...)`                                | Assinaturas de eventos sanitizadas para estado de workflow e monitores                                                           |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Estado temporário de plugin por execução limpo no ciclo de vida terminal da execução                                             |
| `api.registerSessionSchedulerJob(...)`                                   | Registros de jobs do agendador de sessão pertencentes ao plugin com limpeza determinística                                       |

Os contratos dividem autoridade de propósito:

- Plugins externos podem possuir extensões de sessão, descritores de UI, comandos, metadados de ferramenta,
  injeções do próximo turno e hooks normais.
- Políticas de ferramenta confiáveis rodam antes de hooks comuns `before_tool_call` e são
  apenas para incluídos porque participam da política de segurança do host.
- A propriedade reservada de comandos é apenas para incluídos. Plugins externos devem usar seus
  próprios nomes de comando ou aliases.
- `allowPromptInjection=false` desativa hooks que modificam prompts, incluindo
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  campos de prompt do `before_agent_start` legado e
  `enqueueNextTurnInjection`.

Exemplos de consumidores que não são de Planejamento:

| Arquétipo de plugin            | Hooks usados                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Workflow de aprovação          | Extensão de sessão, continuação de comando, injeção do próximo turno, descritor de UI                                               |
| Gate de política de orçamento/workspace | Política de ferramenta confiável, metadados de ferramenta, projeção de sessão                                             |
| Monitor de ciclo de vida em segundo plano | Limpeza de ciclo de vida de runtime, assinatura de eventos do agente, propriedade/limpeza do agendador de sessão, contribuição de prompt de heartbeat, descritor de UI |
| Assistente de configuração ou onboarding | Extensão de sessão, comandos com escopo, descritor da UI de controle                                                       |

<Note>
  Namespaces reservados de administração do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo se um plugin tentar atribuir um
  escopo de método de gateway mais estreito. Prefira prefixos específicos do plugin para
  métodos pertencentes ao plugin.
</Note>

<Accordion title="Quando usar middleware de resultado de ferramenta">
  Plugins incluídos podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisam reescrever um resultado de ferramenta após a execução e antes que o runtime
  alimente esse resultado de volta ao modelo. Esta é a costura confiável, neutra em relação ao runtime,
  para redutores de saída assíncronos como tokenjuice.

Plugins incluídos devem declarar `contracts.agentToolResultMiddleware` para cada
runtime direcionado, por exemplo `["pi", "codex"]`. Plugins externos
não podem registrar este middleware; mantenha hooks normais de plugin do OpenClaw para trabalhos
que não precisam de temporização de resultado de ferramenta antes do modelo. O antigo caminho de registro
de factory de extensão embutida exclusivo do Pi foi removido.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um Plugin anuncie o Gateway ativo
em um transporte de descoberta local, como mDNS/Bonjour. O OpenClaw chama o
serviço durante a inicialização do Gateway quando a descoberta local está habilitada, passa as
portas atuais do Gateway e dados de dica TXT que não são secretos, e chama o manipulador
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

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes de comando explícitas pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de análise usados para a ajuda da CLI raiz,
  roteamento e registro preguiçoso da CLI do Plugin

Se você quiser que um comando de Plugin permaneça carregado preguiçosamente no caminho normal da CLI raiz,
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

Use `commands` sozinho apenas quando você não precisar do registro preguiçoso da CLI raiz.
Esse caminho de compatibilidade ansioso continua compatível, mas não instala
marcadores de posição baseados em descritores para carregamento preguiçoso em tempo de análise.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um Plugin controle a configuração padrão de um backend local de
CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `codex-cli/gpt-5`.
- A `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do Plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).
- Use `resolveExecutionArgs` para reescritas de argv com escopo de requisição que pertencem ao
  dialeto da CLI, como mapear níveis de pensamento do OpenClaw para uma flag de esforço nativa.

### Slots exclusivos

| Método                                     | O que ele registra                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mecanismo de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o mecanismo possa personalizar acréscimos ao prompt. |
| `api.registerMemoryCapability(capability)` | Capacidade de memória unificada                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de descarregamento de memória                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                                    |

### Adaptadores de embedding de memória

| Método                                         | O que ele registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o Plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida de Plugin de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que Plugins complementares possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um
  Plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas de Plugin de memória compatíveis com legado.
- `MemoryFlushPlan.model` pode fixar o turno de descarregamento em uma referência exata de
  `provider/model`, como `ollama/qwen3:8b`, sem herdar a cadeia de fallback ativa.
- `registerMemoryEmbeddingProvider` permite que o Plugin de memória ativo registre um
  ou mais ids de adaptador de embedding (por exemplo, `openai`, `gemini` ou um id personalizado
  definido pelo Plugin).
- Configurações do usuário como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` são resolvidas contra esses ids de adaptador
  registrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado          |
| `api.onConversationBindingResolved(handler)` | Callback de vínculo de conversa |

Veja [hooks de Plugin](/pt-BR/plugins/hooks) para exemplos, nomes comuns de hooks e
semântica de proteções.

### Semântica de decisão de hooks

- `before_tool_call`: retornar `{ block: true }` é terminal. Depois que qualquer manipulador o define, manipuladores de menor prioridade são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Depois que qualquer manipulador o define, manipuladores de menor prioridade são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como ausência de decisão (igual a omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Depois que qualquer manipulador reivindica o envio, manipuladores de menor prioridade e o caminho padrão de envio do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Depois que qualquer manipulador o define, manipuladores de menor prioridade são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como ausência de decisão (igual a omitir `cancel`), não como uma substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos de roteamento tipados `replyToId` / `threadId` antes de recorrer a `metadata` específico do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para o estado de inicialização pertencente ao Gateway, em vez de depender de hooks internos `gateway:startup`.
- `cron_changed`: observe mudanças no ciclo de vida de Cron pertencente ao Gateway. Use `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` ao sincronizar agendadores de despertar externos, e mantenha o OpenClaw como a fonte da verdade para verificações de vencimento e execução.

### Campos do objeto da API

| Campo                    | Tipo                      | Descrição                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id do Plugin                                                                                   |
| `api.name`               | `string`                  | Nome de exibição                                                                                |
| `api.version`            | `string?`                 | Versão do Plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descrição do Plugin (opcional)                                                               |
| `api.source`             | `string`                  | Caminho de origem do Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Diretório raiz do Plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot da configuração atual (snapshot de runtime ativo em memória quando disponível)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do Plugin de `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Ajudantes de runtime](/pt-BR/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve o caminho relativo à raiz do Plugin                                                        |

## Convenção de módulo interno

Dentro do seu Plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nunca importe seu próprio Plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  a partir do código de produção. Direcione importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de Plugins empacotados carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) preferem o
snapshot de configuração de runtime ativo quando o OpenClaw já está em execução. Se ainda não houver
snapshot de runtime, elas recorrem ao arquivo de configuração resolvido no disco.
Fachadas de Plugins empacotados empacotadas devem ser carregadas pelos carregadores de fachada de Plugin do OpenClaw; importações diretas de `dist/extensions/...` ignoram as verificações de manifesto
e sidecar de runtime que instalações empacotadas usam para código pertencente ao Plugin.

Plugins de provedor podem expor um barrel de contrato estreito e local ao Plugin quando um
ajudante é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico do SDK.
Exemplos empacotados:

- **Anthropic**: camada pública `api.ts` / `contract-api.ts` para ajudantes de cabeçalho beta do Claude
  e stream de `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta construtores de provedor,
  ajudantes de modelo padrão e construtores de provedor em tempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o construtor de provedor
  além de ajudantes de onboarding/configuração.

<Warning>
  O código de produção de extensões também deve evitar importações de `openclaw/plugin-sdk/<other-plugin>`.
  Se um ajudante for realmente compartilhado, promova-o para um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capacidade, em vez de acoplar dois Plugins.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pontos de entrada" icon="door-open" href="/pt-BR/plugins/sdk-entrypoints">
    Opções de `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Auxiliares de runtime" icon="gears" href="/pt-BR/plugins/sdk-runtime">
    Referência completa do namespace `api.runtime`.
  </Card>
  <Card title="Configuração e ajustes" icon="sliders" href="/pt-BR/plugins/sdk-setup">
    Empacotamento, manifestos e esquemas de configuração.
  </Card>
  <Card title="Testes" icon="vial" href="/pt-BR/plugins/sdk-testing">
    Utilitários de teste e regras de lint.
  </Card>
  <Card title="Migração do SDK" icon="arrows-turn-right" href="/pt-BR/plugins/sdk-migration">
    Migração de superfícies obsoletas.
  </Card>
  <Card title="Internos do Plugin" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura detalhada e modelo de capacidades.
  </Card>
</CardGroup>
