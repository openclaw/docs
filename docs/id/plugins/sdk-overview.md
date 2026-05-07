---
read_when:
    - Anda perlu mengetahui dari subpath SDK mana impor harus dilakukan
    - Anda ingin referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Gambaran umum SDK Plugin
x-i18n:
    generated_at: "2026-05-07T13:23:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin adalah kontrak bertipe antara Plugin dan core. Halaman ini adalah
referensi untuk **apa yang perlu diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan untuk penulis Plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [OpenClaw App SDK](/id/concepts/openclaw-sdk) dan paket `@openclaw/sdk`
  sebagai gantinya.
</Note>

<Tip>
Mencari panduan cara kerja? Mulailah dengan [Membangun Plugin](/id/plugins/building-plugins), gunakan [Plugin saluran](/id/plugins/sdk-channel-plugins) untuk Plugin saluran, [Plugin penyedia](/id/plugins/sdk-provider-plugins) untuk Plugin penyedia, [Plugin backend CLI](/id/plugins/cli-backend-plugins) untuk backend CLI AI lokal, dan [hook Plugin](/id/plugins/hooks) untuk Plugin hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi melingkar. Untuk helper entry/build khusus saluran,
utamakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi saluran, publikasikan JSON Schema milik saluran melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan OpenClaw
menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema saluran bawaan
yang dipertahankan. Ekspor kompatibilitas yang sudah usang tetap tersedia di
`plugin-sdk/channel-config-schema-legacy`; kedua subpath skema bawaan tersebut bukan
pola untuk Plugin baru.

