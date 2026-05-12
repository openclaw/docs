---
read_when:
    - Anda ingin memperbarui checkout sumber dengan aman
    - Anda sedang men-debug keluaran atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-12T08:45:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93244af800aaa53c55a52f9593a7727910aa91acac9d1e34e89c39a95b133461
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara kanal stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan terjadi melalui alur pengelola paket di [Memperbarui](/id/install/updating).

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

- `--no-restart`: lewati restart layanan Gateway setelah pembaruan berhasil. Pembaruan pengelola paket yang me-restart Gateway memverifikasi bahwa layanan yang direstart melaporkan versi terbaru yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: tetapkan kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/restart) tanpa menulis konfigurasi, menginstal, menyinkronkan plugin, atau me-restart.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.warnings` saat plugin terkelola yang rusak atau tidak dapat dimuat perlu
  diperbaiki setelah pembaruan core berhasil, detail fallback plugin kanal beta
  saat plugin tidak memiliki rilis beta, dan `postUpdate.plugins.integrityDrifts`
  saat drift artefak plugin npm terdeteksi selama sinkronisasi plugin pascapembaruan.
- `--timeout <seconds>`: timeout per langkah (default 1800 dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

`openclaw update` tidak memiliki flag `--verbose`. Gunakan `--dry-run` untuk mempratinjau
tindakan kanal/tag/instal/restart yang direncanakan, `--json` untuk hasil yang
dapat dibaca mesin, dan `openclaw update status --json` saat Anda hanya memerlukan detail kanal dan
ketersediaan. Jika Anda men-debug log Gateway seputar pembaruan,
verbosity konsol dan level log file terpisah: Gateway `--verbose` memengaruhi
output terminal/WebSocket, sementara log file memerlukan `logging.level: "debug"` atau
`"trace"` dalam konfigurasi. Lihat [logging Gateway](/id/gateway/logging).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), eksekusi `openclaw update` yang mengubah state dinonaktifkan. Perbarui sumber Nix atau input flake untuk instalasi ini sebagai gantinya; untuk nix-openclaw, gunakan [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agent. `openclaw update status` dan `openclaw update --dry-run` tetap hanya-baca.
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

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah akan me-restart Gateway
setelah memperbarui (default-nya adalah restart). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: timeout untuk setiap langkah pembaruan (default `1800`)

## Yang dilakukan

Saat Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan ada checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → mengutamakan dist-tag npm `beta`, tetapi fallback ke `latest` saat beta
  hilang atau lebih lama daripada rilis stable saat ini.

Auto-updater core Gateway (saat diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar handler permintaan Gateway yang sedang berjalan. Pembaruan pengelola paket
control-plane `update.run` memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah pertukaran paket,
karena proses Gateway lama mungkin masih memiliki chunk dalam memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk instalasi pengelola paket, `openclaw update` menyelesaikan versi paket
target sebelum memanggil pengelola paket. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw menginstal paket baru ke prefix npm sementara, memverifikasi
inventaris `dist` yang dipaketkan di sana, lalu menukar pohon paket bersih tersebut ke
prefix global yang sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi plugin, dan
pekerjaan restart tidak berjalan dari pohon yang dicurigai. Bahkan saat versi terinstal
sudah cocok dengan target, perintah menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi plugin, penyegaran penyelesaian perintah core, dan pekerjaan restart. Ini
menjaga sidecar yang dipaketkan dan record plugin milik kanal tetap selaras dengan
build OpenClaw yang terinstal sekaligus menyerahkan pembangunan ulang penyelesaian perintah plugin penuh ke
eksekusi eksplisit `openclaw completion --write-state`.

Saat layanan Gateway terkelola lokal terinstal dan restart diaktifkan,
pembaruan pengelola paket menghentikan layanan yang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari instalasi yang diperbarui, me-restart
layanan, dan memverifikasi Gateway yang direstart melaporkan versi yang diharapkan sebelum
melaporkan keberhasilan. Di macOS, pemeriksaan pascapembaruan juga memverifikasi bahwa LaunchAgent
dimuat/berjalan untuk profil aktif dan port loopback yang dikonfigurasi
sehat. Jika plist terinstal tetapi launchd tidak mengawasinya, OpenClaw
melakukan bootstrap ulang LaunchAgent secara otomatis, lalu menjalankan ulang
pemeriksaan kesiapan kesehatan/versi/kanal. Bootstrap baru memuat job RunAtLoad
secara langsung, sehingga pemulihan pembaruan tidak langsung menjalankan `kickstart -k` pada Gateway
yang baru dimunculkan. Jika Gateway masih tidak menjadi sehat, perintah keluar
non-zero dan mencetak path log restart serta instruksi restart, instal ulang, dan
rollback paket yang eksplisit. Dengan `--no-restart`,
penggantian paket tetap berjalan tetapi layanan terkelola tidak dihentikan atau
direstart, sehingga Gateway yang berjalan mungkin tetap menggunakan kode lama hingga Anda me-restart-nya
secara manual.

## Alur checkout git

### Pemilihan kanal

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi fallback ke tag stable terbaru saat beta hilang atau lebih lama.
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
    Khusus dev.
  </Step>
  <Step title="Build preflight (khusus dev)">
    Menjalankan build TypeScript di worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan commit terbaru yang dapat di-build. Tetapkan `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` untuk juga menjalankan lint selama preflight ini; lint berjalan dalam mode serial terbatas karena host pembaruan pengguna sering kali lebih kecil daripada runner CI.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (khusus dev).
  </Step>
  <Step title="Instal dependensi">
    Menggunakan pengelola paket repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@11`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Mem-build gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan pembaruan aman terakhir.
  </Step>
  <Step title="Sinkronkan plugin">
    Menyinkronkan plugin ke kanal aktif. Dev menggunakan plugin yang dibundel; stable dan beta menggunakan npm. Memperbarui instalasi plugin yang dilacak.
  </Step>
