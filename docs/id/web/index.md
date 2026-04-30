---
read_when:
    - Anda ingin mengakses Gateway melalui Tailscale
    - Anda menginginkan antarmuka kontrol peramban dan pengeditan konfigurasi
summary: 'Permukaan web Gateway: UI Kontrol, mode bind, dan keamanan'
title: Web
x-i18n:
    generated_at: "2026-04-30T10:19:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

Gateway menyajikan **Antarmuka Kontrol browser** kecil (Vite + Lit) dari port yang sama dengan WebSocket Gateway:

- default: `http://<host>:18789/`
- dengan `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefiks opsional: tetapkan `gateway.controlUi.basePath` (mis. `/openclaw`)

Kapabilitas tersedia di [Antarmuka Kontrol](/id/web/control-ui). Sisa halaman ini berfokus pada mode bind, keamanan, dan permukaan yang menghadap web.

## Webhook

Ketika `hooks.enabled=true`, Gateway juga mengekspos endpoint webhook kecil pada server HTTP yang sama.
Lihat [konfigurasi Gateway](/id/gateway/configuration) → `hooks` untuk auth + payload.

## Konfigurasi (aktif secara default)

Antarmuka Kontrol **diaktifkan secara default** ketika aset tersedia (`dist/control-ui`).
Anda dapat mengontrolnya melalui konfigurasi:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Akses Tailscale

### Serve Terintegrasi (direkomendasikan)

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

- `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

### Bind tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Lalu mulai gateway (contoh non-loopback ini menggunakan auth token rahasia bersama):

```bash
openclaw gateway
```

Buka:

- `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

### Internet publik (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Catatan keamanan

- Auth Gateway diwajibkan secara default (token, kata sandi, trusted-proxy, atau header identitas Tailscale Serve ketika diaktifkan).
- Bind non-loopback tetap **mewajibkan** auth gateway. Dalam praktiknya, ini berarti auth token/kata sandi atau reverse proxy sadar-identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Wizard membuat auth rahasia bersama secara default dan biasanya menghasilkan token gateway (bahkan pada loopback).
- Dalam mode rahasia bersama, UI mengirim `connect.params.auth.token` atau `connect.params.auth.password`.
- Ketika `gateway.tls.enabled: true`, helper dashboard lokal dan status merender URL dashboard `https://` dan URL WebSocket `wss://`.
- Dalam mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy`, pemeriksaan auth WebSocket dipenuhi dari header permintaan sebagai gantinya.
- Untuk deployment Antarmuka Kontrol non-loopback, tetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Tanpanya, startup gateway ditolak secara default.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback origin header Host, tetapi ini adalah penurunan keamanan yang berbahaya.
- Dengan Serve, header identitas Tailscale dapat memenuhi auth Antarmuka Kontrol/WebSocket ketika `gateway.auth.allowTailscale` adalah `true` (tidak perlu token/kata sandi). Endpoint API HTTP tidak menggunakan header identitas Tailscale tersebut; endpoint tersebut mengikuti mode auth HTTP normal gateway sebagai gantinya. Tetapkan `gateway.auth.allowTailscale: false` untuk mewajibkan kredensial eksplisit. Lihat [Tailscale](/id/gateway/tailscale) dan [Keamanan](/id/gateway/security). Alur tanpa token ini mengasumsikan host gateway tepercaya.
- `gateway.tailscale.mode: "funnel"` mewajibkan `gateway.auth.mode: "password"` (kata sandi bersama).

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun file tersebut dengan:

```bash
pnpm ui:build
```
