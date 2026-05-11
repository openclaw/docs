---
read_when:
    - Anda perlu mengetahui subjalur SDK mana yang harus digunakan untuk impor.
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar SDK Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK adalah kontrak bertipe antara plugin dan core. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan untuk penulis plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [OpenClaw App SDK](/id/concepts/openclaw-sdk) dan paket `@openclaw/sdk`
  sebagai gantinya.
</Note>

<Tip>
Mencari panduan cara pakai? Mulai dengan [Membangun plugin](/id/plugins/building-plugins), gunakan [Plugin channel](/id/plugins/sdk-channel-plugins) untuk plugin channel, [Plugin provider](/id/plugins/sdk-provider-plugins) untuk plugin provider, [Plugin backend CLI](/id/plugins/cli-backend-plugins) untuk backend CLI AI lokal, dan [Hook plugin](/id/plugins/hooks) untuk plugin hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi melingkar. Untuk helper entri/build khusus channel,
utamakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi channel, publikasikan JSON Schema milik channel melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan
OpenClaw menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema
channel bawaan yang dipertahankan. Ekspor kompatibilitas yang deprecated tetap ada di
`plugin-sdk/channel-config-schema-legacy`; tidak ada subpath skema bawaan yang menjadi
pola untuk plugin baru.

