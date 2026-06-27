---
read_when:
    - Anda menginginkan papan kerja bergaya Kanban di UI Kontrol
    - Anda sedang mengaktifkan atau menonaktifkan Plugin Workboard bawaan
    - Anda ingin melacak pekerjaan agen yang direncanakan tanpa manajer proyek eksternal
summary: Papan kerja dasbor opsional untuk kartu yang dimiliki agen dan serah terima sesi
title: Plugin papan kerja
x-i18n:
    generated_at: "2026-06-27T18:01:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard menambahkan papan opsional bergaya Kanban ke
[Control UI](/id/web/control-ui). Gunakan untuk mengumpulkan kartu kerja seukuran agen, menetapkannya
ke agen, dan melacak tugas latar belakang, run, serta sesi dasbor yang tertaut
dari satu kartu.

Workboard sengaja dibuat kecil. Workboard melacak pekerjaan operasional lokal untuk sebuah
OpenClaw Gateway; ini bukan pengganti GitHub Issues, Linear, Jira, atau
sistem manajemen proyek tim lainnya.

## Status default

Workboard adalah plugin bawaan dan dinonaktifkan secara default kecuali Anda mengaktifkannya
di konfigurasi plugin.

Aktifkan dengan:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Lalu buka dasbor:

```bash
openclaw dashboard
```

Tab Workboard muncul di navigasi dasbor. Jika tab terlihat
tetapi plugin dinonaktifkan atau diblokir oleh `plugins.allow` / `plugins.deny`, tampilan
menampilkan status plugin-tidak-tersedia alih-alih data kartu lokal.

## Isi kartu

Setiap kartu menyimpan:

