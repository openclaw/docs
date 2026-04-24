---
read_when:
    - Memperbarui OpenClaw
    - Ada sesuatu yang rusak setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau source), plus strategi rollback
title: Memperbarui
x-i18n:
    generated_at: "2026-04-24T09:14:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

Jaga OpenClaw tetap mutakhir.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang gateway.

```bash
openclaw update
```

Untuk mengganti channel atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # pratinjau tanpa menerapkan
```

`--channel beta` mengutamakan beta, tetapi runtime akan fallback ke stable/latest saat
tag beta tidak ada atau lebih lama dari rilis stable terbaru. Gunakan `--tag beta`
jika Anda menginginkan dist-tag beta npm mentah untuk pembaruan paket satu kali.

Lihat [Channel pengembangan](/id/install/development-channels) untuk semantik channel.

## Alternatif: jalankan ulang installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk instalasi source, berikan `--install-method git --no-onboard`.

## Alternatif: npm, pnpm, atau bun manual

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Instalasi npm global milik root

Beberapa penyiapan npm Linux menginstal paket global di bawah direktori milik root seperti
`/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak itu: paket yang diinstal
diperlakukan sebagai read-only saat runtime, dan dependensi runtime Plugin bawaan
di-stage ke direktori runtime yang dapat ditulis alih-alih memodifikasi
pohon paket.

Untuk unit systemd yang diperketat, atur direktori stage yang dapat ditulis dan disertakan dalam
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Jika `OPENCLAW_PLUGIN_STAGE_DIR` tidak diatur, OpenClaw menggunakan `$STATE_DIRECTORY` saat
systemd menyediakannya, lalu fallback ke `~/.openclaw/plugin-runtime-deps`.

## Auto-updater

Auto-updater dinonaktifkan secara default. Aktifkan di `~/.openclaw/openclaw.json`:

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
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik di sepanjang `stableJitterHours` (rollout tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: tiap jam) dan langsung menerapkan.                       |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                       |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).

## Setelah memperbarui

<Steps>

### Jalankan doctor

```bash
openclaw doctor
```

Memigrasikan config, mengaudit kebijakan DM, dan memeriksa kesehatan gateway. Detail: [Doctor](/id/gateway/doctor)

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

### Pin versi (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Tip: `npm view openclaw version` menampilkan versi yang saat ini dipublikasikan.

### Pin commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke terbaru: `git checkout main && git pull`.

## Jika Anda buntu

- Jalankan `openclaw doctor` lagi dan baca outputnya dengan cermat.
- Untuk `openclaw update --channel dev` pada checkout source, updater secara otomatis mem-bootstrap `pnpm` saat diperlukan. Jika Anda melihat error bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) lalu jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar Instalasi](/id/install) — semua metode instalasi
- [Doctor](/id/gateway/doctor) — pemeriksaan kesehatan setelah pembaruan
- [Migrating](/id/install/migrating) — panduan migrasi versi mayor
