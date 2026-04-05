---
read_when:
    - Anda ingin menemukan plugin OpenClaw pihak ketiga
    - Anda ingin memublikasikan atau mencantumkan plugin Anda sendiri
summary: 'Plugin OpenClaw yang dikelola komunitas: telusuri, instal, dan kirim plugin Anda sendiri'
title: Plugin Komunitas
x-i18n:
    generated_at: "2026-04-05T14:01:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01804563a63399fe564b0cd9b9aadef32e5211b63d8467fdbbd1f988200728de
    source_path: plugins/community.md
    workflow: 15
---

# Plugin Komunitas

Plugin komunitas adalah paket pihak ketiga yang memperluas OpenClaw dengan
channel, tool, provider, atau kapabilitas baru lainnya. Plugin ini dibangun dan dikelola
oleh komunitas, dipublikasikan di [ClawHub](/tools/clawhub) atau npm, dan
dapat diinstal dengan satu perintah.

ClawHub adalah permukaan penemuan kanonis untuk plugin komunitas. Jangan buka
PR khusus dokumentasi hanya untuk menambahkan plugin Anda di sini demi kemudahan ditemukan; publikasikan saja di
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw memeriksa ClawHub terlebih dahulu dan secara otomatis melakukan fallback ke npm.

## Plugin yang tercantum

### Codex App Server Bridge

Bridge OpenClaw independen untuk percakapan Codex App Server. Ikat chat ke
thread Codex, ajak bicara dengan teks biasa, dan kendalikan dengan perintah
bawaan chat untuk resume, perencanaan, review, pemilihan model, compaction, dan lainnya.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integrasi robot enterprise menggunakan mode Stream. Mendukung teks, gambar, dan
pesan file melalui klien DingTalk apa pun.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management untuk OpenClaw. Perangkuman percakapan
berbasis DAG dengan compaction inkremental — mempertahankan fidelitas konteks penuh
sambil mengurangi penggunaan token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin resmi yang mengekspor trace agent ke Opik. Pantau perilaku agent,
biaya, token, error, dan lainnya.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

Hubungkan OpenClaw ke QQ melalui QQ Bot API. Mendukung chat pribadi, mention grup,
pesan channel, dan media kaya termasuk suara, gambar, video,
dan file.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin channel WeCom untuk OpenClaw oleh tim Tencent WeCom. Didukung oleh
koneksi persisten WeCom Bot WebSocket, plugin ini mendukung pesan langsung & chat grup,
balasan streaming, perpesanan proaktif, pemrosesan gambar/file, pemformatan Markdown,
kontrol akses bawaan, serta Skills dokumen/rapat/perpesanan.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Kirim plugin Anda

Kami menyambut plugin komunitas yang berguna, terdokumentasi, dan aman untuk dioperasikan.

<Steps>
  <Step title="Publikasikan ke ClawHub atau npm">
    Plugin Anda harus dapat diinstal melalui `openclaw plugins install \<package-name\>`.
    Publikasikan ke [ClawHub](/tools/clawhub) (disarankan) atau npm.
    Lihat [Membangun Plugin](/plugins/building-plugins) untuk panduan lengkapnya.

  </Step>

  <Step title="Hosting di GitHub">
    Kode sumber harus berada di repositori publik dengan dokumentasi penyiapan dan
    pelacak issue.

  </Step>

  <Step title="Gunakan PR dokumentasi hanya untuk perubahan dokumen sumber">
    Anda tidak memerlukan PR dokumentasi hanya agar plugin Anda mudah ditemukan. Publikasikan saja
    di ClawHub.

    Buka PR dokumentasi hanya jika dokumen sumber OpenClaw memang memerlukan
    perubahan konten nyata, seperti memperbaiki panduan instalasi atau menambahkan dokumentasi
    lintas repo yang memang seharusnya ada di kumpulan dokumen utama.

  </Step>
</Steps>

## Standar kualitas

| Requirement                 | Why                                                |
| --------------------------- | -------------------------------------------------- |
| Dipublikasikan di ClawHub atau npm | Pengguna memerlukan `openclaw plugins install` agar berfungsi |
| Repo GitHub publik          | Review kode sumber, pelacakan issue, transparansi  |
| Dokumentasi penyiapan dan penggunaan | Pengguna perlu tahu cara mengonfigurasinya   |
| Pemeliharaan aktif          | Pembaruan terbaru atau penanganan issue yang responsif |

Wrapper upaya-rendah, kepemilikan yang tidak jelas, atau paket yang tidak dipelihara dapat ditolak.

## Terkait

- [Instal dan Konfigurasikan Plugin](/tools/plugin) — cara menginstal plugin apa pun
- [Membangun Plugin](/plugins/building-plugins) — buat plugin Anda sendiri
- [Manifest Plugin](/plugins/manifest) — skema manifest
