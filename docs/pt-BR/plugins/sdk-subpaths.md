---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditoria de subcaminhos de Plugins incluídos e superfícies auxiliares
summary: 'Catálogo de subcaminhos do SDK de Plugin: quais imports ficam onde, agrupados por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-07-04T10:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de Plugin é exposto como um conjunto de subcaminhos públicos estreitos em
`openclaw/plugin-sdk/`. Esta página cataloga os subcaminhos usados com frequência, agrupados por
finalidade. O inventário do ponto de entrada gerado do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações do pacote são o subconjunto público
após subtrair os subcaminhos locais de teste/internos do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Mantenedores podem auditar
a contagem de exportações públicas com `pnpm plugin-sdk:surface` e os subcaminhos auxiliares
reservados ativos com `pnpm plugins:boundary-report:summary`; exportações auxiliares
reservadas não usadas falham no relatório de CI em vez de permanecerem no SDK público como
dívida de compatibilidade dormente.

Para o guia de autoria de plugins, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Entrada de Plugin

| Subcaminho                     | Principais exportações                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Auxiliares de itens do provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de item, auxiliares de redação e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Auxiliares de migração em runtime, como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`         |
| `plugin-sdk/health`            | Registro, detecção, reparo, seleção, severidade e tipos de achados de verificações de integridade do Doctor para consumidores de integridade agrupados                  |

### Compatibilidade obsoleta e auxiliares de teste

Subcaminhos obsoletos continuam exportados para plugins antigos, mas código novo deve usar os
subcaminhos focados do SDK abaixo. A lista mantida é
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; o CI rejeita importações de
produção agrupadas a partir dela. Barris amplos como `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod` são apenas de compatibilidade. Importe `zod`
diretamente de `zod`.

Os subcaminhos de auxiliares de teste do OpenClaw baseados no Vitest são apenas locais do repositório e não são
mais exportações do pacote: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Subcaminhos auxiliares reservados de plugins agrupados

Esses subcaminhos são superfícies de compatibilidade pertencentes ao plugin para seu respectivo plugin agrupado,
não APIs gerais do SDK: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Importações de extensão entre proprietários são bloqueadas
por proteções de contrato do pacote.

<AccordionGroup>
  <Accordion title="Subcaminhos de canais">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Auxiliar de validação JSON Schema em cache para esquemas pertencentes ao plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, tradutor de configuração, prompts de lista de permissões, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração/action-gate multi-conta, auxiliares de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de account-id |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares restritos de lista de contas/ação de conta |
    | `plugin-sdk/access-groups` | Auxiliares de análise de lista de permissões de grupos de acesso e diagnósticos redigidos de grupos |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartilhadas de esquema de configuração de canal, além de construtores Zod e JSON/TypeBox diretos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canal agrupados do OpenClaw somente para plugins agrupados mantidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. IDs canônicos de canais de chat agrupados/oficiais, além de rótulos/aliases de formatador para plugins que precisam reconhecer texto com prefixo de envelope sem codificar a própria tabela. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canais agrupados |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato agrupado |
    | `plugin-sdk/command-gating` | Auxiliares restritos de gate de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidade de entrada de canal de baixo nível. Novos caminhos de recebimento devem usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor experimental de runtime de entrada de canal de alto nível e construtores de fatos de rota para caminhos migrados de recebimento de canal. Prefira isto em vez de montar listas de permissões efetivas, listas de permissões de comandos e projeções legadas em cada plugin. Consulte [API de entrada de canal](/pt-BR/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensagens, além de opções de pipeline de resposta, recibos, pré-visualização/transmissão ao vivo, auxiliares de ciclo de vida, identidade de saída, planejamento de payload, envios duráveis e auxiliares de contexto de envio de mensagens. Consulte [API de saída de canal](/pt-BR/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-inbound` para runners de entrada e predicados de despacho, e `plugin-sdk/channel-outbound` para auxiliares de entrega de mensagens. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análise de alvos; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída e estado de mídia hospedada |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Auxiliares restritos de normalização de enquetes |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de vinculação de threads |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de conversa/vinculação de thread, pareamento e vinculação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas restritas de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de escrita de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de preâmbulo de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de lista de permissões |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso a grupos |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Auxiliares restritos de política de proteção direct-DM pré-crypto |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidade do Discord para `@openclaw/discord@2026.3.13` publicado e compatibilidade de proprietário rastreada; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de conta do Telegram para compatibilidade de proprietário rastreada; novos plugins devem usar auxiliares de runtime injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade do Zalo Personal para pacotes Lark/Zalo publicados que ainda importam autorização de comando de remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Apresentação semântica de mensagens, entrega e auxiliares legados de resposta interativa. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Auxiliares compartilhados de entrada para classificação de eventos, construção de contexto, formatação, raízes, debounce, correspondência de menções, política de menções e log de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares restritos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares restritos de política de menções, marcador de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, além de auxiliares de esquema nativo obsoletos mantidos para compatibilidade de plugins |
    | `plugin-sdk/channel-route` | Normalização compartilhada de rotas, resolução de alvo orientada por parser, stringificação de thread-id, chaves de rota dedupe/compactas, tipos de alvo analisado e auxiliares de comparação de rota/alvo |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de alvo; chamadores de comparação de rota devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexão de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares restritos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de alvo secreto |
  </Accordion>

