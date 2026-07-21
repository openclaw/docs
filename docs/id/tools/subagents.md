---
read_when:
    - Anda menginginkan pekerjaan latar belakang atau paralel melalui agen
    - Anda sedang mengubah kebijakan alat sessions_spawn atau subagen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi subagen yang terikat pada utas
sidebarTitle: Sub-agents
summary: Jalankan agen latar belakang terisolasi yang mengumumkan hasil kembali ke obrolan peminta
title: Sub-agen
x-i18n:
    generated_at: "2026-07-21T13:11:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 06981261069714dd1ca4c426ce73d5e6dbdebb4dc5d77f2f9adef59bce29cb0d
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agen adalah proses agen latar belakang yang dibuat dari proses agen yang sudah ada.
Masing-masing berjalan dalam sesinya sendiri (`agent:<agentId>:subagent:<uuid>`) dan,
setelah selesai, **mengumumkan** hasilnya kembali ke kanal chat peminta.
Setiap proses sub-agen dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Tujuan:

- Memparalelkan riset, tugas panjang, dan pekerjaan alat yang lambat tanpa memblokir proses utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi, sandbox opsional).
- Menjaga permukaan alat agar sulit disalahgunakan: secara default, sub-agen **tidak** mendapatkan alat sesi atau pesan.
- Mendukung kedalaman penyarangan yang dapat dikonfigurasi untuk pola orkestrator.

<Note>
**Catatan biaya:** secara default, setiap sub-agen memiliki konteks dan penggunaan tokennya sendiri.
Untuk tugas berat atau berulang, tetapkan model yang lebih murah bagi sub-agen
dan pertahankan agen utama Anda pada model berkualitas lebih tinggi melalui
`agents.defaults.subagents.model` atau penggantian per agen. Jika agen anak
benar-benar memerlukan transkrip peminta saat ini, buat agen tersebut dengan
`context: "fork"`. Sesi sub-agen yang terikat utas secara default menggunakan
`context: "fork"` karena sesi tersebut mencabangkan percakapan saat ini menjadi
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
jalur transkrip, pembersihan). `/subagents log` mencetak giliran chat terbaru untuk suatu
proses; tambahkan token `tools` untuk menyertakan pesan pemanggilan/hasil alat (secara default
dihilangkan). Gunakan `sessions_history` untuk tampilan pengingatan kembali
yang dibatasi dan difilter demi keamanan dari dalam giliran agen, atau periksa jalur transkrip pada disk untuk
transkrip lengkap mentah.

