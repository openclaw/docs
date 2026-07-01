---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor
    - Anda memerlukan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-07-01T20:36:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin adalah kontrak bertipe antara plugin dan core. Halaman ini adalah
referensi untuk **apa yang perlu diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan untuk penulis plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, tugas CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [Integrasi Gateway untuk aplikasi eksternal](/id/gateway/external-apps) sebagai gantinya.
</Note>

<Tip>
Mencari panduan cara pakai? Mulailah dengan [Membangun plugin](/id/plugins/building-plugins), gunakan [Plugin channel](/id/plugins/sdk-channel-plugins) untuk plugin channel, [Plugin provider](/id/plugins/sdk-provider-plugins) untuk plugin provider, [Plugin backend CLI](/id/plugins/cli-backend-plugins) untuk backend CLI AI lokal, dan [Hook plugin](/id/plugins/hooks) untuk plugin hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi melingkar. Untuk helper entry/build khusus channel,
utamakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi channel, publikasikan JSON Schema milik channel melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan OpenClaw
menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema retained
channel bawaan. Ekspor kompatibilitas yang sudah usang tetap ada di
`plugin-sdk/channel-config-schema-legacy`; tidak satu pun subpath skema bawaan merupakan
pola untuk plugin baru.

<Warning>
  Jangan impor seam kemudahan berlabel provider atau channel (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` miliknya sendiri; konsumen core sebaiknya menggunakan barrel lokal plugin
  tersebut atau menambahkan kontrak SDK generik yang sempit saat kebutuhan benar-benar
  lintas-channel.

Sekumpulan kecil seam helper plugin bawaan masih muncul di peta ekspor yang dihasilkan
ketika memiliki penggunaan owner yang dilacak. Seam tersebut hanya ada untuk pemeliharaan
plugin bawaan dan bukan path impor yang direkomendasikan untuk plugin pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai fasad kompatibilitas yang sudah usang untuk penggunaan owner yang dilacak. Jangan
menyalin path impor tersebut ke plugin baru; gunakan helper runtime yang disuntikkan dan
subpath SDK channel generik sebagai gantinya.
</Warning>

## Referensi subpath

SDK plugin diekspos sebagai serangkaian subpath sempit yang dikelompokkan menurut area (entry
plugin, channel, provider, auth, runtime, kapabilitas, memori, dan helper
plugin bawaan yang dicadangkan). Untuk katalog lengkap yang dikelompokkan dan ditautkan, lihat
[Subpath SDK Plugin](/id/plugins/sdk-subpaths).

Inventaris entrypoint compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dihasilkan dari
subset publik setelah mengurangkan subpath pengujian/internal lokal repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Jalankan
`pnpm plugin-sdk:surface` untuk mengaudit jumlah ekspor publik. Subpath publik usang
yang sudah cukup lama dan tidak digunakan oleh kode produksi ekstensi bawaan
dilacak di `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel re-export
usang yang luas dilacak di
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkannya                  |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                 |
| `api.registerAgentHarness(...)`                  | Eksekutor agen tingkat rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal          |
| `api.registerChannel(...)`                       | Channel perpesanan                   |
| `api.registerEmbeddingProvider(...)`             | Provider embedding vektor yang dapat digunakan ulang |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming       |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks          |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video          |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                     |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                      |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                      |
| `api.registerWebFetchProvider(...)`              | Provider fetch / scrape web          |
| `api.registerWebSearchProvider(...)`             | Pencarian web                        |

Provider embedding yang didaftarkan dengan `api.registerEmbeddingProvider(...)` juga harus
dicantumkan dalam `contracts.embeddingProviders` di manifes plugin. Ini
adalah permukaan embedding generik untuk pembuatan vektor yang dapat digunakan ulang. Pencarian memori
dapat memakai permukaan provider generik ini. Seam
`api.registerMemoryEmbeddingProvider(...)` dan
`contracts.memoryEmbeddingProviders` yang lebih lama adalah kompatibilitas usang sementara
provider khusus memori yang ada bermigrasi.

Provider khusus memori yang masih mengekspos runtime `batchEmbed(...)` tetap berada pada
kontrak batching per-file yang ada kecuali runtime-nya secara eksplisit mengatur
`sourceWideBatchEmbed: true`. Opt-in tersebut memungkinkan host memori mengirim chunk dari
beberapa file memori dirty dan sumber yang diaktifkan dalam satu panggilan `batchEmbed(...)` hingga
batas batch host. Adapter batch yang mengunggah file permintaan JSONL harus
membagi tugas provider sebelum batas ukuran unggah serta batas jumlah permintaannya.
Provider harus mengembalikan satu embedding per chunk input dalam urutan yang sama dengan
`batch.chunks`; hilangkan flag ini ketika provider mengharapkan batch lokal-file atau
tidak dapat mempertahankan urutan input di seluruh tugas source-wide yang lebih besar.

### Alat dan perintah

Gunakan [`defineToolPlugin`](/id/plugins/tool-plugins) untuk plugin sederhana khusus alat
dengan nama alat tetap. Gunakan `api.registerTool(...)` secara langsung untuk plugin campuran
atau pendaftaran alat yang sepenuhnya dinamis.

| Metode                         | Yang didaftarkannya                         |
| ------------------------------ | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`) |
| `api.registerCommand(def)`     | Perintah kustom (melewati LLM)              |

Perintah plugin dapat mengatur `agentPromptGuidance` saat agen membutuhkan petunjuk routing singkat
milik perintah. Pertahankan teks tersebut tentang perintah itu sendiri; jangan tambahkan
kebijakan khusus provider atau plugin ke builder prompt core.

Entri panduan dapat berupa string legacy, yang berlaku untuk setiap permukaan prompt, atau
entri terstruktur:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` terstruktur dapat mencakup `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, atau `subagent`. `pi_main` tetap menjadi alias usang
untuk `openclaw_main`. Hilangkan `surfaces` untuk panduan semua permukaan yang disengaja. Jangan
meneruskan array `surfaces` kosong; itu ditolak agar hilangnya cakupan secara tidak sengaja
tidak menjadi teks prompt global.

Instruksi developer app-server Codex native lebih ketat daripada permukaan prompt lainnya:
hanya panduan yang secara eksplisit dicakupkan ke `codex_app_server` yang dipromosikan ke
lane berprioritas lebih tinggi tersebut. Panduan string legacy dan panduan terstruktur tanpa cakupan
tetap tersedia untuk permukaan prompt non-Codex demi kompatibilitas.

### Infrastruktur

| Metode                                         | Yang didaftarkannya                    |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook peristiwa                         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                     |
| `api.registerGatewayDiscoveryService(service)` | Pengiklan penemuan Gateway lokal      |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                        |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI fitur Node di bawah `openclaw nodes` |
| `api.registerService(service)`                 | Layanan latar belakang                 |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                     |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware hasil-alat runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt tambahan yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memori tambahan  |

### Hook host untuk plugin workflow

Hook host adalah seam SDK untuk plugin yang perlu berpartisipasi dalam siklus hidup
host, bukan hanya menambahkan provider, channel, atau alat. Hook ini adalah
kontrak generik; Plan Mode dapat menggunakannya, tetapi begitu juga workflow persetujuan,
gate kebijakan workspace, monitor latar belakang, wizard penyiapan, dan plugin pendamping
UI.

| Metode                                                                               | Kontrak yang dimilikinya                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Status sesi milik Plugin yang kompatibel JSON dan diproyeksikan melalui sesi Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Konteks tahan lama tepat-sekali yang disuntikkan ke giliran agen berikutnya untuk satu sesi                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Kebijakan alat tepercaya pra-Plugin yang dibatasi manifes dan dapat memblokir atau menulis ulang parameter alat                                                                        |
| `api.registerToolMetadata(...)`                                                      | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                                                     |
| `api.registerCommand(...)`                                                           | Perintah Plugin berlingkup; hasil perintah dapat menetapkan `continueAgent: true` atau `suppressReply: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskriptor kontribusi UI kontrol untuk permukaan sesi, alat, run, atau pengaturan                                                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback pembersihan untuk sumber daya runtime milik Plugin pada jalur reset/hapus/muat ulang                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Langganan peristiwa yang disanitasi untuk status alur kerja dan pemantau                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Status scratch Plugin per-run yang dibersihkan pada siklus hidup run terminal                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadata pembersihan untuk job penjadwal milik Plugin; tidak menjadwalkan pekerjaan atau membuat rekaman tugas                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Pengiriman lampiran file khusus bawaan yang dimediasi host ke rute sesi direct-outbound aktif                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Giliran sesi terjadwal berbasis Cron khusus bawaan plus pembersihan berbasis tag                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Tindakan sesi bertipe yang dapat dikirim klien melalui Gateway                                                                                             |

Gunakan namespace berkelompok untuk kode Plugin baru:

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

Metode flat yang setara tetap tersedia sebagai alias kompatibilitas yang
tidak digunakan lagi untuk Plugin yang sudah ada. Jangan tambahkan kode Plugin
baru yang memanggil `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, atau
`api.unscheduleSessionTurnsByTag` secara langsung.

`scheduleSessionTurn(...)` adalah kemudahan berlingkup sesi di atas penjadwal
Cron Gateway. Cron memiliki pewaktuan dan membuat rekaman tugas latar belakang
saat giliran berjalan; Plugin SDK hanya membatasi sesi target, penamaan milik
Plugin, dan pembersihan. Gunakan `api.runtime.tasks.managedFlows` di dalam
giliran terjadwal saat pekerjaan itu sendiri memerlukan status Task Flow
multi-langkah yang tahan lama.

Kontrak sengaja memisahkan otoritas:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah,
  metadata alat, injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan
  dipercaya host. Kebijakan bawaan berjalan lebih dulu; kebijakan Plugin
  terpasang memerlukan pengaktifan eksplisit plus id lokalnya di
  `contracts.trustedToolPolicies`, dan berjalan berikutnya dalam urutan
  pemuatan Plugin. Id kebijakan berlingkup pada Plugin yang mendaftarkannya.
- Kepemilikan perintah yang dicadangkan hanya untuk bawaan. Plugin eksternal
  sebaiknya menggunakan nama perintah atau aliasnya sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang mengubah prompt termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  bidang prompt dari `before_agent_start` lama, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Plan:

| Arketipe Plugin             | Hook yang digunakan                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alur kerja persetujuan            | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, deskriptor UI                                                            |
| Gerbang kebijakan anggaran/workspace | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                                 |
| Pemantau siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan penjadwal sesi, kontribusi prompt Heartbeat, deskriptor UI |
| Wizard setup atau onboarding   | Ekstensi sesi, perintah berlingkup, deskriptor UI Kontrol                                                                              |

<Note>
  Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, bahkan jika sebuah Plugin mencoba
  menetapkan lingkup metode Gateway yang lebih sempit. Utamakan prefiks khusus
  Plugin untuk metode milik Plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil alat">
  Plugin bawaan dan Plugin terpasang yang diaktifkan secara eksplisit dengan
  kontrak manifes yang cocok dapat menggunakan `api.registerAgentToolResultMiddleware(...)`
  saat perlu menulis ulang hasil alat setelah eksekusi dan sebelum runtime
  memasukkan hasil itu kembali ke model. Ini adalah seam tepercaya yang netral
  terhadap runtime untuk reducer output asinkron seperti tokenjuice.

Plugin harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap
runtime yang ditargetkan, misalnya `["openclaw", "codex"]`. Plugin terpasang
tanpa kontrak itu, atau tanpa pengaktifan eksplisit, tidak dapat mendaftarkan
middleware ini; pertahankan hook Plugin OpenClaw normal untuk pekerjaan yang
tidak memerlukan pewaktuan hasil alat pra-model. Jalur pendaftaran factory
ekstensi lama yang hanya untuk embedded-runner telah dihapus.
</Accordion>

### Pendaftaran penemuan Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengiklankan
Gateway aktif pada transport penemuan lokal seperti mDNS/Bonjour. OpenClaw
memanggil layanan selama startup Gateway saat penemuan lokal diaktifkan,
meneruskan port Gateway saat ini dan data petunjuk TXT non-rahasia, serta
memanggil handler `stop` yang dikembalikan selama shutdown Gateway.

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
sebagai rahasia atau autentikasi. Penemuan adalah petunjuk perutean; auth
Gateway dan pinning TLS tetap memiliki kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata perintah:

- `commands`: nama perintah eksplisit yang dimiliki registrar
- `descriptors`: deskriptor perintah waktu-parse yang digunakan untuk bantuan
  CLI, perutean, dan pendaftaran CLI Plugin secara malas
- `parentPath`: jalur perintah induk opsional untuk grup perintah bersarang,
  seperti `["nodes"]`

Untuk fitur paired-node, utamakan
`api.registerNodeCliFeature(registrar, opts?)`. Ini adalah wrapper kecil di
sekitar `api.registerCli(..., { parentPath: ["nodes"] })` dan membuat perintah
seperti `openclaw nodes canvas` menjadi fitur node milik Plugin yang eksplisit.

Jika Anda ingin perintah Plugin tetap dimuat malas di jalur CLI root normal,
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

Perintah bersarang menerima perintah induk yang telah di-resolve sebagai `program`:

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

Gunakan `commands` saja hanya saat Anda tidak memerlukan pendaftaran CLI root
malas. Jalur kompatibilitas eager itu tetap didukung, tetapi tidak memasang
placeholder berbasis deskriptor untuk pemuatan malas waktu-parse.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan Plugin memiliki konfigurasi default
untuk backend CLI AI lokal seperti `claude-cli` atau `my-cli`.

- `id` backend menjadi prefiks penyedia dalam ref model seperti `my-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama dengan `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalkan bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv bercakupan permintaan yang menjadi bagian dari
  dialek CLI, seperti memetakan level berpikir OpenClaw ke flag upaya native.
  Hook menerima `ctx.executionMode`; gunakan `"side-question"` untuk menambahkan
  flag isolasi native-backend bagi panggilan `/btw` sementara. Jika flag tersebut
  secara andal menonaktifkan tool native untuk CLI yang sebaliknya selalu aktif, deklarasikan
  `sideQuestionToolMode: "disabled"` juga.

Untuk panduan penulisan end-to-end, lihat
[Plugin backend CLI](/id/plugins/cli-backend-plugins).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine konteks (satu aktif pada satu waktu). Callback siklus hidup menerima `runtimeSettings` ketika host dapat menyediakan diagnostik model/penyedia/mode; engine ketat lama dicoba ulang tanpa kunci tersebut. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                                                             |

### Adapter embedding memori yang tidak digunakan lagi

| Metode                                         | Yang didaftarkan                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk plugin aktif |

- `registerMemoryCapability` adalah API Plugin memori eksklusif yang disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  sehingga plugin pendamping dapat menggunakan artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih masuk ke tata letak privat
  plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API Plugin memori eksklusif yang kompatibel dengan legacy.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi `provider/model`
  persis, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback aktif.
- `registerMemoryEmbeddingProvider` tidak digunakan lagi. Penyedia embedding baru
  harus menggunakan `api.registerEmbeddingProvider(...)` dan
  `contracts.embeddingProviders`.
- Penyedia khusus memori yang sudah ada tetap berfungsi selama jendela migrasi,
  tetapi laporan inspeksi plugin menandai ini sebagai utang kompatibilitas untuk
  plugin yang tidak dibundel.

### Event dan siklus hidup

| Metode                                       | Yang dilakukan                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe          |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan |

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik
guard.

### Semantik keputusan hook

`before_install` adalah hook siklus hidup runtime-plugin, bukan permukaan kebijakan
instal operator. Gunakan `security.installPolicy` ketika keputusan izinkan/blokir harus
mencakup jalur instal atau pembaruan yang didukung CLI dan Gateway.

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler berprioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan field bertipe `threadId` ketika Anda membutuhkan routing thread/topik masuk. Simpan `metadata` untuk tambahan khusus channel.
- `message_sending`: gunakan field routing bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus channel.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup milik gateway alih-alih bergantung pada hook internal `gateway:startup`.
- `cron_changed`: amati perubahan siklus hidup Cron milik gateway. Gunakan `event.job?.state?.nextRunAtMs` dan `ctx.getCron?.()` saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                                |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                   |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                               |
| `api.source`             | `string`                  | Jalur sumber plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori aktif jika tersedia)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger bercakupan (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Resolve jalur relatif terhadap root plugin                                                        |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Titik masuk plugin
  setup-entry.ts    # Entri khusus setup ringan (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya kontrak eksternal.
</Warning>

Permukaan publik plugin bundel yang dimuat facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) lebih memilih
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika belum ada snapshot
runtime, permukaan tersebut fallback ke file konfigurasi yang di-resolve di disk.
Facade plugin bundel yang dipaketkan harus dimuat melalui loader facade plugin
OpenClaw; impor langsung dari `dist/extensions/...` melewati pemeriksaan manifest
dan sidecar runtime yang digunakan instalasi terpaket untuk kode milik plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal-plugin yang sempit ketika
helper memang khusus penyedia dan belum seharusnya berada di subjalur SDK generik.
Contoh bundel:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper stream
  beta-header Claude dan `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder penyedia,
  helper model default, dan builder penyedia realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder penyedia
  plus helper onboarding/konfigurasi.

<Warning>
  Kode produksi ekstensi juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika helper benar-benar dibagikan, promosikan ke subjalur SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kapabilitas lain alih-alih mengikat dua plugin bersama.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Titik masuk" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi namespace `api.runtime` lengkap.
  </Card>
  <Card title="Setup dan konfigurasi" icon="sliders" href="/id/plugins/sdk-setup">
    Packaging, manifest, dan skema konfigurasi.
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
