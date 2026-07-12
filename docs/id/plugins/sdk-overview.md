---
read_when:
    - Anda perlu mengetahui subjalur SDK mana yang harus diimpor.
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar SDK Plugin
x-i18n:
    generated_at: "2026-07-12T14:33:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin adalah kontrak bertipe antara plugin dan inti. Halaman ini merupakan
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan bagi pembuat plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [Integrasi Gateway untuk aplikasi eksternal](/id/gateway/external-apps).
</Note>

<Tip>
Mencari panduan cara penggunaan? Mulailah dengan [Membangun plugin](/id/plugins/building-plugins). Gunakan [Plugin saluran](/id/plugins/sdk-channel-plugins) untuk saluran, [Plugin penyedia](/id/plugins/sdk-provider-plugins) untuk penyedia model, [Plugin backend CLI](/id/plugins/cli-backend-plugins) untuk backend CLI AI lokal, [Plugin harness agen](/id/plugins/sdk-agent-harness) untuk eksekutor agen native, dan [hook Plugin](/id/plugins/hooks) untuk hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subjalur tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subjalur merupakan modul kecil yang mandiri. Hal ini menjaga agar proses awal tetap cepat dan
mencegah masalah dependensi melingkar. Untuk pembantu entri/build khusus saluran,
utamakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan pembantu bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi saluran, publikasikan JSON Schema milik saluran melalui
`openclaw.plugin.json#channelConfigs`. Subjalur `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan pembangun generik. Plugin bawaan OpenClaw
menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema saluran bawaan
yang dipertahankan. Ekspor kompatibilitas yang tidak digunakan lagi tetap tersedia di
`plugin-sdk/channel-config-schema-legacy`; kedua subjalur skema bawaan tersebut bukan
pola untuk plugin baru.

<Warning>
  Jangan mengimpor antarmuka praktis bermerek penyedia atau saluran (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subjalur SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` miliknya sendiri; konsumen inti harus menggunakan barrel lokal
  plugin tersebut atau menambahkan kontrak SDK generik yang sempit ketika kebutuhannya benar-benar
  lintas saluran.

Sejumlah kecil antarmuka pembantu plugin bawaan masih muncul dalam peta ekspor yang
dihasilkan ketika memiliki penggunaan pemilik yang dilacak. Antarmuka tersebut hanya ada untuk
pemeliharaan plugin bawaan dan bukan jalur impor yang direkomendasikan untuk plugin
pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai fasad kompatibilitas yang tidak digunakan lagi untuk penggunaan pemilik yang dilacak. Jangan
menyalin jalur impor tersebut ke plugin baru; sebagai gantinya, gunakan pembantu runtime yang
diinjeksi dan subjalur SDK saluran generik.
</Warning>

## Referensi subjalur

SDK Plugin ditampilkan sebagai sekumpulan subjalur sempit yang dikelompokkan berdasarkan area (entri
plugin, saluran, penyedia, autentikasi, runtime, kapabilitas, memori, dan pembantu
plugin bawaan yang dicadangkan). Untuk katalog lengkap — yang dikelompokkan dan ditautkan — lihat
[Subjalur SDK Plugin](/id/plugins/sdk-subpaths).

