---
read_when:
    - Anda sedang menulis pengujian untuk sebuah plugin
    - Anda memerlukan utilitas pengujian dari SDK plugin
    - Anda ingin memahami pengujian kontrak untuk plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk Plugin OpenClaw
title: Pengujian Plugin
x-i18n:
    generated_at: "2026-07-12T14:30:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referensi untuk utilitas pengujian, pola, dan penerapan lint bagi Plugin
OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan cara kerja menyertakan contoh pengujian lengkap:
  [Pengujian Plugin kanal](/id/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian Plugin penyedia](/id/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

Subjalur ini merupakan titik masuk sumber lokal repositori untuk pengujian
Plugin bawaan OpenClaw sendiri. Subjalur tersebut bukan ekspor `package.json`
yang dipublikasikan untuk Plugin pihak ketiga, dan dapat mengimpor Vitest atau
dependensi pengujian lain yang hanya tersedia di repositori.

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

Utamakan subjalur terfokus ini untuk pengujian Plugin bawaan yang baru. Barrel
umum `openclaw/plugin-sdk/testing` dan alias `openclaw/plugin-sdk/test-utils`
hanya untuk kompatibilitas lama: `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) menolak impor baru atas
keduanya dari berkas pengujian ekstensi, dan keduanya tetap tersedia semata-mata
untuk pengujian catatan kompatibilitas.

### Ekspor yang tersedia

| Ekspor                                               | Tujuan                                                                                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Membuat mock API Plugin minimal untuk pengujian unit pendaftaran langsung. Impor dari `plugin-sdk/plugin-test-api`                                           |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture kontrak profil autentikasi bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                           |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture kontrak bersama untuk penekanan pengiriman bagi adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture kontrak bersama untuk klasifikasi fallback bagi adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                    |
| `createParameterFreeTool`                            | Membuat fixture skema alat dinamis untuk pengujian kontrak runtime native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                              |
| `expectChannelInboundContextContract`                | Memastikan bentuk konteks masuk saluran. Impor dari `plugin-sdk/channel-contract-testing`                                                                    |
| `installChannelOutboundPayloadContractSuite`         | Memasang kasus kontrak payload keluar saluran. Impor dari `plugin-sdk/channel-contract-testing`                                                              |
| `createStartAccountContext`                          | Membuat konteks siklus hidup akun saluran. Impor dari `plugin-sdk/channel-test-helpers`                                                                       |
| `installChannelActionsContractSuite`                 | Memasang kasus kontrak generik tindakan pesan saluran. Impor dari `plugin-sdk/channel-test-helpers`                                                          |
| `installChannelSetupContractSuite`                   | Memasang kasus kontrak generik penyiapan saluran. Impor dari `plugin-sdk/channel-test-helpers`                                                               |
| `installChannelStatusContractSuite`                  | Memasang kasus kontrak generik status saluran. Impor dari `plugin-sdk/channel-test-helpers`                                                                  |
| `expectDirectoryIds`                                 | Memastikan ID direktori saluran dari fungsi daftar direktori. Impor dari `plugin-sdk/channel-test-helpers`                                                   |
| `assertBundledChannelEntries`                        | Memastikan titik masuk saluran bawaan mengekspos kontrak publik yang diharapkan. Impor dari `plugin-sdk/channel-test-helpers`                                |
| `formatEnvelopeTimestamp`                            | Memformat stempel waktu amplop yang deterministik. Impor dari `plugin-sdk/channel-test-helpers`                                                              |
| `expectPairingReplyText`                             | Memastikan teks balasan pemasangan saluran dan mengekstrak kodenya. Impor dari `plugin-sdk/channel-test-helpers`                                             |
| `describePluginRegistrationContract`                 | Memasang pemeriksaan kontrak pendaftaran Plugin. Impor dari `plugin-sdk/plugin-test-contracts`                                                               |
| `registerSingleProviderPlugin`                       | Mendaftarkan satu Plugin penyedia dalam pengujian smoke pemuat. Impor dari `plugin-sdk/plugin-test-runtime`                                                  |
| `registerProviderPlugin`                             | Menangkap semua jenis penyedia dari satu Plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                                 |
| `registerProviderPlugins`                            | Menangkap pendaftaran penyedia di beberapa Plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                               |
| `requireRegisteredProvider`                          | Memastikan koleksi penyedia berisi suatu ID. Impor dari `plugin-sdk/plugin-test-runtime`                                                                     |
| `createRuntimeEnv`                                   | Membuat lingkungan runtime CLI/Plugin tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                                                    |
| `createPluginRuntimeMock`                            | Membuat permukaan runtime Plugin tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                                                         |
| `createPluginSetupWizardStatus`                      | Membuat pembantu status penyiapan untuk Plugin saluran. Impor dari `plugin-sdk/plugin-test-runtime`                                                          |
| `createTestWizardPrompter`                           | Membuat pemberi perintah wisaya penyiapan tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                                                |
| `createRuntimeTaskFlow`                              | Membuat status TaskFlow runtime yang terisolasi. Impor dari `plugin-sdk/plugin-test-runtime`                                                                 |
| `runProviderCatalog`                                 | Menjalankan hook katalog penyedia dengan dependensi pengujian. Impor dari `plugin-sdk/plugin-test-runtime`                                                   |
| `resolveProviderWizardOptions`                       | Menyelesaikan pilihan wisaya penyiapan penyedia dalam pengujian kontrak. Impor dari `plugin-sdk/plugin-test-runtime`                                         |
| `resolveProviderModelPickerEntries`                  | Menyelesaikan entri pemilih model penyedia dalam pengujian kontrak. Impor dari `plugin-sdk/plugin-test-runtime`                                              |
| `buildProviderPluginMethodChoice`                    | Membuat ID pilihan wisaya penyedia untuk pemeriksaan. Impor dari `plugin-sdk/plugin-test-runtime`                                                            |
| `setProviderWizardProvidersResolverForTest`          | Menyuntikkan penyedia wisaya penyedia untuk pengujian terisolasi. Impor dari `plugin-sdk/plugin-test-runtime`                                                |
| `describeOpenAIProviderRuntimeContract`              | Memasang pemeriksaan kontrak runtime keluarga penyedia. Impor dari `plugin-sdk/provider-test-contracts`                                                      |
| `expectPassthroughReplayPolicy`                      | Memastikan kebijakan pemutaran ulang penyedia meneruskan alat dan metadata milik penyedia tanpa perubahan. Impor dari `plugin-sdk/provider-test-contracts`   |
| `runRealtimeSttLiveTest`                             | Menjalankan pengujian langsung penyedia STT waktu nyata dengan fixture audio bersama. Impor dari `plugin-sdk/provider-test-contracts`                        |
| `normalizeTranscriptForMatch`                        | Menormalkan keluaran transkrip langsung sebelum pemeriksaan fuzzy. Impor dari `plugin-sdk/provider-test-contracts`                                           |
| `expectExplicitVideoGenerationCapabilities`          | Memastikan penyedia video mendeklarasikan kemampuan mode pembuatan secara eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                         |
| `expectExplicitMusicGenerationCapabilities`          | Memastikan penyedia musik mendeklarasikan kemampuan pembuatan/pengeditan secara eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Memasang respons tugas video kompatibel DashScope yang berhasil. Impor dari `plugin-sdk/provider-test-contracts`                                            |
| `getProviderHttpMocks`                               | Mengakses mock Vitest HTTP/autentikasi penyedia yang harus diaktifkan secara eksplisit. Impor dari `plugin-sdk/provider-http-test-mocks`                     |
| `installProviderHttpMockCleanup`                     | Mengatur ulang mock HTTP/autentikasi penyedia setelah setiap pengujian. Impor dari `plugin-sdk/provider-http-test-mocks`                                     |
| `installCommonResolveTargetErrorCases`               | Kasus pengujian bersama untuk penanganan kesalahan resolusi target. Impor dari `plugin-sdk/channel-target-testing`                                           |
| `shouldAckReaction`                                  | Memeriksa apakah saluran harus menambahkan reaksi tanda terima. Impor dari `plugin-sdk/channel-feedback`                                                     |
| `removeAckReactionAfterReply`                        | Menghapus reaksi tanda terima setelah pengiriman balasan. Impor dari `plugin-sdk/channel-feedback`                                                           |
| `createTestRegistry`                                 | Membuat fixture registri Plugin saluran. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                                  |
| `createEmptyPluginRegistry`                          | Membuat fixture registri Plugin kosong. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                                   |
| `setActivePluginRegistry`                            | Memasang fixture registri untuk pengujian runtime Plugin. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                 |
| `createRequestCaptureJsonFetch`                      | Menangkap permintaan fetch JSON dalam pengujian pembantu media. Impor dari `plugin-sdk/test-env`                                                             |
| `withServer`                                         | Menjalankan pengujian terhadap server HTTP lokal sekali pakai. Impor dari `plugin-sdk/test-env`                                                              |
| `createMockIncomingRequest`                          | Membuat objek permintaan HTTP masuk minimal. Impor dari `plugin-sdk/test-env`                                                                                |
| `withFetchPreconnect`                                | Menjalankan pengujian fetch dengan hook prapenyambungan terpasang. Impor dari `plugin-sdk/test-env`                                                          |
| `withEnv` / `withEnvAsync`                           | Menambal variabel lingkungan untuk sementara. Impor dari `plugin-sdk/test-env`                                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Membuat fixture pengujian sistem berkas yang terisolasi. Impor dari `plugin-sdk/test-env`                                                                    |
| `createMockServerResponse`                           | Membuat mock respons server HTTP minimal. Impor dari `plugin-sdk/test-env`                                                                                   |
| `createProviderUsageFetch`                           | Membuat fixture fetch penggunaan penyedia. Impor dari `plugin-sdk/test-env`                                                                                  |
| `useFrozenTime` / `useRealTime`                      | Membekukan dan memulihkan pewaktu untuk pengujian yang sensitif terhadap waktu. Impor dari `plugin-sdk/test-env`                                             |
| `createCliRuntimeCapture`                            | Menangkap keluaran runtime CLI dalam pengujian. Impor dari `plugin-sdk/test-fixtures`                                                                         |
| `importFreshModule`                                  | Mengimpor modul ESM dengan token kueri baru untuk melewati cache modul. Impor dari `plugin-sdk/test-fixtures`                                                |
| `bundledPluginRoot` / `bundledPluginFile`            | Menyelesaikan jalur fixture sumber atau distribusi Plugin bawaan. Impor dari `plugin-sdk/test-fixtures`                                                      |
| `mockNodeBuiltinModule`                              | Memasang mock Vitest yang terbatas untuk modul bawaan Node. Impor dari `plugin-sdk/test-node-mocks`                                                          |
| `createSandboxTestContext`                           | Membuat konteks pengujian sandbox. Impor dari `plugin-sdk/test-fixtures`                                                                                     |
| `writeSkill`                                         | Tulis perlengkapan pengujian Skills. Impor dari `plugin-sdk/test-fixtures`                                                               |
| `makeAgentAssistantMessage`                          | Buat perlengkapan pengujian pesan transkrip agen. Impor dari `plugin-sdk/test-fixtures`                                                  |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Periksa dan atur ulang perlengkapan pengujian peristiwa sistem. Impor dari `plugin-sdk/test-fixtures`                                    |
| `sanitizeTerminalText`                               | Sanitasi keluaran terminal untuk asersi. Impor dari `plugin-sdk/test-fixtures`                                                           |
| `countLines` / `hasBalancedFences`                   | Verifikasi bentuk keluaran pemotongan. Impor dari `plugin-sdk/test-fixtures`                                                             |
| `typedCases`                                         | Pertahankan tipe literal untuk pengujian berbasis tabel. Impor dari `plugin-sdk/test-fixtures`                                           |

Suite kontrak Plugin bawaan juga menggunakan subjalur pengujian SDK ini untuk
helper fixture registri khusus pengujian, manifes, artefak publik, dan runtime.
Suite khusus inti yang bergantung pada inventaris OpenClaw bawaan tetap berada di
`src/plugins/contracts`.

### Tipe

Subjalur pengujian terfokus juga mengekspor ulang tipe yang berguna dalam berkas pengujian:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Pengujian resolusi target

Gunakan `installCommonResolveTargetErrorCases` untuk menambahkan kasus galat standar bagi
resolusi target kanal:

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

Pengujian unit yang meneruskan mock `api` buatan tangan ke `register(api)` tidak
menjalankan gerbang penerimaan pemuat OpenClaw. Tambahkan setidaknya satu
uji cepat berbasis pemuat untuk setiap permukaan pendaftaran yang menjadi dependensi Plugin Anda, terutama
hook dan kapabilitas eksklusif seperti memori.

Pemuat sebenarnya menggagalkan pendaftaran Plugin ketika metadata yang diwajibkan tidak ada atau
sebuah Plugin memanggil API kapabilitas yang bukan miliknya. Sebagai contoh,
`api.registerHook(...)` memerlukan nama hook, dan
`api.registerMemoryCapability(...)` mengharuskan manifes Plugin atau entri yang
diekspor mendeklarasikan `kind: "memory"`.

### Menguji akses konfigurasi runtime

Utamakan mock runtime Plugin bersama dari `openclaw/plugin-sdk/plugin-test-runtime`.
Mock `runtime.config.loadConfig()` dan `runtime.config.writeConfigFile(...)`
secara bawaan melempar pengecualian agar pengujian mendeteksi penggunaan baru API kompatibilitas yang
sudah tidak digunakan. Timpa mock tersebut hanya ketika pengujian secara eksplisit mencakup perilaku
kompatibilitas lama.

### Menguji unit Plugin kanal

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

### Menguji unit Plugin penyedia

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

### Menguji dengan stub per instans

Utamakan stub per instans daripada mutasi prototipe:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pengujian kontrak (Plugin dalam repositori)

Plugin bawaan memiliki pengujian kontrak yang memverifikasi kepemilikan pendaftaran:

```bash
pnpm test src/plugins/contracts/
```

Pengujian ini memastikan:

- Plugin mana yang mendaftarkan penyedia tertentu
- Plugin mana yang mendaftarkan penyedia ucapan tertentu
- Ketepatan bentuk pendaftaran
- Kepatuhan terhadap kontrak runtime

### Menjalankan pengujian terbatas

Untuk Plugin tertentu:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Hanya untuk pengujian kontrak:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Penegakan lint (Plugin dalam repositori)

`scripts/run-additional-boundary-checks.mjs` menjalankan sekumpulan pemeriksaan batas impor
`lint:plugins:*` dalam CI; masing-masing juga dapat dijalankan secara mandiri secara lokal:

| Perintah                                                        | Aturan yang diterapkan                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Plugin bawaan tidak boleh mengimpor barrel akar monolitik `openclaw/plugin-sdk`.                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Berkas ekstensi produksi tidak boleh mengimpor pohon `src/**` repositori secara langsung (`../../src/...`).                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Berkas pengujian ekstensi tidak boleh mengimpor `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils`, atau helper pengujian khusus inti lainnya. |

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi disarankan untuk mengikuti
pola yang sama.

## Konfigurasi pengujian

OpenClaw menggunakan Vitest 4 dengan pelaporan cakupan V8 yang bersifat informatif. Untuk pengujian Plugin:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Jika proses lokal menyebabkan tekanan memori:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) -- konvensi impor
- [Plugin Kanal SDK](/id/plugins/sdk-channel-plugins) -- antarmuka Plugin kanal
- [Plugin Penyedia SDK](/id/plugins/sdk-provider-plugins) -- hook Plugin penyedia
- [Membangun Plugin](/id/plugins/building-plugins) -- panduan memulai
