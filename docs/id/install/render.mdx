---
read_when:
    - Menerapkan OpenClaw ke Render
    - Anda menginginkan penerapan cloud deklaratif dengan Render Blueprints
summary: Terapkan OpenClaw di Render dengan Infrastruktur sebagai Kode
title: Render
x-i18n:
    generated_at: "2026-07-12T14:18:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Deploy OpenClaw di [Render](https://render.com) menggunakan Blueprint `render.yaml` dari repositori. File tersebut mendeklarasikan layanan, disk, dan variabel lingkungan dalam satu file.

## Prasyarat

- [Akun Render](https://render.com) (tersedia paket gratis)
- Kunci API dari [penyedia model](/id/providers) pilihan Anda

## Deployment

[Deploy ke Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Tindakan ini membuat layanan Render dari `render.yaml`, membangun image Docker, lalu melakukan deployment. URL layanan Anda mengikuti pola `https://<service-name>.onrender.com`.

## Blueprint

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
        generateValue: true # membuat token aman secara otomatis
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Fitur                 | Tujuan                                                         |
| --------------------- | -------------------------------------------------------------- |
| `runtime: docker`     | Membangun dari Dockerfile repositori                            |
| `healthCheckPath`     | Render memantau `/health` dan memulai ulang instans yang bermasalah |
| `generateValue: true` | Membuat nilai yang aman secara kriptografis secara otomatis     |
| `disk`                | Penyimpanan persisten yang tetap ada setelah deployment ulang   |

## Memilih paket

| Paket     | Penonaktifan             | Disk          | Paling sesuai untuk               |
| --------- | ------------------------ | ------------- | --------------------------------- |
| Gratis    | Setelah 15 menit nonaktif | Tidak tersedia | Pengujian, demo                   |
| Starter   | Tidak pernah             | 1GB+          | Penggunaan pribadi, tim kecil     |
| Standard+ | Tidak pernah             | 1GB+          | Produksi, beberapa kanal          |

Blueprint menggunakan `starter` secara default. Untuk menggunakan paket gratis, ubah `plan: free` dalam `render.yaml` di fork Anda — perlu diketahui bahwa tanpa disk persisten, status OpenClaw akan direset pada setiap deployment.

## Setelah deployment

### Mengakses UI Kontrol

Dasbor web tersedia di `https://<your-service>.onrender.com/`. Hubungkan menggunakan rahasia bersama: `OPENCLAW_GATEWAY_TOKEN` yang dibuat secara otomatis (temukan di **Dashboard → your service → Environment**), atau kata sandi Anda jika beralih ke autentikasi kata sandi.

### Log

**Dashboard → your service → Logs** menampilkan log pembangunan (pembuatan image Docker), log deployment (pengaktifan layanan), dan log waktu proses (keluaran aplikasi).

### Akses shell

**Dashboard → your service → Shell** membuka sesi shell. Disk persisten dipasang di `/data`.

### Variabel lingkungan

Edit variabel di **Dashboard → your service → Environment**. Perubahan memicu deployment ulang otomatis.

### Deployment otomatis

Render secara otomatis melakukan deployment ulang ketika cabang repositori yang terhubung menerima commit baru. Jika Anda melakukan deployment langsung dari `openclaw/openclaw`, bukan dari fork sendiri, Anda tidak memiliki akses push untuk memicunya. Oleh karena itu, lakukan pembaruan dengan menjalankan sinkronisasi Blueprint secara manual dari Dashboard, atau arahkan layanan ke fork Anda sendiri.

## Domain khusus

1. **Dashboard → your service → Settings → Custom Domains**
2. Tambahkan domain Anda
3. Konfigurasikan DNS sesuai petunjuk (CNAME ke `*.onrender.com`)
4. Render menyediakan sertifikat TLS secara otomatis

## Penskalaan

- **Vertikal**: ubah paket untuk mendapatkan lebih banyak CPU/RAM. Biasanya memadai untuk OpenClaw.
- **Horizontal**: tingkatkan jumlah instans (paket Standard dan yang lebih tinggi). Memerlukan sesi lengket atau pengelolaan status eksternal karena OpenClaw menyimpan status waktu proses di disk lokal.

## Pencadangan dan migrasi

Dari shell Render Dashboard, ekspor status, konfigurasi, profil autentikasi, dan ruang kerja kapan saja:

```bash
openclaw backup create
```

Perintah ini membuat arsip cadangan portabel. Lihat [Pencadangan](/id/cli/backup).

## Pemecahan masalah

### Layanan tidak dapat dimulai

Periksa log deployment di Render Dashboard. Masalah umum:

- `OPENCLAW_GATEWAY_TOKEN` tidak ada — pastikan variabel tersebut telah ditetapkan di **Dashboard → Environment**
- Port tidak cocok — pastikan `OPENCLAW_GATEWAY_PORT=8080` agar Gateway mengikat ke port yang diharapkan Render

### Cold start lambat (paket gratis)

Layanan paket gratis dinonaktifkan setelah 15 menit tidak aktif; permintaan pertama setelah penonaktifan memerlukan beberapa detik saat kontainer dimulai. Tingkatkan ke Starter agar layanan selalu aktif.

### Kehilangan data setelah deployment ulang

Hal ini terjadi pada paket gratis (tanpa disk persisten). Tingkatkan ke paket berbayar, atau ekspor cadangan secara rutin dengan `openclaw backup create` dari shell Render.

### Kegagalan pemeriksaan kesehatan

Jika pembangunan berhasil tetapi deployment gagal, layanan mungkin memerlukan waktu terlalu lama untuk dimulai atau `/health` mungkin tidak dapat dijangkau. Periksa:

- Log pembangunan untuk menemukan kesalahan
- Apakah kontainer berjalan secara lokal dengan `docker build && docker run`

## Langkah berikutnya

- Siapkan kanal perpesanan: [Kanal](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Pastikan OpenClaw selalu diperbarui: [Pembaruan](/id/install/updating)
