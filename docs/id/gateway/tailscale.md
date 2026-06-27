---
read_when:
    - Mengekspos UI Kontrol Gateway di luar localhost
    - Mengotomatiskan akses tailnet atau dasbor publik
summary: Tailscale Serve/Funnel terintegrasi untuk dashboard Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:34:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw dapat mengonfigurasi otomatis Tailscale **Serve** (tailnet) atau **Funnel** (publik) untuk
dasbor Gateway dan port WebSocket. Ini menjaga Gateway tetap terikat ke loopback sementara
Tailscale menyediakan HTTPS, perutean, dan (untuk Serve) header identitas.

## Mode

- `serve`: Serve khusus tailnet melalui `tailscale serve`. Gateway tetap berada di `127.0.0.1`.
- `funnel`: HTTPS publik melalui `tailscale funnel`. OpenClaw memerlukan kata sandi bersama.
- `off`: Default (tanpa otomatisasi Tailscale).

Output status dan audit menggunakan **paparan Tailscale** untuk mode Serve/Funnel
OpenClaw ini. `off` berarti OpenClaw tidak mengelola Serve atau Funnel; ini tidak berarti
daemon Tailscale lokal dihentikan atau keluar dari sesi login.

## Autentikasi

Atur `gateway.auth.mode` untuk mengontrol handshake:

- `none` (hanya ingress privat)
- `token` (default saat `OPENCLAW_GATEWAY_TOKEN` diatur)
- `password` (rahasia bersama melalui `OPENCLAW_GATEWAY_PASSWORD` atau konfigurasi)
- `trusted-proxy` (reverse proxy sadar identitas; lihat [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth))

Saat `tailscale.mode = "serve"` dan `gateway.auth.allowTailscale` adalah `true`,
autentikasi Control UI/WebSocket dapat menggunakan header identitas Tailscale
(`tailscale-user-login`) tanpa menyediakan token/kata sandi. OpenClaw memverifikasi
identitas dengan me-resolve alamat `x-forwarded-for` melalui daemon Tailscale lokal
(`tailscale whois`) dan mencocokkannya dengan header sebelum menerimanya.
OpenClaw hanya memperlakukan permintaan sebagai Serve saat permintaan datang dari loopback dengan
header `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host` milik
Tailscale.
Untuk sesi operator Control UI yang menyertakan identitas perangkat browser, jalur
Serve terverifikasi ini juga melewati perjalanan bolak-balik pairing perangkat. Ini tidak melewati
identitas perangkat browser: klien tanpa perangkat tetap ditolak, dan koneksi WebSocket
node-role atau non-Control UI tetap mengikuti pemeriksaan pairing dan autentikasi
normal.
Endpoint HTTP API (misalnya `/v1/*`, `/tools/invoke`, dan `/api/channels/*`)
**tidak** menggunakan autentikasi header identitas Tailscale. Endpoint tersebut tetap mengikuti mode
autentikasi HTTP normal Gateway: autentikasi rahasia bersama secara default, atau pengaturan
trusted-proxy / ingress privat `none` yang dikonfigurasi secara sengaja.
Alur tanpa token ini mengasumsikan host Gateway tepercaya. Jika kode lokal yang tidak tepercaya
dapat berjalan di host yang sama, nonaktifkan `gateway.auth.allowTailscale` dan wajibkan
autentikasi token/kata sandi sebagai gantinya.
Untuk mewajibkan kredensial rahasia bersama yang eksplisit, atur `gateway.auth.allowTailscale: false`
dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

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

Untuk mengekspos Control UI melalui Tailscale Service bernama alih-alih
hostname perangkat, atur `gateway.tailscale.serviceName` ke nama Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Dengan contoh di atas, startup melaporkan URL Service sebagai
`https://openclaw.<tailnet-name>.ts.net/` alih-alih hostname perangkat.
Tailscale Services mengharuskan host menjadi node bertag yang disetujui di
tailnet Anda. Konfigurasikan tag dan setujui Service di Tailscale sebelum mengaktifkan
opsi ini; jika tidak, `tailscale serve --service=...` akan gagal saat startup
Gateway.

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

Utamakan `OPENCLAW_GATEWAY_PASSWORD` daripada meng-commit kata sandi ke disk.

## Contoh CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Catatan

- Tailscale Serve/Funnel memerlukan CLI `tailscale` terinstal dan sudah login.
- `tailscale.mode: "funnel"` menolak untuk memulai kecuali mode autentikasi adalah `password` untuk menghindari paparan publik.
- `gateway.tailscale.serviceName` hanya berlaku untuk mode Serve dan diteruskan ke
  `tailscale serve --service=<name>`. Nilainya harus menggunakan format nama Service
  `svc:<dns-label>` milik Tailscale, misalnya `svc:openclaw`.
  Tailscale mengharuskan host Service berupa node bertag, dan Service mungkin perlu
  persetujuan di konsol admin sebelum Serve dapat menerbitkannya.
- Atur `gateway.tailscale.resetOnExit` jika Anda ingin OpenClaw membatalkan konfigurasi
  `tailscale serve` atau `tailscale funnel` saat shutdown.
- Atur `gateway.tailscale.preserveFunnel: true` untuk menjaga rute
  `tailscale funnel` yang dikonfigurasi secara eksternal tetap aktif di antara restart Gateway. Saat diaktifkan dan
  Gateway berjalan dalam `mode: "serve"`, OpenClaw memeriksa `tailscale funnel status`
  sebelum menerapkan ulang Serve dan melewatinya saat rute Funnel sudah mencakup
  port Gateway. Kebijakan Funnel khusus kata sandi yang dikelola OpenClaw tidak berubah.
- `gateway.bind: "tailnet"` adalah bind Tailnet langsung (tanpa HTTPS, tanpa Serve/Funnel).
- `gateway.bind: "auto"` mengutamakan loopback; gunakan `tailnet` jika Anda menginginkan khusus Tailnet.
- Serve/Funnel hanya mengekspos **Control UI + WS Gateway**. Node terhubung melalui
  endpoint WS Gateway yang sama, sehingga Serve dapat berfungsi untuk akses node.

## Kontrol browser (Gateway jarak jauh + browser lokal)

Jika Anda menjalankan Gateway di satu mesin tetapi ingin mengendalikan browser di mesin lain,
jalankan **host node** di mesin browser dan pertahankan keduanya dalam tailnet yang sama.
Gateway akan mem-proxy tindakan browser ke node; tidak diperlukan server kontrol atau URL Serve terpisah.

Hindari Funnel untuk kontrol browser; perlakukan pairing node seperti akses operator.

## Prasyarat + batas Tailscale

- Serve memerlukan HTTPS yang diaktifkan untuk tailnet Anda; CLI akan meminta jika belum tersedia.
- Serve menyuntikkan header identitas Tailscale; Funnel tidak.
- Funnel memerlukan Tailscale v1.38.3+, MagicDNS, HTTPS yang diaktifkan, dan atribut node funnel.
- Funnel hanya mendukung port `443`, `8443`, dan `10000` melalui TLS.
- Funnel di macOS memerlukan varian aplikasi Tailscale open-source.

## Pelajari lebih lanjut

- Ikhtisar Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Perintah `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Ikhtisar Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Perintah `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Discovery](/id/gateway/discovery)
- [Autentikasi](/id/gateway/authentication)
