---
read_when:
    - Mencari dukungan OS atau jalur instalasi
    - Menentukan tempat menjalankan Gateway
summary: Ikhtisar dukungan platform (Gateway + aplikasi pendamping)
title: Platform
x-i18n:
    generated_at: "2026-04-24T09:16:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

Inti OpenClaw ditulis dalam TypeScript. **Node adalah runtime yang direkomendasikan**.
Bun tidak direkomendasikan untuk Gateway — ada masalah yang diketahui dengan saluran WhatsApp dan
Telegram; lihat [Bun (eksperimental)](/id/install/bun) untuk detail.

Aplikasi pendamping tersedia untuk macOS (aplikasi menu bar) dan node seluler (iOS/Android). Aplikasi pendamping Windows dan
Linux direncanakan, tetapi Gateway sudah didukung penuh saat ini.
Aplikasi pendamping native untuk Windows juga direncanakan; Gateway direkomendasikan melalui WSL2.

## Pilih OS Anda

- macOS: [macOS](/id/platforms/macos)
- iOS: [iOS](/id/platforms/ios)
- Android: [Android](/id/platforms/android)
- Windows: [Windows](/id/platforms/windows)
- Linux: [Linux](/id/platforms/linux)

## VPS & hosting

- Pusat VPS: [Hosting VPS](/id/vps)
- Fly.io: [Fly.io](/id/install/fly)
- Hetzner (Docker): [Hetzner](/id/install/hetzner)
- GCP (Compute Engine): [GCP](/id/install/gcp)
- Azure (Linux VM): [Azure](/id/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/id/install/exe-dev)

## Tautan umum

- Panduan instalasi: [Getting Started](/id/start/getting-started)
- Runbook Gateway: [Gateway](/id/gateway)
- Konfigurasi Gateway: [Configuration](/id/gateway/configuration)
- Status layanan: `openclaw gateway status`

## Instalasi layanan Gateway (CLI)

Gunakan salah satu dari ini (semuanya didukung):

- Wizard (disarankan): `openclaw onboard --install-daemon`
- Langsung: `openclaw gateway install`
- Alur configure: `openclaw configure` → pilih **Gateway service**
- Perbaikan/migrasi: `openclaw doctor` (menawarkan untuk menginstal atau memperbaiki layanan)

Target layanan bergantung pada OS:

- macOS: LaunchAgent (`ai.openclaw.gateway` atau `ai.openclaw.<profile>`; `com.openclaw.*` lama)
- Linux/WSL2: layanan pengguna systemd (`openclaw-gateway[-<profile>].service`)
- Windows native: Scheduled Task (`OpenClaw Gateway` atau `OpenClaw Gateway (<profile>)`), dengan fallback item login Startup-folder per pengguna jika pembuatan task ditolak

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Aplikasi macOS](/id/platforms/macos)
- [Aplikasi iOS](/id/platforms/ios)
