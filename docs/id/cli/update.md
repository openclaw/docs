---
read_when:
    - Anda ingin memperbarui checkout sumber dengan aman
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + restart otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-02T09:17:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara saluran stable/beta/dev.

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

- `--no-restart`: lewati memulai ulang layanan Gateway setelah pembaruan berhasil. Pembaruan manajer paket yang memang memulai ulang Gateway memverifikasi bahwa layanan yang dimulai ulang melaporkan versi terbaru yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: atur saluran pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur channel/tag/target/restart) tanpa menulis konfigurasi, menginstal, menyinkronkan Plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.integrityDrifts` saat drift artefak Plugin npm
  terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default 1800 dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

<Warning>
Downgrade memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.
</Warning>

## `update status`

Tampilkan saluran pembaruan aktif + tag/branch/SHA git (untuk checkout sumber), beserta ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default 3 dtk).

## `update wizard`

Alur interaktif untuk memilih saluran pembaruan dan mengonfirmasi apakah akan memulai ulang Gateway
setelah pembaruan (default-nya adalah memulai ulang). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1800`)

## Yang dilakukannya

Saat Anda beralih saluran secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan ada checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → mengutamakan dist-tag npm `beta`, tetapi fallback ke `latest` saat beta
  hilang atau lebih lama dari rilis stable saat ini.

Auto-updater inti Gateway (saat diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar handler permintaan Gateway yang sedang berjalan. Pembaruan manajer paket
control-plane `update.run` memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah pertukaran paket,
karena proses Gateway lama mungkin masih memiliki chunk di memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk instalasi manajer paket, `openclaw update` menyelesaikan versi paket target
sebelum memanggil manajer paket. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw menginstal paket baru ke prefiks npm sementara, memverifikasi
inventaris `dist` yang dipaketkan di sana, lalu menukar pohon paket bersih itu ke
prefiks global yang sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi Plugin, dan
pekerjaan restart tidak dijalankan dari pohon yang dicurigai. Bahkan saat versi yang terinstal
sudah cocok dengan target, perintah ini menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi Plugin, penyegaran penyelesaian perintah inti, dan pekerjaan restart. Ini
menjaga sidecar yang dipaketkan dan catatan Plugin milik saluran tetap selaras dengan
build OpenClaw yang terinstal sambil menyerahkan rebuild penyelesaian perintah Plugin penuh ke
eksekusi `openclaw completion --write-state` eksplisit.

Saat layanan Gateway terkelola lokal terinstal dan restart diaktifkan,
pembaruan manajer paket menghentikan layanan yang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari instalasi yang diperbarui, memulai ulang
layanan, dan memverifikasi Gateway yang dimulai ulang melaporkan versi yang diharapkan. Dengan
`--no-restart`, penggantian paket tetap berjalan tetapi layanan terkelola tidak
dihentikan atau dimulai ulang, sehingga Gateway yang berjalan mungkin tetap menggunakan kode lama sampai Anda memulai ulang
secara manual.

## Alur checkout git

### Pemilihan saluran

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi fallback ke tag stable terbaru saat beta hilang atau lebih lama.
- `dev`: checkout `main`, lalu fetch dan rebase.

### Langkah pembaruan

<Steps>
  <Step title="Verifikasi worktree bersih">
    Memerlukan tidak ada perubahan yang belum di-commit.
  </Step>
  <Step title="Beralih saluran">
    Beralih ke saluran yang dipilih (tag atau branch).
  </Step>
  <Step title="Fetch upstream">
    Hanya dev.
  </Step>
  <Step title="Build preflight (hanya dev)">
    Menjalankan lint dan build TypeScript dalam worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan build bersih terbaru.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (hanya dev).
  </Step>
  <Step title="Instal dependensi">
    Menggunakan manajer paket repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@10`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Mem-build Gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan pembaruan aman terakhir.
  </Step>
  <Step title="Sinkronkan Plugin">
    Menyinkronkan Plugin ke saluran aktif. Dev menggunakan Plugin bawaan; stable dan beta menggunakan npm. Memperbarui Plugin yang diinstal npm.
  </Step>
</Steps>

<Warning>
Jika pembaruan Plugin npm yang dipin secara persis diselesaikan ke artefak yang integritasnya berbeda dari catatan instalasi tersimpan, `openclaw update` membatalkan pembaruan artefak Plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui Plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi Plugin pascapembaruan menggagalkan hasil pembaruan dan menghentikan pekerjaan lanjutan restart. Perbaiki instalasi Plugin atau kesalahan pembaruan, lalu jalankan ulang `openclaw update`.

Saat Gateway yang diperbarui dimulai, pemuatan Plugin bersifat hanya verifikasi: startup tidak menjalankan manajer paket atau memutasi pohon dependensi. Restart `update.run` manajer paket melewati penundaan idle normal dan cooldown restart setelah pohon paket ditukar, sehingga proses lama tidak dapat terus melakukan lazy-loading chunk yang dihapus.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan kesalahan khusus manajer paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Pintasan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Saluran pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
