---
read_when:
    - Anda ingin memahami alat sesi apa yang dimiliki agen
    - Anda ingin mengonfigurasi akses lintas sesi atau spawning sub-agen
    - Anda ingin memeriksa status atau mengontrol sub-agen yang di-spawn
summary: Alat agen untuk status lintas sesi, recall, perpesanan, dan orkestrasi sub-agen
title: Alat Sesi
x-i18n:
    generated_at: "2026-04-05T13:52:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fab7cbf9d1a5cccaf316b69fefe212bbf9370876c8b92e988d3175f5545a4d
    source_path: concepts/session-tool.md
    workflow: 15
---

# Alat Sesi

OpenClaw memberi agen alat untuk bekerja lintas sesi, memeriksa status, dan
mengorkestrasi sub-agen.

## Alat yang tersedia

| Alat               | Fungsinya                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Mendaftar sesi dengan filter opsional (jenis, keterkinian)                 |
| `sessions_history` | Membaca transkrip sesi tertentu                                            |
| `sessions_send`    | Mengirim pesan ke sesi lain dan secara opsional menunggu                   |
| `sessions_spawn`   | Menjalankan sesi sub-agen terisolasi untuk pekerjaan latar belakang        |
| `sessions_yield`   | Mengakhiri giliran saat ini dan menunggu hasil tindak lanjut sub-agen      |
| `subagents`        | Mendaftar, mengarahkan, atau mematikan sub-agen yang di-spawn untuk sesi ini |
| `session_status`   | Menampilkan kartu bergaya `/status` dan secara opsional menetapkan override model per sesi |

## Mendaftar dan membaca sesi

`sessions_list` mengembalikan sesi beserta key, kind, channel, model, jumlah
token, dan stempel waktu. Filter berdasarkan kind (`main`, `group`, `cron`, `hook`,
`node`) atau keterkinian (`activeMinutes`).

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu.
Secara default, hasil alat tidak disertakan -- berikan `includeTools: true` untuk melihatnya.
Tampilan yang dikembalikan sengaja dibatasi dan difilter untuk keamanan:

- teks asisten dinormalisasi sebelum recall:
  - tag thinking dihapus
  - blok scaffold `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML tool-call teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload yang
    terpotong dan tidak pernah ditutup dengan benar
  - scaffold tool-call/result yang diturunkan seperti `[Tool Call: ...]`,
    `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian full-width `<｜...｜>` dihapus
  - XML tool-call MiniMax yang malformed seperti `<invoke ...>` /
    `</minimax:tool_call>` dihapus
- teks mirip kredensial/token disensor sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat menghapus baris yang lebih lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- alat melaporkan flag ringkasan seperti `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, dan `bytes`

Kedua alat menerima **session key** (seperti `"main"`) atau **session ID**
dari pemanggilan list sebelumnya.

Jika Anda memerlukan transkrip yang persis sama byte demi byte, periksa file
transkrip di disk alih-alih memperlakukan `sessions_history` sebagai dump mentah.

## Mengirim pesan lintas sesi

`sessions_send` mengirimkan pesan ke sesi lain dan secara opsional menunggu
respons:

- **Fire-and-forget:** setel `timeoutSeconds: 0` untuk memasukkan ke antrean dan langsung
  kembali.
- **Tunggu balasan:** setel timeout dan dapatkan respons secara inline.

Setelah target merespons, OpenClaw dapat menjalankan **reply-back loop** di mana
agen saling bertukar pesan secara bergantian (hingga 5 giliran). Agen target dapat membalas
`REPLY_SKIP` untuk berhenti lebih awal.

## Bantuan status dan orkestrasi

`session_status` adalah alat ringan setara `/status` untuk sesi saat ini
atau sesi lain yang terlihat. Alat ini melaporkan penggunaan, waktu, status model/runtime, dan
konteks tugas latar belakang yang tertaut jika ada. Seperti `/status`, alat ini dapat mengisi
kembali penghitung token/cache yang jarang dari entri penggunaan transkrip terbaru, dan
`model=default` akan menghapus override per sesi.

`sessions_yield` dengan sengaja mengakhiri giliran saat ini sehingga pesan berikutnya dapat menjadi
event tindak lanjut yang Anda tunggu. Gunakan setelah menjalankan sub-agen saat
Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih membuat loop polling.

`subagents` adalah helper control-plane untuk sub-agen OpenClaw yang sudah
di-spawn. Alat ini mendukung:

- `action: "list"` untuk memeriksa run aktif/terbaru
- `action: "steer"` untuk mengirim panduan tindak lanjut ke child yang sedang berjalan
- `action: "kill"` untuk menghentikan satu child atau `all`

## Menjalankan sub-agen

`sessions_spawn` membuat sesi terisolasi untuk tugas latar belakang. Alat ini selalu
non-blocking -- langsung mengembalikan `runId` dan `childSessionKey`.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agen harness eksternal.
- Override `model` dan `thinking` untuk sesi child.
- `thread: true` untuk mengikat spawn ke thread chat (Discord, Slack, dll.).
- `sandbox: "require"` untuk memaksakan sandboxing pada child.

Sub-agen leaf default tidak mendapatkan alat sesi. Ketika
`maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 juga menerima
`sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` sehingga mereka
dapat mengelola child mereka sendiri. Run leaf tetap tidak mendapatkan
alat orkestrasi rekursif.

Setelah selesai, langkah announce memposting hasil ke channel peminta.
Pengiriman penyelesaian mempertahankan perutean thread/topik yang terikat saat tersedia, dan jika
asal penyelesaian hanya mengidentifikasi sebuah channel, OpenClaw tetap dapat menggunakan ulang rute tersimpan sesi peminta (`lastChannel` / `lastTo`) untuk pengiriman
langsung.

Untuk perilaku khusus ACP, lihat [Agen ACP](/tools/acp-agents).

## Visibilitas

Alat sesi dicakup untuk membatasi apa yang dapat dilihat agen:

| Tingkat | Cakupan                                  |
| ------- | ---------------------------------------- |
| `self`  | Hanya sesi saat ini                      |
| `tree`  | Sesi saat ini + sub-agen yang di-spawn   |
| `agent` | Semua sesi untuk agen ini                |
| `all`   | Semua sesi (lintas agen jika dikonfigurasi) |

Default-nya adalah `tree`. Sesi sandboxed dibatasi ke `tree` terlepas dari
konfigurasi.

## Bacaan lanjutan

- [Manajemen Sesi](/concepts/session) -- perutean, siklus hidup, pemeliharaan
- [Agen ACP](/tools/acp-agents) -- spawning harness eksternal
- [Multi-agent](/concepts/multi-agent) -- arsitektur multi-agen
- [Konfigurasi Gateway](/gateway/configuration) -- kontrol konfigurasi alat sesi
