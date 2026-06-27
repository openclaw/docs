---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Referensi peta impor, API pendaftaran, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-06-27T17:59:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK adalah kontrak bertipe antara Plugin dan core. Halaman ini adalah
referensi untuk **apa yang perlu diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini untuk penulis Plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [Integrasi Gateway untuk aplikasi eksternal](/id/gateway/external-apps) sebagai gantinya.
</Note>

<Tip>
Mencari panduan cara kerja? Mulai dengan [Membangun Plugin](/id/plugins/building-plugins), gunakan [Plugin saluran](/id/plugins/sdk-channel-plugins) untuk Plugin saluran, [Plugin penyedia](/id/plugins/sdk-provider-plugins) untuk Plugin penyedia, [Plugin backend CLI](/id/plugins/cli-backend-plugins) untuk backend CLI AI lokal, dan [Hook Plugin](/id/plugins/hooks) untuk Plugin hook alat atau siklus hidup.
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
yang dipertahankan. Ekspor kompatibilitas yang sudah deprecated tetap ada di
`plugin-sdk/channel-config-schema-legacy`; tidak satu pun subpath skema bawaan
merupakan pola untuk Plugin baru.

<Warning>
  Jangan impor seam kemudahan bermerek penyedia atau saluran (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` miliknya sendiri; konsumen core sebaiknya menggunakan barrel
  lokal Plugin tersebut atau menambahkan kontrak SDK generik yang sempit ketika kebutuhan
  benar-benar lintas saluran.

Sekumpulan kecil seam helper Plugin bawaan masih muncul dalam peta ekspor yang
dihasilkan ketika memiliki penggunaan pemilik yang terlacak. Seam tersebut hanya ada
untuk pemeliharaan Plugin bawaan dan bukan jalur impor yang direkomendasikan untuk
Plugin pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai facade kompatibilitas deprecated untuk penggunaan pemilik yang
terlacak. Jangan salin jalur impor tersebut ke Plugin baru; gunakan helper runtime
yang diinjeksi dan subpath SDK saluran generik sebagai gantinya.
</Warning>

## Referensi subpath

Plugin SDK diekspos sebagai sekumpulan subpath sempit yang dikelompokkan menurut area (entry
Plugin, saluran, penyedia, auth, runtime, kapabilitas, memori, dan helper
Plugin bawaan yang dicadangkan). Untuk katalog lengkap — dikelompokkan dan ditautkan — lihat
[Subpath Plugin SDK](/id/plugins/sdk-subpaths).

Inventaris entrypoint compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dihasilkan dari
subset publik setelah mengurangkan subpath repo-lokal pengujian/internal yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Jalankan
`pnpm plugin-sdk:surface` untuk mengaudit jumlah ekspor publik. Subpath publik
deprecated yang sudah cukup lama dan tidak digunakan oleh kode produksi ekstensi bawaan
dilacak di `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel
re-ekspor deprecated yang luas dilacak di
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan
metode berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                  |
| `api.registerAgentHarness(...)`                  | Executor agen level rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal           |
| `api.registerChannel(...)`                       | Saluran pesan                         |
| `api.registerEmbeddingProvider(...)`             | Penyedia embedding vektor yang dapat digunakan ulang    |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming        |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks           |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video           |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                      |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                       |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                       |
| `api.registerWebFetchProvider(...)`              | Penyedia fetch / scrape web           |
| `api.registerWebSearchProvider(...)`             | Pencarian web                         |

Penyedia embedding yang didaftarkan dengan `api.registerEmbeddingProvider(...)` juga harus
dicantumkan dalam `contracts.embeddingProviders` di manifes Plugin. Ini
adalah permukaan embedding generik untuk pembuatan vektor yang dapat digunakan ulang. Pencarian memori
dapat memakai permukaan penyedia generik ini. Seam lama
`api.registerMemoryEmbeddingProvider(...)` dan
`contracts.memoryEmbeddingProviders` adalah kompatibilitas deprecated sementara
penyedia khusus memori yang ada bermigrasi.

Penyedia khusus memori yang masih mengekspos runtime `batchEmbed(...)` tetap berada pada
kontrak batching per file yang ada kecuali runtime mereka secara eksplisit menetapkan
`sourceWideBatchEmbed: true`. Opt-in tersebut memungkinkan host memori mengirim chunk dari
beberapa file memori kotor dan sumber yang diaktifkan dalam satu panggilan `batchEmbed(...)`
hingga batas batch host. Adapter batch yang mengunggah file permintaan JSONL harus
membagi pekerjaan penyedia sebelum batas ukuran unggah dan juga batas jumlah permintaannya.
Penyedia harus mengembalikan satu embedding per chunk input dalam urutan yang sama dengan
`batch.chunks`; hilangkan flag tersebut ketika penyedia mengharapkan batch lokal file atau
tidak dapat mempertahankan urutan input lintas pekerjaan source-wide yang lebih besar.

### Alat dan perintah

Gunakan [`defineToolPlugin`](/id/plugins/tool-plugins) untuk Plugin sederhana yang hanya berisi alat
dengan nama alat tetap. Gunakan `api.registerTool(...)` langsung untuk Plugin campuran
atau pendaftaran alat yang sepenuhnya dinamis.

| Metode                          | Yang didaftarkan                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`) |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)             |

Perintah Plugin dapat menetapkan `agentPromptGuidance` ketika agen memerlukan petunjuk routing
singkat milik perintah. Jaga agar teks tersebut membahas perintah itu sendiri; jangan tambahkan
kebijakan khusus penyedia atau Plugin ke builder prompt core.

Entri panduan dapat berupa string legacy, yang berlaku untuk setiap permukaan prompt, atau
entri terstruktur:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` terstruktur dapat menyertakan `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, atau `subagent`. `pi_main` tetap menjadi alias deprecated
untuk `openclaw_main`. Hilangkan `surfaces` untuk panduan yang sengaja berlaku di semua permukaan. Jangan
meneruskan array `surfaces` kosong; itu ditolak agar kehilangan cakupan yang tidak disengaja
tidak menjadi teks prompt global.

Instruksi developer app-server Codex native lebih ketat daripada permukaan prompt lain:
hanya panduan yang secara eksplisit dicakup ke `codex_app_server` yang dipromosikan ke
lane prioritas lebih tinggi tersebut. Panduan string legacy dan panduan terstruktur tanpa cakupan
tetap tersedia untuk permukaan prompt non-Codex demi kompatibilitas.

### Infrastruktur

| Metode                                         | Yang didaftarkan                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook peristiwa                              |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Advertiser discovery Gateway lokal      |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI fitur Node di bawah `openclaw nodes` |
| `api.registerService(service)`                 | Layanan latar belakang                      |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                     |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware hasil alat runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt tambahan yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memori tambahan      |

### Hook host untuk Plugin workflow

Hook host adalah seam SDK untuk Plugin yang perlu berpartisipasi dalam siklus hidup
host, bukan hanya menambahkan penyedia, saluran, atau alat. Hook ini adalah
kontrak generik; Plan Mode dapat menggunakannya, tetapi workflow persetujuan,
gerbang kebijakan workspace, monitor latar belakang, wizard setup, dan Plugin pendamping UI
juga dapat menggunakannya.

| Metode                                                                               | Kontrak yang dimilikinya                                                                                                           |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | State sesi yang dimiliki Plugin, kompatibel dengan JSON, dan diproyeksikan melalui sesi Gateway                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Konteks tahan lama tepat-sekali yang disuntikkan ke giliran agen berikutnya untuk satu sesi                                        |
| `api.registerTrustedToolPolicy(...)`                                                 | Kebijakan alat tepercaya pra-Plugin yang dibatasi manifest dan dapat memblokir atau menulis ulang parameter alat                  |
| `api.registerToolMetadata(...)`                                                      | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                                    |
| `api.registerCommand(...)`                                                           | Perintah Plugin tercakup; hasil perintah dapat menetapkan `continueAgent: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskriptor kontribusi UI Kontrol untuk permukaan sesi, alat, run, atau pengaturan                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback pembersihan untuk resource runtime yang dimiliki Plugin pada jalur reset/hapus/muat ulang                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Langganan peristiwa yang disanitasi untuk state workflow dan monitor                                                               |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | State scratch Plugin per-run yang dibersihkan pada siklus hidup run terminal                                                       |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadata pembersihan untuk pekerjaan penjadwal yang dimiliki Plugin; tidak menjadwalkan pekerjaan atau membuat rekaman tugas       |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Pengiriman lampiran file yang dimediasi host dan hanya-bundled ke rute sesi direct-outbound aktif                                  |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Giliran sesi terjadwal berbasis Cron yang hanya-bundled plus pembersihan berbasis tag                                              |
| `api.session.controls.registerSessionAction(...)`                                    | Aksi sesi bertipe yang dapat dikirim klien melalui Gateway                                                                         |

Gunakan namespace terkelompok untuk kode Plugin baru:

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

Metode datar yang ekuivalen tetap tersedia sebagai alias kompatibilitas yang
tidak digunakan lagi untuk Plugin yang sudah ada. Jangan tambahkan kode Plugin
baru yang memanggil `api.registerSessionExtension`,
`api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`,
`api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`,
`api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`,
`api.clearRunContext`, `api.registerSessionSchedulerJob`,
`api.registerSessionAction`, `api.sendSessionAttachment`,
`api.scheduleSessionTurn`, atau `api.unscheduleSessionTurnsByTag` secara
langsung.

`scheduleSessionTurn(...)` adalah kemudahan bercakupan sesi di atas penjadwal
Cron Gateway. Cron memiliki timing dan membuat rekaman tugas latar belakang saat
giliran dijalankan; Plugin SDK hanya membatasi sesi target, penamaan yang
dimiliki Plugin, dan pembersihan. Gunakan `api.runtime.tasks.managedFlows` di
dalam giliran terjadwal saat pekerjaan itu sendiri membutuhkan state Task Flow
multi-langkah yang tahan lama.

Kontrak ini sengaja memisahkan otoritas:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah,
  metadata alat, injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan
  dipercaya host. Kebijakan bundled berjalan lebih dulu; kebijakan
  Plugin-terpasang memerlukan pengaktifan eksplisit plus id lokalnya dalam
  `contracts.trustedToolPolicies`, dan berjalan berikutnya sesuai urutan muat
  Plugin. Id kebijakan dicakup ke Plugin yang mendaftarkannya.
- Kepemilikan perintah yang dicadangkan hanya untuk bundled. Plugin eksternal
  harus menggunakan nama perintah atau aliasnya sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang memutasi prompt termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  field prompt dari `before_agent_start` legacy, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Plan:

| Arketipe Plugin            | Hook yang digunakan                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow persetujuan       | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, deskriptor UI                                                         |
| Gerbang kebijakan anggaran/workspace | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                               |
| Monitor siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan penjadwal sesi, kontribusi prompt Heartbeat, deskriptor UI |
| Wizard penyiapan atau onboarding | Ekstensi sesi, perintah tercakup, deskriptor UI Kontrol                                                                              |

<Note>
  Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, bahkan jika sebuah Plugin mencoba
  menetapkan cakupan metode gateway yang lebih sempit. Utamakan prefiks khusus
  Plugin untuk metode yang dimiliki Plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  Plugin bundled dan Plugin terpasang yang diaktifkan secara eksplisit dengan
  kontrak manifest yang cocok dapat menggunakan
  `api.registerAgentToolResultMiddleware(...)` saat perlu menulis ulang hasil
  alat setelah eksekusi dan sebelum runtime memasukkan hasil tersebut kembali
  ke model. Ini adalah seam tepercaya yang netral runtime untuk reducer output
  async seperti tokenjuice.

Plugin harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap
runtime target, misalnya `["openclaw", "codex"]`. Plugin terpasang tanpa
kontrak tersebut, atau tanpa pengaktifan eksplisit, tidak dapat mendaftarkan
middleware ini; pertahankan hook Plugin OpenClaw normal untuk pekerjaan yang
tidak membutuhkan timing hasil alat pra-model. Jalur pendaftaran factory
ekstensi lama yang hanya untuk embedded-runner telah dihapus.
</Accordion>

### Pendaftaran discovery Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengiklankan
Gateway aktif pada transport discovery lokal seperti mDNS/Bonjour. OpenClaw
memanggil layanan selama startup Gateway saat discovery lokal diaktifkan,
meneruskan port Gateway saat ini dan data petunjuk TXT non-rahasia, lalu
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

Plugin discovery Gateway tidak boleh memperlakukan nilai TXT yang diiklankan
sebagai rahasia atau autentikasi. Discovery adalah petunjuk routing; autentikasi
Gateway dan TLS pinning tetap memiliki trust.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata perintah:

- `commands`: nama perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: deskriptor perintah waktu-parse yang digunakan untuk bantuan
  CLI, routing, dan pendaftaran CLI Plugin lazy
- `parentPath`: path perintah induk opsional untuk grup perintah bertingkat,
  seperti `["nodes"]`

Untuk fitur paired-node, utamakan
`api.registerNodeCliFeature(registrar, opts?)`. Ini adalah wrapper kecil di
sekitar `api.registerCli(..., { parentPath: ["nodes"] })` dan menjadikan
perintah seperti `openclaw nodes canvas` sebagai fitur node yang dimiliki
Plugin secara eksplisit.

Jika Anda ingin perintah Plugin tetap dimuat secara lazy di jalur CLI root
normal, sediakan `descriptors` yang mencakup setiap root perintah tingkat atas
yang diekspos oleh registrar tersebut.

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

Perintah bertingkat menerima perintah induk yang terselesaikan sebagai
`program`:

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

Gunakan `commands` saja hanya ketika Anda tidak membutuhkan pendaftaran CLI
root lazy. Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak
memasang placeholder berbasis deskriptor untuk pemuatan lazy waktu-parse.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan Plugin memiliki konfigurasi default
untuk backend CLI AI lokal seperti `claude-cli` atau `my-cli`.

- `id` backend menjadi prefiks provider dalam referensi model seperti `my-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default Plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` saat backend membutuhkan penulisan ulang
  kompatibilitas setelah penggabungan (misalnya menormalisasi bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv bercakupan
  permintaan yang termasuk dalam dialek CLI, seperti memetakan level berpikir
  OpenClaw ke flag effort native. Hook menerima `ctx.executionMode`; gunakan
  `"side-question"` untuk menambahkan flag isolasi backend-native untuk
  panggilan `/btw` efemeral. Jika flag tersebut secara andal menonaktifkan alat
  native untuk CLI yang sebaliknya selalu aktif, deklarasikan juga
  `sideQuestionToolMode: "disabled"`.

Untuk panduan penulisan end-to-end, lihat
[Plugin backend CLI](/id/plugins/cli-backend-plugins).

### Slot eksklusif

| Metode                                     | Yang didaftarkannya                                                                                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback siklus hidup menerima `runtimeSettings` saat host dapat menyediakan diagnostik model/penyedia/mode; mesin ketat yang lebih lama dicoba ulang tanpa kunci tersebut. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                                                                |

### Adapter embedding memori yang tidak digunakan lagi

| Metode                                         | Yang didaftarkannya                              |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk plugin aktif      |

- `registerMemoryCapability` adalah API plugin memori eksklusif yang lebih disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  sehingga plugin pendamping dapat mengonsumsi artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih mengakses tata letak privat
  plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memori eksklusif yang kompatibel dengan legacy.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi `provider/model`
  yang tepat, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback aktif.
- `registerMemoryEmbeddingProvider` tidak digunakan lagi. Penyedia embedding baru
  sebaiknya menggunakan `api.registerEmbeddingProvider(...)` dan
  `contracts.embeddingProviders`.
- Penyedia khusus memori yang sudah ada tetap berfungsi selama jendela migrasi,
  tetapi laporan inspeksi plugin melaporkan ini sebagai utang kompatibilitas untuk
  plugin yang tidak dibundel.

### Peristiwa dan siklus hidup

| Metode                                       | Fungsinya                     |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe     |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan   |

Lihat [Hook plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik
guard.

### Semantik keputusan hook

`before_install` adalah hook siklus hidup runtime plugin, bukan permukaan kebijakan
instal operator. Gunakan `security.installPolicy` saat keputusan izinkan/blokir harus
mencakup jalur instal atau pembaruan yang didukung CLI dan Gateway.

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler berprioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler berprioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan field bertipe `threadId` saat Anda memerlukan perutean thread/topik masuk. Simpan `metadata` untuk tambahan khusus kanal.
- `message_sending`: gunakan field perutean bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus kanal.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup milik gateway alih-alih bergantung pada hook internal `gateway:startup`.
- `cron_changed`: amati perubahan siklus hidup cron milik gateway. Gunakan `event.job?.state?.nextRunAtMs` dan `ctx.getCron?.()` saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                                |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                     |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                 |
| `api.source`             | `string`                  | Path sumber plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori aktif saat tersedia)           |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger berskop (`debug`, `info`, `warn`, `error`)                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan pra-entri-penuh |
| `api.resolvePath(input)` | `(string) => string`      | Resolve path relatif terhadap root plugin                                                   |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Rutekan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Path SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik plugin bundel yang dimuat facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) lebih memilih
snapshot konfigurasi runtime aktif saat OpenClaw sudah berjalan. Jika belum ada
snapshot runtime, mereka fallback ke file konfigurasi yang di-resolve di disk.
Facade plugin bundel terpaket sebaiknya dimuat melalui loader facade plugin
OpenClaw; impor langsung dari `dist/extensions/...` melewati pemeriksaan manifes
dan sidecar runtime yang digunakan instalasi terpaket untuk kode milik plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal-plugin yang sempit saat
helper secara sengaja khusus untuk penyedia dan belum termasuk dalam subpath SDK
generik. Contoh yang dibundel:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper stream
  beta-header Claude dan `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder penyedia,
  helper model default, dan builder penyedia realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder penyedia
  serta helper onboarding/konfigurasi.

<Warning>
  Kode produksi ekstensi juga sebaiknya menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika helper benar-benar dibagikan, promosikan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  lain yang berorientasi kapabilitas alih-alih menggandengkan dua plugin.
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
    Pengemasan, manifes, dan skema konfigurasi.
  </Card>
  <Card title="Pengujian" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="Migrasi SDK" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Bermigrasi dari permukaan yang tidak digunakan lagi.
  </Card>
  <Card title="Internal plugin" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kapabilitas.
  </Card>
</CardGroup>
