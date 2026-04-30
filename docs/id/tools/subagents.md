---
read_when:
    - Anda ingin menjalankan pekerjaan latar belakang atau paralel melalui agen
    - Anda mengubah kebijakan alat sessions_spawn atau sub-agen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat utas
sidebarTitle: Sub-agents
summary: Mulai eksekusi agen latar belakang terisolasi yang mengumumkan hasilnya kembali ke chat peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-04-30T16:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah eksekusi agen latar belakang yang dimunculkan dari eksekusi agen yang sudah ada.
Sub-agen berjalan dalam sesi sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke kanal chat
peminta. Setiap eksekusi sub-agen dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / alat lambat" tanpa memblokir eksekusi utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi + sandboxing opsional).
- Menjaga permukaan alat sulit disalahgunakan: sub-agen secara default **tidak** mendapatkan alat sesi.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orchestrator.

<Note>
**Catatan biaya:** setiap sub-agen memiliki konteks dan penggunaan token sendiri secara
default. Untuk tugas berat atau berulang, tetapkan model yang lebih murah untuk sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per agen. Ketika child
benar-benar membutuhkan transkrip peminta saat ini, agen dapat meminta
`context: "fork"` pada satu spawn tersebut.
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

`/subagents info` menampilkan metadata eksekusi (status, timestamp, id sesi,
jalur transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan ingatan
terbatas dan terfilter demi keamanan; periksa jalur transkrip di disk ketika Anda
membutuhkan transkrip lengkap mentah.

### Kontrol pengikatan thread

Perintah ini berfungsi pada kanal yang mendukung pengikatan thread persisten.
Lihat [Kanal pendukung thread](#thread-supporting-channels) di bawah.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Perilaku spawn

`/subagents spawn` memulai sub-agen latar belakang sebagai perintah pengguna (bukan
relay internal) dan mengirim satu pembaruan penyelesaian akhir kembali ke
chat peminta saat eksekusi selesai.

<AccordionGroup>
  <Accordion title="Penyelesaian berbasis push dan nonblokir">
    - Perintah spawn bersifat nonblokir; perintah ini langsung mengembalikan id eksekusi.
    - Saat selesai, sub-agen mengumumkan pesan ringkasan/hasil kembali ke kanal chat peminta.
    - Penyelesaian berbasis push. Setelah dimunculkan, jangan melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
    - Saat selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Ketahanan pengiriman spawn manual">
    - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan kunci idempotensi yang stabil.
    - Jika pengiriman langsung gagal, OpenClaw fallback ke perutean antrean.
    - Jika perutean antrean masih tidak tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang terselesaikan: rute penyelesaian yang terikat thread atau terikat percakapan menang saat tersedia; jika asal penyelesaian hanya menyediakan kanal, OpenClaw mengisi target/akun yang hilang dari rute terselesaikan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata handoff penyelesaian">
    Handoff penyelesaian ke sesi peminta adalah konteks internal yang dibuat runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terlihat terbaru, atau teks tool/toolResult terbaru yang disanitasi. Eksekusi gagal terminal tidak menggunakan ulang teks balasan yang tertangkap.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token ringkas.
    - Instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dengan suara asisten normal (bukan meneruskan metadata internal mentah).

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` mengesampingkan default untuk eksekusi spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah penyelesaian.
    - `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengiklankan runtime tersebut. Lihat [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agen-ke-agen. Ketika plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya mengutamakan `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` sampai ACP diaktifkan, peminta tidak berada dalam sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native mulai terisolasi kecuali pemanggil secara eksplisit meminta untuk melakukan fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat lambat, atau apa pun yang dapat dijelaskan dalam teks tugas                           | Membuat transkrip child yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi child sebelum child dimulai. |

Gunakan `fork` secara hemat. Ini untuk delegasi yang peka konteks, bukan
pengganti penulisan prompt tugas yang jelas.

## Alat: `sessions_spawn`

Memulai eksekusi sub-agen dengan `deliver: false` pada lane `subagent` global,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke kanal
chat peminta.

Ketersediaan bergantung pada kebijakan alat efektif milik pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara default. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agen yang harus mendelegasikan
pekerjaan. Kebijakan allow/deny kanal/grup, penyedia, sandbox, dan per agen masih dapat
menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen); `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen); `sessions_spawn.thinking` eksplisit tetap menang.
- **Timeout eksekusi:** jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` saat ditetapkan; jika tidak, fallback ke `0` (tanpa timeout).

### Parameter alat

<ParamField path="task" type="string" required>
  Deskripsi tugas untuk sub-agen.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang dapat dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn di bawah id agen lain saat diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang sudah ada ketika `runtime: "acp"`; diabaikan untuk spawn sub-agen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Melakukan stream output eksekusi ACP ke sesi parent ketika `runtime: "acp"`; hilangkan untuk spawn sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Override model sub-agen. Nilai yang tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Override tingkat thinking untuk eksekusi sub-agen.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default ke `agents.defaults.subagents.runTimeoutSeconds` saat ditetapkan, jika tidak `0`. Saat ditetapkan, eksekusi sub-agen dibatalkan setelah N detik.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Ketika `true`, meminta pengikatan thread kanal untuk sesi sub-agen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` langsung mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui rename).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak spawn kecuali runtime child target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip saat ini milik peminta ke sesi child. Hanya sub-agen native. Gunakan `fork` hanya ketika child membutuhkan transkrip saat ini.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman kanal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan
`message`/`sessions_send` dari eksekusi yang dimunculkan.
</Warning>

## Sesi terikat thread

Ketika pengikatan thread diaktifkan untuk sebuah kanal, sub-agen dapat tetap terikat
ke thread sehingga pesan pengguna lanjutan di thread tersebut tetap dirutekan ke
sesi sub-agen yang sama.

### Kanal pendukung thread

**Discord** saat ini adalah satu-satunya kanal yang didukung. Kanal ini mendukung
sesi sub-agen persisten yang terikat thread (`sessions_spawn` dengan
`thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), dan kunci adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, dan
`channels.discord.threadBindings.spawnSubagentSessions`.

### Alur cepat

<Steps>
  <Step title="Spawn">
    `sessions_spawn` dengan `thread: true` (dan secara opsional `mode: "session"`).
  </Step>
  <Step title="Ikat">
    OpenClaw membuat atau mengikat thread ke target sesi tersebut di kanal aktif.
  </Step>
  <Step title="Rutekan tindak lanjut">
    Balasan dan pesan lanjutan di thread tersebut dirutekan ke sesi terikat.
  </Step>
  <Step title="Periksa timeout">
    Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus ketidakaktifan dan
    `/session max-age` untuk mengontrol batas keras.
  </Step>
  <Step title="Lepas">
    Gunakan `/unfocus` untuk melepas secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah          | Efek                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ikat utas saat ini (atau buat satu) ke target sub-agen/sesi |
| `/unfocus`         | Hapus pengikatan untuk utas terikat saat ini                       |
| `/agents`          | Cantumkan run aktif dan status pengikatan (`thread:<id>` atau `unbound`)       |
| `/session idle`    | Periksa/perbarui auto-unfocus saat idle (hanya utas terikat yang difokuskan)         |
| `/session max-age` | Periksa/perbarui batas keras (hanya utas terikat yang difokuskan)                  |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override channel dan kunci spawn auto-bind** bersifat spesifik adapter. Lihat [Channel pendukung utas](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Daftar izin

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan apa pun). Default: hanya agen peminta. Jika Anda menetapkan daftar dan masih ingin peminta melakukan spawn terhadap dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Daftar izin agen target default yang digunakan ketika agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Override per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif setiap agen yang tercantum
dan metadata runtime tertanam sehingga pemanggil dapat membedakan PI, Codex
app-server, dan runtime native lain yang dikonfigurasi.

### Arsip otomatis

- Sesi sub-agen diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` mengarsipkan segera setelah announce (transkrip tetap disimpan melalui penggantian nama).
- Arsip otomatis bersifat upaya terbaik; timer tertunda hilang jika Gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** mengarsipkan otomatis; itu hanya menghentikan run. Sesi tetap ada sampai arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi depth-1 dan depth-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup dengan upaya terbaik ketika run selesai, meskipun catatan transkrip/sesi disimpan.

## Sub-agen bertingkat

Secara default, sub-agen tidak dapat melakukan spawn terhadap sub-agennya sendiri
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

| Depth | Bentuk kunci sesi                            | Peran                                          | Dapat spawn?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agen (orkestrator ketika depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agen (pekerja daun)                   | Tidak pernah                        |

### Rantai announce

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → mengirim announce ke induknya (orkestrator depth-1).
2. Orkestrator depth-1 menerima announce, menyintesis hasil, selesai → mengirim announce ke utama.
3. Agen utama menerima announce dan mengirimkannya kepada pengguna.

Setiap tingkat hanya melihat announce dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak satu kali dan tunggu event penyelesaian
alih-alih membangun loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah sleep `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi-anak
tetap berfokus pada pekerjaan live — anak live tetap terlampir, anak yang berakhir tetap
terlihat untuk jendela terbaru yang singkat, dan tautan anak hanya-store yang basi
diabaikan setelah jendela kesegarannya. Ini mencegah metadata `spawnedBy` /
`parentSessionKey` lama menghidupkan kembali anak bayangan setelah
restart. Jika event penyelesaian anak tiba setelah Anda sudah mengirim
jawaban akhir, tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat menurut depth

- Peran dan cakupan kontrol ditulis ke metadata sesi pada waktu spawn. Itu mencegah kunci sesi datar atau dipulihkan mendapatkan kembali hak istimewa orkestrator secara tidak sengaja.
- **Depth 1 (orkestrator, ketika `maxSpawnDepth >= 2`):** mendapat `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat mengelola anaknya. Alat sesi/sistem lain tetap ditolak.
- **Depth 1 (daun, ketika `maxSpawnDepth == 1`):** tidak ada alat sesi (perilaku default saat ini).
- **Depth 2 (pekerja daun):** tidak ada alat sesi — `sessions_spawn` selalu ditolak pada depth 2. Tidak dapat melakukan spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada depth apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) anak aktif pada satu waktu. Ini mencegah fan-out tak terkendali
dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator depth-1 secara otomatis menghentikan semua anak depth-2-nya:

- `/stop` di chat utama menghentikan semua agen depth-1 dan berantai ke anak depth-2 mereka.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anaknya.
- `/subagents kill all` menghentikan semua sub-agen untuk peminta dan berantai.

## Autentikasi

Auth sub-agen diselesaikan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Store auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen menimpa profil utama saat terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Announce

Sub-agen melapor kembali melalui langkah announce:

- Langkah announce berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, output announce ditekan meskipun progres terlihat sebelumnya ada.

Pengiriman bergantung pada depth peminta:

- Sesi peminta tingkat atas menggunakan panggilan `agent` tindak lanjut dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) sehingga orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagen peminta bertingkat hilang, OpenClaw fallback ke peminta sesi tersebut bila tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian pertama-tama
menyelesaikan rute percakapan/utas terikat apa pun dan override hook, lalu mengisi
field target-channel yang hilang dari rute tersimpan sesi peminta.
Itu menjaga penyelesaian tetap di chat/topik yang tepat meskipun asal penyelesaian
hanya mengidentifikasi channel.

Agregasi penyelesaian anak dicakup ke run peminta saat ini ketika
membangun temuan penyelesaian bertingkat, mencegah output anak dari prior-run basi
bocor ke announce saat ini. Balasan announce mempertahankan
routing utas/topik bila tersedia pada adapter channel.

### Konteks announce

Konteks announce dinormalisasi menjadi blok event internal yang stabil:

| Field          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                          |
| Id sesi        | Kunci/id sesi anak                                                                                          |
| Jenis          | Jenis announce + label tugas                                                                                    |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Konten hasil | Teks asisten terlihat terbaru, jika tidak ada teks alat/toolResult terbaru yang disanitasi                                |
| Tindak lanjut      | Instruksi yang menjelaskan kapan membalas vs tetap senyap                                                           |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang
teks balasan yang ditangkap. Saat timeout, jika anak hanya sempat melalui panggilan alat,
announce dapat meruntuhkan riwayat tersebut menjadi ringkasan progres parsial singkat
alih-alih memutar ulang output alat mentah.

### Baris stats

Payload announce menyertakan baris stats di akhir (bahkan saat dibungkus):

- Runtime (mis. `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Perkiraan biaya ketika harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan jalur transkrip sehingga agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal ditujukan hanya untuk orkestrasi; balasan yang menghadap pengguna
harus ditulis ulang dengan suara asisten normal.

### Mengapa lebih memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Ingatan asisten dinormalisasi terlebih dahulu: tag thinking dihapus; kerangka `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML panggilan alat teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup bersih; kerangka panggilan/hasil alat yang diturunkan dan marker konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII `<|...|>` lain, full-width `<｜...｜>`) dihapus; XML panggilan alat MiniMax yang malformed dihapus.
- Teks yang menyerupai kredensial/token direduksi.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat membuang baris lama atau mengganti baris berukuran terlalu besar dengan `[sessions_history omitted: message too large]`.
- Pemeriksaan transkrip mentah di disk adalah fallback ketika Anda membutuhkan transkrip penuh byte-for-byte.

## Kebijakan alat

Sub-agen menggunakan pipeline profil dan kebijakan alat yang sama seperti induk atau
agen target terlebih dahulu. Setelah itu, OpenClaw menerapkan lapisan pembatasan
sub-agen.

Tanpa `tools.profile` yang restriktif, sub-agen mendapat **semua alat kecuali
alat sesi** dan alat sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap menjadi tampilan recall yang terbatas dan disanitasi di sini juga — itu
bukan dump transkrip mentah.

Ketika `maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` sehingga mereka dapat mengelola anaknya.

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` adalah filter akhir hanya-izinkan. Filter ini dapat mempersempit
kumpulan alat yang sudah diresolusikan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` menyertakan
`web_search`/`web_fetch` tetapi bukan alat `browser`. Untuk mengizinkan
sub-agen profil coding menggunakan otomasi browser, tambahkan browser pada tahap
profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gunakan `agents.list[].tools.alsoAllow: ["browser"]` per agen ketika hanya satu
agen yang harus mendapatkan otomasi browser.

## Konkurensi

Sub-agen menggunakan jalur antrean dalam proses khusus:

- **Nama jalur:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Keaktifan dan pemulihan

OpenClaw tidak memperlakukan ketiadaan `endedAt` sebagai bukti permanen bahwa
sub-agen masih hidup. Proses yang belum berakhir dan lebih lama dari jendela proses usang
berhenti dihitung sebagai aktif/tertunda di `/subagents list`, ringkasan status,
gating penyelesaian turunan, dan pemeriksaan konkurensi per sesi.

Setelah Gateway dimulai ulang, proses pulihan usang yang belum berakhir akan dipangkas kecuali
sesi anaknya ditandai `abortedLastRun: true`. Sesi anak yang dibatalkan karena
restart tersebut tetap dapat dipulihkan melalui alur pemulihan orphan sub-agen,
yang mengirim pesan resume sintetis sebelum menghapus penanda dibatalkan.

Pemulihan restart otomatis dibatasi per sesi anak. Jika anak sub-agen yang sama
diterima untuk pemulihan orphan berulang kali di dalam jendela re-wedge cepat,
OpenClaw menyimpan tombstone pemulihan pada sesi tersebut dan berhenti melanjutkannya
secara otomatis pada restart berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus flag pemulihan dibatalkan yang usang pada
sesi yang ditombstone.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pairing.
Koordinasi internal `sessions_spawn` harus terhubung sebagai
`client.id: "gateway-client"` dengan `client.mode: "backend"` melalui auth
local loopback token bersama/kata sandi langsung; jalur tersebut tidak bergantung pada
baseline cakupan perangkat terpasangkan CLI. Pemanggil jarak jauh, `deviceIdentity`
eksplisit, jalur token perangkat eksplisit, serta klien browser/node tetap
memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan semua proses sub-agen aktif yang dibuat darinya, berantai ke anak bertingkat.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anak-anaknya.

## Batasan

- Pengumuman sub-agen bersifat **upaya terbaik**. Jika Gateway dimulai ulang, pekerjaan "announce back" yang tertunda akan hilang.
- Sub-agen masih berbagi sumber daya proses Gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: perintah ini langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman nesting maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Kirim agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
