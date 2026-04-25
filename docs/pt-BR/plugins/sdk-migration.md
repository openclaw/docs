---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você usou `api.registerEmbeddedExtensionFactory` antes do OpenClaw 2026.4.25
    - Você está atualizando um Plugin para a arquitetura moderna de Plugins
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migre da camada legada de compatibilidade retroativa para o SDK moderno de Plugin
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-04-25T18:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab0369fc6e43961a41cff882b0c05653a6a1e3f919ef8a3620c868c16c02ce
    source_path: plugins/sdk-migration.md
    workflow: 15
---

O OpenClaw migrou de uma camada ampla de compatibilidade retroativa para uma arquitetura moderna de Plugins
com imports focados e documentados. Se o seu Plugin foi criado antes
da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de Plugins fornecia duas superfícies amplas que permitiam aos Plugins importar
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  helpers. Ele foi introduzido para manter Plugins antigos baseados em hooks funcionando enquanto a
  nova arquitetura de Plugins estava sendo construída.
- **`openclaw/extension-api`** — uma ponte que dava aos Plugins acesso direto a
  helpers do lado do host, como o executor de agente embutido.
- **`api.registerEmbeddedExtensionFactory(...)`** — um hook removido de extensão empacotada exclusivo do Pi
  que podia observar eventos do executor embutido, como
  `tool_result`.

As superfícies amplas de import agora estão **descontinuadas**. Elas ainda funcionam em runtime,
mas novos Plugins não devem usá-las, e Plugins existentes devem migrar antes que a
próxima release principal as remova. A API de registro da fábrica de extensão embutida exclusiva do Pi
foi removida; use middleware de resultado de ferramenta em vez disso.

O OpenClaw não remove nem reinterpreta comportamento documentado de Plugin na mesma
alteração que introduz uma substituição. Mudanças incompatíveis de contrato devem primeiro passar
por um adaptador de compatibilidade, diagnósticos, documentação e uma janela de descontinuação.
Isso se aplica a imports do SDK, campos de manifesto, APIs de configuração, hooks e comportamento de
registro em runtime.

<Warning>
  A camada de compatibilidade retroativa será removida em uma futura release principal.
  Plugins que ainda importarem dessas superfícies deixarão de funcionar quando isso acontecer.
  Registros de fábrica de extensão embutida exclusivos do Pi já não são mais carregados.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um helper carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexportações amplas facilitavam criar ciclos de import
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis vs internos

O SDK moderno de Plugin corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno, autocontido, com um propósito claro e contrato documentado.

Seams legados de conveniência de provider para canais empacotados também foram removidos. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seams de helper com marca de canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de Plugin. Use subpaths genéricos e específicos do SDK em vez disso. Dentro do
workspace do Plugin empacotado, mantenha helpers pertencentes ao provider no próprio
`api.ts` ou `runtime-api.ts` desse Plugin.

Exemplos atuais de providers empacotados:

