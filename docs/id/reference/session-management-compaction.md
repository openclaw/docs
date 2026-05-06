---
read_when:
    - Anda perlu menelusuri masalah pada ID sesi, transkrip JSONL, atau bidang sessions.json
    - Anda sedang mengubah perilaku Compaction otomatis atau menambahkan pemeliharaan rutin "pra-Compaction"
    - Anda ingin mengimplementasikan pengosongan memori atau giliran sistem senyap
summary: 'Pembahasan mendalam: penyimpanan sesi + transkrip, siklus hidup, dan internal Compaction (otomatis)'
title: Pembahasan mendalam tentang manajemen sesi
x-i18n:
    generated_at: "2026-05-06T09:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw mengelola sesi secara menyeluruh di area berikut:

- **Perutean sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Kebersihan transkrip** (perbaikan khusus penyedia sebelum eksekusi)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (Compaction manual dan otomatis) dan tempat mengaitkan pekerjaan pra-Compaction
- **Pemeliharaan senyap** (penulisan memori yang tidak boleh menghasilkan output yang terlihat pengguna)

Jika Anda ingin gambaran tingkat tinggi terlebih dahulu, mulai dari:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Gambaran umum memori](/id/concepts/memory)
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
   - Kecil, dapat berubah, aman untuk diedit (atau entri dihapus)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan aktual + panggilan alat + ringkasan Compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya
   - Titik pemeriksaan debug besar pra-Compaction dilewati setelah transkrip
     aktif melebihi batas ukuran titik pemeriksaan, sehingga menghindari salinan
     `.checkpoint.*.jsonl` raksasa kedua.

Pembaca riwayat Gateway sebaiknya menghindari mematerialkan seluruh transkrip kecuali
permukaannya secara eksplisit membutuhkan akses historis arbitrer. Riwayat halaman pertama,
riwayat chat tersemat, pemulihan restart, dan pemeriksaan token/penggunaan memakai pembacaan
ekor yang terbatas. Pemindaian transkrip penuh melalui indeks transkrip asinkron, yang
di-cache berdasarkan path file plus `mtimeMs`/`size` dan dibagikan di antara pembaca bersamaan.

---

## Lokasi di disk

Per agen, pada host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw menyelesaikan ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json`, artefak transkrip, dan sidecar trajektori:

- `mode`: `warn` (default) atau `enforce`
- `pruneAfter`: batas usia entri basi (default `30d`)
- `maxEntries`: batas entri dalam `sessions.json` (default `500`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama seperti `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Penulisan normal Gateway mengalir melalui penulis sesi per penyimpanan yang menserialkan mutasi dalam proses tanpa mengambil kunci file runtime. Helper patch jalur panas meminjam cache mutable yang sudah divalidasi saat memegang slot penulis tersebut, sehingga file `sessions.json` besar tidak dikloning atau dibaca ulang untuk setiap pembaruan metadata. Kode runtime sebaiknya memakai `updateSessionStore(...)` atau `updateSessionStoreEntry(...)`; penyimpanan seluruh store langsung adalah alat kompatibilitas dan pemeliharaan offline. Saat Gateway dapat dijangkau, `openclaw sessions cleanup` dan `openclaw agents delete` non-dry-run mendelegasikan mutasi store ke Gateway sehingga pembersihan bergabung ke antrean penulis yang sama; `--store <path>` adalah jalur perbaikan offline eksplisit untuk pemeliharaan file langsung. Pembersihan `maxEntries` tetap dibatch untuk batas ukuran produksi, sehingga suatu store dapat sebentar melampaui batas yang dikonfigurasi sebelum pembersihan high-water berikutnya menulisnya kembali turun. Pembacaan store sesi tidak memangkas atau membatasi entri selama startup Gateway; gunakan penulisan atau `openclaw sessions cleanup --enforce` untuk pembersihan. `openclaw sessions cleanup --enforce` tetap menerapkan batas yang dikonfigurasi segera dan memangkas artefak transkrip, titik pemeriksaan, dan trajektori lama yang tidak direferensikan meskipun tidak ada anggaran disk yang dikonfigurasi.

Pemeliharaan mempertahankan pointer percakapan eksternal yang tahan lama seperti sesi grup
dan sesi chat bercakupan thread, tetapi entri runtime sintetis untuk cron, hook,
heartbeat, ACP, dan sub-agen masih dapat dihapus ketika melebihi anggaran
usia, jumlah, atau disk yang dikonfigurasi.

