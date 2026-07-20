---
read_when:
    - Anda menginginkan pekerjaan latar belakang atau paralel melalui agen
    - Anda sedang mengubah kebijakan alat sessions_spawn atau sub-agent
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat pada utas
sidebarTitle: Sub-agents
summary: Jalankan agen latar belakang terisolasi yang mengumumkan hasil kembali ke obrolan peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-07-20T03:56:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c8f63a6c1cd6a34f9bae067bbd63d1e3c8223beffb52f06b6689f161c8f9a1ce
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah proses agen latar belakang yang dibuat dari proses agen yang sudah ada.
Masing-masing berjalan dalam sesinya sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke kanal obrolan peminta.
Setiap proses sub-agen dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Tujuan:

- Memparalelkan riset, tugas panjang, dan pekerjaan alat yang lambat tanpa memblokir proses utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi, sandbox opsional).
- Menjaga agar permukaan alat sulit disalahgunakan: sub-agen secara default **tidak** mendapatkan alat sesi atau pesan.
- Mendukung kedalaman bertingkat yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** setiap sub-agen memiliki konteks dan penggunaan tokennya sendiri secara
default. Untuk tugas berat atau berulang, tetapkan model yang lebih murah bagi sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi melalui
`agents.defaults.subagents.model` atau penggantian per agen. Ketika agen anak
benar-benar memerlukan transkrip peminta saat ini, buat agen tersebut dengan
`context: "fork"`. Sesi sub-agen yang terikat utas secara default menggunakan
`context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini ke dalam
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
proses; tambahkan token `tools` untuk menyertakan pesan pemanggilan/hasil alat (secara
default dihilangkan). Gunakan `sessions_history` untuk tampilan pengingatan kembali yang
terbatas dan difilter demi keamanan dari dalam giliran agen, atau periksa jalur transkrip pada diska untuk
transkrip lengkap mentah.

Di UI Kontrol, sesi induk dengan proses anak terbaru memiliki baris bilah sisi yang dapat diperluas.
Baris bertingkat menampilkan status dan waktu berjalan agen anak, dan memilih salah satunya
akan membuka obrolan agen anak tersebut sambil mempertahankan hierarki induk.

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

### Perilaku pembuatan

Agen memulai sub-agen latar belakang dengan alat `sessions_spawn`.
Penyelesaian dikembalikan sebagai peristiwa internal sesi induk; agen induk/peminta
menentukan apakah pembaruan yang terlihat oleh pengguna diperlukan.

<AccordionGroup>
  <Accordion title="Penyelesaian nonblokir berbasis push">
    - `sessions_spawn` bersifat nonblokir; alat tersebut segera mengembalikan id proses.
    - Saat selesai, sub-agen melaporkan kembali ke sesi induk/peminta.
    - Giliran agen yang memerlukan hasil agen anak harus memanggil `sessions_yield` setelah membuat pekerjaan yang diperlukan. Tindakan tersebut mengakhiri giliran saat ini dan memungkinkan peristiwa penyelesaian tiba sebagai pesan berikutnya yang terlihat oleh model.
    - Penyelesaian berbasis push. Setelah dibuat, **jangan** melakukan polling terhadap `/subagents list`, `sessions_list`, atau `sessions_history` dalam suatu perulangan hanya untuk menunggu hingga selesai; periksa status sesuai kebutuhan hanya saat melakukan debug.
    - Keluaran agen anak adalah laporan/bukti yang harus disintesis oleh agen peminta. Keluaran tersebut bukan teks instruksi yang ditulis pengguna dan tidak dapat menggantikan kebijakan sistem, pengembang, atau pengguna.
    - Saat selesai, OpenClaw melakukan upaya terbaik untuk menutup tab/proses peramban terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman dilanjutkan.

  </Accordion>
  <Accordion title="Pengiriman penyelesaian">
    - OpenClaw menyerahkan penyelesaian kembali ke sesi peminta melalui giliran `agent` dengan kunci idempotensi yang stabil.
    - Jika proses peminta masih aktif, OpenClaw terlebih dahulu mencoba membangunkan/mengarahkan proses tersebut alih-alih memulai jalur balasan terlihat kedua.
    - Jika peminta aktif tidak dapat dibangunkan, OpenClaw beralih ke serah terima kepada agen peminta dengan konteks penyelesaian yang sama alih-alih membuang pengumuman.
    - Serah terima induk yang berhasil menyelesaikan pengiriman sub-agen bahkan ketika induk memutuskan bahwa pembaruan pengguna yang terlihat tidak diperlukan.
    - Sub-agen native tidak mendapatkan alat pesan. Sub-agen mengembalikan teks asisten biasa kepada agen induk/peminta; balasan yang terlihat oleh manusia tetap dikelola oleh kebijakan pengiriman normal agen induk/peminta.
    - Jika serah terima langsung tidak dapat digunakan, pengiriman beralih ke perutean antrean, kemudian ke percobaan ulang singkat dengan jeda eksponensial atas pengumuman sebelum akhirnya menyerah.
    - Pengiriman mempertahankan rute peminta yang telah diselesaikan: rute penyelesaian yang terikat utas atau terikat percakapan diutamakan jika tersedia. Jika asal penyelesaian hanya menyediakan kanal, OpenClaw mengisi target/akun yang hilang dari rute terselesaikan milik sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata serah terima penyelesaian">
    Serah terima penyelesaian ke sesi peminta merupakan konteks internal yang dihasilkan
    saat runtime (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat dari agen anak. Keluaran alat/toolResult tidak dinaikkan menjadi hasil agen anak. Proses yang gagal secara terminal tidak menggunakan kembali teks balasan yang telah ditangkap.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token yang ringkas.
    - Instruksi review yang meminta agen peminta memverifikasi hasil sebelum menentukan apakah tugas awal telah selesai.
    - Panduan tindak lanjut yang meminta agen peminta melanjutkan tugas atau mencatat tindak lanjut ketika hasil agen anak masih menyisakan tindakan.
    - Instruksi pembaruan akhir untuk jalur tanpa tindakan lanjutan, ditulis dengan gaya asisten normal tanpa meneruskan metadata internal mentah.

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` menggantikan default untuk proses tertentu tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan keluaran setelah penyelesaian.
    - Untuk sesi persisten yang terikat utas, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Jika kanal peminta tidak mendukung pengikatan utas, gunakan `mode: "run"` alih-alih mencoba ulang kombinasi terikat utas yang tidak mungkin.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengiklankan runtime tersebut. Lihat [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat melakukan debug terhadap penyelesaian atau perulangan antaragen. Ketika plugin `codex` diaktifkan, kontrol obrolan/utas Codex sebaiknya mengutamakan `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak berada dalam sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native dimulai secara terisolasi kecuali pemanggil secara eksplisit meminta untuk mencabangkan
transkrip saat ini.

| Mode       | Waktu penggunaan                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat yang lambat, atau apa pun yang dapat dijelaskan dalam teks tugas                           | Membuat transkrip agen anak yang bersih. Ini adalah default dan menjaga penggunaan token tetap lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi agen anak sebelum agen anak dimulai. |

Gunakan `fork` secara hemat. Mode tersebut ditujukan untuk delegasi yang peka konteks, bukan
pengganti penulisan prompt tugas yang jelas.

## Alat: `sessions_spawn`

Memulai proses sub-agen dengan `deliver: false` pada lajur global `subagent`,
kemudian menjalankan langkah pengumuman dan memposting balasan pengumuman ke kanal
obrolan peminta.

Ketersediaan bergantung pada kebijakan alat efektif pemanggil. Profil bawaan
`coding` dan `messaging` mencakup `sessions_spawn`,
`sessions_yield`, dan `subagents`; `minimal` tidak. `full` mengizinkan setiap
alat. Tambahkan alat tersebut dengan `tools.alsoAllow`, atau gunakan salah satu profil
di atas, untuk agen dengan profil khusus yang lebih sempit tetapi tetap harus
mendelegasikan pekerjaan.
Kebijakan izinkan/tolak kanal/grup, penyedia, sandbox, dan per agen
tetap dapat menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** sub-agen native mewarisi model pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen). Pembuatan runtime ACP menggunakan model sub-agen terkonfigurasi yang sama jika tersedia; jika tidak, harness ACP mempertahankan defaultnya sendiri. `sessions_spawn.model` yang eksplisit tetap diutamakan.
- **Pemikiran:** sub-agen native mewarisi pemikiran pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen). Pembuatan runtime ACP juga menerapkan `agents.defaults.models["provider/model"].params.thinking` untuk model yang dipilih. `sessions_spawn.thinking` yang eksplisit tetap diutamakan.
- **Batas waktu proses:** OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` jika ditetapkan; jika tidak, OpenClaw beralih ke `0` (tanpa batas waktu). `sessions_spawn` tidak menerima penggantian batas waktu per panggilan.
- **Masa hidup proses:** sub-agen OpenClaw yang dilepas memiliki siklus hidup prosesnya sendiri. Tugas latar belakang yang dibuat di dalam backend CLI eksternal berbeda: tugas tersebut berbagi subproses CLI induk dan berhenti jika induk tersebut mencapai `agents.defaults.timeoutSeconds`.
- **Pengiriman tugas:** sub-agen native menerima tugas yang didelegasikan dalam pesan `[Subagent Task]` pertama yang terlihat. Prompt sistem sub-agen memuat aturan runtime dan konteks perutean, bukan duplikat tersembunyi dari tugas tersebut.

Pembuatan sub-agen native yang diterima menyertakan metadata model agen anak yang telah diselesaikan
dalam hasil alat: `resolvedModel` berisi referensi model yang diterapkan dan
`resolvedProvider` berisi prefiks penyedia jika referensi tersebut memilikinya.

### Mode prompt delegasi

`agents.defaults.subagents.delegationMode` hanya mengontrol panduan prompt; ini tidak mengubah kebijakan alat atau memberlakukan delegasi.

- `suggest` (default): mempertahankan dorongan prompt standar untuk menggunakan sub-agen bagi pekerjaan yang lebih besar atau lebih lambat.
- `prefer`: meminta agen utama tetap responsif dan mendelegasikan apa pun yang lebih rumit daripada balasan langsung melalui `sessions_spawn`.

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
  Pegangan stabil opsional untuk mengidentifikasi turunan tertentu dalam keluaran status selanjutnya. Harus cocok dengan `[a-z][a-z0-9_-]{0,63}` dan tidak boleh berupa target yang dicadangkan seperti `last` atau `all`.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang mudah dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Buat di bawah id agen lain yang dikonfigurasi jika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja tugas opsional untuk proses turunan. Subagen native tetap memuat file bootstrap dari ruang kerja agen target; `cwd` hanya mengubah lokasi tempat alat runtime dan harness CLI melakukan pekerjaan yang didelegasikan.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang ada saat `runtime: "acp"`; diabaikan untuk pembuatan subagen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Mengalirkan keluaran proses ACP ke sesi induk saat `runtime: "acp"`; hilangkan untuk pembuatan subagen native.
</ParamField>
<ParamField path="model" type="string">
  Timpa model subagen. Nilai yang tidak valid dilewati dan subagen berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Timpa tingkat penalaran untuk proses subagen. Tidak tersedia dengan `visible: true`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Saat `true`, meminta pengikatan utas kanal untuk sesi subagen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
  Jika pengikatan utas tidak tersedia untuk kanal peminta, gunakan `mode: "run"` sebagai gantinya.
  Dengan `visible: true`, hilangkan `mode`; sesi yang terlihat bersifat persisten dan tidak mendukung `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` mengarsipkan sesi segera setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak pembuatan kecuali runtime turunan target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke dalam sesi turunan. Khusus subagen native. Pembuatan yang terikat utas menggunakan default `fork`; pembuatan yang tidak terikat utas menggunakan default `isolated`. Fork yang terlihat harus menargetkan agen yang sama dengan peminta.
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  Buat sesi dasbor persisten yang dapat dibuka pengguna di Control UI. Pembuatan yang terlihat hanya mendukung `runtime: "subagent"` dan selalu mempertahankan sesi yang dibuat.
</ParamField>
<ParamField path="worktree" type="boolean" default="false">
  Sediakan worktree git terkelola untuk sesi dasbor baru. Memerlukan `visible: true`.
</ParamField>
<ParamField path="worktreeName" type="string">
  Nama worktree terkelola opsional. Memerlukan `visible: true` dan `worktree: true`.
</ParamField>
<ParamField path="worktreeBaseRef" type="string">
  Ref dasar git opsional untuk worktree terkelola. Memerlukan `visible: true` dan `worktree: true`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman kanal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Subagen native melaporkan
giliran asisten terbaru mereka kembali kepada peminta; pengiriman eksternal tetap menjadi tanggung jawab
agen induk/peminta.
</Warning>

Dengan `visible: true`, `model`, `cwd`, dan `context: "fork"` dari agen yang sama didukung. Target yang berada dalam sandbox membatasi `cwd` ke ruang kerja agen tersebut. Pengikatan utas, `mode`, penimpaan penalaran, `lightContext`, `attachments`, dan `attachAs` tidak tersedia pada jalur ini karena sesi yang terlihat adalah sesi dasbor persisten yang dibuat melalui `sessions.create`. Pembuatan yang terlihat ditolak ketika peminta itu sendiri dibuat dengan daftar izin atau daftar larangan alat yang diwarisi; pembatasan tersebut ditetapkan saat pembuatan dan tidak memiliki penimpaan konfigurasi. Pencantuman dan pengalamatan sesi mengikuti `tools.sessions.visibility`; cakupan default `tree` mencakup sesi saat ini dan subpohon pembuatannya sendiri. Lihat [Worktree terkelola](/id/concepts/managed-worktrees) untuk perilaku penamaan checkout, penyiapan, pembersihan, dan pemulihan.

### Nama tugas dan penargetan

`taskName` adalah pegangan yang ditujukan bagi model untuk orkestrasi, bukan kunci sesi.
Gunakan untuk nama turunan yang stabil seperti `review_subagents`,
`linux_validation`, atau `docs_update` saat koordinator mungkin perlu memeriksa
turunan tersebut nanti.

Resolusi target menerima kecocokan persis `taskName` dan prefiks yang tidak ambigu.
Pencocokan dibatasi pada jendela target aktif/terbaru yang sama dengan yang digunakan
oleh target `/subagents` bernomor, sehingga turunan lama yang telah selesai tidak membuat
pegangan yang digunakan kembali menjadi ambigu. Jika dua turunan aktif atau terbaru memiliki
`taskName` yang sama, target menjadi ambigu; gunakan indeks daftar, kunci sesi, atau
id proses sebagai gantinya.

Target yang dicadangkan `last` dan `all` bukan nilai `taskName` yang valid
karena keduanya sudah memiliki makna kontrol.

## Alat: `sessions_yield`

Mengakhiri giliran model saat ini dan menunggu peristiwa runtime, terutama
peristiwa penyelesaian subagen, tiba sebagai pesan berikutnya. Gunakan setelah
membuat pekerjaan turunan yang diperlukan ketika peminta tidak dapat menghasilkan jawaban
akhir hingga penyelesaian tersebut tiba.

`sessions_yield` adalah primitif penantian. Jangan menggantinya dengan perulangan polling
atas `subagents`, `sessions_list`, `sessions_history`, shell
`sleep`, atau polling proses hanya untuk mendeteksi penyelesaian turunan.

Gunakan `sessions_yield` hanya ketika daftar alat efektif sesi menyertakannya.
Beberapa profil alat minimal atau khusus dapat mengekspos `sessions_spawn` dan
`subagents` tanpa mengekspos `sessions_yield`; dalam hal itu, jangan membuat
perulangan polling hanya untuk menunggu penyelesaian.

Ketika terdapat turunan aktif, OpenClaw menyisipkan blok prompt ringkas yang dihasilkan runtime
`Active Subagents` ke dalam giliran normal agar peminta dapat melihat
sesi turunan saat ini, id proses, status, label, tugas, dan alias
`taskName` tanpa polling. Bidang tugas dan label dalam blok tersebut
dikutip sebagai data, bukan instruksi, karena dapat berasal
dari argumen pembuatan yang diberikan pengguna/model.

## Alat: `subagents`

Mencantumkan proses subagen yang dibuat dan catatan tugas latar belakang yang dimiliki oleh
pohon sesi peminta. Baris tugas mencakup subagen native, proses ACP,
pekerjaan CLI/media Gateway, dan eksekusi Cron. Cakupannya terbatas pada peminta saat ini;
turunan hanya dapat melihat turunan yang dikendalikannya sendiri.

Gunakan `subagents` untuk status dan debugging sesuai permintaan. Gunakan `sessions_yield` untuk
menunggu peristiwa penyelesaian.

Gunakan `action: "cancel"` dengan `taskId` yang dikembalikan oleh `action: "list"` untuk menghentikan
tugas. Pembatalan dibatasi pada pohon sesi yang dikendalikan; subagen daun
tidak dapat membatalkan pekerjaan yang dimiliki sesi lain.

## Sesi terikat utas

Ketika pengikatan utas diaktifkan untuk sebuah kanal, subagen dapat tetap terikat
pada utas sehingga pesan pengguna lanjutan dalam utas tersebut tetap diarahkan ke
sesi subagen yang sama.

### Kanal yang mendukung utas

Sebuah kanal mendukung sesi subagen persisten yang terikat utas
(`sessions_spawn` dengan `thread: true`) ketika kanal tersebut mendaftarkan adaptor
pengikatan percakapan. Kanal bawaan dengan dukungan tersebut: **Discord**,
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
    OpenClaw membuat atau mengikat utas ke target sesi tersebut di kanal aktif.
  </Step>
  <Step title="Arahkan tindak lanjut">
    Balasan dan pesan lanjutan dalam utas tersebut diarahkan ke sesi yang terikat.
  </Step>
  <Step title="Periksa batas waktu">
    Gunakan `/session idle` untuk memeriksa/memperbarui pelepasan fokus otomatis akibat ketidakaktifan dan
    `/session max-age` untuk mengontrol batas maksimum tetap.
  </Step>
  <Step title="Lepaskan">
    Gunakan `/unfocus` untuk melepaskan secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah            | Efek                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Mengikat utas saat ini (atau membuatnya) ke target subagen/sesi                     |
| `/unfocus`         | Menghapus pengikatan untuk utas terikat saat ini                                           |
| `/agents`          | Mencantumkan proses aktif dan status pengikatan (`binding:<id>`, `unbound`, atau `bindings unavailable`) |
| `/session idle`    | Memeriksa/memperbarui pelepasan fokus otomatis saat menganggur (khusus utas terikat yang difokuskan)                             |
| `/session max-age` | Memeriksa/memperbarui batas maksimum tetap (khusus utas terikat yang difokuskan)                                      |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Penimpaan kanal dan kunci pengikatan otomatis saat pembuatan** bersifat khusus adaptor. Lihat [Kanal yang mendukung utas](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah garis miring](/id/tools/slash-commands) untuk detail adaptor terkini.

### Daftar izin

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen terkonfigurasi yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan target terkonfigurasi apa pun). Default: hanya agen peminta. Jika Anda menetapkan daftar dan masih ingin peminta membuat dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Daftar izin agen target terkonfigurasi default yang digunakan ketika agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil secara eksplisit). Penimpaan per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Batas waktu per panggilan untuk upaya pengiriman pengumuman `agent` Gateway. Nilainya berupa milidetik bilangan bulat positif dan dibatasi pada nilai maksimum pengatur waktu yang aman untuk platform. Percobaan ulang sementara dapat membuat total waktu tunggu pengumuman lebih lama daripada satu batas waktu yang dikonfigurasi.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons tersebut menyertakan model efektif dan metadata
runtime tersemat dari setiap agen yang tercantum agar pemanggil dapat membedakan OpenClaw, app-server Codex,
dan runtime native lain yang dikonfigurasi.

