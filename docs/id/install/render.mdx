---
read_when:
    - Men-deploy OpenClaw ke Render
    - Anda menginginkan deployment cloud deklaratif dengan Render Blueprints
summary: Deploy OpenClaw di Render dengan Infrastructure-as-Code
title: Render
x-i18n:
    generated_at: "2026-04-23T09:23:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Render

Deploy OpenClaw di Render menggunakan Infrastructure as Code. Blueprint `render.yaml` yang disertakan mendefinisikan seluruh stack Anda secara deklaratif, layanan, disk, variabel lingkungan, sehingga Anda dapat melakukan deployment dengan satu klik dan membuat versi infrastruktur Anda berdampingan dengan kode Anda.

## Prasyarat

- Akun [Render](https://render.com) (tersedia tier gratis)
- API key dari [provider model](/id/providers) pilihan Anda

## Deploy dengan Render Blueprint

[Deploy to Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Mengklik tautan ini akan:

1. Membuat layanan Render baru dari Blueprint `render.yaml` di root repo ini.
2. Membangun image Docker dan men-deploy

Setelah di-deploy, URL layanan Anda mengikuti pola `https://<service-name>.onrender.com`.

## Memahami Blueprint

Render Blueprints adalah file YAML yang mendefinisikan infrastruktur Anda. `render.yaml` di
repository ini mengonfigurasi semua yang diperlukan untuk menjalankan OpenClaw:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # otomatis membuat token aman
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

Fitur Blueprint utama yang digunakan:

| Fitur                 | Tujuan                                                     |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Membangun dari Dockerfile repo                             |
| `healthCheckPath`     | Render memantau `/health` dan me-restart instance yang tidak sehat |
| `generateValue: true` | Otomatis membuat nilai yang aman secara kriptografis       |
| `disk`                | Penyimpanan persisten yang bertahan setelah redeploy       |

## Memilih paket

| Paket     | Spin-down         | Disk          | Terbaik untuk                 |
| --------- | ----------------- | ------------- | ----------------------------- |
| Free      | Setelah 15 mnt idle | Tidak tersedia | Pengujian, demo              |
| Starter   | Tidak pernah      | 1GB+          | Penggunaan pribadi, tim kecil |
| Standard+ | Tidak pernah      | 1GB+          | Produksi, banyak channel      |

Blueprint secara default menggunakan `starter`. Untuk menggunakan tier gratis, ubah `plan: free` di
`render.yaml` fork Anda (tetapi perhatikan: tanpa disk persisten berarti status OpenClaw
di-reset pada setiap deployment).

## Setelah deployment

### Akses UI Control

Dashboard web tersedia di `https://<your-service>.onrender.com/`.

Hubungkan menggunakan shared secret yang dikonfigurasi. Template deployment ini otomatis membuat
`OPENCLAW_GATEWAY_TOKEN` (temukan di **Dashboard → layanan Anda →
Environment**); jika Anda menggantinya dengan autentikasi kata sandi, gunakan kata sandi
tersebut.

## Fitur Dashboard Render

### Log

Lihat log real-time di **Dashboard → layanan Anda → Logs**. Filter berdasarkan:

- Log build (pembuatan image Docker)
- Log deployment (startup layanan)
- Log runtime (output aplikasi)

### Akses shell

Untuk debugging, buka sesi shell melalui **Dashboard → layanan Anda → Shell**. Disk persisten dipasang di `/data`.

### Variabel lingkungan

Ubah variabel di **Dashboard → layanan Anda → Environment**. Perubahan memicu redeploy otomatis.

### Auto-deploy

Jika Anda menggunakan repository OpenClaw asli, Render tidak akan melakukan auto-deploy OpenClaw Anda. Untuk memperbaruinya, jalankan sinkronisasi Blueprint manual dari dashboard.

## Domain kustom

1. Buka **Dashboard → layanan Anda → Settings → Custom Domains**
2. Tambahkan domain Anda
3. Konfigurasikan DNS sesuai petunjuk (CNAME ke `*.onrender.com`)
4. Render menyediakan sertifikat TLS secara otomatis

## Scaling

Render mendukung scaling horizontal dan vertikal:

- **Vertikal**: Ubah paket untuk mendapatkan lebih banyak CPU/RAM
- **Horizontal**: Tambahkan jumlah instance (paket Standard ke atas)

Untuk OpenClaw, scaling vertikal biasanya sudah cukup. Scaling horizontal memerlukan sticky session atau manajemen status eksternal.

## Backup dan migrasi

Ekspor status, konfigurasi, profil auth, dan workspace Anda kapan saja menggunakan
akses shell di Dashboard Render:

```bash
openclaw backup create
```

Ini membuat arsip backup portabel dengan status OpenClaw plus workspace
yang dikonfigurasi. Lihat [Backup](/id/cli/backup) untuk detail.

## Pemecahan masalah

### Layanan tidak mau mulai

Periksa log deployment di Dashboard Render. Masalah umum:

- `OPENCLAW_GATEWAY_TOKEN` hilang — verifikasi bahwa nilainya sudah disetel di **Dashboard → Environment**
- Ketidakcocokan port — pastikan `OPENCLAW_GATEWAY_PORT=8080` disetel agar Gateway bind ke port yang diharapkan Render

### Cold start lambat (tier gratis)

Layanan tier gratis akan spin down setelah 15 menit tidak aktif. Permintaan pertama setelah spin-down memerlukan beberapa detik saat container mulai. Upgrade ke paket Starter untuk always-on.

### Kehilangan data setelah redeploy

Ini terjadi pada tier gratis (tanpa disk persisten). Upgrade ke paket berbayar, atau
ekspor backup lengkap secara rutin melalui `openclaw backup create` di shell Render.

### Kegagalan health check

Render mengharapkan respons 200 dari `/health` dalam 30 detik. Jika build berhasil tetapi deployment gagal, layanan mungkin memerlukan waktu terlalu lama untuk mulai. Periksa:

- Log build untuk error
- Apakah container berjalan secara lokal dengan `docker build && docker run`

## Langkah berikutnya

- Siapkan channel pesan: [Channels](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Jaga OpenClaw tetap mutakhir: [Updating](/id/install/updating)
