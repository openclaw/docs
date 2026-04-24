---
read_when:
    - Anda ingin memperbarui checkout source dengan aman
    - Anda perlu memahami perilaku singkat `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan source yang cukup aman + restart otomatis gateway)
title: Pembaruan
x-i18n:
    generated_at: "2026-04-24T09:03:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih di antara kanal stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan dilakukan melalui alur package-manager di [Updating](/id/install/updating).

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

- `--no-restart`: lewati restart layanan Gateway setelah pembaruan berhasil.
- `--channel <stable|beta|dev>`: setel kanal pembaruan (git + npm; dipertahankan di konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target package hanya untuk pembaruan ini. Untuk instalasi package, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/restart) tanpa menulis konfigurasi, menginstal, menyinkronkan Plugin, atau merestart.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.integrityDrifts` ketika drift integritas artefak Plugin npm
  terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: timeout per langkah (default adalah 1200s).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade)

Catatan: downgrade memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.

## `update status`

Tampilkan kanal pembaruan aktif + tag/branch/SHA git (untuk checkout source), beserta ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: timeout untuk pemeriksaan (default adalah 3s).

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah Gateway harus direstart
setelah pembaruan (default adalah restart). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatkannya.

Opsi:

- `--timeout <seconds>`: timeout untuk setiap langkah pembaruan (default `1200`)

## Apa yang dilakukan

Ketika Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan ada checkout git (default: `~/openclaw`, override dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → mengutamakan npm dist-tag `beta`, tetapi fallback ke `latest` ketika beta
  tidak ada atau lebih lama daripada rilis stable saat ini.

Auto-updater inti Gateway (ketika diaktifkan melalui konfigurasi) menggunakan kembali jalur pembaruan yang sama ini.

Untuk instalasi package-manager, `openclaw update` menyelesaikan versi package target
sebelum memanggil package manager. Jika versi yang terinstal persis
cocok dengan target dan tidak ada perubahan kanal pembaruan yang perlu dipertahankan, perintah
keluar sebagai skipped sebelum pekerjaan instalasi package, sinkronisasi Plugin, refresh completion,
atau restart gateway.

## Alur checkout git

Kanal:

- `stable`: checkout tag non-beta terbaru, lalu build + doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi fallback ke tag stable terbaru
  ketika beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch + rebase.

Gambaran umum:

1. Memerlukan worktree yang bersih (tanpa perubahan yang belum di-commit).
2. Beralih ke kanal yang dipilih (tag atau branch).
3. Fetch upstream (hanya dev).
4. Hanya dev: preflight lint + build TypeScript di worktree sementara; jika tip gagal, mundur hingga 10 commit untuk menemukan build bersih terbaru.
5. Rebase ke commit yang dipilih (hanya dev).
6. Menginstal dependensi dengan package manager repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@10`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
7. Build + build Control UI.
8. Menjalankan `openclaw doctor` sebagai pemeriksaan akhir “pembaruan aman”.
9. Menyinkronkan Plugin ke kanal aktif (dev menggunakan Plugin bawaan; stable/beta menggunakan npm) dan memperbarui Plugin yang diinstal dengan npm.

Jika pembaruan Plugin npm yang dipin secara tepat diselesaikan ke artefak yang integritasnya
berbeda dari catatan instalasi yang tersimpan, `openclaw update` membatalkan pembaruan
artefak Plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui Plugin
secara eksplisit hanya setelah memverifikasi bahwa Anda mempercayai artefak baru tersebut.

Jika bootstrap pnpm tetap gagal, updater sekarang berhenti lebih awal dengan error khusus package-manager alih-alih mencoba `npm run build` di dalam checkout.

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Updating](/id/install/updating)
- [Referensi CLI](/id/cli)
