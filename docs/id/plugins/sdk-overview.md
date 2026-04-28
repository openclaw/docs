---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor dari mana
    - Anda menginginkan referensi untuk semua metode pendaftaran di OpenClawPluginApi
    - Anda sedang mencari export SDK tertentu
sidebarTitle: SDK overview
summary: Peta import, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:52:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK adalah kontrak terketik antara Plugin dan core. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Tip>
  Sedang mencari panduan how-to?

- Plugin pertama? Mulai dari [Membangun plugins](/id/plugins/building-plugins).
- Plugin saluran? Lihat [Plugin saluran](/id/plugins/sdk-channel-plugins).
- Plugin provider? Lihat [Plugin provider](/id/plugins/sdk-provider-plugins).
- Plugin hook tool atau lifecycle? Lihat [Hook Plugin](/id/plugins/hooks).
</Tip>

## Konvensi import

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang berdiri sendiri. Ini menjaga startup tetap cepat dan
mencegah masalah circular dependency. Untuk helper entry/build khusus saluran,
utamakan `openclaw/plugin-sdk/channel-core`; pertahankan `openclaw/plugin-sdk/core` untuk
permukaan umbrella yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi saluran, terbitkan JSON Schema milik saluran melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif schema bersama dan builder generik. Setiap
export schema bernama saluran bawaan pada subpath tersebut adalah export kompatibilitas lama, bukan pola untuk Plugin baru.

<Warning>
  Jangan impor seam kemudahan berlabel provider atau saluran (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` mereka sendiri; konsumen core sebaiknya menggunakan barrel lokal Plugin tersebut
  atau menambahkan kontrak SDK generik yang sempit saat kebutuhan benar-benar lintas saluran.

Sekumpulan kecil seam helper Plugin bawaan (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*`, dan serupa) masih muncul dalam peta export yang dihasilkan. Seam tersebut hanya ada untuk pemeliharaan Plugin bawaan dan
bukan path import yang direkomendasikan untuk Plugin pihak ketiga baru.
</Warning>

## Referensi subpath

Plugin SDK diekspos sebagai sekumpulan subpath sempit yang dikelompokkan berdasarkan area (entry Plugin, saluran, provider, auth, runtime, capability, memori, dan helper Plugin bawaan yang dicadangkan). Untuk katalog lengkap — yang dikelompokkan dan diberi tautan — lihat
[Subpath Plugin SDK](/id/plugins/sdk-subpaths).

Daftar hasil generate dari 200+ subpath berada di `scripts/lib/plugin-sdk-entrypoints.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode berikut:

### Pendaftaran capability

| Method                                           | Yang didaftarkan                     |
| ------------------------------------------------ | ----------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                |
| `api.registerAgentHarness(...)`                  | Eksekutor agent tingkat rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal         |
| `api.registerChannel(...)`                       | Saluran pesan                       |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT       |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming      |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime duplex          |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video         |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                    |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                     |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                     |
| `api.registerWebFetchProvider(...)`              | Provider fetch / scrape web         |
| `api.registerWebSearchProvider(...)`             | Pencarian web                       |

### Tools dan perintah

| Method                          | Yang didaftarkan                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agent (wajib atau `{ optional: true }`) |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)               |

### Infrastruktur

| Method                                         | Yang didaftarkan                       |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook event                            |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | Pengiklan discovery Gateway lokal     |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                       |
| `api.registerService(service)`                 | Layanan latar belakang                |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                    |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware hasil tool runtime         |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt aditif yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memori aditif   |

<Note>
  Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, bahkan jika Plugin mencoba menetapkan
  scope metode gateway yang lebih sempit. Utamakan prefix khusus Plugin untuk
  metode milik Plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil tool">
  Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat
  perlu menulis ulang hasil tool setelah eksekusi dan sebelum runtime
  memasukkan hasil itu kembali ke model. Ini adalah seam tepercaya yang netral terhadap runtime
  untuk reducer output async seperti tokenjuice.

Plugin bawaan harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap
runtime yang ditargetkan, misalnya `["pi", "codex"]`. Plugin eksternal
tidak dapat mendaftarkan middleware ini; pertahankan hook Plugin OpenClaw normal untuk pekerjaan
yang tidak memerlukan timing hasil tool sebelum model. Jalur pendaftaran
extension factory tersemat khusus Pi yang lama telah dihapus.
</Accordion>

### Pendaftaran discovery Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengiklankan Gateway
aktif pada transport discovery lokal seperti mDNS/Bonjour. OpenClaw memanggil
layanan ini saat startup Gateway ketika discovery lokal diaktifkan, meneruskan
port Gateway saat ini dan data hint TXT non-secret, dan memanggil handler `stop`
yang dikembalikan saat Gateway dimatikan.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Plugin discovery Gateway tidak boleh memperlakukan nilai TXT yang diiklankan sebagai secret atau
autentikasi. Discovery adalah petunjuk perutean; auth Gateway dan pinning TLS tetap
mengendalikan kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata level atas:

- `commands`: root perintah eksplisit yang dimiliki registrar
- `descriptors`: descriptor perintah parse-time yang digunakan untuk help CLI root,
  perutean, dan pendaftaran CLI Plugin lazy

Jika Anda ingin perintah Plugin tetap di-lazy-load pada jalur CLI root normal,
sediakan `descriptors` yang mencakup setiap root perintah level atas yang diekspos oleh registrar tersebut.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Kelola akun Matrix, verifikasi, perangkat, dan status profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya ketika Anda tidak memerlukan pendaftaran CLI root lazy.
Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak memasang
placeholder berbasis descriptor untuk lazy loading saat parse-time.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan Plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefix provider dalam ref model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas default Plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` saat backend memerlukan penulisan ulang kompatibilitas setelah merge
  (misalnya menormalkan bentuk flag lama).

