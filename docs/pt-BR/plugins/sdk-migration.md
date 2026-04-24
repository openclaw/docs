---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você está atualizando um Plugin para a arquitetura moderna de Plugin
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar da camada legada de compatibilidade retroativa para o SDK moderno de Plugin
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T06:04:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1612fbdc0e472a0ba1ae310ceeca9c672afa5a7eba77637b94726ef1fedee87
    source_path: plugins/sdk-migration.md
    workflow: 15
---

O OpenClaw migrou de uma ampla camada de compatibilidade retroativa para uma arquitetura moderna de Plugin
com imports focados e documentados. Se o seu Plugin foi criado antes
da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de Plugin fornecia duas superfícies amplas que permitiam aos Plugins importar
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  helpers. Ele foi introduzido para manter funcionando Plugins antigos baseados em hooks enquanto a
  nova arquitetura de Plugin estava sendo construída.
- **`openclaw/extension-api`** — uma bridge que dava aos Plugins acesso direto a
  helpers do lado do host, como o runner incorporado do agente.

Agora, ambas as superfícies estão **descontinuadas**. Elas ainda funcionam em runtime, mas novos
Plugins não devem usá-las, e Plugins existentes devem migrar antes que a próxima major release as remova.

O OpenClaw não remove nem reinterpreta comportamento documentado de Plugin na mesma mudança
que introduz um substituto. Mudanças de contrato incompatíveis primeiro precisam passar
por um adapter de compatibilidade, diagnostics, documentação e uma janela de depreciação.
Isso se aplica a imports do SDK, campos de manifest, APIs de setup, hooks e comportamento
de registro em runtime.

<Warning>
  A camada de compatibilidade retroativa será removida em uma futura major release.
  Plugins que ainda importarem dessas superfícies quebrarão quando isso acontecer.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexports amplos facilitavam a criação de ciclos de importação
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis vs internos

O SDK moderno de Plugin corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno e autocontido, com propósito claro e contrato documentado.

As conveniências legadas para provedores de canais incluídos também desapareceram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
interfaces auxiliares com marca de canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de Plugin. Use subpaths genéricos e estreitos do SDK. Dentro do
workspace do Plugin incluído, mantenha helpers controlados pelo provedor em `api.ts` ou `runtime-api.ts` do próprio Plugin.

Exemplos atuais de provedores incluídos:

