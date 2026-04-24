---
read_when:
    - Menyiapkan lingkungan pengembangan macOS
summary: Panduan penyiapan untuk developer yang bekerja pada aplikasi macOS OpenClaw
title: Penyiapan dev macOS
x-i18n:
    generated_at: "2026-04-24T09:17:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Penyiapan Developer macOS

Panduan ini mencakup langkah-langkah yang diperlukan untuk membangun dan menjalankan aplikasi macOS OpenClaw dari source.

## Prasyarat

Sebelum membangun aplikasi, pastikan Anda telah menginstal hal berikut:

1. **Xcode 26.2+**: Diperlukan untuk pengembangan Swift.
2. **Node.js 24 & pnpm**: Direkomendasikan untuk Gateway, CLI, dan skrip packaging. Node 22 LTS, saat ini `22.14+`, tetap didukung untuk kompatibilitas.

## 1. Instal Dependensi

Instal dependensi untuk seluruh project:

```bash
pnpm install
```

## 2. Build dan package aplikasi

Untuk membangun aplikasi macOS dan mem-package-nya ke `dist/OpenClaw.app`, jalankan:

```bash
./scripts/package-mac-app.sh
```

Jika Anda tidak memiliki sertifikat Apple Developer ID, skrip akan secara otomatis menggunakan **ad-hoc signing** (`-`).

Untuk mode dev run, flag signing, dan pemecahan masalah Team ID, lihat README aplikasi macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Catatan**: Aplikasi yang ditandatangani secara ad-hoc dapat memicu prompt keamanan. Jika aplikasi langsung crash dengan "Abort trap 6", lihat bagian [Pemecahan masalah](#troubleshooting).

## 3. Instal CLI

Aplikasi macOS mengharapkan instalasi CLI `openclaw` global untuk mengelola tugas latar belakang.

**Untuk menginstalnya (disarankan):**

1. Buka aplikasi OpenClaw.
2. Buka tab pengaturan **General**.
3. Klik **"Install CLI"**.

Sebagai alternatif, instal secara manual:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` dan `bun add -g openclaw@<version>` juga berfungsi.
Untuk runtime Gateway, Node tetap menjadi jalur yang direkomendasikan.

## Pemecahan masalah

### Build Gagal: Ketidakcocokan toolchain atau SDK

Build aplikasi macOS mengharapkan SDK macOS terbaru dan toolchain Swift 6.2.

**Dependensi sistem (wajib):**

- **Versi macOS terbaru yang tersedia di Software Update** (diperlukan oleh SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Pemeriksaan:**

```bash
xcodebuild -version
xcrun swift --version
```

Jika versinya tidak cocok, perbarui macOS/Xcode dan jalankan ulang build.

### Aplikasi crash saat memberikan izin

Jika aplikasi crash saat Anda mencoba mengizinkan akses **Speech Recognition** atau **Microphone**, ini mungkin disebabkan oleh cache TCC yang rusak atau ketidakcocokan signature.

**Perbaikan:**

1. Reset izin TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jika itu gagal, ubah `BUNDLE_ID` sementara di [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) untuk memaksa "clean slate" dari macOS.

### Gateway "Starting..." tanpa akhir

Jika status Gateway tetap di "Starting...", periksa apakah ada proses zombie yang menahan port:

```bash
openclaw gateway status
openclaw gateway stop

# Jika Anda tidak menggunakan LaunchAgent (mode dev / eksekusi manual), temukan listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jika eksekusi manual menahan port, hentikan proses tersebut (Ctrl+C). Sebagai jalan terakhir, kill PID yang Anda temukan di atas.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikhtisar instalasi](/id/install)
