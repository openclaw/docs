---
read_when:
    - Anda menginginkan pekerjaan latar belakang atau paralel melalui agen
    - Anda sedang mengubah kebijakan alat sessions_spawn atau subagen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat pada utas
sidebarTitle: Sub-agents
summary: Jalankan agen latar belakang terisolasi yang mengumumkan hasil kembali ke percakapan pemohon
title: Subagen
x-i18n:
    generated_at: "2026-07-12T14:46:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

Subagen adalah proses agen latar belakang yang dibuat dari proses agen yang sudah ada.
Masing-masing berjalan dalam sesinya sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke saluran obrolan peminta.
Setiap proses subagen dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Tujuan:

- Memparalelkan riset, tugas panjang, dan pekerjaan alat yang lambat tanpa memblokir proses utama.
- Menjaga subagen tetap terisolasi secara default (pemisahan sesi, sandbox opsional).
- Menjaga agar permukaan alat sulit disalahgunakan: secara default, subagen **tidak** mendapatkan alat sesi atau pesan.
- Mendukung kedalaman penyarangan yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** secara default, setiap subagen memiliki konteks dan penggunaan
token sendiri. Untuk tugas berat atau berulang, tetapkan model yang lebih murah untuk subagen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi melalui
`agents.defaults.subagents.model` atau penggantian per agen. Ketika agen turunan
benar-benar memerlukan transkrip peminta saat ini, buat agen tersebut dengan
`context: "fork"`. Sesi subagen yang terikat utas secara default menggunakan
`context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini menjadi
utas tindak lanjut.
</Note>

## Perintah garis miring

`/subagents` memeriksa proses subagen untuk **sesi saat ini**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` menampilkan metadata proses (status, stempel waktu, id sesi,
jalur transkrip, pembersihan). `/subagents log` mencetak giliran obrolan terbaru untuk suatu
proses; tambahkan token `tools` untuk menyertakan pesan pemanggilan/hasil alat (secara
default dihilangkan). Gunakan `sessions_history` untuk tampilan ingatan terbatas
yang difilter demi keamanan dari dalam giliran agen, atau periksa jalur transkrip pada disk untuk
transkrip lengkap mentah.

### Kontrol pengikatan utas