- Anthropic mantém helpers de stream específicos do Claude em sua própria interface `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provedor, helpers de modelo padrão e builders de
  provedor realtime em seu próprio `api.ts`
- OpenRouter mantém builder de provedor e helpers de onboarding/configuração em seu próprio
  `api.ts`

## Política de compatibilidade

Para Plugins externos, o trabalho de compatibilidade segue esta ordem:

1. adicionar o novo contrato
2. manter o comportamento antigo conectado por um adapter de compatibilidade
3. emitir um diagnostic ou aviso que nomeie o caminho antigo e o substituto
4. cobrir ambos os caminhos em testes
5. documentar a depreciação e o caminho de migração
6. remover apenas após a janela de migração anunciada, geralmente em uma major release

Se um campo de manifest ainda é aceito, os autores de Plugin podem continuar usando-o até
que a documentação e os diagnostics digam o contrário. Código novo deve preferir o
substituto documentado, mas Plugins existentes não devem quebrar durante minor
releases normais.

## Como migrar

<Steps>
  <Step title="Migrar handlers nativos de aprovação para fatos de capacidade">
    Plugins de canal com capacidade de aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Principais mudanças:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação do encadeamento legado `plugin.auth` /
      `plugin.approvals` para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de Plugin de canal;
      mova campos delivery/native/render para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout do canal; hooks de autenticação de aprovação
      lá não são mais lidos pelo núcleo
    - Registre objetos de runtime controlados pelo canal, como clients, tokens ou apps
      Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento controlados pelo Plugin a partir de handlers nativos de aprovação;
      o núcleo agora controla avisos de roteado-para-outro-lugar a partir de resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma superfície real `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para o layout atual de capacidade de aprovação.

  </Step>

  <Step title="Auditar comportamento de fallback do wrapper do Windows">
    Se o seu Plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat` não resolvidos do Windows agora falham de forma fechada, a menos que você passe explicitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isto apenas para chamadores confiáveis de compatibilidade que
      // aceitam intencionalmente fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depende intencionalmente de fallback para shell, não defina
    `allowShellFallback` e trate o erro lançado em vez disso.

  </Step>

  <Step title="Encontrar imports descontinuados">
    Procure no seu Plugin imports de qualquer uma das superfícies descontinuadas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga corresponde a um caminho específico de import moderno:

    ```typescript
    // Antes (camada de compatibilidade retroativa descontinuada)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Depois (imports modernos e focados)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para helpers do lado do host, use o runtime injetado do Plugin em vez de importar
    diretamente:

    ```typescript
    // Antes (bridge extension-api descontinuada)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers legados de bridge:

    | Import antigo | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers de store de sessão | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build e testar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de importação

  <Accordion title="Tabela comum de caminhos de importação">
  | Caminho de importação | Finalidade | Principais exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canônico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação abrangente legada para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export do schema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada de provedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições/builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de setup | Prompts de allowlist, builders de status de setup |
  | `plugin-sdk/setup-runtime` | Helpers de runtime em tempo de setup | Adapters de patch de setup seguros para importação, helpers de lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de setup delegados |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adapter de setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de tooling de setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de múltiplas contas | Helpers de lista/configuração de contas/action-gate |
  | `plugin-sdk/account-id` | Helpers de account-id | `DEFAULT_ACCOUNT_ID`, normalização de account-id |
  | `plugin-sdk/account-resolution` | Helpers de lookup de conta | Helpers de lookup de conta + fallback para padrão |
  | `plugin-sdk/account-helpers` | Helpers estreitos de conta | Helpers de lista de contas/ação de conta |
  | `plugin-sdk/channel-setup` | Adapters do assistente de setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pairing de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Encadeamento de prefixo de resposta + digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factories de adapter de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de configuração | Tipos de schema de configuração de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comando do Telegram | Normalização de nome de comando, truncamento de descrição, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de status de conta e ciclo de vida de draft stream | `createAccountStatusSink`, helpers de finalização de prévia em rascunho |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsing de alvo de mensagem | Helpers de parsing/correspondência de alvo |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers de identidade de saída/delegação de envio e planejamento de payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de thread-binding | Helpers de ciclo de vida de thread-binding e adapters |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia do agente para layouts legados de campo |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade descontinuado | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/logging/backup/instalação de Plugin |
  | `plugin-sdk/runtime-env` | Helpers estreitos de env de runtime | Logger/env de runtime, timeout, retry e helpers de backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de Plugin | Helpers de comandos/hooks/http/interativos de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers compartilhados de pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime da CLI | Formatação de comandos, waits, helpers de versão |
  | `plugin-sdk/gateway-runtime` | Helpers do Gateway | Helpers de client do Gateway e patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuração | Helpers de load/write de configuração |
  | `plugin-sdk/telegram-command-config` | Helpers de comando do Telegram | Helpers estáveis de fallback para validação de comando do Telegram quando a superfície de contrato integrada do Telegram não está disponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Payload de aprovação de exec/Plugin, helpers de capacidade/perfil de aprovação, helpers nativos de roteamento/runtime de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client de aprovação | Helpers nativos de perfil/filtro de aprovação de exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adapters nativos de capacidade/entrega de aprovação |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de gateway de aprovação | Helper compartilhado de resolução de gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adapter de aprovação | Helpers leves de carregamento de adapter nativo de aprovação para entrypoints quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler de aprovação | Helpers mais amplos de runtime de handler de aprovação; prefira as interfaces mais estreitas de adapter/gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de alvo de aprovação | Helpers nativos de binding de alvo/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação de exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de registrar/obter/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, gating de DM, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime SSRF | Helpers de pinned-dispatcher, fetch protegido e política SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de gating de diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erros |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulados | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating de comando e helpers de superfície de comando | `resolveControlCommandGate`, helpers de autorização de remetente, helpers de registro de comando |
  | `plugin-sdk/command-status` | Renderizadores de status/help de comando | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing de entrada de segredo | Helpers de entrada de segredo |
  | `plugin-sdk/webhook-ingress` | Helpers de requisição de Webhook | Utilitários de alvo de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de guard de corpo de Webhook | Helpers de leitura/limite de corpo de requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Dispatch de entrada, Heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de dispatch de resposta | Helpers de finalização + dispatch de provedor |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de chunk de resposta | Helpers de chunking de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de store de sessão | Helpers de caminho de store + updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminho de estado | Helpers de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de roteamento/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de session-key |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo de status de canal/conta, padrões de runtime-state, helpers de metadados de issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de alvo | Helpers compartilhados de resolvedor de alvo |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de requisição | Extrair URLs string de entradas semelhantes a requisições |
  | `plugin-sdk/run-command` | Helpers de comando com temporização | Executor de comando com temporização e stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetro | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extrair payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrair campos canônicos de alvo de envio a partir de args de ferramenta |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário de download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela Markdown | Helpers de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Helpers curados de setup de provedor local/autohospedado | Helpers de descoberta/configuração de provedor autohospedado |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de setup de provedor autohospedado compatível com OpenAI | Os mesmos helpers de descoberta/configuração de provedor autohospedado |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticação de provedor em runtime | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de setup de chave de API de provedor | Helpers de onboarding/escrita de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de auth-result de provedor | Builder padrão de auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo de provedor | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-selection-runtime` | Helpers de seleção de provedor | Seleção de provedor configurado-ou-automático e mesclagem de configuração bruta de provedor |
  | `plugin-sdk/provider-env-vars` | Helpers de variáveis de ambiente de provedor | Helpers de lookup de variáveis de ambiente de autenticação de provedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de model-id |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provedor | Helpers de configuração de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provedor | Helpers genéricos de HTTP/capacidade de endpoint de provedor, incluindo helpers de formulário multipart para transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de provedor | Helpers de registro/cache de provedor de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuração de web-search de provedor | Helpers estreitos de configuração/credencial de web-search para provedores que não precisam de encadeamento de habilitação de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de web-search de provedor | Helpers estreitos de contrato de configuração/credencial de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credencial com escopo |
  | `plugin-sdk/provider-web-search` | Helpers de web-search de provedor | Helpers de registro/cache/runtime de provedor de web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidade de ferramenta/schema de provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de schema do Gemini + diagnostics e helpers de compatibilidade do xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provedor |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream de provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper de Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de provedor | Helpers nativos de transporte de provedor, como fetch protegido, transforms de mensagem de transporte e streams graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de fetch/transform/store de mídia mais builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de geração de mídia | Helpers compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Helpers de entendimento de mídia | Tipos de provedor de entendimento de mídia mais exports de helpers de imagem/áudio voltados ao provedor |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível ao assistente, helpers de render/chunking/tabela Markdown, helpers de redação, helpers de tags de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de chunking de texto | Helper de chunking de texto de saída |
  | `plugin-sdk/speech` | Helpers de fala | Tipos de provedor de fala mais helpers voltados ao provedor para diretiva, registro e validação |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provedor de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição em tempo real | Tipos de provedor, helpers de registro e helper compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz em tempo real | Tipos de provedor, helpers de registro/resolução e helpers de sessão de bridge |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagem | Tipos de geração de imagem, failover, autenticação e helpers de registro |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provedor/requisição/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Tipos de geração de música, helpers de failover, lookup de provedor e parsing de model-ref |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provedor/requisição/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Tipos de geração de vídeo, helpers de failover, lookup de provedor e parsing de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas estreitas de schema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de escrita de configuração de canal | Helpers de autorização para escrita de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuração de allowlist | Helpers de edição/leitura de configuração de allowlist |
  | `plugin-sdk/group-access` | Helpers de acesso a grupo | Helpers compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direta | Helpers compartilhados de autenticação/guard de DM direta |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivas de canal/status passivo e helper de proxy ambiente |
  | `plugin-sdk/webhook-targets` | Helpers de alvo de Webhook | Registro de alvo de Webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de Webhook | Helpers de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexport de Zod | `zod` reexportado para consumidores do SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers incluídos de memory-core | Superfície de helpers de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de índice/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo foundation do host de memória | Exports do mecanismo foundation do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Contratos de embeddings de memória, acesso ao registro, provedor local e helpers genéricos de lote/remoto; provedores remotos concretos ficam em seus Plugins responsáveis |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exports do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exports do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória | Helpers multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Helpers de query do host de memória | Helpers de query do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória | Helpers de segredo do host de memória |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal de eventos do host de memória | Helpers de journal de eventos do host de memória |
  | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória | Helpers de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI do host de memória | Helpers de runtime CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime central do host de memória | Helpers de runtime central do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória | Helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime central do host de memória | Alias neutro em relação a fornecedor para helpers de runtime central do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de journal de eventos do host de memória | Alias neutro em relação a fornecedor para helpers de journal de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação a fornecedor para helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gerenciado | Helpers compartilhados de markdown gerenciado para Plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de Active Memory | Fachada lazy de runtime do gerenciador de busca de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação a fornecedor para helpers de status do host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers incluídos de memory-lancedb | Superfície de helpers de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers de teste e mocks |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície completa
