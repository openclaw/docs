---
read_when:
    - Anda ingin memahami alat sesi apa saja yang dimiliki agen
    - Anda ingin mengonfigurasi akses lintas sesi atau pemunculan sub-agen
    - Anda ingin memeriksa status sub-agent yang di-spawn
summary: Alat agen untuk status lintas sesi, pengingatan, perpesanan, dan orkestrasi sub-agen
title: Alat sesi
x-i18n:
    generated_at: "2026-06-28T00:12:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffc7edf68e4510ea6a5fe93238be32e9d7eacf8e7b49e58f63536c14bbe2da80
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw memberi agen alat untuk bekerja lintas sesi, memeriksa status, dan
mengorkestrasi sub-agen.

## Alat yang tersedia

| Alat               | Fungsinya                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Mencantumkan sesi dengan filter opsional (jenis, label, agen, keterkinian, pratinjau) |
| `sessions_history` | Membaca transkrip sesi tertentu                                             |
| `sessions_send`    | Mengirim pesan ke sesi lain dan opsional menunggu                           |
| `sessions_spawn`   | Membuat sesi sub-agen terisolasi untuk pekerjaan latar belakang             |
| `sessions_yield`   | Mengakhiri giliran saat ini dan menunggu hasil tindak lanjut sub-agen       |
| `subagents`        | Mencantumkan status sub-agen yang dibuat untuk sesi ini                     |
| `session_status`   | Menampilkan kartu bergaya `/status` dan opsional menetapkan override model per sesi |

Alat-alat ini tetap tunduk pada profil alat aktif dan kebijakan izinkan/tolak.
`tools.profile: "coding"` mencakup set orkestrasi sesi penuh, termasuk
`sessions_spawn`, `sessions_yield`, dan `subagents`.
`tools.profile: "messaging"` mencakup alat perpesanan lintas sesi
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) tetapi
tidak mencakup pembuatan sub-agen. Untuk mempertahankan profil perpesanan dan tetap
mengizinkan delegasi native, tambahkan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Kebijakan grup, penyedia, sandbox, dan per-agen masih dapat menghapus alat-alat itu
setelah tahap profil. Gunakan `/tools` dari sesi yang terdampak untuk memeriksa
daftar alat efektif.

## Mencantumkan dan membaca sesi

`sessions_list` mengembalikan sesi beserta key, agentId, kind, channel, model,
jumlah token, dan stempel waktunya. Filter berdasarkan jenis (`main`, `group`, `cron`, `hook`,
`node`), `label` persis, `agentId` persis, teks pencarian, atau keterkinian
(`activeMinutes`). Saat Anda memerlukan triase bergaya kotak surat, alat ini juga dapat meminta
judul turunan yang dibatasi visibilitas, cuplikan pratinjau pesan terakhir, atau pesan terbaru
yang dibatasi pada tiap baris. Judul turunan dan pratinjau hanya dibuat untuk sesi
yang sudah dapat dilihat pemanggil berdasarkan kebijakan visibilitas alat sesi yang dikonfigurasi, sehingga
sesi yang tidak terkait tetap tersembunyi. Saat visibilitas dibatasi, `sessions_list`
mengembalikan metadata `visibility` opsional yang menampilkan mode efektif dan peringatan bahwa
hasil mungkin terbatas cakupan.

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu.
Secara default, hasil alat dikecualikan -- berikan `includeTools: true` untuk melihatnya.
Gunakan `limit` untuk ekor terbaru yang dibatasi. Berikan `offset: 0` saat Anda memerlukan
metadata paginasi, lalu berikan nilai `nextOffset` yang dikembalikan untuk membuka halaman mundur
melalui jendela transkrip OpenClaw yang lebih lama tanpa membaca file transkrip mentah.
Halaman offset eksplisit tidak menggabungkan impor fallback CLI eksternal; gunakan tampilan
ekor-terbaru default saat Anda memerlukan riwayat tampilan gabungan tersebut.
Tampilan yang dikembalikan sengaja dibatasi dan difilter untuk keselamatan:

