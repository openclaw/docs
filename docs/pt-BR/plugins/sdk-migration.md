---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você está atualizando um plugin para a arquitetura moderna de plugins
    - Você mantém um plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar da camada legada de retrocompatibilidade para o Plugin SDK moderno
title: Migração do Plugin SDK
x-i18n:
    generated_at: "2026-04-06T03:10:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b71ce69b30c3bb02da1b263b1d11dc3214deae5f6fc708515e23b5a1c7bb7c8f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migração do Plugin SDK

O OpenClaw migrou de uma ampla camada de retrocompatibilidade para uma arquitetura moderna
de plugins com imports focados e documentados. Se o seu plugin foi criado antes
da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de plugins fornecia duas superfícies amplas e abertas que permitiam que plugins importassem
tudo o que precisavam a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  helpers. Ele foi introduzido para manter plugins mais antigos baseados em hooks funcionando enquanto a
  nova arquitetura de plugins estava sendo construída.
- **`openclaw/extension-api`** — uma ponte que dava aos plugins acesso direto a
  helpers do lado do host, como o executor incorporado do agente.

Ambas as superfícies agora estão **obsoletas**. Elas ainda funcionam em runtime, mas novos
plugins não devem usá-las, e plugins existentes devem migrar antes que a próxima
versão principal as remova.

<Warning>
  A camada de retrocompatibilidade será removida em uma futura versão principal.
  Plugins que ainda importam dessas superfícies quebrarão quando isso acontecer.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexports amplos facilitavam a criação de ciclos de import
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis e quais eram internos

O Plugin SDK moderno corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno e autocontido com uma finalidade clara e um contrato documentado.

As superfícies legadas de conveniência para provider em canais empacotados também foram removidas. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
superfícies helper com marca do canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de plugin. Use subpaths genéricos e estreitos do SDK. Dentro do
workspace de plugins empacotados, mantenha helpers pertencentes ao provider no
próprio `api.ts` ou `runtime-api.ts` desse plugin.

Exemplos atuais de providers empacotados:

- Anthropic mantém helpers de stream específicos do Claude em sua própria superfície `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provider, helpers de modelo padrão e builders de provider
  em tempo real em seu próprio `api.ts`
- OpenRouter mantém builder de provider e helpers de onboarding/configuração em seu próprio
  `api.ts`

## Como migrar

<Steps>
  <Step title="Auditar o comportamento de fallback do wrapper do Windows">
    Se o seu plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers do Windows
    `.cmd`/`.bat` não resolvidos agora falham em modo fechado, a menos que você passe
    explicitamente `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isto apenas para chamadores de compatibilidade confiáveis que
      // intencionalmente aceitam fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depende intencionalmente de fallback por shell, não defina
    `allowShellFallback` e trate o erro lançado.

  </Step>

  <Step title="Encontrar imports obsoletos">
    Procure no seu plugin por imports de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga corresponde a um caminho de import moderno específico:

    ```typescript
    // Antes (camada obsoleta de retrocompatibilidade)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Depois (imports modernos e focados)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para helpers do lado do host, use o runtime de plugin injetado em vez de importar
    diretamente:

    ```typescript
    // Antes (ponte obsoleta extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers legados da ponte:

    | Import antigo | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers de armazenamento de sessão | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compilar e testar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de import

