---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está consultando uma exportação específica do SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-05-02T05:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

O SDK de plugins é o contrato tipado entre plugins e o core. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Note>
  Esta página é para autores de plugins que usam `openclaw/plugin-sdk/*` dentro
  do OpenClaw. Para apps externos, scripts, dashboards, tarefas de CI e extensões
  de IDE que querem executar agentes por meio do Gateway, use o
  [SDK de Apps OpenClaw](/pt-BR/concepts/openclaw-sdk) e o pacote `@openclaw/sdk`
  em vez disso.
</Note>

<Tip>
Procurando um guia prático? Comece com [Criação de plugins](/pt-BR/plugins/building-plugins), use [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para plugins de canal, [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para plugins de provedor e [Hooks de plugin](/pt-BR/plugins/hooks) para plugins de ferramentas ou hooks de ciclo de vida.
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
previne problemas de dependência circular. Para helpers de entrada/build específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície guarda-chuva mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

Para configuração de canal, publique o JSON Schema pertencente ao canal por meio de
`openclaw.plugin.json#channelConfigs`. O subcaminho `plugin-sdk/channel-config-schema`
é para primitivas de esquema compartilhadas e o builder genérico. Os plugins
incluídos no OpenClaw usam `plugin-sdk/bundled-channel-config-schema` para esquemas
retidos de canais incluídos. Exports de compatibilidade obsoletos permanecem em
`plugin-sdk/channel-config-schema-legacy`; nenhum subcaminho de esquema incluído é um
padrão para novos plugins.

<Warning>
  Não importe seams de conveniência com marca de provedor ou canal (por exemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do core devem usar esses barrels locais do plugin
  ou adicionar um contrato genérico estreito do SDK quando uma necessidade for realmente
  entre canais.

Um pequeno conjunto de seams helper de plugins incluídos ainda aparece no mapa de exportação
gerado quando há uso rastreado pelo proprietário. Eles existem apenas para manutenção de
plugins incluídos e não são caminhos de importação recomendados para novos plugins de terceiros.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` também são
mantidos como facades de compatibilidade obsoletas para uso rastreado pelo proprietário. Não
copie esses caminhos de importação para novos plugins; use helpers de runtime injetados e
subcaminhos genéricos do SDK de canal em vez disso.
</Warning>

## Referência de subcaminhos

O SDK de plugins é exposto como um conjunto de subcaminhos estreitos agrupados por área (entrada de plugin,
canal, provedor, autenticação, runtime, capacidade, memória e helpers reservados de plugins incluídos). Para o catálogo completo — agrupado e vinculado — consulte
[Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).

A lista gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Método                                           | O que registra                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)              |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência da CLI     |
| `api.registerChannel(...)`                       | Canal de mensagens                     |
| `api.registerSpeechProvider(...)`                | Texto para fala / síntese STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz em tempo real duplex    |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo          |
| `api.registerImageGenerationProvider(...)`       | Geração de imagens                     |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                      |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                       |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/coleta na web        |
| `api.registerWebSearchProvider(...)`             | Pesquisa na web                        |

### Ferramentas e comandos

| Método                          | O que registra                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)           |

Comandos de plugin podem definir `agentPromptGuidance` quando o agente precisa de uma dica curta
de roteamento pertencente ao comando. Mantenha esse texto sobre o próprio comando; não adicione
política específica de provedor ou plugin aos builders de prompt do core.

### Infraestrutura

| Método                                         | O que registra                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway                |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway                   |
| `api.registerGatewayDiscoveryService(service)` | Anunciante local de descoberta do Gateway |
| `api.registerCli(registrar, opts?)`            | Subcomando da CLI                       |
| `api.registerService(service)`                 | Serviço em segundo plano                |
| `api.registerInteractiveHandler(registration)` | Handler interativo                      |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware de resultado de ferramenta em runtime |
| `api.registerMemoryPromptSupplement(builder)`  | Seção aditiva de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aditivo de pesquisa/leitura de memória |

### Hooks de host para plugins de workflow

Hooks de host são os seams do SDK para plugins que precisam participar do ciclo de vida do host,
em vez de apenas adicionar um provedor, canal ou ferramenta. Eles são contratos
genéricos; o Modo Planejamento pode usá-los, mas fluxos de aprovação,
gates de política de workspace, monitores em segundo plano, assistentes de configuração e plugins
companheiros de UI também podem.

| Método                                                                   | Contrato que ele possui                                                                                                            |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Estado de sessão pertencente ao plugin, compatível com JSON, projetado por meio de sessões do Gateway                              |
| `api.enqueueNextTurnInjection(...)`                                      | Contexto durável exatamente uma vez injetado no próximo turno do agente para uma sessão                                            |
| `api.registerTrustedToolPolicy(...)`                                     | Política de ferramenta pré-plugin incluída/confiável que pode bloquear ou reescrever parâmetros de ferramenta                       |
| `api.registerToolMetadata(...)`                                          | Metadados de exibição do catálogo de ferramentas sem alterar a implementação da ferramenta                                          |
| `api.registerCommand(...)`                                               | Comandos de plugin com escopo; resultados de comando podem definir `continueAgent: true`; comandos nativos do Discord suportam `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descritores de contribuição da Control UI para superfícies de sessão, ferramenta, execução ou configurações                         |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de limpeza para recursos de runtime pertencentes ao plugin em caminhos de reset/exclusão/recarregamento                   |
| `api.registerAgentEventSubscription(...)`                                | Assinaturas de eventos sanitizadas para estado de workflow e monitores                                                              |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Estado temporário por execução do plugin limpo no ciclo de vida terminal da execução                                                |
| `api.registerSessionSchedulerJob(...)`                                   | Registros de tarefas do agendador de sessão pertencentes ao plugin com limpeza determinística                                       |

Os contratos dividem autoridade intencionalmente:

- Plugins externos podem possuir extensões de sessão, descritores de UI, comandos, metadados de ferramenta, injeções de próximo turno e hooks normais.
- Políticas de ferramentas confiáveis são executadas antes de hooks `before_tool_call` comuns e são apenas para plugins incluídos porque participam da política de segurança do host.
- Propriedade de comandos reservados é apenas para plugins incluídos. Plugins externos devem usar seus próprios nomes de comando ou aliases.
- `allowPromptInjection=false` desativa hooks que alteram prompts, incluindo
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  campos de prompt do `before_agent_start` legado e
  `enqueueNextTurnInjection`.

Exemplos de consumidores que não são do Plano:

| Arquétipo de plugin          | Hooks usados                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow de aprovação        | Extensão de sessão, continuação de comando, injeção de próximo turno, descritor de UI                                                   |
| Gate de política de orçamento/workspace | Política de ferramenta confiável, metadados de ferramenta, projeção de sessão                                               |
| Monitor de ciclo de vida em segundo plano | Limpeza de ciclo de vida de runtime, assinatura de eventos do agente, propriedade/limpeza do agendador de sessão, contribuição de prompt de Heartbeat, descritor de UI |
| Assistente de configuração ou onboarding | Extensão de sessão, comandos com escopo, descritor da Control UI                                                            |

<Note>
  Namespaces reservados de administração do core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo se um plugin tentar atribuir um
  escopo de método Gateway mais estreito. Prefira prefixos específicos do plugin para
  métodos pertencentes ao plugin.
</Note>

<Accordion title="Quando usar middleware de resultado de ferramenta">
  Plugins incluídos podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisam reescrever um resultado de ferramenta após a execução e antes que o runtime
  alimente esse resultado de volta ao modelo. Este é o seam confiável e neutro de runtime
  para redutores de saída assíncronos, como tokenjuice.

Plugins incluídos devem declarar `contracts.agentToolResultMiddleware` para cada
runtime direcionado, por exemplo `["pi", "codex"]`. Plugins externos
não podem registrar este middleware; mantenha hooks normais de plugin do OpenClaw para trabalho
que não precise de timing de resultado de ferramenta antes do modelo. O antigo caminho de registro
de factory de extensão embutida apenas para Pi foi removido.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um plugin anuncie o Gateway ativo
em um transporte de descoberta local, como mDNS/Bonjour. O OpenClaw chama o
serviço durante a inicialização do Gateway quando a descoberta local está ativada, passa as
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
autenticação. Descoberta é uma dica de roteamento; a autenticação do Gateway e o pinning de TLS ainda
controlam a confiança.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes de comando explícitas pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de análise usados para a ajuda da CLI raiz,
  roteamento e registro lazy da CLI do plugin

Se você quiser que um comando de plugin permaneça carregado de forma lazy no caminho normal da CLI raiz,
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

Use `commands` sozinho apenas quando não precisar de registro lazy da CLI raiz.
Esse caminho de compatibilidade eager continua sendo compatível, mas não instala
placeholders baseados em descritores para carregamento lazy em tempo de análise.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um plugin controle a configuração padrão de um backend local
de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `codex-cli/gpt-5`.
- A `config` do backend usa o mesmo formato que `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).

### Slots exclusivos

| Método                                     | O que registra                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o engine possa personalizar acréscimos ao prompt. |
| `api.registerMemoryCapability(capability)` | Capacidade de memória unificada                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder de seção de prompt de memória                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                                    |

### Adaptadores de embedding de memória

| Método                                         | O que registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para plugin de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins companheiros possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core`, em vez de acessar o layout privado de um
  plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas de plugin de memória compatíveis com legado.
- `MemoryFlushPlan.model` pode fixar o turno de flush em uma referência exata de `provider/model`,
  como `ollama/qwen3:8b`, sem herdar a cadeia de fallback ativa.
- `registerMemoryEmbeddingProvider` permite que o plugin de memória ativo registre um
  ou mais ids de adaptador de embedding (por exemplo `openai`, `gemini` ou um id personalizado
  definido pelo plugin).
- Configurações do usuário como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` são resolvidas contra esses ids de adaptador
  registrados.

### Eventos e ciclo de vida

| Método                                       | O que faz                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida          |
| `api.onConversationBindingResolved(handler)` | Callback de vinculação de conversa |

Veja [hooks de Plugin](/pt-BR/plugins/hooks) para exemplos, nomes comuns de hooks e
semântica de guard.

### Semântica de decisão de hooks

- `before_tool_call`: retornar `{ block: true }` é terminal. Depois que qualquer manipulador o define, manipuladores de prioridade mais baixa são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como uma sobrescrita.
- `before_install`: retornar `{ block: true }` é terminal. Depois que qualquer manipulador o define, manipuladores de prioridade mais baixa são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como uma sobrescrita.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Depois que qualquer manipulador reivindica o despacho, manipuladores de prioridade mais baixa e o caminho padrão de despacho do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Depois que qualquer manipulador o define, manipuladores de prioridade mais baixa são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (igual a omitir `cancel`), não como uma sobrescrita.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de tópico/thread de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos de roteamento tipados `replyToId` / `threadId` antes de recorrer a `metadata` específico do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para o estado de inicialização pertencente ao gateway, em vez de depender de hooks internos `gateway:startup`.
- `cron_changed`: observe mudanças no ciclo de vida do cron pertencentes ao gateway. Use `event.job?.state?.nextRunAtMs` e `ctx.getCron?.()` ao sincronizar agendadores externos de ativação, e mantenha o OpenClaw como fonte da verdade para verificações de vencimento e execução.

### Campos do objeto da API

| Campo                    | Tipo                      | Descrição                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id do plugin                                                                                   |
| `api.name`               | `string`                  | Nome de exibição                                                                                |
| `api.version`            | `string?`                 | Versão do plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descrição do plugin (opcional)                                                               |
| `api.source`             | `string`                  | Caminho de origem do plugin                                                                          |
| `api.rootDir`            | `string?`                 | Diretório raiz do plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot da configuração atual (snapshot do runtime ativo em memória quando disponível)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do plugin de `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve caminho relativo à raiz do plugin                                                        |

## Convenção de módulo interno

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

Superfícies públicas de plugins empacotados carregadas por facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) preferem o
snapshot de configuração do runtime ativo quando o OpenClaw já está em execução. Se ainda não existir
snapshot de runtime, elas recorrem ao arquivo de configuração resolvido no disco.
Facades de plugins empacotados devem ser carregadas pelos carregadores de facade de plugin do OpenClaw;
imports diretos de `dist/extensions/...` ignoram o manifesto
e as verificações de sidecar de runtime que instalações empacotadas usam para código pertencente ao plugin.

Plugins de provedor podem expor um barrel de contrato estreito e local ao plugin quando um
helper é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico do SDK.
Exemplos empacotados:

- **Anthropic**: interface pública `api.ts` / `contract-api.ts` para helpers de header beta do Claude
  e stream de `service_tier`.
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

## Relacionado

<CardGroup cols={2}>
  <Card title="Pontos de entrada" icon="door-open" href="/pt-BR/plugins/sdk-entrypoints">
    Opções de `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Auxiliares de runtime" icon="gears" href="/pt-BR/plugins/sdk-runtime">
    Referência completa do namespace `api.runtime`.
  </Card>
  <Card title="Configuração e setup" icon="sliders" href="/pt-BR/plugins/sdk-setup">
    Empacotamento, manifestos e esquemas de configuração.
  </Card>
  <Card title="Testes" icon="vial" href="/pt-BR/plugins/sdk-testing">
    Utilitários de teste e regras de lint.
  </Card>
  <Card title="Migração do SDK" icon="arrows-turn-right" href="/pt-BR/plugins/sdk-migration">
    Migração de superfícies obsoletas.
  </Card>
  <Card title="Detalhes internos do Plugin" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura aprofundada e modelo de capacidades.
  </Card>
</CardGroup>