Entri `allowAgents` harus mengarah ke id agen yang dikonfigurasi di `agents.list[]`.
`["*"]` berarti setiap agen target yang dikonfigurasi beserta peminta. Jika konfigurasi agen
dihapus tetapi id-nya tetap ada di `allowAgents`, `sessions_spawn` menolak id tersebut
dan `agents_list` mengabaikannya. Jalankan `openclaw doctor --fix` untuk membersihkan
entri daftar izin yang sudah tidak berlaku, atau tambahkan entri `agents.list[]` minimal jika target harus
tetap dapat dibuat sambil mewarisi nilai default.

### Pengarsipan otomatis

- Sesi subagen diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Pengarsipan menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah pengumuman (transkrip tetap dipertahankan melalui penggantian nama).
- Pengarsipan otomatis bersifat upaya terbaik; timer yang tertunda akan hilang jika Gateway dimulai ulang.
- Batas waktu proses yang dikonfigurasi **tidak** mengarsipkan secara otomatis; batas tersebut hanya menghentikan proses. Sesi tetap ada hingga pengarsipan otomatis.
- Pengarsipan otomatis berlaku sama untuk sesi kedalaman 1 dan kedalaman 2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup dengan upaya terbaik saat proses selesai, meskipun catatan transkrip/sesi dipertahankan.

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
        maxSpawnDepth: 2, // izinkan subagen membuat turunan (default: 1, rentang 1-5)
        maxChildrenPerAgent: 5, // jumlah maksimum turunan aktif per sesi agen (default: 5, rentang 1-20)
        maxConcurrent: 8, // batas jalur konkurensi global (default: 8)
        runTimeoutSeconds: 900, // batas waktu default untuk sessions_spawn (0 = tanpa batas waktu)
        announceTimeoutMs: 120000, // batas waktu pengumuman gateway per panggilan
      },
    },
  },
}
```

### Tingkat kedalaman

| Kedalaman | Bentuk kunci sesi                            | Peran                                          | Dapat membuat?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagen (orkestrator jika kedalaman 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagen (pekerja daun)                   | Tidak pernah                        |

### Rantai pengumuman

Hasil mengalir kembali ke atas melalui rantai:

1. Pekerja kedalaman 2 selesai → mengumumkan kepada induknya (orkestrator kedalaman 1).
2. Orkestrator kedalaman 1 menerima pengumuman, menyintesis hasil, selesai → mengumumkan kepada agen utama.
3. Agen utama menerima pengumuman dan menyampaikannya kepada pengguna.

Setiap tingkat hanya melihat pengumuman dari turunan langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan turunan satu kali dan tunggu peristiwa
penyelesaian alih-alih membuat perulangan polling di sekitar perintah tidur `sessions_list`,
`sessions_history`, `/subagents list`, atau `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi turunan
tetap berfokus pada pekerjaan aktif — turunan aktif tetap terhubung, turunan yang berakhir tetap
terlihat selama jendela waktu terbaru yang singkat, dan tautan turunan lama yang hanya ada di penyimpanan
diabaikan setelah jendela kesegarannya. Hal ini mencegah metadata `spawnedBy` /
`parentSessionKey` lama menghidupkan kembali turunan semu setelah
dimulai ulang. Jika peristiwa penyelesaian turunan tiba setelah Anda telanjur mengirim
jawaban akhir, tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan kedalaman

