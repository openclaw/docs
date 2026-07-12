---
read_when:
    - Anda ingin mengakses Gateway melalui Tailscale
    - Anda menginginkan antarmuka kontrol browser dan pengeditan konfigurasi
summary: 'Antarmuka web Gateway: UI Kontrol, mode pengikatan, dan keamanan'
title: Web
x-i18n:
    generated_at: "2026-07-12T14:48:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway menyajikan **UI Kontrol peramban** kecil (Vite + Lit) dari port yang sama dengan WebSocket Gateway:

- bawaan: `http://<host>:18789/`
- dengan `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (misalnya `/openclaw`)

Kapabilitas dijelaskan di [UI Kontrol](/id/web/control-ui). Halaman ini membahas mode pengikatan, keamanan, dan permukaan lain yang dapat diakses melalui web.

## Konfigurasi (aktif secara bawaan)

UI Kontrol **diaktifkan secara bawaan** saat aset tersedia (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opsional
  },
}
```

## Webhook

Saat `hooks.enabled=true`, Gateway juga mengekspos titik akhir webhook pada server HTTP yang sama. Lihat `hooks` di [referensi konfigurasi Gateway](/id/gateway/configuration-reference#hooks) untuk autentikasi dan muatan.

## RPC HTTP admin

`POST /api/v1/admin/rpc` mengekspos metode bidang kontrol Gateway tertentu melalui HTTP. Dinonaktifkan secara bawaan; hanya didaftarkan saat plugin `admin-http-rpc` diaktifkan. Lihat [RPC HTTP Admin](/id/plugins/admin-http-rpc) untuk model autentikasi, metode yang diizinkan, dan perbandingannya dengan API WebSocket.

## Akses Tailscale

<Tabs>
  <Tab title="Serve Terintegrasi (disarankan)">
    Pertahankan Gateway pada local loopback dan biarkan Tailscale Serve memproksikannya:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Mulai Gateway:

    ```bash
    openclaw gateway
    ```

    Buka `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang telah Anda konfigurasikan).

  </Tab>
  <Tab title="Pengikatan tailnet + token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Mulai Gateway (contoh non-loopback ini menggunakan autentikasi token rahasia bersama):

    ```bash
    openclaw gateway
    ```

    Buka `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang telah Anda konfigurasikan).

  </Tab>
  <Tab title="Internet publik (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // atau OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` memerlukan `gateway.auth.mode: "password"`; Serve dan Funnel sama-sama memerlukan `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Catatan keamanan

- Autentikasi Gateway diwajibkan secara bawaan: token, kata sandi, proksi tepercaya, atau header identitas Tailscale Serve saat diaktifkan.
- Pengikatan non-loopback tetap **memerlukan** autentikasi Gateway: autentikasi token/kata sandi atau proksi balik sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Wisaya orientasi awal membuat autentikasi rahasia bersama secara bawaan dan biasanya menghasilkan token Gateway, bahkan pada local loopback.
- Dalam mode rahasia bersama, UI mengirimkan `connect.params.auth.token` atau `connect.params.auth.password` selama jabat tangan WebSocket.
- Dengan `gateway.tls.enabled: true`, pembantu dasbor/status lokal merender URL `https://` dan URL WebSocket `wss://`.
- Dalam mode yang membawa identitas (Tailscale Serve, `trusted-proxy`), pemeriksaan autentikasi WebSocket dipenuhi dari header permintaan, bukan dari rahasia bersama.
- Untuk penerapan UI Kontrol non-loopback publik, atur `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Pemuatan privat dengan origin yang sama diterima tanpa pengaturan tersebut untuk local loopback, RFC1918/link-local, `.local`, `.ts.net`, dan host CGNAT Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` mengaktifkan fallback origin header Host; ini merupakan penurunan tingkat keamanan yang berbahaya.
- Dengan Serve, header identitas Tailscale memenuhi autentikasi UI Kontrol/WebSocket saat `gateway.auth.allowTailscale: true` (token/kata sandi tidak diperlukan). Titik akhir API HTTP tidak menggunakan header identitas Tailscale; titik akhir tersebut selalu mengikuti mode autentikasi HTTP normal Gateway. Atur `gateway.auth.allowTailscale: false` untuk mewajibkan kredensial eksplisit bahkan melalui Serve. Alur tanpa token ini mengasumsikan host Gateway itu sendiri tepercaya. Lihat [Tailscale](/id/gateway/tailscale) dan [Keamanan](/id/gateway/security).

## Membangun UI

Gateway menyajikan berkas statis dari `dist/control-ui`:

```bash
pnpm ui:build
```
