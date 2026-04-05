---
read_when:
    - Memperbarui OpenClaw
    - Ada yang rusak setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau source), ditambah strategi rollback
title: Pembaruan
x-i18n:
    generated_at: "2026-04-05T13:59:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b40429d38ca851be4fdf8063ed425faf4610a4b5772703e0481c5f1fb588ba58
    source_path: install/updating.md
    workflow: 15
---

# Pembaruan

Jaga OpenClaw tetap terbaru.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan me-restart gateway.

```bash
openclaw update
```

Untuk mengganti channel atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # pratinjau tanpa menerapkan
```

`--channel beta` memprioritaskan beta, tetapi runtime akan fallback ke stable/latest ketika
tag beta tidak ada atau lebih lama daripada rilis stable terbaru. Gunakan `--tag beta`
jika Anda menginginkan raw npm beta dist-tag untuk pembaruan paket satu kali.

Lihat [Development channels](/install/development-channels) untuk semantik channel.

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
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: tiap jam) dan langsung menerapkan.                       |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                       |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).

## Setelah memperbarui

<Steps>

### Jalankan doctor

```bash
openclaw doctor
```

Memigrasikan konfigurasi, mengaudit kebijakan DM, dan memeriksa kesehatan gateway. Detail: [Doctor](/id/gateway/doctor)

### Restart gateway

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

Untuk kembali ke versi terbaru: `git checkout main && git pull`.

## Jika Anda buntu

- Jalankan `openclaw doctor` lagi dan baca outputnya dengan cermat.
- Periksa: [Troubleshooting](/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar Instalasi](/install) — semua metode instalasi
- [Doctor](/id/gateway/doctor) — pemeriksaan kesehatan setelah pembaruan
- [Migrating](/install/migrating) — panduan migrasi versi mayor
