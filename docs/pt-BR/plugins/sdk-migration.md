---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você usava api.registerEmbeddedExtensionFactory antes do OpenClaw 2026.4.25
    - Você está atualizando um plugin para a arquitetura moderna de plugins
    - Você mantém um plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migre da camada legada de compatibilidade retroativa para o SDK de Plugin moderno
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-07-12T15:28:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 805fa6b1492cec8bb0e4967a6b6606c91016a43ec5a3eb7d048e83aa7721704e
    source_path: plugins/sdk-migration.md
    workflow: 16
---

O OpenClaw substituiu uma ampla camada de compatibilidade retroativa por uma arquitetura moderna de plugins
construída com importações pequenas e específicas. Se o seu plugin for anterior a essa
mudança, este guia o adapta aos contratos atuais.

## O que mudou

Duas superfícies de importação totalmente abertas permitiam que os plugins acessassem quase qualquer coisa por
um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** - reexportava dezenas de auxiliares para manter
  plugins antigos baseados em hooks funcionando enquanto a nova arquitetura era desenvolvida.
- **`openclaw/plugin-sdk/infra-runtime`** - um barrel amplo que combinava eventos
  do sistema, estado de heartbeat, filas de entrega, auxiliares de fetch/proxy, auxiliares de arquivos,
  tipos de aprovação e utilitários sem relação entre si.
- **`openclaw/plugin-sdk/config-runtime`** - um barrel amplo de configuração que ainda
  mantinha auxiliares diretos obsoletos de carregamento/gravação durante o período de migração.
- **`openclaw/extension-api`** - uma ponte que dava aos plugins acesso direto a
  auxiliares do host, como o executor de agente incorporado.
