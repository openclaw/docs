---
read_when:
    - Menerapkan OpenClaw di EasyRunner
    - Menjalankan Gateway di belakang proksi Caddy milik EasyRunner
    - Memilih volume persisten dan autentikasi untuk Gateway yang di-host
summary: Jalankan OpenClaw Gateway di EasyRunner dengan Podman dan Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T17:41:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner dapat menghosting Gateway OpenClaw sebagai aplikasi kecil dalam container di belakang proxy Caddy-nya. Panduan ini mengasumsikan host EasyRunner yang menjalankan aplikasi Compose kompatibel Podman dan mengekspos HTTPS melalui Caddy.

## Sebelum memulai

- Server EasyRunner dengan domain yang diarahkan ke server tersebut.
- Image container OpenClaw yang sudah dibangun atau dipublikasikan.
- Volume konfigurasi persisten untuk `/home/node/.openclaw`.
- Volume workspace persisten untuk `/workspace`.
- Token atau kata sandi Gateway yang kuat.

Tetap aktifkan autentikasi perangkat jika memungkinkan. Jika deployment reverse proxy Anda tidak dapat membawa identitas perangkat dengan benar, perbaiki pengaturan trusted proxy terlebih dahulu; gunakan bypass autentikasi berbahaya hanya untuk jaringan yang sepenuhnya privat dan dikendalikan operator.

## Aplikasi Compose

Buat aplikasi EasyRunner dengan file Compose berbentuk seperti ini:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Ganti `openclaw.example.com` dengan hostname Gateway Anda. Simpan `OPENCLAW_GATEWAY_TOKEN` di pengelola secret/lingkungan EasyRunner, bukan meng-commit-nya ke definisi aplikasi.

## Konfigurasikan OpenClaw

Di dalam volume konfigurasi persisten, pastikan Gateway hanya dapat dijangkau melalui proxy dan mewajibkan autentikasi:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Jika Caddy menghentikan TLS untuk Gateway, konfigurasikan pengaturan trusted proxy untuk jalur proxy yang tepat, bukan menonaktifkan pemeriksaan autentikasi secara global. Lihat [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).

## Verifikasi

Dari workstation Anda:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Dari host EasyRunner, periksa log aplikasi untuk memastikan Gateway sedang listening dan tidak ada kegagalan startup SecretRef, Plugin, atau autentikasi channel.

## Pembaruan dan backup

- Pull atau bangun image OpenClaw baru, lalu deploy ulang aplikasi EasyRunner.
- Backup volume `openclaw-config` sebelum pembaruan.
- Backup `openclaw-workspace` jika agen menulis data proyek yang tahan lama di sana.
- Jalankan `openclaw doctor` setelah pembaruan besar untuk menangkap migrasi konfigurasi dan peringatan layanan.

## Pemecahan masalah

- `gateway probe` tidak dapat terhubung: pastikan hostname Caddy mengarah ke aplikasi dan container listening pada `0.0.0.0:1455`.
- Autentikasi gagal: rotasi token di secret EasyRunner dan perintah klien lokal secara bersamaan.
- File dimiliki root setelah restore: perbaiki volume yang di-mount agar pengguna container dapat menulis ke `/home/node/.openclaw` dan `/workspace`.
- Plugin browser atau channel gagal: periksa apakah binary eksternal yang diperlukan, egress jaringan, dan kredensial yang di-mount tersedia di dalam container.
