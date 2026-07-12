---
read_when:
    - Escolhendo o subcaminho correto do plugin-sdk para uma importação de Plugin
    - Auditoria de subcaminhos de plugins integrados e superfícies auxiliares
summary: 'Catálogo de subcaminhos do SDK de Plugins: quais importações ficam onde, agrupadas por área'
title: Subcaminhos do SDK de Plugins
x-i18n:
    generated_at: "2026-07-12T15:34:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d4ad11615c889a6a692c243f321612050388a647975b2075376e7c787df933ff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de plugins é exposto como um conjunto de subcaminhos públicos específicos em
`openclaw/plugin-sdk/`. Esta página cataloga os subcaminhos mais usados, agrupados por
finalidade. Três arquivos definem a superfície:

- `scripts/lib/plugin-sdk-entrypoints.json`: o inventário mantido de pontos de entrada
  que a compilação processa.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subcaminhos de
  teste/internos locais do repositório. As exportações do pacote correspondem ao inventário menos esta lista.
- `src/plugin-sdk/entrypoints.ts`: metadados de classificação para subcaminhos
  obsoletos, auxiliares reservados incluídos no pacote, fachadas incluídas compatíveis e
  superfícies públicas pertencentes a plugins.

Os mantenedores auditam a contagem de exportações públicas com `pnpm plugin-sdk:surface` e
os subcaminhos auxiliares reservados ativos com `pnpm plugins:boundary-report:summary`;
exportações auxiliares reservadas não utilizadas fazem o relatório de CI falhar, em vez de permanecerem no
SDK público como dívida de compatibilidade inativa.

Para consultar o guia de criação de plugins, consulte a [visão geral do SDK de plugins](/pt-BR/plugins/sdk-overview).

## Entrada do plugin

| Subcaminho                     | Principais exportações                                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Auxiliares de itens do provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de itens, auxiliares de redação e `summarizeMigrationItems`                         |
| `plugin-sdk/migration-runtime` | Auxiliares de migração em tempo de execução, como `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                               |
| `plugin-sdk/health`            | Registro, detecção, reparo, seleção, severidade e tipos de constatação das verificações de integridade do Doctor para consumidores de integridade incluídos no pacote                                   |
| `plugin-sdk/config-schema`     | Obsoleto. Esquema Zod do `openclaw.json` raiz (`OpenClawSchema`); em vez disso, defina esquemas locais do plugin e valide-os com `plugin-sdk/json-schema-runtime`                                        |

### Auxiliares obsoletos de compatibilidade e teste

Os subcaminhos obsoletos permanecem exportados para plugins mais antigos, mas códigos novos devem usar os
subcaminhos específicos do SDK abaixo. A lista mantida está em
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; a CI rejeita importações de
produção incluídas no pacote provenientes dela. Barris amplos, como `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` e
`plugin-sdk/text-runtime`, destinam-se apenas à compatibilidade, e `plugin-sdk/zod` é uma
reexportação de compatibilidade: importe `zod` diretamente de `zod`. Os barris amplos de domínio
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` e
`plugin-sdk/security-runtime` também estão obsoletos em favor de subcaminhos
específicos.

