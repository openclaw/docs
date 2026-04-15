---
read_when:
    - Bir plugin için testler yazıyorsunuz
    - Plugin SDK'den test yardımcı programlarına ihtiyacınız var
    - Paketlenmiş plugin'ler için sözleşme testlerini anlamak istiyorsunuz
sidebarTitle: Testing
summary: OpenClaw Plugin'leri için test yardımcı programları ve kalıpları
title: Plugin Testi
x-i18n:
    generated_at: "2026-04-15T19:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f75bd3f3b5ba34b05786e0dd96d493c36db73a1d258998bf589e27e45c0bd09
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Plugin Testi

OpenClaw plugin'leri için test yardımcı programları, kalıpları ve lint zorlamasına ilişkin başvuru.

<Tip>
  **Test örnekleri mi arıyorsunuz?** Nasıl yapılır kılavuzları, üzerinde çalışılmış test örnekleri içerir:
  [Kanal plugin testleri](/tr/plugins/sdk-channel-plugins#step-6-test) ve
  [Sağlayıcı plugin testleri](/tr/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test yardımcı programları

**İçe aktarma:** `openclaw/plugin-sdk/testing`

Testing alt yolu, plugin yazarları için dar kapsamlı bir yardımcı kümesi dışa aktarır:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Kullanılabilir dışa aktarımlar

| Dışa aktarma                         | Amaç                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Hedef çözümleme hata işleme için paylaşılan test durumları |
| `shouldAckReaction`                  | Bir kanalın ack tepkisi ekleyip eklememesi gerektiğini kontrol eder |
| `removeAckReactionAfterReply`        | Yanıt tesliminden sonra ack tepkisini kaldırır         |

### Türler

Testing alt yolu ayrıca test dosyalarında kullanışlı türleri yeniden dışa aktarır:

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

## Hedef çözümlemeyi test etme

Kanal hedef çözümlemesi için standart hata durumlarını eklemek üzere `installCommonResolveTargetErrorCases` kullanın:

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

## Test kalıpları

### Bir kanal plugin'ini birim testi ile test etme

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

### Bir sağlayıcı plugin'ini birim testi ile test etme

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

### Plugin çalışma zamanını mock'lama

`createPluginRuntimeStore` kullanan kodlar için testlerde çalışma zamanını mock'layın:

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

### Örnek başına stub'larla test etme

Prototype mutasyonu yerine örnek başına stub'ları tercih edin:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Sözleşme testleri (repo içi plugin'ler)

Paketlenmiş plugin'lerde kayıt sahipliğini doğrulayan sözleşme testleri vardır:

```bash
pnpm test -- src/plugins/contracts/
```

Bu testler şunları doğrular:

- Hangi plugin'lerin hangi sağlayıcıları kaydettiğini
- Hangi plugin'lerin hangi konuşma sağlayıcılarını kaydettiğini
- Kayıt şeklinin doğruluğunu
- Çalışma zamanı sözleşmesine uyumluluğu

### Kapsamlı testleri çalıştırma

Belirli bir plugin için:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Yalnızca sözleşme testleri için:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint zorlaması (repo içi plugin'ler)

Repo içi plugin'ler için `pnpm check` tarafından üç kural zorlanır:

1. **Monolitik kök içe aktarmalar yok** -- `openclaw/plugin-sdk` kök barrel reddedilir
2. **Doğrudan `src/` içe aktarmaları yok** -- plugin'ler `../../src/` yolunu doğrudan içe aktaramaz
3. **Kendini içe aktarma yok** -- plugin'ler kendi `plugin-sdk/<name>` alt yolunu içe aktaramaz

Harici plugin'ler bu lint kurallarına tabi değildir, ancak aynı kalıpların izlenmesi önerilir.

## Test yapılandırması

OpenClaw, V8 kapsam eşikleriyle birlikte Vitest kullanır. Plugin testleri için:

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

Yerel çalıştırmalar bellek baskısına neden olursa:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview) -- içe aktarma kuralları
- [SDK Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) -- kanal plugin arayüzü
- [SDK Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) -- sağlayıcı plugin hook'ları
- [Plugin Oluşturma](/tr/plugins/building-plugins) -- başlangıç kılavuzu
