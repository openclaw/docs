---
read_when:
    - Anda ingin mengakses Gateway melalui Tailscale
    - Anda ingin menggunakan UI Kontrol browser dan pengeditan config
summary: 'Permukaan web Gateway: UI Kontrol, mode bind, dan keamanan'
title: Web
x-i18n:
    generated_at: "2026-04-05T14:10:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f5643283f7d37235d3d8104897f38db27ac5a9fdef6165156fb542d0e7048c
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Gateway menyajikan **UI Kontrol browser** kecil (Vite + Lit) dari port yang sama dengan WebSocket Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: setel `gateway.controlUi.basePath` (misalnya `/openclaw`)

Kemampuan tersedia di [UI Kontrol](/web/control-ui).
Halaman ini berfokus pada mode bind, keamanan, dan permukaan yang menghadap web.

## Webhook

Saat `hooks.enabled=true`, Gateway juga mengekspos endpoint webhook kecil pada server HTTP yang sama.
Lihat [Konfigurasi Gateway](/id/gateway/configuration) → `hooks` untuk auth + payload.

## Config (aktif secara default)

UI Kontrol **aktif secara default** saat aset tersedia (`dist/control-ui`).
Anda dapat mengendalikannya melalui config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opsional
  },
}
```

## Akses Tailscale

### Serve terintegrasi (direkomendasikan)

Pertahankan Gateway di loopback dan biarkan Tailscale Serve mem-proxy-nya:

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

Lalu mulai gateway (contoh non-loopback ini menggunakan auth token
rahasia bersama):

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

- Auth Gateway diwajibkan secara default (token, password, trusted-proxy, atau header identitas Tailscale Serve saat diaktifkan).
- Bind non-loopback tetap **memerlukan** auth gateway. Dalam praktiknya itu berarti auth token/password atau reverse proxy sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Wizard membuat auth rahasia bersama secara default dan biasanya menghasilkan
  token gateway (bahkan pada loopback).
- Dalam mode rahasia bersama, UI mengirim `connect.params.auth.token` atau
  `connect.params.auth.password`.
- Dalam mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy`, pemeriksaan
  auth WebSocket dipenuhi dari header permintaan sebagai gantinya.
- Untuk deployment UI Kontrol non-loopback, setel `gateway.controlUi.allowedOrigins`
  secara eksplisit (origin penuh). Tanpanya, startup gateway akan ditolak secara default.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan
  mode fallback origin header Host, tetapi ini adalah penurunan keamanan yang berbahaya.
- Dengan Serve, header identitas Tailscale dapat memenuhi auth UI Kontrol/WebSocket
  saat `gateway.auth.allowTailscale` adalah `true` (tidak memerlukan token/password).
  Endpoint HTTP API tidak menggunakan header identitas Tailscale tersebut; mereka mengikuti
  mode auth HTTP normal gateway. Setel
  `gateway.auth.allowTailscale: false` untuk mewajibkan kredensial eksplisit. Lihat
  [Tailscale](/id/gateway/tailscale) dan [Security](/id/gateway/security). Alur tanpa
  token ini mengasumsikan host gateway tepercaya.
- `gateway.tailscale.mode: "funnel"` memerlukan `gateway.auth.mode: "password"` (password bersama).

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun file tersebut dengan:

```bash
pnpm ui:build # otomatis menginstal dependensi UI pada eksekusi pertama
```
