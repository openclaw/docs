---
read_when:
    - Memperbarui OpenClaw
    - Terjadi masalah setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau dari sumber), serta strategi pengembalian ke versi sebelumnya
title: Memperbarui
x-i18n:
    generated_at: "2026-04-30T09:57:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

Selalu perbarui OpenClaw.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang Gateway.

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

`--channel beta` memprioritaskan beta, tetapi runtime akan kembali ke stable/latest ketika
tag beta tidak ada atau lebih lama dari rilis stabil terbaru. Gunakan `--tag beta`
jika Anda menginginkan dist-tag beta npm mentah untuk pembaruan paket satu kali.

Lihat [Kanal pengembangan](/id/install/development-channels) untuk semantik kanal.

## Beralih antara instalasi npm dan git

Gunakan kanal ketika Anda ingin mengubah jenis instalasi. Pembaru mempertahankan
status, konfigurasi, kredensial, dan workspace Anda di `~/.openclaw`; ini hanya mengubah
instalasi kode OpenClaw mana yang digunakan oleh CLI dan Gateway.

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
penginstal. Penginstal tidak memanggil pembaru lama; ia menjalankan instalasi
paket global secara langsung dan dapat memulihkan instalasi npm yang sebagian sudah diperbarui.

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

Ketika `openclaw update` mengelola instalasi npm global, ia terlebih dahulu menginstal target ke
prefiks npm sementara, memverifikasi inventaris `dist` yang dipaketkan, lalu menukar
pohon paket bersih ke prefiks global yang sebenarnya. Itu mencegah npm menimpa
paket baru di atas berkas basi dari paket lama. Jika perintah instalasi gagal,
OpenClaw mencoba ulang sekali dengan `--omit=optional`. Percobaan ulang itu membantu host tempat
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
  <Accordion title="Pohon paket hanya-baca">
    OpenClaw memperlakukan instalasi global yang dipaketkan sebagai hanya-baca saat runtime, bahkan ketika direktori paket global dapat ditulis oleh pengguna saat ini. Dependensi runtime Plugin bawaan ditempatkan ke direktori runtime yang dapat ditulis alih-alih mengubah pohon paket. Ini mencegah `openclaw update` bersaing dengan Gateway yang sedang berjalan atau agen lokal yang sedang memperbaiki dependensi Plugin selama instalasi yang sama.

    Beberapa penyiapan npm Linux menginstal paket global di bawah direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak itu melalui jalur staging eksternal yang sama.

  </Accordion>
  <Accordion title="Unit systemd yang diperkuat">
    Tetapkan direktori stage yang dapat ditulis yang disertakan dalam `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` juga menerima daftar jalur. OpenClaw menyelesaikan dependensi runtime Plugin bawaan dari kiri ke kanan di seluruh root yang tercantum, memperlakukan root awal sebagai lapisan prainstal hanya-baca, dan menginstal atau memperbaiki hanya ke root akhir yang dapat ditulis:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Jika `OPENCLAW_PLUGIN_STAGE_DIR` tidak disetel, OpenClaw menggunakan `$STATE_DIRECTORY` ketika systemd menyediakannya, lalu kembali ke `~/.openclaw/plugin-runtime-deps`. Langkah perbaikan memperlakukan stage tersebut sebagai root paket lokal milik OpenClaw dan mengabaikan prefiks npm pengguna serta pengaturan global, sehingga konfigurasi npm instalasi global tidak mengalihkan dependensi Plugin bawaan ke `~/node_modules` atau pohon paket global.

  </Accordion>
  <Accordion title="Pemeriksaan awal ruang disk">
    Sebelum pembaruan paket dan perbaikan dependensi runtime bawaan, OpenClaw mencoba pemeriksaan ruang disk upaya-terbaik untuk volume target. Ruang rendah menghasilkan peringatan dengan jalur yang diperiksa, tetapi tidak memblokir pembaruan karena kuota sistem berkas, snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi npm, penyalinan, dan verifikasi pascainstal yang sebenarnya tetap menjadi sumber otoritatif.
  </Accordion>
  <Accordion title="Dependensi runtime Plugin bawaan">
    Instalasi yang dipaketkan menjaga dependensi runtime Plugin bawaan tetap di luar pohon paket hanya-baca. Saat startup dan selama `openclaw doctor --fix`, OpenClaw memperbaiki dependensi runtime hanya untuk Plugin bawaan yang aktif di konfigurasi, aktif melalui konfigurasi kanal lama, atau diaktifkan oleh default manifes bawaannya. Status auth kanal yang dipersistenkan saja tidak memicu perbaikan dependensi runtime startup Gateway.

    Penonaktifan eksplisit menang. Plugin atau kanal yang dinonaktifkan tidak akan mendapatkan dependensi runtime-nya diperbaiki hanya karena ia ada di paket. Plugin eksternal dan jalur muat kustom tetap menggunakan `openclaw plugins install` atau `openclaw plugins update`.

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
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik di seluruh `stableJitterHours` (rollout tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: setiap jam) dan langsung menerapkan.                              |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                                           |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).
Untuk downgrade atau pemulihan insiden, setel `OPENCLAW_NO_AUTO_UPDATE=1` di lingkungan Gateway untuk memblokir penerapan otomatis bahkan ketika `update.auto.enabled` dikonfigurasi. Petunjuk pembaruan startup tetap dapat berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

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

Untuk kembali ke yang terbaru: `git checkout main && git pull`.

## Jika Anda terjebak

- Jalankan `openclaw doctor` lagi dan baca output dengan saksama.
- Untuk `openclaw update --channel dev` pada checkout sumber, pembaru melakukan bootstrap otomatis `pnpm` saat diperlukan. Jika Anda melihat kesalahan bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) dan jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanya di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi utama.
