---
read_when:
    - Menyiapkan lingkungan pengembangan macOS
summary: Panduan penyiapan untuk pengembang yang mengerjakan aplikasi macOS OpenClaw
title: Penyiapan pengembangan macOS
x-i18n:
    generated_at: "2026-07-04T06:52:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Penyiapan pengembang macOS

Bangun dan jalankan aplikasi macOS OpenClaw dari sumber.

## Prasyarat

Sebelum membangun aplikasi, pastikan Anda telah menginstal hal berikut:

1. **Xcode 26.2+**: Diperlukan untuk pengembangan Swift.
2. **Node.js 24 & pnpm**: Direkomendasikan untuk Gateway, CLI, dan skrip pengemasan. Node 22 LTS, saat ini `22.19+`, tetap didukung untuk kompatibilitas.

## 1. Instal Dependensi

Instal dependensi seluruh proyek:

```bash
pnpm install
```

## 2. Bangun dan Kemas Aplikasi

Untuk membangun aplikasi macOS dan mengemasnya ke dalam `dist/OpenClaw.app`, jalankan:

```bash
./scripts/package-mac-app.sh
```

Jika Anda tidak memiliki sertifikat Apple Developer ID, skrip akan otomatis menggunakan **penandatanganan ad-hoc** (`-`).

Untuk mode jalankan pengembangan, flag penandatanganan, dan pemecahan masalah Team ID, lihat README aplikasi macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Catatan**: Aplikasi yang ditandatangani ad-hoc dapat memicu prompt keamanan. Jika aplikasi langsung macet dengan "Abort trap 6", lihat bagian [Pemecahan masalah](#troubleshooting).

## 3. Instal CLI dan Gateway

Aplikasi yang dikemas menyematkan penginstal kanonis `scripts/install-cli.sh`. Pada profil
baru, pilih **Mac Ini** selama onboarding; aplikasi akan menginstal CLI dan runtime
ruang pengguna yang sesuai sebelum memulai wizard Gateway.

Untuk pemulihan pengembangan manual, instal sendiri CLI yang sesuai:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` dan `bun add -g openclaw@<version>` juga berfungsi.
Untuk runtime Gateway, Node tetap menjadi jalur yang direkomendasikan.

## Pemecahan masalah

### Build gagal: ketidakcocokan toolchain atau SDK

Build aplikasi macOS mengharapkan SDK macOS terbaru dan toolchain Swift 6.2.

**Dependensi sistem (wajib):**

- **Versi macOS terbaru yang tersedia di Software Update** (diwajibkan oleh SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Pemeriksaan:**

```bash
xcodebuild -version
xcrun swift --version
```

Jika versi tidak cocok, perbarui macOS/Xcode dan jalankan ulang build.

### Aplikasi macet saat pemberian izin

Jika aplikasi macet saat Anda mencoba mengizinkan akses **Speech Recognition** atau **Microphone**, penyebabnya mungkin cache TCC yang rusak atau ketidakcocokan tanda tangan.

**Perbaikan:**

1. Reset izin TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jika itu gagal, ubah `BUNDLE_ID` sementara di [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) untuk memaksa "clean slate" dari macOS.

### Gateway "Memulai..." tanpa batas

Jika status gateway tetap pada "Memulai...", periksa apakah proses zombie menahan port:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jika proses manual menahan port, hentikan proses tersebut (Ctrl+C). Sebagai pilihan terakhir, hentikan paksa PID yang Anda temukan di atas.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikhtisar instalasi](/id/install)
