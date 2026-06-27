---
read_when:
    - Anda perlu men-debug ID sesi, JSONL transkrip, atau bidang `sessions.json`
    - Anda sedang mengubah perilaku auto-compaction atau menambahkan housekeeping "pre-compaction"
    - Anda ingin menerapkan flush memori atau giliran sistem senyap
summary: 'Pendalaman: penyimpanan sesi + transkrip, siklus hidup, dan internal (auto)Compaction'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-06-27T18:11:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw mengelola sesi secara menyeluruh di area berikut:

- **Perutean sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Kebersihan transkrip** (perbaikan spesifik penyedia sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (Compaction manual dan otomatis) dan tempat memasang pekerjaan pra-Compaction
- **Pemeliharaan senyap** (penulisan memori yang tidak boleh menghasilkan keluaran yang terlihat pengguna)

Jika Anda ingin gambaran umum tingkat lebih tinggi terlebih dahulu, mulai dari:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Gambaran umum memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Kebersihan transkrip](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang mengitari satu **proses Gateway** yang memiliki status sesi.

- UI (aplikasi macOS, UI Kontrol web, TUI) harus menanyakan daftar sesi dan jumlah token ke Gateway.
- Dalam mode jarak jauh, file sesi berada di host jarak jauh; "memeriksa file Mac lokal Anda" tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempertahankan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta kunci/nilai: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan aktual + pemanggilan alat + ringkasan Compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran mendatang
   - Checkpoint Compaction adalah metadata di atas transkrip penerus yang telah dikompaksi. Compaction baru tidak menulis salinan `.checkpoint.*.jsonl` kedua.

Pembaca riwayat Gateway harus menghindari mematerialisasi seluruh transkrip kecuali permukaan tersebut secara eksplisit membutuhkan akses riwayat arbitrer. Riwayat halaman pertama, riwayat chat tertanam, pemulihan restart, dan pemeriksaan token/penggunaan memakai pembacaan ekor terbatas. Pemindaian transkrip penuh melewati indeks transkrip asinkron, yang di-cache berdasarkan jalur file plus `mtimeMs`/`size` dan dibagikan ke pembaca serentak.

---

## Lokasi di disk

Per agen, pada host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw menyelesaikan ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json`, artefak transkrip, dan sidecar trajectory:

- `mode`: `enforce` (default) atau `warn`
- `pruneAfter`: batas usia entri usang (default `30d`)
- `maxEntries`: batas entri di `sessions.json` (default `500`)
- Retensi probe model-run Gateway berumur pendek ditetapkan pada `24h`, tetapi dibatasi oleh tekanan: ia hanya menghapus baris probe ketat yang usang ketika tekanan pemeliharaan/batas entri sesi tercapai. Ini hanya berlaku untuk kunci probe eksplisit ketat yang cocok dengan `agent:*:explicit:model-run-<uuid>` dan berjalan sebelum pembersihan/pembatasan entri usang global saat dijalankan.
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama seperti `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Penulisan Gateway normal mengalir melalui penulis sesi per penyimpanan yang menserialkan mutasi dalam proses tanpa mengambil lock file runtime. Helper patch hot-path meminjam cache mutable yang telah divalidasi selama memegang slot penulis itu, sehingga file `sessions.json` besar tidak dikloning atau dibaca ulang untuk setiap pembaruan metadata. Kode runtime sebaiknya menggunakan `updateSessionStore(...)` atau `updateSessionStoreEntry(...)`; penyimpanan seluruh store secara langsung adalah alat kompatibilitas dan pemeliharaan offline. Ketika Gateway dapat dijangkau, `openclaw sessions cleanup` dan `openclaw agents delete` non-dry-run mendelegasikan mutasi penyimpanan ke Gateway sehingga pembersihan bergabung dengan antrean penulis yang sama; `--store <path>` adalah jalur perbaikan offline eksplisit untuk pemeliharaan file langsung. Pembersihan `maxEntries` tetap dibatch untuk batas berukuran produksi, sehingga sebuah penyimpanan mungkin sebentar melebihi batas yang dikonfigurasi sebelum pembersihan high-water berikutnya menulis ulangnya turun kembali. Pembacaan penyimpanan sesi tidak memangkas atau membatasi entri selama startup Gateway; gunakan penulisan atau `openclaw sessions cleanup --enforce` untuk pembersihan. `openclaw sessions cleanup --enforce` tetap menerapkan batas yang dikonfigurasi secara langsung dan memangkas artefak transkrip, checkpoint, dan trajectory lama yang tidak direferensikan bahkan ketika tidak ada anggaran disk yang dikonfigurasi.

Pemeliharaan mempertahankan penunjuk percakapan eksternal yang tahan lama seperti sesi grup dan sesi chat berlingkup thread, tetapi entri runtime sintetis untuk cron, hook, Heartbeat, ACP, dan sub-agen masih dapat dihapus ketika melebihi usia, jumlah, atau anggaran disk yang dikonfigurasi. Sesi probe model-run Gateway menggunakan retensi model-run `24h` terpisah hanya ketika kuncinya persis cocok dengan `agent:*:explicit:model-run-<uuid>`; sesi eksplisit lain bukan bagian dari retensi itu. Pembersihan model-run diterapkan hanya di bawah tekanan batas entri sesi. Run cron terisolasi mempertahankan kontrol `cron.sessionRetention` sendiri, terpisah dari retensi probe model-run.

OpenClaw tidak lagi membuat cadangan rotasi otomatis `sessions.json.bak.*` selama penulisan Gateway. Kunci legacy `session.maintenance.rotateBytes` diabaikan dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Mutasi transkrip menggunakan lock penulisan sesi pada file transkrip. Akuisisi lock menunggu hingga `session.writeLock.acquireTimeoutMs` sebelum memunculkan galat sesi sibuk; default-nya adalah `60000` ms. Naikkan ini hanya ketika pekerjaan persiapan, pembersihan, Compaction, atau mirror transkrip yang sah bersaing lebih lama pada mesin lambat. `session.writeLock.staleMs` mengontrol kapan lock yang ada dapat diklaim kembali sebagai usang; default-nya adalah `1800000` ms. `session.writeLock.maxHoldMs` mengontrol ambang pelepasan watchdog dalam proses; default-nya adalah `300000` ms. Override env darurat adalah `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`, dan `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak arsip tertua, transkrip yatim, atau trajectory yatim terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua beserta file transkrip/trajectory-nya.
3. Teruskan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi pengeluaran tetapi tidak memutasi penyimpanan/file.

Jalankan pemeliharaan sesuai permintaan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log run

Run cron terisolasi juga membuat entri sesi/transkrip, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.keepLines` memangkas baris riwayat run SQLite yang dipertahankan per pekerjaan cron (default: `2000`). `cron.runLog.maxBytes` tetap diterima untuk log run lama berbasis file.

Ketika cron secara paksa membuat sesi run terisolasi baru, ia membersihkan entri sesi `cron:<jobId>` sebelumnya sebelum menulis baris baru. Ia membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth pilihan pengguna eksplisit. Ia membuang konteks percakapan sekitar seperti perutean channel/grup, kebijakan kirim atau antrean, elevasi, asal, dan binding runtime ACP sehingga run terisolasi baru tidak dapat mewarisi pengiriman atau otoritas runtime usang dari run lama.

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang Anda gunakan (perutean + isolasi).

Pola umum:

- Chat utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Ruang/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali dioverride)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 AM waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau legacy `session.idleMinutes`) membuat `sessionId` baru ketika pesan tiba setelah jendela idle. Ketika harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dahulu menang.
- **Lanjutkan koneksi ulang UI Kontrol** dapat mempertahankan sesi yang saat ini terlihat untuk satu pengiriman koneksi ulang ketika Gateway menerima `sessionId` yang cocok dari klien UI operator. Pengiriman usang biasa tetap membuat `sessionId` baru.
- **Peristiwa sistem** (Heartbeat, wakeup cron, notifikasi exec, pembukuan gateway) dapat memutasi baris sesi tetapi tidak memperpanjang kesegaran reset harian/idle. Rollover reset membuang pemberitahuan peristiwa sistem yang diantrekan untuk sesi sebelumnya sebelum prompt baru dibangun.
- **Kebijakan fork induk** menggunakan cabang aktif OpenClaw saat membuat thread atau fork subagen. Jika cabang itu terlalu besar, OpenClaw memulai anak dengan konteks terisolasi alih-alih gagal atau mewarisi riwayat yang tidak dapat digunakan. Kebijakan ukuran bersifat otomatis; konfigurasi legacy `session.parentForkMaxTokens` dihapus oleh `openclaw doctor --fix`.