Inventaris titik masuk kompilator berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dihasilkan dari
subset publik setelah mengurangi subjalur pengujian/internal lokal repositori yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Jalankan
`pnpm plugin-sdk:surface` untuk mengaudit jumlah ekspor publik. Subjalur publik
yang tidak digunakan lagi, cukup lama, dan tidak digunakan oleh kode produksi ekstensi bawaan
dilacak di `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel
ekspor ulang luas yang tidak digunakan lagi dilacak di
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode
berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                                                              |
| `api.registerWorkerProvider(...)`                | Sewa siklus hidup pekerja cloud                                                   |
| `api.registerModelCatalogProvider(...)`          | Baris katalog model untuk pembuatan teks dan media                                 |
| `api.registerAgentHarness(...)`                  | Eksekutor agen native [Eksperimental](/id/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal                                                       |
| `api.registerChannel(...)`                       | Saluran perpesanan                                                                |
| `api.registerEmbeddingProvider(...)`             | Penyedia embedding vektor yang dapat digunakan kembali                            |
| `api.registerSpeechProvider(...)`                | Sintesis teks-ke-ucapan / STT                                                     |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi waktu nyata secara streaming                                          |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara waktu nyata dupleks                                                    |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video                                                       |
| `api.registerTranscriptSourceProvider(...)`      | Sumber transkrip rapat langsung atau yang diimpor                                 |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                                                                  |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                                                                   |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                                                                   |
| `api.registerWebFetchProvider(...)`              | Penyedia pengambilan / scraping web                                               |
| `api.registerWebSearchProvider(...)`             | Pencarian web                                                                     |
| `api.registerCompactionProvider(...)`            | Backend pemadatan transkrip yang dapat dipasang                                   |

Penyedia pekerja juga harus mendeklarasikan ID-nya dalam `contracts.workerProviders`.
Inti menyimpan intensi persisten sebelum `provision(profile, operationId)`. Penyedia memvalidasi pengaturan sebelum alokasi eksternal dan melempar `WorkerProviderError` untuk penolakan profil permanen. `provision` harus menggunakan kembali sewa yang sama saat ID operasi diulangi.
Inti menyimpan pengaturan profil yang telah divalidasi bersama sewa dan memberikan snapshot tersebut kepada `destroy({ leaseId, profile })`, yang harus idempoten, serta `inspect({ leaseId, profile })`, yang mengembalikan `active`, `destroyed`, atau `unknown`. Hal ini memungkinkan penyedia merutekan panggilan siklus hidup setelah Gateway dimulai ulang atau profil bernama dihapus. Titik akhir SSH menggunakan `SecretRef` untuk `keyRef`, bukan materi kunci sebaris, dan menyertakan `hostKey` dari keluaran penyediaan tepercaya dalam format persis `algorithm base64`, tanpa nama host atau komentar. Inti menyematkan `hostKey` dan tidak pernah memercayai kunci dari koneksi pertama. Penyedia yang membuat `keyRef` dinamis dapat mengimplementasikan `resolveSshIdentity({ leaseId, profile, keyRef })`; jika tersedia, resolver tersebut bersifat otoritatif, sedangkan penyedia tanpa resolver tersebut menggunakan resolver rahasia generik yang dikonfigurasi.
Penyedia dengan sewa yang dapat diperpanjang juga dapat mengimplementasikan `renew(leaseId)`.
`inspect` harus melempar galat pada kegagalan sementara atau yang tidak dapat ditentukan; kembalikan `unknown` hanya untuk ketiadaan yang bersifat otoritatif. Inti menandai catatan lokal aktif sebagai yatim, atau menganggap ketiadaan tersebut sebagai penyelesaian pembongkaran setelah permintaan pemusnahan tersimpan.

Penyedia embedding yang didaftarkan dengan `api.registerEmbeddingProvider(...)` juga harus
dicantumkan dalam `contracts.embeddingProviders` di manifes plugin. Ini adalah
permukaan embedding generik untuk pembuatan vektor yang dapat digunakan kembali. Pencarian memori
dapat menggunakan permukaan penyedia generik ini. Antarmuka lama
`api.registerMemoryEmbeddingProvider(...)` dan
`contracts.memoryEmbeddingProviders` merupakan kompatibilitas yang tidak digunakan lagi sementara
penyedia khusus memori yang ada bermigrasi.

Penyedia khusus memori yang masih mengekspos `batchEmbed(...)` saat runtime tetap menggunakan
kontrak batching per berkas yang ada, kecuali runtime-nya secara eksplisit menetapkan
`sourceWideBatchEmbed: true`. Keikutsertaan ini memungkinkan host memori mengirimkan potongan dari
beberapa berkas memori kotor dan sumber yang diaktifkan dalam satu panggilan `batchEmbed(...)` hingga
batas batch host. Adaptor batch yang mengunggah berkas permintaan JSONL harus
membagi pekerjaan penyedia sebelum mencapai batas ukuran unggahan maupun batas jumlah
permintaan. Penyedia harus mengembalikan satu embedding untuk setiap potongan masukan dalam urutan yang sama dengan
`batch.chunks`; hilangkan tanda tersebut jika penyedia mengharapkan batch lokal per berkas atau
tidak dapat mempertahankan urutan masukan dalam pekerjaan lingkup sumber yang lebih besar.

### Alat dan perintah

Gunakan [`defineToolPlugin`](/id/plugins/tool-plugins) untuk plugin sederhana yang hanya berisi alat
dengan nama alat tetap. Gunakan `api.registerTool(...)` secara langsung untuk plugin campuran
atau pendaftaran alat yang sepenuhnya dinamis.

| Metode                                 | Yang didaftarkan                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerTool(tool, opts?)`        | Alat agen (wajib atau `{ optional: true }`)                                                                                                       |
| `api.registerCommand(def)`             | Perintah khusus (melewati LLM)                                                                                                                    |
| `api.registerNodeHostCommand(command)` | Perintah yang ditangani oleh `openclaw node run`; metadata `agentTool` opsional dapat mengeksposnya sebagai alat yang terlihat oleh agen saat node terhubung |

