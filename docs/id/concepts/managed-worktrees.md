---
read_when:
    - Anda menginginkan branch dan checkout terisolasi untuk tugas agen
    - Anda sedang mengonfigurasi kartu Workboard dengan ruang kerja worktree
    - Anda perlu memulihkan atau membersihkan worktree yang dikelola OpenClaw
summary: Jalankan tugas agen di checkout git terisolasi dengan snapshot dan pembersihan otomatis
title: Worktree terkelola
x-i18n:
    generated_at: "2026-07-19T04:53:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ea2627869b2bdae70afd312f02ce26cd5c8caf72a15ce4416584103c65a7dcf
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Worktree terkelola memberi tugas agen cabang git dan checkout-nya sendiri tanpa menempatkan direktori sementara di dalam repositori sumber. OpenClaw membuatnya di bawah direktori statusnya, mencatatnya dalam basis data status bersama, serta membuat snapshot konten terlacak dan konten tidak terlacak yang tidak diabaikan sebelum penghapusan.

## Tata letak dan nama

Setiap worktree berada di:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Sidik jari repositori adalah 16 karakter heksadesimal pertama dari hash SHA-256 atas direktori umum git kanonis dan URL asal. Nama yang diberikan harus cocok dengan `[a-z0-9][a-z0-9-]{0,63}`. Tanpa nama, OpenClaw menghasilkan `wt-` yang diikuti delapan karakter heksadesimal acak.

OpenClaw membuat cabang `openclaw/<name>` pada ref dasar yang diminta. Tanpa ref dasar, OpenClaw mengambil `origin`, menggunakan cabang default jarak jauh jika tersedia, dan beralih ke `HEAD` lokal jika repositori sedang luring atau tidak memiliki remote yang dapat digunakan.

## Menyediakan file yang diabaikan

Tambahkan `.worktreeinclude` di root repositori sumber untuk menyalin file tidak terlacak tertentu yang diabaikan ke dalam worktree baru. File tersebut menggunakan sintaks pola gitignore, satu pola per baris, dengan komentar `#`:

```gitignore
.env.local
fixtures/generated/**
```

Hanya file yang dilaporkan git sebagai diabaikan sekaligus tidak terlacak yang memenuhi syarat. File terlacak sudah tersedia melalui git dan tidak pernah disalin oleh langkah ini. OpenClaw tidak menimpa atau mengubah file tujuan yang sudah ada, tidak mengikuti direktori berupa symlink, dan mempertahankan mode file yang disalin. OpenClaw hanya mencatat jalur yang benar-benar dibuatnya, sehingga perubahan manifes di kemudian hari tidak dapat menyebabkan file tersebut kehilangan perlindungan saat pembersihan.

## Menjalankan penyiapan repositori

Jika `.openclaw/worktree-setup.sh` ada di repositori sumber dan dapat dieksekusi, OpenClaw menjalankannya dengan worktree baru sebagai direktori saat ini. Skrip menerima:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Kode keluar bukan nol membatalkan pembuatan dan menghapus worktree serta cabang baru. Ini adalah kontrak lokal repositori; tidak ada kunci konfigurasi OpenClaw untuknya.

## Worktree sesi

Mulai percakapan terisolasi dari ruang kerja git agen aktif dengan sesi berbasis worktree: aktifkan **Worktree** pada halaman New session di Control UI (yang juga menyediakan pemilih cabang dasar dan nama worktree opsional), atau gunakan menu Chat actions di iOS atau tindakan tambahan di samping New Chat di Android. Opsi ini hanya tersedia untuk agen berbasis git jika klien memiliki kemampuan tersebut; klien yang tidak dapat melakukan pemeriksaan awal akan menampilkan galat Gateway sebagai gantinya.

Agen pengodean juga dapat memanggil `spawn_task` ketika menemukan pekerjaan tindak lanjut terkonfirmasi di luar tugas saat ini. Control UI menampilkan chip saran tanpa memulai apa pun, sedangkan TUI berbasis Gateway menampilkan perintah interaktif dengan tindakan yang sama. Memilih **Start in worktree** membuat worktree baru milik sesi dari proyek yang disarankan dan mengirimkan perintah mandiri sebagai giliran pertamanya; menutup saran tidak mengubah repositori. Saran dan ID-nya bersifat sementara dan tidak bertahan setelah Gateway dimulai ulang.

