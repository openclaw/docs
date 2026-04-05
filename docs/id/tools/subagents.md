---
read_when:
    - Anda menginginkan pekerjaan latar belakang/paralel melalui agen
    - Anda sedang mengubah sessions_spawn atau kebijakan tool sub-agen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat thread
summary: 'Sub-agen: men-spawn eksekusi agen terisolasi yang mengumumkan hasil kembali ke chat peminta'
title: Sub-Agen
x-i18n:
    generated_at: "2026-04-05T14:09:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9df7cc35a3069ce4eb9c92a95df3ce5365a00a3fae92ff73def75461b58fec3f
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-agen

Sub-agen adalah eksekusi agen latar belakang yang di-spawn dari eksekusi agen yang sudah ada. Mereka berjalan dalam sesi mereka sendiri (`agent:<agentId>:subagent:<uuid>`) dan, saat selesai, **mengumumkan** hasilnya kembali ke channel chat peminta. Setiap eksekusi sub-agen dilacak sebagai [tugas latar belakang](/id/automation/tasks).

## Slash command

Gunakan `/subagents` untuk memeriksa atau mengendalikan eksekusi sub-agen untuk **sesi saat ini**:

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

`/subagents info` menampilkan metadata eksekusi (status, timestamp, session id, path transkrip, cleanup).
Gunakan `sessions_history` untuk tampilan recall yang dibatasi dan difilter demi keamanan; periksa
path transkrip di disk saat Anda memerlukan transkrip mentah lengkap.

### Perilaku spawn

`/subagents spawn` memulai sub-agen latar belakang sebagai perintah pengguna, bukan relay internal, dan mengirim satu pembaruan penyelesaian final kembali ke chat peminta saat eksekusi selesai.

- Perintah spawn bersifat non-blocking; perintah ini langsung mengembalikan run id.
- Saat selesai, sub-agen mengumumkan ringkasan/pesan hasil kembali ke channel chat peminta.
- Pengiriman penyelesaian berbasis push. Setelah di-spawn, jangan polling `/subagents list`,
  `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu
  selesai; periksa status hanya bila diperlukan untuk debugging atau intervensi.
- Saat selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser yang dilacak yang dibuka oleh sesi sub-agen tersebut sebelum alur cleanup announce berlanjut.
- Untuk spawn manual, pengiriman bersifat tangguh:
  - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan key idempotensi yang stabil.
  - Jika pengiriman langsung gagal, OpenClaw fallback ke routing antrean.
  - Jika routing antrean masih tidak tersedia, announce dicoba ulang dengan exponential backoff singkat sebelum akhirnya menyerah.
- Pengiriman penyelesaian mempertahankan rute peminta yang telah diresolusikan:
  - rute penyelesaian yang terikat thread atau percakapan menang bila tersedia
  - jika asal penyelesaian hanya menyediakan channel, OpenClaw mengisi target/akun yang hilang dari rute terresolusikan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap berfungsi
- Handoff penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan runtime (bukan teks buatan pengguna) dan mencakup:
  - `Result` (teks balasan `assistant` terbaru yang terlihat, atau jika tidak ada, teks tool/toolResult terbaru yang sudah disanitasi)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistik runtime/token yang ringkas
  - instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dalam suara asisten normal (bukan meneruskan metadata internal mentah)
- `--model` dan `--thinking` meng-override default untuk eksekusi spesifik tersebut.
- Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
- `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
- Untuk sesi harness ACP (Codex, Claude Code, Gemini CLI), gunakan `sessions_spawn` dengan `runtime: "acp"` dan lihat [Agen ACP](/tools/acp-agents).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / tool lambat" tanpa memblokir eksekusi utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi + sandboxing opsional).
- Menjaga permukaan tool sulit disalahgunakan: sub-agen **tidak** mendapatkan session tool secara default.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orkestrator.

Catatan biaya: setiap sub-agen memiliki **konteks dan penggunaan tokennya sendiri**. Untuk tugas
yang berat atau berulang, setel model yang lebih murah untuk sub-agen dan pertahankan agen utama Anda pada model berkualitas lebih tinggi.
Anda dapat mengonfigurasi ini melalui `agents.defaults.subagents.model` atau override per agen.

## Tool

Gunakan `sessions_spawn`:

