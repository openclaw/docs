---
read_when:
    - Você está escrevendo testes para um plugin
    - Você precisa dos utilitários de teste do SDK de plugins
    - Você quer entender os testes de contrato para plugins incluídos no pacote
sidebarTitle: Testing
summary: Utilitários e padrões de teste para plugins do OpenClaw
title: Testes de Plugin
x-i18n:
    generated_at: "2026-07-16T12:48:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referência para utilitários, padrões e aplicação de lint em testes de
plugins do OpenClaw.

<Tip>
  **Procurando exemplos de testes?** Os guias de instruções incluem exemplos práticos de testes:
  [Testes de plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-6-test) e
  [Testes de plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitários de teste

Estes subcaminhos são pontos de entrada de código-fonte locais do repositório para os testes dos
plugins incluídos no próprio OpenClaw. Eles não são exports `package.json` publicados para
plugins de terceiros e podem importar o Vitest ou outras dependências de teste exclusivas do repositório.

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

Use estes subcaminhos específicos para testes de plugins incluídos. O barrel
`openclaw/plugin-sdk/testing` anterior era local do repositório, foi excluído dos
pacotes distribuídos e foi removido. O alias legado `openclaw/plugin-sdk/test-utils`
permanece local do repositório; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) rejeita novas importações desse alias em testes
de extensões.

### Exports disponíveis

| Exportação                                               | Finalidade                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Cria um mock mínimo da API de Plugin para testes unitários de registro direto. Importe de `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture compartilhada do contrato de perfil de autenticação para adaptadores nativos de runtime de agente. Importe de `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture compartilhada do contrato de supressão de entrega para adaptadores nativos de runtime de agente. Importe de `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture compartilhada do contrato de classificação de fallback para adaptadores nativos de runtime de agente. Importe de `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Cria fixtures de esquema de ferramentas dinâmicas para testes de contrato de runtime nativo. Importe de `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Valida o formato do contexto de entrada do canal. Importe de `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Instala casos de contrato de payload de saída do canal. Importe de `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Cria contextos de ciclo de vida de contas do canal. Importe de `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Instala casos de contrato genéricos de ações de mensagem do canal. Importe de `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Instala casos de contrato genéricos de configuração do canal. Importe de `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Instala casos de contrato genéricos de status do canal. Importe de `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Valida os ids do diretório do canal usando uma função de listagem de diretório. Importe de `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Valida se os pontos de entrada de canais integrados expõem o contrato público esperado. Importe de `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Formata timestamps determinísticos de envelopes. Importe de `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Valida o texto da resposta de pareamento do canal e extrai seu código. Importe de `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Instala verificações do contrato de registro de plugins. Importe de `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Registra um Plugin de provedor em testes rápidos do carregador. Importe de `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Captura todos os tipos de provedor de um Plugin. Importe de `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Captura registros de provedores em vários plugins. Importe de `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Valida se uma coleção de provedores contém um id. Importe de `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Cria um ambiente simulado de runtime de CLI/Plugin. Importe de `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Cria uma superfície simulada de runtime de Plugin. Importe de `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Cria auxiliares de status de configuração para plugins de canal. Importe de `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Cria um solicitador simulado do assistente de configuração. Importe de `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Cria um estado isolado de TaskFlow do runtime. Importe de `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Executa um hook de catálogo de provedores com dependências de teste. Importe de `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Resolve opções do assistente de configuração do provedor em testes de contrato. Importe de `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Resolve entradas do seletor de modelos do provedor em testes de contrato. Importe de `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Cria ids de opções do assistente de provedor para validações. Importe de `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Injeta provedores do assistente de provedor para testes isolados. Importe de `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Instala verificações de contrato de runtime da família de provedores. Importe de `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Valida se as políticas de replay do provedor são repassadas às ferramentas e aos metadados pertencentes ao provedor. Importe de `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Executa um teste ao vivo de provedor de STT em tempo real com fixtures de áudio compartilhadas. Importe de `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normaliza a saída de transcrição ao vivo antes de validações aproximadas. Importe de `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Valida se os provedores de vídeo declaram explicitamente os recursos de modo de geração. Importe de `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Valida se os provedores de música declaram explicitamente os recursos de geração/edição. Importe de `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Instala uma resposta bem-sucedida de tarefa de vídeo compatível com DashScope. Importe de `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Acessa mocks Vitest opcionais de HTTP/autenticação do provedor. Importe de `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Redefine os mocks de HTTP/autenticação do provedor após cada teste. Importe de `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Casos de teste compartilhados para tratamento de erros na resolução de destino. Importe de `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Verifica se um canal deve adicionar uma reação de confirmação. Importe de `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Remove a reação de confirmação após a entrega da resposta. Importe de `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Cria uma fixture de registro de plugins de canal. Importe de `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Cria uma fixture de registro de plugins vazio. Importe de `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Instala uma fixture de registro para testes de runtime de plugins. Importe de `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Captura solicitações fetch de JSON em testes de auxiliares de mídia. Importe de `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Executa testes em um servidor HTTP local descartável. Importe de `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Cria um objeto mínimo de solicitação HTTP de entrada. Importe de `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Executa testes de fetch com hooks de pré-conexão instalados. Importe de `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Modifica temporariamente variáveis de ambiente. Importe de `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Cria fixtures isoladas de teste do sistema de arquivos. Importe de `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Cria um mock mínimo de resposta de servidor HTTP. Importe de `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Cria fixtures de busca de uso do provedor. Importe de `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Congela e restaura temporizadores para testes sensíveis ao tempo. Importe de `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Captura a saída do runtime da CLI em testes. Importe de `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importa um módulo ESM com um novo token de consulta para ignorar o cache de módulos. Importe de `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Resolve caminhos de fixtures de origem ou distribuição de plugins integrados. Importe de `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Instala mocks Vitest restritos de módulos integrados do Node. Importe de `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Cria contextos de teste de sandbox. Importe de `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Grava fixtures de Skills. Importe de `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Cria fixtures de mensagens de transcrição do agente. Importe de `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspeciona e redefine fixtures de eventos do sistema. Importe de `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Sanitiza a saída do terminal para validações. Importe de `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Valida o formato da saída de divisão em blocos. Importe de `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Preserva tipos literais para testes orientados por tabela. Importe de `plugin-sdk/test-fixtures`                                                    |