Perintah plugin dapat menetapkan `agentPromptGuidance` ketika agen memerlukan petunjuk
perutean singkat milik perintah. Jaga agar teks tersebut membahas perintah itu sendiri; jangan tambahkan
kebijakan khusus penyedia atau plugin ke pembangun prompt inti.

Entri panduan dapat berupa string lama, yang berlaku untuk setiap permukaan prompt, atau
entri terstruktur:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` terstruktur dapat mencakup `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, atau `subagent`. `pi_main` tetap merupakan alias yang
tidak digunakan lagi untuk `openclaw_main`. Hilangkan `surfaces` untuk panduan yang sengaja berlaku pada semua permukaan. Jangan
meneruskan array `surfaces` kosong; array tersebut ditolak agar hilangnya cakupan secara tidak sengaja tidak
menjadi teks prompt global.

Instruksi pengembang app-server Codex native lebih ketat daripada permukaan prompt
lainnya: hanya panduan yang secara eksplisit dicakupkan ke `codex_app_server` yang dipromosikan ke
jalur berprioritas lebih tinggi tersebut. Panduan string lama dan panduan terstruktur tanpa cakupan
tetap tersedia bagi permukaan prompt non-Codex demi kompatibilitas.

Perintah host Node dijalankan pada host Node yang terhubung, bukan di dalam
proses Gateway. Jika `agentTool` tersedia, Node menerbitkan deskriptor setelah
berhasil terhubung ke Gateway; Gateway menyediakannya untuk eksekusi agen hanya selama
Node tersebut terhubung dan hanya jika `command` milik deskriptor berada dalam
permukaan perintah Node yang disetujui. Atur `agentTool.defaultPlatforms` untuk memasukkan
perintah yang tidak berbahaya ke dalam daftar izin perintah Node default; jika tidak, wajibkan
`gateway.nodes.allowCommands` eksplisit atau kebijakan pemanggilan Node. `agentTool.name`
harus aman bagi penyedia: diawali dengan huruf, hanya menggunakan huruf, angka,
garis bawah, atau tanda hubung, dan tidak melebihi 64 karakter. Alat Node yang didukung MCP
dapat menetapkan metadata `agentTool.mcp` agar permukaan katalog dan pencarian alat dapat menampilkan
identitas server/alat MCP jarak jauh, tetapi eksekusi tetap dilakukan melalui
perintah Node yang diumumkan.

### Infrastruktur

