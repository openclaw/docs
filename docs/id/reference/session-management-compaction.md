---
read_when:
    - Anda perlu men-debug ID sesi, JSONL transkrip, atau bidang sessions.json
    - Anda sedang mengubah perilaku auto-Compaction atau menambahkan pemeliharaan “pre-Compaction”
    - Anda ingin menerapkan flush memori atau giliran sistem senyap
summary: 'Pendalaman: penyimpanan sesi + transkrip, siklus hidup, dan internal Compaction (otomatis)'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-05-02T20:59:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw mengelola sesi dari awal hingga akhir di area-area ini:

- **Perutean sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Higiene transkrip** (perbaikan khusus penyedia sebelum eksekusi)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (manual dan Compaction otomatis) serta tempat mengaitkan pekerjaan pra-Compaction
- **Pemeliharaan senyap** (penulisan memori yang tidak boleh menghasilkan keluaran yang terlihat oleh pengguna)

Jika Anda menginginkan gambaran umum tingkat tinggi terlebih dahulu, mulai dengan:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Ringkasan memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Higiene transkrip](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki status sesi.

- UI (aplikasi macOS, Control UI web, TUI) harus mengueri Gateway untuk daftar sesi dan jumlah token.
- Dalam mode jarak jauh, file sesi berada di host jarak jauh; “memeriksa file Mac lokal Anda” tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempertahankan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta kunci/nilai: `sessionKey -> SessionEntry`
   - Kecil, dapat berubah, aman untuk diedit (atau entri dihapus)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan aktual + pemanggilan alat + ringkasan Compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya
   - Checkpoint debug besar pra-Compaction dilewati setelah transkrip aktif
     melebihi batas ukuran checkpoint, sehingga menghindari salinan raksasa kedua
     `.checkpoint.*.jsonl`.

Pembaca riwayat Gateway harus menghindari mematerialkan seluruh transkrip kecuali
permukaan tersebut secara eksplisit memerlukan akses historis arbitrer. Riwayat
halaman pertama, riwayat chat tersemat, pemulihan restart, dan pemeriksaan
token/penggunaan memakai pembacaan ekor berbatas. Pemindaian transkrip penuh
melewati indeks transkrip asinkron, yang di-cache berdasarkan path file plus
`mtimeMs`/`size` dan dibagikan di antara pembaca konkuren.

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
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama dengan `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Penulisan Gateway normal mengalir melalui penulis sesi per penyimpanan yang menserialkan mutasi dalam proses tanpa mengambil kunci file runtime. Helper patch jalur panas meminjam cache mutable yang sudah divalidasi selama mereka memegang slot penulis itu, sehingga file `sessions.json` besar tidak dikloning atau dibaca ulang untuk setiap pembaruan metadata. Kode runtime sebaiknya memilih `updateSessionStore(...)` atau `updateSessionStoreEntry(...)`; penyimpanan seluruh store langsung adalah alat kompatibilitas dan pemeliharaan offline. Ketika Gateway dapat dijangkau, `openclaw sessions cleanup` dan `openclaw agents delete` non-dry-run mendelegasikan mutasi store ke Gateway agar pembersihan bergabung dengan antrean penulis yang sama; `--store <path>` adalah jalur perbaikan offline eksplisit untuk pemeliharaan file langsung. Pembersihan `maxEntries` tetap di-batch untuk batas seukuran produksi, sehingga store dapat sebentar melebihi batas yang dikonfigurasi sebelum pembersihan high-water berikutnya menulis ulangnya kembali turun. Pembacaan store sesi tidak memangkas atau membatasi entri selama startup Gateway; gunakan penulisan atau `openclaw sessions cleanup --enforce` untuk pembersihan. `openclaw sessions cleanup --enforce` tetap menerapkan batas yang dikonfigurasi segera.

Pemeliharaan mempertahankan pointer percakapan eksternal yang tahan lama seperti sesi grup
dan sesi chat berlingkup thread, tetapi entri runtime sintetis untuk cron, hook,
heartbeat, ACP, dan sub-agen masih dapat dihapus ketika melebihi
usia, jumlah, atau anggaran disk yang dikonfigurasi.

OpenClaw tidak lagi membuat backup rotasi `sessions.json.bak.*` otomatis selama penulisan Gateway. Kunci lama `session.maintenance.rotateBytes` diabaikan dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Mutasi transkrip menggunakan kunci tulis sesi pada file transkrip. Akuisisi kunci menunggu hingga
`session.writeLock.acquireTimeoutMs` sebelum menampilkan error sesi sibuk; default-nya adalah `60000`
ms. Naikkan ini hanya ketika pekerjaan persiapan, pembersihan, Compaction, atau mirror transkrip yang sah berkompetisi
lebih lama pada mesin lambat. Deteksi kunci usang dan peringatan durasi pegang maksimum tetap menjadi kebijakan terpisah.

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak arsip tertua, transkrip orphan, atau trajectory orphan terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua beserta file transkrip/trajectory-nya.
3. Teruskan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

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

Ketika cron memaksa pembuatan sesi eksekusi terisolasi baru, ia menyanitasi entri sesi
`cron:<jobId>` sebelumnya sebelum menulis baris baru. Ia membawa preferensi aman
seperti pengaturan thinking/fast/verbose, label, serta override model/auth yang
secara eksplisit dipilih pengguna. Ia membuang konteks percakapan ambient seperti
perutean channel/grup, kebijakan kirim atau antre, elevation, origin, dan binding
runtime ACP sehingga eksekusi terisolasi baru tidak dapat mewarisi pengiriman usang atau
otoritas runtime dari eksekusi lama.

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang sedang Anda masuki (perutean + isolasi).

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
- **Reset harian** (default pukul 4:00 AM waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau lama `session.idleMinutes`) membuat `sessionId` baru ketika pesan tiba setelah jendela idle. Ketika harian + idle sama-sama dikonfigurasi, mana pun yang kedaluwarsa lebih dahulu menang.
- **Event sistem** (Heartbeat, wakeup cron, notifikasi exec, pembukuan gateway) dapat memutasi baris sesi tetapi tidak memperpanjang kesegaran reset harian/idle. Rollover reset membuang notifikasi event sistem yang diantrekan untuk sesi sebelumnya sebelum prompt baru dibangun.
- **Kebijakan fork induk** menggunakan cabang aktif PI saat membuat thread atau fork subagen. Jika cabang itu terlalu besar, OpenClaw memulai child dengan konteks terisolasi alih-alih gagal atau mewarisi riwayat yang tidak dapat digunakan. Kebijakan sizing otomatis; konfigurasi lama `session.parentForkMaxTokens` dihapus oleh `openclaw doctor --fix`.

Detail implementasi: keputusan terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema store sesi (`sessions.json`)

Tipe nilai store adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field kunci (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` ditetapkan)
- `sessionStartedAt`: timestamp awal untuk `sessionId` saat ini; kesegaran reset harian
  menggunakan ini. Baris lama dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: timestamp interaksi pengguna/channel nyata terakhir; kesegaran reset idle
  menggunakan ini sehingga heartbeat, cron, dan event exec tidak menjaga sesi
  tetap hidup. Baris lama tanpa field ini fallback ke waktu mulai sesi yang dipulihkan
  untuk kesegaran idle.
