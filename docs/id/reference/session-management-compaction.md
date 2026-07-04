---
read_when:
    - Anda perlu men-debug ID sesi, transkrip JSONL, atau bidang sessions.json
    - Anda mengubah perilaku auto-compaction atau menambahkan pemeliharaan "pre-compaction"
    - Anda ingin mengimplementasikan pengosongan memori atau giliran sistem senyap
summary: 'Pendalaman: penyimpanan sesi + transkrip, siklus hidup, dan internal Compaction (otomatis)'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-07-04T20:44:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw mengelola sesi secara end-to-end di seluruh area ini:

- **Perutean sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Higiene transkrip** (perbaikan khusus penyedia sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (Compaction manual dan otomatis) dan tempat mengaitkan pekerjaan pra-Compaction
- **Pemeliharaan senyap** (penulisan memori yang tidak boleh menghasilkan output yang terlihat oleh pengguna)

Jika Anda ingin gambaran umum tingkat lebih tinggi terlebih dahulu, mulai dengan:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Gambaran umum memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Higiene transkrip](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki status sesi.

- UI (aplikasi macOS, Control UI web, TUI) harus mengkueri Gateway untuk daftar sesi dan jumlah token.
- Dalam mode jarak jauh, file sesi berada di host jarak jauh; "memeriksa file Mac lokal Anda" tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempersistenkan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta kunci/nilai: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan aktual + panggilan alat + ringkasan Compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya
   - Checkpoint Compaction adalah metadata di atas transkrip penerus yang telah dipadatkan. Compaction baru tidak menulis salinan `.checkpoint.*.jsonl` kedua.

Pembaca riwayat Gateway harus menghindari materialisasi seluruh transkrip kecuali
surface secara eksplisit membutuhkan akses historis arbitrer. Riwayat halaman pertama,
riwayat chat tertanam, pemulihan restart, dan pemeriksaan token/penggunaan memakai pembacaan ekor
terbatas. Pemindaian transkrip penuh melewati indeks transkrip asinkron, yang
di-cache berdasarkan path file plus `mtimeMs`/`size` dan dibagikan di antara pembaca konkuren.

---

## Lokasi di disk

Per agen, di host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw menyelesaikan ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json`, artefak transkrip, dan sidecar trajektori:

- `mode`: `enforce` (default) atau `warn`
- `pruneAfter`: batas usia entri basi (default `30d`)
- `maxEntries`: membatasi entri di `sessions.json` (default `500`)
- Retensi probe model-run Gateway berumur pendek tetap pada `24h`, tetapi dibatasi tekanan: ia hanya menghapus baris probe ketat yang basi saat tekanan pemeliharaan/batas entri sesi tercapai. Ini hanya berlaku untuk kunci probe eksplisit ketat yang cocok dengan `agent:*:explicit:model-run-<uuid>` dan berjalan sebelum pembersihan/pembatasan entri basi global saat berjalan.
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama dengan `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Penulisan Gateway normal mengalir melalui penulis sesi per penyimpanan yang menserialisasi mutasi dalam proses tanpa mengambil kunci file runtime. Helper patch jalur panas meminjam cache mutable yang telah divalidasi selama memegang slot penulis tersebut, sehingga file `sessions.json` besar tidak dikloning atau dibaca ulang untuk setiap pembaruan metadata. Kode runtime sebaiknya menggunakan `updateSessionStore(...)` atau `updateSessionStoreEntry(...)`; penyimpanan seluruh store secara langsung adalah alat kompatibilitas dan pemeliharaan offline. Saat Gateway dapat dijangkau, `openclaw sessions cleanup` dan `openclaw agents delete` non-dry-run mendelegasikan mutasi store ke Gateway sehingga pembersihan bergabung dengan antrean penulis yang sama; `--store <path>` adalah jalur perbaikan offline eksplisit untuk pemeliharaan file langsung. Pembersihan `maxEntries` tetap dibatch untuk batas berukuran produksi, sehingga store dapat sebentar melebihi batas yang dikonfigurasi sebelum pembersihan high-water berikutnya menulisnya kembali turun. Pembacaan store sesi tidak memangkas atau membatasi entri selama startup Gateway; gunakan penulisan atau `openclaw sessions cleanup --enforce` untuk pembersihan. `openclaw sessions cleanup --enforce` tetap menerapkan batas yang dikonfigurasi segera dan memangkas artefak transkrip, checkpoint, dan trajektori lama yang tidak direferensikan meskipun tidak ada anggaran disk yang dikonfigurasi.

Pemeliharaan mempertahankan pointer percakapan eksternal yang tahan lama seperti sesi grup
dan sesi chat berbasis thread, tetapi entri runtime sintetis untuk cron, hook,
Heartbeat, ACP, dan sub-agen tetap dapat dihapus saat melebihi
usia, jumlah, atau anggaran disk yang dikonfigurasi. Sesi probe model-run Gateway memakai
retensi model-run `24h` terpisah hanya saat kuncinya persis cocok dengan
`agent:*:explicit:model-run-<uuid>`; sesi eksplisit lain bukan bagian dari
retensi tersebut. Pembersihan model-run hanya diterapkan di bawah tekanan batas
entri sesi. Run cron terisolasi mempertahankan kontrol `cron.sessionRetention` sendiri,
independen dari retensi probe model-run.

OpenClaw tidak lagi membuat backup rotasi `sessions.json.bak.*` otomatis selama penulisan Gateway. Kunci lama `session.maintenance.rotateBytes` diabaikan dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Mutasi transkrip memakai kunci tulis sesi pada file transkrip. Akuisisi kunci menunggu hingga
`session.writeLock.acquireTimeoutMs` sebelum memunculkan error sesi sibuk; defaultnya adalah `60000`
md. Naikkan ini hanya ketika pekerjaan persiapan, pembersihan, Compaction, atau mirror transkrip yang sah berkompetisi
lebih lama pada mesin lambat. `session.writeLock.staleMs` mengontrol kapan kunci yang ada dapat
direklamasi sebagai basi; defaultnya adalah `1800000` md. `session.writeLock.maxHoldMs` mengontrol
ambang rilis watchdog dalam proses; defaultnya adalah `300000` md. Override env darurat adalah
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`, dan
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak arsip tertua, transkrip yatim, atau trajektori yatim terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua beserta file transkrip/trajektorinya.
3. Teruskan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi pengeluaran tetapi tidak memutasi store/file.

Jalankan pemeliharaan sesuai permintaan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log run

Run Cron terisolasi juga membuat entri sesi/transkrip, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run Cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.keepLines` memangkas baris riwayat run SQLite yang dipertahankan per job Cron (default: `2000`). `cron.runLog.maxBytes` tetap diterima untuk log run lama berbasis file.

Saat Cron memaksa pembuatan sesi run terisolasi baru, ia membersihkan entri sesi
`cron:<jobId>` sebelumnya sebelum menulis baris baru. Ia membawa preferensi aman
seperti pengaturan thinking/fast/verbose, label, dan override model/auth
yang dipilih pengguna secara eksplisit. Ia membuang konteks percakapan ambient seperti
perutean channel/grup, kebijakan kirim atau antrean, elevasi, asal, dan binding runtime
ACP sehingga run terisolasi baru tidak dapat mewarisi pengiriman atau otoritas
runtime yang basi dari run lama.

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang sedang Anda pakai (perutean + isolasi).

Pola umum:

- Chat utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali ditimpa)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default 4:00 AM waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau `session.idleMinutes` lama) membuat `sessionId` baru saat pesan datang setelah jendela idle. Saat harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu menang.
- **Resume rekoneksi Control UI** dapat mempertahankan sesi yang saat ini terlihat untuk satu pengiriman rekoneksi ketika Gateway menerima `sessionId` yang cocok dari klien UI operator. Pengiriman basi biasa tetap membuat `sessionId` baru.
- **Event sistem** (Heartbeat, wakeup Cron, notifikasi exec, pembukuan gateway) dapat memutasi baris sesi tetapi tidak memperpanjang kesegaran reset harian/idle. Rollover reset membuang pemberitahuan event sistem yang mengantre untuk sesi sebelumnya sebelum prompt baru dibuat.
- **Kebijakan fork induk** memakai cabang aktif OpenClaw saat membuat thread atau fork subagen. Jika cabang itu terlalu besar, OpenClaw memulai anak dengan konteks terisolasi alih-alih gagal atau mewarisi riwayat yang tidak dapat digunakan. Kebijakan sizing otomatis; konfigurasi lama `session.parentForkMaxTokens` dihapus oleh `openclaw doctor --fix`.

