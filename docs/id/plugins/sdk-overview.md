---
read_when:
    - Anda perlu mengetahui subjalur SDK mana yang harus diimpor.
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar SDK Plugin
x-i18n:
    generated_at: "2026-07-21T13:02:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 353bcfa9a9ece30677601db275b9db9716a91a1ad33c335a8b11580a262e7d62
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Kontrak SDK plugin adalah kontrak bertipe antara plugin dan inti. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan bagi penulis plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, tugas CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [Integrasi Gateway untuk aplikasi eksternal](/id/gateway/external-apps).
</Note>

<Tip>
Mencari panduan praktis? Mulailah dengan [Membangun plugin](/id/plugins/building-plugins). Gunakan [Plugin saluran](/id/plugins/sdk-channel-plugins) untuk saluran, [Plugin penyedia](/id/plugins/sdk-provider-plugins) untuk penyedia model, [Plugin backend CLI](/id/plugins/cli-backend-plugins) untuk backend CLI AI lokal, [Plugin harness agen](/id/plugins/sdk-agent-harness) untuk eksekutor agen native, dan [Hook plugin](/id/plugins/hooks) untuk hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Hal ini menjaga startup tetap cepat dan
mencegah masalah dependensi melingkar. Untuk pembantu entri/build khusus saluran,
utamakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` hanya untuk
permukaan payung yang lebih luas dan pembantu bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi saluran, publikasikan JSON Schema milik saluran melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan OpenClaw
menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema saluran bawaan
yang dipertahankan. Subpath skema bawaan tersebut bukan pola untuk plugin baru.

<Warning>
  Jangan mengimpor permukaan praktis bermerek penyedia atau saluran (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` miliknya sendiri; konsumen inti sebaiknya menggunakan barrel lokal
  plugin tersebut atau menambahkan kontrak SDK generik yang sempit ketika kebutuhan benar-benar
  berlaku lintas saluran.

Sejumlah kecil permukaan pembantu plugin bawaan masih muncul dalam peta ekspor yang
dihasilkan jika memiliki penggunaan pemilik yang terlacak. Permukaan tersebut hanya ada
untuk pemeliharaan plugin bawaan dan tidak direkomendasikan sebagai jalur impor bagi
plugin pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai fasad kompatibilitas yang tidak digunakan lagi untuk penggunaan pemilik yang
terlacak. Jangan menyalin jalur impor tersebut ke plugin baru; gunakan pembantu runtime
yang diinjeksi dan subpath SDK saluran generik.
</Warning>

## Referensi subpath

SDK plugin diekspos sebagai sekumpulan subpath sempit yang dikelompokkan berdasarkan area (entri
plugin, saluran, penyedia, autentikasi, runtime, kapabilitas, memori, dan pembantu
plugin bawaan yang dicadangkan). Untuk katalog lengkap—yang dikelompokkan dan diberi tautan—lihat
[Subpath SDK plugin](/id/plugins/sdk-subpaths).

