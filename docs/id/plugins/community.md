---
read_when:
    - Anda ingin menemukan plugin OpenClaw pihak ketiga
    - Anda ingin menerbitkan atau mencantumkan Plugin Anda sendiri
summary: 'Plugin OpenClaw yang dikelola komunitas: jelajahi, instal, dan kirim milik Anda sendiri'
title: Plugin komunitas
x-i18n:
    generated_at: "2026-04-30T10:00:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Plugin komunitas adalah paket pihak ketiga yang memperluas OpenClaw dengan
channel, alat, provider, atau kemampuan lain baru. Plugin ini dibuat dan dipelihara
oleh komunitas, biasanya dipublikasikan di [ClawHub](/id/tools/clawhub), dan dapat diinstal
dengan satu perintah. Npm tetap menjadi fallback yang didukung untuk paket yang
belum berpindah ke ClawHub.

ClawHub adalah permukaan penemuan kanonis untuk Plugin komunitas. Jangan membuka
PR khusus dokumentasi hanya untuk menambahkan Plugin Anda di sini agar mudah ditemukan; publikasikan di
ClawHub sebagai gantinya.

```bash
openclaw plugins install <package-name>
```

OpenClaw memeriksa ClawHub terlebih dahulu dan otomatis melakukan fallback ke npm.

## Plugin yang terdaftar

### Apify

Ambil data dari situs web apa pun dengan 20.000+ scraper siap pakai. Biarkan agen Anda
mengekstrak data dari Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, situs e-commerce, dan lainnya — cukup dengan meminta.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw independen untuk percakapan Codex App Server. Ikat chat ke
thread Codex, berbicara dengannya dengan teks biasa, dan kendalikan dengan perintah
native chat untuk melanjutkan, perencanaan, peninjauan, pemilihan model, Compaction, dan lainnya.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integrasi robot enterprise menggunakan mode Stream. Mendukung pesan teks, gambar, dan
file melalui klien DingTalk apa pun.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin manajemen konteks tanpa kehilangan data untuk OpenClaw. Perangkuman percakapan
berbasis DAG dengan Compaction inkremental — mempertahankan fidelitas konteks penuh
sekaligus mengurangi penggunaan token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin resmi yang mengekspor trace agen ke Opik. Pantau perilaku agen,
biaya, token, error, dan lainnya.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Beri agen OpenClaw Anda avatar Live2D dengan lip-sync real-time, ekspresi
emosi, dan text-to-speech. Mencakup alat kreator untuk pembuatan aset AI
dan deployment sekali klik ke Prometheus Marketplace. Saat ini dalam alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Hubungkan OpenClaw ke QQ melalui QQ Bot API. Mendukung chat privat, mention grup,
pesan channel, dan rich media termasuk suara, gambar, video,
dan file.

Rilis OpenClaw saat ini membundel QQ Bot. Gunakan penyiapan bawaan di
[QQ Bot](/id/channels/qqbot) untuk instalasi normal; instal Plugin eksternal ini hanya
ketika Anda secara sengaja menginginkan paket mandiri yang dipelihara Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin channel WeCom untuk OpenClaw oleh tim Tencent WeCom. Didukung oleh
koneksi persisten WebSocket WeCom Bot, Plugin ini mendukung pesan langsung & chat grup,
balasan streaming, pengiriman pesan proaktif, pemrosesan gambar/file, pemformatan Markdown,
kontrol akses bawaan, serta Skills dokumen/rapat/pengiriman pesan.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin channel Yuanbao untuk OpenClaw oleh tim Tencent Yuanbao. Didukung oleh
koneksi persisten WebSocket, Plugin ini mendukung pesan langsung & chat grup,
balasan streaming, pengiriman pesan proaktif, pemrosesan gambar/file/audio/video,
pemformatan Markdown, kontrol akses bawaan, dan menu slash-command.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Kirim Plugin Anda

Kami menyambut Plugin komunitas yang berguna, terdokumentasi, dan aman dioperasikan.

<Steps>
  <Step title="Publikasikan ke ClawHub atau npm">
    Plugin Anda harus dapat diinstal melalui `openclaw plugins install \<package-name\>`.
    Publikasikan ke [ClawHub](/id/tools/clawhub) kecuali Anda secara khusus membutuhkan distribusi
    khusus npm.
    Lihat [Membangun Plugin](/id/plugins/building-plugins) untuk panduan lengkap.

  </Step>

  <Step title="Host di GitHub">
    Kode sumber harus berada di repositori publik dengan dokumentasi penyiapan dan issue
    tracker.

  </Step>

  <Step title="Gunakan PR dokumentasi hanya untuk perubahan dokumentasi sumber">
    Anda tidak memerlukan PR dokumentasi hanya untuk membuat Plugin Anda mudah ditemukan. Publikasikan
    di ClawHub sebagai gantinya.

    Buka PR dokumentasi hanya ketika dokumentasi sumber OpenClaw memerlukan perubahan konten
    nyata, seperti memperbaiki panduan instalasi atau menambahkan dokumentasi
    lintas-repo yang memang termasuk dalam kumpulan dokumentasi utama.

  </Step>
</Steps>

## Standar kualitas

| Persyaratan                 | Alasan                                           |
| --------------------------- | --------------------------------------------- |
| Dipublikasikan di ClawHub atau npm | Pengguna membutuhkan `openclaw plugins install` agar berfungsi |
| Repo GitHub publik          | Peninjauan sumber, pelacakan issue, transparansi   |
| Dokumentasi penyiapan dan penggunaan        | Pengguna perlu tahu cara mengonfigurasinya        |
| Pemeliharaan aktif          | Pembaruan terbaru atau penanganan issue yang responsif   |

Wrapper berupaya rendah, kepemilikan yang tidak jelas, atau paket yang tidak dipelihara dapat ditolak.

## Terkait

- [Instal dan Konfigurasikan Plugin](/id/tools/plugin) — cara menginstal Plugin apa pun
- [Membangun Plugin](/id/plugins/building-plugins) — buat Plugin Anda sendiri
- [Manifest Plugin](/id/plugins/manifest) — skema manifest
