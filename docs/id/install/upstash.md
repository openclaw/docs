---
read_when:
    - Menerapkan OpenClaw ke Upstash Box
    - Anda menginginkan lingkungan Linux terkelola untuk OpenClaw dengan akses dasbor melalui terowongan SSH
summary: Hosting OpenClaw di Upstash Box dengan keep-alive dan akses terowongan SSH
title: Upstash Box
x-i18n:
    generated_at: "2026-07-12T14:18:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Jalankan Gateway OpenClaw persisten di Upstash Box, lingkungan Linux terkelola
dengan dukungan siklus hidup keep-alive.

Gunakan terowongan SSH untuk mengakses dasbor. Jangan mengekspos port Gateway secara langsung
ke internet publik.

## Prasyarat

- Akun Upstash
- Upstash Box dengan keep-alive
- Klien SSH di mesin lokal Anda

## Membuat Box

Buat Box dengan keep-alive di Upstash Console. Catat ID Box (misalnya
`right-flamingo-14486`) dan kunci API Box Anda.

Upstash menyediakan panduan OpenClaw Box terkini di
[Penyiapan OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Menghubungkan dengan terowongan SSH

Teruskan port dasbor OpenClaw ke mesin lokal Anda. Gunakan kunci API Box Anda
sebagai kata sandi SSH saat diminta:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Opsi keepalive mengurangi terputusnya terowongan saat tidak aktif selama proses orientasi.

## Menginstal OpenClaw

Di dalam Box:

```bash
sudo npm install -g openclaw
```

## Menjalankan orientasi

```bash
openclaw onboard --install-daemon
```

Ikuti petunjuknya. Salin URL dasbor dan token setelah orientasi selesai.

## Memulai Gateway

Konfigurasikan Gateway untuk jaringan Box dan jalankan di latar belakang:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Saat terowongan SSH aktif, buka URL dasbor secara lokal:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Mulai ulang otomatis

Tetapkan perintah ini sebagai skrip inisialisasi Box agar Gateway dimulai ulang saat Box
dimulai:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Pemecahan masalah

Jika SSH macet selama orientasi, hubungkan kembali dengan konfigurasi SSH yang bersih dan
keepalive:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Tindakan ini melewati pengaturan lokal `~/.ssh/config` yang sudah usang dan menjaga terowongan tetap aktif
selama periode jaringan tidak aktif.

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Keamanan Gateway](/id/gateway/security)
- [Memperbarui OpenClaw](/id/install/updating)
