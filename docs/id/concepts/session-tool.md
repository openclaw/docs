---
read_when:
    - Anda ingin memahami alat sesi apa saja yang dimiliki agen
    - Anda ingin mengonfigurasi akses lintas sesi atau pembuatan sub-agent
    - Anda ingin memeriksa status atau mengontrol sub-agen yang dimunculkan
summary: Alat agen untuk status lintas sesi, pemanggilan kembali, perpesanan, dan orkestrasi subagen
title: Alat sesi
x-i18n:
    generated_at: "2026-04-30T09:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw memberi agen alat untuk bekerja lintas sesi, memeriksa status, dan
mengorkestrasi sub-agen.

## Alat yang tersedia

| Alat               | Fungsinya                                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Mencantumkan sesi dengan filter opsional (jenis, label, agen, kebaruan, pratinjau) |
| `sessions_history` | Membaca transkrip sesi tertentu                                             |
| `sessions_send`    | Mengirim pesan ke sesi lain dan secara opsional menunggu                    |
| `sessions_spawn`   | Memunculkan sesi sub-agen terisolasi untuk pekerjaan latar belakang         |
| `sessions_yield`   | Mengakhiri giliran saat ini dan menunggu hasil sub-agen lanjutan            |
| `subagents`        | Mencantumkan, mengarahkan, atau menghentikan sub-agen yang dimunculkan untuk sesi ini |
| `session_status`   | Menampilkan kartu bergaya `/status` dan secara opsional mengatur override model per sesi |

Alat-alat ini tetap tunduk pada profil alat aktif dan kebijakan izinkan/tolak.
`tools.profile: "coding"` mencakup set orkestrasi sesi lengkap, termasuk
`sessions_spawn`, `sessions_yield`, dan `subagents`.
`tools.profile: "messaging"` mencakup alat pengiriman pesan lintas sesi
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) tetapi
tidak mencakup pemunculan sub-agen. Untuk mempertahankan profil pengiriman pesan
dan tetap mengizinkan delegasi native, tambahkan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Kebijakan grup, penyedia, sandbox, dan per agen tetap dapat menghapus alat-alat
tersebut setelah tahap profil. Gunakan `/tools` dari sesi yang terdampak untuk
memeriksa daftar alat efektif.

## Mencantumkan dan membaca sesi

`sessions_list` mengembalikan sesi beserta kunci, agentId, jenis, kanal, model,
jumlah token, dan stempel waktunya. Filter menurut jenis (`main`, `group`, `cron`, `hook`,
`node`), `label` persis, `agentId` persis, teks pencarian, atau kebaruan
(`activeMinutes`). Saat Anda memerlukan triase bergaya kotak surat, alat ini juga dapat meminta
judul turunan dengan cakupan visibilitas, cuplikan pratinjau pesan terakhir, atau pesan
terbaru berbatas pada setiap baris. Judul turunan dan pratinjau hanya dibuat untuk
sesi yang sudah dapat dilihat pemanggil berdasarkan kebijakan visibilitas alat sesi
yang dikonfigurasi, sehingga sesi yang tidak terkait tetap tersembunyi.

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu.
Secara default, hasil alat dikecualikan -- berikan `includeTools: true` untuk melihatnya.
Tampilan yang dikembalikan sengaja dibatasi dan difilter untuk keselamatan:

- teks asisten dinormalisasi sebelum recall:
  - tag pemikiran dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML panggilan alat teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan rapi
  - scaffolding panggilan/hasil alat yang diturunkan seperti `[Tool Call: ...]`,
    `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian lebar penuh `<｜...｜>` dihapus
  - XML panggilan alat MiniMax yang cacat seperti `<invoke ...>` /
    `</minimax:tool_call>` dihapus
- teks yang menyerupai kredensial/token disunting sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat membuang baris lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- alat melaporkan flag ringkasan seperti `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, dan `bytes`

Kedua alat menerima **kunci sesi** (seperti `"main"`) atau **ID sesi**
dari panggilan daftar sebelumnya.

Jika Anda memerlukan transkrip byte demi byte yang persis, periksa file transkrip di
disk alih-alih memperlakukan `sessions_history` sebagai dump mentah.

## Mengirim pesan lintas sesi

`sessions_send` mengirim pesan ke sesi lain dan secara opsional menunggu
respons:

- **Kirim lalu lanjutkan:** atur `timeoutSeconds: 0` untuk mengantrekan dan kembali
  segera.
