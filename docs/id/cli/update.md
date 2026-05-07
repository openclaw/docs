---
read_when:
    - Anda ingin memperbarui checkout kode sumber dengan aman
    - Anda sedang melakukan debug pada output atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + restart otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-07T01:51:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara kanal stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan berlangsung melalui alur manajer paket di [Memperbarui](/id/install/updating).

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
- `--channel <stable|beta|dev>`: atur kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/mulai ulang) tanpa menulis konfigurasi, menginstal, menyinkronkan Plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.warnings` ketika Plugin terkelola yang rusak atau tidak dapat dimuat memerlukan
  perbaikan setelah pembaruan inti berhasil, dan `postUpdate.plugins.integrityDrifts`
  ketika pergeseran artefak Plugin npm terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default 1800d).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

`openclaw update` tidak memiliki flag `--verbose`. Gunakan `--dry-run` untuk mempratinjau
tindakan kanal/tag/instal/mulai ulang yang direncanakan, `--json` untuk hasil yang dapat
dibaca mesin, dan `openclaw update status --json` saat Anda hanya memerlukan detail kanal dan
ketersediaan. Jika Anda men-debug log Gateway di sekitar pembaruan,
verbositas konsol dan level log file terpisah: Gateway `--verbose` memengaruhi
keluaran terminal/WebSocket, sementara log file memerlukan `logging.level: "debug"` atau
`"trace"` dalam konfigurasi. Lihat [logging Gateway](/id/gateway/logging).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), proses `openclaw update` yang memutasi dinonaktifkan. Perbarui sumber Nix atau input flake untuk instalasi ini sebagai gantinya; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen. `openclaw update status` dan `openclaw update --dry-run` tetap hanya-baca.
</Note>

<Warning>
Downgrade memerlukan konfirmasi karena versi yang lebih lama dapat merusak konfigurasi.
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
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default 3d).

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah akan memulai ulang Gateway
setelah memperbarui (default-nya adalah memulai ulang). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1800`)

## Apa yang dilakukannya

Saat Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → mengutamakan dist-tag npm `beta`, tetapi fallback ke `latest` saat beta
  hilang atau lebih lama daripada rilis stable saat ini.

OpenClaw belum memiliki kanal dukungan LTS atau bulanan. Kami sedang bekerja
menuju lini dukungan bulanan, tetapi `--channel` saat ini hanya menerima
`stable`, `beta`, dan `dev`. Gunakan `--tag <version-or-dist-tag>` untuk target
sekali pakai saat Anda memerlukan artefak paket tertentu.

Pembaruan otomatis inti Gateway (ketika diaktifkan melalui konfigurasi) menjalankan jalur pembaruan CLI
di luar handler permintaan Gateway langsung. Pembaruan manajer paket `update.run`
pada bidang kontrol memaksa mulai ulang pembaruan tanpa penundaan dan tanpa cooldown setelah penukaran paket,
karena proses Gateway lama mungkin masih memiliki potongan dalam memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk instalasi manajer paket, `openclaw update` menyelesaikan versi paket
target sebelum memanggil manajer paket. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw menginstal paket baru ke prefix npm sementara, memverifikasi
inventaris `dist` terpaket di sana, lalu menukar pohon paket bersih tersebut ke
prefix global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi Plugin, dan
pekerjaan mulai ulang tidak berjalan dari pohon yang dicurigai. Bahkan ketika versi yang terinstal
sudah cocok dengan target, perintah menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi Plugin, penyegaran penyelesaian perintah inti, dan pekerjaan mulai ulang. Ini
menjaga sidecar terpaket dan catatan Plugin milik kanal tetap selaras dengan
build OpenClaw yang terinstal sambil menyerahkan pembangunan ulang penyelesaian perintah Plugin penuh ke
proses eksplisit `openclaw completion --write-state`.

