---
read_when:
    - Mengekspos UI Kontrol Gateway di luar localhost
    - Mengotomatiskan akses dasbor tailnet atau publik
summary: Serve/Funnel Tailscale terintegrasi untuk dasbor Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-05T13:54:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (dasbor Gateway)

OpenClaw dapat mengonfigurasi otomatis Tailscale **Serve** (tailnet) atau **Funnel** (publik) untuk
dasbor Gateway dan port WebSocket. Ini menjaga Gateway tetap terikat ke loopback sementara
Tailscale menyediakan HTTPS, perutean, dan (untuk Serve) header identitas.

## Mode

- `serve`: Serve khusus tailnet melalui `tailscale serve`. Gateway tetap di `127.0.0.1`.
- `funnel`: HTTPS publik melalui `tailscale funnel`. OpenClaw memerlukan kata sandi bersama.
- `off`: Default (tanpa otomatisasi Tailscale).

## Auth

Setel `gateway.auth.mode` untuk mengontrol handshake:

- `none` (khusus private ingress)
- `token` (default saat `OPENCLAW_GATEWAY_TOKEN` disetel)
- `password` (rahasia bersama melalui `OPENCLAW_GATEWAY_PASSWORD` atau konfigurasi)
- `trusted-proxy` (reverse proxy sadar identitas; lihat [Auth Trusted Proxy](/gateway/trusted-proxy-auth))

Saat `tailscale.mode = "serve"` dan `gateway.auth.allowTailscale` bernilai `true`,
auth UI Kontrol/WebSocket dapat menggunakan header identitas Tailscale
(`tailscale-user-login`) tanpa memberikan token/kata sandi. OpenClaw memverifikasi
identitas tersebut dengan me-resolve alamat `x-forwarded-for` melalui daemon Tailscale lokal
(`tailscale whois`) dan mencocokkannya dengan header sebelum menerimanya.
OpenClaw hanya memperlakukan request sebagai Serve saat request tiba dari loopback dengan
header `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host` milik
Tailscale.
Endpoint HTTP API (misalnya `/v1/*`, `/tools/invoke`, dan `/api/channels/*`)
**tidak** menggunakan auth header identitas Tailscale. Endpoint ini tetap mengikuti
mode auth HTTP normal gateway: auth shared-secret secara default, atau penyiapan
trusted-proxy / private-ingress `none` yang sengaja dikonfigurasi.
Alur tanpa token ini mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya
mungkin berjalan di host yang sama, nonaktifkan `gateway.auth.allowTailscale` dan minta
auth token/kata sandi sebagai gantinya.
Untuk mewajibkan kredensial shared-secret eksplisit, setel `gateway.auth.allowTailscale: false`
dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

## Contoh konfigurasi

### Hanya tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Buka: `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

### Hanya tailnet (bind ke IP Tailnet)

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

- UI Kontrol: `http://<tailscale-ip>:18789/`
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

Lebih baik gunakan `OPENCLAW_GATEWAY_PASSWORD` daripada mengomit kata sandi ke disk.

## Contoh CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Catatan

- Tailscale Serve/Funnel memerlukan CLI `tailscale` terpasang dan sudah login.
- `tailscale.mode: "funnel"` menolak untuk mulai kecuali mode auth adalah `password` untuk menghindari eksposur publik.
- Setel `gateway.tailscale.resetOnExit` jika Anda ingin OpenClaw membatalkan konfigurasi `tailscale serve`
  atau `tailscale funnel` saat shutdown.
- `gateway.bind: "tailnet"` adalah bind Tailnet langsung (tanpa HTTPS, tanpa Serve/Funnel).
- `gateway.bind: "auto"` lebih memilih loopback; gunakan `tailnet` jika Anda menginginkan khusus Tailnet.
- Serve/Funnel hanya mengekspos **UI kontrol Gateway + WS**. Node terhubung melalui
  endpoint Gateway WS yang sama, jadi Serve dapat berfungsi untuk akses node.

## Kontrol browser (Gateway jarak jauh + browser lokal)

Jika Anda menjalankan Gateway di satu mesin tetapi ingin mengendalikan browser di mesin lain,
jalankan **host node** di mesin browser dan pertahankan keduanya dalam tailnet yang sama.
Gateway akan mem-proxy aksi browser ke node; tidak diperlukan server kontrol atau URL Serve terpisah.

Hindari Funnel untuk kontrol browser; perlakukan pairing node seperti akses operator.

## Prasyarat + batasan Tailscale

- Serve memerlukan HTTPS diaktifkan untuk tailnet Anda; CLI akan meminta jika belum ada.
- Serve menyisipkan header identitas Tailscale; Funnel tidak.
- Funnel memerlukan Tailscale v1.38.3+, MagicDNS, HTTPS diaktifkan, dan atribut node funnel.
- Funnel hanya mendukung port `443`, `8443`, dan `10000` melalui TLS.
- Funnel di macOS memerlukan varian aplikasi Tailscale open-source.

## Pelajari lebih lanjut

- Ikhtisar Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Perintah `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Ikhtisar Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Perintah `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
