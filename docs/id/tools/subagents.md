---
read_when:
    - Anda menginginkan pekerjaan latar belakang atau paralel melalui agen
    - Anda mengubah sessions_spawn atau kebijakan alat sub-agen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat utas
sidebarTitle: Sub-agents
summary: Jalankan proses agen latar belakang terisolasi yang melaporkan hasil kembali ke obrolan peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-05-07T13:26:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah proses agen latar belakang yang dibuat dari proses agen yang sudah ada.
Mereka berjalan dalam sesi sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke saluran chat
peminta. Setiap proses sub-agen dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / alat lambat" tanpa memblokir proses utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi + sandboxing opsional).
- Menjaga permukaan alat sulit disalahgunakan: sub-agen **tidak** mendapatkan alat sesi secara default.
- Mendukung kedalaman bertingkat yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agen memiliki konteks dan penggunaan tokennya sendiri secara
default. Untuk tugas berat atau berulang, tetapkan model yang lebih murah untuk sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per agen. Ketika anak
    benar-benar membutuhkan transkrip peminta saat ini, agen dapat meminta
    `context: "fork"` pada satu spawn tersebut. Sesi subagen yang terikat thread secara default
    menggunakan `context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini ke
    thread tindak lanjut.
</Note>

## Perintah slash

Gunakan `/subagents` untuk memeriksa atau mengontrol proses sub-agen untuk **sesi saat ini**:

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
jalur transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan ingatan
terbatas yang difilter demi keamanan; periksa jalur transkrip di disk ketika Anda
membutuhkan transkrip mentah lengkap.

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
relay internal) dan mengirim satu pembaruan penyelesaian final kembali ke chat
peminta saat proses selesai.

<AccordionGroup>
  <Accordion title="Penyelesaian non-pemblokiran berbasis push">
    - Perintah spawn bersifat non-pemblokiran; perintah ini langsung mengembalikan id proses.
    - Setelah selesai, sub-agen mengumumkan pesan ringkasan/hasil kembali ke saluran chat peminta.
    - Penyelesaian berbasis push. Setelah dibuat, jangan melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
    - Setelah selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Ketahanan pengiriman spawn manual">
    - OpenClaw menyerahkan penyelesaian kembali ke sesi peminta melalui giliran `agent` dengan kunci idempotensi stabil.
    - Jika proses peminta masih aktif, OpenClaw pertama-tama mencoba membangunkan/mengarahkan proses tersebut alih-alih memulai jalur balasan kedua yang terlihat.
    - Jika serah terima penyelesaian agen peminta gagal atau tidak menghasilkan output yang terlihat, OpenClaw memperlakukan pengiriman sebagai gagal dan beralih ke routing antrean/coba ulang. OpenClaw tidak mengirim mentah hasil anak langsung ke chat eksternal.
    - Jika serah terima langsung tidak dapat digunakan, OpenClaw beralih ke routing antrean.
    - Jika routing antrean masih tidak tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang sudah di-resolve: rute penyelesaian yang terikat thread atau terikat percakapan menang ketika tersedia; jika origin penyelesaian hanya menyediakan saluran, OpenClaw mengisi target/akun yang hilang dari rute sesi peminta yang sudah di-resolve (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap bekerja.

  </Accordion>
  <Accordion title="Metadata serah terima penyelesaian">
    Serah terima penyelesaian ke sesi peminta adalah konteks internal yang dibuat runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat, jika tidak ada maka teks tool/toolResult terbaru yang telah disanitasi. Proses gagal terminal tidak menggunakan kembali teks balasan yang ditangkap.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token yang ringkas.
    - Instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dalam suara asisten normal (bukan meneruskan metadata internal mentah).

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` mengganti default untuk proses spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah penyelesaian.
    - `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengiklankan runtime tersebut. Lihat [Model pengiriman ACP](/id/tools/acp-agents#delivery-model) ketika men-debug penyelesaian atau loop agen-ke-agen. Ketika plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya memilih `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak berada dalam sandbox, dan Plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native dimulai dalam kondisi terisolasi kecuali pemanggil secara eksplisit meminta untuk mem-fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat lambat, atau apa pun yang dapat dijelaskan dalam teks tugas                           | Membuat transkrip anak yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi anak sebelum anak dimulai. |

