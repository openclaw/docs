---
read_when:
    - Mengekspos UI Kontrol Gateway di luar localhost
    - Mengotomatiskan akses tailnet atau dasbor publik
summary: Tailscale Serve/Funnel terintegrasi untuk dasbor Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T09:52:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw dapat mengonfigurasi otomatis Tailscale **Serve** (tailnet) atau **Funnel** (publik) untuk dasbor Gateway dan port WebSocket. Ini menjaga Gateway tetap terikat ke loopback sementara Tailscale menyediakan HTTPS, perutean, dan (untuk Serve) header identitas.

## Mode

- `serve`: Serve khusus tailnet melalui `tailscale serve`. Gateway tetap berada di `127.0.0.1`.
- `funnel`: HTTPS publik melalui `tailscale funnel`. OpenClaw memerlukan kata sandi bersama.
- `off`: Default (tanpa otomatisasi Tailscale).

Keluaran status dan audit menggunakan **paparan Tailscale** untuk mode Serve/Funnel OpenClaw ini. `off` berarti OpenClaw tidak mengelola Serve atau Funnel; ini tidak berarti daemon Tailscale lokal dihentikan atau keluar dari akun.

## Autentikasi

Atur `gateway.auth.mode` untuk mengontrol handshake:

- `none` (hanya ingress privat)
- `token` (default ketika `OPENCLAW_GATEWAY_TOKEN` diatur)
- `password` (rahasia bersama melalui `OPENCLAW_GATEWAY_PASSWORD` atau konfigurasi)
- `trusted-proxy` (proxy balik sadar identitas; lihat [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth))

Ketika `tailscale.mode = "serve"` dan `gateway.auth.allowTailscale` bernilai `true`, autentikasi Control UI/WebSocket dapat menggunakan header identitas Tailscale (`tailscale-user-login`) tanpa menyediakan token/kata sandi. OpenClaw memverifikasi identitas dengan menyelesaikan alamat `x-forwarded-for` melalui daemon Tailscale lokal (`tailscale whois`) dan mencocokkannya dengan header sebelum menerimanya. OpenClaw hanya memperlakukan permintaan sebagai Serve ketika permintaan datang dari loopback dengan header Tailscale `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host`.
Untuk sesi operator Control UI yang menyertakan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati perjalanan bolak-balik pemasangan perangkat. Ini tidak melewati identitas perangkat browser: klien tanpa perangkat tetap ditolak, dan koneksi WebSocket peran node atau non-Control UI tetap mengikuti pemeriksaan pemasangan dan autentikasi normal.
Endpoint API HTTP (misalnya `/v1/*`, `/tools/invoke`, dan `/api/channels/*`) **tidak** menggunakan autentikasi header identitas Tailscale. Endpoint tersebut tetap mengikuti mode autentikasi HTTP normal Gateway: autentikasi rahasia bersama secara default, atau konfigurasi `trusted-proxy` / ingress privat `none` yang sengaja diatur.
Alur tanpa token ini mengasumsikan host Gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan pada host yang sama, nonaktifkan `gateway.auth.allowTailscale` dan wajibkan autentikasi token/kata sandi sebagai gantinya.
Untuk mewajibkan kredensial rahasia bersama yang eksplisit, atur `gateway.auth.allowTailscale: false` dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

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

Gunakan ini ketika Anda ingin Gateway mendengarkan langsung pada IP Tailnet (tanpa Serve/Funnel).

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

Lebih baik gunakan `OPENCLAW_GATEWAY_PASSWORD` daripada melakukan commit kata sandi ke disk.

## Contoh CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Catatan

- Tailscale Serve/Funnel memerlukan CLI `tailscale` yang sudah terpasang dan sudah masuk.
- `tailscale.mode: "funnel"` menolak untuk mulai kecuali mode autentikasi adalah `password` untuk menghindari paparan publik.
- Atur `gateway.tailscale.resetOnExit` jika Anda ingin OpenClaw membatalkan konfigurasi `tailscale serve` atau `tailscale funnel` saat dimatikan.
- `gateway.bind: "tailnet"` adalah pengikatan Tailnet langsung (tanpa HTTPS, tanpa Serve/Funnel).
- `gateway.bind: "auto"` mengutamakan loopback; gunakan `tailnet` jika Anda menginginkan hanya Tailnet.
- Serve/Funnel hanya mengekspos **UI kontrol Gateway + WS**. Node terhubung melalui endpoint WS Gateway yang sama, sehingga Serve dapat berfungsi untuk akses node.

## Kontrol browser (Gateway jarak jauh + browser lokal)

Jika Anda menjalankan Gateway pada satu mesin tetapi ingin mengendalikan browser pada mesin lain, jalankan **host node** pada mesin browser dan pertahankan keduanya pada tailnet yang sama.
Gateway akan mem-proxy tindakan browser ke node; tidak perlu server kontrol terpisah atau URL Serve.

Hindari Funnel untuk kontrol browser; perlakukan pemasangan node seperti akses operator.

## Prasyarat + batasan Tailscale

- Serve memerlukan HTTPS yang diaktifkan untuk tailnet Anda; CLI akan meminta jika belum ada.
- Serve menyuntikkan header identitas Tailscale; Funnel tidak.
- Funnel memerlukan Tailscale v1.38.3+, MagicDNS, HTTPS yang diaktifkan, dan atribut node funnel.
- Funnel hanya mendukung port `443`, `8443`, dan `10000` melalui TLS.
- Funnel pada macOS memerlukan varian aplikasi Tailscale sumber terbuka.

## Pelajari lebih lanjut

- Ikhtisar Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Perintah `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Ikhtisar Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Perintah `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Penemuan](/id/gateway/discovery)
- [Autentikasi](/id/gateway/authentication)
