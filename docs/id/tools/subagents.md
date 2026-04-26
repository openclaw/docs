---
read_when:
    - Anda ingin pekerjaan latar belakang atau paralel melalui agent
    - Anda sedang mengubah kebijakan tool `sessions_spawn` atau sub-agent
    - Anda sedang mengimplementasikan atau men-debug sesi sub-agent yang terikat ke thread
sidebarTitle: Sub-agents
summary: Jalankan agent latar belakang terisolasi yang mengumumkan hasil kembali ke chat peminta
title: Sub-agent
x-i18n:
    generated_at: "2026-04-26T11:41:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

Sub-agent adalah proses agent latar belakang yang dijalankan dari proses agent yang sudah ada.
Sub-agent berjalan dalam sesinya sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
saat selesai, **mengumumkan** hasilnya kembali ke
channel chat peminta. Setiap proses sub-agent dilacak sebagai sebuah
[tugas latar belakang](/id/automation/tasks).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / tool lambat" tanpa memblokir proses utama.
- Menjaga sub-agent tetap terisolasi secara default (pemisahan sesi + sandbox opsional).
- Menjaga permukaan tool sulit disalahgunakan: sub-agent **tidak** mendapatkan tool sesi secara default.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agent memiliki konteks dan penggunaan tokennya sendiri secara
default. Untuk tugas berat atau berulang, atur model yang lebih murah untuk sub-agent
dan pertahankan agent utama Anda pada model dengan kualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per-agent. Saat child
benar-benar membutuhkan transkrip peminta saat ini, agent dapat meminta
`context: "fork"` pada spawn tersebut.
</Note>

## Perintah slash

