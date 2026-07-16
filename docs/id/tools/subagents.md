---
read_when:
    - Anda menginginkan pekerjaan latar belakang atau paralel melalui agen
    - Anda sedang mengubah kebijakan alat sessions_spawn atau subagen
    - Anda sedang menerapkan atau memecahkan masalah sesi subagen yang terikat ke utas
sidebarTitle: Sub-agents
summary: Jalankan agen latar belakang yang terisolasi dan mengumumkan hasilnya kembali ke percakapan peminta
title: Subagen
x-i18n:
    generated_at: "2026-07-16T18:50:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah proses agen latar belakang yang dimunculkan dari proses agen yang sudah ada.
Masing-masing berjalan dalam sesinya sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke kanal obrolan peminta.
Setiap proses sub-agen dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Tujuan:

- Memparalelkan riset, tugas panjang, dan pekerjaan alat yang lambat tanpa memblokir proses utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi, sandbox opsional).
- Menjaga permukaan alat agar sulit disalahgunakan: secara default, sub-agen **tidak** mendapatkan alat sesi atau pesan.
- Mendukung kedalaman bersarang yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** secara default, setiap sub-agen memiliki konteks dan penggunaan tokennya
sendiri. Untuk tugas berat atau berulang, tetapkan model yang lebih murah untuk sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi melalui
`agents.defaults.subagents.model` atau penggantian per agen. Saat agen turunan
benar-benar memerlukan transkrip peminta saat ini, munculkan agen tersebut dengan
`context: "fork"`. Sesi sub-agen yang terikat utas secara default menggunakan
`context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini ke
utas tindak lanjut.
</Note>

## Perintah garis miring

`/subagents` memeriksa proses sub-agen untuk **sesi saat ini**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` menampilkan metadata proses (status, stempel waktu, id sesi,
jalur transkrip, pembersihan). `/subagents log` mencetak giliran obrolan terbaru untuk suatu
proses; tambahkan token `tools` untuk menyertakan pesan panggilan/hasil alat (secara
default dihilangkan). Gunakan `sessions_history` untuk tampilan pengingatan kembali yang
terbatas dan difilter demi keamanan dari dalam giliran agen, atau periksa jalur transkrip pada disk untuk
transkrip lengkap mentah.

Di UI Kontrol, sesi induk dengan proses turunan terbaru memiliki baris bilah sisi yang dapat
diperluas. Baris bersarang menampilkan status dan waktu proses agen turunan, dan memilih salah satunya
akan membuka obrolan agen turunan tersebut sambil mempertahankan hierarki induk.

### Kontrol pengikatan utas