Gunakan `fork` seperlunya. Ini untuk delegasi yang sensitif terhadap konteks, bukan
pengganti penulisan prompt tugas yang jelas.

## Alat: `sessions_spawn`

Memulai proses sub-agen dengan `deliver: false` pada lane global `subagent`,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke saluran
chat peminta.

Ketersediaan bergantung pada kebijakan alat efektif pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara default. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agen yang harus mendelegasikan
pekerjaan. Kebijakan izinkan/tolak per saluran/grup, provider, sandbox, dan per agen
masih dapat menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen); `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen); `sessions_spawn.thinking` eksplisit tetap menang.
- **Batas waktu proses:** jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` ketika ditetapkan; jika tidak, kembali ke `0` (tanpa batas waktu).

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
  Khusus ACP. Melakukan streaming output proses ACP ke sesi induk ketika `runtime: "acp"`; hilangkan untuk spawn sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Mengganti model sub-agen. Nilai yang tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan di hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Mengganti tingkat thinking untuk proses sub-agen.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default ke `agents.defaults.subagents.runTimeoutSeconds` ketika ditetapkan, jika tidak `0`. Ketika ditetapkan, proses sub-agen dibatalkan setelah N detik.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Ketika `true`, meminta pengikatan thread saluran untuk sesi sub-agen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` membutuhkan `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` langsung mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak spawn kecuali runtime anak target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip saat ini milik peminta ke sesi anak. Hanya sub-agen native. Spawn yang terikat thread default ke `fork`; spawn non-thread default ke `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman saluran (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan
`message`/`sessions_send` dari proses yang dibuat.
</Warning>

## Sesi terikat thread

Ketika pengikatan thread diaktifkan untuk suatu saluran, sub-agen dapat tetap terikat
ke thread sehingga pesan pengguna tindak lanjut di thread tersebut terus dirutekan ke
sesi sub-agen yang sama.

### Saluran pendukung thread

**Discord** saat ini adalah satu-satunya saluran yang didukung. Discord mendukung
sesi subagen terikat thread persisten (`sessions_spawn` dengan
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
    Balasan dan pesan tindak lanjut dalam thread tersebut dirutekan ke sesi yang terikat.
  </Step>
  <Step title="Inspect timeouts">
    Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus karena tidak aktif dan
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
- **Override channel dan kunci auto-bind spawn** bersifat spesifik adapter. Lihat [Channel pendukung thread](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan apa pun). Default: hanya agen peminta. Jika Anda menetapkan daftar dan masih ingin peminta men-spawn dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
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
`sessions_spawn`. Respons mencakup model efektif setiap agen yang tercantum
dan metadata runtime tertanam sehingga pemanggil dapat membedakan PI, server aplikasi Codex,
dan runtime native terkonfigurasi lainnya.

### Arsip otomatis

- Sesi sub-agent otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah announce (tetap mempertahankan transkrip melalui penggantian nama).
- Arsip otomatis bersifat best-effort; timer tertunda akan hilang jika gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** mengarsipkan otomatis; itu hanya menghentikan run. Sesi tetap ada hingga arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi depth-1 dan depth-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup secara best-effort saat run selesai, meskipun catatan transkrip/sesi dipertahankan.

## Sub-agent bersarang

Secara default, sub-agent tidak dapat men-spawn sub-agent mereka sendiri
(`maxSpawnDepth: 1`). Tetapkan `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
sarang — **pola orkestrator**: utama → sub-agent orkestrator →
sub-sub-agent pekerja.

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

| Depth | Bentuk kunci sesi                           | Peran                                         | Dapat men-spawn?             |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orkestrator saat depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (pekerja leaf)                  | Tidak pernah                 |

### Rantai announce

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → mengumumkan ke induknya (orkestrator depth-1).
2. Orkestrator depth-1 menerima announce, mensintesis hasil, selesai → mengumumkan ke utama.
3. Agen utama menerima announce dan menyampaikan ke pengguna.

Setiap tingkat hanya melihat announce dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak sekali dan tunggu event penyelesaian
alih-alih membangun loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah sleep `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi anak
tetap berfokus pada pekerjaan live — anak live tetap terpasang, anak yang berakhir tetap
terlihat untuk jendela terbaru yang singkat, dan tautan anak yang hanya ada di store dan sudah basi
diabaikan setelah jendela kesegarannya. Ini mencegah metadata lama `spawnedBy` /
`parentSessionKey` menghidupkan kembali anak bayangan setelah
restart. Jika event penyelesaian anak tiba setelah Anda sudah mengirim
jawaban final, tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan tool berdasarkan depth

- Peran dan cakupan kontrol ditulis ke metadata sesi saat spawn. Ini mencegah kunci sesi datar atau yang dipulihkan secara tidak sengaja memperoleh kembali hak istimewa orkestrator.
- **Depth 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapat `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat mengelola anak-anaknya. Tool sesi/sistem lain tetap ditolak.
- **Depth 1 (leaf, saat `maxSpawnDepth == 1`):** tidak ada tool sesi (perilaku default saat ini).
- **Depth 2 (pekerja leaf):** tidak ada tool sesi — `sessions_spawn` selalu ditolak pada depth 2. Tidak dapat men-spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada depth apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) anak aktif sekaligus. Ini mencegah fan-out tak terkendali
dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator depth-1 otomatis menghentikan semua anak depth-2
miliknya:

- `/stop` di chat utama menghentikan semua agen depth-1 dan berantai ke anak depth-2 mereka.
- `/subagents kill <id>` menghentikan sub-agent tertentu dan berantai ke anak-anaknya.
- `/subagents kill all` menghentikan semua sub-agent untuk peminta dan berantai.

## Autentikasi

Auth sub-agent diselesaikan berdasarkan **id agen**, bukan berdasarkan tipe sesi:

- Kunci sesi sub-agent adalah `agent:<agentId>:subagent:<uuid>`.
- Store auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen menimpa profil utama saat terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Announce

Sub-agent melapor kembali melalui langkah announce:

- Langkah announce berjalan di dalam sesi sub-agent (bukan sesi peminta).
- Jika sub-agent membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks assistant terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, output announce ditekan meskipun sebelumnya ada progres yang terlihat.

Pengiriman bergantung pada depth peminta:

- Sesi peminta tingkat atas menggunakan panggilan `agent` tindak lanjut dengan pengiriman eksternal (`deliver=true`).
- Sesi subagent peminta bersarang menerima injeksi tindak lanjut internal (`deliver=false`) agar orkestrator dapat mensintesis hasil anak di dalam sesi.
- Jika sesi subagent peminta bersarang hilang, OpenClaw kembali ke peminta sesi tersebut saat tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian pertama-tama
menyelesaikan rute percakapan/thread terikat dan override hook, lalu mengisi
field target channel yang hilang dari rute tersimpan sesi peminta.
Ini menjaga penyelesaian tetap berada di chat/topik yang tepat meskipun asal penyelesaian
hanya mengidentifikasi channel.

Agregasi penyelesaian anak dicakupkan ke run peminta saat ini saat
membangun temuan penyelesaian bersarang, mencegah output anak dari run sebelumnya yang basi
bocor ke announce saat ini. Balasan announce mempertahankan
perutean thread/topik saat tersedia pada adapter channel.

### Konteks announce

Konteks announce dinormalisasi menjadi blok event internal yang stabil:

| Field          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` atau `cron`                                                                                        |
| Id sesi        | Kunci/id sesi anak                                                                                            |
| Tipe           | Tipe announce + label tugas                                                                                   |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Konten hasil   | Teks assistant terlihat terbaru, jika tidak ada maka teks tool/toolResult terbaru yang disanitasi             |
| Tindak lanjut  | Instruksi yang menjelaskan kapan harus membalas vs tetap senyap                                               |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang teks
balasan yang tertangkap. Saat timeout, jika anak hanya sempat melalui panggilan tool, announce
dapat meruntuhkan riwayat tersebut menjadi ringkasan progres parsial singkat alih-alih
memutar ulang output tool mentah.

### Baris statistik

Payload announce menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (misalnya `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Estimasi biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan path transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal dimaksudkan hanya untuk orkestrasi; balasan untuk pengguna
sebaiknya ditulis ulang dengan suara assistant normal.

### Mengapa memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Recall assistant dinormalisasi terlebih dahulu: tag thinking dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML panggilan tool teks polos (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup bersih; scaffolding panggilan/hasil tool yang diturunkan dan penanda konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII lain `<|...|>`, full-width `<｜...｜>`) dihapus; XML panggilan tool MiniMax yang cacat dihapus.
- Teks mirip kredensial/token disunting.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat membuang baris lama atau mengganti baris yang terlalu besar dengan `[sessions_history omitted: message too large]`.
- Pemeriksaan transkrip mentah di disk adalah fallback saat Anda membutuhkan transkrip lengkap byte demi byte.

## Kebijakan tool

Sub-agen menggunakan profil dan pipeline kebijakan alat yang sama dengan agen induk atau
target terlebih dahulu. Setelah itu, OpenClaw menerapkan lapisan pembatasan
sub-agen.

Tanpa `tools.profile` yang membatasi, sub-agen mendapatkan **semua alat kecuali
alat sesi** dan alat sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap menjadi tampilan pengingatan kembali yang terbatas dan disanitasi di sini juga — ini
bukan dump transkrip mentah.

Ketika `maxSpawnDepth >= 2`, sub-agen orkestrator kedalaman-1 juga
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

`tools.subagents.tools.allow` adalah filter akhir khusus-izin. Ini dapat mempersempit
kumpulan alat yang sudah diresolusikan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` menyertakan
`web_search`/`web_fetch` tetapi bukan alat `browser`. Agar
sub-agen profil-coding dapat menggunakan otomatisasi browser, tambahkan browser pada
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

## Konkruensi

Sub-agen menggunakan jalur antrean khusus dalam proses:

- **Nama jalur:** `subagent`
- **Konkruensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Keaktifan dan pemulihan

OpenClaw tidak memperlakukan ketiadaan `endedAt` sebagai bukti permanen bahwa
sub-agen masih hidup. Run yang belum diakhiri dan lebih lama daripada jendela run basi
berhenti dihitung sebagai aktif/tertunda dalam `/subagents list`, ringkasan status,
gating penyelesaian turunan, dan pemeriksaan konkruensi per sesi.

Setelah Gateway dimulai ulang, run yang dipulihkan, basi, dan belum diakhiri akan dipangkas kecuali
sesi anaknya ditandai `abortedLastRun: true`. Sesi anak yang
dibatalkan saat mulai ulang tersebut tetap dapat dipulihkan melalui alur pemulihan yatim sub-agen,
yang mengirim pesan lanjutkan sintetis sebelum
menghapus penanda dibatalkan.

Pemulihan mulai ulang otomatis dibatasi per sesi anak. Jika sub-agen anak yang sama
diterima untuk pemulihan yatim berulang kali di dalam
jendela re-wedge cepat, OpenClaw menyimpan tombstone pemulihan pada
sesi tersebut dan berhenti melanjutkannya otomatis pada mulai ulang berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus flag pemulihan dibatalkan yang basi pada
sesi yang ditombstone.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pairing.
Koordinasi internal `sessions_spawn` harus terhubung sebagai
`client.id: "gateway-client"` dengan `client.mode: "backend"` melalui autentikasi
token bersama/kata sandi direct loopback; jalur itu tidak bergantung pada
baseline cakupan perangkat berpasangan CLI. Pemanggil jarak jauh,
`deviceIdentity` eksplisit, jalur token perangkat eksplisit, serta klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta akan membatalkan sesi peminta dan menghentikan run sub-agen aktif apa pun yang di-spawn darinya, berantai ke anak bersarang.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anak-anaknya.

## Batasan

- Pengumuman sub-agen bersifat **upaya terbaik**. Jika gateway dimulai ulang, pekerjaan "announce back" yang tertunda akan hilang.
- Sub-agen tetap berbagi sumber daya proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-pemblokiran: ini langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman bersarang maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Kirim agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
