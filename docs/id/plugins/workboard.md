---
read_when:
    - Anda menginginkan papan kerja bergaya Kanban di Antarmuka Kontrol
    - Anda sedang mengaktifkan atau menonaktifkan plugin Workboard bawaan
    - Anda ingin melacak pekerjaan agen yang direncanakan tanpa pengelola proyek eksternal
summary: Papan kerja dasbor opsional untuk kartu milik agen dan serah terima sesi
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-12T14:33:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Plugin Workboard menambahkan papan bergaya Kanban opsional ke
[UI Kontrol](/id/web/control-ui): kartu kerja berukuran sesuai agen, penugasan kepada agen,
dan tautan kembali ke tugas, eksekusi, serta sesi dasbor kartu tersebut.

Workboard sengaja dibuat ringkas: Workboard melacak pekerjaan operasional lokal untuk satu
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
Saat dinonaktifkan, tab tetap tersembunyi dari navigasi. Membuka rute
`/workboard` secara langsung saat plugin dinonaktifkan atau diblokir oleh
`plugins.allow`/`plugins.deny` akan menampilkan status plugin tidak tersedia, bukan data
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
| `agentId`   | agen yang ditetapkan, opsional                                                                                 |
| referensi tertaut | tugas, eksekusi, sesi, atau URL sumber, opsional                                                        |
| `execution` | metadata opsional untuk eksekusi Codex/Claude yang dimulai dari kartu (mesin, mode, model, sesi, id eksekusi, status) |