Inventaris titik masuk compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor publik bertipe mengecualikan
subpath internal yang tercantum dalam
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Entri produksi
dalam daftar tersebut mempertahankan ekspor runtime host khusus JavaScript untuk plugin resmi
yang dipublikasikan secara terpisah, sedangkan entri khusus pengujian tetap tidak diekspor. Jalankan
`pnpm plugin-sdk:surface` untuk mengaudit jumlah ekspor publik. Subpath publik
yang tidak digunakan lagi, sudah cukup lama, dan tidak digunakan oleh kode produksi ekstensi bawaan
dilacak dalam `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; barrel
ekspor ulang luas yang tidak digunakan lagi dilacak dalam
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode
berikut:

Plugin yang menyediakan permukaan percakapan tim eksternal untuk suatu sesi dapat mendaftarkan
satu penyedia tingkat proses yang diekspor oleh
`openclaw/plugin-sdk/session-discussion`. Metode `info({ sessionKey })` miliknya
melaporkan apakah diskusi tidak tersedia, siap dibuka, atau sudah terbuka;
`open({ sessionKey })` membuat atau menemukan diskusi dan mengembalikan URL sematan
serta URL eksternalnya. Mendaftarkan penyedia lain akan menggantikan penyedia saat ini.

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                                                                |
| `api.registerWorkerProvider(...)`                | Sewa siklus hidup pekerja cloud                                                     |
| `api.registerModelCatalogProvider(...)`          | Baris katalog model untuk pembuatan teks dan media                                  |
| `api.registerAgentHarness(...)`                  | Eksekutor agen native [Eksperimental](/id/plugins/sdk-agent-harness) (Codex, Copilot)  |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal                                                         |
| `api.registerChannel(...)`                       | Saluran perpesanan                                                                  |
| `api.registerEmbeddingProvider(...)`             | Penyedia embedding vektor yang dapat digunakan kembali                              |
| `api.registerSpeechProvider(...)`                | Sintesis teks-ke-ucapan / STT                                                       |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi waktu nyata streaming                                                   |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara waktu nyata dupleks                                                      |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video                                                         |
| `api.registerTranscriptSourceProvider(...)`      | Sumber transkrip rapat langsung atau yang diimpor                                   |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                                                                    |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                                                                     |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                                                                     |
| `api.registerWebFetchProvider(...)`              | Penyedia pengambilan / scraping web                                                 |
| `api.registerWebSearchProvider(...)`             | Pencarian web                                                                       |
| `api.registerCompactionProvider(...)`            | Backend pemadatan transkrip yang dapat dipasang                                     |

Penyedia pekerja juga harus mendeklarasikan id mereka dalam `contracts.workerProviders`.
Inti mempertahankan intensi yang tahan lama sebelum `provision(profile, operationId)`. Penyedia memvalidasi pengaturan sebelum alokasi eksternal dan melempar `WorkerProviderError` untuk penolakan profil permanen. `provision` harus mengadopsi sewa yang sama ketika id operasi berulang.
Inti mempertahankan pengaturan profil yang telah divalidasi bersama sewa dan memberikan snapshot tersebut kepada `destroy({ leaseId, profile })`, yang harus idempoten, serta `inspect({ leaseId, profile })`, yang mengembalikan `active`, `destroyed`, atau `unknown`. Hal ini memungkinkan penyedia merutekan panggilan siklus hidup setelah Gateway dimulai ulang atau profil bernama dihapus. Endpoint SSH menggunakan `SecretRef` untuk `keyRef`, bukan material kunci inline, dan menyertakan `hostKey` dari output penyediaan tepercaya tepat sebagai `algorithm base64`, tanpa nama host atau komentar. Inti menyematkan `hostKey` dan tidak pernah memercayai kunci dari koneksi pertama. Penyedia yang menerbitkan `keyRef` dinamis dapat mengimplementasikan `resolveSshIdentity({ leaseId, profile, keyRef })`; jika tersedia, resolver tersebut bersifat otoritatif, sedangkan penyedia tanpanya menggunakan resolver rahasia generik yang dikonfigurasi.
Penyedia dengan sewa yang dapat diperbarui juga dapat mengimplementasikan `renew(leaseId)`.
`inspect` harus melempar pada kegagalan sementara atau yang tidak dapat dipastikan; kembalikan `unknown` hanya untuk ketiadaan yang otoritatif. Inti menandai catatan lokal aktif sebagai yatim, atau memperlakukan ketiadaan tersebut sebagai penyelesaian pembongkaran setelah permintaan penghancuran dipertahankan.

Penyedia embedding yang didaftarkan dengan `api.registerEmbeddingProvider(...)` juga harus
dicantumkan dalam `contracts.embeddingProviders` di manifes plugin. Ini
adalah permukaan embedding generik untuk pembuatan vektor yang dapat digunakan kembali. Pencarian memori
dapat menggunakan permukaan penyedia generik ini. Permukaan lama
`api.registerMemoryEmbeddingProvider(...)` dan
`contracts.memoryEmbeddingProviders` adalah kompatibilitas yang tidak digunakan lagi sementara
penyedia khusus memori yang ada bermigrasi.

Penyedia khusus memori yang masih mengekspos `batchEmbed(...)` runtime tetap menggunakan
kontrak batching per file yang ada, kecuali runtime mereka secara eksplisit menetapkan
`sourceWideBatchEmbed: true`. Pilihan ikut serta tersebut memungkinkan host memori mengirim potongan dari
beberapa file memori kotor dan sumber yang diaktifkan dalam satu panggilan `batchEmbed(...)`
hingga batas batch host. Adaptor batch yang mengunggah file permintaan JSONL juga harus
membagi tugas penyedia sebelum batas ukuran unggah maupun batas jumlah
permintaannya. Penyedia harus mengembalikan satu embedding per potongan input dalam urutan yang sama dengan
`batch.chunks`; hilangkan flag tersebut ketika penyedia mengharapkan batch lokal file atau
tidak dapat mempertahankan urutan input dalam tugas yang lebih besar dan mencakup seluruh sumber.

### Alat dan perintah

Gunakan [`defineToolPlugin`](/id/plugins/tool-plugins) untuk plugin sederhana khusus alat
dengan nama alat tetap. Gunakan `api.registerTool(...)` secara langsung untuk plugin campuran
atau pendaftaran alat yang sepenuhnya dinamis.

| Metode                                 | Yang didaftarkan                                                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Alat agen (wajib atau `{ optional: true }`)                                                                                                    |
| `api.registerCommand(def)`             | Perintah khusus (melewati LLM)                                                                                                               |
| `api.registerNodeHostCommand(command)` | Perintah yang ditangani oleh `openclaw node run`; metadata opsional `agentTool` dapat mengeksposnya sebagai alat yang terlihat oleh agen saat node terhubung |

Perintah plugin dapat menetapkan `agentPromptGuidance` ketika agen memerlukan petunjuk
perutean singkat milik perintah. Pastikan teks tersebut membahas perintah itu sendiri; jangan menambahkan
kebijakan khusus penyedia atau plugin ke builder prompt inti.

Entri panduan dapat berupa string lama, yang berlaku pada setiap permukaan prompt, atau
entri terstruktur:

```ts
agentPromptGuidance: [
  "Petunjuk perintah global.",
  { text: "Hanya tampilkan ini dalam prompt utama OpenClaw.", surfaces: ["openclaw_main"] },
];
```

`surfaces` terstruktur dapat mencakup `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, atau `subagent`. `pi_main` tetap menjadi alias
yang tidak digunakan lagi untuk `openclaw_main`. Hilangkan `surfaces` untuk panduan semua permukaan yang disengaja. Jangan
meneruskan array `surfaces` kosong; array tersebut ditolak agar hilangnya cakupan secara tidak sengaja tidak
menjadi teks prompt global.