- judul dan catatan
- status: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked`, atau `done`
- prioritas: `low`, `normal`, `high`, atau `urgent`
- label
- id agen opsional
- tugas, run, sesi, atau URL sumber tertaut opsional
- metadata eksekusi opsional untuk run Codex atau Claude yang dimulai dari kartu
- metadata ringkas untuk percobaan, komentar, tautan, bukti, artefak, automasi,
  lampiran, log pekerja, status protokol pekerja, klaim, diagnostik,
  notifikasi, templat, status arsip, dan deteksi sesi usang
- peristiwa kartu terbaru seperti dibuat, dipindahkan, ditautkan, diklaim, heartbeat,
  percobaan, bukti, artefak, diagnostik, notifikasi, dispatch, arsip, usang,
  atau perubahan yang diperbarui agen

Kartu disimpan dalam status Gateway milik plugin. Kartu bersifat lokal untuk direktori
status Gateway dan berpindah bersama status OpenClaw Gateway tersebut lainnya.

Workboard menyimpan metadata ringkas per kartu agar operator dapat melihat bagaimana sebuah kartu berpindah
di papan tanpa membuka sesi tertaut. Peristiwa, ringkasan percobaan,
cuplikan bukti, tautan terkait, komentar, penanda arsip, dan penanda sesi usang
sengaja menjadi metadata lokal; semuanya tidak menggantikan transkrip sesi
atau riwayat issue GitHub.

## Eksekusi kartu dan tugas

Kartu yang belum tertaut dapat memulai pekerjaan dari kartu. Mulai secara otonom menggunakan jalur
run agen terlacak tugas milik Gateway, lalu Workboard menautkan tugas yang dihasilkan,
id run, dan kunci sesi kembali ke kartu. Mulai menggunakan agen dan model default
yang dikonfigurasi Gateway. Tindakan Codex dan Claude adalah pilihan model eksplisit
opsional:

- Run Codex atau Run Claude memulai run agen berbasis tugas, mengirim prompt
  kartu, dan menandai kartu sebagai `running`.
- Open Codex atau Open Claude membuat sesi dasbor tertaut tanpa mengirim
  prompt kartu atau memindahkan kartu, sehingga Anda dapat bekerja manual selagi tetap
  terpasang ke papan.

Metadata eksekusi menyimpan mesin yang dipilih, mode, ref model, kunci sesi,
id run, id tugas jika tersedia, dan status siklus hidup pada kartu. Eksekusi Codex
menggunakan `openai/gpt-5.5`; eksekusi Claude menggunakan
`anthropic/claude-sonnet-4-6`.

Setiap eksekusi tertaut juga mencatat ringkasan percobaan pada catatan kartu yang sama.
Ringkasan percobaan menyimpan mesin, mode, model, id run, timestamp, status,
dan jumlah kegagalan berjalan agar kegagalan berulang tetap terlihat di papan.

Dasbor menyegarkan status tugas dari ledger tugas Gateway dan mencocokkan
tugas kembali ke kartu berdasarkan id tugas, id run, atau kunci sesi tertaut. Jika tugas
mengantre atau berjalan, siklus hidup kartu menampilkan status tugas aktif. Jika tugas
selesai, gagal, time out, atau dibatalkan, siklus hidup kartu bergerak menuju
status review atau blocked menggunakan sinkronisasi siklus hidup yang sama dengan sesi tertaut.

## Koordinasi agen

Workboard juga mengekspos alat agen opsional untuk alur kerja yang sadar papan:

- `workboard_list` mencantumkan kartu ringkas beserta status klaim dan diagnostik, dengan
  filter papan opsional.
- `workboard_read` mengembalikan satu kartu plus konteks pekerja terbatas yang dibangun dari catatan,
  percobaan, komentar, tautan, bukti, artefak, hasil induk, pekerjaan assignee
  terbaru, dan diagnostik aktif.
- `workboard_create` membuat kartu dengan induk, tenant, skills,
  papan, metadata workspace, kunci idempotensi, batas runtime, dan anggaran retry opsional.
- `workboard_link` menautkan kartu induk ke kartu anak. Anak tetap di `todo`
  hingga setiap induk mencapai `done`; lalu promosi dispatch memindahkannya ke
  `ready`.
- `workboard_claim` mengklaim kartu untuk agen pemanggil dan memindahkan kartu backlog, todo,
  atau ready ke `running`.
- `workboard_heartbeat` menyegarkan heartbeat klaim selama run yang lebih lama.
- `workboard_release` melepas klaim setelah selesai, jeda, atau handoff dan
  dapat memindahkan kartu ke status berikutnya.
- `workboard_complete` dan `workboard_block` adalah alat siklus hidup terstruktur untuk
  ringkasan akhir, bukti, artefak, manifes kartu yang dibuat, dan alasan
  blocker. Manifes kartu yang dibuat harus merujuk kartu yang ditautkan kembali ke
  kartu yang selesai, sehingga anak bayangan tidak masuk ke ringkasan.
- `workboard_attachment_add`, `workboard_attachment_read`, dan
  `workboard_attachment_delete` menyimpan lampiran kartu kecil dalam status SQLite plugin,
  mengindeksnya pada kartu, dan mengeksposnya dalam konteks pekerja.
- `workboard_worker_log` dan `workboard_protocol_violation` mencatat baris log pekerja
  dan memblokir kartu saat pekerja otomatis berhenti tanpa memanggil
  `workboard_complete` atau `workboard_block`.
- `workboard_board_create`, `workboard_board_archive`, dan
  `workboard_board_delete` mengelola metadata papan tersimpan seperti nama tampilan,
  deskripsi, status arsip, dan workspace default.
- `workboard_runs` mengembalikan riwayat percobaan run tersimpan yang disimpan pada kartu.
- `workboard_specify` mengubah kartu triage atau backlog kasar menjadi kartu
  `todo` yang diperjelas dan mencatat ringkasan spesifikasi pada kartu.
- `workboard_decompose` menyebarkan kartu orkestrasi induk menjadi anak-anak tertaut,
  mewarisi metadata papan dan tenant, dan dapat menyelesaikan induk dengan
  manifes kartu yang dibuat.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance`, dan
  `workboard_notify_unsubscribe` mengelola langganan notifikasi dalam status plugin.
  Pembacaan peristiwa aman untuk replay; alat advance memindahkan cursor tahan lama
  agar pemanggil dapat melanjutkan tanpa kehilangan atau membaca ganda peristiwa kartu
  yang selesai, gagal, atau usang.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock`, dan `workboard_dispatch` memungkinkan agen
  memeriksa namespace papan, melihat statistik antrean, memulihkan pekerjaan macet, menambahkan catatan
  handoff, melampirkan referensi bukti atau artefak, memindahkan pekerjaan blocked kembali ke `todo`,
  dan memicu promosi dependensi atau pembersihan klaim usang.

Kartu yang diklaim menolak mutasi alat agen dari agen lain kecuali pemanggil
memiliki token klaim yang dikembalikan oleh `workboard_claim`. Operator dasbor tetap menggunakan
permukaan RPC Gateway normal dan dapat memulihkan atau menetapkan ulang kartu.

Workboard menyimpan data papan tahan lama dalam database SQLite relasional milik plugin
di bawah direktori status OpenClaw. Papan, kartu, label, peristiwa siklus hidup,
percobaan run, komentar, tautan dependensi, bukti, referensi artefak,
metadata dan blob lampiran, diagnostik, notifikasi, log pekerja,
status protokol, dan langganan dipersistenkan dalam tabel Workboard alih-alih
entri key-value plugin. Ekspor kartu tetap mempertahankan narasi papan
tanpa menyematkan isi blob lampiran.

Instalasi yang menggunakan Workboard dalam rilis `.28` dapat menjalankan
`openclaw doctor --fix` untuk memigrasikan namespace status plugin lama yang dikirim
(`workboard.cards`, `workboard.boards`, dan `workboard.notify`) ke dalam
database relasional. Jika namespace `workboard.attachments` lama ada,
doctor juga memigrasikan blob lampiran tersebut.

Diagnostik Workboard dihitung dari metadata kartu lokal. Pemeriksaan bawaan
menandai kartu yang ditetapkan yang menunggu terlalu lama, kartu running tanpa heartbeat terbaru,
kartu blocked yang membutuhkan perhatian, kegagalan berulang, kartu done tanpa bukti,
dan kartu running yang hanya memiliki tautan sesi longgar.

Dispatch sengaja bersifat lokal Gateway. Dispatch tidak menjalankan proses sistem operasi
arbitrer; sesi subagen OpenClaw normal tetap memiliki eksekusi. Tindakan
dispatch mempromosikan kartu yang dependensinya siap, mencatat metadata dispatch pada
kartu ready, memblokir klaim kedaluwarsa atau run yang time out, menandai kartu triage
yang dikonfigurasi papan sebagai kandidat orkestrasi, lalu mengklaim batch kecil kartu
ready dan memulai run pekerja melalui runtime subagen Gateway. Kartu yang ditetapkan
menggunakan kunci sesi pekerja `agent:<id>:subagent:workboard-*`; kartu yang tidak ditetapkan
menggunakan kunci `subagent:workboard-*` tanpa cakupan sehingga Gateway tetap menyelesaikan
agen default yang dikonfigurasi. Pekerja mendapat konteks kartu terbatas plus token klaim
yang mereka butuhkan untuk heartbeat, menyelesaikan, atau memblokir kartu melalui alat Workboard.

### Pemilihan pekerja dispatch

Setiap pass dispatch memulai paling banyak tiga pekerja secara default. Kartu ready
diurutkan berdasarkan prioritas, posisi, dan waktu pembuatan, lalu difilter untuk menghindari
kepemilikan aktif duplikat. Sebuah dispatch hanya memulai satu kartu untuk pemilik atau
agen tertentu dalam pass yang sama, dan melewati pemilik yang sudah memiliki pekerjaan running atau review
di papan.

Kartu yang diarsipkan, kartu dengan klaim aktif, dan kartu tanpa status `ready`
tidak dipilih untuk start pekerja. Kartu tersebut masih dapat terpengaruh oleh sisi data dari
dispatch saat klaim usang, promosi dependensi, atau pembersihan timeout berlaku.

### Prompt dan siklus hidup pekerja

Prompt pekerja mencakup judul kartu, catatan dan konteks terbatas,
papan yang ditetapkan, serta protokol pekerja Workboard. Prompt juga menyertakan pemilik klaim
dan token klaim sehingga pekerja dapat memanggil `workboard_heartbeat`,
`workboard_complete`, atau `workboard_block` tanpa aktor lain mengambil alih
kartu.

Saat pekerja berhasil dimulai, Workboard menyimpan kunci sesi, id run,
mesin, mode, label model, status, dan log pekerja pada kartu. Kunci sesi
deterministik untuk papan dan kartu, sehingga dispatch berulang diarahkan
kembali ke lane pekerja yang sama alih-alih membuat sesi yang tidak terkait.

Jika pekerja tidak dapat dimulai setelah kartu diklaim, Workboard memblokir
kartu, menghapus klaim, mencatat kegagalan start run, dan menambahkan baris log pekerja.
Kegagalan tersebut terlihat di dasbor, JSON CLI, alat agen, dan diagnostik kartu.

### Titik masuk dispatch

Start pekerja kartu ready dapat terjadi dari:

- tindakan dispatch dasbor
- `openclaw workboard dispatch`
- `/workboard dispatch` pada channel yang mendukung perintah

Ketiga titik masuk menggunakan runtime subagen Gateway saat Gateway
tersedia. CLI memiliki satu fallback operator tambahan: jika Gateway offline atau
tidak mengekspos metode dispatch Workboard dan tidak ada target `--url` atau
`--token` eksplisit yang diberikan, CLI menjalankan dispatch khusus data terhadap status SQLite lokal.
Fallback tersebut dapat mempromosikan dependensi, membersihkan klaim usang, dan memblokir
run yang time out, tetapi tidak dapat memulai pekerja.

Metadata papan dapat mencakup pengaturan orkestrasi seperti `autoDecompose`,
`autoDecomposePerDispatch`, `defaultAssignee`, dan `orchestratorProfile`.
OpenClaw mencatat maksud orkestrasi dan mengeksposnya dalam konteks pekerja; proses
spesifikasi dan dekomposisi aktual tetap terjadi melalui alat Workboard normal.

## CLI dan perintah slash

Plugin mendaftarkan perintah CLI root:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` memanggil Gateway yang sedang berjalan sehingga worker dimulai dengan runtime subagen yang sama seperti dasbor. Jika Gateway tidak tersedia, perintah ini beralih ke dispatch hanya-data sehingga promosi dependensi, pembersihan klaim usang, dan pemblokiran timeout tetap dapat berjalan. Kegagalan auth, izin, dan validasi tetap muncul sebagai error perintah, begitu juga kegagalan untuk target `--url` atau `--token` eksplisit.

