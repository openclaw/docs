---
read_when:
    - Anda perlu men-debug id sesi, JSONL transkrip, atau field sessions.json
    - Anda sedang mengubah perilaku pemadatan otomatis atau menambahkan housekeeping “pra-pemadatan”
    - Anda ingin menerapkan memory flush atau giliran sistem senyap
summary: 'Pendalaman: penyimpanan sesi + transkrip, siklus hidup, dan internal (auto)compaction'
title: Pendalaman Manajemen Sesi
x-i18n:
    generated_at: "2026-04-08T02:18:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1a4048646486693db8943a9e9c6c5bcb205f0ed532b34842de3d0346077454
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Manajemen Sesi & Compaction (Pendalaman)

Dokumen ini menjelaskan bagaimana OpenClaw mengelola sesi secara end-to-end:

- **Perutean sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacak
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Higiene transkrip** (perbaikan khusus provider sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (pemadatan manual + otomatis) dan tempat mengaitkan pekerjaan pra-pemadatan
- **Housekeeping senyap** (misalnya penulisan memory yang tidak boleh menghasilkan output yang terlihat pengguna)

Jika Anda ingin gambaran tingkat tinggi terlebih dahulu, mulai dari:

- [/concepts/session](/id/concepts/session)
- [/concepts/compaction](/id/concepts/compaction)
- [/concepts/memory](/id/concepts/memory)
- [/concepts/memory-search](/id/concepts/memory-search)
- [/concepts/session-pruning](/id/concepts/session-pruning)
- [/reference/transcript-hygiene](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki status sesi.

- UI (aplikasi macOS, UI Control web, TUI) harus menanyakan Gateway untuk daftar sesi dan jumlah token.
- Dalam mode remote, file sesi berada di host remote; “memeriksa file Mac lokal Anda” tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempersistensi sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta key/value: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau entri dihapus)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan sebenarnya + pemanggilan tool + ringkasan pemadatan
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya

---

## Lokasi di disk

Per agen, pada host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw me-resolve ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json` dan artefak transkrip:

- `mode`: `warn` (default) atau `enforce`
- `pruneAfter`: batas usia entri basi (default `30d`)
- `maxEntries`: batas jumlah entri dalam `sessions.json` (default `500`)
- `rotateBytes`: rotasi `sessions.json` saat ukurannya terlalu besar (default `10mb`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama dengan `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran opsional untuk direktori sesi
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus terlebih dahulu artefak transkrip yang diarsipkan atau yatim tertua.
2. Jika masih di atas target, keluarkan entri sesi tertua dan file transkripnya.
3. Lanjutkan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi pengeluaran tetapi tidak mengubah penyimpanan/file.

Jalankan pemeliharaan sesuai permintaan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi cron dan log run

Run cron terisolasi juga membuat entri/transkrip sesi, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang sedang Anda gunakan (perutean + isolasi).

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
- **Reset harian** (default pukul 4:00 pagi waktu lokal di host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau `session.idleMinutes` lama) membuat `sessionId` baru saat pesan tiba setelah jendela idle. Saat harian + idle sama-sama dikonfigurasi, yang lebih dulu kedaluwarsa akan menang.
- **Guard fork induk thread** (`session.parentForkMaxTokens`, default `100000`) melewati fork transkrip induk saat sesi induk sudah terlalu besar; thread baru dimulai dari awal. Setel `0` untuk menonaktifkan.

Detail implementasi: keputusan ini terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field penting (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` disetel)
- `updatedAt`: stempel waktu aktivitas terakhir
- `sessionFile`: override jalur transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan pengiriman)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (best-effort / bergantung provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering pemadatan otomatis selesai untuk kunci sesi ini
- `memoryFlushAt`: stempel waktu untuk memory flush pra-pemadatan terakhir
- `memoryFlushCompactionCount`: jumlah pemadatan saat flush terakhir berjalan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritasnya: Gateway dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `@mariozechner/pi-coding-agent` melalui `SessionManager`.

File ini berbentuk JSONL:

- Baris pertama: header sesi (`type: "session"`, menyertakan `id`, `cwd`, `timestamp`, `parentSession` opsional)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Jenis entri penting:

- `message`: pesan user/asisten/toolResult
- `custom_message`: pesan yang diinjeksi extension yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: status extension yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan pemadatan yang dipersistensikan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistensikan saat menavigasi cabang pohon

OpenClaw sengaja **tidak** “memperbaiki” transkrip; Gateway menggunakan `SessionManager` untuk membacanya/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda penting di sini:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dashboard)

Jika Anda sedang menyetel batas:

- Jendela konteks berasal dari katalog model (dan dapat dioverride melalui konfigurasi).
- `contextTokens` dalam penyimpanan adalah nilai estimasi/pelaporan runtime; jangan anggap sebagai jaminan yang ketat.

Untuk detail lebih lanjut, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction merangkum percakapan lama menjadi entri `compaction` yang dipersistensikan dalam transkrip dan menjaga pesan terbaru tetap utuh.

Setelah pemadatan, giliran berikutnya akan melihat:

- Ringkasan pemadatan
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas potongan pemadatan dan pemasangan tool

Saat OpenClaw membagi transkrip panjang menjadi potongan pemadatan, OpenClaw menjaga
pemanggilan tool oleh asisten tetap dipasangkan dengan entri `toolResult` yang sesuai.

- Jika pemisahan berdasarkan proporsi token jatuh di antara pemanggilan tool dan hasilnya, OpenClaw
  menggeser batas ke pesan pemanggilan tool asisten alih-alih memisahkan
  pasangan tersebut.
- Jika blok tool-result di bagian akhir sebaliknya akan mendorong potongan melampaui target,
  OpenClaw mempertahankan blok tool tertunda tersebut dan menjaga ekor yang belum diringkas tetap
  utuh.
- Blok pemanggilan tool yang dibatalkan/error tidak akan menahan split tertunda tetap terbuka.

---

## Kapan pemadatan otomatis terjadi (runtime Pi)

Dalam agen Pi tertanam, pemadatan otomatis dipicu dalam dua kasus:

1. **Pemulihan luapan**: model mengembalikan error luapan konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa berbentuk provider) → padatkan → coba lagi.
2. **Pemeliharaan ambang**: setelah giliran berhasil, ketika:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan untuk prompt + output model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event tersebut, tetapi Pi yang memutuskan kapan harus memadatkan).

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

OpenClaw juga menegakkan lantai keamanan untuk run tertanam:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Lantai default adalah `20000` token.
- Setel `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan lantai.
- Jika nilainya sudah lebih tinggi, OpenClaw akan membiarkannya.

Mengapa: sisakan ruang cadangan yang cukup untuk “housekeeping” multi-giliran (seperti penulisan memory) sebelum pemadatan menjadi tak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` dalam `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Penyedia pemadatan yang dapat dipasang

Plugins dapat mendaftarkan penyedia pemadatan melalui `registerCompactionProvider()` pada API plugin. Saat `agents.defaults.compaction.provider` disetel ke id penyedia yang terdaftar, extension safeguard mendelegasikan peringkasan ke penyedia tersebut alih-alih pipeline bawaan `summarizeInStages`.

- `provider`: id plugin penyedia pemadatan yang terdaftar. Biarkan tidak disetel untuk peringkasan LLM default.
- Menyetel `provider` memaksa `mode: "safeguard"`.
- Penyedia menerima instruksi pemadatan dan kebijakan pelestarian pengenal yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan konteks sufiks giliran terbaru dan giliran terpisah setelah output penyedia.
- Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw secara otomatis kembali ke peringkasan LLM bawaan.
- Sinyal abort/timeout dilempar ulang (tidak ditelan) untuk menghormati pembatalan oleh pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat pengguna

Anda dapat mengamati pemadatan dan status sesi melalui:

- `/status` (di sesi chat mana pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah pemadatan

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung giliran “senyap” untuk tugas latar belakang ketika pengguna tidak boleh melihat output perantara.

Konvensi:

- Asisten memulai outputnya dengan token senyap yang persis `NO_REPLY` /
  `no_reply` untuk menunjukkan “jangan kirim balasan ke pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap yang persis bersifat tidak peka huruf besar/kecil, jadi `NO_REPLY` dan
  `no_reply` keduanya dihitung ketika seluruh payload hanyalah token senyap itu.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang benar-benar senyap; ini bukan shortcut untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** ketika
potongan parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan
output parsial di tengah giliran.

---

## "Memory flush" pra-pemadatan (diimplementasikan)

Tujuan: sebelum pemadatan otomatis terjadi, jalankan giliran agentik senyap yang menulis status tahan lama
ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) sehingga pemadatan tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang**:

1. Pantau penggunaan konteks sesi.
2. Saat melampaui “ambang lunak” (di bawah ambang pemadatan Pi), jalankan
   direktif senyap “tulis memory sekarang” ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` agar pengguna tidak melihat
   apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan user untuk giliran flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Flush berjalan sekali per siklus pemadatan (dilacak dalam `sessions.json`).
- Flush hanya berjalan untuk sesi Pi tertanam (backend CLI melewatinya).
- Flush dilewati saat workspace sesi read-only (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memory](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API extension, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Kunci sesi salah? Mulailah dari [/concepts/session](/id/concepts/session) dan konfirmasikan `sessionKey` di `/status`.
- Penyimpanan vs transkrip tidak cocok? Konfirmasikan host Gateway dan jalur penyimpanan dari `openclaw status`.
- Spam pemadatan? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan pemadatan (`reserveTokens` yang terlalu tinggi untuk jendela model dapat menyebabkan pemadatan lebih awal)
  - pembengkakan tool-result: aktifkan/setel pemangkasan sesi
- Giliran senyap bocor? Pastikan balasan dimulai dengan `NO_REPLY` (token persis tidak peka huruf besar/kecil) dan Anda menggunakan build yang menyertakan perbaikan penekanan streaming.