- Memulai eksekusi sub-agen (`deliver: false`, lane global: `subagent`)
- Lalu menjalankan langkah announce dan memposting balasan announce ke channel chat peminta
- Model default: mewarisi pemanggil kecuali Anda menyetel `agents.defaults.subagents.model` (atau per agen `agents.list[].subagents.model`); `sessions_spawn.model` eksplisit tetap menang.
- Thinking default: mewarisi pemanggil kecuali Anda menyetel `agents.defaults.subagents.thinking` (atau per agen `agents.list[].subagents.thinking`); `sessions_spawn.thinking` eksplisit tetap menang.
- Timeout eksekusi default: jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` bila disetel; jika tidak, fallback ke `0` (tanpa timeout).

Parameter tool:

- `task` (wajib)
- `label?` (opsional)
- `agentId?` (opsional; spawn di bawah agent id lain jika diizinkan)
- `model?` (opsional; meng-override model sub-agen; nilai yang tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan di hasil tool)
- `thinking?` (opsional; meng-override level thinking untuk eksekusi sub-agen)
- `runTimeoutSeconds?` (default ke `agents.defaults.subagents.runTimeoutSeconds` bila disetel, jika tidak `0`; saat disetel, eksekusi sub-agen dibatalkan setelah N detik)
- `thread?` (default `false`; saat `true`, meminta binding thread channel untuk sesi sub-agen ini)
- `mode?` (`run|session`)
  - default adalah `run`
  - jika `thread: true` dan `mode` dihilangkan, default menjadi `session`
  - `mode: "session"` memerlukan `thread: true`
- `cleanup?` (`delete|keep`, default `keep`)
- `sandbox?` (`inherit|require`, default `inherit`; `require` menolak spawn kecuali runtime child target berada dalam sandbox)
- `sessions_spawn` **tidak** menerima parameter pengiriman channel (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan `message`/`sessions_send` dari eksekusi yang di-spawn.

## Sesi terikat thread

Saat binding thread diaktifkan untuk sebuah channel, sub-agen dapat tetap terikat ke thread sehingga pesan pengguna lanjutan di thread tersebut terus dirutekan ke sesi sub-agen yang sama.

### Channel yang mendukung thread

- Discord (saat ini satu-satunya channel yang didukung): mendukung sesi subagen persisten yang terikat thread (`sessions_spawn` dengan `thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), dan key adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, serta `channels.discord.threadBindings.spawnSubagentSessions`.

Alur cepat:

1. Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"`).
2. OpenClaw membuat atau mengikat thread ke target sesi tersebut di channel aktif.
3. Balasan dan pesan lanjutan di thread itu dirutekan ke sesi yang terikat.
4. Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus karena tidak aktif dan `/session max-age` untuk mengendalikan batas keras.
5. Gunakan `/unfocus` untuk melepas ikatan secara manual.

Kontrol manual:

- `/focus <target>` mengikat thread saat ini (atau membuatnya) ke target sub-agen/sesi.
- `/unfocus` menghapus binding untuk thread terikat saat ini.
- `/agents` menampilkan daftar eksekusi aktif dan status binding (`thread:<id>` atau `unbound`).
- `/session idle` dan `/session max-age` hanya berfungsi untuk thread terikat yang sedang difokuskan.

Sakelar config:

- Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Override channel dan key spawn auto-bind bersifat spesifik adapter. Lihat **Channel yang mendukung thread** di atas.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference) dan [Slash commands](/tools/slash-commands) untuk detail adapter saat ini.

Allowlist:

- `agents.list[].subagents.allowAgents`: daftar agent id yang dapat ditargetkan melalui `agentId` (`["*"]` untuk mengizinkan semua). Default: hanya agen peminta.
- `agents.defaults.subagents.allowAgents`: allowlist agen target default yang digunakan saat agen peminta tidak menetapkan `subagents.allowAgents` sendiri.
- Pelindung pewarisan sandbox: jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: saat true, blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Default: false.

Discovery:

- Gunakan `agents_list` untuk melihat agent id mana yang saat ini diizinkan untuk `sessions_spawn`.

Auto-archive:

