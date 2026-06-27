---
read_when:
    - Membuat atau menandatangani build debug mac
summary: Langkah penandatanganan untuk build debug macOS yang dihasilkan oleh skrip pengemasan
title: Penandatanganan macOS
x-i18n:
    generated_at: "2026-06-27T17:43:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# penandatanganan mac (build debug)

Aplikasi ini biasanya dibangun dari [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), yang sekarang:

- menetapkan pengenal bundel debug yang stabil: `ai.openclaw.mac.debug`
- menulis Info.plist dengan id bundel tersebut (timpa melalui `BUNDLE_ID=...`)
- memanggil [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) untuk menandatangani biner utama dan bundel aplikasi sehingga macOS memperlakukan setiap build ulang sebagai bundel bertanda tangan yang sama dan mempertahankan izin TCC (notifikasi, aksesibilitas, perekaman layar, mikrofon, ucapan). Untuk izin yang stabil, gunakan identitas penandatanganan sungguhan; ad-hoc bersifat opt-in dan rapuh (lihat [izin macOS](/id/platforms/mac/permissions)).
- menggunakan `CODESIGN_TIMESTAMP=auto` secara default; ini mengaktifkan timestamp tepercaya untuk tanda tangan Developer ID. Atur `CODESIGN_TIMESTAMP=off` untuk melewati pemberian timestamp (build debug offline).
- menyuntikkan metadata build ke Info.plist: `OpenClawBuildTimestamp` (UTC) dan `OpenClawGitCommit` (hash pendek) sehingga panel About dapat menampilkan build, git, dan kanal debug/release.
- **Packaging secara default menggunakan Node 24**: skrip menjalankan build TS dan build Control UI. Node 22 LTS, saat ini `22.19+`, tetap didukung untuk kompatibilitas.
- membaca `SIGN_IDENTITY` dari lingkungan. Tambahkan `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (atau sertifikat Developer ID Application Anda) ke shell rc Anda agar selalu menandatangani dengan sertifikat Anda. Penandatanganan ad-hoc memerlukan opt-in eksplisit melalui `ALLOW_ADHOC_SIGNING=1` atau `SIGN_IDENTITY="-"` (tidak direkomendasikan untuk pengujian izin).
- menjalankan audit Team ID setelah penandatanganan dan gagal jika ada Mach-O di dalam bundel aplikasi yang ditandatangani oleh Team ID berbeda. Atur `SKIP_TEAM_ID_CHECK=1` untuk melewatinya.

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

Saat menandatangani dengan `SIGN_IDENTITY="-"` (ad-hoc), skrip secara otomatis menonaktifkan **Hardened Runtime** (`--options runtime`). Ini diperlukan untuk mencegah crash saat aplikasi mencoba memuat framework tertanam (seperti Sparkle) yang tidak memakai Team ID yang sama. Tanda tangan ad-hoc juga merusak persistensi izin TCC; lihat [izin macOS](/id/platforms/mac/permissions) untuk langkah pemulihan.

## Metadata build untuk About

`package-mac-app.sh` memberi cap pada bundel dengan:

- `OpenClawBuildTimestamp`: ISO8601 UTC pada waktu packaging
- `OpenClawGitCommit`: hash git pendek (atau `unknown` jika tidak tersedia)

Tab About membaca kunci-kunci ini untuk menampilkan versi, tanggal build, commit git, dan apakah ini build debug (melalui `#if DEBUG`). Jalankan packager untuk menyegarkan nilai-nilai ini setelah perubahan kode.

## Mengapa

Izin TCC terikat pada pengenal bundel _dan_ tanda tangan kode. Build debug tanpa tanda tangan dengan UUID yang berubah menyebabkan macOS melupakan izin setelah setiap build ulang. Menandatangani biner (ad-hoc secara default) dan mempertahankan id/jalur bundel tetap (`dist/OpenClaw.app`) mempertahankan izin antar-build, sesuai dengan pendekatan VibeTunnel.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [izin macOS](/id/platforms/mac/permissions)
