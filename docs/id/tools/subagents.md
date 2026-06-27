---
read_when:
    - Anda ingin pekerjaan latar belakang atau paralel melalui agen
    - Anda mengubah kebijakan sessions_spawn atau alat sub-agent
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat pada utas.
sidebarTitle: Sub-agents
summary: Mulai proses agen latar belakang terisolasi yang mengumumkan hasil kembali ke obrolan peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-06-27T18:21:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agent adalah proses agent latar belakang yang dibuat dari proses agent yang sudah ada.
Mereka berjalan dalam sesi sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke kanal chat
peminta. Setiap proses sub-agent dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / tool lambat" tanpa memblokir proses utama.
- Menjaga sub-agent tetap terisolasi secara default (pemisahan sesi + sandboxing opsional).
- Menjaga permukaan tool sulit disalahgunakan: sub-agent **tidak** mendapatkan tool sesi secara default.
- Mendukung kedalaman bersarang yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agent memiliki konteks dan penggunaan token sendiri secara
default. Untuk tugas berat atau berulang, tetapkan model yang lebih murah untuk sub-agent
dan pertahankan agent utama Anda pada model berkualitas lebih tinggi. Konfigurasikan melalui
`agents.defaults.subagents.model` atau override per-agent. Ketika child
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
jalur transkrip, pembersihan). Gunakan `sessions_history` untuk tampilan ingatan
terbatas yang difilter demi keamanan; periksa jalur transkrip di disk saat Anda
membutuhkan transkrip lengkap mentah.

### Kontrol pengikatan thread

