---
read_when:
    - Memperbarui OpenClaw
    - Ada yang bermasalah setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau kode sumber), serta strategi pengembalian
title: Memperbarui
x-i18n:
    generated_at: "2026-05-11T20:31:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb1506ed87b1cf2e4928987c9dbfaff17d47b87f6c18239d694e0f55deb609f7
    source_path: install/updating.md
    workflow: 16
---

Selalu perbarui OpenClaw.

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
`--dry-run` untuk mempratinjau tindakan yang direncanakan, `--json` untuk hasil terstruktur, atau
`openclaw update status --json` untuk memeriksa status kanal dan ketersediaan. Installer
memiliki flag `--verbose` sendiri, tetapi flag tersebut bukan bagian dari
`openclaw update`.

`--channel beta` memprioritaskan beta, tetapi runtime kembali ke stable/latest ketika
tag beta tidak ada atau lebih lama daripada rilis stabil terbaru. Gunakan `--tag beta`
jika Anda menginginkan dist-tag beta npm mentah untuk pembaruan paket sekali jalan.

Untuk Plugin terkelola, fallback kanal beta adalah peringatan: pembaruan inti masih dapat
berhasil sementara sebuah Plugin menggunakan rilis default/latest yang tercatat karena tidak ada
beta Plugin yang tersedia.

Lihat [Kanal pengembangan](/id/install/development-channels) untuk semantik kanal.

## Beralih antara instalasi npm dan git

Gunakan kanal saat Anda ingin mengubah jenis instalasi. Updater mempertahankan
status, konfigurasi, kredensial, dan workspace Anda di `~/.openclaw`; ia hanya mengubah
instalasi kode OpenClaw yang digunakan CLI dan Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Jalankan dengan `--dry-run` terlebih dahulu untuk mempratinjau pengalihan mode instalasi yang tepat:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kanal `dev` memastikan checkout git, membangunnya, dan menginstal CLI global
dari checkout tersebut. Kanal `stable` dan `beta` menggunakan instalasi paket. Jika
Gateway sudah terinstal, `openclaw update` menyegarkan metadata layanan
dan memulai ulangnya kecuali Anda meneruskan `--no-restart`.

## Alternatif: jalankan ulang installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk memaksa jenis instalasi tertentu melalui
installer, teruskan `--install-method git --no-onboard` atau
`--install-method npm --no-onboard`.

Jika `openclaw update` gagal setelah fase instalasi paket npm, jalankan ulang
installer. Installer tidak memanggil updater lama; ia menjalankan instalasi
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

Utamakan `openclaw update` untuk instalasi yang diawasi karena ia dapat mengoordinasikan
pertukaran paket dengan layanan Gateway yang sedang berjalan. Jika Anda memperbarui secara manual saat
Gateway terkelola sedang berjalan, segera mulai ulang Gateway setelah package
manager selesai agar proses lama tidak terus melayani dari file paket
yang sudah diganti.

Saat `openclaw update` mengelola instalasi npm global, ia menginstal target ke
prefix npm sementara terlebih dahulu, memverifikasi inventaris `dist` yang dipaketkan, lalu menukar
pohon paket bersih ke prefix global sebenarnya. Ini menghindari npm menumpuk paket
baru di atas file usang dari paket lama. Jika perintah instalasi gagal,
OpenClaw mencoba sekali lagi dengan `--omit=optional`. Percobaan ulang itu membantu host tempat
dependensi opsional native tidak dapat dikompilasi, sambil tetap menampilkan kegagalan asli
jika fallback juga gagal.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Topik lanjutan instalasi npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw memperlakukan instalasi global yang dipaketkan sebagai hanya-baca saat runtime, bahkan ketika direktori paket global dapat ditulis oleh pengguna saat ini. Instalasi paket Plugin berada di root npm/git milik OpenClaw di bawah direktori konfigurasi pengguna, dan startup Gateway tidak memutasi pohon paket OpenClaw.

    Beberapa pengaturan npm Linux menginstal paket global di bawah direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak itu karena perintah instalasi/pembaruan Plugin menulis di luar direktori paket global tersebut.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Beri OpenClaw akses tulis ke root konfigurasi/statusnya agar instalasi Plugin eksplisit, pembaruan Plugin, dan pembersihan doctor dapat mempertahankan perubahannya:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Sebelum pembaruan paket dan instalasi Plugin eksplisit, OpenClaw mencoba pemeriksaan ruang disk upaya terbaik untuk volume target. Ruang rendah menghasilkan peringatan dengan path yang diperiksa, tetapi tidak memblokir pembaruan karena kuota sistem file, snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi package-manager aktual dan verifikasi pascainstalasi tetap otoritatif.
  </Accordion>
</AccordionGroup>

## Auto-updater

Auto-updater nonaktif secara default. Aktifkan di `~/.openclaw/openclaw.json`:

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
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik di seluruh `stableJitterHours` (rollout tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: setiap jam) dan langsung menerapkan.                       |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                        |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).
Untuk downgrade atau pemulihan insiden, tetapkan `OPENCLAW_NO_AUTO_UPDATE=1` di environment Gateway untuk memblokir penerapan otomatis bahkan ketika `update.auto.enabled` dikonfigurasi. Petunjuk pembaruan startup masih dapat berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

Pembaruan package-manager yang diminta melalui handler control-plane Gateway langsung
memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah pertukaran paket. Ini
menghindari proses lama di memori tetap ada cukup lama untuk lazy-load chunk
dari pohon paket yang sudah diganti. Shell `openclaw update`
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

Untuk kembali ke terbaru: `git checkout main && git pull`.

## Jika Anda buntu

- Jalankan `openclaw doctor` lagi dan baca output dengan cermat.
- Untuk `openclaw update --channel dev` pada checkout sumber, updater otomatis mem-bootstrap `pnpm` saat diperlukan. Jika Anda melihat kesalahan bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) dan jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi utama.
