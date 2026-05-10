---
read_when:
    - Anda menginginkan arsip cadangan kelas satu untuk keadaan lokal OpenClaw
    - Anda ingin melihat pratinjau jalur mana yang akan disertakan sebelum mengatur ulang atau menghapus instalasi
summary: Referensi CLI untuk `openclaw backup` (membuat arsip cadangan lokal)
title: Cadangan
x-i18n:
    generated_at: "2026-05-10T19:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Buat arsip cadangan lokal untuk status, konfigurasi, profil autentikasi, kredensial kanal/penyedia, sesi, dan secara opsional ruang kerja OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Catatan

- Arsip menyertakan file `manifest.json` dengan jalur sumber yang sudah di-resolve dan tata letak arsip.
- Output default adalah arsip `.tar.gz` berstempel waktu di direktori kerja saat ini.
- Jika direktori kerja saat ini berada di dalam pohon sumber yang dicadangkan, OpenClaw akan beralih ke direktori home Anda untuk lokasi arsip default.
- File arsip yang sudah ada tidak pernah ditimpa.
- Jalur output di dalam pohon status/ruang kerja sumber ditolak untuk menghindari penyertaan diri sendiri.
- `openclaw backup verify <archive>` memvalidasi bahwa arsip berisi tepat satu manifest root, menolak jalur arsip bergaya traversal, dan memeriksa bahwa setiap payload yang dideklarasikan manifest ada di dalam tarball.
- `openclaw backup create --verify` menjalankan validasi tersebut segera setelah menulis arsip.
- `openclaw backup create --only-config` hanya mencadangkan file konfigurasi JSON aktif.

## Yang dicadangkan

`openclaw backup create` merencanakan sumber cadangan dari instalasi OpenClaw lokal Anda:

- Direktori status yang dikembalikan oleh resolver status lokal OpenClaw, biasanya `~/.openclaw`
- Jalur file konfigurasi aktif
- Direktori `credentials/` yang sudah di-resolve saat direktori itu ada di luar direktori status
- Direktori ruang kerja yang ditemukan dari konfigurasi saat ini, kecuali Anda meneruskan `--no-include-workspace`

Profil autentikasi model sudah menjadi bagian dari direktori status di bawah
`agents/<agentId>/agent/auth-profiles.json`, sehingga biasanya sudah tercakup oleh entri
cadangan status.

Jika Anda menggunakan `--only-config`, OpenClaw melewati penemuan status, direktori kredensial, dan ruang kerja, lalu hanya mengarsipkan jalur file konfigurasi aktif.

OpenClaw mengkanoniskan jalur sebelum membangun arsip. Jika konfigurasi,
direktori kredensial, atau ruang kerja sudah berada di dalam direktori status,
semuanya tidak diduplikasi sebagai sumber cadangan tingkat atas yang terpisah. Jalur yang hilang akan
dilewati.

Payload arsip menyimpan isi file dari pohon sumber tersebut, dan `manifest.json` yang disematkan mencatat jalur sumber absolut yang sudah di-resolve beserta tata letak arsip yang digunakan untuk setiap aset.

Selama pembuatan arsip, OpenClaw melewati file mutasi langsung yang diketahui tidak memiliki nilai pemulihan, termasuk transkrip sesi agen aktif, log proses cron, log bergulir, antrean pengiriman, file socket/pid/sementara di bawah direktori status, dan file sementara antrean tahan lama terkait. Hasil JSON menyertakan `skippedVolatileCount` agar otomatisasi dapat melihat berapa banyak file yang sengaja dihilangkan.

File sumber dan manifest Plugin terinstal di bawah pohon
`extensions/` milik direktori status disertakan, tetapi pohon dependensi
`node_modules/` bertingkatnya dilewati. Dependensi tersebut adalah artefak instalasi yang dapat dibangun ulang; setelah
memulihkan arsip, gunakan `openclaw plugins update <id>` atau instal ulang Plugin
dengan `openclaw plugins install <spec> --force` saat Plugin yang dipulihkan melaporkan
dependensi yang hilang.

## Perilaku konfigurasi tidak valid

`openclaw backup` sengaja melewati preflight konfigurasi normal agar tetap dapat membantu selama pemulihan. Karena penemuan ruang kerja bergantung pada konfigurasi yang valid, `openclaw backup create` sekarang gagal cepat saat file konfigurasi ada tetapi tidak valid dan pencadangan ruang kerja masih diaktifkan.

Jika Anda masih menginginkan cadangan parsial dalam situasi tersebut, jalankan ulang:

```bash
openclaw backup create --no-include-workspace
```

Itu menjaga status, konfigurasi, dan direktori kredensial eksternal tetap dalam cakupan sambil
melewati penemuan ruang kerja sepenuhnya.

Jika Anda hanya memerlukan salinan file konfigurasi itu sendiri, `--only-config` juga berfungsi saat konfigurasi cacat karena tidak bergantung pada parsing konfigurasi untuk penemuan ruang kerja.

## Ukuran dan performa

OpenClaw tidak memberlakukan ukuran cadangan maksimum bawaan atau batas ukuran per file.

Batas praktis berasal dari mesin lokal dan sistem file tujuan:

- Ruang yang tersedia untuk penulisan arsip sementara ditambah arsip akhir
- Waktu untuk menelusuri pohon ruang kerja besar dan mengompresinya menjadi `.tar.gz`
- Waktu untuk memindai ulang arsip jika Anda menggunakan `openclaw backup create --verify` atau menjalankan `openclaw backup verify`
- Perilaku sistem file di jalur tujuan. OpenClaw lebih memilih langkah publikasi hard-link tanpa timpa dan beralih ke penyalinan eksklusif saat hard link tidak didukung

Ruang kerja besar biasanya menjadi pendorong utama ukuran arsip. Jika Anda menginginkan cadangan yang lebih kecil atau lebih cepat, gunakan `--no-include-workspace`.

Untuk arsip terkecil, gunakan `--only-config`.

## Terkait

- [Referensi CLI](/id/cli)
