---
read_when:
    - Anda ingin pekerjaan latar belakang atau paralel melalui agen
    - Anda sedang mengubah sessions_spawn atau kebijakan alat subagen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat utas
sidebarTitle: Sub-agents
summary: Buat eksekusi agen latar belakang terisolasi yang mengumumkan hasilnya kembali ke chat peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-05-07T01:54:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah eksekusi agen latar belakang yang dibuat dari eksekusi agen yang sudah ada.
Mereka berjalan dalam sesi mereka sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke saluran chat
peminta. Setiap eksekusi sub-agen dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

Untuk model keamanan di balik delegasi, lihat
[Batas multi-agen dan sub-agen](/id/gateway/security#multi-agent-and-sub-agent-boundaries).
Sub-agen berguna sebagai unit isolasi dan alur kerja, tetapi bukan batas otorisasi
multi-tenant yang bersifat hostil di dalam satu Gateway bersama.

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / tool lambat" tanpa memblokir eksekusi utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi + sandbox opsional).
- Menjaga permukaan tool sulit disalahgunakan: sub-agen **tidak** mendapatkan tool sesi secara default.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agen memiliki konteks dan penggunaan token sendiri
secara default. Untuk tugas berat atau berulang, tetapkan model yang lebih murah untuk sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per agen. Ketika sebuah child
    benar-benar membutuhkan transkrip peminta saat ini, agen dapat meminta
    `context: "fork"` pada satu spawn itu. Sesi subagent yang terikat thread secara default
    menggunakan `context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini menjadi
    thread tindak lanjut.
</Note>

## Perintah slash

Gunakan `/subagents` untuk memeriksa atau mengontrol eksekusi sub-agen untuk **sesi
saat ini**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Gunakan [`/steer <message>`](/id/tools/steer) tingkat atas untuk mengarahkan eksekusi aktif sesi peminta saat ini. Gunakan `/subagents steer <id|#> <message>` ketika targetnya adalah eksekusi child.

`/subagents info` menampilkan metadata eksekusi (status, timestamp, id sesi,
path transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan ingatan
terbatas yang difilter demi keamanan; periksa path transkrip pada disk ketika Anda
membutuhkan transkrip lengkap mentah.

### Kontrol pengikatan thread

Perintah ini bekerja pada saluran yang mendukung pengikatan thread persisten.
Lihat [Saluran pendukung thread](#thread-supporting-channels) di bawah.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Perilaku spawn

`/subagents spawn` memulai sub-agen latar belakang sebagai perintah pengguna (bukan
relay internal) dan mengirimkan satu pembaruan penyelesaian final kembali ke chat
peminta ketika eksekusi selesai.

<AccordionGroup>
  <Accordion title="Penyelesaian berbasis push tanpa pemblokiran">
    - Perintah spawn tidak memblokir; perintah ini langsung mengembalikan id eksekusi.
    - Saat selesai, sub-agen mengumumkan pesan ringkasan/hasil kembali ke saluran chat peminta.
    - Penyelesaian bersifat berbasis push. Setelah dibuat, jangan melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
    - Saat selesai, OpenClaw akan berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen itu sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Ketahanan pengiriman spawn manual">
    - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan kunci idempotensi yang stabil.
    - Jika giliran penyelesaian agen peminta gagal, tidak menghasilkan output yang terlihat, atau mengembalikan prefiks yang jelas tidak lengkap dari hasil child yang ditangkap, OpenClaw beralih ke pengiriman penyelesaian langsung dari hasil child yang ditangkap.
    - Jika pengiriman langsung tidak dapat digunakan, OpenClaw beralih ke routing antrean.
    - Jika routing antrean masih belum tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang sudah diselesaikan: rute penyelesaian yang terikat thread atau terikat percakapan menang ketika tersedia; jika asal penyelesaian hanya menyediakan saluran, OpenClaw mengisi target/akun yang hilang dari rute terselesaikan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap bekerja.

  </Accordion>
  <Accordion title="Metadata handoff penyelesaian">
    Handoff penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat, jika tidak ada maka teks tool/toolResult terbaru yang telah disanitasi. Eksekusi terminal yang gagal tidak menggunakan ulang teks balasan yang ditangkap.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token ringkas.
    - Instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dengan suara asisten normal (bukan meneruskan metadata internal mentah).

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` mengoverride default untuk eksekusi spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
    - `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika tool mengiklankan runtime tersebut. Lihat [Model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agen-ke-agen. Ketika Plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya mengutamakan `/codex ...` dibanding ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak disandbox, dan Plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native mulai terisolasi kecuali pemanggil secara eksplisit meminta fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan tool lambat, atau apa pun yang dapat dijelaskan secara singkat dalam teks tugas                           | Membuat transkrip child yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil tool sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi child sebelum child dimulai. |

Gunakan `fork` secara hemat. Ini untuk delegasi yang peka konteks, bukan
pengganti untuk menulis prompt tugas yang jelas.

## Tool: `sessions_spawn`

Memulai eksekusi sub-agen dengan `deliver: false` pada lane `subagent` global,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke saluran
chat peminta.

Ketersediaan bergantung pada kebijakan tool efektif milik pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara default. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agen yang perlu mendelegasikan
pekerjaan. Kebijakan allow/deny saluran/grup, provider, sandbox, dan per agen masih dapat
menghapus tool setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar tool efektif.

**Default:**

- **Model:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen); `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen); `sessions_spawn.thinking` eksplisit tetap menang.
- **Timeout eksekusi:** jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` ketika ditetapkan; jika tidak, kembali ke `0` (tanpa timeout).

### Parameter tool

<ParamField path="task" type="string" required>
  Deskripsi tugas untuk sub-agen.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang mudah dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn di bawah id agen lain ketika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang sudah ada ketika `runtime: "acp"`; diabaikan untuk spawn sub-agen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Mengalirkan output eksekusi ACP ke sesi parent ketika `runtime: "acp"`; hilangkan untuk spawn sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Override model sub-agen. Nilai yang tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan dalam hasil tool.
</ParamField>
<ParamField path="thinking" type="string">
  Override tingkat thinking untuk eksekusi sub-agen.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default ke `agents.defaults.subagents.runTimeoutSeconds` ketika ditetapkan, jika tidak `0`. Ketika ditetapkan, eksekusi sub-agen dibatalkan setelah N detik.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Ketika `true`, meminta pengikatan thread saluran untuk sesi sub-agen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` mengarsipkan segera setelah pengumuman (tetap menyimpan transkrip melalui rename).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak spawn kecuali runtime child target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip saat ini milik peminta ke sesi child. Hanya sub-agen native. Spawn yang terikat thread secara default menggunakan `fork`; spawn non-thread secara default menggunakan `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman saluran (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan
`message`/`sessions_send` dari eksekusi yang dibuat.
</Warning>

## Sesi terikat thread

Ketika pengikatan thread diaktifkan untuk sebuah saluran, sub-agen dapat tetap terikat
ke thread sehingga pesan pengguna tindak lanjut dalam thread itu terus dirutekan ke
sesi sub-agen yang sama.

### Saluran pendukung thread

**Discord** saat ini adalah satu-satunya saluran yang didukung. Saluran ini mendukung
sesi subagent persisten yang terikat thread (`sessions_spawn` dengan
`thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), dan kunci adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, dan
`channels.discord.threadBindings.spawnSessions`.

### Alur cepat

<Steps>
  <Step title="Spawn">
    `sessions_spawn` dengan `thread: true` (dan opsional `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw membuat atau mengikat thread ke target sesi tersebut di channel aktif.
  </Step>
  <Step title="Route follow-ups">
    Balasan dan pesan tindak lanjut di thread tersebut dirutekan ke sesi yang terikat.
  </Step>
  <Step title="Inspect timeouts">
    Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus saat tidak aktif dan
    `/session max-age` untuk mengontrol batas keras.
  </Step>
  <Step title="Detach">
    Gunakan `/unfocus` untuk melepas secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah           | Efek                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ikat thread saat ini (atau buat satu) ke target sub-agent/sesi        |
| `/unfocus`         | Hapus pengikatan untuk thread terikat saat ini                        |
| `/agents`          | Cantumkan run aktif dan status pengikatan (`thread:<id>` atau `unbound`) |
| `/session idle`    | Periksa/perbarui auto-unfocus idle (hanya thread terikat yang difokuskan) |
| `/session max-age` | Periksa/perbarui batas keras (hanya thread terikat yang difokuskan)   |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override channel dan kunci spawn auto-bind** bersifat khusus adapter. Lihat [Channel yang mendukung thread](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan apa pun). Default: hanya agen peminta. Jika Anda menetapkan daftar dan tetap ingin peminta men-spawn dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist agen target default yang digunakan saat agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Override per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jika sesi peminta disandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif tiap agen yang tercantum
dan metadata runtime tertanam sehingga pemanggil dapat membedakan PI, Codex
app-server, dan runtime native terkonfigurasi lainnya.

### Arsip otomatis

- Sesi sub-agent diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah announce (tetap menyimpan transkrip melalui penggantian nama).
- Arsip otomatis bersifat best-effort; timer tertunda hilang jika gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** mengarsipkan otomatis; itu hanya menghentikan run. Sesi tetap ada hingga arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi depth-1 dan depth-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup secara best-effort saat run selesai, meskipun catatan transkrip/sesi tetap disimpan.

## Sub-agent bertingkat

Secara default, sub-agent tidak dapat men-spawn sub-agent mereka sendiri
(`maxSpawnDepth: 1`). Tetapkan `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
nesting — **pola orkestrator**: utama → sub-agent orkestrator →
sub-sub-agent pekerja.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // izinkan sub-agent men-spawn anak (default: 1)
        maxChildrenPerAgent: 5, // anak aktif maksimum per sesi agen (default: 5)
        maxConcurrent: 8, // batas lane konkurensi global (default: 8)
        runTimeoutSeconds: 900, // timeout default untuk sessions_spawn saat dihilangkan (0 = tanpa timeout)
      },
    },
  },
}
```

### Tingkat depth

| Depth | Bentuk kunci sesi                            | Peran                                         | Dapat men-spawn?             |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orkestrator saat depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (pekerja leaf)                  | Tidak pernah                 |

### Rantai announce

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → mengumumkan ke induknya (orkestrator depth-1).
2. Orkestrator depth-1 menerima announce, menyintesis hasil, selesai → mengumumkan ke utama.
3. Agen utama menerima announce dan mengirimkan ke pengguna.

Setiap tingkat hanya melihat announce dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak sekali dan tunggu event penyelesaian
alih-alih membangun loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah sleep `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi anak
tetap berfokus pada pekerjaan live — anak live tetap terpasang, anak yang berakhir tetap
terlihat untuk jendela terbaru singkat, dan tautan anak lama yang hanya ada di store
diabaikan setelah jendela kesegarannya. Ini mencegah metadata `spawnedBy` /
`parentSessionKey` lama membangkitkan anak semu setelah
restart. Jika event penyelesaian anak tiba setelah Anda sudah mengirim
jawaban final, tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan tool berdasarkan depth

- Peran dan cakupan kontrol ditulis ke metadata sesi saat spawn. Ini mencegah kunci sesi datar atau yang dipulihkan secara tidak sengaja mendapatkan kembali hak istimewa orkestrator.
- **Depth 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` sehingga dapat mengelola anaknya. Tool sesi/sistem lain tetap ditolak.
- **Depth 1 (leaf, saat `maxSpawnDepth == 1`):** tanpa tool sesi (perilaku default saat ini).
- **Depth 2 (pekerja leaf):** tanpa tool sesi — `sessions_spawn` selalu ditolak pada depth 2. Tidak dapat men-spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada depth apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) anak aktif sekaligus. Ini mencegah fan-out tak terkendali
dari satu orkestrator.

### Cascade stop

Menghentikan orkestrator depth-1 secara otomatis menghentikan semua anak depth-2
miliknya:

- `/stop` di chat utama menghentikan semua agen depth-1 dan melakukan cascade ke anak depth-2 mereka.
- `/subagents kill <id>` menghentikan sub-agent tertentu dan melakukan cascade ke anaknya.
- `/subagents kill all` menghentikan semua sub-agent untuk peminta dan melakukan cascade.

## Autentikasi

Auth sub-agent diselesaikan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi sub-agent adalah `agent:<agentId>:subagent:<uuid>`.
- Store auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen mengoverride profil utama jika ada konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Announce

Sub-agent melapor kembali melalui langkah announce:

- Langkah announce berjalan di dalam sesi sub-agent (bukan sesi peminta).
- Jika sub-agent membalas tepat `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, output announce ditekan meskipun progres terlihat sebelumnya ada.

Pengiriman bergantung pada depth peminta:

- Sesi peminta tingkat atas menggunakan panggilan `agent` tindak lanjut dengan pengiriman eksternal (`deliver=true`).
- Sesi subagent peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) sehingga orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagent peminta bertingkat hilang, OpenClaw melakukan fallback ke peminta sesi tersebut jika tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian terlebih dahulu
menyelesaikan rute percakapan/thread terikat dan override hook, lalu mengisi
field target channel yang hilang dari rute tersimpan sesi peminta.
Ini menjaga penyelesaian tetap berada di chat/topik yang benar bahkan saat origin
penyelesaian hanya mengidentifikasi channel.

Agregasi penyelesaian anak dicakup ke run peminta saat ini ketika
membangun temuan penyelesaian bertingkat, mencegah output anak dari run sebelumnya
bocor ke announce saat ini. Balasan announce mempertahankan
perutean thread/topik saat tersedia pada adapter channel.

### Konteks announce

Konteks announce dinormalisasi menjadi blok event internal yang stabil:

| Field          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` atau `cron`                                                                                        |
| Id sesi        | Kunci/id sesi anak                                                                                            |
| Jenis          | Jenis announce + label tugas                                                                                  |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Konten hasil   | Teks asisten terlihat terbaru, jika tidak ada teks tool/toolResult terbaru yang disanitasi                    |
| Tindak lanjut  | Instruksi yang menjelaskan kapan harus membalas vs tetap senyap                                               |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang
teks balasan yang ditangkap. Saat timeout, jika anak hanya sempat melewati
panggilan tool, announce dapat meringkas riwayat tersebut menjadi ringkasan progres parsial singkat
alih-alih memutar ulang output tool mentah.

### Baris statistik

Payload announce menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (misalnya `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Perkiraan biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan jalur transkrip sehingga agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal dimaksudkan hanya untuk orkestrasi; balasan yang menghadap pengguna
harus ditulis ulang dengan suara asisten normal.

### Mengapa lebih memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Ingatan asisten dinormalisasi terlebih dahulu: tag thinking dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML panggilan tool teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup dengan rapi; scaffolding panggilan/hasil tool yang diturunkan dan penanda konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII `<|...|>` lainnya, full-width `<｜...｜>`) dihapus; XML panggilan tool MiniMax yang malformed dihapus.
- Teks mirip kredensial/token direda k.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat membuang baris lama atau mengganti baris yang terlalu besar dengan `[sessions_history omitted: message too large]`.
- Inspeksi transkrip mentah di disk adalah fallback saat Anda memerlukan transkrip byte-for-byte penuh.

## Kebijakan tool

Sub-agen menggunakan pipeline profil dan kebijakan alat yang sama dengan induk atau
agen target terlebih dahulu. Setelah itu, OpenClaw menerapkan lapisan
pembatasan sub-agen.

Tanpa `tools.profile` yang membatasi, sub-agen mendapatkan **semua alat kecuali
alat sesi** dan alat sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap merupakan tampilan ingatan yang dibatasi dan disanitasi di sini juga — ini
bukan dump transkrip mentah.

Ketika `maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` agar mereka dapat mengelola anak-anaknya.

### Timpa melalui konfigurasi

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` adalah filter final khusus allow-only. Ini dapat mempersempit
kumpulan alat yang sudah diselesaikan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` menyertakan
`web_search`/`web_fetch` tetapi bukan alat `browser`. Agar
sub-agen dengan profil coding dapat menggunakan otomatisasi browser, tambahkan browser pada
tahap profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gunakan `agents.list[].tools.alsoAllow: ["browser"]` per agen ketika hanya satu
agen yang seharusnya mendapatkan otomatisasi browser.

## Konkurensi

Sub-agen menggunakan jalur antrean in-process khusus:

- **Nama jalur:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Liveness dan pemulihan

OpenClaw tidak menganggap ketiadaan `endedAt` sebagai bukti permanen bahwa
sub-agen masih hidup. Run yang belum berakhir dan lebih lama dari jendela stale-run
berhenti dihitung sebagai aktif/tertunda dalam `/subagents list`, ringkasan status,
gating penyelesaian turunan, dan pemeriksaan konkurensi per sesi.

Setelah gateway dimulai ulang, run hasil pemulihan yang stale dan belum berakhir akan dipangkas kecuali
sesi anaknya ditandai `abortedLastRun: true`. Sesi anak yang dibatalkan saat
restart tersebut tetap dapat dipulihkan melalui alur pemulihan orphan sub-agen, yang mengirim
pesan resume sintetis sebelum menghapus penanda aborted.

Pemulihan restart otomatis dibatasi per sesi anak. Jika anak sub-agen yang sama
diterima untuk pemulihan orphan berulang kali di dalam jendela rapid re-wedge,
OpenClaw menyimpan tombstone pemulihan pada sesi tersebut dan berhenti melakukan auto-resume
pada restart berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus flag pemulihan aborted yang stale pada
sesi yang diberi tombstone.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pairing.
Koordinasi internal `sessions_spawn` harus terhubung sebagai
`client.id: "gateway-client"` dengan `client.mode: "backend"` melalui auth direct
loopback shared-token/password; jalur tersebut tidak bergantung pada baseline scope
perangkat yang dipairing milik CLI. Pemanggil jarak jauh,
`deviceIdentity` eksplisit, jalur device-token eksplisit, dan klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan scope.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan semua run sub-agen aktif yang dibuat darinya, berantai ke anak-anak bersarang.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anak-anaknya.

## Batasan

- Pengumuman sub-agen bersifat **best-effort**. Jika gateway dimulai ulang, pekerjaan "announce back" yang tertunda akan hilang.
- Sub-agen tetap berbagi resource proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: ini langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman bersarang maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Depth 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Kirim agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
