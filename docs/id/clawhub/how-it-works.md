---
read_when:
    - Memahami daftar, versi, instalasi, penerbitan, dan moderasi
summary: Cara kerja listing ClawHub, versi, instalasi, penerbitan, pemindaian, dan pembaruan.
x-i18n:
    generated_at: "2026-07-01T20:34:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registri untuk Skills dan Plugin OpenClaw. ClawHub memberi pengguna tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan memberi OpenClaw metadata yang cukup untuk menginstal serta memperbarui paket tersebut dengan aman.

## Catatan registri

Setiap listing publik adalah catatan registri dengan:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang diterbitkan
- metadata, ringkasan, berkas, dan atribusi sumber
- informasi changelog dan tag seperti `latest`
- sinyal unduhan, instalasi, dan bintang
- status pemindaian keamanan dan moderasi

Halaman listing adalah tempat kanonis bagi pengguna untuk memeriksa klaim fungsi sebuah keterampilan atau plugin sebelum menginstalnya.

## Skills

Keterampilan adalah bundel teks berversi yang berpusat pada `SKILL.md`. Bundel ini dapat mencakup berkas pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama keterampilan, deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat penting karena membantu pengguna memutuskan apakah akan menginstal keterampilan tersebut dan membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dideklarasikan dan yang diamati.

Lihat [Format keterampilan](/id/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket, informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw menginstal plugin dari ClawHub, OpenClaw memeriksa metadata kompatibilitas yang diiklankan sebelum menginstal. Catatan paket dapat mencakup kompatibilitas API, versi Gateway minimum, target host, persyaratan lingkungan, dan digest artefak.

Gunakan sumber instalasi ClawHub eksplisit saat Anda ingin registri menjadi sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Penerbitan

Penerbitan membuat catatan versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub` untuk alur kerja registri yang terautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan dry run untuk meninjau payload yang diselesaikan sebelum diunggah. Halaman publik kemudian menampilkan metadata yang diterbitkan, berkas, atribusi sumber, dan status pemindaian.

## Instalasi dan pembaruan

Perintah instalasi OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber instalasi agar pembaruan nantinya dapat menyelesaikan paket registri yang sama. CLI ClawHub juga mendukung alur kerja instalasi dan pembaruan keterampilan langsung bagi pengguna yang menginginkan folder keterampilan yang dikelola registri di luar workspace OpenClaw lengkap.

## Status keamanan

ClawHub terbuka untuk penerbitan, tetapi rilis tetap tunduk pada gerbang unggahan, pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian jika tersedia. Konten yang ditahan, disembunyikan, atau diblokir dapat menghilang dari pencarian publik dan alur instalasi, sambil tetap terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan](/clawhub/security), [Audit Keamanan](/clawhub/security-audits), [Moderasi dan Keamanan Akun](/id/clawhub/moderation), dan [Penggunaan yang dapat diterima](/clawhub/acceptable-usage).

## Akses API

ClawHub menyediakan API baca publik untuk penemuan, pencarian, detail paket, dan unduhan. Katalog pihak ketiga dapat menggunakan API ini jika mereka menautkan kembali ke listing ClawHub kanonis, menghormati batas laju, dan tidak menyiratkan dukungan.

Lihat [API Publik](/id/clawhub/api) dan [HTTP API](/clawhub/http-api).