OpenClaw tidak lagi membuat cadangan rotasi `sessions.json.bak.*` otomatis selama penulisan Gateway. Kunci lama `session.maintenance.rotateBytes` diabaikan dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Mutasi transkrip memakai kunci tulis sesi pada file transkrip. Akuisisi kunci menunggu hingga
`session.writeLock.acquireTimeoutMs` sebelum menampilkan error sesi sibuk; defaultnya adalah `60000`
ms. Naikkan ini hanya ketika pekerjaan persiapan, pembersihan, Compaction, atau mirror transkrip yang sah bersaing
lebih lama pada mesin lambat. Deteksi kunci basi dan peringatan durasi penahanan maksimum tetap menjadi kebijakan terpisah.

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak arsip, transkrip yatim, atau trajektori yatim tertua terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua beserta file transkrip/trajektorinya.
3. Lanjutkan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi pengeluaran tetapi tidak memutasi store/file.

Jalankan pemeliharaan sesuai kebutuhan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log eksekusi

Eksekusi cron terisolasi juga membuat entri/transkrip sesi, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi eksekusi cron terisolasi lama dari store sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

Ketika cron memaksa pembuatan sesi eksekusi terisolasi baru, ia membersihkan entri sesi
`cron:<jobId>` sebelumnya sebelum menulis baris baru. Ia membawa preferensi aman
seperti pengaturan berpikir/cepat/verbose, label, dan override model/auth yang
dipilih pengguna secara eksplisit. Ia membuang konteks percakapan sekitar seperti
perutean channel/grup, kebijakan kirim atau antrean, elevasi, asal, dan binding
runtime ACP sehingga eksekusi terisolasi baru tidak dapat mewarisi otoritas pengiriman atau
runtime basi dari eksekusi lama.

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

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default 4:00 AM waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa karena idle** (`session.reset.idleMinutes` atau `session.idleMinutes` lama) membuat `sessionId` baru ketika pesan tiba setelah jendela idle. Ketika harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu menang.
- **Peristiwa sistem** (heartbeat, wakeup cron, notifikasi exec, pembukuan gateway) dapat memutasi baris sesi tetapi tidak memperpanjang kesegaran reset harian/idle. Rollover reset membuang pemberitahuan peristiwa sistem yang diantrekan untuk sesi sebelumnya sebelum prompt segar dibangun.
- **Kebijakan fork induk** memakai cabang aktif Pi saat membuat fork thread atau subagen. Jika cabang itu terlalu besar, OpenClaw memulai anak dengan konteks terisolasi alih-alih gagal atau mewarisi riwayat yang tidak dapat digunakan. Kebijakan ukuran otomatis; konfigurasi lama `session.parentForkMaxTokens` dihapus oleh `openclaw doctor --fix`.

Detail implementasi: keputusan terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema store sesi (`sessions.json`)

Tipe nilai store adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field kunci (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` disetel)
- `sessionStartedAt`: timestamp mulai untuk `sessionId` saat ini; kesegaran reset harian
  menggunakan ini. Baris lama dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: timestamp interaksi pengguna/channel nyata terakhir; kesegaran reset idle
  menggunakan ini sehingga heartbeat, cron, dan peristiwa exec tidak menjaga sesi
  tetap hidup. Baris lama tanpa field ini memakai fallback ke waktu mulai sesi yang dipulihkan
  untuk kesegaran idle.
- `updatedAt`: timestamp mutasi baris store terakhir, digunakan untuk daftar, pemangkasan, dan
  pembukuan. Ini bukan otoritas untuk kesegaran reset harian/idle.
- `sessionFile`: override path transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan kirim)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (upaya terbaik / bergantung penyedia):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering Compaction otomatis selesai untuk kunci sesi ini
- `memoryFlushAt`: timestamp untuk flush memori pra-Compaction terakhir
- `memoryFlushCompactionCount`: jumlah Compaction saat flush terakhir berjalan

Store aman diedit, tetapi Gateway adalah otoritasnya: ia dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` milik `@mariozechner/pi-coding-agent`.

File berupa JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, `parentSession` opsional)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Tipe entri penting:

- `message`: pesan pengguna/asisten/toolResult
- `custom_message`: pesan yang disuntikkan ekstensi yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: status ekstensi yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan Compaction yang dipersistenkan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistenkan saat menavigasi cabang pohon

