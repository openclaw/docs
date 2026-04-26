---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você usou `api.registerEmbeddedExtensionFactory` antes do OpenClaw 2026.4.25
    - Você está atualizando um Plugin para a arquitetura moderna de plugins
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar da camada legada de compatibilidade com versões anteriores para o plugin SDK moderno
title: Migração do Plugin SDK
x-i18n:
    generated_at: "2026-04-26T11:34:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

O OpenClaw migrou de uma ampla camada de compatibilidade com versões anteriores para uma arquitetura moderna de plugins
com imports focados e documentados. Se seu Plugin foi criado antes
da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de plugins fornecia duas superfícies amplas que permitiam aos plugins importar
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** — um único import que reexportava dezenas de
  auxiliares. Ele foi introduzido para manter plugins mais antigos baseados em hooks funcionando enquanto a
  nova arquitetura de plugins era construída.
- **`openclaw/extension-api`** — uma bridge que dava aos plugins acesso direto a
  auxiliares do lado do host, como o runner de agente incorporado.
- **`api.registerEmbeddedExtensionFactory(...)`** — um hook removido de extension
  incluída no pacote somente para Pi, que podia observar eventos do runner incorporado, como
  `tool_result`.

As superfícies amplas de import agora estão **obsoletas**. Elas ainda funcionam em runtime,
mas novos plugins não devem usá-las, e plugins existentes devem migrar antes que a
próxima major release as remova. A API de registro da factory de extension incorporada somente para Pi
foi removida; use middleware de resultado de ferramenta em vez disso.

O OpenClaw não remove nem reinterpreta comportamento documentado de Plugin na mesma
mudança que introduz um substituto. Mudanças de contrato que quebram compatibilidade devem primeiro passar
por um adaptador de compatibilidade, diagnósticos, documentação e uma janela de depreciação.
Isso se aplica a imports do SDK, campos de manifesto, APIs de setup, hooks e
comportamento de registro em runtime.

<Warning>
  A camada de compatibilidade com versões anteriores será removida em uma futura major release.
  Plugins que ainda importarem dessas superfícies quebrarão quando isso acontecer.
  Registros de factory de extension incorporada somente para Pi já não são mais carregados.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** — importar um auxiliar carregava dezenas de módulos não relacionados
- **Dependências circulares** — reexports amplos facilitavam a criação de ciclos de import
- **Superfície de API pouco clara** — não havia como saber quais exports eram estáveis versus internos

