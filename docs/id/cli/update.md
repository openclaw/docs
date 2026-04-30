---
read_when:
    - Anda ingin memperbarui checkout sumber dengan aman
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-04-30T09:42:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara kanal stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
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

- `--no-restart`: lewati restart layanan Gateway setelah pembaruan berhasil. Pembaruan manajer paket yang memang merestart Gateway memverifikasi bahwa layanan yang direstart melaporkan versi terbaru yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: atur kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/restart) tanpa menulis konfigurasi, menginstal, menyinkronkan Plugin, atau merestart.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.integrityDrifts` ketika penyimpangan artefak Plugin npm
  terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default 1800 dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

<Warning>
Downgrade memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.
</Warning>

## `update status`

Tampilkan kanal pembaruan aktif + tag/cabang/SHA git (untuk checkout sumber), serta ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default 3 dtk).

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah akan merestart Gateway
setelah memperbarui (default-nya adalah restart). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1800`)

## Yang dilakukannya

Saat Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan ada checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → mengutamakan dist-tag npm `beta`, tetapi fallback ke `latest` ketika beta
  tidak ada atau lebih lama dari rilis stable saat ini.

Pembaruan otomatis inti Gateway (saat diaktifkan melalui konfigurasi) menggunakan kembali jalur pembaruan yang sama ini.

Untuk instalasi manajer paket, `openclaw update` me-resolve versi paket target
sebelum memanggil manajer paket. Instalasi global npm menggunakan instalasi
bertahap: OpenClaw menginstal paket baru ke prefix npm sementara, memverifikasi
inventaris `dist` yang dipaketkan di sana, lalu menukar pohon paket bersih itu ke
prefix global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi Plugin, dan
pekerjaan restart tidak berjalan dari pohon yang dicurigai. Bahkan ketika versi yang terinstal
sudah cocok dengan target, perintah ini menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi Plugin, penyegaran penyelesaian perintah inti, dan pekerjaan restart. Ini
menjaga sidecar yang dipaketkan dan catatan Plugin milik kanal tetap selaras dengan
build OpenClaw yang terinstal sambil menyerahkan pembangunan ulang penyelesaian perintah Plugin penuh ke
eksekusi eksplisit `openclaw completion --write-state`.

Ketika layanan Gateway terkelola lokal terinstal dan restart diaktifkan,
pembaruan manajer paket menghentikan layanan yang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari instalasi yang diperbarui, merestart
layanan, dan memverifikasi bahwa Gateway yang direstart melaporkan versi yang diharapkan. Dengan
`--no-restart`, penggantian paket tetap berjalan tetapi layanan terkelola tidak
dihentikan atau direstart, sehingga Gateway yang berjalan dapat tetap memakai kode lama sampai Anda merestartnya
secara manual.

## Alur checkout git

### Pemilihan kanal

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi fallback ke tag stable terbaru ketika beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch dan rebase.

### Langkah pembaruan

<Steps>
  <Step title="Verifikasi worktree bersih">
    Memerlukan tidak ada perubahan yang belum di-commit.
  </Step>
  <Step title="Beralih kanal">
    Beralih ke kanal yang dipilih (tag atau cabang).
  </Step>
  <Step title="Fetch upstream">
    Hanya dev.
  </Step>
  <Step title="Build preflight (hanya dev)">
    Menjalankan lint dan build TypeScript di worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan build bersih terbaru.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (hanya dev).
  </Step>
  <Step title="Instal dependensi">
    Menggunakan manajer paket repo. Untuk checkout pnpm, pembaru melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback `npm install pnpm@10` sementara) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Mem-build gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan pembaruan aman terakhir.
  </Step>
  <Step title="Sinkronkan Plugin">
    Menyinkronkan Plugin ke kanal aktif. Dev menggunakan Plugin bawaan; stable dan beta menggunakan npm. Memperbarui Plugin yang diinstal melalui npm.
  </Step>
</Steps>

<Warning>
Jika pembaruan Plugin npm yang dipin secara tepat di-resolve ke artefak yang integritasnya berbeda dari catatan instalasi yang tersimpan, `openclaw update` membatalkan pembaruan artefak Plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui Plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi Plugin pascapembaruan menggagalkan hasil pembaruan dan menghentikan pekerjaan lanjutan restart. Perbaiki kesalahan instalasi atau pembaruan Plugin, lalu jalankan ulang `openclaw update`.

Saat Gateway yang diperbarui dimulai, dependensi runtime Plugin bawaan yang diaktifkan disiapkan sebelum aktivasi Plugin. Restart yang dipicu pembaruan menguras staging dependensi runtime yang aktif sebelum menutup Gateway, sehingga restart manajer layanan tidak mengganggu instalasi npm yang sedang berjalan.

Jika bootstrap pnpm tetap gagal, pembaru berhenti lebih awal dengan kesalahan spesifik manajer paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Pintasan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip peluncur).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan update terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
