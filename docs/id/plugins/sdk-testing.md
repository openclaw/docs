---
read_when:
    - Anda sedang menulis pengujian untuk sebuah plugin
    - Anda memerlukan utilitas pengujian dari SDK plugin
    - Anda ingin memahami pengujian kontrak untuk plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk plugin OpenClaw
title: Pengujian Plugin
x-i18n:
    generated_at: "2026-07-20T03:55:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9c6c050826dae3cd2c794d50b2dd95e20e6533d838161cce037742ee5fdf7e0e
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referensi untuk utilitas pengujian, pola, dan penegakan lint bagi plugin
OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan cara kerja menyertakan contoh pengujian lengkap:
  [Pengujian plugin saluran](/id/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian plugin penyedia](/id/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

Subpath ini merupakan titik masuk sumber lokal repositori untuk pengujian plugin
bundel milik OpenClaw. Subpath ini bukan ekspor `package.json` yang dipublikasikan untuk
plugin pihak ketiga, dan dapat mengimpor Vitest atau dependensi pengujian lain yang hanya tersedia di repositori.

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

Gunakan subpath terfokus ini untuk pengujian plugin bundel. Barrel
`openclaw/plugin-sdk/testing` sebelumnya bersifat lokal repositori, dikecualikan dari
paket yang didistribusikan, dan telah dihapus. Alias `openclaw/plugin-sdk/test-utils`
sebelumnya turut dihapus. `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) mempertahankan pengujian ekstensi pada
subpath pengujian terfokus di atas.

### Ekspor yang tersedia

| Ekspor                                               | Tujuan                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Membuat tiruan API plugin minimal untuk pengujian unit registrasi langsung. Impor dari `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture kontrak profil autentikasi bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture kontrak penekanan pengiriman bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture kontrak klasifikasi fallback bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Membuat fixture skema alat dinamis untuk pengujian kontrak runtime native. Impor dari `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Memastikan bentuk konteks masuk saluran. Impor dari `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Memasang kasus kontrak payload keluar saluran. Impor dari `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Membuat konteks siklus hidup akun saluran. Impor dari `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Memasang kasus kontrak tindakan pesan saluran generik. Impor dari `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Memasang kasus kontrak penyiapan saluran generik. Impor dari `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Memasang kasus kontrak status saluran generik. Impor dari `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Memastikan ID direktori saluran dari fungsi daftar direktori. Impor dari `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Memastikan titik masuk saluran bawaan mengekspos kontrak publik yang diharapkan. Impor dari `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Memformat stempel waktu amplop secara deterministik. Impor dari `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Memastikan teks balasan penyandingan saluran dan mengekstrak kodenya. Impor dari `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Memasang pemeriksaan kontrak registrasi plugin. Impor dari `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Mendaftarkan satu plugin penyedia dalam pengujian singkat pemuat. Impor dari `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Menangkap semua jenis penyedia dari satu plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Menangkap registrasi penyedia di beberapa plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Memastikan bahwa koleksi penyedia berisi suatu ID. Impor dari `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Membuat lingkungan runtime CLI/plugin tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Membuat permukaan runtime plugin tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Membuat pembantu status penyiapan untuk plugin saluran. Impor dari `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Membuat pemberi prompt wizard penyiapan tiruan. Impor dari `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Membuat status TaskFlow runtime yang terisolasi. Impor dari `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Menjalankan hook katalog penyedia dengan dependensi pengujian. Impor dari `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Menentukan pilihan wizard penyiapan penyedia dalam pengujian kontrak. Impor dari `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Menentukan entri pemilih model penyedia dalam pengujian kontrak. Impor dari `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Membuat ID pilihan wizard penyedia untuk asersi. Impor dari `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Menginjeksikan penyedia wizard penyedia untuk pengujian terisolasi. Impor dari `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Memasang pemeriksaan kontrak runtime keluarga penyedia. Impor dari `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Memastikan kebijakan pemutaran ulang penyedia diteruskan melalui alat dan metadata milik penyedia. Impor dari `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Menjalankan pengujian langsung penyedia STT waktu nyata dengan fixture audio bersama. Impor dari `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Menormalisasi keluaran transkrip langsung sebelum asersi samar. Impor dari `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Memastikan penyedia video mendeklarasikan kemampuan mode pembuatan secara eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Memastikan penyedia musik mendeklarasikan kemampuan pembuatan/penyuntingan secara eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Memasang respons tugas video kompatibel DashScope yang berhasil. Impor dari `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Mengakses tiruan HTTP/autentikasi penyedia Vitest yang harus diaktifkan secara eksplisit. Impor dari `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Mengatur ulang tiruan HTTP/autentikasi penyedia setelah setiap pengujian. Impor dari `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Kasus pengujian bersama untuk penanganan galat resolusi target. Impor dari `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Memeriksa apakah saluran harus menambahkan reaksi konfirmasi. Impor dari `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Menghapus reaksi konfirmasi setelah pengiriman balasan. Impor dari `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Membuat fixture registri plugin saluran. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Membuat fixture registri plugin kosong. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Memasang fixture registri untuk pengujian runtime plugin. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Menangkap permintaan pengambilan JSON dalam pengujian pembantu media. Impor dari `plugin-sdk/test-media-understanding`                                     |
| `isLiveTestEnabled`                                  | Membatasi pengujian langsung penyedia yang harus diaktifkan secara eksplisit. Impor dari `plugin-sdk/test-live`                                                                      |
| `collectProviderApiKeys`                             | Menemukan kredensial untuk pengujian langsung penyedia. Impor dari `plugin-sdk/test-live-auth`                                                    |
| `parseProviderModelMap`                              | Mengurai penggantian model pengujian langsung musik/video. Impor dari `plugin-sdk/test-media-generation`                                              |
| `withServer`                                         | Menjalankan pengujian terhadap server HTTP lokal sekali pakai. Impor dari `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Membuat objek permintaan HTTP masuk minimal. Impor dari `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Menjalankan pengujian pengambilan dengan hook prakoneksi terpasang. Impor dari `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Menambal variabel lingkungan untuk sementara. Impor dari `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Membuat fixture pengujian sistem berkas yang terisolasi. Impor dari `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Membuat tiruan respons server HTTP minimal. Impor dari `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Membuat fixture pengambilan penggunaan penyedia. Impor dari `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Membekukan dan memulihkan pewaktu untuk pengujian yang sensitif terhadap waktu. Impor dari `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Menangkap keluaran runtime CLI dalam pengujian. Impor dari `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Mengimpor modul ESM dengan token kueri baru untuk melewati tembolok modul. Impor dari `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Menentukan jalur fixture sumber atau dist plugin bawaan. Impor dari `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Memasang tiruan Vitest bawaan Node dengan cakupan sempit. Impor dari `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Membuat konteks pengujian sandbox. Impor dari `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Menulis fixture skill. Impor dari `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Membuat fixture pesan transkrip agen. Impor dari `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Memeriksa dan mengatur ulang fixture peristiwa sistem. Impor dari `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Membersihkan keluaran terminal untuk asersi. Impor dari `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Memastikan bentuk keluaran pemenggalan. Impor dari `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Mempertahankan tipe literal untuk pengujian berbasis tabel. Impor dari `plugin-sdk/test-fixtures`                                                    |

Suite kontrak Plugin terbundel juga menggunakan subjalur pengujian SDK ini untuk
helper registri khusus pengujian, manifes, artefak publik, dan fixture runtime.
Suite khusus inti yang bergantung pada inventaris OpenClaw terbundel tetap berada di
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

## Resolusi target pengujian

Gunakan `installCommonResolveTargetErrorCases` untuk menambahkan kasus kesalahan standar bagi
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
  it("harus menyelesaikan target @username", () => {
    // ...
  });
});
```

## Pola pengujian

### Menguji kontrak pendaftaran

Pengujian unit yang meneruskan mock `api` buatan tangan ke `register(api)` tidak
menjalankan gerbang penerimaan pemuat OpenClaw. Tambahkan setidaknya satu
uji asap berbasis pemuat untuk setiap permukaan pendaftaran yang menjadi dependensi Plugin Anda, terutama
hook dan kapabilitas eksklusif seperti memori.

Pemuat sebenarnya menggagalkan pendaftaran Plugin ketika metadata wajib tidak tersedia atau
Plugin memanggil API kapabilitas yang bukan miliknya. Sebagai contoh,
`api.registerHook(...)` memerlukan nama hook, dan
`api.registerMemoryCapability(...)` mengharuskan manifes Plugin atau entri yang diekspor
mendeklarasikan `kind: "memory"`.

### Menguji akses konfigurasi runtime

Utamakan mock runtime Plugin bersama dari
`openclaw/plugin-sdk/plugin-test-runtime`. Helper konfigurasi runtime-nya memodelkan
API snapshot dan mutasi saat ini.

### Pengujian unit Plugin kanal

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Plugin my-channel", () => {
  it("harus menyelesaikan akun dari konfigurasi", () => {
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

  it("harus memeriksa akun tanpa mematerialisasikan rahasia", () => {
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
  it("harus menyelesaikan model dinamis", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... konteks
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("harus mengembalikan katalog ketika kunci API tersedia", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... konteks
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

## Pengujian kontrak (Plugin dalam repo)

Plugin terbundel memiliki pengujian kontrak yang memverifikasi kepemilikan pendaftaran:

```bash
pnpm test src/plugins/contracts/
```

Pengujian ini memastikan:

- Plugin mana yang mendaftarkan penyedia tertentu
- Plugin mana yang mendaftarkan penyedia ucapan tertentu
- Ketepatan bentuk pendaftaran
- Kepatuhan kontrak runtime

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

## Penegakan lint (Plugin dalam repo)

`scripts/run-additional-boundary-checks.mjs` menjalankan serangkaian pemeriksaan batas impor `lint:plugins:*`
di CI; masing-masing juga dapat dijalankan secara mandiri secara lokal:

| Perintah                                                        | Menegakkan                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Plugin terbundel tidak boleh mengimpor barrel root monolitik `openclaw/plugin-sdk`.              |
| `pnpm run lint:plugins:no-extension-src-imports`               | File ekstensi produksi tidak boleh mengimpor struktur `src/**` repo secara langsung (`../../src/...`).  |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | File pengujian ekstensi tidak boleh mengimpor alias pengujian SDK yang telah dihapus atau helper pengujian khusus inti lainnya. |

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi mengikuti pola yang sama
tetap disarankan.

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
