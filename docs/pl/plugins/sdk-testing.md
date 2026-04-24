---
read_when:
    - Piszesz testy dla Pluginu
    - Potrzebujesz narzędzi testowych z SDK Pluginów
    - Chcesz zrozumieć testy kontraktowe dla dołączonych Pluginów
sidebarTitle: Testing
summary: Narzędzia testowe i wzorce dla Pluginów OpenClaw
title: Testowanie Pluginów
x-i18n:
    generated_at: "2026-04-24T09:25:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Dokumentacja narzędzi testowych, wzorców i wymuszania lint dla Pluginów OpenClaw.

<Tip>
  **Szukasz przykładów testów?** Przewodniki how-to zawierają gotowe przykłady testów:
  [Testy Pluginów kanałów](/pl/plugins/sdk-channel-plugins#step-6-test) oraz
  [Testy Pluginów providerów](/pl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Narzędzia testowe

**Import:** `openclaw/plugin-sdk/testing`

Subścieżka testing eksportuje wąski zestaw helperów dla autorów Pluginów:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Dostępne eksporty

| Eksport                                | Cel                                                   |
| -------------------------------------- | ----------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Współdzielone przypadki testowe dla obsługi błędów rozstrzygania celu |
| `shouldAckReaction`                    | Sprawdza, czy kanał powinien dodać reakcję ack        |
| `removeAckReactionAfterReply`          | Usuwa reakcję ack po dostarczeniu odpowiedzi          |

### Typy

Subścieżka testing re-eksportuje również typy przydatne w plikach testowych:

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

## Testowanie rozstrzygania celu

Użyj `installCommonResolveTargetErrorCases`, aby dodać standardowe przypadki błędów dla
rozstrzygania celu kanału:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logika rozstrzygania celu Twojego kanału
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Dodaj przypadki testowe specyficzne dla kanału
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Wzorce testowania

### Testy jednostkowe Pluginu kanału

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
    // Brak ujawnionej wartości tokenu
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Testy jednostkowe Pluginu providera

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... kontekst
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... kontekst
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mockowanie runtime Pluginu

Dla kodu używającego `createPluginRuntimeStore` mockuj runtime w testach:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// W konfiguracji testu
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... inne mocki
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... inne przestrzenie nazw
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Po testach
store.clearRuntime();
```

### Testowanie z użyciem stubów per instancja

Preferuj stuby per instancja zamiast mutacji prototypu:

```typescript
// Preferowane: stub per instancja
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Unikaj: mutacja prototypu
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testy kontraktowe (Pluginy w repozytorium)

Dołączone Pluginy mają testy kontraktowe, które weryfikują własność rejestracji:

```bash
pnpm test -- src/plugins/contracts/
```

Te testy sprawdzają:

- Które Pluginy rejestrują które providery
- Które Pluginy rejestrują które providery mowy
- Poprawność kształtu rejestracji
- Zgodność kontraktu runtime

### Uruchamianie testów zakresowych

Dla konkretnego Pluginu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Tylko dla testów kontraktowych:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Wymuszanie lint (Pluginy w repozytorium)

`pnpm check` wymusza trzy reguły dla Pluginów w repozytorium:

1. **Brak monolitycznych importów z root** — barrel root `openclaw/plugin-sdk` jest odrzucany
2. **Brak bezpośrednich importów `src/`** — Pluginy nie mogą bezpośrednio importować `../../src/`
3. **Brak self-importów** — Pluginy nie mogą importować własnej subścieżki `plugin-sdk/<name>`

Zewnętrzne Pluginy nie podlegają tym regułom lint, ale zaleca się stosowanie
tych samych wzorców.

## Konfiguracja testów

OpenClaw używa Vitest z progami pokrycia V8. Dla testów Pluginów:

```bash
# Uruchom wszystkie testy
pnpm test

# Uruchom testy konkretnego Pluginu
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Uruchom z filtrem konkretnej nazwy testu
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Uruchom z pokryciem
pnpm test:coverage
```

Jeśli lokalne uruchomienia powodują presję na pamięć:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview) -- konwencje importów
- [SDK Pluginy kanałów](/pl/plugins/sdk-channel-plugins) -- interfejs Pluginów kanałów
- [SDK Pluginy providerów](/pl/plugins/sdk-provider-plugins) -- hooki Pluginów providerów
- [Budowanie Pluginów](/pl/plugins/building-plugins) -- przewodnik na początek
