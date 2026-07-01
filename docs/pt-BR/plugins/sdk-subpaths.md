---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditando subcaminhos de plugins empacotados e superfícies auxiliares
summary: 'Catálogo de subcaminhos do Plugin SDK: quais imports ficam onde, agrupados por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-07-01T20:15:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de Plugin é exposto como um conjunto de subcaminhos públicos estreitos em
`openclaw/plugin-sdk/`. Esta página cataloga os subcaminhos usados com frequência agrupados por
finalidade. O inventário gerado de pontos de entrada do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações do pacote são o subconjunto público
após subtrair os subcaminhos locais de teste/internos do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Mantenedores podem auditar
a contagem de exportações públicas com `pnpm plugin-sdk:surface` e os subcaminhos
auxiliares reservados ativos com `pnpm plugins:boundary-report:summary`; exportações
auxiliares reservadas não usadas falham no relatório de CI em vez de permanecerem no SDK
público como dívida de compatibilidade inativa.

Para o guia de autoria de Plugins, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Entrada de Plugin

| Subcaminho                     | Exportações principais                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Auxiliares de itens de provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de item, auxiliares de redação e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Auxiliares de migração em runtime, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                            |
| `plugin-sdk/health`            | Registro, detecção, reparo, seleção, severidade e tipos de descoberta de verificações de integridade do Doctor para consumidores de integridade incluídos                 |

### Auxiliares de compatibilidade e teste descontinuados

Subcaminhos descontinuados permanecem exportados para Plugins mais antigos, mas código novo deve usar os
subcaminhos focados do SDK abaixo. A lista mantida é
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; o CI rejeita importações
de produção incluídas a partir dela. Barris amplos como `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod` são apenas para compatibilidade. Importe `zod`
diretamente de `zod`.

Os subcaminhos de auxiliares de teste do OpenClaw baseados em Vitest são apenas locais do repositório e não são
mais exportações do pacote: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Subcaminhos auxiliares reservados de Plugins incluídos

Estes subcaminhos são superfícies de compatibilidade pertencentes ao Plugin incluído
que os possui, não APIs gerais do SDK: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Importações de extensão entre proprietários são bloqueadas
pelas proteções de contrato do pacote.

<AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Auxiliar de validação de JSON Schema em cache para esquemas pertencentes ao plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, tradutor de configuração, prompts de lista de permissões, criadores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração/porta de ação multiconta, auxiliares de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares restritos de lista de contas/ação de conta |
    | `plugin-sdk/access-groups` | Auxiliares de análise de lista de permissões de grupos de acesso e diagnósticos redigidos de grupos |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartilhadas de esquema de configuração de canal, além de construtores Zod e JSON/TypeBox diretos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canal do OpenClaw agrupados apenas para plugins agrupados mantidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. IDs canônicos de canais de chat agrupados/oficiais, além de rótulos/aliases de formatador para plugins que precisam reconhecer texto com prefixo de envelope sem codificar a própria tabela. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canais agrupados |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato agrupado |
    | `plugin-sdk/command-gating` | Auxiliares restritos de porta de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidade de ingresso de canal de baixo nível. Novos caminhos de recebimento devem usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor runtime experimental de ingresso de canal de alto nível e criadores de fatos de rota para caminhos migrados de recebimento de canal. Prefira isto em vez de montar listas de permissões efetivas, listas de permissões de comandos e projeções legadas em cada plugin. Consulte [API de ingresso de canal](/pt-BR/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensagem, além de opções de pipeline de resposta, recibos, pré-visualização/transmissão ao vivo, auxiliares de ciclo de vida, identidade de saída, planejamento de payload, envios duráveis e auxiliares de contexto de envio de mensagens. Consulte [API de saída de canal](/pt-BR/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + criação de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-inbound` para executores de entrada e predicados de despacho, e `plugin-sdk/channel-outbound` para auxiliares de entrega de mensagens. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análise de destino; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída e estado de mídia hospedada |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Auxiliares restritos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de vinculação de thread |
    | `plugin-sdk/agent-media-payload` | Criador legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de vinculação, pareamento e vinculação configurada de conversa/thread |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas restritas de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelúdio de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de lista de permissões |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso a grupos |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Auxiliares restritos de política de guarda de DM direto antes de criptografia |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidade do Discord para `@openclaw/discord@2026.3.13` publicado e compatibilidade rastreada do proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de conta do Telegram para compatibilidade rastreada do proprietário; novos plugins devem usar auxiliares runtime injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade do Zalo Personal para pacotes Lark/Zalo publicados que ainda importam autorização de comando do remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Apresentação semântica de mensagens, entrega e auxiliares legados de respostas interativas. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Auxiliares compartilhados de entrada para classificação de eventos, criação de contexto, formatação, raízes, debounce, correspondência de menção, política de menção e logs de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares restritos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares restritos de política de menção, marcador de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade de plugins |
    | `plugin-sdk/channel-route` | Auxiliares compartilhados de normalização de rota, resolução de destino orientada por parser, conversão de ID de thread em string, chaves de rota compactas/deduplicadas, tipos de destino analisado e comparação de rota/destino |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de destino; chamadores de comparação de rota devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cabeamento de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares restritos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino de segredo |
  </Accordion>

Famílias obsoletas de auxiliares de canal permanecem disponíveis apenas para
compatibilidade com plugins publicados. O plano de remoção é: mantê-las durante
a janela de migração de plugins externos, manter plugins do repositório/agrupados em `channel-inbound` e
`channel-outbound`, depois remover os subcaminhos de compatibilidade na próxima grande
limpeza do SDK. Isso se aplica às famílias antigas de mensagem/runtime de canal, streaming de canal, acesso
direct-DM, fragmentação de auxiliares de entrada, reply-options
e pairing-path.

  <Accordion title="Subcaminhos de provedores">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de provedor LM Studio compatível para configuração, descoberta de catálogo e preparação de modelo em runtime |
    | `plugin-sdk/lmstudio-runtime` | Fachada de runtime LM Studio compatível para padrões do servidor local, descoberta de modelos, cabeçalhos de solicitação e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedores locais/auto-hospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedores auto-hospedados compatíveis com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolução de chaves de API em runtime para plugins de provedor |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de provedor, renderização de página de callback, auxiliares de PKCE/estado, análise de entrada de autorização, auxiliares de expiração de token e auxiliares de aborto |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de integração/gravação de perfil com chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de consulta de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importação de autenticação do OpenAI Codex, exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares compartilhados de normalização de ID de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares de catálogo de modelos de provedor ao vivo para descoberta protegida no estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtragem de IDs de modelo, cache TTL e fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Hook de runtime de aumento de catálogo de provedores e pontos de integração de registro de plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidade HTTP/endpoint de provedor, erros HTTP de provedor e auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares estreitos de contrato de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedor de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares estreitos de configuração/credenciais de web-search para provedores que não precisam de conexão de ativação de plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares estreitos de contrato de configuração/credenciais de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/runtime de provedor de web-search |
    | `plugin-sdk/embedding-providers` | Tipos gerais de provedores de embedding e auxiliares de leitura, incluindo `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; plugins registram provedores por meio de `api.registerEmbeddingProvider(...)` para que a propriedade do manifesto seja aplicada |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de esquema + diagnósticos para DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de snapshots de uso de provedor, auxiliares compartilhados de busca de uso e buscadores de provedor, como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de stream, compatibilidade de chamadas de ferramenta em texto simples e auxiliares compartilhados de wrappers para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartilhados de wrappers de stream de provedor, incluindo `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilitários de stream compatíveis com Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de provedor, como fetch protegido, extração de texto de resultado de ferramenta, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de integração |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares estreitos de modo de ativação de grupo e análise de comandos |
  </Accordion>

Snapshots de uso de provedor normalmente relatam uma ou mais `windows` de cota, cada uma com
um rótulo, percentual usado e horário opcional de redefinição. Provedores que expõem texto de saldo ou
estado da conta em vez de janelas de cota redefiníveis devem retornar
`summary` com um array `windows` vazio, em vez de fabricar percentuais.
O OpenClaw exibe esse texto de resumo na saída de status; use `error` somente quando o
endpoint de uso falhou ou não retornou nenhum dado de uso aproveitável.

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos, incluindo formatação dinâmica de menu de argumentos, auxiliares de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovador e autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprovação de execução nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de capacidade/entrega de aprovação nativa |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de Gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptador de aprovação nativa para entrypoints de canal quentes |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de runtime de handler de aprovação; prefira os pontos de integração mais estreitos de adaptador/Gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares de alvo de aprovação nativa, vinculação de conta, gate de rota, fallback de encaminhamento e supressão de prompt de execução nativa local |
    | `plugin-sdk/approval-reaction-runtime` | Vinculações hardcoded de reação de aprovação, payloads de prompt de reação, armazenamentos de alvo de reação e exportação de compatibilidade para supressão de prompt de execução nativa local |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de exec/plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de payload de aprovação de exec/plugin, auxiliares de roteamento/runtime de aprovação nativa e auxiliares de exibição estruturada de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares estreitos de redefinição de deduplicação de respostas recebidas |
    | `plugin-sdk/channel-contract-testing` | Auxiliares estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação nativa de comandos, formatação dinâmica de menu de argumentos e auxiliares nativos de alvo de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canal |
    | `plugin-sdk/command-surface` | Normalização de corpo de comando e auxiliares de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Auxiliares lazy de fluxo de login de autenticação de provedor para pareamento de canal privado e código de dispositivo da UI Web |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de coleta de contrato de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares estreitos de `coerceSecretRef` e tipagem SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/secret-provider-integration` | Contratos somente de tipo de manifesto de integração de provedor SecretRef e presets para plugins que publicam presets externos de provedor de segredo |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, gate de DM, arquivo/caminho limitado à raiz, incluindo gravações somente de criação, substituição atômica síncrona/assíncrona de arquivo, gravações temporárias irmãs, fallback de movimentação entre dispositivos, auxiliares de armazenamento privado de arquivos, proteções de pai de symlink, conteúdo externo, redação de texto sensível, comparação de segredo em tempo constante e auxiliares de coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de allowlist de hosts e política SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares estreitos de dispatcher fixado sem a superfície ampla de runtime de infra |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fixado, fetch protegido por SSRF, erro SSRF e auxiliares de política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitação/alvo de Webhook e coerção bruta de websocket/body |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho/timeout do corpo da solicitação |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de runtime/logging/backup/instalação de plugin |
    | `plugin-sdk/runtime-env` | Auxiliares restritos de env de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Fachada de config de navegador compatível para perfil/padrões normalizados, análise de URL de CDP e auxiliares de autenticação de controle do navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Auxiliares genéricos de ciclo de vida de tarefa e entrega de conclusão para agentes baseados em harness usando um escopo de tarefa emitido pelo host |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar Codex integrado reservado para projetar a config de servidor MCP do usuário na config de thread do Codex; não é para plugins de terceiros |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar Codex integrado privado para espelhamento de tarefa nativa/fiação de runtime; não é para plugins de terceiros |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e consulta de contexto de runtime de canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidade Matrix obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidade Mattermost obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar subcaminhos genéricos do SDK diretamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comando/hook/http/interativo de plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação/vinculação preguiçosa de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processo |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação da CLI, espera, versão, invocação por argumentos e grupo de comandos preguiçoso |
    | `plugin-sdk/qa-live-transport-scenarios` | IDs de cenários de QA de transporte ao vivo compartilhados, auxiliares de cobertura de baseline e auxiliar de seleção de cenário |
    | `plugin-sdk/gateway-method-runtime` | Auxiliar reservado de despacho de método do Gateway para rotas HTTP de plugin que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente Gateway, auxiliar de início de cliente pronto para loop de eventos, RPC da CLI do gateway, erros de protocolo do gateway, resolução de host LAN anunciado e auxiliares de patch de status de canal |
    | `plugin-sdk/config-contracts` | Superfície focada somente em tipos de config para formas de config de plugin, como `OpenClawConfig` e tipos de config de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de consulta de config de plugin em runtime, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares transacionais de mutação de config, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Strings compartilhadas de dica de metadados de entrega de ferramenta de mensagem |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares de snapshot da config do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot de teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram integrado está indisponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de texto |
    | `plugin-sdk/approval-reaction-runtime` | Bindings fixos de reação de aprovação, payloads de prompt de reação, stores de destino de reação e exportação de compatibilidade para supressão de prompt de exec nativo local |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de exec/plugin, construtores de capacidade de aprovação, auxiliares de auth/perfil, auxiliares de roteamento/runtime nativo e formatação de caminho de exibição de aprovação estruturada |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime de entrada/resposta, segmentação, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares restritos de despacho/finalização de resposta e rótulo de conversa |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de resposta em janela curta. Novo código de turno de mensagem deve usar `createChannelHistoryWindow`; auxiliares de mapa de nível mais baixo permanecem apenas como exportações de compatibilidade obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares restritos de segmentação de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de fluxo de trabalho de sessão (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), leituras limitadas de texto de transcrição recente de usuário/assistente por identidade de sessão, auxiliares legados de caminho de store de sessão/chave de sessão, leituras de updated-at e auxiliares de compatibilidade de store inteiro/caminho de arquivo somente de transição |
    | `plugin-sdk/session-transcript-runtime` | Identidade de transcrição, auxiliares com escopo de destino/leitura/gravação, publicação de atualizações, locks de gravação e chaves de acerto de memória de transcrição |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de schema de agente SQLite, caminho e transação para runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de caminho/carregamento/salvamento de store de Cron |
    | `plugin-sdk/state-paths` | Auxiliares de caminho de diretório State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado chaveado SQLite de sidecar de Plugin, além de configuração centralizada de pragma de conexão e manutenção de WAL para bancos de dados de propriedade do plugin |
    | `plugin-sdk/routing` | Auxiliares de rota/chave de sessão/binding de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de runtime e auxiliares de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolvedor de destino |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs de string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comando com tempo limite e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-plugin` | Define um plugin simples tipado de ferramenta de agente e expõe metadados estáticos para geração de manifesto |
    | `plugin-sdk/tool-payload` | Extrai payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de destino de envio dos argumentos da ferramenta |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox e auxiliares de comando SSH/OpenShell, incluindo preflight de comando exec com falha rápida |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho de download temporário e workspaces temporários seguros privados |
    | `plugin-sdk/logging-core` | Logger de subsistema e auxiliares de redação |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo e conversão de tabela Markdown |
    | `plugin-sdk/model-session-runtime` | Auxiliares de sobrescrita de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolução de config de provedor de talk |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/gravação de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Auxiliares de análise de JSON que preservam literais de inteiro inseguros como strings |
    | `plugin-sdk/file-lock` | Auxiliares de file-lock reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de deduplicação respaldado por disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sessão ACP e despacho de resposta |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares leves de registro de backend ACP e despacho de resposta para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução de binding ACP somente leitura sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivos restritos de schema de config de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivos compartilhados de auxiliares de canal passivo, status e proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta de comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/construção/serialização de comando nativo |
    | `plugin-sdk/agent-harness` | Superfície experimental de plugin confiável para harnesses de agente de baixo nível: tipos de harness, auxiliares de direcionamento/abort de execução ativa, auxiliares de ponte de ferramenta OpenClaw, auxiliares de política de ferramenta de plano de runtime, classificação de resultado terminal, auxiliares de formatação/detalhe de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detecção de endpoint de propriedade do provedor Z.AI; use a API pública do plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de lock assíncrono local ao processo para pequenos arquivos de estado de runtime |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de cache de deduplicação em memória |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de drenagem de entregas pendentes de saída |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros de caminho de arquivo local e fonte de mídia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de wake, evento e visibilidade de Heartbeat |
    | `plugin-sdk/number-runtime` | Auxiliar de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares de token/UUID seguro |
    | `plugin-sdk/system-event-runtime` | Auxiliares de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera por prontidão de transporte |
    | `plugin-sdk/exec-approvals-runtime` | Auxiliares de arquivo de política de aprovação de exec sem o barrel amplo de infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos focados de runtime acima |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de flag de diagnóstico, evento e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, auxiliares compartilhados de classificação de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulado, proxy, opção EnvHttpProxyAgent e auxiliares de lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime ciente de dispatcher sem importações de proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizador de URL de dados de imagem inline e auxiliares de detecção de assinatura sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de binding de conversa sem roteamento de binding configurado nem stores de pareamento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de store de sessão sem importações amplas de gravações/manutenção de config |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de schema de agente SQLite, caminho e transação sem controles de ciclo de vida de banco de dados |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de config/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares restritos de coerção e normalização de registro/string primitivos sem importações de markdown/logging |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de config de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/workspace de agente, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório respaldada por config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de busca/transformação/armazenamento de mídia, incluindo `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e o obsoleto `fetchRemoteMedia`; prefira helpers de armazenamento antes de leituras de buffer quando uma URL deve se tornar mídia do OpenClaw |
    | `plugin-sdk/media-mime` | Normalização restrita de MIME, mapeamento de extensão de arquivo, detecção de MIME e helpers de tipo de mídia |
    | `plugin-sdk/media-store` | Helpers restritos de armazenamento de mídia, como `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedores de entendimento de mídia, além de exportações de helpers voltados a provedores para imagem/áudio/extração estruturada |
    | `plugin-sdk/text-chunking` | Helpers de fragmentação/renderização de texto e markdown, conversão de tabelas markdown, remoção de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentação de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedores de fala, além de exportações voltadas a provedores para diretivas, registro, validação, construtor de TTS compatível com OpenAI e helpers de fala |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedores de fala, registro, diretiva, normalização e exportações de helpers de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedores de transcrição em tempo real, helpers de registro e helper compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper de bootstrap de perfil em tempo real para injeção delimitada de contexto de `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de provedores de voz em tempo real, helpers de registro e helpers compartilhados de comportamento de voz em tempo real, incluindo rastreamento de atividade de saída |
    | `plugin-sdk/image-generation` | Tipos de provedores de geração de imagem, além de helpers de URL de dados/ativos de imagem e o construtor de provedor de imagem compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, failover, autenticação e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, consulta de provedor e análise de referência de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, consulta de provedor e análise de referência de modelo |
    | `plugin-sdk/transcripts` | Tipos compartilhados de provedores de origem de transcrições, helpers de registro, descritores de sessão e metadados de enunciado |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook e helpers de instalação de rotas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidade obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexportação de compatibilidade obsoleta; importe `zod` de `zod` diretamente |
    | `plugin-sdk/testing` | Barrel de compatibilidade obsoleto local do repositório para testes legados do OpenClaw. Novos testes do repositório devem importar subcaminhos locais de teste focados, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo `createTestPluginApi` local do repositório para testes unitários de registro direto de Plugin sem importar pontes de helpers de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato de adaptador nativo de runtime de agente locais do repositório para testes de autenticação, entrega, fallback, hook de ferramenta, sobreposição de prompt, esquema e projeção de transcrição |
    | `plugin-sdk/channel-test-helpers` | Helpers de teste locais do repositório orientados a canais para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, encadeamento de configuração de envio, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada local do repositório de casos de erro de resolução de destino para testes de canal |
    | `plugin-sdk/plugin-test-contracts` | Helpers locais do repositório de contratos de pacote de Plugin, registro, artefato público, importação direta, API de runtime e efeito colateral de importação |
    | `plugin-sdk/provider-test-contracts` | Helpers locais do repositório de contratos de runtime de provedor, autenticação, descoberta, onboard, catálogo, assistente, capacidade de mídia, política de replay, áudio ao vivo STT em tempo real, pesquisa/busca na web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação Vitest opcionais locais do repositório para testes de provedores que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas locais do repositório para captura de runtime da CLI, contexto de sandbox, gravador de skill, mensagem de agente, evento de sistema, recarregamento de módulo, caminho de Plugin empacotado, texto de terminal, fragmentação, token de autenticação e casos tipados |
    | `plugin-sdk/test-node-mocks` | Helpers focados locais do repositório para mock de builtins do Node para uso dentro de factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície de helpers memory-core empacotada para helpers de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade de runtime de índice/pesquisa de memória |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helpers leves de registro de provedores de embedding de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de fundação do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embedding do host de memória, acesso ao registro, provedor local e helpers genéricos de lote/remotos. `registerMemoryEmbeddingProvider` nesta superfície está obsoleto; use a API genérica de provedor de embedding para novos provedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime da CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime central do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação a fornecedor para helpers de runtime central do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação a fornecedor para helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Facade de runtime de memória ativa para acesso ao gerenciador de pesquisa |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subcaminhos reservados de helpers empacotados">
    Subcaminhos SDK reservados de helpers empacotados são superfícies restritas
    específicas de proprietários para código de Plugin empacotado. Eles são rastreados no inventário do SDK para que builds
    de pacote e aliasing permaneçam determinísticos, mas não são APIs gerais de
    autoria de plugins. Novos contratos reutilizáveis de host devem usar subcaminhos genéricos do SDK
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Subcaminho | Proprietário e finalidade |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper do Plugin Codex empacotado para projetar a configuração de servidor MCP do usuário na configuração de thread do servidor de app Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper do Plugin Codex empacotado para espelhar subagentes nativos do servidor de app Codex no estado de tarefa do OpenClaw |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
