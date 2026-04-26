---
read_when:
    - Memperbarui OpenClaw
    - Ada sesuatu yang rusak setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau source), plus strategi rollback
title: Memperbarui
x-i18n:
    generated_at: "2026-04-26T11:33:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

Jaga OpenClaw tetap mutakhir.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi tipe instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang gateway.

```bash
openclaw update
```

Untuk berpindah channel atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # pratinjau tanpa menerapkan
```

`--channel beta` lebih memilih beta, tetapi runtime akan fallback ke stable/latest ketika
tag beta tidak ada atau lebih lama daripada rilis stable terbaru. Gunakan `--tag beta`
jika Anda menginginkan npm dist-tag beta mentah untuk pembaruan paket satu kali.

Lihat [Channel pengembangan](/id/install/development-channels) untuk semantik channel.

## Beralih antara instalasi npm dan git

Gunakan channel saat Anda ingin mengubah tipe instalasi. Updater mempertahankan
status, konfigurasi, kredensial, dan workspace Anda di `~/.openclaw`; updater hanya mengubah
instalasi kode OpenClaw mana yang digunakan CLI dan gateway.

```bash
# instalasi paket npm -> checkout git yang dapat diedit
openclaw update --channel dev

# checkout git -> instalasi paket npm
openclaw update --channel stable
```

Jalankan dengan `--dry-run` terlebih dahulu untuk mempratinjau perpindahan mode instalasi yang tepat:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Channel `dev` memastikan checkout git, membangunnya, dan memasang CLI global
dari checkout tersebut. Channel `stable` dan `beta` menggunakan instalasi paket. Jika
gateway sudah terpasang, `openclaw update` menyegarkan metadata layanan
dan memulai ulangnya kecuali Anda memberikan `--no-restart`.

## Alternatif: jalankan ulang installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk memaksa tipe instalasi tertentu melalui
installer, berikan `--install-method git --no-onboard` atau
`--install-method npm --no-onboard`.

## Alternatif: npm, pnpm, atau bun manual

```bash
npm i -g openclaw@latest
```

Saat `openclaw update` mengelola instalasi npm global, pertama-tama OpenClaw menjalankan
perintah instalasi global normal. Jika perintah itu gagal, OpenClaw mencoba ulang sekali dengan
`--omit=optional`. Retry tersebut membantu host di mana dependensi opsional native
tidak dapat dikompilasi, sambil tetap menjaga kegagalan asli terlihat jika fallback juga
gagal.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Instalasi npm global dan dependensi runtime

OpenClaw memperlakukan instalasi global yang dikemas sebagai read-only saat runtime, bahkan ketika
direktori paket global dapat ditulis oleh pengguna saat ini. Dependensi runtime Plugin bawaan
ditaruh di direktori runtime yang dapat ditulis alih-alih memutasi
tree paket. Ini mencegah `openclaw update` berlomba dengan gateway yang sedang berjalan atau
agen lokal yang sedang memperbaiki dependensi Plugin selama instalasi yang sama.

Beberapa penyiapan npm Linux memasang paket global di bawah direktori milik root seperti
`/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak tersebut melalui
jalur staging eksternal yang sama.

Untuk unit systemd yang diperkeras, set direktori stage yang dapat ditulis dan disertakan dalam
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Jika `OPENCLAW_PLUGIN_STAGE_DIR` tidak diset, OpenClaw menggunakan `$STATE_DIRECTORY` ketika
systemd menyediakannya, lalu fallback ke `~/.openclaw/plugin-runtime-deps`.
Langkah perbaikan memperlakukan stage itu sebagai root paket lokal milik OpenClaw dan
mengabaikan pengaturan npm prefix/global pengguna, sehingga konfigurasi npm instalasi global tidak
mengalihkan dependensi Plugin bawaan ke `~/node_modules` atau tree paket global.

Sebelum pembaruan paket dan perbaikan dependensi runtime bawaan, OpenClaw mencoba
pemeriksaan ruang disk best-effort untuk volume target. Ruang rendah menghasilkan peringatan
dengan path yang diperiksa, tetapi tidak memblokir pembaruan karena kuota filesystem,
snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi npm, copy, dan verifikasi pasca-instalasi yang sebenarnya tetap menjadi penentu.

### Dependensi runtime Plugin bawaan

Instalasi yang dikemas menjaga dependensi runtime Plugin bawaan tetap di luar tree paket
read-only. Saat startup dan selama `openclaw doctor --fix`, OpenClaw memperbaiki
dependensi runtime hanya untuk Plugin bawaan yang aktif dalam konfigurasi, aktif
melalui konfigurasi saluran lama, atau diaktifkan oleh default manifest bawaan mereka.
Status auth saluran yang dipersistenkan saja tidak memicu perbaikan dependensi runtime
startup Gateway.

Penonaktifan eksplisit selalu menang. Plugin atau saluran yang dinonaktifkan tidak akan mendapatkan
perbaikan dependensi runtime hanya karena ada di dalam paket. Plugin eksternal dan jalur load kustom tetap menggunakan `openclaw plugins install` atau
`openclaw plugins update`.

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
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: per jam) dan langsung menerapkan.                        |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                       |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).

## Setelah memperbarui

<Steps>

### Jalankan doctor

```bash
openclaw doctor
```

Memigrasikan konfigurasi, mengaudit kebijakan DM, dan memeriksa health gateway. Detail: [Doctor](/id/gateway/doctor)

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

### Pin ke sebuah versi (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Tip: `npm view openclaw version` menampilkan versi yang sedang dipublikasikan saat ini.

### Pin ke sebuah commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke versi terbaru: `git checkout main && git pull`.

## Jika Anda buntu

- Jalankan `openclaw doctor` lagi dan baca output dengan saksama.
- Untuk `openclaw update --channel dev` pada checkout source, updater akan otomatis mem-bootstrap `pnpm` bila diperlukan. Jika Anda melihat error bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) lalu jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanya di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ringkasan Instalasi](/id/install) — semua metode instalasi
- [Doctor](/id/gateway/doctor) — pemeriksaan health setelah pembaruan
- [Migrasi](/id/install/migrating) — panduan migrasi versi mayor