Detail implementasi: keputusan terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field kunci (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` disetel)
- `sessionStartedAt`: timestamp mulai untuk `sessionId` saat ini; kesegaran reset harian menggunakan ini. Baris legacy dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: timestamp interaksi pengguna/channel nyata terakhir; kesegaran reset idle menggunakan ini sehingga Heartbeat, cron, dan peristiwa exec tidak menjaga sesi tetap hidup. Baris legacy tanpa field ini fallback ke waktu mulai sesi yang dipulihkan untuk kesegaran idle.
- `updatedAt`: timestamp mutasi baris penyimpanan terakhir, digunakan untuk listing, pemangkasan, dan pembukuan. Ini bukan otoritas untuk kesegaran reset harian/idle.
- `sessionFile`: override jalur transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan kirim)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (best-effort / bergantung penyedia):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering auto-Compaction selesai untuk kunci sesi ini
- `memoryFlushAt`: timestamp untuk flush memori pra-Compaction terakhir
- `memoryFlushCompactionCount`: jumlah Compaction saat flush terakhir berjalan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritas: ia dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` milik `openclaw/plugin-sdk/agent-sessions`.

File adalah JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, opsional `parentSession`)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Tipe entri penting:

- `message`: pesan user/assistant/toolResult
- `custom_message`: pesan yang disuntikkan ekstensi yang _masuk_ ke konteks model (dapat disembunyikan dari UI)
- `custom`: status ekstensi yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan Compaction yang dipersistenkan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistenkan saat menavigasi cabang pohon

