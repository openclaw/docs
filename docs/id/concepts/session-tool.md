---
read_when:
    - Anda ingin memahami alat sesi apa yang dimiliki agen
    - Anda ingin mengonfigurasi akses lintas sesi atau pembuatan sub-agen
    - Anda ingin memeriksa status atau mengontrol sub-agen yang diluncurkan
summary: Alat agen untuk status lintas sesi, pengingatan kembali, pengiriman pesan, dan orkestrasi sub-agen
title: Alat sesi
x-i18n:
    generated_at: "2026-05-11T20:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e91f1f956ff882cabf7df51bd8c08836398decfb185c56c42db4052f24b3f716
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw memberi agen alat untuk bekerja lintas sesi, memeriksa status, dan
mengorkestrasi sub-agen.

## Alat yang tersedia

| Alat               | Yang dilakukannya                                                              |
| ------------------ | ------------------------------------------------------------------------------ |
| `sessions_list`    | Mencantumkan sesi dengan filter opsional (jenis, label, agen, kebaruan, pratinjau) |
| `sessions_history` | Membaca transkrip sesi tertentu                                                |
| `sessions_send`    | Mengirim pesan ke sesi lain dan secara opsional menunggu                       |
| `sessions_spawn`   | Membuat sesi sub-agen terisolasi untuk pekerjaan latar belakang                |
| `sessions_yield`   | Mengakhiri giliran saat ini dan menunggu hasil sub-agen lanjutan               |
| `subagents`        | Mencantumkan, mengarahkan, atau menghentikan sub-agen yang dibuat untuk sesi ini |
| `session_status`   | Menampilkan kartu bergaya `/status` dan secara opsional menetapkan override model per sesi |

Alat ini tetap tunduk pada profil alat aktif dan kebijakan izinkan/tolak.
`tools.profile: "coding"` menyertakan set orkestrasi sesi lengkap, termasuk
`sessions_spawn`, `sessions_yield`, dan `subagents`. `tools.profile:
"messaging"` menyertakan alat perpesanan lintas sesi (`sessions_list`,
`sessions_history`, `sessions_send`, `session_status`) tetapi tidak menyertakan
pembuatan sub-agen. Untuk mempertahankan profil perpesanan dan tetap
mengizinkan delegasi native, tambahkan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Kebijakan grup, penyedia, sandbox, dan per-agen tetap dapat menghapus alat
tersebut setelah tahap profil. Gunakan `/tools` dari sesi yang terdampak untuk
memeriksa daftar alat efektif.

## Mencantumkan dan membaca sesi

`sessions_list` mengembalikan sesi beserta key, agentId, jenis, channel, model,
jumlah token, dan timestamp-nya. Filter menurut jenis (`main`, `group`, `cron`,
`hook`, `node`), `label` persis, `agentId` persis, teks pencarian, atau kebaruan
(`activeMinutes`). Saat Anda memerlukan triase bergaya kotak masuk, alat ini juga
dapat meminta judul turunan yang tercakup visibilitas, cuplikan pratinjau pesan
terakhir, atau pesan terbaru terbatas pada setiap baris. Judul turunan dan
pratinjau hanya dibuat untuk sesi yang sudah dapat dilihat pemanggil berdasarkan
kebijakan visibilitas alat sesi yang dikonfigurasi, sehingga sesi yang tidak
terkait tetap tersembunyi.

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu. Secara
default, hasil alat dikecualikan -- teruskan `includeTools: true` untuk
melihatnya. Tampilan yang dikembalikan sengaja dibatasi dan difilter untuk
keamanan:

- teks asisten dinormalisasi sebelum dipanggil kembali:
  - tag berpikir dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML panggilan alat teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan bersih
  - scaffolding panggilan/hasil alat yang diturunkan seperti `[Tool Call: ...]`,
    `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian lebar-penuh `<｜...｜>` dihapus
  - XML panggilan alat MiniMax yang tidak valid seperti `<invoke ...>` /
    `</minimax:tool_call>` dihapus
- teks yang menyerupai kredensial/token disunting sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat menghapus baris lama atau mengganti baris yang
  terlalu besar dengan `[sessions_history omitted: message too large]`
- alat melaporkan flag ringkasan seperti `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, dan `bytes`

Kedua alat menerima **key sesi** (seperti `"main"`) atau **ID sesi** dari
pemanggilan daftar sebelumnya.

Jika Anda memerlukan transkrip yang persis byte demi byte, periksa file transkrip
di disk alih-alih memperlakukan `sessions_history` sebagai dump mentah.

## Mengirim pesan lintas sesi

`sessions_send` mengirimkan pesan ke sesi lain dan secara opsional menunggu
respons:

- **Kirim-lalu-lupakan:** tetapkan `timeoutSeconds: 0` untuk mengantrekan dan
  segera kembali.
- **Tunggu balasan:** tetapkan timeout dan dapatkan respons secara inline.

