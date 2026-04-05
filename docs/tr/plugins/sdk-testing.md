---
read_when:
    - Bir plugin için test yazarken
    - plugin SDK'dan test yardımcılarına ihtiyaç duyduğunuzda
    - paketlenmiş plugin'ler için sözleşme testlerini anlamak istediğinizde
sidebarTitle: Testing
summary: OpenClaw plugin'leri için test yardımcıları ve kalıpları
title: Plugin Testleri
x-i18n:
    generated_at: "2026-04-05T14:02:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e95ed58ed180feadad17bb5138bd09e3b45f1f3ecdff4e2fba4874bb80099fe
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Plugin Testleri

OpenClaw plugin'leri için test yardımcıları, kalıplar ve lint zorunluluğuna
ilişkin başvuru.

<Tip>
  **Test örnekleri mi arıyorsunuz?** Nasıl yapılır kılavuzları, işlenmiş test örnekleri içerir:
  [Channel plugin testleri](/plugins/sdk-channel-plugins#step-6-test) ve
  [Provider plugin testleri](/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test yardımcıları

**İçe aktarma:** `openclaw/plugin-sdk/testing`

Testing alt yolu, plugin yazarları için dar bir yardımcı kümesi dışa aktarır:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Kullanılabilir dışa aktarımlar

| Dışa aktarım                           | Amaç                                                  |
| -------------------------------------- | ----------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Hedef çözümleme hata işleme için paylaşılan test durumları |
| `shouldAckReaction`                    | Bir kanalın ack reaction ekleyip eklememesi gerektiğini denetler |
| `removeAckReactionAfterReply`          | Yanıt tesliminden sonra ack reaction'ı kaldırır       |

### Türler

Testing alt yolu, test dosyalarında yararlı olan türleri de yeniden dışa aktarır:

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

Kanal hedef çözümlemesi için standart hata durumları eklemek üzere
`installCommonResolveTargetErrorCases` kullanın:

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

### Bir channel plugin'ini birim testiyle test etme

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
    // Hiçbir token değeri açığa çıkarılmaz
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Bir provider plugin'ini birim testiyle test etme

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

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

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

### Örnek başına stub'larla test etme

Prototype mutation yerine örnek başına stub'ları tercih edin:

```typescript
// Tercih edilen: örnek başına stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Kaçının: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Sözleşme testleri (repo içi plugin'ler)

Paketlenmiş plugin'lerin, kayıt sahipliğini doğrulayan sözleşme testleri vardır:

```bash
pnpm test -- src/plugins/contracts/
```

Bu testler şunları doğrular:

- Hangi plugin'lerin hangi provider'ları kaydettiği
- Hangi plugin'lerin hangi speech provider'larını kaydettiği
- Kayıt şeklinin doğruluğu
- Çalışma zamanı sözleşmesine uyumluluk

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

## Lint zorunluluğu (repo içi plugin'ler)

Repo içi plugin'ler için `pnpm check` tarafından üç kural zorunlu tutulur:

1. **Monolitik kök içe aktarımları yok** -- `openclaw/plugin-sdk` kök barrel reddedilir
2. **Doğrudan `src/` içe aktarımları yok** -- plugin'ler `../../src/` yolunu doğrudan içe aktaramaz
3. **Kendi kendine içe aktarma yok** -- plugin'ler kendi `plugin-sdk/<name>` alt yolunu içe aktaramaz

Harici plugin'ler bu lint kurallarına tabi değildir, ancak aynı kalıpların
izlenmesi önerilir.

## Test yapılandırması

OpenClaw, V8 kapsam eşikleriyle Vitest kullanır. Plugin testleri için:

```bash
# Tüm testleri çalıştır
pnpm test

# Belirli plugin testlerini çalıştır
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Belirli bir test adı filtresiyle çalıştır
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Kapsamla birlikte çalıştır
pnpm test:coverage
```

Yerel çalıştırmalar bellek baskısına neden olursa:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## İlgili

- [SDK Genel Bakış](/plugins/sdk-overview) -- içe aktarma kuralları
- [SDK Channel Plugins](/plugins/sdk-channel-plugins) -- channel plugin arabirimi
- [SDK Provider Plugins](/plugins/sdk-provider-plugins) -- provider plugin hook'ları
- [Plugin Geliştirme](/plugins/building-plugins) -- başlangıç kılavuzu