- Sesi sub-agen diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default: 60).
- Pengarsipan menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` mengarsipkan segera setelah announce (tetap menyimpan transkrip melalui rename).
- Auto-archive bersifat best-effort; timer yang tertunda hilang jika gateway restart.
- `runTimeoutSeconds` **tidak** melakukan auto-archive; ini hanya menghentikan eksekusi. Sesi tetap ada sampai auto-archive.
- Auto-archive berlaku sama untuk sesi kedalaman 1 dan kedalaman 2.
- Cleanup browser terpisah dari cleanup archive: tab/proses browser yang dilacak ditutup sebaik mungkin saat eksekusi selesai, meskipun catatan transkrip/sesi tetap disimpan.

## Sub-agen bertingkat

Secara default, sub-agen tidak dapat men-spawn sub-agen mereka sendiri (`maxSpawnDepth: 1`). Anda dapat mengaktifkan satu tingkat nesting dengan menetapkan `maxSpawnDepth: 2`, yang memungkinkan **pola orkestrator**: main → sub-agen orkestrator → sub-sub-agen pekerja.

### Cara mengaktifkan

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // izinkan sub-agen men-spawn child (default: 1)
        maxChildrenPerAgent: 5, // child aktif maksimum per sesi agen (default: 5)
        maxConcurrent: 8, // batas lane konkurensi global (default: 8)
        runTimeoutSeconds: 900, // timeout default untuk sessions_spawn saat dihilangkan (0 = tanpa timeout)
      },
    },
  },
}
```

### Tingkat kedalaman

