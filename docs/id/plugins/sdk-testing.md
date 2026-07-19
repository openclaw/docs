---
read_when:
    - Anda sedang menulis pengujian untuk sebuah plugin
    - Anda memerlukan utilitas pengujian dari SDK plugin
    - Anda ingin memahami pengujian kontrak untuk plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk plugin OpenClaw
title: Pengujian Plugin
x-i18n:
    generated_at: "2026-07-19T05:06:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 83c5e3948c02ce973f901b67ff0a8a253b04e25442c65f8fe3f5bec755d81a5d
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referensi untuk utilitas pengujian, pola, dan penerapan lint bagi plugin
OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan cara kerja menyertakan contoh pengujian lengkap:
  [Pengujian plugin saluran](/id/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian plugin penyedia](/id/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

Subpath ini adalah titik masuk sumber lokal repositori untuk pengujian plugin
bawaan OpenClaw sendiri. Subpath ini bukan ekspor `package.json` yang
dipublikasikan untuk plugin pihak ketiga, dan dapat mengimpor Vitest atau
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
import { isLiveTestEnabled } from "openclaw/plugin-sdk/test-live";
import { createRequestCaptureJsonFetch } from "openclaw/plugin-sdk/test-media-understanding";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

Gunakan subpath terfokus ini untuk pengujian plugin bawaan. Barrel
`openclaw/plugin-sdk/testing` sebelumnya bersifat lokal repositori, dikecualikan dari
paket yang didistribusikan, dan telah dihapus. Alias lama
`openclaw/plugin-sdk/test-utils` tetap bersifat lokal repositori;
`pnpm run lint:plugins:no-extension-test-core-imports` (`scripts/check-no-extension-test-core-imports.ts`) menolak impor baru
alias tersebut dalam pengujian ekstensi.

### Ekspor yang tersedia

| Ekspor                                               | Tujuan                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Buat mock API plugin minimal untuk pengujian unit registrasi langsung. Impor dari `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture kontrak profil autentikasi bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture kontrak penekanan pengiriman bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture kontrak klasifikasi fallback bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Buat fixture skema alat dinamis untuk pengujian kontrak runtime native. Impor dari `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Pastikan bentuk konteks masuk saluran. Impor dari `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Pasang kasus kontrak payload keluar saluran. Impor dari `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Buat konteks siklus hidup akun saluran. Impor dari `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Pasang kasus kontrak tindakan pesan saluran generik. Impor dari `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Pasang kasus kontrak penyiapan saluran generik. Impor dari `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Pasang kasus kontrak status saluran generik. Impor dari `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Pastikan ID direktori saluran dari fungsi daftar direktori. Impor dari `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Pastikan titik masuk saluran bawaan mengekspos kontrak publik yang diharapkan. Impor dari `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Format stempel waktu amplop secara deterministik. Impor dari `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Pastikan teks balasan pemasangan saluran dan ekstrak kodenya. Impor dari `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Pasang pemeriksaan kontrak registrasi plugin. Impor dari `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Daftarkan satu plugin penyedia dalam pengujian cepat pemuat. Impor dari `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Tangkap semua jenis penyedia dari satu plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Tangkap registrasi penyedia di beberapa plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Pastikan koleksi penyedia berisi suatu ID. Impor dari `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Buat lingkungan runtime CLI/plugin tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Buat permukaan runtime plugin tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Buat pembantu status penyiapan untuk plugin saluran. Impor dari `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Buat pemberi prompt wizard penyiapan tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Buat status TaskFlow runtime yang terisolasi. Impor dari `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Jalankan hook katalog penyedia dengan dependensi pengujian. Impor dari `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Selesaikan pilihan wizard penyiapan penyedia dalam pengujian kontrak. Impor dari `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Selesaikan entri pemilih model penyedia dalam pengujian kontrak. Impor dari `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Buat ID pilihan wizard penyedia untuk asersi. Impor dari `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Injeksi penyedia wizard penyedia untuk pengujian terisolasi. Impor dari `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Pasang pemeriksaan kontrak runtime keluarga penyedia. Impor dari `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Pastikan kebijakan pemutaran ulang penyedia diteruskan melalui alat dan metadata milik penyedia. Impor dari `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Jalankan pengujian langsung penyedia STT waktu nyata dengan fixture audio bersama. Impor dari `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normalkan keluaran transkrip langsung sebelum asersi fuzzy. Impor dari `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Pastikan penyedia video mendeklarasikan kemampuan mode pembuatan secara eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Pastikan penyedia musik mendeklarasikan kemampuan pembuatan/pengeditan secara eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Pasang respons tugas video kompatibel DashScope yang berhasil. Impor dari `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Akses mock Vitest HTTP/autentikasi penyedia yang harus diaktifkan secara eksplisit. Impor dari `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Atur ulang mock HTTP/autentikasi penyedia setelah setiap pengujian. Impor dari `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Kasus pengujian bersama untuk penanganan kesalahan resolusi target. Impor dari `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Periksa apakah saluran harus menambahkan reaksi pengakuan. Impor dari `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Hapus reaksi pengakuan setelah pengiriman balasan. Impor dari `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Buat fixture registri plugin saluran. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Buat fixture registri plugin kosong. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Pasang fixture registri untuk pengujian runtime plugin. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Tangkap permintaan pengambilan JSON dalam pengujian pembantu media. Impor dari `plugin-sdk/test-media-understanding`                                     |
| `isLiveTestEnabled`                                  | Batasi pengujian langsung penyedia yang harus diaktifkan secara eksplisit. Impor dari `plugin-sdk/test-live`                                                                      |
| `collectProviderApiKeys`                             | Temukan kredensial untuk pengujian langsung penyedia. Impor dari `plugin-sdk/test-live-auth`                                                    |
| `parseProviderModelMap`                              | Urai penggantian model pengujian langsung musik/video. Impor dari `plugin-sdk/test-media-generation`                                              |
| `withServer`                                         | Jalankan pengujian terhadap server HTTP lokal sekali pakai. Impor dari `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Buat objek permintaan HTTP masuk minimal. Impor dari `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Jalankan pengujian pengambilan dengan hook prakoneksi terpasang. Impor dari `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Tambal variabel lingkungan untuk sementara. Impor dari `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Buat fixture pengujian sistem berkas yang terisolasi. Impor dari `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Buat mock respons server HTTP minimal. Impor dari `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Buat fixture pengambilan penggunaan penyedia. Impor dari `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Bekukan dan pulihkan pengatur waktu untuk pengujian yang sensitif terhadap waktu. Impor dari `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Tangkap keluaran runtime CLI dalam pengujian. Impor dari `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Impor modul ESM dengan token kueri baru untuk melewati cache modul. Impor dari `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Selesaikan jalur fixture sumber atau dist plugin bawaan. Impor dari `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Pasang mock Vitest bawaan Node yang terbatas. Impor dari `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Buat konteks pengujian sandbox. Impor dari `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Tulis fixture keterampilan. Impor dari `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Buat fixture pesan transkrip agen. Impor dari `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Periksa dan atur ulang fixture peristiwa sistem. Impor dari `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Sanitasi keluaran terminal untuk asersi. Impor dari `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Pastikan bentuk keluaran pemotongan. Impor dari `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Pertahankan tipe literal untuk pengujian berbasis tabel. Impor dari `plugin-sdk/test-fixtures`                                                    |

Rangkaian kontrak plugin bawaan juga menggunakan subjalur pengujian SDK ini untuk
pembantu registry, manifes, artefak publik, dan fixture runtime khusus pengujian.
Rangkaian khusus inti yang bergantung pada inventaris OpenClaw bawaan tetap berada di
`src/plugins/contracts` sebagai gantinya.

### Tipe

Subjalur pengujian terfokus juga mengekspor ulang tipe yang berguna dalam file pengujian:

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

describe("resolusi target my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logika resolusi target kanal Anda
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Tambahkan kasus pengujian khusus kanal
  it("seharusnya meresolusi target @username", () => {
    // ...
  });
});
```

## Pola pengujian

### Menguji kontrak pendaftaran

Pengujian unit yang meneruskan mock `api` buatan tangan ke `register(api)` tidak
menguji gerbang penerimaan pemuat OpenClaw. Tambahkan setidaknya satu
uji asap berbasis pemuat untuk setiap permukaan pendaftaran yang menjadi dependensi plugin Anda, terutama
hook dan kapabilitas eksklusif seperti memori.

Pemuat sebenarnya menggagalkan pendaftaran plugin ketika metadata wajib tidak ada atau
plugin memanggil API kapabilitas yang bukan miliknya. Misalnya,
`api.registerHook(...)` memerlukan nama hook, dan
`api.registerMemoryCapability(...)` mengharuskan manifes plugin atau entri yang
diekspor mendeklarasikan `kind: "memory"`.

### Menguji akses konfigurasi runtime

Utamakan mock runtime plugin bersama dari `openclaw/plugin-sdk/plugin-test-runtime`.
Mock `runtime.config.loadConfig()` dan `runtime.config.writeConfigFile(...)`
secara default melempar galat agar pengujian mendeteksi penggunaan baru API kompatibilitas
yang sudah usang. Timpa mock tersebut hanya ketika pengujian secara eksplisit mencakup perilaku
kompatibilitas lama.

### Pengujian unit Plugin kanal

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Plugin my-channel", () => {
  it("seharusnya meresolusi akun dari konfigurasi", () => {
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

  it("seharusnya memeriksa akun tanpa mewujudkan rahasia", () => {
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

### Pengujian unit Plugin penyedia

```typescript
import { describe, it, expect } from "vitest";