Detail implementasi: keputusan terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai store adalah `SessionEntry` di `src/config/sessions.ts`.

Kolom kunci (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` diatur)
- `sessionStartedAt`: stempel waktu mulai untuk `sessionId` saat ini; kesegaran reset harian
  menggunakan ini. Baris lama dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: stempel waktu interaksi pengguna/channel nyata terakhir; kesegaran
  reset idle menggunakan ini sehingga peristiwa heartbeat, cron, dan exec tidak membuat sesi
  tetap hidup. Baris lama tanpa bidang ini kembali memakai waktu mulai sesi yang dipulihkan
  untuk kesegaran idle.
- `updatedAt`: stempel waktu mutasi baris penyimpanan terakhir, digunakan untuk pencantuman, pemangkasan, dan
  pembukuan. Ini bukan otoritas untuk kesegaran reset harian/idle.
- `archivedAt`: stempel waktu arsip opsional. Sesi yang diarsipkan tetap berada di penyimpanan
  dengan transkripnya utuh dan dikecualikan dari daftar aktif normal.
- `pinnedAt`: stempel waktu pin opsional. Sesi aktif yang dipin diurutkan sebelum
  sesi yang tidak dipin; mengarsipkan sesi akan menghapus pinnya.
- Interop thread Codex: kedua bidang mengikuti bentuk pengelolaan thread Codex —
  boolean `archived`/`pinned` di wire selalu diturunkan dari
  stempel waktu dan dicap di sisi server, sesuai semantik Codex `threads.archived_at`
  dan serialisasi camelCase. Stempel waktu OpenClaw adalah milidetik epoch
  sementara Codex menggunakan detik epoch, sehingga bridge mengonversi di seam plugin codex.
  Codex belum memiliki API pin (`thread/archive`/`thread/unarchive`
  saja); status pin tetap berada di sisi OpenClaw sampai API tersebut ada, dan pada saat itu
  bentuk yang cocok memungkinkan sesi terikat melakukan round-trip status pin secara mekanis.
- `sessionFile`: override jalur transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan pengiriman)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (upaya terbaik / bergantung provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering auto-compaction selesai untuk kunci sesi ini
- `memoryFlushAt`: stempel waktu untuk flush memori pra-compaction terakhir
- `memoryFlushCompactionCount`: jumlah compaction saat flush terakhir berjalan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritasnya: Gateway dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` milik `openclaw/plugin-sdk/agent-sessions`.

File ini adalah JSONL:

- Baris pertama: header sesi (`type: "session"`, menyertakan `id`, `cwd`, `timestamp`, `parentSession` opsional)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Jenis entri penting:

- `message`: pesan pengguna/asisten/toolResult
- `custom_message`: pesan yang disuntikkan ekstensi yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: status ekstensi yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan compaction yang dipersistenkan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistenkan saat menavigasi cabang pohon

OpenClaw sengaja **tidak** "memperbaiki" transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Ada dua konsep berbeda yang penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik berjalan yang ditulis ke `sessions.json` (digunakan untuk /status dan dashboard)

Jika Anda menyesuaikan batas:

- Jendela konteks berasal dari katalog model (dan dapat di-override melalui konfigurasi).
- `contextTokens` dalam penyimpanan adalah nilai estimasi/pelaporan runtime; jangan memperlakukannya sebagai jaminan ketat.

Untuk informasi lebih lanjut, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction merangkum percakapan lama ke dalam entri `compaction` yang dipersistenkan di transkrip dan menjaga pesan terbaru tetap utuh.

Setelah compaction, giliran berikutnya melihat:

- Ringkasan compaction
- Pesan setelah `firstKeptEntryId`

Penyuntikan ulang bagian AGENTS.md setelah compaction bersifat opt-in melalui
`agents.defaults.compaction.postCompactionSections`; saat tidak diatur atau `[]`,
OpenClaw tidak menambahkan kutipan AGENTS.md di atas ringkasan compaction.

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk compaction dan pemasangan tool

Saat OpenClaw membagi transkrip panjang menjadi chunk compaction, OpenClaw menjaga
panggilan tool asisten tetap dipasangkan dengan entri `toolResult` yang sesuai.

- Jika pembagian porsi token jatuh di antara panggilan tool dan hasilnya, OpenClaw
  menggeser batas ke pesan panggilan tool asisten alih-alih memisahkan
  pasangan tersebut.
- Jika blok tool-result di akhir sebaliknya akan mendorong chunk melewati target,
  OpenClaw mempertahankan blok tool tertunda itu dan menjaga ekor yang belum diringkas
  tetap utuh.
- Blok panggilan tool yang dibatalkan/error tidak membuat pembagian tertunda tetap terbuka.

---

## Kapan auto-compaction terjadi (runtime OpenClaw)

Di agen OpenClaw tertanam, auto-compaction terpicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan error overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa berbentuk provider) → compact → retry.
   Saat provider melaporkan jumlah token yang dicoba, OpenClaw meneruskan
   jumlah teramati tersebut ke compaction pemulihan overflow. Jika provider mengonfirmasi
   overflow tetapi tidak mengekspos jumlah yang dapat di-parse, OpenClaw meneruskan jumlah sintetis yang
   sedikit melebihi anggaran ke mesin compaction dan diagnostik.
   Jika pemulihan overflow masih gagal, OpenClaw menampilkan panduan eksplisit kepada
   pengguna dan mempertahankan pemetaan sesi saat ini alih-alih diam-diam merotasi
   kunci sesi ke id sesi baru. Langkah berikutnya dikendalikan operator:
   coba lagi pesan, jalankan `/compact`, atau jalankan `/new` saat sesi baru
   lebih disukai.