- Anthropic mantém helpers de stream específicos do Claude em seu próprio seam `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provider, helpers de modelo padrão e builders
  de provider em tempo real em seu próprio `api.ts`
- OpenRouter mantém helper de builder de provider e helpers de onboarding/config em seu próprio
  `api.ts`

## Política de compatibilidade

Para Plugins externos, o trabalho de compatibilidade segue esta ordem:

1. adicionar o novo contrato
2. manter o comportamento antigo conectado por meio de um adaptador de compatibilidade
3. emitir um diagnóstico ou aviso que nomeie o caminho antigo e a substituição
4. cobrir ambos os caminhos em testes
5. documentar a descontinuação e o caminho de migração
6. remover apenas após a janela de migração anunciada, normalmente em uma release principal

Se um campo de manifesto ainda é aceito, autores de Plugins podem continuar usando-o até
que a documentação e os diagnósticos digam o contrário. Código novo deve preferir a
substituição documentada, mas Plugins existentes não devem quebrar durante releases
menores normais.

## Como migrar

<Steps>
  <Step title="Migre extensões de resultado de ferramenta do Pi para middleware">
    Plugins empacotados devem substituir handlers exclusivos do Pi de
    `api.registerEmbeddedExtensionFactory(...)` para resultado de ferramenta por
    middleware neutro de runtime.

    ```typescript
    // Ferramentas dinâmicas de runtime do Pi e Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Atualize o manifesto do Plugin ao mesmo tempo:

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

  <Step title="Migre handlers nativos de aprovação para fatos de capacidade">
    Plugins de canal com capacidade de aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Principais mudanças:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação para fora do encadeamento legado `plugin.auth` /
      `plugin.approvals` e para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de Plugin de canal;
      mova os campos delivery/native/render para `approvalCapability`
    - `plugin.auth` permanece para fluxos de login/logout de canal apenas; hooks de autenticação de aprovação
      ali não são mais lidos pelo core
    - Registre objetos de runtime pertencentes ao canal, como clientes, tokens ou apps
      Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento pertencentes ao Plugin a partir de handlers nativos de aprovação;
      o core agora é responsável por avisos de roteado-para-outro-lugar a partir de resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Veja `/plugins/sdk-channel-plugins` para o layout atual de capacidade de aprovação.

  </Step>

  <Step title="Audite o comportamento de fallback do wrapper do Windows">
    Se o seu Plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat` não resolvidos no Windows agora falham em fail-closed, a menos que você passe explicitamente `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Depois
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Defina isso apenas para chamadores de compatibilidade confiáveis que
      // aceitam intencionalmente fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depende intencionalmente de fallback via shell, não defina
    `allowShellFallback` e trate o erro lançado em vez disso.

  </Step>

  <Step title="Encontre imports descontinuados">
    Procure no seu Plugin imports de qualquer uma das superfícies descontinuadas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substitua por imports focados">
    Cada export da superfície antiga é mapeado para um caminho de import moderno específico:

    ```typescript
    // Antes (camada descontinuada de compatibilidade retroativa)
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
    // Antes (ponte descontinuada extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers legados de ponte:

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

  <Step title="Compile e teste">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de import

  <Accordion title="Tabela comum de caminhos de import">
  | Caminho de import | Finalidade | Exports principais |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canônico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação legada abrangente para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export da schema raiz de configuração | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada de provider único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartilhados do assistente de configuração | Prompts de allowlist, builders de status de configuração |
  | `plugin-sdk/setup-runtime` | Helpers de runtime em tempo de configuração | Adaptadores seguros para import de patch de configuração, helpers de notas de lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegada |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de ferramentas de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de múltiplas contas | Helpers de lista/config/gate de ações de conta |
  | `plugin-sdk/account-id` | Helpers de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Helpers de lookup de conta | Helpers de lookup de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Helpers restritos de conta | Helpers de lista de conta/ações de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, mais `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Prefixo de resposta + encadeamento de digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de config | Primitivas compartilhadas de schema de configuração de canal; exports nomeados de schema de canal empacotado são apenas compatibilidade legada |
  | `plugin-sdk/telegram-command-config` | Helpers de configuração de comandos do Telegram | Normalização de nome de comando, trim de descrição, validação de duplicata/conflito |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de status de conta e ciclo de vida de stream de rascunho | `createAccountStatusSink`, helpers de finalização de prévia de rascunho |
  | `plugin-sdk/inbound-envelope` | Helpers de envelope de entrada | Helpers compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de resposta de entrada | Helpers compartilhados de registro e despacho |
  | `plugin-sdk/messaging-targets` | Parsing de destinos de mensagem | Helpers de parsing/correspondência de destino |
  | `plugin-sdk/outbound-media` | Helpers de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime de saída | Helpers de entrega de saída, delegate de identidade/envio, sessão, formatação e planejamento de payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de binding de thread | Helpers de ciclo de vida e adaptador de binding de thread |
  | `plugin-sdk/agent-media-payload` | Helpers legados de payload de mídia | Builder de payload de mídia de agente para layouts de campos legados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade descontinuado | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplos de runtime | Helpers de runtime/logging/backup/instalação de Plugin |
  | `plugin-sdk/runtime-env` | Helpers restritos de ambiente de runtime | Helpers de logger/ambiente de runtime, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartilhados de runtime de Plugin | Helpers de comandos/hooks/http/interativos de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers compartilhados de pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processo | Helpers compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime da CLI | Helpers de formatação de comando, espera, versão |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Cliente de Gateway e helpers de patch de status de canal |
  | `plugin-sdk/config-runtime` | Helpers de config | Helpers de carregamento/gravação de config |
  | `plugin-sdk/telegram-command-config` | Helpers de comando do Telegram | Helpers estáveis de fallback para validação de comandos do Telegram quando a superfície de contrato do Telegram empacotado estiver indisponível |
  | `plugin-sdk/approval-runtime` | Helpers de prompt de aprovação | Helpers de payload de aprovação exec/Plugin, helpers de capability/profile de aprovação, helpers de roteamento/runtime de aprovação nativa e formatação estruturada de caminho de exibição de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprovação | Helpers de profile/filter de aprovação exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprovação | Adaptadores nativos de capability/entrega de aprovação |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway de aprovação | Helper compartilhado de resolução de Gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprovação | Helpers leves de carregamento de adaptador de aprovação nativa para entrypoints quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler de aprovação | Helpers mais amplos de runtime de handler de aprovação; prefira os seams mais restritos de adaptador/Gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprovação | Helpers nativos de binding de destino/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Helpers de resposta de aprovação | Helpers de payload de resposta de aprovação exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de runtime de canal | Helpers genéricos de register/get/watch de contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de segurança | Helpers compartilhados de confiança, gating de DM, conteúdo externo e coleta de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de política de SSRF | Helpers de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime de SSRF | Dispatcher fixado, fetch protegido, helpers de política de SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de gating de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de erros |
  | `plugin-sdk/fetch-runtime` | Helpers encapsulados de fetch/proxy | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating de comando e helpers de superfície de comando | `resolveControlCommandGate`, helpers de autorização de remetente, helpers de registro de comando incluindo formatação dinâmica de menu de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de status/help de comando | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing de entrada de secret | Helpers de entrada de secret |
  | `plugin-sdk/webhook-ingress` | Helpers de requisição de Webhook | Utilitários de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de guarda de corpo de Webhook | Helpers de leitura/limite de corpo de requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, Heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers restritos de despacho de resposta | Finalização, despacho de provider e helpers de rótulo de conversa |
  | `plugin-sdk/reply-history` | Helpers de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de chunks de resposta | Helpers de chunking de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de armazenamento de sessão | Helpers de caminho de armazenamento + updated-at |
  | `plugin-sdk/state-paths` | Helpers de caminhos de estado | Helpers de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Helpers de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Helpers de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, helpers de metadados de issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolvedor de destino | Helpers compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalização de string | Helpers de normalização de slug/string |
  | `plugin-sdk/request-url` | Helpers de URL de requisição | Extraia URLs em string de entradas do tipo request |
  | `plugin-sdk/run-command` | Helpers de comando temporizado | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extraia payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extraia campos canônicos de destino de envio de args de ferramenta |
  | `plugin-sdk/temp-path` | Helpers de caminho temporário | Helpers compartilhados de caminho temporário para download |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger de subsistema e helpers de redação |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tabela markdown | Helpers de modo de tabela markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Helpers curados de configuração de provider local/self-hosted | Helpers de descoberta/config de provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers focados de configuração de provider self-hosted compatível com OpenAI | Os mesmos helpers de descoberta/config de provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticação de runtime de provider | Helpers de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuração de chave de API de provider | Helpers de onboarding/gravação de profile de chave de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticação de provider | Builder padrão de auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de login interativo de provider | Helpers compartilhados de login interativo |
  | `plugin-sdk/provider-selection-runtime` | Helpers de seleção de provider | Seleção de provider configurado-ou-automático e mesclagem bruta de config de provider |
  | `plugin-sdk/provider-env-vars` | Helpers de variáveis de ambiente de provider | Helpers de lookup de variáveis de ambiente de autenticação de provider |
  | `plugin-sdk/provider-model-shared` | Helpers compartilhados de modelo/replay de provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders compartilhados de política de replay, helpers de endpoint de provider e helpers de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartilhados de catálogo de provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provider | Helpers de configuração de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de provider | Helpers genéricos de HTTP/capacidade de endpoint de provider, incluindo helpers de formulário multipart para transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de provider | Helpers de registro/cache de provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de config de busca na web de provider | Helpers restritos de config/credenciais de busca na web para providers que não precisam de encadeamento de ativação de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de busca na web de provider | Helpers restritos de contrato de config/credenciais de busca na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Helpers de busca na web de provider | Helpers de registro/cache/runtime de provider de busca na web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidade de ferramenta/schema de provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de schema do Gemini + diagnósticos e helpers de compatibilidade do xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros helpers de uso de provider |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de stream de provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e helpers compartilhados de wrapper para Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de provider | Helpers nativos de transporte de provider, como fetch protegido, transformações de mensagem de transporte e streams de eventos de transporte graváveis |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartilhados de mídia | Helpers de fetch/transform/store de mídia mais builders de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Helpers compartilhados de geração de mídia | Helpers compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Helpers de entendimento de mídia | Tipos de provider de entendimento de mídia mais exports de helpers de imagem/áudio voltados a provider |
  | `plugin-sdk/text-runtime` | Helpers compartilhados de texto | Remoção de texto visível ao assistente, helpers de render/chunking/tabela markdown, helpers de redação, helpers de tags de diretiva, utilitários de texto seguro e helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de chunking de texto | Helper de chunking de texto de saída |
  | `plugin-sdk/speech` | Helpers de fala | Tipos de provider de fala mais helpers voltados a provider para diretiva, registry e validação |
  | `plugin-sdk/speech-core` | Core compartilhado de fala | Tipos de provider de fala, registry, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Helpers de transcrição em tempo real | Tipos de provider, helpers de registry e helper compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz em tempo real | Tipos de provider, helpers de registry/resolução e helpers de sessão de bridge |
  | `plugin-sdk/image-generation-core` | Core compartilhado de geração de imagem | Tipos de geração de imagem, failover, autenticação e helpers de registry |
  | `plugin-sdk/music-generation` | Helpers de geração de música | Tipos de provider/requisição/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Core compartilhado de geração de música | Tipos de geração de música, helpers de failover, lookup de provider e parsing de model-ref |
  | `plugin-sdk/video-generation` | Helpers de geração de vídeo | Tipos de provider/requisição/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Core compartilhado de geração de vídeo | Tipos de geração de vídeo, helpers de failover, lookup de provider e parsing de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de config de canal | Primitivas restritas de config-schema de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de gravação de config de canal | Helpers de autorização de gravação de config de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de status de canal | Helpers compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de config de allowlist | Helpers de edição/leitura de config de allowlist |
  | `plugin-sdk/group-access` | Helpers de acesso a grupo | Helpers compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm` | Helpers de DM direta | Helpers compartilhados de autenticação/guarda de DM direta |
  | `plugin-sdk/extension-shared` | Helpers compartilhados de extensão | Primitivas de helper para canal/status passivo e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Helpers de destino de Webhook | Registry de destino de Webhook e helpers de instalação de rota |
  | `plugin-sdk/webhook-path` | Helpers de caminho de Webhook | Helpers de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Helpers compartilhados de mídia web | Helpers de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação de Zod | `zod` reexportado para consumidores do SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers empacotados de memory-core | Superfície de helpers de gerenciador/config/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do engine de memória | Fachada de runtime de índice/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine base de host de memória | Exports do engine base de host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine de embeddings de host de memória | Contratos de embeddings de memória, acesso ao registry, provider local e helpers genéricos de batch/remoto; providers remotos concretos ficam em seus Plugins proprietários |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD de host de memória | Exports do engine QMD de host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine de storage de host de memória | Exports do engine de storage de host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodais de host de memória | Helpers multimodais de host de memória |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta de host de memória | Helpers de consulta de host de memória |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret de host de memória | Helpers de secret de host de memória |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal de eventos de host de memória | Helpers de journal de eventos de host de memória |
  | `plugin-sdk/memory-core-host-status` | Helpers de status de host de memória | Helpers de status de host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI de host de memória | Helpers de runtime de CLI de host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core de host de memória | Helpers de runtime core de host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de arquivo/runtime de host de memória | Helpers de arquivo/runtime de host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime core de host de memória | Alias neutro de fornecedor para helpers de runtime core de host de memória |
  | `plugin-sdk/memory-host-events` | Alias de journal de eventos de host de memória | Alias neutro de fornecedor para helpers de journal de eventos de host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime de host de memória | Alias neutro de fornecedor para helpers de arquivo/runtime de host de memória |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gerenciado | Helpers compartilhados de markdown gerenciado para Plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca do Active Memory | Fachada lazy de runtime do gerenciador de busca de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de status de host de memória | Alias neutro de fornecedor para helpers de status de host de memória |
  | `plugin-sdk/memory-lancedb` | Helpers empacotados de memory-lancedb | Superfície de helpers de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Helpers de teste e mocks |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não toda a
superfície do SDK. A lista completa de mais de 200 entrypoints fica em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui alguns seams de helper de Plugins empacotados, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Eles continuam exportados para
manutenção e compatibilidade de Plugins empacotados, mas são intencionalmente
omitidos da tabela comum de migração e não são o alvo recomendado para
novo código de Plugin.

A mesma regra se aplica a outras famílias de helpers empacotados, como:

- helpers de suporte a navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies de helper/Plugin empacotadas como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

Atualmente, `plugin-sdk/github-copilot-token` expõe a superfície restrita de helpers de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use o import mais restrito que corresponder à tarefa. Se você não encontrar um export,
verifique a origem em `src/plugin-sdk/` ou pergunte no Discord.

## Descontinuações ativas

Descontinuações mais restritas que se aplicam em todo o SDK de Plugin, contrato de provider,
superfície de runtime e manifesto. Cada uma delas ainda funciona hoje, mas será removida
em uma futura release principal. A entrada abaixo de cada item mapeia a API antiga para sua
substituição canônica.

<AccordionGroup>
  <Accordion title="builders de help de command-auth → command-status">
    **Antigo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Novo (`openclaw/plugin-sdk/command-status`)**: mesmas assinaturas, mesmos
    exports — apenas importados do subpath mais restrito. `command-auth`
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

    Plugins de canal downstream (Slack, Discord, Matrix, Microsoft Teams) já fizeram
    a troca.

  </Accordion>

  <Accordion title="Shim de runtime de canal e helpers de ações de canal">
    `openclaw/plugin-sdk/channel-runtime` é um shim de compatibilidade para Plugins
    de canal mais antigos. Não importe isso em código novo; use
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de runtime.

    Helpers `channelActions*` em `openclaw/plugin-sdk/channel-actions` estão
    descontinuados junto com exports brutos de canal de "actions". Exponha
    capacidades por meio da superfície semântica de `presentation` — Plugins de
    canal declaram o que renderizam (cards, buttons, selects) em vez de quais nomes
    brutos de ação aceitam.

  </Accordion>

  <Accordion title="Helper tool() de provider de busca na web → createTool() no Plugin">
    **Antigo**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Novo**: implemente `createTool(...)` diretamente no Plugin de provider.
    O OpenClaw não precisa mais do helper do SDK para registrar o wrapper da ferramenta.

  </Accordion>

  <Accordion title="Envelopes de canal em texto simples → BodyForAgent">
    **Antigo**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) para construir um envelope de prompt
    plano em texto simples a partir de mensagens recebidas do canal.

    **Novo**: `BodyForAgent` mais blocos estruturados de contexto do usuário. Plugins de
    canal anexam metadados de roteamento (thread, tópico, reply-to, reações) como
    campos tipados em vez de concatená-los em uma string de prompt. O
    helper `formatAgentEnvelope(...)` ainda é compatível para envelopes
    sintetizados voltados ao assistente, mas envelopes de entrada em texto simples
    estão sendo descontinuados.

    Áreas afetadas: `inbound_claim`, `message_received` e qualquer Plugin
    de canal personalizado que pós-processasse texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipos de descoberta de provider → tipos de catálogo de provider">
    Quatro aliases de tipo de descoberta agora são wrappers finos sobre os
    tipos da era de catálogo:

    | Alias antigo              | Tipo novo                |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Além disso, há o bag estático legado `ProviderCapabilities` — Plugins de provider
    devem anexar fatos de capability por meio do contrato de runtime do provider
    em vez de um objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de raciocínio → resolveThinkingProfile">
    **Antigo** (três hooks separados em `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Novo**: um único `resolveThinkingProfile(ctx)` que retorna um
    `ProviderThinkingProfile` com o `id` canônico, `label` opcional e
    lista classificada de níveis. O OpenClaw faz downgrade automático de valores
    armazenados obsoletos pelo rank do profile.

    Implemente um hook em vez de três. Os hooks legados continuam funcionando durante
    a janela de descontinuação, mas não são compostos com o resultado do profile.

  </Accordion>

  <Accordion title="Fallback de provider OAuth externo → contracts.externalAuthProviders">
    **Antigo**: implementar `resolveExternalOAuthProfiles(...)` sem
    declarar o provider no manifesto do Plugin.

    **Novo**: declarar `contracts.externalAuthProviders` no manifesto do Plugin
    **e** implementar `resolveExternalAuthProfiles(...)`. O caminho antigo de "auth
    fallback" emite um aviso em runtime e será removido.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup de variável de ambiente de provider → setup.providers[].envVars">
    Campo antigo do manifesto: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Novo**: espelhe o mesmo lookup de variável de ambiente em `setup.providers[].envVars`
    no manifesto. Isso consolida metadados de variável de ambiente de config/status em um
    só lugar e evita iniciar o runtime do Plugin apenas para responder
    lookups de variável de ambiente.

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

    | Antigo                      | Novo                            |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    O método de runtime `readSession` está descontinuado em favor de
    `getSessionMessages`. Mesma assinatura; o método antigo delega para o
    novo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Antigo**: `runtime.tasks.flow` (singular) retornava um acessador ativo de TaskFlow.

    **Novo**: `runtime.tasks.flows` (plural) retorna acesso a TaskFlow baseado em DTO,
    que é seguro para import e não exige que o runtime completo de tarefas seja
    carregado.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow(ctx);
    // Depois
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Fábricas de extensão embutida → middleware de resultado de ferramenta do agente">
    Coberto em "Como migrar → Migre extensões de resultado de ferramenta do Pi para
    middleware" acima. Incluído aqui para completude: o caminho removido e exclusivo do Pi
    `api.registerEmbeddedExtensionFactory(...)` foi substituído por
    `api.registerAgentToolResultMiddleware(...)` com uma lista explícita de runtimes
    em `contracts.agentToolResultMiddleware`.
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
Descontinuações no nível de extensão (dentro de Plugins empacotados de canal/provider em
`extensions/`) são rastreadas em seus próprios barrels `api.ts` e `runtime-api.ts`.
Elas não afetam contratos de Plugins de terceiros e não estão listadas
aqui. Se você consome diretamente o barrel local de um Plugin empacotado, leia os
comentários de descontinuação nesse barrel antes de atualizar.
</Note>

## Cronograma de remoção

| Quando                 | O que acontece                                                           |
| ---------------------- | ------------------------------------------------------------------------ |
| **Agora**              | Superfícies descontinuadas emitem avisos em runtime                      |
| **Próxima release principal** | Superfícies descontinuadas serão removidas; Plugins que ainda as usarem falharão |

Todos os Plugins principais já foram migrados. Plugins externos devem migrar
antes da próxima release principal.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma rota de escape temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro Plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subpath
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando Plugins de canal
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — criando Plugins de provider
- [Internals de Plugins](/pt-BR/plugins/architecture) — aprofundamento de arquitetura
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — referência da schema de manifesto