- **`api.registerEmbeddedExtensionFactory(...)`** - um hook removido, exclusivo do
  executor incorporado, que observava eventos desse executor, como `tool_result`. Em vez disso, use
  middleware de resultados de ferramentas do agente (consulte [Migrar extensões de resultados de ferramentas incorporadas
  para middleware](#how-to-migrate)).

Essas superfícies estão **obsoletas**: elas ainda funcionam, mas novos plugins não devem
usá-las, e os plugins existentes devem migrar antes que a próxima versão principal
as remova. `registerEmbeddedExtensionFactory` já foi removido;
registros legados não são mais carregados.

<Warning>
  A camada de compatibilidade retroativa será removida em uma versão principal futura.
  Os plugins que ainda importarem dessas superfícies deixarão de funcionar quando isso ocorrer.
</Warning>

O OpenClaw não remove nem reinterpreta comportamentos documentados de plugins na mesma
alteração que introduz uma substituição. Alterações incompatíveis de contrato passam primeiro por um
adaptador de compatibilidade, diagnósticos, documentação e um período de descontinuação. Isso
se aplica a importações do SDK, campos de manifesto, APIs de configuração, hooks e comportamento
de registro em tempo de execução.

### Por quê

- **Inicialização lenta** - importar um auxiliar carregava dezenas de módulos não relacionados.
- **Dependências circulares** - reexportações amplas facilitavam a
  criação de ciclos de importação.
- **Superfície de API pouco clara** - não havia como distinguir exportações estáveis das internas.

Agora, cada `openclaw/plugin-sdk/<subpath>` é um módulo pequeno e independente com
um contrato documentado.

As interfaces legadas de conveniência de provedores para canais integrados também foram removidas -
os atalhos de auxiliares específicos de canais eram conveniências privadas do monorepo, não
contratos estáveis de plugins. Em vez disso, use subcaminhos genéricos e específicos do SDK. No
workspace de plugins integrados, mantenha os auxiliares pertencentes ao provedor no
`api.ts` ou `runtime-api.ts` do próprio plugin:

- A Anthropic mantém auxiliares de stream específicos do Claude em sua própria interface `api.ts` /
  `contract-api.ts`.
- A OpenAI mantém construtores de provedores, auxiliares de modelo padrão e construtores de provedores
  em tempo real em seu próprio `api.ts`.
- A OpenRouter mantém o construtor de provedor e os auxiliares de integração/configuração em seu próprio
  `api.ts`.

## Política de compatibilidade

O trabalho de compatibilidade de plugins externos segue esta ordem:

1. Adicionar o novo contrato.
2. Manter o comportamento antigo conectado por meio de um adaptador de compatibilidade.
3. Emitir um diagnóstico ou aviso que indique o caminho antigo e seu substituto.
4. Abranger ambos os caminhos em testes.
5. Documentar a descontinuação e o caminho de migração.
6. Remover somente após o período de migração anunciado, geralmente em uma versão
   principal.

Se um campo de manifesto ainda for aceito, continue usando-o até que a documentação e os
diagnósticos indiquem o contrário. Código novo deve preferir a substituição documentada;
plugins existentes não devem deixar de funcionar durante versões secundárias comuns.

Audite a fila de migração atual com `pnpm plugins:boundary-report`:

| Sinalizador                                             | Efeito                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (ou `pnpm plugins:boundary-report:summary`) | Contagens compactas em vez de detalhes completos.                              |
| `--json`                                                | Relatório legível por máquina.                                                  |
| `--owner <id>`                                          | Filtra por um plugin ou proprietário de compatibilidade.                       |
| `--fail-on-cross-owner`                                 | Encerra com código diferente de zero em importações reservadas do SDK entre proprietários. |
| `--fail-on-eligible-compat`                             | Encerra com código diferente de zero quando a data `removeAfter` de um registro de compatibilidade obsoleto já tiver passado. |
| `--fail-on-unclassified-unused-reserved`                | Encerra com código diferente de zero em shims reservados do SDK não utilizados. |

`pnpm plugins:boundary-report:ci` é executado com os três sinalizadores de falha. Cada
registro de compatibilidade tem uma data `removeAfter` explícita (não uma vaga "próxima
versão principal") - o relatório agrupa registros obsoletos por essa data, conta
referências locais no código/documentação, revela importações reservadas do SDK entre proprietários e
resume a ponte privada do SDK do host de memória. Subcaminhos reservados do SDK devem ter
o uso do proprietário rastreado; exportações reservadas não utilizadas devem ser removidas do SDK
público.

## Como migrar

<Steps>
  <Step title="Migrar auxiliares de carregamento/gravação da configuração em tempo de execução">
    Plugins integrados devem deixar de chamar `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)` diretamente. Prefira a configuração já
    passada ao caminho de chamada ativo. Manipuladores de longa duração que precisam do
    snapshot atual do processo podem usar `api.runtime.config.current()`. Ferramentas de
    agente de longa duração devem ler `ctx.getRuntimeConfig()` dentro de `execute` para que uma ferramenta
    criada antes de uma gravação de configuração ainda veja a configuração atualizada.

    As gravações de configuração passam pelo auxiliar transacional com uma política
    explícita após a gravação:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Use `afterWrite: { mode: "restart", reason: "..." }` quando a alteração exigir
    uma reinicialização limpa do gateway e `afterWrite: { mode: "none", reason: "..." }`
    somente quando o chamador for responsável pela ação subsequente e suprimir deliberadamente o
    planejador de recarga. Os resultados da mutação incluem um resumo tipado `followUp` para
    testes e logs; o gateway continua responsável por aplicar ou
    agendar a reinicialização.

    `loadConfig` e `writeConfigFile` permanecem como auxiliares de compatibilidade
    obsoletos para plugins externos e emitem um aviso uma única vez com o código de compatibilidade
    `runtime-config-load-write`. Plugins integrados e o código do repositório
    em tempo de execução são protegidos por `pnpm check:deprecated-api-usage` e
    `pnpm check:no-runtime-action-load-config`: o novo uso em plugins de produção
    falha imediatamente, gravações diretas de configuração falham, métodos do servidor do gateway devem usar
    o snapshot de tempo de execução da solicitação, auxiliares de envio/ação/cliente de canais em tempo de execução
    devem receber a configuração de seu limite, e módulos de longa duração em tempo de execução
    não permitem nenhuma chamada ambiente a `loadConfig()`.

    Código novo de plugin deve evitar o barrel amplo `openclaw/plugin-sdk/config-runtime`.
    Use o subcaminho específico para a tarefa:

    | Necessidade | Importação |
    | --- | --- |
    | Tipos de configuração, como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asserções de configuração já carregada e consulta de configuração da entrada do plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Leituras do snapshot atual em tempo de execução | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Gravações de configuração | `openclaw/plugin-sdk/config-mutation` |
    | Auxiliares do armazenamento de sessões | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuração de tabela Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Auxiliares de política de grupo em tempo de execução | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolução de entrada de segredos | `openclaw/plugin-sdk/secret-input-runtime` |
    | Substituições de modelo/sessão | `openclaw/plugin-sdk/model-session-runtime` |

    Plugins integrados e seus testes são protegidos por verificação contra o barrel
    amplo, para que importações e mocks permaneçam locais ao comportamento necessário. O
    barrel ainda existe para compatibilidade externa, mas código novo não deve
    depender dele.

  </Step>

  <Step title="Migrar extensões de resultados de ferramentas incorporadas para middleware">
    Plugins integrados devem substituir manipuladores de resultados de ferramentas exclusivos do executor incorporado
    `api.registerEmbeddedExtensionFactory(...)` por middleware
    independente do ambiente de execução:

    ```typescript
    // Ferramentas dinâmicas dos ambientes de execução OpenClaw e Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Atualize o manifesto do plugin ao mesmo tempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugins instalados também podem registrar middleware de resultados de ferramentas quando explicitamente
    habilitados e quando cada ambiente de execução de destino estiver declarado em
    `contracts.agentToolResultMiddleware`. Registros de middleware instalado não declarados
    são rejeitados.

  </Step>

  <Step title="Migrar manipuladores nativos de aprovação para fatos de capacidade">
    Plugins de canal com capacidade de aprovação expõem o comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto
    em tempo de execução:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`.
    - Remova autenticação/entrega específica de aprovação da conexão legada `plugin.auth` /
      `plugin.approvals` e passe-a para `approvalCapability`.
    - `ChannelPlugin.approvals` foi removido do contrato público
      de plugins de canal; mova os campos de entrega/nativos/renderização para
      `approvalCapability`.
    - `plugin.auth` permanece apenas para fluxos de login/logout do canal; o núcleo
      não lê mais hooks de autenticação de aprovação nesse local.
    - Registre objetos de tempo de execução pertencentes ao canal (clientes, tokens, aplicativos Bolt)
      por meio de `openclaw/plugin-sdk/channel-runtime-context`.
    - Não envie avisos de redirecionamento pertencentes ao plugin a partir de manipuladores nativos de aprovação;
      o núcleo é responsável pelos avisos de roteamento para outro local com base nos resultados reais da entrega.
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície `createPluginRuntime().channel` real - stubs parciais são
      rejeitados.

    Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) para conhecer a estrutura atual
    da capacidade de aprovação.

  </Step>

  <Step title="Auditar o comportamento de fallback de wrappers do Windows">
    Se o seu plugin usar `openclaw/plugin-sdk/windows-spawn`, wrappers do Windows
    `.cmd`/`.bat` não resolvidos agora falham de forma fechada, a menos que você passe explicitamente
    `allowShellFallback: true`:

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isto somente para chamadores de compatibilidade confiáveis que aceitem
      // intencionalmente o fallback intermediado pelo shell.
      allowShellFallback: true,
    });
    ```

    Se o chamador não depender intencionalmente do fallback de shell, não defina
    `allowShellFallback` e, em vez disso, trate o erro lançado.

  </Step>

  <Step title="Encontrar importações obsoletas">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Substituir por importações específicas">
    Cada exportação da superfície antiga corresponde a um caminho moderno de importação específico:

    ```typescript
    // Antes (camada de compatibilidade retroativa obsoleta)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Depois (importações modernas e específicas)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para helpers do lado do host, use o runtime do plugin injetado em vez de
    importar diretamente:

    ```typescript
    // Antes (ponte extension-api obsoleta)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers de ponte legados:

    | Importação antiga | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers do armazenamento de sessões | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Substitua importações amplas de infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` ainda existe para compatibilidade
    externa, mas o código novo deve importar a superfície específica de que
    realmente precisa:

    | Necessidade | Importação |
    | --- | --- |
    | Helpers da fila de eventos do sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers de ativação, eventos e visibilidade do Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Drenagem da fila de entregas pendentes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria de atividade do canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de desduplicação em memória e com persistência | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helpers seguros de caminhos de arquivos locais e mídia | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch com suporte a dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers de fetch com proxy e proteções | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política do dispatcher de SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitação e resolução de aprovação | `openclaw/plugin-sdk/approval-runtime` |
    | Payload de resposta de aprovação e helpers de comando | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers de formatação de erros | `openclaw/plugin-sdk/error-runtime` |
    | Esperas pela prontidão do transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers de token seguro | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrência limitada de tarefas assíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Asserções de valores obrigatórios para invariantes demonstráveis | `openclaw/plugin-sdk/expect-runtime` |
    | Coerção numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueio assíncrono local ao processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueios de arquivo | `openclaw/plugin-sdk/file-lock` |

    Os plugins integrados são protegidos por verificação contra `infra-runtime`,
    portanto o código do repositório não pode regredir para o barrel amplo.

  </Step>

  <Step title="Migre os helpers de rota de canal">
    O novo código de rota de canal usa `openclaw/plugin-sdk/channel-route`. Os
    nomes antigos de chave de rota e destino comparável permanecem como aliases
    de compatibilidade:

    | Helper antigo | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Os helpers modernos de rota normalizam `{ channel, to, accountId, threadId }`
    de forma consistente em aprovações nativas, supressão de respostas,
    desduplicação de entrada, entrega por cron e roteamento de sessões.

    Não adicione novos usos de `ChannelMessagingAdapter.parseExplicitTarget`, dos
    helpers de rota carregada baseados em parser (`parseExplicitTargetForLoadedChannel`,
    `resolveRouteTargetForLoadedChannel`) nem de
    `resolveChannelRouteTargetWithParser(...)` de `plugin-sdk/channel-route` —
    eles estão obsoletos e permanecem apenas para plugins antigos. Novos plugins
    de canal devem usar `messaging.targetResolver.resolveTarget(...)` para
    normalização do ID de destino e fallback quando não houver correspondência
    no diretório, `messaging.inferTargetChatType(...)` quando o núcleo precisar
    antecipadamente do tipo de par e
    `messaging.resolveOutboundSessionRoute(...)` para a identidade nativa do
    provedor de sessão e thread.

  </Step>

  <Step title="Compile e teste">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de importação

  <Accordion title="Common import path table">
  | Caminho de importação | Finalidade | Principais exportações |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Auxiliar canônico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação abrangente legada para definições/construtores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportação do esquema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Auxiliar de entrada de provedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e construtores específicos de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração | Tradutor de configuração, prompts de lista de permissões, construtores de status de configuração |
  | `plugin-sdk/setup-runtime` | Auxiliares de runtime durante a configuração | `createSetupTranslator`, adaptadores de patch de configuração seguros para importação, auxiliares de notas de consulta, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegados |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto do adaptador de configuração | Use `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Auxiliares de ferramentas de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Auxiliares para várias contas | Auxiliares de lista/configuração de contas e controle de ações |
  | `plugin-sdk/account-id` | Auxiliares de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Auxiliares de consulta de contas | Auxiliares de consulta de contas e fallback padrão |
  | `plugin-sdk/account-helpers` | Auxiliares específicos de contas | Auxiliares de lista de contas/ações de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento de MD | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Integração de prefixo de resposta, digitação e entrega de origem | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuração e auxiliares de acesso a MD | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Construtores de esquemas de configuração | Somente primitivas compartilhadas de esquemas de configuração de canal e o construtor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração incluídos | Somente plugins incluídos mantidos pelo OpenClaw; novos plugins devem definir esquemas locais do plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuração incluídos obsoletos | Apenas alias de compatibilidade; use `plugin-sdk/bundled-channel-config-schema` para plugins incluídos mantidos |
  | `plugin-sdk/telegram-command-config` | Auxiliares de configuração de comandos do Telegram | Normalização de nomes de comandos, redução de descrições, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de políticas de grupo/MD | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidade obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Auxiliares de envelope de entrada | Auxiliares compartilhados de rota e construção de envelopes |
  | `plugin-sdk/channel-inbound` | Auxiliares de recebimento de entrada | Construção de contexto, formatação, raízes, executores, envio de respostas preparadas e predicados de envio |
  | `plugin-sdk/messaging-targets` | Caminho obsoleto de importação para análise de destino | Use `plugin-sdk/channel-targets` para auxiliares genéricos de análise de destino, `plugin-sdk/channel-route` para comparação de rotas e `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` pertencentes ao plugin para resolução de destinos específica do provedor |
  | `plugin-sdk/outbound-media` | Auxiliares de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidade obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Auxiliares do ciclo de vida de mensagens de saída | Adaptadores de mensagens, confirmações, auxiliares de envio durável, auxiliares de pré-visualização ao vivo/streaming, opções de resposta, auxiliares de ciclo de vida, identidade de saída e planejamento de payload |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidade obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidade obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Auxiliares de vinculação de threads | Auxiliares de ciclo de vida e adaptação da vinculação de threads |
  | `plugin-sdk/agent-media-payload` | Auxiliares legados de payload de mídia | Construtor de payload de mídia do agente para layouts de campos legados |
  | `plugin-sdk/channel-runtime` | Camada de compatibilidade obsoleta | Somente utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de plugins | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Auxiliares amplos de runtime | Auxiliares de runtime/logs/backup/instalação de plugins |
  | `plugin-sdk/runtime-env` | Auxiliares específicos de ambiente de runtime | Logger/ambiente de runtime, tempo limite, nova tentativa e auxiliares de recuo |
  | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de runtime de plugins | Auxiliares de comandos/hooks/HTTP/interação de plugins |
  | `plugin-sdk/hook-runtime` | Auxiliares do pipeline de hooks | Auxiliares compartilhados do pipeline de Webhook/hooks internos |
  | `plugin-sdk/lazy-runtime` | Auxiliares de runtime com carregamento tardio | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Auxiliares de processo | Auxiliares compartilhados de execução |
  | `plugin-sdk/cli-runtime` | Auxiliares de runtime da CLI | Formatação de comandos, esperas, auxiliares de versão |
  | `plugin-sdk/gateway-runtime` | Auxiliares do Gateway | Cliente do Gateway, auxiliar de inicialização quando o loop de eventos estiver pronto, resolução do host LAN anunciado e auxiliares de patch de status do canal |
  | `plugin-sdk/config-runtime` | Camada obsoleta de compatibilidade de configuração | Prefira `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Auxiliares de comandos do Telegram | Auxiliares de validação de comandos do Telegram com fallback estável quando a superfície de contrato do Telegram incluído não estiver disponível |
  | `plugin-sdk/approval-runtime` | Auxiliares de prompt de aprovação | Payload de aprovação de execução/plugin, auxiliares de capacidade/perfil de aprovação, auxiliares de runtime/roteamento de aprovação nativa e formatação estruturada do caminho de exibição da aprovação |
  | `plugin-sdk/approval-auth-runtime` | Auxiliares de autenticação de aprovação | Resolução do aprovador, autenticação de ações no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Auxiliares do cliente de aprovação | Auxiliares de perfil/filtro de aprovação de execução nativa |
  | `plugin-sdk/approval-delivery-runtime` | Auxiliares de entrega de aprovação | Adaptadores de capacidade/entrega de aprovação nativa |
  | `plugin-sdk/approval-gateway-runtime` | Auxiliares de aprovação do Gateway | Resolvedor compartilhado do Gateway de aprovação |
  | `plugin-sdk/approval-reference-runtime` | Referências de transporte de aprovação | Auxiliar determinístico de localização durável para callbacks limitados pelo transporte |
  | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares do adaptador de aprovação | Auxiliares leves de carregamento de adaptadores de aprovação nativa para pontos de entrada de canal de alta frequência |
  | `plugin-sdk/approval-handler-runtime` | Auxiliares do manipulador de aprovação | Auxiliares mais amplos de runtime do manipulador de aprovação; prefira as interfaces mais específicas de adaptador/Gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Auxiliares de destino de aprovação | Auxiliares de vinculação de destino/conta para aprovação nativa |
  | `plugin-sdk/approval-reply-runtime` | Auxiliares de resposta de aprovação | Auxiliares de payload de resposta de aprovação de execução/plugin |
  | `plugin-sdk/channel-runtime-context` | Auxiliares de contexto de runtime de canal | Auxiliares genéricos para registrar/obter/observar o contexto de runtime do canal |
  | `plugin-sdk/security-runtime` | Auxiliares de segurança | Auxiliares compartilhados de confiança, controle de MD, arquivos/caminhos restritos à raiz, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Auxiliares de política de SSRF | Auxiliares de lista de permissões de hosts e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Auxiliares de runtime de SSRF | Dispatcher fixado, fetch protegido, auxiliares de política de SSRF |
  | `plugin-sdk/system-event-runtime` | Auxiliares de eventos do sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Auxiliares de Heartbeat | Auxiliares de ativação, eventos e visibilidade de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Auxiliares da fila de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Auxiliares de atividade do canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Auxiliares de desduplicação | Caches de desduplicação em memória e com suporte persistente |
  | `plugin-sdk/file-access-runtime` | Auxiliares de acesso a arquivos | Auxiliares seguros para caminhos de arquivos/mídia locais |
  | `plugin-sdk/transport-ready-runtime` | Auxiliares de prontidão do transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Auxiliares de política de aprovação de execução | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Auxiliares de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Auxiliares de controle de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Auxiliares de erro | `formatUncaughtError`, `isApprovalNotFoundError`, auxiliares de grafo de erros, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | Auxiliares de fetch encapsulado/proxy | `resolveFetch`, auxiliares de proxy, auxiliares de opções do EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Auxiliares de normalização de hosts | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Auxiliares de nova tentativa | `RetryConfig`, `retryAsync`, executores de políticas |
  | `plugin-sdk/allow-from` | Formatação de lista de permissões e mapeamento de entradas | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Auxiliares de controle e superfície de comandos | `resolveControlCommandGate`, auxiliares de autorização do remetente, auxiliares de registro de comandos, incluindo formatação dinâmica do menu de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de status/ajuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análise de entrada de segredos | Auxiliares de entrada de segredos |
  | `plugin-sdk/webhook-ingress` | Auxiliares de requisições de Webhook | Utilitários de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Auxiliares de proteção do corpo de Webhooks | Auxiliares de leitura/limitação do corpo da requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de respostas | Envio de entrada, Heartbeat, planejador de respostas, divisão em partes |
  | `plugin-sdk/reply-dispatch-runtime` | Auxiliares específicos de envio de respostas | Finalização, envio do provedor e auxiliares de rótulos de conversa |
  | `plugin-sdk/reply-history` | Auxiliares de histórico de respostas | `createChannelHistoryWindow`; exportações obsoletas de compatibilidade de auxiliares de mapa, como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referências de respostas | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Auxiliares de divisão de respostas | Auxiliares de divisão de texto/Markdown |
  | `plugin-sdk/session-store-runtime` | Auxiliares do armazenamento de sessões | Auxiliares de linhas de sessão com escopo, auxiliares de caminhos de armazenamento e leituras da data de atualização |
  | `plugin-sdk/state-paths` | Auxiliares de caminho de estado | Auxiliares de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Auxiliares de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, auxiliares de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Auxiliares de status de canal | Geradores de resumo de status de canal/conta, padrões de estado de runtime, auxiliares de metadados de problemas |
  | `plugin-sdk/target-resolver-runtime` | Auxiliares de resolução de destino | Auxiliares compartilhados de resolução de destino |
  | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de strings | Auxiliares de normalização de slug/string |
  | `plugin-sdk/request-url` | Auxiliares de URL de solicitação | Extração de URLs em string de entradas semelhantes a solicitações |
  | `plugin-sdk/run-command` | Auxiliares de comandos temporizados | Executor de comandos temporizados com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extração de payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extração de campos canônicos de destino de envio dos argumentos da ferramenta |
  | `plugin-sdk/temp-path` | Auxiliares de caminho temporário | Auxiliares compartilhados de caminho de download temporário |
  | `plugin-sdk/logging-core` | Auxiliares de registro | Auxiliares de logger de subsistema e ocultação |
  | `plugin-sdk/markdown-table-runtime` | Auxiliares de tabela Markdown | Auxiliares de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedores locais/auto-hospedados | Auxiliares de descoberta/configuração de provedores auto-hospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Auxiliares específicos de configuração de provedores auto-hospedados compatíveis com OpenAI | Os mesmos auxiliares de descoberta/configuração de provedores auto-hospedados |
  | `plugin-sdk/provider-auth-runtime` | Auxiliares de autenticação de runtime do provedor | Auxiliares de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Auxiliares de configuração de chave de API do provedor | Auxiliares de integração/gravação de perfil por chave de API |
  | `plugin-sdk/provider-auth-result` | Auxiliares de resultado de autenticação do provedor | Gerador padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-selection-runtime` | Auxiliares de seleção de provedor | Seleção de provedor configurado ou automática e mesclagem de configuração bruta do provedor |
  | `plugin-sdk/provider-env-vars` | Auxiliares de variáveis de ambiente do provedor | Auxiliares de consulta de variáveis de ambiente de autenticação do provedor |
  | `plugin-sdk/provider-model-shared` | Auxiliares compartilhados de modelo/reprodução de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, geradores compartilhados de política de reprodução, auxiliares de endpoint de provedor e auxiliares de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Auxiliares compartilhados de catálogo de provedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de integração de provedor | Auxiliares de configuração de integração |
  | `plugin-sdk/provider-http` | Auxiliares HTTP de provedor | Auxiliares genéricos de capacidade HTTP/endpoint do provedor, incluindo auxiliares de formulário multipart para transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Auxiliares de busca web do provedor | Auxiliares de registro/cache de provedor de busca web |
  | `plugin-sdk/provider-web-search-config-contract` | Auxiliares de configuração de pesquisa na web do provedor | Auxiliares restritos de configuração/credenciais de pesquisa na web para provedores que não precisam de vinculação de ativação de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato de pesquisa na web do provedor | Auxiliares restritos de contrato de configuração/credenciais de pesquisa na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e definidores/obtentores de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Auxiliares de pesquisa na web do provedor | Auxiliares de registro/cache/runtime de provedor de pesquisa na web |
  | `plugin-sdk/provider-tools` | Auxiliares de compatibilidade de ferramenta/esquema do provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de esquema + diagnóstico para DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Auxiliares de uso do provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros auxiliares de uso do provedor |
  | `plugin-sdk/provider-stream` | Auxiliares de wrapper de stream do provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte do provedor | Auxiliares de transporte nativo do provedor, como busca protegida, extração de texto do resultado de ferramenta, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Auxiliares compartilhados de mídia | Auxiliares de busca/transformação/armazenamento de mídia, detecção de dimensões de vídeo baseada em ffprobe e geradores de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de geração de mídia | Auxiliares compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Auxiliares de compreensão de mídia | Tipos de provedor de compreensão de mídia e exportações de auxiliares de imagem/áudio voltadas ao provedor |
  | `plugin-sdk/text-runtime` | Exportação ampla e obsoleta de compatibilidade de texto | Use `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` e `logging-core` |
  | `plugin-sdk/text-chunking` | Auxiliares de segmentação de texto | Auxiliar de segmentação de texto de saída |
  | `plugin-sdk/speech` | Auxiliares de fala | Tipos de provedor de fala, auxiliares de diretiva, registro e validação voltados ao provedor e gerador de TTS compatível com OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provedor de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Auxiliares de transcrição em tempo real | Tipos de provedor, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Auxiliares de voz em tempo real | Tipos de provedor, auxiliares de registro/resolução, auxiliares de sessão de ponte, filas compartilhadas de resposta por voz do agente, controle de voz da execução ativa, integridade de transcrição/eventos, supressão de eco, correspondência de perguntas de consulta, coordenação de consulta forçada, rastreamento de contexto de turno, rastreamento de atividade de saída e auxiliares de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Auxiliares de geração de imagens | Tipos de provedor de geração de imagens, auxiliares de ativo de imagem/URL de dados e gerador de provedor de imagens compatível com OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagens | Tipos de geração de imagens, failover, autenticação e auxiliares de registro |
  | `plugin-sdk/music-generation` | Auxiliares de geração de música | Tipos de provedor/solicitação/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Tipos de geração de música, auxiliares de failover, consulta de provedor e análise de referência de modelo |
  | `plugin-sdk/video-generation` | Auxiliares de geração de vídeo | Tipos de provedor/solicitação/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Tipos de geração de vídeo, auxiliares de failover, consulta de provedor e análise de referência de modelo |
  | `plugin-sdk/interactive-runtime` | Auxiliares de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas restritas de esquema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Auxiliares de gravação de configuração de canal | Auxiliares de autorização de gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exportações compartilhadas do prelúdio do Plugin de canal |
  | `plugin-sdk/channel-status` | Auxiliares de status de canal | Auxiliares compartilhados de instantâneo/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Auxiliares de configuração de lista de permissões | Auxiliares de edição/leitura da configuração de lista de permissões |
  | `plugin-sdk/group-access` | Auxiliares de acesso a grupos | Auxiliares compartilhados de decisão de acesso a grupos |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidade obsoletas | Use `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Auxiliares de proteção de mensagem direta | Auxiliares restritos de política de proteção anterior à criptografia |
  | `plugin-sdk/extension-shared` | Auxiliares compartilhados de extensão | Primitivas auxiliares de canal passivo/status e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Auxiliares de destino de Webhook | Registro de destinos de Webhook e auxiliares de instalação de rotas |
  | `plugin-sdk/webhook-path` | Alias obsoleto de caminho de Webhook | Use `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Auxiliares compartilhados de mídia web | Auxiliares de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação obsoleta de compatibilidade com Zod | Importe `zod` diretamente de `zod` |
  | `plugin-sdk/memory-core` | Auxiliares integrados do memory-core | Superfície de auxiliares de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de indexação/pesquisa de memória |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de embeddings de memória | Auxiliares leves de registro de provedores de embeddings de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo-base do host de memória | Exportações do mecanismo-base do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Contratos de embeddings de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remotos; provedores remotos concretos residem nos Plugins que os possuem |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exportações do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exportações do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória | Auxiliares multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória | Auxiliares de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória | Auxiliares de segredo do host de memória |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de eventos de memória | Use `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória | Auxiliares de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI do host de memória | Auxiliares de runtime de CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime principal do host de memória | Auxiliares do runtime principal do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória | Auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias do runtime principal do host de memória | Alias independente de fornecedor para auxiliares do runtime principal do host de memória |
  | `plugin-sdk/memory-host-events` | Alias do diário de eventos do host de memória | Alias independente de fornecedor para auxiliares do diário de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de arquivo/runtime de memória | Use `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Auxiliares de Markdown gerenciado | Auxiliares compartilhados de Markdown gerenciado para Plugins relacionados à memória |
  | `plugin-sdk/memory-host-search` | Fachada de pesquisa de Active Memory | Fachada de runtime do gerenciador de pesquisa de Active Memory com carregamento tardio |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de status do host de memória | Use `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitários de teste | Barrel de compatibilidade obsoleto e local do repositório; use subcaminhos de teste específicos e locais do repositório, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

  Esta tabela contém o subconjunto comum de migração, não toda a superfície do SDK. O
  inventário de pontos de entrada do compilador fica em `scripts/lib/plugin-sdk-entrypoints.json`;
  as exportações do pacote são geradas a partir do subconjunto público.

  Os pontos de integração auxiliares reservados para plugins incluídos foram removidos do mapa
  de exportações do SDK público, exceto por fachadas de compatibilidade explicitamente
  documentadas, como o shim obsoleto `plugin-sdk/discord`, mantido para plugins externos que ainda
  importam diretamente o pacote publicado `@openclaw/discord`. Auxiliares específicos do
  proprietário ficam dentro do pacote do plugin proprietário; comportamentos compartilhados do host
  passam por contratos genéricos do SDK, como `plugin-sdk/gateway-runtime`,
  `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

  Use a importação mais específica que corresponda à tarefa. Se você não encontrar uma exportação,
  verifique o código-fonte em `src/plugin-sdk/` ou pergunte aos mantenedores qual contrato
  genérico deve ser responsável por ela.

  ## Descontinuações ativas

  Descontinuações mais específicas no SDK de plugins, no contrato de provedores, na superfície
  de runtime e no manifesto. Cada uma ainda funciona atualmente, mas será removida em uma futura
  versão principal. Cada entrada mapeia a API antiga para sua substituição canônica.

  <AccordionGroup>
  <Accordion title="Auxiliares de ajuda de command-auth -> command-status">
    **Antigo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Novo (`openclaw/plugin-sdk/command-status`)**: mesmas assinaturas, mesmas
    exportações — apenas importadas do subcaminho mais específico. `command-auth`
    as reexporta como stubs de compatibilidade.

    ```typescript
    // Antes
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Depois
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Auxiliares de controle de menções -> resolveInboundMentionDecision">
    **Antigo**: `resolveMentionGating(params)` e
    `resolveMentionGatingWithBypass(params)` de
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Novo**: `resolveInboundMentionDecision({ facts, policy })` — um único objeto
    de decisão em vez de dois formatos de chamada separados.

    Adotado no Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp e Zalo. O modelo de eventos `app_mention` próprio do Slack
    não usa esse auxiliar.

  </Accordion>

  <Accordion title="Shim de runtime de canal e auxiliares de ações de canal">
    `openclaw/plugin-sdk/channel-runtime` é um shim de compatibilidade para plugins
    de canal antigos. Não o importe em código novo; use
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Os auxiliares `channelActions*` em `openclaw/plugin-sdk/channel-actions` estão
    obsoletos, assim como as exportações brutas de "ações" de canal. Exponha recursos
    pela superfície semântica `presentation` — plugins de canal declaram o que
    renderizam (cartões, botões, seleções), em vez dos nomes brutos de ações que
    aceitam.

  </Accordion>

  <Accordion title="Auxiliar tool() do provedor de pesquisa na web -> createTool() no plugin">
    **Antigo**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Novo**: implemente `createTool(...)` diretamente no plugin do provedor.
    O OpenClaw não precisa mais do auxiliar do SDK para registrar o wrapper da ferramenta.

  </Accordion>

  <Accordion title="Envelopes de canal em texto simples -> BodyForAgent">
    **Antigo**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (e o
    campo `channelEnvelope` nos objetos de mensagens recebidas) para criar um
    envelope de prompt simples em texto simples a partir de mensagens recebidas
    do canal.

    **Novo**: `BodyForAgent` mais blocos estruturados de contexto do usuário. Plugins
    de canal anexam metadados de roteamento (thread, tópico, resposta a, reações) como
    campos tipados, em vez de concatená-los em uma string de prompt. O auxiliar
    `formatAgentEnvelope(...)` continua compatível com envelopes sintetizados
    destinados ao assistente, mas os envelopes recebidos em texto simples estão
    sendo descontinuados.

    Áreas afetadas: `inbound_claim`, `message_received` e qualquer plugin
    de canal personalizado que pós-processava o texto antigo do envelope.

  </Accordion>

  <Accordion title="Hook deactivate -> gateway_stop">
    **Antigo**: `api.on("deactivate", handler)`.

    **Novo**: `api.on("gateway_stop", handler)`. Mesmo contrato de limpeza no
    encerramento; somente o nome do hook muda.

    ```typescript
    // Antes
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // Depois
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` permanece conectado como um alias de compatibilidade obsoleto até ser
    removido após 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning -> vinculação de thread pelo núcleo">
    **Antigo**: `api.on("subagent_spawning", handler)` retornando
    `threadBindingReady` ou `deliveryOrigin`.

    **Novo**: deixe o núcleo preparar as vinculações de subagentes com `thread: true` por meio do
    adaptador de vinculação de sessão do canal. Use `api.on("subagent_spawned", handler)`
    somente para observação após a inicialização.

    ```typescript
    // Antes
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // Depois
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` e
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` permanecem apenas como
    superfícies de compatibilidade obsoletas enquanto os plugins externos migram, sendo
    removidas após 2026-08-30.

  </Accordion>

  <Accordion title="Tipos de descoberta de provedores -> tipos de catálogo de provedores">
    Quatro aliases de tipos de descoberta agora são wrappers leves sobre os tipos
    da era de catálogos:

    | Alias antigo                | Novo tipo                   |
    | --------------------------- | --------------------------- |
    | `ProviderDiscoveryOrder`    | `ProviderCatalogOrder`      |
    | `ProviderDiscoveryContext`  | `ProviderCatalogContext`    |
    | `ProviderDiscoveryResult`   | `ProviderCatalogResult`     |
    | `ProviderPluginDiscovery`   | `ProviderPluginCatalog`     |

    Além do antigo conjunto estático `ProviderCapabilities` — plugins de provedores
    devem usar hooks explícitos de provedor, como `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn`, em vez de um objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de raciocínio -> resolveThinkingProfile">
    **Antigo** (três hooks separados em `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Novo**: um único `resolveThinkingProfile(ctx)` que retorna um
    `ProviderThinkingProfile` com o `id` canônico, um `label` opcional e uma
    lista ordenada de níveis. O OpenClaw rebaixa automaticamente valores
    armazenados obsoletos de acordo com a classificação do perfil.

    O contexto inclui `provider`, `modelId`, o `reasoning` combinado opcional
    e os fatos combinados opcionais de `compat` do modelo. Plugins de provedores
    podem usar esses fatos do catálogo para expor um perfil específico do modelo
    somente quando o contrato de solicitação configurado oferece suporte a ele.

    Implemente um hook em vez de três. Os hooks antigos continuam funcionando durante
    o período de descontinuação, mas não são compostos com o resultado do perfil.

  </Accordion>

  <Accordion title="Provedores externos de autenticação -> contracts.externalAuthProviders">
    **Antigo**: implementar hooks externos de autenticação sem declarar o provedor
    no manifesto do plugin.

    **Novo**: declare `contracts.externalAuthProviders` no manifesto do plugin
    **e** implemente `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Consulta de variável de ambiente do provedor -> setup.providers[].envVars">
    Campo de manifesto **antigo**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Novo**: replique a mesma consulta de variável de ambiente em `setup.providers[].envVars`
    no manifesto. Isso consolida os metadados de ambiente de configuração/status em um só lugar
    e evita inicializar o runtime do plugin apenas para responder a consultas de variáveis de ambiente.

    `providerAuthEnvVars` continua compatível por meio de um adaptador de compatibilidade
    até o encerramento do período de descontinuação.

  </Accordion>

  <Accordion title="Registro de plugin de memória -> registerMemoryCapability">
    **Antigo**: três chamadas separadas — `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Novo**: uma chamada na API de estado de memória —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mesmos slots, uma única chamada de registro. Auxiliares adicionais de prompt e corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) não são
    afetados.

  </Accordion>

  <Accordion title="API de provedor de embeddings de memória">
    **Antigo**: `api.registerMemoryEmbeddingProvider(...)` mais
    `contracts.memoryEmbeddingProviders`.

    **Novo**: `api.registerEmbeddingProvider(...)` mais
    `contracts.embeddingProviders`.

    O contrato genérico de provedor de embeddings pode ser reutilizado fora da memória e é
    o caminho compatível para novos provedores. A API de registro específica de memória
    continua conectada como compatibilidade obsoleta enquanto os provedores existentes
    migram. A inspeção de plugins relata o uso não incluído como dívida de compatibilidade.

  </Accordion>

  <Accordion title="Tipos de mensagens de sessão de subagentes renomeados">
    Dois aliases de tipos antigos ainda exportados de `src/plugins/runtime/types.ts`:

    | Antigo                          | Novo                               |
    | ------------------------------- | ---------------------------------- |
    | `SubagentReadSessionParams`     | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`     | `SubagentGetSessionMessagesResult` |

    O método de runtime `readSession` está obsoleto em favor de
    `getSessionMessages`. Mesma assinatura; o método antigo encaminha a chamada
    para o novo.

  </Accordion>

  <Accordion title="APIs de arquivos de sessão e transcrição removidas">
    A migração de sessões/transcrições para SQLite remove ou descontinua APIs voltadas
    a plugins que expunham armazenamentos `sessions.json` ativos, caminhos de transcrições
    JSONL ou listas de arquivos de sessão. Plugins de runtime devem usar a identidade da
    sessão e os auxiliares de runtime do SDK, em vez de resolver ou modificar arquivos ativos.

    | Superfície em migração | Substituição |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` e `resolveSessionStoreEntry(...)` obsoletos | `getSessionEntry(...)`, `listSessionEntries(...)` e mutações de sessão no nível da linha. |
    | `resolveSessionFilePath(...)` obsoleto | Identidade da sessão (`sessionKey`, `sessionId` e auxiliares de destino de runtime do SDK), além de métodos do Gateway que operam na sessão atual. |
    | `saveSessionStore(...)` removido | APIs de runtime de sessão pertencentes ao Gateway; o código do plugin deve solicitar ou alterar o estado da sessão por meio dos auxiliares documentados de runtime/contexto, em vez de gravar o arquivo de armazenamento ativo. |
    | `resolveSessionTranscriptPathInDir(...)` e `resolveAndPersistSessionFile(...)` removidos | Identidade da sessão e métodos do Gateway que operam na sessão atual. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Leitores de transcrição baseados em identidade expostos pelo contexto de runtime atual ou métodos de histórico/sessão do Gateway quando o plugin está fora do caminho proprietário da transcrição. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` com `agentId`, `sessionKey` e `sessionId`. |
    | Entradas de sincronização de memória, como `sessionFiles` | Fontes de transcrição/sessão baseadas em identidade fornecidas pelo host; não percorra arquivos JSONL ativos para sessões em execução. |
    | Opções de runtime chamadas `transcriptPath` ou `sessionFile` para sessões ativas | Objetos `sessionTarget`/de destino de runtime que carregam uma identidade de sessão independente do armazenamento. |

    Os arquivos legados de transcrição JSONL continuam válidos como artefatos de
    importação, arquivamento, exportação e suporte. Eles não são mais o contrato
    de runtime de estado estável para sessões ativas.

    Os plugins oficiais lançados com `v2026.7.1-beta.5` importavam os quatro
    auxiliares obsoletos acima. `openclaw/plugin-sdk/session-store-runtime` mantém
    exatamente essa ponte até 2026-10-12; novos plugins devem usar as substituições.
    `resolveStorePath(...)` continua sendo um auxiliar compatível do SDK e não faz
    parte desta descontinuação.

    `openclaw plugins inspect --all --runtime` relata plugins não integrados cujos
    erros de carregamento ou diagnósticos ainda fazem referência a essas APIs de
    arquivo removidas. A verificação consultiva do `@openclaw/plugin-inspector`
    deve usar a versão `0.3.17` ou mais recente para que as verificações de pacotes
    externos também sinalizem auxiliares de sessão para o armazenamento inteiro,
    auxiliares de caminho de arquivo de sessão, destinos legados de arquivo de
    transcrição e auxiliares de transcrição de baixo nível antes do lançamento.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Antigo**: `runtime.tasks.flow` (singular) retornava um acessador de fluxo
    de tarefas ativo.

    **Novo**: `runtime.tasks.managedFlows` mantém o runtime gerenciado de mutação
    do TaskFlow para plugins que criam, atualizam, cancelam ou executam tarefas
    filhas a partir de um fluxo. Use `runtime.tasks.flows` quando o plugin precisar
    apenas de leituras baseadas em DTO.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Depois
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Removido após 2026-07-26.

  </Accordion>

  <Accordion title="Fábricas de extensão incorporadas -> middleware de resultados de ferramentas do agente">
    Abordado em [Como migrar](#how-to-migrate) acima. Incluído aqui para fins de
    completude: o caminho removido `api.registerEmbeddedExtensionFactory(...)`,
    exclusivo do executor incorporado, foi substituído por
    `api.registerAgentToolResultMiddleware(...)`, com uma lista explícita de
    runtimes em `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType -> OpenClawConfig">
    `OpenClawSchemaType`, reexportado de `openclaw/plugin-sdk`, agora é um alias
    de uma linha para `OpenClawConfig`. Prefira o nome canônico.

    ```typescript
    // Antes
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Depois
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
As descontinuações no nível das extensões (dentro dos plugins integrados de
canal/provedor em `extensions/`) são rastreadas nos próprios barrels `api.ts` e
`runtime-api.ts`. Elas não afetam os contratos de plugins de terceiros e não
estão listadas aqui. Se você consumir diretamente o barrel local de um plugin
integrado, leia os comentários de descontinuação desse barrel antes de atualizar.
</Note>

## Migração do Talk e de voz em tempo real

O código de voz em tempo real, telefonia, reuniões e Talk no navegador compartilha
um único controlador de sessão do Talk exportado por
`openclaw/plugin-sdk/realtime-voice`. O controlador é responsável pelo envelope
comum de eventos do Talk, pelo estado do turno ativo, pelo estado de captura, pelo
estado do áudio de saída, pelo histórico de eventos recentes e pela rejeição de
turnos obsoletos. Os plugins de provedor são responsáveis pelas sessões em tempo
real específicas de cada fornecedor; os plugins de superfície são responsáveis
pelas particularidades de captura, reprodução, telefonia e reuniões.

Todas as superfícies integradas são executadas no controlador compartilhado:
retransmissão do navegador, transferência para sala gerenciada, chamada de voz
em tempo real, STT de chamada de voz por streaming, Google Meet em tempo real e
pressionar para falar nativo. O Gateway anuncia um único canal de eventos do Talk
ao vivo em `hello-ok.features.events`: `talk.event`.

O novo código não deve chamar `createTalkEventSequencer(...)` diretamente, a
menos que esteja implementando um adaptador de baixo nível ou um fixture de
teste. Use o controlador compartilhado para impedir que eventos com escopo de
turno sejam emitidos sem um ID de turno, que chamadas obsoletas de `turnEnd` /
`turnCancel` apaguem um turno ativo mais recente e para manter os eventos do
ciclo de vida do áudio de saída consistentes entre telefonia, reuniões,
retransmissão do navegador, transferência para sala gerenciada e clientes
nativos do Talk.

O formato da API pública:

```typescript
// API de sessão do Talk pertencente ao Gateway.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// API de sessão de provedor pertencente ao cliente.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

