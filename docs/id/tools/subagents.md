---
read_when:
    - Anda ingin pekerjaan di latar belakang atau secara paralel melalui agen
    - Anda sedang mengubah kebijakan alat sessions_spawn atau sub-agen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat utas
sidebarTitle: Sub-agents
summary: Buat eksekusi agen latar belakang terisolasi yang mengirimkan hasil kembali ke obrolan peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-05-10T19:56:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b4a78b83fda42931ed2a4795e2db611121a30378de149c0478e989029123382
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah proses agen latar belakang yang dibuat dari proses agen yang sudah ada.
Mereka berjalan dalam sesi mereka sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke channel chat
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
`agents.defaults.subagents.model` atau penggantian per agen. Ketika sebuah child
    benar-benar membutuhkan transkrip peminta saat ini, agen dapat meminta
    `context: "fork"` pada satu spawn tersebut. Sesi subagent yang terikat thread secara default
    menggunakan `context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini ke dalam
    thread lanjutan.
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

Gunakan [`/steer <message>`](/id/tools/steer) tingkat atas untuk mengarahkan proses aktif sesi peminta saat ini. Gunakan `/subagents steer <id|#> <message>` ketika targetnya adalah proses child.

`/subagents info` menampilkan metadata proses (status, timestamp, id sesi,
path transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan ingatan yang dibatasi
dan disaring demi keamanan; periksa path transkrip di disk ketika Anda
membutuhkan transkrip lengkap mentah.

### Kontrol pengikatan thread

Perintah ini bekerja pada channel yang mendukung pengikatan thread persisten.
Lihat [Channel pendukung thread](#thread-supporting-channels) di bawah.

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
chat peminta saat proses selesai.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Perintah spawn tidak memblokir; perintah tersebut langsung mengembalikan id proses.
    - Saat selesai, sub-agen mengumumkan pesan ringkasan/hasil kembali ke channel chat peminta.
    - Giliran agen yang membutuhkan hasil child sebaiknya memanggil `sessions_yield` setelah membuat pekerjaan yang diperlukan. Itu mengakhiri giliran saat ini dan memungkinkan peristiwa penyelesaian tiba sebagai pesan berikutnya yang terlihat oleh model.
    - Penyelesaian berbasis push. Setelah dibuat, jangan melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
    - Output child adalah laporan/bukti untuk disintesis oleh agen peminta. Itu bukan teks instruksi yang ditulis pengguna dan tidak dapat menggantikan kebijakan sistem, developer, atau pengguna.
    - Saat selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw mengembalikan penyelesaian ke sesi peminta melalui giliran `agent` dengan kunci idempotensi yang stabil.
    - Jika proses peminta masih aktif, OpenClaw terlebih dahulu mencoba membangunkan/mengarahkan proses tersebut alih-alih memulai jalur balasan terlihat kedua.
    - Jika handoff penyelesaian agen peminta gagal atau tidak menghasilkan output terlihat, OpenClaw memperlakukan pengiriman sebagai gagal dan kembali ke routing antrean/coba ulang. OpenClaw tidak mengirim mentah hasil child langsung ke chat eksternal.
    - Jika handoff langsung tidak dapat digunakan, sistem kembali ke routing antrean.
    - Jika routing antrean masih tidak tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang sudah di-resolve: rute penyelesaian terikat thread atau terikat percakapan menang ketika tersedia; jika asal penyelesaian hanya menyediakan channel, OpenClaw mengisi target/akun yang hilang dari rute sesi peminta yang sudah di-resolve (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap bekerja.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Handoff penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terlihat terbaru, atau teks tool/toolResult terbaru yang sudah disanitasi. Proses gagal terminal tidak menggunakan ulang teks balasan yang tertangkap.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token ringkas.
    - Instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dengan suara asisten normal (bukan meneruskan metadata internal mentah).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` dan `--thinking` menggantikan default untuk proses spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
    - `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi terikat thread yang persisten, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengiklankan runtime tersebut. Lihat [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agen-ke-agen. Ketika plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya memilih `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` sampai ACP diaktifkan, peminta tidak berada dalam sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native mulai terisolasi kecuali pemanggil secara eksplisit meminta untuk melakukan fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat lambat, atau apa pun yang dapat dijelaskan singkat dalam teks tugas                           | Membuat transkrip child yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi child sebelum child dimulai. |

Gunakan `fork` seperlunya saja. Ini untuk delegasi yang peka konteks, bukan
pengganti penulisan prompt tugas yang jelas.

## Alat: `sessions_spawn`

Memulai proses sub-agen dengan `deliver: false` pada lane `subagent` global,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke channel
chat peminta.

Ketersediaan bergantung pada kebijakan alat efektif pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara default. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agen yang harus mendelegasikan
pekerjaan. Kebijakan channel/grup, penyedia, sandbox, dan allow/deny per agen masih dapat
menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen); `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen); `sessions_spawn.thinking` eksplisit tetap menang.
- **Batas waktu proses:** jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` saat ditetapkan; jika tidak, fallback ke `0` (tanpa batas waktu).

### Mode prompt delegasi

`agents.defaults.subagents.delegationMode` hanya mengontrol panduan prompt; ini tidak mengubah kebijakan alat atau memaksakan delegasi.

- `suggest` (default): mempertahankan dorongan prompt standar untuk menggunakan sub-agen untuk pekerjaan yang lebih besar atau lebih lambat.
- `prefer`: memberi tahu agen utama untuk tetap responsif dan mendelegasikan apa pun yang lebih terlibat daripada balasan langsung melalui `sessions_spawn`.

Penggantian per agen menggunakan `agents.list[].subagents.delegationMode`.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Parameter alat

<ParamField path="task" type="string" required>
  Deskripsi tugas untuk sub-agen.
</ParamField>
<ParamField path="taskName" type="string">
  Handle stabil opsional untuk penargetan `subagents` nanti. Harus cocok dengan `[a-z][a-z0-9_]{0,63}` dan tidak boleh berupa target yang dicadangkan seperti `last` atau `all`. Gunakan ini saat koordinator mungkin perlu mengarahkan, menghentikan, atau mengidentifikasi anak tertentu setelah memunculkan beberapa anak.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang mudah dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Munculkan di bawah id agen lain saat diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang ada saat `runtime: "acp"`; diabaikan untuk pemunculan sub-agen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Mengalirkan output run ACP ke sesi induk saat `runtime: "acp"`; hilangkan untuk pemunculan sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Mengganti model sub-agen. Nilai yang tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan di hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Mengganti tingkat thinking untuk run sub-agen.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default ke `agents.defaults.subagents.runTimeoutSeconds` saat disetel, jika tidak `0`. Saat disetel, run sub-agen dibatalkan setelah N detik.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Saat `true`, meminta pengikatan thread channel untuk sesi sub-agen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` langsung mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak pemunculan kecuali runtime anak target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip saat ini milik pemohon ke dalam sesi anak. Hanya sub-agen native. Pemunculan yang terikat thread default ke `fork`; pemunculan non-thread default ke `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman channel (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan
`message`/`sessions_send` dari run yang dimunculkan.
</Warning>

### Nama tugas dan penargetan

`taskName` adalah handle yang terlihat model untuk orkestrasi, bukan kunci sesi.
Gunakan ini untuk nama anak yang stabil seperti `review_subagents`,
`linux_validation`, atau `docs_update` saat koordinator mungkin perlu mengarahkan
atau menghentikan anak itu nanti.

Resolusi target menerima kecocokan `taskName` persis dan prefiks yang tidak ambigu.
Pencocokan dibatasi ke jendela target aktif/terbaru yang sama dengan yang digunakan
oleh target `/subagents` bernomor, sehingga anak lama yang sudah selesai tidak membuat
handle yang digunakan ulang menjadi ambigu. Jika dua anak aktif atau terbaru memiliki
`taskName` yang sama, target tersebut ambigu; gunakan indeks daftar, kunci sesi, atau
id run sebagai gantinya.

Target yang dicadangkan `last` dan `all` bukan nilai `taskName` yang valid
karena keduanya sudah memiliki makna kontrol.

## Alat: `sessions_yield`

Mengakhiri giliran model saat ini dan menunggu peristiwa runtime, terutama
peristiwa penyelesaian sub-agen, tiba sebagai pesan berikutnya. Gunakan ini setelah
memunculkan pekerjaan anak yang diperlukan saat pemohon tidak dapat menghasilkan
jawaban final sampai penyelesaian tersebut tiba.

`sessions_yield` adalah primitif untuk menunggu. Jangan menggantinya dengan loop
polling atas `subagents`, `sessions_list`, `sessions_history`, `sleep` shell,
atau polling proses hanya untuk mendeteksi penyelesaian anak.

Gunakan `sessions_yield` hanya saat daftar alat efektif sesi menyertakannya.
Beberapa profil alat minimal atau kustom mungkin mengekspos `sessions_spawn` dan
`subagents` tanpa mengekspos `sessions_yield`; dalam kasus itu, jangan membuat
loop polling hanya untuk menunggu penyelesaian.

Saat anak aktif ada, OpenClaw menyuntikkan blok prompt ringkas yang dibuat runtime
`Active Subagents` ke giliran normal sehingga pemohon dapat melihat sesi anak saat ini,
id run, status, label, tugas, dan alias `taskName` tanpa polling. Kolom tugas dan
label dalam blok itu dikutip sebagai data, bukan instruksi, karena dapat berasal
dari argumen pemunculan yang diberikan pengguna/model.

## Alat: `subagents`

Mencantumkan, mengarahkan, atau menghentikan run sub-agen yang dimunculkan dan dimiliki
oleh sesi pemohon. Ini dibatasi ke pemohon saat ini; anak hanya dapat melihat/mengontrol
anak yang dikontrolnya sendiri.

Gunakan `subagents` untuk status sesuai permintaan, debugging, pengarahan, atau penghentian.
Gunakan `sessions_yield` untuk menunggu peristiwa penyelesaian.

## Sesi terikat thread

Saat pengikatan thread diaktifkan untuk suatu channel, sub-agen dapat tetap terikat
ke sebuah thread sehingga pesan pengguna lanjutan di thread tersebut terus diarahkan
ke sesi sub-agen yang sama.

### Channel pendukung thread

**Discord** saat ini adalah satu-satunya channel yang didukung. Ini mendukung
sesi subagen terikat thread yang persisten (`sessions_spawn` dengan
`thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), dan kunci adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, dan
`channels.discord.threadBindings.spawnSessions`.

### Alur cepat

<Steps>
  <Step title="Munculkan">
    `sessions_spawn` dengan `thread: true` (dan opsional `mode: "session"`).
  </Step>
  <Step title="Ikat">
    OpenClaw membuat atau mengikat thread ke target sesi tersebut di channel aktif.
  </Step>
  <Step title="Arahkan tindak lanjut">
    Balasan dan pesan lanjutan di thread tersebut diarahkan ke sesi terikat.
  </Step>
  <Step title="Periksa timeout">
    Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus karena tidak aktif dan
    `/session max-age` untuk mengontrol batas keras.
  </Step>
  <Step title="Lepaskan">
    Gunakan `/unfocus` untuk melepaskan secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah           | Efek                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ikat thread saat ini (atau buat satu) ke target sub-agen/sesi         |
| `/unfocus`         | Hapus pengikatan untuk thread terikat saat ini                        |
| `/agents`          | Cantumkan run aktif dan status pengikatan (`thread:<id>` atau `unbound`) |
| `/session idle`    | Periksa/perbarui auto-unfocus saat idle (hanya thread terikat yang fokus) |
| `/session max-age` | Periksa/perbarui batas keras (hanya thread terikat yang fokus)        |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override channel dan kunci auto-bind pemunculan** bersifat spesifik adapter. Lihat [Channel pendukung thread](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan apa pun). Default: hanya agen pemohon. Jika Anda menyetel daftar dan tetap ingin pemohon memunculkan dirinya sendiri dengan `agentId`, sertakan id pemohon dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist agen target default yang digunakan saat agen pemohon tidak menyetel `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Override per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jika sesi pemohon berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif setiap agen yang tercantum
dan metadata runtime tertanam sehingga pemanggil dapat membedakan PI, server aplikasi
Codex, dan runtime native terkonfigurasi lainnya.

### Arsip otomatis

- Sesi sub-agen secara otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
- Arsip otomatis bersifat best-effort; timer tertunda akan hilang jika gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** mengarsipkan otomatis; ini hanya menghentikan run. Sesi tetap ada sampai arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi kedalaman-1 dan kedalaman-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup secara best-effort saat run selesai, bahkan jika catatan transkrip/sesi tetap disimpan.

## Sub-agen bertingkat

Secara default, sub-agen tidak dapat memunculkan sub-agen mereka sendiri
(`maxSpawnDepth: 1`). Setel `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
penyusunan bertingkat — **pola orchestrator**: utama → sub-agen orchestrator →
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

| Kedalaman | Bentuk kunci sesi                            | Peran                                         | Dapat memunculkan?           |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Sub-agen (orchestrator saat kedalaman 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agen (pekerja leaf)                   | Tidak pernah                 |

### Rantai pengumuman

Hasil mengalir kembali ke atas rantai:

1. Pekerja kedalaman-2 selesai → mengumumkan ke induknya (orchestrator kedalaman-1).
2. Orchestrator kedalaman-1 menerima pengumuman, menyintesis hasil, selesai → mengumumkan ke utama.
3. Agen utama menerima pengumuman dan mengirimkannya ke pengguna.

Setiap tingkat hanya melihat pengumuman dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak satu kali dan tunggu peristiwa
penyelesaian alih-alih membangun loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah sleep `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi anak tetap
berfokus pada pekerjaan live — anak live tetap terlampir, anak yang berakhir tetap
terlihat untuk jendela terbaru yang singkat, dan tautan anak lama yang hanya ada
di store diabaikan setelah jendela kesegarannya. Ini mencegah metadata lama
`spawnedBy` / `parentSessionKey` membangkitkan anak bayangan setelah restart.
Jika peristiwa penyelesaian anak tiba setelah Anda sudah mengirim jawaban final,
tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan kedalaman

- Peran dan cakupan kontrol ditulis ke metadata sesi saat spawn. Ini menjaga kunci sesi datar atau yang dipulihkan agar tidak secara tidak sengaja memperoleh kembali hak istimewa orkestrator.
- **Kedalaman 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat mengelola anak-anaknya. Alat sesi/sistem lain tetap ditolak.
- **Kedalaman 1 (leaf, saat `maxSpawnDepth == 1`):** tidak ada alat sesi (perilaku default saat ini).
- **Kedalaman 2 (pekerja leaf):** tidak ada alat sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat men-spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) anak aktif pada satu waktu. Ini mencegah fan-out tak terkendali
dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator kedalaman-1 secara otomatis menghentikan semua anak
kedalaman-2 miliknya:

- `/stop` di chat utama menghentikan semua agen kedalaman-1 dan berantai ke anak kedalaman-2 mereka.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anak-anaknya.
- `/subagents kill all` menghentikan semua sub-agen untuk peminta dan berantai.

## Autentikasi

Auth sub-agen diselesaikan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen mengesampingkan profil utama saat terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Pengumuman

Sub-agen melapor kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, keluaran pengumuman ditekan meskipun progres terlihat sebelumnya pernah ada.

Pengiriman bergantung pada kedalaman peminta:

- Sesi peminta tingkat atas menggunakan panggilan `agent` lanjutan dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bertingkat menerima injeksi lanjutan internal (`deliver=false`) agar orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagen peminta bertingkat sudah hilang, OpenClaw fallback ke peminta sesi tersebut saat tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian terlebih dahulu
menyelesaikan rute percakapan/thread terikat dan override hook apa pun, lalu mengisi
kolom target kanal yang hilang dari rute tersimpan sesi peminta.
Ini menjaga penyelesaian tetap berada di chat/topik yang benar bahkan saat asal
penyelesaian hanya mengidentifikasi kanal.

Agregasi penyelesaian anak dicakup ke proses peminta saat ini saat
membangun temuan penyelesaian bertingkat, mencegah keluaran anak dari proses lama
bocor ke pengumuman saat ini. Balasan pengumuman mempertahankan
routing thread/topik saat tersedia pada adaptor kanal.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:

| Kolom          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                        |
| Id sesi        | Kunci/id sesi anak                                                                                            |
| Jenis          | Jenis pengumuman + label tugas                                                                                |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Konten hasil   | Teks asisten terlihat terbaru, jika tidak ada maka teks alat/toolResult terbaru yang sudah disanitasi          |
| Tindak lanjut  | Instruksi yang menjelaskan kapan harus membalas vs tetap senyap                                               |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang teks
balasan yang ditangkap. Saat timeout, jika anak hanya sempat melewati panggilan alat, pengumuman
dapat merangkum riwayat itu menjadi ringkasan progres parsial singkat alih-alih
memutar ulang keluaran alat mentah.

### Baris statistik

Payload pengumuman menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (mis. `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Perkiraan biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan jalur transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal hanya ditujukan untuk orkestrasi; balasan yang terlihat pengguna
harus ditulis ulang dengan suara asisten normal.

### Mengapa memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Ingatan asisten dinormalisasi terlebih dahulu: tag pemikiran dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML panggilan alat teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup dengan bersih; scaffolding panggilan/hasil alat yang diturunkan dan penanda konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII lain `<|...|>`, bentuk lebar penuh `<｜...｜>`) dihapus; XML panggilan alat MiniMax yang malformed dihapus.
- Teks mirip kredensial/token direduksi.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat menjatuhkan baris lama atau mengganti baris terlalu besar dengan `[sessions_history omitted: message too large]`.
- Pemeriksaan transkrip mentah di disk adalah fallback saat Anda membutuhkan transkrip lengkap byte-demi-byte.

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

`sessions_history` tetap menjadi tampilan ingatan terbatas dan tersanitasi di sini juga — ini
bukan dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, sub-agen orkestrator kedalaman-1 juga
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

`tools.subagents.tools.allow` adalah filter final allow-only. Ini dapat mempersempit
set alat yang sudah diselesaikan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` menyertakan
`web_search`/`web_fetch` tetapi bukan alat `browser`. Agar
sub-agen profil coding dapat menggunakan otomasi browser, tambahkan browser pada
tahap profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gunakan `agents.list[].tools.alsoAllow: ["browser"]` per agen saat hanya satu
agen yang seharusnya mendapatkan otomasi browser.

## Konkurensi

Sub-agen menggunakan lane antrean dalam-proses khusus:

- **Nama lane:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Liveness dan pemulihan

OpenClaw tidak memperlakukan ketiadaan `endedAt` sebagai bukti permanen bahwa
sub-agen masih hidup. Run yang belum berakhir dan lebih lama dari jendela run stale
berhenti dihitung sebagai aktif/tertunda dalam `/subagents list`, ringkasan status,
gating penyelesaian turunan, dan pemeriksaan konkurensi per sesi.

Setelah Gateway dimulai ulang, run dipulihkan yang stale dan belum berakhir dipangkas kecuali
sesi anaknya ditandai `abortedLastRun: true`. Sesi anak yang
dibatalkan oleh restart tersebut tetap dapat dipulihkan melalui alur pemulihan orphan
sub-agen, yang mengirim pesan resume sintetis sebelum
menghapus penanda dibatalkan.

Pemulihan restart otomatis dibatasi per sesi anak. Jika anak
sub-agen yang sama diterima untuk pemulihan orphan berulang kali di dalam
jendela rapid re-wedge, OpenClaw menyimpan tombstone pemulihan pada
sesi itu dan berhenti me-resume-nya secara otomatis pada restart berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus flag pemulihan dibatalkan yang stale pada
sesi yang sudah ditombstone.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pairing.
Koordinasi `sessions_spawn` internal harus terhubung sebagai
`client.id: "gateway-client"` dengan `client.mode: "backend"` melalui auth
direct loopback shared-token/password; jalur itu tidak bergantung pada
baseline cakupan perangkat yang dipasangkan milik CLI. Pemanggil jarak jauh, `deviceIdentity`
eksplisit, jalur device-token eksplisit, dan klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan semua run sub-agen aktif yang di-spawn darinya, berantai ke anak bertingkat.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anak-anaknya.

## Batasan

- Pengumuman sub-agen bersifat **best-effort**. Jika Gateway dimulai ulang, pekerjaan "announce back" yang tertunda akan hilang.
- Sub-agen masih berbagi sumber daya proses Gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menginjeksikan `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` dan `USER.md` (tanpa `MEMORY.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman nesting maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Kirim agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
