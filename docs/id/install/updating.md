---
read_when:
    - Memperbarui OpenClaw
    - Ada yang rusak setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau dari sumber), serta strategi pengembalian ke versi sebelumnya
title: Memperbarui
x-i18n:
    generated_at: "2026-05-02T09:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

Selalu perbarui OpenClaw.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang gateway.

```bash
openclaw update
```

Untuk berpindah saluran atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` memprioritaskan beta, tetapi runtime kembali ke stable/latest ketika
tag beta tidak ada atau lebih lama daripada rilis stabil terbaru. Gunakan `--tag beta`
jika Anda menginginkan dist-tag beta npm mentah untuk pembaruan paket sekali jalan.

Lihat [Saluran pengembangan](/id/install/development-channels) untuk semantik saluran.

## Beralih antara instalasi npm dan git

Gunakan saluran ketika Anda ingin mengubah jenis instalasi. Pembaru mempertahankan
state, konfigurasi, kredensial, dan workspace Anda di `~/.openclaw`; pembaru hanya mengubah
instalasi kode OpenClaw yang digunakan CLI dan gateway.

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

Saluran `dev` memastikan checkout git, membangunnya, dan memasang CLI global
dari checkout tersebut. Saluran `stable` dan `beta` menggunakan instalasi paket. Jika
gateway sudah terpasang, `openclaw update` menyegarkan metadata layanan
dan memulai ulangnya kecuali Anda meneruskan `--no-restart`.

## Alternatif: jalankan ulang installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk memaksa jenis instalasi tertentu melalui
installer, teruskan `--install-method git --no-onboard` atau
`--install-method npm --no-onboard`.

Jika `openclaw update` gagal setelah fase instalasi paket npm, jalankan ulang
installer. Installer tidak memanggil pembaru lama; installer menjalankan instalasi
paket global secara langsung dan dapat memulihkan instalasi npm yang sebagian sudah diperbarui.

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

Ketika `openclaw update` mengelola instalasi npm global, perintah ini memasang target ke
prefiks npm sementara terlebih dahulu, memverifikasi inventaris `dist` yang dikemas, lalu menukar
tree paket bersih ke prefiks global sebenarnya. Hal itu mencegah npm menimpa paket baru
di atas berkas lama dari paket sebelumnya. Jika perintah instalasi gagal,
OpenClaw mencoba sekali lagi dengan `--omit=optional`. Percobaan ulang itu membantu host tempat
dependensi opsional native tidak dapat dikompilasi, sekaligus tetap menampilkan kegagalan asli
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
    OpenClaw memperlakukan instalasi global yang dikemas sebagai hanya-baca saat runtime, bahkan ketika direktori paket global dapat ditulis oleh pengguna saat ini. Instalasi paket Plugin berada di root npm/git milik OpenClaw di bawah direktori konfigurasi pengguna, dan startup Gateway tidak mengubah tree paket OpenClaw.

    Beberapa pengaturan npm Linux memasang paket global di bawah direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak itu karena perintah instalasi/pembaruan plugin menulis di luar direktori paket global tersebut.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Berikan akses tulis OpenClaw ke root konfigurasi/state-nya agar instalasi plugin eksplisit, pembaruan plugin, dan pembersihan doctor dapat mempertahankan perubahannya:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Sebelum pembaruan paket dan instalasi plugin eksplisit, OpenClaw mencoba pemeriksaan ruang disk upaya-terbaik untuk volume target. Ruang rendah menghasilkan peringatan dengan path yang diperiksa, tetapi tidak memblokir pembaruan karena kuota sistem berkas, snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi package-manager aktual dan verifikasi pascainstalasi tetap menjadi sumber otoritatif.
  </Accordion>
</AccordionGroup>

## Pembaru otomatis

Pembaru otomatis mati secara default. Aktifkan di `~/.openclaw/openclaw.json`:

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
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik di seluruh `stableJitterHours` (peluncuran bertahap). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: setiap jam) dan langsung menerapkan.                              |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                                           |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).
Untuk downgrade atau pemulihan insiden, setel `OPENCLAW_NO_AUTO_UPDATE=1` di lingkungan gateway untuk memblokir penerapan otomatis bahkan ketika `update.auto.enabled` dikonfigurasi. Petunjuk pembaruan startup tetap dapat berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

Pembaruan package-manager yang diminta melalui handler control-plane Gateway live
memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah pertukaran paket. Hal itu
mencegah proses lama di memori tetap berjalan cukup lama untuk lazy-load chunk
dari tree paket yang sudah diganti. Shell `openclaw update`
tetap menjadi jalur yang disarankan untuk instalasi terawasi karena dapat menghentikan dan
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

### Kunci versi (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` menampilkan versi terbit saat ini.
</Tip>

### Kunci commit (sumber)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke yang terbaru: `git checkout main && git pull`.

## Jika Anda mengalami kebuntuan

- Jalankan `openclaw doctor` lagi dan baca output dengan cermat.
- Untuk `openclaw update --channel dev` pada checkout sumber, pembaru melakukan bootstrap otomatis `pnpm` saat diperlukan. Jika Anda melihat kesalahan bootstrap pnpm/corepack, pasang `pnpm` secara manual (atau aktifkan kembali `corepack`) dan jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ringkasan instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi mayor.
