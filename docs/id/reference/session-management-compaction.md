---
read_when:
    - Anda perlu men-debug ID sesi, transkrip JSONL, atau bidang sessions.json
    - Anda mengubah perilaku auto-Compaction atau menambahkan pemeliharaan “pre-Compaction”
    - Anda ingin mengimplementasikan pengosongan memori atau giliran sistem senyap
summary: 'Pembahasan mendalam: penyimpanan sesi + transkrip, siklus hidup, dan internal (otomatis)Compaction'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-04-30T16:30:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw mengelola sesi end-to-end di seluruh area ini:

- **Perutean sesi** (cara pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Kebersihan transkrip** (perbaikan khusus penyedia sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (manual dan auto-compaction) dan tempat mengaitkan pekerjaan pra-compaction
- **Housekeeping senyap** (penulisan memori yang tidak boleh menghasilkan output yang terlihat pengguna)

Jika Anda ingin ikhtisar tingkat lebih tinggi terlebih dahulu, mulai dengan:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Kebersihan transkrip](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki state sesi.

- UI (aplikasi macOS, Control UI web, TUI) harus mengueri Gateway untuk daftar sesi dan jumlah token.
- Dalam mode jarak jauh, file sesi berada di host jarak jauh; “memeriksa file Mac lokal Anda” tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempertahankan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta key/value: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan aktual + pemanggilan alat + ringkasan compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya
   - Checkpoint debug pra-compaction yang besar dilewati setelah transkrip aktif
     melebihi batas ukuran checkpoint, sehingga menghindari salinan `.checkpoint.*.jsonl`
     raksasa kedua.

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
- `pruneAfter`: batas usia entri stale (default `30d`)
- `maxEntries`: batas entri dalam `sessions.json` (default `500`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama dengan `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Penulisan Gateway normal melakukan batch pembersihan `maxEntries` untuk batas berukuran produksi, sehingga penyimpanan mungkin sebentar melebihi batas yang dikonfigurasi sebelum pembersihan high-water berikutnya menulis ulangnya kembali ke bawah. `openclaw sessions cleanup --enforce` tetap menerapkan batas yang dikonfigurasi secara langsung.

OpenClaw tidak lagi membuat backup rotasi `sessions.json.bak.*` otomatis selama penulisan Gateway. Kunci lama `session.maintenance.rotateBytes` diabaikan dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak arsip, transkrip yatim, atau trajectory yatim yang paling lama terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua beserta file transkrip/trajectory-nya.
3. Lanjutkan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi eviction tetapi tidak mengubah penyimpanan/file.

Jalankan pemeliharaan sesuai kebutuhan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log run

Run cron terisolasi juga membuat entri sesi/transkrip, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

Ketika cron memaksa pembuatan sesi run terisolasi baru, ia membersihkan entri sesi
`cron:<jobId>` sebelumnya sebelum menulis baris baru. Ia membawa preferensi aman
seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang
dipilih pengguna secara eksplisit. Ia membuang konteks percakapan sekitar seperti
perutean channel/grup, kebijakan kirim atau antrean, elevation, origin, dan binding
runtime ACP sehingga run terisolasi baru tidak dapat mewarisi pengiriman atau
otoritas runtime stale dari run yang lebih lama.

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ tempat Anda berada (perutean + isolasi).

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
- **Reset harian** (default pukul 4:00 AM waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau legacy `session.idleMinutes`) membuat `sessionId` baru ketika pesan tiba setelah jendela idle. Ketika harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu menang.
- **Event sistem** (Heartbeat, wakeup cron, notifikasi exec, bookkeeping gateway) dapat mengubah baris sesi tetapi tidak memperpanjang kesegaran reset harian/idle. Rollover reset membuang pemberitahuan event sistem yang diantrekan untuk sesi sebelumnya sebelum prompt baru dibangun.
- **Pelindung fork parent thread** (`session.parentForkMaxTokens`, default `100000`) melewati forking transkrip parent ketika sesi parent sudah terlalu besar; thread baru dimulai segar. Setel `0` untuk menonaktifkan.

Detail implementasi: keputusan terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field kunci (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` disetel)
- `sessionStartedAt`: timestamp mulai untuk `sessionId` saat ini; kesegaran reset harian
  menggunakan ini. Baris legacy dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: timestamp interaksi pengguna/channel nyata terakhir; kesegaran reset
  idle menggunakan ini sehingga Heartbeat, cron, dan event exec tidak membuat sesi
  tetap hidup. Baris legacy tanpa field ini fallback ke waktu mulai sesi yang dipulihkan
  untuk kesegaran idle.
- `updatedAt`: timestamp mutasi baris penyimpanan terakhir, digunakan untuk listing, pemangkasan, dan
  bookkeeping. Ini bukan otoritas untuk kesegaran reset harian/idle.
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

File ini adalah JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, `parentSession` opsional)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Tipe entri penting:

- `message`: pesan pengguna/asisten/toolResult
- `custom_message`: pesan yang diinjeksi ekstensi yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: state ekstensi yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan compaction yang dipertahankan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipertahankan saat menavigasi cabang pohon

OpenClaw sengaja **tidak** “memperbaiki” transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik rolling yang ditulis ke `sessions.json` (digunakan untuk /status dan dasbor)

Jika Anda menyetel batas:

- Jendela konteks berasal dari katalog model (dan dapat dioverride melalui konfigurasi).
- `contextTokens` dalam penyimpanan adalah nilai estimasi/pelaporan runtime; jangan memperlakukannya sebagai jaminan ketat.

Untuk selengkapnya, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction merangkum percakapan lama ke dalam entri `compaction` yang dipertahankan dalam transkrip dan menjaga pesan terbaru tetap utuh.

Setelah compaction, giliran berikutnya melihat:

- Ringkasan compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk Compaction dan pemasangan tool

Ketika OpenClaw membagi transkrip panjang menjadi chunk compaction, ia menjaga
pemanggilan tool asisten tetap berpasangan dengan entri `toolResult` yang cocok.

- Jika split token-share jatuh di antara pemanggilan tool dan hasilnya, OpenClaw
  menggeser batas ke pesan pemanggilan tool asisten alih-alih memisahkan
  pasangan tersebut.
- Jika blok tool-result trailing seharusnya mendorong chunk melewati target,
  OpenClaw mempertahankan blok tool yang tertunda tersebut dan menjaga tail yang
  belum diringkas tetap utuh.
- Blok pemanggilan tool yang dibatalkan/error tidak menahan split tertunda tetap terbuka.

---

## Kapan auto-compaction terjadi (runtime Pi)

Dalam agen Pi tersemat, auto-compaction terpicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan error overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa berbentuk penyedia) → compact → coba lagi.
2. **Pemeliharaan threshold**: setelah giliran berhasil, ketika:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan yang disisihkan untuk prompt + output model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event, tetapi Pi memutuskan kapan melakukan compaction).