- **Tunggu balasan:** atur batas waktu dan dapatkan respons secara inline.

Pesan dan balasan lanjutan A2A ditandai sebagai data antar-sesi dalam prompt
penerima (`[Inter-session message ... isUser=false]`) dan dalam provenance
transkrip. Agen penerima harus memperlakukannya sebagai data yang dirutekan alat, bukan sebagai
instruksi langsung yang ditulis pengguna akhir.

Setelah target merespons, OpenClaw dapat menjalankan **loop balas-kembali** di mana
agen bergantian mengirim pesan (hingga 5 giliran). Agen target dapat membalas
`REPLY_SKIP` untuk berhenti lebih awal.

## Pembantu status dan orkestrasi

`session_status` adalah alat ringan yang setara dengan `/status` untuk sesi saat ini
atau sesi lain yang terlihat. Alat ini melaporkan penggunaan, waktu, status model/runtime, dan
konteks tugas latar belakang yang tertaut saat ada. Seperti `/status`, alat ini dapat mengisi ulang
penghitung token/cache yang jarang dari entri penggunaan transkrip terbaru, dan
`model=default` menghapus override per sesi. Gunakan `sessionKey="current"` untuk
sesi pemanggil saat ini; label klien yang terlihat seperti `openclaw-tui` bukan
kunci sesi.

`sessions_yield` sengaja mengakhiri giliran saat ini agar pesan berikutnya dapat menjadi
peristiwa lanjutan yang Anda tunggu. Gunakan setelah memunculkan sub-agen saat
Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih membangun
loop polling.

`subagents` adalah pembantu control-plane untuk sub-agen OpenClaw yang sudah
dimunculkan. Alat ini mendukung:

- `action: "list"` untuk memeriksa run aktif/terbaru
- `action: "steer"` untuk mengirim panduan lanjutan ke child yang sedang berjalan
- `action: "kill"` untuk menghentikan satu child atau `all`

## Memunculkan sub-agen

`sessions_spawn` membuat sesi terisolasi untuk tugas latar belakang secara default.
Alat ini selalu non-blocking -- langsung kembali dengan `runId` dan
`childSessionKey`.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agen harness eksternal.
- Override `model` dan `thinking` untuk sesi child.
- `thread: true` untuk mengikat spawn ke thread chat (Discord, Slack, dll.).
- `sandbox: "require"` untuk memberlakukan sandboxing pada child.
- `context: "fork"` untuk sub-agen native saat child memerlukan transkrip
  peminta saat ini; abaikan atau gunakan `context: "isolated"` untuk child yang bersih.

Sub-agen leaf default tidak mendapatkan alat sesi. Saat
`maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 juga menerima
`sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` sehingga mereka
dapat mengelola child mereka sendiri. Run leaf tetap tidak mendapatkan alat
orkestrasi rekursif.

Setelah selesai, langkah pengumuman memposting hasil ke kanal peminta.
Pengiriman penyelesaian mempertahankan routing thread/topik terikat saat tersedia, dan jika
asal penyelesaian hanya mengidentifikasi sebuah kanal, OpenClaw tetap dapat menggunakan ulang
rute tersimpan sesi peminta (`lastChannel` / `lastTo`) untuk pengiriman
langsung.

Untuk perilaku khusus ACP, lihat [Agen ACP](/id/tools/acp-agents).

## Visibilitas

Alat sesi dicakup untuk membatasi apa yang dapat dilihat agen:

| Level   | Cakupan                                  |
| ------- | ---------------------------------------- |
| `self`  | Hanya sesi saat ini                      |
| `tree`  | Sesi saat ini + sub-agen yang dimunculkan |
| `agent` | Semua sesi untuk agen ini                |
| `all`   | Semua sesi (lintas agen jika dikonfigurasi) |

Default-nya adalah `tree`. Sesi yang di-sandbox dibatasi ke `tree` terlepas dari
konfigurasi.

## Bacaan lanjutan

- [Manajemen Sesi](/id/concepts/session) -- routing, siklus hidup, pemeliharaan
- [Agen ACP](/id/tools/acp-agents) -- pemunculan harness eksternal
- [Multi-agen](/id/concepts/multi-agent) -- arsitektur multi-agen
- [Konfigurasi Gateway](/id/gateway/configuration) -- kenop konfigurasi alat sesi

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
