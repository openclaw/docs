---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditoria de subcaminhos de plugins incorporados e superfícies auxiliares
summary: 'Catálogo de subcaminhos do SDK de Plugin: quais importações ficam onde, agrupadas por área'
title: Plugin SDK subcaminhos
x-i18n:
    generated_at: "2026-07-01T07:56:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de Plugin é exposto como um conjunto de subcaminhos públicos restritos em
`openclaw/plugin-sdk/`. Esta página cataloga os subcaminhos comumente usados agrupados por
finalidade. O inventário gerado de pontos de entrada do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações do pacote são o subconjunto público
após subtrair os subcaminhos locais de teste/internos do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Mantenedores podem auditar
a contagem de exportações públicas com `pnpm plugin-sdk:surface` e os subcaminhos de
helpers reservados ativos com `pnpm plugins:boundary-report:summary`; exportações de
helpers reservados não usadas falham no relatório de CI em vez de permanecerem no SDK público como
dívida de compatibilidade dormente.

Para o guia de autoria de plugins, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Entrada de Plugin

| Subcaminho                     | Exportações principais                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers de item de provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de item, helpers de redação e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Helpers de migração em runtime, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                              |
| `plugin-sdk/health`            | Registro, detecção, reparo, seleção, severidade e tipos de achados de verificação de integridade do Doctor para consumidores de integridade agrupados                   |

### Helpers de compatibilidade e teste obsoletos

Subcaminhos obsoletos continuam exportados para plugins mais antigos, mas código novo deve usar os
subcaminhos focados do SDK abaixo. A lista mantida é
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; o CI rejeita importações de produção
agrupadas vindas dela. Barrels amplos, como `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod`, são apenas para compatibilidade. Importe `zod`
diretamente de `zod`.

Os subcaminhos de helpers de teste do OpenClaw baseados em Vitest são apenas locais do repositório e não são
mais exportações do pacote: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Subcaminhos reservados de helpers de Plugin agrupado

Esses subcaminhos são superfícies de compatibilidade pertencentes ao plugin para seu Plugin agrupado
proprietário, não APIs gerais do SDK: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Importações de extensão entre proprietários são bloqueadas
por proteções do contrato do pacote.

<AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Auxiliar de validação JSON Schema em cache para esquemas pertencentes a plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, tradutor de configuração, prompts de lista de permissões, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração/portão de ação multiconta, auxiliares de fallback para conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares restritos de lista de contas/ação de conta |
    | `plugin-sdk/access-groups` | Auxiliares de análise de lista de permissões de grupos de acesso e diagnósticos de grupo redigidos |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivos compartilhados de esquema de configuração de canal, além de construtores Zod e JSON/TypeBox diretos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canal OpenClaw incluídos apenas para plugins incluídos mantidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. IDs canônicos de canais de chat incluídos/oficiais, além de rótulos/aliases de formatador para plugins que precisam reconhecer texto com prefixo de envelope sem codificar sua própria tabela. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canais incluídos |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato incluído |
    | `plugin-sdk/command-gating` | Auxiliares restritos de portão de autorização de comando |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidade de entrada de canal de baixo nível. Novos caminhos de recebimento devem usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor experimental de runtime de entrada de canal de alto nível e construtores de fatos de rota para caminhos migrados de recebimento de canal. Prefira isto em vez de montar listas de permissões efetivas, listas de permissões de comandos e projeções legadas em cada plugin. Consulte [API de entrada de canal](/pt-BR/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensagens, além de opções de pipeline de resposta, recibos, visualização ao vivo/streaming, auxiliares de ciclo de vida, identidade de saída, planejamento de payload, envios duráveis e auxiliares de contexto de envio de mensagem. Consulte [API de saída de canal](/pt-BR/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-inbound` para executores de entrada e predicados de despacho, e `plugin-sdk/channel-outbound` para auxiliares de entrega de mensagens. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análise de destino; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída e estado de mídia hospedada |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Auxiliares restritos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de vinculação de thread |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de conversa/vinculação de thread, pareamento e vinculação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo de runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos restritos de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelúdio de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de lista de permissões |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Auxiliares restritos de política de guarda de DM direto pré-criptografia |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidade do Discord para `@openclaw/discord@2026.3.13` publicado e compatibilidade rastreada do proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de conta do Telegram para compatibilidade rastreada do proprietário; novos plugins devem usar auxiliares de runtime injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade do Zalo Personal para pacotes Lark/Zalo publicados que ainda importam autorização de comando de remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Apresentação semântica de mensagens, entrega e auxiliares legados de resposta interativa. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Auxiliares compartilhados de entrada para classificação de eventos, construção de contexto, formatação, raízes, debounce, correspondência de menção, política de menção e registro de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares restritos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares restritos de política de menção, marcador de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade de plugins |
    | `plugin-sdk/channel-route` | Normalização de rota compartilhada, resolução de destino orientada por analisador, conversão de ID de thread em string, chaves de rota deduplicadas/compactas, tipos de destino analisado e auxiliares de comparação de rota/destino |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de destino; chamadores de comparação de rota devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cabeamento de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares restritos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, e tipos de destino secreto |
  </Accordion>

Famílias obsoletas de auxiliares de canal permanecem disponíveis apenas para
compatibilidade com plugins publicados. O plano de remoção é: mantê-las durante
a janela de migração de plugins externos, manter plugins do repositório/incluídos em `channel-inbound` e
`channel-outbound`, depois remover os subcaminhos de compatibilidade na próxima limpeza principal
do SDK. Isso se aplica às famílias antigas de mensagem/runtime de canal, streaming de canal,
acesso por DM direto, fragmento de auxiliar de entrada, opções de resposta
e caminhos de pareamento.

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatível de provedor LM Studio para configuração, descoberta de catálogo e preparação de modelos em runtime |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatível de runtime LM Studio para padrões do servidor local, descoberta de modelos, cabeçalhos de requisição e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedores locais/auto-hospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedores auto-hospedados compatíveis com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes do watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolução de chaves de API em runtime para plugins de provedor |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de provedor, renderização de página de callback, auxiliares de PKCE/estado, análise de entrada de autorização, auxiliares de expiração de token e auxiliares de abortar |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de busca de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importação de autenticação do OpenAI Codex, exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de políticas de replay, auxiliares de endpoint de provedor e auxiliares compartilhados de normalização de IDs de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares de catálogo de modelos de provedor ao vivo para descoberta protegida no estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtragem de IDs de modelo, cache TTL e fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Hook de runtime para ampliação de catálogo de provedor e pontos de integração do registro de plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidade HTTP/endpoint de provedor, erros HTTP de provedor e auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares de contrato estreito de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedor web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares estreitos de configuração/credenciais de web-search para provedores que não precisam de conexão de habilitação de plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares estreitos de contrato de configuração/credenciais de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/runtime de provedor web-search |
    | `plugin-sdk/embedding-providers` | Tipos gerais de provedor de embeddings e auxiliares de leitura, incluindo `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; plugins registram provedores por meio de `api.registerEmbeddingProvider(...)` para impor a propriedade pelo manifesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de esquemas + diagnósticos para DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de snapshots de uso de provedor, auxiliares compartilhados de busca de uso e buscadores de provedor, como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de stream, compatibilidade de chamadas de ferramenta em texto simples e auxiliares compartilhados de wrappers Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartilhados de wrappers de stream de provedor, incluindo `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilitários de stream compatíveis com Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de provedor, como fetch protegido, extração de texto de resultados de ferramentas, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares estreitos de modo de ativação de grupo e análise de comandos |
  </Accordion>

Snapshots de uso de provedor normalmente relatam uma ou mais `windows` de cota,
cada uma com um rótulo, percentual usado e horário opcional de redefinição.
Provedores que expõem texto de saldo ou estado da conta em vez de janelas de
cota redefiníveis devem retornar `summary` com um array `windows` vazio, em vez
de fabricar percentuais. O OpenClaw exibe esse texto de resumo na saída de
status; use `error` somente quando o endpoint de uso falhar ou não retornar
dados de uso utilizáveis.

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos, incluindo formatação dinâmica de menu de argumentos, auxiliares de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovador e de autenticação de ações no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprovação de exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de Gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptadores nativos de aprovação para entrypoints quentes de canal |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de runtime de manipulador de aprovação; prefira os pontos de integração mais estreitos de adaptador/Gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprovação, vinculação de conta, gate de rota, fallback de encaminhamento e supressão de prompt de exec nativo local |
    | `plugin-sdk/approval-reaction-runtime` | Vinculações hardcoded de reações de aprovação, payloads de prompt de reação, armazenamentos de alvos de reação e exportação de compatibilidade para supressão de prompt de exec nativo local |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de exec/plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de payload de aprovação de exec/plugin, auxiliares nativos de roteamento/runtime de aprovação e auxiliares estruturados de exibição de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares estreitos de redefinição de deduplicação de respostas de entrada |
    | `plugin-sdk/channel-contract-testing` | Auxiliares estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação nativa de comando, formatação dinâmica de menu de argumentos e auxiliares nativos de alvo de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canal |
    | `plugin-sdk/command-surface` | Auxiliares de normalização de corpo de comando e de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de coleta de contratos de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares estreitos de tipagem `coerceSecretRef` e SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/secret-provider-integration` | Manifesto somente de tipos de integração de provedor SecretRef e contratos de presets para plugins que publicam presets externos de provedor de segredos |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, controle de DM, arquivos/caminhos limitados à raiz, incluindo gravações somente de criação, substituição atômica síncrona/assíncrona de arquivos, gravações temporárias irmãs, fallback de movimentação entre dispositivos, auxiliares de armazenamento privado de arquivos, proteções de pais de symlink, conteúdo externo, redação de texto sensível, comparação de segredos em tempo constante e auxiliares de coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de allowlist de hosts e política SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares estreitos de dispatcher fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fixado, fetch protegido contra SSRF, erro SSRF e auxiliares de política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de requisição/alvo de Webhook e coerção bruta de websocket/corpo |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho/timeout de corpo de requisição |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de runtime/logging/backup/instalação de Plugin |
    | `plugin-sdk/runtime-env` | Auxiliares restritos de ambiente de runtime, logger, timeout, nova tentativa e backoff |
    | `plugin-sdk/browser-config` | Fachada de configuração de navegador com suporte para perfil/padrões normalizados, análise de URL CDP e auxiliares de autenticação de controle do navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Auxiliares genéricos de ciclo de vida de tarefa e entrega de conclusão para agentes baseados em harness usando um escopo de tarefa emitido pelo host |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar Codex reservado e empacotado para projetar a configuração de servidor MCP do usuário na configuração de thread do Codex; não é para Plugins de terceiros |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar Codex privado e empacotado para espelhamento de tarefa nativa/fiação de runtime; não é para Plugins de terceiros |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e busca de contexto de runtime de canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidade Matrix obsoleta para pacotes de canal de terceiros mais antigos; novos Plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidade Mattermost obsoleta para pacotes de canal de terceiros mais antigos; novos Plugins devem importar subcaminhos genéricos do SDK diretamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação/vinculação preguiçosa de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processo |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação da CLI, espera, versão, invocação por argumento e grupo de comandos preguiçoso |
    | `plugin-sdk/qa-live-transport-scenarios` | IDs compartilhados de cenário de QA de transporte ao vivo, auxiliares de cobertura de linha de base e auxiliar de seleção de cenário |
    | `plugin-sdk/gateway-method-runtime` | Auxiliar reservado de despacho de método do Gateway para rotas HTTP de Plugin que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente do Gateway, auxiliar de início de cliente pronto para loop de eventos, RPC da CLI do gateway, erros de protocolo do gateway e auxiliares de patch de status de canal |
    | `plugin-sdk/config-contracts` | Superfície focada de configuração somente de tipos para formatos de configuração de Plugin, como `OpenClawConfig` e tipos de configuração de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de busca de configuração de Plugin em runtime, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares de mutação transacional de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Strings compartilhadas de dica de metadados de entrega de ferramenta de mensagem |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares de snapshot de configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot de teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comandos do Telegram e verificações de duplicata/conflito, mesmo quando a superfície de contrato empacotada do Telegram está indisponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de texto |
    | `plugin-sdk/approval-reaction-runtime` | Vinculações codificadas de reação de aprovação, payloads de prompt de reação, stores de alvo de reação e exportação de compatibilidade para supressão de prompt de exec nativo local |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de exec/Plugin, construtores de capacidade de aprovação, auxiliares de autenticação/perfil, auxiliares de roteamento/runtime nativos e formatação estruturada de caminho de exibição de aprovação |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime de entrada/resposta, segmentação, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares restritos de despacho/finalização de resposta e rótulo de conversa |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de resposta de janela curta. Novo código de turno de mensagem deve usar `createChannelHistoryWindow`; auxiliares de mapa de nível inferior permanecem apenas como exportações de compatibilidade obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares restritos de segmentação de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de workflow de sessão (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), leituras limitadas de texto de transcrição recente de usuário/assistente por identidade de sessão, auxiliares legados de caminho de store de sessão/chave de sessão, leituras de atualizado-em e auxiliares de compatibilidade de transição apenas para store inteiro/caminho de arquivo |
    | `plugin-sdk/session-transcript-runtime` | Identidade de transcrição, auxiliares com escopo de alvo/leitura/escrita, publicação de atualização, travas de escrita e chaves de acerto de memória de transcrição |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de esquema de agente SQLite, caminho e transação para runtime primário |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de caminho/carregamento/salvamento de store Cron |
    | `plugin-sdk/state-paths` | Auxiliares de caminho de diretório de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado chaveado SQLite sidecar de Plugin mais configuração centralizada de pragma de conexão e manutenção de WAL para bancos de dados pertencentes a Plugin |
    | `plugin-sdk/routing` | Auxiliares de rota/chave de sessão/vinculação de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de runtime e auxiliares de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolvedor de alvo |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs em string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comando temporizado com resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-plugin` | Definir um Plugin simples e tipado de ferramenta de agente e expor metadados estáticos para geração de manifesto |
    | `plugin-sdk/tool-payload` | Extrair payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de alvo de envio de argumentos de ferramenta |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox e auxiliares de comando SSH/OpenShell, incluindo preflight de comando exec com falha rápida |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho de download temporário e workspaces temporários privados seguros |
    | `plugin-sdk/logging-core` | Logger de subsistema e auxiliares de redação |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo e conversão de tabela Markdown |
    | `plugin-sdk/model-session-runtime` | Auxiliares de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolução de configuração de provedor de fala |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/escrita de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Auxiliares de análise JSON que preservam literais inteiros inseguros como strings |
    | `plugin-sdk/file-lock` | Auxiliares de trava de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de desduplicação persistido em disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sessão ACP e despacho de resposta |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares leves de registro de backend ACP e despacho de resposta para Plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vinculação ACP sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivos restritos de esquema de configuração de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivos compartilhados de canal passivo, status e auxiliar de proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta do comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/criação/serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, auxiliares de condução/abortamento de execução ativa, auxiliares de ponte de ferramentas do OpenClaw, auxiliares de política de ferramentas de plano de runtime, classificação de resultado terminal, auxiliares de formatação/detalhamento de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detecção de endpoint pertencente ao provedor Z.AI; use a API pública do Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de trava assíncrona local ao processo para pequenos arquivos de estado de runtime |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de cache de desduplicação em memória |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de drenagem de entregas pendentes de saída |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros de caminho de arquivo local e fonte de mídia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de despertar, evento e visibilidade do Heartbeat |
    | `plugin-sdk/number-runtime` | Auxiliar de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares de token/UUID seguro |
    | `plugin-sdk/system-event-runtime` | Auxiliares de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera de prontidão de transporte |
    | `plugin-sdk/exec-approvals-runtime` | Auxiliares de arquivo de política de aprovação de exec sem o barrel amplo infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos de runtime focados acima |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de flag de diagnóstico, evento e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, auxiliares compartilhados de classificação de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulado, proxy, opção EnvHttpProxyAgent e auxiliares de lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime ciente de dispatcher sem importações de proxy/fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizador de URL de dados de imagem inline e auxiliares de inspeção de assinatura sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vinculação de conversa sem roteamento de vinculação configurado ou stores de pareamento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de store de sessão sem importações amplas de escrita/manutenção de configuração |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de esquema de agente SQLite, caminho e transação sem controles de ciclo de vida de banco de dados |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares restritos de coerção e normalização de registro primitivo/string sem importações de markdown/logging |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuração de nova tentativa e executor de nova tentativa |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/workspace de agente, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartilhados de busca/transformação/armazenamento de mídia, incluindo `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e o obsoleto `fetchRemoteMedia`; prefira os auxiliares de armazenamento antes de leituras de buffer quando uma URL deve se tornar mídia do OpenClaw |
    | `plugin-sdk/media-mime` | Normalização restrita de MIME, mapeamento de extensão de arquivo, detecção de MIME e auxiliares de tipo de mídia |
    | `plugin-sdk/media-store` | Auxiliares restritos de armazenamento de mídia, como `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia, além de exportações de auxiliares voltados a provedores para imagem/áudio/extração estruturada |
    | `plugin-sdk/text-chunking` | Auxiliares de divisão/renderização de texto e markdown, conversão de tabelas markdown, remoção de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de divisão de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de exportações de diretiva, registro, validação, construtor de TTS compatível com OpenAI e auxiliares de fala voltados a provedores |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva, normalização e exportações de auxiliares de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Auxiliar de bootstrap de perfil em tempo real para injeção delimitada de contexto `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real, auxiliares de registro e auxiliares compartilhados de comportamento de voz em tempo real, incluindo rastreamento de atividade de saída |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagem, além de auxiliares de URL de imagem asset/dados e o construtor de provedor de imagem compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, failover, autenticação e auxiliares de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, auxiliares de failover, busca de provedor e análise de ref de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, auxiliares de failover, busca de provedor e análise de ref de modelo |
    | `plugin-sdk/transcripts` | Tipos compartilhados de provedor de fonte de transcrições, auxiliares de registro, descritores de sessão e metadados de enunciado |
    | `plugin-sdk/webhook-targets` | Registro de destino de Webhook e auxiliares de instalação de rota |
    | `plugin-sdk/webhook-path` | Alias de compatibilidade obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexportação de compatibilidade obsoleta; importe `zod` de `zod` diretamente |
    | `plugin-sdk/testing` | Barrel de compatibilidade obsoleto local do repositório para testes legados do OpenClaw. Novos testes do repositório devem importar subcaminhos locais focados, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi` local do repositório para testes unitários de registro direto de Plugin sem importar pontes de auxiliares de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato de adaptador de runtime de agente nativo locais do repositório para testes de autenticação, entrega, fallback, hook de ferramenta, sobreposição de prompt, esquema e projeção de transcrição |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de teste orientados a canal locais do repositório para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, encadeamento de configuração de envio, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada local do repositório de casos de erro de resolução de destino para testes de canal |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locais do repositório para contratos de pacote de Plugin, registro, artefato público, importação direta, API de runtime e efeitos colaterais de importação |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locais do repositório para contratos de runtime de provedor, autenticação, descoberta, onboard, catálogo, assistente, capacidade de mídia, política de replay, STT em tempo real com áudio ao vivo, busca/fetch na web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação Vitest opcionais locais do repositório para testes de provedor que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricos locais do repositório para captura de runtime de CLI, contexto de sandbox, gravador de skill, mensagem de agente, evento de sistema, recarregamento de módulo, caminho de Plugin empacotado, texto de terminal, divisão em partes, token de autenticação e casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares focados locais do repositório para mock de builtins do Node para uso dentro de factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície auxiliar memory-core empacotada para auxiliares de gerente/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-embedding-registry` | Auxiliares leves de registro de provedor de embeddings de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de fundação do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embedding do host de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remotos. `registerMemoryEmbeddingProvider` nesta superfície está obsoleto; use a API genérica de provedor de embedding para novos provedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime de CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares de runtime central do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro de fornecedor para auxiliares de runtime central do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro de fornecedor para auxiliares de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de memória ativa para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subcaminhos reservados de auxiliares empacotados">
    Subcaminhos de SDK de auxiliares empacotados reservados são superfícies restritas específicas de proprietário para
    código de Plugin empacotado. Eles são rastreados no inventário do SDK para que builds de pacote
    e aliasing permaneçam determinísticos, mas não são APIs gerais de autoria de Plugin.
    Novos contratos de host reutilizáveis devem usar subcaminhos genéricos do SDK,
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Subcaminho | Proprietário e finalidade |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar do Plugin Codex empacotado para projetar a configuração de servidor MCP do usuário na configuração de thread do servidor de app Codex |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar do Plugin Codex empacotado para espelhar subagentes nativos do servidor de app Codex no estado de tarefa do OpenClaw |

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)
- [Configuração do Plugin SDK](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