Instruksi developer app-server Codex native lebih ketat daripada permukaan prompt
lainnya: hanya panduan yang secara eksplisit dicakup ke `codex_app_server` yang dipromosikan ke
jalur dengan prioritas lebih tinggi tersebut. Panduan string lama dan panduan terstruktur tanpa cakupan
tetap tersedia bagi permukaan prompt non-Codex untuk kompatibilitas.

Perintah host Node dijalankan pada host Node yang terhubung, bukan di dalam proses
Gateway. Jika `agentTool` tersedia, Node menerbitkan deskriptor setelah
berhasil terhubung ke Gateway; Gateway mengeksposnya ke proses agen hanya selama
Node tersebut terhubung dan hanya jika `command` milik deskriptor berada dalam
permukaan perintah Node yang disetujui. Atur `agentTool.defaultPlatforms` untuk memasukkan
perintah yang tidak berbahaya ke dalam daftar izin perintah Node bawaan; jika tidak,
wajibkan `gateway.nodes.allowCommands` secara eksplisit atau kebijakan pemanggilan Node. `agentTool.name`
harus aman bagi penyedia: diawali dengan huruf, hanya menggunakan huruf, angka,
garis bawah, atau tanda hubung, dan tidak melebihi 64 karakter. Alat Node yang didukung MCP
dapat mengatur metadata `agentTool.mcp` agar permukaan katalog dan pencarian alat dapat menampilkan
identitas server/alat MCP jarak jauh, tetapi eksekusi tetap dilakukan melalui
perintah Node yang diumumkan.

### Infrastruktur

| Metode                                          | Yang didaftarkan                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook peristiwa                                                          |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP Gateway                                                  |
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
| `api.registerHostedMediaResolver(resolver)`     | Resolver untuk URL media ter-host bergaya peramban                     |
| `api.registerMcpServerConnectionResolver(...)`  | Transport MCP per pemohon (`url`/`headers`) untuk nama server statis |
| `api.registerTextTransforms(transforms)`        | Penulisan ulang teks kompatibilitas prompt/pesan milik Plugin           |
| `api.registerConfigMigration(migrate)`          | Migrasi konfigurasi ringan yang dijalankan sebelum runtime Plugin dimuat |
| `api.registerMigrationProvider(provider)`       | Pengimpor untuk `openclaw migrate`                                     |
| `api.registerAutoEnableProbe(probe)`            | Pemeriksaan konfigurasi yang dapat mengaktifkan Plugin ini secara otomatis |
| `api.registerReload(registration)`              | Kebijakan prefiks konfigurasi mulai ulang/hot/noop untuk penanganan pemuatan ulang |
| `api.registerNodeHostCommand(command)`          | Penangan perintah yang diekspos kepada Node yang dipasangkan            |
| `api.registerNodeInvokePolicy(policy)`          | Kebijakan daftar izin/persetujuan untuk perintah yang dipanggil Node    |
| `api.registerSecurityAuditCollector(collector)` | Pengumpul temuan untuk `openclaw security audit`                       |

#### Pekerjaan Webhook setelah pengakuan

