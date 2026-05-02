---
read_when:
    - Anda perlu menelusuri kesalahan pada ID sesi, transkrip JSONL, atau bidang sessions.json
    - Anda mengubah perilaku Compaction otomatis atau menambahkan pemeliharaan “pra-Compaction”
    - Anda ingin menerapkan pengosongan memori atau giliran sistem senyap
summary: 'Pendalaman: penyimpanan sesi + transkrip, siklus hidup, dan internal Compaction (otomatis)'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-05-02T09:31:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ca8a35210625051f5051e90a18a005d6103bc1d65d356c34f818d2bfc0058c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw mengelola sesi dari awal hingga akhir di area berikut:

- **Perutean sesi** (cara pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Higiene transkrip** (perbaikan khusus penyedia sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (manual dan auto-compaction) dan tempat mengaitkan pekerjaan pra-compaction
- **Housekeeping senyap** (penulisan memori yang tidak boleh menghasilkan output yang terlihat oleh pengguna)

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

- UI (aplikasi macOS, Control UI web, TUI) harus menanyakan daftar sesi dan jumlah token ke Gateway.
- Dalam mode jarak jauh, file sesi berada di host jarak jauh; “memeriksa file Mac lokal Anda” tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempertahankan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta key/value: `sessionKey -> SessionEntry`
   - Kecil, dapat berubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan aktual + panggilan tool + ringkasan compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya
   - Checkpoint debug besar pra-compaction dilewati setelah transkrip aktif
     melebihi batas ukuran checkpoint, sehingga menghindari salinan
     `.checkpoint.*.jsonl` raksasa kedua.

Pembaca riwayat Gateway harus menghindari materialisasi seluruh transkrip kecuali
permukaannya secara eksplisit membutuhkan akses riwayat arbitrer. Riwayat halaman pertama,
riwayat chat tertanam, pemulihan restart, dan pemeriksaan token/penggunaan menggunakan pembacaan tail
berbatas. Pemindaian transkrip penuh melewati indeks transkrip async, yang
di-cache berdasarkan path file plus `mtimeMs`/`size` dan dibagikan di antara pembaca bersamaan.

---

## Lokasi di disk

Per agen, di host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw menyelesaikan ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json`, artefak transkrip, dan sidecar trajectory:

- `mode`: `warn` (default) atau `enforce`
- `pruneAfter`: batas usia entri usang (default `30d`)
- `maxEntries`: batas entri di `sessions.json` (default `500`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama seperti `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Penulisan Gateway normal melakukan batch pembersihan `maxEntries` untuk batas berukuran produksi, sehingga penyimpanan mungkin sempat melebihi batas yang dikonfigurasi sebelum pembersihan high-water berikutnya menulis ulang kembali ke bawah batas. Pembacaan penyimpanan sesi tidak memangkas atau membatasi entri selama startup Gateway; gunakan penulisan atau `openclaw sessions cleanup --enforce` untuk pembersihan. `openclaw sessions cleanup --enforce` tetap menerapkan batas yang dikonfigurasi segera.

Pemeliharaan mempertahankan pointer percakapan eksternal yang tahan lama seperti sesi grup
dan sesi chat dengan scope thread, tetapi entri runtime sintetis untuk cron, hook,
heartbeat, ACP, dan sub-agen tetap dapat dihapus saat melebihi
usia, jumlah, atau anggaran disk yang dikonfigurasi.

OpenClaw tidak lagi membuat backup rotasi otomatis `sessions.json.bak.*` selama penulisan Gateway. Kunci lama `session.maintenance.rotateBytes` diabaikan dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Urutan enforcement untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak arsip tertua, transkrip yatim, atau trajectory yatim terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua dan file transkrip/trajectory-nya.
3. Lanjutkan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi eviksi tetapi tidak mengubah penyimpanan/file.

Jalankan pemeliharaan sesuai kebutuhan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log run

Run cron terisolasi juga membuat entri/transkrip sesi, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

Saat cron memaksa pembuatan sesi run terisolasi baru, ia membersihkan entri sesi
`cron:<jobId>` sebelumnya sebelum menulis baris baru. Ia membawa preferensi aman
seperti pengaturan thinking/fast/verbose, label, dan override model/auth
yang dipilih pengguna secara eksplisit. Ia membuang konteks percakapan ambient seperti
perutean channel/grup, kebijakan kirim atau antrean, elevasi, origin, dan binding runtime ACP
agar run terisolasi baru tidak dapat mewarisi pengiriman usang atau
otoritas runtime dari run yang lebih lama.

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang Anda masuki (perutean + isolasi).

Pola umum:

- Chat utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali dioverride)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 AM waktu lokal di host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau lama `session.idleMinutes`) membuat `sessionId` baru saat pesan tiba setelah jendela idle. Saat harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.
- **Peristiwa sistem** (heartbeat, wakeup cron, notifikasi exec, bookkeeping gateway) dapat mengubah baris sesi tetapi tidak memperpanjang freshness reset harian/idle. Rollover reset membuang pemberitahuan peristiwa sistem yang diantrekan untuk sesi sebelumnya sebelum prompt baru dibuat.
- **Kebijakan fork induk** menggunakan cabang aktif Pi saat membuat thread atau fork subagen. Jika cabang itu terlalu besar, OpenClaw memulai anak dengan konteks terisolasi alih-alih gagal atau mewarisi riwayat yang tidak dapat digunakan. Kebijakan ukuran bersifat otomatis; konfigurasi lama `session.parentForkMaxTokens` dihapus oleh `openclaw doctor --fix`.