Perintah ini berfungsi pada kanal dengan pengikatan utas persisten. Lihat
[Kanal yang mendukung utas](#thread-supporting-channels) di bawah.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Perilaku pemunculan

Agen memulai sub-agen latar belakang dengan alat `sessions_spawn`.
Penyelesaian dikembalikan sebagai peristiwa internal sesi induk; agen induk/peminta
memutuskan apakah pembaruan yang terlihat oleh pengguna diperlukan.

<AccordionGroup>
  <Accordion title="Penyelesaian berbasis dorongan yang tidak memblokir">
    - `sessions_spawn` tidak memblokir; alat ini segera mengembalikan id proses.
    - Setelah selesai, sub-agen melapor kembali ke sesi induk/peminta.
    - Giliran agen yang memerlukan hasil agen turunan harus memanggil `sessions_yield` setelah memunculkan pekerjaan yang diperlukan. Tindakan tersebut mengakhiri giliran saat ini dan memungkinkan peristiwa penyelesaian tiba sebagai pesan berikutnya yang terlihat oleh model.
    - Penyelesaian berbasis dorongan. Setelah dimunculkan, **jangan** melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam perulangan hanya untuk menunggu proses selesai; periksa status sesuai kebutuhan hanya saat melakukan debug.
    - Keluaran agen turunan adalah laporan/bukti yang perlu disintesis oleh agen peminta. Keluaran tersebut bukan teks instruksi yang ditulis pengguna dan tidak dapat mengesampingkan kebijakan sistem, pengembang, atau pengguna.
    - Setelah selesai, OpenClaw berupaya sebaik mungkin untuk menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman dilanjutkan.

  </Accordion>
  <Accordion title="Pengiriman penyelesaian">
    - OpenClaw menyerahkan penyelesaian kembali ke sesi peminta melalui giliran `agent` dengan kunci idempotensi yang stabil.
    - Jika proses peminta masih aktif, OpenClaw terlebih dahulu mencoba membangunkan/mengarahkan proses tersebut alih-alih memulai jalur balasan kedua yang terlihat.
    - Jika peminta yang aktif tidak dapat dibangunkan, OpenClaw beralih ke penyerahan agen peminta dengan konteks penyelesaian yang sama alih-alih membuang pengumuman.
    - Penyerahan induk yang berhasil menuntaskan pengiriman sub-agen meskipun induk memutuskan bahwa tidak diperlukan pembaruan yang terlihat oleh pengguna.
    - Sub-agen native tidak mendapatkan alat pesan. Sub-agen mengembalikan teks asisten biasa kepada agen induk/peminta; balasan yang terlihat oleh manusia tetap dimiliki oleh kebijakan pengiriman normal agen induk/peminta.
    - Jika penyerahan langsung tidak dapat digunakan, pengiriman beralih ke perutean antrean, lalu ke percobaan ulang pengumuman singkat dengan jeda balik eksponensial sebelum akhirnya menyerah.
    - Pengiriman mempertahankan rute peminta yang telah ditetapkan: rute penyelesaian yang terikat utas atau percakapan diprioritaskan saat tersedia. Jika asal penyelesaian hanya menyediakan kanal, OpenClaw mengisi target/akun yang tidak tersedia dari rute sesi peminta yang telah ditetapkan (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata penyerahan penyelesaian">
    Penyerahan penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan
    saat runtime (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat dari agen turunan. Keluaran tool/toolResult tidak dipromosikan menjadi hasil agen turunan. Proses yang gagal secara terminal tidak menggunakan kembali teks balasan yang telah ditangkap.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token ringkas.
    - Instruksi peninjauan yang meminta agen peminta memverifikasi hasil sebelum memutuskan apakah tugas asli telah selesai.
    - Panduan tindak lanjut yang meminta agen peminta melanjutkan tugas atau mencatat tindak lanjut saat hasil agen turunan menyisakan tindakan tambahan.
    - Instruksi pembaruan akhir untuk jalur tanpa tindakan lanjutan, yang ditulis dengan gaya asisten normal tanpa meneruskan metadata internal mentah.

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` menggantikan nilai default untuk proses tertentu tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan keluaran setelah penyelesaian.
    - Untuk sesi persisten yang terikat utas, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Jika kanal peminta tidak mendukung pengikatan utas, gunakan `mode: "run"` alih-alih mencoba kembali kombinasi terikat utas yang mustahil.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` saat alat mengiklankan runtime tersebut. Lihat [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat melakukan debug penyelesaian atau perulangan antaragen. Saat plugin `codex` diaktifkan, kontrol obrolan/utas Codex sebaiknya memprioritaskan `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak berada dalam sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native dimulai secara terisolasi kecuali pemanggil secara eksplisit meminta untuk mencabangkan
transkrip saat ini.

| Mode       | Waktu penggunaan                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat yang lambat, atau apa pun yang dapat dijelaskan secara ringkas dalam teks tugas                           | Membuat transkrip agen turunan yang bersih. Ini adalah nilai default dan menjaga penggunaan token lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi agen turunan sebelum agen turunan dimulai. |

Gunakan `fork` secukupnya. Fitur ini ditujukan untuk delegasi yang sensitif terhadap konteks, bukan sebagai
pengganti penulisan perintah tugas yang jelas.

## Alat: `sessions_spawn`

Memulai proses sub-agen dengan `deliver: false` pada jalur `subagent` global,
kemudian menjalankan langkah pengumuman dan memposting balasan pengumuman ke kanal
obrolan peminta.

Ketersediaan bergantung pada kebijakan alat efektif pemanggil. Profil bawaan
`coding` mencakup `sessions_spawn`; `messaging` dan `minimal` tidak
mencakupnya. `full` mengizinkan setiap alat. Tambahkan `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, atau gunakan `tools.profile: "coding"`, untuk
agen dengan profil lebih sempit yang tetap perlu mendelegasikan pekerjaan.
Kebijakan izinkan/tolak kanal/grup, penyedia, sandbox, dan per agen
masih dapat menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Nilai default:**

- **Model:** sub-agen native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen). Pemunculan runtime ACP menggunakan model sub-agen terkonfigurasi yang sama jika tersedia; jika tidak, harness ACP mempertahankan nilai defaultnya sendiri. `sessions_spawn.model` eksplisit tetap diprioritaskan.
- **Penalaran:** sub-agen native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen). Pemunculan runtime ACP juga menerapkan `agents.defaults.models["provider/model"].params.thinking` untuk model yang dipilih. `sessions_spawn.thinking` eksplisit tetap diprioritaskan.
- **Batas waktu proses:** OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` saat ditetapkan; jika tidak, OpenClaw kembali ke `0` (tanpa batas waktu). `sessions_spawn` tidak menerima penggantian batas waktu per panggilan.
- **Pengiriman tugas:** sub-agen native menerima tugas yang didelegasikan dalam pesan `[Subagent Task]` pertama yang terlihat. Perintah sistem sub-agen memuat aturan runtime dan konteks perutean, bukan duplikat tersembunyi dari tugas tersebut.

Pemunculan sub-agen native yang diterima mencakup metadata model agen turunan yang telah ditetapkan
dalam hasil alat: `resolvedModel` berisi referensi model yang diterapkan dan
`resolvedProvider` berisi prefiks penyedia jika referensi memilikinya.

### Mode perintah delegasi

`agents.defaults.subagents.delegationMode` hanya mengontrol panduan perintah; fitur ini tidak mengubah kebijakan alat atau mewajibkan delegasi.

- `suggest` (default): pertahankan dorongan perintah standar untuk menggunakan sub-agen bagi pekerjaan yang lebih besar atau lebih lambat.
- `prefer`: instruksikan agen utama agar tetap responsif dan mendelegasikan apa pun yang lebih rumit daripada balasan langsung melalui `sessions_spawn`.

Penggantian per agen: `agents.list[].subagents.delegationMode`.

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
  Deskripsi tugas untuk subagen.
</ParamField>
<ParamField path="taskName" type="string">
  Identitas stabil opsional untuk mengidentifikasi turunan tertentu dalam keluaran status berikutnya. Harus cocok dengan `[a-z][a-z0-9_-]{0,63}` dan tidak boleh berupa target yang dicadangkan seperti `last` atau `all`.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang mudah dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Buat di bawah id agen terkonfigurasi lain jika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja tugas opsional untuk proses turunan. Subagen native tetap memuat berkas bootstrap dari ruang kerja agen target; `cwd` hanya mengubah tempat alat runtime dan harness CLI melakukan pekerjaan yang didelegasikan.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang sudah ada ketika `runtime: "acp"`; diabaikan untuk pembuatan subagen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Mengalirkan keluaran proses ACP ke sesi induk ketika `runtime: "acp"`; hilangkan untuk pembuatan subagen native.
</ParamField>
<ParamField path="model" type="string">
  Ganti model subagen. Nilai yang tidak valid dilewati dan subagen berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Ganti tingkat penalaran untuk proses subagen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Ketika `true`, meminta pengikatan utas kanal untuk sesi subagen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
  Jika pengikatan utas tidak tersedia untuk kanal peminta, gunakan `mode: "run"` sebagai gantinya.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` segera mengarsipkan sesi setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak pembuatan kecuali runtime turunan target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke dalam sesi turunan. Khusus subagen native. Pembuatan yang terikat utas menggunakan default `fork`; pembuatan yang tidak terikat utas menggunakan default `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman kanal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Subagen native melaporkan
giliran asisten terbarunya kembali kepada peminta; pengiriman eksternal tetap menjadi tanggung jawab
agen induk/peminta.
</Warning>

### Nama tugas dan penargetan

`taskName` adalah identitas yang digunakan model untuk orkestrasi, bukan kunci sesi.
Gunakan untuk nama turunan yang stabil seperti `review_subagents`,
`linux_validation`, atau `docs_update` ketika koordinator mungkin perlu memeriksa
turunan tersebut nanti.

Resolusi target menerima kecocokan `taskName` yang persis dan
prefiks yang tidak ambigu. Pencocokan dibatasi pada jendela target aktif/terbaru yang sama
dengan yang digunakan oleh target `/subagents` bernomor, sehingga turunan lama yang telah selesai tidak membuat
identitas yang digunakan ulang menjadi ambigu. Jika dua turunan aktif atau terbaru memiliki
`taskName` yang sama, target menjadi ambigu; gunakan indeks daftar, kunci sesi, atau
id proses sebagai gantinya.

Target yang dicadangkan `last` dan `all` bukan nilai `taskName` yang valid
karena keduanya sudah memiliki arti kontrol.

## Alat: `sessions_yield`

Mengakhiri giliran model saat ini dan menunggu peristiwa runtime, terutama
peristiwa penyelesaian subagen, tiba sebagai pesan berikutnya. Gunakan setelah
membuat pekerjaan turunan yang diperlukan ketika peminta tidak dapat menghasilkan jawaban
akhir hingga penyelesaian tersebut tiba.

`sessions_yield` adalah mekanisme menunggu. Jangan menggantinya dengan perulangan polling
atas `subagents`, `sessions_list`, `sessions_history`, shell
`sleep`, atau polling proses hanya untuk mendeteksi penyelesaian turunan.

Gunakan `sessions_yield` hanya ketika daftar alat efektif sesi menyertakannya.
Beberapa profil alat minimal atau khusus mungkin menyediakan `sessions_spawn` dan
`subagents` tanpa menyediakan `sessions_yield`; dalam hal tersebut, jangan membuat
perulangan polling hanya untuk menunggu penyelesaian.

Ketika terdapat turunan aktif, OpenClaw menyisipkan blok prompt ringkas yang dibuat runtime
`Active Subagents` ke dalam giliran normal agar peminta dapat melihat
sesi turunan saat ini, id proses, status, label, tugas, dan
alias `taskName` tanpa polling. Kolom tugas dan label dalam
blok tersebut dikutip sebagai data, bukan instruksi, karena dapat berasal
dari argumen pembuatan yang diberikan pengguna/model.

## Alat: `subagents`

Mencantumkan proses subagen yang dibuat dan dimiliki oleh sesi peminta. Cakupannya
terbatas pada peminta saat ini; turunan hanya dapat melihat turunannya sendiri yang dikendalikan.

Gunakan `subagents` untuk status dan debugging sesuai permintaan. Gunakan `sessions_yield` untuk
menunggu peristiwa penyelesaian.

## Sesi terikat utas

Ketika pengikatan utas diaktifkan untuk sebuah kanal, subagen dapat tetap terikat
pada utas sehingga pesan lanjutan pengguna dalam utas tersebut tetap dirutekan ke
sesi subagen yang sama.

### Kanal yang mendukung utas

Sebuah kanal mendukung sesi subagen terikat utas yang persisten
(`sessions_spawn` dengan `thread: true`) ketika kanal tersebut mendaftarkan adaptor pengikatan
percakapan. Kanal bawaan dengan dukungan tersebut: **Discord**,
**iMessage**, **Matrix**, dan **Telegram**. Discord dan Matrix secara default
membuat utas turunan; Telegram dan iMessage secara default mengikat
percakapan saat ini. Gunakan kunci konfigurasi `threadBindings` per kanal untuk
pengaktifan, batas waktu, dan `spawnSessions`.

### Alur cepat

<Steps>
  <Step title="Buat">
    `sessions_spawn` dengan `thread: true` (dan secara opsional `mode: "session"`).
  </Step>
  <Step title="Ikat">
    OpenClaw membuat atau mengikat utas ke target sesi tersebut dalam kanal aktif.
  </Step>
  <Step title="Rutekan tindak lanjut">
    Balasan dan pesan lanjutan dalam utas tersebut dirutekan ke sesi yang terikat.
  </Step>
  <Step title="Periksa batas waktu">
    Gunakan `/session idle` untuk memeriksa/memperbarui pelepasan fokus otomatis akibat tidak aktif dan
    `/session max-age` untuk mengontrol batas maksimum mutlak.
  </Step>
  <Step title="Lepaskan">
    Gunakan `/unfocus` untuk melepaskan secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah            | Efek                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Mengikat utas saat ini (atau membuatnya) ke target subagen/sesi                          |
| `/unfocus`         | Menghapus pengikatan untuk utas terikat saat ini                                         |
| `/agents`          | Mencantumkan proses aktif dan status pengikatan (`binding:<id>`, `unbound`, atau `bindings unavailable`) |
| `/session idle`    | Memeriksa/memperbarui pelepasan fokus otomatis saat menganggur (khusus utas terikat yang difokuskan) |
| `/session max-age` | Memeriksa/memperbarui batas maksimum mutlak (khusus utas terikat yang difokuskan)        |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kunci penggantian kanal dan pengikatan otomatis saat pembuatan** bersifat khusus adaptor. Lihat [Kanal yang mendukung utas](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah garis miring](/id/tools/slash-commands) untuk detail adaptor saat ini.

### Daftar izin

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen terkonfigurasi yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan target terkonfigurasi apa pun). Default: hanya agen peminta. Jika Anda menetapkan daftar dan tetap ingin peminta membuat dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Daftar izin agen target terkonfigurasi default yang digunakan ketika agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Memblokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil secara eksplisit). Penggantian per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Batas waktu per panggilan untuk upaya pengiriman pengumuman `agent` Gateway. Nilainya berupa milidetik bilangan bulat positif dan dibatasi pada batas maksimum timer yang aman bagi platform. Percobaan ulang sementara dapat membuat total waktu tunggu pengumuman lebih lama daripada satu batas waktu yang dikonfigurasi.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif dan metadata
runtime tertanam setiap agen yang tercantum agar pemanggil dapat membedakan OpenClaw, server aplikasi Codex,
dan runtime native terkonfigurasi lainnya.

Entri `allowAgents` harus menunjuk ke id agen terkonfigurasi dalam `agents.list[]`.
`["*"]` berarti agen target terkonfigurasi apa pun beserta peminta. Jika konfigurasi agen
dihapus tetapi id-nya tetap berada dalam `allowAgents`, `sessions_spawn` menolak id tersebut
dan `agents_list` menghilangkannya. Jalankan `openclaw doctor --fix` untuk membersihkan
entri daftar izin yang sudah tidak berlaku, atau tambahkan entri minimal `agents.list[]` ketika target harus
tetap dapat dibuat sambil mewarisi default.

### Pengarsipan otomatis

- Sesi subagen otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Pengarsipan menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` segera mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
- Pengarsipan otomatis bersifat upaya terbaik; timer yang tertunda akan hilang jika Gateway dimulai ulang.
- Batas waktu proses yang dikonfigurasi **tidak** mengarsipkan secara otomatis; batas tersebut hanya menghentikan proses. Sesi tetap ada hingga pengarsipan otomatis.
- Pengarsipan otomatis berlaku sama untuk sesi kedalaman 1 dan kedalaman 2.
- Pembersihan peramban terpisah dari pembersihan arsip: tab/proses peramban yang dilacak ditutup dengan upaya terbaik ketika proses selesai, meskipun catatan transkrip/sesi dipertahankan.

## Subagen bertingkat

Secara default, subagen tidak dapat membuat subagennya sendiri
(`maxSpawnDepth: 1`). Tetapkan `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
penyarangan — **pola orkestrator**: utama → subagen orkestrator →
sub-subagen pekerja.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // izinkan subagen membuat turunan (default: 1, rentang 1-5)
        maxChildrenPerAgent: 5, // jumlah maksimum turunan aktif per sesi agen (default: 5, rentang 1-20)
        maxConcurrent: 8, // batas lajur konkurensi global (default: 8)
        runTimeoutSeconds: 900, // batas waktu default untuk sessions_spawn (0 = tanpa batas waktu)
        announceTimeoutMs: 120000, // batas waktu pengumuman Gateway per panggilan
      },
    },
  },
}
```

### Tingkat kedalaman

| Kedalaman | Bentuk kunci sesi                            | Peran                                          | Dapat membuat turunan?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagen (orkestrator saat kedalaman 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagen (pekerja daun)                   | Tidak pernah                        |

### Rantai pengumuman

Hasil mengalir kembali ke atas melalui rantai:

1. Pekerja kedalaman 2 selesai → mengumumkan kepada induknya (orkestrator kedalaman 1).
2. Orkestrator kedalaman 1 menerima pengumuman, menyintesis hasil, selesai → mengumumkan kepada agen utama.
3. Agen utama menerima pengumuman dan menyampaikannya kepada pengguna.

Setiap tingkat hanya melihat pengumuman dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak satu kali dan tunggu peristiwa
penyelesaian, alih-alih membuat perulangan polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah tidur `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi anak
tetap berfokus pada pekerjaan aktif — anak yang aktif tetap terlampir, anak yang telah berakhir tetap
terlihat dalam jendela terbaru yang singkat, dan tautan anak lama yang hanya ada di penyimpanan
diabaikan setelah jendela kesegarannya. Hal ini mencegah metadata lama `spawnedBy` /
`parentSessionKey` menghidupkan kembali anak siluman setelah
dimulai ulang. Jika peristiwa penyelesaian anak tiba setelah jawaban
akhir telah dikirim, tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan kedalaman

- Peran dan cakupan kendali ditulis ke metadata sesi saat pembuatan. Ini mencegah kunci sesi datar atau yang dipulihkan mendapatkan kembali hak istimewa orkestrator secara tidak sengaja.
- **Kedalaman 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat membuat anak dan memeriksa statusnya. Alat sesi/sistem lainnya tetap ditolak.
- **Kedalaman 1 (daun, saat `maxSpawnDepth == 1`):** tanpa alat sesi (perilaku default saat ini).
- **Kedalaman 2 (pekerja daun):** tanpa alat sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat membuat anak lebih lanjut.

### Batas pembuatan per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) anak aktif sekaligus. Ini mencegah penyebaran tak terkendali
dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator kedalaman 1 secara otomatis menghentikan semua anak
kedalaman 2 miliknya:

- `/stop` dalam obrolan utama menghentikan semua agen kedalaman 1 dan meneruskannya ke anak kedalaman 2 mereka.

## Autentikasi

Autentikasi subagen diselesaikan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi subagen adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan autentikasi dimuat dari `agentDir` milik agen tersebut.
- Profil autentikasi agen utama digabungkan sebagai **fallback**; profil agen menimpa profil utama jika terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Autentikasi yang sepenuhnya terisolasi per agen belum didukung.

## Pengumuman

Subagen melapor kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi subagen (bukan sesi peminta).
- Jika subagen membalas tepat dengan `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, keluaran pengumuman ditekan meskipun sebelumnya ada progres yang terlihat.

Pengiriman bergantung pada kedalaman peminta:

- Sesi peminta tingkat teratas menggunakan panggilan tindak lanjut `agent` dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) agar orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagen peminta bertingkat sudah tidak ada, OpenClaw beralih ke peminta sesi tersebut jika tersedia.

Untuk sesi peminta tingkat teratas, pengiriman langsung dalam mode penyelesaian terlebih dahulu
menyelesaikan setiap rute percakapan/utas yang terikat dan penggantian hook, lalu mengisi
bidang kanal-target yang belum ada dari rute tersimpan sesi peminta.
Ini menjaga penyelesaian tetap berada di obrolan/topik yang tepat meskipun asal penyelesaian
hanya mengidentifikasi kanal.

Agregasi penyelesaian anak dibatasi pada proses peminta saat ini ketika
membangun temuan penyelesaian bertingkat, sehingga mencegah keluaran anak dari proses
sebelumnya yang sudah usang bocor ke pengumuman saat ini. Balasan pengumuman mempertahankan
perutean utas/topik jika tersedia pada adaptor kanal.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:

| Bidang          | Sumber                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                     |
| Id sesi    | Kunci/id sesi anak                                                                                     |
| Jenis           | Jenis pengumuman + label tugas                                                                               |
| Status         | Diturunkan dari hasil runtime (`ok`, `error`, `timeout`, atau `unknown`) — **tidak** disimpulkan dari teks model |
| Isi hasil | Teks asisten terbaru yang terlihat dari anak                                                             |
| Tindak lanjut      | Instruksi yang menjelaskan kapan harus membalas atau tetap senyap                                                      |

Proses terminal yang gagal melaporkan status kegagalan tanpa memutar ulang teks
balasan yang telah ditangkap. Keluaran alat/toolResult tidak dipromosikan menjadi teks hasil anak.

### Baris statistik

Payload pengumuman menyertakan baris statistik di bagian akhir (bahkan saat dibungkus):

- Runtime (misalnya `runtime 5m12s`).
- Penggunaan token (masukan/keluaran/total).
- Perkiraan biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan jalur transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa berkas pada disk.

Metadata internal hanya ditujukan untuk orkestrasi; balasan yang ditampilkan kepada pengguna
harus ditulis ulang dengan gaya asisten yang normal.

### Mengapa lebih memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman untuk membaca transkrip
anak dari dalam giliran agen:

- Menyamarkan teks yang menyerupai kredensial/token bahkan saat penyamaran log serbaguna dinonaktifkan.
- Memotong blok teks panjang (4000 karakter per blok) dan membuang tanda tangan pemikiran, payload pemutaran ulang penalaran, serta data gambar sebaris.
- Memberlakukan batas respons 80 KB; baris yang terlalu besar diganti dengan `[sessions_history omitted: message too large]`.
- Gunakan `nextOffset` jika tersedia untuk menelusuri mundur jendela transkrip yang lebih lama.
- `sessions_history` **tidak** menghapus tag penalaran, kerangka `<relevant-memories>`, atau XML panggilan alat dari teks pesan — ini mengembalikan blok konten terstruktur yang mendekati bentuk transkrip mentah, hanya disamarkan dan dibatasi ukurannya. `/subagents log` menerapkan sanitasi prosa yang lebih ketat (menghapus tag penalaran, kerangka memori, dan XML panggilan alat) karena ini merender baris obrolan biasa, bukan blok terstruktur.
- Pemeriksaan transkrip mentah pada disk adalah fallback saat diperlukan transkrip lengkap byte demi byte.

## Kebijakan alat

Subagen terlebih dahulu menggunakan profil dan pipeline kebijakan alat yang sama dengan induk atau
agen target. Setelah itu, OpenClaw menerapkan lapisan pembatasan
subagen.

Subagen selalu kehilangan `gateway`, `agents_list`, `session_status`, dan
`cron` terlepas dari kedalaman atau perannya (alat tingkat sistem/interaktif, atau
alat yang harus dikoordinasikan oleh agen utama). Subagen daun (perilaku default kedalaman 1,
dan selalu pada kedalaman 2) juga kehilangan `subagents`,
`sessions_list`, `sessions_history`, dan `sessions_spawn`. Subagen tidak pernah
mendapatkan alat `message` — alat tersebut dinonaktifkan saat pembuatan, bukan difilter oleh
daftar penolakan ini — dan `sessions_send` tetap ditolak agar subagen
berkomunikasi hanya melalui rantai pengumuman.

`sessions_history` juga tetap merupakan tampilan pengingatan yang dibatasi dan disanitasi di sini —
bukan pembuangan transkrip mentah.

Saat `maxSpawnDepth >= 2`, subagen orkestrator kedalaman 1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` agar dapat mengelola anak mereka.

### Penggantian melalui konfigurasi

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
        // penolakan menang
        deny: ["gateway", "cron"],
        // jika izin ditetapkan, ini menjadi hanya-izin (penolakan tetap menang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` adalah filter hanya-izin terakhir. Filter ini dapat mempersempit
kumpulan alat yang telah diselesaikan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` menyertakan
`web_search`/`web_fetch`, tetapi tidak menyertakan alat `browser`. Agar
subagen profil pengodean dapat menggunakan otomatisasi browser, tambahkan browser pada
tahap profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gunakan `agents.list[].tools.alsoAllow: ["browser"]` per agen jika hanya satu
agen yang boleh mendapatkan otomatisasi browser.

## Konkurensi

Subagen menggunakan jalur antrean khusus dalam proses:

- **Nama jalur:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Keaktifan dan pemulihan

OpenClaw tidak menganggap ketiadaan `endedAt` sebagai bukti permanen bahwa
subagen masih aktif. Proses yang belum berakhir dan lebih lama daripada jendela proses usang
(2 jam, atau batas waktu proses yang dikonfigurasi ditambah masa tenggang singkat,
mana pun yang lebih lama) berhenti dihitung sebagai aktif/tertunda dalam `/subagents list`,
ringkasan status, pengaturan penyelesaian turunan, dan pemeriksaan
konkurensi per sesi.

Setelah Gateway dimulai ulang, proses pulihan yang belum berakhir dan sudah usang dipangkas kecuali
sesi anaknya ditandai `abortedLastRun: true`. Proses yang dibatalkan karena
dimulai ulang tetap terdaftar untuk alur pemulihan yatim subagen: proses usang
diselesaikan tanpa melanjutkan, sementara sesi anak baru menerima
pesan kelanjutan sintetis sebelum penanda dibatalkan dihapus.

Pemulihan otomatis setelah dimulai ulang dibatasi per sesi anak. Jika anak
subagen yang sama diterima untuk pemulihan yatim berulang kali di dalam
jendela kemacetan ulang cepat, OpenClaw menyimpan batu nisan pemulihan pada
sesi tersebut dan berhenti melanjutkannya secara otomatis pada mulai ulang berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus penanda pemulihan dibatalkan yang sudah usang pada
sesi berbatu nisan.

<Note>
Jika pembuatan subagen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pemasangan.
Koordinasi internal `sessions_spawn` dikirim dalam proses ketika
pemanggil sudah berjalan di dalam konteks permintaan gateway, sehingga tidak
membuka WebSocket loopback atau bergantung pada cakupan dasar perangkat terpasang milik CLI.
Pemanggil di luar proses gateway tetap menggunakan fallback WebSocket
sebagai `client.id: "gateway-client"` dengan `client.mode: "backend"`
melalui autentikasi token bersama/kata sandi loopback langsung. Pemanggil jarak jauh, `deviceIdentity`
eksplisit, jalur token perangkat eksplisit, dan klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` dalam obrolan pemohon akan membatalkan sesi pemohon dan menghentikan setiap proses subagen aktif yang dibuat darinya, dengan efek berantai ke turunan yang bertingkat.

## Keterbatasan

- Pengumuman subagen bersifat **upaya terbaik**. Jika gateway dimulai ulang, pekerjaan "announce back" yang tertunda akan hilang.
- Subagen tetap berbagi sumber daya proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu tidak memblokir: fungsi ini segera mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`). Subagen native Codex mengikuti batas yang sama: `TOOLS.md` tetap berada dalam instruksi utas Codex yang diwarisi, sedangkan persona, identitas, dan berkas pengguna yang hanya dimiliki induk disuntikkan sebagai instruksi kolaborasi dengan cakupan giliran agar turunan tidak menyalinnya.
- Kedalaman maksimum penyarangan adalah 5 (rentang `maxSpawnDepth`: 1-5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi turunan aktif per sesi (nilai bawaan `5`, rentang `1-20`).

## Terkait

- [Alat sesi dan perubahan status](/id/concepts/session-tool)
- [Agen ACP](/id/tools/acp-agents)
- [Pengiriman agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multiagen](/id/tools/multi-agent-sandbox-tools)
