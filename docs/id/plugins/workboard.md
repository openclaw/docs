---
read_when:
    - Anda menginginkan papan kerja bergaya Kanban di UI Kontrol
    - Anda sedang mengaktifkan atau menonaktifkan plugin Workboard bawaan
    - Anda ingin melacak pekerjaan agen yang direncanakan tanpa pengelola proyek eksternal
summary: Papan kerja dasbor opsional untuk kartu milik agen dan serah terima sesi
title: Plugin papan kerja
x-i18n:
    generated_at: "2026-07-19T16:40:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 38f138584fed2d052ed45798c38a342fd9fe08eddf4fef9f73c52353f4b0ded2
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard menambahkan papan bergaya Kanban opsional ke
[UI Kontrol](/id/web/control-ui): kartu pekerjaan berukuran untuk agen, penugasan kepada agen,
dan tautan kembali ke tugas, proses, serta sesi dasbor kartu tersebut.

Workboard sengaja dibuat sederhana: Workboard melacak pekerjaan operasional lokal untuk satu
Gateway OpenClaw. Workboard bukan pengganti GitHub Issues, Linear, Jira, atau
sistem manajemen proyek tim lainnya.

## Mengaktifkannya

Workboard disertakan tetapi dinonaktifkan secara default:

1. Buka **Plugin** di UI Kontrol, atau gunakan `/settings/plugins` relatif terhadap
   jalur dasar UI Kontrol yang dikonfigurasi. Misalnya, jalur dasar `/openclaw`
   menggunakan `/openclaw/settings/plugins`.
2. Temukan **Workboard** dan pilih **Aktifkan**. Karena Workboard disertakan bersama
   OpenClaw, tindakan **Instal** tidak diperlukan.
3. Jika UI melaporkan bahwa mulai ulang diperlukan, mulai ulang Gateway.

Tab Workboard muncul di navigasi dasbor setelah runtime plugin dimuat.
Saat dinonaktifkan, tab tersebut tetap tersembunyi dari navigasi. Membuka rute
`/workboard` secara langsung saat plugin dinonaktifkan atau diblokir oleh
`plugins.allow`/`plugins.deny` menampilkan status plugin tidak tersedia, bukan data
kartu.

Alur kerja CLI yang setara adalah:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Konfigurasi

Workboard tidak memiliki konfigurasi khusus plugin. Aktifkan/nonaktifkan dengan entri
plugin standar:

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

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Bidang kartu

| Bidang      | Nilai                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | string berformat bebas                                                                                        |
| `agentId`   | agen yang ditugaskan secara opsional                                                                          |
| referensi tertaut | tugas, proses, sesi, atau URL sumber opsional                                                                  |
| `execution` | metadata opsional untuk proses Codex/Claude yang dimulai dari kartu (mesin, mode, model, sesi, id proses, status) |

