---
read_when:
    - Anda perlu mengetahui subjalur SDK mana yang akan diimpor.
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Gambaran umum SDK Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin adalah kontrak bertipe antara plugin dan core. Halaman ini adalah
referensi untuk **apa yang perlu diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan untuk penulis plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dashboard, job CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [OpenClaw App SDK](/id/concepts/openclaw-sdk) dan paket `@openclaw/sdk`
  sebagai gantinya.
</Note>

<Tip>
Mencari panduan cara kerja? Mulailah dengan [Membangun plugin](/id/plugins/building-plugins), gunakan [Plugin channel](/id/plugins/sdk-channel-plugins) untuk plugin channel, [Plugin provider](/id/plugins/sdk-provider-plugins) untuk plugin provider, [Plugin backend CLI](/id/plugins/cli-backend-plugins) untuk backend CLI AI lokal, dan [Hook plugin](/id/plugins/hooks) untuk plugin hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil dan mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi melingkar. Untuk helper entri/build khusus channel,
utamakan `openclaw/plugin-sdk/channel-core`; pertahankan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi channel, publikasikan JSON Schema milik channel melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan
OpenClaw menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema
channel bawaan yang dipertahankan. Ekspor kompatibilitas yang sudah usang tetap ada di
`plugin-sdk/channel-config-schema-legacy`; tidak satu pun subpath skema bawaan menjadi
pola untuk plugin baru.

