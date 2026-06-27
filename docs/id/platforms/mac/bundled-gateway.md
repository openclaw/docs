---
read_when:
    - Mengemas OpenClaw.app
    - Men-debug layanan launchd Gateway macOS
    - Menginstal CLI Gateway untuk macOS
summary: Runtime Gateway di macOS (layanan launchd eksternal)
title: Gateway di macOS
x-i18n:
    generated_at: "2026-06-27T17:42:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app tidak lagi membundel Node/Bun atau runtime Gateway. Aplikasi macOS
mengharapkan instalasi CLI `openclaw` **eksternal**, tidak menjalankan Gateway sebagai
proses anak, dan mengelola layanan launchd per pengguna agar Gateway tetap
berjalan (atau terhubung ke Gateway lokal yang sudah ada jika sudah berjalan).

## Instal CLI (wajib untuk mode lokal)

Node 24 adalah runtime bawaan di Mac. Node 22 LTS, saat ini `22.19+`, masih berfungsi untuk kompatibilitas. Lalu instal `openclaw` secara global:

```bash
npm install -g openclaw@<version>
```

Tombol **Instal CLI** di aplikasi macOS menjalankan alur instalasi global yang sama dengan yang
digunakan aplikasi secara internal: aplikasi memprioritaskan npm terlebih dahulu, lalu pnpm, lalu bun jika itu satu-satunya
pengelola paket yang terdeteksi. Node tetap menjadi runtime Gateway yang direkomendasikan.

## Launchd (Gateway sebagai LaunchAgent)

Label:

- `ai.openclaw.gateway` (atau `ai.openclaw.<profile>`; legacy `com.openclaw.*` mungkin tetap ada)

Lokasi plist (per pengguna):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (atau `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Pengelola:

- Aplikasi macOS memiliki instalasi/pembaruan LaunchAgent dalam mode Lokal.
- CLI juga dapat menginstalnya: `openclaw gateway install`.

Perilaku:

- "OpenClaw Active" mengaktifkan/menonaktifkan LaunchAgent.
- Keluar dari aplikasi **tidak** menghentikan gateway (launchd menjaganya tetap aktif).
- Jika Gateway sudah berjalan pada port yang dikonfigurasi, aplikasi terhubung ke
  Gateway tersebut alih-alih memulai yang baru.

Logging:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (profil menggunakan `gateway-<profile>.log`)
- stderr launchd: ditekan

## Kompatibilitas versi

Aplikasi macOS memeriksa versi gateway terhadap versinya sendiri. Jika keduanya
tidak kompatibel, perbarui CLI global agar cocok dengan versi aplikasi.

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

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [Runbook Gateway](/id/gateway)
