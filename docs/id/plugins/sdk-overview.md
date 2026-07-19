---
read_when:
    - Anda perlu mengetahui subjalur SDK mana yang harus diimpor.
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar SDK Plugin
x-i18n:
    generated_at: "2026-07-19T05:06:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 783bafd34098e5d77aab8e574b6518f5df91ba622c9736aef8addff4914f3a9f
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK plugin adalah kontrak bertipe antara plugin dan inti. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan bagi pembuat plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, tugas CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [Integrasi Gateway untuk aplikasi eksternal](/id/gateway/external-apps).
</Note>

<Tip>
Mencari panduan cara penggunaan? Mulailah dengan [Membangun plugin](/id/plugins/building-plugins). Gunakan [Plugin saluran](/id/plugins/sdk-channel-plugins) untuk saluran, [Plugin penyedia](/id/plugins/sdk-provider-plugins) untuk penyedia model, [Plugin backend CLI](/id/plugins/cli-backend-plugins) untuk backend CLI AI lokal, [Plugin harness agen](/id/plugins/sdk-agent-harness) untuk eksekutor agen native, dan [Hook plugin](/id/plugins/hooks) untuk hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Hal ini menjaga proses awal tetap cepat dan
mencegah masalah dependensi melingkar. Untuk pembantu entri/build khusus saluran,
utamakan `openclaw/plugin-sdk/channel-core`; pertahankan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan pembantu bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi saluran, publikasikan JSON Schema milik saluran melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan OpenClaw
menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema saluran bawaan
yang dipertahankan. Ekspor kompatibilitas yang tidak digunakan lagi tetap berada di
`plugin-sdk/channel-config-schema-legacy`; kedua subpath skema bawaan tersebut bukan
pola untuk plugin baru.

