---
read_when:
    - Anda ingin memahami alat sesi apa saja yang dimiliki agen
    - Anda ingin mengonfigurasi akses lintas sesi atau pemunculan sub-agen
    - Anda ingin memeriksa status sub-agent yang dijalankan
summary: Alat agen untuk status lintas sesi, pengingatan, perpesanan, dan orkestrasi sub-agen
title: Alat sesi
x-i18n:
    generated_at: "2026-07-04T20:44:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw memberi agen alat untuk bekerja lintas sesi, memeriksa status, dan
mengorkestrasi sub-agen.

## Alat yang tersedia

| Alat               | Fungsinya                                                                    |
| ------------------ | ----------------------------------------------------------------------------- |
| `sessions_list`    | Mencantumkan sesi dengan filter opsional (jenis, label, agen, arsip, pratinjau) |
| `sessions_history` | Membaca transkrip sesi tertentu                                               |
| `sessions_send`    | Mengirim pesan ke sesi lain dan secara opsional menunggu                      |
| `sessions_spawn`   | Membuat sesi sub-agen terisolasi untuk pekerjaan latar belakang               |
| `sessions_yield`   | Mengakhiri giliran saat ini dan menunggu hasil lanjutan sub-agen              |
| `subagents`        | Mencantumkan status sub-agen yang dibuat untuk sesi ini                       |
| `session_status`   | Menampilkan kartu bergaya `/status` dan secara opsional menetapkan penggantian model per sesi |

Alat-alat ini tetap tunduk pada profil alat aktif serta kebijakan izin/tolak.
`tools.profile: "coding"` mencakup set orkestrasi sesi lengkap, termasuk
`sessions_spawn`, `sessions_yield`, dan `subagents`.
`tools.profile: "messaging"` mencakup alat perpesanan lintas sesi
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) tetapi
tidak mencakup pembuatan sub-agen. Untuk mempertahankan profil perpesanan dan
tetap mengizinkan delegasi native, tambahkan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Kebijakan grup, penyedia, sandbox, dan per agen masih dapat menghapus alat-alat
tersebut setelah tahap profil. Gunakan `/tools` dari sesi yang terdampak untuk
memeriksa daftar alat efektif.

## Mencantumkan dan membaca sesi

`sessions_list` mengembalikan sesi beserta key, agentId, jenis, kanal, model,
jumlah token, dan stempel waktunya. Filter berdasarkan jenis (`main`, `group`,
`cron`, `hook`, `node`), `label` persis, `agentId` persis, teks pencarian, atau
keterkinian (`activeMinutes`). Sesi aktif dikembalikan secara default; teruskan
`archived: true` untuk memeriksa sesi yang diarsipkan. Baris mencakup status
dipin dan diarsipkan. Saat Anda membutuhkan triase bergaya kotak masuk, alat ini
juga dapat meminta judul turunan yang dicakup visibilitas, cuplikan pratinjau
pesan terakhir, atau pesan terbaru berbatas pada setiap baris. Judul turunan dan
pratinjau hanya dibuat untuk sesi yang sudah dapat dilihat pemanggil berdasarkan
kebijakan visibilitas alat sesi yang dikonfigurasi, sehingga sesi yang tidak
terkait tetap tersembunyi. Saat visibilitas dibatasi, `sessions_list`
mengembalikan metadata `visibility` opsional yang menunjukkan mode efektif dan
peringatan bahwa hasil mungkin terbatas cakupannya.

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu.
Secara default, hasil alat dikecualikan -- teruskan `includeTools: true` untuk melihatnya.
Gunakan `limit` untuk ekor terbaru yang dibatasi. Teruskan `offset: 0` saat Anda
membutuhkan metadata paginasi, lalu teruskan nilai `nextOffset` yang dikembalikan
untuk membuka halaman mundur melalui jendela transkrip OpenClaw yang lebih lama
tanpa membaca file transkrip mentah. Halaman offset eksplisit tidak menggabungkan
impor fallback CLI eksternal; gunakan tampilan ekor-terbaru default saat Anda
membutuhkan riwayat tampilan gabungan tersebut.
Tampilan yang dikembalikan sengaja dibatasi dan difilter demi keamanan:

- teks asisten dinormalisasi sebelum pemanggilan kembali:
  - tag pemikiran dihapus
  - blok kerangka `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML pemanggilan alat teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan bersih
  - kerangka pemanggilan/hasil alat yang diturunkan seperti `[Tool Call: ...]`,
    `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian lebar penuh `<｜...｜>` dihapus
  - XML pemanggilan alat MiniMax yang tidak valid seperti `<invoke ...>` /
    `</minimax:tool_call>` dihapus
- teks yang menyerupai kredensial/token disunting sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat menghapus baris lama atau mengganti baris yang
  terlalu besar dengan `[sessions_history omitted: message too large]`
- alat melaporkan flag ringkasan seperti `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes`, dan metadata paginasi

Kedua alat menerima **key sesi** (seperti `"main"`) atau **ID sesi**
dari panggilan daftar sebelumnya.

Jika Anda membutuhkan transkrip yang persis byte demi byte, periksa file transkrip
di disk alih-alih memperlakukan `sessions_history` sebagai dump mentah.

## Mengirim pesan lintas sesi

`sessions_send` mengirimkan pesan ke sesi lain dan secara opsional menunggu
respons:

- **Kirim lalu lupakan:** tetapkan `timeoutSeconds: 0` untuk mengantrekan dan
  langsung kembali.
- **Tunggu balasan:** tetapkan batas waktu dan dapatkan respons secara inline.

