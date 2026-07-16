---
read_when:
    - Menyiapkan lingkungan pengembangan macOS
summary: Panduan penyiapan bagi pengembang yang mengerjakan aplikasi OpenClaw untuk macOS
title: Penyiapan pengembangan macOS
x-i18n:
    generated_at: "2026-07-16T18:15:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Penyiapan pengembang macOS

Bangun dan jalankan aplikasi macOS OpenClaw dari kode sumber.

## Prasyarat

- **Xcode 26.2+** (toolchain Swift 6.2), pada macOS terbaru yang tersedia di
  Software Update.
- **Node.js 24.15+ & pnpm** untuk Gateway, CLI, dan skrip pengemasan. Node
  22.22.3+ juga dapat digunakan.

## 1. Instal dependensi

```bash
pnpm install
```

## 2. Bangun dan kemas aplikasi

```bash
./scripts/package-mac-app.sh
```

Menghasilkan `dist/OpenClaw.app`. Tanpa sertifikat Apple Developer ID,
skrip akan beralih ke penandatanganan ad-hoc.

Untuk mode pengoperasian pengembangan, flag penandatanganan, dan pemecahan masalah Team ID, lihat
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Siklus pengembangan cepat dari root repositori: `scripts/restart-mac.sh` (tambahkan `--no-sign` untuk
penandatanganan ad-hoc; izin TCC tidak dipertahankan dengan `--no-sign`).

<Note>
Aplikasi yang ditandatangani secara ad-hoc dapat memicu perintah keamanan. Jika aplikasi langsung
mengalami crash dengan "Abort trap 6", lihat [Pemecahan masalah](#troubleshooting).
</Note>

## 3. Instal CLI dan Gateway

Aplikasi yang dikemas menyertakan penginstal `scripts/install-cli.sh` kanonis. Pada
profil baru, pilih **This Mac** selama orientasi awal; aplikasi akan menginstal
CLI ruang pengguna dan runtime yang sesuai sebelum memulai wizard Gateway.

Untuk pemulihan pengembangan secara manual, instal sendiri CLI yang sesuai:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` dan `bun add -g openclaw@<version>` juga
dapat digunakan. Node tetap menjadi runtime yang direkomendasikan untuk Gateway itu sendiri.

## Pemecahan masalah

### Pembangunan gagal: toolchain atau SDK tidak cocok

Pembangunan aplikasi macOS memerlukan SDK macOS terbaru dan toolchain Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Jika versinya tidak cocok, perbarui macOS/Xcode dan jalankan ulang pembangunan.

### Aplikasi mengalami crash saat izin diberikan

Jika aplikasi mengalami crash ketika Anda mencoba mengizinkan akses **Speech Recognition** atau
**Microphone**, penyebabnya mungkin cache TCC yang rusak atau ketidakcocokan tanda tangan.

1. Atur ulang izin TCC untuk id bundel debug:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jika gagal, ubah sementara `BUNDLE_ID` di
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   untuk memulai dari keadaan bersih di macOS.

### Gateway terus menampilkan "Starting..."

Periksa apakah proses zombie menggunakan port tersebut:

```bash
openclaw gateway status
openclaw gateway stop

# Jika Anda tidak menggunakan LaunchAgent (mode pengembangan / pengoperasian manual), cari proses yang mendengarkan:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jika pengoperasian manual menggunakan port tersebut, hentikan (Ctrl+C), atau akhiri PID yang ditemukan di atas
sebagai upaya terakhir.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikhtisar instalasi](/id/install)
