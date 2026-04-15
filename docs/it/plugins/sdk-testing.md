---
read_when:
    - Stai scrivendo test per un Plugin
    - Hai bisogno di utilità di test dall'SDK del Plugin
    - Vuoi comprendere i test di contratto per i plugin inclusi
sidebarTitle: Testing
summary: Utilità e modelli di test per i plugin di OpenClaw
title: Test dei Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f75bd3f3b5ba34b05786e0dd96d493c36db73a1d258998bf589e27e45c0bd09
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Test dei Plugin

Riferimento per utilità di test, modelli e applicazione del lint per i
plugin di OpenClaw.

<Tip>
  **Cerchi esempi di test?** Le guide pratiche includono esempi di test completi:
  [Test dei plugin di canale](/it/plugins/sdk-channel-plugins#step-6-test) e
  [Test dei plugin provider](/it/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilità di test

**Importazione:** `openclaw/plugin-sdk/testing`

Il sottopercorso di test esporta un insieme ristretto di helper per gli autori di plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Esportazioni disponibili

| Esportazione                          | Scopo                                                  |
| ------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Casi di test condivisi per la gestione degli errori di risoluzione della destinazione |
| `shouldAckReaction`                    | Verifica se un canale deve aggiungere una reazione di conferma |
| `removeAckReactionAfterReply`          | Rimuove la reazione di conferma dopo la consegna della risposta |

### Tipi

Il sottopercorso di test riesporta anche tipi utili nei file di test:

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

## Testare la risoluzione della destinazione

Usa `installCommonResolveTargetErrorCases` per aggiungere casi di errore standard per
la risoluzione della destinazione del canale:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

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

## Modelli di test

### Test unitari di un plugin di canale

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

### Test unitari di un plugin provider

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

### Simulare il runtime del plugin

Per il codice che usa `createPluginRuntimeStore`, simula il runtime nei test:

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
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### Testare con stub per istanza

Preferisci stub per istanza invece della mutazione del prototipo:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Test di contratto (plugin nel repository)

I plugin inclusi hanno test di contratto che verificano la proprietà della registrazione:

```bash
pnpm test -- src/plugins/contracts/
```

Questi test verificano:

- Quali plugin registrano quali provider
- Quali plugin registrano quali provider vocali
- La correttezza della forma della registrazione
- La conformità al contratto di runtime

### Eseguire test mirati

Per un plugin specifico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Solo per i test di contratto:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Applicazione del lint (plugin nel repository)

Tre regole sono applicate da `pnpm check` per i plugin nel repository:

1. **Nessuna importazione monolitica dalla root** -- il barrel root `openclaw/plugin-sdk` viene rifiutato
2. **Nessuna importazione diretta da `src/`** -- i plugin non possono importare `../../src/` direttamente
3. **Nessuna auto-importazione** -- i plugin non possono importare il proprio sottopercorso `plugin-sdk/<name>`

I plugin esterni non sono soggetti a queste regole di lint, ma è consigliato seguire gli stessi
modelli.

## Configurazione dei test

OpenClaw usa Vitest con soglie di copertura V8. Per i test dei plugin:

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

Se le esecuzioni locali causano pressione sulla memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview) -- convenzioni di importazione
- [Plugin di canale SDK](/it/plugins/sdk-channel-plugins) -- interfaccia dei plugin di canale
- [Plugin provider SDK](/it/plugins/sdk-provider-plugins) -- hook dei plugin provider
- [Creare plugin](/it/plugins/building-plugins) -- guida introduttiva
