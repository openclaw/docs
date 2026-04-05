---
read_when:
    - Stai scrivendo test per un plugin
    - Hai bisogno delle utility di test dal Plugin SDK
    - Vuoi comprendere i test di contratto per i plugin inclusi
sidebarTitle: Testing
summary: Utility e pattern di test per i plugin OpenClaw
title: Test dei plugin
x-i18n:
    generated_at: "2026-04-05T14:00:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e95ed58ed180feadad17bb5138bd09e3b45f1f3ecdff4e2fba4874bb80099fe
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Test dei plugin

Riferimento per utility di test, pattern e applicazione del lint per i plugin
OpenClaw.

<Tip>
  **Cerchi esempi di test?** Le guide how-to includono esempi pratici di test:
  [Test dei plugin di canale](/plugins/sdk-channel-plugins#step-6-test) e
  [Test dei plugin provider](/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utility di test

**Import:** `openclaw/plugin-sdk/testing`

Il sottopercorso di test esporta un insieme ristretto di helper per gli autori di plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Export disponibili

| Export                                 | Scopo                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Casi di test condivisi per la gestione degli errori di risoluzione del target |
| `shouldAckReaction`                    | Controlla se un canale deve aggiungere una reazione di ack |
| `removeAckReactionAfterReply`          | Rimuove la reazione di ack dopo la consegna della risposta |

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

## Testare la risoluzione del target

Usa `installCommonResolveTargetErrorCases` per aggiungere casi di errore standard per la
risoluzione del target del canale:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("risoluzione del target my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logica di risoluzione del target del tuo canale
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Aggiungi casi di test specifici del canale
  it("dovrebbe risolvere i target @username", () => {
    // ...
  });
});
```

## Pattern di test

### Test unitario di un plugin di canale

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("dovrebbe risolvere l'account dalla configurazione", () => {
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

  it("dovrebbe ispezionare l'account senza materializzare i segreti", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Nessun valore del token esposto
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Test unitario di un plugin provider

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
  it("dovrebbe risolvere modelli dinamici", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... contesto
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("dovrebbe restituire il catalogo quando è disponibile una chiave API", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contesto
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mockare il runtime del plugin

Per il codice che usa `createPluginRuntimeStore`, effettua il mock del runtime nei test:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

// Nel setup del test
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... altri mock
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... altri namespace
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Dopo i test
store.clearRuntime();
```

### Testare con stub per istanza

Preferisci stub per istanza invece della mutazione del prototype:

```typescript
// Preferito: stub per istanza
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Da evitare: mutazione del prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Test di contratto (plugin nel repository)

I plugin inclusi hanno test di contratto che verificano la proprietà della registrazione:

```bash
pnpm test -- src/plugins/contracts/
```

Questi test verificano:

- Quali plugin registrano quali provider
- Quali plugin registrano quali provider speech
- Correttezza della forma di registrazione
- Conformità del contratto runtime

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

1. **Nessun import monolitico dalla root** -- il barrel root `openclaw/plugin-sdk` viene rifiutato
2. **Nessun import diretto da `src/`** -- i plugin non possono importare direttamente `../../src/`
3. **Nessun self-import** -- i plugin non possono importare il proprio sottopercorso `plugin-sdk/<name>`

I plugin esterni non sono soggetti a queste regole di lint, ma è comunque consigliato seguire gli stessi pattern.

## Configurazione dei test

OpenClaw usa Vitest con soglie di copertura V8. Per i test dei plugin:

```bash
# Esegui tutti i test
pnpm test

# Esegui test di plugin specifici
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Esegui con un filtro sul nome del test specifico
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Esegui con copertura
pnpm test:coverage
```

Se le esecuzioni locali causano pressione sulla memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Correlati

- [Panoramica SDK](/plugins/sdk-overview) -- convenzioni di importazione
- [SDK Channel Plugins](/plugins/sdk-channel-plugins) -- interfaccia dei plugin di canale
- [SDK Provider Plugins](/plugins/sdk-provider-plugins) -- hook dei plugin provider
- [Creare plugin](/plugins/building-plugins) -- guida introduttiva
