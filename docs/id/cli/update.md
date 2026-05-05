---
read_when:
    - Anda ingin memperbarui checkout kode sumber dengan aman
    - Anda sedang menelusuri kesalahan pada keluaran atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-05T01:45:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara kanal stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan dilakukan melalui alur pengelola paket di [Memperbarui](/id/install/updating).

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

- `--no-restart`: lewati pemulaian ulang layanan Gateway setelah pembaruan berhasil. Pembaruan pengelola paket yang memang memulai ulang Gateway memverifikasi bahwa layanan yang dimulai ulang melaporkan versi terbaru yang diharapkan sebelum perintah berhasil.
- `--channel <stable|beta|dev>`: atur kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/mulai ulang) tanpa menulis konfigurasi, menginstal, menyinkronkan Plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.integrityDrifts` saat drift artefak Plugin npm
  terdeteksi selama sinkronisasi Plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default 1800 dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

`openclaw update` tidak memiliki flag `--verbose`. Gunakan `--dry-run` untuk mempratinjau
tindakan kanal/tag/instal/mulai ulang yang direncanakan, `--json` untuk hasil yang
dapat dibaca mesin, dan `openclaw update status --json` saat Anda hanya membutuhkan
detail kanal dan ketersediaan. Jika Anda men-debug log Gateway di sekitar pembaruan,
verbositas konsol dan level log file terpisah: `--verbose` Gateway memengaruhi
keluaran terminal/WebSocket, sedangkan log file memerlukan `logging.level: "debug"` atau
`"trace"` dalam konfigurasi. Lihat [logging Gateway](/id/gateway/logging).

<Warning>
Downgrade memerlukan konfirmasi karena versi yang lebih lama dapat merusak konfigurasi.
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
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default 3 dtk).

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah akan memulai ulang Gateway
setelah memperbarui (default-nya adalah memulai ulang). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1800`)

## Yang dilakukan

Saat Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → mengutamakan dist-tag npm `beta`, tetapi mundur ke `latest` saat beta
  tidak ada atau lebih lama dari rilis stable saat ini.

Pembaruan otomatis inti Gateway (saat diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar handler permintaan Gateway yang sedang berjalan. Pembaruan pengelola paket
`update.run` pada control plane memaksa pemulaian ulang pembaruan tanpa penundaan dan tanpa cooldown setelah penukaran paket,
karena proses Gateway lama mungkin masih memiliki chunk dalam memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk instalasi pengelola paket, `openclaw update` menyelesaikan versi paket target
sebelum menjalankan pengelola paket. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw menginstal paket baru ke prefiks npm sementara, memverifikasi inventaris
`dist` yang dipaketkan di sana, lalu menukar pohon paket bersih itu ke
prefiks global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi Plugin, dan
pekerjaan mulai ulang tidak dijalankan dari pohon yang dicurigai. Bahkan saat versi terinstal
sudah cocok dengan target, perintah menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi Plugin, penyegaran penyelesaian perintah inti, dan pekerjaan mulai ulang. Ini
menjaga sidecar yang dipaketkan dan catatan Plugin milik kanal tetap selaras dengan
build OpenClaw yang terinstal sambil menyerahkan pembuatan ulang penyelesaian perintah Plugin penuh ke
pemanggilan eksplisit `openclaw completion --write-state`.

Saat layanan Gateway terkelola lokal terinstal dan mulai ulang diaktifkan,
pembaruan pengelola paket menghentikan layanan yang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari instalasi yang diperbarui, memulai ulang
layanan, dan memverifikasi Gateway yang dimulai ulang melaporkan versi yang diharapkan sebelum
melaporkan keberhasilan. Di macOS, pemeriksaan pascapembaruan juga memverifikasi bahwa LaunchAgent
dimuat/berjalan untuk profil aktif dan port loopback yang dikonfigurasi
sehat. Jika plist terinstal tetapi launchd tidak mengawasinya, OpenClaw
melakukan bootstrap ulang LaunchAgent secara otomatis, lalu menjalankan ulang
pemeriksaan kesiapan kesehatan/versi/kanal. Bootstrap baru memuat job RunAtLoad
secara langsung, sehingga pemulihan pembaruan tidak segera menjalankan `kickstart -k` pada Gateway
yang baru dibuat. Jika Gateway tetap tidak menjadi sehat, perintah keluar
dengan non-zero dan mencetak jalur log mulai ulang serta instruksi mulai ulang, instal ulang, dan
rollback paket secara eksplisit. Dengan `--no-restart`,
penggantian paket tetap berjalan tetapi layanan terkelola tidak dihentikan atau
dimulai ulang, sehingga Gateway yang berjalan mungkin tetap menggunakan kode lama sampai Anda memulai ulang
secara manual.

## Alur checkout Git

### Pemilihan kanal

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: utamakan tag `-beta` terbaru, tetapi mundur ke tag stable terbaru saat beta tidak ada atau lebih lama.
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
    Menggunakan pengelola paket repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback `npm install pnpm@10` sementara) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Membangun gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan pembaruan aman terakhir.
  </Step>
  <Step title="Sinkronkan Plugin">
    Menyinkronkan Plugin ke kanal aktif. Dev menggunakan Plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi Plugin yang dilacak.
  </Step>
</Steps>

Pada kanal pembaruan beta, instalasi Plugin npm dan ClawHub yang dilacak dan mengikuti
jalur default/latest mencoba rilis Plugin `@beta` terlebih dahulu. Jika Plugin tidak memiliki
rilis beta, OpenClaw mundur ke spesifikasi default/latest yang direkam. Untuk Plugin npm,
OpenClaw juga mundur saat paket beta ada tetapi gagal validasi instalasi.
Versi persis dan tag eksplisit tidak ditulis ulang.

<Warning>
Jika pembaruan Plugin npm yang dipin secara persis diselesaikan ke artefak yang integritasnya berbeda dari catatan instalasi tersimpan, `openclaw update` membatalkan pembaruan artefak Plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui Plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi Plugin pascapembaruan menggagalkan hasil pembaruan dan menghentikan pekerjaan lanjutan mulai ulang. Perbaiki kesalahan instalasi atau pembaruan Plugin, lalu jalankan ulang `openclaw update`.

Saat Gateway yang diperbarui dimulai, pemuatan Plugin bersifat hanya verifikasi: startup tidak menjalankan pengelola paket atau mengubah pohon dependensi. Pemulaian ulang `update.run` pengelola paket melewati penundaan idle normal dan cooldown mulai ulang setelah pohon paket ditukar, sehingga proses lama tidak dapat terus memuat lambat chunk yang sudah dihapus.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan kesalahan khusus pengelola paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Pintasan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan menjalankan pembaruan terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
