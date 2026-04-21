---
read_when:
    - Anda ingin pekerjaan latar belakang/paralel melalui agen
    - Anda sedang mengubah kebijakan alat `sessions_spawn` atau sub-agent
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagent yang terikat ke thread
summary: 'Sub-agent: menjalankan agen terisolasi yang mengumumkan hasil kembali ke chat peminta'
title: Sub-Agent
x-i18n:
    generated_at: "2026-04-21T19:20:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-agent

Sub-agent adalah eksekusi agen latar belakang yang di-spawn dari eksekusi agen yang sudah ada. Mereka berjalan dalam sesi mereka sendiri (`agent:<agentId>:subagent:<uuid>`) dan, ketika selesai, **mengumumkan** hasilnya kembali ke channel chat peminta. Setiap eksekusi sub-agent dilacak sebagai [tugas latar belakang](/id/automation/tasks).

## Perintah slash

Gunakan `/subagents` untuk memeriksa atau mengontrol eksekusi sub-agent untuk **sesi saat ini**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Kontrol pengikatan thread:

Perintah ini berfungsi pada channel yang mendukung pengikatan thread persisten. Lihat **Channel yang mendukung thread** di bawah.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` menampilkan metadata eksekusi (status, cap waktu, id sesi, path transkrip, pembersihan).
Gunakan `sessions_history` untuk tampilan recall yang dibatasi dan difilter demi keamanan; periksa
path transkrip di disk saat Anda memerlukan transkrip mentah lengkap.

### Perilaku spawn

`/subagents spawn` memulai sub-agent latar belakang sebagai perintah pengguna, bukan relay internal, dan mengirim satu pembaruan penyelesaian final kembali ke chat peminta saat eksekusi selesai.

- Perintah spawn bersifat non-blocking; perintah ini langsung mengembalikan id eksekusi.
- Saat selesai, sub-agent mengumumkan pesan ringkasan/hasil kembali ke channel chat peminta.
- Pengiriman penyelesaian berbasis push. Setelah di-spawn, jangan melakukan polling `/subagents list`,
  `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu penyelesaian;
  periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
- Saat selesai, OpenClaw melakukan best-effort untuk menutup tab/proses browser yang dilacak yang dibuka oleh sesi sub-agent tersebut sebelum alur pembersihan pengumuman berlanjut.
- Untuk spawn manual, pengiriman bersifat tangguh:
  - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan kunci idempoten yang stabil.
  - Jika pengiriman langsung gagal, OpenClaw beralih ke perutean antrean.
  - Jika perutean antrean masih tidak tersedia, pengumuman dicoba lagi dengan exponential backoff singkat sebelum akhirnya menyerah.
- Pengiriman penyelesaian mempertahankan rute peminta yang telah diselesaikan:
  - rute penyelesaian yang terikat thread atau terikat percakapan diprioritaskan saat tersedia
  - jika asal penyelesaian hanya menyediakan channel, OpenClaw mengisi target/akun yang hilang dari rute terselesaikan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi
- Handoff penyelesaian ke sesi peminta adalah konteks internal yang dibuat saat runtime (bukan teks buatan pengguna) dan mencakup:
  - `Result` (teks balasan `assistant` terlihat terbaru, atau jika tidak ada, teks tool/toolResult terbaru yang telah disanitasi; eksekusi gagal terminal tidak menggunakan ulang teks balasan yang tertangkap)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistik runtime/token ringkas
  - instruksi pengiriman yang memberitahu agen peminta untuk menulis ulang dengan suara assistant normal (bukan meneruskan metadata internal mentah)
