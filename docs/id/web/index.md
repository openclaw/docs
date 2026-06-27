---
read_when:
    - Anda ingin mengakses Gateway melalui Tailscale
    - Anda menginginkan Control UI peramban dan penyuntingan konfigurasi
summary: 'Gateway permukaan web: Control UI, mode bind, dan keamanan'
title: Web
x-i18n:
    generated_at: "2026-06-27T18:23:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway menyajikan **UI Kontrol browser** kecil (Vite + Lit) dari port yang sama dengan WebSocket Gateway:

- default: `http://<host>:18789/`
- dengan `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Kapabilitas tersedia di [UI Kontrol](/id/web/control-ui). Sisa halaman ini berfokus pada mode bind, keamanan, dan permukaan yang menghadap web.

## Webhook

Saat `hooks.enabled=true`, Gateway juga mengekspos endpoint webhook kecil di server HTTP yang sama.
Lihat [Konfigurasi Gateway](/id/gateway/configuration) → `hooks` untuk autentikasi + payload.

## RPC HTTP Admin

RPC HTTP Admin mengekspos metode control-plane Gateway tertentu di `POST /api/v1/admin/rpc`.
Ini nonaktif secara default dan hanya didaftarkan saat plugin `admin-http-rpc` diaktifkan.
Lihat [RPC HTTP Admin](/id/plugins/admin-http-rpc) untuk model autentikasi, metode yang diizinkan, dan perbandingan WebSocket.

## Konfigurasi (aktif secara default)

UI Kontrol **diaktifkan secara default** saat aset tersedia (`dist/control-ui`).
Anda dapat mengendalikannya melalui konfigurasi:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opsional
  },
}
```

## Akses Tailscale

### Serve Terintegrasi (disarankan)

Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Lalu mulai gateway:

```bash
openclaw gateway
```

Buka:

- `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

### Bind Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Lalu mulai gateway (contoh non-loopback ini menggunakan autentikasi token rahasia bersama):

```bash
openclaw gateway
```

Buka:

- `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

### Internet publik (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // atau OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Catatan keamanan

- Autentikasi Gateway diwajibkan secara default (token, kata sandi, trusted-proxy, atau header identitas Tailscale Serve saat diaktifkan).
- Bind non-loopback tetap **memerlukan** autentikasi gateway. Dalam praktiknya, ini berarti autentikasi token/kata sandi atau reverse proxy sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Wizard membuat autentikasi rahasia bersama secara default dan biasanya menghasilkan token gateway (bahkan pada loopback).
- Dalam mode rahasia bersama, UI mengirim `connect.params.auth.token` atau `connect.params.auth.password`.
- Saat `gateway.tls.enabled: true`, helper dashboard dan status lokal merender URL dashboard `https://` dan URL WebSocket `wss://`.
- Dalam mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy`, pemeriksaan autentikasi WebSocket dipenuhi dari header permintaan sebagai gantinya.
- Untuk deployment UI Kontrol non-loopback publik, tetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Pemuatan LAN/Tailnet private same-origin diterima untuk loopback, RFC1918/link-local, `.local`, `.ts.net`, dan host CGNAT Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback origin header Host, tetapi merupakan penurunan keamanan yang berbahaya.
- Dengan Serve, header identitas Tailscale dapat memenuhi autentikasi UI Kontrol/WebSocket saat `gateway.auth.allowTailscale` bernilai `true` (tidak memerlukan token/kata sandi). Endpoint API HTTP tidak menggunakan header identitas Tailscale tersebut; endpoint tersebut mengikuti mode autentikasi HTTP normal gateway sebagai gantinya. Tetapkan `gateway.auth.allowTailscale: false` untuk memerlukan kredensial eksplisit. Lihat [Tailscale](/id/gateway/tailscale) dan [Keamanan](/id/gateway/security). Alur tanpa token ini mengasumsikan host gateway tepercaya.
- `gateway.tailscale.mode: "funnel"` memerlukan `gateway.auth.mode: "password"` (kata sandi bersama).

## Membangun UI

Gateway menyajikan berkas statis dari `dist/control-ui`. Bangun berkas tersebut dengan:

```bash
pnpm ui:build
```