- `updatedAt`: timestamp mutasi baris store terakhir, digunakan untuk listing, pemangkasan, dan
  pembukuan. Ini bukan otoritas untuk kesegaran reset harian/idle.
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
- `compactionCount`: seberapa sering Compaction otomatis selesai untuk kunci sesi ini
- `memoryFlushAt`: timestamp untuk flush memori pra-Compaction terakhir
- `memoryFlushCompactionCount`: jumlah Compaction saat flush terakhir berjalan

Store aman untuk diedit, tetapi Gateway adalah otoritas: ia dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` milik `@mariozechner/pi-coding-agent`.

File ini adalah JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, `parentSession` opsional)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Tipe entri penting:

- `message`: pesan user/assistant/toolResult
- `custom_message`: pesan yang disuntikkan extension yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: status extension yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan Compaction yang dipersistenkan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistenkan saat menavigasi cabang pohon

OpenClaw sengaja **tidak** “memperbaiki” transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung store sesi**: statistik berjalan yang ditulis ke `sessions.json` (digunakan untuk /status dan dasbor)

Jika Anda menyetel batas:

- Jendela konteks berasal dari katalog model (dan dapat ditimpa melalui konfigurasi).
- `contextTokens` dalam store adalah nilai estimasi/pelaporan runtime; jangan memperlakukannya sebagai jaminan ketat.

Untuk selengkapnya, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction meringkas percakapan lama ke dalam entri `compaction` yang dipersistenkan di transkrip dan mempertahankan pesan terbaru tetap utuh.

Setelah Compaction, giliran berikutnya melihat:

- Ringkasan Compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas potongan Compaction dan pemasangan tool

Saat OpenClaw membagi transkrip panjang menjadi potongan Compaction, OpenClaw menjaga pemanggilan tool asisten tetap dipasangkan dengan entri `toolResult` yang sesuai.

- Jika pemisahan berdasarkan porsi token jatuh di antara pemanggilan tool dan hasilnya, OpenClaw menggeser batas ke pesan pemanggilan tool asisten alih-alih memisahkan pasangan tersebut.
- Jika blok hasil tool di bagian akhir sebaliknya akan membuat potongan melampaui target, OpenClaw mempertahankan blok tool yang tertunda itu dan menjaga ekor yang belum diringkas tetap utuh.
- Blok pemanggilan tool yang dibatalkan/galat tidak membuat pemisahan tertunda tetap terbuka.

---

## Kapan auto-compaction terjadi (runtime Pi)

Di agen Pi tertanam, auto-compaction dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan galat overflow konteks (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa yang dibentuk penyedia) → compact → coba lagi.
2. **Pemeliharaan ambang batas**: setelah giliran berhasil, saat:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan yang disisihkan untuk prompt + keluaran model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event, tetapi Pi yang memutuskan kapan melakukan compact).

OpenClaw juga dapat memicu Compaction lokal preflight sebelum membuka run berikutnya saat `agents.defaults.compaction.maxActiveTranscriptBytes` ditetapkan dan file transkrip aktif mencapai ukuran tersebut. Ini adalah pelindung ukuran file untuk biaya pembukaan ulang lokal, bukan pengarsipan mentah: OpenClaw tetap menjalankan Compaction semantik normal, dan memerlukan `truncateAfterCompaction` agar ringkasan yang di-compact dapat menjadi transkrip penerus baru.

Untuk run Pi tertanam, `agents.defaults.compaction.midTurnPrecheck.enabled: true` menambahkan pelindung tool-loop opsional. Setelah hasil tool ditambahkan dan sebelum pemanggilan model berikutnya, OpenClaw memperkirakan tekanan prompt menggunakan logika anggaran preflight yang sama seperti saat awal giliran. Jika konteks tidak lagi muat, pelindung tidak melakukan compact di dalam hook `transformContext` milik Pi. Pelindung menaikkan sinyal precheck tengah-giliran terstruktur, menghentikan pengiriman prompt saat ini, dan membiarkan loop run luar memakai jalur pemulihan yang sudah ada: memangkas hasil tool yang terlalu besar saat itu cukup, atau memicu mode Compaction yang dikonfigurasi dan mencoba lagi. Opsi ini dinonaktifkan secara default dan bekerja dengan mode Compaction `default` maupun `safeguard`, termasuk Compaction safeguard yang didukung penyedia.
Ini independen dari `maxActiveTranscriptBytes`: pelindung ukuran byte berjalan sebelum giliran dibuka, sedangkan precheck tengah-giliran berjalan kemudian di tool loop Pi tertanam setelah hasil tool baru ditambahkan.

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
- Tetapkan `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika nilainya sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` yang eksplisit dan mempertahankan titik potong ekor terbaru Pi. Tanpa anggaran simpan eksplisit, Compaction manual tetap menjadi checkpoint keras dan konteks yang dibangun ulang dimulai dari ringkasan baru.
- Tetapkan `agents.defaults.compaction.midTurnPrecheck.enabled: true` untuk menjalankan precheck tool-loop opsional setelah hasil tool baru dan sebelum pemanggilan model berikutnya. Ini hanya pemicu; pembuatan ringkasan tetap memakai jalur Compaction yang dikonfigurasi. Ini independen dari `maxActiveTranscriptBytes`, yang merupakan pelindung ukuran byte transkrip aktif saat awal giliran.
- Tetapkan `agents.defaults.compaction.maxActiveTranscriptBytes` ke nilai byte atau string seperti `"20mb"` untuk menjalankan Compaction lokal sebelum giliran saat transkrip aktif menjadi besar. Pelindung ini aktif hanya ketika `truncateAfterCompaction` juga diaktifkan. Biarkan tidak disetel atau setel ke `0` untuk menonaktifkan.
- Saat `agents.defaults.compaction.truncateAfterCompaction` diaktifkan, OpenClaw merotasi transkrip aktif ke JSONL penerus yang di-compact setelah Compaction. Transkrip lengkap lama tetap diarsipkan dan ditautkan dari checkpoint Compaction alih-alih ditulis ulang di tempat.

Alasan: sisakan cukup ruang cadangan untuk “pemeliharaan” multi-giliran (seperti penulisan memori) sebelum Compaction menjadi tidak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` di `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Penyedia Compaction yang dapat dipasang

Plugin dapat mendaftarkan penyedia Compaction melalui `registerCompactionProvider()` pada API plugin. Saat `agents.defaults.compaction.provider` disetel ke id penyedia terdaftar, ekstensi safeguard mendelegasikan peringkasan ke penyedia tersebut alih-alih pipeline bawaan `summarizeInStages`.

- `provider`: id plugin penyedia Compaction terdaftar. Biarkan tidak disetel untuk peringkasan LLM default.
- Menyetel `provider` memaksa `mode: "safeguard"`.
- Penyedia menerima instruksi Compaction dan kebijakan pelestarian pengenal yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan konteks suffix giliran terbaru dan giliran terpisah setelah keluaran penyedia.
- Peringkasan safeguard bawaan menyuling ulang ringkasan sebelumnya dengan pesan baru alih-alih mempertahankan ringkasan sebelumnya secara utuh verbatim.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; setel `qualityGuard.enabled: false` untuk melewati perilaku coba-lagi-saat-keluaran-tidak-terbentuk-baik.
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

OpenClaw mendukung giliran “senyap” untuk tugas latar belakang ketika pengguna tidak boleh melihat keluaran perantara.

Konvensi:

- Asisten memulai keluarannya dengan token senyap persis `NO_REPLY` / `no_reply` untuk menunjukkan “jangan kirim balasan kepada pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar-kecil, jadi `NO_REPLY` dan `no_reply` keduanya dihitung ketika seluruh payload hanya token senyap.
- Ini hanya untuk giliran latar belakang/tanpa-pengiriman yang sebenarnya; ini bukan pintasan untuk permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** saat potongan parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan keluaran parsial di tengah giliran.

---

## "Flush memori" pra-Compaction (diimplementasikan)

Tujuan: sebelum auto-compaction terjadi, jalankan giliran agen senyap yang menulis state tahan lama ke disk (mis. `memory/YYYY-MM-DD.md` di workspace agen) agar Compaction tidak dapat menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang batas**:

1. Pantau penggunaan konteks sesi.
2. Saat melewati “ambang batas lunak” (di bawah ambang Compaction Pi), jalankan direktif “tulis memori sekarang” senyap ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` sehingga pengguna tidak melihat apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `model` (override penyedia/model persis opsional untuk giliran flush, misalnya `ollama/qwen3:8b`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan pengguna untuk giliran flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menekan pengiriman.
- Saat `model` disetel, giliran flush memakai model tersebut tanpa mewarisi rantai fallback sesi aktif, sehingga pemeliharaan lokal-saja tidak diam-diam fallback ke model percakapan berbayar.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush berjalan hanya untuk sesi Pi tertanam (backend CLI melewatinya).
- Flush dilewati saat workspace sesi hanya-baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API ekstensi, tetapi logika flush OpenClaw saat ini berada di sisi Gateway.

---

## Checklist pemecahan masalah

- Kunci sesi salah? Mulai dari [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Ketidakcocokan store vs transkrip? Konfirmasi host Gateway dan jalur store dari `openclaw status`.
- Spam Compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` terlalu tinggi untuk jendela model dapat menyebabkan Compaction lebih awal)
  - pembengkakan hasil tool: aktifkan/sesuaikan pruning sesi
- Giliran senyap bocor? Konfirmasi balasan dimulai dengan `NO_REPLY` (token persis tidak peka huruf besar-kecil) dan Anda memakai build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pruning sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
