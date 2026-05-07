---
read_when:
    - Anda ingin memperbarui checkout sumber dengan aman
    - Anda sedang men-debug keluaran atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-07T13:15:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara kanal stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan terjadi melalui alur package manager di [Memperbarui](/id/install/updating).

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

- `--no-restart`: lewati restart layanan Gateway setelah pembaruan berhasil. Pembaruan package manager yang me-restart Gateway memverifikasi bahwa layanan yang direstart melaporkan versi terbaru yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: atur kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/restart) tanpa menulis konfigurasi, menginstal, menyinkronkan plugin, atau me-restart.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.warnings` ketika plugin terkelola yang rusak atau tidak dapat dimuat perlu
  diperbaiki setelah pembaruan core berhasil, dan `postUpdate.plugins.integrityDrifts`
  ketika drift artefak plugin npm terdeteksi selama sinkronisasi plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default 1800 detik).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

`openclaw update` tidak memiliki flag `--verbose`. Gunakan `--dry-run` untuk mempratinjau
tindakan kanal/tag/instal/restart yang direncanakan, `--json` untuk hasil yang dapat dibaca
mesin, dan `openclaw update status --json` ketika Anda hanya memerlukan detail kanal dan
ketersediaan. Jika Anda men-debug log Gateway seputar pembaruan,
verbositas konsol dan level log file terpisah: Gateway `--verbose` memengaruhi
output terminal/WebSocket, sedangkan log file memerlukan `logging.level: "debug"` atau
`"trace"` dalam konfigurasi. Lihat [Logging Gateway](/id/gateway/logging).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), eksekusi `openclaw update` yang mengubah status dinonaktifkan. Sebagai gantinya, perbarui sumber Nix atau input flake untuk instalasi ini; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen. `openclaw update status` dan `openclaw update --dry-run` tetap bersifat hanya baca.
</Note>

<Warning>
Downgrade memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.
</Warning>

## `update status`

Tampilkan kanal pembaruan aktif + tag/branch/SHA git (untuk checkout sumber), serta ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default 3 detik).

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah akan me-restart Gateway
setelah memperbarui (default adalah me-restart). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1800`)

## Yang dilakukan

Ketika Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → memilih npm dist-tag `beta`, tetapi kembali ke `latest` ketika beta
  tidak ada atau lebih lama daripada rilis stable saat ini.

