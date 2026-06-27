---
read_when:
    - Men-debug prompt izin macOS yang hilang atau macet
    - Memutuskan apakah akan memberikan Aksesibilitas kepada node atau runtime CLI
    - Memaketkan atau menandatangani aplikasi macOS
    - Mengubah ID bundel atau jalur instalasi aplikasi
summary: Persistensi izin macOS (TCC) dan persyaratan penandatanganan
title: Izin macOS
x-i18n:
    generated_at: "2026-06-27T17:43:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Pemberian izin macOS rentan berubah. TCC mengaitkan pemberian izin dengan
tanda tangan kode aplikasi, pengenal bundel, dan jalur di disk. Jika salah satunya berubah,
macOS memperlakukan aplikasi sebagai baru dan dapat menghapus atau menyembunyikan prompt.

## Persyaratan untuk izin yang stabil

- Jalur yang sama: jalankan aplikasi dari lokasi tetap (untuk OpenClaw, `dist/OpenClaw.app`).
- Pengenal bundel yang sama: mengubah ID bundel membuat identitas izin baru.
- Aplikasi bertanda tangan: build tanpa tanda tangan atau bertanda tangan ad-hoc tidak mempertahankan izin.
- Tanda tangan konsisten: gunakan sertifikat Apple Development atau Developer ID sungguhan
  agar tanda tangan tetap stabil di setiap rebuild.

Tanda tangan ad-hoc menghasilkan identitas baru pada setiap build. macOS akan melupakan
pemberian izin sebelumnya, dan prompt dapat hilang sepenuhnya sampai entri lama dibersihkan.

## Pemberian izin Aksesibilitas untuk runtime Node dan CLI

Sebaiknya berikan Aksesibilitas kepada OpenClaw.app, Peekaboo.app, atau helper bertanda tangan lain
dengan pengenal bundelnya sendiri, bukan kepada biner `node` generik.

TCC macOS memberikan Aksesibilitas kepada identitas kode proses yang dilihatnya. Jika
alur kerja Homebrew, nvm, pnpm, atau npm menyebabkan executable `node` bersama
menerima Aksesibilitas, paket JavaScript apa pun yang diluncurkan melalui executable
yang sama dapat mewarisi hak istimewa otomatisasi GUI.

Perlakukan entri `node` di Pengaturan Sistem sebagai izin luas untuk runtime Node
tersebut, bukan sebagai izin untuk satu paket npm. Hindari memberikan Aksesibilitas kepada
`node` kecuali Anda memercayai setiap skrip dan paket yang diluncurkan melalui instalasi
Node yang persis sama.

Jika Anda tidak sengaja memberikan Aksesibilitas kepada `node`, hapus entri tersebut dari
Pengaturan Sistem -> Privasi & Keamanan -> Aksesibilitas. Lalu berikan izin kepada aplikasi
atau helper bertanda tangan yang seharusnya memiliki otomatisasi UI.

## Daftar periksa pemulihan saat prompt hilang

1. Keluar dari aplikasi.
2. Hapus entri aplikasi di Pengaturan Sistem -> Privasi & Keamanan.
3. Luncurkan ulang aplikasi dari jalur yang sama dan berikan ulang izin.
4. Jika prompt masih tidak muncul, reset entri TCC dengan `tccutil` dan coba lagi.
5. Beberapa izin baru muncul kembali setelah macOS dimulai ulang sepenuhnya.

Contoh reset (ganti ID bundel sesuai kebutuhan):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Izin file dan folder (Desktop/Documents/Downloads)

macOS juga dapat membatasi Desktop, Documents, dan Downloads untuk proses terminal/latar belakang. Jika pembacaan file atau daftar direktori macet, berikan akses kepada konteks proses yang sama yang melakukan operasi file (misalnya Terminal/iTerm, aplikasi yang diluncurkan LaunchAgent, atau proses SSH).

Solusi sementara: pindahkan file ke workspace OpenClaw (`~/.openclaw/workspace`) jika Anda ingin menghindari pemberian izin per folder.

Jika Anda menguji izin, selalu tanda tangani dengan sertifikat sungguhan. Build ad-hoc
hanya dapat diterima untuk proses lokal cepat ketika izin tidak penting.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Penandatanganan macOS](/id/platforms/mac/signing)