Gunakan `/subagents` untuk memeriksa atau mengendalikan proses sub-agent untuk **sesi saat
ini**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` menampilkan metadata proses (status, cap waktu, id sesi,
path transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan recall yang terbatas,
difilter demi keamanan; periksa path transkrip di disk saat Anda
memerlukan transkrip mentah lengkap.

### Kontrol pengikatan thread

Perintah ini berfungsi pada channel yang mendukung pengikatan thread persisten.
Lihat [Channel yang mendukung thread](#thread-supporting-channels) di bawah.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Perilaku spawn

`/subagents spawn` memulai sub-agent latar belakang sebagai perintah pengguna (bukan
relay internal) dan mengirim satu pembaruan penyelesaian final kembali ke
chat peminta saat proses selesai.

<AccordionGroup>
  <Accordion title="Penyelesaian non-blocking berbasis push">
    - Perintah spawn bersifat non-blocking; perintah ini langsung mengembalikan run id.
    - Saat selesai, sub-agent mengumumkan pesan ringkasan/hasil kembali ke channel chat peminta.
    - Penyelesaian bersifat berbasis push. Setelah di-spawn, **jangan** melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu proses selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
    - Saat selesai, OpenClaw akan melakukan upaya terbaik untuk menutup tab browser/proses terlacak yang dibuka oleh sesi sub-agent tersebut sebelum alur pembersihan pengumuman dilanjutkan.
  </Accordion>
  <Accordion title="Ketahanan pengiriman spawn manual">
    - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan kunci idempotensi yang stabil.
    - Jika pengiriman langsung gagal, sistem akan menggunakan fallback ke perutean antrean.
    - Jika perutean antrean masih belum tersedia, pengumuman akan dicoba ulang dengan exponential backoff singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang telah di-resolve: rute penyelesaian yang terikat thread atau terikat percakapan akan diprioritaskan jika tersedia; jika origin penyelesaian hanya menyediakan channel, OpenClaw akan mengisi target/akun yang hilang dari rute hasil resolve sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi.
  </Accordion>
  <Accordion title="Metadata handoff penyelesaian">
    Handoff penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan saat runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terlihat terbaru, atau teks tool/toolResult terbaru yang sudah disanitasi. Proses gagal terminal tidak menggunakan kembali teks balasan yang ditangkap.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token ringkas.
    - Instruksi pengiriman yang memberi tahu agent peminta untuk menulis ulang dalam suara assistant normal (bukan meneruskan metadata internal mentah).

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` meng-override default untuk proses tertentu tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
    - `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` saat tool mengiklankan runtime tersebut. Lihat [Model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agent-ke-agent. Saat plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya memprioritaskan `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` sampai ACP diaktifkan, peminta tidak berada dalam sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agent default untuk agent konfigurasi OpenClaw normal dari `agents_list`.
  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agent native dimulai dalam keadaan terisolasi kecuali pemanggil secara eksplisit meminta untuk mem-fork
transkrip saat ini.

| Mode       | Kapan digunakan                                                                                                                       | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan tool lambat, atau apa pun yang dapat dijelaskan singkat dalam teks tugas               | Membuat transkrip child yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah. |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil tool sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi child sebelum child dimulai. |

Gunakan `fork` dengan hemat. Mode ini untuk delegasi yang sensitif terhadap konteks, bukan
pengganti untuk menulis prompt tugas yang jelas.

## Tool: `sessions_spawn`

Memulai proses sub-agent dengan `deliver: false` pada lane `subagent` global,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke
channel chat peminta.

**Default:**

- **Model:** mewarisi pemanggil kecuali Anda menyetel `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per-agent); `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** mewarisi pemanggil kecuali Anda menyetel `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per-agent); `sessions_spawn.thinking` eksplisit tetap menang.
- **Run timeout:** jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` jika disetel; jika tidak, fallback ke `0` (tanpa batas waktu).

### Parameter tool

<ParamField path="task" type="string" required>
  Deskripsi tugas untuk sub-agent.
</ParamField>
<ParamField path="label" type="string">
  Label yang dapat dibaca manusia, opsional.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn di bawah id agent lain jika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="model" type="string">
  Override model sub-agent. Nilai yang tidak valid dilewati dan sub-agent berjalan pada model default dengan peringatan dalam hasil tool.
</ParamField>
<ParamField path="thinking" type="string">
  Override level thinking untuk proses sub-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default ke `agents.defaults.subagents.runTimeoutSeconds` jika disetel, jika tidak `0`. Saat disetel, proses sub-agent dibatalkan setelah N detik.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Saat `true`, meminta pengikatan thread channel untuk sesi sub-agent ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` mengarsipkan segera setelah pengumuman (tetap mempertahankan transkrip melalui rename).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak spawn kecuali runtime child target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke sesi child. Hanya untuk sub-agent native. Gunakan `fork` hanya saat child membutuhkan transkrip saat ini.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman channel (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan
`message`/`sessions_send` dari proses yang di-spawn.
</Warning>

## Sesi terikat thread

Saat pengikatan thread diaktifkan untuk sebuah channel, sub-agent dapat tetap terikat
ke sebuah thread sehingga pesan pengguna lanjutan di thread tersebut tetap dirutekan ke
sesi sub-agent yang sama.

### Channel yang mendukung thread

Saat ini **Discord** adalah satu-satunya channel yang didukung. Channel ini mendukung
sesi sub-agent persisten yang terikat thread (`sessions_spawn` dengan
`thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), dan kunci adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, dan
`channels.discord.threadBindings.spawnSubagentSessions`.

### Alur cepat