| Metode                                          | Yang didaftarkan                                              |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | Hook peristiwa                                                |
| `api.registerHttpRoute(params)`                 | Titik akhir HTTP Gateway                                      |
| `api.registerGatewayMethod(name, handler)`      | Metode RPC Gateway                                            |
| `api.registerGatewayDiscoveryService(service)`  | Pengiklan penemuan Gateway lokal                              |
| `api.registerCli(registrar, opts?)`             | Subperintah CLI                                               |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI fitur Node di bawah `openclaw nodes`                      |
| `api.registerService(service)`                  | Layanan latar belakang                                        |
| `api.registerInteractiveHandler(registration)`  | Penangan interaktif                                           |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware hasil alat saat runtime                            |
| `api.registerMemoryPromptSupplement(builder)`   | Bagian prompt tambahan yang berdekatan dengan memori           |
| `api.registerMemoryCorpusSupplement(adapter)`   | Korpus pencarian/pembacaan memori tambahan                    |
| `api.registerHostedMediaResolver(resolver)`     | Penyelesai untuk URL media ter-hosting bergaya peramban        |
| `api.registerTextTransforms(transforms)`        | Penulisan ulang teks kompatibilitas prompt/pesan milik Plugin  |
| `api.registerConfigMigration(migrate)`          | Migrasi konfigurasi ringan yang dijalankan sebelum runtime Plugin dimuat |
| `api.registerMigrationProvider(provider)`       | Pengimpor untuk `openclaw migrate`                             |
| `api.registerAutoEnableProbe(probe)`            | Pemeriksaan konfigurasi yang dapat mengaktifkan Plugin ini secara otomatis |
| `api.registerReload(registration)`              | Kebijakan awalan konfigurasi mulai ulang/hot/noop untuk penanganan pemuatan ulang |
| `api.registerNodeHostCommand(command)`          | Penangan perintah yang disediakan untuk Node yang dipasangkan  |
| `api.registerNodeInvokePolicy(policy)`          | Kebijakan daftar izin/persetujuan untuk perintah yang dipanggil Node |
| `api.registerSecurityAuditCollector(collector)` | Pengumpul temuan untuk `openclaw security audit`               |

Pembangun suplemen prompt memori menerima konteks opsional `agentId`,
`agentSessionKey`, dan `sandboxed`. Panggilan `search` dan `get` pada suplemen
korpus memori menerima konteks opsional `agentId` dan `sandboxed`. Plugin dengan
penyimpanan milik agen harus menyelesaikan penyimpanan tersebut untuk setiap panggilan, bukan
menangkap satu jalur global saat pendaftaran. Jika ID agen diwajibkan tetapi
tidak tersedia dalam operasi multiagen, gagal secara tertutup alih-alih memilih
agen sembarang.

Penangan interaktif Telegram dapat mengembalikan `{ submitText }` untuk merutekan teks melalui
jalur agen masuk normal Telegram setelah penangan berhasil. OpenClaw mempertahankan
tombol panggilan balik ketika kebijakan masuk melewati teks atau pemrosesan gagal, sehingga
pengguna dapat mencoba lagi setelah kondisi yang menghalangi berubah. Bidang hasil ini
khusus untuk Telegram; saluran lain mempertahankan kontrak hasil interaktifnya sendiri.

### Hook host untuk Plugin alur kerja

Hook host adalah sambungan SDK bagi Plugin yang perlu berpartisipasi dalam siklus hidup
host, bukan hanya menambahkan penyedia, saluran, atau alat. Hook ini merupakan
kontrak generik; Mode Rencana dapat menggunakannya, begitu pula alur kerja persetujuan,
gerbang kebijakan ruang kerja, pemantau latar belakang, wisaya penyiapan, dan Plugin pendamping
UI.

