---
read_when:
    - Menerbitkan Skills atau Plugin
    - Men-debug kesalahan cakupan owner atau paket
    - Menambahkan perilaku UI publikasi, CLI, atau backend
summary: Cara kerja penerbitan ClawHub untuk Skills, Plugin, pemilik, cakupan, rilis, dan tinjauan.
x-i18n:
    generated_at: "2026-06-27T17:15:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Penerbitan

Penerbitan mengirim folder Skills atau paket Plugin ke ClawHub di bawah pemilik yang
Anda pilih. ClawHub memeriksa bahwa token Anda dapat menerbitkan untuk pemilik tersebut, memvalidasi
metadata, nama, versi, file, dan informasi sumber, lalu menyimpan rilis
dan memulai pemeriksaan keamanan otomatis.

Jika validasi gagal, tidak ada yang diterbitkan. Rilis baru juga dapat tetap tidak muncul dari
permukaan instalasi dan unduhan normal sampai peninjauan selesai.

## Skills

Jalur penerbitan paling sederhana adalah CLI. Masuk, lalu terbitkan folder Skills
lokal:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Gunakan `--owner <handle>` saat menerbitkan ke pemilik organisasi. Abaikan untuk menerbitkan sebagai
pengguna yang diautentikasi. Penerbitan melewati konten yang tidak berubah. Skills baru dimulai
pada `1.0.0`, dan perubahan berikutnya secara otomatis menerbitkan versi patch berikutnya. Berikan
`--version` hanya ketika Anda memerlukan versi eksplisit.

Untuk repo katalog, gunakan
[`skill-publish.yml` workflow](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
pakai ulang milik ClawHub.
Workflow ini memanggil `skill publish` untuk setiap folder Skills langsung di bawah `root` (default:
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

Gunakan `dry_run: true` untuk meninjau Skills baru dan yang berubah tanpa menerbitkan.

## Plugin

Plugin menggunakan nama paket bergaya npm. Nama paket berscope menyertakan pemilik di
bagian pertama nama:

```text
@owner/package-name
```

Scope harus cocok dengan pemilik penerbitan yang dipilih. Jika paket Anda bernama
`@openclaw/dronzer`, paket itu hanya dapat diterbitkan sebagai `@openclaw`. Jika Anda menerbitkan sebagai
`@vintageayu`, ganti nama paket menjadi `@vintageayu/dronzer`.

Ini mencegah paket mengklaim namespace organisasi yang tidak dikendalikan oleh
penerbit.

Jika Anda adalah pemilik sah dari organisasi, merek, scope paket, handle pemilik, atau
namespace yang sudah diklaim atau dicadangkan di ClawHub, buka
[isu Klaim Organisasi / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
dengan bukti publik yang tidak sensitif. Lihat
[Klaim Organisasi dan Namespace](/id/clawhub/namespace-claims) untuk apa yang harus disertakan dan apa yang
harus dijauhkan dari isu publik.

### Sebelum Menerbitkan Plugin

- Pilih pemilik yang cocok dengan scope paket.
- Sertakan `openclaw.plugin.json`. Plugin kode juga memerlukan `package.json` dengan
  `openclaw.compat.pluginApi` dan `openclaw.build.openclawVersion`.
- Untuk menampilkan ikon kartu Plugin kustom, tambahkan `icon` ke `openclaw.plugin.json` dengan
  URL gambar HTTPS apa pun.
- Sertakan repositori sumber dan metadata commit persis, atau gunakan CLI dari
  checkout yang didukung GitHub agar dapat mendeteksinya.
- Jalankan `clawhub package validate <source>` sebelum menerbitkan. Untuk temuan paket,
  manifes, impor SDK, atau artefak, lihat
  [perbaikan validasi Plugin](/id/clawhub/plugin-validation-fixes).
- Jalankan `clawhub package publish <source> --dry-run` sebelum membuat rilis.
- Perkirakan rilis baru tetap tidak muncul dari permukaan instalasi publik sampai pemeriksaan
  keamanan otomatis dan verifikasi selesai.

### Penerbitan Tepercaya untuk Paket

Penerbitan tepercaya paket adalah penyiapan dua langkah:

1. Terbitkan paket sekali melalui `clawhub package publish` manual normal atau yang diautentikasi token.
   Ini membuat baris paket dan menetapkan
   pengelola paket yang dapat mengubah konfigurasi penerbit tepercaya paket.
2. Pengelola paket mengatur konfigurasi penerbit tepercaya GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Setelah konfigurasi diatur, penerbitan GitHub Actions yang didukung di masa mendatang dapat menggunakan
OIDC/penerbitan tepercaya tanpa menyimpan token ClawHub berumur panjang di
repositori. Repositori dan nama file workflow yang dikonfigurasi harus cocok dengan
klaim OIDC GitHub Actions. Jika Anda juga memberikan `--environment <name>`, klaim
lingkungan GitHub Actions harus sama persis dengan nama tersebut.

ClawHub memverifikasi repositori GitHub yang dikonfigurasi saat konfigurasi penerbit tepercaya
diatur. Repositori publik dapat diverifikasi melalui metadata GitHub publik.
Repositori privat mengharuskan ClawHub memiliki akses GitHub ke repositori tersebut,
misalnya melalui instalasi GitHub App ClawHub di masa mendatang atau integrasi
GitHub lain yang diotorisasi.

Workflow penerbitan paket pakai ulang saat ini mendukung penerbitan tepercaya tanpa secret
untuk penerbitan `workflow_dispatch` saat `id-token: write`
tersedia. Penerbitan nyata dari push tag masih memerlukan `clawhub_token`, jadi tetap sediakan
`CLAWHUB_TOKEN` untuk rilis tag, penerbitan pertama, paket tidak tepercaya,
atau penerbitan darurat.

Periksa atau hapus konfigurasi dengan:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Menghapus konfigurasi penerbit tepercaya adalah jalur rollback. Ini menonaktifkan pembuatan token
penerbitan tepercaya di masa mendatang sampai pengelola paket mengatur konfigurasi lagi.

## FAQ

### Scope paket harus cocok dengan pemilik yang dipilih

Jika scope paket dan pemilik yang dipilih tidak cocok, ClawHub menolak
penerbitan:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Untuk memperbaikinya, pilih pemilik yang dinamai oleh scope paket, atau ganti nama
paket agar scope cocok dengan pemilik yang dapat Anda gunakan untuk menerbitkan.

Jika nama paket sudah memiliki scope yang benar tetapi paket dimiliki oleh
penerbit yang salah, transfer kepemilikan sebagai gantinya:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Gunakan transfer paket atau Skills hanya ketika Anda memiliki akses admin ke
pemilik saat ini dan penerbit tujuan. Transfer paket tidak memungkinkan Anda
menerbitkan ke scope yang tidak dapat Anda kelola.

Jika Anda tidak memiliki akses ke pemilik saat ini tetapi yakin organisasi, proyek, atau
merek Anda adalah pemilik namespace yang sah, buka
[isu Klaim Organisasi / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
dengan bukti publik yang tidak sensitif untuk ditinjau staf. Lihat
[Klaim Organisasi dan Namespace](/id/clawhub/namespace-claims) sebelum mengajukan.

Ini melindungi namespace organisasi. Paket bernama `@openclaw/dronzer` mengklaim
namespace `@openclaw`, sehingga hanya penerbit dengan akses ke pemilik `@openclaw`
yang dapat menerbitkannya.