Rute Webhook yang mengakui permintaan sebelum pemrosesan selesai harus memindahkan
pekerjaan terpisah tersebut ke root penerimaan terlacaknya sendiri:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`pengiriman webhook gagal: ${String(error)}`);
});
```

Panggil `runDetachedWebhookWork(...)` secara sinkron saat permintaan HTTP masih
diterima. Pembantu ini segera mencadangkan root independen, lalu memulai
callback pada microtask berikutnya agar penangan permintaan dapat menuliskan
pengakuannya terlebih dahulu. Promise yang dikembalikan mengadopsi hasil callback; pemanggil
tetap bertanggung jawab menangani penolakan. Hal ini menjaga pekerjaan antrean setelah pengakuan tetap diterima dan membuat
pengurasan saat mulai ulang atau penangguhan menunggunya. Penangan yang menunggu seluruh pemrosesan
sebelum kembali tidak memerlukan pembantu ini.

#### Koneksi MCP dengan cakupan pemohon

Pertahankan **identitas** server MCP tetap statis (nama, filter alat) dalam `mcp.servers` atau
manifes bundel. Secara opsional, daftarkan resolver koneksi agar setiap
pemohon pesan tepercaya memperoleh transportnya sendiri:

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

- Konteks resolver hanya membawa identitas host tepercaya (`requesterSenderId`,
  dengan `agentAccountId` / `messageChannel` opsional). Kolom tepercaya pada masa mendatang (misalnya
  konteks pengguna cron/subagen) dapat ditambahkan secara aditif.
- Satu Plugin memiliki satu nama server: `registerMcpServerConnectionResolver` duplikat
  untuk `serverName` yang sama dari Plugin lain ditolak dengan
  diagnostik kesalahan (pendaftaran pertama berlaku), sehingga kepemilikan
  koneksi tidak pernah bergantung pada urutan pemuatan Plugin.
- Nama alat diturunkan dari seluruh kumpulan server yang dideklarasikan sehingga resolusi parsial
  tidak pernah mengubah nama server aman di antara pemohon atau giliran. Core tidak
  memverifikasi bahwa endpoint pemohon yang berbeda menyajikan skema alat yang identik; sebuah
  resolver harus mengarahkan setiap pemohon ke layanan logis yang sama, atau skema
  alat (dan stabilitas cache prompt) akan berbeda untuk setiap pemohon.
- Proses tanpa `requesterSenderId` tepercaya (cron, subagen, Heartbeat, Gateway
  publik) tidak pernah mewujudkan server dengan cakupan pemohon. Tidak ada
  koneksi fallback bersama.
- `resolve` dibatasi hingga 10 detik per server; waktu habis atau pelemparan menghilangkan
  server tersebut dari proses tanpa menyebabkan MCP statis gagal.
- Koneksi yang diresolusikan divalidasi ulang paling sering setiap 5 menit per pemohon:
  rotasi membangun ulang transport dengan kredensial baru, dan hasil `null`
  mencabutnya (runtime yang di-cache dibuang bahkan di tengah sesi). Oleh karena itu, kredensial yang dicabut atau
  dirotasi dapat tetap digunakan hingga 5 menit.
- `headers` yang diresolusikan tidak pernah dicatat atau dipersistenkan; core hanya menyimpan digest
  berkunci sementara dalam memori (HMAC lokal proses) untuk mendeteksi rotasi kredensial, serta
  mendaftarkan nilai kredensial header/URL yang diresolusikan ke registri penyamaran
  pengambilan log/debug.
- Server dengan cakupan pemohon tidak membuat tampilan Aplikasi MCP: tampilan bertahan lebih lama daripada
  proses yang diautentikasi pemohon dan batas tampilan Gateway tidak memiliki identitas
  pemohon, sehingga pratinjau aplikasi tetap gagal secara tertutup untuk server ini. Hasil alat
  tidak terpengaruh.
- Server statis tanpa resolver mempertahankan siklus hidup dengan cakupan sesi yang ada.
- **Aturan pengiriman harness:** server dengan cakupan pemohon tidak pernah dimasukkan ke
  konfigurasi klien MCP native harness (utas Codex `mcp_servers`, CLI `-c mcp_servers=…`, atau
  proyeksi MCP bersama sesi lainnya). Sebagai gantinya, harness mengirimkannya sebagai alat dengan cakupan
  proses:
  - Runner tertanam: runtime MCP sesi + alat bundel (statis + tercakup).
  - Server aplikasi Codex: alat dinamis melalui
    `materializeRequesterScopedMcpToolsForHarnessRun` (hanya yang tercakup; server
    statis tetap menggunakan klien MCP native Codex).
- **Spesifikasi** alat tercakup stabil selama sesi setelah resolusi pertama yang berhasil dalam
  sesi tersebut, sehingga harness utas bersama (Codex) tidak merotasi utas ketika
  pengirim berubah. Sebelum pemohon mana pun diresolusikan, tidak ada spesifikasi tercakup yang diumumkan.
- Pemohon yang tidak diautentikasi pada harness utas bersama tetap melihat alat tercakup
  yang diumumkan; memanggil salah satunya mengembalikan kesalahan alat tidak-terhubung yang bersih untuk
  pemohon tersebut. OpenClaw tidak pernah beralih ke kredensial pemohon lain.

Pembangun pelengkap prompt memori menerima konteks `agentId`,
`agentSessionKey`, dan `sandboxed` opsional. Panggilan pelengkap korpus memori `search`
dan `get` menerima konteks `agentId` dan `sandboxed` opsional. Plugin dengan
penyimpanan milik agen harus meresolusikan penyimpanan tersebut untuk setiap panggilan, alih-alih
menangkap satu jalur global saat pendaftaran. Jika ID agen diperlukan tetapi
tidak tersedia dalam operasi multiagen, gagalkan secara tertutup alih-alih memilih
agen sembarang.

Gunakan `registerMemoryPromptPreparation(...)` ketika teks prompt bergantung pada status
Plugin asinkron. Callback dijalankan sekali sebelum setiap prompt agen lengkap dan menerima
konteks alat, agen, sesi, dan sandbox yang sama seperti pembangun prompt memori
sinkron. Validasi instans pemilik penyimpanan saat ini sebelum memuat status
yang dipersistenkan, lalu kembalikan hanya baris untuk proses tersebut. OpenClaw membekukan baris-baris tersebut dan
menyerahkan hasil yang tidak dapat diubah kepada perakitan prompt sinkron. Pertahankan persistensi,
penggantian atomik, dan penghapusan saat pemilik dihapus di dalam Plugin pemilik; jangan
melakukan polling atau membaca berkas dari pembangun prompt.

Penangan interaktif Telegram dapat mengembalikan `{ submitText }` untuk merutekan teks melalui
jalur agen masuk normal Telegram setelah penangan berhasil. OpenClaw mempertahankan
tombol callback ketika kebijakan masuk melewati teks atau pemrosesan gagal, sehingga
pengguna dapat mencoba lagi setelah kondisi penghalang berubah. Kolom hasil ini
khusus untuk Telegram; saluran lain mempertahankan kontrak hasil interaktifnya masing-masing.

### Hook host untuk Plugin alur kerja

Hook host adalah seam SDK bagi Plugin yang perlu berpartisipasi dalam siklus hidup
host, bukan sekadar menambahkan penyedia, saluran, atau alat. Hook ini merupakan
kontrak generik; Plan Mode dapat menggunakannya, begitu pula alur kerja persetujuan,
gerbang kebijakan ruang kerja, pemantau latar belakang, wizard penyiapan, dan Plugin pendamping
UI.

| Metode                                                                               | Kontrak yang dimilikinya                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Status sesi kompatibel JSON milik Plugin yang diproyeksikan melalui sesi Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Konteks persis-sekali yang tahan lama dan disuntikkan ke giliran agen berikutnya untuk satu sesi                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Kebijakan alat tepercaya pra-Plugin yang dibatasi manifes dan dapat memblokir atau menulis ulang parameter alat                                                                        |
| `api.registerToolMetadata(...)`                                                      | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                                                     |
| `api.registerCommand(...)`                                                           | Perintah Plugin bercakupan; hasil perintah dapat menetapkan `continueAgent: true` atau `suppressReply: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskriptor kontribusi UI Kontrol untuk permukaan sesi, alat, eksekusi, pengaturan, atau tab                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callback pembersihan untuk sumber daya runtime milik Plugin pada jalur reset/hapus/muat ulang                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Langganan peristiwa yang disanitasi untuk status dan pemantau alur kerja                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Status sementara Plugin per eksekusi yang dihapus pada siklus hidup penghentian eksekusi                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadata pembersihan untuk pekerjaan penjadwal milik Plugin; tidak menjadwalkan pekerjaan atau membuat catatan tugas                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Pengiriman lampiran file yang dimediasi host dan hanya untuk bawaan ke rute sesi keluar-langsung yang aktif                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Giliran sesi terjadwal berbasis Cron yang hanya untuk bawaan beserta pembersihan berbasis tag                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Tindakan sesi bertipe yang dapat dikirim klien melalui Gateway                                                                                             |

