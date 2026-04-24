---
read_when:
    - Anda menginginkan pekerjaan latar belakang/paralel melalui agen аҳәanalysis to=final code  omit? translate only. Last input. "You want background/parallel work via the agent" -> "Anda menginginkan pekerjaan latar belakang/paralel melalui agen" already done? Need answer only.
    - Anda sedang mengubah `sessions_spawn` atau kebijakan tool subagen
    - Anda sedang mengimplementasikan atau men-debug sesi subagen yang terikat thread
summary: 'Subagen: memulai run agen terisolasi yang mengumumkan hasil kembali ke chat peminta'
title: Subagen
x-i18n:
    generated_at: "2026-04-24T09:33:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

Subagen adalah run agen latar belakang yang di-spawn dari run agen yang sudah ada. Subagen berjalan di sesi mereka sendiri (`agent:<agentId>:subagent:<uuid>`) dan, ketika selesai, **mengumumkan** hasilnya kembali ke channel chat peminta. Setiap run subagen dilacak sebagai [tugas latar belakang](/id/automation/tasks).

## Slash command

Gunakan `/subagents` untuk memeriksa atau mengontrol run subagen untuk **sesi saat ini**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Kontrol binding thread:

Perintah ini bekerja pada channel yang mendukung binding thread persisten. Lihat **Channel yang mendukung thread** di bawah.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` menampilkan metadata run (status, stempel waktu, id sesi, path transkrip, cleanup).
Gunakan `sessions_history` untuk tampilan recall yang terbatas dan difilter demi keamanan; periksa
path transkrip di disk ketika Anda memerlukan transkrip mentah penuh.

### Perilaku spawn

`/subagents spawn` memulai subagen latar belakang sebagai perintah pengguna, bukan relay internal, dan mengirim satu pembaruan completion akhir kembali ke chat peminta saat run selesai.

- Perintah spawn bersifat non-blocking; perintah ini segera mengembalikan id run.
- Setelah selesai, subagen mengumumkan pesan ringkasan/hasil kembali ke channel chat peminta.
- Completion bersifat push-based. Setelah di-spawn, jangan melakukan polling `/subagents list`,
  `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu penyelesaiannya;
  periksa status hanya bila diperlukan untuk debugging atau intervensi.
- Setelah selesai, OpenClaw dengan best-effort menutup tab/proses browser terlacak yang dibuka oleh sesi subagen tersebut sebelum alur cleanup announce berlanjut.
- Untuk spawn manual, pengiriman bersifat tangguh:
  - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan idempotency key yang stabil.
  - Jika pengiriman langsung gagal, OpenClaw fallback ke perutean antrean.
  - Jika perutean antrean masih tidak tersedia, announce dicoba ulang dengan exponential backoff singkat sebelum akhirnya menyerah.
- Pengiriman completion mempertahankan rute peminta yang telah di-resolve:
  - rute completion yang terikat thread atau percakapan menang bila tersedia
  - jika asal completion hanya menyediakan channel, OpenClaw mengisi target/akun yang hilang dari rute peminta yang telah di-resolve (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap berfungsi
- Handoff completion ke sesi peminta adalah konteks internal yang dihasilkan runtime (bukan teks buatan pengguna) dan mencakup:
  - `Result` (teks balasan `assistant` terlihat terbaru, jika tidak maka teks tool/toolResult terbaru yang telah disanitasi; run terminal yang gagal tidak menggunakan kembali teks balasan yang tertangkap)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistik runtime/token yang ringkas
  - instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dengan suara asisten normal (bukan meneruskan metadata internal mentah)
- `--model` dan `--thinking` menimpa default untuk run tertentu itu.
- Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
- `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
- Untuk sesi harness ACP (Codex, Claude Code, Gemini CLI), gunakan `sessions_spawn` dengan `runtime: "acp"` dan lihat [ACP Agents](/id/tools/acp-agents), khususnya [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug completion atau loop agen-ke-agen.

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / tool lambat" tanpa memblokir run utama.
- Menjaga subagen tetap terisolasi secara default (pemisahan sesi + sandbox opsional).
- Menjaga surface tool tetap sulit disalahgunakan: subagen **tidak** mendapatkan tool sesi secara default.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orkestrator.

Catatan biaya: setiap subagen memiliki **konteks dan penggunaan tokennya sendiri** secara default. Untuk tugas yang berat atau
berulang, atur model yang lebih murah untuk subagen dan pertahankan agen utama Anda pada
model berkualitas lebih tinggi. Anda dapat mengonfigurasikannya melalui `agents.defaults.subagents.model` atau override per agen.
Ketika child benar-benar membutuhkan transkrip peminta saat ini, agen dapat meminta
`context: "fork"` pada spawn itu saja.

## Tool

Gunakan `sessions_spawn`:

- Memulai run subagen (`deliver: false`, lane global: `subagent`)
- Lalu menjalankan langkah announce dan memposting balasan announce ke channel chat peminta
- Model default: mewarisi pemanggil kecuali Anda mengatur `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen); `sessions_spawn.model` yang eksplisit tetap menang.
- Thinking default: mewarisi pemanggil kecuali Anda mengatur `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen); `sessions_spawn.thinking` yang eksplisit tetap menang.
- Timeout run default: jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` bila diatur; jika tidak maka fallback ke `0` (tanpa timeout).

