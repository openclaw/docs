---
read_when:
    - Mencari dukungan OS atau jalur instalasi
    - Menentukan tempat menjalankan Gateway
summary: Ikhtisar dukungan platform (Gateway + app pendamping)
title: Platform
x-i18n:
    generated_at: "2026-04-05T13:59:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# Platform

OpenClaw core ditulis dalam TypeScript. **Node adalah runtime yang direkomendasikan**.
Bun tidak direkomendasikan untuk Gateway (bug WhatsApp/Telegram).

App pendamping tersedia untuk macOS (app menu bar) dan node seluler (iOS/Android). App pendamping Windows dan
Linux direncanakan, tetapi Gateway sudah didukung sepenuhnya saat ini.
App pendamping native untuk Windows juga direncanakan; Gateway direkomendasikan melalui WSL2.

## Pilih OS Anda

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS & hosting

- Pusat VPS: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/install/exe-dev)

## Tautan umum

- Panduan instalasi: [Getting Started](/start/getting-started)
- Runbook Gateway: [Gateway](/id/gateway)
- Konfigurasi Gateway: [Configuration](/id/gateway/configuration)
- Status layanan: `openclaw gateway status`

## Instalasi layanan Gateway (CLI)

Gunakan salah satu dari berikut ini (semuanya didukung):

- Wizard (direkomendasikan): `openclaw onboard --install-daemon`
- Langsung: `openclaw gateway install`
- Alur konfigurasi: `openclaw configure` → pilih **Gateway service**
- Perbaikan/migrasi: `openclaw doctor` (menawarkan untuk menginstal atau memperbaiki layanan)

Target layanan bergantung pada OS:

- macOS: LaunchAgent (`ai.openclaw.gateway` atau `ai.openclaw.<profile>`; lama `com.openclaw.*`)
- Linux/WSL2: layanan pengguna systemd (`openclaw-gateway[-<profile>].service`)
- Windows native: Scheduled Task (`OpenClaw Gateway` atau `OpenClaw Gateway (<profile>)`), dengan fallback item login folder Startup per pengguna jika pembuatan task ditolak
