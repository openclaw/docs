---
read_when:
    - Memahami cantuman, versi, instalasi, penerbitan, dan moderasi
summary: Cara kerja daftar ClawHub, versi, pemasangan, penerbitan, pemindaian, dan pembaruan.
x-i18n:
    generated_at: "2026-05-11T20:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registry untuk Skills dan plugin OpenClaw. Ini memberi pengguna
tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan
memberi OpenClaw metadata yang cukup untuk menginstal dan memperbarui paket tersebut dengan aman.

## Catatan registry

Setiap listing publik adalah catatan registry dengan:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang telah dipublikasikan
- metadata, ringkasan, file, dan atribusi sumber
- changelog dan informasi tag seperti `latest`
- sinyal unduhan, instalasi, bintang, dan komentar
- pemindaian keamanan dan status moderasi

Halaman listing adalah tempat kanonis bagi pengguna untuk memeriksa apa yang
diklaim dapat dilakukan oleh sebuah skill atau plugin sebelum menginstalnya.

## Skills

Sebuah skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Bundel ini dapat menyertakan
file pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama skill,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan menginstal skill tersebut dan
membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dideklarasikan dan yang diamati.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dipaketkan. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw menginstal plugin dari ClawHub, OpenClaw memeriksa metadata
kompatibilitas yang diiklankan sebelum menginstal. Catatan paket dapat menyertakan kompatibilitas API,
versi gateway minimum, target host, persyaratan lingkungan, dan digest artefak.

Gunakan sumber instalasi ClawHub yang eksplisit saat Anda ingin registry menjadi
sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Publikasi

Publikasi membuat catatan versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub`
untuk alur kerja registry yang terautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan dry run untuk mempratinjau payload yang telah di-resolve sebelum upload. Halaman publik kemudian
menampilkan metadata yang dipublikasikan, file, atribusi sumber, dan status pemindaian.

## Instalasi dan pembaruan

Perintah instalasi OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber instalasi sehingga pembaruan nantinya dapat me-resolve
paket registry yang sama. CLI ClawHub juga mendukung alur kerja instalasi dan
pembaruan skill langsung untuk pengguna yang menginginkan folder skill yang dikelola registry di luar
workspace OpenClaw penuh.

## Status keamanan

ClawHub terbuka untuk publikasi, tetapi rilis tetap tunduk pada gerbang upload,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian saat tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat hilang dari pencarian publik dan alur instalasi sambil tetap
terlihat oleh pemilik untuk diagnostik atau banding.

Lihat [Keamanan + moderasi](/id/clawhub/security) dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Akses API

ClawHub mengekspos API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini saat mereka menautkan kembali ke
listing ClawHub kanonis, menghormati batas laju, dan menghindari kesan dukungan resmi.

Lihat [API Publik](/id/clawhub/api) dan [API HTTP](/id/clawhub/http-api).
