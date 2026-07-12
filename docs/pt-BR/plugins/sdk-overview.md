---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência de todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de plugins
x-i18n:
    generated_at: "2026-07-12T15:30:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

O SDK de plugins é o contrato tipado entre os plugins e o núcleo. Esta página é a
referência sobre **o que importar** e **o que você pode registrar**.

<Note>
  Esta página destina-se a autores de plugins que usam `openclaw/plugin-sdk/*` dentro do
  OpenClaw. Para aplicativos externos, scripts, painéis, tarefas de CI e extensões de IDE
  que desejam executar agentes por meio do Gateway, use
  [Integrações do Gateway para aplicativos externos](/pt-BR/gateway/external-apps).
</Note>

<Tip>
Procurando um guia prático? Comece com [Criação de plugins](/pt-BR/plugins/building-plugins). Use [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para canais, [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) para provedores de modelos, [Plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins) para backends locais de CLI de IA, [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness) para executores nativos de agentes e [Hooks de plugins](/pt-BR/plugins/hooks) para hooks de ferramentas ou de ciclo de vida.
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para auxiliares de entrada/compilação específicos
de canal, prefira `openclaw/plugin-sdk/channel-core`; mantenha
`openclaw/plugin-sdk/core` para a superfície abrangente mais ampla e auxiliares
compartilhados, como `buildChannelConfigSchema`.

Para a configuração de canal, publique o JSON Schema pertencente ao canal por meio de
`openclaw.plugin.json#channelConfigs`. O subcaminho
`plugin-sdk/channel-config-schema` destina-se às primitivas de esquema compartilhadas e ao
construtor genérico. Os plugins incluídos no OpenClaw usam
`plugin-sdk/bundled-channel-config-schema` para esquemas preservados de canais
incluídos. As exportações de compatibilidade obsoletas permanecem em
`plugin-sdk/channel-config-schema-legacy`; nenhum dos subcaminhos de esquemas incluídos é um
padrão para novos plugins.

<Warning>
  Não importe interfaces de conveniência associadas a um provedor ou canal (por exemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Os plugins incluídos compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do núcleo devem usar esses barrels locais do
  plugin ou adicionar um contrato genérico e restrito do SDK quando uma necessidade for
  realmente comum a vários canais.

Um pequeno conjunto de interfaces auxiliares de plugins incluídos ainda aparece no mapa de
exportações gerado quando possui uso rastreado pelo proprietário. Elas existem apenas para
a manutenção de plugins incluídos e não são caminhos de importação recomendados para novos
plugins de terceiros.

`openclaw/plugin-sdk/discord` e `openclaw/plugin-sdk/telegram-account` também são
mantidos como fachadas de compatibilidade obsoletas para uso rastreado pelo proprietário.
Não copie esses caminhos de importação para novos plugins; em vez disso, use auxiliares de
runtime injetados e subcaminhos genéricos do SDK de canal.
</Warning>

## Referência de subcaminhos

O SDK de plugins é exposto como um conjunto de subcaminhos restritos agrupados por área
(entrada do plugin, canal, provedor, autenticação, runtime, capacidade, memória e auxiliares
reservados de plugins incluídos). Para ver o catálogo completo — agrupado e com links —,
consulte [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).

O inventário de pontos de entrada do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações do pacote são geradas a partir
do subconjunto público após subtrair os subcaminhos internos/de teste locais do repositório
listados em `scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Execute
`pnpm plugin-sdk:surface` para auditar a quantidade de exportações públicas. Os subcaminhos
públicos obsoletos que são antigos o suficiente e não são usados pelo código de produção das
extensões incluídas são rastreados em
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrels amplos de reexportação
obsoleta são rastreados em
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidades

| Método                                           | O que ele registra                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)                                                                     |
| `api.registerWorkerProvider(...)`                | Locações de ciclo de vida de workers na nuvem                                                  |
| `api.registerModelCatalogProvider(...)`          | Linhas do catálogo de modelos para geração de texto e mídia                                    |
| `api.registerAgentHarness(...)`                  | Executor nativo de agentes [experimental](/pt-BR/plugins/sdk-agent-harness) (Codex, Copilot)         |
| `api.registerCliBackend(...)`                    | Backend local de inferência por CLI                                                            |
| `api.registerChannel(...)`                       | Canal de mensagens                                                                             |
| `api.registerEmbeddingProvider(...)`             | Provedor reutilizável de embeddings vetoriais                                                  |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT                                                               |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming                                                        |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões duplex de voz em tempo real                                                            |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo                                                                  |
| `api.registerTranscriptSourceProvider(...)`      | Fonte de transcrição de reunião ao vivo ou importada                                           |
| `api.registerImageGenerationProvider(...)`       | Geração de imagens                                                                             |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                                                                              |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeos                                                                              |
| `api.registerWebFetchProvider(...)`              | Provedor de busca direta / extração de conteúdo da web                                         |
| `api.registerWebSearchProvider(...)`             | Pesquisa na web                                                                                |
| `api.registerCompactionProvider(...)`            | Backend conectável de Compaction de transcrições                                               |

Os provedores de workers também devem declarar seu id em `contracts.workerProviders`.
O núcleo persiste a intenção durável antes de `provision(profile, operationId)`. Os provedores validam as configurações antes da alocação externa e lançam `WorkerProviderError` em caso de rejeição permanente do perfil. `provision` deve adotar a mesma locação quando o id da operação se repetir.
O núcleo persiste as configurações validadas do perfil junto com a locação e fornece esse instantâneo a `destroy({ leaseId, profile })`, que deve ser idempotente, e a `inspect({ leaseId, profile })`, que retorna `active`, `destroyed` ou `unknown`. Isso permite que os provedores encaminhem chamadas de ciclo de vida após a reinicialização do Gateway ou a remoção de um perfil nomeado. Os endpoints SSH usam um `SecretRef` para `keyRef`, nunca material de chave embutido, e incluem um `hostKey` proveniente de uma saída confiável de provisionamento exatamente no formato `algorithm base64`, sem nome de host nem comentário. O núcleo fixa o `hostKey` e nunca confia em uma chave obtida na primeira conexão. Um provedor que gera um `keyRef` dinâmico pode implementar `resolveSshIdentity({ leaseId, profile, keyRef })`; quando presente, esse resolvedor é autoritativo, enquanto os provedores sem ele usam o resolvedor genérico de segredos configurado.
Os provedores com locações renováveis também podem implementar `renew(leaseId)`.
`inspect` deve lançar um erro em falhas transitórias ou indeterminadas; retorne `unknown` apenas em caso de ausência autoritativa. O núcleo marca um registro local ativo como órfão ou trata a ausência como conclusão da desativação após uma solicitação de destruição persistida.

Os provedores de embeddings registrados com `api.registerEmbeddingProvider(...)` também devem
ser listados em `contracts.embeddingProviders` no manifesto do plugin. Esta é
a superfície genérica de embeddings para geração reutilizável de vetores. A pesquisa na memória
pode consumir essa superfície genérica de provedor. A interface anterior
`api.registerMemoryEmbeddingProvider(...)` e
`contracts.memoryEmbeddingProviders` é uma compatibilidade obsoleta enquanto
os provedores existentes específicos de memória são migrados.

Os provedores específicos de memória que ainda expõem um `batchEmbed(...)` no runtime permanecem no
contrato existente de processamento em lotes por arquivo, a menos que seu runtime defina explicitamente
`sourceWideBatchEmbed: true`. Essa adesão permite que o host de memória envie fragmentos de
vários arquivos de memória alterados e fontes habilitadas em uma chamada a `batchEmbed(...)`, até
os limites de lote do host. Adaptadores de lote que enviam arquivos de solicitação JSONL devem
dividir as tarefas do provedor antes de atingir o limite de tamanho de upload e também o limite de
quantidade de solicitações. O provedor deve retornar um embedding por fragmento de entrada na mesma ordem de
`batch.chunks`; omita o sinalizador quando o provedor esperar lotes locais por arquivo ou
não puder preservar a ordem das entradas em uma tarefa maior que abranja toda a fonte.

### Ferramentas e comandos

Use [`defineToolPlugin`](/pt-BR/plugins/tool-plugins) para plugins simples que contêm apenas ferramentas
com nomes fixos. Use `api.registerTool(...)` diretamente para plugins mistos
ou para o registro totalmente dinâmico de ferramentas.

| Método                                 | O que ele registra                                                                                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Ferramenta do agente (obrigatória ou `{ optional: true }`)                                                                                                            |
| `api.registerCommand(def)`             | Comando personalizado (ignora o LLM)                                                                                                                                 |
| `api.registerNodeHostCommand(command)` | Comando processado por `openclaw node run`; metadados opcionais de `agentTool` podem expô-lo como uma ferramenta visível para o agente enquanto o Node estiver conectado |

Os comandos de plugins podem definir `agentPromptGuidance` quando o agente precisar de uma dica curta
de roteamento pertencente ao comando. Mantenha esse texto relacionado ao próprio comando; não adicione
políticas específicas de provedor ou plugin aos construtores de prompts do núcleo.

As entradas de orientação podem ser strings legadas, que se aplicam a toda superfície de prompt, ou
entradas estruturadas:

```ts
agentPromptGuidance: [
  "Dica global do comando.",
  { text: "Mostre isto apenas no prompt principal do OpenClaw.", surfaces: ["openclaw_main"] },
];
```

As `surfaces` estruturadas podem incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` ou `subagent`. `pi_main` permanece como um alias obsoleto
de `openclaw_main`. Omita `surfaces` quando a orientação for intencionalmente destinada a todas as superfícies. Não
passe um array `surfaces` vazio; ele é rejeitado para que uma perda acidental de escopo não
transforme o texto em um prompt global.

As instruções nativas para desenvolvedores do servidor de aplicativos Codex são mais rigorosas do que outras superfícies de
prompt: somente orientações explicitamente limitadas a `codex_app_server` são promovidas para
essa via de prioridade mais alta. Orientações em strings legadas e orientações estruturadas sem escopo
permanecem disponíveis para superfícies de prompt que não sejam do Codex por compatibilidade.

Os comandos do host Node são executados no host Node conectado, não dentro do
processo do Gateway. Se `agentTool` estiver presente, o Node publicará um descritor após uma
conexão bem-sucedida ao Gateway; o Gateway o disponibilizará às execuções do agente somente enquanto esse
Node estiver conectado e somente se o `command` do descritor estiver na superfície de comandos
aprovada do Node. Defina `agentTool.defaultPlatforms` para incluir um
comando não perigoso na lista de permissões padrão de comandos do Node; caso contrário, exija
`gateway.nodes.allowCommands` explícito ou uma política de invocação do Node. `agentTool.name`
deve ser seguro para provedores: começar com uma letra, usar apenas letras, dígitos,
sublinhados ou hifens e ter no máximo 64 caracteres. As ferramentas do Node com suporte de MCP
podem definir metadados `agentTool.mcp` para que as superfícies de catálogo e pesquisa de ferramentas exibam
a identidade do servidor/ferramenta MCP remoto, mas a execução ainda passa pelo
comando anunciado do Node.

### Infraestrutura

| Método                                          | O que registra                                                |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                                                |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP do Gateway                                      |
| `api.registerGatewayMethod(name, handler)`      | Método RPC do Gateway                                         |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante de descoberta do Gateway local                     |
| `api.registerCli(registrar, opts?)`             | Subcomando da CLI                                             |
| `api.registerNodeCliFeature(registrar, opts?)`  | Recurso de CLI do Node em `openclaw nodes`                    |
| `api.registerService(service)`                  | Serviço em segundo plano                                      |
| `api.registerInteractiveHandler(registration)`  | Manipulador interativo                                        |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware de resultados de ferramentas do runtime            |
| `api.registerMemoryPromptSupplement(builder)`   | Seção adicional do prompt adjacente à memória                 |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus adicional de pesquisa/leitura da memória               |
| `api.registerHostedMediaResolver(resolver)`     | Resolvedor de URLs de mídia hospedada no estilo de navegador  |
| `api.registerTextTransforms(transforms)`        | Reescritas de texto de compatibilidade de prompts/mensagens pertencentes ao Plugin |
| `api.registerConfigMigration(migrate)`          | Migração leve de configuração executada antes do carregamento do runtime do Plugin |
| `api.registerMigrationProvider(provider)`       | Importador para `openclaw migrate`                            |
| `api.registerAutoEnableProbe(probe)`            | Sondagem de configuração que pode habilitar este Plugin automaticamente |
| `api.registerReload(registration)`              | Política de prefixo de configuração de reinício/recarga dinâmica/nenhuma ação para tratamento de recarga |
| `api.registerNodeHostCommand(command)`          | Manipulador de comandos exposto a Nodes pareados              |
| `api.registerNodeInvokePolicy(policy)`          | Política de lista de permissões/aprovação para comandos invocados pelo Node |
| `api.registerSecurityAuditCollector(collector)` | Coletor de constatações para `openclaw security audit`        |

Os construtores de suplementos de prompt de memória recebem o contexto opcional `agentId`,
`agentSessionKey` e `sandboxed`. As chamadas `search`
e `get` do suplemento do corpus de memória recebem o contexto opcional `agentId` e `sandboxed`. Plugins com
armazenamento pertencente ao agente devem resolver esse armazenamento a cada chamada, em vez de
capturar um único caminho global durante o registro. Se um ID de agente for obrigatório, mas
estiver ausente em uma operação multiagente, falhe de forma fechada em vez de escolher um
agente arbitrário.

Os manipuladores interativos do Telegram podem retornar `{ submitText }` para encaminhar o texto pelo
fluxo normal de entrada do agente do Telegram após o sucesso do manipulador. O OpenClaw mantém
o botão de callback quando a política de entrada ignora o texto ou o processamento falha, para que
o usuário possa tentar novamente depois que a condição de bloqueio mudar. Esse campo de resultado é
específico do Telegram; outros canais mantêm seus próprios contratos de resultados interativos.

### Hooks do host para Plugins de fluxo de trabalho

Os hooks do host são as interfaces do SDK para Plugins que precisam participar do ciclo de vida
do host, em vez de apenas adicionar um provedor, canal ou ferramenta. Eles são
contratos genéricos; o Modo de Planejamento pode usá-los, assim como fluxos de trabalho de aprovação,
controles de política do espaço de trabalho, monitores em segundo plano, assistentes de configuração e Plugins
complementares de UI.

| Método                                                                               | Contrato sob sua responsabilidade                                                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sessão pertencente ao Plugin, compatível com JSON, projetado por meio das sessões do Gateway                                                       |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto durável e injetado exatamente uma vez no próximo turno do agente para uma sessão                                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Política confiável de ferramentas anterior ao Plugin, condicionada pelo manifesto, que pode bloquear ou reescrever parâmetros da ferramenta                  |
| `api.registerToolMetadata(...)`                                                      | Metadados de exibição do catálogo de ferramentas sem alterar a implementação da ferramenta                                                                   |
| `api.registerCommand(...)`                                                           | Comandos de Plugin com escopo; os resultados dos comandos podem definir `continueAgent: true` ou `suppressReply: true`; os comandos nativos do Discord aceitam `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descritores de contribuição da UI de Controle para superfícies de sessão, ferramenta, execução, configurações ou aba                                         |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de limpeza para recursos do runtime pertencentes ao Plugin nos fluxos de redefinição/exclusão/recarga                                               |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Assinaturas de eventos sanitizados para estado e monitores do fluxo de trabalho                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporário do Plugin por execução, limpo no ciclo de vida terminal da execução                                                                         |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadados de limpeza para trabalhos do agendador pertencentes ao Plugin; não agenda trabalho nem cria registros de tarefa                                     |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de anexos de arquivo mediada pelo host, exclusiva para Plugins incluídos, à rota de saída direta ativa da sessão                                      |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sessão agendados com suporte de Cron, exclusivos para Plugins incluídos, além de limpeza baseada em tags                                             |
| `api.session.controls.registerSessionAction(...)`                                    | Ações de sessão tipadas que os clientes podem despachar pelo Gateway                                                                                          |

Um descritor `surface: "tab"` adiciona uma aba à barra lateral da UI de Controle. Os descritores
de aba dos Plugins ativos são anunciados aos clientes do painel no hello do Gateway
(`controlUiTabs`), portanto a aba aparece somente enquanto o Plugin está habilitado.
Plugins incluídos podem fornecer uma visualização de painel de primeira classe para sua aba; outros
Plugins podem definir `path` para uma rota HTTP do Plugin (consulte
`api.registerHttpRoute(...)`) que o painel renderiza em um frame em sandbox.
`icon` é uma sugestão de nome de ícone do painel, `group` seleciona a seção da barra lateral
(`control` ou `agent`), `order` ordena entre as abas de Plugins e `requiredScopes`
oculta a aba de conexões que não tenham esses escopos de operador:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Diário",
  description: "Seu dia como uma linha do tempo, criada a partir de capturas de tela.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Use os namespaces agrupados para novo código de Plugin:

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

Os métodos simples equivalentes permanecem disponíveis como aliases de compatibilidade
obsoletos para Plugins existentes. Não adicione novo código de Plugin que chame
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ou
`api.unscheduleSessionTurnsByTag` diretamente.

`scheduleSessionTurn(...)` é uma conveniência com escopo de sessão sobre o agendador
Cron do Gateway. O Cron controla o tempo e cria o registro da tarefa em segundo plano quando o
turno é executado; o SDK do Plugin restringe apenas a sessão de destino, a
nomenclatura pertencente ao Plugin e a limpeza. Use `api.runtime.tasks.managedFlows` dentro do turno
agendado quando o trabalho em si precisar de estado durável de Task Flow com várias etapas.

Os contratos separam a autoridade intencionalmente:

- Plugins externos podem ser responsáveis por extensões de sessão, descritores de UI, comandos, metadados de
  ferramentas, injeções no próximo turno e hooks normais.
- As políticas confiáveis de ferramentas são executadas antes dos hooks `before_tool_call` comuns e são
  consideradas confiáveis pelo host. As políticas incluídas são executadas primeiro; as políticas de Plugins instalados exigem
  habilitação explícita, além de seus IDs locais em
  `contracts.trustedToolPolicies`, e são executadas em seguida, na ordem de carregamento dos Plugins. Os IDs das políticas
  têm escopo limitado ao Plugin que os registra.
- A propriedade de comandos reservados é exclusiva de Plugins incluídos. Plugins externos devem usar seus
  próprios nomes de comandos ou aliases.
- `allowPromptInjection=false` desabilita hooks que modificam prompts, incluindo
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  campos de prompt do `before_agent_start` legado e
  `enqueueNextTurnInjection`.

Exemplos de consumidores que não usam o Modo de Planejamento:

| Arquétipo de Plugin                    | Hooks usados                                                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fluxo de trabalho de aprovação         | Extensão de sessão, continuação de comando, injeção no próximo turno, descritor de UI                                                               |
| Controle de política de orçamento/espaço de trabalho | Política de ferramenta confiável, metadados de ferramenta, projeção de sessão                                                                       |
| Monitor de ciclo de vida em segundo plano | Limpeza do ciclo de vida do runtime, assinatura de eventos do agente, propriedade/limpeza do agendador de sessão, contribuição ao prompt de Heartbeat, descritor de UI |
| Assistente de configuração ou integração | Extensão de sessão, comandos com escopo, descritor da Control UI                                                                                     |

<Note>
  Os namespaces administrativos reservados do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem como `operator.admin`, mesmo que um Plugin tente atribuir um
  escopo de método do Gateway mais restrito. Prefira prefixos específicos do Plugin para
  métodos pertencentes ao Plugin.
</Note>

<Accordion title="Quando usar middleware de resultado de ferramenta">
  Plugins integrados e Plugins instalados explicitamente habilitados com contratos
  de manifesto correspondentes podem usar `api.registerAgentToolResultMiddleware(...)` quando
  precisam reescrever um resultado de ferramenta após a execução e antes que o runtime
  forneça esse resultado de volta ao modelo. Essa é a interface confiável e neutra quanto ao runtime
  para redutores de saída assíncronos, como tokenjuice.

Os Plugins devem declarar `contracts.agentToolResultMiddleware` para cada runtime
de destino, por exemplo, `["openclaw", "codex"]`. Plugins instalados sem esse
contrato, ou sem habilitação explícita, não podem registrar esse middleware; mantenha
os hooks normais de Plugin do OpenClaw para trabalhos que não precisam do
momento de resultado de ferramenta anterior ao modelo. O antigo caminho de registro
da fábrica de extensões exclusivo do executor integrado foi removido.
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

- `commands`: nomes explícitos de comandos pertencentes ao registrador
- `descriptors`: descritores de comando durante a análise usados para ajuda da CLI,
  roteamento e registro tardio da CLI do Plugin
- `parentPath`: caminho opcional do comando pai para grupos de comandos aninhados, como
  `["nodes"]`

Para recursos de Node emparelhado, prefira
`api.registerNodeCliFeature(registrar, opts?)`. Ele é um pequeno wrapper em torno de
`api.registerCli(..., { parentPath: ["nodes"] })` e torna comandos como
`openclaw nodes canvas` recursos de Node explicitamente pertencentes ao Plugin.

Se quiser que um comando do Plugin permaneça com carregamento tardio no caminho raiz normal da CLI,
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
        description: "Gerenciar contas, verificação, dispositivos e estado do perfil do Matrix",
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
        description: "Capturar ou renderizar conteúdo de canvas de um Node emparelhado",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use apenas `commands` somente quando não precisar do registro tardio da CLI raiz.
Esse caminho de compatibilidade com carregamento imediato continua compatível, mas não instala
espaços reservados respaldados por descritores para carregamento tardio durante a análise.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um Plugin controle a configuração padrão de um backend
local de CLI de IA, como `claude-cli` ou `my-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `my-cli/gpt-5`.
- A `config` do backend usa o mesmo formato que `agents.defaults.cliBackends.<id>`.
- A configuração do usuário ainda prevalece. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do Plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).
- Use `resolveExecutionArgs` para reescritas de argv com escopo da solicitação que pertencem ao
  dialeto da CLI, como mapear níveis de raciocínio do OpenClaw para uma flag nativa de esforço.
  O hook recebe `ctx.executionMode`; use `"side-question"` para adicionar
  flags de isolamento nativas do backend para chamadas efêmeras de `/btw`. Se essas flags
  desabilitarem de forma confiável as ferramentas nativas de uma CLI que, de outro modo, as manteria sempre ativas, declare
  também `sideQuestionToolMode: "disabled"`.
- Backends que podem desabilitar todas as ferramentas nativas para uma execução específica podem declarar
  `nativeToolMode: "selectable"`. Chamadas restritas passam uma tupla
  `ctx.toolAvailability.native` vazia, além de uma lista de permissões MCP exata e isolada do host;
  `resolveExecutionArgs` deve impor ambas no argv final, seja novo ou de retomada.
  O OpenClaw falha de modo fechado se o backend não puder fazer isso.

Para obter um guia completo de criação, consulte
[Plugins de backend da CLI](/pt-BR/plugins/cli-backend-plugins).

### Slots exclusivos

| Método                                     | O que ele registra                                                                                                                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mecanismo de contexto (um ativo por vez). Os callbacks do ciclo de vida recebem `runtimeSettings` quando o host pode fornecer diagnósticos de modelo/provedor/modo; mecanismos estritos mais antigos são repetidos sem essa chave. |
| `api.registerMemoryCapability(capability)` | Capacidade unificada de memória                                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória                                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de liberação de memória                                                                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                                                                                          |

### Adaptadores obsoletos de embeddings de memória

| Método                                         | O que ele registra                                 |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memória para o Plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para Plugins de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que Plugins complementares possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core`, em vez de acessar o layout privado de um
  Plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas de Plugins de memória compatíveis com versões legadas.
- `MemoryFlushPlan.model` pode fixar o turno de liberação em uma referência exata de `provider/model`,
  como `ollama/qwen3:8b`, sem herdar a cadeia de fallback ativa.
- `registerMemoryEmbeddingProvider` está obsoleto. Novos provedores de embeddings
  devem usar `api.registerEmbeddingProvider(...)` e
  `contracts.embeddingProviders`.
- Os provedores existentes específicos de memória continuam funcionando durante a janela de
  migração, mas a inspeção de Plugins relata isso como dívida de compatibilidade para
  Plugins não integrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz                         |
| -------------------------------------------- | ------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida          |
| `api.onConversationBindingResolved(handler)` | Callback de vinculação de conversa    |

Consulte [Hooks de Plugin](/pt-BR/plugins/hooks) para ver exemplos, nomes comuns de hooks e semântica
de proteções.

### Semântica de decisão de hooks

`before_install` é um hook de ciclo de vida do runtime do Plugin, não a superfície de política
de instalação do operador. Use `security.installPolicy` quando uma decisão de permitir/bloquear precisar
abranger caminhos de instalação ou atualização pela CLI e com suporte do Gateway.

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que qualquer manipulador definir esse valor, os manipuladores de menor prioridade serão ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (o mesmo que omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Assim que qualquer manipulador definir esse valor, os manipuladores de menor prioridade serão ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (o mesmo que omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Assim que qualquer manipulador assumir o despacho, os manipuladores de menor prioridade e o caminho padrão de despacho do modelo serão ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que qualquer manipulador definir esse valor, os manipuladores de menor prioridade serão ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (o mesmo que omitir `cancel`), não como uma substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para dados adicionais específicos do canal.
- `message_sending`: use os campos de roteamento tipados `replyToId` / `threadId` antes de recorrer a `metadata` específico do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para o estado de inicialização pertencente ao Gateway, em vez de depender dos hooks internos `gateway:startup`. O Cron ainda pode estar sendo carregado nesse momento.
- `cron_reconciled`: reconstrua uma projeção externa completa do Cron após a inicialização ou o recarregamento do agendador. Ela inclui `reason` e o estado efetivo de `enabled`, inclusive `enabled: false`, enquanto `ctx.getCron?.()` retorna o agendador reconciliado exato. Passe `ctx.abortSignal` para o trabalho de projeção durável; ele é abortado quando esse snapshot do agendador é substituído ou quando o Gateway é fechado.
- `cron_changed`: observe alterações no ciclo de vida do Cron pertencente ao Gateway. Os eventos `scheduled` e `removed` são indicações de reconciliação pós-confirmação, não um log ordenado de deltas. O `event.nextRunAtMs` de um evento agendado não está presente quando a tarefa não tem uma próxima ativação; um evento removido ainda carrega o snapshot da tarefa excluída.

Agendadores externos de ativação devem aplicar debounce ou agregar eventos `cron_changed`
e, em seguida, reler a visualização durável completa do último agendador capturado por
`cron_reconciled`. Não adote o agendador de um contexto `cron_changed`: uma
indicação desacoplada de um agendador mais antigo pode se sobrepor a um recarregamento posterior.

Use `cron_reconciled` como o gatilho de snapshot completo para o estado durável carregado na
inicialização do Gateway ou na substituição do agendador. Ele não é reproduzido em um
recarregamento a quente exclusivo do Plugin. Os manipuladores de observação são executados em paralelo, e os
despachos sem espera podem se sobrepor; portanto, os consumidores não devem depender da ordem de conclusão dos eventos.
Mantenha o OpenClaw como a fonte da verdade para verificações de vencimento e execução.

Para um adaptador de execução única com substituição durável, repetição/backoff e
encerramento limpo, consulte [Projeção externa segura do Cron](/pt-BR/plugins/hooks#safe-external-cron-projection).

### Campos do objeto da API

| Campo                    | Tipo                      | Descrição                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID do Plugin                                                                               |
| `api.name`               | `string`                  | Nome de exibição                                                                           |
| `api.version`            | `string?`                 | Versão do Plugin (opcional)                                                                |
| `api.description`        | `string?`                 | Descrição do Plugin (opcional)                                                             |
| `api.source`             | `string`                  | Caminho de origem do Plugin                                                                |
| `api.rootDir`            | `string?`                 | Diretório raiz do Plugin (opcional)                                                        |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da configuração (snapshot ativo do runtime em memória, quando disponível)   |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do Plugin proveniente de `plugins.entries.<id>.config`             |
| `api.runtime`            | `PluginRuntime`           | [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração anterior à entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve um caminho relativo à raiz do Plugin                                                |

## Convenção de módulos internos

Dentro do seu Plugin, use arquivos barrel locais para importações internas:

```text
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações de runtime somente para uso interno
  index.ts          # Ponto de entrada do Plugin
  setup-entry.ts    # Entrada leve somente para configuração (opcional)
```

<Warning>
  Nunca importe seu próprio Plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  no código de produção. Encaminhe as importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

As superfícies públicas de Plugins incluídos carregados por facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos de entrada públicos semelhantes) preferem o
snapshot ativo da configuração do runtime quando o OpenClaw já está em execução. Se ainda não houver um snapshot
do runtime, elas recorrem ao arquivo de configuração resolvido no disco.
As facades de Plugins incluídos no pacote devem ser carregadas pelos carregadores de facade de Plugins
do OpenClaw; importações diretas de `dist/extensions/...` ignoram as verificações de manifesto
e de sidecar do runtime que as instalações empacotadas usam para código pertencente ao Plugin.

Plugins de provedor podem expor um barrel de contrato restrito e local ao Plugin quando um
auxiliar é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico do SDK.
Exemplos incluídos:

- **Anthropic**: interface pública `api.ts` / `contract-api.ts` para auxiliares de stream de
  cabeçalho beta do Claude e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta construtores de provedor,
  auxiliares de modelo padrão e construtores de provedor em tempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o construtor de provedor
  e auxiliares de integração/configuração.

<Warning>
  O código de produção de extensões também deve evitar importações de `openclaw/plugin-sdk/<other-plugin>`.
  Se um auxiliar for realmente compartilhado, promova-o a um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a recursos, em vez de acoplar dois Plugins.
</Warning>

## Relacionados

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
  <Card title="Componentes internos do Plugin" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura detalhada e modelo de recursos.
  </Card>
</CardGroup>
