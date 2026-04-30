---
read_when:
    - Anda menginginkan arsip cadangan kelas satu untuk status lokal OpenClaw
    - Anda ingin meninjau jalur mana yang akan disertakan sebelum mengatur ulang atau menghapus instalasi
summary: Referensi CLI untuk `openclaw backup` (membuat arsip cadangan lokal)
title: Cadangan
x-i18n:
    generated_at: "2026-04-30T09:38:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Buat arsip cadangan lokal untuk status, konfigurasi, profil autentikasi, kredensial saluran/penyedia, sesi, dan secara opsional workspace OpenClaw.

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

- Arsip menyertakan berkas `manifest.json` dengan jalur sumber yang diselesaikan dan tata letak arsip.
- Output default adalah arsip `.tar.gz` bertanda waktu di direktori kerja saat ini.
- Jika direktori kerja saat ini berada di dalam pohon sumber yang dicadangkan, OpenClaw beralih ke direktori home Anda untuk lokasi arsip default.
- Berkas arsip yang sudah ada tidak pernah ditimpa.
- Jalur output di dalam pohon status/workspace sumber ditolak untuk menghindari penyertaan diri.
- `openclaw backup verify <archive>` memvalidasi bahwa arsip berisi tepat satu manifes root, menolak jalur arsip bergaya traversal, dan memeriksa bahwa setiap payload yang dideklarasikan manifes ada di tarball.
- `openclaw backup create --verify` menjalankan validasi itu segera setelah menulis arsip.
- `openclaw backup create --only-config` hanya mencadangkan berkas konfigurasi JSON aktif.

## Apa yang dicadangkan

`openclaw backup create` merencanakan sumber cadangan dari instalasi OpenClaw lokal Anda:

- Direktori status yang dikembalikan oleh resolver status lokal OpenClaw, biasanya `~/.openclaw`
- Jalur berkas konfigurasi aktif
- Direktori `credentials/` yang diselesaikan saat ada di luar direktori status
- Direktori workspace yang ditemukan dari konfigurasi saat ini, kecuali Anda meneruskan `--no-include-workspace`

Profil autentikasi model sudah menjadi bagian dari direktori status di bawah
`agents/<agentId>/agent/auth-profiles.json`, jadi biasanya tercakup oleh entri
cadangan status.

Jika Anda menggunakan `--only-config`, OpenClaw melewati penemuan status, direktori kredensial, dan workspace, lalu hanya mengarsipkan jalur berkas konfigurasi aktif.

OpenClaw mengkanoniskan jalur sebelum membangun arsip. Jika konfigurasi,
direktori kredensial, atau workspace sudah berada di dalam direktori status,
semuanya tidak diduplikasi sebagai sumber cadangan tingkat atas terpisah. Jalur
yang hilang dilewati.

Payload arsip menyimpan isi berkas dari pohon sumber tersebut, dan `manifest.json` yang disematkan mencatat jalur sumber absolut yang diselesaikan beserta tata letak arsip yang digunakan untuk setiap aset.

Berkas sumber dan manifes Plugin yang terpasang di bawah pohon `extensions/`
milik direktori status disertakan, tetapi pohon dependensi `node_modules/`
bersarangnya dilewati. Dependensi tersebut adalah artefak instalasi yang dapat dibangun ulang; setelah
memulihkan arsip, gunakan `openclaw plugins update <id>` atau instal ulang Plugin
dengan `openclaw plugins install <spec> --force` saat Plugin yang dipulihkan melaporkan
dependensi hilang.

## Perilaku konfigurasi tidak valid

`openclaw backup` sengaja melewati preflight konfigurasi normal agar tetap dapat membantu selama pemulihan. Karena penemuan workspace bergantung pada konfigurasi yang valid, `openclaw backup create` sekarang gagal cepat saat berkas konfigurasi ada tetapi tidak valid dan pencadangan workspace masih diaktifkan.

Jika Anda tetap menginginkan cadangan parsial dalam situasi itu, jalankan ulang:

```bash
openclaw backup create --no-include-workspace
```

Itu mempertahankan status, konfigurasi, dan direktori kredensial eksternal dalam cakupan sambil
melewati penemuan workspace sepenuhnya.

Jika Anda hanya membutuhkan salinan berkas konfigurasi itu sendiri, `--only-config` juga berfungsi saat konfigurasi rusak karena tidak bergantung pada penguraian konfigurasi untuk penemuan workspace.

## Ukuran dan performa

OpenClaw tidak memberlakukan ukuran cadangan maksimum bawaan atau batas ukuran per berkas.

Batas praktis berasal dari mesin lokal dan filesystem tujuan:

- Ruang yang tersedia untuk penulisan arsip sementara ditambah arsip final
- Waktu untuk menelusuri pohon workspace besar dan mengompresnya menjadi `.tar.gz`
- Waktu untuk memindai ulang arsip jika Anda menggunakan `openclaw backup create --verify` atau menjalankan `openclaw backup verify`
- Perilaku filesystem pada jalur tujuan. OpenClaw mengutamakan langkah publikasi hard-link tanpa timpa dan beralih ke salinan eksklusif saat hard link tidak didukung

Workspace besar biasanya menjadi pendorong utama ukuran arsip. Jika Anda menginginkan cadangan yang lebih kecil atau lebih cepat, gunakan `--no-include-workspace`.

Untuk arsip terkecil, gunakan `--only-config`.

## Terkait

- [Referensi CLI](/id/cli)