2. **Pemeliharaan ambang**: setelah giliran berhasil, saat:

`contextTokens > contextWindow - reserveTokens`

Dengan:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan yang disisihkan untuk prompt + output model berikutnya

Ini adalah semantik runtime OpenClaw.

OpenClaw juga dapat memicu compaction lokal preflight sebelum membuka run berikutnya
saat `agents.defaults.compaction.maxActiveTranscriptBytes` diatur dan file
transkrip aktif mencapai ukuran tersebut. Ini adalah guard ukuran file untuk biaya
pembukaan ulang lokal, bukan pengarsipan mentah: OpenClaw tetap menjalankan compaction semantik normal,
dan ini memerlukan `truncateAfterCompaction` agar ringkasan yang dipadatkan dapat menjadi
transkrip penerus baru.

Untuk run OpenClaw tertanam, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
menambahkan guard tool-loop opt-in. Setelah hasil tool ditambahkan dan sebelum
panggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika anggaran
preflight yang sama dengan yang digunakan di awal giliran. Jika konteks tidak lagi muat, guard
tidak melakukan compact di dalam hook `transformContext` runtime OpenClaw. Guard menaikkan sinyal
precheck tengah giliran terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan
loop run luar menggunakan jalur pemulihan yang sudah ada: memotong hasil tool yang terlalu besar
saat itu cukup, atau memicu mode compaction yang dikonfigurasi dan mencoba lagi. Opsi
ini dinonaktifkan secara default dan bekerja dengan mode compaction `default` maupun `safeguard`,
termasuk compaction safeguard yang didukung provider.
Ini independen dari `maxActiveTranscriptBytes`: guard ukuran byte berjalan
sebelum giliran dibuka, sementara precheck tengah giliran berjalan kemudian di tool loop OpenClaw tertanam
setelah hasil tool baru ditambahkan.

