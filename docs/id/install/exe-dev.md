---
read_when:
    - Anda menginginkan host Linux murah yang selalu aktif untuk Gateway
    - Anda menginginkan akses UI Kontrol jarak jauh tanpa menjalankan VPS Anda sendiri
summary: Jalankan OpenClaw Gateway di exe.dev (VM + proxy HTTPS) untuk akses jarak jauh
title: exe.dev
x-i18n:
    generated_at: "2026-04-05T13:57:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff95b6f35b95df35c1b0cae3215647eefe88d2b7f19923868385036cc0dbdbf1
    source_path: install/exe-dev.md
    workflow: 15
---

# exe.dev

Tujuan: OpenClaw Gateway berjalan di VM exe.dev, dapat dijangkau dari laptop Anda melalui: `https://<vm-name>.exe.xyz`

Halaman ini mengasumsikan image default **exeuntu** dari exe.dev. Jika Anda memilih distro yang berbeda, sesuaikan paketnya.

## Jalur cepat untuk pemula

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Isi auth key/token Anda sesuai kebutuhan
3. Klik "Agent" di sebelah VM Anda dan tunggu Shelley selesai melakukan provisioning
4. Buka `https://<vm-name>.exe.xyz/` dan autentikasi dengan shared secret yang dikonfigurasi (panduan ini menggunakan auth token secara default, tetapi auth password juga berfungsi jika Anda mengganti `gateway.auth.mode`)
5. Setujui permintaan pairing perangkat yang tertunda dengan `openclaw devices approve <requestId>`

## Yang Anda butuhkan

- Akun exe.dev
- Akses `ssh exe.dev` ke mesin virtual [exe.dev](https://exe.dev) (opsional)

## Instalasi Otomatis dengan Shelley

Shelley, agent milik [exe.dev](https://exe.dev), dapat menginstal OpenClaw secara instan dengan
prompt kami. Prompt yang digunakan adalah sebagai berikut:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalasi manual

## 1) Buat VM

Dari perangkat Anda:

```bash
ssh exe.dev new
```

Lalu hubungkan:

```bash
ssh <vm-name>.exe.xyz
```

Tip: pertahankan VM ini **stateful**. OpenClaw menyimpan `openclaw.json`, `auth-profiles.json`
per agen, sesi, dan status channel/provider di bawah
`~/.openclaw/`, ditambah workspace di `~/.openclaw/workspace/`.

## 2) Instal prasyarat (di VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Instal OpenClaw

Jalankan skrip instalasi OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Setup nginx untuk mem-proxy OpenClaw ke port 8000

Edit `/etc/nginx/sites-enabled/default` dengan

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Timpa header forwarding alih-alih mempertahankan rantai yang disuplai klien.
OpenClaw hanya mempercayai metadata IP yang diteruskan dari proxy yang dikonfigurasi secara eksplisit,
dan rantai `X-Forwarded-For` bergaya append diperlakukan sebagai risiko hardening.

## 5) Akses OpenClaw dan berikan izin

Akses `https://<vm-name>.exe.xyz/` (lihat output UI Kontrol dari onboarding). Jika meminta auth, tempelkan
shared secret yang dikonfigurasi dari VM. Panduan ini menggunakan auth token, jadi ambil `gateway.auth.token`
dengan `openclaw config get gateway.auth.token` (atau buat satu dengan `openclaw doctor --generate-gateway-token`).
Jika Anda mengubah gateway ke auth password, gunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Setujui perangkat dengan `openclaw devices list` dan `openclaw devices approve <requestId>`. Jika ragu, gunakan Shelley dari browser Anda!

## Akses Jarak Jauh

Akses jarak jauh ditangani oleh autentikasi [exe.dev](https://exe.dev). Secara
default, lalu lintas HTTP dari port 8000 diteruskan ke `https://<vm-name>.exe.xyz`
dengan auth email.

## Pembaruan

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Panduan: [Updating](/install/updating)
