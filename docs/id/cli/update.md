---
read_when:
    - Anda ingin memperbarui checkout sumber dengan aman
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-01T09:23:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfbbd6e3cd1a83e3700fa248a6ce2cb3adf1c94d0d5491895eea21bfec5d52b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara kanal stabil/beta/dev.

Jika Anda memasang melalui **npm/pnpm/bun** (pemasangan global, tanpa metadata git),
pembaruan dilakukan melalui alur manajer paket di [Memperbarui](/id/install/updating).

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

- `--no-restart`: lewati memulai ulang layanan Gateway setelah pembaruan berhasil. Pembaruan manajer paket yang memulai ulang Gateway memverifikasi bahwa layanan yang dimulai ulang melaporkan versi terbaru yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: tetapkan kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk pemasangan paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/mulai ulang) tanpa menulis konfigurasi, memasang, menyinkronkan plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.integrityDrifts` saat pergeseran artefak Plugin npm
  terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default adalah 1800 dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

<Warning>
Downgrade memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.
</Warning>

## `update status`

Tampilkan kanal pembaruan aktif + tag/cabang/SHA git (untuk checkout sumber), ditambah ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default adalah 3 dtk).

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah akan memulai ulang Gateway
setelah memperbarui (default adalah memulai ulang). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1800`)

## Apa yang dilakukan

Saat Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode pemasangan tetap selaras:

- `dev` → memastikan checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan memasang CLI global dari checkout tersebut.
- `stable` → memasang dari npm menggunakan `latest`.
- `beta` → mengutamakan dist-tag npm `beta`, tetapi mundur ke `latest` saat beta
  tidak ada atau lebih lama daripada rilis stabil saat ini.

Pembaruan otomatis inti Gateway (saat diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar handler permintaan Gateway yang sedang berjalan. Pembaruan manajer paket
control-plane `update.run` memaksa mulai ulang pembaruan tanpa penundaan dan tanpa masa tunggu setelah pertukaran paket,
karena proses Gateway lama mungkin masih memiliki chunk dalam memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk pemasangan manajer paket, `openclaw update` menyelesaikan versi paket
target sebelum memanggil manajer paket. Pemasangan global npm menggunakan pemasangan bertahap:
OpenClaw memasang paket baru ke prefix npm sementara, memverifikasi
inventaris `dist` yang dipaketkan di sana, lalu menukar pohon paket bersih tersebut ke
prefix global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi Plugin, dan
pekerjaan mulai ulang tidak dijalankan dari pohon yang dicurigai. Bahkan saat versi yang terpasang
sudah cocok dengan target, perintah ini menyegarkan pemasangan paket global,
lalu menjalankan sinkronisasi Plugin, penyegaran penyelesaian perintah inti, dan pekerjaan mulai ulang. Ini
menjaga sidecar yang dipaketkan dan rekaman Plugin milik kanal tetap selaras dengan
build OpenClaw yang terpasang sambil menyerahkan pembangunan ulang penyelesaian perintah Plugin penuh ke
eksekusi eksplisit `openclaw completion --write-state`.

Saat layanan Gateway terkelola lokal terpasang dan mulai ulang diaktifkan,
pembaruan manajer paket menghentikan layanan yang sedang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari pemasangan yang diperbarui, memulai ulang
layanan, dan memverifikasi Gateway yang dimulai ulang melaporkan versi yang diharapkan. Dengan
`--no-restart`, penggantian paket tetap berjalan tetapi layanan terkelola tidak
dihentikan atau dimulai ulang, sehingga Gateway yang sedang berjalan mungkin tetap menggunakan kode lama sampai Anda memulai ulang
secara manual.

## Alur checkout git

### Pemilihan kanal

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi mundur ke tag stabil terbaru saat beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu ambil dan rebase.

### Langkah pembaruan

<Steps>
  <Step title="Verifikasi worktree bersih">
    Tidak boleh ada perubahan yang belum di-commit.
  </Step>
  <Step title="Beralih kanal">
    Beralih ke kanal yang dipilih (tag atau cabang).
  </Step>
  <Step title="Ambil upstream">
    Hanya dev.
  </Step>
  <Step title="Build preflight (hanya dev)">
    Menjalankan lint dan build TypeScript dalam worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan build bersih terbaru.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (hanya dev).
  </Step>
  <Step title="Pasang dependensi">
    Menggunakan manajer paket repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@10`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Membangun Gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan pembaruan aman terakhir.
  </Step>
  <Step title="Sinkronkan Plugin">
    Menyinkronkan Plugin ke kanal aktif. Dev menggunakan Plugin bawaan; stable dan beta menggunakan npm. Memperbarui Plugin yang dipasang dari npm.
  </Step>
</Steps>

<Warning>
Jika pembaruan Plugin npm yang dipin secara persis diselesaikan ke artefak yang integritasnya berbeda dari rekaman pemasangan yang tersimpan, `openclaw update` membatalkan pembaruan artefak Plugin tersebut alih-alih memasangnya. Pasang ulang atau perbarui Plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi Plugin pascapembaruan menggagalkan hasil pembaruan dan menghentikan pekerjaan lanjutan mulai ulang. Perbaiki pemasangan Plugin atau kesalahan pembaruan, lalu jalankan ulang `openclaw update`.

Saat Gateway yang diperbarui dimulai, dependensi runtime Plugin bawaan yang diaktifkan disiapkan sebelum aktivasi Plugin. Mulai ulang `update.run` manajer paket melewati penundaan idle normal dan masa tunggu mulai ulang setelah pohon paket ditukar, sehingga proses lama tidak dapat terus melakukan lazy-load chunk yang telah dihapus. Mulai ulang manajer layanan tetap menguras staging dependensi runtime sebelum menutup Gateway.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan kesalahan khusus manajer paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan update terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
