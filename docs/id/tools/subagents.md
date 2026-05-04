---
read_when:
    - Anda menginginkan pekerjaan di latar belakang atau paralel melalui agen
    - Anda mengubah sessions_spawn atau kebijakan alat sub-agen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat pada thread
sidebarTitle: Sub-agents
summary: Buat eksekusi agen latar belakang terisolasi yang mengumumkan hasilnya kembali ke chat peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-05-04T07:08:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah proses agen latar belakang yang dibuat dari proses agen yang sudah ada.
Mereka berjalan dalam sesi mereka sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
ketika selesai, **mengumumkan** hasilnya kembali ke saluran chat
peminta. Setiap proses sub-agen dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / alat lambat" tanpa memblokir proses utama.
- Menjaga sub-agen tetap terisolasi secara bawaan (pemisahan sesi + sandboxing opsional).
- Menjaga permukaan alat sulit disalahgunakan: sub-agen **tidak** mendapatkan alat sesi secara bawaan.
- Mendukung kedalaman bersarang yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agen memiliki konteks dan penggunaan token sendiri secara
bawaan. Untuk tugas berat atau berulang, tetapkan model yang lebih murah untuk sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per agen. Ketika anak
    benar-benar memerlukan transkrip peminta saat ini, agen dapat meminta
    `context: "fork"` pada satu pembuatan itu. Sesi subagen yang terikat thread secara bawaan
    menggunakan `context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini ke dalam
    thread tindak lanjut.
</Note>

## Perintah slash

Gunakan `/subagents` untuk memeriksa atau mengontrol proses sub-agen untuk **sesi
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

Gunakan [`/steer <message>`](/id/tools/steer) tingkat atas untuk mengarahkan proses aktif sesi peminta saat ini. Gunakan `/subagents steer <id|#> <message>` ketika targetnya adalah proses anak.

