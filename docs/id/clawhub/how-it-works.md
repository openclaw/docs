---
read_when:
    - Memahami daftar, versi, penginstalan, penerbitan, dan moderasi
summary: Cara kerja daftar, versi, instalasi, penerbitan, pemindaian, dan pembaruan ClawHub.
x-i18n:
    generated_at: "2026-07-16T17:51:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registri untuk Skills dan Plugin OpenClaw. ClawHub menyediakan
tempat bagi pengguna untuk menemukan paket, bagi penerbit untuk merilis versi, dan
metadata yang memadai bagi OpenClaw untuk memasang serta memperbarui paket tersebut dengan aman.

## Catatan registri

Setiap cantuman publik merupakan catatan registri yang berisi:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang diterbitkan
- metadata, ringkasan, berkas, dan atribusi sumber
- catatan perubahan dan informasi tag seperti `latest`
- sinyal unduhan, pemasangan, dan bintang
- status pemindaian keamanan dan moderasi

Halaman cantuman merupakan tempat kanonis bagi pengguna untuk memeriksa apa yang
diklaim dapat dilakukan oleh suatu skill atau Plugin sebelum memasangnya.

## Skills

Skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Bundel ini dapat mencakup
berkas pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama skill,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan memasang skill tersebut dan
membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dideklarasikan dan yang diamati.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw memasang Plugin dari ClawHub, OpenClaw memeriksa metadata
kompatibilitas yang dinyatakan sebelum pemasangan. Catatan paket dapat mencakup kompatibilitas API,
versi minimum Gateway, target host, persyaratan lingkungan, dan digest
artefak.

Gunakan sumber pemasangan ClawHub secara eksplisit jika Anda ingin registri menjadi
sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Penerbitan

Penerbitan membuat catatan versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub`
untuk alur kerja registri yang diautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan uji coba untuk meninjau payload yang telah diresolusi sebelum diunggah. Halaman publik kemudian
menampilkan metadata, berkas, atribusi sumber, dan status pemindaian yang diterbitkan.

## Pemasangan dan pembaruan

Perintah pemasangan OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber pemasangan agar pembaruan nantinya dapat meresolusi
paket registri yang sama. CLI ClawHub juga mendukung alur kerja pemasangan dan
pembaruan skill secara langsung bagi pengguna yang menginginkan folder skill yang dikelola registri di luar
ruang kerja OpenClaw lengkap.

## Status keamanan

ClawHub terbuka untuk penerbitan, tetapi rilis tetap tunduk pada gerbang pengunggahan,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian jika tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat menghilang dari pencarian publik dan alur pemasangan, tetapi tetap
terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan](/clawhub/security), [Audit Keamanan](/clawhub/security-audits),
[Moderasi dan Keamanan Akun](/id/clawhub/moderation), dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage).

## Akses API

ClawHub menyediakan API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini apabila menautkan kembali ke
cantuman kanonis ClawHub, mematuhi batas laju, dan tidak menyiratkan dukungan.

Lihat [API Publik](/clawhub/api) dan [API HTTP](/clawhub/http-api).
