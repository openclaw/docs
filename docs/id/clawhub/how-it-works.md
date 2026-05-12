---
read_when:
    - Memahami daftar, versi, instalasi, penerbitan, dan moderasi
summary: Cara kerja listing, versi, instalasi, publikasi, pemindaian, dan pembaruan ClawHub.
x-i18n:
    generated_at: "2026-05-12T00:56:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registri untuk Skills dan Plugin OpenClaw. ClawHub memberi pengguna
tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan
memberi OpenClaw metadata yang cukup untuk memasang dan memperbarui paket tersebut dengan aman.

## Catatan registri

Setiap listing publik adalah catatan registri dengan:

- pemilik dan slug atau nama paket
- satu atau lebih versi yang diterbitkan
- metadata, ringkasan, file, dan atribusi sumber
- changelog dan informasi tag seperti `latest`
- sinyal unduhan, pemasangan, bintang, dan komentar
- status pemindaian keamanan dan moderasi

Halaman listing adalah tempat kanonis bagi pengguna untuk memeriksa apa yang diklaim dapat dilakukan oleh skill atau
Plugin sebelum memasangnya.

## Skills

Skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Bundel ini dapat menyertakan
file pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama skill,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan memasang skill tersebut dan
membantu pemindaian otomatis mendeteksi ketidakcocokan antara perilaku yang dideklarasikan dan yang diamati.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Ketika OpenClaw memasang Plugin dari ClawHub, OpenClaw memeriksa metadata
kompatibilitas yang diumumkan sebelum memasang. Catatan paket dapat mencakup kompatibilitas API,
versi Gateway minimum, target host, persyaratan lingkungan, dan digest
artefak.

Gunakan sumber pemasangan ClawHub yang eksplisit ketika Anda ingin registri menjadi
sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Penerbitan

Penerbitan membuat catatan versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub`
untuk alur kerja registri terautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan dry run untuk meninjau payload yang diselesaikan sebelum diunggah. Halaman publik kemudian
menampilkan metadata yang diterbitkan, file, atribusi sumber, dan status pemindaian.

## Pemasangan dan pembaruan

Perintah pemasangan OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber pemasangan sehingga pembaruan dapat menyelesaikan paket
registri yang sama nanti. CLI ClawHub juga mendukung alur kerja pemasangan dan
pembaruan skill langsung bagi pengguna yang menginginkan folder skill yang dikelola registri di luar
workspace OpenClaw penuh.

## Status keamanan

ClawHub terbuka untuk penerbitan, tetapi rilis tetap tunduk pada gerbang unggahan,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian bila tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat menghilang dari pencarian publik dan alur pemasangan sambil tetap
terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan + moderasi](/id/clawhub/security) dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Akses API

ClawHub mengekspos API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini ketika mereka menautkan kembali ke
listing ClawHub kanonis, menghormati batas laju, dan menghindari kesan adanya dukungan resmi.

Lihat [API Publik](/id/clawhub/api) dan [API HTTP](/id/clawhub/http-api).