OpenClaw sengaja **tidak** "memperbaiki" transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token terlacak

Dua konsep berbeda penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dasbor)

Jika Anda menyetel batas:

- Jendela konteks berasal dari katalog model (dan dapat diganti melalui konfigurasi).
- `contextTokens` di penyimpanan adalah nilai estimasi/pelaporan runtime; jangan perlakukan sebagai jaminan ketat.

Untuk selengkapnya, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction meringkas percakapan lama menjadi entri `compaction` yang dipersistenkan dalam transkrip dan mempertahankan pesan terbaru tetap utuh.

Setelah Compaction, giliran berikutnya melihat:

- Ringkasan Compaction
- Pesan setelah `firstKeptEntryId`

Penyuntikan ulang bagian AGENTS.md setelah Compaction bersifat opt-in melalui
`agents.defaults.compaction.postCompactionSections`; saat tidak disetel atau `[]`,
OpenClaw tidak menambahkan kutipan AGENTS.md di atas ringkasan Compaction.

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk Compaction dan pemasangan tool

Saat OpenClaw membagi transkrip panjang menjadi chunk Compaction, OpenClaw menjaga
pemanggilan tool assistant tetap berpasangan dengan entri `toolResult` yang sesuai.

- Jika pemisahan berdasarkan porsi token berada di antara pemanggilan tool dan hasilnya, OpenClaw
  menggeser batas ke pesan pemanggilan tool assistant alih-alih memisahkan
  pasangan tersebut.
- Jika blok tool-result di akhir sebaliknya akan membuat chunk melampaui target,
  OpenClaw mempertahankan blok tool tertunda tersebut dan menjaga ekor yang belum diringkas
  tetap utuh.
- Blok pemanggilan tool yang dibatalkan/error tidak menahan pemisahan tertunda tetap terbuka.

---

## Kapan auto-compaction terjadi (runtime OpenClaw)

