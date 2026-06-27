---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditando subcaminhos de Plugins incluídos e superfícies auxiliares
summary: 'Plugin SDK subpath catalog: quais imports ficam onde, agrupados por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de Plugin é exposto como um conjunto de subcaminhos públicos estreitos em
`openclaw/plugin-sdk/`. Esta página cataloga os subcaminhos usados com frequência, agrupados por
finalidade. O inventário gerado de entrypoints do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações do pacote são o subconjunto público
após subtrair os subcaminhos internos/de teste locais do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Mantenedores podem auditar
a contagem de exportações públicas com `pnpm plugin-sdk:surface` e os subcaminhos auxiliares
reservados ativos com `pnpm plugins:boundary-report:summary`; exportações auxiliares
reservadas não usadas fazem o relatório de CI falhar, em vez de permanecerem no SDK público como
dívida de compatibilidade dormente.

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
| `plugin-sdk/health`            | Registro, detecção, reparo, seleção, severidade e tipos de achados de verificações de integridade do Doctor para consumidores de integridade incluídos                   |

### Compatibilidade obsoleta e auxiliares de teste

Subcaminhos obsoletos continuam exportados para Plugins mais antigos, mas código novo deve usar os
subcaminhos focados do SDK abaixo. A lista mantida é
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; a CI rejeita importações de produção
incluídas vindas dela. Barrels amplos como `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod` são somente de compatibilidade. Importe `zod`
diretamente de `zod`.

Os subcaminhos de auxiliares de teste do OpenClaw baseados no Vitest são apenas locais do repositório e
não são mais exportações do pacote: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Subcaminhos auxiliares reservados de Plugins incluídos

