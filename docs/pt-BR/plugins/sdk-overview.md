---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK Overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do Plugin SDK
x-i18n:
    generated_at: "2026-04-08T02:18:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a41bd82d165dfbb7fbd6e4528cf322e9133a51efe55fa8518a7a0a626d9d30
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Visão geral do Plugin SDK

O Plugin SDK é o contrato tipado entre plugins e o core. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Tip>
  **Está procurando um guia prático?**
  - Primeiro plugin? Comece com [Getting Started](/pt-BR/plugins/building-plugins)
  - Plugin de canal? Veja [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins)
  - Plugin de provedor? Veja [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins)
</Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para helpers de entrada/build específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

Não adicione nem dependa de atalhos de conveniência nomeados por provedor, como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, nem de
atalhos de helpers com marca de canal. Plugins incluídos devem compor subcaminhos genéricos do
SDK dentro de seus próprios barrels `api.ts` ou `runtime-api.ts`, e o core
deve usar esses barrels locais do plugin ou adicionar um contrato genérico e estreito do SDK
quando a necessidade for realmente entre canais.

O mapa de exportação gerado ainda contém um pequeno conjunto de atalhos de helper de plugins incluídos,
como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Esses
subcaminhos existem apenas para manutenção e compatibilidade de plugins incluídos; eles são
omitidos intencionalmente da tabela comum abaixo e não são o caminho de importação recomendado para
novos plugins de terceiros.

## Referência de subcaminhos

