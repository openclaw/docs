---
read_when:
    - Anda ingin memperbarui salinan kerja sumber dengan aman
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-02T20:43:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara kanal stable/beta/dev.

Jika Anda memasang melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git), pembaruan dilakukan melalui alur pengelola paket di [Memperbarui](/id/install/updating).

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

- `--no-restart`: lewati pemulaian ulang layanan Gateway setelah pembaruan berhasil. Pembaruan pengelola paket yang memang memulai ulang Gateway memverifikasi bahwa layanan yang dimulai ulang melaporkan versi terbaru yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: atur kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/mulai ulang) tanpa menulis konfigurasi, memasang, menyinkronkan Plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.integrityDrifts` saat pergeseran artefak Plugin npm
  terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default adalah 1800 dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

<Warning>
Downgrade memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.
</Warning>

## `update status`

Tampilkan kanal pembaruan aktif + tag/branch/SHA git (untuk checkout sumber), ditambah ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default adalah 3 dtk).

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah akan memulai ulang Gateway setelah pembaruan (default-nya adalah memulai ulang). Jika Anda memilih `dev` tanpa checkout git, alur ini menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1800`)

## Yang Dilakukan

Saat Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga metode instalasi tetap selaras:

- `dev` → memastikan checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`), memperbaruinya, dan memasang CLI global dari checkout tersebut.
- `stable` → memasang dari npm menggunakan `latest`.
- `beta` → mengutamakan dist-tag npm `beta`, tetapi kembali ke `latest` saat beta tidak ada atau lebih lama daripada rilis stable saat ini.

Pembaruan otomatis inti Gateway (saat diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI di luar handler permintaan Gateway langsung. Pembaruan pengelola paket bidang kontrol `update.run` memaksa mulai ulang pembaruan tanpa penundaan dan tanpa cooldown setelah pertukaran paket, karena proses Gateway lama mungkin masih memiliki chunk dalam memori yang menunjuk ke file yang dihapus oleh paket baru.

Untuk instalasi pengelola paket, `openclaw update` menyelesaikan versi paket target sebelum memanggil pengelola paket. Instalasi global npm menggunakan instalasi bertahap: OpenClaw memasang paket baru ke prefix npm sementara, memverifikasi inventaris `dist` yang dipaketkan di sana, lalu menukar pohon paket bersih itu ke prefix global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi Plugin, dan pekerjaan mulai ulang tidak dijalankan dari pohon yang mencurigakan. Bahkan ketika versi yang terpasang sudah cocok dengan target, perintah ini menyegarkan instalasi paket global, lalu menjalankan sinkronisasi Plugin, penyegaran penyelesaian perintah inti, dan pekerjaan mulai ulang. Ini menjaga sidecar yang dipaketkan dan catatan Plugin milik kanal tetap selaras dengan build OpenClaw yang terpasang sambil menyerahkan pembangunan ulang penyelesaian perintah Plugin penuh ke eksekusi eksplisit `openclaw completion --write-state`.

Saat layanan Gateway terkelola lokal terpasang dan mulai ulang diaktifkan, pembaruan pengelola paket menghentikan layanan yang berjalan sebelum mengganti pohon paket, lalu menyegarkan metadata layanan dari instalasi yang diperbarui, memulai ulang layanan, dan memverifikasi bahwa Gateway yang dimulai ulang melaporkan versi yang diharapkan. Dengan `--no-restart`, penggantian paket tetap berjalan tetapi layanan terkelola tidak dihentikan atau dimulai ulang, sehingga Gateway yang berjalan mungkin tetap memakai kode lama sampai Anda memulai ulang secara manual.

## Alur Checkout Git

### Pemilihan Kanal

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi kembali ke tag stable terbaru saat beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch dan rebase.

### Langkah Pembaruan

<Steps>
  <Step title="Verify clean worktree">
    Memerlukan tidak ada perubahan yang belum di-commit.
  </Step>
  <Step title="Switch channel">
    Beralih ke kanal yang dipilih (tag atau branch).
  </Step>
  <Step title="Fetch upstream">
    Hanya dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Menjalankan lint dan build TypeScript di worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan build bersih terbaru.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (hanya dev).
  </Step>
  <Step title="Install dependencies">
    Menggunakan pengelola paket repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@10`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Membangun gateway dan Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan akhir pembaruan aman.
  </Step>
  <Step title="Sync plugins">
    Menyinkronkan Plugin ke kanal aktif. Dev menggunakan Plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi Plugin yang dilacak.
  </Step>
</Steps>

Pada kanal pembaruan beta, instalasi Plugin npm dan ClawHub yang dilacak yang mengikuti jalur default/latest mencoba rilis Plugin `@beta` terlebih dahulu. Jika Plugin tidak memiliki rilis beta, OpenClaw kembali ke spec default/latest yang tercatat. Versi persis dan tag eksplisit tidak ditulis ulang.

<Warning>
Jika pembaruan Plugin npm yang dipin secara persis diselesaikan ke artefak yang integritasnya berbeda dari catatan instalasi yang tersimpan, `openclaw update` membatalkan pembaruan artefak Plugin tersebut alih-alih memasangnya. Pasang ulang atau perbarui Plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi Plugin pascapembaruan menggagalkan hasil pembaruan dan menghentikan pekerjaan lanjutan mulai ulang. Perbaiki instalasi Plugin atau kesalahan pembaruan, lalu jalankan ulang `openclaw update`.

Saat Gateway yang diperbarui dimulai, pemuatan Plugin hanya verifikasi: startup tidak menjalankan pengelola paket atau mengubah pohon dependensi. Mulai ulang `update.run` pengelola paket melewati penundaan idle normal dan cooldown mulai ulang setelah pohon paket ditukar, sehingga proses lama tidak dapat terus melakukan lazy-load pada chunk yang sudah dihapus.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan kesalahan khusus pengelola paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip peluncur).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
