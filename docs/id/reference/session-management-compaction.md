---
read_when:
    - Anda perlu men-debug id sesi, JSONL transkrip, atau field sessions.json
    - Anda sedang mengubah perilaku auto-Compaction atau menambahkan housekeeping “pra-Compaction”
    - Anda ingin mengimplementasikan flush memori atau giliran sistem senyap
summary: 'Pembahasan mendalam: penyimpanan sesi + transkrip, siklus hidup, dan internal Compaction (otomatis)'
title: Pembahasan mendalam manajemen sesi
x-i18n:
    generated_at: "2026-04-24T09:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Manajemen Sesi & Compaction (Pembahasan Mendalam)

Dokumen ini menjelaskan cara OpenClaw mengelola sesi secara end-to-end:

- **Routing sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Higiene transkrip** (perbaikan spesifik provider sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Compaction** (Compaction manual + otomatis) dan tempat mengaitkan pekerjaan pra-Compaction
- **Housekeeping senyap** (mis. penulisan memori yang seharusnya tidak menghasilkan output yang terlihat oleh pengguna)

Jika Anda ingin ikhtisar tingkat tinggi terlebih dahulu, mulai dari:

- [/concepts/session](/id/concepts/session)
- [/concepts/compaction](/id/concepts/compaction)
- [/concepts/memory](/id/concepts/memory)
- [/concepts/memory-search](/id/concepts/memory-search)
- [/concepts/session-pruning](/id/concepts/session-pruning)
- [/reference/transcript-hygiene](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki status sesi.

- UI (aplikasi macOS, Control UI web, TUI) seharusnya mengkueri Gateway untuk daftar sesi dan jumlah token.
- Dalam mode remote, file sesi berada di host remote; “memeriksa file di Mac lokal Anda” tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempertahankan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta key/value: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan sebenarnya + panggilan tool + ringkasan Compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya

---

## Lokasi di disk

Per agen, di host Gateway:

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
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak transkrip arsip atau yatim tertua terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua dan file transkripnya.
3. Lanjutkan sampai penggunaan berada di atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi pengeluaran entri tetapi tidak mengubah penyimpanan/file.

Jalankan pemeliharaan sesuai permintaan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log run

Run Cron terisolasi juga membuat entri sesi/transkrip, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run Cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

---

## Key sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang Anda gunakan (routing + isolasi).

Pola umum:

- Obrolan utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Room/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali dioverride)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 pagi waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah melewati batas reset.
- **Idle expiry** (`session.reset.idleMinutes` atau legacy `session.idleMinutes`) membuat `sessionId` baru ketika pesan tiba setelah jendela idle. Ketika daily + idle sama-sama dikonfigurasi, mana yang lebih dulu kedaluwarsa yang menang.
- **Thread parent fork guard** (`session.parentForkMaxTokens`, default `100000`) melewati forking transkrip induk ketika sesi induk sudah terlalu besar; thread baru dimulai dari awal. Setel `0` untuk menonaktifkan.

Detail implementasi: keputusan ini terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` di `src/config/sessions.ts`.

Field kunci (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` diatur)
- `updatedAt`: timestamp aktivitas terakhir
- `sessionFile`: override path transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan kirim)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/kanal
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (best-effort / bergantung provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering auto-Compaction selesai untuk key sesi ini
- `memoryFlushAt`: timestamp untuk flush memori pra-Compaction terakhir
- `memoryFlushCompactionCount`: jumlah Compaction saat flush terakhir dijalankan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritas: Gateway dapat menulis ulang atau menghidrasikan ulang entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` dari `@mariozechner/pi-coding-agent`.

File menggunakan JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, opsional `parentSession`)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Jenis entri penting:

- `message`: pesan user/assistant/toolResult
- `custom_message`: pesan yang disuntikkan ekstensi yang *masuk* ke konteks model (dapat disembunyikan dari UI)
- `custom`: status ekstensi yang *tidak* masuk ke konteks model
- `compaction`: ringkasan Compaction yang dipertahankan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipertahankan saat menavigasi cabang pohon

OpenClaw dengan sengaja **tidak** melakukan “fix up” pada transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda yang penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik rolling yang ditulis ke `sessions.json` (digunakan untuk /status dan dashboard)

Jika Anda sedang menyesuaikan batas:

- Jendela konteks berasal dari katalog model (dan dapat dioverride melalui konfigurasi).
- `contextTokens` dalam penyimpanan adalah nilai estimasi/pelaporan runtime; jangan perlakukan sebagai jaminan yang ketat.

Untuk detail lebih lanjut, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction merangkum percakapan lama menjadi entri `compaction` yang dipertahankan di transkrip dan mempertahankan pesan terbaru tetap utuh.

Setelah Compaction, giliran berikutnya akan melihat:

- Ringkasan Compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti session pruning). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk Compaction dan pairing tool

Ketika OpenClaw membagi transkrip panjang menjadi chunk Compaction, OpenClaw menjaga
agar panggilan tool asisten tetap berpasangan dengan entri `toolResult` yang cocok.

- Jika pemisahan token-share jatuh di antara panggilan tool dan hasilnya, OpenClaw
  menggeser batas ke pesan panggilan tool milik asisten alih-alih memisahkan
  pasangan tersebut.
- Jika blok tool-result di bagian ekor seharusnya mendorong chunk melebihi target,
  OpenClaw mempertahankan blok tool yang tertunda itu dan menjaga ekor yang belum diringkas tetap utuh.
- Blok tool-call yang aborted/error tidak menahan pemisahan tertunda tetap terbuka.

---

## Kapan auto-Compaction terjadi (runtime Pi)

Dalam agen Pi tertanam, auto-Compaction dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan error overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa berbentuk provider) → compact → retry.
2. **Pemeliharaan ambang**: setelah giliran berhasil, ketika:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah headroom yang dicadangkan untuk prompt + output model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event tersebut, tetapi Pi yang memutuskan kapan harus compact).

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

OpenClaw juga menegakkan batas bawah keamanan untuk embedded run:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas bawah default adalah `20000` token.
- Setel `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika nilainya sudah lebih tinggi, OpenClaw membiarkannya.

Mengapa: sisakan headroom yang cukup untuk “housekeeping” multi-giliran (seperti penulisan memori) sebelum Compaction menjadi tak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` di `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Provider Compaction yang dapat dipasang

Plugin dapat mendaftarkan provider Compaction melalui `registerCompactionProvider()` pada API Plugin. Ketika `agents.defaults.compaction.provider` diatur ke id provider yang terdaftar, ekstensi safeguard akan mendelegasikan peringkasan ke provider tersebut alih-alih pipeline bawaan `summarizeInStages`.

- `provider`: id dari Plugin provider Compaction yang terdaftar. Biarkan tidak diatur untuk peringkasan LLM default.
- Menyetel `provider` memaksa `mode: "safeguard"`.
- Provider menerima instruksi Compaction dan kebijakan preservasi identifier yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan konteks suffix giliran terbaru dan split-turn setelah output provider.
- Jika provider gagal atau mengembalikan hasil kosong, OpenClaw secara otomatis fallback ke peringkasan LLM bawaan.
- Sinyal abort/timeout dilempar ulang (tidak ditelan) untuk menghormati pembatalan dari pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat oleh pengguna

Anda dapat mengamati Compaction dan status sesi melalui:

- `/status` (di sesi obrolan mana pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah Compaction

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung giliran “senyap” untuk tugas latar belakang di mana pengguna seharusnya tidak melihat output perantara.

Konvensi:

- Asisten memulai outputnya dengan token senyap yang persis `NO_REPLY` /
  `no_reply` untuk menunjukkan “jangan kirim balasan ke pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan exact silent-token bersifat case-insensitive, jadi `NO_REPLY` dan
  `no_reply` keduanya dihitung ketika seluruh payload hanyalah token senyap itu.
- Ini ditujukan hanya untuk giliran latar belakang/tanpa pengiriman yang sebenarnya; ini bukan pintasan untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **draft/typing streaming** ketika
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan
output parsial di tengah giliran.

---

## "Memory flush" pra-Compaction (sudah diimplementasikan)

Tujuan: sebelum auto-Compaction terjadi, jalankan giliran agen senyap yang menulis status tahan lama ke disk (mis. `memory/YYYY-MM-DD.md` di workspace agen) sehingga Compaction tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **pre-threshold flush**:

1. Pantau penggunaan konteks sesi.
2. Ketika melampaui “soft threshold” (di bawah ambang Compaction Pi), jalankan directive
   senyap “tulis memori sekarang” ke agen.
3. Gunakan token senyap yang persis `NO_REPLY` / `no_reply` agar pengguna tidak melihat
   apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan pengguna untuk giliran flush)
- `systemPrompt` (system prompt tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/system prompt default mencakup petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi Pi tertanam (backend CLI melewatinya).
- Flush dilewati ketika workspace sesi bersifat read-only (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memory](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga menampilkan hook `session_before_compact` di API ekstensi, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Checklist pemecahan masalah

- Key sesi salah? Mulai dari [/concepts/session](/id/concepts/session) dan konfirmasikan `sessionKey` di `/status`.
- Ketidakcocokan penyimpanan vs transkrip? Konfirmasikan host Gateway dan path penyimpanan dari `openclaw status`.
- Spam Compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` yang terlalu tinggi untuk jendela model dapat menyebabkan Compaction lebih awal)
  - pembengkakan tool-result: aktifkan/sesuaikan session pruning
- Giliran senyap bocor? Pastikan balasan dimulai dengan `NO_REPLY` (token persis yang case-insensitive) dan Anda menggunakan build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Session pruning](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