Famílias obsoletas de auxiliares de canal permanecem disponíveis apenas para
compatibilidade com plugins publicados. O plano de remoção é: mantê-las durante
a janela de migração de plugins externos, manter plugins do repositório/agrupados
em `channel-inbound` e `channel-outbound`, depois remover os subcaminhos de
compatibilidade na próxima grande limpeza do SDK. Isso se aplica às famílias antigas
de mensagem/runtime de canal, streaming de canal, acesso direct-DM, fragmento de
auxiliares de entrada, opções de resposta e caminhos de pareamento.

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de provedor LM Studio compatível para configuração, descoberta de catálogo e preparação de modelo em runtime |
    | `plugin-sdk/lmstudio-runtime` | Fachada de runtime LM Studio compatível para padrões de servidor local, descoberta de modelos, cabeçalhos de requisição e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedor local/auto-hospedado |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedor auto-hospedado compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolução de chave de API em runtime para Plugins de provedor |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de provedor, renderização de página de callback, auxiliares de PKCE/estado, análise de entrada de autorização, auxiliares de expiração de token e auxiliares de abortamento |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de consulta de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importação de autenticação do OpenAI Codex, exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares compartilhados de normalização de ID de modelo |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares de catálogo de modelos de provedor ao vivo para descoberta protegida no estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtragem de ID de modelo, cache TTL e fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Hook de runtime de ampliação de catálogo de provedor e pontos de integração do registro de plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidade HTTP/endpoint de provedor, erros HTTP de provedor e auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares estreitos de contrato de configuração/seleção de busca na web, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedor de busca na web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares estreitos de configuração/credencial de pesquisa na web para provedores que não precisam de fiação de ativação de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares estreitos de contrato de configuração/credencial de pesquisa na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/runtime de provedor de pesquisa na web |
    | `plugin-sdk/embedding-providers` | Tipos gerais de provedor de embeddings e auxiliares de leitura, incluindo `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; plugins registram provedores por meio de `api.registerEmbeddingProvider(...)` para que a propriedade do manifesto seja aplicada |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de esquema + diagnósticos de DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de snapshot de uso de provedor, auxiliares compartilhados de busca de uso e fetchers de provedor, como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream, compatibilidade de chamada de ferramenta em texto simples e auxiliares compartilhados de wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartilhados de wrapper de stream de provedor, incluindo `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilitários de stream compatíveis com Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de provedor, como fetch protegido, extração de texto de resultado de ferramenta, transformações de mensagens de transporte e streams de eventos de transporte graváveis |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares estreitos de modo de ativação de grupo e análise de comandos |
  </Accordion>

