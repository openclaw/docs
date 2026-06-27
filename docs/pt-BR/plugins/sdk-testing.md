---
read_when:
    - Você está escrevendo testes para um plugin
    - Você precisa dos utilitários de teste do SDK de Plugin
    - Você quer entender os testes de contrato para plugins incluídos
sidebarTitle: Testing
summary: Utilitários e padrões de teste para Plugins do OpenClaw
title: Testes de Plugin
x-i18n:
    generated_at: "2026-06-27T17:59:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referência para utilitários, padrões e aplicação de lint de testes para plugins
do OpenClaw.

<Tip>
  **Procurando exemplos de testes?** Os guias práticos incluem exemplos de testes desenvolvidos:
  [Testes de Plugin de canal](/pt-BR/plugins/sdk-channel-plugins#step-6-test) e
  [Testes de Plugin de provedor](/pt-BR/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitários de teste

Esses subcaminhos de auxiliares de teste são pontos de entrada de código-fonte locais do repositório para os próprios
testes de plugins empacotados do OpenClaw. Eles não são exportações de pacote para plugins de terceiros e
podem importar Vitest ou outras dependências de teste exclusivas do repositório.

**Importação de mock da API de Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Importação de contrato de runtime do agente:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Importação de contrato de canal:** `openclaw/plugin-sdk/channel-contract-testing`

**Importação de auxiliar de teste de canal:** `openclaw/plugin-sdk/channel-test-helpers`

**Importação de teste de destino de canal:** `openclaw/plugin-sdk/channel-target-testing`

**Importação de contrato de Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Importação de teste de runtime de Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Importação de contrato de provedor:** `openclaw/plugin-sdk/provider-test-contracts`

**Importação de mock HTTP de provedor:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Importação de teste de ambiente/rede:** `openclaw/plugin-sdk/test-env`

**Importação de fixture genérica:** `openclaw/plugin-sdk/test-fixtures`

**Importação de mock integrado do Node:** `openclaw/plugin-sdk/test-node-mocks`

Dentro do repositório OpenClaw, prefira os subcaminhos focados abaixo para novos testes de
plugins empacotados. O barrel amplo
`openclaw/plugin-sdk/testing` existe apenas para compatibilidade legada.
As proteções do repositório rejeitam novas importações reais de `plugin-sdk/testing` e
`plugin-sdk/test-utils`; esses nomes permanecem apenas como superfícies de compatibilidade obsoletas
para testes de registro de compatibilidade.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### Exportações disponíveis

| Exportação                                           | Finalidade                                                                                                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Crie uma simulação mínima da API de plugin para testes unitários de registro direto. Importe de `plugin-sdk/plugin-test-api`                        |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Artefato de teste compartilhado de contrato de perfil de autenticação para adaptadores nativos de tempo de execução do agente. Importe de `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Artefato de teste compartilhado de contrato de supressão de entrega para adaptadores nativos de tempo de execução do agente. Importe de `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Artefato de teste compartilhado de contrato de classificação de fallback para adaptadores nativos de tempo de execução do agente. Importe de `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Crie artefatos de teste de esquema de ferramenta dinâmica para testes de contrato do tempo de execução nativo. Importe de `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Verifique o formato do contexto de entrada do canal. Importe de `plugin-sdk/channel-contract-testing`                                               |
| `installChannelOutboundPayloadContractSuite`         | Instale casos de contrato de payload de saída do canal. Importe de `plugin-sdk/channel-contract-testing`                                            |
| `createStartAccountContext`                          | Crie contextos de ciclo de vida da conta do canal. Importe de `plugin-sdk/channel-test-helpers`                                                    |
| `installChannelActionsContractSuite`                 | Instale casos genéricos de contrato de ações de mensagem do canal. Importe de `plugin-sdk/channel-test-helpers`                                    |
| `installChannelSetupContractSuite`                   | Instale casos genéricos de contrato de configuração do canal. Importe de `plugin-sdk/channel-test-helpers`                                         |
| `installChannelStatusContractSuite`                  | Instale casos genéricos de contrato de status do canal. Importe de `plugin-sdk/channel-test-helpers`                                               |
| `expectDirectoryIds`                                 | Verifique ids de diretório do canal a partir de uma função de listagem de diretórios. Importe de `plugin-sdk/channel-test-helpers`                  |
| `assertBundledChannelEntries`                        | Verifique se os pontos de entrada de canais empacotados expõem o contrato público esperado. Importe de `plugin-sdk/channel-test-helpers`            |
| `formatEnvelopeTimestamp`                            | Formate timestamps determinísticos de envelopes. Importe de `plugin-sdk/channel-test-helpers`                                                      |
| `expectPairingReplyText`                             | Verifique o texto de resposta de pareamento do canal e extraia seu código. Importe de `plugin-sdk/channel-test-helpers`                            |
| `describePluginRegistrationContract`                 | Instale verificações de contrato de registro de plugin. Importe de `plugin-sdk/plugin-test-contracts`                                               |
| `registerSingleProviderPlugin`                       | Registre um plugin de provedor em testes rápidos do carregador. Importe de `plugin-sdk/plugin-test-runtime`                                        |
| `registerProviderPlugin`                             | Capture todos os tipos de provedor de um plugin. Importe de `plugin-sdk/plugin-test-runtime`                                                       |
| `registerProviderPlugins`                            | Capture registros de provedores em vários plugins. Importe de `plugin-sdk/plugin-test-runtime`                                                     |
| `requireRegisteredProvider`                          | Verifique se uma coleção de provedores contém um id. Importe de `plugin-sdk/plugin-test-runtime`                                                   |
| `createRuntimeEnv`                                   | Crie um ambiente simulado de tempo de execução da CLI/plugin. Importe de `plugin-sdk/plugin-test-runtime`                                          |
| `createPluginSetupWizardStatus`                      | Crie helpers de status de configuração para plugins de canal. Importe de `plugin-sdk/plugin-test-runtime`                                          |
| `describeOpenAIProviderRuntimeContract`              | Instale verificações de contrato de tempo de execução da família de provedores. Importe de `plugin-sdk/provider-test-contracts`                    |
| `expectPassthroughReplayPolicy`                      | Verifique se as políticas de replay do provedor repassam ferramentas e metadados pertencentes ao provedor. Importe de `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Execute um teste ao vivo de provedor STT em tempo real com artefatos de áudio compartilhados. Importe de `plugin-sdk/provider-test-contracts`      |
| `normalizeTranscriptForMatch`                        | Normalize a saída de transcrição ao vivo antes de asserções aproximadas. Importe de `plugin-sdk/provider-test-contracts`                           |
| `expectExplicitVideoGenerationCapabilities`          | Verifique se provedores de vídeo declaram capacidades explícitas de modo de geração. Importe de `plugin-sdk/provider-test-contracts`               |
| `expectExplicitMusicGenerationCapabilities`          | Verifique se provedores de música declaram capacidades explícitas de geração/edição. Importe de `plugin-sdk/provider-test-contracts`               |
| `mockSuccessfulDashscopeVideoTask`                   | Instale uma resposta bem-sucedida de tarefa de vídeo compatível com DashScope. Importe de `plugin-sdk/provider-test-contracts`                     |
| `getProviderHttpMocks`                               | Acesse simulações Vitest opcionais de HTTP/autenticação do provedor. Importe de `plugin-sdk/provider-http-test-mocks`                              |
| `installProviderHttpMockCleanup`                     | Redefina simulações de HTTP/autenticação do provedor após cada teste. Importe de `plugin-sdk/provider-http-test-mocks`                             |
| `installCommonResolveTargetErrorCases`               | Casos de teste compartilhados para tratamento de erro de resolução de destino. Importe de `plugin-sdk/channel-target-testing`                      |
| `shouldAckReaction`                                  | Verifique se um canal deve adicionar uma reação de confirmação. Importe de `plugin-sdk/channel-feedback`                                           |
| `removeAckReactionAfterReply`                        | Remova a reação de confirmação após a entrega da resposta. Importe de `plugin-sdk/channel-feedback`                                                |
| `createTestRegistry`                                 | Crie um artefato de teste de registro de plugins de canal. Importe de `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`        |
| `createEmptyPluginRegistry`                          | Crie um artefato de teste de registro de plugins vazio. Importe de `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`           |
| `setActivePluginRegistry`                            | Instale um artefato de teste de registro para testes de tempo de execução de plugins. Importe de `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Capture solicitações fetch JSON em testes de helpers de mídia. Importe de `plugin-sdk/test-env`                                                   |
| `withServer`                                         | Execute testes contra um servidor HTTP local descartável. Importe de `plugin-sdk/test-env`                                                        |
| `createMockIncomingRequest`                          | Crie um objeto mínimo de solicitação HTTP recebida. Importe de `plugin-sdk/test-env`                                                               |
| `withFetchPreconnect`                                | Execute testes de fetch com hooks de pré-conexão instalados. Importe de `plugin-sdk/test-env`                                                     |
| `withEnv` / `withEnvAsync`                           | Ajuste variáveis de ambiente temporariamente. Importe de `plugin-sdk/test-env`                                                                     |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crie artefatos de teste isolados do sistema de arquivos. Importe de `plugin-sdk/test-env`                                                         |
| `createMockServerResponse`                           | Crie uma simulação mínima de resposta de servidor HTTP. Importe de `plugin-sdk/test-env`                                                          |
| `createCliRuntimeCapture`                            | Capture a saída do tempo de execução da CLI em testes. Importe de `plugin-sdk/test-fixtures`                                                       |
| `importFreshModule`                                  | Importe um módulo ESM com um token de consulta novo para ignorar o cache de módulos. Importe de `plugin-sdk/test-fixtures`                         |
| `bundledPluginRoot` / `bundledPluginFile`            | Resolva caminhos de artefatos de teste de origem ou dist de plugins empacotados. Importe de `plugin-sdk/test-fixtures`                             |
| `mockNodeBuiltinModule`                              | Instale simulações Vitest restritas de módulos integrados do Node. Importe de `plugin-sdk/test-node-mocks`                                         |
| `createSandboxTestContext`                           | Crie contextos de teste de sandbox. Importe de `plugin-sdk/test-fixtures`                                                                          |
| `writeSkill`                                         | Escreva artefatos de teste de Skills. Importe de `plugin-sdk/test-fixtures`                                                                        |
| `makeAgentAssistantMessage`                          | Crie artefatos de teste de mensagens de transcrição do agente. Importe de `plugin-sdk/test-fixtures`                                               |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecione e redefina artefatos de teste de eventos do sistema. Importe de `plugin-sdk/test-fixtures`                                              |
| `sanitizeTerminalText`                               | Sanitize a saída do terminal para asserções. Importe de `plugin-sdk/test-fixtures`                                                                 |
| `countLines` / `hasBalancedFences`                   | Verifique o formato da saída de fragmentação. Importe de `plugin-sdk/test-fixtures`                                                                |
| `runProviderCatalog`                                 | Execute um hook de catálogo de provedores com dependências de teste                                                                                |
| `resolveProviderWizardOptions`                       | Resolva escolhas do assistente de configuração do provedor em testes de contrato                                                                   |
| `resolveProviderModelPickerEntries`                  | Resolva entradas do seletor de modelos do provedor em testes de contrato                                                                           |
| `buildProviderPluginMethodChoice`                    | Crie ids de escolhas do assistente do provedor para asserções                                                                                      |
| `setProviderWizardProvidersResolverForTest`          | Injete provedores do assistente do provedor para testes isolados                                                                                   |
| `createProviderUsageFetch`                           | Criar fixtures de busca de uso do provedor                                                                                               |
| `useFrozenTime` / `useRealTime`                      | Congelar e restaurar temporizadores para testes sensíveis ao tempo. Importe de `plugin-sdk/test-env`                                     |
| `createTestWizardPrompter`                           | Criar um prompter simulado do assistente de configuração                                                                                 |
| `createRuntimeTaskFlow`                              | Criar estado isolado de task-flow de runtime                                                                                             |
| `typedCases`                                         | Preservar tipos literais para testes orientados por tabelas. Importe de `plugin-sdk/test-fixtures`                                       |

As suítes de contrato de Plugins incluídos também usam subcaminhos de teste do SDK para
auxiliares exclusivos de teste de registry, manifesto, artefato público e fixture de runtime.
Suítes exclusivas do core que dependem do inventário do OpenClaw incluído permanecem em `src/plugins/contracts`.
Mantenha novos testes de extensão em um subcaminho focado e documentado do SDK, como
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` ou `plugin-sdk/test-fixtures`, em vez de importar diretamente o
barrel amplo de compatibilidade `plugin-sdk/testing`, arquivos `src/**` do repo ou pontes
`test/helpers/*` do repo.

### Tipos

Subcaminhos de teste focados também reexportam tipos úteis em arquivos de teste:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Resolução de alvo de teste

Use `installCommonResolveTargetErrorCases` para adicionar casos de erro padrão para
resolução de alvo de canal:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Padrões de teste

### Testando contratos de registro

Testes unitários que passam um mock `api` escrito manualmente para `register(api)` não exercitam
os gates de aceitação do loader do OpenClaw. Adicione pelo menos um teste de fumaça apoiado pelo loader
para cada superfície de registro da qual seu Plugin depende, especialmente hooks e
capacidades exclusivas, como memória.

O loader real falha o registro do Plugin quando metadados obrigatórios estão ausentes ou um
Plugin chama uma API de capacidade que não possui. Por exemplo,
`api.registerHook(...)` exige um nome de hook, e
`api.registerMemoryCapability(...)` exige que o manifesto do Plugin ou a entrada exportada
declare `kind: "memory"`.

### Testando acesso à configuração de runtime

Prefira o mock compartilhado de runtime de Plugin de `openclaw/plugin-sdk/channel-test-helpers`
ao testar Plugins de canal incluídos. Seus mocks obsoletos `runtime.config.loadConfig()` e
`runtime.config.writeConfigFile(...)` lançam erro por padrão para que os testes capturem novos
usos de APIs de compatibilidade. Sobrescreva esses mocks somente quando o teste estiver
cobrindo explicitamente comportamento de compatibilidade legado.

### Testando unitariamente um Plugin de canal

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Testando unitariamente um Plugin de provedor

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Fazendo mock do runtime do Plugin

Para código que usa `createPluginRuntimeStore`, faça mock do runtime nos testes:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### Testando com stubs por instância

Prefira stubs por instância em vez de mutação de protótipo:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testes de contrato (Plugins no repo)

Plugins incluídos têm testes de contrato que verificam a propriedade de registro:

```bash
pnpm test -- src/plugins/contracts/
```

Esses testes validam:

- Quais Plugins registram quais provedores
- Quais Plugins registram quais provedores de fala
- Correção do formato de registro
- Conformidade com o contrato de runtime

### Executando testes com escopo

Para um Plugin específico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Somente para testes de contrato:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Aplicação de lint (Plugins no repo)

Três regras são aplicadas por `pnpm check` para Plugins no repo:

1. **Sem imports monolíticos da raiz** -- o barrel raiz `openclaw/plugin-sdk` é rejeitado
2. **Sem imports diretos de `src/`** -- Plugins não podem importar `../../src/` diretamente
3. **Sem autoimports** -- Plugins não podem importar seu próprio subcaminho `plugin-sdk/<name>`

Plugins externos não estão sujeitos a essas regras de lint, mas é recomendado seguir os mesmos
padrões.

## Configuração de teste

O OpenClaw usa Vitest com limites de cobertura V8. Para testes de Plugin:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Se execuções locais causarem pressão de memória:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) -- convenções de importação
- [Plugins de canal do SDK](/pt-BR/plugins/sdk-channel-plugins) -- interface de Plugin de canal
- [Plugins de provedor do SDK](/pt-BR/plugins/sdk-provider-plugins) -- hooks de Plugin de provedor
- [Criando Plugins](/pt-BR/plugins/building-plugins) -- guia de primeiros passos