- teks asisten dinormalisasi sebelum diingat:
  - tag thinking dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML panggilan alat teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah ditutup dengan rapi
  - scaffolding panggilan/hasil alat yang diturunkan seperti `[Tool Call: ...]`,
    `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lain, dan varian lebar penuh `<｜...｜>` dihapus
  - XML panggilan alat MiniMax yang cacat seperti `<invoke ...>` /
    `</minimax:tool_call>` dihapus
- teks yang menyerupai kredensial/token disamarkan sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat membuang baris lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- alat melaporkan flag ringkasan seperti `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes`, dan metadata paginasi

Kedua alat menerima **session key** (seperti `"main"`) atau **ID sesi**
dari panggilan daftar sebelumnya.

Jika Anda memerlukan transkrip persis byte demi byte, periksa file transkrip di
disk alih-alih memperlakukan `sessions_history` sebagai dump mentah.

## Mengirim pesan lintas sesi

`sessions_send` mengirimkan pesan ke sesi lain dan opsional menunggu
respons:

- **Kirim lalu lupakan:** tetapkan `timeoutSeconds: 0` untuk mengantrekan dan kembali
  segera.
- **Tunggu balasan:** tetapkan batas waktu dan dapatkan respons secara inline.

Sesi chat bercakupan thread, seperti key Slack atau Discord yang berakhir dengan
`:thread:<id>`, bukan target `sessions_send` yang valid. Gunakan key sesi kanal induk
untuk koordinasi antar-agen agar pesan yang dirutekan alat tidak muncul
di dalam thread aktif yang menghadap manusia.

Pesan dan balasan tindak lanjut A2A ditandai sebagai data antar-sesi dalam
prompt penerima (`[Inter-session message ... isUser=false]`) dan dalam asal-usul transkrip.
Agen penerima harus memperlakukannya sebagai data yang dirutekan alat, bukan sebagai
instruksi langsung yang ditulis pengguna akhir.

Setelah target merespons, OpenClaw dapat menjalankan **loop balas-kembali** tempat para
agen bergantian mengirim pesan (hingga `session.agentToAgent.maxPingPongTurns`, rentang
0-20, default 5). Agen target dapat membalas
`REPLY_SKIP` untuk berhenti lebih awal.

## Pembantu status dan orkestrasi

`session_status` adalah alat ringan yang setara dengan `/status` untuk sesi saat ini
atau sesi lain yang terlihat. Alat ini melaporkan penggunaan, waktu, status model/runtime, dan
konteks tugas latar belakang tertaut bila ada. Seperti `/status`, alat ini dapat mengisi balik
penghitung token/cache yang jarang dari entri penggunaan transkrip terbaru, dan
`model=default` menghapus override per sesi. Gunakan `sessionKey="current"` untuk
sesi saat ini milik pemanggil; label klien yang terlihat seperti `openclaw-tui` bukan
session key.

Saat metadata rute tersedia, `session_status` juga menyertakan blok JSON
`Route context` yang terlihat dan field `details` terstruktur yang cocok. Field ini
membedakan session key dari rute yang saat ini menangani
live run:

- `origin` adalah tempat sesi dibuat, atau penyedia yang disimpulkan dari
  prefiks session-key yang dapat dikirim saat state lama tidak memiliki metadata origin tersimpan.
- `active` adalah rute live-run saat ini. Ini hanya dilaporkan untuk sesi live atau
  sesi saat ini yang sedang ditangani sekarang.
- `deliveryContext` adalah rute pengiriman persisten yang disimpan pada sesi,
  yang dapat digunakan kembali OpenClaw untuk pengiriman berikutnya bahkan saat permukaan aktif
  berbeda.

`sessions_yield` sengaja mengakhiri giliran saat ini agar pesan berikutnya dapat menjadi
event tindak lanjut yang Anda tunggu. Gunakan setelah membuat sub-agen saat
Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih membuat
loop polling.

`subagents` adalah pembantu visibilitas untuk sub-agen OpenClaw yang sudah
dibuat. Alat ini mendukung `action: "list"` untuk memeriksa run aktif/terbaru.

## Membuat sub-agen

`sessions_spawn` membuat sesi terisolasi untuk tugas latar belakang secara default.
Alat ini selalu non-pemblokiran -- langsung mengembalikan `runId` dan
`childSessionKey`. Run sub-agen native menerima tugas yang didelegasikan dalam
pesan `[Subagent Task]` pertama yang terlihat di sesi anak, sementara prompt sistem
hanya membawa aturan runtime sub-agen dan konteks perutean.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agen harness eksternal.
- Override `model` dan `thinking` untuk sesi anak.
- `thread: true` untuk mengikat spawn ke thread chat (Discord, Slack, dll.).
- `sandbox: "require"` untuk memberlakukan sandboxing pada anak.
- `context: "fork"` untuk sub-agen native saat anak memerlukan transkrip pemohon saat ini;
  hilangkan atau gunakan `context: "isolated"` untuk anak yang bersih.
  Sub-agen native yang terikat thread default ke `context: "fork"` kecuali
  `threadBindings.defaultSpawnContext` menyatakan lain.

Sub-agen leaf default tidak mendapatkan alat sesi. Saat
`maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 juga menerima
`sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` agar mereka
dapat mengelola anak mereka sendiri. Run leaf tetap tidak mendapatkan alat
orkestrasi rekursif.

Setelah selesai, langkah pengumuman memposting hasil ke kanal pemohon.
Pengiriman penyelesaian mempertahankan perutean thread/topik terikat bila tersedia, dan jika
origin penyelesaian hanya mengidentifikasi kanal, OpenClaw masih dapat menggunakan ulang
rute tersimpan sesi pemohon (`lastChannel` / `lastTo`) untuk pengiriman
langsung.

Untuk perilaku khusus ACP, lihat [Agen ACP](/id/tools/acp-agents).

## Visibilitas

Alat sesi dibatasi cakupannya untuk membatasi apa yang dapat dilihat agen:

| Level   | Cakupan                                  |
| ------- | ---------------------------------------- |
| `self`  | Hanya sesi saat ini                      |
| `tree`  | Sesi saat ini + sub-agen yang dibuat     |
| `agent` | Semua sesi untuk agen ini                |
| `all`   | Semua sesi (lintas-agen jika dikonfigurasi) |

Default adalah `tree`. Sesi yang di-sandbox dikunci ke `tree` terlepas dari
konfigurasi.

## Bacaan lebih lanjut

- [Manajemen Sesi](/id/concepts/session) -- perutean, siklus hidup, pemeliharaan
- [Agen ACP](/id/tools/acp-agents) -- pembuatan harness eksternal
- [Multi-agen](/id/concepts/multi-agent) -- arsitektur multi-agen
- [Konfigurasi Gateway](/id/gateway/configuration) -- knob konfigurasi alat sesi

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
