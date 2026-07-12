---
read_when:
    - Anda menginginkan branch dan checkout terisolasi untuk tugas agen
    - Anda sedang mengonfigurasi kartu Workboard dengan ruang kerja worktree
    - Anda perlu memulihkan atau membersihkan worktree yang dikelola OpenClaw
summary: Jalankan tugas agen dalam checkout git terisolasi dengan snapshot dan pembersihan otomatis
title: Worktree terkelola
x-i18n:
    generated_at: "2026-07-12T14:09:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Worktree terkelola memberikan tugas agen branch git dan checkout tersendiri tanpa menempatkan direktori sementara di dalam repositori sumber. OpenClaw membuatnya di bawah direktori statusnya, mencatatnya dalam basis data status bersama, serta membuat snapshot konten terlacak dan konten tidak terlacak yang tidak diabaikan sebelum penghapusan.

## Tata letak dan nama

Setiap worktree berada di:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Sidik jari repositori adalah 16 karakter heksadesimal pertama dari hash SHA-256 atas direktori umum git kanonis dan URL origin. Nama yang diberikan harus cocok dengan `[a-z0-9][a-z0-9-]{0,63}`. Tanpa nama, OpenClaw menghasilkan `wt-` yang diikuti delapan karakter heksadesimal acak.

OpenClaw membuat branch `openclaw/<name>` pada ref dasar yang diminta. Tanpa ref dasar, OpenClaw mengambil `origin`, menggunakan branch default jarak jauh jika tersedia, dan kembali menggunakan `HEAD` lokal ketika repositori sedang luring atau tidak memiliki remote yang dapat digunakan.

## Menyediakan berkas yang diabaikan

Tambahkan `.worktreeinclude` di root repositori sumber untuk menyalin berkas tidak terlacak tertentu yang diabaikan ke dalam worktree baru. Berkas ini menggunakan sintaks pola gitignore, satu pola per baris, dengan komentar `#`:

```gitignore
.env.local
fixtures/generated/**
```

Hanya berkas yang dilaporkan git sebagai diabaikan sekaligus tidak terlacak yang memenuhi syarat. Berkas terlacak sudah tersedia melalui git dan tidak pernah disalin oleh langkah ini. OpenClaw tidak menimpa berkas tujuan atau mengikuti direktori berupa symlink, serta mempertahankan mode berkas yang disalin.

## Menjalankan penyiapan repositori

Jika `.openclaw/worktree-setup.sh` ada di repositori sumber dan dapat dieksekusi, OpenClaw menjalankannya dengan worktree baru sebagai direktori aktifnya. Skrip menerima:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Kode keluar bukan nol membatalkan pembuatan dan menghapus worktree serta branch baru. Ini adalah kontrak lokal repositori; tidak ada kunci konfigurasi OpenClaw untuknya.

## Worktree sesi

Mulai percakapan terisolasi dari ruang kerja git agen aktif dengan sesi berbasis worktree: aktifkan **Worktree** pada halaman New session di Control UI (yang juga menyediakan pemilih branch dasar dan nama worktree opsional), atau gunakan menu Chat actions di iOS maupun tindakan luapan di samping New Chat pada Android. Opsi ini hanya tersedia untuk agen berbasis git ketika klien memiliki kemampuan tersebut; klien yang tidak dapat melakukan pemeriksaan awal akan menampilkan galat Gateway sebagai gantinya.

Agen pengodean juga dapat memanggil `spawn_task` ketika menemukan pekerjaan tindak lanjut yang telah dikonfirmasi di luar tugas saat ini. Control UI menampilkan chip saran tanpa memulai apa pun, sedangkan TUI berbasis Gateway menampilkan perintah interaktif dengan tindakan yang sama. Memilih **Start in worktree** membuat worktree baru milik sesi dari proyek yang disarankan dan mengirimkan perintah mandiri sebagai giliran pertamanya; menutup saran membiarkan repositori tidak tersentuh. Saran dan ID-nya bersifat sementara dan tidak bertahan setelah Gateway dimulai ulang.

OpenClaw hanya menyediakan alat ini untuk sesi operator dengan UI Gateway yang dapat ditindaklanjuti. Sesi saluran dan sesi TUI lokal/tertanam tidak menerimanya hingga permukaan tersebut memiliki kontrak tindakan tugas bertipe yang portabel.

Worktree terkelola yang dihasilkan dimiliki oleh sesi, dan setiap eksekusi agen dalam sesi tersebut menggunakan checkout-nya. Ketika ruang kerja merupakan subdirektori repositori, worktree ditambatkan pada root repositori dan sesi dijalankan dari subdirektori yang sesuai di dalamnya. Pembuatan worktree sesi menggunakan cakupan `operator.write` metode tersebut, tetapi langkah `.openclaw/worktree-setup.sh` hanya dijalankan untuk pemanggil `operator.admin` karena langkah itu mengeksekusi kode repositori; penyediaan `.worktreeinclude` tetap berlaku bagi setiap pemanggil. Menghapus sesi hanya menghapus worktree jika dapat dilakukan tanpa kehilangan data. Worktree kotor atau branch dengan commit yang belum didorong tetap tersedia; pembersihan setiap jam membuat snapshot worktree sesi setelah 7 hari tidak aktif, dengan menganggap aktivitas sesi terbaru sebagai aktivitas worktree. Worktree yang dihapus tetap dapat dipulihkan dari snapshot-nya sebagaimana dijelaskan di bawah.

