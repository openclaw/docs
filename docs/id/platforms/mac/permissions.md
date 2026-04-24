---
read_when:
    - Men-debug prompt izin macOS yang hilang atau macet
    - Memaketkan atau menandatangani aplikasi macOS
    - Mengubah bundle ID atau path pemasangan aplikasi
summary: Persistensi izin macOS (TCC) dan persyaratan penandatanganan
title: Izin macOS
x-i18n:
    generated_at: "2026-04-24T09:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 15
---

Pemberian izin macOS bersifat rapuh. TCC mengaitkan pemberian izin dengan
signature kode aplikasi, bundle identifier, dan path di disk. Jika salah satu dari itu berubah,
macOS memperlakukan aplikasi sebagai aplikasi baru dan dapat menghapus atau menyembunyikan prompt.

## Persyaratan untuk izin yang stabil

- Path yang sama: jalankan aplikasi dari lokasi tetap (untuk OpenClaw, `dist/OpenClaw.app`).
- Bundle identifier yang sama: mengubah bundle ID membuat identitas izin baru.
- Aplikasi yang ditandatangani: build yang tidak ditandatangani atau ditandatangani ad-hoc tidak mempertahankan izin.
- Signature yang konsisten: gunakan sertifikat Apple Development atau Developer ID yang nyata
  agar signature tetap stabil di beberapa build ulang.

Signature ad-hoc menghasilkan identitas baru pada setiap build. macOS akan melupakan
pemberian izin sebelumnya, dan prompt bisa hilang sepenuhnya sampai entri usang dibersihkan.

## Checklist pemulihan saat prompt menghilang

1. Keluar dari aplikasi.
2. Hapus entri aplikasi di System Settings -> Privacy & Security.
3. Luncurkan ulang aplikasi dari path yang sama dan berikan izin lagi.
4. Jika prompt tetap tidak muncul, reset entri TCC dengan `tccutil` lalu coba lagi.
5. Beberapa izin baru muncul kembali setelah restart macOS penuh.

Contoh reset (ganti bundle ID sesuai kebutuhan):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Izin file dan folder (Desktop/Documents/Downloads)

macOS juga dapat membatasi Desktop, Documents, dan Downloads untuk proses terminal/latar belakang. Jika pembacaan file atau listing direktori macet, berikan akses ke konteks proses yang sama yang melakukan operasi file (misalnya Terminal/iTerm, aplikasi yang diluncurkan LaunchAgent, atau proses SSH).

Solusi sementara: pindahkan file ke workspace OpenClaw (`~/.openclaw/workspace`) jika Anda ingin menghindari pemberian izin per folder.

Jika Anda sedang menguji izin, selalu tandatangani dengan sertifikat yang nyata. Build ad-hoc hanya dapat diterima untuk run lokal cepat saat izin tidak penting.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Penandatanganan macOS](/id/platforms/mac/signing)