- `--model` dan `--thinking` menimpa default untuk eksekusi spesifik tersebut.
- Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
- `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
- Untuk sesi harness ACP (Codex, Claude Code, Gemini CLI), gunakan `sessions_spawn` dengan `runtime: "acp"` dan lihat [ACP Agents](/id/tools/acp-agents).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / tool lambat" tanpa memblokir eksekusi utama.
- Menjaga sub-agent tetap terisolasi secara default (pemisahan sesi + sandboxing opsional).
- Menjaga permukaan tool tetap sulit disalahgunakan: sub-agent secara default **tidak** mendapatkan tool sesi.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orkestrator.

Catatan biaya: setiap sub-agent memiliki konteks dan penggunaan tokennya **sendiri**. Untuk tugas berat atau berulang,
atur model yang lebih murah untuk sub-agent dan pertahankan agen utama Anda pada model berkualitas lebih tinggi.
Anda dapat mengonfigurasi ini melalui `agents.defaults.subagents.model` atau override per agen.

## Tool

Gunakan `sessions_spawn`:

- Memulai eksekusi sub-agent (`deliver: false`, lane global: `subagent`)
- Lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke channel chat peminta
- Model default: mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen); `sessions_spawn.model` yang eksplisit tetap diprioritaskan.
- Thinking default: mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen); `sessions_spawn.thinking` yang eksplisit tetap diprioritaskan.
- Timeout eksekusi default: jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` jika ditetapkan; jika tidak, OpenClaw menggunakan `0` (tanpa timeout).

Parameter tool:

- `task` (wajib)
- `label?` (opsional)
- `agentId?` (opsional; spawn di bawah id agen lain jika diizinkan)
- `model?` (opsional; menimpa model sub-agent; nilai tidak valid dilewati dan sub-agent berjalan pada model default dengan peringatan di hasil tool)
- `thinking?` (opsional; menimpa level thinking untuk eksekusi sub-agent)
- `runTimeoutSeconds?` (default ke `agents.defaults.subagents.runTimeoutSeconds` jika ditetapkan, jika tidak `0`; bila ditetapkan, eksekusi sub-agent dihentikan setelah N detik)
- `thread?` (default `false`; saat `true`, meminta pengikatan thread channel untuk sesi sub-agent ini)
- `mode?` (`run|session`)
  - default adalah `run`
  - jika `thread: true` dan `mode` dihilangkan, default menjadi `session`
  - `mode: "session"` memerlukan `thread: true`
