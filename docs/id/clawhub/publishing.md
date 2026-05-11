---
read_when:
    - Menerbitkan Skills atau Plugin
    - Men-debug kesalahan cakupan pemilik atau paket
    - Menambahkan perilaku publikasi pada antarmuka pengguna, CLI, atau backend
summary: Cara kerja penerbitan ClawHub untuk Skills, Plugin, pemilik, cakupan, rilis, dan peninjauan.
x-i18n:
    generated_at: "2026-05-11T20:24:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# Penerbitan

Penerbitan ClawHub dibatasi berdasarkan pemilik: setiap penerbitan menargetkan penerbit, dan
server menentukan apakah pengguna yang sudah masuk diizinkan untuk menerbitkan di sana.

## Pemilik

Pemilik adalah handle penerbit ClawHub, seperti `@alice` atau `@openclaw`.
Pemilik pribadi dibuat untuk pengguna. Pemilik organisasi dapat memiliki beberapa anggota.

Saat menerbitkan, Anda menggunakan pemilik pribadi Anda atau memilih pemilik organisasi
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

Permintaan penerbitan mencakup pemilik yang dipilih, slug, versi, changelog, dan
file. Server memverifikasi bahwa aktor dapat menerbitkan sebagai pemilik tersebut sebelum
membuat rilis.

Untuk memindahkan skill yang sudah ada ke pemilik lain saat menerbitkan versi baru, pilih
pemilik baru dan konfirmasikan pemindahan kepemilikan secara eksplisit. Di CLI/API, teruskan
pemilik target beserta opt-in migrasi:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Migrasi pemilik skill memerlukan akses admin atau pemilik pada pemilik saat ini
dan pemilik tujuan. Migrasi ini mempertahankan skill, riwayat versi, statistik,
komentar, fork, alias, dan jejak audit; URL pemilik lama tetap berfungsi melalui
jalur alias/pengalihan.

## Plugin

Plugin menggunakan nama paket bergaya npm. Nama paket berlingkup menyertakan pemilik di
bagian pertama nama:

```text
@owner/package-name
```

Lingkup harus cocok dengan pemilik penerbitan yang dipilih. Jika paket Anda bernama
`@openclaw/dronzer`, paket tersebut hanya dapat diterbitkan sebagai `@openclaw`. Jika Anda menerbitkan sebagai
`@vintageayu`, ubah nama paket menjadi `@vintageayu/dronzer`.

Ini mencegah paket mengklaim namespace organisasi yang tidak dikendalikan oleh
penerbit.

## Alur Rilis

1. UI, CLI, atau alur kerja GitHub mengumpulkan metadata dan file paket.
2. Permintaan penerbitan dikirim ke ClawHub dengan pemilik yang dipilih.
3. Server memvalidasi izin pemilik, lingkup paket, nama paket, versi,
   batas file, dan metadata sumber.
4. ClawHub menyimpan rilis dan memulai pemeriksaan keamanan otomatis.
5. Rilis baru disembunyikan dari permukaan instal/unduhan normal hingga peninjauan
   dan verifikasi selesai.

Jika validasi gagal, rilis tidak dibuat.

## Tanya Jawab

### Lingkup paket harus cocok dengan pemilik yang dipilih

Jika lingkup paket dan pemilik yang dipilih tidak cocok, ClawHub menolak
penerbitan:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Untuk memperbaikinya, pilih pemilik yang disebutkan oleh lingkup paket, atau ubah nama
paket agar lingkupnya cocok dengan pemilik yang dapat Anda gunakan untuk menerbitkan.

Jika nama paket sudah memiliki lingkup yang benar tetapi paket dimiliki oleh
penerbit yang salah, alihkan kepemilikan sebagai gantinya:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Gunakan transfer paket atau skill hanya saat Anda memiliki akses admin ke kedua
pemilik saat ini dan penerbit tujuan. Transfer paket tidak memungkinkan Anda
menerbitkan ke lingkup yang tidak dapat Anda kelola.

Ini melindungi namespace organisasi. Paket bernama `@openclaw/dronzer` mengklaim
namespace `@openclaw`, sehingga hanya penerbit dengan akses ke pemilik `@openclaw`
yang dapat menerbitkannya.