Parameter tool:

- `task` (wajib)
- `label?` (opsional)
- `agentId?` (opsional; spawn di bawah id agen lain jika diizinkan)
- `model?` (opsional; menimpa model subagen; nilai yang tidak valid dilewati dan subagen berjalan pada model default dengan peringatan dalam hasil tool)
- `thinking?` (opsional; menimpa tingkat thinking untuk run subagen)
- `runTimeoutSeconds?` (default ke `agents.defaults.subagents.runTimeoutSeconds` jika diatur, jika tidak `0`; saat diatur, run subagen dibatalkan setelah N detik)
- `thread?` (default `false`; saat `true`, meminta binding thread channel untuk sesi subagen ini)
- `mode?` (`run|session`)
  - default-nya adalah `run`
  - jika `thread: true` dan `mode` dihilangkan, default menjadi `session`
  - `mode: "session"` memerlukan `thread: true`
- `cleanup?` (`delete|keep`, default `keep`)
- `sandbox?` (`inherit|require`, default `inherit`; `require` menolak spawn kecuali runtime child target di-sandbox)
- `context?` (`isolated|fork`, default `isolated`; hanya untuk subagen native)
  - `isolated` membuat transkrip child yang bersih dan merupakan default.
  - `fork` mencabangkan transkrip saat ini milik peminta ke sesi child sehingga child memulai dengan konteks percakapan yang sama.
  - Gunakan `fork` hanya ketika child memerlukan transkrip saat ini. Untuk pekerjaan yang terfokus, hilangkan `context`.
- `sessions_spawn` **tidak** menerima parameter pengiriman channel (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan `message`/`sessions_send` dari run yang di-spawn.

## Sesi terikat thread

Ketika binding thread diaktifkan untuk sebuah channel, subagen dapat tetap terikat ke thread sehingga pesan pengguna berikutnya di thread tersebut terus dirutekan ke sesi subagen yang sama.

### Channel yang mendukung thread

- Discord (saat ini satu-satunya channel yang didukung): mendukung sesi subagen persisten yang terikat thread (`sessions_spawn` dengan `thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), dan kunci adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, dan `channels.discord.threadBindings.spawnSubagentSessions`.

Alur cepat:

1. Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"`).
2. OpenClaw membuat atau mengikat thread ke target sesi tersebut di channel aktif.
3. Balasan dan pesan tindak lanjut di thread tersebut dirutekan ke sesi yang terikat.
4. Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus karena tidak aktif dan `/session max-age` untuk mengontrol batas keras.
5. Gunakan `/unfocus` untuk melepaskannya secara manual.

Kontrol manual:

- `/focus <target>` mengikat thread saat ini (atau membuat thread) ke target subagen/sesi.
- `/unfocus` menghapus binding untuk thread terikat saat ini.
- `/agents` mencantumkan run aktif dan state binding (`thread:<id>` atau `unbound`).
- `/session idle` dan `/session max-age` hanya berfungsi untuk thread terikat yang sedang difokuskan.

Sakelar config:

- Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Override channel dan kunci auto-bind spawn bersifat khusus adapter. Lihat **Channel yang mendukung thread** di atas.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference) dan [Slash commands](/id/tools/slash-commands) untuk detail adapter saat ini.

Allowlist:

- `agents.list[].subagents.allowAgents`: daftar id agen yang dapat ditargetkan melalui `agentId` (`["*"]` untuk mengizinkan apa saja). Default: hanya agen peminta.
- `agents.defaults.subagents.allowAgents`: allowlist agen target default yang digunakan ketika agen peminta tidak mengatur `subagents.allowAgents` sendiri.
- Guard pewarisan sandbox: jika sesi peminta di-sandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: saat true, blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Default: false.

