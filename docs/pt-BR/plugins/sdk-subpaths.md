---
read_when:
    - Escolha do subcaminho correto do plugin-sdk para a importação de um plugin
    - Auditoria de subcaminhos de plugins incluídos e superfícies auxiliares
summary: 'Catálogo de subcaminhos do SDK de Plugins: quais importações ficam onde, agrupadas por área'
title: Subcaminhos do SDK de Plugins
x-i18n:
    generated_at: "2026-07-16T12:49:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de plugins é exposto como um conjunto de subcaminhos públicos específicos em
`openclaw/plugin-sdk/`. Esta página cataloga os subcaminhos mais usados, agrupados por
finalidade. Três arquivos definem a superfície:

- `scripts/lib/plugin-sdk-entrypoints.json`: o inventário de pontos de entrada mantido
  que a compilação compila.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subcaminhos internos/de teste
  locais do repositório. As exportações do pacote correspondem ao inventário menos esta lista.
- `src/plugin-sdk/entrypoints.ts`: metadados de classificação para subcaminhos
  obsoletos, auxiliares integrados reservados, fachadas integradas compatíveis e
  superfícies públicas pertencentes a plugins.

Os mantenedores auditam a contagem de exportações públicas com `pnpm plugin-sdk:surface` e
os subcaminhos ativos de auxiliares reservados com `pnpm plugins:boundary-report:summary`;
exportações de auxiliares reservados não utilizadas fazem o relatório de CI falhar, em vez de permanecerem no
SDK público como dívida de compatibilidade inativa.

Para consultar o guia de criação de plugins, consulte a [visão geral do SDK de plugins](/pt-BR/plugins/sdk-overview).

## Entrada do Plugin

| Subcaminho                     | Principais exportações                                                                                                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Auxiliares de itens do provedor de migração, como `createMigrationItem`, constantes de motivos, marcadores de status de itens, auxiliares de redação e `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Auxiliares de migração em tempo de execução, como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Registro, detecção, reparo, seleção, gravidade e tipos de constatação de verificações de integridade do Doctor para consumidores de integridade integrados                                                        |
| `plugin-sdk/config-schema`     | Obsoleto. Esquema Zod raiz `openclaw.json` (`OpenClawSchema`); em vez disso, defina esquemas locais do plugin e valide com `plugin-sdk/json-schema-runtime`                                                  |

### Auxiliares obsoletos de compatibilidade e teste

Os subcaminhos obsoletos continuam exportados para plugins mais antigos, mas códigos novos devem usar os
subcaminhos específicos do SDK abaixo. A lista mantida é
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; a CI rejeita
importações de produção integradas provenientes dela. Barris amplos como `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` e
`plugin-sdk/text-runtime` servem apenas para compatibilidade, e `plugin-sdk/zod` é uma
reexportação de compatibilidade: importe `zod` diretamente de `zod`. Os barris amplos de
domínio `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` e
`plugin-sdk/security-runtime` também estão obsoletos em favor de
subcaminhos específicos.

Os subcaminhos de auxiliares de teste do OpenClaw baseados no Vitest são somente locais do repositório e não são
mais exportações do pacote: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` e `testing`. As superfícies privadas de auxiliares integrados
`ssrf-runtime-internal` e `codex-native-task-runtime` também são somente
locais do repositório.

### Subcaminhos reservados de auxiliares de plugins integrados

`plugin-sdk/codex-mcp-projection` é o único subcaminho reservado: uma superfície de
compatibilidade pertencente ao plugin para o plugin Codex integrado, e não uma API geral do SDK.
As importações de plugins entre proprietários são bloqueadas pelas proteções do contrato do pacote, e
a CI falha quando um subcaminho reservado deixa de ser importado.
`plugin-sdk/codex-native-task-runtime` é somente local do repositório e não é uma
exportação do pacote.