---

## Pengaturan compaction (`reserveTokens`, `keepRecentTokens`)

Pengaturan compaction runtime OpenClaw berada di pengaturan agen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw juga menerapkan batas bawah keselamatan untuk run tertanam:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas bawah default adalah `20000` token.
- Atur `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens`
  eksplisit dan mempertahankan titik potong ekor terbaru runtime OpenClaw. Tanpa anggaran keep eksplisit,
  compaction manual tetap menjadi checkpoint keras dan konteks yang dibangun ulang dimulai dari
  ringkasan baru.
- Atur `agents.defaults.compaction.midTurnPrecheck.enabled: true` untuk menjalankan
  precheck tool-loop opsional setelah hasil tool baru dan sebelum panggilan model
  berikutnya. Ini hanya pemicu; pembuatan ringkasan tetap menggunakan jalur
  compaction yang dikonfigurasi. Ini independen dari `maxActiveTranscriptBytes`, yang merupakan
  guard ukuran byte transkrip aktif di awal giliran.
- Atur `agents.defaults.compaction.maxActiveTranscriptBytes` ke nilai byte atau
  string seperti `"20mb"` untuk menjalankan compaction lokal sebelum giliran saat transkrip
  aktif menjadi besar. Guard ini aktif hanya saat
  `truncateAfterCompaction` juga diaktifkan. Biarkan tidak diatur atau atur `0` untuk
  menonaktifkan.
