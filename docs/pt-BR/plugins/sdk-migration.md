---
read_when:
    - Você viu o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você viu o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você usou `api.registerEmbeddedExtensionFactory` antes do OpenClaw 2026.4.25
    - Você está atualizando um Plugin para a arquitetura moderna de Plugin
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar da camada legada de compatibilidade retroativa para o SDK moderno de Plugin
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

O OpenClaw migrou de uma camada ampla de compatibilidade retroativa para uma arquitetura moderna de Plugin
com imports focados e documentados. Se o seu Plugin foi criado antes
da nova arquitetura, este guia ajuda na migração.

## O que está mudando

O sistema antigo de Plugins fornecia duas superfícies muito amplas que permitiam que Plugins importassem
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  helpers. Ele foi introduzido para manter Plugins antigos baseados em hooks funcionando enquanto a
  nova arquitetura de Plugin estava sendo construída.
- **`openclaw/extension-api`** — uma bridge que dava aos Plugins acesso direto a
  helpers do lado do host, como o executor de agente embutido.
- **`api.registerEmbeddedExtensionFactory(...)`** — um hook removido de extensão interna apenas do Pi
  que podia observar eventos do executor embutido, como
  `tool_result`.

As superfícies amplas de import agora estão **descontinuadas**. Elas ainda funcionam em runtime,
mas novos Plugins não devem usá-las, e Plugins existentes devem migrar antes que a próxima release principal as remova. A API de registro da factory de extensão embutida apenas do Pi
foi removida; use middleware de resultado de ferramenta em vez disso.

O OpenClaw não remove nem reinterpreta comportamento documentado de Plugin na mesma
alteração que introduz uma substituição. Mudanças de contrato com breaking change devem primeiro
passar por um adaptador de compatibilidade, diagnósticos, docs e uma janela de descontinuação.
Isso se aplica a imports do SDK, campos do manifest, APIs de setup, hooks e comportamento
de registro de runtime.

<Warning>
  A camada de compatibilidade retroativa será removida em uma futura release principal.
  Plugins que ainda importam dessas superfícies deixarão de funcionar quando isso acontecer.
  Registros de factory de extensão embutida apenas do Pi já não são mais carregados.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexportações amplas facilitavam criar ciclos de import
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis vs internos

O SDK moderno de Plugin corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno, autocontido, com finalidade clara e contrato documentado.

Seams legados de conveniência de provider para canais internos também desapareceram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seams de helper com marca de canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de Plugin. Use subpaths genéricos e estreitos do SDK em vez disso. Dentro do
workspace de Plugin interno, mantenha helpers pertencentes ao provider no próprio
`api.ts` ou `runtime-api.ts` desse Plugin.

Exemplos atuais de providers internos:

