---
read_when:
    - Membuat atau menandatangani build debug Mac
summary: Langkah penandatanganan untuk versi debug macOS yang dihasilkan oleh skrip pengemasan
title: Penandatanganan macOS
x-i18n:
    generated_at: "2026-05-06T09:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# penandatanganan mac (build debug)

Aplikasi ini biasanya dibangun dari [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), yang sekarang:

- menetapkan pengenal bundle debug yang stabil: `ai.openclaw.mac.debug`
- menulis Info.plist dengan id bundle tersebut (timpa melalui `BUNDLE_ID=...`)
- memanggil [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) untuk menandatangani biner utama dan bundle aplikasi agar macOS memperlakukan setiap rebuild sebagai bundle bertanda tangan yang sama dan mempertahankan izin TCC (notifikasi, aksesibilitas, perekaman layar, mikrofon, ucapan). Untuk izin yang stabil, gunakan identitas penandatanganan nyata; ad-hoc bersifat opt-in dan rapuh (lihat [izin macOS](/id/platforms/mac/permissions)).
- menggunakan `CODESIGN_TIMESTAMP=auto` secara default; ini mengaktifkan timestamp tepercaya untuk tanda tangan Developer ID. Tetapkan `CODESIGN_TIMESTAMP=off` untuk melewati pemberian timestamp (build debug offline).
- menyuntikkan metadata build ke Info.plist: `OpenClawBuildTimestamp` (UTC) dan `OpenClawGitCommit` (hash pendek) agar panel Tentang dapat menampilkan build, git, dan kanal debug/rilis.
- **Packaging default ke Node 24**: skrip menjalankan build TS dan build Control UI. Node 22 LTS, saat ini `22.14+`, tetap didukung untuk kompatibilitas.
- membaca `SIGN_IDENTITY` dari environment. Tambahkan `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (atau sertifikat Developer ID Application Anda) ke rc shell Anda agar selalu menandatangani dengan sertifikat Anda. Penandatanganan ad-hoc memerlukan opt-in eksplisit melalui `ALLOW_ADHOC_SIGNING=1` atau `SIGN_IDENTITY="-"` (tidak direkomendasikan untuk pengujian izin).
- menjalankan audit Team ID setelah penandatanganan dan gagal jika Mach-O mana pun di dalam bundle aplikasi ditandatangani oleh Team ID yang berbeda. Tetapkan `SKIP_TEAM_ID_CHECK=1` untuk melewati.

## Penggunaan

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Catatan Penandatanganan Ad-hoc

Saat menandatangani dengan `SIGN_IDENTITY="-"` (ad-hoc), skrip otomatis menonaktifkan **Hardened Runtime** (`--options runtime`). Ini diperlukan untuk mencegah crash ketika aplikasi mencoba memuat framework tertanam (seperti Sparkle) yang tidak berbagi Team ID yang sama. Tanda tangan ad-hoc juga merusak persistensi izin TCC; lihat [izin macOS](/id/platforms/mac/permissions) untuk langkah pemulihan.

## Metadata build untuk Tentang

`package-mac-app.sh` memberi cap pada bundle dengan:

- `OpenClawBuildTimestamp`: ISO8601 UTC pada waktu package
- `OpenClawGitCommit`: hash git pendek (atau `unknown` jika tidak tersedia)

Tab Tentang membaca key ini untuk menampilkan versi, tanggal build, commit git, dan apakah ini build debug (melalui `#if DEBUG`). Jalankan packager untuk menyegarkan nilai ini setelah perubahan kode.

## Mengapa

Izin TCC terikat pada pengenal bundle _dan_ tanda tangan kode. Build debug yang tidak ditandatangani dengan UUID yang berubah menyebabkan macOS melupakan grant setelah setiap rebuild. Menandatangani biner (ad-hoc secara default) dan menjaga id/jalur bundle tetap (`dist/OpenClaw.app`) mempertahankan grant antar-build, sesuai dengan pendekatan VibeTunnel.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [izin macOS](/id/platforms/mac/permissions)
