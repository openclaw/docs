---
read_when:
    - Memperbarui OpenClaw
    - Ada yang rusak setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau dari sumber), serta strategi pemulihan versi
title: Memperbarui
x-i18n:
    generated_at: "2026-05-07T01:52:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

Selalu perbarui OpenClaw.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang gateway.

```bash
openclaw update
```

Untuk beralih saluran atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` tidak menerima `--verbose`. Untuk diagnostik pembaruan, gunakan
`--dry-run` untuk meninjau tindakan yang direncanakan, `--json` untuk hasil terstruktur, atau
`openclaw update status --json` untuk memeriksa status saluran dan ketersediaan. Penginstal
memiliki flag `--verbose` sendiri, tetapi flag tersebut bukan bagian dari
`openclaw update`.

`--channel beta` memprioritaskan beta, tetapi runtime kembali ke stable/latest saat
tag beta tidak ada atau lebih lama daripada rilis stabil terbaru. Gunakan `--tag beta`
jika Anda menginginkan dist-tag beta npm mentah untuk pembaruan paket sekali jalan.

OpenClaw belum menyediakan saluran pembaruan dukungan LTS atau bulanan. Kami sedang
menuju lini dukungan bulanan yang kompatibel dengan SemVer, tetapi saat ini saluran
yang didukung masih `stable`, `beta`, dan `dev`.

Lihat [Saluran pengembangan](/id/install/development-channels) untuk semantik saluran.

## Beralih antara instalasi npm dan git

Gunakan saluran saat Anda ingin mengubah jenis instalasi. Pembaru mempertahankan
status, konfigurasi, kredensial, dan ruang kerja Anda di `~/.openclaw`; pembaru hanya mengubah
instalasi kode OpenClaw yang digunakan CLI dan gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Jalankan dengan `--dry-run` terlebih dahulu untuk meninjau peralihan mode instalasi yang tepat:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Saluran `dev` memastikan checkout git tersedia, membangunnya, dan menginstal CLI global
dari checkout tersebut. Saluran `stable` dan `beta` menggunakan instalasi paket. Jika
gateway sudah diinstal, `openclaw update` menyegarkan metadata layanan
dan memulai ulangnya kecuali Anda memberikan `--no-restart`.

## Alternatif: jalankan ulang penginstal

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk memaksa jenis instalasi tertentu melalui
penginstal, berikan `--install-method git --no-onboard` atau
`--install-method npm --no-onboard`.

Jika `openclaw update` gagal setelah fase instalasi paket npm, jalankan ulang
penginstal. Penginstal tidak memanggil pembaru lama; penginstal menjalankan instalasi
paket global secara langsung dan dapat memulihkan instalasi npm yang sebagian diperbarui.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Untuk menyematkan pemulihan ke versi atau dist-tag tertentu, tambahkan `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: npm, pnpm, atau bun manual

```bash
npm i -g openclaw@latest
```

Utamakan `openclaw update` untuk instalasi terawasi karena perintah ini dapat mengoordinasikan
pertukaran paket dengan layanan Gateway yang sedang berjalan. Jika Anda memperbarui secara manual saat
Gateway terkelola sedang berjalan, mulai ulang Gateway segera setelah manajer paket
selesai agar proses lama tidak terus menyajikan dari file paket yang sudah diganti.

Saat `openclaw update` mengelola instalasi npm global, perintah ini terlebih dahulu menginstal target ke
prefix npm sementara, memverifikasi inventaris `dist` terpaket, lalu menukar
pohon paket bersih ke prefix global sebenarnya. Ini mencegah npm menimpa
paket baru di atas file usang dari paket lama. Jika perintah instalasi gagal,
OpenClaw mencoba sekali lagi dengan `--omit=optional`. Percobaan ulang itu membantu host tempat
dependensi opsional native tidak dapat dikompilasi, sambil tetap menampilkan kegagalan asli
jika fallback juga gagal.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Topik instalasi npm tingkat lanjut

<AccordionGroup>
  <Accordion title="Pohon paket hanya-baca">
    OpenClaw memperlakukan instalasi global terpaket sebagai hanya-baca pada runtime, bahkan saat direktori paket global dapat ditulis oleh pengguna saat ini. Instalasi paket Plugin berada di root npm/git milik OpenClaw di bawah direktori konfigurasi pengguna, dan startup Gateway tidak memutasi pohon paket OpenClaw.

    Beberapa setup npm Linux menginstal paket global di bawah direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak tersebut karena perintah instalasi/pembaruan Plugin menulis di luar direktori paket global tersebut.

  </Accordion>
  <Accordion title="Unit systemd yang diperkuat">
    Berikan OpenClaw akses tulis ke root konfigurasi/statusnya agar instalasi Plugin eksplisit, pembaruan Plugin, dan pembersihan doctor dapat mempertahankan perubahannya:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Pemeriksaan awal ruang disk">
    Sebelum pembaruan paket dan instalasi Plugin eksplisit, OpenClaw mencoba pemeriksaan ruang disk upaya-terbaik untuk volume target. Ruang rendah menghasilkan peringatan dengan jalur yang diperiksa, tetapi tidak memblokir pembaruan karena kuota sistem file, snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi manajer paket aktual dan verifikasi pascainstalasi tetap menjadi otoritas.
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

| Saluran  | Perilaku                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik di seluruh `stableJitterHours` (rollout tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: tiap jam) dan langsung menerapkan.                              |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                                           |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).
Untuk downgrade atau pemulihan insiden, setel `OPENCLAW_NO_AUTO_UPDATE=1` di lingkungan gateway untuk memblokir penerapan otomatis meskipun `update.auto.enabled` dikonfigurasi. Petunjuk pembaruan startup tetap dapat berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

Pembaruan manajer paket yang diminta melalui handler control-plane Gateway langsung
memaksa mulai ulang pembaruan tanpa penundaan dan tanpa cooldown setelah pertukaran paket. Ini
mencegah proses lama di memori tetap ada cukup lama untuk lazy-load chunk
dari pohon paket yang sudah diganti. Shell `openclaw update`
tetap menjadi jalur yang direkomendasikan untuk instalasi terawasi karena dapat menghentikan dan
memulai ulang layanan di sekitar pembaruan.

## Setelah memperbarui

<Steps>

### Jalankan doctor

```bash
openclaw doctor
```

Memigrasikan konfigurasi, mengaudit kebijakan DM, dan memeriksa kesehatan gateway. Detail: [Doctor](/id/gateway/doctor)

### Mulai ulang gateway

```bash
openclaw gateway restart
```

### Verifikasi

```bash
openclaw health
```

</Steps>

## Rollback

### Sematkan versi (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` menampilkan versi terbit saat ini.
</Tip>

### Sematkan commit (sumber)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke terbaru: `git checkout main && git pull`.

## Jika Anda buntu

- Jalankan `openclaw doctor` lagi dan baca output dengan cermat.
- Untuk `openclaw update --channel dev` pada checkout sumber, pembaru otomatis melakukan bootstrap `pnpm` saat diperlukan. Jika Anda melihat error bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) dan jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Bertanya di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi mayor.
