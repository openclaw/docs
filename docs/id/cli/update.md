---
read_when:
    - Anda ingin memperbarui salinan kode sumber dengan aman
    - Anda sedang melakukan debug pada keluaran atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-11T20:26:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara kanal stable/beta/dev.

Jika Anda memasang melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan berjalan melalui alur manajer paket di [Memperbarui](/id/install/updating).

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

- `--no-restart`: lewati memulai ulang layanan Gateway setelah pembaruan berhasil. Pembaruan manajer paket yang memang memulai ulang Gateway memverifikasi bahwa layanan yang telah dimulai ulang melaporkan versi terbaru yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: atur kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur channel/tag/target/restart) tanpa menulis konfigurasi, memasang, menyinkronkan plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.warnings` saat plugin terkelola yang rusak atau tidak dapat dimuat perlu
  diperbaiki setelah pembaruan inti berhasil, detail fallback plugin kanal beta
  saat sebuah plugin tidak memiliki rilis beta, dan `postUpdate.plugins.integrityDrifts`
  saat drift artefak plugin npm terdeteksi selama sinkronisasi plugin pascapembaruan.
- `--timeout <seconds>`: timeout per langkah (default 1800 dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

`openclaw update` tidak memiliki flag `--verbose`. Gunakan `--dry-run` untuk mempratinjau
tindakan channel/tag/install/restart yang direncanakan, `--json` untuk hasil yang dapat
dibaca mesin, dan `openclaw update status --json` saat Anda hanya membutuhkan detail kanal
dan ketersediaan. Jika Anda men-debug log Gateway seputar pembaruan,
verbositas konsol dan level log file terpisah: Gateway `--verbose` memengaruhi
output terminal/WebSocket, sementara log file memerlukan `logging.level: "debug"` atau
`"trace"` dalam konfigurasi. Lihat [Logging Gateway](/id/gateway/logging).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), proses `openclaw update` yang mengubah state dinonaktifkan. Perbarui sumber Nix atau input flake untuk instalasi ini sebagai gantinya; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang berorientasi agen. `openclaw update status` dan `openclaw update --dry-run` tetap hanya-baca.
</Note>

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
- `--timeout <seconds>`: timeout untuk pemeriksaan (default 3 dtk).

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah Gateway akan dimulai ulang
setelah memperbarui (default adalah memulai ulang). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: timeout untuk setiap langkah pembaruan (default `1800`)

## Yang dilakukan

Saat Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga agar
metode instalasi tetap selaras:

- `dev` → memastikan checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan memasang CLI global dari checkout tersebut.
- `stable` → memasang dari npm menggunakan `latest`.
- `beta` → memprioritaskan dist-tag npm `beta`, tetapi fallback ke `latest` saat beta
  tidak ada atau lebih lama dari rilis stable saat ini.

Pembaruan otomatis inti Gateway (saat diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar handler permintaan Gateway yang sedang berjalan. Pembaruan manajer paket `update.run` control-plane
memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah paket diganti,
karena proses Gateway lama mungkin masih memiliki chunk dalam memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk instalasi manajer paket, `openclaw update` menyelesaikan versi paket target
sebelum memanggil manajer paket. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw memasang paket baru ke prefix npm sementara, memverifikasi inventaris
`dist` yang dipaketkan di sana, lalu menukar pohon paket bersih tersebut ke
prefix global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi plugin, dan
pekerjaan restart tidak berjalan dari pohon yang mencurigakan. Bahkan saat versi yang terpasang
sudah sesuai target, perintah menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi plugin, penyegaran completion perintah inti, dan pekerjaan restart. Ini
menjaga sidecar yang dipaketkan dan catatan plugin milik kanal tetap selaras dengan
build OpenClaw yang terpasang, sambil menyerahkan rebuild completion perintah plugin penuh ke
proses eksplisit `openclaw completion --write-state`.

Saat layanan Gateway terkelola lokal terpasang dan restart diaktifkan,
pembaruan manajer paket menghentikan layanan yang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari instalasi yang diperbarui, memulai ulang
layanan, dan memverifikasi Gateway yang dimulai ulang melaporkan versi yang diharapkan sebelum
melaporkan keberhasilan. Di macOS, pemeriksaan pascapembaruan juga memverifikasi LaunchAgent
dimuat/berjalan untuk profil aktif dan port loopback yang dikonfigurasi
sehat. Jika plist terpasang tetapi launchd tidak mengawasinya, OpenClaw
melakukan bootstrap ulang LaunchAgent secara otomatis, lalu menjalankan ulang
pemeriksaan kesiapan kesehatan/versi/kanal. Bootstrap baru memuat job RunAtLoad
secara langsung, sehingga pemulihan pembaruan tidak langsung menjalankan `kickstart -k` pada Gateway
yang baru dimunculkan. Jika Gateway tetap tidak menjadi sehat, perintah keluar
non-zero dan mencetak jalur log restart plus instruksi eksplisit untuk restart, install ulang, dan
rollback paket. Dengan `--no-restart`,
penggantian paket tetap berjalan tetapi layanan terkelola tidak dihentikan atau
dimulai ulang, sehingga Gateway yang berjalan dapat tetap memakai kode lama sampai Anda memulai ulangnya
secara manual.

## Alur checkout git

### Pemilihan kanal

- `stable`: checkout tag non-beta terbaru, lalu build dan jalankan doctor.
- `beta`: prioritaskan tag `-beta` terbaru, tetapi fallback ke tag stable terbaru saat beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch dan rebase.

### Langkah pembaruan

<Steps>
  <Step title="Verifikasi worktree bersih">
    Tidak boleh ada perubahan yang belum di-commit.
  </Step>
  <Step title="Ganti kanal">
    Beralih ke kanal yang dipilih (tag atau branch).
  </Step>
  <Step title="Fetch upstream">
    Hanya dev.
  </Step>
  <Step title="Build preflight (hanya dev)">
    Menjalankan build TypeScript di worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan commit terbaru yang dapat dibuild. Atur `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` untuk juga menjalankan lint selama preflight ini; lint berjalan dalam mode serial terbatas karena host pembaruan pengguna sering kali lebih kecil daripada runner CI.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (hanya dev).
  </Step>
  <Step title="Pasang dependensi">
    Menggunakan manajer paket repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@11`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Membangun gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan safe-update terakhir.
  </Step>
  <Step title="Sinkronkan plugin">
    Menyinkronkan plugin ke kanal aktif. Dev menggunakan plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi plugin yang dilacak.
  </Step>