- Peran dan cakupan kontrol ditulis ke metadata sesi saat pembuatan. Hal ini mencegah kunci sesi datar atau yang dipulihkan memperoleh kembali hak istimewa orkestrator secara tidak sengaja.
- **Kedalaman 1 (orkestrator, ketika `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat membuat turunan dan memeriksa statusnya. Alat sesi/sistem lain tetap ditolak.
- **Kedalaman 1 (daun, ketika `maxSpawnDepth == 1`):** tanpa alat sesi (perilaku default saat ini).
- **Kedalaman 2 (pekerja daun):** tanpa alat sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat membuat turunan lebih lanjut.

### Batas pembuatan per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) turunan aktif sekaligus. Hal ini mencegah penyebaran
tak terkendali dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator kedalaman 1 secara otomatis menghentikan semua turunan
kedalaman 2 miliknya:

- `/stop` dalam percakapan utama menghentikan semua agen kedalaman 1 dan meneruskan penghentian ke turunan kedalaman 2 mereka.

## Autentikasi

Autentikasi subagen ditentukan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi subagen adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan autentikasi dimuat dari `agentDir` milik agen tersebut.
- Profil autentikasi agen utama digabungkan sebagai **fallback**; profil agen menggantikan profil utama jika terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Autentikasi yang sepenuhnya terisolasi per agen belum didukung.

## Pengumuman

Subagen melaporkan kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi subagen (bukan sesi peminta).
- Jika subagen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, keluaran pengumuman ditekan meskipun sebelumnya ada progres yang terlihat.

Pengiriman bergantung pada kedalaman peminta:

- Sesi peminta tingkat teratas menggunakan panggilan tindak lanjut `agent` dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) agar orkestrator dapat menyintesis hasil turunan di dalam sesi.
- Jika sesi subagen peminta bertingkat sudah tidak ada, OpenClaw beralih ke peminta sesi tersebut jika tersedia.

Untuk sesi peminta tingkat teratas, pengiriman langsung dalam mode penyelesaian terlebih dahulu
menentukan rute percakapan/utas yang terikat dan penggantian hook, lalu mengisi
bidang target kanal yang tidak ada dari rute tersimpan milik sesi peminta.
Hal ini menjaga penyelesaian tetap berada di percakapan/topik yang tepat meskipun asal
penyelesaian hanya mengidentifikasi kanal.

Agregasi penyelesaian turunan dibatasi pada proses peminta saat ini ketika
menyusun temuan penyelesaian bertingkat, sehingga keluaran turunan lama dari proses sebelumnya
tidak bocor ke pengumuman saat ini. Balasan pengumuman mempertahankan
perutean utas/topik jika tersedia pada adaptor kanal.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:

| Bidang          | Sumber                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                     |
| Id sesi    | Kunci/id sesi turunan                                                                                     |
| Jenis           | Jenis pengumuman + label tugas                                                                               |
| Status         | Diturunkan dari hasil runtime (`ok`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Konten hasil | Teks asisten terbaru yang terlihat dari turunan                                                             |
| Tindak lanjut      | Instruksi yang menjelaskan kapan harus membalas dan kapan harus tetap diam                                                      |

Proses terminal yang gagal melaporkan status kegagalan tanpa memutar ulang teks
balasan yang ditangkap. Keluaran alat/toolResult tidak diangkat menjadi teks hasil turunan.

### Baris statistik

Payload pengumuman menyertakan baris statistik di bagian akhir (bahkan jika dibungkus):

- Runtime (misalnya `runtime 5m12s`).
- Penggunaan token (masukan/keluaran/total).
- Perkiraan biaya ketika harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan jalur transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa berkas pada disk.

Metadata internal hanya ditujukan untuk orkestrasi; balasan yang ditujukan kepada pengguna
harus ditulis ulang dengan gaya asisten yang normal.

### Mengapa memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman untuk membaca transkrip
turunan dari dalam giliran agen:

- Menyensor teks yang menyerupai kredensial/token meskipun penyensoran log serbaguna dinonaktifkan.
- Memangkas blok teks panjang (4000 karakter per blok) dan membuang tanda tangan pemikiran, payload pemutaran ulang penalaran, serta data gambar sebaris.
- Menerapkan batas respons 80 KB; baris yang terlalu besar diganti dengan `[sessions_history omitted: message too large]`.
- Gunakan `nextOffset` jika tersedia untuk menelusuri mundur jendela transkrip yang lebih lama.
- `sessions_history` **tidak** menghapus tag penalaran, perancah `<relevant-memories>`, atau XML panggilan alat dari teks pesan — alat ini mengembalikan blok konten terstruktur yang mendekati bentuk transkrip mentah, hanya saja telah disensor dan dibatasi ukurannya. `/subagents log` menerapkan pembersih prosa yang lebih menyeluruh (menghapus tag penalaran, perancah memori, dan XML panggilan alat) karena alat tersebut merender baris percakapan biasa, bukan blok terstruktur.
- Pemeriksaan transkrip mentah pada disk merupakan fallback ketika Anda memerlukan transkrip lengkap byte demi byte.

## Kebijakan alat

Subagen terlebih dahulu menggunakan profil dan pipeline kebijakan alat yang sama dengan agen induk atau
agen target. Setelah itu, OpenClaw menerapkan lapisan pembatasan
subagen.

Subagen selalu kehilangan `gateway`, `agents_list`, `session_status`, dan
`cron` terlepas dari kedalaman atau perannya (alat tingkat sistem/interaktif, atau
alat yang harus dikoordinasikan oleh agen utama). Subagen daun (perilaku default kedalaman 1,
dan selalu pada kedalaman 2) juga kehilangan `subagents`,
`sessions_list`, `sessions_history`, dan `sessions_spawn`. Subagen tidak pernah
mendapatkan alat `message` — alat tersebut dinonaktifkan saat pembuatan, bukan difilter oleh
daftar penolakan ini — dan `sessions_send` tetap ditolak agar subagen
hanya berkomunikasi melalui rantai pengumuman.

`sessions_history` juga tetap menjadi tampilan pengingatan kembali yang terbatas dan disanitasi di sini —
bukan dump transkrip mentah.

Ketika `maxSpawnDepth >= 2`, subagen orkestrator kedalaman 1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` agar dapat mengelola turunannya.

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
        // penolakan diutamakan
        deny: ["gateway", "cron"],
        // jika allow ditetapkan, daftar tersebut menjadi satu-satunya yang diizinkan (penolakan tetap diutamakan)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` adalah filter akhir yang hanya mengizinkan. Filter ini dapat mempersempit
kumpulan alat yang telah diselesaikan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` menyertakan
`web_search`/`web_fetch`, tetapi tidak menyertakan alat `browser`. Agar
subagen dengan profil coding dapat menggunakan otomatisasi browser, tambahkan browser pada
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
subagen masih aktif. Proses yang belum diakhiri dan lebih lama daripada jendela proses kedaluwarsa
(2 jam, atau batas waktu proses yang dikonfigurasi ditambah masa tenggang singkat,
mana pun yang lebih lama) tidak lagi dihitung sebagai aktif/tertunda dalam `/subagents list`,
ringkasan status, pengaturan gerbang penyelesaian turunan, dan pemeriksaan
konkurensi per sesi.

Setelah Gateway dimulai ulang, proses kedaluwarsa yang belum diakhiri dan dipulihkan akan dipangkas, kecuali
sesi turunannya ditandai `abortedLastRun: true`. Proses yang dibatalkan
akibat mulai ulang tetap terdaftar untuk alur pemulihan subagen yatim: proses
kedaluwarsa diselesaikan tanpa pelanjutan, sedangkan sesi turunan yang masih baru menerima
pesan pelanjutan sintetis sebelum penanda dibatalkan dihapus.

Pemulihan otomatis setelah mulai ulang dibatasi per sesi turunan. Jika turunan
subagen yang sama diterima berulang kali untuk pemulihan yatim dalam
jendela kemacetan ulang cepat, OpenClaw menyimpan batu nisan pemulihan pada
sesi tersebut dan berhenti melanjutkannya secara otomatis pada mulai ulang berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus tanda pemulihan dibatalkan yang kedaluwarsa pada
sesi berbatu nisan.

<Note>
Jika pembuatan subagen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pemasangan.
Pengiriman koordinasi internal `sessions_spawn` berlangsung dalam proses ketika
pemanggil sudah berjalan di dalam konteks permintaan Gateway, sehingga tidak
membuka WebSocket loopback atau bergantung pada cakupan dasar perangkat terpasang
milik CLI. Pemanggil di luar proses Gateway tetap menggunakan mekanisme cadangan
WebSocket sebagai `client.id: "gateway-client"` dengan `client.mode: "backend"`
melalui autentikasi token bersama/kata sandi loopback langsung. Pemanggil jarak jauh,
`deviceIdentity` eksplisit, jalur token perangkat eksplisit, serta klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` dalam obrolan pemohon akan membatalkan sesi pemohon dan menghentikan semua proses subagen aktif yang dibuat darinya, serta meneruskannya ke turunan bertingkat.

## Keterbatasan

- Pengumuman subagen bersifat **upaya terbaik**. Jika Gateway dimulai ulang, pekerjaan "umumkan kembali" yang tertunda akan hilang.
- Subagen tetap berbagi sumber daya proses Gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu nonpemblokiran: fungsi ini segera mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`). Subagen native Codex mengikuti batas yang sama: `TOOLS.md` tetap berada dalam instruksi thread Codex yang diwarisi, sedangkan persona, identitas, dan berkas pengguna khusus induk disuntikkan sebagai instruksi kolaborasi dengan cakupan giliran agar turunan tidak mengkloningnya.
- Kedalaman maksimum penumpukan adalah 5 (rentang `maxSpawnDepth`: 1-5). Kedalaman 2 disarankan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi turunan aktif per sesi (default `5`, rentang `1-20`).

## Terkait

- [Alat sesi dan perubahan status](/id/concepts/session-tool)
- [Agen ACP](/id/tools/acp-agents)
- [Pengiriman agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multiagen](/id/tools/multi-agent-sandbox-tools)
