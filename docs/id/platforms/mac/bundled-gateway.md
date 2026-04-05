---
read_when:
    - Memaketkan OpenClaw.app
    - Melakukan debug pada layanan launchd gateway di macOS
    - Menginstal CLI gateway untuk macOS
summary: Runtime Gateway di macOS (layanan launchd eksternal)
title: Gateway di macOS
x-i18n:
    generated_at: "2026-04-05T14:00:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# Gateway di macOS (launchd eksternal)

OpenClaw.app tidak lagi membundel Node/Bun atau runtime Gateway. Aplikasi macOS
mengharapkan instalasi CLI `openclaw` **eksternal**, tidak menjalankan Gateway sebagai
proses anak, dan mengelola layanan launchd per pengguna agar Gateway tetap
berjalan (atau terhubung ke Gateway lokal yang sudah ada jika sudah berjalan).

## Instal CLI (wajib untuk mode lokal)

Node 24 adalah runtime default di Mac. Node 22 LTS, saat ini `22.14+`, masih berfungsi untuk kompatibilitas. Lalu instal `openclaw` secara global:

```bash
npm install -g openclaw@<version>
```

Tombol **Install CLI** di aplikasi macOS menjalankan alur instalasi global yang sama
yang digunakan aplikasi secara internal: aplikasi akan mengutamakan npm, lalu pnpm, lalu bun jika itu satu-satunya
package manager yang terdeteksi. Node tetap menjadi runtime Gateway yang direkomendasikan.

## Launchd (Gateway sebagai LaunchAgent)

Label:

- `ai.openclaw.gateway` (atau `ai.openclaw.<profile>`; `com.openclaw.*` lama mungkin masih ada)

Lokasi plist (per pengguna):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (atau `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manajer:

- Aplikasi macOS memiliki LaunchAgent untuk instalasi/pembaruan dalam mode Lokal.
- CLI juga dapat menginstalnya: `openclaw gateway install`.

Perilaku:

- “OpenClaw Active” mengaktifkan/menonaktifkan LaunchAgent.
- Menutup aplikasi **tidak** menghentikan gateway (launchd akan tetap menjaganya berjalan).
- Jika Gateway sudah berjalan pada port yang dikonfigurasi, aplikasi akan terhubung
  ke sana alih-alih memulai yang baru.

Logging:

- stdout/err launchd: `/tmp/openclaw/openclaw-gateway.log`

## Kompatibilitas versi

Aplikasi macOS memeriksa versi gateway terhadap versinya sendiri. Jika tidak
kompatibel, perbarui CLI global agar sesuai dengan versi aplikasi.

## Pemeriksaan smoke

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Lalu:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
