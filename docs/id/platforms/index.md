---
read_when:
    - Mencari dukungan OS atau jalur instalasi
    - Menentukan tempat untuk menjalankan Gateway
summary: Ikhtisar dukungan platform (Gateway + aplikasi pendamping)
title: Platform
x-i18n:
    generated_at: "2026-07-16T18:14:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

Inti OpenClaw ditulis dalam TypeScript. **Node adalah runtime yang diwajibkan** karena
penyimpanan status kanonis menggunakan `node:sqlite`. Bun tetap tersedia untuk
instalasi dependensi dan skrip paket; lihat [Bun](/id/install/bun).

Aplikasi pendamping tersedia untuk Windows Hub, macOS (aplikasi bilah menu), dan node seluler
(iOS/Android). Aplikasi pendamping Linux direncanakan, tetapi Gateway saat ini
didukung sepenuhnya. Di Windows, pilih Windows Hub untuk aplikasi desktop, instalasi
PowerShell native untuk penggunaan yang mengutamakan terminal, atau WSL2 untuk runtime Gateway yang paling
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
- Panduan operasional Gateway: [Gateway](/id/gateway)
- Konfigurasi Gateway: [Konfigurasi](/id/gateway/configuration)
- Status layanan: `openclaw gateway status`

## Instalasi layanan Gateway (CLI)

Gunakan salah satu dari pilihan berikut (semuanya didukung):

- Wizard (disarankan): `openclaw onboard --install-daemon`
- Langsung: `openclaw gateway install`
- Alur konfigurasi: `openclaw configure` → pilih **Gateway service**
- Perbaikan/migrasi: `openclaw doctor` (menawarkan instalasi atau perbaikan layanan)

Target layanan bergantung pada OS:

- macOS: LaunchAgent (`ai.openclaw.gateway`, atau `ai.openclaw.<profile>` untuk profil bernama)
- Linux/WSL2: layanan pengguna systemd (`openclaw-gateway[-<profile>].service`)
- Windows native: Scheduled Task (`OpenClaw Gateway` atau `OpenClaw Gateway (<profile>)`), dengan item masuk folder Startup per pengguna sebagai fallback jika pembuatan tugas ditolak

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Windows Hub](/id/platforms/windows)
- [Aplikasi macOS](/id/platforms/macos)
- [Aplikasi iOS](/id/platforms/ios)
