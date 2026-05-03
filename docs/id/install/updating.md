---
read_when:
    - Memperbarui OpenClaw
    - Ada yang bermasalah setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau dari sumber), beserta strategi pemulihan ke versi sebelumnya
title: Memperbarui
x-i18n:
    generated_at: "2026-05-03T21:34:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

Tetap perbarui OpenClaw.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang Gateway.

```bash
openclaw update
```

Untuk berpindah kanal atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` tidak menerima `--verbose`. Untuk diagnostik pembaruan, gunakan
`--dry-run` untuk melihat pratinjau tindakan yang direncanakan, `--json` untuk hasil terstruktur, atau
`openclaw update status --json` untuk memeriksa kanal dan status ketersediaan. Penginstal
memiliki flag `--verbose` sendiri, tetapi flag tersebut bukan bagian dari
`openclaw update`.

`--channel beta` mengutamakan beta, tetapi runtime kembali ke stable/latest ketika
tag beta tidak ada atau lebih lama daripada rilis stable terbaru. Gunakan `--tag beta`
jika Anda menginginkan dist-tag beta npm mentah untuk pembaruan paket sekali pakai.

Lihat [Kanal pengembangan](/id/install/development-channels) untuk semantik kanal.

## Berpindah antara instalasi npm dan git

Gunakan kanal ketika Anda ingin mengubah jenis instalasi. Pembaru mempertahankan
status, konfigurasi, kredensial, dan workspace Anda di `~/.openclaw`; pembaru hanya mengubah
instalasi kode OpenClaw mana yang digunakan oleh CLI dan Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Jalankan dengan `--dry-run` terlebih dahulu untuk melihat pratinjau perpindahan mode instalasi yang tepat:

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

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk memaksa jenis instalasi tertentu melalui
penginstal, teruskan `--install-method git --no-onboard` atau
`--install-method npm --no-onboard`.

Jika `openclaw update` gagal setelah fase instalasi paket npm, jalankan ulang
penginstal. Penginstal tidak memanggil pembaru lama; penginstal menjalankan instalasi
paket global secara langsung dan dapat memulihkan instalasi npm yang diperbarui sebagian.

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

Ketika `openclaw update` mengelola instalasi npm global, perintah ini terlebih dahulu menginstal target ke
prefiks npm sementara, memverifikasi inventaris `dist` yang dipaketkan, lalu menukar
pohon paket yang bersih ke prefiks global sebenarnya. Ini mencegah npm menimpa
paket baru di atas file usang dari paket lama. Jika perintah instalasi gagal,
OpenClaw mencoba sekali lagi dengan `--omit=optional`. Percobaan ulang tersebut membantu host tempat dependensi
opsional native tidak dapat dikompilasi, sekaligus tetap menampilkan kegagalan asli
jika fallback juga gagal.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Topik instalasi npm lanjutan

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw memperlakukan instalasi global yang dipaketkan sebagai hanya-baca saat runtime, bahkan ketika direktori paket global dapat ditulis oleh pengguna saat ini. Instalasi paket Plugin berada di root npm/git milik OpenClaw di bawah direktori konfigurasi pengguna, dan startup Gateway tidak mengubah pohon paket OpenClaw.

    Beberapa penyiapan npm Linux menginstal paket global di bawah direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak tersebut karena perintah instal/perbarui Plugin menulis di luar direktori paket global tersebut.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Berikan akses tulis OpenClaw ke root konfigurasi/statusnya agar instalasi Plugin eksplisit, pembaruan Plugin, dan pembersihan doctor dapat mempertahankan perubahannya:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Sebelum pembaruan paket dan instalasi Plugin eksplisit, OpenClaw mencoba pemeriksaan ruang disk upaya-terbaik untuk volume target. Ruang yang rendah menghasilkan peringatan dengan path yang diperiksa, tetapi tidak memblokir pembaruan karena kuota filesystem, snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi package-manager sebenarnya dan verifikasi pascainstal tetap menjadi sumber kebenaran.
  </Accordion>
</AccordionGroup>

## Pembaru otomatis

Pembaru otomatis nonaktif secara default. Aktifkan di `~/.openclaw/openclaw.json`:

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

| Kanal    | Perilaku                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik di sepanjang `stableJitterHours` (peluncuran tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: setiap jam) dan langsung menerapkan.                              |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                                           |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).
Untuk downgrade atau pemulihan insiden, tetapkan `OPENCLAW_NO_AUTO_UPDATE=1` di lingkungan Gateway untuk memblokir penerapan otomatis meskipun `update.auto.enabled` dikonfigurasi. Petunjuk pembaruan startup masih dapat berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

Pembaruan package-manager yang diminta melalui handler control-plane Gateway langsung
memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah penukaran paket. Hal itu
mencegah proses dalam memori lama tertinggal cukup lama untuk memuat chunk secara lazy
dari pohon paket yang sudah diganti. Shell `openclaw update`
tetap menjadi jalur yang lebih disukai untuk instalasi yang diawasi karena dapat menghentikan dan
memulai ulang layanan selama pembaruan.

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

## Rollback

### Kunci versi (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` menampilkan versi yang saat ini dipublikasikan.
</Tip>

### Kunci commit (sumber)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke yang terbaru: `git checkout main && git pull`.

## Jika Anda buntu

- Jalankan `openclaw doctor` lagi dan baca output dengan cermat.
- Untuk `openclaw update --channel dev` pada checkout sumber, pembaru melakukan bootstrap otomatis `pnpm` saat diperlukan. Jika Anda melihat galat bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) dan jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi mayor.
