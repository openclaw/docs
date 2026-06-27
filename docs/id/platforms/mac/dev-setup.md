---
read_when:
    - Menyiapkan lingkungan pengembangan macOS
summary: Panduan penyiapan untuk pengembang yang mengerjakan aplikasi macOS OpenClaw
title: Pengaturan pengembangan macOS
x-i18n:
    generated_at: "2026-06-27T17:42:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Penyiapan pengembang macOS

Bangun dan jalankan aplikasi OpenClaw macOS dari sumber.

## Prasyarat

Sebelum membangun aplikasi, pastikan Anda telah memasang yang berikut:

1. **Xcode 26.2+**: Diperlukan untuk pengembangan Swift.
2. **Node.js 24 & pnpm**: Direkomendasikan untuk Gateway, CLI, dan skrip pengemasan. Node 22 LTS, saat ini `22.19+`, tetap didukung untuk kompatibilitas.

## 1. Pasang Dependensi

Pasang dependensi di seluruh proyek:

```bash
pnpm install
```

## 2. Bangun dan Kemas Aplikasi

Untuk membangun aplikasi macOS dan mengemasnya ke dalam `dist/OpenClaw.app`, jalankan:

```bash
./scripts/package-mac-app.sh
```

Jika Anda tidak memiliki sertifikat Apple Developer ID, skrip akan otomatis menggunakan **penandatanganan ad-hoc** (`-`).

Untuk mode menjalankan pengembangan, flag penandatanganan, dan pemecahan masalah Team ID, lihat README aplikasi macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Catatan**: Aplikasi yang ditandatangani ad-hoc dapat memicu prompt keamanan. Jika aplikasi langsung crash dengan "Abort trap 6", lihat bagian [Pemecahan masalah](#troubleshooting).

## 3. Pasang CLI

Aplikasi macOS mengharapkan pemasangan CLI `openclaw` global untuk mengelola tugas latar belakang.

**Untuk memasangnya (direkomendasikan):**

1. Buka aplikasi OpenClaw.
2. Buka tab pengaturan **Umum**.
3. Klik **"Pasang CLI"**.

Atau, pasang secara manual:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` dan `bun add -g openclaw@<version>` juga berfungsi.
Untuk runtime Gateway, Node tetap menjadi jalur yang direkomendasikan.

## Pemecahan masalah

### Build gagal: toolchain atau SDK tidak cocok

Build aplikasi macOS mengharapkan SDK macOS terbaru dan toolchain Swift 6.2.

**Dependensi sistem (wajib):**

- **Versi macOS terbaru yang tersedia di Pembaruan Perangkat Lunak** (diwajibkan oleh SDK Xcode 26.2)
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

Jika status Gateway tetap pada "Memulai...", periksa apakah proses zombie menahan port:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jika proses manual menahan port, hentikan proses tersebut (Ctrl+C). Sebagai upaya terakhir, hentikan paksa PID yang Anda temukan di atas.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikhtisar pemasangan](/id/install)
