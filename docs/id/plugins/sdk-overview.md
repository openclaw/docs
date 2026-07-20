---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar SDK Plugin
x-i18n:
    generated_at: "2026-07-20T03:55:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 75fd5dc3cfb7b7594e2fd3d5f577e3e6ff16146d34621f80edc88147acb5f762
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK adalah kontrak bertipe antara plugin dan inti. Halaman ini merupakan
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan bagi pembuat plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, tugas CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [Integrasi Gateway untuk aplikasi eksternal](/id/gateway/external-apps).
</Note>

<Tip>
Mencari panduan cara penggunaan? Mulailah dengan [Membangun plugin](/id/plugins/building-plugins). Gunakan [Plugin kanal](/id/plugins/sdk-channel-plugins) untuk kanal, [Plugin penyedia](/id/plugins/sdk-provider-plugins) untuk penyedia model, [Plugin backend CLI](/id/plugins/cli-backend-plugins) untuk backend CLI AI lokal, [Plugin harness agen](/id/plugins/sdk-agent-harness) untuk eksekutor agen native, dan [Hook plugin](/id/plugins/hooks) untuk hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Hal ini menjaga startup tetap cepat dan
mencegah masalah dependensi melingkar. Untuk pembantu entri/build khusus kanal,
utamakan `openclaw/plugin-sdk/channel-core`; pertahankan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan pembantu bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi kanal, publikasikan JSON Schema milik kanal melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan OpenClaw
menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema kanal bawaan
yang dipertahankan. Subpath skema bawaan tersebut bukan pola untuk plugin baru.

