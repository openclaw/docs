---
read_when:
    - Anda ingin pekerjaan di latar belakang atau paralel melalui agen
    - Anda mengubah kebijakan alat sessions_spawn atau sub-agen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat pada utas
sidebarTitle: Sub-agents
summary: Buat eksekusi agen latar belakang terisolasi yang mengumumkan hasil kembali ke obrolan peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-04-30T10:17:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah eksekusi agen latar belakang yang dibuat dari eksekusi agen yang sudah ada.
Mereka berjalan dalam sesi sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke saluran obrolan
peminta. Setiap eksekusi sub-agen dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / alat lambat" tanpa memblokir eksekusi utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi + sandbox opsional).
- Menjaga permukaan alat sulit disalahgunakan: sub-agen **tidak** mendapatkan alat sesi secara default.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agen memiliki konteks dan penggunaan tokennya sendiri secara
default. Untuk tugas berat atau repetitif, tetapkan model yang lebih murah untuk sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per agen. Ketika anak
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
path transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan ingatan
terbatas dan difilter keamanan; periksa path transkrip di disk ketika Anda
membutuhkan transkrip lengkap mentah.

### Kontrol binding thread

Perintah ini berfungsi pada saluran yang mendukung binding thread persisten.
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
relay internal) dan mengirim satu pembaruan penyelesaian final kembali ke
obrolan peminta saat eksekusi selesai.