Sesi obrolan bercakupan thread, seperti key Slack atau Discord yang berakhiran
`:thread:<id>`, bukan target `sessions_send` yang valid. Gunakan key sesi kanal
induk untuk koordinasi antar agen agar pesan yang dirutekan alat tidak muncul
di dalam thread aktif yang menghadap manusia.

Pesan dan balasan lanjutan A2A ditandai sebagai data antarsesi dalam prompt
penerima (`[Inter-session message ... isUser=false]`) dan dalam asal-usul
transkrip. Agen penerima harus memperlakukannya sebagai data yang dirutekan alat,
bukan sebagai instruksi langsung yang ditulis pengguna akhir.

Setelah target merespons, OpenClaw dapat menjalankan **loop balas balik** tempat
agen bergantian mengirim pesan (hingga `session.agentToAgent.maxPingPongTurns`,
rentang 0-20, default 5). Agen target dapat membalas
`REPLY_SKIP` untuk berhenti lebih awal.

## Pembantu status dan orkestrasi

`session_status` adalah alat ringan yang setara dengan `/status` untuk sesi saat
ini atau sesi lain yang terlihat. Alat ini melaporkan penggunaan, waktu, status
model/runtime, dan konteks tugas latar belakang tertaut jika ada. Seperti
`/status`, alat ini dapat mengisi balik penghitung token/cache yang jarang dari
entri penggunaan transkrip terbaru, dan `model=default` menghapus penggantian
per sesi. Gunakan `sessionKey="current"` untuk sesi pemanggil saat ini; label
klien yang terlihat seperti `openclaw-tui` bukan key sesi.

Saat metadata rute tersedia, `session_status` juga menyertakan blok JSON
`Route context` yang terlihat dan field `details` terstruktur yang cocok. Field
ini membedakan key sesi dari rute yang saat ini menangani proses live:

- `origin` adalah tempat sesi dibuat, atau penyedia yang disimpulkan dari prefiks
  key sesi yang dapat dikirim saat state lama tidak memiliki metadata asal yang tersimpan.
- `active` adalah rute proses live saat ini. Ini hanya dilaporkan untuk sesi live
  atau saat ini yang sedang ditangani sekarang.
- `deliveryContext` adalah rute pengiriman persisten yang disimpan pada sesi,
  yang dapat digunakan kembali oleh OpenClaw untuk pengiriman berikutnya bahkan
  saat permukaan aktif berbeda.

`sessions_yield` sengaja mengakhiri giliran saat ini agar pesan berikutnya dapat
menjadi event lanjutan yang Anda tunggu. Gunakan setelah membuat sub-agen saat
Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih membangun
loop polling.

`subagents` adalah pembantu visibilitas untuk sub-agen OpenClaw yang sudah
dibuat. Ini mendukung `action: "list"` untuk memeriksa proses aktif/terbaru.

## Membuat sub-agen

`sessions_spawn` membuat sesi terisolasi untuk tugas latar belakang secara
default. Alat ini selalu non-pemblokiran -- langsung kembali dengan `runId` dan
`childSessionKey`. Proses sub-agen native menerima tugas yang didelegasikan dalam
pesan `[Subagent Task]` pertama yang terlihat di sesi anak, sementara prompt
sistem hanya membawa aturan runtime sub-agen dan konteks perutean.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agen harness eksternal.
- Penggantian `model` dan `thinking` untuk sesi anak.
- `thread: true` untuk mengikat pembuatan ke thread obrolan (Discord, Slack, dll.).
- `sandbox: "require"` untuk memberlakukan sandboxing pada anak.
- `context: "fork"` untuk sub-agen native saat anak membutuhkan transkrip peminta
  saat ini; hilangkan atau gunakan `context: "isolated"` untuk anak yang bersih.
  Sub-agen native yang terikat thread menggunakan `context: "fork"` secara default
  kecuali `threadBindings.defaultSpawnContext` menyatakan lain.

Sub-agen leaf default tidak mendapatkan alat sesi. Saat
`maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 juga menerima
`sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` agar mereka
dapat mengelola anaknya sendiri. Proses leaf tetap tidak mendapatkan alat
orkestrasi rekursif.

Setelah selesai, langkah pengumuman memposting hasil ke kanal peminta.
Pengiriman penyelesaian mempertahankan perutean thread/topik terikat saat tersedia,
dan jika asal penyelesaian hanya mengidentifikasi kanal, OpenClaw masih dapat
menggunakan kembali rute tersimpan sesi peminta (`lastChannel` / `lastTo`) untuk
pengiriman langsung.

Untuk perilaku khusus ACP, lihat [Agen ACP](/id/tools/acp-agents).

## Visibilitas

Alat sesi dicakup untuk membatasi apa yang dapat dilihat agen:

| Level   | Cakupan                                  |
| ------- | ---------------------------------------- |
| `self`  | Hanya sesi saat ini                      |
| `tree`  | Sesi saat ini + sub-agen yang dibuat     |
| `agent` | Semua sesi untuk agen ini                |
| `all`   | Semua sesi (lintas agen jika dikonfigurasi) |

Default-nya adalah `tree`. Sesi bersandbox dibatasi ke `tree` terlepas dari
konfigurasi.

## Bacaan lebih lanjut

- [Manajemen Sesi](/id/concepts/session) -- perutean, siklus hidup, pemeliharaan
- [Agen ACP](/id/tools/acp-agents) -- pembuatan harness eksternal
- [Multi-agen](/id/concepts/multi-agent) -- arsitektur multi-agen
- [Konfigurasi Gateway](/id/gateway/configuration) -- kenop konfigurasi alat sesi

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
