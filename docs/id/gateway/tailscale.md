---
read_when:
    - Mengekspos UI Kontrol Gateway di luar localhost
    - Mengotomatiskan akses tailnet atau dasbor publik
summary: Tailscale Serve/Funnel terintegrasi untuk dasbor Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T14:16:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw dapat mengonfigurasi otomatis Tailscale **Serve** (tailnet) atau **Funnel** (publik) untuk dasbor Gateway dan port WebSocket. Dengan demikian, gateway tetap terikat ke loopback sementara Tailscale menyediakan HTTPS, perutean, dan (untuk Serve) header identitas.

## Mode

`gateway.tailscale.mode`:

| Mode            | Perilaku                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------- |
| `serve`         | Serve khusus tailnet melalui `tailscale serve`. Gateway tetap berada di `127.0.0.1`.         |
| `funnel`        | HTTPS publik melalui `tailscale funnel`. Memerlukan kata sandi bersama.                      |
| `off` (bawaan)  | Tanpa otomatisasi Tailscale.                                                                 |

Keluaran status dan audit menggunakan **paparan Tailscale** untuk mode Serve/Funnel OpenClaw ini. `off` berarti OpenClaw tidak mengelola Serve atau Funnel; ini tidak berarti daemon Tailscale lokal dihentikan atau telah keluar.

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

Untuk mengekspos UI Kontrol melalui Tailscale Service bernama, bukan melalui nama host perangkat, atur `gateway.tailscale.serviceName` ke nama Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Saat dimulai, URL Service kemudian dilaporkan sebagai `https://openclaw.<tailnet-name>.ts.net/`, bukan nama host perangkat. Tailscale Services mengharuskan host menjadi node bertag yang disetujui di tailnet Anda — konfigurasikan tag dan setujui Service di Tailscale sebelum mengaktifkan ini; jika tidak, `tailscale serve --service=...` akan gagal saat gateway dimulai.

### Khusus tailnet (ikat ke IP Tailnet)

Gunakan ini agar gateway mendengarkan langsung di IP Tailnet, tanpa Serve/Funnel:

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
Jika tersedia IPv4 Tailnet yang dapat diikat, Gateway juga memerlukan `http://127.0.0.1:18789` untuk klien terautentikasi pada host yang sama. Jika alamat Tailnet tidak tersedia saat dimulai, Gateway akan beralih hanya ke loopback; mulai ulang setelah Tailscale tersedia untuk menambahkan akses Tailnet langsung. Kedua jalur tersebut tidak menambahkan paparan LAN atau publik.
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

## Autentikasi

`gateway.auth.mode` mengontrol proses jabat tangan:

| Mode                                                   | Kasus penggunaan                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `none`                                                 | Hanya akses masuk privat                                                              |
| `token` (bawaan saat `OPENCLAW_GATEWAY_TOKEN` diatur)  | Token bersama                                                                         |
| `password`                                             | Rahasia bersama melalui `OPENCLAW_GATEWAY_PASSWORD` atau konfigurasi                  |
| `trusted-proxy`                                        | Proksi terbalik berbasis identitas; lihat [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth) |

### Header identitas Tailscale (khusus Serve)

Saat `tailscale.mode: "serve"` dan `gateway.auth.allowTailscale` bernilai `true`, autentikasi UI Kontrol/WebSocket dapat menggunakan header identitas Tailscale (`tailscale-user-login`) sebagai pengganti token/kata sandi. OpenClaw memverifikasi header dengan mengurai alamat `x-forwarded-for` permintaan melalui daemon Tailscale lokal (`tailscale whois`) dan mencocokkannya dengan identitas masuk pada header sebelum menerimanya. Permintaan hanya memenuhi syarat untuk jalur ini jika berasal dari loopback dengan membawa header `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host` milik Tailscale.

Alur tanpa token ini mengasumsikan bahwa host gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan pada host yang sama, atur `gateway.auth.allowTailscale: false` dan wajibkan autentikasi token/kata sandi sebagai gantinya.

Cakupan pengabaian:

