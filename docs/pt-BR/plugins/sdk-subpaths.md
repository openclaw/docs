---
read_when:
    - Escolhendo o subcaminho correto de plugin-sdk para uma importação de Plugin
    - Auditoria de subcaminhos de Plugins incluídos e superfícies auxiliares
summary: 'Catálogo de subcaminhos do Plugin SDK: quais importações ficam onde, agrupadas por área'
title: Subcaminhos do SDK de Plugin
x-i18n:
    generated_at: "2026-05-11T20:34:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

O SDK de Plugin é exposto como um conjunto de subcaminhos públicos restritos em
`openclaw/plugin-sdk/`. Esta página cataloga os subcaminhos comumente usados, agrupados por
finalidade. O inventário gerado de pontos de entrada do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações do pacote são o subconjunto público
após subtrair os subcaminhos de teste/internos locais do repositório listados em
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Mantenedores podem auditar
a contagem de exportações públicas com `pnpm plugin-sdk:surface` e os subcaminhos auxiliares
reservados ativos com `pnpm plugins:boundary-report:summary`; exportações auxiliares reservadas
não utilizadas falham no relatório de CI em vez de permanecerem no SDK público como
dívida de compatibilidade inativa.

Para o guia de autoria de Plugin, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Entrada do Plugin

| Subcaminho                     | Principais exportações                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Auxiliares de itens do provedor de migração, como `createMigrationItem`, constantes de motivo, marcadores de status de item, auxiliares de redação e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Auxiliares de migração em tempo de execução, como `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                |

### Compatibilidade e auxiliares de teste obsoletos

Esses subcaminhos continuam sendo exportações do pacote para plugins mais antigos e conjuntos de testes do OpenClaw,
mas código novo não deve adicionar importações a partir deles: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` e `zod`. Importe `zod` diretamente de `zod` em código novo de Plugin.
`plugin-test-runtime` ainda é um subcaminho auxiliar de teste focado e ativo.

### Subcaminhos públicos não utilizados obsoletos