<Warning>
  Jangan impor seam kenyamanan bermerek provider atau channel (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` mereka sendiri; konsumen core sebaiknya menggunakan barrel lokal plugin
  tersebut atau menambahkan kontrak SDK generik yang sempit saat kebutuhan benar-benar
  lintas-channel.

Sekumpulan kecil seam helper plugin bawaan masih muncul di peta ekspor yang dihasilkan
ketika memiliki penggunaan owner yang terlacak. Seam tersebut hanya ada untuk pemeliharaan
plugin bawaan dan bukan jalur impor yang direkomendasikan untuk plugin pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai facade kompatibilitas deprecated untuk penggunaan owner yang terlacak. Jangan
menyalin jalur impor tersebut ke plugin baru; gunakan helper runtime yang diinjeksi dan
subpath SDK channel generik sebagai gantinya.
</Warning>

## Referensi subpath

Plugin SDK diekspos sebagai sekumpulan subpath sempit yang dikelompokkan berdasarkan area (entri plugin,
channel, provider, auth, runtime, capability, memory, dan helper plugin bawaan
yang dicadangkan). Untuk katalog lengkap, yang dikelompokkan dan ditautkan, lihat
[Subpath Plugin SDK](/id/plugins/sdk-subpaths).

Inventaris entrypoint compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dihasilkan dari
subset publik setelah mengurangi subpath pengujian/internal lokal repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Jalankan
`pnpm plugin-sdk:surface` untuk mengaudit jumlah ekspor publik. Subpath publik deprecated
yang sudah cukup lama dan tidak digunakan oleh kode produksi ekstensi bawaan
dilacak di `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel re-export
deprecated yang luas dilacak di
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode
berikut:

### Pendaftaran capability

| Metode                                           | Yang didaftarkan                       |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                  |
| `api.registerAgentHarness(...)`                  | Eksekutor agen level rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal           |
| `api.registerChannel(...)`                       | Channel perpesanan                    |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming        |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime duplex            |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video           |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                      |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                       |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                       |
| `api.registerWebFetchProvider(...)`              | Provider fetch / scrape web           |
| `api.registerWebSearchProvider(...)`             | Pencarian web                         |

### Alat dan perintah

| Metode                         | Yang didaftarkan                              |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`)   |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)                |

Perintah plugin dapat menetapkan `agentPromptGuidance` saat agen memerlukan petunjuk routing
singkat milik perintah. Pertahankan teks tersebut tentang perintah itu sendiri; jangan tambahkan
kebijakan khusus provider atau plugin ke builder prompt core.

### Infrastruktur

| Metode                                         | Yang didaftarkan                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook peristiwa                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Pengiklan discovery Gateway lokal      |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                         |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI fitur Node di bawah `openclaw nodes` |
| `api.registerService(service)`                 | Layanan latar belakang                  |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                      |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware tool-result runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt tambahan yang berdekatan dengan memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memory tambahan   |

### Hook host untuk plugin workflow

Hook host adalah seam SDK untuk plugin yang perlu berpartisipasi dalam siklus hidup host,
bukan hanya menambahkan provider, channel, atau alat. Hook ini adalah kontrak
generik; Plan Mode dapat menggunakannya, begitu juga workflow persetujuan,
gate kebijakan workspace, monitor latar belakang, wizard setup, dan plugin pendamping UI.

| Metode                                                                               | Kontrak yang dimilikinya                                                                                                          |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | State sesi milik plugin yang kompatibel dengan JSON dan diproyeksikan melalui sesi Gateway                                         |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Konteks durable exactly-once yang diinjeksi ke giliran agen berikutnya untuk satu sesi                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Kebijakan alat pre-plugin bawaan/tepercaya yang dapat memblokir atau menulis ulang param alat                                     |
| `api.registerToolMetadata(...)`                                                      | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                                   |
| `api.registerCommand(...)`                                                           | Perintah plugin terscope; hasil perintah dapat menetapkan `continueAgent: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptor kontribusi UI kontrol untuk permukaan sesi, alat, run, atau pengaturan                                                 |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback pembersihan untuk resource runtime milik plugin pada jalur reset/delete/reload                                           |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Subscription peristiwa yang disanitasi untuk state workflow dan monitor                                                           |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | State scratch per-run plugin yang dibersihkan pada siklus hidup run terminal                                                      |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadata pembersihan untuk pekerjaan scheduler milik plugin; tidak menjadwalkan pekerjaan atau membuat record tugas               |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Pengiriman lampiran file yang dimediasi host khusus bawaan ke rute direct-outbound sesi aktif                                     |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Giliran sesi terjadwal berbasis Cron khusus bawaan plus pembersihan berbasis tag                                                  |
| `api.session.controls.registerSessionAction(...)`                                    | Tindakan sesi bertipe yang dapat dikirim klien melalui Gateway                                                                    |

Gunakan namespace yang dikelompokkan untuk kode plugin baru:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Metode flat yang setara tetap tersedia sebagai alias kompatibilitas deprecated
untuk plugin yang sudah ada. Jangan tambahkan kode plugin baru yang memanggil
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, atau
`api.unscheduleSessionTurnsByTag` secara langsung.

`scheduleSessionTurn(...)` adalah kemudahan dalam cakupan sesi di atas penjadwal
Cron Gateway. Cron memiliki pengaturan waktu dan membuat catatan tugas latar
belakang saat turn berjalan; Plugin SDK hanya membatasi sesi target, penamaan
milik Plugin, dan pembersihan. Gunakan `api.runtime.tasks.managedFlows` di dalam
turn terjadwal ketika pekerjaan itu sendiri membutuhkan status Task Flow
multi-langkah yang tahan lama.

Kontrak sengaja memisahkan otoritas:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah,
  metadata alat, injeksi turn berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan
  hanya bawaan karena ikut serta dalam kebijakan keselamatan host.
- Kepemilikan perintah cadangan hanya untuk bawaan. Plugin eksternal harus
  menggunakan nama perintah atau alias mereka sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang mengubah prompt termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  field prompt dari `before_agent_start` lama, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Plan:

| Arketipe Plugin             | Hook yang digunakan                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alur kerja persetujuan            | Ekstensi sesi, kelanjutan perintah, injeksi turn berikutnya, deskriptor UI                                                            |
| Gerbang kebijakan anggaran/workspace | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                                 |
| Pemantau siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan penjadwal sesi, kontribusi prompt Heartbeat, deskriptor UI |
| Wizard penyiapan atau onboarding   | Ekstensi sesi, perintah bercakupan, deskriptor Control UI                                                                              |

<Note>
  Namespace admin inti cadangan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, bahkan jika Plugin mencoba menetapkan
  cakupan metode Gateway yang lebih sempit. Lebih baik gunakan prefiks khusus
  Plugin untuk metode milik Plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)`
  ketika mereka perlu menulis ulang hasil alat setelah eksekusi dan sebelum
  runtime memasukkan hasil itu kembali ke model. Ini adalah seam tepercaya yang
  netral runtime untuk pereduksi keluaran asinkron seperti tokenjuice.

Plugin bawaan harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk
setiap runtime yang ditargetkan, misalnya `["pi", "codex"]`. Plugin eksternal
tidak dapat mendaftarkan middleware ini; pertahankan hook Plugin OpenClaw normal
untuk pekerjaan yang tidak membutuhkan timing hasil alat pra-model. Jalur lama
pendaftaran factory ekstensi tertanam khusus Pi telah dihapus.
</Accordion>

### Pendaftaran penemuan Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengiklankan
Gateway aktif pada transport penemuan lokal seperti mDNS/Bonjour. OpenClaw
memanggil layanan selama startup Gateway ketika penemuan lokal diaktifkan,
meneruskan port Gateway saat ini dan data petunjuk TXT non-rahasia, lalu
memanggil handler `stop` yang dikembalikan saat shutdown Gateway.

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

Plugin penemuan Gateway tidak boleh memperlakukan nilai TXT yang diiklankan
sebagai rahasia atau autentikasi. Penemuan adalah petunjuk routing; autentikasi
Gateway dan penyematan TLS tetap memiliki kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata perintah:

- `commands`: nama perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: deskriptor perintah waktu-parse yang digunakan untuk bantuan
  CLI, routing, dan pendaftaran CLI Plugin lazy
- `parentPath`: jalur perintah induk opsional untuk grup perintah bersarang,
  seperti `["nodes"]`

Untuk fitur node berpasangan, lebih baik gunakan
`api.registerNodeCliFeature(registrar, opts?)`. Ini adalah wrapper kecil di
sekitar `api.registerCli(..., { parentPath: ["nodes"] })` dan membuat perintah
seperti `openclaw nodes canvas` menjadi fitur node eksplisit milik Plugin.

Jika Anda ingin perintah Plugin tetap dimuat lazy di jalur CLI root normal,
sediakan `descriptors` yang mencakup setiap root perintah tingkat atas yang
diekspos oleh registrar tersebut.

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

Perintah bersarang menerima perintah induk yang telah diresolve sebagai `program`:

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

Gunakan `commands` saja hanya ketika Anda tidak membutuhkan pendaftaran CLI root
lazy. Jalur kompatibilitas eager itu tetap didukung, tetapi tidak memasang
placeholder berbasis deskriptor untuk pemuatan lazy waktu-parse.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan Plugin memiliki konfigurasi default
untuk backend CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefiks penyedia dalam referensi model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama dengan `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default Plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend membutuhkan penulisan ulang
  kompatibilitas setelah penggabungan (misalnya menormalkan bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv bercakupan permintaan
  yang termasuk dialek CLI, seperti memetakan tingkat berpikir OpenClaw ke flag
  effort native.

Untuk panduan penulisan menyeluruh, lihat
[Plugin backend CLI](/id/plugins/cli-backend-plugins).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` sehingga mesin dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                    |

### Adapter embedding memori

| Metode                                         | Yang didaftarkan                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk Plugin aktif |

- `registerMemoryCapability` adalah API Plugin memori eksklusif yang disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  sehingga Plugin pendamping dapat menggunakan artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau tata letak privat
  Plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API Plugin memori eksklusif yang kompatibel lama.
- `MemoryFlushPlan.model` dapat menyematkan turn flush ke referensi `provider/model`
  persis, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback aktif.
- `registerMemoryEmbeddingProvider` memungkinkan Plugin memori aktif mendaftarkan
  satu atau beberapa id adapter embedding (misalnya `openai`, `gemini`, atau id
  kustom yang ditentukan Plugin).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diresolve terhadap id adapter yang
  terdaftar tersebut.

### Peristiwa dan siklus hidup

| Metode                                       | Yang dilakukan                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe          |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan |

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik
guard.

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler berprioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan field `threadId` bertipe ketika Anda membutuhkan routing thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus kanal.
- `message_sending`: gunakan field routing bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus kanal.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup milik Gateway alih-alih bergantung pada hook internal `gateway:startup`.
- `cron_changed`: amati perubahan siklus hidup cron milik Gateway. Gunakan `event.job?.state?.nextRunAtMs` dan `ctx.getCron?.()` saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Field objek API

| Bidang                   | Tipe                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id Plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan                                                                              |
| `api.version`            | `string?`                 | Versi Plugin (opsional)                                                                    |
| `api.description`        | `string?`                 | Deskripsi Plugin (opsional)                                                                |
| `api.source`             | `string`                  | Jalur sumber Plugin                                                                        |
| `api.rootDir`            | `string?`                 | Direktori root Plugin (opsional)                                                           |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori aktif saat tersedia)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus Plugin dari `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger bercakupan (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan pra-entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Resolusi jalur relatif terhadap root plugin                                                |

## Konvensi modul internal

Di dalam plugin Anda, gunakan berkas barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik Plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan berkas entri publik serupa) lebih mengutamakan
snapshot konfigurasi runtime aktif saat OpenClaw sudah berjalan. Jika belum ada
snapshot runtime, permukaan tersebut melakukan fallback ke berkas konfigurasi yang
di-resolve di disk. Facade Plugin bawaan yang dipaketkan harus dimuat melalui pemuat
facade Plugin OpenClaw; impor langsung dari `dist/extensions/...` melewati pemeriksaan
manifest dan sidecar runtime yang digunakan instalasi paket untuk kode milik Plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal Plugin yang sempit saat sebuah
helper sengaja bersifat khusus penyedia dan belum pantas berada di subjalur SDK generik.
Contoh bawaan:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper stream
  header beta Claude dan `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder penyedia,
  helper model default, dan builder penyedia realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder penyedia
  beserta helper onboarding/konfigurasi.

<Warning>
  Kode produksi Extension juga harus menghindari impor
  `openclaw/plugin-sdk/<other-plugin>`. Jika sebuah helper benar-benar dibagikan,
  promosikan helper tersebut ke subjalur SDK netral seperti
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan lain
  yang berorientasi kemampuan alih-alih mengaitkan dua Plugin bersama.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Titik entri" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi namespace `api.runtime` lengkap.
  </Card>
  <Card title="Setup dan konfigurasi" icon="sliders" href="/id/plugins/sdk-setup">
    Pemaketan, manifest, dan skema konfigurasi.
  </Card>
  <Card title="Pengujian" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="Migrasi SDK" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Bermigrasi dari permukaan yang tidak digunakan lagi.
  </Card>
  <Card title="Internal Plugin" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kemampuan.
  </Card>
</CardGroup>
