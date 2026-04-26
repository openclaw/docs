---
read_when:
    - Anda perlu men-debug ID sesi, JSONL transkrip, atau field `sessions.json`
    - Anda sedang mengubah perilaku Compaction otomatis atau menambahkan housekeeping “pra-Compaction”
    - Anda ingin mengimplementasikan flush memori atau giliran sistem senyap
summary: 'Pendalaman: penyimpanan sesi + transkrip, siklus hidup, dan internal Compaction (otomatis)'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-04-26T11:38:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Halaman ini menjelaskan bagaimana OpenClaw mengelola sesi secara end-to-end:

- **Perutean sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacak
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Higiene transkrip** (perbaikan khusus penyedia sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (Compaction manual + otomatis) dan tempat mengaitkan pekerjaan pra-Compaction
- **Housekeeping senyap** (mis. penulisan memori yang tidak boleh menghasilkan output yang terlihat oleh pengguna)

Jika Anda ingin gambaran tingkat tinggi terlebih dahulu, mulai dari:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Higiene transkrip](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki state sesi.

- UI (aplikasi macOS, web Control UI, TUI) harus melakukan query ke Gateway untuk daftar sesi dan jumlah token.
- Dalam mode remote, file sesi berada di host remote; “memeriksa file Mac lokal Anda” tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempertahankan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta key/value: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan aktual + pemanggilan tool + ringkasan Compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya

---

## Lokasi di disk

Per agen, pada host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw menyelesaikan ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json` dan artefak transkrip:

- `mode`: `warn` (default) atau `enforce`
- `pruneAfter`: batas usia entri usang (default `30d`)
- `maxEntries`: batas jumlah entri dalam `sessions.json` (default `500`)
- `rotateBytes`: rotasi `sessions.json` saat terlalu besar (default `10mb`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama seperti `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran opsional untuk direktori sesi
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Urutan enforcement untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak transkrip arsip atau yatim yang paling lama terlebih dahulu.
2. Jika masih di atas target, evict entri sesi terlama dan file transkripnya.
3. Lanjutkan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi eviction tetapi tidak mengubah penyimpanan/file.

Jalankan pemeliharaan sesuai permintaan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log run

Run Cron yang terisolasi juga membuat entri/transkrip sesi, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run Cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

Saat Cron memaksa pembuatan sesi run terisolasi baru, ia membersihkan entri sesi `cron:<jobId>` sebelumnya sebelum menulis baris baru. Ia membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit. Ia membuang konteks percakapan ambien seperti perutean channel/group, kebijakan kirim atau antrean, elevasi, origin, dan binding runtime ACP agar run terisolasi baru tidak mewarisi pengiriman usang atau otoritas runtime dari run lama.

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang sedang Anda gunakan (perutean + isolasi).

Pola umum:

- Obrolan utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Ruang/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali dioverride)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## ID sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 pagi waktu lokal di host gateway) membuat `sessionId` baru pada pesan berikutnya setelah melewati batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau legacy `session.idleMinutes`) membuat `sessionId` baru saat pesan datang setelah jendela idle. Saat harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.
- **Peristiwa sistem** (Heartbeat, wakeup Cron, notifikasi exec, bookkeeping gateway) dapat mengubah baris sesi tetapi tidak memperpanjang kesegaran reset harian/idle. Rollover reset membuang notifikasi peristiwa sistem yang mengantre untuk sesi sebelumnya sebelum prompt baru dibangun.
- **Guard fork parent thread** (`session.parentForkMaxTokens`, default `100000`) melewati forking transkrip parent saat sesi parent sudah terlalu besar; thread baru dimulai dari awal. Setel `0` untuk menonaktifkan.

Detail implementasi: keputusan ini terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` di `src/config/sessions.ts`.

Field utama (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` disetel)
- `sessionStartedAt`: cap waktu mulai untuk `sessionId` saat ini; kesegaran reset harian menggunakan ini. Baris legacy dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: cap waktu interaksi pengguna/channel nyata terakhir; kesegaran reset idle menggunakan ini sehingga peristiwa Heartbeat, Cron, dan exec tidak membuat sesi tetap hidup. Baris legacy tanpa field ini akan fallback ke waktu mulai sesi yang dipulihkan untuk kesegaran idle.
- `updatedAt`: cap waktu mutasi baris penyimpanan terakhir, digunakan untuk listing, pemangkasan, dan bookkeeping. Ini bukan otoritas untuk kesegaran reset harian/idle.
- `sessionFile`: override path transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan kirim)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (best-effort / bergantung pada penyedia):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering Compaction otomatis selesai untuk kunci sesi ini
- `memoryFlushAt`: cap waktu flush memori pra-Compaction terakhir
- `memoryFlushCompactionCount`: jumlah Compaction saat flush terakhir dijalankan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritasnya: ia dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `@mariozechner/pi-coding-agent` `SessionManager`.

File menggunakan JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, `parentSession` opsional)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Tipe entri penting:

- `message`: pesan user/assistant/toolResult
- `custom_message`: pesan yang diinjeksi extension yang _masuk_ ke konteks model (dapat disembunyikan dari UI)
- `custom`: state extension yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan Compaction yang dipersistenkan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistenkan saat menavigasi cabang pohon

OpenClaw sengaja **tidak** “memperbaiki” transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda yang penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dasbor)

Jika Anda sedang menyetel batas:

- Jendela konteks berasal dari katalog model (dan dapat dioverride melalui konfigurasi).
- `contextTokens` di penyimpanan adalah nilai estimasi/pelaporan runtime; jangan perlakukan ini sebagai jaminan yang ketat.

