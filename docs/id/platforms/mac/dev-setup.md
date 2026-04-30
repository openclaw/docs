---
read_when:
    - Menyiapkan lingkungan pengembangan macOS
summary: Panduan penyiapan untuk pengembang yang bekerja pada aplikasi macOS OpenClaw
title: Penyiapan pengembangan macOS
x-i18n:
    generated_at: "2026-04-30T09:58:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Penyiapan pengembang macOS

Bangun dan jalankan aplikasi macOS OpenClaw dari sumber.

## Prasyarat

Sebelum membangun aplikasi, pastikan Anda telah menginstal hal berikut:

1. **Xcode 26.2+**: Diperlukan untuk pengembangan Swift.
2. **Node.js 24 & pnpm**: Direkomendasikan untuk Gateway, CLI, dan skrip pengemasan. Node 22 LTS, saat ini `22.14+`, tetap didukung untuk kompatibilitas.

## 1. Instal Dependensi

Instal dependensi di seluruh proyek:

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

> **Catatan**: Aplikasi yang ditandatangani ad-hoc dapat memicu prompt keamanan. Jika aplikasi langsung crash dengan "Abort trap 6", lihat bagian [Pemecahan Masalah](#troubleshooting).

## 3. Instal CLI

Aplikasi macOS mengharapkan instalasi CLI `openclaw` global untuk mengelola tugas latar belakang.

**Untuk menginstalnya (direkomendasikan):**

1. Buka aplikasi OpenClaw.
2. Buka tab pengaturan **Umum**.
3. Klik **"Instal CLI"**.

Sebagai alternatif, instal secara manual:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` dan `bun add -g openclaw@<version>` juga berfungsi.
Untuk runtime Gateway, Node tetap menjadi jalur yang direkomendasikan.

## Pemecahan Masalah

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

### Aplikasi crash saat pemberian izin

Jika aplikasi crash saat Anda mencoba mengizinkan akses **Pengenalan Ucapan** atau **Mikrofon**, penyebabnya mungkin cache TCC yang rusak atau ketidakcocokan tanda tangan.

**Perbaikan:**

1. Reset izin TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jika gagal, ubah `BUNDLE_ID` sementara di [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) untuk memaksa "awal bersih" dari macOS.

### Gateway "Memulai..." tanpa henti

Jika status Gateway tetap pada "Memulai...", periksa apakah ada proses zombie yang menahan port:

```bash
openclaw gateway status
openclaw gateway stop

# Jika Anda tidak menggunakan LaunchAgent (mode pengembangan / proses manual), temukan listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jika proses manual menahan port, hentikan proses tersebut (Ctrl+C). Sebagai upaya terakhir, matikan PID yang Anda temukan di atas.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikhtisar instalasi](/id/install)
