---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você usava api.registerEmbeddedExtensionFactory antes do OpenClaw 2026.4.25
    - Você está atualizando um Plugin para a arquitetura moderna de Plugin
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migre da camada legada de compatibilidade retroativa para o SDK de Plugin moderno
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-04-30T10:01:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw migrou de uma camada ampla de compatibilidade retroativa para uma arquitetura moderna de plugins com importações focadas e documentadas. Se o seu plugin foi criado antes da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de plugins fornecia duas superfícies totalmente abertas que permitiam que plugins importassem tudo de que precisavam a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — uma única importação que reexportava dezenas de auxiliares. Ela foi introduzida para manter plugins antigos baseados em hooks funcionando enquanto a nova arquitetura de plugins estava sendo criada.
- **`openclaw/plugin-sdk/infra-runtime`** — um amplo módulo agregador de auxiliares de tempo de execução que misturava eventos do sistema, estado de Heartbeat, filas de entrega, auxiliares de fetch/proxy, auxiliares de arquivo, tipos de aprovação e utilitários não relacionados.
- **`openclaw/plugin-sdk/config-runtime`** — um amplo módulo agregador de compatibilidade de configuração que ainda carrega auxiliares obsoletos de carregamento/gravação direta durante a janela de migração.
- **`openclaw/extension-api`** — uma ponte que dava aos plugins acesso direto a auxiliares do lado do host, como o executor de agente embutido.
- **`api.registerEmbeddedExtensionFactory(...)`** — um hook removido de extensão empacotada exclusivo do Pi que podia observar eventos do executor embutido, como `tool_result`.

As superfícies amplas de importação agora estão **obsoletas**. Elas ainda funcionam em tempo de execução, mas novos plugins não devem usá-las, e plugins existentes devem migrar antes que a próxima versão principal as remova. A API de registro de fábrica de extensão embutida exclusiva do Pi foi removida; use middleware de resultado de ferramenta em vez disso.

OpenClaw não remove nem reinterpreta comportamento documentado de plugins na mesma alteração que introduz uma substituição. Alterações de contrato que quebram compatibilidade devem primeiro passar por um adaptador de compatibilidade, diagnósticos, documentação e uma janela de descontinuação. Isso se aplica a importações do SDK, campos de manifesto, APIs de configuração, hooks e comportamento de registro em tempo de execução.

<Warning>
  A camada de compatibilidade retroativa será removida em uma versão principal futura.
  Plugins que ainda importam dessas superfícies vão quebrar quando isso acontecer.
  Registros de fábrica de extensão embutida exclusivos do Pi já não são mais carregados.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um auxiliar carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexportações amplas facilitavam a criação de ciclos de importação
- **Superfície de API pouco clara** — não havia como saber quais exportações eram estáveis e quais eram internas

O SDK moderno de plugins corrige isso: cada caminho de importação (`openclaw/plugin-sdk/\<subpath\>`) é um módulo pequeno, autocontido, com propósito claro e contrato documentado.

Os pontos de integração legados de conveniência de provedores para canais empacotados também foram removidos. Pontos de integração auxiliares com marca de canal eram atalhos privados do monorepo, não contratos estáveis de plugins. Use subcaminhos genéricos e específicos do SDK em vez disso. Dentro do workspace de plugins empacotados, mantenha auxiliares pertencentes ao provedor no próprio `api.ts` ou `runtime-api.ts` desse plugin.

Exemplos atuais de provedores empacotados:

- Anthropic mantém auxiliares de stream específicos do Claude em seu próprio ponto de integração `api.ts` / `contract-api.ts`
- OpenAI mantém construtores de provedor, auxiliares de modelo padrão e construtores de provedor em tempo real em seu próprio `api.ts`
- OpenRouter mantém construtor de provedor e auxiliares de integração/configuração em seu próprio `api.ts`

## Política de compatibilidade

Para plugins externos, o trabalho de compatibilidade segue esta ordem:

1. adicione o novo contrato
2. mantenha o comportamento antigo conectado por meio de um adaptador de compatibilidade
3. emita um diagnóstico ou aviso que nomeie o caminho antigo e a substituição
4. cubra ambos os caminhos em testes
5. documente a descontinuação e o caminho de migração
6. remova somente após a janela de migração anunciada, geralmente em uma versão principal

