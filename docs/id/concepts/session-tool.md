---
read_when:
    - Anda ingin memahami alat sesi apa yang dimiliki agen
    - Anda ingin mengonfigurasi akses lintas sesi atau pembuatan sub-agen
    - Anda ingin memeriksa status sub-agent yang dijalankan
summary: Alat agen untuk status lintas sesi, ingatan, pesan, dan orkestrasi sub-agen
title: Alat sesi
x-i18n:
    generated_at: "2026-06-27T17:26:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw memberi agen alat untuk bekerja lintas sesi, memeriksa status, dan
mengorkestrasi sub-agen.

## Alat yang tersedia

| Alat               | Fungsinya                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Mencantumkan sesi dengan filter opsional (jenis, label, agen, kebaruan, pratinjau) |
| `sessions_history` | Membaca transkrip sesi tertentu                                             |
| `sessions_send`    | Mengirim pesan ke sesi lain dan secara opsional menunggu                    |
| `sessions_spawn`   | Membuat sesi sub-agen terisolasi untuk pekerjaan latar belakang             |
| `sessions_yield`   | Mengakhiri giliran saat ini dan menunggu hasil tindak lanjut sub-agen       |
| `subagents`        | Mencantumkan status sub-agen yang dibuat untuk sesi ini                     |
| `session_status`   | Menampilkan kartu bergaya `/status` dan secara opsional mengatur override model per sesi |

Alat ini tetap tunduk pada profil alat aktif dan kebijakan izinkan/tolak.
`tools.profile: "coding"` menyertakan set orkestrasi sesi lengkap, termasuk
`sessions_spawn`, `sessions_yield`, dan `subagents`.
`tools.profile: "messaging"` menyertakan alat perpesanan lintas sesi
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) tetapi
tidak menyertakan pembuatan sub-agen. Untuk mempertahankan profil perpesanan dan tetap
mengizinkan delegasi native, tambahkan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Kebijakan grup, penyedia, sandbox, dan per-agen tetap dapat menghapus alat tersebut
setelah tahap profil. Gunakan `/tools` dari sesi yang terdampak untuk memeriksa
daftar alat efektif.

## Mencantumkan dan membaca sesi

`sessions_list` mengembalikan sesi beserta key, agentId, jenis, channel, model,
jumlah token, dan timestamp. Filter berdasarkan jenis (`main`, `group`, `cron`, `hook`,
`node`), `label` persis, `agentId` persis, teks pencarian, atau kebaruan
(`activeMinutes`). Saat Anda memerlukan triase bergaya kotak masuk, alat ini juga dapat meminta
judul turunan dengan cakupan visibilitas, cuplikan pratinjau pesan terakhir, atau pesan terbaru
yang dibatasi pada setiap baris. Judul turunan dan pratinjau hanya dibuat untuk sesi
yang sudah dapat dilihat pemanggil berdasarkan kebijakan visibilitas alat sesi yang dikonfigurasi, sehingga
sesi yang tidak terkait tetap tersembunyi. Saat visibilitas dibatasi, `sessions_list`
mengembalikan metadata `visibility` opsional yang menunjukkan mode efektif dan peringatan bahwa
hasil mungkin dibatasi cakupannya.

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu.
Secara default, hasil alat dikecualikan -- berikan `includeTools: true` untuk melihatnya.
Tampilan yang dikembalikan sengaja dibatasi dan difilter demi keselamatan:

- teks asisten dinormalisasi sebelum recall:
  - tag berpikir dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML panggilan alat teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah ditutup dengan bersih
  - scaffolding panggilan/hasil alat yang diturunkan seperti `[Tool Call: ...]`,
    `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII lain
    `<|...|>`, dan varian lebar penuh `<｜...｜>` dihapus
  - XML panggilan alat MiniMax yang salah bentuk seperti `<invoke ...>` /
    `</minimax:tool_call>` dihapus
- teks yang menyerupai kredensial/token disunting sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat menghapus baris lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- alat melaporkan flag ringkasan seperti `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, dan `bytes`

Kedua alat menerima **key sesi** (seperti `"main"`) atau **ID sesi**
dari pemanggilan daftar sebelumnya.

Jika Anda memerlukan transkrip byte-demi-byte yang persis, periksa file transkrip di
disk alih-alih memperlakukan `sessions_history` sebagai dump mentah.

## Mengirim pesan lintas sesi

`sessions_send` mengirimkan pesan ke sesi lain dan secara opsional menunggu
respons:

- **Kirim dan lupakan:** atur `timeoutSeconds: 0` untuk mengantrekan dan kembali
  segera.
- **Tunggu balasan:** atur timeout dan dapatkan respons secara inline.

Sesi chat bercakupan thread, seperti key Slack atau Discord yang diakhiri dengan
`:thread:<id>`, bukan target `sessions_send` yang valid. Gunakan key sesi channel induk
untuk koordinasi antar-agen agar pesan yang dirutekan alat tidak muncul
di dalam thread aktif yang menghadap manusia.

