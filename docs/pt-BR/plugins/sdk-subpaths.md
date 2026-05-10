---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de plugin
    - Auditando subcaminhos e superfícies auxiliares de Plugin integrado
summary: 'Catálogo de subcaminhos do SDK de Plugin: quais importações ficam onde, agrupadas por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-05-10T19:45:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de Plugin é exposto como um conjunto de subcaminhos públicos estreitos em
`openclaw/plugin-sdk/`. Esta página cataloga os subcaminhos comumente usados, agrupados por
finalidade. O inventário gerado de pontos de entrada do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações de pacote são o subconjunto público
após subtrair os subcaminhos locais de teste/internos do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Mantenedores podem auditar
a contagem de exportações públicas com `pnpm plugin-sdk:surface` e os subcaminhos auxiliares
reservados ativos com `pnpm plugins:boundary-report:summary`; exportações auxiliares reservadas
não usadas fazem o relatório de CI falhar em vez de permanecerem no SDK público como
dívida de compatibilidade dormente.

Para o guia de autoria de Plugin, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Entrada de Plugin

| Subcaminho                     | Exportações principais                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Auxiliares de itens de provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de item, auxiliares de redação e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Auxiliares de migração em tempo de execução, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                 |

### Compatibilidade e auxiliares de teste obsoletos

Estes subcaminhos continuam sendo exportações de pacote para plugins mais antigos e suítes de teste do OpenClaw,
mas código novo não deve adicionar importações deles: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` e `zod`. Importe `zod` diretamente de `zod` em código novo de Plugin.
`plugin-test-runtime` ainda é um subcaminho auxiliar de teste focado e ativo.

### Subcaminhos públicos obsoletos e não usados

Estes subcaminhos públicos existiam há pelo menos um mês e atualmente não têm
importações de produção de extensões incluídas. Eles continuam importáveis por compatibilidade,
mas código novo de Plugin deve usar subcaminhos do SDK focados e consumidos ativamente:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` e `zalouser`.

### Subcaminhos públicos raros obsoletos

