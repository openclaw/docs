---
read_when:
    - Memahami daftar, versi, instalasi, publikasi, dan moderasi
summary: Cara kerja listing, versi, instalasi, penerbitan, pemindaian, dan pembaruan ClawHub.
x-i18n:
    generated_at: "2026-07-03T09:57:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registry untuk Skills dan Plugin OpenClaw. ClawHub memberi pengguna
tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan
memberi OpenClaw metadata yang cukup untuk memasang dan memperbarui paket tersebut dengan aman.

## Catatan registry

Setiap listing publik adalah catatan registry dengan:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang diterbitkan
- metadata, ringkasan, file, dan atribusi sumber
- informasi changelog dan tag seperti `latest`
- sinyal unduhan, pemasangan, dan bintang
- status pemindaian keamanan dan moderasi

Halaman listing adalah tempat kanonis bagi pengguna untuk memeriksa klaim yang dibuat oleh Skill atau
Plugin sebelum memasangnya.

## Skills

Skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Skill dapat menyertakan
file pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama Skill,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan memasang Skill tersebut dan
membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dinyatakan dan yang diamati.

Lihat [Format Skill](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw memasang Plugin dari ClawHub, OpenClaw memeriksa metadata kompatibilitas
yang diiklankan sebelum pemasangan. Catatan paket dapat mencakup kompatibilitas API,
versi Gateway minimum, target host, persyaratan lingkungan, dan digest artefak.

Gunakan sumber pemasangan ClawHub yang eksplisit saat Anda ingin registry menjadi
sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Penerbitan

Penerbitan membuat catatan versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub`
untuk alur kerja registry yang diautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan dry run untuk meninjau payload yang di-resolve sebelum upload. Halaman publik kemudian
menampilkan metadata yang diterbitkan, file, atribusi sumber, dan status pemindaian.

## Pemasangan dan pembaruan

Perintah pemasangan OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber pemasangan sehingga pembaruan dapat me-resolve paket
registry yang sama nanti. CLI ClawHub juga mendukung alur kerja pemasangan dan
pembaruan Skill langsung untuk pengguna yang menginginkan folder Skill yang dikelola registry di luar
workspace OpenClaw lengkap.

## Status keamanan

ClawHub terbuka untuk penerbitan, tetapi rilis tetap tunduk pada gate upload,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian saat tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat menghilang dari pencarian publik dan alur pemasangan sambil tetap
terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan](/clawhub/security), [Audit Keamanan](/clawhub/security-audits),
[Moderasi dan Keamanan Akun](/id/clawhub/moderation), dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage).

## Akses API

ClawHub mengekspos API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini saat mereka menautkan kembali ke
listing ClawHub kanonis, mematuhi batas laju, dan menghindari kesan adanya dukungan resmi.

Lihat [API Publik](/clawhub/api) dan [HTTP API](/clawhub/http-api).