</Steps>

Pada kanal pembaruan beta, instalasi plugin npm dan ClawHub yang dilacak yang mengikuti
baris default/latest mencoba rilis plugin `@beta` terlebih dahulu. Jika plugin tidak memiliki
rilis beta, OpenClaw fallback ke spec default/latest yang direkam dan melaporkan
hal itu sebagai peringatan. Untuk plugin npm, OpenClaw juga fallback saat paket
beta ada tetapi gagal validasi instalasi. Peringatan fallback plugin ini tidak
membuat pembaruan core gagal. Versi persis dan tag eksplisit tidak
ditulis ulang.

<Warning>
Jika pembaruan plugin npm yang dipin persis diselesaikan ke artefak yang integritasnya berbeda dari record instalasi tersimpan, `openclaw update` membatalkan pembaruan artefak plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi plugin pascapembaruan yang terbatas pada plugin terkelola dan yang dapat dilewati oleh jalur sinkronisasi (misalnya registry npm yang tidak dapat dijangkau untuk plugin non-esensial) dilaporkan sebagai peringatan setelah pembaruan core berhasil. Hasil JSON mempertahankan `status: "ok"` pembaruan tingkat atas dan melaporkan `postUpdate.plugins.status: "warning"` dengan panduan `openclaw doctor --fix` dan `openclaw plugins inspect <id> --runtime --json`. Exception updater atau sinkronisasi yang tidak terduga tetap menggagalkan hasil pembaruan. Perbaiki instalasi plugin atau error pembaruan, lalu jalankan ulang `openclaw doctor --fix` atau `openclaw update`.

Setelah langkah sinkronisasi per-plugin, `openclaw update` menjalankan pass **konvergensi pasca-core** wajib sebelum gateway direstart: pass ini memperbaiki payload plugin terkonfigurasi yang hilang, memvalidasi setiap record instalasi terlacak yang _aktif_ di disk, dan secara statis memverifikasi bahwa `package.json`-nya dapat di-parse (dan `main` yang dideklarasikan secara eksplisit ada). Kegagalan dari pass ini — dan snapshot konfigurasi OpenClaw yang tidak valid — mengembalikan `postUpdate.plugins.status: "error"` dan mengubah `status` pembaruan tingkat atas menjadi `"error"`, sehingga `openclaw update` keluar non-zero dan gateway _tidak_ direstart dengan set plugin yang belum diverifikasi. Error tersebut menyertakan baris `postUpdate.plugins.warnings[].guidance` terstruktur yang menunjuk ke `openclaw doctor --fix` dan `openclaw plugins inspect <id> --runtime --json` untuk tindak lanjut. Entri plugin yang dinonaktifkan dan record yang bukan target sinkronisasi resmi yang tertaut sumber tepercaya dilewati di sini, mencerminkan kebijakan `skipDisabledPlugins` yang digunakan oleh pemeriksaan payload hilang, sehingga record plugin nonaktif yang usang tidak dapat memblokir pembaruan yang selebihnya valid.

Saat Gateway yang diperbarui dimulai, pemuatan plugin bersifat hanya-verifikasi: startup tidak menjalankan pengelola paket atau mengubah pohon dependensi. Restart `update.run` pengelola paket melewati penundaan idle dan cooldown restart normal setelah pohon paket ditukar, sehingga proses lama tidak dapat terus lazy-load chunk yang telah dihapus.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan error khusus pengelola paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan update terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
