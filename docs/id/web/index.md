---
read_when:
    - Anda ingin mengakses Gateway melalui Tailscale
    - Anda menginginkan UI Kontrol browser dan pengeditan konfigurasi
summary: 'Permukaan web Gateway: UI Kontrol, mode bind, dan keamanan'
title: Web
x-i18n:
    generated_at: "2026-04-24T09:34:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Gateway menyajikan **UI Kontrol** browser kecil (Vite + Lit) dari port yang sama dengan WebSocket Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Kapabilitas tersedia di [UI Kontrol](/id/web/control-ui).
Halaman ini berfokus pada mode bind, keamanan, dan permukaan yang menghadap web.

## Webhook

Saat `hooks.enabled=true`, Gateway juga mengekspos endpoint Webhook kecil pada server HTTP yang sama.
Lihat [Konfigurasi Gateway](/id/gateway/configuration) → `hooks` untuk auth + payload.

## Konfigurasi (aktif secara default)

UI Kontrol **aktif secara default** saat aset tersedia (`dist/control-ui`).
Anda dapat mengontrolnya melalui konfigurasi:

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

Lalu mulai gateway (contoh non-loopback ini menggunakan token auth
shared-secret):

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
- Bind non-loopback tetap **memerlukan** auth gateway. Dalam praktiknya itu berarti token/password auth atau reverse proxy sadar-identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Wizard membuat auth shared-secret secara default dan biasanya menghasilkan
  token gateway (bahkan pada loopback).
- Dalam mode shared-secret, UI mengirim `connect.params.auth.token` atau
  `connect.params.auth.password`.
- Dalam mode pembawa identitas seperti Tailscale Serve atau `trusted-proxy`, pemeriksaan auth
  WebSocket dipenuhi dari header permintaan sebagai gantinya.
- Untuk deployment UI Kontrol non-loopback, atur `gateway.controlUi.allowedOrigins`
  secara eksplisit (origin lengkap). Tanpanya, startup gateway ditolak secara default.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan
  mode fallback origin header Host, tetapi ini adalah penurunan keamanan yang berbahaya.
- Dengan Serve, header identitas Tailscale dapat memenuhi auth UI Kontrol/WebSocket
  saat `gateway.auth.allowTailscale` adalah `true` (tanpa token/password).
  Endpoint HTTP API tidak menggunakan header identitas Tailscale tersebut; endpoint itu mengikuti
  mode HTTP auth normal gateway sebagai gantinya. Atur
  `gateway.auth.allowTailscale: false` untuk mewajibkan kredensial eksplisit. Lihat
  [Tailscale](/id/gateway/tailscale) dan [Keamanan](/id/gateway/security). Alur tanpa
  token ini mengasumsikan host gateway tepercaya.
- `gateway.tailscale.mode: "funnel"` memerlukan `gateway.auth.mode: "password"` (password bersama).

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun file tersebut dengan:

```bash
pnpm ui:build
```
