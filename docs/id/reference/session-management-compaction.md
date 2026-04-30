---
read_when:
    - Anda perlu menelusuri masalah pada ID sesi, JSONL transkrip, atau bidang sessions.json
    - Anda mengubah perilaku Compaction otomatis atau menambahkan pemeliharaan “pra-Compaction”
    - Anda ingin mengimplementasikan pengosongan memori atau giliran sistem senyap
summary: 'Pembahasan mendalam: penyimpanan sesi + transkrip, siklus hidup, dan internal (auto)Compaction'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-04-30T10:10:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw mengelola sesi secara menyeluruh di area-area berikut:

- **Perutean sesi** (cara pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Kebersihan transkrip** (perbaikan spesifik penyedia sebelum run)
- **Batas konteks** (jendela konteks vs token terlacak)
- **Compaction** (Compaction manual dan otomatis) dan tempat mengaitkan pekerjaan pra-Compaction
- **Pemeliharaan senyap** (penulisan memori yang tidak boleh menghasilkan output yang terlihat pengguna)

Jika Anda ingin gambaran tingkat tinggi terlebih dahulu, mulai dari:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Ringkasan memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Kebersihan transkrip](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki status sesi.

- UI (aplikasi macOS, UI Kontrol web, TUI) harus mengkueri Gateway untuk daftar sesi dan jumlah token.
- Dalam mode jarak jauh, file sesi berada di host jarak jauh; “memeriksa file Mac lokal Anda” tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw mempertahankan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta kunci/nilai: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan aktual + panggilan alat + ringkasan Compaction
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya
   - Checkpoint debug pra-Compaction yang besar dilewati setelah transkrip
     aktif melampaui batas ukuran checkpoint, sehingga menghindari salinan
     `.checkpoint.*.jsonl` raksasa kedua.

---

## Lokasi di disk

Per agen, di host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw menyelesaikan lokasi ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json`, artefak transkrip, dan sidecar trajectory:

- `mode`: `warn` (default) atau `enforce`
- `pruneAfter`: batas usia entri usang (default `30d`)
- `maxEntries`: batas entri di `sessions.json` (default `500`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama seperti `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Penulisan Gateway normal melakukan batch pembersihan `maxEntries` untuk batas berukuran produksi, sehingga penyimpanan dapat sebentar melampaui batas yang dikonfigurasi sebelum pembersihan high-water berikutnya menulis ulang hingga turun kembali. `openclaw sessions cleanup --enforce` tetap langsung menerapkan batas yang dikonfigurasi.

OpenClaw tidak lagi membuat cadangan rotasi `sessions.json.bak.*` otomatis selama penulisan Gateway. Kunci lama `session.maintenance.rotateBytes` diabaikan dan `openclaw doctor --fix` menghapusnya dari konfigurasi lama.

Urutan penegakan untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak arsip tertua, transkrip yatim, atau trajectory yatim terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua dan file transkrip/trajectory-nya.
3. Teruskan hingga penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi pengeluaran tetapi tidak mengubah penyimpanan/file.

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

Saat cron memaksa pembuatan sesi run terisolasi baru, cron membersihkan entri
sesi `cron:<jobId>` sebelumnya sebelum menulis baris baru. Cron membawa
preferensi aman seperti pengaturan berpikir/cepat/verbose, label, dan override
model/auth yang dipilih pengguna secara eksplisit. Cron membuang konteks
percakapan ambien seperti perutean channel/grup, kebijakan kirim atau antrean,
elevasi, asal, dan binding runtime ACP sehingga run terisolasi baru tidak dapat
mewarisi pengiriman usang atau otoritas runtime dari run lama.

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ yang sedang Anda gunakan (perutean + isolasi).

Pola umum:

- Chat utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali di-override)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 AM waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau legacy `session.idleMinutes`) membuat `sessionId` baru saat pesan tiba setelah jendela idle. Saat harian + idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu menang.
- **Event sistem** (heartbeat, wakeup cron, notifikasi exec, pembukuan gateway) dapat mengubah baris sesi tetapi tidak memperpanjang kesegaran reset harian/idle. Rollover reset membuang pemberitahuan event sistem yang diantrekan untuk sesi sebelumnya sebelum prompt baru dibangun.
- **Pelindung fork parent thread** (`session.parentForkMaxTokens`, default `100000`) melewati forking transkrip parent saat sesi parent sudah terlalu besar; thread baru dimulai segar. Atur `0` untuk menonaktifkan.