OpenClaw hanya menyediakan alat ini kepada sesi operator dengan UI Gateway yang dapat ditindaklanjuti. Sesi saluran serta sesi TUI lokal/tertanam tidak menerimanya hingga permukaan tersebut memiliki kontrak tindakan tugas bertipe yang portabel.

Worktree terkelola yang dihasilkan dimiliki oleh sesi, dan setiap eksekusi agen dalam sesi tersebut menggunakan checkout-nya. Jika ruang kerja merupakan subdirektori repositori, worktree ditambatkan pada root repositori dan sesi dijalankan dari subdirektori yang sesuai di dalamnya. Pembuatan worktree sesi menggunakan cakupan `operator.write` milik metode, tetapi hook checkout repositori dan langkah `.openclaw/worktree-setup.sh` hanya dijalankan untuk pemanggil `operator.admin` karena keduanya mengeksekusi kode repositori; penyediaan `.worktreeinclude` tetap berlaku untuk setiap pemanggil. Menghapus sesi hanya menghapus worktree jika dapat dilakukan tanpa kehilangan data. Worktree kotor atau cabang dengan commit yang belum didorong tetap tersedia; pembersihan setiap jam membuat snapshot worktree sesi setelah 7 hari tidak aktif, dengan aktivitas sesi terbaru dianggap sebagai aktivitas worktree. Worktree yang dihapus tetap dapat dipulihkan dari snapshot-nya sebagaimana dijelaskan di bawah.

`sessions.create` dapat menyertakan `cwd` absolut bersama `worktree: true` ketika tugas menargetkan proyek selain ruang kerja agen yang dikonfigurasi. Jalur host eksplisit tersebut memerlukan `operator.admin`; pembuatan percakapan worktree biasa tetap menggunakan `operator.write` dan tetap ditambatkan ke ruang kerja yang dikonfigurasi.

`sessions.create` juga menerima `worktreeBaseRef` dan `worktreeName` bersama `worktree: true` untuk memilih ref dasar dan nama worktree (cabang menjadi `openclaw/<name>`); keduanya tetap berada pada `operator.write`. Worktree yang dibuat dikembalikan dalam hasil pembuatan dan dipertahankan pada baris sesi sebagai `worktree: { id, branch, repoRoot }`, sehingga daftar sesi dapat menampilkan checkout dan cabang. Menghapus sesi melaporkan checkout kotor yang dipertahankan sebagai `worktreePreserved`, alih-alih membiarkannya tanpa pemberitahuan.

## Snapshot, pembersihan, dan pemulihan

Penghapusan terlebih dahulu membuat commit sintetis yang berisi file terlacak dan file tidak terlacak yang tidak diabaikan, lalu menyematkannya pada `refs/openclaw/snapshots/<id>`. File yang diabaikan tidak pernah masuk ke basis data objek repositori. OpenClaw hanya menyimpan file yang diabaikan dan benar-benar disediakannya dalam baris basis data status bersama yang dipecah menjadi beberapa bagian; kumpulan jalur yang tercatat tetap menjadi acuan meskipun `.worktreeinclude` kemudian berubah atau menghilang. Pemulihan membaca byte tersebut dari snapshot yang tidak dapat diubah dan menerapkan kembali mode lengkapnya. Pembersihan otomatis mempertahankan worktree aktif jika jalur yang tercatat tidak lagi dapat dibuatkan snapshot dengan aman. Jika pembuatan snapshot gagal, penghapusan berhenti. Penghapusan paksa eksplisit dapat dilanjutkan tanpa snapshot.

OpenClaw menerapkan aturan pembersihan berikut:

- Pada akhir eksekusi, OpenClaw hanya menghapus worktree jika `git status --porcelain` kosong dan `git log HEAD --not --remotes --oneline` tidak menemukan commit yang belum didorong. Jika tidak, OpenClaw hanya melepaskan kunci aktivitas.
- Pembersihan setiap jam membuat snapshot dan menghapus worktree milik Workboard dan sesi yang tidak terkunci serta tidak aktif selama lebih dari 7 hari, meskipun kotor. Worktree manual tidak pernah dihapus secara otomatis.
- Jika `worktrees.cleanup.maxCount` atau `worktrees.cleanup.maxTotalSizeGb` dikonfigurasi, pembersihan juga membuat snapshot dan menghapus worktree milik Workboard dan sesi yang paling lama tidak aktif hingga jumlah total dan ukuran disk sesuai batas. Semua worktree terkelola dihitung dalam total, tetapi worktree manual dan worktree yang dilindungi dengan cara lain tidak pernah dikeluarkan karena batas, sehingga batas dapat tetap terlampaui hingga tersedia worktree yang memenuhi syarat. Nilai 0 atau tidak ditetapkan akan menonaktifkan batas.
- Catatan snapshot tetap dapat dipulihkan selama 30 hari. Setelah itu, pembersihan menghapus ref snapshot dan baris registri.
- Kunci proses OpenClaw yang aktif serta kunci worktree git asing atau tidak dikenal melindungi worktree dari pengumpulan sampah.

