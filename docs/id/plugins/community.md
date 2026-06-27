---
doc-schema-version: 1
read_when:
    - Anda ingin menemukan plugin OpenClaw pihak ketiga
    - Anda ingin menerbitkan atau mencantumkan plugin Anda sendiri di ClawHub
summary: Temukan dan publikasikan Plugin OpenClaw yang dikelola komunitas
title: Plugin komunitas
x-i18n:
    generated_at: "2026-06-27T17:46:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Plugin komunitas adalah paket pihak ketiga yang memperluas OpenClaw dengan channel,
alat, penyedia, hook, atau kemampuan lainnya. Gunakan [ClawHub](/id/clawhub) sebagai
permukaan penemuan utama untuk Plugin komunitas publik.

## Temukan Plugin

Cari ClawHub dari CLI:

```bash
openclaw plugins search "calendar"
```

Instal Plugin ClawHub dengan prefiks sumber eksplisit:

```bash
openclaw plugins install clawhub:<package-name>
```

npm tetap menjadi jalur instal langsung yang didukung selama peralihan peluncuran:

```bash
openclaw plugins install npm:<package-name>
```

Gunakan [Kelola Plugin](/id/plugins/manage-plugins) untuk contoh umum instalasi,
pembaruan, inspeksi, dan penghapusan. Gunakan [`openclaw plugins`](/id/cli/plugins)
untuk referensi perintah lengkap dan aturan pemilihan sumber.

## Publikasikan Plugin

Publikasikan Plugin komunitas publik di ClawHub saat Anda ingin pengguna OpenClaw
menemukan dan menginstalnya. ClawHub memiliki daftar paket live, riwayat rilis,
status pemindaian, dan petunjuk instalasi; dokumentasi tidak memelihara katalog
Plugin pihak ketiga statis.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Sebelum memublikasikan, pastikan Plugin memiliki metadata paket, manifes Plugin,
dokumentasi penyiapan, dan pemilik pemeliharaan yang jelas. ClawHub memvalidasi
cakupan pemilik, nama paket, versi, batas file, dan metadata sumber sebelum
membuat rilis, lalu menjaga rilis baru tetap tersembunyi dari permukaan instalasi
dan unduhan normal hingga peninjauan dan verifikasi selesai.

Gunakan daftar periksa ini sebelum Anda memublikasikan:

| Persyaratan             | Alasan                                                     |
| ----------------------- | ---------------------------------------------------------- |
| Dipublikasikan di ClawHub | Pengguna memerlukan petunjuk `openclaw plugins install` agar berfungsi |
| Repositori GitHub publik | Peninjauan sumber, pelacakan isu, transparansi             |
| Dokumentasi penyiapan dan penggunaan | Pengguna perlu mengetahui cara mengonfigurasinya |
| Pemeliharaan aktif      | Pembaruan terbaru atau penanganan isu yang responsif       |

Gunakan halaman-halaman ini untuk kontrak publikasi lengkap:

- [Publikasi ClawHub](/id/clawhub/publishing) menjelaskan pemilik, cakupan, rilis,
  peninjauan, validasi paket, dan transfer paket.
- [Membangun Plugin](/id/plugins/building-plugins) menunjukkan bentuk paket Plugin
  dan alur kerja publikasi pertama.
- [Manifes Plugin](/id/plugins/manifest) mendefinisikan kolom manifes Plugin native.

## Terkait

- [Plugin](/id/tools/plugin) - instal, konfigurasikan, mulai ulang, dan pecahkan masalah
- [Kelola Plugin](/id/plugins/manage-plugins) - contoh perintah
- [Publikasi ClawHub](/id/clawhub/publishing) - aturan publikasi dan rilis