`src/plugin-sdk/entrypoints.ts` também rastreia fachadas integradas compatíveis, pontos de entrada do SDK
providos pelos respectivos plugins integrados até que contratos genéricos os
substituam: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` e `plugin-sdk/zalouser`. Vários deles também estão
obsoletos para códigos novos; consulte as observações de cada linha abaixo.

  <AccordionGroup>
  <Accordion title="Subcaminhos de canais">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Auxiliar de validação de JSON Schema com cache para esquemas pertencentes a plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, tradutor de configuração, prompts de listas de permissões e construtores de status da configuração |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração de várias contas e de controle de ações, além de auxiliares de fallback para a conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de consulta de conta e fallback para a conta padrão |
    | `plugin-sdk/account-helpers` | Auxiliares específicos para listagem de contas e ações de conta |
    | `plugin-sdk/access-groups` | Auxiliares de análise de listas de permissões de grupos de acesso e diagnóstico de grupos com dados ocultados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartilhadas de esquema de configuração de canais, além de Zod e construtores diretos de JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canais integrados ao OpenClaw somente para plugins integrados e mantidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. IDs canônicos de canais de chat integrados/oficiais, além de rótulos/aliases de formatação para plugins que precisam reconhecer texto prefixado por envelope sem codificar diretamente sua própria tabela. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canais integrados |
    | `plugin-sdk/telegram-command-config` | Normalização obsoleta de nomes/descrições de comandos do Telegram e verificações de duplicatas/conflitos; em código novo de plugin, use o tratamento de configuração de comandos local do plugin |
    | `plugin-sdk/command-gating` | Auxiliares específicos de controle de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor experimental de alto nível do runtime de entrada de canais e construtores de fatos de rota para caminhos migrados de recebimento de canais. Prefira isso a montar listas de permissões efetivas, listas de permissões de comandos e projeções legadas em cada plugin. Consulte a [API de entrada de canais](/pt-BR/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos de ciclo de vida de mensagens, além de opções do pipeline de respostas, confirmações, pré-visualização ao vivo/streaming, auxiliares de ciclo de vida, identidade de saída, planejamento de payloads, envios duráveis e auxiliares de contexto de envio de mensagens. Consulte a [API de saída de canais](/pt-BR/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados para construção de rotas de entrada e envelopes |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-inbound` para executores de entrada e predicados de despacho, e `plugin-sdk/channel-outbound` para auxiliares de entrega de mensagens. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análise de destino; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída e estado de mídia hospedada |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Auxiliares específicos de normalização de enquetes |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptadores de vinculação de threads |
    | `plugin-sdk/agent-media-payload` | Raízes e carregadores de payloads de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Barrel amplo obsoleto para vinculação de conversas/threads, pareamento e auxiliares de vinculações configuradas; prefira subcaminhos de vinculação específicos, como `plugin-sdk/thread-bindings-runtime` e `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de políticas de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de instantâneo/resumo do status de canais |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquema de configuração de canais |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização para gravação da configuração de canais |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de preâmbulo de plugins de canais |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura da configuração de listas de permissões |
    | `plugin-sdk/group-access` | Auxiliares obsoletos de decisão de acesso a grupos; use `resolveChannelMessageIngress` de `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Auxiliares específicos de política de proteção pré-criptografia para DMs diretas |
    | `plugin-sdk/discord` | Fachada de compatibilidade obsoleta do Discord para `@openclaw/discord@2026.3.13` publicado e compatibilidade monitorada pelo proprietário; plugins novos devem usar subcaminhos genéricos do SDK de canais |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de contas do Telegram para compatibilidade monitorada pelo proprietário; plugins novos devem usar auxiliares de runtime injetados ou subcaminhos genéricos do SDK de canais |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade do Zalo Personal para pacotes publicados do Lark/Zalo que ainda importam autorização de comandos do remetente; plugins novos devem usar subcaminhos genéricos do SDK de canais |
    | `plugin-sdk/interactive-runtime` | Auxiliares de apresentação semântica de mensagens, entrega e respostas interativas legadas. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Auxiliares compartilhados de entrada para classificação de eventos, construção de contexto, formatação, raízes, debounce, correspondência de menções, política de menções e registro de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares específicos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares específicos de política de menções, marcadores de menção e texto de menções, sem a superfície mais ampla do runtime de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ações de mensagens de canais, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade com plugins |
    | `plugin-sdk/channel-route` | Normalização compartilhada de rotas, resolução de destinos orientada por parser, conversão de IDs de thread em strings, chaves de rota compactas/para desduplicação, tipos de destinos analisados e auxiliares de comparação de rotas/destinos |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de destinos; chamadores de comparação de rotas devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canais |
    | `plugin-sdk/channel-feedback` | Integração de feedback/reações |
  </Accordion>

