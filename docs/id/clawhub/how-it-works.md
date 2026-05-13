---
read_when:
    - Memahami daftar, versi, instalasi, penerbitan, dan moderasi
summary: Cara kerja cantuman ClawHub, versi, instalasi, publikasi, pemindaian, dan pembaruan.
x-i18n:
    generated_at: "2026-05-13T05:32:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registry untuk skill dan plugin OpenClaw. ClawHub memberi pengguna
tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan
memberi OpenClaw metadata yang cukup untuk menginstal dan memperbarui paket tersebut dengan aman.

## Catatan registry

Setiap listing publik adalah catatan registry dengan:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang telah dipublikasikan
- metadata, ringkasan, berkas, dan atribusi sumber
- informasi changelog dan tag seperti `latest`
- sinyal unduhan, instalasi, bintang, dan komentar
- status pemindaian keamanan dan moderasi

Halaman listing adalah tempat kanonis bagi pengguna untuk memeriksa apa yang diklaim dapat dilakukan oleh skill atau
plugin sebelum menginstalnya.

## Skills

Sebuah skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Skill dapat menyertakan
berkas pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama skill,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan menginstal skill tersebut dan
membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dinyatakan dan yang diamati.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw menginstal plugin dari ClawHub, OpenClaw memeriksa metadata kompatibilitas
yang diiklankan sebelum menginstal. Catatan paket dapat mencakup kompatibilitas API,
versi Gateway minimum, target host, persyaratan lingkungan, dan digest artefak.

Gunakan sumber instalasi ClawHub eksplisit saat Anda ingin registry menjadi
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

Gunakan dry run untuk meninjau payload yang telah di-resolve sebelum diunggah. Halaman publik kemudian
menampilkan metadata yang dipublikasikan, berkas, atribusi sumber, dan status pemindaian.

## Instalasi dan pembaruan

Perintah instalasi OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber instalasi agar pembaruan dapat me-resolve paket
registry yang sama nanti. CLI ClawHub juga mendukung alur kerja instalasi dan
pembaruan skill langsung bagi pengguna yang menginginkan folder skill yang dikelola registry di luar
workspace OpenClaw lengkap.

## Status keamanan

ClawHub terbuka untuk publikasi, tetapi rilis tetap tunduk pada gate unggahan,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian saat tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat menghilang dari pencarian publik dan alur instalasi sambil tetap
terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan + moderasi](/id/clawhub/security) dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Akses API

ClawHub menyediakan API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini saat menautkan kembali ke
listing ClawHub kanonis, mematuhi batas laju, dan menghindari kesan dukungan resmi.

Lihat [API Publik](/id/clawhub/api) dan [API HTTP](/id/clawhub/http-api).
