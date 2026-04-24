---
read_when:
    - Stai scrivendo test per un Plugin
    - Ti servono utilità di test dall'SDK del Plugin
    - Vuoi capire i test di contratto per i Plugin inclusi
sidebarTitle: Testing
summary: Utilità e pattern di test per i Plugin OpenClaw
title: Testing dei Plugin
x-i18n:
    generated_at: "2026-04-24T08:54:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Riferimento per utilità di test, pattern e applicazione del lint per i Plugin
OpenClaw.

<Tip>
  **Cerchi esempi di test?** Le guide pratiche includono esempi completi di test:
  [Test dei Plugin di canale](/it/plugins/sdk-channel-plugins#step-6-test) e
  [Test dei Plugin provider](/it/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilità di test

**Import:** `openclaw/plugin-sdk/testing`

Il sottopercorso testing esporta un insieme ristretto di helper per gli autori di Plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Export disponibili

| Export | Scopo |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Casi di test condivisi per la gestione degli errori di risoluzione del target |
| `shouldAckReaction` | Controlla se un canale deve aggiungere una reazione ack |
| `removeAckReactionAfterReply` | Rimuove la reazione ack dopo la consegna della risposta |

### Tipi

Il sottopercorso testing riesporta anche tipi utili nei file di test:

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

Usa `installCommonResolveTargetErrorCases` per aggiungere casi di errore standard per
la risoluzione del target del canale:

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

### Unit testing di un Plugin di canale

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

  it("dovrebbe ispezionare l'account senza materializzare segreti", () => {
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

### Unit testing di un Plugin provider

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

  it("dovrebbe restituire il catalogo quando la chiave API è disponibile", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contesto
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mock del runtime del Plugin

Per codice che usa `createPluginRuntimeStore`, esegui il mock del runtime nei test:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// Nella configurazione del test
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

### Test con stub per istanza

Preferisci stub per istanza invece della mutazione del prototipo:

```typescript
// Preferito: stub per istanza
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Evita: mutazione del prototipo
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Test di contratto (Plugin nel repository)

I Plugin inclusi hanno test di contratto che verificano la proprietà della registrazione:

```bash
pnpm test -- src/plugins/contracts/
```

Questi test verificano:

- Quali Plugin registrano quali provider
- Quali Plugin registrano quali provider speech
- Correttezza della forma della registrazione
- Conformità al contratto runtime

### Esecuzione di test con ambito ristretto

Per un Plugin specifico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Solo per i test di contratto:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Applicazione del lint (Plugin nel repository)

Tre regole sono applicate da `pnpm check` per i Plugin nel repository:

1. **Nessun import root monolitico** -- il barrel root `openclaw/plugin-sdk` viene rifiutato
2. **Nessun import diretto da `src/`** -- i Plugin non possono importare direttamente `../../src/`
3. **Nessun self-import** -- i Plugin non possono importare il proprio sottopercorso `plugin-sdk/<name>`

I Plugin esterni non sono soggetti a queste regole lint, ma è consigliato seguire
gli stessi pattern.

## Configurazione dei test

OpenClaw usa Vitest con soglie di coverage V8. Per i test dei Plugin:

```bash
# Esegui tutti i test
pnpm test

# Esegui i test di un Plugin specifico
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Esegui con un filtro per nome di test specifico
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Esegui con coverage
pnpm test:coverage
```

Se le esecuzioni locali causano pressione sulla memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Correlati

- [SDK Overview](/it/plugins/sdk-overview) -- convenzioni di importazione
- [SDK Channel Plugins](/it/plugins/sdk-channel-plugins) -- interfaccia dei Plugin di canale
- [SDK Provider Plugins](/it/plugins/sdk-provider-plugins) -- hook dei Plugin provider
- [Building Plugins](/it/plugins/building-plugins) -- guida introduttiva
