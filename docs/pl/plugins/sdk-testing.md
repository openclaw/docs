---
read_when:
    - Piszesz testy dla pluginu
    - Potrzebujesz narzędzi testowych z Plugin SDK
    - Chcesz zrozumieć testy kontraktowe dla dołączonych pluginów
sidebarTitle: Testing
summary: Narzędzia testowe i wzorce dla pluginów OpenClaw
title: Testowanie pluginów
x-i18n:
    generated_at: "2026-04-05T14:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e95ed58ed180feadad17bb5138bd09e3b45f1f3ecdff4e2fba4874bb80099fe
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Testowanie pluginów

Referencja narzędzi testowych, wzorców i egzekwowania lint dla pluginów
OpenClaw.

<Tip>
  **Szukasz przykładów testów?** Przewodniki how-to zawierają gotowe przykłady testów:
  [Testy pluginów kanałowych](/plugins/sdk-channel-plugins#step-6-test) oraz
  [Testy pluginów providerów](/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Narzędzia testowe

**Import:** `openclaw/plugin-sdk/testing`

Ta ścieżka podrzędna do testowania eksportuje wąski zestaw helperów dla autorów pluginów:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Dostępne eksporty

| Export                                 | Purpose                                                |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Współdzielone przypadki testowe do obsługi błędów rozwiązywania celu |
| `shouldAckReaction`                    | Sprawdza, czy kanał powinien dodać reakcję ack     |
| `removeAckReactionAfterReply`          | Usuwa reakcję ack po dostarczeniu odpowiedzi               |

### Typy

Ścieżka podrzędna do testowania ponownie eksportuje też typy przydatne w plikach testowych:

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

## Testowanie rozwiązywania celu

Użyj `installCommonResolveTargetErrorCases`, aby dodać standardowe przypadki błędów dla
rozwiązywania celów kanału:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("rozwiązywanie celu my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logika rozwiązywania celu twojego kanału
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Dodaj przypadki testowe specyficzne dla kanału
  it("powinno rozwiązywać cele @username", () => {
    // ...
  });
});
```

## Wzorce testowania

### Testy jednostkowe pluginu kanałowego

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("powinien rozwiązać konto z config", () => {
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

  it("powinien sprawdzać konto bez materializowania sekretów", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Bez ujawniania wartości tokena
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Testy jednostkowe pluginu providera

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
  it("powinien rozwiązywać modele dynamiczne", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("powinien zwrócić katalog, gdy klucz API jest dostępny", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mockowanie runtime pluginu

Dla kodu używającego `createPluginRuntimeStore` mockuj runtime w testach:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

// W konfiguracji testu
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

// Po testach
store.clearRuntime();
```

### Testowanie z per-instance stubs

Preferuj stuby per instancja zamiast modyfikacji prototypu:

```typescript
// Preferowane: stub per instancja
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Unikaj: modyfikacji prototypu
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testy kontraktowe (pluginy w repozytorium)

Dołączone pluginy mają testy kontraktowe weryfikujące własność rejestracji:

```bash
pnpm test -- src/plugins/contracts/
```

Te testy sprawdzają:

- Które pluginy rejestrują które providery
- Które pluginy rejestrują których providerów mowy
- Poprawność kształtu rejestracji
- Zgodność z kontraktem runtime

### Uruchamianie testów zakresowych

Dla konkretnego pluginu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Tylko dla testów kontraktowych:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Egzekwowanie lint (pluginy w repozytorium)

`pnpm check` egzekwuje trzy reguły dla pluginów w repozytorium:

1. **Brak monolitycznych importów root** — root barrel `openclaw/plugin-sdk` jest odrzucany
2. **Brak bezpośrednich importów `src/`** — pluginy nie mogą importować bezpośrednio `../../src/`
3. **Brak self-imports** — pluginy nie mogą importować własnej ścieżki podrzędnej `plugin-sdk/<name>`

Zewnętrzne pluginy nie podlegają tym regułom lint, ale zaleca się stosowanie tych samych
wzorców.

## Konfiguracja testów

OpenClaw używa Vitest z progami pokrycia V8. Dla testów pluginów:

```bash
# Uruchom wszystkie testy
pnpm test

# Uruchom testy konkretnego pluginu
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Uruchom z filtrem konkretnej nazwy testu
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Uruchom z pokryciem
pnpm test:coverage
```

Jeśli lokalne przebiegi powodują presję pamięci:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Powiązane

- [Przegląd SDK](/plugins/sdk-overview) -- konwencje importu
- [SDK pluginów kanałowych](/plugins/sdk-channel-plugins) -- interfejs pluginów kanałowych
- [SDK pluginów providerów](/plugins/sdk-provider-plugins) -- hooki pluginów providerów
- [Tworzenie pluginów](/plugins/building-plugins) -- przewodnik na start
