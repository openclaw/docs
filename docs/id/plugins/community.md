---
doc-schema-version: 1
read_when:
    - Anda ingin menemukan plugin OpenClaw pihak ketiga
    - Anda ingin menerbitkan atau mencantumkan plugin Anda sendiri di ClawHub
summary: Temukan dan publikasikan plugin OpenClaw yang dikelola komunitas
title: Plugin komunitas
x-i18n:
    generated_at: "2026-07-12T14:23:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Plugin komunitas adalah paket pihak ketiga yang memperluas OpenClaw dengan
kanal, alat, penyedia, hook, atau kemampuan lainnya. Gunakan
[ClawHub](/clawhub) sebagai sarana penemuan utama untuk Plugin komunitas
publik.

## Menemukan Plugin

Cari di ClawHub melalui CLI:

```bash
openclaw plugins search "calendar"
```

Instal Plugin ClawHub dengan prefiks sumber yang eksplisit:

```bash
openclaw plugins install clawhub:<package-name>
```

npm tetap menjadi jalur instalasi langsung yang didukung selama transisi
peluncuran:

```bash
openclaw plugins install npm:<package-name>
```

Gunakan [Mengelola Plugin](/id/plugins/manage-plugins) untuk contoh umum
instalasi, pembaruan, pemeriksaan, dan penghapusan instalasi. Gunakan
[`openclaw plugins`](/id/cli/plugins) untuk referensi perintah lengkap dan
aturan pemilihan sumber.

## Menerbitkan Plugin

Terbitkan Plugin komunitas publik di ClawHub agar pengguna OpenClaw dapat
menemukan dan menginstalnya. ClawHub mengelola daftar paket aktif, riwayat
rilis, status pemindaian, dan petunjuk instalasi; dokumentasi tidak
memelihara katalog statis Plugin pihak ketiga.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Sebelum menerbitkan, pastikan Plugin memiliki metadata paket, manifes
Plugin, dokumentasi penyiapan, dan penanggung jawab pemeliharaan yang jelas.
ClawHub memvalidasi cakupan pemilik, nama paket, versi, batas berkas, dan
metadata sumber sebelum membuat rilis, lalu menyembunyikan rilis baru dari
sarana instalasi dan pengunduhan normal hingga peninjauan dan verifikasi
selesai.

Daftar periksa sebelum Anda menerbitkan:

| Persyaratan                | Alasan                                                   |
| -------------------------- | -------------------------------------------------------- |
| Diterbitkan di ClawHub     | Pengguna memerlukan petunjuk `openclaw plugins install` agar berfungsi |
| Repositori GitHub publik   | Peninjauan sumber, pelacakan masalah, transparansi        |
| Dokumentasi penyiapan dan penggunaan | Pengguna perlu mengetahui cara mengonfigurasinya |
| Pemeliharaan aktif         | Pembaruan terkini atau penanganan masalah yang responsif  |

Kontrak penerbitan lengkap:

- [Penerbitan ClawHub](/id/clawhub/publishing) - pemilik, cakupan, rilis,
  peninjauan, validasi paket, dan transfer paket
- [Membangun Plugin](/id/plugins/building-plugins) - struktur paket Plugin
  dan alur kerja penerbitan pertama
- [Manifes Plugin](/id/plugins/manifest) - bidang manifes Plugin bawaan

## Terkait

- [Plugin](/id/tools/plugin) - instalasi, konfigurasi, mulai ulang, dan pemecahan masalah
- [Mengelola Plugin](/id/plugins/manage-plugins) - contoh perintah
- [Penerbitan ClawHub](/id/clawhub/publishing) - aturan penerbitan dan rilis