As sessões WebRTC/websocket de provedor pertencentes ao navegador usam
`talk.client.create`, pois o navegador é responsável pela negociação com o
provedor e pelo transporte de mídia, enquanto o Gateway é responsável pelas
credenciais, instruções e políticas de ferramentas. `talk.session.*` é a
superfície comum gerenciada pelo Gateway para tempo real com retransmissão pelo
Gateway, transcrição com retransmissão pelo Gateway e sessões nativas de STT/TTS
em salas gerenciadas.

Configurações legadas que colocam seletores de tempo real ao lado de
`talk.provider` / `talk.providers` devem ser reparadas com
`openclaw doctor --fix`; o runtime do Talk não reinterpreta a configuração do
provedor de fala/TTS como configuração do provedor de tempo real.

As combinações compatíveis com `talk.session.create` são intencionalmente
limitadas:

| Modo            | Transporte      | Cérebro         | Proprietário       | Observações                                                                                                                        |
| --------------- | --------------- | --------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Áudio bidirecional do provedor retransmitido pelo Gateway; as chamadas de ferramentas são encaminhadas pela ferramenta de consulta ao agente. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Somente STT por streaming; os chamadores enviam áudio de entrada e recebem eventos de transcrição.                                 |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas no estilo pressionar para falar e walkie-talkie, nas quais o cliente controla a captura/reprodução e o Gateway controla o estado do turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala exclusivo para administradores e superfícies próprias confiáveis que executam diretamente ações de ferramentas do Gateway. |