Pemulihan membuat kembali `openclaw/<name>` pada commit asli sebelum snapshot, lalu membangun ulang perbedaan snapshot sebagai perubahan yang belum di-stage dan file tidak terlacak. Hal ini mencegah commit snapshot sintetis masuk ke riwayat cabang. Ref snapshot tetap dicatat sebagai asal-usul.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Halaman **Worktrees** di Control UI pada Settings menyediakan tindakan yang sama, ditambah pembuatan dengan pemilih cabang dasar, menampilkan pemilik setiap worktree (manual, Workboard, atau sesi pemilik dengan tautan ke percakapannya), dan menawarkan percobaan ulang paksa ketika penghapusan melaporkan snapshot yang gagal. Bagian **Cleanup** mengubah batas retensi `worktrees.cleanup` yang dijelaskan dalam [referensi konfigurasi](/id/gateway/configuration-reference#worktrees).

## Metode Gateway

| Metode               | Tujuan                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | Mencantumkan catatan worktree aktif dan yang dapat dipulihkan.                            |
| `worktrees.branches` | Mencantumkan cabang lokal dan jarak jauh suatu repositori untuk pemilih ref dasar.    |
| `worktrees.create`   | Membuat atau menggunakan kembali worktree terkelola bernama.                               |
| `worktrees.remove`   | Membuat snapshot dan menghapus worktree. Penghapusan paksa melaporkan `snapshotError`. |
| `worktrees.restore`  | Memulihkan worktree yang dihapus dari snapshot-nya.                           |
| `worktrees.gc`       | Menjalankan pembersihan tidak aktif, yatim, dan retensi sekarang.                            |

`worktrees.list` memerlukan `operator.read`, dan metode yang melakukan perubahan memerlukan `operator.admin`. `worktrees.branches` memerlukan `operator.write` untuk ruang kerja agen yang dikonfigurasi, sedangkan jalur host lainnya memerlukan `operator.admin` (sesuai batas cwd `sessions.create`). Metode ini hanya membaca ref yang ada dan tidak pernah melakukan fetch, serta cabang yang hanya tersedia di remote dikembalikan dengan kualifikasi remote (`origin/feature-a`) agar setiap nama yang dikembalikan dapat di-resolve sebagai ref dasar.

## Ruang kerja Workboard

[Plugin Workboard](/id/plugins/workboard) bawaan dapat mewujudkan ruang kerja kartu sebagai worktree terkelola:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` mengidentifikasi checkout git sumber. `branch` bersifat opsional dan menjadi ref dasar. Untuk pemanggil dengan akses host penuh, Workboard membuat atau menggunakan kembali `wb-<card-id>`, menjalankan subagen dengan checkout terkelola sebagai direktori kerjanya, dan menulis kembali jalur serta cabang yang telah di-resolve ke kartu. Klien Gateway memerlukan `operator.admin` untuk pewujudan host penuh. Pada akhir eksekusi, Workboard hanya menghapus checkout jika terbukti tidak menyebabkan kehilangan data; pekerjaan kotor atau commit yang belum didorong tetap tersedia.

Untuk pemanggil yang terikat ke ruang kerja, `path` dan root repositori harus sama persis dengan ruang kerja agen target. Workboard kemudian berjalan langsung di direktori tersebut dan mencatat ruang kerja direktori, alih-alih mewujudkan worktree terkelola pada host. Target harus menggunakan sandbox Docker yang dapat ditulis dan tidak digunakan bersama untuk ruang kerja yang sama, hash kontainer aktifnya harus cocok dengan mount serta kebijakan yang diminta, dan target tidak boleh menyediakan eksekusi dengan hak istimewa, kontrol host, sesi seluruh host, eksekusi host/node yang dipertahankan, atau alat Plugin dan MCP yang belum diklasifikasikan. Jika kebijakan target atau kontainer aktif memiliki cakupan lebih luas, pengiriman membiarkan kartu tidak diklaim dan melaporkan status yang tidak kompatibel.