- Saat `agents.defaults.compaction.truncateAfterCompaction` diaktifkan,
  OpenClaw merotasi transkrip aktif ke JSONL penerus yang dipadatkan setelah
  compaction. Tindakan checkpoint branch/restore menggunakan penerus yang dipadatkan itu;
  file checkpoint pra-compaction lama tetap dapat dibaca selama masih direferensikan.

Alasan: sisakan cukup ruang untuk "housekeeping" multi-giliran (seperti penulisan memori) sebelum compaction menjadi tidak terhindarkan.

Implementasi: `applyAgentCompactionSettingsFromConfig()` di `src/agents/agent-settings.ts`
(dipanggil dari jalur giliran embedded-runner dan penyiapan compaction).

---

## Provider compaction yang dapat dipasang

Plugin dapat mendaftarkan provider compaction melalui `registerCompactionProvider()` pada API plugin. Saat `agents.defaults.compaction.provider` diatur ke id provider terdaftar, ekstensi safeguard mendelegasikan peringkasan ke provider tersebut alih-alih pipeline bawaan `summarizeInStages`.

- `provider`: id plugin provider compaction terdaftar. Biarkan tidak diatur untuk peringkasan LLM default.
- Mengatur `provider` memaksa `mode: "safeguard"`.
- Provider menerima instruksi compaction dan kebijakan pelestarian pengenal yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan konteks sufiks giliran terbaru dan giliran terpisah setelah output provider.
- Peringkasan safeguard bawaan menyuling ulang ringkasan sebelumnya dengan pesan baru
  alih-alih mempertahankan seluruh ringkasan sebelumnya secara verbatim.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; atur
  `qualityGuard.enabled: false` untuk melewati perilaku coba lagi saat output salah bentuk.
- Jika provider gagal atau mengembalikan hasil kosong, OpenClaw otomatis kembali ke peringkasan LLM bawaan.
- Sinyal abort/timeout dilempar ulang (tidak ditelan) untuk menghormati pembatalan pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat pengguna

Anda dapat mengamati compaction dan status sesi melalui:

- `/status` (di sesi chat apa pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Log Gateway (`pnpm gateway:watch` atau `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah compaction

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung giliran "senyap" untuk tugas latar belakang saat pengguna tidak seharusnya melihat output antara.

Konvensi:

- Asisten memulai outputnya dengan token senyap persis `NO_REPLY` /
  `no_reply` untuk menunjukkan "jangan kirim balasan kepada pengguna".
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar-kecil, sehingga `NO_REPLY` dan
  `no_reply` keduanya dihitung ketika seluruh payload hanya berupa token senyap.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang sebenarnya; ini bukan pintasan untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** ketika
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan output
parsial di tengah giliran.

---

## "Memory flush" pra-Compaction (diimplementasikan)

Tujuan: sebelum Compaction otomatis terjadi, jalankan giliran agentik senyap yang menulis state
tahan lama ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) sehingga Compaction tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang**:

1. Pantau penggunaan konteks sesi.
2. Ketika melewati "ambang lunak" (di bawah ambang Compaction runtime OpenClaw), jalankan direktif senyap
   "tulis memori sekarang" ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` sehingga pengguna tidak melihat
   apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `model` (override provider/model persis opsional untuk giliran flush, misalnya `ollama/qwen3:8b`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan pengguna untuk giliran flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Ketika `model` diatur, giliran flush menggunakan model tersebut tanpa mewarisi rantai fallback
  sesi aktif, sehingga housekeeping khusus lokal tidak diam-diam
  fallback ke model percakapan berbayar.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi OpenClaw tertanam (backend CLI melewatinya).
- Flush dilewati ketika workspace sesi bersifat hanya-baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

OpenClaw juga mengekspos hook `session_before_compact` di API ekstensi, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Kunci sesi salah? Mulai dengan [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Ketidakcocokan store vs transkrip? Konfirmasi host Gateway dan path store dari `openclaw status`.
- Spam Compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` terlalu tinggi untuk jendela model dapat menyebabkan Compaction lebih awal)
  - pembengkakan hasil tool: aktifkan/sesuaikan pemangkasan sesi
- Giliran senyap bocor? Konfirmasi balasan dimulai dengan `NO_REPLY` (token persis yang tidak peka huruf besar-kecil) dan Anda berada pada build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
