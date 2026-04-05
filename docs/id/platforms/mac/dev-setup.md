---
read_when:
    - Menyiapkan lingkungan pengembangan macOS
summary: Panduan penyiapan untuk pengembang yang mengerjakan aplikasi macOS OpenClaw
title: Penyiapan Dev macOS
x-i18n:
    generated_at: "2026-04-05T14:00:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd13f17391bdd87ef59e4c575e5da3312c4066de00905731263bff655a5db357
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Penyiapan Pengembang macOS

Panduan ini membahas langkah-langkah yang diperlukan untuk membangun dan menjalankan aplikasi macOS OpenClaw dari source.

## Prasyarat

Sebelum membangun aplikasi, pastikan Anda telah menginstal hal-hal berikut:

1. **Xcode 26.2+**: Diperlukan untuk pengembangan Swift.
2. **Node.js 24 & pnpm**: Direkomendasikan untuk gateway, CLI, dan skrip packaging. Node 22 LTS, saat ini `22.14+`, tetap didukung untuk kompatibilitas.

## 1. Instal Dependensi

Instal dependensi untuk seluruh proyek:

```bash
pnpm install
```

## 2. Bangun dan Package Aplikasi

Untuk membangun aplikasi macOS dan mem-package-nya ke `dist/OpenClaw.app`, jalankan:

```bash
./scripts/package-mac-app.sh
```

Jika Anda tidak memiliki sertifikat Apple Developer ID, skrip akan otomatis menggunakan **penandatanganan ad-hoc** (`-`).

Untuk mode dev run, flag penandatanganan, dan pemecahan masalah Team ID, lihat README aplikasi macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Catatan**: Aplikasi yang ditandatangani ad-hoc dapat memicu prompt keamanan. Jika aplikasi langsung crash dengan "Abort trap 6", lihat bagian [Pemecahan masalah](#troubleshooting).

## 3. Instal CLI

Aplikasi macOS mengharapkan instalasi CLI `openclaw` global untuk mengelola tugas latar belakang.

**Untuk menginstalnya (direkomendasikan):**

1. Buka aplikasi OpenClaw.
2. Buka tab pengaturan **General**.
3. Klik **"Install CLI"**.

Sebagai alternatif, instal secara manual:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` dan `bun add -g openclaw@<version>` juga dapat digunakan.
Untuk runtime Gateway, Node tetap menjadi jalur yang direkomendasikan.

## Pemecahan masalah

### Build Gagal: Toolchain atau SDK Tidak Cocok

Build aplikasi macOS mengharapkan SDK macOS terbaru dan toolchain Swift 6.2.

**Dependensi sistem (wajib):**

- **Versi macOS terbaru yang tersedia di Software Update** (diperlukan oleh SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Pemeriksaan:**

```bash
xcodebuild -version
xcrun swift --version
```

Jika versinya tidak cocok, perbarui macOS/Xcode lalu jalankan ulang build.

### Aplikasi Crash saat Memberikan Izin

Jika aplikasi crash saat Anda mencoba mengizinkan akses **Speech Recognition** atau **Microphone**, penyebabnya mungkin cache TCC yang rusak atau ketidakcocokan signature.

**Perbaikan:**

1. Reset izin TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jika itu gagal, ubah `BUNDLE_ID` untuk sementara di [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) untuk memaksa "clean slate" dari macOS.

### Gateway "Starting..." tanpa henti

Jika status gateway tetap di "Starting...", periksa apakah ada proses zombie yang menahan port:

```bash
openclaw gateway status
openclaw gateway stop

# Jika Anda tidak menggunakan LaunchAgent (mode dev / run manual), cari listener-nya:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jika run manual menahan port, hentikan proses tersebut (Ctrl+C). Sebagai upaya terakhir, bunuh PID yang Anda temukan di atas.