Kartu juga memuat metadata ringkas untuk percobaan, komentar, tautan, bukti,
artefak, pengaturan otomatisasi, lampiran, log pekerja, status protokol
pekerja, klaim, diagnostik, notifikasi, id templat, status arsip, dan
deteksi sesi kedaluwarsa, serta daftar peristiwa terbaru (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Metadata ini memungkinkan
operator melihat bagaimana kartu berpindah melalui papan tanpa membuka sesi
tertaut; metadata tersebut merupakan konteks operasional lokal, bukan pengganti transkrip
sesi atau riwayat isu GitHub.

Plugin dan UI Kontrol menggunakan satu kontrak kartu Workboard. Oleh karena itu, penyegaran dasbor
mempertahankan asal-usul dan otoritas ruang kerja, status klaim, tindakan
diagnostik, serta nomor urut notifikasi, alih-alih memproyeksikan salinan kartu
khusus UI yang lebih kecil. Jenis diagnostik, tingkat keparahan diagnostik, dan
jenis notifikasi yang tidak dikenal diabaikan hingga kedua permukaan mendukungnya; semuanya tidak pernah
ditulis ulang menjadi status valid lainnya.

Dasbor yang terbuka diperbarui dari invalidasi `plugin.workboard.changed`. Setiap
peristiwa hanya berisi epoch dan revisi penyimpanan; UI kemudian membaca ulang kartu
kanonis melalui RPC `operator.read` normal. Beberapa revisi digabungkan menjadi
satu pembacaan lanjutan. Workboard menunda pembacaan tersebut saat kartu sedang diseret,
diedit, atau ditulis, lalu melanjutkannya setelah interaksi lokal selesai. Setiap
penyambungan ulang selalu melakukan pemuatan ulang kanonis. Tidak ada jajak pendapat rutin terhadap seluruh
kartu, dan **Segarkan** tetap tersedia sebagai pemulihan manual.

Jika terdapat lebih dari satu papan, bilah alat menyertakan filter **Papan** yang didukung
oleh metadata papan tersimpan, bukan hanya kartu yang sedang terlihat. Oleh karena itu, papan kosong
dan yang diarsipkan tetap dapat dipilih. Kartu tanpa id papan eksplisit
termasuk dalam papan kanonis `default`. Papan yang dipilih disimpan
dalam parameter kueri `?board=`, sehingga URL Workboard yang difilter dapat ditandai
atau dibagikan; memilih **Semua papan** akan menghapus parameter tersebut.

Kartu disimpan dalam status Gateway milik plugin dan berpindah bersama
status OpenClaw lainnya milik Gateway tersebut (lihat [Penyimpanan](#storage)).

## Memulai pekerjaan dari kartu

Kartu yang tidak tertaut dapat langsung memulai pekerjaan:

- **Jalankan Codex** / **Jalankan Claude** memulai proses agen yang dilacak sebagai tugas dengan
  mesin eksplisit, mengirim prompt kartu, dan menandai kartu sebagai `running`. Proses Codex
  menggunakan `openai/gpt-5.6-sol`; proses Claude menggunakan `anthropic/claude-sonnet-4-6`.
- **Buka Codex** / **Buka Claude** membuat sesi dasbor tertaut tanpa
  mengirim prompt kartu atau memindahkan kartu, untuk pekerjaan manual yang tetap
  terhubung ke papan.

Proses mandiri menggunakan jalur proses agen yang dilacak sebagai tugas milik Gateway (agen
dan model default kecuali Codex/Claude dipilih secara eksplisit); Workboard kemudian menautkan
tugas yang dihasilkan, id proses, dan kunci sesi kembali ke kartu. Setiap eksekusi
tertaut juga mencatat ringkasan percobaan (mesin, mode, model, id proses,
stempel waktu, status, jumlah kegagalan bergulir) agar kegagalan berulang tetap terlihat.

Dasbor menyegarkan status tugas dari buku besar tugas Gateway, dengan mencocokkan
tugas dengan kartu berdasarkan id tugas, id proses, atau kunci sesi tertaut. Tugas yang mengantre/berjalan
mempertahankan siklus hidup kartu tetap aktif; tugas yang selesai, gagal, kehabisan waktu, atau
dibatalkan memindahkan kartu menuju `review` atau `blocked` menggunakan aturan sinkronisasi
yang sama seperti sesi tertaut (lihat [Sinkronisasi siklus hidup sesi](#session-lifecycle-sync)).

## Alat agen

| Alat                                                                                                                                             | Tujuan                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Mencantumkan kartu ringkas beserta status klaim/diagnostik; filter papan opsional.                                                                                                                    |
| `workboard_read`                                                                                                                                 | Mengembalikan satu kartu beserta konteks pekerja terbatas (catatan, percobaan, komentar, tautan, bukti, artefak, hasil induk, pekerjaan penerima tugas terbaru, diagnostik aktif).                               |
| `workboard_create`                                                                                                                               | Membuat kartu dengan induk, tenant, keterampilan, papan, metadata ruang kerja, kunci idempotensi, batas waktu proses, dan anggaran percobaan ulang opsional.                                                             |
| `workboard_link`                                                                                                                                 | Menautkan induk ke kartu anak. Anak tetap `todo` hingga setiap induk mencapai `done`, lalu promosi pengiriman memindahkannya ke `ready`.                                                     |
| `workboard_claim`                                                                                                                                | Mengklaim kartu untuk agen pemanggil; memindahkan `backlog`/`todo`/`ready` ke `running`.                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Menyegarkan heartbeat klaim selama proses yang lebih panjang.                                                                                                                                          |
| `workboard_release`                                                                                                                              | Melepaskan klaim setelah penyelesaian, penj jedaan, atau serah terima; dapat memindahkan kartu ke status berikutnya.                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | Alat siklus hidup terstruktur untuk ringkasan akhir, bukti, artefak, dan manifes kartu yang dibuat (harus merujuk kartu yang ditautkan kembali ke kartu yang diselesaikan) atau alasan pemblokiran.                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Menyimpan lampiran kartu kecil dalam status SQLite plugin, mengindeksnya pada kartu, dan mengeksposnya dalam konteks pekerja.                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Mencatat baris log pekerja dan memblokir kartu ketika pekerja otomatis berhenti tanpa memanggil `workboard_complete`/`workboard_block`.                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Mengelola metadata papan tersimpan (nama tampilan, deskripsi, status arsip, ruang kerja default).                                                                                            |
| `workboard_runs`                                                                                                                                 | Mengembalikan riwayat percobaan proses yang tersimpan untuk suatu kartu.                                                                                                                                      |
| `workboard_specify`                                                                                                                              | Mengubah kartu triase/backlog kasar menjadi kartu `todo` yang telah diperjelas; mencatat ringkasan spesifikasi pada kartu.                                                                                      |
| `workboard_decompose`                                                                                                                            | Membagi kartu orkestrasi induk menjadi anak-anak tertaut yang mewarisi metadata papan/tenant; dapat menyelesaikan induk dengan manifes kartu yang dibuat.                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Mengelola langganan notifikasi. Pembacaan peristiwa aman untuk diputar ulang; `advance` memindahkan kursor persisten agar pemanggil dapat melanjutkan tanpa kehilangan atau membaca ganda peristiwa kartu yang selesai/gagal/usang. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Memeriksa namespace papan dan statistik antrean.                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Memulihkan atau menyerahkan pekerjaan yang macet.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | Menambahkan catatan serah terima atau melampirkan referensi bukti/artefak.                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Memindahkan pekerjaan yang diblokir kembali ke `todo`.                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | Memindahkan kartu ke status lain; kartu yang diklaim memerlukan cakupan klaim agen milik pemanggil.                                                                                                      |
| `workboard_dispatch`                                                                                                                             | Memicu promosi dependensi atau pembersihan klaim usang tanpa meluncurkan pekerja; peluncuran pekerja menggunakan Gateway atau pengiriman perintah garis miring.                                                        |

Status bukti merupakan hasil yang dilaporkan pekerja, bukan verifikasi independen. Entri `passed`
berarti pekerja melaporkan bahwa perintah atau pemeriksaannya berhasil; konsumen yang memerlukan
gerbang kualitas independen harus memeriksa perintah, URL, atau artefak terlampir dan
menjalankan pemverifikasi mereka sendiri. `workboard_proof` mengembalikan `proofId` milik catatan baru. Ketika
`workboard_complete` melaporkan status terminal bukti yang sama, teruskan `proofId` agar
catatan tertunda diselesaikan di tempat tanpa kehilangan identitas atau stempel waktunya. Bukti yang
sudah memiliki status terminal yang sama digunakan kembali tanpa perubahan. Bukti penyelesaian tanpa
`proofId` tetap hanya dapat ditambahkan, sehingga percobaan ulang berikutnya tidak dapat menulis ulang riwayat lama hanya karena
perintah atau catatannya identik.

Kartu yang diklaim menolak mutasi alat agen dari agen lain kecuali pemanggil
memegang token klaim yang dikembalikan oleh `workboard_claim`. Setiap kartu yang dikembalikan oleh
alat agen atau panggilan RPC Gateway menyamarkan `metadata.claim.token` menjadi `[redacted]`
(token itu sendiri dikembalikan satu kali, pada tingkat teratas, hanya dari `workboard_claim`),
sehingga operator dasbor dan agen lain dapat memeriksa status klaim tanpa pernah
melihat token yang dapat digunakan. Pemulihan dilakukan melalui
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, yang tidak
memerlukan token.

## Pengiriman

Pengiriman bersifat lokal pada Gateway: pengiriman tidak membuat proses OS arbitrer. Sesi
subagen OpenClaw normal tetap memiliki eksekusi. Satu putaran pengiriman:

1. Mempromosikan kartu yang dependensinya siap.
2. Mencatat metadata pengiriman pada kartu yang siap.
3. Memblokir klaim yang kedaluwarsa atau proses yang kehabisan waktu.
4. Menandai kartu triase yang dikonfigurasi papan sebagai kandidat orkestrasi.
5. Mengklaim sejumlah kecil kartu yang siap dan memulai proses pekerja melalui
   runtime subagen Gateway.

Pekerja memperoleh konteks kartu terbatas beserta token klaim yang diperlukan untuk mengirim heartbeat,
menyelesaikan, atau memblokir kartu melalui alat Workboard.

Jalur ruang kerja mengikuti otoritas sistem berkas pemanggil yang sudah ada. Klien Gateway
dengan `operator.write` dapat menggunakan ruang kerja agen yang dikonfigurasi;
klien `operator.admin` dapat menggunakan checkout host lainnya. Alat agen dalam sandbox menggunakan
akses ruang kerja sandbox-nya, sedangkan alat khusus ruang kerja tanpa sandbox menggunakan
root ruang kerja yang dikonfigurasi. Workboard mencatat otoritas tersebut ketika ruang kerja
ditetapkan dan mengiriskannya kembali dengan otoritas pemanggil saat ini ketika dikirimkan,
sehingga kartu yang tersimpan tidak dapat memperluas akses pemanggil berikutnya. Kartu lama dengan
ruang kerja host eksplisit tetapi tanpa otoritas yang tercatat harus menyimpan ulang ruang kerja tersebut
sebelum pengiriman host penuh; kartu tanpa jalur host mengadopsi
otoritas pemanggil saat ini ketika pertama kali dikirimkan.

Pengiriman yang terikat ruang kerja hanya menerima direktori atau checkout Git jika
root repositorinya sama persis dengan ruang kerja agen target. Permintaan worktree
dipersempit ke direktori tersebut dan disimpan sebagai ruang kerja direktori, sehingga
host tidak mewujudkan checkout atau menjalankan kode penyiapan repositori. Pekerja
target harus menggunakan sandbox Docker yang dapat ditulisi dan tidak digunakan bersama untuk ruang kerja
yang sama persis tersebut, tanpa eksekusi dengan hak akses tinggi, pengesampingan eksekusi host/node yang tersimpan, atau
alat plugin dan MCP yang belum diklasifikasikan. Workboard menghitung alat terdaftarnya
alih-alih memercayai prefiks `workboard_*`, dan pengiriman menolak kontainer Docker
aktif yang hash mount/konfigurasi langsungnya sudah usang. Pengiriman melaporkan
kebijakan target yang tidak kompatibel alih-alih memulai pekerja dengan pembatasan yang lebih longgar.
Pengiriman host penuh dapat menargetkan checkout lokal lain dan mempertahankan penyiapan
worktree terkelola normal.

Otoritas ruang kerja tidak membuat model izin siklus hidup kartu kedua.
Pemanggil yang dapat memutasi kartu Workboard dapat memindahkannya secara manual melalui status
yang sama pada setiap permukaan; akses ruang kerja hanya-baca hanya mencegah pengiriman
pekerja yang memerlukan akses tulis.

### Pemilihan pekerja

Setiap putaran memulai **paling banyak 3 worker secara default**. Kartu siap diurutkan berdasarkan
prioritas, lalu posisi, lalu waktu pembuatan. Satu putaran hanya memulai satu kartu per
pemilik/agen dan melewati pemilik yang sudah memiliki pekerjaan yang sedang berjalan atau dalam review di
papan. Kartu yang diarsipkan, kartu dengan klaim aktif, dan kartu yang tidak berstatus `ready`
tidak pernah dipilih untuk memulai worker (kartu tersebut masih dapat dipengaruhi oleh
sisi data dari dispatch: pembersihan klaim kedaluwarsa, promosi dependensi, pembersihan
batas waktu).

Kunci sesi bersifat deterministik per papan/kartu, sehingga dispatch berulang diarahkan
kembali ke jalur worker yang sama alih-alih membuat sesi yang tidak terkait:

- Kartu yang ditetapkan: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Kartu yang belum ditetapkan: `subagent:workboard-<boardId>-<cardId>` (Gateway menentukan
  agen default yang dikonfigurasi)

Jika worker tidak dapat dimulai setelah kartu diklaim, Workboard memblokir
kartu, menghapus klaim, mencatat kegagalan memulai eksekusi, dan menambahkan baris
log worker—terlihat di dasbor, JSON CLI, alat agen, dan
diagnostik kartu.

### Titik masuk

- Tindakan dispatch dasbor
- `openclaw workboard dispatch`
- `/workboard dispatch` pada kanal yang mendukung perintah

Ketiganya menggunakan runtime subagen Gateway ketika Gateway tersedia. CLI
memiliki satu fallback operator: jika panggilan Gateway gagal karena galat
koneksi/tidak tersedia (atau galat `unknown method` untuk Gateway
lama), serta tidak ada target eksplisit `--url`/`--token` dan tidak ada Gateway jarak jauh
yang dikonfigurasi (`OPENCLAW_GATEWAY_URL` atau `gateway.mode: remote`) yang berlaku, CLI menjalankan
dispatch khusus data terhadap status SQLite lokal—dispatch ini dapat mempromosikan dependensi,
membersihkan klaim kedaluwarsa, dan memblokir eksekusi yang melampaui batas waktu, tetapi tidak dapat memulai worker. Kegagalan autentikasi,
izin, dan validasi dari Gateway yang dapat dijangkau tidak dianggap
sebagai tidak tersedia; kegagalan tersebut ditampilkan sebagai galat perintah, demikian pula setiap kegagalan Gateway
ketika target eksplisit `--url`/`--token` diberikan.

Metadata papan dapat menetapkan `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee`, dan `orchestratorProfile`. OpenClaw mencatat maksud ini dan
menampilkannya dalam konteks worker; spesifikasi/dekomposisi aktual tetap berjalan
melalui alat Workboard normal.

## CLI dan perintah garis miring

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Keluaran teks `list` menyembunyikan kartu yang diarsipkan secara default (`--include-archived`
mengesampingkannya); `--json` selalu menyertakan kartu yang diarsipkan, sesuai dengan kontrak kartu lengkap
yang digunakan oleh skrip yang ada. `show` dan `move` menerima prefiks id yang tidak ambigu.
`list`, `create`, `show`, dan `move` selalu membaca/menulis status Plugin lokal
secara langsung. Hanya `dispatch` yang memanggil Gateway yang sedang berjalan, dengan fallback
yang dijelaskan di atas.

Lihat [CLI Workboard](/id/cli/workboard) untuk flag lengkap, keluaran JSON, perilaku fallback
Gateway, penanganan prefiks id, aturan pemilihan dispatch, dan
pemecahan masalah.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>`, dan `/workboard dispatch` mencerminkan
CLI. Daftar dan tampilkan adalah operasi baca untuk setiap pengirim perintah yang berwenang.
Buat, pindahkan, dan dispatch memerlukan status pemilik pada permukaan chat, atau klien Gateway
dengan `operator.write`/`operator.admin`. Pemindahan operator manual menggunakan
perilaku pengesampingan klaim yang sama seperti seret dan lepas pada dasbor. Akses worktree-nya
tetap mengikuti batas ruang kerja yang sama seperti dijelaskan di atas.

## Sinkronisasi siklus hidup sesi

Kartu dapat ditautkan ke sesi dasbor yang ada, atau sesi yang dibuat ketika Anda
memulai pekerjaan dari kartu. Kartu tertaut menampilkan siklus hidup sesi secara langsung:
berjalan, kedaluwarsa, tertaut tetapi menganggur, selesai, gagal, atau hilang. Anda juga dapat mengambil
sesi yang ada dari tab Sessions dengan **Add to Workboard**; kartu
ditautkan ke sesi tersebut, menggunakan label sesi atau prompt pengguna terbaru sebagai judul,
dan mengisi awal catatan dari prompt pengguna terbaru serta respons asisten terkini
jika tersedia.

Jika sesi tertaut hilang, kartu tetap tertaut untuk konteks dan
tetap menawarkan kontrol mulai untuk memulai ulang ke sesi baru. Jika sesi tertaut
yang aktif berhenti melaporkan aktivitas terbaru, Workboard menandai kartu sebagai
`stale` dan menyimpannya sebagai metadata hingga siklus hidup menghapusnya.

Saat kartu berada dalam status pekerjaan aktif, Workboard mengikuti sesi tertaut:

| Status sesi tertaut                    | Status kartu |
| -------------------------------------- | ------------ |
| aktif                                  | `running`   |
| selesai                                | `review`    |
| gagal, dihentikan, melampaui batas waktu, atau dibatalkan | `blocked`   |

**Status review manual diprioritaskan.** Memindahkan kartu ke `review`, `blocked`, atau `done`
menghentikan sinkronisasi otomatis untuk kartu tersebut hingga Anda memindahkannya kembali ke `todo` atau `running`.

Memulai kartu menggunakan sesi Gateway normal; Workboard hanya menyimpan
metadata dan tautan kartu. Transkrip percakapan, pemilihan model, dan siklus hidup
eksekusi tetap dikelola oleh sistem sesi reguler. Gunakan **Stop** pada kartu tertaut
yang aktif untuk membatalkan eksekusi aktif—Workboard menandai kartu tersebut sebagai `blocked` agar
tetap terlihat untuk tindak lanjut.

Kartu baru dapat dimulai dari templat Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Templat mengisi awal judul, catatan, label, dan prioritas;
id templat disimpan sebagai metadata kartu.

## Alur kerja dasbor

1. Buka tab Workboard di Control UI.
2. Buat kartu dengan judul, catatan, prioritas, label, agen opsional, dan
   sesi tertaut opsional—atau buka Sessions dan pilih **Add to Workboard**
   untuk sesi yang ada.
3. Seret kartu di antara kolom, atau fokuskan kontrol status ringkasnya dan gunakan
   menu atau ArrowLeft/ArrowRight. Selama penyeretan, kartu sumber meredup dan
   kolom tujuan yang tersedia mendapatkan garis luar.
4. Mulai pekerjaan dari kartu untuk membuat atau menggunakan kembali sesi dasbor.
5. Buka sesi tertaut dari kartu saat agen bekerja.
6. Biarkan sinkronisasi siklus hidup memindahkan pekerjaan yang sedang berjalan ke `review`/`blocked`, lalu secara manual
   pindahkan kartu ke `done` setelah diterima.

## Diagnostik

Diagnostik dihitung dari metadata kartu lokal. Pemeriksaan bawaan menandai:

| Jenis                       | Kondisi                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Kartu `todo`/`backlog`/`ready` yang ditetapkan tidak diperbarui selama lebih dari 1 jam.             |
| `running_without_heartbeat` | Kartu `running` tanpa heartbeat klaim atau pembaruan eksekusi selama lebih dari 20 menit. |
| `blocked_too_long`          | Kartu `blocked` tidak diperbarui selama lebih dari 24 jam.                                   |
| `repeated_failures`         | Jumlah kegagalan yang dilacak untuk kartu mencapai 2 atau lebih.                                |
| `missing_proof`             | Kartu `done` tanpa bukti, artefak, atau lampiran.                          |
| `orphaned_session`          | Kartu `running` dengan `sessionKey` tetapi tanpa metadata `execution`.                |

## Izin

Metode RPC Gateway berada di bawah `workboard.*`:

| Cakupan          | Metode                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, daftar/ambil lampiran, pembacaan peristiwa notifikasi, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, buat/perbarui/pindahkan/hapus/komentari/tautkan/tautkanDependensi/bukti/artefak, tambah/hapus lampiran, log worker, pelanggaran protokol, klaim/heartbeat/lepas/promosikan/tetapkanUlang/klaimUlang/selesaikan/blokir/bukaBlokir, `cards.dispatch`, `cards.bulk`, arsipkan, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, langganan/hapus/majukan notifikasi |

Tidak ada metode RPC yang memerlukan `operator.admin`. Browser yang terhubung dengan akses
operator hanya-baca dapat memeriksa papan tetapi tidak dapat mengubah kartu. Cakupan admin
memperluas jalur host Workboard yang diterima; cakupan ini tidak mengubah metode yang tersedia.

## Penyimpanan

Workboard menyimpan data persisten dalam basis data SQLite relasional milik Plugin
di bawah direktori status OpenClaw: papan, kartu, label, peristiwa siklus hidup,
upaya eksekusi, komentar, tautan dependensi, bukti, referensi artefak,
metadata dan blob lampiran, diagnostik, notifikasi, log worker,
status protokol, dan langganan semuanya berada di tabel Workboard (bukan
entri nilai-kunci Plugin). Ekspor kartu mempertahankan narasi papan
tanpa menyematkan isi blob lampiran.

Instalasi yang menggunakan Workboard dalam rilis `.28` dapat menjalankan
`openclaw doctor --fix` untuk memigrasikan namespace status Plugin lama yang telah dirilis
(`workboard.cards`, `workboard.boards`, `workboard.notify`, dan, jika ada,
`workboard.attachments`) ke basis data relasional.

## Pemecahan masalah

**Tab menyatakan Workboard tidak tersedia**

```bash
openclaw plugins inspect workboard --runtime --json
```

Jika `plugins.allow` dikonfigurasi, tambahkan `workboard` ke dalamnya. Jika `plugins.deny`
berisi `workboard`, hapus sebelum mengaktifkan Plugin.

**Kartu tidak tersimpan**

Pastikan koneksi browser memiliki akses `operator.write`. Sesi operator
hanya-baca dapat mencantumkan kartu tetapi tidak dapat membuat, mengedit, memindahkan, atau menghapusnya.

**Memulai kartu tidak membuka sesi yang diharapkan**

Periksa id agen dan sesi tertaut kartu, lalu buka Sessions atau Chat untuk
memeriksa status eksekusi yang sebenarnya.

**Dispatch tidak memulai worker**

Pastikan ada setidaknya satu kartu `ready` tanpa klaim aktif:

```bash
openclaw workboard list --status ready
```

Jika CLI melaporkan dispatch khusus data, mulai atau mulai ulang Gateway dan
coba lagi—dispatch khusus data memperbarui status papan lokal tetapi tidak dapat memulai
eksekusi worker subagen. Kartu juga dapat dilewati ketika kartu lain untuk
pemilik atau agen yang sama sudah berjalan atau menunggu review; selesaikan,
blokir, atau lepaskan pekerjaan aktif tersebut sebelum melakukan dispatch lebih banyak untuk
pemilik yang sama.

## Terkait

- [Control UI](/id/web/control-ui)
- [CLI Workboard](/id/cli/workboard)
- [Plugin](/id/tools/plugin)
- [Kelola Plugin](/id/plugins/manage-plugins)
- [Sesi](/id/concepts/session)
