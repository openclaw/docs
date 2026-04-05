---
read_when:
    - Anda menginginkan arsip cadangan kelas satu untuk status OpenClaw lokal
    - Anda ingin melihat pratinjau path mana yang akan disertakan sebelum reset atau uninstall
summary: Referensi CLI untuk `openclaw backup` (membuat arsip cadangan lokal)
title: backup
x-i18n:
    generated_at: "2026-04-05T13:45:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 700eda8f9eac1cc93a854fa579f128e5e97d4e6dfc0da75b437c0fb2a898a37d
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

Buat arsip cadangan lokal untuk status, config, profil autentikasi, kredensial channel/provider, sesi, dan secara opsional workspace OpenClaw.

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

- Arsip menyertakan file `manifest.json` dengan path sumber yang telah di-resolve dan tata letak arsip.
- Output default adalah arsip `.tar.gz` bertimestamp di direktori kerja saat ini.
- Jika direktori kerja saat ini berada di dalam tree sumber yang dicadangkan, OpenClaw akan fallback ke direktori home Anda untuk lokasi arsip default.
- File arsip yang sudah ada tidak pernah ditimpa.
- Path output di dalam tree status/workspace sumber ditolak untuk menghindari penyertaan diri sendiri.
- `openclaw backup verify <archive>` memvalidasi bahwa arsip berisi tepat satu manifest root, menolak path arsip bergaya traversal, dan memeriksa bahwa setiap payload yang dideklarasikan manifest ada di dalam tarball.
- `openclaw backup create --verify` menjalankan validasi tersebut segera setelah arsip ditulis.
- `openclaw backup create --only-config` hanya mencadangkan file config JSON aktif.

## Apa yang dicadangkan

`openclaw backup create` merencanakan sumber cadangan dari instalasi OpenClaw lokal Anda:

- Direktori status yang dikembalikan oleh resolver status lokal OpenClaw, biasanya `~/.openclaw`
- Path file config aktif
- Direktori `credentials/` yang telah di-resolve jika berada di luar direktori status
- Direktori workspace yang ditemukan dari config saat ini, kecuali jika Anda meneruskan `--no-include-workspace`

Profil autentikasi model sudah menjadi bagian dari direktori status di bawah
`agents/<agentId>/agent/auth-profiles.json`, sehingga biasanya sudah tercakup oleh entri cadangan
status.

Jika Anda menggunakan `--only-config`, OpenClaw melewati penemuan status, direktori kredensial, dan workspace, lalu hanya mengarsipkan path file config aktif.

OpenClaw mengkanonisasi path sebelum membangun arsip. Jika config, direktori
kredensial, atau workspace sudah berada di dalam direktori status,
mereka tidak diduplikasi sebagai sumber cadangan tingkat atas yang terpisah. Path yang hilang akan
dilewati.

Payload arsip menyimpan isi file dari tree sumber tersebut, dan `manifest.json` yang tersemat mencatat path sumber absolut yang telah di-resolve beserta tata letak arsip yang digunakan untuk setiap aset.

## Perilaku config tidak valid

`openclaw backup` sengaja melewati preflight config normal agar tetap dapat membantu selama pemulihan. Karena penemuan workspace bergantung pada config yang valid, `openclaw backup create` sekarang gagal cepat saat file config ada tetapi tidak valid dan pencadangan workspace masih diaktifkan.

Jika Anda tetap menginginkan cadangan parsial dalam situasi tersebut, jalankan ulang:

```bash
openclaw backup create --no-include-workspace
```

Itu akan tetap mencakup status, config, dan direktori kredensial eksternal sambil
melewati penemuan workspace sepenuhnya.

Jika Anda hanya memerlukan salinan file config itu sendiri, `--only-config` juga berfungsi saat config bermasalah karena tidak bergantung pada parsing config untuk penemuan workspace.

## Ukuran dan performa

OpenClaw tidak menerapkan ukuran cadangan maksimum bawaan atau batas ukuran per file.

Batas praktis berasal dari mesin lokal dan filesystem tujuan:

- Ruang yang tersedia untuk penulisan arsip sementara ditambah arsip akhir
- Waktu untuk menelusuri tree workspace besar dan mengompresnya ke dalam `.tar.gz`
- Waktu untuk memindai ulang arsip jika Anda menggunakan `openclaw backup create --verify` atau menjalankan `openclaw backup verify`
- Perilaku filesystem pada path tujuan. OpenClaw lebih memilih langkah publish hard-link tanpa overwrite dan fallback ke penyalinan eksklusif saat hard link tidak didukung

Workspace besar biasanya menjadi faktor utama ukuran arsip. Jika Anda menginginkan cadangan yang lebih kecil atau lebih cepat, gunakan `--no-include-workspace`.

Untuk arsip terkecil, gunakan `--only-config`.
