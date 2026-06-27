---
read_when:
    - Anda sedang menulis pengujian untuk sebuah Plugin
    - Anda memerlukan utilitas pengujian dari SDK plugin
    - Anda ingin memahami pengujian kontrak untuk Plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk Plugin OpenClaw
title: Pengujian Plugin
x-i18n:
    generated_at: "2026-06-27T18:00:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referensi untuk utilitas pengujian, pola, dan penegakan lint untuk Plugin
OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan cara kerja menyertakan contoh pengujian lengkap:
  [Pengujian Plugin channel](/id/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian Plugin provider](/id/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

Subpath pembantu pengujian ini adalah entrypoint sumber lokal repo untuk pengujian
Plugin bawaan OpenClaw sendiri. Subpath ini bukan ekspor paket untuk Plugin pihak ketiga, dan
dapat mengimpor Vitest atau dependensi pengujian lain yang hanya ada di repo.

**Impor mock API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Impor kontrak runtime agen:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Impor kontrak channel:** `openclaw/plugin-sdk/channel-contract-testing`

**Impor pembantu pengujian channel:** `openclaw/plugin-sdk/channel-test-helpers`

**Impor pengujian target channel:** `openclaw/plugin-sdk/channel-target-testing`

**Impor kontrak Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Impor pengujian runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Impor kontrak provider:** `openclaw/plugin-sdk/provider-test-contracts`

**Impor mock HTTP provider:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Impor pengujian lingkungan/jaringan:** `openclaw/plugin-sdk/test-env`

**Impor fixture generik:** `openclaw/plugin-sdk/test-fixtures`

**Impor mock bawaan Node:** `openclaw/plugin-sdk/test-node-mocks`

Di dalam repo OpenClaw, utamakan subpath terfokus di bawah ini untuk pengujian
Plugin bawaan baru. Barrel luas
`openclaw/plugin-sdk/testing` hanya untuk kompatibilitas lama.
Guardrail repo menolak impor nyata baru dari `plugin-sdk/testing` dan
`plugin-sdk/test-utils`; nama-nama tersebut tetap ada hanya sebagai permukaan
kompatibilitas yang sudah usang untuk pengujian catatan kompatibilitas.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### Ekspor yang tersedia

| Ekspor                                               | Tujuan                                                                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Bangun mock API plugin minimal untuk pengujian unit pendaftaran langsung. Impor dari `plugin-sdk/plugin-test-api`                                    |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture kontrak profil auth bersama untuk adapter runtime agent native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                         |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture kontrak supresi pengiriman bersama untuk adapter runtime agent native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                  |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture kontrak klasifikasi fallback bersama untuk adapter runtime agent native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                |
| `createParameterFreeTool`                            | Bangun fixture skema dynamic-tool untuk pengujian kontrak runtime native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                       |
| `expectChannelInboundContextContract`                | Tegaskan bentuk konteks inbound channel. Impor dari `plugin-sdk/channel-contract-testing`                                                            |
| `installChannelOutboundPayloadContractSuite`         | Instal kasus kontrak payload outbound channel. Impor dari `plugin-sdk/channel-contract-testing`                                                      |
| `createStartAccountContext`                          | Bangun konteks siklus hidup akun channel. Impor dari `plugin-sdk/channel-test-helpers`                                                               |
| `installChannelActionsContractSuite`                 | Instal kasus kontrak action pesan channel generik. Impor dari `plugin-sdk/channel-test-helpers`                                                      |
| `installChannelSetupContractSuite`                   | Instal kasus kontrak setup channel generik. Impor dari `plugin-sdk/channel-test-helpers`                                                             |
| `installChannelStatusContractSuite`                  | Instal kasus kontrak status channel generik. Impor dari `plugin-sdk/channel-test-helpers`                                                            |
| `expectDirectoryIds`                                 | Tegaskan id direktori channel dari fungsi daftar direktori. Impor dari `plugin-sdk/channel-test-helpers`                                             |
| `assertBundledChannelEntries`                        | Tegaskan entrypoint channel bawaan mengekspos kontrak publik yang diharapkan. Impor dari `plugin-sdk/channel-test-helpers`                           |
| `formatEnvelopeTimestamp`                            | Format timestamp envelope deterministik. Impor dari `plugin-sdk/channel-test-helpers`                                                                |
| `expectPairingReplyText`                             | Tegaskan teks balasan pairing channel dan ekstrak kodenya. Impor dari `plugin-sdk/channel-test-helpers`                                              |
| `describePluginRegistrationContract`                 | Instal pemeriksaan kontrak pendaftaran plugin. Impor dari `plugin-sdk/plugin-test-contracts`                                                         |
| `registerSingleProviderPlugin`                       | Daftarkan satu plugin provider dalam pengujian smoke loader. Impor dari `plugin-sdk/plugin-test-runtime`                                             |
| `registerProviderPlugin`                             | Tangkap semua jenis provider dari satu plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                           |
| `registerProviderPlugins`                            | Tangkap pendaftaran provider di beberapa plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                         |
| `requireRegisteredProvider`                          | Tegaskan bahwa koleksi provider berisi sebuah id. Impor dari `plugin-sdk/plugin-test-runtime`                                                        |
| `createRuntimeEnv`                                   | Bangun lingkungan runtime CLI/plugin yang di-mock. Impor dari `plugin-sdk/plugin-test-runtime`                                                       |
| `createPluginSetupWizardStatus`                      | Bangun helper status setup untuk plugin channel. Impor dari `plugin-sdk/plugin-test-runtime`                                                         |
| `describeOpenAIProviderRuntimeContract`              | Instal pemeriksaan kontrak runtime keluarga provider. Impor dari `plugin-sdk/provider-test-contracts`                                                |
| `expectPassthroughReplayPolicy`                      | Tegaskan kebijakan replay provider meneruskan tools dan metadata milik provider. Impor dari `plugin-sdk/provider-test-contracts`                     |
| `runRealtimeSttLiveTest`                             | Jalankan pengujian provider STT realtime live dengan fixture audio bersama. Impor dari `plugin-sdk/provider-test-contracts`                          |
| `normalizeTranscriptForMatch`                        | Normalisasi output transkrip live sebelum assertion fuzzy. Impor dari `plugin-sdk/provider-test-contracts`                                           |
| `expectExplicitVideoGenerationCapabilities`          | Tegaskan provider video mendeklarasikan kapabilitas mode generasi eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                         |
| `expectExplicitMusicGenerationCapabilities`          | Tegaskan provider musik mendeklarasikan kapabilitas generasi/edit eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                         |
| `mockSuccessfulDashscopeVideoTask`                   | Instal respons tugas video yang berhasil dan kompatibel dengan DashScope. Impor dari `plugin-sdk/provider-test-contracts`                            |
| `getProviderHttpMocks`                               | Akses mock Vitest HTTP/auth provider opt-in. Impor dari `plugin-sdk/provider-http-test-mocks`                                                        |
| `installProviderHttpMockCleanup`                     | Reset mock HTTP/auth provider setelah setiap pengujian. Impor dari `plugin-sdk/provider-http-test-mocks`                                             |
| `installCommonResolveTargetErrorCases`               | Kasus pengujian bersama untuk penanganan error resolusi target. Impor dari `plugin-sdk/channel-target-testing`                                       |
| `shouldAckReaction`                                  | Periksa apakah channel harus menambahkan reaksi ack. Impor dari `plugin-sdk/channel-feedback`                                                        |
| `removeAckReactionAfterReply`                        | Hapus reaksi ack setelah pengiriman balasan. Impor dari `plugin-sdk/channel-feedback`                                                                |
| `createTestRegistry`                                 | Bangun fixture registry plugin channel. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                           |
| `createEmptyPluginRegistry`                          | Bangun fixture registry plugin kosong. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                            |
| `setActivePluginRegistry`                            | Instal fixture registry untuk pengujian runtime plugin. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`           |
| `createRequestCaptureJsonFetch`                      | Tangkap permintaan fetch JSON dalam pengujian helper media. Impor dari `plugin-sdk/test-env`                                                         |
| `withServer`                                         | Jalankan pengujian terhadap server HTTP lokal sekali pakai. Impor dari `plugin-sdk/test-env`                                                         |
| `createMockIncomingRequest`                          | Bangun objek permintaan HTTP masuk minimal. Impor dari `plugin-sdk/test-env`                                                                         |
| `withFetchPreconnect`                                | Jalankan pengujian fetch dengan hook preconnect terinstal. Impor dari `plugin-sdk/test-env`                                                         |
| `withEnv` / `withEnvAsync`                           | Patch variabel lingkungan untuk sementara. Impor dari `plugin-sdk/test-env`                                                                          |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Buat fixture pengujian filesystem terisolasi. Impor dari `plugin-sdk/test-env`                                                                       |
| `createMockServerResponse`                           | Buat mock respons server HTTP minimal. Impor dari `plugin-sdk/test-env`                                                                              |
| `createCliRuntimeCapture`                            | Tangkap output runtime CLI dalam pengujian. Impor dari `plugin-sdk/test-fixtures`                                                                    |
| `importFreshModule`                                  | Impor modul ESM dengan token query baru untuk melewati cache modul. Impor dari `plugin-sdk/test-fixtures`                                           |
| `bundledPluginRoot` / `bundledPluginFile`            | Resolve path fixture sumber atau dist plugin bawaan. Impor dari `plugin-sdk/test-fixtures`                                                          |
| `mockNodeBuiltinModule`                              | Instal mock Vitest bawaan Node yang sempit. Impor dari `plugin-sdk/test-node-mocks`                                                                  |
| `createSandboxTestContext`                           | Bangun konteks pengujian sandbox. Impor dari `plugin-sdk/test-fixtures`                                                                              |
| `writeSkill`                                         | Tulis fixture skill. Impor dari `plugin-sdk/test-fixtures`                                                                                          |
| `makeAgentAssistantMessage`                          | Bangun fixture pesan transkrip agent. Impor dari `plugin-sdk/test-fixtures`                                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspeksi dan reset fixture event sistem. Impor dari `plugin-sdk/test-fixtures`                                                                       |
| `sanitizeTerminalText`                               | Sanitasi output terminal untuk assertion. Impor dari `plugin-sdk/test-fixtures`                                                                      |
| `countLines` / `hasBalancedFences`                   | Tegaskan bentuk output chunking. Impor dari `plugin-sdk/test-fixtures`                                                                               |
| `runProviderCatalog`                                 | Jalankan hook katalog provider dengan dependensi pengujian                                                                                           |
| `resolveProviderWizardOptions`                       | Resolve pilihan wizard setup provider dalam pengujian kontrak                                                                                        |
| `resolveProviderModelPickerEntries`                  | Resolve entri model-picker provider dalam pengujian kontrak                                                                                          |
| `buildProviderPluginMethodChoice`                    | Bangun id pilihan wizard provider untuk assertion                                                                                                    |
| `setProviderWizardProvidersResolverForTest`          | Suntikkan provider wizard provider untuk pengujian terisolasi                                                                                        |
| `createProviderUsageFetch`                           | Buat fixture pengambilan penggunaan provider                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Bekukan dan pulihkan timer untuk pengujian yang sensitif terhadap waktu. Impor dari `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Buat prompter wizard penyiapan tiruan                                                                                                     |
| `createRuntimeTaskFlow`                              | Buat state task-flow runtime terisolasi                                                                                                  |
| `typedCases`                                         | Pertahankan tipe literal untuk pengujian berbasis tabel. Impor dari `plugin-sdk/test-fixtures`                                                    |

Rangkaian kontrak Plugin terbundel juga menggunakan subpath pengujian SDK untuk helper
registri, manifes, artefak publik, dan fixture runtime yang hanya untuk pengujian. Rangkaian
khusus core yang bergantung pada inventaris OpenClaw terbundel tetap berada di bawah `src/plugins/contracts`.
Tempatkan pengujian ekstensi baru pada subpath SDK terfokus yang terdokumentasi seperti
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures`, bukan mengimpor barrel
kompatibilitas `plugin-sdk/testing` yang luas, file repo `src/**`, atau bridge repo
`test/helpers/*` secara langsung.

### Tipe

Subpath pengujian terfokus juga mengekspor ulang tipe yang berguna dalam file pengujian:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Resolusi target pengujian

Gunakan `installCommonResolveTargetErrorCases` untuk menambahkan kasus kesalahan standar untuk
resolusi target channel:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

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

### Menguji kontrak pendaftaran

Pengujian unit yang meneruskan mock `api` buatan tangan ke `register(api)` tidak menjalankan
gerbang penerimaan loader OpenClaw. Tambahkan setidaknya satu pengujian smoke berbasis loader
untuk setiap permukaan pendaftaran yang menjadi dependensi Plugin Anda, terutama hook dan
kapabilitas eksklusif seperti memory.

Loader asli menggagalkan pendaftaran Plugin ketika metadata wajib tidak ada atau sebuah
Plugin memanggil API kapabilitas yang bukan miliknya. Misalnya,
`api.registerHook(...)` memerlukan nama hook, dan
`api.registerMemoryCapability(...)` memerlukan manifes Plugin atau entri yang diekspor
untuk mendeklarasikan `kind: "memory"`.

### Menguji akses konfigurasi runtime

Utamakan mock runtime Plugin bersama dari `openclaw/plugin-sdk/channel-test-helpers`
saat menguji Plugin channel terbundel. Mock `runtime.config.loadConfig()` dan
`runtime.config.writeConfigFile(...)` miliknya yang sudah usang akan melempar secara default
sehingga pengujian menangkap penggunaan baru API kompatibilitas. Override mock tersebut hanya
ketika pengujian secara eksplisit mencakup perilaku kompatibilitas legacy.

### Menguji unit Plugin channel

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

### Menguji unit Plugin provider

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

### Membuat mock runtime Plugin

Untuk kode yang menggunakan `createPluginRuntimeStore`, buat mock runtime dalam pengujian:

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
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### Menguji dengan stub per instance

Utamakan stub per instance daripada mutasi prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pengujian kontrak (Plugin dalam repo)

Plugin terbundel memiliki pengujian kontrak yang memverifikasi kepemilikan pendaftaran:

```bash
pnpm test -- src/plugins/contracts/
```

Pengujian ini memastikan:

- Plugin mana yang mendaftarkan provider mana
- Plugin mana yang mendaftarkan provider speech mana
- Kebenaran bentuk pendaftaran
- Kepatuhan kontrak runtime

### Menjalankan pengujian terbatas

Untuk Plugin tertentu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Khusus untuk pengujian kontrak:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Penegakan lint (Plugin dalam repo)

Tiga aturan diberlakukan oleh `pnpm check` untuk Plugin dalam repo:

1. **Tidak ada impor root monolitik** -- barrel root `openclaw/plugin-sdk` ditolak
2. **Tidak ada impor `src/` langsung** -- Plugin tidak dapat mengimpor `../../src/` secara langsung
3. **Tidak ada impor mandiri** -- Plugin tidak dapat mengimpor subpath `plugin-sdk/<name>` miliknya sendiri

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi mengikuti pola yang sama
tetap direkomendasikan.

## Konfigurasi pengujian

OpenClaw menggunakan Vitest dengan ambang cakupan V8. Untuk pengujian Plugin:

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
- [Plugin Channel SDK](/id/plugins/sdk-channel-plugins) -- antarmuka Plugin channel
- [Plugin Provider SDK](/id/plugins/sdk-provider-plugins) -- hook Plugin provider
- [Membangun Plugin](/id/plugins/building-plugins) -- panduan memulai
