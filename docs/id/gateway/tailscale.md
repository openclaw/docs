---
read_when:
    - Mengekspos UI Kontrol Gateway di luar localhost
    - Mengotomatiskan akses tailnet atau dasbor publik
summary: Tailscale Serve/Funnel terintegrasi untuk dasbor Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:55:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw dapat mengonfigurasi otomatis Tailscale **Serve** (tailnet) atau **Funnel** (publik) untuk
dasbor Gateway dan port WebSocket. Ini menjaga Gateway tetap terikat ke loopback sementara
Tailscale menyediakan HTTPS, routing, dan (untuk Serve) header identitas.

## Mode

- `serve`: Serve khusus Tailnet melalui `tailscale serve`. Gateway tetap berada di `127.0.0.1`.
- `funnel`: HTTPS publik melalui `tailscale funnel`. OpenClaw memerlukan kata sandi bersama.
- `off`: Default (tanpa otomatisasi Tailscale).

Output status dan audit menggunakan **paparan Tailscale** untuk mode Serve/Funnel
OpenClaw ini. `off` berarti OpenClaw tidak mengelola Serve atau Funnel; ini tidak berarti
daemon Tailscale lokal dihentikan atau keluar dari akun.

## Auth

Atur `gateway.auth.mode` untuk mengontrol handshake:

- `none` (hanya ingress privat)
- `token` (default saat `OPENCLAW_GATEWAY_TOKEN` diatur)
- `password` (rahasia bersama melalui `OPENCLAW_GATEWAY_PASSWORD` atau konfigurasi)
- `trusted-proxy` (reverse proxy sadar identitas; lihat [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth))

Saat `tailscale.mode = "serve"` dan `gateway.auth.allowTailscale` adalah `true`,
auth UI Kontrol/WebSocket dapat menggunakan header identitas Tailscale
(`tailscale-user-login`) tanpa menyediakan token/kata sandi. OpenClaw memverifikasi
identitas dengan menyelesaikan alamat `x-forwarded-for` melalui daemon Tailscale
lokal (`tailscale whois`) dan mencocokkannya dengan header sebelum menerimanya.
OpenClaw hanya memperlakukan permintaan sebagai Serve saat permintaan datang dari loopback dengan
header `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host`
milik Tailscale.
Untuk sesi operator UI Kontrol yang menyertakan identitas perangkat browser, jalur
Serve yang terverifikasi ini juga melewati perjalanan bolak-balik pemasangan perangkat. Ini tidak melewati
identitas perangkat browser: klien tanpa perangkat tetap ditolak, dan koneksi WebSocket
node-role atau non-UI Kontrol tetap mengikuti pemeriksaan pairing dan
auth normal.
Endpoint API HTTP (misalnya `/v1/*`, `/tools/invoke`, dan `/api/channels/*`)
**tidak** menggunakan auth header identitas Tailscale. Endpoint tersebut tetap mengikuti mode auth HTTP
normal gateway: auth rahasia bersama secara default, atau pengaturan trusted-proxy / ingress privat `none`
yang dikonfigurasi secara sengaja.
Alur tanpa token ini mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya
mungkin berjalan di host yang sama, nonaktifkan `gateway.auth.allowTailscale` dan wajibkan
auth token/kata sandi sebagai gantinya.
Untuk mewajibkan kredensial rahasia bersama yang eksplisit, atur `gateway.auth.allowTailscale: false`
dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

## Contoh konfigurasi

### Khusus Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Buka: `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

### Khusus Tailnet (ikat ke IP Tailnet)

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

Utamakan `OPENCLAW_GATEWAY_PASSWORD` daripada menyimpan kata sandi ke disk.

## Contoh CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Catatan

- Tailscale Serve/Funnel memerlukan CLI `tailscale` terinstal dan sudah login.
- `tailscale.mode: "funnel"` menolak untuk dimulai kecuali mode auth adalah `password` untuk menghindari paparan publik.
- Atur `gateway.tailscale.resetOnExit` jika Anda ingin OpenClaw membatalkan konfigurasi `tailscale serve`
  atau `tailscale funnel` saat shutdown.
- `gateway.bind: "tailnet"` adalah bind Tailnet langsung (tanpa HTTPS, tanpa Serve/Funnel).
- `gateway.bind: "auto"` mengutamakan loopback; gunakan `tailnet` jika Anda ingin khusus Tailnet.
- Serve/Funnel hanya mengekspos **UI kontrol Gateway + WS**. Node terhubung melalui
  endpoint WS Gateway yang sama, sehingga Serve dapat berfungsi untuk akses node.

## Kontrol browser (Gateway jarak jauh + browser lokal)

Jika Anda menjalankan Gateway di satu mesin tetapi ingin mengendalikan browser di mesin lain,
jalankan **host node** di mesin browser dan pastikan keduanya berada di tailnet yang sama.
Gateway akan mem-proxy tindakan browser ke node; tidak diperlukan server kontrol terpisah atau URL Serve.

Hindari Funnel untuk kontrol browser; perlakukan pairing node seperti akses operator.

## Prasyarat + batas Tailscale

- Serve memerlukan HTTPS diaktifkan untuk tailnet Anda; CLI akan meminta jika belum ada.
- Serve menyuntikkan header identitas Tailscale; Funnel tidak.
- Funnel memerlukan Tailscale v1.38.3+, MagicDNS, HTTPS diaktifkan, dan atribut node funnel.
- Funnel hanya mendukung port `443`, `8443`, dan `10000` melalui TLS.
- Funnel di macOS memerlukan varian aplikasi Tailscale sumber terbuka.

## Pelajari selengkapnya

- Ikhtisar Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Perintah `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Ikhtisar Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Perintah `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Penemuan](/id/gateway/discovery)
- [Autentikasi](/id/gateway/authentication)
