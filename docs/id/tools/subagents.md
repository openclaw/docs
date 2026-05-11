---
read_when:
    - Anda ingin pekerjaan latar belakang atau paralel melalui agen
    - Anda sedang mengubah kebijakan sessions_spawn atau alat subagen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat pada utas
sidebarTitle: Sub-agents
summary: Buat eksekusi agen latar belakang terisolasi yang mengumumkan hasil kembali ke obrolan peminta.
title: Sub-agen
x-i18n:
    generated_at: "2026-05-11T20:37:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah eksekusi agen latar belakang yang dimunculkan dari eksekusi agen yang sudah ada.
Mereka berjalan dalam sesi masing-masing (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke saluran obrolan
peminta. Setiap eksekusi sub-agen dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / alat lambat" tanpa memblokir eksekusi utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi + sandboxing opsional).
- Menjaga permukaan alat sulit disalahgunakan: sub-agen **tidak** mendapatkan alat sesi secara default.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agen memiliki konteks dan penggunaan tokennya sendiri secara
default. Untuk tugas berat atau repetitif, tetapkan model yang lebih murah untuk sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per agen. Ketika child
    benar-benar membutuhkan transkrip peminta saat ini, agen dapat meminta
    `context: "fork"` pada satu spawn tersebut. Sesi subagen yang terikat thread secara default
    menggunakan `context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini ke
    thread lanjutan.
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

Gunakan [`/steer <message>`](/id/tools/steer) tingkat atas untuk mengarahkan eksekusi aktif sesi peminta saat ini. Gunakan `/subagents steer <id|#> <message>` saat targetnya adalah eksekusi child.

`/subagents info` menampilkan metadata eksekusi (status, stempel waktu, id sesi,
path transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan ingatan yang terbatas dan
difilter demi keamanan; periksa path transkrip di disk saat Anda
membutuhkan transkrip lengkap mentah.

### Kontrol pengikatan thread

Perintah ini berfungsi pada saluran yang mendukung pengikatan thread persisten.
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
  <Accordion title="Penyelesaian non-pemblokiran berbasis push">
    - Perintah spawn bersifat non-pemblokiran; perintah ini langsung mengembalikan id eksekusi.
    - Saat selesai, sub-agen mengumumkan pesan ringkasan/hasil kembali ke saluran obrolan peminta.
    - Giliran agen yang membutuhkan hasil child harus memanggil `sessions_yield` setelah memunculkan pekerjaan yang diperlukan. Itu mengakhiri giliran saat ini dan memungkinkan peristiwa penyelesaian masuk sebagai pesan berikutnya yang terlihat oleh model.
    - Penyelesaian berbasis push. Setelah dimunculkan, **jangan** melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
    - Output child adalah laporan/bukti untuk disintesis oleh agen peminta. Itu bukan teks instruksi yang ditulis pengguna dan tidak dapat menimpa kebijakan sistem, developer, atau pengguna.
    - Saat selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Ketahanan pengiriman spawn manual">
    - OpenClaw menyerahkan penyelesaian kembali ke sesi peminta melalui giliran `agent` dengan kunci idempotensi yang stabil.
    - Jika eksekusi peminta masih aktif, OpenClaw terlebih dahulu mencoba membangunkan/mengarahkan eksekusi tersebut alih-alih memulai jalur balasan terlihat kedua.
    - Jika handoff penyelesaian agen peminta gagal atau tidak menghasilkan output yang terlihat, OpenClaw memperlakukan pengiriman sebagai gagal dan beralih ke routing antrean/coba ulang. OpenClaw tidak mengirim mentah hasil child langsung ke obrolan eksternal.
    - Jika handoff langsung tidak dapat digunakan, OpenClaw beralih ke routing antrean.
    - Jika routing antrean masih tidak tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang telah diselesaikan: rute penyelesaian yang terikat thread atau terikat percakapan menang saat tersedia; jika asal penyelesaian hanya menyediakan saluran, OpenClaw mengisi target/akun yang hilang dari rute terselesaikan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata handoff penyelesaian">
    Handoff penyelesaian ke sesi peminta adalah konteks internal yang dibuat runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat, jika tidak ada, teks alat/toolResult terbaru yang telah disanitasi. Eksekusi terminal yang gagal tidak menggunakan ulang teks balasan yang tertangkap.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token yang ringkas.
    - Instruksi pengiriman yang memberi tahu agen peminta untuk menulis ulang dengan suara asisten normal (bukan meneruskan metadata internal mentah).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` dan `--thinking` menimpa default untuk eksekusi spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
    - `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengiklankan runtime tersebut. Lihat [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agen-ke-agen. Ketika Plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya memilih `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak berada dalam sandbox, dan Plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native mulai secara terisolasi kecuali pemanggil secara eksplisit meminta untuk melakukan fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat yang lambat, atau apa pun yang dapat dijelaskan secara singkat dalam teks tugas                           | Membuat transkrip anak yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Membuat cabang transkrip peminta ke dalam sesi anak sebelum anak dimulai. |

Gunakan `fork` seperlunya. Ini ditujukan untuk delegasi yang sensitif terhadap konteks, bukan
pengganti untuk menulis prompt tugas yang jelas.

## Alat: `sessions_spawn`

Memulai eksekusi sub-agen dengan `deliver: false` pada lane `subagent` global,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke channel
chat peminta.

Ketersediaan bergantung pada kebijakan alat efektif pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara default. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agen yang harus mendelegasikan
pekerjaan. Kebijakan channel/grup, penyedia, sandbox, dan allow/deny per-agen masih dapat
menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per-agen); `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per-agen); `sessions_spawn.thinking` eksplisit tetap menang.
- **Timeout eksekusi:** jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` saat ditetapkan; jika tidak, OpenClaw kembali ke `0` (tanpa timeout).

### Mode prompt delegasi

`agents.defaults.subagents.delegationMode` hanya mengontrol panduan prompt; ini tidak mengubah kebijakan alat atau memberlakukan delegasi.

- `suggest` (default): pertahankan dorongan prompt standar untuk menggunakan sub-agen bagi pekerjaan yang lebih besar atau lebih lambat.
- `prefer`: beri tahu agen utama agar tetap responsif dan mendelegasikan apa pun yang lebih kompleks daripada balasan langsung melalui `sessions_spawn`.

Override per-agen menggunakan `agents.list[].subagents.delegationMode`.

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
  Handle stabil opsional untuk penargetan `subagents` nanti. Harus cocok dengan `[a-z][a-z0-9_]{0,63}` dan tidak boleh berupa target yang dicadangkan seperti `last` atau `all`. Lebih disukai ketika koordinator mungkin perlu mengarahkan, menghentikan, atau mengidentifikasi child tertentu setelah membuat beberapa child.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang mudah dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Buat di bawah id agen lain ketika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Hanya ACP. Melanjutkan sesi harness ACP yang sudah ada ketika `runtime: "acp"`; diabaikan untuk pembuatan sub-agen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Hanya ACP. Mengalirkan keluaran eksekusi ACP ke sesi induk ketika `runtime: "acp"`; hilangkan untuk pembuatan sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Timpa model sub-agen. Nilai yang tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan di hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Timpa level thinking untuk eksekusi sub-agen.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default ke `agents.defaults.subagents.runTimeoutSeconds` ketika disetel, jika tidak `0`. Ketika disetel, eksekusi sub-agen dibatalkan setelah N detik.
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
  `require` menolak pembuatan kecuali runtime child target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip saat ini milik peminta ke sesi child. Hanya sub-agen native. Pembuatan yang terikat thread default ke `fork`; pembuatan non-thread default ke `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman kanal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan
`message`/`sessions_send` dari eksekusi yang dibuat.
</Warning>

### Nama tugas dan penargetan

`taskName` adalah handle yang dihadapkan ke model untuk orkestrasi, bukan kunci sesi.
Gunakan untuk nama child yang stabil seperti `review_subagents`,
`linux_validation`, atau `docs_update` ketika koordinator mungkin perlu mengarahkan
atau menghentikan child tersebut nanti.

Resolusi target menerima kecocokan `taskName` yang tepat dan prefiks yang tidak ambigu. Pencocokan dibatasi pada jendela target aktif/terbaru yang sama yang digunakan
oleh target `/subagents` bernomor, sehingga child lama yang sudah selesai tidak membuat
handle yang digunakan ulang menjadi ambigu. Jika dua child aktif atau terbaru berbagi
`taskName` yang sama, target menjadi ambigu; gunakan indeks daftar, kunci sesi, atau
id eksekusi sebagai gantinya.

Target yang dicadangkan `last` dan `all` bukan nilai `taskName` yang valid
karena keduanya sudah memiliki makna kontrol.

## Alat: `sessions_yield`

Mengakhiri giliran model saat ini dan menunggu event runtime, terutama
event penyelesaian sub-agen, datang sebagai pesan berikutnya. Gunakan setelah
membuat pekerjaan child yang diperlukan ketika peminta tidak dapat menghasilkan
jawaban akhir sampai penyelesaian tersebut tiba.

`sessions_yield` adalah primitif untuk menunggu. Jangan menggantinya dengan loop polling
atas `subagents`, `sessions_list`, `sessions_history`, `sleep` shell, atau polling proses
hanya untuk mendeteksi penyelesaian child.

Gunakan `sessions_yield` hanya ketika daftar alat efektif sesi menyertakannya.
Beberapa profil alat minimal atau kustom mungkin mengekspos `sessions_spawn` dan
`subagents` tanpa mengekspos `sessions_yield`; dalam kasus itu, jangan membuat
loop polling hanya untuk menunggu penyelesaian.

Ketika child aktif ada, OpenClaw menyuntikkan blok prompt ringkas yang dihasilkan runtime
`Active Subagents` ke giliran normal sehingga peminta dapat melihat
sesi child saat ini, id eksekusi, status, label, tugas, dan
alias `taskName` tanpa polling. Field tugas dan label dalam
blok tersebut dikutip sebagai data, bukan instruksi, karena dapat berasal
dari argumen pembuatan yang diberikan pengguna/model.

## Alat: `subagents`

Mencantumkan, mengarahkan, atau menghentikan eksekusi sub-agen yang dibuat dan dimiliki oleh sesi peminta.
Cakupannya dibatasi ke peminta saat ini; child hanya dapat
melihat/mengontrol child yang dikendalikannya sendiri.

Gunakan `subagents` untuk status sesuai permintaan, debugging, pengarahan, atau penghentian.
Gunakan `sessions_yield` untuk menunggu event penyelesaian.

## Sesi terikat thread

Ketika pengikatan thread diaktifkan untuk suatu kanal, sub-agen dapat tetap terikat
ke thread sehingga pesan pengguna lanjutan di thread tersebut tetap diarahkan ke
sesi sub-agen yang sama.

### Kanal yang mendukung thread

**Discord** saat ini adalah satu-satunya kanal yang didukung. Kanal ini mendukung
sesi subagent terikat thread yang persisten (`sessions_spawn` dengan
`thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), dan kunci adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, dan
`channels.discord.threadBindings.spawnSessions`.

### Alur cepat

<Steps>
  <Step title="Buat">
    `sessions_spawn` dengan `thread: true` (dan opsional `mode: "session"`).
  </Step>
  <Step title="Ikat">
    OpenClaw membuat atau mengikat thread ke target sesi tersebut di kanal aktif.
  </Step>
  <Step title="Arahkan tindak lanjut">
    Balasan dan pesan lanjutan di thread tersebut diarahkan ke sesi yang terikat.
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

| Perintah           | Efek                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ikat thread saat ini (atau buat satu) ke target sub-agen/sesi         |
| `/unfocus`         | Hapus pengikatan untuk thread terikat saat ini                        |
| `/agents`          | Cantumkan eksekusi aktif dan status pengikatan (`thread:<id>` atau `unbound`) |
| `/session idle`    | Periksa/perbarui auto-unfocus idle (hanya thread terikat yang fokus)  |
| `/session max-age` | Periksa/perbarui batas keras (hanya thread terikat yang fokus)        |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Override kanal dan kunci auto-bind pembuatan** bersifat khusus adapter. Lihat [Kanal yang mendukung thread](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan apa saja). Default: hanya agen peminta. Jika Anda menyetel daftar dan tetap ingin peminta membuat dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist agen target default yang digunakan ketika agen peminta tidak menyetel `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Override per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout per panggilan untuk upaya pengiriman pengumuman `agent` Gateway. Nilai adalah milidetik bilangan bulat positif dan dibatasi ke maksimum timer yang aman untuk platform. Retry sementara dapat membuat total waktu tunggu pengumuman lebih lama dari satu timeout yang dikonfigurasi.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Discovery

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif setiap agen yang tercantum
dan metadata runtime tertanam sehingga pemanggil dapat membedakan Pi, Codex
app-server, dan runtime native terkonfigurasi lainnya.

### Auto-archive

- Sesi sub-agen otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui rename).
- Auto-archive bersifat best-effort; timer yang tertunda hilang jika Gateway dimulai ulang.
- `runTimeoutSeconds` **tidak** melakukan auto-archive; hanya menghentikan eksekusi. Sesi tetap ada sampai auto-archive.
- Auto-archive berlaku sama untuk sesi depth-1 dan depth-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup secara best-effort ketika eksekusi selesai, meskipun catatan transkrip/sesi tetap disimpan.

## Sub-agen bersarang

Secara default, sub-agen tidak dapat membuat sub-agennya sendiri
(`maxSpawnDepth: 1`). Setel `maxSpawnDepth: 2` untuk mengaktifkan satu level
penyarangan — **pola orkestrator**: main → sub-agen orkestrator →
sub-sub-agen worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Level depth

| Depth | Bentuk kunci sesi                            | Peran                                         | Dapat membuat?              |
| ----- | -------------------------------------------- | --------------------------------------------- | --------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                      |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agen (orkestrator ketika depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agen (worker leaf)                    | Tidak pernah                |

### Rantai pengumuman

Hasil mengalir kembali ke atas rantai:

1. Worker depth-2 selesai → mengumumkan ke induknya (orkestrator depth-1).
2. Orkestrator depth-1 menerima pengumuman, menyintesis hasil, selesai → mengumumkan ke main.
3. Agen utama menerima pengumuman dan menyampaikannya kepada pengguna.

Setiap level hanya melihat pengumuman dari child langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak sekali dan tunggu
event penyelesaian alih-alih membangun loop polling di sekitar
`sessions_list`, `sessions_history`, `/subagents list`, atau perintah
`sleep` `exec`. `sessions_list` dan `/subagents list` menjaga hubungan
sesi anak tetap berfokus pada pekerjaan live — anak live tetap terpasang,
anak yang berakhir tetap terlihat selama jendela terbaru singkat, dan
tautan anak lama yang hanya ada di store diabaikan setelah jendela
kesegarannya. Ini mencegah metadata `spawnedBy` / `parentSessionKey`
lama menghidupkan kembali anak semu setelah restart. Jika event
penyelesaian anak tiba setelah Anda sudah mengirim jawaban akhir,
tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan tool berdasarkan kedalaman

- Peran dan cakupan kontrol ditulis ke metadata sesi saat spawn. Itu mencegah key sesi datar atau yang dipulihkan secara tidak sengaja memperoleh kembali hak istimewa orkestrator.
- **Kedalaman 1 (orkestrator, ketika `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat mengelola anaknya. Tool sesi/sistem lain tetap ditolak.
- **Kedalaman 1 (leaf, ketika `maxSpawnDepth == 1`):** tidak ada tool sesi (perilaku default saat ini).
- **Kedalaman 2 (pekerja leaf):** tidak ada tool sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat men-spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki paling banyak
`maxChildrenPerAgent` (default `5`) anak aktif sekaligus. Ini mencegah
fan-out tak terkendali dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator kedalaman-1 secara otomatis menghentikan semua
anak kedalaman-2 miliknya:

- `/stop` di chat utama menghentikan semua agen kedalaman-1 dan berantai ke anak kedalaman-2 mereka.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anaknya.
- `/subagents kill all` menghentikan semua sub-agen untuk peminta dan berantai.

## Autentikasi

Auth sub-agen diselesaikan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Key sesi sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Store auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen menimpa profil utama saat terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia
sebagai fallback. Auth yang sepenuhnya terisolasi per agen belum
didukung.

## Pengumuman

Sub-agen melapor kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, output pengumuman disupresi meskipun sebelumnya ada progres yang terlihat.

Pengiriman bergantung pada kedalaman peminta:

- Sesi peminta tingkat atas menggunakan panggilan lanjutan `agent` dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bersarang menerima injeksi lanjutan internal (`deliver=false`) sehingga orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagen peminta bersarang sudah hilang, OpenClaw fallback ke peminta sesi tersebut saat tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian
terlebih dahulu menyelesaikan route percakapan/thread yang terikat dan
override hook apa pun, lalu mengisi field target channel yang hilang dari
route tersimpan sesi peminta. Itu menjaga penyelesaian tetap berada di
chat/topik yang tepat bahkan ketika asal penyelesaian hanya mengidentifikasi
channel.

Agregasi penyelesaian anak dicakup ke run peminta saat ini ketika
membangun temuan penyelesaian bersarang, mencegah output anak dari run
sebelumnya yang basi bocor ke pengumuman saat ini. Balasan pengumuman
mempertahankan routing thread/topik saat tersedia pada adapter channel.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok event internal yang stabil:

| Field          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                        |
| Id sesi        | Key/id sesi anak                                                                                              |
| Jenis          | Jenis pengumuman + label tugas                                                                                |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Konten hasil   | Teks asisten terlihat terbaru, jika tidak ada teks tool/toolResult terbaru yang telah disanitasi              |
| Tindak lanjut  | Instruksi yang menjelaskan kapan harus membalas vs tetap senyap                                               |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang
teks balasan yang ditangkap. Saat timeout, jika anak hanya sempat melalui
panggilan tool, pengumuman dapat meringkas riwayat itu menjadi ringkasan
progres parsial singkat alih-alih memutar ulang output tool mentah.

### Baris statistik

Payload pengumuman menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (mis. `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Estimasi biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan path transkrip sehingga agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal hanya dimaksudkan untuk orkestrasi; balasan yang
menghadap pengguna harus ditulis ulang dengan suara asisten normal.

### Mengapa memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Ingatan asisten dinormalisasi terlebih dahulu: tag berpikir dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML panggilan tool teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup rapi; scaffolding panggilan/hasil tool yang diturunkan dan penanda konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII `<|...|>` lain, bentuk full-width `<｜...｜>`) dihapus; XML panggilan tool MiniMax yang malformed dihapus.
- Teks seperti kredensial/token direduksi.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat menghapus baris lama atau mengganti baris terlalu besar dengan `[sessions_history omitted: message too large]`.
- Pemeriksaan transkrip mentah di disk adalah fallback ketika Anda membutuhkan transkrip lengkap byte-for-byte.

## Kebijakan tool

Sub-agen menggunakan profil dan pipeline kebijakan tool yang sama seperti
agen induk atau target terlebih dahulu. Setelah itu, OpenClaw menerapkan
lapisan pembatasan sub-agen.

Tanpa `tools.profile` yang restriktif, sub-agen mendapatkan **semua tool
kecuali tool sesi** dan tool sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap menjadi tampilan ingatan yang terbatas dan
tersanitasi di sini juga — bukan dump transkrip mentah.

Ketika `maxSpawnDepth >= 2`, sub-agen orkestrator kedalaman-1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` agar dapat mengelola anak mereka.

### Override melalui config

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

`tools.subagents.tools.allow` adalah filter allow-only final. Ini dapat
mempersempit set tool yang sudah diselesaikan, tetapi tidak dapat
**menambahkan kembali** tool yang dihapus oleh `tools.profile`. Misalnya,
`tools.profile: "coding"` menyertakan `web_search`/`web_fetch` tetapi
bukan tool `browser`. Untuk mengizinkan sub-agen profil coding menggunakan
otomasi browser, tambahkan browser pada tahap profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gunakan `agents.list[].tools.alsoAllow: ["browser"]` per agen ketika hanya
satu agen yang harus mendapatkan otomasi browser.

## Konkurensi

Sub-agen menggunakan lane antrean dalam-proses khusus:

- **Nama lane:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Liveness dan pemulihan

OpenClaw tidak memperlakukan ketiadaan `endedAt` sebagai bukti permanen
bahwa sub-agen masih hidup. Run yang belum berakhir dan lebih lama dari
jendela run basi berhenti dihitung sebagai aktif/tertunda di
`/subagents list`, ringkasan status, gating penyelesaian turunan, dan
pemeriksaan konkurensi per sesi.

Setelah restart gateway, run yang dipulihkan dan belum berakhir yang
basi dipangkas kecuali sesi anaknya ditandai `abortedLastRun: true`.
Sesi anak yang dibatalkan oleh restart tersebut tetap dapat dipulihkan
melalui alur pemulihan orphan sub-agen, yang mengirim pesan resume
sintetis sebelum menghapus penanda dibatalkan.

Pemulihan restart otomatis dibatasi per sesi anak. Jika anak sub-agen
yang sama diterima untuk pemulihan orphan berulang kali di dalam jendela
rapid re-wedge, OpenClaw mempertahankan tombstone pemulihan pada sesi itu
dan berhenti melakukan auto-resume pada restart berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas,
atau `openclaw doctor --fix` untuk menghapus flag pemulihan dibatalkan
yang basi pada sesi bertombstone.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit state pairing.
Koordinasi internal `sessions_spawn` harus terhubung sebagai
`client.id: "gateway-client"` dengan `client.mode: "backend"` melalui
auth direct loopback shared-token/password; jalur itu tidak bergantung
pada baseline cakupan perangkat-terpasang CLI. Pemanggil remote,
`deviceIdentity` eksplisit, jalur device-token eksplisit, dan klien
browser/node tetap membutuhkan persetujuan perangkat normal untuk
upgrade cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan run sub-agen aktif apa pun yang di-spawn darinya, berantai ke anak bersarang.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke anaknya.

## Batasan

- Pengumuman sub-agen bersifat **best-effort**. Jika gateway restart, pekerjaan "umumkan balik" yang tertunda hilang.
- Sub-agen masih berbagi resource proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: ia langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` dan `USER.md` (tanpa `MEMORY.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman bersarang maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Kirim agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Tool sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