Os subcaminhos mais usados, agrupados por finalidade. A lista completa gerada de
mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`.

Subcaminhos reservados de helpers de plugins incluídos ainda aparecem nessa lista gerada.
Trate-os como superfícies de detalhe de implementação/compatibilidade, a menos que uma página da documentação
os promova explicitamente como públicos.

### Entrada de plugin

| Subcaminho                 | Exportações principais                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subcaminhos de canal">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do schema Zod raiz `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartilhados de assistente de configuração, prompts de allowlist, construtores de status de configuração |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuração/controle de ação para múltiplas contas, helpers de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalização de id de conta |
    | `plugin-sdk/account-resolution` | Helpers de busca de conta + fallback padrão |
    | `plugin-sdk/account-helpers` | Helpers restritos de lista/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos do schema de configuração de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização/validação de comandos personalizados do Telegram com fallback de contrato incluído |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartilhados de registrar e despachar entrada |
    | `plugin-sdk/messaging-targets` | Helpers de análise/correspondência de alvo |
    | `plugin-sdk/outbound-media` | Helpers compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-runtime` | Helpers de identidade de saída/delegação de envio |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida e adaptadores para vinculação de threads |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia do agente |
    | `plugin-sdk/conversation-runtime` | Helpers de vinculação de conversa/thread, pairing e binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de configuração de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Helpers compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas restritas de schema de configuração de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorização de gravação de configuração de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações compartilhadas de prelúdio de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edição/leitura de configuração de allowlist |
    | `plugin-sdk/group-access` | Helpers compartilhados de decisão de acesso a grupo |
    | `plugin-sdk/direct-dm` | Helpers compartilhados de autenticação/proteção de DM direto |
    | `plugin-sdk/interactive-runtime` | Helpers de normalização/redução de payload de resposta interativa |
    | `plugin-sdk/channel-inbound` | Helpers de debounce de entrada, correspondência de menção, política de menção e envelope |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers de análise/correspondência de alvo |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Wiring de feedback/reação |
    | `plugin-sdk/channel-secret-runtime` | Helpers restritos de contrato de segredo, como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, e tipos de alvo de segredo |
  </Accordion>

  <Accordion title="Subcaminhos de provedor">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers de configuração selecionados para provedores locais/auto-hospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração para provedores auto-hospedados compatíveis com OpenAI |
    | `plugin-sdk/cli-backend` | Padrões de backend de CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de runtime para resolução de chave de API em plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/gravação de perfil de chave de API, como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de autenticação OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartilhados de login interativo para plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Helpers de busca de variáveis de ambiente de autenticação de provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de id de modelo, como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de HTTP/capacidade de endpoint de provedor |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers restritos de contrato de configuração/seleção de web-fetch, como `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provedor de web-fetch |
    | `plugin-sdk/provider-web-search-contract` | Helpers restritos de contrato de configuração/credencial de web-search, como `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, e setters/getters de credenciais com escopo |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/runtime de provedor de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnóstico de schema do Gemini e helpers de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e semelhantes |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuração de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/cache locais ao processo |
  </Accordion>

  <Accordion title="Subcaminhos de autenticação e segurança">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comando, helpers de autorização de remetente |
    | `plugin-sdk/approval-auth-runtime` | Resolução de aprovador e helpers de autenticação de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfil/filtro de aprovação de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidade/entrega de aprovação |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartilhado de resolução de gateway de aprovação |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers leves de carregamento de adaptador nativo de aprovação para entrypoints de canal críticos |
    | `plugin-sdk/approval-handler-runtime` | Helpers mais amplos de runtime de handler de aprovação; prefira os atalhos mais restritos de adaptador/gateway quando forem suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de alvo de aprovação + vinculação de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de resposta de aprovação de exec/plugin |
    | `plugin-sdk/command-auth-native` | Helpers de autenticação de comando nativo + alvo de sessão nativa |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comando |
    | `plugin-sdk/command-surface` | Helpers de normalização do corpo de comando e da superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers restritos de coleta de contrato de segredo para superfícies de segredo de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers restritos `coerceSecretRef` e helpers de tipagem de SecretRef para parsing de contrato de segredo/configuração |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de confiança, proteção de DM, conteúdo externo e coleta de segredos |
    | `plugin-sdk/ssrf-policy` | Helpers de allowlist de host e política SSRF de rede privada |
    | `plugin-sdk/ssrf-runtime` | Helpers de pinned-dispatcher, fetch protegido por SSRF e política SSRF |
    | `plugin-sdk/secret-input` | Helpers de parsing de entrada de segredo |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitação/alvo de webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho do corpo/timeout da solicitação |
  </Accordion>

  <Accordion title="Subcaminhos de runtime e armazenamento">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime/log/backup/instalação de plugin |
    | `plugin-sdk/runtime-env` | Helpers restritos de env de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro e busca de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativo de plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados de pipeline de webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Helpers de importação/vinculação lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação, espera e versão da CLI |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente de gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Helpers de carregamento/gravação de configuração |
    | `plugin-sdk/telegram-command-config` | Normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram incluído não está disponível |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de exec/plugin, construtores de capacidade de aprovação, helpers de autenticação/perfil, helpers nativos de roteamento/runtime |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, chunking, despacho, heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers restritos de despacho/finalização de resposta |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico de resposta de janela curta, como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers restritos de chunking de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho da store de sessão + `updated-at` |
    | `plugin-sdk/state-paths` | Helpers de caminho de diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de rota/chave de sessão/vinculação de conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de problema |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolvedor de alvo |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs string de entradas no estilo fetch/request |
    | `plugin-sdk/run-command` | Executor de comando com tempo limite e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de ferramenta/CLI |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de alvo de envio de argumentos de ferramenta |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho temporário para download |
    | `plugin-sdk/logging-core` | Logger de subsistema e helpers de redação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tabela Markdown |
    | `plugin-sdk/json-store` | Pequenos helpers de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de file-lock reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache deduplicado persistente em disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão ACP e despacho de resposta |
    | `plugin-sdk/agent-config-primitives` | Primitivas restritas de schema de configuração de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nome perigoso |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo e token de pairing |
    | `plugin-sdk/extension-shared` | Primitivas compartilhadas de canal passivo, status e helper de proxy ambiente |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta do comando `/models`/provedor |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/build/serialização de comando nativo |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers de evento de sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Pequenos helpers de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de erros, formatação, helpers compartilhados de classificação de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulado, proxy e lookup fixado |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuração e executor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identidade/workspace de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicação de diretório com suporte de configuração |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subcaminhos de capacidade e testes">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de busca/transformação/armazenamento de mídia mais construtores de payload de mídia |
    | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de failover para geração de mídia, seleção de candidatos e mensagens de modelo ausente |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia mais exportações de helpers de imagem/áudio voltadas para provedores |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/Markdown/log, como remoção de texto visível ao assistente, helpers de renderização/chunking/tabela Markdown, helpers de redação, helpers de tag de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de chunking de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala mais helpers de diretiva, registro e validação voltados para provedores |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva e helpers de normalização |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real e helpers de registro |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagem |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, failover, autenticação e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/solicitação/resultado de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/video-generation` | Tipos de provedor/solicitação/resultado de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, busca de provedor e parsing de referência de modelo |
    | `plugin-sdk/webhook-targets` | Registro de alvo de webhook e helpers de instalação de rota |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subcaminhos de memória">
    | Subcaminho | Exportações principais |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície incluída de helper memory-core para helpers de gerenciador/configuração/arquivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do engine base do host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exportações do engine de embeddings do host de memória |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do engine QMD do host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do engine de armazenamento do host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal de eventos do host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI do host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime core do host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-core` | Alias neutro em relação ao fornecedor para helpers de runtime core do host de memória |
    | `plugin-sdk/memory-host-events` | Alias neutro em relação ao fornecedor para helpers de journal de eventos do host de memória |
    | `plugin-sdk/memory-host-files` | Alias neutro em relação ao fornecedor para helpers de arquivo/runtime do host de memória |
    | `plugin-sdk/memory-host-markdown` | Helpers compartilhados de Markdown gerenciado para plugins adjacentes à memória |
    | `plugin-sdk/memory-host-search` | Fachada ativa de runtime de memória para acesso ao gerenciador de busca |
    | `plugin-sdk/memory-host-status` | Alias neutro em relação ao fornecedor para helpers de status do host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície incluída de helper memory-lancedb |
  </Accordion>

  <Accordion title="Subcaminhos reservados de helpers incluídos">
    | Família | Subcaminhos atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de suporte do plugin de navegador incluído (`browser-support` continua sendo o barrel de compatibilidade) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície de helper/runtime do Matrix incluído |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície de helper/runtime do LINE incluído |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície de helper do IRC incluído |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Atalhos de compatibilidade/helper de canais incluídos |
    | Helpers específicos de autenticação/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Atalhos de helper de recurso/plugin incluído; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capacidade

| Método                                           | O que ele registra              |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)       |
| `api.registerCliBackend(...)`                    | Backend local de inferência por CLI |
| `api.registerChannel(...)`                       | Canal de mensagens              |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões de voz em tempo real duplex |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo   |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem               |
| `api.registerMusicGenerationProvider(...)`       | Geração de música               |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/web scrape    |
| `api.registerWebSearchProvider(...)`             | Busca na web                    |

### Ferramentas e comandos

| Método                          | O que ele registra                           |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta do agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)         |

### Infraestrutura

| Método                                         | O que ele registra                     |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do gateway               |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do gateway                  |
| `api.registerCli(registrar, opts?)`            | Subcomando da CLI                      |
| `api.registerService(service)`                 | Serviço em segundo plano               |
| `api.registerInteractiveHandler(registration)` | Handler interativo                     |
| `api.registerMemoryPromptSupplement(builder)`  | Seção adicional de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus adicional de busca/leitura de memória |

Namespaces administrativos reservados do core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre permanecem `operator.admin`, mesmo que um plugin tente atribuir
um escopo de método de gateway mais estreito. Prefira prefixos específicos de plugin para
métodos de propriedade do plugin.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes explícitas de comando pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de parsing usados para ajuda da CLI raiz,
  roteamento e registro lazy da CLI do plugin

Se você quiser que um comando de plugin permaneça lazy-loaded no caminho normal da CLI raiz,
forneça `descriptors` que cubram toda raiz de comando de nível superior exposta por esse
registrador.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando não precisar de registro lazy na CLI raiz.
Esse caminho compatível e eager continua sendo suportado, mas não instala
placeholders respaldados por descritores para lazy loading em tempo de parsing.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que um plugin seja dono da configuração padrão de um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `codex-cli/gpt-5`.
- A `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário continua prevalecendo. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de reescritas de compatibilidade após a mesclagem
  (por exemplo, normalizando formatos antigos de flag).