As famílias obsoletas de auxiliares de canal permanecem disponíveis apenas para
compatibilidade com plugins publicados. O plano de remoção é: mantê-las durante a
janela de migração de plugins externos, manter os plugins do repositório/incluídos em `channel-inbound` e
`channel-outbound` e, em seguida, remover os subcaminhos de compatibilidade na próxima grande
limpeza do SDK. Isso se aplica às antigas famílias de mensagens/runtime de canal, streaming
de canal, acesso direto a DMs, auxiliares fragmentados de entrada, opções de resposta
e caminhos de pareamento.

  <Accordion title="Subcaminhos de provedores">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatível do provedor LM Studio para configuração, descoberta de catálogo e preparação de modelos em tempo de execução |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatível de tempo de execução do LM Studio para padrões do servidor local, descoberta de modelos, cabeçalhos de requisição e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedores locais/auto-hospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares obsoletos de configuração auto-hospedada compatível com OpenAI; use `plugin-sdk/provider-setup` ou auxiliares de configuração pertencentes ao plugin |
    | `plugin-sdk/cli-backend` | Padrões do backend da CLI + constantes do watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de tempo de execução para autenticação de provedores: fluxo OAuth de loopback, troca de tokens, persistência de autenticação e resolução de chave de API |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de provedores, renderização da página de callback, auxiliares de PKCE/estado, análise da entrada de autorização, auxiliares de expiração de tokens e auxiliares de cancelamento |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de integração/gravação de perfil com chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de consulta de variáveis de ambiente para autenticação de provedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importação de autenticação do OpenAI Codex, exportação obsoleta de compatibilidade `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de políticas de repetição, auxiliares de endpoints de provedores e auxiliares compartilhados de normalização de IDs de modelos |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares de catálogo de modelos de provedores ativos para descoberta protegida no estilo de `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtragem de IDs de modelos, cache TTL e fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Gancho de tempo de execução para ampliação do catálogo de provedores e pontos de integração do registro de provedores de plugins para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de recursos HTTP/endpoints de provedores, erros HTTP de provedores e auxiliares de formulários multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares restritos do contrato de configuração/seleção de busca na web, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedores de busca na web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares restritos de configuração/credenciais de pesquisa na web para provedores que não precisam de vinculação para habilitação do plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares restritos do contrato de configuração/credenciais de pesquisa na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e definidores/obtentores de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/tempo de execução de provedores de pesquisa na web |
    | `plugin-sdk/embedding-providers` | Tipos gerais de provedores de embeddings e auxiliares de leitura, incluindo `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; os plugins registram provedores por meio de `api.registerEmbeddingProvider(...)` para garantir a propriedade do manifesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de esquemas + diagnósticos do DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de snapshots de uso de provedores, auxiliares compartilhados de obtenção de uso e coletores de provedores, como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de fluxo, compatibilidade com chamadas de ferramentas em texto simples e auxiliares compartilhados de wrappers do Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartilhados de wrappers de fluxo de provedores, incluindo `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilitários de fluxo compatíveis com Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativos de provedores, como busca protegida, extração de texto de resultados de ferramentas, transformações de mensagens de transporte e fluxos graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de aplicação de patches à configuração de integração |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares restritos de modo de ativação em grupo e análise de comandos |
  </Accordion>

