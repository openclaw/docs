---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você está atualizando um plugin para a arquitetura moderna de plugins
    - Você mantém um plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migre da camada legada de compatibilidade retroativa para o plugin SDK moderno
title: Migração do Plugin SDK
x-i18n:
    generated_at: "2026-04-08T02:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 155a8b14bc345319c8516ebdb8a0ccdea2c5f7fa07dad343442996daee21ecad
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migração do Plugin SDK

O OpenClaw mudou de uma ampla camada de compatibilidade retroativa para uma
arquitetura moderna de plugins com imports focados e documentados. Se o seu
plugin foi criado antes da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de plugins fornecia duas superfícies amplas e abertas que
permitiam que plugins importassem tudo o que precisavam a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  helpers. Ele foi introduzido para manter plugins mais antigos baseados em hooks funcionando enquanto a
  nova arquitetura de plugins estava sendo construída.
- **`openclaw/extension-api`** — uma ponte que dava aos plugins acesso direto a
  helpers do lado do host, como o executor integrado do agente.

Ambas as superfícies agora estão **obsoletas**. Elas ainda funcionam em runtime, mas novos
plugins não devem usá-las, e plugins existentes devem migrar antes que a próxima
versão principal as remova.

<Warning>
  A camada de compatibilidade retroativa será removida em uma futura versão principal.
  Plugins que ainda importarem dessas superfícies vão quebrar quando isso acontecer.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexportações amplas facilitavam a criação de ciclos de import
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis e quais eram internos

O plugin SDK moderno corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno e autocontido, com propósito claro e contrato documentado.

As conveniências legadas para provedores em canais empacotados também acabaram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
superfícies helper com marca de canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis para plugins. Use subcaminhos genéricos e restritos do SDK. Dentro do
workspace de plugins empacotados, mantenha helpers de propriedade do provedor no próprio
`api.ts` ou `runtime-api.ts` desse plugin.

Exemplos atuais de provedores empacotados:

