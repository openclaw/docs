---
read_when:
    - Mencari dukungan OS atau jalur instalasi
    - Menentukan tempat menjalankan Gateway
summary: Ikhtisar dukungan platform (Gateway + aplikasi pendamping)
title: Platform
x-i18n:
    generated_at: "2026-07-12T14:21:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

Inti OpenClaw ditulis dalam TypeScript. **Node adalah runtime yang direkomendasikan**.
Bun tidak direkomendasikan untuk Gateway — terdapat masalah yang diketahui pada kanal WhatsApp dan
Telegram; lihat [Bun (eksperimental)](/id/install/bun) untuk detailnya.

Aplikasi pendamping tersedia untuk Windows Hub, macOS (aplikasi bilah menu), dan node seluler
(iOS/Android). Aplikasi pendamping Linux direncanakan, tetapi Gateway sudah
didukung sepenuhnya saat ini. Di Windows, pilih Windows Hub untuk aplikasi desktop, instalasi
PowerShell native untuk penggunaan yang mengutamakan terminal, atau WSL2 untuk runtime Gateway yang
paling kompatibel dengan Linux.

## Pilih sistem operasi Anda

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

Gunakan salah satu opsi berikut (semuanya didukung):

- Wizard (direkomendasikan): `openclaw onboard --install-daemon`
- Langsung: `openclaw gateway install`
- Alur konfigurasi: `openclaw configure` → pilih **Gateway service**
- Perbaikan/migrasi: `openclaw doctor` (menawarkan untuk menginstal atau memperbaiki layanan)

Target layanan bergantung pada sistem operasi:

- macOS: LaunchAgent (`ai.openclaw.gateway`, atau `ai.openclaw.<profile>` untuk profil bernama)
- Linux/WSL2: layanan pengguna systemd (`openclaw-gateway[-<profile>].service`)
- Windows native: Tugas Terjadwal (`OpenClaw Gateway` atau `OpenClaw Gateway (<profile>)`), dengan item masuk folder Startup per pengguna sebagai opsi cadangan jika pembuatan tugas ditolak

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Windows Hub](/id/platforms/windows)
- [Aplikasi macOS](/id/platforms/macos)
- [Aplikasi iOS](/id/platforms/ios)
