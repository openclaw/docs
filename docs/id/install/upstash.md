---
read_when:
    - Menerapkan OpenClaw ke Upstash Box
    - Anda menginginkan lingkungan Linux terkelola untuk OpenClaw dengan akses dashboard melalui tunnel SSH
summary: Jalankan OpenClaw di Upstash Box dengan keep-alive dan akses tunnel SSH
title: Kotak Upstash
x-i18n:
    generated_at: "2026-06-27T17:39:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Jalankan OpenClaw Gateway persisten di Upstash Box, lingkungan Linux terkelola
dengan dukungan siklus hidup keep-alive.

Gunakan tunnel SSH untuk akses dasbor. Jangan mengekspos port Gateway secara langsung
ke internet publik.

## Prasyarat

- Akun Upstash
- Upstash Box keep-alive
- Klien SSH di mesin lokal Anda

## Buat Box

Buat Box keep-alive di Upstash Console. Catat ID Box, seperti
`right-flamingo-14486`, dan kunci API Box Anda.

Upstash mempertahankan panduan OpenClaw Box terkininya di
[Penyiapan OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Terhubung dengan tunnel SSH

Teruskan port dasbor OpenClaw ke mesin lokal Anda. Gunakan kunci API Box Anda
sebagai kata sandi SSH saat diminta:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Opsi keepalive mengurangi terputusnya tunnel yang menganggur selama onboarding.

## Instal OpenClaw

Di dalam Box:

```bash
sudo npm install -g openclaw
```

## Jalankan onboarding

```bash
openclaw onboard --install-daemon
```

Ikuti prompt. Salin URL dasbor dan token saat onboarding selesai.

## Mulai Gateway

Konfigurasikan Gateway untuk jaringan Box dan mulai di latar belakang:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Dengan tunnel SSH aktif, buka URL dasbor secara lokal:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Mulai ulang otomatis

Tetapkan perintah ini sebagai skrip init Box agar Gateway dimulai ulang saat Box
dimulai:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Pemecahan masalah

Jika SSH berhenti merespons selama onboarding, hubungkan ulang dengan konfigurasi SSH yang bersih dan
keepalive:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Ini melewati pengaturan lokal `~/.ssh/config` yang usang dan menjaga tunnel tetap aktif
selama periode jaringan menganggur.

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Keamanan Gateway](/id/gateway/security)
- [Memperbarui OpenClaw](/id/install/updating)