<AccordionGroup>
  <Accordion title="Penyelesaian non-pemblokir berbasis push">
    - Perintah spawn bersifat non-pemblokir; ia segera mengembalikan id eksekusi.
    - Saat selesai, sub-agen mengumumkan pesan ringkasan/hasil kembali ke saluran obrolan peminta.
    - Penyelesaian berbasis push. Setelah dibuat, jangan melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
    - Saat selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Ketahanan pengiriman spawn manual">
    - OpenClaw mencoba pengiriman langsung `agent` terlebih dahulu dengan kunci idempotensi yang stabil.
    - Jika pengiriman langsung gagal, ia fallback ke routing antrean.
    - Jika routing antrean masih tidak tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang telah di-resolve: rute penyelesaian terikat thread atau terikat percakapan menang ketika tersedia; jika asal penyelesaian hanya menyediakan saluran, OpenClaw mengisi target/akun yang hilang dari rute sesi peminta yang telah di-resolve (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata handoff penyelesaian">
    Handoff penyelesaian ke sesi peminta adalah konteks internal yang dibuat runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat, jika tidak ada maka teks tool/toolResult terbaru yang telah disanitasi. Eksekusi gagal terminal tidak menggunakan ulang teks balasan yang ditangkap.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token ringkas.
    - Instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dengan suara asisten normal (bukan meneruskan metadata internal mentah).

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` mengoverride default untuk eksekusi spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
    - `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengiklankan runtime tersebut. Lihat [Model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agen-ke-agen. Ketika plugin `codex` diaktifkan, kontrol obrolan/thread Codex sebaiknya memilih `/codex ...` dibanding ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` sampai ACP diaktifkan, peminta tidak berada dalam sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native mulai terisolasi kecuali pemanggil secara eksplisit meminta untuk mem-fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat lambat, atau apa pun yang dapat dijelaskan dalam teks tugas                           | Membuat transkrip anak yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi anak sebelum anak dimulai. |

Gunakan `fork` seperlunya. Ini untuk delegasi yang peka konteks, bukan
pengganti untuk menulis prompt tugas yang jelas.

## Alat: `sessions_spawn`

Memulai eksekusi sub-agen dengan `deliver: false` pada lane global `subagent`,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke saluran
obrolan peminta.

Ketersediaan bergantung pada kebijakan alat efektif pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara default. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agen yang harus mendelegasikan
pekerjaan. Kebijakan izinkan/tolak per saluran/grup, provider, sandbox, dan per agen masih dapat
menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen); `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen); `sessions_spawn.thinking` eksplisit tetap menang.
- **Timeout eksekusi:** jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` ketika disetel; jika tidak, fallback ke `0` (tanpa timeout).

### Parameter alat

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
  Khusus ACP. Mengalirkan output eksekusi ACP ke sesi induk ketika `runtime: "acp"`; hilangkan untuk spawn sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Override model sub-agen. Nilai tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Override tingkat thinking untuk eksekusi sub-agen.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default ke `agents.defaults.subagents.runTimeoutSeconds` ketika disetel, jika tidak `0`. Ketika disetel, eksekusi sub-agen dibatalkan setelah N detik.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Ketika `true`, meminta binding thread saluran untuk sesi sub-agen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` langsung mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui rename).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak spawn kecuali runtime anak target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke sesi anak. Hanya sub-agen native. Gunakan `fork` hanya ketika anak membutuhkan transkrip saat ini.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman saluran (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan
`message`/`sessions_send` dari eksekusi yang dibuat.
</Warning>

## Sesi terikat thread

Ketika binding thread diaktifkan untuk suatu saluran, sub-agen dapat tetap terikat
ke sebuah thread sehingga pesan pengguna lanjutan di thread tersebut tetap dirutekan ke
sesi sub-agen yang sama.

### Saluran yang mendukung thread

**Discord** saat ini adalah satu-satunya saluran yang didukung. Ia mendukung
sesi sub-agen terikat thread persisten (`sessions_spawn` dengan
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
    OpenClaw membuat atau mengikat thread ke target sesi tersebut di saluran aktif.
  </Step>
  <Step title="Rutekan tindak lanjut">
    Balasan dan pesan lanjutan di thread tersebut dirutekan ke sesi terikat.
  </Step>
  <Step title="Periksa timeout">
    Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus karena tidak aktif dan
    `/session max-age` untuk mengontrol batas keras.
  </Step>
  <Step title="Lepaskan">
    Gunakan `/unfocus` untuk melepas secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah          | Efek                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `/focus <target>` | Ikat thread saat ini (atau buat yang baru) ke target sub-agen/sesi    |
| `/unfocus`        | Hapus ikatan untuk thread terikat saat ini                            |
| `/agents`         | Cantumkan run aktif dan status ikatan (`thread:<id>` atau `unbound`)  |
| `/session idle`   | Periksa/perbarui auto-unfocus saat idle (hanya thread terikat fokus)  |
| `/session max-age` | Periksa/perbarui batas keras (hanya thread terikat fokus)            |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override channel dan kunci spawn auto-bind** bersifat khusus adapter. Lihat [Channel pendukung thread](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Daftar izin

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan apa pun). Default: hanya agen peminta. Jika Anda menetapkan daftar dan tetap ingin peminta men-spawn dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Daftar izin agen target default yang digunakan saat agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Override per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif setiap agen yang tercantum
dan metadata runtime tertanam agar pemanggil dapat membedakan PI, server aplikasi Codex,
dan runtime native terkonfigurasi lainnya.

### Arsip otomatis

- Sesi sub-agen diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah announce (tetap menyimpan transkrip melalui penggantian nama).
- Arsip otomatis bersifat best-effort; timer tertunda hilang jika gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** mengarsipkan otomatis; itu hanya menghentikan run. Sesi tetap ada sampai arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi kedalaman-1 dan kedalaman-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup secara best-effort saat run selesai, meskipun catatan transkrip/sesi tetap disimpan.

## Sub-agen bersarang

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

| Kedalaman | Bentuk kunci sesi                            | Peran                                             | Dapat men-spawn?             |
| --------- | -------------------------------------------- | ------------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Agen utama                                        | Selalu                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Sub-agen (orkestrator saat kedalaman 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agen (pekerja leaf)                       | Tidak pernah                 |

### Rantai announce

Hasil mengalir kembali ke atas rantai:

1. Pekerja kedalaman-2 selesai → mengumumkan ke induknya (orkestrator kedalaman-1).
2. Orkestrator kedalaman-1 menerima announce, menyintesis hasil, selesai → mengumumkan ke utama.
3. Agen utama menerima announce dan mengirimkannya kepada pengguna.

Setiap tingkat hanya melihat announce dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak sekali dan tunggu event penyelesaian
alih-alih membuat loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah sleep `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi anak
tetap berfokus pada pekerjaan live — anak live tetap terlampir, anak yang berakhir tetap
terlihat selama jendela terbaru yang singkat, dan tautan anak lama yang hanya ada di store
diabaikan setelah jendela kesegarannya. Ini mencegah metadata `spawnedBy` /
`parentSessionKey` lama membangkitkan anak hantu setelah
restart. Jika event penyelesaian anak tiba setelah Anda sudah mengirim
jawaban final, tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan kedalaman

- Peran dan cakupan kontrol ditulis ke metadata sesi saat spawn. Itu mencegah kunci sesi datar atau yang dipulihkan mendapatkan kembali hak istimewa orkestrator secara tidak sengaja.
- **Kedalaman 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat mengelola anaknya. Alat sesi/sistem lainnya tetap ditolak.
- **Kedalaman 1 (leaf, saat `maxSpawnDepth == 1`):** tidak ada alat sesi (perilaku default saat ini).
- **Kedalaman 2 (pekerja leaf):** tidak ada alat sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat men-spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) anak aktif sekaligus. Ini mencegah fan-out tak terkendali
dari satu orkestrator.

### Henti kaskade

Menghentikan orkestrator kedalaman-1 secara otomatis menghentikan semua anak kedalaman-2
miliknya:

- `/stop` di chat utama menghentikan semua agen kedalaman-1 dan melakukan kaskade ke anak kedalaman-2 mereka.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan melakukan kaskade ke anaknya.
- `/subagents kill all` menghentikan semua sub-agen untuk peminta dan melakukan kaskade.

## Autentikasi

Auth sub-agen diselesaikan berdasarkan **id agen**, bukan berdasarkan tipe sesi:

- Kunci sesi sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Store auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen menimpa profil utama jika ada konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Announce

Sub-agen melapor kembali melalui langkah announce:

- Langkah announce berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, output announce ditekan meskipun progres terlihat sebelumnya ada.

Pengiriman bergantung pada kedalaman peminta:

- Sesi peminta tingkat atas menggunakan panggilan `agent` tindak lanjut dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bersarang menerima injeksi tindak lanjut internal (`deliver=false`) agar orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagen peminta bersarang sudah hilang, OpenClaw fallback ke peminta sesi tersebut jika tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian terlebih dahulu
menyelesaikan rute percakapan/thread terikat dan override hook apa pun, lalu mengisi
field target-channel yang hilang dari rute tersimpan sesi peminta.
Itu menjaga penyelesaian tetap berada di chat/topik yang benar meskipun asal penyelesaian
hanya mengidentifikasi channel.

Agregasi penyelesaian anak dicakup ke run peminta saat ini ketika
membangun temuan penyelesaian bersarang, mencegah output anak dari run sebelumnya yang usang
bocor ke announce saat ini. Balasan announce mempertahankan
perutean thread/topik saat tersedia pada adapter channel.

### Konteks announce

Konteks announce dinormalisasi menjadi blok event internal yang stabil:

| Field          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` atau `cron`                                                                                        |
| Session ids    | Kunci/id sesi anak                                                                                            |
| Type           | Tipe announce + label tugas                                                                                   |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Result content | Teks asisten terlihat terbaru, jika tidak ada maka teks tool/toolResult terbaru yang disanitasi               |
| Follow-up      | Instruksi yang menjelaskan kapan harus membalas vs tetap senyap                                               |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang teks
balasan yang ditangkap. Saat timeout, jika anak hanya berhasil menjalankan panggilan alat,
announce dapat meringkas riwayat itu menjadi ringkasan progres parsial singkat alih-alih
memutar ulang output alat mentah.

### Baris statistik

Payload announce menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (mis. `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Estimasi biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan path transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal hanya dimaksudkan untuk orkestrasi; balasan yang menghadap pengguna
harus ditulis ulang dengan suara asisten normal.

### Mengapa lebih memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Recall asisten dinormalisasi terlebih dahulu: tag thinking dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML panggilan alat teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup bersih; scaffolding panggilan/hasil alat yang diturunkan dan penanda konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII lain `<|...|>`, lebar penuh `<｜...｜>`) dihapus; XML panggilan alat MiniMax yang cacat dihapus.
- Teks mirip kredensial/token disunting.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat menghapus baris yang lebih lama atau mengganti baris yang terlalu besar dengan `[sessions_history omitted: message too large]`.
- Pemeriksaan transkrip mentah di disk adalah fallback saat Anda membutuhkan transkrip lengkap byte demi byte.

## Kebijakan alat

Sub-agen menggunakan profil dan pipeline kebijakan alat yang sama seperti induk atau
agen target terlebih dahulu. Setelah itu, OpenClaw menerapkan lapisan pembatasan
sub-agen.

Tanpa `tools.profile` yang restriktif, sub-agen mendapatkan **semua alat kecuali
alat sesi** dan alat sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap berupa tampilan recall terbatas dan tersanitasi di sini juga — itu
bukan dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, sub-agen orkestrator kedalaman-1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` agar dapat mengelola anaknya.

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

`tools.subagents.tools.allow` adalah filter final khusus allow. Filter ini dapat mempersempit kumpulan tool yang sudah diselesaikan, tetapi tidak dapat **menambahkan kembali** tool yang dihapus oleh `tools.profile`. Misalnya, `tools.profile: "coding"` menyertakan `web_search`/`web_fetch` tetapi tidak menyertakan tool `browser`. Agar sub-agen profil coding dapat menggunakan otomatisasi browser, tambahkan browser pada tahap profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gunakan `agents.list[].tools.alsoAllow: ["browser"]` per agen ketika hanya satu agen yang perlu mendapatkan otomatisasi browser.

## Konkurensi

Sub-agen menggunakan jalur antrean khusus dalam proses:

- **Nama jalur:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Liveness dan pemulihan

OpenClaw tidak memperlakukan ketiadaan `endedAt` sebagai bukti permanen bahwa sebuah sub-agen masih hidup. Run yang belum berakhir dan lebih lama dari jendela run basi berhenti dihitung sebagai aktif/tertunda di `/subagents list`, ringkasan status, gating penyelesaian turunan, dan pemeriksaan konkurensi per sesi.

Setelah Gateway dimulai ulang, run pulihan basi yang belum berakhir dipangkas kecuali sesi anaknya ditandai `abortedLastRun: true`. Sesi anak yang dibatalkan oleh restart tersebut tetap dapat dipulihkan melalui alur pemulihan yatim sub-agen, yang mengirim pesan resume sintetis sebelum menghapus penanda dibatalkan.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` / `scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pairing. Koordinasi internal `sessions_spawn` harus terhubung sebagai `client.id: "gateway-client"` dengan `client.mode: "backend"` melalui autentikasi shared-token/password loopback langsung; jalur itu tidak bergantung pada baseline cakupan perangkat yang dipairing milik CLI. Pemanggil jarak jauh, `deviceIdentity` eksplisit, jalur token perangkat eksplisit, serta klien browser/node tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan run sub-agen aktif yang di-spawn darinya, lalu mengalir ke anak bertingkat.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan mengalir ke anak-anaknya.

## Batasan

- Pengumuman sub-agen bersifat **upaya terbaik**. Jika gateway dimulai ulang, pekerjaan "announce back" yang tertunda akan hilang.
- Sub-agen tetap berbagi sumber daya proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: ini langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman bersarang maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Pengiriman agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Tool sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
