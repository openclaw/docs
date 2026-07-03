---
read_when:
    - Memahami daftar, versi, instalasi, penerbitan, dan moderasi
summary: Cara kerja listing ClawHub, versi, instalasi, penerbitan, pemindaian, dan pembaruan.
x-i18n:
    generated_at: "2026-07-03T02:54:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registri untuk Skills dan Plugin OpenClaw. ClawHub memberi pengguna
tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan
memberi OpenClaw metadata yang cukup untuk menginstal dan memperbarui paket tersebut dengan aman.

## Rekaman registri

Setiap listing publik adalah rekaman registri dengan:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang dipublikasikan
- metadata, ringkasan, file, dan atribusi sumber
- changelog dan informasi tag seperti `latest`
- sinyal unduhan, instalasi, dan bintang
- status pemindaian keamanan dan moderasi

Halaman listing adalah tempat kanonis bagi pengguna untuk memeriksa apa yang diklaim
oleh sebuah Skills atau Plugin sebelum menginstalnya.

## Skills

Skills adalah bundel teks berversi yang berpusat pada `SKILL.md`. Bundel ini dapat menyertakan
file pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama Skills,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan menginstal Skills tersebut dan
membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dideklarasikan dan yang diamati.

Lihat [Format Skills](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan rekaman versi.

Saat OpenClaw menginstal Plugin dari ClawHub, OpenClaw memeriksa metadata
kompatibilitas yang diiklankan sebelum menginstal. Rekaman paket dapat menyertakan kompatibilitas API,
versi Gateway minimum, target host, persyaratan lingkungan, dan digest
artefak.

Gunakan sumber instalasi ClawHub eksplisit saat Anda ingin registri menjadi
sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Publikasi

Publikasi membuat rekaman versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub`
untuk alur kerja registri yang diautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan dry run untuk meninjau payload yang di-resolve sebelum unggah. Halaman publik kemudian
menampilkan metadata yang dipublikasikan, file, atribusi sumber, dan status pemindaian.

## Instalasi dan pembaruan

Perintah instalasi OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw merekam metadata sumber instalasi sehingga pembaruan nantinya dapat me-resolve
paket registri yang sama. CLI ClawHub juga mendukung alur kerja instalasi dan
pembaruan Skills langsung untuk pengguna yang menginginkan folder Skills yang dikelola registri di luar
workspace OpenClaw lengkap.

## Status keamanan

ClawHub terbuka untuk publikasi, tetapi rilis tetap tunduk pada gerbang unggahan,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian jika tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat menghilang dari pencarian publik dan alur instalasi sambil tetap
terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan](/clawhub/security), [Audit Keamanan](/clawhub/security-audits),
[Moderasi dan Keamanan Akun](/id/clawhub/moderation), dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage).

## Akses API

ClawHub mengekspos API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini jika mereka menautkan kembali ke
listing ClawHub kanonis, menghormati batas laju, dan menghindari kesan adanya dukungan resmi.

Lihat [API Publik](/id/clawhub/api) dan [API HTTP](/clawhub/http-api).