Detail implementasi: keputusan terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field utama (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` diatur)
- `sessionStartedAt`: timestamp mulai untuk `sessionId` saat ini; kesegaran reset harian
  menggunakan ini. Baris legacy dapat menurunkannya dari header sesi JSONL.
- `lastInteractionAt`: timestamp interaksi pengguna/channel nyata terakhir; kesegaran reset
  idle menggunakan ini sehingga heartbeat, cron, dan event exec tidak menjaga sesi
  tetap hidup. Baris legacy tanpa field ini fallback ke waktu mulai sesi yang dipulihkan
  untuk kesegaran idle.
- `updatedAt`: timestamp mutasi baris penyimpanan terakhir, digunakan untuk listing, pemangkasan, dan
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
- `compactionCount`: seberapa sering auto-Compaction selesai untuk kunci sesi ini
- `memoryFlushAt`: timestamp untuk flush memori pra-Compaction terakhir
- `memoryFlushCompactionCount`: jumlah Compaction saat flush terakhir berjalan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritasnya: Gateway dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` milik `@mariozechner/pi-coding-agent`.

File ini adalah JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, opsional `parentSession`)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Tipe entri penting:

- `message`: pesan pengguna/asisten/toolResult
- `custom_message`: pesan yang diinjeksi ekstensi yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: status ekstensi yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan Compaction yang dipersistenkan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistenkan saat menavigasi cabang pohon

OpenClaw sengaja **tidak** “memperbaiki” transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token terlacak

Dua konsep berbeda penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dasbor)

Jika Anda menyesuaikan batas:

- Jendela konteks berasal dari katalog model (dan dapat di-override melalui konfigurasi).
- `contextTokens` dalam penyimpanan adalah nilai estimasi/pelaporan runtime; jangan perlakukan sebagai jaminan ketat.

Untuk selengkapnya, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction merangkum percakapan lama ke dalam entri `compaction` yang dipersistenkan di transkrip dan menjaga pesan terbaru tetap utuh.

Setelah Compaction, giliran berikutnya melihat:

- Ringkasan Compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk Compaction dan pemasangan alat

Saat OpenClaw membagi transkrip panjang menjadi chunk Compaction, OpenClaw menjaga
panggilan alat asisten tetap berpasangan dengan entri `toolResult` yang sesuai.

- Jika pembagian porsi token jatuh di antara panggilan alat dan hasilnya, OpenClaw
  menggeser batas ke pesan panggilan alat asisten alih-alih memisahkan
  pasangan tersebut.
- Jika blok hasil alat di akhir sebaliknya akan mendorong chunk melewati target,
  OpenClaw mempertahankan blok alat tertunda tersebut dan menjaga ekor yang belum diringkas
  tetap utuh.
- Blok panggilan alat yang dibatalkan/error tidak menahan pembagian tertunda tetap terbuka.

---

## Kapan auto-Compaction terjadi (runtime Pi)

Dalam agen Pi tertanam, auto-Compaction dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan error overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa berbentuk penyedia) → compact → coba lagi.
2. **Pemeliharaan ambang**: setelah giliran berhasil, saat:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan yang disisihkan untuk prompt + output model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event, tetapi Pi memutuskan kapan melakukan Compaction).

OpenClaw juga dapat memicu Compaction lokal preflight sebelum membuka run berikutnya
saat `agents.defaults.compaction.maxActiveTranscriptBytes` diatur dan file transkrip
aktif mencapai ukuran tersebut. Ini adalah pelindung ukuran file untuk biaya
pembukaan ulang lokal, bukan pengarsipan mentah: OpenClaw tetap menjalankan Compaction
semantik normal, dan memerlukan `truncateAfterCompaction` agar ringkasan yang telah
di-compact dapat menjadi transkrip penerus baru.

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

OpenClaw juga memberlakukan batas bawah keamanan untuk proses tertanam:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Batas bawah default adalah `20000` token.
- Atur `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan batas bawah.
- Jika nilainya sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens`
  eksplisit dan mempertahankan titik pemotongan ekor terbaru Pi. Tanpa anggaran
  simpan eksplisit, compaction manual tetap menjadi checkpoint keras dan konteks
  yang dibangun ulang dimulai dari ringkasan baru.
- Atur `agents.defaults.compaction.maxActiveTranscriptBytes` ke nilai byte atau
  string seperti `"20mb"` untuk menjalankan compaction lokal sebelum giliran saat
  transkrip aktif menjadi besar. Pelindung ini hanya aktif saat
  `truncateAfterCompaction` juga diaktifkan. Biarkan tidak diatur atau atur ke `0`
  untuk menonaktifkan.