Deskriptor `surface: "tab"` menambahkan tab bilah sisi ke UI Kontrol. Deskriptor
tab Plugin aktif diumumkan kepada klien dasbor dalam hello gateway
(`controlUiTabs`), sehingga tab hanya muncul saat Plugin diaktifkan.
Plugin bawaan dapat menyertakan tampilan dasbor kelas satu untuk tabnya; Plugin
lain dapat menetapkan `path` ke rute HTTP Plugin (lihat
`api.registerHttpRoute(...)`) yang dirender dasbor dalam bingkai terisolasi.
`icon` adalah petunjuk nama ikon dasbor, `group` memilih bagian bilah sisi
(`control` atau `agent`), `order` mengurutkan tab Plugin, dan `requiredScopes`
menyembunyikan tab dari koneksi yang tidak memiliki cakupan operator tersebut:

Untuk tab eksternal yang dilindungi gateway, daftarkan deskriptor `path` di bawah
rute HTTP `auth: "gateway"` dari Plugin yang sama. Setelah bootstrap terautentikasi, browser memperoleh
izin HttpOnly berumur pendek yang dibatasi untuk Plugin dan akar rute tersebut agar
bingkai terisolasi dapat dimuat tanpa menyalin token bearer Gateway ke URL
atau JavaScript-nya. Induk terautentikasi memperbarui izin selama tab eksternal
aktif dan sebelum memasangnya setelah navigasi atau browser dilanjutkan. Induk juga
memeriksa izin dari sandbox opak yang sama sebelum pemasangan, sehingga mode
privasi browser yang memblokir cookie akan gagal tertutup dengan panel yang tidak tersedia.
Izin bingkai hanya menerima `GET` dan `HEAD` serta selalu membawa
`operator.read`; `requiredScopes` mengontrol visibilitas tab tetapi tidak pernah memperluas
izin cookie. Mutasi tetap berada pada permukaan induk atau bearer yang secara
eksplisit diautentikasi Gateway. Tab eksternal memerlukan HTTPS/Tailscale Serve atau
origin loopback yang dipercaya browser; HTTP biasa pada host LAN menampilkan
kesalahan konteks aman alih-alih memasang panel yang tidak dapat melakukan autentikasi.
Pemblokiran penuh cookie pihak ketiga juga membuat tab yang dilindungi gateway tidak tersedia.
Seperti semua permukaan Plugin native, bingkai tetap berada di dalam batas
kepercayaan Plugin yang terpasang; OpenClaw tidak memperlakukan Plugin terpasang sebagai prinsipal
keamanan browser yang saling terisolasi.
Izin cookie menggunakan batas nama host browser, bukan batas portnya. Jangan
menghosting bersama layanan yang tidak saling dipercaya pada nama host Gateway, bahkan pada
port lain.
Tab yang didukung autentikasi yang dikelola Plugin mempertahankan perilaku iframe langsung dan tidak
meminta atau memerlukan izin Gateway ini.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Buku Log",
  description: "Hari Anda sebagai linimasa, dibuat dari cuplikan layar.",
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
tidak digunakan lagi untuk Plugin yang ada. Jangan tambahkan kode Plugin baru yang memanggil
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, atau
`api.unscheduleSessionTurnsByTag` secara langsung.

