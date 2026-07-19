---
read_when:
    - Anda menginginkan pekerjaan latar belakang atau paralel melalui agen
    - Anda sedang mengubah kebijakan alat sessions_spawn atau subagen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat pada utas
sidebarTitle: Sub-agents
summary: Jalankan agen latar belakang yang terisolasi dan mengumumkan hasilnya kembali ke percakapan peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-07-19T05:23:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a8c5c41315714dddc80fe425c7596b25d60348383afa69c585879be27e5d226c
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah proses agen latar belakang yang dibuat dari proses agen yang sudah ada.
Masing-masing berjalan dalam sesinya sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke kanal obrolan peminta.
Setiap proses sub-agen dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Tujuan:

- Memparalelkan riset, tugas panjang, dan pekerjaan alat yang lambat tanpa memblokir proses utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi, sandboxing opsional).
- Menjaga permukaan alat agar sulit disalahgunakan: secara default, sub-agen **tidak** mendapatkan alat sesi atau pesan.
- Mendukung kedalaman bertingkat yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** secara default, setiap sub-agen memiliki konteks dan penggunaan
token sendiri. Untuk tugas berat atau berulang, tetapkan model yang lebih murah untuk sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi melalui
`agents.defaults.subagents.model` atau penggantian per agen. Ketika agen turunan
benar-benar memerlukan transkrip peminta saat ini, buat agen tersebut dengan
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
proses; tambahkan token `tools` untuk menyertakan pesan pemanggilan/hasil alat (secara
default dihilangkan). Gunakan `sessions_history` untuk tampilan pengingatan kembali
yang terbatas dan difilter demi keamanan dari dalam giliran agen, atau periksa jalur transkrip pada disk untuk
transkrip lengkap mentah.

Di UI Kontrol, sesi induk dengan proses turunan terbaru memiliki baris bilah sisi
yang dapat diperluas. Baris bertingkat menampilkan status dan waktu proses agen turunan, dan memilih salah satunya
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

### Perilaku pembuatan

Agen memulai sub-agen latar belakang dengan alat `sessions_spawn`.
Penyelesaian dikembalikan sebagai peristiwa internal sesi induk; agen induk/peminta
memutuskan apakah pembaruan yang terlihat oleh pengguna diperlukan.