Mantenedores podem auditar a fila atual de migração com `pnpm plugins:boundary-report`. Use `pnpm plugins:boundary-report:summary` para contagens compactas, `--owner <id>` para um plugin ou proprietário de compatibilidade, e `pnpm plugins:boundary-report:ci` quando um gate de CI deve falhar em registros de compatibilidade vencidos, importações de SDK reservadas entre proprietários ou subcaminhos reservados do SDK não usados. O relatório agrupa registros de compatibilidade obsoletos por data de remoção, conta referências locais em código/documentação, destaca importações reservadas de SDK entre proprietários e resume a ponte privada do SDK de host de memória para que a limpeza de compatibilidade permaneça explícita em vez de depender de buscas ad hoc. Subcaminhos reservados do SDK devem ter uso de proprietário rastreado; exportações auxiliares reservadas não usadas devem ser removidas do SDK público.

Se um campo de manifesto ainda é aceito, autores de plugins podem continuar usando-o até que a documentação e os diagnósticos digam o contrário. Código novo deve preferir a substituição documentada, mas plugins existentes não devem quebrar durante versões menores comuns.

## Como migrar

<Steps>
  <Step title="Migrar auxiliares de carregamento/gravação de configuração de tempo de execução">
    Plugins empacotados devem parar de chamar
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)` diretamente. Prefira a configuração que
    já foi passada para o caminho de chamada ativo. Manipuladores de longa duração que precisam do
    snapshot atual do processo podem usar `api.runtime.config.current()`. Ferramentas de agente
    de longa duração devem usar `ctx.getRuntimeConfig()` do contexto da ferramenta dentro de
    `execute` para que uma ferramenta criada antes de uma gravação de configuração ainda veja a
    configuração de tempo de execução atualizada.

    Gravações de configuração devem passar pelos auxiliares transacionais e escolher uma
    política pós-gravação:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Use `afterWrite: { mode: "restart", reason: "..." }` quando o chamador sabe
    que a alteração exige uma reinicialização limpa do Gateway, e
    `afterWrite: { mode: "none", reason: "..." }` somente quando o chamador controla o
    acompanhamento e deliberadamente quer suprimir o planejador de recarregamento.
    Os resultados de mutação incluem um resumo tipado `followUp` para testes e logs;
    o Gateway permanece responsável por aplicar ou agendar a reinicialização.
    `loadConfig` e `writeConfigFile` permanecem como auxiliares de compatibilidade
    obsoletos para plugins externos durante a janela de migração e avisam uma vez com
    o código de compatibilidade `runtime-config-load-write`. Plugins empacotados e código
    de tempo de execução do repositório são protegidos por guardrails de scanner em
    `pnpm check:deprecated-internal-config-api` e
    `pnpm check:no-runtime-action-load-config`: novo uso em plugins de produção
    falha imediatamente, gravações diretas de configuração falham, métodos do servidor do Gateway devem usar
    o snapshot de tempo de execução da solicitação, auxiliares de envio/ação/cliente de canal em tempo de execução
    devem receber configuração de sua fronteira, e módulos de tempo de execução de longa duração têm
    zero chamadas ambientes `loadConfig()` permitidas.

    Código novo de plugin também deve evitar importar o amplo módulo agregador de compatibilidade
    `openclaw/plugin-sdk/config-runtime`. Use o subcaminho específico do SDK que corresponde à tarefa:

    | Necessidade | Importação |
    | --- | --- |
    | Tipos de configuração como `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Asserções de configuração já carregada e busca de configuração de entrada do plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Leituras do snapshot atual de tempo de execução | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Gravações de configuração | `openclaw/plugin-sdk/config-mutation` |
    | Auxiliares de armazenamento de sessão | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuração de tabela Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Auxiliares de tempo de execução de política de grupos | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolução de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Substituições de modelo/sessão | `openclaw/plugin-sdk/model-session-runtime` |

    Plugins empacotados e seus testes são protegidos por scanner contra o amplo
    módulo agregador para que importações e mocks permaneçam locais ao comportamento de que precisam. O amplo
    módulo agregador ainda existe para compatibilidade externa, mas código novo não deve
    depender dele.

  </Step>

  <Step title="Migrar extensões de resultado de ferramenta do Pi para middleware">
    Plugins empacotados devem substituir manipuladores de resultado de ferramenta
    `api.registerEmbeddedExtensionFactory(...)` exclusivos do Pi por
    middleware neutro em relação ao tempo de execução.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Atualize o manifesto do plugin ao mesmo tempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugins externos não podem registrar middleware de resultado de ferramenta porque ele pode
    reescrever saída de ferramenta de alta confiança antes que o modelo a veja.

  </Step>

  <Step title="Migrar manipuladores nativos de aprovação para fatos de capacidade">
    Plugins de canal com suporte a aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de tempo de execução.

    Principais alterações:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação da fiação legada de `plugin.auth` /
      `plugin.approvals` para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de plugin de canal;
      mova campos de entrega/nativo/renderização para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout de canal; hooks de autenticação
      de aprovação ali não são mais lidos pelo core
    - Registre objetos de tempo de execução pertencentes ao canal, como clientes, tokens ou apps Bolt,
      por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento pertencentes ao plugin a partir de manipuladores nativos de aprovação;
      o core agora controla avisos de roteamento para outro lugar a partir de resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para o layout atual de capacidade de aprovação.

  </Step>

  <Step title="Auditar comportamento de fallback do wrapper do Windows">
    Se o seu plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers Windows
    `.cmd`/`.bat` não resolvidos agora falham fechados, a menos que você passe explicitamente
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depende intencionalmente de fallback de shell, não defina
    `allowShellFallback` e trate o erro lançado em vez disso.

  </Step>

  <Step title="Encontrar importações obsoletas">
    Pesquise em seu plugin importações de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por importações focadas">
    Cada exportação da superfície antiga corresponde a um caminho específico de importação moderno:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para auxiliares do lado do host, use o tempo de execução injetado do plugin em vez de importar diretamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros auxiliares legados de ponte:

    | Importação antiga | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | auxiliares de armazenamento de sessão | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` ainda existe para compatibilidade
    externa, mas o código novo deve importar a superfície de auxiliares focada de
    que realmente precisa:

    | Necessidade | Importação |
    | --- | --- |
    | Auxiliares da fila de eventos do sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Auxiliares de evento e visibilidade de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Esvaziamento da fila de entregas pendentes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria de atividade do canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de desduplicação em memória | `openclaw/plugin-sdk/dedupe-runtime` |
    | Auxiliares seguros de caminho de arquivo/mídia local | `openclaw/plugin-sdk/file-access-runtime` |
    | Busca ciente do dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Auxiliares de proxy e busca protegida | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política do dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitação/resolução de aprovação | `openclaw/plugin-sdk/approval-runtime` |
    | Auxiliares de payload de resposta de aprovação e comandos | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Auxiliares de formatação de erros | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de prontidão de transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Auxiliares de token seguro | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrência limitada de tarefas assíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerção numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueio assíncrono local ao processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueios de arquivo | `openclaw/plugin-sdk/file-lock` |

    Plugins incluídos são protegidos por scanner contra `infra-runtime`, então o
    código do repositório não pode regredir para o barrel amplo.

  </Step>

  <Step title="Migrate channel route helpers">
    O novo código de rota de canal deve usar `openclaw/plugin-sdk/channel-route`.
    Os nomes mais antigos de chave de rota e destino comparável permanecem como
    aliases de compatibilidade durante a janela de migração, mas plugins novos
    devem usar os nomes de rota que descrevem o comportamento diretamente:

    | Auxiliar antigo | Auxiliar moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Os auxiliares de rota modernos normalizam `{ channel, to, accountId, threadId }`
    de forma consistente entre aprovações nativas, supressão de respostas,
    desduplicação de entrada, entrega cron e roteamento de sessões. Se o seu
    plugin possui gramática de destino personalizada, use
    `resolveChannelRouteTargetWithParser(...)` para adaptar esse parser ao mesmo
    contrato de destino de rota.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de importação

  <Accordion title="Common import path table">
  | Caminho de importação | Finalidade | Exportações principais |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Auxiliar canônico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação guarda-chuva legada para definições/construtores de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportação do esquema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Auxiliar de entrada de provedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e construtores focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração | Prompts de lista de permissões, construtores de status de configuração |
  | `plugin-sdk/setup-runtime` | Auxiliares de runtime no momento da configuração | Adaptadores de patch de configuração seguros para importação, auxiliares de notas de consulta, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegados |
  | `plugin-sdk/setup-adapter-runtime` | Auxiliares de adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Auxiliares de ferramentas de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Auxiliares de múltiplas contas | Auxiliares de lista/configuração/porta de ação de contas |
  | `plugin-sdk/account-id` | Auxiliares de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Auxiliares de consulta de conta | Auxiliares de consulta de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Auxiliares restritos de conta | Auxiliares de lista de contas/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Fiação de prefixo de resposta, digitação e entrega de origem | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuração e auxiliares de acesso a DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Construtores de esquema de configuração | Primitivas compartilhadas de esquema de configuração de canal e somente o construtor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração incluídos | Somente plugins incluídos mantidos pelo OpenClaw; novos plugins devem definir esquemas locais do plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuração incluídos obsoletos | Apenas alias de compatibilidade; use `plugin-sdk/bundled-channel-config-schema` para plugins incluídos mantidos |
  | `plugin-sdk/telegram-command-config` | Auxiliares de configuração de comandos do Telegram | Normalização de nomes de comandos, recorte de descrições, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Auxiliares de status de conta e ciclo de vida de stream de rascunho | `createAccountStatusSink`, auxiliares de finalização de prévia de rascunho |
  | `plugin-sdk/inbound-envelope` | Auxiliares de envelope de entrada | Auxiliares compartilhados de rota + construtor de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Auxiliares de resposta de entrada | Auxiliares compartilhados de registrar e despachar |
  | `plugin-sdk/messaging-targets` | Análise de destinos de mensagens | Auxiliares de análise/correspondência de destinos |
  | `plugin-sdk/outbound-media` | Auxiliares de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-send-deps` | Auxiliares de dependências de envio de saída | Consulta leve `resolveOutboundSendDep` sem importar todo o runtime de saída |
  | `plugin-sdk/outbound-runtime` | Auxiliares de runtime de saída | Auxiliares de entrega de saída, delegado de identidade/envio, sessão, formatação e planejamento de payload |
  | `plugin-sdk/thread-bindings-runtime` | Auxiliares de vinculação de threads | Auxiliares de ciclo de vida e adaptador de vinculação de threads |
  | `plugin-sdk/agent-media-payload` | Auxiliares legados de payload de mídia | Construtor de payload de mídia do agente para layouts de campos legados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Somente utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Auxiliares amplos de runtime | Auxiliares de runtime/logging/backup/instalação de plugin |
  | `plugin-sdk/runtime-env` | Auxiliares restritos de env de runtime | Env de logger/runtime, timeout, retry e auxiliares de backoff |
  | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de runtime de plugin | Auxiliares de comandos/hooks/http/interativos de plugin |
  | `plugin-sdk/hook-runtime` | Auxiliares de pipeline de hooks | Auxiliares compartilhados de pipeline de Webhook/interno |
  | `plugin-sdk/lazy-runtime` | Auxiliares de runtime preguiçoso | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Auxiliares de processo | Auxiliares compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Auxiliares de runtime de CLI | Formatação de comandos, esperas, auxiliares de versão |
  | `plugin-sdk/gateway-runtime` | Auxiliares de Gateway | Cliente de Gateway, auxiliar de início pronto para loop de eventos e auxiliares de patch de status de canal |
  | `plugin-sdk/config-runtime` | Shim obsoleto de compatibilidade de configuração | Prefira `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Auxiliares de comandos do Telegram | Auxiliares de validação de comandos do Telegram com fallback estável quando a superfície de contrato do Telegram incluído está indisponível |
  | `plugin-sdk/approval-runtime` | Auxiliares de prompt de aprovação | Payload de aprovação de exec/plugin, auxiliares de capacidade/perfil de aprovação, auxiliares nativos de roteamento/runtime de aprovação e formatação de caminho de exibição de aprovação estruturada |
  | `plugin-sdk/approval-auth-runtime` | Auxiliares de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Auxiliares de cliente de aprovação | Auxiliares nativos de perfil/filtro de aprovação de exec |
  | `plugin-sdk/approval-delivery-runtime` | Auxiliares de entrega de aprovação | Adaptadores nativos de capacidade/entrega de aprovação |
  | `plugin-sdk/approval-gateway-runtime` | Auxiliares de Gateway de aprovação | Auxiliar compartilhado de resolução de Gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares de adaptador de aprovação | Auxiliares leves de carregamento de adaptador nativo de aprovação para pontos de entrada de canal quentes |
  | `plugin-sdk/approval-handler-runtime` | Auxiliares de manipulador de aprovação | Auxiliares mais amplos de runtime de manipulador de aprovação; prefira as costuras mais restritas de adaptador/Gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Auxiliares de destino de aprovação | Auxiliares nativos de vinculação de destino/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Auxiliares de resposta de aprovação | Auxiliares de payload de resposta de aprovação de exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Auxiliares de contexto de runtime de canal | Auxiliares genéricos de registrar/obter/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Auxiliares de segurança | Auxiliares compartilhados de confiança, controle de DM, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Auxiliares de política de SSRF | Auxiliares de lista de permissões de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Auxiliares de runtime de SSRF | Dispatcher fixado, fetch protegido, auxiliares de política de SSRF |
  | `plugin-sdk/system-event-runtime` | Auxiliares de evento do sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Auxiliares de Heartbeat | Auxiliares de evento e visibilidade de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Auxiliares de fila de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Auxiliares de atividade de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Auxiliares de deduplicação | Caches de deduplicação em memória |
  | `plugin-sdk/file-access-runtime` | Auxiliares de acesso a arquivos | Auxiliares seguros de caminho de arquivo/mídia local |
  | `plugin-sdk/transport-ready-runtime` | Auxiliares de prontidão de transporte | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Auxiliares de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Auxiliares de controle de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Auxiliares de formatação de erros | `formatUncaughtError`, `isApprovalNotFoundError`, auxiliares de grafo de erros |
  | `plugin-sdk/fetch-runtime` | Auxiliares de fetch/proxy encapsulados | `resolveFetch`, auxiliares de proxy, auxiliares de opções de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Auxiliares de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Auxiliares de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de lista de permissões | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de lista de permissões | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Controle de comandos e auxiliares de superfície de comandos | `resolveControlCommandGate`, auxiliares de autorização de remetente, auxiliares de registro de comandos incluindo formatação dinâmica de menu de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de status/ajuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análise de entrada de segredo | Auxiliares de entrada de segredo |
  | `plugin-sdk/webhook-ingress` | Auxiliares de requisição de Webhook | Utilitários de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Auxiliares de proteção de corpo de Webhook | Auxiliares de leitura/limite de corpo de requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, Heartbeat, planejador de resposta, fragmentação |
  | `plugin-sdk/reply-dispatch-runtime` | Auxiliares restritos de despacho de resposta | Finalização, despacho de provedor e auxiliares de rótulo de conversa |
  | `plugin-sdk/reply-history` | Auxiliares de histórico de respostas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Auxiliares de fragmentação de resposta | Auxiliares de fragmentação de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Auxiliares de armazenamento de sessão | Auxiliares de caminho de armazenamento + atualizado-em |
  | `plugin-sdk/state-paths` | Auxiliares de caminho de estado | Auxiliares de diretórios de estado e OAuth |
  | `plugin-sdk/routing` | Auxiliares de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, auxiliares de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Auxiliares de status de canal | Construtores de resumo de status de canal/conta, padrões de estado de runtime, auxiliares de metadados de problema |
  | `plugin-sdk/target-resolver-runtime` | Auxiliares de resolvedor de destino | Auxiliares compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de strings | Auxiliares de normalização de slug/string |
  | `plugin-sdk/request-url` | Auxiliares de URL de requisição | Extrair URLs em string de entradas semelhantes a requisições |
  | `plugin-sdk/run-command` | Auxiliares de comando temporizado | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extrai payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrai campos canônicos de alvo de envio a partir de argumentos de ferramenta |
  | `plugin-sdk/temp-path` | Auxiliares de caminho temporário | Auxiliares compartilhados de caminho de download temporário |
  | `plugin-sdk/logging-core` | Auxiliares de logging | Logger de subsistema e auxiliares de mascaramento |
  | `plugin-sdk/markdown-table-runtime` | Auxiliares de tabela Markdown | Auxiliares de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedor local/auto-hospedado | Auxiliares de descoberta/configuração de provedor auto-hospedado |
  | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedor auto-hospedado compatível com OpenAI | Os mesmos auxiliares de descoberta/configuração de provedor auto-hospedado |
  | `plugin-sdk/provider-auth-runtime` | Auxiliares de autenticação de runtime de provedor | Auxiliares de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Auxiliares de configuração de chave de API de provedor | Auxiliares de onboarding/gravação de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Auxiliares de resultado de autenticação de provedor | Construtor padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Auxiliares de login interativo de provedor | Auxiliares compartilhados de login interativo |
  | `plugin-sdk/provider-selection-runtime` | Auxiliares de seleção de provedor | Seleção de provedor configurado ou automático e mesclagem de configuração bruta de provedor |
  | `plugin-sdk/provider-env-vars` | Auxiliares de variáveis de ambiente de provedor | Auxiliares de consulta de variáveis de ambiente de autenticação de provedor |
  | `plugin-sdk/provider-model-shared` | Auxiliares compartilhados de modelo/replay de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Auxiliares compartilhados de catálogo de provedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provedor | Auxiliares de configuração de onboarding |
  | `plugin-sdk/provider-http` | Auxiliares HTTP de provedor | Auxiliares genéricos de capacidade HTTP/endpoint de provedor, incluindo auxiliares de formulário multipart para transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Auxiliares de web-fetch de provedor | Auxiliares de registro/cache de provedor web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Auxiliares de configuração de web-search de provedor | Auxiliares restritos de configuração/credenciais de web-search para provedores que não precisam de ligação de ativação de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato de web-search de provedor | Auxiliares restritos de contrato de configuração/credenciais de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Auxiliares de web-search de provedor | Auxiliares de registro/cache/runtime de provedor web-search |
  | `plugin-sdk/provider-tools` | Auxiliares de compatibilidade de ferramenta/esquema de provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de esquema Gemini + diagnósticos e auxiliares de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Auxiliares de uso de provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros auxiliares de uso de provedor |
  | `plugin-sdk/provider-stream` | Auxiliares de wrapper de stream de provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte de provedor | Auxiliares de transporte nativo de provedor, como fetch protegido, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Auxiliares compartilhados de mídia | Auxiliares de busca/transformação/armazenamento de mídia, sondagem de dimensões de vídeo baseada em ffprobe e construtores de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de geração de mídia | Auxiliares compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Auxiliares de compreensão de mídia | Tipos de provedor de compreensão de mídia mais exports de auxiliares de imagem/áudio voltados a provedores |
  | `plugin-sdk/text-runtime` | Auxiliares compartilhados de texto | Remoção de texto visível ao assistente, auxiliares de renderização/fragmentação/tabela Markdown, auxiliares de mascaramento, auxiliares de tags de diretiva, utilitários de texto seguro e auxiliares relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Auxiliares de fragmentação de texto | Auxiliar de fragmentação de texto de saída |
  | `plugin-sdk/speech` | Auxiliares de fala | Tipos de provedor de fala mais auxiliares de diretiva, registro e validação voltados a provedores, e construtor de TTS compatível com OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provedor de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Auxiliares de transcrição em tempo real | Tipos de provedor, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Auxiliares de voz em tempo real | Tipos de provedor, auxiliares de registro/resolução e auxiliares de sessão de ponte |
  | `plugin-sdk/image-generation` | Auxiliares de geração de imagem | Tipos de provedor de geração de imagem mais auxiliares de asset de imagem/URL de dados e o construtor de provedor de imagem compatível com OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagem | Tipos de geração de imagem, failover, autenticação e auxiliares de registro |
  | `plugin-sdk/music-generation` | Auxiliares de geração de música | Tipos de provedor/solicitação/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Tipos de geração de música, auxiliares de failover, consulta de provedor e análise de referência de modelo |
  | `plugin-sdk/video-generation` | Auxiliares de geração de vídeo | Tipos de provedor/solicitação/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Tipos de geração de vídeo, auxiliares de failover, consulta de provedor e análise de referência de modelo |
  | `plugin-sdk/interactive-runtime` | Auxiliares de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas restritas de esquema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Auxiliares de gravação de configuração de canal | Auxiliares de autorização de gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports de prelúdio compartilhado de Plugin de canal |
  | `plugin-sdk/channel-status` | Auxiliares de status de canal | Auxiliares compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Auxiliares de configuração de allowlist | Auxiliares de edição/leitura de configuração de allowlist |
  | `plugin-sdk/group-access` | Auxiliares de acesso de grupo | Auxiliares compartilhados de decisão de acesso de grupo |
  | `plugin-sdk/direct-dm` | Auxiliares de DM direto | Auxiliares compartilhados de autenticação/guard de DM direto |
  | `plugin-sdk/extension-shared` | Auxiliares compartilhados de extensão | Primitivas auxiliares de canal passivo/status e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Auxiliares de alvo de Webhook | Registro de alvos de Webhook e auxiliares de instalação de rota |
  | `plugin-sdk/webhook-path` | Auxiliares de caminho de Webhook | Auxiliares de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Auxiliares compartilhados de mídia web | Auxiliares de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação de Zod | `zod` reexportado para consumidores do SDK de Plugin |
  | `plugin-sdk/memory-core` | Auxiliares de memory-core empacotados | Superfície de auxiliares de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de índice/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo de base do host de memória | Exports do mecanismo de base do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Contratos de embedding de memória, acesso ao registro, provedor local e auxiliares genéricos em lote/remotos; provedores remotos concretos ficam nos seus Plugins proprietários |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exports do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exports do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória | Auxiliares multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória | Auxiliares de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória | Auxiliares de segredo do host de memória |
  | `plugin-sdk/memory-core-host-events` | Auxiliares de diário de eventos do host de memória | Auxiliares de diário de eventos do host de memória |
  | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória | Auxiliares de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI do host de memória | Auxiliares de runtime CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime central do host de memória | Auxiliares de runtime central do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória | Auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime central do host de memória | Alias neutro em relação a fornecedor para auxiliares de runtime central do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de diário de eventos do host de memória | Alias neutro em relação a fornecedor para auxiliares de diário de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação a fornecedor para auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Auxiliares de Markdown gerenciado | Auxiliares compartilhados de Markdown gerenciado para Plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de Active Memory | Fachada preguiçosa de runtime do gerenciador de busca de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação a fornecedor para auxiliares de status do host de memória |
  | `plugin-sdk/testing` | Utilitários de teste | Barrel amplo de compatibilidade legada; prefira subcaminhos de teste focados, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não toda a superfície do SDK. A lista completa de mais de 200 pontos de entrada fica em `scripts/lib/plugin-sdk-entrypoints.json`.

As interfaces auxiliares reservadas de plugins agrupados foram retiradas do mapa público de exportações do SDK, exceto por fachadas de compatibilidade documentadas explicitamente, como o shim obsoleto `plugin-sdk/discord` mantido para o pacote publicado `@openclaw/discord@2026.3.13`. Auxiliares específicos do proprietário ficam dentro do pacote do plugin proprietário; o comportamento compartilhado do host deve passar por contratos genéricos do SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

Use a importação mais restrita que corresponda ao trabalho. Se você não encontrar uma exportação, verifique o código-fonte em `src/plugin-sdk/` ou pergunte aos mantenedores qual contrato genérico deve ser responsável por ela.

## Descontinuações ativas

Descontinuações mais restritas que se aplicam ao SDK de plugins, ao contrato de provedor, à superfície de runtime e ao manifesto. Cada uma ainda funciona hoje, mas será removida em uma versão principal futura. A entrada abaixo de cada item mapeia a API antiga para sua substituição canônica.

<AccordionGroup>
  <Accordion title="Construtores de ajuda command-auth → command-status">
    **Antigo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Novo (`openclaw/plugin-sdk/command-status`)**: mesmas assinaturas, mesmas
    exportações — apenas importadas do subcaminho mais restrito. `command-auth`
    as reexporta como stubs de compatibilidade.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Auxiliares de controle de menções → resolveInboundMentionDecision">
    **Antigo**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` de
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Novo**: `resolveInboundMentionDecision({ facts, policy })` — retorna um
    único objeto de decisão em vez de duas chamadas separadas.

    Plugins de canal downstream (Slack, Discord, Matrix, MS Teams) já
    migraram.

  </Accordion>

  <Accordion title="Shim de runtime de canal e auxiliares de ações de canal">
    `openclaw/plugin-sdk/channel-runtime` é um shim de compatibilidade para
    plugins de canal mais antigos. Não o importe em código novo; use
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Auxiliares `channelActions*` em `openclaw/plugin-sdk/channel-actions` estão
    obsoletos junto com exportações brutas de "actions" de canal. Exponha
    capacidades pela superfície semântica `presentation` — plugins de canal
    declaram o que renderizam (cards, botões, seletores) em vez de quais nomes
    brutos de ação aceitam.

  </Accordion>

  <Accordion title="Auxiliar tool() do provedor de busca na Web → createTool() no plugin">
    **Antigo**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Novo**: implemente `createTool(...)` diretamente no plugin provedor.
    O OpenClaw não precisa mais do auxiliar do SDK para registrar o wrapper da
    ferramenta.

  </Accordion>

  <Accordion title="Envelopes de canal em texto simples → BodyForAgent">
    **Antigo**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) para construir um envelope plano
    de prompt em texto simples a partir de mensagens recebidas de canal.

    **Novo**: `BodyForAgent` mais blocos estruturados de contexto do usuário.
    Plugins de canal anexam metadados de roteamento (thread, tópico, responder
    a, reações) como campos tipados em vez de concatená-los em uma string de
    prompt. O auxiliar `formatAgentEnvelope(...)` ainda tem suporte para
    envelopes sintetizados voltados ao assistente, mas envelopes recebidos em
    texto simples estão sendo descontinuados.

    Áreas afetadas: `inbound_claim`, `message_received` e qualquer plugin de
    canal personalizado que pós-processava o texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipos de descoberta de provedor → tipos de catálogo de provedor">
    Quatro aliases de tipo de descoberta agora são wrappers finos sobre os
    tipos da era de catálogo:

    | Alias antigo              | Novo tipo                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Além do pacote estático legado `ProviderCapabilities` — plugins provedores
    devem usar hooks explícitos de provedor, como `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn`, em vez de um objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de raciocínio → resolveThinkingProfile">
    **Antigo** (três hooks separados em `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Novo**: um único `resolveThinkingProfile(ctx)` que retorna um
    `ProviderThinkingProfile` com o `id` canônico, `label` opcional e lista de
    níveis ranqueada. O OpenClaw rebaixa automaticamente valores armazenados
    obsoletos pela classificação do perfil.

    Implemente um hook em vez de três. Os hooks legados continuam funcionando
    durante a janela de descontinuação, mas não são compostos com o resultado
    do perfil.

  </Accordion>

  <Accordion title="Fallback de provedor OAuth externo → contracts.externalAuthProviders">
    **Antigo**: implementar `resolveExternalOAuthProfiles(...)` sem
    declarar o provedor no manifesto do plugin.

    **Novo**: declare `contracts.externalAuthProviders` no manifesto do plugin
    **e** implemente `resolveExternalAuthProfiles(...)`. O caminho antigo de
    "fallback de autenticação" emite um aviso em runtime e será removido.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Busca de variáveis de ambiente de provedor → setup.providers[].envVars">
    Campo **antigo** do manifesto: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Novo**: espelhe a mesma busca de variáveis de ambiente em
    `setup.providers[].envVars` no manifesto. Isso consolida metadados de
    ambiente de configuração/status em um só lugar e evita iniciar o runtime
    do plugin apenas para responder buscas de variáveis de ambiente.

    `providerAuthEnvVars` permanece com suporte por meio de um adaptador de
    compatibilidade até o fechamento da janela de descontinuação.

  </Accordion>

  <Accordion title="Registro de plugin de memória → registerMemoryCapability">
    **Antigo**: três chamadas separadas —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Novo**: uma chamada na API de estado de memória —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mesmos slots, uma única chamada de registro. Auxiliares aditivos de memória
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) não são afetados.

  </Accordion>

  <Accordion title="Tipos de mensagens de sessão de subagente renomeados">
    Dois aliases de tipo legados ainda exportados de `src/plugins/runtime/types.ts`:

    | Antigo                       | Novo                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    O método de runtime `readSession` está obsoleto em favor de
    `getSessionMessages`. Mesma assinatura; o método antigo chama o novo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Antigo**: `runtime.tasks.flow` (singular) retornava um acessador ativo de task-flow.

    **Novo**: `runtime.tasks.managedFlows` mantém o runtime de mutação TaskFlow
    gerenciada para plugins que criam, atualizam, cancelam ou executam tarefas
    filhas a partir de um fluxo. Use `runtime.tasks.flows` quando o plugin só
    precisar de leituras baseadas em DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fábricas de extensão embutidas → middleware de resultado de ferramenta de agente">
    Coberto em "Como migrar → Migrar extensões de resultado de ferramenta do Pi
    para middleware" acima. Incluído aqui para completude: o caminho removido
    exclusivo do Pi `api.registerEmbeddedExtensionFactory(...)` é substituído
    por `api.registerAgentToolResultMiddleware(...)` com uma lista explícita de
    runtimes em `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` reexportado de `openclaw/plugin-sdk` agora é um alias
    de uma linha para `OpenClawConfig`. Prefira o nome canônico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Descontinuações em nível de extensão (dentro de plugins de canal/provedor
agrupados sob `extensions/`) são rastreadas dentro de seus próprios barrels
`api.ts` e `runtime-api.ts`. Elas não afetam contratos de plugins de terceiros
e não estão listadas aqui. Se você consome diretamente o barrel local de um
plugin agrupado, leia os comentários de descontinuação nesse barrel antes de
atualizar.
</Note>

## Cronograma de remoção

| Quando                 | O que acontece                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Agora**              | Superfícies obsoletas emitem avisos em runtime                          |
| **Próxima versão principal** | Superfícies obsoletas serão removidas; plugins que ainda as usam falharão |

Todos os plugins principais já foram migrados. Plugins externos devem migrar
antes da próxima versão principal.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma saída temporária, não uma solução permanente.

## Relacionados

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subcaminho
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criação de plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — criação de plugins de provedor
- [Internos de plugins](/pt-BR/plugins/architecture) — aprofundamento na arquitetura
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — referência do schema do manifesto
