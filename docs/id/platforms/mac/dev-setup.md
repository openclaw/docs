---
read_when:
    - Menyiapkan lingkungan pengembangan macOS
summary: Panduan penyiapan bagi pengembang yang mengerjakan aplikasi OpenClaw untuk macOS
title: Penyiapan pengembangan macOS
x-i18n:
    generated_at: "2026-07-12T14:21:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Penyiapan pengembangan macOS

Bangun dan jalankan aplikasi OpenClaw untuk macOS dari kode sumber.

## Prasyarat

- **Xcode 26.2+** (toolchain Swift 6.2), pada macOS terbaru yang tersedia di
  Software Update.
- **Node.js 24 & pnpm** untuk Gateway, CLI, dan skrip pengemasan. Node
  22.19+ juga dapat digunakan.

## 1. Instal dependensi

```bash
pnpm install
```

## 2. Bangun dan kemas aplikasi

```bash
./scripts/package-mac-app.sh
```

Menghasilkan `dist/OpenClaw.app`. Tanpa sertifikat Apple Developer ID, skrip
akan menggunakan penandatanganan ad-hoc sebagai alternatif.

Untuk mode eksekusi pengembangan, flag penandatanganan, dan pemecahan masalah Team ID, lihat
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Siklus pengembangan cepat dari root repositori: `scripts/restart-mac.sh` (tambahkan `--no-sign` untuk
penandatanganan ad-hoc; izin TCC tidak dipertahankan saat menggunakan `--no-sign`).

<Note>
Aplikasi yang ditandatangani secara ad-hoc dapat memicu permintaan keamanan. Jika aplikasi langsung
mengalami crash dengan pesan "Abort trap 6", lihat [Pemecahan masalah](#troubleshooting).
</Note>

## 3. Instal CLI dan Gateway

Aplikasi yang dikemas menyertakan penginstal kanonis `scripts/install-cli.sh`. Pada
profil baru, pilih **This Mac** selama orientasi awal; aplikasi akan menginstal
CLI dan runtime ruang pengguna yang sesuai sebelum memulai wizard Gateway.

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

Jika versinya tidak cocok, perbarui macOS/Xcode dan jalankan kembali proses pembangunan.

### Aplikasi mengalami crash saat pemberian izin

Jika aplikasi mengalami crash ketika Anda mencoba mengizinkan akses **Speech Recognition** atau
**Microphone**, penyebabnya mungkin cache TCC yang rusak atau ketidakcocokan tanda tangan.

1. Atur ulang izin TCC untuk id bundel debug:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Jika gagal, ubah sementara `BUNDLE_ID` di
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   untuk memaksa macOS memulai dari keadaan bersih.

### Gateway terus menampilkan "Starting..."

Periksa apakah proses zombie menggunakan port tersebut:

```bash
openclaw gateway status
openclaw gateway stop

# Jika Anda tidak menggunakan LaunchAgent (mode pengembangan / eksekusi manual), cari proses yang mendengarkan:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Jika eksekusi manual menggunakan port tersebut, hentikan (Ctrl+C), atau sebagai
upaya terakhir, hentikan paksa PID yang ditemukan di atas.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikhtisar instalasi](/id/install)
