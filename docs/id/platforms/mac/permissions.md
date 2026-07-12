---
read_when:
    - Men-debug permintaan izin macOS yang tidak muncul atau macet
    - Menentukan apakah akan memberikan Aksesibilitas kepada node atau runtime CLI
    - Mengemas atau menandatangani aplikasi macOS
    - Mengubah ID bundel atau jalur instalasi aplikasi
summary: Persistensi izin macOS (TCC) dan persyaratan penandatanganan
title: izin macOS
x-i18n:
    generated_at: "2026-07-12T14:22:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Pemberian izin macOS bersifat rapuh. TCC mengaitkan pemberian izin dengan tanda tangan kode aplikasi, pengenal bundel, dan jalur pada disk. Jika salah satunya berubah, macOS memperlakukan aplikasi sebagai aplikasi baru dan mungkin menghapus atau menyembunyikan permintaan izin.

## Persyaratan untuk izin yang stabil

- Jalur yang sama: jalankan aplikasi dari lokasi tetap (untuk OpenClaw, `dist/OpenClaw.app`).
- Pengenal bundel yang sama: ID bundel OpenClaw adalah `ai.openclaw.mac`; mengubahnya akan membuat identitas izin baru.
- Aplikasi bertanda tangan: build tanpa tanda tangan atau dengan tanda tangan ad-hoc tidak mempertahankan izin.
- Tanda tangan yang konsisten: gunakan sertifikat Apple Development atau Developer ID yang valid agar tanda tangan tetap stabil di seluruh proses build ulang.

Tanda tangan ad-hoc menghasilkan identitas baru pada setiap build. macOS melupakan izin yang diberikan sebelumnya, dan permintaan izin dapat hilang sepenuhnya hingga entri lama dihapus.

## Pemberian izin Aksesibilitas untuk runtime Node dan CLI

Sebaiknya berikan izin Aksesibilitas kepada OpenClaw.app, Peekaboo.app, atau pembantu bertanda tangan lain yang memiliki pengenal bundelnya sendiri, bukan kepada biner `node` generik.

TCC macOS memberikan izin Aksesibilitas kepada identitas kode proses yang dideteksinya. Jika alur kerja Homebrew, nvm, pnpm, atau npm menyebabkan executable `node` bersama menerima izin Aksesibilitas, paket JavaScript apa pun yang dijalankan melalui executable yang sama dapat mewarisi hak istimewa otomatisasi GUI.

Perlakukan entri `node` di System Settings sebagai izin luas untuk runtime Node tersebut, bukan sebagai izin untuk satu paket npm. Hindari memberikan izin Aksesibilitas kepada `node` kecuali Anda memercayai setiap skrip dan paket yang dijalankan melalui instalasi Node tersebut.

Jika Anda tidak sengaja memberikan izin Aksesibilitas kepada `node`, hapus entri tersebut dari System Settings -> Privacy & Security -> Accessibility. Kemudian berikan izin kepada aplikasi atau pembantu bertanda tangan yang seharusnya menangani otomatisasi UI.

## Daftar periksa pemulihan saat permintaan izin menghilang

1. Tutup aplikasi.
2. Hapus entri aplikasi di System Settings -> Privacy & Security.
3. Jalankan kembali aplikasi dari jalur yang sama dan berikan ulang izin.
4. Jika permintaan masih tidak muncul, atur ulang entri TCC dengan `tccutil`, lalu coba lagi.
5. Beberapa izin hanya muncul kembali setelah macOS dimulai ulang sepenuhnya.

Contoh pengaturan ulang (menggunakan ID bundel OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Izin file dan folder (Desktop/Documents/Downloads)

macOS juga dapat membatasi Desktop, Documents, dan Downloads untuk proses terminal/latar belakang. Jika pembacaan file atau pencantuman direktori macet, berikan akses kepada konteks proses yang sama yang menjalankan operasi file (misalnya Terminal/iTerm, aplikasi yang dijalankan oleh LaunchAgent, atau proses SSH).

Solusi sementara: pindahkan file ke ruang kerja OpenClaw (`~/.openclaw/workspace`) jika Anda ingin menghindari pemberian izin per folder.

Jika Anda menguji izin, selalu tandatangani dengan sertifikat yang valid. Build ad-hoc hanya dapat diterima untuk proses lokal singkat ketika izin tidak penting.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Penandatanganan macOS](/id/platforms/mac/signing)
