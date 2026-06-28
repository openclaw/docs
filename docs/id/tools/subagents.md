---
read_when:
    - Anda menginginkan pekerjaan latar belakang atau paralel melalui agen
    - Anda mengubah kebijakan alat sessions_spawn atau sub-agent
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat thread
sidebarTitle: Sub-agents
summary: Jalankan agen latar belakang terisolasi yang mengumumkan hasil kembali ke chat peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-06-28T00:13:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agent adalah proses agent latar belakang yang dimunculkan dari proses agent yang sudah ada.
Mereka berjalan dalam sesi sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
ketika selesai, **mengumumkan** hasilnya kembali ke channel chat peminta.
Setiap proses sub-agent dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / tool lambat" tanpa memblokir proses utama.
- Menjaga sub-agent tetap terisolasi secara default (pemisahan sesi + sandboxing opsional).
- Menjaga permukaan tool sulit disalahgunakan: sub-agent **tidak** mendapatkan tool sesi secara default.
- Mendukung kedalaman penyarangan yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agent memiliki konteks dan penggunaan tokennya sendiri secara
default. Untuk tugas berat atau repetitif, tetapkan model yang lebih murah untuk sub-agent
dan pertahankan agent utama Anda pada model berkualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per-agent. Saat child
    benar-benar membutuhkan transkrip peminta saat ini, agent dapat meminta
    `context: "fork"` pada satu spawn tersebut. Sesi subagent yang terikat thread secara default
    menggunakan `context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini ke
    thread tindak lanjut.
</Note>

## Perintah slash

Gunakan `/subagents` untuk memeriksa proses sub-agent untuk **sesi saat ini**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` menampilkan metadata proses (status, timestamp, id sesi,
path transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan pemanggilan kembali
terbatas dan terfilter keamanan; periksa path transkrip di disk saat Anda
membutuhkan transkrip lengkap mentah.

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

Agent memulai sub-agent latar belakang dengan `sessions_spawn`. Penyelesaian sub-agent
kembali sebagai peristiwa sesi induk internal; agent induk/peminta memutuskan
apakah pembaruan yang terlihat pengguna diperlukan.

<AccordionGroup>
  <Accordion title="Penyelesaian non-pemblokiran berbasis push">
    - `sessions_spawn` bersifat non-pemblokiran; ini langsung mengembalikan id proses.
    - Saat selesai, sub-agent melapor kembali ke sesi induk/peminta.
    - Giliran agent yang membutuhkan hasil child harus memanggil `sessions_yield` setelah memunculkan pekerjaan yang diperlukan. Ini mengakhiri giliran saat ini dan memungkinkan peristiwa penyelesaian tiba sebagai pesan berikutnya yang terlihat model.
    - Penyelesaian berbasis push. Setelah dimunculkan, jangan melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai permintaan untuk visibilitas debugging.
    - Output child adalah laporan/bukti untuk disintesis oleh agent peminta. Itu bukan teks instruksi yang ditulis pengguna dan tidak dapat menimpa kebijakan sistem, developer, atau pengguna.
    - Saat selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agent tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Pengiriman penyelesaian">
    - OpenClaw menyerahkan penyelesaian kembali ke sesi peminta melalui giliran `agent` dengan kunci idempotensi stabil.
    - Jika proses peminta masih aktif, OpenClaw terlebih dahulu mencoba membangunkan/mengarahkan proses tersebut alih-alih memulai jalur balasan terlihat kedua.
    - Jika peminta aktif tidak dapat dibangunkan, OpenClaw beralih ke handoff agent-peminta dengan konteks penyelesaian yang sama alih-alih membuang pengumuman.
    - Handoff induk yang berhasil menyelesaikan pengiriman sub-agent bahkan saat induk memutuskan tidak diperlukan pembaruan yang terlihat pengguna.
    - Sub-agent native tidak mendapatkan tool pesan. Mereka mengembalikan teks assistant biasa ke agent induk/peminta; balasan yang terlihat manusia dimiliki oleh kebijakan pengiriman normal agent induk/peminta.
    - Jika handoff langsung tidak dapat digunakan, proses beralih ke perutean antrean.
    - Jika perutean antrean masih tidak tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang diselesaikan: rute penyelesaian terikat thread atau terikat percakapan menang saat tersedia; jika asal penyelesaian hanya menyediakan channel, OpenClaw mengisi target/akun yang hilang dari rute terselesaikan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata handoff penyelesaian">
    Handoff penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terlihat terbaru dari child. Output tool/toolResult tidak dipromosikan ke hasil child. Proses gagal terminal tidak menggunakan ulang teks balasan yang ditangkap.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token yang ringkas.
    - Instruksi review yang memberi tahu agent peminta untuk memverifikasi hasil sebelum memutuskan apakah tugas asli sudah selesai.
    - Panduan tindak lanjut yang memberi tahu agent peminta untuk melanjutkan tugas atau mencatat tindak lanjut saat hasil child menyisakan tindakan lanjutan.
    - Instruksi pembaruan akhir untuk jalur tanpa tindakan lanjutan, ditulis dengan suara assistant normal tanpa meneruskan metadata internal mentah.

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` menimpa default untuk proses spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
    - Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Jika channel peminta tidak mendukung pengikatan thread, gunakan `mode: "run"` alih-alih mencoba ulang kombinasi terikat thread yang mustahil.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` saat tool mengiklankan runtime tersebut. Lihat [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agent-ke-agent. Saat plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya memilih `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak di-sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agent default untuk agent konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agent native dimulai terisolasi kecuali pemanggil secara eksplisit meminta fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan tool lambat, atau apa pun yang dapat dijelaskan singkat dalam teks tugas                           | Membuat transkrip child yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil tool sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi child sebelum child dimulai. |

Gunakan `fork` seperlunya. Ini untuk delegasi peka konteks, bukan
pengganti penulisan prompt tugas yang jelas.

## Tool: `sessions_spawn`

Memulai proses sub-agent dengan `deliver: false` pada lane `subagent` global,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke channel
chat peminta.

Ketersediaan bergantung pada kebijakan tool efektif pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara default. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agent yang harus mendelegasikan
pekerjaan. Kebijakan allow/deny channel/grup, provider, sandbox, dan per-agent masih dapat
menghapus tool setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar tool efektif.

**Default:**

- **Model:** sub-agent native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per-agent). Spawn runtime ACP menggunakan model subagent terkonfigurasi yang sama saat ada; jika tidak, harness ACP mempertahankan defaultnya sendiri. `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** sub-agent native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per-agent). Spawn runtime ACP juga menerapkan `agents.defaults.models["provider/model"].params.thinking` untuk model yang dipilih. `sessions_spawn.thinking` eksplisit tetap menang.
- **Timeout proses:** OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` saat ditetapkan; jika tidak, OpenClaw beralih ke `0` (tanpa timeout). `sessions_spawn` tidak menerima override timeout per-panggilan.
- **Pengiriman tugas:** sub-agent native menerima tugas yang didelegasikan dalam pesan `[Subagent Task]` pertama yang terlihat. Prompt sistem sub-agent membawa aturan runtime dan konteks perutean, bukan duplikat tersembunyi dari tugas tersebut.

Spawn sub-agent native yang diterima menyertakan metadata model child yang diselesaikan dalam
hasil tool: `resolvedModel` berisi ref model yang diterapkan dan
`resolvedProvider` berisi prefiks provider saat ref memilikinya.

### Mode prompt delegasi

`agents.defaults.subagents.delegationMode` hanya mengontrol panduan prompt; ini tidak mengubah kebijakan tool atau menegakkan delegasi.

- `suggest` (default): pertahankan dorongan prompt standar untuk menggunakan sub-agent untuk pekerjaan yang lebih besar atau lebih lambat.
- `prefer`: beri tahu agent utama untuk tetap responsif dan mendelegasikan apa pun yang lebih terlibat daripada balasan langsung melalui `sessions_spawn`.

Override per-agent menggunakan `agents.list[].subagents.delegationMode`.

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

### Parameter tool

<ParamField path="task" type="string" required>
  Deskripsi tugas untuk sub-agen.
</ParamField>
<ParamField path="taskName" type="string">
  Handle stabil opsional untuk mengidentifikasi anak tertentu dalam output status berikutnya. Harus cocok dengan `[a-z][a-z0-9_-]{0,63}` dan tidak boleh berupa target tercadangkan seperti `last` atau `all`.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang dapat dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn di bawah id agen lain yang dikonfigurasi saat diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja tugas opsional untuk run anak. Sub-agen native tetap memuat file bootstrap dari ruang kerja agen target; `cwd` hanya mengubah tempat alat runtime dan harness CLI melakukan pekerjaan yang didelegasikan.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang sudah ada saat `runtime: "acp"`; diabaikan untuk spawn sub-agen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Mengalirkan output run ACP ke sesi induk saat `runtime: "acp"`; hilangkan untuk spawn sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Menimpa model sub-agen. Nilai tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan di hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Menimpa level berpikir untuk run sub-agen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Saat `true`, meminta pengikatan utas kanal untuk sesi sub-agen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
  Jika pengikatan utas tidak tersedia untuk kanal peminta, gunakan `mode: "run"` sebagai gantinya.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` mengarsipkan segera setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak spawn kecuali runtime anak target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke sesi anak. Hanya sub-agen native. Spawn yang terikat utas default ke `fork`; spawn non-utas default ke `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman kanal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Sub-agen native melaporkan
giliran asisten terbaru mereka kembali ke peminta; pengiriman eksternal tetap
pada agen induk/peminta.
</Warning>

### Nama tugas dan penargetan

`taskName` adalah handle yang menghadap model untuk orkestrasi, bukan kunci sesi.
Gunakan untuk nama anak yang stabil seperti `review_subagents`,
`linux_validation`, atau `docs_update` saat koordinator mungkin perlu memeriksa
anak tersebut nanti.

Resolusi target menerima kecocokan `taskName` persis dan prefiks yang tidak ambigu.
Pencocokan dibatasi ke jendela target aktif/terbaru yang sama seperti yang digunakan
oleh target `/subagents` bernomor, sehingga anak selesai yang sudah usang tidak membuat
handle yang digunakan ulang menjadi ambigu. Jika dua anak aktif atau terbaru berbagi
`taskName` yang sama, target menjadi ambigu; gunakan indeks daftar, kunci sesi, atau
id run sebagai gantinya.

Target tercadangkan `last` dan `all` bukan nilai `taskName` yang valid
karena sudah memiliki makna kontrol.

## Alat: `sessions_yield`

Mengakhiri giliran model saat ini dan menunggu event runtime, terutama
event penyelesaian sub-agen, tiba sebagai pesan berikutnya. Gunakan setelah
melakukan spawn pekerjaan anak yang diperlukan saat peminta tidak dapat membuat
jawaban akhir sampai penyelesaian tersebut tiba.

`sessions_yield` adalah primitif penunggu. Jangan menggantinya dengan loop polling
atas `subagents`, `sessions_list`, `sessions_history`, shell
`sleep`, atau polling proses hanya untuk mendeteksi penyelesaian anak.

Hanya gunakan `sessions_yield` saat daftar alat efektif sesi menyertakannya.
Beberapa profil alat minimal atau kustom mungkin mengekspos `sessions_spawn` dan
`subagents` tanpa mengekspos `sessions_yield`; dalam kasus itu, jangan menciptakan
loop polling hanya untuk menunggu penyelesaian.

Saat ada anak aktif, OpenClaw menyuntikkan blok prompt `Active Subagents` ringkas
yang dibuat runtime ke dalam giliran normal sehingga peminta dapat melihat
sesi anak saat ini, id run, status, label, tugas, dan alias `taskName`
tanpa polling. Field tugas dan label dalam blok tersebut dikutip sebagai data,
bukan instruksi, karena dapat berasal dari argumen spawn yang disediakan
pengguna/model.

## Alat: `subagents`

Mencantumkan run sub-agen yang di-spawn dan dimiliki oleh sesi peminta. Cakupannya
dibatasi ke peminta saat ini; anak hanya dapat melihat anak yang dikontrolnya sendiri.

Gunakan `subagents` untuk status sesuai permintaan dan debugging. Gunakan `sessions_yield` untuk
menunggu event penyelesaian.

## Sesi terikat utas

Saat pengikatan utas diaktifkan untuk sebuah kanal, sub-agen dapat tetap terikat
ke sebuah utas sehingga pesan lanjutan pengguna dalam utas tersebut tetap diarahkan ke
sesi sub-agen yang sama.

### Kanal yang mendukung utas

Kanal apa pun dengan adapter pengikatan sesi dapat mendukung sesi subagen persisten
yang terikat utas (`sessions_spawn` dengan `thread: true`).
Adapter bawaan saat ini mencakup utas Discord, utas Matrix,
topik forum Telegram, dan pengikatan percakapan saat ini untuk Feishu.
Gunakan kunci config `threadBindings` per kanal untuk pengaktifan,
timeout, dan `spawnSessions`.

### Alur cepat

<Steps>
  <Step title="Spawn">
    `sessions_spawn` dengan `thread: true` (dan opsional `mode: "session"`).
  </Step>
  <Step title="Ikat">
    OpenClaw membuat atau mengikat utas ke target sesi tersebut di kanal aktif.
  </Step>
  <Step title="Arahkan tindak lanjut">
    Balasan dan pesan lanjutan dalam utas tersebut diarahkan ke sesi terikat.
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

| Perintah           | Efek                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ikat utas saat ini (atau buat utas) ke target sub-agen/sesi           |
| `/unfocus`         | Hapus pengikatan untuk utas terikat saat ini                          |
| `/agents`          | Cantumkan run aktif dan status pengikatan (`thread:<id>` atau `unbound`) |
| `/session idle`    | Periksa/perbarui auto-unfocus idle (hanya utas terikat yang difokuskan) |
| `/session max-age` | Periksa/perbarui batas keras (hanya utas terikat yang difokuskan)     |

### Sakelar config

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kunci override kanal dan auto-bind spawn** bersifat khusus adapter. Lihat [Kanal yang mendukung utas](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen terkonfigurasi yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan target terkonfigurasi apa pun). Default: hanya agen peminta. Jika Anda menetapkan daftar dan tetap ingin peminta melakukan spawn dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist target-agen terkonfigurasi default yang digunakan saat agen peminta tidak menetapkan `subagents.allowAgents` sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Override per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout per panggilan untuk upaya pengiriman pengumuman Gateway `agent`. Nilai berupa milidetik bilangan bulat positif dan dibatasi ke maksimum timer yang aman untuk platform. Percobaan ulang sementara dapat membuat total tunggu pengumuman lebih lama daripada satu timeout terkonfigurasi.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons mencakup model efektif setiap agen yang dicantumkan
dan metadata runtime tertanam sehingga pemanggil dapat membedakan OpenClaw, Codex
app-server, dan runtime native terkonfigurasi lainnya.

Entri `allowAgents` harus menunjuk ke id agen terkonfigurasi di `agents.list[]`.
`["*"]` berarti agen target terkonfigurasi apa pun plus peminta. Jika config agen
dihapus tetapi id-nya tetap berada di `allowAgents`, `sessions_spawn` menolak id tersebut
dan `agents_list` menghilangkannya. Jalankan `openclaw doctor --fix` untuk membersihkan
entri allowlist usang, atau tambahkan entri `agents.list[]` minimal saat target harus
tetap dapat di-spawn sambil mewarisi default.

### Arsip otomatis

- Sesi sub-agen diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` mengarsipkan segera setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
- Arsip otomatis bersifat best-effort; timer tertunda hilang jika gateway dimulai ulang.
- Timeout run terkonfigurasi **tidak** mengarsipkan secara otomatis; timeout hanya menghentikan run. Sesi tetap ada sampai arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi kedalaman-1 dan kedalaman-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup secara best-effort saat run selesai, bahkan jika catatan transkrip/sesi disimpan.

## Sub-agen bersarang

Secara default, sub-agen tidak dapat melakukan spawn sub-agennya sendiri
(`maxSpawnDepth: 1`). Tetapkan `maxSpawnDepth: 2` untuk mengaktifkan satu level
penyusunan — **pola orkestrator**: utama → sub-agen orkestrator →
sub-sub-agen pekerja.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Level kedalaman

| Kedalaman | Bentuk kunci sesi                           | Peran                                         | Dapat spawn?                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agen (orkestrator saat kedalaman 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agen (pekerja leaf)                   | Tidak pernah                 |

### Rantai pengumuman

Hasil mengalir kembali ke atas rantai:

1. Worker kedalaman-2 selesai → memberi pengumuman kepada induknya (orkestrator kedalaman-1).
2. Orkestrator kedalaman-1 menerima pengumuman, menyintesis hasil, selesai → memberi pengumuman ke utama.
3. Agen utama menerima pengumuman dan menyampaikannya kepada pengguna.

Setiap level hanya melihat pengumuman dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak satu kali dan tunggu peristiwa
penyelesaian alih-alih membangun loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah sleep `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi anak tetap
berfokus pada pekerjaan live — anak live tetap terlampir, anak yang telah
berakhir tetap terlihat untuk jendela terbaru yang singkat, dan tautan anak
lama yang hanya ada di penyimpanan diabaikan setelah jendela kesegarannya.
Ini mencegah metadata `spawnedBy` / `parentSessionKey` lama membangkitkan
anak bayangan setelah restart. Jika peristiwa penyelesaian anak tiba setelah
Anda sudah mengirim jawaban final, tindak lanjut yang benar adalah token
senyap persis `NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan kedalaman

- Peran dan cakupan kontrol ditulis ke metadata sesi saat spawn. Itu mencegah kunci sesi datar atau yang dipulihkan mendapatkan kembali hak istimewa orkestrator secara tidak sengaja.
- **Kedalaman 1 (orkestrator, ketika `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat men-spawn anak dan memeriksa statusnya. Alat sesi/sistem lain tetap ditolak.
- **Kedalaman 1 (leaf, ketika `maxSpawnDepth == 1`):** tidak ada alat sesi (perilaku default saat ini).
- **Kedalaman 2 (worker leaf):** tidak ada alat sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat men-spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki maksimal
`maxChildrenPerAgent` (default `5`) anak aktif pada satu waktu. Ini mencegah
fan-out tak terkendali dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator kedalaman-1 otomatis menghentikan semua anak
kedalaman-2 miliknya:

- `/stop` di chat utama menghentikan semua agen kedalaman-1 dan berantai ke anak kedalaman-2 mereka.

## Autentikasi

Auth sub-agen diselesaikan berdasarkan **id agen**, bukan berdasarkan tipe sesi:

- Kunci sesi sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen mengesampingkan profil utama saat ada konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Pengumuman

Sub-agen melaporkan kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, output pengumuman ditekan meskipun progres yang terlihat sebelumnya ada.

Pengiriman bergantung pada kedalaman peminta:

- Sesi peminta tingkat atas menggunakan panggilan `agent` tindak lanjut dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) sehingga orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagen peminta bertingkat hilang, OpenClaw melakukan fallback ke peminta sesi tersebut saat tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian terlebih
dahulu menyelesaikan rute percakapan/thread terikat dan override hook apa pun,
lalu mengisi field channel-target yang hilang dari rute tersimpan sesi peminta.
Ini menjaga penyelesaian tetap berada di chat/topik yang benar bahkan ketika
asal penyelesaian hanya mengidentifikasi channel.

Agregasi penyelesaian anak dicakup ke run peminta saat ini saat membangun
temuan penyelesaian bertingkat, mencegah output anak dari run lama bocor ke
pengumuman saat ini. Balasan pengumuman mempertahankan routing thread/topik
saat tersedia pada adapter channel.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:

| Field          | Sumber                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                                  |
| Id sesi        | Kunci/id sesi anak                                                                                                      |
| Tipe           | Tipe pengumuman + label tugas                                                                                           |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model   |
| Konten hasil   | Teks asisten terlihat terbaru dari anak                                                                                 |
| Tindak lanjut  | Instruksi yang menjelaskan kapan harus membalas vs tetap senyap                                                         |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang teks
balasan yang ditangkap. Output tool/toolResult tidak dipromosikan menjadi teks
hasil anak.

### Baris statistik

Payload pengumuman menyertakan baris statistik di akhir (bahkan saat dibungkus):

- Runtime (mis. `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Estimasi biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan path transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal dimaksudkan hanya untuk orkestrasi; balasan yang menghadap
pengguna harus ditulis ulang dengan suara asisten normal.

### Mengapa lebih memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Recall asisten dinormalisasi terlebih dahulu: tag berpikir dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML tool-call teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup dengan bersih; scaffolding tool-call/result yang diturunkan dan marker konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII `<|...|>` lain, lebar penuh `<｜...｜>`) dihapus; XML tool-call MiniMax yang malformed dihapus.
- Teks yang menyerupai kredensial/token disunting.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat membuang baris lama atau mengganti baris terlalu besar dengan `[sessions_history omitted: message too large]`.
- Gunakan `nextOffset` saat ada untuk membuka halaman mundur melalui jendela transkrip yang lebih lama.
- Pemeriksaan transkrip mentah di disk adalah fallback saat Anda membutuhkan transkrip byte-for-byte lengkap.

## Kebijakan alat

Sub-agen menggunakan profil dan pipeline kebijakan alat yang sama seperti induk
atau agen target terlebih dahulu. Setelah itu, OpenClaw menerapkan lapisan
pembatasan sub-agen.

Tanpa `tools.profile` yang restriktif, sub-agen mendapatkan **semua alat kecuali
alat pesan, alat sesi, dan alat sistem**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` tetap menjadi tampilan recall yang dibatasi dan disanitasi
di sini juga — ini bukan dump transkrip mentah.

Ketika `maxSpawnDepth >= 2`, sub-agen orkestrator kedalaman-1 juga menerima
`sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` agar
dapat mengelola anak-anaknya.

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
mempersempit set alat yang sudah diselesaikan, tetapi tidak dapat **menambahkan
kembali** alat yang dihapus oleh `tools.profile`. Misalnya, `tools.profile:
"coding"` menyertakan `web_search`/`web_fetch` tetapi bukan alat `browser`. Untuk
mengizinkan sub-agen profil coding menggunakan otomatisasi browser, tambahkan
browser pada tahap profil:

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

Sub-agen menggunakan lane antrean in-process khusus:

- **Nama lane:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Liveness dan pemulihan

OpenClaw tidak memperlakukan ketiadaan `endedAt` sebagai bukti permanen bahwa
sub-agen masih hidup. Run yang belum berakhir dan lebih lama dari jendela
stale-run berhenti dihitung sebagai aktif/tertunda di `/subagents list`,
ringkasan status, gating penyelesaian turunan, dan pemeriksaan konkurensi per
sesi.

Setelah restart gateway, run pulihan yang stale dan belum berakhir dipangkas
kecuali sesi anaknya ditandai `abortedLastRun: true`. Sesi anak yang dibatalkan
saat restart tersebut tetap dapat dipulihkan melalui alur pemulihan orphan
sub-agen, yang mengirim pesan resume sintetis sebelum menghapus marker aborted.

Pemulihan restart otomatis dibatasi per sesi anak. Jika anak sub-agen yang sama
diterima untuk pemulihan orphan berulang kali di dalam jendela rapid re-wedge,
OpenClaw menyimpan tombstone pemulihan pada sesi itu dan berhenti
melanjutkannya otomatis pada restart berikutnya. Jalankan `openclaw tasks
maintenance --apply` untuk merekonsiliasi catatan tugas, atau `openclaw doctor
--fix` untuk menghapus flag pemulihan aborted yang stale pada sesi yang
ditombstone.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pairing.
Koordinasi internal `sessions_spawn` melakukan dispatch di dalam proses saat
pemanggil sudah berjalan di dalam konteks permintaan gateway, sehingga tidak
membuka WebSocket loopback atau bergantung pada baseline cakupan perangkat
terpasangkan CLI. Pemanggil di luar proses gateway tetap menggunakan fallback
WebSocket sebagai `client.id: "gateway-client"` dengan `client.mode: "backend"`
melalui auth token/password bersama loopback langsung. Pemanggil jarak jauh,
`deviceIdentity` eksplisit, path device-token eksplisit, dan klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan run sub-agen aktif apa pun yang di-spawn darinya, berantai ke anak bertingkat.

## Batasan

- Pengumuman sub-agen bersifat **best-effort**. Jika gateway restart, pekerjaan "announce back" yang tertunda hilang.
- Sub-agen masih berbagi resource proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: ini langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menginjeksi `AGENTS.md` dan `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`). Subagen native Codex mengikuti batas yang sama: `TOOLS.md` tetap berada dalam instruksi thread Codex yang diwariskan, sementara file persona, identitas, dan pengguna yang hanya untuk induk diinjeksi sebagai instruksi kolaborasi bercakupan turn agar anak tidak mengkloningnya.
- Kedalaman bertingkat maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Kirim agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