`/subagents info` menampilkan metadata proses (status, stempel waktu, id sesi,
jalur transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan ingatan yang terbatas dan
difilter demi keselamatan; periksa jalur transkrip di disk ketika Anda
memerlukan transkrip lengkap mentah.

### Kontrol pengikatan thread

Perintah-perintah ini berfungsi pada saluran yang mendukung pengikatan thread persisten.
Lihat [Saluran pendukung thread](#thread-supporting-channels) di bawah.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Perilaku pembuatan

`/subagents spawn` memulai sub-agen latar belakang sebagai perintah pengguna (bukan
relay internal) dan mengirim satu pembaruan penyelesaian akhir kembali ke
chat peminta ketika proses selesai.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Perintah spawn tidak memblokir; perintah ini langsung mengembalikan id proses.
    - Saat selesai, sub-agen mengumumkan pesan ringkasan/hasil kembali ke saluran chat peminta.
    - Penyelesaian bersifat push-based. Setelah dibuat, jangan melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
    - Saat selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan kunci idempotensi yang stabil.
    - Jika giliran penyelesaian agen peminta gagal, tidak menghasilkan output yang terlihat, atau mengembalikan prefiks yang jelas tidak lengkap dari hasil anak yang ditangkap, OpenClaw kembali ke pengiriman penyelesaian langsung dari hasil anak yang ditangkap.
    - Jika pengiriman langsung tidak dapat digunakan, OpenClaw kembali ke perutean antrean.
    - Jika perutean antrean masih tidak tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang telah di-resolve: rute penyelesaian terikat thread atau terikat percakapan menang ketika tersedia; jika asal penyelesaian hanya menyediakan saluran, OpenClaw mengisi target/akun yang hilang dari rute hasil resolve sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Serah terima penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat, jika tidak ada maka teks alat/toolResult terbaru yang telah disanitasi. Proses gagal terminal tidak menggunakan ulang teks balasan yang ditangkap.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token yang ringkas.
    - Instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dengan suara asisten normal (bukan meneruskan metadata internal mentah).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` dan `--thinking` mengganti default untuk proses spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah penyelesaian.
    - `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengiklankan runtime tersebut. Lihat [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agen-ke-agen. Ketika plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya lebih memilih `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak berada dalam sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native mulai terisolasi kecuali pemanggil secara eksplisit meminta untuk melakukan fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat lambat, atau apa pun yang dapat dijelaskan singkat dalam teks tugas                           | Membuat transkrip anak yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke dalam sesi anak sebelum anak dimulai. |

Gunakan `fork` dengan hemat. Ini ditujukan untuk delegasi yang sensitif konteks, bukan
pengganti penulisan prompt tugas yang jelas.

## Alat: `sessions_spawn`

Memulai proses sub-agen dengan `deliver: false` pada lane `subagent` global,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke saluran
chat peminta.

Ketersediaan bergantung pada kebijakan alat efektif pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara bawaan. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agen yang harus mendelegasikan
pekerjaan. Kebijakan allow/deny saluran/grup, penyedia, sandbox, dan per agen masih dapat
menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen); `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen); `sessions_spawn.thinking` eksplisit tetap menang.
- **Timeout proses:** jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` ketika ditetapkan; jika tidak, fallback ke `0` (tanpa timeout).

### Parameter alat

<ParamField path="task" type="string" required>
  Deskripsi tugas untuk sub-agen.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang dapat dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Buat di bawah id agen lain ketika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang ada ketika `runtime: "acp"`; diabaikan untuk pembuatan sub-agen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Mengalirkan output proses ACP ke sesi induk ketika `runtime: "acp"`; hilangkan untuk pembuatan sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Ganti model sub-agen. Nilai tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Ganti tingkat thinking untuk proses sub-agen.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default ke `agents.defaults.subagents.runTimeoutSeconds` ketika ditetapkan, jika tidak `0`. Ketika ditetapkan, proses sub-agen dibatalkan setelah N detik.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Ketika `true`, meminta pengikatan thread saluran untuk sesi sub-agen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` mengarsipkan segera setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak pembuatan kecuali runtime anak target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip saat ini milik peminta ke dalam sesi anak. Hanya sub-agen native. Pembuatan terikat thread secara bawaan menggunakan `fork`; pembuatan non-thread secara bawaan menggunakan `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman saluran (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan
`message`/`sessions_send` dari proses yang dibuat.
</Warning>

## Sesi terikat thread

Ketika pengikatan thread diaktifkan untuk suatu saluran, sub-agen dapat tetap terikat
ke sebuah thread sehingga pesan pengguna tindak lanjut dalam thread tersebut tetap dirutekan ke
sesi sub-agen yang sama.

### Saluran pendukung thread

**Discord** saat ini adalah satu-satunya saluran yang didukung. Discord mendukung
sesi subagen terikat thread persisten (`sessions_spawn` dengan
`thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), dan kunci adaptor
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
    Balasan dan pesan tindak lanjut dalam thread tersebut dirutekan ke sesi yang terikat.
  </Step>
  <Step title="Inspect timeouts">
    Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus saat tidak aktif dan
    `/session max-age` untuk mengontrol batas kerasnya.
  </Step>
  <Step title="Detach">
    Gunakan `/unfocus` untuk melepas secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah           | Efek                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ikat thread saat ini (atau buat satu) ke target sub-agen/sesi         |
| `/unfocus`         | Hapus pengikatan untuk thread terikat saat ini                        |
| `/agents`          | Cantumkan run aktif dan status pengikatan (`thread:<id>` atau `unbound`) |
| `/session idle`    | Periksa/perbarui auto-unfocus saat idle (hanya thread terikat yang difokuskan) |
| `/session max-age` | Periksa/perbarui batas keras (hanya thread terikat yang difokuskan)   |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override channel dan kunci auto-bind spawn** bersifat khusus adapter. Lihat [Channel yang mendukung thread](#thread-supporting-channels) di atas.

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

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif setiap agen yang tercantum
dan metadata runtime tersemat agar pemanggil dapat membedakan PI, server aplikasi
Codex, dan runtime native terkonfigurasi lainnya.

### Arsip otomatis

- Sesi sub-agen diarsipkan otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` mengarsipkan segera setelah announce (tetap mempertahankan transkrip melalui penggantian nama).
- Arsip otomatis bersifat best-effort; timer tertunda hilang jika gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** mengarsipkan otomatis; itu hanya menghentikan run. Sesi tetap ada sampai arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi depth-1 dan depth-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup secara best-effort saat run selesai, meskipun catatan transkrip/sesi dipertahankan.

## Sub-agen bersarang

Secara default, sub-agen tidak dapat men-spawn sub-agennya sendiri
(`maxSpawnDepth: 1`). Tetapkan `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
nesting — **pola orkestrator**: utama → sub-agen orkestrator →
sub-sub-agen pekerja.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Tingkat depth

| Depth | Bentuk kunci sesi                            | Peran                                         | Dapat spawn?                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agen (orkestrator saat depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agen (pekerja leaf)                   | Tidak pernah                 |

### Rantai announce

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → mengumumkan ke induknya (orkestrator depth-1).
2. Orkestrator depth-1 menerima announce, menyintesis hasil, selesai → mengumumkan ke utama.
3. Agen utama menerima announce dan menyampaikan ke pengguna.

Setiap tingkat hanya melihat announce dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak sekali dan tunggu event penyelesaian
alih-alih membangun loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah tidur `exec`.
`sessions_list` dan `/subagents list` menjaga relasi sesi anak tetap
berfokus pada pekerjaan live — anak live tetap terpasang, anak yang berakhir tetap
terlihat untuk jendela terbaru yang singkat, dan tautan anak store-only yang usang
diabaikan setelah jendela kesegarannya. Ini mencegah metadata `spawnedBy` /
`parentSessionKey` lama menghidupkan kembali anak ghost setelah
restart. Jika event penyelesaian anak tiba setelah Anda sudah mengirim
jawaban akhir, tindak lanjut yang benar adalah token senyap yang persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan depth

- Peran dan cakupan kontrol ditulis ke metadata sesi pada waktu spawn. Itu menjaga kunci sesi datar atau yang dipulihkan agar tidak secara tidak sengaja memperoleh kembali hak istimewa orkestrator.
- **Depth 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapat `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat mengelola anaknya. Alat sesi/sistem lain tetap ditolak.
- **Depth 1 (leaf, saat `maxSpawnDepth == 1`):** tidak ada alat sesi (perilaku default saat ini).
- **Depth 2 (pekerja leaf):** tidak ada alat sesi — `sessions_spawn` selalu ditolak pada depth 2. Tidak dapat men-spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada depth apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) anak aktif pada satu waktu. Ini mencegah fan-out tak terkendali
dari satu orkestrator.

### Stop berantai

Menghentikan orkestrator depth-1 secara otomatis menghentikan semua anak depth-2
miliknya:

- `/stop` di chat utama menghentikan semua agen depth-1 dan berantai ke anak depth-2 mereka.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anaknya.
- `/subagents kill all` menghentikan semua sub-agen untuk peminta dan berantai.

## Autentikasi

Auth sub-agen diselesaikan berdasarkan **id agen**, bukan berdasarkan tipe sesi:

- Kunci sesi sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Store auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen meng-override profil utama saat ada konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Announce

Sub-agen melaporkan kembali melalui langkah announce:

- Langkah announce berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, output announce ditekan meskipun progres terlihat sebelumnya ada.

Pengiriman bergantung pada depth peminta:

- Sesi peminta tingkat atas menggunakan panggilan tindak lanjut `agent` dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bersarang menerima injeksi tindak lanjut internal (`deliver=false`) agar orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagen peminta bersarang hilang, OpenClaw fallback ke peminta sesi tersebut saat tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian terlebih dahulu
menyelesaikan rute percakapan/thread terikat dan override hook, lalu mengisi
field target channel yang hilang dari rute tersimpan sesi peminta.
Ini menjaga completion tetap di chat/topik yang tepat meskipun asal completion
hanya mengidentifikasi channel.

Agregasi penyelesaian anak dicakupkan ke run peminta saat ini ketika
membangun temuan penyelesaian bersarang, mencegah output anak run sebelumnya yang usang
bocor ke announce saat ini. Balasan announce mempertahankan
routing thread/topik saat tersedia pada adapter channel.

### Konteks announce

Konteks announce dinormalisasi menjadi blok event internal yang stabil:

| Field          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                        |
| Id sesi        | Kunci/id sesi anak                                                                                            |
| Tipe           | Tipe announce + label tugas                                                                                   |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Konten hasil   | Teks asisten terlihat terbaru, jika tidak ada teks alat/toolResult terbaru yang telah disanitasi              |
| Tindak lanjut  | Instruksi yang menjelaskan kapan membalas vs tetap diam                                                       |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang
teks balasan yang ditangkap. Pada timeout, jika anak hanya sempat melalui
panggilan alat, announce dapat menciutkan riwayat itu menjadi ringkasan progres parsial singkat
alih-alih memutar ulang output alat mentah.

### Baris statistik

Payload announce menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (mis. `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Estimasi biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan path transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal dimaksudkan hanya untuk orkestrasi; balasan yang menghadap pengguna
sebaiknya ditulis ulang dengan suara asisten normal.

### Mengapa memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Recall asisten dinormalisasi terlebih dahulu: tag berpikir dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML panggilan alat teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup bersih; scaffolding panggilan/hasil alat yang diturunkan dan marker konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII `<|...|>` lainnya, full-width `<｜...｜>`) dihapus; XML panggilan alat MiniMax yang cacat dihapus.
- Teks yang menyerupai kredensial/token disensor.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat membuang baris lama atau mengganti baris terlalu besar dengan `[sessions_history omitted: message too large]`.
- Inspeksi transkrip mentah di disk adalah fallback saat Anda membutuhkan transkrip lengkap byte-demi-byte.

## Kebijakan alat

Sub-agen menggunakan profil dan alur kebijakan alat yang sama seperti agen induk atau
agen target terlebih dahulu. Setelah itu, OpenClaw menerapkan lapisan pembatasan
sub-agen.

Tanpa `tools.profile` yang membatasi, sub-agen mendapatkan **semua alat kecuali
alat sesi** dan alat sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap menjadi tampilan ingatan yang dibatasi dan disanitasi di sini juga — ini
bukan dump transkrip mentah.

Ketika `maxSpawnDepth >= 2`, sub-agen orkestrator kedalaman-1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` sehingga mereka dapat mengelola anak-anaknya.

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

`tools.subagents.tools.allow` adalah filter khusus-izinkan akhir. Ini dapat mempersempit
kumpulan alat yang sudah diselesaikan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` mencakup
`web_search`/`web_fetch` tetapi bukan alat `browser`. Untuk mengizinkan
sub-agen profil-coding menggunakan otomasi peramban, tambahkan browser pada
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
agen yang perlu mendapatkan otomasi peramban.

## Konkurensi

Sub-agen menggunakan jalur antrean khusus dalam proses:

- **Nama jalur:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Liveness dan pemulihan

OpenClaw tidak menganggap ketiadaan `endedAt` sebagai bukti permanen bahwa
sub-agen masih hidup. Run yang belum berakhir dan lebih lama daripada jendela run usang
berhenti dihitung sebagai aktif/tertunda dalam `/subagents list`, ringkasan status,
gating penyelesaian turunan, dan pemeriksaan konkurensi per sesi.

Setelah Gateway dimulai ulang, run yang dipulihkan dan belum berakhir yang sudah usang akan dipangkas kecuali
sesi anaknya ditandai `abortedLastRun: true`. Sesi anak yang dibatalkan karena
restart tersebut tetap dapat dipulihkan melalui alur pemulihan yatim sub-agen,
yang mengirim pesan resume sintetis sebelum menghapus penanda dibatalkan.

Pemulihan restart otomatis dibatasi per sesi anak. Jika anak sub-agen yang sama
diterima untuk pemulihan yatim berulang kali di dalam jendela rapid re-wedge,
OpenClaw mempertahankan tombstone pemulihan pada sesi tersebut dan berhenti melakukan auto-resume
padanya pada restart berikutnya. Jalankan `openclaw tasks maintenance --apply` untuk
mereonsiliasi catatan tugas, atau `openclaw doctor --fix` untuk menghapus flag
pemulihan dibatalkan yang usang pada sesi yang diberi tombstone.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pairing.
Koordinasi internal `sessions_spawn` harus terhubung sebagai
`client.id: "gateway-client"` dengan `client.mode: "backend"` melalui auth
shared-token/password local loopback langsung; jalur tersebut tidak bergantung pada
baseline cakupan perangkat yang dipasangkan milik CLI. Pemanggil jarak jauh,
`deviceIdentity` eksplisit, jalur device-token eksplisit, dan klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta akan membatalkan sesi peminta dan menghentikan setiap run sub-agen aktif yang di-spawn darinya, bertingkat ke anak bersarang.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan bertingkat ke anak-anaknya.

## Batasan

- Pengumuman sub-agen bersifat **best-effort**. Jika gateway dimulai ulang, pekerjaan "announce back" yang tertunda hilang.
- Sub-agen masih berbagi sumber daya proses gateway yang sama; anggap `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: ini langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman bersarang maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Kirim agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
