---
read_when:
    - Menerbitkan skill atau plugin
    - Men-debug kesalahan cakupan pemilik atau paket
    - Menambahkan perilaku penerbitan pada UI, CLI, atau backend
summary: Cara kerja penerbitan ClawHub untuk keterampilan, plugin, pemilik, cakupan, rilis, dan review.
x-i18n:
    generated_at: "2026-07-19T04:50:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 582dffaf4429e9f24d7c38f2809cc7dc05f8471e4ae2f9c6be60153cc8604e3f
    source_path: clawhub/publishing.md
    workflow: 16
---

# Penerbitan

Penerbitan mengirim folder skill atau paket plugin ke ClawHub di bawah pemilik yang
Anda pilih. ClawHub memeriksa bahwa token Anda dapat menerbitkan untuk pemilik tersebut, memvalidasi
metadata, nama, versi, file, dan informasi sumber, lalu menyimpan rilis
dan memulai pemeriksaan keamanan otomatis.

Jika validasi gagal, tidak ada yang diterbitkan. Rilis baru juga mungkin tetap tidak tersedia di
antarmuka penginstalan dan pengunduhan normal hingga review selesai.

## Skills

Jalur penerbitan paling sederhana adalah CLI. Masuk, lalu terbitkan folder skill
lokal:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Gunakan `--owner <handle>` saat menerbitkan untuk pemilik organisasi. Hilangkan opsi tersebut untuk menerbitkan sebagai
pengguna yang diautentikasi. Penerbitan melewati konten yang tidak berubah. Skill baru dimulai
pada `1.0.0`, dan perubahan berikutnya secara otomatis menerbitkan versi patch selanjutnya. Berikan
`--version` hanya saat Anda memerlukan versi eksplisit.

