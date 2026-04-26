---
read_when:
    - Anda ingin menemukan Plugin OpenClaw pihak ketiga
    - Anda ingin memublikasikan atau mendaftarkan Plugin Anda sendiri
summary: 'Plugin OpenClaw yang dikelola komunitas: telusuri, instal, dan kirim Plugin Anda sendiri'
title: Plugin komunitas
x-i18n:
    generated_at: "2026-04-26T11:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

Plugin komunitas adalah paket pihak ketiga yang memperluas OpenClaw dengan
saluran, tool, provider, atau kapabilitas baru lainnya. Plugin ini dibangun dan dikelola
oleh komunitas, dipublikasikan di [ClawHub](/id/tools/clawhub) atau npm, dan
dapat diinstal dengan satu perintah.

ClawHub adalah surface penemuan kanonis untuk Plugin komunitas. Jangan membuka
PR dokumen saja hanya untuk menambahkan Plugin Anda di sini demi keterlihatan; publikasikan
saja di ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw memeriksa ClawHub terlebih dahulu dan otomatis fallback ke npm.

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

Bridge OpenClaw independen untuk percakapan Codex App Server. Ikat obrolan ke
thread Codex, ajak bicara dengan teks biasa, dan kendalikan dengan perintah native obrolan
untuk melanjutkan, perencanaan, review, pemilihan model, Compaction, dan lainnya.

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
dengan Compaction inkremental — mempertahankan fidelitas konteks penuh
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

Berikan agen OpenClaw Anda avatar Live2D dengan sinkronisasi bibir real-time, ekspresi
emosi, dan text-to-speech. Termasuk tool kreator untuk pembuatan aset AI
dan deployment satu klik ke Prometheus Marketplace. Saat ini masih alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Hubungkan OpenClaw ke QQ melalui QQ Bot API. Mendukung obrolan privat, mention
grup, pesan saluran, dan media kaya termasuk suara, gambar, video,
dan file.

Rilis OpenClaw saat ini membundel QQ Bot. Gunakan penyiapan bawaan di
[QQ Bot](/id/channels/qqbot) untuk instalasi normal; instal Plugin eksternal ini hanya
jika Anda memang sengaja menginginkan paket mandiri yang dikelola Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin saluran WeCom untuk OpenClaw oleh tim Tencent WeCom. Didukung oleh
koneksi persisten WebSocket WeCom Bot, Plugin ini mendukung pesan langsung & obrolan grup,
balasan streaming, pesan proaktif, pemrosesan gambar/file, pemformatan Markdown,
kontrol akses bawaan, dan Skills dokumen/rapat/pesan.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Kirimkan Plugin Anda

Kami menyambut Plugin komunitas yang berguna, terdokumentasi, dan aman untuk dioperasikan.

<Steps>
  <Step title="Publikasikan ke ClawHub atau npm">
    Plugin Anda harus dapat diinstal melalui `openclaw plugins install \<package-name\>`.
    Publikasikan ke [ClawHub](/id/tools/clawhub) (lebih disukai) atau npm.
    Lihat [Membangun Plugin](/id/plugins/building-plugins) untuk panduan lengkap.

  </Step>

  <Step title="Host di GitHub">
    Kode sumber harus berada di repositori publik dengan dokumen penyiapan dan pelacak
    issue.

  </Step>

  <Step title="Gunakan PR dokumen hanya untuk perubahan source-doc">
    Anda tidak memerlukan PR dokumen hanya untuk membuat Plugin Anda dapat ditemukan. Publikasikan
    saja di ClawHub.

    Buka PR dokumen hanya ketika dokumen sumber OpenClaw memang memerlukan perubahan konten
    nyata, seperti memperbaiki panduan instalasi atau menambahkan dokumentasi lintas-repo
    yang memang seharusnya ada dalam set dokumen utama.

  </Step>
</Steps>

## Standar kualitas

| Persyaratan                | Alasannya                                      |
| -------------------------- | ---------------------------------------------- |
| Dipublikasikan di ClawHub atau npm | Pengguna memerlukan `openclaw plugins install` untuk berfungsi |
| Repo GitHub publik         | Review source, pelacakan issue, transparansi   |
| Dokumen penyiapan dan penggunaan | Pengguna perlu tahu cara mengonfigurasikannya |
| Pemeliharaan aktif         | Pembaruan terbaru atau penanganan issue yang responsif |

Wrapper upaya rendah, kepemilikan yang tidak jelas, atau paket yang tidak dirawat dapat ditolak.

## Terkait

- [Instal dan Konfigurasikan Plugin](/id/tools/plugin) — cara menginstal Plugin apa pun
- [Membangun Plugin](/id/plugins/building-plugins) — buat Plugin Anda sendiri
- [Manifest Plugin](/id/plugins/manifest) — skema manifest