Perintah ini berfungsi pada kanal yang mendukung pengikatan thread persisten.
Lihat [Kanal yang mendukung thread](#thread-supporting-channels) di bawah.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Perilaku spawn

Agent memulai sub-agent latar belakang dengan `sessions_spawn`. Penyelesaian sub-agent
kembali sebagai event sesi induk internal; agent induk/peminta memutuskan
apakah pembaruan yang terlihat pengguna diperlukan.

<AccordionGroup>
  <Accordion title="Penyelesaian berbasis push dan tidak memblokir">
    - `sessions_spawn` tidak memblokir; perintah ini segera mengembalikan id proses.
    - Saat selesai, sub-agent melapor kembali ke sesi induk/peminta.
    - Giliran agent yang membutuhkan hasil child harus memanggil `sessions_yield` setelah membuat pekerjaan yang diperlukan. Ini mengakhiri giliran saat ini dan memungkinkan event penyelesaian tiba sebagai pesan berikutnya yang terlihat oleh model.
    - Penyelesaian berbasis push. Setelah dibuat, **jangan** melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu selesai; periksa status hanya sesuai kebutuhan untuk visibilitas debugging.
    - Output child adalah laporan/bukti untuk disintesis oleh agent peminta. Itu bukan teks instruksi yang ditulis pengguna dan tidak dapat menimpa kebijakan sistem, developer, atau pengguna.
    - Saat selesai, OpenClaw dengan upaya terbaik menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agent tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Pengiriman penyelesaian">
    - OpenClaw menyerahkan penyelesaian kembali ke sesi peminta melalui giliran `agent` dengan kunci idempotensi stabil.
    - Jika proses peminta masih aktif, OpenClaw terlebih dahulu mencoba membangunkan/mengarahkan proses tersebut alih-alih memulai jalur balasan terlihat kedua.
    - Jika peminta aktif tidak dapat dibangunkan, OpenClaw beralih ke handoff agent-peminta dengan konteks penyelesaian yang sama alih-alih menjatuhkan pengumuman.
    - Handoff induk yang berhasil menyelesaikan pengiriman sub-agent meskipun induk memutuskan bahwa tidak diperlukan pembaruan pengguna yang terlihat.
    - Sub-agent native tidak mendapatkan tool pesan. Mereka mengembalikan teks assistant biasa ke agent induk/peminta; balasan yang terlihat manusia dimiliki oleh kebijakan pengiriman normal agent induk/peminta.
    - Jika handoff langsung tidak dapat digunakan, proses beralih ke routing antrean.
    - Jika routing antrean masih tidak tersedia, pengumuman dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
    - Pengiriman penyelesaian mempertahankan rute peminta yang terselesaikan: rute penyelesaian yang terikat thread atau terikat percakapan menang saat tersedia; jika asal penyelesaian hanya menyediakan kanal, OpenClaw mengisi target/akun yang hilang dari rute terselesaikan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata handoff penyelesaian">
    Handoff penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terlihat terbaru dari child. Output tool/toolResult tidak dipromosikan menjadi hasil child. Proses gagal terminal tidak menggunakan ulang teks balasan yang tertangkap.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token ringkas.
    - Instruksi review yang meminta agent peminta memverifikasi hasil sebelum memutuskan apakah tugas asli selesai.
    - Panduan tindak lanjut yang meminta agent peminta melanjutkan tugas atau mencatat tindak lanjut ketika hasil child menyisakan aksi tambahan.
    - Instruksi pembaruan akhir untuk jalur tanpa aksi tambahan, ditulis dengan suara assistant normal tanpa meneruskan metadata internal mentah.

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` mengoverride default untuk proses spesifik tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
    - Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Jika kanal peminta tidak mendukung pengikatan thread, gunakan `mode: "run"` alih-alih mencoba ulang kombinasi terikat thread yang mustahil.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` saat tool mengiklankan runtime tersebut. Lihat [Model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agent-ke-agent. Saat plugin `codex` diaktifkan, kontrol chat/thread Codex sebaiknya menggunakan `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak di-sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agent default untuk agent konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agent native dimulai secara terisolasi kecuali pemanggil secara eksplisit meminta untuk mem-fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan tool lambat, atau apa pun yang dapat dijelaskan secara singkat dalam teks tugas                           | Membuat transkrip child yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil tool sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi child sebelum child dimulai. |

Gunakan `fork` secukupnya. Ini untuk delegasi yang sensitif terhadap konteks, bukan
pengganti penulisan prompt tugas yang jelas.

## Tool: `sessions_spawn`

Memulai proses sub-agent dengan `deliver: false` pada lane `subagent` global,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke kanal
chat peminta.

Ketersediaan bergantung pada kebijakan tool efektif pemanggil. Profil `coding` dan
`full` mengekspos `sessions_spawn` secara default. Profil `messaging`
tidak; tambahkan `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` atau gunakan `tools.profile: "coding"` untuk agent yang harus mendelegasikan
pekerjaan. Kanal/grup, provider, sandbox, dan kebijakan allow/deny per-agent masih dapat
menghapus tool setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar tool efektif.

**Default:**

- **Model:** sub-agent native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per-agent). Spawn runtime ACP menggunakan model subagent terkonfigurasi yang sama saat tersedia; jika tidak, harness ACP mempertahankan default-nya sendiri. `sessions_spawn.model` eksplisit tetap menang.
- **Thinking:** sub-agent native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per-agent). Spawn runtime ACP juga menerapkan `agents.defaults.models["provider/model"].params.thinking` untuk model yang dipilih. `sessions_spawn.thinking` eksplisit tetap menang.
- **Timeout proses:** OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` saat disetel; jika tidak, fallback ke `0` (tanpa timeout). `sessions_spawn` tidak menerima override timeout per-panggilan.
- **Pengiriman tugas:** sub-agent native menerima tugas yang didelegasikan dalam pesan `[Subagent Task]` pertama yang terlihat. Prompt sistem sub-agent membawa aturan runtime dan konteks routing, bukan duplikat tersembunyi dari tugas.

Spawn sub-agent native yang diterima menyertakan metadata model child yang terselesaikan dalam
hasil tool: `resolvedModel` berisi ref model yang diterapkan dan
`resolvedProvider` berisi prefiks provider saat ref memilikinya.

### Mode prompt delegasi

`agents.defaults.subagents.delegationMode` hanya mengontrol panduan prompt; ini tidak mengubah kebijakan tool atau memaksakan delegasi.

- `suggest` (default): pertahankan dorongan prompt standar untuk menggunakan sub-agent untuk pekerjaan yang lebih besar atau lebih lambat.
- `prefer`: beri tahu agent utama agar tetap responsif dan mendelegasikan apa pun yang lebih kompleks daripada balasan langsung melalui `sessions_spawn`.

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
  Deskripsi tugas untuk sub-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Handle stabil opsional untuk mengidentifikasi child tertentu dalam output status berikutnya. Harus cocok dengan `[a-z][a-z0-9_-]{0,63}` dan tidak boleh berupa target yang dicadangkan seperti `last` atau `all`.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang dapat dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn di bawah id agen terkonfigurasi lain ketika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja tugas opsional untuk run child. Sub-agent native tetap memuat file bootstrap dari workspace agen target; `cwd` hanya mengubah tempat alat runtime dan harness CLI melakukan pekerjaan yang didelegasikan.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang sudah ada ketika `runtime: "acp"`; diabaikan untuk spawn sub-agent native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Mengalirkan output run ACP ke sesi induk ketika `runtime: "acp"`; hilangkan untuk spawn sub-agent native.
</ParamField>
<ParamField path="model" type="string">
  Timpa model sub-agent. Nilai yang tidak valid dilewati dan sub-agent berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Timpa tingkat berpikir untuk run sub-agent.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Ketika `true`, meminta pengikatan thread kanal untuk sesi sub-agent ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
  Jika pengikatan thread tidak tersedia untuk kanal peminta, gunakan `mode: "run"` sebagai gantinya.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` mengarsipkan segera setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak spawn kecuali runtime child target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke sesi child. Hanya sub-agent native. Spawn yang terikat thread default ke `fork`; spawn non-thread default ke `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman kanal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Sub-agent native melaporkan
giliran asisten terbaru mereka kembali ke peminta; pengiriman eksternal tetap berada pada
agen induk/peminta.
</Warning>

### Nama tugas dan penargetan

`taskName` adalah handle yang dihadapkan ke model untuk orkestrasi, bukan kunci sesi.
Gunakan untuk nama child yang stabil seperti `review_subagents`,
`linux_validation`, atau `docs_update` ketika koordinator mungkin perlu memeriksa
child tersebut nanti.

Resolusi target menerima kecocokan `taskName` persis dan prefiks yang tidak ambigu.
Pencocokan dibatasi pada jendela target aktif/terbaru yang sama dengan yang digunakan
oleh target `/subagents` bernomor, sehingga child lama yang selesai tidak membuat
handle yang digunakan ulang menjadi ambigu. Jika dua child aktif atau terbaru berbagi
`taskName` yang sama, target menjadi ambigu; gunakan indeks daftar, kunci sesi, atau
id run sebagai gantinya.

Target yang dicadangkan `last` dan `all` bukan nilai `taskName` yang valid
karena keduanya sudah memiliki makna kontrol.

## Alat: `sessions_yield`

Mengakhiri giliran model saat ini dan menunggu event runtime, terutama
event penyelesaian sub-agent, tiba sebagai pesan berikutnya. Gunakan setelah
men-spawn pekerjaan child yang diperlukan ketika peminta tidak dapat menghasilkan
jawaban final sampai penyelesaian tersebut tiba.

`sessions_yield` adalah primitif tunggu. Jangan menggantinya dengan loop polling
atas `subagents`, `sessions_list`, `sessions_history`, shell
`sleep`, atau polling proses hanya untuk mendeteksi penyelesaian child.

Hanya gunakan `sessions_yield` ketika daftar alat efektif sesi menyertakannya.
Beberapa profil alat minimal atau khusus mungkin mengekspos `sessions_spawn` dan
`subagents` tanpa mengekspos `sessions_yield`; dalam kasus itu, jangan menciptakan
loop polling hanya untuk menunggu penyelesaian.

Ketika ada child aktif, OpenClaw menyisipkan blok prompt ringkas yang dibuat runtime
`Active Subagents` ke dalam giliran normal agar peminta dapat melihat
sesi child saat ini, id run, status, label, tugas, dan alias
`taskName` tanpa polling. Kolom tugas dan label di dalam
blok itu dikutip sebagai data, bukan instruksi, karena keduanya dapat berasal
dari argumen spawn yang diberikan pengguna/model.

## Alat: `subagents`

Mencantumkan run sub-agent yang di-spawn yang dimiliki oleh sesi peminta. Ini dibatasi
pada peminta saat ini; child hanya dapat melihat child yang dikendalikannya sendiri.

Gunakan `subagents` untuk status sesuai permintaan dan debugging. Gunakan `sessions_yield` untuk
menunggu event penyelesaian.

## Sesi terikat thread

Ketika pengikatan thread diaktifkan untuk sebuah kanal, sub-agent dapat tetap terikat
ke thread sehingga pesan pengguna lanjutan di thread tersebut tetap dirutekan ke
sesi sub-agent yang sama.

### Kanal yang mendukung thread

Kanal apa pun dengan adapter pengikatan sesi dapat mendukung sesi subagent
terikat thread yang persisten (`sessions_spawn` dengan `thread: true`).
Adapter bawaan saat ini mencakup thread Discord, thread Matrix,
topik forum Telegram, dan pengikatan percakapan saat ini untuk Feishu.
Gunakan kunci konfigurasi `threadBindings` per kanal untuk pengaktifan,
timeout, dan `spawnSessions`.

### Alur cepat

<Steps>
  <Step title="Spawn">
    `sessions_spawn` dengan `thread: true` (dan opsional `mode: "session"`).
  </Step>
  <Step title="Ikat">
    OpenClaw membuat atau mengikat thread ke target sesi tersebut di kanal aktif.
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

| Perintah           | Efek                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ikat thread saat ini (atau buat satu) ke target sub-agent/sesi        |
| `/unfocus`         | Hapus pengikatan untuk thread terikat saat ini                        |
| `/agents`          | Cantumkan run aktif dan status pengikatan (`thread:<id>` atau `unbound`) |
| `/session idle`    | Periksa/perbarui auto-unfocus idle (hanya thread terikat yang difokuskan) |
| `/session max-age` | Periksa/perbarui batas keras (hanya thread terikat yang difokuskan)   |

### Switch konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kunci override kanal dan auto-bind spawn** bersifat spesifik adapter. Lihat [Kanal yang mendukung thread](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen terkonfigurasi yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan target terkonfigurasi apa pun). Default: hanya agen peminta. Jika Anda menetapkan daftar dan tetap ingin peminta men-spawn dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist target-agen terkonfigurasi default yang digunakan ketika agen peminta tidak menetapkan `subagents.allowAgents` sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Override per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout per panggilan untuk upaya pengiriman pengumuman `agent` gateway. Nilai berupa milidetik bilangan bulat positif dan dijepit ke maksimum timer yang aman untuk platform. Retry sementara dapat membuat total waktu tunggu pengumuman lebih lama daripada satu timeout terkonfigurasi.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Discovery

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif setiap agen yang tercantum
dan metadata runtime tertanam sehingga pemanggil dapat membedakan OpenClaw, server aplikasi Codex,
dan runtime native terkonfigurasi lainnya.

Entri `allowAgents` harus menunjuk ke id agen terkonfigurasi dalam `agents.list[]`.
`["*"]` berarti agen target terkonfigurasi apa pun plus peminta. Jika konfigurasi agen
dihapus tetapi id-nya tetap ada di `allowAgents`, `sessions_spawn` menolak id tersebut
dan `agents_list` menghilangkannya. Jalankan `openclaw doctor --fix` untuk membersihkan
entri allowlist yang usang, atau tambahkan entri `agents.list[]` minimal ketika target harus
tetap dapat di-spawn sambil mewarisi default.

### Arsip otomatis

- Sesi sub-agent diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` mengarsipkan segera setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
- Arsip otomatis bersifat upaya terbaik; timer yang tertunda hilang jika gateway dimulai ulang.
- Timeout run yang dikonfigurasi **tidak** mengarsipkan otomatis; timeout hanya menghentikan run. Sesi tetap ada sampai arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi depth-1 dan depth-2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup dengan upaya terbaik ketika run selesai, meskipun catatan transkrip/sesi tetap disimpan.

## Sub-agent bersarang

Secara default, sub-agent tidak dapat men-spawn sub-agent mereka sendiri
(`maxSpawnDepth: 1`). Tetapkan `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
penyusunan bersarang — **pola orkestrator**: utama → sub-agent orkestrator →
sub-sub-agent worker.

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

### Tingkat depth

| Depth | Bentuk kunci sesi                            | Peran                                         | Dapat spawn?                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orkestrator ketika depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker leaf)                   | Tidak pernah                 |

### Rantai pengumuman

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → mengumumkan ke induknya (orkestrator depth-1).
2. Orkestrator depth-1 menerima pengumuman, menyintesis hasil, selesai → mengumumkan ke main.
3. Agen main menerima pengumuman dan menyampaikannya kepada pengguna.

Setiap level hanya melihat pengumuman dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak satu kali dan tunggu peristiwa
penyelesaian, alih-alih membangun loop polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah sleep `exec`.
`sessions_list` dan `/subagents list` menjaga relasi sesi-anak tetap
terfokus pada pekerjaan aktif — anak yang masih aktif tetap terpasang, anak
yang sudah berakhir tetap terlihat selama jendela terbaru yang singkat, dan
tautan anak lama yang hanya ada di store diabaikan setelah jendela
freshness-nya. Ini mencegah metadata `spawnedBy` /
`parentSessionKey` lama membangkitkan anak bayangan setelah
restart. Jika peristiwa penyelesaian anak tiba setelah Anda sudah mengirim
jawaban akhir, tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan depth

- Peran dan cakupan kontrol ditulis ke metadata sesi saat spawn. Itu mencegah kunci sesi yang datar atau dipulihkan mendapatkan kembali hak istimewa orkestrator secara tidak sengaja.
- **Depth 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat men-spawn anak dan memeriksa statusnya. Alat sesi/sistem lain tetap ditolak.
- **Depth 1 (leaf, saat `maxSpawnDepth == 1`):** tidak ada alat sesi (perilaku default saat ini).
- **Depth 2 (pekerja leaf):** tidak ada alat sesi — `sessions_spawn` selalu ditolak pada depth 2. Tidak dapat men-spawn anak lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada depth apa pun) dapat memiliki paling banyak
`maxChildrenPerAgent` (default `5`) anak aktif pada satu waktu. Ini mencegah
fan-out tak terkendali dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator depth-1 secara otomatis menghentikan semua anak
depth-2 miliknya:

