---
read_when:
    - Memahami daftar, versi, instalasi, penerbitan, dan moderasi
summary: Cara kerja daftar, versi, instalasi, penerbitan, pemindaian, dan pembaruan ClawHub.
x-i18n:
    generated_at: "2026-07-19T04:59:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cara Kerja ClawHub

ClawHub adalah lapisan registri untuk Skills dan Plugin OpenClaw. ClawHub menyediakan
tempat bagi pengguna untuk menemukan paket, tempat bagi penerbit untuk merilis versi, dan
metadata yang memadai bagi OpenClaw untuk menginstal serta memperbarui paket tersebut dengan aman.

## Catatan registri

Setiap daftar publik merupakan catatan registri yang berisi:

- pemilik dan slug atau nama paket
- satu atau beberapa versi yang diterbitkan
- metadata, ringkasan, berkas, dan atribusi sumber
- log perubahan dan informasi tag seperti `latest`
- sinyal unduhan, penginstalan, dan bintang
- status pemindaian keamanan dan moderasi

Halaman daftar merupakan tempat kanonis bagi pengguna untuk memeriksa fungsi yang
diklaim oleh suatu skill atau plugin sebelum menginstalnya.

## Skills

Skill adalah bundel teks berversi yang berpusat pada `SKILL.md`. Bundel ini dapat mencakup
berkas pendukung, contoh, templat, dan skrip.

ClawHub membaca frontmatter `SKILL.md` untuk memahami nama skill,
deskripsi, persyaratan, variabel lingkungan, dan metadata. Metadata yang akurat
penting karena membantu pengguna memutuskan apakah akan menginstal skill tersebut dan
membantu pemindaian otomatis mendeteksi ketidaksesuaian antara perilaku yang dinyatakan dan yang diamati.

Lihat [Format skill](/clawhub/skill-format).

## Plugin

Plugin adalah ekstensi OpenClaw yang dikemas. ClawHub menyimpan metadata paket,
informasi kompatibilitas, tautan sumber, artefak, dan catatan versi.

Saat OpenClaw menginstal plugin dari ClawHub, OpenClaw memeriksa metadata
kompatibilitas yang diumumkan sebelum menginstal. Catatan paket dapat mencakup kompatibilitas API,
versi minimum Gateway, target hos, persyaratan lingkungan, dan digest artefak.

Gunakan sumber penginstalan ClawHub secara eksplisit jika Anda ingin registri menjadi
sumber kebenaran:

```bash
openclaw plugins install clawhub:<package>
```

## Penerbitan

Penerbitan membuat catatan versi baru yang tidak dapat diubah. Penerbit menggunakan CLI `clawhub`
untuk alur kerja registri yang diautentikasi:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gunakan uji coba untuk melihat pratinjau muatan yang telah diresolusi sebelum diunggah. Halaman publik kemudian
menampilkan metadata yang diterbitkan, berkas, atribusi sumber, dan status pemindaian.

## Penginstalan dan pembaruan

Perintah penginstalan OpenClaw menggunakan ClawHub sebagai sumber paket:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw mencatat metadata sumber penginstalan agar pembaruan dapat meresolusi
paket registri yang sama di kemudian hari. CLI ClawHub juga mendukung alur kerja penginstalan dan
pembaruan skill secara langsung bagi pengguna yang menginginkan folder skill yang dikelola registri di luar
ruang kerja OpenClaw lengkap.

## Status keamanan

ClawHub terbuka untuk penerbitan, tetapi rilis tetap tunduk pada gerbang pengunggahan,
pemeriksaan otomatis, laporan pengguna, dan tindakan moderator.

Halaman publik menampilkan ringkasan pemindaian jika tersedia. Konten yang ditahan, disembunyikan,
atau diblokir dapat menghilang dari alur pencarian dan penginstalan publik, tetapi tetap
terlihat oleh pemilik untuk diagnostik.

Lihat [Keamanan](/clawhub/security), [Audit Keamanan](/id/clawhub/security-audits),
[Moderasi dan Keamanan Akun](/clawhub/moderation), dan
[Penggunaan yang dapat diterima](/clawhub/acceptable-usage).

## Akses API

ClawHub menyediakan API baca publik untuk penemuan, pencarian, detail paket, dan
unduhan. Katalog pihak ketiga dapat menggunakan API ini selama menautkan kembali ke
daftar kanonis ClawHub, mematuhi batas laju, dan tidak menyiratkan dukungan resmi.

Lihat [API Publik](/id/clawhub/api) dan [API HTTP](/clawhub/http-api).
