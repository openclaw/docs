---
read_when:
    - Memperbarui OpenClaw
    - Terjadi masalah setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau dari sumber), serta strategi pengembalian
title: Memperbarui
x-i18n:
    generated_at: "2026-05-04T07:06:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

Jaga OpenClaw tetap mutakhir.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang gateway.

```bash
openclaw update
```

Untuk beralih channel atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` tidak menerima `--verbose`. Untuk diagnostik pembaruan, gunakan
`--dry-run` untuk melihat pratinjau tindakan yang direncanakan, `--json` untuk hasil terstruktur, atau
`openclaw update status --json` untuk memeriksa status channel dan ketersediaan. Installer
memiliki flag `--verbose` sendiri, tetapi flag tersebut bukan bagian dari
`openclaw update`.

`--channel beta` mengutamakan beta, tetapi runtime kembali ke stable/latest ketika
tag beta hilang atau lebih lama daripada rilis stable terbaru. Gunakan `--tag beta`
jika Anda menginginkan dist-tag beta npm mentah untuk pembaruan paket sekali pakai.

Lihat [Channel pengembangan](/id/install/development-channels) untuk semantik channel.

## Beralih antara instalasi npm dan git

Gunakan channel saat Anda ingin mengubah jenis instalasi. Updater mempertahankan
status, konfigurasi, kredensial, dan workspace Anda di `~/.openclaw`; updater hanya mengubah
instalasi kode OpenClaw mana yang digunakan CLI dan gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Jalankan dengan `--dry-run` terlebih dahulu untuk melihat pratinjau peralihan mode instalasi yang tepat:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Channel `dev` memastikan checkout git, membangunnya, dan menginstal CLI global
dari checkout tersebut. Channel `stable` dan `beta` menggunakan instalasi paket. Jika
gateway sudah terinstal, `openclaw update` menyegarkan metadata layanan
dan memulai ulang layanan kecuali Anda meneruskan `--no-restart`.

## Alternatif: jalankan ulang installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk memaksa jenis instalasi tertentu melalui
installer, teruskan `--install-method git --no-onboard` atau
`--install-method npm --no-onboard`.

Jika `openclaw update` gagal setelah fase instalasi paket npm, jalankan ulang
installer. Installer tidak memanggil updater lama; installer menjalankan instalasi
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

Utamakan `openclaw update` untuk instalasi yang diawasi karena perintah ini dapat mengoordinasikan
pertukaran paket dengan layanan Gateway yang sedang berjalan. Jika Anda memperbarui secara manual saat
Gateway terkelola sedang berjalan, mulai ulang Gateway segera setelah package manager
selesai agar proses lama tidak terus melayani dari file paket yang telah diganti.

Saat `openclaw update` mengelola instalasi npm global, perintah ini terlebih dahulu menginstal target ke
prefix npm sementara, memverifikasi inventaris `dist` dalam paket, lalu menukar
pohon paket bersih ke prefix global yang sebenarnya. Itu mencegah npm menimpa
paket baru di atas file usang dari paket lama. Jika perintah instalasi gagal,
OpenClaw mencoba sekali lagi dengan `--omit=optional`. Percobaan ulang tersebut membantu host tempat
dependensi opsional native tidak dapat dikompilasi, sambil tetap menampilkan kegagalan asli
jika fallback juga gagal.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Topik instalasi npm lanjutan

<AccordionGroup>
  <Accordion title="Pohon paket hanya baca">
    OpenClaw memperlakukan instalasi global dalam paket sebagai hanya baca saat runtime, bahkan ketika direktori paket global dapat ditulis oleh pengguna saat ini. Instalasi paket Plugin berada di root npm/git milik OpenClaw di bawah direktori konfigurasi pengguna, dan startup Gateway tidak mengubah pohon paket OpenClaw.

    Beberapa pengaturan npm Linux menginstal paket global di bawah direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak tersebut karena perintah instalasi/pembaruan plugin menulis di luar direktori paket global tersebut.

  </Accordion>
  <Accordion title="Unit systemd yang diperkeras">
    Beri OpenClaw akses tulis ke root konfigurasi/statusnya agar instalasi plugin eksplisit, pembaruan plugin, dan pembersihan doctor dapat mempertahankan perubahannya:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Preflight ruang disk">
    Sebelum pembaruan paket dan instalasi plugin eksplisit, OpenClaw mencoba pemeriksaan ruang disk best-effort untuk volume target. Ruang yang rendah menghasilkan peringatan dengan jalur yang diperiksa, tetapi tidak memblokir pembaruan karena kuota filesystem, snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi package-manager aktual dan verifikasi pascainstalasi tetap menjadi acuan otoritatif.
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

| Channel  | Perilaku                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik di seluruh `stableJitterHours` (rollout tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: tiap jam) dan langsung menerapkan.                              |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                                           |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).
Untuk downgrade atau pemulihan insiden, tetapkan `OPENCLAW_NO_AUTO_UPDATE=1` di lingkungan gateway untuk memblokir penerapan otomatis bahkan ketika `update.auto.enabled` dikonfigurasi. Petunjuk pembaruan startup masih dapat berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

Pembaruan package-manager yang diminta melalui handler control-plane Gateway live
memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah pertukaran paket. Itu
menghindari proses lama dalam memori tetap berjalan cukup lama untuk lazy-load chunk
dari pohon paket yang sudah diganti. Shell `openclaw update`
tetap menjadi jalur yang disukai untuk instalasi yang diawasi karena dapat menghentikan dan
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
`npm view openclaw version` menampilkan versi yang saat ini dipublikasikan.
</Tip>

### Sematkan commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke yang terbaru: `git checkout main && git pull`.

## Jika Anda terhenti

- Jalankan `openclaw doctor` lagi dan baca output dengan cermat.
- Untuk `openclaw update --channel dev` pada checkout source, updater melakukan bootstrap otomatis `pnpm` saat diperlukan. Jika Anda melihat error bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) dan jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Bertanya di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi mayor.