Detail implementasi: keputusan terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` di `src/config/sessions.ts`.

Field kunci (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` disetel)
- `sessionStartedAt`: timestamp mulai untuk `sessionId` saat ini; freshness reset harian
  menggunakan ini. Baris lama dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: timestamp interaksi pengguna/channel nyata terakhir; freshness reset idle
  menggunakan ini sehingga peristiwa heartbeat, cron, dan exec tidak menjaga sesi
  tetap hidup. Baris lama tanpa field ini fallback ke waktu mulai sesi yang dipulihkan
  untuk freshness idle.
- `updatedAt`: timestamp mutasi baris penyimpanan terakhir, digunakan untuk listing, pemangkasan, dan
  bookkeeping. Ini bukan otoritas untuk freshness reset harian/idle.
- `sessionFile`: override path transkrip eksplisit opsional
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
- `memoryFlushCompactionCount`: jumlah compaction saat flush terakhir berjalan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritas: ia dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` milik `@mariozechner/pi-coding-agent`.

File berbentuk JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, opsional `parentSession`)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Tipe entri penting:

- `message`: pesan user/assistant/toolResult
- `custom_message`: pesan yang diinjeksi ekstensi yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: status ekstensi yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan compaction persisten dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan persisten saat menavigasi cabang pohon

OpenClaw secara sengaja **tidak** “memperbaiki” transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dashboard)

Jika Anda menyesuaikan batas:

- Jendela konteks berasal dari katalog model (dan dapat dioverride melalui konfigurasi).
- `contextTokens` di penyimpanan adalah nilai estimasi/pelaporan runtime; jangan anggap sebagai jaminan ketat.

Untuk informasi lebih lanjut, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction meringkas percakapan lama ke dalam entri `compaction` persisten di transkrip dan mempertahankan pesan terbaru apa adanya.

Setelah compaction, giliran berikutnya melihat:

- Ringkasan compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk compaction dan pemasangan tool

Saat OpenClaw membagi transkrip panjang menjadi chunk compaction, ia menjaga
panggilan tool assistant tetap dipasangkan dengan entri `toolResult` yang sesuai.

- Jika split berdasarkan bagian token jatuh di antara panggilan tool dan hasilnya, OpenClaw
  menggeser batas ke pesan panggilan tool assistant alih-alih memisahkan
  pasangan tersebut.
- Jika blok tool-result di akhir sebaliknya akan mendorong chunk melewati target,
  OpenClaw mempertahankan blok tool tertunda tersebut dan menjaga tail yang belum diringkas
  tetap utuh.
- Blok panggilan tool yang dibatalkan/error tidak menahan split tertunda tetap terbuka.

---

## Kapan auto-compaction terjadi (runtime Pi)

Di agen Pi tertanam, auto-compaction dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan galat overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa yang dibentuk penyedia) → padatkan → coba lagi.
2. **Pemeliharaan ambang batas**: setelah giliran berhasil, ketika:

`contextTokens > contextWindow - reserveTokens`

Dengan:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan yang disisihkan untuk prompt + keluaran model berikutnya

Ini adalah semantik runtime Pi (OpenClaw memakai peristiwanya, tetapi Pi yang memutuskan kapan harus memadatkan).

OpenClaw juga dapat memicu Compaction lokal praterbang sebelum membuka run berikutnya
ketika `agents.defaults.compaction.maxActiveTranscriptBytes` diatur dan file
transkrip aktif mencapai ukuran tersebut. Ini adalah pelindung ukuran file untuk biaya
pembukaan ulang lokal, bukan pengarsipan mentah: OpenClaw tetap menjalankan Compaction semantik normal,
dan ini memerlukan `truncateAfterCompaction` agar ringkasan yang dipadatkan dapat menjadi
transkrip penerus baru.

Untuk run Pi tertanam, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
menambahkan pelindung tool-loop opsional. Setelah hasil alat ditambahkan dan sebelum
pemanggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika
anggaran praterbang yang sama dengan yang digunakan pada awal giliran. Jika konteks tidak lagi muat,
pelindung tidak memadatkan di dalam hook `transformContext` milik Pi. Pelindung ini memunculkan sinyal
praperiksa pertengahan giliran yang terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan
loop run luar menggunakan jalur pemulihan yang ada: memangkas hasil alat yang terlalu besar
ketika itu cukup, atau memicu mode Compaction yang dikonfigurasi dan mencoba lagi. Opsi
ini dinonaktifkan secara default dan berfungsi dengan mode Compaction `default` maupun `safeguard`,
termasuk Compaction safeguard yang didukung penyedia.
Ini independen dari `maxActiveTranscriptBytes`: pelindung ukuran byte berjalan
sebelum giliran dibuka, sementara praperiksa pertengahan giliran berjalan kemudian dalam tool
loop Pi tertanam setelah hasil alat baru ditambahkan.

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

OpenClaw juga memberlakukan batas bawah keamanan untuk run tertanam:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas bawah default adalah `20000` token.
- Atur `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika nilainya sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` yang eksplisit
  dan mempertahankan titik potong ekor terbaru Pi. Tanpa anggaran simpan yang eksplisit,
  Compaction manual tetap menjadi checkpoint keras dan konteks yang dibangun ulang dimulai dari
  ringkasan baru.
- Atur `agents.defaults.compaction.midTurnPrecheck.enabled: true` untuk menjalankan
  praperiksa tool-loop opsional setelah hasil alat baru dan sebelum pemanggilan model
  berikutnya. Ini hanya pemicu; pembuatan ringkasan tetap menggunakan jalur
  Compaction yang dikonfigurasi. Ini independen dari `maxActiveTranscriptBytes`, yang merupakan
  pelindung ukuran byte transkrip aktif pada awal giliran.
- Atur `agents.defaults.compaction.maxActiveTranscriptBytes` ke nilai byte atau
  string seperti `"20mb"` untuk menjalankan Compaction lokal sebelum giliran ketika transkrip
  aktif membesar. Pelindung ini aktif hanya ketika
  `truncateAfterCompaction` juga diaktifkan. Biarkan tidak diatur atau atur `0` untuk
  menonaktifkan.
- Ketika `agents.defaults.compaction.truncateAfterCompaction` diaktifkan,
  OpenClaw merotasi transkrip aktif ke JSONL penerus yang dipadatkan setelah
  Compaction. Transkrip penuh lama tetap diarsipkan dan ditautkan dari
  checkpoint Compaction, bukan ditulis ulang di tempat.

Alasan: sisakan ruang cadangan yang cukup untuk “pemeliharaan” multi-giliran (seperti penulisan memori) sebelum Compaction menjadi tidak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` di `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Penyedia Compaction yang dapat dipasang

Plugin dapat mendaftarkan penyedia Compaction melalui `registerCompactionProvider()` pada API plugin. Ketika `agents.defaults.compaction.provider` diatur ke id penyedia terdaftar, ekstensi safeguard mendelegasikan peringkasan ke penyedia tersebut, bukan ke pipeline bawaan `summarizeInStages`.

- `provider`: id Plugin penyedia Compaction terdaftar. Biarkan tidak diatur untuk peringkasan LLM default.
- Mengatur `provider` memaksa `mode: "safeguard"`.
- Penyedia menerima instruksi Compaction dan kebijakan pelestarian pengenal yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan konteks giliran terbaru dan sufiks giliran terpisah setelah keluaran penyedia.
- Peringkasan safeguard bawaan menyuling ulang ringkasan sebelumnya dengan pesan baru
  alih-alih mempertahankan ringkasan sebelumnya secara lengkap kata demi kata.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; atur
  `qualityGuard.enabled: false` untuk melewati perilaku coba lagi saat keluaran cacat.
- Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw otomatis kembali ke peringkasan LLM bawaan.
- Sinyal abort/timeout dilempar ulang (tidak ditelan) untuk menghormati pembatalan pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat pengguna

Anda dapat mengamati Compaction dan status sesi melalui:

- `/status` (di sesi obrolan mana pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah Compaction

---

## Pemeliharaan senyap (`NO_REPLY`)

OpenClaw mendukung giliran “senyap” untuk tugas latar belakang ketika pengguna tidak boleh melihat keluaran antara.

Konvensi:

- Asisten memulai keluarannya dengan token senyap persis `NO_REPLY` /
  `no_reply` untuk menandakan “jangan kirim balasan kepada pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar/kecil, jadi `NO_REPLY` dan
  `no_reply` sama-sama dihitung ketika seluruh payload hanya token senyap.
- Ini hanya untuk giliran latar belakang/tanpa-pengiriman yang sebenarnya; ini bukan jalan pintas untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Sejak `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** ketika
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan keluaran
parsial di tengah giliran.