- Saat `agents.defaults.compaction.truncateAfterCompaction` diaktifkan,
  OpenClaw merotasi transkrip aktif ke JSONL penerus yang sudah dipadatkan setelah
  compaction. Transkrip lengkap lama tetap diarsipkan dan ditautkan dari
  checkpoint compaction, bukan ditulis ulang di tempat.

Alasan: menyisakan ruang kepala yang cukup untuk “pemeliharaan” beberapa giliran (seperti penulisan memori) sebelum compaction menjadi tidak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` di `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Penyedia compaction yang dapat dipasang

Plugin dapat mendaftarkan penyedia compaction melalui `registerCompactionProvider()` pada API Plugin. Saat `agents.defaults.compaction.provider` diatur ke id penyedia terdaftar, ekstensi pengaman mendelegasikan peringkasan ke penyedia tersebut, bukan ke pipeline `summarizeInStages` bawaan.

- `provider`: id Plugin penyedia compaction terdaftar. Biarkan tidak diatur untuk peringkasan LLM default.
- Mengatur `provider` memaksa `mode: "safeguard"`.
- Penyedia menerima instruksi compaction dan kebijakan pelestarian pengenal yang sama seperti jalur bawaan.
- Pengaman tetap mempertahankan konteks akhiran giliran terbaru dan giliran terpisah setelah keluaran penyedia.
- Peringkasan pengaman bawaan menyuling ulang ringkasan sebelumnya dengan pesan baru
  alih-alih mempertahankan ringkasan sebelumnya secara lengkap apa adanya.
- Mode pengaman mengaktifkan audit kualitas ringkasan secara default; atur
  `qualityGuard.enabled: false` untuk melewati perilaku coba ulang saat keluaran salah bentuk.
- Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw otomatis kembali ke peringkasan LLM bawaan.
- Sinyal abort/timeout dilemparkan kembali (tidak ditelan) untuk menghormati pembatalan pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat pengguna

Anda dapat mengamati compaction dan status sesi melalui:

- `/status` (di sesi chat mana pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah compaction

---

## Pemeliharaan senyap (`NO_REPLY`)

OpenClaw mendukung giliran “senyap” untuk tugas latar belakang saat pengguna tidak boleh melihat keluaran perantara.

Konvensi:

- Asisten memulai keluarannya dengan token senyap persis `NO_REPLY` /
  `no_reply` untuk menunjukkan “jangan kirim balasan kepada pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar-kecil, sehingga `NO_REPLY` dan
  `no_reply` sama-sama dihitung saat seluruh muatan hanya berupa token senyap.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang sebenarnya; ini bukan pintasan untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Sejak `2026.1.10`, OpenClaw juga menekan **streaming draf/pengetikan** saat
potongan parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan keluaran
parsial di tengah giliran.

---

## "Memory flush" pra-compaction (diimplementasikan)

Tujuan: sebelum auto-compaction terjadi, jalankan giliran agentik senyap yang menulis
status tahan lama ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) sehingga compaction tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush pra-ambang**:

1. Pantau penggunaan konteks sesi.
2. Saat melewati “ambang lunak” (di bawah ambang compaction Pi), jalankan arahan senyap
   “tulis memori sekarang” ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` sehingga pengguna tidak melihat
   apa pun.

Konfigurasi (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `model` (opsional override penyedia/model persis untuk giliran flush, misalnya `ollama/qwen3:8b`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan pengguna untuk giliran flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/prompt sistem default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Saat `model` diatur, giliran flush menggunakan model tersebut tanpa mewarisi rantai fallback
  sesi aktif, sehingga pemeliharaan khusus lokal tidak diam-diam
  fallback ke model percakapan berbayar.
- Flush berjalan sekali per siklus compaction (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi Pi tertanam (backend CLI melewatinya).
- Flush dilewati saat workspace sesi bersifat hanya baca (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memori](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API ekstensi, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Checklist pemecahan masalah

- Kunci sesi salah? Mulai dengan [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Ketidakcocokan store vs transkrip? Konfirmasi host Gateway dan jalur store dari `openclaw status`.
- Spam compaction? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan compaction (`reserveTokens` terlalu tinggi untuk jendela model dapat menyebabkan compaction lebih awal)
  - pembengkakan hasil alat: aktifkan/sesuaikan pemangkasan sesi
- Giliran senyap bocor? Konfirmasi balasan dimulai dengan `NO_REPLY` (token persis tidak peka huruf besar-kecil) dan Anda menggunakan build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Mesin konteks](/id/concepts/context-engine)