<Steps>
  <Step title="Spawn">
    `sessions_spawn` dengan `thread: true` (dan opsional `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw membuat atau mengikat thread ke target sesi tersebut di channel aktif.
  </Step>
  <Step title="Rutekan tindak lanjut">
    Balasan dan pesan tindak lanjut di thread tersebut dirutekan ke sesi yang terikat.
  </Step>
  <Step title="Periksa batas waktu">
    Gunakan `/session idle` untuk memeriksa/memperbarui pelepasan fokus otomatis karena tidak aktif dan
    `/session max-age` untuk mengendalikan batas keras.
  </Step>
  <Step title="Lepaskan">
    Gunakan `/unfocus` untuk melepaskan secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah           | Efek                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | Mengikat thread saat ini (atau membuatnya) ke target sub-agent/sesi  |
| `/unfocus`         | Menghapus pengikatan untuk thread saat ini yang sedang terikat       |
| `/agents`          | Mencantumkan proses aktif dan status pengikatan (`thread:<id>` atau `unbound`) |
| `/session idle`    | Memeriksa/memperbarui pelepasan fokus otomatis saat idle (hanya thread terikat yang fokus) |
| `/session max-age` | Memeriksa/memperbarui batas keras (hanya thread terikat yang fokus)  |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override channel dan kunci auto-bind spawn** bersifat khusus adapter. Lihat [Channel yang mendukung thread](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agent yang dapat ditargetkan melalui `agentId` (`["*"]` mengizinkan semua). Default: hanya agent peminta.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist agent target default yang digunakan saat agent peminta tidak menetapkan `subagents.allowAgents`-nya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir pemanggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Override per-agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agent mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons mencakup model efektif setiap agent yang terdaftar
serta metadata runtime tersemat sehingga pemanggil dapat membedakan PI, server aplikasi Codex, dan runtime native lain yang dikonfigurasi.

### Arsip otomatis

- Sesi sub-agent secara otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Pengarsipan menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui rename).
- Arsip otomatis bersifat best-effort; timer yang tertunda akan hilang jika gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** mengarsipkan otomatis; ini hanya menghentikan proses. Sesi tetap ada sampai arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi depth-1 dan depth-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak akan diupayakan untuk ditutup saat proses selesai, meskipun catatan transkrip/sesi tetap disimpan.

## Sub-agent bertingkat

Secara default, sub-agent tidak dapat menjalankan sub-agent mereka sendiri
(`maxSpawnDepth: 1`). Setel `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
nesting — **pola orkestrator**: utama → sub-agent orkestrator →
sub-sub-agent pekerja.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // izinkan sub-agent menjalankan child (default: 1)
        maxChildrenPerAgent: 5, // jumlah maksimum child aktif per sesi agent (default: 5)
        maxConcurrent: 8, // batas konkurensi lane global (default: 8)
        runTimeoutSeconds: 900, // batas waktu default untuk sessions_spawn saat dihilangkan (0 = tanpa batas waktu)
      },
    },
  },
}
```

### Tingkat depth

| Depth | Bentuk kunci sesi                             | Peran                                         | Bisa spawn?                 |
| ----- | --------------------------------------------- | --------------------------------------------- | --------------------------- |
| 0     | `agent:<id>:main`                             | Agent utama                                   | Selalu                      |
| 1     | `agent:<id>:subagent:<uuid>`                  | Sub-agent (orkestrator saat depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | Sub-sub-agent (pekerja leaf)                  | Tidak pernah                |

### Rantai pengumuman

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → mengumumkan ke parent-nya (orkestrator depth-1).
2. Orkestrator depth-1 menerima pengumuman, mensintesis hasil, selesai → mengumumkan ke utama.
3. Agent utama menerima pengumuman dan mengirimkannya ke pengguna.

Setiap tingkat hanya melihat pengumuman dari child langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan child sekali lalu tunggu peristiwa penyelesaian
alih-alih membangun loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah sleep `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan child-session tetap
terfokus pada pekerjaan yang aktif — child yang aktif tetap terpasang, child yang sudah berakhir tetap
terlihat untuk jendela recent singkat, dan tautan child stale yang hanya ada di store
diabaikan setelah jendela freshness-nya. Ini mencegah metadata lama `spawnedBy` /
`parentSessionKey` memunculkan kembali child ghost setelah
restart. Jika peristiwa penyelesaian child tiba setelah Anda sudah mengirim
jawaban final, tindak lanjut yang benar adalah token diam yang persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan tool berdasarkan depth