`scheduleSessionTurn(...)` adalah kemudahan bercakupan sesi di atas penjadwal
Cron Gateway. Cron memiliki pengaturan waktu dan membuat catatan tugas latar belakang saat
giliran berjalan; SDK Plugin hanya membatasi sesi target, penamaan milik
Plugin, dan pembersihan. Gunakan `api.runtime.tasks.managedFlows` di dalam giliran
terjadwal ketika pekerjaan itu sendiri memerlukan status Alur Tugas multilangkah yang tahan lama.

Kontrak sengaja memisahkan kewenangan:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah, metadata
  alat, injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan
  dipercaya host. Kebijakan bawaan berjalan terlebih dahulu; kebijakan Plugin terpasang memerlukan
  pengaktifan eksplisit beserta id lokalnya dalam
  `contracts.trustedToolPolicies`, lalu berjalan menurut urutan pemuatan Plugin. Id kebijakan
  dibatasi untuk Plugin yang mendaftarkannya.
- Kepemilikan perintah yang dicadangkan hanya untuk bawaan. Plugin eksternal harus menggunakan
  nama perintah atau aliasnya sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang memutasi prompt termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  dan `enqueueNextTurnInjection`.

Contoh konsumen non-Plan:

| Arketipe Plugin             | Hook yang digunakan                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alur kerja persetujuan            | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, deskriptor UI                                                            |
| Gerbang kebijakan anggaran/ruang kerja | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                                 |
| Pemantau siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan penjadwal sesi, kontribusi prompt Heartbeat, deskriptor UI |
| Wizard penyiapan atau orientasi   | Ekstensi sesi, perintah bercakupan, deskriptor UI Kontrol                                                                              |

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
  mengumpankan hasil tersebut kembali ke model. Ini adalah seam netral-runtime tepercaya
  untuk pereduksi output asinkron seperti tokenjuice.