- `cleanup?` (`delete|keep`, default `keep`)
- `sandbox?` (`inherit|require`, default `inherit`; `require` menolak spawn kecuali runtime child target disandbox)
- `sessions_spawn` **tidak** menerima parameter pengiriman channel (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan `message`/`sessions_send` dari eksekusi yang di-spawn.

## Sesi terikat thread

Ketika pengikatan thread diaktifkan untuk suatu channel, sub-agent dapat tetap terikat ke thread sehingga pesan pengguna lanjutan di thread tersebut terus dirutekan ke sesi sub-agent yang sama.

### Channel yang mendukung thread

- Discord (saat ini satu-satunya channel yang didukung): mendukung sesi subagent persisten yang terikat thread (`sessions_spawn` dengan `thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), dan kunci adaptor `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, dan `channels.discord.threadBindings.spawnSubagentSessions`.

Alur singkat:

1. Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"`).
2. OpenClaw membuat atau mengikat thread ke target sesi tersebut di channel aktif.
3. Balasan dan pesan lanjutan di thread tersebut dirutekan ke sesi yang terikat.
4. Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus karena tidak aktif dan `/session max-age` untuk mengontrol batas keras.
5. Gunakan `/unfocus` untuk melepas secara manual.

Kontrol manual:

- `/focus <target>` mengikat thread saat ini (atau membuat thread) ke target sub-agent/sesi.
- `/unfocus` menghapus pengikatan untuk thread saat ini yang sedang terikat.
- `/agents` menampilkan daftar eksekusi aktif dan status pengikatan (`thread:<id>` atau `unbound`).
- `/session idle` dan `/session max-age` hanya berfungsi untuk thread terikat yang sedang fokus.

Sakelar konfigurasi:

- Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Override channel dan kunci auto-bind spawn bersifat spesifik adaptor. Lihat **Channel yang mendukung thread** di atas.

Lihat [Configuration Reference](/id/gateway/configuration-reference) dan [Slash commands](/id/tools/slash-commands) untuk detail adaptor saat ini.

Daftar izin:

- `agents.list[].subagents.allowAgents`: daftar id agen yang dapat ditargetkan melalui `agentId` (`["*"]` untuk mengizinkan semua). Default: hanya agen peminta.
- `agents.defaults.subagents.allowAgents`: daftar izin agen target default yang digunakan saat agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
- Guard pewarisan sandbox: jika sesi peminta disandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: saat true, memblokir pemanggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Default: false.

Discovery:

- Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk `sessions_spawn`.

Auto-archive:

- Sesi sub-agent diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default: 60).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah pengumuman (tetap mempertahankan transkrip melalui penggantian nama).
- Auto-archive bersifat best-effort; timer yang tertunda hilang jika Gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** melakukan auto-archive; opsi ini hanya menghentikan eksekusi. Sesi tetap ada hingga auto-archive.
- Auto-archive berlaku sama untuk sesi depth-1 dan depth-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup secara best-effort saat eksekusi selesai, bahkan jika catatan transkrip/sesi tetap disimpan.

## Nested Sub-Agent

Secara default, sub-agent tidak dapat melakukan spawn sub-agent mereka sendiri (`maxSpawnDepth: 1`). Anda dapat mengaktifkan satu level nesting dengan menetapkan `maxSpawnDepth: 2`, yang mengizinkan **pola orkestrator**: utama → sub-agent orkestrator → sub-sub-agent pekerja.

### Cara mengaktifkan

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // izinkan sub-agent melakukan spawn child (default: 1)
        maxChildrenPerAgent: 5, // maksimum child aktif per sesi agen (default: 5)
        maxConcurrent: 8, // batas lane konkurensi global (default: 8)
        runTimeoutSeconds: 900, // timeout default untuk sessions_spawn saat dihilangkan (0 = tanpa timeout)
      },
    },
  },
}
```

### Level kedalaman

| Depth | Bentuk kunci sesi                            | Peran                                         | Dapat spawn?                |
| ----- | -------------------------------------------- | --------------------------------------------- | --------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                      |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orkestrator saat depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (pekerja leaf)                  | Tidak pernah                |

### Rantai pengumuman

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → mengumumkan ke parent-nya (orkestrator depth-1)
2. Orkestrator depth-1 menerima pengumuman, menyintesis hasil, selesai → mengumumkan ke utama
3. Agen utama menerima pengumuman dan mengirimkannya ke pengguna

Setiap level hanya melihat pengumuman dari child langsungnya.

Panduan operasional:

- Mulai pekerjaan child sekali lalu tunggu peristiwa penyelesaian alih-alih membangun loop
  polling di sekitar `sessions_list`, `sessions_history`, `/subagents list`, atau
  perintah `exec` sleep.
- Jika peristiwa penyelesaian child tiba setelah Anda sudah mengirim jawaban final,
  tindak lanjut yang benar adalah token senyap persis `NO_REPLY` / `no_reply`.

### Kebijakan tool berdasarkan depth

- Peran dan cakupan kontrol ditulis ke metadata sesi saat waktu spawn. Ini mencegah kunci sesi datar atau yang dipulihkan secara tidak sengaja mendapatkan kembali hak istimewa orkestrator.
- **Depth 1 (orkestrator, saat `maxSpawnDepth >= 2`)**: Mendapat `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` sehingga dapat mengelola child-nya. Tool sesi/sistem lainnya tetap ditolak.
- **Depth 1 (leaf, saat `maxSpawnDepth == 1`)**: Tidak ada tool sesi (perilaku default saat ini).
- **Depth 2 (pekerja leaf)**: Tidak ada tool sesi — `sessions_spawn` selalu ditolak pada depth 2. Tidak dapat melakukan spawn child lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada depth apa pun) dapat memiliki paling banyak `maxChildrenPerAgent` (default: 5) child aktif pada saat yang sama. Ini mencegah fan-out tak terkendali dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator depth-1 secara otomatis juga menghentikan semua child depth-2 miliknya:

- `/stop` di chat utama menghentikan semua agen depth-1 dan berantai ke child depth-2 mereka.
- `/subagents kill <id>` menghentikan sub-agent tertentu dan berantai ke child-nya.
- `/subagents kill all` menghentikan semua sub-agent untuk peminta dan berantai.

## Autentikasi

Autentikasi sub-agent diselesaikan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi sub-agent adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen menimpa profil utama saat terjadi konflik.

Catatan: penggabungan bersifat aditif, jadi profil utama selalu tersedia sebagai fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Pengumuman

Sub-agent melaporkan kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi sub-agent (bukan sesi peminta).
- Jika sub-agent membalas tepat `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks assistant terbaru adalah token senyap persis `NO_REPLY` / `no_reply`,
  output pengumuman disembunyikan meskipun sebelumnya ada progres yang terlihat.
