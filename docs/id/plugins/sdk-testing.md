---
read_when:
    - Anda sedang menulis pengujian untuk sebuah plugin
    - Anda memerlukan utilitas pengujian dari SDK Plugin
    - Anda ingin memahami pengujian kontrak untuk Plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk Plugin OpenClaw
title: Pengujian Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referensi untuk utilitas pengujian, pola, dan penegakan lint untuk plugin
OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan cara kerja menyertakan contoh pengujian yang dikerjakan:
  [Pengujian plugin kanal](/id/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian plugin penyedia](/id/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

Subpath pembantu pengujian ini adalah entrypoint sumber lokal repo untuk pengujian plugin
bundel milik OpenClaw sendiri. Subpath ini bukan ekspor paket untuk plugin pihak ketiga, dan
dapat mengimpor Vitest atau dependensi pengujian lain yang hanya ada di repo.

**Impor mock API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Impor kontrak runtime agen:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Impor kontrak kanal:** `openclaw/plugin-sdk/channel-contract-testing`

**Impor pembantu pengujian kanal:** `openclaw/plugin-sdk/channel-test-helpers`

**Impor pengujian target kanal:** `openclaw/plugin-sdk/channel-target-testing`

**Impor kontrak Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Impor pengujian runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Impor kontrak penyedia:** `openclaw/plugin-sdk/provider-test-contracts`

**Impor mock HTTP penyedia:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Impor pengujian lingkungan/jaringan:** `openclaw/plugin-sdk/test-env`

**Impor fixture generik:** `openclaw/plugin-sdk/test-fixtures`

**Impor mock bawaan Node:** `openclaw/plugin-sdk/test-node-mocks`

Di dalam repo OpenClaw, utamakan subpath terfokus di bawah ini untuk pengujian plugin
bundel baru. Barrel luas
`openclaw/plugin-sdk/testing` hanya untuk kompatibilitas lama.
Guardrail repo menolak impor nyata baru dari `plugin-sdk/testing` dan
`plugin-sdk/test-utils`; nama-nama tersebut tetap ada hanya sebagai permukaan kompatibilitas
yang tidak digunakan lagi untuk pengujian catatan kompatibilitas.

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

| Ekspor                                               | Tujuan                                                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Membangun tiruan API Plugin minimal untuk pengujian unit pendaftaran langsung. Impor dari `plugin-sdk/plugin-test-api`                                  |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Perlengkapan uji kontrak profil autentikasi bersama untuk adapter runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`              |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Perlengkapan uji kontrak penekanan pengiriman bersama untuk adapter runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`            |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Perlengkapan uji kontrak klasifikasi fallback bersama untuk adapter runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`            |
| `createParameterFreeTool`                            | Membangun perlengkapan uji skema alat dinamis untuk pengujian kontrak runtime native. Impor dari `plugin-sdk/agent-runtime-test-contracts`               |
| `expectChannelInboundContextContract`                | Menegaskan bentuk konteks masuk saluran. Impor dari `plugin-sdk/channel-contract-testing`                                                                |
| `installChannelOutboundPayloadContractSuite`         | Memasang kasus kontrak payload keluar saluran. Impor dari `plugin-sdk/channel-contract-testing`                                                          |
| `createStartAccountContext`                          | Membangun konteks siklus hidup akun saluran. Impor dari `plugin-sdk/channel-test-helpers`                                                               |
| `installChannelActionsContractSuite`                 | Memasang kasus kontrak tindakan pesan saluran generik. Impor dari `plugin-sdk/channel-test-helpers`                                                     |
| `installChannelSetupContractSuite`                   | Memasang kasus kontrak penyiapan saluran generik. Impor dari `plugin-sdk/channel-test-helpers`                                                          |
| `installChannelStatusContractSuite`                  | Memasang kasus kontrak status saluran generik. Impor dari `plugin-sdk/channel-test-helpers`                                                             |
| `expectDirectoryIds`                                 | Menegaskan id direktori saluran dari fungsi daftar direktori. Impor dari `plugin-sdk/channel-test-helpers`                                              |
| `assertBundledChannelEntries`                        | Menegaskan titik masuk saluran terbundel mengekspos kontrak publik yang diharapkan. Impor dari `plugin-sdk/channel-test-helpers`                        |
| `formatEnvelopeTimestamp`                            | Memformat stempel waktu amplop deterministik. Impor dari `plugin-sdk/channel-test-helpers`                                                              |
| `expectPairingReplyText`                             | Menegaskan teks balasan pemasangan saluran dan mengekstrak kodenya. Impor dari `plugin-sdk/channel-test-helpers`                                        |
| `describePluginRegistrationContract`                 | Memasang pemeriksaan kontrak pendaftaran Plugin. Impor dari `plugin-sdk/plugin-test-contracts`                                                          |
| `registerSingleProviderPlugin`                       | Mendaftarkan satu Plugin penyedia dalam uji pemeriksaan cepat pemuat. Impor dari `plugin-sdk/plugin-test-runtime`                                       |
| `registerProviderPlugin`                             | Menangkap semua jenis penyedia dari satu Plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                            |
| `registerProviderPlugins`                            | Menangkap pendaftaran penyedia di beberapa Plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                          |
| `requireRegisteredProvider`                          | Menegaskan bahwa koleksi penyedia berisi sebuah id. Impor dari `plugin-sdk/plugin-test-runtime`                                                         |
| `createRuntimeEnv`                                   | Membangun lingkungan runtime CLI/Plugin tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                                             |
| `createPluginRuntimeMock`                            | Membangun permukaan runtime Plugin tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                                                  |
| `createPluginSetupWizardStatus`                      | Membangun helper status penyiapan untuk Plugin saluran. Impor dari `plugin-sdk/plugin-test-runtime`                                                     |
| `describeOpenAIProviderRuntimeContract`              | Memasang pemeriksaan kontrak runtime keluarga penyedia. Impor dari `plugin-sdk/provider-test-contracts`                                                  |
| `expectPassthroughReplayPolicy`                      | Menegaskan kebijakan pemutaran ulang penyedia meneruskan alat dan metadata milik penyedia. Impor dari `plugin-sdk/provider-test-contracts`               |
| `runRealtimeSttLiveTest`                             | Menjalankan pengujian langsung penyedia STT waktu nyata dengan perlengkapan uji audio bersama. Impor dari `plugin-sdk/provider-test-contracts`           |
| `normalizeTranscriptForMatch`                        | Menormalkan keluaran transkrip langsung sebelum asersi fuzzy. Impor dari `plugin-sdk/provider-test-contracts`                                           |
| `expectExplicitVideoGenerationCapabilities`          | Menegaskan penyedia video mendeklarasikan kapabilitas mode pembuatan eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                         |
| `expectExplicitMusicGenerationCapabilities`          | Menegaskan penyedia musik mendeklarasikan kapabilitas pembuatan/penyuntingan eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                  |
| `mockSuccessfulDashscopeVideoTask`                   | Memasang respons tugas video yang berhasil dan kompatibel dengan DashScope. Impor dari `plugin-sdk/provider-test-contracts`                              |
| `getProviderHttpMocks`                               | Mengakses tiruan Vitest HTTP/autentikasi penyedia yang ikut serta. Impor dari `plugin-sdk/provider-http-test-mocks`                                      |
| `installProviderHttpMockCleanup`                     | Mengatur ulang tiruan HTTP/autentikasi penyedia setelah setiap pengujian. Impor dari `plugin-sdk/provider-http-test-mocks`                               |
| `installCommonResolveTargetErrorCases`               | Kasus pengujian bersama untuk penanganan kesalahan resolusi target. Impor dari `plugin-sdk/channel-target-testing`                                      |
| `shouldAckReaction`                                  | Memeriksa apakah saluran harus menambahkan reaksi ack. Impor dari `plugin-sdk/channel-feedback`                                                         |
| `removeAckReactionAfterReply`                        | Menghapus reaksi ack setelah pengiriman balasan. Impor dari `plugin-sdk/channel-feedback`                                                               |
| `createTestRegistry`                                 | Membangun perlengkapan uji registri Plugin saluran. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                   |
| `createEmptyPluginRegistry`                          | Membangun perlengkapan uji registri Plugin kosong. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                    |
| `setActivePluginRegistry`                            | Memasang perlengkapan uji registri untuk pengujian runtime Plugin. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`    |
| `createRequestCaptureJsonFetch`                      | Menangkap permintaan fetch JSON dalam pengujian helper media. Impor dari `plugin-sdk/test-env`                                                          |
| `withServer`                                         | Menjalankan pengujian terhadap server HTTP lokal sekali pakai. Impor dari `plugin-sdk/test-env`                                                         |
| `createMockIncomingRequest`                          | Membangun objek permintaan HTTP masuk minimal. Impor dari `plugin-sdk/test-env`                                                                          |
| `withFetchPreconnect`                                | Menjalankan pengujian fetch dengan hook preconnect terpasang. Impor dari `plugin-sdk/test-env`                                                          |
| `withEnv` / `withEnvAsync`                           | Menambal variabel lingkungan untuk sementara. Impor dari `plugin-sdk/test-env`                                                                          |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Membuat perlengkapan uji sistem berkas yang terisolasi. Impor dari `plugin-sdk/test-env`                                                                |
| `createMockServerResponse`                           | Membuat tiruan respons server HTTP minimal. Impor dari `plugin-sdk/test-env`                                                                            |
| `createCliRuntimeCapture`                            | Menangkap keluaran runtime CLI dalam pengujian. Impor dari `plugin-sdk/test-fixtures`                                                                   |
| `importFreshModule`                                  | Mengimpor modul ESM dengan token kueri baru untuk melewati cache modul. Impor dari `plugin-sdk/test-fixtures`                                           |
| `bundledPluginRoot` / `bundledPluginFile`            | Menyelesaikan jalur perlengkapan uji sumber atau dist Plugin terbundel. Impor dari `plugin-sdk/test-fixtures`                                          |
| `mockNodeBuiltinModule`                              | Memasang tiruan Vitest bawaan Node yang sempit. Impor dari `plugin-sdk/test-node-mocks`                                                                 |
| `createSandboxTestContext`                           | Membangun konteks pengujian sandbox. Impor dari `plugin-sdk/test-fixtures`                                                                              |
| `writeSkill`                                         | Menulis perlengkapan uji skill. Impor dari `plugin-sdk/test-fixtures`                                                                                  |
| `makeAgentAssistantMessage`                          | Membangun perlengkapan uji pesan transkrip agen. Impor dari `plugin-sdk/test-fixtures`                                                                  |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Memeriksa dan mengatur ulang perlengkapan uji peristiwa sistem. Impor dari `plugin-sdk/test-fixtures`                                                  |
| `sanitizeTerminalText`                               | Membersihkan keluaran terminal untuk asersi. Impor dari `plugin-sdk/test-fixtures`                                                                      |
| `countLines` / `hasBalancedFences`                   | Menegaskan bentuk keluaran pemotongan bagian. Impor dari `plugin-sdk/test-fixtures`                                                                     |
| `runProviderCatalog`                                 | Menjalankan hook katalog penyedia dengan dependensi pengujian                                                                                           |
| `resolveProviderWizardOptions`                       | Menyelesaikan pilihan wizard penyiapan penyedia dalam pengujian kontrak                                                                                 |
| `resolveProviderModelPickerEntries`                  | Menyelesaikan entri pemilih model penyedia dalam pengujian kontrak                                                                                      |
| `buildProviderPluginMethodChoice`                    | Membangun id pilihan wizard penyedia untuk asersi                                                                                                       |
| `setProviderWizardProvidersResolverForTest`          | Menyuntikkan penyedia wizard penyedia untuk pengujian terisolasi                                                                         |
| `createProviderUsageFetch`                           | Membuat fixture pengambilan penggunaan penyedia                                                                                          |
| `useFrozenTime` / `useRealTime`                      | Membekukan dan memulihkan timer untuk pengujian yang sensitif terhadap waktu. Impor dari `plugin-sdk/test-env`                           |
| `createTestWizardPrompter`                           | Membuat prompter wizard penyiapan tiruan                                                                                                 |
| `createRuntimeTaskFlow`                              | Membuat status task-flow runtime terisolasi                                                                                              |
| `typedCases`                                         | Mempertahankan tipe literal untuk pengujian berbasis tabel. Impor dari `plugin-sdk/test-fixtures`                                        |

Rangkaian kontrak Plugin bawaan juga menggunakan subjalur pengujian SDK untuk helper
fixture registry khusus pengujian, manifest, artefak publik, dan runtime. Rangkaian
khusus core yang bergantung pada inventaris OpenClaw bawaan tetap berada di bawah `src/plugins/contracts`.
Tempatkan pengujian ekstensi baru pada subjalur SDK terfokus yang terdokumentasi seperti
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures`, bukan mengimpor barrel
kompatibilitas `plugin-sdk/testing` yang luas, file repo `src/**`, atau jembatan
repo `test/helpers/*` secara langsung.

### Tipe

Subjalur pengujian terfokus juga mengekspor ulang tipe yang berguna di file pengujian:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Resolusi target pengujian

Gunakan `installCommonResolveTargetErrorCases` untuk menambahkan kasus galat standar untuk
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

### Menguji kontrak registrasi

Pengujian unit yang meneruskan mock `api` tulis tangan ke `register(api)` tidak menjalankan
gerbang penerimaan pemuat OpenClaw. Tambahkan setidaknya satu pengujian smoke berbasis pemuat
untuk setiap permukaan registrasi yang diandalkan Plugin Anda, terutama hook dan
kapabilitas eksklusif seperti memori.

Pemuat sebenarnya menggagalkan registrasi Plugin ketika metadata wajib hilang atau
Plugin memanggil API kapabilitas yang bukan miliknya. Misalnya,
`api.registerHook(...)` memerlukan nama hook, dan
`api.registerMemoryCapability(...)` mengharuskan manifest Plugin atau entri yang diekspor
mendeklarasikan `kind: "memory"`.

### Menguji akses konfigurasi runtime

Utamakan mock runtime Plugin bersama dari `openclaw/plugin-sdk/plugin-test-runtime`.
Mock `runtime.config.loadConfig()` dan `runtime.config.writeConfigFile(...)`
yang sudah usang melempar secara default agar pengujian menangkap penggunaan baru API
kompatibilitas. Timpa mock tersebut hanya ketika pengujian secara eksplisit mencakup
perilaku kompatibilitas lama.

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

### Pengujian unit Plugin penyedia

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

Utamakan stub per instans dibanding mutasi prototipe:

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

- Plugin mana yang mendaftarkan penyedia mana
- Plugin mana yang mendaftarkan penyedia ucapan mana
- Kebenaran bentuk registrasi
- Kepatuhan kontrak runtime

### Menjalankan pengujian terskop

Untuk Plugin tertentu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Hanya untuk pengujian kontrak:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Penegakan lint (Plugin dalam repo)

Tiga aturan ditegakkan oleh `pnpm check` untuk Plugin dalam repo:

1. **Tanpa impor root monolitik** -- barrel root `openclaw/plugin-sdk` ditolak
2. **Tanpa impor `src/` langsung** -- Plugin tidak dapat mengimpor `../../src/` secara langsung
3. **Tanpa impor diri sendiri** -- Plugin tidak dapat mengimpor subjalur `plugin-sdk/<name>` miliknya sendiri

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi mengikuti pola yang sama
direkomendasikan.

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

- [Ringkasan SDK](/id/plugins/sdk-overview) -- konvensi impor
- [Plugin Channel SDK](/id/plugins/sdk-channel-plugins) -- antarmuka Plugin channel
- [Plugin Penyedia SDK](/id/plugins/sdk-provider-plugins) -- hook Plugin penyedia
- [Membangun Plugin](/id/plugins/building-plugins) -- panduan memulai