Plugin harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap runtime
target, misalnya `["openclaw", "codex"]`. Plugin terpasang tanpa kontrak
tersebut, atau tanpa pengaktifan eksplisit, tidak dapat mendaftarkan middleware ini; pertahankan
hook Plugin OpenClaw normal untuk pekerjaan yang tidak memerlukan pengaturan waktu hasil alat
pra-model. Jalur pendaftaran factory ekstensi lama yang hanya untuk
runner tertanam telah dihapus.
</Accordion>

### Pendaftaran penemuan Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengumumkan
Gateway aktif melalui transpor penemuan lokal seperti mDNS/Bonjour. OpenClaw memanggil
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
memiliki kewenangan atas kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata perintah:

- `commands`: nama perintah eksplisit yang dimiliki pendaftar
- `descriptors`: deskriptor perintah waktu penguraian yang digunakan untuk bantuan CLI,
  perutean, dan pendaftaran CLI Plugin secara malas
- `parentPath`: jalur perintah induk opsional untuk grup perintah bertingkat, seperti
  `["nodes"]`

Untuk fitur Node berpasangan, utamakan
`api.registerNodeCliFeature(registrar, opts?)`. Ini adalah pembungkus kecil di sekitar
`api.registerCli(..., { parentPath: ["nodes"] })` dan menjadikan perintah seperti
`openclaw nodes canvas` sebagai fitur Node yang secara eksplisit dimiliki Plugin.

Jika Anda ingin perintah Plugin tetap dimuat secara malas dalam jalur CLI akar normal,
sediakan `descriptors` yang mencakup setiap akar perintah tingkat atas yang diekspos oleh
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

Perintah bertingkat menerima perintah induk yang telah diresolusikan sebagai `program`:

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
placeholder berbasis deskriptor untuk pemuatan lazy saat penguraian.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan sebuah plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `claude-cli` atau `my-cli`.

