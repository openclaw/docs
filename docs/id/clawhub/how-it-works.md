---
read_when:
    - Memahami daftar, versi, instalasi, penerbitan, dan moderasi
summary: Cara kerja daftar, versi, instalasi, penerbitan, pemindaian, dan pembaruan ClawHub.
x-i18n:
    generated_at: "2026-07-12T14:02:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registri untuk Skills dan Plugin OpenClaw. ClawHub menyediakan
tempat bagi pengguna untuk menemukan paket, tempat bagi penerbit untuk merilis versi, dan
metadata yang memadai bagi OpenClaw untuk memasang serta memperbarui paket tersebut dengan aman.

## Catatan registri

Setiap daftar publik merupakan catatan registri yang mencakup:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang telah diterbitkan
- metadata, ringkasan, berkas, dan atribusi sumber
- informasi catatan perubahan dan tag seperti `latest`
- indikator unduhan, pemasangan, dan bintang
- status pemindaian keamanan dan moderasi

Halaman daftar merupakan tempat kanonis bagi pengguna untuk memeriksa fungsi yang diklaim
oleh Skills atau Plugin sebelum memasangnya.

## Skills

Skills adalah bundel teks berversi yang berpusat pada `SKILL.md`. Bundel ini dapat mencakup
berkas pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama Skills,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan memasang Skills tersebut dan
membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dinyatakan dan yang diamati.

Lihat [Format Skills](/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw memasang Plugin dari ClawHub, OpenClaw memeriksa metadata kompatibilitas
yang diumumkan sebelum pemasangan. Catatan paket dapat mencakup kompatibilitas API,
versi minimum Gateway, target hos, persyaratan lingkungan, dan digest artefak.

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

Gunakan uji coba kering untuk meninjau payload yang telah diresolusi sebelum diunggah. Halaman publik kemudian
menampilkan metadata, berkas, atribusi sumber, dan status pemindaian yang telah diterbitkan.

## Pemasangan dan pembaruan

Perintah pemasangan OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber pemasangan agar pembaruan dapat meresolusi paket
registri yang sama di kemudian hari. CLI ClawHub juga mendukung alur kerja pemasangan dan
pembaruan Skills secara langsung bagi pengguna yang menginginkan folder Skills yang dikelola registri di luar
ruang kerja OpenClaw lengkap.

## Status keamanan

ClawHub terbuka untuk penerbitan, tetapi rilis tetap tunduk pada gerbang unggahan,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian jika tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat menghilang dari pencarian publik dan alur pemasangan, tetapi tetap
terlihat oleh pemilik untuk keperluan diagnostik.

Lihat [Keamanan](/id/clawhub/security), [Audit Keamanan](/clawhub/security-audits),
[Moderasi dan Keamanan Akun](/id/clawhub/moderation), dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage).

## Akses API

ClawHub menyediakan API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini jika mereka menautkan kembali ke
daftar kanonis ClawHub, mematuhi batas laju, dan tidak menyiratkan dukungan resmi.

Lihat [API Publik](/clawhub/api) dan [API HTTP](/clawhub/http-api).
