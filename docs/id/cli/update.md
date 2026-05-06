---
read_when:
    - Anda ingin memperbarui checkout sumber dengan aman
    - Anda sedang men-debug keluaran atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-06T09:06:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara saluran stable/beta/dev.

Jika Anda memasang melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
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
- `--channel <stable|beta|dev>`: atur saluran pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur channel/tag/target/restart) tanpa menulis konfigurasi, memasang, menyinkronkan plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.warnings` saat plugin terkelola yang rusak atau tidak dapat dimuat memerlukan
  perbaikan setelah pembaruan inti berhasil, dan `postUpdate.plugins.integrityDrifts`
  saat pergeseran artefak plugin npm terdeteksi selama sinkronisasi plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default adalah 1800d).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi penurunan versi).

`openclaw update` tidak memiliki flag `--verbose`. Gunakan `--dry-run` untuk mempratinjau
tindakan channel/tag/install/restart yang direncanakan, `--json` untuk hasil yang
dapat dibaca mesin, dan `openclaw update status --json` saat Anda hanya memerlukan
detail saluran dan ketersediaan. Jika Anda men-debug log Gateway seputar pembaruan,
verbositas konsol dan level log file terpisah: Gateway `--verbose` memengaruhi
keluaran terminal/WebSocket, sedangkan log file memerlukan `logging.level: "debug"` atau
`"trace"` dalam konfigurasi. Lihat [Logging Gateway](/id/gateway/logging).

<Warning>
Penurunan versi memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.
</Warning>

## `update status`

Tampilkan saluran pembaruan aktif + tag/branch/SHA git (untuk checkout sumber), serta ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default adalah 3d).

## `update wizard`

Alur interaktif untuk memilih saluran pembaruan dan mengonfirmasi apakah akan memulai ulang Gateway
setelah memperbarui (default adalah memulai ulang). Jika Anda memilih `dev` tanpa checkout git,
alur ini menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1800`)

## Yang dilakukan

Saat Anda beralih saluran secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan memasang CLI global dari checkout tersebut.
- `stable` → memasang dari npm menggunakan `latest`.
- `beta` → mengutamakan dist-tag npm `beta`, tetapi beralih ke `latest` saat beta
  hilang atau lebih lama daripada rilis stable saat ini.

Pembaru otomatis inti Gateway (saat diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar penangan permintaan Gateway langsung. Pembaruan manajer paket control-plane `update.run`
memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah penukaran paket,
karena proses Gateway lama mungkin masih memiliki chunk dalam memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk instalasi manajer paket, `openclaw update` menyelesaikan versi paket target
sebelum memanggil manajer paket. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw memasang paket baru ke prefix npm sementara, memverifikasi inventaris
`dist` yang dipaketkan di sana, lalu menukar pohon paket bersih tersebut ke
prefix global yang sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi plugin, dan
pekerjaan restart tidak berjalan dari pohon yang dicurigai. Bahkan saat versi terpasang
sudah cocok dengan target, perintah menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi plugin, penyegaran penyelesaian perintah inti, dan pekerjaan restart. Ini
menjaga sidecar yang dipaketkan dan catatan plugin milik saluran tetap selaras dengan
build OpenClaw yang terpasang sambil menyerahkan rebuild penyelesaian perintah plugin penuh ke
jalankan eksplisit `openclaw completion --write-state`.

Saat layanan Gateway terkelola lokal terpasang dan restart diaktifkan,
pembaruan manajer paket menghentikan layanan yang berjalan sebelum mengganti pohon
paket, lalu menyegarkan metadata layanan dari instalasi yang diperbarui, memulai ulang
layanan, dan memverifikasi Gateway yang dimulai ulang melaporkan versi yang diharapkan sebelum
melaporkan keberhasilan. Di macOS, pemeriksaan pascapembaruan juga memverifikasi LaunchAgent
dimuat/berjalan untuk profil aktif dan port loopback yang dikonfigurasi
sehat. Jika plist terpasang tetapi launchd tidak mengawasinya, OpenClaw
melakukan bootstrap ulang LaunchAgent secara otomatis, lalu menjalankan ulang
pemeriksaan kesiapan kesehatan/versi/saluran. Bootstrap baru memuat job RunAtLoad
secara langsung, sehingga pemulihan pembaruan tidak langsung menjalankan `kickstart -k` pada Gateway
yang baru dibuat. Jika Gateway tetap tidak sehat, perintah keluar
non-nol dan mencetak jalur log restart plus instruksi restart, instal ulang, dan
rollback paket secara eksplisit. Dengan `--no-restart`,
penggantian paket tetap berjalan tetapi layanan terkelola tidak dihentikan atau
dimulai ulang, sehingga Gateway yang berjalan mungkin tetap memakai kode lama sampai Anda memulainya ulang
secara manual.

## Alur checkout git

### Pemilihan saluran

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi beralih ke tag stable terbaru saat beta hilang atau lebih lama.
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
  <Step title="Build preflight (khusus dev)">
    Menjalankan build TypeScript di worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan commit terbaru yang dapat di-build. Atur `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` untuk juga menjalankan lint selama preflight ini; lint berjalan dalam mode serial terbatas karena host pembaruan pengguna sering kali lebih kecil daripada runner CI.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (khusus dev).
  </Step>
  <Step title="Pasang dependensi">
    Menggunakan manajer paket repo. Untuk checkout pnpm, pembaru melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@10`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Mem-build gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan pembaruan aman terakhir.
  </Step>
  <Step title="Sinkronkan plugin">
    Menyinkronkan plugin ke saluran aktif. Dev menggunakan plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi plugin yang dilacak.
  </Step>
</Steps>

Pada saluran pembaruan beta, instalasi plugin npm dan ClawHub yang dilacak yang mengikuti
baris default/latest akan mencoba rilis plugin `@beta` terlebih dahulu. Jika plugin tidak memiliki
rilis beta, OpenClaw beralih ke spec default/latest yang tercatat. Untuk plugin npm,
OpenClaw juga beralih saat paket beta ada tetapi gagal dalam validasi instalasi.
Versi tepat dan tag eksplisit tidak ditulis ulang.

<Warning>
Jika pembaruan plugin npm yang dipin secara tepat diselesaikan ke artefak yang integritasnya berbeda dari catatan instalasi yang tersimpan, `openclaw update` membatalkan pembaruan artefak plugin tersebut alih-alih memasangnya. Instal ulang atau perbarui plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi plugin pascapembaruan yang cakupannya terbatas pada plugin terkelola dilaporkan sebagai peringatan setelah pembaruan inti berhasil. Hasil JSON mempertahankan `status: "ok"` pembaruan tingkat atas dan melaporkan `postUpdate.plugins.status: "warning"` dengan panduan `openclaw doctor --fix` dan `openclaw plugins inspect <id> --runtime --json`. Pengecualian pembaru atau sinkronisasi yang tidak terduga tetap menggagalkan hasil pembaruan. Perbaiki instalasi plugin atau kesalahan pembaruan, lalu jalankan ulang `openclaw doctor --fix` atau `openclaw update`.

Saat Gateway yang diperbarui dimulai, pemuatan plugin bersifat hanya verifikasi: startup tidak menjalankan manajer paket atau memutasi pohon dependensi. Restart `update.run` manajer paket melewati penundaan idle normal dan cooldown restart setelah pohon paket ditukar, sehingga proses lama tidak dapat terus melakukan lazy-loading chunk yang telah dihapus.

Jika bootstrap pnpm tetap gagal, pembaru berhenti lebih awal dengan kesalahan khusus manajer paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip peluncur).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan update terlebih dahulu pada checkout git)
- [Saluran pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