Di UI Kontrol, sesi induk dengan proses anak terbaru memiliki baris bilah samping
yang dapat diperluas. Baris bersarang menampilkan status dan waktu proses anak, dan memilih salah satunya
akan membuka chat anak tersebut sambil mempertahankan hierarki induk.

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
  <Accordion title="Penyelesaian berbasis push yang tidak memblokir">
    - `sessions_spawn` tidak memblokir; alat ini segera mengembalikan id proses.
    - Saat selesai, sub-agen melaporkan kembali ke sesi induk/peminta.
    - Giliran agen yang memerlukan hasil agen anak harus memanggil `sessions_yield` setelah membuat pekerjaan yang diperlukan. Tindakan ini mengakhiri giliran saat ini dan memungkinkan peristiwa penyelesaian tiba sebagai pesan berikutnya yang terlihat oleh model.
    - Penyelesaian berbasis push. Setelah dibuat, **jangan** melakukan polling `/subagents list`, `sessions_list`, atau `sessions_history` secara berulang hanya untuk menunggunya selesai; periksa status sesuai kebutuhan hanya saat melakukan debug.
    - Keluaran agen anak adalah laporan/bukti yang harus disintesis oleh agen peminta. Keluaran tersebut bukan teks instruksi buatan pengguna dan tidak dapat mengesampingkan kebijakan sistem, pengembang, atau pengguna.
    - Saat selesai, OpenClaw berupaya sebaik mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur pembersihan pengumuman berlanjut.

  </Accordion>
  <Accordion title="Pengiriman penyelesaian">
    - OpenClaw mengembalikan penyelesaian ke sesi peminta melalui giliran `agent` dengan kunci idempotensi yang stabil.
    - Jika proses peminta masih aktif, OpenClaw terlebih dahulu mencoba membangunkan/mengarahkan proses tersebut alih-alih memulai jalur balasan kedua yang terlihat.
    - Jika peminta aktif tidak dapat dibangunkan, OpenClaw beralih ke serah terima agen peminta dengan konteks penyelesaian yang sama, bukan membuang pengumuman.
    - Serah terima induk yang berhasil menyelesaikan pengiriman sub-agen meskipun induk memutuskan bahwa pembaruan yang terlihat oleh pengguna tidak diperlukan.
    - Sub-agen native tidak mendapatkan alat pesan. Sub-agen mengembalikan teks asisten biasa kepada agen induk/peminta; balasan yang terlihat oleh manusia tetap diatur oleh kebijakan pengiriman normal agen induk/peminta.
    - Jika serah terima langsung tidak dapat digunakan, pengiriman beralih ke perutean antrean, kemudian ke percobaan ulang pengumuman singkat dengan backoff eksponensial sebelum akhirnya menyerah.
    - Pengiriman mempertahankan rute peminta yang telah ditetapkan: rute penyelesaian yang terikat utas atau terikat percakapan diutamakan jika tersedia. Jika asal penyelesaian hanya menyediakan kanal, OpenClaw mengisi target/akun yang hilang dari rute sesi peminta yang telah ditetapkan (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi.

  </Accordion>
  <Accordion title="Metadata serah terima penyelesaian">
    Serah terima penyelesaian ke sesi peminta merupakan konteks internal
    yang dihasilkan saat runtime (bukan teks buatan pengguna) dan mencakup:

    - `Result` — teks balasan `assistant` terbaru yang terlihat dari agen anak. Keluaran alat/toolResult tidak dipromosikan menjadi hasil agen anak. Proses yang gagal secara terminal tidak menggunakan kembali teks balasan yang tertangkap.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistik runtime/token ringkas.
    - Instruksi review yang memberi tahu agen peminta untuk memverifikasi hasil sebelum memutuskan apakah tugas asli sudah selesai.
    - Panduan tindak lanjut yang memberi tahu agen peminta untuk melanjutkan tugas atau mencatat tindak lanjut saat hasil agen anak masih menyisakan tindakan.
    - Instruksi pembaruan akhir untuk jalur tanpa tindakan lebih lanjut, ditulis dengan gaya asisten normal tanpa meneruskan metadata internal mentah.

  </Accordion>
  <Accordion title="Mode dan runtime ACP">
    - `--model` dan `--thinking` menggantikan default untuk proses tertentu tersebut.
    - Gunakan `info`/`log` untuk memeriksa detail dan keluaran setelah selesai.
    - Untuk sesi persisten yang terikat utas, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
    - Jika kanal peminta tidak mendukung pengikatan utas, gunakan `mode: "run"` alih-alih mencoba ulang kombinasi terikat utas yang mustahil.
    - Untuk sesi harness ACP (Claude Code, Gemini CLI, OpenCode, atau Codex ACP/acpx eksplisit), gunakan `sessions_spawn` dengan `runtime: "acp"` saat alat mengiklankan runtime tersebut. Lihat [Model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat melakukan debug penyelesaian atau perulangan antaragen. Saat Plugin `codex` diaktifkan, kontrol chat/utas Codex sebaiknya mengutamakan `/codex ...` daripada ACP, kecuali pengguna secara eksplisit meminta ACP/acpx.
    - OpenClaw menyembunyikan `runtime: "acp"` hingga ACP diaktifkan, peminta tidak berada dalam sandbox, dan Plugin backend seperti `acpx` dimuat. `runtime: "acp"` mengharapkan id harness ACP eksternal, atau entri `agents.list[]` dengan `runtime.type="acp"`; gunakan runtime sub-agen default untuk agen konfigurasi OpenClaw normal dari `agents_list`.

  </Accordion>
</AccordionGroup>

## Mode konteks

Sub-agen native dimulai secara terisolasi kecuali pemanggil secara eksplisit meminta untuk mencabangkan
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                         | Perilaku                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan alat yang lambat, atau apa pun yang dapat dijelaskan secara ringkas dalam teks tugas                           | Membuat transkrip agen anak yang bersih. Ini adalah default dan menjaga penggunaan token tetap lebih rendah.  |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil alat sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi anak sebelum agen anak dimulai. |

Gunakan `fork` seperlunya. Mode ini ditujukan untuk delegasi yang sensitif terhadap konteks, bukan
sebagai pengganti penulisan prompt tugas yang jelas.

## Alat: `sessions_spawn`

Memulai proses sub-agen dengan `deliver: false` pada jalur `subagent` global,
kemudian menjalankan langkah pengumuman dan memposting balasan pengumuman ke kanal
chat peminta.

Ketersediaannya bergantung pada kebijakan alat efektif pemanggil. Profil bawaan
`coding` dan `messaging` mencakup `sessions_spawn`,
`sessions_yield`, dan `subagents`; `minimal` tidak. `full` mengizinkan semua
alat. Tambahkan alat tersebut dengan `tools.alsoAllow`, atau gunakan salah satu profil
di atas, untuk agen dengan profil khusus yang lebih terbatas tetapi tetap harus
mendelegasikan pekerjaan.
Kebijakan izinkan/tolak kanal/grup, penyedia, sandbox, dan per agen
masih dapat menghapus alat setelah tahap profil. Gunakan `/tools` dari sesi yang sama
untuk mengonfirmasi daftar alat efektif.

**Default:**

- **Model:** sub-agen native mewarisi model pemanggil kecuali Anda menetapkan `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen). Pembuatan runtime ACP menggunakan model sub-agen terkonfigurasi yang sama jika tersedia; jika tidak, harness ACP mempertahankan defaultnya sendiri. `sessions_spawn.model` eksplisit tetap diutamakan.
- **Pemikiran:** sub-agen native mewarisi pemikiran pemanggil kecuali Anda menetapkan `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen). Pembuatan runtime ACP juga menerapkan `agents.defaults.models["provider/model"].params.thinking` untuk model yang dipilih. `sessions_spawn.thinking` eksplisit tetap diutamakan.
- **Batas waktu proses:** OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` jika ditetapkan; jika tidak, OpenClaw beralih ke `0` (tanpa batas waktu). `sessions_spawn` tidak menerima penggantian batas waktu per panggilan.
- **Masa hidup proses:** sub-agen OpenClaw yang dilepas memiliki siklus hidup prosesnya sendiri. Tugas latar belakang yang dibuat di dalam backend CLI eksternal berbeda: tugas tersebut berbagi subproses CLI induk dan berhenti jika induk mencapai `agents.defaults.timeoutSeconds`.
- **Pengiriman tugas:** sub-agen native menerima tugas yang didelegasikan dalam pesan `[Subagent Task]` pertama yang terlihat. Prompt sistem sub-agen membawa aturan runtime dan konteks perutean, bukan duplikat tersembunyi dari tugas tersebut.

Pembuatan sub-agen native yang diterima menyertakan metadata model anak yang telah ditetapkan
dalam hasil alat: `resolvedModel` berisi referensi model yang diterapkan dan
`resolvedProvider` berisi awalan penyedia jika referensi memilikinya.

### Mode prompt delegasi

`agents.defaults.subagents.delegationMode` hanya mengontrol panduan prompt; pengaturan ini tidak mengubah kebijakan alat atau memberlakukan delegasi.

- `suggest` (default): pertahankan dorongan prompt standar untuk menggunakan sub-agen bagi pekerjaan yang lebih besar atau lebih lambat.
- `prefer`: beri tahu agen utama agar tetap responsif dan mendelegasikan apa pun yang lebih kompleks daripada balasan langsung melalui `sessions_spawn`.

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
  Deskripsi tugas untuk sub-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Penanda stabil opsional untuk mengidentifikasi child tertentu dalam keluaran status berikutnya. Harus cocok dengan `[a-z][a-z0-9_-]{0,63}` dan tidak boleh berupa target yang dicadangkan seperti `last` atau `all`.
</ParamField>
<ParamField path="label" type="string">
  Label opsional yang mudah dibaca manusia.
</ParamField>
<ParamField path="agentId" type="string">
  Lakukan spawn di bawah id agen lain yang dikonfigurasi jika diizinkan oleh `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja tugas opsional untuk proses child. Sub-agent native tetap memuat file bootstrap dari ruang kerja agen target; `cwd` hanya mengubah lokasi tempat alat runtime dan harness CLI melakukan pekerjaan yang didelegasikan.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` hanya untuk harness ACP eksternal (`claude`, `droid`, `gemini`, `opencode`, atau Codex ACP/acpx yang diminta secara eksplisit) dan untuk entri `agents.list[]` yang `runtime.type`-nya adalah `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Khusus ACP. Melanjutkan sesi harness ACP yang sudah ada ketika `runtime: "acp"`; diabaikan untuk spawn sub-agent native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Khusus ACP. Mengalirkan keluaran proses ACP ke sesi induk ketika `runtime: "acp"`; hilangkan untuk spawn sub-agent native.
</ParamField>
<ParamField path="model" type="string">
  Ganti model sub-agent. Nilai yang tidak valid dilewati dan sub-agent berjalan pada model default dengan peringatan dalam hasil alat.
</ParamField>
<ParamField path="thinking" type="string">
  Ganti tingkat penalaran untuk proses sub-agent. Tidak tersedia dengan `visible: true`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Ketika `true`, meminta pengikatan utas kanal untuk sesi sub-agent ini.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jika `thread: true` dan `mode` dihilangkan, nilai default menjadi `session`. `mode: "session"` memerlukan `thread: true`.
  Jika pengikatan utas tidak tersedia untuk kanal peminta, gunakan `mode: "run"` sebagai gantinya.
  Dengan `visible: true`, hilangkan `mode`; sesi yang terlihat bersifat persisten dan tidak mendukung `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` mengarsipkan sesi segera setelah pengumuman (transkrip tetap disimpan melalui penggantian nama).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` menolak spawn kecuali runtime child target berada dalam sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` mencabangkan transkrip peminta saat ini ke sesi child. Khusus sub-agent native. Spawn yang terikat utas secara default menggunakan `fork`; spawn yang tidak terikat utas secara default menggunakan `isolated`. Fork yang terlihat harus menargetkan agen yang sama dengan peminta.
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  Buat sesi dasbor persisten yang dapat dibuka pengguna di UI Kontrol. Spawn yang terlihat hanya mendukung `runtime: "subagent"` dan selalu mempertahankan sesi yang dibuat.
</ParamField>
<ParamField path="worktree" type="boolean" default="false">
  Sediakan worktree git terkelola untuk sesi dasbor baru. Memerlukan `visible: true`.
</ParamField>
<ParamField path="worktreeName" type="string">
  Nama worktree terkelola opsional. Memerlukan `visible: true` dan `worktree: true`.
</ParamField>
<ParamField path="worktreeBaseRef" type="string">
  Referensi dasar git opsional untuk worktree terkelola. Memerlukan `visible: true` dan `worktree: true`.
</ParamField>

<Warning>
`sessions_spawn` **tidak** menerima parameter pengiriman kanal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Sub-agent native melaporkan
giliran asisten terbaru mereka kembali kepada peminta; pengiriman eksternal tetap menjadi tanggung jawab
agen induk/peminta.
</Warning>

Dengan `visible: true`, `model`, `cwd`, dan `context: "fork"` dengan agen yang sama didukung. Target dalam sandbox membatasi `cwd` ke ruang kerja agen tersebut. Pengikatan utas, `mode`, penggantian tingkat penalaran, `lightContext`, `attachments`, dan `attachAs` tidak tersedia pada jalur ini karena sesi yang terlihat merupakan sesi dasbor persisten yang dibuat melalui `sessions.create`. Spawn yang terlihat ditolak jika peminta itu sendiri di-spawn dengan daftar izin atau daftar penolakan alat yang diwariskan; pembatasan tersebut ditetapkan saat spawn dan tidak memiliki penggantian konfigurasi. Pencantuman dan pengalamatan sesi mematuhi `tools.sessions.visibility`; cakupan default `tree` mencakup sesi saat ini dan subtree spawn miliknya sendiri. Lihat [Worktree terkelola](/id/concepts/managed-worktrees) untuk perilaku penamaan checkout, penyiapan, pembersihan, dan pemulihan.

### Nama tugas dan penargetan

`taskName` adalah penanda untuk orkestrasi yang ditujukan bagi model, bukan kunci sesi.
Gunakan untuk nama child yang stabil seperti `review_subagents`,
`linux_validation`, atau `docs_update` ketika koordinator mungkin perlu memeriksa
child tersebut nanti.

Resolusi target menerima kecocokan persis `taskName` dan prefiks yang
tidak ambigu. Pencocokan dibatasi pada jendela target aktif/terbaru yang sama dengan yang digunakan
oleh target bernomor `/subagents`, sehingga child lama yang telah selesai tidak membuat
penanda yang digunakan kembali menjadi ambigu. Jika dua child aktif atau terbaru memiliki
`taskName` yang sama, target tersebut ambigu; gunakan indeks daftar, kunci sesi, atau
id proses sebagai gantinya.

Target yang dicadangkan `last` dan `all` bukan nilai `taskName` yang valid
karena keduanya telah memiliki makna kontrol.

## Alat: `sessions_yield`

Mengakhiri giliran model saat ini dan menunggu peristiwa runtime, terutama
peristiwa penyelesaian sub-agent, tiba sebagai pesan berikutnya. Gunakan setelah
melakukan spawn pekerjaan child yang diperlukan ketika peminta tidak dapat menghasilkan jawaban
akhir hingga penyelesaian tersebut tiba.

`sessions_yield` adalah primitif penantian. Jangan menggantinya dengan perulangan polling
terhadap `subagents`, `sessions_list`, `sessions_history`, shell
`sleep`, atau polling proses hanya untuk mendeteksi penyelesaian child.

Gunakan `sessions_yield` hanya ketika daftar alat efektif sesi menyertakannya.
Beberapa profil alat minimal atau khusus mungkin mengekspos `sessions_spawn` dan
`subagents` tanpa mengekspos `sessions_yield`; dalam hal tersebut, jangan membuat
perulangan polling hanya untuk menunggu penyelesaian.

Ketika terdapat child aktif, OpenClaw menyisipkan blok prompt ringkas yang dihasilkan runtime
`Active Subagents` ke dalam giliran normal agar peminta dapat melihat
sesi child saat ini, id proses, status, label, tugas, dan
alias `taskName` tanpa polling. Bidang tugas dan label dalam blok tersebut
dikutip sebagai data, bukan instruksi, karena dapat berasal
dari argumen spawn yang diberikan pengguna/model.

## Alat: `subagents`

Mencantumkan proses sub-agent yang di-spawn dan catatan tugas latar belakang yang dimiliki oleh
pohon sesi peminta. Baris tugas mencakup sub-agent native, proses ACP,
pekerjaan CLI/media Gateway, dan eksekusi cron. Cakupannya terbatas pada peminta
saat ini; sebuah child hanya dapat melihat child yang dikendalikannya sendiri.

Gunakan `subagents` untuk status sesuai permintaan dan debugging. Gunakan `sessions_yield` untuk
menunggu peristiwa penyelesaian.

Gunakan `action: "cancel"` dengan `taskId` yang dikembalikan oleh `action: "list"` untuk menghentikan
tugas. Pembatalan dibatasi pada pohon sesi yang dikendalikan; sub-agent leaf
tidak dapat membatalkan pekerjaan yang dimiliki sesi lain.

## Sesi terikat utas

Ketika pengikatan utas diaktifkan untuk sebuah kanal, sub-agent dapat tetap terikat
ke sebuah utas sehingga pesan pengguna lanjutan dalam utas tersebut terus dirutekan ke
sesi sub-agent yang sama.

### Kanal yang mendukung utas

Sebuah kanal mendukung sesi sub-agent persisten yang terikat utas
(`sessions_spawn` dengan `thread: true`) ketika mendaftarkan adaptor pengikatan
percakapan. Kanal bawaan dengan dukungan tersebut: **Discord**,
**iMessage**, **Matrix**, dan **Telegram**. Discord dan Matrix secara default
membuat utas child; Telegram dan iMessage secara default mengikat
percakapan saat ini. Gunakan kunci konfigurasi `threadBindings` per kanal untuk
pengaktifan, batas waktu, dan `spawnSessions`.

### Alur singkat

<Steps>
  <Step title="Spawn">
    `sessions_spawn` dengan `thread: true` (dan secara opsional `mode: "session"`).
  </Step>
  <Step title="Ikat">
    OpenClaw membuat atau mengikat utas ke target sesi tersebut di kanal aktif.
  </Step>
  <Step title="Rutekan tindak lanjut">
    Balasan dan pesan lanjutan dalam utas tersebut dirutekan ke sesi yang terikat.
  </Step>
  <Step title="Periksa batas waktu">
    Gunakan `/session idle` untuk memeriksa/memperbarui penghilangan fokus otomatis saat tidak aktif dan
    `/session max-age` untuk mengendalikan batas maksimum.
  </Step>
  <Step title="Lepaskan">
    Gunakan `/unfocus` untuk melepaskan secara manual.
  </Step>
</Steps>

### Kontrol manual

| Perintah            | Efek                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Ikat utas saat ini (atau buat utas) ke target sub-agent/sesi                     |
| `/unfocus`         | Hapus pengikatan untuk utas terikat saat ini                                           |
| `/agents`          | Cantumkan proses aktif dan status pengikatan (`binding:<id>`, `unbound`, atau `bindings unavailable`) |
| `/session idle`    | Periksa/perbarui penghilangan fokus otomatis saat tidak aktif (khusus utas terikat yang sedang difokuskan)                             |
| `/session max-age` | Periksa/perbarui batas maksimum (khusus utas terikat yang sedang difokuskan)                                      |

### Sakelar konfigurasi

- **Default global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kunci penggantian kanal dan pengikatan otomatis saat spawn** bersifat khusus adaptor. Lihat [Kanal yang mendukung utas](#thread-supporting-channels) di atas.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference) dan
[Perintah slash](/id/tools/slash-commands) untuk detail adaptor terkini.

### Daftar izin

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Daftar id agen yang dikonfigurasi dan dapat ditargetkan melalui `agentId` eksplisit (`["*"]` mengizinkan target apa pun yang dikonfigurasi). Default: hanya agen peminta. Jika Anda menetapkan daftar dan tetap ingin peminta melakukan spawn dirinya sendiri dengan `agentId`, sertakan id peminta dalam daftar.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Daftar izin agen target terkonfigurasi default yang digunakan ketika agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Penggantian per agen: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Batas waktu per panggilan untuk upaya pengiriman pengumuman `agent` Gateway. Nilai berupa milidetik bilangan bulat positif dan dibatasi hingga maksimum timer yang aman bagi platform. Percobaan ulang sementara dapat membuat total waktu tunggu pengumuman lebih lama daripada satu batas waktu yang dikonfigurasi.
</ParamField>

Jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target
yang akan berjalan di luar sandbox.

### Penemuan

Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk
`sessions_spawn`. Respons mencakup model efektif dan metadata runtime tertanam
setiap agen yang tercantum sehingga pemanggil dapat membedakan OpenClaw, app-server Codex,
dan runtime native lain yang dikonfigurasi.

Entri `allowAgents` harus merujuk ke id agen yang dikonfigurasi dalam `agents.list[]`.
`["*"]` berarti agen target apa pun yang dikonfigurasi beserta peminta. Jika konfigurasi agen
dihapus tetapi id-nya tetap ada dalam `allowAgents`, `sessions_spawn` menolak id tersebut
dan `agents_list` mengabaikannya. Jalankan `openclaw doctor --fix` untuk membersihkan
entri daftar izin yang usang, atau tambahkan entri `agents.list[]` minimal jika target harus
tetap dapat dibuat sambil mewarisi nilai default.

### Pengarsipan otomatis

- Sesi subagen secara otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default `60`).
- Pengarsipan menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah pengumuman (tetap menyimpan transkrip melalui penggantian nama).
- Pengarsipan otomatis dilakukan sebisa mungkin; pewaktu yang tertunda akan hilang jika Gateway dimulai ulang.
- Batas waktu eksekusi yang dikonfigurasi **tidak** melakukan pengarsipan otomatis; batas tersebut hanya menghentikan eksekusi. Sesi tetap ada hingga pengarsipan otomatis.
- Pengarsipan otomatis berlaku sama untuk sesi kedalaman 1 dan kedalaman 2.
- Pembersihan browser terpisah dari pembersihan arsip: tab/proses browser yang dilacak ditutup sebisa mungkin ketika eksekusi selesai, meskipun catatan transkrip/sesi dipertahankan.

## Subagen bertingkat

Secara default, subagen tidak dapat membuat subagen mereka sendiri
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
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagen (orkestrator saat kedalaman 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagen (pekerja daun)                   | Tidak pernah                        |

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
tetap berfokus pada pekerjaan aktif — turunan aktif tetap terhubung, turunan yang berakhir tetap
terlihat selama jendela waktu terbaru yang singkat, dan tautan turunan usang yang hanya ada di penyimpanan
diabaikan setelah jendela kesegarannya. Hal ini mencegah metadata `spawnedBy` /
`parentSessionKey` lama menghidupkan kembali turunan semu setelah
dimulai ulang. Jika peristiwa penyelesaian turunan tiba setelah Anda sudah mengirim
jawaban akhir, tindak lanjut yang benar adalah token diam persis
`NO_REPLY` / `no_reply`.
</Note>

### Kebijakan alat berdasarkan kedalaman

- Turunan menangkap kebijakan pengirim efektif milik peminta saat dibuat. Eksekusi turunan tanpa pengirim dan kelanjutan operator terautentikasi mempertahankan snapshot tersebut meskipun `toolsBySender` berubah kemudian; pembatasan global, agen, penyedia, sandbox, dan subagen saat ini tetap berlaku. Giliran kanal eksternal baru yang menargetkan turunan akan menyelesaikan ulang kebijakan pengirim saat ini.
- Peran dan cakupan kendali ditulis ke metadata sesi saat pembuatan. Hal ini mencegah kunci sesi datar atau yang dipulihkan memperoleh kembali hak istimewa orkestrator secara tidak sengaja.
- **Kedalaman 1 (orkestrator, saat `maxSpawnDepth >= 2`):** mendapatkan `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat membuat turunan dan memeriksa statusnya. Alat sesi/sistem lainnya tetap ditolak.
- **Kedalaman 1 (daun, saat `maxSpawnDepth == 1`):** tanpa alat sesi (perilaku default saat ini).
- **Kedalaman 2 (pekerja daun):** tanpa alat sesi — `sessions_spawn` selalu ditolak pada kedalaman 2. Tidak dapat membuat turunan lebih lanjut.

### Batas pembuatan per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki paling banyak `maxChildrenPerAgent`
(default `5`) turunan aktif pada satu waktu. Hal ini mencegah fan-out tak terkendali
dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator kedalaman 1 secara otomatis menghentikan semua turunan
kedalaman 2-nya:

- `/stop` dalam obrolan utama menghentikan semua agen kedalaman 1 dan meneruskan penghentian ke turunan kedalaman 2 mereka.

## Autentikasi

Autentikasi subagen ditentukan berdasarkan **id agen**, bukan berdasarkan jenis sesi:

- Kunci sesi subagen adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan autentikasi dimuat dari `agentDir` milik agen tersebut.
- Profil autentikasi agen utama digabungkan sebagai **fallback**; profil agen menimpa profil utama jika terjadi konflik.

Penggabungan bersifat aditif, sehingga profil utama selalu tersedia sebagai
fallback. Autentikasi yang sepenuhnya terisolasi untuk setiap agen belum didukung.

## Pengumuman

Subagen melaporkan kembali melalui langkah pengumuman:

- Langkah pengumuman berjalan di dalam sesi subagen (bukan sesi peminta).
- Jika subagen membalas persis `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token diam persis `NO_REPLY` / `no_reply`, keluaran pengumuman ditekan meskipun sebelumnya ada progres yang terlihat.

Pengiriman bergantung pada kedalaman peminta:

- Sesi peminta tingkat teratas menggunakan panggilan tindak lanjut `agent` dengan pengiriman eksternal (`deliver=true`).
- Sesi subagen peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) agar orkestrator dapat menyintesis hasil turunan di dalam sesi.
- Jika sesi subagen peminta bertingkat sudah tidak ada, OpenClaw beralih ke peminta sesi tersebut jika tersedia.

Untuk sesi peminta tingkat teratas, pengiriman langsung mode penyelesaian terlebih dahulu
menentukan rute percakapan/utas terikat dan override hook, lalu mengisi
bidang target kanal yang hilang dari rute tersimpan milik sesi peminta.
Hal ini menjaga penyelesaian tetap berada pada obrolan/topik yang tepat meskipun asal
penyelesaian hanya mengidentifikasi kanal.

Agregasi penyelesaian turunan dibatasi pada eksekusi peminta saat ini ketika
membangun temuan penyelesaian bertingkat, sehingga mencegah keluaran turunan dari eksekusi
sebelumnya yang usang bocor ke pengumuman saat ini. Balasan pengumuman mempertahankan
perutean utas/topik jika tersedia pada adaptor kanal.

### Konteks pengumuman

Konteks pengumuman dinormalisasi menjadi blok peristiwa internal yang stabil:

| Bidang          | Sumber                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Sumber         | `subagent` atau `cron`                                                                                     |
| Id sesi    | Kunci/id sesi turunan                                                                                     |
| Jenis           | Jenis pengumuman + label tugas                                                                               |
| Status         | Diturunkan dari hasil runtime (`ok`, `error`, `timeout`, atau `unknown`) — **bukan** disimpulkan dari teks model |
| Isi hasil | Teks asisten terbaru yang terlihat dari turunan                                                             |
| Tindak lanjut      | Instruksi yang menjelaskan kapan harus membalas atau tetap diam                                                      |

Eksekusi terminal yang gagal melaporkan status kegagalan tanpa memutar ulang teks
balasan yang ditangkap. Keluaran alat/toolResult tidak dipromosikan menjadi teks hasil turunan.

### Baris statistik

Payload pengumuman menyertakan baris statistik di bagian akhir (bahkan saat dibungkus):

- Runtime (misalnya `runtime 5m12s`).
- Penggunaan token (masukan/keluaran/total).
- Perkiraan biaya saat harga model dikonfigurasi (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, dan jalur transkrip agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa berkas pada disk.

Metadata internal hanya ditujukan untuk orkestrasi; balasan yang ditampilkan
kepada pengguna harus ditulis ulang dengan gaya asisten normal.

### Mengapa memilih `sessions_history`

`sessions_history` adalah jalur orkestrasi yang lebih aman untuk membaca transkrip
turunan dari dalam giliran agen:

- Menyunting teks yang menyerupai kredensial/token meskipun penyuntingan log umum dinonaktifkan.
- Memotong blok teks panjang (4000 karakter per blok) dan membuang tanda tangan pemikiran, payload pemutaran ulang penalaran, serta data gambar sebaris.
- Memberlakukan batas respons 80 KB; baris yang terlalu besar diganti dengan `[sessions_history omitted: message too large]`.
- Gunakan `nextOffset` jika tersedia untuk menelusuri mundur jendela transkrip yang lebih lama.
- `sessions_history` **tidak** menghapus tag penalaran, kerangka `<relevant-memories>`, atau XML panggilan alat dari teks pesan — ini mengembalikan blok konten terstruktur yang mendekati bentuk transkrip mentah, hanya saja telah disunting dan dibatasi ukurannya. `/subagents log` menerapkan pembersih prosa yang lebih menyeluruh (menghapus tag penalaran, kerangka memori, dan XML panggilan alat) karena alat tersebut merender baris obrolan biasa, bukan blok terstruktur.
- Pemeriksaan transkrip mentah pada disk adalah fallback ketika Anda memerlukan transkrip lengkap byte demi byte.

## Kebijakan alat

Subagen terlebih dahulu menggunakan profil dan pipeline kebijakan alat yang sama dengan agen induk atau
target. Setelah itu, OpenClaw menerapkan lapisan pembatasan
subagen.

Subagen selalu kehilangan `gateway`, `agents_list`, `session_status`, dan
`cron` terlepas dari kedalaman atau perannya (alat tingkat sistem/interaktif, atau
alat yang harus dikoordinasikan oleh agen utama). Subagen daun (perilaku default kedalaman 1,
dan selalu pada kedalaman 2) juga kehilangan `subagents`,
`sessions_list`, `sessions_history`, dan `sessions_spawn`. Subagen tidak pernah
mendapatkan alat `message` — alat tersebut dinonaktifkan saat pembuatan, bukan difilter oleh
daftar penolakan ini — dan `sessions_send` tetap ditolak agar subagen
berkomunikasi hanya melalui rantai pengumuman.

`sessions_history` juga tetap menjadi tampilan pengingatan kembali yang terbatas dan dibersihkan di sini —
bukan dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, subagen orkestrator kedalaman 1 juga
menerima `sessions_spawn`, `subagents`, `sessions_list`, dan
`sessions_history` agar dapat mengelola turunannya.

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
        // penolakan berlaku
        deny: ["gateway", "cron"],
        // jika allow ditetapkan, ini menjadi hanya-izinkan (penolakan tetap berlaku)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` adalah filter akhir hanya-izinkan. Filter ini dapat mempersempit
kumpulan alat yang telah ditetapkan, tetapi tidak dapat **menambahkan kembali** alat yang dihapus
oleh `tools.profile`. Misalnya, `tools.profile: "coding"` mencakup
`web_search`/`web_fetch`, tetapi tidak mencakup alat `browser`. Agar
subagen berprofil coding dapat menggunakan otomatisasi browser, tambahkan browser pada
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
subagen masih aktif. Proses yang belum berakhir dan lebih lama daripada jendela proses kedaluwarsa
(2 jam, atau batas waktu proses yang dikonfigurasi ditambah masa tenggang singkat,
mana pun yang lebih lama) tidak lagi dihitung sebagai aktif/tertunda dalam `/subagents list`,
ringkasan status, penghalangan penyelesaian turunan, dan pemeriksaan
konkurensi per sesi.

Setelah Gateway dimulai ulang, proses hasil pemulihan yang belum berakhir dan telah kedaluwarsa akan dibersihkan kecuali
sesi turunannya ditandai `abortedLastRun: true`. Proses yang dibatalkan
akibat mulai ulang tetap terdaftar untuk alur pemulihan subagen yatim: proses
kedaluwarsa diselesaikan tanpa pelanjutan, sedangkan sesi turunan yang masih baru menerima
pesan pelanjutan sintetis sebelum penanda dibatalkan dihapus.

Pemulihan otomatis setelah mulai ulang dibatasi per sesi turunan. Jika turunan
subagen yang sama diterima berulang kali untuk pemulihan yatim di dalam
jendela kemacetan ulang cepat, OpenClaw menyimpan penanda pemulihan permanen pada
sesi tersebut dan berhenti melanjutkannya secara otomatis pada mulai ulang berikutnya. Jalankan
`openclaw tasks maintenance --apply` untuk merekonsiliasi catatan tugas, atau
`openclaw doctor --fix` untuk menghapus tanda pemulihan dibatalkan yang kedaluwarsa pada
sesi yang memiliki penanda permanen.

<Note>
Jika pembuatan subagen gagal dengan Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, periksa pemanggil RPC sebelum mengedit status pemasangan.
Pengiriman koordinasi internal `sessions_spawn` dilakukan di dalam proses ketika
pemanggil sudah berjalan di dalam konteks permintaan Gateway, sehingga tidak
membuka WebSocket loopback atau bergantung pada dasar cakupan perangkat terpasang milik CLI.
Pemanggil di luar proses Gateway tetap menggunakan fallback WebSocket
sebagai `client.id: "gateway-client"` dengan `client.mode: "backend"`
melalui autentikasi token bersama/kata sandi loopback langsung. Pemanggil jarak jauh, penggunaan
`deviceIdentity` secara eksplisit, jalur token perangkat eksplisit, serta klien browser/node
tetap memerlukan persetujuan perangkat normal untuk peningkatan cakupan.
</Note>

## Menghentikan

- Mengirim `/stop` dalam percakapan pemohon akan membatalkan sesi pemohon dan menghentikan semua proses subagen aktif yang dibuat darinya, yang diteruskan ke turunan bertingkat.

## Batasan

- Pengumuman subagen bersifat **upaya terbaik**. Jika Gateway dimulai ulang, pekerjaan "umumkan kembali" yang tertunda akan hilang.
- Subagen tetap berbagi sumber daya proses Gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu tidak memblokir: ini segera mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`). Subagen bawaan Codex mengikuti batas yang sama: `TOOLS.md` tetap berada dalam instruksi utas Codex yang diwarisi, sedangkan persona khusus induk, identitas, dan berkas pengguna disuntikkan sebagai instruksi kolaborasi yang dicakup per giliran agar turunan tidak mengkloningnya.
- Kedalaman bertingkat maksimum adalah 5 (rentang `maxSpawnDepth`: 1-5). Kedalaman 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi turunan aktif per sesi (default `5`, rentang `1-20`).

## Terkait

- [Alat sesi dan perubahan status](/id/concepts/session-tool)
- [Agen ACP](/id/tools/acp-agents)
- [Pengiriman agen](/id/tools/agent-send)
- [Tugas latar belakang](/id/automation/tasks)
- [Alat sandbox multiagen](/id/tools/multi-agent-sandbox-tools)
