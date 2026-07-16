---
read_when:
    - Anda menginginkan papan kerja bergaya Kanban di UI Kontrol
    - Anda sedang mengaktifkan atau menonaktifkan plugin Workboard bawaan
    - Anda ingin melacak pekerjaan agen yang direncanakan tanpa pengelola proyek eksternal
summary: Papan kerja dasbor opsional untuk kartu milik agen dan serah terima sesi
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-16T18:31:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard menambahkan papan opsional bergaya Kanban ke
[UI Kontrol](/id/web/control-ui): kartu kerja berukuran sesuai agen, penugasan kepada agen,
dan tautan kembali ke tugas, eksekusi, serta sesi dasbor kartu tersebut.

Workboard sengaja dibuat sederhana: Workboard melacak pekerjaan operasional lokal untuk satu
Gateway OpenClaw. Workboard bukan pengganti GitHub Issues, Linear, Jira, atau
sistem manajemen proyek tim lainnya.

## Mengaktifkannya

Workboard disertakan tetapi dinonaktifkan secara default:

1. Buka **Plugin** di UI Kontrol, atau gunakan `/settings/plugins` secara relatif terhadap
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
| referensi tertaut | tugas, eksekusi, sesi, atau URL sumber opsional                                                               |
| `execution` | metadata opsional untuk eksekusi Codex/Claude yang dimulai dari kartu (mesin, mode, model, sesi, id eksekusi, status) |