Os snapshots de uso de provedores normalmente relatam uma ou mais `windows` de cota, cada uma com
um rótulo, percentual usado e horário opcional de redefinição. Provedores que expõem saldo ou
texto de estado da conta em vez de janelas de cota redefiníveis devem retornar
`summary` com um array `windows` vazio, em vez de fabricar percentuais.
O OpenClaw exibe esse texto de resumo na saída de status; use `error` somente quando o
endpoint de uso falhar ou não retornar dados de uso utilizáveis.

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superfície ampla obsoleta de autorização de comandos (`resolveControlCommandGate`, auxiliares do registro de comandos, incluindo formatação dinâmica de menus de argumentos, auxiliares de autorização do remetente); use a autorização de entrada/tempo de execução do canal ou auxiliares de status de comandos |
    | `plugin-sdk/command-status` | Construtores de mensagens de comandos/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovadores e autenticação de ações no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares nativos de perfil/filtro de aprovação de execução |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de recursos/entrega de aprovações |
    | `plugin-sdk/approval-gateway-runtime` | Resolvedor compartilhado do Gateway de aprovações |
    | `plugin-sdk/approval-reference-runtime` | Auxiliar determinístico de localização durável para callbacks de aprovação limitados pelo transporte |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptadores nativos de aprovação para pontos de entrada de canal de alta frequência |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de tempo de execução de manipuladores de aprovação; prefira os pontos de integração mais restritos de adaptador/Gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprovação, vinculação de conta, bloqueio de rota, fallback de encaminhamento e supressão local do prompt nativo de execução |
    | `plugin-sdk/approval-reaction-runtime` | Vinculações codificadas de reações de aprovação, cargas de prompts de reação, armazenamentos de destinos de reação, auxiliares de texto de dicas de reação e exportação de compatibilidade para supressão local do prompt nativo de execução |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de cargas de resposta de aprovação de execução/plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de cargas de aprovação de execução/plugin, construtores de recursos de aprovação, auxiliares de autenticação/perfil de aprovação, auxiliares nativos de roteamento/tempo de execução de aprovações e auxiliares estruturados de exibição de aprovações, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares restritos obsoletos de redefinição da desduplicação de respostas recebidas |
    | `plugin-sdk/command-auth-native` | Autenticação de comandos nativos, formatação dinâmica de menus de argumentos e auxiliares nativos de destino de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comandos para caminhos de canal de alta frequência |
    | `plugin-sdk/command-surface` | Auxiliares de normalização do corpo de comandos e da superfície de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Auxiliares de fluxo de login de autenticação de provedores com carregamento sob demanda para emparelhamento por código de dispositivo em canais privados e na Web UI |
    | `plugin-sdk/channel-secret-runtime` | Superfície ampla obsoleta do contrato de segredos (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipos de destinos de segredos); prefira os subcaminhos específicos abaixo |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportações restritas do contrato de segredos e construtores do registro de destinos para superfícies de segredos de canais/plugins que não sejam TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Auxiliares restritos de atribuição de segredos TTS aninhados de canais |
    | `plugin-sdk/secret-ref-runtime` | Tipagem, resolução e consulta de caminhos de destinos do plano restritas para SecretRef na análise de contratos de segredos/configurações |
    | `plugin-sdk/secret-provider-integration` | Contratos somente de tipos de manifesto e predefinições de integração de provedores SecretRef para plugins que publicam predefinições de provedores externos de segredos |
    | `plugin-sdk/security-runtime` | Barrel amplo obsoleto para confiança, bloqueio de DMs, auxiliares de arquivos/caminhos restritos à raiz, incluindo gravações somente para criação, substituição atômica síncrona/assíncrona de arquivos, gravações temporárias adjacentes, fallback de movimentação entre dispositivos, auxiliares de armazenamento privado de arquivos, proteções contra pais de links simbólicos, conteúdo externo, ocultação de texto confidencial, comparação de segredos em tempo constante e auxiliares de coleta de segredos; prefira subcaminhos específicos de segurança/SSRF/segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de lista de permissões de hosts e políticas SSRF para redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares restritos de dispatcher fixado sem a ampla superfície de tempo de execução da infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de dispatcher fixado, busca protegida contra SSRF, erro de SSRF e políticas de SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise da entrada de segredos |
    | `plugin-sdk/webhook-ingress` | Auxiliares de requisições/destinos de Webhook e coerção de websocket/corpo brutos |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho/tempo limite do corpo da requisição e `runDetachedWebhookWork` para processamento rastreado após a confirmação |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares de runtime/logs/backup, avisos de caminhos de instalação de plugins e auxiliares de processo |
    | `plugin-sdk/runtime-env` | Auxiliares específicos de ambiente de runtime, logger, tempo limite, nova tentativa e recuo |
    | `plugin-sdk/browser-config` | Fachada compatível de configuração do navegador para perfil/padrões normalizados, análise de URL CDP e auxiliares de autenticação do controle do navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Auxiliares genéricos de ciclo de vida de tarefas e entrega de conclusão para agentes baseados em harness que usam um escopo de tarefa emitido pelo host |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar reservado do Codex incluído no pacote para projetar a configuração de servidores MCP do usuário na configuração de threads do Codex; não destinado a plugins de terceiros |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar do Codex incluído no pacote e local ao repositório para a integração nativa do espelho/runtime de tarefas; não é uma exportação de pacote |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e consulta do contexto de runtime do canal |
    | `plugin-sdk/matrix` | Fachada obsoleta de compatibilidade com Matrix para pacotes antigos de canais de terceiros; novos plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Fachada obsoleta de compatibilidade com Mattermost para pacotes antigos de canais de terceiros; novos plugins devem importar diretamente subcaminhos genéricos do SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel amplo obsoleto para auxiliares de comandos/hooks/HTTP/interação de plugins; prefira subcaminhos específicos do runtime de plugins |
    | `plugin-sdk/hook-runtime` | Barrel amplo obsoleto para auxiliares do pipeline de Webhook/hooks internos; prefira subcaminhos específicos de hooks/runtime de plugins |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação/vinculação tardia de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processos |
    | `plugin-sdk/node-host` | Auxiliares de resolução de executáveis no host Node e retomada de PTY |
    | `plugin-sdk/cli-runtime` | Barrel amplo obsoleto para formatação da CLI, espera, versão, invocação de argumentos e auxiliares de grupos de comandos com carregamento tardio; prefira subcaminhos específicos da CLI/runtime |
    | `plugin-sdk/qa-runner-runtime` | Fachada compatível que expõe cenários de QA de plugins pela superfície de comandos da CLI |
    | `plugin-sdk/tts-runtime` | Fachada compatível para esquemas de configuração e auxiliares de runtime de conversão de texto em fala |
    | `plugin-sdk/gateway-method-runtime` | Auxiliar reservado de despacho de métodos do Gateway para rotas HTTP de plugins que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente do Gateway, auxiliar de inicialização do cliente preparado para o loop de eventos, RPC da CLI do Gateway, erros do protocolo do Gateway, resolução do host LAN anunciado e auxiliares de patch do status de canais |
    | `plugin-sdk/config-contracts` | Superfície de configuração específica somente de tipos para formatos de configuração de plugins, como `OpenClawConfig`, e tipos de configuração de canais/provedores |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de configuração de plugins em runtime, como `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares de mutação transacional de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Strings compartilhadas de dicas de metadados de entrega da ferramenta de mensagens |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares de snapshot da configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e definidores de snapshots para testes |
    | `plugin-sdk/text-autolink-runtime` | Detecção de links automáticos para referências de arquivos sem o barrel amplo de texto |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime para entrada/resposta, divisão em blocos, despacho, Heartbeat e planejador de respostas |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares específicos de despacho/finalização de respostas e rótulos de conversas |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de respostas em uma janela curta. O novo código de turnos de mensagens deve usar `createChannelHistoryWindow`; auxiliares de mapa de nível inferior permanecem apenas como exportações obsoletas de compatibilidade |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares específicos para dividir texto/Markdown em blocos |
    | `plugin-sdk/session-store-runtime` | Auxiliares de fluxo de trabalho de sessões (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), auxiliares de reparo/ciclo de vida (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), auxiliares de marcadores para valores transitórios de `sessionFile`, leituras limitadas de texto recente da transcrição de usuário/assistente por identidade de sessão, auxiliares de caminho do armazenamento de sessões/chave de sessão e leituras de data de atualização, sem importações amplas de gravação/manutenção de configuração |
    | `plugin-sdk/session-transcript-runtime` | Identidade de transcrição, auxiliares com escopo de destino/leitura/gravação, projeção de entradas de mensagens visíveis, publicação de atualizações, bloqueios de gravação e chaves de acerto da memória de transcrições |
    | `plugin-sdk/sqlite-runtime` | Auxiliares específicos de esquema de agente SQLite, caminho e transação para runtime próprio, sem controles do ciclo de vida do banco de dados |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de caminho/carregamento/salvamento do armazenamento do Cron |
    | `plugin-sdk/state-paths` | Auxiliares de caminho dos diretórios de estado/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado com chave em SQLite auxiliar de plugins, além de pragma de conexão centralizado, manutenção verificada de WAL e auxiliares de migração atômica de esquema STRICT para bancos de dados pertencentes a plugins |
    | `plugin-sdk/routing` | Auxiliares de vinculação de rota/chave de sessão/conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo do status de canais/contas, padrões do estado de runtime e auxiliares de metadados de problemas |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolução de destinos |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slugs/strings |
    | `plugin-sdk/request-url` | Extração de URLs em strings de entradas semelhantes a fetch/solicitação |
    | `plugin-sdk/run-command` | Executor de comandos com limite de tempo e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramentas/CLI |
    | `plugin-sdk/tool-plugin` | Definição de um plugin simples e tipado de ferramentas de agente e exposição de metadados estáticos para geração de manifestos |
    | `plugin-sdk/tool-payload` | Extração de cargas normalizadas de objetos de resultados de ferramentas |
    | `plugin-sdk/tool-send` | Extração de campos canônicos de destino de envio dos argumentos da ferramenta |
    | `plugin-sdk/sandbox` | Tipos de backends de sandbox e auxiliares de comandos SSH/OpenShell, incluindo verificação preliminar de comandos de execução com falha imediata |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminhos de downloads temporários e espaços de trabalho temporários privados e seguros |
    | `plugin-sdk/logging-core` | Auxiliares de logger e redação de subsistemas |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo e conversão de tabelas Markdown |
    | `plugin-sdk/model-session-runtime` | Auxiliares de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolução da configuração do provedor de conversação |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/gravação de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Auxiliares de análise de JSON que preservam literais inteiros inseguros como strings |
    | `plugin-sdk/file-lock` | Auxiliares de bloqueio de arquivos reentrantes |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de desduplicação respaldado por disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sessão e despacho de respostas do ACP |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares leves de registro de backends e despacho de respostas do ACP para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vinculações do ACP sem importações de inicialização do ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas obsoletas de esquema de configuração do runtime de agentes; importe primitivas de esquema de uma superfície mantida e pertencente ao plugin |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de inicialização de dispositivos e tokens de pareamento, incluindo `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitivas compartilhadas de auxiliares de canais passivos, status e proxy de ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de respostas de comandos/provedores de `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/criação/serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental para plugins confiáveis destinada a harnesses de agentes de baixo nível: tipos de harness, auxiliares para orientar/abortar execuções ativas, auxiliares da ponte de ferramentas do OpenClaw, auxiliares de políticas de ferramentas do plano de runtime, classificação de resultados de terminal, auxiliares de formatação/detalhamento do progresso de ferramentas e utilitários de resultados de tentativas |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detecção de endpoints pertencente ao provedor Z.AI; use a API pública do plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de bloqueio assíncrono local ao processo para pequenos arquivos de estado de runtime |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetria da atividade de canais |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de cache de desduplicação em memória e com persistência |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de drenagem de entregas de saída pendentes |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros de caminhos de arquivos locais e fontes de mídia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de ativação, eventos e visibilidade do Heartbeat |
    | `plugin-sdk/expect-runtime` | Auxiliar de asserção de valores obrigatórios para invariantes comprováveis de runtime |
    | `plugin-sdk/number-runtime` | Auxiliar de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares seguros de token/UUID |
    | `plugin-sdk/system-event-runtime` | Auxiliares da fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera pela disponibilidade do transporte |
    | `plugin-sdk/exec-approvals-runtime` | Auxiliares de arquivos de políticas de aprovação de execução sem o barrel amplo de runtime de infraestrutura |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos específicos de runtime acima |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de flags de diagnóstico, eventos e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, auxiliares compartilhados de classificação de erros, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Auxiliares de fetch encapsulado, proxy, opção EnvHttpProxyAgent e consulta fixada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime compatível com dispatcher, sem importações de proxy/fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Auxiliares de sanitização de URLs de dados de imagens inline e detecção de assinaturas, sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/response-limit-runtime` | Leitores de corpo de resposta limitados por bytes, inatividade e prazo, sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vinculação de conversas, sem roteamento de vinculações configuradas nem armazenamentos de pareamento |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar, sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares específicos de coerção e normalização primitivas de registros/strings, sem importações de Markdown/logs |
    | `plugin-sdk/html-entity-runtime` | Decodificação em passagem única de entidades HTML5 terminadas por ponto e vírgula, sem utilitários amplos de texto |
    | `plugin-sdk/text-utility-runtime` | Auxiliares de texto e caminho de baixo nível, incluindo escape das cinco entidades HTML |
    | `plugin-sdk/widget-html` | Detecção de documentos completos, validação de tamanho e erros de entrada de ferramentas para widgets HTML autocontidos |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de nomes de host e hosts SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuração e execução de novas tentativas |
    | `plugin-sdk/agent-runtime` | Barrel amplo obsoleto para auxiliares de diretório/identidade/espaço de trabalho de agentes, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e a exportação obsoleta de compatibilidade `resolveOpenClawAgentDir`; prefira subcaminhos específicos de agente/runtime |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicação de diretórios baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de recursos e testes">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel amplo de mídia obsoleto, incluindo `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e o obsoleto `fetchRemoteMedia`; prefira `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` e os subcaminhos de runtime de recursos, e prefira os auxiliares de armazenamento antes das leituras de buffer quando uma URL precisar se tornar uma mídia do OpenClaw |
    | `plugin-sdk/media-mime` | Auxiliares específicos para normalização de MIME, mapeamento de extensão de arquivo, detecção de MIME e tipo de mídia |
    | `plugin-sdk/media-store` | Auxiliares específicos de armazenamento de mídia, como `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de failover para geração de mídia, seleção de candidatos e mensagens sobre modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedores de compreensão de mídia, além de exportações de auxiliares voltados a provedores para imagem, áudio e extração estruturada |
    | `plugin-sdk/text-chunking` | Fragmentação de texto de saída e de intervalos com preservação de deslocamentos, fragmentação de Markdown e auxiliares de renderização, tokenização de tags HTML com reconhecimento de aspas, conversão de tabelas Markdown, remoção de tags de diretivas e utilitários de texto seguro |
    | `plugin-sdk/speech` | Tipos de provedores de fala, além de exportações voltadas a provedores para diretivas, registro, validação, construtor de TTS compatível com OpenAI e auxiliares de fala |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedores de fala e exportações de registro, diretivas, normalização e auxiliares de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedores de transcrição em tempo real, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Auxiliar de inicialização de perfil em tempo real para injeção limitada de contexto de `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de provedores de voz em tempo real, auxiliares de registro e auxiliares compartilhados de comportamento de voz em tempo real, incluindo rastreamento da atividade de saída |
    | `plugin-sdk/image-generation` | Tipos de provedores de geração de imagens, além de auxiliares de ativos de imagem/URLs de dados e do construtor de provedor de imagens compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagens e auxiliares de failover, autenticação e registro |
    | `plugin-sdk/music-generation` | Tipos de provedor, solicitação e resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados obsoletos de geração de música, auxiliares de failover, busca de provedor e análise de referência de modelo; prefira as superfícies de provedores de música pertencentes aos plugins |
    | `plugin-sdk/video-generation` | Tipos de provedor, solicitação e resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, auxiliares de failover, busca de provedor e análise de referência de modelo |
    | `plugin-sdk/transcripts` | Tipos compartilhados de provedores de fontes de transcrições, auxiliares de registro, descritores de sessão e metadados de enunciados |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook e auxiliares de instalação de rotas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidade obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartilhados para carregamento remoto/local de mídia |
    | `plugin-sdk/zod` | Reexportação de compatibilidade obsoleta; importe `zod` diretamente de `zod` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi` local do repositório para testes unitários de registro direto de plugins sem importar pontes de auxiliares de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures locais do repositório para contratos de adaptadores nativos de runtime de agentes em testes de autenticação, entrega, fallback, hooks de ferramentas, sobreposição de prompts, esquema e projeção de transcrições |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de teste locais do repositório e orientados a canais para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de contas, encadeamento da configuração de envio, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte local do repositório de casos de erro compartilhados de resolução de destino para testes de canais |
    | `plugin-sdk/channel-contract-testing` | Auxiliares locais do repositório para testes específicos de contratos de canais, sem o barrel amplo de testes |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locais do repositório para contratos de pacote de Plugin, registro, artefato público, importação direta, API de runtime e efeitos colaterais de importação |
    | `plugin-sdk/plugin-state-test-runtime` | Auxiliares locais do repositório para testes de armazenamento de estado de plugins, fila de entrada e banco de dados de estado |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locais do repositório para contratos de runtime de provedores, autenticação, descoberta, integração inicial, catálogo, assistente, recurso de mídia, política de reprodução, áudio ao vivo de STT em tempo real, pesquisa/busca na Web e streaming |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/de autenticação opt-in do Vitest, locais do repositório, para testes de provedores que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Auxiliares locais do repositório para anexar metadados a fixtures de payloads de resposta |
    | `plugin-sdk/sqlite-runtime-testing` | Auxiliares locais do repositório para o ciclo de vida do SQLite em testes internos |
    | `plugin-sdk/test-fixtures` | Fixtures locais do repositório para captura genérica de runtime da CLI, contexto de sandbox, gravador de Skills, mensagem de agente, evento do sistema, recarregamento de módulo, caminho de Plugin integrado, texto de terminal, fragmentação, token de autenticação e casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares locais do repositório para mocks específicos de módulos nativos do Node, destinados ao uso dentro de fábricas `vi.mock("node:*")` do Vitest |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada obsoleta de runtime para indexação/pesquisa de memória; prefira subcaminhos de host de memória independentes de fornecedor |
    | `plugin-sdk/memory-core-host-embedding-registry` | Auxiliares leves de registro de provedores de embeddings de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remotos. `registerMemoryEmbeddingProvider` nesta superfície está obsoleto; use a API genérica de provedores de embeddings para novos provedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais obsoletos do host de memória; prefira subcaminhos de host de memória independentes de fornecedor |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta obsoletos do host de memória; prefira subcaminhos de host de memória independentes de fornecedor |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredos do host de memória |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime da CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares principais de runtime do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias independente de fornecedor para os auxiliares principais de runtime do host de memória |
    | `plugin-sdk/memory-host-events` | Alias independente de fornecedor para os auxiliares de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartilhados de Markdown gerenciado para plugins relacionados à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acesso ao gerenciador de pesquisa |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subcaminhos reservados de auxiliares integrados">
    Os subcaminhos reservados do SDK para auxiliares integrados são superfícies
    específicas e restritas a cada proprietário para código de plugins integrados.
    Eles são rastreados no inventário do SDK para que as compilações de pacotes
    e os aliases permaneçam determinísticos, mas não são APIs gerais para
    criação de plugins. Novos contratos de host reutilizáveis devem usar subcaminhos
    genéricos do SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Subcaminho | Proprietário e finalidade |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar do Plugin Codex integrado para projetar a configuração de servidor MCP do usuário na configuração de thread do servidor de aplicativos Codex (exportação reservada do pacote) |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar do Plugin Codex integrado para espelhar subagentes nativos do servidor de aplicativos Codex no estado de tarefas do OpenClaw (somente local do repositório, não é uma exportação de pacote) |

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral do SDK de plugins](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
