---
read_when:
    - Anda menginginkan arsip cadangan kelas satu untuk status OpenClaw lokal
    - Anda ingin melihat pratinjau path mana yang akan disertakan sebelum reset atau uninstall
summary: Referensi CLI untuk `openclaw backup` (membuat arsip cadangan lokal)
title: Cadangan
x-i18n:
    generated_at: "2026-04-24T09:00:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

Buat arsip cadangan lokal untuk status, konfigurasi, profil auth, kredensial channel/provider, sesi, dan secara opsional workspace OpenClaw.

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

- Arsip menyertakan file `manifest.json` dengan path sumber yang telah diselesaikan dan tata letak arsip.
- Output default adalah arsip `.tar.gz` berstempel waktu di direktori kerja saat ini.
- Jika direktori kerja saat ini berada di dalam pohon sumber yang dicadangkan, OpenClaw akan fallback ke direktori home Anda untuk lokasi arsip default.
- File arsip yang sudah ada tidak pernah ditimpa.
- Path output di dalam pohon sumber status/workspace ditolak untuk menghindari penyertaan diri sendiri.
- `openclaw backup verify <archive>` memvalidasi bahwa arsip berisi tepat satu manifest root, menolak path arsip bergaya traversal, dan memeriksa bahwa setiap payload yang dideklarasikan manifest ada di dalam tarball.
- `openclaw backup create --verify` menjalankan validasi itu segera setelah menulis arsip.
- `openclaw backup create --only-config` hanya mencadangkan file konfigurasi JSON yang aktif.

## Apa yang dicadangkan

`openclaw backup create` merencanakan sumber cadangan dari instalasi OpenClaw lokal Anda:

- Direktori status yang dikembalikan oleh resolver status lokal OpenClaw, biasanya `~/.openclaw`
- Path file konfigurasi aktif
- Direktori `credentials/` yang telah diselesaikan saat ada di luar direktori status
- Direktori workspace yang ditemukan dari konfigurasi saat ini, kecuali Anda melewatkan `--no-include-workspace`

Profil auth model sudah menjadi bagian dari direktori status di bawah
`agents/<agentId>/agent/auth-profiles.json`, jadi biasanya sudah tercakup oleh entri
cadangan status.

Jika Anda menggunakan `--only-config`, OpenClaw melewati penemuan status, direktori kredensial, dan workspace, lalu hanya mengarsipkan path file konfigurasi aktif.

OpenClaw melakukan kanonisasi path sebelum membangun arsip. Jika konfigurasi, direktori
kredensial, atau workspace sudah berada di dalam direktori status,
mereka tidak diduplikasi sebagai sumber cadangan tingkat atas yang terpisah. Path yang hilang
akan dilewati.

Payload arsip menyimpan isi file dari pohon sumber tersebut, dan `manifest.json` yang disematkan merekam path sumber absolut yang telah diselesaikan beserta tata letak arsip yang digunakan untuk setiap aset.

## Perilaku konfigurasi tidak valid

`openclaw backup` sengaja melewati preflight konfigurasi normal agar tetap dapat membantu selama pemulihan. Karena penemuan workspace bergantung pada konfigurasi yang valid, `openclaw backup create` sekarang langsung gagal saat file konfigurasi ada tetapi tidak valid dan cadangan workspace masih diaktifkan.

Jika Anda tetap ingin cadangan parsial dalam situasi itu, jalankan ulang:

```bash
openclaw backup create --no-include-workspace
```

Ini membuat status, konfigurasi, dan direktori kredensial eksternal tetap termasuk
sambil sepenuhnya melewati penemuan workspace.

Jika Anda hanya memerlukan salinan file konfigurasi itu sendiri, `--only-config` juga berfungsi saat konfigurasi rusak karena tidak bergantung pada parsing konfigurasi untuk penemuan workspace.

## Ukuran dan performa

OpenClaw tidak memberlakukan ukuran cadangan maksimum bawaan atau batas ukuran per file.

Batas praktis berasal dari mesin lokal dan filesystem tujuan:

- Ruang yang tersedia untuk penulisan arsip sementara ditambah arsip final
- Waktu untuk menelusuri pohon workspace besar dan mengompresnya menjadi `.tar.gz`
- Waktu untuk memindai ulang arsip jika Anda menggunakan `openclaw backup create --verify` atau menjalankan `openclaw backup verify`
- Perilaku filesystem di path tujuan. OpenClaw lebih memilih langkah publish hard-link tanpa penimpaan dan fallback ke salin eksklusif saat hard link tidak didukung

Workspace besar biasanya menjadi pendorong utama ukuran arsip. Jika Anda menginginkan cadangan yang lebih kecil atau lebih cepat, gunakan `--no-include-workspace`.

Untuk arsip terkecil, gunakan `--only-config`.

## Terkait

- [Referensi CLI](/id/cli)
