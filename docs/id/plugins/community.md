---
read_when:
    - Anda ingin menemukan plugin OpenClaw pihak ketiga
    - Anda ingin memublikasikan atau mendaftarkan plugin Anda sendiri
summary: 'Plugin OpenClaw yang dipelihara komunitas: jelajahi, instal, dan kirim plugin Anda sendiri'
title: Plugin komunitas
x-i18n:
    generated_at: "2026-04-24T09:18:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Plugin komunitas adalah paket pihak ketiga yang memperluas OpenClaw dengan
saluran, alat, provider, atau kapabilitas baru lainnya. Plugin ini dibangun dan dipelihara
oleh komunitas, dipublikasikan di [ClawHub](/id/tools/clawhub) atau npm, dan
dapat diinstal dengan satu perintah.

ClawHub adalah permukaan penemuan kanonis untuk plugin komunitas. Jangan membuka
PR docs saja hanya untuk menambahkan plugin Anda di sini demi keterlihatan; publikasikan plugin tersebut di
ClawHub sebagai gantinya.

```bash
openclaw plugins install <package-name>
```

OpenClaw memeriksa ClawHub terlebih dahulu lalu otomatis fallback ke npm.

## Plugin yang terdaftar

### Apify

Scrape data dari situs web apa pun dengan 20.000+ scraper siap pakai. Biarkan agen Anda
mengekstrak data dari Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, situs e-commerce, dan lainnya — cukup dengan memintanya.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw independen untuk percakapan Codex App Server. Bind chat ke
thread Codex, ajak bicara dengan teks biasa, dan kendalikan dengan perintah bawaan chat untuk resume, planning, review, pemilihan model, Compaction, dan lainnya.

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

Plugin Lossless Context Management untuk OpenClaw. Ringkasan percakapan berbasis DAG
dengan Compaction inkremental — menjaga fidelitas konteks penuh
sambil mengurangi penggunaan token.

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

Beri agen OpenClaw Anda avatar Live2D dengan lip-sync real-time, ekspresi emosi,
dan text-to-speech. Termasuk alat kreator untuk pembuatan aset AI
dan deployment sekali klik ke Prometheus Marketplace. Saat ini masih alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Hubungkan OpenClaw ke QQ melalui API QQ Bot. Mendukung chat privat, mention
grup, pesan saluran, dan media kaya termasuk suara, gambar, video,
dan file.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin saluran WeCom untuk OpenClaw oleh tim Tencent WeCom. Ditenagai oleh
koneksi persisten WebSocket WeCom Bot, plugin ini mendukung pesan langsung & chat grup,
balasan streaming, perpesanan proaktif, pemrosesan gambar/file, formatting Markdown,
kontrol akses bawaan, dan Skills dokumen/rapat/perpesanan.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Kirim plugin Anda

Kami menyambut plugin komunitas yang berguna, terdokumentasi, dan aman dioperasikan.

<Steps>
  <Step title="Publish to ClawHub or npm">
    Plugin Anda harus dapat diinstal melalui `openclaw plugins install \<package-name\>`.
    Publikasikan ke [ClawHub](/id/tools/clawhub) (disarankan) atau npm.
    Lihat [Membangun Plugin](/id/plugins/building-plugins) untuk panduan lengkap.

  </Step>

  <Step title="Host on GitHub">
    Kode sumber harus berada di repositori publik dengan docs penyiapan dan pelacak issue.

  </Step>

  <Step title="Use docs PRs only for source-doc changes">
    Anda tidak memerlukan PR docs hanya untuk membuat plugin Anda dapat ditemukan. Publikasikan plugin tersebut
    di ClawHub sebagai gantinya.

    Buka PR docs hanya ketika docs sumber OpenClaw memang membutuhkan perubahan
    konten nyata, seperti memperbaiki panduan instalasi atau menambahkan
    dokumentasi lintas repo yang memang seharusnya ada di kumpulan docs utama.

  </Step>
</Steps>

## Standar kualitas

| Persyaratan                 | Alasan                                           |
| --------------------------- | ------------------------------------------------ |
| Dipublikasikan di ClawHub atau npm | Pengguna perlu `openclaw plugins install` berfungsi |
| Repo GitHub publik          | Peninjauan source, pelacakan issue, transparansi |
| Docs penyiapan dan penggunaan | Pengguna perlu tahu cara mengonfigurasinya     |
| Pemeliharaan aktif          | Pembaruan terbaru atau penanganan issue yang responsif |

Wrapper dengan usaha rendah, kepemilikan yang tidak jelas, atau paket yang tidak terpelihara dapat ditolak.

## Terkait

- [Instal dan Konfigurasikan Plugin](/id/tools/plugin) — cara menginstal plugin apa pun
- [Membangun Plugin](/id/plugins/building-plugins) — buat plugin Anda sendiri
- [Manifes Plugin](/id/plugins/manifest) — skema manifes
