---
read_when:
    - Bir Plugin için test yazıyorsunuz
    - Plugin SDK’den test yardımcılarına ihtiyacınız var
    - Paketlenmiş Plugin’ler için sözleşme testlerini anlamak istiyorsunuz
sidebarTitle: Testing
summary: OpenClaw Plugin’leri için test yardımcıları ve kalıpları
title: Plugin testi
x-i18n:
    generated_at: "2026-04-24T09:23:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

OpenClaw Plugin’leri için test yardımcıları, kalıplar ve lint zorlaması için başvuru.

<Tip>
  **Test örnekleri mi arıyorsunuz?** Nasıl yapılır kılavuzları, üzerinde çalışılmış test örnekleri içerir:
  [Kanal Plugin testleri](/tr/plugins/sdk-channel-plugins#step-6-test) ve
  [Sağlayıcı Plugin testleri](/tr/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test yardımcıları

**İçe aktarma:** `openclaw/plugin-sdk/testing`

Testing alt yolu, Plugin yazarları için dar bir yardımcı kümesi dışa aktarır:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Kullanılabilir dışa aktarımlar

| Dışa aktarma                           | Amaç                                                   |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Hedef çözümleme hata işleme için paylaşılan test durumları |
| `shouldAckReaction`                    | Bir kanalın ack reaction ekleyip eklememesi gerektiğini denetle |
| `removeAckReactionAfterReply`          | Yanıt tesliminden sonra ack reaction’ı kaldır          |

### Türler

Testing alt yolu ayrıca test dosyalarında kullanışlı türleri de yeniden dışa aktarır:

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

Kanal hedef çözümlemesi için standart hata durumları eklemek üzere `installCommonResolveTargetErrorCases` kullanın:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Kanalınızın hedef çözümleme mantığı
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Kanala özgü test durumları ekleyin
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Test kalıpları

### Bir kanal Plugin’ini birim testiyle test etme

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
    // Token değeri açığa çıkarılmaz
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Bir sağlayıcı Plugin’ini birim testiyle test etme

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... bağlam
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... bağlam
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin çalışma zamanını taklit etme

`createPluginRuntimeStore` kullanan kod için testlerde çalışma zamanını taklit edin:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// Test kurulumu içinde
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... diğer taklitler
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... diğer ad alanları
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Testlerden sonra
store.clearRuntime();
```

### Örnek-başı stub’larla test etme

Prototype değişikliği yerine örnek-başı stub’ları tercih edin:

```typescript
// Tercih edilen: örnek-başı stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Kaçının: prototype değişikliği
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Sözleşme testleri (repo içi Plugin’ler)

Paketlenmiş Plugin’lerin, kayıt sahipliğini doğrulayan sözleşme testleri vardır:

```bash
pnpm test -- src/plugins/contracts/
```

Bu testler şunları doğrular:

- Hangi Plugin’lerin hangi sağlayıcıları kaydettiği
- Hangi Plugin’lerin hangi konuşma sağlayıcılarını kaydettiği
- Kayıt şeklinin doğruluğu
- Çalışma zamanı sözleşmesine uyum

### Kapsamlı testleri çalıştırma

Belirli bir Plugin için:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Yalnızca sözleşme testleri için:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint zorlaması (repo içi Plugin’ler)

Repo içi Plugin’ler için `pnpm check` tarafından üç kural zorlanır:

1. **Monolitik kök içe aktarmaları yok** -- `openclaw/plugin-sdk` kök barrel’ı reddedilir
2. **Doğrudan `src/` içe aktarmaları yok** -- Plugin’ler `../../src/` yolunu doğrudan içe aktaramaz
3. **Kendine içe aktarma yok** -- Plugin’ler kendi `plugin-sdk/<name>` alt yolunu içe aktaramaz

Harici Plugin’ler bu lint kurallarına tabi değildir, ancak aynı kalıpların izlenmesi önerilir.

## Test yapılandırması

OpenClaw, V8 kapsam eşikleriyle Vitest kullanır. Plugin testleri için:

```bash
# Tüm testleri çalıştır
pnpm test

# Belirli Plugin testlerini çalıştır
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Belirli bir test adı filtresiyle çalıştır
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Kapsamla çalıştır
pnpm test:coverage
```

Yerel çalıştırmalar bellek baskısına neden olursa:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## İlgili

- [SDK Overview](/tr/plugins/sdk-overview) -- içe aktarma kuralları
- [SDK Channel Plugins](/tr/plugins/sdk-channel-plugins) -- kanal Plugin arayüzü
- [SDK Provider Plugins](/tr/plugins/sdk-provider-plugins) -- sağlayıcı Plugin kancaları
- [Building Plugins](/tr/plugins/building-plugins) -- başlangıç kılavuzu