- Backend `id` menjadi prefiks penyedia dalam referensi model seperti `my-cli/gpt-5`.
- Backend `config` menggunakan bentuk yang sama dengan `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap diutamakan. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalisasi bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv dalam cakupan permintaan yang merupakan bagian dari
  dialek CLI, seperti memetakan tingkat pemikiran OpenClaw ke flag upaya
  native. Hook menerima `ctx.executionMode`; gunakan `"side-question"` untuk menambahkan
  flag isolasi native backend bagi panggilan `/btw` sementara. Jika flag tersebut
  secara andal menonaktifkan alat native untuk CLI yang selain itu selalu aktif, deklarasikan juga
  `sideQuestionToolMode: "disabled"`.
- Gunakan `prepareExecution` untuk lingkungan peluncuran yang dimiliki backend atau jembatan
  autentikasi/konfigurasi sementara. `ctx.contextTokenBudget` miliknya adalah batas token efektif
  yang dipilih untuk proses tersebut, sehingga backend dengan kompaksi native dapat menyelaraskan
  ambangnya sendiri tanpa cabang core khusus penyedia.
- Backend yang dapat menonaktifkan semua alat native untuk proses tertentu dapat mendeklarasikan
  `nativeToolMode: "selectable"`. Panggilan terbatas meneruskan tuple
  `ctx.toolAvailability.native` kosong beserta daftar izin MCP terisolasi-host yang persis;
  `resolveExecutionArgs` harus menerapkan keduanya pada argv fresh atau resume akhir.
  OpenClaw menerapkan kegagalan tertutup jika backend tidak dapat melakukannya.

Untuk panduan penulisan menyeluruh, lihat
[plugin backend CLI](/id/plugins/cli-backend-plugins).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu yang aktif pada satu waktu). Callback siklus hidup menerima `runtimeSettings` saat host dapat menyediakan diagnostik model/penyedia/mode; mesin ketat yang lebih lama dicoba kembali tanpa kunci tersebut. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                                                          |

### Adapter embedding memori yang tidak digunakan lagi

| Metode                                         | Yang didaftarkan                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk plugin aktif |

- `registerMemoryCapability` adalah API plugin memori eksklusif.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  untuk ekspor yang dikelola host. Plugin pendamping yang mengenumerasi artefak
  yang dideklarasikan tersebut masih menggunakan `listActiveMemoryPublicArtifacts(...)` dari fasad
  `openclaw/plugin-sdk/memory-host-core` yang dipertahankan hingga tersedia API konsumen publik
  yang terfokus; plugin tersebut tidak boleh mengakses tata letak privat plugin lain.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi `provider/model`
  yang persis, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback
  aktif.
- `registerMemoryEmbeddingProvider` tidak digunakan lagi. Penyedia embedding baru
  harus menggunakan `api.registerEmbeddingProvider(...)` dan
  `contracts.embeddingProviders`.
- Penyedia khusus memori yang ada tetap berfungsi selama periode
  migrasi, tetapi pemeriksaan plugin melaporkan hal ini sebagai utang kompatibilitas untuk
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
instalasi operator. Gunakan `security.installPolicy` ketika keputusan izinkan/blokir harus
mencakup jalur instalasi atau pembaruan yang didukung CLI dan Gateway.

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai penggantian.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai penggantian.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengambil alih dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai penggantian.
- `message_received`: gunakan bidang `threadId` bertipe saat Anda memerlukan perutean thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus saluran.
- `message_sending`: gunakan bidang perutean bertipe `replyToId` / `threadId` sebelum beralih ke fallback `metadata` khusus saluran.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup yang dimiliki Gateway alih-alih bergantung pada hook internal `gateway:startup`. Cron mungkin masih sedang dimuat pada titik ini.
- `cron_reconciled`: bangun ulang proyeksi cron eksternal lengkap setelah startup atau pemuatan ulang penjadwal. Ini mencakup `reason` dan status `enabled` efektif, termasuk `enabled: false`, sedangkan `ctx.getCron?.()` mengembalikan penjadwal hasil rekonsiliasi yang persis. Teruskan `ctx.abortSignal` ke pekerjaan proyeksi persisten; proses tersebut dibatalkan saat snapshot penjadwal itu digantikan atau Gateway ditutup.
- `cron_changed`: amati perubahan siklus hidup cron yang dimiliki gateway. Peristiwa `scheduled` dan `removed` adalah petunjuk rekonsiliasi pasca-commit, bukan log delta berurutan. `event.nextRunAtMs` milik peristiwa terjadwal tidak ada saat pekerjaan tidak memiliki waktu bangun berikutnya; peristiwa penghapusan tetap membawa snapshot pekerjaan yang dihapus.

Penjadwal bangun eksternal harus melakukan debounce atau penggabungan peristiwa `cron_changed`,
kemudian membaca ulang tampilan persisten lengkap dari penjadwal yang terakhir ditangkap oleh
`cron_reconciled`. Jangan mengadopsi penjadwal dari konteks `cron_changed`: petunjuk
terpisah dari penjadwal lama dapat tumpang tindih dengan pemuatan ulang yang lebih baru.

Gunakan `cron_reconciled` sebagai pemicu snapshot lengkap untuk status persisten yang dimuat saat
startup Gateway atau penggantian penjadwal. Pemicu ini tidak diputar ulang untuk hot reload
khusus plugin. Handler pengamatan berjalan secara paralel, dan dispatch fire-and-forget
dapat tumpang tindih, sehingga konsumen tidak boleh bergantung pada urutan penyelesaian peristiwa.
Pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

Untuk adapter single-flight dengan penggantian persisten, percobaan ulang/backoff, dan penghentian
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
| `api.runtime`            | `PluginRuntime`           | [Pembantu runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger dengan cakupan (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/penyiapan ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Resolusikan jalur relatif terhadap root plugin                                                        |

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
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan berkas entri publik serupa) mengutamakan
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika snapshot
runtime belum tersedia, permukaan tersebut beralih menggunakan berkas konfigurasi
yang telah diresolusi pada disk. Facade plugin bawaan yang dikemas harus dimuat melalui
pemuat facade plugin OpenClaw; impor langsung dari `dist/extensions/...` melewati
pemeriksaan manifes dan sidecar runtime yang digunakan instalasi terkemas untuk kode
milik plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal plugin yang terbatas ketika
helper sengaja dibuat khusus untuk penyedia dan belum semestinya berada dalam
subjalur SDK generik. Contoh bawaan:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper
  header beta Claude dan aliran `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor pembangun penyedia,
  helper model default, dan pembangun penyedia waktu nyata.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor pembangun penyedia
  beserta helper orientasi awal/konfigurasi.

<Warning>
  Kode produksi ekstensi juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar digunakan bersama, promosikan ke subjalur SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan lain
  yang berorientasi pada kapabilitas, alih-alih menghubungkan dua plugin secara erat.
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
    Bermigrasi dari permukaan yang sudah tidak digunakan.
  </Card>
  <Card title="Internal plugin" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kapabilitas.
  </Card>
</CardGroup>
