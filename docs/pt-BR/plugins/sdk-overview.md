---
read_when:
    - Você precisa saber de qual subpath do SDK importar
    - Você quer uma referência para todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK Overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do Plugin SDK
x-i18n:
    generated_at: "2026-04-06T03:10:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: d801641f26f39dc21490d2a69a337ff1affb147141360916b8b58a267e9f822a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Visão geral do Plugin SDK

O plugin SDK é o contrato tipado entre plugins e o core. Esta página é a
referência para **o que importar** e **o que você pode registrar**.

<Tip>
  **Está procurando um guia prático?**
  - Primeiro plugin? Comece com [Getting Started](/pt-BR/plugins/building-plugins)
  - Plugin de canal? Consulte [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins)
  - Plugin de provedor? Consulte [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins)
</Tip>

## Convenção de importação

Sempre importe de um subpath específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subpath é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para helpers de entrada/build específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície guarda-chuva mais ampla e helpers compartilhados como
`buildChannelConfigSchema`.

Não adicione nem dependa de separações de conveniência com nome de provedor, como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ou
separações de helpers com marca de canal. Plugins incluídos devem compor subpaths genéricos
do SDK dentro de seus próprios barrels `api.ts` ou `runtime-api.ts`, e o core
deve usar esses barrels locais do plugin ou adicionar um contrato estreito e genérico do SDK
quando a necessidade for realmente entre canais.

O mapa de exportação gerado ainda contém um pequeno conjunto de separações de helper
de plugins incluídos, como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Esses
subpaths existem apenas para manutenção e compatibilidade de plugins incluídos; eles são
intencionalmente omitidos da tabela comum abaixo e não são o caminho de importação
recomendado para novos plugins de terceiros.

## Referência de subpaths

Os subpaths mais usados, agrupados por finalidade. A lista completa gerada de
mais de 200 subpaths fica em `scripts/lib/plugin-sdk-entrypoints.json`.

Subpaths reservados de helper de plugins incluídos ainda aparecem nessa lista gerada.
Trate-os como superfícies de detalhe de implementação/compatibilidade, a menos que uma página da documentação
promova explicitamente algum deles como público.

### Entrada de plugin

