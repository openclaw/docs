---
read_when:
    - Memahami cantuman, versi, pemasangan, penerbitan, dan moderasi
summary: Cara kerja daftar, versi, pemasangan, penerbitan, pemindaian, dan pembaruan ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:28:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registry untuk Skills dan plugin OpenClaw. ClawHub memberi pengguna tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan memberi OpenClaw metadata yang cukup untuk menginstal serta memperbarui paket tersebut dengan aman.

## Catatan registry

Setiap listing publik adalah catatan registry dengan:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang diterbitkan
- metadata, ringkasan, berkas, dan atribusi sumber
- changelog dan informasi tag seperti `latest`
- sinyal unduhan, instalasi, bintang, dan komentar
- status pemindaian keamanan dan moderasi

Halaman listing adalah tempat kanonis bagi pengguna untuk memeriksa klaim fungsi sebuah skill atau plugin sebelum menginstalnya.

## Skills

Skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Skill dapat menyertakan berkas pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama skill, deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat penting karena membantu pengguna memutuskan apakah akan menginstal skill tersebut dan membantu pemindaian otomatis mendeteksi ketidakcocokan antara perilaku yang dideklarasikan dan yang diamati.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket, informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw menginstal plugin dari ClawHub, OpenClaw memeriksa metadata kompatibilitas yang diiklankan sebelum menginstal. Catatan paket dapat mencakup kompatibilitas API, versi gateway minimum, target host, persyaratan lingkungan, dan digest artefak.

Gunakan sumber instalasi ClawHub eksplisit saat Anda ingin registry menjadi sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Penerbitan

Penerbitan membuat catatan versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub` untuk alur kerja registry yang terautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan dry run untuk mempratinjau payload yang telah diselesaikan sebelum pengunggahan. Halaman publik kemudian menampilkan metadata yang diterbitkan, berkas, atribusi sumber, dan status pemindaian.

## Instalasi dan pembaruan

Perintah instalasi OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber instalasi agar pembaruan nantinya dapat menyelesaikan paket registry yang sama. CLI ClawHub juga mendukung alur kerja instalasi dan pembaruan skill langsung bagi pengguna yang menginginkan folder skill yang dikelola registry di luar workspace OpenClaw penuh.

## Status keamanan

ClawHub terbuka untuk penerbitan, tetapi rilis tetap tunduk pada gate unggahan, pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian jika tersedia. Konten yang ditahan, disembunyikan, atau diblokir dapat hilang dari pencarian publik dan alur instalasi sambil tetap terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan + moderasi](/id/clawhub/security) dan [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Akses API

ClawHub mengekspos API baca publik untuk penemuan, pencarian, detail paket, dan unduhan. Katalog pihak ketiga dapat menggunakan API ini saat mereka menautkan kembali ke listing ClawHub kanonis, mematuhi batas laju, dan menghindari kesan dukungan resmi.

Lihat [API publik](/id/clawhub/api) dan [API HTTP](/id/clawhub/http-api).
