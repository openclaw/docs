---
read_when:
    - Menerbitkan skill atau plugin
    - Men-debug kesalahan pemilik atau cakupan paket
    - Menambahkan perilaku penerbitan pada UI, CLI, atau backend
summary: Cara kerja penerbitan ClawHub untuk Skills, plugin, pemilik, cakupan, rilis, dan peninjauan.
x-i18n:
    generated_at: "2026-07-12T14:02:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publikasi

Publikasi mengirimkan folder skill atau paket plugin ke ClawHub di bawah pemilik yang Anda pilih. ClawHub memeriksa bahwa token Anda dapat melakukan publikasi untuk pemilik tersebut, memvalidasi metadata, nama, versi, berkas, dan informasi sumber, lalu menyimpan rilis dan memulai pemeriksaan keamanan otomatis.

Jika validasi gagal, tidak ada yang dipublikasikan. Rilis baru juga dapat tetap tidak muncul di antarmuka penginstalan dan pengunduhan biasa hingga peninjauan selesai.

## Skills

Jalur publikasi paling sederhana adalah CLI. Masuk, lalu publikasikan folder skill lokal:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Gunakan `--owner <handle>` saat melakukan publikasi ke pemilik organisasi. Hilangkan opsi tersebut untuk melakukan publikasi sebagai pengguna yang terautentikasi. Publikasi melewati konten yang tidak berubah. Skill baru dimulai pada `1.0.0`, dan perubahan berikutnya secara otomatis memublikasikan versi tambalan selanjutnya. Berikan `--version` hanya saat Anda memerlukan versi eksplisit.