Perintah ini berfungsi pada saluran dengan pengikatan utas persisten. Lihat
[Saluran yang mendukung utas](#thread-supporting-channels) di bawah.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Perilaku pembuatan

Agen memulai subagen latar belakang dengan alat `sessions_spawn`.
Penyelesaian dikembalikan sebagai peristiwa internal sesi induk; agen induk/peminta
memutuskan apakah pembaruan yang terlihat oleh pengguna diperlukan.

<AccordionGroup>
  <Accordion title="Penyelesaian nonpemblokiran berbasis dorong">
    - `sessions_spawn` tidak memblokir; alat ini langsung mengembalikan id proses.
    - Setelah selesai, subagen melapor kembali ke sesi induk/peminta.
    - Giliran agen yang memerlukan hasil agen turunan harus memanggil `sessions_yield` setelah membuat pekerjaan yang diperlukan. Tindakan ini mengakhiri giliran saat ini dan memungkinkan peristiwa penyelesaian tiba sebagai pesan berikutnya yang terlihat oleh model.
    - Penyelesaian berbasis dorong. Setelah dibuat, **jangan** melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam perulangan hanya untuk menunggu proses selesai; periksa status sesuai kebutuhan hanya saat melakukan debug.
    - Keluaran agen turunan adalah laporan/bukti yang harus disintesis oleh agen peminta. Keluaran tersebut bukan teks instruksi yang dibuat pengguna dan tidak dapat mengesampingkan kebijakan sistem, pengembang, atau pengguna.
    - Setelah selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses peramban terlacak yang dibuka oleh sesi subagen tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Pengiriman penyelesaian">
    - OpenClaw menyerahkan penyelesaian kembali ke sesi peminta melalui giliran `agent` dengan kunci idempotensi yang stabil.
    - Jika proses peminta masih aktif, OpenClaw terlebih dahulu mencoba membangunkan/mengarahkan proses tersebut alih-alih memulai jalur balasan terlihat kedua.
    - Jika peminta aktif tidak dapat dibangunkan, OpenClaw beralih ke serah terima agen peminta dengan konteks penyelesaian yang sama alih-alih membuang pengumuman.
    - Serah terima induk yang berhasil menyelesaikan pengiriman subagen meskipun induk memutuskan bahwa pembaruan yang terlihat oleh pengguna tidak diperlukan.
    - Subagen native tidak mendapatkan alat pesan. Subagen mengembalikan teks asisten biasa kepada agen induk/peminta; balasan yang terlihat oleh manusia tetap berada di bawah kebijakan pengiriman normal agen induk/peminta.
    - Jika serah terima langsung tidak dapat digunakan, pengiriman beralih ke perutean antrean, lalu ke percobaan ulang pengumuman singkat dengan jeda eksponensial sebelum akhirnya menyerah.
    - Pengiriman mempertahankan rute peminta yang telah ditetapkan: rute penyelesaian yang terikat utas atau percakapan diprioritaskan jika tersedia. Jika asal penyelesaian hanya menyediakan saluran, OpenClaw mengisi target/akun yang hilang dari rute sesi peminta yang telah ditetapkan (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata serah terima penyelesaian">
    Serah terima penyelesaian ke sesi peminta merupakan konteks internal yang dihasilkan
    saat runtime (bukan teks yang dibuat pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat dari agen turunan. Keluaran tool/toolResult tidak dinaikkan menjadi hasil agen turunan. Proses yang gagal secara terminal tidak menggunakan kembali teks balasan yang telah direkam.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token yang ringkas.
    - Instruksi peninjauan yang memberi tahu agen peminta untuk memverifikasi hasil sebelum memutuskan apakah tugas asli telah selesai.
    - Panduan tindak lanjut yang memberi tahu agen peminta untuk melanjutkan tugas atau mencatat tindak lanjut ketika hasil agen turunan masih menyisakan tindakan.
    - Instruksi pembaruan akhir untuk jalur tanpa tindakan lebih lanjut, ditulis dengan gaya asisten biasa tanpa meneruskan metadata internal mentah.

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` menggantikan nilai default untuk proses tertentu tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan keluaran setelah selesai.
    - Untuk sesi persisten yang terikat utas, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Jika saluran peminta tidak mendukung pengikatan utas, gunakan `mode: "run"` alih-alih mencoba kembali kombinasi terikat utas yang mustahil.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengiklankan runtime tersebut. Lihat [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat melakukan debug penyelesaian atau perulangan antaragen. Ketika Plugin `codex` diaktifkan, kontrol obrolan/utas Codex sebaiknya mengutamakan `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak berada dalam sandbox, dan Plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime subagen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Subagen native dimulai secara terisolasi kecuali pemanggil secara eksplisit meminta
pencabangan transkrip saat ini.

| Mode       | Waktu penggunaan                                                                                                                        | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat yang lambat, atau apa pun yang dapat dijelaskan secara ringkas dalam teks tugas      | Membuat transkrip agen turunan yang bersih. Ini adalah nilai default dan menjaga penggunaan token tetap lebih rendah. |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi agen turunan sebelum agen turunan dimulai. |

Gunakan `fork` secara hemat. Mode ini ditujukan untuk pendelegasian yang sensitif terhadap konteks, bukan
pengganti penulisan perintah tugas yang jelas.

## Alat: `sessions_spawn`

Memulai proses subagen dengan `deliver: false` pada jalur global `subagent`,
lalu menjalankan langkah pengumuman dan memposting balasan pengumuman ke saluran
obrolan peminta.

Ketersediaan bergantung pada kebijakan alat efektif milik pemanggil. Profil bawaan
`coding` mencakup `sessions_spawn`; `messaging` dan `minimal` tidak
mencakupnya. `full` mengizinkan setiap alat. Tambahkan `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, atau gunakan `tools.profile: "coding"`, untuk
agen dengan profil lebih terbatas yang tetap harus mendelegasikan pekerjaan.
Kebijakan izin/tolak untuk saluran/grup, penyedia, sandbox, dan per agen
masih dapat menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Nilai default:**

- **Model:** subagen native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen). Pembuatan runtime ACP menggunakan model subagen terkonfigurasi yang sama jika tersedia; jika tidak, harness ACP mempertahankan nilai defaultnya sendiri. `sessions_spawn.model` yang ditetapkan secara eksplisit tetap diprioritaskan.
- **Pemikiran:** subagen native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen). Pembuatan runtime ACP juga menerapkan `agents.defaults.models["provider/model"].params.thinking` untuk model yang dipilih. `sessions_spawn.thinking` yang ditetapkan secara eksplisit tetap diprioritaskan.
- **Batas waktu proses:** OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` jika ditetapkan; jika tidak, nilainya kembali ke `0` (tanpa batas waktu). `sessions_spawn` tidak menerima penggantian batas waktu per panggilan.
- **Pengiriman tugas:** subagen native menerima tugas yang didelegasikan dalam pesan `[Subagent Task]` pertama yang terlihat. Perintah sistem subagen membawa aturan runtime dan konteks perutean, bukan duplikat tugas tersembunyi.

Pembuatan subagen native yang diterima menyertakan metadata model agen turunan yang telah ditetapkan
dalam hasil alat: `resolvedModel` berisi referensi model yang diterapkan dan
`resolvedProvider` berisi prefiks penyedia ketika referensi tersebut memilikinya.

### Mode perintah pendelegasian

`agents.defaults.subagents.delegationMode` hanya mengontrol panduan perintah; pengaturan ini tidak mengubah kebijakan alat atau memberlakukan pendelegasian.

- `suggest` (default): mempertahankan dorongan perintah standar untuk menggunakan subagen bagi pekerjaan yang lebih besar atau lebih lambat.
- `prefer`: memberi tahu agen utama agar tetap responsif dan mendelegasikan segala sesuatu yang lebih rumit daripada balasan langsung melalui `sessions_spawn`.

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
  Nama pengenal stabil opsional untuk mengidentifikasi turunan tertentu dalam keluaran status selanjutnya. Harus cocok dengan `[a-z][a-z0-9_-]{0,63}` dan tidak boleh berupa target yang dicadangkan seperti `last` atau `all`.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang mudah dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Buat di bawah id agen lain yang dikonfigurasi jika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja tugas opsional untuk eksekusi turunan. Subagen native tetap memuat berkas bootstrap dari ruang kerja agen target; `cwd` hanya mengubah tempat alat runtime dan harness CLI mengerjakan tugas yang didelegasikan.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Hanya ACP. Melanjutkan sesi harness ACP yang sudah ada saat `runtime: "acp"`; diabaikan untuk pembuatan subagen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Hanya ACP. Mengalirkan keluaran eksekusi ACP ke sesi induk saat `runtime: "acp"`; hilangkan untuk pembuatan subagen native.
</ParamField>
<ParamField path="model" type="string">
  Ganti model subagen. Nilai yang tidak valid dilewati dan subagen berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Ganti tingkat penalaran untuk eksekusi subagen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Saat `true`, meminta pengikatan utas kanal untuk sesi subagen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default berubah menjadi `session`. `mode: "session"` memerlukan `thread: true`.
  Jika pengikatan utas tidak tersedia untuk kanal peminta, gunakan `mode: "run"` sebagai gantinya.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` segera mengarsipkan sesi setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak pembuatan kecuali runtime turunan target berjalan dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke sesi turunan. Hanya untuk subagen native. Pembuatan yang terikat utas menggunakan default `fork`; pembuatan tanpa utas menggunakan default `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman kanal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Subagen native melaporkan
giliran asisten terbaru mereka kembali kepada peminta; pengiriman eksternal tetap
ditangani oleh agen induk/peminta.
</Warning>

### Nama tugas dan penargetan

`taskName` adalah nama pengenal yang ditujukan untuk model guna orkestrasi, bukan kunci sesi.
Gunakan untuk nama turunan stabil seperti `review_subagents`,
`linux_validation`, atau `docs_update` saat koordinator mungkin perlu memeriksa
turunan tersebut nanti.

Resolusi target menerima kecocokan persis `taskName` dan prefiks yang tidak ambigu.
Pencocokan dibatasi pada jendela target aktif/terbaru yang sama seperti yang digunakan
oleh target `/subagents` bernomor, sehingga turunan selesai yang sudah usang tidak membuat
nama pengenal yang digunakan kembali menjadi ambigu. Jika dua turunan aktif atau terbaru
memiliki `taskName` yang sama, target menjadi ambigu; gunakan indeks daftar, kunci sesi,
atau id eksekusi sebagai gantinya.

Target yang dicadangkan `last` dan `all` bukan nilai `taskName` yang valid
karena keduanya sudah memiliki makna kontrol.

## Alat: `sessions_yield`

Mengakhiri giliran model saat ini dan menunggu peristiwa runtime, terutama
peristiwa penyelesaian subagen, tiba sebagai pesan berikutnya. Gunakan setelah
membuat pekerjaan turunan yang diperlukan ketika peminta tidak dapat menghasilkan
jawaban akhir sampai penyelesaian tersebut tiba.

`sessions_yield` adalah primitif penantian. Jangan menggantinya dengan perulangan
polling pada `subagents`, `sessions_list`, `sessions_history`, perintah shell
`sleep`, atau polling proses hanya untuk mendeteksi penyelesaian turunan.

Gunakan `sessions_yield` hanya jika daftar alat efektif sesi menyertakannya.
Beberapa profil alat minimal atau khusus mungkin menyediakan `sessions_spawn` dan
`subagents` tanpa menyediakan `sessions_yield`; dalam hal tersebut, jangan membuat
perulangan polling hanya untuk menunggu penyelesaian.

Saat terdapat turunan aktif, OpenClaw menyisipkan blok perintah ringkas buatan runtime
`Subagen Aktif` ke dalam giliran normal agar peminta dapat melihat
sesi turunan, id eksekusi, status, label, tugas, dan alias `taskName`
saat ini tanpa polling. Bidang tugas dan label dalam blok tersebut
dikutip sebagai data, bukan instruksi, karena dapat berasal dari argumen pembuatan
yang diberikan pengguna/model.

## Alat: `subagents`

Mencantumkan eksekusi subagen yang dibuat dan dimiliki oleh sesi peminta. Cakupannya
terbatas pada peminta saat ini; turunan hanya dapat melihat turunan yang dikendalikannya sendiri.

Gunakan `subagents` untuk status sesuai permintaan dan pengawakutuan. Gunakan `sessions_yield` untuk
menunggu peristiwa penyelesaian.

## Sesi terikat utas

Saat pengikatan utas diaktifkan untuk suatu kanal, subagen dapat tetap terikat
pada utas sehingga pesan pengguna lanjutan di utas tersebut terus dirutekan ke
sesi subagen yang sama.

### Kanal yang mendukung utas

Suatu kanal mendukung sesi subagen persisten yang terikat utas
(`sessions_spawn` dengan `thread: true`) saat mendaftarkan adaptor pengikatan
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
    Gunakan `/session idle` untuk memeriksa/memperbarui penghentian fokus otomatis karena tidak aktif dan
    `/session max-age` untuk mengontrol batas maksimum mutlak.
  </Step>
  <Step title="Lepaskan">
    Gunakan `/unfocus` untuk melepaskan secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah           | Efek                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `/focus <target>`  | Mengikat utas saat ini (atau membuatnya) ke target subagen/sesi                                     |
| `/unfocus`         | Menghapus pengikatan untuk utas yang saat ini terikat                                                |
| `/agents`          | Mencantumkan eksekusi aktif dan status pengikatan (`binding:<id>`, `unbound`, atau `bindings unavailable`) |
| `/session idle`    | Memeriksa/memperbarui penghentian fokus otomatis saat tidak aktif (hanya utas terikat yang difokuskan) |
| `/session max-age` | Memeriksa/memperbarui batas maksimum mutlak (hanya utas terikat yang difokuskan)                      |

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
  Daftar izin agen target terkonfigurasi default yang digunakan saat agen peminta tidak menetapkan `subagents.allowAgents` sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Memblokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Penggantian per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Batas waktu per panggilan untuk upaya pengiriman pengumuman `agent` oleh gateway. Nilainya berupa milidetik bilangan bulat positif dan dibatasi hingga nilai maksimum pewaktu yang aman bagi platform. Percobaan ulang sementara dapat membuat total waktu tunggu pengumuman lebih lama daripada satu batas waktu yang dikonfigurasi.
</ParamField>

Jika sesi peminta berjalan dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan bagi
`sessions_spawn`. Respons menyertakan model efektif dan metadata runtime tertanam
dari setiap agen yang dicantumkan agar pemanggil dapat membedakan OpenClaw, server aplikasi Codex,
dan runtime native terkonfigurasi lainnya.

Entri `allowAgents` harus menunjuk ke id agen yang dikonfigurasi dalam `agents.list[]`.
`["*"]` berarti agen target terkonfigurasi apa pun beserta peminta. Jika konfigurasi agen
dihapus tetapi id-nya tetap ada dalam `allowAgents`, `sessions_spawn` menolak id tersebut
dan `agents_list` menghilangkannya. Jalankan `openclaw doctor --fix` untuk membersihkan
entri daftar izin yang sudah usang, atau tambahkan entri minimal `agents.list[]` jika target harus
tetap dapat dibuat sambil mewarisi default.

### Pengarsipan otomatis

- Sesi subagen otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Pengarsipan menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` segera mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
- Pengarsipan otomatis bersifat upaya terbaik; pewaktu tertunda hilang jika gateway dimulai ulang.
- Batas waktu eksekusi yang dikonfigurasi **tidak** mengarsipkan secara otomatis; batas tersebut hanya menghentikan eksekusi. Sesi tetap ada hingga pengarsipan otomatis.
- Pengarsipan otomatis berlaku sama untuk sesi kedalaman-1 dan kedalaman-2.
- Pembersihan peramban terpisah dari pembersihan arsip: tab/proses peramban yang dilacak ditutup dengan upaya terbaik saat eksekusi selesai, meskipun catatan transkrip/sesi disimpan.

## Subagen bertingkat

Secara default, subagen tidak dapat membuat subagen mereka sendiri
(`maxSpawnDepth: 1`). Tetapkan `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
penyarangan — **pola orkestrator**: utama → subagen orkestrator →
sub-subagen pekerja.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // mengizinkan subagen membuat turunan (default: 1, rentang 1-5)
        maxChildrenPerAgent: 5, // maksimum turunan aktif per sesi agen (default: 5, rentang 1-20)
        maxConcurrent: 8, // batas jalur konkurensi global (default: 8)
        runTimeoutSeconds: 900, // batas waktu default untuk sessions_spawn (0 = tanpa batas waktu)
        announceTimeoutMs: 120000, // batas waktu pengumuman gateway per panggilan
      },
    },
  },
}
```

### Tingkat kedalaman

| Kedalaman | Bentuk kunci sesi                            | Peran                                               | Dapat membuat turunan?           |
| ---------- | -------------------------------------------- | --------------------------------------------------- | -------------------------------- |
| 0          | `agent:<id>:main`                            | Agen utama                                          | Selalu                           |
| 1          | `agent:<id>:subagent:<uuid>`                 | Subagen (orkestrator jika kedalaman 2 diizinkan)    | Hanya jika `maxSpawnDepth >= 2`  |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagen (pekerja daun)                          | Tidak pernah                     |

### Rantai pengumuman

Hasil mengalir kembali ke atas melalui rantai:

1. Pekerja kedalaman 2 selesai → mengumumkan kepada induknya (orkestrator kedalaman 1).
2. Orkestrator kedalaman 1 menerima pengumuman, menyintesis hasil, lalu selesai → mengumumkan kepada agen utama.
3. Agen utama menerima pengumuman dan menyampaikannya kepada pengguna.

Setiap tingkat hanya melihat pengumuman dari anak langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan anak satu kali dan tunggu peristiwa
penyelesaian, alih-alih membuat perulangan polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah tidur `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi anak tetap
berfokus pada pekerjaan aktif — anak yang aktif tetap terlampir, anak yang
telah berakhir tetap terlihat selama jendela waktu singkat, dan tautan anak
usang yang hanya ada di penyimpanan diabaikan setelah melewati jendela
kesegarannya. Ini mencegah metadata `spawnedBy` / `parentSessionKey` lama
menghidupkan kembali anak siluman setelah mulai ulang. Jika peristiwa
penyelesaian anak tiba setelah Anda mengirim jawaban akhir, tindak lanjut
yang benar adalah token senyap persis `NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan kedalaman

- Peran dan cakupan kontrol ditulis ke metadata sesi saat pembuatan. Hal ini mencegah kunci sesi datar atau yang dipulihkan mendapatkan kembali hak istimewa orkestrator secara tidak sengaja.
- **Kedalaman 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat membuat anak dan memeriksa statusnya. Alat sesi/sistem lainnya tetap ditolak.
- **Kedalaman 1 (daun, saat `maxSpawnDepth == 1`):** tidak ada alat sesi (perilaku bawaan saat ini).
- **Kedalaman 2 (pekerja daun):** tidak ada alat sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat membuat anak lebih lanjut.

### Batas pembuatan per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki paling banyak
`maxChildrenPerAgent` (bawaan `5`) anak aktif pada satu waktu. Ini mencegah
penyebaran tak terkendali dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator kedalaman 1 secara otomatis menghentikan semua
anak kedalaman 2 miliknya:

- `/stop` di obrolan utama menghentikan semua agen kedalaman 1 dan meneruskannya ke anak kedalaman 2 mereka.

## Autentikasi

Autentikasi subagen ditentukan berdasarkan **ID agen**, bukan jenis sesi:

- Kunci sesi subagen adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan autentikasi dimuat dari `agentDir` milik agen tersebut.
- Profil autentikasi agen utama digabungkan sebagai **cadangan**; profil agen menggantikan profil utama jika terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
cadangan. Autentikasi yang sepenuhnya terisolasi per agen belum didukung.

## Pengumuman

Subagen melaporkan kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi subagen (bukan sesi peminta).
- Jika subagen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, keluaran pengumuman disembunyikan meskipun sebelumnya terdapat progres yang terlihat.

Pengiriman bergantung pada kedalaman peminta:

- Sesi peminta tingkat teratas menggunakan panggilan `agent` lanjutan dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bertingkat menerima injeksi lanjutan internal (`deliver=false`) agar orkestrator dapat menyintesis hasil anak di dalam sesi.
- Jika sesi subagen peminta bertingkat sudah tidak ada, OpenClaw kembali ke peminta sesi tersebut jika tersedia.

Untuk sesi peminta tingkat teratas, pengiriman langsung dalam mode
penyelesaian terlebih dahulu menentukan rute percakapan/utas yang terikat
dan penggantian hook, lalu mengisi bidang kanal-target yang belum tersedia
dari rute tersimpan milik sesi peminta. Hal ini menjaga penyelesaian tetap
berada di obrolan/topik yang tepat meskipun asal penyelesaian hanya
mengidentifikasi kanal.

Agregasi penyelesaian anak dibatasi pada proses peminta saat ini ketika
membangun temuan penyelesaian bertingkat, sehingga keluaran anak usang
dari proses sebelumnya tidak bocor ke pengumuman saat ini. Balasan
pengumuman mempertahankan perutean utas/topik jika tersedia pada adaptor
kanal.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:

| Bidang         | Sumber                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                           |
| ID sesi        | Kunci/ID sesi anak                                                                                               |
| Jenis          | Jenis pengumuman + label tugas                                                                                   |
| Status         | Diturunkan dari hasil runtime (`ok`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Isi hasil      | Teks asisten terbaru yang terlihat dari anak                                                                     |
| Tindak lanjut  | Instruksi yang menjelaskan kapan harus membalas atau tetap diam                                                  |

Proses terminal yang gagal melaporkan status kegagalan tanpa memutar ulang
teks balasan yang tertangkap. Keluaran alat/hasil alat tidak dipromosikan
menjadi teks hasil anak.

### Baris statistik

Payload pengumuman menyertakan baris statistik di bagian akhir (bahkan saat dibungkus):

- Runtime (misalnya `runtime 5m12s`).
- Penggunaan token (masukan/keluaran/total).
- Perkiraan biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan jalur transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa berkas di disk.

Metadata internal hanya ditujukan untuk orkestrasi; balasan kepada pengguna
harus ditulis ulang dengan gaya asisten yang wajar.

### Mengapa memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman untuk membaca
transkrip anak dari dalam giliran agen:

- Menyamarkan teks yang menyerupai kredensial/token meskipun penyamaran log serbaguna dinonaktifkan.
- Memotong blok teks panjang (4000 karakter per blok) dan membuang tanda tangan pemikiran, payload pemutaran ulang penalaran, serta data gambar sebaris.
- Menerapkan batas respons 80 KB; baris yang terlalu besar diganti dengan `[sessions_history omitted: message too large]`.
- Gunakan `nextOffset` jika tersedia untuk menelusuri mundur jendela transkrip yang lebih lama.
- `sessions_history` **tidak** menghapus tag penalaran, perancah `<relevant-memories>`, atau XML panggilan alat dari teks pesan — fungsi ini mengembalikan blok konten terstruktur yang mendekati bentuk transkrip mentah, hanya disamarkan dan dibatasi ukurannya. `/subagents log` menerapkan pembersih prosa yang lebih ketat (menghapus tag penalaran, perancah memori, dan XML panggilan alat) karena perintah tersebut merender baris obrolan biasa, bukan blok terstruktur.
- Pemeriksaan transkrip mentah di disk adalah cadangan saat Anda membutuhkan transkrip lengkap yang identik bita demi bita.

## Kebijakan alat

Subagen terlebih dahulu menggunakan profil dan alur kebijakan alat yang sama
seperti agen induk atau target. Setelah itu, OpenClaw menerapkan lapisan
pembatasan subagen.

Subagen selalu kehilangan `gateway`, `agents_list`, `session_status`, dan
`cron` tanpa memandang kedalaman atau peran (alat tingkat sistem/interaktif,
atau alat yang seharusnya dikoordinasikan oleh agen utama). Subagen daun
(perilaku bawaan kedalaman 1, dan selalu pada kedalaman 2) juga kehilangan
`subagents`, `sessions_list`, `sessions_history`, dan `sessions_spawn`.
Subagen tidak pernah mendapatkan alat `message` — alat tersebut dinonaktifkan
saat pembuatan, bukan disaring oleh daftar penolakan ini — dan `sessions_send`
tetap ditolak agar subagen hanya berkomunikasi melalui rantai pengumuman.

`sessions_history` juga tetap menjadi tampilan pengingatan yang dibatasi dan
dibersihkan di sini — bukan dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, subagen orkestrator kedalaman 1 juga menerima
`sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` agar
dapat mengelola anak-anaknya.

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
        // jika allow ditetapkan, kebijakan menjadi hanya-izinkan (penolakan tetap menang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` adalah filter akhir yang hanya mengizinkan.