Mapa de métodos para leitores que estão migrando das famílias antigas
`talk.realtime.*` / `talk.transcription.*` / `talk.handoff.*` (todas removidas):

| Antigo                           | Novo                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` ou `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

O vocabulário unificado de controle também é deliberadamente limitado:

| Método                          | Aplica-se a                                              | Contrato                                                                                                                                                                                                                  |
| ------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay`  | Anexa um bloco de áudio PCM em base64 à sessão do provedor pertencente à mesma conexão do Gateway.                                                                                                                        |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                   | Inicia um turno do usuário em uma sala gerenciada.                                                                                                                                                                        |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                   | Encerra o turno ativo após a validação de turno obsoleto.                                                                                                                                                                 |
| `talk.session.cancelTurn`       | todas as sessões pertencentes ao Gateway                 | Cancela a captura ativa e o trabalho do provedor, agente e TTS de um turno.                                                                                                                                               |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                 | Interrompe a saída de áudio do assistente sem necessariamente encerrar o turno do usuário.                                                                                                                                |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                 | Conclui uma chamada de ferramenta do provedor após qualquer conclusão assíncrona exposta por sua ponte; passe `options.willContinue` para uma saída provisória ou, quando compatível, `options.suppressResponse` para evitar outra resposta do assistente. |
| `talk.session.steer`            | sessões do Talk apoiadas por agente                      | Envia o controle falado `status`, `steer`, `cancel` ou `followup` para a execução incorporada ativa resolvida a partir da sessão do Talk.                                                                                  |
| `talk.session.close`            | todas as sessões unificadas                              | Interrompe as sessões de retransmissão ou revoga o estado da sala gerenciada e, em seguida, esquece o ID da sessão unificada.                                                                                              |

Não introduza casos especiais de provedor ou plataforma no núcleo para fazer isso funcionar.
O núcleo é responsável pela semântica das sessões do Talk. Os plugins de provedor são responsáveis pela configuração das sessões dos fornecedores.
Chamadas de voz e Google Meet são responsáveis pelos adaptadores de telefonia/reunião. Navegadores e
aplicativos nativos são responsáveis pela experiência de captura/reprodução nos dispositivos.

## Cronograma de remoção

| Quando                                      | O que acontece                                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agora**                                   | As superfícies obsoletas emitem avisos em tempo de execução.                                                                                      |
| **Data `removeAfter` de cada registro de compatibilidade** | Essa superfície específica se torna elegível para remoção; `pnpm plugins:boundary-report --fail-on-eligible-compat` faz a CI falhar após a data. |
| **Próxima versão principal**                | Todas as superfícies que ainda não foram migradas são removidas; os plugins que ainda as utilizarem falharão.                                     |

Todos os plugins do núcleo já foram migrados. Os plugins externos devem ser migrados
antes da próxima versão principal. Execute `pnpm plugins:boundary-report` para verificar quais
registros de compatibilidade das superfícies usadas pelo seu plugin vencerão primeiro.

## Suprimir temporariamente os avisos

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma saída de emergência temporária, não uma solução permanente.

## Relacionados

- [Primeiros passos](/pt-BR/plugins/building-plugins) - crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de importação de subcaminhos
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - criação de plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - criação de plugins de provedor
- [Detalhes internos dos plugins](/pt-BR/plugins/architecture) - análise aprofundada da arquitetura
- [Manifesto do plugin](/pt-BR/plugins/manifest) - referência do esquema do manifesto