| Subpath                     | Principais exportações                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subpaths de canal">
    | Subpath | Principais exportações |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportação do schema Zod raiz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartilhados do assistente de setup, prompts de allowlist, construtores de status de setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de config/action-gate de múltiplas contas, helpers de fallback de conta padrão |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalização de account-id |
    | `plugin-sdk/account-resolution` | Lookup de conta + helpers de fallback para padrão |
    | `plugin-sdk/account-helpers` | Helpers estreitos de lista de contas/ação de conta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos do schema de config de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização/validação de comandos personalizados do Telegram com fallback para contrato incluído |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers compartilhados de rota de entrada + construtor de envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartilhados de registrar e despachar entrada |
    | `plugin-sdk/messaging-targets` | Helpers de parsing/correspondência de alvos |
    | `plugin-sdk/outbound-media` | Helpers compartilhados de carregamento de mídia de saída |
    | `plugin-sdk/outbound-runtime` | Helpers de identidade de saída/delegação de envio |
    | `plugin-sdk/thread-bindings-runtime` | Lifecycle de bindings de thread e helpers de adapter |
    | `plugin-sdk/agent-media-payload` | Construtor legado de payload de mídia de agente |
    | `plugin-sdk/conversation-runtime` | Helpers de binding de conversa/thread, pairing e binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de config de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolução de política de grupo em runtime |
    | `plugin-sdk/channel-status` | Helpers compartilhados de snapshot/resumo de status de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivos estreitos de schema de config de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorização de gravação de config de canal |
    | `plugin-sdk/channel-plugin-common` | Exportações de prelúdio compartilhadas de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de leitura/edição de config de allowlist |
    | `plugin-sdk/group-access` | Helpers compartilhados de decisão de acesso de grupo |
    | `plugin-sdk/direct-dm` | Helpers compartilhados de auth/guard de DM direto |
    | `plugin-sdk/interactive-runtime` | Helpers de normalização/redução de payload de resposta interativa |
    | `plugin-sdk/channel-inbound` | Helpers de debounce, correspondência de mention e envelope |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de resposta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers de parsing/correspondência de alvos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Integração de feedback/reação |
  </Accordion>

  <Accordion title="Subpaths de provedor">
    | Subpath | Principais exportações |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers de setup selecionados para provedores locais/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de setup para provedor self-hosted compatível com OpenAI |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolução de chave de API em runtime para plugins de provedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/gravação de perfil de chave de API |
    | `plugin-sdk/provider-auth-result` | Construtor padrão de resultado de auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartilhados de login interativo para plugins de provedor |
    | `plugin-sdk/provider-env-vars` | Helpers de lookup de variáveis de ambiente de auth do provedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, helpers de endpoint de provedor e helpers de normalização de id de model como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capability HTTP/endpoint do provedor |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/cache de provedor de web fetch |
    | `plugin-sdk/provider-web-search` | Helpers de registro/cache/config de provedor de web search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de schema do Gemini + diagnósticos, e helpers de compat do xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpers de patch de config de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/cache locais ao processo |
  </Accordion>

  <Accordion title="Subpaths de auth e segurança">
    | Subpath | Principais exportações |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comando, helpers de autorização de remetente |
    | `plugin-sdk/approval-auth-runtime` | Resolução de aprovador e helpers de auth de ação no mesmo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers nativos de perfil/filtro de aprovação de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adapters nativos de capability/entrega de aprovação |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de alvo de aprovação + binding de conta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de resposta de aprovação de exec/plugin |
    | `plugin-sdk/command-auth-native` | Auth nativa de comando + helpers nativos de alvo de sessão |
    | `plugin-sdk/command-detection` | Helpers compartilhados de detecção de comando |
    | `plugin-sdk/command-surface` | Normalização do corpo do comando e helpers de superfície de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Helpers compartilhados de trust, gating de DM, conteúdo externo e coleta de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de allowlist de host e política SSRF de rede privada |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher fixado, fetch protegido por SSRF e política SSRF |
    | `plugin-sdk/secret-input` | Helpers de parsing de entrada de secret |
    | `plugin-sdk/webhook-ingress` | Helpers de requisição/alvo de webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamanho do corpo/timeout de requisição |
  </Accordion>

  <Accordion title="Subpaths de runtime e armazenamento">
    | Subpath | Principais exportações |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplos de runtime/logging/backup/instalação de plugin |
    | `plugin-sdk/runtime-env` | Helpers estreitos de env de runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartilhados de comando/hook/http/interativo de plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartilhados do pipeline de hooks internos/webhook |
    | `plugin-sdk/lazy-runtime` | Helpers de importação/binding lazy de runtime, como `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de execução de processo |
    | `plugin-sdk/cli-runtime` | Helpers de formatação, espera e versão da CLI |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente do Gateway e patch de status de canal |
    | `plugin-sdk/config-runtime` | Helpers de carregamento/gravação de config |
    | `plugin-sdk/telegram-command-config` | Helpers de normalização de nome/descrição de comando do Telegram e verificações de duplicidade/conflito, mesmo quando a superfície de contrato do Telegram incluído não está disponível |
    | `plugin-sdk/approval-runtime` | Helpers de aprovação de exec/plugin, construtores de capability de aprovação, helpers de auth/perfil, helpers nativos de roteamento/runtime |
    | `plugin-sdk/reply-runtime` | Helpers compartilhados de runtime de entrada/resposta, chunking, dispatch, heartbeat, planejador de resposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de dispatch/finalização de resposta |
    | `plugin-sdk/reply-history` | Helpers compartilhados de histórico de resposta em janela curta, como `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers estreitos de chunking de texto/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de caminho de armazenamento de sessão + updated-at |
    | `plugin-sdk/state-paths` | Helpers de caminho para diretório de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de binding de rota/chave de sessão/conta, como `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartilhados de resumo de status de canal/conta, padrões de estado de runtime e helpers de metadados de issue |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartilhados de resolução de alvo |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de slug/string |
    | `plugin-sdk/request-url` | Extrair URLs string de entradas do tipo fetch/request |
    | `plugin-sdk/run-command` | Executor de comando com tempo medido e resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Leitores comuns de parâmetros de tool/CLI |
    | `plugin-sdk/tool-send` | Extrair campos canônicos de alvo de envio de argumentos de tool |
    | `plugin-sdk/temp-path` | Helpers compartilhados de caminho temporário de download |
    | `plugin-sdk/logging-core` | Logger de subsistema e helpers de redação |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tabela Markdown |
    | `plugin-sdk/json-store` | Helpers pequenos de leitura/gravação de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de file-lock reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de dedupe persistido em disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sessão/disparo de resposta de ACP |
    | `plugin-sdk/agent-config-primitives` | Primitivos estreitos de schema de config de runtime de agente |
    | `plugin-sdk/boolean-param` | Leitor flexível de parâmetro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolução de correspondência de nomes perigosos |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de device e token de pairing |
    | `plugin-sdk/extension-shared` | Primitivos compartilhados para canal passivo e helpers de status |
    | `plugin-sdk/models-provider-runtime` | Helpers de resposta de comando `/models`/provedor |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listagem de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers nativos de registro/build/serialização de comando |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detecção de endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers de evento do sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Helpers pequenos de cache limitado |
    | `plugin-sdk/diagnostic-runtime` | Helpers de flag e evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de erro, formatação, helpers compartilhados de classificação de erro, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulado, proxy e lookup fixado |
    | `plugin-sdk/host-runtime` | Helpers de normalização de hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de config de retry e executor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de diretório/identidade/workspace de agente |
    | `plugin-sdk/directory-runtime` | Consulta/dedupe de diretório com base em config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpaths de capability e teste">
    | Subpath | Principais exportações |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartilhados de fetch/transformação/armazenamento de mídia, além de construtores de payload de mídia |
    | `plugin-sdk/media-understanding` | Tipos de provedor de compreensão de mídia, além de exportações de helpers de imagem/áudio voltadas ao provedor |
    | `plugin-sdk/text-runtime` | Helpers compartilhados de texto/markdown/logging, como remoção de texto visível ao assistente, helpers de render/chunking/tabela em markdown, helpers de redação, helpers de tag de diretiva e utilitários de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de chunking de texto de saída |
    | `plugin-sdk/speech` | Tipos de provedor de fala, além de helpers de diretiva, registro e validação voltados ao provedor |
    | `plugin-sdk/speech-core` | Tipos compartilhados de provedor de fala, registro, diretiva e helpers de normalização |
    | `plugin-sdk/realtime-transcription` | Tipos de provedor de transcrição em tempo real e helpers de registro |
    | `plugin-sdk/realtime-voice` | Tipos de provedor de voz em tempo real e helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de provedor de geração de imagens |
    | `plugin-sdk/image-generation-core` | Tipos compartilhados de geração de imagem, failover, auth e helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de provedor/request/result de geração de música |
    | `plugin-sdk/music-generation-core` | Tipos compartilhados de geração de música, helpers de failover, lookup de provedor e parsing de model-ref |
    | `plugin-sdk/video-generation` | Tipos de provedor/request/result de geração de vídeo |
    | `plugin-sdk/video-generation-core` | Tipos compartilhados de geração de vídeo, helpers de failover, lookup de provedor e parsing de model-ref |
    | `plugin-sdk/webhook-targets` | Helpers de registro de alvo de webhook e instalação de rota |
    | `plugin-sdk/webhook-path` | Helpers de normalização de caminho de webhook |
    | `plugin-sdk/web-media` | Helpers compartilhados de carregamento de mídia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores do plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpaths de memória">
    | Subpath | Principais exportações |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superfície de helper incluída de memory-core para helpers de manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/busca de memória |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportações do mecanismo de fundação de host de memória |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exportações do mecanismo de embeddings de host de memória |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportações do mecanismo QMD de host de memória |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportações do mecanismo de armazenamento de host de memória |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais de host de memória |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta de host de memória |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secret de host de memória |
    | `plugin-sdk/memory-core-host-status` | Helpers de status de host de memória |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime de CLI de host de memória |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime core de host de memória |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime de host de memória |
    | `plugin-sdk/memory-lancedb` | Superfície de helper incluída de memory-lancedb |
  </Accordion>

  <Accordion title="Subpaths reservados de helpers incluídos">
    | Família | Subpaths atuais | Uso pretendido |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de suporte do plugin de browser incluído (`browser-support` permanece sendo o barrel de compatibilidade) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superfície de helper/runtime do Matrix incluído |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superfície de helper/runtime do LINE incluído |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superfície de helper do IRC incluído |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Separações de compatibilidade/helper de canal incluído |
    | Helpers específicos de auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Separações de helper de feature/plugin incluído; `plugin-sdk/github-copilot-token` atualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capability

| Método                                           | O que registra                   |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)        |
| `api.registerChannel(...)`                       | Canal de mensagens               |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição streaming em tempo real |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões duplex de voz em tempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo    |
| `api.registerImageGenerationProvider(...)`       | Geração de imagens               |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                 |
| `api.registerWebFetchProvider(...)`              | Provedor de web fetch / scrape   |
| `api.registerWebSearchProvider(...)`             | Web search                       |

### Tools e comandos

| Método                          | O que registra                                |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool de agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)          |

### Infraestrutura

| Método                                         | O que registra        |
| ---------------------------------------------- | --------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento        |
| `api.registerHttpRoute(params)`                | Endpoint HTTP do Gateway |
| `api.registerGatewayMethod(name, handler)`     | Método RPC do Gateway |
| `api.registerCli(registrar, opts?)`            | Subcomando da CLI     |
| `api.registerService(service)`                 | Serviço em segundo plano |
| `api.registerInteractiveHandler(registration)` | Handler interativo    |

Namespaces administrativos reservados do core (`config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`) sempre permanecem como `operator.admin`, mesmo se um plugin tentar atribuir
um escopo mais estreito a um método do gateway. Prefira prefixos específicos do plugin para
métodos de propriedade do plugin.

### Metadados de registro de CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes de comando explícitas pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de parsing usados para ajuda da CLI raiz,
  roteamento e registro lazy da CLI do plugin

Se você quer que um comando de plugin permaneça lazy-loaded no caminho normal da CLI raiz,
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

Use `commands` sozinho somente quando você não precisar de registro lazy na CLI raiz.
Esse caminho compatível e eager continua compatível, mas ele não instala
placeholders com base em descriptor para lazy loading em tempo de parsing.

### Slots exclusivos

| Método                                     | O que registra                        |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mecanismo de contexto (um ativo por vez) |
| `api.registerMemoryPromptSection(builder)` | Construtor de seção de prompt de memória |
| `api.registerMemoryFlushPlan(resolver)`    | Resolvedor de plano de flush de memória |
| `api.registerMemoryRuntime(runtime)`       | Adapter de runtime de memória         |

### Adapters de embedding de memória

| Método                                         | O que registra                                 |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter de embedding de memória para o plugin ativo |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são exclusivos de plugins de memória.
- `registerMemoryEmbeddingProvider` permite que o plugin de memória ativo registre um
  ou mais ids de adapter de embeddings (por exemplo `openai`, `gemini` ou um id personalizado
  definido pelo plugin).
- Configurações do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, são resolvidas em relação a esses ids
  registrados de adapter.

### Eventos e lifecycle

| Método                                       | O que faz                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de lifecycle tipado     |
| `api.onConversationBindingResolved(handler)` | Callback de binding de conversa |

### Semântica de decisão de hook

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade inferior são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como uma sobrescrita.
- `before_install`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade inferior são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como uma sobrescrita.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Assim que qualquer handler assumir o dispatch, handlers de prioridade inferior e o caminho padrão de dispatch do model são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade inferior são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (igual a omitir `cancel`), não como uma sobrescrita.

### Campos do objeto API

| Campo                    | Tipo                      | Descrição                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id do plugin                                                                                |
| `api.name`               | `string`                  | Nome de exibição                                                                            |
| `api.version`            | `string?`                 | Versão do plugin (opcional)                                                                 |
| `api.description`        | `string?`                 | Descrição do plugin (opcional)                                                              |
| `api.source`             | `string`                  | Caminho de origem do plugin                                                                 |
| `api.rootDir`            | `string?`                 | Diretório raiz do plugin (opcional)                                                         |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da config (snapshot ativo em memória do runtime quando disponível)           |
| `api.pluginConfig`       | `Record<string, unknown>` | Config específica do plugin em `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve antes da inicialização completa/entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve caminho relativo à raiz do plugin                                                   |

