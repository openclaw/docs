---
read_when:
    - Anda ingin memperbarui checkout sumber dengan aman
    - Anda sedang men-debug output atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang cukup aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-06-27T17:22:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
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
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Opsi

- `--no-restart`: lewati memulai ulang layanan Gateway setelah pembaruan berhasil. Pembaruan manajer paket yang memang memulai ulang Gateway memverifikasi bahwa layanan yang dimulai ulang melaporkan versi terbaru yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: tetapkan kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`; spesifikasi sumber GitHub/git dikemas ke tarball sementara sebelum instalasi npm global bertahap.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/restart) tanpa menulis konfigurasi, menginstal, menyinkronkan Plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.warnings` ketika Plugin terkelola yang rusak atau tidak dapat dimuat perlu
  diperbaiki setelah pembaruan inti berhasil, detail fallback Plugin kanal beta
  ketika Plugin tidak memiliki rilis beta, dan `postUpdate.plugins.integrityDrifts`
  ketika pergeseran artefak Plugin npm terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: timeout per langkah (default 1800d).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).
- `--acknowledge-clawhub-risk`: setelah meninjau peringatan kepercayaan ClawHub komunitas,
  izinkan sinkronisasi Plugin pascapembaruan untuk berlanjut tanpa prompt
  interaktif. Tanpa ini, rilis Plugin ClawHub komunitas yang berisiko dilewati dan
  dibiarkan tidak berubah ketika OpenClaw tidak dapat menampilkan prompt. Paket ClawHub resmi dan
  sumber Plugin OpenClaw bawaan melewati prompt kepercayaan rilis ini.

`openclaw update` tidak memiliki flag `--verbose`. Gunakan `--dry-run` untuk mempratinjau
tindakan kanal/tag/instal/restart yang direncanakan, `--json` untuk hasil yang dapat dibaca
mesin, dan `openclaw update status --json` ketika Anda hanya membutuhkan detail kanal dan
ketersediaan. Jika Anda men-debug log Gateway seputar pembaruan,
verbositas konsol dan level log berkas terpisah: Gateway `--verbose` memengaruhi
keluaran terminal/WebSocket, sedangkan log berkas memerlukan `logging.level: "debug"` atau
`"trace"` dalam konfigurasi. Lihat [logging Gateway](/id/gateway/logging).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), proses `openclaw update` yang memutasi dinonaktifkan. Perbarui sumber Nix atau input flake untuk instalasi ini sebagai gantinya; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen. `openclaw update status` dan `openclaw update --dry-run` tetap hanya-baca.
</Note>

<Warning>
Downgrade memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.
</Warning>

## `update status`

Tampilkan kanal pembaruan aktif + tag/branch/SHA git (untuk checkout sumber), plus ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: timeout untuk pemeriksaan (default 3d).

## `update repair`

Jalankan ulang finalisasi pembaruan setelah paket inti sudah berubah tetapi pekerjaan
perbaikan berikutnya tidak selesai dengan bersih. Ini adalah jalur pemulihan yang didukung ketika
`openclaw update` menginstal paket inti baru tetapi sinkronisasi Plugin pasca-inti,
metadata Plugin npm terkelola, penyegaran registry, atau perbaikan doctor masih perlu
mencapai konvergensi.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Opsi:

- `--channel <stable|beta|dev>`: simpan kanal pembaruan sebelum perbaikan dan
  jalankan konvergensi Plugin terhadap kanal tersebut.
- `--json`: cetak JSON finalisasi yang dapat dibaca mesin.
- `--timeout <seconds>`: timeout untuk langkah perbaikan (default `1800`).
- `--yes`: lewati prompt konfirmasi.
- `--acknowledge-clawhub-risk`: setelah meninjau peringatan kepercayaan ClawHub komunitas,
  izinkan konvergensi Plugin saat perbaikan untuk berlanjut tanpa prompt
  interaktif. Paket ClawHub resmi dan sumber Plugin OpenClaw bawaan
  melewati prompt kepercayaan rilis ini.
- `--no-restart`: diterima demi kesetaraan dengan perintah update; perbaikan tidak pernah memulai ulang
  Gateway.

`openclaw update repair` menjalankan `openclaw doctor --fix`, memuat ulang konfigurasi yang diperbaiki
dan catatan instalasi, menyinkronkan Plugin terlacak untuk kanal pembaruan aktif,
memperbarui instalasi Plugin npm terkelola, memperbaiki payload Plugin terkonfigurasi yang hilang,
menyegarkan registry Plugin, dan menulis metadata catatan instalasi yang telah konvergen.
Ini tidak menginstal paket inti baru dan tidak memulai ulang Gateway.

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah akan memulai ulang Gateway
setelah memperbarui (default-nya memulai ulang). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: timeout untuk setiap langkah pembaruan (default `1800`)

## Apa yang dilakukan

