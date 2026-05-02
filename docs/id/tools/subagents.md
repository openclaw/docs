---
read_when:
    - Anda ingin pekerjaan latar belakang atau paralel melalui agen
    - Anda sedang mengubah kebijakan alat sessions_spawn atau sub-agen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat utas
sidebarTitle: Sub-agents
summary: Buat eksekusi agen latar belakang terisolasi yang mengumumkan hasilnya kembali ke obrolan pihak yang meminta
title: Sub-agen
x-i18n:
    generated_at: "2026-05-02T09:35:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah eksekusi agen latar belakang yang dibuat dari eksekusi agen yang sudah ada.
Mereka berjalan dalam sesi mereka sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke saluran obrolan
peminta. Setiap eksekusi sub-agen dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / alat lambat" tanpa memblokir eksekusi utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi + sandbox opsional).
- Menjaga permukaan alat sulit disalahgunakan: sub-agen **tidak** mendapatkan alat sesi secara default.
- Mendukung kedalaman bersarang yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agen memiliki konteks dan penggunaan tokennya sendiri secara
default. Untuk tugas berat atau berulang, tetapkan model yang lebih murah untuk sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per-agen. Ketika anak
    benar-benar membutuhkan transkrip peminta saat ini, agen dapat meminta
    `context: "fork"` pada satu spawn tersebut. Sesi subagen yang terikat thread secara default
    menggunakan `context: "fork"` karena mereka mencabangkan percakapan saat ini ke
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