O plugin SDK moderno corrige isso: cada caminho de import (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno, autocontido, com propósito claro e contrato documentado.

As costuras legadas de conveniência de provider para canais incluídos no pacote também desapareceram. Imports
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
costuras auxiliares com marca de canal e
`openclaw/plugin-sdk/telegram-core` eram atalhos privados do mono-repo, não
contratos estáveis de Plugin. Use subpaths genéricos e estreitos do SDK em vez disso. Dentro do
workspace do Plugin incluído no pacote, mantenha auxiliares de propriedade do provider no próprio
`api.ts` ou `runtime-api.ts` desse Plugin.

Exemplos atuais de providers incluídos no pacote:

- Anthropic mantém auxiliares de stream específicos do Claude em sua própria costura `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provider, auxiliares de modelo padrão e builders de
  provider realtime em seu próprio `api.ts`
- OpenRouter mantém builder de provider e auxiliares de onboarding/config em seu
  próprio `api.ts`

## Política de compatibilidade

Para plugins externos, o trabalho de compatibilidade segue esta ordem:

1. adicionar o novo contrato
2. manter o comportamento antigo ligado por um adaptador de compatibilidade
3. emitir um diagnóstico ou aviso que nomeie o caminho antigo e o substituto
4. cobrir ambos os caminhos em testes
5. documentar a depreciação e o caminho de migração
6. remover somente após a janela de migração anunciada, normalmente em uma major release

Se um campo de manifesto ainda é aceito, autores de Plugin podem continuar usando-o até
que a documentação e os diagnósticos digam o contrário. Código novo deve preferir o
substituto documentado, mas plugins existentes não devem quebrar durante minor
releases comuns.

## Como migrar

<Steps>
  <Step title="Migrar extensions Pi de resultado de ferramenta para middleware">
    Plugins incluídos no pacote devem substituir manipuladores de resultado de ferramenta
    `api.registerEmbeddedExtensionFactory(...)` somente para Pi por
    middleware neutro em relação ao runtime.

    ```typescript
    // Ferramentas dinâmicas de runtime Pi e Codex
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

  <Step title="Migrar manipuladores nativos de aprovação para fatos de capacidade">
    Plugins de canal com capacidade de aprovação agora expõem comportamento nativo de aprovação por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Mudanças principais:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação para fora da fiação legada `plugin.auth` /
      `plugin.approvals` e para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de Plugin de canal;
      mova campos de entrega/nativo/render para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout de canal; hooks de autenticação
      de aprovação ali não são mais lidos pelo core
    - Registre objetos de runtime de propriedade do canal, como clients, tokens ou apps
      Bolt por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento de propriedade do Plugin a partir de manipuladores nativos de aprovação;
      o core agora é dono dos avisos de roteado-para-outro-lugar vindos dos resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície `createPluginRuntime().channel` real. Stubs parciais são rejeitados.

    Veja `/plugins/sdk-channel-plugins` para o layout atual de
    capability de aprovação.

  </Step>

  <Step title="Auditar o comportamento de fallback do wrapper do Windows">
    Se seu Plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat`
    não resolvidos no Windows agora falham de forma fechada, a menos que você passe explicitamente
    `allowShellFallback: true`.

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

    Se seu chamador não depender intencionalmente de fallback por shell, não defina
    `allowShellFallback` e trate o erro lançado em vez disso.

  </Step>

  <Step title="Encontrar imports obsoletos">
    Procure em seu Plugin imports de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga é mapeado para um caminho de import moderno específico:

    ```typescript
    // Antes (camada obsoleta de compatibilidade com versões anteriores)
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

    Para auxiliares do lado do host, use o runtime de Plugin injetado em vez de importar
    diretamente:

    ```typescript
    // Antes (bridge obsoleta extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Depois (runtime injetado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros auxiliares legados da bridge:

    | Import antigo | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | auxiliares de armazenamento de sessão | `api.runtime.agent.session.*` |

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
  | Caminho de import | Finalidade | Exports principais |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Auxiliar canônico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexport abrangente legado para definições/builders de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export do schema de config raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Auxiliar de entrada de provider único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e builders focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de setup | Prompts de allowlist, builders de status de setup |
  | `plugin-sdk/setup-runtime` | Auxiliares de runtime no setup | Adaptadores de patch de setup seguros para import, auxiliares de nota de lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies delegados de setup |
  | `plugin-sdk/setup-adapter-runtime` | Auxiliares de adaptador de setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Auxiliares de tooling de setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Auxiliares de várias contas | Auxiliares de lista/config/gate de ação de conta |
  | `plugin-sdk/account-id` | Auxiliares de id de conta | `DEFAULT_ACCOUNT_ID`, normalização de id de conta |
  | `plugin-sdk/account-resolution` | Auxiliares de lookup de conta | Auxiliares de lookup de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Auxiliares estreitos de conta | Auxiliares de lista de conta/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Fiação de prefixo de resposta + digitação | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factories de adaptador de config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schema de config | Primitivas compartilhadas de schema de config de canal; exports de schema nomeados de canais incluídos no pacote são apenas compatibilidade legada |
  | `plugin-sdk/telegram-command-config` | Auxiliares de config de comando do Telegram | Normalização de nome de comando, trim de descrição, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Auxiliares de ciclo de vida de status de conta e stream de rascunho | `createAccountStatusSink`, auxiliares de finalização de pré-visualização de rascunho |
  | `plugin-sdk/inbound-envelope` | Auxiliares de envelope de entrada | Auxiliares compartilhados de rota + builder de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Auxiliares de resposta de entrada | Auxiliares compartilhados de registro e dispatch |
  | `plugin-sdk/messaging-targets` | Parsing de alvos de mensagem | Auxiliares de parsing/correspondência de alvos |
  | `plugin-sdk/outbound-media` | Auxiliares de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-send-deps` | Auxiliares de dependência de envio de saída | Lookup leve `resolveOutboundSendDep` sem importar o runtime completo de saída |
  | `plugin-sdk/outbound-runtime` | Auxiliares de runtime de saída | Entrega de saída, delegado de identidade/envio, sessão, formatação e auxiliares de planejamento de payload |
  | `plugin-sdk/thread-bindings-runtime` | Auxiliares de binding de thread | Auxiliares de ciclo de vida e adaptador de binding de thread |
  | `plugin-sdk/agent-media-payload` | Auxiliares legados de payload de mídia | Builder de payload de mídia do agente para layouts legados de campo |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Auxiliares amplos de runtime | Auxiliares de runtime/logging/backup/install de Plugin |
  | `plugin-sdk/runtime-env` | Auxiliares estreitos de env de runtime | Auxiliares de logger/env de runtime, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de runtime de Plugin | Auxiliares de comandos/hooks/http/interactive do Plugin |
  | `plugin-sdk/hook-runtime` | Auxiliares de pipeline de hook | Auxiliares compartilhados de pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Auxiliares de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Auxiliares de processo | Auxiliares compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Auxiliares de runtime da CLI | Auxiliares de formatação de comando, waits e versão |
  | `plugin-sdk/gateway-runtime` | Auxiliares de Gateway | Auxiliares de client do Gateway e patch de status de canal |
  | `plugin-sdk/config-runtime` | Auxiliares de config | Auxiliares de carregamento/escrita de config |
  | `plugin-sdk/telegram-command-config` | Auxiliares de comando do Telegram | Auxiliares estáveis por fallback para validação de comando do Telegram quando a superfície de contrato incluída no pacote do Telegram não está disponível |
  | `plugin-sdk/approval-runtime` | Auxiliares de prompt de aprovação | Payload de aprovação de exec/Plugin, auxiliares de capability/perfil de aprovação, auxiliares nativos de roteamento/runtime de aprovação e formatação estruturada de caminho de exibição de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Auxiliares de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Auxiliares de client de aprovação | Auxiliares nativos de perfil/filtro de aprovação de exec |
  | `plugin-sdk/approval-delivery-runtime` | Auxiliares de entrega de aprovação | Adaptadores nativos de capability/entrega de aprovação |
  | `plugin-sdk/approval-gateway-runtime` | Auxiliares de Gateway de aprovação | Auxiliar compartilhado de resolução do Gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares de adaptador de aprovação | Auxiliares leves de carregamento de adaptador nativo de aprovação para entrypoints quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Auxiliares de manipulador de aprovação | Auxiliares mais amplos de runtime de manipulador de aprovação; prefira as costuras mais estreitas de adapter/gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Auxiliares de alvo de aprovação | Auxiliares nativos de binding de alvo/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Auxiliares de resposta de aprovação | Auxiliares de payload de resposta de aprovação de exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Auxiliares de contexto de runtime de canal | Auxiliares genéricos de register/get/watch de contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Auxiliares de segurança | Auxiliares compartilhados de confiança, gating de DM, conteúdo externo e coleta de segredo |
  | `plugin-sdk/ssrf-policy` | Auxiliares de política SSRF | Auxiliares de allowlist de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Auxiliares de runtime SSRF | Dispatcher fixado, fetch protegido, auxiliares de política SSRF |
  | `plugin-sdk/collection-runtime` | Auxiliares de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Auxiliares de gating de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Auxiliares de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, auxiliares de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Auxiliares de fetch/proxy encapsulados | `resolveFetch`, auxiliares de proxy |
  | `plugin-sdk/host-runtime` | Auxiliares de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Auxiliares de retry | `RetryConfig`, `retryAsync`, runners de política |
  | `plugin-sdk/allow-from` | Formatação de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating de comando e auxiliares de superfície de comando | `resolveControlCommandGate`, auxiliares de autorização de remetente, auxiliares de registro de comando incluindo formatação dinâmica de menu de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de status/help de comando | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing de entrada de segredo | Auxiliares de entrada de segredo |
  | `plugin-sdk/webhook-ingress` | Auxiliares de requisição de Webhook | Utilitários de alvo de Webhook |
  | `plugin-sdk/webhook-request-guards` | Auxiliares de guarda de body de Webhook | Auxiliares de leitura/limite de body de requisição |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Dispatch de entrada, Heartbeat, planejador de resposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Auxiliares estreitos de dispatch de resposta | Finalização, dispatch de provider e auxiliares de rótulo de conversa |
  | `plugin-sdk/reply-history` | Auxiliares de histórico de resposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Auxiliares de fragmento de resposta | Auxiliares de chunking de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Auxiliares de armazenamento de sessão | Auxiliares de caminho de store + updated-at |
  | `plugin-sdk/state-paths` | Auxiliares de caminho de estado | Auxiliares de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Auxiliares de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, auxiliares de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Auxiliares de status de canal | Builders de resumo de status de canal/conta, padrões de estado de runtime, auxiliares de metadados de problema |
  | `plugin-sdk/target-resolver-runtime` | Auxiliares de resolvedor de alvo | Auxiliares compartilhados de resolvedor de alvo |
  | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de string | Auxiliares de normalização de slug/string |
  | `plugin-sdk/request-url` | Auxiliares de URL de requisição | Extração de URLs string de entradas semelhantes a requisição |
  | `plugin-sdk/run-command` | Auxiliares de comando temporizado | Runner de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetro | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extrai payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrai campos canônicos de alvo de envio de args de ferramenta |
  | `plugin-sdk/temp-path` | Auxiliares de caminho temporário | Auxiliares compartilhados de caminho temporário de download |
  | `plugin-sdk/logging-core` | Auxiliares de logging | Logger de subsistema e auxiliares de redação |
  | `plugin-sdk/markdown-table-runtime` | Auxiliares de tabela markdown | Auxiliares de modo de tabela markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Auxiliares curados de setup de provider local/self-hosted | Auxiliares de descoberta/config de provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de setup de provider self-hosted compatível com OpenAI | Os mesmos auxiliares de descoberta/config de provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Auxiliares de autenticação em runtime de provider | Auxiliares de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Auxiliares de setup de chave de API de provider | Auxiliares de onboarding/escrita de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Auxiliares de resultado de autenticação de provider | Builder padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Auxiliares de login interativo de provider | Auxiliares compartilhados de login interativo |
  | `plugin-sdk/provider-selection-runtime` | Auxiliares de seleção de provider | Seleção de provider configurado-ou-automático e mesclagem de config bruta de provider |
  | `plugin-sdk/provider-env-vars` | Auxiliares de variáveis de ambiente de provedor | Auxiliares de busca de variáveis de ambiente de autenticação do provedor |
  | `plugin-sdk/provider-model-shared` | Auxiliares compartilhados de modelo/replay de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Auxiliares compartilhados de catálogo de provedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de integração inicial de provedor | Auxiliares de configuração de integração inicial |
  | `plugin-sdk/provider-http` | Auxiliares HTTP de provedor | Auxiliares genéricos de HTTP/capacidade de endpoint de provedor, incluindo auxiliares de formulário multipart para transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Auxiliares de web-fetch de provedor | Auxiliares de registro/cache de provedor via web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Auxiliares de configuração de busca na web de provedor | Auxiliares restritos de configuração/credencial de busca na web para provedores que não precisam de integração de ativação de plugin |
  | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato de busca na web de provedor | Auxiliares restritos de contrato de configuração/credencial de busca na web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Auxiliares de busca na web de provedor | Auxiliares de registro/cache/runtime de provedor de busca na web |
  | `plugin-sdk/provider-tools` | Auxiliares de compatibilidade de ferramenta/schema de provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de schema do Gemini + diagnósticos, e auxiliares de compatibilidade do xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Auxiliares de uso de provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros auxiliares de uso de provedor |
  | `plugin-sdk/provider-stream` | Auxiliares de wrapper de stream de provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper de Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte de provedor | Auxiliares nativos de transporte de provedor, como fetch protegido, transformações de mensagem de transporte e streams graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Auxiliares compartilhados de mídia | Auxiliares de busca/transformação/armazenamento de mídia, além de construtores de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de geração de mídia | Auxiliares compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Auxiliares de compreensão de mídia | Tipos de provedor de compreensão de mídia, além de exportações de auxiliares de imagem/áudio voltados ao provedor |
  | `plugin-sdk/text-runtime` | Auxiliares compartilhados de texto | Remoção de texto visível ao assistente, auxiliares de renderização/fragmentação/tabelas em markdown, auxiliares de redação, auxiliares de tags de diretiva, utilitários de texto seguro e auxiliares relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Auxiliares de fragmentação de texto | Auxiliar de fragmentação de texto de saída |
  | `plugin-sdk/speech` | Auxiliares de fala | Tipos de provedor de fala, além de auxiliares de diretiva, registro e validação voltados ao provedor |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provedor de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Auxiliares de transcrição em tempo real | Tipos de provedor, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Auxiliares de voz em tempo real | Tipos de provedor, auxiliares de registro/resolução e auxiliares de sessão bridge |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagens | Tipos, failover, autenticação e auxiliares de registro de geração de imagens |
  | `plugin-sdk/music-generation` | Auxiliares de geração de música | Tipos de provedor/solicitação/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Tipos de geração de música, auxiliares de failover, busca de provedor e parsing de model-ref |
  | `plugin-sdk/video-generation` | Auxiliares de geração de vídeo | Tipos de provedor/solicitação/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Tipos de geração de vídeo, auxiliares de failover, busca de provedor e parsing de model-ref |
  | `plugin-sdk/interactive-runtime` | Auxiliares de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivos de configuração de canal | Primitivos restritos de schema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Auxiliares de escrita de configuração de canal | Auxiliares de autorização para escrita de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exportações compartilhadas de prelúdio de plugin de canal |
  | `plugin-sdk/channel-status` | Auxiliares de status de canal | Auxiliares compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Auxiliares de configuração de allowlist | Auxiliares de edição/leitura de configuração de allowlist |
  | `plugin-sdk/group-access` | Auxiliares de acesso a grupo | Auxiliares compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm` | Auxiliares de DM direto | Auxiliares compartilhados de autenticação/proteção para DM direto |
  | `plugin-sdk/extension-shared` | Auxiliares compartilhados de extensão | Primitivos auxiliares de canal/status passivo e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Auxiliares de destinos de Webhook | Registro de destinos de Webhook e auxiliares de instalação de rota |
  | `plugin-sdk/webhook-path` | Auxiliares de caminho de Webhook | Auxiliares de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Auxiliares compartilhados de mídia web | Auxiliares de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação de Zod | `zod` reexportado para consumidores do SDK de plugin |
  | `plugin-sdk/memory-core` | Auxiliares agrupados de memory-core | Superfície de auxiliares de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de indexação/busca de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo de fundação do host de memória | Exportações do mecanismo de fundação do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Contratos de embedding de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remoto; provedores remotos concretos ficam em seus plugins proprietários |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exportações do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exportações do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória | Auxiliares multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória | Auxiliares de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredos do host de memória | Auxiliares de segredos do host de memória |
  | `plugin-sdk/memory-core-host-events` | Auxiliares de diário de eventos do host de memória | Auxiliares de diário de eventos do host de memória |
  | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória | Auxiliares de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI do host de memória | Auxiliares de runtime de CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime principal do host de memória | Auxiliares de runtime principal do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória | Auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime principal do host de memória | Alias neutro em relação a fornecedor para auxiliares de runtime principal do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de diário de eventos do host de memória | Alias neutro em relação a fornecedor para auxiliares de diário de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação a fornecedor para auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Auxiliares de markdown gerenciado | Auxiliares compartilhados de markdown gerenciado para plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de Active Memory | Fachada lazy de runtime do gerenciador de busca de memória ativa |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação a fornecedor para auxiliares de status do host de memória |
  | `plugin-sdk/memory-lancedb` | Auxiliares agrupados de memory-lancedb | Superfície de auxiliares de memory-lancedb |
  | `plugin-sdk/testing` | Utilitários de teste | Auxiliares e mocks de teste |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície completa do SDK. A lista completa de mais de 200 pontos de entrada está em
`scripts/lib/plugin-sdk-entrypoints.json`.

Essa lista ainda inclui algumas seams auxiliares de plugin agrupado, como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Elas continuam exportadas para
manutenção e compatibilidade de plugins agrupados, mas são intencionalmente
omitidas da tabela comum de migração e não são o destino recomendado para
novo código de plugin.

A mesma regra se aplica a outras famílias de auxiliares agrupados, como:

- auxiliares de suporte a navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfícies de auxiliar/plugin agrupadas, como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  e `plugin-sdk/voice-call`

Atualmente, `plugin-sdk/github-copilot-token` expõe a superfície restrita de
auxiliar de token `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Use a importação mais restrita que corresponda ao trabalho. Se você não
conseguir encontrar uma exportação, verifique a origem em `src/plugin-sdk/`
ou pergunte no Discord.

## Descontinuações ativas

Descontinuações mais restritas que se aplicam ao SDK de plugin, contrato de
provedor, superfície de runtime e manifesto. Cada uma ainda funciona hoje,
mas será removida em uma futura versão major. A entrada abaixo de cada item
mapeia a API antiga para sua substituição canônica.

<AccordionGroup>
  <Accordion title="Construtores de ajuda de command-auth → command-status">
    **Antigo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Novo (`openclaw/plugin-sdk/command-status`)**: mesmas assinaturas,
    mesmas exportações — apenas importadas do subcaminho mais restrito. `command-auth`
    as reexporta como stubs de compatibilidade.

    ```typescript
    // Antes
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Depois
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Auxiliares de gating de menção → resolveInboundMentionDecision">
    **Antigo**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` de
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Novo**: `resolveInboundMentionDecision({ facts, policy })` — retorna um
    único objeto de decisão em vez de duas chamadas separadas.

    Os plugins de canal downstream (Slack, Discord, Matrix, MS Teams) já
    migraram.

  </Accordion>

  <Accordion title="Shim de runtime de canal e auxiliares de ações de canal">
    `openclaw/plugin-sdk/channel-runtime` é um shim de compatibilidade para
    plugins de canal mais antigos. Não o importe em código novo; use
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de runtime.

    Os auxiliares `channelActions*` em `openclaw/plugin-sdk/channel-actions`
    estão descontinuados junto com as exportações brutas de canal "actions". Em vez disso,
    exponha capacidades por meio da superfície semântica `presentation` — os plugins
    de canal declaram o que renderizam (cards, botões, selects), em vez de quais
    nomes brutos de action aceitam.

  </Accordion>

  <Accordion title="Auxiliar tool() de provedor de busca na web → createTool() no plugin">
    **Antigo**: factory `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Novo**: implemente `createTool(...)` diretamente no plugin do provedor.
    O OpenClaw não precisa mais do auxiliar do SDK para registrar o wrapper da ferramenta.

  </Accordion>

  <Accordion title="Envelopes de canal em texto simples → BodyForAgent">
    **Antigo**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) para construir um envelope de prompt
    plano em texto simples a partir de mensagens de canal recebidas.

    **Novo**: `BodyForAgent` mais blocos estruturados de contexto do usuário.
    Os plugins de canal anexam metadados de roteamento (thread, tópico, reply-to, reactions) como
    campos tipados em vez de concatená-los em uma string de prompt. O
    auxiliar `formatAgentEnvelope(...)` ainda é compatível para envelopes
    sintetizados voltados ao assistente, mas os envelopes recebidos em texto simples estão
    sendo descontinuados.

    Áreas afetadas: `inbound_claim`, `message_received` e qualquer plugin de
    canal personalizado que pós-processava o texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipos de descoberta de provedor → tipos de catálogo de provedor">
    Quatro aliases de tipo de descoberta agora são wrappers finos sobre os
    tipos da era de catálogo:

    | Alias antigo              | Novo tipo                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Além disso, o bag estático legado `ProviderCapabilities` — plugins de
    provedor devem anexar fatos de capacidade por meio do contrato de runtime
    do provedor em vez de um objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de thinking → resolveThinkingProfile">
    **Antigo** (três hooks separados em `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Novo**: um único `resolveThinkingProfile(ctx)` que retorna um
    `ProviderThinkingProfile` com o `id` canônico, `label` opcional e
    lista de níveis classificada. O OpenClaw faz downgrade automaticamente
    de valores armazenados desatualizados pela classificação do perfil.

    Implemente um hook em vez de três. Os hooks legados continuam funcionando durante
    a janela de descontinuação, mas não são compostos com o resultado do perfil.

  </Accordion>

  <Accordion title="Fallback de provedor OAuth externo → contracts.externalAuthProviders">
    **Antigo**: implementar `resolveExternalOAuthProfiles(...)` sem
    declarar o provedor no manifesto do plugin.

    **Novo**: declarar `contracts.externalAuthProviders` no manifesto do plugin
    **e** implementar `resolveExternalAuthProfiles(...)`. O caminho antigo de
    "fallback de autenticação" emite um aviso em runtime e será removido.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Busca de variáveis de ambiente de provedor → setup.providers[].envVars">
    **Campo antigo do manifesto**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Novo**: espelhe a mesma busca de variáveis de ambiente em `setup.providers[].envVars`
    no manifesto. Isso consolida os metadados de ambiente de configuração/status em um só
    lugar e evita iniciar o runtime do plugin apenas para responder buscas de
    variáveis de ambiente.

    `providerAuthEnvVars` continua compatível por meio de um adaptador de compatibilidade
    até o fim da janela de descontinuação.

  </Accordion>

  <Accordion title="Registro de plugin de memória → registerMemoryCapability">
    **Antigo**: três chamadas separadas —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Novo**: uma chamada na API de estado de memória —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mesmos slots, uma única chamada de registro. Auxiliares aditivos de memória
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
    `getSessionMessages`. Mesma assinatura; o método antigo encaminha para o
    novo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Antigo**: `runtime.tasks.flow` (singular) retornava um acessador ativo de TaskFlow.

    **Novo**: `runtime.tasks.flows` (plural) retorna acesso a TaskFlow baseado em DTO,
    que é seguro para importação e não exige que o runtime completo de tarefas seja
    carregado.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow(ctx);
    // Depois
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Factories de extensão embutida → middleware de resultado de ferramenta do agente">
    Coberto em "Como migrar → Migrar extensões de resultado de ferramenta do Pi para
    middleware" acima. Incluído aqui para completude: o caminho removido somente do Pi
    `api.registerEmbeddedExtensionFactory(...)` é substituído por
    `api.registerAgentToolResultMiddleware(...)` com uma lista explícita de runtime em
    `contracts.agentToolResultMiddleware`.
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
As descontinuações em nível de extensão (dentro de plugins agrupados de canal/provedor em
`extensions/`) são acompanhadas dentro de seus próprios barrels `api.ts` e `runtime-api.ts`.
Elas não afetam contratos de plugins de terceiros e não estão listadas
aqui. Se você consome diretamente o barrel local de um plugin agrupado, leia os
comentários de descontinuação nesse barrel antes de atualizar.
</Note>

## Cronograma de remoção

| Quando                 | O que acontece                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| **Agora**              | As superfícies descontinuadas emitem avisos em runtime                |
| **Próxima versão major** | As superfícies descontinuadas serão removidas; plugins que ainda as usam falharão |

Todos os plugins principais já foram migrados. Plugins externos devem migrar
antes da próxima versão major.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma válvula de escape temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) — crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação por subcaminho
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criando plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — criando plugins de provedor
- [Internals de plugin](/pt-BR/plugins/architecture) — análise aprofundada da arquitetura
- [Manifesto de plugin](/pt-BR/plugins/manifest) — referência de schema do manifesto
