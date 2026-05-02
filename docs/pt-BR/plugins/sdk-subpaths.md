---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditando subcaminhos de Plugins incluídos e superfícies auxiliares
summary: 'Catálogo de subcaminhos do SDK de Plugin: quais imports ficam onde, agrupados por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-05-02T21:02:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de Plugin é exposto como um conjunto de subcaminhos restritos em `openclaw/plugin-sdk/`.
Esta página cataloga os subcaminhos comumente usados agrupados por finalidade. A lista completa
gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`;
os subcaminhos auxiliares reservados de Plugins empacotados aparecem lá, mas são detalhes de
implementação, a menos que uma página da documentação os promova explicitamente. Mantenedores podem auditar os
subcaminhos auxiliares reservados ativos com `pnpm plugins:boundary-report:summary`; exportações
auxiliares reservadas não usadas falham no relatório de CI em vez de permanecerem no SDK público
como dívida de compatibilidade inativa.

Para o guia de autoria de Plugins, consulte [visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

  ## Entrada do Plugin

  | Subcaminho                                | Exportações principais                                                                                                                                                       |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel de compatibilidade ampla para testes legados de Plugin; prefira subcaminhos de teste focados para novos testes de extensões                                           |
  | `plugin-sdk/plugin-test-api`              | Construtor mínimo de mock de `OpenClawPluginApi` para testes unitários de registro direto de Plugin                                                                          |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato nativas do adaptador de runtime de agente para perfis de autenticação, supressão de entrega, classificação de fallback, hooks de ferramentas, sobreposições de prompt, esquemas e reparo de transcrição |
  | `plugin-sdk/channel-test-helpers`         | Helpers de teste para ciclo de vida de conta de canal, diretório, configuração de envio, mock de runtime, hook, entrada de canal empacotado, timestamp de envelope, resposta de pareamento e contrato genérico de canal |
  | `plugin-sdk/channel-target-testing`       | Suíte compartilhada de testes de casos de erro de resolução de destino de canal                                                                                              |
  | `plugin-sdk/plugin-test-contracts`        | Helpers de contrato para registro de Plugin, manifesto de pacote, artefato público, API de runtime, efeito colateral de importação e importação direta                       |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures de runtime de Plugin, registro, registro de provedor, assistente de configuração e fluxo de tarefas de runtime para testes                                          |
  | `plugin-sdk/provider-test-contracts`      | Helpers de contrato para runtime de provedor, autenticação, descoberta, onboarding, catálogo, capacidade de mídia, política de replay, áudio ao vivo STT em tempo real, pesquisa/busca na web e assistente |
  | `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/autenticação opcionais do Vitest para testes de provedor que exercitam `plugin-sdk/provider-http`                                                                 |
  | `plugin-sdk/test-env`                     | Fixtures de ambiente de teste, fetch/rede, servidor HTTP descartável, solicitação recebida, teste ao vivo, sistema de arquivos temporário e controle de tempo                |
  | `plugin-sdk/test-fixtures`                | Fixtures de teste genéricas de CLI, sandbox, skill, mensagem de agente, evento do sistema, recarregamento de módulo, caminho de Plugin empacotado, terminal, fragmentação, token de autenticação e caso tipado |
  | `plugin-sdk/test-node-mocks`              | Helpers focados de mock de componentes nativos do Node para uso dentro de factories `vi.mock("node:*")` do Vitest                                                            |
  | `plugin-sdk/migration`                    | Helpers de itens de provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de item, helpers de redação e `summarizeMigrationItems`     |
  | `plugin-sdk/migration-runtime`            | Helpers de migração de runtime, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração, prompts de lista de permissões, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuração/controle de ações para múltiplas contas, helpers de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Helpers de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Helpers estreitos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivos compartilhados de esquema de configuração de canal, além de construtores Zod e JSON/TypeBox diretos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canal do OpenClaw empacotados somente para plugins empacotados mantidos |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canal empacotado |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização/validação de comandos personalizados do Telegram com fallback de contrato empacotado |
    | `plugin-sdk/command-gating` | Helpers estreitos de controle de autorização de comando |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helpers de ciclo de vida/finalização de stream de rascunho |
    | `plugin-sdk/inbound-envelope` | Helpers compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartilhados de registro e despacho de entrada |
    | `plugin-sdk/messaging-targets` | Helpers de análise/correspondência de destino |
    | `plugin-sdk/outbound-media` | Helpers compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-send-deps` | Busca leve de dependências de envio de saída para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Helpers de entrega de saída, identidade, delegado de envio, sessão, formatação e planejamento de payload |
    | `plugin-sdk/poll-runtime` | Helpers estreitos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida e adaptador de vinculação de thread |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Helpers de vinculação de conversa/thread, pareamento e vinculação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Helpers compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos estreitos de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelude de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edição/leitura de configuração de lista de permissões |
    | `plugin-sdk/group-access` | Helpers compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Helpers compartilhados de autenticação/guarda de DM direta |
    | `plugin-sdk/discord` | Facade de compatibilidade obsoleta do Discord para `@openclaw/discord@2026.3.13` publicado e compatibilidade rastreada do proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Facade de compatibilidade obsoleta de resolução de conta do Telegram para compatibilidade rastreada do proprietário; novos plugins devem usar helpers de runtime injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Facade de compatibilidade obsoleta do Zalo Personal para pacotes Lark/Zalo publicados que ainda importam autorização de comando do remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helpers de apresentação semântica de mensagens, entrega e resposta interativa legada. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce de entrada, correspondência de menção, helpers de política de menção e helpers de envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helpers estreitos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Helpers estreitos de política de menção, marcador de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope` | Helpers estreitos de formatação de envelope de entrada |
    | `plugin-sdk/channel-location` | Helpers de contexto e formatação de localização de canal |
    | `plugin-sdk/channel-logging` | Helpers de log de canal para descartes de entrada e falhas de digitação/confirmação |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Helpers de ação de mensagem de canal, além de helpers de esquema nativo obsoletos mantidos para compatibilidade de Plugin |
    | `plugin-sdk/channel-route` | Helpers compartilhados de normalização de rota, resolução de destino orientada por parser, stringificação de ID de thread, chaves de rota de deduplicação/compactação, tipos de destino analisado e comparação de rota/destino |
    | `plugin-sdk/channel-targets` | Helpers de análise de destino; chamadores de comparação de rota devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexão de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedores">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de provedor LM Studio compatível para configuração, descoberta de catálogo e preparação de modelo em runtime |
    | `plugin-sdk/lmstudio-runtime` | Fachada de runtime LM Studio compatível para padrões do servidor local, descoberta de modelos, cabeçalhos de solicitação e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados para configuração de provedores locais/auto-hospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados para configuração de provedores auto-hospedados compatíveis com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolução de chaves de API em runtime para Plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Auxiliares compartilhados de login interativo para Plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Auxiliares de consulta de variáveis de ambiente de autenticação de provedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares de normalização de ID de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook de runtime de ampliação de catálogo de provedores e seams de registro plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidade HTTP/endpoint de provedores, erros HTTP de provedores e auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares de contrato estreito de configuração/seleção de busca na web, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedores de busca na web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares de configuração/credenciais de pesquisa na web com contrato estreito para provedores que não precisam de fiação de ativação de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato estreito de configuração/credenciais de pesquisa na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/runtime de provedores de pesquisa na web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de esquema Gemini + diagnósticos e auxiliares de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de stream e auxiliares compartilhados de wrappers Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de provedores, como fetch protegido, transformações de mensagens de transporte e streams de eventos de transporte graváveis |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares estreitos de modo de ativação de grupo e análise de comandos |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos, incluindo formatação dinâmica de menu de argumentos, auxiliares de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovadores e autenticação de ações no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprovação de exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de Gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptador nativo de aprovação para pontos de entrada de canal intensivos |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de runtime de manipulador de aprovação; prefira os seams mais estreitos de adaptador/Gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprovação + vinculação de conta |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de exec/Plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de payload de aprovação de exec/Plugin, auxiliares nativos de roteamento/runtime de aprovação e auxiliares de exibição estruturada de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares estreitos de redefinição de deduplicação de respostas recebidas |
    | `plugin-sdk/channel-contract-testing` | Auxiliares estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação nativa de comandos, formatação dinâmica de menu de argumentos e auxiliares nativos de destino de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos de canal intensivos |
    | `plugin-sdk/command-surface` | Normalização do corpo de comando e auxiliares de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de coleta de contrato de segredo para superfícies de segredo de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares estreitos de `coerceSecretRef` e tipagem SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, bloqueio de DM, conteúdo externo, redação de texto sensível, comparação de segredo em tempo constante e coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de lista de hosts permitidos e política SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares estreitos de dispatcher fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fixado, fetch protegido contra SSRF, erro SSRF e auxiliares de política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitação/destino de Webhook e coerção bruta de websocket/corpo |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho/timeout do corpo da solicitação |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime, registro, backup e instalação de plugins |
    | `plugin-sdk/runtime-env` | Helpers focados de env de runtime, logger, timeout, repetição e backoff |
    | `plugin-sdk/browser-config` | Fachada de configuração de navegador compatível para perfil/padrões normalizados, análise de URL CDP e helpers de autenticação de controle do navegador |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e consulta de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Helpers de importação/vinculação preguiçosa de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação, espera, versão, invocação de argumentos e grupos de comandos preguiçosos da CLI |
    | `plugin-sdk/gateway-runtime` | Cliente Gateway, helper de início de cliente pronto para loop de eventos, RPC da CLI do Gateway, erros de protocolo do Gateway e helpers de patch de status de canal |
    | `plugin-sdk/config-types` | Superfície de configuração somente de tipos para formatos de configuração de Plugin, como `OpenClawConfig` e tipos de configuração de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Helpers de consulta de configuração de Plugin em runtime, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers de mutação transacional de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers de snapshot de configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot de teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram incluído está indisponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência a arquivo sem o barrel amplo de text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de exec/Plugin, builders de capacidade de aprovação, helpers de autenticação/perfil, helpers de roteamento/runtime nativos e formatação de caminho de exibição de aprovação estruturada |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, fragmentação, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers focados de despacho/finalização de resposta e rótulo de conversa |
    | `plugin-sdk/reply-history` | Helpers e marcadores compartilhados de histórico de respostas em janela curta, como `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers focados de fragmentação de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho do armazenamento de sessão, chave de sessão, updated-at e mutação do armazenamento |
    | `plugin-sdk/cron-store-runtime` | Helpers de caminho/carregamento/salvamento do armazenamento de Cron |
    | `plugin-sdk/state-paths` | Helpers de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de rota/chave de sessão/vinculação de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolução de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs de string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comando com tempo limite e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrai payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de destino de envio de args de ferramenta |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho de download temporário |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema e redação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo e conversão de tabela Markdown |
    | `plugin-sdk/model-session-runtime` | Helpers de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de resolução de configuração de provedor Talk |
    | `plugin-sdk/json-store` | Pequenos helpers de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de bloqueio de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de desduplicação baseado em disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão e despacho de resposta ACP |
    | `plugin-sdk/acp-runtime-backend` | Helpers leves de registro de backend ACP e despacho de resposta para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vinculação ACP sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas focadas de esquema de configuração de runtime do agente |
    | `plugin-sdk/boolean-param` | Leitor permissivo de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivas compartilhadas de helpers de canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta do comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Helpers de registro/build/serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, helpers para orientar/abortar execução ativa, helpers de ponte de ferramentas do OpenClaw, helpers de política de ferramenta de plano de runtime, classificação de resultado de terminal, helpers de formatação/detalhe de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de lock assíncrono local ao processo para pequenos arquivos de estado de runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Helpers de cache de desduplicação em memória |
    | `plugin-sdk/delivery-queue-runtime` | Helper de drenagem de entrega pendente de saída |
    | `plugin-sdk/file-access-runtime` | Helpers de caminho seguro de arquivo local e fonte de mídia |
    | `plugin-sdk/heartbeat-runtime` | Helpers de evento e visibilidade de Heartbeat |
    | `plugin-sdk/number-runtime` | Helper de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Helpers de token/UUID seguro |
    | `plugin-sdk/system-event-runtime` | Helpers de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper de espera de prontidão de transporte |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos de runtime focados acima |
    | `plugin-sdk/collection-runtime` | Pequenos helpers de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag de diagnóstico, evento e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, helpers compartilhados de classificação de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulado, proxy, opção EnvHttpProxyAgent e helpers de lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime ciente de dispatcher sem importações de proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vinculação da conversa sem roteamento de vinculação configurado ou armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão sem importações amplas de gravação/manutenção de configuração |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Helpers focados de coerção e normalização de registro/string primitivos sem importações de markdown/logging |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuração de repetição e executor de repetição |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identidade/workspace do agente |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de recursos e testes">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados para buscar/transformar/armazenar mídia, sondagem de dimensões de vídeo baseada em ffprobe e construtores de payloads de mídia |
    | `plugin-sdk/media-store` | Helpers restritos de armazenamento de mídia, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia, além de exportações de helpers de imagem/áudio voltadas a provedores |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/markdown/logging, como remoção de texto visível ao assistente, helpers de renderização/fragmentação/tabelas de markdown, helpers de redação, helpers de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentação de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de exportações de diretiva, registro, validação, construtor de TTS compatível com OpenAI e helpers de fala voltadas a provedores |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva, normalização e exportações de helpers de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real, helpers de registro e helper compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagens, além de helpers de ativo de imagem/URL de dados e o construtor de provedor de imagem compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagens, failover, autenticação e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, consulta de provedor e análise de model-ref |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, consulta de provedor e análise de model-ref |
    | `plugin-sdk/webhook-targets` | Registro de destino Webhook e helpers de instalação de rotas |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho Webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do SDK de plugin |
    | `plugin-sdk/testing` | Barrel amplo de compatibilidade para testes de plugins legados. Novos testes de extensões devem importar subcaminhos focados do SDK, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo `createTestPluginApi` para testes unitários de registro direto de plugin sem importar pontes de helpers de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures nativas de contratos de adaptador agent-runtime para testes de autenticação, entrega, fallback, tool-hook, prompt-overlay, esquema e projeção de transcrição |
    | `plugin-sdk/channel-test-helpers` | Helpers de teste orientados a canais para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, encadeamento de send-config, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada de casos de erro de resolução de destino para testes de canais |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contratos de pacote de plugin, registro, artefato público, importação direta, API de runtime e efeitos colaterais de importação |
    | `plugin-sdk/provider-test-contracts` | Helpers de contratos de runtime de provedor, autenticação, descoberta, integração, catálogo, assistente, recurso de mídia, política de repetição, áudio ao vivo STT em tempo real, busca/fetch na web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação opt-in do Vitest para testes de provedor que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas de captura de runtime da CLI, contexto de sandbox, gravador de skill, mensagem de agente, evento do sistema, recarregamento de módulo, caminho de plugin incluído, texto de terminal, fragmentação, token de autenticação e casos tipados |
    | `plugin-sdk/test-node-mocks` | Helpers focados de mock de builtins do Node para uso dentro de factories `vi.mock("node:*")` do Vitest |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície incluída de helpers memory-core para helpers de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e helpers genéricos de lote/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime do núcleo do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação a fornecedor para helpers de runtime do núcleo do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação a fornecedor para helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação a fornecedor para helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de active memory para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação a fornecedor para helpers de status do host de memória |
  </Accordion>

  <Accordion title="Subcaminhos reservados de helpers incluídos">
    Atualmente não há subcaminhos reservados de SDK para helpers incluídos. Helpers
    específicos do proprietário ficam dentro do pacote de plugin proprietário, enquanto contratos de host
    reutilizáveis usam subcaminhos genéricos do SDK, como `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