- Hanya berlaku pada permukaan autentikasi WebSocket UI Kontrol. Titik akhir API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*`, dan sebagainya) tidak pernah menggunakan autentikasi header identitas Tailscale; semuanya selalu mengikuti mode autentikasi HTTP normal gateway.
- Untuk sesi operator UI Kontrol yang sudah membawa identitas perangkat peramban, identitas Tailscale yang terverifikasi melewati proses bolak-balik pemasangan token bootstrap/kode QR.
- Ini tidak mengabaikan identitas perangkat itu sendiri: klien tanpa perangkat tetap ditolak, dan koneksi peran node tetap melalui pemeriksaan pemasangan dan autentikasi normal.

## Catatan

- Tailscale Serve/Funnel memerlukan CLI `tailscale` yang telah terpasang dan sudah masuk.
- `tailscale.mode: "funnel"` menolak dimulai kecuali mode autentikasinya adalah `password`, untuk menghindari paparan publik.
- `gateway.tailscale.serviceName` hanya berlaku untuk mode Serve dan diteruskan ke `tailscale serve --service=<name>`. Nilainya harus menggunakan format `svc:<dns-label>` milik Tailscale, misalnya `svc:openclaw`. Tailscale mengharuskan host Service berupa node bertag, dan Service mungkin memerlukan persetujuan konsol admin sebelum Serve dapat memublikasikannya.
- `gateway.tailscale.resetOnExit` membatalkan konfigurasi `tailscale serve`/`tailscale funnel` saat dimatikan.
- `gateway.tailscale.preserveFunnel: true` mempertahankan rute `tailscale funnel` yang dikonfigurasi secara eksternal agar tetap aktif saat gateway dimulai ulang. Dengan `mode: "serve"`, OpenClaw memeriksa `tailscale funnel status` sebelum menerapkan ulang Serve dan melewatinya jika rute Funnel sudah mencakup port gateway. Kebijakan Funnel yang dikelola OpenClaw dan hanya menggunakan kata sandi tidak berubah.
- `gateway.bind: "tailnet"` menggunakan pengikatan Tailnet langsung (tanpa HTTPS, tanpa Serve/Funnel) serta `127.0.0.1` lokal yang diwajibkan saat IPv4 Tailnet tersedia; jika tidak, mode ini beralih hanya ke loopback.
- `gateway.bind: "auto"` mengutamakan loopback; gunakan `tailnet` untuk membatasi paparan jaringan ke Tailnet sambil mempertahankan akses loopback pada host yang sama.
- Serve/Funnel hanya mengekspos **UI kontrol Gateway + WS**. Node terhubung melalui titik akhir WS Gateway yang sama, sehingga Serve juga berfungsi untuk akses node.

### Prasyarat dan batasan Tailscale

- Serve memerlukan HTTPS yang diaktifkan untuk tailnet Anda; CLI akan meminta Anda mengaktifkannya jika belum tersedia.
- Serve menyisipkan header identitas Tailscale; Funnel tidak.
- Funnel memerlukan Tailscale v1.38.3+, MagicDNS, HTTPS yang diaktifkan, dan atribut node funnel.
- Funnel hanya mendukung port `443`, `8443`, dan `10000` melalui TLS.
- Funnel di macOS memerlukan varian aplikasi Tailscale sumber terbuka.

## Kontrol peramban (Gateway jarak jauh + peramban lokal)

Untuk menjalankan Gateway pada satu mesin tetapi mengendalikan peramban pada mesin lain, jalankan **host node** pada mesin peramban dan pertahankan keduanya di tailnet yang sama. Gateway memproksikan tindakan peramban ke node; tidak diperlukan server kontrol atau URL Serve terpisah.

Hindari Funnel untuk kontrol peramban; perlakukan pemasangan node seperti akses operator.

## Pelajari lebih lanjut

- Ikhtisar Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Perintah `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Ikhtisar Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Perintah `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Penemuan](/id/gateway/discovery)
- [Autentikasi](/id/gateway/authentication)
