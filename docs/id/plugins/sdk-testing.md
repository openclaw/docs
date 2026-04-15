---
read_when:
    - Anda sedang menulis pengujian untuk sebuah plugin
    - Anda memerlukan utilitas pengujian dari Plugin SDK
    - Anda ingin memahami pengujian kontrak untuk plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk plugin OpenClaw
title: Pengujian Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f75bd3f3b5ba34b05786e0dd96d493c36db73a1d258998bf589e27e45c0bd09
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Pengujian Plugin

Referensi untuk utilitas pengujian, pola, dan penegakan lint untuk plugin
OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan cara melakukannya mencakup contoh pengujian yang lengkap:
  [Pengujian plugin channel](/id/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian plugin provider](/id/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

**Impor:** `openclaw/plugin-sdk/testing`

Subpath pengujian mengekspor sekumpulan helper yang ringkas untuk penulis plugin:

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
| `installCommonResolveTargetErrorCases` | Kasus pengujian bersama untuk penanganan kesalahan resolusi target |
| `shouldAckReaction`                    | Memeriksa apakah sebuah channel harus menambahkan reaksi ack |
| `removeAckReactionAfterReply`          | Menghapus reaksi ack setelah balasan dikirimkan        |

### Tipe

Subpath pengujian juga mengekspor ulang tipe yang berguna dalam file pengujian:

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

Gunakan `installCommonResolveTargetErrorCases` untuk menambahkan kasus kesalahan standar untuk
resolusi target channel:

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

## Pola pengujian

### Pengujian unit untuk plugin channel

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

### Pengujian unit untuk plugin provider

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

### Pengujian dengan stub per instance

Utamakan stub per instance dibanding mutasi prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pengujian kontrak (plugin dalam repo)

Plugin bawaan memiliki pengujian kontrak yang memverifikasi kepemilikan pendaftaran:

```bash
pnpm test -- src/plugins/contracts/
```

Pengujian ini menegaskan:

- Plugin mana yang mendaftarkan provider tertentu
- Plugin mana yang mendaftarkan provider speech tertentu
- Kebenaran bentuk pendaftaran
- Kepatuhan kontrak runtime

### Menjalankan pengujian terbatas

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

1. **Tidak ada impor root yang monolitik** -- root barrel `openclaw/plugin-sdk` ditolak
2. **Tidak ada impor `src/` langsung** -- plugin tidak dapat mengimpor `../../src/` secara langsung
3. **Tidak ada self-import** -- plugin tidak dapat mengimpor subpath `plugin-sdk/<name>` miliknya sendiri

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi mengikuti pola yang sama
tetap direkomendasikan.

## Konfigurasi pengujian

OpenClaw menggunakan Vitest dengan ambang cakupan V8. Untuk pengujian plugin:

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

Jika proses lokal menyebabkan tekanan memori:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) -- konvensi impor
- [Plugin Channel SDK](/id/plugins/sdk-channel-plugins) -- antarmuka plugin channel
- [Plugin Provider SDK](/id/plugins/sdk-provider-plugins) -- hook plugin provider
- [Membangun Plugin](/id/plugins/building-plugins) -- panduan memulai
