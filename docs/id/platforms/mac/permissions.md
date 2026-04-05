---
read_when:
    - Men-debug prompt izin macOS yang hilang atau macet
    - Mem-package atau menandatangani aplikasi macOS
    - Mengubah bundle ID atau path instalasi aplikasi
summary: Persistensi izin macOS (TCC) dan persyaratan penandatanganan
title: Izin macOS
x-i18n:
    generated_at: "2026-04-05T14:00:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# Izin macOS (TCC)

Pemberian izin di macOS itu rapuh. TCC mengaitkan pemberian izin dengan
signature kode aplikasi, bundle identifier, dan path di disk. Jika salah satunya berubah,
macOS menganggap aplikasi tersebut baru dan dapat menghapus atau menyembunyikan prompt.

## Persyaratan untuk izin yang stabil

- Path yang sama: jalankan aplikasi dari lokasi tetap (untuk OpenClaw, `dist/OpenClaw.app`).
- Bundle identifier yang sama: mengubah bundle ID membuat identitas izin baru.
- Aplikasi ditandatangani: build tanpa tanda tangan atau yang ditandatangani ad-hoc tidak mempertahankan izin.
- Signature yang konsisten: gunakan sertifikat Apple Development atau Developer ID yang nyata
  agar signature tetap stabil di seluruh rebuild.

Signature ad-hoc menghasilkan identitas baru setiap build. macOS akan melupakan
pemberian izin sebelumnya, dan prompt dapat hilang sepenuhnya sampai entri lama dibersihkan.

## Checklist pemulihan saat prompt hilang

1. Keluar dari aplikasi.
2. Hapus entri aplikasi di Pengaturan Sistem -> Privasi & Keamanan.
3. Jalankan ulang aplikasi dari path yang sama dan berikan kembali izin.
4. Jika prompt masih tidak muncul, reset entri TCC dengan `tccutil` lalu coba lagi.
5. Beberapa izin hanya muncul kembali setelah restart macOS penuh.

Contoh reset (ganti bundle ID sesuai kebutuhan):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Izin file dan folder (Desktop/Documents/Downloads)

macOS juga dapat membatasi akses ke Desktop, Documents, dan Downloads untuk proses terminal/latar belakang. Jika pembacaan file atau listing direktori macet, berikan akses ke konteks proses yang sama yang melakukan operasi file (misalnya proses Terminal/iTerm, aplikasi yang dijalankan LaunchAgent, atau proses SSH).

Solusi sementara: pindahkan file ke workspace OpenClaw (`~/.openclaw/workspace`) jika Anda ingin menghindari pemberian izin per folder.

Jika Anda sedang menguji izin, selalu tandatangani dengan sertifikat nyata. Build ad-hoc
hanya dapat diterima untuk run lokal cepat saat izin tidak penting.