Filter ini dapat mempersempit kumpulan alat yang telah ditentukan, tetapi
tidak dapat **menambahkan kembali** alat yang dihapus oleh `tools.profile`.
Sebagai contoh, `tools.profile: "coding"` menyertakan
`web_search`/`web_fetch`, tetapi tidak menyertakan alat `browser`. Agar
subagen dengan profil pengodean dapat menggunakan otomatisasi peramban,
tambahkan peramban pada tahap profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gunakan `agents.list[].tools.alsoAllow: ["browser"]` per agen jika hanya satu
agen yang boleh mendapatkan otomatisasi peramban.

## Konkurensi

Subagen menggunakan jalur antrean dalam proses khusus:

- **Nama jalur:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (bawaan `8`)

## Keaktifan dan pemulihan

OpenClaw tidak menganggap ketiadaan `endedAt` sebagai bukti permanen bahwa
subagen masih aktif. Proses yang belum berakhir dan lebih lama daripada
jendela proses usang (2 jam, atau batas waktu proses yang dikonfigurasi
ditambah masa tenggang singkat, mana pun yang lebih lama) berhenti dihitung
sebagai aktif/tertunda dalam `/subagents list`, ringkasan status, gerbang
penyelesaian turunan, dan pemeriksaan konkurensi per sesi.