### Slots exclusivos

| Método                                     | O que ele registra                   |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Engine de contexto (um ativo por vez) |
| `api.registerMemoryCapability(capability)` | Capacidade unificada de memória      |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória      |

### Adaptadores de embedding de memória

| Método                                         | O que ele registra                            |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para plugin de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que plugins complementares possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas legadas e compatíveis para plugin de memória.
- `registerMemoryEmbeddingProvider` permite que o plugin de memória ativo registre um
  ou mais ids de adaptador de embedding (por exemplo, `openai`, `gemini`, ou um id personalizado definido pelo plugin).
- A configuração do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, é resolvida em relação a esses ids de adaptador registrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz                |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado |
| `api.onConversationBindingResolved(handler)` | Callback de vinculação de conversa |

### Semântica de decisão de hook

- `before_tool_call`: retornar `{ block: true }` é terminal. Depois que qualquer handler o definir, handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (o mesmo que omitir `block`), não como uma substituição.
- `before_install`: retornar `{ block: true }` é terminal. Depois que qualquer handler o definir, handlers de prioridade mais baixa são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (o mesmo que omitir `block`), não como uma substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Depois que qualquer handler reivindica o despacho, handlers de prioridade mais baixa e o caminho padrão de despacho do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Depois que qualquer handler o definir, handlers de prioridade mais baixa são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (o mesmo que omitir `cancel`), não como uma substituição.

