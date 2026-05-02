---
read_when:
    - Anda sedang menulis tes untuk sebuah Plugin
    - Anda memerlukan utilitas pengujian dari SDK Plugin
    - Anda ingin memahami pengujian kontrak untuk Plugin bawaan
sidebarTitle: Testing
summary: Utilitas dan pola pengujian untuk Plugin OpenClaw
title: Pengujian Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referensi untuk utilitas, pola, dan penegakan lint pengujian untuk plugin OpenClaw.

<Tip>
  **Mencari contoh pengujian?** Panduan cara kerja menyertakan contoh pengujian lengkap:
  [Pengujian plugin channel](/id/plugins/sdk-channel-plugins#step-6-test) dan
  [Pengujian plugin provider](/id/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitas pengujian

**Impor mock API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Impor kontrak runtime agent:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Impor kontrak channel:** `openclaw/plugin-sdk/channel-contract-testing`

**Impor helper pengujian channel:** `openclaw/plugin-sdk/channel-test-helpers`

**Impor pengujian target channel:** `openclaw/plugin-sdk/channel-target-testing`

**Impor kontrak Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Impor pengujian runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Impor kontrak provider:** `openclaw/plugin-sdk/provider-test-contracts`

**Impor mock HTTP provider:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Impor pengujian lingkungan/jaringan:** `openclaw/plugin-sdk/test-env`

**Impor fixture generik:** `openclaw/plugin-sdk/test-fixtures`

**Impor mock bawaan Node:** `openclaw/plugin-sdk/test-node-mocks`

Gunakan subpath terfokus di bawah ini untuk pengujian plugin baru. Barrel luas
`openclaw/plugin-sdk/testing` hanya untuk kompatibilitas lama.
Guardrail repo menolak impor nyata baru dari `plugin-sdk/testing` dan
`plugin-sdk/test-utils`; nama-nama tersebut tetap ada hanya sebagai permukaan
kompatibilitas yang sudah tidak dianjurkan untuk plugin eksternal dan pengujian catatan kompatibilitas.

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

| Ekspor                                              | Tujuan                                                                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                               | Membangun mock API Plugin minimal untuk pengujian unit pendaftaran langsung. Impor dari `plugin-sdk/plugin-test-api`                                |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                     | Fixture kontrak profil auth bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                         |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                | Fixture kontrak penekanan pengiriman bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                 | Fixture kontrak klasifikasi fallback bersama untuk adaptor runtime agen native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                |
| `createParameterFreeTool`                           | Membangun fixture skema dynamic-tool untuk pengujian kontrak runtime native. Impor dari `plugin-sdk/agent-runtime-test-contracts`                   |
| `expectChannelInboundContextContract`               | Memastikan bentuk konteks inbound channel. Impor dari `plugin-sdk/channel-contract-testing`                                                         |
| `installChannelOutboundPayloadContractSuite`        | Memasang kasus kontrak payload outbound channel. Impor dari `plugin-sdk/channel-contract-testing`                                                    |
| `createStartAccountContext`                         | Membangun konteks siklus hidup akun channel. Impor dari `plugin-sdk/channel-test-helpers`                                                           |
| `installChannelActionsContractSuite`                | Memasang kasus kontrak message-action channel generik. Impor dari `plugin-sdk/channel-test-helpers`                                                 |
| `installChannelSetupContractSuite`                  | Memasang kasus kontrak setup channel generik. Impor dari `plugin-sdk/channel-test-helpers`                                                          |
| `installChannelStatusContractSuite`                 | Memasang kasus kontrak status channel generik. Impor dari `plugin-sdk/channel-test-helpers`                                                         |
| `expectDirectoryIds`                                | Memastikan id direktori channel dari fungsi directory-list. Impor dari `plugin-sdk/channel-test-helpers`                                            |
| `assertBundledChannelEntries`                       | Memastikan entrypoint channel bawaan mengekspos kontrak publik yang diharapkan. Impor dari `plugin-sdk/channel-test-helpers`                        |
| `formatEnvelopeTimestamp`                           | Memformat timestamp envelope deterministik. Impor dari `plugin-sdk/channel-test-helpers`                                                            |
| `expectPairingReplyText`                            | Memastikan teks balasan pairing channel dan mengekstrak kodenya. Impor dari `plugin-sdk/channel-test-helpers`                                       |
| `describePluginRegistrationContract`                | Memasang pemeriksaan kontrak pendaftaran Plugin. Impor dari `plugin-sdk/plugin-test-contracts`                                                      |
| `registerSingleProviderPlugin`                      | Mendaftarkan satu Plugin provider dalam pengujian smoke loader. Impor dari `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                            | Menangkap semua jenis provider dari satu Plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                        |
| `registerProviderPlugins`                           | Menangkap pendaftaran provider di beberapa Plugin. Impor dari `plugin-sdk/plugin-test-runtime`                                                      |
| `requireRegisteredProvider`                         | Memastikan koleksi provider berisi sebuah id. Impor dari `plugin-sdk/plugin-test-runtime`                                                           |
| `createRuntimeEnv`                                  | Membangun lingkungan runtime CLI/Plugin yang dimock. Impor dari `plugin-sdk/plugin-test-runtime`                                                    |
| `createPluginSetupWizardStatus`                     | Membangun helper status setup untuk Plugin channel. Impor dari `plugin-sdk/plugin-test-runtime`                                                     |
| `describeOpenAIProviderRuntimeContract`             | Memasang pemeriksaan kontrak runtime keluarga provider. Impor dari `plugin-sdk/provider-test-contracts`                                             |
| `expectPassthroughReplayPolicy`                     | Memastikan kebijakan replay provider meneruskan tool dan metadata milik provider. Impor dari `plugin-sdk/provider-test-contracts`                   |
| `runRealtimeSttLiveTest`                            | Menjalankan pengujian live provider STT realtime dengan fixture audio bersama. Impor dari `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                       | Menormalkan output transkrip live sebelum assertion fuzzy. Impor dari `plugin-sdk/provider-test-contracts`                                          |
| `expectExplicitVideoGenerationCapabilities`         | Memastikan provider video mendeklarasikan kapabilitas mode pembuatan eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                     |
| `expectExplicitMusicGenerationCapabilities`         | Memastikan provider musik mendeklarasikan kapabilitas pembuatan/edit eksplisit. Impor dari `plugin-sdk/provider-test-contracts`                     |
| `mockSuccessfulDashscopeVideoTask`                  | Memasang respons tugas video yang berhasil dan kompatibel dengan DashScope. Impor dari `plugin-sdk/provider-test-contracts`                         |
| `getProviderHttpMocks`                              | Mengakses mock HTTP/auth Vitest provider opt-in. Impor dari `plugin-sdk/provider-http-test-mocks`                                                   |
| `installProviderHttpMockCleanup`                    | Mereset mock HTTP/auth provider setelah setiap pengujian. Impor dari `plugin-sdk/provider-http-test-mocks`                                          |
| `installCommonResolveTargetErrorCases`              | Kasus pengujian bersama untuk penanganan error resolusi target. Impor dari `plugin-sdk/channel-target-testing`                                      |
| `shouldAckReaction`                                 | Memeriksa apakah channel harus menambahkan reaksi ack. Impor dari `plugin-sdk/channel-feedback`                                                     |
| `removeAckReactionAfterReply`                       | Menghapus reaksi ack setelah pengiriman balasan. Impor dari `plugin-sdk/channel-feedback`                                                           |
| `createTestRegistry`                                | Membangun fixture registry Plugin channel. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                       |
| `createEmptyPluginRegistry`                         | Membangun fixture registry Plugin kosong. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`                        |
| `setActivePluginRegistry`                           | Memasang fixture registry untuk pengujian runtime Plugin. Impor dari `plugin-sdk/plugin-test-runtime` atau `plugin-sdk/channel-test-helpers`        |
| `createRequestCaptureJsonFetch`                     | Menangkap permintaan fetch JSON dalam pengujian helper media. Impor dari `plugin-sdk/test-env`                                                      |
| `withServer`                                        | Menjalankan pengujian terhadap server HTTP lokal sekali pakai. Impor dari `plugin-sdk/test-env`                                                     |
| `createMockIncomingRequest`                         | Membangun objek permintaan HTTP masuk minimal. Impor dari `plugin-sdk/test-env`                                                                      |
| `withFetchPreconnect`                               | Menjalankan pengujian fetch dengan hook preconnect terpasang. Impor dari `plugin-sdk/test-env`                                                      |
| `withEnv` / `withEnvAsync`                          | Menambal variabel lingkungan untuk sementara. Impor dari `plugin-sdk/test-env`                                                                      |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Membuat fixture pengujian filesystem terisolasi. Impor dari `plugin-sdk/test-env`                                                                  |
| `createMockServerResponse`                          | Membuat mock respons server HTTP minimal. Impor dari `plugin-sdk/test-env`                                                                          |
| `createCliRuntimeCapture`                           | Menangkap output runtime CLI dalam pengujian. Impor dari `plugin-sdk/test-fixtures`                                                                |
| `importFreshModule`                                 | Mengimpor modul ESM dengan token query baru untuk melewati cache modul. Impor dari `plugin-sdk/test-fixtures`                                      |
| `bundledPluginRoot` / `bundledPluginFile`           | Menyelesaikan path fixture source atau dist Plugin bawaan. Impor dari `plugin-sdk/test-fixtures`                                                   |
| `mockNodeBuiltinModule`                             | Memasang mock Vitest bawaan Node yang sempit. Impor dari `plugin-sdk/test-node-mocks`                                                              |
| `createSandboxTestContext`                          | Membangun konteks pengujian sandbox. Impor dari `plugin-sdk/test-fixtures`                                                                         |
| `writeSkill`                                        | Menulis fixture skill. Impor dari `plugin-sdk/test-fixtures`                                                                                       |
| `makeAgentAssistantMessage`                         | Membangun fixture pesan transkrip agen. Impor dari `plugin-sdk/test-fixtures`                                                                      |
| `peekSystemEvents` / `resetSystemEventsForTest`     | Memeriksa dan mereset fixture event sistem. Impor dari `plugin-sdk/test-fixtures`                                                                  |
| `sanitizeTerminalText`                              | Menyanitasi output terminal untuk assertion. Impor dari `plugin-sdk/test-fixtures`                                                                 |
| `countLines` / `hasBalancedFences`                  | Memastikan bentuk output chunking. Impor dari `plugin-sdk/test-fixtures`                                                                           |
| `runProviderCatalog`                                | Menjalankan hook katalog provider dengan dependensi pengujian                                                                                      |
| `resolveProviderWizardOptions`                      | Menyelesaikan pilihan wizard setup provider dalam pengujian kontrak                                                                                |
| `resolveProviderModelPickerEntries`                 | Menyelesaikan entri model-picker provider dalam pengujian kontrak                                                                                  |
| `buildProviderPluginMethodChoice`                   | Membangun id pilihan wizard provider untuk assertion                                                                                               |
| `setProviderWizardProvidersResolverForTest`         | Menyuntikkan provider wizard provider untuk pengujian terisolasi                                                                                   |
| `createProviderUsageFetch`                           | Buat fixture pengambilan penggunaan penyedia                                                                                             |
| `useFrozenTime` / `useRealTime`                      | Bekukan dan pulihkan timer untuk pengujian yang sensitif waktu. Impor dari `plugin-sdk/test-env`                                         |
| `createTestWizardPrompter`                           | Buat prompter wizard penyiapan tiruan                                                                                                    |
| `createRuntimeTaskFlow`                              | Buat state task-flow runtime yang terisolasi                                                                                             |
| `typedCases`                                         | Pertahankan tipe literal untuk pengujian berbasis tabel. Impor dari `plugin-sdk/test-fixtures`                                           |

Rangkaian kontrak plugin bawaan juga menggunakan subpath pengujian SDK untuk helper khusus pengujian untuk fixture registry, manifest, artefak publik, dan runtime. Rangkaian khusus core yang bergantung pada inventaris OpenClaw bawaan tetap berada di bawah `src/plugins/contracts`. Pertahankan pengujian ekstensi baru pada subpath SDK terfokus yang terdokumentasi seperti `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures`, bukan mengimpor barrel kompatibilitas `plugin-sdk/testing` yang luas, file repo `src/**`, atau bridge repo `test/helpers/*` secara langsung.

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

Gunakan `installCommonResolveTargetErrorCases` untuk menambahkan kasus error standar untuk resolusi target kanal:

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

Pengujian unit yang meneruskan mock `api` buatan tangan ke `register(api)` tidak menguji gate penerimaan loader OpenClaw. Tambahkan setidaknya satu pengujian asap berbasis loader untuk setiap permukaan pendaftaran yang diandalkan plugin Anda, terutama hook dan kapabilitas eksklusif seperti memori.

Loader sebenarnya menggagalkan pendaftaran plugin ketika metadata yang diperlukan tidak ada atau sebuah plugin memanggil API kapabilitas yang bukan miliknya. Misalnya, `api.registerHook(...)` memerlukan nama hook, dan `api.registerMemoryCapability(...)` memerlukan manifest plugin atau entri yang diekspor untuk mendeklarasikan `kind: "memory"`.

### Menguji akses konfigurasi runtime

Utamakan mock runtime plugin bersama dari `openclaw/plugin-sdk/channel-test-helpers` saat menguji plugin kanal bawaan. Mock `runtime.config.loadConfig()` dan `runtime.config.writeConfigFile(...)` yang sudah usang melempar error secara default sehingga pengujian menangkap penggunaan baru API kompatibilitas. Timpa mock tersebut hanya ketika pengujian secara eksplisit mencakup perilaku kompatibilitas lama.

### Menguji unit plugin kanal

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

### Membuat mock runtime plugin

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

Utamakan stub per instance daripada mutasi prototipe:

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

- Plugin mana yang mendaftarkan provider mana
- Plugin mana yang mendaftarkan provider ucapan mana
- Ketepatan bentuk pendaftaran
- Kepatuhan kontrak runtime

### Menjalankan pengujian terbatas

Untuk plugin tertentu:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Untuk pengujian kontrak saja:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Penegakan lint (plugin dalam repo)

Tiga aturan diberlakukan oleh `pnpm check` untuk plugin dalam repo:

1. **Tanpa impor root monolitik** -- barrel root `openclaw/plugin-sdk` ditolak
2. **Tanpa impor `src/` langsung** -- plugin tidak dapat mengimpor `../../src/` secara langsung
3. **Tanpa impor diri sendiri** -- plugin tidak dapat mengimpor subpath `plugin-sdk/<name>` miliknya sendiri

Plugin eksternal tidak tunduk pada aturan lint ini, tetapi mengikuti pola yang sama direkomendasikan.

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

Jika eksekusi lokal menyebabkan tekanan memori:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) -- konvensi impor
- [Plugin Kanal SDK](/id/plugins/sdk-channel-plugins) -- antarmuka plugin kanal
- [Plugin Provider SDK](/id/plugins/sdk-provider-plugins) -- hook plugin provider
- [Membangun Plugin](/id/plugins/building-plugins) -- panduan memulai