Untuk selengkapnya, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction merangkum percakapan lama ke dalam entri `compaction` yang dipersistenkan di transkrip dan mempertahankan pesan terbaru tetap utuh.

Setelah Compaction, giliran berikutnya melihat:

- Ringkasan Compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk Compaction dan pairing tool

Saat OpenClaw membagi transkrip panjang menjadi chunk Compaction, ia menjaga pemanggilan tool assistant tetap berpasangan dengan entri `toolResult` yang cocok.

- Jika pembagian berdasarkan porsi token jatuh di antara pemanggilan tool dan hasilnya, OpenClaw menggeser batas ke pesan assistant tool-call alih-alih memisahkan pasangan tersebut.
- Jika blok tool-result di akhir sebaliknya akan mendorong chunk melewati target, OpenClaw mempertahankan blok tool yang tertunda itu dan menjaga tail yang belum dirangkum tetap utuh.
- Blok tool-call yang dibatalkan/error tidak menahan pemisahan tertunda tetap terbuka.

---

## Kapan Compaction otomatis terjadi (runtime Pi)

Dalam agen Pi tersemat, Compaction otomatis dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan error overflow konteks (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded`, dan varian serupa berbentuk penyedia) → compact → retry.
2. **Pemeliharaan ambang batas**: setelah giliran berhasil, saat:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah headroom yang dicadangkan untuk prompt + output model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event tersebut, tetapi Pi yang memutuskan kapan melakukan Compaction).

---

## Pengaturan Compaction (`reserveTokens`, `keepRecentTokens`)

Pengaturan Compaction Pi berada dalam pengaturan Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw juga menegakkan batas minimum keamanan untuk run tersemat:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas minimum default adalah `20000` token.
- Setel `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas minimum.
- Jika nilainya sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` yang eksplisit dan mempertahankan titik potong tail terbaru milik Pi. Tanpa anggaran keep yang eksplisit, Compaction manual tetap menjadi checkpoint keras dan konteks yang dibangun ulang dimulai dari ringkasan baru.

Mengapa: menyisakan headroom yang cukup untuk “housekeeping” multi-giliran (seperti penulisan memori) sebelum Compaction menjadi tak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` dalam `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Penyedia Compaction yang dapat dipasang

Plugin dapat mendaftarkan penyedia Compaction melalui `registerCompactionProvider()` pada API Plugin. Saat `agents.defaults.compaction.provider` disetel ke id penyedia yang terdaftar, extension safeguard mendelegasikan peringkasan ke penyedia tersebut alih-alih pipeline bawaan `summarizeInStages`.

- `provider`: id dari plugin penyedia Compaction yang terdaftar. Biarkan tidak disetel untuk peringkasan LLM default.
- Menyetel `provider` akan memaksa `mode: "safeguard"`.
- Penyedia menerima instruksi Compaction dan kebijakan pelestarian identifier yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan konteks sufiks giliran terbaru dan split-turn setelah output penyedia.
- Peringkasan safeguard bawaan melakukan distilasi ulang ringkasan sebelumnya dengan pesan baru alih-alih mempertahankan seluruh ringkasan sebelumnya secara verbatim.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; setel `qualityGuard.enabled: false` untuk melewati perilaku retry-on-malformed-output.
- Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw secara otomatis fallback ke peringkasan LLM bawaan.
- Sinyal abort/timeout dilempar ulang (tidak ditelan) untuk menghormati pembatalan oleh pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat oleh pengguna

Anda dapat mengamati Compaction dan state sesi melalui:

- `/status` (di sesi obrolan mana pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah Compaction

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung giliran “senyap” untuk tugas latar belakang saat pengguna tidak boleh melihat output perantara.

Konvensi:

- Assistant memulai output-nya dengan token senyap yang persis `NO_REPLY` /
  `no_reply` untuk menunjukkan “jangan kirim balasan kepada pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis bersifat case-insensitive, jadi `NO_REPLY` dan
  `no_reply` keduanya dihitung ketika seluruh payload hanyalah token senyap.
- Ini hanya untuk giliran latar belakang/ tanpa pengiriman yang benar-benar demikian; ini bukan jalan pintas untuk permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/mengetik** saat
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan
output parsial di tengah giliran.

---

## “Flush memori” pra-Compaction (diimplementasikan)

Tujuan: sebelum Compaction otomatis terjadi, jalankan giliran agentik senyap yang menulis
state tahan lama ke disk (mis. `memory/YYYY-MM-DD.md` di workspace agen) agar Compaction tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang**:

1. Pantau penggunaan konteks sesi.
2. Saat melampaui “ambang lunak” (di bawah ambang Compaction Pi), jalankan arahan senyap
   “tulis memori sekarang” ke agen.
3. Gunakan token senyap yang persis `NO_REPLY` / `no_reply` agar pengguna tidak melihat
   apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan pengguna untuk giliran flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi Pi tersemat (backend CLI melewatinya).
- Flush dilewati saat workspace sesi bersifat read-only (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memory](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API extension, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Checklist pemecahan masalah

- Kunci sesi salah? Mulai dari [/concepts/session](/id/concepts/session) dan konfirmasikan `sessionKey` di `/status`.
- Penyimpanan vs transkrip tidak cocok? Konfirmasikan host Gateway dan path penyimpanan dari `openclaw status`.
- Spam Compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` yang terlalu tinggi untuk jendela model dapat menyebabkan Compaction lebih awal)
  - bloat tool-result: aktifkan/setel pemangkasan sesi
- Giliran senyap bocor? Konfirmasikan balasan dimulai dengan `NO_REPLY` (token persis case-insensitive) dan Anda menggunakan build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
