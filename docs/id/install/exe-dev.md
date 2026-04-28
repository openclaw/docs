---
read_when:
    - Anda menginginkan host Linux selalu aktif yang murah untuk Gateway
    - Anda menginginkan akses Control UI jarak jauh tanpa menjalankan VPS sendiri【อ่านข้อความเต็มanalysis
summary: Jalankan Gateway OpenClaw di exe.dev (VM + proxy HTTPS) untuk akses jarak jauh
title: exe.dev
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T09:13:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

Tujuan: Gateway OpenClaw berjalan di VM exe.dev, dapat dijangkau dari laptop Anda melalui: `https://<vm-name>.exe.xyz`

Halaman ini mengasumsikan image default **exeuntu** milik exe.dev. Jika Anda memilih distro yang berbeda, sesuaikan paketnya.

## Jalur cepat untuk pemula

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Isi auth key/token Anda sesuai kebutuhan
3. Klik "Agent" di sebelah VM Anda dan tunggu Shelley menyelesaikan provisioning
4. Buka `https://<vm-name>.exe.xyz/` dan autentikasi dengan shared secret yang dikonfigurasi (panduan ini menggunakan autentikasi token secara default, tetapi autentikasi kata sandi juga berfungsi jika Anda mengganti `gateway.auth.mode`)
5. Setujui semua permintaan pairing perangkat yang tertunda dengan `openclaw devices approve <requestId>`

## Yang Anda butuhkan

- Akun exe.dev
- Akses `ssh exe.dev` ke virtual machine [exe.dev](https://exe.dev) (opsional)

## Instalasi Otomatis dengan Shelley

Shelley, agen milik [exe.dev](https://exe.dev), dapat memasang OpenClaw secara instan dengan
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

Tip: pertahankan VM ini tetap **stateful**. OpenClaw menyimpan `openclaw.json`, `auth-profiles.json`
per agen, sesi, dan status channel/provider di bawah
`~/.openclaw/`, plus workspace di `~/.openclaw/workspace/`.

## 2) Pasang prasyarat (di VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Pasang OpenClaw

Jalankan skrip instalasi OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Siapkan nginx untuk mem-proxy OpenClaw ke port 8000

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

## 5) Akses OpenClaw dan berikan hak akses

Akses `https://<vm-name>.exe.xyz/` (lihat output Control UI dari onboarding). Jika diminta autentikasi, tempelkan
shared secret yang telah dikonfigurasi dari VM. Panduan ini menggunakan autentikasi token, jadi ambil `gateway.auth.token`
dengan `openclaw config get gateway.auth.token` (atau buat dengan `openclaw doctor --generate-gateway-token`).
Jika Anda mengubah gateway ke autentikasi kata sandi, gunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` sebagai gantinya.
Setujui perangkat dengan `openclaw devices list` dan `openclaw devices approve <requestId>`. Jika ragu, gunakan Shelley dari browser Anda!

## Akses Jarak Jauh

Akses jarak jauh ditangani oleh autentikasi [exe.dev](https://exe.dev). Secara
default, lalu lintas HTTP dari port 8000 diteruskan ke `https://<vm-name>.exe.xyz`
dengan autentikasi email.

## Memperbarui

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Panduan: [Memperbarui](/id/install/updating)

## Terkait

- [Gateway remote](/id/gateway/remote)
- [Ikhtisar instalasi](/id/install)
