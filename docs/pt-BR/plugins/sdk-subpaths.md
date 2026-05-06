---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditoria de subcaminhos de Plugins incluídos e superfícies auxiliares
summary: 'Catálogo de subcaminhos do Plugin SDK: quais imports ficam onde, agrupados por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-05-06T09:08:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de Plugin é exposto como um conjunto de subcaminhos estreitos em `openclaw/plugin-sdk/`.
Esta página cataloga os subcaminhos comumente usados agrupados por finalidade. A lista
completa gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`;
subcaminhos auxiliares reservados de plugins integrados aparecem lá, mas são detalhe de
implementação, a menos que uma página de documentação os promova explicitamente. Mantenedores podem auditar subcaminhos
auxiliares reservados ativos com `pnpm plugins:boundary-report:summary`; exportações auxiliares
reservadas não usadas falham no relatório de CI em vez de permanecerem no SDK público
como dívida de compatibilidade inativa.

Para o guia de criação de Plugin, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Entrada de Plugin

| Subcaminho                                | Exportações principais                                                                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Barrel amplo de compatibilidade para testes legados de Plugin; prefira subcaminhos de teste focados para novos testes de extensão                                           |
| `plugin-sdk/plugin-test-api`              | Construtor mínimo de mock de `OpenClawPluginApi` para testes unitários diretos de registro de Plugin                                                                         |
| `plugin-sdk/agent-runtime-test-contracts` | Fixtures nativas de contrato do adaptador de runtime de agente para perfis de autenticação, supressão de entrega, classificação de fallback, hooks de ferramentas, sobreposições de prompt, esquemas e reparo de transcrição |
| `plugin-sdk/channel-test-helpers`         | Auxiliares de teste para ciclo de vida de conta de canal, diretório, configuração de envio, mock de runtime, hook, entrada de canal integrado, timestamp de envelope, resposta de pareamento e contrato genérico de canal |
| `plugin-sdk/channel-target-testing`       | Suíte compartilhada de testes de casos de erro de resolução de alvo de canal                                                                                                |
| `plugin-sdk/plugin-test-contracts`        | Auxiliares de contrato para registro de Plugin, manifesto de pacote, artefato público, API de runtime, efeito colateral de importação e importação direta                    |
| `plugin-sdk/plugin-test-runtime`          | Fixtures para testes de runtime de Plugin, registro, registro de provedor, assistente de configuração e TaskFlow de runtime                                                 |
| `plugin-sdk/provider-test-contracts`      | Auxiliares de contrato para runtime de provedor, autenticação, descoberta, integração, catálogo, capacidade de mídia, política de reprodução, áudio ao vivo de STT em tempo real, pesquisa/busca na web e assistente |
| `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/autenticação opt-in do Vitest para testes de provedor que exercitam `plugin-sdk/provider-http`                                                                    |
| `plugin-sdk/test-env`                     | Fixtures de ambiente de teste, fetch/rede, servidor HTTP descartável, solicitação recebida, teste ao vivo, sistema de arquivos temporário e controle de tempo                |
| `plugin-sdk/test-fixtures`                | Fixtures genéricas de teste para CLI, sandbox, skill, mensagem de agente, evento de sistema, recarregamento de módulo, caminho de Plugin integrado, terminal, fragmentação, token de autenticação e caso tipado |
| `plugin-sdk/test-node-mocks`              | Auxiliares focados de mock de componentes internos do Node para uso dentro de factories `vi.mock("node:*")` do Vitest                                                       |
| `plugin-sdk/migration`                    | Auxiliares de itens do provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de item, auxiliares de redação e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime`            | Auxiliares de migração em runtime, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                 |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, prompts de lista de permissões, builders de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração multi-conta/gate de ação, auxiliares de fallback para conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares estreitos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Auxiliares legados do pipeline de respostas. Novo código de pipeline de respostas de canal deve usar `createChannelMessageReplyPipeline` e `resolveChannelMessageSourceReplyDeliveryMode` de `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartilhadas de esquema de configuração de canal, além de builders Zod e diretos JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canal OpenClaw empacotados apenas para plugins empacotados mantidos |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de bundled-channel |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato empacotado |
    | `plugin-sdk/command-gating` | Auxiliares estreitos de gate de autorização de comando |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` e auxiliares legados de ciclo de vida de stream de rascunho. Novo código de finalização de prévia deve usar `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Auxiliares baratos de contrato de ciclo de vida de mensagens, como `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, fachadas de compatibilidade, derivação de capacidade durable-final, auxiliares de prova de capacidade para capacidades de envio/recibo/efeito colateral, `MessageReceiveContext`, provas de política de ack de recebimento, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, provas de capacidade de prévia ao vivo e finalizador ao vivo, estado de recuperação durável, `RenderedMessageBatch`, tipos de recibo de mensagem e auxiliares de ID de recibo. Consulte [API de mensagens de canal](/pt-BR/plugins/sdk-channel-message). O legado `createChannelTurnReplyPipeline` permanece apenas para dispatchers de compatibilidade. |
    | `plugin-sdk/channel-message-runtime` | Auxiliares de entrega em runtime que podem carregar entrega de saída, incluindo `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` e `recordChannelMessageReplyDispatch`. Use a partir de módulos de runtime de monitoramento/envio, não de arquivos de bootstrap de Plugin quentes. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + builders de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares compartilhados legados de registro e dispatch de entrada, predicados de dispatch visível/final e compatibilidade obsoleta de `deliverDurableInboundReplyPayload` para dispatchers de canal preparados. Novo código de recebimento/dispatch de canal deve importar auxiliares de ciclo de vida em runtime de `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Auxiliares de análise/correspondência de alvos |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-send-deps` | Busca leve de dependência de envio de saída para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Auxiliares de entrega de saída, identidade, delegado de envio, sessão, formatação e planejamento de payload |
    | `plugin-sdk/poll-runtime` | Auxiliares estreitos de normalização de poll |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de vínculo de thread |
    | `plugin-sdk/agent-media-payload` | Builder legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de conversa/vínculo de thread, pareamento e vínculo configurado |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração em runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas estreitas de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de escrita de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelude de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de lista de permissões |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Auxiliares compartilhados de autorização/guard de DM direto |
    | `plugin-sdk/discord` | Fachada de compatibilidade Discord obsoleta para `@openclaw/discord@2026.3.13` publicado e compatibilidade rastreada do proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada de compatibilidade de resolução de conta Telegram obsoleta para compatibilidade rastreada do proprietário; novos plugins devem usar auxiliares de runtime injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Fachada de compatibilidade Zalo Personal obsoleta para pacotes Lark/Zalo publicados que ainda importam autorização de comando do remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Apresentação semântica de mensagens, entrega e auxiliares legados de resposta interativa. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce de entrada, correspondência de menção, auxiliares de política de menção e auxiliares de envelope |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares estreitos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares estreitos de política de menção, marcador de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope` | Auxiliares estreitos de formatação de envelope de entrada |
    | `plugin-sdk/channel-location` | Auxiliares de contexto e formatação de localização de canal |
    | `plugin-sdk/channel-logging` | Auxiliares de logging de canal para drops de entrada e falhas de digitação/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade de plugins |
    | `plugin-sdk/channel-route` | Auxiliares compartilhados de normalização de rota, resolução de alvo orientada por parser, stringificação de ID de thread, deduplicação/compactação de chaves de rota, tipos de alvo analisado e auxiliares de comparação de rota/alvo |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de alvos; chamadores de comparação de rota devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cabeamento de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de alvo de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedores">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de provedor LM Studio compatível para configuração, descoberta de catálogo e preparação de modelos em runtime |
    | `plugin-sdk/lmstudio-runtime` | Fachada de runtime LM Studio compatível para padrões do servidor local, descoberta de modelos, cabeçalhos de solicitação e helpers de modelo carregado |
    | `plugin-sdk/provider-setup` | Helpers de configuração de provedores locais/auto-hospedados selecionados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provedores auto-hospedados compatíveis com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes do watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolução de chave de API em runtime para plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartilhados de login interativo para plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Helpers de consulta de variáveis de ambiente de autenticação do provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de ID de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook de runtime de ampliação de catálogo de provedor e seams de registro de plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidades HTTP/endpoint de provedor, erros HTTP de provedor e helpers de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers estreitos de contrato de configuração/seleção de busca na web, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provedor de busca na web |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers estreitos de configuração/credenciais de busca na web para provedores que não precisam de cabeamento de habilitação de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers estreitos de contrato de configuração/credenciais de busca na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/runtime de provedor de busca na web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de esquema Gemini e helpers de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transporte nativo de provedor, como fetch protegido, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Helpers estreitos de modo de ativação de grupo e análise de comandos |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos incluindo formatação dinâmica de menu de argumentos, helpers de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolução de aprovador e autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de perfil/filtro de aprovação de exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartilhado de resolução de Gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers leves de carregamento de adaptador nativo de aprovação para entrypoints de canais quentes |
    | `plugin-sdk/approval-handler-runtime` | Helpers mais amplos de runtime de manipulador de aprovação; prefira os seams mais estreitos de adaptador/Gateway quando eles forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de alvo de aprovação + vinculação de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de resposta de aprovação de exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de payload de aprovação de exec/plugin, helpers nativos de roteamento/runtime de aprovação e helpers estruturados de exibição de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers estreitos de redefinição de deduplicação de respostas de entrada |
    | `plugin-sdk/channel-contract-testing` | Helpers estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação nativa de comandos, formatação dinâmica de menu de argumentos e helpers nativos de alvo de sessão |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canal |
    | `plugin-sdk/command-surface` | Normalização de corpo de comando e helpers de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de coleta de contrato de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers estreitos de `coerceSecretRef` e tipagem SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de confiança, bloqueio de DM, arquivos/caminhos limitados à raiz, incluindo gravações somente de criação, substituição atômica síncrona/assíncrona de arquivo, gravações temporárias irmãs, fallback de movimentação entre dispositivos, helpers privados de armazenamento de arquivos, proteções de pai de symlink, conteúdo externo, redação de texto sensível, comparação de segredo em tempo constante e helpers de coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Helpers de lista de permissões de hosts e política SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers estreitos de dispatcher fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fixado, fetch protegido contra SSRF, erro SSRF e helpers de política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitação/alvo de Webhook e coerção bruta de websocket/corpo |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho/timeout de corpo de solicitação |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de runtime, registro em log, backup e instalação de plugins |
    | `plugin-sdk/runtime-env` | Auxiliares específicos de ambiente de runtime, logger, timeout, nova tentativa e backoff |
    | `plugin-sdk/browser-config` | Fachada de configuração de navegador compatível para perfil/padrões normalizados, análise de URL CDP e auxiliares de autenticação de controle do navegador |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e consulta de contexto de runtime de canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidade Matrix obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidade Mattermost obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar subcaminhos genéricos do SDK diretamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comandos/hooks/http/interativos de Plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação/vinculação preguiçosa de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processos |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação da CLI, espera, versão, invocação de argumentos e grupos de comandos preguiçosos |
    | `plugin-sdk/gateway-runtime` | Cliente Gateway, auxiliar de inicialização de cliente pronto para loop de eventos, RPC da CLI do Gateway, erros de protocolo do Gateway e auxiliares de patch de status de canal |
    | `plugin-sdk/config-types` | Superfície de configuração somente de tipos para formatos de configuração de plugins, como `OpenClawConfig` e tipos de configuração de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de consulta de configuração de Plugin em runtime, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares de mutação transacional de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares de snapshot da configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot de teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comandos do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram incluída não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de runtime de texto |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de exec/Plugin, construtores de capacidade de aprovação, auxiliares de autenticação/perfil, auxiliares de roteamento/runtime nativos e formatação estruturada de caminho de exibição de aprovação |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime de entrada/resposta, segmentação, despacho, Heartbeat, planejador de respostas |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares específicos de despacho/finalização de resposta e rótulos de conversa |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de respostas de janela curta e marcadores como `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares específicos de segmentação de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de caminho do armazenamento de sessão, chave de sessão, atualizado em e mutação do armazenamento |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de caminho/carregamento/salvamento do armazenamento de Cron |
    | `plugin-sdk/state-paths` | Auxiliares de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Auxiliares de rota/chave de sessão/vinculação de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de runtime e auxiliares de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolvedor de destino |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs em string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comandos temporizados com resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrair payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de destino de envio dos argumentos da ferramenta |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho de download temporário e workspaces temporários privados seguros |
    | `plugin-sdk/logging-core` | Logger de subsistema e auxiliares de redação |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo e conversão de tabelas Markdown |
    | `plugin-sdk/model-session-runtime` | Auxiliares de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolução de configuração de provedor de conversa |
    | `plugin-sdk/json-store` | Auxiliares pequenos de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Auxiliares de bloqueio de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de desduplicação persistido em disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sessão ACP e despacho de respostas |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares leves de registro de backend ACP e despacho de respostas para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vinculação ACP sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas de schema de configuração de runtime do agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartilhadas de canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta de comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/construção/serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, auxiliares de direcionamento/aborto de execução ativa, auxiliares de ponte de ferramentas do OpenClaw, auxiliares de política de ferramenta de plano de runtime, classificação de resultado de terminal, auxiliares de formatação/detalhe de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Auxiliares de detecção de endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de lock assíncrono local ao processo para pequenos arquivos de estado de runtime |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de cache de desduplicação em memória |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de drenagem de entregas pendentes de saída |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros de caminho de arquivo local e fonte de mídia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de evento e visibilidade de Heartbeat |
    | `plugin-sdk/number-runtime` | Auxiliar de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares de token/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Auxiliares de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera de prontidão de transporte |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos de runtime focados acima |
    | `plugin-sdk/collection-runtime` | Auxiliares de cache pequeno limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de sinalizadores de diagnóstico, eventos e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Auxiliares de grafo de erros, formatação e classificação compartilhada de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulado, proxy, opção `EnvHttpProxyAgent` e auxiliares de lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime ciente de dispatcher sem importações de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado de vinculação da conversa atual sem roteamento de vinculação configurado ou armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de armazenamento de sessão sem importações amplas de gravações/manutenção de configuração |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares específicos de coerção e normalização de registro/string primitivos sem importações de markdown/registro em log |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuração de nova tentativa e executor de novas tentativas |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/workspace do agente, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de busca/transformação/armazenamento de mídia, sondagem de dimensões de vídeo baseada em ffprobe e construtores de payloads de mídia |
    | `plugin-sdk/media-store` | Helpers restritos de armazenamento de mídia, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedores de compreensão de mídia, além de exportações de helpers de imagem/áudio voltadas a provedores |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/markdown/logging, como remoção de texto visível para o assistente, helpers de renderização/fragmentação/tabelas em markdown, helpers de redação, helpers de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentação de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedores de fala, além de exportações de diretivas, registro, validação, construtor de TTS compatível com OpenAI e helpers de fala voltadas a provedores |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedores de fala, registro, diretiva, normalização e exportações de helpers de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedores de transcrição em tempo real, helpers de registro e helper compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provedores de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provedores de geração de imagens, além de helpers de assets de imagem/URL de dados e o construtor de provedor de imagens compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagens, failover, autenticação e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/webhook-targets` | Registro de destino de Webhook e helpers de instalação de rotas |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de Webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do SDK de plugin |
    | `plugin-sdk/testing` | Barrel amplo de compatibilidade para testes de plugins legados. Novos testes de extensão devem importar subcaminhos focados do SDK, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo `createTestPluginApi` para testes unitários de registro direto de plugins sem importar pontes de helpers de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures nativas de contratos de adaptador de runtime de agente para testes de autenticação, entrega, fallback, hook de ferramenta, sobreposição de prompt, schema e projeção de transcrição |
    | `plugin-sdk/channel-test-helpers` | Helpers de teste orientados a canais para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, threading de configuração de envio, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada de casos de erro de resolução de destino para testes de canal |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contrato de pacote de plugin, registro, artefato público, importação direta, API de runtime e efeito colateral de importação |
    | `plugin-sdk/provider-test-contracts` | Helpers de contrato de runtime de provedor, autenticação, descoberta, onboard, catálogo, assistente, capacidade de mídia, política de reprodução, áudio ao vivo de STT em tempo real, busca/captura na web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação Vitest opcionais para testes de provedor que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas de captura de runtime da CLI, contexto de sandbox, escritor de skill, mensagem de agente, evento de sistema, recarregamento de módulo, caminho de plugin empacotado, texto de terminal, fragmentação, token de autenticação e caso tipado |
    | `plugin-sdk/test-node-mocks` | Helpers focados de mock de builtins do Node para uso dentro de fábricas Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície empacotada de helpers memory-core para helpers de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e helpers genéricos de lote/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime core do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação a fornecedor para helpers de runtime core do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação a fornecedor para helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação a fornecedor para helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de memória ativa para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação a fornecedor para helpers de status do host de memória |
  </Accordion>

  <Accordion title="Subcaminhos reservados de helpers empacotados">
    Atualmente, não há subcaminhos SDK reservados de helpers empacotados. Helpers específicos de proprietário
    ficam dentro do pacote do plugin proprietário, enquanto contratos de host reutilizáveis
    usam subcaminhos genéricos do SDK, como `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral do SDK de plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de plugin](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