</Steps>

Pada kanal pembaruan beta, instalasi plugin npm dan ClawHub yang dilacak dan mengikuti
jalur default/latest mencoba rilis plugin `@beta` terlebih dahulu. Jika plugin tidak memiliki
rilis beta, OpenClaw fallback ke spec default/latest yang tercatat dan melaporkannya
sebagai peringatan. Untuk plugin npm, OpenClaw juga fallback saat paket beta
ada tetapi gagal validasi instalasi. Peringatan fallback plugin ini tidak
membuat pembaruan inti gagal. Versi eksak dan tag eksplisit tidak
ditulis ulang.

<Warning>
Jika pembaruan plugin npm yang dipin secara eksak diselesaikan ke artefak yang integritasnya berbeda dari catatan instalasi tersimpan, `openclaw update` membatalkan pembaruan artefak plugin tersebut alih-alih memasangnya. Install ulang atau perbarui plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi plugin pascapembaruan yang terbatas pada plugin terkelola dilaporkan sebagai peringatan setelah pembaruan inti berhasil. Hasil JSON mempertahankan `status: "ok"` tingkat atas pembaruan dan melaporkan `postUpdate.plugins.status: "warning"` dengan panduan `openclaw doctor --fix` dan `openclaw plugins inspect <id> --runtime --json`. Exception updater atau sinkronisasi yang tidak terduga tetap menggagalkan hasil pembaruan. Perbaiki instalasi plugin atau error pembaruan, lalu jalankan ulang `openclaw doctor --fix` atau `openclaw update`.

Saat Gateway yang diperbarui dimulai, pemuatan plugin bersifat hanya-verifikasi: startup tidak menjalankan manajer paket atau mengubah pohon dependensi. Restart `update.run` manajer paket melewati penundaan idle normal dan cooldown restart setelah pohon paket ditukar, sehingga proses lama tidak dapat terus melakukan lazy-load chunk yang telah dihapus.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan error spesifik manajer paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan menjalankan update terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