<Warning>
  Jangan mengimpor seam kemudahan bermerek provider atau channel (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` miliknya sendiri; konsumen core sebaiknya menggunakan barrel lokal plugin
  tersebut atau menambahkan kontrak SDK generik yang sempit saat kebutuhannya benar-benar
  lintas channel.

Sejumlah kecil seam helper plugin bawaan masih muncul di peta ekspor yang dihasilkan
ketika memiliki penggunaan owner yang terlacak. Seam tersebut hanya ada untuk
pemeliharaan plugin bawaan dan tidak direkomendasikan sebagai path impor untuk plugin
pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai fasad kompatibilitas yang sudah usang untuk penggunaan owner
yang terlacak. Jangan salin path impor tersebut ke plugin baru; gunakan helper runtime
yang diinjeksikan dan subpath SDK channel generik sebagai gantinya.
</Warning>

## Referensi subpath

SDK plugin diekspos sebagai serangkaian subpath sempit yang dikelompokkan berdasarkan area (entri plugin,
channel, provider, auth, runtime, kapabilitas, memori, dan helper plugin bawaan
yang dicadangkan). Untuk katalog lengkap — dikelompokkan dan ditautkan — lihat
[Subpath SDK plugin](/id/plugins/sdk-subpaths).

Inventaris entrypoint compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dihasilkan dari
subset publik setelah mengurangi subpath pengujian/internal lokal repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Jalankan
`pnpm plugin-sdk:surface` untuk mengaudit jumlah ekspor publik. Subpath publik usang
yang sudah cukup lama dan tidak digunakan oleh kode produksi ekstensi bawaan
dilacak di `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel
re-ekspor usang yang luas dilacak di
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan
metode berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                       |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                   |
| `api.registerAgentHarness(...)`                  | Eksekutor agen tingkat rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal            |
| `api.registerChannel(...)`                       | Channel perpesanan                     |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming         |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks            |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video            |
| `api.registerImageGenerationProvider(...)`       | Generasi gambar                        |
| `api.registerMusicGenerationProvider(...)`       | Generasi musik                         |
| `api.registerVideoGenerationProvider(...)`       | Generasi video                         |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape            |
| `api.registerWebSearchProvider(...)`             | Pencarian web                          |

### Alat dan perintah

| Metode                          | Yang didaftarkan                              |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`)   |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)               |

Perintah plugin dapat menetapkan `agentPromptGuidance` saat agen memerlukan petunjuk routing
singkat milik perintah. Pertahankan teks tersebut tentang perintah itu sendiri; jangan tambahkan
kebijakan khusus provider atau plugin ke builder prompt core.

### Infrastruktur

| Metode                                         | Yang didaftarkan                         |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook peristiwa                           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                    |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                       |
| `api.registerGatewayDiscoveryService(service)` | Pengiklan penemuan Gateway lokal         |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI fitur Node di bawah `openclaw nodes` |
| `api.registerService(service)`                 | Layanan latar belakang                   |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                       |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware hasil alat runtime            |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt tambahan yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memori tambahan    |

### Hook host untuk plugin alur kerja

Hook host adalah seam SDK untuk plugin yang perlu berpartisipasi dalam siklus hidup host
alih-alih hanya menambahkan provider, channel, atau alat. Ini adalah kontrak
generik; Plan Mode dapat menggunakannya, begitu juga alur kerja persetujuan,
gerbang kebijakan workspace, monitor latar belakang, wizard penyiapan, dan plugin pendamping UI.

| Metode                                                                   | Kontrak yang dimilikinya                                                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | State sesi milik plugin yang kompatibel JSON dan diproyeksikan melalui sesi Gateway                                                |
| `api.enqueueNextTurnInjection(...)`                                      | Konteks durable exactly-once yang diinjeksikan ke giliran agen berikutnya untuk satu sesi                                          |
| `api.registerTrustedToolPolicy(...)`                                     | Kebijakan alat pra-plugin bawaan/tepercaya yang dapat memblokir atau menulis ulang parameter alat                                 |
| `api.registerToolMetadata(...)`                                          | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                                    |
| `api.registerCommand(...)`                                               | Perintah plugin terbatas; hasil perintah dapat menetapkan `continueAgent: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Deskriptor kontribusi Control UI untuk permukaan sesi, alat, run, atau pengaturan                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | Callback pembersihan untuk resource runtime milik plugin pada path reset/delete/reload                                             |
| `api.registerAgentEventSubscription(...)`                                | Langganan peristiwa yang disanitasi untuk state alur kerja dan monitor                                                             |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | State sementara plugin per-run yang dibersihkan pada siklus hidup run terminal                                                     |
| `api.registerSessionSchedulerJob(...)`                                   | Catatan job penjadwal sesi milik plugin dengan pembersihan deterministik                                                           |

Kontrak tersebut sengaja memisahkan otoritas:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah, metadata alat,
  injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan bersifat
  hanya-bawaan karena ikut serta dalam kebijakan keselamatan host.
- Kepemilikan perintah yang dicadangkan bersifat hanya-bawaan. Plugin eksternal sebaiknya menggunakan
  nama atau alias perintah miliknya sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang memutasi prompt termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  field prompt dari `before_agent_start` lama, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Plan:

| Arketipe plugin              | Hook yang digunakan                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Alur kerja persetujuan       | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, deskriptor UI                                                       |
| Gerbang kebijakan budget/workspace | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                         |
| Monitor siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan penjadwal sesi, kontribusi prompt Heartbeat, deskriptor UI |
| Wizard penyiapan atau onboarding | Ekstensi sesi, perintah terbatas, deskriptor Control UI                                                                          |

<Note>
  Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, meskipun sebuah plugin mencoba menetapkan
  scope metode gateway yang lebih sempit. Utamakan prefiks khusus plugin untuk
  metode milik plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil alat">
  Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat
  perlu menulis ulang hasil alat setelah eksekusi dan sebelum runtime
  memasukkan hasil itu kembali ke model. Ini adalah seam tepercaya yang netral
  terhadap runtime untuk pereduksi output asinkron seperti tokenjuice.

Plugin bawaan harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap
runtime yang ditargetkan, misalnya `["pi", "codex"]`. Plugin eksternal
tidak dapat mendaftarkan middleware ini; pertahankan hook plugin OpenClaw normal untuk pekerjaan
yang tidak memerlukan timing hasil alat pra-model. Jalur pendaftaran factory ekstensi
tertanam lama yang khusus Pi telah dihapus.
</Accordion>

### Pendaftaran penemuan Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan plugin mengiklankan Gateway aktif
pada transport penemuan lokal seperti mDNS/Bonjour. OpenClaw memanggil
layanan tersebut selama startup Gateway saat penemuan lokal diaktifkan, meneruskan
port Gateway saat ini dan data petunjuk TXT nonrahasia, serta memanggil handler
`stop` yang dikembalikan saat shutdown Gateway.

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
memiliki kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata perintah:

- `commands`: nama perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: deskriptor perintah waktu-parse yang digunakan untuk bantuan CLI,
  perutean, dan pendaftaran CLI plugin secara lazy
- `parentPath`: path perintah induk opsional untuk grup perintah bersarang, seperti
  `["nodes"]`

Untuk fitur node berpasangan, pilih
`api.registerNodeCliFeature(registrar, opts?)`. Ini adalah wrapper kecil di sekitar
`api.registerCli(..., { parentPath: ["nodes"] })` dan membuat perintah seperti
`openclaw nodes canvas` menjadi fitur node eksplisit yang dimiliki plugin.

Jika Anda ingin perintah plugin tetap dimuat secara lazy di path CLI root normal,
sediakan `descriptors` yang mencakup setiap root perintah tingkat atas yang diekspos oleh
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

Perintah bersarang menerima perintah induk yang terselesaikan sebagai `program`:

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

Gunakan `commands` sendiri hanya saat Anda tidak memerlukan pendaftaran CLI root secara lazy.
Jalur kompatibilitas eager itu tetap didukung, tetapi tidak memasang
placeholder berbasis deskriptor untuk pemuatan lazy waktu-parse.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki config default untuk backend
AI CLI lokal seperti `codex-cli`.

- `id` backend menjadi prefiks provider dalam ref model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Config pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` saat backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalkan bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv berbasis request yang menjadi milik
  dialek CLI, seperti memetakan tingkat berpikir OpenClaw ke flag effort native.

Untuk panduan penulisan menyeluruh, lihat
[plugin backend CLI](/id/plugins/cli-backend-plugins).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar mesin dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                    |

### Adapter embedding memori

| Metode                                         | Yang didaftarkan                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk plugin aktif |

- `registerMemoryCapability` adalah API plugin memori eksklusif yang direkomendasikan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  agar plugin pendamping dapat mengonsumsi artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau layout privat
  plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memori eksklusif yang kompatibel dengan legacy.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi `provider/model`
  yang persis, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback aktif.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memori aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id kustom
  yang ditentukan plugin).
- Config pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter
  yang terdaftar tersebut.

### Peristiwa dan lifecycle

| Metode                                       | Fungsinya                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook lifecycle bertipe          |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan |

Lihat [hook Plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik guard.

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler berprioritas lebih rendah dan path dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan field bertipe `threadId` saat Anda memerlukan perutean thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus channel.
- `message_sending`: gunakan field perutean bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus channel.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup milik gateway alih-alih bergantung pada hook internal `gateway:startup`.
- `cron_changed`: amati perubahan lifecycle cron milik gateway. Gunakan `event.job?.state?.nextRunAtMs` dan `ctx.getCron?.()` saat menyinkronkan penjadwal wake eksternal, dan pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id Plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                                |
| `api.version`            | `string?`                 | Versi Plugin (opsional)                                                                   |
| `api.description`        | `string?`                 | Deskripsi Plugin (opsional)                                                               |
| `api.source`             | `string`                  | Path sumber Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root Plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot config saat ini (snapshot runtime dalam memori aktif saat tersedia)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Config khusus plugin dari `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger berscope (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup pra-entri-penuh yang ringan |
| `api.resolvePath(input)` | `(string) => string`      | Selesaikan path relatif terhadap root plugin                                                        |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk import internal:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan import internal melalui `./api.ts` atau
  `./runtime-api.ts`. Path SDK hanya kontrak eksternal.
</Warning>

Permukaan publik plugin bundel yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) lebih memilih
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika belum ada
snapshot runtime, permukaan tersebut akan kembali ke file konfigurasi yang sudah di-resolve di disk.
Facade plugin bundel yang dipaketkan harus dimuat melalui pemuat facade plugin
OpenClaw; impor langsung dari `dist/extensions/...` melewati manifes
dan pemeriksaan sidecar runtime yang digunakan instalasi terpaket untuk kode milik plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal-plugin yang sempit ketika
helper memang sengaja khusus penyedia dan belum termasuk dalam subjalur SDK
generik. Contoh bundel:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper stream
  beta-header Claude dan `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder penyedia,
  helper model default, dan builder penyedia realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder penyedia
  beserta helper onboarding/konfigurasi.

<Warning>
  Kode produksi ekstensi juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar digunakan bersama, promosikan ke subjalur SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kapabilitas lain alih-alih menggandengkan dua plugin.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi namespace `api.runtime` lengkap.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/id/plugins/sdk-setup">
    Pemaketan, manifes, dan skema konfigurasi.
  </Card>
  <Card title="Testing" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Bermigrasi dari permukaan yang sudah usang.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kapabilitas.
  </Card>
</CardGroup>
