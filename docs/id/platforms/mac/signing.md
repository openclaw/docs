---
read_when:
    - Membangun atau menandatangani build debug Mac
summary: Langkah penandatanganan untuk build debug macOS yang dihasilkan oleh script packaging
title: Penandatanganan macOS
x-i18n:
    generated_at: "2026-04-05T14:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# Penandatanganan macOS (build debug)

Aplikasi ini biasanya dibangun dari [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), yang sekarang:

- menetapkan bundle identifier debug yang stabil: `ai.openclaw.mac.debug`
- menulis Info.plist dengan bundle id tersebut (timpa dengan `BUNDLE_ID=...`)
- memanggil [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) untuk menandatangani biner utama dan app bundle agar macOS memperlakukan setiap build ulang sebagai bundle bertanda tangan yang sama dan mempertahankan izin TCC (notifikasi, aksesibilitas, perekaman layar, mikrofon, ucapan). Untuk izin yang stabil, gunakan identitas penandatanganan sungguhan; ad-hoc bersifat opt-in dan rapuh (lihat [izin macOS](/platforms/mac/permissions)).
- menggunakan `CODESIGN_TIMESTAMP=auto` secara default; ini mengaktifkan trusted timestamp untuk tanda tangan Developer ID. Tetapkan `CODESIGN_TIMESTAMP=off` untuk melewati timestamping (build debug offline).
- menyuntikkan metadata build ke Info.plist: `OpenClawBuildTimestamp` (UTC) dan `OpenClawGitCommit` (hash pendek) agar panel About dapat menampilkan build, git, dan channel debug/rilis.
- **Packaging secara default menggunakan Node 24**: script menjalankan build TS dan build Control UI. Node 22 LTS, saat ini `22.14+`, tetap didukung untuk kompatibilitas.
- membaca `SIGN_IDENTITY` dari environment. Tambahkan `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (atau sertifikat Developer ID Application Anda) ke shell rc Anda agar selalu menandatangani dengan sertifikat Anda. Penandatanganan ad-hoc memerlukan opt-in eksplisit melalui `ALLOW_ADHOC_SIGNING=1` atau `SIGN_IDENTITY="-"` (tidak direkomendasikan untuk pengujian izin).
- menjalankan audit Team ID setelah penandatanganan dan gagal jika ada Mach-O di dalam app bundle yang ditandatangani oleh Team ID yang berbeda. Tetapkan `SKIP_TEAM_ID_CHECK=1` untuk melewati pemeriksaan.

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

Saat menandatangani dengan `SIGN_IDENTITY="-"` (ad-hoc), script secara otomatis menonaktifkan **Hardened Runtime** (`--options runtime`). Ini diperlukan untuk mencegah crash saat aplikasi mencoba memuat embedded framework (seperti Sparkle) yang tidak menggunakan Team ID yang sama. Tanda tangan ad-hoc juga merusak persistensi izin TCC; lihat [izin macOS](/platforms/mac/permissions) untuk langkah pemulihan.

## Metadata build untuk About

`package-mac-app.sh` memberi stempel pada bundle dengan:

- `OpenClawBuildTimestamp`: UTC ISO8601 pada saat packaging
- `OpenClawGitCommit`: hash git pendek (atau `unknown` jika tidak tersedia)

Tab About membaca key ini untuk menampilkan versi, tanggal build, git commit, dan apakah ini build debug (melalui `#if DEBUG`). Jalankan packager untuk menyegarkan nilai-nilai ini setelah perubahan kode.

## Alasan

Izin TCC terikat pada bundle identifier _dan_ code signature. Build debug tanpa tanda tangan dengan UUID yang berubah-ubah menyebabkan macOS melupakan izin yang telah diberikan setelah setiap build ulang. Menandatangani biner (ad-hoc secara default) dan mempertahankan bundle id/path tetap (`dist/OpenClaw.app`) mempertahankan izin antar-build, sesuai dengan pendekatan VibeTunnel.