<AccordionGroup>
  <Accordion title="Penyelesaian berbasis push dan tidak memblokir">
    - `sessions_spawn` tidak memblokir; alat ini langsung mengembalikan id proses.
    - Setelah selesai, sub-agen melaporkan kembali ke sesi induk/peminta.
    - Giliran agen yang memerlukan hasil agen turunan harus memanggil `sessions_yield` setelah membuat pekerjaan yang diperlukan. Tindakan tersebut mengakhiri giliran saat ini dan memungkinkan peristiwa penyelesaian tiba sebagai pesan berikutnya yang terlihat oleh model.
    - Penyelesaian berbasis push. Setelah dibuat, **jangan** melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` dalam perulangan hanya untuk menunggu proses selesai; periksa status sesuai kebutuhan hanya saat melakukan debug.
    - Keluaran agen turunan adalah laporan/bukti yang harus disintesis oleh agen peminta. Keluaran tersebut bukan teks instruksi yang ditulis pengguna dan tidak dapat menggantikan kebijakan sistem, pengembang, atau pengguna.
    - Setelah selesai, OpenClaw berupaya semaksimal mungkin menutup tab/proses peramban terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman dilanjutkan.

  </Accordion>
  <Accordion title="Pengiriman penyelesaian">
    - OpenClaw menyerahkan kembali penyelesaian ke sesi peminta melalui giliran `agent` dengan kunci idempotensi yang stabil.
    - Jika proses peminta masih aktif, OpenClaw terlebih dahulu mencoba membangunkan/mengarahkan proses tersebut alih-alih memulai jalur balasan kedua yang terlihat.
    - Jika peminta aktif tidak dapat dibangunkan, OpenClaw beralih ke serah terima agen peminta dengan konteks penyelesaian yang sama alih-alih membuang pengumuman.
    - Serah terima induk yang berhasil menyelesaikan pengiriman sub-agen meskipun induk memutuskan bahwa pembaruan yang terlihat oleh pengguna tidak diperlukan.
    - Sub-agen native tidak mendapatkan alat pesan. Sub-agen mengembalikan teks asisten biasa kepada agen induk/peminta; balasan yang terlihat oleh manusia tetap menjadi tanggung jawab kebijakan pengiriman normal agen induk/peminta.
    - Jika serah terima langsung tidak dapat digunakan, pengiriman beralih ke perutean antrean, lalu ke percobaan ulang singkat dengan backoff eksponensial untuk pengumuman sebelum akhirnya menyerah.
    - Pengiriman mempertahankan rute peminta yang telah ditentukan: rute penyelesaian yang terikat utas atau percakapan diprioritaskan jika tersedia. Jika asal penyelesaian hanya menyediakan kanal, OpenClaw mengisi target/akun yang hilang dari rute yang telah ditentukan pada sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata serah terima penyelesaian">
    Serah terima penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan saat runtime
    (bukan teks yang ditulis pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat dari agen turunan. Keluaran alat/toolResult tidak dipromosikan menjadi hasil agen turunan. Proses terminal yang gagal tidak menggunakan kembali teks balasan yang telah direkam.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token yang ringkas.
    - Instruksi review yang meminta agen peminta memverifikasi hasil sebelum memutuskan apakah tugas awal telah selesai.
    - Panduan tindak lanjut yang meminta agen peminta melanjutkan tugas atau mencatat tindak lanjut ketika hasil agen turunan masih menyisakan tindakan.
    - Instruksi pembaruan akhir untuk jalur tanpa tindakan lebih lanjut, yang ditulis dengan gaya asisten normal tanpa meneruskan metadata internal mentah.

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` menggantikan default untuk proses tertentu tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan keluaran setelah penyelesaian.
    - Untuk sesi persisten yang terikat utas, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Jika kanal peminta tidak mendukung pengikatan utas, gunakan `mode: "run"` alih-alih mencoba ulang kombinasi terikat utas yang mustahil.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` ketika alat mengumumkan runtime tersebut. Lihat [Model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat melakukan debug penyelesaian atau perulangan antaragen. Ketika plugin `codex` diaktifkan, kontrol obrolan/utas Codex harus memprioritaskan `/codex ...` daripada ACP kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak berada dalam sandbox, dan plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native dimulai secara terisolasi kecuali pemanggil secara eksplisit meminta untuk mencabangkan
transkrip saat ini.

| Mode       | Waktu penggunaannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat yang lambat, atau apa pun yang dapat dijelaskan secara ringkas dalam teks tugas                           | Membuat transkrip agen turunan yang bersih. Ini adalah default dan menjaga penggunaan token tetap lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke dalam sesi agen turunan sebelum agen turunan dimulai. |

Gunakan `fork` seperlunya saja. Fitur ini ditujukan untuk delegasi yang sensitif terhadap konteks, bukan
sebagai pengganti penulisan perintah tugas yang jelas.

## Alat: `sessions_spawn`

Memulai proses sub-agen dengan `deliver: false` pada jalur `subagent` global,
kemudian menjalankan langkah pengumuman dan memposting balasan pengumuman ke kanal
obrolan peminta.

Ketersediaan bergantung pada kebijakan alat efektif pemanggil. Profil bawaan
`coding` dan `messaging` mencakup `sessions_spawn`,
`sessions_yield`, dan `subagents`; `minimal` tidak. `full` mengizinkan setiap
alat. Tambahkan alat-alat tersebut dengan `tools.alsoAllow`, atau gunakan salah satu profil
di atas, untuk agen dengan profil khusus yang lebih terbatas tetapi masih harus
mendelegasikan pekerjaan.
Kebijakan izinkan/tolak untuk kanal/grup, penyedia, sandbox, dan per agen masih dapat
menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** sub-agen native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen). Pembuatan runtime ACP menggunakan model sub-agen terkonfigurasi yang sama jika tersedia; jika tidak, harness ACP mempertahankan default-nya sendiri. `sessions_spawn.model` eksplisit tetap diprioritaskan.
- **Pemikiran:** sub-agen native mewarisi pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen). Pembuatan runtime ACP juga menerapkan `agents.defaults.models["provider/model"].params.thinking` untuk model yang dipilih. `sessions_spawn.thinking` eksplisit tetap diprioritaskan.
- **Batas waktu proses:** OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` jika ditetapkan; jika tidak, OpenClaw kembali menggunakan `0` (tanpa batas waktu). `sessions_spawn` tidak menerima penggantian batas waktu per panggilan.
- **Masa hidup proses:** sub-agen OpenClaw yang dilepas memiliki siklus hidup prosesnya sendiri. Tugas latar belakang yang dibuat di dalam backend CLI eksternal berbeda: tugas tersebut berbagi subproses CLI induk dan berhenti jika induk tersebut mencapai `agents.defaults.timeoutSeconds`.
- **Pengiriman tugas:** sub-agen native menerima tugas yang didelegasikan dalam pesan `[Subagent Task]` pertama yang terlihat. Perintah sistem sub-agen memuat aturan runtime dan konteks perutean, bukan duplikat tersembunyi dari tugas tersebut.

