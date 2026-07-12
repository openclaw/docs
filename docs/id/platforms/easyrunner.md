---
read_when:
    - Menerapkan OpenClaw di EasyRunner
    - Menjalankan Gateway di belakang proksi Caddy milik EasyRunner
    - Memilih volume persisten dan autentikasi untuk Gateway yang dihosting
summary: Jalankan Gateway OpenClaw di EasyRunner dengan Podman dan Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T14:21:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner menghosting Gateway OpenClaw sebagai aplikasi kecil dalam kontainer di balik proksi
Caddy. Panduan ini mengasumsikan host EasyRunner yang menjalankan aplikasi Compose
kompatibel dengan Podman dan mengakhiri HTTPS melalui Caddy.

## Sebelum memulai

- Server EasyRunner dengan domain yang diarahkan kepadanya.
- Image resmi OpenClaw (`ghcr.io/openclaw/openclaw`) atau hasil build Anda sendiri.
- Volume konfigurasi persisten untuk `/home/node/.openclaw`.
- Volume ruang kerja persisten untuk `/home/node/.openclaw/workspace`.
- Token atau kata sandi Gateway yang kuat.

Pertahankan autentikasi perangkat tetap aktif jika memungkinkan. Jika proksi balik Anda tidak dapat meneruskan
identitas perangkat dengan benar, perbaiki terlebih dahulu pengaturan proksi tepercaya (lihat
[Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth)); gunakan pengabaian autentikasi
berbahaya hanya pada jaringan yang sepenuhnya privat dan dikendalikan operator.

## Aplikasi Compose

Buat aplikasi EasyRunner dengan berkas Compose seperti berikut:

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
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Ganti `openclaw.example.com` dengan nama host Gateway Anda. Simpan
`OPENCLAW_GATEWAY_TOKEN` di pengelola rahasia/lingkungan EasyRunner, bukan
memasukkannya ke definisi aplikasi. Secara default, image mengikat ke local loopback,
sehingga `--bind lan --port 1455` eksplisit dalam `command` diperlukan agar Caddy dapat
menjangkau kontainer.

## Mengonfigurasi OpenClaw

Di dalam volume konfigurasi persisten, pastikan Gateway hanya dapat dijangkau melalui
proksi dan wajibkan autentikasi:

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

Jika Caddy mengakhiri TLS untuk Gateway, konfigurasikan pengaturan proksi tepercaya untuk
jalur proksi yang tepat, alih-alih menonaktifkan pemeriksaan autentikasi secara global. Lihat
[Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth).

## Verifikasi

Dari stasiun kerja Anda:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Dari host EasyRunner, `GET /healthz` (keaktifan) dan `GET /readyz`
(kesiapan) tidak memerlukan autentikasi dan mendukung pemeriksaan kesehatan kontainer
bawaan image. Periksa juga log aplikasi untuk memastikan Gateway sedang mendengarkan dan tidak ada kegagalan
SecretRef saat memulai, Plugin, atau autentikasi saluran.

## Pembaruan dan pencadangan

- Tarik atau build image OpenClaw baru, lalu deploy ulang aplikasi EasyRunner.
- Cadangkan volume `openclaw-config` sebelum pembaruan. Volume ini menyimpan
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`, dan status paket
  Plugin yang terinstal.
- Cadangkan `openclaw-workspace` jika agen menulis data proyek persisten di sana.
- Jalankan `openclaw doctor` setelah pembaruan besar untuk mendeteksi migrasi konfigurasi dan
  peringatan layanan.

## Pemecahan masalah

- `gateway probe` tidak dapat terhubung: pastikan nama host Caddy mengarah ke aplikasi
  dan kontainer mendengarkan di `0.0.0.0:1455`.
- Autentikasi gagal: rotasikan token di rahasia EasyRunner dan perintah klien lokal
  secara bersamaan.
- Berkas dimiliki root setelah pemulihan: image berjalan sebagai `node` (uid 1000);
  perbaiki volume yang dipasang agar pengguna tersebut dapat menulis ke
  `/home/node/.openclaw` dan `/home/node/.openclaw/workspace`.
- Plugin peramban atau saluran gagal: periksa apakah biner eksternal yang diperlukan,
  akses keluar jaringan, dan kredensial yang dipasang tersedia di dalam
  kontainer.
