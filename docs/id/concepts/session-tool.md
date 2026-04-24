---
read_when:
    - Anda ingin memahami tool sesi apa yang dimiliki agen
    - Anda ingin mengonfigurasi akses lintas sesi atau spawn sub-agen
    - Anda ingin memeriksa status atau mengontrol sub-agen yang di-spawn
summary: Tool agen untuk status lintas sesi, recall, pengiriman pesan, dan orkestrasi sub-agen
title: Tool sesi
x-i18n:
    generated_at: "2026-04-24T09:05:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw memberi agen tool untuk bekerja lintas sesi, memeriksa status, dan
mengorkestrasi sub-agen.

## Tool yang tersedia

| Tool               | Fungsinya                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Mencantumkan sesi dengan filter opsional (jenis, label, agen, recency, preview) |
| `sessions_history` | Membaca transkrip sesi tertentu                                            |
| `sessions_send`    | Mengirim pesan ke sesi lain dan secara opsional menunggu                   |
| `sessions_spawn`   | Men-spawn sesi sub-agen terisolasi untuk pekerjaan latar belakang          |
| `sessions_yield`   | Mengakhiri giliran saat ini dan menunggu hasil sub-agen lanjutan           |
| `subagents`        | Mencantumkan, mengarahkan, atau mematikan sub-agen yang di-spawn untuk sesi ini |
| `session_status`   | Menampilkan kartu ala `/status` dan secara opsional menetapkan override model per sesi |

## Mencantumkan dan membaca sesi

`sessions_list` mengembalikan sesi dengan key, agentId, jenis, channel, model,
jumlah token, dan stempel waktu. Filter menurut jenis (`main`, `group`, `cron`, `hook`,
`node`), `label` persis, `agentId` persis, teks pencarian, atau recency
(`activeMinutes`). Saat Anda memerlukan triase ala mailbox, tool ini juga dapat meminta
judul turunan dengan cakupan visibilitas, cuplikan pratinjau pesan terakhir, atau
pesan terbaru yang dibatasi pada setiap baris. Judul turunan dan pratinjau hanya dihasilkan untuk
sesi yang sudah bisa dilihat pemanggil berdasarkan kebijakan visibilitas tool sesi yang
dikonfigurasi, sehingga sesi yang tidak terkait tetap tersembunyi.

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu.
Secara default, hasil tool dikecualikan -- berikan `includeTools: true` untuk melihatnya.
Tampilan yang dikembalikan sengaja dibatasi dan difilter demi keamanan:

- teks asisten dinormalkan sebelum recall:
  - tag thinking dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML tool-call teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan bersih
  - scaffolding tool-call/result yang diturunkan seperti `[Tool Call: ...]`,
    `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian full-width `<｜...｜>` dihapus
  - XML tool-call MiniMax yang malform seperti `<invoke ...>` /
    `</minimax:tool_call>` dihapus
- teks mirip kredensial/token disunting sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat menjatuhkan baris yang lebih lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- tool ini melaporkan flag ringkasan seperti `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, dan `bytes`

Kedua tool menerima **session key** (seperti `"main"`) atau **session ID**
dari pemanggilan list sebelumnya.

Jika Anda memerlukan transkrip byte-per-byte yang persis sama, periksa file transkrip di
disk alih-alih memperlakukan `sessions_history` sebagai dump mentah.

## Mengirim pesan lintas sesi

`sessions_send` mengirimkan pesan ke sesi lain dan secara opsional menunggu
balasan:

- **Fire-and-forget:** setel `timeoutSeconds: 0` untuk memasukkan ke antrean dan langsung kembali.
- **Tunggu balasan:** setel timeout dan dapatkan balasan secara inline.

Setelah target merespons, OpenClaw dapat menjalankan **reply-back loop** tempat
agen saling bergantian mengirim pesan (hingga 5 giliran). Agen target dapat membalas
`REPLY_SKIP` untuk berhenti lebih awal.

## Helper status dan orkestrasi

`session_status` adalah tool setara `/status` yang ringan untuk sesi saat ini
atau sesi lain yang terlihat. Tool ini melaporkan penggunaan, waktu, status model/runtime, dan
konteks tugas latar belakang yang tertaut bila ada. Seperti `/status`, tool ini dapat mengisi ulang
penghitung token/cache yang jarang dari entri penggunaan transkrip terbaru, dan
`model=default` menghapus override per sesi.

`sessions_yield` dengan sengaja mengakhiri giliran saat ini sehingga pesan berikutnya dapat menjadi
event tindak lanjut yang Anda tunggu. Gunakan setelah men-spawn sub-agen ketika
Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih membangun loop polling.

`subagents` adalah helper control-plane untuk sub-agen OpenClaw yang sudah di-spawn.
Tool ini mendukung:

- `action: "list"` untuk memeriksa eksekusi aktif/terbaru
- `action: "steer"` untuk mengirim panduan lanjutan ke child yang sedang berjalan
- `action: "kill"` untuk menghentikan satu child atau `all`

## Men-spawn sub-agen

`sessions_spawn` membuat sesi terisolasi untuk tugas latar belakang secara default.
Tool ini selalu non-blocking -- tool ini langsung mengembalikan `runId` dan
`childSessionKey`.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agen harness eksternal.
- Override `model` dan `thinking` untuk sesi child.
- `thread: true` untuk mengikat spawn ke thread chat (Discord, Slack, dll.).
- `sandbox: "require"` untuk memaksa sandbox pada child.
- `context: "fork"` untuk sub-agen native saat child memerlukan
  transkrip peminta saat ini; hilangkan atau gunakan `context: "isolated"` untuk child yang bersih.

Sub-agen daun default tidak mendapatkan tool sesi. Saat
`maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 tambahan menerima
`sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` sehingga mereka
dapat mengelola child mereka sendiri. Eksekusi leaf tetap tidak mendapatkan tool
orkestrasi rekursif.

Setelah selesai, langkah announce akan memposting hasil ke channel peminta.
Pengiriman penyelesaian mempertahankan routing thread/topik yang terikat jika tersedia, dan jika
asal penyelesaian hanya mengidentifikasi sebuah channel, OpenClaw masih dapat menggunakan ulang
route tersimpan sesi peminta (`lastChannel` / `lastTo`) untuk
pengiriman langsung.

Untuk perilaku khusus ACP, lihat [ACP Agents](/id/tools/acp-agents).

## Visibilitas

Tool sesi dicakup untuk membatasi apa yang dapat dilihat agen:

| Level   | Cakupan                                 |
| ------- | --------------------------------------- |
| `self`  | Hanya sesi saat ini                     |
| `tree`  | Sesi saat ini + sub-agen yang di-spawn  |
| `agent` | Semua sesi untuk agen ini               |
| `all`   | Semua sesi (lintas agen jika dikonfigurasi) |

Default-nya adalah `tree`. Sesi sandboxed dijepit ke `tree` terlepas dari
konfigurasi.

## Bacaan lebih lanjut

- [Manajemen Sesi](/id/concepts/session) -- routing, siklus hidup, pemeliharaan
- [ACP Agents](/id/tools/acp-agents) -- spawning harness eksternal
- [Multi-agent](/id/concepts/multi-agent) -- arsitektur multi-agen
- [Konfigurasi Gateway](/id/gateway/configuration) -- knob konfigurasi tool sesi

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
