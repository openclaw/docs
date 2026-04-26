---
read_when:
    - Mengekspos Gateway Control UI di luar localhost
    - Mengotomatiskan akses dashboard tailnet atau publik
summary: Tailscale Serve/Funnel terintegrasi untuk dashboard Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T11:30:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw dapat mengonfigurasi otomatis Tailscale **Serve** (tailnet) atau **Funnel** (publik) untuk
dashboard Gateway dan port WebSocket. Ini menjaga Gateway tetap terikat ke loopback sementara
Tailscale menyediakan HTTPS, perutean, dan (untuk Serve) header identitas.

## Mode

- `serve`: Serve khusus Tailnet melalui `tailscale serve`. Gateway tetap di `127.0.0.1`.
- `funnel`: HTTPS publik melalui `tailscale funnel`. OpenClaw memerlukan kata sandi bersama.
- `off`: Default (tanpa otomatisasi Tailscale).

Output status dan audit menggunakan **eksposur Tailscale** untuk mode Serve/Funnel OpenClaw
ini. `off` berarti OpenClaw tidak mengelola Serve atau Funnel; itu tidak berarti
daemon Tailscale lokal dihentikan atau logout.

## Auth

Atur `gateway.auth.mode` untuk mengontrol handshake:

- `none` (hanya ingress privat)
- `token` (default saat `OPENCLAW_GATEWAY_TOKEN` diatur)
- `password` (rahasia bersama melalui `OPENCLAW_GATEWAY_PASSWORD` atau config)
- `trusted-proxy` (reverse proxy sadar identitas; lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth))

Saat `tailscale.mode = "serve"` dan `gateway.auth.allowTailscale` bernilai `true`,
auth Control UI/WebSocket dapat menggunakan header identitas Tailscale
(`tailscale-user-login`) tanpa memberikan token/kata sandi. OpenClaw memverifikasi
identitas dengan me-resolve alamat `x-forwarded-for` melalui daemon Tailscale lokal
(`tailscale whois`) dan mencocokkannya dengan header sebelum menerimanya.
OpenClaw hanya memperlakukan sebuah permintaan sebagai Serve saat permintaan tersebut tiba dari loopback dengan
header `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host` milik
Tailscale.
Untuk sesi operator Control UI yang menyertakan identitas perangkat browser, jalur Serve
terverifikasi ini juga melewati round trip device-pairing. Ini tidak melewati
identitas perangkat browser: klien tanpa perangkat tetap ditolak, dan koneksi WebSocket
berperan node atau non-Control UI tetap mengikuti pemeriksaan pairing dan
auth normal.
Endpoint HTTP API (misalnya `/v1/*`, `/tools/invoke`, dan `/api/channels/*`)
**tidak** menggunakan auth header identitas Tailscale. Endpoint-endpoint itu tetap mengikuti
mode auth HTTP normal gateway: auth shared-secret secara default, atau setup
trusted-proxy / private-ingress `none` yang memang dikonfigurasi dengan sengaja.
Alur tanpa token ini mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya
mungkin berjalan di host yang sama, nonaktifkan `gateway.auth.allowTailscale` dan minta
auth token/kata sandi sebagai gantinya.
Untuk mewajibkan kredensial shared-secret eksplisit, atur `gateway.auth.allowTailscale: false`
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

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Catatan: loopback (`http://127.0.0.1:18789`) **tidak** akan berfungsi dalam mode ini.

### Internet publik (Funnel + kata sandi bersama)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Lebih baik gunakan `OPENCLAW_GATEWAY_PASSWORD` daripada menyimpan kata sandi ke disk.

## Contoh CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Catatan

- Tailscale Serve/Funnel memerlukan CLI `tailscale` terinstal dan sudah login.
- `tailscale.mode: "funnel"` menolak untuk mulai kecuali mode auth adalah `password` agar menghindari eksposur publik.
- Atur `gateway.tailscale.resetOnExit` jika Anda ingin OpenClaw membatalkan config `tailscale serve`
  atau `tailscale funnel` saat shutdown.
- `gateway.bind: "tailnet"` adalah bind Tailnet langsung (tanpa HTTPS, tanpa Serve/Funnel).
- `gateway.bind: "auto"` lebih memilih loopback; gunakan `tailnet` jika Anda ingin khusus Tailnet.
- Serve/Funnel hanya mengekspos **Gateway control UI + WS**. Node terhubung melalui
  endpoint WS Gateway yang sama, jadi Serve dapat berfungsi untuk akses node.

## Kontrol browser (Gateway remote + browser lokal)

Jika Anda menjalankan Gateway di satu mesin tetapi ingin mengendalikan browser di mesin lain,
jalankan **node host** pada mesin browser dan pertahankan keduanya di tailnet yang sama.
Gateway akan mem-proxy aksi browser ke node; tidak diperlukan server kontrol atau URL Serve terpisah.

Hindari Funnel untuk kontrol browser; perlakukan pairing node seperti akses operator.

## Prasyarat + batasan Tailscale

- Serve memerlukan HTTPS diaktifkan untuk tailnet Anda; CLI akan meminta jika belum ada.
- Serve menyuntikkan header identitas Tailscale; Funnel tidak.
- Funnel memerlukan Tailscale v1.38.3+, MagicDNS, HTTPS diaktifkan, dan atribut node funnel.
- Funnel hanya mendukung port `443`, `8443`, dan `10000` melalui TLS.
- Funnel di macOS memerlukan varian app Tailscale open-source.

## Pelajari lebih lanjut

- Ikhtisar Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Perintah `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Ikhtisar Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Perintah `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Terkait

- [Akses remote](/id/gateway/remote)
- [Discovery](/id/gateway/discovery)
- [Authentication](/id/gateway/authentication)