- Jika tidak, pengiriman bergantung pada depth peminta:
  - sesi peminta level teratas menggunakan panggilan `agent` tindak lanjut dengan pengiriman eksternal (`deliver=true`)
  - sesi subagent peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) agar orkestrator dapat menyintesis hasil child di dalam sesi
  - jika sesi subagent peminta bertingkat sudah tidak ada, OpenClaw beralih ke peminta sesi tersebut jika tersedia
- Untuk sesi peminta level teratas, pengiriman langsung mode penyelesaian pertama-tama menyelesaikan rute percakapan/thread terikat dan hook override, lalu mengisi field target channel yang hilang dari rute tersimpan sesi peminta. Ini menjaga penyelesaian tetap pada chat/topik yang benar bahkan saat asal penyelesaian hanya mengidentifikasi channel.
- Agregasi penyelesaian child dibatasi ke eksekusi peminta saat ini saat membangun temuan penyelesaian bertingkat, mencegah output child dari eksekusi lama yang sudah usang bocor ke pengumuman saat ini.
- Balasan pengumuman mempertahankan perutean thread/topik saat tersedia pada adaptor channel.
- Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:
  - sumber (`subagent` atau `cron`)
  - kunci/id sesi child
  - jenis pengumuman + label tugas
  - baris status yang diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`)
  - konten hasil yang dipilih dari teks assistant terlihat terbaru, atau jika tidak ada, teks tool/toolResult terbaru yang telah disanitasi; eksekusi gagal terminal melaporkan status gagal tanpa memutar ulang teks balasan yang tertangkap
  - instruksi tindak lanjut yang menjelaskan kapan harus membalas vs. tetap diam
- `Status` tidak disimpulkan dari output model; status berasal dari sinyal hasil runtime.
- Saat timeout, jika child hanya sempat menyelesaikan panggilan tool, pengumuman dapat meringkas riwayat itu menjadi ringkasan progres parsial singkat alih-alih memutar ulang output tool mentah.

Payload pengumuman menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (misalnya, `runtime 5m12s`)
- Penggunaan token (input/output/total)
- Estimasi biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, dan path transkrip (agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk)
- Metadata internal dimaksudkan hanya untuk orkestrasi; balasan yang menghadap pengguna harus ditulis ulang dengan suara assistant normal.

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- recall assistant dinormalisasi terlebih dahulu:
  - tag thinking dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML panggilan tool teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan benar
  - scaffolding tool-call/result yang diturunkan levelnya dan penanda konteks historis dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian full-width `<｜...｜>` dihapus
  - XML panggilan tool MiniMax yang malformed dihapus
- teks mirip kredensial/token disunting
- blok panjang dapat dipotong
- riwayat yang sangat besar dapat menghapus baris lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- pemeriksaan transkrip mentah di disk adalah fallback saat Anda memerlukan transkrip lengkap byte demi byte

## Kebijakan Tool (tool sub-agent)

Secara default, sub-agent mendapatkan **semua tool kecuali tool sesi** dan tool sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap merupakan tampilan recall yang dibatasi dan disanitasi di sini juga; ini bukan
dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, sub-agent orkestrator depth-1 juga menerima `sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` sehingga mereka dapat mengelola child mereka.

Override melalui konfigurasi:

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
        // deny diprioritaskan
        deny: ["gateway", "cron"],
        // jika allow ditetapkan, menjadi hanya-allow (deny tetap diprioritaskan)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Konkurensi

Sub-agent menggunakan lane antrean in-process khusus:

- Nama lane: `subagent`
- Konkurensi: `agents.defaults.subagents.maxConcurrent` (default `8`)

## Penghentian

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan semua eksekusi sub-agent aktif yang di-spawn darinya, berantai ke child bertingkat.
- `/subagents kill <id>` menghentikan sub-agent tertentu dan berantai ke child-nya.

## Keterbatasan

- Pengumuman sub-agent bersifat **best-effort**. Jika gateway dimulai ulang, pekerjaan "mengumumkan kembali" yang tertunda akan hilang.
- Sub-agent tetap berbagi sumber daya proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: mengembalikan `{ status: "accepted", runId, childSessionKey }` segera.
- Konteks sub-agent hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman nesting maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Depth 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi child aktif per sesi (default: 5, rentang: 1–20).
