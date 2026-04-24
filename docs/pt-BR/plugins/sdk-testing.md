---
read_when:
    - Você está escrevendo testes para um Plugin
    - Você precisa de utilitários de teste do SDK de Plugin
    - Você quer entender testes de contrato para Plugins empacotados
sidebarTitle: Testing
summary: Utilitários e padrões de teste para Plugins do OpenClaw
title: Teste de Plugin
x-i18n:
    generated_at: "2026-04-24T06:05:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Referência para utilitários de teste, padrões e aplicação de lint para Plugins do OpenClaw.

<Tip>
  **Está procurando exemplos de teste?** Os guias práticos incluem exemplos completos de teste:
  [Channel plugin tests](/pt-BR/plugins/sdk-channel-plugins#step-6-test) e
  [Provider plugin tests](/pt-BR/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitários de teste

**Import:** `openclaw/plugin-sdk/testing`

O subcaminho de teste exporta um conjunto reduzido de helpers para autores de Plugins:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Exports disponíveis

| Export                                 | Finalidade                                            |
| -------------------------------------- | ----------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Casos de teste compartilhados para tratamento de erro de resolução de alvo |
| `shouldAckReaction`                    | Verifica se um canal deve adicionar uma reação de confirmação |
| `removeAckReactionAfterReply`          | Remove a reação de confirmação após a entrega da resposta |

### Tipos

O subcaminho de teste também reexporta tipos úteis em arquivos de teste:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
  OpenClawConfig,
  PluginRuntime,
  RuntimeEnv,
  MockFn,
} from "openclaw/plugin-sdk/testing";
```

## Testando resolução de alvo

Use `installCommonResolveTargetErrorCases` para adicionar casos de erro padrão para
resolução de alvo do canal:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("resolução de alvo do my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Lógica de resolução de alvo do seu canal
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Adicione casos de teste específicos do canal
  it("deve resolver alvos @username", () => {
    // ...
  });
});
```

## Padrões de teste

### Testando uma unidade de um Plugin de canal

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("deve resolver conta a partir da configuração", () => {
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

### Testando uma unidade de um Plugin de provedor

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

  it("deve retornar catálogo quando a chave de API estiver disponível", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contexto
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Simulando o runtime do Plugin

Para código que usa `createPluginRuntimeStore`, simule o runtime nos testes:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// Na configuração do teste
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... outros mocks
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... outros namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Após os testes
store.clearRuntime();
```

### Testando com stubs por instância

Prefira stubs por instância em vez de mutação de prototype:

```typescript
// Preferido: stub por instância
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Evite: mutação de prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testes de contrato (Plugins no repositório)

Plugins empacotados têm testes de contrato que verificam a propriedade do registro:

```bash
pnpm test -- src/plugins/contracts/
```

Esses testes verificam:

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
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Aplicação de lint (Plugins no repositório)

Três regras são aplicadas por `pnpm check` para Plugins no repositório:

1. **Sem imports monolíticos da raiz** -- o barrel raiz `openclaw/plugin-sdk` é rejeitado
2. **Sem imports diretos de `src/`** -- Plugins não podem importar `../../src/` diretamente
3. **Sem autoimports** -- Plugins não podem importar seu próprio subcaminho `plugin-sdk/<name>`

Plugins externos não estão sujeitos a essas regras de lint, mas seguir os mesmos
padrões é recomendado.

## Configuração de teste

O OpenClaw usa Vitest com limites de cobertura do V8. Para testes de Plugin:

```bash
# Executar todos os testes
pnpm test

# Executar testes de um Plugin específico
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Executar com filtro por nome de teste específico
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Executar com cobertura
pnpm test:coverage
```

Se execuções locais causarem pressão de memória:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Relacionados

- [SDK Overview](/pt-BR/plugins/sdk-overview) -- convenções de import
- [SDK Channel Plugins](/pt-BR/plugins/sdk-channel-plugins) -- interface de Plugin de canal
- [SDK Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) -- hooks de Plugin de provedor
- [Building Plugins](/pt-BR/plugins/building-plugins) -- guia de introdução