Pembuatan sub-agen native yang diterima mencakup metadata model agen turunan yang telah ditentukan
dalam hasil alat: `resolvedModel` berisi referensi model yang diterapkan dan
`resolvedProvider` berisi prefiks penyedia jika referensi tersebut memilikinya.

### Mode perintah delegasi

`agents.defaults.subagents.delegationMode` hanya mengontrol panduan perintah; pengaturan ini tidak mengubah kebijakan alat atau memberlakukan delegasi.

- `suggest` (default): mempertahankan arahan perintah standar untuk menggunakan sub-agen bagi pekerjaan yang lebih besar atau lebih lambat.
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
  Deskripsi tugas untuk sub-agen.
</ParamField>
<ParamField path="taskName" type="string">
  Nama tetap opsional untuk mengidentifikasi child tertentu dalam keluaran status selanjutnya. Harus cocok dengan `[a-z][a-z0-9_-]{0,63}` dan tidak boleh berupa target khusus seperti `last` atau `all`.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang mudah dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Jalankan di bawah id agen lain yang dikonfigurasi jika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja tugas opsional untuk eksekusi child. Sub-agen native tetap memuat file bootstrap dari ruang kerja agen target; `cwd` hanya mengubah lokasi tempat alat runtime dan harness CLI melakukan pekerjaan yang didelegasikan.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang sudah ada ketika `runtime: "acp"`; diabaikan untuk peluncuran sub-agen native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Mengalirkan keluaran eksekusi ACP ke sesi induk ketika `runtime: "acp"`; hilangkan untuk peluncuran sub-agen native.