- `/stop` di chat main menghentikan semua agen depth-1 dan berantai ke anak depth-2 mereka.

## Autentikasi

Auth sub-agen diselesaikan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Store auth dimuat dari `agentDir` agen tersebut.
- Profil auth agen main digabungkan sebagai **fallback**; profil agen menimpa profil main saat ada konflik.

Penggabungan bersifat aditif, sehingga profil main selalu tersedia sebagai
fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Pengumuman

Sub-agen melaporkan kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, output pengumuman ditekan meskipun sebelumnya ada progres yang terlihat.

Pengiriman bergantung pada depth peminta:

- Sesi peminta tingkat atas menggunakan panggilan lanjutan `agent` dengan pengiriman eksternal (`deliver=true`).
- Sesi subagent peminta bertingkat menerima injeksi lanjutan internal (`deliver=false`) agar orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagent peminta bertingkat hilang, OpenClaw fallback ke peminta sesi tersebut jika tersedia.

Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian pertama-tama
menyelesaikan route percakapan/thread terikat dan override hook apa pun, lalu mengisi
field channel-target yang hilang dari route tersimpan sesi peminta.
Itu menjaga penyelesaian tetap di chat/topik yang tepat meskipun origin
penyelesaian hanya mengidentifikasi channel.

Agregasi penyelesaian anak dicakup ke run peminta saat ini ketika
membangun temuan penyelesaian bertingkat, sehingga output anak dari run
sebelumnya yang sudah stale tidak bocor ke pengumuman saat ini. Balasan pengumuman
mempertahankan routing thread/topik jika tersedia pada adapter channel.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:

