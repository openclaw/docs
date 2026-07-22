---
read_when:
    - Men-debug prompt izin macOS yang tidak muncul atau macet
    - Menentukan apakah akan memberikan akses Aksesibilitas kepada node atau runtime CLI
    - Mengemas atau menandatangani aplikasi macOS
    - Mengubah ID bundel atau jalur instalasi aplikasi
summary: Persistensi izin macOS (TCC) dan persyaratan penandatanganan
title: izin macOS
x-i18n:
    generated_at: "2026-07-22T01:49:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e561aa641e44fc1e1b95a3db244f31124e4e51d13ae709bee188d86054301e34
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Pemberian izin macOS bersifat rapuh. TCC mengaitkan pemberian izin dengan tanda tangan kode aplikasi, pengidentifikasi bundel, dan jalur pada disk. Jika salah satunya berubah, macOS memperlakukan aplikasi sebagai aplikasi baru dan mungkin menghapus atau menyembunyikan permintaan izin.

## Persyaratan untuk izin yang stabil

- Jalur yang sama: jalankan aplikasi dari lokasi tetap (untuk OpenClaw, `dist/OpenClaw.app`).
- Pengidentifikasi bundel yang sama: ID bundel OpenClaw adalah `ai.openclaw.mac`; mengubahnya akan membuat identitas izin baru.
- Aplikasi bertanda tangan: build tanpa tanda tangan atau dengan tanda tangan ad hoc tidak mempertahankan izin.
- Tanda tangan yang konsisten: gunakan sertifikat Apple Development atau Developer ID yang valid agar tanda tangan tetap stabil di seluruh proses build ulang.

Tanda tangan ad hoc menghasilkan identitas baru pada setiap build. macOS melupakan izin yang diberikan sebelumnya, dan permintaan izin dapat hilang sepenuhnya hingga entri usang dihapus.

## Izin Aksesibilitas untuk runtime Node dan CLI

Sebaiknya berikan Aksesibilitas kepada OpenClaw.app, Peekaboo.app, atau pembantu bertanda tangan lain yang memiliki pengidentifikasi bundelnya sendiri, alih-alih kepada biner `node` generik.

TCC macOS memberikan Aksesibilitas kepada identitas kode dari proses yang dilihatnya. Jika alur kerja Homebrew, nvm, pnpm, atau npm menyebabkan executable `node` bersama menerima Aksesibilitas, paket JavaScript apa pun yang diluncurkan melalui executable yang sama dapat mewarisi hak istimewa otomatisasi GUI.

Perlakukan entri `node` di System Settings sebagai izin luas untuk runtime Node tersebut, bukan sebagai izin untuk satu paket npm. Hindari memberikan Aksesibilitas kepada `node`, kecuali Anda memercayai setiap skrip dan paket yang diluncurkan melalui instalasi Node tersebut.

Persetujuan Aksesibilitas tidak mengaktifkan berbagi aktivitas. **Settings -> Permissions -> Active computer detection** merupakan kontrol terpisah yang secara default dinonaktifkan untuk membagikan durasi menganggur terbatas kepada Gateway Anda. Menonaktifkannya akan menghapus aktivitas yang disimpan tanpa mencabut Aksesibilitas atau memutuskan koneksi Node.

Jika Anda tidak sengaja memberikan Aksesibilitas kepada `node`, hapus entri tersebut dari System Settings -> Privacy & Security -> Accessibility. Kemudian berikan izin kepada aplikasi atau pembantu bertanda tangan yang seharusnya menangani otomatisasi UI.

## Daftar periksa pemulihan saat permintaan izin menghilang

1. Keluar dari aplikasi.
2. Hapus entri aplikasi di System Settings -> Privacy & Security.
3. Luncurkan ulang aplikasi dari jalur yang sama dan berikan kembali izin.
4. Jika permintaan izin masih tidak muncul, atur ulang entri TCC dengan `tccutil` dan coba lagi.
5. Beberapa izin hanya muncul kembali setelah macOS dimulai ulang sepenuhnya.

Contoh pengaturan ulang (menggunakan ID bundel OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Izin file dan folder (Desktop/Documents/Downloads)

macOS juga dapat membatasi Desktop, Documents, dan Downloads untuk proses terminal/latar belakang. Jika pembacaan file atau pencantuman direktori macet, berikan akses kepada konteks proses yang sama dengan yang menjalankan operasi file (misalnya Terminal/iTerm, aplikasi yang diluncurkan oleh LaunchAgent, atau proses SSH).

Solusi sementara: pindahkan file ke ruang kerja OpenClaw (`~/.openclaw/workspace`) jika Anda ingin menghindari pemberian izin per folder.

Jika Anda menguji izin, selalu gunakan tanda tangan dengan sertifikat yang valid. Build ad hoc hanya dapat diterima untuk proses lokal singkat ketika izin tidak diperlukan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Penandatanganan macOS](/id/platforms/mac/signing)
