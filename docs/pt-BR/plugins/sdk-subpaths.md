---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para um import de Plugin
    - Auditando subcaminhos de Plugins incluídos e superfícies auxiliares
summary: 'Catálogo de subcaminhos do Plugin SDK: quais imports ficam onde, agrupados por área'
title: Subcaminhos do Plugin SDK
x-i18n:
    generated_at: "2026-04-26T11:35:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  O Plugin SDK é exposto como um conjunto de subcaminhos restritos em `openclaw/plugin-sdk/`.
  Esta página cataloga os subcaminhos mais usados, agrupados por finalidade. A lista
  completa gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`;
  subcaminhos reservados de helpers de Plugins incluídos aparecem lá, mas são um
  detalhe de implementação, a menos que uma página da documentação os promova explicitamente.

  Para o guia de criação de Plugins, veja [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview).

  ## Entrada do Plugin

  | Subcaminho                  | Exportações principais                                                                                                                   |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                      |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                         |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                        |

  <AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração, prompts de lista de permissões, builders de status da configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuração multiconta/gate de ação, helpers de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalização de id de conta |
    | `plugin-sdk/account-resolution` | Helpers de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Helpers restritos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuração de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização/validação de comandos personalizados do Telegram com fallback de contrato incluído |
    | `plugin-sdk/command-gating` | Helpers restritos de gate de autorização de comando |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpers de ciclo de vida/finalização de stream de rascunho |
    | `plugin-sdk/inbound-envelope` | Helpers compartilhados de rota de entrada + builder de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartilhados de registrar e despachar entrada |
    | `plugin-sdk/messaging-targets` | Helpers de análise/correspondência de alvo |
    | `plugin-sdk/outbound-media` | Helpers compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-send-deps` | Busca leve de dependências de envio de saída para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Helpers de entrega de saída, identidade, delegado de envio, sessão, formatação e planejamento de carga |
    | `plugin-sdk/poll-runtime` | Helpers restritos de normalização de polling |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida e adaptador de binding de thread |
    | `plugin-sdk/agent-media-payload` | Builder legado de carga de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Helpers de conversa/binding de thread, pareamento e binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Helpers compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos restritos de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelúdio de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de leitura/edição de configuração de lista de permissões |
    | `plugin-sdk/group-access` | Helpers compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Helpers compartilhados de auth/proteção de DM direta |
    | `plugin-sdk/interactive-runtime` | Helpers de apresentação semântica de mensagem, entrega e resposta interativa legada. Veja [Apresentação de mensagem](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce de entrada, correspondência de menção, helpers de política de menção e helpers de envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helpers restritos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Helpers restritos de política de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope` | Helpers restritos de formatação de envelope de entrada |
    | `plugin-sdk/channel-location` | Helpers de contexto e formatação de localização de canal |
    | `plugin-sdk/channel-logging` | Helpers de logging de canal para descartes de entrada e falhas de typing/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Helpers de ação de mensagem de canal, além de helpers de esquema nativo obsoletos mantidos para compatibilidade de Plugin |
    | `plugin-sdk/channel-targets` | Helpers de análise/correspondência de alvo |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Encadeamento de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Helpers restritos de contrato de segredo como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de alvo de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provider">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers selecionados de configuração de provider local/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provider self-hosted compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolução de API key em runtime para Plugins de provider |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/gravação de perfil de API key, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder padrão de resultado de auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartilhados de login interativo para Plugins de provider |
    | `plugin-sdk/provider-env-vars` | Helpers de busca de variáveis de ambiente de auth de provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provider e helpers de normalização de id de model, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de HTTP/capacidade de endpoint de provider, erros HTTP de provider e helpers de formulário multipart de transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers restritos de contrato de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provider de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers restritos de configuração/credencial de busca na web para providers que não precisam de encadeamento de ativação de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers restritos de contrato de configuração/credencial de busca na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/runtime de provider de busca na web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnóstico de esquema Gemini e helpers de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers nativos de transporte de provider, como fetch protegido, transformações de mensagem de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/cache local ao processo |
    | `plugin-sdk/group-activation` | Helpers restritos de modo de ativação de grupo e parsing de comando |
  </Accordion>

  <Accordion title="Subcaminhos de auth e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comando incluindo formatação de menu dinâmico de argumentos, helpers de autorização do remetente |
    | `plugin-sdk/command-status` | Builders de mensagem de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolução de aprovador e helpers de auth de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfil/filtro de aprovação exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartilhado de resolução de gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers leves de carregamento de adaptador nativo de aprovação para entrypoints de canal quentes |
    | `plugin-sdk/approval-handler-runtime` | Helpers mais amplos de runtime de manipulador de aprovação; prefira as interfaces mais restritas de adapter/gateway quando elas forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de alvo de aprovação + binding de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de carga de resposta de aprovação exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de carga de aprovação exec/plugin, helpers nativos de roteamento/runtime de aprovação e helpers estruturados de exibição de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers restritos de redefinição de deduplicação de resposta de entrada |
    | `plugin-sdk/channel-contract-testing` | Helpers restritos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Auth nativo de comando, formatação dinâmica de menu de argumentos e helpers nativos de alvo de sessão |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comando |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canal |
    | `plugin-sdk/command-surface` | Normalização de corpo de comando e helpers de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers restritos de coleta de contrato de segredo para superfícies secretas de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers restritos de `coerceSecretRef` e tipagem de SecretRef para parsing de contrato de segredo/config |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de confiança, bloqueio de DM, conteúdo externo e coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Helpers de lista de permissões de host e política SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers restritos de dispatcher fixado sem a ampla superfície de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fixado, fetch protegido por SSRF e política SSRF |
    | `plugin-sdk/secret-input` | Helpers de parsing de entrada secreta |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitação/alvo de Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho de corpo/timeout de requisição |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime/logging/backup/instalação de Plugin |
    | `plugin-sdk/runtime-env` | Helpers restritos de env de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e busca de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados de pipeline de webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Helpers de import/binding lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação CLI, espera, versão, invocação de argumento e grupo de comando lazy |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente de Gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Helpers de carregamento/gravação de config e helpers de busca de config de Plugin |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram incluída não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o amplo barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação exec/plugin, builders de capacidade de aprovação, helpers de auth/perfil, helpers nativos de roteamento/runtime e formatação estruturada de caminho de exibição de aprovação |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, chunking, dispatch, heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers restritos de dispatch/finalização de resposta e helpers de rótulo de conversa |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico de resposta em janela curta, como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers restritos de chunking de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho do armazenamento de sessão + updated-at |
    | `plugin-sdk/state-paths` | Helpers de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de rota/chave de sessão/binding de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolução de alvo |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comando com tempo controlado e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de params de tool/CLI |
    | `plugin-sdk/tool-payload` | Extrai cargas normalizadas de objetos de resultado de tool |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de alvo de envio dos argumentos da tool |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho temporário de download |
    | `plugin-sdk/logging-core` | Logger de subsistema e helpers de redação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo e conversão de tabela Markdown |
    | `plugin-sdk/json-store` | Pequenos helpers de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de file-lock reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de deduplicação com suporte em disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão ACP e dispatch de resposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de binding ACP sem imports de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivos restritos de esquema de configuração de runtime do agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivos compartilhados de canal passivo, status e helper de proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta de comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers nativos de registro/build/serialize de comando |
    | `plugin-sdk/agent-harness` | Superfície experimental para Plugins confiáveis de harness de agente: tipos de harness, helpers de steer/abort de execução ativa, helpers de ponte de tool do OpenClaw, helpers de política de tool de plano de runtime, classificação de resultado terminal, helpers de formatação/detalhe de progresso de tool e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helpers de evento de sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Pequenos helpers de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Helpers de grafo de erro, formatação, classificação compartilhada de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulado, proxy e busca fixada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime com reconhecimento de dispatcher sem imports de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a ampla superfície de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de binding de conversa sem roteamento de binding configurado nem armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Helpers de leitura de armazenamento de sessão sem imports amplos de gravação/manutenção de config |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem imports amplos de config/segurança |
    | `plugin-sdk/string-coerce-runtime` | Helpers restritos de coerção/normalização de record/string primitivo sem imports de Markdown/logging |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuração de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identidade/workspace de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório com suporte de config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de fetch/transformação/armazenamento de mídia, além de builders de carga de mídia |
    | `plugin-sdk/media-store` | Helpers restritos de armazenamento de mídia, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidato e mensagens de model ausente |
    | `plugin-sdk/media-understanding` | Tipos de provider de compreensão de mídia, além de exportações de helpers de imagem/áudio voltados ao provider |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/Markdown/logging, como remoção de texto visível ao assistente, helpers de renderização/chunking/tabela de Markdown, helpers de redação, helpers de tag de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de chunking de texto de saída |
    | `plugin-sdk/speech` | Tipos de provider de fala, além de exportações de helpers de diretiva, registro, validação e fala voltados ao provider |
    | `plugin-sdk/speech-core` | Exportações compartilhadas de tipos de provider de fala, registro, diretiva, normalização e helpers de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provider de transcrição em tempo real, helpers de registro e helper compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provider de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provider de geração de imagem |
    | `plugin-sdk/image-generation-core` | Helpers compartilhados de tipos, failover, auth e registro de geração de imagem |
    | `plugin-sdk/music-generation` | Tipos de provider/requisição/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Helpers compartilhados de tipos de geração de música, failover, busca de provider e parsing de ref de model |
    | `plugin-sdk/video-generation` | Tipos de provider/requisição/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Helpers compartilhados de tipos de geração de vídeo, failover, busca de provider e parsing de ref de model |
    | `plugin-sdk/webhook-targets` | Helpers de registro de alvo de Webhook e instalação de rota |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de Webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície auxiliar incluída de memory-core para helpers de manager/config/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo foundational do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provider local e helpers genéricos de lote/remoto |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação ao fornecedor para helpers centrais de runtime do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação ao fornecedor para helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação ao fornecedor para helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de Markdown gerenciado para Plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de memória ativa para acesso ao manager de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação ao fornecedor para helpers de status do host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície auxiliar incluída de memory-lancedb |
  </Accordion>

  <Accordion title="Subcaminhos reservados de helpers incluídos">
    | Família | Subcaminhos atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de suporte do Plugin de Browser incluído. `browser-profiles` exporta `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` e `ResolvedBrowserTabCleanupConfig` para o formato normalizado de `browser.tabCleanup`. `browser-support` continua sendo o barrel de compatibilidade. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície de helper/runtime do Matrix incluído |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície de helper/runtime do LINE incluído |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície de helper do IRC incluído |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfaces de helper/compatibilidade de canal incluído |
    | Helpers específicos de auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfaces de helper de recurso/Plugin incluído; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)
- [Configuração do Plugin SDK](/pt-BR/plugins/sdk-setup)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