Subcaminhos públicos atualmente usados por apenas um ou dois proprietários de plugins incluídos também estão
obsoletos para código novo de Plugin. Eles continuam sendo exportações de pacote por compatibilidade,
mas código novo deve preferir pontos de integração do SDK compartilhados ativamente ou APIs de pacote
pertencentes ao Plugin. Mantenedores rastreiam o conjunto exato em
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` e o orçamento atual
com `pnpm plugin-sdk:surface`.

### Barrels amplos obsoletos

Estes barrels amplos de reexportação continuam compiláveis para o código-fonte do OpenClaw e
verificações de compatibilidade, mas código novo deve preferir subcaminhos focados do SDK:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` e
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
e `text-runtime` continuam sendo exportações de pacote apenas para compatibilidade retroativa; use
subcaminhos focados de canal/runtime, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` e `logging-core` em vez disso.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Auxiliar de validação de JSON Schema em cache para esquemas pertencentes ao plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, prompts de allowlist, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração multi-conta/controle de ação, auxiliares de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares restritos de lista de contas/ação de conta |
    | `plugin-sdk/access-groups` | Auxiliares de análise de allowlist de grupos de acesso e diagnósticos redigidos de grupo |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Auxiliares legados do pipeline de resposta. O novo código de pipeline de resposta de canal deve usar `createChannelMessageReplyPipeline` e `resolveChannelMessageSourceReplyDeliveryMode` de `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivos compartilhados de esquema de configuração de canal, além de construtores Zod e JSON/TypeBox diretos |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canal OpenClaw incluídos somente para plugins incluídos mantidos |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canais incluídos |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato incluído |
    | `plugin-sdk/command-gating` | Auxiliares restritos de controle de autorização de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidade de baixo nível para ingresso de canal. Novos caminhos de recebimento devem usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor runtime experimental de alto nível para ingresso de canal e construtores de fatos de rota para caminhos migrados de recebimento de canal. Prefira isto em vez de montar allowlists efetivas, allowlists de comandos e projeções legadas em cada plugin. Consulte [API de ingresso de canal](/pt-BR/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` e auxiliares legados do ciclo de vida de fluxo de rascunho. O novo código de finalização de pré-visualização deve usar `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Auxiliares baratos de contrato de ciclo de vida de mensagem, como `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, derivação de capacidade final durável, auxiliares de prova de capacidade para capacidades de envio/recebimento/efeito colateral, `MessageReceiveContext`, provas de política de ack de recebimento, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, provas de capacidade de pré-visualização ao vivo e finalizador ao vivo, estado de recuperação durável, `RenderedMessageBatch`, tipos de recebimento de mensagem e auxiliares de ID de recebimento. Consulte [API de mensagem de canal](/pt-BR/plugins/sdk-channel-message). Fachadas legadas de despacho de resposta são apenas compatibilidade obsoleta. |
    | `plugin-sdk/channel-message-runtime` | Auxiliares runtime de entrega que podem carregar entrega de saída, incluindo `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` e `withDurableMessageSendContext`. Pontes obsoletas de despacho de resposta permanecem importáveis apenas para despachantes de compatibilidade. Use a partir de módulos runtime de monitoramento/envio, não de arquivos de bootstrap de plugin em hot path. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares legados compartilhados de registro e despacho de entrada, predicados de despacho visível/final e compatibilidade obsoleta `deliverDurableInboundReplyPayload` para despachantes de canal preparados. O novo código de recebimento/despacho de canal deve importar auxiliares runtime de ciclo de vida de `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Auxiliares de análise/correspondência de destino |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-send-deps` | Busca leve de dependência de envio de saída para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Auxiliares de identidade de saída, delegado de envio, sessão, formatação e planejamento de payload. Auxiliares de entrega direta, como `deliverOutboundPayloads`, são substrato de compatibilidade obsoleto; use `plugin-sdk/channel-message-runtime` para novos caminhos de envio. |
    | `plugin-sdk/poll-runtime` | Auxiliares restritos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida e adaptador de vinculação de threads |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de conversa/vinculação de thread, emparelhamento e vinculação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares runtime de resolução de política de grupo |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos restritos de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de escrita de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelude de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de allowlist |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Auxiliares compartilhados de autenticação/guarda de DM direto |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidade do Discord para `@openclaw/discord@2026.3.13` publicado e compatibilidade rastreada do proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de conta do Telegram para compatibilidade rastreada do proprietário; novos plugins devem usar auxiliares runtime injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade do Zalo Personal para pacotes Lark/Zalo publicados que ainda importam autorização de comando de remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Auxiliares de apresentação semântica de mensagem, entrega e resposta interativa legada. Consulte [Apresentação de mensagem](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce de entrada, correspondência de menção, auxiliares de política de menção e auxiliares de envelope |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares restritos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares restritos de política de menção, marcador de menção e texto de menção sem a superfície runtime de entrada mais ampla |
    | `plugin-sdk/channel-envelope` | Auxiliares restritos de formatação de envelope de entrada |
    | `plugin-sdk/channel-location` | Auxiliares de contexto de localização de canal e formatação |
    | `plugin-sdk/channel-logging` | Auxiliares de logging de canal para descartes de entrada e falhas de digitação/ack |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade de plugin |
    | `plugin-sdk/channel-route` | Auxiliares compartilhados de normalização de rota, resolução de destino orientada por parser, conversão de ID de thread em string, chaves de rota de deduplicação/compactação, tipos de destino analisado e auxiliares de comparação de rota/destino |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de destino; chamadores de comparação de rota devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Fiação de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares restritos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, e tipos de destino de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedores">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade de provedor LM Studio com suporte para configuração, descoberta de catálogo e preparação de modelo em runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade de runtime do LM Studio com suporte para padrões do servidor local, descoberta de modelos, cabeçalhos de requisição e auxiliares de modelos carregados |
    | `plugin-sdk/provider-setup` | Auxiliares selecionados para configuração de provedores locais/auto-hospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados para configuração de provedores auto-hospedados compatíveis com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolução de chaves de API em runtime para plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de integração/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-env-vars` | Auxiliares de consulta de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares compartilhados de normalização de ID de modelo |
    | `plugin-sdk/provider-catalog-runtime` | Hook de runtime de ampliação do catálogo de provedores e encaixes do registro plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de recursos HTTP/endpoint de provedor, erros HTTP de provedor e auxiliares de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares de contrato estreito de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/cache de provedor de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares estreitos de configuração/credenciais de web-search para provedores que não precisam de fiação de habilitação de plugin |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato estreito de configuração/credenciais de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/cache/runtime de provedor de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de esquema + diagnósticos do Gemini |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de provedor, como fetch protegido, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Auxiliares de patch de configuração de integração |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/cache locais ao processo |
    | `plugin-sdk/group-activation` | Auxiliares estreitos de modo de ativação de grupo e análise de comandos |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos incluindo formatação dinâmica de menu de argumentos, auxiliares de autorização de remetente |
    | `plugin-sdk/command-status` | Construtores de mensagens de comando/ajuda, como `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolução de aprovador e autenticação de ações no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprovação de exec nativo |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de recurso/entrega de aprovação nativa |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartilhado de resolução de gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares leves de carregamento de adaptador de aprovação nativa para pontos de entrada de canal quentes |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares mais amplos de runtime de manipulador de aprovação; prefira os encaixes mais estreitos de adaptador/gateway quando eles forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares de destino de aprovação nativa + vinculação de conta |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de payload de resposta de aprovação de exec/plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de payload de aprovação de exec/plugin, auxiliares de roteamento/runtime de aprovação nativa e auxiliares de exibição estruturada de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares estreitos de redefinição de desduplicação de respostas de entrada |
    | `plugin-sdk/channel-contract-testing` | Auxiliares estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação nativa de comandos, formatação dinâmica de menu de argumentos e auxiliares nativos de destino de sessão |
    | `plugin-sdk/command-detection` | Auxiliares compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos de canal quentes |
    | `plugin-sdk/command-surface` | Normalização de corpo de comando e auxiliares de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares estreitos de coleta de contrato de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares estreitos de tipagem `coerceSecretRef` e SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/security-runtime` | Auxiliares compartilhados de confiança, bloqueio de DM, arquivos/caminhos limitados pela raiz incluindo gravações somente de criação, substituição atômica de arquivos síncrona/assíncrona, gravações temporárias irmãs, fallback de movimentação entre dispositivos, auxiliares de armazenamento de arquivos privados, proteções de pais de symlink, conteúdo externo, redação de texto sensível, comparação de segredo em tempo constante e auxiliares de coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de allowlist de hosts e política de SSRF para rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares estreitos de dispatcher fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fixado, fetch protegido contra SSRF, erro de SSRF e auxiliares de política de SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Auxiliares de requisição/destino de Webhook e coerção bruta de websocket/corpo |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamanho de corpo/timeout de requisição |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplos de runtime/logging/backup/instalação de Plugin |
    | `plugin-sdk/runtime-env` | Auxiliares restritos de ambiente de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facade de configuração de navegador com suporte para perfil/padrões normalizados, análise de URL CDP e auxiliares de autenticação de controle do navegador |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro e consulta de contexto de runtime de canal |
    | `plugin-sdk/matrix` | Facade obsoleta de compatibilidade com Matrix para pacotes de canal de terceiros mais antigos; novos plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Facade obsoleta de compatibilidade com Mattermost para pacotes de canal de terceiros mais antigos; novos plugins devem importar subcaminhos genéricos do SDK diretamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de comando/hook/http/interativo de Plugin |
    | `plugin-sdk/hook-runtime` | Auxiliares compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importação/vínculo lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de execução de processo |
    | `plugin-sdk/cli-runtime` | Auxiliares de formatação de CLI, espera, versão, invocação por argumento e grupos de comandos lazy |
    | `plugin-sdk/gateway-runtime` | Cliente Gateway, auxiliar de início de cliente pronto para loop de eventos, RPC de CLI do Gateway, erros de protocolo do Gateway e auxiliares de patch de status de canal |
    | `plugin-sdk/config-contracts` | Superfície de configuração focada somente em tipos para formatos de configuração de Plugin, como `OpenClawConfig` e tipos de configuração de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Auxiliares de consulta de configuração de Plugin em runtime, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Auxiliares transacionais de mutação de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliares de snapshot de configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot de teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comandos do Telegram e verificações de duplicatas/conflitos, mesmo quando a superfície de contrato do Telegram incluído não está disponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barrel amplo de texto |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprovação de exec/Plugin, construtores de capacidade de aprovação, auxiliares de autenticação/perfil, auxiliares de roteamento/runtime nativos e formatação estruturada de caminho de exibição de aprovação |
    | `plugin-sdk/reply-runtime` | Auxiliares compartilhados de runtime de entrada/resposta, particionamento, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares restritos de despacho/finalização de resposta e rótulos de conversa |
    | `plugin-sdk/reply-history` | Auxiliares compartilhados de histórico de resposta de janela curta e marcadores como `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares restritos de particionamento de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de caminho do armazenamento de sessão, chave de sessão, atualizado em e mutação de armazenamento |
    | `plugin-sdk/cron-store-runtime` | Auxiliares de caminho/carregamento/salvamento do armazenamento de Cron |
    | `plugin-sdk/state-paths` | Auxiliares de caminho de diretórios de estado/OAuth |
    | `plugin-sdk/routing` | Auxiliares de rota/chave de sessão/vínculo de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartilhados de resumo de status de canal/conta, padrões de estado de runtime e auxiliares de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartilhados de resolvedor de destino |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs de string de entradas semelhantes a fetch/request |
    | `plugin-sdk/run-command` | Executor de comandos com tempo limite e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrai payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de destino de envio de args de ferramenta |
    | `plugin-sdk/temp-path` | Auxiliares compartilhados de caminho de download temporário e workspaces temporários privados seguros |
    | `plugin-sdk/logging-core` | Auxiliares de logger de subsistema e redação |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo de tabela Markdown e conversão |
    | `plugin-sdk/model-session-runtime` | Auxiliares de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Auxiliares de resolução de configuração de provedor de conversa |
    | `plugin-sdk/json-store` | Pequenos auxiliares de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Auxiliares de lock de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de cache de deduplicação com persistência em disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sessão e despacho de resposta de ACP |
    | `plugin-sdk/acp-runtime-backend` | Auxiliares leves de registro de backend ACP e despacho de resposta para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vínculo ACP sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivos restritos de esquema de configuração de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivos compartilhados de canal passivo, status e auxiliar de proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de resposta de comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares de registro/build/serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, auxiliares de direcionar/abortar execução ativa, auxiliares de ponte de ferramentas do OpenClaw, auxiliares de política de ferramentas de plano de runtime, classificação de resultado de terminal, auxiliares de formatação/detalhe de progresso de ferramentas e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Facade obsoleta de detecção de endpoint de propriedade do provedor Z.AI; use a API pública do Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Auxiliar de lock assíncrono local ao processo para pequenos arquivos de estado de runtime |
    | `plugin-sdk/channel-activity-runtime` | Auxiliar de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Auxiliar de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Auxiliares de cache de deduplicação em memória |
    | `plugin-sdk/delivery-queue-runtime` | Auxiliar de drenagem de entregas pendentes de saída |
    | `plugin-sdk/file-access-runtime` | Auxiliares seguros de caminho de arquivo local e fonte de mídia |
    | `plugin-sdk/heartbeat-runtime` | Auxiliares de despertar, evento e visibilidade de Heartbeat |
    | `plugin-sdk/number-runtime` | Auxiliar de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Auxiliares seguros de token/UUID |
    | `plugin-sdk/system-event-runtime` | Auxiliares de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Auxiliar de espera por prontidão de transporte |
    | `plugin-sdk/infra-runtime` | Shim obsoleto de compatibilidade; use os subcaminhos focados de runtime acima |
    | `plugin-sdk/collection-runtime` | Pequenos auxiliares de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de flag de diagnóstico, evento e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, auxiliares compartilhados de classificação de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulado, proxy, opção EnvHttpProxyAgent e auxiliares de consulta fixada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime ciente de dispatcher sem importações de proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Leitor de corpo de resposta limitado sem a superfície ampla de runtime de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vínculo de conversa sem roteamento de vínculo configurado ou armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de armazenamento de sessão sem importações amplas de gravações/manutenção de configuração |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares restritos de coerção e normalização de registro primitivo/string sem importações de markdown/logging |
    | `plugin-sdk/host-runtime` | Auxiliares de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuração de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Auxiliares de diretório/identidade/workspace de agente, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidades e testes">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartilhados para buscar/transformar/armazenar mídia, sondagem de dimensões de vídeo baseada em ffprobe e construtores de payloads de mídia |
    | `plugin-sdk/media-mime` | Normalização restrita de MIME, mapeamento de extensões de arquivo, detecção de MIME e auxiliares de tipo de mídia |
    | `plugin-sdk/media-store` | Auxiliares restritos de armazenamento de mídia, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de failover para geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia, além de exportações de auxiliares de imagem/áudio voltadas para provedores |
    | `plugin-sdk/text-chunking` | Auxiliares de divisão/renderização de texto e markdown, conversão de tabelas markdown, remoção de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de divisão de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de exportações de diretiva, registro, validação, construtor de TTS compatível com OpenAI e auxiliares de fala voltadas para provedores |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva, normalização e exportações de auxiliares de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real e auxiliares de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagens, além de auxiliares de asset de imagem/URL de dados e o construtor de provedor de imagem compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagens, failover, autenticação e auxiliares de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, auxiliares de failover, consulta de provedor e análise de model-ref |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, auxiliares de failover, consulta de provedor e análise de model-ref |
    | `plugin-sdk/webhook-targets` | Registro de destino de Webhook e auxiliares de instalação de rotas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidade obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexportação de compatibilidade obsoleta; importe `zod` diretamente de `zod` |
    | `plugin-sdk/testing` | Barrel de compatibilidade obsoleto local ao repositório para testes legados do OpenClaw. Novos testes do repositório devem importar subcaminhos de teste locais focados, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi` local ao repositório para testes de unidade de registro direto de Plugin sem importar pontes de auxiliares de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contratos de adaptador de runtime de agente nativo locais ao repositório para testes de autenticação, entrega, fallback, hook de ferramenta, sobreposição de prompt, esquema e projeção de transcrição |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de teste orientados a canais, locais ao repositório, para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, encadeamento de send-config, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada local ao repositório de casos de erro de resolução de destino para testes de canal |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares locais ao repositório de pacote de Plugin, registro, artefato público, importação direta, API de runtime e contratos de efeito colateral de importação |
    | `plugin-sdk/provider-test-contracts` | Auxiliares locais ao repositório de runtime de provedor, autenticação, descoberta, onboard, catálogo, assistente, capacidade de mídia, política de replay, áudio ao vivo de STT em tempo real, busca/coleta web e contratos de stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação Vitest opt-in locais ao repositório para testes de provedor que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures genéricas locais ao repositório para captura de runtime de CLI, contexto de sandbox, gravador de skill, mensagem de agente, evento de sistema, recarregamento de módulo, caminho de Plugin empacotado, texto de terminal, divisão em partes, token de autenticação e casos tipados |
    | `plugin-sdk/test-node-mocks` | Auxiliares focados de mock de built-ins do Node, locais ao repositório, para uso dentro de factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície empacotada de auxiliares memory-core para auxiliares de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime de CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares de runtime principal do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação a fornecedores para auxiliares de runtime principal do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação a fornecedores para auxiliares de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Facade de runtime de memória ativa para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subcaminhos reservados de auxiliares empacotados">
    Atualmente não há subcaminhos de SDK reservados para auxiliares empacotados. Auxiliares específicos de proprietários
    ficam dentro do pacote do Plugin proprietário, enquanto contratos de host reutilizáveis
    usam subcaminhos genéricos do SDK, como `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