Ketika layanan Gateway terkelola lokal terinstal dan mulai ulang diaktifkan,
pembaruan manajer paket menghentikan layanan yang sedang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari instalasi yang diperbarui, memulai ulang
layanan, dan memverifikasi Gateway yang dimulai ulang melaporkan versi yang diharapkan sebelum
melaporkan keberhasilan. Di macOS, pemeriksaan pascapembaruan juga memverifikasi LaunchAgent
dimuat/berjalan untuk profil aktif dan port loopback yang dikonfigurasi
sehat. Jika plist terinstal tetapi launchd tidak mengawasinya, OpenClaw
melakukan bootstrap ulang LaunchAgent secara otomatis, lalu menjalankan kembali
pemeriksaan kesiapan kesehatan/versi/kanal. Bootstrap baru memuat job RunAtLoad
secara langsung, sehingga pemulihan pembaruan tidak langsung menjalankan `kickstart -k` pada Gateway
yang baru dibuat. Jika Gateway masih tidak menjadi sehat, perintah keluar
dengan status non-nol dan mencetak jalur log mulai ulang serta instruksi mulai ulang, instal ulang, dan
rollback paket yang eksplisit. Dengan `--no-restart`,
penggantian paket tetap berjalan tetapi layanan terkelola tidak dihentikan atau
dimulai ulang, sehingga Gateway yang berjalan dapat tetap memakai kode lama sampai Anda memulai ulang
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
    Hanya dev.
  </Step>
  <Step title="Build preflight (hanya dev)">
    Menjalankan build TypeScript di worktree sementara. Jika tip gagal, mundur hingga 10 commit untuk menemukan commit terbaru yang dapat dibuild. Atur `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` untuk juga menjalankan lint selama preflight ini; lint berjalan dalam mode serial terbatas karena host pembaruan pengguna sering kali lebih kecil daripada runner CI.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (hanya dev).
  </Step>
  <Step title="Instal dependensi">
    Menggunakan manajer paket repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback `npm install pnpm@10` sementara) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build UI Kontrol">
    Membangun gateway dan UI Kontrol.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan pembaruan aman terakhir.
  </Step>
  <Step title="Sinkronkan Plugin">
    Menyinkronkan Plugin ke kanal aktif. Dev menggunakan Plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi Plugin yang dilacak.
  </Step>
</Steps>

Pada kanal pembaruan beta, instalasi Plugin npm dan ClawHub yang dilacak yang mengikuti
lini default/latest mencoba rilis Plugin `@beta` terlebih dahulu. Jika Plugin tidak memiliki
rilis beta, OpenClaw fallback ke spec default/latest yang tercatat. Untuk Plugin npm,
OpenClaw juga fallback ketika paket beta ada tetapi gagal validasi instalasi.
Versi eksak dan tag eksplisit tidak ditulis ulang.

<Warning>
Jika pembaruan Plugin npm yang dipin secara eksak terselesaikan ke artefak yang integritasnya berbeda dari catatan instalasi tersimpan, `openclaw update` membatalkan pembaruan artefak Plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui Plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi Plugin pascapembaruan yang terbatas pada Plugin terkelola dilaporkan sebagai peringatan setelah pembaruan inti berhasil. Hasil JSON mempertahankan `status: "ok"` pada pembaruan level atas dan melaporkan `postUpdate.plugins.status: "warning"` dengan panduan `openclaw doctor --fix` dan `openclaw plugins inspect <id> --runtime --json`. Pengecualian updater atau sinkronisasi yang tidak terduga tetap menggagalkan hasil pembaruan. Perbaiki instalasi Plugin atau galat pembaruan, lalu jalankan kembali `openclaw doctor --fix` atau `openclaw update`.

Saat Gateway yang diperbarui dimulai, pemuatan Plugin hanya verifikasi: startup tidak menjalankan manajer paket atau memutasi pohon dependensi. Mulai ulang `update.run` manajer paket melewati penundaan idle normal dan cooldown mulai ulang setelah pohon paket ditukar, sehingga proses lama tidak dapat terus memuat lambat potongan yang sudah dihapus.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan galat khusus manajer paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
