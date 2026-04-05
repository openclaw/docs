---
read_when:
    - Anda ingin memperbarui checkout sumber dengan aman
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang cukup aman + mulai ulang gateway otomatis)
title: update
x-i18n:
    generated_at: "2026-04-05T13:50:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12c8098654b644c3666981d379f6c018e84fde56a5420f295d78052f9001bdad
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara channel stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan dilakukan melalui alur package manager di [Memperbarui](/install/updating).

## Penggunaan

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opsi

- `--no-restart`: lewati memulai ulang layanan Gateway setelah pembaruan berhasil.
- `--channel <stable|beta|dev>`: atur channel pembaruan (git + npm; disimpan dalam config).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur channel/tag/target/restart) tanpa menulis config, menginstal, menyinkronkan plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin.
- `--timeout <seconds>`: batas waktu per langkah (default adalah 1200d).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade)

Catatan: downgrade memerlukan konfirmasi karena versi yang lebih lama dapat merusak konfigurasi.

## `update status`

Tampilkan channel pembaruan aktif + tag/branch/SHA git (untuk checkout sumber), beserta ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default adalah 3d).

## `update wizard`

Alur interaktif untuk memilih channel pembaruan dan mengonfirmasi apakah Gateway
perlu dimulai ulang setelah pembaruan (default-nya adalah dimulai ulang). Jika Anda memilih `dev` tanpa checkout git, perintah ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1200`)

## Yang dilakukan

Saat Anda beralih channel secara eksplisit (`--channel ...`), OpenClaw juga menjaga agar
metode instalasi tetap selaras:

- `dev` → memastikan ada checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → lebih memilih dist-tag npm `beta`, tetapi kembali ke `latest` saat beta
  tidak ada atau lebih lama daripada rilis stable saat ini.

Pembaruan otomatis inti Gateway (saat diaktifkan melalui config) menggunakan kembali jalur pembaruan yang sama ini.

## Alur checkout git

Channel:

- `stable`: checkout tag non-beta terbaru, lalu build + doctor.
- `beta`: lebih memilih tag `-beta` terbaru, tetapi kembali ke tag stable terbaru
  saat beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch + rebase.

Tingkat tinggi:

1. Memerlukan worktree yang bersih (tidak ada perubahan yang belum di-commit).
2. Beralih ke channel yang dipilih (tag atau branch).
3. Mengambil dari upstream (hanya dev).
4. Hanya dev: lint prapenerbangan + build TypeScript dalam worktree sementara; jika tip gagal, mundur hingga 10 commit untuk menemukan build bersih terbaru.
5. Rebase ke commit yang dipilih (hanya dev).
6. Menginstal dependensi (lebih memilih pnpm; npm sebagai fallback; bun tetap tersedia sebagai fallback kompatibilitas sekunder).
7. Build + build Control UI.
8. Menjalankan `openclaw doctor` sebagai pemeriksaan akhir “pembaruan aman”.
9. Menyinkronkan plugin ke channel aktif (dev menggunakan extension bawaan; stable/beta menggunakan npm) dan memperbarui plugin yang diinstal melalui npm.

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Lihat juga

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Channel pengembangan](/install/development-channels)
- [Memperbarui](/install/updating)
- [Referensi CLI](/cli)
