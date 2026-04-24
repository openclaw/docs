---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditando subcaminhos de Plugins incluídos e superfícies auxiliares
summary: 'Catálogo de subcaminhos do SDK de Plugin: onde vivem as importações, agrupadas por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T06:05:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753c7202a8a59ae9e420d436c7f3770ea455d810f2af52b716d438b84b8b986e
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  O SDK de Plugin é exposto como um conjunto de subcaminhos restritos em `openclaw/plugin-sdk/`.
  Esta página cataloga os subcaminhos mais usados agrupados por finalidade. A lista
  completa gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`;
  subcaminhos auxiliares reservados para Plugins incluídos aparecem ali, mas são
  detalhes de implementação, a menos que uma página da documentação os promova explicitamente.

  Para o guia de autoria de Plugin, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

  ## Entry de Plugin

  | Subpath                     | Exportações principais                                                                                                                |
  | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subpath | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do schema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, mais `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartilhados de assistente de configuração, prompts de allowlist, builders de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de múltiplas contas/gate de ação de configuração, helpers de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Helpers de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Helpers restritos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de schema de configuração de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização/validação de comando personalizado do Telegram com fallback de contrato incluído |
    | `plugin-sdk/command-gating` | Helpers restritos de gate de autorização de comando |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpers de ciclo de vida/finalização de fluxo de rascunho |
    | `plugin-sdk/inbound-envelope` | Helpers compartilhados de rota de entrada + builder de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartilhados de registro e despacho de entrada |
    | `plugin-sdk/messaging-targets` | Helpers de parsing/correspondência de destino |
    | `plugin-sdk/outbound-media` | Helpers compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-runtime` | Helpers de identidade de saída, delegado de envio e planejamento de payload |
    | `plugin-sdk/poll-runtime` | Helpers restritos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de adaptador e ciclo de vida de binding de tópico |
    | `plugin-sdk/agent-media-payload` | Builder legado de payload de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Helpers de binding de conversa/tópico, pareamento e binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Helpers compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas restritas de schema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorização para gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações de prelude compartilhadas de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de leitura/edição de configuração de allowlist |
    | `plugin-sdk/group-access` | Helpers compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Helpers compartilhados de autenticação/guarda para DM direta |
    | `plugin-sdk/interactive-runtime` | Helpers de apresentação semântica de mensagem, entrega e resposta interativa legada. Consulte [Apresentação de mensagem](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para helpers de debounce de entrada, correspondência de menção, política de menção e envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helpers restritos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Helpers restritos de política de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope` | Helpers restritos de formatação de envelope de entrada |
    | `plugin-sdk/channel-location` | Helpers de formatação e contexto de localização do canal |
    | `plugin-sdk/channel-logging` | Helpers de logging de canal para descartes de entrada e falhas de digitação/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Helpers de ação de mensagem de canal, mais helpers de schema nativo obsoletos mantidos para compatibilidade de Plugin |
    | `plugin-sdk/channel-targets` | Helpers de parsing/correspondência de destino |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Wiring de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Helpers restritos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedor">
    | Subpath | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers curados de configuração de provedor local/auto-hospedado |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provedor auto-hospedado compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de runtime para resolução de chave de API em Plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/gravação de perfil para chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartilhados de login interativo para Plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Helpers de busca de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de ID de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidade HTTP/endpoint de provedor, incluindo helpers de multipart form para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers restritos de contrato de configuração/seleção de web fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provedor de web fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers restritos de configuração/credencial de web search para provedores que não precisam de wiring de ativação de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers restritos de contrato de configuração/credencial de web search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credencial com escopo |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/runtime de provedor de web search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de schema do Gemini e helpers de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e semelhantes |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers nativos de transporte de provedor, como fetch protegido, transformações de mensagem de transporte e fluxos graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Helpers restritos de modo de ativação de grupo e parsing de comando |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subpath | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comando, helpers de autorização de remetente |
    | `plugin-sdk/command-status` | Builders de mensagem de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolução de aprovador e autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de perfil/filtro nativo de aprovação de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartilhado de resolução de aprovação no gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers leves de carregamento de adaptador nativo de aprovação para pontos de entrada de canal quentes |
    | `plugin-sdk/approval-handler-runtime` | Helpers mais amplos de runtime de handler de aprovação; prefira os seams mais restritos de adaptador/gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de destino de aprovação + binding de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de resposta de aprovação de exec/Plugin |
    | `plugin-sdk/reply-dedupe` | Helpers restritos de redefinição de deduplicação de resposta de entrada |
    | `plugin-sdk/channel-contract-testing` | Helpers restritos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Helpers nativos de autenticação de comando + destino de sessão nativa |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comando |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canal |
    | `plugin-sdk/command-surface` | Helpers de normalização de corpo de comando e superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers restritos de coleta de contrato de segredo para superfícies de segredo de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers restritos de `coerceSecretRef` e tipagem de SecretRef para parsing de contrato de segredo/configuração |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de confiança, gating de DM, conteúdo externo e coleta de segredo |
    | `plugin-sdk/ssrf-policy` | Helpers de allowlist de host e política SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers restritos de dispatcher fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fixado, fetch protegido por SSRF e política SSRF |
    | `plugin-sdk/secret-input` | Helpers de parsing de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitação/alvo de Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho/timeout do corpo da solicitação |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subpath | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime/logging/backup/instalação de Plugin |
    | `plugin-sdk/runtime-env` | Helpers restritos de env de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e busca de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativo do Plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Helpers de import/binding lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação, espera e versão da CLI |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente do Gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Helpers de carga/gravação de configuração e busca de configuração do Plugin |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicata/conflito, mesmo quando a superfície de contrato Telegram incluída não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de runtime de texto |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de exec/Plugin, builders de capacidade de aprovação, helpers de autenticação/perfil, helpers de roteamento/runtime nativo |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, chunking, dispatch, heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers restritos de dispatch/finalização de resposta |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico curto de resposta, como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers restritos de chunking de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho do armazenamento de sessão + updated-at |
    | `plugin-sdk/state-paths` | Helpers de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de rota/chave de sessão/binding de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolvedor de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs em string de entradas do tipo fetch/request |
    | `plugin-sdk/run-command` | Executor de comando com tempo controlado e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrai payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de destino de envio de args de ferramenta |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho temporário de download |
    | `plugin-sdk/logging-core` | Logger de subsistema e helpers de redação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo e conversão de tabela Markdown |
    | `plugin-sdk/json-store` | Pequenos helpers de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers reentrantes de file-lock |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de deduplicação com persistência em disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão ACP e dispatch de resposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de binding ACP sem imports de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas restritas de schema de configuração de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartilhadas de canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta do comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comando de Skill |
    | `plugin-sdk/native-command-registry` | Helpers de registro/build/serialização de comando nativo |
    | `plugin-sdk/agent-harness` | Superfície experimental e confiável de Plugin para harnesses de agente de baixo nível: tipos de harness, helpers de steer/abort de execução ativa, helpers de bridge de ferramenta do OpenClaw e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers de evento de sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Pequenos helpers de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Helpers de grafo de erro, formatação, classificação compartilhada de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulado, proxy e busca fixada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime com reconhecimento de dispatcher sem imports de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de binding de conversa sem roteamento de binding configurado ou armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Helpers de leitura de armazenamento de sessão sem imports amplos de gravações/manutenção de configuração |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem imports amplos de config/segurança |
    | `plugin-sdk/string-coerce-runtime` | Helpers restritos de coerção e normalização de string/registro primitivo sem imports de markdown/logging |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuração e executor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de agent dir/identidade/workspace |
    | `plugin-sdk/directory-runtime` | Query/deduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subpath | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de fetch/transform/store de mídia, além de builders de payload de mídia |
    | `plugin-sdk/media-store` | Helpers restritos de armazenamento de mídia, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de entendimento de mídia, além de exportações de helpers de imagem/áudio voltadas ao provedor |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/markdown/logging, como remoção de texto visível ao assistente, helpers de renderização/chunking/tabela Markdown, helpers de redação, helpers de tag de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de chunking de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de helpers de diretiva, registro e validação voltados ao provedor |
    | `plugin-sdk/speech-core` | Helpers compartilhados de tipos, registro, diretiva e normalização de provedor de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição realtime, helpers de registro e helper compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz realtime e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagem |
    | `plugin-sdk/image-generation-core` | Helpers compartilhados de tipos, failover, autenticação e registro para geração de imagem |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Helpers compartilhados de tipos, failover, busca de provedor e parsing de model-ref para geração de música |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Helpers compartilhados de tipos, failover, busca de provedor e parsing de model-ref para geração de vídeo |
    | `plugin-sdk/webhook-targets` | Helpers de registro de alvo de Webhook e instalação de rota |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de Webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do SDK de Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subpath | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície auxiliar incluída de memory-core para helpers de manager/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do motor de fundação do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embedding do host de memória, acesso ao registro, provedor local e helpers genéricos de lote/remoto |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do motor QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do motor de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de query do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro de fornecedor para helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro de fornecedor para helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro de fornecedor para helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de markdown gerenciado para Plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Facade de runtime de Active Memory para acesso ao gerente de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro de fornecedor para helpers de status do host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície auxiliar incluída de memory-lancedb |
  </Accordion>

  <Accordion title="Subcaminhos auxiliares reservados para incluídos">
    | Family | Subcaminhos atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de suporte do Plugin de navegador incluído (`browser-support` continua sendo o barrel de compatibilidade) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície auxiliar/runtime incluída do Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície auxiliar/runtime incluída do LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície auxiliar incluída do IRC |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seams de compatibilidade/helper de canal incluído |
    | Helpers específicos de autenticação/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams auxiliares de recurso/Plugin incluído; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