- Cakupan peran dan kontrol ditulis ke metadata sesi saat spawn. Ini mencegah kunci sesi yang datar atau dipulihkan tanpa sengaja mendapatkan kembali hak orkestrator.
- **Depth 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` sehingga dapat mengelola child-nya. Tool sesi/sistem lainnya tetap ditolak.
- **Depth 1 (leaf, saat `maxSpawnDepth == 1`):** tidak ada tool sesi (perilaku default saat ini).
- **Depth 2 (pekerja leaf):** tidak ada tool sesi — `sessions_spawn` selalu ditolak pada depth 2. Tidak dapat menjalankan child lebih lanjut.

### Batas spawn per-agent

Setiap sesi agent (pada depth mana pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) child aktif pada satu waktu. Ini mencegah fan-out tak terkendali
dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator depth-1 secara otomatis juga menghentikan semua
child depth-2-nya:

- `/stop` di chat utama menghentikan semua agent depth-1 dan meneruskannya ke child depth-2 mereka.
- `/subagents kill <id>` menghentikan sub-agent tertentu dan meneruskan ke child-nya.
- `/subagents kill all` menghentikan semua sub-agent untuk peminta dan meneruskan penghentian tersebut.

## Autentikasi

Auth sub-agent di-resolve berdasarkan **id agent**, bukan berdasarkan jenis sesi:

- Kunci sesi sub-agent adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan auth dimuat dari `agentDir` milik agent tersebut.
- Profil auth agent utama digabungkan sebagai **fallback**; profil agent meng-override profil utama jika ada konflik.

Penggabungannya bersifat aditif, jadi profil utama selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agent belum didukung.

## Pengumuman

Sub-agent melaporkan kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi sub-agent (bukan sesi peminta).
- Jika sub-agent membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks assistant terbaru adalah token diam yang persis `NO_REPLY` / `no_reply`, output pengumuman disembunyikan meskipun sebelumnya ada progres yang terlihat.

Pengiriman bergantung pada depth peminta:

- Sesi peminta level atas menggunakan pemanggilan `agent` lanjutan dengan pengiriman eksternal (`deliver=true`).
- Sesi subagent peminta bertingkat menerima injeksi lanjutan internal (`deliver=false`) sehingga orkestrator dapat mensintesis hasil child di dalam sesi.
- Jika sesi subagent peminta bertingkat sudah tidak ada, OpenClaw menggunakan fallback ke peminta sesi tersebut bila tersedia.

Untuk sesi peminta level atas, pengiriman langsung mode penyelesaian terlebih dahulu
me-resolve rute percakapan/thread terikat dan override hook, lalu mengisi
field target channel yang hilang dari rute tersimpan sesi peminta.
Ini menjaga penyelesaian tetap pada chat/topik yang benar meskipun origin penyelesaian
hanya mengidentifikasi channel.

Agregasi penyelesaian child dibatasi ke proses peminta saat ini saat
membangun temuan penyelesaian bertingkat, sehingga output child dari proses lama yang stale
tidak bocor ke pengumuman saat ini. Balasan pengumuman mempertahankan
perutean thread/topik jika tersedia pada adapter channel.

### Konteks pengumuman

Konteks pengumuman dinormalisasi ke blok peristiwa internal yang stabil:

| Field          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` atau `cron`                                                                                        |
| Session ids    | Kunci/id sesi child                                                                                           |
| Type           | Jenis pengumuman + label tugas                                                                                |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Result content | Teks assistant terlihat terbaru, atau teks tool/toolResult terbaru yang sudah disanitasi                      |
| Follow-up      | Instruksi yang menjelaskan kapan harus membalas vs tetap diam                                                 |

Proses gagal terminal melaporkan status kegagalan tanpa memutar ulang
teks balasan yang ditangkap. Saat timeout, jika child hanya sempat sampai pada pemanggilan tool, pengumuman
dapat merangkum riwayat tersebut menjadi ringkasan progres parsial singkat
alih-alih memutar ulang output tool mentah.

### Baris statistik

Payload pengumuman menyertakan baris statistik di bagian akhir (bahkan saat dibungkus):