Estes subcaminhos são superfícies de compatibilidade pertencentes ao Plugin para seu Plugin incluído
proprietário, não APIs gerais do SDK: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Importações de extensões entre proprietários são bloqueadas
por salvaguardas de contrato do pacote.

  <AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Auxiliar de validação de JSON Schema em cache para esquemas de propriedade do plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, tradutor de configuração, prompts de lista de permissões, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração/portão de ação para várias contas, auxiliares de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de consulta de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares restritos de lista de contas/ação de conta |
    | `plugin-sdk/access-groups` | Auxiliares de análise de lista de permissões de grupo de acesso e diagnósticos redigidos de grupo |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartilhadas de esquema de configuração de canal, além de construtores Zod e JSON/TypeBox diretos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canal OpenClaw incluídos apenas para plugins incluídos mantidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. IDs canônicos de canais de chat incluídos/oficiais, além de rótulos/aliases de formatador para plugins que precisam reconhecer texto com prefixo de envelope sem codificar sua própria tabela. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canal incluídos |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato incluído |
    | `plugin-sdk/command-gating` | Auxiliares restritos de portão de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidade de entrada de canal de baixo nível. Novos caminhos de recebimento devem usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor experimental de tempo de execução de entrada de canal de alto nível e construtores de fatos de rota para caminhos migrados de recebimento de canal. Prefira isso em vez de montar listas de permissões efetivas, listas de comandos permitidos e projeções legadas em cada plugin. Consulte [API de entrada de canal](/pt-BR/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensagens, além de opções de pipeline de resposta, recibos, pré-visualização/transmissão ao vivo, auxiliares de ciclo de vida, identidade de saída, planejamento de payload, envios duráveis e auxiliares de contexto de envio de mensagem. Consulte [API de saída de canal](/pt-BR/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + construtores de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-inbound` para executores de entrada e predicados de despacho, e `plugin-sdk/channel-outbound` para auxiliares de entrega de mensagens. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análise de destino; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída e estado de mídia hospedada |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Auxiliares restritos de normalização de enquetes |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de vinculação de threads |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de conversa/vinculação de thread, emparelhamento e vinculação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração de tempo de execução |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo em tempo de execução |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas restritas de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de preâmbulo de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de lista de permissões |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso a grupos |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Auxiliares restritos de política de guarda pré-criptografia para DM direta |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidade do Discord para `@openclaw/discord@2026.3.13` publicado e compatibilidade rastreada do proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de conta do Telegram para compatibilidade rastreada do proprietário; novos plugins devem usar auxiliares de tempo de execução injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade do Zalo Personal para pacotes Lark/Zalo publicados que ainda importam autorização de comando do remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Apresentação semântica de mensagens, entrega e auxiliares legados de resposta interativa. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Auxiliares compartilhados de entrada para classificação de eventos, construção de contexto, formatação, raízes, debounce, correspondência de menções, política de menções e registro de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares restritos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares restritos de política de menção, marcador de menção e texto de menção sem a superfície mais ampla de tempo de execução de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade de plugin |
    | `plugin-sdk/channel-route` | Normalização compartilhada de rota, resolução de destino orientada por analisador, stringificação de ID de thread, chaves de rota deduplicadas/compactas, tipos de destino analisado e auxiliares de comparação de rota/destino |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de destino; chamadores de comparação de rota devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cabeamento de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares restritos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino de segredo |
  </Accordion>

As famílias de auxiliares de canal obsoletas permanecem disponíveis apenas para
compatibilidade com Plugin publicados. O plano de remoção é: mantê-las durante a
janela de migração de Plugin externos, manter os Plugin do repositório/incluídos em `channel-inbound` e
`channel-outbound`, e então remover os subcaminhos de compatibilidade na próxima grande
limpeza do SDK. Isso se aplica às famílias antigas de mensagem/runtime de canal,
streaming de canal, acesso direto a DM, fragmentação de auxiliares de entrada, opções de resposta
e caminhos de pareamento.

  <Accordion title="Subcaminhos de provedores">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de provedor LM Studio compatível para configuração, descoberta de catálogo e preparação de modelo em tempo de execução |
    | `plugin-sdk/lmstudio-runtime` | Fachada de tempo de execução do LM Studio compatível para padrões do servidor local, descoberta de modelos, cabeçalhos de solicitação e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedores locais/auto-hospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedores auto-hospedados compatíveis com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolução de chaves de API em tempo de execução para plugins de provedor |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de provedor, renderização de página de callback, auxiliares de PKCE/estado, análise de entrada de autorização, auxiliares de expiração de token e auxiliares de cancelamento |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de integração/gravação de perfil com chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de consulta de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importação de autenticação do OpenAI Codex, exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares compartilhados de normalização de ID de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares de catálogo de modelos de provedor ao vivo para descoberta protegida no estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtragem de IDs de modelo, cache TTL e fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Gancho de tempo de execução de ampliação de catálogo de provedor e limites de registro plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidade HTTP/endpoint de provedor, erros HTTP de provedor e auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares de contrato restrito de configuração/seleção de busca na web, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedor de busca na web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares restritos de configuração/credenciais de pesquisa na web para provedores que não precisam de conexão de habilitação de plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares restritos de contrato de configuração/credenciais de pesquisa na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/tempo de execução de provedor de pesquisa na web |
    | `plugin-sdk/embedding-providers` | Tipos gerais de provedor de embeddings e auxiliares de leitura, incluindo `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; plugins registram provedores por meio de `api.registerEmbeddingProvider(...)` para que a propriedade do manifesto seja aplicada |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de esquema + diagnósticos para DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de snapshots de uso de provedor, auxiliares compartilhados de busca de uso e buscadores de provedor, como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream, compatibilidade de chamada de ferramenta em texto simples e auxiliares compartilhados de wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartilhados de wrapper de stream de provedor, incluindo `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilitários de stream compatíveis com Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de provedor, como fetch protegido, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de integração |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Modo restrito de ativação de grupo e auxiliares de análise de comandos |
  </Accordion>

Snapshots de uso de provedor normalmente informam uma ou mais `windows` de cota, cada uma com
um rótulo, percentual usado e horário opcional de redefinição. Provedores que expõem saldo ou
texto de estado da conta em vez de janelas de cota redefiníveis devem retornar
`summary` com um array `windows` vazio, em vez de fabricar percentuais.
O OpenClaw exibe esse texto de resumo na saída de status; use `error` somente quando o
endpoint de uso falhar ou não retornar dados de uso aproveitáveis.

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos, incluindo formatação dinâmica de menu de argumentos, auxiliares de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovador e autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprovação de execução nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de Gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptador de aprovação nativa para pontos de entrada de canal em caminhos quentes |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de tempo de execução de manipulador de aprovação; prefira os limites mais restritos de adaptador/Gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares de alvo de aprovação nativa, vinculação de conta, controle de rota, fallback de encaminhamento e supressão de prompt de execução nativa local |
    | `plugin-sdk/approval-reaction-runtime` | Vinculações fixas de reações de aprovação, payloads de prompt de reação, armazenamentos de alvo de reação e exportação de compatibilidade para supressão de prompt de execução nativa local |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de execução/plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de payload de aprovação de execução/plugin, auxiliares de roteamento/tempo de execução de aprovação nativa e auxiliares estruturados de exibição de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares restritos de redefinição de deduplicação de respostas recebidas |
    | `plugin-sdk/channel-contract-testing` | Auxiliares restritos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação de comando nativa, formatação dinâmica de menu de argumentos e auxiliares nativos de alvo de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canal |
    | `plugin-sdk/command-surface` | Normalização de corpo de comando e auxiliares de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares restritos de coleta de contrato de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares restritos de `coerceSecretRef` e tipagem SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/secret-provider-integration` | Manifesto somente de tipos de integração de provedor SecretRef e contratos de predefinição para plugins que publicam predefinições de provedores externos de segredo |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, controle de DM, arquivos/caminhos limitados à raiz, incluindo gravações somente de criação, substituição atômica síncrona/assíncrona de arquivos, gravações temporárias irmãs, fallback de movimentação entre dispositivos, auxiliares de armazenamento privado de arquivos, proteções de pai de symlink, conteúdo externo, redação de texto sensível, comparação de segredo em tempo constante e auxiliares de coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de lista de permissões de host e política SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares restritos de dispatcher fixado sem a superfície ampla de tempo de execução de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fixado, fetch protegido contra SSRF, erro SSRF e auxiliares de política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitação/alvo de Webhook e coerção bruta de websocket/corpo |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho/timeout do corpo da solicitação |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de runtime/logging/backup/instalação de plugin |
    | `plugin-sdk/runtime-env` | Auxiliares focados de env de runtime, logger, timeout, repetição e backoff |
    | `plugin-sdk/browser-config` | Fachada de configuração de navegador compatível para perfil/padrões normalizados, análise de URL CDP e auxiliares de autenticação de controle de navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Auxiliares genéricos de ciclo de vida de tarefa e entrega de conclusão para agentes baseados em harness que usam um escopo de tarefa emitido pelo host |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar Codex empacotado reservado para projetar a configuração de servidor MCP do usuário na configuração de thread do Codex; não destinado a plugins de terceiros |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar Codex empacotado privado para espelhamento de tarefa nativa/fiação de runtime; não destinado a plugins de terceiros |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e consulta de contexto de runtime de canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidade Matrix obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidade Mattermost obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar subcaminhos genéricos do SDK diretamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comandos/hooks/http/interativos de plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação/vinculação lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processo |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação da CLI, espera, versão, invocação de argumentos e grupos de comandos lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | IDs de cenários de QA de transporte ao vivo compartilhados, auxiliares de cobertura de linha de base e auxiliar de seleção de cenário |
    | `plugin-sdk/gateway-method-runtime` | Auxiliar reservado de despacho de método Gateway para rotas HTTP de plugin que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente Gateway, auxiliar de início de cliente pronto para loop de eventos, RPC da CLI do Gateway, erros do protocolo Gateway e auxiliares de patch de status de canal |
    | `plugin-sdk/config-contracts` | Superfície focada apenas em tipos de configuração para formatos de configuração de plugin, como `OpenClawConfig` e tipos de configuração de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de consulta de configuração de plugin em runtime, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares de mutação transacional de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Strings compartilhadas de dica de metadados de entrega de ferramenta de mensagem |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares de snapshot da configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot para teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comandos do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram empacotado está indisponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de texto |
    | `plugin-sdk/approval-reaction-runtime` | Vínculos hardcoded de reação de aprovação, payloads de prompt de reação, stores de destino de reação e exportação de compatibilidade para supressão local de prompt de execução nativa |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de exec/plugin, construtores de capability de aprovação, auxiliares de autenticação/perfil, auxiliares de roteamento/runtime nativos e formatação estruturada de caminho de exibição de aprovação |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime de entrada/resposta, divisão em partes, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares focados de despacho/finalização de resposta e rótulos de conversa |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de respostas em janela curta. Novo código de turno de mensagem deve usar `createChannelHistoryWindow`; auxiliares de mapa de nível inferior permanecem apenas como exportações de compatibilidade obsoletas |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares focados de divisão de texto/markdown em partes |
    | `plugin-sdk/session-store-runtime` | Auxiliares de fluxo de sessão (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), leituras limitadas de texto de transcrição recente de usuário/assistente por identidade de sessão, auxiliares legados de caminho de store de sessão/chave de sessão, leituras de updated-at e auxiliares de compatibilidade de store completo/caminho de arquivo somente para transição |
    | `plugin-sdk/session-transcript-runtime` | Identidade de transcrição, auxiliares de destino/leitura/gravação com escopo, publicação de atualizações, locks de gravação e chaves de acerto de memória de transcrição |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de esquema de agente, caminho e transação SQLite para runtime primário |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de caminho/carregamento/salvamento de store Cron |
    | `plugin-sdk/state-paths` | Auxiliares de caminhos de diretórios de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado chaveado SQLite sidecar de plugin, além de setup centralizado de pragma de conexão e manutenção de WAL para bancos de dados pertencentes a plugins |
    | `plugin-sdk/routing` | Auxiliares de vínculo de rota/chave de sessão/conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de runtime e auxiliares de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolvedor de destino |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs em string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comandos com tempo limite e resultados stdout/stderr normalizados |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-plugin` | Define um plugin de ferramenta de agente tipado simples e expõe metadados estáticos para geração de manifesto |
    | `plugin-sdk/tool-payload` | Extrai payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de destino de envio de args de ferramenta |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox e auxiliares de comandos SSH/OpenShell, incluindo preflight de comando exec fail-fast |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho de download temporário e workspaces temporários seguros privados |
    | `plugin-sdk/logging-core` | Logger de subsistema e auxiliares de redação |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo de tabela Markdown e conversão |
    | `plugin-sdk/model-session-runtime` | Auxiliares de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolução de configuração de provedor Talk |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/gravação de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Auxiliares de análise de JSON que preservam literais inteiros inseguros como strings |
    | `plugin-sdk/file-lock` | Auxiliares de lock de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de deduplicação apoiado em disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sessão ACP e despacho de resposta |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares leves de registro de backend ACP e despacho de resposta para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vínculo ACP sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivos focados de esquema de configuração de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor permissivo de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivos compartilhados de canal passivo, status e auxiliares de proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta de comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/construção/serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental de plugin confiável para harnesses de agente de baixo nível: tipos de harness, auxiliares de guiar/abortar execução ativa, auxiliares de ponte de ferramentas do OpenClaw, auxiliares de política de ferramentas de plano de runtime, classificação de resultado terminal, auxiliares de formatação/detalhe de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detecção de endpoint pertencente ao provedor Z.AI; use a API pública do plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de lock assíncrono local ao processo para pequenos arquivos de estado de runtime |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de cache de deduplicação em memória |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de drenagem de entregas pendentes de saída |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros de caminhos de arquivo local e fonte de mídia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de despertar, evento e visibilidade de Heartbeat |
    | `plugin-sdk/number-runtime` | Auxiliar de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares de token/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Auxiliares de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera por prontidão de transporte |
    | `plugin-sdk/exec-approvals-runtime` | Auxiliares de arquivo de política de aprovação de exec sem o barrel amplo `infra-runtime` |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos de runtime focados acima |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de flag de diagnóstico, evento e contexto de trace |
    | `plugin-sdk/error-runtime` | Auxiliares de grafo de erros, formatação e classificação compartilhada de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulado, proxy, opção EnvHttpProxyAgent e auxiliares de lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime ciente de dispatcher sem importações de proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizador de URL de dados de imagem inline e auxiliares de detecção de assinatura sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vínculo de conversa sem roteamento de vínculo configurado nem stores de pareamento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de store de sessão sem importações amplas de gravações/manutenção de configuração |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de esquema de agente, caminho e transação SQLite sem controles de ciclo de vida de banco de dados |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares focados de coerção e normalização de registro/string primitivos sem importações de markdown/logging |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuração de repetição e executor de repetição |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/workspace de agente, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretórios apoiada por configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e teste">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartilhados de busca/transformação/armazenamento de mídia, incluindo `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e o obsoleto `fetchRemoteMedia`; prefira auxiliares de armazenamento antes de leituras de buffer quando uma URL deve se tornar mídia do OpenClaw |
    | `plugin-sdk/media-mime` | Normalização MIME estreita, mapeamento de extensão de arquivo, detecção MIME e auxiliares de tipo de mídia |
    | `plugin-sdk/media-store` | Auxiliares estreitos de armazenamento de mídia, como `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia mais exportações de auxiliares voltados para provedores para imagem/áudio/extração estruturada |
    | `plugin-sdk/text-chunking` | Auxiliares de divisão/renderização de texto e markdown, conversão de tabelas markdown, remoção de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de divisão de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala mais exportações de auxiliares voltados para provedores para diretivas, registro, validação, construtor TTS compatível com OpenAI e fala |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva, normalização e exportações de auxiliares de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Auxiliar de bootstrap de perfil em tempo real para injeção limitada de contexto de `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real, auxiliares de registro e auxiliares compartilhados de comportamento de voz em tempo real, incluindo rastreamento de atividade de saída |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagens mais auxiliares de URL de dados/ativos de imagem e o construtor de provedor de imagem compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagens, failover, autenticação e auxiliares de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, auxiliares de failover, busca de provedor e análise de referência de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, auxiliares de failover, busca de provedor e análise de referência de modelo |
    | `plugin-sdk/transcripts` | Tipos compartilhados de provedores de fonte de transcrições, auxiliares de registro, descritores de sessão e metadados de enunciado |
    | `plugin-sdk/webhook-targets` | Registro de destino de Webhook e auxiliares de instalação de rota |
    | `plugin-sdk/webhook-path` | Alias de compatibilidade obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexportação de compatibilidade obsoleta; importe `zod` de `zod` diretamente |
    | `plugin-sdk/testing` | Módulo agregador de compatibilidade obsoleto local do repositório para testes legados do OpenClaw. Novos testes do repositório devem importar subcaminhos de teste locais focados, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi` local do repositório para testes unitários de registro direto de Plugin sem importar pontes de auxiliares de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato de adaptador nativo de runtime de agente locais do repositório para testes de autenticação, entrega, fallback, gancho de ferramenta, sobreposição de prompt, esquema e projeção de transcrição |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de teste orientados a canais locais do repositório para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, encadeamento de configuração de envio, mocks de runtime, problemas de status, entrega de saída e registro de ganchos |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada local do repositório para casos de erro de resolução de destino em testes de canal |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locais do repositório para contratos de pacote de Plugin, registro, artefato público, importação direta, API de runtime e efeitos colaterais de importação |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locais do repositório para contratos de runtime de provedor, autenticação, descoberta, integração, catálogo, assistente, capacidade de mídia, política de repetição, áudio ao vivo de STT em tempo real, pesquisa/busca na web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação opt-in do Vitest locais do repositório para testes de provedor que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas locais do repositório para captura de runtime de CLI, contexto de sandbox, gravador de skill, mensagem de agente, evento de sistema, recarregamento de módulo, caminho de Plugin empacotado, texto de terminal, divisão em partes, token de autenticação e casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares de mock focados de recursos internos do Node, locais do repositório, para uso dentro de factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície auxiliar memory-core empacotada para auxiliares de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade de runtime de índice/pesquisa de memória |
    | `plugin-sdk/memory-core-host-embedding-registry` | Auxiliares leves de registro de provedor de embedding de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de fundação do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embedding de host de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remoto. `registerMemoryEmbeddingProvider` nesta superfície está obsoleto; use a API genérica de provedor de embedding para novos provedores. |
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
    | `plugin-sdk/memory-host-core` | Alias neutro em relação a fornecedor para auxiliares de runtime central do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação a fornecedor para auxiliares de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Facade de runtime de Active memory para acesso ao gerenciador de pesquisa |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subcaminhos reservados de auxiliares empacotados">
    Subcaminhos SDK reservados de auxiliares empacotados são superfícies estreitas específicas de proprietário para
    código de Plugin empacotado. Eles são rastreados no inventário do SDK para que builds
    de pacote e aliasing permaneçam determinísticos, mas não são APIs gerais de
    autoria de Plugin. Novos contratos reutilizáveis de host devem usar subcaminhos genéricos do SDK
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Subcaminho | Proprietário e finalidade |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar do Plugin Codex empacotado para projetar a configuração de servidor MCP do usuário na configuração de thread do app-server do Codex |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar do Plugin Codex empacotado para espelhar subagentes nativos do app-server do Codex no estado de tarefa do OpenClaw |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