<Warning>
  Jangan mengimpor jalur praktis bermerek penyedia atau saluran (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` miliknya sendiri; konsumen inti sebaiknya menggunakan barrel
  lokal plugin tersebut atau menambahkan kontrak SDK generik yang sempit ketika kebutuhan
  benar-benar berlaku lintas saluran.

Sejumlah kecil jalur pembantu plugin bawaan masih muncul dalam peta ekspor yang
dihasilkan jika jalur tersebut memiliki penggunaan oleh pemilik yang terlacak. Jalur tersebut hanya ada untuk
pemeliharaan plugin bawaan dan bukan jalur impor yang direkomendasikan bagi plugin
pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai fasad kompatibilitas yang tidak digunakan lagi untuk penggunaan oleh pemilik yang terlacak. Jangan
menyalin jalur impor tersebut ke plugin baru; sebagai gantinya, gunakan pembantu runtime
yang diinjeksi dan subpath SDK saluran generik.
</Warning>

## Referensi subpath

SDK plugin diekspos sebagai sekumpulan subpath sempit yang dikelompokkan berdasarkan area (entri
plugin, saluran, penyedia, autentikasi, runtime, kapabilitas, memori, dan pembantu
plugin bawaan yang dicadangkan). Untuk katalog lengkap—yang dikelompokkan dan diberi tautan—lihat
[Subpath SDK plugin](/id/plugins/sdk-subpaths).

Inventaris titik masuk compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dihasilkan dari
subset publik setelah mengurangi subpath pengujian/internal lokal repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Jalankan
`pnpm plugin-sdk:surface` untuk mengaudit jumlah ekspor publik. Subpath publik usang
yang sudah cukup lama dan tidak digunakan oleh kode produksi ekstensi bawaan
dilacak di `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel
ekspor ulang usang yang luas dilacak di
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode
berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                                                              |
| `api.registerWorkerProvider(...)`                | Lease siklus hidup pekerja cloud                                                  |
| `api.registerModelCatalogProvider(...)`          | Baris katalog model untuk pembuatan teks dan media                                 |
| `api.registerAgentHarness(...)`                  | Eksekutor agen native [Eksperimental](/id/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal                                                       |
| `api.registerChannel(...)`                       | Saluran perpesanan                                                                |
| `api.registerEmbeddingProvider(...)`             | Penyedia embedding vektor yang dapat digunakan kembali                            |
| `api.registerSpeechProvider(...)`                | Sintesis teks-ke-ucapan / STT                                                     |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi waktu nyata streaming                                                  |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara waktu nyata dupleks                                                    |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video                                                       |
| `api.registerTranscriptSourceProvider(...)`      | Sumber transkrip rapat langsung atau yang diimpor                                 |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                                                                  |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                                                                   |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                                                                   |
| `api.registerWebFetchProvider(...)`              | Penyedia pengambilan / scraping web                                               |
| `api.registerWebSearchProvider(...)`             | Pencarian web                                                                     |
| `api.registerCompactionProvider(...)`            | Backend compaction transkrip yang dapat dipasang                                  |

Penyedia pekerja juga harus mendeklarasikan id-nya di `contracts.workerProviders`.
Inti menyimpan maksud persisten sebelum `provision(profile, operationId)`. Penyedia memvalidasi pengaturan sebelum alokasi eksternal dan melempar `WorkerProviderError` untuk penolakan profil permanen. `provision` harus mengadopsi lease yang sama saat id operasi berulang.
Inti menyimpan pengaturan profil yang telah divalidasi bersama lease dan memberikan snapshot tersebut kepada `destroy({ leaseId, profile })`, yang harus idempoten, serta `inspect({ leaseId, profile })`, yang mengembalikan `active`, `destroyed`, atau `unknown`. Hal ini memungkinkan penyedia merutekan panggilan siklus hidup setelah Gateway dimulai ulang atau profil bernama dihapus. Endpoint SSH menggunakan `SecretRef` untuk `keyRef`, bukan materi kunci inline, dan menyertakan `hostKey` dari keluaran penyediaan tepercaya persis sebagai `algorithm base64`, tanpa nama host atau komentar. Inti menyematkan `hostKey` dan tidak pernah memercayai kunci dari koneksi pertama. Penyedia yang menghasilkan `keyRef` dinamis dapat mengimplementasikan `resolveSshIdentity({ leaseId, profile, keyRef })`; jika ada, resolver tersebut bersifat otoritatif, sedangkan penyedia tanpanya menggunakan resolver rahasia generik yang dikonfigurasi.
Penyedia dengan lease yang dapat diperpanjang juga dapat mengimplementasikan `renew(leaseId)`.
`inspect` harus melempar kesalahan saat terjadi kegagalan sementara atau yang tidak dapat dipastikan; kembalikan `unknown` hanya untuk ketiadaan yang otoritatif. Inti menandai rekaman lokal aktif sebagai yatim, atau memperlakukan ketiadaan tersebut sebagai penyelesaian pembongkaran setelah permintaan penghancuran disimpan.

Penyedia embedding yang didaftarkan dengan `api.registerEmbeddingProvider(...)` juga harus
dicantumkan di `contracts.embeddingProviders` dalam manifes plugin. Ini
adalah permukaan embedding generik untuk pembuatan vektor yang dapat digunakan kembali. Pencarian memori
dapat menggunakan permukaan penyedia generik ini. Jalur
`api.registerMemoryEmbeddingProvider(...)` dan
`contracts.memoryEmbeddingProviders` yang lebih lama merupakan kompatibilitas usang sementara
penyedia khusus memori yang ada bermigrasi.

Penyedia khusus memori yang masih mengekspos `batchEmbed(...)` runtime tetap menggunakan
kontrak batching per berkas yang ada kecuali runtime-nya secara eksplisit menetapkan
`sourceWideBatchEmbed: true`. Keikutsertaan tersebut memungkinkan host memori mengirimkan potongan dari
beberapa berkas memori kotor dan sumber yang diaktifkan dalam satu panggilan `batchEmbed(...)`
hingga batas batch host. Adapter batch yang mengunggah berkas permintaan JSONL juga harus
membagi tugas penyedia sebelum mencapai batas ukuran unggahan maupun batas jumlah
permintaannya. Penyedia harus mengembalikan satu embedding per potongan input dalam urutan yang sama dengan
`batch.chunks`; hilangkan flag tersebut jika penyedia mengharapkan batch lokal berkas atau
tidak dapat mempertahankan urutan input di seluruh tugas tingkat sumber yang lebih besar.

### Alat dan perintah

Gunakan [`defineToolPlugin`](/id/plugins/tool-plugins) untuk plugin sederhana yang hanya berisi alat
dengan nama alat tetap. Gunakan `api.registerTool(...)` secara langsung untuk plugin campuran
atau pendaftaran alat yang sepenuhnya dinamis.

| Metode                                 | Yang didaftarkan                                                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Alat agen (wajib atau `{ optional: true }`)                                                                                            |
| `api.registerCommand(def)`             | Perintah khusus (melewati LLM)                                                                                                         |
| `api.registerNodeHostCommand(command)` | Perintah yang ditangani oleh `openclaw node run`; metadata opsional `agentTool` dapat mengeksposnya sebagai alat yang terlihat oleh agen saat node terhubung |

Perintah plugin dapat menetapkan `agentPromptGuidance` ketika agen memerlukan petunjuk
perutean singkat milik perintah. Pastikan teks tersebut membahas perintah itu sendiri; jangan tambahkan
kebijakan khusus penyedia atau plugin ke builder prompt inti.

Entri panduan dapat berupa string lama, yang berlaku untuk setiap permukaan prompt, atau
entri terstruktur:

```ts
agentPromptGuidance: [
  "Petunjuk perintah global.",
  { text: "Hanya tampilkan ini di prompt utama OpenClaw.", surfaces: ["openclaw_main"] },
];
```

`surfaces` terstruktur dapat mencakup `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, atau `subagent`. `pi_main` tetap merupakan alias usang
untuk `openclaw_main`. Hilangkan `surfaces` untuk panduan yang sengaja berlaku bagi semua permukaan. Jangan
berikan array `surfaces` kosong; array tersebut ditolak agar hilangnya cakupan secara tidak sengaja tidak
menjadi teks prompt global.

Instruksi developer app-server Codex native lebih ketat daripada permukaan prompt
lainnya: hanya panduan yang secara eksplisit dicakup ke `codex_app_server` yang dipromosikan ke
jalur berprioritas lebih tinggi tersebut. Panduan string lama dan panduan terstruktur tanpa cakupan
tetap tersedia untuk permukaan prompt non-Codex demi kompatibilitas.

Perintah host node berjalan pada host node yang terhubung, bukan di dalam proses
Gateway. Jika `agentTool` tersedia, node menerbitkan deskriptor setelah
berhasil terhubung ke Gateway; Gateway mengeksposnya kepada proses agen hanya selama node tersebut
terhubung dan hanya jika `command` milik deskriptor berada dalam permukaan perintah
yang disetujui milik node. Tetapkan `agentTool.defaultPlatforms` untuk memasukkan
perintah yang tidak berbahaya ke daftar perintah node yang diizinkan secara default; jika tidak,
wajibkan `gateway.nodes.allowCommands` secara eksplisit atau kebijakan pemanggilan node. `agentTool.name`
harus aman bagi penyedia: diawali dengan huruf, hanya menggunakan huruf, digit,
garis bawah, atau tanda hubung, dan tidak melebihi 64 karakter. Alat node berbasis MCP
dapat menetapkan metadata `agentTool.mcp` agar permukaan katalog dan pencarian alat dapat menampilkan
identitas server/alat MCP jarak jauh, tetapi eksekusi tetap melalui
perintah node yang diiklankan.

### Infrastruktur

| Metode                                          | Yang didaftarkan                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook peristiwa                                                         |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP Gateway                                                  |
| `api.registerGatewayMethod(name, handler)`      | Metode RPC Gateway                                                     |
| `api.registerGatewayDiscoveryService(service)`  | Pengiklan penemuan Gateway lokal                                       |
| `api.registerCli(registrar, opts?)`             | Subperintah CLI                                                        |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI fitur Node di bawah `openclaw nodes`                                |
| `api.registerService(service)`                  | Layanan latar belakang                                                 |
| `api.registerInteractiveHandler(registration)`  | Penangan interaktif                                                    |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware hasil alat runtime                                          |
| `api.registerMemoryPromptSupplement(builder)`   | Bagian prompt tambahan yang terkait dengan memori                      |
| `api.registerMemoryPromptPreparation(prepare)`  | Persiapan asinkron untuk bagian prompt yang terkait dengan memori      |
| `api.registerMemoryCorpusSupplement(adapter)`   | Korpus pencarian/pembacaan memori tambahan                             |
| `api.registerHostedMediaResolver(resolver)`     | Penyelesai untuk URL media ter-hosting bergaya browser                 |
| `api.registerMcpServerConnectionResolver(...)`  | Transport MCP per pemohon (`url`/`headers`) untuk nama server statis |
| `api.registerTextTransforms(transforms)`        | Penulisan ulang teks kompatibilitas prompt/pesan milik Plugin          |
| `api.registerConfigMigration(migrate)`          | Migrasi konfigurasi ringan yang dijalankan sebelum runtime Plugin dimuat |
| `api.registerMigrationProvider(provider)`       | Pengimpor untuk `openclaw migrate`                                     |
| `api.registerAutoEnableProbe(probe)`            | Pemeriksaan konfigurasi yang dapat mengaktifkan Plugin ini secara otomatis |
| `api.registerReload(registration)`              | Kebijakan awalan konfigurasi mulai ulang/hot/noop untuk penanganan pemuatan ulang |
| `api.registerNodeHostCommand(command)`          | Penangan perintah yang diekspos ke node yang dipasangkan               |
| `api.registerNodeInvokePolicy(policy)`          | Kebijakan daftar izin/persetujuan untuk perintah yang dipanggil node   |
| `api.registerSecurityAuditCollector(collector)` | Pengumpul temuan untuk `openclaw security audit`                       |

#### Pekerjaan Webhook setelah pengakuan

Rute Webhook yang mengakui permintaan sebelum pemrosesan selesai harus memindahkan
pekerjaan terlepas tersebut ke akar penerimaan terlacaknya sendiri:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`pengiriman webhook gagal: ${String(error)}`);
});
```

Panggil `runDetachedWebhookWork(...)` secara sinkron selagi permintaan HTTP masih
diterima. Pembantu ini segera mencadangkan akar independen, lalu memulai
callback pada microtask berikutnya agar penangan permintaan dapat menulis
pengakuannya terlebih dahulu. Promise yang dikembalikan mengadopsi hasil callback; pemanggil
tetap bertanggung jawab atas penanganan penolakan. Ini menjaga pekerjaan antrean setelah pengakuan tetap diterima dan membuat
pengurasan saat mulai ulang atau penangguhan menunggunya. Penangan yang menunggu seluruh pemrosesan
sebelum kembali tidak memerlukan pembantu ini.

#### Koneksi MCP dengan cakupan pemohon

Pertahankan **identitas** server MCP tetap statis (nama, filter alat) di `mcp.servers` atau
manifes bundel. Secara opsional, daftarkan penyelesai koneksi agar setiap
pemohon pesan tepercaya mendapatkan transportnya sendiri:

```ts
api.registerMcpServerConnectionResolver({
  serverName: "user-email",
  resolve: async (ctx) => {
    // ctx.requesterSenderId dipercaya oleh host; jangan pernah membuat identitas pengirim di sini.
    const token = await lookupUserToken(ctx.requesterSenderId);
    if (!token) {
      return null; // hilangkan server ini untuk proses saat ini
    }
    return {
      url: "https://mcp.example.com/email",
      headers: { Authorization: `Bearer ${token}` },
    };
  },
});
```

Catatan kontrak:

- Konteks penyelesai hanya membawa identitas host tepercaya (`requesterSenderId`,
  `agentAccountId` / `messageChannel` opsional). Kolom tepercaya mendatang (misalnya
  konteks pengguna cron/subagen) dapat ditambahkan secara aditif.
- Satu Plugin memiliki satu nama server: duplikat
  `registerMcpServerConnectionResolver` untuk `serverName` yang sama dari Plugin lain
  ditolak dengan diagnostik kesalahan (pendaftaran pertama menang), sehingga
  kepemilikan koneksi tidak pernah bergantung pada urutan pemuatan Plugin.
- Nama alat diturunkan dari kumpulan lengkap server yang dideklarasikan sehingga penyelesaian parsial
  tidak pernah mengubah nama server aman antara pemohon atau giliran. Core tidak
  memverifikasi bahwa endpoint pemohon yang berbeda menyediakan skema alat yang identik; sebuah
  penyelesai harus mengarahkan setiap pemohon ke layanan logis yang sama, atau skema
  alat (dan stabilitas cache prompt) akan berbeda untuk setiap pemohon.
- Proses tanpa `requesterSenderId` tepercaya (cron, subagen, Heartbeat, Gateway
  publik) tidak pernah mewujudkan server dengan cakupan pemohon. Tidak ada
  koneksi fallback bersama.
- `resolve` dibatasi hingga 10 detik per server; waktu habis atau pelemparan akan menghilangkan
  server tersebut dari proses tanpa menggagalkan MCP statis.
- Koneksi yang diselesaikan divalidasi ulang paling sering setiap 5 menit per pemohon:
  rotasi membangun ulang transport dengan kredensial baru, dan hasil `null`
  mencabutnya (runtime yang di-cache dibuang bahkan di tengah sesi). Oleh karena itu, kredensial
  yang dicabut atau dirotasi dapat tetap digunakan hingga 5 menit.
- `headers` yang diselesaikan tidak pernah dicatat atau dipersistenkan; core hanya menyimpan digest
  berkunci dalam memori yang sementara (HMAC lokal proses) untuk mendeteksi rotasi kredensial, dan
  mendaftarkan nilai kredensial header/URL yang diselesaikan pada registri penyamaran
  log/tangkapan debug.
- Server dengan cakupan pemohon tidak membuat tampilan Aplikasi MCP: tampilan bertahan lebih lama daripada
  proses terautentikasi pemohon dan batas tampilan Gateway tidak memiliki identitas
  pemohon, sehingga pratinjau aplikasi tetap ditutup secara aman untuk server-server ini. Hasil alat
  tidak terpengaruh.
- Server statis tanpa penyelesai mempertahankan siklus hidup bercakupan sesi yang ada.
- **Aturan pengiriman harness:** server dengan cakupan pemohon tidak pernah masuk ke konfigurasi
  klien MCP bawaan harness (utas Codex `mcp_servers`, CLI `-c mcp_servers=…`, atau
  proyeksi MCP bersama sesi lainnya). Sebagai gantinya, harness mengirimkannya sebagai alat
  bercakupan proses:
  - Runner tersemat: runtime MCP sesi + alat bundel (statis + bercakupan).
  - Server aplikasi Codex: alat dinamis melalui
    `materializeRequesterScopedMcpToolsForHarnessRun` (hanya yang bercakupan; server
    statis tetap menggunakan klien MCP bawaan Codex).
- **Spesifikasi** alat bercakupan stabil selama sesi setelah penyelesaian pertama yang berhasil dalam
  sesi tersebut, sehingga harness dengan utas bersama (Codex) tidak merotasi utas ketika
  pengirim berubah. Sebelum ada pemohon yang diselesaikan, tidak ada spesifikasi bercakupan yang diiklankan.
- Pemohon yang tidak terautentikasi pada harness dengan utas bersama tetap melihat alat bercakupan
  yang diiklankan; memanggil salah satunya mengembalikan kesalahan alat tidak terhubung yang bersih untuk
  pemohon tersebut. OpenClaw tidak pernah menggunakan kredensial pemohon lain sebagai fallback.

Pembangun pelengkap prompt memori menerima konteks opsional `agentId`,
`agentSessionKey`, dan `sandboxed`. Panggilan pelengkap korpus memori `search`
dan `get` menerima konteks opsional `agentId` dan `sandboxed`. Plugin dengan
penyimpanan milik agen harus menyelesaikan penyimpanan tersebut untuk setiap panggilan, bukan
menangkap satu jalur global saat pendaftaran. Jika ID agen diperlukan tetapi
tidak tersedia dalam operasi multiagen, tutup secara aman alih-alih memilih
agen sembarang.

Gunakan `registerMemoryPromptPreparation(...)` ketika teks prompt bergantung pada status
Plugin asinkron. Callback berjalan sekali sebelum setiap prompt agen lengkap dan menerima
konteks alat, agen, sesi, serta sandbox yang sama dengan pembangun prompt memori
sinkron. Validasi instans pemilik penyimpanan saat ini sebelum memuat status
yang dipersistenkan, lalu hanya kembalikan baris untuk proses tersebut. OpenClaw membekukan baris-baris itu dan
menyerahkan hasil yang tidak dapat diubah ke perakitan prompt sinkron. Pertahankan persistensi,
penggantian atomik, dan penghapusan saat pemilik dihapus di dalam Plugin pemilik; jangan
melakukan polling atau membaca berkas dari pembangun prompt.

Penangan interaktif Telegram dapat mengembalikan `{ submitText }` untuk merutekan teks melalui
jalur agen masuk normal Telegram setelah penangan berhasil. OpenClaw mempertahankan
tombol callback ketika kebijakan masuk melewati teks atau pemrosesan gagal, sehingga
pengguna dapat mencoba lagi setelah kondisi pemblokiran berubah. Kolom hasil ini
khusus Telegram; saluran lain mempertahankan kontrak hasil interaktifnya sendiri.

### Hook host untuk Plugin alur kerja

Hook host adalah seam SDK bagi Plugin yang perlu berpartisipasi dalam siklus hidup
host, bukan hanya menambahkan penyedia, saluran, atau alat. Hook ini merupakan
kontrak generik; Mode Rencana dapat menggunakannya, demikian pula alur kerja persetujuan,
gerbang kebijakan ruang kerja, pemantau latar belakang, wizard penyiapan, dan Plugin pendamping
UI.

| Metode                                                                               | Kontrak yang dimilikinya                                                                                                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Status sesi milik Plugin yang kompatibel dengan JSON dan diproyeksikan melalui sesi Gateway                                                               |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Konteks persisten tepat-satu-kali yang disuntikkan ke giliran agen berikutnya untuk satu sesi                                                              |
| `api.registerTrustedToolPolicy(...)`                                                 | Kebijakan alat tepercaya pra-Plugin yang dibatasi manifes dan dapat memblokir atau menulis ulang parameter alat                                           |
| `api.registerToolMetadata(...)`                                                      | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                                                           |
| `api.registerCommand(...)`                                                           | Perintah Plugin tercakup; hasil perintah dapat menetapkan `continueAgent: true` atau `suppressReply: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskriptor kontribusi Control UI untuk permukaan sesi, alat, proses, pengaturan, atau tab                                                                   |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback pembersihan untuk sumber daya runtime milik Plugin pada jalur reset/hapus/muat ulang                                                             |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Langganan peristiwa yang disanitasi untuk status dan monitor alur kerja                                                                                    |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Status sementara Plugin per proses yang dibersihkan pada siklus hidup terminal proses                                                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadata pembersihan untuk tugas penjadwal milik Plugin; tidak menjadwalkan pekerjaan atau membuat catatan tugas                                           |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Pengiriman lampiran berkas melalui host khusus bawaan ke rute sesi keluar langsung yang aktif                                                             |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Giliran sesi terjadwal berbasis Cron khusus bawaan beserta pembersihan berbasis tag                                                                        |
| `api.session.controls.registerSessionAction(...)`                                    | Tindakan sesi bertipe yang dapat dikirim klien melalui Gateway                                                                                            |

Deskriptor `surface: "tab"` menambahkan tab bilah sisi ke Control UI. Deskriptor
tab milik Plugin yang aktif diumumkan kepada klien dasbor dalam hello gateway
(`controlUiTabs`), sehingga tab hanya muncul selama Plugin diaktifkan.
Plugin bawaan dapat menyediakan tampilan dasbor kelas satu untuk tabnya; Plugin
lain dapat menetapkan `path` ke rute HTTP Plugin (lihat
`api.registerHttpRoute(...)`) yang dirender dasbor dalam bingkai terisolasi.
`icon` adalah petunjuk nama ikon dasbor, `group` memilih bagian bilah sisi
(`control` atau `agent`), `order` mengurutkan di antara tab Plugin, dan `requiredScopes`
menyembunyikan tab dari koneksi yang tidak memiliki cakupan operator tersebut:

Untuk tab eksternal yang dilindungi gateway, daftarkan deskriptor `path` di bawah
rute HTTP `auth: "gateway"` milik Plugin yang sama. Setelah bootstrap terautentikasi, peramban memperoleh
izin HttpOnly berumur pendek yang dibatasi untuk Plugin dan akar rute tersebut agar
bingkai terisolasi dapat dimuat tanpa menyalin token bearer Gateway ke URL
atau JavaScript-nya. Induk yang terautentikasi memperbarui izin selama tab eksternal
aktif dan sebelum memasangnya setelah navigasi atau peramban dilanjutkan. Induk juga
memeriksa izin dari sandbox buram yang sama sebelum pemasangan, sehingga mode
privasi peramban yang memblokir cookie gagal secara tertutup dengan panel yang tidak tersedia.
Izin bingkai hanya menerima `GET` dan `HEAD` serta selalu membawa
`operator.read`; `requiredScopes` mengontrol visibilitas tab tetapi tidak pernah memperluas
izin cookie. Mutasi tetap berada pada permukaan induk atau bearer yang secara
eksplisit diautentikasi Gateway. Tab eksternal memerlukan HTTPS/Tailscale Serve atau
origin loopback yang dipercaya peramban; HTTP biasa pada host LAN menampilkan
kesalahan konteks aman, bukan memasang panel yang tidak dapat melakukan autentikasi.
Pemblokiran penuh cookie pihak ketiga juga membuat tab yang dilindungi gateway tidak tersedia.
Seperti semua permukaan Plugin native, bingkai tetap berada di dalam batas kepercayaan
Plugin yang terpasang; OpenClaw tidak memperlakukan Plugin yang terpasang sebagai prinsipal
keamanan peramban yang saling terisolasi.
Izin cookie menggunakan batas nama host peramban, bukan batas portnya. Jangan
menempatkan layanan yang tidak saling dipercaya pada nama host Gateway yang sama, bahkan pada
port lain.
Tab yang didukung autentikasi kelolaan Plugin mempertahankan perilaku iframe langsung dan tidak
meminta atau memerlukan izin Gateway ini.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Buku catatan",
  description: "Hari Anda sebagai linimasa, yang dibuat dari cuplikan layar.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

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

Metode datar yang setara tetap tersedia sebagai alias kompatibilitas yang
sudah tidak disarankan untuk Plugin yang ada. Jangan tambahkan kode Plugin baru yang memanggil
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, atau
`api.unscheduleSessionTurnsByTag` secara langsung.

`scheduleSessionTurn(...)` adalah kemudahan tercakup sesi di atas penjadwal
Cron Gateway. Cron mengelola waktu dan membuat catatan tugas latar belakang saat
giliran berjalan; Plugin SDK hanya membatasi sesi target, penamaan milik
Plugin, dan pembersihan. Gunakan `api.runtime.tasks.managedFlows` di dalam giliran
terjadwal ketika pekerjaan itu sendiri memerlukan status Task Flow multi-langkah yang persisten.

Kontrak-kontrak tersebut sengaja membagi kewenangan:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah, metadata
  alat, penyuntikan giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan
  dipercaya oleh host. Kebijakan bawaan berjalan terlebih dahulu; kebijakan Plugin terpasang memerlukan
  pengaktifan eksplisit beserta ID lokalnya dalam
  `contracts.trustedToolPolicies`, lalu berjalan sesuai urutan pemuatan Plugin. ID kebijakan
  dibatasi pada Plugin yang mendaftarkannya.
- Kepemilikan perintah yang dicadangkan hanya untuk bawaan. Plugin eksternal sebaiknya menggunakan
  nama perintah atau aliasnya sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang mengubah prompt, termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  bidang prompt dari `before_agent_start` lama, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Plan:

| Arketipe Plugin               | Hook yang digunakan                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alur kerja persetujuan        | Ekstensi sesi, kelanjutan perintah, penyuntikan giliran berikutnya, deskriptor UI                                                       |
| Gerbang kebijakan anggaran/ruang kerja | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                         |
| Monitor siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan penjadwal sesi, kontribusi prompt heartbeat, deskriptor UI |
| Wizard penyiapan atau orientasi | Ekstensi sesi, perintah tercakup, deskriptor Control UI                                                                               |

<Note>
  Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, bahkan jika Plugin mencoba menetapkan
  cakupan metode gateway yang lebih sempit. Utamakan prefiks khusus Plugin untuk
  metode milik Plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil alat">
  Plugin bawaan dan Plugin terpasang yang diaktifkan secara eksplisit dengan kontrak
  manifes yang cocok dapat menggunakan `api.registerAgentToolResultMiddleware(...)` ketika
  perlu menulis ulang hasil alat setelah eksekusi dan sebelum runtime
  mengumpankan hasil tersebut kembali ke model. Ini adalah batas runtime-netral tepercaya
  untuk pereduksi keluaran asinkron seperti tokenjuice.

Plugin harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap runtime
yang ditargetkan, misalnya `["openclaw", "codex"]`. Plugin terpasang tanpa
kontrak tersebut, atau tanpa pengaktifan eksplisit, tidak dapat mendaftarkan middleware ini; pertahankan
hook Plugin OpenClaw normal untuk pekerjaan yang tidak memerlukan pengaturan waktu hasil alat
pra-model. Jalur pendaftaran factory ekstensi lama yang
hanya untuk runner tertanam telah dihapus.
</Accordion>

### Pendaftaran penemuan Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengumumkan Gateway yang aktif
pada transport penemuan lokal seperti mDNS/Bonjour. OpenClaw memanggil
layanan selama startup Gateway ketika penemuan lokal diaktifkan, meneruskan
port Gateway saat ini dan data petunjuk TXT non-rahasia, serta memanggil handler
`stop` yang dikembalikan selama penghentian Gateway.

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

Plugin penemuan Gateway tidak boleh memperlakukan nilai TXT yang diumumkan sebagai rahasia atau
autentikasi. Penemuan adalah petunjuk perutean; autentikasi Gateway dan penyematan TLS tetap
mengelola kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata perintah:

- `commands`: nama perintah eksplisit yang dimiliki pendaftar
- `descriptors`: deskriptor perintah waktu penguraian yang digunakan untuk bantuan CLI,
  perutean, dan pendaftaran CLI Plugin secara lazy
- `parentPath`: jalur perintah induk opsional untuk grup perintah bertingkat, seperti
  `["nodes"]`

Untuk fitur Node berpasangan, utamakan
`api.registerNodeCliFeature(registrar, opts?)`. Ini adalah pembungkus kecil di sekitar
`api.registerCli(..., { parentPath: ["nodes"] })` dan membuat perintah seperti
`openclaw nodes canvas` menjadi fitur Node milik Plugin yang eksplisit.

Jika Anda ingin perintah Plugin tetap dimuat secara lazy dalam jalur CLI root normal,
sediakan `descriptors` yang mencakup setiap root perintah tingkat atas yang diekspos oleh
pendaftar tersebut.

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
        description: "Kelola akun, verifikasi, perangkat, dan status profil Matrix",
        hasSubcommands: true,
      },
    ],
  },
);
```

Perintah bertingkat menerima perintah induk yang telah diresolusi sebagai `program`:

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
        description: "Ambil atau render konten kanvas dari node yang telah dipasangkan",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` secara mandiri hanya jika Anda tidak memerlukan pendaftaran CLI root secara malas.
Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak memasang
placeholder berbasis deskriptor untuk pemuatan malas pada waktu parsing.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `claude-cli` atau `my-cli`.

- `id` backend menjadi prefiks penyedia dalam referensi model seperti `my-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama dengan `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap diutamakan. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  nilai default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` saat backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalisasi bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv dengan cakupan permintaan yang merupakan bagian dari
  dialek CLI, seperti memetakan tingkat pemikiran OpenClaw ke flag upaya
  native. Hook menerima `ctx.executionMode`; gunakan `"side-question"` untuk menambahkan
  flag isolasi native backend bagi panggilan `/btw` sementara. Jika flag tersebut
  secara andal menonaktifkan alat native untuk CLI yang selain itu selalu aktif, deklarasikan juga
  `sideQuestionToolMode: "disabled"`.
- Gunakan `prepareExecution` untuk lingkungan peluncuran milik backend atau jembatan
  autentikasi/konfigurasi sementara. `ctx.contextTokenBudget` miliknya adalah batas token efektif
  yang dipilih untuk proses tersebut, sehingga backend dengan compaction native dapat menyelaraskan
  ambangnya sendiri tanpa cabang inti khusus penyedia.
- Backend yang dapat menonaktifkan semua alat native untuk proses tertentu dapat mendeklarasikan
  `nativeToolMode: "selectable"`. Panggilan terbatas meneruskan tuple
  `ctx.toolAvailability.native` kosong beserta daftar izin MCP terisolasi host yang persis;
  `resolveExecutionArgs` harus memberlakukan keduanya pada argv fresh atau resume akhir.
  OpenClaw gagal secara tertutup jika backend tidak dapat melakukannya.

Untuk panduan penulisan menyeluruh, lihat
[Plugin backend CLI](/id/plugins/cli-backend-plugins).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback siklus hidup menerima `runtimeSettings` saat host dapat menyediakan diagnostik model/penyedia/mode; mesin ketat lama dicoba ulang tanpa kunci tersebut. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Pembuat bagian prompt memori                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adaptor runtime memori                                                                                                                                                                             |

### Adaptor embedding memori yang tidak digunakan lagi

| Metode                                         | Yang didaftarkan                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptor embedding memori untuk plugin aktif |

- `registerMemoryCapability` adalah API plugin memori eksklusif yang disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  agar plugin pendamping dapat menggunakan artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core`, alih-alih mengakses tata letak privat
  plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memori eksklusif yang kompatibel dengan sistem lama.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi `provider/model`
  yang persis, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback
  aktif.
- `registerMemoryEmbeddingProvider` tidak digunakan lagi. Penyedia embedding baru
  harus menggunakan `api.registerEmbeddingProvider(...)` dan
  `contracts.embeddingProviders`.
- Penyedia khusus memori yang ada tetap berfungsi selama periode
  migrasi, tetapi inspeksi plugin melaporkannya sebagai utang kompatibilitas untuk
  plugin yang tidak dibundel.

### Peristiwa dan siklus hidup

| Metode                                       | Fungsinya                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe          |
| `api.onConversationBindingResolved(handler)` | Callback pengikatan percakapan |

Lihat [Hook plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik
guard.

### Semantik keputusan hook

`before_install` adalah hook siklus hidup runtime plugin, bukan permukaan kebijakan
instalasi operator. Gunakan `security.installPolicy` saat keputusan izinkan/blokir harus
mencakup jalur instalasi atau pembaruan yang didukung CLI dan Gateway.

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` dianggap tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai penggantian.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` dianggap tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai penggantian.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengambil alih dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` dianggap tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai penggantian.
- `message_received`: gunakan bidang `threadId` bertipe saat Anda memerlukan perutean utas/topik masuk. Pertahankan `metadata` untuk tambahan khusus saluran.
- `message_sending`: gunakan bidang perutean bertipe `replyToId` / `threadId` sebelum beralih ke `metadata` khusus saluran.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status awal milik Gateway alih-alih mengandalkan hook `gateway:startup` internal. Cron mungkin masih dimuat pada titik ini.
- `cron_reconciled`: bangun ulang proyeksi cron eksternal lengkap setelah startup atau pemuatan ulang penjadwal. Ini mencakup `reason` dan status `enabled` efektif, termasuk `enabled: false`, sedangkan `ctx.getCron?.()` mengembalikan penjadwal hasil rekonsiliasi yang persis. Teruskan `ctx.abortSignal` ke pekerjaan proyeksi persisten; pekerjaan tersebut dibatalkan saat snapshot penjadwal itu digantikan atau Gateway ditutup.
- `cron_changed`: amati perubahan siklus hidup cron milik Gateway. Peristiwa `scheduled` dan `removed` adalah petunjuk rekonsiliasi pasca-commit, bukan log delta berurutan. `event.nextRunAtMs` milik peristiwa terjadwal tidak ada saat tugas tidak memiliki waktu bangun berikutnya; peristiwa penghapusan tetap membawa snapshot tugas yang dihapus.

Penjadwal bangun eksternal harus melakukan debounce atau menggabungkan peristiwa `cron_changed`,
lalu membaca ulang tampilan persisten lengkap dari penjadwal yang terakhir ditangkap oleh
`cron_reconciled`. Jangan mengadopsi penjadwal dari konteks `cron_changed`: petunjuk
terlepas dari penjadwal lama dapat bertumpang tindih dengan pemuatan ulang berikutnya.

Gunakan `cron_reconciled` sebagai pemicu snapshot lengkap untuk status persisten yang dimuat saat
startup Gateway atau penggantian penjadwal. Ini tidak diputar ulang untuk hot reload
khusus plugin. Handler pengamatan berjalan secara paralel, dan dispatch
fire-and-forget dapat bertumpang tindih, sehingga konsumen tidak boleh bergantung pada urutan penyelesaian peristiwa.
Pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

Untuk adaptor single-flight dengan penggantian persisten, percobaan ulang/backoff, dan
penghentian yang bersih, lihat [Proyeksi cron eksternal yang aman](/id/plugins/hooks#safe-external-cron-projection).

### Bidang objek API

| Bidang                    | Tipe                      | Deskripsi                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                                |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                   |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                               |
| `api.source`             | `string`                  | Jalur sumber plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori aktif jika tersedia)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger dengan cakupan (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/penyiapan ringan sebelum entri lengkap |
| `api.resolvePath(input)` | `(string) => string`      | Resolusi jalur relatif terhadap root plugin                                                        |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```text
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Titik masuk Plugin
  setup-entry.ts    # Titik masuk ringan khusus penyiapan (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui fasad (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan berkas titik masuk publik serupa) mengutamakan
snapshot konfigurasi runtime aktif saat OpenClaw sudah berjalan. Jika belum ada snapshot
runtime, permukaan tersebut kembali menggunakan berkas konfigurasi yang telah diresolusi pada disk.
Fasad plugin bawaan dalam paket harus dimuat melalui pemuat fasad plugin
OpenClaw; impor langsung dari `dist/extensions/...` melewati pemeriksaan manifes
dan sidecar runtime yang digunakan instalasi dalam paket untuk kode milik plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal plugin yang sempit ketika suatu
helper memang secara sengaja khusus untuk penyedia dan belum sesuai ditempatkan dalam subjalur
SDK generik. Contoh bawaan:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper
  header beta Claude dan stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor pembangun penyedia,
  helper model default, dan pembangun penyedia waktu nyata.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor pembangun penyedia
  beserta helper orientasi awal/konfigurasi.

<Warning>
  Kode produksi ekstensi juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar digunakan bersama, promosikan ke subjalur SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan lain yang
  berorientasi pada kapabilitas, alih-alih menggabungkan dua plugin secara erat.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Titik masuk" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/id/plugins/sdk-runtime">
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