Kartu juga memuat metadata ringkas untuk percobaan, komentar, tautan, bukti,
artefak, pengaturan otomatisasi, lampiran, log pekerja, status protokol
pekerja, klaim, diagnostik, notifikasi, id templat, status arsip, dan
deteksi sesi kedaluwarsa, beserta daftar peristiwa terbaru (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Metadata ini memungkinkan
operator melihat bagaimana kartu bergerak melalui papan tanpa membuka sesi
tertaut; metadata ini merupakan konteks operasional lokal, bukan pengganti transkrip
sesi atau riwayat isu GitHub.

Kartu disimpan dalam status Gateway milik plugin dan berpindah bersama
status OpenClaw lainnya dari Gateway tersebut (lihat [Penyimpanan](#storage)).

## Memulai pekerjaan dari kartu

Kartu yang belum tertaut dapat memulai pekerjaan secara langsung:

- **Jalankan Codex** / **Jalankan Claude** memulai eksekusi agen yang dilacak sebagai tugas dengan
  mesin eksplisit, mengirim perintah kartu, dan menandai kartu sebagai `running`. Eksekusi Codex
  menggunakan `openai/gpt-5.6-sol`; eksekusi Claude menggunakan `anthropic/claude-sonnet-4-6`.
- **Buka Codex** / **Buka Claude** membuat sesi dasbor tertaut tanpa
  mengirim perintah kartu atau memindahkan kartu, untuk pekerjaan manual yang tetap
  terhubung ke papan.

Proses mulai otonom menggunakan jalur eksekusi agen yang dilacak sebagai tugas milik Gateway (agen
dan model default kecuali Codex/Claude dipilih secara eksplisit); Workboard kemudian menautkan
tugas yang dihasilkan, id eksekusi, dan kunci sesi kembali ke kartu. Setiap
eksekusi tertaut juga mencatat ringkasan percobaan (mesin, mode, model, id eksekusi,
stempel waktu, status, jumlah kegagalan beruntun) sehingga kegagalan berulang tetap terlihat.

Dasbor menyegarkan status tugas dari buku besar tugas Gateway dengan mencocokkan
tugas ke kartu berdasarkan id tugas, id eksekusi, atau kunci sesi tertaut. Tugas
yang mengantre/berjalan menjaga siklus hidup kartu tetap aktif; tugas yang selesai,
gagal, kehabisan waktu, atau dibatalkan memindahkan kartu menuju `review` atau `blocked`
menggunakan aturan sinkronisasi yang sama seperti sesi tertaut (lihat [Sinkronisasi siklus hidup sesi](#session-lifecycle-sync)).

## Alat agen

| Alat                                                                                                                                             | Tujuan                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Menampilkan daftar kartu ringkas beserta status klaim/diagnostik; filter papan bersifat opsional.                                                                                                                            |
| `workboard_read`                                                                                                                                 | Mengembalikan satu kartu beserta konteks pekerja yang dibatasi (catatan, upaya, komentar, tautan, bukti, artefak, hasil induk, pekerjaan penerima tugas terbaru, diagnostik aktif).                                            |
| `workboard_create`                                                                                                                               | Membuat kartu dengan induk, penyewa, Skills, papan, metadata ruang kerja, kunci idempotensi, batas waktu proses, dan anggaran percobaan ulang yang bersifat opsional.                                                         |
| `workboard_link`                                                                                                                                 | Menautkan kartu induk ke kartu anak. Anak tetap berstatus `todo` hingga setiap induk mencapai `done`, kemudian promosi pengiriman memindahkannya ke `ready`.                                                                  |
| `workboard_claim`                                                                                                                                | Mengklaim kartu untuk agen pemanggil; memindahkan `backlog`/`todo`/`ready` ke `running`.                                                                                                                                      |
| `workboard_heartbeat`                                                                                                                            | Menyegarkan Heartbeat klaim selama proses yang lebih panjang.                                                                                                                                                                |
| `workboard_release`                                                                                                                              | Melepaskan klaim setelah selesai, dijeda, atau diserahterimakan; dapat memindahkan kartu ke status berikutnya.                                                                                                               |
| `workboard_complete` / `workboard_block`                                                                                                         | Alat siklus hidup terstruktur untuk ringkasan akhir, bukti, artefak, dan manifes kartu yang dibuat (harus merujuk kartu yang ditautkan kembali ke kartu yang diselesaikan), atau alasan pemblokiran.                            |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Menyimpan lampiran kartu berukuran kecil dalam status SQLite Plugin, mengindeksnya pada kartu, dan menampilkannya dalam konteks pekerja.                                                                                       |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Mencatat baris log pekerja dan memblokir kartu ketika pekerja otomatis berhenti tanpa memanggil `workboard_complete`/`workboard_block`.                                                                                       |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Mengelola metadata papan persisten (nama tampilan, deskripsi, status arsip, ruang kerja bawaan).                                                                                                                              |
| `workboard_runs`                                                                                                                                 | Mengembalikan riwayat upaya proses yang dipersistenkan untuk sebuah kartu.                                                                                                                                                    |
| `workboard_specify`                                                                                                                              | Mengubah kartu triase/backlog kasar menjadi kartu `todo` yang telah diperjelas; mencatat ringkasan spesifikasi pada kartu.                                                                                                    |
| `workboard_decompose`                                                                                                                            | Memecah kartu orkestrasi induk menjadi anak-anak yang tertaut, dengan mewarisi metadata papan/penyewa; dapat menyelesaikan induk dengan manifes kartu yang dibuat.                                                            |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Mengelola langganan notifikasi. Pembacaan peristiwa aman untuk pemutaran ulang; `advance` memindahkan kursor persisten agar pemanggil dapat melanjutkan tanpa kehilangan atau membaca dua kali peristiwa kartu selesai/gagal/usang. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Memeriksa namespace papan dan statistik antrean.                                                                                                                                                                             |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Memulihkan atau menyerahterimakan pekerjaan yang macet.                                                                                                                                                                      |
| `workboard_comment` / `workboard_proof`                                                                                                          | Menambahkan catatan serah terima atau melampirkan referensi bukti/artefak.                                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Memindahkan kembali pekerjaan yang diblokir ke `todo`.                                                                                                                                                                       |
| `workboard_dispatch`                                                                                                                             | Memicu promosi dependensi atau pembersihan klaim usang.                                                                                                                                                                       |

Kartu yang telah diklaim menolak mutasi alat agen dari agen lain kecuali pemanggil
memegang token klaim yang dikembalikan oleh `workboard_claim`. Setiap kartu yang
dikembalikan oleh alat agen atau panggilan RPC Gateway menyamarkan
`metadata.claim.token` menjadi `[redacted]` (token itu sendiri hanya dikembalikan
satu kali, pada tingkat teratas, dari `workboard_claim`), sehingga operator dasbor
dan agen lain dapat memeriksa status klaim tanpa pernah melihat token yang dapat
digunakan. Pemulihan dilakukan melalui
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, yang tidak
memerlukan token tersebut.

## Pengiriman

Pengiriman bersifat lokal di Gateway: mekanisme ini tidak menjalankan proses OS
sembarang. Sesi subagen OpenClaw normal tetap memiliki eksekusi. Satu putaran
pengiriman:

1. Mempromosikan kartu yang dependensinya siap.
2. Mencatat metadata pengiriman pada kartu yang siap.
3. Memblokir klaim yang kedaluwarsa atau proses yang melewati batas waktu.
4. Menandai kartu triase yang dikonfigurasi pada papan sebagai kandidat orkestrasi.
5. Mengklaim sejumlah kecil kartu yang siap dan memulai proses pekerja melalui
   runtime subagen Gateway.

Pekerja menerima konteks kartu yang dibatasi beserta token klaim yang diperlukan
untuk mengirim Heartbeat, menyelesaikan, atau memblokir kartu melalui alat
Workboard.

### Pemilihan pekerja

Setiap putaran secara bawaan memulai **maksimal 3 pekerja**. Kartu yang siap
diurutkan berdasarkan prioritas, lalu posisi, kemudian waktu pembuatan. Satu
putaran hanya memulai satu kartu per pemilik/agen dan melewati pemilik yang sudah
memiliki pekerjaan berjalan atau dalam peninjauan pada papan. Kartu yang
diarsipkan, kartu dengan klaim aktif, dan kartu yang tidak berstatus `ready`
tidak pernah dipilih untuk memulai pekerja (kartu tersebut tetap dapat
dipengaruhi oleh sisi data pengiriman: pembersihan klaim usang, promosi
dependensi, dan pembersihan batas waktu).

Kunci sesi bersifat deterministik per papan/kartu, sehingga pengiriman berulang
diarahkan kembali ke jalur pekerja yang sama, alih-alih membuat sesi yang tidak
terkait:

- Kartu yang ditugaskan: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Kartu yang belum ditugaskan: `subagent:workboard-<boardId>-<cardId>` (Gateway
  menentukan agen bawaan yang dikonfigurasi)

Jika pekerja tidak dapat dimulai setelah kartu diklaim, Workboard memblokir
kartu, menghapus klaim, mencatat kegagalan memulai proses, dan menambahkan satu
baris log pekerja—yang terlihat di dasbor, JSON CLI, alat agen, dan diagnostik
kartu.

### Titik masuk

- Tindakan pengiriman dasbor
- `openclaw workboard dispatch`
- `/workboard dispatch` pada kanal yang mendukung perintah

Ketiganya menggunakan runtime subagen Gateway ketika Gateway tersedia. CLI
memiliki satu mekanisme cadangan operator: jika panggilan Gateway gagal dengan
kesalahan koneksi/tidak tersedia (atau kesalahan `unknown method` untuk Gateway
versi lama), serta tidak ada target `--url`/`--token` eksplisit dan tidak ada
Gateway jarak jauh yang dikonfigurasi (`OPENCLAW_GATEWAY_URL` atau
`gateway.mode: remote`), CLI menjalankan pengiriman khusus data terhadap status
SQLite lokal—mekanisme ini dapat mempromosikan dependensi, membersihkan klaim
usang, dan memblokir proses yang melewati batas waktu, tetapi tidak dapat
memulai pekerja. Kegagalan autentikasi, izin, dan validasi dari Gateway yang
dapat dijangkau tidak dianggap sebagai kondisi tidak tersedia; kegagalan
tersebut ditampilkan sebagai kesalahan perintah, demikian pula semua kegagalan
Gateway ketika target `--url`/`--token` eksplisit diberikan.

Metadata papan dapat mengatur `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee`, dan `orchestratorProfile`. OpenClaw mencatat maksud ini dan
menampilkannya dalam konteks pekerja; spesifikasi/dekomposisi aktual tetap
dijalankan melalui alat Workboard normal.

## CLI dan perintah garis miring

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Keluaran teks `list` secara bawaan menyembunyikan kartu yang diarsipkan
(`--include-archived` mengesampingkannya); `--json` selalu menyertakan kartu
yang diarsipkan, sesuai dengan kontrak kartu lengkap yang digunakan oleh skrip
yang ada. `show` menerima prefiks ID yang tidak ambigu. `list`, `create`, dan
`show` selalu membaca/menulis status Plugin lokal secara langsung. Hanya
`dispatch` yang memanggil Gateway yang sedang berjalan, dengan mekanisme
cadangan yang dijelaskan di atas.

Lihat [CLI Workboard](/id/cli/workboard) untuk flag lengkap, keluaran JSON,
perilaku cadangan Gateway, penanganan prefiks ID, aturan pemilihan pengiriman,
dan pemecahan masalah.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
dan `/workboard dispatch` mencerminkan CLI. Daftar dan tampilkan merupakan
operasi baca bagi setiap pengirim perintah yang berwenang. Buat dan kirim
memerlukan status pemilik pada permukaan obrolan, atau klien Gateway dengan
`operator.write`/`operator.admin`.

## Sinkronisasi siklus hidup sesi

Kartu dapat ditautkan ke sesi dasbor yang sudah ada, atau ke sesi yang dibuat ketika Anda
memulai pekerjaan dari kartu. Kartu tertaut menampilkan siklus hidup sesi secara langsung:
berjalan, usang, tertaut tetapi menganggur, selesai, gagal, atau hilang. Anda juga dapat mengambil
sesi yang sudah ada dari tab Sessions dengan **Add to Workboard**; kartu tersebut
ditautkan ke sesi itu, menggunakan label sesi atau perintah pengguna terbaru sebagai judul,
dan mengisi catatan awal dari perintah pengguna terbaru beserta respons asisten terakhir
jika tersedia.

Jika sesi tertaut hilang, kartu tetap tertaut sebagai konteks dan
tetap menyediakan kontrol mulai untuk memulai ulang dalam sesi baru. Jika sesi tertaut
yang aktif berhenti melaporkan aktivitas terbaru, Workboard menandai kartu sebagai
`stale` dan menyimpannya sebagai metadata hingga siklus hidup menghapusnya.

Saat kartu berada dalam status pekerjaan aktif, Workboard mengikuti sesi tertaut:

| Status sesi tertaut                   | Status kartu |
| ------------------------------------- | ------------ |
| aktif                                 | `running`    |
| selesai                               | `review`     |
| gagal, dihentikan, kehabisan waktu, atau dibatalkan | `blocked` |

**Status peninjauan manual diutamakan.** Memindahkan kartu ke `review`, `blocked`, atau `done`
menghentikan sinkronisasi otomatis untuk kartu tersebut hingga Anda memindahkannya kembali ke `todo` atau `running`.

Memulai kartu menggunakan sesi Gateway biasa; Workboard hanya menyimpan
metadata dan tautan kartu. Transkrip percakapan, pemilihan model, dan siklus hidup
eksekusi tetap dikelola oleh sistem sesi biasa. Gunakan **Stop** pada kartu tertaut
yang aktif untuk membatalkan eksekusi aktif—Workboard menandai kartu tersebut sebagai `blocked` agar
tetap terlihat untuk ditindaklanjuti.

Kartu baru dapat dimulai dari templat Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Templat mengisi awal judul, catatan, label, dan prioritas;
ID templat disimpan sebagai metadata kartu.

## Alur kerja dasbor

1. Buka tab Workboard di Control UI.
2. Buat kartu dengan judul, catatan, prioritas, label, agen opsional, dan
   sesi tertaut opsional—atau buka Sessions dan pilih **Add to Workboard**
   untuk sesi yang sudah ada.
3. Seret kartu antar kolom, atau fokuskan kontrol status ringkasnya dan gunakan
   menu atau ArrowLeft/ArrowRight.
4. Mulai pekerjaan dari kartu untuk membuat atau menggunakan kembali sesi dasbor.
5. Buka sesi tertaut dari kartu selagi agen bekerja.
6. Biarkan sinkronisasi siklus hidup memindahkan pekerjaan yang berjalan ke `review`/`blocked`, lalu secara manual
   pindahkan kartu ke `done` setelah diterima.

## Diagnostik

Diagnostik dihitung dari metadata kartu lokal. Pemeriksaan bawaan menandai:

| Jenis                       | Kondisi                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Kartu `todo`/`backlog`/`ready` yang telah ditetapkan tidak diperbarui selama lebih dari 1 jam. |
| `running_without_heartbeat` | Kartu `running` tanpa heartbeat klaim atau pembaruan eksekusi selama lebih dari 20 menit. |
| `blocked_too_long`          | Kartu `blocked` tidak diperbarui selama lebih dari 24 jam.                     |
| `repeated_failures`         | Jumlah kegagalan terlacak pada kartu mencapai 2 atau lebih.                    |
| `missing_proof`             | Kartu `done` tanpa bukti, artefak, atau lampiran.                              |
| `orphaned_session`          | Kartu `running` dengan `sessionKey` tetapi tanpa metadata `execution`.         |

## Izin

Metode RPC Gateway berada di bawah `workboard.*`:

| Cakupan          | Metode                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, daftar/ambil lampiran, pembacaan peristiwa notifikasi, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                 |
| `operator.write` | `cards.diagnostics.refresh`, buat/perbarui/pindahkan/hapus/komentari/tautkan/linkDependency/bukti/artefak, tambah/hapus lampiran, log pekerja, pelanggaran protokol, klaim/heartbeat/lepas/promosikan/tetapkan ulang/klaim ulang/selesaikan/blokir/buka blokir, `cards.dispatch`, `cards.bulk`, arsipkan, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, langganan/hapus/majukan notifikasi |

Tidak ada metode RPC yang memerlukan `operator.admin`. Peramban yang terhubung dengan akses
operator hanya-baca dapat memeriksa papan, tetapi tidak dapat mengubah kartu.

## Penyimpanan

Workboard menyimpan data permanen dalam basis data SQLite relasional milik plugin
di bawah direktori status OpenClaw: papan, kartu, label, peristiwa siklus hidup,
percobaan eksekusi, komentar, tautan dependensi, bukti, referensi artefak,
metadata dan blob lampiran, diagnostik, notifikasi, log pekerja,
status protokol, serta langganan semuanya berada dalam tabel Workboard (bukan
entri nilai-kunci plugin). Ekspor kartu mempertahankan narasi papan
tanpa menyematkan konten blob lampiran.

Instalasi yang menggunakan Workboard pada rilis `.28` dapat menjalankan
`openclaw doctor --fix` untuk memigrasikan namespace status plugin lama yang dirilis
(`workboard.cards`, `workboard.boards`, `workboard.notify`, dan, jika ada,
`workboard.attachments`) ke basis data relasional.

## Pemecahan masalah

**Tab menyatakan Workboard tidak tersedia**

```bash
openclaw plugins inspect workboard --runtime --json
```

Jika `plugins.allow` dikonfigurasi, tambahkan `workboard` ke dalamnya. Jika `plugins.deny`
berisi `workboard`, hapus entri tersebut sebelum mengaktifkan plugin.

**Kartu tidak tersimpan**

Pastikan koneksi peramban memiliki akses `operator.write`. Sesi operator
hanya-baca dapat mencantumkan kartu, tetapi tidak dapat membuat, mengedit, memindahkan, atau menghapusnya.

**Memulai kartu tidak membuka sesi yang diharapkan**

Periksa ID agen dan sesi tertaut kartu, lalu buka Sessions atau Chat untuk
memeriksa status eksekusi yang sebenarnya.

**Pengiriman tidak memulai pekerja**

Pastikan ada setidaknya satu kartu `ready` tanpa klaim aktif:

```bash
openclaw workboard list --status ready
```

Jika CLI melaporkan pengiriman khusus data, mulai atau mulai ulang Gateway dan
coba lagi—pengiriman khusus data memperbarui status papan lokal, tetapi tidak dapat memulai
eksekusi pekerja subagen. Kartu juga dapat dilewati ketika kartu lain untuk
pemilik atau agen yang sama sudah berjalan atau menunggu peninjauan; selesaikan,
blokir, atau lepaskan pekerjaan aktif tersebut sebelum mengirimkan lebih banyak pekerjaan untuk pemilik
yang sama.

## Terkait

- [Control UI](/id/web/control-ui)
- [CLI Workboard](/id/cli/workboard)
- [Plugin](/id/tools/plugin)
- [Kelola plugin](/id/plugins/manage-plugins)
- [Sesi](/id/concepts/session)