OpenClaw juga dapat memicu compaction lokal preflight sebelum membuka run berikutnya
ketika `agents.defaults.compaction.maxActiveTranscriptBytes` disetel dan file
transkrip aktif mencapai ukuran tersebut. Ini adalah pelindung ukuran file untuk
biaya pembukaan ulang lokal, bukan pengarsipan mentah: OpenClaw tetap menjalankan
compaction semantik normal, dan memerlukan `truncateAfterCompaction` agar ringkasan
yang telah dipadatkan dapat menjadi transkrip penerus baru.

Untuk eksekusi Pi tertanam, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
menambahkan guard tool-loop yang bersifat opt-in. Setelah hasil tool ditambahkan dan sebelum
pemanggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika anggaran
preflight yang sama seperti yang digunakan di awal giliran. Jika konteks tidak lagi muat, guard
tidak melakukan Compaction di dalam hook `transformContext` Pi. Guard tersebut memunculkan sinyal
precheck tengah-giliran terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan
loop eksekusi luar menggunakan jalur pemulihan yang sudah ada: memangkas hasil tool yang terlalu besar
jika itu cukup, atau memicu mode Compaction yang dikonfigurasi dan mencoba lagi. Opsi ini
dinonaktifkan secara default dan bekerja dengan mode Compaction `default` maupun `safeguard`,
termasuk Compaction safeguard yang didukung provider.
Ini independen dari `maxActiveTranscriptBytes`: guard ukuran byte berjalan
sebelum sebuah giliran dibuka, sementara precheck tengah-giliran berjalan kemudian di tool loop Pi tertanam
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

OpenClaw juga memberlakukan batas bawah keamanan untuk eksekusi tertanam:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas bawah default adalah `20000` token.
- Atur `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika nilainya sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` eksplisit
  dan mempertahankan titik pemotongan ekor terbaru Pi. Tanpa anggaran simpan eksplisit,
  Compaction manual tetap menjadi checkpoint keras dan konteks yang dibangun ulang dimulai dari
  ringkasan baru.
