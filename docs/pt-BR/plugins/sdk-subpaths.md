---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditando subcaminhos de Plugins agrupados e superfícies auxiliares
summary: 'Catálogo de subcaminhos do Plugin SDK: quais imports ficam onde, agrupados por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-07-01T12:53:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de Plugin é exposto como um conjunto de subcaminhos públicos estreitos sob
`openclaw/plugin-sdk/`. Esta página cataloga os subcaminhos usados com frequência, agrupados por
finalidade. O inventário gerado de entrypoints do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações do pacote são o subconjunto público
após subtrair os subcaminhos internos/de teste locais do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Mantenedores podem auditar
a contagem de exportações públicas com `pnpm plugin-sdk:surface` e os subcaminhos ativos de
helpers reservados com `pnpm plugins:boundary-report:summary`; exportações não usadas de
helpers reservados fazem o relatório de CI falhar em vez de permanecerem no SDK público como
dívida de compatibilidade dormente.

Para o guia de criação de Plugin, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Entrada de Plugin

| Subcaminho                     | Exportações principais                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers de itens do provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de item, helpers de redação e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Helpers de migração em runtime, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                              |
| `plugin-sdk/health`            | Registro, detecção, reparo, seleção, severidade e tipos de achados de verificação de integridade do Doctor para consumidores de integridade incluídos                    |

### Compatibilidade obsoleta e helpers de teste

Subcaminhos obsoletos continuam exportados para plugins mais antigos, mas código novo deve usar os
subcaminhos focados do SDK abaixo. A lista mantida é
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; o CI rejeita importações de produção
incluídas a partir dela. Barrels amplos como `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod` são apenas para compatibilidade. Importe `zod`
diretamente de `zod`.

Os subcaminhos de helpers de teste do OpenClaw baseados em Vitest são apenas locais ao repositório e não são
mais exportações do pacote: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Subcaminhos reservados de helpers de Plugin incluído

Estes subcaminhos são superfícies de compatibilidade pertencentes ao Plugin para seu Plugin incluído
proprietário, não APIs gerais do SDK: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Importações de extensões entre proprietários são bloqueadas
pelas salvaguardas de contrato do pacote.

<AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Auxiliar em cache para validação de JSON Schema para esquemas pertencentes a plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, tradutor de configuração, prompts de lista de permissões, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração/porta de ação multi-conta, auxiliares de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Consulta de conta + auxiliares de fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares específicos de lista de contas/ação de conta |
    | `plugin-sdk/access-groups` | Auxiliares de análise de lista de permissões de grupo de acesso e diagnósticos editados de grupo |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartilhadas de esquema de configuração de canal, além de construtores Zod e JSON/TypeBox diretos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canais OpenClaw empacotados apenas para plugins empacotados mantidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. IDs canônicos de canais de chat empacotados/oficiais, além de rótulos/aliases de formatador para plugins que precisam reconhecer texto com prefixo de envelope sem codificar a própria tabela. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canais empacotados |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato empacotado |
    | `plugin-sdk/command-gating` | Auxiliares específicos de porta de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidade de entrada de canal de baixo nível. Novos caminhos de recebimento devem usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor experimental de runtime de entrada de canal de alto nível e construtores de fatos de rota para caminhos migrados de recebimento de canal. Prefira isto a montar listas de permissões efetivas, listas de permissões de comandos e projeções legadas em cada plugin. Consulte [API de entrada de canal](/pt-BR/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensagens, além de opções de pipeline de resposta, recibos, pré-visualização/transmissão ao vivo, auxiliares de ciclo de vida, identidade de saída, planejamento de payload, envios duráveis e auxiliares de contexto de envio de mensagem. Consulte [API de saída de canal](/pt-BR/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-inbound` para executores de entrada e predicados de despacho, e `plugin-sdk/channel-outbound` para auxiliares de entrega de mensagens. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análise de destino; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída e estado de mídia hospedada |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Auxiliares específicos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de vinculação de thread |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de conversa/vinculação de thread, pareamento e vinculação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelúdio de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de lista de permissões |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso de grupo |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Auxiliares específicos de política de guarda de DM direto pré-criptografia |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidade do Discord para o `@openclaw/discord@2026.3.13` publicado e compatibilidade rastreada do proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de contas do Telegram para compatibilidade rastreada do proprietário; novos plugins devem usar auxiliares de runtime injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade do Zalo Personal para pacotes Lark/Zalo publicados que ainda importam autorização de comando do remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Apresentação, entrega e auxiliares legados de resposta interativa de mensagens semânticas. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Auxiliares compartilhados de entrada para classificação de eventos, construção de contexto, formatação, raízes, debounce, correspondência de menção, política de menção e logs de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares específicos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares específicos de política de menção, marcador de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade de plugins |
    | `plugin-sdk/channel-route` | Normalização de rotas compartilhada, resolução de destino orientada por parser, conversão de ID de thread em string, chaves de rota deduplicadas/compactas, tipos de destino analisado e auxiliares de comparação de rota/destino |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de destino; chamadores de comparação de rotas devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexão de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares específicos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino secreto |
  </Accordion>

Famílias obsoletas de auxiliares de canal continuam disponíveis apenas para
compatibilidade de plugins publicados. O plano de remoção é: mantê-las durante
a janela de migração de plugins externos, manter plugins do repositório/empacotados
em `channel-inbound` e `channel-outbound`, depois remover os subcaminhos de
compatibilidade na próxima grande limpeza do SDK. Isso se aplica às antigas
famílias de mensagem/runtime de canal, streaming de canal, acesso de DM direto,
fragmento de auxiliares de entrada, opções de resposta e caminhos de pareamento.

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de provedor LM Studio compatível para configuração, descoberta de catálogo e preparação de modelo em runtime |
    | `plugin-sdk/lmstudio-runtime` | Fachada de runtime LM Studio compatível para padrões do servidor local, descoberta de modelos, cabeçalhos de requisição e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedores locais/auto-hospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedores auto-hospedados compatíveis com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões do backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolução de chaves de API em runtime para Plugins de provedor |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de provedor, renderização de página de callback, auxiliares de PKCE/estado, análise de entrada de autorização, auxiliares de expiração de token e auxiliares de cancelamento |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de busca de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importação de autenticação do OpenAI Codex, exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares compartilhados de normalização de ID de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares de catálogo de modelos de provedores ao vivo para descoberta protegida no estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtragem de ID de modelo, cache TTL e fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Hook de runtime para aumento de catálogo de provedor e pontos de integração de registro de Plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de HTTP/capacidade de endpoint de provedor, erros HTTP de provedor e auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares estreitos de contrato de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedor de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares estreitos de configuração/credenciais de web-search para provedores que não precisam de fiação de ativação de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares estreitos de contrato de configuração/credenciais de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/runtime de provedor de web-search |
    | `plugin-sdk/embedding-providers` | Tipos gerais de provedores de embeddings e auxiliares de leitura, incluindo `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; Plugins registram provedores por meio de `api.registerEmbeddingProvider(...)` para que a propriedade pelo manifesto seja aplicada |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de esquema + diagnósticos para DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de snapshots de uso de provedor, auxiliares compartilhados de busca de uso e buscadores de provedor, como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de stream, compatibilidade de chamadas de ferramenta em texto puro e auxiliares compartilhados de wrappers para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartilhados de wrappers de stream de provedor, incluindo `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilitários de stream compatíveis com Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares nativos de transporte de provedor, como fetch protegido, extração de texto de resultado de ferramenta, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares estreitos de modo de ativação de grupo e análise de comandos |
  </Accordion>

Snapshots de uso de provedor normalmente relatam uma ou mais `windows` de cota, cada uma com
um rótulo, percentual usado e horário opcional de redefinição. Provedores que expõem texto de saldo ou
estado da conta em vez de janelas de cota redefiníveis devem retornar
`summary` com um array `windows` vazio, em vez de fabricar percentuais.
O OpenClaw exibe esse texto de resumo na saída de status; use `error` apenas quando o
endpoint de uso falhar ou não retornar nenhum dado de uso aproveitável.

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos incluindo formatação dinâmica de menu de argumentos, auxiliares de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovador e de autenticação de ações no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares nativos de perfil/filtro de aprovação de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de Gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptador nativo de aprovação para pontos de entrada de canais quentes |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de runtime de manipulador de aprovação; prefira os pontos de integração mais estreitos de adaptador/Gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprovação, vinculação de conta, bloqueio de rota, fallback de encaminhamento e supressão de prompt nativo local de exec |
    | `plugin-sdk/approval-reaction-runtime` | Vinculações codificadas de reações de aprovação, payloads de prompt de reação, armazenamentos de destinos de reação e exportação de compatibilidade para supressão de prompt nativo local de exec |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de exec/Plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de payload de aprovação de exec/Plugin, auxiliares nativos de roteamento/runtime de aprovação e auxiliares estruturados de exibição de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares estreitos de redefinição de deduplicação de respostas de entrada |
    | `plugin-sdk/channel-contract-testing` | Auxiliares estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação nativa de comandos, formatação dinâmica de menu de argumentos e auxiliares nativos de destino de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canal |
    | `plugin-sdk/command-surface` | Normalização de corpo de comando e auxiliares de superfície de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de coleta de contrato de segredo para superfícies de segredo de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares estreitos de `coerceSecretRef` e tipagem SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/secret-provider-integration` | Contratos somente de tipo para manifesto de integração de provedor SecretRef e predefinições para Plugins que publicam predefinições externas de provedor de segredo |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, bloqueio de DMs, arquivos/caminhos limitados à raiz, incluindo gravações somente de criação, substituição atômica síncrona/assíncrona de arquivos, gravações temporárias irmãs, fallback de movimentação entre dispositivos, auxiliares privados de armazenamento de arquivos, proteções de pais de symlink, conteúdo externo, redação de texto sensível, comparação de segredos em tempo constante e auxiliares de coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de lista de permissão de hosts e política SSRF para redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares estreitos de dispatcher fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fixado, fetch protegido contra SSRF, erro SSRF e auxiliares de política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de requisição/destino de Webhook e coerção bruta de websocket/corpo |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho/tempo limite de corpo de requisição |
  </Accordion>

  <Accordion title="Subcaminhos de tempo de execução e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de tempo de execução/logging/backup/instalação de Plugin |
    | `plugin-sdk/runtime-env` | Auxiliares restritos de ambiente de tempo de execução, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Fachada de configuração de navegador compatível para perfil/padrões normalizados, análise de URL CDP e auxiliares de autenticação de controle do navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Auxiliares genéricos de ciclo de vida de tarefas e entrega de conclusão para agentes baseados em harness usando um escopo de tarefa emitido pelo host |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar Codex empacotado reservado para projetar a configuração de servidor MCP do usuário na configuração de thread do Codex; não é destinado a plugins de terceiros |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar Codex empacotado privado para espelhamento de tarefa nativa/cabeamento de tempo de execução; não é destinado a plugins de terceiros |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e consulta de contexto de tempo de execução de canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidade Matrix obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidade Mattermost obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar subcaminhos genéricos do SDK diretamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comandos/hooks/http/interativos de Plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação/vinculação preguiçosa de tempo de execução, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processo |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação, espera, versão, invocação por argumentos e grupos de comandos preguiçosos da CLI |
    | `plugin-sdk/qa-live-transport-scenarios` | IDs compartilhados de cenários de QA de transporte ao vivo, auxiliares de cobertura de linha de base e auxiliar de seleção de cenário |
    | `plugin-sdk/gateway-method-runtime` | Auxiliar reservado de despacho de método Gateway para rotas HTTP de Plugin que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente Gateway, auxiliar de inicialização de cliente pronto para loop de eventos, RPC de CLI do Gateway, erros de protocolo do Gateway, resolução de host LAN anunciado e auxiliares de patch de status de canal |
    | `plugin-sdk/config-contracts` | Superfície focada de configuração somente de tipos para formatos de configuração de Plugin, como `OpenClawConfig` e tipos de configuração de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de consulta de configuração de Plugin em tempo de execução, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares transacionais de mutação de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Strings compartilhadas de dicas de metadados de entrega de ferramenta de mensagem |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares de snapshot de configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot de teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comandos do Telegram e verificações de duplicatas/conflitos, mesmo quando a superfície de contrato empacotada do Telegram está indisponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência a arquivo sem o barrel amplo de texto |
    | `plugin-sdk/approval-reaction-runtime` | Vinculações fixas de reação de aprovação, payloads de prompt de reação, stores de alvo de reação e exportação de compatibilidade para supressão de prompt de execução nativa local |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de exec/Plugin, construtores de capacidade de aprovação, auxiliares de autenticação/perfil, auxiliares de roteamento/tempo de execução nativos e formatação estruturada de caminho de exibição de aprovação |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de entrada/resposta em tempo de execução, divisão em blocos, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares restritos de despacho/finalização de resposta e rótulos de conversa |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de respostas de janela curta. Novo código de turno de mensagem deve usar `createChannelHistoryWindow`; auxiliares de mapa de nível mais baixo permanecem apenas como exportações de compatibilidade obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares restritos de divisão de texto/markdown em blocos |
    | `plugin-sdk/session-store-runtime` | Auxiliares de workflow de sessão (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), leituras limitadas de texto recente de transcrição de usuário/assistente por identidade de sessão, auxiliares legados de caminho/chave de sessão do store de sessões, leituras de updated-at e auxiliares de compatibilidade somente de transição para store inteiro/caminho de arquivo |
    | `plugin-sdk/session-transcript-runtime` | Identidade de transcrição, auxiliares de alvo/leitura/gravação com escopo, publicação de atualizações, locks de gravação e chaves de acerto de memória de transcrição |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de esquema de agente SQLite, caminho e transação para tempo de execução primário |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de caminho/carregamento/salvamento do store de Cron |
    | `plugin-sdk/state-paths` | Auxiliares de caminho de diretório de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado chaveado SQLite em sidecar de Plugin, mais configuração centralizada de pragma de conexão e manutenção WAL para bancos de dados pertencentes a plugins |
    | `plugin-sdk/routing` | Auxiliares de rota/chave de sessão/vinculação de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de tempo de execução e auxiliares de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolução de alvo |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs em string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comandos com tempo limite e resultados stdout/stderr normalizados |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-plugin` | Definir um Plugin simples e tipado de ferramenta de agente e expor metadados estáticos para geração de manifesto |
    | `plugin-sdk/tool-payload` | Extrair payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de alvo de envio de argumentos de ferramenta |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox e auxiliares de comando SSH/OpenShell, incluindo preflight de comando exec com falha rápida |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho de download temporário e workspaces temporários seguros privados |
    | `plugin-sdk/logging-core` | Logger de subsistema e auxiliares de redação |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo de tabela Markdown e conversão |
    | `plugin-sdk/model-session-runtime` | Auxiliares de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolução de configuração de provedor Talk |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/gravação de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Auxiliares de análise JSON que preservam literais inteiros inseguros como strings |
    | `plugin-sdk/file-lock` | Auxiliares de file-lock reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de desduplicação com persistência em disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de tempo de execução/sessão ACP e despacho de resposta |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares leves de registro de backend ACP e despacho de resposta para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vinculação ACP sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas restritas de esquema de configuração de tempo de execução de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivas compartilhadas de canal passivo, status e auxiliar de proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta de comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/construção/serialização de comando nativo |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, auxiliares de condução/abort de execução ativa, auxiliares de ponte de ferramenta do OpenClaw, auxiliares de política de ferramenta de plano de tempo de execução, classificação de resultado terminal, auxiliares de formatação/detalhe de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detecção de endpoint pertencente ao provedor Z.AI; use a API pública do Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de lock assíncrono local ao processo para pequenos arquivos de estado de tempo de execução |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concorrência limitada de tarefa assíncrona |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de cache de desduplicação em memória |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de drenagem de entrega pendente de saída |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros de caminho de arquivo local e fonte de mídia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de despertar, evento e visibilidade de Heartbeat |
    | `plugin-sdk/number-runtime` | Auxiliar de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares de token/UUID seguro |
    | `plugin-sdk/system-event-runtime` | Auxiliares de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera por prontidão de transporte |
    | `plugin-sdk/exec-approvals-runtime` | Auxiliares de arquivo de política de aprovação de exec sem o barrel amplo infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos focados de tempo de execução acima |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de flag de diagnóstico, evento e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, auxiliares compartilhados de classificação de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulado, proxy, opção EnvHttpProxyAgent e auxiliares de lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de tempo de execução ciente de dispatcher sem importações de proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizador de URL de dados de imagem inline e auxiliares de detecção de assinatura sem a superfície ampla de tempo de execução de mídia |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de tempo de execução de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vinculação de conversa sem roteamento de vinculação configurado ou stores de pareamento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de store de sessão sem importações amplas de gravação/manutenção de configuração |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de esquema de agente SQLite, caminho e transação sem controles de ciclo de vida de banco de dados |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares restritos de coerção e normalização de registro primitivo/string sem importações de markdown/logging |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuração de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/workspace de agente, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de recursos e testes">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartilhados de busca/transformação/armazenamento de mídia, incluindo `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e o obsoleto `fetchRemoteMedia`; prefira auxiliares de armazenamento antes de leituras de buffer quando uma URL deve se tornar mídia do OpenClaw |
    | `plugin-sdk/media-mime` | Normalização restrita de MIME, mapeamento de extensões de arquivo, detecção de MIME e auxiliares de tipo de mídia |
    | `plugin-sdk/media-store` | Auxiliares restritos de armazenamento de mídia, como `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedores de compreensão de mídia mais exportações de auxiliares voltados a provedores para imagem/áudio/extração estruturada |
    | `plugin-sdk/text-chunking` | Auxiliares de divisão/renderização de texto e markdown, conversão de tabelas markdown, remoção de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de divisão de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedores de fala mais exportações de auxiliares voltados a provedores para diretiva, registro, validação, construtor TTS compatível com OpenAI e fala |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedores de fala, registro, diretiva, normalização e exportações de auxiliares de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedores de transcrição em tempo real, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Auxiliar de bootstrap de perfil em tempo real para injeção limitada de contexto `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de provedores de voz em tempo real, auxiliares de registro e auxiliares compartilhados de comportamento de voz em tempo real, incluindo rastreamento de atividade de saída |
    | `plugin-sdk/image-generation` | Tipos de provedores de geração de imagem mais auxiliares de URL de dados/asset de imagem e o construtor de provedor de imagem compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, failover, autenticação e auxiliares de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, auxiliares de failover, busca de provedor e análise de ref de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, auxiliares de failover, busca de provedor e análise de ref de modelo |
    | `plugin-sdk/transcripts` | Tipos compartilhados de provedores de fonte de transcrições, auxiliares de registro, descritores de sessão e metadados de enunciado |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook e auxiliares de instalação de rotas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidade obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexportação de compatibilidade obsoleta; importe `zod` diretamente de `zod` |
    | `plugin-sdk/testing` | Barrel de compatibilidade obsoleto local do repositório para testes legados do OpenClaw. Novos testes do repositório devem importar subcaminhos locais focados, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi` local do repositório para testes unitários diretos de registro de Plugin sem importar pontes de auxiliares de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures locais do repositório de contratos do adaptador nativo de runtime de agente para testes de autenticação, entrega, fallback, hook de ferramenta, sobreposição de prompt, esquema e projeção de transcrição |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de teste locais do repositório voltados a canais para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, encadeamento de configuração de envio, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada local do repositório de casos de erro de resolução de destino para testes de canal |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locais do repositório de contratos de pacote de Plugin, registro, artefato público, importação direta, API de runtime e efeitos colaterais de importação |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locais do repositório de contratos de runtime de provedor, autenticação, descoberta, onboard, catálogo, assistente, recurso de mídia, política de replay, STT de áudio ao vivo em tempo real, pesquisa/busca na web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação Vitest opt-in locais do repositório para testes de provedor que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas locais do repositório para captura de runtime da CLI, contexto de sandbox, gravador de Skills, mensagem de agente, evento do sistema, recarregamento de módulo, caminho de Plugin empacotado, texto de terminal, divisão em partes, token de autenticação e casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares focados locais do repositório de mocks de builtins do Node para uso dentro de factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície empacotada de auxiliares memory-core para auxiliares de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-embedding-registry` | Auxiliares leves de registro de provedores de embeddings de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remoto. `registerMemoryEmbeddingProvider` nesta superfície está obsoleto; use a API genérica de provedores de embeddings para novos provedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime da CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares de runtime central do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro de fornecedor para auxiliares de runtime central do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro de fornecedor para auxiliares de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subcaminhos reservados de auxiliares empacotados">
    Subcaminhos SDK reservados de auxiliares empacotados são superfícies restritas específicas do proprietário para
    código de Plugin empacotado. Eles são rastreados no inventário do SDK para que builds de pacote
    e aliasing permaneçam determinísticos, mas não são APIs gerais de
    criação de plugins. Novos contratos reutilizáveis de host devem usar subcaminhos genéricos do SDK
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Subcaminho | Proprietário e finalidade |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar do Plugin Codex empacotado para projetar a configuração de servidor MCP do usuário na configuração de thread do servidor de apps Codex |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar do Plugin Codex empacotado para espelhar subagentes nativos do servidor de apps Codex no estado de tarefas do OpenClaw |

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