<Warning>
  Jangan impor seam kemudahan bermerek penyedia atau saluran (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` milik mereka sendiri; konsumen core sebaiknya menggunakan barrel lokal Plugin tersebut atau menambahkan kontrak SDK generik yang sempit saat kebutuhannya benar-benar lintas saluran.

Sekumpulan kecil seam helper Plugin bawaan masih muncul di peta ekspor yang dihasilkan
ketika memiliki penggunaan pemilik yang terlacak. Seam tersebut hanya ada untuk
pemeliharaan Plugin bawaan dan bukan jalur impor yang direkomendasikan untuk
Plugin pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai facade kompatibilitas yang sudah usang untuk penggunaan pemilik yang terlacak. Jangan
menyalin jalur impor tersebut ke Plugin baru; gunakan helper runtime yang disuntikkan dan
subpath SDK saluran generik sebagai gantinya.
</Warning>

## Referensi subpath

SDK Plugin diekspos sebagai sekumpulan subpath sempit yang dikelompokkan berdasarkan area (entry Plugin,
saluran, penyedia, autentikasi, runtime, kapabilitas, memori, dan helper
Plugin bawaan yang dicadangkan). Untuk katalog lengkap — dikelompokkan dan ditautkan — lihat
[Subpath SDK Plugin](/id/plugins/sdk-subpaths).

Daftar 200+ subpath yang dihasilkan berada di `scripts/lib/plugin-sdk-entrypoints.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                  |
| `api.registerAgentHarness(...)`                  | Eksekutor agen level rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal           |
| `api.registerChannel(...)`                       | Saluran pesan                     |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming      |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks        |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video            |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                      |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                      |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                      |
| `api.registerWebFetchProvider(...)`              | Penyedia fetch / scrape web           |
| `api.registerWebSearchProvider(...)`             | Pencarian web                            |

### Alat dan perintah

| Metode                          | Yang didaftarkan                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`) |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)             |

Perintah Plugin dapat menetapkan `agentPromptGuidance` ketika agen membutuhkan petunjuk routing singkat
milik perintah. Jaga agar teks tersebut membahas perintah itu sendiri; jangan tambahkan
kebijakan khusus penyedia atau Plugin ke builder prompt core.

### Infrastruktur

| Metode                                         | Yang didaftarkan                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook peristiwa                              |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Pengiklan penemuan Gateway lokal      |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI fitur Node di bawah `openclaw nodes` |
| `api.registerService(service)`                 | Layanan latar belakang                      |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                     |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware hasil alat runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt tambahan yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memori tambahan      |

### Hook host untuk Plugin workflow

Hook host adalah seam SDK untuk Plugin yang perlu berpartisipasi dalam siklus hidup host
alih-alih hanya menambahkan penyedia, saluran, atau alat. Hook ini adalah
kontrak generik; Mode Rencana dapat menggunakannya, begitu juga workflow persetujuan,
gerbang kebijakan workspace, monitor latar belakang, wizard penyiapan, dan Plugin pendamping UI.

| Metode                                                                   | Kontrak yang dimilikinya                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | State sesi milik Plugin yang kompatibel dengan JSON dan diproyeksikan melalui sesi Gateway                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | Konteks tahan lama exactly-once yang disuntikkan ke giliran agen berikutnya untuk satu sesi                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | Kebijakan alat pre-Plugin bawaan/tepercaya yang dapat memblokir atau menulis ulang parameter alat                                                      |
| `api.registerToolMetadata(...)`                                          | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                            |
| `api.registerCommand(...)`                                               | Perintah Plugin berlingkup; hasil perintah dapat menetapkan `continueAgent: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Deskriptor kontribusi UI Kontrol untuk permukaan sesi, alat, run, atau pengaturan                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | Callback pembersihan untuk sumber daya runtime milik Plugin pada jalur reset/delete/reload                                                 |
| `api.registerAgentEventSubscription(...)`                                | Langganan peristiwa yang disanitasi untuk state workflow dan monitor                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | State scratch Plugin per-run yang dibersihkan pada siklus hidup run terminal                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | Catatan pekerjaan scheduler sesi milik Plugin dengan pembersihan deterministik                                                             |

Kontrak sengaja memisahkan otoritas:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah, metadata alat,
  injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan bersifat
  hanya bawaan karena berpartisipasi dalam kebijakan keselamatan host.
- Kepemilikan perintah yang dicadangkan bersifat hanya bawaan. Plugin eksternal harus menggunakan
  nama perintah atau alias mereka sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang memutasi prompt termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  field prompt dari `before_agent_start` lama, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Rencana:

| Arketipe Plugin             | Hook yang digunakan                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow persetujuan            | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, deskriptor UI                                                            |
| Gerbang kebijakan anggaran/workspace | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                                 |
| Monitor siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan scheduler sesi, kontribusi prompt heartbeat, deskriptor UI |
| Wizard penyiapan atau onboarding   | Ekstensi sesi, perintah berlingkup, deskriptor UI Kontrol                                                                              |

<Note>
  Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, meskipun sebuah Plugin mencoba menetapkan
  scope metode gateway yang lebih sempit. Utamakan prefiks khusus Plugin untuk
  metode milik Plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil alat">
  Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` ketika
  mereka perlu menulis ulang hasil alat setelah eksekusi dan sebelum runtime
  memasukkan hasil tersebut kembali ke model. Ini adalah seam tepercaya yang netral runtime
  untuk reducer output asinkron seperti tokenjuice.

Plugin bawaan harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap
runtime yang ditargetkan, misalnya `["pi", "codex"]`. Plugin eksternal
tidak dapat mendaftarkan middleware ini; pertahankan hook Plugin OpenClaw normal untuk pekerjaan
yang tidak memerlukan pewaktuan hasil alat sebelum model. Jalur pendaftaran factory ekstensi
tersemat lama khusus Pi telah dihapus.
</Accordion>

### Pendaftaran penemuan Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengiklankan Gateway yang aktif
pada transport penemuan lokal seperti mDNS/Bonjour. OpenClaw memanggil layanan
selama startup Gateway saat penemuan lokal diaktifkan, meneruskan port Gateway
saat ini dan data petunjuk TXT nonrahasia, lalu memanggil handler `stop`
yang dikembalikan selama shutdown Gateway.

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

Plugin penemuan Gateway tidak boleh memperlakukan nilai TXT yang diiklankan sebagai rahasia atau
autentikasi. Penemuan adalah petunjuk perutean; autentikasi Gateway dan penyematan TLS tetap
mengelola kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata perintah:

- `commands`: nama perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: deskriptor perintah waktu penguraian yang digunakan untuk bantuan CLI,
  perutean, dan pendaftaran CLI Plugin secara malas
- `parentPath`: jalur perintah induk opsional untuk grup perintah bertingkat, seperti
  `["nodes"]`

Untuk fitur node berpasangan, lebih baik gunakan
`api.registerNodeCliFeature(registrar, opts?)`. Ini adalah pembungkus kecil di sekitar
`api.registerCli(..., { parentPath: ["nodes"] })` dan membuat perintah seperti
`openclaw nodes canvas` menjadi fitur node yang secara eksplisit dimiliki Plugin.

Jika Anda ingin perintah Plugin tetap dimuat secara malas di jalur CLI root normal,
berikan `descriptors` yang mencakup setiap root perintah tingkat atas yang diekspos oleh
registrar tersebut.

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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Perintah bertingkat menerima perintah induk yang telah diselesaikan sebagai `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya saat Anda tidak memerlukan pendaftaran CLI root secara malas.
Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak memasang placeholder
berbasis deskriptor untuk pemuatan malas waktu penguraian.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan Plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefiks penyedia dalam referensi model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama dengan `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default Plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` saat backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalkan bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv bercakupan permintaan yang menjadi bagian dari
  dialek CLI, seperti memetakan tingkat berpikir OpenClaw ke flag upaya native.

Untuk panduan penulisan menyeluruh, lihat
[Plugin backend CLI](/id/plugins/cli-backend-plugins).

### Slot eksklusif

| Metode                                     | Yang didaftarkannya                                                                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar mesin dapat menyesuaikan tambahan prompt.         |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                                 |

### Adapter embedding memori

| Metode                                         | Yang didaftarkannya                              |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk Plugin aktif      |

- `registerMemoryCapability` adalah API Plugin memori eksklusif yang disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  agar Plugin pendamping dapat memakai artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau tata letak privat
  Plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API Plugin memori eksklusif yang kompatibel dengan warisan.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi `provider/model`
  yang tepat, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback aktif.
- `registerMemoryEmbeddingProvider` memungkinkan Plugin memori aktif mendaftarkan satu
  atau beberapa id adapter embedding (misalnya `openai`, `gemini`, atau id khusus
  yang ditentukan Plugin).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter yang terdaftar tersebut.

### Peristiwa dan siklus hidup

| Metode                                      | Yang dilakukannya              |
| ------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`          | Hook siklus hidup bertipe      |
| `api.onConversationBindingResolved(handler)` | Callback pengikatan percakapan |

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik guard.

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun mengaturnya, handler berprioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun mengaturnya, handler berprioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler berprioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun mengaturnya, handler berprioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan field bertipe `threadId` saat Anda memerlukan perutean thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus channel.
- `message_sending`: gunakan field perutean bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus channel.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup milik Gateway alih-alih bergantung pada hook internal `gateway:startup`.
- `cron_changed`: amati perubahan siklus hidup Cron milik Gateway. Gunakan `event.job?.state?.nextRunAtMs` dan `ctx.getCron?.()` saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id Plugin                                                                                         |
| `api.name`               | `string`                  | Nama tampilan                                                                                     |
| `api.version`            | `string?`                 | Versi Plugin (opsional)                                                                           |
| `api.description`        | `string?`                 | Deskripsi Plugin (opsional)                                                                       |
| `api.source`             | `string`                  | Jalur sumber Plugin                                                                               |
| `api.rootDir`            | `string?`                 | Direktori root Plugin (opsional)                                                                  |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori aktif saat tersedia)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus Plugin dari `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                            |
| `api.logger`             | `PluginLogger`            | Logger bercakupan (`debug`, `info`, `warn`, `error`)                                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/penyiapan ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Selesaikan jalur relatif terhadap root Plugin                                                     |

## Konvensi modul internal

Di dalam Plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Jangan pernah mengimpor Plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Rutekan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya kontrak eksternal.
</Warning>

Permukaan publik Plugin bawaan yang dimuat facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) lebih memilih
snapshot konfigurasi runtime aktif saat OpenClaw sudah berjalan. Jika belum ada snapshot
runtime, mereka fallback ke file konfigurasi yang diselesaikan di disk.
Facade Plugin bawaan yang dipaketkan harus dimuat melalui pemuat facade Plugin
OpenClaw; impor langsung dari `dist/extensions/...` melewati pemeriksaan manifes
dan sidecar runtime yang digunakan instalasi terpaket untuk kode milik Plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal Plugin yang sempit ketika sebuah
helper memang khusus penyedia dan belum termasuk dalam subpath SDK generik.
Contoh bawaan:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper streaming
  beta-header Claude dan `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder penyedia,
  helper model default, dan builder penyedia realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder penyedia
  beserta helper onboarding/config.

<Warning>
  Kode produksi ekstensi juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar digunakan bersama, promosikan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan lain
  yang berorientasi kapabilitas alih-alih menggandengkan dua Plugin.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Titik masuk" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi namespace `api.runtime` lengkap.
  </Card>
  <Card title="Penyiapan dan config" icon="sliders" href="/id/plugins/sdk-setup">
    Packaging, manifes, dan skema config.
  </Card>
  <Card title="Pengujian" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="Migrasi SDK" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Bermigrasi dari permukaan yang tidak digunakan lagi.
  </Card>
  <Card title="Internal Plugin" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kapabilitas.
  </Card>
</CardGroup>