### Campos do objeto API

| Campo                    | Tipo                      | Descrição                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id do plugin                                                                                |
| `api.name`               | `string`                  | Nome de exibição                                                                            |
| `api.version`            | `string?`                 | Versão do plugin (opcional)                                                                 |
| `api.description`        | `string?`                 | Descrição do plugin (opcional)                                                              |
| `api.source`             | `string`                  | Caminho de origem do plugin                                                                 |
| `api.rootDir`            | `string?`                 | Diretório raiz do plugin (opcional)                                                         |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da configuração (snapshot ativo em memória do runtime quando disponível)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do plugin em `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve o caminho em relação à raiz do plugin                                               |

## Convenção de módulo interno

Dentro do seu plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações internas de runtime apenas
  index.ts          # Ponto de entrada do plugin
  setup-entry.ts    # Entrada leve apenas para configuração (opcional)
```

<Warning>
  Nunca importe seu próprio plugin por meio de `openclaw/plugin-sdk/<your-plugin>`
  no código de produção. Encaminhe importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de plugins incluídos carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos públicos de entrada semelhantes) agora preferem o
snapshot ativo da configuração de runtime quando o OpenClaw já está em execução. Se ainda
não existir nenhum snapshot de runtime, elas recorrem ao arquivo de configuração resolvido em disco.

Plugins de provedor também podem expor um barrel de contrato local do plugin quando um
helper é intencionalmente específico do provedor e ainda não pertence a um subcaminho genérico do SDK.
Exemplo incluído atual: o provedor Anthropic mantém seus helpers de stream Claude em seu próprio
atalho público `api.ts` / `contract-api.ts` em vez de promover a lógica de cabeçalho beta da Anthropic
e `service_tier` para um contrato genérico `plugin-sdk/*`.

Outros exemplos incluídos atuais:

- `@openclaw/openai-provider`: `api.ts` exporta construtores de provedor,
  helpers de modelo padrão e construtores de provedor em tempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta o construtor do provedor mais
  helpers de onboarding/configuração

<Warning>
  O código de produção de extensões também deve evitar importações `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o para um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada por capacidade, em vez de acoplar dois plugins entre si.
</Warning>

## Relacionado

- [Entry Points](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry` e `defineChannelPluginEntry`
- [Runtime Helpers](/pt-BR/plugins/sdk-runtime) — referência completa do namespace `api.runtime`
- [Setup and Config](/pt-BR/plugins/sdk-setup) — empacotamento, manifests, schemas de configuração
- [Testing](/pt-BR/plugins/sdk-testing) — utilitários de teste e regras de lint
- [SDK Migration](/pt-BR/plugins/sdk-migration) — migração a partir de superfícies descontinuadas
- [Plugin Internals](/pt-BR/plugins/architecture) — arquitetura detalhada e modelo de capacidade