Kartu juga memuat metadata ringkas untuk percobaan, komentar, tautan, bukti,
artefak, pengaturan otomatisasi, lampiran, log pekerja, status protokol pekerja,
klaim, diagnostik, notifikasi, id templat, status arsip, dan
deteksi sesi kedaluwarsa, serta daftar peristiwa terbaru (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Metadata ini memungkinkan
operator melihat bagaimana kartu bergerak melalui papan tanpa membuka sesi
tertaut; ini merupakan konteks operasional lokal, bukan pengganti transkrip
sesi atau riwayat isu GitHub.

Plugin dan UI Kontrol menggunakan satu kontrak kartu Workboard. Oleh karena itu, penyegaran dasbor
mempertahankan asal-usul dan otoritas ruang kerja, status klaim, tindakan
diagnostik, serta nomor urut notifikasi, alih-alih memproyeksikan salinan kartu
yang lebih kecil dan khusus UI. Jenis diagnostik, tingkat keparahan diagnostik, dan
jenis notifikasi yang tidak dikenal diabaikan hingga kedua permukaan mendukungnya; semua itu tidak pernah
ditulis ulang menjadi status valid lainnya.

Dasbor yang terbuka diperbarui dari invalidasi `plugin.workboard.changed`. Setiap
peristiwa hanya berisi epoch dan revisi penyimpanan; UI kemudian membaca ulang kartu
kanonis melalui RPC `operator.read` normal. Beberapa revisi digabungkan menjadi
satu pembacaan lanjutan. Workboard menunda pembacaan tersebut saat kartu sedang diseret,
diedit, atau ditulis, lalu melanjutkannya setelah interaksi lokal selesai. Setiap
penyambungan ulang selalu melakukan pemuatan ulang kanonis. Tidak ada polling rutin terhadap seluruh kartu,
dan **Segarkan** tetap tersedia sebagai pemulihan manual.

Jika terdapat lebih dari satu papan, bilah alat menyertakan filter **Papan** yang didukung
oleh metadata papan persisten, bukan hanya kartu yang sedang terlihat. Karena itu, papan kosong
dan yang diarsipkan tetap dapat dipilih. Kartu tanpa id papan eksplisit
berada di papan kanonis `default`. Papan yang dipilih disimpan
dalam parameter kueri `?board=`, sehingga URL Workboard yang telah difilter dapat ditandai
atau dibagikan; memilih **Semua papan** akan menghapus parameter tersebut.

Kartu disimpan dalam status Gateway milik plugin sendiri dan berpindah bersama seluruh
status OpenClaw milik Gateway tersebut (lihat [Penyimpanan](#storage)).

## Memulai pekerjaan dari kartu

Kartu yang tidak tertaut dapat langsung memulai pekerjaan:

- **Jalankan Codex** / **Jalankan Claude** memulai eksekusi agen yang dilacak sebagai tugas dengan
  mesin eksplisit, mengirimkan perintah kartu, dan menandai kartu sebagai `running`. Eksekusi Codex
  menggunakan `openai/gpt-5.6-sol`; eksekusi Claude menggunakan `anthropic/claude-sonnet-4-6`.
- **Buka Codex** / **Buka Claude** membuat sesi dasbor tertaut tanpa
  mengirimkan perintah kartu atau memindahkan kartu, untuk pekerjaan manual yang tetap
  terhubung ke papan.

Proses mulai otonom menggunakan jalur eksekusi agen yang dilacak sebagai tugas milik Gateway (agen
dan model default kecuali Codex/Claude dipilih secara eksplisit); Workboard kemudian menautkan
tugas, id eksekusi, dan kunci sesi yang dihasilkan kembali ke kartu. Setiap eksekusi
tertaut juga mencatat ringkasan percobaan (mesin, mode, model, id eksekusi,
stempel waktu, status, jumlah kegagalan berjalan) agar kegagalan berulang tetap terlihat.

Dasbor menyegarkan status tugas dari buku besar tugas Gateway, dengan mencocokkan
tugas dengan kartu berdasarkan id tugas, id eksekusi, atau kunci sesi tertaut. Tugas yang berada dalam antrean/sedang berjalan
mempertahankan siklus hidup kartu tetap aktif; tugas yang selesai, gagal, kehabisan waktu, atau
dibatalkan mengarahkan kartu menuju `review` atau `blocked` menggunakan aturan sinkronisasi
yang sama seperti sesi tertaut (lihat [Sinkronisasi siklus hidup sesi](#session-lifecycle-sync)).

## Alat agen

| Alat                                                                                                                                             | Tujuan                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Menampilkan daftar kartu ringkas beserta status klaim/diagnostik; filter papan bersifat opsional.                                                                                                                    |
| `workboard_read`                                                                                                                                 | Mengembalikan satu kartu beserta konteks pekerja yang dibatasi (catatan, percobaan, komentar, tautan, bukti, artefak, hasil induk, pekerjaan penerima tugas terbaru, diagnostik aktif).                               |
| `workboard_create`                                                                                                                               | Membuat kartu dengan induk, tenant, skills, papan, metadata ruang kerja, kunci idempotensi, batas runtime, dan anggaran percobaan ulang yang bersifat opsional.                                                             |
| `workboard_link`                                                                                                                                 | Menautkan induk ke kartu anak. Kartu anak tetap berstatus `todo` hingga setiap induk mencapai `done`, lalu promosi pengiriman memindahkannya ke `ready`.                                                     |
| `workboard_claim`                                                                                                                                | Mengklaim kartu untuk agen pemanggil; memindahkan `backlog`/`todo`/`ready` ke `running`.                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Memperbarui heartbeat klaim selama proses yang lebih lama.                                                                                                                                          |
| `workboard_release`                                                                                                                              | Melepaskan klaim setelah penyelesaian, penjedaan, atau serah terima; dapat memindahkan kartu ke status berikutnya.                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | Alat siklus hidup terstruktur untuk ringkasan akhir, bukti, artefak, dan manifes kartu yang dibuat (harus merujuk kartu yang ditautkan kembali ke kartu yang telah diselesaikan) atau alasan pemblokiran.                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Menyimpan lampiran kartu kecil dalam status SQLite plugin, mengindeksnya pada kartu, dan mengeksposnya dalam konteks pekerja.                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Merekam baris log pekerja dan memblokir kartu ketika pekerja otomatis berhenti tanpa memanggil `workboard_complete`/`workboard_block`.                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Mengelola metadata papan yang dipersistenkan (nama tampilan, deskripsi, status arsip, ruang kerja default).                                                                                            |
| `workboard_runs`                                                                                                                                 | Mengembalikan riwayat percobaan proses yang dipersistenkan untuk sebuah kartu.                                                                                                                                      |
| `workboard_specify`                                                                                                                              | Mengubah kartu triase/backlog kasar menjadi kartu `todo` yang telah diperjelas; mencatat ringkasan spesifikasi pada kartu.                                                                                      |
| `workboard_decompose`                                                                                                                            | Memecah kartu orkestrasi induk menjadi kartu-kartu anak yang tertaut dengan mewarisi metadata papan/tenant; dapat menyelesaikan induk dengan manifes kartu yang dibuat.                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Mengelola langganan notifikasi. Pembacaan peristiwa aman untuk pemutaran ulang; `advance` memindahkan kursor persisten agar pemanggil dapat melanjutkan tanpa kehilangan atau membaca dua kali peristiwa kartu yang selesai/gagal/usang. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Memeriksa namespace papan dan statistik antrean.                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Memulihkan atau menyerahkan pekerjaan yang macet.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | Menambahkan catatan serah terima atau melampirkan referensi bukti/artefak.                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Memindahkan pekerjaan yang diblokir kembali ke `todo`.                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | Memindahkan kartu ke status lain; kartu yang diklaim memerlukan cakupan klaim agen milik pemanggil.                                                                                                      |
| `workboard_dispatch`                                                                                                                             | Memicu promosi dependensi atau pembersihan klaim usang tanpa menjalankan pekerja; peluncuran pekerja menggunakan Gateway atau pengiriman perintah garis miring.                                                        |

Kartu yang diklaim menolak mutasi alat agen dari agen lain kecuali pemanggil
memiliki token klaim yang dikembalikan oleh `workboard_claim`. Setiap kartu yang dikembalikan oleh
alat agen atau panggilan RPC Gateway menyamarkan `metadata.claim.token` menjadi `[redacted]`
(token itu sendiri hanya dikembalikan sekali, pada tingkat teratas, hanya dari `workboard_claim`),
sehingga operator dasbor dan agen lain dapat memeriksa status klaim tanpa pernah
melihat token yang dapat digunakan. Pemulihan dilakukan melalui
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, yang tidak
memerlukan token tersebut.

## Pengiriman

Pengiriman bersifat lokal pada Gateway: proses ini tidak menjalankan proses OS sembarang. Sesi
subagen OpenClaw normal tetap menangani eksekusi. Satu putaran pengiriman:

1. Mempromosikan kartu yang dependensinya siap.
2. Mencatat metadata pengiriman pada kartu yang siap.
3. Memblokir klaim kedaluwarsa atau proses yang melewati batas waktu.
4. Menandai kartu triase yang dikonfigurasi pada papan sebagai kandidat orkestrasi.
5. Mengklaim sejumlah kecil kartu yang siap dan memulai proses pekerja melalui
   runtime subagen Gateway.

Pekerja menerima konteks kartu yang dibatasi beserta token klaim yang diperlukan untuk mengirim heartbeat,
menyelesaikan, atau memblokir kartu melalui alat Workboard.

Jalur ruang kerja mengikuti kewenangan sistem berkas pemanggil yang sudah ada. Klien Gateway
dengan `operator.write` dapat menggunakan ruang kerja agen yang dikonfigurasi;
klien `operator.admin` dapat menggunakan checkout host lainnya. Alat agen dalam sandbox menggunakan
akses ruang kerja sandbox-nya, sedangkan alat khusus ruang kerja tanpa sandbox menggunakan
akar ruang kerja yang dikonfigurasi. Workboard mencatat kewenangan tersebut saat ruang kerja
ditetapkan dan mengiriskannya kembali dengan kewenangan pemanggil saat ini ketika dikirim,
sehingga kartu yang dipersistenkan tidak dapat memperluas akses pemanggil di kemudian hari. Kartu lama dengan
ruang kerja host eksplisit tetapi tanpa kewenangan yang tercatat harus menyimpan ulang ruang kerja tersebut
sebelum pengiriman host penuh; kartu tanpa jalur host mengadopsi
kewenangan pemanggil saat ini ketika pertama kali dikirim.

Pengiriman yang terikat ke ruang kerja menerima direktori atau checkout Git hanya ketika
akar repositorinya sama persis dengan ruang kerja agen target. Permintaan worktree
dipersempit ke direktori tersebut dan dipersistenkan sebagai ruang kerja direktori, sehingga
host tidak mewujudkan checkout atau mengeksekusi kode penyiapan repositori. Pekerja
target harus menggunakan sandbox Docker yang dapat ditulisi dan tidak dibagikan untuk ruang kerja
yang tepat tersebut, tanpa eksekusi dengan hak istimewa lebih tinggi, penggantian eksekusi host/node yang dipersistenkan, atau
alat plugin dan MCP yang tidak diklasifikasikan. Workboard menginventarisasi alat yang terdaftar
alih-alih memercayai prefiks `workboard_*`, dan pengiriman menolak kontainer Docker aktif
yang hash mount/konfigurasi langsungnya sudah usang. Pengiriman melaporkan
kebijakan target yang tidak kompatibel alih-alih memulai pekerja dengan pembatasan yang lebih longgar.
Pengiriman host penuh dapat menargetkan checkout lokal lain dan mempertahankan penyiapan
worktree terkelola yang normal.

Kewenangan ruang kerja tidak membuat model izin siklus hidup kartu kedua.
Pemanggil yang dapat memutasi kartu Workboard dapat memindahkannya secara manual melalui status
yang sama pada setiap permukaan; akses ruang kerja hanya-baca hanya mencegah pengiriman
pekerja yang memerlukan akses tulis.

### Pemilihan pekerja

Setiap putaran memulai **maksimal 3 pekerja secara default**. Kartu yang siap diurutkan berdasarkan
prioritas, lalu posisi, kemudian waktu pembuatan. Satu putaran hanya memulai satu kartu per
pemilik/agen dan melewati pemilik yang sudah memiliki pekerjaan berjalan atau peninjauan di
papan. Kartu yang diarsipkan, kartu dengan klaim aktif, dan kartu yang tidak berstatus `ready`
tidak pernah dipilih untuk memulai pekerja (kartu tersebut masih dapat terdampak oleh
sisi data pengiriman: pembersihan klaim usang, promosi dependensi, pembersihan
batas waktu).

Kunci sesi bersifat deterministik per papan/kartu, sehingga pengiriman berulang diarahkan
kembali ke jalur pekerja yang sama alih-alih membuat sesi yang tidak terkait:

- Kartu yang ditetapkan: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Kartu yang tidak ditetapkan: `subagent:workboard-<boardId>-<cardId>` (Gateway menentukan
  agen default yang dikonfigurasi)

Jika pekerja tidak dapat dimulai setelah kartu diklaim, Workboard memblokir
kartu tersebut, menghapus klaim, mencatat kegagalan memulai proses, dan menambahkan satu baris
log pekerja—terlihat di dasbor, JSON CLI, alat agen, dan diagnostik
kartu.

### Titik masuk

- Tindakan pengiriman Dashboard
- `openclaw workboard dispatch`
- `/workboard dispatch` pada kanal yang mendukung perintah

Ketiganya menggunakan runtime subagen Gateway saat Gateway tersedia. CLI
memiliki satu fallback operator: jika pemanggilan Gateway gagal dengan
kesalahan koneksi/tidak tersedia (atau kesalahan `unknown method` untuk
Gateway lama), serta tidak ada target `--url`/`--token` eksplisit dan tidak ada Gateway
jarak jauh yang dikonfigurasi (`OPENCLAW_GATEWAY_URL` atau `gateway.mode: remote`) yang berlaku, CLI menjalankan
pengiriman hanya-data terhadap status SQLite lokal—pengiriman ini dapat mempromosikan dependensi,
membersihkan klaim usang, dan memblokir eksekusi yang melewati batas waktu, tetapi tidak dapat memulai pekerja. Kegagalan autentikasi,
izin, dan validasi dari Gateway yang dapat dijangkau tidak dianggap
sebagai tidak tersedia; kegagalan tersebut ditampilkan sebagai kesalahan perintah, demikian pula setiap kegagalan Gateway
saat target `--url`/`--token` eksplisit diberikan.

Metadata papan dapat menetapkan `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee`, dan `orchestratorProfile`. OpenClaw mencatat maksud ini dan
menampilkannya dalam konteks pekerja; spesifikasi/dekomposisi aktual tetap dijalankan
melalui alat Workboard biasa.

## CLI dan perintah garis miring

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Perbaiki siklus hidup kartu usang" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Output teks `list` menyembunyikan kartu yang diarsipkan secara default (`--include-archived`
mengesampingkannya); `--json` selalu menyertakan kartu yang diarsipkan, sesuai dengan kontrak kartu lengkap
yang digunakan oleh skrip yang sudah ada. `show` dan `move` menerima prefiks id
yang tidak ambigu. `list`, `create`, `show`, dan `move` selalu membaca/menulis status Plugin lokal
secara langsung. Hanya `dispatch` yang memanggil Gateway yang sedang berjalan, dengan fallback
yang dijelaskan di atas.

Lihat [CLI Workboard](/id/cli/workboard) untuk flag lengkap, output JSON, perilaku
fallback Gateway, penanganan prefiks id, aturan pemilihan pengiriman, dan
pemecahan masalah.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>`, dan `/workboard dispatch` mencerminkan
CLI. Daftar dan tampilkan merupakan operasi baca bagi setiap pengirim perintah yang diotorisasi.
Buat, pindahkan, dan kirim memerlukan status pemilik pada permukaan obrolan, atau klien Gateway
dengan `operator.write`/`operator.admin`. Pemindahan operator manual menggunakan
perilaku pengesampingan klaim yang sama seperti seret-dan-lepas pada dashboard. Akses worktree-nya
tetap mengikuti batas ruang kerja yang sama seperti dijelaskan di atas.

## Sinkronisasi siklus hidup sesi

Kartu dapat ditautkan ke sesi dashboard yang sudah ada, atau sesi yang dibuat saat Anda
memulai pekerjaan dari kartu. Kartu tertaut menampilkan siklus hidup sesi secara langsung:
berjalan, usang, tertaut tetapi tidak aktif, selesai, gagal, atau hilang. Anda juga dapat mengambil
sesi yang sudah ada dari tab Sessions dengan **Add to Workboard**; kartu
ditautkan ke sesi tersebut, menggunakan label sesi atau perintah pengguna terbaru sebagai judul,
dan mengisi catatan awal dari perintah pengguna terbaru beserta respons asisten terakhir
jika tersedia.

Jika sesi tertaut hilang, kartu tetap tertaut untuk menyediakan konteks dan
tetap menawarkan kontrol mulai untuk memulai ulang ke sesi baru. Jika sesi tertaut yang aktif
berhenti melaporkan aktivitas terbaru, Workboard menandai kartu sebagai
`stale` dan menyimpannya sebagai metadata hingga siklus hidup menghapusnya.

Saat kartu berada dalam status pekerjaan aktif, Workboard mengikuti sesi tertaut:

| Status sesi tertaut                    | Status kartu |
| -------------------------------------- | ------------ |
| aktif                                  | `running`   |
| selesai                                | `review`    |
| gagal, dihentikan, melewati batas waktu, atau dibatalkan | `blocked`   |

**Status tinjauan manual diprioritaskan.** Memindahkan kartu ke `review`, `blocked`, atau `done`
menghentikan sinkronisasi otomatis untuk kartu tersebut hingga Anda memindahkannya kembali ke `todo` atau `running`.

Memulai kartu menggunakan sesi Gateway biasa; Workboard hanya menyimpan
metadata dan tautan kartu. Transkrip percakapan, pemilihan model, dan siklus hidup
eksekusi tetap dikelola oleh sistem sesi reguler. Gunakan **Stop** pada kartu tertaut
yang aktif untuk membatalkan eksekusi aktif—Workboard menandai kartu tersebut sebagai `blocked` agar
tetap terlihat untuk tindak lanjut.

Kartu baru dapat dimulai dari templat Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Templat mengisi judul, catatan, label, dan prioritas sebelumnya;
id templat disimpan sebagai metadata kartu.

## Alur kerja dashboard

1. Buka tab Workboard di Control UI.
2. Buat kartu dengan judul, catatan, prioritas, label, agen opsional, dan
   sesi tertaut opsional—atau buka Sessions dan pilih **Add to Workboard**
   untuk sesi yang sudah ada.
3. Seret kartu antar kolom, atau fokuskan kontrol status ringkasnya dan gunakan
   menu atau ArrowLeft/ArrowRight. Selama penyeretan, kartu sumber diredupkan dan
   kolom tujuan yang tersedia mendapatkan garis tepi.
4. Mulai pekerjaan dari kartu untuk membuat atau menggunakan kembali sesi dashboard.
5. Buka sesi tertaut dari kartu saat agen bekerja.
6. Biarkan sinkronisasi siklus hidup memindahkan pekerjaan yang berjalan ke `review`/`blocked`, lalu
   pindahkan kartu secara manual ke `done` setelah diterima.

## Diagnostik

Diagnostik dihitung dari metadata kartu lokal. Pemeriksaan bawaan menandai:

| Jenis                       | Kondisi                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Kartu `todo`/`backlog`/`ready` yang ditetapkan tidak diperbarui selama lebih dari 1 jam.             |
| `running_without_heartbeat` | Kartu `running` tanpa Heartbeat klaim atau pembaruan eksekusi selama lebih dari 20 menit. |
| `blocked_too_long`          | Kartu `blocked` tidak diperbarui selama lebih dari 24 jam.                                   |
| `repeated_failures`         | Jumlah kegagalan terlacak kartu mencapai 2 atau lebih.                                |
| `missing_proof`             | Kartu `done` tanpa bukti, artefak, atau lampiran.                          |
| `orphaned_session`          | Kartu `running` dengan `sessionKey` tetapi tanpa metadata `execution`.                |

## Izin

Metode RPC Gateway berada di bawah `workboard.*`:

| Cakupan          | Metode                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, daftar/ambil lampiran, pembacaan peristiwa notifikasi, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, buat/perbarui/pindahkan/hapus/komentari/tautkan/linkDependency/bukti/artefak, tambah/hapus lampiran, log pekerja, pelanggaran protokol, klaim/heartbeat/rilis/promosikan/tetapkan ulang/klaim ulang/selesaikan/blokir/buka blokir, `cards.dispatch`, `cards.bulk`, arsipkan, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, berlangganan/hapus/lanjutkan notifikasi |

Tidak ada metode RPC yang memerlukan `operator.admin`. Browser yang terhubung dengan akses
operator hanya-baca dapat memeriksa papan tetapi tidak dapat mengubah kartu. Cakupan admin
memperluas jalur host Workboard yang diterima; cakupan ini tidak mengubah metode yang tersedia.

## Penyimpanan

Workboard menyimpan data persisten dalam basis data SQLite relasional milik Plugin
di bawah direktori status OpenClaw: papan, kartu, label, peristiwa siklus hidup,
percobaan eksekusi, komentar, tautan dependensi, bukti, referensi artefak,
metadata dan blob lampiran, diagnostik, notifikasi, log pekerja,
status protokol, dan langganan semuanya berada dalam tabel Workboard (bukan
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
memeriksa status eksekusi aktual.

**Pengiriman tidak memulai pekerja**

Pastikan terdapat setidaknya satu kartu `ready` tanpa klaim aktif:

```bash
openclaw workboard list --status ready
```

Jika CLI melaporkan pengiriman hanya-data, mulai atau mulai ulang Gateway dan
coba lagi—pengiriman hanya-data memperbarui status papan lokal tetapi tidak dapat memulai
eksekusi pekerja subagen. Kartu juga dapat dilewati jika kartu lain untuk
pemilik atau agen yang sama sudah berjalan atau menunggu tinjauan; selesaikan,
blokir, atau lepaskan pekerjaan aktif tersebut sebelum mengirim lebih banyak pekerjaan untuk
pemilik yang sama.

## Terkait

- [Control UI](/id/web/control-ui)
- [CLI Workboard](/id/cli/workboard)
- [Plugin](/id/tools/plugin)
- [Kelola Plugin](/id/plugins/manage-plugins)
- [Sesi](/id/concepts/session)
