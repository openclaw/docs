---
read_when:
    - Anda menginginkan arsip cadangan kelas satu untuk status lokal OpenClaw
    - Anda memerlukan snapshot ringkas dan terverifikasi dari satu basis data SQLite OpenClaw
    - Anda ingin melihat pratinjau jalur mana yang akan disertakan sebelum mengatur ulang atau menghapus instalasi
summary: Referensi CLI untuk `openclaw backup` (arsip dan snapshot SQLite)
title: Cadangan
x-i18n:
    generated_at: "2026-07-19T04:52:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa9444b5e57e9c6f9492e4b017be96ea8d9da88cf335fd163ea6744975fda37b
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Buat arsip cadangan lokal untuk status, konfigurasi, profil autentikasi, kredensial saluran/penyedia, sesi, dan secara opsional ruang kerja OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
openclaw backup sqlite create --global --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite create --agent main --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite list --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id>
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id> --scratch ~/Private/openclaw-scratch
openclaw backup sqlite restore ~/Backups/openclaw-sqlite/<snapshot-id> --target ./restored/openclaw.sqlite
```

## Catatan

- Arsip menyematkan `manifest.json` dengan jalur sumber yang telah diuraikan dan tata letak arsip.
- Keluaran default adalah arsip `.tar.gz` dengan stempel waktu di direktori kerja saat ini. Nama file dengan stempel waktu menggunakan zona waktu lokal mesin Anda dan menyertakan selisih waktu UTC. Jika direktori kerja saat ini berada di dalam pohon sumber yang dicadangkan, OpenClaw menggunakan direktori beranda Anda sebagai lokasi arsip default.
- File arsip yang sudah ada tidak pernah ditimpa. Jalur keluaran di dalam pohon status/ruang kerja sumber ditolak untuk menghindari penyertaan diri.
- `openclaw backup verify <archive>` memeriksa bahwa arsip memuat tepat satu manifes akar, menolak jalur arsip bergaya traversal dan file pendamping SQLite, memastikan setiap muatan yang dideklarasikan manifes tersedia, memvalidasi bentuk file setiap snapshot SQLite, serta menjalankan pemeriksaan integritas lengkap dan peran pada basis data OpenClaw kanonis. Skema Plugin khusus tetap diperlakukan sebagai data opak karena mungkin memerlukan kemampuan SQLite yang ditentukan pemilik. `openclaw backup create --verify` menjalankan validasi tersebut segera setelah menulis arsip.
- `openclaw backup create --only-config` hanya mencadangkan file konfigurasi JSON aktif.

## Snapshot SQLite

Gunakan `openclaw backup sqlite` saat Anda memerlukan artefak portabel untuk satu basis data SQLite milik OpenClaw, bukan arsip status yang luas.

Pembuatan snapshot menerima tepat satu sumber bernama:

| Perintah                                                         | Basis data               |
| --------------------------------------------------------------- | ---------------------- |
| `openclaw backup sqlite create --global --repository <dir>`     | Status OpenClaw bersama  |
| `openclaw backup sqlite create --agent <id> --repository <dir>` | Satu basis data per agen |

Repositori memuat satu direktori untuk setiap snapshot yang disimpan. Setiap direktori snapshot memuat tepat:

- `manifest.json`
- `database.sqlite`

Pembuatan snapshot memverifikasi basis data aktif sebelum membacanya, menggunakan `VACUUM INTO` SQLite untuk menangkap status WAL yang telah di-commit ke dalam basis data ringkas, memverifikasi kembali basis data yang dihasilkan, lalu menerbitkan direktori yang telah selesai tanpa menimpa jalur yang sudah ada. Snapshot global menghapus baris antrean pengiriman sementara dan melakukan pemadatan kembali agar muatan antrean yang dihapus tidak dipertahankan di halaman kosong.

Jangan menyalin file `.sqlite`, `-wal`, `-shm`, atau `-journal` yang aktif sebagai artefak portabilitas. Salin hanya direktori snapshot yang telah selesai.

Snapshot SQLite dapat memuat profil autentikasi, status sesi, status Plugin, dan catatan sensitif lainnya. Lindungi repositori dengan izin, enkripsi, kebijakan retensi, dan pembatasan tujuan yang sama seperti direktori status OpenClaw aktif.

### Verifikasi dan pemulihan

```bash
openclaw backup sqlite verify <snapshot-directory>
openclaw backup sqlite restore <snapshot-directory> --target <new-database-path>
```

Verifikasi memeriksa bentuk manifes yang ketat, ukuran artefak dan SHA-256, integritas SQLite, kunci asing, versi skema, peran dan pemilik basis data, serta definisi indeks milik OpenClaw.

Verifikasi memvalidasi salinan privat yang dipatok pada konten agar kondisi balapan nama jalur tidak dapat menukar bita yang diperiksa SQLite. Secara default, salinan sementara tersebut dibuat di sebelah repositori snapshot dan dihapus sebelum perintah selesai. Akar pentahapan beserta rantai leluhurnya harus mencegah pengguna lain menggantinya. Akar POSIX harus dimiliki pengguna saat ini serta tidak dapat ditulis oleh grup/dunia; leluhur dengan sticky bit seperti `/tmp` diterima untuk anak yang dimiliki pengguna. Pemberian ACL macOS yang mengekspos pentahapan atau memungkinkan pentahapan diganti akan ditolak. Akar dan leluhur Windows harus dimiliki oleh pengguna saat ini atau prinsipal OS tepercaya, dengan ACL yang menolak akses pentahapan tidak tepercaya. Untuk kait hanya-baca atau berbagi jaringan, teruskan `--scratch <existing-private-directory>` pada penyimpanan dengan kontrol enkripsi dan tujuan yang setara.

Pembuatan snapshot menerapkan pemeriksaan pemilik, ACL, leluhur, dan identitas jalur yang sama pada repositori sebelum melakukan pentahapan atau menerbitkan bita basis data.

Pemulihan mengulangi verifikasi dan hanya menulis ke target baru. Pemulihan menolak target, file pendamping `-wal`, `-shm`, atau `-journal` yang sudah ada dan tidak pernah melakukan penggantian langsung terhadap basis data OpenClaw aktif. Induk target memiliki persyaratan keamanan jalur yang sama seperti lokasi sementara verifikasi. Mengaktifkan basis data yang dipulihkan tetap menjadi langkah operator luring yang eksplisit.

Repositori snapshot adalah direktori lokal. Penjadwalan, pengunggahan, retensi, bundel WAL inkremental, failover, dan perilaku pemulihan saat boot sengaja berada di luar cakupan perintah ini.

## Data yang dicadangkan

`openclaw backup create` merencanakan sumber dari instalasi OpenClaw lokal Anda:

- Direktori status (biasanya `~/.openclaw`)
- Jalur file konfigurasi aktif
- Direktori `credentials/` yang telah diuraikan jika berada di luar direktori status
- Direktori ruang kerja yang ditemukan dari konfigurasi saat ini, kecuali jika Anda meneruskan `--no-include-workspace`

Profil autentikasi dan status runtime per agen lainnya berada di SQLite di bawah direktori status (`agents/<agentId>/agent/openclaw-agent.sqlite`), sehingga secara otomatis tercakup oleh entri pencadangan status.

`--only-config` melewati penemuan status, direktori kredensial, dan ruang kerja, serta hanya mengarsipkan jalur file konfigurasi aktif.

OpenClaw mengkanoniskan jalur sebelum membuat arsip: jika konfigurasi, direktori kredensial, atau ruang kerja sudah berada di dalam direktori status, data tersebut tidak diduplikasi sebagai sumber cadangan tingkat atas yang terpisah. Jalur yang tidak tersedia dilewati.

Selama pembuatan arsip, OpenClaw mengecualikan jalur mutasi aktif yang diketahui sebelum `tar` membacanya. Hal ini menghindari kondisi balapan antara ukuran file yang tercatat dan penulisan bersamaan. Filter menerapkan aturan relatif terhadap status berikut di bawah setiap direktori status yang dicadangkan:

| Cakupan relatif terhadap status                         | Akhiran file yang dilewati         |
| -------------------------------------------- | ----------------------------- |
| `sessions/**`                                | `.jsonl`, `.log`              |
| `agents/<agentId>/sessions/**`               | `.jsonl`, `.log`              |
| `cron/runs/**`                               | `.jsonl`, `.log`              |
| `logs/**`                                    | `.jsonl`, `.log`              |
| `delivery-queue/**`                          | `.json`, `.delivered`, `.tmp` |
| `session-delivery-queue/**`                  | `.json`, `.delivered`, `.tmp` |
| Jalur apa pun di bawah direktori status yang dicadangkan | `.sock`, `.pid`, `.tmp`       |

Aturan ini tidak memfilter file ruang kerja di luar direktori status. Aturan tersebut juga mengabaikan file transkrip dan log yang telah selesai dan cocok dengan tabel, jadi simpan catatan tersebut secara terpisah jika diperlukan. `skippedVolatileCount` pada hasil JSON melaporkan jumlah file yang sengaja diabaikan.

Basis data SQLite di bawah direktori status dipadatkan dengan `VACUUM INTO` agar sisa halaman yang dihapus tidak masuk ke arsip, dan file WAL/SHM aktif tidak disalin. Basis data milik Plugin yang memerlukan kemampuan SQLite yang ditentukan pemilik tetapi tidak tersedia akan gagal secara tertutup alih-alih kembali menggunakan salinan halaman mentah. File SQLite yang disertakan melalui pencadangan ruang kerja disalin sebagai file ruang kerja dan tidak tercakup oleh jaminan pemadatan.

File sumber dan manifes Plugin yang terinstal di bawah pohon `extensions/` dalam direktori status disertakan, tetapi pohon dependensi `node_modules/` yang bertingkat di dalamnya dilewati sebagai artefak instalasi yang dapat dibuat ulang. Setelah memulihkan arsip, gunakan `openclaw plugins update <id>` atau instal ulang dengan `openclaw plugins install <spec> --force` jika Plugin yang dipulihkan melaporkan dependensi yang hilang.

Akar runtime yang dikelola penginstal dan dapat dibuat ulang di bawah direktori status juga dilewati: `dev/`, `git/`, `npm/`, `npm-runtime/` lama, dan `tools/`. Akar ini memuat checkout terkelola, pohon paket, dan runtime yang diunduh, bukan status pengguna otoritatif; instal ulang atau perbarui runtime atau Plugin terkait setelah pemulihan. File konfigurasi, direktori kredensial, atau ruang kerja yang dikonfigurasi secara eksplisit di dalam salah satu akar ini tetap disertakan.

## Perilaku konfigurasi tidak valid

`openclaw backup` melewati pemeriksaan awal konfigurasi normal agar tetap dapat membantu selama pemulihan. Penemuan ruang kerja bergantung pada konfigurasi yang valid, sehingga `openclaw backup create` langsung gagal jika file konfigurasi tersedia tetapi tidak valid dan pencadangan ruang kerja masih diaktifkan.

Untuk pencadangan parsial dalam situasi tersebut, jalankan kembali dengan `--no-include-workspace`: opsi ini tetap mencakup status, konfigurasi, dan direktori kredensial eksternal, sekaligus sepenuhnya melewati penemuan ruang kerja.

`--only-config` juga berfungsi jika konfigurasi rusak, karena opsi tersebut tidak mengurai konfigurasi untuk penemuan ruang kerja.

## Ukuran dan kinerja

OpenClaw tidak memberlakukan ukuran cadangan maksimum bawaan atau batas ukuran per file. Penulisan arsip yang tidak menghasilkan data selama lima menit akan gagal dan menghapus file sementara parsialnya alih-alih terus menggantung tanpa batas. Batas praktis lainnya berasal dari:

- Ruang yang tersedia untuk penulisan arsip sementara ditambah arsip akhir
- Waktu untuk menelusuri pohon ruang kerja besar dan mengompresinya menjadi `.tar.gz`
- Waktu untuk memindai ulang arsip dengan `--verify` atau `openclaw backup verify`
- Perilaku sistem file tujuan: OpenClaw mengutamakan langkah penerbitan tautan keras tanpa penimpaan dan beralih ke penyalinan eksklusif jika tautan keras tidak didukung

Ruang kerja besar biasanya menjadi faktor utama ukuran arsip. Gunakan `--no-include-workspace` untuk pencadangan yang lebih kecil/cepat, atau `--only-config` untuk arsip terkecil.

## Terkait

- [Referensi CLI](/id/cli)
