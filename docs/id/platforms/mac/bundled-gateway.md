---
read_when:
    - Pengemasan OpenClaw.app
    - Men-debug layanan launchd Gateway macOS
    - Menginstal CLI Gateway untuk macOS
summary: Lingkungan eksekusi Gateway di macOS (layanan launchd eksternal)
title: Gateway di macOS
x-i18n:
    generated_at: "2026-05-06T09:19:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app tidak lagi membundel Node/Bun atau runtime Gateway. Aplikasi macOS
mengharapkan instalasi CLI `openclaw` **eksternal**, tidak menjalankan Gateway sebagai
proses anak, dan mengelola layanan launchd per pengguna agar Gateway tetap
berjalan (atau terhubung ke Gateway lokal yang sudah ada jika sudah berjalan).

## Instal CLI (wajib untuk mode lokal)

Node 24 adalah runtime default di Mac. Node 22 LTS, saat ini `22.14+`, masih berfungsi untuk kompatibilitas. Lalu instal `openclaw` secara global:

```bash
npm install -g openclaw@<version>
```

Tombol **Instal CLI** pada aplikasi macOS menjalankan alur instalasi global yang sama dengan yang digunakan aplikasi
secara internal: aplikasi memprioritaskan npm terlebih dahulu, lalu pnpm, lalu bun jika itu satu-satunya
pengelola paket yang terdeteksi. Node tetap menjadi runtime Gateway yang direkomendasikan.

## Launchd (Gateway sebagai LaunchAgent)

Label:

- `ai.openclaw.gateway` (atau `ai.openclaw.<profile>`; `com.openclaw.*` lama mungkin tetap ada)

Lokasi plist (per pengguna):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (atau `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Pengelola:

- Aplikasi macOS mengelola instalasi/pembaruan LaunchAgent dalam mode Lokal.
- CLI juga dapat menginstalnya: `openclaw gateway install`.

Perilaku:

- "OpenClaw Aktif" mengaktifkan/menonaktifkan LaunchAgent.
- Keluar dari aplikasi **tidak** menghentikan gateway (launchd menjaganya tetap hidup).
- Jika Gateway sudah berjalan pada port yang dikonfigurasi, aplikasi akan terhubung ke
  Gateway tersebut alih-alih memulai yang baru.

Logging:

- stdout/err launchd: `/tmp/openclaw/openclaw-gateway.log`

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
