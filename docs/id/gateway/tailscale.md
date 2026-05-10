---
read_when:
    - Mengekspos UI Kontrol Gateway di luar localhost
    - Mengotomatiskan akses tailnet atau dasbor publik
summary: Tailscale Serve/Funnel terintegrasi untuk dasbor Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:37:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw dapat mengonfigurasi otomatis Tailscale **Serve** (tailnet) atau **Funnel** (publik) untuk dasbor Gateway dan port WebSocket. Ini menjaga Gateway tetap terikat ke loopback sementara Tailscale menyediakan HTTPS, perutean, dan (untuk Serve) header identitas.

## Mode

- `serve`: Serve khusus tailnet melalui `tailscale serve`. Gateway tetap berada di `127.0.0.1`.
- `funnel`: HTTPS publik melalui `tailscale funnel`. OpenClaw memerlukan kata sandi bersama.
- `off`: Default (tanpa otomatisasi Tailscale).

Output status dan audit menggunakan **eksposur Tailscale** untuk mode Serve/Funnel OpenClaw ini. `off` berarti OpenClaw tidak mengelola Serve atau Funnel; ini tidak berarti daemon Tailscale lokal dihentikan atau keluar dari akun.

## Auth

Atur `gateway.auth.mode` untuk mengontrol handshake:

- `none` (hanya ingress privat)
- `token` (default saat `OPENCLAW_GATEWAY_TOKEN` diatur)
- `password` (rahasia bersama melalui `OPENCLAW_GATEWAY_PASSWORD` atau konfigurasi)
- `trusted-proxy` (reverse proxy sadar identitas; lihat [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth))

Saat `tailscale.mode = "serve"` dan `gateway.auth.allowTailscale` bernilai `true`, auth Control UI/WebSocket dapat menggunakan header identitas Tailscale (`tailscale-user-login`) tanpa menyediakan token/kata sandi. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` melalui daemon Tailscale lokal (`tailscale whois`) dan mencocokkannya dengan header sebelum menerimanya. OpenClaw hanya memperlakukan permintaan sebagai Serve saat permintaan tiba dari loopback dengan header `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host` milik Tailscale.
Untuk sesi operator Control UI yang menyertakan identitas perangkat browser, jalur Serve yang terverifikasi ini juga melewati perjalanan pulang-pergi pemasangan perangkat. Ini tidak melewati identitas perangkat browser: klien tanpa perangkat tetap ditolak, dan koneksi node-role atau WebSocket non-Control UI tetap mengikuti pemeriksaan pemasangan dan auth normal.
Endpoint HTTP API (misalnya `/v1/*`, `/tools/invoke`, dan `/api/channels/*`) **tidak** menggunakan auth header identitas Tailscale. Endpoint tersebut tetap mengikuti mode auth HTTP normal gateway: auth rahasia bersama secara default, atau setup trusted-proxy / ingress privat `none` yang dikonfigurasi secara sengaja.
Alur tanpa token ini mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya mungkin berjalan di host yang sama, nonaktifkan `gateway.auth.allowTailscale` dan wajibkan auth token/kata sandi sebagai gantinya.
Untuk mewajibkan kredensial rahasia bersama eksplisit, atur `gateway.auth.allowTailscale: false` dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

## Contoh konfigurasi

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

### Khusus tailnet (ikat ke IP Tailnet)

Gunakan ini saat Anda ingin Gateway mendengarkan langsung di IP Tailnet (tanpa Serve/Funnel).

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

<Note>
Loopback (`http://127.0.0.1:18789`) **tidak** akan berfungsi dalam mode ini.
</Note>

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

Utamakan `OPENCLAW_GATEWAY_PASSWORD` daripada melakukan commit kata sandi ke disk.

## Contoh CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Catatan

- Tailscale Serve/Funnel memerlukan CLI `tailscale` terinstal dan sudah masuk.
- `tailscale.mode: "funnel"` menolak untuk memulai kecuali mode auth adalah `password` untuk menghindari eksposur publik.
- Atur `gateway.tailscale.resetOnExit` jika Anda ingin OpenClaw membatalkan konfigurasi `tailscale serve` atau `tailscale funnel` saat shutdown.
- Atur `gateway.tailscale.preserveFunnel: true` untuk menjaga rute `tailscale funnel` yang dikonfigurasi secara eksternal tetap aktif di antara restart gateway. Saat diaktifkan dan gateway berjalan dalam `mode: "serve"`, OpenClaw memeriksa `tailscale funnel status` sebelum menerapkan ulang Serve dan melewatinya saat rute Funnel sudah mencakup port gateway. Kebijakan Funnel khusus kata sandi yang dikelola OpenClaw tidak berubah.
- `gateway.bind: "tailnet"` adalah pengikatan Tailnet langsung (tanpa HTTPS, tanpa Serve/Funnel).
- `gateway.bind: "auto"` mengutamakan loopback; gunakan `tailnet` jika Anda menginginkan khusus Tailnet.
- Serve/Funnel hanya mengekspos **UI kontrol Gateway + WS**. Node terhubung melalui endpoint WS Gateway yang sama, sehingga Serve dapat berfungsi untuk akses node.

## Kontrol browser (Gateway jarak jauh + browser lokal)

Jika Anda menjalankan Gateway di satu mesin tetapi ingin mengendalikan browser di mesin lain, jalankan **host node** di mesin browser dan pertahankan keduanya pada tailnet yang sama.
Gateway akan mem-proxy tindakan browser ke node; tidak diperlukan server kontrol terpisah atau URL Serve.

Hindari Funnel untuk kontrol browser; perlakukan pemasangan node seperti akses operator.

## Prasyarat + batasan Tailscale

- Serve memerlukan HTTPS diaktifkan untuk tailnet Anda; CLI akan meminta jika belum ada.
- Serve menyuntikkan header identitas Tailscale; Funnel tidak.
- Funnel memerlukan Tailscale v1.38.3+, MagicDNS, HTTPS diaktifkan, dan atribut node funnel.
- Funnel hanya mendukung port `443`, `8443`, dan `10000` melalui TLS.
- Funnel di macOS memerlukan varian aplikasi Tailscale sumber terbuka.

## Pelajari lebih lanjut

- Ikhtisar Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Perintah `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Ikhtisar Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Perintah `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Discovery](/id/gateway/discovery)
- [Authentication](/id/gateway/authentication)