| Kedalaman | Bentuk session key                           | Peran                                         | Bisa spawn?                    |
| --------- | -------------------------------------------- | --------------------------------------------- | ------------------------------ |
| 0         | `agent:<id>:main`                            | Agen utama                                    | Selalu                         |
| 1         | `agent:<id>:subagent:<uuid>`                 | Sub-agen (orkestrator bila depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agen (pekerja leaf)                   | Tidak pernah                   |

### Rantai announce

Hasil mengalir kembali ke atas rantai:

1. Pekerja kedalaman 2 selesai → announce ke induknya (orkestrator kedalaman 1)
2. Orkestrator kedalaman 1 menerima announce, menyintesis hasil, selesai → announce ke main
3. Agen utama menerima announce dan mengirimkannya ke pengguna

Setiap tingkat hanya melihat announce dari child langsungnya.

Panduan operasional:

- Mulai pekerjaan child sekali dan tunggu event penyelesaian alih-alih membangun loop polling
  di sekitar `sessions_list`, `sessions_history`, `/subagents list`, atau
  perintah `exec` sleep.
- Jika event penyelesaian child tiba setelah Anda уже mengirim jawaban final,
  tindak lanjut yang benar adalah token diam persis `NO_REPLY` / `no_reply`.

### Kebijakan tool berdasarkan kedalaman

- Role dan cakupan kontrol ditulis ke metadata sesi saat spawn. Ini mencegah session key datar atau sesi yang dipulihkan secara tidak sengaja mendapatkan kembali hak istimewa orkestrator.
- **Kedalaman 1 (orkestrator, saat `maxSpawnDepth >= 2`)**: Mendapat `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` sehingga dapat mengelola child-nya. Session/system tool lain tetap ditolak.
- **Kedalaman 1 (leaf, saat `maxSpawnDepth == 1`)**: Tidak ada session tool (perilaku default saat ini).
- **Kedalaman 2 (pekerja leaf)**: Tidak ada session tool — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat men-spawn child lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (di kedalaman berapa pun) dapat memiliki paling banyak `maxChildrenPerAgent` (default: 5) child aktif sekaligus. Ini mencegah fan-out tak terkendali dari satu orkestrator.

### Cascade stop

Menghentikan orkestrator kedalaman 1 secara otomatis juga menghentikan semua child kedalaman 2 miliknya:

- `/stop` di chat utama menghentikan semua agen kedalaman 1 dan mencascadekan ke child kedalaman 2 mereka.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan mencascadekan ke child-nya.
- `/subagents kill all` menghentikan semua sub-agen untuk peminta dan mencascadekan.

## Autentikasi

Auth sub-agen diresolusikan berdasarkan **agent id**, bukan berdasarkan tipe sesi:

- Session key sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan auth dimuat dari `agentDir` milik agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen meng-override profil main jika terjadi konflik.

Catatan: penggabungan ini bersifat aditif, sehingga profil main selalu tersedia sebagai fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Announce

Sub-agen melapor kembali melalui langkah announce:

- Langkah announce berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas tepat `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token diam persis `NO_REPLY` / `no_reply`,
  output announce ditekan meskipun sebelumnya ada progres yang terlihat.
- Jika tidak, pengiriman bergantung pada kedalaman peminta:
  - sesi peminta tingkat atas menggunakan panggilan `agent` lanjutan dengan pengiriman eksternal (`deliver=true`)
  - sesi subagen peminta bertingkat menerima injeksi lanjutan internal (`deliver=false`) sehingga orkestrator dapat menyintesis hasil child di dalam sesi
  - jika sesi subagen peminta bertingkat sudah hilang, OpenClaw fallback ke peminta sesi tersebut bila tersedia
- Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian pertama-tama meresolusikan rute percakapan/thread terikat dan hook override, lalu mengisi field target channel yang hilang dari rute tersimpan milik sesi peminta. Ini menjaga penyelesaian tetap pada chat/topik yang benar bahkan ketika asal penyelesaian hanya mengidentifikasi channel.
- Agregasi penyelesaian child dibatasi pada eksekusi peminta saat ini ketika membangun temuan penyelesaian bertingkat, mencegah output child basi dari eksekusi sebelumnya bocor ke announce saat ini.
- Balasan announce mempertahankan routing thread/topik bila tersedia pada adapter channel.
- Konteks announce dinormalisasi menjadi blok event internal yang stabil:
  - sumber (`subagent` atau `cron`)
  - child session key/id
  - tipe announce + label tugas
  - baris status yang diturunkan dari sinyal hasil runtime (`success`, `error`, `timeout`, atau `unknown`)
  - konten hasil yang dipilih dari teks asisten terbaru yang terlihat, atau jika tidak ada, teks tool/toolResult terbaru yang sudah disanitasi
  - instruksi lanjutan yang menjelaskan kapan harus membalas vs. tetap diam
- `Status` tidak disimpulkan dari output model; status berasal dari sinyal hasil runtime.
- Saat timeout, jika child hanya sempat melalui tool call, announce dapat merangkum riwayat itu menjadi ringkasan progres parsial yang singkat alih-alih memutar ulang output tool mentah.

Payload announce menyertakan baris statistik di bagian akhir (bahkan saat dibungkus):

- Runtime (misalnya, `runtime 5m12s`)
- Penggunaan token (input/output/total)
- Perkiraan biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, dan path transkrip (sehingga agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk)
- Metadata internal dimaksudkan hanya untuk orkestrasi; balasan yang menghadap pengguna harus ditulis ulang dalam suara asisten yang normal.

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- recall asisten dinormalisasi terlebih dahulu:
  - tag thinking dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML tool-call teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan benar
  - scaffolding tool-call/result yang diturunkan dan penanda konteks historis dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian lebar penuh `<｜...｜>` dihapus
  - XML tool-call MiniMax yang malformed dihapus
- teks mirip kredensial/token disunting
- blok panjang dapat dipotong
- riwayat yang sangat besar dapat membuang baris lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- inspeksi transkrip mentah di disk adalah fallback saat Anda memerlukan transkrip lengkap byte demi byte

## Kebijakan Tool (tool sub-agen)

Secara default, sub-agen mendapatkan **semua tool kecuali session tool** dan system tool:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap merupakan tampilan recall yang dibatasi dan disanitasi di sini juga; ini bukan
dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, sub-agen orkestrator kedalaman 1 juga menerima `sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` sehingga mereka dapat mengelola child mereka.

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
        // jika allow disetel, menjadi hanya-allow (deny tetap menang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Konkurensi

Sub-agen menggunakan lane antrean khusus di dalam proses:

- Nama lane: `subagent`
- Konkurensi: `agents.defaults.subagents.maxConcurrent` (default `8`)

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan eksekusi sub-agen aktif yang di-spawn darinya, termasuk cascade ke child bertingkat.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan mencascadekan ke child-nya.

## Batasan

- Announce sub-agen bersifat **best-effort**. Jika gateway restart, pekerjaan "announce back" yang tertunda akan hilang.
- Sub-agen tetap berbagi sumber daya proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman nesting maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi child aktif per sesi (default: 5, rentang: 1–20).
