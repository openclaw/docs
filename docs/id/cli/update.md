---
read_when:
    - Anda ingin memperbarui source checkout dengan aman
    - Anda perlu memahami perilaku shorthand `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan source yang cukup aman + auto-restart gateway)
title: Update
x-i18n:
    generated_at: "2026-04-26T11:26:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara channel stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan dilakukan melalui alur package manager di [Updating](/id/install/updating).

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

- `--no-restart`: lewati restart layanan Gateway setelah pembaruan berhasil. Pembaruan package manager yang memang me-restart Gateway akan memverifikasi bahwa layanan yang direstart melaporkan versi pembaruan yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: atur channel pembaruan (git + npm; dipersistenkan di config).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur channel/tag/target/restart) tanpa menulis config, menginstal, menyinkronkan Plugin, atau me-restart.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.integrityDrifts` saat drift artefak Plugin npm
  terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: timeout per langkah (default `1800s`).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade)

Catatan: downgrade memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.

## `update status`

Tampilkan channel pembaruan aktif + tag/branch/SHA git (untuk source checkout), serta ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: timeout untuk pemeriksaan (default `3s`).

## `update wizard`

Alur interaktif untuk memilih channel pembaruan dan mengonfirmasi apakah Gateway
perlu direstart setelah pembaruan (defaultnya restart). Jika Anda memilih `dev` tanpa git checkout, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: timeout untuk setiap langkah pembaruan (default `1800`)

## Yang dilakukan

Saat Anda beralih channel secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan ada git checkout (default: `~/openclaw`, override dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → lebih memilih dist-tag npm `beta`, tetapi fallback ke `latest` saat beta
  tidak ada atau lebih lama daripada rilis stable saat ini.

Auto-updater inti Gateway (saat diaktifkan melalui config) menggunakan kembali jalur pembaruan yang sama ini.

Untuk instalasi package manager, `openclaw update` me-resolve target versi paket
sebelum memanggil package manager. Bahkan saat versi yang terinstal
sudah cocok dengan target, perintah ini me-refresh instalasi paket global,
lalu menjalankan sinkronisasi Plugin, refresh completion, dan pekerjaan restart. Ini menjaga
sidecar yang dipaketkan dan catatan Plugin milik channel tetap selaras dengan build
OpenClaw yang terinstal.

## Alur git checkout

Channel:

- `stable`: checkout tag non-beta terbaru, lalu build + doctor.
- `beta`: lebih memilih tag `-beta` terbaru, tetapi fallback ke tag stable terbaru
  saat beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch + rebase.

Gambaran umum:

1. Memerlukan worktree yang bersih (tanpa perubahan yang belum di-commit).
2. Beralih ke channel yang dipilih (tag atau branch).
3. Fetch upstream (hanya `dev`).
4. Hanya `dev`: jalankan preflight lint + build TypeScript di worktree sementara; jika tip gagal, mundur hingga 10 commit untuk menemukan build bersih terbaru.
5. Rebase ke commit yang dipilih (hanya `dev`).
6. Instal dependensi dengan package manager repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@10`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
7. Build + build Control UI.
8. Jalankan `openclaw doctor` sebagai pemeriksaan akhir “safe update”.
9. Sinkronkan Plugin ke channel aktif (dev menggunakan Plugin bundled; stable/beta menggunakan npm) dan perbarui Plugin yang diinstal melalui npm.

Jika pembaruan Plugin npm yang dipin secara eksak di-resolve ke artefak yang integritasnya
berbeda dari catatan instalasi yang tersimpan, `openclaw update` membatalkan pembaruan
artefak Plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui Plugin
secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.

Kegagalan sinkronisasi Plugin pascapembaruan membuat hasil pembaruan gagal dan menghentikan
pekerjaan lanjutan restart. Perbaiki error instalasi/pembaruan Plugin, lalu jalankan ulang
`openclaw update`.

Jika bootstrap pnpm masih gagal, updater sekarang berhenti lebih awal dengan error khusus package manager alih-alih mencoba `npm run build` di dalam checkout.

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan script launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan update terlebih dahulu pada git checkout)
- [Development channels](/id/install/development-channels)
- [Updating](/id/install/updating)
- [CLI reference](/id/cli)
