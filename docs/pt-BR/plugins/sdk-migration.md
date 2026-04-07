---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você está atualizando um plugin para a arquitetura moderna de plugins
    - Você mantém um plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migre da camada legada de compatibilidade retroativa para o SDK moderno de plugins
title: Migração do SDK de plugins
x-i18n:
    generated_at: "2026-04-07T05:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3691060e9dc00ca8bee49240a047f0479398691bd14fb96e9204cc9243fdb32c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migração do SDK de plugins

O OpenClaw passou de uma ampla camada de compatibilidade retroativa para uma arquitetura moderna de plugins
com imports focados e documentados. Se o seu plugin foi criado antes
da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de plugins fornecia duas superfícies amplas e abertas que permitiam que os plugins importassem
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  auxiliares. Ele foi introduzido para manter plugins mais antigos baseados em hooks funcionando enquanto a
  nova arquitetura de plugins estava sendo construída.
- **`openclaw/extension-api`** — uma ponte que dava aos plugins acesso direto a
  auxiliares do host, como o executor de agente embutido.

Ambas as superfícies agora estão **obsoletas**. Elas ainda funcionam em runtime, mas novos
plugins não devem usá-las, e os plugins existentes devem migrar antes que a próxima
versão principal as remova.

<Warning>
  A camada de compatibilidade retroativa será removida em uma futura versão principal.
  Plugins que ainda fizerem import dessas superfícies vão quebrar quando isso acontecer.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um auxiliar carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexports amplos facilitavam a criação de ciclos de import
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis e quais eram internos

O SDK moderno de plugins corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno e autocontido com um propósito claro e um contrato documentado.

As conveniências legadas para provedores em canais empacotados também desapareceram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
superfícies auxiliares com marca de canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis para plugins. Use subcaminhos genéricos e estreitos do SDK. Dentro do
workspace de plugins empacotados, mantenha os auxiliares pertencentes ao provedor no próprio
`api.ts` ou `runtime-api.ts` desse plugin.

Exemplos atuais de provedores empacotados:

- O Anthropic mantém auxiliares de stream específicos do Claude em sua própria
  superfície `api.ts` / `contract-api.ts`
- O OpenAI mantém builders de provedor, auxiliares de modelo padrão e builders
  de provedor em tempo real em seu próprio `api.ts`
- O OpenRouter mantém o builder do provedor e auxiliares de onboarding/configuração em seu próprio
  `api.ts`

## Como migrar

