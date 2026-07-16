---
read_when:
    - Membangun atau menandatangani build debug Mac
summary: Langkah-langkah penandatanganan untuk build debug macOS yang dihasilkan oleh skrip pengemasan
title: Penandatanganan macOS
x-i18n:
    generated_at: "2026-07-16T18:16:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# penandatanganan mac (build debug)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) membangun dan mengemas aplikasi ke jalur tetap (`dist/OpenClaw.app`), lalu memanggil [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) untuk menandatanganinya. Izin TCC terikat pada ID bundel dan tanda tangan kode; menjaga keduanya tetap stabil (serta aplikasi tetap berada di jalur yang sama) di seluruh proses pembangunan ulang mencegah macOS melupakan izin TCC (notifikasi, aksesibilitas, perekaman layar, mikrofon, ucapan).

- Pengenal bundel debug secara default adalah `ai.openclaw.mac.debug` (ganti dengan `BUNDLE_ID=...`).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25`, atau `>=25.9.0` (`package.json` repo `engines`). Pengemas juga membangun UI Kontrol (`pnpm ui:build`).
- Secara default memerlukan identitas penandatanganan asli; skrip codesign berhenti dengan kesalahan jika tidak ada yang ditemukan dan `ALLOW_ADHOC_SIGNING` tidak ditetapkan. Penandatanganan ad hoc (`SIGN_IDENTITY="-"`) harus diaktifkan secara eksplisit dan tidak mempertahankan izin TCC di seluruh proses pembangunan ulang. Lihat [izin macOS](/id/platforms/mac/permissions).
- Membaca `SIGN_IDENTITY` dari lingkungan (misalnya `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`, atau sertifikat Developer ID Application). Tanpa nilai tersebut, `codesign-mac-app.sh` memilih identitas secara otomatis dalam urutan berikut: Developer ID Application, Apple Distribution, Apple Development, lalu identitas penandatanganan kode valid pertama yang ditemukan.
- `CODESIGN_TIMESTAMP=auto` (default) mengaktifkan stempel waktu tepercaya hanya untuk tanda tangan Developer ID Application. Tetapkan `on`/`off` untuk memaksakan salah satu opsi.
- Mencantumkan `OpenClawBuildTimestamp` (ISO8601 UTC) dan `OpenClawGitCommit` (hash pendek, `unknown` jika tidak tersedia) pada Info.plist agar tab Tentang dapat menampilkan build, git, dan kanal debug/rilis.
- Menjalankan audit ID Tim setelah penandatanganan dan gagal jika ada Mach-O di dalam bundel yang memiliki ID Tim berbeda. Tetapkan `SKIP_TEAM_ID_CHECK=1` untuk melewatinya.

## Penggunaan

```bash
# dari root repo
scripts/package-mac-app.sh                                                      # memilih identitas secara otomatis; menghasilkan kesalahan jika tidak ditemukan
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # sertifikat asli
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (izin tidak akan bertahan)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ad hoc eksplisit (dengan catatan yang sama)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # solusi sementara khusus pengembangan untuk ketidakcocokan ID Tim Sparkle
```

### Catatan penandatanganan ad hoc

`SIGN_IDENTITY="-"` menonaktifkan Hardened Runtime (`--options runtime`) untuk mencegah crash saat aplikasi memuat framework tertanam (seperti Sparkle) yang tidak menggunakan ID Tim yang sama. Tanda tangan ad hoc juga mengganggu persistensi izin TCC; lihat [izin macOS](/id/platforms/mac/permissions) untuk langkah-langkah pemulihan.

## Metadata build untuk Tentang

Tab Tentang membaca `OpenClawBuildTimestamp` dan `OpenClawGitCommit` dari Info.plist untuk menampilkan versi, tanggal build, commit git, dan apakah build tersebut DEBUG (melalui `#if DEBUG`). Jalankan ulang pengemas setelah perubahan kode untuk memperbarui nilai-nilai ini.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [izin macOS](/id/platforms/mac/permissions)