- Runtime (misalnya `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Estimasi biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan path transkrip sehingga agent utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal hanya dimaksudkan untuk orkestrasi; balasan yang ditujukan kepada pengguna
harus ditulis ulang dalam suara assistant normal.

### Mengapa lebih memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Recall assistant dinormalisasi terlebih dahulu: thinking tag dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML pemanggilan tool teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup rapi; scaffolding pemanggilan tool/hasil yang diturunkan dan penanda konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII `<|...|>` lainnya, full-width `<｜...｜>`) dihapus; XML pemanggilan tool MiniMax yang malformed dihapus.
- Teks yang menyerupai kredensial/token disunting.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat menghapus baris lama atau mengganti baris yang terlalu besar dengan `[sessions_history omitted: message too large]`.
- Pemeriksaan transkrip mentah di disk adalah fallback saat Anda memerlukan transkrip lengkap byte demi byte.

## Kebijakan tool

Sub-agent menggunakan pipeline profil dan kebijakan tool yang sama seperti parent atau
agent target terlebih dahulu. Setelah itu, OpenClaw menerapkan lapisan pembatasan sub-agent.

Tanpa `tools.profile` yang membatasi, sub-agent mendapatkan **semua tool kecuali
tool sesi** dan tool sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap merupakan tampilan recall yang terbatas dan disanitasi di sini juga — ini
bukan dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, sub-agent orkestrator depth-1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` sehingga mereka dapat mengelola child mereka.

### Override melalui konfigurasi

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
        // jika allow disetel, ini menjadi allow-only (deny tetap menang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` adalah filter allow-only final. Ini dapat mempersempit
set tool yang sudah di-resolve, tetapi tidak dapat **menambahkan kembali** tool yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` mencakup
`web_search`/`web_fetch` tetapi tidak tool `browser`. Untuk mengizinkan
sub-agent profil coding menggunakan otomasi browser, tambahkan browser pada
tahap profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gunakan `agents.list[].tools.alsoAllow: ["browser"]` per-agent saat hanya satu
agent yang seharusnya mendapatkan otomasi browser.

## Konkurensi

Sub-agent menggunakan lane antrean in-process khusus:

- **Nama lane:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Liveness dan pemulihan

OpenClaw tidak menganggap tidak adanya `endedAt` sebagai bukti permanen bahwa
sub-agent masih hidup. Proses yang belum berakhir dan lebih tua dari jendela stale-run
tidak lagi dihitung sebagai aktif/tertunda dalam `/subagents list`, ringkasan status,
gating penyelesaian turunan, dan pemeriksaan konkurensi per sesi.

Setelah gateway di-restart, proses stale yang belum berakhir dan dipulihkan akan dipangkas kecuali
sesi child-nya ditandai `abortedLastRun: true`. Sesi child yang
diaborsi saat restart tersebut tetap dapat dipulihkan melalui alur pemulihan orphan sub-agent,
yang mengirim pesan resume sintetis sebelum
menghapus penanda aborted tersebut.

<Note>
Jika spawn sub-agent gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengubah status pairing.
Koordinasi internal `sessions_spawn` harus terhubung sebagai
`client.id: "gateway-client"` dengan `client.mode: "backend"` melalui auth
shared-token/password loopback langsung; jalur tersebut tidak bergantung pada
baseline cakupan perangkat berpasangan milik CLI. Pemanggil remote, `deviceIdentity`
eksplisit, jalur device-token eksplisit, dan klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan proses sub-agent aktif yang dijalankan darinya, termasuk meneruskan penghentian ke child bertingkat.
- `/subagents kill <id>` menghentikan sub-agent tertentu dan meneruskan penghentian ke child-nya.

## Batasan

- Pengumuman sub-agent bersifat **best-effort**. Jika gateway di-restart, pekerjaan "mengumumkan kembali" yang tertunda akan hilang.
- Sub-agent tetap berbagi sumber daya proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agent hanya menyisipkan `AGENTS.md` + `TOOLS.md` (tidak ada `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman nesting maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Depth 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi jumlah child aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [ACP agents](/id/tools/acp-agents)
- [Agent send](/id/tools/agent-send)
- [Background tasks](/id/automation/tasks)
- [Multi-agent sandbox tools](/id/tools/multi-agent-sandbox-tools)