<Steps>
  <Step title="Audite o comportamento de fallback do wrapper do Windows">
    Se o seu plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat` do Windows
    não resolvidos agora falham de forma fechada, a menos que você passe explicitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isto apenas para chamadores de compatibilidade confiáveis que
      // aceitam intencionalmente fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depende intencionalmente de fallback via shell, não defina
    `allowShellFallback` e trate o erro lançado.

  </Step>

  <Step title="Encontre imports obsoletos">
    Procure no seu plugin imports de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substitua por imports focados">
    Cada export da superfície antiga é mapeado para um caminho moderno de import específico:

    ```typescript
    // Antes (camada obsoleta de compatibilidade retroativa)
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

    Para auxiliares do lado do host, use o runtime injetado do plugin em vez de importar
    diretamente:

    ```typescript
    // Antes (ponte obsoleta extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros auxiliares legados da ponte:

    | Old import | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | auxiliares de armazenamento de sessão | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compile e teste">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de import

<Accordion title="Tabela comum de caminhos de import">
  | Import path | Finalidade | Principais exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Auxiliar canônico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexport legado abrangente para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export do schema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Auxiliar de entrada para provedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração | Prompts de allowlist, builders de status de configuração |
  | `plugin-sdk/setup-runtime` | Auxiliares de runtime durante a configuração | Adaptadores de patch de configuração seguros para import, auxiliares de notas de lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegada |
  | `plugin-sdk/setup-adapter-runtime` | Auxiliares do adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Auxiliares de tooling de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Auxiliares de múltiplas contas | Auxiliares de lista/configuração/portão de ação de conta |
  | `plugin-sdk/account-id` | Auxiliares de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Auxiliares de lookup de conta | Auxiliares de lookup de conta + fallback para padrão |
  | `plugin-sdk/account-helpers` | Auxiliares estreitos de conta | Auxiliares de lista de conta/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento por DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Prefixo de resposta + wiring de digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de configuração | Tipos de schema de configuração de canal |
  | `plugin-sdk/telegram-command-config` | Auxiliares de configuração de comando do Telegram | Normalização de nome de comando, truncamento de descrição, validação de duplicidade/conflito |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Rastreamento de status de conta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Auxiliares de envelope de entrada | Auxiliares compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Auxiliares de resposta de entrada | Auxiliares compartilhados de registrar e despachar |
  | `plugin-sdk/messaging-targets` | Parsing de destinos de mensagens | Auxiliares de parsing/correspondência de destino |
  | `plugin-sdk/outbound-media` | Auxiliares de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Auxiliares de runtime de saída | Auxiliares de identidade de saída/delegação de envio |
  | `plugin-sdk/thread-bindings-runtime` | Auxiliares de vinculação de thread | Ciclo de vida de vinculação de thread e auxiliares de adaptador |
  | `plugin-sdk/agent-media-payload` | Auxiliares legados de payload de mídia | Builder de payload de mídia de agente para layouts de campos legados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Auxiliares amplos de runtime | Auxiliares de runtime/logging/backup/instalação de plugin |
  | `plugin-sdk/runtime-env` | Auxiliares estreitos de ambiente de runtime | Auxiliares de logger/ambiente de runtime, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de runtime de plugin | Auxiliares de comandos/hooks/http/interativos de plugin |
  | `plugin-sdk/hook-runtime` | Auxiliares de pipeline de hooks | Auxiliares compartilhados de pipeline de webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Auxiliares de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Auxiliares de processo | Auxiliares compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Auxiliares de runtime da CLI | Formatação de comandos, esperas, auxiliares de versão |
  | `plugin-sdk/gateway-runtime` | Auxiliares do Gateway | Cliente do Gateway e auxiliares de patch de status de canal |
  | `plugin-sdk/config-runtime` | Auxiliares de configuração | Auxiliares de carregamento/gravação de configuração |
  | `plugin-sdk/telegram-command-config` | Auxiliares de comando do Telegram | Auxiliares de validação de comandos do Telegram estáveis para fallback quando a superfície de contrato empacotada do Telegram não estiver disponível |
  | `plugin-sdk/approval-runtime` | Auxiliares de prompt de aprovação | Payload de aprovação de exec/plugin, auxiliares de capacidade/perfil de aprovação, auxiliares nativos de roteamento/runtime de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Auxiliares de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Auxiliares do cliente de aprovação | Auxiliares de perfil/filtro de aprovação nativa de exec |
  | `plugin-sdk/approval-delivery-runtime` | Auxiliares de entrega de aprovação | Adaptadores nativos de capacidade/entrega de aprovação |
  | `plugin-sdk/approval-native-runtime` | Auxiliares de alvo de aprovação | Auxiliares nativos de vinculação de alvo/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Auxiliares de resposta de aprovação | Auxiliares de payload de resposta de aprovação de exec/plugin |
  | `plugin-sdk/security-runtime` | Auxiliares de segurança | Auxiliares compartilhados de confiança, gating de DM, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Auxiliares de política SSRF | Auxiliares de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Auxiliares de runtime SSRF | Auxiliares de dispatcher fixado, fetch protegido e política SSRF |
  | `plugin-sdk/collection-runtime` | Auxiliares de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Auxiliares de gating de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Auxiliares de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, auxiliares de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Auxiliares de fetch/proxy encapsulados | `resolveFetch`, auxiliares de proxy |
  | `plugin-sdk/host-runtime` | Auxiliares de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Auxiliares de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating de comando e auxiliares de superfície de comando | `resolveControlCommandGate`, auxiliares de autorização do remetente, auxiliares de registro de comando |
  | `plugin-sdk/secret-input` | Parsing de entrada de segredo | Auxiliares de entrada de segredo |
  | `plugin-sdk/webhook-ingress` | Auxiliares de requisição de webhook | Utilitários de alvo de webhook |
  | `plugin-sdk/webhook-request-guards` | Auxiliares de guarda de corpo de webhook | Auxiliares de leitura/limite do corpo da requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Auxiliares estreitos de despacho de resposta | Auxiliares de finalização + despacho de provedor |
  | `plugin-sdk/reply-history` | Auxiliares de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Auxiliares de chunk de resposta | Auxiliares de chunking de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Auxiliares de armazenamento de sessão | Auxiliares de caminho do armazenamento + updated-at |
  | `plugin-sdk/state-paths` | Auxiliares de caminho de estado | Auxiliares de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Auxiliares de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, auxiliares de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Auxiliares de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, auxiliares de metadados de problemas |
  | `plugin-sdk/target-resolver-runtime` | Auxiliares do resolvedor de alvo | Auxiliares compartilhados do resolvedor de alvo |
  | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de string | Auxiliares de normalização de slug/string |
  | `plugin-sdk/request-url` | Auxiliares de URL de requisição | Extrair URLs em string de entradas tipo requisição |
  | `plugin-sdk/run-command` | Auxiliares de comando com tempo controlado | Executor de comando com tempo controlado e stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrair campos canônicos de destino de envio dos argumentos da ferramenta |
  | `plugin-sdk/temp-path` | Auxiliares de caminho temporário | Auxiliares compartilhados de caminho temporário para download |
  | `plugin-sdk/logging-core` | Auxiliares de logging | Logger de subsistema e auxiliares de redação |
  | `plugin-sdk/markdown-table-runtime` | Auxiliares de tabela Markdown | Auxiliares de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Auxiliares curados para configuração de provedor local/self-hosted | Auxiliares de descoberta/configuração de provedor self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedor self-hosted compatível com OpenAI | Os mesmos auxiliares de descoberta/configuração de provedor self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Auxiliares de autenticação de runtime de provedor | Auxiliares de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Auxiliares de configuração de chave de API do provedor | Auxiliares de onboarding/gravação de perfil para chave de API |
  | `plugin-sdk/provider-auth-result` | Auxiliares de resultado de autenticação do provedor | Builder padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Auxiliares de login interativo do provedor | Auxiliares compartilhados de login interativo |
  | `plugin-sdk/provider-env-vars` | Auxiliares de variáveis de ambiente do provedor | Auxiliares de lookup de variável de ambiente de autenticação do provedor |
  | `plugin-sdk/provider-model-shared` | Auxiliares compartilhados de modelo/replay de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Auxiliares compartilhados de catálogo de provedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding do provedor | Auxiliares de configuração de onboarding |
  | `plugin-sdk/provider-http` | Auxiliares HTTP do provedor | Auxiliares genéricos de HTTP/capacidade de endpoint do provedor |
  | `plugin-sdk/provider-web-fetch` | Auxiliares de web-fetch do provedor | Auxiliares de registro/cache de provedor web-fetch |
  | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato de web-search do provedor | Auxiliares estreitos de contrato de configuração/credencial de web-search, como `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo definido |
  | `plugin-sdk/provider-web-search` | Auxiliares de web-search do provedor | Auxiliares de registro/cache/runtime de provedor de web-search |
  | `plugin-sdk/provider-tools` | Auxiliares de compatibilidade de ferramenta/schema do provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de schema do Gemini e auxiliares de compatibilidade do xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Auxiliares de uso do provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros auxiliares de uso do provedor |
  | `plugin-sdk/provider-stream` | Auxiliares de wrapper de stream do provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Auxiliares compartilhados de mídia | Auxiliares de fetch/transformação/armazenamento de mídia, além de builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de geração de mídia | Auxiliares compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Auxiliares de entendimento de mídia | Tipos de provedor para entendimento de mídia, além de exports auxiliares voltados ao provedor para imagem/áudio |
  | `plugin-sdk/text-runtime` | Auxiliares compartilhados de texto | Remoção de texto visível ao assistente, auxiliares de renderização/chunking/tabela em markdown, auxiliares de redação, auxiliares de tags de diretiva, utilitários de texto seguro e auxiliares relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Auxiliares de chunking de texto | Auxiliar de chunking de texto de saída |
  | `plugin-sdk/speech` | Auxiliares de fala | Tipos de provedor de fala, além de auxiliares voltados ao provedor para diretivas, registro e validação |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provedor de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Auxiliares de transcrição em tempo real | Tipos de provedor e auxiliares de registro |
  | `plugin-sdk/realtime-voice` | Auxiliares de voz em tempo real | Tipos de provedor e auxiliares de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagem | Tipos, failover, autenticação e auxiliares de registro de geração de imagem |
  | `plugin-sdk/music-generation` | Auxiliares de geração de música | Tipos de provedor/requisição/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Tipos de geração de música, auxiliares de failover, lookup de provedor e parsing de referência de modelo |
  | `plugin-sdk/video-generation` | Auxiliares de geração de vídeo | Tipos de provedor/requisição/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Tipos de geração de vídeo, auxiliares de failover, lookup de provedor e parsing de referência de modelo |
  | `plugin-sdk/interactive-runtime` | Auxiliares de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas estreitas de schema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Auxiliares de gravação de configuração de canal | Auxiliares de autorização de gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de plugin de canal |
  | `plugin-sdk/channel-status` | Auxiliares de status de canal | Auxiliares compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Auxiliares de configuração de allowlist | Auxiliares de edição/leitura de configuração de allowlist |
  | `plugin-sdk/group-access` | Auxiliares de acesso a grupo | Auxiliares compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm` | Auxiliares de DM direta | Auxiliares compartilhados de autenticação/guarda de DM direta |
  | `plugin-sdk/extension-shared` | Auxiliares compartilhados de extensão | Primitivas auxiliares de canal/status passivo e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Auxiliares de alvo de webhook | Registro de alvo de webhook e auxiliares de instalação de rota |
  | `plugin-sdk/webhook-path` | Auxiliares de caminho de webhook | Auxiliares de normalização de caminho de webhook |
  | `plugin-sdk/web-media` | Auxiliares compartilhados de mídia web | Auxiliares de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexport do Zod | `zod` reexportado para consumidores do SDK de plugins |
  | `plugin-sdk/memory-core` | Auxiliares empacotados de memory-core | Superfície auxiliar de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime para índice/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo de fundação do host de memória | Exports do mecanismo de fundação do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Exports do mecanismo de embeddings do host de memória |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exports do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exports do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória | Auxiliares multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória | Auxiliares de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória | Auxiliares de segredo do host de memória |
  | `plugin-sdk/memory-core-host-events` | Auxiliares do diário de eventos do host de memória | Auxiliares do diário de eventos do host de memória |
  | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória | Auxiliares de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI do host de memória | Auxiliares de runtime de CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime principal do host de memória | Auxiliares de runtime principal do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória | Auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias do runtime principal do host de memória | Alias neutro em relação ao fornecedor para auxiliares de runtime principal do host de memória |
  | `plugin-sdk/memory-host-events` | Alias do diário de eventos do host de memória | Alias neutro em relação ao fornecedor para auxiliares do diário de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação ao fornecedor para auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Auxiliares de markdown gerenciado | Auxiliares compartilhados de markdown gerenciado para plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de memória ativa | Fachada lazy de runtime do gerenciador de busca de memória ativa |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação ao fornecedor para auxiliares de status do host de memória |
  | `plugin-sdk/memory-lancedb` | Auxiliares empacotados de memory-lancedb | Superfície auxiliar de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Auxiliares e mocks de teste |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície completa do SDK.
A lista completa de mais de 200 entrypoints está em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas superfícies auxiliares de plugins empacotados, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas permanecem exportadas para
manutenção e compatibilidade de plugins empacotados, mas são intencionalmente
omitidas da tabela comum de migração e não são o alvo recomendado para
novo código de plugin.

A mesma regra se aplica a outras famílias de auxiliares empacotados, como:

- auxiliares de suporte a navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies de auxiliares/plugins empacotados, como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

Atualmente, `plugin-sdk/github-copilot-token` expõe a superfície estreita de auxiliares de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais estreito que corresponda à tarefa. Se você não conseguir encontrar um export,
verifique a origem em `src/plugin-sdk/` ou pergunte no Discord.

## Cronograma de remoção

| When                   | O que acontece                                                         |
| ---------------------- | ---------------------------------------------------------------------- |
| **Agora**              | Superfícies obsoletas emitem avisos em runtime                         |
| **Próxima versão principal** | Superfícies obsoletas serão removidas; plugins que ainda as usam vão falhar |

Todos os plugins principais já foram migrados. Plugins externos devem migrar
antes da próxima versão principal.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma rota de escape temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subcaminho
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — criando plugins de provedor
- [Internals de plugins](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura
- [Manifesto de plugin](/pt-BR/plugins/manifest) — referência do schema do manifesto