Discovery:

- Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk `sessions_spawn`.

Arsip otomatis:

- Sesi subagen secara otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default: 60).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` mengarsipkan segera setelah announce (tetap mempertahankan transkrip melalui rename).
- Arsip otomatis bersifat best-effort; timer yang tertunda hilang jika gateway restart.
- `runTimeoutSeconds` **tidak** mengarsipkan otomatis; ini hanya menghentikan run. Sesi tetap ada sampai arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi kedalaman-1 maupun kedalaman-2.
- Cleanup browser terpisah dari cleanup arsip: tab/proses browser yang terlacak ditutup dengan best-effort saat run selesai, bahkan jika catatan transkrip/sesi tetap disimpan.

## Subagen bersarang

Secara default, subagen tidak dapat memulai subagennya sendiri (`maxSpawnDepth: 1`). Anda dapat mengaktifkan satu tingkat nesting dengan mengatur `maxSpawnDepth: 2`, yang memungkinkan **pola orkestrator**: utama → subagen orkestrator → sub-subagen pekerja.

### Cara mengaktifkan

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // izinkan subagen memulai child (default: 1)
        maxChildrenPerAgent: 5, // jumlah maksimum child aktif per sesi agen (default: 5)
        maxConcurrent: 8, // batas lane konkurensi global (default: 8)
        runTimeoutSeconds: 900, // timeout default untuk sessions_spawn saat dihilangkan (0 = tanpa timeout)
      },
    },
  },
}
```

### Tingkat kedalaman

| Kedalaman | Bentuk kunci sesi                            | Peran                                          | Bisa spawn?                   |
| --------- | -------------------------------------------- | ---------------------------------------------- | ----------------------------- |
| 0         | `agent:<id>:main`                            | Agen utama                                     | Selalu                        |
| 1         | `agent:<id>:subagent:<uuid>`                 | Subagen (orkestrator saat depth 2 diizinkan)   | Hanya jika `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagen (pekerja daun)                     | Tidak pernah                  |

### Rantai announce

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → announce ke induknya (orkestrator depth-1)
2. Orkestrator depth-1 menerima announce, mensintesis hasil, selesai → announce ke utama
3. Agen utama menerima announce dan mengirimkannya ke pengguna

Setiap tingkat hanya melihat announce dari child langsungnya.

Panduan operasional:

- Mulailah pekerjaan child satu kali lalu tunggu peristiwa completion alih-alih membangun loop polling
  di sekitar `sessions_list`, `sessions_history`, `/subagents list`, atau
  perintah `exec` sleep.
- Jika peristiwa completion child tiba setelah Anda sudah mengirim jawaban akhir,
  tindak lanjut yang benar adalah token senyap yang persis `NO_REPLY` / `no_reply`.

### Kebijakan tool berdasarkan kedalaman

- Scope peran dan kontrol ditulis ke metadata sesi saat spawn. Ini menjaga kunci sesi yang datar atau dipulihkan agar tidak secara tidak sengaja mendapatkan kembali hak istimewa orkestrator.
- **Kedalaman 1 (orkestrator, saat `maxSpawnDepth >= 2`)**: Mendapat `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` sehingga dapat mengelola child-nya. Tool sesi/sistem lainnya tetap ditolak.
- **Kedalaman 1 (leaf, saat `maxSpawnDepth == 1`)**: Tidak ada tool sesi (perilaku default saat ini).
- **Kedalaman 2 (pekerja leaf)**: Tidak ada tool sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat memulai child lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki paling banyak `maxChildrenPerAgent` (default: 5) child aktif pada satu waktu. Ini mencegah fan-out tak terkendali dari satu orkestrator.

### Cascade stop

Menghentikan orkestrator depth-1 secara otomatis menghentikan semua child depth-2-nya:

- `/stop` di chat utama menghentikan semua agen depth-1 dan mengalir ke child depth-2 mereka.
- `/subagents kill <id>` menghentikan subagen tertentu dan mengalir ke child-nya.
- `/subagents kill all` menghentikan semua subagen untuk peminta dan mengalir.

## Autentikasi

Auth subagen di-resolve berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi subagen adalah `agent:<agentId>:subagent:<uuid>`.
- Store auth dimuat dari `agentDir` milik agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen menimpa profil utama saat terjadi konflik.

Catatan: penggabungan ini bersifat aditif, jadi profil utama selalu tersedia sebagai fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Announce

Subagen melapor kembali melalui langkah announce:

- Langkah announce berjalan di dalam sesi subagen (bukan sesi peminta).
- Jika subagen membalas tepat `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap yang persis `NO_REPLY` / `no_reply`,
  output announce ditekan meskipun sebelumnya ada progres yang terlihat.