- Anthropic mantém helpers de stream específicos do Claude em seus próprios seams `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provider, helpers de modelo padrão e builders de provider realtime
  em seu próprio `api.ts`
- OpenRouter mantém builder de provider e helpers de configuração/onboarding em seu próprio
  `api.ts`

## Política de compatibilidade

Para Plugins externos, o trabalho de compatibilidade segue esta ordem:

1. adicionar o novo contrato
2. manter o comportamento antigo conectado por um adaptador de compatibilidade
3. emitir um diagnóstico ou aviso que nomeie o caminho antigo e a substituição
4. cobrir ambos os caminhos em testes
5. documentar a descontinuação e o caminho de migração
6. remover somente após a janela de migração anunciada, geralmente em uma release principal

Se um campo do manifest ainda é aceito, autores de Plugin podem continuar usando-o até
que a documentação e os diagnósticos digam o contrário. Código novo deve preferir a substituição documentada, mas Plugins existentes não devem quebrar durante releases
menores normais.

## Como migrar

<Steps>
  <Step title="Migrar extensões Pi de resultado de ferramenta para middleware">
    Plugins internos devem substituir manipuladores
    `api.registerEmbeddedExtensionFactory(...)` de resultado de ferramenta apenas do Pi por
    middleware neutro em relação ao runtime.

    ```typescript
    // Ferramentas dinâmicas de runtime Pi e Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Atualize o manifest do Plugin ao mesmo tempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugins externos não podem registrar middleware de resultado de ferramenta porque ele pode
    reescrever saída de ferramenta de alta confiança antes que o modelo a veja.

  </Step>

  <Step title="Migrar manipuladores nativos de aprovação para fatos de capacidade">
    Plugins de canal com suporte a aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Principais mudanças:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação para fora do encadeamento legado `plugin.auth` /
      `plugin.approvals` e para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de
      Plugin de canal; mova campos delivery/native/render para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout de canal; hooks
      de autenticação de aprovação ali não são mais lidos pelo core
    - Registre objetos de runtime pertencentes ao canal, como clientes, tokens ou apps
      Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento pertencentes ao Plugin a partir de manipuladores nativos de aprovação;
      o core agora controla avisos de roteado-para-outro-lugar a partir de resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para o layout atual de capability
    de aprovação.

  </Step>

  <Step title="Auditar comportamento de fallback do wrapper no Windows">
    Se o seu Plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat`
    não resolvidos no Windows agora falham de forma segura, a menos que você passe explicitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isto apenas para chamadores de compatibilidade confiáveis que
      // aceitam intencionalmente fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depender intencionalmente de fallback por shell, não defina
    `allowShellFallback` e trate o erro lançado em vez disso.

  </Step>

  <Step title="Encontrar imports descontinuados">
    Procure no seu Plugin imports de qualquer uma das superfícies descontinuadas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga é mapeado para um caminho moderno de import específico:

    ```typescript
    // Antes (camada de compatibilidade retroativa descontinuada)
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

    Para helpers do lado do host, use o runtime de Plugin injetado em vez de importar
    diretamente:

    ```typescript
    // Antes (bridge extension-api descontinuada)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers legados de bridge:

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
  | `plugin-sdk/plugin-entry` | Helper canônico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação abrangente legada para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export do schema raiz de configuração | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada para provider único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de setup | Prompts de lista de permissão, builders de status de setup |
  | `plugin-sdk/setup-runtime` | Helpers de runtime em tempo de setup | Adaptadores de patch de setup seguros para import, helpers de lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies delegados de setup |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de tooling de setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers para múltiplas contas | Helpers de lista/configuração/controle de ação de conta |
  | `plugin-sdk/account-id` | Helpers de account-id | `DEFAULT_ACCOUNT_ID`, normalização de account-id |
  | `plugin-sdk/account-resolution` | Helpers de lookup de conta | Helpers de lookup de conta + fallback para padrão |
  | `plugin-sdk/account-helpers` | Helpers estreitos de conta | Helpers de lista de conta/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento por DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Encadeamento de prefixo de resposta + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factories de adaptadores de configuração | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de configuração | Primitivas compartilhadas de schema de configuração de canal; exports de schema nomeados de canais internos são apenas compatibilidade legada |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comando do Telegram | Normalização de nome de comando, trim de descrição, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de status de conta e ciclo de vida de stream de rascunho | `createAccountStatusSink`, helpers de finalização de preview de rascunho |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de registro-e-dispatch |
  | `plugin-sdk/messaging-targets` | Parsing de alvos de mensagens | Helpers de parsing/correspondência de alvo |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers de entrega de saída, delegado de identidade/envio, sessão, formatação e planejamento de payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de vínculo de thread | Helpers de ciclo de vida e adaptador de vínculo de thread |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia do agente para layouts legados de campo |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade descontinuado | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/logging/backup/instalação de Plugin |
  | `plugin-sdk/runtime-env` | Helpers estreitos de env de runtime | Logger/env de runtime, timeout, retry e helpers de backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de Plugin | Helpers de comandos/hooks/http/interativos de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers compartilhados de pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime de CLI | Formatação de comando, esperas, helpers de versão |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Cliente do Gateway e helpers de patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuração | Helpers de carregamento/gravação de configuração |
  | `plugin-sdk/telegram-command-config` | Helpers de comando do Telegram | Helpers estáveis por fallback para validação de comando do Telegram quando a superfície de contrato do Telegram interno não está disponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Payload de aprovação exec/plugin, helpers de capability/perfil de aprovação, helpers nativos de roteamento/runtime de aprovação e formatação estruturada de caminho de exibição de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprovação | Helpers de perfil/filtro nativo de aprovação exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adaptadores de capability/entrega de aprovação nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway para aprovação | Helper compartilhado de resolução de Gateway para aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprovação | Helpers leves de carregamento de adaptador de aprovação nativa para entrypoints quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de manipulador de aprovação | Helpers mais amplos de runtime de manipulador de aprovação; prefira seams mais estreitos de adaptador/Gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de alvo de aprovação | Helpers nativos de binding de alvo/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de registro/get/watch de contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, gating de DM, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de lista de permissão de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime SSRF | Helpers de pinned-dispatcher, guarded fetch e política SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de gating de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulados | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de lista de permissão | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de lista de permissão | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helpers de gating de comando e superfície de comando | `resolveControlCommandGate`, helpers de autorização de remetente, helpers de registro de comando incluindo formatação dinâmica de menu de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de status/help de comando | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing de entrada de segredo | Helpers de entrada de segredo |
  | `plugin-sdk/webhook-ingress` | Helpers de requisição de Webhook | Utilitários de alvo de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de guarda de corpo de requisição de Webhook | Helpers de leitura/limite do corpo da requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Dispatch de entrada, Heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers estreitos de dispatch de resposta | Helpers de finalização, dispatch de provider e rótulo de conversa |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de chunk de resposta | Helpers de chunking de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão | Helpers de caminho do armazenamento + updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminhos de estado | Helpers de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, helpers de metadados de issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de alvo | Helpers compartilhados de resolvedor de alvo |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de requisição | Extrair URLs string de entradas semelhantes a requisição |
  | `plugin-sdk/run-command` | Helpers de comando com tempo controlado | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetro | Leitores comuns de parâmetro de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extrair payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrair campos canônicos de alvo de envio de args de ferramenta |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário de download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela Markdown | Helpers de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Helpers curados de setup de provider local/autohospedado | Helpers de descoberta/configuração de provider autohospedado |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de setup de provider autohospedado compatível com OpenAI | Os mesmos helpers de descoberta/configuração de provider autohospedado |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticação de runtime de provider | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de setup de chave de API de provider | Helpers de onboarding/gravação de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticação de provider | Builder padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo de provider | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-selection-runtime` | Helpers de seleção de provider | Seleção de provider configurado-ou-automático e mesclagem de configuração bruta de provider |
  | `plugin-sdk/provider-env-vars` | Helpers de variáveis de ambiente de provider | Helpers de lookup de variáveis de ambiente de autenticação de provider |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provider e helpers de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provider | Helpers de configuração de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provider | Helpers genéricos de HTTP/capacidade de endpoint de provider, incluindo helpers de formulário multipart para transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de provider | Helpers de registro/cache de provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuração de pesquisa web de provider | Helpers estreitos de configuração/credencial de pesquisa web para providers que não precisam de encadeamento de habilitação de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de pesquisa web de provider | Helpers estreitos de contrato de configuração/credencial de pesquisa web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Helpers de pesquisa web de provider | Helpers de registro/cache/runtime de provider de pesquisa web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidade de ferramenta/schema de provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza + diagnósticos de schema Gemini e helpers de compatibilidade xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provider |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream de provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de provider | Helpers nativos de transporte de provider, como guarded fetch, transforms de mensagem de transporte e streams de eventos de transporte graváveis |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de fetch/transform/store de mídia mais builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de geração de mídia | Helpers compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Helpers de entendimento de mídia | Tipos de provider de entendimento de mídia mais exports de helpers de imagem/áudio voltados para provider |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível ao assistente, helpers de render/chunking/tabela de markdown, helpers de redação, helpers de tag de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de chunking de texto | Helper de chunking de texto de saída |
  | `plugin-sdk/speech` | Helpers de fala | Tipos de provider de fala mais helpers voltados para provider de diretiva, registro e validação |
  | `plugin-sdk/speech-core` | Core compartilhado de fala | Tipos de provider de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição em tempo real | Tipos de provider, helpers de registro e helper compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz em tempo real | Tipos de provider, helpers de registro/resolução e helpers de sessão de bridge |
  | `plugin-sdk/image-generation-core` | Core compartilhado de geração de imagem | Tipos de geração de imagem, failover, autenticação e helpers de registro |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provider/requisição/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Core compartilhado de geração de música | Tipos de geração de música, helpers de failover, lookup de provider e parsing de model-ref |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provider/requisição/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Core compartilhado de geração de vídeo | Tipos de geração de vídeo, helpers de failover, lookup de provider e parsing de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas estreitas de config-schema de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de gravação de configuração de canal | Helpers de autorização para gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuração de lista de permissão | Helpers de edição/leitura de configuração de lista de permissão |
  | `plugin-sdk/group-access` | Helpers de acesso em grupo | Helpers compartilhados de decisão de acesso em grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direta | Helpers compartilhados de autenticação/guarda de DM direta |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivas de helpers passivos de canal/status e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Helpers de alvo de Webhook | Registro de alvos de Webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de Webhook | Helpers de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação de Zod | `zod` reexportado para consumidores do SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers internos de memory-core | Superfície de helpers de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do engine de memória | Fachada de runtime de index/search de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine foundation do host de memória | Exports do engine foundation do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine de embeddings do host de memória | Contratos de embedding de memória, acesso ao registro, provider local e helpers genéricos de batch/remoto; providers remotos concretos vivem em seus Plugins proprietários |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD do host de memória | Exports do engine QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine de storage do host de memória | Exports do engine de storage do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais do host de memória | Helpers multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta do host de memória | Helpers de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Helpers de segredo do host de memória | Helpers de segredo do host de memória |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal de eventos do host de memória | Helpers de journal de eventos do host de memória |
  | `plugin-sdk/memory-core-host-status` | Helpers de status do host de memória | Helpers de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI do host de memória | Helpers de runtime CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core do host de memória | Helpers de runtime core do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime do host de memória | Helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime core do host de memória | Alias neutro em relação ao fornecedor para helpers de runtime core do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de journal de eventos do host de memória | Alias neutro em relação ao fornecedor para helpers de journal de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação ao fornecedor para helpers de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gerenciado | Helpers compartilhados de markdown gerenciado para Plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de Active Memory | Fachada lazy de runtime do gerenciador de busca de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação ao fornecedor para helpers de status do host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers internos de memory-lancedb | Superfície de helpers de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers de teste e mocks |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície completa do SDK.
