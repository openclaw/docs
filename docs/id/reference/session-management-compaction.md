---
read_when:
    - Anda perlu men-debug ID sesi, JSONL transkrip, atau bidang sessions.json
    - Anda sedang mengubah perilaku Compaction otomatis atau menambahkan tugas pemeliharaan “pra-Compaction”
    - Anda ingin mengimplementasikan pengosongan memori atau giliran sistem senyap
summary: 'Pendalaman: penyimpanan sesi + transkrip, siklus hidup, dan internal Compaction (otomatis)'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-05-05T08:26:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw mengelola sesi secara menyeluruh di area berikut:

- **Perutean sesi** (bagaimana pesan masuk dipetakan ke sebuah `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Kebersihan transkrip** (perbaikan khusus provider sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (manual dan auto-compaction) dan tempat mengaitkan pekerjaan pra-compaction
- **Pemeliharaan senyap** (penulisan memori yang tidak boleh menghasilkan output yang terlihat oleh pengguna)

Jika Anda ingin gambaran tingkat tinggi terlebih dahulu, mulai dengan:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Kebersihan transkrip](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki status sesi.

- UI (aplikasi macOS, Control UI web, TUI) harus meminta daftar sesi dan jumlah token dari Gateway.
- Dalam mode remote, berkas sesi berada di host remote; “memeriksa berkas Mac lokal Anda” tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempertahankan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta key/value: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dan sebagainya)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan sebenarnya + pemanggilan tool + ringkasan compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya
   - Checkpoint debug pra-compaction yang besar dilewati setelah transkrip aktif
     melampaui batas ukuran checkpoint, sehingga menghindari salinan
     `.checkpoint.*.jsonl` raksasa kedua.

Pembaca riwayat Gateway sebaiknya menghindari materialisasi seluruh transkrip kecuali
surface tersebut secara eksplisit membutuhkan akses historis arbitrer. Riwayat halaman pertama,
riwayat chat tertanam, pemulihan restart, serta pemeriksaan token/penggunaan memakai pembacaan tail
berbatas. Pemindaian transkrip penuh melewati indeks transkrip asinkron, yang
di-cache berdasarkan jalur berkas plus `mtimeMs`/`size` dan dibagikan antar pembaca konkuren.

---

## Lokasi di disk

Per agent, pada host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw menyelesaikan lokasi ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json`, artefak transkrip, dan sidecar trajectory:

- `mode`: `warn` (default) atau `enforce`
- `pruneAfter`: batas usia entri basi (default `30d`)
- `maxEntries`: batas entri dalam `sessions.json` (default `500`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama dengan `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Penulisan Gateway normal mengalir melalui penulis sesi per penyimpanan yang menserialkan mutasi dalam proses tanpa mengambil runtime file lock. Helper patch hot-path meminjam cache mutable yang telah divalidasi selama memegang slot penulis itu, sehingga berkas `sessions.json` yang besar tidak dikloning atau dibaca ulang untuk setiap pembaruan metadata. Kode runtime sebaiknya memilih `updateSessionStore(...)` atau `updateSessionStoreEntry(...)`; penyimpanan seluruh store secara langsung adalah tool kompatibilitas dan pemeliharaan offline. Ketika Gateway dapat dijangkau, `openclaw sessions cleanup` dan `openclaw agents delete` non-dry-run mendelegasikan mutasi store ke Gateway sehingga pembersihan bergabung dengan antrean penulis yang sama; `--store <path>` adalah jalur perbaikan offline eksplisit untuk pemeliharaan berkas langsung. Pembersihan `maxEntries` tetap di-batch untuk batas berukuran produksi, sehingga sebuah store dapat sebentar melampaui batas yang dikonfigurasi sebelum pembersihan high-water berikutnya menulis ulangnya kembali turun. Pembacaan penyimpanan sesi tidak memangkas atau membatasi entri selama startup Gateway; gunakan penulisan atau `openclaw sessions cleanup --enforce` untuk pembersihan. `openclaw sessions cleanup --enforce` tetap menerapkan batas yang dikonfigurasi secara langsung dan memangkas artefak transkrip, checkpoint, serta trajectory lama yang tidak dirujuk bahkan ketika tidak ada anggaran disk yang dikonfigurasi.

Pemeliharaan mempertahankan pointer percakapan eksternal yang tahan lama seperti sesi grup
dan sesi chat bercakupan thread, tetapi entri runtime sintetis untuk cron, hook,
heartbeat, ACP, dan sub-agent masih dapat dihapus ketika melebihi
usia, jumlah, atau anggaran disk yang dikonfigurasi.

OpenClaw tidak lagi membuat backup rotasi `sessions.json.bak.*` otomatis selama penulisan Gateway. Key lama `session.maintenance.rotateBytes` diabaikan dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Mutasi transkrip menggunakan session write lock pada berkas transkrip. Akuisisi lock menunggu hingga
`session.writeLock.acquireTimeoutMs` sebelum memunculkan error sesi sibuk; default-nya adalah `60000`
ms. Naikkan ini hanya ketika pekerjaan persiapan, pembersihan, compaction, atau mirror transkrip yang sah berkontensi
lebih lama pada mesin lambat. Deteksi stale-lock dan peringatan batas waktu penahanan maksimum tetap menjadi kebijakan terpisah.

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak arsip tertua, transkrip yatim, atau trajectory yatim terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua beserta berkas transkrip/trajectory-nya.
3. Teruskan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi eviction tetapi tidak memutasi store/berkas.

Jalankan pemeliharaan sesuai kebutuhan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log run

Run cron terisolasi juga membuat entri/transkrip sesi, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas berkas `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

Ketika cron memaksa pembuatan sesi run terisolasi baru, cron membersihkan entri sesi
`cron:<jobId>` sebelumnya sebelum menulis baris baru. Cron membawa preferensi aman
seperti pengaturan thinking/fast/verbose, label, serta override model/auth yang dipilih
pengguna secara eksplisit. Cron membuang konteks percakapan sekitar seperti
perutean channel/group, kebijakan kirim atau antre, elevation, origin, dan binding runtime ACP
sehingga run terisolasi baru tidak dapat mewarisi delivery atau otoritas runtime
basi dari run lama.

---

## Key sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang Anda masuki (perutean + isolasi).

Pola umum:

- Chat utama/langsung (per agent): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali di-override)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (berkas transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 AM waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau legacy `session.idleMinutes`) membuat `sessionId` baru ketika sebuah pesan tiba setelah jendela idle. Ketika harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu menang.
- **Peristiwa sistem** (heartbeat, wakeup cron, notifikasi exec, pembukuan gateway) dapat memutasi baris sesi tetapi tidak memperpanjang kesegaran reset harian/idle. Rollover reset membuang pemberitahuan peristiwa sistem yang diantrekan untuk sesi sebelumnya sebelum prompt baru dibuat.
- **Kebijakan parent fork** menggunakan cabang aktif PI saat membuat thread atau fork subagent. Jika cabang tersebut terlalu besar, OpenClaw memulai child dengan konteks terisolasi alih-alih gagal atau mewarisi riwayat yang tidak dapat digunakan. Kebijakan ukuran bersifat otomatis; konfigurasi legacy `session.parentForkMaxTokens` dihapus oleh `openclaw doctor --fix`.

Detail implementasi: keputusan terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai store adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field utama (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama berkas diturunkan dari ini kecuali `sessionFile` diatur)
- `sessionStartedAt`: timestamp mulai untuk `sessionId` saat ini; kesegaran reset harian
  menggunakan ini. Baris legacy dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: timestamp interaksi pengguna/channel nyata terakhir; kesegaran reset idle
  menggunakan ini sehingga peristiwa heartbeat, cron, dan exec tidak menjaga sesi
  tetap hidup. Baris legacy tanpa field ini fallback ke waktu mulai sesi yang dipulihkan
  untuk kesegaran idle.
- `updatedAt`: timestamp mutasi baris store terakhir, digunakan untuk listing, pruning, dan
  pembukuan. Ini bukan otoritas untuk kesegaran reset harian/idle.
- `sessionFile`: override jalur transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan kirim)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (best-effort / bergantung provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering auto-compaction selesai untuk key sesi ini
- `memoryFlushAt`: timestamp untuk flush memori pra-compaction terakhir
- `memoryFlushCompactionCount`: jumlah compaction ketika flush terakhir berjalan

Store aman untuk diedit, tetapi Gateway adalah otoritas: Gateway dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` milik `@mariozechner/pi-coding-agent`.

Berkasnya adalah JSONL:

- Baris pertama: header sesi (`type: "session"`, menyertakan `id`, `cwd`, `timestamp`, opsional `parentSession`)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Tipe entri penting:

- `message`: pesan user/assistant/toolResult
- `custom_message`: pesan yang diinjeksi extension yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: status extension yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan compaction yang dipertahankan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipertahankan saat menavigasi cabang pohon

OpenClaw secara sengaja **tidak** “memperbaiki” transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dashboard)

Jika Anda menyesuaikan batas:

- Jendela konteks berasal dari katalog model (dan dapat di-override melalui konfigurasi).
- `contextTokens` dalam store adalah nilai estimasi/pelaporan runtime; jangan memperlakukannya sebagai jaminan ketat.

Untuk informasi selengkapnya, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction meringkas percakapan lama menjadi entri `compaction` yang dipertahankan dalam transkrip dan mempertahankan pesan terbaru tetap utuh.

Setelah compaction, giliran berikutnya melihat:

- Ringkasan compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk Compaction dan pasangan tool

Saat OpenClaw membagi transkrip panjang menjadi chunk Compaction, OpenClaw menjaga
pemanggilan tool assistant tetap berpasangan dengan entri `toolResult` yang sesuai.

- Jika pemisahan berdasarkan porsi token jatuh di antara pemanggilan tool dan hasilnya, OpenClaw
  menggeser batas ke pesan pemanggilan tool assistant alih-alih memisahkan
  pasangan tersebut.
- Jika blok hasil tool di bagian akhir sebaliknya akan membuat chunk melebihi target,
  OpenClaw mempertahankan blok tool yang tertunda itu dan menjaga ekor yang belum diringkas
  tetap utuh.
- Blok pemanggilan tool yang dibatalkan/galat tidak menahan pemisahan tertunda tetap terbuka.

---

## Kapan auto-compaction terjadi (runtime Pi)

Di agen Pi tertanam, auto-compaction dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan galat overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa berbentuk provider) → compact → coba ulang.
2. **Pemeliharaan ambang**: setelah turn berhasil, ketika:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan yang disisihkan untuk prompt + output model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event, tetapi Pi menentukan kapan melakukan compact).

OpenClaw juga dapat memicu Compaction lokal prapenerbangan sebelum membuka run berikutnya
ketika `agents.defaults.compaction.maxActiveTranscriptBytes` disetel dan file
transkrip aktif mencapai ukuran tersebut. Ini adalah penjaga ukuran file untuk biaya
pembukaan ulang lokal, bukan pengarsipan mentah: OpenClaw tetap menjalankan Compaction semantik normal,
dan ini memerlukan `truncateAfterCompaction` agar ringkasan yang telah di-compact dapat menjadi
transkrip penerus baru.

Untuk run Pi tertanam, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
menambahkan penjaga loop tool opsional. Setelah hasil tool ditambahkan dan sebelum
pemanggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika
anggaran prapenerbangan yang sama seperti saat awal turn. Jika konteks tidak lagi muat,
penjaga tidak melakukan compact di dalam hook `transformContext` milik Pi. Ia menaikkan sinyal
prapemeriksaan mid-turn terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan
loop run luar memakai jalur pemulihan yang ada: memotong hasil tool yang terlalu besar
ketika itu cukup, atau memicu mode Compaction yang dikonfigurasi dan mencoba ulang. Opsi
ini dinonaktifkan secara default dan bekerja dengan mode Compaction `default` dan `safeguard`,
termasuk Compaction safeguard yang didukung provider.
Ini independen dari `maxActiveTranscriptBytes`: penjaga ukuran byte berjalan
sebelum turn dibuka, sementara prapemeriksaan mid-turn berjalan belakangan di loop tool Pi tertanam
setelah hasil tool baru ditambahkan.

---

## Pengaturan Compaction (`reserveTokens`, `keepRecentTokens`)

Pengaturan Compaction Pi berada di pengaturan Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw juga menerapkan batas bawah keamanan untuk run tertanam:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas bawah default adalah `20000` token.
- Setel `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika nilainya sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` eksplisit
  dan mempertahankan titik pemotongan ekor-terbaru Pi. Tanpa anggaran simpan eksplisit,
  Compaction manual tetap menjadi checkpoint keras dan konteks yang dibangun ulang dimulai dari
  ringkasan baru.
- Setel `agents.defaults.compaction.midTurnPrecheck.enabled: true` untuk menjalankan
  prapemeriksaan loop tool opsional setelah hasil tool baru dan sebelum pemanggilan model
  berikutnya. Ini hanya pemicu; pembuatan ringkasan tetap menggunakan jalur
  Compaction yang dikonfigurasi. Ini independen dari `maxActiveTranscriptBytes`, yang merupakan
  penjaga ukuran byte transkrip aktif saat awal turn.
- Setel `agents.defaults.compaction.maxActiveTranscriptBytes` ke nilai byte atau
  string seperti `"20mb"` untuk menjalankan Compaction lokal sebelum turn ketika transkrip aktif
  menjadi besar. Penjaga ini aktif hanya ketika
  `truncateAfterCompaction` juga diaktifkan. Biarkan tidak disetel atau setel `0` untuk
  menonaktifkan.
- Ketika `agents.defaults.compaction.truncateAfterCompaction` diaktifkan,
  OpenClaw merotasi transkrip aktif ke JSONL penerus yang telah di-compact setelah
  Compaction. Transkrip penuh lama tetap diarsipkan dan ditautkan dari
  checkpoint Compaction alih-alih ditulis ulang di tempat.

Alasan: sisakan ruang cadangan yang cukup untuk “housekeeping” multi-turn (seperti penulisan memori) sebelum Compaction menjadi tak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` di `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Provider Compaction pluggable

Plugin dapat mendaftarkan provider Compaction melalui `registerCompactionProvider()` pada API Plugin. Ketika `agents.defaults.compaction.provider` disetel ke id provider terdaftar, plugin safeguard mendelegasikan peringkasan ke provider tersebut alih-alih pipeline `summarizeInStages` bawaan.

- `provider`: id Plugin provider Compaction terdaftar. Biarkan tidak disetel untuk peringkasan LLM default.
- Menyetel `provider` memaksa `mode: "safeguard"`.
- Provider menerima instruksi Compaction dan kebijakan pelestarian pengenal yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan konteks suffix turn-terbaru dan split-turn setelah output provider.
- Peringkasan safeguard bawaan menyuling ulang ringkasan sebelumnya dengan pesan baru
  alih-alih mempertahankan ringkasan sebelumnya secara verbatim penuh.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; setel
  `qualityGuard.enabled: false` untuk melewati perilaku coba-ulang-saat-output-salah-bentuk.
- Jika provider gagal atau mengembalikan hasil kosong, OpenClaw otomatis fallback ke peringkasan LLM bawaan.
- Sinyal batal/timeout dilempar ulang (tidak ditelan) untuk menghormati pembatalan pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat pengguna

Anda dapat mengamati Compaction dan status sesi melalui:

- `/status` (di sesi chat mana pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah Compaction

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung turn “senyap” untuk tugas latar belakang saat pengguna seharusnya tidak melihat output perantara.

Konvensi:

- Assistant memulai outputnya dengan token senyap persis `NO_REPLY` /
  `no_reply` untuk menunjukkan “jangan kirim balasan kepada pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar-kecil, sehingga `NO_REPLY` dan
  `no_reply` keduanya dihitung ketika seluruh payload hanya token senyap tersebut.
- Ini hanya untuk turn latar belakang/tanpa-pengiriman yang sebenarnya; ini bukan pintasan untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** ketika
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan output
parsial di tengah turn.

---

## "Memory flush" pra-Compaction (diimplementasikan)

Tujuan: sebelum auto-compaction terjadi, jalankan turn agentic senyap yang menulis status tahan lama
ke disk (mis. `memory/YYYY-MM-DD.md` di workspace agen) sehingga Compaction tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang**:

1. Pantau penggunaan konteks sesi.
2. Ketika melewati “ambang lunak” (di bawah ambang Compaction Pi), jalankan direktif senyap
   “tulis memori sekarang” ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` sehingga pengguna tidak melihat
   apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `model` (override provider/model persis opsional untuk turn flush, misalnya `ollama/qwen3:8b`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan pengguna untuk turn flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk turn flush)

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Ketika `model` disetel, turn flush menggunakan model tersebut tanpa mewarisi
  rantai fallback sesi aktif, sehingga housekeeping hanya-lokal tidak diam-diam
  fallback ke model percakapan berbayar.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush berjalan hanya untuk sesi Pi tertanam (backend CLI melewatinya).
- Flush dilewati ketika workspace sesi bersifat hanya-baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API plugin, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Checklist pemecahan masalah

- Kunci sesi salah? Mulai dengan [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Store vs transkrip tidak cocok? Konfirmasi host Gateway dan jalur store dari `openclaw status`.
- Spam Compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` terlalu tinggi untuk jendela model dapat menyebabkan Compaction lebih awal)
  - pembengkakan hasil tool: aktifkan/sesuaikan pemangkasan sesi
- Turn senyap bocor? Konfirmasi balasan dimulai dengan `NO_REPLY` (token persis tidak peka huruf besar-kecil) dan Anda berada pada build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
