---
read_when:
    - Menerbitkan keterampilan atau Plugin
    - Menelusuri kesalahan cakupan pemilik atau paket
    - Menambahkan perilaku UI publikasi, CLI, atau backend
summary: Cara kerja penerbitan ClawHub untuk Skills, Plugin, pemilik, cakupan, rilis, dan peninjauan.
x-i18n:
    generated_at: "2026-05-10T19:26:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61de013f0ac82acbf20f99c3e0c92c8e31d3de14e9ee64f7bc7659d522747089
    source_path: clawhub/publishing.md
    workflow: 16
---

# Penerbitan

Penerbitan ClawHub dibatasi berdasarkan pemilik: setiap penerbitan menargetkan satu penerbit, dan
server menentukan apakah pengguna yang masuk diizinkan untuk menerbitkan di sana.

## Pemilik

Pemilik adalah handle penerbit ClawHub, seperti `@alice` atau `@openclaw`.
Pemilik personal dibuat untuk pengguna. Pemilik org dapat memiliki beberapa anggota.

Saat menerbitkan, Anda menggunakan pemilik personal Anda atau memilih pemilik org
tempat Anda memiliki akses penerbit.

## Skills

Skills diterbitkan dari folder skill. Halaman publiknya adalah:

```text
https://clawhub.ai/<owner>/<slug>
```

Contoh:

```text
https://clawhub.ai/alice/review-helper
```

Permintaan penerbitan menyertakan pemilik yang dipilih, slug, versi, changelog, dan
file. Server memverifikasi bahwa aktor dapat menerbitkan sebagai pemilik tersebut sebelum
membuat rilis.

Untuk memindahkan skill yang sudah ada ke pemilik lain sambil menerbitkan versi baru, pilih
pemilik baru dan konfirmasi perpindahan kepemilikan secara eksplisit. Di CLI/API, teruskan
pemilik target beserta pilihan ikut serta migrasi:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Migrasi pemilik skill memerlukan akses admin atau pemilik pada pemilik saat ini
dan pemilik tujuan. Migrasi ini mempertahankan skill, riwayat versi, statistik,
komentar, fork, alias, dan jejak audit; URL pemilik lama tetap berfungsi melalui
jalur alias/pengalihan.

## Plugin

Plugin menggunakan nama paket bergaya npm. Nama paket berscope menyertakan pemilik di
bagian pertama nama:

```text
@owner/package-name
```

Scope harus cocok dengan pemilik penerbitan yang dipilih. Jika paket Anda bernama
`@openclaw/dronzer`, paket itu hanya dapat diterbitkan sebagai `@openclaw`. Jika Anda menerbitkan sebagai
`@vintageayu`, ubah nama paket menjadi `@vintageayu/dronzer`.

Ini mencegah paket mengklaim namespace org yang tidak dikendalikan oleh penerbit.

## Alur Rilis

1. UI, CLI, atau workflow GitHub mengumpulkan metadata paket dan file.
2. Permintaan penerbitan dikirim ke ClawHub dengan pemilik yang dipilih.
3. Server memvalidasi izin pemilik, scope paket, nama paket, versi,
   batas file, dan metadata sumber.
4. ClawHub menyimpan rilis dan memulai pemeriksaan keamanan otomatis.
5. Rilis baru disembunyikan dari permukaan instalasi/unduhan normal sampai peninjauan
   dan verifikasi selesai.

Jika validasi gagal, rilis tidak dibuat.

## FAQ

### Scope paket harus cocok dengan pemilik yang dipilih

Jika scope paket dan pemilik yang dipilih tidak cocok, ClawHub menolak
penerbitan:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Untuk memperbaikinya, pilih pemilik yang dinamai oleh scope paket, atau ubah nama
paket agar scope cocok dengan pemilik yang dapat Anda gunakan untuk menerbitkan.

Jika nama paket sudah memiliki scope yang benar tetapi paket dimiliki oleh
penerbit yang salah, transfer kepemilikan sebagai gantinya:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Gunakan transfer paket hanya saat Anda memiliki akses admin ke pemilik paket saat ini
dan penerbit tujuan. Ini tidak memungkinkan Anda menerbitkan ke scope yang
tidak dapat Anda kelola.

Ini melindungi namespace org. Paket bernama `@openclaw/dronzer` mengklaim
namespace `@openclaw`, jadi hanya penerbit dengan akses ke pemilik `@openclaw`
yang dapat menerbitkannya.
