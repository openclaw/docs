---
read_when:
    - Anda sedang menulis pengujian untuk sebuah plugin
    - Anda memerlukan utilitas pengujian dari Plugin SDK
    - Anda ingin memahami contract test untuk plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk plugin OpenClaw
title: Pengujian Plugin
x-i18n:
    generated_at: "2026-04-05T14:02:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e95ed58ed180feadad17bb5138bd09e3b45f1f3ecdff4e2fba4874bb80099fe
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Pengujian Plugin

Referensi untuk utilitas pengujian, pola, dan penegakan lint untuk plugin OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan cara menyertakan contoh pengujian yang lengkap:
  [Pengujian plugin channel](/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian plugin provider](/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

**Import:** `openclaw/plugin-sdk/testing`

Subpath pengujian mengekspor sekumpulan helper yang sempit untuk penulis plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Ekspor yang tersedia

| Ekspor                                 | Tujuan                                                  |
| -------------------------------------- | ------------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Kasus pengujian bersama untuk penanganan error resolusi target |
| `shouldAckReaction`                    | Memeriksa apakah sebuah channel harus menambahkan reaksi ack |
| `removeAckReactionAfterReply`          | Menghapus reaksi ack setelah pengiriman balasan         |

### Tipe

Subpath pengujian juga mengekspor ulang tipe yang berguna di file pengujian:

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
resolusi target channel:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("resolusi target my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logika resolusi target channel Anda
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Tambahkan kasus pengujian khusus channel
  it("harus me-resolve target @username", () => {
    // ...
  });
});
```

## Pola pengujian

### Unit test plugin channel

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("harus me-resolve akun dari konfigurasi", () => {
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

  it("harus memeriksa akun tanpa mematerialisasikan secret", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Tidak ada nilai token yang diekspos
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Unit test plugin provider

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
  it("harus me-resolve model dinamis", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("harus mengembalikan katalog saat API key tersedia", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mock runtime plugin

Untuk kode yang menggunakan `createPluginRuntimeStore`, mock runtime dalam pengujian:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

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

### Menguji dengan stub per instance

Utamakan stub per instance daripada mutasi prototype:

```typescript
// Disarankan: stub per instance
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Hindari: mutasi prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Contract test (plugin dalam repo)

Plugin bawaan memiliki contract test yang memverifikasi kepemilikan registrasi:

```bash
pnpm test -- src/plugins/contracts/
```

Pengujian ini menegaskan:

- Plugin mana yang mendaftarkan provider tertentu
- Plugin mana yang mendaftarkan provider speech tertentu
- Kebenaran bentuk registrasi
- Kepatuhan kontrak runtime

### Menjalankan pengujian terarah

Untuk plugin tertentu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Untuk contract test saja:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Penegakan lint (plugin dalam repo)

Tiga aturan diberlakukan oleh `pnpm check` untuk plugin dalam repo:

1. **Tidak boleh import root monolitik** -- root barrel `openclaw/plugin-sdk` ditolak
2. **Tidak boleh import `src/` langsung** -- plugin tidak boleh mengimpor `../../src/` secara langsung
3. **Tidak boleh self-import** -- plugin tidak boleh mengimpor subpath `plugin-sdk/<name>` miliknya sendiri

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi mengikuti pola yang sama
tetap direkomendasikan.

## Konfigurasi pengujian

OpenClaw menggunakan Vitest dengan ambang cakupan V8. Untuk pengujian plugin:

```bash
# Jalankan semua pengujian
pnpm test

# Jalankan pengujian plugin tertentu
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Jalankan dengan filter nama pengujian tertentu
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Jalankan dengan cakupan
pnpm test:coverage
```

Jika run lokal menyebabkan tekanan memori:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Terkait

- [SDK Overview](/plugins/sdk-overview) -- konvensi import
- [SDK Channel Plugins](/plugins/sdk-channel-plugins) -- antarmuka plugin channel
- [SDK Provider Plugins](/plugins/sdk-provider-plugins) -- hook plugin provider
- [Building Plugins](/plugins/building-plugins) -- panduan memulai
