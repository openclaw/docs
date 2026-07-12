---
read_when:
    - Membuat atau menandatangani build debug Mac
summary: Langkah-langkah penandatanganan untuk build debug macOS yang dihasilkan oleh skrip pengemasan
title: Penandatanganan macOS
x-i18n:
    generated_at: "2026-07-12T14:21:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# penandatanganan mac (build debug)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) membangun dan mengemas aplikasi ke jalur tetap (`dist/OpenClaw.app`), lalu memanggil [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) untuk menandatanganinya. Izin TCC terikat pada ID bundel dan tanda tangan kode; menjaga keduanya tetap stabil (serta aplikasi tetap berada di jalur yang sama) di setiap pembangunan ulang mencegah macOS melupakan pemberian izin TCC (notifikasi, aksesibilitas, perekaman layar, mikrofon, pengenalan ucapan).

- Pengidentifikasi bundel debug secara default adalah `ai.openclaw.mac.debug` (ganti dengan `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` atau `>=23.11.0` (`engines` dalam `package.json` repositori). Pengemas juga membangun UI Kontrol (`pnpm ui:build`).
- Secara default memerlukan identitas penandatanganan yang valid; skrip penandatanganan kode berhenti dengan galat jika tidak menemukannya dan `ALLOW_ADHOC_SIGNING` tidak ditetapkan. Penandatanganan ad hoc (`SIGN_IDENTITY="-"`) harus diaktifkan secara eksplisit dan tidak mempertahankan izin TCC di setiap pembangunan ulang. Lihat [izin macOS](/id/platforms/mac/permissions).
- Membaca `SIGN_IDENTITY` dari lingkungan (misalnya `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`, atau sertifikat Developer ID Application). Tanpa nilai tersebut, `codesign-mac-app.sh` memilih identitas secara otomatis dengan urutan berikut: Developer ID Application, Apple Distribution, Apple Development, lalu identitas penandatanganan kode valid pertama yang ditemukan.
- `CODESIGN_TIMESTAMP=auto` (default) mengaktifkan stempel waktu tepercaya hanya untuk tanda tangan Developer ID Application. Tetapkan ke `on`/`off` untuk memaksakan pengaktifan atau penonaktifannya.
- Menambahkan `OpenClawBuildTimestamp` (ISO8601 UTC) dan `OpenClawGitCommit` (hash pendek, `unknown` jika tidak tersedia) ke Info.plist agar tab Tentang dapat menampilkan build, git, serta saluran debug/rilis.
- Menjalankan audit ID Tim setelah penandatanganan dan akan gagal jika ada Mach-O di dalam bundel yang memiliki ID Tim berbeda. Tetapkan `SKIP_TEAM_ID_CHECK=1` untuk melewatinya.

## Penggunaan

```bash
# dari root repositori
scripts/package-mac-app.sh                                                      # memilih identitas secara otomatis; galat jika tidak ditemukan
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # sertifikat asli
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (izin tidak akan dipertahankan)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ad hoc eksplisit (dengan peringatan yang sama)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # solusi sementara khusus pengembangan untuk ketidakcocokan ID Tim Sparkle
```

### Catatan penandatanganan ad hoc

`SIGN_IDENTITY="-"` menonaktifkan Hardened Runtime (`--options runtime`) untuk mencegah kerusakan saat aplikasi memuat kerangka kerja tersemat (seperti Sparkle) yang tidak menggunakan ID Tim yang sama. Tanda tangan ad hoc juga menyebabkan izin TCC tidak dipertahankan; lihat [izin macOS](/id/platforms/mac/permissions) untuk langkah-langkah pemulihan.

## Metadata build untuk Tentang

Tab Tentang membaca `OpenClawBuildTimestamp` dan `OpenClawGitCommit` dari Info.plist untuk menampilkan versi, tanggal build, commit git, dan apakah build tersebut DEBUG (melalui `#if DEBUG`). Jalankan kembali pengemas setelah perubahan kode untuk memperbarui nilai-nilai ini.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [izin macOS](/id/platforms/mac/permissions)