OpenClaw secara sengaja **tidak** "memperbaiki" transkrip; Gateway memakai `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung store sesi**: statistik berjalan yang ditulis ke `sessions.json` (digunakan untuk /status dan dasbor)

Jika Anda menyetel batas:

- Jendela konteks berasal dari katalog model (dan dapat dioverride melalui konfigurasi).
- `contextTokens` dalam store adalah nilai estimasi/pelaporan runtime; jangan perlakukan sebagai jaminan ketat.

Untuk selengkapnya, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction merangkum percakapan lama ke dalam entri `compaction` yang dipersistenkan dalam transkrip dan menjaga pesan terbaru tetap utuh.

Setelah Compaction, giliran berikutnya melihat:

- Ringkasan Compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk Compaction dan pemasangan alat

Saat OpenClaw membagi transkrip panjang menjadi chunk Compaction, OpenClaw tetap
memasangkan panggilan alat asisten dengan entri `toolResult` yang sesuai.

- Jika pemisahan berbasis porsi token jatuh di antara panggilan alat dan hasilnya, OpenClaw
  menggeser batas ke pesan panggilan alat asisten alih-alih memisahkan
  pasangan tersebut.
- Jika blok hasil alat di akhir seharusnya membuat chunk melewati target,
  OpenClaw mempertahankan blok alat yang tertunda tersebut dan membiarkan ekor yang belum diringkas
  tetap utuh.
- Blok panggilan alat yang dibatalkan/galat tidak menahan pemisahan tertunda tetap terbuka.

---

## Kapan auto-Compaction terjadi (runtime Pi)

Di agen Pi tersemat, auto-Compaction dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan galat overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa yang dibentuk oleh penyedia) → lakukan Compaction → coba lagi.
2. **Pemeliharaan ambang batas**: setelah giliran berhasil, saat:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan yang disisihkan untuk prompt + keluaran model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi peristiwanya, tetapi Pi menentukan kapan melakukan Compaction).

OpenClaw juga dapat memicu Compaction lokal preflight sebelum membuka run berikutnya
saat `agents.defaults.compaction.maxActiveTranscriptBytes` diatur dan file
transkrip aktif mencapai ukuran tersebut. Ini adalah pelindung ukuran file untuk biaya
pembukaan ulang lokal, bukan pengarsipan mentah: OpenClaw tetap menjalankan Compaction semantik normal,
dan memerlukan `truncateAfterCompaction` agar ringkasan yang telah di-Compaction dapat menjadi
transkrip penerus baru.

Untuk run Pi tersemat, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
menambahkan pelindung loop alat opsional. Setelah hasil alat ditambahkan dan sebelum
panggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika
anggaran preflight yang sama dengan yang digunakan saat awal giliran. Jika konteks tidak lagi muat,
pelindung tidak melakukan Compaction di dalam hook `transformContext` milik Pi. Pelindung ini memunculkan sinyal
precheck pertengahan giliran yang terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan
loop run luar menggunakan jalur pemulihan yang ada: memangkas hasil alat yang terlalu besar
saat itu cukup, atau memicu mode Compaction yang dikonfigurasi dan mencoba lagi. Opsi ini
dinonaktifkan secara default dan bekerja dengan mode Compaction `default` maupun `safeguard`,
termasuk Compaction safeguard yang didukung penyedia.
Ini independen dari `maxActiveTranscriptBytes`: pelindung ukuran byte berjalan
sebelum giliran dibuka, sedangkan precheck pertengahan giliran berjalan kemudian dalam loop alat Pi tersemat
setelah hasil alat baru ditambahkan.

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

OpenClaw juga memberlakukan batas bawah keamanan untuk run tersemat:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas bawah default adalah `20000` token.
- Atur `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika nilainya sudah lebih tinggi, OpenClaw membiarkannya apa adanya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` eksplisit
  dan mempertahankan titik pemotongan ekor terbaru milik Pi. Tanpa anggaran simpan eksplisit,
  Compaction manual tetap menjadi checkpoint keras dan konteks yang dibangun ulang dimulai dari
  ringkasan baru.
- Atur `agents.defaults.compaction.midTurnPrecheck.enabled: true` untuk menjalankan
  precheck loop alat opsional setelah hasil alat baru dan sebelum panggilan model berikutnya.
  Ini hanya pemicu; pembuatan ringkasan tetap menggunakan jalur Compaction yang dikonfigurasi.
  Ini independen dari `maxActiveTranscriptBytes`, yang merupakan pelindung ukuran byte
  transkrip aktif saat awal giliran.
- Atur `agents.defaults.compaction.maxActiveTranscriptBytes` ke nilai byte atau
  string seperti `"20mb"` untuk menjalankan Compaction lokal sebelum giliran saat
  transkrip aktif menjadi besar. Pelindung ini aktif hanya saat
  `truncateAfterCompaction` juga diaktifkan. Biarkan tidak diatur atau atur `0` untuk
  menonaktifkan.
- Saat `agents.defaults.compaction.truncateAfterCompaction` diaktifkan,
  OpenClaw merotasi transkrip aktif menjadi JSONL penerus yang telah di-Compaction setelah
  Compaction. Transkrip penuh lama tetap diarsipkan dan ditautkan dari
  checkpoint Compaction alih-alih ditulis ulang di tempat.

Alasan: menyisakan ruang cadangan yang cukup untuk "pemeliharaan" multi-giliran (seperti penulisan memori) sebelum Compaction menjadi tidak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` di `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Penyedia Compaction yang dapat dipasang

Plugin dapat mendaftarkan penyedia Compaction melalui `registerCompactionProvider()` pada API Plugin. Saat `agents.defaults.compaction.provider` diatur ke id penyedia terdaftar, ekstensi safeguard mendelegasikan peringkasan ke penyedia tersebut alih-alih pipeline bawaan `summarizeInStages`.

- `provider`: id Plugin penyedia Compaction terdaftar. Biarkan tidak diatur untuk peringkasan LLM default.
- Mengatur `provider` memaksa `mode: "safeguard"`.
- Penyedia menerima instruksi Compaction dan kebijakan pelestarian pengenal yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan konteks akhiran giliran terbaru dan giliran terpisah setelah keluaran penyedia.
- Peringkasan safeguard bawaan menyuling ulang ringkasan sebelumnya dengan pesan baru
  alih-alih mempertahankan ringkasan penuh sebelumnya secara verbatim.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; atur
  `qualityGuard.enabled: false` untuk melewati perilaku coba ulang saat keluaran cacat.
- Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw otomatis kembali ke peringkasan LLM bawaan.
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

## Pemeliharaan senyap (`NO_REPLY`)

OpenClaw mendukung giliran "senyap" untuk tugas latar belakang saat pengguna tidak boleh melihat keluaran antara.

Konvensi:

- Asisten memulai keluarannya dengan token senyap persis `NO_REPLY` /
  `no_reply` untuk menunjukkan "jangan kirim balasan ke pengguna".
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar-kecil, jadi `NO_REPLY` dan
  `no_reply` sama-sama dihitung saat seluruh payload hanya berisi token senyap.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang sesungguhnya; ini bukan pintasan untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** saat
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan keluaran
parsial di tengah giliran.

---

## "Flush memori" pra-Compaction (diimplementasikan)

Tujuan: sebelum auto-Compaction terjadi, jalankan giliran agentic senyap yang menulis status tahan lama
ke disk (misalnya `memory/YYYY-MM-DD.md` di ruang kerja agen) sehingga Compaction tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang batas**:

1. Pantau penggunaan konteks sesi.
2. Saat melewati "ambang batas lunak" (di bawah ambang batas Compaction Pi), jalankan direktif senyap
   "tulis memori sekarang" ke agen.
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
- Saat `model` diatur, giliran flush menggunakan model tersebut tanpa mewarisi
  rantai fallback sesi aktif, sehingga pemeliharaan lokal saja tidak diam-diam
  kembali ke model percakapan berbayar.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush berjalan hanya untuk sesi Pi tersemat (backend CLI melewatinya).
- Flush dilewati saat ruang kerja sesi bersifat baca-saja (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file ruang kerja dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API ekstensi, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Kunci sesi salah? Mulai dengan [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Store vs transkrip tidak cocok? Konfirmasi host Gateway dan path store dari `openclaw status`.
- Spam Compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` terlalu tinggi untuk jendela model dapat menyebabkan Compaction lebih awal)
  - pembengkakan hasil alat: aktifkan/sesuaikan pemangkasan sesi
- Giliran senyap bocor? Konfirmasi balasan dimulai dengan `NO_REPLY` (token persis tidak peka huruf besar-kecil) dan Anda memakai build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