Ketika Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan checkout git (default: `~/openclaw`, atau `$OPENCLAW_HOME/openclaw` ketika
  `OPENCLAW_HOME` diatur; timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → mengutamakan dist-tag npm `beta`, tetapi fallback ke `latest` ketika beta
  hilang atau lebih lama dari rilis stable saat ini.

Auto-updater inti Gateway (ketika diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar handler permintaan Gateway yang sedang berjalan. Pembaruan manajer paket
`update.run` control-plane dan pembaruan checkout git yang diawasi juga menggunakan
handoff layanan terkelola alih-alih mengganti pohon paket atau membangun ulang
`dist/` di dalam proses Gateway yang sedang berjalan. Gateway memulai helper terlepas,
keluar, dan helper menjalankan jalur CLI normal `openclaw update --yes --json`
dari luar pohon proses Gateway. Jika handoff itu tidak tersedia,
`update.run` mengembalikan respons terstruktur dengan perintah shell aman untuk dijalankan
secara manual.

Untuk instalasi manajer paket, `openclaw update` menyelesaikan versi paket target
sebelum memanggil manajer paket. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw menginstal paket baru ke prefix npm sementara, memverifikasi
inventaris `dist` yang dikemas di sana, lalu menukar pohon paket bersih itu ke
prefix global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi Plugin, dan
pekerjaan restart tidak dijalankan dari pohon yang dicurigai. Bahkan ketika versi terinstal
sudah cocok dengan target, perintah menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi Plugin, penyegaran penyelesaian perintah inti, dan pekerjaan restart. Ini
menjaga sidecar yang dikemas dan catatan Plugin milik kanal tetap selaras dengan build
OpenClaw yang terinstal sambil menyerahkan pembangunan ulang penyelesaian perintah Plugin penuh kepada
proses eksplisit `openclaw completion --write-state`.

Ketika layanan Gateway terkelola lokal terinstal dan restart diaktifkan,
pembaruan manajer paket dan checkout git menghentikan layanan yang berjalan sebelum
mengganti pohon paket atau memutasi keluaran checkout/build. Updater
kemudian menyegarkan metadata layanan dari instalasi yang diperbarui, memulai ulang
layanan, dan memverifikasi Gateway yang dimulai ulang sebelum melaporkan
`Gateway: restarted and verified.`. Pembaruan manajer paket juga memverifikasi
bahwa Gateway yang dimulai ulang melaporkan versi paket yang diharapkan; pembaruan checkout git
memverifikasi kesehatan gateway dan kesiapan layanan setelah rebuild. Di macOS,
pemeriksaan pascapembaruan juga memverifikasi bahwa LaunchAgent dimuat/berjalan untuk profil
aktif dan port loopback terkonfigurasi sehat. Jika plist terinstal
tetapi launchd tidak mengawasinya, OpenClaw melakukan bootstrap ulang LaunchAgent
secara otomatis, lalu menjalankan ulang pemeriksaan kesiapan kesehatan/versi/kanal. Bootstrap baru
memuat job RunAtLoad secara langsung, sehingga pemulihan pembaruan tidak
langsung menjalankan `kickstart -k` pada Gateway yang baru muncul. Jika Gateway masih tidak
menjadi sehat, perintah keluar non-zero dan mencetak jalur log restart
plus instruksi restart, instal ulang, dan rollback paket secara eksplisit. Jika restart
tidak dapat berjalan, perintah mencetak `Gateway: restart skipped (...)` atau
`Gateway: restart failed: ...` dengan petunjuk manual `openclaw gateway restart`.
Dengan `--no-restart`, penggantian paket atau rebuild git tetap berjalan tetapi
layanan terkelola tidak dihentikan atau dimulai ulang, sehingga Gateway yang berjalan mungkin tetap memakai kode lama
hingga Anda memulai ulangnya secara manual.

### Bentuk respons control-plane

Ketika `update.run` dipanggil melalui control plane Gateway pada
instalasi manajer paket atau checkout git yang diawasi, handler melaporkan
inisiasi handoff secara terpisah dari pembaruan CLI yang berlanjut setelah
Gateway keluar:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, dan
  `handoff.status: "started"` berarti Gateway membuat handoff layanan terkelola
  dan menjadwalkan restart-nya sendiri sehingga helper terlepas dapat menjalankan
  `openclaw update --yes --json` di luar proses layanan yang sedang berjalan.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, dan
  `handoff.status: "unavailable"` berarti OpenClaw tidak dapat menemukan batas
  layanan pengawas dan identitas layanan tahan lama untuk handoff yang aman. Sebagai
  contoh, handoff systemd memerlukan identitas unit OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`), bukan hanya marker proses systemd sekitar. Respons
  mencakup `handoff.command`, perintah shell untuk dijalankan dari luar
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` berarti
  Gateway mencoba membuat handoff tetapi tidak dapat memunculkan helper terlepas.

Payload `sentinel` tetap ditulis sebelum Gateway keluar, dan handoff CLI
memperbarui sentinel restart yang sama setelah pemeriksaan kesehatan restart layanan
selesai. Selama handoff, sentinel dapat membawa
`stats.reason: "restart-health-pending"` tanpa kelanjutan sukses; Gateway
yang dimulai ulang terus melakukan polling terhadapnya dan hanya menjalankan kelanjutan setelah CLI
memverifikasi kesehatan layanan dan menulis ulang sentinel dengan hasil akhir `ok`.
`openclaw status` dan `openclaw status --all` menampilkan baris `Update restart`
selama sentinel itu pending atau gagal, dan `update.status` menyegarkan dan
mengembalikan sentinel terbaru.

## Alur checkout git

### Pemilihan kanal

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi fallback ke tag stable terbaru ketika beta hilang atau lebih lama.
- `dev`: checkout `main`, lalu fetch dan rebase.

### Langkah pembaruan

<Steps>
  <Step title="Verifikasi worktree bersih">
    Memerlukan tidak ada perubahan yang belum di-commit.
  </Step>
  <Step title="Ganti kanal">
    Beralih ke kanal yang dipilih (tag atau branch).
  </Step>
  <Step title="Ambil upstream">
    Hanya dev.
  </Step>
  <Step title="Build preflight (hanya dev)">
    Menjalankan build TypeScript di worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan commit terbaru yang dapat di-build. Atur `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` untuk juga menjalankan lint selama preflight ini; lint berjalan dalam mode serial terbatas karena host pembaruan pengguna sering kali lebih kecil daripada runner CI.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (hanya dev).
  </Step>
  <Step title="Instal dependensi">
    Menggunakan manajer paket repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@11`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Mem-build gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan akhir pembaruan aman.
  </Step>
  <Step title="Sinkronkan plugin">
    Menyinkronkan plugin ke kanal aktif. Dev menggunakan plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi plugin yang dilacak.
  </Step>
</Steps>

Pada kanal pembaruan beta, instalasi plugin npm dan ClawHub terlacak yang mengikuti
jalur default/latest mencoba rilis plugin `@beta` terlebih dahulu. Jika plugin tidak memiliki
rilis beta, OpenClaw kembali ke spesifikasi default/latest yang tercatat dan melaporkannya
sebagai peringatan. Untuk plugin npm, OpenClaw juga melakukan fallback ketika paket beta
ada tetapi gagal validasi instalasi. Peringatan fallback plugin ini tidak
membuat pembaruan inti gagal. Versi persis dan tag eksplisit tidak
ditulis ulang.

<Warning>
Jika pembaruan plugin npm yang dipin persis menghasilkan artefak dengan integritas yang berbeda dari catatan instalasi tersimpan, `openclaw update` membatalkan pembaruan artefak plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi plugin pascapembaruan yang terbatas pada plugin terkelola dan dapat dilewati oleh jalur sinkronisasi (misalnya registry npm yang tidak dapat dijangkau untuk plugin yang tidak esensial) dilaporkan sebagai peringatan setelah pembaruan inti berhasil. Hasil JSON mempertahankan `status: "ok"` pembaruan tingkat atas dan melaporkan `postUpdate.plugins.status: "warning"` dengan panduan `openclaw update repair` dan `openclaw plugins inspect <id> --runtime --json`. Exception updater atau sinkronisasi yang tidak terduga tetap menggagalkan hasil pembaruan. Perbaiki instalasi plugin atau kesalahan pembaruan, lalu jalankan ulang `openclaw update repair`.

Setelah langkah sinkronisasi per plugin, `openclaw update` menjalankan pass wajib **konvergensi pasca-inti** sebelum gateway dimulai ulang: pass ini memperbaiki payload plugin terkonfigurasi yang hilang, memvalidasi setiap catatan instalasi terlacak yang _aktif_ di disk, dan memverifikasi secara statis bahwa `package.json` dapat di-parse (dan `main` apa pun yang dideklarasikan secara eksplisit ada). Kegagalan dari pass ini — dan snapshot konfigurasi OpenClaw yang tidak valid — mengembalikan `postUpdate.plugins.status: "error"` dan mengubah `status` pembaruan tingkat atas menjadi `"error"`, sehingga `openclaw update` keluar non-nol dan gateway _tidak_ dimulai ulang dengan set plugin yang belum diverifikasi. Kesalahan menyertakan baris `postUpdate.plugins.warnings[].guidance` terstruktur yang mengarah ke `openclaw update repair` dan `openclaw plugins inspect <id> --runtime --json` untuk tindak lanjut. Entri plugin yang dinonaktifkan dan catatan yang bukan target sinkronisasi resmi tertaut sumber tepercaya dilewati di sini, mencerminkan kebijakan `skipDisabledPlugins` yang digunakan oleh pemeriksaan payload hilang, sehingga catatan plugin dinonaktifkan yang usang tidak dapat memblokir pembaruan yang selain itu valid.

Saat Gateway yang diperbarui mulai, pemuatan plugin hanya verifikasi: startup tidak
menjalankan manajer paket atau memutasi pohon dependensi. Restart `update.run`
manajer paket diserahkan ke jalur layanan terkelola CLI, sehingga pertukaran paket terjadi
di luar proses Gateway lama dan pemeriksaan kesehatan layanan menentukan apakah
pembaruan dapat dilaporkan selesai.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan kesalahan khusus manajer paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