Sesi chat yang tercakup thread, seperti key Slack atau Discord yang diakhiri
`:thread:<id>`, bukan target `sessions_send` yang valid. Gunakan key sesi channel
induk untuk koordinasi antar-agen agar pesan yang dirutekan alat tidak muncul di
dalam thread aktif yang menghadap manusia.

Pesan dan balasan tindak lanjut A2A ditandai sebagai data antar-sesi dalam prompt
penerima (`[Inter-session message ... isUser=false]`) dan dalam provenance
transkrip. Agen penerima harus memperlakukannya sebagai data yang dirutekan alat,
bukan sebagai instruksi langsung yang ditulis pengguna akhir.

Setelah target merespons, OpenClaw dapat menjalankan **loop balas-kembali** tempat
agen bergantian mengirim pesan (hingga `session.agentToAgent.maxPingPongTurns`,
rentang 0-20, default 5). Agen target dapat membalas `REPLY_SKIP` untuk berhenti
lebih awal.

## Pembantu status dan orkestrasi

`session_status` adalah alat ringan yang setara dengan `/status` untuk sesi saat
ini atau sesi lain yang terlihat. Alat ini melaporkan penggunaan, waktu, status
model/runtime, dan konteks tugas latar belakang tertaut jika ada. Seperti
`/status`, alat ini dapat mengisi balik penghitung token/cache yang jarang dari
entri penggunaan transkrip terbaru, dan `model=default` menghapus override per
sesi. Gunakan `sessionKey="current"` untuk sesi pemanggil saat ini; label klien
yang terlihat seperti `openclaw-tui` bukan key sesi.

`sessions_yield` sengaja mengakhiri giliran saat ini agar pesan berikutnya dapat
menjadi peristiwa lanjutan yang Anda tunggu. Gunakan setelah membuat sub-agen
saat Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih
membuat loop polling.

`subagents` adalah pembantu control plane untuk sub-agen OpenClaw yang sudah
dibuat. Alat ini mendukung:

- `action: "list"` untuk memeriksa run aktif/terbaru
- `action: "steer"` untuk mengirim arahan lanjutan ke child yang sedang berjalan
- `action: "kill"` untuk menghentikan satu child atau `all`

## Membuat sub-agen

`sessions_spawn` secara default membuat sesi terisolasi untuk tugas latar
belakang. Alat ini selalu non-blocking -- langsung kembali dengan `runId` dan
`childSessionKey`.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agen harness eksternal.
- Override `model` dan `thinking` untuk sesi child.
- `thread: true` untuk mengikat spawn ke thread chat (Discord, Slack, dll.).
- `sandbox: "require"` untuk memberlakukan sandboxing pada child.
- `context: "fork"` untuk sub-agen native saat child memerlukan transkrip
  peminta saat ini; hilangkan atau gunakan `context: "isolated"` untuk child
  bersih. Sub-agen native yang terikat thread default ke `context: "fork"` kecuali
  `threadBindings.defaultSpawnContext` menyatakan sebaliknya.

Sub-agen leaf default tidak mendapatkan alat sesi. Saat `maxSpawnDepth >= 2`,
sub-agen orkestrator depth-1 juga menerima `sessions_spawn`, `subagents`,
`sessions_list`, dan `sessions_history` agar dapat mengelola child mereka
sendiri. Run leaf tetap tidak mendapatkan alat orkestrasi rekursif.

Setelah selesai, langkah pengumuman memposting hasil ke channel peminta.
Pengiriman penyelesaian mempertahankan perutean thread/topik terikat saat
tersedia, dan jika origin penyelesaian hanya mengidentifikasi channel, OpenClaw
tetap dapat menggunakan kembali rute tersimpan sesi peminta (`lastChannel` /
`lastTo`) untuk pengiriman langsung.

Untuk perilaku khusus ACP, lihat [Agen ACP](/id/tools/acp-agents).

## Visibilitas

Alat sesi dicakup untuk membatasi apa yang dapat dilihat agen:

| Level   | Cakupan                                  |
| ------- | ---------------------------------------- |
| `self`  | Hanya sesi saat ini                      |
| `tree`  | Sesi saat ini + sub-agen yang dibuat     |
| `agent` | Semua sesi untuk agen ini                |
| `all`   | Semua sesi (lintas-agen jika dikonfigurasi) |

Default adalah `tree`. Sesi dalam sandbox dibatasi ke `tree` terlepas dari
konfigurasi.

## Bacaan lebih lanjut

- [Manajemen Sesi](/id/concepts/session) -- perutean, lifecycle, pemeliharaan
- [Agen ACP](/id/tools/acp-agents) -- pembuatan harness eksternal
- [Multi-agen](/id/concepts/multi-agent) -- arsitektur multi-agen
- [Konfigurasi Gateway](/id/gateway/configuration) -- knob konfigurasi alat sesi

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