| Metode                                                                               | Kontrak yang dimilikinya                                                                                                                                    |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Status sesi milik Plugin yang kompatibel dengan JSON dan diproyeksikan melalui sesi Gateway                                                                 |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Konteks persis-sekali yang tahan lama dan disuntikkan ke giliran agen berikutnya untuk satu sesi                                                            |
| `api.registerTrustedToolPolicy(...)`                                                 | Kebijakan alat tepercaya sebelum Plugin yang dibatasi manifes dan dapat memblokir atau menulis ulang parameter alat                                         |
| `api.registerToolMetadata(...)`                                                      | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                                                             |
| `api.registerCommand(...)`                                                           | Perintah Plugin tercakup; hasil perintah dapat menetapkan `continueAgent: true` atau `suppressReply: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskriptor kontribusi UI Kontrol untuk permukaan sesi, alat, eksekusi, pengaturan, atau tab                                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Panggilan balik pembersihan untuk sumber daya runtime milik Plugin pada jalur pengaturan ulang/penghapusan/pemuatan ulang                                    |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Langganan peristiwa yang disanitasi untuk status alur kerja dan pemantau                                                                                    |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Status sementara Plugin per eksekusi yang dihapus pada siklus hidup eksekusi terminal                                                                       |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadata pembersihan untuk tugas penjadwal milik Plugin; tidak menjadwalkan pekerjaan atau membuat catatan tugas                                             |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Pengiriman lampiran berkas yang dimediasi host khusus bawaan ke rute sesi keluar langsung yang aktif                                                        |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Giliran sesi terjadwal yang didukung Cron dan khusus bawaan, serta pembersihan berbasis tag                                                                  |
| `api.session.controls.registerSessionAction(...)`                                    | Tindakan sesi bertipe yang dapat dikirim klien melalui Gateway                                                                                              |

Deskriptor `surface: "tab"` menambahkan tab bilah sisi ke UI Kontrol. Deskriptor
tab milik Plugin yang aktif diumumkan kepada klien dasbor dalam sapaan gateway
(`controlUiTabs`), sehingga tab hanya muncul ketika Plugin diaktifkan.
Plugin bawaan dapat menyediakan tampilan dasbor kelas satu untuk tabnya; Plugin lain
dapat menetapkan `path` ke rute HTTP Plugin (lihat
`api.registerHttpRoute(...)`) yang dirender dasbor dalam bingkai terisolasi.
`icon` adalah petunjuk nama ikon dasbor, `group` memilih bagian bilah sisi
(`control` atau `agent`), `order` mengurutkan di antara tab Plugin, dan `requiredScopes`
menyembunyikan tab dari koneksi yang tidak memiliki cakupan operator tersebut:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Gunakan namespace yang dikelompokkan untuk kode Plugin baru:

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
sudah tidak dianjurkan bagi Plugin yang ada. Jangan tambahkan kode Plugin baru yang memanggil
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, atau
`api.unscheduleSessionTurnsByTag` secara langsung.

`scheduleSessionTurn(...)` adalah kemudahan yang tercakup sesi di atas penjadwal
Cron Gateway. Cron memiliki pengaturan waktu dan membuat catatan tugas latar belakang ketika
giliran dijalankan; SDK Plugin hanya membatasi sesi target, penamaan milik Plugin,
dan pembersihan. Gunakan `api.runtime.tasks.managedFlows` di dalam giliran terjadwal
ketika pekerjaan itu sendiri memerlukan status Alur Tugas multilangkah yang tahan lama.

Kontrak-kontrak tersebut sengaja memisahkan kewenangan:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah, metadata
  alat, injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya dijalankan sebelum hook `before_tool_call` biasa dan
  dipercaya oleh host. Kebijakan bawaan dijalankan terlebih dahulu; kebijakan Plugin terpasang memerlukan
  pengaktifan eksplisit beserta ID lokalnya dalam
  `contracts.trustedToolPolicies`, lalu dijalankan berikutnya sesuai urutan pemuatan Plugin. ID kebijakan
  tercakup pada Plugin yang mendaftarkannya.
- Kepemilikan perintah yang dicadangkan hanya untuk bawaan. Plugin eksternal harus menggunakan
  nama perintah atau aliasnya sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang memodifikasi prompt, termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  bidang prompt dari `before_agent_start` lama, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Rencana:

| Arketipe Plugin                | Hook yang digunakan                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Alur kerja persetujuan         | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, deskriptor UI                                                              |
| Gerbang kebijakan anggaran/ruang kerja | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                               |
| Pemantau siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan penjadwal sesi, kontribusi prompt Heartbeat, deskriptor UI |
| Panduan penyiapan atau orientasi | Ekstensi sesi, perintah bercakupan, deskriptor Control UI                                                                                  |

<Note>
  Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, meskipun sebuah Plugin mencoba menetapkan
  cakupan metode Gateway yang lebih sempit. Utamakan prefiks khusus Plugin untuk
  metode yang dimiliki Plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil alat">
  Plugin bawaan dan Plugin terpasang yang diaktifkan secara eksplisit dengan
  kontrak manifes yang cocok dapat menggunakan
  `api.registerAgentToolResultMiddleware(...)` ketika perlu menulis ulang hasil
  alat setelah eksekusi dan sebelum runtime memasukkan hasil tersebut kembali
  ke model. Ini adalah titik integrasi tepercaya yang netral terhadap runtime
  untuk pereduksi keluaran asinkron seperti tokenjuice.

Plugin harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap
runtime yang ditargetkan, misalnya `["openclaw", "codex"]`. Plugin terpasang
tanpa kontrak tersebut, atau tanpa pengaktifan eksplisit, tidak dapat
mendaftarkan middleware ini; gunakan hook Plugin OpenClaw biasa untuk pekerjaan
yang tidak memerlukan pengaturan waktu hasil alat sebelum model. Jalur
pendaftaran factory ekstensi lama yang hanya untuk runner tertanam telah
dihapus.
</Accordion>

### Pendaftaran penemuan Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan sebuah Plugin
mengiklankan Gateway aktif melalui transport penemuan lokal seperti
mDNS/Bonjour. OpenClaw memanggil layanan tersebut selama proses mulai Gateway
ketika penemuan lokal diaktifkan, meneruskan port Gateway saat ini dan data
petunjuk TXT yang tidak bersifat rahasia, lalu memanggil handler `stop` yang
dikembalikan selama penghentian Gateway.

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
sebagai rahasia atau autentikasi. Penemuan adalah petunjuk perutean; autentikasi
Gateway dan penyematan TLS tetap menjadi pemilik kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata perintah:

- `commands`: nama perintah eksplisit yang dimiliki pendaftar
- `descriptors`: deskriptor perintah saat penguraian yang digunakan untuk
  bantuan CLI, perutean, dan pendaftaran CLI Plugin secara malas
- `parentPath`: jalur perintah induk opsional untuk grup perintah bertingkat,
  seperti `["nodes"]`

Untuk fitur Node berpasangan, utamakan
`api.registerNodeCliFeature(registrar, opts?)`. Ini adalah pembungkus kecil untuk
`api.registerCli(..., { parentPath: ["nodes"] })` dan menjadikan perintah seperti
`openclaw nodes canvas` sebagai fitur Node milik Plugin secara eksplisit.

Jika Anda ingin perintah Plugin tetap dimuat secara malas di jalur CLI akar
normal, berikan `descriptors` yang mencakup setiap akar perintah tingkat atas
yang diekspos oleh pendaftar tersebut.

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

Perintah bertingkat menerima perintah induk yang telah diresolusi sebagai
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
        description: "Tangkap atau render konten kanvas dari Node berpasangan",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya jika Anda tidak memerlukan pendaftaran CLI akar
secara malas. Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak
memasang placeholder berbasis deskriptor untuk pemuatan malas saat penguraian.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan sebuah Plugin memiliki konfigurasi
bawaan untuk backend CLI AI lokal seperti `claude-cli` atau `my-cli`.

- `id` backend menjadi prefiks penyedia dalam referensi model seperti
  `my-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama dengan
  `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap diutamakan. OpenClaw menggabungkan
  `agents.defaults.cliBackends.<id>` di atas nilai bawaan Plugin sebelum
  menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang
  kompatibilitas setelah penggabungan (misalnya menormalkan bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv bercakupan permintaan
  yang merupakan bagian dari dialek CLI, seperti memetakan tingkat penalaran
  OpenClaw ke flag upaya native. Hook menerima `ctx.executionMode`; gunakan
  `"side-question"` untuk menambahkan flag isolasi native backend bagi
  pemanggilan `/btw` sementara. Jika flag tersebut secara andal menonaktifkan
  alat native untuk CLI yang selain itu selalu aktif, deklarasikan juga
  `sideQuestionToolMode: "disabled"`.
- Backend yang dapat menonaktifkan semua alat native untuk eksekusi tertentu
  dapat mendeklarasikan `nativeToolMode: "selectable"`. Pemanggilan terbatas
  meneruskan tuple `ctx.toolAvailability.native` kosong beserta daftar izin MCP
  yang diisolasi secara tepat oleh host; `resolveExecutionArgs` harus
  memberlakukan keduanya pada argv akhir untuk eksekusi baru maupun lanjutan.
  OpenClaw menolak secara tertutup jika backend tidak dapat melakukannya.

Untuk panduan penulisan menyeluruh, lihat
[Plugin backend CLI](/id/plugins/cli-backend-plugins).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif dalam satu waktu). Callback siklus hidup menerima `runtimeSettings` ketika host dapat menyediakan diagnostik model/penyedia/mode; mesin ketat yang lebih lama dicoba ulang tanpa kunci tersebut. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Penyusun bagian prompt memori                                                                                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Adaptor runtime memori                                                                                                                                                                                            |

### Adaptor embedding memori yang tidak digunakan lagi

| Metode                                         | Yang didaftarkan                              |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptor embedding memori untuk Plugin aktif   |

- `registerMemoryCapability` adalah API Plugin memori eksklusif yang diutamakan.
- `registerMemoryCapability` juga dapat mengekspos
  `publicArtifacts.listArtifacts(...)` sehingga Plugin pendamping dapat
  menggunakan artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core`, alih-alih mengakses tata letak privat
  Plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API Plugin memori eksklusif yang kompatibel
  dengan sistem lama.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi
  `provider/model` yang tepat, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai
  fallback aktif.