Dalam agen OpenClaw tertanam, auto-compaction terpicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan error overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa berbentuk provider) → compact → coba lagi.
   Saat provider melaporkan jumlah token yang dicoba, OpenClaw meneruskan jumlah
   teramati tersebut ke Compaction pemulihan overflow. Jika provider mengonfirmasi
   overflow tetapi tidak mengekspos jumlah yang dapat di-parse, OpenClaw meneruskan jumlah sintetis
   yang sedikit melebihi anggaran ke mesin Compaction dan diagnostik.
   Jika pemulihan overflow tetap gagal, OpenClaw menampilkan panduan eksplisit kepada
   user dan mempertahankan pemetaan sesi saat ini alih-alih diam-diam merotasi
   kunci sesi ke id sesi baru. Langkah berikutnya dikendalikan operator:
   coba lagi pesan, jalankan `/compact`, atau jalankan `/new` saat sesi baru
   lebih diinginkan.
2. **Pemeliharaan ambang**: setelah giliran berhasil, saat:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan untuk prompt + output model berikutnya

Ini adalah semantik runtime OpenClaw.

OpenClaw juga dapat memicu Compaction lokal preflight sebelum membuka run berikutnya
saat `agents.defaults.compaction.maxActiveTranscriptBytes` disetel dan file
transkrip aktif mencapai ukuran tersebut. Ini adalah pelindung ukuran file untuk biaya
membuka ulang secara lokal, bukan pengarsipan mentah: OpenClaw tetap menjalankan Compaction semantik normal,
dan memerlukan `truncateAfterCompaction` agar ringkasan yang dipadatkan dapat menjadi
transkrip penerus baru.

Untuk run OpenClaw tertanam, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
menambahkan pelindung tool-loop opt-in. Setelah hasil tool ditambahkan dan sebelum
pemanggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika anggaran
preflight yang sama yang digunakan di awal giliran. Jika konteks tidak lagi muat, pelindung
tidak melakukan compact di dalam hook `transformContext` runtime OpenClaw. Ia menaikkan sinyal
mid-turn precheck terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan
loop run luar menggunakan jalur pemulihan yang ada: memotong hasil tool yang terlalu besar
saat itu cukup, atau memicu mode Compaction yang dikonfigurasi dan mencoba lagi. Opsi
ini dinonaktifkan secara default dan bekerja dengan mode Compaction `default` maupun `safeguard`,
termasuk Compaction safeguard yang didukung provider.
Ini independen dari `maxActiveTranscriptBytes`: pelindung ukuran byte berjalan
sebelum giliran dibuka, sedangkan mid-turn precheck berjalan kemudian dalam tool loop OpenClaw
tertanam setelah hasil tool baru ditambahkan.

---

## Pengaturan Compaction (`reserveTokens`, `keepRecentTokens`)

Pengaturan Compaction runtime OpenClaw berada di pengaturan agen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw juga memberlakukan batas bawah keamanan untuk run tertanam:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas bawah default adalah `20000` token.
- Setel `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` eksplisit
  dan mempertahankan titik potong ekor terbaru runtime OpenClaw. Tanpa anggaran simpan eksplisit,
  Compaction manual tetap menjadi checkpoint keras dan konteks yang dibangun ulang dimulai dari
  ringkasan baru.
- Setel `agents.defaults.compaction.midTurnPrecheck.enabled: true` untuk menjalankan
  precheck tool-loop opsional setelah hasil tool baru dan sebelum pemanggilan model
  berikutnya. Ini hanya pemicu; pembuatan ringkasan tetap menggunakan jalur
  Compaction yang dikonfigurasi. Ini independen dari `maxActiveTranscriptBytes`, yang merupakan
  pelindung ukuran byte transkrip aktif di awal giliran.
- Setel `agents.defaults.compaction.maxActiveTranscriptBytes` ke nilai byte atau
  string seperti `"20mb"` untuk menjalankan Compaction lokal sebelum giliran saat transkrip aktif
  menjadi besar. Pelindung ini aktif hanya saat
  `truncateAfterCompaction` juga diaktifkan. Biarkan tidak disetel atau setel `0` untuk
  menonaktifkan.
- Saat `agents.defaults.compaction.truncateAfterCompaction` diaktifkan,
  OpenClaw merotasi transkrip aktif ke JSONL penerus yang dipadatkan setelah
  Compaction. Tindakan checkpoint branch/restore menggunakan penerus yang dipadatkan tersebut;
  file checkpoint lama pra-Compaction tetap dapat dibaca selama masih direferensikan.