Perintah slash `/workboard` mendukung jalur operator ringkas yang sama:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`, dan
`/workboard dispatch`. List dan show adalah operasi baca untuk pengirim perintah yang berwenang. Create dan dispatch memerlukan status owner pada permukaan chat atau klien Gateway dengan `operator.write` atau `operator.admin`.

Lihat [CLI Workboard](/id/cli/workboard) untuk flag perintah, keluaran JSON, perilaku fallback Gateway, penanganan awalan id yang tidak ambigu, aturan pemilihan dispatch, dan pemecahan masalah.

## Sinkronisasi siklus hidup sesi

Kartu dapat ditautkan ke sesi dasbor yang sudah ada atau ke sesi yang dibuat saat Anda memulai pekerjaan dari kartu. Kartu tertaut menampilkan siklus hidup sesi secara inline: berjalan, usang, tertaut idle, selesai, gagal, atau hilang.

Jika sesi tertaut hilang, kartu tetap tertaut untuk konteks dan masih menawarkan kontrol mulai sehingga Anda dapat memulai ulang pekerjaan ke sesi dasbor baru. Jika sesi tertaut aktif berhenti melaporkan aktivitas terbaru, Workboard menandai kartu sebagai usang dan menyimpan penanda sebagai metadata kartu sampai siklus hidup menghapusnya.

Anda juga dapat menangkap sesi dasbor yang sudah ada dari tab Sessions dengan Add to Workboard. Kartu ditautkan ke sesi tersebut, menggunakan label sesi atau prompt pengguna terbaru sebagai judul, dan mengisi catatan awal dari prompt pengguna terbaru ditambah respons asisten terbaru saat riwayat chat tersedia.

Workboard mengikuti sesi tertaut selama kartu masih berada dalam status kerja aktif:

- sesi tertaut aktif -> `running`
- sesi tertaut selesai -> `review`
- sesi tertaut gagal, dihentikan paksa, timeout, atau dibatalkan -> `blocked`

Status review manual menang. Jika Anda memindahkan kartu ke `review`, `blocked`, atau `done`, Workboard berhenti memindahkan kartu itu secara otomatis sampai Anda memindahkannya kembali ke `todo` atau `running`.

## Alur kerja dasbor

1. Buka tab Workboard di Control UI.
2. Buat kartu dengan judul, catatan, prioritas, label, agen opsional, dan sesi tertaut opsional.
3. Atau buka Sessions dan pilih Add to Workboard untuk sesi yang sudah ada.
4. Seret kartu antar kolom atau fokuskan kontrol status ringkas pada kartu dan gunakan menunya atau ArrowLeft/ArrowRight.
5. Mulai pekerjaan dari kartu untuk membuat atau menggunakan ulang sesi dasbor.
6. Buka sesi tertaut dari kartu saat agen bekerja.
7. Biarkan sinkronisasi siklus hidup memindahkan pekerjaan berjalan ke review atau blocked, lalu pindahkan kartu secara manual ke done saat diterima.

Memulai kartu menggunakan sesi Gateway normal. Plugin Workboard hanya menyimpan metadata dan tautan kartu; transkrip percakapan, pemilihan model, dan siklus hidup run tetap dimiliki oleh sistem sesi reguler.

Gunakan Stop pada kartu tertaut live untuk membatalkan run sesi aktif. Workboard menandai kartu tersebut `blocked` agar tetap terlihat untuk tindak lanjut.

Kartu baru dapat dimulai dari template Workboard untuk bugfix, dokumentasi, rilis, review PR, atau pekerjaan plugin. Template mengisi judul, catatan, label, dan prioritas terlebih dahulu, dan id template yang dipilih disimpan sebagai metadata kartu.

## Izin

Plugin mendaftarkan metode RPC Gateway di bawah namespace `workboard.*`:

- `workboard.cards.list` memerlukan `operator.read`
- `workboard.cards.export` memerlukan `operator.read`
- `workboard.cards.diagnostics` memerlukan `operator.read`
- `workboard.cards.diagnostics.refresh` memerlukan `operator.write`
- baca daftar/ambil attachment dan event notifikasi memerlukan `operator.read`
- kemajuan kursor notifikasi memerlukan `operator.write`
- metode create, update, move, delete, comment, link, dependency link, proof, artifact,
  attachment add/delete, worker log, protocol violation, claim, heartbeat,
  release, complete, block, unblock, dispatch, bulk, dan archive memerlukan
  `operator.write`

Browser yang terhubung dengan akses operator hanya-baca dapat memeriksa board tetapi tidak dapat mengubah kartu.

## Konfigurasi

Workboard tidak memiliki konfigurasi khusus plugin saat ini. Aktifkan atau nonaktifkan dengan entri plugin standar:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Nonaktifkan lagi dengan:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Pemecahan masalah

### Tab mengatakan Workboard tidak tersedia

Periksa kebijakan plugin:

```bash
openclaw plugins inspect workboard --runtime --json
```

Jika `plugins.allow` dikonfigurasi, tambahkan `workboard` ke allowlist tersebut. Jika
`plugins.deny` berisi `workboard`, hapus sebelum mengaktifkan plugin.

### Kartu tidak tersimpan

Konfirmasi bahwa koneksi browser memiliki akses `operator.write`. Sesi operator hanya-baca dapat mencantumkan kartu tetapi tidak dapat membuat, mengedit, memindahkan, atau menghapusnya.

### Memulai kartu tidak membuka sesi yang diharapkan

Workboard membuat tautan ke sesi dasbor normal. Periksa id agen kartu dan sesi tertaut, lalu buka tampilan Sessions atau Chat untuk memeriksa status run sebenarnya.

### Dispatch tidak memulai worker

Konfirmasi ada setidaknya satu kartu `ready` tanpa klaim aktif:

```bash
openclaw workboard list --status ready
```

Jika CLI melaporkan dispatch hanya-data, mulai atau mulai ulang Gateway dan coba lagi.
Dispatch hanya-data memperbarui status board lokal tetapi tidak dapat memulai run worker subagen.

Kartu juga dapat dilewati ketika kartu lain untuk owner atau agen yang sama sudah berjalan atau menunggu review. Selesaikan, blokir, atau lepaskan pekerjaan aktif itu sebelum men-dispatch pekerjaan lain untuk owner yang sama.

## Terkait

- [Control UI](/id/web/control-ui)
- [CLI Workboard](/id/cli/workboard)
- [Plugin](/id/tools/plugin)
- [Kelola plugin](/id/plugins/manage-plugins)
- [Sesi](/id/concepts/session)