Untuk repositori katalog, gunakan
[alur kerja `skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) ClawHub yang dapat digunakan kembali.
Alur kerja tersebut memanggil `skill publish` untuk setiap folder skill langsung di bawah `root` (default:
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

Gunakan `dry_run: true` untuk mempratinjau skill baru dan yang berubah tanpa menerbitkannya.

## Plugin

Plugin menggunakan nama paket bergaya npm. Nama paket dengan cakupan menyertakan pemilik di
bagian pertama nama:

```text
@owner/package-name
```

Cakupan harus cocok dengan pemilik penerbitan yang dipilih. Jika paket Anda bernama
`@openclaw/dronzer`, paket tersebut hanya dapat diterbitkan sebagai `@openclaw`. Jika Anda menerbitkan sebagai
`@vintageayu`, ubah nama paket menjadi `@vintageayu/dronzer`.

Hal ini mencegah paket mengklaim namespace organisasi yang tidak
dikendalikan penerbit.

Jika Anda adalah pemilik sah organisasi, merek, cakupan paket, pegangan pemilik, atau
namespace yang sudah diklaim atau dicadangkan di ClawHub, buka
[isu Klaim Organisasi / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
dengan bukti publik yang tidak sensitif. Lihat
[Klaim Organisasi dan Namespace](/clawhub/namespace-claims) untuk mengetahui apa yang harus disertakan dan apa yang
tidak boleh dicantumkan dalam isu publik.

### Sebelum Menerbitkan Plugin

- Pilih pemilik yang cocok dengan cakupan paket.
- Sertakan `openclaw.plugin.json`. Plugin kode juga memerlukan `package.json` dengan
  `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.
- Untuk menampilkan ikon katalog plugin khusus di halaman beranda dan halaman daftar plugin,
  tambahkan `icon` ke `openclaw.plugin.json` dengan URL gambar HTTPS apa pun.
- Sertakan repositori sumber dan metadata commit yang tepat, atau gunakan CLI dari
  checkout yang didukung GitHub agar CLI dapat mendeteksinya.
- Jalankan `clawhub package validate <source>` sebelum menerbitkan. Untuk temuan paket,
  manifes, impor SDK, atau artefak, lihat
  [Perbaikan validasi plugin](/clawhub/plugin-validation-fixes).
- Jalankan `clawhub package publish <source> --dry-run` sebelum membuat rilis.
- Perkirakan rilis baru tetap tidak tersedia di antarmuka penginstalan publik hingga pemeriksaan
  keamanan otomatis dan verifikasi selesai.

### Penerbitan Tepercaya untuk Paket

Penerbitan tepercaya paket memerlukan penyiapan dua langkah:

1. Terbitkan paket satu kali melalui `clawhub package publish` manual normal atau yang diautentikasi
   dengan token. Tindakan ini membuat baris paket dan menetapkan
   pengelola paket yang dapat mengubah konfigurasi penerbit tepercayanya.
2. Pengelola paket mengatur konfigurasi penerbit tepercaya GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Setelah konfigurasi diatur, penerbitan GitHub Actions mendatang yang didukung dapat menggunakan
OIDC/penerbitan tepercaya tanpa menyimpan token ClawHub berumur panjang di
repositori. Repositori dan nama file alur kerja yang dikonfigurasi harus cocok dengan
klaim OIDC GitHub Actions. Jika Anda juga memberikan `--environment <name>`, klaim lingkungan
GitHub Actions harus cocok persis dengan nama tersebut.

ClawHub memverifikasi repositori GitHub yang dikonfigurasi saat konfigurasi penerbit tepercaya
diatur. Repositori publik dapat diverifikasi melalui metadata GitHub publik.
Repositori privat mengharuskan ClawHub memiliki akses GitHub ke repositori tersebut,
misalnya melalui penginstalan GitHub App ClawHub di masa mendatang atau integrasi GitHub
resmi lainnya.

Alur kerja penerbitan paket yang dapat digunakan kembali saat ini mendukung penerbitan tepercaya
tanpa rahasia untuk penerbitan `workflow_dispatch` saat `id-token: write`
tersedia. Penerbitan nyata melalui push tag masih memerlukan `clawhub_token`, jadi pastikan
`CLAWHUB_TOKEN` tersedia untuk rilis tag, penerbitan pertama, paket yang tidak tepercaya,
atau penerbitan darurat.

Periksa atau hapus konfigurasi dengan:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Menghapus konfigurasi penerbit tepercaya adalah jalur pemulihan. Tindakan ini menonaktifkan pencetakan
token penerbitan tepercaya mendatang hingga pengelola paket mengatur konfigurasi lagi.

## Pertanyaan Umum

### Cakupan paket harus cocok dengan pemilik yang dipilih

Jika cakupan paket dan pemilik yang dipilih tidak cocok, ClawHub menolak
penerbitan:

```text
Cakupan paket "@openclaw" harus cocok dengan pemilik yang dipilih "@vintageayu".
Terbitkan sebagai "@openclaw" atau ubah nama paket ini menjadi "@vintageayu/dronzer".
```

Untuk memperbaikinya, pilih pemilik yang disebutkan oleh cakupan paket, atau ubah nama
paket agar cakupannya cocok dengan pemilik yang dapat Anda gunakan untuk menerbitkan.

Jika nama paket sudah memiliki cakupan yang benar tetapi paket dimiliki oleh
penerbit yang salah, transfer kepemilikannya:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Gunakan transfer paket atau skill hanya jika Anda memiliki akses admin ke
pemilik saat ini dan penerbit tujuan. Transfer paket tidak memungkinkan Anda
menerbitkan ke cakupan yang tidak dapat Anda kelola.

Jika Anda tidak memiliki akses ke pemilik saat ini tetapi yakin bahwa organisasi, proyek, atau
merek Anda adalah pemilik namespace yang sah, buka
[isu Klaim Organisasi / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
dengan bukti publik yang tidak sensitif untuk review staf. Lihat
[Klaim Organisasi dan Namespace](/clawhub/namespace-claims) sebelum mengajukannya.

Hal ini melindungi namespace organisasi. Paket bernama `@openclaw/dronzer` mengklaim
namespace `@openclaw`, sehingga hanya penerbit yang memiliki akses ke pemilik `@openclaw`
yang dapat menerbitkannya.