| Field          | Sumber                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                        |
| Id sesi        | Kunci/id sesi anak                                                                                            |
| Jenis          | Jenis pengumuman + label tugas                                                                                |
| Status         | Diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Konten hasil   | Teks asisten terlihat terbaru dari anak                                                                       |
| Tindak lanjut  | Instruksi yang menjelaskan kapan harus membalas vs tetap senyap                                               |

Run terminal yang gagal melaporkan status kegagalan tanpa memutar ulang
teks balasan yang ditangkap. Output tool/toolResult tidak dipromosikan menjadi teks hasil anak.

### Baris stats

Payload pengumuman menyertakan baris stats di akhir (bahkan saat dibungkus):

- Runtime (mis. `runtime 5m12s`).
- Penggunaan token (input/output/total).
- Perkiraan biaya saat pricing model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan path transkrip agar agen main dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk.

Metadata internal ditujukan hanya untuk orkestrasi; balasan yang menghadap
pengguna harus ditulis ulang dengan suara asisten normal.

### Mengapa lebih memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- Recall asisten dinormalisasi terlebih dahulu: tag thinking dihapus; scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus; blok payload XML pemanggilan alat teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) dihapus, termasuk payload terpotong yang tidak pernah tertutup dengan bersih; scaffolding pemanggilan/hasil alat yang diturunkan dan marker konteks historis dihapus; token kontrol model yang bocor (`<|assistant|>`, ASCII `<|...|>` lain, full-width `<｜...｜>`) dihapus; XML pemanggilan alat MiniMax yang malformed dihapus.
- Teks yang menyerupai kredensial/token direduksi.
- Blok panjang dapat dipotong.
- Riwayat yang sangat besar dapat membuang baris lama atau mengganti baris yang terlalu besar dengan `[sessions_history omitted: message too large]`.
- Pemeriksaan transkrip mentah di disk adalah fallback saat Anda memerlukan transkrip lengkap byte demi byte.

