---
read_when:
    - Anda sedang menulis pengujian untuk sebuah plugin
    - Anda memerlukan utilitas pengujian dari Plugin SDK
    - Anda ingin memahami pengujian kontrak untuk plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk plugin OpenClaw
title: Pengujian plugin
x-i18n:
    generated_at: "2026-04-24T09:21:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Referensi untuk utilitas pengujian, pola, dan penegakan lint untuk plugin OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan cara kerja menyertakan contoh pengujian yang dikerjakan:
  [Pengujian plugin saluran](/id/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian plugin provider](/id/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

**Impor:** `openclaw/plugin-sdk/testing`

Subpath testing mengekspor sekumpulan helper sempit untuk penulis plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Ekspor yang tersedia

| Ekspor                                 | Tujuan                                                 |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Kasus pengujian bersama untuk penanganan error resolusi target |
| `shouldAckReaction`                    | Periksa apakah suatu saluran harus menambahkan ack reaction |
| `removeAckReactionAfterReply`          | Hapus ack reaction setelah pengiriman balasan          |

### Tipe

Subpath testing juga mengekspor ulang tipe yang berguna dalam file pengujian:

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

## Menguji resolusi target

Gunakan `installCommonResolveTargetErrorCases` untuk menambahkan kasus error standar untuk
resolusi target saluran:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logika resolusi target saluran Anda
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Tambahkan kasus pengujian khusus saluran
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Pola pengujian

### Menguji unit plugin saluran

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
    // Tidak ada nilai token yang terekspos
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Menguji unit plugin provider

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

### Memock runtime plugin

Untuk kode yang menggunakan `createPluginRuntimeStore`, mock runtime dalam pengujian:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// Dalam setup pengujian
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... mock lainnya
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... namespace lainnya
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Setelah pengujian
store.clearRuntime();
```

### Menguji dengan stub per-instance

Utamakan stub per-instance daripada mutasi prototype:

```typescript
// Direkomendasikan: stub per-instance
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Hindari: mutasi prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pengujian kontrak (plugin dalam repo)

Plugin bawaan memiliki pengujian kontrak yang memverifikasi kepemilikan registrasi:

```bash
pnpm test -- src/plugins/contracts/
```

Pengujian ini memverifikasi:

- Plugin mana yang mendaftarkan provider mana
- Plugin mana yang mendaftarkan provider speech mana
- Kebenaran bentuk registrasi
- Kepatuhan kontrak runtime

### Menjalankan pengujian terarah

Untuk plugin tertentu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Hanya untuk pengujian kontrak:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Penegakan lint (plugin dalam repo)

Tiga aturan ditegakkan oleh `pnpm check` untuk plugin dalam repo:

1. **Tidak ada impor root monolitik** -- root barrel `openclaw/plugin-sdk` ditolak
2. **Tidak ada impor `src/` langsung** -- plugin tidak boleh mengimpor `../../src/` secara langsung
3. **Tidak ada self-import** -- plugin tidak boleh mengimpor subpath `plugin-sdk/<name>` miliknya sendiri

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi mengikuti pola yang sama tetap direkomendasikan.

## Konfigurasi pengujian

OpenClaw menggunakan Vitest dengan ambang coverage V8. Untuk pengujian plugin:

```bash
# Jalankan semua pengujian
pnpm test

# Jalankan pengujian plugin tertentu
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Jalankan dengan filter nama pengujian tertentu
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Jalankan dengan coverage
pnpm test:coverage
```

Jika eksekusi lokal menyebabkan tekanan memori:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) -- konvensi impor
- [Plugin Saluran SDK](/id/plugins/sdk-channel-plugins) -- antarmuka plugin saluran
- [Plugin Provider SDK](/id/plugins/sdk-provider-plugins) -- hook plugin provider
- [Membangun Plugin](/id/plugins/building-plugins) -- panduan memulai