<Accordion title="Tabela comum de caminhos de import">
  | Caminho de import | Finalidade | Principais exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canônico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexport umbrella legado para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export do schema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada para provider único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração | Prompts de allowlist, builders de status de configuração |
  | `plugin-sdk/setup-runtime` | Helpers de runtime no momento da configuração | Adaptadores de patch de configuração seguros para import, helpers de notas de lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies delegados de configuração |
  | `plugin-sdk/setup-adapter-runtime` | Helpers do adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de ferramentas de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers para múltiplas contas | Helpers de lista/configuração de contas/controle de ação |
  | `plugin-sdk/account-id` | Helpers de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Helpers de lookup de conta | Helpers de lookup de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Helpers estreitos de conta | Helpers de lista de contas/ações de conta |
  | `plugin-sdk/channel-setup` | Adaptadores de assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, mais `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento por DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Prefixo de resposta + integração de digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptador de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de configuração | Tipos de schema de configuração de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comando do Telegram | Normalização de nome de comando, corte de descrição, validação de duplicidade/conflito |
  | `plugin-sdk/channel-policy` | Resolução de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Rastreamento de status de conta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de registro e despacho |
  | `plugin-sdk/messaging-targets` | Parsing de destino de mensagem | Helpers de parsing/correspondência de destino |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers de identidade de saída/delegação de envio |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vínculo de thread | Ciclo de vida de vínculo de thread e helpers de adaptador |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia do agente para layouts de campos legados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente do plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/logging/backup/instalação de plugin |
  | `plugin-sdk/runtime-env` | Helpers estreitos de ambiente de runtime | Logger/ambiente de runtime, helpers de timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de plugin | Helpers de comandos/hooks/http/interativos de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers compartilhados de pipeline de webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime de CLI | Formatação de comandos, esperas, helpers de versão |
  | `plugin-sdk/gateway-runtime` | Helpers de gateway | Cliente de gateway e helpers de patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuração | Helpers de carga/gravação de configuração |
  | `plugin-sdk/telegram-command-config` | Helpers de comando do Telegram | Helpers de validação de comando do Telegram estáveis por fallback quando a superfície contratual empacotada do Telegram não está disponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Payload de aprovação exec/plugin, helpers de capacidade/perfil de aprovação, helpers nativos de roteamento/runtime de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprovação | Helpers nativos de perfil/filtro de aprovação de execução |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adaptadores nativos de capacidade/entrega de aprovação |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação | Helpers nativos de destino/vínculo de conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação exec/plugin |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, bloqueio de DM, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime SSRF | Dispatcher fixado, fetch protegido, helpers de política SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de controle de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulados | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Controle de comando e helpers de superfície de comando | `resolveControlCommandGate`, helpers de autorização de remetente, helpers de registro de comando |
  | `plugin-sdk/secret-input` | Parsing de entrada secreta | Helpers de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Helpers de requisição de webhook | Utilitários de destino de webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de proteção do corpo de webhook | Helpers de leitura/limite do corpo da requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, heartbeat, planejador de resposta, fragmentação |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de despacho de resposta | Helpers de finalização + despacho de provider |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de fragmentação de resposta | Helpers de fragmentação de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão | Helpers de caminho do armazenamento + updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminho de estado | Helpers de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, helpers de metadados de issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destino | Helpers compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de requisição | Extrai URLs string de entradas do tipo request |
  | `plugin-sdk/run-command` | Helpers de comando com tempo medido | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrai campos canônicos de destino de envio de args de ferramenta |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário para download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela Markdown | Helpers de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de payload de resposta | Tipos de payload de resposta de mensagem |
  | `plugin-sdk/provider-setup` | Helpers curados de configuração de provider local/hospedado pelo usuário | Helpers de descoberta/configuração de provider hospedado pelo usuário |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provider hospedado pelo usuário compatível com OpenAI | Os mesmos helpers de descoberta/configuração de provider hospedado pelo usuário |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticação de runtime de provider | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuração de chave de API de provider | Helpers de onboarding/gravação de perfil para chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticação de provider | Builder padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo de provider | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-env-vars` | Helpers de variáveis de ambiente de provider | Helpers de lookup de variáveis de ambiente de autenticação de provider |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provider e helpers de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provider | Helpers de configuração de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provider | Helpers genéricos de HTTP/capacidade de endpoint de provider |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de provider | Helpers de registro/cache de provider de web-fetch |
  | `plugin-sdk/provider-web-search` | Helpers de web-search de provider | Helpers de registro/cache/configuração de provider de web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidade de ferramenta/schema de provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de schema Gemini + diagnósticos e helpers de compatibilidade do xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provider |
  | `plugin-sdk/provider-stream` | Helpers de encapsulamento de stream de provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de encapsulamento de stream e helpers compartilhados de encapsulamento Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de busca/transformação/armazenamento de mídia, além de builders de payload de mídia |
  | `plugin-sdk/media-understanding` | Helpers de entendimento de mídia | Tipos de provider de entendimento de mídia, além de exports helper de imagem/áudio voltados a provider |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível ao assistente, helpers de renderização/fragmentação/tabela Markdown, helpers de redação, helpers de tag de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de fragmentação de texto | Helper de fragmentação de texto de saída |
  | `plugin-sdk/speech` | Helpers de fala | Tipos de provider de fala, além de helpers de diretiva, registro e validação voltados a provider |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provider de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição em tempo real | Tipos de provider e helpers de registro |
  | `plugin-sdk/realtime-voice` | Helpers de voz em tempo real | Tipos de provider e helpers de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagem | Helpers de tipos, failover, autenticação e registro de geração de imagem |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provider/requisição/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Helpers de tipos de geração de música, failover, lookup de provider e parsing de model-ref |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provider/requisição/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Helpers de tipos de geração de vídeo, failover, lookup de provider e parsing de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas estreitas de schema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de gravação de configuração de canal | Helpers de autorização de gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuração de allowlist | Helpers de leitura/edição de configuração de allowlist |
  | `plugin-sdk/group-access` | Helpers de acesso em grupo | Helpers compartilhados de decisão de acesso em grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direta | Helpers compartilhados de autenticação/proteção de DM direta |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivas helper passivas de canal/status |
  | `plugin-sdk/webhook-targets` | Helpers de destino de webhook | Registro de destino de webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de webhook | Helpers de normalização de caminho de webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexport de zod | `zod` reexportado para consumidores do Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers empacotados de memory-core | Superfície helper de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de indexação/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo foundation do host de memória | Exports do mecanismo foundation do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Exports do mecanismo de embeddings do host de memória |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exports do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exports do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória | Helpers multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória | Helpers de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória | Helpers de segredo do host de memória |
  | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória | Helpers de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI do host de memória | Helpers de runtime CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core do host de memória | Helpers de runtime core do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória | Helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers empacotados de memory-lancedb | Superfície helper de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers de teste e mocks |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície
completa do SDK. A lista completa de mais de 200 pontos de entrada está em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas superfícies helper de plugins empacotados, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas continuam exportadas para
manutenção e compatibilidade de plugins empacotados, mas foram intencionalmente
omitidas da tabela comum de migração e não são o destino recomendado para
novo código de plugin.

A mesma regra se aplica a outras famílias de helpers empacotados, como:

- helpers de suporte a browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies helper/plugin empacotadas como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` atualmente expõe a superfície estreita de helper
de token `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais estreito que corresponda ao trabalho. Se você não conseguir encontrar um export,
verifique o código-fonte em `src/plugin-sdk/` ou pergunte no Discord.

## Cronograma de remoção

| Quando | O que acontece |
| ---------------------- | ----------------------------------------------------------------------- |
| **Agora** | Superfícies obsoletas emitem avisos em runtime |
| **Próxima versão principal** | Superfícies obsoletas serão removidas; plugins que ainda as usam falharão |

Todos os plugins centrais já foram migrados. Plugins externos devem migrar
antes da próxima versão principal.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma rota de escape temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subpath
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando plugins de canal
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — criando plugins de provider
- [Internals de plugin](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura
- [Manifesto de plugin](/pt-BR/plugins/manifest) — referência do schema do manifesto