</ParamField>
<ParamField path="model" type="string">
  Ganti model sub-agen. Nilai yang tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Ganti tingkat penalaran untuk eksekusi sub-agen. Tidak tersedia dengan `visible: true`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Ketika `true`, meminta pengikatan utas kanal untuk sesi sub-agen ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
  Jika pengikatan utas tidak tersedia untuk kanal peminta, gunakan `mode: "run"` sebagai gantinya.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` mengarsipkan sesi segera setelah pengumuman (transkrip tetap disimpan melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak peluncuran kecuali runtime child target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke sesi child. Khusus sub-agen native. Peluncuran yang terikat utas menggunakan `fork` secara default; peluncuran tanpa utas menggunakan `isolated` secara default. Fork yang terlihat harus menargetkan agen yang sama dengan peminta.
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  Buat sesi dasbor persisten yang dapat dibuka pengguna di UI Kontrol. Peluncuran yang terlihat hanya mendukung `runtime: "subagent"` dan selalu mempertahankan sesi yang dibuat.
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
`channel`, `to`, `threadId`, `replyTo`, `transport`). Sub-agen native melaporkan
giliran asisten terbaru mereka kembali kepada peminta; pengiriman eksternal tetap menjadi tanggung jawab
agen induk/peminta.
</Warning>

Dengan `visible: true`, `model`, `cwd`, dan `context: "fork"` pada agen yang sama didukung. Target yang berada dalam sandbox membatasi `cwd` ke ruang kerja agen tersebut. Pengikatan utas, `mode`, penggantian penalaran, konteks bootstrap ringan, dan penyiapan lampiran tidak tersedia pada jalur ini karena sesi yang terlihat merupakan sesi dasbor persisten yang dibuat melalui `sessions.create`. Peluncuran yang terlihat juga ditolak ketika pembatasan alat yang diwariskan tidak dapat diterapkan pada sesi dasbor. Lihat [Worktree terkelola](/id/concepts/managed-worktrees) untuk perilaku penamaan checkout, penyiapan, pembersihan, dan pemulihan.

### Nama tugas dan penargetan

`taskName` adalah nama yang ditampilkan kepada model untuk orkestrasi, bukan kunci sesi.
Gunakan untuk nama child tetap seperti `review_subagents`,
`linux_validation`, atau `docs_update` ketika koordinator mungkin perlu memeriksa
child tersebut nanti.

Resolusi target menerima kecocokan persis `taskName` dan prefiks yang tidak ambigu.
Pencocokan dibatasi ke jendela target aktif/terbaru yang sama dengan yang digunakan
oleh target `/subagents` bernomor, sehingga child lama yang telah selesai tidak menyebabkan
nama yang digunakan kembali menjadi ambigu. Jika dua child aktif atau terbaru memiliki
`taskName` yang sama, target tersebut ambigu; gunakan indeks daftar, kunci sesi, atau
id eksekusi sebagai gantinya.

Target khusus `last` dan `all` bukan nilai `taskName` yang valid
karena keduanya sudah memiliki makna kontrol.

## Alat: `sessions_yield`

Mengakhiri giliran model saat ini dan menunggu peristiwa runtime, terutama
peristiwa penyelesaian sub-agen, tiba sebagai pesan berikutnya. Gunakan setelah
meluncurkan pekerjaan child yang diperlukan ketika peminta tidak dapat memberikan jawaban
akhir hingga penyelesaian tersebut tiba.

`sessions_yield` adalah primitif untuk menunggu. Jangan menggantinya dengan perulangan polling
terhadap `subagents`, `sessions_list`, `sessions_history`, shell
`sleep`, atau polling proses hanya untuk mendeteksi penyelesaian child.

Hanya gunakan `sessions_yield` ketika daftar alat efektif sesi menyertakannya.
Beberapa profil alat minimal atau khusus mungkin menyediakan `sessions_spawn` dan
`subagents` tanpa menyediakan `sessions_yield`; dalam kasus tersebut, jangan membuat
perulangan polling hanya untuk menunggu penyelesaian.

Ketika terdapat child aktif, OpenClaw menyisipkan blok prompt ringkas yang dihasilkan runtime
`Active Subagents` ke dalam giliran normal agar peminta dapat melihat
sesi child saat ini, id eksekusi, status, label, tugas, dan alias
`taskName` tanpa polling. Kolom tugas dan label dalam blok tersebut
dikutip sebagai data, bukan instruksi, karena dapat berasal
dari argumen peluncuran yang diberikan pengguna/model.

## Alat: `subagents`

Mencantumkan eksekusi sub-agen yang diluncurkan dan catatan tugas latar belakang yang dimiliki oleh
pohon sesi peminta. Baris tugas mencakup sub-agen native, eksekusi ACP,
pekerjaan CLI/media Gateway, dan eksekusi cron. Cakupannya terbatas pada peminta saat ini;
child hanya dapat melihat child yang dikendalikannya sendiri.

Gunakan `subagents` untuk status dan debugging sesuai permintaan. Gunakan `sessions_yield` untuk
menunggu peristiwa penyelesaian.

Gunakan `action: "cancel"` dengan `taskId` yang dikembalikan oleh `action: "list"` untuk menghentikan
tugas. Pembatalan terbatas pada pohon sesi yang dikendalikan; sub-agen leaf
tidak dapat membatalkan pekerjaan yang dimiliki sesi lain.

## Sesi yang terikat utas

Ketika pengikatan utas diaktifkan untuk suatu kanal, sub-agen dapat tetap terikat
ke sebuah utas sehingga pesan tindak lanjut pengguna dalam utas tersebut terus diarahkan ke
sesi sub-agen yang sama.

### Kanal yang mendukung utas

Suatu kanal mendukung sesi sub-agen persisten yang terikat utas
(`sessions_spawn` dengan `thread: true`) ketika mendaftarkan adaptor pengikatan
percakapan. Kanal bawaan dengan dukungan tersebut: **Discord**,
**iMessage**, **Matrix**, dan **Telegram**. Discord dan Matrix secara default
membuat utas child; Telegram dan iMessage secara default mengikat
percakapan saat ini. Gunakan kunci konfigurasi `threadBindings` per kanal untuk
pengaktifan, batas waktu, dan `spawnSessions`.

### Alur singkat

<Steps>
  <Step title="Luncurkan">
    `sessions_spawn` dengan `thread: true` (dan secara opsional `mode: "session"`).
  </Step>
  <Step title="Ikat">
    OpenClaw membuat atau mengikat sebuah utas ke target sesi tersebut dalam kanal aktif.
  </Step>
  <Step title="Arahkan tindak lanjut">
    Balasan dan pesan tindak lanjut dalam utas tersebut diarahkan ke sesi yang terikat.
  </Step>
  <Step title="Periksa batas waktu">
    Gunakan `/session idle` untuk memeriksa/memperbarui penghapusan fokus otomatis akibat tidak aktif dan
    `/session max-age` untuk mengendalikan batas maksimum mutlak.
  </Step>
  <Step title="Lepaskan">
    Gunakan `/unfocus` untuk melepaskan secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah            | Efek                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Ikat utas saat ini (atau buat utas) ke target sub-agen/sesi                              |
| `/unfocus`         | Hapus pengikatan untuk utas terikat saat ini                                             |
| `/agents`          | Cantumkan eksekusi aktif dan status pengikatan (`binding:<id>`, `unbound`, atau `bindings unavailable`) |
| `/session idle`    | Periksa/perbarui penghapusan fokus otomatis saat menganggur (khusus utas terikat yang difokuskan) |
| `/session max-age` | Periksa/perbarui batas maksimum mutlak (khusus utas terikat yang difokuskan)             |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kunci penggantian kanal dan pengikatan otomatis saat peluncuran** bersifat khusus adaptor. Lihat [Kanal yang mendukung utas](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah garis miring](/id/tools/slash-commands) untuk detail adaptor terkini.

### Daftar izin

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen terkonfigurasi yang dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan semua target terkonfigurasi). Default: hanya agen peminta. Jika Anda menetapkan daftar dan tetap ingin peminta meluncurkan dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Daftar izin agen target terkonfigurasi default yang digunakan ketika agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil secara eksplisit). Penggantian per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Batas waktu per panggilan untuk percobaan pengiriman pengumuman `agent` Gateway. Nilainya berupa milidetik bilangan bulat positif dan dibatasi ke nilai maksimum pewaktu yang aman bagi platform. Percobaan ulang sementara dapat membuat total waktu tunggu pengumuman lebih lama daripada satu batas waktu yang dikonfigurasi.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan tanpa sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons menyertakan model efektif dan metadata runtime tertanam
setiap agen yang tercantum sehingga pemanggil dapat membedakan OpenClaw, server aplikasi Codex,
dan runtime native terkonfigurasi lainnya.

`allowAgents` harus mengarah ke id agen yang dikonfigurasi di `agents.list[]`.
`["*"]` berarti agen target mana pun yang dikonfigurasi beserta peminta. Jika konfigurasi agen
dihapus tetapi id-nya tetap ada di `allowAgents`, `sessions_spawn` menolak id tersebut
dan `agents_list` mengabaikannya. Jalankan `openclaw doctor --fix` untuk membersihkan entri
daftar izin yang sudah tidak berlaku, atau tambahkan entri `agents.list[]` minimal jika target harus
tetap dapat dibuat sambil mewarisi nilai default.

### Pengarsipan otomatis

- Sesi subagen diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Pengarsipan menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah pengumuman (transkrip tetap dipertahankan melalui penggantian nama).
- Pengarsipan otomatis bersifat upaya terbaik; pengatur waktu yang tertunda akan hilang jika Gateway dimulai ulang.
- Batas waktu proses yang dikonfigurasi **tidak** melakukan pengarsipan otomatis; batas waktu tersebut hanya menghentikan proses. Sesi tetap ada hingga pengarsipan otomatis.
- Pengarsipan otomatis berlaku sama untuk sesi kedalaman 1 dan kedalaman 2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak akan ditutup dengan upaya terbaik ketika proses selesai, meskipun catatan transkrip/sesi dipertahankan.

## Subagen bertingkat

Secara default, subagen tidak dapat membuat subagennya sendiri
(`maxSpawnDepth: 1`). Atur `maxSpawnDepth: 2` untuk mengaktifkan satu tingkat
penyarangan — **pola orkestrator**: utama → subagen orkestrator →
sub-subagen pekerja.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // izinkan subagen membuat turunan (default: 1, rentang 1-5)
        maxChildrenPerAgent: 5, // maksimum turunan aktif per sesi agen (default: 5, rentang 1-20)
        maxConcurrent: 8, // batas jalur konkurensi global (default: 8)
        runTimeoutSeconds: 900, // batas waktu default untuk sessions_spawn (0 = tanpa batas waktu)
        announceTimeoutMs: 120000, // batas waktu pengumuman Gateway per panggilan
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
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagen (pekerja terminal)                   | Tidak pernah                        |

### Rantai pengumuman

Hasil mengalir kembali ke atas melalui rantai:

1. Pekerja kedalaman 2 selesai → mengumumkan kepada induknya (orkestrator kedalaman 1).
2. Orkestrator kedalaman 1 menerima pengumuman, menyintesis hasil, selesai → mengumumkan kepada agen utama.
3. Agen utama menerima pengumuman dan menyampaikannya kepada pengguna.

Setiap tingkat hanya melihat pengumuman dari turunan langsungnya.

<Note>
**Panduan operasional:** mulai pekerjaan turunan satu kali dan tunggu peristiwa
penyelesaian alih-alih membuat perulangan polling di sekitar `sessions_list`,
`sessions_history`, `/subagents list`, atau perintah tidur `exec`.
`sessions_list` dan `/subagents list` menjaga hubungan sesi turunan
tetap berfokus pada pekerjaan aktif — turunan aktif tetap terhubung, turunan yang telah berakhir tetap
terlihat selama jendela waktu terbaru yang singkat, dan tautan turunan lama yang hanya tersimpan
diabaikan setelah jendela kesegarannya. Ini mencegah metadata lama `spawnedBy` /
`parentSessionKey` menghidupkan kembali turunan siluman setelah
dimulai ulang. Jika peristiwa penyelesaian turunan tiba setelah Anda mengirim
jawaban akhir, tindak lanjut yang benar adalah token senyap persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan kedalaman

- Peran dan cakupan kendali ditulis ke metadata sesi saat dibuat. Hal ini mencegah kunci sesi datar atau yang dipulihkan memperoleh kembali hak istimewa orkestrator secara tidak sengaja.
- **Kedalaman 1 (orkestrator, ketika `maxSpawnDepth >= 2`):** memperoleh `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` sehingga dapat membuat turunan dan memeriksa statusnya. Alat sesi/sistem lainnya tetap ditolak.
- **Kedalaman 1 (terminal, ketika `maxSpawnDepth == 1`):** tanpa alat sesi (perilaku default saat ini).
- **Kedalaman 2 (pekerja terminal):** tanpa alat sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat membuat turunan lebih lanjut.

### Batas pembuatan per agen

Setiap sesi agen (pada kedalaman mana pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) turunan aktif sekaligus. Ini mencegah perluasan tak terkendali
dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator kedalaman 1 secara otomatis menghentikan semua
turunan kedalaman 2 miliknya:

- `/stop` dalam obrolan utama menghentikan semua agen kedalaman 1 dan meneruskannya ke turunan kedalaman 2 mereka.

## Autentikasi

Autentikasi subagen ditentukan berdasarkan **id agen**, bukan jenis sesi:

- Kunci sesi subagen adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan autentikasi dimuat dari `agentDir` milik agen tersebut.
- Profil autentikasi agen utama digabungkan sebagai **cadangan**; profil agen mengesampingkan profil utama jika terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
cadangan. Autentikasi yang sepenuhnya terisolasi per agen belum didukung.

## Pengumuman

Subagen melaporkan kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi subagen (bukan sesi peminta).
- Jika subagen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`, keluaran pengumuman disembunyikan meskipun sebelumnya terdapat progres yang terlihat.

