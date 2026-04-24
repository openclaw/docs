---
read_when:
    - Memaketkan OpenClaw.app
    - Men-debug layanan launchd gateway macOS
    - Menginstal CLI gateway untuk macOS
summary: Runtime Gateway di macOS (layanan launchd eksternal)
title: Gateway di macOS
x-i18n:
    generated_at: "2026-04-24T09:16:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app tidak lagi membundel Node/Bun atau runtime Gateway. Aplikasi macOS
mengharapkan instalasi CLI `openclaw` **eksternal**, tidak menjalankan Gateway sebagai
child process, dan mengelola layanan launchd per pengguna untuk menjaga Gateway tetap
berjalan (atau menempel ke Gateway lokal yang sudah ada jika memang sudah berjalan).

## Instal CLI (wajib untuk mode lokal)

Node 24 adalah runtime default di Mac. Node 22 LTS, saat ini `22.14+`, masih berfungsi untuk kompatibilitas. Lalu instal `openclaw` secara global:

```bash
npm install -g openclaw@<version>
```

Tombol **Install CLI** di aplikasi macOS menjalankan alur instalasi global yang sama dengan yang
digunakan aplikasi secara internal: aplikasi ini lebih mengutamakan npm, lalu pnpm, lalu bun jika itu satu-satunya
package manager yang terdeteksi. Node tetap menjadi runtime Gateway yang direkomendasikan.

## Launchd (Gateway sebagai LaunchAgent)

Label:

- `ai.openclaw.gateway` (atau `ai.openclaw.<profile>`; `com.openclaw.*` lama mungkin masih ada)

Lokasi plist (per pengguna):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (atau `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manajer:

- Aplikasi macOS memiliki instalasi/pembaruan LaunchAgent dalam mode Lokal.
- CLI juga dapat menginstalnya: `openclaw gateway install`.

Perilaku:

- “OpenClaw Active” mengaktifkan/menonaktifkan LaunchAgent.
- Keluar dari aplikasi **tidak** menghentikan gateway (launchd menjaganya tetap hidup).
- Jika Gateway sudah berjalan pada port yang dikonfigurasi, aplikasi akan menempel
  ke sana alih-alih memulai yang baru.

Logging:

- stdout/err launchd: `/tmp/openclaw/openclaw-gateway.log`

## Kompatibilitas versi

Aplikasi macOS memeriksa versi gateway terhadap versinya sendiri. Jika keduanya
tidak kompatibel, perbarui CLI global agar cocok dengan versi aplikasi.

## Smoke check

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

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Runbook Gateway](/id/gateway)
