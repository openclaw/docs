---
read_when:
    - Anda menginginkan arsip cadangan kelas utama untuk status lokal OpenClaw
    - Anda ingin meninjau jalur mana yang akan disertakan sebelum reset atau uninstall
summary: Referensi CLI untuk `openclaw backup` (membuat arsip cadangan lokal)
title: Cadangan
x-i18n:
    generated_at: "2026-06-27T17:17:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Buat arsip cadangan lokal untuk state, konfigurasi, profil autentikasi, kredensial kanal/penyedia, sesi, dan opsional ruang kerja OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Catatan

- Arsip menyertakan file `manifest.json` dengan path sumber yang diselesaikan dan tata letak arsip.
- Output default adalah arsip `.tar.gz` bertanda waktu di direktori kerja saat ini.
- Nama file cadangan bertanda waktu menggunakan zona waktu lokal mesin Anda dan menyertakan offset UTC.
- Jika direktori kerja saat ini berada di dalam pohon sumber yang dicadangkan, OpenClaw menggunakan direktori home Anda sebagai lokasi arsip default.
- File arsip yang sudah ada tidak pernah ditimpa.
- Path output di dalam pohon state/ruang kerja sumber ditolak untuk menghindari penyertaan diri.
- `openclaw backup verify <archive>` memvalidasi bahwa arsip berisi tepat satu manifes root, menolak path arsip bergaya traversal, dan memeriksa bahwa setiap payload yang dideklarasikan manifes ada di tarball.
- `openclaw backup create --verify` menjalankan validasi tersebut segera setelah menulis arsip.
- `openclaw backup create --only-config` hanya mencadangkan file konfigurasi JSON aktif.

## Yang dicadangkan

`openclaw backup create` merencanakan sumber cadangan dari instalasi OpenClaw lokal Anda:

- Direktori state yang dikembalikan oleh resolver state lokal OpenClaw, biasanya `~/.openclaw`
- Path file konfigurasi aktif
- Direktori `credentials/` yang diselesaikan ketika ada di luar direktori state
- Direktori ruang kerja yang ditemukan dari konfigurasi saat ini, kecuali Anda meneruskan `--no-include-workspace`

Profil autentikasi model sudah menjadi bagian dari direktori state di bawah
`agents/<agentId>/agent/auth-profiles.json`, sehingga biasanya tercakup oleh entri
cadangan state.

Jika Anda menggunakan `--only-config`, OpenClaw melewati penemuan state, direktori kredensial, dan ruang kerja, lalu hanya mengarsipkan path file konfigurasi aktif.

OpenClaw mengkanonisasi path sebelum membangun arsip. Jika konfigurasi, direktori
kredensial, atau ruang kerja sudah berada di dalam direktori state,
semuanya tidak diduplikasi sebagai sumber cadangan tingkat atas terpisah. Path yang hilang
dilewati.

Payload arsip menyimpan isi file dari pohon sumber tersebut, dan `manifest.json` yang disematkan mencatat path sumber absolut yang diselesaikan serta tata letak arsip yang digunakan untuk setiap aset.

Selama pembuatan arsip, OpenClaw melewati file mutasi langsung yang diketahui tidak memiliki nilai pemulihan, termasuk transkrip sesi agen aktif, log run Cron, log bergulir, antrian pengiriman, file soket/pid/temp di bawah direktori state, dan file temp antrian tahan lama terkait. Hasil JSON menyertakan `skippedVolatileCount` sehingga otomatisasi dapat melihat berapa banyak file yang sengaja dihilangkan.

File sumber dan manifes Plugin terinstal di bawah pohon `extensions/` milik direktori state disertakan, tetapi pohon dependensi `node_modules/` bertingkatnya
dilewati. Dependensi tersebut adalah artefak instalasi yang dapat dibangun ulang; setelah
memulihkan arsip, gunakan `openclaw plugins update <id>` atau instal ulang Plugin
dengan `openclaw plugins install <spec> --force` ketika Plugin yang dipulihkan melaporkan
dependensi yang hilang.

## Perilaku konfigurasi tidak valid

`openclaw backup` sengaja melewati preflight konfigurasi normal agar tetap dapat membantu selama pemulihan. Karena penemuan ruang kerja bergantung pada konfigurasi yang valid, `openclaw backup create` sekarang gagal cepat ketika file konfigurasi ada tetapi tidak valid dan pencadangan ruang kerja masih diaktifkan.

Jika Anda tetap menginginkan cadangan parsial dalam situasi tersebut, jalankan ulang:

```bash
openclaw backup create --no-include-workspace
```

Itu tetap mencakup state, konfigurasi, dan direktori kredensial eksternal sambil
sepenuhnya melewati penemuan ruang kerja.

Jika Anda hanya membutuhkan salinan file konfigurasi itu sendiri, `--only-config` juga berfungsi ketika konfigurasi cacat karena tidak bergantung pada penguraian konfigurasi untuk penemuan ruang kerja.

## Ukuran dan performa

OpenClaw tidak memberlakukan ukuran cadangan maksimum bawaan atau batas ukuran per file.

Batas praktis berasal dari mesin lokal dan sistem file tujuan:

- Ruang yang tersedia untuk penulisan arsip sementara plus arsip akhir
- Waktu untuk menelusuri pohon ruang kerja besar dan mengompresnya menjadi `.tar.gz`
- Waktu untuk memindai ulang arsip jika Anda menggunakan `openclaw backup create --verify` atau menjalankan `openclaw backup verify`
- Perilaku sistem file pada path tujuan. OpenClaw lebih memilih langkah publikasi hard link tanpa timpa dan kembali ke penyalinan eksklusif ketika hard link tidak didukung

Ruang kerja besar biasanya menjadi pendorong utama ukuran arsip. Jika Anda menginginkan cadangan yang lebih kecil atau lebih cepat, gunakan `--no-include-workspace`.

Untuk arsip terkecil, gunakan `--only-config`.

## Terkait

- [Referensi CLI](/id/cli)
