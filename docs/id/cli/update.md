---
read_when:
    - Anda ingin memperbarui checkout kode sumber dengan aman
    - Anda sedang menelusuri galat pada keluaran atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang relatif aman + mulai ulang otomatis Gateway)
title: Perbarui
x-i18n:
    generated_at: "2026-05-03T21:29:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara kanal stable/beta/dev.

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
- `--channel <stable|beta|dev>`: atur kanal pembaruan (git + npm; disimpan dalam konfigurasi).
- `--tag <dist-tag|version|spec>`: timpa target paket hanya untuk pembaruan ini. Untuk instalasi paket, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur kanal/tag/target/mulai ulang) tanpa menulis konfigurasi, memasang, menyinkronkan plugin, atau memulai ulang.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.integrityDrifts` saat drift artefak plugin npm
  terdeteksi selama sinkronisasi plugin pascapembaruan.
- `--timeout <seconds>`: batas waktu per langkah (default 1800 dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade).

`openclaw update` tidak memiliki flag `--verbose`. Gunakan `--dry-run` untuk mempratinjau
tindakan kanal/tag/instal/mulai ulang yang direncanakan, `--json` untuk hasil
yang dapat dibaca mesin, dan `openclaw update status --json` saat Anda hanya memerlukan detail
kanal dan ketersediaan. Jika Anda men-debug log Gateway di sekitar pembaruan,
verbositas konsol dan level log file terpisah: Gateway `--verbose` memengaruhi
keluaran terminal/WebSocket, sementara log file memerlukan `logging.level: "debug"` atau
`"trace"` dalam konfigurasi. Lihat [logging Gateway](/id/gateway/logging).

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
- `--timeout <seconds>`: batas waktu untuk pemeriksaan (default 3 dtk).

## `update wizard`

Alur interaktif untuk memilih kanal pembaruan dan mengonfirmasi apakah akan memulai ulang Gateway
setelah pembaruan (default-nya memulai ulang). Jika Anda memilih `dev` tanpa checkout git, alur ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: batas waktu untuk setiap langkah pembaruan (default `1800`)

## Yang dilakukan

Saat Anda beralih kanal secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan checkout git (default: `~/openclaw`, timpa dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan memasang CLI global dari checkout tersebut.
- `stable` → memasang dari npm menggunakan `latest`.
- `beta` → memprioritaskan dist-tag npm `beta`, tetapi fallback ke `latest` saat beta
  tidak ada atau lebih lama daripada rilis stable saat ini.

Pembaruan otomatis inti Gateway (saat diaktifkan melalui konfigurasi) meluncurkan jalur pembaruan CLI
di luar handler permintaan Gateway yang sedang aktif. Pembaruan manajer paket control-plane `update.run`
memaksa mulai ulang pembaruan yang tidak ditunda dan tanpa cooldown setelah penggantian paket,
karena proses Gateway lama mungkin masih memiliki chunk dalam memori yang menunjuk ke
file yang dihapus oleh paket baru.

Untuk instalasi manajer paket, `openclaw update` menyelesaikan versi paket target
sebelum memanggil manajer paket. Instalasi global npm menggunakan instalasi bertahap:
OpenClaw memasang paket baru ke prefix npm sementara, memverifikasi inventaris
`dist` yang dipaketkan di sana, lalu menukar pohon paket bersih itu ke prefix
global asli. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi plugin, dan
pekerjaan mulai ulang tidak dijalankan dari pohon yang dicurigai. Bahkan saat versi terpasang
sudah cocok dengan target, perintah ini menyegarkan instalasi paket global,
lalu menjalankan sinkronisasi plugin, penyegaran penyelesaian perintah inti, dan pekerjaan mulai ulang. Ini
menjaga sidecar terpaketkan dan catatan plugin milik kanal tetap selaras dengan
build OpenClaw yang terpasang sambil menyerahkan pembangunan ulang penyelesaian perintah plugin penuh ke
eksekusi `openclaw completion --write-state` eksplisit.

Saat layanan Gateway terkelola lokal terpasang dan mulai ulang diaktifkan,
pembaruan manajer paket menghentikan layanan yang berjalan sebelum mengganti pohon paket,
lalu menyegarkan metadata layanan dari instalasi yang diperbarui, memulai ulang
layanan, dan memverifikasi Gateway yang dimulai ulang melaporkan versi yang diharapkan sebelum
melaporkan keberhasilan. Di macOS, pemeriksaan pascapembaruan juga memverifikasi LaunchAgent
dimuat/berjalan untuk profil aktif dan port loopback yang dikonfigurasi
sehat. Jika plist terpasang tetapi launchd tidak mengawasinya, OpenClaw
mem-bootstrap ulang LaunchAgent secara otomatis, lalu menjalankan ulang
pemeriksaan kesiapan kesehatan/versi/kanal. Bootstrap baru memuat job RunAtLoad
secara langsung, sehingga pemulihan pembaruan tidak langsung `kickstart -k` Gateway
yang baru dibuat. Jika Gateway tetap tidak menjadi sehat, perintah keluar
non-zero dan mencetak path log mulai ulang plus instruksi mulai ulang, instal ulang, dan
rollback paket yang eksplisit. Dengan `--no-restart`,
penggantian paket tetap berjalan tetapi layanan terkelola tidak dihentikan atau
dimulai ulang, sehingga Gateway yang sedang berjalan mungkin tetap memakai kode lama sampai Anda memulai ulang
secara manual.

## Alur checkout git

### Pemilihan kanal

- `stable`: checkout tag non-beta terbaru, lalu build dan doctor.
- `beta`: prioritaskan tag `-beta` terbaru, tetapi fallback ke tag stable terbaru saat beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch dan rebase.

### Langkah pembaruan

<Steps>
  <Step title="Verifikasi worktree bersih">
    Mengharuskan tidak ada perubahan yang belum di-commit.
  </Step>
  <Step title="Beralih kanal">
    Beralih ke kanal yang dipilih (tag atau branch).
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
  <Step title="Pasang dependensi">
    Menggunakan manajer paket repo. Untuk checkout pnpm, updater mem-bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback `npm install pnpm@10` sementara) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Mem-build gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan pembaruan aman terakhir.
  </Step>
  <Step title="Sinkronkan plugin">
    Menyinkronkan plugin ke kanal aktif. Dev menggunakan plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi plugin yang dilacak.
  </Step>
</Steps>

Pada kanal pembaruan beta, instalasi plugin npm dan ClawHub yang dilacak yang mengikuti
baris default/latest mencoba rilis plugin `@beta` terlebih dahulu. Jika plugin tidak memiliki
rilis beta, OpenClaw fallback ke spesifikasi default/latest yang tercatat. Versi eksak
dan tag eksplisit tidak ditulis ulang.

<Warning>
Jika pembaruan plugin npm yang dipin secara eksak diselesaikan ke artefak yang integritasnya berbeda dari catatan instalasi tersimpan, `openclaw update` membatalkan pembaruan artefak plugin tersebut alih-alih memasangnya. Instal ulang atau perbarui plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi plugin pascapembaruan menggagalkan hasil pembaruan dan menghentikan pekerjaan lanjutan mulai ulang. Perbaiki kesalahan instalasi atau pembaruan plugin, lalu jalankan ulang `openclaw update`.

Saat Gateway yang diperbarui dimulai, pemuatan plugin bersifat hanya verifikasi: startup tidak menjalankan manajer paket atau mengubah pohon dependensi. Mulai ulang `update.run` manajer paket melewati penundaan idle normal dan cooldown mulai ulang setelah pohon paket ditukar, sehingga proses lama tidak dapat terus lazy-load chunk yang telah dihapus.

Jika bootstrap pnpm tetap gagal, updater berhenti lebih awal dengan kesalahan khusus manajer paket alih-alih mencoba `npm run build` di dalam checkout.
</Note>

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan skrip launcher).

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan update terlebih dahulu pada checkout git)
- [Kanal pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)