### Slot eksklusif

| Method                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar mesin dapat menyesuaikan penambahan prompt. |
| `api.registerMemoryCapability(capability)` | Capability memori terpadu                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                            |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                  |

### Adapter embedding memori

| Method                                         | Yang didaftarkan                              |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk Plugin aktif   |

- `registerMemoryCapability` adalah API Plugin memori eksklusif yang lebih disukai.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  sehingga Plugin pendamping dapat menggunakan artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau tata letak private
  Plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API Plugin memori eksklusif yang kompatibel dengan versi lama.
- `registerMemoryEmbeddingProvider` memungkinkan Plugin memori aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id yang didefinisikan Plugin kustom).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter yang terdaftar tersebut.

### Event dan lifecycle

| Method                                       | Yang dilakukan               |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook lifecycle terketik      |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan  |

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan
semantik guard.

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menyetelnya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menyetelnya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default akan dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menyetelnya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan field `threadId` yang terketik saat Anda memerlukan perutean inbound thread/topik. Pertahankan `metadata` untuk tambahan khusus saluran.
- `message_sending`: gunakan field perutean `replyToId` / `threadId` yang terketik sebelum fallback ke `metadata` khusus saluran.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup milik gateway alih-alih mengandalkan hook internal `gateway:startup`.

### Field objek API

| Field                    | Type                      | Deskripsi                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id Plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                               |
| `api.version`            | `string?`                 | Versi Plugin (opsional)                                                                     |
| `api.description`        | `string?`                 | Deskripsi Plugin (opsional)                                                                 |
| `api.source`             | `string`                  | Path sumber Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root Plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori aktif saat tersedia)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus Plugin dari `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [Helper Runtime](/id/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger bercakupan (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum full-entry |
| `api.resolvePath(input)` | `(string) => string`      | Menyelesaikan path relatif terhadap root Plugin                                             |

## Konvensi modul internal

Di dalam Plugin Anda, gunakan file barrel lokal untuk import internal:

```
my-plugin/
  api.ts            # Export publik untuk konsumen eksternal
  runtime-api.ts    # Export runtime internal saja
  index.ts          # Titik masuk Plugin
  setup-entry.ts    # Entry ringan khusus setup (opsional)
```

<Warning>
  Jangan pernah mengimpor Plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Rute import internal melalui `./api.ts` atau
  `./runtime-api.ts`. Path SDK hanya kontrak eksternal.
</Warning>

Permukaan publik Plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entry publik serupa) mengutamakan
snapshot konfigurasi runtime aktif saat OpenClaw sudah berjalan. Jika belum ada snapshot runtime,
permukaan ini fallback ke file konfigurasi yang telah diselesaikan di disk.

Plugin provider dapat mengekspos barrel kontrak lokal Plugin yang sempit saat suatu
helper memang khusus provider dan belum seharusnya berada di subpath SDK generik.
Contoh bawaan:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper
  beta-header Claude dan stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder provider,
  helper model default, dan builder provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder provider
  plus helper onboarding/config.

<Warning>
  Kode produksi extension juga sebaiknya menghindari import `openclaw/plugin-sdk/<other-plugin>`.
  Jika suatu helper benar-benar dibagikan, promosikan helper itu ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan lain
  yang berorientasi capability alih-alih memasangkan dua Plugin bersama.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper Runtime" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi lengkap namespace `api.runtime`.
  </Card>
  <Card title="Setup dan konfigurasi" icon="sliders" href="/id/plugins/sdk-setup">
    Packaging, manifest, dan schema konfigurasi.
  </Card>
  <Card title="Pengujian" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="Migrasi SDK" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Migrasi dari permukaan yang telah deprecated.
  </Card>
  <Card title="Internal Plugin" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model capability.
  </Card>
</CardGroup>
