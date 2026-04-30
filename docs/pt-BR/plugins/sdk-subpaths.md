---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditoria de subcaminhos de Plugins incluídos e superfícies auxiliares
summary: 'Catálogo de subcaminhos do SDK de Plugin: quais importações ficam onde, agrupadas por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-04-30T10:02:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  O SDK de plugins é exposto como um conjunto de subcaminhos restritos em `openclaw/plugin-sdk/`.
  Esta página cataloga os subcaminhos comumente usados, agrupados por finalidade. A lista
  completa gerada com mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`;
  os subcaminhos auxiliares reservados de plugins agrupados aparecem ali, mas são detalhe de
  implementação, a menos que uma página de documentação os promova explicitamente. Mantenedores podem auditar
  subcaminhos auxiliares reservados ativos com `pnpm plugins:boundary-report:summary`; exportações
  auxiliares reservadas não usadas falham no relatório de CI em vez de permanecerem no SDK público
  como dívida de compatibilidade dormente.

  Para o guia de criação de plugins, consulte [Visão geral do SDK de Plugins](/pt-BR/plugins/sdk-overview).

  ## Entrada de Plugin

  | Subcaminho                                | Principais exportações                                                                                                                                                       |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel amplo de compatibilidade para testes de plugins legados; prefira subcaminhos de teste focados para novos testes de extensões                                          |
  | `plugin-sdk/plugin-test-api`              | Criador mínimo de mock de `OpenClawPluginApi` para testes unitários de registro direto de plugins                                                                            |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato do adaptador nativo de runtime de agente para perfis de autenticação, supressão de entrega, classificação de fallback, hooks de ferramentas, sobreposições de prompt, esquemas e reparo de transcrição |
  | `plugin-sdk/channel-test-helpers`         | Auxiliares de teste para ciclo de vida de conta de canal, diretório, configuração de envio, mock de runtime, hook, entrada de canal agrupado, timestamp de envelope, resposta de pareamento e contrato genérico de canal |
  | `plugin-sdk/channel-target-testing`       | Suíte compartilhada de testes de casos de erro de resolução de destino de canal                                                                                              |
  | `plugin-sdk/plugin-test-contracts`        | Auxiliares de contrato para registro de Plugin, manifesto de pacote, artefato público, API de runtime, efeito colateral de importação e importação direta                    |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures de runtime de Plugin, registro, registro de provedor, assistente de configuração e fluxo de tarefas de runtime para testes                                         |
  | `plugin-sdk/provider-test-contracts`      | Auxiliares de contrato para runtime de provedor, autenticação, descoberta, onboard, catálogo, capacidade de mídia, política de repetição, áudio ao vivo de STT em tempo real, pesquisa/busca web e assistente |
  | `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/autenticação opcionais do Vitest para testes de provedor que exercitam `plugin-sdk/provider-http`                                                                 |
  | `plugin-sdk/test-env`                     | Fixtures de ambiente de teste, fetch/rede, servidor HTTP descartável, requisição de entrada, teste ao vivo, sistema de arquivos temporário e controle de tempo              |
  | `plugin-sdk/test-fixtures`                | Fixtures genéricas de teste para CLI, sandbox, skill, mensagem de agente, evento do sistema, recarregamento de módulo, caminho de Plugin agrupado, terminal, fragmentação, token de autenticação e caso tipado |
  | `plugin-sdk/test-node-mocks`              | Auxiliares focados de mock de componentes internos do Node para uso dentro de fábricas `vi.mock("node:*")` do Vitest                                                        |
  | `plugin-sdk/migration`                    | Auxiliares de itens de provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de item, auxiliares de redação e `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`            | Auxiliares de migração em runtime, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                |

  <AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, prompts de allowlist, criadores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração multi-conta/gate de ação, auxiliares de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares restritos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivos compartilhados de esquema de configuração de canal e criador genérico |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canais agrupados do OpenClaw apenas para plugins agrupados mantidos |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canais agrupados |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato agrupado |
    | `plugin-sdk/command-gating` | Auxiliares restritos de gate de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, auxiliares de ciclo de vida/finalização de fluxo de rascunho |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + criação de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares compartilhados de registro e despacho de entrada |
    | `plugin-sdk/messaging-targets` | Auxiliares de análise/correspondência de destinos |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-send-deps` | Busca leve de dependências de envio de saída para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Auxiliares de entrega de saída, identidade, delegado de envio, sessão, formatação e planejamento de payload |
    | `plugin-sdk/poll-runtime` | Auxiliares restritos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de associação de thread |
    | `plugin-sdk/agent-media-payload` | Criador legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de conversa/associação de thread, pareamento e associação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos restritos de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de escrita de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelude de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de allowlist |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Auxiliares compartilhados de autenticação/guarda de DM direta |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidade do Discord para `@openclaw/discord@2026.3.13` publicado e compatibilidade rastreada do proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de conta do Telegram para compatibilidade rastreada do proprietário; novos plugins devem usar auxiliares de runtime injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade do Zalo Personal para pacotes Lark/Zalo publicados que ainda importam autorização de comando do remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Auxiliares semânticos de apresentação de mensagem, entrega e resposta interativa legada. Consulte [Apresentação de Mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce de entrada, correspondência de menção, auxiliares de política de menção e auxiliares de envelope |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares restritos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares restritos de política de menção, marcador de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope` | Auxiliares restritos de formatação de envelope de entrada |
    | `plugin-sdk/channel-location` | Auxiliares de contexto de localização de canal e formatação |
    | `plugin-sdk/channel-logging` | Auxiliares de logging de canal para descartes de entrada e falhas de digitação/confirmação |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ações de mensagem de canal, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade de plugins |
    | `plugin-sdk/channel-route` | Auxiliares compartilhados de normalização de rota, resolução de destino orientada por parser, stringificação de ID de thread, chaves de rota de desduplicação/compactação, tipos de destino analisado e comparação de rota/destino |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de destino; chamadores de comparação de rota devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cabeamento de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares restritos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatível do provedor LM Studio para configuração, descoberta de catálogo e preparação de modelo em runtime |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatível de runtime do LM Studio para padrões de servidor local, descoberta de modelos, cabeçalhos de solicitação e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedor local/auto-hospedado |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedor auto-hospedado compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolução de chave de API em runtime para plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de integração/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Auxiliares compartilhados de login interativo para plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Auxiliares de busca de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares de normalização de ID de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook de runtime de ampliação de catálogo de provedor e seams de registro de plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidade HTTP/endpoint de provedor, erros HTTP de provedor e auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares de contrato restrito de configuração/seleção de busca na web, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedor de busca na web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares de configuração/credenciais de busca na web restritos para provedores que não precisam de fiação de habilitação de plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato restrito de configuração/credenciais de busca na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/runtime de provedor de busca na web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de esquema Gemini + diagnósticos e auxiliares de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de provedor, como fetch protegido, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de integração |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares restritos de modo de ativação de grupo e análise de comandos |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos, incluindo formatação dinâmica de menu de argumentos, auxiliares de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovador e autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprovação de exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptador de aprovação nativo para pontos de entrada quentes de canais |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de runtime de manipulador de aprovação; prefira os seams mais restritos de adaptador/gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares de destino de aprovação nativa + vinculação de conta |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de exec/plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de payload de aprovação de exec/plugin, auxiliares de roteamento/runtime de aprovação nativa e auxiliares estruturados de exibição de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares restritos de redefinição de deduplicação de respostas recebidas |
    | `plugin-sdk/channel-contract-testing` | Auxiliares restritos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação de comando nativa, formatação dinâmica de menu de argumentos e auxiliares nativos de destino de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canais |
    | `plugin-sdk/command-surface` | Normalização de corpo de comando e auxiliares de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares restritos de coleta de contratos de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares restritos de tipagem `coerceSecretRef` e SecretRef para análise de contrato/configuração de segredos |
    | `plugin-sdk/security-runtime` | Confiança compartilhada, controle de DMs, conteúdo externo, redação de texto sensível, comparação de segredos em tempo constante e auxiliares de coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de política SSRF para lista de hosts permitidos e rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares restritos de dispatcher fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fixado, fetch protegido contra SSRF, erro SSRF e auxiliares de política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitação/destino de Webhook e coerção de websocket/corpo bruto |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho/timeout do corpo da solicitação |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime, logging, backup e instalação de Plugin |
    | `plugin-sdk/runtime-env` | Helpers restritos de ambiente de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facade de configuração de navegador compatível para perfil/padrões normalizados, análise de URL CDP e helpers de autenticação de controle do navegador |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e consulta de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Helpers de importação/vinculação lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação da CLI, espera, versão, invocação por argumentos e grupo de comandos lazy |
    | `plugin-sdk/gateway-runtime` | Cliente do Gateway, helper de início de cliente pronto para loop de eventos, RPC da CLI do Gateway, erros de protocolo do Gateway e helpers de patch de status de canal |
    | `plugin-sdk/config-types` | Superfície de configuração somente de tipos para formatos de configuração de Plugin, como `OpenClawConfig`, e tipos de configuração de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Helpers de consulta de configuração de Plugin em runtime, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers de mutação transacional de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers de snapshot de configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot de teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram incluído não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de exec/Plugin, builders de capability de aprovação, helpers de autenticação/perfil, helpers de roteamento/runtime nativo e formatação estruturada de caminho de exibição de aprovação |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, fragmentação, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers restritos de despacho/finalização de resposta e rótulo de conversa |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico de respostas em janela curta e marcadores como `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers restritos de fragmentação de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho de armazenamento de sessão, chave de sessão, atualizado-em e mutação de armazenamento |
    | `plugin-sdk/cron-store-runtime` | Helpers de caminho/carregamento/salvamento de armazenamento de Cron |
    | `plugin-sdk/state-paths` | Helpers de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de rota/chave de sessão/vinculação de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolução de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs de string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comandos temporizado com resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrair payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de destino de envio de args de ferramenta |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho de download temporário |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema e redação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo e conversão de tabela Markdown |
    | `plugin-sdk/model-session-runtime` | Helpers de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de resolução de configuração de provedor de fala |
    | `plugin-sdk/json-store` | Pequenos helpers de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de lock de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de deduplicação respaldado por disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão e despacho de resposta ACP |
    | `plugin-sdk/acp-runtime-backend` | Helpers leves de registro de backend ACP e despacho de resposta para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução de vinculação ACP somente leitura sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivos restritos de schema de configuração de runtime do agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivos compartilhados de helpers de canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta de comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Helpers de registro/build/serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, helpers de direcionamento/aborto de execução ativa, helpers de bridge de ferramentas OpenClaw, helpers de política de ferramentas de plano de runtime, classificação de resultado de terminal, helpers de formatação/detalhamento de progresso de ferramentas e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de lock assíncrono local ao processo para pequenos arquivos de estado de runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Helpers de cache de deduplicação em memória |
    | `plugin-sdk/delivery-queue-runtime` | Helper de drenagem de entrega pendente de saída |
    | `plugin-sdk/file-access-runtime` | Helpers seguros de caminho de arquivo local e origem de mídia |
    | `plugin-sdk/heartbeat-runtime` | Helpers de evento e visibilidade de Heartbeat |
    | `plugin-sdk/number-runtime` | Helper de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Helpers de token/UUID seguro |
    | `plugin-sdk/system-event-runtime` | Helpers de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper de espera de prontidão de transporte |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos de runtime focados acima |
    | `plugin-sdk/collection-runtime` | Pequenos helpers de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag diagnóstica, evento e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Helpers de grafo de erros, formatação, classificação compartilhada de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulado, proxy, opção EnvHttpProxyAgent e helpers de lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime ciente de dispatcher sem importações de proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado de vinculação da conversa atual sem roteamento de vinculação configurado nem armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão sem importações amplas de gravações/manutenção de configuração |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Helpers restritos de coerção e normalização de registro/string primitivos sem importações de markdown/logging |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuração de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identidade/workspace de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e teste">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de busca/transformação/armazenamento de mídia, sondagem de dimensões de vídeo baseada em ffprobe e construtores de payloads de mídia |
    | `plugin-sdk/media-store` | Helpers específicos de armazenamento de mídia, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedores de compreensão de mídia, além de exportações de helpers de imagem/áudio voltadas a provedores |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/markdown/logging, como remoção de texto visível para assistente, helpers de renderização/fragmentação/tabelas de markdown, helpers de redação, helpers de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentação de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedores de fala, além de exportações voltadas a provedores para diretivas, registro, validação, construtor de TTS compatível com OpenAI e helpers de fala |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedores de fala, registro, diretiva, normalização e exportações de helpers de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedores de transcrição em tempo real, helpers de registro e helper compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provedores de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provedores de geração de imagens, além de helpers de asset de imagem/URL de dados e o construtor de provedor de imagens compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagens, failover, autenticação e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedores/solicitações/resultados de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, busca de provedor e análise de referência de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedores/solicitações/resultados de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, busca de provedor e análise de referência de modelo |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook e helpers de instalação de rotas |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de Webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do SDK de Plugin |
    | `plugin-sdk/testing` | Barrel amplo de compatibilidade para testes de Plugins legados. Novos testes de extensões devem importar subcaminhos focados do SDK, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo `createTestPluginApi` para testes unitários de registro direto de Plugin sem importar pontes de helpers de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures nativas de contrato de adaptador de agent-runtime para testes de autenticação, entrega, fallback, hook de ferramenta, overlay de prompt, esquema e projeção de transcrição |
    | `plugin-sdk/channel-test-helpers` | Helpers de teste orientados a canais para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, encadeamento de configuração de envio, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada de casos de erro de resolução de destino para testes de canal |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contrato de pacote de Plugin, registro, artefato público, importação direta, API de runtime e efeitos colaterais de importação |
    | `plugin-sdk/provider-test-contracts` | Helpers de contrato de runtime de provedor, autenticação, descoberta, integração, catálogo, assistente, capacidade de mídia, política de replay, STT de áudio ao vivo em tempo real, busca/busca na web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação opt-in do Vitest para testes de provedor que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas de captura de runtime de CLI, contexto de sandbox, gravador de skill, mensagem de agente, evento de sistema, recarregamento de módulo, caminho de Plugin empacotado, texto de terminal, fragmentação, token de autenticação e caso tipado |
    | `plugin-sdk/test-node-mocks` | Helpers focados de mock de builtins do Node para uso dentro de factories `vi.mock("node:*")` do Vitest |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície empacotada de helpers de memory-core para helpers de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de fundação do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e helpers genéricos de lote/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime principal do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro de fornecedor para helpers de runtime principal do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro de fornecedor para helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro de fornecedor para helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de markdown gerenciado para Plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de memória ativa para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro de fornecedor para helpers de status do host de memória |
  </Accordion>

  <Accordion title="Subcaminhos reservados de helpers empacotados">
    Atualmente não há subcaminhos reservados do SDK para helpers empacotados. Helpers específicos de proprietário
    ficam dentro do pacote de Plugin proprietário, enquanto contratos reutilizáveis de host
    usam subcaminhos genéricos do SDK, como `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
