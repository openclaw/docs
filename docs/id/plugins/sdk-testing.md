---
read_when:
    - Anda sedang menulis pengujian untuk sebuah Plugin
    - Anda memerlukan utilitas pengujian dari SDK Plugin
    - Anda ingin memahami pengujian kontrak untuk Plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk Plugin OpenClaw
title: Pengujian Plugin
x-i18n:
    generated_at: "2026-04-30T10:05:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referensi untuk utilitas pengujian, pola, dan penegakan lint untuk Plugin
OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan how-to menyertakan contoh pengujian yang sudah dikerjakan:
  [Pengujian Plugin saluran](/id/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian Plugin penyedia](/id/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

**Impor mock API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Impor kontrak runtime agen:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Impor kontrak saluran:** `openclaw/plugin-sdk/channel-contract-testing`

**Impor helper pengujian saluran:** `openclaw/plugin-sdk/channel-test-helpers`

**Impor pengujian target saluran:** `openclaw/plugin-sdk/channel-target-testing`

**Impor kontrak Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Impor pengujian runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Impor kontrak penyedia:** `openclaw/plugin-sdk/provider-test-contracts`

**Impor mock HTTP penyedia:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Impor pengujian lingkungan/jaringan:** `openclaw/plugin-sdk/test-env`

**Impor fixture generik:** `openclaw/plugin-sdk/test-fixtures`

**Impor mock bawaan Node:** `openclaw/plugin-sdk/test-node-mocks`

Pilih subpath terfokus di bawah ini untuk pengujian Plugin baru. Barrel luas
`openclaw/plugin-sdk/testing` hanya untuk kompatibilitas lama.
Guardrail repo menolak impor nyata baru dari `plugin-sdk/testing` dan
`plugin-sdk/test-utils`; nama-nama tersebut tetap ada hanya sebagai permukaan
kompatibilitas yang tidak digunakan lagi untuk Plugin eksternal dan pengujian catatan kompatibilitas.

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

| Ekspor                                              | Tujuan                                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                               | Bangun mock API Plugin minimal untuk pengujian unit pendaftaran langsung. Impor dari `plugin-sdk/plugin-test-api`                            |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                     | Fixture kontrak profil autentikasi bersama untuk adapter runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`           |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                | Fixture kontrak penekanan pengiriman bersama untuk adapter runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`         |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                 | Fixture kontrak klasifikasi fallback bersama untuk adapter runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`         |
| `createParameterFreeTool`                           | Bangun fixture skema alat dinamis untuk pengujian kontrak runtime native. Impor dari `plugin-sdk/agent-runtime-test-contracts`               |
| `expectChannelInboundContextContract`               | Tegaskan bentuk konteks masuk channel. Impor dari `plugin-sdk/channel-contract-testing`                                                       |
| `installChannelOutboundPayloadContractSuite`        | Pasang kasus kontrak payload keluar channel. Impor dari `plugin-sdk/channel-contract-testing`                                                  |
| `createStartAccountContext`                         | Bangun konteks siklus hidup akun channel. Impor dari `plugin-sdk/channel-test-helpers`                                                        |
| `installChannelActionsContractSuite`                | Pasang kasus kontrak tindakan pesan channel generik. Impor dari `plugin-sdk/channel-test-helpers`                                             |
| `installChannelSetupContractSuite`                  | Pasang kasus kontrak penyiapan channel generik. Impor dari `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelStatusContractSuite`                 | Pasang kasus kontrak status channel generik. Impor dari `plugin-sdk/channel-test-helpers`                                                     |
| `expectDirectoryIds`                                | Tegaskan id direktori channel dari fungsi daftar direktori. Impor dari `plugin-sdk/channel-test-helpers`                                      |
| `assertBundledChannelEntries`                       | Tegaskan entrypoint channel bawaan mengekspos kontrak publik yang diharapkan. Impor dari `plugin-sdk/channel-test-helpers`                   |
| `formatEnvelopeTimestamp`                           | Format timestamp amplop deterministik. Impor dari `plugin-sdk/channel-test-helpers`                                                           |
| `expectPairingReplyText`                            | Tegaskan teks balasan pairing channel dan ekstrak kodenya. Impor dari `plugin-sdk/channel-test-helpers`                                       |
| `describePluginRegistrationContract`                | Pasang pemeriksaan kontrak pendaftaran Plugin. Impor dari `plugin-sdk/plugin-test-contracts`                                                  |
| `registerSingleProviderPlugin`                      | Daftarkan satu Plugin penyedia dalam pengujian smoke loader. Impor dari `plugin-sdk/plugin-test-runtime`                                      |
| `registerProviderPlugin`                            | Tangkap semua jenis penyedia dari satu Plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                     |
| `registerProviderPlugins`                           | Tangkap pendaftaran penyedia di beberapa Plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                   |
| `requireRegisteredProvider`                         | Tegaskan bahwa koleksi penyedia berisi id. Impor dari `plugin-sdk/plugin-test-runtime`                                                        |
| `createRuntimeEnv`                                  | Bangun lingkungan runtime CLI/Plugin yang di-mock. Impor dari `plugin-sdk/plugin-test-runtime`                                                |
| `createPluginSetupWizardStatus`                     | Bangun helper status penyiapan untuk Plugin channel. Impor dari `plugin-sdk/plugin-test-runtime`                                              |
| `describeOpenAIProviderRuntimeContract`             | Pasang pemeriksaan kontrak runtime keluarga penyedia. Impor dari `plugin-sdk/provider-test-contracts`                                         |
| `expectPassthroughReplayPolicy`                     | Tegaskan kebijakan replay penyedia meneruskan alat dan metadata milik penyedia. Impor dari `plugin-sdk/provider-test-contracts`              |
| `runRealtimeSttLiveTest`                            | Jalankan pengujian penyedia STT realtime live dengan fixture audio bersama. Impor dari `plugin-sdk/provider-test-contracts`                  |
| `normalizeTranscriptForMatch`                       | Normalisasi keluaran transkrip live sebelum asersi fuzzy. Impor dari `plugin-sdk/provider-test-contracts`                                     |
| `expectExplicitVideoGenerationCapabilities`         | Tegaskan penyedia video mendeklarasikan kapabilitas mode generasi eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                 |
| `expectExplicitMusicGenerationCapabilities`         | Tegaskan penyedia musik mendeklarasikan kapabilitas generasi/edit eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                 |
| `mockSuccessfulDashscopeVideoTask`                  | Pasang respons tugas video yang berhasil dan kompatibel dengan DashScope. Impor dari `plugin-sdk/provider-test-contracts`                    |
| `getProviderHttpMocks`                              | Akses mock HTTP/autentikasi Vitest penyedia opt-in. Impor dari `plugin-sdk/provider-http-test-mocks`                                          |
| `installProviderHttpMockCleanup`                    | Reset mock HTTP/autentikasi penyedia setelah setiap pengujian. Impor dari `plugin-sdk/provider-http-test-mocks`                              |
| `installCommonResolveTargetErrorCases`              | Kasus pengujian bersama untuk penanganan kesalahan resolusi target. Impor dari `plugin-sdk/channel-target-testing`                           |
| `shouldAckReaction`                                 | Periksa apakah channel harus menambahkan reaksi ack. Impor dari `plugin-sdk/channel-feedback`                                                 |
| `removeAckReactionAfterReply`                       | Hapus reaksi ack setelah pengiriman balasan. Impor dari `plugin-sdk/channel-feedback`                                                         |
| `createTestRegistry`                                | Bangun fixture registri Plugin channel. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                   |
| `createEmptyPluginRegistry`                         | Bangun fixture registri Plugin kosong. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                    |
| `setActivePluginRegistry`                           | Pasang fixture registri untuk pengujian runtime Plugin. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                     | Tangkap permintaan fetch JSON dalam pengujian helper media. Impor dari `plugin-sdk/test-env`                                                  |
| `withServer`                                        | Jalankan pengujian terhadap server HTTP lokal sekali pakai. Impor dari `plugin-sdk/test-env`                                                  |
| `createMockIncomingRequest`                         | Bangun objek permintaan HTTP masuk minimal. Impor dari `plugin-sdk/test-env`                                                                  |
| `withFetchPreconnect`                               | Jalankan pengujian fetch dengan hook prapenyambungan terpasang. Impor dari `plugin-sdk/test-env`                                             |
| `withEnv` / `withEnvAsync`                          | Patch variabel lingkungan sementara. Impor dari `plugin-sdk/test-env`                                                                         |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Buat fixture pengujian sistem file terisolasi. Impor dari `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                          | Buat mock respons server HTTP minimal. Impor dari `plugin-sdk/test-env`                                                                       |
| `createCliRuntimeCapture`                           | Tangkap keluaran runtime CLI dalam pengujian. Impor dari `plugin-sdk/test-fixtures`                                                          |
| `importFreshModule`                                 | Impor modul ESM dengan token kueri baru untuk melewati cache modul. Impor dari `plugin-sdk/test-fixtures`                                    |
| `bundledPluginRoot` / `bundledPluginFile`           | Resolusi path fixture sumber atau dist Plugin bawaan. Impor dari `plugin-sdk/test-fixtures`                                                  |
| `mockNodeBuiltinModule`                             | Pasang mock Vitest bawaan Node yang sempit. Impor dari `plugin-sdk/test-node-mocks`                                                           |
| `createSandboxTestContext`                          | Bangun konteks pengujian sandbox. Impor dari `plugin-sdk/test-fixtures`                                                                       |
| `writeSkill`                                        | Tulis fixture skill. Impor dari `plugin-sdk/test-fixtures`                                                                                    |
| `makeAgentAssistantMessage`                         | Bangun fixture pesan transkrip agen. Impor dari `plugin-sdk/test-fixtures`                                                                    |
| `peekSystemEvents` / `resetSystemEventsForTest`     | Inspeksi dan reset fixture peristiwa sistem. Impor dari `plugin-sdk/test-fixtures`                                                           |
| `sanitizeTerminalText`                              | Sanitasi keluaran terminal untuk asersi. Impor dari `plugin-sdk/test-fixtures`                                                               |
| `countLines` / `hasBalancedFences`                  | Tegaskan bentuk keluaran pemotongan chunk. Impor dari `plugin-sdk/test-fixtures`                                                             |
| `runProviderCatalog`                                | Jalankan hook katalog penyedia dengan dependensi pengujian                                                                                   |
| `resolveProviderWizardOptions`                      | Resolusi pilihan wizard penyiapan penyedia dalam pengujian kontrak                                                                           |
| `resolveProviderModelPickerEntries`                 | Resolusi entri pemilih model penyedia dalam pengujian kontrak                                                                                |
| `buildProviderPluginMethodChoice`                   | Bangun id pilihan wizard penyedia untuk asersi                                                                                               |
| `setProviderWizardProvidersResolverForTest`         | Injeksi penyedia wizard penyedia untuk pengujian terisolasi                                                                                  |
| `createProviderUsageFetch`                           | Buat data bantu uji untuk pengambilan penggunaan penyedia                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Bekukan dan pulihkan pewaktu untuk pengujian yang peka waktu. Impor dari `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Buat pemberi prompt wizard penyiapan tiruan                                                                                                     |
| `createRuntimeTaskFlow`                              | Buat status TaskFlow runtime yang terisolasi                                                                                                  |
| `typedCases`                                         | Pertahankan tipe literal untuk pengujian berbasis tabel. Impor dari `plugin-sdk/test-fixtures`                                                    |

Suite kontrak Plugin bawaan juga menggunakan subpath pengujian SDK untuk helper fixture registri, manifes, artefak publik, dan runtime khusus pengujian. Suite khusus core yang bergantung pada inventaris OpenClaw bawaan tetap berada di `src/plugins/contracts`. Simpan pengujian extension baru pada subpath SDK terfokus yang terdokumentasi seperti `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures`, alih-alih mengimpor barrel kompatibilitas luas `plugin-sdk/testing`, file repo `src/**`, atau bridge repo `test/helpers/*` secara langsung.

### Tipe

Subpath pengujian terfokus juga mengekspor ulang tipe yang berguna dalam file pengujian:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Resolusi target pengujian

Gunakan `installCommonResolveTargetErrorCases` untuk menambahkan kasus galat standar untuk resolusi target channel:

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

### Menguji kontrak registrasi

Pengujian unit yang meneruskan mock `api` buatan tangan ke `register(api)` tidak menguji gate penerimaan loader OpenClaw. Tambahkan setidaknya satu pengujian smoke berbasis loader untuk setiap permukaan registrasi yang menjadi dependensi Plugin Anda, terutama hook dan capability eksklusif seperti memory.

Loader sebenarnya menggagalkan registrasi Plugin ketika metadata wajib tidak ada atau sebuah Plugin memanggil API capability yang bukan miliknya. Misalnya, `api.registerHook(...)` memerlukan nama hook, dan `api.registerMemoryCapability(...)` memerlukan manifes Plugin atau entri yang diekspor untuk mendeklarasikan `kind: "memory"`.

### Menguji akses konfigurasi runtime

Utamakan mock runtime Plugin bersama dari `openclaw/plugin-sdk/channel-test-helpers` saat menguji Plugin channel bawaan. Mock `runtime.config.loadConfig()` dan `runtime.config.writeConfigFile(...)` yang sudah deprecated akan melempar secara default agar pengujian menangkap penggunaan baru API kompatibilitas. Override mock tersebut hanya ketika pengujian secara eksplisit mencakup perilaku kompatibilitas lama.

### Pengujian unit Plugin channel

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

### Pengujian unit Plugin provider

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

Utamakan stub per instance dibanding mutasi prototipe:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pengujian kontrak (Plugin dalam repo)

Plugin bawaan memiliki pengujian kontrak yang memverifikasi kepemilikan registrasi:

```bash
pnpm test -- src/plugins/contracts/
```

Pengujian ini memastikan:

- Plugin mana yang mendaftarkan provider mana
- Plugin mana yang mendaftarkan provider speech mana
- Kebenaran bentuk registrasi
- Kepatuhan kontrak runtime

### Menjalankan pengujian berscope

Untuk Plugin tertentu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Untuk pengujian kontrak saja:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Penegakan lint (Plugin dalam repo)

Tiga aturan ditegakkan oleh `pnpm check` untuk Plugin dalam repo:

1. **Tidak ada impor root monolitik** -- barrel root `openclaw/plugin-sdk` ditolak
2. **Tidak ada impor `src/` langsung** -- Plugin tidak boleh mengimpor `../../src/` secara langsung
3. **Tidak ada impor mandiri** -- Plugin tidak boleh mengimpor subpath `plugin-sdk/<name>` miliknya sendiri

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi mengikuti pola yang sama direkomendasikan.

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