- Atur `agents.defaults.compaction.midTurnPrecheck.enabled: true` untuk menjalankan
  precheck tool-loop opsional setelah hasil tool baru dan sebelum pemanggilan model berikutnya.
  Ini hanya pemicu; pembuatan ringkasan tetap menggunakan jalur Compaction yang dikonfigurasi.
  Ini independen dari `maxActiveTranscriptBytes`, yang merupakan guard ukuran byte
  transkrip aktif di awal giliran.
- Atur `agents.defaults.compaction.maxActiveTranscriptBytes` ke nilai byte atau
  string seperti `"20mb"` untuk menjalankan Compaction lokal sebelum giliran ketika transkrip aktif
  menjadi besar. Guard ini aktif hanya ketika
  `truncateAfterCompaction` juga diaktifkan. Biarkan tidak diatur atau atur `0` untuk
  menonaktifkan.
- Ketika `agents.defaults.compaction.truncateAfterCompaction` diaktifkan,
  OpenClaw merotasi transkrip aktif ke JSONL penerus yang sudah dipadatkan setelah
  Compaction. Transkrip lengkap lama tetap diarsipkan dan ditautkan dari
  checkpoint Compaction alih-alih ditulis ulang di tempat.

Alasan: menyisakan cukup ruang untuk “housekeeping” multi-giliran (seperti penulisan memori) sebelum Compaction menjadi tidak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` di `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Provider Compaction yang dapat dipasang

Plugin dapat mendaftarkan provider Compaction melalui `registerCompactionProvider()` pada API plugin. Ketika `agents.defaults.compaction.provider` diatur ke id provider terdaftar, ekstensi safeguard mendelegasikan peringkasan ke provider tersebut alih-alih pipeline bawaan `summarizeInStages`.

- `provider`: id dari plugin provider Compaction terdaftar. Biarkan tidak diatur untuk peringkasan LLM default.
- Mengatur `provider` memaksa `mode: "safeguard"`.
- Provider menerima instruksi Compaction dan kebijakan pelestarian pengenal yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan konteks akhiran giliran-terbaru dan giliran-terbagi setelah output provider.
- Peringkasan safeguard bawaan menyaring ulang ringkasan sebelumnya dengan pesan baru
  alih-alih mempertahankan ringkasan sebelumnya secara verbatim.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; atur
  `qualityGuard.enabled: false` untuk melewati perilaku coba-ulang-pada-output-cacat.
- Jika provider gagal atau mengembalikan hasil kosong, OpenClaw otomatis kembali ke peringkasan LLM bawaan.
- Sinyal abort/timeout dilempar ulang (tidak ditelan) untuk menghormati pembatalan pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat pengguna

Anda dapat mengamati Compaction dan status sesi melalui:

- `/status` (di sesi chat apa pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah Compaction

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung giliran “senyap” untuk tugas latar belakang ketika pengguna tidak seharusnya melihat output antara.

Konvensi:

- Asisten memulai outputnya dengan token senyap persis `NO_REPLY` /
  `no_reply` untuk menunjukkan “jangan kirim balasan kepada pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar-kecil, jadi `NO_REPLY` dan
  `no_reply` keduanya dihitung ketika seluruh payload hanyalah token senyap.
- Ini hanya untuk giliran latar belakang/tanpa-pengiriman sungguhan; ini bukan jalan pintas untuk
  permintaan pengguna yang dapat ditindaklanjuti biasa.

Sejak `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** ketika
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan output parsial
di tengah giliran.

---

## "Flush memori" pra-Compaction (diimplementasikan)

Tujuan: sebelum Compaction otomatis terjadi, jalankan giliran agentik senyap yang menulis status tahan lama
ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) sehingga Compaction tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang**:

1. Pantau penggunaan konteks sesi.
2. Ketika melewati “ambang lunak” (di bawah ambang Compaction Pi), jalankan direktif senyap
   “tulis memori sekarang” kepada agen.
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
- Ketika `model` diatur, giliran flush menggunakan model tersebut tanpa mewarisi
  rantai fallback sesi aktif, sehingga housekeeping khusus lokal tidak diam-diam
  fallback ke model percakapan berbayar.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi Pi tertanam (backend CLI melewatinya).
- Flush dilewati ketika workspace sesi bersifat hanya-baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API ekstensi, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Kunci sesi salah? Mulai dengan [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Ketidakcocokan store vs transkrip? Konfirmasi host Gateway dan jalur store dari `openclaw status`.
- Spam Compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` terlalu tinggi untuk jendela model dapat menyebabkan Compaction lebih awal)
  - pembengkakan hasil tool: aktifkan/sesuaikan pemangkasan sesi
- Giliran senyap bocor? Konfirmasi balasan dimulai dengan `NO_REPLY` (token persis tidak peka huruf besar-kecil) dan Anda menggunakan build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