- `registerMemoryEmbeddingProvider` tidak digunakan lagi. Penyedia embedding
  baru harus menggunakan `api.registerEmbeddingProvider(...)` dan
  `contracts.embeddingProviders`.
- Penyedia khusus memori yang sudah ada tetap berfungsi selama jendela migrasi,
  tetapi inspeksi Plugin melaporkan hal ini sebagai utang kompatibilitas untuk
  Plugin yang bukan bawaan.

### Peristiwa dan siklus hidup

| Metode                                       | Fungsinya                         |
| -------------------------------------------- | --------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe         |
| `api.onConversationBindingResolved(handler)` | Callback pengikatan percakapan    |

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik
pengaman.

### Semantik keputusan hook

`before_install` adalah hook siklus hidup runtime Plugin, bukan permukaan
kebijakan instalasi operator. Gunakan `security.installPolicy` ketika keputusan
izinkan/blokir harus mencakup jalur instalasi atau pembaruan yang didukung CLI
dan Gateway.

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah akan dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` dianggap tidak memberikan keputusan (sama seperti menghilangkan `block`), bukan sebagai penimpaan.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah akan dilewati.
- `before_install`: mengembalikan `{ block: false }` dianggap tidak memberikan keputusan (sama seperti menghilangkan `block`), bukan sebagai penimpaan.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengambil alih pengiriman, handler dengan prioritas lebih rendah dan jalur pengiriman model bawaan akan dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah akan dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` dianggap tidak memberikan keputusan (sama seperti menghilangkan `cancel`), bukan sebagai penimpaan.
- `message_received`: gunakan bidang bertipe `threadId` saat Anda memerlukan perutean utas/topik masuk. Gunakan `metadata` untuk data tambahan khusus kanal.
- `message_sending`: gunakan bidang perutean bertipe `replyToId` / `threadId` sebelum beralih ke `metadata` khusus kanal.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status awal yang dimiliki Gateway, alih-alih mengandalkan hook internal `gateway:startup`. Cron mungkin masih dalam proses pemuatan pada tahap ini.
- `cron_reconciled`: bangun ulang proyeksi cron eksternal lengkap setelah pemuatan awal atau pemuatan ulang penjadwal. Ini mencakup `reason` dan status efektif `enabled`, termasuk `enabled: false`, sedangkan `ctx.getCron?.()` mengembalikan penjadwal yang telah direkonsiliasi secara persis. Teruskan `ctx.abortSignal` ke pekerjaan proyeksi persisten; pekerjaan tersebut dibatalkan ketika snapshot penjadwal itu digantikan atau Gateway ditutup.
- `cron_changed`: amati perubahan siklus hidup cron yang dimiliki Gateway. Peristiwa `scheduled` dan `removed` merupakan petunjuk rekonsiliasi pascakomit, bukan log delta berurutan. `event.nextRunAtMs` pada peristiwa terjadwal tidak ada ketika pekerjaan tersebut tidak memiliki waktu aktivasi berikutnya; peristiwa penghapusan tetap membawa snapshot pekerjaan yang dihapus.

