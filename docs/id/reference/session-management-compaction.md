---
read_when:
    - Anda perlu men-debug ID sesi, JSONL transkrip, atau field sessions.json
    - Anda mengubah perilaku pemadatan otomatis atau menambahkan housekeeping “pra-pemadatan”
    - Anda ingin menerapkan flush memori atau giliran sistem senyap
summary: 'Pendalaman: penyimpanan sesi + transkrip, siklus hidup, dan internal pemadatan (otomatis)'
title: Pendalaman Manajemen Sesi
x-i18n:
    generated_at: "2026-04-05T14:06:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Manajemen Sesi & Pemadatan (Pendalaman)

Dokumen ini menjelaskan bagaimana OpenClaw mengelola sesi dari ujung ke ujung:

- **Perutean sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacak
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Kebersihan transkrip** (penyesuaian khusus penyedia sebelum dijalankan)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Pemadatan** (pemadatan manual + otomatis) dan tempat mengaitkan pekerjaan pra-pemadatan
- **Housekeeping senyap** (misalnya, penulisan memori yang seharusnya tidak menghasilkan output yang terlihat oleh pengguna)

Jika Anda ingin gambaran umum tingkat tinggi terlebih dahulu, mulai dari:

- [/concepts/session](/id/concepts/session)
- [/concepts/compaction](/id/concepts/compaction)
- [/concepts/memory](/id/concepts/memory)
- [/concepts/memory-search](/id/concepts/memory-search)
- [/concepts/session-pruning](/id/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki status sesi.

- UI (aplikasi macOS, UI Kontrol web, TUI) harus meminta daftar sesi dan jumlah token ke Gateway.
- Dalam mode jarak jauh, file sesi berada di host jarak jauh; “memeriksa file Mac lokal Anda” tidak akan mencerminkan apa yang digunakan oleh Gateway.

---

## Dua lapisan persistensi

OpenClaw menyimpan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta key/value: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (ID sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan sebenarnya + panggilan alat + ringkasan pemadatan
   - Digunakan untuk membangun ulang konteks model untuk giliran mendatang

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
- `maxEntries`: batas entri di `sessions.json` (default `500`)
- `rotateBytes`: rotasi `sessions.json` saat terlalu besar (default `10mb`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama dengan `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran opsional untuk direktori sesi
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak transkrip arsip atau yatim tertua terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua beserta file transkripnya.
3. Lanjutkan sampai penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi pengeluaran tetapi tidak mengubah penyimpanan/file.

Jalankan pemeliharaan sesuai kebutuhan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi cron dan log run

Run cron yang terisolasi juga membuat entri/transkrip sesi, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ tempat Anda berada (perutean + isolasi).

Pola umum:

- Obrolan utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Ruangan/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali ditimpa)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## ID sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 pagi waktu lokal di host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau `session.idleMinutes` lama) membuat `sessionId` baru ketika pesan tiba setelah jendela idle. Saat harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.
- **Pelindung fork induk thread** (`session.parentForkMaxTokens`, default `100000`) melewati forking transkrip induk ketika sesi induk sudah terlalu besar; thread baru dimulai dari awal. Tetapkan `0` untuk menonaktifkan.

Detail implementasi: keputusan ini terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field utama (tidak lengkap):

- `sessionId`: ID transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` ditetapkan)
- `updatedAt`: stempel waktu aktivitas terakhir
- `sessionFile`: penggantian jalur transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan pengiriman)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (penggantian per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (best-effort / bergantung pada penyedia):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering pemadatan otomatis selesai untuk kunci sesi ini
- `memoryFlushAt`: stempel waktu untuk flush memori pra-pemadatan terakhir
- `memoryFlushCompactionCount`: jumlah pemadatan saat flush terakhir dijalankan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritasnya: ia dapat menulis ulang atau menghidrasi ulang entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` dari `@mariozechner/pi-coding-agent`.

File ini berbentuk JSONL:

- Baris pertama: header sesi (`type: "session"`, menyertakan `id`, `cwd`, `timestamp`, `parentSession` opsional)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Jenis entri penting:

- `message`: pesan pengguna/asisten/toolResult
- `custom_message`: pesan yang disisipkan ekstensi yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: status ekstensi yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan pemadatan yang dipersistenkan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistenkan saat menavigasi cabang pohon

OpenClaw sengaja **tidak** “memperbaiki” transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda penting di sini:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dasbor)

Jika Anda menyetel batas:

- Jendela konteks berasal dari katalog model (dan dapat ditimpa melalui konfigurasi).
- `contextTokens` dalam penyimpanan adalah nilai estimasi/pelaporan runtime; jangan anggap itu sebagai jaminan ketat.

Untuk detail lebih lanjut, lihat [/token-use](/reference/token-use).

---

## Pemadatan: apa itu

Pemadatan merangkum percakapan lama menjadi entri `compaction` yang dipersistenkan dalam transkrip dan menjaga pesan terbaru tetap utuh.

Setelah pemadatan, giliran mendatang akan melihat:

- Ringkasan pemadatan
- Pesan setelah `firstKeptEntryId`

Pemadatan bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas potongan pemadatan dan pemasangan alat

Ketika OpenClaw membagi transkrip panjang menjadi potongan pemadatan, ia menjaga
panggilan alat asisten tetap berpasangan dengan entri `toolResult` yang cocok.

- Jika pembagian berdasarkan porsi token jatuh di antara panggilan alat dan hasilnya, OpenClaw
  menggeser batas ke pesan panggilan alat asisten alih-alih memisahkan
  pasangan tersebut.
- Jika blok tool-result di akhir sebaliknya akan mendorong potongan melewati target,
  OpenClaw mempertahankan blok alat yang tertunda itu dan menjaga ekor yang belum diringkas
  tetap utuh.
- Blok panggilan alat yang dibatalkan/error tidak menahan pembagian tertunda tetap terbuka.

---

## Kapan pemadatan otomatis terjadi (runtime Pi)

Dalam agen Pi tersemat, pemadatan otomatis dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan kesalahan overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa yang dibentuk penyedia) → padatkan → coba lagi.
2. **Pemeliharaan ambang batas**: setelah giliran berhasil, ketika:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan yang disisihkan untuk prompt + output model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi peristiwa, tetapi Pi yang memutuskan kapan harus memadatkan).

---

## Pengaturan pemadatan (`reserveTokens`, `keepRecentTokens`)

Pengaturan pemadatan Pi berada dalam pengaturan Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw juga menerapkan ambang bawah keamanan untuk run tersemat:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Ambang bawah default adalah `20000` token.
- Tetapkan `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan ambang bawah.
- Jika sudah lebih tinggi, OpenClaw membiarkannya.

Alasannya: sisakan cukup ruang cadangan untuk “housekeeping” multi-giliran (seperti penulisan memori) sebelum pemadatan menjadi tak terelakkan.

Implementasi: `ensurePiCompactionReserveTokens()` dalam `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Permukaan yang terlihat pengguna

Anda dapat mengamati pemadatan dan status sesi melalui:

- `/status` (dalam sesi obrolan apa pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah pemadatan

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung giliran “senyap” untuk tugas latar belakang di mana pengguna tidak seharusnya melihat output perantara.

Konvensi:

- Asisten memulai outputnya dengan token senyap yang persis `NO_REPLY` /
  `no_reply` untuk menunjukkan “jangan kirim balasan ke pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar-kecil, jadi `NO_REPLY` dan
  `no_reply` sama-sama dihitung ketika seluruh payload hanyalah token senyap.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang benar-benar demikian; ini bukan jalan pintas untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** ketika
potongan parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan output parsial di tengah giliran.

---

## "Flush memori" pra-pemadatan (diimplementasikan)

Tujuan: sebelum pemadatan otomatis terjadi, jalankan giliran agentic senyap yang menulis
status tahan lama ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) sehingga pemadatan tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang batas**:

1. Pantau penggunaan konteks sesi.
2. Saat melampaui “ambang lunak” (di bawah ambang pemadatan Pi), jalankan
   arahan senyap “tulis memori sekarang” ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` agar pengguna tidak melihat
   apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan pengguna untuk giliran flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Flush dijalankan sekali per siklus pemadatan (dilacak di `sessions.json`).
- Flush hanya dijalankan untuk sesi Pi tersemat (backend CLI melewatkannya).
- Flush dilewati ketika workspace sesi bersifat hanya-baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memory](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` dalam API ekstensi, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Kunci sesi salah? Mulai dari [/concepts/session](/id/concepts/session) dan konfirmasikan `sessionKey` di `/status`.
- Ketidakcocokan penyimpanan vs transkrip? Konfirmasikan host Gateway dan jalur penyimpanan dari `openclaw status`.
- Spam pemadatan? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan pemadatan (`reserveTokens` yang terlalu tinggi untuk jendela model dapat menyebabkan pemadatan lebih awal)
  - pembengkakan tool-result: aktifkan/setel pemangkasan sesi
- Giliran senyap bocor? Pastikan balasan dimulai dengan `NO_REPLY` (token persis yang tidak peka huruf besar-kecil) dan Anda menggunakan build yang menyertakan perbaikan penekanan streaming.