`/subagents info` menampilkan metadata eksekusi (status, timestamp, id sesi,
path transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan ingatan
terbatas yang difilter demi keamanan; periksa path transkrip di disk saat Anda
memerlukan transkrip lengkap mentah.

### Kontrol pengikatan thread

Perintah ini bekerja pada saluran yang mendukung pengikatan thread persisten.
Lihat [Saluran yang mendukung thread](#thread-supporting-channels) di bawah.

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
obrolan peminta saat eksekusi selesai.

<AccordionGroup>
  <Accordion title="Penyelesaian berbasis push dan tidak memblokir">
    - Perintah spawn tidak memblokir; ia langsung mengembalikan id eksekusi.
    - Saat selesai, sub-agen mengumumkan pesan ringkasan/hasil kembali ke saluran obrolan peminta.
    - Penyelesaian berbasis push. Setelah dibuat, jangan melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
    - Saat selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Ketahanan pengiriman spawn manual">
    - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan kunci idempotensi stabil.
    - Jika pengiriman langsung gagal, ia fallback ke perutean antrean.
    - Jika perutean antrean masih belum tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang telah diselesaikan: rute penyelesaian yang terikat thread atau terikat percakapan menang ketika tersedia; jika asal penyelesaian hanya menyediakan saluran, OpenClaw mengisi target/akun yang hilang dari rute sesi peminta yang telah diselesaikan (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata handoff penyelesaian">
    Handoff penyelesaian ke sesi peminta adalah konteks internal yang dibuat runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat, atau teks tool/toolResult terbaru yang telah disanitasi. Eksekusi terminal yang gagal tidak menggunakan kembali teks balasan yang ditangkap.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token ringkas.
    - Instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dengan suara asisten normal (bukan meneruskan metadata internal mentah).

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` meng-override default untuk eksekusi spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah penyelesaian.
    - `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengiklankan runtime tersebut. Lihat [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agen-ke-agen. Ketika Plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya memilih `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` sampai ACP diaktifkan, peminta tidak disandbox, dan Plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native dimulai terisolasi kecuali pemanggil secara eksplisit meminta fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                    | Perilaku                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat lambat, atau apa pun yang dapat dijelaskan singkat dalam teks tugas                  | Membuat transkrip anak yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah. |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada di transkrip peminta | Mencabangkan transkrip peminta ke sesi anak sebelum anak dimulai.                  |

Gunakan `fork` dengan hemat. Ini untuk delegasi yang sensitif konteks, bukan
pengganti penulisan prompt tugas yang jelas.

## Alat: `sessions_spawn`

Memulai eksekusi sub-agen dengan `deliver: false` pada lane `subagent` global,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke saluran
obrolan peminta.

Ketersediaan bergantung pada kebijakan alat efektif pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara default. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agen yang harus mendelegasikan
pekerjaan. Kebijakan allow/deny saluran/grup, penyedia, sandbox, dan per-agen masih dapat
menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per-agen); `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per-agen); `sessions_spawn.thinking` eksplisit tetap menang.
- **Timeout eksekusi:** jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` saat ditetapkan; jika tidak, fallback ke `0` (tanpa timeout).

### Parameter alat

<ParamField path="task" type="string" required>
  Deskripsi tugas untuk sub-agen.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang mudah dibaca manusia.
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
  Khusus ACP. Melakukan streaming output eksekusi ACP ke sesi induk ketika `runtime: "acp"`; hilangkan untuk spawn sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Override model sub-agen. Nilai tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Override tingkat thinking untuk eksekusi sub-agen.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default ke `agents.defaults.subagents.runTimeoutSeconds` saat ditetapkan, jika tidak `0`. Saat ditetapkan, eksekusi sub-agen dibatalkan setelah N detik.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Saat `true`, meminta pengikatan thread saluran untuk sesi sub-agen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` langsung mengarsipkan setelah pengumuman (tetap mempertahankan transkrip melalui rename).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak spawn kecuali runtime anak target disandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke sesi anak. Hanya sub-agen native. Spawn yang terikat thread default ke `fork`; spawn non-thread default ke `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman saluran (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan
`message`/`sessions_send` dari eksekusi yang dibuat.
</Warning>

## Sesi terikat thread

Ketika pengikatan thread diaktifkan untuk sebuah saluran, sub-agen dapat tetap terikat
ke thread sehingga pesan pengguna tindak lanjut di thread tersebut terus dirutekan ke
sesi sub-agen yang sama.

### Saluran yang mendukung thread

**Discord** saat ini adalah satu-satunya saluran yang didukung. Ia mendukung
sesi subagen terikat thread yang persisten (`sessions_spawn` dengan
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
  <Step title="Ikat">
    OpenClaw membuat atau mengikat thread ke target sesi tersebut di saluran aktif.
  </Step>
  <Step title="Rutekan tindak lanjut">
    Balasan dan pesan tindak lanjut di thread tersebut dirutekan ke sesi yang terikat.
  </Step>
  <Step title="Periksa timeout">
    Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus ketidakaktifan dan
    `/session max-age` untuk mengontrol batas keras.
  </Step>
  <Step title="Lepaskan">
    Gunakan `/unfocus` untuk melepas secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah          | Efek                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `/focus <target>` | Ikat utas saat ini (atau buat satu) ke target sub-agen/sesi           |
| `/unfocus`        | Hapus ikatan untuk utas terikat saat ini                              |
| `/agents`         | Cantumkan run aktif dan status ikatan (`thread:<id>` atau `unbound`)  |
| `/session idle`   | Periksa/perbarui auto-unfocus idle (hanya utas terikat yang terfokus) |
| `/session max-age` | Periksa/perbarui batas keras (hanya utas terikat yang terfokus)      |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override channel dan kunci spawn auto-bind** bersifat spesifik adapter. Lihat [Channel yang mendukung utas](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Daftar izinkan

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan apa pun). Default: hanya agen peminta. Jika Anda menetapkan daftar dan masih ingin peminta men-spawn dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Daftar izinkan agen target default yang digunakan saat agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Override per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif setiap agen yang tercantum
dan metadata runtime tertanam sehingga pemanggil dapat membedakan runtime native
Pi, server aplikasi Codex, dan runtime native terkonfigurasi lainnya.

### Arsip otomatis

- Sesi sub-agen otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
- Arsip otomatis bersifat upaya terbaik; timer tertunda hilang jika gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** mengarsipkan otomatis; itu hanya menghentikan run. Sesi tetap ada hingga arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi kedalaman 1 dan kedalaman 2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup dengan upaya terbaik saat run selesai, meskipun catatan transkrip/sesi tetap disimpan.

## Sub-agen bertingkat

Secara default, sub-agen tidak dapat men-spawn sub-agennya sendiri
(`maxSpawnDepth: 1`). Tetapkan `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
penyarangan — **pola orkestrator**: utama → sub-agen orkestrator →
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

### Tingkat kedalaman

| Kedalaman | Bentuk kunci sesi                            | Peran                                         | Dapat men-spawn?             |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Sub-agen (orkestrator saat kedalaman 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agen (pekerja daun)                   | Tidak pernah                 |

### Rantai pengumuman

Hasil mengalir kembali ke atas rantai:

1. Pekerja kedalaman 2 selesai → mengumumkan ke induknya (orkestrator kedalaman 1).
2. Orkestrator kedalaman 1 menerima pengumuman, menyintesis hasil, selesai → mengumumkan ke utama.
3. Agen utama menerima pengumuman dan menyampaikannya kepada pengguna.

Setiap tingkat hanya melihat pengumuman dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak sekali dan tunggu peristiwa
penyelesaian alih-alih membangun loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah tidur `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi anak
terfokus pada pekerjaan live — anak live tetap terlampir, anak yang berakhir tetap
terlihat selama jendela terbaru yang singkat, dan tautan anak yang hanya ada di store dan sudah usang
diabaikan setelah jendela kesegarannya. Ini mencegah metadata `spawnedBy` /
`parentSessionKey` lama menghidupkan kembali anak semu setelah
mulai ulang. Jika peristiwa penyelesaian anak tiba setelah Anda sudah mengirim
jawaban final, tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan tool berdasarkan kedalaman

- Peran dan cakupan kontrol ditulis ke metadata sesi pada waktu spawn. Itu mencegah kunci sesi datar atau yang dipulihkan mendapatkan kembali hak istimewa orkestrator secara tidak sengaja.
- **Kedalaman 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat mengelola anak-anaknya. Tool sesi/sistem lainnya tetap ditolak.
- **Kedalaman 1 (daun, saat `maxSpawnDepth == 1`):** tidak ada tool sesi (perilaku default saat ini).
- **Kedalaman 2 (pekerja daun):** tidak ada tool sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat men-spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) anak aktif pada satu waktu. Ini mencegah fan-out tak terkendali
dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator kedalaman 1 otomatis menghentikan semua anak kedalaman 2-nya:

- `/stop` di chat utama menghentikan semua agen kedalaman 1 dan berantai ke anak kedalaman 2 mereka.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anak-anaknya.
- `/subagents kill all` menghentikan semua sub-agen untuk peminta dan berantai.

## Autentikasi

Auth sub-agen diselesaikan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Store auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen mengesampingkan profil utama jika terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Pengumuman

Sub-agen melapor kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks assistant terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, keluaran pengumuman ditekan meskipun progres terlihat sebelumnya ada.

Pengiriman bergantung pada kedalaman peminta:

- Sesi peminta tingkat atas menggunakan panggilan `agent` tindak lanjut dengan pengiriman eksternal (`deliver=true`).
- Sesi sub-agen peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) sehingga orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi sub-agen peminta bertingkat hilang, OpenClaw fallback ke peminta sesi tersebut jika tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian terlebih dahulu
menyelesaikan rute percakapan/utas terikat dan override hook apa pun, lalu mengisi
field target channel yang hilang dari rute tersimpan sesi peminta.
Itu menjaga penyelesaian pada chat/topik yang benar bahkan saat asal penyelesaian
hanya mengidentifikasi channel.

Agregasi penyelesaian anak dicakupkan ke run peminta saat ini saat
membangun temuan penyelesaian bertingkat, mencegah keluaran anak dari run sebelumnya yang usang
bocor ke pengumuman saat ini. Balasan pengumuman mempertahankan
perutean utas/topik saat tersedia pada adapter channel.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:

| Field          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                        |
| Id sesi        | Kunci/id sesi anak                                                                                            |
| Jenis          | Jenis pengumuman + label tugas                                                                                |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Konten hasil   | Teks assistant terlihat terbaru, atau teks tool/toolResult terbaru yang sudah disanitasi                      |
| Tindak lanjut  | Instruksi yang menjelaskan kapan harus membalas vs tetap senyap                                               |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang
teks balasan yang tertangkap. Saat timeout, jika anak hanya sempat melewati panggilan tool, pengumuman
dapat meringkas riwayat itu menjadi ringkasan progres parsial singkat alih-alih
memutar ulang keluaran tool mentah.

### Baris statistik

Payload pengumuman menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (mis. `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Estimasi biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan jalur transkrip sehingga agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal dimaksudkan hanya untuk orkestrasi; balasan yang menghadap pengguna
harus ditulis ulang dalam suara assistant yang normal.

### Mengapa memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Ingatan assistant dinormalisasi terlebih dahulu: tag pemikiran dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML panggilan tool teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup dengan bersih; scaffolding panggilan/hasil tool yang diturunkan dan marker konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII lain `<|...|>`, full-width `<｜...｜>`) dihapus; XML panggilan tool MiniMax yang salah bentuk dihapus.
- Teks yang menyerupai kredensial/token disunting.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat menghapus baris lama atau mengganti baris yang terlalu besar dengan `[sessions_history omitted: message too large]`.
- Pemeriksaan transkrip mentah di disk adalah fallback saat Anda membutuhkan transkrip lengkap byte demi byte.

## Kebijakan tool

Sub-agen menggunakan pipeline profil dan kebijakan tool yang sama seperti induk atau
agen target terlebih dahulu. Setelah itu, OpenClaw menerapkan lapisan pembatasan
sub-agen.

Tanpa `tools.profile` yang restriktif, sub-agen mendapatkan **semua tool kecuali
tool sesi** dan tool sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap menjadi tampilan ingatan yang terbatas dan tersanitasi di sini juga — itu
bukan dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, sub-agen orkestrator kedalaman 1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` agar dapat mengelola anak-anaknya.

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

`tools.subagents.tools.allow` adalah filter final hanya-izinkan. Ini dapat mempersempit
kumpulan alat yang sudah diselesaikan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` menyertakan
`web_search`/`web_fetch` tetapi bukan alat `browser`. Agar
sub-agen profil coding dapat menggunakan otomatisasi browser, tambahkan browser pada
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
agen yang perlu mendapatkan otomatisasi browser.

## Konkurensi

Sub-agen menggunakan jalur antrean dalam proses khusus:

- **Nama jalur:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Keaktifan dan pemulihan

OpenClaw tidak menganggap ketiadaan `endedAt` sebagai bukti permanen bahwa
sub-agen masih hidup. Run yang belum berakhir dan lebih lama dari jendela run usang
berhenti dihitung sebagai aktif/tertunda dalam `/subagents list`, ringkasan status,
gating penyelesaian turunan, dan pemeriksaan konkurensi per sesi.

Setelah Gateway dimulai ulang, run pulihan yang usang dan belum berakhir akan dipangkas kecuali
sesi anaknya ditandai `abortedLastRun: true`. Sesi anak yang dibatalkan saat
mulai ulang tersebut tetap dapat dipulihkan melalui alur pemulihan orphan sub-agen,
yang mengirim pesan resume sintetis sebelum menghapus penanda dibatalkan.

Pemulihan mulai ulang otomatis dibatasi per sesi anak. Jika anak sub-agen yang sama
diterima untuk pemulihan orphan berulang kali di dalam jendela re-wedge cepat,
OpenClaw menyimpan tombstone pemulihan pada sesi tersebut dan berhenti me-resume otomatis
sesi itu pada mulai ulang berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus flag pemulihan dibatalkan yang usang pada
sesi bertombstone.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pairing.
Koordinasi internal `sessions_spawn` harus terhubung sebagai
`client.id: "gateway-client"` dengan `client.mode: "backend"` melalui auth
shared-token/password direct loopback; jalur itu tidak bergantung pada
baseline cakupan perangkat yang dipasangkan milik CLI. Pemanggil jarak jauh, `deviceIdentity`
eksplisit, jalur token perangkat eksplisit, dan klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di obrolan peminta akan membatalkan sesi peminta dan menghentikan semua run sub-agen aktif yang di-spawn darinya, berantai hingga anak bertingkat.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anak-anaknya.

## Batasan

- Pengumuman sub-agen bersifat **upaya terbaik**. Jika Gateway dimulai ulang, pekerjaan "umumkan kembali" yang tertunda akan hilang.
- Sub-agen masih berbagi resource proses Gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-pemblokiran: ini langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman bertingkat maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Kirim agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
