---
read_when:
    - Memahami daftar, versi, instalasi, penerbitan, dan moderasi
summary: Cara kerja listing, versi, instalasi, penerbitan, pemindaian, dan pembaruan ClawHub.
x-i18n:
    generated_at: "2026-07-03T01:04:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registry untuk skill dan plugin OpenClaw. Ini memberi pengguna
tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan
memberi OpenClaw metadata yang cukup untuk memasang dan memperbarui paket tersebut dengan aman.

## Rekaman registry

Setiap listing publik adalah rekaman registry dengan:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang diterbitkan
- metadata, ringkasan, berkas, dan atribusi sumber
- changelog dan informasi tag seperti `latest`
- sinyal unduhan, pemasangan, dan bintang
- status pemindaian keamanan dan moderasi

Halaman listing adalah tempat kanonis bagi pengguna untuk memeriksa klaim yang dibuat oleh skill atau
plugin sebelum memasangnya.

## Skills

Skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Bundel ini dapat menyertakan
berkas pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama skill,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan memasang skill tersebut dan
membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dideklarasikan dan yang diamati.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan rekaman versi.

Saat OpenClaw memasang plugin dari ClawHub, OpenClaw memeriksa metadata kompatibilitas
yang diiklankan sebelum memasang. Rekaman paket dapat mencakup kompatibilitas API,
versi Gateway minimum, target host, persyaratan lingkungan, dan digest artefak.

Gunakan sumber pemasangan ClawHub eksplisit saat Anda ingin registry menjadi
sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Penerbitan

Penerbitan membuat rekaman versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub`
untuk alur kerja registry terautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan dry run untuk mempratinjau payload yang diselesaikan sebelum pengunggahan. Halaman publik kemudian
menampilkan metadata, berkas, atribusi sumber, dan status pemindaian yang diterbitkan.

## Pemasangan dan pembaruan

Perintah pemasangan OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber pemasangan agar pembaruan dapat menyelesaikan paket
registry yang sama nanti. CLI ClawHub juga mendukung alur kerja pemasangan dan
pembaruan skill langsung bagi pengguna yang menginginkan folder skill yang dikelola registry di luar
workspace OpenClaw lengkap.

## Status keamanan

ClawHub terbuka untuk penerbitan, tetapi rilis tetap tunduk pada gerbang unggahan,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian jika tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat menghilang dari pencarian publik dan alur pemasangan, tetapi tetap
terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan](/clawhub/security), [Audit Keamanan](/clawhub/security-audits),
[Moderasi dan Keamanan Akun](/id/clawhub/moderation), dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage).

## Akses API

ClawHub mengekspos API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini jika mereka menautkan kembali ke
listing ClawHub kanonis, menghormati batas laju, dan menghindari kesan dukungan resmi.

Lihat [API Publik](/id/clawhub/api) dan [API HTTP](/clawhub/http-api).
