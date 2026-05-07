---
read_when:
    - Memperbarui OpenClaw
    - Ada yang rusak setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau dari sumber), serta strategi pengembalian ke versi sebelumnya
title: Memperbarui
x-i18n:
    generated_at: "2026-05-07T13:21:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

Jaga OpenClaw tetap mutakhir.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang Gateway.

```bash
openclaw update
```

Untuk beralih kanal atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` tidak menerima `--verbose`. Untuk diagnostik pembaruan, gunakan
`--dry-run` untuk meninjau tindakan yang direncanakan, `--json` untuk hasil terstruktur, atau
`openclaw update status --json` untuk memeriksa status kanal dan ketersediaan. Penginstal
memiliki flag `--verbose` sendiri, tetapi flag tersebut bukan bagian dari
`openclaw update`.

`--channel beta` mengutamakan beta, tetapi lingkungan berjalan akan kembali ke stable/latest ketika
tag beta tidak ada atau lebih lama daripada rilis stabil terbaru. Gunakan `--tag beta`
jika Anda menginginkan dist-tag beta npm mentah untuk pembaruan paket satu kali.

Lihat [Kanal pengembangan](/id/install/development-channels) untuk makna kanal.

## Beralih antara instalasi npm dan git

Gunakan kanal ketika Anda ingin mengubah jenis instalasi. Pembaru mempertahankan
status, konfigurasi, kredensial, dan workspace Anda di `~/.openclaw`; pembaru hanya mengubah
instalasi kode OpenClaw yang digunakan CLI dan Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Jalankan dengan `--dry-run` terlebih dahulu untuk meninjau perpindahan mode instalasi yang tepat:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kanal `dev` memastikan checkout git, membangunnya, dan menginstal CLI global
dari checkout tersebut. Kanal `stable` dan `beta` menggunakan instalasi paket. Jika
Gateway sudah terinstal, `openclaw update` menyegarkan metadata layanan
dan memulai ulangnya kecuali Anda meneruskan `--no-restart`.

## Alternatif: jalankan ulang penginstal

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati penyiapan awal. Untuk memaksa jenis instalasi tertentu melalui
penginstal, teruskan `--install-method git --no-onboard` atau
`--install-method npm --no-onboard`.

Jika `openclaw update` gagal setelah fase instalasi paket npm, jalankan ulang
penginstal. Penginstal tidak memanggil alat pembaru lama; penginstal menjalankan instalasi
paket global secara langsung dan dapat memulihkan instalasi npm yang baru sebagian diperbarui.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Untuk mengunci pemulihan ke versi atau dist-tag tertentu, tambahkan `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: npm, pnpm, atau bun manual

```bash
npm i -g openclaw@latest
```

Utamakan `openclaw update` untuk instalasi yang diawasi karena dapat mengoordinasikan
pertukaran paket dengan layanan Gateway yang sedang berjalan. Jika Anda memperbarui secara manual saat
Gateway terkelola sedang berjalan, mulai ulang Gateway segera setelah pengelola paket
selesai agar proses lama tidak terus melayani dari file paket yang sudah diganti.

Ketika `openclaw update` mengelola instalasi npm global, pembaru terlebih dahulu menginstal target ke
prefiks npm sementara, memverifikasi inventaris `dist` terpaket, lalu menukar
pohon paket bersih ke prefiks global sebenarnya. Ini mencegah npm melapiskan
paket baru di atas file usang dari paket lama. Jika perintah instalasi gagal,
OpenClaw mencoba sekali lagi dengan `--omit=optional`. Percobaan ulang itu membantu host tempat
dependensi opsional native tidak dapat dikompilasi, sambil tetap menampilkan kegagalan asli
jika jalur cadangan juga gagal.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Topik lanjutan instalasi npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw memperlakukan instalasi global terpaket sebagai baca-saja saat berjalan, bahkan ketika direktori paket global dapat ditulis oleh pengguna saat ini. Instalasi paket Plugin berada di root npm/git milik OpenClaw di bawah direktori konfigurasi pengguna, dan startup Gateway tidak mengubah pohon paket OpenClaw.

    Beberapa penyiapan npm Linux menginstal paket global di bawah direktori yang dimiliki root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak tersebut karena perintah instalasi/pembaruan Plugin menulis di luar direktori paket global tersebut.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Berikan OpenClaw akses tulis ke root konfigurasi/statusnya agar instalasi Plugin eksplisit, pembaruan Plugin, dan pembersihan doctor dapat mempertahankan perubahan mereka:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Sebelum pembaruan paket dan instalasi Plugin eksplisit, OpenClaw mencoba pemeriksaan ruang disk sebaik mungkin untuk volume target. Ruang rendah menghasilkan peringatan dengan path yang diperiksa, tetapi tidak memblokir pembaruan karena kuota sistem file, snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi pengelola paket aktual dan verifikasi pascainstalasi tetap menjadi acuan.
  </Accordion>
</AccordionGroup>

## Pembaruan otomatis

Pembaruan otomatis nonaktif secara default. Aktifkan di `~/.openclaw/openclaw.json`:

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

| Kanal    | Perilaku                                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik sepanjang `stableJitterHours` (peluncuran tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: setiap jam) dan langsung menerapkan.                                     |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                                       |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).
Untuk penurunan versi atau pemulihan insiden, tetapkan `OPENCLAW_NO_AUTO_UPDATE=1` di lingkungan Gateway untuk memblokir penerapan otomatis meskipun `update.auto.enabled` dikonfigurasi. Petunjuk pembaruan saat startup masih dapat berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

Pembaruan pengelola paket yang diminta melalui penangan control-plane Gateway live
memaksa mulai ulang pembaruan tanpa penundaan dan tanpa masa tunggu setelah pertukaran paket. Ini
mencegah proses lama di memori tetap ada cukup lama untuk memuat chunk sesuai kebutuhan
dari pohon paket yang sudah diganti. Perintah shell `openclaw update`
tetap menjadi jalur yang disarankan untuk instalasi yang diawasi karena dapat menghentikan dan
memulai ulang layanan di sekitar pembaruan.

## Setelah memperbarui

<Steps>

### Jalankan doctor

```bash
openclaw doctor
```

Memigrasikan konfigurasi, mengaudit kebijakan DM, dan memeriksa kesehatan Gateway. Detail: [Doctor](/id/gateway/doctor)

### Mulai ulang Gateway

```bash
openclaw gateway restart
```

### Verifikasi

```bash
openclaw health
```

</Steps>

## Kembalikan versi

### Kunci versi (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` menampilkan versi terpublikasi saat ini.
</Tip>

### Kunci commit (sumber)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke yang terbaru: `git checkout main && git pull`.

## Jika Anda mengalami kendala

- Jalankan `openclaw doctor` lagi dan baca keluarannya dengan cermat.
- Untuk `openclaw update --channel dev` pada checkout sumber, pembaru melakukan bootstrap otomatis terhadap `pnpm` saat diperlukan. Jika Anda melihat galat bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan ulang `corepack`) dan jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi utama.
