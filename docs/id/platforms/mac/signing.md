---
read_when:
    - Membangun atau menandatangani build debug macOS
summary: Langkah penandatanganan untuk build debug macOS yang dihasilkan oleh skrip packaging
title: Penandatanganan macOS
x-i18n:
    generated_at: "2026-04-24T09:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# Penandatanganan mac (build debug)

Aplikasi ini biasanya dibangun dari [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), yang sekarang:

- menyetel bundle identifier debug yang stabil: `ai.openclaw.mac.debug`
- menulis Info.plist dengan bundle id tersebut (override melalui `BUNDLE_ID=...`)
- memanggil [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) untuk menandatangani binary utama dan bundle aplikasi sehingga macOS memperlakukan setiap rebuild sebagai bundle bertanda tangan yang sama dan mempertahankan izin TCC (notifikasi, aksesibilitas, perekaman layar, mikrofon, speech). Untuk izin yang stabil, gunakan identitas penandatanganan nyata; ad-hoc bersifat opt-in dan rapuh (lihat [izin macOS](/id/platforms/mac/permissions)).
- menggunakan `CODESIGN_TIMESTAMP=auto` secara default; ini mengaktifkan trusted timestamp untuk tanda tangan Developer ID. Setel `CODESIGN_TIMESTAMP=off` untuk melewati timestamping (build debug offline).
- menyuntikkan metadata build ke Info.plist: `OpenClawBuildTimestamp` (UTC) dan `OpenClawGitCommit` (hash singkat) sehingga panel About dapat menampilkan build, git, dan channel debug/release.
- **Packaging secara default menggunakan Node 24**: skrip menjalankan build TS dan build UI Control. Node 22 LTS, saat ini `22.14+`, tetap didukung untuk kompatibilitas.
- membaca `SIGN_IDENTITY` dari environment. Tambahkan `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (atau sertifikat Developer ID Application Anda) ke shell rc Anda agar selalu menandatangani dengan sertifikat Anda. Penandatanganan ad-hoc memerlukan opt-in eksplisit melalui `ALLOW_ADHOC_SIGNING=1` atau `SIGN_IDENTITY="-"` (tidak direkomendasikan untuk pengujian izin).
- menjalankan audit Team ID setelah penandatanganan dan gagal jika ada Mach-O di dalam bundle aplikasi yang ditandatangani oleh Team ID berbeda. Setel `SKIP_TEAM_ID_CHECK=1` untuk melewatinya.

## Penggunaan

```bash
# dari root repo
scripts/package-mac-app.sh               # pilih identitas otomatis; error jika tidak ada yang ditemukan
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # sertifikat nyata
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (izin tidak akan menetap)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc eksplisit (peringatan sama)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # solusi sementara dev-only untuk ketidakcocokan Sparkle Team ID
```

### Catatan Penandatanganan Ad-hoc

Saat menandatangani dengan `SIGN_IDENTITY="-"` (ad-hoc), skrip otomatis menonaktifkan **Hardened Runtime** (`--options runtime`). Ini diperlukan untuk mencegah crash ketika aplikasi mencoba memuat framework tertanam (seperti Sparkle) yang tidak memiliki Team ID yang sama. Tanda tangan ad-hoc juga merusak persistensi izin TCC; lihat [izin macOS](/id/platforms/mac/permissions) untuk langkah pemulihan.

## Metadata build untuk About

`package-mac-app.sh` memberi cap pada bundle dengan:

- `OpenClawBuildTimestamp`: UTC ISO8601 saat waktu packaging
- `OpenClawGitCommit`: hash git singkat (atau `unknown` jika tidak tersedia)

Tab About membaca kunci ini untuk menampilkan versi, tanggal build, commit git, dan apakah ini build debug (melalui `#if DEBUG`). Jalankan packager untuk menyegarkan nilai-nilai ini setelah perubahan kode.

## Mengapa

Izin TCC terikat pada bundle identifier _dan_ code signature. Build debug tanpa tanda tangan dengan UUID yang berubah-ubah menyebabkan macOS melupakan izin setelah setiap rebuild. Menandatangani binary (ad-hoc secara default) dan menjaga bundle id/path tetap (`dist/OpenClaw.app`) mempertahankan izin antar build, sesuai dengan pendekatan VibeTunnel.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Izin macOS](/id/platforms/mac/permissions)