Snapshots de uso de provedor normalmente informam uma ou mais `windows` de cota, cada uma com
um rótulo, percentual usado e horário opcional de redefinição. Provedores que expõem texto de saldo ou
estado da conta em vez de janelas de cota redefiníveis devem retornar
`summary` com um array `windows` vazio em vez de fabricar percentuais.
O OpenClaw exibe esse texto de resumo na saída de status; use `error` apenas quando o
endpoint de uso falhar ou não retornar dados de uso aproveitáveis.

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos, incluindo formatação dinâmica de menu de argumentos, auxiliares de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comandos/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovador e de autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprovação de exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de Gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptador de aprovação nativo para pontos de entrada de canal em hot path |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de runtime de manipulador de aprovação; prefira os pontos de integração mais estreitos de adaptador/Gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de alvo de aprovação, vinculação de conta, gate de rota, fallback de encaminhamento e supressão de prompt de exec nativo local |
    | `plugin-sdk/approval-reaction-runtime` | Bindings hardcoded de reação de aprovação, payloads de prompt de reação, armazenamentos de alvo de reação, auxiliares de texto de dica de reação e exportação de compatibilidade para supressão de prompt de exec nativo local |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de exec/Plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de payload de aprovação de exec/Plugin, auxiliares nativos de roteamento/runtime de aprovação e auxiliares estruturados de exibição de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares estreitos de redefinição de desduplicação de resposta recebida |
    | `plugin-sdk/channel-contract-testing` | Auxiliares estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação de comando nativo, formatação dinâmica de menu de argumentos e auxiliares nativos de alvo de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos de canal em hot path |
    | `plugin-sdk/command-surface` | Normalização de corpo de comando e auxiliares de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Auxiliares lazy de fluxo de login de autenticação de provedor para pareamento por código de dispositivo em canal privado e Web UI |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de coleta de contrato de segredo para superfícies de segredo de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares estreitos de tipagem `coerceSecretRef` e SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/secret-provider-integration` | Manifesto somente de tipos de integração de provedor SecretRef e contratos de predefinições para plugins que publicam predefinições externas de provedor de segredos |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, bloqueio de DM, arquivos/caminhos limitados à raiz, incluindo gravações somente de criação, substituição atômica de arquivo síncrona/assíncrona, gravações temporárias irmãs, fallback de movimentação entre dispositivos, auxiliares privados de armazenamento de arquivos, guardas de pai de symlink, conteúdo externo, redação de texto sensível, comparação de segredo em tempo constante e auxiliares de coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de lista de permissões de hosts e política SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares estreitos de dispatcher fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fixado, fetch protegido contra SSRF, erro SSRF e auxiliares de política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de requisição/alvo de Webhook e coerção bruta de websocket/corpo |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho/timeout do corpo da requisição |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de tempo de execução, geração de logs, backup e instalação de plugins |
    | `plugin-sdk/runtime-env` | Auxiliares restritos de ambiente de tempo de execução, logger, tempo limite, repetição e backoff |
    | `plugin-sdk/browser-config` | Fachada de configuração de navegador compatível para perfil/padrões normalizados, análise de URL CDP e auxiliares de autenticação de controle de navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Auxiliares genéricos de ciclo de vida de tarefa e entrega de conclusão para agentes apoiados por harness usando um escopo de tarefa emitido pelo host |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar Codex empacotado reservado para projetar a configuração de servidor MCP do usuário na configuração de thread do Codex; não destinado a plugins de terceiros |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar Codex empacotado privado para espelhamento nativo de tarefas e fiação de tempo de execução; não destinado a plugins de terceiros |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e consulta de contexto de tempo de execução de canal |
    | `plugin-sdk/matrix` | Fachada obsoleta de compatibilidade com Matrix para pacotes de canal de terceiros mais antigos; novos plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Fachada obsoleta de compatibilidade com Mattermost para pacotes de canal de terceiros mais antigos; novos plugins devem importar subcaminhos genéricos do SDK diretamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação/vinculação preguiçosa de tempo de execução, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processo |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação da CLI, espera, versão, invocação por argumentos e grupos de comandos preguiçosos |
    | `plugin-sdk/qa-live-transport-scenarios` | IDs compartilhados de cenários de QA de transporte ao vivo, auxiliares de cobertura de linha de base e auxiliar de seleção de cenários |
    | `plugin-sdk/gateway-method-runtime` | Auxiliar reservado de despacho de método do Gateway para rotas HTTP de Plugin que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente Gateway, auxiliar de início de cliente pronto para loop de eventos, RPC da CLI do Gateway, erros de protocolo do Gateway, resolução de host LAN anunciado e auxiliares de patch de status de canal |
    | `plugin-sdk/config-contracts` | Superfície focada de configuração somente de tipos para formatos de configuração de Plugin, como `OpenClawConfig`, e tipos de configuração de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de consulta de configuração de Plugin em tempo de execução, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares transacionais de mutação de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Strings compartilhadas de dica de metadados de entrega de ferramenta de mensagem |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares de snapshot de configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot de teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comandos do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram empacotado não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de texto |
    | `plugin-sdk/approval-reaction-runtime` | Vinculações codificadas de reação de aprovação, payloads de prompt de reação, armazenamentos de alvo de reação, auxiliares de texto de dica de reação e exportação de compatibilidade para supressão de prompt de execução nativa local |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de execução/Plugin, construtores de capacidade de aprovação, auxiliares de autenticação/perfil, auxiliares de roteamento/tempo de execução nativos e formatação de caminho de exibição estruturada de aprovação |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de tempo de execução de entrada/resposta, fragmentação, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares restritos de despacho/finalização de resposta e rótulo de conversa |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de respostas de janela curta. O novo código de turno de mensagem deve usar `createChannelHistoryWindow`; auxiliares de mapa de nível mais baixo permanecem apenas como exportações obsoletas de compatibilidade |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares restritos de fragmentação de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de fluxo de trabalho de sessão (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), leituras limitadas de texto de transcrição recente de usuário/assistente por identidade de sessão, auxiliares legados de caminho de armazenamento de sessão/chave de sessão, leituras de updated-at e auxiliares de compatibilidade somente de transição para armazenamento inteiro/caminho de arquivo |
    | `plugin-sdk/session-transcript-runtime` | Identidade de transcrição, auxiliares com escopo para alvo/leitura/gravação, publicação de atualizações, bloqueios de gravação e chaves de acerto de memória de transcrição |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de esquema de agente SQLite, caminho e transação para tempo de execução próprio |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de caminho/carregamento/salvamento de armazenamento Cron |
    | `plugin-sdk/state-paths` | Auxiliares de caminho de diretório de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado por chave em SQLite de sidecar de Plugin, mais configuração centralizada de pragma de conexão e manutenção de WAL para bancos de dados pertencentes a plugins |
    | `plugin-sdk/routing` | Auxiliares de rota/chave de sessão/vinculação de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de tempo de execução e auxiliares de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolução de alvo |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs em string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comandos temporizados com resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-plugin` | Definir um Plugin simples e tipado de ferramenta de agente e expor metadados estáticos para geração de manifesto |
    | `plugin-sdk/tool-payload` | Extrair payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de alvo de envio de argumentos de ferramenta |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox e auxiliares de comandos SSH/OpenShell, incluindo preflight de comando de execução com falha rápida |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho de download temporário e espaços de trabalho temporários privados seguros |
    | `plugin-sdk/logging-core` | Auxiliares de logger e redação de subsistema |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo e conversão de tabelas Markdown |
    | `plugin-sdk/model-session-runtime` | Auxiliares de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolução de configuração de provedor de fala |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/gravação de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Auxiliares de análise JSON que preservam literais inteiros inseguros como strings |
    | `plugin-sdk/file-lock` | Auxiliares de bloqueio de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de deduplicação respaldado por disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de tempo de execução/sessão e despacho de resposta de ACP |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares leves de registro de backend ACP e despacho de resposta para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vinculação ACP sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas restritas de esquema de configuração de tempo de execução de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivas compartilhadas de canal passivo, status e auxiliar de proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta de comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/construção/serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, auxiliares para direcionar/abortar execução ativa, auxiliares de ponte de ferramentas do OpenClaw, auxiliares de política de ferramenta de plano de tempo de execução, classificação de resultado terminal, auxiliares de formatação/detalhe de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detecção de endpoint pertencente ao provedor Z.AI; use a API pública do Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de bloqueio assíncrono local ao processo para pequenos arquivos de estado de tempo de execução |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de cache de deduplicação em memória e com respaldo persistente |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de drenagem de entrega pendente de saída |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros de caminho de arquivo local e fonte de mídia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de ativação, evento e visibilidade de Heartbeat |
    | `plugin-sdk/number-runtime` | Auxiliar de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares de token/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Auxiliares de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera de prontidão de transporte |
    | `plugin-sdk/exec-approvals-runtime` | Auxiliares de arquivo de política de aprovação de execução sem o barrel amplo de infra de tempo de execução |
    | `plugin-sdk/infra-runtime` | Shim obsoleto de compatibilidade; use os subcaminhos focados de tempo de execução acima |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de flag de diagnóstico, evento e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, auxiliares compartilhados de classificação de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Auxiliares de fetch encapsulado, proxy, opção EnvHttpProxyAgent e lookup fixado |
    | `plugin-sdk/runtime-fetch` | Fetch de tempo de execução ciente de dispatcher sem importações de proxy/fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Auxiliares de sanitização de URL de dados de imagem inline e detecção de assinatura sem a superfície ampla de tempo de execução de mídia |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de tempo de execução de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vinculação de conversa sem roteamento de vinculação configurado ou armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de armazenamento de sessão sem importações amplas de gravações/manutenção de configuração |
    | `plugin-sdk/sqlite-runtime` | Auxiliares focados de esquema de agente SQLite, caminho e transação sem controles de ciclo de vida de banco de dados |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares restritos de coerção e normalização de registro primitivo/string sem importações de markdown/logging |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de nome de host e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuração de repetição e executor de repetição |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/espaço de trabalho de agente, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e exportação obsoleta de compatibilidade `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de busca/transformação/armazenamento de mídia, incluindo `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e o obsoleto `fetchRemoteMedia`; prefira helpers de armazenamento antes de leituras de buffer quando uma URL deve se tornar mídia do OpenClaw |
    | `plugin-sdk/media-mime` | Normalização restrita de MIME, mapeamento de extensão de arquivo, detecção de MIME e helpers de tipo de mídia |
    | `plugin-sdk/media-store` | Helpers restritos de armazenamento de mídia, como `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia, além de exportações de helpers de imagem/áudio/extração estruturada voltados para provedores |
    | `plugin-sdk/text-chunking` | Helpers de fragmentação/renderização de texto e markdown, conversão de tabelas markdown, remoção de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentação de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de exportações de diretiva, registro, validação, construtor de TTS compatível com OpenAI e helpers de fala voltados para provedores |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva, normalização e exportações de helpers de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real, helpers de registro e helper compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper de inicialização de perfil em tempo real para injeção de contexto delimitada de `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real, helpers de registro e helpers compartilhados de comportamento de voz em tempo real, incluindo rastreamento de atividade de saída |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagens, além de helpers de asset de imagem/URL de dados e o construtor de provedor de imagem compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagens, failover, autenticação e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, busca de provedor e análise de ref de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, busca de provedor e análise de ref de modelo |
    | `plugin-sdk/transcripts` | Tipos compartilhados de provedor de fonte de transcrições, helpers de registro, descritores de sessão e metadados de enunciado |
    | `plugin-sdk/webhook-targets` | Registro de destino de Webhook e helpers de instalação de rotas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidade obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexportação de compatibilidade obsoleta; importe `zod` de `zod` diretamente |
    | `plugin-sdk/testing` | Barril de compatibilidade obsoleto local do repositório para testes legados do OpenClaw. Novos testes do repositório devem importar subcaminhos locais focados, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper mínimo `createTestPluginApi` local do repositório para testes unitários de registro direto de Plugin sem importar pontes de helper de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato de adaptador nativo de runtime de agente locais do repositório para testes de autenticação, entrega, fallback, gancho de ferramenta, sobreposição de prompt, esquema e projeção de transcrição |
    | `plugin-sdk/channel-test-helpers` | Helpers de teste orientados a canal locais do repositório para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, encadeamento de configuração de envio, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada local do repositório de casos de erro de resolução de destino para testes de canal |
    | `plugin-sdk/plugin-test-contracts` | Helpers locais do repositório para contratos de pacote de Plugin, registro, artefato público, importação direta, API de runtime e efeito colateral de importação |
    | `plugin-sdk/provider-test-contracts` | Helpers locais do repositório para contratos de runtime de provedor, autenticação, descoberta, integração, catálogo, assistente, capacidade de mídia, política de repetição, áudio ao vivo STT em tempo real, busca/captura na web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação Vitest opcionais locais do repositório para testes de provedor que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas locais do repositório para captura de runtime de CLI, contexto de sandbox, escritor de skill, mensagem de agente, evento de sistema, recarregamento de módulo, caminho de Plugin empacotado, texto de terminal, fragmentação, token de autenticação e caso tipado |
    | `plugin-sdk/test-node-mocks` | Helpers focados de mock de recursos nativos do Node locais do repositório para uso dentro de factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície empacotada de helper de memory-core para helpers de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helpers leves de registro de provedor de embeddings de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de fundação do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embedding do host de memória, acesso ao registro, provedor local e helpers genéricos de lote/remoto. `registerMemoryEmbeddingProvider` nesta superfície está obsoleto; use a API genérica de provedor de embedding para novos provedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime principal do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro quanto a fornecedor para helpers de runtime principal do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro quanto a fornecedor para helpers de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subcaminhos reservados de helpers empacotados">
    Subcaminhos reservados do SDK de helpers empacotados são superfícies restritas
    específicas de proprietários para código de Plugin empacotado. Eles são rastreados no inventário do SDK para que builds
    de pacote e aliasing permaneçam determinísticos, mas não são APIs gerais
    de autoria de Plugin. Novos contratos reutilizáveis de host devem usar subcaminhos genéricos do SDK,
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Subcaminho | Proprietário e finalidade |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper do Plugin Codex empacotado para projetar a configuração de servidor MCP do usuário na configuração de thread do servidor de aplicativo Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper do Plugin Codex empacotado para espelhar subagentes nativos do servidor de aplicativo Codex no estado de tarefa do OpenClaw |

  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