describe("Plugin my-provider", () => {
  it("seharusnya meresolusi model dinamis", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... konteks
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("seharusnya mengembalikan katalog saat kunci API tersedia", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... konteks
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Membuat mock runtime plugin

Untuk kode yang menggunakan `createPluginRuntimeStore`, buat mock runtime dalam pengujian:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "runtime pengujian belum ditetapkan",
});

// Dalam penyiapan pengujian
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... mock lainnya
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... namespace lainnya
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Setelah pengujian
store.clearRuntime();
```

### Menguji dengan stub per instans

Utamakan stub per instans daripada mutasi prototipe:

```typescript
// Diutamakan: stub per instans
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Hindari: mutasi prototipe
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

`scripts/run-additional-boundary-checks.mjs` menjalankan serangkaian pemeriksaan batas impor
`lint:plugins:*` dalam CI; masing-masing juga dapat dijalankan secara mandiri secara lokal:

| Perintah                                                        | Yang Diberlakukan                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Plugin bawaan tidak boleh mengimpor barrel akar monolitik `openclaw/plugin-sdk`.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | File ekstensi produksi tidak boleh mengimpor hierarki `src/**` repositori secara langsung (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | File pengujian ekstensi tidak boleh mengimpor `plugin-sdk/test-utils` atau pembantu pengujian khusus inti lainnya. |

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi tetap disarankan untuk mengikuti
pola yang sama.

## Konfigurasi pengujian

OpenClaw menggunakan Vitest 4 dengan pelaporan cakupan V8 yang bersifat informatif. Untuk pengujian Plugin:

```bash
# Jalankan semua pengujian
pnpm test

# Jalankan pengujian Plugin tertentu
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Jalankan dengan filter nama pengujian tertentu
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Jalankan dengan cakupan
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
