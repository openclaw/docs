---
read_when:
    - Memperbarui OpenClaw
    - Ada yang bermasalah setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau dari sumber), beserta strategi pengembalian ke versi sebelumnya
title: Memperbarui
x-i18n:
    generated_at: "2026-07-12T14:20:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Pastikan OpenClaw selalu mutakhir.

Untuk penggantian citra Docker, Podman, dan Kubernetes, lihat
[Memutakhirkan citra kontainer](/id/install/docker#upgrading-container-images). Gateway
menjalankan pekerjaan pemutakhiran yang aman saat mulai sebelum siap menerima
layanan, lalu keluar jika status yang dipasang memerlukan perbaikan manual.

## Disarankan: `openclaw update`

Mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang Gateway.

```bash
openclaw update
```

Beralih kanal atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # pratinjau tanpa menerapkan
```

`openclaw update` tidak memiliki flag `--verbose` (penginstal memilikinya). Untuk diagnostik, gunakan
`--dry-run` guna meninjau tindakan yang direncanakan, `--json` untuk hasil terstruktur, atau
`openclaw update status --json` guna memeriksa status kanal dan ketersediaan.

`--channel beta` mengutamakan dist-tag beta npm, tetapi kembali ke stabil/terbaru
ketika tag beta tidak tersedia atau versinya lebih lama daripada rilis stabil
terbaru. Gunakan `--tag beta` untuk pemutakhiran paket satu kali yang disematkan
ke dist-tag beta npm mentah.

`--channel extended-stable` hanya berlaku untuk paket, dan instalasi tetap
hanya berjalan di latar depan. OpenClaw membaca pemilih publik npm `extended-stable`,
memverifikasi paket persis yang dipilih, lalu menginstal versi persis tersebut. Data
registri yang tidak tersedia atau tidak konsisten menyebabkan kegagalan tertutup; proses ini tidak pernah
kembali ke `latest`. Jika versi yang dipilih lebih lama daripada versi yang terinstal,
konfirmasi penurunan versi normal tetap berlaku. CLI menyimpan kanal setelah
pemutakhiran inti berhasil; `npm install -g openclaw@extended-stable` secara langsung
tidak memperbarui `update.channel`.
Setelah penggantian inti, Plugin npm resmi yang memenuhi syarat dengan tujuan
kosong/bawaan atau `latest` diselaraskan ke versi inti persis tersebut. Sematan versi
persis dan tag eksplisit selain `latest`, Plugin pihak ketiga, serta sumber non-npm
tetap tidak berubah. Instalasi katalog yang dibuat oleh versi OpenClaw saat ini
mempertahankan tujuan bawaan tersebut. Catatan lama yang hanya berisi versi persis
tetap disematkan karena OpenClaw tidak dapat membedakan secara aman sematan otomatis
lama dari sematan pengguna; jalankan `openclaw plugins update @openclaw/name` satu kali
di kanal extended-stable agar Plugin tersebut kembali mengikuti versi inti persis.

`--channel dev` menyediakan checkout GitHub `main` bergerak yang persisten. Untuk
pemutakhiran paket satu kali, `--tag main` dipetakan ke spesifikasi paket
`github:openclaw/openclaw#main` dan menginstalnya langsung melalui pengelola paket
target (npm/pnpm/bun).

Untuk Plugin terkelola, tidak tersedianya rilis beta hanya menghasilkan peringatan,
bukan kegagalan: pemutakhiran inti tetap dapat berhasil sementara Plugin kembali ke
rilis bawaan/terbaru yang tercatat.

Lihat [Kanal rilis](/id/install/development-channels) untuk semantik kanal.

## Beralih antara instalasi npm dan git

Gunakan kanal untuk mengubah jenis instalasi. Pemutakhir mempertahankan status, konfigurasi,
kredensial, dan ruang kerja Anda di `~/.openclaw`; pemutakhir hanya mengubah instalasi
kode OpenClaw yang digunakan CLI dan Gateway.

```bash
# instalasi paket npm -> checkout git yang dapat diedit
openclaw update --channel dev

# checkout git -> instalasi paket npm
openclaw update --channel stable
```

Tinjau peralihan mode instalasi terlebih dahulu:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` memastikan tersedianya checkout git, membangunnya, lalu menginstal CLI global
dari checkout tersebut. Kanal `stable`, `extended-stable`, dan `beta` menggunakan
instalasi paket. Extended-stable ditolak pada checkout git tanpa mengubah atau
mengonversinya. Jika Gateway sudah terinstal, `openclaw update` menyegarkan metadata
layanan dan memulai ulang layanan tersebut kecuali Anda meneruskan `--no-restart`.

Untuk instalasi paket dengan layanan Gateway terkelola, `openclaw update` menargetkan
akar paket yang digunakan layanan tersebut. Jika perintah shell `openclaw` berasal
dari instalasi lain, pemutakhir menampilkan kedua akar dan jalur Node milik layanan
terkelola, lalu memeriksa versi Node tersebut terhadap persyaratan `engines.node`
rilis target sebelum mengganti paket.

## Alternatif: jalankan kembali penginstal

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati orientasi awal. Untuk memaksakan jenis instalasi
tertentu, teruskan `--install-method git --no-onboard` atau
`--install-method npm --no-onboard`.

Jika `openclaw update` gagal setelah tahap instalasi paket npm, jalankan kembali
penginstal. Penginstal tidak memanggil pemutakhir; penginstal menjalankan instalasi
paket global secara langsung dan dapat memulihkan instalasi npm yang hanya diperbarui
sebagian.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Sematkan pemulihan ke versi atau dist-tag tertentu dengan `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: npm, pnpm, atau bun secara manual

```bash
npm i -g openclaw@latest
```

Utamakan `openclaw update` untuk instalasi yang diawasi: perintah ini dapat
mengoordinasikan penggantian paket dengan layanan Gateway yang sedang berjalan.
Jika Anda memperbarui secara manual pada instalasi yang diawasi, hentikan Gateway
terkelola terlebih dahulu. Pengelola paket mengganti berkas langsung di tempatnya,
dan Gateway yang sedang berjalan dapat mencoba memuat berkas inti atau Plugin di
tengah proses penggantian. Mulai ulang Gateway setelah pengelola paket selesai agar
Gateway menggunakan instalasi baru.

Untuk instalasi global seluruh sistem Linux yang dimiliki root, jika `openclaw update`
gagal dengan `EACCES`, pulihkan menggunakan npm sistem sambil menjaga Gateway tetap
berhenti selama penggantian manual. Gunakan flag profil/lingkungan yang sama dengan
yang biasanya Anda gunakan untuk Gateway tersebut. Ganti `/usr/bin/npm` dengan npm
sistem yang memiliki prefiks global milik root pada hos Anda:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Kemudian verifikasi:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Ketika `openclaw update` mengelola instalasi npm global, perintah ini terlebih dahulu
menginstal target ke prefiks npm sementara, memverifikasi inventaris `dist` yang
dikemas, lalu menukar pohon paket bersih ke prefiks global sebenarnya — sehingga
npm tidak menimpakan paket baru di atas berkas usang dari paket lama. Jika perintah
instalasi gagal, OpenClaw mencoba kembali satu kali dengan `--omit=optional`, yang
membantu hos tempat dependensi opsional natif tidak dapat dikompilasi.

Perintah pemutakhiran npm dan pemutakhiran Plugin yang dikelola OpenClaw juga
menonaktifkan karantina rantai pasok `min-release-age` milik npm (atau kunci
konfigurasi lama `before`) untuk proses anak npm. Kebijakan tersebut tersedia untuk
perlindungan umum, tetapi pemutakhiran OpenClaw secara eksplisit berarti
"instal rilis yang dipilih sekarang."

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Topik instalasi npm tingkat lanjut

<AccordionGroup>
  <Accordion title="Pohon paket hanya-baca">
    OpenClaw memperlakukan instalasi global yang dikemas sebagai hanya-baca saat runtime, bahkan ketika direktori paket global dapat ditulis oleh pengguna saat ini. Instalasi paket Plugin berada di akar npm/git milik OpenClaw di bawah direktori konfigurasi pengguna, dan proses mulai Gateway tidak mengubah pohon paket OpenClaw.

    Beberapa konfigurasi npm Linux menginstal paket global di direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak tersebut karena perintah instalasi/pemutakhiran Plugin menulis di luar direktori paket global tersebut.

  </Accordion>
  <Accordion title="Unit systemd yang diperketat">
    Berikan OpenClaw akses tulis ke akar konfigurasi/statusnya agar instalasi Plugin eksplisit, pemutakhiran Plugin, dan pembersihan diagnostik dapat menyimpan perubahannya:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Pemeriksaan awal ruang disk">
    Sebelum pemutakhiran paket dan instalasi Plugin eksplisit, OpenClaw mencoba melakukan pemeriksaan ruang disk berdasarkan upaya terbaik untuk volume target. Ruang yang rendah menghasilkan peringatan berisi jalur yang diperiksa, tetapi tidak memblokir pemutakhiran karena kuota sistem berkas, rekam jepret, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi pengelola paket yang sebenarnya dan verifikasi pascainstalasi tetap menjadi acuan.
  </Accordion>
</AccordionGroup>

## Pemutakhir otomatis

Dinonaktifkan secara bawaan. Aktifkan di `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanal             | Perilaku                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Menunggu `stableDelayHours` (bawaan: 6), lalu menerapkan dengan variasi deterministik dalam `stableJitterHours` (bawaan: 12) untuk peluncuran bertahap. |
| `extended-stable` | Memeriksa petunjuk pemutakhiran hanya-baca saat mulai dan setiap 24 jam ketika `checkOnStart` diaktifkan. Tidak pernah menerapkannya secara otomatis. |
| `beta`            | Memeriksa setiap `betaCheckIntervalHours` (bawaan: 1) dan langsung menerapkannya.                                                               |
| `dev`             | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                                                          |

Gateway juga mencatat petunjuk pemutakhiran saat mulai (nonaktifkan dengan
`update.checkOnStart: false`). Pilihan extended-stable yang tersimpan menggunakan
jalur petunjuk hanya-baca ini dan interval petunjuk 24 jam yang sudah ada, tetapi
tidak pernah menjalankan instalasi otomatis, serah terima, mulai ulang, penundaan/variasi
stabil, atau pemeriksaan berkala beta.
Untuk penurunan versi atau pemulihan insiden, tetapkan `OPENCLAW_NO_AUTO_UPDATE=1`
di lingkungan Gateway guna memblokir penerapan otomatis meskipun
`update.auto.enabled` dikonfigurasi. Petunjuk pemutakhiran saat mulai tetap dapat
berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

Pemutakhiran pengelola paket yang diminta melalui bidang kontrol Gateway langsung
(`update.run`) tidak mengganti pohon paket di dalam proses Gateway yang sedang
berjalan. Pada instalasi layanan terkelola, Gateway memulai serah terima terpisah,
keluar, dan membiarkan jalur CLI normal `openclaw update --yes --json` menghentikan
layanan, mengganti paket, menyegarkan metadata layanan, memulai ulang, memverifikasi
versi dan keterjangkauan Gateway, serta memulihkan LaunchAgent macOS yang terinstal
tetapi tidak dimuat jika memungkinkan. Jika Gateway tidak dapat melakukan serah
terima tersebut secara aman, `update.run` melaporkan perintah shell yang aman alih-alih
menjalankan pengelola paket di dalam proses.

Kartu pemutakhiran bilah samping UI Kontrol memulai alur `update.run` yang sama.
Dalam aplikasi macOS bertanda tangan, kartu tersebut terlebih dahulu memperbarui
aplikasi melalui Sparkle; setelah diluncurkan kembali, aplikasi menyelaraskan Gateway
lokal terkelolanya ke versi yang sama.

## Setelah memperbarui

<Steps>

### Jalankan diagnostik

```bash
openclaw doctor
```

Memigrasikan konfigurasi, mengaudit kebijakan DM, dan memeriksa kesehatan Gateway. Detail: [Diagnostik](/id/gateway/doctor)

### Mulai ulang Gateway

```bash
openclaw gateway restart
```

### Verifikasi

```bash
openclaw health
```

</Steps>

## Pengembalian ke versi sebelumnya

### Sematkan versi (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` menampilkan versi yang saat ini dipublikasikan.
</Tip>

### Sematkan commit (sumber)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke versi terbaru: `git checkout main && git pull`.

## Jika Anda mengalami kendala

- Jalankan kembali `openclaw doctor` dan baca keluarannya dengan saksama.
- Untuk `openclaw update --channel dev` pada checkout sumber, pemutakhir secara otomatis menyiapkan `pnpm` ketika diperlukan. Jika Anda melihat galat penyiapan awal pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) lalu jalankan ulang pemutakhiran.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi mayor.