`sessions.create` dapat menyertakan `cwd` absolut bersama `worktree: true` ketika tugas menargetkan proyek selain ruang kerja agen yang dikonfigurasi. Jalur host eksplisit tersebut memerlukan `operator.admin`; pembuatan percakapan worktree biasa tetap menggunakan `operator.write` dan tetap ditambatkan ke ruang kerja yang dikonfigurasi.

`sessions.create` juga menerima `worktreeBaseRef` dan `worktreeName` bersama `worktree: true` untuk memilih ref dasar dan nama worktree (branch menjadi `openclaw/<name>`); keduanya tetap menggunakan `operator.write`. Worktree yang dibuat dikembalikan dalam hasil pembuatan dan disimpan pada baris sesi sebagai `worktree: { id, branch, repoRoot }`, sehingga daftar sesi dapat menampilkan checkout dan branch. Penghapusan sesi melaporkan checkout kotor yang dipertahankan sebagai `worktreePreserved`, alih-alih diam-diam meninggalkannya.

## Snapshot, pembersihan, dan pemulihan

Penghapusan terlebih dahulu membuat commit sintetis yang berisi berkas terlacak dan berkas tidak terlacak yang tidak diabaikan, lalu menyematkannya pada `refs/openclaw/snapshots/<id>`. Berkas yang diabaikan git tidak disertakan dalam basis data objek repositori; berkas yang dipilih oleh `.worktreeinclude` disalin kembali selama pemulihan. Jika pembuatan snapshot gagal, penghapusan dihentikan. Penghapusan paksa eksplisit dapat dilanjutkan tanpa snapshot.

OpenClaw menerapkan aturan pembersihan berikut:

- Pada akhir eksekusi, OpenClaw hanya menghapus worktree ketika `git status --porcelain` kosong dan `git log HEAD --not --remotes --oneline` tidak menemukan commit yang belum didorong. Jika tidak, OpenClaw hanya melepaskan kunci aktivitas.
- Pembersihan setiap jam membuat snapshot dan menghapus worktree milik Workboard dan sesi yang tidak terkunci serta tidak aktif selama lebih dari 7 hari, bahkan ketika kotor. Worktree manual tidak pernah dihapus secara otomatis.
- Catatan snapshot tetap dapat dipulihkan selama 30 hari. Setelah itu, pembersihan menghapus ref snapshot dan baris registri.
- Kunci proses OpenClaw yang aktif serta kunci worktree git asing atau tidak dikenal melindungi worktree dari pengumpulan sampah.

Pemulihan membuat ulang `openclaw/<name>` pada commit asli sebelum snapshot, lalu membangun kembali perbedaan snapshot sebagai modifikasi yang belum di-stage dan berkas tidak terlacak. Dengan demikian, commit snapshot sintetis tidak masuk ke dalam riwayat branch. Ref snapshot tetap dicatat sebagai asal-usul.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Halaman **Worktrees** di bawah Settings pada Control UI menyediakan tindakan yang sama, ditambah pembuatan dengan pemilih branch dasar, menampilkan pemilik setiap worktree (manual, Workboard, atau sesi pemilik beserta tautan menuju percakapannya), serta menawarkan percobaan ulang paksa ketika penghapusan melaporkan snapshot yang gagal.

## Metode Gateway

| Metode               | Tujuan                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| `worktrees.list`     | Mencantumkan catatan worktree aktif dan yang dapat dipulihkan.                  |
| `worktrees.branches` | Mencantumkan branch lokal dan jarak jauh repositori untuk pemilih ref dasar.     |
| `worktrees.create`   | Membuat atau menggunakan kembali worktree terkelola bernama.                    |
| `worktrees.remove`   | Membuat snapshot dan menghapus worktree. Penghapusan paksa melaporkan `snapshotError`. |
| `worktrees.restore`  | Memulihkan worktree yang dihapus dari snapshot-nya.                             |
| `worktrees.gc`       | Menjalankan pembersihan tidak aktif, yatim, dan retensi sekarang.               |

`worktrees.list` memerlukan `operator.read`, sedangkan metode yang melakukan perubahan memerlukan `operator.admin`. `worktrees.branches` memerlukan `operator.write` untuk ruang kerja agen yang dikonfigurasi, sedangkan jalur host lainnya memerlukan `operator.admin` (sesuai dengan batasan cwd `sessions.create`). Metode ini hanya membaca ref yang sudah ada dan tidak pernah mengambil data, sedangkan branch yang hanya tersedia di remote dikembalikan dengan kualifikasi remote (`origin/feature-a`) agar setiap nama yang dikembalikan dapat diresolusikan sebagai ref dasar.

## Ruang kerja Workboard

[Plugin Workboard](/id/plugins/workboard) bawaan dapat mewujudkan ruang kerja kartu sebagai worktree terkelola:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` mengidentifikasi checkout git sumber. `branch` bersifat opsional dan menjadi ref dasar. Ketika pengiriman memulai pekerja kartu, Workboard membuat atau menggunakan kembali `wb-<card-id>`, menjalankan subagen dengan checkout terkelola sebagai direktori kerjanya, lalu menuliskan jalur dan branch yang telah diresolusikan kembali ke kartu. Pewujudan yang dipicu Gateway memerlukan `operator.admin`. Pada akhir eksekusi, Workboard hanya menghapus checkout jika dapat dibuktikan tidak menimbulkan kehilangan data; pekerjaan kotor atau commit yang belum didorong tetap tersedia.

Agen tertanam dalam sandbox saat ini menolak direktori kerja tugas yang berada di luar ruang kerja agen yang dikonfigurasi. Gunakan agen target tanpa sandbox untuk kartu worktree terkelola Workboard hingga runtime sandbox mendukung mount checkout tambahan.