Esses subcaminhos públicos existiram por pelo menos um mês e atualmente não têm
importações de produção de extensões incluídas. Eles continuam importáveis para compatibilidade,
mas código novo de Plugin deve usar subcaminhos do SDK focados e ativamente consumidos em vez deles:
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
obsoletos para código novo de Plugin. Eles continuam sendo exportações do pacote para compatibilidade,
mas código novo deve preferir interfaces do SDK ativamente compartilhadas ou APIs de pacote
pertencentes ao Plugin. Mantenedores acompanham o conjunto exato em
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` e o orçamento atual
com `pnpm plugin-sdk:surface`.

### Barris amplos obsoletos

Esses barris amplos de reexportação continuam compiláveis para o código-fonte do OpenClaw e
verificações de compatibilidade, mas código novo deve preferir subcaminhos focados do SDK:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` e
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
e `text-runtime` continuam sendo exportações do pacote apenas para compatibilidade retroativa; use
subcaminhos focados de canal/runtime, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` e `logging-core` em vez disso.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do esquema Zod raiz `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Auxiliar de validação de JSON Schema em cache para esquemas pertencentes ao plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, mais `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração, prompts de allowlist, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilidade obsoleto; use `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuração multi-conta/portão de ação, auxiliares de fallback para conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalização de ID de conta |
    | `plugin-sdk/account-resolution` | Auxiliares de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Auxiliares restritos de lista de contas/ação de conta |
    | `plugin-sdk/access-groups` | Análise de allowlist de grupo de acesso e auxiliares de diagnóstico de grupo com redação |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Auxiliares legados do pipeline de resposta. O novo código do pipeline de resposta de canal deve usar `createChannelMessageReplyPipeline` e `resolveChannelMessageSourceReplyDeliveryMode` de `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivos compartilhados de esquema de configuração de canal, além de Zod e construtores diretos JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração de canais OpenClaw incluídos apenas para plugins incluídos mantidos |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilidade obsoleto para esquemas de configuração de canal incluído |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalização/validação de comandos personalizados do Telegram com fallback de contrato incluído |
    | `plugin-sdk/command-gating` | Auxiliares restritos de portão de autorização de comando |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fachada obsoleta de compatibilidade de baixo nível para ingresso de canal. Novos caminhos de recebimento devem usar `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolvedor experimental de runtime de ingresso de canal de alto nível e construtores de fatos de rota para caminhos migrados de recebimento de canal. Prefira isso em vez de montar allowlists efetivas, allowlists de comandos e projeções legadas em cada plugin. Consulte [API de ingresso de canal](/pt-BR/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` e auxiliares legados de ciclo de vida de fluxo de rascunho. O novo código de finalização de pré-visualização deve usar `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Auxiliares baratos de contrato de ciclo de vida de mensagem, como `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, derivação de capacidade final durável, auxiliares de prova de capacidade para capacidades de envio/recibo/efeito colateral, `MessageReceiveContext`, provas de política de confirmação de recebimento, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, provas de capacidade de pré-visualização ao vivo e finalizador ao vivo, estado de recuperação durável, `RenderedMessageBatch`, tipos de recibo de mensagem e auxiliares de ID de recibo. Consulte [API de mensagem de canal](/pt-BR/plugins/sdk-channel-message). Fachadas legadas de despacho de resposta são apenas compatibilidade obsoleta. |
    | `plugin-sdk/channel-message-runtime` | Auxiliares de entrega em runtime que podem carregar entrega de saída, incluindo `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` e `withDurableMessageSendContext`. Pontes obsoletas de despacho de resposta permanecem importáveis apenas para despachantes de compatibilidade. Use a partir de módulos de runtime de monitoramento/envio, não de arquivos de inicialização de plugin em caminho crítico. |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares legados compartilhados de registro e despacho de entrada, predicados de despacho visível/final e compatibilidade obsoleta `deliverDurableInboundReplyPayload` para despachantes de canal preparados. O novo código de recebimento/despacho de canal deve importar auxiliares de ciclo de vida de runtime de `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Auxiliares de análise/correspondência de destino |
    | `plugin-sdk/outbound-media` | Auxiliares compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-send-deps` | Busca leve de dependência de envio de saída para adaptadores de canal |
    | `plugin-sdk/outbound-runtime` | Auxiliares de identidade de saída, delegado de envio, sessão, formatação e planejamento de payload. Auxiliares de entrega direta, como `deliverOutboundPayloads`, são substrato de compatibilidade obsoleto; use `plugin-sdk/channel-message-runtime` para novos caminhos de envio. |
    | `plugin-sdk/poll-runtime` | Auxiliares restritos de normalização de enquete |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida de vinculação de thread e adaptador |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de conversa/vinculação de thread, pareamento e vinculação configurada |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Auxiliares compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos restritos de esquema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelude de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edição/leitura de configuração de allowlist |
    | `plugin-sdk/group-access` | Auxiliares compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Auxiliares compartilhados de autenticação/guarda de DM direto |
    | `plugin-sdk/discord` | Fachada obsoleta de compatibilidade do Discord para `@openclaw/discord@2026.3.13` publicado e compatibilidade rastreada do proprietário; novos plugins devem usar subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/telegram-account` | Fachada obsoleta de compatibilidade de resolução de conta do Telegram para compatibilidade rastreada do proprietário; novos plugins devem usar auxiliares de runtime injetados ou subcaminhos genéricos do SDK de canal |
    | `plugin-sdk/zalouser` | Fachada obsoleta de compatibilidade do Zalo Personal para pacotes Lark/Zalo publicados que ainda importam autorização de comando de remetente; novos plugins devem usar `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Apresentação semântica de mensagens, entrega e auxiliares legados de resposta interativa. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidade para debounce de entrada, correspondência de menção, auxiliares de política de menção e auxiliares de envelope |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares restritos de debounce de entrada |
    | `plugin-sdk/channel-mention-gating` | Auxiliares restritos de política de menção, marcador de menção e texto de menção sem a superfície mais ampla de runtime de entrada |
    | `plugin-sdk/channel-envelope` | Auxiliares restritos de formatação de envelope de entrada |
    | `plugin-sdk/channel-location` | Contexto de localização de canal e auxiliares de formatação |
    | `plugin-sdk/channel-logging` | Auxiliares de logging de canal para descartes de entrada e falhas de digitação/confirmação |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | Auxiliares de ação de mensagem de canal, além de auxiliares obsoletos de esquema nativo mantidos para compatibilidade de plugin |
    | `plugin-sdk/channel-route` | Normalização compartilhada de rota, resolução de destino orientada por parser, transformação de ID de thread em string, chaves de rota deduplicadas/compactas, tipos de destino analisado e auxiliares de comparação de rota/destino |
    | `plugin-sdk/channel-targets` | Auxiliares de análise de destino; chamadores de comparação de rota devem usar `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Conexão de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares restritos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipos de destino de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedores">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fachada de provedor LM Studio compatível para configuração, descoberta de catálogo e preparação de modelo em tempo de execução |
    | `plugin-sdk/lmstudio-runtime` | Fachada de runtime LM Studio compatível para padrões de servidor local, descoberta de modelos, cabeçalhos de solicitação e helpers de modelo carregado |
    | `plugin-sdk/provider-setup` | Helpers selecionados para configuração de provedor local/auto-hospedado |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados para configuração de provedor auto-hospedado compatível com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend da CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolução de chaves de API em tempo de execução para plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-env-vars` | Helpers de consulta de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de políticas de replay, helpers de endpoint de provedor e helpers compartilhados de normalização de ID de modelo |
    | `plugin-sdk/provider-catalog-runtime` | Hook de runtime para ampliação de catálogo de provedor e seams de registro de plugin-provedor para testes de contrato |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidade HTTP/endpoint de provedor, erros HTTP de provedor e helpers de formulário multipart para transcrição de áudio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers estreitos de contrato de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provedor de web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers estreitos de configuração/credencial de web-search para provedores que não precisam de fiação de habilitação de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers estreitos de contrato de configuração/credencial de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/runtime de provedor de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza + diagnósticos de esquema do Gemini |
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
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers leves de carregamento de adaptador de aprovação nativa para entrypoints de canal quentes |
    | `plugin-sdk/approval-handler-runtime` | Helpers mais amplos de runtime de manipulador de aprovação; prefira os seams mais estreitos de adaptador/gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação nativa + vinculação de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de resposta de aprovação de exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de payload de aprovação de exec/plugin, helpers de roteamento/runtime de aprovação nativa e helpers de exibição estruturada de aprovação, como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers estreitos de redefinição de deduplicação de respostas de entrada |
    | `plugin-sdk/channel-contract-testing` | Helpers estreitos de teste de contrato de canal sem o barrel amplo de testes |
    | `plugin-sdk/command-auth-native` | Autenticação nativa de comandos, formatação dinâmica de menu de argumentos e helpers nativos de destino de sessão |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados leves de texto de comando para caminhos quentes de canal |
    | `plugin-sdk/command-surface` | Normalização de corpo de comando e helpers de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers estreitos de coleta de contrato de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers estreitos de `coerceSecretRef` e tipagem SecretRef para análise de contrato/configuração de segredo |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de confiança, bloqueio de DM, arquivos/caminhos limitados à raiz, incluindo gravações somente de criação, substituição atômica de arquivo síncrona/assíncrona, gravações temporárias irmãs, fallback de movimentação entre dispositivos, helpers de armazenamento privado de arquivos, guardas de pai de symlink, conteúdo externo, redação de texto sensível, comparação de segredo em tempo constante e helpers de coleta de segredo |
    | `plugin-sdk/ssrf-policy` | Helpers de lista de permissões de hosts e política de SSRF de rede privada |
    | `plugin-sdk/ssrf-dispatcher` | Helpers estreitos de despachador fixado sem a superfície ampla de runtime de infraestrutura |
    | `plugin-sdk/ssrf-runtime` | Despachador fixado, fetch protegido contra SSRF, erro de SSRF e helpers de política de SSRF |
    | `plugin-sdk/secret-input` | Helpers de análise de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitação/destino de Webhook e coerção de websocket/corpo bruto |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho/timeout de corpo de solicitação |
  </Accordion>

  <Accordion title="Subcaminhos de tempo de execução e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de tempo de execução/log/backup/instalação de plugins |
    | `plugin-sdk/runtime-env` | Helpers restritos de ambiente de tempo de execução, logger, timeout, nova tentativa e backoff |
    | `plugin-sdk/browser-config` | Fachada de configuração de navegador compatível para perfil/padrões normalizados, análise de URL CDP e helpers de autenticação de controle do navegador |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e consulta de contexto de tempo de execução de canal |
    | `plugin-sdk/matrix` | Fachada de compatibilidade Matrix obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar `plugin-sdk/run-command` diretamente |
    | `plugin-sdk/mattermost` | Fachada de compatibilidade Mattermost obsoleta para pacotes de canal de terceiros mais antigos; novos plugins devem importar subcaminhos genéricos do SDK diretamente |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativos de Plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados de pipeline de Webhook/hook interno |
    | `plugin-sdk/lazy-runtime` | Helpers de importação/vinculação tardia de tempo de execução, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação da CLI, espera, versão, invocação por argumentos e grupo de comandos tardio |
    | `plugin-sdk/gateway-runtime` | Cliente de Gateway, helper de início de cliente pronto para loop de eventos, RPC da CLI do Gateway, erros de protocolo do Gateway e helpers de patch de status de canal |
    | `plugin-sdk/config-contracts` | Superfície focada somente em tipos de configuração para formatos de configuração de Plugin, como `OpenClawConfig` e tipos de configuração de canal/provedor |
    | `plugin-sdk/plugin-config-runtime` | Helpers de consulta de configuração de Plugin em tempo de execução, como `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers de mutação transacional de configuração, como `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers de snapshot de configuração do processo atual, como `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setters de snapshot de teste |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram empacotado está indisponível |
    | `plugin-sdk/text-autolink-runtime` | Detecção de autolink de referência de arquivo sem o barril amplo de texto |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de execução/Plugin, construtores de capacidade de aprovação, helpers de autenticação/perfil, helpers nativos de roteamento/tempo de execução e formatação de caminho de exibição de aprovação estruturada |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de tempo de execução de entrada/resposta, divisão em partes, despacho, Heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers restritos de despacho/finalização de resposta e rótulo de conversa |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico de respostas em janela curta e marcadores como `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers restritos de divisão de texto/Markdown em partes |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho de armazenamento de sessão, chave de sessão, atualizado em e mutação de armazenamento |
    | `plugin-sdk/cron-store-runtime` | Helpers de caminho/carregamento/salvamento de armazenamento de Cron |
    | `plugin-sdk/state-paths` | Helpers de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de rota/chave de sessão/vinculação de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de tempo de execução e helpers de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolvedor de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrai URLs em string de entradas fetch/semelhantes a request |
    | `plugin-sdk/run-command` | Executor de comandos temporizado com resultados stdout/stderr normalizados |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-payload` | Extrai payloads normalizados de objetos de resultado de ferramenta |
    | `plugin-sdk/tool-send` | Extrai campos canônicos de destino de envio dos argumentos da ferramenta |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho de download temporário e workspaces temporários seguros privados |
    | `plugin-sdk/logging-core` | Logger de subsistema e helpers de redação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tabela Markdown e conversão |
    | `plugin-sdk/model-session-runtime` | Helpers de substituição de modelo/sessão, como `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de resolução de configuração do provedor de conversa |
    | `plugin-sdk/json-store` | Pequenos helpers de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de bloqueio de arquivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de desduplicação com persistência em disco |
    | `plugin-sdk/acp-runtime` | Helpers de tempo de execução/sessão e despacho de resposta ACP |
    | `plugin-sdk/acp-runtime-backend` | Helpers leves de registro de backend ACP e despacho de resposta para plugins carregados na inicialização |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolução somente leitura de vinculação ACP sem importações de inicialização de ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas restritas de esquema de configuração de tempo de execução de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo e token de pareamento |
    | `plugin-sdk/extension-shared` | Primitivas compartilhadas de canal passivo, status e helper de proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta de comando/provedor `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skill |
    | `plugin-sdk/native-command-registry` | Helpers de registro/construção/serialização de comandos nativos |
    | `plugin-sdk/agent-harness` | Superfície experimental de Plugin confiável para harnesses de agente de baixo nível: tipos de harness, helpers de direcionamento/aborto de execução ativa, helpers de ponte de ferramentas do OpenClaw, helpers de política de ferramenta de plano de tempo de execução, classificação de resultado de terminal, helpers de formatação/detalhe de progresso de ferramenta e utilitários de resultado de tentativa |
    | `plugin-sdk/provider-zai-endpoint` | Fachada obsoleta de detecção de endpoint pertencente ao provedor Z.AI; use a API pública do Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de bloqueio assíncrono local ao processo para pequenos arquivos de estado de tempo de execução |
    | `plugin-sdk/channel-activity-runtime` | Helper de telemetria de atividade de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concorrência limitada de tarefas assíncronas |
    | `plugin-sdk/dedupe-runtime` | Helpers de cache de desduplicação em memória |
    | `plugin-sdk/delivery-queue-runtime` | Helper de drenagem de entregas pendentes de saída |
    | `plugin-sdk/file-access-runtime` | Helpers seguros de caminho de arquivo local e fonte de mídia |
    | `plugin-sdk/heartbeat-runtime` | Helpers de ativação, evento e visibilidade de Heartbeat |
    | `plugin-sdk/number-runtime` | Helper de coerção numérica |
    | `plugin-sdk/secure-random-runtime` | Helpers de token/UUID seguros |
    | `plugin-sdk/system-event-runtime` | Helpers de fila de eventos do sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper de espera de prontidão de transporte |
    | `plugin-sdk/infra-runtime` | Shim de compatibilidade obsoleto; use os subcaminhos focados de tempo de execução acima |
    | `plugin-sdk/collection-runtime` | Pequenos helpers de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag de diagnóstico, evento e contexto de rastreamento |
    | `plugin-sdk/error-runtime` | Helpers de grafo de erros, formatação e classificação compartilhada de erros, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulado, proxy, opção EnvHttpProxyAgent e helpers de consulta fixada |
    | `plugin-sdk/runtime-fetch` | Fetch de tempo de execução ciente de dispatcher sem importações de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Leitor limitado de corpo de resposta sem a superfície ampla de tempo de execução de mídia |
    | `plugin-sdk/session-binding-runtime` | Estado atual de vinculação de conversa sem roteamento de vinculação configurado nem armazenamentos de pareamento |
    | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão sem importações amplas de gravações/manutenção de configuração |
    | `plugin-sdk/context-visibility-runtime` | Resolução de visibilidade de contexto e filtragem de contexto suplementar sem importações amplas de configuração/segurança |
    | `plugin-sdk/string-coerce-runtime` | Helpers restritos de coerção e normalização de registro primitivo/string sem importações de markdown/log |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuração de nova tentativa e executor de novas tentativas |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identidade/workspace de agente, incluindo `resolveAgentDir`, `resolveDefaultAgentDir` e exportação de compatibilidade obsoleta `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicação de diretório baseada em configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e teste">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartilhados para buscar/transformar/armazenar mídia, sondagem de dimensões de vídeo baseada em ffprobe e construtores de payloads de mídia |
    | `plugin-sdk/media-mime` | Normalização estreita de MIME, mapeamento de extensões de arquivo, detecção de MIME e auxiliares de tipo de mídia |
    | `plugin-sdk/media-store` | Auxiliares estreitos de armazenamento de mídia, como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de failover de geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedores de compreensão de mídia, além de exportações de auxiliares voltados a provedores para imagem/áudio/extração estruturada |
    | `plugin-sdk/text-chunking` | Auxiliares de fragmentação/renderização de texto e markdown, conversão de tabelas markdown, remoção de tags de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de fragmentação de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedores de fala, além de exportações de diretiva, registro, validação, construtor TTS compatível com OpenAI e auxiliares de fala voltadas a provedores |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedores de fala, registro, diretiva, normalização e exportações de auxiliares de fala |
    | `plugin-sdk/realtime-transcription` | Tipos de provedores de transcrição em tempo real, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de provedores de voz em tempo real e auxiliares de registro |
    | `plugin-sdk/image-generation` | Tipos de provedores de geração de imagens, além de auxiliares de URL de dados/ativos de imagem e o construtor de provedor de imagem compatível com OpenAI |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagens, failover, autenticação e auxiliares de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, auxiliares de failover, busca de provedor e análise de model-ref |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, auxiliares de failover, busca de provedor e análise de model-ref |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook e auxiliares de instalação de rotas |
    | `plugin-sdk/webhook-path` | Alias de compatibilidade obsoleto; use `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Auxiliares compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | Reexportação de compatibilidade obsoleta; importe `zod` de `zod` diretamente |
    | `plugin-sdk/testing` | Barrel de compatibilidade obsoleto local do repositório para testes legados do OpenClaw. Novos testes do repositório devem importar subcaminhos de teste locais focados, como `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Auxiliar mínimo `createTestPluginApi` local do repositório para testes unitários de registro direto de plugins sem importar pontes de auxiliares de teste do repositório |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrato de adaptador nativo de agent-runtime locais do repositório para testes de autenticação, entrega, fallback, hook de ferramenta, sobreposição de prompt, esquema e projeção de transcrito |
    | `plugin-sdk/channel-test-helpers` | Auxiliares de teste orientados a canais locais do repositório para contratos genéricos de ações/configuração/status, asserções de diretório, ciclo de vida de inicialização de conta, encadeamento de send-config, mocks de runtime, problemas de status, entrega de saída e registro de hooks |
    | `plugin-sdk/channel-target-testing` | Suíte compartilhada local do repositório de casos de erro de resolução de destino para testes de canais |
    | `plugin-sdk/plugin-test-contracts` | Auxiliares de contrato locais do repositório para pacote de plugin, registro, artefato público, importação direta, API de runtime e efeitos colaterais de importação |
    | `plugin-sdk/provider-test-contracts` | Auxiliares de contrato locais do repositório para runtime de provedor, autenticação, descoberta, onboard, catálogo, assistente, capacidade de mídia, política de replay, áudio ao vivo de STT em tempo real, pesquisa/busca na web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/autenticação opcionais do Vitest locais do repositório para testes de provedores que exercitam `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures locais genéricas do repositório para captura de runtime de CLI, contexto de sandbox, gravador de skill, mensagem de agente, evento de sistema, recarregamento de módulo, caminho de plugin incluído, texto de terminal, fragmentação, token de autenticação e caso tipado |
    | `plugin-sdk/test-node-mocks` | Auxiliares focados locais do repositório para mocks de módulos internos do Node para uso dentro de factories `vi.mock("node:*")` do Vitest |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície de auxiliares memory-core incluída para auxiliares de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/pesquisa de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações de mecanismo de fundação do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings do host de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares de runtime de CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares de runtime core do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação ao fornecedor para auxiliares de runtime core do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação ao fornecedor para auxiliares de diário de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartilhados de markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada de runtime de Active Memory para acesso ao search-manager |
    | `plugin-sdk/memory-host-status` | Alias de compatibilidade obsoleto; use `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subcaminhos reservados de auxiliares incluídos">
    Atualmente não há subcaminhos de SDK reservados para auxiliares incluídos. Auxiliares específicos de proprietário
    ficam dentro do pacote do plugin proprietário, enquanto contratos de host reutilizáveis
    usam subcaminhos genéricos de SDK, como `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