Penjadwal aktivasi eksternal harus melakukan debounce atau menggabungkan peristiwa `cron_changed`,
lalu membaca ulang tampilan persisten lengkap dari penjadwal yang terakhir ditangkap oleh
`cron_reconciled`. Jangan mengambil penjadwal dari konteks `cron_changed`: petunjuk
terlepas dari penjadwal lama dapat tumpang-tindih dengan pemuatan ulang yang lebih baru.

Gunakan `cron_reconciled` sebagai pemicu snapshot lengkap untuk status persisten yang dimuat saat
Gateway dimulai atau penjadwal diganti. Peristiwa ini tidak diputar ulang untuk pemuatan ulang langsung
yang hanya mencakup Plugin. Handler pengamatan berjalan secara paralel, dan pengiriman
tanpa menunggu hasil dapat tumpang-tindih, sehingga konsumen tidak boleh bergantung pada urutan penyelesaian peristiwa.
Pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

Untuk adaptor eksekusi tunggal dengan penggantian persisten, percobaan ulang/jeda bertahap, dan penghentian
yang bersih, lihat [Proyeksi cron eksternal yang aman](/id/plugins/hooks#safe-external-cron-projection).

### Bidang objek API

| Bidang                   | Tipe                      | Deskripsi                                                                                           |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID Plugin                                                                                           |
| `api.name`               | `string`                  | Nama tampilan                                                                                       |
| `api.version`            | `string?`                 | Versi Plugin (opsional)                                                                             |
| `api.description`        | `string?`                 | Deskripsi Plugin (opsional)                                                                         |
| `api.source`             | `string`                  | Jalur sumber Plugin                                                                                 |
| `api.rootDir`            | `string?`                 | Direktori akar Plugin (opsional)                                                                    |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime aktif dalam memori jika tersedia)                   |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus Plugin dari `plugins.entries.<id>.config`                                        |
| `api.runtime`            | `PluginRuntime`           | [Pembantu runtime](/id/plugins/sdk-runtime)                                                            |
| `api.logger`             | `PluginLogger`            | Pencatat log dengan cakupan (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela pemuatan awal/penyiapan ringan sebelum entri lengkap |
| `api.resolvePath(input)` | `(string) => string`      | Selesaikan jalur relatif terhadap akar Plugin                                                       |

## Konvensi modul internal

Di dalam Plugin Anda, gunakan berkas barrel lokal untuk impor internal:

```text
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Titik masuk Plugin
  setup-entry.ts    # Entri ringan khusus penyiapan (opsional)
```

<Warning>
  Jangan pernah mengimpor Plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik Plugin bawaan yang dimuat melalui fasad (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan berkas entri publik serupa) memprioritaskan
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika snapshot
runtime belum tersedia, permukaan tersebut beralih ke berkas konfigurasi terselesaikan di disk.
Fasad Plugin bawaan yang dikemas harus dimuat melalui pemuat fasad Plugin
milik OpenClaw; impor langsung dari `dist/extensions/...` melewati pemeriksaan manifes
dan sidecar runtime yang digunakan instalasi terkemas untuk kode milik Plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal Plugin yang terbatas ketika suatu
pembantu memang khusus untuk penyedia dan belum semestinya berada dalam subjalur SDK
generik. Contoh bawaan:

- **Anthropic**: batas publik `api.ts` / `contract-api.ts` untuk pembantu aliran
  header beta Claude dan `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor pembangun penyedia,
  pembantu model bawaan, dan pembangun penyedia waktu nyata.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor pembangun penyedia
  beserta pembantu orientasi awal/konfigurasi.

<Warning>
  Kode produksi ekstensi juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika suatu pembantu benar-benar digunakan bersama, pindahkan ke subjalur SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan lain
  yang berorientasi pada kapabilitas, alih-alih menggandengkan dua Plugin.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Titik masuk" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Pembantu runtime" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi lengkap namespace `api.runtime`.
  </Card>
  <Card title="Penyiapan dan konfigurasi" icon="sliders" href="/id/plugins/sdk-setup">
    Pengemasan, manifes, dan skema konfigurasi.
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