do SDK. A lista completa de mais de 200 entrypoints está em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas interfaces auxiliares de Plugin incluído, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas continuam exportadas para
manutenção e compatibilidade de Plugins incluídos, mas são omitidas
intencionalmente da tabela comum de migração e não são o destino recomendado para
novo código de Plugin.

A mesma regra se aplica a outras famílias de helpers incluídos, como:

- helpers de suporte a Browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies de helper/Plugin incluído como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

Atualmente, `plugin-sdk/github-copilot-token` expõe a superfície estreita de helper de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais estreito que corresponda ao trabalho. Se você não encontrar um export,
verifique o código-fonte em `src/plugin-sdk/` ou pergunte no Discord.

## Linha do tempo de remoção

| Quando                 | O que acontece                                                         |
| ---------------------- | ---------------------------------------------------------------------- |
| **Agora**              | Superfícies descontinuadas emitem avisos em runtime                    |
| **Próxima major release** | Superfícies descontinuadas serão removidas; Plugins que ainda as usam falharão |

Todos os Plugins centrais já foram migrados. Plugins externos devem migrar
antes da próxima major release.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Isso é uma válvula de escape temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro Plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subpath
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando Plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — criando Plugins de provedor
- [Internals de Plugin](/pt-BR/plugins/architecture) — aprofundamento na arquitetura
- [Manifest de Plugin](/pt-BR/plugins/manifest) — referência do schema de manifest