## Convenção de módulo interno

Dentro do seu plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Exportações públicas para consumidores externos
  runtime-api.ts    # Exportações internas de runtime
  index.ts          # Ponto de entrada do plugin
  setup-entry.ts    # Entrada leve somente para setup (opcional)
```

<Warning>
  Nunca importe seu próprio plugin por `openclaw/plugin-sdk/<your-plugin>`
  no código de produção. Encaminhe importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de plugins incluídos carregadas por fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos públicos de entrada semelhantes) agora preferem o
snapshot ativo de config de runtime quando o OpenClaw já está em execução. Se ainda não existir
snapshot de runtime, elas recorrem à config resolvida em disco.

Plugins de provedor também podem expor um barrel de contrato local do plugin quando um
helper for intencionalmente específico do provedor e ainda não pertencer a um subpath genérico do SDK.
Exemplo incluído atual: o provedor Anthropic mantém seus helpers de stream do Claude
na sua própria separação pública `api.ts` / `contract-api.ts`, em vez de
promover a lógica de cabeçalho beta do Anthropic e `service_tier` para um contrato genérico
`plugin-sdk/*`.

Outros exemplos incluídos atuais:

- `@openclaw/openai-provider`: `api.ts` exporta builders de provedor,
  helpers de model padrão e builders de provedor em tempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta o builder do provedor além de
  helpers de onboarding/config

<Warning>
  O código de produção da extensão também deve evitar importações
  `openclaw/plugin-sdk/<other-plugin>`. Se um helper for realmente compartilhado, promova-o para um subpath neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capability, em vez de acoplar dois plugins.
</Warning>

## Relacionados

- [Entry Points](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry` e `defineChannelPluginEntry`
- [Runtime Helpers](/pt-BR/plugins/sdk-runtime) — referência completa do namespace `api.runtime`
- [Setup and Config](/pt-BR/plugins/sdk-setup) — empacotamento, manifestos, schemas de config
- [Testing](/pt-BR/plugins/sdk-testing) — utilitários de teste e regras de lint
- [SDK Migration](/pt-BR/plugins/sdk-migration) — migração de superfícies obsoletas
- [Plugin Internals](/pt-BR/plugins/architecture) — arquitetura aprofundada e modelo de capability
