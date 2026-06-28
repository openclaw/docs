---
read_when:
    - Memahami daftar, versi, instalasi, publikasi, dan moderasi
summary: Cara kerja daftar, versi, instalasi, penerbitan, pemindaian, dan pembaruan ClawHub.
x-i18n:
    generated_at: "2026-06-28T05:06:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registry untuk Skills dan Plugin OpenClaw. ClawHub memberi pengguna tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan memberi OpenClaw metadata yang cukup untuk menginstal dan memperbarui paket tersebut dengan aman.

## Catatan registry

Setiap listing publik adalah catatan registry dengan:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang diterbitkan
- metadata, ringkasan, berkas, dan atribusi sumber
- changelog dan informasi tag seperti `latest`
- sinyal unduhan, instalasi, dan bintang
- status pemindaian keamanan dan moderasi

Halaman listing adalah tempat kanonis bagi pengguna untuk memeriksa klaim yang dibuat oleh skill atau plugin sebelum menginstalnya.

## Skills

Skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Skill dapat menyertakan berkas pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama skill, deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat penting karena membantu pengguna memutuskan apakah akan menginstal skill dan membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dideklarasikan dan yang diamati.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dipaketkan. ClawHub menyimpan metadata paket, informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw menginstal Plugin dari ClawHub, OpenClaw memeriksa metadata kompatibilitas yang diiklankan sebelum menginstal. Catatan paket dapat mencakup kompatibilitas API, versi gateway minimum, target host, persyaratan lingkungan, dan digest artefak.

Gunakan sumber instalasi ClawHub yang eksplisit saat Anda ingin registry menjadi sumber kebenaran:

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

Gunakan dry run untuk meninjau payload yang diselesaikan sebelum unggahan. Halaman publik kemudian menampilkan metadata yang diterbitkan, berkas, atribusi sumber, dan status pemindaian.

## Instalasi dan pembaruan

Perintah instalasi OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber instalasi agar pembaruan dapat menyelesaikan paket registry yang sama nanti. CLI ClawHub juga mendukung alur kerja instalasi dan pembaruan skill langsung untuk pengguna yang menginginkan folder skill yang dikelola registry di luar workspace OpenClaw lengkap.

## Status keamanan

ClawHub terbuka untuk penerbitan, tetapi rilis tetap tunduk pada gerbang unggahan, pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian jika tersedia. Konten yang ditahan, disembunyikan, atau diblokir dapat hilang dari pencarian publik dan alur instalasi sambil tetap terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan](/id/clawhub/security), [Audit Keamanan](/id/clawhub/security-audits), [Moderasi dan Keamanan Akun](/id/clawhub/moderation), dan [Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Akses API

ClawHub mengekspos API baca publik untuk penemuan, pencarian, detail paket, dan unduhan. Katalog pihak ketiga dapat menggunakan API ini saat mereka menautkan kembali ke listing ClawHub kanonis, menghormati batas laju, dan menghindari kesan dukungan resmi.

Lihat [API Publik](/id/clawhub/api) dan [API HTTP](/id/clawhub/http-api).
