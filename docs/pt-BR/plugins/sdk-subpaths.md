---
read_when:
    - Escolhendo o subcaminho certo de plugin-sdk para um import de Plugin
    - Auditando subcaminhos de Plugins empacotados e superfícies auxiliares
summary: 'Catálogo de subcaminhos do SDK de Plugin: quais imports ficam onde, agrupados por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-04-25T18:20:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: b143fcc177c4d0d03fbcb4058291c99a7bb9f1f7fd04cca3916a7dbb4c22fd14
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  O SDK de Plugin é exposto como um conjunto de subcaminhos estreitos em `openclaw/plugin-sdk/`.
  Esta página cataloga os subcaminhos mais usados agrupados por finalidade. A lista
  completa gerada com mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`;
  subcaminhos reservados de auxiliares de Plugins empacotados aparecem ali, mas são
  detalhes de implementação, a menos que uma página de documentação os promova explicitamente.

  Para o guia de criação de Plugins, veja [Plugin SDK overview](/pt-BR/plugins/sdk-overview).

  ## Entrada do Plugin

  | Subcaminho                 | Principais exports                                                                                                                     |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Principais exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export do schema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, prompts de allowlist, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração multicuenta/gate de ação, auxiliares de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de id de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares estreitos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de schema de configuração de canal |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato empacotado |
    | `plugin-sdk/command-gating` | Auxiliares estreitos de gate de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, auxiliares de ciclo de vida/finalização de fluxo de rascunho |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares compartilhados de registro e despacho de entrada |
    | `plugin-sdk/messaging-targets` | Auxiliares de parsing/correspondência de alvos |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-runtime` | Auxiliares de entrega de saída, identidade, delegado de envio, sessão, formatação e planejamento de payload |
    | `plugin-sdk/poll-runtime` | Auxiliares estreitos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de vinculações de thread |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de vinculação de conversa/thread, emparelhamento e vinculação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos estreitos de schema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de escrita de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exports compartilhados de preâmbulo de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de allowlist |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Auxiliares compartilhados de autenticação/proteção de DM direto |
    | `plugin-sdk/interactive-runtime` | Auxiliares de apresentação semântica de mensagem, entrega e resposta interativa legada. Veja [Message Presentation](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce de entrada, correspondência de menções, auxiliares de política de menção e auxiliares de envelope |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares estreitos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares estreitos de política de menção e texto de menção sem a superfície mais ampla do runtime de entrada |
    | `plugin-sdk/channel-envelope` | Auxiliares estreitos de formatação de envelope de entrada |
    | `plugin-sdk/channel-location` | Auxiliares de contexto e formatação de localização de canal |
    | `plugin-sdk/channel-logging` | Auxiliares de logging de canal para descartes de entrada e falhas de digitação/confirmação |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, além de auxiliares de schema nativo obsoletos mantidos para compatibilidade de Plugin |
    | `plugin-sdk/channel-targets` | Auxiliares de parsing/correspondência de alvos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Wiring de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de alvo de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Principais exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Auxiliares curados de configuração de provedor local/autohospedado |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedor autohospedado compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de runtime para resolução de chave de API em Plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de onboarding por chave de API/escrita de perfil, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Auxiliares compartilhados de login interativo para Plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Auxiliares de busca de variáveis de ambiente de autenticação do provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares de normalização de id de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidade HTTP/endpoint de provedor, erros HTTP de provedor e auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares estreitos de contrato de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedor de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares estreitos de configuração/credencial de web-search para provedores que não precisam de wiring de ativação de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares estreitos de contrato de configuração/credencial de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credencial com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/runtime de provedor de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de schema Gemini e auxiliares de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares nativos de transporte de provedor, como fetch protegido, transformações de mensagem de transporte e fluxos de eventos de transporte graváveis |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache local ao processo |
    | `plugin-sdk/group-activation` | Auxiliares estreitos de modo de ativação de grupo e parsing de comandos |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Principais exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos, incluindo formatação dinâmica de menu de argumentos, auxiliares de autorização do remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolução de aprovador e auxiliares de autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares nativos de perfil/filtro de aprovação de execução |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de Gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptador nativo de aprovação para entrypoints de canais quentes |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de runtime do handler de aprovação; prefira os seams mais estreitos de adaptador/Gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de alvo de aprovação + vinculação de conta |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de execução/Plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de payload de aprovação de execução/Plugin, auxiliares nativos de roteamento/runtime de aprovação e auxiliares estruturados de exibição de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares estreitos de redefinição de deduplicação de resposta de entrada |
    | `plugin-sdk/channel-contract-testing` | Auxiliares estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação nativa de comando, formatação dinâmica de menu de argumentos e auxiliares nativos de alvo de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comando |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos de canal quentes |
    | `plugin-sdk/command-surface` | Auxiliares de normalização do corpo de comando e de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de coleta de contrato de segredo para superfícies de segredo de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares estreitos de `coerceSecretRef` e tipagem `SecretRef` para parsing de contrato/configuração de segredo |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, gate de DM, conteúdo externo e coleta de segredo |
    | `plugin-sdk/ssrf-policy` | Auxiliares de allowlist de host e política de SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares estreitos de dispatcher fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de dispatcher fixado, fetch protegido por SSRF e política de SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de parsing de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de requisição/alvo de Webhook |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho do corpo da requisição/timeout |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Principais exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de runtime/logging/backup/instalação de Plugin |
    | `plugin-sdk/runtime-env` | Auxiliares estreitos de ambiente de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e busca de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de hook interno/Webhook |
    | `plugin-sdk/lazy-runtime` | Auxiliares de import/vinculação lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processo |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação, espera, versão, invocação de argumentos e grupo de comandos lazy da CLI |
    | `plugin-sdk/gateway-runtime` | Auxiliares de cliente do Gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Auxiliares de carregamento/escrita de configuração e auxiliares de busca de configuração de Plugin |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato empacotada do Telegram não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de text-runtime |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de execução/Plugin, construtores de capacidade de aprovação, auxiliares de autenticação/perfil, auxiliares nativos de roteamento/runtime e formatação estruturada de caminho de exibição de aprovação |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime de entrada/resposta, chunking, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares estreitos de despacho/finalização de resposta e auxiliares de rótulo de conversa |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de resposta de janela curta, como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares estreitos de chunking de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de caminho de armazenamento de sessão + `updated-at` |
    | `plugin-sdk/state-paths` | Auxiliares de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Auxiliares de roteamento/chave de sessão/vinculação de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de runtime e auxiliares de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolvedor de alvo |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs de string de entradas do tipo fetch/request |
    | `plugin-sdk/run-command` | Executor de comandos com tempo medido e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrai payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de alvo de envio de argumentos de ferramenta |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho temporário para download |
    | `plugin-sdk/logging-core` | Auxiliares de logger de subsistema e redação |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo e conversão de tabela Markdown |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/escrita de estado JSON |
    | `plugin-sdk/file-lock` | Auxiliares de bloqueio de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de deduplicação com persistência em disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sessão ACP e despacho de resposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vinculação ACP sem imports de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivos estreitos de schema de configuração de runtime do agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de emparelhamento |
    | `plugin-sdk/extension-shared` | Primitivos auxiliares compartilhados de canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta de comando `/models`/provedor |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares nativos de registro/construção/serialização de comandos |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, auxiliares de steer/abort de execução ativa, auxiliares de bridge de ferramenta OpenClaw, auxiliares de formatação/detalhe de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Auxiliares de detecção de endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Auxiliares de evento de sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de flags e eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de erro, formatação, auxiliares compartilhados de classificação de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Auxiliares de fetch encapsulado, proxy e busca fixada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime com reconhecimento de dispatcher, sem imports de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de media-runtime |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vinculação de conversa sem roteamento de vinculação configurada ou armazenamentos de emparelhamento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de leitura de armazenamento de sessão sem imports amplos de escrita/manutenção de configuração |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem imports amplos de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares estreitos de coerção/normalização de string e registro primitivo sem imports de Markdown/logging |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuração de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/workspace do agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório com base em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subcaminho | Principais exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartilhados de busca/transformação/armazenamento de mídia, além de construtores de payload de mídia |
    | `plugin-sdk/media-store` | Auxiliares estreitos de armazenamento de mídia, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de failover para geração de mídia, seleção de candidato e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia, além de exports auxiliares voltados ao provedor para imagem/áudio |
    | `plugin-sdk/text-runtime` | Auxiliares compartilhados de texto/Markdown/logging, como remoção de texto visível ao assistente, auxiliares de renderização/chunking/tabela Markdown, auxiliares de redação, auxiliares de tag de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de chunking de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de exports auxiliares voltados ao provedor para diretiva, registro, validação e fala |
    | `plugin-sdk/speech-core` | Exports compartilhados de tipos, registro, diretiva, normalização e auxiliares de fala para provedor de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real e auxiliares de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagem |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, auxiliares de failover, autenticação e registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/requisição/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, auxiliares de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/requisição/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, auxiliares de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/webhook-targets` | Registro de alvos de Webhook e auxiliares de instalação de rota |
    | `plugin-sdk/webhook-path` | Auxiliares de normalização de caminho de Webhook |
    | `plugin-sdk/web-media` | Auxiliares compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do SDK de Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Principais exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície auxiliar empacotada de memory-core para auxiliares de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de indexação/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports do mecanismo foundation do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remoto |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Auxiliares de journal de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime da CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares centrais de runtime do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação a fornecedor para auxiliares centrais de runtime do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação a fornecedor para auxiliares de journal de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação a fornecedor para auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartilhados de Markdown gerenciado para Plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de memória ativa para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação a fornecedor para auxiliares de status do host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície auxiliar empacotada de memory-lancedb |
  </Accordion>

  <Accordion title="Subcaminhos reservados de auxiliares empacotados">
    | Família | Subcaminhos atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Auxiliares de suporte do Plugin Browser empacotado. `browser-profiles` exporta `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` e `ResolvedBrowserTabCleanupConfig` para o formato normalizado de `browser.tabCleanup`. `browser-support` permanece como barrel de compatibilidade. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície auxiliar/runtime empacotada do Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície auxiliar/runtime empacotada do LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície auxiliar empacotada do IRC |
    | Auxiliares específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seams de compatibilidade/auxiliares de canal empacotados |
    | Auxiliares específicos de auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams auxiliares de recursos/Plugin empacotados; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Relacionado

- [Plugin SDK overview](/pt-BR/plugins/sdk-overview)
- [Plugin SDK setup](/pt-BR/plugins/sdk-setup)
- [Building plugins](/pt-BR/plugins/building-plugins)