## Kebijakan alat

Sub-agen menggunakan profil dan pipeline kebijakan alat yang sama seperti induk atau
agen target terlebih dahulu. Setelah itu, OpenClaw menerapkan lapisan pembatasan
sub-agen.

Tanpa `tools.profile` yang restriktif, sub-agen mendapatkan **semua alat kecuali
alat pesan, alat sesi, dan alat sistem**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` tetap merupakan tampilan recall yang dibatasi dan disanitasi di sini juga — ini
bukan dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` agar dapat mengelola anak-anaknya.

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

`tools.subagents.tools.allow` adalah filter allow-only final. Ini dapat mempersempit
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
agen yang harus mendapatkan otomasi browser.

## Concurrency

Sub-agen menggunakan lane antrean in-process khusus:

- **Nama lane:** `subagent`
- **Concurrency:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Liveness dan pemulihan

OpenClaw tidak memperlakukan ketiadaan `endedAt` sebagai bukti permanen bahwa
sub-agen masih hidup. Run yang belum berakhir dan lebih tua dari jendela stale-run
berhenti dihitung sebagai aktif/tertunda dalam `/subagents list`, ringkasan status,
gating penyelesaian turunan, dan pemeriksaan concurrency per sesi.

Setelah gateway restart, run pulihan stale yang belum berakhir dipangkas kecuali
sesi anaknya ditandai `abortedLastRun: true`. Sesi anak yang
dibatalkan oleh restart tersebut tetap dapat dipulihkan melalui alur pemulihan orphan
sub-agen, yang mengirim pesan resume sintetis sebelum
membersihkan marker aborted.