Untuk repositori katalog, gunakan
[alur kerja `skill-publish.yml` ClawHub yang dapat digunakan kembali](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Alur kerja tersebut memanggil `skill publish` untuk setiap folder skill langsung di bawah `root` (bawaan:
`skills`), atau hanya folder yang diberikan sebagai `skill_path`.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Gunakan `dry_run: true` untuk melihat pratinjau skill baru dan yang berubah tanpa memublikasikannya.

## Plugin

Plugin menggunakan nama paket bergaya npm. Nama paket bercakupan menyertakan pemilik pada bagian pertama nama:

```text
@owner/package-name
```

Cakupan harus cocok dengan pemilik publikasi yang dipilih. Jika paket Anda bernama `@openclaw/dronzer`, paket tersebut hanya dapat dipublikasikan sebagai `@openclaw`. Jika Anda melakukan publikasi sebagai `@vintageayu`, ganti nama paket menjadi `@vintageayu/dronzer`.

Hal ini mencegah paket mengklaim ruang nama organisasi yang tidak dikendalikan oleh penerbit.

Jika Anda adalah pemilik sah organisasi, merek, cakupan paket, handel pemilik, atau ruang nama yang telah diklaim atau dicadangkan di ClawHub, buka
[masalah Klaim Organisasi/Ruang Nama](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
dengan bukti publik yang tidak sensitif. Lihat
[Klaim Organisasi dan Ruang Nama](/clawhub/namespace-claims) untuk mengetahui apa yang perlu disertakan dan apa yang tidak boleh dimasukkan dalam masalah publik.

### Sebelum Memublikasikan Plugin

- Pilih pemilik yang cocok dengan cakupan paket.
- Sertakan `openclaw.plugin.json`. Plugin kode juga memerlukan `package.json` dengan
  `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.
- Untuk menampilkan ikon kartu plugin khusus, tambahkan `icon` ke `openclaw.plugin.json` dengan
  URL gambar HTTPS apa pun.
- Sertakan repositori sumber dan metadata commit yang tepat, atau gunakan CLI dari
  checkout yang didukung GitHub agar CLI dapat mendeteksinya.
- Jalankan `clawhub package validate <source>` sebelum melakukan publikasi. Untuk temuan paket,
  manifes, impor SDK, atau artefak, lihat
  [Perbaikan validasi Plugin](/clawhub/plugin-validation-fixes).
- Jalankan `clawhub package publish <source> --dry-run` sebelum membuat rilis.
- Rilis baru diperkirakan tetap tidak muncul di antarmuka penginstalan publik hingga pemeriksaan
  keamanan otomatis dan verifikasi selesai.

### Publikasi Tepercaya untuk Paket

Publikasi tepercaya paket memerlukan penyiapan dua langkah:

1. Publikasikan paket satu kali melalui `clawhub package publish` manual biasa atau yang diautentikasi dengan token. Langkah ini membuat baris paket dan menetapkan pengelola paket yang dapat mengubah konfigurasi penerbit tepercayanya.
2. Pengelola paket menetapkan konfigurasi penerbit tepercaya GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Setelah konfigurasi ditetapkan, publikasi GitHub Actions yang didukung pada masa mendatang dapat menggunakan OIDC/publikasi tepercaya tanpa menyimpan token ClawHub berumur panjang di repositori. Repositori dan nama berkas alur kerja yang dikonfigurasi harus cocok dengan klaim OIDC GitHub Actions. Jika Anda juga memberikan `--environment <name>`, klaim lingkungan GitHub Actions harus sama persis dengan nama tersebut.

ClawHub memverifikasi repositori GitHub yang dikonfigurasi saat konfigurasi penerbit tepercaya ditetapkan. Repositori publik dapat diverifikasi melalui metadata publik GitHub. Repositori privat mengharuskan ClawHub memiliki akses GitHub ke repositori tersebut, misalnya melalui instalasi GitHub App ClawHub pada masa mendatang atau integrasi GitHub resmi lainnya.

Alur kerja publikasi paket yang dapat digunakan kembali saat ini mendukung publikasi tepercaya tanpa rahasia untuk publikasi `workflow_dispatch` saat `id-token: write` tersedia. Publikasi nyata melalui pengiriman tag masih memerlukan `clawhub_token`, jadi pastikan `CLAWHUB_TOKEN` tetap tersedia untuk rilis tag, publikasi pertama, paket yang tidak tepercaya, atau publikasi darurat.

Periksa atau hapus konfigurasi dengan:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Menghapus konfigurasi penerbit tepercaya merupakan jalur pengembalian. Tindakan ini menonaktifkan pembuatan token publikasi tepercaya pada masa mendatang hingga pengelola paket menetapkan konfigurasi kembali.

## Pertanyaan Umum

### Cakupan paket harus cocok dengan pemilik yang dipilih

Jika cakupan paket dan pemilik yang dipilih tidak cocok, ClawHub menolak publikasi:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Untuk memperbaikinya, pilih pemilik yang disebutkan oleh cakupan paket, atau ganti nama paket agar cakupannya cocok dengan pemilik yang dapat Anda gunakan untuk melakukan publikasi.

Jika nama paket sudah memiliki cakupan yang benar, tetapi paket dimiliki oleh penerbit yang salah, transfer kepemilikannya:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Gunakan transfer paket atau skill hanya jika Anda memiliki akses admin ke pemilik saat ini dan penerbit tujuan. Transfer paket tidak memungkinkan Anda melakukan publikasi ke cakupan yang tidak dapat Anda kelola.

Jika Anda tidak memiliki akses ke pemilik saat ini, tetapi meyakini bahwa organisasi, proyek, atau merek Anda adalah pemilik sah ruang nama tersebut, buka
[masalah Klaim Organisasi/Ruang Nama](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
dengan bukti publik yang tidak sensitif untuk ditinjau staf. Lihat
[Klaim Organisasi dan Ruang Nama](/clawhub/namespace-claims) sebelum mengajukan.

Hal ini melindungi ruang nama organisasi. Paket bernama `@openclaw/dronzer` mengklaim ruang nama
`@openclaw`, sehingga hanya penerbit yang memiliki akses ke pemilik `@openclaw`
yang dapat memublikasikannya.
