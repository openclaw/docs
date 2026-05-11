---
read_when:
    - Anda perlu men-debug ID sesi, JSONL transkrip, atau bidang sessions.json
    - Anda sedang mengubah perilaku Compaction otomatis atau menambahkan pemeliharaan "pra-Compaction"
    - Anda ingin mengimplementasikan pengosongan memori atau giliran sistem senyap
summary: 'Pembahasan mendalam: penyimpanan sesi + transkrip, siklus hidup, dan internal Compaction (otomatis)'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-05-11T20:35:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw mengelola sesi secara menyeluruh di area berikut:

- **Perutean sesi** (cara pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Kebersihan transkrip** (perbaikan khusus penyedia sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (manual dan auto-compaction) dan tempat mengaitkan pekerjaan pra-compaction
- **Pemeliharaan senyap** (penulisan memori yang tidak boleh menghasilkan keluaran yang terlihat pengguna)

Jika Anda menginginkan gambaran tingkat lebih tinggi terlebih dahulu, mulai dari:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Kebersihan transkrip](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki status sesi.

- UI (aplikasi macOS, UI Kontrol web, TUI) harus meminta daftar sesi dan jumlah token dari Gateway.
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
   - Menyimpan percakapan aktual + panggilan alat + ringkasan compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya
   - Checkpoint debug pra-compaction besar dilewati setelah transkrip aktif
     melampaui batas ukuran checkpoint, sehingga menghindari salinan
     `.checkpoint.*.jsonl` raksasa kedua.

Pembaca riwayat Gateway harus menghindari mematerialkan seluruh transkrip kecuali
permukaan tersebut secara eksplisit membutuhkan akses historis arbitrer. Riwayat halaman pertama,
riwayat chat tertanam, pemulihan restart, dan pemeriksaan token/penggunaan memakai pembacaan tail
berbatas. Pemindaian transkrip penuh melalui indeks transkrip async, yang
di-cache berdasarkan jalur file plus `mtimeMs`/`size` dan dibagikan di antara pembaca konkuren.

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

- `mode`: `warn` (default) atau `enforce`
- `pruneAfter`: batas usia entri usang (default `30d`)
- `maxEntries`: batas entri dalam `sessions.json` (default `500`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama seperti `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Penulisan Gateway normal mengalir melalui penulis sesi per penyimpanan yang menserialkan mutasi dalam proses tanpa mengambil runtime file lock. Helper patch hot-path meminjam cache mutable yang telah divalidasi selama memegang slot penulis itu, sehingga file `sessions.json` besar tidak dikloning atau dibaca ulang untuk setiap pembaruan metadata. Kode runtime sebaiknya memilih `updateSessionStore(...)` atau `updateSessionStoreEntry(...)`; penyimpanan seluruh store langsung adalah alat kompatibilitas dan pemeliharaan offline. Saat Gateway dapat dijangkau, `openclaw sessions cleanup` dan `openclaw agents delete` non-dry-run mendelegasikan mutasi store ke Gateway sehingga pembersihan bergabung dengan antrean penulis yang sama; `--store <path>` adalah jalur perbaikan offline eksplisit untuk pemeliharaan file langsung. Pembersihan `maxEntries` tetap dibatch untuk batas berukuran produksi, sehingga store dapat sebentar melampaui batas terkonfigurasi sebelum pembersihan high-water berikutnya menulis ulangnya kembali ke bawah. Pembacaan store sesi tidak memangkas atau membatasi entri selama startup Gateway; gunakan penulisan atau `openclaw sessions cleanup --enforce` untuk pembersihan. `openclaw sessions cleanup --enforce` tetap menerapkan batas terkonfigurasi segera dan memangkas artefak transkrip, checkpoint, dan trajectory lama yang tidak direferensikan bahkan ketika tidak ada anggaran disk yang dikonfigurasi.

Pemeliharaan mempertahankan pointer percakapan eksternal yang tahan lama seperti sesi grup
dan sesi chat berlingkup thread, tetapi entri runtime sintetis untuk cron, hook,
heartbeat, ACP, dan sub-agen tetap dapat dihapus ketika melampaui
usia, jumlah, atau anggaran disk yang dikonfigurasi.

OpenClaw tidak lagi membuat cadangan rotasi `sessions.json.bak.*` otomatis selama penulisan Gateway. Kunci lama `session.maintenance.rotateBytes` diabaikan dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Mutasi transkrip memakai write lock sesi pada file transkrip. Akuisisi lock menunggu hingga
`session.writeLock.acquireTimeoutMs` sebelum memunculkan galat sesi sibuk; defaultnya adalah `60000`
md. Naikkan ini hanya ketika pekerjaan prep, pembersihan, compaction, atau mirror transkrip yang sah bersaing
lebih lama pada mesin lambat. Deteksi lock usang dan peringatan maksimum penahanan tetap menjadi kebijakan terpisah.

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak arsip, transkrip yatim, atau trajectory yatim tertua terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua dan file transkrip/trajectory-nya.
3. Teruskan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi pengeluaran tetapi tidak memutasi store/file.

Jalankan pemeliharaan sesuai permintaan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log run

Run cron terisolasi juga membuat entri sesi/transkrip, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run cron terisolasi lama dari store sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

Ketika cron memaksa pembuatan sesi run terisolasi baru, ia membersihkan entri sesi
`cron:<jobId>` sebelumnya sebelum menulis baris baru. Ia membawa preferensi aman
seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang
dipilih pengguna secara eksplisit. Ia membuang konteks percakapan sekitar seperti
perutean channel/grup, kebijakan kirim atau antre, elevasi, asal, dan pengikatan runtime
ACP sehingga run terisolasi baru tidak dapat mewarisi pengiriman usang atau
otoritas runtime dari run lama.

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang Anda masuki (perutean + isolasi).

Pola umum:

- Chat utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Ruang/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali dioverride)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## ID sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Pedoman umum:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 pagi waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau legacy `session.idleMinutes`) membuat `sessionId` baru ketika pesan tiba setelah jendela idle. Ketika harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu menang.
- **Peristiwa sistem** (heartbeat, wakeup cron, notifikasi exec, pembukuan gateway) dapat memutasi baris sesi tetapi tidak memperpanjang kesegaran reset harian/idle. Rollover reset membuang pemberitahuan peristiwa sistem yang diantrekan untuk sesi sebelumnya sebelum prompt segar dibangun.
- **Kebijakan fork induk** menggunakan cabang aktif PI saat membuat thread atau fork subagen. Jika cabang itu terlalu besar, OpenClaw memulai child dengan konteks terisolasi alih-alih gagal atau mewarisi riwayat yang tidak dapat digunakan. Kebijakan ukuran bersifat otomatis; konfigurasi legacy `session.parentForkMaxTokens` dihapus oleh `openclaw doctor --fix`.

Detail implementasi: keputusan terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema store sesi (`sessions.json`)

Tipe nilai store adalah `SessionEntry` dalam `src/config/sessions.ts`.

Bidang kunci (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` ditetapkan)
- `sessionStartedAt`: timestamp mulai untuk `sessionId` saat ini; kesegaran reset harian
  menggunakan ini. Baris legacy dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: timestamp interaksi pengguna/channel nyata terakhir; kesegaran reset idle
  menggunakan ini sehingga peristiwa heartbeat, cron, dan exec tidak menjaga sesi
  tetap hidup. Baris legacy tanpa bidang ini fallback ke waktu mulai sesi yang dipulihkan
  untuk kesegaran idle.
- `updatedAt`: timestamp mutasi baris store terakhir, digunakan untuk listing, pemangkasan, dan
  pembukuan. Ini bukan otoritas untuk kesegaran reset harian/idle.
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
- `compactionCount`: seberapa sering auto-compaction selesai untuk kunci sesi ini
- `memoryFlushAt`: timestamp untuk flush memori pra-compaction terakhir
- `memoryFlushCompactionCount`: jumlah compaction ketika flush terakhir berjalan

Store aman untuk diedit, tetapi Gateway adalah otoritasnya: ia dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` dari `@earendil-works/pi-coding-agent`.

File tersebut adalah JSONL:

- Baris pertama: header sesi (`type: "session"`, menyertakan `id`, `cwd`, `timestamp`, opsional `parentSession`)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Tipe entri penting:

- `message`: pesan pengguna/asisten/toolResult
- `custom_message`: pesan yang diinjeksi ekstensi yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: status ekstensi yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan compaction yang dipertahankan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipertahankan saat menavigasi cabang pohon

OpenClaw secara sengaja **tidak** "memperbaiki" transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung store sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dasbor)

Jika Anda menyetel batas:

- Jendela konteks berasal dari katalog model (dan dapat dioverride melalui konfigurasi).
- `contextTokens` dalam store adalah nilai estimasi/pelaporan runtime; jangan perlakukan sebagai jaminan ketat.

Untuk selengkapnya, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction meringkas percakapan lama ke dalam entri `compaction` yang dipertahankan dalam transkrip dan menjaga pesan terbaru tetap utuh.

Setelah compaction, giliran mendatang melihat:

- Ringkasan compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk Compaction dan pemasangan alat

Saat OpenClaw membagi transkrip panjang menjadi chunk compaction, OpenClaw menjaga
panggilan alat asisten tetap dipasangkan dengan entri `toolResult` yang sesuai.

- Jika pembagian berbasis porsi token jatuh di antara panggilan alat dan hasilnya, OpenClaw
  menggeser batas ke pesan panggilan alat asisten alih-alih memisahkan
  pasangan tersebut.
- Jika blok hasil alat di akhir seharusnya mendorong chunk melewati target,
  OpenClaw mempertahankan blok alat yang tertunda itu dan menjaga ekor yang belum diringkas
  tetap utuh.
- Blok panggilan alat yang dibatalkan/galat tidak membuat pembagian tertunda tetap terbuka.

---

## Kapan auto-compaction terjadi (runtime Pi)

Di agen Pi tertanam, auto-compaction dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan galat overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa berbentuk penyedia) → compact → coba lagi.
2. **Pemeliharaan ambang batas**: setelah giliran berhasil, ketika:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan yang disisihkan untuk prompt + keluaran model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event, tetapi Pi memutuskan kapan melakukan compact).

OpenClaw juga dapat memicu compaction lokal prapemeriksaan sebelum membuka run berikutnya
ketika `agents.defaults.compaction.maxActiveTranscriptBytes` ditetapkan dan file
transkrip aktif mencapai ukuran tersebut. Ini adalah pengaman ukuran file untuk biaya
pembukaan ulang lokal, bukan pengarsipan mentah: OpenClaw tetap menjalankan compaction semantik normal,
dan memerlukan `truncateAfterCompaction` agar ringkasan yang sudah di-compact dapat menjadi
transkrip penerus baru.

Untuk run Pi tertanam, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
menambahkan pengaman loop alat opsional. Setelah hasil alat ditambahkan dan sebelum
panggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika anggaran
prapemeriksaan yang sama seperti saat awal giliran. Jika konteks tidak lagi muat, pengaman
tidak melakukan compact di dalam hook `transformContext` milik Pi. Pengaman menaikkan sinyal
prapemeriksaan tengah giliran terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan
loop run luar menggunakan jalur pemulihan yang ada: memotong hasil alat yang terlalu besar
jika itu cukup, atau memicu mode compaction yang dikonfigurasi dan mencoba lagi. Opsi ini
dinonaktifkan secara default dan bekerja dengan mode compaction `default` maupun `safeguard`,
termasuk compaction safeguard yang didukung penyedia.
Ini independen dari `maxActiveTranscriptBytes`: pengaman ukuran byte berjalan
sebelum giliran dibuka, sedangkan prapemeriksaan tengah giliran berjalan kemudian dalam loop alat Pi tertanam
setelah hasil alat baru ditambahkan.

---

## Pengaturan Compaction (`reserveTokens`, `keepRecentTokens`)

Pengaturan compaction Pi berada di pengaturan Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw juga memberlakukan batas bawah keselamatan untuk run tertanam:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas bawah default adalah `20000` token.
- Tetapkan `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` yang eksplisit
  dan mempertahankan titik potong ekor terbaru Pi. Tanpa anggaran simpan eksplisit,
  compaction manual tetap menjadi checkpoint keras dan konteks yang dibangun ulang dimulai dari
  ringkasan baru.
- Tetapkan `agents.defaults.compaction.midTurnPrecheck.enabled: true` untuk menjalankan
  prapemeriksaan loop alat opsional setelah hasil alat baru dan sebelum panggilan model berikutnya.
  Ini hanya pemicu; pembuatan ringkasan tetap menggunakan jalur compaction yang dikonfigurasi.
  Ini independen dari `maxActiveTranscriptBytes`, yang merupakan pengaman ukuran byte
  transkrip aktif pada awal giliran.
- Tetapkan `agents.defaults.compaction.maxActiveTranscriptBytes` ke nilai byte atau
  string seperti `"20mb"` untuk menjalankan compaction lokal sebelum giliran saat transkrip
  aktif menjadi besar. Pengaman ini aktif hanya ketika
  `truncateAfterCompaction` juga diaktifkan. Biarkan tidak ditetapkan atau tetapkan `0` untuk
  menonaktifkan.
- Ketika `agents.defaults.compaction.truncateAfterCompaction` diaktifkan,
  OpenClaw merotasi transkrip aktif ke JSONL penerus yang sudah di-compact setelah
  compaction. Transkrip penuh lama tetap diarsipkan dan ditautkan dari
  checkpoint compaction alih-alih ditulis ulang di tempat.

Alasan: sisakan ruang yang cukup untuk "housekeeping" multi-giliran (seperti penulisan memori) sebelum compaction menjadi tidak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` di `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Penyedia compaction yang dapat dipasang

Plugin dapat mendaftarkan penyedia compaction melalui `registerCompactionProvider()` pada API plugin. Ketika `agents.defaults.compaction.provider` ditetapkan ke id penyedia yang terdaftar, ekstensi safeguard mendelegasikan peringkasan ke penyedia tersebut alih-alih pipeline `summarizeInStages` bawaan.

- `provider`: id Plugin penyedia compaction terdaftar. Biarkan tidak ditetapkan untuk peringkasan LLM default.
- Menetapkan `provider` memaksa `mode: "safeguard"`.
- Penyedia menerima instruksi compaction dan kebijakan pelestarian pengenal yang sama dengan jalur bawaan.
- Safeguard tetap mempertahankan konteks sufiks giliran terbaru dan giliran terbelah setelah keluaran penyedia.
- Peringkasan safeguard bawaan mendistilasi ulang ringkasan sebelumnya dengan pesan baru
  alih-alih mempertahankan seluruh ringkasan sebelumnya secara verbatim.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; tetapkan
  `qualityGuard.enabled: false` untuk melewati perilaku coba lagi saat keluaran cacat.
- Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw otomatis kembali ke peringkasan LLM bawaan.
- Sinyal pembatalan/timeout dilempar ulang (tidak ditelan) untuk menghormati pembatalan pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat oleh pengguna

Anda dapat mengamati compaction dan status sesi melalui:

- `/status` (di sesi chat apa pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Log Gateway (`pnpm gateway:watch` atau `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah compaction

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung giliran "senyap" untuk tugas latar belakang ketika pengguna tidak boleh melihat keluaran perantara.

Konvensi:

- Asisten memulai keluarannya dengan token senyap persis `NO_REPLY` /
  `no_reply` untuk menunjukkan "jangan kirim balasan kepada pengguna".
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar-kecil, sehingga `NO_REPLY` dan
  `no_reply` keduanya dihitung ketika seluruh payload hanyalah token senyap.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang sebenarnya; ini bukan pintasan untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/mengetik** ketika
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan keluaran parsial
di tengah giliran.

---

## "Memory flush" pra-compaction (diimplementasikan)

Tujuan: sebelum auto-compaction terjadi, jalankan giliran agentic senyap yang menulis state tahan lama
ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) agar compaction tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang batas**:

1. Pantau penggunaan konteks sesi.
2. Saat melewati "ambang batas lunak" (di bawah ambang compaction Pi), jalankan direktif senyap
   "tulis memori sekarang" ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` sehingga pengguna tidak melihat
   apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `model` (override penyedia/model persis opsional untuk giliran flush, misalnya `ollama/qwen3:8b`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan pengguna untuk giliran flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Ketika `model` ditetapkan, giliran flush menggunakan model tersebut tanpa mewarisi
  rantai fallback sesi aktif, sehingga housekeeping khusus lokal tidak diam-diam
  fallback ke model percakapan berbayar.
- Flush berjalan sekali per siklus compaction (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi Pi tertanam (backend CLI melewatinya).
- Flush dilewati ketika workspace sesi bersifat baca-saja (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API ekstensi, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Kunci sesi salah? Mulai dengan [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Store vs transkrip tidak cocok? Konfirmasi host Gateway dan jalur store dari `openclaw status`.
- Spam compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan compaction (`reserveTokens` terlalu tinggi untuk jendela model dapat menyebabkan compaction lebih awal)
  - pembengkakan hasil alat: aktifkan/sesuaikan pemangkasan sesi
- Giliran senyap bocor? Konfirmasi balasan dimulai dengan `NO_REPLY` (token persis tidak peka huruf besar-kecil) dan Anda berada pada build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
