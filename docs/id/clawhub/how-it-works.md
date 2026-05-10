---
read_when:
    - Memahami listing, versi, instalasi, penerbitan, dan moderasi
summary: Cara kerja cantuman, versi, pemasangan, penerbitan, pemindaian, dan pembaruan ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:25:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registri untuk Skills dan Plugin OpenClaw. ClawHub memberi pengguna
tempat untuk menemukan paket, memberi penerbit tempat untuk merilis versi, dan
memberi OpenClaw metadata yang cukup untuk menginstal dan memperbarui paket tersebut dengan aman.

## Catatan registri

Setiap daftar publik adalah catatan registri dengan:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang dipublikasikan
- metadata, ringkasan, berkas, dan atribusi sumber
- informasi changelog dan tag seperti `latest`
- sinyal unduhan, instalasi, bintang, dan komentar
- status pemindaian keamanan dan moderasi

Halaman daftar adalah tempat kanonis bagi pengguna untuk memeriksa apa yang diklaim
dilakukan oleh sebuah skill atau Plugin sebelum menginstalnya.

## Skills

Sebuah skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Bundel ini dapat menyertakan
berkas pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama skill,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan menginstal skill tersebut dan
membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dideklarasikan dan yang diamati.

Lihat [Format skill](/id/clawhub/skill-format).

## Plugins

Plugin adalah ekstensi OpenClaw yang dipaketkan. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw menginstal Plugin dari ClawHub, OpenClaw memeriksa metadata kompatibilitas
yang diiklankan sebelum menginstal. Catatan paket dapat menyertakan kompatibilitas API,
versi Gateway minimum, target host, persyaratan lingkungan, dan digest artefak.

Gunakan sumber instalasi ClawHub eksplisit saat Anda ingin registri menjadi
sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Publikasi

Publikasi membuat catatan versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub`
untuk alur kerja registri yang terautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan dry run untuk meninjau payload yang dihasilkan sebelum unggah. Halaman publik kemudian
menampilkan metadata yang dipublikasikan, berkas, atribusi sumber, dan status pemindaian.

## Instalasi dan pembaruan

Perintah instalasi OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber instalasi sehingga pembaruan dapat menyelesaikan paket
registri yang sama nanti. CLI ClawHub juga mendukung alur kerja instalasi dan
pembaruan skill langsung untuk pengguna yang menginginkan folder skill yang dikelola registri di luar
workspace OpenClaw penuh.

## Status keamanan

ClawHub terbuka untuk publikasi, tetapi rilis tetap tunduk pada gerbang unggah,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian jika tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat menghilang dari pencarian publik dan alur instalasi sambil tetap
terlihat oleh pemilik untuk diagnostik atau banding.

Lihat [Keamanan + moderasi](/id/clawhub/security) dan
[Penggunaan yang dapat diterima](/id/clawhub/acceptable-usage).

## Akses API

ClawHub mengekspos API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini saat mereka menautkan kembali ke
daftar ClawHub kanonis, mematuhi batas laju, dan menghindari menyiratkan dukungan.

Lihat [API publik](/id/clawhub/api) dan [API HTTP](/id/clawhub/http-api).