A lista completa de mais de 200 entrypoints está em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui alguns seams de helper de Plugins internos, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Eles continuam exportados para
manutenção e compatibilidade de Plugins internos, mas foram intencionalmente
omitidos da tabela comum de migração e não são o alvo recomendado para
novo código de Plugin.

A mesma regra se aplica a outras famílias de helpers internos, como:

- helpers de suporte a browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies internas de helper/Plugin como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` atualmente expõe a superfície estreita de helper de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais estreito que corresponda ao trabalho. Se você não encontrar um export,
verifique o código-fonte em `src/plugin-sdk/` ou pergunte no Discord.

## Descontinuações ativas

Descontinuações mais estreitas que se aplicam ao SDK de Plugin, contrato de provider,
superfície de runtime e manifest. Cada uma ainda funciona hoje, mas será removida
em uma futura release principal. A entrada abaixo de cada item mapeia a API antiga para sua
substituição canônica.

<AccordionGroup>
  <Accordion title="builders de help de command-auth → command-status">
    **Antigo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Novo (`openclaw/plugin-sdk/command-status`)**: mesmas assinaturas, mesmos
    exports — apenas importados do subpath mais estreito. `command-auth`
    os reexporta como stubs de compatibilidade.

    ```typescript
    // Antes
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Depois
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helpers de gating de menção → resolveInboundMentionDecision">
    **Antigo**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` de
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Novo**: `resolveInboundMentionDecision({ facts, policy })` — retorna um
    único objeto de decisão em vez de duas chamadas separadas.

    Plugins downstream de canal (Slack, Discord, Matrix, MS Teams) já
    migraram.

  </Accordion>

  <Accordion title="Shim de runtime de canal e helpers de ações de canal">
    `openclaw/plugin-sdk/channel-runtime` é um shim de compatibilidade para Plugins de
    canal antigos. Não o importe em código novo; use
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Helpers `channelActions*` em `openclaw/plugin-sdk/channel-actions` estão
    descontinuados junto com exports brutos de canal de "actions". Exponha
    capabilities pela superfície semântica `presentation` em vez disso — Plugins
    de canal declaram o que renderizam (cards, botões, selects), não quais nomes brutos
    de ação aceitam.

  </Accordion>

  <Accordion title="Helper tool() de provider de pesquisa web → createTool() no Plugin">
    **Antigo**: factory `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Novo**: implemente `createTool(...)` diretamente no Plugin do provider.
    O OpenClaw não precisa mais do helper do SDK para registrar o wrapper da ferramenta.

  </Accordion>

  <Accordion title="Envelopes de canal em texto simples → BodyForAgent">
    **Antigo**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) para construir um envelope de prompt
    achatado em texto simples a partir de mensagens de canal recebidas.

    **Novo**: `BodyForAgent` mais blocos estruturados de contexto do usuário. Plugins
    de canal anexam metadados de roteamento (thread, tópico, reply-to, reações) como
    campos tipados em vez de concatená-los em uma string de prompt. O helper
    `formatAgentEnvelope(...)` ainda é compatível para envelopes sintetizados
    voltados ao assistente, mas envelopes de entrada em texto simples estão em descontinuação.

    Áreas afetadas: `inbound_claim`, `message_received` e qualquer
    Plugin de canal personalizado que pós-processava texto `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipos de descoberta de provider → tipos de catálogo de provider">
    Quatro aliases de tipo de descoberta agora são wrappers finos sobre os
    tipos da era de catálogo:

    | Alias antigo              | Tipo novo               |
    | ------------------------- | ----------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`  |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Além da bag estática legada `ProviderCapabilities` — Plugins de provider
    devem anexar fatos de capability por meio do contrato de runtime do provider,
    não por um objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de thinking → resolveThinkingProfile">
    **Antigo** (três hooks separados em `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Novo**: um único `resolveThinkingProfile(ctx)` que retorna um
    `ProviderThinkingProfile` com o `id` canônico, `label` opcional e
    lista ranqueada de níveis. O OpenClaw faz downgrade automático de valores armazenados obsoletos por ranking do perfil.

    Implemente um hook em vez de três. Os hooks legados continuam funcionando durante
    a janela de descontinuação, mas não são compostos com o resultado do perfil.

  </Accordion>

  <Accordion title="Fallback de provider OAuth externo → contracts.externalAuthProviders">
    **Antigo**: implementar `resolveExternalOAuthProfiles(...)` sem
    declarar o provider no manifest do Plugin.

    **Novo**: declare `contracts.externalAuthProviders` no manifest do Plugin
    **e** implemente `resolveExternalAuthProfiles(...)`. O caminho antigo de
    "fallback de auth" emite um aviso em runtime e será removido.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup de env-var de provider → setup.providers[].envVars">
    **Campo antigo** do manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Novo**: espelhe o mesmo lookup de env-var em `setup.providers[].envVars`
    no manifest. Isso consolida metadados de env de setup/status em um
    único lugar e evita iniciar o runtime do Plugin apenas para responder a
    lookups de env-var.

    `providerAuthEnvVars` continua compatível por meio de um adaptador de compatibilidade
    até que a janela de descontinuação se encerre.

  </Accordion>

  <Accordion title="Registro de Plugin de memória → registerMemoryCapability">
    **Antigo**: três chamadas separadas —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Novo**: uma chamada na API de estado de memória —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mesmos slots, uma única chamada de registro. Helpers aditivos de memória
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) não são afetados.

  </Accordion>

  <Accordion title="Tipos de mensagens de sessão de subagente renomeados">
    Dois aliases de tipo legados ainda exportados de `src/plugins/runtime/types.ts`:

    | Antigo                        | Novo                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    O método de runtime `readSession` está descontinuado em favor de
    `getSessionMessages`. Mesma assinatura; o método antigo delega para o
    novo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Antigo**: `runtime.tasks.flow` (singular) retornava um acessor ativo de TaskFlow.

    **Novo**: `runtime.tasks.flows` (plural) retorna acesso TaskFlow baseado em DTO,
    que é seguro para import e não exige que o runtime completo de tarefa seja
    carregado.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow(ctx);
    // Depois
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Factories de extensão embutida → middleware de resultado de ferramenta do agente">
    Coberto em "Como migrar → Migrar extensões Pi de resultado de ferramenta para
    middleware" acima. Incluído aqui por completude: o caminho removido
    `api.registerEmbeddedExtensionFactory(...)` apenas do Pi é substituído por
    `api.registerAgentToolResultMiddleware(...)` com uma lista explícita de
    runtime em `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` reexportado de `openclaw/plugin-sdk` agora é um
    alias de uma linha para `OpenClawConfig`. Prefira o nome canônico.

    ```typescript
    // Antes
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Depois
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Descontinuações em nível de extension (dentro de Plugins internos de canal/provider em
`extensions/`) são rastreadas dentro de seus próprios barrels `api.ts` e `runtime-api.ts`.
Elas não afetam contratos de Plugins de terceiros e não estão listadas
aqui. Se você consome diretamente o barrel local de um Plugin interno, leia os
comentários de descontinuação nesse barrel antes de atualizar.
</Note>

## Cronograma de remoção

| Quando                 | O que acontece                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Agora**              | Superfícies descontinuadas emitem avisos em runtime                     |
| **Próxima release principal** | Superfícies descontinuadas serão removidas; Plugins que ainda as usam falharão |

Todos os Plugins do core já foram migrados. Plugins externos devem migrar
antes da próxima release principal.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma escape hatch temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro Plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subpath
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando Plugins de canal
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — criando Plugins de provider
- [Internals de Plugin](/pt-BR/plugins/architecture) — análise detalhada da arquitetura
- [Manifest de Plugin](/pt-BR/plugins/manifest) — referência do schema de manifest