Os subcaminhos de auxiliares de teste do OpenClaw baseados no Vitest são apenas locais do repositório e
não são mais exportações do pacote: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` e `testing`. As superfícies auxiliares privadas incluídas no pacote
`ssrf-runtime-internal` e `codex-native-task-runtime` também são apenas locais do repositório.

### Subcaminhos auxiliares reservados de plugins incluídos no pacote

`plugin-sdk/codex-mcp-projection` é o único subcaminho reservado: uma superfície de
compatibilidade pertencente ao plugin Codex incluído no pacote, não uma API geral do SDK.
Importações entre plugins de proprietários diferentes são bloqueadas pelas proteções do contrato do pacote, e
a CI falha quando um subcaminho reservado deixa de ser importado.
`plugin-sdk/codex-native-task-runtime` é apenas local do repositório e não é uma exportação do
pacote.

`src/plugin-sdk/entrypoints.ts` também rastreia fachadas incluídas compatíveis, pontos de entrada do SDK
sustentados pelo respectivo plugin incluído no pacote até que contratos genéricos os substituam:
`plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` e `plugin-sdk/zalouser`. Vários deles também estão
obsoletos para códigos novos; consulte as observações de cada linha abaixo.

  <AccordionGroup>
  <Accordion title="Subcaminhos de canais">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/json-schema-runtime` | Auxiliar de validação de JSON Schema em cache para esquemas pertencentes a plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, tradutor de configuração, prompts de lista de permissões, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração e controle de ações para múltiplas contas, auxiliares de fallback para a conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de consulta de conta e fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares específicos de listagem de contas e ações de conta |
    | `plugin-sdk/access-groups` | Auxiliares de análise de listas de permissões de grupos de acesso e diagnóstico de grupos com dados ocultados |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivas compartilhadas de esquema de configuração de canais, além de construtores Zod e construtores diretos de JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canais integrados do OpenClaw, somente para plugins integrados mantidos |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. IDs canônicos de canais de chat integrados/oficiais, além de rótulos/aliases de formatação para plugins que precisam reconhecer texto com prefixo de envelope sem codificar a própria tabela diretamente. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canais integrados |
    | `plugin-sdk/telegram-command-config` | Normalização obsoleta de nomes/descrições de comandos do Telegram e verificações de duplicidade/conflito; em novos códigos de plugin, use o tratamento de configuração de comandos local do plugin |
    | `plugin-sdk/command-gating` | Auxiliares específicos de controle de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Superfície de compatibilidade de baixo nível para entrada de canais. Novos fluxos de recebimento devem usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor experimental de runtime de alto nível para entrada de canais e construtores de fatos de rota para fluxos migrados de recebimento de canais. Prefira-o em vez de montar listas de permissões efetivas, listas de permissões de comandos e projeções legadas em cada plugin. Consulte a [API de entrada de canais](/pt-BR/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratos do ciclo de vida de mensagens, além de opções do pipeline de respostas, confirmações, pré-visualização/transmissão ao vivo, auxiliares de ciclo de vida, identidade de saída, planejamento de payloads, envios duráveis e auxiliares de contexto de envio de mensagens. Consulte a [API de saída de canais](/pt-BR/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilidade obsoleto para `plugin-sdk/channel-outbound`, além de fachadas legadas de despacho de respostas. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados para construção de rotas de entrada e envelopes |
    | `plugin-sdk/inbound-reply-dispatch` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-inbound` para executores de entrada e predicados de despacho, e `plugin-sdk/channel-outbound` para auxiliares de entrega de mensagens. |
    | `plugin-sdk/messaging-targets` | Alias obsoleto de análise de destinos; use `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados para carregamento de mídia de saída e estado de mídia hospedada |
    | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Auxiliares específicos de normalização de enquetes |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptadores de vinculação de threads |
    | `plugin-sdk/agent-media-payload` | Raízes e carregadores de payloads de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Módulo agregador amplo obsoleto para vinculação de conversas/threads, pareamento e auxiliares de vinculações configuradas; prefira subcaminhos específicos de vinculação, como `plugin-sdk/thread-bindings-runtime` e `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de políticas de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de instantâneo/resumo do status de canais |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas de esquema de configuração de canais |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de gravação da configuração de canais |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas do preâmbulo de plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura da configuração de listas de permissões |
    | `plugin-sdk/group-access` | Auxiliares obsoletos de decisão de acesso a grupos; use `resolveChannelMessageIngress` de `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Auxiliares específicos de política de proteção pré-criptografia para mensagens diretas |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidade com o Discord para o `@openclaw/discord@2026.3.13` publicado e a compatibilidade monitorada pelo proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canais |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de contas do Telegram para compatibilidade monitorada pelo proprietário; novos plugins devem usar auxiliares de runtime injetados ou subcaminhos genéricos do SDK de canais |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade com o Zalo Personal para pacotes publicados do Lark/Zalo que ainda importam autorização de comandos do remetente; novos plugins devem usar subcaminhos genéricos do SDK de canais |
    | `plugin-sdk/interactive-runtime` | Apresentação semântica de mensagens, entrega e auxiliares legados de respostas interativas. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Auxiliares compartilhados de entrada para classificação de eventos, construção de contexto, formatação, raízes, debounce, correspondência de menções, política de menções e registro de entrada |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares específicos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares específicos de política de menções, marcadores de menção e texto de menções, sem a superfície mais ampla do runtime de entrada |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fachadas de compatibilidade obsoletas. Use `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fachada de compatibilidade obsoleta. Use `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ações de mensagens de canal, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade com plugins |
    | `plugin-sdk/channel-route` | Normalização compartilhada de rotas, resolução de destinos orientada por analisador, conversão de IDs de thread em strings, chaves de rota compactas/para desduplicação, tipos de destinos analisados e auxiliares de comparação de rotas/destinos |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de destinos; consumidores de comparação de rotas devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contratos de canais |
    | `plugin-sdk/channel-feedback` | Integração de feedback/reações |
  </Accordion>

As famílias obsoletas de auxiliares de canal permanecem disponíveis apenas para
compatibilidade com plugins publicados. O plano de remoção é: mantê-las durante
o período de migração dos plugins externos, manter os plugins do repositório/integrados em `channel-inbound` e
`channel-outbound` e, em seguida, remover os subcaminhos de compatibilidade na próxima grande
limpeza do SDK. Isso se aplica às antigas famílias de mensagem/runtime de canal,
streaming de canal, acesso direto a DMs, auxiliares de entrada fragmentados, opções de resposta
e caminhos de emparelhamento.

  <Accordion title="Subcaminhos de provedores">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada compatível do provedor LM Studio para configuração, descoberta de catálogo e preparação de modelos em tempo de execução |
    | `plugin-sdk/lmstudio-runtime` | Fachada compatível de tempo de execução do LM Studio para padrões do servidor local, descoberta de modelos, cabeçalhos de requisição e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados para configuração de provedores locais/auto-hospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares obsoletos de configuração auto-hospedada compatível com OpenAI; use `plugin-sdk/provider-setup` ou auxiliares de configuração pertencentes ao plugin |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de tempo de execução para autenticação de provedores: fluxo OAuth com loopback, troca de tokens, persistência de autenticação e resolução de chave de API |
    | `plugin-sdk/provider-oauth-runtime` | Tipos genéricos de callback OAuth de provedores, renderização da página de callback, auxiliares de PKCE/estado, análise da entrada de autorização, auxiliares de expiração de tokens e auxiliares de cancelamento |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de integração/gravação de perfil com chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de consulta de variáveis de ambiente de autenticação de provedores |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auxiliares de importação de autenticação do OpenAI Codex, exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de políticas de repetição, auxiliares de endpoints de provedores e auxiliares compartilhados de normalização de IDs de modelos |
    | `plugin-sdk/provider-catalog-live-runtime` | Auxiliares de catálogo dinâmico de modelos de provedores para descoberta protegida no estilo `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtragem de IDs de modelos, cache com TTL e fallback estático |
    | `plugin-sdk/provider-catalog-runtime` | Gancho de tempo de execução para ampliação do catálogo de provedores e interfaces de registro de provedores de plugins para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de recursos HTTP/endpoints de provedores, erros HTTP de provedores e auxiliares de formulários multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares de contrato restrito para configuração/seleção de busca de conteúdo da web, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedores de busca de conteúdo da web |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares restritos de configuração/credenciais de pesquisa na web para provedores que não precisam de vinculação para habilitação de plugins |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato restrito para configuração/credenciais de pesquisa na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e definidores/obtentores de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/tempo de execução de provedores de pesquisa na web |
    | `plugin-sdk/embedding-providers` | Tipos gerais de provedores de embeddings e auxiliares de leitura, incluindo `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; os plugins registram provedores por meio de `api.registerEmbeddingProvider(...)` para garantir a aplicação da propriedade do manifesto |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de esquemas + diagnósticos para DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipos de instantâneos de uso de provedores, auxiliares compartilhados de consulta de uso e funções de consulta de provedores, como `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrappers de fluxo, compatibilidade com chamadas de ferramentas em texto simples e auxiliares compartilhados de wrappers para Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Auxiliares públicos compartilhados de wrappers de fluxo de provedores, incluindo `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilitários de fluxo compatíveis com Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de provedores, como busca protegida, extração de texto de resultados de ferramentas, transformações de mensagens de transporte e fluxos graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de alteração da configuração de integração |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares restritos de modo de ativação de grupos e análise de comandos |
  </Accordion>

Os instantâneos de uso de provedores normalmente relatam uma ou mais `windows` de cota, cada uma com
um rótulo, percentual usado e horário opcional de redefinição. Provedores que expõem saldo ou
texto de estado da conta em vez de janelas de cota redefiníveis devem retornar
`summary` com um array `windows` vazio, em vez de inventar percentuais.
O OpenClaw exibe esse texto de resumo na saída de status; use `error` somente quando o
endpoint de uso falhar ou não retornar dados de uso aproveitáveis.

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superfície ampla e obsoleta de autorização de comandos (`resolveControlCommandGate`, auxiliares de registro de comandos, incluindo formatação dinâmica de menus de argumentos, auxiliares de autorização de remetentes); use autorização na entrada do canal/em tempo de execução ou auxiliares de status de comandos |
    | `plugin-sdk/command-status` | Construtores de mensagens de comandos/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovadores e autenticação de ações no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro para aprovação de execução nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de recursos/entrega de aprovação nativa |
    | `plugin-sdk/approval-gateway-runtime` | Resolvedor compartilhado do Gateway de aprovação |
    | `plugin-sdk/approval-reference-runtime` | Auxiliar determinístico de localização durável para callbacks de aprovação limitados pelo transporte |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptadores de aprovação nativa para pontos de entrada de canal críticos |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de tempo de execução para tratamento de aprovações; prefira as interfaces mais restritas de adaptador/Gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares de destino de aprovação nativa, vinculação de contas, controle de rotas, fallback de encaminhamento e supressão local de prompts de execução nativa |
    | `plugin-sdk/approval-reaction-runtime` | Vinculações fixas de reações de aprovação, cargas úteis de prompts de reação, armazenamentos de destinos de reação, auxiliares de texto de dicas de reação e exportação de compatibilidade para supressão local de prompts de execução nativa |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de cargas úteis de resposta para aprovação de execução/plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de cargas úteis de aprovação de execução/plugin, construtores de recursos de aprovação, auxiliares de autenticação/perfil de aprovação, auxiliares de roteamento/tempo de execução de aprovação nativa e auxiliares estruturados de exibição de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares restritos e obsoletos de redefinição da desduplicação de respostas recebidas |
    | `plugin-sdk/command-auth-native` | Autenticação nativa de comandos, formatação dinâmica de menus de argumentos e auxiliares nativos de destino de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comandos para caminhos críticos de canais |
    | `plugin-sdk/command-surface` | Normalização do corpo de comandos e auxiliares da superfície de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Auxiliares de carregamento adiado para fluxos de login de autenticação de provedores usados no emparelhamento por código de dispositivo em canais privados e na interface Web |
    | `plugin-sdk/channel-secret-runtime` | Superfície ampla e obsoleta de contrato de segredos (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipos de destino de segredos); prefira os subcaminhos específicos abaixo |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportações restritas de contratos de segredos para superfícies de segredos de canais/plugins sem TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Auxiliares restritos de atribuição de segredos TTS aninhados em canais |
    | `plugin-sdk/secret-ref-runtime` | Tipagem, resolução e consulta de caminhos de destino de planos restritas para SecretRef, usadas na análise de contratos de segredos/configuração |
    | `plugin-sdk/secret-provider-integration` | Manifesto de integração e contratos de predefinições de provedores SecretRef somente de tipos para plugins que publicam predefinições de provedores externos de segredos |
    | `plugin-sdk/security-runtime` | Barrel amplo e obsoleto para confiança, controle de DMs, auxiliares de arquivos/caminhos restritos à raiz, incluindo gravações somente para criação, substituição atômica síncrona/assíncrona de arquivos, gravações temporárias adjacentes, fallback de movimentação entre dispositivos, auxiliares de armazenamento privado de arquivos, proteções contra pais com links simbólicos, conteúdo externo, ocultação de texto sensível, comparação de segredos em tempo constante e auxiliares de coleta de segredos; prefira subcaminhos específicos de segurança/SSRF/segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de lista de hosts permitidos e política SSRF para redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares restritos de dispatcher fixado, sem a ampla superfície de infraestrutura em tempo de execução |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de dispatcher fixado, busca protegida contra SSRF, erro de SSRF e política de SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise de entrada de segredos |
    | `plugin-sdk/webhook-ingress` | Auxiliares de requisição/destino de Webhook e conversão de websocket/corpo bruto |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho/tempo limite do corpo da requisição |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares de runtime, registro em log e backup, avisos sobre caminhos de instalação de plugins e auxiliares de processos |
    | `plugin-sdk/runtime-env` | Auxiliares específicos de ambiente de runtime, logger, tempo limite, repetição e recuo |
    | `plugin-sdk/browser-config` | Fachada compatível de configuração do navegador para perfil e padrões normalizados, análise de URL CDP e auxiliares de autenticação do controle do navegador |
    | `plugin-sdk/agent-harness-task-runtime` | Auxiliares genéricos de ciclo de vida de tarefas e entrega de conclusão para agentes baseados em harness usando um escopo de tarefa emitido pelo host |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar reservado do Codex incluído no pacote para projetar a configuração de servidores MCP do usuário na configuração de threads do Codex; não se destina a plugins de terceiros |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar do Codex incluído no pacote e local ao repositório para espelhamento nativo de tarefas e conexão do runtime; não é uma exportação de pacote |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e consulta do contexto de runtime de canais |
    | `plugin-sdk/matrix` | Fachada obsoleta de compatibilidade com Matrix para pacotes de canais de terceiros mais antigos; novos plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Fachada obsoleta de compatibilidade com Mattermost para pacotes de canais de terceiros mais antigos; novos plugins devem importar diretamente subcaminhos genéricos do SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel amplo obsoleto para auxiliares de comandos, hooks, HTTP e interatividade de plugins; prefira subcaminhos específicos do runtime de plugins |
    | `plugin-sdk/hook-runtime` | Barrel amplo obsoleto para auxiliares de Webhook e do pipeline interno de hooks; prefira subcaminhos específicos de hooks e do runtime de plugins |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação e vinculação tardias do runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processos |
    | `plugin-sdk/cli-runtime` | Barrel amplo obsoleto para formatação da CLI, espera, versão, invocação de argumentos e auxiliares de grupos de comandos com carregamento tardio; prefira subcaminhos específicos da CLI e do runtime |
    | `plugin-sdk/qa-live-transport-scenarios` | IDs compartilhados de cenários de QA de transportes ativos, auxiliares de cobertura de referência e auxiliar de seleção de cenários |
    | `plugin-sdk/qa-runner-runtime` | Fachada compatível que expõe cenários de QA de plugins por meio da superfície de comandos da CLI |
    | `plugin-sdk/tts-runtime` | Fachada compatível para esquemas de configuração de conversão de texto em fala e auxiliares de runtime |
    | `plugin-sdk/gateway-method-runtime` | Auxiliar reservado de despacho de métodos do Gateway para rotas HTTP de plugins que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Cliente do Gateway, auxiliar de inicialização do cliente pronto para o loop de eventos, RPC da CLI do Gateway, erros do protocolo do Gateway, resolução do host LAN anunciado e auxiliares de atualização parcial do status de canais |
    | `plugin-sdk/config-contracts` | Superfície específica de configuração somente de tipos para formatos de configuração de plugins, como `OpenClawConfig`, e tipos de configuração de canais e provedores |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de consulta de configuração de plugins em runtime, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares de mutação transacional de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Strings compartilhadas de dicas de metadados de entrega da ferramenta de mensagens |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares do snapshot de configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e definidores de snapshots de teste |
    | `plugin-sdk/text-autolink-runtime` | Detecção de links automáticos para referências de arquivos sem o barrel amplo de texto |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime para entrada e resposta, divisão em blocos, despacho, Heartbeat e planejador de respostas |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares específicos de despacho e finalização de respostas e de rótulos de conversas |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de respostas de curta duração. Novo código de turnos de mensagens deve usar `createChannelHistoryWindow`; auxiliares de mapas de nível inferior permanecem apenas como exportações obsoletas de compatibilidade |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares específicos para divisão de texto e Markdown em blocos |
    | `plugin-sdk/session-store-runtime` | Auxiliares de fluxo de trabalho de sessões (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), auxiliares de reparo e ciclo de vida (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), auxiliares de marcadores para valores transitórios de `sessionFile`, leituras limitadas de texto recente da transcrição do usuário e do assistente por identidade de sessão, auxiliares de caminho do armazenamento de sessões e chave de sessão e leituras da data de atualização, sem importações amplas de gravação ou manutenção de configuração |
    | `plugin-sdk/session-transcript-runtime` | Identidade de transcrição, auxiliares de destino, leitura e gravação com escopo, projeção de entradas de mensagens visíveis, publicação de atualizações, bloqueios de gravação e chaves de acertos de memória de transcrição |
    | `plugin-sdk/sqlite-runtime` | Auxiliares específicos de esquema, caminho e transação do agente SQLite para runtime próprio, sem controles do ciclo de vida do banco de dados |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de caminho, carregamento e salvamento do armazenamento do Cron |
    | `plugin-sdk/state-paths` | Auxiliares de caminhos dos diretórios de estado e OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipos de estado com chave em SQLite auxiliar do plugin, além de configuração centralizada de pragmas de conexão e manutenção do WAL para bancos de dados pertencentes a plugins |
    | `plugin-sdk/routing` | Auxiliares de vinculação de rota, chave de sessão e conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canais e contas, padrões de estado do runtime e auxiliares de metadados de problemas |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolução de destinos |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slugs e strings |
    | `plugin-sdk/request-url` | Extração de URLs em formato de string de entradas semelhantes a fetch ou request |
    | `plugin-sdk/run-command` | Executor de comandos temporizado com resultados normalizados de stdout e stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramentas e da CLI |
    | `plugin-sdk/tool-plugin` | Definição de um plugin simples e tipado de ferramenta de agente e exposição de metadados estáticos para geração de manifesto |
    | `plugin-sdk/tool-payload` | Extração de payloads normalizados de objetos de resultado de ferramentas |
    | `plugin-sdk/tool-send` | Extração de campos canônicos de destino de envio dos argumentos da ferramenta |
    | `plugin-sdk/sandbox` | Tipos de backend de sandbox e auxiliares de comandos SSH e OpenShell, incluindo verificação preliminar de comandos de execução com falha imediata |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminhos para downloads temporários e espaços de trabalho temporários privados e seguros |
    | `plugin-sdk/logging-core` | Auxiliares de logger e redação do subsistema |
    | `plugin-sdk/markdown-table-runtime` | Modo de tabela Markdown e auxiliares de conversão |
    | `plugin-sdk/model-session-runtime` | Auxiliares de substituição de modelo e sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolução de configuração do provedor de conversação |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura e gravação de estado JSON |
    | `plugin-sdk/json-unsafe-integers` | Auxiliares de análise de JSON que preservam literais inteiros não seguros como strings |
    | `plugin-sdk/file-lock` | Auxiliares de bloqueio de arquivos reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de desduplicação com suporte em disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime, sessão e despacho de respostas do ACP |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares leves de registro de backend e despacho de respostas do ACP para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vinculações do ACP sem importações de inicialização do ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas obsoletas de esquema de configuração do runtime de agentes; importe primitivas de esquema de uma superfície mantida e pertencente a um plugin |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de inicialização de dispositivos e tokens de pareamento, incluindo `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartilhadas para canais passivos, status e proxy de ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta de comandos e provedores de `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro, compilação e serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental para plugins confiáveis destinada a harnesses de agentes de baixo nível: tipos de harness, auxiliares para orientar e abortar execuções ativas, auxiliares da ponte de ferramentas do OpenClaw, auxiliares de política de ferramentas do plano de runtime, classificação de resultados de terminal, auxiliares de formatação e detalhamento do progresso de ferramentas e utilitários de resultados de tentativas |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detecção de endpoints pertencente ao provedor Z.AI; use a API pública do plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de bloqueio assíncrono local ao processo para pequenos arquivos de estado do runtime |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetria de atividade de canais |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de cache de desduplicação em memória e com suporte persistente |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de drenagem de entregas de saída pendentes |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros para caminhos de arquivos locais e fontes de mídia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de ativação, eventos e visibilidade do Heartbeat |
    | `plugin-sdk/expect-runtime` | Auxiliar de asserção de valor obrigatório para invariantes comprováveis do runtime |
    | `plugin-sdk/number-runtime` | Auxiliar de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares seguros de tokens e UUIDs |
    | `plugin-sdk/system-event-runtime` | Auxiliares da fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera pela prontidão do transporte |
    | `plugin-sdk/exec-approvals-runtime` | Auxiliares de arquivos de políticas de aprovação de execução sem o barrel amplo de runtime de infraestrutura |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos específicos de runtime acima |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de sinalizadores de diagnóstico, eventos e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, auxiliares compartilhados de classificação de erros, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Auxiliares de fetch encapsulado, proxy, opções de EnvHttpProxyAgent e consultas fixadas |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime ciente do dispatcher sem importações de proxy ou fetch protegido |
    | `plugin-sdk/inline-image-data-url-runtime` | Auxiliares de sanitização de URLs de dados de imagens embutidas e detecção de assinaturas sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado do corpo de respostas sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vinculação da conversa sem roteamento de vinculações configurado nem armazenamentos de pareamento |
    | `plugin-sdk/context-visibility-runtime` | Resolução da visibilidade do contexto e filtragem de contexto suplementar sem importações amplas de configuração ou segurança |
    | `plugin-sdk/string-coerce-runtime` | Primitivas específicas de coerção e normalização de registros e strings sem importações de Markdown ou registro em log |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de nomes de host e hosts SCP |
    | `plugin-sdk/retry-runtime` | Configuração de repetição e auxiliares do executor de repetição |
    | `plugin-sdk/agent-runtime` | Barrel amplo obsoleto para auxiliares de diretório, identidade e espaço de trabalho de agentes, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e a exportação obsoleta de compatibilidade `resolveOpenClawAgentDir`; prefira subcaminhos específicos de agentes e runtime |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de recursos e testes">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel amplo de mídia obsoleto, incluindo `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e o obsoleto `fetchRemoteMedia`; prefira `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` e os subcaminhos de runtime de recursos, e prefira os auxiliares de armazenamento antes das leituras de buffer quando uma URL precisar se tornar mídia do OpenClaw |
    | `plugin-sdk/media-mime` | Normalização restrita de MIME, mapeamento de extensões de arquivo, detecção de MIME e auxiliares de tipo de mídia |
    | `plugin-sdk/media-store` | Auxiliares restritos do armazenamento de mídia, como `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de failover para geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedores de compreensão de mídia, além de exportações de auxiliares de imagem, áudio e extração estruturada voltados a provedores |
    | `plugin-sdk/text-chunking` | Auxiliares de segmentação/renderização de texto de saída e Markdown, conversão de tabelas Markdown, remoção de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/speech` | Tipos de provedores de fala, além de exportações de diretiva, registro, validação, construtor de TTS compatível com OpenAI e auxiliares de fala voltados a provedores |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedores de fala e exportações de registro, diretiva, normalização e auxiliares de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedores de transcrição em tempo real, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Auxiliar de inicialização de perfil em tempo real para injeção limitada de contexto de `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipos de provedores de voz em tempo real, auxiliares de registro e auxiliares compartilhados de comportamento de voz em tempo real, incluindo rastreamento da atividade de saída |
    | `plugin-sdk/image-generation` | Tipos de provedores de geração de imagens, além de auxiliares de ativos de imagem/URL de dados e o construtor de provedor de imagens compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagens e auxiliares de failover, autenticação e registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados obsoletos de geração de música, auxiliares de failover, consulta de provedor e análise de referência de modelo; prefira superfícies de provedores de música pertencentes ao Plugin |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, auxiliares de failover, consulta de provedor e análise de referência de modelo |
    | `plugin-sdk/transcripts` | Tipos compartilhados de provedores de origem de transcrições, auxiliares de registro, descritores de sessão e metadados de enunciados |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook e auxiliares de instalação de rotas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidade obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexportação de compatibilidade obsoleta; importe `zod` diretamente de `zod` |
    | `plugin-sdk/testing` | Barrel de compatibilidade obsoleto e local ao repositório para testes legados do OpenClaw. Em vez disso, novos testes do repositório devem importar subcaminhos locais e específicos de teste, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi`, local ao repositório, para testes unitários de registro direto de Plugins sem importar pontes de auxiliares de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures locais ao repositório de contratos de adaptadores nativos do runtime do agente para testes de autenticação, entrega, fallback, hooks de ferramentas, sobreposição de prompt, esquema e projeção de transcrições |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de teste orientados a canais e locais ao repositório para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de contas, encadeamento de configuração de envio, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Conjunto compartilhado e local ao repositório de casos de erro de resolução de destino para testes de canais |
    | `plugin-sdk/channel-contract-testing` | Auxiliares locais ao repositório e restritos para testes de contratos de canais, sem o barrel amplo de testes |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locais ao repositório para contratos de pacote de Plugin, registro, artefato público, importação direta, API de runtime e efeitos colaterais de importação |
    | `plugin-sdk/plugin-state-test-runtime` | Auxiliares locais ao repositório para testes de armazenamento de estado de Plugins, fila de entrada e banco de dados de estado |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locais ao repositório para contratos de runtime de provedores, autenticação, descoberta, integração, catálogo, assistente, recurso de mídia, política de reprodução, áudio ao vivo de STT em tempo real, pesquisa/busca na Web e streaming |
    | `plugin-sdk/provider-http-test-mocks` | Mocks opcionais de HTTP/autenticação do Vitest, locais ao repositório, para testes de provedores que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Auxiliares locais ao repositório para anexar metadados a fixtures de payloads de resposta |
    | `plugin-sdk/sqlite-runtime-testing` | Auxiliares locais ao repositório para o ciclo de vida do SQLite em testes próprios |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas e locais ao repositório para captura do runtime da CLI, contexto de sandbox, gravador de Skills, mensagem do agente, evento do sistema, recarregamento de módulo, caminho de Plugin incluído, texto de terminal, segmentação, token de autenticação e casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares locais ao repositório e específicos para mocks de módulos integrados do Node, destinados ao uso em fábricas `vi.mock("node:*")` do Vitest |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Principais exportações |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada obsoleta do runtime de indexação/pesquisa de memória; prefira subcaminhos de host de memória independentes de fornecedor |
    | `plugin-sdk/memory-core-host-embedding-registry` | Auxiliares leves do registro de provedores de embeddings de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remotos. `registerMemoryEmbeddingProvider` nesta superfície está obsoleto; use a API genérica de provedores de embeddings para novos provedores. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais obsoletos do host de memória; prefira subcaminhos de host de memória independentes de fornecedor |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta obsoletos do host de memória; prefira subcaminhos de host de memória independentes de fornecedor |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredos do host de memória |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime da CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares do runtime principal do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivos/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias independente de fornecedor para os auxiliares do runtime principal do host de memória |
    | `plugin-sdk/memory-host-events` | Alias independente de fornecedor para os auxiliares do diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartilhados de Markdown gerenciado para Plugins relacionados à memória |
    | `plugin-sdk/memory-host-search` | Fachada do runtime de Active Memory para acesso ao gerenciador de pesquisa |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subcaminhos reservados de auxiliares incluídos">
    Os subcaminhos reservados do SDK para auxiliares incluídos são superfícies restritas e específicas do proprietário para
    código de Plugins incluídos. Eles são rastreados no inventário do SDK para que as compilações
    de pacotes e a criação de aliases permaneçam determinísticas, mas não são APIs gerais de
    criação de Plugins. Novos contratos reutilizáveis de host devem usar subcaminhos genéricos do SDK,
    como `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Subcaminho | Proprietário e finalidade |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Auxiliar do Plugin Codex incluído para projetar a configuração de servidores MCP do usuário na configuração de thread do servidor de aplicativos Codex (exportação de pacote reservada) |
    | `plugin-sdk/codex-native-task-runtime` | Auxiliar do Plugin Codex incluído para espelhar subagentes nativos do servidor de aplicativos Codex no estado de tarefas do OpenClaw (somente local ao repositório, não é uma exportação de pacote) |

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral do SDK de Plugins](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugins](/pt-BR/plugins/sdk-setup)
- [Criação de Plugins](/pt-BR/plugins/building-plugins)