Auto-updater core Gateway (ketika diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar handler permintaan Gateway langsung. Pembaruan package manager `update.run` bidang kontrol
memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah pertukaran paket,
karena proses Gateway lama mungkin masih memiliki chunk dalam memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk instalasi package manager, `openclaw update` menyelesaikan versi paket target
sebelum memanggil package manager. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw menginstal paket baru ke prefix npm sementara, memverifikasi inventaris
`dist` yang dipaketkan di sana, lalu menukar pohon paket bersih tersebut ke prefix
global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi plugin, dan
pekerjaan restart tidak berjalan dari pohon yang dicurigai. Bahkan ketika versi yang diinstal
sudah cocok dengan target, perintah menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi plugin, penyegaran penyelesaian perintah core, dan pekerjaan restart. Ini
menjaga sidecar yang dipaketkan dan catatan plugin milik kanal tetap selaras dengan
build OpenClaw yang diinstal sambil menyerahkan rebuild penyelesaian perintah plugin penuh ke
eksekusi `openclaw completion --write-state` eksplisit.

Ketika layanan Gateway terkelola lokal terinstal dan restart diaktifkan,
pembaruan package manager menghentikan layanan yang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari instalasi yang diperbarui, me-restart
layanan, dan memverifikasi bahwa Gateway yang direstart melaporkan versi yang diharapkan sebelum
melaporkan keberhasilan. Di macOS, pemeriksaan pascapembaruan juga memverifikasi bahwa LaunchAgent
dimuat/berjalan untuk profil aktif dan port loopback yang dikonfigurasi
sehat. Jika plist terinstal tetapi launchd tidak mengawasinya, OpenClaw
melakukan bootstrap ulang LaunchAgent secara otomatis, lalu menjalankan ulang
pemeriksaan kesiapan kesehatan/versi/kanal. Bootstrap baru memuat job RunAtLoad
secara langsung, sehingga pemulihan pembaruan tidak langsung menjalankan `kickstart -k` pada Gateway
yang baru dimunculkan. Jika Gateway masih tidak menjadi sehat, perintah keluar
non-zero dan mencetak path log restart serta instruksi restart, instal ulang, dan
rollback paket secara eksplisit. Dengan `--no-restart`,
penggantian paket tetap berjalan tetapi layanan terkelola tidak dihentikan atau
direstart, sehingga Gateway yang berjalan mungkin mempertahankan kode lama sampai Anda me-restart
secara manual.

## Alur checkout git

### Pemilihan kanal

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: pilih tag `-beta` terbaru, tetapi kembali ke tag stable terbaru ketika beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch dan rebase.

### Langkah pembaruan

<Steps>
  <Step title="Verifikasi worktree bersih">
    Memerlukan tidak ada perubahan yang belum di-commit.
  </Step>
  <Step title="Beralih kanal">
    Beralih ke kanal yang dipilih (tag atau branch).
  </Step>
  <Step title="Fetch upstream">
    Hanya dev.
  </Step>
  <Step title="Build preflight (khusus dev)">
    Menjalankan build TypeScript dalam worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan commit terbaru yang dapat di-build. Atur `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` untuk juga menjalankan lint selama preflight ini; lint berjalan dalam mode serial terbatas karena host pembaruan pengguna sering kali lebih kecil daripada runner CI.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (khusus dev).
  </Step>
  <Step title="Instal dependensi">
    Menggunakan package manager repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@10`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Mem-build gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan safe-update terakhir.
  </Step>
  <Step title="Sinkronkan plugin">
    Menyinkronkan plugin ke kanal aktif. Dev menggunakan plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi plugin yang dilacak.
  </Step>
</Steps>

Pada kanal pembaruan beta, instalasi plugin npm dan ClawHub yang dilacak dan mengikuti
baris default/latest mencoba rilis plugin `@beta` terlebih dahulu. Jika plugin tidak memiliki
rilis beta, OpenClaw kembali ke spesifikasi default/latest yang tercatat. Untuk plugin
npm, OpenClaw juga kembali ketika paket beta ada tetapi gagal validasi
instalasi. Versi persis dan tag eksplisit tidak ditulis ulang.

<Warning>
Jika pembaruan plugin npm yang dipin secara persis diselesaikan ke artefak yang integritasnya berbeda dari catatan instalasi yang tersimpan, `openclaw update` membatalkan pembaruan artefak plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi plugin pascapembaruan yang terbatas pada plugin terkelola dilaporkan sebagai peringatan setelah pembaruan core berhasil. Hasil JSON mempertahankan `status: "ok"` pembaruan tingkat atas dan melaporkan `postUpdate.plugins.status: "warning"` dengan panduan `openclaw doctor --fix` dan `openclaw plugins inspect <id> --runtime --json`. Pengecualian updater atau sinkronisasi yang tidak terduga tetap menggagalkan hasil pembaruan. Perbaiki instalasi plugin atau error pembaruan, lalu jalankan ulang `openclaw doctor --fix` atau `openclaw update`.

Ketika Gateway yang diperbarui dimulai, pemuatan plugin hanya verifikasi: startup tidak menjalankan package manager atau mengubah pohon dependensi. Restart `update.run` package manager melewati penundaan idle normal dan cooldown restart setelah pohon paket ditukar, sehingga proses lama tidak dapat terus melakukan lazy-loading chunk yang sudah dihapus.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan error khusus package manager alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
