---
read_when:
    - Mencari dukungan OS atau jalur instalasi
    - Memutuskan di mana menjalankan Gateway
summary: Ikhtisar dukungan platform (Gateway + aplikasi pendamping)
title: Platform
x-i18n:
    generated_at: "2026-06-27T17:41:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core ditulis dalam TypeScript. **Node adalah runtime yang direkomendasikan**.
Bun tidak direkomendasikan untuk Gateway — ada masalah yang diketahui dengan kanal WhatsApp dan
Telegram; lihat [Bun (eksperimental)](/id/install/bun) untuk detail.

Aplikasi pendamping tersedia untuk Windows Hub, macOS (aplikasi bilah menu), dan node seluler
(iOS/Android). Aplikasi pendamping Linux direncanakan, tetapi Gateway sudah didukung sepenuhnya
saat ini. Di Windows, pilih Windows Hub untuk aplikasi desktop, instalasi PowerShell native
untuk penggunaan yang berfokus pada terminal, atau WSL2 untuk runtime Gateway yang paling
kompatibel dengan Linux.

## Pilih OS Anda

- macOS: [macOS](/id/platforms/macos)
- iOS: [iOS](/id/platforms/ios)
- Android: [Android](/id/platforms/android)
- Windows: [Windows](/id/platforms/windows)
- Linux: [Linux](/id/platforms/linux)

## VPS dan hosting

- Hub VPS: [Hosting VPS](/id/vps)
- Fly.io: [Fly.io](/id/install/fly)
- Hetzner (Docker): [Hetzner](/id/install/hetzner)
- GCP (Compute Engine): [GCP](/id/install/gcp)
- Azure (VM Linux): [Azure](/id/install/azure)
- exe.dev (VM + proksi HTTPS): [exe.dev](/id/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/id/platforms/easyrunner)

## Tautan umum

- Panduan instalasi: [Memulai](/id/start/getting-started)
- Windows Hub: [Windows](/id/platforms/windows)
- Runbook Gateway: [Gateway](/id/gateway)
- Konfigurasi Gateway: [Konfigurasi](/id/gateway/configuration)
- Status layanan: `openclaw gateway status`

## Instalasi layanan Gateway (CLI)

Gunakan salah satu dari ini (semuanya didukung):

- Wizard (direkomendasikan): `openclaw onboard --install-daemon`
- Langsung: `openclaw gateway install`
- Alur konfigurasi: `openclaw configure` → pilih **Layanan Gateway**
- Perbaiki/migrasikan: `openclaw doctor` (menawarkan untuk menginstal atau memperbaiki layanan)

Target layanan bergantung pada OS:

- macOS: LaunchAgent (`ai.openclaw.gateway` atau `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: layanan pengguna systemd (`openclaw-gateway[-<profile>].service`)
- Windows native: Scheduled Task (`OpenClaw Gateway` atau `OpenClaw Gateway (<profile>)`), dengan fallback item login folder Startup per pengguna jika pembuatan task ditolak

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Windows Hub](/id/platforms/windows)
- [Aplikasi macOS](/id/platforms/macos)
- [Aplikasi iOS](/id/platforms/ios)