Pemulihan restart otomatis dibatasi per sesi anak. Jika anak
sub-agen yang sama diterima untuk pemulihan orphan berulang kali di dalam
jendela rapid re-wedge, OpenClaw menyimpan tombstone pemulihan pada
sesi tersebut dan berhenti melanjutkannya otomatis pada restart berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk membersihkan flag pemulihan aborted yang stale pada
sesi bertombstone.

<Note>
Jika spawn sub-agen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit state pairing.
Koordinasi internal `sessions_spawn` melakukan dispatch in process saat
pemanggil sudah berjalan di dalam konteks request gateway, sehingga tidak
membuka WebSocket loopback atau bergantung pada baseline scope perangkat-terpasangkan
CLI. Pemanggil di luar proses gateway tetap menggunakan fallback WebSocket
sebagai `client.id: "gateway-client"` dengan `client.mode: "backend"`
melalui auth shared-token/password loopback langsung. Pemanggil remote,
`deviceIdentity` eksplisit, path device-token eksplisit, dan klien browser/node
tetap memerlukan persetujuan perangkat normal untuk upgrade scope.
</Note>

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan run sub-agen aktif apa pun yang di-spawn darinya, berantai ke anak bertingkat.

## Batasan

- Pengumuman sub-agen bersifat **best-effort**. Jika gateway restart, pekerjaan "announce back" yang tertunda hilang.
- Sub-agen masih berbagi resource proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: ini langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`). Subagent native Codex mengikuti batas yang sama: `TOOLS.md` tetap berada dalam instruksi thread Codex yang diwarisi, sementara file persona, identitas, dan pengguna yang hanya untuk induk disuntikkan sebagai instruksi kolaborasi bercakupan turn agar anak tidak mengkloningnya.
- Depth nesting maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Depth 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi anak aktif per sesi (default `5`, rentang `1–20`).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Kirim agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
