---
read_when:
    - Mengekspos UI Control Gateway di luar localhost
    - Mengotomatisasi akses dashboard tailnet atau publik
summary: Tailscale Serve/Funnel terintegrasi untuk dashboard Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T09:10:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (dashboard Gateway)

OpenClaw dapat mengonfigurasi otomatis Tailscale **Serve** (tailnet) atau **Funnel** (publik) untuk
dashboard Gateway dan port WebSocket. Ini menjaga Gateway tetap terikat ke loopback sementara
Tailscale menyediakan HTTPS, perutean, dan (untuk Serve) header identitas.

## Mode

- `serve`: Serve khusus Tailnet melalui `tailscale serve`. Gateway tetap di `127.0.0.1`.
- `funnel`: HTTPS publik melalui `tailscale funnel`. OpenClaw memerlukan password bersama.
- `off`: Default (tanpa otomasi Tailscale).

## Auth

Setel `gateway.auth.mode` untuk mengontrol handshake:

- `none` (hanya ingress privat)
- `token` (default saat `OPENCLAW_GATEWAY_TOKEN` disetel)
- `password` (shared secret melalui `OPENCLAW_GATEWAY_PASSWORD` atau config)
- `trusted-proxy` (reverse proxy sadar identitas; lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth))

Saat `tailscale.mode = "serve"` dan `gateway.auth.allowTailscale` bernilai `true`,
auth UI Control/WebSocket dapat menggunakan header identitas Tailscale
(`tailscale-user-login`) tanpa memberikan token/password. OpenClaw memverifikasi
identitas tersebut dengan menyelesaikan alamat `x-forwarded-for` melalui daemon Tailscale
lokal (`tailscale whois`) dan mencocokkannya dengan header sebelum menerimanya.
OpenClaw hanya memperlakukan sebuah permintaan sebagai Serve jika permintaan itu datang dari loopback dengan
header `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host` dari Tailscale.
Endpoint API HTTP (misalnya `/v1/*`, `/tools/invoke`, dan `/api/channels/*`)
**tidak** menggunakan auth header identitas Tailscale. Endpoint tersebut tetap mengikuti
mode auth HTTP normal gateway: auth shared-secret secara default, atau penyiapan
trusted-proxy / private-ingress `none` yang memang dikonfigurasi dengan sengaja.
Alur tanpa token ini mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya
mungkin berjalan di host yang sama, nonaktifkan `gateway.auth.allowTailscale` dan
wajibkan auth token/password sebagai gantinya.
Untuk mewajibkan kredensial shared-secret eksplisit, setel `gateway.auth.allowTailscale: false`
dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

## Contoh config

### Khusus tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Buka: `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

### Khusus tailnet (bind ke IP Tailnet)

Gunakan ini saat Anda ingin Gateway mendengarkan langsung pada IP Tailnet (tanpa Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Hubungkan dari perangkat Tailnet lain:

- UI Control: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Catatan: loopback (`http://127.0.0.1:18789`) **tidak** akan berfungsi dalam mode ini.

### Internet publik (Funnel + password bersama)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Utamakan `OPENCLAW_GATEWAY_PASSWORD` daripada meng-commit password ke disk.

## Contoh CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Catatan

- Tailscale Serve/Funnel memerlukan CLI `tailscale` yang sudah terinstal dan login.
- `tailscale.mode: "funnel"` menolak untuk memulai kecuali mode auth adalah `password` agar terhindar dari eksposur publik.
- Setel `gateway.tailscale.resetOnExit` jika Anda ingin OpenClaw membatalkan konfigurasi `tailscale serve`
  atau `tailscale funnel` saat shutdown.
- `gateway.bind: "tailnet"` adalah bind Tailnet langsung (tanpa HTTPS, tanpa Serve/Funnel).
- `gateway.bind: "auto"` mengutamakan loopback; gunakan `tailnet` jika Anda ingin khusus Tailnet.
- Serve/Funnel hanya mengekspos **UI kontrol Gateway + WS**. Node terhubung melalui
  endpoint WS Gateway yang sama, sehingga Serve dapat berfungsi untuk akses node.

## Kontrol browser (Gateway jarak jauh + browser lokal)

Jika Anda menjalankan Gateway di satu mesin tetapi ingin mengendalikan browser di mesin lain,
jalankan **host node** di mesin browser dan biarkan keduanya tetap berada di tailnet yang sama.
Gateway akan mem-proxy tindakan browser ke node; tidak perlu server kontrol terpisah atau URL Serve.

Hindari Funnel untuk kontrol browser; perlakukan pairing node seperti akses operator.

## Prasyarat + batasan Tailscale

- Serve memerlukan HTTPS yang diaktifkan untuk tailnet Anda; CLI akan meminta jika belum ada.
- Serve menyuntikkan header identitas Tailscale; Funnel tidak.
- Funnel memerlukan Tailscale v1.38.3+, MagicDNS, HTTPS aktif, dan atribut node funnel.
- Funnel hanya mendukung port `443`, `8443`, dan `10000` melalui TLS.
- Funnel di macOS memerlukan varian aplikasi Tailscale open-source.

## Pelajari lebih lanjut

- Ikhtisar Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Perintah `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Ikhtisar Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Perintah `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Discovery](/id/gateway/discovery)
- [Autentikasi](/id/gateway/authentication)