<Warning>
  Jangan mengimpor seam kemudahan bermerek penyedia atau kanal (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` miliknya sendiri; konsumen inti harus menggunakan barrel lokal
  plugin tersebut atau menambahkan kontrak SDK generik yang sempit ketika suatu kebutuhan
  benar-benar lintas kanal.

Sejumlah kecil seam pembantu plugin bawaan masih muncul dalam peta ekspor yang
dihasilkan jika memiliki penggunaan pemilik yang terlacak. Seam tersebut hanya tersedia
untuk pemeliharaan plugin bawaan dan bukan jalur impor yang disarankan bagi plugin
pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account`
juga dipertahankan sebagai facade kompatibilitas usang untuk penggunaan pemilik yang terlacak. Jangan
menyalin jalur impor tersebut ke plugin baru; sebagai gantinya, gunakan pembantu runtime yang
diinjeksikan dan subpath SDK kanal generik.
</Warning>

## Referensi subpath

Plugin SDK diekspos sebagai sekumpulan subpath sempit yang dikelompokkan menurut area (entri
plugin, kanal, penyedia, autentikasi, runtime, kapabilitas, memori, dan pembantu
plugin bawaan yang dicadangkan). Untuk katalog lengkap—yang telah dikelompokkan dan ditautkan—lihat
[Subpath Plugin SDK](/id/plugins/sdk-subpaths).

Inventaris titik masuk compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dihasilkan dari
subset publik setelah mengurangi subpath pengujian/internal lokal repo yang tercantum dalam
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Jalankan
`pnpm plugin-sdk:surface` untuk mengaudit jumlah ekspor publik. Subpath publik usang
yang sudah cukup lama dan tidak digunakan oleh kode produksi ekstensi bawaan
dilacak dalam `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel ekspor ulang
usang yang luas dilacak dalam
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan
metode berikut:

Plugin yang menyediakan permukaan obrolan tim eksternal untuk suatu sesi dapat mendaftarkan
satu-satunya penyedia seluruh proses yang diekspor oleh
`openclaw/plugin-sdk/session-discussion`. Metode `info({ sessionKey })` miliknya
melaporkan apakah diskusi tidak tersedia, siap dibuka, atau sudah dibuka;
`open({ sessionKey })` membuat atau menemukan diskusi tersebut dan mengembalikan URL sematan
serta URL eksternalnya. Mendaftarkan penyedia lain akan menggantikan penyedia saat ini.

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                                                               |
| `api.registerWorkerProvider(...)`                | Lease siklus hidup pekerja cloud                                                    |
| `api.registerModelCatalogProvider(...)`          | Baris katalog model untuk pembuatan teks dan media                                  |
| `api.registerAgentHarness(...)`                  | Eksekutor agen native [Eksperimental](/id/plugins/sdk-agent-harness) (Codex, Copilot)  |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal                                                        |
| `api.registerChannel(...)`                       | Kanal perpesanan                                                                   |
| `api.registerEmbeddingProvider(...)`             | Penyedia embedding vektor yang dapat digunakan kembali                             |
| `api.registerSpeechProvider(...)`                | Sintesis teks-ke-ucapan / STT                                                      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi waktu nyata streaming                                                   |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara waktu nyata dupleks                                                      |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video                                                         |
| `api.registerTranscriptSourceProvider(...)`      | Sumber transkrip rapat langsung atau yang diimpor                                   |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                                                                    |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                                                                     |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                                                                     |
| `api.registerWebFetchProvider(...)`              | Penyedia pengambilan / scraping web                                                |
| `api.registerWebSearchProvider(...)`             | Pencarian web                                                                       |
| `api.registerCompactionProvider(...)`            | Backend pemadatan transkrip yang dapat dipasang                                    |

Penyedia pekerja juga harus mendeklarasikan id-nya dalam `contracts.workerProviders`.
Inti menyimpan intensi persisten sebelum `provision(profile, operationId)`. Penyedia memvalidasi pengaturan sebelum alokasi eksternal dan melempar `WorkerProviderError` jika profil ditolak secara permanen. `provision` harus mengadopsi lease yang sama saat id operasi berulang.
Inti menyimpan pengaturan profil yang telah divalidasi bersama lease dan menyediakan snapshot tersebut kepada `destroy({ leaseId, profile })`, yang harus idempoten, dan `inspect({ leaseId, profile })`, yang mengembalikan `active`, `destroyed`, atau `unknown`. Hal ini memungkinkan penyedia merutekan panggilan siklus hidup setelah Gateway dimulai ulang atau profil bernama dihapus. Endpoint SSH menggunakan `SecretRef` untuk `keyRef`, bukan materi kunci inline, dan menyertakan `hostKey` dari keluaran penyediaan tepercaya sebagai tepat `algorithm base64`, tanpa nama host atau komentar. Inti menyematkan `hostKey` dan tidak pernah memercayai kunci dari koneksi pertama. Penyedia yang membuat `keyRef` dinamis dapat mengimplementasikan `resolveSshIdentity({ leaseId, profile, keyRef })`; jika tersedia, resolver tersebut bersifat otoritatif, sedangkan penyedia tanpa resolver itu menggunakan resolver rahasia generik yang dikonfigurasi.
Penyedia dengan lease yang dapat diperbarui juga dapat mengimplementasikan `renew(leaseId)`.
`inspect` harus melempar pada kegagalan sementara atau tak tentu; hanya kembalikan `unknown` untuk ketidaktersediaan yang otoritatif. Inti menandai catatan lokal aktif sebagai yatim, atau memperlakukan ketidaktersediaan tersebut sebagai selesainya pembongkaran setelah permintaan pemusnahan disimpan.

Penyedia embedding yang didaftarkan dengan `api.registerEmbeddingProvider(...)` juga harus
dicantumkan dalam `contracts.embeddingProviders` di manifes plugin. Ini
adalah permukaan embedding generik untuk pembuatan vektor yang dapat digunakan kembali. Pencarian memori
dapat menggunakan permukaan penyedia generik ini. Seam
`api.registerMemoryEmbeddingProvider(...)` dan
`contracts.memoryEmbeddingProviders` yang lebih lama merupakan kompatibilitas usang sementara
penyedia khusus memori yang ada bermigrasi.

Penyedia khusus memori yang masih mengekspos `batchEmbed(...)` runtime tetap menggunakan
kontrak batching per berkas yang ada, kecuali runtime-nya secara eksplisit menetapkan
`sourceWideBatchEmbed: true`. Opsi ikut serta tersebut memungkinkan host memori mengirim chunk dari
beberapa berkas memori yang berubah dan sumber yang diaktifkan dalam satu panggilan `batchEmbed(...)` hingga
batas batch host. Adaptor batch yang mengunggah berkas permintaan JSONL harus
membagi tugas penyedia sebelum mencapai batas ukuran unggah serta batas jumlah
permintaannya. Penyedia harus mengembalikan satu embedding per chunk masukan dalam urutan yang sama dengan
`batch.chunks`; hilangkan flag tersebut jika penyedia mengharapkan batch lokal berkas atau
tidak dapat mempertahankan urutan masukan dalam tugas seluruh sumber yang lebih besar.

### Alat dan perintah

Gunakan [`defineToolPlugin`](/id/plugins/tool-plugins) untuk plugin sederhana yang hanya berisi alat
dengan nama alat tetap. Gunakan `api.registerTool(...)` secara langsung untuk plugin campuran
atau pendaftaran alat yang sepenuhnya dinamis.

| Metode                                 | Yang didaftarkan                                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Alat agen (wajib atau `{ optional: true }`)                                                                                                  |
| `api.registerCommand(def)`             | Perintah khusus (melewati LLM)                                                                                                                |
| `api.registerNodeHostCommand(command)` | Perintah yang ditangani oleh `openclaw node run`; metadata `agentTool` opsional dapat mengeksposnya sebagai alat yang terlihat oleh agen saat node terhubung |

Perintah plugin dapat menetapkan `agentPromptGuidance` saat agen memerlukan petunjuk perutean singkat
yang dimiliki perintah. Pertahankan agar teks tersebut membahas perintah itu sendiri; jangan tambahkan
kebijakan khusus penyedia atau plugin ke builder prompt inti.

Entri panduan dapat berupa string lama, yang diterapkan pada setiap permukaan prompt, atau
entri terstruktur:

```ts
agentPromptGuidance: [
  "Petunjuk perintah global.",
  { text: "Hanya tampilkan ini dalam prompt utama OpenClaw.", surfaces: ["openclaw_main"] },
];
```

`surfaces` terstruktur dapat mencakup `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, atau `subagent`. `pi_main` tetap menjadi alias usang
untuk `openclaw_main`. Hilangkan `surfaces` untuk panduan semua permukaan yang disengaja. Jangan
berikan array `surfaces` kosong; array tersebut ditolak agar hilangnya cakupan secara tidak sengaja tidak
menjadi teks prompt global.

Instruksi pengembang app-server Codex native lebih ketat daripada permukaan prompt
lainnya: hanya panduan yang secara eksplisit dibatasi ke `codex_app_server` yang dipromosikan ke
jalur berprioritas lebih tinggi tersebut. Panduan string lama dan panduan terstruktur tanpa cakupan
tetap tersedia bagi permukaan prompt non-Codex untuk kompatibilitas.

Perintah host Node dijalankan pada host Node yang terhubung, bukan di dalam proses
Gateway. Jika `agentTool` tersedia, Node menerbitkan deskriptor setelah
berhasil terhubung ke Gateway; Gateway mengeksposnya ke proses agen hanya selama
Node tersebut terhubung dan hanya jika `command` milik deskriptor berada dalam
permukaan perintah Node yang disetujui. Atur `agentTool.defaultPlatforms` untuk memasukkan
perintah yang tidak berbahaya ke daftar izin perintah Node default; jika tidak, wajibkan
`gateway.nodes.allowCommands` secara eksplisit atau kebijakan pemanggilan Node. `agentTool.name`
harus aman bagi penyedia: diawali dengan huruf, hanya menggunakan huruf, angka,
garis bawah, atau tanda hubung, dan tidak lebih dari 64 karakter. Alat Node yang didukung MCP
dapat menetapkan metadata `agentTool.mcp` agar permukaan katalog dan pencarian alat dapat menampilkan
identitas server/alat MCP jarak jauh, tetapi eksekusi tetap dilakukan melalui
perintah Node yang diumumkan.

### Infrastruktur

| Metode                                          | Yang didaftarkan                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook peristiwa                                                          |
| `api.registerHttpRoute(params)`                 | Titik akhir HTTP Gateway                                               |
| `api.registerGatewayMethod(name, handler)`      | Metode RPC Gateway                                                     |
| `api.registerGatewayDiscoveryService(service)`  | Pengiklan penemuan Gateway lokal                                       |
| `api.registerCli(registrar, opts?)`             | Subperintah CLI                                                        |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI fitur Node di bawah `openclaw nodes`                                |
| `api.registerService(service)`                  | Layanan latar belakang                                                 |
| `api.registerInteractiveHandler(registration)`  | Penangan interaktif                                                    |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware hasil alat runtime                                          |
| `api.registerMemoryPromptSupplement(builder)`   | Bagian prompt tambahan yang berdekatan dengan memori                   |
| `api.registerMemoryPromptPreparation(prepare)`  | Persiapan asinkron untuk bagian prompt yang berdekatan dengan memori    |
| `api.registerMemoryCorpusSupplement(adapter)`   | Korpus pencarian/pembacaan memori tambahan                             |
| `api.registerHostedMediaResolver(resolver)`     | Penyelesai untuk URL media yang dihosting bergaya peramban              |
| `api.registerMcpServerConnectionResolver(...)`  | Transport MCP per peminta (`url`/`headers`) untuk nama server statis |
| `api.registerTextTransforms(transforms)`        | Penulisan ulang teks kompatibilitas prompt/pesan milik Plugin          |
| `api.registerConfigMigration(migrate)`          | Migrasi konfigurasi ringan yang dijalankan sebelum runtime Plugin dimuat |
| `api.registerMigrationProvider(provider)`       | Pengimpor untuk `openclaw migrate`                                     |
| `api.registerAutoEnableProbe(probe)`            | Pemeriksaan konfigurasi yang dapat mengaktifkan Plugin ini secara otomatis |
| `api.registerReload(registration)`              | Kebijakan prefiks konfigurasi mulai ulang/hot/noop untuk penanganan pemuatan ulang |
| `api.registerNodeHostCommand(command)`          | Penangan perintah yang diekspos ke Node yang dipasangkan                |
| `api.registerNodeInvokePolicy(policy)`          | Kebijakan daftar izin/persetujuan untuk perintah yang dipanggil Node    |
| `api.registerSecurityAuditCollector(collector)` | Pengumpul temuan untuk `openclaw security audit`                       |

#### Pekerjaan Webhook setelah pengakuan

Rute Webhook yang mengakui permintaan sebelum pemrosesan selesai harus memindahkan
pekerjaan terpisah tersebut ke akar penerimaan terlacaknya sendiri:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`webhook dispatch failed: ${String(error)}`);
});
```

Panggil `runDetachedWebhookWork(...)` secara sinkron saat permintaan HTTP masih
diterima. Pembantu tersebut segera mencadangkan akar independen, lalu memulai
callback pada mikrotugas berikutnya agar penangan permintaan dapat menulis
pengakuannya terlebih dahulu. Promise yang dikembalikan mengadopsi hasil callback; pemanggil
tetap bertanggung jawab menangani penolakan. Hal ini menjaga agar pekerjaan antrean setelah pengakuan tetap diterima dan membuat
pengurasan saat mulai ulang atau penangguhan menunggunya. Penangan yang menunggu seluruh pemrosesan
sebelum kembali tidak memerlukan pembantu ini.

#### Koneksi MCP yang dicakup per peminta

Pertahankan **identitas** server MCP tetap statis (nama, filter alat) di `mcp.servers` atau
manifes bundel. Secara opsional, daftarkan penyelesai koneksi agar setiap
peminta pesan tepercaya memperoleh transportnya sendiri:

```ts
api.registerMcpServerConnectionResolver({
  serverName: "user-email",
  resolve: async (ctx) => {
    // ctx.requesterSenderId is host-trusted; never invent sender identity here.
    const token = await lookupUserToken(ctx.requesterSenderId);
    if (!token) {
      return null; // omit this server for the current run
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
- Satu Plugin memiliki satu nama server: `registerMcpServerConnectionResolver`
  duplikat untuk `serverName` yang sama dari Plugin lain
  ditolak dengan diagnostik kesalahan (pendaftaran pertama berlaku), sehingga
  kepemilikan koneksi tidak pernah bergantung pada urutan pemuatan Plugin.
- Nama alat diturunkan dari seluruh kumpulan server yang dideklarasikan sehingga resolusi parsial
  tidak pernah mengubah nama server aman di antara peminta atau giliran. Core tidak
  memverifikasi bahwa titik akhir peminta yang berbeda menyediakan skema alat yang identik; sebuah
  penyelesai harus mengarahkan setiap peminta ke layanan logis yang sama, atau skema
  alat (dan stabilitas cache prompt) akan berbeda untuk setiap peminta.
- Proses tanpa `requesterSenderId` tepercaya (cron, subagen, Heartbeat, Gateway
  publik) tidak pernah mewujudkan server yang dicakup per peminta. Tidak ada
  koneksi fallback bersama.
- `resolve` dibatasi hingga 10 detik per server; batas waktu atau pelemparan kesalahan akan menghilangkan
  server tersebut dari proses tanpa menyebabkan MCP statis gagal.
- Koneksi yang diselesaikan divalidasi ulang paling sering setiap 5 menit per peminta:
  rotasi membangun ulang transport dengan kredensial baru, dan hasil `null`
  mencabutnya (runtime yang di-cache dibuang bahkan di tengah sesi). Kredensial yang dicabut atau
  dirotasi karena itu dapat tetap digunakan hingga 5 menit.
- `headers` yang diselesaikan tidak pernah dicatat atau dipersistenkan; core hanya menyimpan digest berkunci
  sementara dalam memori (HMAC lokal proses) untuk mendeteksi rotasi kredensial, serta
  mendaftarkan nilai kredensial header/URL yang diselesaikan pada registri penyamaran
  pengambilan log/debug.
- Server yang dicakup per peminta tidak membuat tampilan MCP App: sebuah tampilan bertahan lebih lama daripada
  proses yang diautentikasi peminta dan batas tampilan Gateway tidak memiliki identitas
  peminta, sehingga pratinjau aplikasi tetap tertutup saat gagal untuk server ini. Hasil alat
  tidak terpengaruh.
- Server statis tanpa penyelesai mempertahankan siklus hidup yang dicakup per sesi.
- **Aturan pengiriman harness:** server yang dicakup per peminta tidak pernah masuk ke
  konfigurasi klien MCP native harness (thread Codex `mcp_servers`, CLI `-c mcp_servers=…`, atau
  proyeksi MCP bersama sesi lainnya). Sebagai gantinya, harness mengirimkannya sebagai alat yang dicakup
  per proses:
  - Runner tertanam: runtime MCP sesi + alat bundel (statis + tercakup).
  - Server aplikasi Codex: alat dinamis melalui
    `materializeRequesterScopedMcpToolsForHarnessRun` (hanya yang tercakup; server
    statis tetap berada pada klien MCP native Codex).
- **Spesifikasi** alat tercakup stabil sepanjang sesi setelah resolusi pertama yang berhasil dalam
  sesi tersebut, sehingga harness thread bersama (Codex) tidak merotasi thread saat
  pengirim berubah. Sebelum peminta mana pun diselesaikan, tidak ada spesifikasi tercakup yang diumumkan.
- Peminta yang tidak diautentikasi pada harness thread bersama tetap melihat alat tercakup
  yang diumumkan; memanggil salah satunya mengembalikan kesalahan alat tidak terhubung yang bersih untuk
  peminta tersebut. OpenClaw tidak pernah menggunakan kredensial peminta lain sebagai fallback.

Pembuat suplemen prompt memori menerima konteks opsional `agentId`,
`agentSessionKey`, dan `sandboxed`. Panggilan `search`
dan `get` suplemen korpus memori menerima konteks opsional `agentId` dan `sandboxed`. Plugin dengan
penyimpanan milik agen harus menyelesaikan penyimpanan tersebut untuk setiap panggilan, bukan
menangkap satu jalur global selama pendaftaran. Jika id agen diperlukan tetapi
tidak tersedia dalam operasi multiagen, tutup saat gagal daripada memilih
agen secara sewenang-wenang.

Gunakan `registerMemoryPromptPreparation(...)` ketika teks prompt bergantung pada status Plugin
asinkron. Callback dijalankan sekali sebelum setiap prompt agen lengkap dan menerima
konteks alat, agen, sesi, dan sandbox yang sama dengan pembuat prompt memori
sinkron. Validasi instans pemilik penyimpanan saat ini sebelum memuat status
yang dipersistenkan, lalu hanya kembalikan baris untuk proses tersebut. OpenClaw membekukan baris tersebut dan
menyerahkan hasil yang tidak dapat diubah ke perakitan prompt sinkron. Pertahankan persistensi,
penggantian atomik, dan penghapusan saat pemilik dihapus di dalam Plugin pemilik; jangan
melakukan polling atau membaca berkas dari pembuat prompt.

Penangan interaktif Telegram dapat mengembalikan `{ submitText }` untuk merutekan teks melalui
jalur agen masuk normal Telegram setelah penangan berhasil. OpenClaw mempertahankan
tombol callback ketika kebijakan masuk melewati teks atau pemrosesan gagal, sehingga
pengguna dapat mencoba lagi setelah kondisi penghambat berubah. Kolom hasil ini
khusus Telegram; saluran lain mempertahankan kontrak hasil interaktifnya masing-masing.

### Hook host untuk Plugin alur kerja

Hook host adalah sambungan SDK bagi Plugin yang perlu berpartisipasi dalam siklus hidup
host, bukan hanya menambahkan penyedia, saluran, atau alat. Hook ini merupakan
kontrak generik; Mode Rencana dapat menggunakannya, demikian pula alur kerja persetujuan,
gerbang kebijakan ruang kerja, pemantau latar belakang, wizard penyiapan, dan Plugin pendamping
UI.

| Metode                                                                               | Kontrak yang dimilikinya                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Status sesi milik Plugin yang kompatibel dengan JSON dan diproyeksikan melalui sesi Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Konteks persis-sekali yang persisten, disuntikkan ke giliran agen berikutnya untuk satu sesi                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Kebijakan alat tepercaya pra-Plugin yang dibatasi manifes dan dapat memblokir atau menulis ulang parameter alat                                                                        |
| `api.registerToolMetadata(...)`                                                      | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                                                     |
| `api.registerCommand(...)`                                                           | Perintah Plugin terbatas cakupan; hasil perintah dapat menetapkan `continueAgent: true` atau `suppressReply: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskriptor kontribusi Control UI untuk permukaan sesi, alat, proses, pengaturan, atau tab                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback pembersihan untuk sumber daya runtime milik Plugin pada jalur reset/hapus/muat ulang                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Langganan peristiwa yang disanitasi untuk status alur kerja dan monitor                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Status sementara Plugin per proses yang dihapus pada siklus hidup terminal proses                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadata pembersihan untuk pekerjaan penjadwal milik Plugin; tidak menjadwalkan pekerjaan atau membuat catatan tugas                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Pengiriman lampiran file khusus bawaan yang dimediasi host ke rute sesi keluar langsung yang aktif                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Giliran sesi terjadwal khusus bawaan yang didukung Cron beserta pembersihan berbasis tag                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Tindakan sesi bertipe yang dapat dikirim klien melalui Gateway                                                                                             |

Deskriptor `surface: "tab"` menambahkan tab bilah sisi ke Control UI. Deskriptor tab
Plugin yang aktif diumumkan kepada klien dasbor dalam hello gateway
(`controlUiTabs`), sehingga tab hanya muncul saat Plugin diaktifkan.
Plugin bawaan dapat menyertakan tampilan dasbor kelas utama untuk tabnya; Plugin
lain dapat menetapkan `path` ke rute HTTP Plugin (lihat
`api.registerHttpRoute(...)`) yang dirender dasbor dalam bingkai terisolasi.
`icon` adalah petunjuk nama ikon dasbor, `group` memilih bagian bilah sisi
(`control` atau `agent`), `order` mengurutkan tab Plugin, dan `requiredScopes`
menyembunyikan tab dari koneksi yang tidak memiliki cakupan operator tersebut:

Untuk tab eksternal yang dilindungi gateway, daftarkan deskriptor `path` di bawah
rute HTTP `auth: "gateway"` dari Plugin yang sama. Setelah bootstrap terautentikasi, browser memperoleh
izin HttpOnly berumur pendek yang dibatasi pada Plugin dan akar rute tersebut agar
bingkai terisolasi dapat dimuat tanpa menyalin token bearer Gateway ke URL
atau JavaScript-nya. Induk terautentikasi memperbarui izin saat tab eksternal
aktif dan sebelum memasangnya setelah navigasi atau browser dilanjutkan. Induk juga
memeriksa izin dari sandbox buram yang sama sebelum memasang, sehingga mode
privasi browser yang memblokir cookie akan gagal secara tertutup dengan panel yang tidak tersedia.
Izin bingkai hanya menerima `GET` dan `HEAD` serta selalu membawa
`operator.read`; `requiredScopes` mengendalikan visibilitas tab tetapi tidak pernah memperluas
izin cookie. Mutasi tetap berada pada permukaan induk yang diautentikasi Gateway secara eksplisit atau
permukaan bearer. Tab eksternal memerlukan HTTPS/Tailscale Serve atau
origin loopback yang dipercaya browser; HTTP biasa pada host LAN menampilkan
kesalahan konteks aman alih-alih memasang panel yang tidak dapat melakukan autentikasi.
Pemblokiran penuh cookie pihak ketiga juga membuat tab yang dilindungi gateway tidak tersedia.
Seperti semua permukaan Plugin native, bingkai tetap berada di dalam batas kepercayaan
Plugin yang terpasang; OpenClaw tidak memperlakukan Plugin yang terpasang sebagai prinsipal
keamanan browser yang saling terisolasi.
Izin cookie menggunakan batas nama host browser, bukan batas portnya. Jangan
meng-host bersama layanan yang tidak saling dipercaya pada nama host Gateway, bahkan pada port
lain.
Tab yang didukung autentikasi yang dikelola Plugin mempertahankan perilaku iframe langsungnya dan tidak
meminta atau memerlukan izin Gateway ini.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Buku Log",
  description: "Hari Anda sebagai linimasa, yang dibuat dari cuplikan layar.",
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

Metode datar yang setara tetap tersedia sebagai alias kompatibilitas yang
tidak digunakan lagi untuk Plugin yang sudah ada. Jangan tambahkan kode Plugin baru yang memanggil
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, atau
`api.unscheduleSessionTurnsByTag` secara langsung.

`scheduleSessionTurn(...)` adalah kemudahan terbatas sesi di atas penjadwal
Cron Gateway. Cron memiliki pengaturan waktu dan membuat catatan tugas latar belakang saat
giliran berjalan; SDK Plugin hanya membatasi sesi target, penamaan milik Plugin,
dan pembersihan. Gunakan `api.runtime.tasks.managedFlows` di dalam giliran
terjadwal saat pekerjaan itu sendiri memerlukan status Task Flow persisten dengan beberapa langkah.

Kontrak sengaja memisahkan wewenang:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah, metadata
  alat, injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan
  dipercaya oleh host. Kebijakan bawaan berjalan terlebih dahulu; kebijakan Plugin terpasang memerlukan
  pengaktifan eksplisit beserta ID lokalnya dalam
  `contracts.trustedToolPolicies`, lalu berjalan sesuai urutan pemuatan Plugin. ID kebijakan
  dibatasi pada Plugin yang mendaftarkannya.
- Kepemilikan perintah yang dicadangkan hanya untuk bawaan. Plugin eksternal sebaiknya menggunakan
  nama perintah atau aliasnya sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang mengubah prompt, termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  dan `enqueueNextTurnInjection`.

Contoh konsumen non-Plan:

| Arketipe Plugin             | Hook yang digunakan                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alur kerja persetujuan            | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, deskriptor UI                                                            |
| Gerbang kebijakan anggaran/ruang kerja | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                                 |
| Monitor siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan penjadwal sesi, kontribusi prompt heartbeat, deskriptor UI |
| Wizard penyiapan atau orientasi   | Ekstensi sesi, perintah terbatas cakupan, deskriptor Control UI                                                                              |

<Note>
  Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, meskipun Plugin mencoba menetapkan
  cakupan metode gateway yang lebih sempit. Utamakan prefiks khusus Plugin untuk
  metode milik Plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil alat">
  Plugin bawaan dan Plugin terpasang yang diaktifkan secara eksplisit dengan kontrak
  manifes yang cocok dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat
  perlu menulis ulang hasil alat setelah eksekusi dan sebelum runtime
  memasukkan hasil tersebut kembali ke model. Ini adalah sambungan netral-runtime tepercaya
  untuk pereduksi keluaran asinkron seperti tokenjuice.

Plugin harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap
runtime yang ditargetkan, misalnya `["openclaw", "codex"]`. Plugin terpasang tanpa
kontrak tersebut, atau tanpa pengaktifan eksplisit, tidak dapat mendaftarkan middleware ini; pertahankan
hook Plugin OpenClaw normal untuk pekerjaan yang tidak memerlukan pengaturan waktu hasil alat
pra-model. Jalur pendaftaran factory ekstensi lama yang
khusus runner tertanam telah dihapus.
</Accordion>

### Pendaftaran penemuan Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengumumkan Gateway yang aktif
pada transportasi penemuan lokal seperti mDNS/Bonjour. OpenClaw memanggil
layanan tersebut selama startup Gateway ketika penemuan lokal diaktifkan, meneruskan
port Gateway saat ini dan data petunjuk TXT nonrahasia, serta memanggil handler
`stop` yang dikembalikan selama penonaktifan Gateway.

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
memiliki kendali atas kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata perintah:

- `commands`: nama perintah eksplisit yang dimiliki pendaftar
- `descriptors`: deskriptor perintah waktu penguraian yang digunakan untuk bantuan CLI,
  perutean, dan pendaftaran CLI Plugin secara malas
- `parentPath`: jalur perintah induk opsional untuk grup perintah bersarang, seperti
  `["nodes"]`

Untuk fitur Node berpasangan, utamakan
`api.registerNodeCliFeature(registrar, opts?)`. Ini adalah pembungkus kecil di sekitar
`api.registerCli(..., { parentPath: ["nodes"] })` dan menjadikan perintah seperti
`openclaw nodes canvas` sebagai fitur Node yang secara eksplisit dimiliki Plugin.

Jika Anda ingin perintah Plugin tetap dimuat secara malas pada jalur CLI root normal,
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Perintah bertingkat menerima perintah induk yang telah di-resolve sebagai `program`:

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

Gunakan `commands` secara mandiri hanya jika Anda tidak memerlukan pendaftaran CLI root secara lazy.
Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak memasang
placeholder berbasis descriptor untuk pemuatan lazy pada waktu parsing.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `claude-cli` atau `my-cli`.

- `id` backend menjadi prefiks penyedia dalam referensi model seperti `my-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama dengan `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap diutamakan. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalisasi bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv dengan cakupan permintaan yang merupakan bagian dari
  dialek CLI, seperti memetakan tingkat pemikiran OpenClaw ke flag upaya
  native. Hook menerima `ctx.executionMode`; gunakan `"side-question"` untuk menambahkan
  flag isolasi native backend bagi panggilan `/btw` sementara. Jika flag tersebut
  secara andal menonaktifkan alat native untuk CLI yang sebaliknya selalu aktif, deklarasikan juga
  `sideQuestionToolMode: "disabled"`.
- Gunakan `prepareExecution` untuk lingkungan peluncuran yang dimiliki backend atau jembatan
  autentikasi/konfigurasi sementara. `ctx.contextTokenBudget` miliknya adalah batas token efektif
  yang dipilih untuk proses tersebut, sehingga backend dengan compaction native dapat menyelaraskan
  ambangnya sendiri tanpa cabang inti khusus penyedia.
- Backend yang dapat menonaktifkan semua alat native untuk proses tertentu dapat mendeklarasikan
  `nativeToolMode: "selectable"`. Panggilan terbatas meneruskan tuple
  `ctx.toolAvailability.native` kosong beserta daftar izin MCP terisolasi host yang tepat;
  `resolveExecutionArgs` harus menerapkan keduanya pada argv fresh atau resume final.
  OpenClaw gagal secara tertutup jika backend tidak dapat melakukannya.

Untuk panduan penulisan menyeluruh, lihat
[plugin backend CLI](/id/plugins/cli-backend-plugins).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback siklus hidup menerima `runtimeSettings` ketika host dapat menyediakan diagnostik model/penyedia/mode; mesin ketat yang lebih lama dicoba ulang tanpa kunci tersebut. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                                                          |

### Adaptor embedding memori yang tidak digunakan lagi

| Metode                                         | Yang didaftarkan                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptor embedding memori untuk plugin aktif |

- `registerMemoryCapability` adalah API plugin memori eksklusif.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  untuk ekspor yang dikelola host. Plugin pendamping yang mengenumerasi artefak
  yang dideklarasikan tersebut tetap menggunakan `listActiveMemoryPublicArtifacts(...)` dari fasad
  `openclaw/plugin-sdk/memory-host-core` yang dipertahankan hingga tersedia API konsumen publik
  yang terfokus; plugin tersebut tidak boleh mengakses tata letak privat plugin lain.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi `provider/model`
  yang tepat, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback aktif.
- `registerMemoryEmbeddingProvider` tidak digunakan lagi. Penyedia embedding baru
  harus menggunakan `api.registerEmbeddingProvider(...)` dan
  `contracts.embeddingProviders`.
- Penyedia khusus memori yang sudah ada tetap berfungsi selama jendela migrasi,
  tetapi pemeriksaan plugin melaporkan hal ini sebagai utang kompatibilitas untuk
  plugin yang tidak dibundel.

### Peristiwa dan siklus hidup

| Metode                                       | Fungsinya                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe          |
| `api.onConversationBindingResolved(handler)` | Callback pengikatan percakapan |

Lihat [hook Plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik
guard.

### Semantik keputusan hook

`before_install` adalah hook siklus hidup runtime plugin, bukan permukaan kebijakan
instalasi operator. Gunakan `security.installPolicy` ketika keputusan izinkan/blokir harus
mencakup jalur instalasi atau pembaruan yang didukung CLI dan Gateway.

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengambil alih dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan bidang `threadId` bertipe saat Anda memerlukan perutean thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus channel.
- `message_sending`: gunakan bidang perutean bertipe `replyToId` / `threadId` sebelum beralih ke fallback `metadata` khusus channel.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup yang dimiliki gateway, alih-alih mengandalkan hook internal `gateway:startup`. Cron mungkin masih dimuat pada titik ini.
- `cron_reconciled`: bangun ulang proyeksi cron eksternal lengkap setelah startup atau pemuatan ulang penjadwal. Ini mencakup `reason` dan status efektif `enabled`, termasuk `enabled: false`, sementara `ctx.getCron?.()` mengembalikan penjadwal hasil rekonsiliasi yang tepat. Teruskan `ctx.abortSignal` ke pekerjaan proyeksi persisten; proses tersebut dibatalkan ketika snapshot penjadwal itu digantikan atau Gateway ditutup.
- `cron_changed`: amati perubahan siklus hidup cron yang dimiliki gateway. Peristiwa `scheduled` dan `removed` adalah petunjuk rekonsiliasi pasca-commit, bukan log delta berurutan. `event.nextRunAtMs` milik peristiwa terjadwal tidak tersedia ketika pekerjaan tidak memiliki waktu bangun berikutnya; peristiwa penghapusan tetap membawa snapshot pekerjaan yang dihapus.

Penjadwal bangun eksternal harus menerapkan debounce atau menggabungkan peristiwa `cron_changed`,
lalu membaca ulang tampilan persisten lengkap dari penjadwal yang terakhir ditangkap oleh
`cron_reconciled`. Jangan mengadopsi penjadwal dari konteks `cron_changed`: petunjuk
terlepas dari penjadwal lama dapat bertumpang tindih dengan pemuatan ulang berikutnya.

Gunakan `cron_reconciled` sebagai pemicu snapshot lengkap untuk status persisten yang dimuat saat
startup Gateway atau penggantian penjadwal. Ini tidak diputar ulang untuk hot reload
khusus plugin. Handler pengamatan berjalan secara paralel, dan dispatch
fire-and-forget dapat bertumpang tindih, sehingga konsumen tidak boleh bergantung pada urutan penyelesaian peristiwa.
Pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan waktu jatuh tempo dan eksekusi.

Untuk adaptor single-flight dengan penggantian persisten, percobaan ulang/backoff, dan penghentian
yang bersih, lihat [Proyeksi cron eksternal yang aman](/id/plugins/hooks#safe-external-cron-projection).

### Bidang objek API

| Bidang                    | Tipe                      | Deskripsi                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                                |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                   |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                               |
| `api.source`             | `string`                  | Jalur sumber plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori yang aktif jika tersedia)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger dengan cakupan (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/penyiapan ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Resolve jalur relatif terhadap root plugin                                                        |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```text
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Titik masuk plugin
  setup-entry.ts    # Entri ringan khusus penyiapan (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Rutekan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) mengutamakan
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika snapshot
runtime belum tersedia, permukaan tersebut beralih menggunakan file konfigurasi yang telah di-resolve di disk.
Facade plugin bawaan terpaket harus dimuat melalui pemuat facade plugin milik
OpenClaw; impor langsung dari `dist/extensions/...` melewati pemeriksaan manifes
dan sidecar runtime yang digunakan instalasi terpaket untuk kode milik plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal plugin yang terbatas ketika
helper sengaja dibuat khusus untuk penyedia dan belum sesuai ditempatkan dalam subpath
SDK generik. Contoh bawaan:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper
  header beta Claude dan stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder penyedia,
  helper model default, dan builder penyedia realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder penyedia
  beserta helper onboarding/konfigurasi.

<Warning>
  Kode produksi ekstensi juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika suatu helper benar-benar digunakan bersama, promosikan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  lain yang berorientasi kemampuan, alih-alih mengaitkan dua plugin.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Titik entri" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi lengkap namespace `api.runtime`.
  </Card>
  <Card title="Penyiapan dan konfigurasi" icon="sliders" href="/id/plugins/sdk-setup">
    Pemaketan, manifes, dan skema konfigurasi.
  </Card>
  <Card title="Pengujian" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="Migrasi SDK" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Bermigrasi dari permukaan yang tidak digunakan lagi.
  </Card>
  <Card title="Internal plugin" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kemampuan.
  </Card>
</CardGroup>