- Anthropic mantém helpers de stream específicos do Claude em sua própria superfície `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provedor, helpers de modelo padrão e builders de provedor em tempo real
  em seu próprio `api.ts`
- OpenRouter mantém builder de provedor e helpers de onboarding/config em seu próprio
  `api.ts`

## Como migrar

<Steps>
  <Step title="Migrar handlers nativos de aprovação para fatos de capacidade">
    Plugins de canal com suporte a aprovação agora expõem o comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Principais mudanças:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova auth/entrega específicos de aprovação da antiga estrutura `plugin.auth` /
      `plugin.approvals` para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de plugin de canal;
      mova campos de entrega/nativo/render para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout de canal; hooks de auth de aprovação
      ali já não são mais lidos pelo core
    - Registre objetos de runtime pertencentes ao canal, como clientes, tokens ou apps
      Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento pertencentes ao plugin a partir de handlers nativos de aprovação;
      o core agora é responsável pelos avisos de redirecionamento com base nos resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real de `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para ver o layout atual de
    capacidade de aprovação.

  </Step>

  <Step title="Auditar o comportamento de fallback do wrapper do Windows">
    Se o seu plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers do Windows
    `.cmd`/`.bat` não resolvidos agora falham de forma fechada, a menos que você passe explicitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isso apenas para chamadores confiáveis de compatibilidade que
      // aceitam intencionalmente fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depende intencionalmente de fallback por shell, não defina
    `allowShellFallback` e trate o erro lançado em vez disso.

  </Step>

  <Step title="Encontrar imports obsoletos">
    Procure no seu plugin por imports de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga corresponde a um caminho de import moderno específico:

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

    Para helpers do lado do host, use o runtime de plugin injetado em vez de importar
    diretamente:

    ```typescript
    // Antes (ponte obsoleta extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers legados da ponte:

    | Import antigo | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compilar e testar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de import

<Accordion title="Tabela de caminhos de import comuns">
  | Import path | Purpose | Key exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canônico de ponto de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação abrangente legada para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export do esquema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de ponto de entrada de provedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração | Prompts de allowlist, builders de status de configuração |
  | `plugin-sdk/setup-runtime` | Helpers de runtime no momento da configuração | Adaptadores de patch de setup seguros para import, helpers de nota de consulta, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies delegados de setup |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de tooling de setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers para múltiplas contas | Helpers de lista/config/barreira de ação de conta |
  | `plugin-sdk/account-id` | Helpers de id de conta | `DEFAULT_ACCOUNT_ID`, normalização de id de conta |
  | `plugin-sdk/account-resolution` | Helpers de busca de conta | Helpers de busca de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Helpers restritos de conta | Helpers de lista de contas/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparelhamento por DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Prefixo de resposta + integração de typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de esquema de configuração | Tipos de esquema de configuração de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comandos do Telegram | Normalização de nome de comando, trim de descrição, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Rastreamento de status de conta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de registro e despacho |
  | `plugin-sdk/messaging-targets` | Parsing de destinos de mensagens | Helpers de parsing/correspondência de destinos |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers delegados de identidade/envio de saída |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vínculo de thread | Ciclo de vida de vínculo de thread e helpers de adaptador |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia de agente para layouts legados de campos |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/log/backup/instalação de plugin |
  | `plugin-sdk/runtime-env` | Helpers restritos de ambiente de runtime | Logger/ambiente de runtime, helpers de timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de plugin | Helpers de comandos/hooks/http/interativos de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hooks | Helpers compartilhados de pipeline de hooks webhook/internos |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime da CLI | Formatação de comando, esperas, helpers de versão |
  | `plugin-sdk/gateway-runtime` | Helpers do gateway | Cliente do gateway e helpers de patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuração | Helpers de carregamento/gravação de config |
  | `plugin-sdk/telegram-command-config` | Helpers de comandos do Telegram | Helpers de validação de comandos do Telegram estáveis por fallback quando a superfície de contrato empacotada do Telegram não está disponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Payload de aprovação de exec/plugin, helpers de capacidade/perfil de aprovação, helpers de runtime/roteamento de aprovação nativa |
  | `plugin-sdk/approval-auth-runtime` | Helpers de auth de aprovação | Resolução de aprovador, auth de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprovação | Helpers nativos de perfil/filtro de aprovação de exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adaptadores de entrega/capacidade de aprovação nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de gateway de aprovação | Helper compartilhado de resolução de gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprovação | Helpers leves de carregamento de adaptador de aprovação nativa para pontos de entrada quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler de aprovação | Helpers mais amplos de runtime para handlers de aprovação; prefira as superfícies mais restritas de adaptador/gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação | Helpers nativos de vínculo de conta/destino de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação de exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de registrar/obter/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, barreira de DM, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime SSRF | Dispatcher com pinning, fetch protegido, helpers de política SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de barreira de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulados | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helpers de barreira de comando e superfície de comando | `resolveControlCommandGate`, helpers de autorização de remetente, helpers de registro de comando |
  | `plugin-sdk/secret-input` | Parsing de entrada de segredo | Helpers de entrada de segredo |
  | `plugin-sdk/webhook-ingress` | Helpers de solicitação webhook | Utilitários de destino de webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de guarda de corpo de webhook | Helpers de leitura/limite do corpo da solicitação |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers restritos de despacho de resposta | Finalização + helpers de despacho de provedor |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de chunks de resposta | Helpers de chunking de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão | Helpers de caminho do armazenamento + updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminhos de estado | Helpers de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo/snapshot de status de canal/conta, padrões de estado de runtime, helpers de metadados de issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destino | Helpers compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de solicitação | Extrair URLs string de entradas do tipo request |
  | `plugin-sdk/run-command` | Helpers de comando temporizado | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrair campos canônicos de destino de envio de args de ferramenta |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário para download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela Markdown | Helpers de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Helpers curados de configuração de provedor local/self-hosted | Helpers de descoberta/config de provedor self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provedor self-hosted compatível com OpenAI | Os mesmos helpers de descoberta/config de provedor self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpers de auth de runtime de provedor | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuração de chave de API de provedor | Helpers de onboarding/gravação de perfil para chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de auth de provedor | Builder padrão de resultado de auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo de provedor | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-env-vars` | Helpers de variáveis de ambiente de provedor | Helpers de busca de variáveis de ambiente de auth de provedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de id de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provedor | Helpers de config de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provedor | Helpers genéricos de HTTP/capacidade de endpoint de provedor |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de provedor | Helpers de registro/cache de provedor web-fetch |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de web-search de provedor | Helpers restritos de contrato de config/credencial de web-search como `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Helpers de web-search de provedor | Helpers de registro/cache/runtime de provedor de web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidade de ferramenta/esquema de provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnóstico de esquema Gemini e helpers de compatibilidade xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provedor |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream de provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de fetch/transform/store de mídia, além de builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de geração de mídia | Helpers compartilhados de failover, seleção de candidato e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Helpers de entendimento de mídia | Tipos de provedor de entendimento de mídia, além de exports de helpers de imagem/áudio voltados a provedores |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível para o assistente, helpers de render/chunking/tabela em markdown, helpers de redação, helpers de tags de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de chunking de texto | Helper de chunking de texto de saída |
  | `plugin-sdk/speech` | Helpers de fala | Tipos de provedor de fala, além de helpers voltados a provedores para diretivas, registro e validação |
  | `plugin-sdk/speech-core` | Core compartilhado de fala | Tipos de provedor de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição em tempo real | Tipos de provedor e helpers de registro |
  | `plugin-sdk/realtime-voice` | Helpers de voz em tempo real | Tipos de provedor e helpers de registro |
  | `plugin-sdk/image-generation-core` | Core compartilhado de geração de imagem | Tipos de geração de imagem, failover, auth e helpers de registro |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provedor/solicitação/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Core compartilhado de geração de música | Tipos de geração de música, helpers de failover, busca de provedor e parsing de model-ref |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provedor/solicitação/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Core compartilhado de geração de vídeo | Tipos de geração de vídeo, helpers de failover, busca de provedor e parsing de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas restritas de esquema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de gravação de config de canal | Helpers de autorização de gravação de config de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de config de allowlist | Helpers de edição/leitura de config de allowlist |
  | `plugin-sdk/group-access` | Helpers de acesso a grupo | Helpers compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direto | Helpers compartilhados de auth/guarda para DM direto |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivas helper de canal/status passivo e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Helpers de destino de webhook | Registro de destinos de webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de webhook | Helpers de normalização de caminho de webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexport de Zod | `zod` reexportado para consumidores do plugin SDK |
  | `plugin-sdk/memory-core` | Helpers empacotados de memory-core | Superfície helper de gerenciador/config/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do motor de memória | Fachada de runtime de índice/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base de host de memória | Exports do motor base de host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings de host de memória | Exports do motor de embeddings de host de memória |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD de host de memória | Exports do motor QMD de host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de armazenamento de host de memória | Exports do motor de armazenamento de host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais de host de memória | Helpers multimodais de host de memória |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta de host de memória | Helpers de consulta de host de memória |
  | `plugin-sdk/memory-core-host-secret` | Helpers de segredo de host de memória | Helpers de segredo de host de memória |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal de eventos de host de memória | Helpers de journal de eventos de host de memória |
  | `plugin-sdk/memory-core-host-status` | Helpers de status de host de memória | Helpers de status de host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI de host de memória | Helpers de runtime de CLI de host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core de host de memória | Helpers de runtime core de host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime de host de memória | Helpers de arquivo/runtime de host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime core de host de memória | Alias neutro em relação a fornecedor para helpers de runtime core de host de memória |
  | `plugin-sdk/memory-host-events` | Alias de journal de eventos de host de memória | Alias neutro em relação a fornecedor para helpers de journal de eventos de host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime de host de memória | Alias neutro em relação a fornecedor para helpers de arquivo/runtime de host de memória |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gerenciado | Helpers compartilhados de markdown gerenciado para plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de memória ativa | Fachada lazy de runtime do gerenciador de busca de memória ativa |
  | `plugin-sdk/memory-host-status` | Alias de status de host de memória | Alias neutro em relação a fornecedor para helpers de status de host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers empacotados de memory-lancedb | Superfície helper de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers e mocks de teste |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície
completa do SDK. A lista completa de mais de 200 pontos de entrada está em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas superfícies helper de plugins empacotados, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas continuam exportadas para
manutenção e compatibilidade de plugins empacotados, mas foram intencionalmente
omitidas da tabela comum de migração e não são o destino recomendado para
código novo de plugin.

A mesma regra se aplica a outras famílias de helpers empacotados, como:

- helpers de suporte a navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies helper/plugin empacotadas como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

Atualmente, `plugin-sdk/github-copilot-token` expõe a superfície restrita
de helper de token `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais restrito que corresponda ao trabalho. Se você não conseguir encontrar um export,
verifique o código-fonte em `src/plugin-sdk/` ou pergunte no Discord.

## Cronograma de remoção

| When                   | What happens                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Agora**              | Superfícies obsoletas emitem avisos em runtime                               |
| **Próxima versão principal** | Superfícies obsoletas serão removidas; plugins que ainda as usam vão falhar |

Todos os plugins centrais já foram migrados. Plugins externos devem migrar
antes da próxima versão principal.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma saída de emergência temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subcaminho
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — criando plugins de provedor
- [Internals de plugins](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura
- [Manifesto de plugin](/pt-BR/plugins/manifest) — referência do esquema de manifesto
