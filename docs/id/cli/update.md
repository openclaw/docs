---
read_when:
    - Anda ingin memperbarui checkout kode sumber dengan aman
    - Anda sedang men-debug keluaran atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang cukup aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-06T17:54:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
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
- `--channel <stable|beta|dev>`: tetapkan saluran pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur saluran/tag/target/restart) tanpa menulis konfigurasi, menginstal, menyinkronkan Plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.warnings` saat Plugin terkelola yang rusak atau tidak dapat dimuat perlu
  diperbaiki setelah pembaruan inti berhasil, dan `postUpdate.plugins.integrityDrifts`
  saat drift artefak Plugin npm terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default 1800 dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

`openclaw update` tidak memiliki flag `--verbose`. Gunakan `--dry-run` untuk mempratinjau
tindakan saluran/tag/instal/restart yang direncanakan, `--json` untuk hasil yang dapat dibaca mesin,
dan `openclaw update status --json` saat Anda hanya memerlukan detail saluran dan
ketersediaan. Jika Anda men-debug log Gateway seputar pembaruan,
verbositas konsol dan level log file terpisah: Gateway `--verbose` memengaruhi
output terminal/WebSocket, sementara log file memerlukan `logging.level: "debug"` atau
`"trace"` dalam konfigurasi. Lihat [logging Gateway](/id/gateway/logging).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), run `openclaw update` yang mengubah status dinonaktifkan. Perbarui sumber Nix atau input flake untuk instalasi ini sebagai gantinya; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen. `openclaw update status` dan `openclaw update --dry-run` tetap hanya-baca.
</Note>

<Warning>
Downgrade memerlukan konfirmasi karena versi yang lebih lama dapat merusak konfigurasi.
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
setelah memperbarui (default-nya adalah memulai ulang). Jika Anda memilih `dev` tanpa checkout git, alur ini
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
  tidak ada atau lebih lama daripada rilis stable saat ini.

Auto-updater inti Gateway (saat diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar handler permintaan Gateway yang sedang berjalan. Pembaruan manajer paket `update.run`
pada control-plane memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah penggantian paket,
karena proses Gateway lama mungkin masih memiliki chunk dalam memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk instalasi manajer paket, `openclaw update` menyelesaikan versi paket target
sebelum memanggil manajer paket. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw menginstal paket baru ke prefiks npm sementara, memverifikasi
inventaris `dist` yang dipaketkan di sana, lalu menukar pohon paket bersih tersebut ke
prefiks global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi Plugin, dan
pekerjaan restart tidak dijalankan dari pohon yang dicurigai. Bahkan saat versi terinstal
sudah cocok dengan target, perintah ini menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi Plugin, penyegaran penyelesaian perintah inti, dan pekerjaan restart. Ini
menjaga sidecar terpaket dan catatan Plugin milik saluran tetap selaras dengan
build OpenClaw yang terinstal sambil membiarkan rebuild penyelesaian perintah Plugin penuh dilakukan oleh
run eksplisit `openclaw completion --write-state`.

Saat layanan Gateway terkelola lokal terinstal dan restart diaktifkan,
pembaruan manajer paket menghentikan layanan yang sedang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari instalasi yang diperbarui, memulai ulang
layanan, dan memverifikasi Gateway yang dimulai ulang melaporkan versi yang diharapkan sebelum
melaporkan keberhasilan. Di macOS, pemeriksaan pascapembaruan juga memverifikasi bahwa LaunchAgent
dimuat/berjalan untuk profil aktif dan port loopback yang dikonfigurasi
sehat. Jika plist terinstal tetapi launchd tidak mengawasinya, OpenClaw
melakukan bootstrap ulang LaunchAgent secara otomatis, lalu menjalankan ulang
pemeriksaan kesiapan kesehatan/versi/saluran. Bootstrap baru memuat job RunAtLoad
secara langsung, sehingga pemulihan pembaruan tidak langsung melakukan `kickstart -k` pada Gateway
yang baru dibuat. Jika Gateway masih tidak menjadi sehat, perintah keluar
dengan non-zero dan mencetak jalur log restart beserta instruksi restart, instal ulang, dan
rollback paket yang eksplisit. Dengan `--no-restart`,
penggantian paket tetap berjalan tetapi layanan terkelola tidak dihentikan atau
dimulai ulang, sehingga Gateway yang sedang berjalan dapat tetap menggunakan kode lama sampai Anda memulainya ulang
secara manual.

## Alur checkout git

### Pemilihan saluran

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi fallback ke tag stable terbaru saat beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch dan rebase.

### Langkah pembaruan

<Steps>
  <Step title="Verify clean worktree">
    Memerlukan tidak ada perubahan yang belum di-commit.
  </Step>
  <Step title="Switch channel">
    Beralih ke saluran yang dipilih (tag atau branch).
  </Step>
  <Step title="Fetch upstream">
    Hanya dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Menjalankan build TypeScript di worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan commit terbaru yang dapat dibuild. Tetapkan `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` untuk juga menjalankan lint selama preflight ini; lint berjalan dalam mode serial terbatas karena host pembaruan pengguna sering lebih kecil daripada runner CI.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (hanya dev).
  </Step>
  <Step title="Install dependencies">
    Menggunakan manajer paket repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@10`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Membangun gateway dan Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan safe-update terakhir.
  </Step>
  <Step title="Sync plugins">
    Menyinkronkan Plugin ke saluran aktif. Dev menggunakan Plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi Plugin yang dilacak.
  </Step>
</Steps>

Pada saluran pembaruan beta, instalasi Plugin npm dan ClawHub yang dilacak yang mengikuti
baris default/latest mencoba rilis Plugin `@beta` terlebih dahulu. Jika Plugin tidak memiliki
rilis beta, OpenClaw fallback ke spec default/latest yang tercatat. Untuk Plugin npm,
OpenClaw juga fallback saat paket beta ada tetapi gagal validasi
instalasi. Versi tepat dan tag eksplisit tidak ditulis ulang.

<Warning>
Jika pembaruan Plugin npm yang dipin tepat menghasilkan artefak yang integritasnya berbeda dari catatan instal tersimpan, `openclaw update` membatalkan pembaruan artefak Plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui Plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi Plugin pascapembaruan yang terbatas pada Plugin terkelola dilaporkan sebagai peringatan setelah pembaruan inti berhasil. Hasil JSON mempertahankan `status: "ok"` pembaruan tingkat atas dan melaporkan `postUpdate.plugins.status: "warning"` dengan panduan `openclaw doctor --fix` dan `openclaw plugins inspect <id> --runtime --json`. Pengecualian updater atau sinkronisasi yang tidak terduga tetap menggagalkan hasil pembaruan. Perbaiki instalasi Plugin atau kesalahan pembaruan, lalu jalankan ulang `openclaw doctor --fix` atau `openclaw update`.

Saat Gateway yang diperbarui dimulai, pemuatan Plugin hanya-verifikasi: startup tidak menjalankan manajer paket atau mengubah pohon dependensi. Restart `update.run` manajer paket melewati penundaan idle normal dan cooldown restart setelah pohon paket ditukar, sehingga proses lama tidak dapat terus melakukan lazy-load chunk yang dihapus.

Jika bootstrap pnpm masih gagal, updater berhenti lebih awal dengan kesalahan khusus manajer paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Shorthand `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Saluran pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