Setelah Gateway dimulai ulang, proses usang yang dipulihkan tetapi belum
berakhir akan dipangkas kecuali sesi anaknya ditandai
`abortedLastRun: true`. Proses yang dibatalkan akibat mulai ulang tetap
terdaftar untuk alur pemulihan subagen yatim: proses usang diselesaikan tanpa
melanjutkan, sementara sesi anak yang masih baru menerima pesan lanjutan
sintetis sebelum penanda pembatalan dihapus.

Pemulihan mulai ulang otomatis dibatasi per sesi anak. Jika anak subagen yang
sama berulang kali diterima untuk pemulihan yatim di dalam jendela kemacetan
ulang cepat, OpenClaw menyimpan batu nisan pemulihan pada sesi tersebut dan
berhenti melanjutkannya secara otomatis pada mulai ulang berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus tanda pemulihan terbatal yang usang
pada sesi berbatu nisan.

<Note>
Jika pembuatan subagen gagal dengan `PAIRING_REQUIRED` /
`scope-upgrade` dari Gateway, periksa pemanggil RPC sebelum mengubah status
penyandingan. Koordinasi internal `sessions_spawn` didistribusikan di dalam
proses saat pemanggil sudah berjalan dalam konteks permintaan Gateway,
sehingga tidak membuka WebSocket local loopback atau bergantung pada garis
dasar cakupan perangkat tersanding milik CLI. Pemanggil di luar proses
Gateway tetap menggunakan cadangan WebSocket sebagai
`client.id: "gateway-client"` dengan `client.mode: "backend"` melalui
autentikasi token bersama/kata sandi local loopback langsung. Pemanggil
jarak jauh, `deviceIdentity` eksplisit, jalur token perangkat eksplisit,
serta klien peramban/Node tetap memerlukan persetujuan perangkat biasa
untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` di obrolan peminta membatalkan sesi peminta dan menghentikan semua proses subagen aktif yang dibuat darinya, lalu meneruskannya ke anak bertingkat.

## Batasan

- Pengumuman subagen bersifat **upaya terbaik**. Jika Gateway dimulai ulang, pekerjaan "announce back" yang tertunda akan hilang.
- Subagen tetap berbagi sumber daya proses Gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu nonpemblokiran: fungsi ini segera mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`). Subagen bawaan Codex mengikuti batasan yang sama: `TOOLS.md` tetap berada dalam instruksi utas Codex yang diwarisi, sedangkan berkas persona, identitas, dan pengguna khusus induk disuntikkan sebagai instruksi kolaborasi yang cakupannya terbatas pada giliran agar agen anak tidak menyalinnya.
- Kedalaman penyarangan maksimum adalah 5 (rentang `maxSpawnDepth`: 1-5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi jumlah agen anak aktif per sesi (nilai bawaan `5`, rentang `1-20`).

## Terkait

- [Alat sesi dan perubahan status](/id/concepts/session-tool)
- [Agen ACP](/id/tools/acp-agents)
- [Pengiriman agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multiagen](/id/tools/multi-agent-sandbox-tools)