Pesan dan balasan tindak lanjut A2A ditandai sebagai data antarsesi di prompt
penerima (`[Inter-session message ... isUser=false]`) dan dalam provenance transkrip.
Agen penerima harus memperlakukannya sebagai data yang dirutekan alat, bukan sebagai
instruksi langsung yang ditulis pengguna akhir.

Setelah target merespons, OpenClaw dapat menjalankan **loop balas-kembali** tempat
agen bergantian mengirim pesan (hingga `session.agentToAgent.maxPingPongTurns`, rentang
0-20, default 5). Agen target dapat membalas
`REPLY_SKIP` untuk berhenti lebih awal.

## Pembantu status dan orkestrasi

`session_status` adalah alat ringan yang setara dengan `/status` untuk sesi saat ini
atau sesi lain yang terlihat. Alat ini melaporkan penggunaan, waktu, status model/runtime, dan
konteks tugas latar belakang tertaut jika ada. Seperti `/status`, alat ini dapat mengisi balik
penghitung token/cache yang jarang dari entri penggunaan transkrip terbaru, dan
`model=default` menghapus override per sesi. Gunakan `sessionKey="current"` untuk
sesi pemanggil saat ini; label klien yang terlihat seperti `openclaw-tui` bukan
key sesi.

Saat metadata rute tersedia, `session_status` juga menyertakan blok JSON
`Route context` yang terlihat dan field `details` terstruktur yang cocok. Field ini
membedakan key sesi dari rute yang saat ini menangani live run:

- `origin` adalah tempat sesi dibuat, atau penyedia yang disimpulkan dari prefiks
  key sesi yang dapat dikirim saat state lama tidak memiliki metadata origin tersimpan.
- `active` adalah rute live-run saat ini. Ini hanya dilaporkan untuk sesi live atau
  sesi saat ini yang sedang ditangani sekarang.
- `deliveryContext` adalah rute pengiriman tersimpan yang disimpan pada sesi,
  yang dapat digunakan kembali oleh OpenClaw untuk pengiriman berikutnya meskipun surface aktif
  berbeda.

`sessions_yield` sengaja mengakhiri giliran saat ini agar pesan berikutnya dapat menjadi
event tindak lanjut yang Anda tunggu. Gunakan setelah membuat sub-agen saat
Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih membangun
loop polling.

`subagents` adalah pembantu visibilitas untuk sub-agen OpenClaw yang sudah dibuat.
Alat ini mendukung `action: "list"` untuk memeriksa run aktif/terbaru.

## Membuat sub-agen

`sessions_spawn` membuat sesi terisolasi untuk tugas latar belakang secara default.
Alat ini selalu non-blocking -- langsung mengembalikan `runId` dan
`childSessionKey`. Run sub-agen native menerima tugas yang didelegasikan dalam
pesan `[Subagent Task]` pertama yang terlihat pada sesi anak, sementara prompt sistem
hanya membawa aturan runtime sub-agen dan konteks routing.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agen harness eksternal.
- Override `model` dan `thinking` untuk sesi anak.
- `thread: true` untuk mengikat spawn ke thread chat (Discord, Slack, dll.).
- `sandbox: "require"` untuk menerapkan sandboxing pada anak.
- `context: "fork"` untuk sub-agen native saat anak memerlukan transkrip requester
  saat ini; hilangkan atau gunakan `context: "isolated"` untuk anak yang bersih.
  Sub-agen native yang terikat thread default ke `context: "fork"` kecuali
  `threadBindings.defaultSpawnContext` menyatakan sebaliknya.

Sub-agen leaf default tidak mendapatkan alat sesi. Saat
`maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 juga menerima
`sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` agar mereka
dapat mengelola anak mereka sendiri. Run leaf tetap tidak mendapatkan alat
orkestrasi rekursif.

Setelah selesai, langkah pengumuman memposting hasil ke channel requester.
Pengiriman penyelesaian mempertahankan routing thread/topik terikat jika tersedia, dan jika
origin penyelesaian hanya mengidentifikasi channel, OpenClaw tetap dapat menggunakan kembali
rute tersimpan sesi requester (`lastChannel` / `lastTo`) untuk pengiriman
langsung.

Untuk perilaku khusus ACP, lihat [Agen ACP](/id/tools/acp-agents).

## Visibilitas

Alat sesi dicakup untuk membatasi apa yang dapat dilihat agen:

| Level   | Cakupan                                  |
| ------- | ---------------------------------------- |
| `self`  | Hanya sesi saat ini                      |
| `tree`  | Sesi saat ini + sub-agen yang dibuat     |
| `agent` | Semua sesi untuk agen ini                |
| `all`   | Semua sesi (lintas agen jika dikonfigurasi) |

Default adalah `tree`. Sesi bersandbox dibatasi ke `tree` terlepas dari
konfigurasi.

## Bacaan lebih lanjut

- [Manajemen Sesi](/id/concepts/session) -- routing, lifecycle, pemeliharaan
- [Agen ACP](/id/tools/acp-agents) -- pembuatan harness eksternal
- [Multi-agen](/id/concepts/multi-agent) -- arsitektur multi-agen
- [Konfigurasi Gateway](/id/gateway/configuration) -- knob konfigurasi alat sesi

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