Penyampaian bergantung pada kedalaman peminta:

- Sesi peminta tingkat teratas menggunakan panggilan tindak lanjut `agent` dengan penyampaian eksternal (`deliver=true`).
- Sesi subagen peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) sehingga orkestrator dapat menyintesis hasil turunan di dalam sesi.
- Jika sesi subagen peminta bertingkat sudah tidak ada, OpenClaw beralih ke peminta sesi tersebut jika tersedia.

Untuk sesi peminta tingkat teratas, penyampaian langsung dalam mode penyelesaian terlebih dahulu
menentukan rute percakapan/utas yang terikat dan penggantian hook, lalu mengisi
kolom target saluran yang tidak ada dari rute yang tersimpan dalam sesi peminta.
Hal ini mempertahankan penyelesaian di obrolan/topik yang tepat meskipun asal
penyelesaian hanya mengidentifikasi saluran.

Agregasi penyelesaian turunan dibatasi pada proses peminta saat ini ketika
menyusun temuan penyelesaian bertingkat, sehingga keluaran turunan lama dari proses
sebelumnya tidak bocor ke pengumuman saat ini. Balasan pengumuman mempertahankan
perutean utas/topik jika tersedia pada adaptor saluran.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:

| Kolom          | Sumber                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                     |
| Id sesi    | Kunci/id sesi turunan                                                                                     |
| Jenis           | Jenis pengumuman + label tugas                                                                               |
| Status         | Diturunkan dari hasil runtime (`ok`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Isi hasil | Teks asisten terbaru yang terlihat dari turunan                                                             |
| Tindak lanjut      | Instruksi yang menjelaskan kapan harus membalas atau tetap senyap                                                      |

Proses gagal terminal melaporkan status kegagalan tanpa memutar ulang teks
balasan yang direkam. Keluaran alat/toolResult tidak dipromosikan menjadi teks hasil turunan.

### Baris statistik

Payload pengumuman menyertakan baris statistik di bagian akhir (bahkan ketika dibungkus):

- Runtime (misalnya `runtime 5m12s`).
- Penggunaan token (masukan/keluaran/total).
- Perkiraan biaya ketika harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan jalur transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa berkas pada disk.

Metadata internal hanya ditujukan untuk orkestrasi; balasan yang ditampilkan kepada pengguna
harus ditulis ulang dengan gaya asisten normal.

### Mengapa lebih memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman untuk membaca
transkrip turunan dari dalam giliran agen:

- Menyunting teks yang menyerupai kredensial/token meskipun penyuntingan log umum dinonaktifkan.
- Memotong blok teks panjang (4000 karakter per blok) dan menghapus tanda tangan pemikiran, payload pemutaran ulang penalaran, serta data gambar sebaris.
- Menerapkan batas respons 80 KB; baris yang terlalu besar diganti dengan `[sessions_history omitted: message too large]`.
- Gunakan `nextOffset` jika tersedia untuk menelusuri mundur jendela transkrip yang lebih lama.
- `sessions_history` **tidak** menghapus tag penalaran, perancah `<relevant-memories>`, atau XML panggilan alat dari teks pesan — alat tersebut mengembalikan blok konten terstruktur yang mendekati bentuk transkrip mentah, hanya disunting dan dibatasi ukurannya. `/subagents log` menerapkan sanitasi prosa yang lebih ketat (menghapus tag penalaran, perancah memori, dan XML panggilan alat) karena merender baris obrolan biasa alih-alih blok terstruktur.
- Pemeriksaan transkrip mentah pada disk merupakan cadangan ketika Anda memerlukan transkrip lengkap byte demi byte.

## Kebijakan alat

Subagen terlebih dahulu menggunakan profil dan pipeline kebijakan alat yang sama dengan agen induk atau
target. Setelah itu, OpenClaw menerapkan lapisan pembatasan
subagen.

Subagen selalu kehilangan `gateway`, `agents_list`, `session_status`, dan
`cron` terlepas dari kedalaman atau perannya (alat tingkat sistem/interaktif, atau
alat yang harus dikoordinasikan oleh agen utama). Subagen terminal (perilaku default kedalaman 1,
dan selalu pada kedalaman 2) juga kehilangan `subagents`,
`sessions_list`, `sessions_history`, dan `sessions_spawn`. Subagen tidak pernah
mendapatkan alat `message` — alat tersebut dinonaktifkan saat pembuatan, bukan difilter oleh
daftar penolakan ini — dan `sessions_send` tetap ditolak agar subagen
berkomunikasi hanya melalui rantai pengumuman.

`sessions_history` juga tetap menjadi tampilan pengambilan kembali yang terbatas dan tersanitasi di sini —
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
        // penolakan menang
        deny: ["gateway", "cron"],
        // jika izin ditetapkan, ini menjadi hanya-izin (penolakan tetap menang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` adalah filter akhir hanya-izin. Filter ini dapat mempersempit
kumpulan alat yang telah ditentukan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` mencakup
`web_search`/`web_fetch` tetapi tidak mencakup alat `browser`. Agar
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

Gunakan `agents.list[].tools.alsoAllow: ["browser"]` per agen ketika hanya satu
agen yang harus mendapatkan otomatisasi browser.

## Konkurensi

Subagen menggunakan jalur antrean dalam proses khusus:

- **Nama jalur:** `subagent`
- **Konkurensi:** `agents.defaults.subagents.maxConcurrent` (default `8`)

## Keaktifan dan pemulihan

OpenClaw tidak menganggap tidak adanya `endedAt` sebagai bukti permanen bahwa
subagen masih aktif. Proses yang belum berakhir dan lebih lama daripada jendela proses kedaluwarsa
(2 jam, atau batas waktu proses yang dikonfigurasi ditambah masa tenggang singkat,
mana pun yang lebih lama) tidak lagi dihitung sebagai aktif/tertunda dalam `/subagents list`,
ringkasan status, pengendalian penyelesaian turunan, dan pemeriksaan
konkurensi per sesi.

Setelah Gateway dimulai ulang, proses hasil pemulihan yang kedaluwarsa dan belum berakhir akan dihapus kecuali
sesi turunannya ditandai `abortedLastRun: true`. Proses yang dibatalkan akibat
dimulai ulang tetap terdaftar untuk alur pemulihan subagen yatim: proses yang
kedaluwarsa diselesaikan tanpa melanjutkan, sedangkan sesi turunan yang baru menerima
pesan pelanjutan sintetis sebelum penanda dibatalkan dihapus.

Pemulihan otomatis setelah dimulai ulang dibatasi per sesi turunan. Jika turunan
subagen yang sama diterima untuk pemulihan yatim berulang kali di dalam
jendela macet ulang cepat, OpenClaw menyimpan penanda penghentian pemulihan pada
sesi tersebut dan berhenti melanjutkannya secara otomatis saat dimulai ulang berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus tanda pemulihan terbatal yang kedaluwarsa pada
sesi yang memiliki penanda penghentian.

<Note>
Jika pembuatan subagen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pemasangan.
Pengiriman koordinasi internal `sessions_spawn` berlangsung dalam proses ketika
pemanggil sudah berjalan di dalam konteks permintaan Gateway, sehingga pengiriman tersebut
tidak membuka WebSocket loopback atau bergantung pada acuan dasar cakupan perangkat terpasang
milik CLI. Pemanggil di luar proses Gateway tetap menggunakan fallback WebSocket
sebagai `client.id: "gateway-client"` dengan `client.mode: "backend"`
melalui autentikasi token bersama/kata sandi loopback langsung. Pemanggil jarak jauh, `deviceIdentity`
eksplisit, jalur token perangkat eksplisit, serta klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` dalam obrolan pemohon akan membatalkan sesi pemohon dan menghentikan semua proses subagen aktif yang dibuat darinya, yang diterapkan secara berantai ke turunan bertingkat.

## Batasan

- Pengumuman subagen bersifat **upaya terbaik**. Jika Gateway dimulai ulang, pekerjaan "mengumumkan kembali" yang tertunda akan hilang.
- Subagen tetap berbagi sumber daya proses Gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu nonpemblokiran: fungsi ini langsung mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`). Subagen native Codex mengikuti batasan yang sama: `TOOLS.md` tetap berada dalam instruksi utas Codex yang diwarisi, sedangkan persona, identitas, dan berkas pengguna khusus induk disuntikkan sebagai instruksi kolaborasi dengan cakupan giliran agar turunan tidak mengkloningnya.
- Kedalaman penyarangan maksimum adalah 5 (rentang `maxSpawnDepth`: 1-5). Kedalaman 2 disarankan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi jumlah turunan aktif per sesi (default `5`, rentang `1-20`).

## Terkait

- [Alat sesi dan perubahan status](/id/concepts/session-tool)
- [Agen ACP](/id/tools/acp-agents)
- [Pengiriman agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multiagen](/id/tools/multi-agent-sandbox-tools)