- Selain itu, pengiriman bergantung pada kedalaman peminta:
  - sesi peminta level atas menggunakan panggilan `agent` tindak lanjut dengan pengiriman eksternal (`deliver=true`)
  - sesi subagen peminta bersarang menerima injeksi tindak lanjut internal (`deliver=false`) agar orkestrator dapat mensintesis hasil child dalam sesi
  - jika sesi subagen peminta yang bersarang sudah hilang, OpenClaw fallback ke peminta sesi tersebut bila tersedia
- Untuk sesi peminta level atas, pengiriman langsung mode completion pertama-tama me-resolve rute percakapan/thread terikat dan override hook, lalu mengisi field target channel yang hilang dari rute tersimpan milik sesi peminta. Ini menjaga completion tetap berada di chat/topik yang benar bahkan ketika asal completion hanya mengidentifikasi channel.
- Agregasi completion child dicakup ke run peminta saat ini ketika membangun temuan completion bersarang, sehingga output child lama dari run sebelumnya tidak bocor ke announce saat ini.
- Balasan announce mempertahankan perutean thread/topik bila tersedia pada adapter channel.
- Konteks announce dinormalisasi menjadi blok peristiwa internal yang stabil:
  - sumber (`subagent` atau `cron`)
  - kunci/id sesi child
  - tipe announce + label tugas
  - baris status yang diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`)
  - konten hasil yang dipilih dari teks asisten terlihat terbaru, jika tidak maka teks tool/toolResult terbaru yang telah disanitasi; run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang teks balasan yang tertangkap
  - instruksi tindak lanjut yang menjelaskan kapan harus membalas vs tetap diam
- `Status` tidak disimpulkan dari output model; status berasal dari sinyal hasil runtime.
- Saat timeout, jika child hanya sempat melakukan panggilan tool, announce dapat meruntuhkan riwayat itu menjadi ringkasan progres parsial singkat alih-alih memutar ulang output tool mentah.

Payload announce menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (misalnya `runtime 5m12s`)
- Penggunaan token (input/output/total)
- Estimasi biaya ketika harga model dikonfigurasi (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, dan path transkrip (agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk)
- Metadata internal ditujukan untuk orkestrasi saja; balasan yang ditujukan ke pengguna harus ditulis ulang dengan suara asisten normal.

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- recall asisten dinormalisasi terlebih dahulu:
  - tag thinking dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML pemanggilan tool teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan bersih
  - scaffolding pemanggilan/hasil tool yang diturunkan dan penanda konteks historis dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian full-width `<｜...｜>` dihapus
  - XML tool-call MiniMax yang rusak dihapus
- teks yang menyerupai kredensial/token disensor
- blok panjang dapat dipotong
- riwayat yang sangat besar dapat membuang baris yang lebih lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- inspeksi transkrip mentah di disk menjadi fallback saat Anda membutuhkan transkrip lengkap byte-per-byte

## Kebijakan Tool (tool subagen)

Secara default, subagen mendapatkan **semua tool kecuali tool sesi** dan tool sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` juga tetap merupakan tampilan recall yang terbatas dan telah disanitasi; ini
bukan dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, subagen orkestrator depth-1 juga menerima `sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` agar mereka dapat mengelola child-nya.

Override melalui config:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny menang
        deny: ["gateway", "cron"],
        // jika allow diatur, ini menjadi hanya-allow (deny tetap menang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Konkurensi

Subagen menggunakan lane antrean in-process khusus:

- Nama lane: `subagent`
- Konkurensi: `agents.defaults.subagents.maxConcurrent` (default `8`)

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan run subagen aktif yang di-spawn darinya, mengalir ke child bersarang.
- `/subagents kill <id>` menghentikan subagen tertentu dan mengalir ke child-nya.

## Keterbatasan

- Announce subagen bersifat **best-effort**. Jika gateway restart, pekerjaan "announce back" yang tertunda akan hilang.
- Subagen tetap berbagi sumber daya proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: perintah ini segera mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks subagen hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman nesting maksimum adalah 5 (`maxSpawnDepth` berkisar 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi child aktif per sesi (default: 5, rentang: 1–20).

## Terkait

- [ACP agents](/id/tools/acp-agents)
- [Tool sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [Agent send](/id/tools/agent-send)