Os conjuntos de contratos de plugins integrados também usam esses subcaminhos de teste do SDK para
auxiliares de fixtures de registro, manifesto, artefatos públicos e runtime exclusivos de teste.
Os conjuntos exclusivos do núcleo que dependem do inventário integrado do OpenClaw permanecem em
`src/plugins/contracts`.

### Tipos

Subcaminhos de teste específicos também reexportam tipos úteis em arquivos de teste:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Teste da resolução de destinos

Use `installCommonResolveTargetErrorCases` para adicionar casos de erro padrão para a
resolução de destinos do canal:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("resolução de destinos do my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Lógica de resolução de destinos do seu canal
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Adicione casos de teste específicos do canal
  it("deve resolver destinos @username", () => {
    // ...
  });
});
```

## Padrões de teste

### Teste de contratos de registro

Testes de unidade que passam um mock `api` escrito manualmente para `register(api)` não
exercitam as verificações de aceitação do carregador do OpenClaw. Adicione pelo menos um
teste de fumaça apoiado pelo carregador para cada superfície de registro da qual seu plugin depende,
especialmente hooks e recursos exclusivos, como memória.

O carregador real causa falha no registro do plugin quando os metadados obrigatórios estão ausentes ou
um plugin chama uma API de recurso que não possui. Por exemplo,
`api.registerHook(...)` exige um nome de hook, e
`api.registerMemoryCapability(...)` exige que o manifesto do plugin ou a entrada
exportada declare `kind: "memory"`.

### Teste do acesso à configuração do runtime

Prefira o mock compartilhado do runtime do plugin de `openclaw/plugin-sdk/plugin-test-runtime`.
Seus mocks `runtime.config.loadConfig()` e `runtime.config.writeConfigFile(...)`
lançam erros por padrão para que os testes detectem novos usos de APIs de
compatibilidade obsoletas. Substitua esses mocks somente quando o teste estiver
cobrindo explicitamente o comportamento de compatibilidade legada.

### Teste de unidade de um plugin de canal

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("deve resolver a conta a partir da configuração", () => {
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

  it("deve inspecionar a conta sem materializar segredos", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Nenhum valor de token exposto
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Teste de unidade de um plugin de provedor

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
  it("deve resolver modelos dinâmicos", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... contexto
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("deve retornar o catálogo quando a chave de API estiver disponível", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contexto
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Simulação do runtime do plugin

Para código que usa `createPluginRuntimeStore`, simule o runtime nos testes:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "runtime de teste não definido",
});

// Na configuração do teste
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... outros mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... outros namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Após os testes
store.clearRuntime();
```

### Teste com stubs por instância

Prefira stubs por instância em vez de mutação do protótipo:

```typescript
// Preferencial: stub por instância
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Evite: mutação do protótipo
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testes de contrato (plugins no repositório)

Plugins integrados têm testes de contrato que verificam a propriedade do registro:

```bash
pnpm test src/plugins/contracts/
```

Esses testes verificam:

- Quais plugins registram quais provedores
- Quais plugins registram quais provedores de voz
- Correção da estrutura de registro
- Conformidade com o contrato do runtime

### Execução de testes com escopo

Para um plugin específico:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Somente para testes de contrato:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Aplicação de lint (plugins no repositório)

`scripts/run-additional-boundary-checks.mjs` executa um conjunto de verificações de limite de importação
`lint:plugins:*` na CI; cada uma também pode ser executada localmente de forma independente:

| Comando                                                        | Impõe                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Plugins integrados não podem importar o barrel raiz monolítico `openclaw/plugin-sdk`.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Arquivos de extensão de produção não podem importar diretamente a árvore `src/**` do repositório (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Arquivos de teste de extensão não podem importar `plugin-sdk/test-utils` nem outros auxiliares de teste exclusivos do núcleo. |

Plugins externos não estão sujeitos a essas regras de lint, mas é recomendável
seguir os mesmos padrões.

## Configuração de testes

O OpenClaw usa o Vitest 4 com relatórios informativos de cobertura V8. Para testes de plugins:

```bash
# Executar todos os testes
pnpm test

# Executar testes de um plugin específico
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Executar com um filtro de nome de teste específico
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Executar com cobertura
pnpm test:coverage
```

Se as execuções locais causarem pressão de memória:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) -- convenções de importação
- [Plugins de canal do SDK](/pt-BR/plugins/sdk-channel-plugins) -- interface de plugin de canal
- [Plugins de provedor do SDK](/pt-BR/plugins/sdk-provider-plugins) -- hooks de plugin de provedor
- [Criação de plugins](/pt-BR/plugins/building-plugins) -- guia de introdução