Alasan: sisakan ruang yang cukup untuk "housekeeping" multi-giliran (seperti penulisan memori) sebelum Compaction menjadi tidak terhindarkan.

Implementasi: `applyAgentCompactionSettingsFromConfig()` di `src/agents/agent-settings.ts`
(dipanggil dari jalur giliran embedded-runner dan penyiapan Compaction).

---

## Penyedia Compaction yang dapat dipasang

Plugin dapat mendaftarkan penyedia Compaction melalui `registerCompactionProvider()` pada API plugin. Saat `agents.defaults.compaction.provider` disetel ke id provider terdaftar, ekstensi safeguard mendelegasikan peringkasan ke provider tersebut alih-alih pipeline bawaan `summarizeInStages`.

- `provider`: id Plugin penyedia Compaction terdaftar. Biarkan tidak disetel untuk peringkasan LLM default.
- Menyetel `provider` memaksa `mode: "safeguard"`.
- Provider menerima instruksi Compaction dan kebijakan preservasi pengenal yang sama dengan jalur bawaan.
- Safeguard tetap mempertahankan konteks suffix giliran terbaru dan giliran terpisah setelah output provider.
- Peringkasan safeguard bawaan menyuling ulang ringkasan sebelumnya dengan pesan baru
  alih-alih mempertahankan ringkasan sebelumnya secara verbatim penuh.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; setel
  `qualityGuard.enabled: false` untuk melewati perilaku coba ulang saat output cacat.
- Jika provider gagal atau mengembalikan hasil kosong, OpenClaw otomatis fallback ke peringkasan LLM bawaan.
- Sinyal abort/timeout dilempar ulang (bukan ditelan) untuk menghormati pembatalan pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat user

Anda dapat mengamati Compaction dan status sesi melalui:

- `/status` (di sesi chat apa pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Log Gateway (`pnpm gateway:watch` atau `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah Compaction

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung giliran "senyap" untuk tugas latar belakang ketika user tidak boleh melihat output perantara.

Konvensi:

- Assistant memulai outputnya dengan token senyap persis `NO_REPLY` /
  `no_reply` untuk menunjukkan "jangan kirim balasan kepada user".
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar/kecil, sehingga `NO_REPLY` dan
  `no_reply` sama-sama dihitung saat seluruh payload hanya token senyap tersebut.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang sebenarnya; ini bukan pintasan untuk
  permintaan user biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** saat
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan output
parsial di tengah giliran.

---

## "Flush memori" pra-Compaction (diimplementasikan)

Tujuan: sebelum auto-compaction terjadi, jalankan giliran agentic senyap yang menulis status tahan lama
ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) agar Compaction tidak dapat
menghapus konteks kritis.

OpenClaw menggunakan pendekatan **flush pra-ambang**:

1. Pantau penggunaan konteks sesi.
2. Saat melewati "ambang lunak" (di bawah ambang Compaction runtime OpenClaw), jalankan arahan senyap
   "tulis memori sekarang" ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` sehingga user tidak melihat
   apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `model` (override provider/model persis opsional untuk giliran flush, misalnya `ollama/qwen3:8b`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan user untuk giliran flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Saat `model` disetel, giliran flush menggunakan model tersebut tanpa mewarisi
  rantai fallback sesi aktif, sehingga housekeeping lokal-saja tidak diam-diam
  fallback ke model percakapan berbayar.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi OpenClaw tertanam (backend CLI melewatinya).
- Flush dilewati saat workspace sesi hanya-baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

OpenClaw juga mengekspos hook `session_before_compact` di API ekstensi, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Kunci sesi salah? Mulai dengan [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Penyimpanan vs transkrip tidak cocok? Konfirmasi host Gateway dan jalur penyimpanan dari `openclaw status`.
- Spam Compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` terlalu tinggi untuk jendela model dapat menyebabkan Compaction lebih awal)
  - pembengkakan tool-result: aktifkan/setel pemangkasan sesi
- Giliran senyap bocor? Konfirmasi balasan dimulai dengan `NO_REPLY` (token persis tidak peka huruf besar/kecil) dan Anda menggunakan build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