---

## "Flush memori" pra-Compaction (diimplementasikan)

Tujuan: sebelum Compaction otomatis terjadi, jalankan giliran agentik senyap yang menulis state tahan lama
ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) sehingga Compaction tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang batas**:

1. Pantau penggunaan konteks sesi.
2. Ketika melewati “ambang lunak” (di bawah ambang Compaction Pi), jalankan direktif senyap
   “tulis memori sekarang” ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` agar pengguna tidak melihat
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
- Ketika `model` diatur, giliran flush menggunakan model tersebut tanpa mewarisi rantai
  fallback sesi aktif, sehingga pemeliharaan khusus lokal tidak diam-diam
  fallback ke model percakapan berbayar.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi Pi tertanam (backend CLI melewatinya).
- Flush dilewati ketika workspace sesi hanya-baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API ekstensi, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Kunci sesi salah? Mulai dari [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Ketidakcocokan store vs transkrip? Konfirmasi host Gateway dan jalur store dari `openclaw status`.
- Spam Compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` terlalu tinggi untuk jendela model dapat menyebabkan Compaction lebih awal)
  - pembengkakan hasil alat: aktifkan/sesuaikan pemangkasan sesi
- Giliran senyap bocor? Konfirmasi balasan dimulai dengan `NO_REPLY` (token persis tidak peka huruf besar/kecil) dan Anda menggunakan build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
